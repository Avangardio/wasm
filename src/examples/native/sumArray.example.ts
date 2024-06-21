import {ModuleNative} from "../../types";

export function sumArrayExample(module: ModuleNative) {
    const sumArray = module._sumArray;

    // Создаем массив i32;
    const vec = new Int32Array([1, 2, 3, 4, 5, 6]);

    // Выделяем под этот массив память в виде длинна массива * количество байт
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
        // Для каждого нужного адреса копмруем значение.
        module.setValue(arrayPtr + index * vec.BYTES_PER_ELEMENT, item, 'i32');
    })

    const result = sumArray(arrayPtr, vec.length); // Должны получить 21

    // Освобождаем выделенную память, если не сделали в С++
    module._free(arrayPtr);

    console.log('Результат функции sumVector:', result);
}
