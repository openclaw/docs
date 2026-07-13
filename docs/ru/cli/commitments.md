---
read_when:
    - Вы хотите проверить предполагаемые последующие обязательства
    - Вы хотите отклонить ожидающие отметки о состоянии
    - Вы проверяете, что может доставлять Heartbeat
summary: Справочник CLI для `openclaw commitments` (просмотр и отклонение выявленных последующих действий)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-13T19:36:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

Просмотр и управление автоматически определёнными обязательствами по последующим действиям.

Обязательства — это включаемые явно (`commitments.enabled`) краткосрочные воспоминания о последующих действиях,
создаваемые из контекста разговора и доставляемые через Heartbeat. Концептуальное описание и конфигурацию см. в разделе
[Автоматически определённые обязательства](/ru/concepts/commitments).

Если подкоманда не указана, `openclaw commitments` выводит список ожидающих обязательств.

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

В текстовом формате выводятся количество обязательств, путь к хранилищу, все активные фильтры
и по одной строке для каждого обязательства:

- идентификатор обязательства
- статус
- тип (`event_check_in`, `deadline_check`, `care_check_in` или `open_loop`)
- самый ранний срок выполнения
- область действия (агент/канал/получатель)
- предлагаемый текст уточняющего сообщения

Вывод JSON содержит количество, активные фильтры статуса и агента, путь к
хранилищу обязательств и полные сохранённые записи.

## См. также

- [Автоматически определённые обязательства](/ru/concepts/commitments)
- [Обзор памяти](/ru/concepts/memory)
- [Heartbeat](/ru/gateway/heartbeat)
- [Запланированные задачи](/ru/automation/cron-jobs)
