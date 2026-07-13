---
read_when:
    - Вы хотите удалить службу Gateway и/или локальное состояние
    - Сначала вы хотите выполнить пробный запуск
summary: Справочник CLI для `openclaw uninstall` (удаление службы Gateway и локальных данных)
title: Удаление
x-i18n:
    generated_at: "2026-07-13T19:41:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Удалите службу Gateway и/или локальные данные. Сам CLI не
удаляется; удалите его отдельно через npm/pnpm.

## Параметры

| Флаг                | По умолчанию | Описание                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `--service`         | `false` | Удалить службу Gateway.                          |
| `--state`           | `false` | Удалить состояние и конфигурацию.                             |
| `--workspace`       | `false` | Удалить каталоги рабочих пространств.                        |
| `--app`             | `false` | Удалить приложение macOS.                                |
| `--all`             | `false` | Сокращение для `--service --state --workspace --app`. |
| `--yes`             | `false` | Пропустить запросы подтверждения.                           |
| `--non-interactive` | `false` | Отключить запросы; требуется `--yes`.                   |
| `--dry-run`         | `false` | Вывести запланированные действия без удаления файлов.        |

Если флаги области действия не указаны, интерактивный список с множественным выбором предложит выбрать компоненты
для удаления (по умолчанию предварительно выбраны служба, состояние и рабочее пространство).

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

- Сначала выполните `openclaw backup create`, чтобы создать восстанавливаемый снимок перед удалением
  состояния или рабочих пространств.
- `--state` сохраняет настроенные каталоги рабочих пространств, если также не выбран
  `--workspace`.

## См. также

- [Справочник CLI](/ru/cli)
- [Удаление](/ru/install/uninstall)
