const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: {
    logs: [],
    templateIds: []
  },

  onLoad() {
    this.addLog('页面加载完成');
    this.checkConfig();
  },

  // 检查配置
  checkConfig() {
    const app = getApp();
    const tmplIds = (app.globalData && app.globalData.subscribeTemplateIds) || [];
    this.setData({ templateIds: tmplIds });
    
    if (tmplIds.length === 0) {
      this.addLog('❌ 未配置模板ID');
    } else {
      this.addLog(`✅ 已配置${tmplIds.length}个模板ID: ${tmplIds.join(', ')}`);
    }
  },

  // 测试订阅授权
  async testSubscribe() {
    this.addLog('🔄 开始测试订阅授权...');
    
    try {
      const app = getApp();
      const tmplIds = (app.globalData && app.globalData.subscribeTemplateIds) || [];
      
      if (tmplIds.length === 0) {
        this.addLog('❌ 无法测试：未配置模板ID');
        return;
      }

      // 检查平台
      const deviceInfo = wx.getDeviceInfo();
      if (deviceInfo.platform === 'devtools') {
        this.addLog('⚠️ 开发者工具不支持订阅消息授权，请在真机上测试');
        return;
      }

      this.addLog(`📋 请求授权模板: ${tmplIds.join(', ')}`);
      
      const res = await wx.requestSubscribeMessage({ tmplIds });
      this.addLog(`📝 授权结果: ${JSON.stringify(res)}`);
      
      // 分析结果
      const acceptedIds = [];
      const rejectedIds = [];
      const bannedIds = [];
      
      tmplIds.forEach(id => {
        const status = res[id];
        if (status === 'accept') {
          acceptedIds.push(id);
        } else if (status === 'reject') {
          rejectedIds.push(id);
        } else if (status === 'ban') {
          bannedIds.push(id);
        }
      });
      
      this.addLog(`✅ 已授权: ${acceptedIds.length}个`);
      this.addLog(`❌ 已拒绝: ${rejectedIds.length}个`);
      this.addLog(`🚫 已禁用: ${bannedIds.length}个`);
      
      // 如果有授权成功的，测试发送
      if (acceptedIds.length > 0) {
        this.testSendMessage(acceptedIds[0]);
      }
      
    } catch (err) {
      this.addLog(`❌ 授权失败: ${err.errMsg || err.message}`);
    }
  },

  // 测试发送消息
  async testSendMessage(templateId) {
    this.addLog(`🚀 测试发送消息，模板ID: ${templateId}`);
    
    try {
      if (!wx.cloud) {
        this.addLog('❌ 云开发未初始化');
        return;
      }

      const result = await CloudHelper.callCloudFunction('login', {
        action: 'sendSubscribe',
        templateId: templateId,
        page: 'pages/test-subscribe/test-subscribe',
        data: {
          thing1: { value: '您有新的消息提醒' },
          time2: { value: new Date().toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        }
      });

      this.addLog(`📤 云函数调用结果: ${JSON.stringify(result.result)}`);
      
      if (result.result && result.result.ok) {
        this.addLog('✅ 消息发送成功！');
      } else {
        this.addLog(`❌ 消息发送失败: ${result.result.error}`);
      }
      
    } catch (err) {
      this.addLog(`❌ 云函数调用失败: ${err.errMsg || err.message}`);
    }
  },

  // 清空日志
  clearLogs() {
    this.setData({ logs: [] });
  },

  // 添加日志
  addLog(message) {
    const logs = this.data.logs;
    let type = '';
    
    // 根据消息内容确定类型
    if (message.includes('✅')) {
      type = 'success';
    } else if (message.includes('❌')) {
      type = 'error';
    } else if (message.includes('⚠️')) {
      type = 'warning';
    } else if (message.includes('🔄')) {
      type = 'loading';
    }
    
    logs.push({
      message: `[${new Date().toLocaleTimeString()}] ${message}`,
      type: type
    });
    this.setData({
      logs: logs
    });
    console.log(message);
  },

  // 复制日志
  copyLogs() {
    const logText = this.data.logs.map(log => log.message || log).join('\n');
    wx.setClipboardData({
      data: logText,
      success: () => {
        wx.showToast({ title: '日志已复制', icon: 'success' });
      }
    });
  }
});