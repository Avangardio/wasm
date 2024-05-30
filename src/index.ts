// index.ts
import { readFileSync } from 'fs';
import { join } from 'node:path';

async function loadWasm(fileName: string) {
    const filePath = join(__dirname, '..', 'build', fileName);
    console.log(filePath)
    const buffer = readFileSync(filePath);
    const wasmModule = await WebAssembly.compile(buffer);
    const instance = await WebAssembly.instantiate(wasmModule, {env: {
            memory: new WebAssembly.Memory({ initial: 1 }),
            abort: () => console.log('Abort!')
        }});
    return instance;
}

(async () => {
    const wasmInstance = await loadWasm('example.wasm');
    const { add, sumVector } = wasmInstance.exports as any;
    console.log(`2 + 3 = ${add(2, 3)}`);
   // const result = sumVector([1, 2, 3, 4, 5]); // ожидаемый результат 15
   // console.log(result)

})();
