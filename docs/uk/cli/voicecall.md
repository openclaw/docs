---
read_when:
    - Ви використовуєте voice-call Plugin і хочете кожну точку входу CLI
    - Потрібні таблиці прапорців і значення за замовчуванням для setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose і start
summary: Довідник CLI для `openclaw voicecall` (інтерфейс команд Plugin для голосових викликів)
title: Голосовий дзвінок
x-i18n:
    generated_at: "2026-05-11T20:30:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw voicecall`

`voicecall` — це команда, надана Plugin. Вона з’являється лише тоді, коли Plugin голосових викликів установлено й увімкнено.

Коли Gateway запущено, операційні команди (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) маршрутизуються до середовища виконання голосових викликів цього Gateway. Якщо Gateway недоступний, вони повертаються до автономного середовища виконання CLI.

## Підкоманди

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

| Підкоманда | Опис                                                            |
| ---------- | --------------------------------------------------------------- |
| `setup`    | Показати перевірки готовності провайдера та webhook.            |
| `smoke`    | Запустити перевірки готовності; здійснити реальний тестовий виклик лише з `--yes`. |
| `call`     | Ініціювати вихідний голосовий виклик.                           |
| `start`    | Псевдонім для `call` з обов’язковим `--to` і необов’язковим `--message`. |
| `continue` | Промовити повідомлення й дочекатися наступної відповіді.        |
| `speak`    | Промовити повідомлення без очікування відповіді.                |
| `dtmf`     | Надіслати цифри DTMF до активного виклику.                      |
| `end`      | Завершити активний виклик.                                      |
| `status`   | Переглянути активні виклики (або один за `--call-id`).          |
| `tail`     | Стежити за `calls.jsonl` (корисно під час тестів провайдера).   |
| `latency`  | Підсумувати метрики затримки ходу з `calls.jsonl`.              |
| `expose`   | Перемкнути Tailscale serve/funnel для endpoint webhook.         |

## Налаштування та smoke

### `setup`

За замовчуванням виводить перевірки готовності у форматі, зручному для читання. Передайте `--json` для скриптів.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Запускає ті самі перевірки готовності. Реальний телефонний виклик не буде здійснено, якщо не вказано одночасно `--to` і `--yes`.

| Прапорець          | За замовчуванням                 | Опис                                      |
| ------------------ | --------------------------------- | ----------------------------------------- |
| `-t, --to <phone>` | (немає)                           | Номер телефону для виклику під час live smoke. |
| `--message <text>` | `OpenClaw voice call smoke test.` | Повідомлення для озвучення під час smoke-виклику. |
| `--mode <mode>`    | `notify`                          | Режим виклику: `notify` або `conversation`. |
| `--yes`            | `false`                           | Справді здійснити live-вихідний виклик.   |
| `--json`           | `false`                           | Вивести JSON, придатний для машинного читання. |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
Для зовнішніх провайдерів (`twilio`, `telnyx`, `plivo`) `setup` і `smoke` потребують публічної URL-адреси webhook з `publicUrl`, тунелю або експонування через Tailscale. Резервний варіант loopback або private serve відхиляється, бо оператори не можуть до нього дістатися.
</Note>

## Життєвий цикл виклику

### `call`

Ініціювати вихідний голосовий виклик.

| Прапорець             | Обов’язково | За замовчуванням | Опис                                                                      |
| --------------------- | ----------- | ---------------- | ------------------------------------------------------------------------- |
| `-m, --message <text>` | так         | (немає)          | Повідомлення, яке треба промовити, коли виклик з’єднається.               |
| `-t, --to <phone>`     | ні          | config `toNumber` | Номер телефону E.164 для виклику.                                         |
| `--mode <mode>`        | ні          | `conversation`   | Режим виклику: `notify` (завершити після повідомлення) або `conversation` (залишити відкритим). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Псевдонім для `call` з іншою формою прапорців за замовчуванням.

