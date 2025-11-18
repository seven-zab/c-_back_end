const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: {
    taskId: '',
    task: null,
    loading: true,
    timeline: [],
    showConfirmModal: false,
    currentStepIndex: -1,
    currentStep: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ taskId: options.id });
      this.loadTaskDetail();
    } else {
      wx.showToast({
        title: '任务ID不存在',
        icon: 'none'
      });
      wx.navigateBack();
    }
  },

  // 加载任务详情
  async loadTaskDetail() {
    try {
      this.setData({ loading: true });
      
      // 调用云函数获取任务详情
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'getTaskDetail',
        data: {
          taskId: this.data.taskId
        }
      });

      if (result.result.success) {
        const task = result.result.task;
        const timeline = this.processTimeline(task.timeline || []);
        
        this.setData({
          task: {
            ...task,
            createdAtFormatted: this.formatDateTime(task.createdAt),
            statusText: this.getStatusText(task.status)
          },
          timeline,
          loading: false
        });
      } else {
        wx.showToast({
          title: result.result.error || '任务不存在',
          icon: 'none'
        });
        wx.navigateBack();
      }

    } catch (error) {
      console.error('加载任务详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 处理时间线数据
  processTimeline(timeline) {
    return timeline.map((step, index) => ({
      ...step,
      index,
      completedAtFormatted: step.completedAt ? this.formatDateTime(step.completedAt) : null,
      isLast: index === timeline.length - 1
    }));
  },

  // 格式化日期时间
  formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'pending': '待开始',
      'in_progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知状态';
  },

  // 点击步骤
  onStepTap(e) {
    const { index } = e.currentTarget.dataset;
    const step = this.data.timeline[index];
    
    // 只有未完成的步骤可以点击确认
    if (!step.completed && this.data.task.status !== 'completed') {
      this.setData({
        currentStepIndex: index,
        currentStep: step,
        showConfirmModal: true
      });
    }
  },

  // 关闭确认弹窗
  closeConfirmModal() {
    this.setData({
      showConfirmModal: false,
      currentStepIndex: -1,
      currentStep: null
    });
  },

  // 确认完成步骤
  async confirmStep() {
    try {
      wx.showLoading({ title: '更新中...' });
      
      const { currentStepIndex, taskId } = this.data;
      
      // 调用云函数更新任务进度
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'updateTaskProgress',
        data: {
          taskId,
          stepIndex: currentStepIndex,
          completed: true
        }
      });

      if (result.result.success) {
        // 更新页面数据
        const processedTimeline = this.processTimeline(result.result.timeline);
        this.setData({
          timeline: processedTimeline,
          'task.status': result.result.status,
          'task.statusText': this.getStatusText(result.result.status),
          showConfirmModal: false,
          currentStepIndex: -1,
          currentStep: null
        });

        wx.hideLoading();
        wx.showToast({
          title: result.result.allCompleted ? '任务已完成！' : '步骤已确认',
          icon: 'success'
        });

        // 如果任务完成，可以发送通知给需求方
        if (result.result.allCompleted) {
          this.notifyTaskCompletion();
        }
      } else {
        throw new Error(result.result.error || '更新失败');
      }

    } catch (error) {
      console.error('更新步骤失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '更新失败',
        icon: 'none'
      });
    }
  },

  // 通知任务完成
  async notifyTaskCompletion() {
    try {
      // 这里可以调用云函数发送订阅消息给需求方
      // 暂时只在控制台记录
      console.log('任务完成，应该通知需求方:', this.data.task);
    } catch (error) {
      console.error('发送完成通知失败:', error);
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadTaskDetail().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});