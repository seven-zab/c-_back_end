# Day 5 — Valgrind Memcheck 调试日志（成品）

时间：2025-09-29
环境：WSL Ubuntu 22.04, GCC 11.x, Valgrind 3.19.x
目录：`/mnt/e/c++_backdown_learn`
构建：
`cmake -S . -B build/Debug -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON && cmake --build build/Debug -j`

---

## Case 1: 内存泄漏（leak)
命令：
```
valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes ./build/Debug/demo_mem leak
```
现象：
```
==1096== Memcheck, a memory error detector
==1096== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==1096== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==1096== Command: ./build/Debug/demo_mem leak
==1096==
[demo_mem] Running case: leak
---> leak_memory()
Leaked string size: 19
[demo_mem] Done.
==1096==
==1096== HEAP SUMMARY:
==1096==     in use at exit: 452 bytes in 3 blocks
==1096==   total heap usage: 5 allocs, 2 frees, 75,204 bytes allocated
==1096==
==1096== 20 bytes in 1 blocks are indirectly lost in loss record 1 of 3
==1096==    at 0x4846FA3: operator new(unsigned long) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==1096==    by 0x1096D9: void std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >::_M_construct<char const*>(char const*, char const*, std::forward_iterator_tag) (basic_string.tcc:229)
==1096==    by 0x109720: std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >::basic_string<std::allocator<char> >(char const*, std::allocator<char> const&) (basic_string.h:649)
==1096==    by 0x10989B: mycore::leak_memory(unsigned long) (memory_issues.cpp:17)
==1096==    by 0x1094BF: main (buggy_mem.cpp:16)
==1096==
==1096== 52 (32 direct, 20 indirect) bytes in 1 blocks are definitely lost in loss record 2 of 3
==1096==    at 0x4846FA3: operator new(unsigned long) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==1096==    by 0x109884: mycore::leak_memory(unsigned long) (memory_issues.cpp:17)
==1096==    by 0x1094BF: main (buggy_mem.cpp:16)
==1096==
==1096== 400 bytes in 1 blocks are definitely lost in loss record 3 of 3
==1096==    at 0x48485C3: operator new[](unsigned long) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==1096==    by 0x10984D: mycore::leak_memory(unsigned long) (memory_issues.cpp:12)
==1096==    by 0x1094BF: main (buggy_mem.cpp:16)
==1096==
==1096== LEAK SUMMARY:
==1096==    definitely lost: 432 bytes in 2 blocks
==1096==    indirectly lost: 20 bytes in 1 blocks
==1096==      possibly lost: 0 bytes in 0 blocks
==1096==    still reachable: 0 bytes in 0 blocks
==1096==         suppressed: 0 bytes in 0 blocks
==1096==
==1096== For lists of detected and suppressed errors, rerun with: -s
==1096== ERROR SUMMARY: 2 errors from 2 contexts (suppressed: 0 from 0)
```
定位：
- `src/memory_issues.cpp:12` 动态数组 `arr` 未 `delete[]`。
- `src/memory_issues.cpp:17` 动态分配的 `std::string* s` 未 `delete`。

修复说明：
- 采用 RAII/自动对象，详见 `fixed_no_leak()`（`src/memory_issues.cpp:42-50`）。
- 使用 `std::vector<int>` 与自动对象 `std::string`，无显式 `new/delete`。

复验：
```
valgrind --leak-check=full --show-leak-kinds=all ./build/Debug/demo_mem_fixed
```
复验结果（摘要）：
```
==1904== Memcheck, a memory error detector
==1904== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==1904== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==1904== Command: ./build/Debug/demo_mem_fixed
==1904==
[demo_mem_fixed] Running fixed cases
---> fixed_no_leak()
String size: 10
---> fixed_bounds_safe()
---> fixed_no_use_after_free()
Safe read value: 42
[demo_mem_fixed] Done.
==1904==
==1904== HEAP SUMMARY:
==1904==     in use at exit: 0 bytes in 0 blocks
==1904==   total heap usage: 4 allocs, 4 frees, 75,192 bytes allocated
==1904==
==1904== All heap blocks were freed -- no leaks are possible
==1904==
==1904== For lists of detected and suppressed errors, rerun with: -s
==1904== ERROR SUMMARY: 0 errors from 0 contexts (suppressed: 0 from 0)
```
结论：泄漏问题已消除。

