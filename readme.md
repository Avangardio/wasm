<img src="https://img001.prntscr.com/file/img001/YyXiifWfQqyL1P0Tico44Q.png"/>
Статья про WASM с С++
Ссылка на статью: <a href="https://habr.com/ru/articles/837692/">Habr<a/>.
Установка и запуск:
<li>
<a href="https://emscripten.org/docs/getting_started/downloads.html">Ссылка на установку<a/>
</li>
<li> Установить зависимости

```bash
npm install
```
</li>

<li> Выполнить следующие команды

```bash
npm run "build wasm" # Компилируем в WASM-модули
```
```bash
npm run start # Запускаем код
```

</li>
<li>
Если через докер запускать, то просто забилдить image и запустить контейнер.
</li>
