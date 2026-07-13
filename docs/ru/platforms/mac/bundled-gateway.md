---
read_when:
    - Упаковка OpenClaw.app
    - Отладка службы Gateway launchd в macOS
    - Установка CLI Gateway для macOS
summary: Среда выполнения Gateway в macOS (внешняя служба launchd)
title: Gateway в macOS
x-i18n:
    generated_at: "2026-07-13T18:18:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app не включает в комплект Node или среду выполнения Gateway. Приложение macOS
предполагает **внешнюю** установку CLI `openclaw`, не запускает Gateway
как дочерний процесс и управляет пользовательской службой launchd, чтобы Gateway
продолжал работать (либо подключается к уже запущенному локальному Gateway).

## Автоматическая настройка

На новом Mac во время первоначальной настройки выберите **Этот Mac**. Перед мастером
Gateway приложение запускает входящий в комплект подписанный сценарий установки: он устанавливает
Node в пользовательское пространство и соответствующий CLI `openclaw` в `~/.openclaw`,
а затем устанавливает и запускает пользовательскую службу launchd. Для этого
не требуются Terminal, Homebrew или права администратора.

В комплект приложения входит только сценарий установки, но не компоненты Node или Gateway;
для загрузки среды выполнения и соответствующего пакета OpenClaw во время настройки требуется
подключение к интернету.

## Восстановление вручную

Для установки вручную рекомендуется Node 24.15+; Node 22.22.3+ также поддерживается. Установите
`openclaw` глобально:

```bash
npm install -g openclaw@<version>
```

После сбоя автоматической настройки используйте **Повторить настройку**. Если это также не поможет,
установите CLI вручную с помощью приведённой выше команды, а затем выберите **Проверить снова**
во время первоначальной настройки.

## Launchd (Gateway как LaunchAgent)

Метка: `ai.openclaw.gateway` (профиль по умолчанию) или `ai.openclaw.<profile>`
для именованного профиля.

Расположение plist (для пользователя): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(или `ai.openclaw.<profile>.plist`).

В локальном режиме приложение macOS управляет установкой и обновлением LaunchAgent
для профиля по умолчанию. CLI также может установить его напрямую: `openclaw gateway install`
(именованные профили выбираются с помощью переменной среды `OPENCLAW_PROFILE`).

Поведение:

- «OpenClaw активен» включает или отключает LaunchAgent.
- Завершение работы приложения **не** останавливает Gateway (launchd поддерживает его работу).
- Если Gateway уже работает на настроенном порту, приложение подключается
  к нему вместо запуска нового экземпляра.

Журналирование:

- Стандартный вывод launchd: `~/Library/Logs/openclaw/gateway.log` (для профилей используется
  `gateway-<profile>.log`)
- Стандартный поток ошибок launchd: подавляется
- Если хост зацикливается с повторяющимися `EADDRINUSE` или быстрыми перезапусками, проверьте
  наличие дублирующихся LaunchAgent `ai.openclaw.gateway` / `ai.openclaw.node` и обходное решение
  с маркером launchd в разделе
  [Устранение неполадок Gateway](/ru/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Совместимость версий

Приложение macOS сравнивает версию Gateway со своей версией. Во время первоначальной настройки
управляемая установка запускается автоматически, если существующий CLI отсутствует или
несовместим. Используйте **Повторить настройку**, чтобы повторить установку, или **Проверить снова**
после восстановления внешнего CLI.

## Каталог состояния в macOS

Храните состояние OpenClaw на локальном несинхронизируемом диске. Не используйте iCloud Drive и другие
папки с облачной синхронизацией: задержки синхронизации и блокировки файлов могут влиять на сеансы,
учётные данные и состояние Gateway.

Задавайте `OPENCLAW_STATE_DIR` как локальный путь только при необходимости переопределения.
`openclaw doctor` предупреждает о распространённых путях состояния с облачной синхронизацией и рекомендует
вернуться к локальному хранилищу. См.
[переменные среды](/ru/help/environment#path-related-env-vars) и
[Doctor](/ru/gateway/doctor).

## Отладка подключения приложения

Используйте отладочный CLI для macOS из рабочей копии исходного кода, чтобы проверить ту же логику
WebSocket-рукопожатия и обнаружения Gateway, которую использует приложение:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` принимает `--url`, `--token`, `--timeout`, `--probe` и `--json`
(а также переопределения идентификации клиента; для полного списка запустите с `--help`).
`discover` принимает `--timeout`, `--json` и `--include-local`. Чтобы
отделить проблемы обнаружения CLI от проблем подключения на стороне приложения, сравните
результат обнаружения с `openclaw gateway discover --json`.

## Быстрая проверка

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

- [Приложение macOS](/ru/platforms/macos)
- [Руководство по эксплуатации Gateway](/ru/gateway)
