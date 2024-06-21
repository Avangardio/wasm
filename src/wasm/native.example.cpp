#include <vector>
#include <iostream>
#include <emscripten/bind.h>

#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif

EXTERN EMSCRIPTEN_KEEPALIVE
int add(int a, int b) {
    return a + b;
}

EXTERN EMSCRIPTEN_KEEPALIVE
int sumArray(int array[], int length) {
    std::vector<int> vec(array, array + length);
    int sum = 0;
    for (int num : vec) {
        sum += num;
    }
    return sum;
}

EXTERN EMSCRIPTEN_KEEPALIVE
int* arrayToDoubledVector(int array[], int length) {
    std::vector<int> newArray(array, array + length);
    for (int item : newArray) {
        item *= 2;
    }
    return newArray.data();
}

EXTERN struct Person {
    const char* name;
    int age;
};

EXTERN EMSCRIPTEN_KEEPALIVE
Person* getTheOldestPerson(Person* persons, int length) {
    int maxAge = 0;
    int index = 0;
    for (int i = 0; i < length; i++) {
        if ( persons[i].age >= maxAge ) {
            maxAge = persons[i].age;
            index = i;
        }
    }
    return &persons[index];
}
