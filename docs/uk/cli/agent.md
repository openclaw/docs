---
read_when:
    - Ви хочете запустити один хід агента зі скриптів (за бажанням доставити відповідь)
summary: Довідка CLI для `openclaw agent` (надіслати один хід агента через Gateway)
title: агент
x-i18n:
    generated_at: "2026-04-23T06:17:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
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

- Інструмент надсилання агенту: [Надсилання агенту](/uk/tools/agent-send)

## Параметри

- `-m, --message <text>`: обов’язкове тіло повідомлення
- `-t, --to <dest>`: одержувач, який використовується для виведення ключа сесії
- `--session-id <id>`: явний ідентифікатор сесії
- `--agent <id>`: ідентифікатор агента; перевизначає прив’язки маршрутизації
- `--thinking <level>`: рівень мислення агента (`off`, `minimal`, `low`, `medium`, `high`, а також підтримувані провайдером користувацькі рівні, як-от `xhigh`, `adaptive` або `max`)
- `--verbose <on|off>`: зберегти рівень докладності для сесії
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

- Режим Gateway повертається до вбудованого агента, якщо запит Gateway завершується помилкою. Використовуйте `--local`, щоб примусово виконати вбудований режим одразу.
- `--local` усе одно спочатку попередньо завантажує реєстр Plugin, тому надані Plugin провайдери, інструменти й канали залишаються доступними під час вбудованих запусків.
- `--channel`, `--reply-channel` і `--reply-account` впливають на доставку відповіді, а не на маршрутизацію сесії.
- Коли ця команда запускає повторну генерацію `models.json`, облікові дані провайдера, керовані SecretRef, зберігаються як несекретні маркери (наприклад, назви змінних середовища, `secretref-env:ENV_VAR_NAME` або `secretref-managed`), а не як розкритий секретний відкритий текст.
- Записи маркерів є авторитетними щодо джерела: OpenClaw зберігає маркери з активного знімка конфігурації джерела, а не з розв’язаних значень секретів у середовищі виконання.
