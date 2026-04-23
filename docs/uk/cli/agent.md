---
read_when:
    - Ви хочете запустити один хід агента зі скриптів (за потреби з доставкою відповіді)
summary: Довідка CLI для `openclaw agent` (надіслати один хід агента через Gateway)
title: Агент
x-i18n:
    generated_at: "2026-04-23T20:45:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a86605487ca74fd21ff82739c57e5745eff7022ff095583533db50ce5a26a29a
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Запустити один хід агента через Gateway (використовуйте `--local` для вбудованого режиму).
Використовуйте `--agent <id>`, щоб напряму звернутися до налаштованого агента.

Передайте принаймні один селектор сесії:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Пов’язане:

- Інструмент надсилання агенту: [Agent send](/uk/tools/agent-send)

## Параметри

- `-m, --message <text>`: обов’язковий текст повідомлення
- `-t, --to <dest>`: отримувач, який використовується для виведення ключа сесії
- `--session-id <id>`: явний id сесії
- `--agent <id>`: id агента; перевизначає прив’язки маршрутизації
- `--thinking <level>`: рівень мислення агента (`off`, `minimal`, `low`, `medium`, `high`, а також підтримувані provider-ом користувацькі рівні, як-от `xhigh`, `adaptive` або `max`)
- `--verbose <on|off>`: зберегти рівень докладності для сесії
- `--channel <channel>`: канал доставки; не вказуйте, щоб використати канал основної сесії
- `--reply-to <target>`: перевизначення цілі доставки
- `--reply-channel <channel>`: перевизначення каналу доставки
- `--reply-account <id>`: перевизначення облікового запису доставки
- `--local`: напряму запустити вбудованого агента (після попереднього завантаження реєстру Plugin)
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

- Режим Gateway повертається до вбудованого агента, якщо запит до Gateway завершується невдачею. Використовуйте `--local`, щоб одразу примусово виконати вбудований режим.
- `--local` однаково спочатку попередньо завантажує реєстр Plugin, тому providers, інструменти й канали, надані Plugin, залишаються доступними під час вбудованих запусків.
- `--channel`, `--reply-channel` і `--reply-account` впливають на доставку відповіді, а не на маршрутизацію сесії.
- Коли ця команда запускає повторне генерування `models.json`, облікові дані provider-а, керовані через SecretRef, зберігаються як маркери без секретів (наприклад, імена змінних середовища, `secretref-env:ENV_VAR_NAME` або `secretref-managed`), а не як розкритий відкритий текст секрету.
- Записи маркерів є авторитетними щодо джерела: OpenClaw зберігає маркери з активного знімка конфігурації джерела, а не з розв’язаних значень секретів під час виконання.
