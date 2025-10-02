add_library(mycore)

target_sources(mycore
  PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/buffer.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/file_guard.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/mutex_guard.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/node.cpp
)

target_include_directories(mycore PUBLIC ${CMAKE_SOURCE_DIR}/include)
target_compile_features(mycore PUBLIC cxx_std_17)

# Debug/Release 编译选项
target_compile_options(mycore PRIVATE
  $<$<CONFIG:Debug>:-g -Og -Wall -Wextra -Wpedantic>
  $<$<CONFIG:Release>:-O2 -DNDEBUG>
)