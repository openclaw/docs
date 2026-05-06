---
read_when:
    - Реалізація панелі полотна для macOS
    - Додавання елементів керування агентом для візуального робочого простору
    - Налагодження завантажень canvas у WKWebView
summary: Керована агентом панель Canvas, вбудована через WKWebView + користувацьку URL-схему
title: Полотно
x-i18n:
    generated_at: "2026-05-06T05:21:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8e53f5d1c2e5b3b46e77cb74632e56123f3312dfcc395aa5ac8182c8d58b6cf
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Застосунок macOS вбудовує керовану агентом **панель Canvas** за допомогою `WKWebView`. Це
легка візуальна робоча область для HTML/CSS/JS, A2UI та невеликих інтерактивних
поверхонь інтерфейсу.

## Де розміщено Canvas

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

- Безрамкова панель зі змінним розміром, прив’язана біля рядка меню (або курсора миші).
- Запам’ятовує розмір і позицію для кожної сесії.
- Автоматично перезавантажується, коли локальні файли Canvas змінюються.
- Одночасно видима лише одна панель Canvas (сесія перемикається за потреби).

Canvas можна вимкнути в Налаштування → **Дозволити Canvas**. Коли його вимкнено, команди
вузлів canvas повертають `CANVAS_DISABLED`.

## Поверхня API агента

Canvas доступний через **Gateway WebSocket**, тому агент може:

- показувати/приховувати панель
- переходити до шляху або URL
- виконувати JavaScript
- захоплювати зображення знімка

Приклади CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Примітки:

- `canvas.navigate` приймає **локальні шляхи Canvas**, URL `http(s)` і URL `file://`.
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

Зараз Canvas приймає повідомлення сервер→клієнт **A2UI v0.8**:

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

Швидка перевірка:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Запуск виконань агента з Canvas

Canvas може запускати нові виконання агента через глибокі посилання:

- `openclaw://agent?...`

Приклад (у JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Застосунок просить підтвердження, якщо не надано дійсний ключ.

## Примітки щодо безпеки

- Схема Canvas блокує обхід каталогів; файли мають бути розміщені в корені сесії.
- Локальний вміст Canvas використовує власну схему (loopback-сервер не потрібен).
- Зовнішні URL `http(s)` дозволені лише після явного переходу.

## Пов’язане

- [застосунок macOS](/uk/platforms/macos)
- [WebChat](/uk/web/webchat)
