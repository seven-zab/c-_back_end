Page({
  data: {},
  onShow() {
    const tb = this.getTabBar && this.getTabBar();
    if (tb) tb.setData({ selected: 2 });
  },
  goAIBot() {
    wx.navigateTo({ url: '/pages/service/robot' });
  },
  goHuman() {
    wx.navigateTo({ url: '/pages/service/human' });
  },
  usePrompt(e) {
    const text = e.currentTarget.dataset.text || '';
    wx.navigateTo({ url: `/pages/service/robot?prefill=${encodeURIComponent(text)}` });
  }
});