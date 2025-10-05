#include <iostream>
#include <thread>
#include <vector>
#include <chrono>
#include <atomic>
#include <mutex>
#include "../include/bounded_queue.h"

// 中文说明：
// 本示例包含：
// 1) 线程安全 BoundedQueue 的生产者-消费者模型（阻塞 + 超时 + 简单背压）。
// 2) 竞态演示：一个未加锁的共享变量 inc_race，展示数据竞争；随后修复为 atomic。
// 3) 死锁演示：两个互斥锁相反顺序加锁导致死锁；随后给出避免方案（统一锁顺序或 std::scoped_lock）。
// 4) 相关知识点：std::thread / mutex / lock_guard / unique_lock / condition_variable / atomic；锁粒度与分层；伪唤醒；内存模型。

static void producer(BoundedQueue &q, int base, int count) {
    for (int i = 0; i < count; ++i) {
        int value = base + i;
        // 背压策略：先尝试带超时阻塞入队，若超时则轻量 sleep 限速
        if (!q.push_wait(value, std::chrono::milliseconds(5))) {
            std::this_thread::sleep_for(std::chrono::milliseconds(1));
        }
    }
}

static void consumer(BoundedQueue &q, std::atomic<int> &sink, int count) {
    int v;
    int consumed = 0;
    while (consumed < count) {
        if (q.pop_wait(v, std::chrono::milliseconds(10))) {
            sink.fetch_add(v, std::memory_order_relaxed);
            ++consumed;
        } else {
            // 超时：数据暂时不足，轻量休眠避免忙等
            std::this_thread::sleep_for(std::chrono::milliseconds(1));
        }
    }
}

// 竞态演示：未加锁的共享变量
static int inc_race = 0; // 故意不加锁，会产生 data race

// 修复版本：使用原子
static std::atomic<int> inc_atomic{0};

void run_race_demo() {
    // 说明：多个线程并发 ++inc_race，未同步会触发 TSan 报告。
    inc_race = 0; inc_atomic.store(0);
    const int threads = 4;
    const int loops = 100000;
    std::vector<std::thread> tv;
    for (int t = 0; t < threads; ++t) {
        tv.emplace_back([&]{
            for (int i = 0; i < loops; ++i) {
                // 有竞态：读-改-写非原子
                inc_race++; // 故意错误
                inc_atomic.fetch_add(1, std::memory_order_relaxed);
            }
        });
    }
    for (auto &th : tv) th.join();
    std::cout << "race demo: inc_race=" << inc_race
              << ", inc_atomic=" << inc_atomic.load() << "\n";
}

// 死锁演示：两个互斥锁以相反顺序加锁
// 为避免示例无限阻塞，使用 timed_mutex + try_lock_for 展示潜在死锁
std::timed_mutex m1, m2;

void run_deadlock_demo(bool fix) {
    auto f1 = [&]{
        if (fix) {
            // 修复：使用 scoped_lock 一次性锁住多个互斥锁，避免顺序问题
            std::scoped_lock lk(m1, m2);
            std::this_thread::sleep_for(std::chrono::milliseconds(1));
        } else {
            std::unique_lock<std::timed_mutex> lk1(m1, std::defer_lock);
            if (lk1.try_lock_for(std::chrono::milliseconds(10))) {
                std::this_thread::sleep_for(std::chrono::milliseconds(1));
                std::unique_lock<std::timed_mutex> lk2(m2, std::defer_lock);
                if (!lk2.try_lock_for(std::chrono::milliseconds(10))) {
                    std::cout << "deadlock demo: thread1 failed to lock m2, potential deadlock avoided by timeout\n";
                }
            } else {
                std::cout << "deadlock demo: thread1 failed to lock m1\n";
            }
        }
    };
    auto f2 = [&]{
        if (fix) {
            std::scoped_lock lk(m1, m2);
            std::this_thread::sleep_for(std::chrono::milliseconds(1));
        } else {
            std::unique_lock<std::timed_mutex> lk2(m2, std::defer_lock);
            if (lk2.try_lock_for(std::chrono::milliseconds(10))) {
                std::this_thread::sleep_for(std::chrono::milliseconds(1));
                std::unique_lock<std::timed_mutex> lk1(m1, std::defer_lock);
                if (!lk1.try_lock_for(std::chrono::milliseconds(10))) {
                    std::cout << "deadlock demo: thread2 failed to lock m1, potential deadlock avoided by timeout\n";
                }
            } else {
                std::cout << "deadlock demo: thread2 failed to lock m2\n";
            }
        }
    };

    std::thread t1(f1), t2(f2);
    t1.join(); t2.join();
    std::cout << "deadlock demo done, fix=" << fix << "\n";
}

int main() {
    // 1) 生产者-消费者示例
    BoundedQueue q(64);
    std::atomic<int> sink{0};

    std::thread p1(producer, std::ref(q), 0, 500);
    std::thread p2(producer, std::ref(q), 1000, 500);
    std::thread c1(consumer, std::ref(q), std::ref(sink), 500);
    std::thread c2(consumer, std::ref(q), std::ref(sink), 500);

    p1.join(); p2.join(); c1.join(); c2.join();
    auto st = q.stats();
    std::cout << "week3 demo: produced=1000, sink=" << sink.load() << "\n";
    std::cout << "queue stats: pushes=" << st.pushes << ", pops=" << st.pops
              << ", rejected_push=" << st.rejected_push
              << ", rejected_pop=" << st.rejected_pop
              << ", wait_push=" << st.wait_push
              << ", wait_pop=" << st.wait_pop << "\n";

    // 2) 竞态演示（TSan 可检测）
    run_race_demo();

    // 3) 死锁演示：先触发，再修复
    run_deadlock_demo(false);
    run_deadlock_demo(true);

    return 0;
}