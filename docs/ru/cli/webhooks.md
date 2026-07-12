---
read_when:
    - Вы хотите подключить события Gmail Pub/Sub к OpenClaw
    - Вам нужен полный список флагов и значений по умолчанию
summary: Справочник CLI для `openclaw webhooks` (настройка и запуск Gmail Pub/Sub)
title: Вебхуки
x-i18n:
    generated_at: "2026-07-12T11:19:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Вспомогательные средства и интеграции Webhook. В настоящее время эта функциональность ограничена сценариями Gmail Pub/Sub на основе встроенного наблюдателя `gog`.

## Подкоманды

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Подкоманда    | Описание                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------- |
| `gmail setup` | Одноразовый мастер: наблюдение Gmail, тема и подписка Pub/Sub, доставка в хук OpenClaw.    |
| `gmail run`   | Запускает `gog watch serve` и цикл автоматического продления наблюдения на переднем плане. |

<Note>
Gateway также автоматически запускает `gog gmail watch serve` при загрузке, если установлены `hooks.enabled=true` и `hooks.gmail.account` (задаются командой `gmail setup`). `gmail run` выполняет ту же логику на переднем плане и полезна для отладки или когда наблюдатель Gateway отключён. Подробности об автоматическом запуске и отказе от него с помощью `OPENCLAW_SKIP_GMAIL_WATCHER` см. в разделе [Интеграция Gmail Pub/Sub](/ru/automation/cron-jobs#gmail-pubsub-integration).
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Устанавливает `gcloud` и `gog`, если они отсутствуют, выполняет аутентификацию `gcloud`, создаёт тему и подписку Pub/Sub, запускает наблюдение Gmail и записывает конфигурацию `hooks.gmail` с `hooks.enabled=true`. Выводит `Далее: openclaw webhooks gmail run`.

### Обязательные параметры

| Флаг                | Описание                              |
| ------------------- | ------------------------------------- |
| `--account <email>` | Учётная запись Gmail для наблюдения.  |

### Параметры Pub/Sub

| Флаг                    | По умолчанию          | Описание                                                                                                                                                     |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--project <id>`        | (нет)                 | Идентификатор проекта GCP (владелец клиента OAuth). Если не задан, используется идентификатор проекта темы, а затем проект, определённый из учётных данных `gog`. |
| `--topic <name>`        | `gog-gmail-watch`     | Имя темы Pub/Sub.                                                                                                                                            |
| `--subscription <name>` | `gog-gmail-watch-push` | Имя подписки Pub/Sub.                                                                                                                                        |
| `--label <label>`       | `INBOX`               | Метка Gmail для наблюдения.                                                                                                                                  |
| `--push-endpoint <url>` | (нет)                 | Явно заданная конечная точка отправки Pub/Sub. Имеет приоритет над Tailscale.                                                                                 |

### Параметры доставки OpenClaw

| Флаг                   | По умолчанию                                     | Описание                    |
| ---------------------- | ------------------------------------------------ | --------------------------- |
| `--hook-url <url>`     | Формируется из `hooks.path` и порта Gateway      | URL Webhook OpenClaw.       |
| `--hook-token <token>` | `hooks.token` или сгенерированный токен          | Токен Webhook OpenClaw.     |
| `--push-token <token>` | Сгенерированный токен                            | Токен отправки, передаваемый в `gog watch serve`. |

### Параметры `gog watch serve`

| Флаг                  | По умолчанию   | Описание                                                                                                                                                                                                                              |
| --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`    | Хост привязки `gog watch serve`.                                                                                                                                                                                                      |
| `--port <port>`       | `8788`         | Порт `gog watch serve`.                                                                                                                                                                                                                |
| `--path <path>`       | `/gmail-pubsub` | Путь `gog watch serve`. Принудительно устанавливается в `/`, когда Tailscale включён без явно заданной цели, поскольку Tailscale удаляет путь перед проксированием.                                                                     |
| `--include-body`      | `true`         | Включать фрагменты тела письма. Флага CLI для отключения нет; вместо этого задайте `hooks.gmail.includeBody: false` в конфигурации.                                                                                                    |
| `--max-bytes <n>`     | `20000`        | Максимальное количество байтов в каждом фрагменте тела.                                                                                                                                                                               |
| `--renew-minutes <n>` | `720` (12 ч)   | Продлевать наблюдение Gmail каждые N минут.                                                                                                                                                                                            |

### Публикация через Tailscale

| Флаг                      | По умолчанию | Описание                                                                 |
| ------------------------- | ------------ | ------------------------------------------------------------------------ |
| `--tailscale <mode>`      | `funnel`     | Публикует конечную точку отправки через Tailscale: `funnel`, `serve` или `off`. |
| `--tailscale-path <path>` | (нет)        | Путь для Tailscale serve/funnel.                                         |
| `--tailscale-target <t>`  | (нет)        | Цель Tailscale serve/funnel (порт, `host:port` или URL).                  |

### Вывод

| Флаг     | Описание                                                       |
| -------- | -------------------------------------------------------------- |
| `--json` | Выводит машиночитаемую сводку вместо обычного текста.          |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Запускает `gog watch serve` и цикл автоматического продления наблюдения на переднем плане, перезапуская `gog watch serve` с задержкой 2 с при его неожиданном завершении.

`run` принимает те же флаги Pub/Sub, доставки OpenClaw, `gog watch serve` и Tailscale, что и `setup`, за следующими исключениями:

- `--account` для `run` **необязателен**; если он не задан, используется `hooks.gmail.account`.
- `run` **не** принимает `--project`, `--push-endpoint` и `--json`.
- Для каждого флага сначала используется соответствующее значение конфигурации `hooks.gmail.*` (записанное командой `setup`), а затем то же встроенное значение по умолчанию, которое использует `setup`, за одним исключением: если не заданы ни флаг, ни `hooks.gmail.tailscale.mode`, значением `--tailscale` по умолчанию для `run` будет `off` (а не `funnel`).

| Категория          | Флаги                                                                            |
| ------------------ | -------------------------------------------------------------------------------- |
| Pub/Sub            | `--account`, `--topic`, `--subscription`, `--label`                              |
| Доставка OpenClaw  | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`  | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale          | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Для `run` значение `--topic` представляет собой полный путь темы Pub/Sub (`projects/.../topics/...`), а не только краткое имя темы.
</Note>

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Автоматизация Webhook](/ru/automation/cron-jobs)
- [Интеграция Gmail Pub/Sub](/ru/automation/cron-jobs#gmail-pubsub-integration)
