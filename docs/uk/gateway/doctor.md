---
read_when:
    - Додавання або змінення міграцій doctor
    - Запровадження несумісних змін конфігурації
summary: 'Команда Doctor: перевірки стану, міграції конфігурації та кроки відновлення'
title: Doctor
x-i18n:
    generated_at: "2026-04-08T22:27:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75d321bd1ad0e16c29f2382e249c51edfc3a8d33b55bdceea39e7dbcd4901fce
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` — це інструмент відновлення та міграції для OpenClaw. Він виправляє застарілий
конфігураційний стан, перевіряє справність і надає практичні кроки для відновлення.

## Швидкий старт

```bash
openclaw doctor
```

### Безголовий режим / автоматизація

```bash
openclaw doctor --yes
```

Прийняти типові значення без запитів (зокрема кроки відновлення перезапуску/служб/sandbox, коли це застосовно).

```bash
openclaw doctor --repair
```

Застосувати рекомендовані виправлення без запитів (виправлення + перезапуски там, де це безпечно).

```bash
openclaw doctor --repair --force
```

Застосувати також агресивні виправлення (перезаписує користувацькі конфігурації supervisor).

```bash
openclaw doctor --non-interactive
```

Запуск без запитів і застосування лише безпечних міграцій (нормалізація конфігурації + перенесення стану на диску). Пропускає дії з перезапуском/службами/sandbox, які потребують підтвердження людини.
Міграції застарілого стану запускаються автоматично, якщо їх виявлено.

```bash
openclaw doctor --deep
```

Просканувати системні служби на наявність додаткових інсталяцій gateway (launchd/systemd/schtasks).

Якщо ви хочете переглянути зміни перед записом, спочатку відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (зведення)

- Необов’язкове попереднє оновлення для git-інсталяцій (лише в інтерактивному режимі).
- Перевірка актуальності протоколу UI (перебудовує Control UI, якщо схема протоколу новіша).
- Перевірка справності + запит на перезапуск.
- Підсумок стану Skills (доступні/відсутні/заблоковані) і стану плагінів.
- Нормалізація конфігурації для застарілих значень.
- Міграція конфігурації Talk із застарілих плоских полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
- Перевірки міграції browser для застарілих конфігурацій розширення Chrome та готовності Chrome MCP.
- Попередження про перевизначення постачальника OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Попередження про затінення Codex OAuth (`models.providers.openai-codex`).
- Перевірка TLS-передумов OAuth для профілів OpenAI Codex OAuth.
- Міграція застарілого стану на диску (sessions/каталог agent/автентифікація WhatsApp).
- Міграція ключів контрактів маніфесту застарілих плагінів (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Міграція сховища застарілих cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, `provider` у payload, прості резервні webhook-завдання з `notify: true`).
- Перевірка файлів блокування сесій і очищення застарілих блокувань.
- Перевірки цілісності стану та прав доступу (sessions, transcripts, каталог state).
- Перевірки прав доступу до файла конфігурації (`chmod 600`) під час локального запуску.
- Стан автентифікації моделі: перевіряє строк дії OAuth, може оновлювати токени, строк дії яких добігає кінця, і повідомляє про стани cooldown/disabled для профілів автентифікації.
- Виявлення додаткового каталогу workspace (`~/openclaw`).
- Відновлення образу sandbox, коли sandbox увімкнено.
- Міграція застарілих служб і виявлення додаткових gateway.
- Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
- Перевірки runtime gateway (службу встановлено, але вона не працює; кешована мітка launchd).
- Попередження про стан каналів (перевіряються з запущеного gateway).
- Аудит конфігурації supervisor (launchd/systemd/schtasks) з необов’язковим виправленням.
- Перевірки найкращих практик runtime gateway (Node проти Bun, шляхи менеджерів версій).
- Діагностика конфліктів портів gateway (типово `18789`).
- Попередження безпеки для відкритих політик DM.
- Перевірки автентифікації gateway для локального режиму токена (пропонує згенерувати токен, якщо джерела токена немає; не перезаписує конфігурації токенів SecretRef).
- Перевірка systemd linger у Linux.
- Перевірка розміру bootstrap-файлів workspace (попередження про обрізання/наближення до ліміту для контекстних файлів).
- Перевірка стану автодоповнення оболонки та автоматичне встановлення/оновлення.
- Перевірка готовності постачальника embedding для memory search (локальна модель, віддалений API key або двійковий файл QMD).
- Перевірки інсталяції з джерел (невідповідність workspace pnpm, відсутні ресурси UI, відсутній двійковий файл tsx).
- Записує оновлений конфіг + метадані майстра.

## Backfill і reset у Dreams UI

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded**
для робочого процесу grounded dreaming. Ці дії використовують gateway-подібні
RPC-методи в стилі doctor, але вони **не** є частиною CLI
відновлення/міграції `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному
  workspace, запускає grounded REM diary pass і записує оборотні записи backfill
  у `DREAMS.md`.
