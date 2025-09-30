/*
 * 文件：app/demo_perf.cpp
 * 概述：命令行程序，用于驱动 mycore 库的热点函数执行，
 *       便于在 perf record/report/top 中观察热点符号与调用栈。
 * 模式：
 *   - matmul：朴素矩阵乘法（--size=N --iters=K）
 *   - branch：分支密集求和（--size=count --mod=M）
 *   - burn：  浮点忙循环（--size=iterations）
 *
 * 构建建议：使用 RelWithDebInfo（-O2 -g），便于 perf 解析符号。
 */
#include "mycore/hotspots.hpp"

#include <chrono>
#include <iostream>
#include <random>
#include <string>
#include <vector>

namespace {

// 命令行参数容器：统一管理模式与各参数。
struct Args {
    std::string mode = "matmul"; // 支持：matmul | branch | burn
    int size = 200;               // matmul：矩阵阶数；branch：数据规模；burn：迭代次数
    int iters = 1;                // matmul：重复计算次数（增强采样信号）
    int mod = 7;                  // branch：分支取模参数
};

/**
 * 解析命令行参数。
 * 支持：--mode / --size / --iters / --mod 与 --help。
 */
Args parse(int argc, char** argv) {
    Args a;
    for (int i = 1; i < argc; ++i) {
        std::string s(argv[i]);
        auto eat = [&](const std::string& key, auto& out) {
            if (s == key && i + 1 < argc) {
                std::string v(argv[++i]);
                if constexpr (std::is_same_v<decltype(out), int&>) {
                    out = std::stoi(v);
                } else {
                    out = v;
                }
                return true;
            }
            return false;
        };
        if (eat("--mode", a.mode)) continue;
        if (eat("--size", a.size)) continue;
        if (eat("--iters", a.iters)) continue;
        if (eat("--mod", a.mod)) continue;
        if (s == "--help" || s == "-h") {
            std::cout << "Usage: demo_perf [--mode matmul|branch|burn] [--size N] [--iters K] [--mod M]\n";
            std::cout << "  matmul: NxN naive multiply, --size=N, --iters=K\n";
            std::cout << "  branch: sum with branchy pattern, --size=count, --mod=M\n";
            std::cout << "  burn:   floating-point busy loop, --size=iterations\n";
            std::exit(0);
        }
    }
    return a;
}

/**
 * 计时辅助：执行传入函数并返回结果与耗时（毫秒）。
 */
template <class F>
auto timed(F&& f) {
    auto t0 = std::chrono::steady_clock::now();
    auto result = f();
    auto t1 = std::chrono::steady_clock::now();
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
    return std::pair(result, ms);
}

} // namespace

/**
 * 主流程：根据模式调用对应的热点函数，打印校验值与时间。
 * 输出格式固定，便于在脚本或日志中解析。
 */
int main(int argc, char** argv) {
    auto args = parse(argc, argv);

    if (args.mode == "matmul") {
        // 朴素矩阵乘法：输出 checksum / N / iters / time_ms
        auto [checksum, ms] = timed([&] {
            return mycore::matmul_naive(args.size, args.iters);
        });
        std::cout << "matmul_naive checksum=" << checksum
                  << " N=" << args.size
                  << " iters=" << args.iters
                  << " time_ms=" << ms << "\n";
        return 0;
    }

    if (args.mode == "branch") {
        // 构造确定性数据：便于复现实验与对比
        std::vector<int> data;
        data.reserve(static_cast<std::size_t>(args.size));
        std::mt19937 rng(42);
        std::uniform_int_distribution<int> dist(1, 1000000);
        for (int i = 0; i < args.size; ++i) data.push_back(dist(rng));

        // 分支密集求和：输出 acc / count / mod / time_ms
        auto [acc, ms] = timed([&] {
            return mycore::sum_with_branch(data, args.mod);
        });
        std::cout << "sum_with_branch acc=" << acc
                  << " count=" << args.size
                  << " mod=" << args.mod
                  << " time_ms=" << ms << "\n";
        return 0;
    }

    if (args.mode == "burn") {
        // 浮点忙循环：仅输出迭代次数与耗时
        auto [_, ms] = timed([&] {
            mycore::burn_cpu(static_cast<std::size_t>(args.size));
            return 0;
        });
        std::cout << "burn_cpu iterations=" << args.size
                  << " time_ms=" << ms << "\n";
        return 0;
    }

    std::cerr << "Unknown mode: " << args.mode << " (use --help)\n";
    return 1;
}