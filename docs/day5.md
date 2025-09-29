# Day 5 — Valgrind Memcheck 任务与操作指南

本页给出 Day 5 的详细任务拆解、操作指引、命令示例、预期输出与可交付模板。请在 WSL(Ubuntu) 环境内执行（路径示例以 e: 盘为准）。

## 一、目标
- 能用 Valgrind Memcheck 查找并定位：use-after-free、越界写、内存泄漏。
- 能将一次定位与修复过程记录为可复验的调试日志。

## 二、准备
- 在 Windows 终端中打开 Ubuntu（WSL）。
- 切换到项目目录：`cd /mnt/e/c++_backdown_learn`。
- 安装 Valgrind（如未安装）：`sudo apt update && sudo apt install -y valgrind`。
- Debug 构建：
  - `cmake -S . -B build/Debug -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON`
  - `cmake --build build/Debug -j`

## 三、任务清单（逐条执行）

1) 制造并观测“内存泄漏”
- 运行：`valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes ./build/Debug/demo_mem leak`
- 关注输出关键字：`definitely lost`、`indirectly lost`。
- 定位到函数：`mycore::leak_memory()`（见 `src/memory_issues.cpp`）。
- 修复验证：`./build/Debug/demo_mem_fixed`（其中 `fixed_no_leak()`），确保不再有 lost 报告。

2) 制造并观测“越界写（OOB）”
- 运行：`valgrind ./build/Debug/demo_mem oob`
- 关注输出关键字：`Invalid write of size ...`，并查看对应代码行。
- 定位到函数：`mycore::out_of_bounds_write()`。
- 修复验证：`./build/Debug/demo_mem_fixed`（其中 `fixed_bounds_safe()`）。

3) 制造并观测“use-after-free（UAF）”
- 运行：`valgrind ./build/Debug/demo_mem uaf`
- 关注输出关键字：`Use of freed memory` 或 `Invalid read of size ...`。
- 定位到函数：`mycore::use_after_free()`。
- 修复验证：`./build/Debug/demo_mem_fixed`（其中 `fixed_no_use_after_free()`）。

4) 记录一次完整排错过程
- 在 `logs/day5_valgrind_log.md` 记录一次从“运行 → 观察 → 定位 → 修复 → 复验”的完整过程与结论。
- 建议包含：命令、核心输出片段、对应代码行号、修复点、再次验证结果与结论。

## 四、示例输出（你应观察到类似结构）

内存泄漏示例（摘要）
```
==12345== HEAP SUMMARY:
==12345==    in use at exit: 432 bytes in 2 blocks
==12345==  total heap usage: 3 allocs, 1 frees, 1,234 bytes allocated
==12345== 432 bytes in 2 blocks are definitely lost in loss record ...
```

越界写示例（摘要）
```
==12345== Invalid write of size 4
==12345==    at 0x...: mycore::out_of_bounds_write (memory_issues.cpp:...)
==12345==  Address 0x... is 0 bytes after a block of size ... alloc'd
```

Use-after-free 示例（摘要）
```
==12345== Invalid read of size 4
==12345==    at 0x...: mycore::use_after_free (memory_issues.cpp:...)
==12345==  Address 0x... is 0 bytes inside a block of size 4 free'd
```

## 五、交付与验收
- 代码：本仓库（含 `src/`、`include/`、`app/` 与 `CMakeLists.txt`）。
- 调试日志：`logs/day5_valgrind_log.md`（完整排错记录）。
- 对比验证：`demo_mem_fixed` 在同样的 Valgrind 运行下不再报错/泄漏。

## 六、参考
- Valgrind 官方文档与 Memcheck 手册。
- C++ RAII 与智能指针（cppreference / C++ Core Guidelines）。