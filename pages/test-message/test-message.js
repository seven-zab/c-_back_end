import { requestSubscribeMessage, sendSubscribeMessage } from '../../utils/subscribe.js';

Page({
  data: {
    loading: false,
    result: ''
  },

  onLoad() {
    console.log('测试订阅消息页面加载');
  },

  // 测试请求订阅授权
  async testRequestAuth() {
    if (this.data.loading) return;
    
    this.setData({ loading: true, result: '正在请求授权...' });
    
    try {
      const app = getApp();
      const templateIds = app.globalData.subscribeTemplateIds;
      
      if (!templateIds || templateIds.length === 0) {
        this.setData({ 
          result: '错误：未配置订阅消息模板ID',
          loading: false 
        });
        return;
      }

      const result = await requestSubscribeMessage(templateIds);
      
      this.setData({
        result: `授权结果：${result.success ? '成功' : '失败'}\n详情：${JSON.stringify(result, null, 2)}`,
        loading: false
      });
      
    } catch (error) {
      this.setData({
        result: `授权异常：${error.message}`,
        loading: false
      });
    }
  },

  // 测试发送订阅消息
  async testSendMessage() {
    if (this.data.loading) return;
    
    this.setData({ loading: true, result: '正在发送消息...' });
    
    try {
      const app = getApp();
      const templateIds = app.globalData.subscribeTemplateIds;
      
      if (!templateIds || templateIds.length === 0) {
        this.setData({ 
          result: '错误：未配置订阅消息模板ID',
          loading: false 
        });
        return;
      }

      const result = await sendSubscribeMessage({
        templateId: templateIds[0],
        page: 'pages/test-message/test-message',
        data: {
          thing1: { value: '这是一条测试消息' },
          time2: { value: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }) }
        }
      });
      
      this.setData({
        result: `发送结果：${result.success ? '成功' : '失败'}\n详情：${JSON.stringify(result, null, 2)}`,
        loading: false
      });
      
    } catch (error) {
      this.setData({
        result: `发送异常：${error.message}`,
        loading: false
      });
    }
  },

  // 测试完整流程
  async testFullFlow() {
    if (this.data.loading) return;
    
    this.setData({ loading: true, result: '正在测试完整流程...' });
    
    try {
      const app = getApp();
      const templateIds = app.globalData.subscribeTemplateIds;
      
      if (!templateIds || templateIds.length === 0) {
        this.setData({ 
          result: '错误：未配置订阅消息模板ID',
          loading: false 
        });
        return;
      }

      // 1. 请求授权
      this.setData({ result: '步骤1：请求订阅授权...' });
      const authResult = await requestSubscribeMessage(templateIds);
      
      if (!authResult.success) {
        this.setData({
          result: `授权失败：${JSON.stringify(authResult, null, 2)}`,
          loading: false
        });
        return;
      }

      // 2. 发送消息
      this.setData({ result: '步骤2：发送订阅消息...' });
      const sendResult = await sendSubscribeMessage({
        templateId: templateIds[0],
        page: 'pages/test-message/test-message',
        data: {
          thing1: { value: '完整流程测试消息' },
          time2: { value: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }) }
        }
      });
      
      this.setData({
        result: `完整流程测试完成\n授权：${authResult.success ? '成功' : '失败'}\n发送：${sendResult.success ? '成功' : '失败'}\n发送详情：${JSON.stringify(sendResult, null, 2)}`,
        loading: false
      });
      
    } catch (error) {
      this.setData({
        result: `完整流程测试异常：${error.message}`,
        loading: false
      });
    }
  },

  // 清空结果
  clearResult() {
    this.setData({ result: '' });
  }
});