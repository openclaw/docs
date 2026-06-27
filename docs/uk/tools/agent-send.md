---
read_when:
    - Ви хочете запускати виконання агентів зі скриптів або командного рядка
    - Вам потрібно програмно доставляти відповіді агента в канал чату
summary: Запускайте ходи агента з CLI та за бажанням доставляйте відповіді в канали
title: Надсилання агентом
x-i18n:
    generated_at: "2026-06-27T18:22:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
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
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Це надсилає повідомлення через Gateway і виводить відповідь.

  </Step>

  <Step title="Надішліть багаторядковий prompt із файлу">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Це читає чинний UTF-8 файл як тіло повідомлення агента.

  </Step>

  <Step title="Спрямуйте на конкретного агента або сесію">
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
| `--message \<text\>`          | Вбудоване повідомлення для надсилання                      |
| `--message-file \<path\>`     | Прочитати повідомлення з чинного UTF-8 файлу               |
| `--to \<dest\>`               | Вивести ключ сесії з цілі (телефон, id чату)               |
| `--session-key \<key\>`       | Використати явний ключ сесії                               |
| `--agent \<id\>`              | Спрямувати на налаштованого агента (використовує його сесію `main`) |
| `--session-id \<id\>`         | Повторно використати наявну сесію за id                    |
| `--local`                     | Примусово використати локальний вбудований runtime (пропустити Gateway) |
| `--deliver`                   | Надіслати відповідь у канал чату                           |
| `--channel \<name\>`          | Канал доставки (whatsapp, telegram, discord, slack тощо)   |
| `--reply-to \<target\>`       | Перевизначення цілі доставки                               |
| `--reply-channel \<name\>`    | Перевизначення каналу доставки                             |
| `--reply-account \<id\>`      | Перевизначення id облікового запису доставки               |
| `--thinking \<level\>`        | Установити рівень міркування для вибраного профілю моделі  |
| `--verbose \<on\|full\|off\>` | Установити рівень докладності                              |
| `--timeout \<seconds\>`       | Перевизначити timeout агента                               |
| `--json`                      | Вивести структурований JSON                                |

## Поведінка

- За замовчуванням CLI проходить **через Gateway**. Додайте `--local`, щоб примусово використати
  вбудований runtime на поточній машині.
- Передайте рівно один із `--message` або `--message-file`. Файлові повідомлення зберігають
  багаторядковий вміст після видалення необов’язкового UTF-8 BOM.
- Якщо Gateway недоступний, CLI **повертається** до локального вбудованого запуску.
- Вибір сесії: `--to` виводить ключ сесії (цілі груп/каналів
  зберігають ізоляцію; прямі чати згортаються до `main`).
- `--session-key` вибирає явний ключ. Ключі з префіксом агента мають використовувати
  `agent:<agent-id>:<session-key>`, а `--agent` має збігатися з цим agent id, коли
  вказано обидва. Голі ключі без sentinel прив’язуються до `--agent`, коли
  його вказано; наприклад, `--agent ops --session-key incident-42` маршрутизується до
  `agent:ops:incident-42`. Без `--agent` голі ключі без sentinel прив’язуються
  до налаштованого агента за замовчуванням. Літеральні `global` і `unknown` залишаються
  без прив’язки лише коли `--agent` не вказано; у такому разі вбудований fallback
  і власність сховища використовують налаштованого агента за замовчуванням.
- Прапорці thinking і verbose зберігаються в store сесії.
- Вивід: звичайний текст за замовчуванням або `--json` для структурованого payload + metadata.
- З `--json --deliver` JSON містить статус доставки для надісланих,
  придушених, часткових і невдалих надсилань. Див.
  [статус доставки JSON](/uk/cli/agent#json-delivery-status).

## Приклади

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

## Пов’язане

<CardGroup cols={2}>
  <Card title="Довідник CLI агента" href="/uk/cli/agent" icon="terminal">
    Повний довідник прапорців і параметрів `openclaw agent`.
  </Card>
  <Card title="Субагенти" href="/uk/tools/subagents" icon="users">
    Фонове створення субагентів.
  </Card>
  <Card title="Сесії" href="/uk/concepts/session" icon="comments">
    Як працюють ключі сесій і як `--to`, `--agent` та `--session-id` їх розв’язують.
  </Card>
  <Card title="Slash-команди" href="/uk/tools/slash-commands" icon="slash">
    Власний каталог команд, що використовується всередині сесій агента.
  </Card>
</CardGroup>
