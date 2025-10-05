#include "../include/bounded_queue.h"

BoundedQueue::BoundedQueue(size_t capacity) : capacity_(capacity) {}

bool BoundedQueue::push(int value) {
    std::unique_lock<std::mutex> lock(mtx_);
    if (q_.size() >= capacity_) {
        rejected_push_++;
        return false; // 满队列：非阻塞失败
    }
    q_.push(value);
    pushes_++;
    // 入队后通知可能等待的消费者
    not_empty_.notify_one();
    return true;
}

bool BoundedQueue::push_wait(int value, std::chrono::milliseconds timeout) {
    std::unique_lock<std::mutex> lock(mtx_);
    // wait_for 可能出现伪唤醒，必须用谓词重复检查条件
    bool ok = not_full_.wait_for(lock, timeout, [&]{ return q_.size() < capacity_; });
    if (!ok) { // 超时仍满
        rejected_push_++;
        return false;
    }
    wait_push_++;
    q_.push(value);
    pushes_++;
    not_empty_.notify_one();
    return true;
}

bool BoundedQueue::pop(int &out) {
    std::unique_lock<std::mutex> lock(mtx_);
    if (q_.empty()) {
        rejected_pop_++;
        return false; // 空队列：非阻塞失败
    }
    out = q_.front();
    q_.pop();
    pops_++;
    // 出队后通知可能等待的生产者
    not_full_.notify_one();
    return true;
}

bool BoundedQueue::pop_wait(int &out, std::chrono::milliseconds timeout) {
    std::unique_lock<std::mutex> lock(mtx_);
    bool ok = not_empty_.wait_for(lock, timeout, [&]{ return !q_.empty(); });
    if (!ok) {
        rejected_pop_++;
        return false; // 超时仍为空
    }
    wait_pop_++;
    out = q_.front();
    q_.pop();
    pops_++;
    not_full_.notify_one();
    return true;
}

size_t BoundedQueue::capacity() const { return capacity_; }

size_t BoundedQueue::size() const {
    std::lock_guard<std::mutex> g(mtx_);
    return q_.size();
}

BoundedQueue::Stats BoundedQueue::stats() const {
    return Stats{
        pushes_.load(),
        pops_.load(),
        rejected_push_.load(),
        rejected_pop_.load(),
        wait_push_.load(),
        wait_pop_.load()
    };
}