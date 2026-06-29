---
read_when:
    - Вы хотите проверить предполагаемые последующие обязательства
    - Вы хотите отклонить ожидающие отметки
    - Вы проверяете, что может доставлять Heartbeat
summary: Справочник CLI для `openclaw commitments` (проверка и отклонение предполагаемых последующих действий)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-06-28T22:42:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Список и управление выведенными последующими обязательствами.

Обязательства — это включаемые явно, краткоживущие последующие воспоминания, создаваемые из
контекста разговора. См. [Выведенные обязательства](/ru/concepts/commitments) для
концептуального руководства.

Без подкоманды `openclaw commitments` выводит список ожидающих обязательств.

## Использование

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Параметры

- `--all`: показать все статусы, а не только ожидающие обязательства.
- `--agent <id>`: отфильтровать по одному идентификатору агента.
- `--status <status>`: отфильтровать по статусу. Значения: `pending`, `sent`,
  `dismissed`, `snoozed` или `expired`.
- `--json`: вывести машиночитаемый JSON.

## Примеры

Вывести ожидающие обязательства:

```bash
openclaw commitments
```

Вывести все сохраненные обязательства:

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

Экспортировать как JSON:

```bash
openclaw commitments --all --json
```

## Вывод

Текстовый вывод включает:

- идентификатор обязательства
- статус
- тип
- самое раннее время наступления срока
- область действия
- предлагаемый текст проверки состояния

Вывод JSON также включает путь к хранилищу обязательств и полные сохраненные записи.

## Связанные материалы

- [Выведенные обязательства](/ru/concepts/commitments)
- [Обзор памяти](/ru/concepts/memory)
- [Heartbeat](/ru/gateway/heartbeat)
- [Запланированные задачи](/ru/automation/cron-jobs)
