cmake_minimum_required(VERSION 3.16)
project(week1 LANGUAGES CXX)

# 生成 compile_commands.json 便于 IDE/clangd 使用
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")

add_subdirectory(src)
add_subdirectory(app)
add_subdirectory(tests)
