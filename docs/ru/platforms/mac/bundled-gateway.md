---
read_when:
    - Упаковка OpenClaw.app
    - Отладка службы launchd Gateway в macOS
    - Установка CLI Gateway для macOS
summary: Среда выполнения Gateway на macOS (внешняя служба launchd)
title: Gateway на macOS
x-i18n:
    generated_at: "2026-07-04T06:45:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app больше не включает Node/Bun или среду выполнения Gateway. Приложение macOS
ожидает **внешнюю** установку CLI `openclaw`, не запускает Gateway как
дочерний процесс и управляет пользовательской службой launchd, чтобы Gateway
оставался запущенным (или подключается к существующему локальному Gateway, если он уже запущен).

## Автоматическая настройка

На новом Mac выберите **Этот Mac** во время онбординга. Приложение запускает свой подписанный,
встроенный установщик перед мастером Gateway, устанавливает пользовательскую среду выполнения Node
и соответствующий CLI `openclaw` в `~/.openclaw`, затем устанавливает и запускает
пользовательскую службу launchd. Этот путь не требует Terminal, Homebrew или
доступа администратора.

Приложение включает скрипт установщика, а не полезную нагрузку Node или Gateway. Поэтому для настройки
требуется подключение к интернету, чтобы скачать среду выполнения и соответствующий
пакет OpenClaw.

## Восстановление вручную

Для ручной установки рекомендуется Node 24. Node 22 LTS, сейчас `22.19+`,
также работает. Затем установите `openclaw` глобально:

```bash
npm install -g openclaw@<version>
```

Используйте **Повторить настройку** после неудачной автоматической настройки. Если это по-прежнему не сработает, установите
CLI вручную с помощью команды выше, затем выберите **Проверить снова** в
онбординге. Node остается рекомендуемой средой выполнения Gateway.

## Launchd (Gateway как LaunchAgent)

Метка:

- `ai.openclaw.gateway` (или `ai.openclaw.<profile>`; устаревший `com.openclaw.*` может сохраниться)

Расположение plist (пользовательское):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (или `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Менеджер:

- Приложение macOS управляет установкой и обновлением LaunchAgent в локальном режиме.
- CLI также может установить его: `openclaw gateway install`.

Поведение:

- «OpenClaw активен» включает/отключает LaunchAgent.
- Выход из приложения **не** останавливает gateway (launchd поддерживает его работу).
- Если Gateway уже запущен на настроенном порту, приложение подключается к
  нему вместо запуска нового.

Журналирование:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (профили используют `gateway-<profile>.log`)
- stderr launchd: подавляется

## Совместимость версий

Приложение macOS проверяет версию Gateway относительно своей версии. Онбординг
автоматически запускает управляемую настройку, когда существующий CLI отсутствует или
несовместим. Используйте **Повторить настройку**, чтобы повторить установку, или **Проверить снова**
после исправления внешнего CLI.

## Каталог состояния на macOS

Храните состояние OpenClaw на локальном, несинхронизируемом диске. Избегайте iCloud Drive и других
папок, синхронизируемых с облаком, потому что задержка синхронизации и блокировки файлов могут влиять на сеансы,
учетные данные и состояние Gateway.

Задавайте `OPENCLAW_STATE_DIR` локальным путем только когда нужно переопределение.
`openclaw doctor` предупреждает о распространенных путях состояния, синхронизируемых с облаком, и рекомендует
вернуться к локальному хранилищу. См.
[переменные окружения](/ru/help/environment#path-related-env-vars) и
[Doctor](/ru/gateway/doctor).

## Отладка подключения приложения

Используйте отладочный CLI macOS из исходного checkout, чтобы выполнить ту же логику
рукопожатия WebSocket Gateway и обнаружения, которую использует приложение:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` принимает `--url`, `--token`, `--timeout` и `--json`. `discover`
принимает `--timeout`, `--json` и `--include-local`. Сравните вывод обнаружения
с `openclaw gateway discover --json`, когда нужно отделить обнаружение CLI
от проблем подключения на стороне приложения.

## Smoke-проверка

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Затем:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Связанные материалы

- [приложение macOS](/ru/platforms/macos)
- [runbook Gateway](/ru/gateway)
