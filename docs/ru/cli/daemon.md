---
read_when:
    - Вы по-прежнему используете `openclaw daemon ...` в scripts
    - Вам нужны команды жизненного цикла службы (install/start/stop/restart/status)
summary: Справочник CLI для `openclaw daemon` (устаревший псевдоним для управления сервисом Gateway)
title: Демон
x-i18n:
    generated_at: "2026-06-28T22:42:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Устаревший псевдоним для команд управления сервисом Gateway.

`openclaw daemon ...` соответствует той же поверхности управления сервисом, что и сервисные команды `openclaw gateway ...`.

## Использование

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Подкоманды

- `status`: показать состояние установки сервиса и проверить работоспособность Gateway
- `install`: установить сервис (`launchd`/`systemd`/`schtasks`)
- `uninstall`: удалить сервис
- `start`: запустить сервис
- `stop`: остановить сервис
- `restart`: перезапустить сервис

## Общие параметры

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- жизненный цикл (`uninstall|start|stop`): `--json`

Примечания:

- `status` по возможности разрешает настроенные auth SecretRefs для аутентификации проверки.
- Если обязательный auth SecretRef не разрешен в этом пути команды, `daemon status --json` сообщает `rpc.authWarning`, когда подключение/аутентификация проверки завершается сбоем; передайте `--token`/`--password` явно или сначала разрешите источник секрета.
- Если проверка проходит успешно, предупреждения о неразрешенных auth-ref подавляются, чтобы избежать ложных срабатываний.
- `status --deep` добавляет best-effort сканирование сервиса на системном уровне. Когда оно находит другие gateway-подобные сервисы, человекочитаемый вывод печатает подсказки по очистке и предупреждает, что один gateway на машину по-прежнему является обычной рекомендацией.
- `status --deep` также запускает проверку конфигурации в Plugin-aware режиме и показывает предупреждения настроенных манифестов Plugin (например, об отсутствующих метаданных конфигурации канала), чтобы smoke-проверки установки и обновления их обнаруживали. Стандартный `status` сохраняет быстрый путь только для чтения, который пропускает проверку Plugin.
- В установках Linux systemd проверки token-drift для `status` включают источники unit как `Environment=`, так и `EnvironmentFile=`.
- Проверки drift разрешают SecretRefs `gateway.auth.token` с использованием объединенного runtime env (сначала env команды сервиса, затем резервно process env).
- Если token auth фактически не активна (явный `gateway.auth.mode` равен `password`/`none`/`trusted-proxy` либо mode не задан, password может выиграть, а ни один token candidate выиграть не может), проверки token-drift пропускают разрешение config token.
- Когда token auth требует token и `gateway.auth.token` управляется SecretRef, `install` проверяет, что SecretRef разрешим, но не сохраняет разрешенный token в метаданных service environment.
- Если token auth требует token, а настроенный token SecretRef не разрешен, установка завершается с закрытым отказом.
- Если настроены и `gateway.auth.token`, и `gateway.auth.password`, а `gateway.auth.mode` не задан, установка блокируется, пока mode не будет задан явно.
- В macOS `install` сохраняет LaunchAgent plists доступными только владельцу и загружает управляемые значения service environment через доступные только владельцу файл и wrapper вместо сериализации API keys или auth-profile env refs в `EnvironmentVariables`.
- Если вы намеренно запускаете несколько gateways на одном хосте, изолируйте порты, config/state и workspaces; см. [/gateway#multiple-gateways-same-host](/ru/gateway#multiple-gateways-same-host).
- `restart --safe` просит работающий Gateway выполнить preflight активной работы и запланировать один объединенный restart после завершения активной работы. Обычный `restart` сохраняет существующее поведение service-manager; `--force` остается путем немедленного принудительного выполнения.
- `restart --safe --skip-deferral` выполняет OpenClaw-aware безопасный restart, но обходит deferral gate активной работы, поэтому Gateway немедленно отправляет restart, даже когда сообщается о блокировщиках. Аварийный выход для оператора, когда зависший task run удерживает безопасный restart; требует `--safe`.

## Предпочтительно

Используйте [`openclaw gateway`](/ru/cli/gateway) для актуальной документации и примеров.

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Runbook Gateway](/ru/gateway)
