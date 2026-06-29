---
read_when:
    - Вы встречаете `openclaw flows` в старых документах или примечаниях к выпуску
    - Вам нужен краткий справочник для проверки TaskFlow
summary: 'Перенаправление: команды потоков находятся в `openclaw tasks flow`'
title: Потоки (перенаправление)
x-i18n:
    generated_at: "2026-06-28T22:43:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Команды верхнего уровня `openclaw flows` нет. Долговременная инспекция TaskFlow находится в `openclaw tasks flow`.

## Подкоманды

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Подкоманда | Описание                   | Аргументы / параметры                                                                                  |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `list`     | Список отслеживаемых TaskFlow. | `--json` машиночитаемый вывод; фильтр `--status <name>` (см. значения статуса ниже).                |
| `show`     | Показать один TaskFlow.    | `<lookup>` идентификатор flow или ключ владельца; `--json` машиночитаемый вывод.                     |
| `cancel`   | Отменить выполняющийся TaskFlow. | `<lookup>` идентификатор flow или ключ владельца.                                                   |

`<lookup>` принимает либо идентификатор flow (возвращается `list` / `show`), либо ключ владельца flow (стабильный идентификатор, который владеющая подсистема использует для отслеживания flow).

### Значения фильтра статуса

`--status` в `list` принимает одно из:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Примеры

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Полное описание концепций TaskFlow и руководства по созданию см. в [TaskFlow](/ru/automation/taskflow). О родительской команде `tasks` см. [справочник CLI tasks](/ru/cli/tasks).

## Связанное

- [справочник CLI](/ru/cli)
- [Автоматизация](/ru/automation)
- [TaskFlow](/ru/automation/taskflow)
