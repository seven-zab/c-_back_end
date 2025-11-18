const UserState = require('../../utils/userState.js');
const CloudHelper = require('../../utils/cloudHelper.js');
const { requestSubscribeMessage, sendSubscribeMessage } = require('../../utils/subscribe.js');

Page({
  data: {
    user: null,
    taskCount: 0,
    pendingApplications: 0,  // 新增：待审批申请数量
    userPermission: null,    // 新增：用户权限信息
    permissionApplications: 0, // 新增：待审核权限申请数量
    largeFont: false // 大字版状态
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    
    // 同步用户状态
    const user = UserState.syncUserState();
    this.setData({ user: user });
    
    // 同步大字版状态
    const app = getApp();
    const largeFont = app.globalData.largeFont || wx.getStorageSync('largeFont') || false;
    this.setData({ largeFont });
    
    // 加载任务数量
    this.loadTaskCount();
    
    // 加载待审批申请数量
    if (user) {
      this.loadPendingApplications();
      this.loadUserPermission();  // 新增：加载用户权限
    }
  },
  goAuth() { wx.navigateTo({ url: '/pages/mine/wechat-login' }); },
  goPhoneLogin() { wx.navigateTo({ url: '/pages/mine/auth' }); },
  logout() {
    UserState.clearUser();
    this.setData({ user: null });
    wx.showToast({ title: '已退出', icon: 'none' });
  },
  goFaq() {
    wx.navigateTo({ url: '/pages/mine/faq' });
  },
  // 更新微信资料入口：跳转到新的微信授权页（头像昵称填写能力）
  onGetProfile() { wx.navigateTo({ url: '/pages/mine/wechat-login' }); },
  // 微信一键登录/注册：直接获取用户信息并登录
  async onOneTapLogin() {
    try {
      wx.showLoading({ title: '登录中...' });
      
      // 1. 先获取登录凭证
      const loginRes = await wx.login();
      if (!loginRes.code) {
        throw new Error('获取登录凭证失败');
      }
      
      // 2. 调用云函数获取 openid
      const cloudRes = await CloudHelper.callCloudFunction('login', { code: loginRes.code });
      
      if (!cloudRes.result || !cloudRes.result.openid) {
        throw new Error('获取用户标识失败');
      }
      
      const openid = cloudRes.result.openid;
      
      // 3. 检查用户是否已存在
      const db = wx.cloud.database();
      let userExists = false;
      let userData = null;
      
      try {
        const userQuery = await db.collection('users').doc(openid).get();
        if (userQuery.data) {
          userExists = true;
          userData = userQuery.data;
        }
      } catch (dbError) {
        // 用户不存在或数据库查询失败，都视为新用户
        console.log('用户不存在或查询失败:', dbError);
        userExists = false;
      }
      
      wx.hideLoading();
      
      if (userExists && userData) {
        // 用户已存在，直接登录
        // 确保用户数据包含 openid 字段
        const completeUserData = { ...userData, openid: openid };
        UserState.saveUser(completeUserData);
        this.setData({ user: completeUserData });
        
        wx.showToast({ title: '登录成功', icon: 'success' });
      } else {
        // 用户不存在，显示授权提示
        this.showAuthorizationDialog(openid);
      }
      
    } catch (error) {
      console.error('微信登录失败:', error);
      wx.hideLoading();
      wx.showToast({ 
        title: error.message || '登录失败，请重试', 
        icon: 'none' 
      });
    }
  },

  // 显示授权对话框
  showAuthorizationDialog(openid) {
    wx.showModal({
      title: '授权提示',
      content: '是否允许"技连邦"获取您的个人信息，包括微信头像和微信用户名？',
      confirmText: '允许',
      cancelText: '拒绝',
      success: (res) => {
        if (res.confirm) {
          // 用户同意授权，跳转到信息获取页面
          wx.navigateTo({ 
            url: `/pages/mine/wechat-login?openid=${openid}` 
          });
        } else {
          // 用户拒绝授权
          wx.showToast({
            title: '已取消授权',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },
  // 新增：更换头像
  async changeAvatar() {
    try {
      const current = UserState.getCurrentUser();
      if (!current || !current.openid) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        setTimeout(() => this.goAuth(), 400);
        return;
      }
      // 选择图片
      const choose = await wx.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] });
      const filePath = (choose.tempFilePaths && choose.tempFilePaths[0]) || (choose.tempFiles && choose.tempFiles[0] && choose.tempFiles[0].tempFilePath) || '';
      if (!filePath) { return; }
      // 生成云路径
      const extMatch = filePath.match(/\.[a-zA-Z0-9]+$/);
      const ext = extMatch ? extMatch[0] : '.jpg';
      const cloudPath = `avatars/${current.openid}_${Date.now()}${ext}`;
      wx.showLoading({ title: '上传中' });
      // 上传到云存储
      const upRes = await wx.cloud.uploadFile({ cloudPath, filePath });
      const fileID = upRes && upRes.fileID ? upRes.fileID : '';
      if (!fileID) { throw new Error('上传失败'); }
      // 获取临时URL用于展示
      const tmpRes = await wx.cloud.getTempFileURL({ fileList: [{ fileID, maxAge: 3600 * 24 * 30 }] });
      const list = (tmpRes && tmpRes.fileList) || [];
      const tempURL = list[0] && list[0].tempFileURL ? list[0].tempFileURL : '';
      // 更新数据库
      const db = wx.cloud.database();
      await db.collection('users').doc(current.openid).update({
        data: {
          avatarUrl: tempURL || fileID,
          avatarFileID: fileID,
          updatedAt: db.serverDate()
        }
      });
      // 更新本地与界面
      const user = { ...current, avatarUrl: tempURL || fileID, avatarFileID: fileID };
      UserState.saveUser(user);
      this.setData({ user });
      wx.hideLoading();
      wx.showToast({ title: '已更新头像', icon: 'success' });
    } catch (err) {
      console.error('更换头像失败', err);
      wx.hideLoading();
      wx.showToast({ title: '更新失败', icon: 'none' });
    }
  },
  // 新增：在“我的”页进行手机号直接登录/绑定
  async onGetPhoneNumber(e) {
    try {
      if (!wx.cloud) {
        wx.showToast({ title: '云能力不可用', icon: 'none' });
        return;
      }
      const detail = e && e.detail ? e.detail : {};
      const errMsg = detail.errMsg || '';
      if (errMsg.includes(':fail')) {
        wx.showToast({ title: '已取消授权', icon: 'none' });
        return;
      }
      const deviceInfo = wx.getDeviceInfo() || {};
      const isDevtools = deviceInfo.platform === 'devtools';
      const code = detail.code || '';
      if (!code) {
        wx.showToast({ title: isDevtools ? '开发者工具不返回授权码，请用真机测试' : '未获取到手机号授权码', icon: 'none' });
        return;
      }
      const cloudRes = await CloudHelper.callCloudFunction('login', { action: 'getPhoneNumber', code });
      const result = cloudRes && cloudRes.result ? cloudRes.result : {};
      if (!result.ok) {
        wx.showToast({ title: '获取手机号失败', icon: 'none' });
        return;
      }
      const openid = result.openid || '';
      const phoneNumber = result.phoneNumber || '';
      if (!openid || !phoneNumber) {
        wx.showToast({ title: '手机号信息不完整', icon: 'none' });
        return;
      }
      const current = UserState.getCurrentUser() || { openid };
      const nickName = current.nickName || (`用户${phoneNumber.slice(-4)}`);
      const avatarUrl = current.avatarUrl || '';
      const db = wx.cloud.database();
      // 更新或创建用户
      try {
        await db.collection('users').doc(openid).update({
          data: { phoneNumber, nickName, updatedAt: db.serverDate() }
        });
      } catch (err) {
        await db.collection('users').doc(openid).set({
          data: { phoneNumber, nickName, avatarUrl, createdAt: db.serverDate(), updatedAt: db.serverDate() }
        });
      }
      const user = { ...current, openid, phoneNumber, nickName, avatarUrl };
      UserState.saveUser(user);
      this.setData({ user });
      wx.showToast({ title: current.nickName ? '已绑定手机号' : '手机号已登录', icon: 'success' });
    } catch (err) {
      console.error('我的页获取手机号异常', err);
      wx.showToast({ title: '授权失败', icon: 'none' });
    }
  },
  // 订阅消息授权
  async requestSubscribe() {
    console.log('开始订阅消息授权流程...');
    
    try {
      const app = getApp();
      const tmplIds = (app.globalData && app.globalData.subscribeTemplateIds) || [];
      
      console.log('模板ID配置:', tmplIds);
      
      // 检查模板ID配置
      if (!tmplIds || tmplIds.length === 0) {
        console.warn('未配置订阅消息模板ID');
        wx.showModal({
          title: '配置提醒',
          content: '请先在app.js中配置订阅消息模板ID。\n\n获取步骤：\n1. 登录微信公众平台\n2. 进入小程序管理\n3. 功能 -> 订阅消息\n4. 添加模板并复制模板ID',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }

      // 检查是否在开发者工具中
      const deviceInfo = wx.getDeviceInfo();
      if (deviceInfo.platform === 'devtools') {
        wx.showModal({
          title: '提示',
          content: '订阅消息功能需要在真机上测试，开发者工具不支持授权弹窗。',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }

      console.log('发起订阅消息授权请求...');
      wx.showLoading({ title: '请求授权中...' });
      
      const authResult = await requestSubscribeMessage(tmplIds);
      
      wx.hideLoading();
      console.log('订阅消息授权结果:', authResult);
      
      // 显示授权结果
      if (authResult.success && authResult.hasAccepted) {
        // 计算授权成功的模板数量
        const acceptedCount = Object.values(authResult.templateResults || {}).filter(status => status === 'accept').length;
        
        wx.showToast({ 
          title: `已授权${acceptedCount}个模板`, 
          icon: 'success',
          duration: 2000
        });
        
        // 测试发送订阅消息（如果云函数可用）
        if (wx.cloud) {
          try {
            console.log('测试发送订阅消息...');
            const nowStr = new Date().toLocaleString('zh-CN');
            // 获取第一个授权成功的模板ID
            const firstAcceptedTemplateId = tmplIds.find(id => authResult.templateResults[id] === 'accept');
            
            const testResult = await sendSubscribeMessage({
              templateId: firstAcceptedTemplateId,
              page: 'pages/mine/mine',
              data: { 
                thing1: { value: '订阅授权成功' }, 
                time2: { value: nowStr } 
              }
            });
            console.log('测试发送结果:', testResult);
            
            setTimeout(() => {
              wx.showToast({ title: '测试消息已发送', icon: 'success' });
            }, 2000);
          } catch (e) {
            console.warn('测试发送订阅消息失败:', e);
            setTimeout(() => {
              wx.showToast({ title: '授权成功，但测试发送失败', icon: 'none' });
            }, 2000);
          }
        }
      } else {
        let message = '未获得授权';
        if (authResult.hasRejected) {
          message = '您拒绝了消息授权';
        }
        
        wx.showModal({
          title: '授权结果',
          content: `${message}\n\n如需接收消息通知，请重新授权。`,
          showCancel: true,
          cancelText: '取消',
          confirmText: '重新授权',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 用户选择重新授权
              setTimeout(() => this.requestSubscribe(), 500);
            }
          }
        });
      }
      
    } catch (err) {
      wx.hideLoading();
      console.error('订阅消息授权异常:', err);
      
      let errorMessage = '授权失败';
      if (err.errMsg) {
        if (err.errMsg.includes('requestSubscribeMessage:fail')) {
          errorMessage = '授权请求失败，请检查网络连接';
        } else if (err.errMsg.includes('template')) {
          errorMessage = '模板配置有误，请检查模板ID';
        } else {
          errorMessage = `授权失败: ${err.errMsg}`;
        }
      }
      
      wx.showModal({
        title: '授权失败',
        content: errorMessage + '\n\n请确保：\n1. 使用真机测试\n2. 模板ID配置正确\n3. 网络连接正常',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 加载任务数量
  async loadTaskCount() {
    try {
      if (!UserState.isLoggedIn()) {
        this.setData({ taskCount: 0 });
        return;
      }

      // 获取正式任务和申请记录（与任务列表页面逻辑保持一致）
      const [tasksResult, applicationsResult] = await Promise.all([
        // 获取正式任务
        CloudHelper.callCloudFunction('task', {
          action: 'getTaskList',
          data: {
            status: 'ongoing',
            role: 'assignee'
          }
        }),
        // 获取任务申请记录
        CloudHelper.callCloudFunction('task', {
          action: 'getTaskApplications',
          data: {
            role: 'applicant'
          }
        })
      ]);

      let allTasks = [];

      // 添加正式任务
      if (tasksResult.result && tasksResult.result.success) {
        allTasks = allTasks.concat(tasksResult.result.tasks || []);
      }

      // 添加申请记录（转换为任务格式）
      if (applicationsResult.result && applicationsResult.result.success) {
        const applications = applicationsResult.result.applications || [];
        const applicationTasks = applications.map(app => ({
          _id: app._id,
          status: app.status === 'pending' ? 'pending' : 
                  app.status === 'approved' ? 'in_progress' : 'cancelled',
          type: 'application'
        }));
        
        allTasks = allTasks.concat(applicationTasks);
      }

      // 过滤进行中的任务（包括待确认状态）
      const ongoingTasks = allTasks.filter(task => 
        task.status !== 'completed' && task.status !== 'cancelled'
      );

      this.setData({ taskCount: ongoingTasks.length });

    } catch (error) {
      console.error('加载任务数量失败:', error);
      this.setData({ taskCount: 0 });
    }
  },

  // 加载待审批申请数量
  async loadPendingApplications() {
    try {
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'getTaskApplications',
        data: {
          role: 'publisher',
          status: 'pending'
        }
      });

      if (result.result && result.result.success) {
        this.setData({
          pendingApplications: result.result.applications.length
        });
      }
    } catch (error) {
      console.error('加载待审批申请失败:', error);
    }
  },

  // 跳转到任务申请管理页面
  goToApplicationManagement() {
    wx.navigateTo({
      url: '/pages/task/applications'
    });
  },

  // 跳转到任务列表
  goToTaskList() {
    wx.navigateTo({
      url: '/pages/task/list'
    });
  },

  // 新增：加载用户权限信息
  async loadUserPermission() {
    try {
      if (!UserState.isLoggedIn()) {
        this.setData({ userPermission: null, permissionApplications: 0 });
        return;
      }

      console.log('🔍 [我的页面] 开始加载用户权限...');
      const result = await CloudHelper.callCloudFunction('permission', {
        action: 'getUserPermission'
      });

      console.log('📋 [我的页面] 权限云函数返回结果:', result);

      if (result.result && result.result.success) {
        console.log('✅ [我的页面] 权限加载成功:', result.result);
        console.log('👤 [我的页面] 用户身份:', result.result.permissionName);
        console.log('🔢 [我的页面] 权限级别:', result.result.permission);
        console.log('🎯 [我的页面] 权限功能:', result.result.features);
        
        this.setData({ userPermission: result.result });
        
        // 如果是管理员或村委，加载待审核的权限申请数量
        if (result.result.permission === 1 || result.result.permission === 2) {
          console.log('🔐 [我的页面] 管理员/村委权限，加载待审核申请...');
          this.loadPermissionApplications();
        }
      } else {
        console.error('❌ [我的页面] 权限加载失败:', result);
      }
    } catch (error) {
      console.error('💥 [我的页面] 加载用户权限失败:', error);
      this.setData({ userPermission: null });
    }
  },

  // 新增：加载待审核权限申请数量
  async loadPermissionApplications() {
    try {
      const result = await CloudHelper.callCloudFunction('permission', {
        action: 'getPermissionApplications'
      });

      if (result.result && result.result.success) {
        const pendingCount = result.result.applications.filter(app => app.status === 'pending').length;
        this.setData({ permissionApplications: pendingCount });
      }
    } catch (error) {
      console.error('加载权限申请数量失败:', error);
      this.setData({ permissionApplications: 0 });
    }
  },

  // 新增：申请权限
  applyPermission() {
    if (!UserState.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const items = ['管理员', '地方村委', '学校', '果农'];
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const permissionLevel = res.tapIndex + 1; // 1-4对应四种权限
        const permissionName = items[res.tapIndex];
        
        wx.showModal({
          title: '申请权限',
          content: `您要申请成为"${permissionName}"吗？`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.showReasonInput(permissionLevel, permissionName);
            }
          }
        });
      }
    });
  },

  // 新增：显示申请理由输入框
  showReasonInput(permissionLevel, permissionName) {
    wx.showModal({
      title: '申请理由',
      content: '请简要说明申请理由（可选）',
      editable: true,
      placeholderText: '请输入申请理由...',
      success: async (res) => {
        if (res.confirm) {
          await this.submitPermissionApplication(permissionLevel, permissionName, res.content);
        }
      }
    });
  },

  // 新增：提交权限申请
  async submitPermissionApplication(permissionLevel, permissionName, reason) {
    try {
      wx.showLoading({ title: '提交中...' });
      
      const result = await CloudHelper.callCloudFunction('permission', {
        action: 'applyPermission',
        data: {
          requestedPermission: permissionLevel,
          reason: reason || ''
        }
      });

      wx.hideLoading();

      if (result.result && result.result.success) {
        wx.showToast({ 
          title: '申请已提交', 
          icon: 'success' 
        });
        // 重新加载权限信息
        this.loadUserPermission();
      } else {
        wx.showToast({ 
          title: result.result?.error || '申请失败', 
          icon: 'none' 
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('提交权限申请失败:', error);
      wx.showToast({ 
        title: '申请失败，请重试', 
        icon: 'none' 
      });
    }
  },

  // 新增：跳转到权限申请管理页面
  goToPermissionManagement() {
    wx.navigateTo({
      url: '/pages/permission/management'
    });
  },

  // 新增：打印报表功能
  printReport() {
    console.log('📊 [我的页面] 点击打印报表按钮');
    console.log('🔐 [我的页面] 当前用户权限:', this.data.userPermission);
    
    if (!this.data.userPermission) {
      console.error('❌ [我的页面] 权限信息未加载');
      wx.showToast({
        title: '权限信息未加载',
        icon: 'none'
      });
      return;
    }

    const permissionLevel = this.data.userPermission.permission;
    console.log('🔢 [我的页面] 权限级别检查:', permissionLevel);
    
    if (permissionLevel < 1 || permissionLevel > 3) {
      console.error('❌ [我的页面] 权限不足 - 权限级别:', permissionLevel);
      console.error('❌ [我的页面] 需要权限级别: 1(管理员) 或 2(村委) 或 3(学校)');
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      });
      return;
    }

    console.log('✅ [我的页面] 权限检查通过，跳转到报表页面');
    wx.navigateTo({
      url: '/pages/report/report'
    });
  }
});