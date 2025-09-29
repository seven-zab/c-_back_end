#include "memory_issues.hpp"

#include <iostream>
#include <vector>
#include <string>

namespace mycore {

// Intentionally leak memory: never free allocated blocks
void leak_memory(std::size_t n) {
    // Case 1: leak dynamic array
    int* arr = new int[n];
    for (std::size_t i = 0; i < n; ++i) arr[i] = static_cast<int>(i);
    // Intentionally do not delete[] arr

    // Case 2: leak an object
    auto* s = new std::string("this will be leaked");
    std::cout << "Leaked string size: " << s->size() << "\n";
    // Intentionally do not delete s
}

// Intentionally write out-of-bounds
void out_of_bounds_write(std::size_t n) {
    int* arr = new int[n];
    for (std::size_t i = 0; i <= n; ++i) { // i == n is out-of-bounds
        arr[i] = static_cast<int>(i);
    }
    // Clean up to avoid additional leaks overshadowing the OOB error
    delete[] arr;
}

// Intentionally use-after-free
void use_after_free() {
    int* p = new int(42);
    delete p;
    // Access after free
    int x = *p; // UB: use-after-free
    std::cout << "Use-after-free read value: " << x << "\n";
}

// Fixed: no leak (RAII via smart pointer)
void fixed_no_leak(std::size_t n) {
    // Use vector to own the memory; automatically freed
    std::vector<int> arr(n);
    for (std::size_t i = 0; i < n; ++i) arr[i] = static_cast<int>(i);

    // Use automatic storage for string
    std::string s = "not leaked";
    std::cout << "String size: " << s.size() << "\n";
}

// Fixed: bounds-safe write
void fixed_bounds_safe(std::size_t n) {
    std::vector<int> arr(n);
    for (std::size_t i = 0; i < n; ++i) {
        arr[i] = static_cast<int>(i);
    }
}

// Fixed: no use-after-free
void fixed_no_use_after_free() {
    // Use automatic storage / RAII; no manual delete
    int value = 42;
    int x = value; // Safe copy
    std::cout << "Safe read value: " << x << "\n";
}

} // namespace mycore