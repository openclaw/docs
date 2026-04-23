---
read_when:
    - Ви хочете очистити локальний стан, зберігши встановлений CLI
    - Ви хочете виконати dry-run того, що буде видалено
summary: Довідник CLI для `openclaw reset` (скидання локального стану/конфігурації)
title: Скидання
x-i18n:
    generated_at: "2026-04-23T20:48:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ec7b6b99bd1b16f804c4abd1e112074b6d99553ebed1ef583b7fb3b3a11b851
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Скидання локальної конфігурації/стану (CLI залишається встановленим).

Параметри:

- `--scope <scope>`: `config`, `config+creds+sessions` або `full`
- `--yes`: пропустити запити підтвердження
- `--non-interactive`: вимкнути prompt-и; вимагає `--scope` і `--yes`
- `--dry-run`: показати дії без видалення файлів

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

- Спочатку запустіть `openclaw backup create`, якщо хочете мати snapshot для відновлення перед видаленням локального стану.
- Якщо не вказати `--scope`, `openclaw reset` використовує інтерактивний prompt для вибору того, що потрібно видалити.
- `--non-interactive` є коректним лише тоді, коли задано і `--scope`, і `--yes`.
