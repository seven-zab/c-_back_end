#include "mutex_guard.h"
#include <iostream>

MutexGuard::MutexGuard(std::mutex& mutex)
    : mutex_(mutex) {
    std::cout << "MutexGuard: 获取锁" << std::endl;
    mutex_.lock();
}

MutexGuard::~MutexGuard() noexcept {
    std::cout << "MutexGuard: 释放锁" << std::endl;
    mutex_.unlock();
}
