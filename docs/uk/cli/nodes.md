---
read_when:
    - Ви керуєте спареними вузлами (камери, екран, полотно)
    - Потрібно схвалювати запити або виконувати команди node
summary: Довідник CLI для `openclaw nodes` (статус, сполучення, виклик, камера/полотно/екран)
title: Nodes
x-i18n:
    generated_at: "2026-05-06T16:00:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3eb0d23037c939e4022115a2d65e0e9cb25a872daed715b8652979ce6707cf7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Керуйте спареними вузлами (пристроями) і викликайте можливості вузлів.

Пов’язане:

- Огляд вузлів: [Вузли](/uk/nodes)
- Камера: [Вузли камери](/uk/nodes/camera)
- Зображення: [Вузли зображень](/uk/nodes/images)

Поширені параметри:

- `--url`, `--token`, `--timeout`, `--json`

## Поширені команди

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` виводить таблиці очікуваних/спарених вузлів. Рядки спарених вузлів містять найновіший час з моменту підключення (Останнє підключення).
Використовуйте `--connected`, щоб показувати лише вузли, підключені зараз. Використовуйте `--last-connected <duration>`, щоб
фільтрувати вузли, які підключалися протягом певної тривалості (наприклад, `24h`, `7d`).
Використовуйте `nodes remove --node <id|name|ip>`, щоб видалити застарілий запис спарення вузла, яким володіє Gateway.

Примітка щодо схвалення:

- `openclaw nodes pending` потребує лише області спарення.
- `gateway.nodes.pairing.autoApproveCidrs` може пропустити крок очікування лише для
  явно довіреного первинного спарення пристрою `role: node`. Типово це вимкнено
  і не схвалює оновлення.
- `openclaw nodes approve <requestId>` успадковує додаткові вимоги до області від
  запиту, що очікує:
  - запит без команди: лише спарення
  - команди вузла без exec: спарення + запис
  - `system.run` / `system.run.prepare` / `system.which`: спарення + admin

## Виклик

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Прапорці виклику:

- `--params <json>`: рядок об’єкта JSON (типово `{}`).
- `--invoke-timeout <ms>`: час очікування виклику вузла (типово `15000`).
- `--idempotency-key <key>`: необов’язковий ключ ідемпотентності.
- `system.run` і `system.run.prepare` тут заблоковані; використовуйте інструмент `exec` з `host=node` для виконання shell.

Для виконання shell на вузлі використовуйте інструмент `exec` з `host=node` замість `openclaw nodes run`.
CLI `nodes` тепер зосереджений на можливостях: прямий RPC через `nodes invoke`, а також спарення, камера,
екран, місцезнаходження, canvas і сповіщення.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Вузли](/uk/nodes)
