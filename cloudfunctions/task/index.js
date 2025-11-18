const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 默认时间线模板
const DEFAULT_TIMELINE_TEMPLATES = {
  general: [
    {
      title: "接受任务",
      description: "确认接受此任务",
      completed: true,
      completedAt: new Date()
    },
    {
      title: "开始执行",
      description: "开始执行任务内容",
      completed: false,
      completedAt: null
    },
    {
      title: "到达指定地点",
      description: "到达任务指定的地点（如有）",
      completed: false,
      completedAt: null
    },
    {
      title: "完成任务内容",
      description: "完成任务的主要内容",
      completed: false,
      completedAt: null
    },
    {
      title: "任务验收",
      description: "任务完成，等待验收",
      completed: false,
      completedAt: null
    }
  ],
  delivery: [
    {
      title: "接受配送任务",
      description: "确认接受配送任务",
      completed: true,
      completedAt: new Date()
    },
    {
      title: "前往取货地点",
      description: "前往指定的取货地点",
      completed: false,
      completedAt: null
    },
    {
      title: "取货确认",
      description: "确认取到货物",
      completed: false,
      completedAt: null
    },
    {
      title: "前往配送地点",
      description: "前往指定的配送地点",
      completed: false,
      completedAt: null
    },
    {
      title: "配送完成",
      description: "成功配送到指定地点",
      completed: false,
      completedAt: null
    }
  ],
  demand: [
    {
      title: "准备就绪",
      description: "确认接取任务，准备开始执行",
      completed: false,
      completedAt: null
    },
    {
      title: "到达目的地",
      description: "到达需求指定的地点",
      completed: false,
      completedAt: null
    },
    {
      title: "正在开展任务",
      description: "正在执行需求相关的任务内容",
      completed: false,
      completedAt: null
    },
    {
      title: "任务已完成",
      description: "任务执行完成，等待确认",
      completed: false,
      completedAt: null
    }
  ]
}

exports.main = async (event, context) => {
  const { action, data, ...restData } = event
  const { OPENID } = cloud.getWXContext()

  // 如果data不存在，使用restData作为数据（处理扩展运算符的情况）
  const actualData = data || restData

  try {
    switch (action) {
      case 'createTask':
        return await createTask(actualData, OPENID)
      case 'getTaskList':
        return await getTaskList(actualData, OPENID)
      case 'getTaskDetail':
        return await getTaskDetail(actualData, OPENID)
      case 'updateTaskProgress':
        return await updateTaskProgress(actualData, OPENID)
      case 'cancelTask':
        return await cancelTask(actualData, OPENID)
      case 'applyTask':
        return await applyTask(actualData, OPENID)
      case 'approveTaskApplication':
        return await approveTaskApplication(actualData, OPENID)
      case 'getTaskApplications':
        return await getTaskApplications(actualData, OPENID)
      default:
        return {
          success: false,
          error: '未知操作'
        }
    }
  } catch (error) {
    console.error('任务操作失败:', error)
    return {
      success: false,
      error: error.message || '操作失败'
    }
  }
}

// 创建任务
async function createTask(data, openid) {
  const {
    title,
    description,
    demandId,
    publisherId,
    assigneeId,
    location,
    deadline,
    timelineTemplate = 'general',
    customTimeline
  } = data

  // 验证必要参数
  if (!title || !description || !assigneeId) {
    throw new Error('缺少必要参数')
  }

  // 获取时间线模板
  let timeline = customTimeline || DEFAULT_TIMELINE_TEMPLATES[timelineTemplate] || DEFAULT_TIMELINE_TEMPLATES.general

  // 创建任务文档
  const taskData = {
    title,
    description,
    demandId: demandId || null,
    publisherId: publisherId || openid,
    assigneeId,
    status: 'pending',
    location: location || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deadline: deadline ? new Date(deadline) : null,
    timeline: timeline.map(step => ({
      ...step,
      completedAt: step.completedAt ? new Date(step.completedAt) : null
    })),
    priority: 'medium',
    tags: [],
    attachments: []
  }

  const result = await db.collection('tasks').add({
    data: taskData
  })

  return {
    success: true,
    taskId: result._id,
    task: taskData
  }
}

