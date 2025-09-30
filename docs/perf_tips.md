# Day 6 常见问题：为什么程序运行很快？如何加重负载

现象：在 `RelWithDebInfo` 构建下，以下示例可能只需几毫秒到数百毫秒：

```
./build/RelWithDebInfo/demo_perf --mode matmul  --size 220      --iters 1   # ~3ms
./build/RelWithDebInfo/demo_perf --mode branch  --size 5000000  --mod 7     # ~10ms
./build/RelWithDebInfo/demo_perf --mode burn    --size 50000000            # ~0.7s
```

原因分析（正常现象）：
- 算例规模偏小：`matmul_naive` 在 `N=220` 时仅约 `220^3 ≈ 10.6M` 次乘加，现代 CPU 很快即可完成。
- Release 优化生效：`RelWithDebInfo` 使用 `-O2 -g`，编译器可能进行循环展开、向量化、内联等优化，显著缩短时间。
- 工作集较小：矩阵与数据可以驻留于 L2/L3 缓存，访存瓶颈不明显，热点集中在算术指令。
- 分支模式较为简单：随机分布下预测器整体有效，整数算术开销极低。
- perf 采样开销很低：不会显著拖慢目标程序（除非采样频率极高）。

对策：让程序更“重”，便于观察热点
- 增大规模或迭代次数（推荐运行 0.5–3 秒，采样更稳定）：
  - 矩阵乘：`./demo_perf --mode matmul --size 1200 --iters 3`
  - 分支模式：`./demo_perf --mode branch --size 50000000 --mod 7`
  - 忙循环：`./demo_perf --mode burn --size 250000000`

- 或使用 Debug 构建（更慢，但热点形态与 Release 不同）：
  ```bash
  cmake -S . -B build/Debug -DCMAKE_BUILD_TYPE=Debug
  cmake --build build/Debug -j
  ./build/Debug/demo_perf --mode matmul --size 400 --iters 3
  ```

- 提升采样频率（更密集的样本）：
  ```bash
  perf record -F 400 -g -- ./build/RelWithDebInfo/demo_perf --mode matmul --size 1200 --iters 3
  perf report
  ```

- 制造访存压力（进阶练习，需修改代码）：
  - 更差的访问次序或跨步访问，使缓存局部性下降；
  - 例如在矩阵乘中改变循环顺序、引入大步长访问，观察热点迁移。

提示：
- 初学 perf 的目标是看清“热点在哪里、为何在那里”。运行够久（>0.5s）能获得更稳定的采样，不必追求极慢的程序。
- 在 Release 下做性能分析更贴近真实场景；Debug 仅用于演示与教学，但其热点通常与生产形态不同。