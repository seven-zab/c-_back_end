# 数据库集合初始化指南

## 问题描述
当前项目出现 `collection not exist` 错误，这是因为云数据库中缺少必要的集合。

## 需要创建的集合

### 1. task_applications (任务申请集合)
用于存储用户的任务申请记录。

**字段结构：**
```json
{
  "_id": "自动生成",
  "demandId": "需求ID",
  "demandTitle": "需求标题", 
  "demandContent": "需求内容",
  "demandPublisher": "需求发布者",
  "demandPublisherOpenid": "发布者openid",
  "applicantOpenid": "申请者openid",
  "applicantName": "申请者姓名",
  "applicantAvatar": "申请者头像",
  "location": "位置信息",
  "type": "任务类型",
  "status": "状态(pending/approved/rejected)",
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 2. tasks (任务集合)
用于存储已确认的任务记录。

**字段结构：**
```json
{
  "_id": "自动生成",
  "demandId": "原需求ID",
  "title": "任务标题",
  "content": "任务内容", 
  "publisherOpenid": "发布者openid",
  "executorOpenid": "执行者openid",
  "status": "任务状态",
  "timeline": "时间线数组",
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 3. messages (消息集合)
用于存储系统消息通知。

**字段结构：**
```json
{
  "_id": "自动生成",
  "toOpenid": "接收者openid",
  "type": "消息类型",
  "title": "消息标题",
  "content": "消息内容",
  "data": "附加数据",
  "read": "是否已读",
  "createdAt": "创建时间"
}
```

## 创建步骤

### 方法1：通过微信开发者工具创建
1. 打开微信开发者工具
2. 点击"云开发"按钮
3. 进入"数据库"页面
4. 点击"+"创建集合
5. 分别创建以上三个集合：
   - `task_applications`
   - `tasks` 
   - `messages`

### 方法2：通过代码自动创建
运行以下云函数代码来自动创建集合：

```javascript
// 在云函数中执行
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 创建集合（如果不存在）
async function initDatabase() {
  try {
    // 尝试创建集合，如果已存在会忽略
    await db.createCollection('task_applications')
    await db.createCollection('tasks')
    await db.createCollection('messages')
    console.log('数据库集合创建成功')
  } catch (error) {
    console.log('集合可能已存在:', error)
  }
}
```

## 权限设置
确保为每个集合设置适当的读写权限：
- 读权限：仅创建者可读
- 写权限：仅创建者可写

## 验证
创建完成后，可以通过云开发控制台查看集合是否创建成功。