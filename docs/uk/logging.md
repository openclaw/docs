---
read_when:
    - Вам потрібен огляд журналювання, дружній до початківців
    - Ви хочете налаштувати рівні або формати журналювання
    - Ви усуваєте несправності й вам потрібно швидко знайти журнали
summary: 'Огляд журналювання: журнали файлів, виведення в консоль, перегляд через CLI та Control UI'
title: Огляд журналювання
x-i18n:
    generated_at: "2026-04-25T19:33:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47bd7c3c515248ba2580bd372417e5842f6936bcc92b0fd83301491293d0be2c
    source_path: logging.md
    workflow: 15
---

# Журналювання

OpenClaw має дві основні поверхні журналювання:

- **Файлові журнали** (рядки JSON), які записує Gateway.
- **Виведення в консоль**, яке показується в терміналах і в Gateway Debug UI.

Вкладка **Logs** у Control UI відстежує файловий журнал gateway. На цій сторінці пояснюється, де зберігаються журнали, як їх читати та як налаштовувати рівні й формати журналювання.

## Де зберігаються журнали

За замовчуванням Gateway записує циклічний файл журналу в:

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

### CLI: перегляд у реальному часі (рекомендовано)

Використовуйте CLI, щоб відстежувати файл журналу gateway через RPC:

```bash
openclaw logs --follow
```

Корисні поточні параметри:

- `--local-time`: відображати часові мітки у вашому локальному часовому поясі
- `--url <url>` / `--token <token>` / `--timeout <ms>`: стандартні прапорці Gateway RPC
- `--expect-final`: прапорець очікування фінальної відповіді для RPC із підтримкою агентів (тут підтримується через спільний клієнтський шар)

Режими виведення:

- **TTY-сеанси**: зручні для читання, кольорові, структуровані рядки журналу.
- **Не-TTY-сеанси**: звичайний текст.
- `--json`: JSON із розділенням по рядках (одна подія журналу на рядок).
- `--plain`: примусово використовувати звичайний текст у TTY-сеансах.
- `--no-color`: вимкнути ANSI-кольори.

Коли ви передаєте явний `--url`, CLI не застосовує автоматично облікові дані з конфігурації або середовища; додайте `--token` самостійно, якщо цільовий Gateway вимагає автентифікації.

У режимі JSON CLI виводить об’єкти з міткою `type`:

- `meta`: метадані потоку (файл, курсор, розмір)
- `log`: розібраний запис журналу
- `notice`: підказки про обрізання / ротацію
- `raw`: нерозібраний рядок журналу

Якщо Gateway local loopback запитує сполучення, `openclaw logs` автоматично переключається на налаштований локальний файл журналу. Явні цілі `--url` не використовують цей резервний механізм.

Якщо Gateway недоступний, CLI показує коротку підказку виконати:

```bash
openclaw doctor
```

### Control UI (веб)

Вкладка **Logs** у Control UI відстежує той самий файл за допомогою `logs.tail`.
Див. [/web/control-ui](/uk/web/control-ui), щоб дізнатися, як її відкрити.

### Журнали лише каналу

Щоб відфільтрувати активність каналу (WhatsApp/Telegram тощо), використовуйте:

```bash
openclaw channels logs --channel whatsapp
```

## Формати журналів

### Файлові журнали (JSONL)

Кожен рядок у файлі журналу — це JSON-об’єкт. CLI і Control UI розбирають ці записи, щоб відображати структуроване виведення (час, рівень, підсистема, повідомлення).

### Виведення в консоль

Журнали консолі **враховують TTY** і форматуються для зручності читання:

- Префікси підсистем (наприклад, `gateway/channels/whatsapp`)
- Кольорове позначення рівня (info/warn/error)
- Необов’язковий компактний режим або режим JSON

Форматування консолі керується через `logging.consoleStyle`.

### Журнали Gateway WebSocket

`openclaw gateway` також має журналювання протоколу WebSocket для RPC-трафіку:

- звичайний режим: лише цікаві результати (помилки, помилки розбору, повільні виклики)
- `--verbose`: увесь трафік запитів/відповідей
- `--ws-log auto|compact|full`: вибір стилю детального відображення
- `--compact`: псевдонім для `--ws-log compact`

Приклади:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Налаштування журналювання

Усі налаштування журналювання розміщені в `logging` у `~/.openclaw/openclaw.json`.

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

- `logging.level`: рівень **файлових журналів** (JSONL).
- `logging.consoleLevel`: рівень деталізації **консолі**.

Ви можете перевизначити обидва значення через змінну середовища **`OPENCLAW_LOG_LEVEL`** (наприклад, `OPENCLAW_LOG_LEVEL=debug`). Змінна середовища має вищий пріоритет, ніж файл конфігурації, тому ви можете підвищити деталізацію для одного запуску без редагування `openclaw.json`. Ви також можете передати глобальний параметр CLI **`--log-level <level>`** (наприклад, `openclaw --log-level debug gateway run`), який перевизначає змінну середовища для цієї команди.

