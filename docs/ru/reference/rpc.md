---
read_when:
    - Добавление или изменение интеграций с внешними CLI
    - Отладка RPC-адаптеров (signal-cli, imsg)
summary: RPC-адаптеры для внешних CLI (signal-cli, imsg) и шаблоны Gateway
title: Адаптеры RPC
x-i18n:
    generated_at: "2026-07-13T18:35:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw интегрирует внешние CLI через JSON-RPC. В настоящее время используются два шаблона.

## Шаблон A: HTTP-демон (signal-cli)

- `signal-cli` работает как демон с JSON-RPC поверх HTTP.
- Поток событий использует SSE (`/api/v1/events`).
- Проверка работоспособности: `/api/v1/check`.
- OpenClaw управляет жизненным циклом, когда `channels.signal.autoStart=true`.

Инструкции по настройке и конечные точки см. в разделе [Signal](/ru/channels/signal).

## Шаблон B: дочерний процесс со stdio (imsg)

- OpenClaw запускает `imsg rpc` как дочерний процесс для [iMessage](/ru/channels/imessage).
- Обмен JSON-RPC через stdin/stdout выполняется построчно (один объект JSON на строку).
- TCP-порт и демон не требуются.

Используемые основные методы:

- `watch.subscribe` → уведомления (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (проверка/диагностика)

Инструкции по настройке и адресации см. в разделе [iMessage](/ru/channels/imessage) (предпочтительно использовать `chat_id`, а не отображаемые строки).

## Рекомендации по адаптерам

- Gateway управляет процессом (запуск и остановка привязаны к жизненному циклу провайдера).
- Обеспечьте устойчивость клиентов RPC: используйте тайм-ауты и перезапуск при завершении процесса.
- Отдавайте предпочтение стабильным идентификаторам (например, `chat_id`), а не отображаемым строкам.

## Связанные материалы

- [Протокол Gateway](/ru/gateway/protocol)
