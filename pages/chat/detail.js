Page({
  data: {
    id: null,          // 可能为云端 _id（字符串）或本地 id（数字）
    contact: null,
    name: '',
    messages: [],
    input: '',
    scrollTo: ''
  },
  async onLoad(options) {
    const app = getApp();
    const rawId = options.id;
    const numId = Number(rawId);
    let contact = null;
    // 先在本地联系人中查找（数字 id）
    if (!Number.isNaN(numId)) {
      contact = (app.globalData.contacts || []).find(c => c.id === numId) || null;
    }
    // 若未找到，则到云端按 _id 查询
    if (!contact && wx.cloud && rawId) {
      try {
        const db = wx.cloud.database();
        const res = await db.collection('contacts').doc(rawId).get();
        contact = res.data || null;
      } catch (e) { /* ignore */ }
    }
    const name = contact ? (contact.name || '会话') : '会话';
    // 本地历史仅按数字 id 存储
    const history = (!Number.isNaN(numId) ? (app.globalData.chatHistory[numId] || []).slice() : []);
    this.setData({ id: contact && contact._id ? contact._id : (Number.isNaN(numId) ? rawId : numId), contact, name, messages: history }, () => {
      this.scrollBottom();
    });
    // 清除本地未读并更新 tabbar（仅对本地示例数据）
    if (contact && contact.unread > 0) {
      app.globalData.unreadCount = Math.max(0, (app.globalData.unreadCount || 0) - contact.unread);
      contact.unread = 0;
      const tb = this.getTabBar && this.getTabBar();
      if (tb) tb.setData({ unreadCount: app.globalData.unreadCount });
    }
    wx.setNavigationBarTitle({ title: name });
  },
  getTabBar() {
    return typeof this.selectComponent === 'function' ? this.selectComponent('#tabbar') : null;
  },
  onInput(e) {
    this.setData({ input: e.detail.value });
  },
  async onSend() {
    const text = (this.data.input || '').trim();
    if (!text) return;
    const app = getApp();
    const rawId = this.data.id;
    const numId = Number(rawId);
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const newMsg = { type: 'sent', content: text, time };
    // 更新本页
    const msgs = this.data.messages.concat(newMsg);
    this.setData({ messages: msgs, input: '' }, () => this.scrollBottom());
    // 写入本地历史（仅对数字 id）
    if (!Number.isNaN(numId)) {
      app.globalData.chatHistory[numId] = (app.globalData.chatHistory[numId] || []).concat(newMsg);
      const c = (app.globalData.contacts || []).find(c=>c.id===numId);
      if (c) { c.lastMessage = text; c.time = '刚刚'; }
    }
    // 若为云端联系人，更新其最近消息
    if (typeof rawId === 'string' && wx.cloud) {
      try {
        const db = wx.cloud.database();
        await db.collection('contacts').doc(rawId).update({ data: { lastMessage: text, time: '刚刚' } });
      } catch (e) { /* ignore cloud update failure */ }
    }
  },
  scrollBottom() {
    this.setData({ scrollTo: `msg-${this.data.messages.length - 1}` });
  }
});