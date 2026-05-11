---
read_when:
    - Ви хочете ініціювати запуски агента зі скриптів або з командного рядка
    - Потрібно програмно доставляти відповіді агента до каналу чату
summary: Запускайте ходи агента з CLI та за потреби надсилайте відповіді в канали
title: Надсилання агентом
x-i18n:
    generated_at: "2026-05-11T20:59:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` запускає один хід агента з командного рядка без потреби
у вхідному повідомленні чату. Використовуйте це для скриптованих робочих процесів, тестування та
програмної доставки.

## Швидкий старт

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Це надсилає повідомлення через Gateway і виводить відповідь.

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
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

## Прапорці

| Прапорець                     | Опис                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Повідомлення для надсилання (обов’язково)                   |
| `--to \<dest\>`               | Вивести ключ сесії з цілі (телефон, id чату)                |
| `--agent \<id\>`              | Націлитися на налаштованого агента (використовує його сесію `main`) |
| `--session-id \<id\>`         | Повторно використати наявну сесію за id                    |
| `--local`                     | Примусово використати локальне вбудоване середовище виконання (оминути Gateway) |
| `--deliver`                   | Надіслати відповідь у канал чату                            |
| `--channel \<name\>`          | Канал доставки (whatsapp, telegram, discord, slack тощо)    |
| `--reply-to \<target\>`       | Перевизначення цілі доставки                                |
| `--reply-channel \<name\>`    | Перевизначення каналу доставки                              |
| `--reply-account \<id\>`      | Перевизначення id облікового запису доставки                |
| `--thinking \<level\>`        | Установити рівень мислення для вибраного профілю моделі     |
| `--verbose \<on\|full\|off\>` | Установити рівень докладності                               |
| `--timeout \<seconds\>`       | Перевизначити час очікування агента                         |
| `--json`                      | Вивести структурований JSON                                 |

## Поведінка

- За замовчуванням CLI працює **через Gateway**. Додайте `--local`, щоб примусово використати
  вбудоване середовище виконання на поточній машині.
- Якщо Gateway недоступний, CLI **повертається** до локального вбудованого запуску.
- Вибір сесії: `--to` виводить ключ сесії (цілі груп/каналів
  зберігають ізоляцію; прямі чати згортаються до `main`).
- Прапорці мислення й докладності зберігаються в сховищі сесії.
- Виведення: за замовчуванням звичайний текст або `--json` для структурованого корисного навантаження + метаданих.
- З `--json --deliver` JSON містить статус доставки для надісланих,
  приглушених, часткових і невдалих надсилань. Див.
  [статус доставки JSON](/uk/cli/agent#json-delivery-status).

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

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/uk/cli/agent" icon="terminal">
    Повний довідник прапорців і параметрів `openclaw agent`.
  </Card>
  <Card title="Sub-agents" href="/uk/tools/subagents" icon="users">
    Запуск фонових під-агентів.
  </Card>
  <Card title="Sessions" href="/uk/concepts/session" icon="comments">
    Як працюють ключі сесій і як `--to`, `--agent` та `--session-id` їх визначають.
  </Card>
  <Card title="Slash commands" href="/uk/tools/slash-commands" icon="slash">
    Власний каталог команд, що використовується всередині сесій агентів.
  </Card>
</CardGroup>
