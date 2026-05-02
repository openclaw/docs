---
read_when:
    - Ви виконуєте налаштування першого запуску без повного початкового налаштування CLI
    - Ви хочете встановити типовий шлях до робочого простору
summary: Довідник CLI для `openclaw setup` (ініціалізація конфігурації + робочого простору)
title: Налаштування
x-i18n:
    generated_at: "2026-05-02T19:31:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Ініціалізуйте `~/.openclaw/openclaw.json` і робочий простір агента.

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
- `--non-interactive`: запустити онбординг без підказок
- `--mode <local|remote>`: режим онбордингу
- `--import-from <provider>`: постачальник міграції, який потрібно запустити під час онбордингу
- `--import-source <path>`: домашній каталог агента-джерела для `--import-from`
- `--import-secrets`: імпортувати підтримувані секрети під час міграції в онбордингу
- `--remote-url <url>`: URL WebSocket віддаленого Gateway
- `--remote-token <token>`: токен віддаленого Gateway

Щоб запустити онбординг через setup:

```bash
openclaw setup --wizard
```

Примітки:

- Звичайний `openclaw setup` ініціалізує конфігурацію й робочий простір без повного процесу онбордингу.
- Після звичайного setup запустіть `openclaw configure`, щоб вибрати моделі, канали, Gateway, плагіни, Skills або перевірки стану.
- Онбординг запускається автоматично, коли присутні будь-які прапорці онбордингу (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Якщо виявлено стан Hermes, інтерактивний онбординг може автоматично запропонувати міграцію. Імпорт під час онбордингу потребує нового setup; використовуйте [Міграцію](/uk/cli/migrate) для планів пробного запуску, резервних копій і режиму перезапису поза онбордингом.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Огляд встановлення](/uk/install)
