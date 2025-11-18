// pages/permission-management/permission-management.js
Page({
  data: {
    applications: [],
    loading: false,
    permissionNames: {
      1: '管理员',
      2: '地方村委',
      3: '学校',
      4: '果农'
    }
  },

  onLoad() {
    this.loadApplications();
  },

  onShow() {
    this.loadApplications();
  },

  // 加载权限申请列表
  async loadApplications() {
    this.setData({ loading: true });
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'permission',
        data: {
          action: 'getPermissionApplications'
        }
      });

      if (result.result.success) {
        this.setData({
          applications: result.result.data
        });
      } else {
        wx.showToast({
          title: result.result.message || '加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载权限申请失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 审核权限申请
  async reviewApplication(e) {
    const { applicationId, action } = e.currentTarget.dataset;
    
    const actionText = action === 'approve' ? '通过' : '拒绝';
    
    const result = await wx.showModal({
      title: '确认操作',
      content: `确定要${actionText}这个权限申请吗？`
    });

    if (!result.confirm) return;

    try {
      wx.showLoading({ title: '处理中...' });
      
      const cloudResult = await wx.cloud.callFunction({
        name: 'permission',
        data: {
          action: 'reviewPermissionApplication',
          applicationId,
          approved: action === 'approve'
        }
      });

      if (cloudResult.result.success) {
        wx.showToast({
          title: `${actionText}成功`,
          icon: 'success'
        });
        this.loadApplications(); // 重新加载列表
      } else {
        wx.showToast({
          title: cloudResult.result.message || `${actionText}失败`,
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('审核权限申请失败:', error);
      wx.showToast({
        title: `${actionText}失败`,
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadApplications().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});