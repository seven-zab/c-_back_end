#include "bounded_queue.h"

BoundedQueue::BoundedQueue(size_t capacity) : cap_(capacity) {}

bool BoundedQueue::push(int value) {
  std::unique_lock<std::mutex> lock(mtx_);
  if (q_.size() >= cap_) { rejected_push_++; return false; }
  q_.push(value);
  pushes_++;
  cv_not_empty_.notify_one();
  return true;
}

bool BoundedQueue::pop(int &out) {
  std::unique_lock<std::mutex> lock(mtx_);
  if (q_.empty()) { rejected_pop_++; return false; }
  out = q_.front();
  q_.pop();
  pops_++;
  cv_not_full_.notify_one();
  return true;
}

bool BoundedQueue::push_wait(int value, std::chrono::milliseconds timeout) {
  std::unique_lock<std::mutex> lock(mtx_);
  if (q_.size() >= cap_) {
    wait_push_++;
    if (!cv_not_full_.wait_for(lock, timeout, [&]{ return q_.size() < cap_; })) {
      rejected_push_++;
      return false; // 超时
    }
  }
  q_.push(value);
  pushes_++;
  cv_not_empty_.notify_one();
  return true;
}

bool BoundedQueue::pop_wait(int &out, std::chrono::milliseconds timeout) {
  std::unique_lock<std::mutex> lock(mtx_);
  if (q_.empty()) {
    wait_pop_++;
    if (!cv_not_empty_.wait_for(lock, timeout, [&]{ return !q_.empty(); })) {
      rejected_pop_++;
      return false; // 超时
    }
  }
  out = q_.front();
  q_.pop();
  pops_++;
  cv_not_full_.notify_one();
  return true;
}

size_t BoundedQueue::size() const {
  std::lock_guard<std::mutex> lock(mtx_);
  return q_.size();
}

BoundedQueue::Stats BoundedQueue::stats() const {
  return Stats{pushes_.load(), pops_.load(), rejected_push_.load(), rejected_pop_.load(), wait_push_.load(), wait_pop_.load()};
}