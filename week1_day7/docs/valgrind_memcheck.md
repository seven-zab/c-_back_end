# Valgrind Memcheck 定位与修复（占位）

步骤：
1. 在程序中保留或制造内存错误路径（越界/泄漏/UAF）。
2. 运行：
```
valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes build/Debug/bin/demo_raii 2>&1 | tee docs/valgrind_output.txt
```
3. 根据报告定位具体代码行，修复并复验直至无泄漏。

记录内容包括：复现实例、报告片段与解释、修复点与复验结果。