---
read_when:
    - Добавление или изменение внешних интеграций CLI
    - Отладка RPC-адаптеров (signal-cli, imsg)
summary: RPC-адаптеры для внешних CLI (signal-cli, imsg) и шаблонов Gateway
title: RPC-адаптеры
x-i18n:
    generated_at: "2026-06-28T23:44:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw интегрирует внешние CLI через JSON-RPC. Сегодня используются два шаблона.

## Шаблон A: HTTP-демон (signal-cli)

- `signal-cli` запускается как демон с JSON-RPC поверх HTTP.
- Поток событий — SSE (`/api/v1/events`).
- Проверка работоспособности: `/api/v1/check`.
- OpenClaw управляет жизненным циклом, когда `channels.signal.autoStart=true`.

См. [Signal](/ru/channels/signal) для настройки и эндпоинтов.

## Шаблон B: дочерний процесс stdio (imsg)

- OpenClaw запускает `imsg rpc` как дочерний процесс для [iMessage](/ru/channels/imessage).
- JSON-RPC передается построчно через stdin/stdout (по одному JSON-объекту на строку).
- TCP-порт не нужен, демон не требуется.

Используемые основные методы:

- `watch.subscribe` → уведомления (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (проверка/диагностика)

См. [iMessage](/ru/channels/imessage) для устаревшей настройки и адресации (предпочтительно `chat_id`).

## Рекомендации по адаптерам

- Gateway владеет процессом (запуск/остановка привязаны к жизненному циклу провайдера).
- Делайте RPC-клиенты устойчивыми: тайм-ауты, перезапуск при завершении.
- Предпочитайте стабильные идентификаторы (например, `chat_id`) отображаемым строкам.

## Связанное

- [Протокол Gateway](/ru/gateway/protocol)
