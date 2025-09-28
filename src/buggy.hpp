#pragma once

#include <vector>
#include <string>

// Day4 练习：提供可复现的两个 Bug（崩溃与越界）以便使用 GDB 调试。
// - buggy::crash_demo(): 故意制造一次崩溃（关闭空指针 FILE*）
// - buggy::min_value(): 故意制造一个越界访问（for 循环边界错误）
// 你可以通过 GDB 跟踪调用栈、查看变量、设置断点进行练习。

namespace buggy {

// 故意制造崩溃的演示函数。
// 运行时如果 sample.txt 不存在，将触发对空指针的 fclose，导致段错误。
void crash_demo();

// 计算向量中的最小值（包含一个故意的边界错误）
// 参数：v - 输入整数向量，假定非空
// 返回：最小值
int min_value(const std::vector<int>& v);

} // namespace buggy
