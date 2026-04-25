---
read_when:
    - Запуск хоста headless Node
    - Сполучення Node не на macOS для `system.run`
summary: Довідник CLI для `openclaw node` (хоста headless Node)
title: Node
x-i18n:
    generated_at: "2026-04-25T05:55:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Запускає **хост headless Node**, який підключається до Gateway WebSocket і надає
`system.run` / `system.which` на цій машині.

## Навіщо використовувати хост Node?

Використовуйте хост Node, коли ви хочете, щоб агенти **виконували команди на інших машинах** у вашій
мережі без встановлення там повноцінного застосунку-компаньйона для macOS.

Поширені сценарії використання:

- Виконання команд на віддалених Linux/Windows машинах (сервери збірки, лабораторні машини, NAS).
- Зберегти виконання **ізольованим** на Gateway, але делегувати схвалені запуски іншим хостам.
- Надати легку, headless ціль виконання для автоматизації або CI Node.

Виконання, як і раніше, захищене **схваленнями exec** і списками дозволених для кожного агента на
хості Node, тож ви можете зберігати доступ до команд обмеженим і явним.

## Проксі браузера (нульова конфігурація)

Хости Node автоматично оголошують проксі браузера, якщо `browser.enabled` не
вимкнено на Node. Це дозволяє агенту використовувати автоматизацію браузера на цьому Node
без додаткового налаштування.

За замовчуванням проксі відкриває звичайну поверхню профілю браузера Node. Якщо ви
встановите `nodeHost.browserProxy.allowProfiles`, проксі стане обмежувальним:
націлювання на профілі поза списком дозволених буде відхилено, а маршрути
створення/видалення постійних профілів буде заблоковано через проксі.

За потреби вимкніть це на Node:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Запуск (передній план)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Параметри:

- `--host <host>`: хост Gateway WebSocket (типово: `127.0.0.1`)
- `--port <port>`: порт Gateway WebSocket (типово: `18789`)
- `--tls`: використовувати TLS для підключення до Gateway
- `--tls-fingerprint <sha256>`: очікуваний відбиток TLS-сертифіката (sha256)
- `--node-id <id>`: перевизначити ідентифікатор Node (очищає токен сполучення)
- `--display-name <name>`: перевизначити відображувану назву Node

## Автентифікація Gateway для хоста Node

`openclaw node run` і `openclaw node install` визначають автентифікацію Gateway з config/env (без прапорців `--token`/`--password` у командах node):

- Спочатку перевіряються `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Потім використовується локальний запасний варіант із config: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост Node навмисно не успадковує `gateway.remote.token` / `gateway.remote.password`.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, визначення автентифікації Node завершується в закритому стані (без маскування запасним віддаленим варіантом).
- У режимі `gateway.mode=remote` поля віддаленого клієнта (`gateway.remote.token` / `gateway.remote.password`) також можуть використовуватися згідно з правилами пріоритету для remote.
- Визначення автентифікації хоста Node враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

Для Node, який підключається до Gateway не на loopback через `ws://` у довіреній приватній
мережі, встановіть `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Без цього запуск Node
завершується в закритому стані та пропонує використовувати `wss://`, SSH-тунель або Tailscale.
Це явне ввімкнення через середовище процесу, а не ключ config в `openclaw.json`.
`openclaw node install` зберігає це значення у керованій службі Node, якщо воно
присутнє в середовищі команди встановлення.

## Служба (тло)

Установіть хост headless Node як службу користувача.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Параметри:

- `--host <host>`: хост Gateway WebSocket (типово: `127.0.0.1`)
- `--port <port>`: порт Gateway WebSocket (типово: `18789`)
- `--tls`: використовувати TLS для підключення до Gateway
- `--tls-fingerprint <sha256>`: очікуваний відбиток TLS-сертифіката (sha256)
- `--node-id <id>`: перевизначити ідентифікатор Node (очищає токен сполучення)
- `--display-name <name>`: перевизначити відображувану назву Node
- `--runtime <runtime>`: середовище виконання служби (`node` або `bun`)
- `--force`: перевстановити/перезаписати, якщо вже встановлено

Керування службою:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Використовуйте `openclaw node run` для хоста Node на передньому плані (без служби).

Команди служби приймають `--json` для машинозчитуваного виводу.

## Сполучення

Перше підключення створює очікувальний запит на сполучення пристрою (`role: node`) на Gateway.
Схваліть його за допомогою:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

У суворо контрольованих мережах Node оператор Gateway може явно ввімкнути
авто-схвалення першого сполучення Node з довірених CIDR:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Це вимкнено за замовчуванням. Це застосовується лише до нового сполучення `role: node` без
запитаних областей доступу. Клієнти Operator/browser, Control UI, WebChat, а також зміни ролі,
областей доступу, метаданих або публічного ключа, як і раніше, потребують ручного схвалення.

Якщо Node повторює спробу сполучення зі зміненими даними автентифікації (роль/області доступу/публічний ключ),
попередній очікувальний запит замінюється, і створюється новий `requestId`.
Перед схваленням знову виконайте `openclaw devices list`.

Хост Node зберігає свій ідентифікатор Node, токен, відображувану назву та інформацію про підключення до Gateway у
`~/.openclaw/node.json`.

## Схвалення exec

`system.run` захищено локальними схваленнями exec:

- `~/.openclaw/exec-approvals.json`
- [Схвалення exec](/uk/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (редагування з Gateway)

Для схваленого асинхронного виконання exec на Node OpenClaw готує канонічний `systemRunPlan`
перед запитом підтвердження. Подальше переспрямування схваленого `system.run` повторно використовує цей збережений
план, тому редагування полів command/cwd/session після створення запиту на схвалення
відхиляються, а не змінюють те, що виконує Node.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Node](/uk/nodes)
