---
read_when:
    - Пояснення того, як працюють Streaming і chunking у каналах
    - Зміна поведінки block streaming або channel chunking
    - Налагодження дубльованих/передчасних block-відповідей або channel preview streaming
summary: Поведінка Streaming + chunking (block-відповіді, channel preview streaming, зіставлення режимів)
title: Streaming і chunking
x-i18n:
    generated_at: "2026-04-23T20:51:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

OpenClaw має два окремі рівні Streaming:

- **Block streaming (канали):** надсилати завершені **блоки**, коли assistant їх пише. Це звичайні channel messages (а не token deltas).
- **Preview streaming (Telegram/Discord/Slack):** оновлювати тимчасове **повідомлення попереднього перегляду** під час генерування.

Справжнього потокового передавання token delta до channel messages наразі **немає**. Preview streaming працює на рівні повідомлень (надсилання + редагування/додавання).

## Block streaming (channel messages)

Block streaming надсилає вивід assistant великими фрагментами в міру його появи.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Умовні позначення:

- `text_delta/events`: події потоку моделі (можуть бути рідкісними для моделей без Streaming).
- `chunker`: `EmbeddedBlockChunker`, який застосовує нижні/верхні межі + параметр бажаного розриву.
- `channel send`: фактичні вихідні повідомлення (block replies).

**Керування:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (типово вимкнено).
- Перевизначення каналів: `*.blockStreaming` (і варіанти для окремих облікових записів), щоб примусово встановити `"on"`/`"off"` для кожного каналу.
- `agents.defaults.blockStreamingBreak`: `"text_end"` або `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (об’єднання потокових блоків перед надсиланням).
- Жорстка межа каналу: `*.textChunkLimit` (наприклад, `channels.whatsapp.textChunkLimit`).
- Режим chunking каналу: `*.chunkMode` (`length` типово, `newline` розбиває за порожніми рядками (межами абзаців) перед chunking за довжиною).
- М’яка межа Discord: `channels.discord.maxLinesPerMessage` (типово 17) розбиває високі відповіді, щоб уникнути обрізання в UI.

**Семантика меж:**

- `text_end`: передавати блоки потоком одразу, щойно їх надсилає chunker; очищати на кожному `text_end`.
- `message_end`: чекати, доки повідомлення assistant завершиться, а потім очищати буферизований вивід.

`message_end` усе одно використовує chunker, якщо буферизований текст перевищує `maxChars`, тож наприкінці може надсилати кілька chunk.

## Алгоритм chunking (нижня/верхня межі)

Block chunking реалізовано в `EmbeddedBlockChunker`:

- **Нижня межа:** не надсилати, доки буфер не досягне `minChars` (якщо не примусово).
- **Верхня межа:** бажано розбивати до `maxChars`; якщо примусово — розбивати на `maxChars`.
- **Перевага розриву:** `paragraph` → `newline` → `sentence` → `whitespace` → жорсткий розрив.
- **Code fences:** ніколи не розбивати всередині fences; якщо примусовий розрив відбувається на `maxChars`, fence закривається й відкривається знову, щоб Markdown залишався валідним.

`maxChars` обмежується значенням channel `textChunkLimit`, тому ви не можете перевищити межі конкретного каналу.

## Coalescing (об’єднання потокових блоків)

Коли block streaming увімкнено, OpenClaw може **об’єднувати послідовні block chunk**
перед надсиланням. Це зменшує «спам однорядковими повідомленнями», водночас зберігаючи
поступовий вивід.

- Coalescing очікує на **паузи бездіяльності** (`idleMs`) перед очищенням.
- Буфери обмежуються `maxChars` і очищаються, якщо перевищують його.
- `minChars` не дозволяє надсилати крихітні фрагменти, доки не накопичиться достатньо тексту
  (фінальне очищення завжди надсилає залишок тексту).
- З’єднувач виводиться з `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → пробіл).
- Перевизначення каналу доступні через `*.blockStreamingCoalesce` (включно з конфігураціями окремих облікових записів).
- Типове значення coalesce `minChars` підвищується до 1500 для Signal/Slack/Discord, якщо не перевизначено.

## Людиноподібний темп між блоками

Коли block streaming увімкнено, ви можете додати **випадкову паузу** між
block replies (після першого блоку). Це робить відповіді в кількох бульбашках
природнішими.

- Конфігурація: `agents.defaults.humanDelay` (перевизначення для агента через `agents.list[].humanDelay`).
- Режими: `off` (типово), `natural` (800–2500 мс), `custom` (`minMs`/`maxMs`).
- Застосовується лише до **block replies**, а не до фінальних відповідей чи зведень інструментів.

## «Передавати chunk потоком чи все одразу»

Це зіставляється так:

- **Передавати chunk потоком:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (надсилати в процесі). Для каналів, відмінних від Telegram, також потрібно `*.blockStreaming: true`.
- **Передавати все в кінці:** `blockStreamingBreak: "message_end"` (очистити один раз, можливо кількома chunk, якщо відповідь дуже довга).
- **Без block streaming:** `blockStreamingDefault: "off"` (лише фінальна відповідь).

