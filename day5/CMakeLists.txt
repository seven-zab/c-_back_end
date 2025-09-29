cmake_minimum_required(VERSION 3.16)
project(day5_memcheck CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Default to Debug if not specified
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE "Debug" CACHE STRING "Build type" FORCE)
endif()
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")

# Common compile options per build type
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
  add_compile_options(-g -Og)
else()
  add_compile_options(-O2)
endif()

add_library(mycore
    src/mem_issues_bad.cpp
    src/mem_issues_fix.cpp
)
target_include_directories(mycore PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)
target_compile_features(mycore PUBLIC cxx_std_17)

add_executable(app src/main.cpp)
target_link_libraries(app PRIVATE mycore)
target_compile_features(app PRIVATE cxx_std_17)

add_executable(tests_basic tests/test_basic.cpp)
target_link_libraries(tests_basic PRIVATE mycore)
target_compile_features(tests_basic PRIVATE cxx_std_17)