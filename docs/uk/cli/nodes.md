---
read_when:
    - Ви керуєте сполученими Node (camera, screen, canvas)
    - Вам потрібно схвалити запити або викликати команди Node
summary: Довідник CLI для `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Node
x-i18n:
    generated_at: "2026-04-27T12:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Керуйте сполученими Node (пристроями) та викликайте можливості Node.

Пов’язано:

- Огляд Node: [Nodes](/uk/nodes)
- Камера: [Camera nodes](/uk/nodes/camera)
- Зображення: [Image nodes](/uk/nodes/images)

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

`nodes list` виводить таблиці незавершених і сполучених записів. Рядки сполучених записів містять вік останнього підключення (Last Connect).
Використовуйте `--connected`, щоб показувати лише Node, які зараз підключені. Використовуйте `--last-connected <duration>`, щоб
відфільтрувати Node, які підключалися протягом заданого проміжку часу (наприклад, `24h`, `7d`).
Використовуйте `nodes remove --node <id|name|ip>`, щоб видалити застарілий запис сполучення Node, яким володіє Gateway.

Примітка щодо схвалення:

- `openclaw nodes pending` потребує лише область дії pairing.
- `gateway.nodes.pairing.autoApproveCidrs` може пропустити крок очікування лише для
  явно довіреного початкового сполучення пристрою `role: node`. Цю можливість вимкнено за
  замовчуванням, і вона не схвалює розширення доступу.
- `openclaw nodes approve <requestId>` успадковує додаткові вимоги до областей дії з
  незавершеного запиту:
  - запит без команди: лише pairing
  - команди Node без exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Виклик

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Прапорці виклику:

- `--params <json>`: рядок JSON-об’єкта (типово `{}`).
- `--invoke-timeout <ms>`: тайм-аут виклику Node (типово `15000`).
- `--idempotency-key <key>`: необов’язковий ключ ідемпотентності.
- `system.run` і `system.run.prepare` тут заблоковані; для виконання shell-команд використовуйте інструмент `exec` з `host=node`.

Для виконання shell-команд на Node використовуйте інструмент `exec` з `host=node` замість `openclaw nodes run`.
CLI `nodes` тепер зосереджений на можливостях: прямий RPC через `nodes invoke`, а також pairing, camera,
screen, location, canvas і notifications.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Nodes](/uk/nodes)
