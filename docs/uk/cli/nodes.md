---
read_when:
    - Ви керуєте спареними Node (камери, екран, canvas)
    - Вам потрібно схвалити запити або викликати команди Node
summary: Довідник CLI для `openclaw nodes` (стан, pairing, invoke, camera/canvas/screen)
title: Node
x-i18n:
    generated_at: "2026-04-23T20:48:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6965add1f4ee553307ae038b015bdb432425e8368487eef870b91650bbfd94ea
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Керуйте спареними Node (пристроями) і викликайте можливості Node.

Пов’язане:

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
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` виводить таблиці очікуваних і спарених Node. Рядки спарених Node містять час від останнього підключення (Last Connect).
Використовуйте `--connected`, щоб показувати лише зараз підключені Node. Використовуйте `--last-connected <duration>`, щоб
відфільтрувати Node, які підключалися протягом заданого проміжку часу (наприклад, `24h`, `7d`).

Примітка щодо схвалення:

- `openclaw nodes pending` потребує лише область pairing.
- `openclaw nodes approve <requestId>` успадковує додаткові вимоги до області доступу від
  запиту, що очікує:
  - запит без команди: лише pairing
  - команди Node без exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Прапорці invoke:

- `--params <json>`: рядок об’єкта JSON (типово `{}`).
- `--invoke-timeout <ms>`: тайм-аут invoke Node (типово `15000`).
- `--idempotency-key <key>`: необов’язковий ключ ідемпотентності.
- `system.run` і `system.run.prepare` тут заблоковані; для виконання оболонки використовуйте інструмент `exec` з `host=node`.

Для виконання оболонки на Node використовуйте інструмент `exec` з `host=node` замість `openclaw nodes run`.
CLI `nodes` тепер зосереджений на можливостях: прямий RPC через `nodes invoke`, а також pairing, camera,
screen, location, canvas і сповіщення.
