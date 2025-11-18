const UserState = require('../../utils/userState.js');
const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: { item: null },
  
  onShow() {
    // 页面显示时同步用户状态
    UserState.syncUserState();
    
    // 调试信息：检查用户状态
    this.debugUserState();
  },
  
  // 调试用户状态
  debugUserState() {
    console.log('=== 调试用户状态 ===');
    
    // 检查存储中的用户信息
    try {
      const storageUser = wx.getStorageSync('user');
      console.log('存储中的用户信息:', storageUser);
    } catch (error) {
      console.log('读取存储失败:', error);
    }
    
    // 检查全局状态中的用户信息
    const app = getApp();
    console.log('全局状态中的用户信息:', app.globalData.user);
    
    // 检查UserState工具的方法
    const currentUser = UserState.getCurrentUser();
    const isLoggedIn = UserState.isLoggedIn();
    console.log('UserState.getCurrentUser():', currentUser);
    console.log('UserState.isLoggedIn():', isLoggedIn);
    
    console.log('=== 调试结束 ===');
  },
  
  async onLoad(options) {
    const app = getApp();
    const id = options.id;
    let item = null;
    
    console.log('=== 需求详情页面加载调试 ===');
    console.log('需求ID:', id);
    
    // 首先尝试从云数据库获取
    if (wx.cloud) {
      try {
        const db = wx.cloud.database();
        console.log('尝试从云数据库获取需求数据...');
        const res = await db.collection('demands').doc(id).get();
        item = res.data;
        console.log('✅ 从云数据库获取成功:', item);
      } catch (e) {
        console.log('❌ 云数据库访问失败:就是失败了在这里很奇怪', e);
        console.log('错误代码:', e.errCode);
        console.log('错误信息:', e.errMsg);
        
        // 如果是集合不存在的错误，记录并继续使用本地数据
        if (e.errCode === -502005) {
          console.log('⚠️ demands集合不存在，使用本地数据');
        }
      }
    }
    
    // 如果云数据库获取失败，使用本地数据
    if (!item) {
      console.log('使用本地数据源...');
      const numId = Number(id || 0);
      
      // 确保 globalData.demands 存在
      if (!app.globalData.demands) {
        console.log('❌ 本地数据源不存在');
        wx.showToast({ title: '数据源不可用', icon: 'none' });
        return;
      }
      
      const sources = [
        ...(app.globalData.demands.qxt || []).map(x=>({ ...x, type:'企需通'})),
        ...(app.globalData.demands.njb || []).map(x=>({ ...x, type:'农践帮'})),
        ...(app.globalData.demands.jysjt || []).map(x=>({ ...x, type:'技研实践厅'})),
      ];
      
      console.log('本地数据源总数:', sources.length);
      item = sources.find(x=>x.id===numId) || null;
      
      if (item) {
        console.log('✅ 从本地数据获取成功:', item);
      } else {
        console.log('❌ 在本地数据中未找到对应需求');
      }
    }
    if (item) {
      // 对地区展示做兼容
      const regionStr = item.regionStr || (Array.isArray(item.region) ? item.region.join(' ') : (item.county || ''));
      const detailAddress = item.detailAddress || item.address || '';
      this.setData({ item: { ...item, regionStr, detailAddress } });
    } else {
      this.setData({ item: null });
      wx.showToast({ title: '未找到详情', icon: 'none' });
    }
  },
  async contact() {
    const item = this.data.item;
    if (!item) return;
    // 优先云端联系人
    if (wx.cloud) {
      try {
        const db = wx.cloud.database();
        const q = await db.collection('contacts').where({ name: item.contact }).limit(1).get();
        if (q.data && q.data.length) {
          const cid = q.data[0]._id;
          wx.navigateTo({ url: `/pages/chat/detail?id=${cid}` });
          return;
        } else {
          const addRes = await db.collection('contacts').add({ data: { name: item.contact, desc: item.title || '来自需求', lastMessage: '你好', time: '刚刚', createTime: Date.now() } });
          const cid = addRes._id;
          wx.navigateTo({ url: `/pages/chat/detail?id=${cid}` });
          return;
        }
      } catch (e) { /* 失败则回退到本地 */ }
    }
    // 本地回退
    const app = getApp();
    let c = (app.globalData.contacts || []).find(x => x.name === item.contact);
    if (!c) {
      const id = Date.now();
      c = { id, name: item.contact, avatar: '👤', lastMessage: '来自需求', time: '刚刚', unread: 0, desc: item.title || '' };
      app.globalData.contacts = [c, ...(app.globalData.contacts || [])];
    }
    wx.navigateTo({ url: `/pages/chat/detail?id=${c._id || c.id}` });
  },
  
  share() { wx.showShareMenu(); },

  // 申请接取任务
  async applyTask() {
    const item = this.data.item;
    if (!item) return;

    // 检查用户登录状态
    if (!UserState.isLoggedIn()) {
      wx.showModal({
        title: '请先登录',
        content: '申请接取任务需要先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/mine/wechat-login' });
          }
        }
      });
      return;
    }

    // 确认申请
    wx.showModal({
      title: '申请接取任务',
      content: `确认申请接取任务："${item.title}"？`,
      confirmText: '确认申请',
      success: async (res) => {
        if (res.confirm) {
          await this.submitTaskApplication();
        }
      }
    });
  },

  // 提交任务申请
  async submitTaskApplication() {
    console.log('=== 提交任务申请调试信息 ===');
    
    const item = this.data.item;
    const currentUser = UserState.getCurrentUser();
    
    console.log('需求数据:', item);
    console.log('当前用户:', currentUser);
    
    if (!item) {
      console.log('❌ 需求数据为空');
      wx.showToast({ title: '需求信息缺失', icon: 'none' });
      return;
    }
    
    if (!currentUser) {
      console.log('❌ 用户未登录');
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    
    // 检查必要参数
    const demandId = item._id || item.id;
    const demandTitle = item.title;
    
    console.log('需求ID:', demandId);
    console.log('需求标题:', demandTitle);
    
    // 检查发布者openid的多种可能字段
    let demandPublisherOpenid = item.openid || item.publisherOpenid || item.userOpenid;
    console.log('需求发布者openid:', demandPublisherOpenid);
    console.log('需求发布者联系方式:', item.contact);
    
    // 如果是本地数据（没有发布者openid），使用默认处理
    if (!demandPublisherOpenid) {
      console.log('⚠️ 检测到本地数据，使用默认发布者处理');
      // 对于本地数据，我们可以使用联系人信息作为标识
      // 或者使用一个默认的系统openid
      demandPublisherOpenid = 'local_publisher_' + (item.contact || 'unknown').replace(/\s+/g, '_');
      console.log('生成的本地发布者ID:', demandPublisherOpenid);
    }
    
    // 处理发布者openid
    if (typeof demandPublisherOpenid === 'object') {
      demandPublisherOpenid = demandPublisherOpenid.openid || demandPublisherOpenid._openid;
    }
    
    console.log('处理后的发布者openid:', demandPublisherOpenid);
    
    // 允许用户接取自己发布的任务（已移除限制）
    if (demandPublisherOpenid === currentUser.openid) {
      console.log('✅ 用户正在申请自己发布的任务');
    }
    
    if (!demandId || !demandTitle || !demandPublisherOpenid) {
      console.log('❌ 缺少必要参数');
      console.log('- demandId:', demandId);
      console.log('- demandTitle:', demandTitle);
      console.log('- demandPublisherOpenid:', demandPublisherOpenid);
      wx.showToast({ title: '缺少必要参数', icon: 'none' });
      return;
    }
    
    const requestData = {
      demandId: demandId,
      demandTitle: demandTitle,
      demandContent: item.content || item.description || '',
      demandPublisher: item.contact || '未知',
      demandPublisherOpenid: demandPublisherOpenid,
      applicantOpenid: currentUser.openid,
      applicantName: currentUser.nickName || currentUser.name || '匿名用户',
      applicantAvatar: currentUser.avatarUrl || '',
      location: item.regionStr || '',
      type: item.type || 'general'
    };
    
    console.log('发送给云函数的数据:', requestData);
    
    try {
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'applyTask',
        data: requestData
      });
      
      console.log('云函数返回结果:', result);
      
      if (result.result && result.result.success) {
        wx.showToast({ title: '申请成功', icon: 'success' });
        
        // 询问是否查看我的任务
        wx.showModal({
          title: '申请成功',
          content: '您的申请已提交，是否查看我的任务？',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/task/list' });
            }
          }
        });
      } else {
        const errorMsg = (result.result && result.result.error) || '申请失败';
        console.log('申请失败:', errorMsg);
        wx.showToast({ title: errorMsg, icon: 'none' });
      }
    } catch (error) {
      console.error('调用云函数失败:', error);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    }
  },

  // 跳转到调试页面
  goToDebug() {
    wx.navigateTo({
      url: '/pages/debug/debug'
    });
  }
});