---
read_when:
    - Вы выполняете первоначальную настройку без полного онбординга CLI
    - Вы хотите задать путь рабочей области по умолчанию
    - Вам нужны все флаги и то, как setup выбирает между базовым режимом и режимом мастера.
summary: Справочник CLI для `openclaw setup` (инициализация конфигурации и рабочей области, с возможностью запустить онбординг)
title: Настройка
x-i18n:
    generated_at: "2026-06-28T22:46:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Инициализирует базовую конфигурацию и рабочую область агента. Если указан любой флаг онбординга, также запускает мастер.

<Note>
`openclaw setup` предназначен для установок с изменяемой конфигурацией. В режиме Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw отклоняет записи setup, потому что файл конфигурации управляется Nix. Используйте официальный [краткий старт nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) или эквивалентную исходную конфигурацию для другого пакета Nix.
</Note>

## Параметры

| Флаг                       | Описание                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Каталог рабочей области агента (по умолчанию `~/.openclaw/workspace`; сохраняется как `agents.defaults.workspace`). |
| `--wizard`                 | Запустить интерактивный онбординг.                                                                         |
| `--non-interactive`        | Запустить онбординг без запросов.                                                                     |
| `--accept-risk`            | Подтвердить риск доступа агента ко всей системе; требуется с `--non-interactive`.                       |
| `--mode <mode>`            | Режим онбординга: `local` или `remote`.                                                               |
| `--import-from <provider>` | Провайдер миграции, который нужно запустить во время онбординга.                                                        |
| `--import-source <path>`   | Домашний каталог исходного агента для `--import-from`.                                                              |
| `--import-secrets`         | Импортировать поддерживаемые секреты во время миграции онбординга.                                               |
| `--remote-url <url>`       | URL WebSocket удаленного Gateway.                                                                       |
| `--remote-token <token>`   | Токен удаленного Gateway (необязательно).                                                                    |

### Автозапуск мастера

`openclaw setup` запускает мастер, когда явно указан любой из этих флагов, даже без `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Примеры

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Примечания

- Обычный `openclaw setup` инициализирует конфигурацию и рабочую область без запуска полного процесса онбординга.
- После обычной настройки запустите `openclaw onboard` для полного пошагового пути, `openclaw configure` для точечных изменений или `openclaw channels add`, чтобы добавить учетные записи каналов.
- Если обнаружено состояние Hermes, интерактивный онбординг может автоматически предложить миграцию. Импорт в онбординге требует свежей настройки; используйте [Миграцию](/ru/cli/migrate) для планов пробного запуска, резервных копий и режима перезаписи вне онбординга.

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Онбординг (CLI)](/ru/start/wizard)
- [Начало работы](/ru/start/getting-started)
- [Обзор установки](/ru/install)
