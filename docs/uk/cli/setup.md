---
read_when:
    - Ви виконуєте налаштування першого запуску без повного онбордингу через CLI
    - Ви хочете встановити шлях до робочого простору за замовчуванням
    - Вам потрібні всі прапорці й те, як налаштування вибирає між базовим режимом і режимом майстра.
summary: Довідник CLI для `openclaw setup` (ініціалізація конфігурації та робочої області, опційний запуск початкового налаштування)
title: Налаштування
x-i18n:
    generated_at: "2026-05-11T20:29:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Ініціалізує базову конфігурацію та робочий простір агента. Якщо вказано будь-який прапорець онбордингу, також запускає майстер.

<Note>
`openclaw setup` призначено для встановлень зі змінюваною конфігурацією. У режимі Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw відмовляється записувати налаштування, оскільки файлом конфігурації керує Nix. Використовуйте офіційний [короткий посібник nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) або еквівалентну вихідну конфігурацію для іншого пакета Nix.
</Note>

## Параметри

| Прапорець                  | Опис                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Каталог робочого простору агента (типово `~/.openclaw/workspace`; зберігається як `agents.defaults.workspace`). |
| `--wizard`                 | Запустити інтерактивний онбординг.                                                                        |
| `--non-interactive`        | Запустити онбординг без запитів.                                                                          |
| `--mode <mode>`            | Режим онбордингу: `local` або `remote`.                                                                   |
| `--import-from <provider>` | Провайдер міграції, який потрібно запустити під час онбордингу.                                           |
| `--import-source <path>`   | Домашній каталог вихідного агента для `--import-from`.                                                     |
| `--import-secrets`         | Імпортувати підтримувані секрети під час міграції в онбордингу.                                           |
| `--remote-url <url>`       | URL WebSocket віддаленого Gateway.                                                                        |
| `--remote-token <token>`   | Токен віддаленого Gateway (необов’язково).                                                                |

### Автозапуск майстра

`openclaw setup` запускає майстер, коли будь-який із цих прапорців явно вказано, навіть без `--wizard`:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Приклади

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Примітки

- Простий `openclaw setup` ініціалізує конфігурацію та робочий простір без запуску повного процесу онбордингу.
- Після простого налаштування запустіть `openclaw onboard` для повного керованого процесу, `openclaw configure` для цільових змін або `openclaw channels add`, щоб додати облікові записи каналів.
- Якщо виявлено стан Hermes, інтерактивний онбординг може автоматично запропонувати міграцію. Онбординг з імпортом потребує нового налаштування; використовуйте [Міграцію](/uk/cli/migrate) для планів пробного запуску, резервних копій і режиму перезапису поза онбордингом.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Онбординг (CLI)](/uk/start/wizard)
- [Початок роботи](/uk/start/getting-started)
- [Огляд встановлення](/uk/install)
