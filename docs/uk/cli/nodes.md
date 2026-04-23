---
read_when:
    - Ви керуєте сполученими вузлами (cameras, screen, canvas)
    - Вам потрібно схвалити запити або викликати команди вузла
summary: Довідка CLI для `openclaw nodes` (статус, сполучення, виклик, camera/canvas/screen)
title: вузли
x-i18n:
    generated_at: "2026-04-23T06:18:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce3095591c4623ad18e3eca8d8083e5c10266fbf94afea2d025f0ba8093a175
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Керуйте сполученими вузлами (пристроями) і викликайте можливості вузлів.

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
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` виводить таблиці очікуваних запитів і сполучених вузлів. Рядки сполучених вузлів містять час від останнього підключення (Last Connect).
Використовуйте `--connected`, щоб показувати лише вузли, підключені зараз. Використовуйте `--last-connected <duration>`, щоб
відфільтрувати вузли, які підключалися протягом заданого проміжку часу (наприклад, `24h`, `7d`).

Примітка щодо схвалення:

- `openclaw nodes pending` потребує лише області дії сполучення.
- `openclaw nodes approve <requestId>` успадковує додаткові вимоги до областей дії з
  очікуваного запиту:
  - запит без команд: лише сполучення
  - команди вузла без exec: сполучення + запис
  - `system.run` / `system.run.prepare` / `system.which`: сполучення + адміністрування

## Виклик

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Прапорці виклику:

- `--params <json>`: рядок об’єкта JSON (за замовчуванням `{}`).
- `--invoke-timeout <ms>`: тайм-аут виклику вузла (за замовчуванням `15000`).
- `--idempotency-key <key>`: необов’язковий ключ ідемпотентності.
- `system.run` і `system.run.prepare` тут заблоковані; для виконання в оболонці використовуйте інструмент `exec` з `host=node`.

Для виконання команд оболонки на вузлі використовуйте інструмент `exec` з `host=node` замість `openclaw nodes run`.
CLI `nodes` тепер зосереджений на можливостях: прямий RPC через `nodes invoke`, а також сполучення, camera,
screen, location, canvas і сповіщення.
