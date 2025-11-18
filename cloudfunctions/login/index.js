const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 获取数据库与开放API
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const action = event && event.action ? event.action : ''

  // 默认：返回openid（用于快速登录）
  if (!action) {
    return {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID || null
    }
  }

  // 获取手机号：传入 code（来自前端 onGetPhoneNumber）
  if (action === 'getPhoneNumber') {
    try {
      const code = event.code
      if (!code) {
        return { ok: false, error: '缺少授权码code' }
      }
      const res = await cloud.openapi.phonenumber.getPhoneNumber({ code })
      const phoneNumber = res && res.phoneInfo && res.phoneInfo.phoneNumber ? res.phoneInfo.phoneNumber : ''
      if (!phoneNumber) {
        return { ok: false, error: '未获取到手机号' }
      }
      return { ok: true, openid: wxContext.OPENID, phoneNumber }
    } catch (err) {
      return { ok: false, error: err.message || '获取手机号失败', details: err }
    }
  }

  // 发送订阅消息
  if (action === 'sendSubscribe') {
    try {
      const { templateId, page = 'pages/index/index', data = {} } = event
      if (!templateId) {
        return { ok: false, error: '缺少模板ID' }
      }
      const result = await cloud.openapi.subscribeMessage.send({
        touser: wxContext.OPENID,
        templateId,
        page,
        data,
        miniprogramState: 'trial' // 体验版，支持测试环境
      })
      return { ok: true, result }
    } catch (err) {
      return { ok: false, error: err.message || '订阅消息发送失败', details: err }
    }
  }

  // 未识别的action
  return { ok: false, error: '未支持的action' }
}