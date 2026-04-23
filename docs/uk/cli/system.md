---
read_when:
    - Ви хочете поставити системну подію в чергу без створення завдання Cron
    - Вам потрібно ввімкнути або вимкнути Heartbeat
    - Ви хочете переглянути записи системної присутності
summary: Довідник CLI для `openclaw system` (системні події, Heartbeat, присутність)
title: система
x-i18n:
    generated_at: "2026-04-23T06:19:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7d19afde9d9cde8a79b0bb8cec6e5673466f4cb9b575fb40111fc32f4eee5d7
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Допоміжні засоби рівня системи для Gateway: постановка системних подій у чергу, керування Heartbeat
і перегляд присутності.

Усі підкоманди `system` використовують Gateway RPC і приймають спільні прапорці клієнта:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Поширені команди

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Поставити системну подію в чергу в **main**-сесії. Наступний Heartbeat вставить
її як рядок `System:` у prompt. Використовуйте `--mode now`, щоб негайно запустити Heartbeat;
`next-heartbeat` чекає наступного запланованого тіку.

Прапорці:

- `--text <text>`: обов’язковий текст системної події.
- `--mode <mode>`: `now` або `next-heartbeat` (типово).
- `--json`: машиночитаний вивід.
- `--url`, `--token`, `--timeout`, `--expect-final`: спільні прапорці Gateway RPC.

## `system heartbeat last|enable|disable`

Керування Heartbeat:

- `last`: показати останню подію Heartbeat.
- `enable`: знову ввімкнути Heartbeat (використовуйте це, якщо його було вимкнено).
- `disable`: призупинити Heartbeat.

Прапорці:

- `--json`: машиночитаний вивід.
- `--url`, `--token`, `--timeout`, `--expect-final`: спільні прапорці Gateway RPC.

## `system presence`

Показати список поточних записів системної присутності, про які знає Gateway (nodes,
instances та подібні рядки стану).

Прапорці:

- `--json`: машиночитаний вивід.
- `--url`, `--token`, `--timeout`, `--expect-final`: спільні прапорці Gateway RPC.

## Примітки

- Потребує запущеного Gateway, доступного через вашу поточну конфігурацію (локальну або віддалену).
- Системні події є ефемерними й не зберігаються між перезапусками.
