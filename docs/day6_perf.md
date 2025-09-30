# Day 6：perf 入门与热点定位（可直接执行）

本目录已生成一个可用于 perf 的小项目（C++17，CMake）。包含：
- 库 `mycore`：实现若干热点函数（朴素矩阵乘、分支密集求和、浮点忙循环）。
- 可执行 `demo_perf`：命令行模式驱动运行上述函数并输出耗时。

建议在 WSL(Ubuntu) 中执行以下步骤。

## 1. 安装依赖（WSL 内执行）

```bash
sudo apt update && sudo apt install -y build-essential cmake linux-tools-common linux-tools-generic
# 可选：调试符号更舒服
sudo apt install -y gdb
```

若提示 perf 不可用，请确认当前内核版本对应的 `linux-tools-$(uname -r)`，例如：

```bash
sudo apt install -y linux-tools-$(uname -r)
```

如果报告权限问题，可临时放宽：

```bash
echo 1 | sudo tee /proc/sys/kernel/perf_event_paranoid
```

## 2. 构建（推荐 Release 或 RelWithDebInfo）

```bash
cmake -S . -B build/RelWithDebInfo -DCMAKE_BUILD_TYPE=RelWithDebInfo
cmake --build build/RelWithDebInfo -j
```

生成的可执行：`build/RelWithDebInfo/demo_perf`

## 3. 运行程序（确认可正常执行）

```bash
# 朴素矩阵乘（默认 N=200，iters=1）
./build/RelWithDebInfo/demo_perf --mode matmul --size 220 --iters 1

# 分支密集求和（数据量越大越明显）
./build/RelWithDebInfo/demo_perf --mode branch --size 5000000 --mod 7

# 浮点忙循环
./build/RelWithDebInfo/demo_perf --mode burn --size 50000000
```

输出示例（你的机器会不同）：

```
matmul_naive checksum=1.54232e+06 N=220 iters=1 time_ms=1234
sum_with_branch acc=123456789 count=5000000 mod=7 time_ms=450
burn_cpu iterations=50000000 time_ms=380
```

## 4. perf record / report 入门

以矩阵乘为例：

```bash
perf record -F 99 -g -- ./build/RelWithDebInfo/demo_perf --mode matmul --size 260 --iters 1
perf report
```

- `-F 99`：采样频率（Hz）。
- `-g`：采集调用栈，方便定位到函数/符号。

在 `perf report` 的 TUI 中，你应能看到 `mycore::matmul_naive` 占比最高；展开调用栈可看到内层三重循环符号。

分支模式：

```bash
perf record -F 99 -g -- ./build/RelWithDebInfo/demo_perf --mode branch --size 8000000 --mod 7
perf report
```

忙循环：

```bash
perf record -F 99 -g -- ./build/RelWithDebInfo/demo_perf --mode burn --size 150000000
perf report
```

## 5. perf top（实时查看）

```bash
perf top -g -- ./build/RelWithDebInfo/demo_perf --mode matmul --size 240 --iters 1
```

## 6. 常见问题

- 报告无符号或都在 `[unknown]`：使用 `RelWithDebInfo` 或 `-g` 编译（已经在 CMake 中为该配置开启了 `-g`）。
- `Permission denied`：调整 `perf_event_paranoid`（见上文）；或使用 `sudo perf ...`。
- 采集频率过低看不到热点：尝试增大 `-F` 或增大问题规模（如更大的 `--size`）。

## 7. 结论示例（你可以写入你的周报）

- 在本机上，`mycore::matmul_naive` 的热点集中在三重循环的内层乘加，说明缓存局部性差导致大量访存。
- `sum_with_branch` 的热点在分支判断与累加，分支预测失效会导致流水线停顿。
- 初步优化方向：矩阵乘可做块分解/重排，分支模式可改为无分支累加（如使用位运算或查表）。

---

项目结构：

```
include/mycore/hotspots.hpp
src/hotspots.cpp
app/demo_perf.cpp
CMakeLists.txt
```