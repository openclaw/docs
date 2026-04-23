---
read_when:
    - Ви хочете видалити службу Gateway та/або локальний стан
    - Ви спочатку хочете dry-run
summary: Довідник CLI для `openclaw uninstall` (видалення служби Gateway і локальних даних)
title: uninstall
x-i18n:
    generated_at: "2026-04-23T06:19:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2123a4f9c7a070ef7e13c60dafc189053ef61ce189fa4f29449dd50987c1894c
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Видалення служби Gateway + локальних даних (CLI залишається).

Параметри:

- `--service`: видалити службу Gateway
- `--state`: видалити стан і конфігурацію
- `--workspace`: видалити каталоги workspace
- `--app`: видалити застосунок macOS
- `--all`: видалити службу, стан, workspace і застосунок
- `--yes`: пропустити запити на підтвердження
- `--non-interactive`: вимкнути запити; потребує `--yes`
- `--dry-run`: показати дії без видалення файлів

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

- Спочатку виконайте `openclaw backup create`, якщо хочете мати відновлюваний знімок перед видаленням стану або workspace.
- `--all` — це скорочення для одночасного видалення служби, стану, workspace і застосунку.
- `--non-interactive` потребує `--yes`.
