---
read_when:
    - Вам потрібен зрозумілий для початківців огляд журналювання
    - Ви хочете налаштувати рівні журналювання або формати
    - Ви усуваєте неполадки й хочете швидко знайти журнали
summary: 'Огляд журналювання: журнали у файлах, вивід у консолі, відстеження через CLI та Control UI'
title: Огляд журналювання
x-i18n:
    generated_at: "2026-04-25T08:32:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# Журналювання

OpenClaw має дві основні поверхні журналювання:

- **Журнали у файлах** (рядки JSON), які записує Gateway.
- **Вивід у консоль**, що показується в терміналах і в Gateway Debug UI.

Вкладка **Logs** у Control UI відстежує журнал файлу gateway. На цій сторінці пояснюється, де зберігаються журнали, як їх читати та як налаштовувати рівні журналювання і формати.

## Де зберігаються журнали

Типово Gateway записує ротаційний файл журналу в:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Дата використовує локальний часовий пояс хоста gateway.

Ви можете перевизначити це в `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Як читати журнали

### CLI: відстеження в реальному часі (рекомендовано)

Використовуйте CLI, щоб відстежувати файл журналу gateway через RPC:

```bash
openclaw logs --follow
```

Корисні актуальні параметри:

- `--local-time`: відображати часові мітки у вашому локальному часовому поясі
- `--url <url>` / `--token <token>` / `--timeout <ms>`: стандартні прапорці Gateway RPC
- `--expect-final`: прапорець очікування фінальної відповіді для RPC на основі агентів (підтримується тут через спільний клієнтський шар)

Режими виводу:

- **TTY-сеанси**: гарні, кольорові, структуровані рядки журналу.
- **Не-TTY-сеанси**: звичайний текст.
- `--json`: JSON з розділенням по рядках (одна подія журналу на рядок).
- `--plain`: примусово використовувати звичайний текст у TTY-сеансах.
- `--no-color`: вимкнути кольори ANSI.

Коли ви передаєте явний `--url`, CLI не застосовує автоматично облікові дані з конфігурації або середовища; додайте `--token` самостійно, якщо цільовий Gateway вимагає автентифікації.

У режимі JSON CLI виводить об’єкти з міткою `type`:

- `meta`: метадані потоку (файл, курсор, розмір)
- `log`: розібраний запис журналу
- `notice`: підказки щодо обрізання / ротації
- `raw`: нерозібраний рядок журналу

Якщо Gateway на local loopback запитує сполучення, `openclaw logs` автоматично переключається на налаштований локальний файл журналу. Явні цілі `--url` цей резервний механізм не використовують.

Якщо Gateway недоступний, CLI виводить коротку підказку виконати:

```bash
openclaw doctor
```

### Control UI (веб)

Вкладка **Logs** у Control UI відстежує той самий файл через `logs.tail`.
Див. [/web/control-ui](/uk/web/control-ui), щоб дізнатися, як її відкрити.

### Журнали лише каналів

Щоб відфільтрувати активність каналу (WhatsApp/Telegram/тощо), використовуйте:

```bash
openclaw channels logs --channel whatsapp
```

## Формати журналів

### Журнали у файлах (JSONL)

Кожен рядок у файлі журналу — це об’єкт JSON. CLI і Control UI розбирають ці
записи, щоб відображати структурований вивід (час, рівень, підсистема, повідомлення).

### Вивід у консоль

Журнали в консолі **враховують TTY** і форматуються для зручності читання:

- Префікси підсистем (наприклад, `gateway/channels/whatsapp`)
- Кольорове виділення рівнів (info/warn/error)
- Необов’язковий компактний або JSON-режим

Форматування консолі керується через `logging.consoleStyle`.

### Журнали WebSocket Gateway

`openclaw gateway` також має журналювання протоколу WebSocket для трафіку RPC:

- звичайний режим: лише важливі результати (помилки, помилки розбору, повільні виклики)
- `--verbose`: увесь трафік запитів/відповідей
- `--ws-log auto|compact|full`: вибір стилю докладного відображення
- `--compact`: псевдонім для `--ws-log compact`

Приклади:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Налаштування журналювання

Усі налаштування журналювання знаходяться в `logging` у `~/.openclaw/openclaw.json`.

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

### Рівні журналювання

- `logging.level`: рівень для **журналів у файлах** (JSONL).
- `logging.consoleLevel`: рівень деталізації для **консолі**.

Обидва параметри можна перевизначити через змінну середовища **`OPENCLAW_LOG_LEVEL`** (наприклад, `OPENCLAW_LOG_LEVEL=debug`). Змінна середовища має вищий пріоритет, ніж файл конфігурації, тож ви можете підвищити деталізацію для одного запуску без редагування `openclaw.json`. Ви також можете передати глобальний параметр CLI **`--log-level <level>`** (наприклад, `openclaw --log-level debug gateway run`), який перевизначає змінну середовища для цієї команди.

`--verbose` впливає лише на вивід у консоль і деталізацію журналів WS; він не змінює
рівні журналів у файлах.

### Стилі консолі

`logging.consoleStyle`:

- `pretty`: зручний для людей, кольоровий, із часовими мітками.
- `compact`: щільніший вивід (найкраще для довгих сеансів).
- `json`: JSON у кожному рядку (для обробників журналів).

### Редагування

Зведення інструментів можуть редагувати чутливі токени перед потраплянням у консоль:

- `logging.redactSensitive`: `off` | `tools` (типово: `tools`)
- `logging.redactPatterns`: список рядків regex для перевизначення типового набору

Редагування впливає **лише на вивід у консоль** і не змінює журнали у файлах.

## Діагностика + OpenTelemetry

Діагностика — це структуровані, машинозчитувані події для запусків моделей **і**
телеметрії потоку повідомлень (webhooks, постановка в чергу, стан сеансу). Вони **не**
замінюють журнали; вони існують, щоб передавати дані в метрики, трасування та інші експортери.

Події діагностики генеруються в процесі, але експортери підключаються лише тоді, коли
ввімкнено діагностику та Plugin експортера.

### OpenTelemetry проти OTLP

- **OpenTelemetry (OTel)**: модель даних і SDK для трасувань, метрик і журналів.
- **OTLP**: протокол передавання, який використовується для експорту даних OTel до колектора/бекенда.
- OpenClaw сьогодні експортує через **OTLP/HTTP (protobuf)**.

### Експортовані сигнали

- **Метрики**: лічильники та гістограми (використання токенів, потік повідомлень, черги).
- **Трасування**: spans для використання моделей і обробки webhook/повідомлень.
- **Журнали**: експортуються через OTLP, коли ввімкнено `diagnostics.otel.logs`. Обсяг
  журналів може бути великим; враховуйте `logging.level` і фільтри експортера.

### Каталог подій діагностики

Використання моделей:

- `model.usage`: токени, вартість, тривалість, контекст, provider/model/channel, ідентифікатори сеансів.

Потік повідомлень:

- `webhook.received`: вхід webhook для кожного каналу.
- `webhook.processed`: оброблений webhook + тривалість.
- `webhook.error`: помилки обробника webhook.
- `message.queued`: повідомлення поставлено в чергу на обробку.
- `message.processed`: результат + тривалість + необов’язкова помилка.
- `message.delivery.started`: розпочато спробу вихідної доставки.
- `message.delivery.completed`: завершено спробу вихідної доставки + тривалість/кількість результатів.
- `message.delivery.error`: спроба вихідної доставки завершилася помилкою + тривалість/обмежена категорія помилки.

Черга + сеанс:

- `queue.lane.enqueue`: додавання в lane черги команд + глибина.
- `queue.lane.dequeue`: видалення з lane черги команд + час очікування.
- `session.state`: перехід стану сеансу + причина.
- `session.stuck`: попередження про зависання сеансу + вік.
- `run.attempt`: метадані повторної спроби/спроби запуску.
- `diagnostic.heartbeat`: агреговані лічильники (webhooks/черга/сеанс).

Виконання:

- `exec.process.completed`: результат процесу terminal exec, тривалість, ціль, режим,
  код виходу та тип збою. Текст команди й робочі каталоги не
  включаються.

### Увімкнення діагностики (без експортера)

Використовуйте це, якщо хочете, щоб події діагностики були доступні Plugins або власним приймачам:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Прапорці діагностики (цільові журнали)

Використовуйте прапорці, щоб увімкнути додаткові цільові журнали налагодження без підвищення `logging.level`.
Прапорці нечутливі до регістру та підтримують шаблони (наприклад, `telegram.*` або `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Перевизначення через змінну середовища (одноразово):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Примітки:

