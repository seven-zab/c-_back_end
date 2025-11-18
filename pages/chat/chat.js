Page({
  data: { contacts: [] },
  onShow() {
    this.setTabBar();
    const app = getApp();
    const list = app.globalData.contacts || [];
    this.setData({ contacts: list });
    
    // 进入聊天页清零全局未读
    app.globalData.unreadCount = 0;
    const tb = this.getTabBar && this.getTabBar();
    if (tb) tb.setData({ unreadCount: 0, selected: 1 });
  },
  
  formatTime(date) {
    if (!date) return '';
    const now = new Date();
    const time = new Date(date);
    const diff = now - time;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return Math.floor(diff / 86400000) + '天前';
  },
  setTabBar() { const tb = this.getTabBar && this.getTabBar(); if (tb) tb.setData({ selected: 1 }); },
  goChat(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/chat/detail?id=${id}` });
  },
  goAdd() { wx.navigateTo({ url: '/pages/chat/add' }); }
});