---

## Case 2: 越界写（oob)
命令：
```
valgrind ./build/Debug/demo_mem oob
```
现象：
```
==1905== Memcheck, a memory error detector
==1905== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==1905== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==1905== Command: ./build/Debug/demo_mem oob
==1905==
[demo_mem] Running case: oob
---> out_of_bounds_write()
==1905== Invalid write of size 4
==1905==    at 0x109771: mycore::out_of_bounds_write(unsigned long) (memory_issues.cpp:25)
==1905==    by 0x109506: main (buggy_mem.cpp:21)
==1905==  Address 0x4e1e4e8 is 0 bytes after a block of size 40 alloc'd
==1905==    at 0x48485C3: operator new[](unsigned long) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==1905==    by 0x109757: mycore::out_of_bounds_write(unsigned long) (memory_issues.cpp:24)
==1905==    by 0x109506: main (buggy_mem.cpp:21)
==1905==
[demo_mem] Done.
==1905==
==1905== HEAP SUMMARY:
==1905==     in use at exit: 0 bytes in 0 blocks
==1905==   total heap usage: 3 allocs, 3 frees, 74,792 bytes allocated
==1905==
==1905== All heap blocks were freed -- no leaks are possible
==1905==
==1905== For lists of detected and suppressed errors, rerun with: -s
==1905== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 0 from 0)
```
定位：
- `src/memory_issues.cpp:24` 循环条件使用 `<= n`，导致对 `arr[n]` 写越界。

修复说明：
- 采用边界安全容器或正确边界条件，参考 `fixed_bounds_safe()`（`src/memory_issues.cpp:53-58`）。

复验：
```
valgrind ./build/Debug/demo_mem_fixed
```

```
==1910== Memcheck, a memory error detector
==1910== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==1910== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==1910== Command: ./build/Debug/demo_mem_fixed
==1910==
[demo_mem_fixed] Running fixed cases
---> fixed_no_leak()
String size: 10
---> fixed_bounds_safe()
---> fixed_no_use_after_free()
Safe read value: 42
[demo_mem_fixed] Done.
==1910==
==1910== HEAP SUMMARY:
==1910==     in use at exit: 0 bytes in 0 blocks
==1910==   total heap usage: 4 allocs, 4 frees, 75,192 bytes allocated
==1910==
==1910== All heap blocks were freed -- no leaks are possible
==1910==
==1910== For lists of detected and suppressed errors, rerun with: -s
==1910== ERROR SUMMARY: 0 errors from 0 contexts (suppressed: 0 from 0)
```

---

复验结果：未再出现 `Invalid write` 报告。

---

## Case 3: Use-after-free（uaf)
命令：
```
valgrind ./build/Debug/demo_mem uaf

```
现象：
```
==1911== Memcheck, a memory error detector
==1911== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==1911== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==1911== Command: ./build/Debug/demo_mem uaf
==1911==
[demo_mem] Running case: uaf
---> use_after_free()
==1911== Invalid read of size 4
==1911==    at 0x1097A9: mycore::use_after_free() (memory_issues.cpp:37)
==1911==    by 0x109548: main (buggy_mem.cpp:26)
==1911==  Address 0x4e1e4c0 is 0 bytes inside a block of size 4 free'd
==1911==    at 0x484A61D: operator delete(void*, unsigned long) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==1911==    by 0x1097A8: mycore::use_after_free() (memory_issues.cpp:35)
==1911==    by 0x109548: main (buggy_mem.cpp:26)
==1911==  Block was alloc'd at
==1911==    at 0x4846FA3: operator new(unsigned long) (in /usr/libexec/valgrind/vgpreload_memcheck-amd64-linux.so)
==1911==    by 0x10978D: mycore::use_after_free() (memory_issues.cpp:34)
==1911==    by 0x109548: main (buggy_mem.cpp:26)
==1911==
Use-after-free read value: 42
[demo_mem] Done.
==1911==
==1911== HEAP SUMMARY:
==1911==     in use at exit: 0 bytes in 0 blocks
==1911==   total heap usage: 3 allocs, 3 frees, 74,756 bytes allocated
==1911==
==1911== All heap blocks were freed -- no leaks are possible
==1911==
==1911== For lists of detected and suppressed errors, rerun with: -s
==1911== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 0 from 0)
```
定位：
- `src/memory_issues.cpp:35` 释放后仍在 `src/memory_issues.cpp:37` 读取 `*p`。

