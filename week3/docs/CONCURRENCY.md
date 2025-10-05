# 周3：并发与内存安全（week3）

## 学习点
- `std::thread` / `std::mutex` / `std::lock_guard` / `std::unique_lock`
- `std::condition_variable` / 伪唤醒与谓词
- `std::atomic` 与内存模型基础（顺序一致性、relaxed、acq/rel）
- 常见竞态与死锁、锁粒度与分层设计

## 实践目标
- 实现线程安全的 `BoundedQueue`（阻塞 + 超时 + 统计）
- 生产者-消费者示例，观察背压与等待统计
- 运行 TSan 发现并修复 1–2 个并发缺陷
- 用 gdb 观察多线程栈与死锁现场

## 代码结构
- `include/bounded_queue.h`：接口与并发设计要点（中文注释）
- `src/bounded_queue.cpp`：条件变量阻塞与超时、统计采集
- `app/demo_week3.cpp`：
  - 生产者-消费者（队列）
  - 数据竞态演示（未同步 vs atomic）
  - 死锁演示与修复（scoped_lock）
- `tests/test_week3.cpp`：基本功能与并发正确性测试
- `logs/tsan.txt`：TSan 报告示例（占位）

## 并发设计关键点
- 队列受 `mutex` 保护；条件变量 `not_full`/`not_empty` 分别对应入队/出队等待
- 使用 `wait_for(lock, timeout, predicate)` 搭配谓词防止伪唤醒
- 入队后 `notify_one(not_empty)`，出队后 `notify_one(not_full)`
- 指标使用 `std::atomic<size_t>` 记录次数，便于监控与告警

## TSan（ThreadSanitizer）运行指南
- Windows/MSVC 不支持 `-fsanitize=thread`；建议在 WSL/Ubuntu 或 Linux/macOS 下进行
- 构建：
  - `cmake -S week3 -B week3/build/tsan -DENABLE_TSAN=ON -DCMAKE_BUILD_TYPE=Debug`
  - `cmake --build week3/build/tsan -j`
- 运行：
  - `./week3/build/tsan/bin/demo_week3 2> week3/logs/tsan.txt`
- 期望：
  - TSan 报告 `inc_race` 的 data race；修复路径是用 `std::atomic` 或在共享变量上加锁
  - 死锁示例在未修复模式下可能卡住；用 gdb 观察（见下）

## gdb 观察多线程栈
- `gdb ./week3/build/Debug/bin/demo_week3`
- 命令：
  - `info threads` 查看所有线程
  - `thread apply all bt` 打印所有线程栈
  - 对死锁示例：在卡住时，观察两个线程分别在哪个锁等待

## 达标标准
- 能稳定复现并修复 1–2 个并发缺陷（TSan 报告归零）
- 写清楚缺陷成因、复现步骤、修复策略（比如统一锁顺序、使用 `scoped_lock`、将共享变量改为 `atomic`）

## 后续扩展
- 队列模板化并支持移动语义、批量 pop/push 降低唤醒成本
- 引入线程池、令牌桶限流、批处理
- 更完整的指标上报（Prometheus）与告警策略