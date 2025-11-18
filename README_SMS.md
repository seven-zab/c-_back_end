短信验证码功能说明：

1) 云函数：cloudfunctions/sms
   - action=sendCode：生成6位验证码，写入集合 sms_codes，并尝试调用腾讯云短信（需在环境变量配置密钥、模板等）。
   - action=verifyCode：校验未过期验证码，通过则将 phoneNumber 写入 users 集合对应 openid 文档。

2) 环境变量（云函数运行环境设置）：
   - TC_SMS_SECRET_ID, TC_SMS_SECRET_KEY, TC_SMS_SDKAPPID, TC_SMS_SIGN, TC_SMS_TEMPLATE_ID

3) 数据库集合：
   - sms_codes：{ phone, code, createdAt, expiresAt, byOpenid }
   - users：以 openid 为文档ID，含 phoneNumber 等字段

4) 前端联调：pages/mine/auth 支持手机号+验证码登录，真机测试。