`--verbose` впливає лише на виведення в консоль і деталізацію журналів WS; він не змінює рівні файлових журналів.

### Стилі консолі

`logging.consoleStyle`:

- `pretty`: зручно для читання, з кольорами та часовими мітками.
- `compact`: щільніше виведення (найкраще для тривалих сеансів).
- `json`: JSON на рядок (для обробників журналів).

### Редагування чутливих даних

Підсумки інструментів можуть приховувати чутливі токени до того, як вони потраплять у консоль:

- `logging.redactSensitive`: `off` | `tools` (типово: `tools`)
- `logging.redactPatterns`: список рядків regex для перевизначення типового набору

Приховування чутливих даних впливає **лише на виведення в консоль** і не змінює файлові журнали.

## Діагностика + OpenTelemetry

Діагностика — це структуровані, машиночитані події для запусків моделей **і**
телеметрії потоку повідомлень (webhooks, постановка в чергу, стан сесії). Вони **не**
замінюють журнали; вони існують для передачі метрик, трасувань та інших даних у експортери.

Події діагностики створюються в процесі, але експортери підключаються лише тоді, коли ввімкнено діагностику + плагін експорту.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: модель даних + SDK для трасувань, метрик і журналів.
- **OTLP**: мережевий протокол, який використовується для експорту даних OTel до колектора/бекенда.
- OpenClaw зараз експортує через **OTLP/HTTP (protobuf)**.

### Експортовані сигнали

- **Метрики**: лічильники + гістограми (використання токенів, потік повідомлень, черги).
- **Трасування**: span-и для використання моделей + обробки webhook/повідомлень.
- **Журнали**: експортуються через OTLP, коли ввімкнено `diagnostics.otel.logs`. Обсяг журналів може бути великим; зважайте на `logging.level` і фільтри експортера.

### Каталог діагностичних подій

Використання моделі:

- `model.usage`: токени, вартість, тривалість, контекст, провайдер/модель/канал, ідентифікатори сесії.
  `usage` — це облік провайдера/ходу для вартості та телеметрії; `context.used`
  — це поточний знімок запиту/контексту і він може бути меншим за `usage.total`
  від провайдера, коли задіяно кешований вхід або виклики циклу інструментів.

Потік повідомлень:

- `webhook.received`: вхідний webhook для кожного каналу.
- `webhook.processed`: webhook оброблено + тривалість.
- `webhook.error`: помилки обробника webhook.
- `message.queued`: повідомлення поставлено в чергу на обробку.
- `message.processed`: результат + тривалість + необов’язкова помилка.
- `message.delivery.started`: почато спробу вихідної доставки.
- `message.delivery.completed`: завершено спробу вихідної доставки + тривалість/кількість результатів.
- `message.delivery.error`: спроба вихідної доставки завершилася помилкою + тривалість/обмежена категорія помилки.

Черга + сесія:

- `queue.lane.enqueue`: додавання в lane черги команд + глибина.
- `queue.lane.dequeue`: вилучення з lane черги команд + час очікування.
- `session.state`: перехід стану сесії + причина.
- `session.stuck`: попередження про завислу сесію + вік.
- `run.attempt`: метадані повторної спроби/спроби запуску.
- `diagnostic.heartbeat`: агреговані лічильники (webhooks/черга/сесія).

Виконання:

- `exec.process.completed`: результат процесу terminal exec, тривалість, ціль, режим,
  код виходу та тип помилки. Текст команди й робочі каталоги не
  включаються.

### Увімкнення діагностики (без експортера)

Використовуйте це, якщо хочете, щоб події діагностики були доступні для Plugin або власних приймачів:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Прапорці діагностики (цільові журнали)

