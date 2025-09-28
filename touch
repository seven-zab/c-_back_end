#include "buggy.hpp"

#include <iostream>
#include <vector>

/*
Day4 主程序：
- 第一步会调用 buggy::crash_demo()，若当前目录下没有 sample.txt，将立刻崩溃。
- 第二步会调用 buggy::min_value()，该函数存在越界访问的 Bug。

GDB 调试建议：
1) 为崩溃设置断点：在 crash_demo 上下断点，运行程序，程序在 fclose 崩溃时用 backtrace(bt) 查看调用栈。
2) 检查变量：print fp 查看其值是否为 0x0（nullptr）。
3) 修复思路：在 buggy.cpp 中先判断 if (fp) fclose(fp); 或者确保 sample.txt 存在。
4) 越界问题：为 min_value 设置断点，单步执行，观察 i 在 v.size() 处的行为，修复为 i < v.size()。
*/

int main() {
  std::cout << "[Day4] Running crash_demo..." << std::endl;
  buggy::crash_demo(); // 若 sample.txt 不存在，这里会崩溃

  std::cout << "[Day4] Running min_value..." << std::endl;
  std::vector<int> nums = {5, 3, 4};
  int m = buggy::min_value(nums); // 此处可能因越界出现未定义行为或错误结果
  std::cout << "min = " << m << std::endl;

  return 0;
}
