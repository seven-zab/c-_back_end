#pragma once
#include <iostream>

inline int g_failures = 0;

#define EXPECT_TRUE(cond) do { \
    if (!(cond)) { \
        std::cerr << "EXPECT_TRUE failed: " #cond " at " << __FILE__ << ":" << __LINE__ << "\n"; \
        ++g_failures; \
    } \
} while (0)

#define EXPECT_EQ(a, b) do { \
    auto _a = (a); auto _b = (b); \
    if (!((_a) == (_b))) { \
        std::cerr << "EXPECT_EQ failed: " #a " != " #b " at " << __FILE__ << ":" << __LINE__ \
                  << " values: " << _a << " vs " << _b << "\n"; \
        ++g_failures; \
    } \
} while (0)
