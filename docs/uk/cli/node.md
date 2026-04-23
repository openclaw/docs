---
read_when:
    - Запуск безголового хоста Node
    - Сполучення вузла не на macOS для system.run
summary: Довідник CLI для `openclaw node` (безголовий хост Node)
title: Node
x-i18n:
    generated_at: "2026-04-23T20:47:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb56d24d960eabc085b31fc18429a4d3103b7dbc62f774efbde51749d5f25436
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Запустіть **безголовий хост Node**, який підключається до Gateway WebSocket і надає
`system.run` / `system.which` на цій машині.

## Навіщо використовувати хост Node?

Використовуйте хост Node, коли хочете, щоб агенти **виконували команди на інших машинах** у вашій
мережі без встановлення там повноцінного застосунку-компаньйона macOS.

Поширені випадки використання:

- Виконання команд на віддалених Linux/Windows-машинах (сервери збірки, лабораторні машини, NAS).
- Залишити exec **ізольованим** на gateway, але делегувати схвалені запуски іншим хостам.
- Надати легку, безголову ціль виконання для автоматизації або CI-вузлів.

Виконання все одно захищене через **exec approvals** і allowlist-и для кожного агента на
хості Node, тож ви можете зберігати доступ до команд обмеженим і явним.

## Proxy браузера (нульова конфігурація)

Хости Node автоматично рекламують proxy браузера, якщо `browser.enabled` не
вимкнено на вузлі. Це дає агенту змогу використовувати автоматизацію браузера на цьому вузлі
без додаткової конфігурації.

Типово proxy надає звичайну поверхню профілю браузера вузла. Якщо ви
задасте `nodeHost.browserProxy.allowProfiles`, proxy стане обмежувальним:
націлювання на профілі поза allowlist відхиляється, а маршрути
create/delete для сталих профілів блокуються через proxy.

За потреби вимкніть це на вузлі:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Запуск (на передньому плані)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Параметри:

- `--host <host>`: хост Gateway WebSocket (типово: `127.0.0.1`)
- `--port <port>`: порт Gateway WebSocket (типово: `18789`)
- `--tls`: використовувати TLS для підключення до gateway
- `--tls-fingerprint <sha256>`: очікуваний fingerprint TLS-сертифіката (sha256)
- `--node-id <id>`: перевизначити ідентифікатор вузла (очищує pairing token)
- `--display-name <name>`: перевизначити display name вузла

## Автентифікація Gateway для хоста Node

`openclaw node run` і `openclaw node install` визначають автентифікацію gateway з config/env (без прапорців `--token`/`--password` у командах node):

- Спочатку перевіряються `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Потім використовується локальний запасний варіант із конфігурації: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост Node навмисно не успадковує `gateway.remote.token` / `gateway.remote.password`.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і їх не вдалося визначити, визначення автентифікації node завершується fail-closed (без маскування через remote fallback).
- У `gateway.mode=remote` поля remote client (`gateway.remote.token` / `gateway.remote.password`) також можуть використовуватися згідно з правилами пріоритету remote.
- Визначення автентифікації хоста Node враховує лише env-змінні `OPENCLAW_GATEWAY_*`.

## Сервіс (у фоновому режимі)

Встановіть безголовий хост Node як сервіс користувача.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Параметри:

- `--host <host>`: хост Gateway WebSocket (типово: `127.0.0.1`)
- `--port <port>`: порт Gateway WebSocket (типово: `18789`)
- `--tls`: використовувати TLS для підключення до gateway
- `--tls-fingerprint <sha256>`: очікуваний fingerprint TLS-сертифіката (sha256)
- `--node-id <id>`: перевизначити ідентифікатор вузла (очищує pairing token)
- `--display-name <name>`: перевизначити display name вузла
- `--runtime <runtime>`: runtime сервісу (`node` або `bun`)
- `--force`: перевстановити/перезаписати, якщо вже встановлено

Керування сервісом:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Використовуйте `openclaw node run` для безголового хоста Node на передньому плані (без сервісу).

Команди сервісу приймають `--json` для машинозчитуваного виводу.

## Pairing

Перше підключення створює запит на pairing пристрою в стані pending (`role: node`) на Gateway.
Схваліть його через:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо вузол повторно намагається pair-итися зі зміненими даними автентифікації (role/scopes/public key),
попередній pending-запит замінюється, і створюється новий `requestId`.
Перед схваленням знову виконайте `openclaw devices list`.

Хост Node зберігає свій ідентифікатор вузла, токен, display name і дані підключення до gateway у
`~/.openclaw/node.json`.

## Exec approvals

`system.run` захищено локальними exec approvals:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/uk/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (редагування з Gateway)

Для схваленого асинхронного node exec OpenClaw готує канонічний `systemRunPlan`
перед показом запиту. Пізніше переспрямування схваленого `system.run` повторно використовує цей збережений
план, тож редагування полів command/cwd/session після створення запиту на
схвалення відхиляються замість зміни того, що виконає вузол.
