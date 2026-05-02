---
read_when:
    - Ви досі використовуєте `openclaw daemon ...` у скриптах
    - Вам потрібні команди керування життєвим циклом служби (install/start/stop/restart/status)
summary: Довідка CLI для `openclaw daemon` (застарілий псевдонім для керування службою Gateway)
title: Демон
x-i18n:
    generated_at: "2026-05-02T21:59:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
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

- `status`: показати стан установлення служби та перевірити справність Gateway
- `install`: установити службу (`launchd`/`systemd`/`schtasks`)
- `uninstall`: видалити службу
- `start`: запустити службу
- `stop`: зупинити службу
- `restart`: перезапустити службу

## Поширені параметри

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--force`, `--wait <duration>`, `--json`
- життєвий цикл (`uninstall|start|stop`): `--json`

Примітки:

- `status` за можливості розв’язує налаштовані SecretRefs автентифікації для автентифікації проби.
- Якщо потрібний SecretRef автентифікації не розв’язано в цьому шляху команди, `daemon status --json` повідомляє `rpc.authWarning`, коли підключення/автентифікація проби не вдається; передайте `--token`/`--password` явно або спочатку розв’яжіть джерело секрету.
- Якщо проба успішна, попередження про нерозв’язані посилання автентифікації придушуються, щоб уникнути хибних спрацьовувань.
- `status --deep` додає найкращу можливу перевірку служби на системному рівні. Коли вона знаходить інші служби, схожі на Gateway, людиночитний вивід друкує підказки щодо очищення та попереджає, що один Gateway на машину все ще є звичайною рекомендацією.
- В установленнях Linux systemd перевірки розбіжності токена в `status` охоплюють джерела unit як `Environment=`, так і `EnvironmentFile=`.
- Перевірки розбіжностей розв’язують SecretRefs `gateway.auth.token` за допомогою об’єднаного runtime-середовища (спочатку середовище команди служби, потім резервно середовище процесу).
- Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy` або режим не задано, коли пароль може перемогти й жоден кандидат токена не може перемогти), перевірки розбіжності токена пропускають розв’язання токена конфігурації.
- Коли автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, `install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища служби.
- Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не розв’язано, установлення завершується закритою відмовою.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки режим не буде задано явно.
- На macOS `install` залишає plist-файли LaunchAgent доступними лише власнику та завантажує значення середовища керованої служби через файл і обгортку, доступні лише власнику, замість серіалізації ключів API або посилань середовища профілю автентифікації в `EnvironmentVariables`.
- Якщо ви навмисно запускаєте кілька Gateway на одному хості, ізолюйте порти, конфігурацію/стан і робочі простори; див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

## Надавайте перевагу

Використовуйте [`openclaw gateway`](/uk/cli/gateway) для актуальної документації та прикладів.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
