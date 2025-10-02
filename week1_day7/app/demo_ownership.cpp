#include "node.h"
#include <iostream>
#include <memory>

// 工厂函数返回unique_ptr
std::unique_ptr<int> make_unique_int(int value) {
    return std::make_unique<int>(value);
}

// 非拥有引用使用裸指针
void use_int(int* ptr) {
    if (ptr) {
        std::cout << "使用值: " << *ptr << std::endl;
    }
}

void test_unique_ptr() {
    std::cout << "\n=== unique_ptr 测试 ===" << std::endl;
    
    // 创建unique_ptr
    auto p1 = std::make_unique<int>(42);
    std::cout << "p1 指向: " << *p1 << std::endl;
    
    // 使用工厂函数
    auto p2 = make_unique_int(100);
    std::cout << "p2 指向: " << *p2 << std::endl;
    
    // 非拥有引用
    use_int(p1.get());
    
    // 所有权转移
    auto p3 = std::move(p1);
    std::cout << "p3 指向: " << *p3 << std::endl;
    
    // p1现在为空
    std::cout << "p1 是否为空: " << (p1 == nullptr ? "是" : "否") << std::endl;
    
    // 故意制造错误（取消注释以测试）
    // std::cout << "错误使用已移动的p1: " << *p1 << std::endl;
    
    // 正确做法：检查是否为空
    if (p1) {
        std::cout << "p1 指向: " << *p1 << std::endl;
    } else {
        std::cout << "p1 为空，不能解引用" << std::endl;
    }
}

void test_shared_ptr() {
    std::cout << "\n=== shared_ptr/weak_ptr 测试 ===" << std::endl;
    
    // 创建节点
    auto root = std::make_shared<Node>("Root");
    std::cout << "root 引用计数: " << root.use_count() << std::endl;
    
    // 添加子节点（使用weak_ptr避免循环引用）
    auto child1 = std::make_shared<Node>("Child1");
    auto child2 = std::make_shared<Node>("Child2");
    
    root->add_child(child1);
    root->add_child(child2);
    
    std::cout << "添加子节点后 root 引用计数: " << root.use_count() << std::endl;
    std::cout << "child1 引用计数: " << child1.use_count() << std::endl;
    
    // 制造循环引用（取消注释以测试）
    child1->set_parent(root);
    std::cout << "设置父节点后 root 引用计数: " << root.use_count() << std::endl;
    std::cout << "设置父节点后 child1 引用计数: " << child1.use_count() << std::endl;
    
    // 使用weak_ptr（正确做法）
    auto child3 = std::make_shared<Node>("Child3");
    root->add_child(child3);
    
    std::cout << "root 子节点数量: " << root->get_child_count() << std::endl;
}

int main() {
    test_unique_ptr();
    test_shared_ptr();
    return 0;
}
