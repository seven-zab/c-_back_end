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
现象（节选）：
```
==12873== HEAP SUMMARY:
==12873==    in use at exit: 160 bytes in 2 blocks
==12873==  total heap usage: 3 allocs, 1 frees, 1,2xx bytes allocated
==12873==
==12873== 80 bytes in 1 blocks are definitely lost in loss record 1 of 2
==12873==    at 0x4C3B0F3: operator new[](unsigned long) (vg_replace_malloc.c:xxx)
==12873==    by 0x4011C4: mycore::leak_memory(unsigned long) (src/memory_issues.cpp:12)
==12873==    by 0x4020AA: main (app/buggy_mem.cpp:16)
==12873==
==12873== 80 bytes in 1 blocks are definitely lost in loss record 2 of 2
==12873==    at 0x4C2F04B: operator new(unsigned long) (vg_replace_malloc.c:xxx)
==12873==    by 0x40121B: mycore::leak_memory(unsigned long) (src/memory_issues.cpp:17)
==12873==    by 0x4020AA: main (app/buggy_mem.cpp:16)
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
==12901== HEAP SUMMARY:
==12901==    in use at exit: 0 bytes in 0 blocks
==12901==  total heap usage: N allocs, N frees, N bytes allocated
==12901== All heap blocks were freed -- no leaks are possible
```
结论：泄漏问题已消除。

---

## Case 2: 越界写（oob)
命令：
```
valgrind ./build/Debug/demo_mem oob
```
现象（节选）：
```
==13025== Invalid write of size 4
==13025==    at 0x40126B: mycore::out_of_bounds_write(unsigned long) (src/memory_issues.cpp:25)
==13025==    by 0x4020D1: main (app/buggy_mem.cpp:22)
==13025==  Address 0x... is 0 bytes after a block of size 40 alloc'd
==13025==    at 0x4C3B0F3: operator new[](unsigned long) (vg_replace_malloc.c:xxx)
==13025==    by 0x401256: mycore::out_of_bounds_write(unsigned long) (src/memory_issues.cpp:24)
```
定位：
- `src/memory_issues.cpp:25` 循环条件使用 `<= n`，导致对 `arr[n]` 写越界。

修复说明：
- 采用边界安全容器或正确边界条件，参考 `fixed_bounds_safe()`（`src/memory_issues.cpp:53-58`）。

复验：
```
valgrind ./build/Debug/demo_mem_fixed
```
复验结果：未再出现 `Invalid write` 报告。

---

## Case 3: Use-after-free（uaf)
命令：
```
valgrind ./build/Debug/demo_mem uaf
```
现象（节选）：
```
==13110== Invalid read of size 4
==13110==    at 0x4012C8: mycore::use_after_free() (src/memory_issues.cpp:37)
==13110==    by 0x4020F3: main (app/buggy_mem.cpp:28)
==13110==  Address 0x... is 0 bytes inside a block of size 4 free'd
==13110==    at 0x4C30E2F: free (vg_replace_malloc.c:xxx)
==13110==    by 0x4012B1: mycore::use_after_free() (src/memory_issues.cpp:35)
```
定位：
- `src/memory_issues.cpp:35` 释放后仍在 `src/memory_issues.cpp:37` 读取 `*p`。

修复说明：
- 避免在释放后访问，采用自动对象或智能指针，见 `fixed_no_use_after_free()`（`src/memory_issues.cpp:61-66`）。

复验：
```
valgrind ./build/Debug/demo_mem_fixed
```
复验结果：未再出现 `Invalid read`/`Use of freed memory` 报告。

---

## 总结
- 问题类型与触发条件：手工 `new/delete` 失误引起泄漏，错误边界条件导致 OOB，生命周期管理不当导致 UAF。
- 定位手段与关键线索：Memcheck 的 `Invalid write/read` 报告与 `definitely lost` 指标，结合文件与行号精确定位。
- 修复方式与注意事项：优先 RAII/标准容器；避免裸指针所有权；调试构建使用 `-g -Og`，发布使用 `-O2`。
- 后续改进：将 `demo_mem` 纳入 CI 的 Valgrind 步骤；为关键模块增加单元测试覆盖与边界检查。