#include "file_guard.h"
#include "mutex_guard.h"
#include <iostream>
#include <mutex>
#include <stdexcept>
#include <thread>
#include <vector>

void test_file_guard() {
    std::cout << "\n=== FileGuard 测试 ===" << std::endl;
    
    try {
        // 正常使用
        {
            FileGuard file("test.txt", "w");
            std::fprintf(file.get(), "Hello, RAII!");
            std::cout << "文件写入完成" << std::endl;
            // 离开作用域时自动关闭
        }
        
        // 异常情况
        {
            FileGuard file("test.txt", "r");
            std::cout << "读取文件..." << std::endl;
            
            // 模拟异常
            throw std::runtime_error("模拟异常");
            
            // 这里不会执行
            std::cout << "这行不会打印" << std::endl;
        }
    } catch (const std::exception& e) {
        std::cout << "捕获异常: " << e.what() << std::endl;
        std::cout << "即使发生异常，FileGuard 也会在析构函数中关闭文件" << std::endl;
    }
}

void test_mutex_guard() {
    std::cout << "\n=== MutexGuard 测试 ===" << std::endl;
    
    std::mutex mtx;
    int counter = 0;
    
    auto worker = [&](int id) {
        for (int i = 0; i < 3; ++i) {
            {
                MutexGuard guard(mtx);
                ++counter;
                std::cout << "线程 " << id << " 增加计数器: " << counter << std::endl;
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
        }
    };
    
    std::vector<std::thread> threads;
    for (int i = 0; i < 3; ++i) {
        threads.emplace_back(worker, i);
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    std::cout << "最终计数器值: " << counter << std::endl;
}

int main() {
    test_file_guard();
    test_mutex_guard();
    return 0;
}
