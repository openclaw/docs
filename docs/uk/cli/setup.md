---
read_when:
    - Ви виконуєте початкове налаштування без повного онбордингу CLI
    - Ви хочете задати шлях до робочого простору за замовчуванням
summary: Довідка CLI для `openclaw setup` (ініціалізація конфігурації + робочого простору)
title: Налаштування
x-i18n:
    generated_at: "2026-05-06T12:48:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c784c4eedee60696273f6192364b1b16dcbd8a2cd7e8b9d80ff38a3994a84889
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Ініціалізуйте `~/.openclaw/openclaw.json` і робочий простір агента.

<Note>
`openclaw setup` призначено для встановлень зі змінюваною конфігурацією. У режимі Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw відмовляється від записів setup, оскільки файлом конфігурації керує Nix. Агенти мають використовувати офіційний [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) або еквівалентну вихідну конфігурацію для іншого пакета Nix.
</Note>

Пов’язане:

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
- `--import-source <path>`: вихідна домашня директорія агента для `--import-from`
- `--import-secrets`: імпортувати підтримувані секрети під час міграції в онбордингу
- `--remote-url <url>`: URL WebSocket віддаленого Gateway
- `--remote-token <token>`: токен віддаленого Gateway

Щоб запустити онбординг через setup:

```bash
openclaw setup --wizard
```

Примітки:

- Простий `openclaw setup` ініціалізує конфігурацію та робочий простір без повного процесу онбордингу.
- Після простого setup запустіть `openclaw configure`, щоб вибрати моделі, канали, Gateway, плагіни, Skills або перевірки стану.
- Онбординг запускається автоматично, коли наявні будь-які прапорці онбордингу (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Якщо виявлено стан Hermes, інтерактивний онбординг може автоматично запропонувати міграцію. Імпортний онбординг потребує свіжого setup; використовуйте [Міграція](/uk/cli/migrate) для планів dry-run, резервних копій і режиму перезапису поза онбордингом.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд встановлення](/uk/install)
