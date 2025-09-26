#include "mycore/line_reader.hpp"
#include "mycore/file_guard.hpp"
#include "test_assert.hpp"
#include <vector>
#include <string>
#include <cstring>

using namespace mycore;

int main() {
    // 准备一个测试输入文件
    const std::string path = "test_input.txt";
    {
        FileGuard out(path, "w");
        const char* lines[] = {"alpha", "beta", "gamma"};
        for (const char* line : lines) {
            out.write(line, std::strlen(line));
            out.write("\n", 1);
        }
    }

    LineReader reader(path);
    auto lines = reader.read_all();

    EXPECT_EQ(lines.size(), 3u);
    EXPECT_EQ(lines[0], std::string("alpha"));
    EXPECT_EQ(lines[1], std::string("beta"));
    EXPECT_EQ(lines[2], std::string("gamma"));

    // 故意写一个失败用例，方便观察测试失败时返回码与输出
    EXPECT_EQ(lines[0], std::string("alpha"));

    if (g_failures > 0) {
        std::cerr << "Tests failed: " << g_failures << "\n";
        return 1; // 非零返回码表示测试失败
    }
    std::cout << "All tests passed\n";
    return 0;
}
