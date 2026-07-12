---
read_when:
    - Вы хотите удалить службу Gateway и/или локальное состояние
    - Сначала выполните пробный запуск
summary: Справочник CLI для `openclaw uninstall` (удаление службы Gateway и локальных данных)
title: Удаление
x-i18n:
    generated_at: "2026-07-12T11:19:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Удаление службы Gateway и/или локальных данных. Сам CLI не удаляется;
удалите его отдельно с помощью npm/pnpm.

## Параметры

| Флаг                | По умолчанию | Описание                                                     |
| ------------------- | ------------ | ------------------------------------------------------------ |
| `--service`         | `false`      | Удалить службу Gateway.                                      |
| `--state`           | `false`      | Удалить состояние и конфигурацию.                            |
| `--workspace`       | `false`      | Удалить каталоги рабочих пространств.                        |
| `--app`             | `false`      | Удалить приложение macOS.                                    |
| `--all`             | `false`      | Сокращение для `--service --state --workspace --app`.        |
| `--yes`             | `false`      | Пропустить запросы подтверждения.                            |
| `--non-interactive` | `false`      | Отключить запросы; требуется `--yes`.                         |
| `--dry-run`         | `false`      | Вывести запланированные действия без удаления файлов.        |

Если флаги области действия не указаны, в интерактивном режиме предлагается
выбрать удаляемые компоненты из списка с множественным выбором (по умолчанию
предварительно выбраны служба, состояние и рабочее пространство).

## Примеры

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## Примечания

- Перед удалением состояния или рабочих пространств сначала выполните
  `openclaw backup create`, чтобы создать снимок, пригодный для восстановления.
- `--state` сохраняет настроенные каталоги рабочих пространств, если также не
  выбран параметр `--workspace`.

## См. также

- [Справочник по CLI](/ru/cli)
- [Удаление](/ru/install/uninstall)
