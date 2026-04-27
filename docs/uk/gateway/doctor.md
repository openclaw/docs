---
read_when:
    - Додавання або зміна міграцій doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки стану, міграції конфігурації та кроки відновлення'
title: Лікар
x-i18n:
    generated_at: "2026-04-27T09:29:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3affd11fb28bf7fa3cc249da6d52d370b1ada55e004b3709fca0259b6c27e71
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` — це інструмент відновлення + міграції для OpenClaw. Він виправляє застарілі конфігурації/стан, перевіряє стан системи та надає практичні кроки для відновлення.

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

    Приймає значення за замовчуванням без запитів (зокрема кроки відновлення перезапуску/сервісу/пісочниці, коли це застосовно).

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

    Запускається без запитів і застосовує лише безпечні міграції (нормалізація конфігурації + перенесення стану на диску). Пропускає дії з перезапуском/сервісом/пісочницею, які потребують підтвердження людиною. Міграції застарілого стану виконуються автоматично, якщо їх виявлено.

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
  <Accordion title="Стан системи, UI та оновлення">
    - Необов’язкове попереднє оновлення для git-інсталяцій (лише в інтерактивному режимі).
    - Перевірка актуальності протоколу UI (перебудовує Control UI, якщо схема протоколу новіша).
    - Перевірка стану + запит на перезапуск.
    - Підсумок стану Skills (доступні/відсутні/заблоковані) і стану Plugin.
  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих плоских полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення OAuth Codex (`models.providers.openai-codex`).
    - Перевірка TLS-передумов OAuth для профілів OpenAI Codex OAuth.
    - Міграція застарілого стану на диску (сеанси/каталог агента/автентифікація WhatsApp).
    - Міграція ключів контрактів маніфесту застарілого Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція сховища застарілого Cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, `provider` у payload, прості fallback-завдання Webhook з `notify: true`).
    - Міграція застарілої runtime-policy агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файла блокування сеансу та очищення застарілих блокувань.
    - Відновлення транскриптів сеансів для дубльованих гілок переписування prompt, створених у збірках 2026.4.24, яких це стосується.
    - Перевірки цілісності стану та дозволів (сеанси, транскрипти, каталог стану).
    - Перевірки дозволів файла конфігурації (`chmod 600`) під час локального запуску.
    - Стан автентифікації моделі: перевіряє строк дії OAuth, може оновлювати токени, строк дії яких спливає, і повідомляє про стани cooldown/disabled профілю автентифікації.
    - Виявлення додаткового каталогу workspace (`~/openclaw`).
  </Accordion>
  <Accordion title="Gateway, сервіси та supervisor">
    - Відновлення образу пісочниці, коли ізоляцію ввімкнено.
    - Міграція застарілих сервісів і виявлення додаткових Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime Gateway (сервіс інстальовано, але не запущено; кешована мітка launchd).
    - Попередження про стан каналів (перевіряються із запущеного Gateway).
    - Аудит конфігурації supervisor (launchd/systemd/schtasks) з необов’язковим відновленням.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи менеджера версій).
    - Діагностика конфліктів порту Gateway (типово `18789`).
  </Accordion>
  <Accordion title="Автентифікація, безпека та сполучення">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує згенерувати токен, коли немає джерела токена; не перезаписує конфігурації token SecretRef).
    - Виявлення проблем сполучення пристрою (очікувані перші запити на сполучення, очікувані оновлення ролі/області, застарілий дрейф локального кешу токена пристрою та дрейф автентифікації paired-record).
  </Accordion>
  <Accordion title="Workspace і оболонка">
    - Перевірка systemd linger на Linux.
    - Перевірка розміру bootstrap-файла workspace (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка стану shell completion та автоінсталяція/оновлення.
    - Перевірка готовності провайдера embedding для пошуку в пам’яті (локальна модель, віддалений API-ключ або бінарний файл QMD).
    - Перевірки source-інсталяції (невідповідність pnpm workspace, відсутні assets UI, відсутній бінарний файл tsx).
    - Записує оновлену конфігурацію + метадані майстра.
  </Accordion>
</AccordionGroup>

## Backfill і скидання у Dreams UI

Сцена Dreams у Control UI включає дії **Backfill**, **Reset** і **Clear Grounded** для робочого процесу grounded dreaming. Ці дії використовують RPC-методи Gateway у стилі doctor, але вони **не** є частиною відновлення/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному workspace, виконує grounded REM diary pass і записує зворотні записи backfill у `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише позначені записи backfill diary.
- **Clear Grounded** видаляє лише staged grounded-only короткострокові записи, що походять з історичного replay і ще не накопичили live recall або daily support.

