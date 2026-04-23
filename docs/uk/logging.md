---
read_when:
    - Вам потрібен дружній до початківців огляд логування
    - Ви хочете налаштувати рівні або формати логування
    - Ви усуваєте несправності й хочете швидко знайти логи
summary: 'Огляд логування: файлові логи, вивід у консоль, tail у CLI та Control UI'
title: Огляд логування
x-i18n:
    generated_at: "2026-04-23T20:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# Логування

OpenClaw має дві основні поверхні логування:

- **Файлові логи** (рядки JSON), які записує Gateway.
- **Вивід у консоль**, що показується в terminal і Gateway Debug UI.

Вкладка **Logs** у Control UI виконує tail файлового логу gateway. На цій сторінці пояснюється, де
зберігаються логи, як їх читати та як налаштовувати рівні й формати логування.

## Де зберігаються логи

Типово Gateway записує rolling log file у:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Дата використовує локальний часовий пояс хоста gateway.

Це можна перевизначити в `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Як читати логи

### CLI: live tail (рекомендовано)

Використовуйте CLI, щоб виконувати tail файлового логу gateway через RPC:

```bash
openclaw logs --follow
```

Корисні поточні параметри:

- `--local-time`: відображати часові позначки у вашому локальному часовому поясі
- `--url <url>` / `--token <token>` / `--timeout <ms>`: стандартні прапорці RPC Gateway
- `--expect-final`: прапорець очікування остаточної відповіді для agent-backed RPC (тут приймається через спільний client layer)

Режими виводу:

- **TTY-сесії**: красиві, кольорові, структуровані рядки логів.
- **Не-TTY сесії**: plain text.
- `--json`: JSON із розділенням по рядках (одна подія логу на рядок).
- `--plain`: примусово plain text у TTY-сесіях.
- `--no-color`: вимкнути ANSI-кольори.

Коли ви передаєте явний `--url`, CLI не застосовує автоматично credentials із конфігурації або
змінних середовища; якщо цільовий Gateway
вимагає auth, самі передайте `--token`.

У режимі JSON CLI виводить об’єкти з тегом `type`:

- `meta`: метадані потоку (file, cursor, size)
- `log`: розібраний запис логу
- `notice`: підказки про truncation / rotation
- `raw`: нерозібраний рядок логу

Якщо локальний loopback Gateway просить pairing, `openclaw logs` автоматично переходить до
налаштованого локального log file. Для явних цілей `--url` цей fallback не
використовується.

Якщо Gateway недоступний, CLI показує коротку підказку виконати:

```bash
openclaw doctor
```

### Control UI (web)

Вкладка **Logs** у Control UI виконує tail того самого файлу через `logs.tail`.
Як її відкрити, див. у [/web/control-ui](/uk/web/control-ui).

### Логи лише каналів

Щоб фільтрувати активність каналу (WhatsApp/Telegram тощо), використовуйте:

```bash
openclaw channels logs --channel whatsapp
```

## Формати логів

### Файлові логи (JSONL)

Кожен рядок у log file — це JSON-об’єкт. CLI і Control UI розбирають ці
записи, щоб відображати структурований вивід (час, рівень, підсистема, повідомлення).

### Вивід у консоль

Логи консолі **враховують TTY** і форматуються для зручності читання:

- Префікси підсистем (наприклад `gateway/channels/whatsapp`)
- Кольори рівнів (info/warn/error)
- Необов’язковий compact або JSON mode

Форматування консолі керується через `logging.consoleStyle`.

### Логи Gateway WebSocket

`openclaw gateway` також має логування протоколу WebSocket для RPC-трафіку:

- звичайний режим: лише цікаві результати (помилки, помилки розбору, повільні виклики)
- `--verbose`: увесь request/response-трафік
- `--ws-log auto|compact|full`: вибір стилю відображення в verbose-режимі
- `--compact`: псевдонім для `--ws-log compact`

Приклади:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Налаштування логування

Уся конфігурація логування знаходиться в розділі `logging` у `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Рівні логування

- `logging.level`: рівень **файлових логів** (JSONL).
- `logging.consoleLevel`: рівень деталізації **консолі**.

Ви можете перевизначити обидва через змінну середовища **`OPENCLAW_LOG_LEVEL`** (наприклад, `OPENCLAW_LOG_LEVEL=debug`). Ця змінна середовища має пріоритет над файлом конфігурації, тому ви можете підвищити деталізацію для одного запуску без редагування `openclaw.json`. Також можна передати глобальний параметр CLI **`--log-level <level>`** (наприклад, `openclaw --log-level debug gateway run`), який для цієї команди перевизначає змінну середовища.

`--verbose` впливає лише на вивід у консоль і деталізацію логів WS; він не змінює
рівні файлових логів.

### Стилі консолі

`logging.consoleStyle`:

- `pretty`: дружній до людини, кольоровий, із часовими позначками.
- `compact`: щільніший вивід (найкраще для довгих сесій).
- `json`: JSON на кожен рядок (для log processor-ів).

### Редагування

Зведення інструментів можуть редагувати чутливі токени до потрапляння в консоль:

- `logging.redactSensitive`: `off` | `tools` (типово: `tools`)
- `logging.redactPatterns`: список рядків regex для перевизначення типового набору

Редагування впливає **лише на вивід у консоль** і не змінює файлові логи.

## Diagnostics + OpenTelemetry

