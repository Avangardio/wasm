import * as path from "node:path";

const fs = require('fs');
const Module = require(path.join(__dirname, '..', 'build', 'example.js'));
const wasmFile = path.join(__dirname, '..', 'build', 'example.wasm');

const createModule = async () => {
    const wasmBinary = fs.readFileSync(wasmFile);
    return Module({
        wasmBinary
    });
};

(async () => {
    const module = await createModule();
    const sumVector = module._sumVector;

    // Создание int32 массив с данными
    const vec = new Int32Array([34, 2, 3, 4, 5, 6]);

    // Выделите память в Emscripten HEAP и скопируйте массив
    const arrayPtr = module._malloc(vec.length * vec.BYTES_PER_ELEMENT);
    /**
     * Если тип входит в существующие типы куч, то тогда лучше сделать так
     * в куче 32 битных чисел надо начинать с индекса, а не ссылки, а индекс это ссылка/(32/8)(4 бита)
     */
    // module.HEAP32.set(vec, arrayPtr >> 2);
    /**
     * Либо просто закидываем массивом по элементу значение в памяти
     */
    vec.forEach((item, index) => {
        module.setValue(arrayPtr + index * vec.BYTES_PER_ELEMENT, item);
    })

    const result = sumVector(arrayPtr, vec.length);

    // Освободить выделенную память
    module._free(arrayPtr);

    console.log('Sum:', result);

    // -----
    const sumAges = module._sumAges;

    // Создайте массив объектов
    const people = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
        { name: 'Z', age: 11 }
    ];

    // Функция для выделения и копирования строки в память WebAssembly
    const allocateString = (str: string) => {
        /**
         * Когда мы копируем строку в память WebAssembly с помощью функции module.stringToUTF8, мы должны учитывать, что в конце строки должен быть нулевой символ (нулевой терминатор). Нулевой терминатор является стандартной практикой в строковом представлении в памяти для обозначения конца строки.
         */
        const lengthBytes = (module.lengthBytesUTF8(str) + 1);
        /**
         * Сначала нужно выделить память под строку
         * хороший вопрос, почему, если мы выделили уже под объект
         * //TODO подумать!!! и потестить без маллока (хз мб из-за ссылок у чаров...) не, это указатель на строку ниже будет
         */
        const stringPtr = module._malloc(lengthBytes);
        /**
         *
         * Функция module.stringToUTF8 используется для копирования строки из JavaScript в память WebAssembly в формате UTF-8.
         * Функция stringToUTF8 предназначена для правильного копирования и кодирования JavaScript-строки в память WebAssembly в формате UTF-8.
         */
        module.stringToUTF8(str, stringPtr, lengthBytes);
        return stringPtr;
    };

    // Выделить память для массива объектов и копируйте данные
    const personSize = 8; // Размер структуры Person в байтах (2 поля: name (4 байта) и age (4 байта))
    const arrayPtr1 = module._malloc(people.length * personSize);

    /**
     * You can access memory using getValue(ptr, type) and setValue(ptr, value, type). The first argument is a pointer (a number representing a memory address).
     * type must be an LLVM IR type, one of i8, i16, i32, i64, float, double or a pointer type like i8* (or just *).
     */
    /**
     * Для каждого объекта (в данном случае - для каждого человека) мы копируем значения из JavaScript в память WebAssembly.
     */
    people.forEach((person, index) => {
        const namePtr = allocateString(person.name);
        module.setValue(arrayPtr1 + index * personSize, namePtr, '*'); // Указатель на имя
        module.setValue(arrayPtr1 + index * personSize + 4, person.age, 'i32'); // Значение возраста
    });

    /**
     * // Булево значение в JavaScript
     * var boolValue = true;
     *
     * // Выделение памяти в WebAssembly для одного байта (8 бит)
     * var boolPtr = Module._malloc(1);
     *
     * // Преобразование булевого значения в целочисленный тип (0 или 1)
     * var intValue = boolValue ? 1 : 0;
     *
     * // Установка значения в памяти WebAssembly
     * Module.setValue(boolPtr, intValue, 'i8');
     */


    const result1 = sumAges(arrayPtr1, people.length);

    // Освободить выделенную память
    people.forEach((person, index) => {
        const namePtr = module.getValue(arrayPtr1 + index * personSize, '*');
        module._free(namePtr);
    });
    module._free(arrayPtr1);

    console.log('Sum of ages:', result1);

    //еще поговорить о _ и экспортируемых функциях

    //getvector
    const vector = module._getVector();
    // Копирование результата из памяти WebAssembly в новый массив JavaScript

    //const result2 = module.HEAP32.subarray(vector / 4, vector / 4+ 5); - если значения в массиве были инт32
    const result2 = module.getValue(vector + 4, '*');
    console.log('Get array element:', result2)



    /**
     * // Булево значение в JavaScript
     * var boolValue = true;
     *
     * // Выделение памяти в WebAssembly для одного байта (8 бит)
     * var boolPtr = Module._malloc(1);
     *
     * // Преобразование булевого значения в целочисленный тип (0 или 1)
     * var intValue = boolValue ? 1 : 0;
     *
     * // Установка значения в памяти WebAssembly
     * Module.setValue(boolPtr, intValue, 'i8');
     */
    // createPeople
    // Создайте массив объектов
    const peopleNames = ['Oleg', 'Danila', 'Avangardio'];


    // Выделить память для массива объектов и копируйте данные
    const arrayPtrUsers = module._malloc(4 * peopleNames.length);

    peopleNames.forEach((item, index) => {
        const ptr = allocateString(item);
        module.setValue(arrayPtrUsers + index * 4, ptr, '*'); // Указатель на имя
    })
    peopleNames.forEach((item, index) => {
        const ptr = module.getValue(arrayPtrUsers + index * 4, '*');
        console.log('n ' + ptr)
    });

    const resultUsersPtr = module._createPeople(arrayPtrUsers, peopleNames.length);
    for (let i = resultUsersPtr; i < resultUsersPtr + 30; i += 4) {
        console.log(i, module.getValue(i, 'i32'))
    }
    const result4 = peopleNames.map((item, index) => {
        //вроде как мы в с++ объявляли
        const id = module.getValue(resultUsersPtr + index * 8, 'i32');
        const namePtr = module.getValue(resultUsersPtr + index * 8 + 4, '*');

        const name = module.UTF8ToString(namePtr);
        return { id, name };
    })
    // и под массив параметра имен
    module._free(resultUsersPtr);

    console.log('New users:', result4);
})();

//todo узнать про самоочистку памяти в аргументах!!!
/*
// Не забываем освободить память для каждого имени
        for (int i = 0; i < length; ++i) {
            delete[] people[i].name.c_str();
        }

        // Теперь освобождаем память для самого массива объектов
        delete[] people;
 */
/**
 * команда
 * emcc src/wasm/example.cpp -o build/example.js -s EXPORTED_FUNCTIONS='["_malloc", "_free"]' -s EXPORTED_RUNTIME_METHODS='["lengthBytesUTF8", "stringToUTF8", "setValue", "getValue", "UTF8ToString"]' -s MODULARIZE -s ENVIRONMENT='node' -Oz
 */
