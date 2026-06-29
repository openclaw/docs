---
read_when:
    - Вы хотите просматривать, проверять или отменять записи фоновых задач
    - Вы документируете команды TaskFlow в разделе `openclaw tasks flow`
summary: Справочник CLI для `openclaw tasks` (реестр фоновых задач и состояние потока задач)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-06-28T22:46:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
---

Проверяйте устойчивые фоновые задачи и состояние Task Flow. Без подкоманды
`openclaw tasks` эквивалентна `openclaw tasks list`.

См. [Фоновые задачи](/ru/automation/tasks), чтобы узнать о жизненном цикле и модели доставки.

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

- `--json`: вывод JSON.
- `--runtime <name>`: фильтр по виду: `subagent`, `acp`, `cron` или `cli`.
- `--status <name>`: фильтр по статусу: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` или `lost`.

## Подкоманды

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Перечисляет отслеживаемые фоновые задачи, начиная с самых новых.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Показывает одну задачу по ID задачи, ID запуска или ключу сессии.

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

Выявляет устаревшие, потерянные, не доставленные или иным образом несогласованные записи задач и Task Flow. Потерянные задачи, сохраняемые до `cleanupAfter`, считаются предупреждениями; истекшие или потерянные задачи без метки считаются ошибками.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Предварительно просматривает или применяет согласование задач и Task Flow, проставление меток очистки, удаление старых записей
и очистку реестра сессий устаревших запусков cron.
Для задач cron согласование использует сохраненные журналы запусков/состояние задания перед тем, как пометить
старую активную задачу как `lost`, поэтому завершенные запуски cron не превращаются в ложные ошибки аудита
только из-за того, что состояние in-memory рантайма Gateway исчезло. Офлайн-аудит CLI
не является авторитетным источником для process-local набора активных cron-заданий Gateway. Задачи CLI
с ID запуска/ID источника помечаются как `lost`, когда их live-контекст запуска Gateway
исчез, даже если старая строка дочерней сессии остается.
При применении обслуживание также удаляет из реестра сессий строки `cron:<jobId>:run:<uuid>`,
которые старше 7 дней, сохраняя текущие выполняющиеся cron-задания и оставляя
строки не-cron сессий без изменений.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Проверяет или отменяет устойчивое состояние Task Flow в журнале задач.

## См. также

- [Справочник CLI](/ru/cli)
- [Фоновые задачи](/ru/automation/tasks)
