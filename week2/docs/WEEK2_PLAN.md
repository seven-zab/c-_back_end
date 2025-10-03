# 周2训练计划

- 目标：并发与测试框架接入，提升工程质量。
- 任务：
  - 实现线程安全数据结构（BoundedQueue）并完善测试。
  - 接入静态检查与格式化（clang-tidy/cppcheck/clang-format）。
  - 编写并发问题记录（TSan/竞态/死锁案例）。
  - 新增阻塞 + 超时 + 背压示例：push_wait/pop_wait，打印队列统计指标。
- 构建：
```
cmake -S week2 -B week2/build/Debug -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
cmake --build week2/build/Debug -j
ctest --test-dir week2/build/Debug -C Debug --output-on-failure
./week2/build/Debug/bin/demo_concurrency
```

接口速览：
- `bool push(int) / bool pop(int&)`：非阻塞，满/空直接返回 false。
- `bool push_wait(int, std::chrono::milliseconds)`：满时等待，超时返回 false。
- `bool pop_wait(int&, std::chrono::milliseconds)`：空时等待，超时返回 false。
- `Stats stats()`：返回入队/出队/拒绝/等待等指标，用于背压与告警。