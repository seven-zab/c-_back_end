#include "buggy.hpp"

#include <cstdio>    // fopen, fclose
#include <iostream>  // std::cout
#include <vector>

namespace buggy {

void crash_demo() {
  // 说明：这里为了演示崩溃，在打开失败时会得到空指针（nullptr），随后直接 fclose(nullptr) 会导致段错误。
  // 在 Linux/glibc 下，_IO_new_fclose 会对无效指针崩溃，这非常适合用 GDB 练习。
  FILE* fp = std::fopen("sample.txt", "r");
  // 故意制造错误：不检查 fp 是否为 nullptr 就关闭它
  if (fp) {
    std::fclose(fp);
  } else {
    std::cout << "警告：无法打开 sample.txt 文件" << std::endl;
  }
  //std::fclose(fp);
}

int min_value(const std::vector<int>& v) {
  // 故意的 Bug：循环边界使用了 <=，导致在 i == v.size() 时访问 v[i] 越界
  // 正确写法应该是 i < v.size()
  int m = v[0];
  for (std::size_t i = 0; i <= v.size(); ++i) {
    if (v[i] < m) m = v[i]; // 当 i == v.size() 时发生越界访问
  }
  return m;
}

} // namespace buggy
