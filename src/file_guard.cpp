#include "file_guard.h"
#include <iostream>
#include <utility>

FileGuard::FileGuard(const std::string& filename, const std::string& mode)
    : file_(std::fopen(filename.c_str(), mode.c_str())) {
    std::cout << "FileGuard: 打开文件 " << filename << std::endl;
    if (!file_) {
        throw std::runtime_error("无法打开文件: " + filename);
    }
}

FileGuard::~FileGuard() noexcept {
    if (file_) {
        std::cout << "FileGuard: 关闭文件" << std::endl;
        std::fclose(file_);
        file_ = nullptr;
    }
}

FileGuard::FileGuard(FileGuard&& other) noexcept
    : file_(other.file_) {
    std::cout << "FileGuard: 移动构造" << std::endl;
    other.file_ = nullptr; // 源对象置空，避免双重释放
}

FileGuard& FileGuard::operator=(FileGuard&& other) noexcept {
    std::cout << "FileGuard: 移动赋值" << std::endl;
    if (this != &other) {
        // 先释放自己的资源
        if (file_) {
            std::fclose(file_);
        }
        
        // 获取other的资源并将other置空
        file_ = other.file_;
        other.file_ = nullptr;
    }
    return *this;
}

bool FileGuard::is_open() const {
    return file_ != nullptr;
}

FILE* FileGuard::get() const {
    return file_;
}

FILE* FileGuard::release() {
    FILE* temp = file_;
    file_ = nullptr;
    return temp;
}
