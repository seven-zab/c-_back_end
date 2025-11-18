const UserState = require('../../utils/userState.js');
const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: {
    loading: false,
    result: ''
  },

  // 创建测试配送任务
  async createTestTask() {
    try {
      this.setData({ loading: true, result: '' });

      if (!UserState.isLoggedIn()) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      // 创建测试任务
      const currentUser = UserState.getCurrentUser();
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'createTask',
        data: {
          title: '测试配送任务',
          description: '这是一个测试配送任务，用于验证任务功能是否正常工作。请按照时间线步骤完成任务。',
          assigneeId: currentUser.openid, // 分配给自己
          location: '学校图书馆',
          timelineTemplate: 'delivery',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后
        }
      });

      if (result.result.success) {
        this.setData({
          result: `任务创建成功！\n任务ID: ${result.result.taskId}\n请到"我的任务"页面查看`,
          loading: false
        });
        
        wx.showToast({
          title: '任务创建成功',
          icon: 'success'
        });
      } else {
        throw new Error(result.result.error || '创建失败');
      }

    } catch (error) {
      console.error('创建测试任务失败:', error);
      this.setData({
        result: `创建失败: ${error.message}`,
        loading: false
      });
      
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      });
    }
  },

  // 创建通用任务
  async createGeneralTask() {
    try {
      this.setData({ loading: true, result: '' });

      if (!UserState.isLoggedIn()) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      // 创建通用测试任务
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'createTask',
        data: {
          title: '测试通用任务',
          description: '这是一个通用测试任务，包含基本的任务执行步骤。',
          assigneeId: user.openid,
          location: '学校操场',
          timelineTemplate: 'general'
        }
      });

      if (result.result.success) {
        this.setData({
          result: `通用任务创建成功！\n任务ID: ${result.result.taskId}\n请到"我的任务"页面查看`,
          loading: false
        });
        
        wx.showToast({
          title: '任务创建成功',
          icon: 'success'
        });
      } else {
        throw new Error(result.result.error || '创建失败');
      }

    } catch (error) {
      console.error('创建通用任务失败:', error);
      this.setData({
        result: `创建失败: ${error.message}`,
        loading: false
      });
      
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      });
    }
  },

  // 清空结果
  clearResult() {
    this.setData({ result: '' });
  },

  // 跳转到任务列表
  goToTaskList() {
    wx.navigateTo({
      url: '/pages/task/list'
    });
  }
});