---
read_when:
    - Ви все ще використовуєте `openclaw daemon ...` у скриптах
    - Вам потрібні команди життєвого циклу служби (install/start/stop/restart/status)
summary: Довідник CLI для `openclaw daemon` (застарілий псевдонім для керування службою Gateway)
title: Демон
x-i18n:
    generated_at: "2026-04-28T11:07:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Застарілий псевдонім для команд керування службою Gateway.

`openclaw daemon ...` відповідає тій самій поверхні керування службою, що й службові команди `openclaw gateway ...`.

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

- `status`: показати стан встановлення служби та перевірити справність Gateway
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

- `status` за можливості визначає налаштовані SecretRefs автентифікації для автентифікації перевірки.
- Якщо потрібний SecretRef автентифікації не визначено в цьому шляху команди, `daemon status --json` повідомляє `rpc.authWarning`, коли підключення або автентифікація перевірки не вдається; передайте `--token`/`--password` явно або спершу визначте джерело секрету.
- Якщо перевірка успішна, попередження про невизначені посилання автентифікації приховуються, щоб уникнути хибних спрацьовувань.
- `status --deep` додає приблизне сканування служби на системному рівні. Коли воно знаходить інші служби, схожі на gateway, вивід для людини друкує підказки з очищення та попереджає, що один gateway на машину все ще є звичайною рекомендацією.
- У встановленнях Linux systemd перевірки розбіжності токена `status` охоплюють джерела unit як `Environment=`, так і `EnvironmentFile=`.
- Перевірки розбіжності визначають SecretRefs `gateway.auth.token` за допомогою об’єднаного середовища виконання (спершу середовище команди служби, потім резервно середовище процесу).
- Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy` або режим не задано, пароль може перемогти, і жоден кандидат токена не може перемогти), перевірки розбіжності токена пропускають визначення токена конфігурації.
- Коли автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, `install` перевіряє, що SecretRef можна визначити, але не зберігає визначений токен у метаданих середовища служби.
- Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не визначено, встановлення завершується помилкою в закритому режимі.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення блокується, доки режим не буде задано явно.
- На macOS `install` залишає plists LaunchAgent доступними лише власнику та завантажує керовані значення середовища служби через файл і wrapper, доступні лише власнику, замість серіалізації API-ключів або env-посилань профілю автентифікації в `EnvironmentVariables`.
- Якщо ви навмисно запускаєте кілька gateways на одному хості, ізолюйте порти, конфігурацію/стан і робочі простори; див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

## Рекомендовано

Використовуйте [`openclaw gateway`](/uk/cli/gateway) для актуальної документації та прикладів.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
