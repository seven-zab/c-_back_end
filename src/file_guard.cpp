#include "mycore/file_guard.hpp"
#include <cerrno>
#include <cstring>

namespace mycore {

void FileGuard::open(const std::string& path, const char* mode) {
    close();
    if (path.empty()) {
        throw std::runtime_error("Empty file path");
    }
    fp_ = std::fopen(path.c_str(), mode);
    path_ = path;
    if (!fp_) {
        throw std::runtime_error(std::string("fopen failed: ") + std::strerror(errno) + " path=" + path);
    }
}

void FileGuard::close() noexcept {
    if (fp_) {
        std::fclose(fp_);
        fp_ = nullptr;
    }
}

size_t FileGuard::read(char* buf, size_t size) {
    if (!fp_) throw std::runtime_error("read on null file: " + path_);
    return std::fread(buf, 1, size, fp_);
}

size_t FileGuard::write(const char* buf, size_t size) {
    if (!fp_) throw std::runtime_error("write on null file: " + path_);
    size_t n = std::fwrite(buf, 1, size, fp_);
    if (n != size && std::ferror(fp_)) {
        throw std::runtime_error(std::string("fwrite failed: ") + std::strerror(errno));
    }
    return n;
}

void FileGuard::rewind() {
    if (!fp_) throw std::runtime_error("rewind on null file");
    std::rewind(fp_);
}

bool FileGuard::eof() const {
    if (!fp_) return true;
    return std::feof(fp_) != 0;
}

} // namespace mycore
