---
read_when:
    - Ви керуєте спареними вузлами (камери, екран, полотно)
    - Потрібно схвалювати запити або викликати команди Node
summary: Довідник CLI для `openclaw nodes` (статус, сполучення, виклик, камера/полотно/екран)
title: Вузли
x-i18n:
    generated_at: "2026-05-07T13:14:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Керуйте спареними вузлами (пристроями) та викликайте можливості вузлів.

Пов’язане:

- Огляд вузлів: [Вузли](/uk/nodes)
- Камера: [Вузли камер](/uk/nodes/camera)
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

`nodes list` виводить таблиці очікуваних/спарених вузлів. Рядки спарених вузлів містять вік останнього підключення (Last Connect).
Використовуйте `--connected`, щоб показувати лише вузли, підключені зараз. Використовуйте `--last-connected <duration>`, щоб
відфільтрувати вузли, які підключалися протягом певної тривалості (наприклад, `24h`, `7d`).
Використовуйте `nodes remove --node <id|name|ip>`, щоб видалити застарілий запис спарення вузла, яким володіє Gateway.

Примітка щодо схвалення:

- `openclaw nodes pending` потребує лише області спарення.
- `gateway.nodes.pairing.autoApproveCidrs` може пропустити крок очікування лише для
  явно довіреного першого спарення пристрою `role: node`. За замовчуванням це вимкнено
  й не схвалює оновлення.
- `openclaw nodes approve <requestId>` успадковує додаткові вимоги до області від
  очікуваного запиту:
  - запит без команди: лише спарення
  - команди вузла без виконання: спарення + запис
  - `system.run` / `system.run.prepare` / `system.which`: спарення + адміністратор

## Виклик

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Прапорці виклику:

- `--params <json>`: рядок JSON-об’єкта (за замовчуванням `{}`).
- `--invoke-timeout <ms>`: час очікування виклику вузла (за замовчуванням `15000`).
- `--idempotency-key <key>`: необов’язковий ключ ідемпотентності.
- `system.run` і `system.run.prepare` тут заблоковані; для виконання команд оболонки використовуйте інструмент `exec` із `host=node`.

Для виконання команд оболонки на вузлі використовуйте інструмент `exec` із `host=node` замість `openclaw nodes run`.
CLI `nodes` тепер зосереджений на можливостях: прямий RPC через `nodes invoke`, а також спарення, камера,
екран, місцезнаходження, Canvas і сповіщення. Команди Canvas реалізовані вбудованим експериментальним Plugin Canvas; ядро зберігає гачок сумісності, тому вони залишаються в `openclaw nodes canvas`.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Вузли](/uk/nodes)
