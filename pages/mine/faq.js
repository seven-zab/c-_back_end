Page({
  data: {
    keyword: '',
    faqs: [
      { q: '如何发布需求？', a: '在首页点击“发布需求”，按提示填写并提交。', open: false, cat: '需求' },
      { q: '如何联系对方？', a: '在需求详情点击“联系TA”，可发起会话。', open: false, cat: '聊天' },
      { q: '数据是否会保存到云端？', a: '本项目已接入微信云开发，核心数据会同步至云端。', open: false, cat: '数据' },
      { q: '如何添加联系人？', a: '在聊天页点击“添加联系人”，填写信息后保存。', open: false, cat: '聊天' },
      { q: '如何查看我发布的需求？', a: '进入对应模块列表页即可查看。', open: false, cat: '需求' }
    ]
  },
  onShow() {
    this.applyFilter();
  },
  onSearchInput(e) {
    this.setData({ keyword: (e.detail.value||'').trim() }, this.applyFilter);
  },
  applyFilter() {
    const kw = this.data.keyword;
    const filtered = this.data.faqs.filter(it => !kw || it.q.includes(kw) || it.a.includes(kw));
    this.setData({ filteredFaqs: filtered });
  },
  toggle(e) {
    const idx = e.currentTarget.dataset.index;
    const list = (this.data.filteredFaqs || []).map((it, i) => ({ ...it, open: i === idx ? !it.open : it.open }));
    this.setData({ filteredFaqs: list });
  }
});