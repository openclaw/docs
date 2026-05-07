---
read_when:
    - Додавання або зміна зовнішніх інтеграцій CLI
    - Налагодження RPC-адаптерів (signal-cli, imsg)
summary: RPC-адаптери для зовнішніх CLI (signal-cli, imsg) і патерни Gateway
title: RPC-адаптери
x-i18n:
    generated_at: "2026-05-07T01:53:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw інтегрує зовнішні CLI через JSON-RPC. Сьогодні використовуються два шаблони.

## Шаблон A: HTTP-демон (signal-cli)

- `signal-cli` працює як демон із JSON-RPC через HTTP.
- Потік подій — SSE (`/api/v1/events`).
- Перевірка працездатності: `/api/v1/check`.
- OpenClaw керує життєвим циклом, коли `channels.signal.autoStart=true`.

Див. [Signal](/uk/channels/signal) щодо налаштування та кінцевих точок.

## Шаблон B: дочірній процес stdio (застаріле: imsg)

> **Примітка:** Для нових налаштувань iMessage натомість використовуйте [BlueBubbles](/uk/channels/bluebubbles).

- OpenClaw запускає `imsg rpc` як дочірній процес (застаріла інтеграція iMessage).
- JSON-RPC передається через stdin/stdout із розділенням за рядками (один об’єкт JSON на рядок).
- Не потрібні TCP-порт або демон.

Основні використовувані методи:

- `watch.subscribe` → сповіщення (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (перевірка/діагностика)

Див. [iMessage](/uk/channels/imessage) щодо застарілого налаштування та адресації (переважно `chat_id`).

## Настанови для адаптерів

- Gateway керує процесом (start/stop прив’язані до життєвого циклу провайдера).
- Робіть RPC-клієнти стійкими: тайм-аути, перезапуск після виходу.
- Надавайте перевагу стабільним ідентифікаторам (наприклад, `chat_id`) замість рядків відображення.

## Пов’язане

- [Протокол Gateway](/uk/gateway/protocol)
