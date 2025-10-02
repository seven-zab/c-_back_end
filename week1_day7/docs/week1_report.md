# 一页周报（占位）

- 学到什么：RAII、异常安全、智能指针所有权、Rule of Zero/Five、CMake 项目组织
- 问题/现象/定位（gdb/valgrind/perf）与修改点
- 结论：资源管理改进与性能观察
- 最易错点：所有权边界、weak_ptr 场景、移动语义误用
- 仍需巩固：定制删除器、异常安全级别、测试与 CI
- 下周目标（示例）：
  - 引入 Catch2/GoogleTest 并配置 CI
  - 扩展 perf 指标与微基准
  - 丰富资源管理场景（网络/锁/线程）