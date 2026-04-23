---
read_when:
    - Ви хочете видалити сервіс gateway та/або локальний стан
    - Ви хочете спочатку виконати dry-run
summary: Довідник CLI для `openclaw uninstall` (видалити сервіс gateway і локальні дані)
title: Видалення
x-i18n:
    generated_at: "2026-04-23T20:48:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e7e588986fdfdd2f92ca7d3fc0588b864e80ed1ca609a3181b8d0c3e054ec98
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Видалити сервіс gateway + локальні дані (CLI залишається).

Параметри:

- `--service`: видалити сервіс gateway
- `--state`: видалити state і config
- `--workspace`: видалити каталоги workspace
- `--app`: видалити застосунок macOS
- `--all`: видалити сервіс, state, workspace і застосунок
- `--yes`: пропустити запити на підтвердження
- `--non-interactive`: вимкнути запити; потребує `--yes`
- `--dry-run`: вивести дії без видалення файлів

Приклади:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Примітки:

- Спочатку запустіть `openclaw backup create`, якщо хочете мати відновлюваний знімок перед видаленням state або workspace.
- `--all` — це скорочення для одночасного видалення сервісу, state, workspace і застосунку.
- `--non-interactive` потребує `--yes`.
