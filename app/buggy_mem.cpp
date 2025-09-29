#include "memory_issues.hpp"

#include <iostream>
#include <string>

using namespace mycore;

int main(int argc, char** argv) {
    std::string case_name = argc > 1 ? argv[1] : "all";

    std::cout << "[demo_mem] Running case: " << case_name << "\n";

    try {
        if (case_name == "leak" || case_name == "all") {
            std::cout << "---> leak_memory()\n";
            leak_memory(100);
        }

        if (case_name == "oob" || case_name == "all") {
            std::cout << "---> out_of_bounds_write()\n";
            out_of_bounds_write(10);
        }

        if (case_name == "uaf" || case_name == "all") {
            std::cout << "---> use_after_free()\n";
            use_after_free();
        }
    } catch (...) {
        std::cout << "Exception occurred (unexpected)." << std::endl;
    }

    std::cout << "[demo_mem] Done." << std::endl;
    return 0;
}