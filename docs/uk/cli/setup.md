---
read_when:
    - Ви виконуєте налаштування під час першого запуску без повного початкового налаштування CLI
    - Ви хочете встановити типовий шлях до робочого простору
summary: Довідник CLI для `openclaw setup` (ініціалізація конфігурації + робочої області)
title: Налаштування
x-i18n:
    generated_at: "2026-05-06T15:54:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Ініціалізуйте `~/.openclaw/openclaw.json` і робочий простір агента.

<Note>
`openclaw setup` призначено для встановлень зі змінюваною конфігурацією. У режимі Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw відмовляється виконувати записи налаштування, оскільки файл конфігурації керується Nix. Агенти мають використовувати офіційний [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) або еквівалентну вихідну конфігурацію для іншого пакета Nix.
</Note>

Пов’язане:

- Початок роботи: [Початок роботи](/uk/start/getting-started)
- Вступне налаштування CLI: [Вступне налаштування (CLI)](/uk/start/wizard)

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
- `--wizard`: запустити вступне налаштування
- `--non-interactive`: запустити вступне налаштування без підказок
- `--mode <local|remote>`: режим вступного налаштування
- `--import-from <provider>`: постачальник міграції, який запускається під час вступного налаштування
- `--import-source <path>`: домашній каталог вихідного агента для `--import-from`
- `--import-secrets`: імпортувати підтримувані секрети під час міграції у вступному налаштуванні
- `--remote-url <url>`: URL WebSocket віддаленого Gateway
- `--remote-token <token>`: токен віддаленого Gateway

Щоб запустити вступне налаштування через setup:

```bash
openclaw setup --wizard
```

Примітки:

- Звичайний `openclaw setup` ініціалізує конфігурацію + робочий простір без повного потоку вступного налаштування.
- Після звичайного setup запустіть `openclaw configure`, щоб вибрати моделі, канали, Gateway, plugins, Skills або перевірки стану.
- Вступне налаштування запускається автоматично, коли присутні будь-які прапорці вступного налаштування (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Якщо виявлено стан Hermes, інтерактивне вступне налаштування може автоматично запропонувати міграцію. Імпорт під час вступного налаштування потребує свіжого setup; використовуйте [Міграція](/uk/cli/migrate) для планів dry-run, резервних копій і режиму перезапису поза вступним налаштуванням.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд установлення](/uk/install)
