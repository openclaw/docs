---
read_when:
    - Ви зустрічаєте `openclaw flows` у старішій документації або примітках до випуску
    - Вам потрібна коротка довідка з перевірки TaskFlow
summary: 'Перенаправлення: команди потоку розміщено в `openclaw tasks flow`'
title: Потоки (переспрямування)
x-i18n:
    generated_at: "2026-07-12T13:05:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Команди верхнього рівня `openclaw flows` не існує. Перегляд довготривалих TaskFlow доступний у `openclaw tasks flow`.

## Підкоманди

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Підкоманда | Опис                         | Аргументи / параметри                                                                       |
| ---------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| `list`     | Вивести відстежувані TaskFlow. | `--json` — машинозчитуваний формат виводу; `--status <name>` — фільтр (див. значення станів нижче). |
| `show`     | Показати один TaskFlow.        | `<lookup>` — ідентифікатор потоку або ключ власника; `--json` — машинозчитуваний формат виводу. |
| `cancel`   | Скасувати запущений TaskFlow.  | `<lookup>` — ідентифікатор потоку або ключ власника.                                         |

`<lookup>` приймає або ідентифікатор потоку (який повертають `list` / `show`), або ключ власника потоку (стабільний ідентифікатор, за допомогою якого підсистема-власник відстежує потік).

### Значення фільтра стану

Параметр `--status` для `list` приймає одне з таких значень: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Приклади

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Концепції TaskFlow та створення описано в розділі [TaskFlow](/uk/automation/taskflow). Відомості про батьківську команду `tasks` див. у [довіднику CLI для `tasks`](/uk/cli/tasks).

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Автоматизація](/uk/automation)
- [TaskFlow](/uk/automation/taskflow)
