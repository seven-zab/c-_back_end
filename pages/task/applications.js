const UserState = require('../../utils/userState.js');
const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: {
    applications: [],
    loading: false,
    user: null
  },

  onLoad() {
    const user = UserState.syncUserState();
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.setData({ user });
    this.loadApplications();
  },

  onShow() {
    // 刷新数据
    if (this.data.user) {
      this.loadApplications();
    }
  },

  // 加载任务申请列表
  async loadApplications() {
    this.setData({ loading: true });
    
    try {
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'getTaskApplications',
        data: {
          role: 'publisher',
          status: 'pending'
        }
      });

      if (result.result && result.result.success) {
        this.setData({
          applications: result.result.applications
        });
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    } catch (error) {
      console.error('加载申请列表失败:', error);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 批准申请
  async approveApplication(e) {
    const { applicationId, demandTitle } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认批准',
      content: `确定要批准这个任务申请吗？\n任务：${demandTitle}`,
      success: async (res) => {
        if (res.confirm) {
          await this.processApplication(applicationId, true);
        }
      }
    });
  },

  // 拒绝申请
  async rejectApplication(e) {
    const { applicationId, demandTitle } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认拒绝',
      content: `确定要拒绝这个任务申请吗？\n任务：${demandTitle}`,
      success: async (res) => {
        if (res.confirm) {
          await this.processApplication(applicationId, false);
        }
      }
    });
  },

  // 处理申请（批准或拒绝）
  async processApplication(applicationId, approved) {
    wx.showLoading({ title: approved ? '批准中...' : '拒绝中...' });
    
    try {
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'approveTaskApplication',
        data: {
          applicationId,
          approved
        }
      });

      if (result.result && result.result.success) {
        wx.showToast({ 
          title: approved ? '已批准' : '已拒绝', 
          icon: 'success' 
        });
        
        // 刷新列表
        this.loadApplications();
        
        // 如果批准了，询问是否查看任务详情
        if (approved && result.result.taskId) {
          setTimeout(() => {
            wx.showModal({
              title: '任务已创建',
              content: '是否查看任务详情？',
              success: (res) => {
                if (res.confirm) {
                  wx.navigateTo({
                    url: `/pages/task/timeline?taskId=${result.result.taskId}`
                  });
                }
              }
            });
          }, 1000);
        }
      } else {
        wx.showToast({ 
          title: result.result?.error || '操作失败', 
          icon: 'none' 
        });
      }
    } catch (error) {
      console.error('处理申请失败:', error);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 查看申请详情
  viewApplicationDetail(e) {
    const { application } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '申请详情',
      content: `申请人：${application.applicantName}\n任务：${application.demandTitle}\n内容：${application.demandContent || '无详细描述'}\n地点：${application.location || '无指定地点'}\n申请时间：${new Date(application.createdAt).toLocaleString()}`,
      showCancel: false
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadApplications().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});