add_executable(tests
    test_line_reader.cpp
)

target_link_libraries(tests PRIVATE mycore)
target_compile_features(tests PRIVATE cxx_std_17)

target_compile_options(tests PRIVATE
    $<$<CONFIG:Debug>:-g -Og>
    $<$<CONFIG:Release>:-O2>
)
