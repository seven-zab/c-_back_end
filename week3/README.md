# week3 并发与内存安全训练

## 构建与运行
- Debug 构建：
  - `cmake -S week3 -B week3/build/Debug -DCMAKE_BUILD_TYPE=Debug`
  - `cmake --build week3/build/Debug -j`
  - 示例：`./week3/build/Debug/bin/demo_week3`
  - 测试：`ctest --test-dir week3/build/Debug -C Debug --output-on-failure`
- TSan 构建（WSL/Ubuntu 或 Linux/macOS）：
  - `cmake -S week3 -B week3/build/tsan -DENABLE_TSAN=ON -DCMAKE_BUILD_TYPE=Debug`
  - `cmake --build week3/build/tsan -j`
  - 运行并收集报告：`./week3/build/tsan/bin/demo_week3 2> week3/logs/tsan.txt`

## 目标
- 掌握 `std::thread` / `mutex` / `lock_guard` / `condition_variable` / `atomic`
- 复现并修复数据竞态与死锁，TSan 报告归零
- 通过中文注释理解关键并发与内存模型知识点