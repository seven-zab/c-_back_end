// 权限管理云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 权限级别定义
const PERMISSION_LEVELS = {
  NORMAL_USER: 0,      // 普通用户
  ADMINISTRATOR: 1,    // 管理员
  VILLAGE_COMMITTEE: 2, // 地方村委
  SCHOOL: 3,           // 学校
  FRUIT_FARMER: 4      // 果农
}

// 权限名称映射
const PERMISSION_NAMES = {
  0: '普通用户',
  1: '管理员',
  2: '地方村委',
  3: '学校',
  4: '果农'
}

// 权限功能定义
const PERMISSION_FEATURES = {
  [PERMISSION_LEVELS.ADMINISTRATOR]: ['publish_demand', 'take_task', 'print_report', 'review_all_permissions'],
  [PERMISSION_LEVELS.VILLAGE_COMMITTEE]: ['publish_demand', 'take_task', 'print_report', 'review_farmer_permissions'],
  [PERMISSION_LEVELS.SCHOOL]: ['publish_demand', 'take_task', 'print_report'],
  [PERMISSION_LEVELS.FRUIT_FARMER]: ['publish_demand', 'take_task'],
  [PERMISSION_LEVELS.NORMAL_USER]: []
}

exports.main = async (event, context) => {
  const { action, data } = event
  const { OPENID } = cloud.getWXContext()

  console.log('权限管理云函数调用:', { action, data, openid: OPENID })

  try {
    switch (action) {
      case 'getUserPermission':
        return await getUserPermission(OPENID)
      
      case 'setUserPermission':
        return await setUserPermission(data.targetOpenid, data.permission, OPENID)
      
      case 'applyPermission':
        return await applyPermission(OPENID, data.requestedPermission, data.reason)
      
      case 'getPermissionApplications':
        return await getPermissionApplications(OPENID)
      
      case 'reviewPermissionApplication':
        return await reviewPermissionApplication(OPENID, data.applicationId, data.approved, data.reviewReason)
      
      case 'initAdminUser':
        return await initAdminUser(data.adminOpenid)
      
      case 'getReportData':
        return await getReportData(OPENID, data.startDate, data.endDate, data.userPermission)
      
      default:
        throw new Error('未知的操作类型')
    }
  } catch (error) {
    console.error('权限管理云函数错误:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 获取用户权限
async function getUserPermission(openid) {
  try {
    const userRes = await db.collection('users').doc(openid).get()
    const user = userRes.data
    
    return {
      success: true,
      permission: user.permission || PERMISSION_LEVELS.NORMAL_USER,
      permissionName: PERMISSION_NAMES[user.permission || PERMISSION_LEVELS.NORMAL_USER],
      features: PERMISSION_FEATURES[user.permission || PERMISSION_LEVELS.NORMAL_USER]
    }
  } catch (error) {
    if (error.errCode === -502001) {
      // 用户不存在，返回默认权限
      return {
        success: true,
        permission: PERMISSION_LEVELS.NORMAL_USER,
        permissionName: PERMISSION_NAMES[PERMISSION_LEVELS.NORMAL_USER],
        features: PERMISSION_FEATURES[PERMISSION_LEVELS.NORMAL_USER]
      }
    }
    throw error
  }
}

// 设置用户权限（仅管理员可用）
async function setUserPermission(targetOpenid, permission, operatorOpenid) {
  // 检查操作者权限
  const operatorPermission = await getUserPermission(operatorOpenid)
  if (operatorPermission.permission !== PERMISSION_LEVELS.ADMINISTRATOR) {
    throw new Error('权限不足，只有管理员可以设置用户权限')
  }

  // 更新目标用户权限
  await db.collection('users').doc(targetOpenid).update({
    data: {
      permission: permission,
      permissionUpdatedAt: db.serverDate(),
      permissionUpdatedBy: operatorOpenid
    }
  })

  return {
    success: true,
    message: `用户权限已更新为：${PERMISSION_NAMES[permission]}`
  }
}

// 申请权限
async function applyPermission(openid, requestedPermission, reason) {
  // 检查用户是否已有权限申请在处理中
  const existingApplications = await db.collection('permission_applications')
    .where({
      applicantOpenid: openid,
      status: 'pending'
    })
    .get()

  if (existingApplications.data.length > 0) {
    throw new Error('您已有权限申请正在处理中，请等待审核结果')
  }

  // 获取用户信息
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data

  // 创建权限申请记录
  const applicationData = {
    applicantOpenid: openid,
    applicantName: user.nickName || '未知用户',
    applicantAvatar: user.avatarUrl || '',
    requestedPermission: requestedPermission,
    requestedPermissionName: PERMISSION_NAMES[requestedPermission],
    reason: reason || '',
    status: 'pending',
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  const addRes = await db.collection('permission_applications').add({
    data: applicationData
  })

  // 发送通知给相应的审核者
  await sendPermissionApplicationNotification(applicationData, addRes._id)

  return {
    success: true,
    message: '权限申请已提交，请等待审核',
    applicationId: addRes._id
  }
}

// 获取权限申请列表（管理员和村委可查看）
async function getPermissionApplications(openid) {
  const userPermission = await getUserPermission(openid)
  
  let query = db.collection('permission_applications')
  
  // 根据权限级别过滤申请
  if (userPermission.permission === PERMISSION_LEVELS.ADMINISTRATOR) {
    // 管理员可以看到所有申请
    query = query.where({})
  } else if (userPermission.permission === PERMISSION_LEVELS.VILLAGE_COMMITTEE) {
    // 村委只能看到果农权限申请
    query = query.where({
      requestedPermission: PERMISSION_LEVELS.FRUIT_FARMER
    })
  } else {
    throw new Error('权限不足，无法查看权限申请')
  }

  const res = await query.orderBy('createdAt', 'desc').get()
  
  return {
    success: true,
    applications: res.data
  }
}

// 审核权限申请
async function reviewPermissionApplication(reviewerOpenid, applicationId, approved, reviewReason) {
  const reviewerPermission = await getUserPermission(reviewerOpenid)
  
  // 获取申请详情
  const applicationRes = await db.collection('permission_applications').doc(applicationId).get()
  const application = applicationRes.data

  // 检查审核权限
  if (reviewerPermission.permission === PERMISSION_LEVELS.ADMINISTRATOR) {
    // 管理员可以审核所有申请
  } else if (reviewerPermission.permission === PERMISSION_LEVELS.VILLAGE_COMMITTEE && 
             application.requestedPermission === PERMISSION_LEVELS.FRUIT_FARMER) {
    // 村委可以审核果农申请
  } else {
    throw new Error('权限不足，无法审核此申请')
  }

  // 更新申请状态
  const updateData = {
    status: approved ? 'approved' : 'rejected',
    reviewerOpenid: reviewerOpenid,
    reviewReason: reviewReason || '',
    reviewedAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  await db.collection('permission_applications').doc(applicationId).update({
    data: updateData
  })

  // 如果批准，更新用户权限
  if (approved) {
    await db.collection('users').doc(application.applicantOpenid).update({
      data: {
        permission: application.requestedPermission,
        permissionUpdatedAt: db.serverDate(),
        permissionUpdatedBy: reviewerOpenid
      }
    })
  }

  // 发送审核结果通知
  await sendPermissionReviewNotification(application, approved, reviewReason)

  return {
    success: true,
    message: approved ? '申请已批准' : '申请已拒绝'
  }
}

// 初始化管理员用户
async function initAdminUser(adminOpenid) {
  await db.collection('users').doc(adminOpenid).update({
    data: {
      permission: PERMISSION_LEVELS.ADMINISTRATOR,
      permissionUpdatedAt: db.serverDate(),
      permissionUpdatedBy: 'system'
    }
  })

  return {
    success: true,
    message: '管理员权限已设置'
  }
}

// 发送权限申请通知
async function sendPermissionApplicationNotification(application, applicationId) {
  // 根据申请的权限类型，发送给相应的审核者
  let targetOpenids = []

  if (application.requestedPermission === PERMISSION_LEVELS.FRUIT_FARMER) {
    // 果农申请发送给管理员和村委
    const adminUsers = await db.collection('users').where({
      permission: db.command.in([PERMISSION_LEVELS.ADMINISTRATOR, PERMISSION_LEVELS.VILLAGE_COMMITTEE])
    }).get()
    targetOpenids = adminUsers.data.map(user => user.openid)
  } else {
    // 其他申请只发送给管理员
    const adminUsers = await db.collection('users').where({
      permission: PERMISSION_LEVELS.ADMINISTRATOR
    }).get()
    targetOpenids = adminUsers.data.map(user => user.openid)
  }

  // 发送通知消息
  const notifications = targetOpenids.map(openid => ({
    toOpenid: openid,
    type: 'permission_application',
    title: '新的权限申请',
    content: `${application.applicantName} 申请成为 ${application.requestedPermissionName}`,
    data: {
      applicationId: applicationId,
      applicantOpenid: application.applicantOpenid,
      requestedPermission: application.requestedPermission
    },
    read: false,
    createdAt: db.serverDate()
  }))

  if (notifications.length > 0) {
    await db.collection('messages').add({
      data: notifications
    })
  }
}

// 发送权限审核结果通知
async function sendPermissionReviewNotification(application, approved, reviewReason) {
  const notificationData = {
    toOpenid: application.applicantOpenid,
    type: 'permission_review',
    title: approved ? '权限申请已批准' : '权限申请被拒绝',
    content: approved 
      ? `恭喜！您的 ${application.requestedPermissionName} 权限申请已被批准`
      : `很抱歉，您的 ${application.requestedPermissionName} 权限申请被拒绝。原因：${reviewReason}`,
    data: {
      applicationId: application._id,
      approved: approved,
      requestedPermission: application.requestedPermission,
      reviewReason: reviewReason
    },
    read: false,
    createdAt: db.serverDate()
  }

  await db.collection('messages').add({
    data: notificationData
  })
}

// 获取报表数据
async function getReportData(openid, startDate, endDate, userPermission) {
  try {
    // 验证权限 - 管理员(1)、村委(2)、学校(3)可以查看报表
    if (!userPermission || userPermission.permission < 1 || userPermission.permission > 3) {
      throw new Error('权限不足，无法查看报表')
    }

    // 构建查询条件
    let query = {}
    
    // 时间范围过滤
    if (startDate && endDate) {
      query.createdAt = db.command.gte(new Date(startDate)).and(db.command.lte(new Date(endDate + ' 23:59:59')))
    }

    // 根据权限级别过滤数据
    switch (userPermission.permission) {
      case PERMISSION_LEVELS.ADMINISTRATOR:
        // 管理员可以查看所有数据
        break
      
      case PERMISSION_LEVELS.VILLAGE_COMMITTEE:
        // 村委只能查看地方相关的数据
        // 这里假设需求中有region字段标识地区
        // 可以根据实际需求调整过滤条件
        break
      
      case PERMISSION_LEVELS.SCHOOL:
        // 学校可以查看学校队伍相关的数据
        // 这里假设需求中有teamType字段标识队伍类型
        query.teamType = 'school'
        break
      
      default:
        throw new Error('权限不足')
    }

    // 查询需求数据
    const demandsRes = await db.collection('demands')
      .where(query)
      .orderBy('createdAt', 'desc')
      .get()

    const demands = demandsRes.data

    // 统计数据
    const totalTasks = demands.length
    let completedTasks = 0
    let pendingTasks = 0
    const teamSet = new Set()

    // 处理任务数据
    const tasks = demands.map(demand => {
      // 判断任务状态（这里简化处理，实际可能需要更复杂的状态判断）
      let status = 'pending'
      let statusText = '进行中'
      
      // 如果有结束时间且已过期，可能是已完成
      if (demand.timeEnd && new Date(demand.timeEnd) < new Date()) {
        status = 'completed'
        statusText = '已完成'
        completedTasks++
      } else {
        pendingTasks++
      }

      // 统计参与队伍
      if (demand.teamName) {
        teamSet.add(demand.teamName)
      }

      return {
        id: demand._id,
        title: demand.title || demand.content?.substring(0, 20) + '...',
        teamName: demand.teamName || '暂无',
        contact: demand.contact || '未知',
        phone: demand.phone || '',
        timeStart: demand.timeStart || demand.time || '未设置',
        timeEnd: demand.timeEnd || '未设置',
        regionStr: demand.regionStr || '',
        status: status,
        statusText: statusText
      }
    })

    return {
      success: true,
      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        teams: teamSet.size,
        tasks
      }
    }

  } catch (error) {
    console.error('获取报表数据失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}