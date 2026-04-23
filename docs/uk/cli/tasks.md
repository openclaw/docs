---
read_when:
    - Ви хочете переглянути, перевірити або скасувати записи фонових завдань
    - Ви документуєте команди TaskFlow у розділі `openclaw tasks flow`
summary: Довідка CLI для `openclaw tasks` (реєстр фонових завдань і стан TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-23T06:19:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 549e07c8a576cb4c5bd48874f16b0daa4a34facb53b102e12d358bdad2191628
    source_path: cli/tasks.md
    workflow: 15
---

# `openclaw tasks`

Переглядайте довготривалі фонові завдання й стан TaskFlow. Без підкоманди
`openclaw tasks` еквівалентна `openclaw tasks list`.

Див. [Фонові завдання](/uk/automation/tasks) для життєвого циклу та моделі доставки.

## Використання

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Кореневі параметри

- `--json`: виводити JSON.
- `--runtime <name>`: фільтрувати за типом: `subagent`, `acp`, `cron` або `cli`.
- `--status <name>`: фільтрувати за статусом: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` або `lost`.

## Підкоманди

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Показує відстежувані фонові завдання, починаючи з найновіших.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Показує одне завдання за ID завдання, ID запуску або ключем сеансу.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Змінює політику сповіщень для фонового завдання, що виконується.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Скасовує фонове завдання, що виконується.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Виявляє застарілі, втрачені, з невдалою доставкою або іншим чином неузгоджені записи завдань і TaskFlow.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Попередньо переглядає або застосовує звіряння завдань і TaskFlow, позначення очищення та обрізання.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Переглядає або скасовує довготривалий стан TaskFlow у реєстрі завдань.
