#include <vector>
#include <cstdint>
#include <iostream>

int main(){
  std::vector<std::uint64_t> v(10'000'000, 1);
  std::uint64_t sum=0;
  for(auto x: v) sum += x;
  std::cout << sum << "\n";
  return 0;
}