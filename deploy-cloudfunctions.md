# 云函数部署指南

## 自动部署（推荐）

在微信开发者工具中：

1. 打开"云开发"控制台
2. 点击"云函数"标签
3. 右键点击 `task` 文件夹
4. 选择"上传并部署：云端安装依赖"

## 手动部署步骤

### 1. 安装依赖
```bash
cd cloudfunctions/task
npm install
```

### 2. 上传云函数
在微信开发者工具中：
- 右键点击 `cloudfunctions/task`
- 选择"上传并部署：不校验域名"

## 验证部署

1. 在云开发控制台查看云函数列表
2. 确认 `task` 函数显示为"部署成功"
3. 可以在控制台测试云函数调用

## 云函数功能

### task 云函数支持的操作：

- `createTask`: 创建新任务
- `getTaskList`: 获取任务列表
- `getTaskDetail`: 获取任务详情
- `updateTaskProgress`: 更新任务进度
- `cancelTask`: 取消任务

### 调用示例：

```javascript
// 创建任务
wx.cloud.callFunction({
  name: 'task',
  data: {
    action: 'createTask',
    title: '测试任务',
    description: '这是一个测试任务',
    type: 'general'
  }
})

// 获取任务列表
wx.cloud.callFunction({
  name: 'task',
  data: {
    action: 'getTaskList',
    status: 'in_progress'
  }
})
```

## 注意事项

1. 确保云开发环境已初始化
2. 确保有足够的云函数调用次数配额
3. 部署后可能需要等待1-2分钟生效
4. 如遇到权限问题，检查云开发环境配置