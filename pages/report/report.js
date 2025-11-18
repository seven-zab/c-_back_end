const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: {
    userPermission: null,
    startDate: '',
    endDate: '',
    loading: false,
    reportData: {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      teams: 0,
      tasks: []
    }
  },

  onLoad() {
    this.loadUserPermission();
    this.setDefaultDateRange();
  },

  // 设置默认时间范围（最近30天）
  setDefaultDateRange() {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    
    const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = startTime.toISOString().split('T')[0];
    
    this.setData({
      startDate,
      endDate
    });
  },

  // 加载用户权限信息
  async loadUserPermission() {
    try {
      console.log('🔍 开始加载用户权限...');
      const result = await CloudHelper.callCloudFunction('permission', {
        action: 'getUserPermission'
      });

      console.log('📋 权限云函数返回结果:', result);

      if (result.result && result.result.success) {
        console.log('✅ 权限加载成功:', result.result.permission);
        console.log('👤 用户身份:', result.result.permission?.permissionName);
        console.log('🔢 权限级别:', result.result.permission?.permission);
        console.log('🎯 权限功能:', result.result.permission?.features);
        
        this.setData({
          userPermission: result.result.permission
        });
        
        // 自动加载报表数据
        this.loadReportData();
      } else {
        console.error('❌ 权限验证失败:', result);
        wx.showToast({
          title: '权限验证失败',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('💥 加载用户权限失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 开始日期选择
  onStartDateChange(e) {
    this.setData({
      startDate: e.detail.value
    });
  },

  // 结束日期选择
  onEndDateChange(e) {
    this.setData({
      endDate: e.detail.value
    });
  },

  // 加载报表数据
  async loadReportData() {
    console.log('📊 开始加载报表数据...');
    console.log('🔐 当前用户权限信息:', this.data.userPermission);
    
    if (!this.data.userPermission) {
      console.error('❌ 权限信息未加载');
      wx.showToast({
        title: '权限信息未加载',
        icon: 'none'
      });
      return;
    }

    const permissionLevel = this.data.userPermission.permission;
    console.log('🔢 权限级别检查:', permissionLevel);
    console.log('✅ 权限检查条件: 1 <= ' + permissionLevel + ' <= 3');
    
    if (permissionLevel < 1 || permissionLevel > 3) {
      console.error('❌ 权限不足 - 权限级别:', permissionLevel);
      console.error('❌ 需要权限级别: 1(管理员) 或 2(村委) 或 3(学校)');
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      });
      return;
    }

    console.log('✅ 权限检查通过，开始加载数据...');
    this.setData({ loading: true });

    try {
      const result = await CloudHelper.callCloudFunction('permission', {
        action: 'getReportData',
        startDate: this.data.startDate,
        endDate: this.data.endDate,
        userPermission: this.data.userPermission
      });

      if (result.result && result.result.success) {
        this.setData({
          reportData: result.result.data,
          loading: false
        });
      } else {
        wx.showToast({
          title: result.result?.error || '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    } catch (error) {
      console.error('加载报表数据失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 导出报表
  async exportReport() {
    if (this.data.reportData.tasks.length === 0) {
      wx.showToast({
        title: '暂无数据可导出',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '生成报表中...' });

    try {
      // 生成报表文本
      let reportText = `任务报表\n`;
      reportText += `生成时间：${new Date().toLocaleString()}\n`;
      reportText += `查询范围：${this.data.startDate} 至 ${this.data.endDate}\n`;
      reportText += `权限身份：${this.data.userPermission.permissionName}\n\n`;
      
      reportText += `统计概览：\n`;
      reportText += `总任务数：${this.data.reportData.totalTasks}\n`;
      reportText += `已完成：${this.data.reportData.completedTasks}\n`;
      reportText += `进行中：${this.data.reportData.pendingTasks}\n`;
      reportText += `参与队伍：${this.data.reportData.teams}\n\n`;
      
      reportText += `任务详情：\n`;
      this.data.reportData.tasks.forEach((task, index) => {
        reportText += `${index + 1}. ${task.title}\n`;
        reportText += `   对接队伍：${task.teamName || '暂无'}\n`;
        reportText += `   对接人：${task.contact} ${task.phone}\n`;
        reportText += `   时间：${task.timeStart} 至 ${task.timeEnd}\n`;
        if (task.regionStr) {
          reportText += `   地区：${task.regionStr}\n`;
        }
        reportText += `   状态：${task.statusText}\n\n`;
      });

      // 复制到剪贴板
      await wx.setClipboardData({
        data: reportText
      });

      wx.hideLoading();
      wx.showToast({
        title: '报表已复制到剪贴板',
        icon: 'success'
      });

    } catch (error) {
      wx.hideLoading();
      console.error('导出报表失败:', error);
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      });
    }
  }
});