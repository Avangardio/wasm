Название: тот самый гайд по WASM.

Всем привет, сегодня хочу аоговорить о соединении С/C++ с JavaScript.

# Введение
В этом году я плотно погрузился в изучение WASM, которая является довольно интересной и обусуждемой темой в последние несколько лет. Почти сразу я столкнулся со значительным разрывом в уровнях туториалов (материалы либо очень простые, либо для совсем продвинутого уровня) и скудной документацией. То есть, вхождение новичков может быть затруднено, и поэтому я решил создать гайд, который рассчитан на изучение темы с нуля и до среднего уровня. В этом гайде я постарался заполнить те информационные дыры, с которыми столкнулся сам во время изучения. 
Я собрал все мои знания и хочу передать им вам, чтобы вы могли немного быстрее влиться в данную, не самую простую, тему.

# Что будем делать
<ul>
    <li>Сначала установим Emscripten, чтобы, в дальнейшем, компилировать наш С++ код.</li>
    <li>Импортируем получившийся модуль в TypeScript.</li>
    <li>Узнаем несколько вариантов соединения TypeScript с WASM-функциями.</li>
    <li>Разберем несколько примеров функций и разберем некоторые проблемы.</li>
</ul>

# С чем будем работать
<ul>
    <li>Для компиляции из Си будем использовать <a href="https://ru.wikipedia.org/wiki/Emscripten">Emscripten</a> - компилятор LLVM-байткода в код JavaScript</li>.
    <li>Для вэб-стороны будем использовать TypeScript с Node.JS, можно и в браузере.</li>
    <li>Для написания С++ кода рекомендую установить IDE, я использую CLion, и добавлю в компилятор .h файлы для рабочей типизации.</li>
</ul>

# Установка Emscripten

С установкой дела обстоят довольно просто и гладко, просто следуйте <a href="https://emscripten.org/docs/getting_started/downloads.html">документации</a> от разработчиков.

# Начало интеграции
Для интеграции нашей С++ функции, нам, сооветственно, нужна С++ файл с функцией. (Про бинды мы не еще не знаем!)
Наш первый С++ код будет выглядеть так:
```
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
```
Разберем его подробнее:

```#include <emscripten/bind.h>``` - как импорт библиотек в JavaScript.

```
#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif
```
Взял с сайта мозиллы, довольно удобный блок для экспорта функций.

```EXTERN EMSCRIPTEN_KEEPALIVE``` - Обязательно используем перед каждой функцией кроме main, иначе компилятор подумает, что это - "мертвый" код и не возьмет его в итоговый файл.

```
int add(int a, int b) {
    return a + b;
}
```
Простейшая функция на Си, которая принимает a, b и возращает их сумму в виде целого числа.

Теперь мы должны скомпилировать наш С++ код в WASM и JavaScript обёртку для управления оным:

```
emcc src/wasm/native.example.cpp -o build/native.example.js -s EXPORTED_FUNCTIONS='["_malloc", "_free"]' -s EXPORTED_RUNTIME_METHODS='["lengthBytesUTF8", "stringToUTF8", "setValue", "getValue", "UTF8ToString"]' -s MODULARIZE -s ENVIRONMENT='node' -Oz
```
Про EXPORTED_RUNTIME_METHODS и EXPORTED_FUNCTIONS станет понятнее чуть позже, но пусть будет уже сейчас.

На выходе мы получаем в папке build файлы native.example.js и бинарник native.example.wasm, которые мы будем использовать в нашем JavaScript коде.

Чтобы создать модуль и использовать его, можно использовать следующий код:

```typescript
const WasmModule = require(path.join(__dirname, '..', 'build', 'native.example.js'));
const wasmFile = path.join(__dirname, '..', 'build', 'native.example.wasm');

const createModule = async () => {
    const wasmBinary = readFileSync(wasmFile);
    return WasmModule({
        wasmBinary
    });
};
```
Теперь мы можем получить модуль с функциями из этого WASM-файла и его обёртки.
```typescript
const a = 2;
const b = 5;

const result = module._add(a, b);
//Получаем число 7;
```
Очень важно! Без биндов или дополнительных аргументов коммандной строки, функции из С++ вызываются с "_".

```add() -> _add()``` Что-то типо таких названий функций.

# Переходим к ссылочным структурам

С данного примера, мы будем опускать пройденные детали чтобы уменьшить количество ненужного текста.

Создадим следущую функцию: 

```
EXTERN EMSCRIPTEN_KEEPALIVE
int sumArray(int array[], int length) {
    std::vector<int> vec(array, array + length);
    int sum = 0;
    for (int num : vec) {
        sum += num;
    }
    return sum;
}
```

