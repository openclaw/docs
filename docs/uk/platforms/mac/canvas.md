---
read_when:
    - Реалізація панелі Canvas у macOS
    - Додавання елементів керування агентом для візуального робочого простору
    - Налагодження завантажень canvas у WKWebView
summary: Панель Canvas, керована агентом, вбудована через WKWebView + власну схему URL
title: Полотно
x-i18n:
    generated_at: "2026-06-28T00:13:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Застосунок macOS вбудовує керовану агентом **панель Canvas** за допомогою `WKWebView`. Це
легкий візуальний робочий простір для HTML/CSS/JS, A2UI та невеликих інтерактивних
UI-поверхонь.

## Де розташований Canvas

Стан Canvas зберігається в Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Панель Canvas обслуговує ці файли через **власну URL-схему**:

- `openclaw-canvas://<session>/<path>`

Приклади:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Якщо в корені немає `index.html`, застосунок показує **вбудовану сторінку-заготовку**.

## Поведінка панелі

- Панель без рамки, зі змінним розміром, закріплена біля рядка меню (або курсора миші).
- Запам’ятовує розмір/позицію для кожної сесії.
- Автоматично перезавантажується, коли локальні файли canvas змінюються.
- Одночасно видима лише одна панель Canvas (сесія перемикається за потреби).

Canvas можна вимкнути в Settings → **Allow Canvas**. Коли вимкнено, команди вузла canvas
повертають `CANVAS_DISABLED`.

## Поверхня API агента

Canvas доступний через **Gateway WebSocket**, тож агент може:

- показувати/ховати панель
- переходити до шляху або URL
- виконувати JavaScript
- захоплювати знімок зображення

Приклади CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Примітки:

- `canvas.navigate` приймає **локальні шляхи canvas**, URL `http(s)` і URL `file://`.
- Якщо передати `"/"`, Canvas показує локальну заготовку або `index.html`.

## A2UI у Canvas

A2UI розміщується хостом canvas у Gateway і відтворюється всередині панелі Canvas.
Коли Gateway оголошує хост Canvas, застосунок macOS автоматично переходить на
сторінку хоста A2UI під час першого відкриття.

Стандартний URL хоста A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Команди A2UI (v0.8)

Canvas наразі приймає повідомлення server→client **A2UI v0.8**:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) не підтримується.

Приклад CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Швидка smoke-перевірка:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Запуск виконань агента з Canvas

Canvas може запускати нові виконання агента через deep links:

- `openclaw://agent?...`

Приклад (у JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Підтримувані параметри запиту:

- `message`: попередньо заповнений промпт агента.
- `sessionKey`: стабільний ідентифікатор сесії.
- `thinking`: необов’язковий профіль thinking.
- `deliver`, `to` або `channel`: ціль доставки.
- `timeoutSeconds`: необов’язковий тайм-аут виконання.
- `key`: згенерований застосунком safety token для довірених локальних викликів.

Застосунок просить підтвердження, якщо не надано дійсний ключ. Посилання без ключа
показують повідомлення й URL перед схваленням та ігнорують поля маршрутизації доставки;
посилання з ключем використовують звичайний шлях виконання Gateway.

## Примітки щодо безпеки

- Схема Canvas блокує обхід каталогів; файли мають бути в корені сесії.
- Локальний вміст Canvas використовує власну схему (сервер local loopback не потрібен).
- Зовнішні URL `http(s)` дозволені лише за явного переходу.

## Пов’язане

- [застосунок macOS](/uk/platforms/macos)
- [WebChat](/uk/web/webchat)