- **Reset** видаляє лише ті позначені записи backfill diary із `DREAMS.md`.
- **Clear Grounded** видаляє лише staged grounded-only короткострокові записи,
  які з’явилися внаслідок історичного відтворення й ще не накопичили live recall
  або daily support.

Чого вони **не** роблять самі по собі:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не переміщують автоматично grounded candidates у live short-term
  promotion store, якщо ви явно спочатку не запустили staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайний deep promotion
lane, натомість використайте CLI-потік:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це додає grounded durable candidates до short-term dreaming store, залишаючи
`DREAMS.md` як поверхню для перегляду.

## Детальна поведінка та обґрунтування

### 0) Необов’язкове оновлення (git-інсталяції)

Якщо це git checkout і doctor запущено в інтерактивному режимі, він пропонує
оновитися (fetch/rebase/build) перед запуском doctor.

### 1) Нормалізація конфігурації

Якщо конфігурація містить застарілі форми значень (наприклад `messages.ackReaction`
без перевизначення для конкретного каналу), doctor нормалізує їх до поточної
схеми.

Це також включає застарілі плоскі поля Talk. Поточна публічна конфігурація Talk —
це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` у мапу постачальників.

### 2) Міграції застарілих ключів конфігурації

Коли конфігурація містить застарілі ключі, інші команди відмовляються працювати
і просять вас запустити `openclaw doctor`.

Doctor виконає таке:

- Пояснить, які застарілі ключі було знайдено.
- Покажe міграцію, яку він застосував.
- Перезапише `~/.openclaw/openclaw.json` оновленою схемою.

Gateway також автоматично запускає міграції doctor під час запуску, коли виявляє
застарілий формат конфігурації, тож застарілі конфіги виправляються без ручного втручання.
Міграції сховища cron виконуються через `openclaw doctor --fix`.

Поточні міграції:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → верхньорівневий `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- застарілі `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Для каналів з іменованими `accounts`, але з залишковими однокористувацькими значеннями каналу верхнього рівня, перемістити ці значення рівня облікового запису до просунутого облікового запису, обраного для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- видалити `browser.relayBindHost` (застаріле налаштування relay для extension)

Попередження doctor також містять рекомендації щодо типового облікового запису для багатокористувацьких каналів:

- Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
- Якщо `channels.<channel>.defaultAccount` задано як невідомий ID облікового запису, doctor попереджає та перелічує налаштовані ID облікових записів.

### 2b) Перевизначення постачальника OpenCode

Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`,
це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`.
Через це моделі можуть використовувати неправильний API або мати нульову вартість. Doctor попереджає, щоб ви
могли прибрати перевизначення й відновити маршрутизацію API та вартість для кожної моделі.

### 2c) Міграція browser і готовність Chrome MCP

Якщо конфігурація browser досі вказує на видалений шлях розширення Chrome, doctor
нормалізує її до поточної host-local моделі підключення Chrome MCP:

- `browser.profiles.*.driver: "extension"` стає `"existing-session"`
- `browser.relayBindHost` видаляється

Doctor також перевіряє host-local шлях Chrome MCP, коли ви використовуєте `defaultProfile:
"user"` або налаштований профіль `existing-session`:

- перевіряє, чи встановлено Google Chrome на тому самому хості для типових
  профілів автопідключення
- перевіряє виявлену версію Chrome й попереджає, якщо вона нижча за Chrome 144
- нагадує увімкнути remote debugging на сторінці inspect у браузері (наприклад
  `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  або `edge://inspect/#remote-debugging`)

