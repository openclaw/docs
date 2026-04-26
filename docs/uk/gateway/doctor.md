---
read_when:
    - Додавання або змінення міграцій doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда Doctor: перевірки стану, міграції конфігурації та кроки відновлення'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T08:15:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` — це інструмент відновлення та міграції для OpenClaw. Він виправляє застарілу конфігурацію/стан, перевіряє стан системи та надає практичні кроки для відновлення.

## Швидкий старт

```bash
openclaw doctor
```

### Безголовий режим і режими автоматизації

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Прийняти типові значення без запитів (зокрема кроки відновлення перезапуску/служб/пісочниці, якщо застосовно).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Застосувати рекомендовані виправлення без запитів (виправлення + перезапуски там, де це безпечно).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Також застосувати агресивні виправлення (перезаписує користувацькі конфігурації супервізора).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запустити без запитів і застосовувати лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії з перезапуском/службами/пісочницею, які потребують підтвердження людиною. Міграції застарілого стану виконуються автоматично, якщо їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Просканувати системні служби на наявність додаткових інсталяцій Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спочатку відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (коротко)

<AccordionGroup>
  <Accordion title="Стан, UI та оновлення">
    - Необов’язкове попереднє оновлення для git-інсталяцій (лише в інтерактивному режимі).
    - Перевірка актуальності протоколу UI (перебудовує Control UI, якщо схема протоколу новіша).
    - Перевірка стану + запит на перезапуск.
    - Зведення стану Skills (доступні/відсутні/заблоковані) і стану Plugin.
  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk зі старих пласких полів `talk.*` до `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про перекриття Codex OAuth (`models.providers.openai-codex`).
    - Перевірка передумов TLS для OAuth OpenAI Codex OAuth profiles.
    - Міграція застарілого стану на диску (sessions/каталог agent/автентифікація WhatsApp).
    - Міграція ключів контрактів маніфесту застарілого Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища Cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, `provider` у payload, прості резервні завдання Webhook з `notify: true`).
    - Міграція застарілої policy виконання agent до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файлів блокування сесій і очищення застарілих блокувань.
    - Відновлення транскриптів сесій для дубльованих гілок prompt-rewrite, створених у збірках 2026.4.24, яких це стосується.
    - Перевірки цілісності стану та прав доступу (sessions, transcripts, каталог стану).
    - Перевірки прав доступу до файлу конфігурації (`chmod 600`) при локальному запуску.
    - Стан автентифікації моделей: перевіряє строк дії OAuth, може оновлювати токени, строк дії яких спливає, і повідомляє про стани cooldown/disabled для auth-profile.
    - Виявлення додаткового каталогу workspace (`~/openclaw`).
  </Accordion>
  <Accordion title="Gateway, служби та супервізори">
    - Відновлення образу пісочниці, якщо ізоляція ввімкнена.
    - Міграція застарілих служб і виявлення додаткових Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки середовища виконання Gateway (службу встановлено, але вона не запущена; кешована мітка launchd).
    - Попередження про стан каналів (зондуються з запущеного Gateway).
    - Аудит конфігурації супервізора (launchd/systemd/schtasks) з необов’язковим відновленням.
    - Перевірки найкращих практик середовища виконання Gateway (Node проти Bun, шляхи менеджерів версій).
    - Діагностика конфліктів порту Gateway (типово `18789`).
  </Accordion>
  <Accordion title="Автентифікація, безпека та pairing">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для локального режиму токенів (пропонує створити токен, якщо джерела токена немає; не перезаписує конфігурації token SecretRef).
    - Виявлення проблем під час pairing пристроїв (очікувані перші запити на pairing, очікувані підвищення ролі/scope, застарілий дрейф локального кешу токенів пристрою та дрейф автентифікації записів pairing).
  </Accordion>
  <Accordion title="Робочий простір і оболонка">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу workspace (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка стану завершення команд оболонки та автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера вбудовувань для пошуку в пам’яті (локальна модель, ключ віддаленого API або бінарний файл QMD).
    - Перевірки source-інсталяції (невідповідність pnpm workspace, відсутні ресурси UI, відсутній бінарний файл tsx).
    - Записує оновлену конфігурацію та метадані майстра.
  </Accordion>
</AccordionGroup>

## Backfill і reset у Dreams UI

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для grounded dreaming workflow. Ці дії використовують RPC-методи в стилі doctor для gateway, але вони **не** є частиною відновлення/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному workspace, запускає grounded REM diary pass і записує оборотні записи backfill у `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише ті записи щоденника backfill, що мають відповідну позначку.
- **Clear Grounded** видаляє лише staged grounded-only short-term записи, які походять з історичного відтворення і ще не накопичили live recall або daily support.

