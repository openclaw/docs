---
read_when:
    - Ви хочете очистити локальний стан, залишивши CLI встановленим
    - Ви хочете пробний запуск, щоб побачити, що буде видалено
summary: Довідка CLI для `openclaw reset` (скидання локального стану/конфігурації)
title: Reset
x-i18n:
    generated_at: "2026-04-24T04:12:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw reset`

Скидання локальної конфігурації/стану (CLI залишається встановленим).

Параметри:

- `--scope <scope>`: `config`, `config+creds+sessions` або `full`
- `--yes`: пропустити запити на підтвердження
- `--non-interactive`: вимкнути запити; потребує `--scope` і `--yes`
- `--dry-run`: вивести дії без видалення файлів

Приклади:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Примітки:

- Спочатку виконайте `openclaw backup create`, якщо хочете мати відновлюваний знімок перед видаленням локального стану.
- Якщо не вказати `--scope`, `openclaw reset` використає інтерактивний запит, щоб вибрати, що видаляти.
- `--non-interactive` є чинним лише тоді, коли встановлено і `--scope`, і `--yes`.

## Пов’язане

- [Довідка CLI](/uk/cli)
