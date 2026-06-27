---
read_when:
    - Ви хочете видалити службу Gateway та/або локальний стан
    - Спочатку потрібен пробний запуск
summary: Довідник CLI для `openclaw uninstall` (видалити службу Gateway + локальні дані)
title: Видалення
x-i18n:
    generated_at: "2026-06-27T17:23:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Видаліть службу Gateway і локальні дані (CLI залишається).

Параметри:

- `--service`: видалити службу Gateway
- `--state`: видалити стан і конфігурацію
- `--workspace`: видалити каталоги робочого простору
- `--app`: видалити застосунок macOS
- `--all`: видалити службу, стан, робочий простір і застосунок
- `--yes`: пропустити запити підтвердження
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

- Спочатку виконайте `openclaw backup create`, якщо хочете мати відновлюваний знімок перед видаленням стану або робочих просторів.
- `--state` зберігає налаштовані каталоги робочого простору, якщо також не вибрано `--workspace`.
- `--all` — скорочення для одночасного видалення служби, стану, робочого простору й застосунку.
- `--non-interactive` потребує `--yes`.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Видалення](/uk/install/uninstall)
