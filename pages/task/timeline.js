const UserState = require('../../utils/userState.js');
const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: {
    task: null,
    loading: false,
    user: null,
    isAssignee: false,
    isPublisher: false
  },

  onLoad(options) {
    const { taskId } = options;
    if (!taskId) {
      wx.showToast({ title: '任务ID不能为空', icon: 'none' });
      wx.navigateBack();
      return;
    }

    const user = UserState.syncUserState();
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({ user });
    this.loadTaskDetail(taskId);
  },

  onShow() {
    // 刷新任务详情
    if (this.data.task) {
      this.loadTaskDetail(this.data.task._id);
    }
  },

  // 加载任务详情
  async loadTaskDetail(taskId) {
    this.setData({ loading: true });
    
    try {
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'getTaskDetail',
        data: { taskId }
      });

      if (result.result && result.result.success) {
        const task = result.result.task;
        const user = this.data.user;
        
        this.setData({
          task,
          isAssignee: task.assigneeId === user.openid,
          isPublisher: task.publisherId === user.openid
        });
        
        // 设置页面标题
        wx.setNavigationBarTitle({
          title: task.title || '任务时间线'
        });
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
        wx.navigateBack();
      }
    } catch (error) {
      console.error('加载任务详情失败:', error);
      wx.showToast({ title: '网络错误', icon: 'none' });
      wx.navigateBack();
    } finally {
      this.setData({ loading: false });
    }
  },

  // 更新时间线步骤
  async updateTimelineStep(e) {
    const { stepIndex } = e.currentTarget.dataset;
    const step = this.data.task.timeline[stepIndex];
    
    if (!this.data.isAssignee) {
      wx.showToast({ title: '只有任务接取者可以更新进度', icon: 'none' });
      return;
    }

    if (step.completed) {
      wx.showToast({ title: '该步骤已完成', icon: 'none' });
      return;
    }

    // 检查是否可以执行此步骤（前面的步骤必须已完成）
    const timeline = this.data.task.timeline;
    for (let i = 0; i < stepIndex; i++) {
      if (!timeline[i].completed) {
        wx.showToast({ title: '请先完成前面的步骤', icon: 'none' });
        return;
      }
    }

    wx.showModal({
      title: '确认完成',
      content: `确定要标记"${step.title}"为已完成吗？`,
      success: async (res) => {
        if (res.confirm) {
          await this.processTimelineUpdate(stepIndex);
        }
      }
    });
  },

  // 处理时间线更新
  async processTimelineUpdate(stepIndex) {
    wx.showLoading({ title: '更新中...' });
    
    try {
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'updateTaskProgress',
        data: {
          taskId: this.data.task._id,
          stepIndex,
          completed: true
        }
      });

      if (result.result && result.result.success) {
        wx.showToast({ title: '更新成功', icon: 'success' });
        
        // 刷新任务详情
        this.loadTaskDetail(this.data.task._id);
        
        // 如果任务完成，显示祝贺信息
        if (result.result.allCompleted) {
          setTimeout(() => {
            wx.showModal({
              title: '🎉 任务完成',
              content: '恭喜您完成了所有任务步骤！',
              showCancel: false,
              success: () => {
                // 可以跳转到任务列表或其他页面
              }
            });
          }, 1000);
        }
      } else {
        wx.showToast({ 
          title: result.result?.error || '更新失败', 
          icon: 'none' 
        });
      }
    } catch (error) {
      console.error('更新时间线失败:', error);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 联系对方
  contactOther() {
    const task = this.data.task;
    const isAssignee = this.data.isAssignee;
    
    const contactInfo = isAssignee 
      ? `任务发布者联系方式：${task.publisherContact || '暂无'}`
      : `任务接取者：${task.assigneeName || '暂无'}`;
    
    wx.showModal({
      title: '联系信息',
      content: contactInfo,
      showCancel: false
    });
  },

  // 取消任务
  cancelTask() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个任务吗？此操作不可撤销。',
      success: async (res) => {
        if (res.confirm) {
          await this.processCancelTask();
        }
      }
    });
  },

  // 处理取消任务
  async processCancelTask() {
    wx.showLoading({ title: '取消中...' });
    
    try {
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'cancelTask',
        data: {
          taskId: this.data.task._id,
          reason: '用户取消'
        }
      });

      if (result.result && result.result.success) {
        wx.showToast({ title: '任务已取消', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      } else {
        wx.showToast({ 
          title: result.result?.error || '取消失败', 
          icon: 'none' 
        });
      }
    } catch (error) {
      console.error('取消任务失败:', error);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    if (this.data.task) {
      this.loadTaskDetail(this.data.task._id).then(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  }
});