Doctor не може ввімкнути це налаштування в Chrome за вас. Host-local Chrome MCP
досі потребує такого:

- браузер на базі Chromium 144+ на хості gateway/node
- браузер запущений локально
- у цьому браузері увімкнено remote debugging
- схвалено перший запит на згоду підключення в браузері

Готовність тут стосується лише локальних передумов для підключення. Existing-session зберігає
поточні обмеження маршруту Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF,
перехоплення завантажень і пакетні дії, як і раніше, потребують керованого
browser або raw CDP profile.

Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших
headless-потоків. Вони й надалі використовують raw CDP.

### 2d) TLS-передумови OAuth

Коли налаштовано профіль OpenAI Codex OAuth, doctor перевіряє endpoint
авторизації OpenAI, щоб упевнитися, що локальний стек TLS Node/OpenSSL може
перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат),
doctor виводить рекомендації щодо виправлення для конкретної платформи. У macOS з Node, встановленим через Homebrew,
зазвичай виправленням є `brew postinstall ca-certificates`. З `--deep` перевірка
виконується, навіть якщо gateway справний.

### 2c) Перевизначення постачальника Codex OAuth

Якщо ви раніше додали застарілі налаштування транспорту OpenAI у
`models.providers.openai-codex`, вони можуть затінити вбудований шлях
постачальника Codex OAuth, який новіші випуски використовують автоматично. Doctor
попереджає, коли бачить ці старі транспортні налаштування поруч із Codex OAuth, щоб ви
могли прибрати або переписати застаріле транспортне перевизначення і повернути
вбудовану маршрутизацію/резервну поведінку. Користувацькі проксі та перевизначення лише для заголовків
і далі підтримуються та не викликають цього попередження.

### 3) Міграції застарілого стану (розмітка диска)

Doctor може мігрувати старіші розмітки на диску до поточної структури:

- Сховище сесій + transcripts:
  - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
- Каталог agent:
  - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
- Стан автентифікації WhatsApp (Baileys):
  - із застарілого `~/.openclaw/credentials/*.json` (крім `oauth.json`)
  - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID облікового запису: `default`)

Ці міграції є найкращими можливими та ідемпотентними; doctor виведе попередження, якщо
залишить якісь застарілі каталоги як резервні копії. Gateway/CLI також автоматично мігрує
застарілі sessions + каталог agent під час запуску, тож history/auth/models потрапляють у
шлях для конкретного агента без ручного запуску doctor. Автентифікація WhatsApp навмисно
мігрується лише через `openclaw doctor`. Нормалізація provider/provider-map Talk тепер
порівнює за структурною рівністю, тож відмінності лише в порядку ключів більше не викликають
повторних порожніх змін `doctor --fix`.

### 3a) Міграції застарілих маніфестів плагінів

Doctor сканує всі встановлені маніфести плагінів на наявність застарілих ключів
можливостей верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Якщо їх знайдено, він пропонує перемістити їх до об’єкта `contracts`
і переписати файл маніфесту на місці. Ця міграція ідемпотентна;
якщо ключ `contracts` уже містить ті самі значення, застарілий ключ видаляється
без дублювання даних.

### 3b) Міграції застарілого сховища cron

Doctor також перевіряє сховище cron job (`~/.openclaw/cron/jobs.json` типово,
або `cron.store`, якщо перевизначено) на старі форми завдань, які scheduler досі
приймає для сумісності.