Функция принимает массив чисел и длинну массива, чтож, компилируем и получаем сумму элементов.
```typescript
const sumArray = module._sumArray;
const result = sumArray([1, 2, 3, 4, 5], 5);
console.log("Сумма массива равна: ", result);
```

Запускаем функцию, получаем ... "Сумма массива равна: 0".

Почему ноль, ведь мы передали массив? 

На данное возмущение ответ прост - мы не можем (можем, но это немного позже) отдавать WASM-функциям что-то сложнее примитивов.

Всё прямо как в JavaScript: примитивы копируются по значениям, объекты - по ссылкам.

Тут и наступает 99% проблем при знакомстве с WASM - передача что-то сложнее интегеров.

Мы должны использовать функции модуля-обёртки в виже "_malloc" для выделения памяти WASM и "_free" - для освобождения оной.
В итоге наш код будет выглядеть следующим образом:

```typescript
const sumArray = module._sumArray;

// Создаем массив i32;
const vec = new Int32Array([1, 2, 3, 4, 5, 6]);
 
// Выделяем под этот массив память в виде длинна массива * количество байт и получаем ссылку на его начало
 const arrayPtr = module._malloc(vec.length * vec.BYTES_PER_ELEMENT);
/**  
 * Если тип входит в существующие типы куч, то тогда лучше сделать так
 * в куче 32 битных чисел надо начинать с индекса, а не ссылки, а индекс это ссылка/(32/8)(4 бита)
 *
 * module.HEAP32.set(vec, arrayPtr >> 2);
 *
 * Либо же каждые 4 байта записываем в память значения 4-х байтного числа
*/
    
vec.forEach((item, index) => {
   // Для каждого нужного адреса копируем значение.
     module.setValue(arrayPtr + index * vec.BYTES_PER_ELEMENT, item, 'i32');
})

const result = sumArray(arrayPtr, vec.length); // Должны получить 21

// Освобождаем выделенную память, если не сделали в С++
module._free(arrayPtr);

console.log('Результат функции sumArray:', result);
```
...Запускаем JavaScript-файл и получаем "Сумма массива равна: 21"!

Получилось! Теперь мы знаем, что при передаче не примитивов, нужно самим передавать значение в WASM-память и передавать ссылку на начало этой структуры, в данном случае, массива.

# Что такое память
Не буду вдаваться в Computer Science, но предоставлю очень быструю справку.

JavaScript - язык с защищенной памятью, то есть, можно сделать что угодно, но до прямых значений памяти мы добраться без руткитов не сможем.
Си и С++ - другое дело, и нам, в силу специфики работы с WASM, нужно предоставлять указатели на структуры.

```...[][][][][][][][][][]...``` - Вот простое графическое представление части памяти в нашей ОЗУ.
Если мы захотим передать массив в фунцию WASM, надо заполнить эту память значениями, допустим: 1, 2, 3, 4, 5.

Допустим, эти числа - Int32 (4 байта), то часть памяти будет выглядеть следующим образом:

```...[1][1][1][1][2][2][2][2][3][3][3][3][4][4][4][4][5][5][5][5]...```

В этом нам как раз и помогает функция модуля - _malloc и setValue: первым мы выделяем память на определенное количество байт, а вторым мы передаем значение по адресу в память WASM, используя определенный LLVM-тип.
```typescript
// Выделяем память на n число байт
const arrayPtr = module._malloc(vec.length * vec.BYTES_PER_ELEMENT);

// Устанавливаем значения в WASM-память
vec.forEach((item, index) => {
    module.setValue(arrayPtr + index * vec.BYTES_PER_ELEMENT, item, 'i32');
})    
```
Именно по этой причине нам и получилось передать массив в С++ - мы сэмулировали прямую работу кода и он понял, что нужно "хватать" интегеры, пока не закончатся.

# Как передавать строки

Передавать строки советую в виде указателей - будет намного меньше проблем и кода.

1) Сначала мы выделяем память под строку и получаем ее указатель.
2) Передаем этот указатель в качестве типа "*" с фиксированным размером в 4 байта, что спасёт нас от дополнительных вычислений.

Выглядеть функция будет примерно так:

