// app.js
App({
  onLaunch() {
    if (wx.cloud) {
      // 使用指定的云环境ID，确保云能力正常工作
      wx.cloud.init({ env: 'cloud1-2gfqlz9d8ee804d7', traceUser: true });
    } else {
      console.error('请使用基础库 2.2.3 或以上以使用云能力');
    }
    // 应用启动逻辑 - 从本地存储恢复用户信息
    try {
      const user = wx.getStorageSync('user') || null;
      this.globalData.user = user;
      console.log('应用启动，恢复用户信息:', user);
      
      // 验证用户信息的有效性
      if (user && (!user.openid || typeof user.openid !== 'string')) {
        console.warn('用户信息无效，清除缓存');
        this.globalData.user = null;
        wx.removeStorageSync('user');
      }
    } catch (error) {
      console.error('恢复用户信息失败:', error);
      this.globalData.user = null;
      // 清除可能损坏的存储数据
      try {
        wx.removeStorageSync('user');
      } catch (e) {
        console.error('清除存储失败:', e);
      }
    }
  },
  globalData: {
    user: null,
    unreadCount: 3, // 模拟未读消息数量
    largeFont: false, // 大字版状态
    // 三大模块的需求数据
    demands: {
      qxt: [ // 企需通需求
        {
          id: 1,
          title: "生产原件芯片封装",
          content: "生产技术类 - 电子元件生产技术需求：像'高精度芯片封装技术需求'",
          contact: "张奥博",
          phone: "13903160507",
          time: "2025-10-06 至 2025-11-06",
          skills: ["软件基础"],
          region: ["广东省", "深圳市", "南山区"],
          regionStr: "广东省 深圳市 南山区",
          detailAddress: "科技园",
          type: "企需通"
        },
        {
          id: 2,
          title: "AI智能算法优化",
          content: "需要机器学习专家协助优化现有算法，提升模型准确率",
          contact: "李教授",
          phone: "13800138000",
          time: "2025-10-15 至 2025-12-15",
          skills: ["人工智能", "机器学习"],
          region: ["广东省", "广州市", "天河区"],
          regionStr: "广东省 广州市 天河区",
          detailAddress: "华南理工大学",
          type: "企需通"
        }
      ],
      njb: [ // 农践帮需求
        {
          id: 3,
          title: "有机蔬菜种植技术指导",
          content: "需要农业专家指导有机蔬菜种植技术，包括土壤改良、病虫害防治等",
          contact: "王农民",
          phone: "13700137000",
          time: "2025-10-20 至 2025-11-20",
          skills: ["农业技术", "有机种植"],
          region: ["广东省", "惠州市", "惠城区"],
          regionStr: "广东省 惠州市 惠城区",
          detailAddress: "农业示范园",
          type: "农践帮"
        }
      ],
      jysjt: [ // 技研实践厅需求
        {
          id: 4,
          title: "新能源汽车电池技术研发",
          content: "寻求新能源汽车电池技术合作，需要电化学和材料科学专业背景",
          contact: "陈工程师",
          phone: "13600136000",
          time: "2025-11-01 至 2026-01-01",
          skills: ["电化学", "材料科学"],
          region: ["广东省", "东莞市", "松山湖"],
          regionStr: "广东省 东莞市 松山湖",
          detailAddress: "科技园区",
          type: "技研实践厅"
        }
      ]
    },
    // 聊天联系人列表
    contacts: [
      { id: 1, name: "张三教授", avatar: "👨‍🏫", lastMessage: "好的，我来看看这个需求", time: "10:30", unread: 2 },
      { id: 2, name: "李同学", avatar: "👩‍🎓", lastMessage: "谢谢老师的指导", time: "昨天", unread: 0 },
      { id: 3, name: "王工程师", avatar: "👨‍💻", lastMessage: "项目进展如何？", time: "周二", unread: 1 }
    ],
    // 聊天记录
    chatHistory: {
      1: [
        { type: 'received', content: '你好，我看到你发布的需求了', time: '10:25' },
        { type: 'sent', content: '是的，需要一个AI建模方案', time: '10:26' },
        { type: 'received', content: '好的，我来看看这个需求', time: '10:30' }
      ],
      2: [
        { type: 'sent', content: '老师，关于那个农技问题', time: '昨天 15:20' },
        { type: 'received', content: '谢谢老师的指导', time: '昨天 15:45' }
      ],
      3: [
        { type: 'received', content: '项目进展如何？', time: '周二 14:30' }
      ]
    },
    // 这里可指定你自己的豆包模型名，例如："ep-xxx" 或 "doubao-pro-4k"
    aiModel: 'ep-20250921204605-btgwq',
    // 订阅消息模板ID配置：请替换为你在小程序后台申请的真实模板ID
    // 注意：开发者工具不支持订阅授权弹窗与消息下发测试，请用真机
    // 获取模板ID步骤：
    // 1. 登录微信公众平台 -> 小程序 -> 功能 -> 订阅消息
    // 2. 选择模板库中的模板或创建自定义模板
    // 3. 复制模板ID到下面的数组中
    subscribeTemplateIds: [
      'ONSBrxCMOlisjBd6dFEATTvdYvMTqXJStv45CnzAh2s'  // 订阅消息提醒模板
    ]
  }
})