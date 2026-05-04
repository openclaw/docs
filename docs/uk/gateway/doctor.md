---
read_when:
    - Додавання або змінення міграцій doctor
    - Впровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки стану, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-04T22:54:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 86d862ccc56c0d979c2a957272b2e2f5c5fc7bb1ae8142748630ede0003891de
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент ремонту та міграції для OpenClaw. Він виправляє застарілі конфігурацію/стан, перевіряє працездатність і надає практичні кроки для ремонту.

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

    Прийняти типові значення без запитів (зокрема кроки ремонту перезапуску/служби/пісочниці, коли застосовно).

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

    Також застосувати агресивні ремонти (перезаписує користувацькі конфігурації супервізора).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запустити без запитів і застосовувати лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії перезапуску/служби/пісочниці, які потребують підтвердження людини. Міграції застарілого стану запускаються автоматично, коли їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканувати системні служби на наявність додаткових встановлень gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спершу відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (підсумок)

<AccordionGroup>
  <Accordion title="Стан, UI та оновлення">
    - Необов’язкове попереднє оновлення для встановлень із git (лише інтерактивно).
    - Перевірка актуальності протоколу UI (перезбирає Control UI, коли схема протоколу новіша).
    - Перевірка стану + запит на перезапуск.
    - Підсумок стану Skills (придатні/відсутні/заблоковані) і стан Plugin.

  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих пласких полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення Codex OAuth (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Попередження allowlist Plugin/інструментів, коли `plugins.allow` обмежувальний, але політика інструментів усе ще запитує wildcard або інструменти, що належать Plugin.
    - Міграція застарілого стану на диску (сеанси/каталог агента/автентифікація WhatsApp).
    - Міграція застарілих ключів контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища cron (`jobId`, `schedule.cron`, поля доставки/навантаження верхнього рівня, payload `provider`, прості резервні webhook-завдання `notify: true`).
    - Міграція застарілої runtime-політики агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли plugins увімкнено; коли `plugins.enabled=false`, застарілі посилання на Plugin вважаються інертною конфігурацією стримування й зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файлів блокування сеансів і очищення застарілих блокувань.
    - Ремонт транскриптів сеансів для дубльованих гілок переписування підказок, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для відновлення після перезапуску завислих subagent, з підтримкою `--fix` для очищення застарілих aborted recovery flags, щоб запуск не продовжував вважати дочірній процес перерваним під час перезапуску.
    - Перевірки цілісності стану та дозволів (сеанси, транскрипти, каталог стану).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Стан автентифікації моделі: перевіряє завершення OAuth, може оновлювати токени, термін яких спливає, і повідомляє про стани cooldown/disabled для auth-profile.
    - Виявлення додаткового каталогу робочого простору (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, служби та супервізори">
    - Ремонт образу пісочниці, коли sandboxing увімкнено.
    - Міграція застарілих служб і виявлення додаткових gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Runtime-перевірки Gateway (службу встановлено, але не запущено; кешована мітка launchd).
    - Попередження про стан каналу (пробуються із запущеного gateway).
    - Аудит конфігурації супервізора (launchd/systemd/schtasks) з необов’язковим ремонтом.
    - Очищення середовища вбудованого proxy для служб gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи version-manager).
    - Діагностика конфлікту портів Gateway (типовий `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та сполучення">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли джерела токена немає; не перезаписує конфігурації token SecretRef).
    - Виявлення проблем зі сполученням пристрою (очікувані первинні запити на сполучення, очікувані підвищення ролі/обсягу, drift застарілого локального кешу device-token і drift автентифікації paired-record).

  </Accordion>
  <Accordion title="Робочий простір і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу робочого простору (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка готовності Skills для типового агента; повідомляє про дозволені skills із відсутніми bins, env, config або вимогами ОС, а `--fix` може вимкнути недоступні skills у `skills.entries`.
    - Перевірка стану shell completion та автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера embedding для пошуку пам’яті (локальна модель, remote API key або QMD binary).
    - Перевірки source install (невідповідність pnpm workspace, відсутні UI assets, відсутній tsx binary).
    - Записує оновлену конфігурацію + метадані wizard.

  </Accordion>
</AccordionGroup>

## Зворотне заповнення та скидання Dreams UI

Сцена Control UI Dreams містить дії **Backfill**, **Reset** і **Clear Grounded** для grounded dreaming workflow. Ці дії використовують RPC-методи у стилі gateway doctor, але вони **не** є частиною ремонту/міграції `openclaw doctor` CLI.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному робочому просторі, запускає прохід grounded REM diary і записує оборотні записи backfill у `DREAMS.md`.
- **Reset** видаляє лише ці позначені backfill diary entries із `DREAMS.md`.
- **Clear Grounded** видаляє лише staged grounded-only short-term entries, які походять з історичного replay і ще не накопичили live recall або daily support.

Що вони **не** роблять самі по собі:

- вони не редагують `MEMORY.md`
- вони не запускають повні doctor migrations
- вони не додають grounded candidates автоматично до live short-term promotion store, якщо ви спершу явно не запустите staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайну deep promotion lane, натомість використовуйте CLI flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це додає grounded durable candidates до short-term dreaming store, зберігаючи `DREAMS.md` як поверхню для перегляду.

## Докладна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git installs)">
    Якщо це git checkout і doctor працює інтерактивно, він пропонує оновити (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх у поточну схему.

    Це включає застарілі пласкі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у мапу провайдера.

    Doctor також попереджає, коли `plugins.allow` непорожній і політика інструментів використовує
    wildcard або записи інструментів, що належать Plugin. `tools.allow: ["*"]` відповідає лише інструментам
    із plugins, які фактично завантажуються; це не обходить ексклюзивний
    allowlist Plugin. Doctor записує `plugins.bundledDiscovery: "compat"` для мігрованих
    застарілих конфігурацій allowlist, щоб зберегти наявну поведінку bundled provider, а
    потім вказує на суворіший параметр `"allowlist"`.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися й просять вас виконати `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перезапише `~/.openclaw/openclaw.json` оновленою схемою.

    Gateway також автоматично запускає doctor migrations під час запуску, коли виявляє застарілий формат конфігурації, тож застарілі конфігурації ремонтуються без ручного втручання. Міграції сховища Cron job обробляються командою `openclaw doctor --fix`.

    Поточні міграції:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - конфігурації налаштованих каналів без видимої політики відповідей → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Для каналів з іменованими `accounts`, але з залишковими верхньорівневими значеннями каналу для одного облікового запису, перемістіть ці значення з областю дії облікового запису в просунутий обліковий запис, вибраний для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видалити `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для тайм-аутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видалити `browser.relayBindHost` (застаріле налаштування ретранслятора розширення)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (запуск Gateway також пропускає провайдерів, у яких `api` встановлено на майбутнє або невідоме значення enum, замість аварійно завершуватися у закритому режимі)

    Попередження doctor також містять поради щодо типового облікового запису для багатооблікових каналів:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` встановлено на невідомий ID облікового запису, doctor попереджає та перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі на неправильний API або обнулити витрати. Doctor попереджає, щоб ви могли видалити перевизначення та відновити маршрутизацію API + витрати для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера та готовність Chrome MCP">
    Якщо ваша конфігурація браузера досі вказує на видалений шлях розширення Chrome, doctor нормалізує її до поточної моделі підключення Chrome MCP на локальному хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє шлях Chrome MCP на локальному хості, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для типових профілів автопідключення
    - перевіряє виявлену версію Chrome і попереджає, коли вона нижча за Chrome 144
    - нагадує увімкнути віддалене налагодження на сторінці інспекції браузера (наприклад, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може увімкнути налаштування на боці Chrome за вас. Chrome MCP на локальному хості все ще потребує:

    - браузера на базі Chromium 144+ на хості Gateway/Node
    - локально запущеного браузера
    - увімкненого віддаленого налагодження в цьому браузері
    - схвалення першого запиту згоди на підключення в браузері

    Готовність тут стосується лише передумов локального підключення. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, все ще потребують керованого браузера або сирого профілю CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують сирий CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor опитує endpoint авторизації OpenAI, щоб перевірити, чи локальний стек Node/OpenSSL TLS може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor виводить поради з виправлення для конкретної платформи. На macOS з Homebrew Node виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка виконується навіть якщо Gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо раніше ви додали застарілі транспортні налаштування в `models.providers.openai-codex`, вони можуть затінити вбудований шлях провайдера Codex OAuth, який новіші релізи використовують автоматично. Doctor попереджає, коли бачить ці старі транспортні налаштування поруч із Codex OAuth, щоб ви могли видалити або переписати застаріле транспортне перевизначення та повернути вбудовану поведінку маршрутизації/резервування. Користувацькі проксі та перевизначення лише заголовків усе ще підтримуються й не спричиняють це попередження.
  </Accordion>
  <Accordion title="2f. Попередження маршрутів Plugin Codex">
    Коли ввімкнено вбудований Plugin Codex, doctor також перевіряє, чи refs основної моделі `openai-codex/*` досі розв’язуються через типовий runner PI. Ця комбінація коректна, коли ви хочете використовувати Codex OAuth/автентифікацію підписки через PI, але її легко сплутати з нативним середовищем app-server Codex. Doctor попереджає та вказує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, бо обидва маршрути коректні:

    - `openai-codex/*` + PI означає «використовувати Codex OAuth/автентифікацію підписки через звичайний runner OpenClaw».
    - `openai/*` + `agentRuntime.id: "codex"` означає «запустити вбудований turn через нативний app-server Codex».
    - `/codex ...` означає «керувати нативною розмовою Codex або прив’язати її з чату».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

    Якщо з’являється попередження, виберіть задуманий маршрут і відредагуйте конфігурацію вручну. Залиште попередження як є, коли PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (дискова структура)">
    Doctor може мігрувати старіші дискові структури в поточну структуру:

    - Сховище сеансів + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілих `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID облікового запису: `default`)

    Ці міграції виконуються за принципом best-effort та є ідемпотентними; doctor виводитиме попередження, коли залишає будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застаріле сховище сеансів + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапляли в шлях для конкретного агента без ручного запуску doctor. Автентифікація WhatsApp навмисно мігрується лише через `openclaw doctor`. Нормалізація провайдера talk/карти провайдерів тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не спричиняють повторних no-op змін `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів Plugin">
    Doctor сканує всі маніфести встановлених Plugin на застарілі верхньорівневі ключі можливостей (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли знаходить їх, він пропонує перемістити їх в об’єкт `contracts` і переписати файл маніфесту на місці. Ця міграція є ідемпотентною; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища Cron">
    Doctor також перевіряє сховище завдань Cron (`~/.openclaw/cron/jobs.json` типово або `cron.store`, коли перевизначено) на старі форми завдань, які scheduler досі приймає для сумісності.

    Поточні очищення Cron містять:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - верхньорівневі поля payload (`message`, `model`, `thinking`, ...) → `payload`
    - верхньорівневі поля доставки (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми доставки payload `provider` → явний `delivery.channel`
    - прості застарілі резервні Webhook-завдання `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий резервний notify із наявним режимом доставки не через Webhook, doctor попереджає та залишає це завдання для ручного перегляду.

    На Linux doctor також попереджає, коли crontab користувача досі викликає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`. Цей скрипт на локальному хості не підтримується поточним OpenClaw і може записувати хибні повідомлення `Gateway inactive` до `~/.openclaw/logs/whatsapp-health.log`, коли Cron не може досягти користувацької шини systemd. Видаліть застарілий запис crontab за допомогою `crontab -e`; використовуйте `openclaw channels status --probe`, `openclaw doctor` і `openclaw gateway status` для поточних перевірок справності.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сеансів">
    Doctor сканує кожен каталог сеансу агента на застарілі файли блокування запису — файли, що залишилися після аварійного завершення сеансу. Для кожного знайденого файлу блокування він повідомляє: шлях, PID, чи PID досі активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше за 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше виводить примітку й радить перезапустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Виправлення гілки транскрипту сеансу">
    Doctor сканує JSONL-файли сеансів агента на дубльовану форму гілки, створену помилкою переписування транскрипту промпта 2026.4.24: покинутий хід користувача з внутрішнім runtime-контекстом OpenClaw та активний сусідній хід із тим самим видимим промптом користувача. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файлу поруч з оригіналом і переписує транскрипт до активної гілки, щоб історія gateway і читачі пам’яті більше не бачили дубльованих ходів.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сеансів, маршрутизація та безпека)">
    Каталог стану — це операційний мозковий стовбур. Якщо він зникне, ви втратите сеанси, облікові дані, журнали та конфігурацію (якщо не маєте резервних копій в іншому місці).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Каталог стану macOS із хмарною синхронізацією**: попереджає, коли стан розташовано під iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, оскільки шляхи із синхронізацією можуть спричиняти повільніший I/O та перегони блокувань/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розташовано на джерелі монтування `mmcblk*`, оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сеансів та облікових даних.
    - **Каталоги сеансів відсутні**: `sessions/` і каталог сховища сеансів потрібні для збереження історії та уникнення аварій `ENOENT`.
    - **Невідповідність транскрипту**: попереджає, коли в нещодавніх записах сеансів бракує файлів транскриптів.
    - **Головний сеанс "1-line JSONL"**: позначає випадок, коли головний транскрипт має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли в домашніх каталогах існує кілька папок `~/.openclaw` або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділитися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запустити його на віддаленому хості (стан зберігається там).
    - **Дозволи конфігураційного файлу**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/всім, і пропонує посилити дозволи до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделей (закінчення OAuth)">
    Doctor перевіряє OAuth-профілі у сховищі автентифікації, попереджає, коли токени скоро закінчаться або вже закінчилися, і може безпечно їх оновити. Якщо профіль Anthropic OAuth/токена застарів, він пропонує ключ API Anthropic або шлях setup-token Anthropic. Запити на оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад, `refresh_token_reused`, `invalid_grant` або провайдер просить увійти знову), doctor повідомляє, що потрібна повторна автентифікація, і виводить точну команду `openclaw models auth login --provider ...`, яку слід запустити.

    Doctor також повідомляє про профілі автентифікації, які тимчасово непридатні через:

    - короткі cooldown-и (обмеження швидкості/тайм-аути/збої автентифікації)
    - довші вимкнення (збої білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Валідація моделі hooks">
    Якщо `hooks.gmail.model` задано, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли його неможливо розв’язати або воно заборонене.
  </Accordion>
  <Accordion title="7. Виправлення образу sandbox">
    Коли sandboxing увімкнено, doctor перевіряє Docker-образи та пропонує зібрати або перейти на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Очищення встановлення Plugin">
    Doctor видаляє застарілий staging-стан залежностей Plugin, згенерований OpenClaw, у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Це охоплює застарілі згенеровані корені залежностей, старі каталоги install-stage, локальні для package залишки від попереднього коду виправлення залежностей bundled-plugin, а також осиротілі або відновлені керовані npm-копії bundled `@openclaw/*` plugins, які можуть затіняти поточний bundled manifest.

    Doctor також може повторно встановити налаштовані завантажувані plugins, коли конфігурація посилається на них, але локальний реєстр Plugin не може їх знайти. Для externalization bundled-plugin 2026.5.2 doctor автоматично встановлює завантажувані plugins, які вже використовує наявна конфігурація, а потім покладається на `meta.lastTouchedVersion`, щоб виконати цей релізний прохід лише один раз. Запуск Gateway і перезавантаження конфігурації не запускають менеджери пакетів; встановлення Plugin лишається явною роботою doctor/install/update.

  </Accordion>
  <Accordion title="8. Міграції служби Gateway і підказки з очищення">
    Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити службу OpenClaw з поточним портом gateway. Він також може сканувати додаткові gateway-подібні служби й виводити підказки з очищення. Служби OpenClaw gateway з іменами профілів вважаються повноцінними й не позначаються як "extra."

    У Linux, якщо user-level служба gateway відсутня, але існує system-level служба OpenClaw gateway, doctor не встановлює автоматично другу user-level службу. Перевірте через `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли системний supervisor керує життєвим циклом gateway.

  </Accordion>
  <Accordion title="8b. Міграція Startup Matrix">
    Коли обліковий запис каналу Matrix має очікувану або придатну до дії міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім виконує best-effort кроки міграції: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки журналюються, а запуск продовжується. У режимі лише для читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Спарювання пристроїв і дрейф автентифікації">
    Doctor тепер перевіряє стан спарювання пристроїв як частину звичайного проходу перевірки здоров’я.

    Що він повідомляє:

    - очікувані запити на перше спарювання
    - очікувані підвищення ролі для вже спарених пристроїв
    - очікувані підвищення scope для вже спарених пристроїв
    - виправлення невідповідності public-key, коли id пристрою досі збігається, але ідентичність пристрою більше не збігається із затвердженим записом
    - спарені записи, яким бракує активного токена для затвердженої ролі
    - спарені токени, чиї scopes відхилилися від затвердженої базової лінії спарювання
    - локальні кешовані записи device-token для поточної машини, які передують ротації токена на стороні gateway або містять застарілі метадані scope

    Doctor не затверджує автоматично запити спарювання й не ротуються автоматично токени пристроїв. Натомість він виводить точні наступні кроки:

    - перегляньте очікувані запити за допомогою `openclaw devices list`
    - затвердьте точний запит за допомогою `openclaw devices approve <requestId>`
    - згенеруйте свіжий токен ротацією за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видаліть і повторно затвердьте застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину "already paired but still getting pairing required": doctor тепер відрізняє перше спарювання від очікуваних підвищень ролі/scope та від дрейфу застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли провайдер відкритий для DM без allowlist або коли політику налаштовано небезпечним способом.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запущено як systemd user service, doctor гарантує, що lingering увімкнено, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан робочого простору (skills, plugins і застарілі каталоги)">
    Doctor виводить зведення стану робочого простору для агента за замовчуванням:

    - **Стан Skills**: рахує eligible, missing-requirements і allowlist-blocked skills.
    - **Застарілі каталоги робочого простору**: попереджає, коли `~/openclaw` або інші застарілі каталоги робочого простору існують поруч із поточним робочим простором.
    - **Стан Plugin**: рахує ввімкнені/вимкнені/помилкові plugins; перелічує Plugin IDs для будь-яких помилок; повідомляє можливості bundle plugin.
    - **Попередження сумісності Plugin**: позначає plugins, що мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки часу завантаження, які видав реєстр Plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Doctor перевіряє, чи bootstrap-файли робочого простору (наприклад `AGENTS.md`, `CLAUDE.md` або інші інжектовані файли контексту) близькі до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файлу raw і injected кількість символів, відсоток truncation, причину truncation (`max/file` або `max/total`) і загальну кількість injected символів як частку загального бюджету. Коли файли truncate-яться або близькі до ліміту, doctor виводить поради з налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілого Plugin каналу">
    Коли `openclaw doctor --fix` видаляє відсутній Plugin каналу, він також видаляє dangling channel-scoped конфігурацію, що посилалася на цей Plugin: записи `channels.<id>`, цілі Heartbeat, які називали канал, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає boot loop-ам Gateway, коли runtime каналу зник, але конфігурація все ще просить gateway прив’язатися до нього.
  </Accordion>
  <Accordion title="11c. Автодоповнення shell">
    Doctor перевіряє, чи встановлено tab completion для поточного shell (zsh, bash, fish або PowerShell):

    - Якщо профіль shell використовує повільний динамічний шаблон completion (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо completion налаштовано в профілі, але файл кешу відсутній, doctor автоматично регенерує кеш.
    - Якщо completion взагалі не налаштовано, doctor пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність автентифікації локального gateway токеном.

    - Якщо режим токена потребує токена й джерела токена не існує, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає й не перезаписує його plaintext.
    - `openclaw doctor --generate-gateway-token` примусово генерує лише тоді, коли SecretRef токена не налаштовано.

  </Accordion>
  <Accordion title="12b. Виправлення з урахуванням SecretRef у режимі лише для читання">
    Деяким потокам виправлення потрібно перевіряти налаштовані облікові дані, не послаблюючи runtime поведінку fail-fast.

    - `openclaw doctor --fix` тепер використовує ту саму read-only модель зведення SecretRef, що й команди status-family, для цільових виправлень конфігурації.
    - Приклад: виправлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані бота, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає автоматичне розв’язання замість аварійного завершення або хибного повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Перевірка стану Gateway + перезапуск">
    Doctor виконує перевірку стану та пропонує перезапустити gateway, коли він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку в пам’яті">
    Doctor перевіряє, чи налаштований постачальник embedding для пошуку в пам’яті готовий для агента за замовчуванням. Поведінка залежить від налаштованого бекенда та постачальника:

    - **Бекенд QMD**: перевіряє, чи доступний і чи може запускатися бінарний файл `qmd`. Якщо ні, виводить інструкції з виправлення, зокрема npm-пакет і варіант ручного шляху до бінарного файла.
    - **Явний локальний постачальник**: перевіряє наявність локального файла моделі або розпізнаної віддаленої/завантажуваної URL-адреси моделі. Якщо немає, пропонує перемкнутися на віддаленого постачальника.
    - **Явний віддалений постачальник** (`openai`, `voyage` тощо): перевіряє, чи є API-ключ у середовищі або сховищі автентифікації. Якщо його немає, виводить дієві підказки для виправлення.
    - **Автоматичний постачальник**: спочатку перевіряє доступність локальної моделі, а потім пробує кожного віддаленого постачальника в порядку автоматичного вибору.

    Коли доступний кешований результат проби gateway (gateway був справний на момент перевірки), doctor зіставляє його результат із конфігурацією, видимою для CLI, і зазначає будь-яку невідповідність. Doctor не запускає новий embedding ping у стандартному шляху; використовуйте команду глибокого стану пам’яті, коли потрібна жива перевірка постачальника.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding під час виконання.

  </Accordion>
  <Accordion title="14. Попередження про стан каналів">
    Якщо gateway справний, doctor запускає пробу стану каналів і повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит і відновлення конфігурації супервізора">
    Doctor перевіряє встановлену конфігурацію супервізора (launchd/systemd/schtasks) на відсутні або застарілі значення за замовчуванням (наприклад, залежності systemd від network-online і затримку перезапуску). Коли виявляє невідповідність, рекомендує оновлення та може переписати файл служби/завдання до поточних значень за замовчуванням.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації супервізора.
    - `openclaw doctor --yes` приймає стандартні запити на відновлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації супервізора.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише читання для життєвого циклу служби gateway. Він і надалі повідомляє про стан служби та виконує відновлення, не пов’язані зі службою, але пропускає встановлення/запуск/перезапуск/bootstrap служби, переписування конфігурації супервізора та очищення застарілих служб, оскільки цим життєвим циклом керує зовнішній супервізор.
    - У Linux doctor не переписує метадані команди/точки входу, поки відповідний systemd-модуль gateway активний. Він також ігнорує неактивні додаткові gateway-подібні модулі, які не є застарілими, під час сканування дубльованих служб, щоб супутні файли служб не створювали шуму очищення.
    - Якщо автентифікація за токеном потребує токена, а `gateway.auth.token` керується SecretRef, встановлення/відновлення служби doctor перевіряє SecretRef, але не зберігає розв’язані значення токенів у відкритому тексті в метаданих середовища служби супервізора.
    - Doctor виявляє керовані `.env`/SecretRef-backed значення середовища служби, які старіші інсталяції LaunchAgent, systemd або Windows Scheduled Task вбудовували inline, і переписує метадані служби так, щоб ці значення завантажувалися з джерела runtime, а не з визначення супервізора.
    - Doctor виявляє, коли команда служби досі фіксує старий `--port` після зміни `gateway.port`, і переписує метадані служби на поточний порт.
    - Якщо автентифікація за токеном потребує токена, а налаштований SecretRef токена не розв’язується, doctor блокує шлях встановлення/відновлення з дієвими інструкціями.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/відновлення, доки режим не буде задано явно.
    - Для Linux user-systemd модулів перевірки doctor на розбіжність токенів тепер включають джерела `Environment=` і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Відновлення служби doctor відмовляються переписувати, зупиняти або перезапускати службу gateway зі старішого бінарного файла OpenClaw, коли конфігурацію востаннє записала новіша версія. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime Gateway + діагностика порту">
    Doctor перевіряє runtime служби (PID, останній статус виходу) і попереджає, коли службу встановлено, але вона фактично не працює. Він також перевіряє конфлікти портів на порту gateway (за замовчуванням `18789`) і повідомляє ймовірні причини (gateway уже працює, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли служба gateway працює на Bun або шляху Node, керованому версіями (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджерів версій можуть ламатися після оновлень, оскільки служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує мігрувати на системну інсталяцію Node, коли вона доступна (Homebrew/apt/choco).

    Нововстановлені або відновлені macOS LaunchAgents використовують канонічний системний PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) замість копіювання PATH інтерактивної оболонки, тому каталоги Volta, asdf, fnm, pnpm та інших менеджерів версій не змінюють, який Node розв’язують дочірні процеси. Служби Linux усе ще зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні user-bin каталоги, але вгадані fallback-каталоги менеджерів версій записуються до PATH служби лише тоді, коли ці каталоги існують на диску.

  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає будь-які зміни конфігурації та ставить штамп метаданих майстра, щоб записати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервна копія + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, якщо її немає, і виводить пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace) для повного посібника зі структури робочого простору та резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
