#pragma once
#include <memory>
#include <cstddef>
#include <algorithm>
#include <stdexcept>

namespace mycore {

class Buffer {
public:
    Buffer() = default; // Rule of Zero 适用于默认行为
    explicit Buffer(std::size_t size) : size_(size), data_(std::make_unique<char[]>(size)) {}

    // 禁止拷贝：突出“拥有权”唯一性
    Buffer(const Buffer&) = delete;
    Buffer& operator=(const Buffer&) = delete;

    // 允许移动：转移资源所有权
    Buffer(Buffer&&) noexcept = default;
    Buffer& operator=(Buffer&&) noexcept = default;

    char* data() noexcept { return data_.get(); }
    const char* data() const noexcept { return data_.get(); }
    std::size_t size() const noexcept { return size_; }

    void fill(char value) {
        if (!data_) throw std::runtime_error("Buffer not allocated");
        std::fill_n(data_.get(), size_, value);
    }

private:
    std::size_t size_{0};
    std::unique_ptr<char[]> data_{};
};

} // namespace mycore
