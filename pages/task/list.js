const UserState = require('../../utils/userState.js');
const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: {
    tasks: [],
    loading: true,
    isEmpty: false,
    activeTab: 'ongoing', // ongoing: 进行中, completed: 已完成
    tabs: [
      { key: 'ongoing', name: '进行中' },
      { key: 'completed', name: '已完成' }
    ],
    largeFont: false // 大字版状态
  },

  onLoad() {
    // 同步大字版状态
    const app = getApp();
    const largeFont = app.globalData.largeFont || wx.getStorageSync('largeFont') || false;
    this.setData({ largeFont });
    
    this.loadTasks();
  },

  onShow() {
    // 同步大字版状态
    const app = getApp();
    const largeFont = app.globalData.largeFont || wx.getStorageSync('largeFont') || false;
    this.setData({ largeFont });
    
    this.loadTasks();
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.loadTasks();
  },

  // 加载任务列表
  async loadTasks() {
    try {
      this.setData({ loading: true });
      
      if (!UserState.isLoggedIn()) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        wx.navigateBack();
        return;
      }

      const { activeTab } = this.data;
      
      // 获取正式任务和申请记录
      const [tasksResult, applicationsResult] = await Promise.all([
        // 获取正式任务
        CloudHelper.callCloudFunction('task', {
          action: 'getTaskList',
          data: {
            status: activeTab,
            role: 'assignee'
          }
        }),
        // 获取任务申请记录
        CloudHelper.callCloudFunction('task', {
          action: 'getTaskApplications',
          data: {
            role: 'applicant'
          }
        })
      ]);

      let allTasks = [];

      // 添加正式任务
      if (tasksResult.result && tasksResult.result.success) {
        allTasks = allTasks.concat(tasksResult.result.tasks || []);
      }

      // 添加申请记录（转换为任务格式）
      if (applicationsResult.result && applicationsResult.result.success) {
        const applications = applicationsResult.result.applications || [];
        const applicationTasks = applications.map(app => ({
          _id: app._id,
          title: app.demandTitle,
          content: app.demandContent,
          status: app.status === 'pending' ? 'pending' : 
                  app.status === 'approved' ? 'in_progress' : 'cancelled',
          createdAt: app.createdAt,
          type: 'application',
          applicationId: app._id,
          demandId: app.demandId,
          publisher: app.demandPublisher,
          location: app.location
        }));
        
        allTasks = allTasks.concat(applicationTasks);
      }

      // 过滤任务
      let filteredTasks = allTasks;
      if (activeTab === 'ongoing') {
        filteredTasks = allTasks.filter(task => 
          task.status !== 'completed' && task.status !== 'cancelled'
        );
      } else if (activeTab === 'completed') {
        filteredTasks = allTasks.filter(task => 
          task.status === 'completed'
        );
      }

      // 格式化任务数据
      const tasks = filteredTasks.map(task => ({
        ...task,
        createdAtFormatted: this.formatDate(task.createdAt),
        statusText: this.getStatusText(task.status),
        progressPercent: this.calculateProgress(task.timeline || [])
      }));

      // 按创建时间排序
      tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      this.setData({
        tasks,
        isEmpty: tasks.length === 0,
        loading: false
      });

    } catch (error) {
      console.error('加载任务列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ 
        loading: false,
        tasks: [],
        isEmpty: true
      });
    }
  },

  // 格式化日期
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'pending': '待确认',
      'in_progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知状态';
  },

  // 计算进度百分比
  calculateProgress(timeline) {
    if (!timeline || timeline.length === 0) return 0;
    
    const completedSteps = timeline.filter(step => step.completed).length;
    return Math.round((completedSteps / timeline.length) * 100);
  },

  // 跳转到任务详情
  goToTaskDetail(e) {
    const taskId = e.currentTarget.dataset.taskId;
    const task = this.data.tasks.find(t => t._id === taskId);
    
    if (task && task.type === 'application') {
      // 申请类型的任务，跳转到需求详情页面
      wx.navigateTo({
        url: `/pages/demand/detail?id=${task.demandId}`
      });
    } else {
      // 正式任务，跳转到任务详情页面
      wx.navigateTo({
        url: `/pages/task/detail?id=${taskId}`
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadTasks().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});