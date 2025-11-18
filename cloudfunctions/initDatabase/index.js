const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event
  
  try {
    switch (action) {
      case 'createCollections':
        return await createCollections()
      case 'checkCollections':
        return await checkCollections()
      default:
        return {
          success: false,
          error: '未知操作'
        }
    }
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return {
      success: false,
      error: error.message || '操作失败'
    }
  }
}

// 创建必要的数据库集合
async function createCollections() {
  const collections = [
    'task_applications', 
    'tasks', 
    'messages', 
    'demands', 
    'users', 
    'contacts', 
    'sms_codes',
    'permission_applications'  // 权限申请集合
  ]
  const results = []
  
  for (const collectionName of collections) {
    try {
      // 尝试创建集合
      await db.createCollection(collectionName)
      results.push({
        collection: collectionName,
        status: 'created',
        message: '集合创建成功'
      })
    } catch (error) {
      if (error.errCode === -502003) {
        // 集合已存在
        results.push({
          collection: collectionName,
          status: 'exists',
          message: '集合已存在'
        })
      } else {
        results.push({
          collection: collectionName,
          status: 'error',
          message: error.message
        })
      }
    }
  }
  
  return {
    success: true,
    results: results,
    message: '数据库初始化完成'
  }
}

// 检查集合是否存在
async function checkCollections() {
  const collections = [
    'task_applications', 
    'tasks', 
    'messages', 
    'demands', 
    'users', 
    'contacts', 
    'sms_codes',
    'permission_applications'  // 权限申请集合
  ]
  const results = []
  
  for (const collectionName of collections) {
    try {
      // 尝试查询集合来检查是否存在
      await db.collection(collectionName).limit(1).get()
      results.push({
        collection: collectionName,
        exists: true
      })
    } catch (error) {
      results.push({
        collection: collectionName,
        exists: false,
        error: error.message
      })
    }
  }
  
  return {
    success: true,
    results: results
  }
}