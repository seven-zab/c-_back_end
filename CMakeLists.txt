cmake_minimum_required(VERSION 3.16)

project(day4_cpp LANGUAGES CXX)

# C++ 标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# 默认构建类型为 Debug（便于 GDB 调试）
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Debug CACHE STRING "Choose the type of build (Debug or Release)" FORCE)
endif()

# 编译告警与调试符号
if(MSVC)
  add_compile_options(/W4)
else()
  add_compile_options(-Wall -Wextra -Wpedantic -Wconversion -Wsign-conversion -g)
endif()

# 组件：buggy 库
add_library(buggy STATIC
  src/buggy.cpp
  src/buggy.hpp
)
target_include_directories(buggy PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src)

# 可执行程序：day4_main（主程序）
add_executable(day4_main
  src/main.cpp
)
target_link_libraries(day4_main PRIVATE buggy)

# 可执行程序：test_min（最小测试）
add_executable(test_min
  tests/test_min.cpp
)
target_link_libraries(test_min PRIVATE buggy)

# 统一输出目录（bin）
set_target_properties(day4_main PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set_target_properties(test_min  PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# 启用 CTest 并注册一个基础测试（运行 test_min）
include(CTest)
if(BUILD_TESTING)
  add_test(NAME test_min_run COMMAND $<TARGET_FILE:test_min>)
endif()
