add_executable(demo_week3
    demo_week3.cpp
)

target_link_libraries(demo_week3 PRIVATE week3_core)

set_target_properties(demo_week3 PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)