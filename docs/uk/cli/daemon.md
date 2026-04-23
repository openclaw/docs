---
read_when:
    - Ви досі використовуєте `openclaw daemon ...` у скриптах
    - Вам потрібні команди життєвого циклу сервісу (install/start/stop/restart/status)
summary: Довідник CLI для `openclaw daemon` (застарілий псевдонім для керування сервісом gateway)
title: Демон
x-i18n:
    generated_at: "2026-04-23T20:46:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35e8cd8ccd03c9bb37595c5b559a81665d584ef5be4aa91277bf0250561a53b8
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Застарілий псевдонім для команд керування сервісом Gateway.

`openclaw daemon ...` зіставляється з тією самою поверхнею керування сервісом, що й команди сервісу `openclaw gateway ...`.

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

- `status`: показати стан встановлення сервісу та перевірити стан Gateway
- `install`: установити сервіс (`launchd`/`systemd`/`schtasks`)
- `uninstall`: видалити сервіс
- `start`: запустити сервіс
- `stop`: зупинити сервіс
- `restart`: перезапустити сервіс

## Поширені параметри

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- життєвий цикл (`uninstall|start|stop|restart`): `--json`

Примітки:

- `status` за можливості розв’язує налаштовані SecretRef автентифікації для probe-автентифікації.
- Якщо потрібний SecretRef автентифікації не розв’язується в цьому шляху команди, `daemon status --json` повідомляє `rpc.authWarning`, коли перевірка підключення/автентифікації RPC завершується помилкою; явно передайте `--token`/`--password` або спочатку розв’яжіть джерело секрету.
- Якщо probe проходить успішно, попередження про нерозв’язаний auth-ref приглушуються, щоб уникнути хибнопозитивних спрацювань.
- `status --deep` додає best-effort сканування сервісів на рівні системи. Якщо воно знаходить інші сервіси, схожі на gateway, у виводі для людини друкуються підказки щодо очищення та попередження, що одна gateway на машину все ще є звичайною рекомендацією.
- В установленнях Linux systemd перевірки дрейфу токена в `status` включають обидва джерела unit: `Environment=` і `EnvironmentFile=`.
- Перевірки дрейфу розв’язують SecretRef у `gateway.auth.token` за допомогою об’єднаного середовища виконання (спочатку середовище команди сервісу, потім резервне середовище процесу).
- Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або mode не задано там, де може перемогти password і не може перемогти жоден кандидат токена), перевірки дрейфу токена пропускають розв’язання токена конфігурації.
- Коли автентифікація токеном вимагає токен, а `gateway.auth.token` керується через SecretRef, `install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища сервісу.
- Якщо автентифікація токеном вимагає токен, а налаштований SecretRef токена не розв’язується, встановлення завершується в fail-closed режимі.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення блокується, доки mode не буде явно вказано.
- Якщо ви навмисно запускаєте кілька Gateway на одному хості, ізолюйте порти, config/state і workspace; див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

## Рекомендовано

Використовуйте [`openclaw gateway`](/uk/cli/gateway) для актуальної документації та прикладів.