Поточні очищення cron включають:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
- поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- псевдоніми delivery `provider` у payload → явний `delivery.channel`
- прості застарілі резервні webhook-завдання `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

Doctor автоматично мігрує завдання `notify: true`, лише якщо може зробити це без
зміни поведінки. Якщо завдання поєднує застарілий резервний notify з наявним
режимом delivery, відмінним від webhook, doctor попереджає й залишає це завдання
для ручної перевірки.

### 3c) Очищення блокувань сесій

Doctor сканує каталог сесій кожного агента на наявність застарілих файлів блокування запису —
файлів, що залишилися після аварійного завершення сесії. Для кожного знайденого файла блокування він повідомляє:
шлях, PID, чи PID іще активний, вік блокування та чи
вважається воно застарілим (мертвий PID або старше 30 хвилин). У режимі `--fix` / `--repair`
він видаляє застарілі файли блокування автоматично; в іншому разі лише друкує примітку та
просить вас повторно запустити команду з `--fix`.

### 4) Перевірки цілісності стану (збереження сесій, маршрутизація та безпека)

Каталог стану — це операційний стовбур системи. Якщо він зникне, ви втратите
sessions, credentials, logs і config (якщо у вас немає резервних копій деінде).

Doctor перевіряє:

- **Каталог state відсутній**: попереджає про катастрофічну втрату стану, пропонує відтворити
  каталог і нагадує, що не може відновити відсутні дані.
- **Права доступу до каталогу state**: перевіряє можливість запису; пропонує виправити права
  (і виводить підказку `chown`, якщо виявлено невідповідність власника/групи).
- **Каталог state у macOS із хмарною синхронізацією**: попереджає, коли state розміщено в iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або
  `~/Library/CloudStorage/...`, оскільки шляхи з резервним синхронізуванням можуть спричиняти повільніший I/O
  та гонки блокувань/синхронізації.
- **Каталог state на Linux у SD або eMMC**: попереджає, коли state вказує на джерело монтування `mmcblk*`,
  оскільки випадковий I/O на SD або eMMC може бути повільнішим і сильніше зношувати носій
  під час запису сесій і credentials.
- **Каталоги сесій відсутні**: `sessions/` і каталог сховища сесій є
  необхідними для збереження history та уникнення збоїв `ENOENT`.
- **Невідповідність transcript**: попереджає, коли для останніх записів сесій бракує
  файлів transcript.
- **Основна сесія “1-line JSONL”**: позначає випадки, коли основний transcript має лише один
  рядок (історія не накопичується).
- **Кілька каталогів state**: попереджає, коли існує кілька каталогів `~/.openclaw` у різних
  домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує на інше місце (історія може
  розділитися між інсталяціями).
- **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує вам запускати
  його на віддаленому хості (state зберігається там).
- **Права доступу до файла конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json`
  доступний для читання групою/усіма й пропонує обмежити доступ до `600`.

### 5) Стан автентифікації моделей (строк дії OAuth)

Doctor перевіряє профілі OAuth у сховищі автентифікації, попереджає, коли строк дії токенів
добігає кінця або вже вичерпано, і може оновлювати їх, коли це безпечно. Якщо профіль
Anthropic OAuth/token застарів, він пропонує Anthropic API key або
шлях із setup-token Anthropic.
Запити на оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive`
пропускає спроби оновлення.

Коли оновлення OAuth остаточно завершується невдачею (наприклад `refresh_token_reused`,
`invalid_grant` або постачальник вимагає повторного входу), doctor повідомляє,
що потрібна повторна автентифікація, і виводить точну команду
`openclaw models auth login --provider ...`, яку треба виконати.

Doctor також повідомляє про профілі автентифікації, які тимчасово непридатні через:

- короткі cooldown-и (rate limits/timeouts/auth failures)
- триваліші вимкнення (помилки billing/credit)

### 6) Перевірка моделі hooks

Якщо задано `hooks.gmail.model`, doctor перевіряє посилання на модель у
каталозі та allowlist і попереджає, якщо її не вдасться знайти або вона заборонена.

### 7) Відновлення образу sandbox

Коли sandbox увімкнено, doctor перевіряє Docker-образи та пропонує зібрати їх або
перейти на застарілі назви, якщо поточний образ відсутній.

### 7b) Runtime-залежності вбудованих плагінів

Doctor перевіряє, чи присутні runtime-залежності вбудованих плагінів (наприклад
пакети runtime плагіна Discord) у корені інсталяції OpenClaw.
Якщо якихось бракує, doctor повідомляє про пакети та встановлює їх у режимі
`openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Міграції служб gateway і підказки з очищення

Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і
пропонує видалити їх та встановити службу OpenClaw з поточним портом gateway.
Він також може сканувати наявність додаткових схожих на gateway служб і виводити підказки з очищення.
Іменовані профілем служби gateway OpenClaw вважаються повноцінними й не
позначаються як “додаткові”.

