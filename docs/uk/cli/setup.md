---
read_when:
    - Ви виконуєте початкове налаштування без повного онбордингу CLI
    - Ви хочете встановити типовий шлях до workspace
summary: Довідник CLI для `openclaw setup` (ініціалізація конфігурації та workspace)
title: setup
x-i18n:
    generated_at: "2026-04-23T06:19:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: f538aac341c749043ad959e35f2ed99c844ab8c3500ff59aa159d940bd301792
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Ініціалізуйте `~/.openclaw/openclaw.json` і workspace агента.

Пов’язане:

- Початок роботи: [Початок роботи](/uk/start/getting-started)
- Онбординг CLI: [Онбординг (CLI)](/uk/start/wizard)

## Приклади

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Параметри

- `--workspace <dir>`: каталог workspace агента (зберігається як `agents.defaults.workspace`)
- `--wizard`: запустити онбординг
- `--non-interactive`: запустити онбординг без запитів
- `--mode <local|remote>`: режим онбордингу
- `--remote-url <url>`: URL WebSocket віддаленого Gateway
- `--remote-token <token>`: токен віддаленого Gateway

Щоб запустити онбординг через setup:

```bash
openclaw setup --wizard
```

Примітки:

- Звичайна команда `openclaw setup` ініціалізує конфігурацію + workspace без повного потоку онбордингу.
- Онбординг запускається автоматично, якщо присутні будь-які прапорці онбордингу (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).
