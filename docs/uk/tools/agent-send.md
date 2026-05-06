---
read_when:
    - Ви хочете запускати виконання агента зі скриптів або з командного рядка
    - Вам потрібно програмно надсилати відповіді агента до каналу чату
summary: Запускайте ходи агента з CLI та за бажанням доставляйте відповіді до каналів
title: Надсилання агентом
x-i18n:
    generated_at: "2026-05-06T01:19:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` запускає один хід агента з командного рядка без потреби у
вхідному повідомленні чату. Використовуйте його для скриптових робочих процесів, тестування та
програмної доставки.

## Швидкий старт

<Steps>
  <Step title="Запустіть простий хід агента">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Це надсилає повідомлення через Gateway і виводить відповідь.

  </Step>

  <Step title="Спрямуйте на конкретного агента або сеанс">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Доставте відповідь у канал">
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
| `--to \<dest\>`               | Вивести ключ сеансу з цілі (телефон, id чату)               |
| `--agent \<id\>`              | Спрямувати на налаштованого агента (використовує його сеанс `main`) |
| `--session-id \<id\>`         | Повторно використати наявний сеанс за id                    |
| `--local`                     | Примусово використати локальний вбудований runtime (оминає Gateway) |
| `--deliver`                   | Надіслати відповідь у канал чату                            |
| `--channel \<name\>`          | Канал доставки (whatsapp, telegram, discord, slack тощо)    |
| `--reply-to \<target\>`       | Перевизначення цілі доставки                                |
| `--reply-channel \<name\>`    | Перевизначення каналу доставки                              |
| `--reply-account \<id\>`      | Перевизначення id облікового запису доставки                |
| `--thinking \<level\>`        | Установити рівень мислення для вибраного профілю моделі     |
| `--verbose \<on\|full\|off\>` | Установити рівень докладності                               |
| `--timeout \<seconds\>`       | Перевизначити тайм-аут агента                               |
| `--json`                      | Вивести структурований JSON                                 |

## Поведінка

- За замовчуванням CLI працює **через Gateway**. Додайте `--local`, щоб примусово
  використати вбудований runtime на поточній машині.
- Якщо Gateway недоступний, CLI **повертається** до локального вбудованого запуску.
- Вибір сеансу: `--to` виводить ключ сеансу (цілі груп/каналів
  зберігають ізоляцію; прямі чати згортаються до `main`).
- Прапорці thinking і verbose зберігаються в сховищі сеансів.
- Вивід: за замовчуванням звичайний текст або `--json` для структурованого payload + metadata.

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
  <Card title="Довідник Agent CLI" href="/uk/cli/agent" icon="terminal">
    Повний довідник прапорців і параметрів `openclaw agent`.
  </Card>
  <Card title="Підагенти" href="/uk/tools/subagents" icon="users">
    Фонове створення підагентів.
  </Card>
  <Card title="Сеанси" href="/uk/concepts/session" icon="comments">
    Як працюють ключі сеансів і як `--to`, `--agent` та `--session-id` їх визначають.
  </Card>
  <Card title="Slash-команди" href="/uk/tools/slash-commands" icon="slash">
    Власний каталог команд, що використовується всередині сеансів агентів.
  </Card>
</CardGroup>
