/**
 * 订阅消息工具函数
 * 提供订阅授权和消息发送的通用方法
 */

const CloudHelper = require('./cloudHelper.js');

/**
 * 请求订阅消息授权
 * @param {Array} templateIds 模板ID数组，如果不传则使用全局配置
 * @returns {Promise} 授权结果
 */
export function requestSubscribeMessage(templateIds = null) {
  return new Promise((resolve, reject) => {
    // 获取模板ID
    const app = getApp();
    const tmplIds = templateIds || (app.globalData && app.globalData.subscribeTemplateIds) || [];
    
    if (tmplIds.length === 0) {
      reject(new Error('未配置订阅消息模板ID'));
      return;
    }

    // 检查平台支持
    const deviceInfo = wx.getDeviceInfo();
    if (deviceInfo.platform === 'devtools') {
      reject(new Error('开发者工具不支持订阅消息，请在真机上测试'));
      return;
    }

    // 请求授权
    wx.requestSubscribeMessage({
      tmplIds: tmplIds,
      success: (res) => {
        console.log('订阅授权结果:', res);
        
        // 分析授权结果
        const results = res || {};
        let hasAccepted = false;
        let hasRejected = false;
        
        tmplIds.forEach(id => {
          const status = results[id];
          if (status === 'accept') {
            hasAccepted = true;
          } else if (status === 'reject' || status === 'ban') {
            hasRejected = true;
          }
        });
        
        // 添加success字段便于判断
        const result = {
          ...res,
          success: hasAccepted,
          hasAccepted,
          hasRejected,
          templateResults: results
        };
        
        console.log('处理后的授权结果:', result);
        resolve(result);
      },
      fail: (err) => {
        console.error('订阅授权失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 发送订阅消息
 * @param {Object} options 发送选项
 * @param {string} options.templateId 模板ID
 * @param {string} options.page 跳转页面路径
 * @param {Object} options.data 消息数据
 * @param {string} options.data.thing1.value 消息内容
 * @param {string} options.data.time2.value 时间
 * @returns {Promise} 发送结果
 */
export function sendSubscribeMessage(options = {}) {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      reject(new Error('云开发未初始化'));
      return;
    }

    // 获取默认模板ID
    const app = getApp();
    const defaultTemplateId = app.globalData && app.globalData.subscribeTemplateIds && app.globalData.subscribeTemplateIds[0];
    
    const {
      templateId = defaultTemplateId,
      page = 'pages/index/index',
      data = {
        thing1: { value: '您有新的消息提醒' },
        time2: { value: new Date().toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      }
    } = options;

    if (!templateId) {
      reject(new Error('未指定模板ID'));
      return;
    }

    // 调用云函数发送消息
    CloudHelper.callCloudFunction('login', {
      action: 'sendSubscribe',
      templateId,
      page,
      data
    }).then((res) => {
      console.log('订阅消息发送结果:', res);
      if (res.result && res.result.ok) {
        resolve(res.result);
      } else {
        reject(new Error(res.result.error || '发送失败'));
      }
    }).catch((err) => {
      console.error('订阅消息发送失败:', err);
      reject(err);
    });
  });
}

/**
 * 一键订阅并发送消息
 * @param {Object} options 选项
 * @param {string} options.content 消息内容
 * @param {string} options.page 跳转页面
 * @param {boolean} options.autoSend 是否自动发送消息
 * @returns {Promise} 操作结果
 */
export async function subscribeAndSend(options = {}) {
  const {
    content = '您有新的消息提醒',
    page = 'pages/index/index',
    autoSend = false
  } = options;

  try {
    // 1. 请求授权
    const authResult = await requestSubscribeMessage();
    console.log('授权结果:', authResult);

    // 2. 检查授权状态
    const app = getApp();
    const templateId = app.globalData && app.globalData.subscribeTemplateIds && app.globalData.subscribeTemplateIds[0];
    
    if (!templateId) {
      throw new Error('未配置模板ID');
    }

    const authStatus = authResult[templateId];
    if (authStatus !== 'accept') {
      throw new Error(`用户${authStatus === 'reject' ? '拒绝' : '取消'}了授权`);
    }

    // 3. 如果需要自动发送消息
    if (autoSend) {
      const sendResult = await sendSubscribeMessage({
        templateId,
        page,
        data: {
          thing1: { value: content },
          time2: { value: new Date().toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        }
      });
      
      return {
        authorized: true,
        sent: true,
        result: sendResult
      };
    }

    return {
      authorized: true,
      sent: false,
      templateId
    };

  } catch (error) {
    console.error('订阅操作失败:', error);
    throw error;
  }
}

/**
 * 检查订阅消息配置
 * @returns {Object} 配置状态
 */
export function checkSubscribeConfig() {
  const app = getApp();
  const templateIds = (app.globalData && app.globalData.subscribeTemplateIds) || [];
  
  return {
    configured: templateIds.length > 0,
    templateIds,
    count: templateIds.length
  };
}