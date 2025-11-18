Page({
  data: {
    initResult: null,
    checkResult: null
  },

  async initDatabase() {
    wx.showLoading({ title: '初始化数据库...' });
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'initDatabase',
        data: {
          action: 'createCollections'
        }
      });
      
      console.log('数据库初始化结果:', result);
      
      this.setData({
        initResult: result.result
      });
      
      wx.hideLoading();
      
      if (result.result.success) {
        wx.showToast({ title: '初始化成功', icon: 'success' });
      } else {
        wx.showToast({ title: '初始化失败', icon: 'none' });
      }
    } catch (error) {
      console.error('初始化数据库失败:', error);
      wx.hideLoading();
      wx.showToast({ title: '初始化失败', icon: 'none' });
    }
  },

  async checkDatabase() {
    wx.showLoading({ title: '检查数据库...' });
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'initDatabase',
        data: {
          action: 'checkCollections'
        }
      });
      
      console.log('数据库检查结果:', result);
      
      this.setData({
        checkResult: result.result
      });
      
      wx.hideLoading();
      wx.showToast({ title: '检查完成', icon: 'success' });
    } catch (error) {
      console.error('检查数据库失败:', error);
      wx.hideLoading();
      wx.showToast({ title: '检查失败', icon: 'none' });
    }
  }
})