const app = getApp();
Page({
  data:{
    staffs: [
      { id: 90001, name: '平台客服-小元', title:'在线客服', avatar:'🙋' },
      { id: 90002, name: '平台客服-小研', title:'智能协助', avatar:'🤖' }
    ]
  },
  onShow(){
    // 确保TabBar高亮
    const tb = this.getTabBar && this.getTabBar();
    if(tb && typeof tb.setData === 'function') tb.setData({ selected: 2 });
  },
  startChat(e){
    const id = Number(e.currentTarget.dataset.id);
    const staffs = this.data.staffs;
    const staff = staffs.find(s=>s.id===id);
    if(!staff) return;

    // 将客服联系人写入全局联系人（若不存在）
    const contacts = app.globalData.contacts || [];
    const exists = contacts.find(c=>c.id===id);
    if(!exists){
      contacts.push({ id: staff.id, name: staff.name, avatar: staff.avatar, lastMessage:'', unread:0 });
      app.globalData.contacts = contacts;
    }

    // 初始化聊天记录（若不存在）
    const chatHistory = app.globalData.chatHistory || {};
    if(!chatHistory[id]){
      chatHistory[id] = [ { from:'system', content:'已为您接入客服，会话已建立。', time: Date.now() } ];
      app.globalData.chatHistory = chatHistory;
    }

    // 跳转到聊天详情
    wx.navigateTo({ url: `/pages/chat/detail?id=${id}` });
  }
});