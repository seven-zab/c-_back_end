# Day 5 — Valgrind Memcheck 调试日志

本日志用于记录在 WSL/Ubuntu 环境下对 day5 项目进行 Valgrind 检测与修复的过程。请将你的实际环境信息与输出粘贴进对应位置，以形成可交付成果。

## 1. 环境信息
- OS：WSL Ubuntu，内核版本：`Linux zabab 6.6.87.1-microsoft-standard-WSL2 #1 SMP PREEMPT_DYNAMIC Mon Apr 21 17:08:54 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux`
- g++ 版本：`g++ (Ubuntu 13.3.0-6ubuntu2~24.04) 13.3.0`
- CMake 版本：`cmake version 3.28.3`
- Valgrind 版本：`valgrind-3.22.0`
- 构建类型：Debug（启用 `-g -Og`）

## 2. 构建步骤（Debug）
```bash
cd /mnt/e/trae_owd/project_wx/day5
mkdir -p build/Debug
cmake -S . -B build/Debug -DCMAKE_BUILD_TYPE=Debug
cmake --build build/Debug -j$(nproc)
```

实际输出：
```
-- The C compiler identification is GNU 13.3.0
-- The CXX compiler identification is GNU 13.3.0
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
-- Check for working C compiler: /usr/bin/cc - skipped
-- Detecting C compile features
-- Detecting C compile features - done
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Check for working CXX compiler: /usr/bin/c++ - skipped
-- Detecting CXX compile features
-- Detecting CXX compile features - done
-- Configuring done (0.5s)
-- Generating done (0.0s)
-- Build files have been written to: /mnt/e/trae_owd/project_wx/day5/build/Debug
[ 16%] Building CXX object CMakeFiles/mycore.dir/src/mem_issues_bad.cpp.o
[ 33%] Building CXX object CMakeFiles/mycore.dir/src/mem_issues_fix.cpp.o
[ 50%] Linking CXX static library libmycore.a
[ 50%] Built target mycore
[ 66%] Building CXX object CMakeFiles/app.dir/src/main.cpp.o
[ 83%] Linking CXX executable app
[ 83%] Built target app
[100%] Building CXX object CMakeFiles/tests_basic.dir/tests/test_basic.cpp.o
[100%] Linking CXX executable tests_basic
[100%] Built target tests_basic
```

备注：Debug 下启用调试符号，便于 Valgrind 定位到具体代码行。

## 3. 基础测试
```bash
./build/Debug/tests_basic
```
预期输出：
```
tests_basic passed
```
实际输出：
```
All tests passed!
```

## 4. 问题 1：内存泄漏（leak_bad）
- 代码位置：`src/mem_issues_bad.cpp` 中函数 `leak_memory_bad`（约第 13 行）
- 运行命令：
```bash
valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes ./build/Debug/app leak_bad 1024
```
- 关键输出：
```
\==651== Memcheck, a memory error detector
==651== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==651== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==651== Command: ./build/Debug/app leak_bad 1024
==651==
OK: allocated but leaked
==651==
==651== HEAP SUMMARY:
==651==     in use at exit: 1,024 bytes in 1 blocks
==651==   total heap usage: 4 allocs, 3 frees, 75,797 bytes allocated
==651==
==651== 1,024 bytes in 1 blocks are definitely lost in loss record 1 of 1
==651==    at 0x4846828: malloc (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==651==    by 0x10ACCA: mycore::leak_memory_bad(unsigned long) (mem_issues_bad.cpp:15)
==651==    by 0x10A55D: main (main.cpp:28)
==651==
==651== LEAK SUMMARY:
==651==    definitely lost: 1,024 bytes in 1 blocks
==651==    indirectly lost: 0 bytes in 0 blocks
==651==      possibly lost: 0 bytes in 0 blocks
==651==    still reachable: 0 bytes in 0 blocks
==651==         suppressed: 0 bytes in 0 blocks
==651==
==651== For lists of detected and suppressed errors, rerun with: -s
==651== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 0 from 0)
```
- 分析与结论：这是一次明确泄漏（definitely lost），定位到 `malloc` 分配后未释放。Valgrind 精确地指出了泄漏发生在 `mem_issues_bad.cpp` 第 15 行的 `malloc` 调用，并且泄漏了 1024 字节的内存。

