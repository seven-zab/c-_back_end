#ifndef MUTEX_GUARD_H
#define MUTEX_GUARD_H

#include <mutex>

class MutexGuard {
public:
    // 构造函数，获取锁
    explicit MutexGuard(std::mutex& mutex);
    
    // 析构函数，释放锁
    ~MutexGuard() noexcept;
    
    // 禁止拷贝和移动
    MutexGuard(const MutexGuard&) = delete;
    MutexGuard& operator=(const MutexGuard&) = delete;
    MutexGuard(MutexGuard&&) = delete;
    MutexGuard& operator=(MutexGuard&&) = delete;
    
private:
    std::mutex& mutex_;
};

#endif // MUTEX_GUARD_H
