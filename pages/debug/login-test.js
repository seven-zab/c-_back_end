const UserState = require('../../utils/userState.js');

Page({
  data: {
    user: null,
    isLoggedIn: false,
    globalUser: null,
    storageUser: null,
    testResults: []
  },

  onLoad() {
    this.runTests();
  },

  onShow() {
    this.runTests();
  },

  runTests() {
    console.log('=== 开始登录状态测试 ===');
    
    const results = [];
    
    // 测试1: 检查全局状态
    const app = getApp();
    const globalUser = app.globalData.user;
    results.push({
      test: '全局状态检查',
      result: globalUser ? '有数据' : '无数据',
      data: globalUser
    });

    // 测试2: 检查本地存储
    let storageUser = null;
    try {
      storageUser = wx.getStorageSync('user');
      results.push({
        test: '本地存储检查',
        result: storageUser ? '有数据' : '无数据',
        data: storageUser
      });
    } catch (error) {
      results.push({
        test: '本地存储检查',
        result: '读取失败',
        data: error.message
      });
    }

    // 测试3: UserState.getCurrentUser()
    const currentUser = UserState.getCurrentUser();
    results.push({
      test: 'UserState.getCurrentUser()',
      result: currentUser ? '有数据' : '无数据',
      data: currentUser
    });

    // 测试4: UserState.isLoggedIn()
    const isLoggedIn = UserState.isLoggedIn();
    results.push({
      test: 'UserState.isLoggedIn()',
      result: isLoggedIn ? '已登录' : '未登录',
      data: isLoggedIn
    });

    // 测试5: 数据一致性检查
    const isConsistent = JSON.stringify(globalUser) === JSON.stringify(storageUser);
    results.push({
      test: '数据一致性',
      result: isConsistent ? '一致' : '不一致',
      data: { globalUser, storageUser }
    });

    this.setData({
      user: currentUser,
      isLoggedIn: isLoggedIn,
      globalUser: globalUser,
      storageUser: storageUser,
      testResults: results
    });

    console.log('测试结果:', results);
    console.log('=== 登录状态测试完成 ===');
  },

  // 清除用户数据
  clearUserData() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有用户数据吗？',
      success: (res) => {
        if (res.confirm) {
          UserState.clearUser();
          wx.showToast({
            title: '已清除',
            icon: 'success'
          });
          setTimeout(() => {
            this.runTests();
          }, 1000);
        }
      }
    });
  },

  // 模拟保存用户数据
  mockSaveUser() {
    const mockUser = {
      openid: 'test_openid_' + Date.now(),
      nickName: '测试用户',
      avatarUrl: '/images/default-avatar.svg'
    };

    const success = UserState.saveUser(mockUser);
    
    wx.showToast({
      title: success ? '保存成功' : '保存失败',
      icon: success ? 'success' : 'error'
    });

    setTimeout(() => {
      this.runTests();
    }, 1000);
  },

  // 跳转到登录页面
  goToLogin() {
    wx.navigateTo({
      url: '/pages/mine/wechat-login'
    });
  },

  // 刷新测试
  refreshTest() {
    this.runTests();
    wx.showToast({
      title: '已刷新',
      icon: 'success'
    });
  }
});