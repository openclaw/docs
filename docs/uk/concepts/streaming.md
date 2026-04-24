---
read_when:
    - Пояснення того, як streaming або chunking працює в каналах
    - Зміна поведінки block streaming або channel chunking
    - Налагодження дубльованих/передчасних блокових відповідей або preview streaming каналу
summary: Поведінка streaming + chunking (блокові відповіді, preview streaming каналу, зіставлення режимів)
title: Streaming і chunking
x-i18n:
    generated_at: "2026-04-24T22:37:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 544dba171876870ba2608e43bdd9b7a66f446628e18f1c19e72bf491c1d18f6b
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

OpenClaw має два окремі рівні streaming:

- **Block streaming (канали):** надсилає завершені **блоки**, поки асистент пише. Це звичайні повідомлення каналу (не token deltas).
- **Preview streaming (Telegram/Discord/Slack):** оновлює тимчасове **preview message** під час генерації.

Справжнього streaming через token deltas до повідомлень каналу сьогодні **немає**. Preview streaming є message-based (надсилання + редагування/додавання).

## Block streaming (повідомлення каналу)

Block streaming надсилає вивід асистента великими фрагментами в міру його появи.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Легенда:

- `text_delta/events`: події stream моделі (можуть бути рідкісними для моделей без streaming).
- `chunker`: `EmbeddedBlockChunker`, який застосовує мінімальні/максимальні межі + пріоритет розривів.
- `channel send`: фактичні вихідні повідомлення (block replies).

**Керування:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (типово вимкнено).
- Перевизначення каналу: `*.blockStreaming` (і варіанти для окремих акаунтів), щоб примусово встановити `"on"`/`"off"` для кожного каналу.
- `agents.defaults.blockStreamingBreak`: `"text_end"` або `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (об’єднує streamed blocks перед надсиланням).
- Жорстке обмеження каналу: `*.textChunkLimit` (наприклад, `channels.whatsapp.textChunkLimit`).
- Режим chunking каналу: `*.chunkMode` (`length` типово, `newline` розбиває за порожніми рядками (межі абзаців) перед chunking за довжиною).
- М’яке обмеження Discord: `channels.discord.maxLinesPerMessage` (типово 17) розбиває високі відповіді, щоб уникнути обрізання в UI.

**Семантика меж:**

- `text_end`: stream блоків одразу, щойно chunker їх видає; flush на кожному `text_end`.
- `message_end`: чекати, поки повідомлення асистента завершиться, і лише тоді flush буферизований вивід.

`message_end` усе одно використовує chunker, якщо буферизований текст перевищує `maxChars`, тому наприкінці він може надсилати кілька фрагментів.

## Алгоритм chunking (нижня/верхня межі)

Block chunking реалізовано через `EmbeddedBlockChunker`:

- **Нижня межа:** не надсилати, поки буфер < `minChars` (якщо не примусово).
- **Верхня межа:** віддавати перевагу розривам до `maxChars`; якщо примусово, розбивати на `maxChars`.
- **Пріоритет розривів:** `paragraph` → `newline` → `sentence` → `whitespace` → жорсткий розрив.
- **Code fences:** ніколи не розбивати всередині fences; якщо примусово на `maxChars`, fence закривається й відкривається знову, щоб Markdown залишався коректним.

`maxChars` обмежується значенням `textChunkLimit` каналу, тому перевищити ліміти конкретного каналу не можна.

## Coalescing (об’єднання streamed blocks)

Коли block streaming увімкнено, OpenClaw може **об’єднувати послідовні block chunks**
перед їх надсиланням. Це зменшує “спам із одного рядка”, водночас зберігаючи
поступове виведення.

- Coalescing чекає на **паузи без активності** (`idleMs`) перед flush.
- Буфери обмежені `maxChars` і будуть flush, якщо перевищать його.
- `minChars` не дозволяє надсилати надто малі фрагменти, доки не накопичиться достатньо тексту
  (фінальний flush завжди надсилає весь залишок тексту).
- Joiner визначається з `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → пробіл).
- Перевизначення каналу доступні через `*.blockStreamingCoalesce` (зокрема в конфігураціях для окремих акаунтів).
- Типове значення coalesce `minChars` підвищується до 1500 для Signal/Slack/Discord, якщо не перевизначено.

## Human-like pacing між блоками

Коли block streaming увімкнено, можна додати **рандомізовану паузу** між
block replies (після першого блока). Це робить відповіді з кількома бульбашками
природнішими.

- Конфігурація: `agents.defaults.humanDelay` (можна перевизначити для агента через `agents.list[].humanDelay`).
- Режими: `off` (типово), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Застосовується лише до **block replies**, а не до фінальних відповідей чи підсумків інструментів.

## "Надсилати chunks чи все одразу"

Це зіставляється так:

