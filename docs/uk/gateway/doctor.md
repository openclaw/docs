---
read_when:
    - Додавання або змінення міграцій doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки стану, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-05T01:21:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент відновлення + міграції для OpenClaw. Він виправляє застарілі конфігурацію/стан, перевіряє працездатність і надає придатні до виконання кроки відновлення.

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

    Приймає типові значення без запитів (включно з кроками перезапуску/сервісу/відновлення sandbox, коли застосовно).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Застосовує рекомендовані виправлення без запитів (виправлення + перезапуски, де це безпечно).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Також застосовує агресивні виправлення (перезаписує користувацькі конфігурації supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запускається без запитів і застосовує лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії перезапуску/сервісу/sandbox, які потребують підтвердження людини. Міграції застарілого стану виконуються автоматично після виявлення.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканує системні сервіси на наявність додаткових інсталяцій Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спочатку відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (підсумок)

<AccordionGroup>
  <Accordion title="Стан, UI та оновлення">
    - Необов’язкове попереднє оновлення для git-інсталяцій (лише інтерактивно).
    - Перевірка актуальності протоколу UI (перезбирає Control UI, коли схема протоколу новіша).
    - Перевірка стану + запит на перезапуск.
    - Підсумок стану Skills (доступні/відсутні/заблоковані) і стан Plugin.

  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих плоских полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження щодо перевизначень провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження щодо затінення OAuth Codex (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Попередження allowlist Plugin/інструментів, коли `plugins.allow` є обмежувальним, але політика інструментів усе ще запитує wildcard або інструменти, що належать Plugin.
    - Міграція застарілого стану на диску (sessions/agent dir/WhatsApp auth).
    - Міграція застарілих ключів контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища Cron (`jobId`, `schedule.cron`, поля доставки/payload верхнього рівня, payload `provider`, прості резервні завдання Webhook `notify: true`).
    - Міграція застарілої runtime-політики агентів до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли plugins увімкнено; коли `plugins.enabled=false`, застарілі посилання на Plugin вважаються інертною конфігурацією ізоляції та зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка lock-файлів сесій і очищення застарілих lock-файлів.
    - Відновлення transcript сесій для дубльованих гілок prompt-rewrite, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для restart-recovery завислих subagent із підтримкою `--fix` для очищення застарілих прапорців aborted recovery, щоб запуск не продовжував вважати дочірній процес restart-aborted.
    - Перевірки цілісності стану та дозволів (sessions, transcripts, state dir).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Стан автентифікації моделей: перевіряє закінчення строку OAuth, може оновлювати токени, що скоро спливають, і повідомляє стани cooldown/disabled auth-profile.
    - Виявлення додаткового каталогу workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, сервіси та supervisors">
    - Відновлення образу sandbox, коли sandboxing увімкнено.
    - Міграція застарілого сервісу та виявлення додаткових Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime Gateway (сервіс встановлено, але він не працює; кешована мітка launchd).
    - Попередження стану каналу (перевіряються з запущеного Gateway).
    - Аудит конфігурації supervisor (launchd/systemd/schtasks) з необов’язковим відновленням.
    - Очищення середовища вбудованого proxy для сервісів Gateway, які захопили shell-значення `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи version-manager).
    - Діагностика конфлікту порту Gateway (типовий `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та pairing">
    - Попередження безпеки для відкритих DM-політик.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли джерела токена немає; не перезаписує конфігурації SecretRef токенів).
    - Виявлення проблем pairing пристроїв (очікувані перші запити pairing, очікувані підвищення ролі/області, застаріле розходження кешу локального device-token і розходження автентифікації paired-record).

  </Accordion>
  <Accordion title="Workspace і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу workspace (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка готовності Skills для типового агента; повідомляє дозволені skills із відсутніми binaries, env, config або вимогами до ОС, а `--fix` може вимкнути недоступні skills у `skills.entries`.
    - Перевірка стану shell completion і автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера embedding для пошуку в пам’яті (локальна модель, віддалений API-ключ або QMD binary).
    - Перевірки source install (невідповідність pnpm workspace, відсутні UI assets, відсутній tsx binary).
    - Записує оновлену конфігурацію + метадані wizard.

  </Accordion>
</AccordionGroup>

## Зворотне заповнення й скидання Dreams UI

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для workflow grounded dreaming. Ці дії використовують RPC-методи у стилі Gateway doctor, але вони **не** є частиною repair/migration CLI `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному workspace, запускає grounded REM diary pass і записує зворотні записи backfill у `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише позначені backfill diary entries.
- **Clear Grounded** видаляє лише підготовлені grounded-only short-term entries, що походять з історичного replay і ще не накопичили live recall або daily support.

Чого вони самі по собі **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не готують автоматично grounded candidates у live short-term promotion store, якщо ви явно спочатку не запустите staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайну deep promotion lane, натомість використовуйте CLI flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це готує grounded durable candidates у short-term dreaming store, залишаючи `DREAMS.md` поверхнею для перегляду.

## Детальна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-інсталяції)">
    Якщо це git checkout і doctor працює інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без channel-specific override), doctor нормалізує їх до поточної схеми.

    Це включає застарілі плоскі поля Talk. Поточна публічна конфігурація Talk — `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у provider map.

    Doctor також попереджає, коли `plugins.allow` не порожній і політика інструментів використовує
    wildcard або записи інструментів, що належать Plugin. `tools.allow: ["*"]` збігається лише з інструментами
    з plugins, які фактично завантажуються; він не обходить ексклюзивний allowlist Plugin.
    Doctor записує `plugins.bundledDiscovery: "compat"` для мігрованих
    застарілих allowlist configs, щоб зберегти наявну поведінку bundled provider, а
    потім вказує на суворіше налаштування `"allowlist"`.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися й просять вас запустити `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час старту, коли виявляє застарілий формат конфігурації, тож застарілі конфігурації відновлюються без ручного втручання. Міграції сховища Cron job обробляються `openclaw doctor --fix`.

    Поточні міграції:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - конфігурації налаштованих каналів без видимої політики відповіді → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Для каналів з іменованими `accounts`, але із застарілими верхньорівневими значеннями каналу для одного облікового запису, перемістіть ці значення з областю дії облікового запису в підвищений обліковий запис, вибраний для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видалити `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для таймаутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видалити `browser.relayBindHost` (застаріле налаштування ретранслятора extension)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (запуск Gateway також пропускає провайдерів, у яких `api` встановлено на майбутнє або невідоме значення enum, замість завершення з помилкою)

    Попередження doctor також містять поради щодо типового облікового запису для каналів із кількома обліковими записами:

    - Якщо налаштовано два або більше записи `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` встановлено на невідомий ID облікового запису, doctor попереджає і перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі до неправильного API або обнулити витрати. Doctor попереджає, щоб ви могли видалити перевизначення й відновити маршрутизацію API та витрати для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера та готовність Chrome MCP">
    Якщо ваша конфігурація браузера все ще вказує на видалений шлях Chrome extension, doctor нормалізує її до поточної моделі підключення host-local Chrome MCP:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє шлях host-local Chrome MCP, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи Google Chrome встановлено на тому самому хості для типових профілів автоматичного підключення
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці перевірки браузера (наприклад, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути налаштування на стороні Chrome за вас. Host-local Chrome MCP усе ще потребує:

    - браузера на основі Chromium 144+ на хості gateway/node
    - локально запущеного браузера
    - увімкненого віддаленого налагодження в цьому браузері
    - підтвердження першого запиту згоди на підключення в браузері

    Готовність тут стосується лише локальних передумов підключення. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, усе ще потребують керованого браузера або raw CDP-профілю.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують raw CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor перевіряє endpoint авторизації OpenAI, щоб переконатися, що локальний стек Node/OpenSSL TLS може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor виводить поради з виправлення для конкретної платформи. На macOS з Homebrew Node виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка виконується, навіть якщо gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо раніше ви додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть затіняти вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі налаштування транспорту разом із Codex OAuth, щоб ви могли видалити або переписати застаріле перевизначення транспорту й повернути вбудовану поведінку маршрутизації/резервування. Користувацькі проксі та перевизначення лише заголовків усе ще підтримуються й не спричиняють цього попередження.
  </Accordion>
  <Accordion title="2f. Попередження маршрутів Plugin Codex">
    Коли ввімкнено вбудований Plugin Codex, doctor також перевіряє, чи посилання на основну модель `openai-codex/*` усе ще розв'язуються через типовий runner PI. Така комбінація коректна, коли ви хочете використовувати автентифікацію Codex OAuth/підписки через PI, але її легко сплутати з нативним app-server harness Codex. Doctor попереджає і вказує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, оскільки обидва маршрути є допустимими:

    - `openai-codex/*` + PI означає "використовувати автентифікацію Codex OAuth/підписки через звичайний runner OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` означає "виконати вбудований turn через нативний app-server Codex."
    - `/codex ...` означає "керувати або прив'язати нативну розмову Codex із чату."
    - `/acp ...` або `runtime: "acp"` означає "використовувати зовнішній адаптер ACP/acpx."

    Якщо з'являється попередження, виберіть потрібний маршрут і вручну відредагуйте конфігурацію. Залиште попередження без змін, якщо PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="2g. Очищення маршруту сесії">
    Doctor також сканує сховище активних сесій на наявність застарілого автоматично створеного стану маршруту після того, як ви перемістили налаштовану типову/резервну модель або runtime з маршруту, що належить plugin, наприклад Codex.

    `openclaw doctor --fix` може очистити автоматично створений застарілий стан, як-от закріплення моделей `modelOverrideSource: "auto"`, метадані runtime-моделі, закріплені ID harness, прив'язки CLI-сесій і автоматичні перевизначення auth-profile, коли їхній власний маршрут більше не налаштований. Явні користувацькі або застарілі вибори моделі сесії повідомляються для ручного перегляду й залишаються без змін; перемкніть їх за допомогою `/model ...`, `/new` або скиньте сесію, коли цей маршрут більше не потрібен.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (розмітка диска)">
    Doctor може мігрувати старіші розмітки на диску до поточної структури:

    - Сховище сесій + transcripts:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілого `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID облікового запису: `default`)

    Ці міграції виконуються за принципом найкращої спроби та є ідемпотентними; doctor виводитиме попередження, коли залишатиме будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі сесії + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапили в шлях для кожного агента без ручного запуску doctor. Нормалізація talk provider/provider-map тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не спричиняють повторних no-op змін `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів plugin">
    Doctor сканує всі встановлені маніфести plugin на наявність застарілих верхньорівневих ключів можливостей (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Якщо їх знайдено, він пропонує перемістити їх в об'єкт `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища cron">
    Doctor також перевіряє сховище завдань cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, коли перевизначено) на старі форми завдань, які scheduler усе ще приймає для сумісності.

    Поточні очищення cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - верхньорівневі поля payload (`message`, `model`, `thinking`, ...) → `payload`
    - верхньорівневі поля delivery (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми delivery `provider` у payload → явний `delivery.channel`
    - прості застарілі fallback-завдання webhook `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий fallback notify з наявним режимом delivery, що не є webhook, doctor попереджає і залишає це завдання для ручного перегляду.

    У Linux засіб діагностики також попереджає, коли crontab користувача все ще викликає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`. Цей локальний для хоста скрипт не підтримується поточним OpenClaw і може записувати хибні повідомлення `Gateway inactive` до `~/.openclaw/logs/whatsapp-health.log`, коли cron не може дістатися до користувацької шини systemd. Видаліть застарілий запис crontab за допомогою `crontab -e`; для поточних перевірок стану використовуйте `openclaw channels status --probe`, `openclaw doctor` і `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Очищення блокування сеансів">
    Засіб діагностики сканує кожен каталог сеансу агента на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сеансу. Для кожного знайденого файлу блокування він повідомляє: шлях, PID, чи PID досі активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше за 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше друкує примітку й указує повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілки транскрипту сеансу">
    Засіб діагностики сканує JSONL-файли сеансів агентів на дубльовану форму гілки, створену помилкою переписування транскрипту prompt від 2026.4.24: покинутий хід користувача з внутрішнім runtime-контекстом OpenClaw плюс активний сусідній елемент із тим самим видимим prompt користувача. У режимі `--fix` / `--repair` засіб діагностики створює резервну копію кожного ураженого файлу поруч з оригіналом і переписує транскрипт до активної гілки, щоб історія gateway і читачі пам'яті більше не бачили дубльованих ходів.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сеансів, маршрутизація та безпека)">
    Каталог стану — це операційний стовбур системи. Якщо він зникне, ви втратите сеанси, облікові дані, журнали та конфігурацію (якщо не маєте резервних копій деінде).

    Засіб діагностики перевіряє:

    - **Відсутній каталог стану**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Синхронізований із хмарою каталог стану macOS**: попереджає, коли стан розташовано під iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, оскільки шляхи з синхронізацією можуть спричиняти повільніше введення-виведення та конфлікти блокування/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розташовано на джерелі монтування `mmcblk*`, оскільки випадкове введення-виведення на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сеансів і облікових даних.
    - **Відсутні каталоги сеансів**: `sessions/` і каталог сховища сеансів потрібні для збереження історії та уникнення збоїв `ENOENT`.
    - **Невідповідність транскрипту**: попереджає, коли в останніх записах сеансів відсутні файли транскриптів.
    - **Основний сеанс "1-line JSONL"**: позначає, коли основний транскрипт має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли кілька папок `~/.openclaw` існують у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` указує в інше місце (історія може розділитися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, засіб діагностики нагадує запускати його на віддаленому хості (стан зберігається там).
    - **Дозволи файлу конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує посилити дозволи до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделей (закінчення терміну OAuth)">
    Засіб діагностики перевіряє OAuth-профілі в сховищі автентифікації, попереджає, коли термін дії токенів наближається до завершення або вже минув, і може оновити їх, коли це безпечно. Якщо OAuth/токен-профіль Anthropic застарів, він пропонує API-ключ Anthropic або шлях setup-token Anthropic. Запити на оновлення з'являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад, `refresh_token_reused`, `invalid_grant` або provider повідомляє, що потрібно ввійти знову), засіб діагностики повідомляє, що потрібна повторна автентифікація, і друкує точну команду `openclaw models auth login --provider ...`, яку треба виконати.

    Засіб діагностики також повідомляє про профілі автентифікації, які тимчасово непридатні через:

    - короткі періоди очікування (обмеження швидкості/тайм-аути/помилки автентифікації)
    - довші вимкнення (помилки білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Перевірка моделі hooks">
    Якщо `hooks.gmail.model` задано, засіб діагностики перевіряє посилання на модель за каталогом і allowlist та попереджає, коли воно не розв'язується або заборонене.
  </Accordion>
  <Accordion title="7. Відновлення образу sandbox">
    Коли sandboxing увімкнено, засіб діагностики перевіряє Docker-образи й пропонує зібрати або перемкнутися на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Очищення встановлення Plugin">
    Засіб діагностики видаляє застарілий staging-стан залежностей plugin, згенерований OpenClaw, у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Це охоплює застарілі згенеровані корені залежностей, старі каталоги етапу встановлення, локальне для пакета сміття від попереднього коду відновлення залежностей bundled-plugin, а також осиротілі або відновлені керовані npm-копії bundled `@openclaw/*` plugins, які можуть затіняти поточний bundled manifest.

    Засіб діагностики також може перевстановити відсутні завантажувані plugins, коли конфігурація посилається на них, але локальний реєстр plugin не може їх знайти. Приклади включають матеріальні `plugins.entries`, налаштовані параметри channel/provider/search і налаштовані середовища виконання агентів. Під час оновлень пакета засіб діагностики уникає запуску package-manager-відновлення plugin, поки core-пакет замінюється; запустіть `openclaw doctor --fix` знову після оновлення, якщо налаштований plugin усе ще потребує відновлення. Запуск Gateway і перезавантаження конфігурації не запускають package managers; встановлення plugin залишаються явною роботою doctor/install/update.

  </Accordion>
  <Accordion title="8. Міграції сервісу Gateway і підказки з очищення">
    Засіб діагностики виявляє застарілі сервіси gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити сервіс OpenClaw із поточним портом gateway. Він також може сканувати додаткові gateway-подібні сервіси й друкувати підказки з очищення. Gateway-сервіси OpenClaw з іменами профілів вважаються повноцінними й не позначаються як "додаткові".

    У Linux, якщо user-level gateway-сервіс відсутній, але system-level gateway-сервіс OpenClaw існує, засіб діагностики не встановлює автоматично другий user-level сервіс. Перевірте за допомогою `openclaw gateway status --deep` або `openclaw doctor --deep`, а потім видаліть дублікат або встановіть `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли життєвим циклом gateway керує системний supervisor.

  </Accordion>
  <Accordion title="8b. Міграція Startup Matrix">
    Коли обліковий запис channel Matrix має pending або actionable застарілу міграцію стану, засіб діагностики (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім виконує best-effort кроки міграції: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки записуються до журналу, а запуск триває. У режимі лише читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Сполучення пристроїв і дрейф автентифікації">
    Засіб діагностики тепер перевіряє стан сполучення пристроїв як частину звичайного проходу перевірки стану.

    Що він повідомляє:

    - pending запити першого сполучення
    - pending підвищення ролі для вже сполучених пристроїв
    - pending підвищення scope для вже сполучених пристроїв
    - відновлення невідповідності відкритого ключа, коли ідентифікатор пристрою все ще збігається, але ідентичність пристрою більше не збігається із затвердженим записом
    - сполучені записи без активного токена для затвердженої ролі
    - сполучені токени, чиї scopes відхиляються від затвердженої базової лінії сполучення
    - локальні кешовані записи device-token для поточної машини, що передують ротації токена на боці gateway або містять застарілі метадані scope

    Засіб діагностики не затверджує запити сполучення автоматично й не обертає токени пристроїв автоматично. Натомість він друкує точні наступні кроки:

    - перегляньте pending запити за допомогою `openclaw devices list`
    - затвердьте точний запит за допомогою `openclaw devices approve <requestId>`
    - оберніть свіжий токен за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видаліть і повторно затвердьте застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину "already paired but still getting pairing required": засіб діагностики тепер відрізняє перше сполучення від pending підвищень ролі/scope і від дрейфу застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Засіб діагностики видає попередження, коли provider відкритий для DM без allowlist або коли політику налаштовано небезпечним способом.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запущено як user service systemd, засіб діагностики забезпечує ввімкнення lingering, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан workspace (skills, plugins і застарілі каталоги)">
    Засіб діагностики друкує підсумок стану workspace для агента за замовчуванням:

    - **Стан Skills**: рахує eligible, missing-requirements і allowlist-blocked skills.
    - **Застарілі каталоги workspace**: попереджає, коли `~/openclaw` або інші застарілі каталоги workspace існують поряд із поточним workspace.
    - **Стан Plugin**: рахує enabled/disabled/errored plugins; перелічує ідентифікатори plugin для будь-яких помилок; повідомляє можливості bundle plugin.
    - **Попередження сумісності Plugin**: позначає plugins, які мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки часу завантаження, видані реєстром plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Засіб діагностики перевіряє, чи bootstrap-файли workspace (наприклад, `AGENTS.md`, `CLAUDE.md` або інші інжектовані файли контексту) близькі до налаштованого ліміту символів або перевищують його. Він повідомляє для кожного файлу сирі та інжектовані кількості символів, відсоток усічення, причину усічення (`max/file` або `max/total`) і загальну кількість інжектованих символів як частку загального бюджету. Коли файли усічено або вони близькі до ліміту, засіб діагностики друкує поради з налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілого channel plugin">
    Коли `openclaw doctor --fix` видаляє відсутній channel plugin, він також видаляє висячі channel-scoped конфігурації, які посилалися на цей plugin: записи `channels.<id>`, цілі Heartbeat, що називали channel, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає циклам завантаження Gateway, коли runtime channel зник, але конфігурація все ще просить gateway прив'язатися до нього.
  </Accordion>
  <Accordion title="11c. Автодоповнення shell">
    Засіб діагностики перевіряє, чи встановлено автодоповнення tab для поточного shell (zsh, bash, fish або PowerShell):

    - Якщо профіль shell використовує повільний динамічний шаблон completion (`source <(openclaw completion ...)`), засіб діагностики оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо completion налаштовано в профілі, але файл кешу відсутній, засіб діагностики автоматично регенерує кеш.
    - Якщо completion взагалі не налаштовано, засіб діагностики пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Засіб діагностики перевіряє готовність автентифікації локального токена gateway.

    - Якщо режим токена потребує токен, а джерела токена не існує, засіб діагностики пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, засіб діагностики попереджає й не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано token SecretRef.

  </Accordion>
  <Accordion title="12b. Відновлення з урахуванням SecretRef у режимі лише читання">
    Деякі потоки відновлення потребують перевірки налаштованих облікових даних без послаблення fail-fast поведінки runtime.

    - `openclaw doctor --fix` тепер використовує ту саму модель read-only зведення SecretRef, що й команди сімейства status, для цільового ремонту конфігурації.
    - Приклад: ремонт Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використовувати налаштовані облікові дані бота, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає автоматичне розв'язання замість збою або помилкового повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Перевірка стану Gateway + перезапуск">
    Команда doctor виконує перевірку стану й пропонує перезапустити Gateway, коли він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку в пам'яті">
    Команда doctor перевіряє, чи налаштований постачальник embedding для пошуку в пам'яті готовий для агента за замовчуванням. Поведінка залежить від налаштованого бекенда й постачальника:

    - **Бекенд QMD**: перевіряє, чи бінарний файл `qmd` доступний і може запуститися. Якщо ні, виводить рекомендації з виправлення, включно з npm-пакетом і варіантом ручного шляху до бінарного файла.
    - **Явний локальний постачальник**: перевіряє наявність локального файла моделі або розпізнаної віддаленої/завантажуваної URL-адреси моделі. Якщо відсутні, пропонує перейти на віддаленого постачальника.
    - **Явний віддалений постачальник** (`openai`, `voyage` тощо): перевіряє, чи API-ключ присутній у середовищі або сховищі автентифікації. Виводить дієві підказки для виправлення, якщо його бракує.
    - **Автоматичний постачальник**: спочатку перевіряє доступність локальної моделі, а потім пробує кожного віддаленого постачальника в порядку автоматичного вибору.

    Коли доступний кешований результат перевірки Gateway (Gateway був справним на момент перевірки), doctor зіставляє його результат із конфігурацією, видимою для CLI, і зазначає будь-яку розбіжність. Doctor не запускає новий embedding ping у стандартному шляху; використовуйте команду глибокого статусу пам'яті, коли потрібна жива перевірка постачальника.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding під час виконання.

  </Accordion>
  <Accordion title="14. Попередження про стан каналу">
    Якщо Gateway справний, doctor виконує перевірку стану каналу й повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит конфігурації супервізора + ремонт">
    Doctor перевіряє встановлену конфігурацію супервізора (launchd/systemd/schtasks) на відсутні або застарілі стандартні значення (наприклад, залежності systemd від network-online і затримку перезапуску). Коли знаходить невідповідність, рекомендує оновлення й може перезаписати файл служби/завдання до поточних стандартних значень.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед перезаписом конфігурації супервізора.
    - `openclaw doctor --yes` приймає стандартні запити на ремонт.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації супервізора.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі read-only для життєвого циклу служби Gateway. Він усе одно повідомляє стан служби й виконує ремонти, не пов'язані зі службою, але пропускає встановлення/запуск/перезапуск/bootstrap служби, перезапис конфігурації супервізора та очищення застарілих служб, бо цим життєвим циклом керує зовнішній супервізор.
    - У Linux doctor не перезаписує метадані команди/entrypoint, поки відповідний systemd-модуль Gateway активний. Він також ігнорує неактивні додаткові gateway-подібні модулі, що не є застарілими, під час сканування дублікатів служб, щоб супутні файли служб не створювали зайвого шуму очищення.
    - Якщо автентифікація токеном вимагає токен і `gateway.auth.token` керується SecretRef, встановлення/ремонт служби doctor перевіряє SecretRef, але не зберігає розв'язані plaintext-значення токена в метадані середовища служби супервізора.
    - Doctor виявляє керовані `.env`/SecretRef-backed значення середовища служби, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудували inline, і перезаписує метадані служби так, щоб ці значення завантажувалися з runtime-джерела замість визначення супервізора.
    - Doctor виявляє, коли команда служби все ще фіксує старий `--port` після зміни `gateway.port`, і перезаписує метадані служби на поточний порт.
    - Якщо автентифікація токеном вимагає токен, а налаштований SecretRef токена не розв'язано, doctor блокує шлях встановлення/ремонту з дієвими рекомендаціями.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/ремонт, доки режим не буде задано явно.
    - Для користувацьких systemd-модулів Linux перевірки drift токена doctor тепер включають джерела `Environment=` і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Ремонти служби doctor відмовляються перезаписувати, зупиняти або перезапускати службу Gateway зі старішого бінарного файла OpenClaw, коли конфігурацію востаннє було записано новішою версією. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повний перезапис через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime Gateway + діагностика порту">
    Doctor перевіряє runtime служби (PID, останній статус виходу) і попереджає, коли службу встановлено, але вона фактично не працює. Він також перевіряє конфлікти портів на порту Gateway (типово `18789`) і повідомляє ймовірні причини (Gateway уже запущено, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли служба Gateway працює на Bun або шляху Node, керованому менеджером версій (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram вимагають Node, а шляхи менеджера версій можуть ламатися після оновлень, бо служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує мігрувати на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нововстановлені або відремонтовані LaunchAgents macOS використовують канонічний системний PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) замість копіювання PATH інтерактивної оболонки, тож Volta, asdf, fnm, pnpm та інші каталоги менеджерів версій не змінюють, який Node розв'язують дочірні процеси. Служби Linux усе ще зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні каталоги user-bin, але вгадані fallback-каталоги менеджерів версій записуються до PATH служби лише тоді, коли ці каталоги існують на диску.

  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає будь-які зміни конфігурації й ставить мітку метаданих майстра для запису запуску doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочої області (резервна копія + система пам'яті)">
    Doctor пропонує систему пам'яті робочої області, коли її бракує, і виводить пораду щодо резервного копіювання, якщо робоча область ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури робочої області та резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов'язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
