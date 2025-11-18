const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: {
    logs: [],
    collections: []
  },

  onLoad() {
    this.addLog('📋 数据库初始化测试页面');
    this.checkCollections();
  },

  // 检查集合状态
  async checkCollections() {
    this.addLog('🔍 检查数据库集合状态...');
    
    try {
      const result = await CloudHelper.callCloudFunction('initDatabase', {
        action: 'checkCollections'
      });
      
      console.log('检查结果:', result);
      
      if (result.result && result.result.success) {
        const collections = result.result.results;
        this.setData({ collections });
        
        collections.forEach(item => {
          const status = item.exists ? '✅ 存在' : '❌ 不存在';
          this.addLog(`${item.collection}: ${status}`);
        });
        
        const missingCollections = collections.filter(item => !item.exists);
        if (missingCollections.length > 0) {
          this.addLog(`⚠️ 发现 ${missingCollections.length} 个缺失的集合`);
        } else {
          this.addLog('✅ 所有必要的集合都已存在');
        }
      } else {
        this.addLog('❌ 检查失败: ' + (result.result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('检查集合失败:', error);
      this.addLog('❌ 检查失败: ' + error.message);
    }
  },

  // 创建缺失的集合
  async createCollections() {
    this.addLog('🔨 开始创建数据库集合...');
    
    try {
      const result = await CloudHelper.callCloudFunction('initDatabase', {
        action: 'createCollections'
      });
      
      console.log('创建结果:', result);
      
      if (result.result && result.result.success) {
        const results = result.result.results;
        
        results.forEach(item => {
          let statusIcon = '';
          switch (item.status) {
            case 'created':
              statusIcon = '✅ 已创建';
              break;
            case 'exists':
              statusIcon = '📋 已存在';
              break;
            case 'error':
              statusIcon = '❌ 创建失败';
              break;
          }
          this.addLog(`${item.collection}: ${statusIcon} - ${item.message}`);
        });
        
        this.addLog('🎉 数据库初始化完成！');
        
        // 重新检查状态
        setTimeout(() => {
          this.checkCollections();
        }, 1000);
        
      } else {
        this.addLog('❌ 创建失败: ' + (result.result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('创建集合失败:', error);
      this.addLog('❌ 创建失败: ' + error.message);
    }
  },

  // 清空日志
  clearLogs() {
    this.setData({ logs: [] });
  },

  // 添加日志
  addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logs = this.data.logs;
    logs.push(`[${timestamp}] ${message}`);
    this.setData({ logs });
    
    // 滚动到底部
    setTimeout(() => {
      wx.pageScrollTo({
        scrollTop: 999999,
        duration: 300
      });
    }, 100);
  },

  // 复制日志
  copyLogs() {
    const logText = this.data.logs.join('\n');
    wx.setClipboardData({
      data: logText,
      success: () => {
        wx.showToast({ title: '日志已复制', icon: 'success' });
      }
    });
  }
});