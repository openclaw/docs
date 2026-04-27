---
read_when:
    - Додавання або змінення міграцій Doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда Doctor: перевірки стану, міграції конфігурації та кроки відновлення'
title: Doctor
x-i18n:
    generated_at: "2026-04-27T14:18:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f3a009131c28a0574ce2bb055beecbb321e1664d1ab5b611c64c3f548cda1c6
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` — це інструмент відновлення та міграції для OpenClaw. Він виправляє застарілу конфігурацію/стан, перевіряє стан системи та надає практичні кроки для відновлення.

## Швидкий старт

```bash
openclaw doctor
```

### Режими без взаємодії та автоматизації

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Прийняти типові значення без запитів (зокрема кроки відновлення перезапуску/служби/sandbox, коли це застосовно).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Застосувати рекомендовані виправлення без запитів (виправлення + перезапуски, де це безпечно).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Також застосувати агресивні виправлення (перезаписує власні конфігурації supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запустити без запитів і застосувати лише безпечні міграції (нормалізація конфігурації + перенесення стану на диску). Пропускає дії з перезапуском/службами/sandbox, які потребують підтвердження людини. Міграції застарілого стану запускаються автоматично, якщо їх виявлено.

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
  <Accordion title="Стан системи, UI та оновлення">
    - Необов’язкове попереднє оновлення для git-встановлень (лише в інтерактивному режимі).
    - Перевірка актуальності протоколу UI (перебудовує Control UI, якщо схема протоколу новіша).
    - Перевірка стану системи + запит на перезапуск.
    - Зведення стану Skills (доступні/відсутні/заблоковані) та стану Plugin.
  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих плоских полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції browser для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення Codex OAuth (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Міграція застарілого стану на диску (сесії/каталог агента/автентифікація WhatsApp).
    - Міграція ключів контракту маніфеста застарілого Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція сховища застарілого Cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, `provider` у payload, прості fallback-завдання Webhook із `notify: true`).
    - Міграція застарілої runtime-policy агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файлів блокування сесій і очищення застарілих блокувань.
    - Відновлення транскриптів сесій для дубльованих гілок prompt-rewrite, створених у вразливих збірках 2026.4.24.
    - Перевірки цілісності стану та прав доступу (сесії, транскрипти, каталог стану).
    - Перевірки прав доступу до файлу конфігурації (`chmod 600`) під час локального запуску.
    - Стан автентифікації моделей: перевіряє строк дії OAuth, може оновлювати токени, строк дії яких спливає, і повідомляє про стани cooldown/disabled профілю автентифікації.
    - Виявлення додаткового каталогу робочого простору (`~/openclaw`).
  </Accordion>
  <Accordion title="Gateway, служби та supervisor">
    - Відновлення образу sandbox, коли sandboxing увімкнено.
    - Міграція застарілих служб і виявлення додаткових Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime Gateway (службу встановлено, але не запущено; кешована мітка launchd).
    - Попередження про стан каналу (перевіряються з запущеного Gateway).
    - Аудит конфігурації supervisor (launchd/systemd/schtasks) з необов’язковим виправленням.
    - Очищення змінних середовища вбудованого proxy для служб Gateway, які підхопили значення оболонки `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки рекомендованих практик runtime Gateway (Node проти Bun, шляхи менеджера версій).
    - Діагностика конфліктів портів Gateway (типово `18789`).
  </Accordion>
  <Accordion title="Автентифікація, безпека та сполучення">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для локального режиму токена (пропонує згенерувати токен, якщо джерело токена відсутнє; не перезаписує конфігурації token SecretRef).
    - Виявлення проблем зі сполученням пристроїв (очікувані перші запити на сполучення, очікувані оновлення ролі/обсягу доступу, застарілий дрейф локального кешу токенів пристрою та дрейф автентифікації запису сполучення).
  </Accordion>
  <Accordion title="Робочий простір і оболонка">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу робочого простору (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка стану completion оболонки та автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера вбудовувань для пошуку в пам’яті (локальна модель, ключ віддаленого API або двійковий файл QMD).
    - Перевірки source-встановлення (невідповідність робочого простору pnpm, відсутні assets UI, відсутній двійковий файл tsx).
    - Записує оновлену конфігурацію та метадані wizard.
  </Accordion>
</AccordionGroup>

## Зворотне заповнення та скидання Dreams UI

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для робочого процесу grounded Dreaming. Ці дії використовують RPC-методи у стилі doctor для Gateway, але вони **не** є частиною відновлення/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному робочому просторі, запускає grounded REM diary pass і записує зворотні записи backfill у `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише ті записи щоденника backfill, що мають відповідну позначку.
- **Clear Grounded** видаляє лише staged short-term записи, призначені тільки для grounded, які походять з історичного відтворення і ще не накопичили live recall або щоденної підтримки.

Чого вони самі по собі **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не переносять автоматично grounded candidates у live short-term promotion store, якщо ви явно не запустите спочатку staged CLI path

Якщо ви хочете, щоб grounded historical replay впливало на звичайний deep promotion lane, натомість використовуйте потік CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це переносить grounded durable candidates у short-term dreaming store, залишаючи `DREAMS.md` як поверхню для перегляду.

## Детальна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-встановлення)">
    Якщо це git checkout і doctor запущено в інтерактивному режимі, він пропонує оновити систему (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх до поточної схеми.

    Це також охоплює застарілі плоскі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у мапу провайдерів.

  </Accordion>
  <Accordion title="2. Міграції ключів застарілої конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися і просять виконати `openclaw doctor`.

    Doctor виконає таке:

    - Пояснить, які застарілі ключі було знайдено.
    - Покажe міграцію, яку він застосував.
    - Перезапише `~/.openclaw/openclaw.json` з оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час старту, коли виявляє застарілий формат конфігурації, тож застарілі конфігурації виправляються без ручного втручання. Міграції сховища завдань Cron обробляються командою `openclaw doctor --fix`.

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
    - Для каналів з іменованими `accounts`, але із залишковими однокористувацькими верхньорівневими значеннями каналу, перенести ці значення, прив’язані до облікового запису, до просунутого облікового запису, вибраного для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видалити `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для тайм-аутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видалити `browser.relayBindHost` (застаріле налаштування relay для розширення)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (під час старту Gateway також пропускає провайдерів, чий `api` має майбутнє або невідоме enum-значення, замість того щоб аварійно завершувати роботу)

    Попередження doctor також містять рекомендації щодо типового облікового запису для багатокористувацьких каналів:

    - Якщо налаштовано два або більше записи в `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що fallback-маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` вказує на невідомий ID облікового запису, doctor попереджає про це та перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі на неправильний API або обнулити вартість. Doctor попереджає про це, щоб ви могли прибрати перевизначення і відновити маршрутизацію API та вартість для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція browser і готовність Chrome MCP">
    Якщо ваша конфігурація browser досі вказує на вилучений шлях розширення Chrome, doctor нормалізує її до поточної моделі підключення host-local Chrome MCP:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє шлях host-local Chrome MCP, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для типових профілів автопідключення
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує увімкнути remote debugging на сторінці inspect браузера (наприклад, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може увімкнути це налаштування на боці Chrome за вас. Host-local Chrome MCP усе ще вимагає:

    - браузер на основі Chromium 144+ на хості gateway/node
    - щоб браузер працював локально
    - увімкнений remote debugging у цьому браузері
    - схвалення першого запиту згоди на attach у браузері

    Готовність тут стосується лише передумов локального attach. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, усе ще потребують керованого browser або raw CDP profile.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують raw CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor перевіряє endpoint авторизації OpenAI, щоб переконатися, що локальний стек TLS Node/OpenSSL може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або self-signed cert), doctor виводить платформо-специфічні вказівки щодо виправлення. На macOS із Node, встановленим через Homebrew, виправленням зазвичай є `brew postinstall ca-certificates`. Із `--deep` перевірка виконується навіть тоді, коли Gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо ви раніше додавали застарілі параметри транспорту OpenAI у `models.providers.openai-codex`, вони можуть затіняти вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі параметри транспорту разом із Codex OAuth, щоб ви могли видалити або переписати застаріле перевизначення транспорту й повернути вбудовану поведінку маршрутизації/fallback. Власні proxy та перевизначення лише заголовків усе ще підтримуються і не викликають це попередження.
  </Accordion>
  <Accordion title="2f. Попередження щодо маршрутів Plugin Codex">
    Коли вбудований Plugin Codex увімкнено, doctor також перевіряє, чи посилання на основну модель `openai-codex/*` усе ще розв’язуються через типовий раннер PI. Така комбінація допустима, якщо ви хочете автентифікацію Codex OAuth/subscription через PI, але її легко сплутати з власною app-server harness Codex. Doctor попереджає про це й указує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, тому що обидва маршрути є дійсними:

    - `openai-codex/*` + PI означає "використовувати автентифікацію Codex OAuth/subscription через звичайний раннер OpenClaw."
    - `openai/*` + `runtime: "codex"` означає "запускати вбудований хід через власний app-server Codex."
    - `/codex ...` означає "керувати або прив’язати власну розмову Codex із чату."
    - `/acp ...` або `runtime: "acp"` означає "використовувати зовнішній адаптер ACP/acpx."

    Якщо з’являється це попередження, виберіть маршрут, який ви мали на увазі, і відредагуйте конфігурацію вручну. Залишайте попередження як є, якщо PI Codex OAuth задумано навмисно.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (структура на диску)">
    Doctor може переносити старіші структури на диску до поточної структури:

    - Сховище сесій + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілого `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID облікового запису: `default`)

    Ці міграції виконуються за принципом best-effort та є ідемпотентними; doctor виводить попередження, якщо залишає будь-які застарілі каталоги як резервні копії. Gateway/CLI також автоматично переносить застарілі сесії + каталог агента під час старту, тож історія/автентифікація/моделі потрапляють у шлях конкретного агента без ручного запуску doctor. Автентифікація WhatsApp навмисно переноситься лише через `openclaw doctor`. Нормалізація Talk provider/provider-map тепер порівнює за структурною рівністю, тож відмінності лише в порядку ключів більше не спричиняють повторні no-op зміни `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції маніфеста застарілого Plugin">
    Doctor сканує всі встановлені маніфести Plugin на наявність застарілих ключів можливостей верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Якщо такі знайдено, він пропонує перемістити їх в об’єкт `contracts` і переписати файл маніфеста на місці. Ця міграція є ідемпотентною; якщо ключ `contracts` уже містить ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції сховища застарілого Cron">
    Doctor також перевіряє сховище завдань Cron (`~/.openclaw/cron/jobs.json` типово, або `cron.store`, якщо його перевизначено) на наявність старих форм завдань, які scheduler досі приймає для сумісності.

    Поточні очищення Cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми delivery `provider` у payload → явний `delivery.channel`
    - прості застарілі fallback-завдання Webhook з `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично переносить завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий fallback notify з наявним режимом delivery, відмінним від Webhook, doctor попереджає про це і залишає таке завдання для ручної перевірки.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сесій">
    Doctor сканує каталог сесій кожного агента на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сесії. Для кожного знайденого файлу блокування він повідомляє: шлях, PID, чи PID усе ще активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше виводить примітку та радить запустити команду повторно з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілок транскриптів сесій">
    Doctor сканує JSONL-файли сесій агента на наявність дубльованої форми гілок, створеної багом переписування prompt transcript у версії 2026.4.24: покинутий хід користувача з внутрішнім runtime context OpenClaw плюс активний сусідній запис із тим самим видимим запитом користувача. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файлу поруч з оригіналом і переписує транскрипт на активну гілку, щоб історія Gateway та читачі пам’яті більше не бачили дубльованих ходів.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сесій, маршрутизація та безпека)">
    Каталог стану — це операційний стовбур системи. Якщо він зникне, ви втратите сесії, облікові дані, журнали та конфігурацію (якщо у вас немає резервних копій в іншому місці).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує відновити каталог і нагадує, що не може відновити відсутні дані.
    - **Права доступу до каталогу стану**: перевіряє можливість запису; пропонує виправити права доступу (і виводить підказку `chown`, якщо виявлено невідповідність власника/групи).
    - **Каталог стану macOS, синхронізований із хмарою**: попереджає, коли стан розміщується в iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, оскільки шляхи із синхронізацією можуть спричиняти повільніше I/O та конфлікти блокувань/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розміщується на джерелі монтування `mmcblk*`, оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час запису сесій та облікових даних.
    - **Каталоги сесій відсутні**: `sessions/` і каталог сховища сесій потрібні для збереження історії та уникнення збоїв `ENOENT`.
    - **Невідповідність транскриптів**: попереджає, коли нещодавні записи сесій мають відсутні файли транскриптів.
    - **Основна сесія "1-line JSONL"**: позначає, коли головний транскрипт містить лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли існує кілька тек `~/.openclaw` у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділитися між встановленнями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запускати його на віддаленому хості (саме там зберігається стан).
    - **Права доступу до файлу конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує обмежити права до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделей (строк дії OAuth)">
    Doctor перевіряє OAuth-профілі у сховищі автентифікації, попереджає, коли строк дії токенів спливає або вже сплив, і може оновити їх, коли це безпечно. Якщо профіль Anthropic OAuth/token застарів, він пропонує Anthropic API key або шлях setup-token Anthropic. Запити на оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно завершується невдачею (наприклад, `refresh_token_reused`, `invalid_grant` або коли провайдер повідомляє, що потрібно ввійти знову), doctor повідомляє, що потрібна повторна автентифікація, і виводить точну команду `openclaw models auth login --provider ...`, яку слід виконати.

    Doctor також повідомляє про профілі автентифікації, які тимчасово непридатні до використання через:

    - короткі cooldown-періоди (обмеження швидкості/тайм-аути/збої автентифікації)
    - довші вимкнення (помилки білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Перевірка моделі hooks">
    Якщо встановлено `hooks.gmail.model`, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли воно не розв’язується або заборонене.
  </Accordion>
  <Accordion title="7. Відновлення образу sandbox">
    Коли sandboxing увімкнено, doctor перевіряє Docker image і пропонує зібрати його або перемкнутися на застарілі імена, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Runtime-залежності вбудованих Plugin">
    Doctor перевіряє runtime-залежності лише для вбудованих Plugin, які активні в поточній конфігурації або ввімкнені типовим значенням у своєму вбудованому маніфесті, наприклад `plugins.entries.discord.enabled: true`, застаріле `channels.discord.enabled: true` або типовий увімкнений вбудований провайдер. Якщо чогось бракує, doctor повідомляє про пакунки й установлює їх у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Зовнішні Plugin, як і раніше, використовують `openclaw plugins install` / `openclaw plugins update`; doctor не встановлює залежності для довільних шляхів Plugin.

    Під час відновлення doctor npm-встановлення runtime-залежностей вбудованих пакетів показують прогрес через spinner у TTY-сеансах і періодичний построковий прогрес у piped/headless-виводі. Gateway і локальний CLI також можуть за потреби відновлювати runtime-залежності активних вбудованих Plugin перед імпортом вбудованого Plugin. Ці встановлення обмежені коренем встановлення runtime Plugin, виконуються з вимкненими scripts, не записують package lock і захищені блокуванням install-root, щоб одночасні запуски CLI або Gateway не змінювали те саме дерево `node_modules` одночасно.

  </Accordion>
  <Accordion title="8. Міграції служб Gateway і підказки з очищення">
    Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити службу OpenClaw з використанням поточного порту gateway. Він також може сканувати додаткові служби, схожі на gateway, і виводити підказки з очищення. Іменовані за профілем служби gateway OpenClaw вважаються повноцінними і не позначаються як "додаткові".

    У Linux, якщо служба gateway на рівні користувача відсутня, але існує системна служба gateway OpenClaw, doctor не встановлює автоматично другу службу на рівні користувача. Перевірте через `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або встановіть `OPENCLAW_SERVICE_REPAIR_POLICY=external`, якщо життєвим циклом gateway керує зовнішній supervisor.

  </Accordion>
  <Accordion title="8b. Стартова міграція Matrix">
    Коли обліковий запис каналу Matrix має очікувану або застосовну міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок стану до міграції, а потім запускає best-effort кроки міграції: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки записуються в журнал, а запуск триває. У режимі лише читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Сполучення пристроїв і дрейф автентифікації">
    Тепер Doctor перевіряє стан сполучення пристроїв як частину звичайного проходу перевірки стану системи.

    Що він повідомляє:

    - очікувані запити на перше сполучення
    - очікувані підвищення ролі для вже сполучених пристроїв
    - очікувані підвищення scope для вже сполучених пристроїв
    - виправлення невідповідності public key, коли ID пристрою ще збігається, але ідентичність пристрою більше не збігається зі схваленим записом
    - сполучені записи без активного токена для схваленої ролі
    - сполучені токени, scope яких вийшли за межі схваленої базової лінії сполучення
    - локальні кешовані записи токенів пристрою для поточної машини, які передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не схвалює запити на сполучення автоматично і не виконує автоматичну ротацію токенів пристрою. Натомість він виводить точні наступні кроки:

    - переглянути очікувані запити через `openclaw devices list`
    - схвалити конкретний запит через `openclaw devices approve <requestId>`
    - виконати ротацію нового токена через `openclaw devices rotate --device <deviceId> --role <role>`
    - видалити застарілий запис і схвалити його знову через `openclaw devices remove <deviceId>`

    Це закриває поширену проблему "пристрій уже сполучено, але все одно з’являється вимога сполучення": тепер doctor розрізняє перше сполучення, очікувані підвищення ролі/scope та дрейф застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли провайдер відкритий для DM без allowlist або коли політику налаштовано небезпечним чином.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запуск відбувається як користувацька служба systemd, doctor переконується, що lingering увімкнено, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан робочого простору (Skills, Plugin і застарілі каталоги)">
    Doctor виводить зведення стану робочого простору для типового агента:

    - **Стан Skills**: кількість доступних, тих, де бракує вимог, і Skills, заблокованих allowlist.
    - **Застарілі каталоги робочого простору**: попереджає, коли `~/openclaw` або інші застарілі каталоги робочого простору існують поруч із поточним робочим простором.
    - **Стан Plugin**: підраховує ввімкнені/вимкнені/помилкові Plugin; перелічує ID Plugin для всіх помилок; повідомляє про можливості bundle Plugin.
    - **Попередження сумісності Plugin**: позначає Plugin, які мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує всі попередження або помилки під час завантаження, які видає реєстр Plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Doctor перевіряє, чи наближаються bootstrap-файли робочого простору (наприклад, `AGENTS.md`, `CLAUDE.md` або інші injected context files) до налаштованого ліміту символів або перевищують його. Він повідомляє для кожного файлу кількість сирих і вставлених символів, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість вставлених символів як частку від загального ліміту. Коли файли обрізаються або наближаються до ліміту, doctor виводить поради щодо налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілого Plugin каналу">
    Коли `openclaw doctor --fix` видаляє відсутній Plugin каналу, він також видаляє завислу конфігурацію рівня каналу, яка посилалася на цей Plugin: записи `channels.<id>`, цілі Heartbeat, у яких згадувався канал, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає циклам завантаження Gateway, коли runtime каналу вже немає, але конфігурація все ще наказує gateway прив’язатися до нього.
  </Accordion>
  <Accordion title="11c. Completion оболонки">
    Doctor перевіряє, чи встановлено completion за Tab для поточної оболонки (zsh, bash, fish або PowerShell):

    - Якщо профіль оболонки використовує повільний шаблон динамічного completion (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо completion налаштовано в профілі, але файл кешу відсутній, doctor автоматично відновлює кеш.
    - Якщо completion взагалі не налаштовано, doctor пропонує встановити його (лише в інтерактивному режимі; пропускається з `--non-interactive`).

    Виконайте `openclaw completion --write-state`, щоб вручну перевідтворити кеш.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність автентифікації локального токена gateway.

    - Якщо в режимі токена потрібен токен і жодного джерела токена немає, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується через SecretRef, але недоступний, doctor попереджає і не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано token SecretRef.

  </Accordion>
  <Accordion title="12b. Виправлення з урахуванням SecretRef у режимі лише читання">
    Деякі потоки виправлення потребують перевірки налаштованих облікових даних без послаблення поведінки runtime fail-fast.

    - `openclaw doctor --fix` тепер використовує ту саму модель зведення SecretRef у режимі лише читання, що й команди сімейства status, для цільових виправлень конфігурації.
    - Приклад: виправлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані бота, якщо вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху виконання команди, doctor повідомляє, що облікові дані налаштовано, але вони недоступні, і пропускає авторозв’язання замість збою або хибного повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Перевірка стану Gateway + перезапуск">
    Doctor виконує перевірку стану системи і пропонує перезапустити gateway, якщо він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку в пам’яті">
    Doctor перевіряє, чи готовий налаштований провайдер embedding для пошуку в пам’яті для типового агента. Поведінка залежить від налаштованого backend і провайдера:

    - **QMD backend**: перевіряє, чи доступний і чи запускається двійковий файл `qmd`. Якщо ні, виводить вказівки щодо виправлення, зокрема npm-пакунок і варіант ручного шляху до двійкового файла.
    - **Явний локальний провайдер**: перевіряє наявність локального файлу моделі або розпізнаного URL віддаленої/завантажуваної моделі. Якщо його немає, пропонує перейти на віддаленого провайдера.
    - **Явний віддалений провайдер** (`openai`, `voyage` тощо): перевіряє, чи є API key у середовищі або сховищі автентифікації. Якщо немає, виводить практичні підказки щодо виправлення.
    - **Автоматичний провайдер**: спочатку перевіряє доступність локальної моделі, а потім пробує кожного віддаленого провайдера в порядку автовору.

    Коли доступний кешований результат перевірки gateway (gateway був справний на момент перевірки), doctor звіряє його результат із конфігурацією, видимою CLI, і зазначає будь-які розбіжності. Doctor не запускає нову перевірку embedding за типовим шляхом; використовуйте команду deep status для пам’яті, коли потрібна жива перевірка провайдера.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding під час runtime.

  </Accordion>
  <Accordion title="14. Попередження про стан каналу">
    Якщо gateway справний, doctor виконує перевірку стану каналу і повідомляє про попередження з рекомендованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит конфігурації supervisor + виправлення">
    Doctor перевіряє встановлену конфігурацію supervisor (launchd/systemd/schtasks) на відсутні або застарілі типові значення (наприклад, залежності systemd від network-online і затримка перезапуску). Коли він знаходить невідповідність, то рекомендує оновлення і може переписати файл служби/завдання відповідно до поточних типових значень.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації supervisor.
    - `openclaw doctor --yes` приймає типові запити на виправлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує власні конфігурації supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише читання для життєвого циклу служби gateway. Він усе ще повідомляє про стан служби і запускає виправлення, не пов’язані зі службами, але пропускає встановлення/запуск/перезапуск/bootstrap служби, переписування конфігурації supervisor і очищення застарілих служб, оскільки цим життєвим циклом керує зовнішній supervisor.
    - Якщо для автентифікації токеном потрібен токен і `gateway.auth.token` керується через SecretRef, під час встановлення/виправлення служби doctor перевіряє SecretRef, але не зберігає розв’язані значення токена відкритим текстом у метаданих середовища служби supervisor.
    - Doctor виявляє керовані `.env`/підтримувані SecretRef значення середовища служби, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудовували inline, і переписує метадані служби так, щоб ці значення завантажувалися з джерела runtime, а не з визначення supervisor.
    - Doctor виявляє, коли команда служби все ще фіксує старий `--port` після зміни `gateway.port`, і переписує метадані служби на поточний порт.
    - Якщо для автентифікації токеном потрібен токен і налаштований token SecretRef не розв’язується, doctor блокує шлях встановлення/виправлення та надає практичні вказівки.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не встановлено, doctor блокує встановлення/виправлення, доки режим не буде задано явно.
    - Для користувацьких unit systemd у Linux перевірки дрейфу токена в doctor тепер охоплюють і джерела `Environment=`, і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Виправлення служб doctor відмовляються переписувати, зупиняти або перезапускати службу gateway зі старішого двійкового файла OpenClaw, якщо конфігурацію востаннє було записано новішою версією. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway і порту">
    Doctor перевіряє runtime служби (PID, останній статус завершення) і попереджає, коли службу встановлено, але вона фактично не запущена. Він також перевіряє конфлікти портів на порту gateway (типово `18789`) і повідомляє про ймовірні причини (gateway уже запущено, SSH-тунель).
  </Accordion>
  <Accordion title="17. Рекомендовані практики runtime Gateway">
    Doctor попереджає, коли служба gateway працює на Bun або на шляху Node, керованому менеджером версій (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp і Telegram потребують Node, а шляхи менеджера версій можуть ламатися після оновлень, оскільки служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує перейти на системне встановлення Node, якщо воно доступне (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані wizard">
    Doctor зберігає всі зміни конфігурації та проставляє метадані wizard, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервні копії + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, якщо вона відсутня, і виводить пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace) для повного посібника зі структури робочого простору та резервного копіювання через git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Інструкція для Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