| Прапорець          | Обов’язково | За замовчуванням | Опис                                                        |
| ------------------ | ----------- | ---------------- | ----------------------------------------------------------- |
| `--to <phone>`     | так         | (немає)          | Номер телефону для виклику.                                 |
| `--message <text>` | ні          | (немає)          | Повідомлення, яке треба промовити, коли виклик з’єднається. |
| `--mode <mode>`    | ні          | `conversation`   | Режим виклику: `notify` або `conversation`.                 |

### `continue`

Промовити повідомлення й дочекатися відповіді.

| Прапорець          | Обов’язково | Опис                     |
| ------------------ | ----------- | ------------------------ |
| `--call-id <id>`   | так         | ID виклику.              |
| `--message <text>` | так         | Повідомлення для озвучення. |

### `speak`

Промовити повідомлення без очікування відповіді.

| Прапорець          | Обов’язково | Опис                     |
| ------------------ | ----------- | ------------------------ |
| `--call-id <id>`   | так         | ID виклику.              |
| `--message <text>` | так         | Повідомлення для озвучення. |

### `dtmf`

Надіслати цифри DTMF до активного виклику.

| Прапорець           | Обов’язково | Опис                                      |
| ------------------- | ----------- | ----------------------------------------- |
| `--call-id <id>`    | так         | ID виклику.                               |
| `--digits <digits>` | так         | Цифри DTMF (наприклад, `ww123456#` для очікувань). |

### `end`

Завершити активний виклик.

| Прапорець        | Обов’язково | Опис        |
| ---------------- | ----------- | ----------- |
| `--call-id <id>` | так         | ID виклику. |

### `status`

Переглянути активні виклики.

| Прапорець        | За замовчуванням | Опис                              |
| ---------------- | ---------------- | --------------------------------- |
| `--call-id <id>` | (немає)          | Обмежити вивід одним викликом.    |
| `--json`         | `false`          | Вивести JSON, придатний для машинного читання. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Журнали та метрики

### `tail`

Стежити за JSONL-журналом голосових викликів. На старті виводить останні `--since` рядків, а потім транслює нові рядки під час їх запису.

| Прапорець       | За замовчуванням           | Опис                                |
| --------------- | -------------------------- | ----------------------------------- |
| `--file <path>` | resolved from plugin store | Шлях до `calls.jsonl`.              |
| `--since <n>`   | `25`                       | Рядки для виводу перед tailing.     |
| `--poll <ms>`   | `250` (мінімум 50)         | Інтервал опитування в мілісекундах. |

### `latency`

Підсумувати метрики затримки ходу та очікування прослуховування з `calls.jsonl`. Вивід — JSON із підсумками `recordsScanned`, `turnLatency` і `listenWait`.

| Прапорець       | За замовчуванням           | Опис                                      |
| --------------- | -------------------------- | ----------------------------------------- |
| `--file <path>` | resolved from plugin store | Шлях до `calls.jsonl`.                    |
| `--last <n>`    | `200` (мінімум 1)          | Кількість нещодавніх записів для аналізу. |

## Експонування webhook

### `expose`

Увімкнути, вимкнути або змінити конфігурацію Tailscale serve/funnel для голосового webhook.

| Прапорець             | За замовчуванням                        | Опис                                           |
| --------------------- | ---------------------------------------- | ---------------------------------------------- |
| `--mode <mode>`       | `funnel`                                 | `off`, `serve` (tailnet) або `funnel` (публічний). |
| `--path <path>`       | config `tailscale.path` або `--serve-path` | Шлях Tailscale для експонування.               |
| `--port <port>`       | config `serve.port` або `3334`           | Локальний порт webhook.                        |
| `--serve-path <path>` | config `serve.path` або `/voice/webhook` | Локальний шлях webhook.                        |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Експонуйте endpoint webhook лише в мережі, яким довіряєте. За можливості віддавайте перевагу Tailscale Serve над Funnel.
</Warning>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Plugin голосових викликів](/uk/plugins/voice-call)
