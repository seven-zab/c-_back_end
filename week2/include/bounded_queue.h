#pragma once
#include <mutex>
#include <condition_variable>
#include <queue>

class BoundedQueue {
public:
  explicit BoundedQueue(size_t capacity);
  bool push(int value); // 返回false表示队列满（非阻塞版本）
  bool pop(int &out);   // 返回false表示队列空（非阻塞版本）

private:
  std::mutex mtx_;
  std::condition_variable cv_not_full_;
  std::condition_variable cv_not_empty_;
  std::queue<int> q_;
  size_t cap_;
};