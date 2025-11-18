const UserState = require('../../utils/userState.js');

Page({
  data: {
    debugInfo: {}
  },

  onLoad() {
    this.refreshDebugInfo();
  },

  onShow() {
    this.refreshDebugInfo();
  },

  // 刷新调试信息
  refreshDebugInfo() {
    console.log('=== 开始刷新调试信息 ===');
    
    const storageUser = wx.getStorageSync('user');
    const globalUser = getApp().globalData.user;
    const currentUser = UserState.getCurrentUser();
    const isLoggedIn = UserState.isLoggedIn();

    console.log('存储中的用户信息:', storageUser);
    console.log('全局状态中的用户信息:', globalUser);
    console.log('getCurrentUser()返回:', currentUser);
    console.log('isLoggedIn()返回:', isLoggedIn);

    const debugInfo = {
      storageUser: storageUser ? JSON.stringify(storageUser, null, 2) : '无',
      globalUser: globalUser ? JSON.stringify(globalUser, null, 2) : '无',
      currentUser: currentUser ? JSON.stringify(currentUser, null, 2) : '无',
      isLoggedIn: isLoggedIn,
      isLoggedInText: isLoggedIn ? '已登录' : '未登录',
      timestamp: new Date().toLocaleString()
    };

    console.log('最终调试信息:', debugInfo);
    this.setData({ debugInfo });
    console.log('=== 调试信息刷新完成 ===');
  },

  // 清除登录状态
  clearLogin() {
    UserState.clearUser();
    wx.showToast({ title: '已清除登录状态', icon: 'success' });
    
    setTimeout(() => {
      this.refreshDebugInfo();
    }, 500);
  },

  // 测试申请任务
  testApplyTask() {
    if (!UserState.isLoggedIn()) {
      wx.showModal({
        title: '未登录',
        content: '当前用户未登录，无法申请任务',
        showCancel: false
      });
    } else {
      wx.showModal({
        title: '已登录',
        content: '当前用户已登录，可以申请任务',
        showCancel: false
      });
    }
  },

  // 检测并清除测试用户
  clearTestUser() {
    const currentUser = UserState.getCurrentUser();
    
    if (!currentUser) {
      wx.showToast({ title: '当前无用户信息', icon: 'none' });
      return;
    }
    
    // 检查是否为测试用户
    const isTestUser = currentUser.openid && currentUser.openid.startsWith('test_openid_');
    
    if (isTestUser) {
      wx.showModal({
        title: '检测到测试用户',
        content: `当前用户是测试用户：${currentUser.nickName}\n是否清除并跳转到登录页面？`,
        confirmText: '清除并登录',
        success: (res) => {
          if (res.confirm) {
            UserState.clearUser();
            wx.showToast({ title: '已清除测试用户', icon: 'success' });
            
            setTimeout(() => {
              this.refreshDebugInfo();
              wx.navigateTo({ url: '/pages/mine/wechat-login' });
            }, 1000);
          }
        }
      });
    } else {
      wx.showModal({
        title: '用户状态正常',
        content: `当前用户：${currentUser.nickName}\nOpenID：${currentUser.openid}\n\n这是真实用户，不是测试用户。`,
        showCancel: false
      });
    }
  },

  // 跳转到数据库初始化页面
  goToDatabase() {
    wx.navigateTo({
      url: '/pages/test-database/test-database'
    });
  }
});