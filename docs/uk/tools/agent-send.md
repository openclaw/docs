---
read_when:
    - Ви хочете запускати виконання агента зі скриптів або командного рядка
    - Вам потрібно програмно доставляти відповіді агента до каналу чату
summary: Запускайте сеанси агента з CLI та за потреби надсилайте відповіді в канали
title: Надсилання агентом
x-i18n:
    generated_at: "2026-07-12T13:51:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` запускає один хід агента з командного рядка без вхідного повідомлення чату. Використовуйте цю команду для сценарних робочих процесів, тестування та програмної доставки. Повний довідник прапорців і поведінки:
[Довідник CLI агента](/uk/cli/agent).

## Швидкий початок

<Steps>
  <Step title="Запустіть простий хід агента">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Надсилає повідомлення через Gateway і виводить відповідь.

  </Step>

  <Step title="Надішліть багаторядковий запит із файлу">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Зчитує коректний файл UTF-8 як тіло повідомлення агента.

  </Step>

  <Step title="Укажіть конкретного агента або сеанс">
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

| Прапорець                   | Опис                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | Вбудоване повідомлення для надсилання                                |
| `--message-file <path>`     | Зчитати повідомлення з коректного файлу UTF-8                        |
| `--to <dest>`               | Сформувати ключ сеансу з цілі (телефон, ідентифікатор чату)          |
| `--session-key <key>`       | Використати явний ключ сеансу                                        |
| `--agent <id>`              | Націлитися на налаштованого агента (використовує його сеанс `main`)  |
| `--session-id <id>`         | Повторно використати наявний сеанс за ідентифікатором                |
| `--model <id>`              | Перевизначити модель для цього запуску (`provider/model` або ідентифікатор моделі) |
| `--local`                   | Примусово використати локальне вбудоване середовище виконання (оминаючи Gateway) |
| `--deliver`                 | Надіслати відповідь у канал чату                                     |
| `--channel <name>`          | Канал доставки; з `--agent` + `--to` також застосовується до області особистих повідомлень |
| `--reply-to <target>`       | Перевизначити ціль доставки                                          |
| `--reply-channel <name>`    | Перевизначити канал доставки                                         |
| `--reply-account <id>`      | Перевизначити ідентифікатор облікового запису доставки               |
| `--thinking <level>`        | Установити рівень міркування для вибраного профілю моделі            |
| `--verbose <on\|full\|off>` | Зберегти рівень докладності для сеансу (`full` також записує в журнал вивід інструментів) |
| `--timeout <seconds>`       | Перевизначити час очікування агента (типово 600 або значення конфігурації) |
| `--json`                    | Вивести структурований JSON                                          |

## Поведінка

- Типово CLI працює **через Gateway**. Додайте `--local`, щоб примусово використати
  вбудоване середовище виконання на поточному комп’ютері.
- Передайте рівно один із параметрів: `--message` або `--message-file`. Повідомлення
  з файлів зберігають багаторядковий вміст після видалення необов’язкової позначки BOM UTF-8.
- Якщо запит до Gateway завершується помилкою, CLI **переходить** до локального
  вбудованого запуску; у разі завершення часу очікування Gateway перехід виконується
  з новим сеансом, щоб уникнути конкуренції з початковою історією.
- Вибір сеансу: `--to` формує ключ сеансу (цілі груп і каналів
  зберігають ізоляцію; особисті чати зводяться до `main`). Якщо разом указано
  `--agent`, `--channel` і `--to`, маршрутизація використовує канонічного
  одержувача каналу та `session.dmScope`. Стабільні ідентичності лише для вихідних
  повідомлень використовують належний провайдеру сеанс, ізольований від основного сеансу агента.
- `--session-key` вибирає явний ключ. Ключі з префіксом агента мають використовувати
  формат `agent:<agent-id>:<session-key>`, а якщо також указано `--agent`, його
  ідентифікатор має збігатися з ідентифікатором агента. Прості ключі, що не є
  маркерами, прив’язуються до `--agent`, якщо його вказано; наприклад,
  `--agent ops --session-key incident-42` спрямовує до `agent:ops:incident-42`.
  Без `--agent` прості ключі, що не є маркерами, прив’язуються до налаштованого
  агента за замовчуванням. Літерали `global` і `unknown` залишаються без області
  лише за відсутності `--agent`; вбудований резервний шлях зіставляє ці
  маркерні сеанси з налаштованим агентом за замовчуванням.
- `--reply-channel` і `--reply-account` впливають лише на доставку.
- Прапорці міркування та докладності зберігаються в сховищі сеансу.
- Вивід: типово звичайний текст або `--json` для структурованого корисного навантаження й метаданих.
- З `--json --deliver` JSON містить стан доставки для надісланих,
  придушених, частково й невдало надісланих повідомлень. Див.
  [Стан доставки JSON](/uk/cli/agent#json-delivery-status).

## Приклади

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

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Довідник CLI агента" href="/uk/cli/agent" icon="terminal">
    Повний довідник прапорців і параметрів `openclaw agent`.
  </Card>
  <Card title="Субагенти" href="/uk/tools/subagents" icon="users">
    Запуск субагентів у фоновому режимі.
  </Card>
  <Card title="Сеанси" href="/uk/concepts/session" icon="comments">
    Як працюють ключі сеансів і як `--to`, `--agent` та `--session-id` їх визначають.
  </Card>
  <Card title="Команди зі скісною рискою" href="/uk/tools/slash-commands" icon="slash">
    Каталог вбудованих команд, що використовуються в сеансах агента.
  </Card>
</CardGroup>
