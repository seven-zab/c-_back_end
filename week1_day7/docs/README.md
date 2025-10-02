# Week1 Day7 汇总项目

本项目整合了前六天的练习代码，涵盖 RAII、Rule of Zero/Rule of Five、智能指针所有权模型，以及基础的 CMake 项目组织。包含库 `mycore` 与多个示例可执行（`demo_raii`、`demo_buffer`、`demo_ownership`、`demo_perf`）。

目录结构：
- `include/` 与 `src/`：资源管理类与示例业务类实现
- `app/`：示例可执行程序
- `tests/`：最简断言测试
- `docs/`：构建说明、调试记录、内存问题定位、性能报告与周报

快速开始请见 `docs/BUILD.md`。