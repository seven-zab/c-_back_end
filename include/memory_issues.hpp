#pragma once

#include <cstddef>

namespace mycore {

// Buggy functions (intentionally introduce memory issues)
void leak_memory(std::size_t n = 100);
void out_of_bounds_write(std::size_t n = 10);
void use_after_free();

// Fixed counterparts (no memory issues)
void fixed_no_leak(std::size_t n = 100);
void fixed_bounds_safe(std::size_t n = 10);
void fixed_no_use_after_free();

}