#include "buffer.h"
#include <algorithm>
#include <iostream>
#include <stdexcept>

Buffer::Buffer(size_t size)
    : data_(size > 0 ? new char[size]() : nullptr), size_(size) {
    std::cout << "Buffer: 构造 size=" << size_ << " 地址=" << static_cast<void*>(data_) << std::endl;
}

Buffer::~Buffer() noexcept {
    std::cout << "Buffer: 析构 地址=" << static_cast<void*>(data_) << std::endl;
    delete[] data_;
    data_ = nullptr;
    size_ = 0;
}

Buffer::Buffer(const Buffer& other)
    : data_(other.size_ > 0 ? new char[other.size_] : nullptr), size_(other.size_) {
    std::cout << "Buffer: 拷贝构造 size=" << size_ << std::endl;
    if (size_ > 0) {
        std::copy(other.data_, other.data_ + size_, data_);
    }
}

Buffer& Buffer::operator=(const Buffer& other) {
    std::cout << "Buffer: 拷贝赋值" << std::endl;
    if (this != &other) {
        // 创建临时副本（强异常安全）
        Buffer temp(other);
        // 交换资源
        std::swap(data_, temp.data_);
        std::swap(size_, temp.size_);
        // temp析构时会释放原来的资源
    }
    return *this;
}

Buffer::Buffer(Buffer&& other) noexcept
    : data_(other.data_), size_(other.size_) {
    std::cout << "Buffer: 移动构造" << std::endl;
    other.data_ = nullptr;
    other.size_ = 0;
}

Buffer& Buffer::operator=(Buffer&& other) noexcept {
    std::cout << "Buffer: 移动赋值" << std::endl;
    if (this != &other) {
        // 释放自己的资源
        delete[] data_;
        
        // 获取other的资源
        data_ = other.data_;
        size_ = other.size_;
        
        // 将other置空
        other.data_ = nullptr;
        other.size_ = 0;
    }
    return *this;
}

size_t Buffer::size() const {
    return size_;
}

char* Buffer::data() {
    return data_;
}

const char* Buffer::data() const {
    return data_;
}

char& Buffer::operator[](size_t index) {
    if (index >= size_) {
        throw std::out_of_range("Buffer: 索引越界");
    }
    return data_[index];
}

const char& Buffer::operator[](size_t index) const {
    if (index >= size_) {
        throw std::out_of_range("Buffer: 索引越界");
    }
    return data_[index];
}
