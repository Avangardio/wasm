#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <cstring>
#include <random>
#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>


#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif

extern "C" {
    EXTERN EMSCRIPTEN_KEEPALIVE
   const char* generateUUID() {
           static char uuid[37]; // UUID стандартного формата занимает 36 символов плюс нулевой символ

           // Генераторы случайных чисел
           static std::random_device rd;
           static std::mt19937 gen(rd());
           static std::uniform_int_distribution<> dis(0, 15);
           static std::uniform_int_distribution<> dis2(8, 11);

           // Массив символов для генерации случайных частей UUID
           const char* chars = "0123456789abcdef";

           // Формируем UUID версии 4
           for (int i = 0; i < 36; i++) {
               if (i == 8 || i == 13 || i == 18 || i == 23) {
                   uuid[i] = '-';
               } else if (i == 14) {
                   uuid[i] = '4'; // Версия 4
               } else if (i == 19) {
                   uuid[i] = chars[dis2(gen)]; // Определенные биты должны быть '10'
               } else {
                   uuid[i] = chars[dis(gen)];
               }
           }

           uuid[36] = '\0'; // Завершаем строку нулевым символом

           return uuid;
       }
    // Память выделяется при использовании структуры как в ней указано
    EXTERN struct User {
        std::string id;
        std::string name;
        bool isSuperUser;
    };

    EXTERN EMSCRIPTEN_KEEPALIVE
    emscripten::val createUsers(emscripten::val userArray) {
        std::vector<User> result;
        const int length = userArray["length"].as<int>();
        for (int i = 0; i < length; i++) {
            User newUser;
            const std::string uuid = generateUUID();
            newUser.id = uuid;
            newUser.name = userArray[i]["name"].as<std::string>();
            newUser.isSuperUser = userArray[i]["isSuperUser"].as<bool>();
            result.push_back(newUser); // Создание и добавление элемента в конец вектора
        }
        return emscripten::val::array(result);
    }
}
EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("createUsers", &createUsers);
    emscripten::value_object<User>("User")
        .field("id", &User::id)
        .field("name", &User::name)
        .field("isSuperUser", &User::isSuperUser)
    ;
}
