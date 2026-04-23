---
read_when:
    - Ви хочете поставити системну подію в чергу без створення завдання Cron
    - Вам потрібно ввімкнути або вимкнути Heartbeat-и
    - Ви хочете перевірити записи системної presence
summary: Довідник CLI для `openclaw system` (системні події, Heartbeat, presence)
title: Система
x-i18n:
    generated_at: "2026-04-23T20:48:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 890e188c4026ccac426cb71df78b6b4a6b7ac35d654b6b2e33eede502af8bd9c
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Допоміжні системні команди для Gateway: постановка системних подій у чергу, керування Heartbeat-ами
та перегляд presence.

Усі підкоманди `system` використовують Gateway RPC і приймають спільні прапорці клієнта:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Типові команди

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Поставити системну подію в чергу в **main** session. Наступний Heartbeat впровадить
її як рядок `System:` у prompt. Використовуйте `--mode now`, щоб запустити Heartbeat
негайно; `next-heartbeat` чекає на наступний запланований tick.

Прапорці:

- `--text <text>`: обов’язковий текст системної події.
- `--mode <mode>`: `now` або `next-heartbeat` (типово).
- `--json`: машинозчитуваний вивід.
- `--url`, `--token`, `--timeout`, `--expect-final`: спільні прапорці Gateway RPC.

## `system heartbeat last|enable|disable`

Керування Heartbeat:

- `last`: показати останню подію Heartbeat.
- `enable`: знову ввімкнути Heartbeat-и (використовуйте це, якщо їх було вимкнено).
- `disable`: призупинити Heartbeat-и.

Прапорці:

- `--json`: машинозчитуваний вивід.
- `--url`, `--token`, `--timeout`, `--expect-final`: спільні прапорці Gateway RPC.

## `system presence`

Перелічити поточні записи системної presence, відомі Gateway (вузли,
інстанси та подібні рядки стану).

Прапорці:

- `--json`: машинозчитуваний вивід.
- `--url`, `--token`, `--timeout`, `--expect-final`: спільні прапорці Gateway RPC.

## Примітки

- Потрібен запущений Gateway, доступний через вашу поточну конфігурацію (локальну або віддалену).
- Системні події є ефемерними й не зберігаються після перезапусків.