Використовуйте прапорці, щоб увімкнути додаткові цільові журнали налагодження без підвищення `logging.level`.
Прапорці нечутливі до регістру й підтримують wildcards (наприклад, `telegram.*` або `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Перевизначення через середовище (одноразово):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Примітки:

- Журнали прапорців потрапляють до стандартного файлу журналу (того самого, що й `logging.file`).
- Виведення все одно редагується відповідно до `logging.redactSensitive`.
- Повний посібник: [/diagnostics/flags](/uk/diagnostics/flags).

### Експорт у OpenTelemetry

Діагностику можна експортувати через плагін `diagnostics-otel` (OTLP/HTTP). Це
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

- Ви також можете ввімкнути плагін за допомогою `openclaw plugins enable diagnostics-otel`.
- `protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
- Метрики включають використання токенів, вартість, розмір контексту, тривалість запуску та
  лічильники/гістограми потоку повідомлень (webhooks, черги, стан сесії, глибина/очікування черги),
  а також гістограми використання GenAI токенів і тривалості викликів моделі.
- Трасування/метрики можна вмикати й вимикати через `traces` / `metrics` (типово: увімкнено). Трасування
  включають span-и використання моделей, а також span-и обробки webhook/повідомлень, якщо це ввімкнено.
- Необроблений вміст моделі/інструментів типово не експортується. Використовуйте
  `diagnostics.otel.captureContent` лише тоді, коли ваш колектор і політика зберігання
  схвалені для тексту запитів, відповідей, інструментів або системного запиту.
- Встановіть `headers`, якщо ваш колектор вимагає автентифікації.
- Підтримувані змінні середовища: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Встановіть `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, щоб передавати
  найновіший експериментальний атрибут span провайдера GenAI (`gen_ai.provider.name`)
  замість застарілого атрибута span (`gen_ai.system`). Метрики GenAI завжди
  використовують обмежені семантичні атрибути з низькою кардинальністю.
- Встановіть `OPENCLAW_OTEL_PRELOADED=1`, якщо інше попереднє завантаження або хост-процес уже
  зареєстрував глобальний OpenTelemetry SDK. У цьому режимі плагін не запускає
  і не завершує власний SDK, але все одно підключає слухачі діагностики OpenClaw і
  враховує `diagnostics.otel.traces`, `metrics` і `logs`.

### Експортовані метрики (назви + типи)

Використання моделі:

- `openclaw.tokens` (лічильник, атрибути: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (лічильник, атрибути: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, атрибути: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, атрибути: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI,
  атрибути: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`,
  `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика
  семантичних конвенцій GenAI, атрибути: `gen_ai.provider.name`,
  `gen_ai.operation.name`, `gen_ai.request.model`, необов’язковий `error.type`)

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

Черги + сесії:

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

Внутрішні метрики діагностики (пам’ять + цикл інструментів):

- `openclaw.memory.heap_used_bytes` (гістограма, атрибути: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, атрибути: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, атрибути: `openclaw.toolName`,
  `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, атрибути: `openclaw.toolName`,
  `openclaw.outcome`)

### Експортовані span-и (назви + ключові атрибути)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` за замовчуванням, або `gen_ai.provider.name`, коли ввімкнено
    найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` за замовчуванням, або `gen_ai.provider.name`, коли ввімкнено
    найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`, `openclaw.provider.request_id_hash` (обмежений
    SHA-хеш ідентифікатора запиту до висхідного провайдера; сирі ідентифікатори
    не експортуються)
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
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`,
    `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту запиту,
    історії, відповіді або ключа сесії)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`,
    `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`,
    `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнене, span-и моделі/інструментів також можуть включати
обмежені, відредаговані атрибути `openclaw.content.*` для конкретних класів вмісту,
які ви вибрали.

### Семплювання + скидання

- Семплювання трасувань: `diagnostics.otel.sampleRate` (0.0–1.0, лише кореневі span-и).
- Інтервал експорту метрик: `diagnostics.otel.flushIntervalMs` (мінімум 1000 мс).

### Примітки щодо протоколу

- Кінцеві точки OTLP/HTTP можна задати через `diagnostics.otel.endpoint` або
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Якщо кінцева точка вже містить `/v1/traces` або `/v1/metrics`, вона використовується як є.
- Якщо кінцева точка вже містить `/v1/logs`, вона використовується як є для журналів.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` керує лише формою
  атрибута провайдера span GenAI. Наявні панелі, які читають
  `gen_ai.system`, можуть залишатися на типовому варіанті, доки не буде виконано міграцію.
- `OPENCLAW_OTEL_PRELOADED=1` повторно використовує зовнішньо зареєстрований OpenTelemetry SDK
  для трасувань/метрик замість запуску NodeSDK, що належить плагіну.
- `diagnostics.otel.logs` вмикає експорт журналів OTLP для основного виведення логера.

### Поведінка експорту журналів

- Журнали OTLP використовують ті самі структуровані записи, що записуються в `logging.file`.
- Дотримуються `logging.level` (рівень файлових журналів). Редагування консолі **не** застосовується
  до журналів OTLP.
- Для інсталяцій із великим обсягом журналів слід надавати перевагу семплюванню/фільтрації в OTLP collector.

## Поради з усунення несправностей

- **Gateway недоступний?** Спочатку виконайте `openclaw doctor`.
- **Журнали порожні?** Перевірте, чи Gateway запущений і чи записує у шлях до файлу,
  вказаний у `logging.file`.
- **Потрібно більше деталей?** Встановіть `logging.level` у `debug` або `trace` і повторіть спробу.

## Пов’язане

- [Внутрішня будова журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностика](/uk/gateway/configuration-reference#diagnostics) — експорт OpenTelemetry і конфігурація трасування кешу
