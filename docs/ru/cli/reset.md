---
read_when:
    - Вы хотите удалить локальное состояние, сохранив установленный CLI
    - Вы хотите предварительно посмотреть, что будет удалено.
summary: Справочник по CLI для `openclaw reset` (сброс локального состояния/конфигурации)
title: Сбросить
x-i18n:
    generated_at: "2026-07-12T11:18:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Сброс локальной конфигурации и состояния (CLI останется установленным).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Параметры

- `--scope <scope>`: `config`, `config+creds+sessions` или `full`
- `--yes`: пропустить запросы подтверждения
- `--non-interactive`: отключить запросы; требует указания `--scope` и `--yes`
- `--dry-run`: вывести действия без удаления файлов

## Области сброса

| Область                 | Что удаляется                                                                                                            | Предварительная остановка Gateway |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| `config`                | только файл конфигурации                                                                                                 | нет                               |
| `config+creds+sessions` | файл конфигурации, каталог OAuth/учётных данных и каталоги сеансов каждого агента                                         | да                                |
| `full`                  | каталог состояния (включая конфигурацию и учётные данные, если они находятся в нём), каталоги рабочих областей и их аттестации | да                                |

При выборе `config+creds+sessions` или `full` работающая управляемая служба Gateway останавливается перед удалением состояния.

## Примечания

- Перед удалением локального состояния сначала выполните `openclaw backup create`, чтобы создать снимок с возможностью восстановления.
- Если `--scope` не указан, `openclaw reset` интерактивно запрашивает область для удаления.
- Параметр `--non-interactive` допустим только при одновременном указании `--scope` и `--yes`.
- После завершения операции для `config+creds+sessions` и `full` выводится `Next: openclaw onboard --install-daemon`.

## См. также

- [Справочник CLI](/ru/cli)
