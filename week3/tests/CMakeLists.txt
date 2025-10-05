enable_testing()

add_executable(test_week3
    test_week3.cpp
)
target_link_libraries(test_week3 PRIVATE week3_core)

add_test(NAME week3_queue_tests COMMAND test_week3)