// 获取任务列表
async function getTaskList(data, openid) {
  const { status, role = 'assignee', page = 1, pageSize = 20 } = data

  // 构建查询条件
  let whereCondition = {}
  
  if (role === 'assignee') {
    whereCondition.assigneeId = openid
  } else if (role === 'publisher') {
    whereCondition.publisherId = openid
  }

  if (status) {
    if (status === 'ongoing') {
      whereCondition.status = db.command.neq('completed')
    } else {
      whereCondition.status = status
    }
  }

  // 查询任务
  const result = await db.collection('tasks')
    .where(whereCondition)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  return {
    success: true,
    tasks: result.data,
    total: result.data.length
  }
}

// 获取任务详情
async function getTaskDetail(data, openid) {
  const { taskId } = data

  if (!taskId) {
    throw new Error('任务ID不能为空')
  }

  const result = await db.collection('tasks').doc(taskId).get()

  if (!result.data) {
    throw new Error('任务不存在')
  }

  const task = result.data

  // 验证权限（只有任务相关人员可以查看）
  if (task.assigneeId !== openid && task.publisherId !== openid) {
    throw new Error('无权限查看此任务')
  }

  return {
    success: true,
    task: task
  }
}

// 更新任务进度
async function updateTaskProgress(data, openid) {
  const { taskId, stepIndex, completed = true } = data

  if (!taskId || stepIndex === undefined) {
    throw new Error('缺少必要参数')
  }

  // 获取任务
  const taskResult = await db.collection('tasks').doc(taskId).get()
  if (!taskResult.data) {
    throw new Error('任务不存在')
  }

  const task = taskResult.data

  // 验证权限（只有任务接取者可以更新进度）
  if (task.assigneeId !== openid) {
    throw new Error('无权限更新此任务')
  }

  // 验证任务状态
  if (task.status === 'completed' || task.status === 'cancelled') {
    throw new Error('任务已完成或已取消，无法更新进度')
  }

  // 更新时间线
  const timeline = [...task.timeline]
  if (stepIndex >= 0 && stepIndex < timeline.length) {
    timeline[stepIndex] = {
      ...timeline[stepIndex],
      completed,
      completedAt: completed ? new Date() : null
    }
  } else {
    throw new Error('步骤索引无效')
  }

  // 检查是否所有步骤都完成了
  const allCompleted = timeline.every(step => step.completed)
  const newStatus = allCompleted ? 'completed' : 'in_progress'

  // 更新数据库
  await db.collection('tasks').doc(taskId).update({
    data: {
      timeline,
      status: newStatus,
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    timeline,
    status: newStatus,
    allCompleted
  }
}

// 取消任务
async function cancelTask(data, openid) {
  const { taskId, reason } = data

  if (!taskId) {
    throw new Error('任务ID不能为空')
  }

  // 获取任务
  const taskResult = await db.collection('tasks').doc(taskId).get()
  if (!taskResult.data) {
    throw new Error('任务不存在')
  }

  const task = taskResult.data

  // 验证权限（发布者和接取者都可以取消）
  if (task.assigneeId !== openid && task.publisherId !== openid) {
    throw new Error('无权限取消此任务')
  }

  // 验证任务状态
  if (task.status === 'completed' || task.status === 'cancelled') {
    throw new Error('任务已完成或已取消')
  }

  // 更新任务状态
  await db.collection('tasks').doc(taskId).update({
    data: {
      status: 'cancelled',
      cancelReason: reason || '用户取消',
      cancelledAt: new Date(),
      cancelledBy: openid,
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: '任务已取消'
  }
}

// 申请接取任务
async function applyTask(data, openid) {
  // 检查data参数是否存在
  if (!data) {
    throw new Error('缺少data参数')
  }
  
  const {
    demandId,
    demandTitle,
    demandContent,
    demandPublisher,
    demandPublisherOpenid,
    applicantName,
    applicantAvatar,
    location,
    type = 'demand'
  } = data

  // 验证必要参数
  if (!demandId || !demandTitle || !demandPublisherOpenid) {
    throw new Error('缺少必要参数')
  }

  // 允许用户申请自己发布的任务（根据用户需求修改）
  // 注释掉原来的限制逻辑
  // if (demandPublisherOpenid === openid) {
  //   throw new Error('不能申请自己发布的任务')
  // }

  // 检查是否已经申请过
  const existingApplication = await db.collection('task_applications')
    .where({
      demandId,
      applicantOpenid: openid,
      status: db.command.neq('rejected')
    })
    .get()

  if (existingApplication.data.length > 0) {
    throw new Error('您已经申请过此任务')
  }

  // 创建任务申请记录
  const applicationData = {
    demandId,
    demandTitle,
    demandContent,
    demandPublisher,
    demandPublisherOpenid,
    applicantOpenid: openid,
    applicantName,
    applicantAvatar,
    location,
    type,
    status: 'pending', // pending, approved, rejected
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await db.collection('task_applications').add({
    data: applicationData
  })

  // 发送消息通知给需求发布者
  try {
    await sendTaskApplicationNotification(demandPublisherOpenid, {
      applicantName,
      demandTitle,
      applicationId: result._id
    })
  } catch (error) {
    console.error('发送通知失败:', error)
    // 不影响申请流程
  }

  return {
    success: true,
    applicationId: result._id,
    message: '申请已提交，请等待确认'
  }
}

// 批准任务申请
async function approveTaskApplication(data, openid) {
  const { applicationId, approved = true } = data

  if (!applicationId) {
    throw new Error('申请ID不能为空')
  }

  // 获取申请记录
  const applicationResult = await db.collection('task_applications').doc(applicationId).get()
  if (!applicationResult.data) {
    throw new Error('申请记录不存在')
  }

  const application = applicationResult.data

  // 验证权限（只有需求发布者可以批准）
  if (application.demandPublisherOpenid !== openid) {
    throw new Error('无权限操作此申请')
  }

  // 验证申请状态
  if (application.status !== 'pending') {
    throw new Error('申请已处理')
  }

  const newStatus = approved ? 'approved' : 'rejected'

  // 更新申请状态
  await db.collection('task_applications').doc(applicationId).update({
    data: {
      status: newStatus,
      processedAt: new Date(),
      updatedAt: new Date()
    }
  })

  // 如果批准，创建正式任务并取消其他申请
  if (approved) {
    // 先取消同一个需求的其他所有待处理申请
    const otherApplicationsResult = await db.collection('task_applications')
      .where({
        demandId: application.demandId,
        status: 'pending',
        _id: db.command.neq(applicationId) // 排除当前申请
      })
      .get()

    // 批量取消其他申请
    const cancelPromises = otherApplicationsResult.data.map(async (otherApp) => {
      await db.collection('task_applications').doc(otherApp._id).update({
        data: {
          status: 'cancelled',
          processedAt: new Date(),
          updatedAt: new Date(),
          cancelReason: '该需求已被其他用户接取'
        }
      })

      // 发送取消通知给被取消的申请者
      try {
        await sendTaskApprovalNotification(otherApp.applicantOpenid, {
          demandTitle: otherApp.demandTitle,
          approved: false,
          cancelReason: '该需求已被其他用户接取'
        })
      } catch (error) {
        console.error('发送取消通知失败:', error)
      }
    })

    // 等待所有取消操作完成
    await Promise.all(cancelPromises)

    const timeline = DEFAULT_TIMELINE_TEMPLATES.demand.map(step => ({
      ...step,
      completedAt: step.completedAt ? new Date(step.completedAt) : null
    }))

    const taskData = {
      title: application.demandTitle,
      content: application.demandContent || application.demandTitle,
      demandId: application.demandId,
      publisherId: application.demandPublisherOpenid,
      publisherName: application.demandPublisherName || '未知用户',
      assigneeId: application.applicantOpenid,
      assigneeName: application.applicantName,
      assigneeAvatar: application.applicantAvatar,
      status: 'in_progress',
      location: application.location,
      createTime: new Date().toLocaleString('zh-CN'),
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline,
      priority: 'medium',
      tags: ['需求接取'],
      attachments: [],
      type: 'demand'
    }

    const taskResult = await db.collection('tasks').add({
      data: taskData
    })

    // 更新申请记录，关联任务ID
    await db.collection('task_applications').doc(applicationId).update({
      data: {
        taskId: taskResult._id
      }
    })

    // 发送通知给申请者
    try {
      await sendTaskApprovalNotification(application.applicantOpenid, {
        demandTitle: application.demandTitle,
        taskId: taskResult._id,
        approved: true
      })
    } catch (error) {
      console.error('发送通知失败:', error)
    }

    return {
      success: true,
      taskId: taskResult._id,
      message: '申请已批准，任务已创建'
    }
  } else {
    // 发送拒绝通知
    try {
      await sendTaskApprovalNotification(application.applicantOpenid, {
        demandTitle: application.demandTitle,
        approved: false
      })
    } catch (error) {
      console.error('发送通知失败:', error)
    }

    return {
      success: true,
      message: '申请已拒绝'
    }
  }
}

// 获取任务申请列表
async function getTaskApplications(data, openid) {
  const { role = 'publisher', status, page = 1, pageSize = 20 } = data

  // 构建查询条件
  let whereCondition = {}
  
  if (role === 'publisher') {
    whereCondition.demandPublisherOpenid = openid
  } else if (role === 'applicant') {
    whereCondition.applicantOpenid = openid
  }

  if (status) {
    whereCondition.status = status
  }

  // 查询申请
  const result = await db.collection('task_applications')
    .where(whereCondition)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  return {
    success: true,
    applications: result.data,
    total: result.data.length
  }
}

// 发送任务申请通知
async function sendTaskApplicationNotification(publisherOpenid, data) {
  // 这里可以集成微信消息推送或其他通知方式
  // 暂时记录到消息表
  try {
    await db.collection('messages').add({
      data: {
        toOpenid: publisherOpenid,
        type: 'task_application',
        title: '新的任务申请',
        content: `${data.applicantName} 申请接取您的需求："${data.demandTitle}"`,
        data: {
          applicationId: data.applicationId,
          applicantName: data.applicantName,
          demandTitle: data.demandTitle
        },
        read: false,
        createdAt: new Date()
      }
    })
  } catch (error) {
    console.error('保存消息失败:', error)
  }
}

// 发送任务批准/拒绝通知
async function sendTaskApprovalNotification(applicantOpenid, data) {
  try {
    let title, content
    
    if (data.approved) {
      title = '任务申请已通过'
      content = `您申请的任务"${data.demandTitle}"已通过，可以开始执行了！`
    } else if (data.cancelReason) {
      title = '任务申请已取消'
      content = `您申请的任务"${data.demandTitle}"已取消：${data.cancelReason}`
    } else {
      title = '任务申请被拒绝'
      content = `很抱歉，您申请的任务"${data.demandTitle}"被拒绝了。`
    }

    await db.collection('messages').add({
      data: {
        toOpenid: applicantOpenid,
        type: 'task_approval',
        title,
        content,
        data: {
          demandTitle: data.demandTitle,
          taskId: data.taskId || null,
          approved: data.approved,
          cancelReason: data.cancelReason || null
        },
        read: false,
        createdAt: new Date()
      }
    })
  } catch (error) {
    console.error('保存消息失败:', error)
  }
}