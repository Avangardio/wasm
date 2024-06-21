import {User} from "./examples/binded/createUsers.example";

export interface ModuleRoot {
    /**
     * Освобождает ячейку памяти и остальные, привязанные к этой
     * @param ptr
     */
    _free: (ptr: number) => void;
    /**
     * Выделяет в памяти указанное количество ячеек и возвращает указатель на начало
     * @param bytesLength
     */
    _malloc: (bytesLength: number) => number;
    /**
     * Получает значение, исходя из начала ссылки на него и типа
     * Если i32, то при начале в 60000, прочитает все байты от 60000 до 60003
     * @param ptr ссылка на ячейку памяти
     * @param type тип сущности в LLVM
     */
    getValue: (ptr: number, type: string) => number;
    /**
     * Устанавливает в память значение, начмная с указанной ячейки памяти, в запивимости от типа
     * @param ptr ссылка на ячейку памяти
     * @param value значение
     * @param type тип в LLVM
     */
    setValue: (ptr: number, value: unknown, type?: string) => void;
    /**
     * Получает строку и возвращает количество байтов в формате UTF8
     *
     * ! Обязательно нужно к этому числу прибавлять 1 в качестве нулевого терминатора
     * @param str строка
     */
    lengthBytesUTF8: (str: string) => number;

    /**
     * Функция stringToUTF8 используется для копирования строки из JavaScript в память WebAssembly в формате UTF-8.
     * @param str - строка
     * @param ptr - указатель, который мы заранее выделилили
     * @param bytesLength - число байтов этой строки
     */
    stringToUTF8: (str: string, ptr: number, bytesLength: number) => number;
    /**
     * Функция модуля для получения строки из памяти
     * @param strPtr указатель на начало строки
     */
    UTF8ToString: (strPtr: number) => string;
}
export interface ModuleFunctionsFromNativeCpp {
    /**
     * Складывает два числа и возвращает сумму
     * @param a Число 1 типа i32
     * @param b Число 2 типа i32
     * @return {number} - сумма чисел
     */
    _add: (a: number, b: number) => number;

    /**
     * Получает массив и длинну, складывает все элементы и возвращает их сумму
     * @param array - массив i32 (для С++), указатель на этот массив i32 (для WASM)
     * @param len - число длинны массива
     * @returns {number} - сумма элементов массива
     */
    _sumArray: (arrayPtr: number, len: number) => number;
    /**
     * Складывает у всех объектов (структур) из массива .age и возвращает сумму возрастов
     * @param personsPtr - указатель на массив персон
     * @param len - длинна массива персон
     */
    _sumAges: (personsPtr: number, len: number) => number;
    /**
     * Функция создает из имен объекты с id и name, и возращает ссылку на этот массив (вектор в С++)
     * @param usersNamesPtr - указатель на массив имен
     * @param len - длинна массива имен
     */
    _createUsers: (usersNamesPtr: number, len: number ) => number;

    /**
     * Функция для получения самого старого человека из массива
     * @param personsNamesPtr - указатель на массив персон
     * @param len - длинна массива имен
     */
    _getTheOldestPerson: (personsNamesPtr: number, len: number) => number;
}

export type UsersToRegister = {
    name: string;
    superUser?: boolean;
}
export type Users = {
    name: string;
    id: string;
    superUser: boolean;
}

export interface ModuleFunctionsFromBindedCpp {
    createUsers: (usersToRegister: UsersToRegister[]) => Users[];
}

export interface ModuleNative extends ModuleFunctionsFromNativeCpp, ModuleRoot {}
export interface ModuleBinded extends ModuleFunctionsFromBindedCpp, ModuleRoot {}
