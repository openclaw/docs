---
read_when:
    - Вам потрібно віддалено переглядати журнали Gateway у режимі tail (без SSH)
    - Вам потрібні рядки журналу у форматі JSON для інструментів
summary: Довідник CLI для `openclaw logs` (перегляд журналів gateway у режимі tail через RPC)
title: Журнали
x-i18n:
    generated_at: "2026-04-23T20:47:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4bc607e70a4edd9d7abf45d82671e1255652b06453e134620e570ba7ad357e
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Переглядати журнали файлів Gateway у режимі tail через RPC (працює у віддаленому режимі).

Пов’язане:

- Огляд журналювання: [Журналювання](/uk/logging)
- CLI Gateway: [gateway](/uk/cli/gateway)

## Параметри

- `--limit <n>`: максимальна кількість рядків журналу для повернення (типово `200`)
- `--max-bytes <n>`: максимальна кількість байтів для читання з файла журналу (типово `250000`)
- `--follow`: стежити за потоком журналу
- `--interval <ms>`: інтервал опитування під час стеження (типово `1000`)
- `--json`: виводити події JSON, розділені рядками
- `--plain`: звичайний текстовий вивід без стилізованого форматування
- `--no-color`: вимкнути кольори ANSI
- `--local-time`: відображати часові мітки у вашому локальному часовому поясі

## Спільні параметри RPC Gateway

`openclaw logs` також приймає стандартні прапорці клієнта Gateway:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: токен Gateway
- `--timeout <ms>`: тайм-аут у мс (типово `30000`)
- `--expect-final`: чекати на фінальну відповідь, коли виклик Gateway підтримується агентом

Коли ви передаєте `--url`, CLI не застосовує автоматично облікові дані з конфігурації або середовища. Явно додайте `--token`, якщо цільовий Gateway вимагає автентифікацію.

## Приклади

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Примітки

- Використовуйте `--local-time`, щоб відображати часові мітки у вашому локальному часовому поясі.
- Якщо Gateway local loopback запитує pairing, `openclaw logs` автоматично переходить до налаштованого локального файла журналу. Явні цілі `--url` не використовують цей запасний варіант.
