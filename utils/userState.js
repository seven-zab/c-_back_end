// 用户状态管理工具
const CloudHelper = require('./cloudHelper.js');
const UserState = {
  // 获取当前用户信息
  getCurrentUser() {
    const app = getApp();
    let user = app.globalData.user;
    
    console.log('UserState.getCurrentUser() - 全局状态中的用户:', user);
    
    // 如果全局状态为空，尝试从存储中恢复
    if (!user) {
      try {
        const storageUser = wx.getStorageSync('user');
        console.log('UserState.getCurrentUser() - 存储中的用户:', storageUser);
        if (storageUser) {
          // 规范化：如果没有 openid，但有 _id 或 _openid，则补齐
          const oid = storageUser.openid || storageUser._id || storageUser._openid;
          if (oid) {
            const normalized = { ...storageUser, openid: oid };
            app.globalData.user = normalized;
            user = normalized;
            // 回写规范化后的数据到存储，避免后续再出现不一致
            try { wx.setStorageSync('user', normalized); } catch (_) {}
            console.log('从存储恢复并规范化用户信息:', normalized);
          } else {
            console.log('存储中没有有效的用户标识');
          }
        } else {
          console.log('存储中没有用户信息');
        }
      } catch (error) {
        console.error('读取用户存储信息失败:', error);
      }
    }

    // 若仍缺少openid，保持现状并在登录流程中修复
    
    console.log('UserState.getCurrentUser() - 最终返回的用户:', user);
    return user;
  },
  
  // 检查用户是否已登录
  isLoggedIn() {
    const user = this.getCurrentUser();
    // 兼容从数据库读取的仅包含 _id 的用户对象
    const oid = user && (user.openid || user._id || user._openid);
    const result = !!oid;
    console.log('UserState.isLoggedIn() - 用户信息:', user);
    console.log('UserState.isLoggedIn() - 登录状态:', result);
    return result;
  },
  
  // 保存用户信息
  saveUser(userData) {
    console.log('=== UserState.saveUser 开始 ===');
    console.log('接收到的用户数据:', userData);
    
    try {
      const app = getApp();
      console.log('获取到的app实例:', app);
      console.log('保存前的全局用户状态:', app.globalData.user);
      
      // 兼容：如果没有 openid，但有 _id 或 _openid，则补齐
      const oid = userData && (userData.openid || userData._id || userData._openid);
      const user = { ...userData, openid: oid };
      
      console.log('准备保存的用户对象:', user);
      
      app.globalData.user = user;
      console.log('保存到全局状态后:', app.globalData.user);
      
      wx.setStorageSync('user', user);
      console.log('保存到存储后，立即读取验证:', wx.getStorageSync('user'));
      
      console.log('用户信息已保存:', user);
      console.log('=== UserState.saveUser 完成 ===');
      return true;
    } catch (error) {
      console.error('保存用户信息失败:', error);
      return false;
    }
  },
  
  // 清除用户信息
  clearUser() {
    try {
      const app = getApp();
      app.globalData.user = null;
      wx.removeStorageSync('user');
      console.log('用户信息已清除');
      return true;
    } catch (error) {
      console.error('清除用户信息失败:', error);
      return false;
    }
  },
  
  // 同步用户状态（在页面显示时调用）
  syncUserState() {
    return this.getCurrentUser();
  }
};

// 兼容不同的导入方式
module.exports = UserState;
export default UserState;