- Журнали прапорців записуються у стандартний файл журналу (той самий, що й `logging.file`).
- Вивід усе ще редагується відповідно до `logging.redactSensitive`.
- Повний посібник: [/diagnostics/flags](/uk/diagnostics/flags).

### Експорт до OpenTelemetry

Діагностику можна експортувати через Plugin `diagnostics-otel` (OTLP/HTTP). Це
працює з будь-яким колектором/бекендом OpenTelemetry, який приймає OTLP/HTTP.

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
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

Примітки:

- Ви також можете ввімкнути Plugin за допомогою `openclaw plugins enable diagnostics-otel`.
- `protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
- Метрики включають використання токенів, вартість, розмір контексту, тривалість запуску та лічильники/гістограми потоку повідомлень (webhooks, черги, стан сеансу, глибина/очікування черги).
- Трасування/метрики можна перемикати через `traces` / `metrics` (типово: увімкнено). Трасування
  включають spans використання моделей, а також spans обробки webhook/повідомлень, коли це ввімкнено.
- Сирий вміст моделей/інструментів типово не експортується. Використовуйте
  `diagnostics.otel.captureContent` лише тоді, коли ваш колектор і політика зберігання
  схвалені для тексту підказок, відповідей, інструментів або системних підказок.
- Установіть `headers`, якщо ваш колектор вимагає автентифікації.
- Підтримувані змінні середовища: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Установіть `OPENCLAW_OTEL_PRELOADED=1`, якщо інше попереднє завантаження або хост-процес уже
  зареєстрував глобальний SDK OpenTelemetry. У цьому режимі Plugin не запускає
  і не завершує роботу власного SDK, але все одно підключає слухачі діагностики OpenClaw і
  враховує `diagnostics.otel.traces`, `metrics` і `logs`.

### Експортовані метрики (назви + типи)

Використання моделей:

- `openclaw.tokens` (лічильник, атрибути: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (лічильник, атрибути: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, атрибути: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, атрибути: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Потік повідомлень:

- `openclaw.webhook.received` (лічильник, атрибути: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (лічильник, атрибути: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (гістограма, атрибути: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (лічильник, атрибути: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (лічильник, атрибути: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (гістограма, атрибути: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (лічильник, атрибути: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (гістограма, атрибути:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

Черги + сеанси:

- `openclaw.queue.lane.enqueue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, атрибути: `openclaw.lane` або
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, атрибути: `openclaw.lane`)
- `openclaw.session.state` (лічильник, атрибути: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, атрибути: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (гістограма, атрибути: `openclaw.state`)
- `openclaw.run.attempt` (лічильник, атрибути: `openclaw.attempt`)

Виконання:

- `openclaw.exec.duration_ms` (гістограма, атрибути: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Експортовані spans (назви + ключові атрибути)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

Коли захоплення вмісту явно ввімкнено, spans моделей/інструментів також можуть містити
обмежені, відредаговані атрибути `openclaw.content.*` для конкретних класів вмісту,
які ви вирішили включити.

### Семплювання + скидання

- Семплювання трасувань: `diagnostics.otel.sampleRate` (0.0–1.0, лише кореневі spans).
- Інтервал експорту метрик: `diagnostics.otel.flushIntervalMs` (мінімум 1000 мс).

### Примітки щодо протоколу

- Кінцеві точки OTLP/HTTP можна встановити через `diagnostics.otel.endpoint` або
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Якщо кінцева точка вже містить `/v1/traces` або `/v1/metrics`, вона використовується як є.
- Якщо кінцева точка вже містить `/v1/logs`, вона використовується як є для журналів.
- `OPENCLAW_OTEL_PRELOADED=1` повторно використовує зовнішньо зареєстрований SDK OpenTelemetry
  для трасувань/метрик замість запуску NodeSDK, яким керує Plugin.
- `diagnostics.otel.logs` вмикає експорт журналів OTLP для виводу основного журналювальника.

### Поведінка експорту журналів

- Журнали OTLP використовують ті самі структуровані записи, що записуються в `logging.file`.
- Враховується `logging.level` (рівень журналів у файлах). Редагування консолі **не** застосовується
  до журналів OTLP.
- Для інсталяцій із великим обсягом даних слід віддавати перевагу семплюванню/фільтрації на боці колектора OTLP.

## Поради з усунення неполадок

- **Gateway недоступний?** Спочатку запустіть `openclaw doctor`.
- **Журнали порожні?** Перевірте, що Gateway запущений і записує у шлях файлу,
  указаний у `logging.file`.
- **Потрібно більше деталей?** Установіть `logging.level` на `debug` або `trace` і повторіть спробу.

## Пов’язані матеріали

- [Внутрішня реалізація журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностика](/uk/gateway/configuration-reference#diagnostics) — експорт OpenTelemetry і конфігурація трасування кешу
