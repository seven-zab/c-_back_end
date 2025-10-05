#pragma once
#include <condition_variable>
#include <mutex>
#include <queue>
#include <atomic>

// 线程安全有界队列（阻塞 + 超时 + 统计）
// 中文注释：
// - 使用 mutex + condition_variable 保证并发下对共享队列的互斥访问与等待/唤醒。
// - 使用原子计数统计入/出队、等待与拒绝次数，便于在生产环境做监控与告警。
// - 关键知识点：
//   * std::mutex：互斥锁，保证同一时刻只有一个线程进入临界区。
//   * std::lock_guard：RAII 封装，作用域结束自动解锁，避免忘记 unlock 导致死锁。
//   * std::unique_lock：支持 lock/unlock，配合条件变量的 wait/wait_for 使用。
//   * std::condition_variable：条件等待与唤醒，避免忙等，提高效率。必须在持有锁状态下使用。
//   * std::atomic：原子操作，避免数据竞态。这里用于指标计数；不用于保护队列本身。
//   * 伪唤醒（spurious wakeup）：wait/wait_for 必须搭配谓词（lambda）重复检查条件。
//   * 内存模型：condition_variable 与互斥锁提供一致性保障；原子计数默认 sequential consistency。

class BoundedQueue {
public:
    explicit BoundedQueue(size_t capacity);

    // 非阻塞入队：满则返回 false
    bool push(int value);
    // 阻塞入队（带超时）：满则等待，超时返回 false
    bool push_wait(int value, std::chrono::milliseconds timeout);

    // 非阻塞出队：空则返回 false
    bool pop(int &out);
    // 阻塞出队（带超时）：空则等待，超时返回 false
    bool pop_wait(int &out, std::chrono::milliseconds timeout);

    size_t capacity() const;
    size_t size() const; // 需要加锁读取

    struct Stats {
        size_t pushes;
        size_t pops;
        size_t rejected_push;
        size_t rejected_pop;
        size_t wait_push;
        size_t wait_pop;
    };

    Stats stats() const;

private:
    size_t capacity_;
    mutable std::mutex mtx_;
    std::condition_variable not_full_;
    std::condition_variable not_empty_;
    std::queue<int> q_;

    std::atomic<size_t> pushes_{0};
    std::atomic<size_t> pops_{0};
    std::atomic<size_t> rejected_push_{0};
    std::atomic<size_t> rejected_pop_{0};
    std::atomic<size_t> wait_push_{0};
    std::atomic<size_t> wait_pop_{0};
};