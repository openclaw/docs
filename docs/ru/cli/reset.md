---
read_when:
    - Вы хотите удалить локальное состояние, сохранив установленный CLI
    - Вам нужен пробный запуск, показывающий, что будет удалено
summary: Справочник CLI для `openclaw reset` (сброс локального состояния/конфигурации)
title: Сбросить
x-i18n:
    generated_at: "2026-07-13T19:40:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
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
- `--non-interactive`: отключить запросы; требуются `--scope` и `--yes`
- `--dry-run`: вывести список действий без удаления файлов

## Области сброса

| Область                 | Что удаляется                                                                                                      | Предварительная остановка Gateway |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| `config`                | только файл конфигурации                                                                                           | нет                               |
| `config+creds+sessions` | файл конфигурации, каталог OAuth/учётных данных, каталоги сеансов отдельных агентов                                 | да                                |
| `full`                  | каталог состояния (включая конфигурацию и учётные данные, если они находятся в нём), каталоги рабочих пространств и их аттестации | да                                |

`config+creds+sessions` и `full` останавливают работающую управляемую службу Gateway перед удалением состояния.

## Примечания

- Сначала выполните `openclaw backup create`, чтобы создать снимок для восстановления перед удалением локального состояния.
- Без `--scope` команда `openclaw reset` интерактивно запрашивает область удаления.
- `--non-interactive` допустим только при одновременной установке `--scope` и `--yes`.
- `config+creds+sessions` и `full` после завершения выводят `Next: openclaw onboard --install-daemon`.

## См. также

- [Справочник CLI](/ru/cli)
