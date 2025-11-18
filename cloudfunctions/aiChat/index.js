const cloud = require('wx-server-sdk');
const axios = require('axios');
cloud.init({ env: 'cloud1-2gfqlz9d8ee804d7' });

// 环境变量（在云开发控制台配置，避免泄露）
const BASE_URL = process.env.AI_BASE_URL || process.env.DOUBAO_BASE_URL || process.env.ARK_BASE_URL || '';
const API_KEY = process.env.AI_API_KEY || process.env.DOUBAO_API_KEY || process.env.ARK_API_KEY || '';
const DEFAULT_MODEL = process.env.AI_MODEL || process.env.DOUBAO_MODEL || process.env.ARK_MODEL || 'doubao-pro';

exports.main = async (event, context) => {
  const { prompt = '', history = [], messages: incomingMessages, model: modelFromClient } = event || {};

  // 如果上游直接传入 messages（可多模态），优先使用；否则由 prompt/history 归一化
  const messagesRaw = Array.isArray(incomingMessages) && incomingMessages.length
    ? incomingMessages
    : normalizeMessages(prompt, history);

  // 统一清洗：确保首条为 user，去掉首段非 user 历史，限制长度
  const messages = sanitizeMessages(messagesRaw);

  // 允许前端指定模型名（例如你在豆包控制台创建的专属模型 ep-xxxx），若未提供则使用环境变量默认值
  const model = (modelFromClient && String(modelFromClient).trim()) || DEFAULT_MODEL;

  const useArkV3 = isArkV3(model);
  console.info('[aiChat] invoke', { style: useArkV3 ? 'arkv3' : 'openai-v1', hasBaseUrl: !!BASE_URL, hasKey: !!API_KEY, model });

  // 先尝试调用豆包接口
  try {
    if (!API_KEY) {
      console.warn('[aiChat] missing API key');
    } else {
      const resp = await callDoubao(messages, useArkV3, model);
      const answer = extractAnswer(resp);
      if (answer) return { ok: true, answer, provider: useArkV3 ? 'doubao-arkv3' : 'doubao', model };
      // 接口成功但未解析到内容
      return { ok: false, answer: '', provider: useArkV3 ? 'doubao-arkv3' : 'doubao', model, meta: { reason: 'empty_answer', raw: !!resp } };
    }
  } catch (e) {
    // 记录少量信息便于排查（切勿输出密钥）
    console.error('aiChat call error:', e && e.response ? e.response.data : String(e));
  }

  // 回退：规则化回答
  const fallback = ruleBasedAnswer(prompt || getFirstUserText(messages));
  const reason = API_KEY ? 'call_failed' : 'missing_api_key';
  return { ok: true, answer: fallback, provider: 'fallback', model, meta: { reason } };
};

function normalizeMessages(prompt, history = []){
  const msgs = Array.isArray(history) ? history.slice(-10) : [];
  const mapped = msgs.map(m => ({
    role: m.role === 'user' || m.from === 'user' ? 'user' : 'assistant',
    content: String(m.content || '')
  }));
  mapped.push({ role: 'user', content: String(prompt || '') });
  return mapped;
}

function sanitizeMessages(msgs = []){
  const arr = Array.isArray(msgs) ? msgs.slice(-20) : [];
  // 找到第一条 user 的位置，去掉之前的 assistant/system
  let firstUser = arr.findIndex(m => m && m.role === 'user');
  if (firstUser < 0) firstUser = 0; // 如果没有 user，就从头开始（交给后端容错）
  const trimmed = arr.slice(firstUser);
  // 统一 content：允许 string 或多模态数组；其余转字符串
  return trimmed.map(m => {
    const role = m && (m.role === 'assistant' || m.role === 'user') ? m.role : 'user';
    const content = (m && (typeof m.content === 'string' || Array.isArray(m.content))) ? m.content : String(m && m.content || '');
    return { role, content };
  });
}

