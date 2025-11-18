const TABS = ["pages/index/index", "pages/chat/chat", "pages/service/index", "pages/mine/mine"];

Component({
  data: {
    selected: 0,
    unreadCount: 0
  },
  lifetimes: {
    attached() {
      const app = getApp();
      this.setData({ unreadCount: app.globalData.unreadCount || 0 });
      this.updateSelectedByRoute();
    }
  },
  pageLifetimes: {
    show() {
      this.updateSelectedByRoute();
    }
  },
  methods: {
    updateSelectedByRoute() {
      try {
        const pages = getCurrentPages();
        const route = pages && pages.length ? pages[pages.length - 1].route : "";
        let idx = TABS.indexOf(route);
        if (idx === -1) {
          if (route.startsWith('pages/index/')) idx = 0;
          else if (route.startsWith('pages/chat/')) idx = 1;
          else if (route.startsWith('pages/service/')) idx = 2;
          else if (route.startsWith('pages/mine/')) idx = 3;
        }
        if (idx !== -1 && this.data.selected !== idx) this.setData({ selected: idx });
      } catch (e) { /* ignore */ }
    },
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      const idx = TABS.indexOf(path);
      if (idx !== -1) this.setData({ selected: idx });
      wx.switchTab({ url: "/" + path });
    }
  }
});