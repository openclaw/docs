---
read_when:
    - Додавання або змінення міграцій doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки справності, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-07T01:52:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент відновлення й міграції для OpenClaw. Він виправляє застарілі конфігурацію/стан, перевіряє справність і надає практичні кроки для відновлення.

## Швидкий старт

```bash
openclaw doctor
```

### Режими без інтерфейсу та автоматизації

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Приймає стандартні значення без запитів (зокрема кроки перезапуску/сервісу/відновлення пісочниці, коли застосовно).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Застосовує рекомендовані виправлення без запитів (виправлення + перезапуски там, де це безпечно).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Також застосовує агресивні виправлення (перезаписує власні конфігурації супервізора).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запускається без запитів і застосовує лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії перезапуску/сервісу/пісочниці, які потребують підтвердження людиною. Міграції застарілого стану запускаються автоматично, коли їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканує системні сервіси на наявність додаткових встановлень Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спочатку відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (підсумок)

<AccordionGroup>
  <Accordion title="Справність, UI та оновлення">
    - Необов’язкове попереднє оновлення для встановлень із git (лише інтерактивно).
    - Перевірка актуальності протоколу UI (перезбирає Control UI, коли схема протоколу новіша).
    - Перевірка справності + запит на перезапуск.
    - Зведення стану Skills (придатні/відсутні/заблоковані) і стан Plugin.

  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих плоских полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення OAuth Codex (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Попередження про allowlist Plugin/інструментів, коли `plugins.allow` обмежувальний, але політика інструментів усе ще запитує wildcard або інструменти, що належать Plugin.
    - Міграція застарілого стану на диску (sessions/каталог agent/автентифікація WhatsApp).
    - Міграція застарілих ключів контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища cron (`jobId`, `schedule.cron`, поля доставки/payload верхнього рівня, payload `provider`, прості резервні завдання webhook `notify: true`).
    - Міграція застарілої runtime-політики agent до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли plugins увімкнено; коли `plugins.enabled=false`, застарілі посилання на Plugin вважаються інертною конфігурацією стримування та зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файлів блокування сеансів і очищення застарілих блокувань.
    - Відновлення транскриптів сеансів для дубльованих гілок переписування prompt, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для відновлення після перезапуску завислого subagent із підтримкою `--fix` для очищення застарілих прапорців перерваного відновлення, щоб startup не продовжував вважати child перерваним під час перезапуску.
    - Перевірки цілісності стану та дозволів (sessions, transcripts, state dir).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Справність автентифікації моделей: перевіряє завершення строку дії OAuth, може оновлювати токени, строк дії яких спливає, і повідомляє про стани cooldown/disabled для auth-profile.
    - Виявлення додаткового каталогу workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, сервіси та супервізори">
    - Відновлення образу пісочниці, коли sandboxing увімкнено.
    - Міграція застарілого сервісу та виявлення додаткових Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime Gateway (сервіс встановлено, але не запущено; кешована мітка launchd).
    - Попередження стану каналів (отримані з запущеного gateway).
    - Перевірки швидкості реагування WhatsApp для погіршеної справності циклу подій Gateway, коли локальні клієнти TUI все ще запущені; `--fix` зупиняє лише перевірені локальні клієнти TUI.
    - Відновлення маршрутів Codex для застарілих посилань на моделі `openai-codex/*` в основних моделях, резервних варіантах, перевизначеннях heartbeat/subagent/compaction, hooks, перевизначеннях моделей каналів і route pins сеансів; `--fix` переписує їх на `openai/*` і вибирає `agentRuntime.id: "codex"` лише коли Plugin Codex встановлений, увімкнений, надає harness `codex` і має придатний OAuth. Інакше він вибирає `agentRuntime.id: "pi"`.
    - Аудит конфігурації супервізора (launchd/systemd/schtasks) з необов’язковим відновленням.
    - Очищення середовища вбудованого proxy для сервісів gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи менеджера версій).
    - Діагностика конфліктів портів Gateway (типово `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та pairing">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує створення токена, коли немає джерела токена; не перезаписує конфігурації SecretRef токена).
    - Виявлення проблем із pairing пристроїв (очікувані запити першого pairing, очікувані підвищення role/scope, дрейф застарілого локального кешу device-token і дрейф автентифікації paired-record).

  </Accordion>
  <Accordion title="Workspace і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу workspace (попередження про обрізання/наближення до ліміту для context-файлів).
    - Перевірка готовності Skills для стандартного agent; повідомляє дозволені skills з відсутніми bins, env, config або вимогами OS, а `--fix` може вимкнути недоступні skills у `skills.entries`.
    - Перевірка стану shell completion і автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера embedding для пошуку пам’яті (локальна модель, remote API key або binary QMD).
    - Перевірки встановлення з джерел (невідповідність pnpm workspace, відсутні UI assets, відсутній binary tsx).
    - Записує оновлену конфігурацію + метадані майстра.

  </Accordion>
</AccordionGroup>

## Зворотне заповнення та скидання Dreams UI

Сцена Control UI Dreams містить дії **Backfill**, **Reset** і **Clear Grounded** для workflow grounded dreaming. Ці дії використовують RPC-методи у стилі gateway doctor, але вони **не** є частиною CLI-відновлення/міграції `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в active workspace, запускає grounded REM diary pass і записує оборотні backfill entries у `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише ці позначені backfill diary entries.
- **Clear Grounded** видаляє лише staged grounded-only short-term entries, які надійшли з historical replay і ще не накопичили live recall або daily support.

Чого вони **не** роблять самі по собі:

- вони не редагують `MEMORY.md`
- вони не запускають повні doctor migrations
- вони автоматично не stage grounded candidates у live short-term promotion store, якщо ви явно спочатку не запустите staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайну deep promotion lane, натомість використайте CLI-потік:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це stage grounded durable candidates у short-term dreaming store, залишаючи `DREAMS.md` як review surface.

## Докладна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-встановлення)">
    Якщо це checkout git і doctor запускається інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх у поточну схему.

    Це охоплює застарілі плоскі поля Talk. Поточна публічна конфігурація мовлення Talk — це `talk.provider` + `talk.providers.<provider>`, а конфігурація realtime voice — `talk.realtime.*`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у мапу провайдера та переписує застарілі селектори realtime верхнього рівня (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) у `talk.realtime`.

    Doctor також попереджає, коли `plugins.allow` не порожній, а політика інструментів використовує
    wildcard або записи інструментів, що належать Plugin. `tools.allow: ["*"]` відповідає лише інструментам
    із plugins, які фактично завантажуються; він не обходить ексклюзивний allowlist Plugin.
    Doctor записує `plugins.bundledDiscovery: "compat"` для мігрованих
    застарілих конфігурацій allowlist, щоб зберегти наявну поведінку bundled provider, а
    потім вказує на суворіше налаштування `"allowlist"`.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися й просять вас виконати `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Startup Gateway відмовляється від застарілих форматів конфігурації та просить вас запустити `openclaw doctor --fix`; він не переписує `openclaw.json` під час startup. Міграції сховища завдань Cron також обробляються командою `openclaw doctor --fix`.

    Поточні міграції:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - конфігурації налаштованих каналів без видимої політики відповіді → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` верхнього рівня
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - застарілі `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - застарілі селектори Talk реального часу верхнього рівня (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Для каналів з іменованими `accounts`, але із залишковими значеннями каналу верхнього рівня для одного облікового запису, перемістіть ці значення з областю дії облікового запису до підвищеного облікового запису, вибраного для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видалити `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для тайм-аутів повільного провайдера/моделі
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видалити `browser.relayBindHost` (застаріле налаштування ретранслятора розширення)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (запуск Gateway також пропускає провайдерів, у яких `api` задано майбутнім або невідомим значенням enum, замість аварійного завершення із закритим станом)

    Попередження doctor також містять настанови щодо типового облікового запису для багатооблікових каналів:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` задано як невідомий ID облікового запису, doctor попереджає й перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі на неправильний API або обнулити витрати. Doctor попереджає, щоб ви могли видалити перевизначення й відновити маршрутизацію API та витрати для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера й готовність Chrome MCP">
    Якщо ваша конфігурація браузера досі вказує на видалений шлях розширення Chrome, doctor нормалізує її до поточної моделі приєднання Chrome MCP на локальному хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє локальний шлях Chrome MCP на хості, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи Google Chrome установлено на тому самому хості для типових профілів автоматичного підключення
    - перевіряє виявлену версію Chrome і попереджає, коли вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці інспектування браузера (наприклад `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути для вас налаштування на боці Chrome. Локальний Chrome MCP на хості все ще потребує:

    - браузера на базі Chromium 144+ на хості gateway/node
    - локально запущеного браузера
    - увімкненого віддаленого налагодження в цьому браузері
    - схвалення першого запиту згоди на приєднання в браузері

    Готовність тут стосується лише передумов локального приєднання. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, усе ще потребують керованого браузера або raw CDP-профілю.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують raw CDP.

  </Accordion>
  <Accordion title="2d. Передумови TLS для OAuth">
    Коли налаштовано OAuth-профіль OpenAI Codex, doctor перевіряє endpoint авторизації OpenAI, щоб переконатися, що локальний стек TLS Node/OpenSSL може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor виводить настанови з виправлення для конкретної платформи. На macOS із Homebrew Node виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка виконується навіть тоді, коли gateway працює справно.
  </Accordion>
  <Accordion title="2e. Перевизначення OAuth-провайдера Codex">
    Якщо раніше ви додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть затіняти вбудований шлях OAuth-провайдера Codex, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі налаштування транспорту поруч із Codex OAuth, щоб ви могли видалити або переписати застаріле перевизначення транспорту й повернути вбудовану поведінку маршрутизації/резервування. Власні проксі та перевизначення лише заголовків і надалі підтримуються та не запускають це попередження.
  </Accordion>
  <Accordion title="2f. Відновлення маршруту Codex">
    Doctor перевіряє застарілі посилання на моделі `openai-codex/*`. Нативна маршрутизація harness Codex використовує канонічні посилання на моделі `openai/*` плюс `agentRuntime.id: "codex"`, щоб turn проходив через harness сервера застосунку Codex, а не шлях OpenClaw PI OpenAI.

    У режимі `--fix` / `--repair` doctor переписує зачеплені посилання типового агента й окремих агентів, зокрема основні моделі, резервні варіанти, перевизначення heartbeat/subagent/compaction, hooks, перевизначення моделей каналів і застарілий збережений стан маршруту сесії:

    - `openai-codex/gpt-*` стає `openai/gpt-*`.
    - Відповідний runtime агента стає `agentRuntime.id: "codex"` лише тоді, коли Codex установлено, увімкнено, він надає harness `codex` і має придатний OAuth.
    - Інакше відповідний runtime агента стає `agentRuntime.id: "pi"`.
    - Наявні списки резервних моделей зберігаються з переписаними застарілими записами; скопійовані налаштування для окремих моделей переміщуються із застарілого ключа до канонічного ключа `openai/*`.
    - Збережені session `modelProvider`/`providerOverride`, `model`/`modelOverride`, сповіщення про резервні варіанти, прив’язки auth-profile і прив’язки Codex harness відновлюються в усіх виявлених сховищах сесій агентів.
    - `/codex ...` означає «керувати або прив’язати нативну розмову Codex із чату».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

  </Accordion>
  <Accordion title="2g. Очищення маршруту сесії">
    Doctor також сканує виявлені сховища сесій агентів на наявність застарілого автоматично створеного стану маршруту після того, як ви перемістили налаштовані моделі або runtime від маршруту, що належить Plugin, наприклад Codex.

    `openclaw doctor --fix` може очистити автоматично створений застарілий стан, як-от прив’язки моделей `modelOverrideSource: "auto"`, метадані runtime model, закріплені ID harness, прив’язки сесій CLI та автоматичні перевизначення auth-profile, коли їхній власний маршрут більше не налаштовано. Явні користувацькі або застарілі вибори моделей сесії повідомляються для ручного перегляду й лишаються без змін; перемкніть їх за допомогою `/model ...`, `/new` або скиньте сесію, коли цей маршрут більше не потрібен.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (структура диска)">
    Doctor може мігрувати старіші дискові структури до поточної структури:

    - Сховище сесій + transcripts:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілих `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID типового облікового запису: `default`)

    Ці міграції виконуються за принципом best-effort і є ідемпотентними; doctor виводитиме попередження, коли залишає будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі сесії + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапили в шлях для окремого агента без ручного запуску doctor. Автентифікація WhatsApp навмисно мігрується лише через `openclaw doctor`. Нормалізація провайдера/карти провайдерів Talk тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не запускають повторні no-op зміни `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів Plugin">
    Doctor сканує всі встановлені маніфести plugin на наявність застарілих capability-ключів верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли їх знайдено, він пропонує перемістити їх до об’єкта `contracts` і переписати файл маніфесту на місці. Ця міграція є ідемпотентною; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища cron">
    Doctor також перевіряє сховище завдань cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, коли його перевизначено) на старі форми завдань, які планувальник досі приймає для сумісності.

    Поточні очищення cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми delivery у payload `provider` → явний `delivery.channel`
    - недійсні збережені sentinels cron `payload.model` (`"default"`, `"null"`, порожні рядки, JSON `null`) → видалене перевизначення моделі
    - прості застарілі резервні завдання webhook `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий резервний notify з уже наявним режимом доставки не через webhook, doctor попереджає й залишає це завдання для ручного перегляду.

    У Linux doctor також попереджає, коли crontab користувача все ще викликає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`. Цей локальний для хоста сценарій не підтримується поточною версією OpenClaw і може записувати хибні повідомлення `Gateway inactive` у `~/.openclaw/logs/whatsapp-health.log`, коли cron не може дістатися до користувацької шини systemd. Видаліть застарілий запис crontab за допомогою `crontab -e`; використовуйте `openclaw channels status --probe`, `openclaw doctor` і `openclaw gateway status` для поточних перевірок справності.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сеансів">
    Doctor сканує кожен каталог сеансів агента на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сеансу. Для кожного знайденого файлу блокування він повідомляє: шлях, PID, чи PID досі активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше за 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше виводить примітку й радить повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Виправлення гілки транскрипта сеансу">
    Doctor сканує JSONL-файли сеансів агента на дубльовану форму гілки, створену помилкою переписування транскрипта промпта від 2026.4.24: покинутий користувацький хід із внутрішнім runtime-контекстом OpenClaw плюс активний сусідній вузол із тим самим видимим користувацьким промптом. У режимі `--fix` / `--repair` doctor створює резервну копію кожного зачепленого файла поруч з оригіналом і переписує транскрипт до активної гілки, щоб історія gateway і читачі пам’яті більше не бачили дубльованих ходів.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сеансів, маршрутизація та безпека)">
    Каталог стану — це операційний стовбур мозку. Якщо він зникне, ви втратите сеанси, облікові дані, журнали й конфігурацію (якщо не маєте резервних копій деінде).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Синхронізований із хмарою каталог стану macOS**: попереджає, коли стан розміщено в iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, бо шляхи з синхронізацією можуть спричиняти повільніше I/O та перегони блокування/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розміщено на джерелі монтування `mmcblk*`, бо випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сеансів та облікових даних.
    - **Каталоги сеансів відсутні**: `sessions/` і каталог сховища сеансів потрібні, щоб зберігати історію та уникати аварій `ENOENT`.
    - **Невідповідність транскрипта**: попереджає, коли в нещодавніх записах сеансів бракує файлів транскриптів.
    - **Головний сеанс "1-line JSONL"**: позначає випадки, коли головний транскрипт має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли кілька папок `~/.openclaw` існують у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділитися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запускати його на віддаленому хості (стан зберігається там).
    - **Дозволи файла конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує посилити дозволи до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделей (закінчення OAuth)">
    Doctor перевіряє профілі OAuth у сховищі автентифікації, попереджає, коли токени скоро закінчуються або вже закінчилися, і може оновити їх, коли це безпечно. Якщо профіль Anthropic OAuth/токена застарів, він пропонує ключ Anthropic API або шлях setup-token Anthropic. Запити на оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно завершується невдачею (наприклад `refresh_token_reused`, `invalid_grant` або провайдер просить увійти знову), doctor повідомляє, що потрібна повторна автентифікація, і виводить точну команду `openclaw models auth login --provider ...`, яку треба виконати.

    Doctor також повідомляє про профілі автентифікації, тимчасово непридатні через:

    - короткі періоди очікування (ліміти частоти/тайм-аути/помилки автентифікації)
    - довші вимкнення (помилки білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Перевірка моделі hooks">
    Якщо задано `hooks.gmail.model`, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли її не вдасться розв’язати або вона заборонена.
  </Accordion>
  <Accordion title="7. Виправлення образу sandbox">
    Коли sandboxing увімкнено, doctor перевіряє образи Docker і пропонує зібрати їх або перемкнутися на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Очищення встановлення Plugin">
    Doctor видаляє застарілий, згенерований OpenClaw проміжний стан залежностей plugin у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Це охоплює застарілі згенеровані корені залежностей, старі каталоги етапу встановлення, локальне для package сміття від попереднього коду виправлення залежностей bundled-plugin, а також осиротілі або відновлені керовані npm-копії bundled `@openclaw/*` plugins, які можуть затіняти поточний bundled-маніфест.

    Doctor також може перевстановити відсутні завантажувані plugins, коли конфігурація посилається на них, але локальний реєстр plugin не може їх знайти. Приклади включають матеріальні `plugins.entries`, налаштовані параметри каналів/провайдерів/пошуку та налаштовані runtime агента. Під час оновлень package doctor уникає запуску виправлення plugin через менеджер пакетів, доки основний package замінюється; запустіть `openclaw doctor --fix` знову після оновлення, якщо налаштований plugin усе ще потребує відновлення. Запуск Gateway і перезавантаження конфігурації не запускають менеджери пакетів; встановлення plugin залишаються явною роботою doctor/install/update.

  </Accordion>
  <Accordion title="8. Міграції сервісу Gateway і підказки з очищення">
    Doctor виявляє застарілі сервіси gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити сервіс OpenClaw, використовуючи поточний порт gateway. Він також може сканувати додаткові gateway-подібні сервіси й виводити підказки з очищення. Сервіси gateway OpenClaw із назвами профілів вважаються повноцінними й не позначаються як "додаткові".

    У Linux, якщо користувацький сервіс gateway відсутній, але системний сервіс gateway OpenClaw існує, doctor не встановлює автоматично другий користувацький сервіс. Перевірте за допомогою `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли життєвим циклом gateway керує системний supervisor.

  </Accordion>
  <Accordion title="8b. Міграція запуску Matrix">
    Коли обліковий запис каналу Matrix має очікувану або придатну до виконання міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім запускає best-effort кроки міграції: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки записуються в журнал, і запуск продовжується. У режимі лише для читання (`openclaw doctor` без `--fix`) цю перевірку повністю пропущено.
  </Accordion>
  <Accordion title="8c. Сполучення пристроїв і розходження автентифікації">
    Doctor тепер перевіряє стан сполучення пристроїв як частину звичайної перевірки справності.

    Що він повідомляє:

    - очікувані запити на перше сполучення
    - очікувані підвищення ролі для вже сполучених пристроїв
    - очікувані підвищення scope для вже сполучених пристроїв
    - виправлення невідповідності публічного ключа, коли ідентифікатор пристрою все ще збігається, але ідентичність пристрою більше не відповідає затвердженому запису
    - сполучені записи, у яких відсутній активний токен для затвердженої ролі
    - сполучені токени, чиї scopes відхилилися від затвердженого базового рівня сполучення
    - локальні кешовані записи токена пристрою для поточної машини, що передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не схвалює автоматично запити на сполучення й не ротирує токени пристроїв автоматично. Натомість він виводить точні наступні кроки:

    - переглянути очікувані запити за допомогою `openclaw devices list`
    - схвалити точний запит за допомогою `openclaw devices approve <requestId>`
    - ротувати свіжий токен за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видалити й повторно схвалити застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину "уже сполучено, але все ще з’являється вимога сполучення": doctor тепер відрізняє перше сполучення від очікуваних підвищень ролі/scope та від розходження застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли провайдер відкритий для DM без allowlist або коли політика налаштована небезпечно.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запущено як користувацький сервіс systemd, doctor забезпечує ввімкнення lingering, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан робочого простору (Skills, plugins і застарілі каталоги)">
    Doctor виводить зведення стану робочого простору для типового агента:

    - **Стан Skills**: підраховує придатні skills, skills із відсутніми вимогами та заблоковані allowlist skills.
    - **Застарілі каталоги робочого простору**: попереджає, коли `~/openclaw` або інші застарілі каталоги робочого простору існують поруч із поточним робочим простором.
    - **Стан Plugin**: підраховує ввімкнені/вимкнені/помилкові plugins; перелічує ідентифікатори plugin для всіх помилок; повідомляє можливості bundle plugin.
    - **Попередження сумісності Plugin**: позначає plugins, які мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки часу завантаження, виведені реєстром plugin.

  </Accordion>
  <Accordion title="11b. Розмір файла bootstrap">
    Doctor перевіряє, чи файли bootstrap робочого простору (наприклад `AGENTS.md`, `CLAUDE.md` або інші інжектовані файли контексту) наближаються до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файла сирі та інжектовані кількості символів, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість інжектованих символів як частку від загального бюджету. Коли файли обрізано або вони близькі до ліміту, doctor виводить поради з налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілого plugin каналу">
    Коли `openclaw doctor --fix` видаляє відсутній plugin каналу, він також видаляє висячу конфігурацію зі scope каналу, яка посилалася на цей plugin: записи `channels.<id>`, цілі heartbeat, що називали канал, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає циклам завантаження Gateway, коли runtime каналу зник, але конфігурація все ще просить gateway прив’язатися до нього.
  </Accordion>
  <Accordion title="11c. Автодоповнення shell">
    Doctor перевіряє, чи встановлено автодоповнення за Tab для поточного shell (zsh, bash, fish або PowerShell):

    - Якщо профіль shell використовує повільний динамічний шаблон автодоповнення (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо автодоповнення налаштовано в профілі, але файл кешу відсутній, doctor автоматично регенерує кеш.
    - Якщо автодоповнення взагалі не налаштовано, doctor пропонує встановити його (лише в інтерактивному режимі; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність автентифікації локального gateway через токен.

    - Якщо режим токена потребує токена, а джерела токена немає, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає й не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано SecretRef токена.

  </Accordion>
  <Accordion title="12b. Виправлення з урахуванням SecretRef у режимі лише читання">
    Деяким потокам виправлення потрібно перевіряти налаштовані облікові дані, не послаблюючи поведінку швидкого збою під час виконання.

    - `openclaw doctor --fix` тепер використовує ту саму модель зведення SecretRef лише для читання, що й команди родини status, для цільових виправлень конфігурації.
    - Приклад: виправлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані бота, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає автоматичне визначення замість аварійного завершення або хибного повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Перевірка стану Gateway + перезапуск">
    Doctor виконує перевірку стану та пропонує перезапустити Gateway, коли він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку в пам’яті">
    Doctor перевіряє, чи налаштований постачальник embedding для пошуку в пам’яті готовий для агента за замовчуванням. Поведінка залежить від налаштованого бекенду та постачальника:

    - **Бекенд QMD**: перевіряє, чи доступний і чи може запускатися виконуваний файл `qmd`. Якщо ні, виводить підказки щодо виправлення, зокрема npm-пакет і варіант ручного шляху до виконуваного файлу.
    - **Явний локальний постачальник**: перевіряє наявність локального файлу моделі або розпізнаної віддаленої/завантажуваної URL-адреси моделі. Якщо цього немає, пропонує перейти на віддаленого постачальника.
    - **Явний віддалений постачальник** (`openai`, `voyage` тощо): перевіряє, чи є API-ключ у середовищі або сховищі автентифікації. Якщо його немає, виводить практичні підказки щодо виправлення.
    - **Автоматичний постачальник**: спочатку перевіряє наявність локальної моделі, а потім пробує кожного віддаленого постачальника в порядку автоматичного вибору.

    Коли доступний кешований результат перевірки Gateway (Gateway був справний на момент перевірки), doctor зіставляє його результат із видимою для CLI конфігурацією та зазначає будь-які розбіжності. Doctor не запускає нову перевірку embedding на типовому шляху; використовуйте команду докладного стану пам’яті, коли потрібна жива перевірка постачальника.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding під час виконання.

  </Accordion>
  <Accordion title="14. Попередження стану каналів">
    Якщо Gateway справний, doctor виконує перевірку стану каналу та повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит і виправлення конфігурації супервізора">
    Doctor перевіряє встановлену конфігурацію супервізора (launchd/systemd/schtasks) на відсутні або застарілі значення за замовчуванням (наприклад, залежності systemd від network-online і затримку перезапуску). Коли він знаходить невідповідність, рекомендує оновлення та може перезаписати файл служби/завдання до поточних значень за замовчуванням.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед перезаписом конфігурації супервізора.
    - `openclaw doctor --yes` приймає типові запити на виправлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації супервізора.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише читання для життєвого циклу служби Gateway. Він усе ще повідомляє про стан служби та виконує виправлення, не пов’язані зі службою, але пропускає встановлення/запуск/перезапуск/bootstrap служби, перезапис конфігурації супервізора та очищення застарілих служб, оскільки цим життєвим циклом керує зовнішній супервізор.
    - У Linux doctor не перезаписує метадані команди/entrypoint, поки відповідний systemd-модуль Gateway активний. Він також ігнорує неактивні додаткові неуспадковані модулі, схожі на Gateway, під час сканування дубльованих служб, щоб супутні файли служб не створювали зайвого шуму очищення.
    - Якщо автентифікація токеном вимагає токен і `gateway.auth.token` керується SecretRef, встановлення/виправлення служби doctor перевіряє SecretRef, але не зберігає розв’язані відкриті значення токена в метаданих середовища служби супервізора.
    - Doctor виявляє керовані значення середовища служби на основі `.env`/SecretRef, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудували inline, і перезаписує метадані служби так, щоб ці значення завантажувалися з джерела під час виконання, а не з визначення супервізора.
    - Doctor виявляє, коли команда служби все ще закріплює старий `--port` після зміни `gateway.port`, і перезаписує метадані служби на поточний порт.
    - Якщо автентифікація токеном вимагає токен, а налаштований SecretRef токена не розв’язано, doctor блокує шлях встановлення/виправлення з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/виправлення, доки режим не буде задано явно.
    - Для користувацьких systemd-модулів Linux перевірки розбіжності токена doctor тепер включають джерела `Environment=` і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Виправлення служб doctor відмовляються перезаписувати, зупиняти або перезапускати службу Gateway зі старішого виконуваного файлу OpenClaw, коли конфігурацію востаннє було записано новішою версією. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повний перезапис через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика середовища виконання Gateway + порту">
    Doctor перевіряє середовище виконання служби (PID, останній статус завершення) і попереджає, коли службу встановлено, але вона фактично не працює. Він також перевіряє конфлікти портів на порту Gateway (типово `18789`) і повідомляє ймовірні причини (Gateway уже працює, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики середовища виконання Gateway">
    Doctor попереджає, коли служба Gateway працює на Bun або шляху Node, керованому версіями (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджера версій можуть зламатися після оновлень, оскільки служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує мігрувати на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нововстановлені або відремонтовані macOS LaunchAgents використовують канонічний системний PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) замість копіювання PATH інтерактивної оболонки, тому каталоги Volta, asdf, fnm, pnpm та інших менеджерів версій не змінюють, який Node розв’язують дочірні процеси. Служби Linux усе ще зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні користувацькі bin-каталоги, але вгадані резервні каталоги менеджерів версій записуються в PATH служби лише тоді, коли ці каталоги існують на диску.

  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає будь-які зміни конфігурації та проставляє метадані майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервне копіювання + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, коли її немає, і виводить пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace) для повного посібника зі структури робочого простору та резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
