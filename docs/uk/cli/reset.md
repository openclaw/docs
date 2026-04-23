---
read_when:
    - Ви хочете стерти локальний стан, зберігши встановлений CLI
    - Ви хочете пробний запуск, щоб побачити, що буде видалено
summary: Довідка CLI для `openclaw reset` (скидання локального стану/конфігурації)
title: скидання
x-i18n:
    generated_at: "2026-04-23T06:19:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad464700f948bebe741ec309f25150714f0b280834084d4f531327418a42c79b
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Скидання локальної конфігурації/стану (CLI залишається встановленим).

Параметри:

- `--scope <scope>`: `config`, `config+creds+sessions` або `full`
- `--yes`: пропустити запити на підтвердження
- `--non-interactive`: вимкнути запити; вимагає `--scope` і `--yes`
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

- Спочатку виконайте `openclaw backup create`, якщо хочете мати придатний для відновлення знімок перед видаленням локального стану.
- Якщо ви не вказали `--scope`, `openclaw reset` використовує інтерактивний запит, щоб вибрати, що видалити.
- `--non-interactive` є чинним лише тоді, коли задано і `--scope`, і `--yes`.
