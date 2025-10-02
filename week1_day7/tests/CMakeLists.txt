add_executable(tests ${CMAKE_CURRENT_SOURCE_DIR}/test.cpp)
target_link_libraries(tests PRIVATE mycore)

add_test(NAME basic_tests COMMAND tests)