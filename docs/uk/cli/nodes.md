---
read_when:
    - Ви керуєте спареними вузлами (камерами, екраном, полотном)
    - Потрібно схвалювати запити або викликати команди Node
summary: Довідник CLI для `openclaw nodes` (стан, сполучення, виклик, камера/полотно/екран/розташування/сповіщення)
title: Вузли
x-i18n:
    generated_at: "2026-07-16T17:39:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Керуйте спареними вузлами (пристроями) та викликайте можливості вузлів.

Пов’язані матеріали: [Огляд вузлів](/uk/nodes) - [Присутність за активним комп’ютером](/nodes/presence) - [Вузли камер](/uk/nodes/camera) - [Вузли зображень](/uk/nodes/images)

Спільні параметри для кожної підкоманди: `--url <url>`, `--token <token>`, `--timeout <ms>` (типове значення — `10000`), `--json`.

## Стан

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

І `status`, і `list` приймають `--connected` (лише підключені вузли) та `--last-connected <duration>` (наприклад, `24h`, `7d`; лише вузли, які підключалися протягом зазначеного проміжку часу). `list` показує вузли, що очікують схвалення, і спарені вузли в окремих таблицях; рядки спарених вузлів містять час від останнього підключення (Last Connect). `status` показує одну об’єднану таблицю з відомостями про можливості, версію та останнє введення для кожного вузла. Підключений вузол macOS повідомляє про останнє введення, лише коли надано дозвіл Accessibility, а найсвіжіший рядок позначено `active`; див. [Присутність за активним комп’ютером](/nodes/presence). `describe` виводить можливості, дозволи, активність і чинні та очікувані команди виклику одного вузла.

## Спарювання

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Ці команди керують сховищем `node.pair.*`, власником якого є Gateway. Воно відокремлене від спарювання пристроїв (`openclaw devices approve`), яке контролює рукостискання `connect` вузла через WS. Про взаємозв’язок цих механізмів див. у розділі [Вузли](/uk/nodes).

- `remove` відкликає запис спареної ролі вузла. Для вузла, що працює через пристрій, ця дія відкликає роль `node` у сховищі спарювання пристроїв і розриває його сеанси з роллю вузла: пристрій зі змішаними ролями зберігає свій рядок і втрачає лише роль `node`, а рядок пристрою лише з роллю вузла видаляється. Також видаляється будь-який відповідний застарілий запис спарювання вузла, власником якого є Gateway.
- `pending` потребує лише області `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` дає змогу пропустити етап очікування для явно довіреного першого спарювання пристрою `role: node`. Типово вимкнено; не схвалює підвищення ролей.
- `gateway.nodes.pairing.sshVerify` (типово ввімкнено) автоматично схвалює перше спарювання пристрою `role: node`, коли Gateway може перевірити ключ пристрою через SSH до хоста вузла; першу поверхню можливостей схвалено на тому самому етапі. Див. [Спарювання вузлів](/uk/gateway/pairing#ssh-verified-device-auto-approval-default).
- Вимоги до області `approve` залежать від команд, оголошених у запиті, що очікує схвалення:
  - запит без команд: `operator.pairing`
  - звичайні команди вузла: `operator.pairing` + `operator.write`
  - команди, чутливі з погляду адміністрування (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` та `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- Область `remove`: `operator.pairing` може видаляти рядки вузлів, що не належать операторам; викликач із токеном пристрою, який відкликає власну роль вузла на пристрої зі змішаними ролями, додатково потребує `operator.admin`.

## Виклик

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Прапорці:

- `--command <command>` (обов’язковий): наприклад, `canvas.eval`.
- `--params <json>`: рядок об’єкта JSON (типове значення — `{}`).
- `--invoke-timeout <ms>`: час очікування виклику вузла (типове значення — `15000`).
- `--idempotency-key <key>`: необов’язковий ключ ідемпотентності.

`system.run` і `system.run.prepare` тут заблоковано; натомість для виконання команд оболонки використовуйте інструмент `exec` з `host=node`. `system.which` дозволено через `invoke`.

## Сповіщення, push-повідомлення, розташування та екран

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` надсилає локальне сповіщення на вузол, який оголошує `system.notify`, зокрема на вузли macOS, iOS, Android і безпосередньо підключені вузли watchOS. Для безпосередньої доставки на watchOS OpenClaw має бути активним. Потребує `--title` або `--body`. Параметри: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (типове значення — `system`), `--invoke-timeout <ms>` (типове значення — `15000`).
- `push` надсилає тестове push-повідомлення APNs на вузол iOS. Параметри: `--title <text>` (типове значення — `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` для перевизначення виявленого середовища APNs.
- `location get` отримує поточне розташування вузла. Параметри: `--max-age <ms>` (повторно використати кешоване визначення), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (типове значення — `10000`), `--invoke-timeout <ms>` (типове значення — `20000`).
- `screen record` записує короткий кліп і виводить шлях до збереженого файлу (або записує JSON за допомогою `--json`). Параметри: `--screen <index>` (типове значення — `0`), `--duration <ms|10s>` (типове значення — `10000`), `--fps <fps>` (типове значення — `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (типове значення — `120000`).

Команди Camera й Canvas мають окрему документацію: [Вузли камер](/uk/nodes/camera), [Canvas](/uk/platforms/mac/canvas). Canvas реалізовано вбудованим експериментальним плагіном Canvas; ядро зберігає `openclaw nodes canvas` як точку монтування для сумісності.

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Вузли](/uk/nodes)
