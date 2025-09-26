add_executable(demo_raii
    demo_raii.cpp
)

target_link_libraries(demo_raii PRIVATE mycore)
target_compile_features(demo_raii PRIVATE cxx_std_17)

target_compile_options(demo_raii PRIVATE
    $<$<CONFIG:Debug>:-g -Og>
    $<$<CONFIG:Release>:-O2>
)
