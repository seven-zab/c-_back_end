add_library(mycore
    file_guard.cpp
    line_reader.cpp
)

target_include_directories(mycore
    PUBLIC
        ${PROJECT_SOURCE_DIR}/include
)

target_compile_features(mycore PUBLIC cxx_std_17)

# 常用警告与 Debug/Release 选项
target_compile_options(mycore PRIVATE
    -Wall -Wextra -Wpedantic
    $<$<CONFIG:Debug>:-g -Og>
    $<$<CONFIG:Release>:-O2>
)
