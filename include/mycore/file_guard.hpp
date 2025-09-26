#pragma once
#include <cstdio>
#include <string>
#include <stdexcept>

namespace mycore {

class FileGuard {
public:
    FileGuard() noexcept : fp_(nullptr) {}
    explicit FileGuard(const std::string& path, const char* mode) : fp_(nullptr) { open(path, mode); }
    ~FileGuard() { close(); }

    // 禁止拷贝，独占资源
    FileGuard(const FileGuard&) = delete;
    FileGuard& operator=(const FileGuard&) = delete;

    // 允许移动，转移所有权
    FileGuard(FileGuard&& other) noexcept : fp_(other.fp_), path_(std::move(other.path_)) {
        other.fp_ = nullptr;
    }
    FileGuard& operator=(FileGuard&& other) noexcept {
        if (this != &other) {
            close();
            fp_ = other.fp_;
            path_ = std::move(other.path_);
            other.fp_ = nullptr;
        }
        return *this;
    }

    void open(const std::string& path, const char* mode);
    void close() noexcept;

    std::FILE* get() const noexcept { return fp_; }
    bool valid() const noexcept { return fp_ != nullptr; }
    const std::string& path() const noexcept { return path_; }

    // 简单读写封装，抛异常表示错误
    size_t read(char* buf, size_t size);
    size_t write(const char* buf, size_t size);

    void rewind();
    bool eof() const;

private:
    std::FILE* fp_;
    std::string path_;
};

} // namespace mycore
