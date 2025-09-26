#include "mycore/line_reader.hpp"
#include <array>
#include <cstdio>

namespace mycore {

LineReader::LineReader(const std::string& path) : file_(path, "r") {}

std::vector<std::string> LineReader::read_all() {
    std::vector<std::string> lines;
    std::array<char, 1024> buf{};
    while (true) {
        if (std::fgets(buf.data(), buf.size(), file_.get()) == nullptr) {
            break;
        }
        std::string s(buf.data());
        // 去除行尾 \n/\r
        while (!s.empty() && (s.back() == '\n' || s.back() == '\r')) {
            s.pop_back();
        }
        lines.push_back(std::move(s));
    }
    return lines;
}

} // namespace mycore
