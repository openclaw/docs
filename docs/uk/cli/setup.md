---
read_when:
    - Ви виконуєте початкове налаштування без повного онбордингу CLI
    - Ви хочете встановити типовий шлях до робочого простору
summary: Довідник CLI для `openclaw setup` (ініціалізація конфігурації та робочого простору)
title: Налаштування
x-i18n:
    generated_at: "2026-04-27T08:07:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Ініціалізує `~/.openclaw/openclaw.json` і робочий простір агента.

Пов’язано:

- Початок роботи: [Початок роботи](/uk/start/getting-started)
- Онбординг CLI: [Онбординг (CLI)](/uk/start/wizard)

## Приклади

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Параметри

- `--workspace <dir>`: каталог робочого простору агента (зберігається як `agents.defaults.workspace`)
- `--wizard`: запустити онбординг
- `--non-interactive`: запустити онбординг без запитів
- `--mode <local|remote>`: режим онбордингу
- `--import-from <provider>`: провайдер міграції, який слід запустити під час онбордингу
- `--import-source <path>`: вихідний домашній каталог агента для `--import-from`
- `--import-secrets`: імпортувати підтримувані секрети під час міграції в онбордингу
- `--remote-url <url>`: URL WebSocket віддаленого Gateway
- `--remote-token <token>`: токен віддаленого Gateway

Щоб запустити онбординг через setup:

```bash
openclaw setup --wizard
```

Примітки:

- Звичайний `openclaw setup` ініціалізує конфігурацію та робочий простір без повного процесу онбордингу.
- Онбординг запускається автоматично, якщо присутні будь-які прапорці онбордингу (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Якщо виявлено стан Hermes, інтерактивний онбординг може автоматично запропонувати міграцію. Онбординг імпорту потребує нового налаштування; використовуйте [Міграція](/uk/cli/migrate) для планів dry-run, резервних копій і режиму перезапису поза межами онбордингу.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Огляд встановлення](/uk/install)
