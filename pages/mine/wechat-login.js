import { requestSubscribeMessage, sendSubscribeMessage } from '../../utils/subscribe.js';
import UserState from '../../utils/userState.js';
import CloudHelper from '../../utils/cloudHelper.js';

Page({
  data: {
    showPopup: false,
    loading: false,
    avatarUrl: '/images/default-avatar.svg',
    nickName: '微信用户',
    hasGotInfo: false,  // 是否已获取用户信息
    openid: null  // 从上一页传递的 openid
  },

  onLoad(options) {
    // 接收传递的 openid
    if (options.openid) {
      this.setData({ openid: options.openid });
    }
    
    // 页面进入即尝试隐私授权并显示弹窗
    try {
      if (wx.getPrivacySetting) {
        wx.getPrivacySetting({
          success: (res) => {
            if (res.needAuthorization) {
              wx.requirePrivacyAuthorize({ success: () => this.setData({ showPopup: true }) });
            } else {
              this.setData({ showPopup: true });
            }
          },
          fail: () => this.setData({ showPopup: true })
        });
      } else {
        this.setData({ showPopup: true });
      }
    } catch (_) { this.setData({ showPopup: true }); }
  },

  // 显示授权弹窗
  showAuthPopup() {
    wx.requirePrivacyAuthorize({
      success: () => {
        this.setData({
          showPopup: true
        });
      },
      fail: (res) => {
        console.error('隐私授权失败:', res);
        wx.showToast({
          title: '请同意隐私协议',
          icon: 'none'
        });
      }
    });
  },

  // 隐藏授权弹窗
  hideAuthPopup() {
    this.setData({
      showPopup: false
    });
  },

  // 头像选择事件（头像昵称填写能力）
  handleChooseAvatar(e) {
    try {
      const url = e && e.detail && e.detail.avatarUrl ? e.detail.avatarUrl : '';
      if (url) this.setData({ avatarUrl: url });
    } catch (err) { console.error('选择头像异常', err); }
  },

  // 昵称输入事件（头像昵称填写能力）
  handleNicknameInput(e) {
    const name = e && e.detail && (e.detail.value || e.detail.nickName) ? (e.detail.value || e.detail.nickName) : '';
    this.setData({ nickName: name || '微信用户' });
  },

  // 拒绝授权
  onReject() {
    wx.showModal({
      title: '确认拒绝',
      content: '拒绝授权将无法获取您的微信头像和昵称，确定要拒绝吗？',
      confirmText: '确定拒绝',
      cancelText: '重新考虑',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          this.hideAuthPopup();
          wx.showToast({
            title: '已拒绝授权',
            icon: 'none',
            duration: 1500
          });
          
          // 可以在这里添加拒绝后的处理逻辑
          // 比如跳转到其他页面或返回上一页
          setTimeout(() => {
            // wx.navigateBack();
          }, 1500);
        }
        // 如果用户点击"重新考虑"，弹窗保持打开状态
      }
    });
  },
  // 允许授权 - 使用头像昵称填写能力的数据进行保存
  async onAllow() {
    // 防止重复点击
    if (this.data.loading) {
      return;
    }

    try {
      // 设置加载状态
      this.setData({ loading: true });
      
      wx.showLoading({
        title: '获取中...',
        mask: true
      });

      // 从填写能力中读取昵称与头像
      let { nickName, avatarUrl } = this.data;
      if (!nickName || !nickName.trim()) nickName = '微信用户';

      // 获取 openid（优先使用传递的，否则重新获取）
      let openid = this.data.openid;
      if (!openid) {
        try {
          const cloudRes = await CloudHelper.callCloudFunction('login', {});
          openid = cloudRes && cloudRes.result && cloudRes.result.openid ? cloudRes.result.openid : '';
          if (!openid) { throw new Error('获取openid失败'); }
        } catch (error) {
          console.error('获取openid失败:', error);
          throw new Error('获取用户标识失败，请重试');
        }
      }

      // 若头像为本地临时路径，则上传到云存储
      let finalAvatar = avatarUrl || '';
      if (finalAvatar && !String(finalAvatar).startsWith('cloud://')) {
        try {
          const ext = finalAvatar.includes('.') ? finalAvatar.split('.').pop() : 'png';
          const cloudPath = `avatars/${openid}-${Date.now()}.${ext}`;
          const upRes = await wx.cloud.uploadFile({ cloudPath, filePath: finalAvatar });
          finalAvatar = upRes && upRes.fileID ? upRes.fileID : finalAvatar;
        } catch (upErr) { console.warn('上传头像失败，使用原路径', upErr); }
      }

      const db = wx.cloud.database();

      // 更新或创建用户记录
      let userData;
      try {
        // 尝试更新现有用户
        const updateRes = await db.collection('users').doc(openid).update({
          data: { nickName, avatarUrl: finalAvatar, updatedAt: db.serverDate() }
        });
        // 获取更新后的用户数据
        const userRes = await db.collection('users').doc(openid).get();
        userData = userRes.data;
      } catch (err) {
        // 用户不存在，创建新用户
        userData = {
          openid,
          nickName,
          avatarUrl: finalAvatar,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('users').doc(openid).set({
          data: userData
        });
      }

      // 更新全局与本地缓存，便于其他页面使用
      const user = { 
        openid: userData.openid, 
        nickName: userData.nickName, 
        avatarUrl: userData.avatarUrl 
      };
      
      console.log('登录成功，保存用户信息:', user);
      
      // 使用工具函数保存用户信息
      UserState.saveUser(user);

      wx.hideLoading();
      this.hideAuthPopup();
      this.setData({ loading: false });
      wx.showToast({ title: '授权成功！', icon: 'success', duration: 1500 });
      
      // 询问是否开启消息提醒
      setTimeout(() => {
        this.askForSubscribeMessage();
      }, 1600);

    } catch (error) {
      wx.hideLoading();
      this.setData({ loading: false });
      
      console.error('授权失败:', error);
      
      if (error.errMsg && error.errMsg.includes('deny')) {
        // 用户主动拒绝，不关闭弹窗，让用户重新选择
        wx.showToast({
          title: '您拒绝了授权',
          icon: 'none',
          duration: 2000
        });
      } else if (error.errMsg && error.errMsg.includes('cancel')) {
        // 用户取消，不关闭弹窗
        wx.showToast({
          title: '授权已取消',
          icon: 'none',
          duration: 1500
        });
      } else {
        // 其他错误，关闭弹窗
        this.hideAuthPopup();
        wx.showModal({
          title: '授权失败',
          content: '获取用户信息失败，请检查网络连接后重试',
          showCancel: false,
          confirmText: '知道了'
        });
      }
    }
  },

  // 询问用户是否开启消息提醒
  askForSubscribeMessage() {
    wx.showModal({
      title: '开启消息提醒',
      content: '是否开启消息提醒功能？我们会在有重要信息时通知您。',
      confirmText: '开启',
      cancelText: '暂不',
      success: (res) => {
        if (res.confirm) {
          this.handleSubscribeMessage();
        } else {
          // 用户选择暂不开启，直接返回
          wx.navigateBack();
        }
      },
      fail: () => {
        // 弹窗失败，直接返回
        wx.navigateBack();
      }
    });
  },

  // 处理订阅消息授权
  async handleSubscribeMessage() {
    try {
      const app = getApp();
      const templateIds = app.globalData.subscribeTemplateIds;
      
      if (!templateIds || templateIds.length === 0) {
        console.warn('未配置订阅消息模板ID');
        wx.showToast({
          title: '配置错误',
          icon: 'none'
        });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }

      // 请求订阅消息授权
      const authResult = await requestSubscribeMessage(templateIds);
      console.log('授权结果详情:', authResult);
      
      if (authResult.success && authResult.hasAccepted) {
        // 用户同意了至少一个模板的授权
        try {
          // 发送欢迎消息
          const sendResult = await sendSubscribeMessage({
            templateId: templateIds[0],
            page: 'pages/mine/mine',
            data: {
              thing1: { value: '欢迎使用我们的小程序！' },
              time2: { value: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) }
            }
          });

          wx.showToast({
            title: '消息提醒已开启',
            icon: 'success'
          });
        } catch (sendError) {
          console.error('发送欢迎消息失败:', sendError);
          wx.showToast({
            title: '授权成功',
            icon: 'success'
          });
        }
      } else if (authResult.hasRejected) {
        // 用户拒绝了授权
        wx.showToast({
          title: '您拒绝了消息授权',
          icon: 'none'
        });
      } else {
        // 用户取消了授权弹窗
        wx.showToast({
          title: '已取消授权',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('订阅消息处理失败:', error);
      wx.showToast({
        title: '设置失败',
        icon: 'none'
      });
    }
    
    // 无论成功失败，都返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 发送用户信息到服务器（示例方法）
  async sendToServer(userInfo, code) {
    try {
      const result = await wx.request({
        url: 'https://your-server.com/api/wechat-login',
        method: 'POST',
        data: {
          userInfo: userInfo,
          code: code
        }
      });
      
      console.log('服务器响应:', result.data);
      return result.data;
    } catch (error) {
      console.error('发送到服务器失败:', error);
      throw error;
    }
  },

  // 点击遮罩关闭弹窗
  onMaskTap() {
    // 点击遮罩不关闭弹窗，保持授权流程
  },

  // 获取用户信息
  onGetUserInfo() {
    console.log('用户点击获取信息按钮');
    
    // 设置已获取信息状态
    this.setData({
      hasGotInfo: true
    });
    
    // 显示提示
    wx.showToast({
      title: '请选择头像和昵称',
      icon: 'none',
      duration: 2000
    });
  }
});