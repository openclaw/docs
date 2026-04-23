---
read_when:
    - Запуск headless-хоста node
    - Сполучення node не на macOS для system.run
summary: Довідка CLI для `openclaw node` (headless-хост node)
title: node
x-i18n:
    generated_at: "2026-04-23T06:18:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6123b33ec46f2b85f2c815947435ac91bbe84456165ff0e504453356da55b46d
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Запустити **headless-хост node**, який підключається до WebSocket Gateway і надає
`system.run` / `system.which` на цій машині.

## Навіщо використовувати хост node?

Використовуйте хост node, коли хочете, щоб агенти **виконували команди на інших машинах** у вашій мережі без установлення повноцінного допоміжного застосунку macOS на цих машинах.

Поширені сценарії використання:

- Виконання команд на віддалених Linux/Windows-машинах (сервери збірки, лабораторні машини, NAS).
- Залишити exec **ізольованим** на gateway, але делегувати дозволені запуски іншим хостам.
- Надати легку, headless-ціль виконання для автоматизації або CI-вузлів.

Виконання, як і раніше, захищене **погодженнями exec** та списками дозволів для кожного агента на хості node, тож ви можете зберігати доступ до команд обмеженим і явним.

## Проксі браузера (нульова конфігурація)

Хости node автоматично оголошують проксі браузера, якщо `browser.enabled` не вимкнено на node. Це дає змогу агенту використовувати автоматизацію браузера на цій node без додаткового налаштування.

Типово проксі надає звичайну поверхню профілів браузера цієї node. Якщо ви встановите `nodeHost.browserProxy.allowProfiles`, проксі стане обмежувальним:
звернення до профілів, яких немає в allowlist, буде відхилено, а маршрути створення/видалення постійних профілів через проксі буде заблоковано.

За потреби вимкніть його на node:

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

- `--host <host>`: хост WebSocket Gateway (типово: `127.0.0.1`)
- `--port <port>`: порт WebSocket Gateway (типово: `18789`)
- `--tls`: використовувати TLS для з’єднання з gateway
- `--tls-fingerprint <sha256>`: очікуваний відбиток сертифіката TLS (sha256)
- `--node-id <id>`: перевизначити id node (очищає токен pairing)
- `--display-name <name>`: перевизначити відображуване ім’я node

## Автентифікація Gateway для хоста node

`openclaw node run` і `openclaw node install` визначають автентифікацію gateway із config/env (у командах node немає прапорців `--token`/`--password`):

- Спочатку перевіряються `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Потім використовується резервний варіант із локальної конфігурації: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост node навмисно не успадковує `gateway.remote.token` / `gateway.remote.password`.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, визначення автентифікації node завершується за принципом fail closed (без маскування резервним віддаленим варіантом).
- У `gateway.mode=remote` поля віддаленого клієнта (`gateway.remote.token` / `gateway.remote.password`) також можуть використовуватися відповідно до правил пріоритету для віддаленого режиму.
- Визначення автентифікації хоста node враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

## Сервіс (фоновий режим)

Установити headless-хост node як сервіс користувача.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Параметри:

- `--host <host>`: хост WebSocket Gateway (типово: `127.0.0.1`)
- `--port <port>`: порт WebSocket Gateway (типово: `18789`)
- `--tls`: використовувати TLS для з’єднання з gateway
- `--tls-fingerprint <sha256>`: очікуваний відбиток сертифіката TLS (sha256)
- `--node-id <id>`: перевизначити id node (очищає токен pairing)
- `--display-name <name>`: перевизначити відображуване ім’я node
- `--runtime <runtime>`: runtime сервісу (`node` або `bun`)
- `--force`: перевстановити/перезаписати, якщо вже встановлено

Керування сервісом:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Використовуйте `openclaw node run` для хоста node в передньому плані (без сервісу).

Команди сервісу приймають `--json` для машинозчитуваного виводу.

## Pairing

Перше підключення створює запит на pairing пристрою в стані очікування (`role: node`) на Gateway.
Погодьте його через:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо node повторює спробу pairing зі зміненими даними автентифікації (role/scopes/public key),
попередній запит у стані очікування замінюється, і створюється новий `requestId`.
Перед погодженням знову виконайте `openclaw devices list`.

Хост node зберігає id node, токен, відображуване ім’я та інформацію про з’єднання з gateway у
`~/.openclaw/node.json`.

## Погодження exec

`system.run` обмежується локальними погодженнями exec:

- `~/.openclaw/exec-approvals.json`
- [Погодження exec](/uk/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (редагування з Gateway)

Для дозволеного асинхронного exec на node OpenClaw готує канонічний `systemRunPlan` перед запитом погодження. Пізніше переспрямування погодженого `system.run` повторно використовує цей збережений план, тому зміни до полів command/cwd/session після створення запиту на погодження відхиляються замість того, щоб змінювати те, що виконує node.