```typescript
/**
 * Функция для выделения и копирования строки в память WebAssembly
 * @param str строка
 * @param module модуль wasm
 * @return {number} указатель на начало строки
 */
export function allocateString(str: string, module: ModuleNative): number {
    /**
     * Когда мы копируем строку в память WebAssembly с помощью функции module.stringToUTF8, мы должны учитывать, что в конце строки должен быть нулевой символ (нулевой терминатор). Нулевой терминатор является стандартной практикой в строковом представлении в памяти для обозначения конца строки.
     */
    const lengthBytes = (module.lengthBytesUTF8(str) + 1);
    /**
     * Выделяем память под строку
     */
    const stringPtr = module._malloc(lengthBytes);
    /**
     *
     * Функция module.stringToUTF8 используется для копирования строки из JavaScript в память WebAssembly в формате UTF-8.
     * Функция stringToUTF8 предназначена для правильного копирования и кодирования JavaScript-строки в память WebAssembly в формате UTF-8.
     */
    module.stringToUTF8(str, stringPtr, lengthBytes);
    return stringPtr;
}
```

Сначала мы получаем нужное количество байтов для строки, не забываем обязательно про нулевой терминатор - конец строки, иначе будут строки съезжать влево на 1 элемент!
Затем выделяем нужное количество байт и копируем значение в память WASM, получаем ссылку на строку.

# Как передавать булево значение

Тут всё просто - один байт с нулем или единицей:
```typescript
const boolPtr = module._malloc(1);

module.setValue(boolPtr, 0 или 1, 'i8');
```

# Как быть с объектами и массивами объектов

В нашей ситуации (опять же, про бинды мы не знаем!), нужно самим передавать данные в память и я расскажу, как это сделать.

1) Создадим структуру в С++
```
EXTERN struct Person {
    const char* name;
    int age;
};
```

Самая функция выглядит так:

```

```

Очень важно правильно расставлять поля, потому что при работе с объектами в функциях, память их значений будет указана как при создании струкутуры.
name - сначала идет ссылка на строку в памяти, потом уже age - 4 байта числа, никак иначе!

Мы хотим передать в функцию массив объектов: 
```typescript
[
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 35 },
    { name: 'Shakira', age: 20 }
]
```

Для этого нам нужно сделать следующие шаги:
1) Сначала выделим для каждой строки память и передадим туда её копию с помощью нашей функции allocateString
2) Считаем общее количество нужнных байтов для массива.
По крайней мере у меня, ссылка в WASM`е занимает 4 байта, может быть 8.
4 указателя по 4 байта и 4 инт32 по 4 байта = 32 байт нам нужно на этот массив.
3) Выделяем память и начинаем забивать ее значениями.
На выходе получаем такой JavaScript-код:
```typescript
// Создать массив объектов
const people: People[] = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 45 },
    { name: 'Charlie', age: 35 },
    { name: 'Shakira', age: 20 }
];


// Выделить память для массива объектов и копируйте данные
const personSize = 8; // Размер структуры Person в байтах (2 поля: name (4 байта) и age (4 байта))
const arrayPtr1 = module._malloc(people.length * personSize);

/**
 * Для каждого объекта (в данном случае - для каждой персоны) мы копируем значения из JavaScript в память WebAssembly.
 */
people.forEach((person, index) => {
    const namePtr = allocateString(person.name, module);
    module.setValue(arrayPtr1 + index * personSize, namePtr, '*'); // Указатель на имя
    module.setValue(arrayPtr1 + index * personSize + 4, person.age, 'i32'); // Значение возраста
});
```

Вызываем функцию и получаем указатель на объект, разбираем его: 
```typescript
 const resultPtr = getTheOldestPerson(arrayPtr1, people.length);
// Получаем значения из памяти
const namePtr = module.getValue(resultPtr, '*');
const name = module.UTF8ToString(namePtr);
const age = module.getValue(resultPtr + 4, 'i32');

const theOldestPerson: People = {
    name,
    age
}

// Освободить выделенную память только из результата
module._free(resultPtr);
module._free(namePtr);

console.log('Самый старый человек: ', theOldestPerson);
```

Получаем на выходе: "Самый старый человек: { name: 'Charlie', age: 35 }", отлично.

# Что такое бинды (Emscripten bindings)?
А если я вам скажу, что мы можем убрать всю эту тему с выделением памяти и получения из нее же значений?
Что можно регистрировать вектора и передавать их в функции без проблем?

Давайте разберемся.

# Регистрация векторов и функций
Emscripten предлагает создание статичекских обёрток над С++ кодом, выглядит это так
```
EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("myFunction", &myFunction);
}
```

Теперь мы сможем пользоваться нашей функции без "_", и создадим обёртку функции от Emscripten.
```module.myFunction(...)``` - вот такой вызов у нас будет из JavaScript-кода.

Что же до векторов? - Всё просто, допустим, у нас есть функция, которая принимает вектор:
```... myFunction(std::vector<int> &vec) {...}``` - Мы не сможем даже используя менеджмент памяти передать вектор, так что нужно тоже воспользоваться биндами:
```
EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("myFunction", &myFunction);
    emscripten::register_vector<std::vector<int>>('MyVector');
}
```
Теперь мы можем создать вектор с нашими данными и передать в С++ функцию:
```typescript
const vector = new module.MyVector();
vector.push_back(1);
vector.push_back(2);
vector.push_back(3);

