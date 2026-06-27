---
read_when:
    - Ви керуєте спареними вузлами (камери, екран, полотно)
    - Вам потрібно схвалювати запити або викликати команди node
summary: Довідник CLI для `openclaw nodes` (статус, сполучення, виклик, камера/полотно/екран)
title: Вузли
x-i18n:
    generated_at: "2026-06-27T17:21:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Керуйте спареними вузлами (пристроями) та викликайте можливості вузлів.

Пов’язано:

- Огляд вузлів: [Вузли](/uk/nodes)
- Камера: [Вузли камери](/uk/nodes/camera)
- Зображення: [Вузли зображень](/uk/nodes/images)

Спільні параметри:

- `--url`, `--token`, `--timeout`, `--json`

## Спільні команди

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

`nodes list` виводить таблиці очікуваних/спарених вузлів. Рядки спарених вузлів містять вік найостаннішого підключення (Останнє підключення).
Використовуйте `--connected`, щоб показувати лише підключені зараз вузли. Використовуйте `--last-connected <duration>`, щоб
відфільтрувати вузли, які підключалися протягом певної тривалості (наприклад, `24h`, `7d`).
Використовуйте `nodes remove --node <id|name|ip>`, щоб видалити спарення вузла. Для вузла,
підкріпленого пристроєм, це відкликає роль `node` пристрою у `devices/paired.json`
і відключає його сеанси з роллю вузла (пристрій зі змішаними ролями зберігає свій рядок і
лише втрачає роль `node`; пристрій лише з роллю вузла видаляється); також очищається будь-який
відповідний застарілий запис спарення вузла, що належить Gateway. `operator.pairing` може видаляти
рядки вузлів, що не є операторами; викликач із токеном пристрою, який відкликає власну роль вузла на
пристрої зі змішаними ролями, додатково потребує `operator.admin`.

Примітка щодо схвалення:

- `openclaw nodes pending` потребує лише області спарення.
- `gateway.nodes.pairing.autoApproveCidrs` може пропустити крок очікування лише для
  явно довіреного першого спарення пристрою з `role: node`. За замовчуванням це вимкнено
  і не схвалює оновлення ролей.
- `openclaw nodes approve <requestId>` успадковує додаткові вимоги до області від
  очікуваного запиту:
  - запит без команди: лише спарення
  - вузлові команди без exec: спарення + запис
  - `system.run` / `system.run.prepare` / `system.which`: спарення + адміністрування

## Виклик

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Прапорці виклику:

- `--params <json>`: рядок JSON-об’єкта (за замовчуванням `{}`).
- `--invoke-timeout <ms>`: час очікування виклику вузла (за замовчуванням `15000`).
- `--idempotency-key <key>`: необов’язковий ключ ідемпотентності.
- `system.run` і `system.run.prepare` тут заблоковані; для виконання shell використовуйте інструмент `exec` з `host=node`.

Для виконання shell на вузлі використовуйте інструмент `exec` з `host=node` замість `openclaw nodes run`.
CLI `nodes` тепер зосереджений на можливостях: прямий RPC через `nodes invoke`, а також спарення, камера,
екран, місцезнаходження, Canvas і сповіщення. Команди Canvas реалізовані bundled експериментальним Canvas Plugin; ядро зберігає хук сумісності, щоб вони залишалися в `openclaw nodes canvas`.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Вузли](/uk/nodes)
