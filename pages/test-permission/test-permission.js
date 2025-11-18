// pages/test-permission/test-permission.js
Page({
  data: {
    testResults: [],
    loading: false
  },

  onLoad() {
    this.runTests();
  },

  async runTests() {
    this.setData({ loading: true, testResults: [] });
    
    const tests = [
      { name: '初始化管理员用户', test: this.testInitAdmin },
      { name: '获取用户权限', test: this.testGetUserPermission },
      { name: '申请权限', test: this.testApplyPermission },
      { name: '获取权限申请列表', test: this.testGetApplications },
      { name: '审核权限申请', test: this.testReviewApplication }
    ];

    for (const testCase of tests) {
      try {
        const result = await testCase.test.call(this);
        this.addTestResult(testCase.name, true, result);
      } catch (error) {
        this.addTestResult(testCase.name, false, error.message);
      }
    }

    this.setData({ loading: false });
  },

  addTestResult(name, success, message) {
    const results = this.data.testResults;
    results.push({
      name,
      success,
      message: typeof message === 'string' ? message : JSON.stringify(message)
    });
    this.setData({ testResults: results });
  },

  // 测试初始化管理员用户
  async testInitAdmin() {
    const result = await wx.cloud.callFunction({
      name: 'initAdmin'
    });
    
    if (!result.result.success) {
      throw new Error(result.result.message);
    }
    
    return '管理员用户初始化成功';
  },

  // 测试获取用户权限
  async testGetUserPermission() {
    const result = await wx.cloud.callFunction({
      name: 'permission',
      data: {
        action: 'getUserPermission'
      }
    });
    
    if (!result.result.success) {
      throw new Error(result.result.message);
    }
    
    return `用户权限: ${result.result.data.permissionName}`;
  },

  // 测试申请权限
  async testApplyPermission() {
    const result = await wx.cloud.callFunction({
      name: 'permission',
      data: {
        action: 'applyPermission',
        requestedPermission: 4, // 申请果农权限
        reason: '测试申请权限功能'
      }
    });
    
    if (!result.result.success) {
      throw new Error(result.result.message);
    }
    
    return '权限申请提交成功';
  },

  // 测试获取权限申请列表
  async testGetApplications() {
    const result = await wx.cloud.callFunction({
      name: 'permission',
      data: {
        action: 'getPermissionApplications'
      }
    });
    
    if (!result.result.success) {
      throw new Error(result.result.message);
    }
    
    return `找到 ${result.result.data.length} 个权限申请`;
  },

  // 测试审核权限申请
  async testReviewApplication() {
    // 先获取申请列表
    const listResult = await wx.cloud.callFunction({
      name: 'permission',
      data: {
        action: 'getPermissionApplications'
      }
    });
    
    if (!listResult.result.success || listResult.result.data.length === 0) {
      return '没有待审核的申请';
    }
    
    const application = listResult.result.data[0];
    
    const result = await wx.cloud.callFunction({
      name: 'permission',
      data: {
        action: 'reviewPermissionApplication',
        applicationId: application._id,
        approved: true
      }
    });
    
    if (!result.result.success) {
      throw new Error(result.result.message);
    }
    
    return '权限申请审核成功';
  },

  // 重新运行测试
  onRetryTests() {
    this.runTests();
  }
});