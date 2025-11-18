import { getArticleById } from '../../data/articles'

Page({
  data: {
    article: {
      title: '',
      source: '',
      sourceUrl: '',
      cover: '',
      contentHtml: ''
    }
  },
  onLoad(query) {
    const id = decodeURIComponent(query.id || '');
    const article = getArticleById(id);
    if (!article) {
      wx.showToast({ title: '内容不存在', icon: 'none' });
      return;
    }
    this.setData({ article });
    wx.setNavigationBarTitle({ title: article.title || '文章详情' });
  },
  onCopyLink() {
    const { sourceUrl } = this.data.article || {};
    if (!sourceUrl) return;
    wx.setClipboardData({ data: sourceUrl, success: () => wx.showToast({ title: '原文链接已复制' }) });
  },
  onShareAppMessage() {
    const { title } = this.data.article || {};
    return { title: title || '文章详情', path: `/pages/article/detail?id=${encodeURIComponent(this.options?.id || '')}` };
  }
});