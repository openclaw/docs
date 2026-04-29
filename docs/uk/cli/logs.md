---
read_when:
    - Потрібно віддалено переглядати журнали Gateway у реальному часі (без SSH)
    - Вам потрібні рядки журналу у форматі JSON для інструментів
summary: Довідник CLI для `openclaw logs` (потокове відстеження журналів Gateway через RPC)
title: Журнали
x-i18n:
    generated_at: "2026-04-29T07:14:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Виводить у реальному часі файлові журнали Gateway через RPC (працює у віддаленому режимі).

Пов’язане:

- Огляд журналювання: [Журналювання](/uk/logging)
- CLI Gateway: [gateway](/uk/cli/gateway)

## Параметри

- `--limit <n>`: максимальна кількість рядків журналу для повернення (типово `200`)
- `--max-bytes <n>`: максимальна кількість байтів для читання з файлу журналу (типово `250000`)
- `--follow`: стежити за потоком журналу
- `--interval <ms>`: інтервал опитування під час стеження (типово `1000`)
- `--json`: виводити події JSON, розділені рядками
- `--plain`: вивід звичайним текстом без стилізованого форматування
- `--no-color`: вимкнути кольори ANSI
- `--local-time`: відображати мітки часу у вашому локальному часовому поясі

## Спільні параметри RPC Gateway

`openclaw logs` також приймає стандартні прапорці клієнта Gateway:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: токен Gateway
- `--timeout <ms>`: час очікування в мс (типово `30000`)
- `--expect-final`: чекати на фінальну відповідь, коли виклик Gateway підтримується агентом

Коли ви передаєте `--url`, CLI не застосовує конфігурацію або облікові дані середовища автоматично. Додайте `--token` явно, якщо цільовий Gateway потребує автентифікації.

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

- Використовуйте `--local-time`, щоб відображати мітки часу у вашому локальному часовому поясі.
- Якщо неявний local loopback Gateway запитує сполучення, закривається під час підключення або перевищує час очікування до відповіді `logs.tail`, `openclaw logs` автоматично переходить до налаштованого файлового журналу Gateway. Явні цілі `--url` не використовують цей резервний варіант.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Журналювання Gateway](/uk/gateway/logging)
