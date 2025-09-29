#include "memory_issues.hpp"

#include <iostream>

using namespace mycore;

int main() {
    std::cout << "[demo_mem_fixed] Running fixed cases\n";

    std::cout << "---> fixed_no_leak()\n";
    fixed_no_leak(100);

    std::cout << "---> fixed_bounds_safe()\n";
    fixed_bounds_safe(10);

    std::cout << "---> fixed_no_use_after_free()\n";
    fixed_no_use_after_free();

    std::cout << "[demo_mem_fixed] Done." << std::endl;
    return 0;
}