Чого вони самі по собі **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не додають автоматично grounded candidates до live short-term promotion store, якщо ви явно не запустите спочатку staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайний deep promotion lane, замість цього використовуйте CLI-потік:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це додає grounded durable candidates до short-term dreaming store, зберігаючи `DREAMS.md` як поверхню для перегляду.

## Детальна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-інсталяції)">
    Якщо це git checkout і doctor запущено в інтерактивному режимі, він пропонує виконати оновлення (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх до поточної схеми.

    Це також включає застарілі пласкі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у мапу провайдерів.

  </Accordion>
  <Accordion title="2. Міграції ключів застарілої конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися і просять вас виконати `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі було знайдено.
    - Покажe міграцію, яку він застосував.
    - Перезапише `~/.openclaw/openclaw.json` за оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час старту, коли виявляє застарілий формат конфігурації, тому застарілі конфігурації відновлюються без ручного втручання. Міграції сховища завдань Cron обробляються командою `openclaw doctor --fix`.

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
    - `messages.tts.provider: "edge"` і `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` і `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` і `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` і `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Для каналів з іменованими `accounts`, але із застарілими значеннями каналу верхнього рівня для одного облікового запису, перемістити ці значення, обмежені обліковим записом, до вибраного promoted account для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну named/default ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видалити `browser.relayBindHost` (застарілий параметр relay для розширення)

    Попередження doctor також містять рекомендації щодо default account для багатокористувацьких каналів:

    - Якщо налаштовано два або більше записи `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що fallback routing може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` вказує на невідомий ID облікового запису, doctor попереджає про це і показує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі на неправильний API або обнулити вартість. Doctor попереджає про це, щоб ви могли прибрати перевизначення і відновити маршрутизацію API та вартість для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера та готовність Chrome MCP">
    Якщо ваша конфігурація браузера все ще вказує на вилучений шлях розширення Chrome, doctor нормалізує її до поточної host-local моделі підключення Chrome MCP:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє host-local шлях Chrome MCP, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому ж хості для типових профілів автопідключення
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути remote debugging на сторінці inspect у браузері (наприклад, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути налаштування на боці Chrome за вас. Host-local Chrome MCP, як і раніше, потребує:

    - браузер на базі Chromium версії 144+ на хості gateway/node
    - браузер, запущений локально
    - увімкнений remote debugging у цьому браузері
    - підтвердження першого запиту згоди на attach у браузері

    Готовність тут стосується лише локальних передумов для attach. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, як і раніше, потребують керованого браузера або профілю raw CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують raw CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor виконує перевірку endpoint авторизації OpenAI, щоб упевнитися, що локальний стек TLS Node/OpenSSL може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або self-signed сертифікат), doctor виводить платформозалежні рекомендації щодо виправлення. На macOS з Node, встановленим через Homebrew, виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка виконується, навіть якщо Gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо ви раніше додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть перекривати вбудований шлях провайдера Codex OAuth, який новіші релізи використовують автоматично. Doctor попереджає, коли бачить ці старі транспортні налаштування поруч із Codex OAuth, щоб ви могли видалити або переписати застаріле транспортне перевизначення і повернути вбудовану поведінку маршрутизації/fallback. Користувацькі проксі та перевизначення лише заголовків, як і раніше, підтримуються й не викликають цього попередження.
  </Accordion>
  <Accordion title="2f. Попередження про маршрути Plugin Codex">
    Коли ввімкнено вбудований Plugin Codex, doctor також перевіряє, чи refs первинної моделі `openai-codex/*` усе ще резолвляться через типовий раннер Pi. Така комбінація коректна, якщо ви хочете автентифікацію Codex OAuth/subscription через Pi, але її легко сплутати з нативним harness app-server Codex. Doctor попереджає про це й вказує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, тому що обидва маршрути коректні:

    - `openai-codex/*` + Pi означає «використовувати автентифікацію Codex OAuth/subscription через звичайний раннер OpenClaw».
    - `openai/*` + `runtime: "codex"` означає «виконати вбудований turn через нативний app-server Codex».
    - `/codex ...` означає «керувати нативною розмовою Codex із чату або прив’язати її».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

    Якщо з’являється це попередження, виберіть маршрут, який ви мали на увазі, і вручну відредагуйте конфігурацію. Залишайте попередження як є, якщо Codex OAuth через Pi використовується навмисно.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (структура на диску)">
    Doctor може мігрувати старі структури на диску до поточної структури:

    - Сховище сесій + transcripts:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог agent:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілого `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий id облікового запису: `default`)

    Ці міграції виконуються за принципом best-effort та є ідемпотентними; doctor виведе попередження, якщо залишить будь-які застарілі каталоги як резервні копії. Gateway/CLI також автоматично мігрує застарілі sessions + каталог agent під час запуску, тож history/auth/models потрапляють до шляху конкретного agent без ручного запуску doctor. Автентифікація WhatsApp навмисно мігрується лише через `openclaw doctor`. Нормалізація provider/provider-map Talk тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не спричиняють повторних порожніх змін `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів Plugin">
    Doctor сканує всі встановлені маніфести Plugin на наявність застарілих ключів можливостей верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Якщо їх знайдено, він пропонує перенести їх до об’єкта `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже містить ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища Cron">
    Doctor також перевіряє сховище завдань Cron (`~/.openclaw/cron/jobs.json` типово або `cron.store`, якщо перевизначено) на наявність старих форм завдань, які планувальник усе ще приймає для сумісності.

    Поточні очищення Cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми delivery `provider` у payload → явний `delivery.channel`
    - прості застарілі резервні завдання Webhook з `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли це можна зробити без зміни поведінки. Якщо завдання поєднує застарілий резервний notify із наявним режимом delivery, що не є webhook, doctor попереджає та залишає це завдання для ручної перевірки.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сесій">
    Doctor сканує каталог сесій кожного agent на наявність застарілих write-lock файлів — файлів, що залишилися після аварійного завершення сесії. Для кожного знайденого lock-файлу він повідомляє: шлях, PID, чи PID ще активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі lock-файли; інакше друкує примітку та інструктує вас повторно запустити команду з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілок транскриптів сесій">
    Doctor сканує JSONL-файли сесій agent на наявність дубльованої форми гілок, створеної помилкою переписування prompt transcript у 2026.4.24: покинутий user turn із внутрішнім runtime context OpenClaw плюс активний sibling з тим самим видимим user prompt. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файлу поруч з оригіналом і переписує transcript на активну гілку, щоб history Gateway і readers пам’яті більше не бачили дубльованих turn.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сесій, маршрутизація та безпека)">
    Каталог стану — це операційний стовбур системи. Якщо він зникне, ви втратите сесії, облікові дані, журнали та конфігурацію (якщо в іншому місці немає резервних копій).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує відновити каталог і нагадує, що не може відновити втрачені дані.
    - **Права доступу до каталогу стану**: перевіряє можливість запису; пропонує виправити права доступу (і виводить підказку `chown`, якщо виявлено невідповідність owner/group).
    - **Каталог стану macOS, синхронізований із хмарою**: попереджає, якщо стан резолвиться в `iCloud Drive` (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, тому що шляхи із синхронізацією можуть спричиняти повільніший I/O та гонки блокування/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, якщо стан резолвиться до джерела монтування `mmcblk*`, оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сесій і облікових даних.
    - **Каталоги сесій відсутні**: `sessions/` і каталог сховища сесій потрібні для збереження history і уникнення збоїв `ENOENT`.
    - **Невідповідність transcript**: попереджає, коли в нещодавніх записах сесій відсутні файли transcript.
    - **Основна сесія "1-line JSONL"**: позначає випадки, коли основний transcript містить лише один рядок (history не накопичується).
    - **Кілька каталогів стану**: попереджає, коли існує кілька каталогів `~/.openclaw` у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує на інше місце (history може розділятися між інсталяціями).
    - **Нагадування про remote mode**: якщо `gateway.mode=remote`, doctor нагадує запустити його на віддаленому хості (саме там зберігається стан).
    - **Права доступу до файлу конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/всім, і пропонує обмежити права до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделей (строк дії OAuth)">
    Doctor перевіряє профілі OAuth у сховищі автентифікації, попереджає, коли строк дії токенів спливає/сплив, і може оновлювати їх, коли це безпечно. Якщо профіль Anthropic OAuth/token застарів, він пропонує використати ключ Anthropic API або шлях Anthropic setup-token. Запити на оновлення з’являються лише в інтерактивному режимі (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно завершується невдачею (наприклад, `refresh_token_reused`, `invalid_grant` або провайдер повідомляє, що потрібно знову увійти), doctor повідомляє, що потрібна повторна автентифікація, і виводить точну команду `openclaw models auth login --provider ...`, яку слід виконати.

    Doctor також повідомляє про профілі автентифікації, які тимчасово непридатні для використання через:

    - короткі cooldown (rate limits/timeouts/auth failures)
    - довші вимкнення (billing/credit failures)

  </Accordion>
  <Accordion title="6. Валідація моделі hooks">
    Якщо встановлено `hooks.gmail.model`, doctor перевіряє reference моделі за каталогом і allowlist та попереджає, коли її не вдається резолвити або вона не дозволена.
  </Accordion>
  <Accordion title="7. Відновлення образу sandbox">
    Коли sandboxing увімкнено, doctor перевіряє Docker-образи й пропонує зібрати їх або переключитися на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Runtime-залежності вбудованого Plugin">
    Doctor перевіряє runtime-залежності лише для вбудованих Plugin, які активні в поточній конфігурації або ввімкнені типовим значенням у їхньому вбудованому маніфесті, наприклад `plugins.entries.discord.enabled: true`, застаріле `channels.discord.enabled: true` або вбудований провайдер, увімкнений типово. Якщо чогось бракує, doctor повідомляє про пакунки й установлює їх у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Зовнішні Plugin, як і раніше, використовують `openclaw plugins install` / `openclaw plugins update`; doctor не встановлює залежності для довільних шляхів Plugin.

    Gateway і локальний CLI також можуть за потреби відновлювати runtime-залежності активних вбудованих Plugin перед імпортом вбудованого Plugin. Ці встановлення обмежені коренем встановлення runtime Plugin, виконуються з вимкненими scripts, не записують package lock і захищені блокуванням install-root, щоб одночасні запуски CLI або Gateway не змінювали те саме дерево `node_modules` одночасно.

  </Accordion>
  <Accordion title="8. Міграції служб Gateway і підказки з очищення">
    Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити службу OpenClaw з використанням поточного порту gateway. Він також може сканувати додаткові служби, схожі на gateway, і виводити підказки з очищення. Іменовані за профілем служби gateway OpenClaw вважаються повноцінними і не позначаються як «додаткові».
  </Accordion>
  <Accordion title="8b. Стартова міграція Matrix">
    Коли обліковий запис каналу Matrix має очікувану або придатну до виконання міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок стану до міграції, а потім запускає кроки міграції best-effort: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки журналюються, а запуск триває. У режимі лише для читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Pairing пристроїв і дрейф автентифікації">
    Doctor тепер перевіряє стан pairing пристроїв як частину звичайної перевірки справності.

    Що він повідомляє:

    - очікувані перші запити на pairing
    - очікувані підвищення ролей для вже спарених пристроїв
    - очікувані підвищення scope для вже спарених пристроїв
    - виправлення невідповідності публічного ключа, коли id пристрою все ще збігається, але ідентичність пристрою більше не збігається зі схваленим записом
    - у спарених записах немає активного токена для схваленої ролі
    - у токенів спарених записів scope відхилилися від базової лінії схваленого pairing
    - локальні кешовані записи токенів пристрою для поточної машини, які передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не схвалює запити на pairing автоматично і не виконує автоматичну ротацію токенів пристроїв. Натомість він виводить точні наступні кроки:

    - переглянути очікувані запити за допомогою `openclaw devices list`
    - схвалити точний запит за допомогою `openclaw devices approve <requestId>`
    - виконати ротацію нового токена за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видалити застарілий запис і схвалити його знову за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину «вже спарено, але все одно вимагається pairing»: тепер doctor розрізняє перший pairing, очікувані підвищення ролі/scope та дрейф застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли провайдер відкритий для DM без allowlist або коли policy налаштовано небезпечним чином.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запуск виконується як користувацька служба systemd, doctor перевіряє, що linger увімкнено, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан workspace (Skills, Plugin і застарілі каталоги)">
    Doctor виводить зведення стану workspace для типового agent:

    - **Стан Skills**: кількість доступних, тих, яким бракує вимог, і заблокованих allowlist Skills.
    - **Застарілі каталоги workspace**: попереджає, якщо `~/openclaw` або інші застарілі каталоги workspace існують поруч із поточним workspace.
    - **Стан Plugin**: кількість увімкнених/вимкнених/помилкових Plugin; перелік ID Plugin для всіх помилок; звіт про можливості bundle Plugin.
    - **Попередження про сумісність Plugin**: позначає Plugin, що мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує всі попередження або помилки під час завантаження, які видає реєстр Plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Doctor перевіряє, чи наближаються bootstrap-файли workspace (наприклад `AGENTS.md`, `CLAUDE.md` або інші інжектовані контекстні файли) до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файлу кількість сирих та інжектованих символів, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість інжектованих символів як частку від загального бюджету. Коли файли обрізаються або наближаються до ліміту, doctor виводить поради щодо налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Завершення команд оболонки">
    Doctor перевіряє, чи встановлено tab completion для поточної оболонки (zsh, bash, fish або PowerShell):

    - Якщо профіль оболонки використовує повільний динамічний шаблон completion (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо completion налаштовано в профілі, але кешований файл відсутній, doctor автоматично відновлює кеш.
    - Якщо completion взагалі не налаштовано, doctor пропонує встановити його (лише в інтерактивному режимі; пропускається з `--non-interactive`).

    Використайте `openclaw completion --write-state`, щоб вручну згенерувати кеш повторно.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність автентифікації локального токена gateway.

    - Якщо режиму токена потрібен токен і жодного джерела токена не існує, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується через SecretRef, але недоступний, doctor попереджає й не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано токен SecretRef.

  </Accordion>
  <Accordion title="12b. Виправлення з урахуванням SecretRef у режимі лише читання">
    Для деяких потоків виправлення потрібно перевірити налаштовані облікові дані, не послаблюючи при цьому fail-fast поведінку runtime.

    - `openclaw doctor --fix` тепер використовує ту саму read-only модель зведення SecretRef, що й команди сімейства status, для цільових виправлень конфігурації.
    - Приклад: виправлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані бота, якщо вони доступні.
    - Якщо токен Telegram-бота налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає авторозв’язання замість аварійного завершення або хибного повідомлення про відсутність токена.

  </Accordion>
  <Accordion title="13. Перевірка стану Gateway + перезапуск">
    Doctor виконує перевірку стану і пропонує перезапустити gateway, якщо той виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку в пам’яті">
    Doctor перевіряє, чи готовий налаштований провайдер embedding для пошуку в пам’яті для типового agent. Поведінка залежить від налаштованого бекенда та провайдера:

    - **Бекенд QMD**: перевіряє, чи доступний і чи може запуститися бінарний файл `qmd`. Якщо ні, виводить рекомендації з виправлення, зокрема npm-пакет і варіант ручного шляху до бінарного файла.
    - **Явний локальний провайдер**: перевіряє наявність локального файла моделі або розпізнаваної URL-адреси віддаленої/завантажуваної моделі. Якщо нічого немає, пропонує перейти на віддалений провайдер.
    - **Явний віддалений провайдер** (`openai`, `voyage` тощо): перевіряє, чи є API-ключ у середовищі або сховищі автентифікації. Якщо його немає, виводить практичні підказки для виправлення.
    - **Автопровайдер**: спочатку перевіряє доступність локальної моделі, а потім пробує кожен віддалений провайдер у порядку автопідбору.

    Якщо результат перевірки gateway доступний (gateway був справний на момент перевірки), doctor звіряє його з видимою для CLI конфігурацією і зазначає будь-яку невідповідність.

    Використайте `openclaw memory status --deep`, щоб перевірити готовність embedding під час виконання.

  </Accordion>
  <Accordion title="14. Попередження про стан каналів">
    Якщо gateway справний, doctor запускає перевірку стану каналів і повідомляє попередження разом із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит конфігурації супервізора + відновлення">
    Doctor перевіряє встановлену конфігурацію супервізора (launchd/systemd/schtasks) на відсутні або застарілі типові значення (наприклад, залежності systemd від network-online і затримку перезапуску). Коли він виявляє невідповідність, то рекомендує оновлення і може переписати файл служби/завдання до поточних типових значень.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації супервізора.
    - `openclaw doctor --yes` приймає типові запити на виправлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації супервізора.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише читання для життєвого циклу служби gateway. Він, як і раніше, повідомляє про стан служби та запускає виправлення, не пов’язані зі службами, але пропускає встановлення/запуск/перезапуск/bootstrap служби, переписування конфігурації супервізора та очищення застарілих служб, тому що цим життєвим циклом керує зовнішній супервізор.
    - Якщо автентифікація токеном вимагає токен і `gateway.auth.token` керується через SecretRef, встановлення/відновлення служби doctor перевіряє SecretRef, але не зберігає розв’язані значення токенів у відкритому тексті в метаданих середовища служби супервізора.
    - Якщо автентифікація токеном вимагає токен, а налаштований токен SecretRef не розв’язується, doctor блокує шлях встановлення/відновлення і виводить практичні рекомендації.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/відновлення, доки режим не буде явно встановлено.
    - Для користувацьких unit systemd у Linux перевірки дрейфу токена в doctor тепер охоплюють і джерела `Environment=`, і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Виправлення служби doctor відмовляються переписувати, зупиняти або перезапускати службу gateway зі старішого бінарного файла OpenClaw, якщо конфігурацію востаннє записано новішою версією. Див. [усунення проблем Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime та порту Gateway">
    Doctor перевіряє runtime служби (PID, останній статус завершення) і попереджає, якщо службу встановлено, але вона фактично не запущена. Він також перевіряє конфлікти портів на порту gateway (типово `18789`) і повідомляє ймовірні причини (gateway уже запущений, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли служба gateway працює на Bun або на керованому менеджером версій шляху Node (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp і Telegram потребують Node, а шляхи менеджерів версій можуть ламатися після оновлень, бо служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує перейти на системне встановлення Node, якщо воно доступне (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає всі зміни конфігурації та проставляє метадані майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо workspace (резервне копіювання + система пам’яті)">
    Doctor пропонує систему пам’яті workspace, якщо її немає, і виводить пораду щодо резервного копіювання, якщо workspace ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури workspace і резервного копіювання через git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення проблем Gateway](/uk/gateway/troubleshooting)