### 8b) Стартова міграція Matrix

Коли обліковий запис каналу Matrix має очікувану або застосовну міграцію застарілого стану,
doctor (у режимі `--fix` / `--repair`) створює знімок до міграції, а потім
запускає кроки міграції в режимі best-effort: міграцію застарілого стану Matrix і підготовку
застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки журналюються, і
запуск триває. У режимі лише читання (`openclaw doctor` без `--fix`) цю перевірку
повністю пропущено.

### 9) Попередження безпеки

Doctor виводить попередження, коли постачальник відкритий для DM без allowlist,
або коли політику налаштовано в небезпечний спосіб.

### 10) systemd linger (Linux)

Якщо використовується користувацька служба systemd, doctor перевіряє, що linger увімкнено, щоб
gateway продовжував працювати після виходу із системи.

### 11) Стан workspace (Skills, плагіни та застарілі каталоги)

Doctor друкує зведення про стан workspace для типового агента:

- **Стан Skills**: підраховує доступні, ті що мають відсутні вимоги, і заблоковані allowlist навички.
- **Застарілі каталоги workspace**: попереджає, коли `~/openclaw` або інші застарілі каталоги workspace
  існують поруч із поточним workspace.
- **Стан плагінів**: підраховує завантажені/вимкнені/помилкові плагіни; перелічує ID плагінів для будь-яких
  помилок; повідомляє про можливості bundle-плагінів.
- **Попередження про сумісність плагінів**: позначає плагіни, що мають проблеми сумісності з
  поточним runtime.
- **Діагностика плагінів**: виводить усі попередження або помилки під час завантаження, які видав
  реєстр плагінів.

### 11b) Розмір bootstrap-файлів

Doctor перевіряє, чи bootstrap-файли workspace (наприклад `AGENTS.md`,
`CLAUDE.md` або інші ін’єктовані контекстні файли) не наблизилися або не перевищили налаштований
бюджет символів. Він повідомляє для кожного файла необроблену та ін’єктовану кількість символів,
відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість ін’єктованих
символів як частку від загального бюджету. Коли файли обрізано або вони близькі до межі,
doctor виводить поради щодо налаштування `agents.defaults.bootstrapMaxChars`
та `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Автодоповнення оболонки

Doctor перевіряє, чи встановлено tab completion для поточної оболонки
(zsh, bash, fish або PowerShell):

- Якщо профіль оболонки використовує повільний шаблон динамічного completion
  (`source <(openclaw completion ...)`), doctor оновлює його до швидшого
  варіанта з кешованим файлом.
- Якщо completion налаштовано у профілі, але файл кешу відсутній,
  doctor автоматично регенерує кеш.
- Якщо completion взагалі не налаштовано, doctor пропонує встановити його
  (лише в інтерактивному режимі; пропускається з `--non-interactive`).

Щоб вручну регенерувати кеш, виконайте `openclaw completion --write-state`.

### 12) Перевірки автентифікації gateway (локальний токен)

Doctor перевіряє готовність автентифікації локального токена gateway.

- Якщо для режиму токена потрібен токен і джерела токена немає, doctor пропонує згенерувати його.
- Якщо `gateway.auth.token` керується через SecretRef, але недоступний, doctor попереджає й не перезаписує його звичайним текстом.
- `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано SecretRef для токена.

### 12b) Виправлення в режимі лише читання з урахуванням SecretRef

Деяким потокам відновлення потрібно перевіряти налаштовані credentials без послаблення runtime-поведінки fail-fast.

- `openclaw doctor --fix` тепер використовує ту саму модель зведення SecretRef лише для читання, що й команди сімейства status, для цільових виправлень конфігурації.
- Приклад: виправлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані бота, якщо вони доступні.
- Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що credential налаштовано, але він недоступний, і пропускає автоматичне визначення замість аварійного завершення або хибного повідомлення про відсутній токен.

### 13) Перевірка справності gateway + перезапуск

