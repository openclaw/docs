---
read_when:
    - Додавання або зміна міграцій doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда діагностики: перевірки справності, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-01T04:39:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52183eaf6024eface20089f9d11143ef1e952d2488eee766dc154512f5d3c6b4
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент відновлення й міграції для OpenClaw. Він виправляє застарілі конфігурації/стан, перевіряє справність і надає дієві кроки відновлення.

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

    Прийняти типові значення без запитів (включно з кроками перезапуску/служби/відновлення пісочниці, коли застосовно).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Застосувати рекомендовані відновлення без запитів (відновлення + перезапуски, де це безпечно).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Також застосувати агресивні відновлення (перезаписує користувацькі конфігурації супервізора).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запустити без запитів і застосувати лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії перезапуску/служби/пісочниці, які потребують підтвердження людини. Застарілі міграції стану виконуються автоматично, коли їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Просканувати системні служби на наявність додаткових встановлень Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спершу відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (коротко)

<AccordionGroup>
  <Accordion title="Справність, UI та оновлення">
    - Необов’язкове попереднє оновлення для git-встановлень (лише інтерактивно).
    - Перевірка актуальності протоколу UI (перебудовує Control UI, коли схема протоколу новіша).
    - Перевірка справності + запит на перезапуск.
    - Зведення стану Skills (придатні/відсутні/заблоковані) і стан Plugin.

  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих плоских полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення Codex OAuth (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Попередження allowlist Plugin/інструментів, коли `plugins.allow` є обмежувальним, але політика інструментів усе ще запитує wildcard або інструменти, що належать Plugin.
    - Міграція застарілого стану на диску (sessions/agent dir/автентифікація WhatsApp).
    - Міграція застарілих ключів контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища cron (`jobId`, `schedule.cron`, поля доставки/payload верхнього рівня, payload `provider`, прості резервні webhook-завдання `notify: true`).
    - Міграція застарілої runtime-політики агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли plugins увімкнено; коли `plugins.enabled=false`, застарілі посилання на Plugin вважаються інертною containment-конфігурацією та зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файлів блокування сесій і очищення застарілих блокувань.
    - Відновлення transcript сесій для дубльованих гілок переписування prompt, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для відновлення після перезапуску завислого subagent, з підтримкою `--fix` для очищення застарілих прапорців перерваного відновлення, щоб запуск не продовжував трактувати дочірній процес як перерваний під час перезапуску.
    - Перевірки цілісності стану та дозволів (sessions, transcripts, state dir).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Справність автентифікації моделі: перевіряє завершення OAuth, може оновлювати токени, термін дії яких спливає, і повідомляє про стани cooldown/disabled auth-profile.
    - Виявлення додаткової директорії робочого простору (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, служби та супервізори">
    - Відновлення образу пісочниці, коли sandboxing увімкнено.
    - Міграція застарілих служб і виявлення додаткових Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime Gateway (служба встановлена, але не запущена; кешована мітка launchd).
    - Попередження про стан каналів (перевірено з запущеного Gateway).
    - Аудит конфігурації супервізора (launchd/systemd/schtasks) з необов’язковим відновленням.
    - Очищення середовища вбудованого proxy для служб Gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node vs Bun, шляхи version-manager).
    - Діагностика конфліктів портів Gateway (типовий `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та pairing">
    - Попередження безпеки для відкритих DM-політик.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли немає джерела токена; не перезаписує конфігурації токена SecretRef).
    - Виявлення проблем pairing пристрою (очікувані перші запити pairing, очікувані підвищення ролі/обсягу, drift застарілого кешу локального device-token і drift автентифікації paired-record).

  </Accordion>
  <Accordion title="Робочий простір і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу робочого простору (попередження про обрізання/наближення до ліміту для context-файлів).
    - Перевірка стану shell completion і автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера embedding для пошуку пам’яті (локальна модель, віддалений API key або binary QMD).
    - Перевірки source install (невідповідність pnpm workspace, відсутні UI assets, відсутній binary tsx).
    - Записує оновлену конфігурацію + метадані wizard.

  </Accordion>
</AccordionGroup>

## Backfill і reset для Dreams UI

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для grounded dreaming workflow. Ці дії використовують RPC-методи в стилі gateway doctor, але вони **не** є частиною CLI-відновлення/міграції `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному робочому просторі, запускає grounded REM diary pass і записує оборотні backfill-записи в `DREAMS.md`.
- **Reset** видаляє лише ці позначені backfill diary entries з `DREAMS.md`.
- **Clear Grounded** видаляє лише підготовлені grounded-only short-term entries, що походять з historical replay і ще не накопичили live recall або daily support.

Чого вони **не** роблять самі по собі:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не додають автоматично grounded candidates до live short-term promotion store, якщо ви явно спершу не запустите staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайну deep promotion lane, натомість використайте CLI-потік:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це додає grounded durable candidates до short-term dreaming store, залишаючи `DREAMS.md` поверхнею для перегляду.

## Докладна поведінка й обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-встановлення)">
    Якщо це git checkout і doctor працює інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх до поточної схеми.

    Це включає застарілі плоскі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у map провайдера.

    Doctor також попереджає, коли `plugins.allow` не порожній, а політика інструментів використовує
    wildcard або записи інструментів, що належать Plugin. `tools.allow: ["*"]` відповідає лише інструментам
    із plugins, які фактично завантажуються; він не обходить ексклюзивний allowlist Plugin.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися й просять вас виконати `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перезапише `~/.openclaw/openclaw.json` з оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час старту, коли виявляє застарілий формат конфігурації, тому застарілі конфігурації відновлюються без ручного втручання. Міграції сховища cron jobs обробляються командою `openclaw doctor --fix`.

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
    - Для каналів з іменованими `accounts`, але із залишковими верхньорівневими значеннями каналу для одного облікового запису, перемістіть ці значення, прив’язані до облікового запису, у підвищений обліковий запис, вибраний для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видаліть `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для повільних тайм-аутів провайдера/моделі
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видаліть `browser.relayBindHost` (застаріле налаштування ретрансляції розширення)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (запуск gateway також пропускає провайдерів, чиє `api` встановлено в майбутнє або невідоме значення enum, замість аварійного завершення за закритою політикою)

    Попередження doctor також містять настанови щодо типового облікового запису для багатооблікових каналів:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` задано як невідомий ID облікового запису, doctor попереджає і перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі на неправильний API або занулити витрати. Doctor попереджає, щоб ви могли видалити перевизначення і відновити маршрутизацію API та витрати для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера і готовність Chrome MCP">
    Якщо конфігурація браузера досі вказує на видалений шлях розширення Chrome, doctor нормалізує її до поточної моделі підключення Chrome MCP на локальному хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє шлях Chrome MCP на локальному хості, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи Google Chrome встановлено на тому самому хості для типових профілів автоматичного підключення
    - перевіряє виявлену версію Chrome і попереджає, коли вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці інспектування браузера (наприклад, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути налаштування на боці Chrome за вас. Chrome MCP на локальному хості все ще потребує:

    - браузера на основі Chromium 144+ на хості gateway/node
    - локально запущеного браузера
    - увімкненого віддаленого налагодження в цьому браузері
    - схвалення першого запиту згоди на підключення в браузері

    Готовність тут стосується лише передумов локального підключення. Existing-session зберігає поточні обмеження маршруту Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, усе ще потребують керованого браузера або сирого профілю CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-процесів. Вони й надалі використовують сирий CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor перевіряє кінцеву точку авторизації OpenAI, щоб переконатися, що локальний стек Node/OpenSSL TLS може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, протермінований сертифікат або самопідписаний сертифікат), doctor виводить настанови з виправлення для конкретної платформи. На macOS із Homebrew Node виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка запускається навіть тоді, коли gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо раніше ви додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть затінити вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі налаштування транспорту разом із Codex OAuth, щоб ви могли видалити або переписати застаріле перевизначення транспорту і повернути вбудовану маршрутизацію/резервну поведінку. Користувацькі проксі та перевизначення лише заголовків усе ще підтримуються й не викликають це попередження.
  </Accordion>
  <Accordion title="2f. Попередження маршрутів Plugin Codex">
    Коли увімкнено вбудований Codex Plugin, doctor також перевіряє, чи посилання первинної моделі `openai-codex/*` усе ще розв’язуються через типовий runner PI. Ця комбінація чинна, коли ви хочете автентифікацію Codex OAuth/підписки через PI, але її легко сплутати з нативним harness сервера застосунку Codex. Doctor попереджає і вказує на явну форму сервера застосунку: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, бо обидва маршрути чинні:

    - `openai-codex/*` + PI означає «використовувати автентифікацію Codex OAuth/підписки через звичайний runner OpenClaw».
    - `openai/*` + `runtime: "codex"` означає «запустити вбудований turn через нативний сервер застосунку Codex».
    - `/codex ...` означає «керувати або прив’язати нативну розмову Codex із чату».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

    Якщо з’являється попередження, виберіть задуманий маршрут і відредагуйте конфігурацію вручну. Залиште попередження без змін, коли PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (структура диска)">
    Doctor може мігрувати старіші структури на диску в поточну структуру:

    - Сховище сеансів + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілих `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий id облікового запису: `default`)

    Ці міграції виконуються за принципом найкращої спроби та є ідемпотентними; doctor виведе попередження, коли залишить будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі сеанси + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапляли в шлях для конкретного агента без ручного запуску doctor. Нормалізація провайдера talk/карти провайдерів тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не спричиняють повторні no-op зміни `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів Plugin">
    Doctor сканує всі встановлені маніфести Plugin на застарілі верхньорівневі ключі можливостей (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли їх знайдено, він пропонує перемістити їх в об’єкт `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища Cron">
    Doctor також перевіряє сховище завдань cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, коли перевизначено) на старі форми завдань, які планувальник усе ще приймає для сумісності.

    Поточні очищення cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - верхньорівневі поля payload (`message`, `model`, `thinking`, ...) → `payload`
    - верхньорівневі поля delivery (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми доставки `provider` у payload → явний `delivery.channel`
    - прості застарілі резервні завдання Webhook `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли це можна зробити без зміни поведінки. Якщо завдання поєднує застарілий резерв notify з наявним режимом доставки не через Webhook, doctor попереджає і залишає це завдання для ручного перегляду.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сеансів">
    Doctor сканує кожен каталог сеансів агента на застарілі файли блокування запису — файли, що залишилися після аварійного завершення сеансу. Для кожного знайденого файлу блокування він повідомляє: шлях, PID, чи PID досі активний, вік блокування і чи вважається воно застарілим (мертвий PID або старіше за 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше виводить примітку й інструктує повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Виправлення гілки транскрипта сеансу">
    Doctor сканує JSONL-файли сеансів агента на дубльовану форму гілки, створену помилкою переписування транскрипта prompt від 2026.4.24: покинутий user turn із внутрішнім runtime-контекстом OpenClaw плюс активний sibling, що містить той самий видимий user prompt. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файлу поруч з оригіналом і переписує транскрипт до активної гілки, щоб історія gateway і reader-и memory більше не бачили дубльовані turn-и.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сеансів, маршрутизація і безпека)">
    Каталог стану — це операційний мозковий стовбур. Якщо він зникне, ви втратите сеанси, облікові дані, журнали й конфігурацію (якщо не маєте резервних копій деінде).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що відновити відсутні дані неможливо.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Синхронізований із хмарою каталог стану macOS**: попереджає, коли стан визначається в iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, бо шляхи з підтримкою синхронізації можуть спричиняти повільніше I/O та перегони блокувань/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан визначається на джерелі монтування `mmcblk*`, бо випадкове I/O на SD або eMMC може бути повільнішим і швидше зношуватися під час записів сеансів і облікових даних.
    - **Каталоги сеансів відсутні**: `sessions/` і каталог сховища сеансів потрібні для збереження історії та уникнення збоїв `ENOENT`.
    - **Невідповідність стенограми**: попереджає, коли в нещодавніх записах сеансів відсутні файли стенограм.
    - **Головний сеанс "1-line JSONL"**: позначає випадок, коли головна стенограма має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли кілька папок `~/.openclaw` існують у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділятися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запустити його на віддаленому хості (стан зберігається там).
    - **Дозволи файлу конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує обмежити до `600`.

  </Accordion>
  <Accordion title="5. Model auth health (OAuth expiry)">
    Doctor перевіряє профілі OAuth у сховищі автентифікації, попереджає, коли токени скоро завершаться або вже завершилися, і може оновити їх, коли це безпечно. Якщо профіль Anthropic OAuth/токена застарів, він пропонує ключ Anthropic API або шлях setup-token Anthropic. Запити на оновлення з'являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад, `refresh_token_reused`, `invalid_grant` або провайдер повідомляє, що потрібно знову ввійти), doctor повідомляє, що потрібна повторна автентифікація, і друкує точну команду `openclaw models auth login --provider ...`, яку потрібно виконати.

    Doctor також повідомляє про профілі автентифікації, які тимчасово непридатні через:

    - короткі періоди очікування (ліміти швидкості/тайм-аути/збої автентифікації)
    - триваліші вимкнення (збої оплати/кредитів)

  </Accordion>
  <Accordion title="6. Hooks model validation">
    Якщо задано `hooks.gmail.model`, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли воно не розв'яжеться або заборонене.
  </Accordion>
  <Accordion title="7. Sandbox image repair">
    Коли пісочницю ввімкнено, doctor перевіряє образи Docker і пропонує зібрати або перейти на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Bundled plugin runtime deps">
    Doctor перевіряє runtime-залежності лише для вбудованих plugins, активних у поточній конфігурації або ввімкнених за замовчуванням їхнього вбудованого маніфесту, наприклад `plugins.entries.discord.enabled: true`, застаріле `channels.discord.enabled: true`, налаштовані `models.providers.*` / посилання на моделі agent або вбудований plugin, увімкнений за замовчуванням, без належності провайдеру. Якщо якісь відсутні, doctor повідомляє пакети та встановлює їх у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Зовнішні plugins і далі використовують `openclaw plugins install` / `openclaw plugins update`; doctor не встановлює залежності для довільних шляхів plugins.

    Під час відновлення doctor встановлення npm runtime-залежностей вбудованих plugins показують прогрес spinner у сеансах TTY і періодичний рядковий прогрес у конвеєрному/headless виводі. Gateway і локальний CLI також можуть відновлювати runtime-залежності активних вбудованих plugins на вимогу перед імпортом вбудованого plugin. Ці встановлення обмежені коренем інсталяції runtime plugin, запускаються з вимкненими скриптами, не записують package lock і захищені блокуванням кореня інсталяції, щоб одночасні запуски CLI або Gateway не змінювали те саме дерево `node_modules` одночасно.

  </Accordion>
  <Accordion title="8. Gateway service migrations and cleanup hints">
    Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити службу OpenClaw з використанням поточного порту gateway. Він також може сканувати додаткові gateway-подібні служби й друкувати підказки з очищення. Служби gateway OpenClaw з іменами профілів вважаються повноцінними та не позначаються як "додаткові".

    У Linux, якщо служба gateway рівня користувача відсутня, але існує служба gateway OpenClaw системного рівня, doctor не встановлює другу службу рівня користувача автоматично. Перевірте за допомогою `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли життєвим циклом gateway керує системний supervisor.

  </Accordion>
  <Accordion title="8b. Startup Matrix migration">
    Коли обліковий запис каналу Matrix має очікувану або доступну до дії міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім виконує кроки міграції best-effort: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки записуються в журнал, а запуск продовжується. У режимі лише читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Device pairing and auth drift">
    Doctor тепер перевіряє стан сполучення пристроїв як частину звичайної перевірки справності.

    Що він повідомляє:

    - очікувані запити першого сполучення
    - очікувані підвищення ролей для вже сполучених пристроїв
    - очікувані підвищення scope для вже сполучених пристроїв
    - виправлення невідповідності публічного ключа, коли ідентифікатор пристрою все ще збігається, але ідентичність пристрою більше не відповідає затвердженому запису
    - сполучені записи, у яких відсутній активний токен для затвердженої ролі
    - сполучені токени, чиї scope відхилилися від затвердженої бази сполучення
    - локальні кешовані записи токенів пристрою для поточної машини, які передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не затверджує автоматично запити сполучення й не ротує автоматично токени пристроїв. Натомість він друкує точні наступні кроки:

    - перегляньте очікувані запити за допомогою `openclaw devices list`
    - затвердьте точний запит за допомогою `openclaw devices approve <requestId>`
    - згенеруйте свіжий токен ротацією за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видаліть і повторно затвердьте застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває типову прогалину "already paired but still getting pairing required": doctor тепер відрізняє перше сполучення від очікуваних підвищень ролі/scope і від застарілого токена/відхилення ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Security warnings">
    Doctor виводить попередження, коли провайдер відкритий для DM без allowlist або коли політику налаштовано небезпечно.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запущено як службу користувача systemd, doctor забезпечує ввімкнення lingering, щоб gateway залишався активним після виходу.
  </Accordion>
  <Accordion title="11. Workspace status (skills, plugins, and legacy dirs)">
    Doctor друкує підсумок стану workspace для agent за замовчуванням:

    - **Стан Skills**: рахує придатні Skills, Skills із відсутніми вимогами та Skills, заблоковані allowlist.
    - **Застарілі каталоги workspace**: попереджає, коли `~/openclaw` або інші застарілі каталоги workspace існують поруч із поточним workspace.
    - **Стан Plugin**: рахує ввімкнені/вимкнені/помилкові plugins; перелічує ідентифікатори plugins для будь-яких помилок; повідомляє можливості bundle plugin.
    - **Попередження сумісності Plugin**: позначає plugins, які мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки часу завантаження, виведені registry plugin.

  </Accordion>
  <Accordion title="11b. Bootstrap file size">
    Doctor перевіряє, чи файли bootstrap workspace (наприклад `AGENTS.md`, `CLAUDE.md` або інші впроваджені файли контексту) близькі до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файлу кількість символів raw проти injected, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість injected символів як частку від загального бюджету. Коли файли обрізані або близькі до ліміту, doctor друкує поради для налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Stale channel plugin cleanup">
    Коли `openclaw doctor --fix` видаляє відсутній channel plugin, він також видаляє висячі channel-scoped налаштування, які посилалися на цей plugin: записи `channels.<id>`, цілі heartbeat, що називали channel, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає циклам запуску Gateway, коли runtime channel зник, але конфігурація все ще просить gateway прив'язатися до нього.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor перевіряє, чи встановлено автодоповнення tab для поточної оболонки (zsh, bash, fish або PowerShell):

    - Якщо профіль оболонки використовує повільний шаблон динамічного доповнення (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанту кешованого файлу.
    - Якщо доповнення налаштовано в профілі, але файл кешу відсутній, doctor автоматично регенерує кеш.
    - Якщо доповнення взагалі не налаштовано, doctor пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Gateway auth checks (local token)">
    Doctor перевіряє готовність локальної автентифікації токена gateway.

    - Якщо режим токена потребує токена, а джерела токена немає, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає й не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано SecretRef токена.

  </Accordion>
  <Accordion title="12b. Read-only SecretRef-aware repairs">
    Деякі потоки відновлення мають перевіряти налаштовані облікові дані, не послаблюючи fail-fast поведінку runtime.

    - `openclaw doctor --fix` тепер використовує ту саму read-only модель підсумку SecretRef, що й команди сімейства status, для цільових виправлень конфігурації.
    - Приклад: виправлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані bot, коли вони доступні.
    - Якщо токен Telegram bot налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані-але-недоступні, і пропускає автоматичне розв'язання замість збою або помилкового повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Gateway health check + restart">
    Doctor виконує перевірку справності й пропонує перезапустити gateway, коли він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Memory search readiness">
    Doctor перевіряє, чи налаштований провайдер embeddings для пошуку в пам'яті готовий для agent за замовчуванням. Поведінка залежить від налаштованого backend і провайдера:

    - **Backend QMD**: перевіряє, чи двійковий файл `qmd` доступний і може бути запущений. Якщо ні, друкує вказівки з виправлення, включно з пакетом npm і варіантом ручного шляху до двійкового файлу.
    - **Явний локальний провайдер**: перевіряє наявність локального файлу моделі або розпізнаної віддаленої/завантажуваної URL моделі. Якщо відсутній, пропонує перейти на віддаленого провайдера.
    - **Явний віддалений провайдер** (`openai`, `voyage` тощо): перевіряє, що ключ API присутній у середовищі або сховищі автентифікації. Друкує дієві підказки з виправлення, якщо він відсутній.
    - **Автоматичний провайдер**: спочатку перевіряє доступність локальної моделі, а потім пробує кожного віддаленого провайдера в порядку автоматичного вибору.

    Коли доступний кешований результат перевірки Gateway (Gateway був справним на момент перевірки), doctor зіставляє його результат із видимою для CLI конфігурацією та зазначає будь-яку невідповідність. Doctor не запускає новий embedding ping у стандартному шляху; використовуйте команду глибокого статусу пам’яті, коли потрібна жива перевірка провайдера.

    Використайте `openclaw memory status --deep`, щоб перевірити готовність embedding під час виконання.

  </Accordion>
  <Accordion title="14. Попередження про статус каналу">
    Якщо Gateway справний, doctor виконує перевірку статусу каналу й повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит і відновлення конфігурації супервізора">
    Doctor перевіряє встановлену конфігурацію супервізора (launchd/systemd/schtasks) на відсутні або застарілі стандартні параметри (наприклад, залежності systemd від network-online і затримку перезапуску). Коли він знаходить невідповідність, він рекомендує оновлення й може переписати файл служби/завдання до поточних стандартних параметрів.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації супервізора.
    - `openclaw doctor --yes` приймає стандартні запити на відновлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації супервізора.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише читання для життєвого циклу служби Gateway. Він усе ще повідомляє про стан служби й виконує відновлення, не пов’язані зі службою, але пропускає встановлення/запуск/перезапуск/bootstrap служби, переписування конфігурації супервізора та очищення застарілих служб, оскільки цим життєвим циклом керує зовнішній супервізор.
    - У Linux doctor не переписує метадані команди/точки входу, доки відповідний systemd-модуль Gateway активний. Він також ігнорує неактивні додаткові не застарілі модулі, схожі на Gateway, під час пошуку дубльованих служб, щоб супутні файли служб не створювали зайвого шуму очищення.
    - Якщо автентифікація токеном вимагає токен і `gateway.auth.token` керується через SecretRef, встановлення/відновлення служби doctor перевіряє SecretRef, але не зберігає розв’язані значення токена у відкритому тексті в метаданих середовища служби супервізора.
    - Doctor виявляє керовані значення середовища служби на основі `.env`/SecretRef, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудовували inline, і переписує метадані служби так, щоб ці значення завантажувалися з runtime-джерела, а не з визначення супервізора.
    - Doctor виявляє, коли команда служби все ще фіксує старий `--port` після зміни `gateway.port`, і переписує метадані служби на поточний порт.
    - Якщо автентифікація токеном вимагає токен, а налаштований SecretRef токена не розв’язується, doctor блокує шлях встановлення/відновлення з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/відновлення, доки режим не буде задано явно.
    - Для Linux user-systemd-модулів перевірки розбіжності токена doctor тепер включають джерела `Environment=` і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Відновлення служби doctor відмовляються переписувати, зупиняти або перезапускати службу Gateway зі старішого бінарного файлу OpenClaw, коли конфігурацію востаннє було записано новішою версією. Див. [усунення проблем Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway і порту">
    Doctor перевіряє runtime служби (PID, останній статус виходу) і попереджає, коли служба встановлена, але фактично не працює. Він також перевіряє конфлікти портів на порту Gateway (стандартно `18789`) і повідомляє ймовірні причини (Gateway уже запущено, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли служба Gateway працює на Bun або шляху Node, керованому менеджером версій (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджера версій можуть ламатися після оновлень, оскільки служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує перейти на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нововстановлені або відновлені служби зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні каталоги user-bin, але припущені резервні каталоги менеджера версій записуються до service PATH лише тоді, коли ці каталоги існують на диску. Це тримає згенерований supervisor PATH узгодженим із тим самим аудитом мінімального PATH, який doctor запускає пізніше.

  </Accordion>
  <Accordion title="18. Запис конфігурації та метадані майстра">
    Doctor зберігає будь-які зміни конфігурації та ставить мітку метаданих майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервна копія + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, коли її бракує, і друкує пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури робочого простору та резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення проблем Gateway](/uk/gateway/troubleshooting)
