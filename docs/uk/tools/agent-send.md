---
read_when:
    - Ви хочете запускати agent run-и зі скриптів або командного рядка
    - Вам потрібно програмно доставляти відповіді агента в chat channel
summary: Запускайте turn-и агента з CLI й за потреби доставляйте відповіді в channels
title: Надсилання агенту
x-i18n:
    generated_at: "2026-04-23T21:12:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent` запускає один turn агента з командного рядка без потреби
у вхідному повідомленні чату. Використовуйте це для scripted workflow, testing і
програмної доставки.

## Швидкий старт

<Steps>
  <Step title="Запустіть простий turn агента">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Це надсилає повідомлення через Gateway і виводить відповідь.

  </Step>

  <Step title="Націліться на конкретного агента або сесію">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Доставте відповідь у channel">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Прапорці

| Прапорець                     | Опис                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Повідомлення для надсилання (обов’язково)                   |
| `--to \<dest\>`               | Вивести ключ сесії з цілі (телефон, chat id)                |
| `--agent \<id\>`              | Націлитися на налаштованого агента (використовує його сесію `main`) |
| `--session-id \<id\>`         | Повторно використати наявну сесію за id                     |
| `--local`                     | Примусово використовувати локальний embedded runtime (обійти Gateway) |
| `--deliver`                   | Надіслати відповідь у chat channel                          |
| `--channel \<name\>`          | Channel доставки (whatsapp, telegram, discord, slack тощо)  |
| `--reply-to \<target\>`       | Перевизначення цілі доставки                                |
| `--reply-channel \<name\>`    | Перевизначення channel доставки                             |
| `--reply-account \<id\>`      | Перевизначення id облікового запису доставки                |
| `--thinking \<level\>`        | Задати рівень thinking для вибраного профілю моделі         |
| `--verbose \<on\|full\|off\>` | Задати рівень verbose                                       |
| `--timeout \<seconds\>`       | Перевизначити тайм-аут агента                               |
| `--json`                      | Вивести структурований JSON                                 |

## Поведінка

- За замовчуванням CLI працює **через Gateway**. Додайте `--local`, щоб примусово
  використовувати embedded runtime на поточній машині.
- Якщо Gateway недоступний, CLI **використовує fallback** до локального embedded run.
- Вибір сесії: `--to` виводить ключ сесії (цілі груп/channel
  зберігають ізоляцію; прямі чати згортаються до `main`).
- Прапорці thinking і verbose зберігаються в session store.
- Вивід: звичайний текст за замовчуванням або `--json` для структурованого payload + metadata.

## Приклади

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Пов’язане

- [Довідник CLI агента](/uk/cli/agent)
- [Sub-agent-и](/uk/tools/subagents) — фоновий запуск sub-agent-ів
- [Сесії](/uk/concepts/session) — як працюють ключі сесій
