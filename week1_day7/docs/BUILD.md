# 构建与运行说明

环境要求：WSL Ubuntu 或 Linux，已安装 `g++`、`cmake`、`gdb`、`valgrind`、`perf`。

Debug 构建（含编译数据库）：
```
cmake -S . -B build/Debug -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
cmake --build build/Debug -j
```

Release 构建：
```
cmake -S . -B build/Release -DCMAKE_BUILD_TYPE=Release
cmake --build build/Release -j
```

运行可执行：
```
build/Debug/bin/demo_raii
build/Debug/bin/demo_buffer
build/Debug/bin/demo_ownership
build/Release/bin/demo_perf
```

运行测试：
```
ctest --test-dir build/Debug -C Debug --output-on-failure
```

常见问题：
- `perf` 在部分系统需安装匹配 `linux-tools-*`，权限不足时调整 `kernel.perf_event_paranoid`。
- `valgrind` 会显著放慢程序，仅用于定位问题。