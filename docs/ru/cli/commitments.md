---
read_when:
    - Вы хотите проверить предполагаемые последующие обязательства
    - Вы хотите отменить ожидающие регистрации состояния
    - Вы проверяете, что может доставлять Heartbeat
summary: Справочник CLI для `openclaw commitments` (просмотр и отклонение предполагаемых последующих действий)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T16:41:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Просмотр и управление выведенными обязательствами по последующим действиям.

Обязательства включаются явно (`commitments.enabled`) и представляют собой кратковременные воспоминания о последующих действиях,
созданные на основе контекста разговора и доставляемые через Heartbeat. Концептуальное руководство и конфигурацию см. в разделе
[Выведенные обязательства](/ru/concepts/commitments).

Без подкоманды `openclaw commitments` выводит список ожидающих обязательств.

## Использование

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Параметры

- `--all`: показывать все статусы, а не только ожидающие обязательства.
- `--agent <id>`: отфильтровать по идентификатору одного агента.
- `--status <status>`: отфильтровать по статусу. Значения: `pending`, `sent`,
  `dismissed`, `snoozed` или `expired`. При неизвестном значении команда завершается с ошибкой.
- `--json`: вывести машиночитаемый JSON.

`dismiss` помечает обязательства с указанными идентификаторами как `dismissed`, чтобы Heartbeat
не доставлял их.

## Примеры

Вывести ожидающие обязательства:

```bash
openclaw commitments
```

Вывести все сохранённые обязательства:

```bash
openclaw commitments --all
```

Отфильтровать по одному агенту:

```bash
openclaw commitments --agent main
```

Найти отложенные обязательства:

```bash
openclaw commitments --status snoozed
```

Отклонить одно или несколько обязательств:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Экспортировать в формате JSON:

```bash
openclaw commitments --all --json
```

## Вывод

Текстовый вывод содержит количество обязательств, путь к общей базе данных SQLite, все активные фильтры
и по одной строке для каждого обязательства:

- идентификатор обязательства
- статус
- тип (`event_check_in`, `deadline_check`, `care_check_in` или `open_loop`)
- самое раннее время выполнения
- область действия (агент/канал/получатель)
- предлагаемый текст уточнения

Вывод JSON содержит количество, активные фильтры статуса и агента, путь к
общей базе данных SQLite и полные сохранённые записи.

## Связанные разделы

- [Выведенные обязательства](/ru/concepts/commitments)
- [Обзор памяти](/ru/concepts/memory)
- [Heartbeat](/ru/gateway/heartbeat)
- [Запланированные задачи](/ru/automation/cron-jobs)
