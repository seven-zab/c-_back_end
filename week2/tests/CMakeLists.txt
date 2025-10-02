add_executable(tests2 ${CMAKE_CURRENT_SOURCE_DIR}/test_bounded_queue.cpp)
target_link_libraries(tests2 PRIVATE core2)
add_test(NAME week2_basic_tests COMMAND tests2)