module.MyFunction(vector);
```
Мы передали значение и С++ код его получит и корректно обработает.

А как же нам быть, если наша функция возвращает вектор и мы хотим его корректно получить? 
- Всё еще проще:
```typescript
// Вызываем функцию zet
    const resultVector = module.MyFunction(vector);

    // Преобразуем результат обратно в массив JavaScript
    const outputArray = [];
    for (let i = 0; i < resultVector.size(); i++) {
        outputArray.push(resultVector.get(i));
    }

    // Освобождаем память, если необходимо
    vector.delete();
    resultVector.delete();

    // Вывод результата
    console.log(outputArray);
```
Данная обёртка над векторами очень хорошо работает и проблем с ней не должно возникать.

# Финал. Полностью передаем управление Emscripten bindings

Что делать, если мы вот вообще хотим сделать нашу интеграцию максимально удобно? - Использовать emscripten::val!

Функция для этого примера:
```
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
```

Собираем с флагом --bind и используем в модуле:
```typescript
const users: User[] = [
    {name: 'Oleg', isSuperUser: false},
    {name: 'Rurik', isSuperUser: true},
    {name: 'Alexander', isSuperUser: false}
];

const result = module.createUsers(users);
console.log('Новые пользователи:', result);
```
Запускаем, получаем ошибку от WASM, что нет какого-то 4User.
Смысл в том, что модулю-обёртке нужно помочь указать, что будет передавать в агрументах.
Выглядеть это будет так:
```
EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("createUsers", &createUsers);
    emscripten::value_object<User>("User")
        .field("id", &User::id)
        .field("name", &User::name)
        .field("isSuperUser", &User::isSuperUser)
    ;
}
```
Запускаем... получаем хороший результат:

```typescript
Новые пользователи: [
  {
    id: 'a2aed6b1-253e-4e7d-b9bd-6e85f6c94eaf',
    name: 'Oleg',
    isSuperUser: false
  },
  {
    id: 'a581238c-35ba-4183-bdda-7cb3355bcd1a',
    name: 'Rurik',
    isSuperUser: true
  },
  {
    id: 'fc1c3736-30da-4630-a24d-b33076c6471f',
    name: 'Alexander',
    isSuperUser: false
  }
]
```
И, как вы могли заметить, мы вообще ничего не сделали, чтобы получить адекватный для JavaScript результат, сразу появился приемлиемый массив объектов.
Этот факт, что использование биндов Emscripten делает жизнь разработчика в сотни раз проще, не может не радовать, но, вероятно, придется пожертвовать производительностью при сериализации в val, как и десериализации в JavaScript, но это уже отдельный разговор.

# Доступ к JavaScript из С++
Emscripten так же позволяет получать доступ к глобальным переменным JavaScript внутри С++ через ```emscripten::val::global("переменная");```.

Например, получим доступ к консоли и выведем там массив из нашего последнего примера, если добавим ту функцию следующую строку:
```emscripten::val::global("console").call<void>("log", userArray);```
После запуска функции в JavaScript, у нас в консоли появится:
```typescript
[
  { name: 'Oleg', isSuperUser: false },
  { name: 'Rurik', isSuperUser: true },
  { name: 'Alexander', isSuperUser: false }
]
```
Таким же образом можно получить доступ к document в браузере, что как раз кстати.


# Вывод
Надеюсь, что после нескольких примеров я помог вам понять, как наладить общение между С++ и JavaScript через WASM.
Мы познакомились с выделением, копированием в память элементов и получению данных из памяти.
Узнали про бинды Emscripten, который очень сильно упрощают разработку.

Благодарю всех за внимание, надеюсь, что вам понравилось и работа с WASM будет менее непонятной.
Ставьте лайки и предлагайте темы, о которых вы хотели бы узнать из JavaScript (Больше по бэку, скорее) и задавайте вопросы, если они остались или возникли.
Код для данной статьи вы можете скачать и посмотреть <a href="https://github.com/avangardio/wasm">здесь</a>. 
