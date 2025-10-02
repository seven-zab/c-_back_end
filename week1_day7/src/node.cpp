#include "node.h"
#include <iostream>

Node::Node(const std::string& name)
    : name_(name) {
    std::cout << "Node: 创建节点 " << name_ << std::endl;
}

void Node::add_child(std::shared_ptr<Node> child) {
    std::cout << "Node: " << name_ << " 添加子节点 " << child->get_name() << std::endl;
    children_.push_back(child);
    
    // 子节点设置父节点（使用weak_ptr避免循环引用）
    child->set_parent_weak(std::shared_ptr<Node>(this, [](Node*){})); // 非拥有指针
}

void Node::set_parent(std::shared_ptr<Node> parent) {
    std::cout << "Node: " << name_ << " 设置父节点 " << parent->get_name() << "（使用shared_ptr - 可能导致循环引用）" << std::endl;
    parent_shared_ = parent;
}

void Node::set_parent_weak(std::weak_ptr<Node> parent) {
    std::cout << "Node: " << name_ << " 设置父节点（使用weak_ptr - 安全）" << std::endl;
    parent_weak_ = parent;
}

std::string Node::get_name() const {
    return name_;
}

size_t Node::get_child_count() const {
    return children_.size();
}

long Node::get_parent_use_count() const {
    return parent_weak_.use_count();
}
