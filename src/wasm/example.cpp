// hello.cpp
#include <emscripten/bind.h>
#include <emscripten/emscripten.h>
#include <vector>
#include <iostream>

#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif

    EXTERN EMSCRIPTEN_KEEPALIVE
    int add(int a, int b) {
        return a + b;
    }
    // Функция для суммирования элементов вектора
    EXTERN EMSCRIPTEN_KEEPALIVE
    int sumVector(int* array, int length) {
            std::vector<int> vec(array, array + length);
            int sum = 0;
            for (int num : vec) {
                sum += num;
            }
            return sum;
        }

    EXTERN EMSCRIPTEN_KEEPALIVE
    int* getVector() {
        std::vector<int> vec = {422, 3, 7, 4, 5};
        return vec.data();
    }
    /*
     int* doubleAges(Person* people, int length) {
            std::vector<int> result(length);
            for (int i = 0; i < length; ++i) {
                result[i] = people[i].age * 2;
            }
            return result.data();
        }
    */

EXTERN struct Person {
        const char* name;
        int age;
    };

    EXTERN EMSCRIPTEN_KEEPALIVE
    int sumAges(Person* persons, int length) {
        int sum = 0;
        for (int i = 0; i < length; ++i) {
            sum += persons[i].age;
        }
        delete[] persons;
        return sum;
    }

// Память выделяется при использовании структуры как в ней указано
EXTERN struct User {
        int id;
        const char* name;
    };

EXTERN EMSCRIPTEN_KEEPALIVE
    User* createPeople(char* names[], int length) {
        std::vector<User> result;
        for (int i = 0; i < length; i++) {
            User newUser;
            newUser.id = i + 1; // Изменил i на уникальный идентификатор
            newUser.name = names[i];
            result.emplace_back(newUser); // Создание и добавление элемента в конец вектора
        }
        return result.data();
    }
