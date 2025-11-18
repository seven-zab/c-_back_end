const UserState = require('../../utils/userState.js');
const CloudHelper = require('../../utils/cloudHelper.js');

Page({
  data: {
    testResults: [],
    loading: false,
    user: null,
    testDemandId: null,
    testApplicationId: null,
    testTaskId: null
  },

  onLoad() {
    const user = UserState.syncUserState();
    this.setData({ user });
  },

  // 开始完整测试流程
  async startFullTest() {
    this.setData({ loading: true, testResults: [] });
    
    try {
      await this.testDatabaseCollections();
      await this.testCreateTestDemand();
      await this.testApplyForTask();
      await this.testApproveApplication();
      await this.testTimelineFunction();
      
      this.addResult('✅ 所有测试完成！', 'success');
    } catch (error) {
      this.addResult(`❌ 测试失败: ${error.message}`, 'error');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 测试数据库集合
  async testDatabaseCollections() {
    this.addResult('🔍 检查数据库集合...', 'info');
    
    try {
      const result = await CloudHelper.callCloudFunction('initDatabase', {
        action: 'checkCollections'
      });
      
      if (result.result && result.result.success) {
        const collections = result.result.collections;
        const requiredCollections = ['demands', 'task_applications', 'tasks', 'users', 'messages', 'contacts', 'sms_codes'];
        
        for (const collection of requiredCollections) {
          if (collections.includes(collection)) {
            this.addResult(`✅ ${collection} 集合存在`, 'success');
          } else {
            this.addResult(`❌ ${collection} 集合不存在`, 'error');
            throw new Error(`缺少必要的集合: ${collection}`);
          }
        }
      } else {
        throw new Error('无法检查数据库集合');
      }
    } catch (error) {
      this.addResult(`❌ 数据库检查失败: ${error.message}`, 'error');
      throw error;
    }
  },

  // 创建测试需求
  async testCreateTestDemand() {
    this.addResult('📝 创建测试需求...', 'info');
    
    try {
      const db = wx.cloud.database();
      const demandData = {
        title: '测试任务申请功能',
        content: '这是一个用于测试任务申请和时间线功能的测试需求',
        location: '测试地点',
        publisherOpenid: this.data.user.openid,
        publisherName: this.data.user.nickName || '测试用户',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('demands').add({
        data: demandData
      });
      
      this.setData({ testDemandId: result._id });
      this.addResult(`✅ 测试需求创建成功: ${result._id}`, 'success');
    } catch (error) {
      this.addResult(`❌ 创建测试需求失败: ${error.message}`, 'error');
      throw error;
    }
  },

  // 测试申请任务
  async testApplyForTask() {
    this.addResult('📋 测试任务申请...', 'info');
    
    try {
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'applyTask',
        data: {
          demandId: this.data.testDemandId,
          demandTitle: '测试任务申请功能',
          demandContent: '这是一个用于测试任务申请和时间线功能的测试需求',
          demandPublisherOpenid: this.data.user.openid,
          demandPublisherName: this.data.user.nickName || '测试用户',
          location: '测试地点'
        }
      });
      
      if (result.result && result.result.success) {
        this.setData({ testApplicationId: result.result.applicationId });
        this.addResult(`✅ 任务申请成功: ${result.result.applicationId}`, 'success');
      } else {
        throw new Error(result.result?.error || '申请失败');
      }
    } catch (error) {
      this.addResult(`❌ 任务申请失败: ${error.message}`, 'error');
      throw error;
    }
  },

  // 测试批准申请
  async testApproveApplication() {
    this.addResult('✅ 测试申请批准...', 'info');
    
    try {
      const result = await CloudHelper.callCloudFunction('task', {
        action: 'approveTaskApplication',
        data: {
          applicationId: this.data.testApplicationId,
          approved: true
        }
      });
      
      if (result.result && result.result.success) {
        this.setData({ testTaskId: result.result.taskId });
        this.addResult(`✅ 申请批准成功，任务ID: ${result.result.taskId}`, 'success');
      } else {
        throw new Error(result.result?.error || '批准失败');
      }
    } catch (error) {
      this.addResult(`❌ 申请批准失败: ${error.message}`, 'error');
      throw error;
    }
  },

  // 测试时间线功能
  async testTimelineFunction() {
    this.addResult('⏰ 测试时间线功能...', 'info');
    
    try {
      // 获取任务详情
      const detailResult = await CloudHelper.callCloudFunction('task', {
        action: 'getTaskDetail',
        data: { taskId: this.data.testTaskId }
      });
      
      if (detailResult.result && detailResult.result.success) {
        const task = detailResult.result.task;
        this.addResult(`✅ 获取任务详情成功，时间线步骤数: ${task.timeline.length}`, 'success');
        
        // 测试更新第一个步骤
        const updateResult = await CloudHelper.callCloudFunction('task', {
          action: 'updateTaskProgress',
          data: {
            taskId: this.data.testTaskId,
            stepIndex: 0,
            completed: true
          }
        });
        
        if (updateResult.result && updateResult.result.success) {
          this.addResult('✅ 时间线步骤更新成功', 'success');
        } else {
          throw new Error('时间线更新失败');
        }
      } else {
        throw new Error('获取任务详情失败');
      }
    } catch (error) {
      this.addResult(`❌ 时间线测试失败: ${error.message}`, 'error');
      throw error;
    }
  },

  // 清理测试数据
  async cleanupTestData() {
    this.addResult('🧹 清理测试数据...', 'info');
    
    try {
      const db = wx.cloud.database();
      
      // 删除测试需求
      if (this.data.testDemandId) {
        await db.collection('demands').doc(this.data.testDemandId).remove();
        this.addResult('✅ 测试需求已删除', 'success');
      }
      
      // 删除测试申请
      if (this.data.testApplicationId) {
        await db.collection('task_applications').doc(this.data.testApplicationId).remove();
        this.addResult('✅ 测试申请已删除', 'success');
      }
      
      // 删除测试任务
      if (this.data.testTaskId) {
        await db.collection('tasks').doc(this.data.testTaskId).remove();
        this.addResult('✅ 测试任务已删除', 'success');
      }
      
      this.addResult('🎉 测试数据清理完成', 'success');
    } catch (error) {
      this.addResult(`❌ 清理失败: ${error.message}`, 'error');
    }
  },

  // 初始化数据库
  async initDatabase() {
    this.setData({ loading: true });
    
    try {
      this.addResult('🔧 初始化数据库...', 'info');
      
      const result = await CloudHelper.callCloudFunction('initDatabase', {
        action: 'init'
      });
      
      if (result.result && result.result.success) {
        this.addResult('✅ 数据库初始化成功', 'success');
      } else {
        this.addResult(`❌ 数据库初始化失败: ${result.result?.error || '未知错误'}`, 'error');
      }
    } catch (error) {
      this.addResult(`❌ 数据库初始化失败: ${error.message}`, 'error');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 跳转到任务时间线页面
  goToTimeline() {
    if (this.data.testTaskId) {
      wx.navigateTo({
        url: `/pages/task/timeline?taskId=${this.data.testTaskId}`
      });
    } else {
      wx.showToast({ title: '请先运行测试创建任务', icon: 'none' });
    }
  },

  // 跳转到申请管理页面
  goToApplications() {
    wx.navigateTo({
      url: '/pages/task/applications'
    });
  },

  // 添加测试结果
  addResult(message, type) {
    const results = this.data.testResults;
    results.push({
      message,
      type,
      time: new Date().toLocaleTimeString()
    });
    this.setData({ testResults: results });
  },

  // 清空结果
  clearResults() {
    this.setData({ testResults: [] });
  }
});