import { readFileSync } from 'fs';
import { join } from 'node:path';

async function loadWasm(fileName: string) {
    const filePath = join(__dirname, '..', 'build', fileName);
    console.log(filePath)
    const buffer = readFileSync(filePath);
    const wasmModule = await WebAssembly.compile(buffer);
    const instance = await WebAssembly.instantiate(wasmModule);
    return instance;
}

(async () => {
    const wasmInstance = await loadWasm('example.wasm');
    const { add } = wasmInstance.exports as { add: (a: number, b: number) => number };
    console.log(`2 + 3 = ${add(2, 3)}`);
})();
