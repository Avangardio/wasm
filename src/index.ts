import * as path from "node:path";
import {ModuleBinded, ModuleNative} from "./types";
import {addExample} from "./examples/native/add.example";
import {createUsers} from "./examples/binded/createUsers.example";
import {sumArrayExample} from "./examples/native/sumArray.example";
import {getTheOldestPersonExample} from "./examples/native/getTheOldestPerson.example";
import {readFileSync} from "fs";
const WasmModuleNative = require(path.join(__dirname, '..', 'build', 'native.example.js'));
const wasmFileNative = path.join(__dirname, '..', 'build', 'native.example.wasm');

const createNativeModule = async (): Promise<ModuleNative> => {
    const wasmBinary = readFileSync(wasmFileNative);
    return WasmModuleNative({
        wasmBinary
    });
};

const WasmModuleBinded = require(path.join(__dirname, '..', 'build', 'binded.example.js'));
const wasmFileBinded = path.join(__dirname, '..', 'build', 'binded.example.wasm');

const createBindedModule = async (): Promise<ModuleBinded> => {
    const wasmBinary = readFileSync(wasmFileBinded);
    return WasmModuleBinded({
        wasmBinary
    });
};

createNativeModule().then(module => {
    addExample(module); // 7
    sumArrayExample(module); // 21
    getTheOldestPersonExample(module);
})

createBindedModule().then(module => {
    createUsers(module);
})

/**
 * команда
 * emcc src/wasm/native.example.cpp -o build/example.js -s EXPORTED_FUNCTIONS='["_malloc", "_free"]' -s EXPORTED_RUNTIME_METHODS='["lengthBytesUTF8", "stringToUTF8", "setValue", "getValue", "UTF8ToString"]' -s MODULARIZE -s ENVIRONMENT='node' -Oz
 */
