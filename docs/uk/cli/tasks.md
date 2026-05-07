---
read_when:
    - Ви хочете переглянути, перевірити або скасувати записи фонових завдань
    - Ви документуєте команди Task Flow у `openclaw tasks flow`
summary: Довідник CLI для `openclaw tasks` (журнал фонових завдань і стан TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

Переглядайте довговічні фонові завдання та стан Task Flow. Без підкоманди
`openclaw tasks` еквівалентна `openclaw tasks list`.

Див. [Фонові завдання](/uk/automation/tasks), щоб дізнатися про модель життєвого циклу та доставки.

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

- `--json`: вивести JSON.
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

Показує одне завдання за ідентифікатором завдання, ідентифікатором запуску або ключем сеансу.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Змінює політику сповіщень для виконуваного завдання.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Скасовує виконуване фонове завдання.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Виявляє застарілі, втрачені, недоставлені або інакше неузгоджені записи завдань і Task Flow. Втрачені завдання, збережені до `cleanupAfter`, є попередженнями; прострочені або втрачені завдання без позначки часу є помилками.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Попередньо показує або застосовує узгодження завдань і Task Flow, проставлення позначок очищення та видалення.
Для завдань cron узгодження використовує збережені журнали запусків/стан завдання, перш ніж позначити
старе активне завдання як `lost`, тому завершені запуски cron не стають хибними помилками аудиту
лише через те, що стан середовища виконання Gateway у пам’яті зник. Офлайн-аудит CLI
не є авторитетним для локального для процесу Gateway набору активних завдань cron. Завдання CLI
з ідентифікатором запуску/ідентифікатором джерела позначаються як `lost`, коли їхній активний контекст запуску Gateway
зник, навіть якщо старий рядок дочірнього сеансу лишається.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Переглядає або скасовує довговічний стан Task Flow у журналі завдань.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Фонові завдання](/uk/automation/tasks)
