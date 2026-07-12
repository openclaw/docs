---
read_when:
    - Ви хочете стерти локальний стан, зберігши встановлений CLI
    - Ви хочете виконати пробний запуск, щоб побачити, що буде видалено
summary: Довідник CLI для `openclaw reset` (скидання локального стану/конфігурації)
title: Скинути
x-i18n:
    generated_at: "2026-07-12T13:09:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Скидає локальну конфігурацію/стан (залишає CLI встановленим).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Параметри

- `--scope <scope>`: `config`, `config+creds+sessions` або `full`
- `--yes`: пропустити запити на підтвердження
- `--non-interactive`: вимкнути запити; потребує `--scope` і `--yes`
- `--dry-run`: вивести дії без видалення файлів

## Області скидання

| Область                 | Видаляє                                                                                                            | Спочатку зупиняє Gateway |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `config`                | лише файл конфігурації                                                                                            | ні                       |
| `config+creds+sessions` | файл конфігурації, каталог OAuth/облікових даних і каталоги сеансів для кожного агента                            | так                      |
| `full`                  | каталог стану (включно з конфігурацією/обліковими даними, якщо вони вкладені в нього), каталоги робочих просторів і атестації робочих просторів | так                      |

`config+creds+sessions` і `full` зупиняють запущену керовану службу Gateway перед видаленням стану.

## Примітки

- Перш ніж видаляти локальний стан, спочатку виконайте `openclaw backup create`, щоб створити знімок, придатний для відновлення.
- Без `--scope` команда `openclaw reset` інтерактивно пропонує вибрати область для видалення.
- `--non-interactive` допустимий лише тоді, коли задано і `--scope`, і `--yes`.
- Після завершення `config+creds+sessions` і `full` виводять `Next: openclaw onboard --install-daemon`.

## Пов’язане

- [Довідник CLI](/uk/cli)
