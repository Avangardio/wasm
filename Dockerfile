# Этап 1: Билд
FROM emscripten/emsdk:latest AS build

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Билдим С++ код в WASM
RUN emcc ./src/wasm/native.example.cpp -o ./build/native.example.js -s EXPORTED_FUNCTIONS='["_malloc", "_free"]' -s EXPORTED_RUNTIME_METHODS='["lengthBytesUTF8", "stringToUTF8", "setValue", "getValue", "UTF8ToString"]' -s MODULARIZE -s ENVIRONMENT='node' -O3

RUN emcc ./src/wasm/binded.example.cpp --bind -o ./build/binded.example.js -s EXPORTED_FUNCTIONS='["_malloc", "_free"]' -s EXPORTED_RUNTIME_METHODS='["lengthBytesUTF8", "stringToUTF8", "setValue", "getValue", "UTF8ToString"]' -s MODULARIZE -s ENVIRONMENT='node' -O3

# Компилируем проект
RUN npx tsc

# Этап 2: Продакшн
FROM node:22-alpine AS production

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем файлы из этапа билда
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/build ./build
COPY --from=build /usr/src/app/package*.json ./

# Устанавливаем только нужные зависимости
RUN npm install --only=production

# Запускаем файл ноды
CMD ["node", "dist/index.js"]