function isArkV3(model){
  // 只要 BASE_URL 中包含 /api/v3 或者设置了 API_STYLE = arkv3，或模型名为 ep- 前缀，就走 Ark v3 路径
  const styleEnv = (
    process.env.AI_API_STYLE ||
    process.env.DOUBAO_API_STYLE ||
    process.env.ARK_API_STYLE ||
    process.env.ARK_STYLE ||
    ''
  ).toLowerCase();
  if (/^ep-/.test(String(model || DEFAULT_MODEL))) return true;
  return /\/api\/v3(\b|\/)/.test(BASE_URL) || styleEnv === 'arkv3';
}

function buildEndpoint(base, useArkV3){
  if (!base) {
    // 若未显式配置 Base URL，提供 Doubao Ark 默认域名，避免相对路径导致请求失败
    return useArkV3
      ? 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
      : 'https://ark.cn-beijing.volces.com/v1/chat/completions';
  }
  const trimmed = base.replace(/\/$/, '');
  // 如果用户已传完整的 chat/completions 端点，直接用
  if (/chat\/completions$/.test(trimmed)) return trimmed;
  if (useArkV3){
    // 期望形如 https://.../api/v3 + /chat/completions
    if (/\/api\/v3$/.test(trimmed)) return trimmed + '/chat/completions';
    if (/\/api\/v3\//.test(trimmed)) return trimmed.replace(/\/$/, '') + 'chat/completions';
    // 用户可能给的是根域名，则补齐 /api/v3/chat/completions
    return joinUrl(trimmed, '/api/v3/chat/completions');
  }
  // OpenAI 兼容：优先补 /v1/chat/completions
  if (/\/v1$/.test(trimmed)) return trimmed + '/chat/completions';
  return joinUrl(trimmed, '/v1/chat/completions');
}

async function callDoubao(messages, useArkV3, model){
  const url = buildEndpoint(BASE_URL, useArkV3);
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  };
  // 对于 v3 与 v1，统一 body 字段；messages 既支持 string，也支持多模态 content 数组
  const body = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 512,
    stream: false
  };
  const res = await axios.post(url, body, { headers, timeout: 20000 });
  return res && res.data;
}

function extractAnswer(data){
  // 兼容 OpenAI/Ark v3：choices[0].message.content 可能是 string 或 数组
  if (data && Array.isArray(data.choices) && data.choices[0] && data.choices[0].message) {
    const c = data.choices[0].message.content;
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) {
      // 仅拼接文本片段，忽略图片片段
      const texts = c
        .filter(p => p && p.type === 'text' && typeof p.text === 'string')
        .map(p => p.text.trim())
        .filter(Boolean);
      if (texts.length) return texts.join('\n');
    }
  }
  // 一些平台返回 data.output.text 或 data.output_text
  if (data && data.output && typeof data.output.text === 'string') return data.output.text;
  if (data && typeof data.output_text === 'string') return data.output_text;
  if (typeof data === 'string') return data;
  return '';
}

function joinUrl(base, path){
  if (!base) return path;
  return base.replace(/\/?$/, '/') + path.replace(/^\//, '');
}

function getFirstUserText(messages = []){
  for (const m of messages){
    if (m && m.role === 'user'){
      if (typeof m.content === 'string') return m.content;
      if (Array.isArray(m.content)){
        const t = m.content.find(p => p && p.type === 'text' && typeof p.text === 'string');
        if (t) return t.text;
      }
    }
  }
  return '';
}

function ruleBasedAnswer(q = ''){
  if(/发布.*需求/.test(q)){
    return '发布需求步骤：\n1）在首页选择相应模块（企需通/农践帮/技研实践厅）；\n2）填写标题、描述、联系方式；\n3）提交后会有专家或同学联系您。';
  }
  if(/联系.*(专家|客服)/.test(q)){
    return '联系专家方式：\n- 在聊天页选择联系人；\n- 或返回客服页选择“人工客服”发起会话。';
  }
  if(/收费|价格|费用/.test(q)){
    return '平台目前为公测阶段，部分功能免费。具体收费以实际业务为准，您可先发布需求或咨询人工客服。';
  }
  return `已收到您的问题：“${q}”。我们会尽快为您解答。`;
}