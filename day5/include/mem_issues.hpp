#pragma once
#include <cstddef>
#include <string>

namespace mycore {

// 演示三类典型内存问题的接口：泄漏、越界、use-after-free
struct DemoResult {
    bool ok;
    std::string msg;
};

// Bad 版本：包含故意问题
DemoResult leak_memory_bad(std::size_t bytes);
DemoResult out_of_bounds_bad(std::size_t n);
DemoResult use_after_free_bad();

// Fix 版本：修复问题
DemoResult leak_memory_fix(std::size_t bytes);
DemoResult out_of_bounds_fix(std::size_t n);
DemoResult use_after_free_fix();

} // namespace mycore