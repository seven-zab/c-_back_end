// 初始化管理员权限云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 指定的管理员openid
    const adminOpenid = 'ogy8910SfgDnCCWJcz7VR2K3GOiI'
    
    // 检查用户是否存在
    let userExists = false
    try {
      const userRes = await db.collection('users').doc(adminOpenid).get()
      userExists = true
      console.log('用户已存在:', userRes.data)
    } catch (error) {
      if (error.errCode === -502001) {
        console.log('用户不存在，将创建新用户记录')
        userExists = false
      } else {
        throw error
      }
    }

    // 更新或创建用户记录，设置管理员权限
    const userData = {
      permission: 1, // 管理员权限
      permissionUpdatedAt: db.serverDate(),
      permissionUpdatedBy: 'system'
    }

    if (userExists) {
      // 更新现有用户
      await db.collection('users').doc(adminOpenid).update({
        data: userData
      })
    } else {
      // 创建新用户记录
      userData.openid = adminOpenid
      userData.nickName = '管理员'
      userData.avatarUrl = ''
      userData.createdAt = db.serverDate()
      userData.updatedAt = db.serverDate()
      
      await db.collection('users').doc(adminOpenid).set({
        data: userData
      })
    }

    return {
      success: true,
      message: '管理员权限设置成功',
      adminOpenid: adminOpenid,
      permission: 1
    }
  } catch (error) {
    console.error('设置管理员权限失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}