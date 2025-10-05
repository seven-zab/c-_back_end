cmake_minimum_required(VERSION 3.16)
project(week3_concurrency LANGUAGES CXX)

# C++ 标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# 选项：是否启用 ThreadSanitizer（仅在非 MSVC 平台有效）
option(ENABLE_TSAN "Enable ThreadSanitizer" OFF)

if (ENABLE_TSAN AND NOT MSVC)
  message(STATUS "ThreadSanitizer enabled")
  add_compile_options(-fsanitize=thread -fno-omit-frame-pointer)
  add_link_options(-fsanitize=thread)
else()
  message(STATUS "ThreadSanitizer disabled or unsupported on MSVC")
endif()

add_subdirectory(src)
add_subdirectory(app)
add_subdirectory(tests)