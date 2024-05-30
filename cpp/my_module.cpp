#include <napi.h>
#include <iostream>

Napi::String HelloWorld(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    //std::cout << "Env: " << env << std::endl;
    return Napi::String::New(env, "Hello, world!");
}

// Новая функция Greet
Napi::Array Greet(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Проверка наличия аргументов и их типа
   // std::cout << "Info: " << info[0].As<Napi::String>().Utf8Value() << std::endl;
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return Napi::Array::New(env, 0);
    }

    Napi::Array array = Napi::Array::New(env, info.Length());

    for (int i = 0; i < info.Length(); i++) {
        if ( info[i].IsString() ) {
            array[i] = info[i].ToString();
        } else {
            array[i] = "";
        }
    }

    //const auto name = info[0].As<Napi::Array>();
    //const std::string greetStr = "Hello, " + name.Utf8Value() + "!";

    return array;
}


Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "hello"), Napi::Function::New(env, HelloWorld));
    exports.Set(Napi::String::New(env, "greet"), Napi::Function::New(env, Greet));
    return exports;
}

NODE_API_MODULE(my_module, Init)
