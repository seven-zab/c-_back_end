#pragma once
#include <mutex>
#include <condition_variable>
#include <queue>
#include <atomic>
#include <chrono>

// 有界队列：支持非阻塞 push/pop，以及带超时的阻塞 push_wait/pop_wait。
class BoundedQueue {
public:
  explicit BoundedQueue(size_t capacity);

  // 非阻塞接口：满/空直接返回 false。
  bool push(int value);
  bool pop(int &out);

  // 阻塞接口：在满/空时等待，超过 timeout 返回 false。
  bool push_wait(int value, std::chrono::milliseconds timeout);
  bool pop_wait(int &out, std::chrono::milliseconds timeout);

  // 监控接口：容量、当前大小与统计信息。
  size_t capacity() const { return cap_; }
  size_t size() const;

  struct Stats {
    size_t pushes;         // 成功入队次数
    size_t pops;           // 成功出队次数
    size_t rejected_push;  // 因队满被拒绝/超时次数
    size_t rejected_pop;   // 因队空被拒绝/超时次数
    size_t wait_push;      // push_wait 进入等待次数（可能多次）
    size_t wait_pop;       // pop_wait 进入等待次数（可能多次）
  };
  Stats stats() const;

private:
  mutable std::mutex mtx_;
  std::condition_variable cv_not_full_;
  std::condition_variable cv_not_empty_;
  std::queue<int> q_;
  size_t cap_;

  // 指标计数器
  std::atomic<size_t> pushes_{0};
  std::atomic<size_t> pops_{0};
  std::atomic<size_t> rejected_push_{0};
  std::atomic<size_t> rejected_pop_{0};
  std::atomic<size_t> wait_push_{0};
  std::atomic<size_t> wait_pop_{0};
};