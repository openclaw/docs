---
read_when:
    - Додавання або змінення інтеграцій із зовнішніми CLI
    - Налагодження RPC-адаптерів (signal-cli, imsg)
summary: RPC-адаптери для зовнішніх CLI (signal-cli, imsg) і шаблони Gateway
title: RPC-адаптери
x-i18n:
    generated_at: "2026-07-12T13:46:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw інтегрує зовнішні CLI через JSON-RPC. Наразі використовуються дві схеми.

## Схема A: HTTP-демон (signal-cli)

- `signal-cli` працює як демон із JSON-RPC через HTTP.
- Потік подій використовує SSE (`/api/v1/events`).
- Перевірка працездатності: `/api/v1/check`.
- OpenClaw керує життєвим циклом, коли `channels.signal.autoStart=true`.

Налаштування та кінцеві точки описано в розділі [Signal](/uk/channels/signal).

## Схема B: дочірній процес stdio (imsg)

- OpenClaw запускає `imsg rpc` як дочірній процес для [iMessage](/uk/channels/imessage).
- JSON-RPC передається рядками через stdin/stdout (один об’єкт JSON у кожному рядку).
- TCP-порт і демон не потрібні.

Основні використовувані методи:

- `watch.subscribe` → сповіщення (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (перевірка/діагностика)

Налаштування й адресацію описано в розділі [iMessage](/uk/channels/imessage) (`chat_id` має перевагу над відображуваними рядками).

## Рекомендації щодо адаптерів

- Gateway керує процесом (запуск і зупинка прив’язані до життєвого циклу провайдера).
- Забезпечуйте стійкість клієнтів RPC: використовуйте тайм-аути та перезапуск після завершення процесу.
- Надавайте перевагу стабільним ідентифікаторам (наприклад, `chat_id`) над відображуваними рядками.

## Пов’язані матеріали

- [Протокол Gateway](/uk/gateway/protocol)
