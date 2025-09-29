#include "mem_issues.hpp"
#include <cstdlib>
#include <new>
#include <vector>
#include <cstring>
#include <memory>

namespace mycore {

static DemoResult make_result(bool ok, const char* msg) {
    return DemoResult{ok, std::string(msg)};
}

// 1) 修复泄漏：用 unique_ptr 管理或显式 free
DemoResult leak_memory_fix(std::size_t bytes) {
    // 使用 unique_ptr<char[]> 管理动态数组，自动释放
    std::unique_ptr<char[]> p{new (std::nothrow) char[bytes]};
    if (!p) return make_result(false, "new failed");
    std::memset(p.get(), 0xCD, bytes);
    // 正常返回，p 在作用域结束自动释放
    return make_result(true, "allocated and properly freed via RAII");
}

// 2) 修复越界：保证索引在范围内
DemoResult out_of_bounds_fix(std::size_t n) {
    if (n == 0) return make_result(false, "n must be > 0");
    std::vector<int> v(n, 0);
    v[n-1] = 42; // 最后一个有效元素
    return make_result(true, "wrote within bounds");
}

// 3) 修复 use-after-free：避免访问已释放指针
DemoResult use_after_free_fix() {
    std::unique_ptr<int[]> p{new (std::nothrow) int[8]};
    if (!p) return make_result(false, "new failed");
    p[0] = 1;
    // 不手动 delete，交由 unique_ptr 管理；且不在释放后访问
    return make_result(true, "no UAF; memory managed by RAII");
}

} // namespace mycore