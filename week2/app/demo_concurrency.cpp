#include "bounded_queue.h"
#include <thread>
#include <vector>
#include <iostream>
#include <atomic>

int main(){
  BoundedQueue q(10);
  std::atomic<int> produced{0}, consumed{0};

  std::vector<std::thread> producers, consumers;
  for(int i=0;i<2;++i){
    producers.emplace_back([&]{
      for(int n=0;n<1000;++n){
        if(q.push(n)) ++produced;
      }
    });
  }
  for(int i=0;i<2;++i){
    consumers.emplace_back([&]{
      int x;
      for(int n=0;n<1000;++n){
        if(q.pop(x)) ++consumed;
      }
    });
  }
  for(auto &t: producers) t.join();
  for(auto &t: consumers) t.join();

  std::cout << "produced=" << produced.load() << ", consumed=" << consumed.load() << "\n";
  return 0;
}