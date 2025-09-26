#pragma once
#include "mycore/file_guard.hpp"
#include <string>
#include <vector>

namespace mycore {

class LineReader {
public:
    explicit LineReader(const std::string& path);
    std::vector<std::string> read_all();

private:
    FileGuard file_;
};

} // namespace mycore
