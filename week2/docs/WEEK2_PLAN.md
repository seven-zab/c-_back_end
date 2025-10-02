# 周2训练计划

- 目标：并发与测试框架接入，提升工程质量。
- 任务：
  - 实现线程安全数据结构（BoundedQueue）并完善测试。
  - 接入静态检查与格式化（clang-tidy/cppcheck/clang-format）。
  - 编写并发问题记录（TSan/竞态/死锁案例）。
- 构建：
```
cmake -S week2 -B week2/build/Debug -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
cmake --build week2/build/Debug -j
ctest --test-dir week2/build/Debug -C Debug --output-on-failure
```