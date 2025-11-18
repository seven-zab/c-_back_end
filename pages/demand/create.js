// 新增：需求分类配置（按三大板块 → 大类 → 具体项）
const CloudHelper = require('../../utils/cloudHelper.js');

const CATEGORY_CONFIG = {
  '企需通': {
    categories: ['生产技术类', '人才引进类', '其他'],
    subMap: {
      '生产技术类': [
        '生产工艺优化需求：例如“生产线流程改造技术支持需求”',
        '生产设备维护技术需求：像“大型工业设备故障诊断技术需求”',
        '电子元件生产技术需求：像“高精度芯片封装技术需求”'
      ],
      '人才引进类': [
        '高端技术人才招聘需求：比如“人工智能算法专家招聘需求”',
        '专业技能实习生招聘需求：例如“机械设计专业实习生招聘需求”',
        '市场营销人才招聘需求：比如“新媒体营销策划人才招聘需求”',
        '财务专业人才招聘需求：例如“成本核算高级财务人才招聘需求”'
      ],
      '其他': ['其他']
    }
  },
  '农践帮': {
    categories: ['采摘/打包类', '销售（电商）类', '校内直播基地类', '果园（当地）直播类', '其他'],
    subMap: {
      '采摘/打包类': [
        '特定果蔬采摘需求：像“蜜李高效采摘人手需求”',
        '农产品标准化打包需求：例如“柑橘分级打包技术及人手需求”'
      ],
      '销售（电商）类': [
        '农产品电商店铺运营需求：比如“农产品直播带货运营团队需求”',
        '农产品电商物流配送需求：例如“海产品冷链物流合作需求”',
        '农产品电商文案创作需求：比如“农产品详情页文案撰写需求”',
        '农产品电商客服需求：例如“农产品售后客服团队搭建需求”'
      ],
      '校内直播基地类': [
        '校内直播帮助售卖：提供从选品、脚本策划到直播执行的全流程支持，助力拓展线上销售渠道。'
      ],
      '果园（当地）直播类': [
        '果园直播策划需求：比如“果园丰收主题直播策划执行需求”',
        '果园直播技术保障需求：例如“果园现场网络搭建技术需求”',
        '果园直播后期剪辑需求：例如“果园直播视频片段剪辑需求”'
      ],
      '其他': ['其他']
    }
  },
  '技研实践厅': {
    categories: ['种植技术（农业）类', '机械技术（机器）类（硬件）', '智能技术类（软件）', '其他'],
    subMap: {
      '种植技术（农业）类': [
        '新品种培育技术需求',
        '精准农业种植技术需求：例如“农田土壤监测与智能灌溉技术需求”'
      ],
      '机械技术（机器）类（硬件）': [
        '农业机械研发需求：比如“小型山地果园采摘机械研发需求”',
        '工业机械升级改造需求：例如“老旧机床数控化改造技术需求”'
      ],
      '智能技术类（软件）': [
        '农业智能管理系统需求：像“农场生产数据智能分析系统需求”',
        '工业智能监控系统需求：例如“工厂设备运行状态智能监控系统需求”'
      ],
      '其他': ['其他']
    }
  }
};

