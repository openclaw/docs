---
read_when:
    - Ви хочете під’єднати події Gmail Pub/Sub до OpenClaw
    - Вам потрібен повний список прапорців і значень за замовчуванням
summary: Довідник CLI для `openclaw webhooks` (налаштування Gmail Pub/Sub і засіб запуску)
title: Webhook-и
x-i18n:
    generated_at: "2026-05-11T20:30:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Помічники та інтеграції Webhook. Наразі ця поверхня обмежена потоками Gmail Pub/Sub, які інтегруються з вбудованим спостерігачем `gog`.

## Підкоманди

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Підкоманда    | Опис                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| `gmail setup` | Налаштувати відстеження Gmail, тему/підписку Pub/Sub і ціль доставки Webhook OpenClaw. |
| `gmail run`   | Запустити `gog watch serve` разом із циклом автоматичного поновлення відстеження.                                        |

## `webhooks gmail setup`

Налаштуйте відстеження Gmail, Pub/Sub і доставку Webhook OpenClaw.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### Обов’язково

| Прапорець                | Опис             |
| ------------------- | ----------------------- |
| `--account <email>` | Обліковий запис Gmail для відстеження. |

### Параметри Pub/Sub

| Прапорець                    | За замовчуванням                | Опис                                          |
| ----------------------- | ---------------------- | ---------------------------------------------------- |
| `--project <id>`        | (немає)                 | Ідентифікатор проєкту GCP (власник OAuth-клієнта).             |
| `--topic <name>`        | `gog-gmail-watch`      | Назва теми Pub/Sub.                                  |
| `--subscription <name>` | `gog-gmail-watch-push` | Назва підписки Pub/Sub.                           |
| `--label <label>`       | `INBOX`                | Мітка Gmail для відстеження.                                |
| `--push-endpoint <url>` | (немає)                 | Явний push-ендпоінт Pub/Sub. Перевизначає Tailscale. |

### Параметри доставки OpenClaw

| Прапорець                   | За замовчуванням | Опис                                |
| ---------------------- | ------- | ------------------------------------------ |
| `--hook-url <url>`     | (немає)  | URL Webhook OpenClaw.                      |
| `--hook-token <token>` | (немає)  | Токен Webhook OpenClaw.                    |
| `--push-token <token>` | (немає)  | Push-токен, що передається до `gog watch serve`. |

### Параметри `gog watch serve`

| Прапорець                  | За замовчуванням         | Опис                                                       |
| --------------------- | --------------- | ----------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | Хост прив’язки `gog watch serve`.                                      |
| `--port <port>`       | `8788`          | Порт `gog watch serve`.                                           |
| `--path <path>`       | `/gmail-pubsub` | Шлях `gog watch serve`.                                           |
| `--include-body`      | `true`          | Включати фрагменти тіла електронних листів. Передайте `--no-include-body`, щоб вимкнути. |
| `--max-bytes <n>`     | `20000`         | Максимальна кількість байтів на фрагмент тіла.                                       |
| `--renew-minutes <n>` | `720` (12 год)     | Поновлювати відстеження Gmail кожні N хвилин.                                |

### Експозиція Tailscale

| Прапорець                      | За замовчуванням  | Опис                                                      |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | Відкрити push-ендпоінт через Tailscale: `funnel`, `serve` або `off`. |
| `--tailscale-path <path>` | (немає)   | Шлях для Tailscale serve/funnel.                                 |
| `--tailscale-target <t>`  | (немає)   | Ціль Tailscale serve/funnel (порт, `host:port` або URL).       |

### Вивід

| Прапорець     | Опис                                       |
| -------- | ------------------------------------------------- |
| `--json` | Вивести машинозчитуване зведення замість тексту. |

## `webhooks gmail run`

Запустіть `gog watch serve` разом із циклом автоматичного поновлення відстеження на передньому плані.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` приймає ті самі прапорці `gog watch serve`, доставки OpenClaw, Pub/Sub і Tailscale, що й `setup`, за винятком:

- `--account` є **необов’язковим** для `run` (він повертається до налаштованого облікового запису).
- `run` **не** приймає `--project`, `--push-endpoint` або `--json`.
- Прапорці `run` не мають вбудованих значень за замовчуванням; відсутні значення повертаються до значень, записаних `setup`.

| Категорія          | Прапорці                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| Доставка OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Для `run` значення `--topic` — це повний шлях теми Pub/Sub (`projects/.../topics/...`), а не лише коротка назва теми.
</Note>

## Наскрізний потік

Див. [інтеграцію Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration) щодо проєкту GCP, OAuth і налаштування на боці Gateway, яке поєднується з цими командами CLI.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Автоматизація Webhook](/uk/automation/cron-jobs)
- [Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration)
