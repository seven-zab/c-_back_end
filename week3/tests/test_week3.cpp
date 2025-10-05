#include <cassert>
#include <thread>
#include <chrono>
#include "../include/bounded_queue.h"

// 简易测试：
// - 非阻塞 push/pop 边界行为
// - pop_wait 的超时行为
// - 并发生产者/消费者在阻塞队列上的正确性

int main() {
    {
        BoundedQueue q(2);
        assert(q.push(1));
        assert(q.push(2));
        int x;
        // 队满：非阻塞 push 失败
        assert(!q.push(3));
        // 非阻塞 pop 成功
        assert(q.pop(x) && x == 1);
        assert(q.pop(x) && x == 2);
        // 队空：非阻塞 pop 失败
        assert(!q.pop(x));
    }

    {
        BoundedQueue q(1);
        int x;
        // 空队列：pop_wait 超时返回 false（10ms）
        auto t0 = std::chrono::steady_clock::now();
        bool ok = q.pop_wait(x, std::chrono::milliseconds(10));
        auto t1 = std::chrono::steady_clock::now();
        assert(!ok);
        assert(std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count() >= 9);
    }

    {
        // 并发正确性：两个生产者、两个消费者
        BoundedQueue q(8);
        std::atomic<int> sink{0};
        std::thread p1([&]{ for (int i=0;i<100;++i) q.push_wait(i, std::chrono::milliseconds(50)); });
        std::thread p2([&]{ for (int i=0;i<100;++i) q.push_wait(1000+i, std::chrono::milliseconds(50)); });
        std::thread c1([&]{ int v, cnt=0; while (cnt<100){ if(q.pop_wait(v,std::chrono::milliseconds(50))){ sink.fetch_add(v); ++cnt; } } });
        std::thread c2([&]{ int v, cnt=0; while (cnt<100){ if(q.pop_wait(v,std::chrono::milliseconds(50))){ sink.fetch_add(v); ++cnt; } } });
        p1.join(); p2.join(); c1.join(); c2.join();
        auto st = q.stats();
        assert(st.pushes == 200 && st.pops == 200);
        // 验证没有出现数据遗漏：总和应为已知值
        // sum(0..99) = 4950; sum(1000..1099) = 100*1000 + 4950 = 104950
        assert(sink.load() == 4950 + 104950);
    }

    return 0;
}