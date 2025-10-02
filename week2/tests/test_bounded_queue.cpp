#include "bounded_queue.h"
#include <cassert>

int main(){
  BoundedQueue q(2);
  assert(q.push(1));
  assert(q.push(2));
  int x;
  assert(!q.push(3)); // 满
  assert(q.pop(x) && x==1);
  assert(q.pop(x) && x==2);
  assert(!q.pop(x)); // 空
  return 0;
}