// 本示例演示典型的「生产者-消费者」并发模型：
// - 使用自定义的 BoundedQueue（有界队列）在多线程间传递数据；
// - 用 std::thread 启动生产者/消费者线程；
// - 用 std::atomic 统计成功入队/出队的次数，避免数据竞争；
// - 该队列当前实现为非阻塞 push/pop：队满/队空直接返回 false。
//   便于快速压测吞吐，但会出现“丢包”（失败尝试），后续可升级为阻塞版本。

#include "bounded_queue.h"       // 自定义线程安全队列的声明（互斥锁 + 条件变量，当前非阻塞）
#include <thread>                 // std::thread：线程的创建与管理
#include <vector>                 // std::vector：存放多个线程对象
#include <iostream>               // 标准输出，打印统计结果
#include <atomic>                 // std::atomic：原子计数器，保证无锁下的增减安全

int main(){
  // 创建一个容量为 10 的有界队列。
  // 知识点：容量(capacity)用于限制并发下的内存占用与生产-消费速率。
  // 当前 push/pop 非阻塞：队满/空时直接返回 false，不会等待；
  // 若需要“阻塞等待”，可在实现中使用 condition_variable 的 wait。
  BoundedQueue q(10);

  // 使用原子计数器统计成功的入队/出队次数。
  // 知识点：std::atomic<int> 默认是顺序一致性（seq_cst）内存序，
  // 保证所有线程看到的操作有全局一致的顺序，适合简单正确性统计。
  // 若追求更高性能，可按需使用 memory_order_relaxed 等更弱内存序。
  std::atomic<int> produced{0}, consumed{0};

  // 分别创建生产者与消费者线程的容器。
  // 知识点：线程对象需在退出前 join 或 detach，否则析构时如果线程仍可被 join，会导致 std::terminate。
  std::vector<std::thread> producers, consumers;

  // 启动 2 个生产者线程。
  // 知识点：Lambda 捕获使用 [&] 按引用捕获外部变量（q、produced 等）。
  // 按引用便于原子计数器与队列在多个线程间共享；若按值捕获会拷贝，可能造成逻辑错误或性能问题。
  for(int i=0;i<2;++i){
    producers.emplace_back([&]{
      // 背压策略：当队满时，尝试在有限时间内等待；
      // 若超时仍满，则小睡一会（限速）后重试，避免忙等与无限增长。
      using namespace std::chrono_literals;
      for(int n=0;n<1000;++n){
        if(q.push_wait(n, 5ms)) {
          ++produced;
        } else {
          std::this_thread::sleep_for(1ms); // 简单限流：减轻生产压力
        }
      }
    });
  }
  // 启动 2 个消费者线程。
  // 知识点：pop 非阻塞，队空时返回 false；若使用阻塞版本，消费者会在队列为空时等待，
  // 与条件变量搭配能避免忙等（busy-wait），提升 CPU 使用效率。
  for(int i=0;i<2;++i){
    consumers.emplace_back([&]{
      // 消费端在队空时等待一段时间，超时则继续循环（可结合告警指标）。
      using namespace std::chrono_literals;
      int x;
      for(int n=0;n<1000;++n){
        if(q.pop_wait(x, 10ms)) {
          ++consumed;
        } else {
          // 超时：可以记录日志或触发告警，这里做轻量等待避免忙等
          std::this_thread::sleep_for(1ms);
        }
      }
    });
  }
  // 等待所有线程执行完毕。
  // 知识点：join 会阻塞当前线程直到目标线程结束；
  // 如果不 join（也不 detach），线程对象析构时程序会调用 std::terminate 导致异常退出。
  for(auto &t: producers) t.join();
  for(auto &t: consumers) t.join();

  // 读取原子变量的值并打印。
  // 知识点：atomic.load() 在默认内存序下也提供顺序一致性；
  // 此处只用于最终结果展示，没有可见性或竞态风险。
  // 打印统计，包括队列内部指标，便于观察背压与等待效果。
  auto st = q.stats();
  std::cout << "produced=" << produced.load() << ", consumed=" << consumed.load() << "\n";
  std::cout << "queue stats: pushes=" << st.pushes
            << ", pops=" << st.pops
            << ", rejected_push=" << st.rejected_push
            << ", rejected_pop=" << st.rejected_pop
            << ", wait_push=" << st.wait_push
            << ", wait_pop=" << st.wait_pop << "\n";
  return 0;
}