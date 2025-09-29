#include "mem_issues.hpp"
#include <iostream>
#include <cassert>

using namespace mycore;

int main() {
    // 简单断言测试，返回非零代表失败
    {
        auto r = leak_memory_fix(1024);
        assert(r.ok);
    }
    {
        auto r = out_of_bounds_fix(8);
        assert(r.ok);
    }
    {
        auto r = use_after_free_fix();
        assert(r.ok);
    }

    std::cout << "tests_basic passed" << std::endl;
    return 0;
}