Що вони самі по собі **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не переводять автоматично grounded candidates до live short-term promotion store, якщо ви явно не запустите спочатку staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайний deep promotion lane, натомість використовуйте CLI-потік:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це переводить grounded durable candidates до short-term dreaming store, залишаючи `DREAMS.md` поверхнею для перегляду.

## Детальна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-інсталяції)">
    Якщо це git checkout і doctor запущено в інтерактивному режимі, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх до поточної схеми.

    Це також включає застарілі плоскі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у мапу провайдерів.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються виконуватися й просять запустити `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі було знайдено.
    - Покажe міграцію, яку він застосував.
    - Перезапише `~/.openclaw/openclaw.json` оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час старту, коли виявляє застарілий формат конфігурації, тож застарілі конфігурації відновлюються без ручного втручання. Міграції сховища завдань Cron обробляються через `openclaw doctor --fix`.

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
    - Для каналів з іменованими `accounts`, але із застарілими верхньорівневими значеннями каналу для одного акаунта, переносить ці значення рівня акаунта до вибраного підвищеного акаунта для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/default-ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видаляє `browser.relayBindHost` (застаріле налаштування relay для розширення)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (під час старту Gateway також пропускає провайдери, у яких `api` встановлено на майбутнє або невідоме значення enum, замість того щоб аварійно зупинятися)

    Попередження doctor також містять рекомендації щодо default-акаунта для багатокаунтних каналів:

    - Якщо налаштовано два або більше записи `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що fallback routing може вибрати неочікуваний акаунт.
    - Якщо `channels.<channel>.defaultAccount` вказано на невідомий ID акаунта, doctor попереджає про це й перелічує налаштовані ID акаунтів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може змусити моделі використовувати неправильний API або обнулити вартість. Doctor попереджає про це, щоб ви могли прибрати перевизначення та відновити маршрутизацію API + вартість для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера та готовність Chrome MCP">
    Якщо ваша конфігурація браузера все ще вказує на вилучений шлях розширення Chrome, doctor нормалізує її до поточної моделі підключення Chrome MCP на локальному хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє шлях Chrome MCP на локальному хості, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для типових профілів з автопідключенням
    - перевіряє виявлену версію Chrome та попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці inspect браузера (наприклад, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути це налаштування на боці Chrome за вас. Chrome MCP на локальному хості все ще потребує:

    - браузер на базі Chromium 144+ на хості gateway/node
    - локально запущений браузер
    - увімкнене віддалене налагодження в цьому браузері
    - підтвердження першого запиту на згоду підключення в браузері

    Готовність тут стосується лише локальних передумов підключення. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, усе ще потребують керованого браузера або необробленого профілю CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують необроблений CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor опитує кінцеву точку авторизації OpenAI, щоб перевірити, чи локальний стек TLS Node/OpenSSL може валідувати ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor виводить специфічні для платформи інструкції з виправлення. На macOS з Node від Homebrew виправлення зазвичай таке: `brew postinstall ca-certificates`. З `--deep` перевірка виконується, навіть якщо Gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо раніше ви додали застарілі налаштування транспорту OpenAI в `models.providers.openai-codex`, вони можуть затіняти шлях вбудованого провайдера Codex OAuth, який новіші релізи використовують автоматично. Doctor попереджає, коли бачить ці старі налаштування транспорту разом із Codex OAuth, щоб ви могли видалити або переписати застаріле перевизначення транспорту та повернути вбудовану поведінку маршрутизації/fallback. Користувацькі проксі та перевизначення лише заголовків усе ще підтримуються й не спричиняють цього попередження.
  </Accordion>
  <Accordion title="2f. Попередження про маршрути Plugin Codex">
    Коли ввімкнено вбудований Plugin Codex, doctor також перевіряє, чи посилання на основну модель `openai-codex/*` досі резольвляться через типовий runner PI. Ця комбінація коректна, якщо ви хочете автентифікацію Codex OAuth/підписки через PI, але її легко сплутати з нативним app-server harness Codex. Doctor попереджає про це та вказує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, тому що обидва маршрути коректні:

    - `openai-codex/*` + PI означає «використовувати автентифікацію Codex OAuth/підписки через звичайний runner OpenClaw».
    - `openai/*` + `runtime: "codex"` означає «запустити вбудований хід через нативний app-server Codex».
    - `/codex ...` означає «керувати або прив’язати нативну розмову Codex із чату».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

    Якщо з’являється це попередження, виберіть маршрут, який ви мали на увазі, і відредагуйте конфігурацію вручну. Залиште попередження як є, якщо PI Codex OAuth використовується навмисно.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (структура на диску)">
    Doctor може перенести старіші структури на диску в поточну структуру:

    - Сховище сеансів + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілого `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий account id: `default`)

    Ці міграції виконуються за принципом best-effort та є ідемпотентними; doctor виведе попередження, якщо залишить якісь застарілі каталоги як резервні копії. Gateway/CLI також автоматично мігрує застарілі сеанси + каталог агента під час старту, тож історія/автентифікація/моделі потрапляють до шляху для конкретного агента без ручного запуску doctor. Автентифікація WhatsApp навмисно мігрується лише через `openclaw doctor`. Нормалізація provider/provider-map Talk тепер порівнюється за структурною рівністю, тому відмінності лише в порядку ключів більше не спричиняють повторних no-op змін у `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції маніфесту застарілого Plugin">
    Doctor сканує всі встановлені маніфести Plugin на наявність застарілих ключів можливостей верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Якщо їх знайдено, він пропонує перемістити їх до об’єкта `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже містить ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції сховища застарілого Cron">
    Doctor також перевіряє сховище завдань Cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, якщо його перевизначено) на наявність старих форм завдань, які планувальник досі приймає для сумісності.

    Поточні очищення Cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми delivery `provider` у payload → явний `delivery.channel`
    - прості застарілі fallback-завдання Webhook з `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий fallback notify з наявним режимом delivery не-Webhook, doctor попереджає і залишає це завдання для ручної перевірки.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сеансів">
    Doctor сканує каталог сеансів кожного агента на наявність застарілих write-lock файлів — файлів, що залишилися після аварійного завершення сеансу. Для кожного знайденого файла блокування він повідомляє: шлях, PID, чи PID досі активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше виводить примітку та пропонує повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілок транскриптів сеансів">
    Doctor сканує JSONL-файли сеансів агентів на наявність форми дубльованих гілок, створеної помилкою переписування транскрипту prompt у 2026.4.24: покинутий хід користувача з внутрішнім runtime-контекстом OpenClaw плюс активний сусідній запис із тим самим видимим prompt користувача. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файла поруч з оригіналом і переписує транскрипт на активну гілку, щоб історія Gateway та читачі пам’яті більше не бачили дубльовані ходи.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сеансів, маршрутизація та безпека)">
    Каталог стану — це операційний стовбур мозку. Якщо він зникне, ви втратите сеанси, облікові дані, журнали та конфігурацію (якщо у вас немає резервних копій в іншому місці).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує відтворити каталог і нагадує, що не може відновити втрачені дані.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує відновити дозволи (і виводить підказку `chown`, якщо виявлено невідповідність власника/групи).
    - **Каталог стану в macOS, синхронізований із хмарою**: попереджає, коли стан резольвиться до iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, оскільки шляхи з синхронізацією можуть спричиняти повільніший I/O і гонки блокувань/синхронізації.
    - **Каталог стану на Linux SD або eMMC**: попереджає, коли стан резольвиться до джерела монтування `mmcblk*`, оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношуватися при записах сеансів та облікових даних.
    - **Каталоги сеансів відсутні**: `sessions/` і каталог сховища сеансів потрібні для збереження історії та уникнення збоїв `ENOENT`.
    - **Невідповідність транскриптів**: попереджає, коли в останніх записах сеансів відсутні файли транскриптів.
    - **Основний сеанс "1-line JSONL"**: позначає випадки, коли головний транскрипт має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли існує кілька папок `~/.openclaw` у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділятися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запускати його на віддаленому хості (там зберігається стан).
    - **Дозволи файла конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний на читання для групи/всіх, і пропонує обмежити доступ до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделей (строк дії OAuth)">
    Doctor перевіряє профілі OAuth у сховищі автентифікації, попереджає, коли строк дії токенів спливає/сплив, і може оновити їх, коли це безпечно. Якщо профіль Anthropic OAuth/token застарів, він пропонує API-ключ Anthropic або шлях setup-token Anthropic. Запити на оновлення з’являються лише в інтерактивному режимі (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад, `refresh_token_reused`, `invalid_grant` або провайдер повідомляє, що потрібно знову увійти), doctor повідомляє, що потрібна повторна автентифікація, і виводить точну команду `openclaw models auth login --provider ...`, яку слід виконати.

    Doctor також повідомляє про профілі автентифікації, які тимчасово не можна використовувати через:

    - короткі cooldown (ліміти частоти/тайм-аути/збої автентифікації)
    - довші вимкнення (збої білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Валідація моделі hooks">
    Якщо встановлено `hooks.gmail.model`, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, якщо воно не резольвиться або не дозволене.
  </Accordion>
  <Accordion title="7. Відновлення образу пісочниці">
    Коли sandboxing увімкнено, doctor перевіряє образи Docker і пропонує зібрати їх або переключитися на застарілі імена, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Runtime-залежності вбудованого Plugin">
    Doctor перевіряє runtime-залежності лише для вбудованих Plugin, які активні в поточній конфігурації або ввімкнені типовим значенням у вбудованому маніфесті, наприклад `plugins.entries.discord.enabled: true`, застаріле `channels.discord.enabled: true` або вбудований провайдер, увімкнений за замовчуванням. Якщо чогось бракує, doctor повідомляє про пакети та встановлює їх у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Зовнішні Plugin, як і раніше, використовують `openclaw plugins install` / `openclaw plugins update`; doctor не встановлює залежності для довільних шляхів Plugin.

    Gateway і локальний CLI також можуть на вимогу відновлювати runtime-залежності активних вбудованих Plugin перед імпортом вбудованого Plugin. Ці інсталяції обмежені коренем інсталяції runtime Plugin, виконуються з вимкненими скриптами, не записують package lock і захищені блокуванням кореня інсталяції, щоб паралельні запуски CLI або Gateway не змінювали те саме дерево `node_modules` одночасно.

  </Accordion>
  <Accordion title="8. Міграції сервісу Gateway та підказки з очищення">
    Doctor виявляє застарілі сервіси Gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити сервіс OpenClaw з поточним портом Gateway. Він також може сканувати додаткові сервіси, схожі на Gateway, і виводити підказки з очищення. Іменовані за профілем сервіси Gateway OpenClaw вважаються повноцінними та не позначаються як «додаткові».
  </Accordion>
  <Accordion title="8b. Міграція Matrix під час запуску">
    Коли обліковий запис каналу Matrix має очікувану або придатну до виконання міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок стану до міграції, а потім виконує кроки міграції за принципом best-effort: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки логуються, і запуск триває. У режимі лише читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Сполучення пристроїв і дрейф автентифікації">
    Тепер doctor перевіряє стан сполучення пристроїв як частину стандартної перевірки стану системи.

    Що він повідомляє:

    - очікувані перші запити на сполучення
    - очікувані підвищення ролей для вже сполучених пристроїв
    - очікувані розширення scope для вже сполучених пристроїв
    - відновлення невідповідностей публічного ключа, коли ідентифікатор пристрою все ще збігається, але ідентичність пристрою більше не відповідає схваленому запису
    - сполучені записи без активного токена для схваленої ролі
    - сполучені токени, scope яких вийшли за межі схваленої базової лінії сполучення
    - локальні кешовані записи токена пристрою для поточної машини, які передують ротації токена на боці Gateway або містять застарілі метадані scope

    Doctor не схвалює запити на сполучення автоматично і не виконує автоматичну ротацію токенів пристрою. Натомість він виводить точні наступні кроки:

    - переглянути очікувані запити за допомогою `openclaw devices list`
    - схвалити конкретний запит за допомогою `openclaw devices approve <requestId>`
    - виконати ротацію нового токена за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видалити та повторно схвалити застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває типову прогалину «вже сполучено, але все одно з’являється pairing required»: тепер doctor розрізняє перше сполучення, очікувані оновлення ролі/scope та дрейф застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли провайдер відкритий для DM без allowlist або коли політику налаштовано небезпечним чином.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запуск виконується як user service systemd, doctor гарантує, що linger увімкнено, щоб Gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан workspace (Skills, Plugin і застарілі каталоги)">
    Doctor виводить підсумок стану workspace для типового агента:

    - **Стан Skills**: кількість доступних, з відсутніми вимогами та заблокованих allowlist Skills.
    - **Застарілі каталоги workspace**: попереджає, коли `~/openclaw` або інші застарілі каталоги workspace існують поряд із поточним workspace.
    - **Стан Plugin**: кількість увімкнених/вимкнених/помилкових Plugin; перелік ID Plugin для всіх помилок; повідомляє про можливості bundle Plugin.
    - **Попередження сумісності Plugin**: позначає Plugin, які мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує всі попередження або помилки під час завантаження, які виводить реєстр Plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файла">
    Doctor перевіряє, чи файли bootstrap workspace (наприклад, `AGENTS.md`, `CLAUDE.md` або інші ін’єктовані контекстні файли) не наближаються або не перевищують налаштований бюджет символів. Він повідомляє для кожного файла кількість необроблених і ін’єктованих символів, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість ін’єктованих символів як частку від загального бюджету. Коли файли обрізано або вони близькі до ліміту, doctor виводить поради щодо налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor перевіряє, чи встановлено tab completion для поточної оболонки (zsh, bash, fish або PowerShell):

    - Якщо профіль оболонки використовує повільний динамічний шаблон completion (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо completion налаштовано в профілі, але файл кешу відсутній, doctor автоматично перевідтворює кеш.
    - Якщо completion взагалі не налаштовано, doctor пропонує встановити його (лише в інтерактивному режимі; пропускається з `--non-interactive`).

    Виконайте `openclaw completion --write-state`, щоб перевідтворити кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність автентифікації локального токена Gateway.

    - Якщо режим токена потребує токен і джерело токена відсутнє, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується через SecretRef, але недоступний, doctor попереджає та не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано token SecretRef.

  </Accordion>
  <Accordion title="12b. Відновлення з урахуванням SecretRef у режимі лише читання">
    Деякі сценарії відновлення мають перевіряти налаштовані облікові дані без послаблення fail-fast поведінки runtime.

    - `openclaw doctor --fix` тепер використовує ту саму модель підсумку SecretRef лише для читання, що й команди сімейства status, для цільового відновлення конфігурації.
    - Приклад: відновлення Telegram `allowFrom` / `groupAllowFrom` для `@username` намагається використати налаштовані облікові дані бота, якщо вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху виконання команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає автоматичне розв’язання замість аварійного завершення або помилкового повідомлення про відсутній токен.

  </Accordion>
  <Accordion title="13. Перевірка стану Gateway + перезапуск">
    Doctor запускає перевірку стану й пропонує перезапустити Gateway, якщо він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку в пам’яті">
    Doctor перевіряє, чи готовий налаштований провайдер embedding для пошуку в пам’яті для типового агента. Поведінка залежить від налаштованого backend і провайдера:

    - **QMD backend**: перевіряє, чи доступний і чи може запускатися бінарний файл `qmd`. Якщо ні — виводить інструкції з виправлення, включно з npm-пакетом і варіантом ручного шляху до бінарного файла.
    - **Явно вказаний локальний провайдер**: перевіряє наявність локального файла моделі або розпізнаного віддаленого/завантажуваного URL моделі. Якщо відсутній, пропонує перейти на віддаленого провайдера.
    - **Явно вказаний віддалений провайдер** (`openai`, `voyage` тощо): перевіряє, чи присутній API-ключ у середовищі або сховищі автентифікації. Якщо його немає, виводить практичні підказки з виправлення.
    - **Автоматичний провайдер**: спочатку перевіряє доступність локальної моделі, а потім по черзі пробує кожного віддаленого провайдера в порядку авто-вибору.

    Коли результат перевірки Gateway доступний (Gateway був справним під час перевірки), doctor звіряє його з видимою для CLI конфігурацією та зазначає будь-яку невідповідність.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding у runtime.

  </Accordion>
  <Accordion title="14. Попередження про стан каналів">
    Якщо Gateway справний, doctor запускає перевірку стану каналів і повідомляє попередження з рекомендованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит конфігурації supervisor + відновлення">
    Doctor перевіряє встановлену конфігурацію supervisor (launchd/systemd/schtasks) на відсутність або застарілі типові значення (наприклад, залежності systemd від network-online і затримку перезапуску). Коли він знаходить невідповідність, рекомендує оновлення та може переписати файл сервісу/завдання до поточних типових значень.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації supervisor.
    - `openclaw doctor --yes` приймає типові запити на відновлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише читання для життєвого циклу сервісу Gateway. Він, як і раніше, повідомляє про стан сервісу та виконує відновлення, не пов’язані із сервісом, але пропускає встановлення/запуск/перезапуск/bootstrap сервісу, переписування конфігурації supervisor і очищення застарілих сервісів, оскільки цим життєвим циклом керує зовнішній supervisor.
    - Якщо автентифікація токеном потребує токена і `gateway.auth.token` керується через SecretRef, doctor під час встановлення/відновлення сервісу перевіряє SecretRef, але не зберігає розв’язані значення токена відкритим текстом у метадані середовища сервісу supervisor.
    - Doctor виявляє керовані `.env`/підкріплені SecretRef значення середовища сервісу, які старі інсталяції LaunchAgent, systemd або Windows Scheduled Task вбудовували inline, і переписує метадані сервісу так, щоб ці значення завантажувалися з runtime-джерела, а не з визначення supervisor.
    - Якщо автентифікація токеном потребує токена і налаштований token SecretRef не розв’язується, doctor блокує шлях встановлення/відновлення з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не вказано, doctor блокує встановлення/відновлення, доки режим не буде явно задано.
    - Для Linux user-systemd unit перевірки дрейфу токена в doctor тепер включають і джерела `Environment=`, і `EnvironmentFile=` під час порівняння метаданих автентифікації сервісу.
    - Відновлення сервісу в doctor відмовляється переписувати, зупиняти або перезапускати сервіс Gateway зі старішого бінарного файла OpenClaw, якщо конфігурацію востаннє записано новішою версією. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway і порту">
    Doctor перевіряє runtime сервісу (PID, останній статус виходу) і попереджає, якщо сервіс установлено, але він фактично не запущений. Він також перевіряє конфлікти портів на порту Gateway (типово `18789`) і повідомляє ймовірні причини (Gateway уже запущено, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли сервіс Gateway працює на Bun або на шляху Node, керованому менеджером версій (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджерів версій можуть ламатися після оновлень, тому що сервіс не завантажує ініціалізацію вашої оболонки. Doctor пропонує перейти на системну інсталяцію Node, якщо вона доступна (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає будь-які зміни конфігурації та проставляє метадані майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо workspace (резервні копії + система пам’яті)">
    Doctor пропонує систему пам’яті workspace, якщо її немає, і виводить пораду про резервне копіювання, якщо workspace ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури workspace та резервного копіювання через git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Посібник з експлуатації Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
