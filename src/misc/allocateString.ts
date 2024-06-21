import {ModuleNative} from "../types";

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
