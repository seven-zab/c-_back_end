add_executable(demo_raii ${CMAKE_CURRENT_SOURCE_DIR}/demo_raii.cpp)
target_link_libraries(demo_raii PRIVATE mycore)

add_executable(demo_buffer ${CMAKE_CURRENT_SOURCE_DIR}/demo_buffer.cpp)
target_link_libraries(demo_buffer PRIVATE mycore)

add_executable(demo_ownership ${CMAKE_CURRENT_SOURCE_DIR}/demo_ownership.cpp)
target_link_libraries(demo_ownership PRIVATE mycore)

add_executable(demo_perf ${CMAKE_CURRENT_SOURCE_DIR}/demo_perf.cpp)
target_link_libraries(demo_perf PRIVATE mycore)