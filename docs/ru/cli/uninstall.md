---
read_when:
    - Вы хотите удалить службу Gateway и/или локальное состояние
    - Вам сначала нужен пробный запуск
summary: Справочник CLI для `openclaw uninstall` (удаление службы gateway и локальных данных)
title: Удаление
x-i18n:
    generated_at: "2026-06-28T22:47:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Удаление службы Gateway и локальных данных (CLI остается).

Параметры:

- `--service`: удалить службу Gateway
- `--state`: удалить состояние и конфигурацию
- `--workspace`: удалить каталоги рабочих пространств
- `--app`: удалить приложение macOS
- `--all`: удалить службу, состояние, рабочее пространство и приложение
- `--yes`: пропустить запросы подтверждения
- `--non-interactive`: отключить запросы; требует `--yes`
- `--dry-run`: вывести действия без удаления файлов

Примеры:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Примечания:

- Сначала выполните `openclaw backup create`, если хотите получить восстанавливаемый снимок перед удалением состояния или рабочих пространств.
- `--state` сохраняет настроенные каталоги рабочих пространств, если также не выбран `--workspace`.
- `--all` — сокращение для одновременного удаления службы, состояния, рабочего пространства и приложения.
- `--non-interactive` требует `--yes`.

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Удаление](/ru/install/uninstall)
