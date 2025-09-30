cmake_minimum_required(VERSION 3.16)
project(day6_perf LANGUAGES CXX)

# Generate compile_commands.json for better tooling support
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_library(mycore
    src/hotspots.cpp
)
target_include_directories(mycore PUBLIC include)
target_compile_features(mycore PUBLIC cxx_std_17)

if (MSVC)
    target_compile_options(mycore PRIVATE /O2 /Zi)
else()
    # Recommended flags per build type
    set(CMAKE_CXX_FLAGS_DEBUG "-g -O0")
    set(CMAKE_CXX_FLAGS_RELEASE "-O2")
    set(CMAKE_CXX_FLAGS_RELWITHDEBINFO "-O2 -g")
endif()

add_executable(demo_perf app/demo_perf.cpp)
target_link_libraries(demo_perf PRIVATE mycore)