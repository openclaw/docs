---
read_when:
    - Вы хотите очистить локальное состояние, сохранив установленный CLI
    - Вам нужен пробный запуск, показывающий, что будет удалено
summary: Справочник CLI для `openclaw reset` (сброс локального состояния/конфигурации)
title: Сброс
x-i18n:
    generated_at: "2026-06-28T22:45:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Сбрасывает локальную конфигурацию/состояние (CLI остается установленным).

Параметры:

- `--scope <scope>`: `config`, `config+creds+sessions` или `full`
- `--yes`: пропустить запросы подтверждения
- `--non-interactive`: отключить запросы; требует `--scope` и `--yes`
- `--dry-run`: вывести действия без удаления файлов

Примеры:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Примечания:

- Сначала выполните `openclaw backup create`, если перед удалением локального состояния нужен снимок, который можно восстановить.
- Если опустить `--scope`, `openclaw reset` использует интерактивный запрос, чтобы выбрать, что удалить.
- `--non-interactive` допустим только когда заданы и `--scope`, и `--yes`.

## Связанные материалы

- [Справочник CLI](/ru/cli)
