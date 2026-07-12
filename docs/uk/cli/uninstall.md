---
read_when:
    - Ви хочете видалити службу Gateway та/або локальний стан
    - Спочатку ви хочете виконати пробний запуск
summary: Довідник CLI для `openclaw uninstall` (видалення служби Gateway і локальних даних)
title: Видалення
x-i18n:
    generated_at: "2026-07-12T13:10:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Видаліть службу Gateway та/або локальні дані. Сам CLI не видаляється; видаліть його окремо за допомогою npm/pnpm.

## Параметри

| Прапорець           | Типове значення | Опис                                                       |
| ------------------- | --------------- | ---------------------------------------------------------- |
| `--service`         | `false`         | Видалити службу Gateway.                                   |
| `--state`           | `false`         | Видалити стан і конфігурацію.                              |
| `--workspace`       | `false`         | Видалити каталоги робочих просторів.                       |
| `--app`             | `false`         | Видалити застосунок для macOS.                             |
| `--all`             | `false`         | Скорочення для `--service --state --workspace --app`.      |
| `--yes`             | `false`         | Пропустити запити на підтвердження.                        |
| `--non-interactive` | `false`         | Вимкнути запити; потребує `--yes`.                         |
| `--dry-run`         | `false`         | Вивести заплановані дії без видалення файлів.              |

Якщо прапорці області дії не вказані, інтерактивний список із множинним вибором запропонує вибрати компоненти для видалення (за замовчуванням попередньо вибрано службу, стан і робочий простір).

## Приклади

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## Примітки

- Перш ніж видаляти стан або робочі простори, спочатку виконайте `openclaw backup create`, щоб створити знімок, придатний для відновлення.
- `--state` зберігає налаштовані каталоги робочих просторів, якщо також не вибрано `--workspace`.

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Видалення](/uk/install/uninstall)
