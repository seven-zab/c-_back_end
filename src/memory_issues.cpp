// 此文件用于演示三类常见内存问题（内存泄漏、越界写、释放后使用）
// 以及它们的安全修复方式，便于配合 Valgrind Memcheck 学习与验证。
#include "memory_issues.hpp"

#include <iostream>
#include <vector>
#include <string>

namespace mycore {

// 演示：内存泄漏（分配后未释放）。
// 说明：通过 new 分配的内存若不调用 delete/delete[] 归还，会在进程退出时仍占用堆内存，
//      Memcheck 会在 HEAP SUMMARY 中以 definitely/indirectly lost 标识。
void leak_memory(std::size_t n) {
    // 案例 1：动态数组分配后未释放（应使用 delete[]）。
    int* arr = new int[n];
    for (std::size_t i = 0; i < n; ++i) arr[i] = static_cast<int>(i);
    // 故意不调用 delete[] arr，造成泄漏。

    // 案例 2：动态分配对象未释放（应使用 delete）。
    auto* s = new std::string("this will be leaked");
    std::cout << "Leaked string size: " << s->size() << "\n";
    // 故意不调用 delete s，造成泄漏。
}

// 演示：越界写（Out-of-Bounds Write）。
// 说明：循环边界错误导致写到无效地址，Memcheck 会报告 Invalid write 并指向具体行号。
void out_of_bounds_write(std::size_t n) {
    int* arr = new int[n];
    for (std::size_t i = 0; i <= n; ++i) { // 注意：当 i == n 时写入 arr[n]，越界
        arr[i] = static_cast<int>(i);
    }
    // 清理分配的数组，避免泄漏提示覆盖越界写问题。
    delete[] arr;
}

// 演示：释放后使用（Use-After-Free, UAF）。
// 说明：释放指针后继续解引用属于未定义行为，Memcheck 会报告 Invalid read/Use of freed memory。
void use_after_free() {
    int* p = new int(42);
    delete p;
    // 在释放后继续访问，触发 UAF。
    int x = *p; // 未定义行为：释放后使用（UAF）
    std::cout << "Use-after-free read value: " << x << "\n";
}

// 修复：无泄漏（使用 RAII/标准容器管理资源）。
// 说明：用 std::vector/std::string 等自动释放资源的类型，作用域结束时自动释放，无需手动 delete。
void fixed_no_leak(std::size_t n) {
    // 使用 vector 拥有内存，作用域结束自动释放。
    std::vector<int> arr(n);
    for (std::size_t i = 0; i < n; ++i) arr[i] = static_cast<int>(i);

    // 使用自动对象（栈上）而非动态分配。
    std::string s = "not leaked";
    std::cout << "String size: " << s.size() << "\n";
}

// 修复：边界安全写入（避免越界）。
// 说明：保持 i < n，或使用安全接口（如 at），确保不访问越界位置。
void fixed_bounds_safe(std::size_t n) {
    std::vector<int> arr(n);
    for (std::size_t i = 0; i < n; ++i) {
        arr[i] = static_cast<int>(i);
    }
}

// 修复：无释放后使用（避免裸指针，使用自动对象或智能指针）。
void fixed_no_use_after_free() {
    // 使用自动对象，生命周期受作用域管理，不需要手动 delete。
    int value = 42;
    int x = value; // 安全读取与拷贝
    std::cout << "Safe read value: " << x << "\n";
}

} // namespace mycore