Diagnostics — це структуровані, машиночитані події для запусків моделей **і**
телеметрії потоку повідомлень (webhooks, черги, стан сесії). Вони **не**
замінюють логи; вони існують, щоб живити метрики, traces та інші exporter-и.

Події diagnostics генеруються в процесі, але exporter-и під’єднуються лише тоді, коли
увімкнено diagnostics + Plugin exporter-а.

### OpenTelemetry проти OTLP

- **OpenTelemetry (OTel)**: модель даних + SDK для traces, metrics і logs.
- **OTLP**: wire protocol, який використовується для експорту даних OTel у collector/backend.
- OpenClaw сьогодні експортує через **OTLP/HTTP (protobuf)**.

### Сигнали, що експортуються

- **Metrics**: counters + histograms (використання токенів, потік повідомлень, постановка в чергу).
- **Traces**: spans для використання моделей + обробки webhook/message.
- **Logs**: експортуються через OTLP, коли увімкнено `diagnostics.otel.logs`. Обсяг логів може бути високим; зважайте на `logging.level` і фільтри exporter-а.

### Каталог подій diagnostics

Використання моделей:

- `model.usage`: токени, вартість, тривалість, контекст, provider/model/channel, id сесій.

Потік повідомлень:

- `webhook.received`: вхід webhook для кожного каналу.
- `webhook.processed`: оброблено webhook + тривалість.
- `webhook.error`: помилки обробника webhook.
- `message.queued`: повідомлення поставлено в чергу на обробку.
- `message.processed`: результат + тривалість + необов’язкова помилка.

Черга + сесія:

- `queue.lane.enqueue`: постановка в чергу в lane команд + глибина.
- `queue.lane.dequeue`: зняття з черги з lane команд + час очікування.
- `session.state`: перехід стану сесії + причина.
- `session.stuck`: попередження про завислу сесію + вік.
- `run.attempt`: метадані повторних спроб/спроб запуску.
- `diagnostic.heartbeat`: агреговані лічильники (webhooks/черга/сесія).

### Увімкнути diagnostics (без exporter-а)

Використовуйте це, якщо хочете, щоб події diagnostics були доступні plugins або custom sink-ам:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Прапорці diagnostics (цільові логи)

Використовуйте прапорці, щоб увімкнути додаткові цільові debug-логи без підвищення `logging.level`.
Прапорці нечутливі до регістру й підтримують wildcard-и (наприклад `telegram.*` або `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Перевизначення через env (одноразово):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Примітки:

- Логи за прапорцями потрапляють у стандартний log file (той самий, що в `logging.file`).
- Вивід однаково редагується відповідно до `logging.redactSensitive`.
- Повний посібник: [/diagnostics/flags](/uk/diagnostics/flags).

### Експорт до OpenTelemetry

Diagnostics можна експортувати через Plugin `diagnostics-otel` (OTLP/HTTP). Це
працює з будь-яким OpenTelemetry collector/backend, який приймає OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

Примітки:

- Ви також можете ввімкнути Plugin через `openclaw plugins enable diagnostics-otel`.
- Наразі `protocol` підтримує лише `http/protobuf`. `grpc` ігнорується.
- Metrics включають використання токенів, вартість, розмір контексту, тривалість запуску та
  counters/histograms потоку повідомлень (webhooks, постановка в чергу, стан сесії, глибина/очікування черги).
- Traces/metrics можна перемикати через `traces` / `metrics` (типово: увімкнено). Traces
  включають spans використання моделі, а також spans обробки webhook/message, якщо їх увімкнено.
- Установіть `headers`, якщо ваш collector вимагає auth.
- Підтримувані змінні середовища: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Експортовані metrics (назви + типи)

Використання моделей:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Потік повідомлень:

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.outcome`)

Черги + сесії:

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` або
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Експортовані spans (назви + ключові атрибути)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Sampling + flushing

- Sampling traces: `diagnostics.otel.sampleRate` (0.0–1.0, лише root spans).
- Інтервал експорту metrics: `diagnostics.otel.flushIntervalMs` (мінімум 1000 мс).

### Примітки щодо протоколу

- Endpoints OTLP/HTTP можна задати через `diagnostics.otel.endpoint` або
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Якщо endpoint уже містить `/v1/traces` або `/v1/metrics`, він використовується як є.
- Якщо endpoint уже містить `/v1/logs`, він використовується як є для logs.
- `diagnostics.otel.logs` вмикає експорт основного logger output через OTLP.

### Поведінка експорту логів

- Логи OTLP використовують ті самі структуровані записи, які записуються в `logging.file`.
- Дотримуються `logging.level` (рівня файлових логів). Редагування консолі **не** застосовується
  до логів OTLP.
- На встановленнях із великим обсягом логів краще покладатися на sampling/filtering у collector OTLP.

## Поради щодо усунення несправностей

- **Gateway недоступний?** Спочатку виконайте `openclaw doctor`.
- **Логи порожні?** Перевірте, що Gateway запущено й він записує у шлях файлу,
  заданий у `logging.file`.
- **Потрібно більше деталей?** Установіть `logging.level` у `debug` або `trace` і повторіть спробу.

## Пов’язане

- [Внутрішня будова логування Gateway](/uk/gateway/logging) — стилі логів WS, префікси підсистем і захоплення консолі
- [Diagnostics](/uk/gateway/configuration-reference#diagnostics) — експорт OpenTelemetry і конфігурація trace кешу