修复说明：
- 避免在释放后访问，采用自动对象或智能指针，见 `fixed_no_use_after_free()`（`src/memory_issues.cpp:61-66`）。

复验：
```
valgrind ./build/Debug/demo_mem_fixed

```
```
==1912== Memcheck, a memory error detector
==1912== Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.
==1912== Using Valgrind-3.22.0 and LibVEX; rerun with -h for copyright info
==1912== Command: ./build/Debug/demo_mem_fixed
==1912==
[demo_mem_fixed] Running fixed cases
---> fixed_no_leak()
String size: 10
---> fixed_bounds_safe()
---> fixed_no_use_after_free()
Safe read value: 42
[demo_mem_fixed] Done.
==1912==
==1912== HEAP SUMMARY:
==1912==     in use at exit: 0 bytes in 0 blocks
==1912==   total heap usage: 4 allocs, 4 frees, 75,192 bytes allocated
==1912==
==1912== All heap blocks were freed -- no leaks are possible
==1912==
==1912== For lists of detected and suppressed errors, rerun with: -s
==1912== ERROR SUMMARY: 0 errors from 0 contexts (suppressed: 0 from 0)
```

---

复验结果：未再出现 `Invalid read`/`Use of freed memory` 报告。

---

## 总结
- 问题类型与触发条件：手工 `new/delete` 失误引起泄漏，错误边界条件导致 OOB，生命周期管理不当导致 UAF。
- 定位手段与关键线索：Memcheck 的 `Invalid write/read` 报告与 `definitely lost` 指标，结合文件与行号精确定位。
- 修复方式与注意事项：优先 RAII/标准容器；避免裸指针所有权；调试构建使用 `-g -Og`，发布使用 `-O2`。
- 后续改进：将 `demo_mem` 纳入 CI 的 Valgrind 步骤；为关键模块增加单元测试覆盖与边界检查。

## 环境与版本
```
时间: 2025-09-30T10:54:21+08:00
内核: Linux zabab 6.6.87.1-microsoft-standard-WSL2 #1 SMP PREEMPT_DYNAMIC Mon Apr 21 17:08:54 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux
发行版:
Distributor ID:	Ubuntu
Description:	Ubuntu 24.04.3 LTS
Release:	24.04
Codename:	noble
工具路径:
/usr/bin/gcc
/usr/bin/g++
/usr/bin/gdb
/usr/bin/valgrind
/usr/bin/cmake
/usr/bin/make
/usr/lib/linux-tools-6.8.0-84/perf
gcc:
gcc (Ubuntu 13.3.0-6ubuntu2~24.04) 13.3.0
Copyright (C) 2023 Free Software Foundation, Inc.
g++:
g++ (Ubuntu 13.3.0-6ubuntu2~24.04) 13.3.0
Copyright (C) 2023 Free Software Foundation, Inc.
gdb:
GNU gdb (Ubuntu 15.0.50.20240403-0ubuntu1) 15.0.50.20240403-git
valgrind:
valgrind-3.22.0
cmake:
cmake version 3.28.3
make:
GNU Make 4.3
perf:
perf version 6.8.12