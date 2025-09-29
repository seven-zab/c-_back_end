#ifndef BUFFER_H
#define BUFFER_H

#include <cstddef>
#include <vector>
#include <cstdint>

// Rule of Five 版本 - 手动管理资源
class Buffer {
public:
    // 构造函数
    Buffer(size_t size = 0);
    
    // 析构函数
    ~Buffer() noexcept;
    
    // 拷贝构造
    Buffer(const Buffer& other);
    
    // 拷贝赋值
    Buffer& operator=(const Buffer& other);
    
    // 移动构造
    Buffer(Buffer&& other) noexcept;
    
    // 移动赋值
    Buffer& operator=(Buffer&& other) noexcept;
    
    // 接口
    size_t size() const;
    char* data();
    const char* data() const;
    char& operator[](size_t index);
    const char& operator[](size_t index) const;
    
private:
    char* data_;
    size_t size_;
};

// Rule of Zero 版本 - 使用标准库容器
class BufferZero {
public:
    // 使用默认的特殊成员函数
    BufferZero(size_t size = 0) : data_(size) {}
    
    // 接口
    size_t size() const { return data_.size(); }
    uint8_t* data() { return data_.data(); }
    const uint8_t* data() const { return data_.data(); }
    uint8_t& operator[](size_t index) { return data_.at(index); }
    const uint8_t& operator[](size_t index) const { return data_.at(index); }
    
private:
    std::vector<uint8_t> data_;
};

#endif // BUFFER_H
