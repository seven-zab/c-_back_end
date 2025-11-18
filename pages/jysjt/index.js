Page({
  data: { list: [] },
  onShow() { this.loadList(); },
  formatRelative(ts) {
    if (!ts) return '刚刚';
    const now = Date.now();
    const d = now - Number(ts);
    if (d < 60 * 1000) return '刚刚';
    if (d < 60 * 60 * 1000) return `${Math.floor(d / (60 * 1000))}分钟前`;
    if (d < 24 * 60 * 60 * 1000) return `${Math.floor(d / (60 * 60 * 1000))}小时前`;
    const date = new Date(Number(ts));
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${m}-${day}`;
  },
  async loadList() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('demands').where({ type: '技研实践厅' }).orderBy('createdAt', 'desc').get();
      const list = (res.data || []).map(x => ({ ...x, time: x.time || this.formatRelative(x.createdAt) }));
      this.setData({ list });
    } catch (e) {
      const app = getApp();
      this.setData({ list: app.globalData.demands.jysjt || [] });
    }
  },
  async onPullDownRefresh() {
    await this.loadList();
    wx.stopPullDownRefresh();
    wx.showToast({ title: '已刷新', icon: 'none' });
  },
  goCreate() { wx.navigateTo({ url: '/pages/demand/create?type=技研实践厅' }); },
  goDetail(e) { const id = e.currentTarget.dataset.id; wx.navigateTo({ url: `/pages/demand/detail?id=${id}` }); }
})