Doctor запускає перевірку справності й пропонує перезапустити gateway, якщо той
виглядає несправним.

### 13b) Готовність memory search

Doctor перевіряє, чи готовий налаштований постачальник embedding для memory search
для типового агента. Поведінка залежить від налаштованого backend і provider:

- **QMD backend**: перевіряє, чи доступний і чи може запускатися двійковий файл `qmd`.
  Якщо ні — виводить рекомендації з виправлення, включно з npm-пакетом і варіантом ручного шляху до двійкового файла.
- **Явний локальний provider**: перевіряє наявність локального файла моделі або розпізнаваної
  віддаленої/доступної для завантаження URL моделі. Якщо його немає, пропонує перейти на віддаленого provider.
- **Явний віддалений provider** (`openai`, `voyage` тощо): перевіряє, чи є API key
  у середовищі або сховищі автентифікації. Якщо бракує, виводить практичні підказки для виправлення.
- **Auto provider**: спочатку перевіряє доступність локальної моделі, а потім пробує кожного віддаленого
  provider у порядку auto-selection.

Коли доступний результат перевірки gateway (gateway був справний на момент
перевірки), doctor зіставляє цей результат із конфігурацією, видимою CLI, і зазначає
будь-які розбіжності.

Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding у runtime.

### 14) Попередження про стан каналів

Якщо gateway справний, doctor виконує перевірку стану каналів і повідомляє
про попередження з рекомендованими виправленнями.

### 15) Аудит конфігурації supervisor + відновлення

Doctor перевіряє встановлену конфігурацію supervisor (launchd/systemd/schtasks) на
відсутність або застарілі типові значення (наприклад залежності systemd від network-online і
затримку перезапуску). Коли виявляється невідповідність, він рекомендує оновлення та може
переписати файл служби/завдання відповідно до поточних типових значень.

Примітки:

- `openclaw doctor` запитує підтвердження перед переписуванням конфігурації supervisor.
- `openclaw doctor --yes` приймає типові запити на виправлення.
- `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
- `openclaw doctor --repair --force` перезаписує користувацькі конфігурації supervisor.
- Якщо для автентифікації токена потрібен токен і `gateway.auth.token` керується через SecretRef, встановлення/відновлення служби doctor перевіряє SecretRef, але не зберігає розв’язані значення токенів у відкритому тексті в метаданих середовища служби supervisor.
- Якщо для автентифікації токена потрібен токен, а налаштований token SecretRef не розв’язується, doctor блокує шлях встановлення/відновлення та надає практичні вказівки.
- Якщо одночасно налаштовано `gateway.auth.token` і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/відновлення, доки режим не буде задано явно.
- Для користувацьких модулів systemd у Linux перевірки розходження токенів у doctor тепер включають як джерела `Environment=`, так і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
- Ви завжди можете примусово виконати повний перезапис через `openclaw gateway install --force`.

### 16) Діагностика runtime gateway + портів

Doctor перевіряє runtime служби (PID, останній статус виходу) і попереджає, коли
службу встановлено, але вона фактично не працює. Він також перевіряє конфлікти
портів gateway (типово `18789`) і повідомляє про ймовірні причини (gateway уже
працює, SSH tunnel).

### 17) Найкращі практики runtime gateway

Doctor попереджає, коли служба gateway працює на Bun або через шлях Node, керований менеджером версій
(`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp і Telegram потребують Node,
а шляхи менеджерів версій можуть ламатися після оновлень, оскільки служба не
завантажує ініціалізацію вашої оболонки. Doctor пропонує перейти на системну інсталяцію Node, коли
вона доступна (Homebrew/apt/choco).

### 18) Запис конфігурації + метадані майстра

Doctor зберігає всі зміни конфігурації та проставляє метадані майстра, щоб зафіксувати
запуск doctor.

### 19) Поради щодо workspace (резервні копії + memory system)

Doctor пропонує memory system для workspace, якщо її немає, і виводить пораду щодо резервного копіювання,
якщо workspace ще не перебуває під git.

Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб ознайомитися з повним посібником зі
структури workspace та резервного копіювання через git (рекомендовано приватний GitHub або GitLab).
