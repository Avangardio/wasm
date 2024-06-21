import {ModuleNative} from "../../types";

export function addExample(module: ModuleNative) {
    const a = 2;
    const b = 5;

    const result = module._add(a, b);

    console.log("Результат функции add:", result); // Должно быть 7.
    console.assert(result === (a + b));
}