- **Надсилати chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (надсилати в процесі). Для каналів, окрім Telegram, також потрібно `*.blockStreaming: true`.
- **Надсилати все наприкінці:** `blockStreamingBreak: "message_end"` (flush один раз, можливо кількома chunks, якщо текст дуже довгий).
- **Без block streaming:** `blockStreamingDefault: "off"` (лише фінальна відповідь).

**Примітка щодо каналів:** Block streaming **вимкнений, якщо тільки**
`*.blockStreaming` не встановлено явно в `true`. Канали можуть показувати live preview
(`channels.<channel>.streaming`) без block replies.

Нагадування щодо розташування конфігурації: типові значення `blockStreaming*` розміщені в `agents.defaults`, а не в кореневому конфігу.

## Режими preview streaming

Канонічний ключ: `channels.<channel>.streaming`

Режими:

- `off`: вимкнути preview streaming.
- `partial`: один preview, який замінюється найновішим текстом.
- `block`: preview оновлюється chunked/appended кроками.
- `progress`: preview прогресу/статусу під час генерації, фінальна відповідь після завершення.

### Зіставлення каналів

| Канал      | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | зіставляється з `partial` |
| Discord    | ✅    | ✅        | ✅      | зіставляється з `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Лише для Slack:

- `channels.slack.streaming.nativeTransport` вмикає нативні виклики Slack streaming API, коли `channels.slack.streaming.mode="partial"` (типово: `true`).
- Нативний streaming Slack і статус у thread асистента Slack потребують цілі reply thread; у верхньорівневих DM такий preview у стилі thread не показується.

Міграція legacy keys:

- Telegram: `streamMode` і булеве `streaming` автоматично мігрують у enum `streaming`.
- Discord: `streamMode` і булеве `streaming` автоматично мігрують у enum `streaming`.
- Slack: `streamMode` автоматично мігрує в `streaming.mode`; булеве `streaming` автоматично мігрує в `streaming.mode` плюс `streaming.nativeTransport`; legacy `nativeStreaming` автоматично мігрує в `streaming.nativeTransport`.

### Поведінка під час виконання

Telegram:

- Використовує оновлення preview через `sendMessage` + `editMessageText` у DM, групах і темах.
- Preview streaming пропускається, якщо block streaming Telegram явно увімкнено (щоб уникнути подвійного streaming).
- `/reasoning stream` може записувати reasoning у preview.

Discord:

- Використовує preview messages через send + edit.
- Режим `block` використовує chunking чернетки (`draftChunk`).
- Preview streaming пропускається, якщо block streaming Discord явно увімкнено.
- Фінальні payload-и media, error і explicit-reply скасовують очікувані previews без flush нового draft, а потім використовують звичайну доставку.

Slack:

- `partial` може використовувати нативний streaming Slack (`chat.startStream`/`append`/`stop`), коли доступно.
- `block` використовує preview чернетки у стилі append.
- `progress` використовує preview тексту статусу, а потім фінальну відповідь.
- Нативний і draft preview streaming пригнічують block replies для цього turn, тому відповідь Slack надсилається лише одним шляхом доставки.
- Фінальні payload-и media/error і фінали progress не створюють тимчасових draft messages; лише text/block фінали, які можуть редагувати preview, виконують flush очікуваного draft text.

Mattermost:

- Streaming thinking, активності інструментів і часткового тексту відповіді відбувається в одному draft preview post, який фіналізується на місці, коли фінальну відповідь безпечно надсилати.
- Якщо preview post було видалено або він інакше недоступний на момент фіналізації, використовується резервний варіант із надсиланням нового фінального post.
- Фінальні payload-и media/error скасовують очікувані оновлення preview перед звичайною доставкою замість flush тимчасового preview post.

Matrix:

- Draft previews фіналізуються на місці, коли фінальний текст може повторно використати preview event.
- Фінали лише з media, error і невідповідністю цілі reply скасовують очікувані оновлення preview перед звичайною доставкою; уже видимий застарілий preview редагується.

### Оновлення preview прогресу інструментів

Preview streaming також може включати оновлення **tool-progress** — короткі рядки стану, як-от "searching the web", "reading file" або "calling tool", — які з’являються в тому самому preview message під час роботи інструментів, ще до фінальної відповіді. Це дозволяє візуально підтримувати активність багатоетапних turn із використанням інструментів, а не залишати їх безшумними між першим preview thinking і фінальною відповіддю.

Підтримувані поверхні:

- **Discord**, **Slack** і **Telegram** передають tool-progress у live preview edit.
- **Mattermost** уже вбудовує активність інструментів у свій єдиний draft preview post (див. вище).
- Редагування tool-progress слідують активному режиму preview streaming; вони пропускаються, коли preview streaming має значення `off` або коли контроль над повідомленням уже перейшов до block streaming.

## Пов’язане

- [Messages](/uk/concepts/messages) — життєвий цикл повідомлень і доставка
- [Retry](/uk/concepts/retry) — поведінка повторних спроб у разі збою доставки
- [Channels](/uk/channels) — підтримка streaming для окремих каналів
