const cloud = require('wx-server-sdk');
cloud.init({ env: 'cloud1-2gfqlz9d8ee804d7' });

// 可选：腾讯云短信 SDK（若未配置环境变量则不调用外部短信服务）
let SmsClient;
try {
  const tencentcloud = require('tencentcloud-sdk-nodejs');
  SmsClient = tencentcloud.sms.v20210111.Client;
} catch (e) {
  SmsClient = null;
}

async function sendViaTencentCloud(phone, code) {
  if (!SmsClient) return { skipped: true, message: 'sdk not installed' };
  const secretId = process.env.TC_SMS_SECRET_ID;
  const secretKey = process.env.TC_SMS_SECRET_KEY;
  const SmsSdkAppId = process.env.TC_SMS_SDKAPPID;
  const SignName = process.env.TC_SMS_SIGN;
  const TemplateId = process.env.TC_SMS_TEMPLATE_ID;
  if (!secretId || !secretKey || !SmsSdkAppId || !SignName || !TemplateId) {
    return { skipped: true, message: 'env not configured' };
  }
  const client = new SmsClient({
    credential: { secretId, secretKey },
    region: 'ap-guangzhou',
    profile: { httpProfile: { endpoint: 'sms.tencentcloudapi.com' } }
  });
  const params = {
    SmsSdkAppId,
    SignName,
    TemplateId,
    PhoneNumberSet: [`+86${phone}`],
    // 模板变量：例如 [验证码, 有效分钟数]
    TemplateParamSet: [code, '5']
  };
  const resp = await client.SendSms(params);
  return { ok: true, resp };
}

function isValidPhoneChina(phone) {
  return /^1\d{10}$/.test(String(phone || '').trim());
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const { action, phone, code } = event || {};

  if (action === 'sendCode') {
    try {
      if (!isValidPhoneChina(phone)) throw new Error('invalid phone');
      // 频率限制：60秒内不重复发送
      const nowTs = Date.now();
      const recent = await db.collection('sms_codes').where({ phone }).orderBy('createdAt', 'desc').limit(1).get();
      const last = (recent.data && recent.data[0]) || null;
      if (last && (nowTs - Number(last.createdAt)) < 60 * 1000) {
        return { ok: false, reason: 'too_frequent', nextInSec: Math.ceil((60 * 1000 - (nowTs - Number(last.createdAt))) / 1000) };
      }
      const gen = (Math.floor(100000 + Math.random() * 900000)).toString();
      // 调用腾讯云短信（若配置）
      let smsResult = await sendViaTencentCloud(phone, gen);
      // 写入验证码记录
      await db.collection('sms_codes').add({
        data: {
          phone,
          code: gen,
          createdAt: nowTs,
          expiresAt: nowTs + 5 * 60 * 1000, // 5分钟有效
          byOpenid: wxContext.OPENID || null,
        }
      });
      return { ok: true, openid: wxContext.OPENID, devHint: smsResult && smsResult.skipped ? '短信未配置，已仅记录验证码' : undefined };
    } catch (err) {
      console.error('sendCode error', err);
      return { ok: false, error: err && err.message, openid: wxContext.OPENID };
    }
  }

  if (action === 'verifyCode') {
    try {
      if (!isValidPhoneChina(phone)) throw new Error('invalid phone');
      const nowTs = Date.now();
      const res = await db.collection('sms_codes').where({ phone, code }).orderBy('createdAt', 'desc').limit(1).get();
      const item = (res.data && res.data[0]) || null;
      if (!item) return { ok: false, error: 'code_not_found' };
      if (Number(item.expiresAt) < nowTs) return { ok: false, error: 'code_expired' };
      // 校验通过：更新/创建用户并删除已用验证码
      const users = db.collection('users');
      try {
        await users.doc(wxContext.OPENID).update({ data: { phoneNumber: phone, updatedAt: db.serverDate() } });
      } catch (e) {
        await users.doc(wxContext.OPENID).set({ data: { phoneNumber: phone, createdAt: db.serverDate(), updatedAt: db.serverDate() } });
      }
      // 删除或标记验证码
      try { await db.collection('sms_codes').doc(item._id).remove(); } catch (e) {}
      return { ok: true, openid: wxContext.OPENID, phoneNumber: phone };
    } catch (err) {
      console.error('verifyCode error', err);
      return { ok: false, error: err && err.message, openid: wxContext.OPENID };
    }
  }

  return { ok: false, error: 'unknown_action', openid: wxContext.OPENID };
};