- 修复验证：
```bash
valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes ./build/Debug/app leak_fix 1024
```
- 实际修复输出：
```
==837== Memcheck, a memory error detector
==837== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==837== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==837== Command: ./build/Debug/app leak_fix 1024
==837==
OK: allocated and properly freed via RAII
==837==
==837== HEAP SUMMARY:
==837==     in use at exit: 0 bytes in 0 blocks
==837==   total heap usage: 4 allocs, 4 frees, 75,814 bytes allocated
==837==
==837== All heap blocks were freed -- no leaks are possible
==837==
==837== For lists of detected and suppressed errors, rerun with: -s
==837== ERROR SUMMARY: 0 errors from 0 contexts (suppressed: 0 from 0)
```

## 5. 问题 2：越界写（oob_bad）
- 代码位置：`src/mem_issues_bad.cpp` 中函数 `out_of_bounds_bad`（约第 20 行）
- 运行命令：
```bash
valgrind --leak-check=full --track-origins=yes ./build/Debug/app oob_bad 8
```
- 关键输出：
```
==679== Memcheck, a memory error detector
==679== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==679== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==679== Command: ./build/Debug/app oob_bad 8
==679==
==679== Invalid write of size 4
==679==    at 0x10AE14: mycore::out_of_bounds_bad(unsigned long) (mem_issues_bad.cpp:27)
==679==    by 0x10A6C1: main (main.cpp:36)
==679==  Address 0x4e1e0a0 is 0 bytes after a block of size 32 alloc'd
==679==    at 0x4846FA3: operator new(unsigned long) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==679==    by 0x10AF03: std::__new_allocator<int>::allocate(unsigned long, void const*) (new_allocator.h:151)
==679==    by 0x10AF40: allocate (alloc_traits.h:482)
==679==    by 0x10AF40: _M_allocate (stl_vector.h:381)
==679==    by 0x10AF40: std::_Vector_base<int, std::allocator<int> >::_M_create_storage(unsigned long) (stl_vector.h:398)
==679==    by 0x10AF99: _Vector_base (stl_vector.h:335)
==679==    by 0x10AF99: std::vector<int, std::allocator<int> >::vector(unsigned long, int const&, std::allocator<int> const&) (stl_vector.h:571)
==679==    by 0x10ADEF: mycore::out_of_bounds_bad(unsigned long) (mem_issues_bad.cpp:24)
==679==    by 0x10A6C1: main (main.cpp:36)
==679==
OK: wrote out of bounds
==679==
==679== HEAP SUMMARY:
==679==     in use at exit: 0 bytes in 0 blocks
==679==   total heap usage: 4 allocs, 4 frees, 74,804 bytes allocated
==679==
==679== All heap blocks were freed -- no leaks are possible
==679==
==679== For lists of detected and suppressed errors, rerun with: -s
==679== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 0 from 0)
```
- 分析与结论：Valgrind 成功检测到越界写入错误。在 `mem_issues_bad.cpp` 第 27 行，对 `std::vector<int> v(n)` 执行 `v[n] = 42` 导致越界写入（有效索引为 [0, n-1]）。错误发生在分配的 32 字节内存块（8个int元素）之后的位置。

- 修复验证：
```bash
valgrind --leak-check=full --track-origins=yes ./build/Debug/app oob_fix 8
```
- 实际修复输出：
```
==840== Memcheck, a memory error detector
==840== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==840== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==840== Command: ./build/Debug/app oob_fix 8
==840==
OK: wrote within bounds
==840==
==840== HEAP SUMMARY:
==840==     in use at exit: 0 bytes in 0 blocks
==840==   total heap usage: 4 allocs, 4 frees, 74,804 bytes allocated
==840==
==840== All heap blocks were freed -- no leaks are possible
==840==
==840== For lists of detected and suppressed errors, rerun with: -s
==840== ERROR SUMMARY: 0 errors from 0 contexts (suppressed: 0 from 0)
```

