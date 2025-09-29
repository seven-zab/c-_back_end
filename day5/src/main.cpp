#include "mem_issues.hpp"
#include <iostream>
#include <string>
#include <cstring>

using namespace mycore;

static void usage() {
    std::cout << "Usage: app <mode> [args]\n"
                 "  Modes:\n"
                 "    leak_bad <bytes>    : allocate and leak\n"
                 "    leak_fix <bytes>    : allocate with RAII\n"
                 "    oob_bad <n>         : out-of-bounds write\n"
                 "    oob_fix <n>         : in-bounds write\n"
                 "    uaf_bad             : use-after-free\n"
                 "    uaf_fix             : RAII avoids UAF\n";
}

int main(int argc, char** argv) {
    if (argc < 2) { usage(); return 1; }
    std::string mode = argv[1];

    DemoResult r{false, ""};
    try {
        if (mode == "leak_bad") {
            if (argc < 3) { usage(); return 1; }
            std::size_t bytes = std::stoull(argv[2]);
            r = leak_memory_bad(bytes);
        } else if (mode == "leak_fix") {
            if (argc < 3) { usage(); return 1; }
            std::size_t bytes = std::stoull(argv[2]);
            r = leak_memory_fix(bytes);
        } else if (mode == "oob_bad") {
            if (argc < 3) { usage(); return 1; }
            std::size_t n = std::stoull(argv[2]);
            r = out_of_bounds_bad(n);
        } else if (mode == "oob_fix") {
            if (argc < 3) { usage(); return 1; }
            std::size_t n = std::stoull(argv[2]);
            r = out_of_bounds_fix(n);
        } else if (mode == "uaf_bad") {
            r = use_after_free_bad();
        } else if (mode == "uaf_fix") {
            r = use_after_free_fix();
        } else {
            usage();
            return 1;
        }
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << "\n";
        return 2;
    }

    std::cout << (r.ok ? "OK" : "FAIL") << ": " << r.msg << "\n";
    return r.ok ? 0 : 1;
}