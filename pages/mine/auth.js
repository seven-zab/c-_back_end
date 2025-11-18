const UserState = require('../../utils/userState.js');
const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: { phone: '', code: '', sending: false, countdown: 0, loading: false },
  onPhoneInput(e){ this.setData({ phone: (e.detail && e.detail.value) || '' }); },
  onCodeInput(e){ this.setData({ code: (e.detail && e.detail.value) || '' }); },
  async sendCode(){
    try {
      const phone = (this.data.phone || '').trim();
      if (!/^1\d{10}$/.test(phone)) { wx.showToast({ title: '请输入正确手机号', icon: 'none' }); return; }
      if (this.data.sending) return;
      this.setData({ sending: true });
      const res = await CloudHelper.callCloudFunction('sms', { action: 'sendCode', phone });
      const result = (res && res.result) || {};
      if (!result.ok) { wx.showToast({ title: result.reason==='too_frequent' ? `请稍后再试(${result.nextInSec}s)` : '发送失败', icon: 'none' }); this.setData({ sending:false }); return; }
      wx.showToast({ title: '验证码已发送', icon: 'success' });
      this.setData({ countdown: 60, sending: false });
      this.countTimer = setInterval(() => {
        const c = this.data.countdown - 1;
        this.setData({ countdown: c });
        if (c <= 0){ clearInterval(this.countTimer); this.countTimer = null; }
      }, 1000);
    } catch (e) {
      console.error('sendCode error', e);
      wx.showToast({ title: '发送失败', icon: 'none' });
      this.setData({ sending: false });
    }
  },
  async verifyCode(){
    try {
      const phone = (this.data.phone || '').trim();
      const code = (this.data.code || '').trim();
      if (!/^1\d{10}$/.test(phone)) { wx.showToast({ title: '手机号不正确', icon: 'none' }); return; }
      if (!/^\d{6}$/.test(code)) { wx.showToast({ title: '验证码为6位数字', icon: 'none' }); return; }
      const res = await CloudHelper.callCloudFunction('sms', { action: 'verifyCode', phone, code });
      const result = (res && res.result) || {};
      if (!result.ok){ wx.showToast({ title: '验证码验证失败', icon: 'none' }); return; }
      const openid = result.openid || '';
      const db = wx.cloud.database();
      // 合并用户资料
      let userDoc;
      try {
        userDoc = await db.collection('users').doc(openid).get();
      } catch(e){ userDoc = null; }
      const base = (userDoc && userDoc.data) || { openid };
      const user = { ...base, openid, phoneNumber: result.phoneNumber };
      UserState.saveUser(user);
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 600);
    } catch (e) {
      console.error('verifyCode error', e);
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },
  // 移除微信资料授权登录逻辑，auth 页仅保留手机号登录相关
  // 新增：手机号授权
  async onGetPhoneNumber(e) {
    try {
      if (!wx.cloud) {
        wx.showToast({ title: '云能力不可用', icon: 'none' });
        return;
      }
      const detail = e && e.detail ? e.detail : {};
      const errMsg = detail.errMsg || '';
      if (errMsg.includes(':fail') || errMsg.includes('cancel')) {
        wx.showToast({ title: '您已取消手机号授权', icon: 'none' });
        return;
      }
      const deviceInfo = wx.getDeviceInfo() || {};
      const isDevtools = deviceInfo.platform === 'devtools';
      const code = detail.code || '';
      if (!code) {
        wx.showToast({ title: isDevtools ? '开发者工具不返回授权码，请用真机测试' : '未获取到手机号授权码', icon: 'none' });
        return;
      }
      // 调用云函数换取手机号
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
      const db = wx.cloud.database();
      // 更新到用户表，若不存在则创建
      try {
        await db.collection('users').doc(openid).update({
          data: { phoneNumber, updatedAt: db.serverDate() }
        });
      } catch (err) {
        await db.collection('users').doc(openid).set({
          data: { phoneNumber, updatedAt: db.serverDate(), createdAt: db.serverDate() }
        });
      }
      // 更新全局与本地缓存
      const current = UserState.getCurrentUser() || { openid };
      const user = { ...current, phoneNumber };
      UserState.saveUser(user);
      wx.showToast({ title: '已授权手机号', icon: 'success' });
    } catch (err) {
      console.error('获取手机号异常', err);
      wx.showToast({ title: '授权失败', icon: 'none' });
    }
  }
});