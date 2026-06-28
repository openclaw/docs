---
read_when:
    - Ви зустрічаєте `openclaw flows` у старішій документації або примітках до випуску
    - Вам потрібен короткий довідник для перевірки TaskFlow
summary: 'Перенаправлення: команди flow розміщені в `openclaw tasks flow`'
title: Потоки (переспрямування)
x-i18n:
    generated_at: "2026-05-11T20:27:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw tasks flow`

Команди верхнього рівня `openclaw flows` немає. Постійна перевірка TaskFlow розташована в `openclaw tasks flow`.

## Підкоманди

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Підкоманда | Опис                       | Аргументи / параметри                                                                  |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | Показати відстежувані TaskFlows. | `--json` машиночитаний вивід; фільтр `--status <name>` (див. значення статусів нижче). |
| `show`     | Показати один TaskFlow.    | `<lookup>` — ідентифікатор потоку або ключ власника; `--json` машиночитаний вивід.     |
| `cancel`   | Скасувати запущений TaskFlow. | `<lookup>` — ідентифікатор потоку або ключ власника.                                  |

`<lookup>` приймає або ідентифікатор потоку (повернений `list` / `show`), або ключ власника потоку (стабільний ідентифікатор, який підсистема-власник використовує для відстеження потоку).

### Значення фільтра статусу

`--status` у `list` приймає одне з таких значень:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Приклади

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Повний опис концепцій TaskFlow і створення див. у [TaskFlow](/uk/automation/taskflow). Батьківську команду `tasks` див. у [довіднику CLI для tasks](/uk/cli/tasks).

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Автоматизація](/uk/automation)
- [TaskFlow](/uk/automation/taskflow)
