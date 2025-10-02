#include "buffer.h"
#include "file_guard.h"
#include "mutex_guard.h"
#include <cassert>
#include <iostream>
#include <stdexcept>

// 简单断言宏
#define TEST_ASSERT(condition, message) \
    do { \
        if (!(condition)) { \
            std::cerr << "断言失败: " << message << " (" << __FILE__ << ":" << __LINE__ << ")" << std::endl; \
            return 1; \
        } \
    } while (0)

int test_buffer() {
    // 测试构造函数
    Buffer buf(10);
    TEST_ASSERT(buf.size() == 10, "Buffer大小应为10");
    
    // 测试索引操作符
    buf[0] = 'A';
    TEST_ASSERT(buf[0] == 'A', "Buffer[0]应为'A'");
    
    // 测试拷贝构造
    Buffer buf2(buf);
    TEST_ASSERT(buf2.size() == buf.size(), "拷贝后大小应相同");
    TEST_ASSERT(buf2[0] == buf[0], "拷贝后内容应相同");
    
    // 测试移动构造
    Buffer buf3(std::move(buf));
    TEST_ASSERT(buf.size() == 0, "移动后源对象大小应为0");
    TEST_ASSERT(buf3.size() == 10, "移动后目标对象大小应为10");
    
    std::cout << "Buffer 测试通过!" << std::endl;
    return 0;
}

int main() {
    int result = 0;
    
    result += test_buffer();
    
    return result;
}
