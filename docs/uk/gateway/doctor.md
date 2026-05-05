---
read_when:
    - Додавання або змінення діагностичних міграцій
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки справності, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-05T08:04:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент ремонту й міграції для OpenClaw. Він виправляє застарілі конфігурацію/стан, перевіряє справність і надає практичні кроки ремонту.

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

    Прийняти стандартні значення без запитів (зокрема кроки перезапуску/сервісу/ремонту пісочниці, коли застосовно).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Застосувати рекомендовані ремонти без запитів (ремонти + перезапуски, де це безпечно).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Застосувати також агресивні ремонти (перезаписує користувацькі конфігурації supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запустити без запитів і застосувати лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії перезапуску/сервісу/пісочниці, що потребують підтвердження людини. Міграції застарілого стану запускаються автоматично, коли їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканувати системні сервіси на наявність додаткових інсталяцій Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спершу відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (зведення)

<AccordionGroup>
  <Accordion title="Справність, UI та оновлення">
    - Необовʼязкове попереднє оновлення для git-інсталяцій (лише інтерактивно).
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
    - Попередження allowlist Plugin/інструментів, коли `plugins.allow` є обмежувальним, але політика інструментів усе ще запитує wildcard або інструменти, що належать Plugin.
    - Міграція застарілого стану на диску (sessions/agent dir/WhatsApp auth).
    - Міграція застарілих ключів контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, payload `provider`, прості резервні webhook-завдання `notify: true`).
    - Міграція застарілої політики runtime agent до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли plugins увімкнено; коли `plugins.enabled=false`, застарілі посилання на Plugin вважаються інертною конфігурацією containment і зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка lock-файлів сеансів і очищення застарілих lock-файлів.
    - Ремонт transcript сеансів для дубльованих гілок prompt-rewrite, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для restart-recovery заблокованих subagent, з підтримкою `--fix` для очищення застарілих прапорців aborted recovery, щоб startup не продовжував трактувати child як restart-aborted.
    - Перевірки цілісності стану та дозволів (sessions, transcripts, state dir).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Справність автентифікації моделей: перевіряє строк дії OAuth, може оновлювати токени, строк дії яких спливає, і повідомляє про стани cooldown/disabled auth-profile.
    - Виявлення додаткового workspace dir (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, сервіси та supervisor">
    - Ремонт образу пісочниці, коли sandboxing увімкнено.
    - Міграція застарілого сервісу та виявлення додаткових Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime Gateway (сервіс встановлено, але не запущено; кешована мітка launchd).
    - Попередження про стан каналів (перевіряються з запущеного Gateway).
    - Перевірки чутливості WhatsApp для погіршеного стану event-loop Gateway, коли локальні TUI-клієнти все ще працюють; `--fix` зупиняє лише перевірені локальні TUI-клієнти.
    - Аудит конфігурації supervisor (launchd/systemd/schtasks) з необовʼязковим ремонтом.
    - Очищення середовища вбудованого proxy для сервісів Gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node vs Bun, шляхи version-manager).
    - Діагностика конфліктів портів Gateway (типово `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та pairing">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли джерела токена не існує; не перезаписує конфігурації token SecretRef).
    - Виявлення проблем pairing пристрою (очікувані перші запити pair, очікувані оновлення role/scope, застаріле розходження локального кешу device-token і розходження автентифікації paired-record).

  </Accordion>
  <Accordion title="Workspace і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу workspace (попередження про truncation/near-limit для context-файлів).
    - Перевірка готовності Skills для типового agent; повідомляє про дозволені skills із відсутніми bins, env, config або вимогами OS, а `--fix` може вимкнути недоступні skills у `skills.entries`.
    - Перевірка стану shell completion і автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера embedding для пошуку memory (локальна модель, віддалений API key або binary QMD).
    - Перевірки source install (невідповідність pnpm workspace, відсутні UI assets, відсутній binary tsx).
    - Записує оновлену конфігурацію + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill і reset у Dreams UI

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для grounded dreaming workflow. Ці дії використовують RPC-методи у стилі gateway doctor, але вони **не** є частиною CLI ремонту/міграції `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному workspace, запускає grounded REM diary pass і записує оборотні backfill-записи в `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише ці позначені backfill diary entries.
- **Clear Grounded** видаляє лише підготовлені grounded-only short-term entries, що походять з історичного replay і ще не накопичили live recall або daily support.

Чого вони **не** роблять самі по собі:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не готують grounded candidates автоматично в live short-term promotion store, якщо ви явно спершу не запустите staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайний deep promotion lane, натомість використовуйте CLI flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це готує grounded durable candidates у short-term dreaming store, залишаючи `DREAMS.md` поверхнею для перегляду.

## Докладна поведінка й обґрунтування

<AccordionGroup>
  <Accordion title="0. Необовʼязкове оновлення (git-інсталяції)">
    Якщо це git checkout і doctor працює інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад `messages.ackReaction` без channel-specific override), doctor нормалізує їх у поточну схему.

    Це включає застарілі плоскі поля Talk. Поточна публічна конфігурація Talk — `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у provider map.

    Doctor також попереджає, коли `plugins.allow` не порожній, а політика інструментів використовує
    wildcard або записи інструментів, що належать Plugin. `tools.allow: ["*"]` відповідає лише інструментам
    з plugins, які справді завантажуються; це не обходить ексклюзивний allowlist Plugin.
    Doctor записує `plugins.bundledDiscovery: "compat"` для мігрованих
    застарілих конфігурацій allowlist, щоб зберегти наявну поведінку bundled provider, а
    потім вказує на суворіше налаштування `"allowlist"`.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися й просять вас запустити `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час startup, коли виявляє застарілий формат конфігурації, тому застарілі конфігурації ремонтуються без ручного втручання. Міграції сховища Cron job обробляються через `openclaw doctor --fix`.

    Поточні міграції:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - конфігурації налаштованих каналів без видимої політики відповідей → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → верхньорівневі `bindings`
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
    - Для каналів з іменованими `accounts`, але із залишковими верхньорівневими значеннями каналу для одного облікового запису, перемістіть ці значення в межах облікового запису до підвищеного облікового запису, вибраного для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/default ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - вилучіть `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для тайм-аутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - вилучіть `browser.relayBindHost` (застаріле налаштування ретранслятора розширення)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (запуск Gateway також пропускає провайдерів, чий `api` встановлено на майбутнє або невідоме значення enum, замість закритої відмови)

    Попередження doctor також містять поради щодо стандартного облікового запису для багатооблікових каналів:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` встановлено на невідомий ID облікового запису, doctor попереджає та перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі до неправильного API або обнулити витрати. Doctor попереджає, щоб ви могли вилучити перевизначення та відновити маршрутизацію API й витрати для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера та готовність Chrome MCP">
    Якщо ваша конфігурація браузера все ще вказує на вилучений шлях розширення Chrome, doctor нормалізує її до поточної моделі підключення Chrome MCP на локальному хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` вилучається

    Doctor також перевіряє шлях Chrome MCP на локальному хості, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для стандартних профілів автоматичного підключення
    - перевіряє виявлену версію Chrome і попереджає, коли вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці перевірки браузера (наприклад `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути налаштування на боці Chrome за вас. Chrome MCP на локальному хості все ще потребує:

    - браузер на основі Chromium 144+ на хості gateway/node
    - браузер, запущений локально
    - віддалене налагодження, увімкнене в цьому браузері
    - схвалення першого запиту згоди на підключення в браузері

    Готовність тут стосується лише передумов локального підключення. Existing-session зберігає поточні обмеження маршруту Chrome MCP; розширені маршрути на кшталт `responsebody`, експорту PDF, перехоплення завантажень і пакетних дій усе ще потребують керованого браузера або raw CDP profile.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless потоків. Вони й надалі використовують raw CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor перевіряє endpoint авторизації OpenAI, щоб переконатися, що локальний стек Node/OpenSSL TLS може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor виводить поради з виправлення для конкретної платформи. На macOS із Homebrew Node виправлення зазвичай таке: `brew postinstall ca-certificates`. З `--deep` перевірка виконується навіть тоді, коли gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо раніше ви додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть затіняти вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі налаштування транспорту разом із Codex OAuth, щоб ви могли вилучити або переписати застаріле перевизначення транспорту та повернути вбудовану поведінку маршрутизації/резервування. Користувацькі проксі та перевизначення лише заголовків усе ще підтримуються й не викликають цього попередження.
  </Accordion>
  <Accordion title="2f. Попередження маршрутів Codex plugin">
    Коли ввімкнено вбудований Codex plugin, doctor також перевіряє, чи primary model refs `openai-codex/*` усе ще розв’язуються через стандартний PI runner. Ця комбінація коректна, коли вам потрібна автентифікація Codex OAuth/підписки через PI, але її легко сплутати з нативним app-server harness Codex. Doctor попереджає та вказує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, тому що обидва маршрути коректні:

    - `openai-codex/*` + PI означає "використовувати автентифікацію Codex OAuth/підписки через звичайний runner OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` означає "виконати вбудований turn через нативний Codex app-server."
    - `/codex ...` означає "керувати або прив’язати нативну розмову Codex із чату."
    - `/acp ...` або `runtime: "acp"` означає "використовувати зовнішній ACP/acpx adapter."

    Якщо з’являється попередження, виберіть маршрут, який ви мали на увазі, і відредагуйте конфігурацію вручну. Залиште попередження без змін, коли PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="2g. Очищення маршрутів сеансів">
    Doctor також сканує сховище активних сеансів на застарілий автоматично створений стан маршрутів після того, як ви перемістили налаштовану стандартну/резервну модель або runtime з маршруту, що належить plugin, як-от Codex.

    `openclaw doctor --fix` може очистити автоматично створений застарілий стан, як-от закріплення моделей `modelOverrideSource: "auto"`, runtime metadata моделей, закріплені harness ids, прив’язки CLI-сеансів і автоматичні перевизначення auth-profile, коли їхній маршрут-власник більше не налаштовано. Явні користувацькі або застарілі вибори моделей сеансу повідомляються для ручної перевірки й залишаються без змін; перемкніть їх за допомогою `/model ...`, `/new` або скиньте сеанс, коли цей маршрут більше не призначений.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (дискова структура)">
    Doctor може мігрувати старіші дискові структури в поточну структуру:

    - Сховище сеансів + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілих `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID стандартного облікового запису: `default`)

    Ці міграції виконуються за принципом найкращої спроби й є ідемпотентними; doctor видаватиме попередження, коли залишає будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі сеанси + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапляли в шлях для кожного агента без ручного запуску doctor. Нормалізація провайдера talk/карти провайдерів тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не спричиняють повторні noop-зміни `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів plugin">
    Doctor сканує всі встановлені маніфести plugin на застарілі верхньорівневі ключі можливостей (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли їх знайдено, він пропонує перемістити їх до об’єкта `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже має ті самі значення, застарілий ключ вилучається без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища cron">
    Doctor також перевіряє сховище cron-завдань (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, якщо перевизначено) на старі форми завдань, які scheduler усе ще приймає для сумісності.

    Поточні очищення cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - верхньорівневі поля payload (`message`, `model`, `thinking`, ...) → `payload`
    - верхньорівневі поля delivery (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - delivery aliases `provider` у payload → явне `delivery.channel`
    - прості застарілі fallback-завдання webhook `notify: true` → явне `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий notify fallback з наявним режимом delivery, що не є webhook, doctor попереджає та залишає це завдання для ручної перевірки.

    У Linux doctor також попереджає, коли crontab користувача все ще викликає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`. Цей локальний для хоста скрипт не підтримується поточною версією OpenClaw і може записувати хибні повідомлення `Gateway inactive` у `~/.openclaw/logs/whatsapp-health.log`, коли cron не може підключитися до користувацької шини systemd. Видаліть застарілий запис crontab за допомогою `crontab -e`; для поточних перевірок стану використовуйте `openclaw channels status --probe`, `openclaw doctor` і `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сеансів">
    Doctor сканує кожен каталог сеансів агента на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сеансу. Для кожного знайденого файлу блокування він повідомляє: шлях, PID, чи PID досі активний, вік блокування та чи вважається воно застарілим (мертвий PID або старіше за 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше друкує примітку й вказує повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілки стенограми сеансу">
    Doctor сканує JSONL-файли сеансів агента на дубльовану форму гілки, створену помилкою переписування стенограми prompt від 2026.4.24: покинутий хід користувача з внутрішнім runtime-контекстом OpenClaw плюс активний споріднений елемент із тим самим видимим prompt користувача. У режимі `--fix` / `--repair` doctor створює резервну копію кожного зачепленого файлу поряд з оригіналом і переписує стенограму на активну гілку, щоб історія gateway і читачі пам’яті більше не бачили дубльованих ходів.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сеансів, маршрутизація та безпека)">
    Каталог стану — це операційний стовбур системи. Якщо він зникне, ви втратите сеанси, облікові дані, журнали й конфігурацію (якщо у вас немає резервних копій в іншому місці).

    Doctor перевіряє:

    - **Відсутній каталог стану**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Синхронізований із хмарою каталог стану macOS**: попереджає, коли стан розташовано під iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, оскільки шляхи з синхронізацією можуть спричиняти повільніший I/O та перегони блокування/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розташовано на джерелі монтування `mmcblk*`, оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сеансів і облікових даних.
    - **Відсутні каталоги сеансів**: `sessions/` і каталог сховища сеансів потрібні для збереження історії та уникнення аварій `ENOENT`.
    - **Невідповідність стенограми**: попереджає, коли в нещодавніх записах сеансів відсутні файли стенограм.
    - **Головний сеанс "1-line JSONL"**: позначає випадки, коли головна стенограма має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли кілька папок `~/.openclaw` існують у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділятися між встановленнями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запустити його на віддаленому хості (стан живе там).
    - **Дозволи файлу конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує посилити до `600`.

  </Accordion>
  <Accordion title="5. Стан авторизації моделей (закінчення строку OAuth)">
    Doctor перевіряє профілі OAuth у сховищі авторизації, попереджає, коли строк дії токенів наближається до завершення або вже завершився, і може оновити їх, коли це безпечно. Якщо профіль OAuth/токена Anthropic застарів, він пропонує API-ключ Anthropic або шлях setup-token Anthropic. Запити на оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад, `refresh_token_reused`, `invalid_grant` або провайдер просить увійти знову), doctor повідомляє, що потрібна повторна авторизація, і друкує точну команду `openclaw models auth login --provider ...`, яку слід виконати.

    Doctor також повідомляє про профілі авторизації, які тимчасово непридатні через:

    - короткі періоди охолодження (обмеження частоти/тайм-аути/помилки авторизації)
    - довші вимкнення (помилки білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Перевірка моделей hooks">
    Якщо задано `hooks.gmail.model`, doctor перевіряє посилання на модель за каталогом і списком дозволених та попереджає, коли його неможливо розв’язати або воно заборонене.
  </Accordion>
  <Accordion title="7. Відновлення образу sandbox">
    Коли sandboxing увімкнено, doctor перевіряє образи Docker і пропонує зібрати або перейти на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Очищення встановлення Plugin">
    Doctor видаляє застарілий, згенерований OpenClaw staging-стан залежностей plugin у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Це охоплює застарілі згенеровані корені залежностей, старі каталоги етапу встановлення, локальні для пакета залишки від попереднього коду відновлення залежностей вбудованого plugin, а також осиротілі або відновлені керовані npm-копії вбудованих plugins `@openclaw/*`, які можуть затіняти поточний вбудований маніфест.

    Doctor також може перевстановити відсутні завантажувані plugins, коли конфігурація посилається на них, але локальний реєстр plugin не може їх знайти. Приклади включають матеріальні `plugins.entries`, налаштовані параметри каналів/провайдерів/пошуку та налаштовані runtime агента. Під час оновлень пакета doctor уникає запуску відновлення plugin через менеджер пакетів, доки основний пакет замінюється; запустіть `openclaw doctor --fix` ще раз після оновлення, якщо налаштований plugin усе ще потребує відновлення. Запуск Gateway і перезавантаження конфігурації не запускають менеджери пакетів; встановлення plugins лишаються явною роботою doctor/install/update.

  </Accordion>
  <Accordion title="8. Міграції сервісу Gateway і підказки з очищення">
    Doctor виявляє застарілі сервіси gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити сервіс OpenClaw, використовуючи поточний порт gateway. Він також може просканувати додаткові gateway-подібні сервіси й надрукувати підказки з очищення. Сервіси gateway OpenClaw з іменами профілів вважаються повноцінними й не позначаються як "додаткові."

    У Linux, якщо сервіс gateway рівня користувача відсутній, але існує системний сервіс gateway OpenClaw, doctor не встановлює автоматично другий сервіс рівня користувача. Перевірте за допомогою `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли системний супервізор керує життєвим циклом gateway.

  </Accordion>
  <Accordion title="8b. Міграція Startup Matrix">
    Коли обліковий запис каналу Matrix має очікувану або придатну до дії міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім виконує кроки міграції в режимі best-effort: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки журналюються, а запуск продовжується. У режимі лише для читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Сполучення пристроїв і дрейф авторизації">
    Doctor тепер перевіряє стан сполучення пристроїв як частину звичайного проходу перевірки стану.

    Що він повідомляє:

    - очікувані запити першого сполучення
    - очікувані підвищення ролі для вже сполучених пристроїв
    - очікувані підвищення scope для вже сполучених пристроїв
    - відновлення невідповідності відкритого ключа, коли id пристрою все ще збігається, але ідентичність пристрою більше не відповідає затвердженому запису
    - сполучені записи, у яких відсутній активний токен для затвердженої ролі
    - сполучені токени, чиї scopes відхилилися за межі затвердженого базового рівня сполучення
    - локальні кешовані записи токена пристрою для поточної машини, які передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не затверджує автоматично запити сполучення й не ротатує автоматично токени пристроїв. Натомість він друкує точні наступні кроки:

    - переглянути очікувані запити за допомогою `openclaw devices list`
    - затвердити точний запит за допомогою `openclaw devices approve <requestId>`
    - ротувати свіжий токен за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видалити й повторно затвердити застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває типову прогалину "already paired but still getting pairing required": doctor тепер відрізняє перше сполучення від очікуваних підвищень ролі/scope і від дрейфу застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor видає попередження, коли провайдер відкритий для DM без списку дозволених або коли політика налаштована небезпечним способом.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запущено як користувацький сервіс systemd, doctor гарантує, що lingering увімкнено, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан робочого простору (Skills, plugins і застарілі каталоги)">
    Doctor друкує підсумок стану робочого простору для стандартного агента:

    - **Стан Skills**: рахує придатні, з відсутніми вимогами та заблоковані списком дозволених skills.
    - **Застарілі каталоги робочого простору**: попереджає, коли `~/openclaw` або інші застарілі каталоги робочого простору існують поряд із поточним робочим простором.
    - **Стан Plugin**: рахує увімкнені/вимкнені/з помилками plugins; перелічує ID plugin для будь-яких помилок; повідомляє можливості plugin bundle.
    - **Попередження сумісності Plugin**: позначає plugins, які мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки часу завантаження, видані реєстром plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Doctor перевіряє, чи bootstrap-файли робочого простору (наприклад `AGENTS.md`, `CLAUDE.md` або інші інжектовані файли контексту) наближаються до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файлу необроблену кількість символів проти інжектованої, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість інжектованих символів як частку від загального бюджету. Коли файли обрізано або вони близькі до ліміту, doctor друкує поради з налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілого channel plugin">
    Коли `openclaw doctor --fix` видаляє відсутній channel plugin, він також видаляє завислу конфігурацію в області каналу, яка посилалася на цей plugin: записи `channels.<id>`, цілі heartbeat, що називали канал, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає циклам завантаження Gateway, коли runtime каналу зник, але конфігурація все ще просить gateway прив’язатися до нього.
  </Accordion>
  <Accordion title="11c. Автодоповнення shell">
    Doctor перевіряє, чи встановлено автодоповнення табуляцією для поточного shell (zsh, bash, fish або PowerShell):

    - Якщо профіль shell використовує повільний динамічний шаблон доповнення (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо доповнення налаштоване в профілі, але файл кешу відсутній, doctor автоматично регенерує кеш.
    - Якщо доповнення взагалі не налаштоване, doctor пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки авторизації Gateway (локальний токен)">
    Doctor перевіряє готовність авторизації токена локального gateway.

    - Якщо режим токена потребує токен і не існує жодного джерела токена, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає й не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише коли не налаштовано SecretRef токена.

  </Accordion>
  <Accordion title="12b. Відновлення з урахуванням SecretRef лише для читання">
    Деякі потоки відновлення мають перевіряти налаштовані облікові дані, не послаблюючи runtime-поведінку fail-fast.

    - `openclaw doctor --fix` тепер використовує ту саму модель підсумку SecretRef лише для читання, що й команди родини status, для цільових виправлень конфігурації.
    - Приклад: виправлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані бота, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає автоматичне розв’язання замість аварійного завершення або помилкового повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Перевірка стану Gateway + перезапуск">
    Doctor запускає перевірку стану й пропонує перезапустити Gateway, коли він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку пам’яті">
    Doctor перевіряє, чи налаштований провайдер embedding для пошуку пам’яті готовий для агента за замовчуванням. Поведінка залежить від налаштованого бекенда й провайдера:

    - **Бекенд QMD**: перевіряє, чи бінарний файл `qmd` доступний і може запуститися. Якщо ні, виводить підказки з виправлення, включно з npm-пакетом і варіантом ручного шляху до бінарного файла.
    - **Явний локальний провайдер**: перевіряє наявність локального файла моделі або розпізнаної віддаленої URL-адреси моделі, яку можна завантажити. Якщо відсутня, пропонує перейти на віддаленого провайдера.
    - **Явний віддалений провайдер** (`openai`, `voyage` тощо): перевіряє, чи API-ключ присутній у середовищі або сховищі автентифікації. Виводить дієві підказки з виправлення, якщо ключ відсутній.
    - **Автоматичний провайдер**: спершу перевіряє доступність локальної моделі, потім пробує кожного віддаленого провайдера в порядку автоматичного вибору.

    Коли доступний кешований результат перевірки Gateway (Gateway був справним на момент перевірки), doctor зіставляє його результат із конфігурацією, видимою для CLI, і зазначає будь-яку розбіжність. Doctor не запускає новий ping embedding у стандартному шляху; використовуйте глибоку команду стану пам’яті, коли потрібна жива перевірка провайдера.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding під час виконання.

  </Accordion>
  <Accordion title="14. Попередження стану каналів">
    Якщо Gateway справний, doctor запускає перевірку стану каналу й повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит і виправлення конфігурації supervisor">
    Doctor перевіряє встановлену конфігурацію supervisor (launchd/systemd/schtasks) на відсутні або застарілі стандартні значення (наприклад, залежності systemd від network-online і затримку перезапуску). Коли він знаходить невідповідність, рекомендує оновлення й може перезаписати файл служби/завдання до поточних стандартних значень.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед перезаписом конфігурації supervisor.
    - `openclaw doctor --yes` приймає стандартні запити на виправлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує власні конфігурації supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` лишає doctor у режимі лише для читання для життєвого циклу служби Gateway. Він усе ще повідомляє стан служби й запускає виправлення, не пов’язані зі службою, але пропускає встановлення/запуск/перезапуск/bootstrap служби, перезаписи конфігурації supervisor і очищення застарілих служб, оскільки цим життєвим циклом керує зовнішній supervisor.
    - У Linux doctor не перезаписує метадані команди/точки входу, доки відповідний systemd-юніт Gateway активний. Він також ігнорує неактивні додаткові юніти, схожі на Gateway, які не є застарілими, під час сканування дубльованих служб, щоб супутні файли служб не створювали зайвий шум очищення.
    - Якщо автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, встановлення/виправлення служби doctor перевіряє SecretRef, але не зберігає розв’язані значення токена у відкритому тексті в метадані середовища служби supervisor.
    - Doctor виявляє керовані значення середовища служби на базі `.env`/SecretRef, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудували inline, і перезаписує метадані служби так, щоб ці значення завантажувалися з джерела runtime замість визначення supervisor.
    - Doctor виявляє, коли команда служби все ще фіксує старий `--port` після зміни `gateway.port`, і перезаписує метадані служби на поточний порт.
    - Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не розв’язано, doctor блокує шлях встановлення/виправлення з дієвими вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/виправлення, доки режим не буде задано явно.
    - Для Linux user-systemd юнітів перевірки розбіжності токенів doctor тепер включають джерела і `Environment=`, і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Виправлення служби doctor відмовляються перезаписувати, зупиняти або перезапускати службу Gateway зі старішого бінарного файла OpenClaw, коли конфігурацію востаннє записала новіша версія. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повний перезапис через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway і порту">
    Doctor перевіряє runtime служби (PID, останній статус виходу) і попереджає, коли службу встановлено, але вона фактично не працює. Він також перевіряє конфлікти портів на порту Gateway (стандартно `18789`) і повідомляє ймовірні причини (Gateway вже працює, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли служба Gateway працює на Bun або шляху Node, керованому версіями (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджерів версій можуть ламатися після оновлень, бо служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує мігрувати на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нововстановлені або виправлені macOS LaunchAgents використовують канонічний системний PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) замість копіювання PATH інтерактивної оболонки, тому Volta, asdf, fnm, pnpm та інші каталоги менеджерів версій не змінюють, який Node розв’язують дочірні процеси. Служби Linux усе ще зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні користувацькі bin-каталоги, але вгадані резервні каталоги менеджерів версій записуються до PATH служби лише тоді, коли ці каталоги існують на диску.

  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає будь-які зміни конфігурації й ставить штамп метаданих майстра, щоб записати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервна копія + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, коли її немає, і виводить пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури робочого простору й резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
