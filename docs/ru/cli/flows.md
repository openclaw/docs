---
read_when:
    - Вы встречаете `openclaw flows` в старой документации или примечаниях к выпуску
    - Вам нужна краткая справка по проверке TaskFlow
summary: 'Перенаправление: команды потока находятся в `openclaw tasks flow`'
title: Потоки (перенаправление)
x-i18n:
    generated_at: "2026-07-13T18:01:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Команды верхнего уровня `openclaw flows` не существует. Средства проверки долговременных TaskFlow находятся в `openclaw tasks flow`.

## Подкоманды

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Подкоманда | Описание                       | Аргументы / параметры                                                                    |
| ---------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `list`     | Вывести отслеживаемые TaskFlow. | `--json` машиночитаемый вывод; фильтр `--status <name>` (см. значения статуса ниже). |
| `show`     | Показать один TaskFlow.          | `<lookup>` идентификатор потока или ключ владельца; `--json` машиночитаемый вывод. |
| `cancel`   | Отменить выполняющийся TaskFlow. | `<lookup>` идентификатор потока или ключ владельца.                                  |

`<lookup>` принимает либо идентификатор потока (возвращаемый `list` / `show`), либо ключ владельца потока (стабильный идентификатор, используемый подсистемой-владельцем для отслеживания потока).

### Значения фильтра статуса

`--status` в `list` принимает одно из следующих значений: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Примеры

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Описание концепций TaskFlow и создания потоков см. в разделе [TaskFlow](/ru/automation/taskflow). О родительской команде `tasks` см. в [справочнике по CLI tasks](/ru/cli/tasks).

## Связанные материалы

- [Справочник по CLI](/ru/cli)
- [Автоматизация](/ru/automation)
- [TaskFlow](/ru/automation/taskflow)
