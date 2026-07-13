---
read_when:
    - Вы хотите просмотреть, проверить или отменить записи фоновых задач
    - Вы документируете команды Task Flow в разделе `openclaw tasks flow`
summary: Справочник CLI для `openclaw tasks` (журнал фоновых задач и состояние Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-13T19:40:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Проверяйте долговременные фоновые задачи и состояние Task Flow. Если подкоманда не указана,
`openclaw tasks` эквивалентна `openclaw tasks list`.

Описание жизненного цикла и модели доставки см. в разделе [Фоновые задачи](/ru/automation/tasks),
а полные описания обнаруживаемых проблем — в его разделе `tasks audit`.

## Использование

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

## Корневые параметры

| Флаг               | Описание                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Выводить данные в формате JSON.                                                                                       |
| `--runtime <name>` | Фильтровать по типу: `subagent`, `acp`, `cron` или `cli`.                                               |
| `--status <name>`  | Фильтровать по состоянию: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` или `lost`. |

## Подкоманды

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Выводит отслеживаемые фоновые задачи, начиная с самых новых.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Показывает одну задачу по идентификатору задачи, идентификатору запуска или ключу сеанса.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Изменяет политику уведомлений для выполняющейся задачи.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Отменяет выполняющуюся фоновую задачу.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Выявляет устаревшие, потерянные, не доставленные или иным образом несогласованные записи
задач и Task Flow. Потерянные задачи, сохраняемые до `cleanupAfter`, считаются предупреждениями;
потерянные задачи с истёкшим сроком или без временной отметки считаются ошибками.

`--code` принимает коды задач (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) и коды Task
Flow (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). Сведения
о степени серьёзности и условиях срабатывания для каждого кода см. в разделе
[Фоновые задачи](/ru/automation/tasks).

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Предварительно показывает или применяет согласование задач и Task Flow, проставление
отметок очистки, удаление устаревших данных и очистку реестра сеансов устаревших запусков Cron.

Для задач Cron при согласовании используются сохранённые журналы запусков и состояние заданий,
прежде чем старая активная задача будет помечена как `lost`, поэтому завершённые запуски Cron
не становятся ложными ошибками аудита только из-за отсутствия состояния среды выполнения Gateway
в памяти. Автономный аудит через CLI не является достоверным источником данных о локальном для процесса Gateway
наборе активных заданий Cron. Задачи CLI с идентификатором запуска или идентификатором источника помечаются как
`lost`, когда их активный контекст запуска Gateway исчезает, даже если старая запись дочернего сеанса
сохраняется.

При применении обслуживание также удаляет строки реестра сеансов `cron:<jobId>:run:<uuid>`
старше 7 дней, сохраняя выполняющиеся в данный момент задания Cron
и не изменяя строки сеансов, не относящиеся к Cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Проверяет или отменяет долговременное состояние Task Flow в журнале задач.
`flow list --status` принимает `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` или `lost`.

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Фоновые задачи](/ru/automation/tasks)
