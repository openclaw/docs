---
read_when:
    - Реалізація панелі Canvas у macOS
    - Додавання елементів керування агентом для візуального робочого простору
    - Налагодження завантаження canvas у WKWebView
summary: Панель Canvas під керуванням агента, вбудована за допомогою WKWebView і спеціальної схеми URL
title: Полотно
x-i18n:
    generated_at: "2026-07-16T18:09:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Застосунок macOS вбудовує керовану агентом **панель Canvas** за допомогою `WKWebView` —
легкого візуального робочого простору для HTML/CSS/JS, A2UI та невеликих
інтерактивних інтерфейсів користувача.

## Розташування Canvas

Стан Canvas зберігається в Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Панель Canvas надає доступ до цих файлів через спеціальну схему URL
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Якщо в кореневому каталозі немає `index.html`, застосунок показує вбудовану початкову сторінку.

## Поведінка панелі

- Панель без рамки зі змінним розміром, закріплена біля рядка меню (або курсора миші).
- Запам’ятовує розмір і розташування для кожного сеансу.
- Автоматично перезавантажується в разі зміни локальних файлів Canvas.
- Одночасно відображається лише одна панель Canvas (за потреби застосунок перемикає сеанси).

Canvas можна вимкнути в Settings -> **Allow Canvas**. Коли його вимкнено,
команди вузла Canvas повертають `CANVAS_DISABLED`.

## Поверхня API агента

Canvas доступний через WebSocket Gateway, тому агент може показувати й приховувати
панель, переходити до шляху або URL, виконувати JavaScript і створювати
знімок:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` приймає локальні шляхи Canvas, URL `http(s)` і URL `file://`.
Передавання `"/"` показує локальну початкову сторінку або `index.html`.

Цільові адреси, розміщені на Gateway, у `/__openclaw__/canvas/` і
`/__openclaw__/a2ui/` визначаються через поточний URL Canvas з обмеженою областю дії
сеансу вузла. Застосунок оновлює цю короткочасну можливість перед переходом;
самостійно створювати чи копіювати URL можливості не потрібно.

## A2UI в Canvas

A2UI розміщується на хості Canvas Gateway і відтворюється всередині панелі
Canvas. Коли Gateway повідомляє про хост Canvas, застосунок macOS під час першого відкриття
автоматично переходить на сторінку хоста A2UI.

Оголошений URL має область дії, обмежену можливістю, наприклад
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Вважайте його тимчасовими обліковими даними, а не постійним посиланням.

### Команди A2UI (v0.8)

Canvas приймає повідомлення A2UI v0.8 від сервера до клієнта: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9)
ще не підтримується.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Якщо ви можете це прочитати, надсилання A2UI працює."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Швидка базова перевірка:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Привіт від A2UI"
```

## Запуск виконань агента з Canvas

Canvas може запускати нові виконання агента через глибинні посилання `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Підтримувані параметри запиту:

| Параметр                   | Значення                                              |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | Попередньо заповнений запит агента.                   |
| `sessionKey`               | Стабільний ідентифікатор сеансу.                      |
| `thinking`                 | Необов’язковий профіль міркування.                    |
| `deliver`, `to`, `channel` | Ціль доставки.                                        |
| `timeoutSeconds`           | Необов’язковий час очікування виконання.               |
| `key`                      | Створений застосунком маркер безпеки для довірених локальних викликів. |

Застосунок запитує підтвердження, якщо не надано дійсний ключ. Посилання
без ключа показують повідомлення й URL перед схваленням та ігнорують поля
маршрутизації доставки; посилання з ключем використовують звичайний шлях виконання Gateway.

## Примітки щодо безпеки

- Схема Canvas блокує обхід каталогів; файли мають розташовуватися в кореневому каталозі сеансу.
- Локальний вміст Canvas використовує спеціальну схему (сервер зворотного зв’язку не потрібен).
- Зовнішні URL `http(s)` дозволені лише за явного переходу.
- Звичайні вебсторінки призначені лише для відтворення. Дії агента приймаються лише зі
  схеми Canvas, що належить застосунку, або з точного документа A2UI Gateway
  з областю дії, обмеженою можливістю, який вибрав застосунок; підфрейми,
  переспрямування, застарілі можливості та змінені запити не можуть ініціювати дії.

## Пов’язані матеріали

- [Застосунок macOS](/uk/platforms/macos)
- [WebChat](/uk/web/webchat)
