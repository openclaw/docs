---
read_when:
    - Ви досі використовуєте `openclaw daemon ...` у скриптах
    - Вам потрібні команди життєвого циклу служби (install/start/stop/restart/status)
summary: Довідка CLI для `openclaw daemon` (застарілий псевдонім для керування службою gateway)
title: демон
x-i18n:
    generated_at: "2026-04-23T06:17:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fdaf3c4f3e7dd4dff86f9b74a653dcba2674573698cf51efc4890077994169
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Застарілий псевдонім для команд керування службою Gateway.

`openclaw daemon ...` зіставляється з тією самою поверхнею керування службою, що й команди служби `openclaw gateway ...`.

## Використання

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Підкоманди

- `status`: показати стан встановлення служби та перевірити стан Gateway
- `install`: встановити службу (`launchd`/`systemd`/`schtasks`)
- `uninstall`: видалити службу
- `start`: запустити службу
- `stop`: зупинити службу
- `restart`: перезапустити службу

## Поширені параметри

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- життєвий цикл (`uninstall|start|stop|restart`): `--json`

Примітки:

- `status` за можливості визначає налаштовані auth SecretRef для автентифікації перевірки.
- Якщо обов’язковий auth SecretRef не визначено в цьому шляху команди, `daemon status --json` повідомляє `rpc.authWarning`, коли перевірка підключення/автентифікації завершується невдачею; передайте `--token`/`--password` явно або спочатку визначте джерело секрету.
- Якщо перевірка успішна, попередження про невизначені auth-ref пригнічуються, щоб уникнути хибнопозитивних спрацьовувань.
- `status --deep` додає найкращу можливу системну перевірку служби. Коли вона знаходить інші служби, схожі на gateway, у зрозумілому для людини виводі з’являються підказки щодо очищення та попередження, що одна gateway на машину, як і раніше, є звичайною рекомендацією.
- У встановленнях Linux systemd перевірки розходжень токена в `status` охоплюють обидва джерела unit: `Environment=` і `EnvironmentFile=`.
- Перевірки розходжень визначають SecretRef для `gateway.auth.token` за допомогою об’єднаного середовища виконання (спочатку середовище команди служби, потім резервне середовище процесу).
- Якщо автентифікація токеном фактично не активна (явно задано `gateway.auth.mode` як `password`/`none`/`trusted-proxy`, або режим не задано, де може перемогти пароль і жоден кандидат токена не може перемогти), перевірки розходжень токена пропускають визначення токена з конфігурації.
- Коли автентифікація токеном потребує токен, а `gateway.auth.token` керується через SecretRef, `install` перевіряє, що SecretRef можна визначити, але не зберігає визначений токен у метаданих середовища служби.
- Якщо автентифікація токеном потребує токен, а налаштований SecretRef токена не визначено, встановлення завершується з безпечним блокуванням.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення блокується, доки режим не буде вказано явно.
- Якщо ви навмисно запускаєте кілька gateway на одному хості, ізолюйте порти, config/state та робочі простори; див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

## Рекомендовано

Використовуйте [`openclaw gateway`](/uk/cli/gateway) для актуальної документації та прикладів.
