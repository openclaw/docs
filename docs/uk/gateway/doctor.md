---
read_when:
    - Додавання або змінення міграцій doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки стану, міграції конфігурації та кроки виправлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-06T00:47:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f639eeef5768f0b4c2a1e9df0b8d67c38054b816521dd12e8a0503131eda7aa2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент ремонту й міграції для OpenClaw. Він виправляє застарілі конфігурацію/стан, перевіряє справність і надає дієві кроки ремонту.

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

    Приймає стандартні варіанти без запитів (зокрема кроки перезапуску/сервісу/ремонту sandbox, коли застосовно).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Застосовує рекомендовані ремонти без запитів (ремонти + перезапуски, де це безпечно).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Також застосовує агресивні ремонти (перезаписує власні конфігурації супервізора).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запускається без запитів і застосовує лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії перезапуску/сервісу/sandbox, які потребують підтвердження людини. Застарілі міграції стану запускаються автоматично, коли їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканує системні сервіси на наявність додаткових встановлень Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо хочете переглянути зміни перед записом, спершу відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (підсумок)

<AccordionGroup>
  <Accordion title="Справність, UI та оновлення">
    - Необов’язкове попереднє оновлення для git-встановлень (лише інтерактивно).
    - Перевірка актуальності протоколу UI (перезбирає Control UI, коли схема протоколу новіша).
    - Перевірка справності + запит на перезапуск.
    - Підсумок стану Skills (придатні/відсутні/заблоковані) і стан Plugin.

  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих пласких полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення OAuth Codex (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Попередження списку дозволених Plugin/інструментів, коли `plugins.allow` є обмежувальним, але політика інструментів усе ще запитує wildcard або інструменти, що належать Plugin.
    - Міграція застарілого стану на диску (сеанси/каталог агента/автентифікація WhatsApp).
    - Міграція застарілих ключів контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища Cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, payload `provider`, прості резервні webhook-завдання `notify: true`).
    - Міграція застарілої runtime-політики агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли Plugin увімкнено; коли `plugins.enabled=false`, застарілі посилання на Plugin вважаються інертною конфігурацією ізоляції та зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файлів блокування сеансів і очищення застарілих блокувань.
    - Ремонт транскриптів сеансів для дубльованих гілок переписування prompt, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для відновлення перезапуску завислого subagent із підтримкою `--fix` для очищення застарілих прапорців перерваного відновлення, щоб під час запуску дочірній процес не продовжував вважатися перерваним перезапуском.
    - Перевірки цілісності стану та дозволів (сеанси, транскрипти, каталог стану).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Справність автентифікації моделей: перевіряє завершення строку дії OAuth, може оновлювати токени, строк дії яких спливає, і повідомляє про стани cooldown/disabled auth-profile.
    - Виявлення додаткового каталогу workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, сервіси та супервізори">
    - Ремонт образу sandbox, коли sandboxing увімкнено.
    - Міграція застарілих сервісів і виявлення додаткових Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Runtime-перевірки Gateway (сервіс встановлено, але не запущено; кешована мітка launchd).
    - Попередження про стан каналів (перевіряються з запущеного Gateway).
    - Перевірки чутливості WhatsApp для деградованого стану event-loop Gateway, коли локальні TUI-клієнти ще працюють; `--fix` зупиняє лише перевірені локальні TUI-клієнти.
    - Ремонт маршруту Codex для застарілих посилань на моделі `openai-codex/*` в основних моделях, fallback, перевизначеннях heartbeat/subagent/compaction, hooks, перевизначеннях моделей каналів і закріпленнях маршруту сеансу; `--fix` переписує їх на `openai/*` і вибирає `agentRuntime.id: "codex"` лише коли Codex Plugin встановлено, увімкнено, він надає harness `codex` і має придатний OAuth. Інакше він вибирає `agentRuntime.id: "pi"`.
    - Аудит конфігурації супервізора (launchd/systemd/schtasks) з необов’язковим ремонтом.
    - Очищення середовища вбудованого proxy для сервісів Gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи version-manager).
    - Діагностика конфлікту портів Gateway (типово `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та сполучення">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли джерела токена немає; не перезаписує конфігурації token SecretRef).
    - Виявлення проблем зі сполученням пристрою (очікувані запити першого сполучення, очікувані оновлення ролі/області, дрейф застарілого локального кешу device-token і дрейф автентифікації paired-record).

  </Accordion>
  <Accordion title="Workspace і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу workspace (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка готовності Skills для агента за замовчуванням; повідомляє про дозволені Skills із відсутніми binary, env, config або вимогами OS, а `--fix` може вимкнути недоступні Skills у `skills.entries`.
    - Перевірка стану shell completion і автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера embedding для пошуку пам’яті (локальна модель, ключ віддаленого API або binary QMD).
    - Перевірки source-встановлення (невідповідність pnpm workspace, відсутні UI-ресурси, відсутній binary tsx).
    - Записує оновлену конфігурацію + метадані майстра.

  </Accordion>
</AccordionGroup>

## Зворотне заповнення та скидання UI Dreams

Сцена Dreams у Control UI містить дії **Зворотне заповнення**, **Скидання** та **Очистити Grounded** для grounded-процесу Dreaming. Ці дії використовують RPC-методи в стилі gateway doctor, але вони **не** є частиною ремонту/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Зворотне заповнення** сканує історичні файли `memory/YYYY-MM-DD.md` в активному workspace, запускає grounded REM diary pass і записує оборотні записи зворотного заповнення в `DREAMS.md`.
- **Скидання** видаляє лише ці позначені записи diary зворотного заповнення з `DREAMS.md`.
- **Очистити Grounded** видаляє лише підготовлені короткострокові записи тільки grounded, які походять з історичного replay і ще не накопичили live recall або daily support.

Чого вони **не** роблять самі по собі:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не додають автоматично grounded-кандидатів у live-сховище короткострокового просування, якщо ви явно спершу не запустите підготовчий шлях CLI

Якщо хочете, щоб grounded historical replay впливав на звичайну смугу deep promotion, натомість використовуйте CLI-потік:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це додає grounded durable-кандидатів у short-term dreaming store, залишаючи `DREAMS.md` поверхнею для перевірки.

## Докладна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-встановлення)">
    Якщо це git checkout і doctor запущено інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх у поточну схему.

    Це включає застарілі пласкі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у мапу провайдера.

    Doctor також попереджає, коли `plugins.allow` непорожній, а політика інструментів використовує
    wildcard або записи інструментів, що належать Plugin. `tools.allow: ["*"]` відповідає лише інструментам
    від Plugin, які фактично завантажуються; він не обходить ексклюзивний список дозволених Plugin.
    Doctor записує `plugins.bundledDiscovery: "compat"` для мігрованих
    застарілих конфігурацій списку дозволених, щоб зберегти наявну поведінку bundled provider, а
    потім вказує на строгіше налаштування `"allowlist"`.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить deprecated keys, інші команди відмовляються запускатися й просять запустити `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час старту, коли виявляє застарілий формат конфігурації, тому застарілі конфігурації ремонтуються без ручного втручання. Міграції сховища Cron job обробляються через `openclaw doctor --fix`.

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
    - Для каналів з іменованими `accounts`, але залишковими значеннями каналу верхнього рівня для одного облікового запису, перенесіть ці значення, прив’язані до облікового запису, у підвищений обліковий запис, вибраний для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - вилучіть `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для тайм-аутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - вилучіть `browser.relayBindHost` (застаріле налаштування ретранслятора розширення)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (під час запуску Gateway також пропускає провайдерів, у яких `api` задано майбутнім або невідомим значенням enum, замість аварійного завершення із закритим доступом)

    Попередження doctor також містять настанови щодо типового облікового запису для каналів із кількома обліковими записами:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` задано як невідомий ID облікового запису, doctor попереджає і перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі до неправильного API або обнулити витрати. Doctor попереджає, щоб ви могли вилучити перевизначення й відновити маршрутизацію API та витрати для кожної моделі.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Якщо ваша конфігурація браузера все ще вказує на вилучений шлях розширення Chrome, doctor нормалізує її до поточної моделі під’єднання Chrome MCP на локальному хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` вилучається

    Doctor також перевіряє шлях Chrome MCP на локальному хості, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для типових профілів автопідключення
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці інспектування браузера (наприклад, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути налаштування з боку Chrome за вас. Chrome MCP на локальному хості все ще потребує:

    - браузер на основі Chromium 144+ на хості gateway/node
    - браузер, запущений локально
    - віддалене налагодження, увімкнене в цьому браузері
    - схвалення першого запиту згоди на під’єднання в браузері

    Готовність тут стосується лише передумов локального під’єднання. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, усе ще потребують керованого браузера або сирого профілю CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують сирий CDP.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor перевіряє кінцеву точку авторизації OpenAI, щоб переконатися, що локальний стек TLS Node/OpenSSL може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor виводить настанови з виправлення для конкретної платформи. На macOS із Homebrew Node виправлення зазвичай таке: `brew postinstall ca-certificates`. З `--deep` перевірка виконується навіть тоді, коли gateway справний.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Якщо раніше ви додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть затіняти вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі транспортні налаштування поряд із Codex OAuth, щоб ви могли вилучити або переписати застаріле перевизначення транспорту й повернути вбудовану поведінку маршрутизації/резервування. Користувацькі проксі та перевизначення лише заголовків усе ще підтримуються й не викликають цього попередження.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor перевіряє наявність застарілих посилань на моделі `openai-codex/*`. Нативна маршрутизація обв’язки Codex використовує канонічні посилання на моделі `openai/*` плюс `agentRuntime.id: "codex"`, щоб хід проходив через обв’язку app-server Codex замість шляху OpenClaw PI OpenAI.

    У режимі `--fix` / `--repair` doctor переписує порушені посилання типового агента й окремих агентів, включно з основними моделями, резервними моделями, перевизначеннями heartbeat/subagent/compaction, hooks, перевизначеннями моделей каналів і застарілим збереженим станом маршруту сесії:

    - `openai-codex/gpt-*` стає `openai/gpt-*`.
    - Відповідний runtime агента стає `agentRuntime.id: "codex"` лише коли Codex встановлено, увімкнено, він надає обв’язку `codex` і має придатний OAuth.
    - Інакше відповідний runtime агента стає `agentRuntime.id: "pi"`.
    - Наявні списки резервних моделей зберігаються з переписаними застарілими записами; скопійовані налаштування для кожної моделі переміщуються із застарілого ключа до канонічного ключа `openai/*`.
    - Збережені `modelProvider`/`providerOverride`, `model`/`modelOverride`, сповіщення про резервування, прив’язки auth-profile і прив’язки обв’язки Codex відновлюються в усіх виявлених сховищах сесій агентів.
    - `/codex ...` означає «керувати нативною розмовою Codex із чату або прив’язати її».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor також сканує виявлені сховища сесій агентів на наявність застарілого автоматично створеного стану маршруту після переміщення налаштованих моделей або runtime з маршруту, що належить Plugin, як-от Codex.

    `openclaw doctor --fix` може очищати автоматично створений застарілий стан, як-от закріплення моделей `modelOverrideSource: "auto"`, метадані моделей runtime, закріплені ID обв’язок, прив’язки сесій CLI та автоматичні перевизначення auth-profile, коли їхній власний маршрут більше не налаштовано. Явні користувацькі або застарілі вибори моделей сесії повідомляються для ручного перегляду й лишаються недоторканими; перемикайте їх через `/model ...`, `/new` або скидайте сесію, коли цей маршрут більше не потрібен.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor може мігрувати старіші макети на диску в поточну структуру:

    - Сховище сесій + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілого `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID облікового запису: `default`)

    Ці міграції виконуються за принципом найкращих зусиль і є ідемпотентними; doctor видаватиме попередження, коли залишає будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі сесії + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапляли в шлях для кожного агента без ручного запуску doctor. Нормалізація провайдера talk/мапи провайдерів тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не спричиняють повторних no-op змін `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor сканує всі встановлені маніфести Plugin на застарілі ключі можливостей верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли їх знайдено, він пропонує перемістити їх в об’єкт `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже має ті самі значення, застарілий ключ вилучається без дублювання даних.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor також перевіряє сховище завдань cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, якщо перевизначено) на старі форми завдань, які планувальник усе ще приймає для сумісності.

    Поточні очищення cron містять:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми delivery у payload `provider` → явний `delivery.channel`
    - прості застарілі fallback-завдання webhook `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий fallback notify з наявним режимом delivery, що не є webhook, doctor попереджає й залишає це завдання для ручного перегляду.

    У Linux doctor також попереджає, коли crontab користувача все ще викликає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`. Цей локальний для хоста скрипт не підтримується поточним OpenClaw і може записувати хибні повідомлення `Gateway inactive` до `~/.openclaw/logs/whatsapp-health.log`, коли cron не може досягти користувацької шини systemd. Видаліть застарілий запис crontab за допомогою `crontab -e`; для поточних перевірок справності використовуйте `openclaw channels status --probe`, `openclaw doctor` і `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Очищення блокування сесій">
    Doctor сканує кожен каталог сесії агента на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сесії. Для кожного знайденого файлу блокування він повідомляє: шлях, PID, чи PID досі активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше друкує примітку й наказує повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілки транскрипта сесії">
    Doctor сканує файли JSONL сесій агентів на дубльовану форму гілки, створену помилкою перезапису транскрипта промптів 2026.4.24: покинутий хід користувача з внутрішнім runtime-контекстом OpenClaw плюс активний сусідній елемент із тим самим видимим промптом користувача. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файлу поряд з оригіналом і переписує транскрипт на активну гілку, щоб історія gateway і читачі пам’яті більше не бачили дубльованих ходів.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сесій, маршрутизація та безпека)">
    Каталог стану — це операційний стовбур мозку. Якщо він зникне, ви втратите сесії, облікові дані, журнали й конфігурацію (якщо не маєте резервних копій деінде).

    Doctor перевіряє:

    - **Відсутній каталог стану**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Каталог стану macOS, синхронізований із хмарою**: попереджає, коли стан розташований під iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, бо шляхи з синхронізацією можуть спричиняти повільніший I/O і перегони блокування/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розташований на джерелі монтування `mmcblk*`, бо випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сесій та облікових даних.
    - **Відсутні каталоги сесій**: `sessions/` і каталог сховища сесій потрібні для збереження історії та уникнення аварій `ENOENT`.
    - **Невідповідність транскрипта**: попереджає, коли в нещодавніх записах сесій бракує файлів транскрипта.
    - **Головна сесія "1-line JSONL"**: позначає випадки, коли головний транскрипт має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли кілька папок `~/.openclaw` існують у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділитися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запустити його на віддаленому хості (стан зберігається там).
    - **Дозволи файлу конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує посилити дозволи до `600`.

  </Accordion>
  <Accordion title="5. Справність автентифікації моделей (закінчення OAuth)">
    Doctor перевіряє профілі OAuth у сховищі автентифікації, попереджає, коли токени скоро закінчуються або вже закінчилися, і може оновити їх, коли це безпечно. Якщо профіль Anthropic OAuth/токена застарів, він пропонує API-ключ Anthropic або шлях setup-token Anthropic. Запити на оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад, `refresh_token_reused`, `invalid_grant` або provider повідомляє, що потрібно знову ввійти), doctor повідомляє, що потрібна повторна автентифікація, і друкує точну команду `openclaw models auth login --provider ...`, яку треба виконати.

    Doctor також повідомляє про профілі автентифікації, які тимчасово непридатні через:

    - короткі cooldowns (ліміти швидкості/тайм-аути/помилки автентифікації)
    - довші вимкнення (помилки billing/credit)

  </Accordion>
  <Accordion title="6. Перевірка моделі hooks">
    Якщо встановлено `hooks.gmail.model`, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли його не вдасться розв’язати або воно заборонене.
  </Accordion>
  <Accordion title="7. Відновлення образу sandbox">
    Коли sandboxing увімкнено, doctor перевіряє образи Docker і пропонує зібрати їх або перейти на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Очищення інсталяції Plugin">
    Doctor видаляє застарілий створений OpenClaw проміжний стан залежностей plugin у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Це охоплює застарілі згенеровані корені залежностей, старі каталоги install-stage, локальні для пакета залишки від попереднього коду відновлення залежностей bundled-plugin, а також осиротілі або відновлені керовані npm-копії bundled `@openclaw/*` plugins, які можуть затіняти поточний bundled-маніфест.

    Doctor також може повторно інсталювати відсутні завантажувані plugins, коли конфігурація посилається на них, але локальний реєстр plugin не може їх знайти. Приклади включають матеріальні `plugins.entries`, налаштовані параметри каналу/provider/пошуку та налаштовані runtime агентів. Під час оновлень пакета doctor уникає відновлення plugin через package manager, доки core-пакет замінюється; якщо налаштований plugin усе ще потребує відновлення, запустіть `openclaw doctor --fix` ще раз після оновлення. Запуск Gateway і перезавантаження конфігурації не запускають package managers; інсталяції plugin залишаються явною роботою doctor/install/update.

  </Accordion>
  <Accordion title="8. Міграції служби Gateway і підказки з очищення">
    Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити службу OpenClaw із поточним портом gateway. Він також може сканувати додаткові gateway-подібні служби й друкувати підказки з очищення. Іменовані за профілем служби OpenClaw gateway вважаються повноцінними й не позначаються як "extra."

    У Linux, якщо user-level служба gateway відсутня, але існує system-level служба OpenClaw gateway, doctor не встановлює автоматично другу user-level службу. Перевірте за допомогою `openclaw gateway status --deep` або `openclaw doctor --deep`, а потім видаліть дублікат або встановіть `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли системний supervisor керує життєвим циклом gateway.

  </Accordion>
  <Accordion title="8b. Міграція Startup Matrix">
    Коли обліковий запис каналу Matrix має очікувану або придатну до дії міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює передміграційний знімок, а потім запускає best-effort кроки міграції: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки журналюються, а запуск продовжується. У режимі лише для читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Сполучення пристроїв і розходження автентифікації">
    Doctor тепер перевіряє стан сполучення пристроїв як частину звичайного проходу перевірки справності.

    Що він повідомляє:

    - очікувані запити на перше сполучення
    - очікувані підвищення ролі для вже сполучених пристроїв
    - очікувані підвищення scope для вже сполучених пристроїв
    - виправлення невідповідності публічного ключа, коли id пристрою все ще збігається, але ідентичність пристрою більше не відповідає затвердженому запису
    - сполучені записи без активного токена для затвердженої ролі
    - сполучені токени, чиї scopes відхилилися за межі затвердженого базису сполучення
    - локальні кешовані записи device-token для поточної машини, що передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не затверджує автоматично запити на сполучення й не ротує автоматично токени пристроїв. Натомість він друкує точні наступні кроки:

    - перевірити очікувані запити за допомогою `openclaw devices list`
    - затвердити точний запит за допомогою `openclaw devices approve <requestId>`
    - згенерувати свіжий токен за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видалити й повторно затвердити застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину "already paired but still getting pairing required": doctor тепер відрізняє перше сполучення від очікуваних підвищень ролі/scope і від застарілого відхилення токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли provider відкритий для DM без allowlist або коли policy налаштовано небезпечно.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запуск відбувається як користувацька служба systemd, doctor забезпечує ввімкнення lingering, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан робочого простору (skills, plugins і застарілі каталоги)">
    Doctor друкує підсумок стану робочого простору для агента за замовчуванням:

    - **Стан Skills**: рахує eligible, missing-requirements і allowlist-blocked skills.
    - **Застарілі каталоги робочого простору**: попереджає, коли `~/openclaw` або інші застарілі каталоги робочого простору існують поряд із поточним робочим простором.
    - **Стан Plugin**: рахує увімкнені/вимкнені/помилкові plugins; перелічує plugin IDs для будь-яких помилок; повідомляє можливості bundle plugin.
    - **Попередження сумісності Plugin**: позначає plugins, що мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки під час завантаження, виведені реєстром plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Doctor перевіряє, чи bootstrap-файли робочого простору (наприклад `AGENTS.md`, `CLAUDE.md` або інші інжектовані файли контексту) близькі до налаштованого бюджету символів або перевищують його. Він повідомляє сирі проти інжектованих кількості символів для кожного файлу, відсоток усічення, причину усічення (`max/file` або `max/total`) і загальну кількість інжектованих символів як частку загального бюджету. Коли файли усічені або близькі до ліміту, doctor друкує поради з налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілих channel plugin">
    Коли `openclaw doctor --fix` видаляє відсутній channel plugin, він також видаляє висячий channel-scoped config, що посилався на цей plugin: записи `channels.<id>`, цілі heartbeat, які називали канал, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає циклам завантаження Gateway, коли runtime каналу зник, але конфігурація все ще просить gateway прив’язатися до нього.
  </Accordion>
  <Accordion title="11c. Автодоповнення shell">
    Doctor перевіряє, чи встановлено автодоповнення tab для поточного shell (zsh, bash, fish або PowerShell):

    - Якщо профіль shell використовує повільний динамічний шаблон автодоповнення (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта кешованого файлу.
    - Якщо автодоповнення налаштовано в профілі, але файл кешу відсутній, doctor автоматично регенерує кеш.
    - Якщо автодоповнення взагалі не налаштовано, doctor пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність локальної автентифікації токена gateway.

    - Якщо режим токена потребує токен і джерела токена немає, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає й не перезаписує його plaintext.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано token SecretRef.

  </Accordion>
  <Accordion title="12b. Відновлення з урахуванням SecretRef у режимі лише для читання">
    Деякі потоки відновлення мають перевіряти налаштовані облікові дані, не послаблюючи runtime-поведінку fail-fast.

    - `openclaw doctor --fix` тепер використовує ту саму read-only модель зведення SecretRef, що й команди родини status, для цільових виправлень конфігурації.
    - Приклад: виправлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані бота, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає автоматичне розв’язання замість аварійного завершення або помилкового повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Перевірка стану Gateway + перезапуск">
    Doctor виконує перевірку стану й пропонує перезапустити Gateway, коли він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку пам’яті">
    Doctor перевіряє, чи налаштований провайдер embedding для пошуку пам’яті готовий для типового агента. Поведінка залежить від налаштованого backend і провайдера:

    - **QMD backend**: перевіряє, чи бінарний файл `qmd` доступний і може запускатися. Якщо ні, виводить поради щодо виправлення, зокрема npm-пакет і варіант ручного шляху до бінарного файла.
    - **Явний локальний провайдер**: перевіряє наявність локального файла моделі або розпізнаної віддаленої/завантажуваної URL-адреси моделі. Якщо бракує, пропонує перейти на віддаленого провайдера.
    - **Явний віддалений провайдер** (`openai`, `voyage` тощо): перевіряє, чи API-ключ присутній у середовищі або сховищі автентифікації. Якщо бракує, виводить практичні підказки для виправлення.
    - **Автоматичний провайдер**: спершу перевіряє доступність локальної моделі, а потім пробує кожного віддаленого провайдера в порядку автоматичного вибору.

    Коли доступний кешований результат перевірки Gateway (Gateway був справним на момент перевірки), doctor зіставляє його результат із конфігурацією, видимою для CLI, і зазначає будь-які розбіжності. Doctor не запускає новий embedding ping у типовому шляху; використовуйте глибоку команду стану пам’яті, коли потрібна жива перевірка провайдера.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding під час виконання.

  </Accordion>
  <Accordion title="14. Попередження стану каналу">
    Якщо Gateway справний, doctor запускає перевірку стану каналу й повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит і виправлення конфігурації supervisor">
    Doctor перевіряє встановлену конфігурацію supervisor (launchd/systemd/schtasks) на відсутні або застарілі типові значення (наприклад, залежності systemd від network-online і затримку перезапуску). Коли знаходить невідповідність, рекомендує оновлення й може переписати файл служби/завдання до поточних типових значень.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації supervisor.
    - `openclaw doctor --yes` приймає типові запити на виправлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor read-only для життєвого циклу служби Gateway. Він і далі повідомляє стан служби та виконує виправлення, не пов’язані зі службою, але пропускає встановлення/запуск/перезапуск/bootstrap служби, переписування конфігурації supervisor і очищення legacy-служб, оскільки цим життєвим циклом керує зовнішній supervisor.
    - У Linux doctor не переписує метадані команди/entrypoint, доки відповідний systemd-модуль Gateway активний. Він також ігнорує неактивні не-legacy додаткові модулі, схожі на Gateway, під час сканування дубльованих служб, щоб супутні файли служб не створювали шум очищення.
    - Якщо автентифікація за токеном вимагає токен і `gateway.auth.token` керується SecretRef, встановлення/виправлення служби doctor перевіряє SecretRef, але не зберігає розв’язані plaintext-значення токена в метадані середовища служби supervisor.
    - Doctor виявляє керовані `.env`/SecretRef-backed значення середовища служби, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудували inline, і переписує метадані служби так, щоб ці значення завантажувалися з runtime-джерела, а не з визначення supervisor.
    - Doctor виявляє, коли команда служби все ще фіксує старий `--port` після зміни `gateway.port`, і переписує метадані служби на поточний порт.
    - Якщо автентифікація за токеном вимагає токен, а налаштований SecretRef токена не розв’язано, doctor блокує шлях встановлення/виправлення з практичними порадами.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/виправлення, доки режим не буде задано явно.
    - Для Linux user-systemd модулів перевірки doctor на розбіжність токена тепер охоплюють і джерела `Environment=`, і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Виправлення служб doctor відмовляються переписувати, зупиняти або перезапускати службу Gateway зі старішого бінарного файла OpenClaw, коли конфігурацію востаннє записала новіша версія. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway + порту">
    Doctor перевіряє runtime служби (PID, останній статус виходу) і попереджає, коли службу встановлено, але вона фактично не запущена. Він також перевіряє конфлікти портів на порту Gateway (типово `18789`) і повідомляє ймовірні причини (Gateway уже запущено, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли служба Gateway працює на Bun або шляху Node, керованому версіями (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram вимагають Node, а шляхи менеджерів версій можуть ламатися після оновлень, бо служба не завантажує ініціалізацію вашої shell. Doctor пропонує міграцію на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нововстановлені або виправлені macOS LaunchAgents використовують канонічний системний PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) замість копіювання інтерактивного shell PATH, тому Volta, asdf, fnm, pnpm та інші каталоги менеджерів версій не змінюють, які дочірні процеси Node розв’язуються. Linux-служби й далі зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні каталоги user-bin, але вгадані fallback-каталоги менеджерів версій записуються до service PATH лише тоді, коли ці каталоги існують на диску.

  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає будь-які зміни конфігурації та ставить позначку в метаданих майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервна копія + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, коли її бракує, і виводить пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури робочого простору та резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
