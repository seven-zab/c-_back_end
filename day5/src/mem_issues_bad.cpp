#include "mem_issues.hpp"
#include <cstdlib>
#include <new>
#include <vector>
#include <cstring>

namespace mycore {

static DemoResult make_result(bool ok, const char* msg) {
    return DemoResult{ok, std::string(msg)};
}

// 1) 内存泄漏：分配后不释放
DemoResult leak_memory_bad(std::size_t bytes) {
    char* p = (char*)std::malloc(bytes);
    if (!p) return make_result(false, "malloc failed");
    std::memset(p, 0xAB, bytes);
    // 故意不释放 p，导致泄漏
    return make_result(true, "allocated but leaked");
}

// 2) 越界访问：写到 vector 边界之外
DemoResult out_of_bounds_bad(std::size_t n) {
    std::vector<int> v(n, 0);
    if (n == 0) return make_result(false, "n == 0 invalid for demo");
    // 故意越界：有效索引为 [0, n-1]，这里写 v[n]
    v[n] = 42; // 未定义行为
    return make_result(true, "wrote out of bounds");
}

// 3) use-after-free：释放后继续访问
DemoResult use_after_free_bad() {
    int* p = new (std::nothrow) int[8];
    if (!p) return make_result(false, "new failed");
    p[0] = 1;
    delete[] p;
    
    // 释放后继续使用 - 更明确的使用模式
    int x = p[0]; // 未定义行为
    
    // 使用读取的值进行计算，确保编译器不会优化掉读取操作
    int y = x + 10;
    
    // 再次写入已释放的内存，增加检测几率
    p[1] = y;
    
    return make_result(true, "used after free");
}

} // namespace mycore