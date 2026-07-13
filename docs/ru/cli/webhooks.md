---
read_when:
    - Вы хотите подключить события Gmail Pub/Sub к OpenClaw
    - Вам нужен полный список флагов и значений по умолчанию
summary: Справочник CLI для `openclaw webhooks` (настройка и запуск Gmail Pub/Sub)
title: Webhook-и
x-i18n:
    generated_at: "2026-07-13T19:41:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Вспомогательные средства и интеграции для Webhook. В настоящее время эта функциональность ограничена потоками Gmail Pub/Sub, построенными на встроенном средстве наблюдения `gog`.

## Подкоманды

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Подкоманда    | Описание                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| `gmail setup` | Однократный мастер настройки: наблюдение Gmail, тема и подписка Pub/Sub, а также доставка в обработчик OpenClaw. |
| `gmail run`   | Запускает `gog watch serve` вместе с циклом автоматического продления наблюдения на переднем плане.               |

<Note>
Gateway также автоматически запускает `gog gmail watch serve` при загрузке, когда заданы `hooks.enabled=true` и `hooks.gmail.account` (их задаёт `gmail setup`). `gmail run` выполняет ту же логику на переднем плане, что полезно для отладки или когда средство наблюдения Gateway отключено. Подробности автоматического запуска и отказа через `OPENCLAW_SKIP_GMAIL_WATCHER` см. в разделе [Интеграция Gmail Pub/Sub](/ru/automation/cron-jobs#gmail-pubsub-integration).
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Устанавливает `gcloud` и `gog`, если они отсутствуют, аутентифицирует `gcloud`, создаёт тему и подписку Pub/Sub, запускает наблюдение Gmail и записывает конфигурацию `hooks.gmail` с `hooks.enabled=true`. Выводит `Next: openclaw webhooks gmail run`.

### Обязательные параметры

| Флаг                | Описание             |
| ------------------- | ----------------------- |
| `--account <email>` | Учётная запись Gmail для наблюдения. |

### Параметры Pub/Sub

| Флаг                    | По умолчанию                | Описание                                                                                                                             |
| ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (нет)                 | Идентификатор проекта GCP (владелец клиента OAuth). Если не задан, используется идентификатор собственного проекта темы, а затем проект, определённый из учётных данных `gog`. |
| `--topic <name>`        | `gog-gmail-watch`      | Имя темы Pub/Sub.                                                                                                                     |
| `--subscription <name>` | `gog-gmail-watch-push` | Имя подписки Pub/Sub.                                                                                                              |
| `--label <label>`       | `INBOX`                | Метка Gmail для наблюдения.                                                                                                                   |
| `--push-endpoint <url>` | (нет)                 | Явно заданная конечная точка push-доставки Pub/Sub. Имеет приоритет над Tailscale.                                                                                    |

### Параметры доставки OpenClaw

| Флаг                   | По умолчанию                                      | Описание                                |
| ---------------------- | -------------------------------------------- | ------------------------------------------ |
| `--hook-url <url>`     | Формируется из `hooks.path` и порта Gateway | URL Webhook OpenClaw.                      |
| `--hook-token <token>` | `hooks.token` или сгенерированный токен          | Токен Webhook OpenClaw.                    |
| `--push-token <token>` | Сгенерированный токен                              | Токен push-доставки, передаваемый в `gog watch serve`. |

### Параметры `gog watch serve`

| Флаг                  | По умолчанию         | Описание                                                                                                                                  |
| --------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | Хост привязки `gog watch serve`.                                                                                                                 |
| `--port <port>`       | `8788`          | Порт `gog watch serve`.                                                                                                                      |
| `--path <path>`       | `/gmail-pubsub` | Путь `gog watch serve`. Принудительно задаётся как `/`, когда Tailscale включён без явно заданной цели, поскольку Tailscale удаляет путь перед проксированием. |
| `--include-body`      | `true`          | Включать фрагменты тела письма. Флага CLI для отключения нет; вместо этого задайте `hooks.gmail.includeBody: false` в конфигурации.                  |
| `--max-bytes <n>`     | `20000`         | Максимальное количество байтов в каждом фрагменте тела письма.                                                                                                                  |
| `--renew-minutes <n>` | `720` (12h)     | Продлевать наблюдение Gmail каждые N минут.                                                                                                           |

### Публикация через Tailscale

| Флаг                      | По умолчанию  | Описание                                                      |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | Публикует конечную точку push-доставки через Tailscale: `funnel`, `serve` или `off`. |
| `--tailscale-path <path>` | (нет)   | Путь для Tailscale Serve/Funnel.                                 |
| `--tailscale-target <t>`  | (нет)   | Цель Tailscale Serve/Funnel (порт, `host:port` или URL).       |

### Вывод

| Флаг     | Описание                                       |
| -------- | ------------------------------------------------- |
| `--json` | Выводит машиночитаемую сводку вместо текста. |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Запускает `gog watch serve` вместе с циклом автоматического продления наблюдения на переднем плане и перезапускает `gog watch serve` с задержкой 2s, если процесс неожиданно завершается.

`run` принимает те же флаги Pub/Sub, доставки OpenClaw, `gog watch serve` и Tailscale, что и `setup`, за следующими исключениями:

- `--account` является **необязательным** для `run`; если он не задан, используется `hooks.gmail.account`.
- `run` **не** принимает `--project`, `--push-endpoint` или `--json`.
- Для каждого флага сначала используется соответствующее значение конфигурации `hooks.gmail.*` (записанное командой `setup`), а затем то же встроенное значение по умолчанию, которое использует `setup`, за одним исключением: для `run` значение `--tailscale` по умолчанию равно `off` (а не `funnel`), если не заданы ни флаг, ни `hooks.gmail.tailscale.mode`.

| Категория          | Флаги                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| Доставка OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Для `run` значение `--topic` представляет собой полный путь к теме Pub/Sub (`projects/.../topics/...`), а не только краткое имя темы.
</Note>

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Автоматизация Webhook](/ru/automation/cron-jobs)
- [Интеграция Gmail Pub/Sub](/ru/automation/cron-jobs#gmail-pubsub-integration)
