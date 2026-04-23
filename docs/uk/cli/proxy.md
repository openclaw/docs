---
read_when:
    - Вам потрібно локально захопити транспортний трафік OpenClaw для налагодження
    - Ви хочете перевірити сесії proxy налагодження, blob-об’єкти або вбудовані query presets
summary: Довідник CLI для `openclaw proxy`, локального proxy налагодження та інспектора захоплень
title: Proxy
x-i18n:
    generated_at: "2026-04-23T20:48:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a251232cc35d4e668d1dd052b8ecce8aa21393609dfe77f1173d785045cc90ff
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Запустіть локальний явний proxy налагодження та перевіряйте захоплений трафік.

Це команда налагодження для дослідження на рівні транспорту. Вона може запускати
локальний proxy, виконувати дочірню команду з увімкненим захопленням, перелічувати сесії
захоплення, виконувати query для поширених шаблонів трафіку, читати захоплені blob-об’єкти та очищати локальні дані захоплення.

## Команди

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Query presets

`openclaw proxy query --preset <name>` приймає:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Примітки

- `start` типово використовує `127.0.0.1`, якщо не задано `--host`.
- `run` запускає локальний proxy налагодження, а потім виконує команду після `--`.
- Захоплення є локальними даними налагодження; після завершення використовуйте `openclaw proxy purge`.
