---
read_when:
    - Додавання або змінювання міграцій doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки справності, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-07T13:18:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент ремонту й міграції для OpenClaw. Він виправляє застарілі конфігурацію/стан, перевіряє справність і надає практичні кроки для ремонту.

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

    Приймати типові значення без запитів (зокрема кроки ремонту перезапуску/служби/пісочниці, коли застосовно).

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

    Також застосувати агресивні ремонти (перезаписує власні конфігурації супервізора).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запустити без запитів і застосувати лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії перезапуску/служби/пісочниці, які потребують підтвердження людини. Міграції застарілого стану запускаються автоматично після виявлення.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканувати системні служби на наявність додаткових встановлень Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спочатку відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (коротко)

<AccordionGroup>
  <Accordion title="Справність, UI та оновлення">
    - Необов’язкове попереднє оновлення для git-встановлень (лише інтерактивно).
    - Перевірка актуальності протоколу UI (перезбирає Control UI, коли схема протоколу новіша).
    - Перевірка справності + запит на перезапуск.
    - Зведення статусу Skills (придатні/відсутні/заблоковані) і статус plugins.

  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих плоских полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення Codex OAuth (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Попередження списку дозволів plugins/tools, коли `plugins.allow` є обмежувальним, але політика інструментів досі просить wildcard або інструменти, що належать plugin.
    - Міграція застарілого стану на диску (sessions/agent dir/автентифікація WhatsApp).
    - Міграція застарілих ключів контракту маніфесту plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, payload `provider`, прості резервні webhook-завдання `notify: true`).
    - Міграція застарілої політики runtime агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації plugin, коли plugins увімкнено; коли `plugins.enabled=false`, застарілі посилання на plugin вважаються інертною конфігурацією ізоляції та зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Інспекція файлів блокування сесій і очищення застарілих блокувань.
    - Ремонт транскриптів сесій для дубльованих гілок переписування запитів, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для відновлення після перезапуску завислих subagent із підтримкою `--fix` для очищення застарілих прапорців перерваного відновлення, щоб запуск не продовжував вважати child перерваним через перезапуск.
    - Перевірки цілісності стану та дозволів (sessions, transcripts, каталог стану).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Справність автентифікації моделі: перевіряє завершення OAuth, може оновлювати токени, термін дії яких спливає, і повідомляє стани cooldown/disabled для auth-profile.
    - Виявлення додаткового каталогу workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, служби та супервізори">
    - Ремонт образу пісочниці, коли sandboxing увімкнено.
    - Міграція застарілих служб і виявлення додаткового Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime Gateway (служба встановлена, але не запущена; кешована мітка launchd).
    - Попередження статусу каналу (перевіряються із запущеного Gateway).
    - Перевірки дозволів, специфічні для каналів, містяться в `openclaw channels capabilities`; наприклад, дозволи голосового каналу Discord перевіряються за допомогою `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Перевірки чутливості WhatsApp для погіршеного стану event-loop Gateway, коли локальні клієнти TUI досі запущені; `--fix` зупиняє лише перевірені локальні клієнти TUI.
    - Ремонт маршруту Codex для застарілих посилань моделей `openai-codex/*` в основних моделях, fallback, перевизначеннях heartbeat/subagent/compaction, hooks, перевизначеннях моделей каналів і route pins сесій; `--fix` переписує їх на `openai/*` і вибирає `agentRuntime.id: "codex"` лише коли plugin Codex встановлено, увімкнено, він надає harness `codex` і має придатний OAuth. Інакше вибирається `agentRuntime.id: "pi"`.
    - Аудит конфігурації супервізора (launchd/systemd/schtasks) з необов’язковим ремонтом.
    - Очищення середовища вбудованого проксі для служб Gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи version-manager).
    - Діагностика конфліктів порту Gateway (типово `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та pairing">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли джерела токена немає; не перезаписує конфігурації токена SecretRef).
    - Виявлення проблем із pairing пристрою (очікувані запити першого pairing, очікувані оновлення ролі/обсягу, застарілий drift кешу локального device-token і drift автентифікації paired-record).

  </Accordion>
  <Accordion title="Workspace і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу workspace (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка готовності Skills для типового агента; повідомляє дозволені skills з відсутніми bins, env, config або вимогами OS, а `--fix` може вимкнути недоступні skills у `skills.entries`.
    - Перевірка статусу shell completion і автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера embedding для пошуку пам’яті (локальна модель, remote API key або binary QMD).
    - Перевірки source install (невідповідність pnpm workspace, відсутні UI assets, відсутній binary tsx).
    - Записує оновлену конфігурацію + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill і reset для Dreams UI

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для grounded dreaming workflow. Ці дії використовують RPC-методи у стилі gateway doctor, але вони **не** є частиною ремонту/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному workspace, запускає grounded REM diary pass і записує оборотні backfill entries у `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише ці позначені backfill diary entries.
- **Clear Grounded** видаляє лише staged grounded-only short-term entries, що походять з історичного replay і ще не накопичили live recall або daily support.

Чого вони самі **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не додають автоматично grounded candidates у live short-term promotion store, якщо ви спочатку явно не запустите staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайну deep promotion lane, натомість використайте CLI flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це додає grounded durable candidates у short-term dreaming store, зберігаючи `DREAMS.md` як поверхню review.

## Детальна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-встановлення)">
    Якщо це git checkout і doctor запускається інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх до поточної схеми.

    Це включає застарілі плоскі поля Talk. Поточна публічна конфігурація мовлення Talk — це `talk.provider` + `talk.providers.<provider>`, а конфігурація realtime voice — `talk.realtime.*`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у карту provider і переписує застарілі realtime selectors верхнього рівня (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) у `talk.realtime`.

    Doctor також попереджає, коли `plugins.allow` не порожній, а політика інструментів використовує
    wildcard або записи інструментів, що належать plugin. `tools.allow: ["*"]` відповідає лише інструментам
    із plugins, які фактично завантажуються; він не обходить ексклюзивний список дозволів plugin.
    Doctor записує `plugins.bundledDiscovery: "compat"` для мігрованих
    застарілих конфігурацій allowlist, щоб зберегти наявну поведінку bundled provider, а
    потім указує на суворіше налаштування `"allowlist"`.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить deprecated keys, інші команди відмовляються запускатися й просять вас виконати `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Запуск Gateway відмовляється від застарілих форматів конфігурації й просить виконати `openclaw doctor --fix`; він не переписує `openclaw.json` під час запуску. Міграції сховища cron job також обробляються через `openclaw doctor --fix`.

    Поточні міграції:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - конфігурації налаштованих каналів без видимої політики відповідей → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Для каналів з іменованими `accounts`, але залишковими значеннями каналу верхнього рівня для одного облікового запису, перемістіть ці значення з областю дії облікового запису до підвищеного облікового запису, вибраного для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видаліть `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для тайм-аутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видаліть `browser.relayBindHost` (застаріле налаштування ретрансляції розширення)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (запуск gateway також пропускає провайдерів, у яких `api` задано майбутнім або невідомим значенням enum, замість аварійного завершення із закритою відмовою)

    Попередження doctor також містять настанови щодо типового облікового запису для каналів із кількома обліковими записами:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` встановлено на невідомий ID облікового запису, doctor попереджає та перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі на неправильний API або обнулити вартість. Doctor попереджає, щоб ви могли видалити перевизначення й відновити маршрутизацію API та вартість для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера та готовність Chrome MCP">
    Якщо ваша конфігурація браузера досі вказує на видалений шлях розширення Chrome, doctor нормалізує її до поточної моделі підключення Chrome MCP на локальному хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє шлях Chrome MCP на локальному хості, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для типових профілів автоматичного підключення
    - перевіряє виявлену версію Chrome і попереджає, коли вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці inspect браузера (наприклад `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути для вас налаштування на стороні Chrome. Chrome MCP на локальному хості все ще потребує:

    - браузер на базі Chromium 144+ на хості Gateway/Node
    - браузер, запущений локально
    - віддалене налагодження, увімкнене в цьому браузері
    - підтвердження першого запиту згоди на підключення в браузері

    Готовність тут стосується лише передумов локального підключення. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, все ще потребують керованого браузера або raw CDP-профілю.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують raw CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано OAuth-профіль OpenAI Codex, doctor перевіряє endpoint авторизації OpenAI, щоб пересвідчитися, що локальний стек Node/OpenSSL TLS може перевірити ланцюг сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, протермінований сертифікат або самопідписаний сертифікат), doctor виводить настанови з виправлення для конкретної платформи. На macOS із Homebrew Node виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка виконується, навіть якщо gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо раніше ви додали застарілі транспортні налаштування в `models.providers.openai-codex`, вони можуть затінити вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі транспортні налаштування разом із Codex OAuth, щоб ви могли видалити або переписати застаріле транспортне перевизначення й повернути вбудовану маршрутизацію/резервну поведінку. Власні проксі та перевизначення лише заголовків усе ще підтримуються й не спричиняють цього попередження.
  </Accordion>
  <Accordion title="2f. Виправлення маршруту Codex">
    Doctor перевіряє застарілі посилання на моделі `openai-codex/*`. Нативна маршрутизація Codex harness використовує канонічні посилання на моделі `openai/*`; кроки агента OpenAI проходять через Codex app-server harness замість шляху OpenClaw PI OpenAI.

    У режимі `--fix` / `--repair` doctor переписує зачеплені посилання типового агента та окремих агентів, зокрема основні моделі, резервні моделі, перевизначення Heartbeat/subagent/Compaction, хуки, перевизначення моделей каналів і застарілий збережений стан маршруту сесії:

    - `openai-codex/gpt-*` стає `openai/gpt-*`.
    - Відповідне середовище виконання агента стає `agentRuntime.id: "codex"` лише коли Codex установлено, увімкнено, він надає `codex` harness і має придатний OAuth.
    - Інакше відповідне середовище виконання агента стає `agentRuntime.id: "pi"`.
    - Наявні списки резервних моделей зберігаються з переписаними застарілими записами; скопійовані налаштування для окремих моделей переміщуються із застарілого ключа до канонічного ключа `openai/*`.
    - Збережені session `modelProvider`/`providerOverride`, `model`/`modelOverride`, резервні сповіщення, прив’язки auth-profile і прив’язки Codex harness виправляються в усіх виявлених сховищах сесій агентів.
    - `/codex ...` означає «керувати або прив’язати нативну розмову Codex із чату».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

  </Accordion>
  <Accordion title="2g. Очищення маршруту сесії">
    Doctor також сканує виявлені сховища сесій агентів на застарілий автоматично створений стан маршруту після того, як ви перемістили налаштовані моделі або середовище виконання з маршруту, що належить Plugin, як-от Codex.

    `openclaw doctor --fix` може очистити автоматично створений застарілий стан, як-от прив’язки моделей `modelOverrideSource: "auto"`, метадані моделей середовища виконання, закріплені ID harness, прив’язки сесій CLI та автоматичні перевизначення auth-profile, коли маршрут-власник більше не налаштований. Явні вибори моделей користувача або застарілих сесій повідомляються для ручної перевірки й залишаються без змін; перемкніть їх за допомогою `/model ...`, `/new` або скиньте сесію, коли цей маршрут більше не призначений для використання.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (структура диска)">
    Doctor може мігрувати старіші структури на диску до поточної структури:

    - Сховище сесій + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілих `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID облікового запису: `default`)

    Ці міграції виконуються за принципом найкращої спроби та є ідемпотентними; doctor видаватиме попередження, коли залишатиме застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі сесії + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапляли в шлях для окремого агента без ручного запуску doctor. Автентифікація WhatsApp навмисно мігрується лише через `openclaw doctor`. Нормалізація провайдера/мапи провайдерів Talk тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не спричиняють повторних no-op змін `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів Plugin">
    Doctor сканує всі встановлені маніфести Plugin на застарілі ключі можливостей верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли їх знайдено, він пропонує перемістити їх в об’єкт `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища Cron">
    Doctor також перевіряє сховище завдань cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, якщо перевизначено) на старі форми завдань, які планувальник досі приймає для сумісності.

    Поточні очищення cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля доставки верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми доставки payload `provider` → явний `delivery.channel`
    - прості застарілі резервні завдання Webhook `notify: true` → явний `delivery.mode="webhook"` із `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий резервний notify з наявним режимом доставлення не через Webhook, doctor попереджає й залишає це завдання для ручного перегляду.

    У Linux doctor також попереджає, коли crontab користувача все ще викликає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`. Цей локальний для хоста скрипт не підтримується поточним OpenClaw і може записувати хибні повідомлення `Gateway inactive` до `~/.openclaw/logs/whatsapp-health.log`, коли cron не може дістатися до користувацької шини systemd. Видаліть застарілий запис crontab за допомогою `crontab -e`; використовуйте `openclaw channels status --probe`, `openclaw doctor` і `openclaw gateway status` для поточних перевірок стану.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сесій">
    Doctor сканує кожен каталог сесії агента на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сесії. Для кожного знайденого файлу блокування він повідомляє: шлях, PID, чи PID ще активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше друкує примітку й радить повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілки транскрипту сесії">
    Doctor сканує JSONL-файли сесій агентів на дубльовану форму гілки, створену помилкою переписування транскрипту prompt від 2026.4.24: покинутий користувацький хід із внутрішнім runtime-контекстом OpenClaw плюс активний sibling, що містить той самий видимий користувацький prompt. У режимі `--fix` / `--repair` doctor створює резервну копію кожного зачепленого файлу поруч з оригіналом і переписує транскрипт до активної гілки, щоб історія gateway і читачі пам’яті більше не бачили дубльованих ходів.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сесій, маршрутизація та безпека)">
    Каталог стану — це операційний стовбур системи. Якщо він зникне, ви втратите сесії, облікові дані, журнали та конфігурацію (якщо не маєте резервних копій деінде).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Синхронізований із хмарою каталог стану macOS**: попереджає, коли стан розташований під iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, бо шляхи з синхронізацією можуть спричиняти повільніше I/O та перегони блокування/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розташований на джерелі монтування `mmcblk*`, бо випадкове I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сесій та облікових даних.
    - **Каталоги сесій відсутні**: `sessions/` і каталог сховища сесій потрібні для збереження історії та уникнення аварій `ENOENT`.
    - **Невідповідність транскрипту**: попереджає, коли нещодавні записи сесій мають відсутні файли транскриптів.
    - **Основна сесія "1-line JSONL"**: позначає випадки, коли основний транскрипт має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли існує кілька папок `~/.openclaw` у домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділитися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запустити його на віддаленому хості (стан живе там).
    - **Дозволи файлу конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/всім, і пропонує посилити дозволи до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделей (закінчення OAuth)">
    Doctor перевіряє OAuth-профілі в сховищі автентифікації, попереджає, коли токени скоро закінчуються або вже закінчилися, і може оновити їх, коли це безпечно. Якщо OAuth/token-профіль Anthropic застарів, він пропонує API-ключ Anthropic або шлях setup-token Anthropic. Запити на оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад `refresh_token_reused`, `invalid_grant` або провайдер повідомляє, що потрібно знову ввійти), doctor повідомляє, що потрібна повторна автентифікація, і друкує точну команду `openclaw models auth login --provider ...`, яку слід виконати.

    Doctor також повідомляє про профілі автентифікації, тимчасово непридатні для використання через:

    - короткі періоди очікування (обмеження швидкості/тайм-аути/помилки автентифікації)
    - довші вимкнення (проблеми з оплатою/кредитами)

  </Accordion>
  <Accordion title="6. Перевірка моделі hooks">
    Якщо `hooks.gmail.model` задано, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли його неможливо розв’язати або воно заборонене.
  </Accordion>
  <Accordion title="7. Відновлення sandbox-образу">
    Коли sandboxing увімкнено, doctor перевіряє Docker-образи й пропонує зібрати їх або перемкнутися на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Очищення інсталяції Plugin">
    Doctor видаляє застарілий створений OpenClaw проміжний стан залежностей Plugin у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Це охоплює застарілі створені корені залежностей, старі каталоги install-stage, локальні для пакета залишки від попереднього коду відновлення залежностей bundled-plugin, а також осиротілі або відновлені керовані npm-копії bundled `@openclaw/*` plugins, які можуть затіняти поточний bundled manifest.

    Doctor також може перевстановити відсутні завантажувані plugins, коли конфігурація посилається на них, але локальний реєстр plugin не може їх знайти. Приклади охоплюють матеріальні `plugins.entries`, налаштовані параметри channel/provider/search і налаштовані agent runtimes. Під час оновлень пакета doctor уникає запуску відновлення plugin через менеджер пакунків, поки основний пакет замінюється; запустіть `openclaw doctor --fix` знову після оновлення, якщо налаштований plugin усе ще потребує відновлення. Запуск Gateway і перезавантаження конфігурації не запускають менеджери пакунків; інсталяції plugin залишаються явною роботою doctor/install/update.

  </Accordion>
  <Accordion title="8. Міграції сервісу Gateway і підказки з очищення">
    Doctor виявляє застарілі сервіси gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити сервіс OpenClaw з використанням поточного порту gateway. Він також може сканувати додаткові gateway-подібні сервіси й друкувати підказки з очищення. Іменовані за профілем сервіси gateway OpenClaw вважаються першокласними й не позначаються як "extra."

    У Linux, якщо користувацький сервіс gateway відсутній, але існує системний сервіс gateway OpenClaw, doctor не встановлює автоматично другий користувацький сервіс. Перевірте за допомогою `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли системний супервізор керує життєвим циклом gateway.

  </Accordion>
  <Accordion title="8b. Міграція запуску Matrix">
    Коли обліковий запис каналу Matrix має pending або actionable застарілу міграцію стану, doctor (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім виконує best-effort кроки міграції: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки журналюються, а запуск продовжується. У режимі лише читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Сполучення пристроїв і дрейф автентифікації">
    Doctor тепер перевіряє стан сполучення пристроїв як частину звичайного проходу перевірки стану.

    Що він повідомляє:

    - pending запити першого сполучення
    - pending підвищення ролі для вже сполучених пристроїв
    - pending розширення scope для вже сполучених пристроїв
    - відновлення невідповідності відкритого ключа, коли id пристрою все ще збігається, але ідентичність пристрою більше не збігається із затвердженим записом
    - сполучені записи без активного токена для затвердженої ролі
    - сполучені токени, чиї scopes відхилилися від затвердженої baseline сполучення
    - локальні кешовані записи device-token для поточної машини, що передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не затверджує автоматично запити на сполучення й не обертає автоматично токени пристроїв. Натомість він друкує точні наступні кроки:

    - перегляньте pending запити за допомогою `openclaw devices list`
    - затвердьте точний запит за допомогою `openclaw devices approve <requestId>`
    - оберніть свіжий токен за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видаліть і повторно затвердьте застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину "already paired but still getting pairing required": doctor тепер відрізняє перше сполучення від pending підвищень role/scope і від застарілого дрейфу token/device-identity.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли provider відкритий для DM без allowlist або коли policy налаштовано небезпечним способом.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запущено як користувацький сервіс systemd, doctor гарантує, що lingering увімкнено, щоб gateway залишався активним після виходу.
  </Accordion>
  <Accordion title="11. Стан робочого простору (Skills, plugins і застарілі каталоги)">
    Doctor друкує підсумок стану робочого простору для типового агента:

    - **Стан Skills**: рахує придатні, з відсутніми вимогами та заблоковані allowlist skills.
    - **Застарілі каталоги робочого простору**: попереджає, коли `~/openclaw` або інші застарілі каталоги робочого простору існують поруч із поточним робочим простором.
    - **Стан Plugin**: рахує увімкнені/вимкнені/помилкові plugins; перелічує plugin IDs для будь-яких помилок; повідомляє capabilities bundle plugin.
    - **Попередження сумісності Plugin**: позначає plugins, що мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки під час завантаження, виведені реєстром plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Doctor перевіряє, чи bootstrap-файли робочого простору (наприклад `AGENTS.md`, `CLAUDE.md` або інші injected context files) близькі до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файлу сирі та injected кількості символів, відсоток усічення, причину усічення (`max/file` або `max/total`) і загальну кількість injected символів як частку від загального бюджету. Коли файли усічені або близькі до ліміту, doctor друкує поради щодо налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілого channel plugin">
    Коли `openclaw doctor --fix` видаляє відсутній channel plugin, він також видаляє dangling конфігурацію з областю каналу, яка посилалася на цей plugin: записи `channels.<id>`, heartbeat targets, що називали канал, і overrides `agents.*.models["<channel>/*"]`. Це запобігає boot loops Gateway, коли channel runtime зник, але конфігурація все ще просить gateway прив’язатися до нього.
  </Accordion>
  <Accordion title="11c. Автодоповнення оболонки">
    Doctor перевіряє, чи встановлено tab completion для поточної оболонки (zsh, bash, fish або PowerShell):

    - Якщо профіль оболонки використовує повільний динамічний шаблон completion (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта кешованого файлу.
    - Якщо completion налаштовано у профілі, але кеш-файл відсутній, doctor автоматично регенерує кеш.
    - Якщо completion взагалі не налаштовано, doctor пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність автентифікації локального gateway token.

    - Якщо режим token потребує token і джерела token немає, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає й не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує лише тоді, коли не налаштовано token SecretRef.

  </Accordion>
  <Accordion title="12b. Ремонти з урахуванням SecretRef у режимі лише читання">
    Деякі потоки ремонту мають перевіряти налаштовані облікові дані, не послаблюючи поведінку швидкого збою під час виконання.

    - `openclaw doctor --fix` тепер використовує ту саму модель підсумку SecretRef у режимі лише читання, що й команди сімейства status, для цільових ремонтів конфігурації.
    - Приклад: ремонт Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані бота, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху виконання команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає автоматичне розв’язання замість аварійного завершення або хибного повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Перевірка справності Gateway + перезапуск">
    Doctor виконує перевірку справності й пропонує перезапустити Gateway, коли він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку в пам’яті">
    Doctor перевіряє, чи налаштований постачальник embedding для пошуку в пам’яті готовий для стандартного агента. Поведінка залежить від налаштованого бекенду та постачальника:

    - **Бекенд QMD**: перевіряє, чи бінарний файл `qmd` доступний і може запускатися. Якщо ні, виводить інструкції з виправлення, зокрема npm-пакет і варіант ручного шляху до бінарного файлу.
    - **Явний локальний постачальник**: перевіряє наявність локального файлу моделі або розпізнаної віддаленої/завантажуваної URL-адреси моделі. Якщо бракує, пропонує перейти на віддаленого постачальника.
    - **Явний віддалений постачальник** (`openai`, `voyage` тощо): перевіряє, чи ключ API присутній у середовищі або сховищі автентифікації. Якщо бракує, виводить дієві підказки з виправлення.
    - **Автоматичний постачальник**: спершу перевіряє доступність локальної моделі, а потім пробує кожного віддаленого постачальника в порядку автоматичного вибору.

    Коли доступний кешований результат перевірки Gateway (Gateway був справний на момент перевірки), doctor звіряє його результат із конфігурацією, видимою для CLI, і зазначає будь-яку розбіжність. Doctor не запускає нову перевірку embedding за стандартним шляхом; використовуйте команду глибокого статусу пам’яті, коли потрібна жива перевірка постачальника.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding під час виконання.

  </Accordion>
  <Accordion title="14. Попередження про статус каналу">
    Якщо Gateway справний, doctor запускає перевірку статусу каналу та повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит конфігурації супервізора + ремонт">
    Doctor перевіряє встановлену конфігурацію супервізора (launchd/systemd/schtasks) на відсутні або застарілі стандартні значення (наприклад, залежності systemd від network-online і затримку перезапуску). Коли він знаходить невідповідність, рекомендує оновлення й може переписати файл служби/завдання до поточних стандартних значень.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації супервізора.
    - `openclaw doctor --yes` приймає стандартні запити ремонту.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації супервізора.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` зберігає doctor у режимі лише читання для життєвого циклу служби Gateway. Він усе одно повідомляє про справність служби й виконує ремонти, не пов’язані зі службою, але пропускає встановлення/запуск/перезапуск/bootstrap служби, переписування конфігурації супервізора та очищення застарілих служб, тому що цим життєвим циклом керує зовнішній супервізор.
    - У Linux doctor не переписує метадані команди/точки входу, доки відповідний systemd unit Gateway активний. Він також ігнорує неактивні додаткові unit-и, схожі на Gateway, які не є застарілими, під час сканування дубльованих служб, щоб супутні файли служб не створювали зайвого шуму очищення.
    - Якщо токенна автентифікація потребує токена, а `gateway.auth.token` керується SecretRef, встановлення/ремонт служби doctor перевіряє SecretRef, але не зберігає розв’язані значення токена у відкритому тексті в метаданих середовища служби супервізора.
    - Doctor виявляє керовані значення середовища служби на основі `.env`/SecretRef, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудували inline, і переписує метадані служби так, щоб ці значення завантажувалися з runtime-джерела, а не з визначення супервізора.
    - Doctor виявляє, коли команда служби все ще закріплює старий `--port` після зміни `gateway.port`, і переписує метадані служби на поточний порт.
    - Якщо токенна автентифікація потребує токена, а налаштований SecretRef токена не розв’язано, doctor блокує шлях встановлення/ремонту з дієвими інструкціями.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/ремонт, доки режим не буде задано явно.
    - Для user-systemd unit-ів у Linux перевірки розбіжностей токена doctor тепер враховують джерела як `Environment=`, так і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Ремонти служби doctor відмовляються переписувати, зупиняти або перезапускати службу Gateway зі старішого бінарного файлу OpenClaw, коли конфігурацію востаннє було записано новішою версією. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway + порту">
    Doctor перевіряє runtime служби (PID, останній статус виходу) і попереджає, коли службу встановлено, але вона фактично не працює. Він також перевіряє конфлікти портів на порту Gateway (стандартно `18789`) і повідомляє ймовірні причини (Gateway уже запущено, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли служба Gateway працює на Bun або шляху Node, керованому версіями (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджерів версій можуть ламатися після оновлень, бо служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує перейти на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нововстановлені або відремонтовані macOS LaunchAgents використовують канонічний системний PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) замість копіювання PATH інтерактивної оболонки, тому Volta, asdf, fnm, pnpm та інші каталоги менеджерів версій не змінюють, який Node розв’язують дочірні процеси. Служби Linux і далі зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні каталоги user-bin, але припущені резервні каталоги менеджерів версій записуються до PATH служби лише тоді, коли ці каталоги існують на диску.

  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає будь-які зміни конфігурації й проставляє метадані майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочої області (резервна копія + система пам’яті)">
    Doctor пропонує систему пам’яті робочої області, коли її бракує, і виводить пораду щодо резервного копіювання, якщо робоча область ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури робочої області та резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
