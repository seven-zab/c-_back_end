/**
 * 云函数调用帮助工具
 * 提供统一的云函数调用接口，包含错误处理和重试机制
 */

class CloudHelper {
  /**
   * 调用云函数
   * @param {string} name 云函数名称
   * @param {object} data 传递给云函数的数据
   * @param {object} options 调用选项
   * @returns {Promise} 云函数调用结果
   */
  static async callCloudFunction(name, data = {}, options = {}) {
    const {
      retries = 1,
      timeout = 10000,
      showLoading = false,
      loadingText = '加载中...'
    } = options;

    if (showLoading) {
      wx.showLoading({ title: loadingText });
    }

    let lastError = null;
    
    for (let i = 0; i <= retries; i++) {
      try {
        console.log(`[CloudHelper] 调用云函数 ${name}:`, data);
        
        const result = await wx.cloud.callFunction({
          name,
          data
        });
        
        console.log(`[CloudHelper] 云函数 ${name} 返回结果:`, result);
        
        if (showLoading) {
          wx.hideLoading();
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        console.error(`[CloudHelper] 云函数 ${name} 调用失败 (尝试 ${i + 1}/${retries + 1}):`, error);
        
        // 如果不是最后一次尝试，等待一段时间后重试
        if (i < retries) {
          await this.delay(1000 * (i + 1)); // 递增延迟
        }
      }
    }
    
    if (showLoading) {
      wx.hideLoading();
    }
    
    // 所有重试都失败了，抛出最后一个错误
    throw lastError;
  }

  /**
   * 延迟函数
   * @param {number} ms 延迟毫秒数
   * @returns {Promise}
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查云开发是否已初始化
   * @returns {boolean}
   */
  static isCloudInitialized() {
    return !!(wx.cloud && typeof wx.cloud.callFunction === 'function');
  }

  /**
   * 初始化云开发（如果需要）
   * @param {object} config 云开发配置
   */
  static initCloud(config = {}) {
    if (!this.isCloudInitialized()) {
      console.warn('[CloudHelper] 云开发未初始化');
      return false;
    }
    
    try {
      wx.cloud.init(config);
      console.log('[CloudHelper] 云开发初始化成功');
      return true;
    } catch (error) {
      console.error('[CloudHelper] 云开发初始化失败:', error);
      return false;
    }
  }

  /**
   * 安全调用云函数（带错误处理）
   * @param {string} name 云函数名称
   * @param {object} data 传递给云函数的数据
   * @param {object} options 调用选项
   * @returns {Promise} 云函数调用结果或错误信息
   */
  static async safeCallCloudFunction(name, data = {}, options = {}) {
    try {
      if (!this.isCloudInitialized()) {
        throw new Error('云开发未初始化');
      }
      
      const result = await this.callCloudFunction(name, data, options);
      return {
        success: true,
        result: result
      };
    } catch (error) {
      console.error(`[CloudHelper] 安全调用云函数 ${name} 失败:`, error);
      return {
        success: false,
        error: error.message || '云函数调用失败',
        details: error
      };
    }
  }
}

module.exports = CloudHelper;