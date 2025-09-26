cmake_minimum_required(VERSION 3.10)
project(day2_modern_cpp VERSION 0.1.0 LANGUAGES CXX)

# 设置 C++ 标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# 生成 compile_commands.json 供 IDE/clangd 使用
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# 设置编译选项
set(CMAKE_CXX_FLAGS_DEBUG "-g -Og -Wall -Wextra")
set(CMAKE_CXX_FLAGS_RELEASE "-O2 -DNDEBUG")

# 添加库目标
add_library(mycore
    src/file_guard.cpp
    src/mutex_guard.cpp
    src/buffer.cpp
    src/node.cpp
)


# 设置库的包含目录
target_include_directories(mycore PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# 添加可执行文件
add_executable(demo_raii app/demo_raii.cpp)
target_link_libraries(demo_raii PRIVATE mycore)

add_executable(demo_buffer app/demo_buffer.cpp)
target_link_libraries(demo_buffer PRIVATE mycore)

add_executable(demo_ownership app/demo_ownership.cpp)
target_link_libraries(demo_ownership PRIVATE mycore)

# 添加测试目录（可选）
# add_subdirectory(tests)