**Примітка щодо каналів:** Block streaming **вимкнено, якщо**
`*.blockStreaming` не встановлено явно в `true`. Канали можуть передавати live preview
(`channels.<channel>.streaming`) без block replies.

Нагадування про розташування конфігурації: типові значення `blockStreaming*` розміщені в
`agents.defaults`, а не в кореневій конфігурації.

## Режими Preview streaming

Канонічний ключ: `channels.<channel>.streaming`

Режими:

- `off`: вимкнути preview streaming.
- `partial`: один preview, який замінюється найновішим текстом.
- `block`: preview оновлюється кроками chunked/appended.
- `progress`: preview прогресу/статусу під час генерування, фінальна відповідь після завершення.

### Зіставлення каналів

| Channel    | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | ✅    | ✅        | ✅      | зіставляється з `partial` |
| Discord    | ✅    | ✅        | ✅      | зіставляється з `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                  |
| Mattermost | ✅    | ✅        | ✅      | ✅                  |

Лише для Slack:

- `channels.slack.streaming.nativeTransport` перемикає виклики нативного API Streaming Slack, коли `channels.slack.streaming.mode="partial"` (типово: `true`).
- Нативне streaming Slack і статус потоку assistant у Slack потребують цільової гілки відповіді; DM верхнього рівня не показують такий preview у стилі гілки.

Міграція застарілих ключів:

- Telegram: `streamMode` + boolean `streaming` автоматично мігрують до enum `streaming`.
- Discord: `streamMode` + boolean `streaming` автоматично мігрують до enum `streaming`.
- Slack: `streamMode` автоматично мігрує до `streaming.mode`; boolean `streaming` автоматично мігрує до `streaming.mode` плюс `streaming.nativeTransport`; застарілий `nativeStreaming` автоматично мігрує до `streaming.nativeTransport`.

### Поведінка runtime

Telegram:

- Використовує `sendMessage` + `editMessageText` для оновлення preview у DM та групах/темах.
- Preview streaming пропускається, якщо block streaming Telegram явно ввімкнено (щоб уникнути подвійного Streaming).
- `/reasoning stream` може записувати reasoning у preview.

Discord:

- Використовує надсилання + редагування preview messages.
- Режим `block` використовує chunking чернетки (`draftChunk`).
- Preview streaming пропускається, якщо block streaming Discord явно ввімкнено.
- Фінальні payload медіа, помилок і explicit-reply скасовують очікувальні preview без очищення нової чернетки, а потім використовують звичайну доставку.

Slack:

- `partial` може використовувати нативне Streaming Slack (`chat.startStream`/`append`/`stop`), коли воно доступне.
- `block` використовує preview чернетки у стилі append.
- `progress` використовує текст preview статусу, а потім фінальну відповідь.
- Фінальні payload медіа/помилок і фінали progress не створюють тимчасових чернеткових повідомлень; лише текстові/block-фінали, які можуть редагувати preview, очищають очікувальний текст чернетки.

Mattermost:

- Передає міркування, активність інструментів і частковий текст відповіді в один чернетковий пост preview, який фіналізується на місці, коли фінальну відповідь можна безпечно надсилати.
- Повертається до надсилання нового фінального поста, якщо пост preview було видалено або він інакше недоступний на момент фіналізації.
- Фінальні payload медіа/помилок скасовують очікувальні оновлення preview перед звичайною доставкою замість очищення тимчасового поста preview.

Matrix:

- Чернеткові preview фіналізуються на місці, коли фінальний текст може повторно використати подію preview.
- Фінали лише з медіа, помилок і фінали з невідповідністю цілі reply скасовують очікувальні оновлення preview перед звичайною доставкою; уже видимий застарілий preview редагується.

### Оновлення preview про прогрес інструментів

Preview streaming також може включати **оновлення прогресу інструментів** — короткі рядки стану, наприклад «пошук у вебі», «читання файла» або «виклик інструмента», які з’являються в тому самому preview message під час роботи інструментів, до фінальної відповіді. Це робить багатоетапні ходи з інструментами візуально «живими», а не мовчазними між першим preview міркування та фінальною відповіддю.

Підтримувані поверхні:

- **Discord**, **Slack** і **Telegram** передають прогрес інструментів у live-редагування preview.
- **Mattermost** уже включає активність інструментів у свій єдиний чернетковий пост preview (див. вище).
- Редагування прогресу інструментів слідують активному режиму preview streaming; вони пропускаються, коли preview streaming має значення `off` або коли block streaming уже перехопив повідомлення.

## Пов’язане

- [Messages](/uk/concepts/messages) — життєвий цикл і доставка повідомлень
- [Retry](/uk/concepts/retry) — поведінка повторних спроб у разі помилки доставки
- [Channels](/uk/channels) — підтримка Streaming у різних каналах
