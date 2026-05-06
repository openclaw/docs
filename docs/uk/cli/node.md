---
read_when:
    - Запуск безголового хоста Node
    - Сполучення Node не на macOS для system.run
summary: Довідник CLI для `openclaw node` (хост Node без графічного інтерфейсу)
title: Node
x-i18n:
    generated_at: "2026-05-06T16:00:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Запустіть **хост Node без графічного інтерфейсу**, який підключається до WebSocket Gateway і надає
`system.run` / `system.which` на цій машині.

## Навіщо використовувати хост Node?

Використовуйте хост Node, коли потрібно, щоб агенти **виконували команди на інших машинах** у вашій
мережі без встановлення повної супровідної програми macOS на них.

Поширені випадки використання:

- Виконання команд на віддалених Linux/Windows-машинах (сервери збірки, лабораторні машини, NAS).
- Залишати exec **ізольованим у sandbox** на gateway, але делегувати схвалені запуски іншим хостам.
- Надавати легку ціль виконання без графічного інтерфейсу для автоматизації або CI-вузлів.

Виконання все одно захищене **схваленнями exec** і allowlist для кожного агента на
хості Node, тож доступ до команд можна залишати обмеженим і явним.

## Проксі браузера (без налаштування)

Хости Node автоматично оголошують проксі браузера, якщо `browser.enabled` не
вимкнено на Node. Це дає агенту змогу використовувати автоматизацію браузера на цьому Node
без додаткового налаштування.

За замовчуванням проксі відкриває звичайну поверхню профілю браузера Node. Якщо ви
встановите `nodeHost.browserProxy.allowProfiles`, проксі стає обмежувальним:
націлювання на профілі поза allowlist відхиляється, а маршрути створення/видалення
сталих профілів блокуються через проксі.

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

- `--host <host>`: хост WebSocket Gateway (за замовчуванням: `127.0.0.1`)
- `--port <port>`: порт WebSocket Gateway (за замовчуванням: `18789`)
- `--tls`: використовувати TLS для з’єднання з gateway
- `--tls-fingerprint <sha256>`: очікуваний відбиток сертифіката TLS (sha256)
- `--node-id <id>`: перевизначити ідентифікатор Node (очищає токен сполучення)
- `--display-name <name>`: перевизначити відображуване ім’я Node

## Автентифікація Gateway для хоста Node

`openclaw node run` і `openclaw node install` визначають автентифікацію gateway з config/env (без прапорців `--token`/`--password` у командах Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` перевіряються першими.
- Далі локальний резервний варіант config: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост Node навмисно не успадковує `gateway.remote.token` / `gateway.remote.password`.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, визначення автентифікації Node завершується закрито (без маскування віддаленим резервним варіантом).
- У `gateway.mode=remote` поля віддаленого клієнта (`gateway.remote.token` / `gateway.remote.password`) також можуть використовуватися згідно з правилами пріоритету віддаленого режиму.
- Визначення автентифікації хоста Node враховує лише env vars `OPENCLAW_GATEWAY_*`.

Для Node, який підключається до не-loopback Gateway `ws://` у довіреній приватній
мережі, встановіть `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Без цього запуск Node
завершується закрито й просить використати `wss://`, тунель SSH або Tailscale.
Це opt-in через середовище процесу, а не ключ config `openclaw.json`.
`openclaw node install` зберігає його в контрольованій службі Node, коли він
наявний у середовищі команди встановлення.

## Служба (фон)

Встановіть хост Node без графічного інтерфейсу як службу користувача.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Параметри:

- `--host <host>`: хост WebSocket Gateway (за замовчуванням: `127.0.0.1`)
- `--port <port>`: порт WebSocket Gateway (за замовчуванням: `18789`)
- `--tls`: використовувати TLS для з’єднання з gateway
- `--tls-fingerprint <sha256>`: очікуваний відбиток сертифіката TLS (sha256)
- `--node-id <id>`: перевизначити ідентифікатор Node (очищає токен сполучення)
- `--display-name <name>`: перевизначити відображуване ім’я Node
- `--runtime <runtime>`: середовище виконання служби (`node` або `bun`)
- `--force`: перевстановити/перезаписати, якщо вже встановлено

Керування службою:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Використовуйте `openclaw node run` для хоста Node у передньому плані (без служби).

Команди служби приймають `--json` для машиночитаного виводу.

Хост Node повторює спроби після перезапуску Gateway і закриття мережевих з’єднань у межах процесу. Якщо
Gateway повідомляє про термінальну паузу автентифікації через токен/пароль/bootstrap, хост Node
записує деталі закриття в журнал і завершується з ненульовим кодом, щоб launchd/systemd міг перезапустити його зі
свіжими config і обліковими даними. Паузи, що потребують сполучення, залишаються в потоці
переднього плану, щоб очікуваний запит можна було схвалити.

## Сполучення

Перше з’єднання створює на Gateway очікуваний запит сполучення пристрою (`role: node`).
Схваліть його через:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

У суворо контрольованих мережах Node оператор Gateway може явно дозволити
автоматичне схвалення першого сполучення Node з довірених CIDR:

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

За замовчуванням це вимкнено. Це застосовується лише до нового сполучення `role: node`
без запитаних scopes. Клієнти оператора/браузера, Control UI, WebChat, а також оновлення role,
scope, metadata або public-key все одно потребують ручного схвалення.

Якщо Node повторює спробу сполучення зі зміненими даними автентифікації (role/scopes/public key),
попередній очікуваний запит замінюється, і створюється новий `requestId`.
Перед схваленням знову виконайте `openclaw devices list`.

Хост Node зберігає свій ідентифікатор Node, токен, відображуване ім’я та дані з’єднання з gateway у
`~/.openclaw/node.json`.

## Схвалення exec

`system.run` захищено локальними схваленнями exec:

- `~/.openclaw/exec-approvals.json`
- [Схвалення exec](/uk/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (редагування з Gateway)

Для схваленого асинхронного exec на Node OpenClaw готує канонічний `systemRunPlan`
перед запитом. Пізніше схвалене переспрямування `system.run` повторно використовує цей збережений
план, тому зміни полів command/cwd/session після створення запиту на схвалення
відхиляються замість того, щоб змінити те, що виконує Node.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Nodes](/uk/nodes)
