---
read_when:
    - Ви хочете запустити один хід агента зі скриптів (за потреби доставити відповідь)
summary: Довідка CLI для `openclaw agent` (надіслати один хід агента через Gateway)
title: Агент
x-i18n:
    generated_at: "2026-04-25T03:44:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 292559e27907fff3cdeb3b4127e19638934fbb4af50fc5165f9559da62a6b11b
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Запустіть хід агента через Gateway (використовуйте `--local` для вбудованого режиму).
Використовуйте `--agent <id>`, щоб напряму націлитися на налаштованого агента.

Передайте принаймні один селектор сесії:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Пов’язане:

- Інструмент надсилання агента: [Agent send](/uk/tools/agent-send)

## Параметри

- `-m, --message <text>`: обов’язковий текст повідомлення
- `-t, --to <dest>`: одержувач, який використовується для визначення ключа сесії
- `--session-id <id>`: явний ідентифікатор сесії
- `--agent <id>`: ідентифікатор агента; перевизначає прив’язки маршрутизації
- `--thinking <level>`: рівень мислення агента (`off`, `minimal`, `low`, `medium`, `high`, а також підтримувані провайдером власні рівні, як-от `xhigh`, `adaptive` або `max`)
- `--verbose <on|off>`: зберегти рівень деталізації для сесії
- `--channel <channel>`: канал доставки; не вказуйте, щоб використовувати основний канал сесії
- `--reply-to <target>`: перевизначення цілі доставки
- `--reply-channel <channel>`: перевизначення каналу доставки
- `--reply-account <id>`: перевизначення облікового запису доставки
- `--local`: запустити вбудованого агента напряму (після попереднього завантаження реєстру Plugin)
- `--deliver`: надіслати відповідь назад у вибраний канал/ціль
- `--timeout <seconds>`: перевизначити тайм-аут агента (типово 600 або значення з конфігурації)
- `--json`: вивести JSON

## Приклади

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Примітки

- Режим Gateway повертається до вбудованого агента, якщо запит до Gateway завершується помилкою. Використовуйте `--local`, щоб примусово ввімкнути вбудоване виконання одразу.
- `--local` однаково спочатку попередньо завантажує реєстр Plugin, тому провайдери, інструменти та канали, надані Plugin, залишаються доступними під час вбудованих запусків.
- `--channel`, `--reply-channel` і `--reply-account` впливають на доставку відповіді, а не на маршрутизацію сесії.
- `--json` зберігає stdout зарезервованим для JSON-відповіді. Діагностика Gateway, Plugin і вбудованого резервного режиму спрямовується до stderr, щоб скрипти могли напряму розбирати stdout.
- Коли ця команда запускає регенерацію `models.json`, облікові дані провайдера, керовані SecretRef, зберігаються як несекретні маркери (наприклад, назви змінних середовища, `secretref-env:ENV_VAR_NAME` або `secretref-managed`), а не як розкритий відкритий текст секретів.
- Записи маркерів є авторитетними від джерела: OpenClaw зберігає маркери з активного знімка конфігурації джерела, а не з розв’язаних значень секретів під час виконання.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Середовище виконання агента](/uk/concepts/agent)