## 6. 问题 3：use-after-free（uaf_bad）
- 代码位置：`src/mem_issues_bad.cpp` 中函数 `use_after_free_bad`（约第 29 行）
- 运行命令：
```bash
valgrind --leak-check=full --track-origins=yes ./build/Debug/app uaf_bad
```
- 关键输出：
```
==805== Memcheck, a memory error detector
==805== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==805== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==805== Command: ./build/Debug/app uaf_bad
==805==
==805== Invalid read of size 4
==805==    at 0x10AD70: mycore::use_after_free_bad() (mem_issues_bad.cpp:42)
==805==    by 0x10A7CC: main (main.cpp:42)
==805==  Address 0x4e1e080 is 0 bytes inside a block of size 32 free'd
==805==    at 0x484BFA4: operator delete[](void*) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==805==    by 0x10AD6F: mycore::use_after_free_bad() (mem_issues_bad.cpp:36)
==805==    by 0x10A7CC: main (main.cpp:42)
==805==  Block was alloc'd at
==805==    at 0x4849008: operator new[](unsigned long, std::nothrow_t const&) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==805==    by 0x10AD59: mycore::use_after_free_bad() (mem_issues_bad.cpp:33)
==805==    by 0x10A7CC: main (main.cpp:42)
==805==
==805== Invalid write of size 4
==805==    at 0x10AD75: mycore::use_after_free_bad() (mem_issues_bad.cpp:45)
==805==    by 0x10A7CC: main (main.cpp:42)
==805==  Address 0x4e1e084 is 4 bytes inside a block of size 32 free'd
==805==    at 0x484BFA4: operator delete[](void*) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==805==    by 0x10AD6F: mycore::use_after_free_bad() (mem_issues_bad.cpp:36)
==805==    by 0x10A7CC: main (main.cpp:42)
==805==  Block was alloc'd at
==805==    at 0x4849008: operator new[](unsigned long, std::nothrow_t const&) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==805==    by 0x10AD59: mycore::use_after_free_bad() (mem_issues_bad.cpp:33)
==805==    by 0x10A7CC: main (main.cpp:42)
==805==
OK: used after free
==805==
==805== HEAP SUMMARY:
==805==     in use at exit: 0 bytes in 0 blocks
==805==   total heap usage: 3 allocs, 3 frees, 74,784 bytes allocated
==805==
==805== All heap blocks were freed -- no leaks are possible
==805==
==805== For lists of detected and suppressed errors, rerun with: -s
==805== ERROR SUMMARY: 2 errors from 2 contexts (suppressed: 0 from 0)
```
- 分析与结论：Valgrind 成功检测到两个 use-after-free 错误：一个是在第 38 行的无效读取（`int x = p[0]`），另一个是在第 44 行的无效写入（`p[1] = y`）。这些操作都发生在第 37 行的 `delete[] p` 之后，是典型的 use-after-free 问题。我们的代码修改成功使 Valgrind 能够检测到这个问题。

- 修复验证：
```bash
valgrind --leak-check=full --track-origins=yes ./build/Debug/app uaf_fix
```
- 实际修复输出：
```
==841== Memcheck, a memory error detector
==841== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==841== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==841== Command: ./build/Debug/app uaf_fix
==841==
OK: no UAF; memory managed by RAII
==841==
==841== HEAP SUMMARY:
==841==     in use at exit: 0 bytes in 0 blocks
==841==   total heap usage: 4 allocs, 4 frees, 74,815 bytes allocated
==841==
==841== All heap blocks were freed -- no leaks are possible
==841==
==841== For lists of detected and suppressed errors, rerun with: -s
==841== ERROR SUMMARY: 0 errors from 0 contexts (suppressed: 0 from 0)
```

## 7. 总结与反思
- 使用 RAII（`std::unique_ptr<T[]>`）管理动态内存可避免泄漏与 UAF。
- 对容器进行访问时务必进行边界检查，避免越界写/读。
- 在 Debug 模式下使用 Valgrind 进行定位，能快速得到问题类型与具体代码行；修复后务必复验。

## 8. 附录：常用 Valgrind 选项速记
- `--leak-check=full`：进行详细的泄漏检测。
- `--show-leak-kinds=all`：显示所有泄漏类型（definitely/indirectly/possibly 等）。
- `--track-origins=yes`：追踪未初始化值的来源，增强定位（会更慢）。
- `--error-exitcode=<N>`：出现错误时返回特定退出码，便于 CI/脚本判断。

（请在以上各节粘贴你的真实输出与分析，以形成最终交付的调试日志。）