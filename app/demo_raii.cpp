#include "mycore/file_guard.hpp"
#include "mycore/line_reader.hpp"
#include "mycore/buffer.hpp"
#include <iostream>
#include <vector>
#include <string>
#include <cstring>

using namespace mycore;

int main() {
    try {
        const std::string path = "sample.txt";
        {
            FileGuard out(path, "w");
            const char* lines[] = {"hello", "world", "RAII demo"};
            for (const char* line : lines) {
                out.write(line, std::strlen(line));
                out.write("\n", 1);
            }
            // FileGuard 析构自动关闭文件
        }

        LineReader reader(path);
        std::vector<std::string> lines = reader.read_all();
        std::cout << "Read " << lines.size() << " lines:\n";
        for (auto& l : lines) {
            std::cout << l << "\n";
        }

        Buffer buf(16);
        buf.fill('A');
        std::cout << "Buffer size: " << buf.size() << " first char: " << buf.data()[0] << "\n";

    } catch (const std::exception& ex) {
        std::cerr << "Error: " << ex.what() << std::endl;
        return 1; // 非零表示运行失败
    }
    return 0;
}
