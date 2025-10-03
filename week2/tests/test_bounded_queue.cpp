#include "bounded_queue.h"
#include <cassert>
using namespace std::chrono_literals;

int main(){
  // 非阻塞基本行为
  BoundedQueue q(2);
  assert(q.push(1));
  assert(q.push(2));
  int x;
  assert(!q.push(3)); // 满
  assert(q.pop(x) && x==1);
  assert(q.pop(x) && x==2);
  assert(!q.pop(x)); // 空

  // 阻塞 + 超时：在空队列上 pop_wait 超时返回 false
  assert(!q.pop_wait(x, 1ms));

  // 阻塞 push_wait：先填满，然后在另一个线程中消费，再验证 push_wait 能成功
  assert(q.push(10));
  assert(q.push(20));
  // 满时 push_wait 会等待，下面启动一个线程消费元素以唤醒
  std::thread consumer([&]{
    std::this_thread::sleep_for(2ms);
    int y; q.pop_wait(y, 10ms);
  });
  assert(q.push_wait(30, 10ms));
  consumer.join();

  return 0;
}