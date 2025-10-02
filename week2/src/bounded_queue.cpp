#include "bounded_queue.h"

BoundedQueue::BoundedQueue(size_t capacity) : cap_(capacity) {}

bool BoundedQueue::push(int value) {
  std::unique_lock<std::mutex> lock(mtx_);
  if (q_.size() >= cap_) return false; // 非阻塞版本，可扩展为阻塞等待
  q_.push(value);
  cv_not_empty_.notify_one();
  return true;
}

bool BoundedQueue::pop(int &out) {
  std::unique_lock<std::mutex> lock(mtx_);
  if (q_.empty()) return false; // 非阻塞版本，可扩展为阻塞等待
  out = q_.front();
  q_.pop();
  cv_not_full_.notify_one();
  return true;
}