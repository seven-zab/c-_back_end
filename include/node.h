#ifndef NODE_H
#define NODE_H

#include <memory>
#include <string>
#include <vector>

class Node {
public:
    explicit Node(const std::string& name);
    
    void add_child(std::shared_ptr<Node> child);
    void set_parent(std::shared_ptr<Node> parent);
    void set_parent_weak(std::weak_ptr<Node> parent);
    
    std::string get_name() const;
    size_t get_child_count() const;
    long get_parent_use_count() const;
    
private:
    std::string name_;
    std::vector<std::shared_ptr<Node>> children_;
    
    // 使用 weak_ptr 避免循环引用
    std::weak_ptr<Node> parent_weak_;
    
    // 故意使用 shared_ptr 制造循环引用（用于演示问题）
    std::shared_ptr<Node> parent_shared_;
};

#endif // NODE_H
