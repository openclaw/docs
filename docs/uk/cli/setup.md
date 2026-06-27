---
read_when:
    - Ви виконуєте початкове налаштування без повного онбордингу CLI
    - Ви хочете встановити шлях робочого простору за замовчуванням
    - Вам потрібен кожен прапорець і те, як setup вибирає між базовим режимом і режимом майстра.
summary: Довідник CLI для `openclaw setup` (ініціалізує конфігурацію та робочий простір, за потреби запускає початкове налаштування)
title: Налаштування
x-i18n:
    generated_at: "2026-06-27T17:23:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Ініціалізуйте базову конфігурацію та робочий простір агента. Якщо присутній будь-який прапорець онбордингу, також запускається майстер.

<Note>
`openclaw setup` призначено для встановлень зі змінюваною конфігурацією. У режимі Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw відмовляється виконувати записи налаштування, оскільки файл конфігурації керується Nix. Використовуйте офіційний [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) або еквівалентну вихідну конфігурацію для іншого пакета Nix.
</Note>

## Параметри

| Прапорець                  | Опис                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Каталог робочого простору агента (за замовчуванням `~/.openclaw/workspace`; зберігається як `agents.defaults.workspace`). |
| `--wizard`                 | Запустити інтерактивний онбординг.                                                                  |
| `--non-interactive`        | Запустити онбординг без запитів.                                                                    |
| `--accept-risk`            | Підтвердити ризик доступу агента до всієї системи; обов’язково з `--non-interactive`.               |
| `--mode <mode>`            | Режим онбордингу: `local` або `remote`.                                                             |
| `--import-from <provider>` | Провайдер міграції, який потрібно запустити під час онбордингу.                                     |
| `--import-source <path>`   | Вихідний домашній каталог агента для `--import-from`.                                               |
| `--import-secrets`         | Імпортувати підтримувані секрети під час міграції в онбордингу.                                     |
| `--remote-url <url>`       | URL WebSocket віддаленого Gateway.                                                                  |
| `--remote-token <token>`   | Токен віддаленого Gateway (необов’язково).                                                          |

### Автозапуск майстра

`openclaw setup` запускає майстер, коли будь-який із цих прапорців явно присутній, навіть без `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Приклади

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Примітки

- Простий `openclaw setup` ініціалізує конфігурацію та робочий простір без запуску повного процесу онбордингу.
- Після простого налаштування запустіть `openclaw onboard` для повного керованого шляху, `openclaw configure` для цільових змін або `openclaw channels add`, щоб додати облікові записи каналів.
- Якщо виявлено стан Hermes, інтерактивний онбординг може автоматично запропонувати міграцію. Імпортний онбординг потребує свіжого налаштування; використовуйте [Міграція](/uk/cli/migrate) для планів пробного запуску, резервних копій і режиму перезапису поза онбордингом.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Онбординг (CLI)](/uk/start/wizard)
- [Початок роботи](/uk/start/getting-started)
- [Огляд встановлення](/uk/install)
