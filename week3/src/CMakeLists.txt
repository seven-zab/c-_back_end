add_library(week3_core
    bounded_queue.cpp
)

target_include_directories(week3_core PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/../include
)

target_compile_features(week3_core PUBLIC cxx_std_17)

install(TARGETS week3_core
        ARCHIVE DESTINATION lib
        LIBRARY DESTINATION lib
        RUNTIME DESTINATION bin)