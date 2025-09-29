#ifndef FILE_GUARD_H
#define FILE_GUARD_H

#include <cstdio>
#include <string>

class FileGuard {
public:
    // 构造函数，获取资源
    explicit FileGuard(const std::string& filename, const std::string& mode);
    
    // 析构函数，释放资源
    ~FileGuard() noexcept;
    
    // 禁止拷贝
    FileGuard(const FileGuard&) = delete;
    FileGuard& operator=(const FileGuard&) = delete;
    
    // 允许移动
    FileGuard(FileGuard&& other) noexcept;
    FileGuard& operator=(FileGuard&& other) noexcept;
    
    // 接口
    bool is_open() const;
    FILE* get() const;
    FILE* release(); // 释放所有权
    
private:
    FILE* file_;
};

#endif // FILE_GUARD_H
