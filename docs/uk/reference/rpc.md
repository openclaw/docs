---
read_when:
    - Додавання або зміна інтеграцій зовнішніх CLI
    - Налагодження RPC-адаптерів (signal-cli, imsg)
summary: RPC-адаптери для зовнішніх CLI (signal-cli, legacy imsg) і шаблони gateway
title: RPC-адаптери
x-i18n:
    generated_at: "2026-04-23T21:09:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a415f5ea7283de361dfe677518c79107e6c16700e821e345a8a10c30d1ffeb
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw інтегрує зовнішні CLI через JSON-RPC. Наразі використовуються два шаблони.

## Шаблон A: HTTP daemon (signal-cli)

- `signal-cli` працює як daemon із JSON-RPC поверх HTTP.
- Потік подій — SSE (`/api/v1/events`).
- Health probe: `/api/v1/check`.
- OpenClaw володіє життєвим циклом, коли `channels.signal.autoStart=true`.

Налаштування й endpoint див. у [Signal](/uk/channels/signal).

## Шаблон B: дочірній процес stdio (legacy: imsg)

> **Примітка:** Для нових налаштувань iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles).

- OpenClaw запускає `imsg rpc` як дочірній процес (legacy-інтеграція iMessage).
- JSON-RPC надсилається як розділені рядками повідомлення через stdin/stdout (один JSON-об’єкт на рядок).
- Немає TCP-порту, daemon не потрібен.

Використовувані core-методи:

- `watch.subscribe` → сповіщення (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/діагностика)

Налаштування legacy і адресацію (`chat_id` бажано) див. у [iMessage](/uk/channels/imessage).

## Рекомендації для адаптерів

- Gateway володіє процесом (start/stop прив’язані до життєвого циклу провайдера).
- Робіть RPC-клієнти стійкими: тайм-аути, перезапуск після завершення процесу.
- Надавайте перевагу стабільним ID (наприклад, `chat_id`), а не рядкам відображення.
