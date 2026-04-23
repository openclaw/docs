---
read_when:
    - Ви виконуєте початкове налаштування без повного покрокового запуску CLI
    - Ви хочете встановити типовий шлях до робочого простору
summary: Довідник CLI для `openclaw setup` (ініціалізація конфігурації + робочого простору)
title: Setup
x-i18n:
    generated_at: "2026-04-23T20:48:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6a000d3902f2ced83ccdff268c188fd84f54ae84162a416271ebb9289491b3
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Ініціалізувати `~/.openclaw/openclaw.json` і робочий простір агента.

Пов’язане:

- Початок роботи: [Getting started](/uk/start/getting-started)
- Покрокове налаштування CLI: [Onboarding (CLI)](/uk/start/wizard)

## Приклади

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Параметри

- `--workspace <dir>`: каталог робочого простору агента (зберігається як `agents.defaults.workspace`)
- `--wizard`: запустити onboarding
- `--non-interactive`: запустити onboarding без запитів
- `--mode <local|remote>`: режим onboarding
- `--remote-url <url>`: URL WebSocket віддаленого Gateway
- `--remote-token <token>`: токен віддаленого Gateway

Щоб запустити onboarding через setup:

```bash
openclaw setup --wizard
```

Примітки:

- Звичайний `openclaw setup` ініціалізує конфігурацію + робочий простір без повного потоку onboarding.
- Onboarding запускається автоматично, якщо присутні будь-які прапорці onboarding (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).
