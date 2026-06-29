---
read_when:
    - Вы хотите инициировать запуски агента из скриптов или командной строки
    - Вам нужно программно доставлять ответы агента в канал чата
summary: Запускайте ходы агента из CLI и при необходимости доставляйте ответы в каналы
title: Отправка агентом
x-i18n:
    generated_at: "2026-06-28T23:49:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` запускает один ход агента из командной строки без необходимости
во входящем сообщении чата. Используйте его для скриптовых рабочих процессов, тестирования и
программной доставки.

## Быстрый старт

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Это отправляет сообщение через Gateway и выводит ответ.

  </Step>

  <Step title="Send a multiline prompt from a file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Это считывает допустимый файл UTF-8 как тело сообщения агента.

  </Step>

  <Step title="Target a specific agent or session">
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

  <Step title="Deliver the reply to a channel">
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

| Флаг                          | Описание                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Встроенное сообщение для отправки                           |
| `--message-file \<path\>`     | Считать сообщение из допустимого файла UTF-8                |
| `--to \<dest\>`               | Вывести ключ сеанса из целевого адресата (телефон, id чата) |
| `--session-key \<key\>`       | Использовать явный ключ сеанса                              |
| `--agent \<id\>`              | Направить в настроенного агента (использует его сеанс `main`) |
| `--session-id \<id\>`         | Повторно использовать существующий сеанс по id              |
| `--local`                     | Принудительно использовать локальную встроенную среду выполнения (без Gateway) |
| `--deliver`                   | Отправить ответ в канал чата                                |
| `--channel \<name\>`          | Канал доставки (whatsapp, telegram, discord, slack и т. д.) |
| `--reply-to \<target\>`       | Переопределение цели доставки                               |
| `--reply-channel \<name\>`    | Переопределение канала доставки                             |
| `--reply-account \<id\>`      | Переопределение id учетной записи доставки                  |
| `--thinking \<level\>`        | Задать уровень thinking для выбранного профиля модели       |
| `--verbose \<on\|full\|off\>` | Задать уровень подробности                                  |
| `--timeout \<seconds\>`       | Переопределить тайм-аут агента                              |
| `--json`                      | Вывести структурированный JSON                              |

## Поведение

- По умолчанию CLI работает **через Gateway**. Добавьте `--local`, чтобы принудительно использовать
  встроенную среду выполнения на текущей машине.
- Передайте ровно один из параметров: `--message` или `--message-file`. Сообщения из файла сохраняют
  многострочное содержимое после удаления необязательной UTF-8 BOM.
- Если Gateway недоступен, CLI **возвращается** к локальному встроенному запуску.
- Выбор сеанса: `--to` выводит ключ сеанса (целевые группы/каналы
  сохраняют изоляцию; прямые чаты сворачиваются в `main`).
- `--session-key` выбирает явный ключ. Ключи с префиксом агента должны использовать
  `agent:<agent-id>:<session-key>`, а `--agent` должен совпадать с этим id агента, когда
  указаны оба параметра. Простые ключи без sentinel ограничиваются областью `--agent`, когда
  он указан; например, `--agent ops --session-key incident-42` направляет в
  `agent:ops:incident-42`. Без `--agent` простые ключи без sentinel ограничиваются областью
  настроенного агента по умолчанию. Литералы `global` и `unknown` остаются
  без области только когда `--agent` не указан; в этом случае встроенный fallback
  и владение хранилищем используют настроенного агента по умолчанию.
- Флаги thinking и verbose сохраняются в хранилище сеанса.
- Вывод: по умолчанию простой текст или `--json` для структурированной полезной нагрузки и метаданных.
- С `--json --deliver` JSON включает статус доставки для отправленных,
  подавленных, частичных и неудачных отправок. См.
  [статус доставки JSON](/ru/cli/agent#json-delivery-status).

## Примеры

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

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
  <Card title="Agent CLI reference" href="/ru/cli/agent" icon="terminal">
    Полный справочник флагов и параметров `openclaw agent`.
  </Card>
  <Card title="Sub-agents" href="/ru/tools/subagents" icon="users">
    Фоновый запуск субагентов.
  </Card>
  <Card title="Sessions" href="/ru/concepts/session" icon="comments">
    Как работают ключи сеансов и как `--to`, `--agent` и `--session-id` разрешают их.
  </Card>
  <Card title="Slash commands" href="/ru/tools/slash-commands" icon="slash">
    Собственный каталог команд, используемый внутри сеансов агента.
  </Card>
</CardGroup>
