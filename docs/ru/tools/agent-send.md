---
read_when:
    - Вы хотите запускать выполнение агента из скриптов или командной строки
    - Вам нужно программно доставлять ответы агента в канал чата
summary: Запускайте циклы агента из CLI и при необходимости доставляйте ответы в каналы
title: Отправка агента
x-i18n:
    generated_at: "2026-07-12T11:55:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` запускает один ход агента из командной строки без входящего сообщения чата. Используйте эту команду для сценарных рабочих процессов, тестирования и программной доставки. Полное описание флагов и поведения:
[Справочник по CLI агента](/ru/cli/agent).

## Быстрый старт

<Steps>
  <Step title="Запуск простого хода агента">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Отправляет сообщение через Gateway и выводит ответ.

  </Step>

  <Step title="Отправка многострочного запроса из файла">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Читает корректный файл UTF-8 как тело сообщения агента.

  </Step>

  <Step title="Выбор конкретного агента или сеанса">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="Доставка ответа в канал">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Флаги

| Флаг                        | Описание                                                                    |
| --------------------------- | --------------------------------------------------------------------------- |
| `--message <text>`          | Встроенное сообщение для отправки                                           |
| `--message-file <path>`     | Чтение сообщения из корректного файла UTF-8                                 |
| `--to <dest>`               | Формирование ключа сеанса из получателя (телефон, идентификатор чата)        |
| `--session-key <key>`       | Использование явно заданного ключа сеанса                                   |
| `--agent <id>`              | Выбор настроенного агента (используется его сеанс `main`)                    |
| `--session-id <id>`         | Повторное использование существующего сеанса по идентификатору               |
| `--model <id>`              | Переопределение модели для этого запуска (`provider/model` или идентификатор модели) |
| `--local`                   | Принудительное использование локальной встроенной среды выполнения (без Gateway) |
| `--deliver`                 | Отправка ответа в канал чата                                                 |
| `--channel <name>`          | Канал доставки; с `--agent` + `--to` также применяется к области личных сообщений |
| `--reply-to <target>`       | Переопределение получателя доставки                                         |
| `--reply-channel <name>`    | Переопределение канала доставки                                             |
| `--reply-account <id>`      | Переопределение идентификатора учётной записи доставки                      |
| `--thinking <level>`        | Установка уровня рассуждений для выбранного профиля модели                   |
| `--verbose <on\|full\|off>` | Сохранение уровня подробности для сеанса (`full` также журналирует вывод инструментов) |
| `--timeout <seconds>`       | Переопределение тайм-аута агента (по умолчанию 600 или значение конфигурации) |
| `--json`                    | Вывод структурированного JSON                                               |

## Поведение

- По умолчанию CLI работает **через Gateway**. Добавьте `--local`, чтобы принудительно использовать встроенную среду выполнения на текущем компьютере.
- Передайте ровно один из параметров: `--message` или `--message-file`. Сообщения из файлов сохраняют многострочное содержимое после удаления необязательной метки BOM UTF-8.
- Если запрос к Gateway завершается с ошибкой, CLI **переключается** на локальный встроенный запуск; при тайм-ауте Gateway переключение выполняется с новым сеансом, чтобы избежать конкуренции с исходной расшифровкой диалога.
- Выбор сеанса: `--to` формирует ключ сеанса (цели групп и каналов сохраняют изоляцию, а личные чаты сводятся к `main`). При совместном использовании `--agent`, `--channel` и `--to` маршрутизация следует каноническому получателю канала и `session.dmScope`. Стабильные идентификаторы, используемые только для исходящих сообщений, применяют принадлежащий провайдеру сеанс, изолированный от основного сеанса агента.
- `--session-key` выбирает явно заданный ключ. Ключи с префиксом агента должны иметь вид `agent:<agent-id>:<session-key>`, а при одновременной передаче `--agent` его идентификатор должен совпадать с идентификатором агента в ключе. Простые ключи, не являющиеся маркерами, при наличии `--agent` привязываются к этому агенту; например, `--agent ops --session-key incident-42` направляет запрос в `agent:ops:incident-42`. Без `--agent` простые ключи, не являющиеся маркерами, привязываются к настроенному агенту по умолчанию. Литеральные значения `global` и `unknown` остаются без области действия только при отсутствии `--agent`; встроенный резервный путь сопоставляет эти сеансы-маркеры с настроенным агентом по умолчанию.
- `--reply-channel` и `--reply-account` влияют только на доставку.
- Флаги уровня рассуждений и подробности сохраняются в хранилище сеансов.
- Вывод: по умолчанию обычный текст или структурированные данные и метаданные при использовании `--json`.
- При использовании `--json --deliver` JSON содержит состояние доставки для отправленных, подавленных, частично и неуспешно отправленных сообщений. См.
  [Состояние доставки JSON](/ru/cli/agent#json-delivery-status).

## Примеры

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Справочник по CLI агента" href="/ru/cli/agent" icon="terminal">
    Полный справочник по флагам и параметрам `openclaw agent`.
  </Card>
  <Card title="Субагенты" href="/ru/tools/subagents" icon="users">
    Фоновый запуск субагентов.
  </Card>
  <Card title="Сеансы" href="/ru/concepts/session" icon="comments">
    Принцип работы ключей сеансов и порядок их определения параметрами `--to`, `--agent` и `--session-id`.
  </Card>
  <Card title="Команды с косой чертой" href="/ru/tools/slash-commands" icon="slash">
    Встроенный каталог команд, используемых в сеансах агента.
  </Card>
</CardGroup>
