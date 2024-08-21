import {ModuleNative} from "../../types";
import {allocateString} from "../../misc/allocateString";

interface People {
    age: number,
    name: string
}

/**
 * Функция-пример для получения самого старого сотрудника
 * @param module
 */
export function getTheOldestPersonExample(module: ModuleNative): void {
    const getTheOldestPerson = module._getTheOldestPerson;

    // Создать массив объектов
    const people: People[] = [
        {name: 'Alice', age: 30},
        {name: 'Bob', age: 45},
        {name: 'Charlie', age: 35},
        {name: 'Shakira', age: 20}
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
    module._free(namePtr);


    console.log('Самый старый человек: ', theOldestPerson);
}
