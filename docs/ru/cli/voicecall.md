---
read_when:
    - Вы используете Plugin голосовых вызовов и хотите получить каждую точку входа CLI
    - Вам нужны таблицы флагов и значения по умолчанию для setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose и start
summary: Справочник CLI для `openclaw voicecall` (командная поверхность плагина голосовых вызовов)
title: Голосовой вызов
x-i18n:
    generated_at: "2026-06-28T22:47:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` — это команда, предоставляемая Plugin. Она появляется только тогда, когда Plugin голосовых вызовов установлен и включен.

Когда Gateway запущен, операционные команды (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) маршрутизируются в среду выполнения голосовых вызовов этого Gateway. Если Gateway недоступен, они переключаются на автономную среду выполнения CLI.

## Подкоманды

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| Подкоманда | Описание                                                        |
| ---------- | --------------------------------------------------------------- |
| `setup`    | Показать проверки готовности провайдера и Webhook.              |
| `smoke`    | Запустить проверки готовности; выполнить тестовый вызов в реальном времени только с `--yes`. |
| `call`     | Инициировать исходящий голосовой вызов.                         |
| `start`    | Псевдоним для `call`, где требуется `--to`, а `--message` необязателен. |
| `continue` | Произнести сообщение и дождаться следующего ответа.             |
| `speak`    | Произнести сообщение без ожидания ответа.                       |
| `dtmf`     | Отправить DTMF-цифры в активный вызов.                          |
| `end`      | Завершить активный вызов.                                       |
| `status`   | Проверить активные вызовы (или один по `--call-id`).            |
| `tail`     | Следить за `calls.jsonl` (полезно во время тестов провайдера).  |
| `latency`  | Сводка метрик задержки хода из `calls.jsonl`.                   |
| `expose`   | Переключить Tailscale serve/funnel для конечной точки Webhook.  |

## Настройка и smoke-тест

### `setup`

По умолчанию выводит удобочитаемые проверки готовности. Передайте `--json` для скриптов.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Запускает те же проверки готовности. Реальный телефонный вызов не будет выполнен, если одновременно не указаны `--to` и `--yes`.

| Флаг               | Значение по умолчанию             | Описание                                      |
| ------------------ | --------------------------------- | --------------------------------------------- |
| `-t, --to <phone>` | (нет)                             | Номер телефона для live smoke.                |
| `--message <text>` | `OpenClaw voice call smoke test.` | Сообщение, которое произносится во время smoke-вызова. |
| `--mode <mode>`    | `notify`                          | Режим вызова: `notify` или `conversation`.    |
| `--yes`            | `false`                           | Фактически выполнить исходящий вызов в реальном времени. |
| `--json`           | `false`                           | Вывести машиночитаемый JSON.                  |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
Для внешних провайдеров (`twilio`, `telnyx`, `plivo`) `setup` и `smoke` требуют публичный URL Webhook из `publicUrl`, туннеля или экспозиции Tailscale. Резервный вариант loopback или private serve отклоняется, потому что операторы связи не могут до него достучаться.
</Note>

## Жизненный цикл вызова

### `call`

Инициировать исходящий голосовой вызов.

| Флаг                   | Обязательно | Значение по умолчанию | Описание                                                                 |
| ---------------------- | ----------- | --------------------- | ------------------------------------------------------------------------ |
| `-m, --message <text>` | да          | (нет)                 | Сообщение, которое произносится при соединении вызова.                   |
| `-t, --to <phone>`     | нет         | config `toNumber`     | Номер телефона E.164 для вызова.                                         |
| `--mode <mode>`        | нет         | `conversation`        | Режим вызова: `notify` (завершить после сообщения) или `conversation` (оставить открытым). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Псевдоним для `call` с другой формой флагов по умолчанию.

| Флаг               | Обязательно | Значение по умолчанию | Описание                                               |
| ------------------ | ----------- | --------------------- | ------------------------------------------------------ |
| `--to <phone>`     | да          | (нет)                 | Номер телефона для вызова.                             |
| `--message <text>` | нет         | (нет)                 | Сообщение, которое произносится при соединении вызова. |
| `--mode <mode>`    | нет         | `conversation`        | Режим вызова: `notify` или `conversation`.             |

### `continue`

Произнести сообщение и дождаться ответа.

| Флаг               | Обязательно | Описание              |
| ------------------ | ----------- | --------------------- |
| `--call-id <id>`   | да          | Идентификатор вызова. |
| `--message <text>` | да          | Сообщение для произнесения. |

### `speak`

Произнести сообщение без ожидания ответа.

| Флаг               | Обязательно | Описание              |
| ------------------ | ----------- | --------------------- |
| `--call-id <id>`   | да          | Идентификатор вызова. |
| `--message <text>` | да          | Сообщение для произнесения. |

### `dtmf`

Отправить DTMF-цифры в активный вызов.

| Флаг                | Обязательно | Описание                                      |
| ------------------- | ----------- | --------------------------------------------- |
| `--call-id <id>`    | да          | Идентификатор вызова.                         |
| `--digits <digits>` | да          | DTMF-цифры (например, `ww123456#` для пауз).  |

### `end`

Завершить активный вызов.

| Флаг             | Обязательно | Описание              |
| ---------------- | ----------- | --------------------- |
| `--call-id <id>` | да          | Идентификатор вызова. |

### `status`

Проверить активные вызовы.

| Флаг             | Значение по умолчанию | Описание                       |
| ---------------- | --------------------- | ------------------------------ |
| `--call-id <id>` | (нет)                 | Ограничить вывод одним вызовом. |
| `--json`         | `false`               | Вывести машиночитаемый JSON.   |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Журналы и метрики

### `tail`

Следить за журналом JSONL голосовых вызовов. При запуске выводит последние `--since` строк, затем передает новые строки по мере их записи.

| Флаг            | Значение по умолчанию       | Описание                               |
| --------------- | --------------------------- | -------------------------------------- |
| `--file <path>` | определяется из хранилища Plugin | Путь к `calls.jsonl`.                  |
| `--since <n>`   | `25`                        | Строки для вывода перед слежением.     |
| `--poll <ms>`   | `250` (минимум 50)          | Интервал опроса в миллисекундах.       |

### `latency`

Сводка метрик задержки хода и ожидания прослушивания из `calls.jsonl`. Выводится JSON со сводками `recordsScanned`, `turnLatency` и `listenWait`.

| Флаг            | Значение по умолчанию       | Описание                                      |
| --------------- | --------------------------- | --------------------------------------------- |
| `--file <path>` | определяется из хранилища Plugin | Путь к `calls.jsonl`.                         |
| `--last <n>`    | `200` (минимум 1)           | Количество последних записей для анализа.     |

## Открытие Webhook

### `expose`

Включить, отключить или изменить конфигурацию Tailscale serve/funnel для голосового Webhook.

| Флаг                  | Значение по умолчанию                      | Описание                                      |
| --------------------- | ------------------------------------------ | --------------------------------------------- |
| `--mode <mode>`       | `funnel`                                   | `off`, `serve` (tailnet) или `funnel` (public). |
| `--path <path>`       | config `tailscale.path` или `--serve-path` | Путь Tailscale для открытия.                  |
| `--port <port>`       | config `serve.port` или `3334`             | Локальный порт Webhook.                       |
| `--serve-path <path>` | config `serve.path` или `/voice/webhook`   | Локальный путь Webhook.                       |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Открывайте конечную точку Webhook только сетям, которым вы доверяете. По возможности предпочитайте Tailscale Serve вместо Funnel.
</Warning>

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Plugin голосовых вызовов](/ru/plugins/voice-call)
