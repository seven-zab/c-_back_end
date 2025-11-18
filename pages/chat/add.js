Page({
  data: {
    name: '',
    phone: '',
    desc: ''
  },
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },
  async onSubmit() {
    const name = (this.data.name||'').trim();
    const phone = (this.data.phone||'').trim();
    const desc = (this.data.desc||'').trim();
    if (!name) { wx.showToast({ title: '请输入姓名', icon: 'none' }); return; }
    // phone 可选，如填写可简单校验长度
    if (phone && phone.length < 5) { wx.showToast({ title: '联系方式不规范', icon: 'none' }); return; }
    try {
      const db = wx.cloud.database();
      await db.collection('contacts').add({ data: { name, phone, desc, createTime: Date.now() } });
      wx.showToast({ title: '添加成功', icon: 'success' });
      setTimeout(()=>{ wx.navigateBack(); }, 500);
    } catch (e) {
      // 回退到本地
      const app = getApp();
      const id = Date.now();
      const contact = { id, name, phone, avatar: '👤', lastMessage: '已添加联系人', time: '刚刚', unread: 0, desc };
      app.globalData.contacts.unshift(contact);
      wx.showToast({ title: '已添加(本地)', icon: 'success' });
      setTimeout(()=>{ wx.navigateBack(); }, 500);
    }
  }
});