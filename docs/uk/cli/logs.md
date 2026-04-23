---
read_when:
    - Вам потрібно віддалено переглядати кінець журналів Gateway (без SSH)
    - Ви хочете рядки журналу у форматі JSON для інструментів
summary: Довідка CLI для `openclaw logs` (перегляд кінця журналів Gateway через RPC)
title: журнали
x-i18n:
    generated_at: "2026-04-23T06:18:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238a52e31a9a332cab513ced049e92d032b03c50376895ce57dffa2ee7d1e4b4
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Перегляд кінця файлових журналів Gateway через RPC (працює у віддаленому режимі).

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
- `--no-color`: вимкнути ANSI-кольори
- `--local-time`: відображати часові мітки у вашому локальному часовому поясі

## Спільні параметри RPC Gateway

`openclaw logs` також приймає стандартні прапорці клієнта Gateway:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: токен Gateway
- `--timeout <ms>`: тайм-аут у мс (типово `30000`)
- `--expect-final`: чекати фінальної відповіді, коли виклик Gateway підтримується агентом

Коли ви передаєте `--url`, CLI не застосовує автоматично облікові дані з конфігурації або середовища. Явно вкажіть `--token`, якщо цільовий Gateway вимагає автентифікації.

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
- Якщо локальний Gateway local loopback запитує pairing, `openclaw logs` автоматично переключається на налаштований локальний файл журналу. Явно задані цілі через `--url` не використовують це резервне переключення.
