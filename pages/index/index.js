Page({
  data: {
    banners: [
      { id: 1, img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop", title: "广东新农人专栏", url: "https://dara.gd.gov.cn/ztzx/gdxnr/", articleId: "gdxnr-column" },
      { id: 2, img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1200&auto=format&fit=crop", title: "网络强村专题文章", url: "https://dara.gd.gov.cn/ztzx/gdxnr/content/post_4756673.html", articleId: "dara-post-4756673" },
      { id: 3, img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop", title: "2025中央强农惠农政策清单", url: "https://www.moa.gov.cn/xw/zxfb/202503/t20250318_6471961.htm", articleId: "moa-2025-policy" }
    ],
    latestDemand: "需要AI建模优化果园灌溉方案",
    largeFont: false, // 大字版状态
  },
  
  onLoad() {
    // 从本地存储读取大字版设置
    const largeFont = wx.getStorageSync('largeFont') || false;
    this.setData({ largeFont });
  },
  onShow() {
    this.setTabBar();
    const app = getApp();
    const tb = this.getTabBar && this.getTabBar();
    if (tb) tb.setData({ unreadCount: app.globalData.unreadCount });
  },
  setTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },
  // 允许在 web-view 中打开的业务域名（需与小程序后台“业务域名”配置一致）
  allowWebViewDomains: ['dara.gd.gov.cn', 'www.moa.gov.cn'],
  getHostFromUrl(url) {
    try { return url.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase(); } catch (e) { return ''; }
  },
  onBannerTap(e) {
    const id = Number(e.currentTarget.dataset.id);
    const banner = this.data.banners.find(b => b.id === id);
    if (!banner) return;

    // 优先：若配置了本地文章 id，则直接打开本地图文详情页
    if (banner.articleId) {
      wx.navigateTo({ url: `/pages/article/detail?id=${encodeURIComponent(banner.articleId)}` });
      return;
    }

    // 兜底：仍然存在外链时，进行业务域名白名单检查
    if (!banner.url) return;
    const host = this.getHostFromUrl(banner.url);
    if (!this.allowWebViewDomains.includes(host)) {
      wx.showModal({
        title: '无法在小程序中打开',
        content: '该链接域名未加入业务域名白名单。是否复制链接到浏览器中查看？',
        confirmText: '复制链接',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({ data: banner.url, success: () => wx.showToast({ title: '链接已复制' }) });
          }
        }
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/webview/index?url=${encodeURIComponent(banner.url)}&title=${encodeURIComponent(banner.title)}`
    });
  },
  onSearchTap() {
    wx.showToast({ title: '搜索功能即将上线', icon: 'none' });
  },
  goQXT() { wx.navigateTo({ url: '/pages/qxt/index' }); },
  goNJB() { wx.navigateTo({ url: '/pages/njb/index' }); },
  goJYSJT() { wx.navigateTo({ url: '/pages/jysjt/index' }); },
  
  // 切换大字版
  toggleFontSize() {
    const largeFont = !this.data.largeFont;
    this.setData({ largeFont });
    
    // 保存到本地存储
    wx.setStorageSync('largeFont', largeFont);
    
    // 设置全局状态
    const app = getApp();
    app.globalData.largeFont = largeFont;
    
    wx.showToast({
      title: largeFont ? '已切换到大字版' : '已切换到普通版',
      icon: 'success'
    });
  }
});