#include "buggy.hpp"

#include <iostream>
#include <vector>
#include <cassert>
/*
最小测试程序：
- 仅测试 buggy::min_value()，当前实现会因为循环边界错误而越界访问。
- 在某些编译器或数据下可能直接崩溃，也可能返回错误结果。

修复后建议：
- 将 buggy.cpp 中的 for 条件修复为 i < v.size()。
- 也可添加更多断言覆盖空向量、单元素向量等情况。
*/

int main() {
  std::vector<int> v = {3, 1, 2};
  int m = buggy::min_value(v);
  std::cout << "min(v) = " << m << std::endl;
  // 期望最小值为 1，但当前实现可能由于越界而行为不正确
  assert(m == 1);
  return 0;
}
