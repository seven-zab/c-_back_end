cmake_minimum_required(VERSION 3.16)
project(cpp_backend_learn_day5 LANGUAGES CXX)

# C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Library: mycore
add_library(mycore
    src/memory_issues.cpp
)
target_include_directories(mycore PUBLIC ${CMAKE_SOURCE_DIR}/include)
target_compile_features(mycore PUBLIC cxx_std_17)

# Debug/Release compile options
target_compile_options(mycore PRIVATE
    $<$<CONFIG:Debug>:-g;-Og>
    $<$<CONFIG:Release>:-O2>
)

# Executables: buggy and fixed demos
add_executable(demo_mem app/buggy_mem.cpp)
target_link_libraries(demo_mem PRIVATE mycore)
target_compile_options(demo_mem PRIVATE
    $<$<CONFIG:Debug>:-g;-Og>
    $<$<CONFIG:Release>:-O2>
)

add_executable(demo_mem_fixed app/fixed_mem.cpp)
target_link_libraries(demo_mem_fixed PRIVATE mycore)
target_compile_options(demo_mem_fixed PRIVATE
    $<$<CONFIG:Debug>:-g;-Og>
    $<$<CONFIG:Release>:-O2>
)