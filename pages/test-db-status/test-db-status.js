Page({
  data: {
    testResults: []
  },

  async onLoad() {
    await this.testDatabaseCollections();
  },

  async testDatabaseCollections() {
    const collections = [
      'demands', 
      'task_applications', 
      'tasks', 
      'messages', 
      'users', 
      'contacts', 
      'sms_codes'
    ];
    
    const results = [];
    
    for (const collectionName of collections) {
      try {
        const db = wx.cloud.database();
        await db.collection(collectionName).limit(1).get();
        results.push({
          collection: collectionName,
          status: '✅ 存在',
          error: null
        });
      } catch (error) {
        results.push({
          collection: collectionName,
          status: '❌ 不存在',
          error: error.errMsg || error.message
        });
      }
    }
    
    this.setData({ testResults: results });
    console.log('数据库集合测试结果:', results);
  },

  async initDatabase() {
    wx.showLoading({ title: '初始化中...' });
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'initDatabase',
        data: { action: 'createCollections' }
      });
      
      console.log('数据库初始化结果:', result);
      
      if (result.result && result.result.success) {
        wx.showToast({ title: '初始化成功', icon: 'success' });
        // 重新测试
        setTimeout(() => {
          this.testDatabaseCollections();
        }, 1000);
      } else {
        wx.showToast({ title: '初始化失败', icon: 'none' });
      }
    } catch (error) {
      console.error('初始化失败:', error);
      wx.showToast({ title: '初始化失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});