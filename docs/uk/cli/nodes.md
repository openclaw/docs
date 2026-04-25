---
read_when:
    - Ви керуєте сполученими вузлами (камерами, screen, canvas)
    - Вам потрібно підтвердити запити або викликати команди вузла
summary: Довідка CLI для `openclaw nodes` (`status`, `pairing`, `invoke`, `camera/canvas/screen`)
title: Вузли
x-i18n:
    generated_at: "2026-04-25T05:55:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Керуйте сполученими вузлами (пристроями) та викликайте можливості вузлів.

Пов’язане:

- Огляд вузлів: [Nodes](/uk/nodes)
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
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` виводить таблиці очікуваних і сполучених вузлів. Рядки сполучених вузлів містять вік найновішого підключення (Last Connect).
Використовуйте `--connected`, щоб показувати лише вузли, підключені зараз. Використовуйте `--last-connected <duration>`, щоб
відфільтрувати вузли, які підключалися в межах заданої тривалості (наприклад, `24h`, `7d`).

Примітка щодо підтвердження:

- `openclaw nodes pending` потребує лише scope pairing.
- `gateway.nodes.pairing.autoApproveCidrs` може пропустити крок очікування лише для
  явно довіреного, першого сполучення пристрою `role: node`. За замовчуванням
  вимкнено та не підтверджує оновлення.
- `openclaw nodes approve <requestId>` успадковує додаткові вимоги до scope з
  очікуваного запиту:
  - запит без команд: лише pairing
  - команди вузла без exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Виклик

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Прапорці invoke:

- `--params <json>`: рядок JSON-об’єкта (типово `{}`).
- `--invoke-timeout <ms>`: тайм-аут виклику вузла (типово `15000`).
- `--idempotency-key <key>`: необов’язковий ключ ідемпотентності.
- `system.run` і `system.run.prepare` тут заблоковані; для виконання команд оболонки використовуйте інструмент `exec` з `host=node`.

Для виконання команд оболонки на вузлі використовуйте інструмент `exec` з `host=node` замість `openclaw nodes run`.
CLI `nodes` тепер зосереджений на можливостях: прямий RPC через `nodes invoke`, а також pairing, camera,
screen, location, canvas і notifications.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Nodes](/uk/nodes)
