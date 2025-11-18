Page({
  data: { url: '' },
  onLoad(query) {
    const url = decodeURIComponent(query.url || '');
    if (!url) {
      wx.showToast({ title: '无效链接', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    this.setData({ url });
    const title = decodeURIComponent(query.title || '网页预览');
    wx.setNavigationBarTitle({ title });
  }
});