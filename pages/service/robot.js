const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: {
    messages: [
      { role: 'bot', content: '您好，我是AI客服，很高兴为您服务～\n可以问我：如何发布需求、如何联系专家、平台怎么收费等。' }
    ],
    input: ''
  },
  onLoad(query){
    const prefill = decodeURIComponent(query.prefill || '');
    if (prefill) this.setData({ input: prefill });
  },
  onInput(e){ this.setData({ input: e.detail.value }); },
  async onSend(){
    const q = (this.data.input||'').trim();
    if(!q) return;
    const msgs = this.data.messages.concat({ role:'user', content:q });
    this.setData({ messages: msgs, input:'' });
    try{
      const answer = await this.askAI(q, msgs);
      this.setData({ messages: this.data.messages.concat({ role:'bot', content: answer }) });
    }catch(e){
      console.error('askAI error:', e);
      this.setData({ messages: this.data.messages.concat({ role:'bot', content: '抱歉，AI服务暂不可用，请稍后重试。' }) });
    }
  },
  async askAI(q, history){
    // 优先云函数（例如对接豆包/其他大模型），避免前端暴露密钥
    if (wx.cloud && wx.cloud.callFunction) {
      try {
        const app = getApp();
        const model = (app.globalData && app.globalData.aiModel) || '';
        // 将页面对话格式转换为大模型标准 messages（bot=>assistant）
        const msgsForAI = (history||[]).slice(-10).map(m=>({
          role: m.role==='user' ? 'user' : 'assistant',
          content: String(m.content||'')
        }));
        const res = await CloudHelper.callCloudFunction('aiChat', { messages: msgsForAI, model });
        console.log('aiChat result:', res && res.result);
        const ans = res && res.result && (res.result.answer || res.result.content || res.result);
        if (ans) return String(ans);
      } catch (e) { 
        console.error('wx.cloud.callFunction(aiChat) failed:', e);
        // ignore and fallback 
      }
    }
    // 回退：本地规则化回答
    return await this.fakeAnswer(q);
  },
  async fakeAnswer(q){
    if(/发布.*需求/.test(q)){
      return '发布需求步骤：\n1）在首页选择相应模块（企需通/农践帮/技研实践厅）；\n2）填写标题、描述、联系方式；\n3）提交后会有专家或同学联系您。';
    }
    if(/联系.*(专家|客服)/.test(q)){
      return '联系专家方式：\n- 在聊天页选择联系人；\n- 或返回客服页选择“人工客服”发起会话。';
    }
    return '已收到您的问题：“'+q+'”，我会尽快为您解答。';
  }
});