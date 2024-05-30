// hello.cpp
#include <emscripten/bind.h>
#include <vector>

    int add(int a, int b) {
        return a + b;
    }
    // Функция для суммирования элементов вектора
    int sumVector(const std::vector<int>& vec) {
        int sum = 0;
        for (int num : vec) {
            sum += num;
        }
        return sum;
    }
