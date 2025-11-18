# 任务数据结构设计

## 数据库集合：tasks

### 任务文档结构

```javascript
{
  _id: "任务唯一ID",
  title: "任务标题",
  description: "任务描述",
  
  // 关联信息
  demandId: "关联的需求ID",
  publisherId: "发布者openid",
  assigneeId: "接取者openid",
  
  // 任务状态
  status: "pending|in_progress|completed|cancelled",
  
  // 位置信息
  location: "指定地点（可选）",
  
  // 时间信息
  createdAt: Date,
  updatedAt: Date,
  deadline: Date, // 截止时间（可选）
  
  // 时间线步骤
  timeline: [
    {
      title: "步骤标题",
      description: "步骤描述",
      completed: false,
      completedAt: null // 完成时间
    }
  ],
  
  // 其他信息
  priority: "low|medium|high", // 优先级
  tags: ["标签1", "标签2"], // 标签
  attachments: [ // 附件
    {
      type: "image|file",
      url: "文件URL",
      name: "文件名"
    }
  ]
}
```

## 任务状态说明

- **pending**: 待开始 - 任务已创建但尚未开始
- **in_progress**: 进行中 - 任务正在执行
- **completed**: 已完成 - 所有步骤都已完成
- **cancelled**: 已取消 - 任务被取消

## 默认时间线模板

根据不同类型的需求，可以设置不同的默认时间线：

### 通用任务模板
```javascript
[
  {
    title: "接受任务",
    description: "确认接受此任务",
    completed: true, // 接取时自动完成
    completedAt: new Date()
  },
  {
    title: "开始执行",
    description: "开始执行任务内容",
    completed: false,
    completedAt: null
  },
  {
    title: "到达指定地点",
    description: "到达任务指定的地点（如有）",
    completed: false,
    completedAt: null
  },
  {
    title: "完成任务内容",
    description: "完成任务的主要内容",
    completed: false,
    completedAt: null
  },
  {
    title: "任务验收",
    description: "任务完成，等待验收",
    completed: false,
    completedAt: null
  }
]
```

### 配送类任务模板
```javascript
[
  {
    title: "接受配送任务",
    description: "确认接受配送任务",
    completed: true,
    completedAt: new Date()
  },
  {
    title: "前往取货地点",
    description: "前往指定的取货地点",
    completed: false,
    completedAt: null
  },
  {
    title: "取货确认",
    description: "确认取到货物",
    completed: false,
    completedAt: null
  },
  {
    title: "前往配送地点",
    description: "前往指定的配送地点",
    completed: false,
    completedAt: null
  },
  {
    title: "配送完成",
    description: "成功配送到指定地点",
    completed: false,
    completedAt: null
  }
]
```

## 数据库索引建议

```javascript
// 为提高查询性能，建议创建以下索引：

// 1. 按接取者查询任务
db.tasks.createIndex({ "assigneeId": 1, "status": 1, "createdAt": -1 })

// 2. 按发布者查询任务
db.tasks.createIndex({ "publisherId": 1, "status": 1, "createdAt": -1 })

// 3. 按需求ID查询任务
db.tasks.createIndex({ "demandId": 1 })

// 4. 按状态和创建时间查询
db.tasks.createIndex({ "status": 1, "createdAt": -1 })
```

## 状态流转规则

```
pending → in_progress → completed
   ↓           ↓
cancelled   cancelled
```

- 任务创建时状态为 `pending`
- 接取者开始第一个步骤时状态变为 `in_progress`
- 所有步骤完成时状态变为 `completed`
- 任何时候都可以取消任务，状态变为 `cancelled`