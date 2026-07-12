---
read_when:
    - Ви хочете підключити події Gmail Pub/Sub до OpenClaw
    - Вам потрібен повний список прапорців і значень за замовчуванням
summary: Довідник CLI для `openclaw webhooks` (налаштування та запуск Gmail Pub/Sub)
title: Вебхуки
x-i18n:
    generated_at: "2026-07-12T13:10:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Допоміжні засоби та інтеграції Webhook. Наразі ця функціональність охоплює потоки Gmail Pub/Sub, побудовані на вбудованому спостерігачі `gog`.

## Підкоманди

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Підкоманда    | Опис                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| `gmail setup` | Одноразовий майстер: спостереження Gmail, тема й підписка Pub/Sub та доставлення до хука OpenClaw. |
| `gmail run`   | Запускає `gog watch serve` разом із циклом автоматичного поновлення спостереження на передньому плані. |

<Note>
Gateway також автоматично запускає `gog gmail watch serve` під час запуску, якщо встановлено `hooks.enabled=true` і задано `hooks.gmail.account` (налаштовується командою `gmail setup`). `gmail run` виконує ту саму логіку на передньому плані, що корисно для налагодження або коли спостерігач Gateway вимкнено. Докладніше про автоматичний запуск і відмову від нього за допомогою `OPENCLAW_SKIP_GMAIL_WATCHER` див. у розділі [Інтеграція Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration).
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Встановлює `gcloud` і `gog`, якщо їх немає, автентифікує `gcloud`, створює тему й підписку Pub/Sub, запускає спостереження Gmail і записує конфігурацію `hooks.gmail` з `hooks.enabled=true`. Виводить `Next: openclaw webhooks gmail run`.

### Обов’язкові параметри

| Прапорець           | Опис                                  |
| ------------------- | ------------------------------------- |
| `--account <email>` | Обліковий запис Gmail для спостереження. |

### Параметри Pub/Sub

| Прапорець               | Типове значення        | Опис                                                                                                                                                                            |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (немає)                | Ідентифікатор проєкту GCP (власник клієнта OAuth). Якщо не задано, використовується ідентифікатор проєкту самої теми, а потім проєкт, визначений з облікових даних `gog`. |
| `--topic <name>`        | `gog-gmail-watch`      | Назва теми Pub/Sub.                                                                                                                                                              |
| `--subscription <name>` | `gog-gmail-watch-push` | Назва підписки Pub/Sub.                                                                                                                                                          |
| `--label <label>`       | `INBOX`                | Мітка Gmail для спостереження.                                                                                                                                                   |
| `--push-endpoint <url>` | (немає)                | Явно задана кінцева точка надсилання Pub/Sub. Перевизначає Tailscale.                                                                                                            |

### Параметри доставлення OpenClaw

| Прапорець              | Типове значення                                  | Опис                              |
| ---------------------- | ------------------------------------------------ | --------------------------------- |
| `--hook-url <url>`     | Створюється з `hooks.path` і порту Gateway       | URL Webhook OpenClaw.             |
| `--hook-token <token>` | `hooks.token` або згенерований токен             | Токен Webhook OpenClaw.           |
| `--push-token <token>` | Згенерований токен                               | Токен надсилання, переданий до `gog watch serve`. |

### Параметри `gog watch serve`

| Прапорець             | Типове значення | Опис                                                                                                                                                                                                 |
| --------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | Хост прив’язки `gog watch serve`.                                                                                                                                                                    |
| `--port <port>`       | `8788`          | Порт `gog watch serve`.                                                                                                                                                                              |
| `--path <path>`       | `/gmail-pubsub` | Шлях `gog watch serve`. Примусово встановлюється в `/`, коли Tailscale увімкнено без явно заданої цілі, оскільки Tailscale видаляє шлях перед проксіюванням. |
| `--include-body`      | `true`          | Додає фрагменти тіла електронного листа. Прапорця CLI для вимкнення немає; натомість установіть `hooks.gmail.includeBody: false` у конфігурації. |
| `--max-bytes <n>`     | `20000`         | Максимальна кількість байтів у кожному фрагменті тіла.                                                                                                                                               |
| `--renew-minutes <n>` | `720` (12 год)  | Поновлює спостереження Gmail кожні N хвилин.                                                                                                                                                          |

### Надання доступу через Tailscale

| Прапорець                 | Типове значення | Опис                                                                                           |
| ------------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`        | Надає доступ до кінцевої точки надсилання через Tailscale: `funnel`, `serve` або `off`. |
| `--tailscale-path <path>` | (немає)         | Шлях для режиму Tailscale serve/funnel.                                                        |
| `--tailscale-target <t>`  | (немає)         | Ціль Tailscale serve/funnel (порт, `host:port` або URL).                                       |

### Виведення

| Прапорець | Опис                                                   |
| --------- | ------------------------------------------------------ |
| `--json`  | Виводить машинозчитуване зведення замість тексту.      |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Запускає `gog watch serve` разом із циклом автоматичного поновлення спостереження на передньому плані та перезапускає `gog watch serve` із затримкою 2 с, якщо процес несподівано завершується.

`run` приймає ті самі прапорці Pub/Sub, доставлення OpenClaw, `gog watch serve` і Tailscale, що й `setup`, за винятком такого:

- `--account` є **необов’язковим** для `run`; якщо його не задано, використовується `hooks.gmail.account`.
- `run` **не** приймає `--project`, `--push-endpoint` або `--json`.
- Для кожного прапорця спочатку використовується відповідне значення конфігурації `hooks.gmail.*` (записане командою `setup`), а потім те саме вбудоване типове значення, яке використовує `setup`, з одним винятком: типовим значенням `--tailscale` для `run` є `off` (а не `funnel`), якщо не задано ні прапорець, ні `hooks.gmail.tailscale.mode`.

| Категорія             | Прапорці                                                                         |
| --------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub               | `--account`, `--topic`, `--subscription`, `--label`                              |
| Доставлення OpenClaw  | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`     | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale             | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Для `run` значення `--topic` є повним шляхом до теми Pub/Sub (`projects/.../topics/...`), а не лише короткою назвою теми.
</Note>

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Автоматизація Webhook](/uk/automation/cron-jobs)
- [Інтеграція Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration)