Page({
  data: {
    types: ['企需通','农践帮','技研实践厅'],
    typeIndex: 0,
    // 新增：按类型动态生成的大类与具体项
    categories: CATEGORY_CONFIG['企需通'].categories,
    categoryIndex: 0,
    subs: CATEGORY_CONFIG['企需通'].subMap['生产技术类'],
    subIndex: 0,
    // 旧字段
    title: '',
    content: '',
    contact: '',
    phone: '',
    region: [],
    detailAddress: '',
    requirement: '',
    // 新增：帮扶要求结构化选项
    eduOptions: ['不限','专科及以上','本科及以上','硕士及以上','博士'],
    eduIndex: 0,
    startDate: '',
    endDate: '',
    // 新增：“无”选项，并放在首位以便互斥处理
    skillOptions: ['无','自动化','软件基础','机械设计','电气工程','数据分析','直播运营','文案策划','冷链物流'],
    skillsSelected: []
  },
  onLoad(options) {
    // 若从模块页带入类型
    if (options && options.type) {
      const idx = this.data.types.indexOf(options.type)
      if (idx >= 0) {
        const cfg = CATEGORY_CONFIG[this.data.types[idx]];
        const categories = cfg.categories;
        const firstCat = categories[0];
        const subs = cfg.subMap[firstCat] || [];
        this.setData({ typeIndex: idx, categories, categoryIndex: 0, subs, subIndex: 0 })
      }
    } else {
      // 初始化一次
      const cfg = CATEGORY_CONFIG[this.data.types[0]];
      const categories = cfg.categories;
      const firstCat = categories[0];
      const subs = cfg.subMap[firstCat] || [];
      this.setData({ categories, subs })
    }
  },
  onTypeChange(e) {
    const typeIndex = Number(e.detail.value);
    const type = this.data.types[typeIndex];
    const cfg = CATEGORY_CONFIG[type];
    const categories = cfg.categories;
    const firstCat = categories[0];
    const subs = cfg.subMap[firstCat] || [];
    this.setData({ typeIndex, categories, categoryIndex: 0, subs, subIndex: 0 })
  },
  onCategoryChange(e) {
    const categoryIndex = Number(e.detail.value);
    const category = this.data.categories[categoryIndex];
    const type = this.data.types[this.data.typeIndex];
    const subs = CATEGORY_CONFIG[type].subMap[category] || [];
    this.setData({ categoryIndex, subs, subIndex: 0 })
  },
  onSubChange(e) {
    this.setData({ subIndex: Number(e.detail.value) })
  },
  onEduChange(e) {
    this.setData({ eduIndex: Number(e.detail.value) })
  },
  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value })
  },
  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value })
  },
  onSkillsChange(e) {
    const prev = this.data.skillsSelected || []
    let vals = e.detail.value || []
    const NONE = '无'
    const hasNoneNow = vals.includes(NONE)
    const hasOthersNow = vals.some(v => v !== NONE)
    const hadNonePrev = prev.includes(NONE)
    // 互斥规则：
    // - 若之前选了“无”，现在又选了其他，则移除“无”。
    // - 若之前选了其他，现在勾选“无”，则只保留“无”。
    if (hasNoneNow && hasOthersNow) {
      if (hadNonePrev) {
        vals = vals.filter(v => v !== NONE)
      } else {
        vals = [NONE]
      }
    }
    this.setData({ skillsSelected: vals })
  },
  onRegionChange(e) {
    this.setData({ region: e.detail.value || [] })
  },
  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },
  async onSubmit() {
    const { types, typeIndex, title, contact, phone, region, detailAddress, eduOptions, eduIndex, startDate, endDate, skillsSelected, content } = this.data

    if (!title || !contact || !phone) {
      wx.showToast({ title: '请完善必填信息', icon: 'none' })
      return
    }
    if (!region || region.length !== 3) {
      wx.showToast({ title: '请选择省/市/区', icon: 'none' })
      return
    }

    // 由选择项生成内容与要求
    const type = types[typeIndex];
    const category = this.data.categories[this.data.categoryIndex];
    const sub = this.data.subs[this.data.subIndex] || '';
    const contentAuto = `${category}${sub ? ' - ' + sub : ''}`;
    const contentExtra = (content || '').trim();

    const edu = eduOptions[eduIndex];
    const timeStr = (this.data.startDate && this.data.endDate) ? `${this.data.startDate} 至 ${this.data.endDate}` : '';
    const skillsStr = (skillsSelected && skillsSelected.length) ? skillsSelected.join('、') : '';
    const requirement = [
      `学历：${edu}`,
      timeStr ? `时间：${timeStr}` : '',
      skillsStr ? `技能：${skillsStr}` : ''
    ].filter(Boolean).join('；');

    try {
      const db = wx.cloud.database()
      const item = {
        type: type,
        title,
        content: contentAuto,
        contentExtra, // 新增：详细需求（选填）
        // 分类结构化字段
        categoryL1: category,
        categoryL2: sub,
        // 联系方式 & 地区
        contact,
        phone,
        region,
        regionStr: region.join(' '),
        detailAddress,
        // 要求结构化字段
        eduLevel: edu,
        timeStart: this.data.startDate || '',
        timeEnd: this.data.endDate || '',
        skills: skillsSelected,
        // 文本化展示字段（兼容旧详情页）
        requirement,
        time: '刚刚',
        createdAt: Date.now()
      }
      const res = await db.collection('demands').add({ data: item })
      wx.showToast({ title: '发布成功', icon: 'success' })
      // 发布成功后尝试申请订阅并发送订阅消息（需用户先授权）
      try {
        const app = getApp();
        const tmplIds = (app.globalData && app.globalData.subscribeTemplateIds) || [];
        if (tmplIds && tmplIds.length) {
          // 先请求订阅授权（如果用户未授权会弹窗，真机有效）
          const subRes = await wx.requestSubscribeMessage({ tmplIds });
          const acceptedId = tmplIds.find(id => subRes && subRes[id] === 'accept');
          // 使用第一个被允许的模板ID发送消息
          const templateId = acceptedId || tmplIds[0];
          if (wx.cloud && templateId) {
            const sendData = {
              // 请根据你的模板字段调整，示例使用 thing1/time2
              thing1: { value: `需求已发布：${title}`.slice(0,20) },
              time2: { value: new Date().toISOString().slice(0, 19).replace('T', ' ') }
            };
            await CloudHelper.callCloudFunction('login', {
              action: 'sendSubscribe', 
              templateId, 
              page: `pages/demand/detail?id=${res._id || ''}`, 
              data: sendData
            });
          }
        }
      } catch (e) {
        console.warn('发布后订阅消息流程异常或被拒绝', e);
      }
      setTimeout(() => { wx.navigateBack() }, 600)
    } catch (e) {
      console.error(e)
      wx.showToast({ title: '发布失败，请重试', icon: 'none' })
    }
  }
})