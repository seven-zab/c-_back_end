/*
 * 文件：src/hotspots.cpp
 * 概述：实现用于 perf 入门演示的热点函数，包括：
 *   - 朴素矩阵乘法 matmul_naive：三重循环，访存密集，易产生热点；
 *   - 分支密集求和 sum_with_branch：分支预测可能失效，观察控制流开销；
 *   - 浮点忙循环 burn_cpu：稳定的浮点计算负载，便于采样与报告。
 *
 * 说明：
 *   - 这些函数的实现刻意保持“未优化”的朴素形式，便于直接看到热点；
 *   - 返回值或内部使用校验累加（如 checksum、volatile 汇聚）以防过度优化；
 *   - 在 CMake 中使用 RelWithDebInfo（-O2 -g）更易在 perf report 中看到符号。
 */
#include "mycore/hotspots.hpp"

#include <algorithm>
#include <cmath>
#include <numeric>
#include <random>

namespace mycore {

/**
 * 朴素矩阵乘法：C = A x B（重复 iters 次）。
 *
 * 参数：
 *   - N：矩阵阶数（A、B、C 均为 N×N）。
 *   - iters：重复计算次数，用于延长执行时间、增强采样可见性。
 * 返回：
 *   - checksum：C 所有元素之和，用于防止编译器将计算移除。
 *
 * 性能特征：
 *   - 三重循环 O(N^3)；如果内存访问不友好，缓存命中率低，CPU 时间主要耗在乘加与访存；
 *   - perf report 中通常能看到该函数的符号占比最高，并在内层循环处形成热点。
 */
double matmul_naive(int N, int iters) {
    // Allocate row-major NxN matrices
    std::vector<double> A(static_cast<std::size_t>(N) * N);
    std::vector<double> B(static_cast<std::size_t>(N) * N);
    std::vector<double> C(static_cast<std::size_t>(N) * N);

    // Deterministic initialization
    for (int i = 0; i < N; ++i) {
        for (int j = 0; j < N; ++j) {
            A[static_cast<std::size_t>(i) * N + j] = (i + 1) * 0.001 + (j + 1) * 0.002;
            B[static_cast<std::size_t>(i) * N + j] = (i + 1) * 0.003 - (j + 1) * 0.001;
        }
    }

    auto idx = [N](int r, int c) { return static_cast<std::size_t>(r) * N + c; };

    for (int it = 0; it < iters; ++it) {
        std::fill(C.begin(), C.end(), 0.0);
        // 三重循环（i-k-j 次序）：内层 j 访问 B 的行，A 按行访问；该次序易产生访存开销
        for (int i = 0; i < N; ++i) {             // 遍历 C 的行
            for (int k = 0; k < N; ++k) {         // 固定 A 的列 / B 的行
                double aik = A[idx(i, k)];        // 读取 A(i,k)
                for (int j = 0; j < N; ++j) {     // 遍历 C 的列
                    C[idx(i, j)] += aik * B[idx(k, j)];
                }
            }
        }
    }

    // Compute checksum
    double checksum = std::accumulate(C.begin(), C.end(), 0.0);
    return checksum;
}

/**
 * 分支密集的加权求和：根据不同条件对元素进行不同权重累加。
 *
 * 参数：
 *   - data：输入数据序列。
 *   - mod：取模参数；当 mod != 0 且 v % mod == 0 时走第一条分支。
 * 返回：
 *   - long long：加权求和结果。
 *
 * 性能特征：
 *   - 数据分布与分支条件不匹配时，分支预测失效，造成流水线停顿；
 *   - perf 中可观察到该函数的热点集中在条件判断与累加处。
 */
long long sum_with_branch(const std::vector<int>& data, int mod) {
    long long acc = 0;
    for (std::size_t i = 0; i < data.size(); ++i) {
        int v = data[i];
        // Branch-heavy pattern to demonstrate perf hotspots
        if (mod != 0 && (v % mod) == 0) {
            acc += static_cast<long long>(v) * 3;
        } else if ((v & 1) == 0) {
            acc += static_cast<long long>(v) * 2;
        } else {
            acc += static_cast<long long>(v);
        }
    }
    return acc;
}

/**
 * 浮点忙循环：进行大量 sin/cos/sqrt 计算以形成稳定热点。
 *
 * 参数：
 *   - iterations：迭代次数，越大耗时越长。
 * 返回：
 *   - 无。
 *
 * 说明：
 *   - 使用 `volatile` 变量 `sink` 聚合结果，防止编译器把循环优化掉；
 *   - 适合 perf top 的实时观察或 perf record 的离线报告。
 */
void burn_cpu(std::size_t iterations) {
    volatile double sink = 0.0;
    for (std::size_t i = 0; i < iterations; ++i) {
        double x = std::sin(static_cast<double>(i) * 0.001);
        double y = std::cos(static_cast<double>(i) * 0.002);
        sink += x * y + std::sqrt(std::abs(x));
    }
}

}  // namespace mycore