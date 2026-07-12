---
read_when:
    - Ви хочете переглянути, перевірити або скасувати записи фонових завдань
    - Ви документуєте команди TaskFlow у розділі `openclaw tasks flow`
summary: Довідник CLI для `openclaw tasks` (реєстр фонових завдань і стан Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-12T13:10:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Перевіряйте довготривалі фонові завдання та стан Task Flow. Без підкоманди
`openclaw tasks` еквівалентна команді `openclaw tasks list`.

Опис життєвого циклу та моделі доставки див. у розділі [Фонові завдання](/uk/automation/tasks),
а повні описи виявлених проблем — у його підрозділі `tasks audit`.

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

| Прапорець          | Опис                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Вивести JSON.                                                                                      |
| `--runtime <name>` | Фільтрувати за типом: `subagent`, `acp`, `cron` або `cli`.                                         |
| `--status <name>`  | Фільтрувати за станом: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` або `lost`. |

## Підкоманди

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Виводить відстежувані фонові завдання, починаючи з найновіших.

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

Виявляє застарілі, втрачені, недоставлені або іншим чином неузгоджені записи
завдань і Task Flow. Втрачені завдання, що зберігаються до `cleanupAfter`, є попередженнями;
втрачені завдання з простроченим терміном або без часової позначки є помилками.

`--code` приймає коди завдань (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) і коди Task
Flow (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). Докладні відомості
про рівень серйозності та умови спрацювання кожного коду див. у розділі
[Фонові завдання](/uk/automation/tasks).

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Попередньо показує або застосовує узгодження завдань і Task Flow, установлення
позначок очищення, видалення застарілих записів і очищення реєстру сеансів застарілих запусків cron.

Для завдань cron узгодження використовує збережені журнали запусків і стан завдань, перш ніж
позначати старе активне завдання як `lost`, тому завершені запуски cron не перетворюються
на хибні помилки аудиту лише через відсутність стану середовища виконання Gateway у пам’яті.
Автономний аудит CLI не є авторитетним джерелом для локального в процесі Gateway набору
активних завдань cron. Завдання CLI з ідентифікатором запуску або джерела позначаються як `lost`,
коли їхній активний контекст запуску Gateway зникає, навіть якщо старий рядок дочірнього сеансу
залишається.

Після застосування обслуговування також видаляє з реєстру сеансів рядки
`cron:<jobId>:run:<uuid>`, старші за 7 днів, водночас зберігаючи поточні виконувані завдання cron
і не змінюючи рядки сеансів, що не належать до cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Перевіряє або скасовує довготривалий стан Task Flow у журналі завдань.
`flow list --status` приймає `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` або `lost`.

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Фонові завдання](/uk/automation/tasks)
