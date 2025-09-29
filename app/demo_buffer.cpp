#include "buffer.h"
#include <iostream>
#include <stdexcept>

void test_buffer_rule_of_five() {
    std::cout << "\n=== Buffer (Rule of Five) 测试 ===" << std::endl;
    
    // 构造
    Buffer buf1(10);
    for (size_t i = 0; i < buf1.size(); ++i) {
        buf1[i] = static_cast<char>('A' + i);
    }
    
    // 打印内容
    std::cout << "buf1 内容: ";
    for (size_t i = 0; i < buf1.size(); ++i) {
        std::cout << buf1[i] << " ";
    }
    std::cout << std::endl;
    
    // 拷贝构造
    Buffer buf2(buf1);
    std::cout << "buf2(拷贝构造) 内容: ";
    for (size_t i = 0; i < buf2.size(); ++i) {
        std::cout << buf2[i] << " ";
    }
    std::cout << std::endl;
    
    // 修改buf2不影响buf1
    buf2[0] = 'Z';
    std::cout << "修改后 buf1[0]: " << buf1[0] << ", buf2[0]: " << buf2[0] << std::endl;
    
    // 移动构造
    Buffer buf3(std::move(buf1));
    std::cout << "buf3(移动构造) 大小: " << buf3.size() << std::endl;
    std::cout << "移动后 buf1 大小: " << buf1.size() << " (应为0)" << std::endl;
    
    // 拷贝赋值
    Buffer buf4(5);
    buf4 = buf2;
    std::cout << "buf4(拷贝赋值) 大小: " << buf4.size() << std::endl;
    
    // 移动赋值
    Buffer buf5(3);
    buf5 = std::move(buf2);
    std::cout << "buf5(移动赋值) 大小: " << buf5.size() << std::endl;
    std::cout << "移动后 buf2 大小: " << buf2.size() << " (应为0)" << std::endl;
    
    // 异常安全测试 - 越界访问
    try {
        std::cout << "尝试越界访问: buf5[" << buf5.size() << "]" << std::endl;
        char c = buf5[buf5.size()];
        std::cout << "这行不会打印: " << c << std::endl;
    } catch (const std::exception& e) {
        std::cout << "捕获异常: " << e.what() << std::endl;
    }
}

void test_buffer_rule_of_zero() {
    std::cout << "\n=== BufferZero (Rule of Zero) 测试 ===" << std::endl;
    
    // 构造
    BufferZero buf1(10);
    for (size_t i = 0; i < buf1.size(); ++i) {
        buf1[i] = static_cast<uint8_t>('A' + i);
    }
    
    // 打印内容
    std::cout << "buf1 内容: ";
    for (size_t i = 0; i < buf1.size(); ++i) {
        std::cout << static_cast<char>(buf1[i]) << " ";
    }
    std::cout << std::endl;
    
    // 拷贝构造
    BufferZero buf2(buf1);
    
    // 移动构造
    BufferZero buf3(std::move(buf1));
    std::cout << "buf3(移动构造) 大小: " << buf3.size() << std::endl;
    std::cout << "移动后 buf1 大小: " << buf1.size() << " (应为0)" << std::endl;
    
    // 异常安全测试 - 越界访问
    try {
        std::cout << "尝试越界访问: buf3[" << buf3.size() << "]" << std::endl;
        uint8_t c = buf3[buf3.size()];
        std::cout << "这行不会打印: " << c << std::endl;
    } catch (const std::exception& e) {
        std::cout << "捕获异常: " << e.what() << std::endl;
    }
}

int main() {
    test_buffer_rule_of_five();
    test_buffer_rule_of_zero();
    return 0;
}
