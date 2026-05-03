---
read_when:
    - Додавання або зміна міграцій doctor
    - Внесення несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки справності, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-03T09:37:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент відновлення та міграції для OpenClaw. Він виправляє застарілі конфігурацію/стан, перевіряє справність і надає дієві кроки для відновлення.

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

    Прийняти значення за замовчуванням без запитів (зокрема кроки перезапуску/служби/відновлення sandbox, коли застосовно).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Застосувати рекомендовані відновлення без запитів (відновлення + перезапуски, коли це безпечно).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Застосувати також агресивні відновлення (перезаписує користувацькі конфіги supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запустити без запитів і застосувати лише безпечні міграції (нормалізацію конфігурації + перенесення стану на диску). Пропускає дії перезапуску/служби/sandbox, які потребують підтвердження людини. Міграції застарілого стану запускаються автоматично, коли їх виявлено.

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
  <Accordion title="Справність, інтерфейс і оновлення">
    - Необов’язкове попереднє оновлення для git-інсталяцій (лише інтерактивно).
    - Перевірка актуальності протоколу інтерфейсу (перезбирає Control UI, коли схема протоколу новіша).
    - Перевірка справності + запит на перезапуск.
    - Зведення стану Skills (придатні/відсутні/заблоковані) і стан Plugin.

  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих плоских полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігів Chrome extension і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення OAuth Codex (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Попередження про allowlist Plugin/інструментів, коли `plugins.allow` обмежувальний, але політика інструментів усе ще запитує wildcard або інструменти, що належать Plugin.
    - Міграція застарілого стану на диску (sessions/agent dir/WhatsApp auth).
    - Міграція застарілих ключів контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища Cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, payload `provider`, прості резервні завдання Webhook `notify: true`).
    - Міграція застарілої runtime-policy агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли plugins увімкнено; коли `plugins.enabled=false`, застарілі посилання на Plugin вважаються інертною конфігурацією ізоляції та зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка lock-файла сесії та очищення застарілих lock.
    - Відновлення transcript сесії для дубльованих гілок prompt-rewrite, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для відновлення після перезапуску застряглого subagent, з підтримкою `--fix` для очищення застарілих прапорців aborted recovery, щоб запуск не продовжував трактувати дочірній процес як restart-aborted.
    - Перевірки цілісності стану та дозволів (sessions, transcripts, state dir).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Справність автентифікації моделей: перевіряє завершення строку OAuth, може оновлювати токени, строк дії яких спливає, і повідомляє про стани cooldown/disabled auth-profile.
    - Виявлення додаткової директорії workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, служби та supervisor">
    - Відновлення sandbox image, коли sandboxing увімкнено.
    - Міграція застарілих служб і виявлення додаткового Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Runtime-перевірки Gateway (службу встановлено, але не запущено; кешована launchd label).
    - Попередження про стан каналів (перевіряються із запущеного Gateway).
    - Аудит конфігурації supervisor (launchd/systemd/schtasks) з необов’язковим відновленням.
    - Очищення середовища вбудованого proxy для служб Gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час інсталяції або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи version-manager).
    - Діагностика конфліктів порту Gateway (типово `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та сполучення">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли джерела токена немає; не перезаписує конфіги токена SecretRef).
    - Виявлення проблем зі сполученням пристрою (очікувані перші запити на сполучення, очікувані підвищення ролі/області, дрейф застарілого локального кешу device-token і дрейф автентифікації paired-record).

  </Accordion>
  <Accordion title="Workspace і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файла workspace (попередження про обрізання/наближення до ліміту для файлів контексту).
    - Перевірка готовності Skills для агента за замовчуванням; повідомляє про дозволені skills з відсутніми bins, env, config або вимогами ОС, а `--fix` може вимкнути недоступні skills у `skills.entries`.
    - Перевірка стану shell completion і автоматична інсталяція/оновлення.
    - Перевірка готовності провайдера embeddings для пошуку пам’яті (локальна модель, ключ віддаленого API або QMD binary).
    - Перевірки source install (невідповідність pnpm workspace, відсутні UI assets, відсутній tsx binary).
    - Записує оновлену конфігурацію + metadata wizard.

  </Accordion>
</AccordionGroup>

## Зворотне заповнення та скидання UI Dreams

Сцена Dreams у Control UI містить дії **Зворотне заповнення**, **Скидання** та **Очистити обґрунтоване** для робочого процесу обґрунтованого Dreaming. Ці дії використовують RPC-методи Gateway у стилі doctor, але вони **не** є частиною відновлення/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Зворотне заповнення** сканує історичні файли `memory/YYYY-MM-DD.md` в активному workspace, запускає grounded REM diary pass і записує оборотні backfill entries у `DREAMS.md`.
- **Скидання** видаляє з `DREAMS.md` лише ці позначені backfill diary entries.
- **Очистити обґрунтоване** видаляє лише підготовлені grounded-only short-term entries, що надійшли з історичного replay і ще не накопичили live recall або daily support.

Чого вони самі **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не додають автоматично grounded candidates до live short-term promotion store, якщо ви спочатку явно не запустите staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайну deep promotion lane, натомість використовуйте CLI flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це додає grounded durable candidates до short-term dreaming store, водночас залишаючи `DREAMS.md` як поверхню для перегляду.

## Докладна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-інсталяції)">
    Якщо це git checkout і doctor працює інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без channel-specific override), doctor нормалізує їх у поточну схему.

    Це включає застарілі плоскі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у provider map.

    Doctor також попереджає, коли `plugins.allow` не порожній і політика інструментів використовує
    wildcard або записи інструментів, що належать Plugin. `tools.allow: ["*"]` відповідає лише інструментам
    із plugins, які фактично завантажуються; він не обходить ексклюзивний allowlist Plugin.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися й просять вас виконати `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час запуску, коли виявляє застарілий формат конфігурації, тож застарілі конфіги відновлюються без ручного втручання. Міграції сховища завдань Cron обробляються командою `openclaw doctor --fix`.

    Поточні міграції:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - конфігурації налаштованих каналів без видимої політики відповіді → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Для каналів з іменованими `accounts`, але із залишковими верхньорівневими значеннями каналу для одного акаунта, перемістіть ці значення з областю акаунта до підвищеного акаунта, вибраного для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/стандартну ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видаліть `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для тайм-аутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видаліть `browser.relayBindHost` (застаріле налаштування ретранслятора розширення)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (запуск Gateway також пропускає провайдерів, у яких `api` встановлено в майбутнє або невідоме значення enum, замість аварійного завершення в закритому режимі)

    Попередження doctor також містять рекомендації щодо стандартного акаунта для багатьохакаунтових каналів:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний акаунт.
    - Якщо `channels.<channel>.defaultAccount` встановлено на невідомий ID акаунта, doctor попереджає та перелічує налаштовані ID акаунтів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі на неправильний API або обнулити витрати. Doctor попереджає, щоб ви могли видалити перевизначення й відновити маршрутизацію API та витрати для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера та готовність Chrome MCP">
    Якщо ваша конфігурація браузера все ще вказує на видалений шлях розширення Chrome, doctor нормалізує її до поточної моделі приєднання Chrome MCP на локальному хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє шлях Chrome MCP на локальному хості, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для стандартних профілів автоматичного підключення
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці інспектування браузера (наприклад `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути налаштування на боці Chrome за вас. Chrome MCP на локальному хості все ще потребує:

    - браузера на основі Chromium 144+ на хості gateway/node
    - локально запущеного браузера
    - увімкненого віддаленого налагодження в цьому браузері
    - підтвердження першого запиту згоди на приєднання в браузері

    Готовність тут стосується лише передумов локального приєднання. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, все ще потребують керованого браузера або сирого профілю CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують сирий CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor перевіряє кінцеву точку авторизації OpenAI, щоб підтвердити, що локальний стек Node/OpenSSL TLS може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor виводить рекомендації щодо виправлення для конкретної платформи. На macOS з Homebrew Node виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка виконується навіть якщо gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо раніше ви додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть затінити вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі налаштування транспорту поруч із Codex OAuth, щоб ви могли видалити або переписати застаріле перевизначення транспорту й повернути вбудовану маршрутизацію/резервну поведінку. Користувацькі проксі та перевизначення лише заголовків усе ще підтримуються й не викликають це попередження.
  </Accordion>
  <Accordion title="2f. Попередження маршрутів Plugin Codex">
    Коли ввімкнено вбудований Plugin Codex, doctor також перевіряє, чи посилання первинних моделей `openai-codex/*` усе ще розв’язуються через стандартний PI runner. Така комбінація чинна, коли вам потрібна автентифікація Codex OAuth/підписки через PI, але її легко сплутати з нативним app-server harness Codex. Doctor попереджає та вказує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, тому що обидва маршрути чинні:

    - `openai-codex/*` + PI означає «використовувати автентифікацію Codex OAuth/підписки через звичайний runner OpenClaw».
    - `openai/*` + `agentRuntime.id: "codex"` означає «виконувати вбудований хід через нативний app-server Codex».
    - `/codex ...` означає «керувати або прив’язати нативну розмову Codex з чату».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

    Якщо з’являється попередження, виберіть потрібний маршрут і вручну відредагуйте конфігурацію. Залиште попередження без змін, коли PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (структура диска)">
    Doctor може мігрувати старіші дискові структури в поточну структуру:

    - Сховище сесій + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілого `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (стандартний id акаунта: `default`)

    Ці міграції виконуються за принципом best-effort та є ідемпотентними; doctor видаватиме попередження, коли залишатиме будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі сесії + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапляли в шлях для конкретного агента без ручного запуску doctor. Автентифікація WhatsApp навмисно мігрується лише через `openclaw doctor`. Нормалізація talk-провайдера/мапи провайдерів тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не спричиняють повторні no-op зміни `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів Plugin">
    Doctor сканує всі встановлені маніфести Plugin на наявність застарілих верхньорівневих ключів можливостей (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли їх знайдено, він пропонує перемістити їх в об’єкт `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища cron">
    Doctor також перевіряє сховище завдань cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, якщо перевизначено) на старі форми завдань, які планувальник досі приймає для сумісності.

    Поточні очищення cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - верхньорівневі поля payload (`message`, `model`, `thinking`, ...) → `payload`
    - верхньорівневі поля доставки (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми доставки payload `provider` → явний `delivery.channel`
    - прості застарілі резервні завдання webhook `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли це можна зробити без зміни поведінки. Якщо завдання поєднує застарілий резерв notify з наявним режимом доставки не через webhook, doctor попереджає й залишає це завдання для ручного перегляду.

    На Linux doctor також попереджає, коли crontab користувача все ще викликає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`. Цей скрипт на локальному хості не підтримується поточним OpenClaw і може записувати хибні повідомлення `Gateway inactive` у `~/.openclaw/logs/whatsapp-health.log`, коли cron не може дістатися до користувацької шини systemd. Видаліть застарілий запис crontab за допомогою `crontab -e`; використовуйте `openclaw channels status --probe`, `openclaw doctor` і `openclaw gateway status` для поточних перевірок стану.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сеансів">
    Doctor сканує кожен каталог сеансів агентів на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сеансу. Для кожного знайденого файла блокування він повідомляє: шлях, PID, чи PID ще активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше друкує примітку та вказує повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілки стенограми сеансу">
    Doctor сканує JSONL-файли сеансів агентів на дубльовану форму гілки, створену помилкою переписування стенограми промптів 2026.4.24: покинутий хід користувача з внутрішнім runtime-контекстом OpenClaw плюс активний сусідній вузол із тим самим видимим промптом користувача. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файла поруч з оригіналом і переписує стенограму на активну гілку, щоб історія gateway і читачі пам’яті більше не бачили дубльованих ходів.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сеансів, маршрутизація та безпека)">
    Каталог стану — це операційний мозковий стовбур. Якщо він зникне, ви втратите сеанси, облікові дані, журнали та конфігурацію (якщо не маєте резервних копій деінде).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Каталог стану macOS, синхронізований із хмарою**: попереджає, коли стан розташований у iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, бо шляхи з синхронізацією можуть спричиняти повільніший I/O і перегони блокувань/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розташований на джерелі монтування `mmcblk*`, бо випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сеансів та облікових даних.
    - **Каталоги сеансів відсутні**: `sessions/` і каталог сховища сеансів потрібні для збереження історії та уникнення аварій `ENOENT`.
    - **Невідповідність стенограм**: попереджає, коли в нещодавніх записах сеансів бракує файлів стенограм.
    - **Основний сеанс "1-line JSONL"**: позначає випадки, коли основна стенограма має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли в різних домашніх каталогах існує кілька папок `~/.openclaw` або коли `OPENCLAW_STATE_DIR` вказує деінде (історія може розділитися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запустити його на віддаленому хості (стан зберігається там).
    - **Дозволи файла конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує посилити дозволи до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделей (закінчення OAuth)">
    Doctor перевіряє OAuth-профілі у сховищі автентифікації, попереджає, коли токени скоро закінчаться або вже закінчилися, і може оновити їх, коли це безпечно. Якщо OAuth/токен-профіль Anthropic застарів, він пропонує API-ключ Anthropic або шлях із setup-token Anthropic. Запити на оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад `refresh_token_reused`, `invalid_grant` або провайдер вимагає ввійти знову), doctor повідомляє, що потрібна повторна автентифікація, і друкує точну команду `openclaw models auth login --provider ...`, яку слід виконати.

    Doctor також повідомляє про профілі автентифікації, тимчасово непридатні через:

    - короткі періоди очікування (обмеження частоти/тайм-аути/помилки автентифікації)
    - довші вимкнення (помилки білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Перевірка моделі hooks">
    Якщо встановлено `hooks.gmail.model`, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли воно не розв’яжеться або заборонене.
  </Accordion>
  <Accordion title="7. Відновлення образу пісочниці">
    Коли пісочницю ввімкнено, doctor перевіряє образи Docker і пропонує зібрати їх або перемкнутися на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Очищення встановлення Plugin">
    Doctor видаляє застарілий проміжний стан залежностей Plugin, згенерований OpenClaw, у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Це охоплює застарілі згенеровані корені залежностей, старі каталоги етапу встановлення та локальне для пакета сміття від попереднього коду відновлення залежностей bundled-plugin.

    Doctor також може перевстановити налаштовані завантажувані plugins, коли конфігурація посилається на них, але локальний реєстр plugins не може їх знайти. Для externalization bundled-plugin 2026.5.2 doctor автоматично встановлює завантажувані plugins, які вже використовує наявна конфігурація, а потім покладається на `meta.lastTouchedVersion`, щоб виконати цей релізний прохід лише один раз. Запуск Gateway і перезавантаження конфігурації не запускають менеджери пакетів; встановлення plugins лишається явною роботою doctor/install/update.

  </Accordion>
  <Accordion title="8. Міграції служби Gateway і підказки з очищення">
    Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити службу OpenClaw з використанням поточного порту gateway. Він також може сканувати додаткові служби, схожі на gateway, і друкувати підказки з очищення. Служби OpenClaw gateway з назвами профілів вважаються повноцінними й не позначаються як "extra."

    У Linux, якщо служба gateway рівня користувача відсутня, але існує служба OpenClaw gateway системного рівня, doctor не встановлює другу службу рівня користувача автоматично. Перевірте через `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або встановіть `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли системний supervisor керує життєвим циклом gateway.

  </Accordion>
  <Accordion title="8b. Міграція Startup Matrix">
    Коли обліковий запис каналу Matrix має очікувану або придатну до дії міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім виконує best-effort кроки міграції: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки журналюються, а запуск продовжується. У режимі лише читання (`openclaw doctor` без `--fix`) цю перевірку повністю пропущено.
  </Accordion>
  <Accordion title="8c. Сполучення пристроїв і дрейф автентифікації">
    Doctor тепер перевіряє стан сполучення пристроїв як частину звичайного проходу перевірки здоров’я.

    Що він повідомляє:

    - очікувані запити першого сполучення
    - очікувані підвищення ролі для вже сполучених пристроїв
    - очікувані підвищення scope для вже сполучених пристроїв
    - відновлення невідповідності публічного ключа, коли id пристрою все ще збігається, але ідентичність пристрою більше не збігається зі схваленим записом
    - сполучені записи, у яких немає активного токена для схваленої ролі
    - сполучені токени, чиї scopes відхилилися за межі схваленої базової лінії сполучення
    - локальні кешовані записи device-token для поточної машини, що передують ротації токена на боці gateway або мають застарілі метадані scope

    Doctor не схвалює запити сполучення автоматично і не виконує автоматичну ротацію токенів пристроїв. Натомість він друкує точні наступні кроки:

    - переглянути очікувані запити за допомогою `openclaw devices list`
    - схвалити точний запит за допомогою `openclaw devices approve <requestId>`
    - ротувати свіжий токен за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видалити та повторно схвалити застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину "already paired but still getting pairing required": doctor тепер відрізняє перше сполучення від очікуваних підвищень ролі/scope і від дрейфу застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли провайдер відкритий для DM без allowlist або коли політика налаштована небезпечним чином.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запущено як користувацьку службу systemd, doctor забезпечує ввімкнення lingering, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан робочої області (skills, plugins і застарілі каталоги)">
    Doctor друкує підсумок стану робочої області для стандартного агента:

    - **Стан Skills**: рахує придатні skills, skills з відсутніми вимогами та skills, заблоковані allowlist.
    - **Застарілі каталоги робочої області**: попереджає, коли `~/openclaw` або інші застарілі каталоги робочої області існують поруч із поточною робочою областю.
    - **Стан Plugin**: рахує ввімкнені/вимкнені/помилкові plugins; перелічує ID plugins для будь-яких помилок; повідомляє можливості bundle plugin.
    - **Попередження сумісності Plugin**: позначає plugins, що мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки під час завантаження, виведені реєстром plugins.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файла">
    Doctor перевіряє, чи bootstrap-файли робочої області (наприклад `AGENTS.md`, `CLAUDE.md` або інші інжектовані контекстні файли) наближаються до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файла сирі та інжектовані кількості символів, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість інжектованих символів як частку загального бюджету. Коли файли обрізані або близькі до ліміту, doctor друкує поради з налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілого Plugin каналу">
    Коли `openclaw doctor --fix` видаляє відсутній Plugin каналу, він також видаляє dangling конфігурацію в scope каналу, що посилалася на цей Plugin: записи `channels.<id>`, цілі heartbeat, що називали канал, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає циклам завантаження Gateway, коли runtime каналу зник, але конфігурація все ще просить gateway прив’язатися до нього.
  </Accordion>
  <Accordion title="11c. Автодоповнення оболонки">
    Doctor перевіряє, чи встановлено автодоповнення клавішею Tab для поточної оболонки (zsh, bash, fish або PowerShell):

    - Якщо профіль оболонки використовує повільний динамічний шаблон автодоповнення (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо автодоповнення налаштовано в профілі, але файл кешу відсутній, doctor автоматично регенерує кеш.
    - Якщо автодоповнення взагалі не налаштовано, doctor пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність автентифікації токена локального gateway.

    - Якщо режим токена потребує токена, а джерела токена немає, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає і не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано SecretRef токена.

  </Accordion>
  <Accordion title="12b. SecretRef-aware відновлення лише для читання">
    Деяким потокам відновлення потрібно перевіряти налаштовані облікові дані, не послаблюючи fail-fast поведінку runtime.

    - `openclaw doctor --fix` тепер використовує ту саму модель read-only підсумку SecretRef, що й команди сімейства status, для цільових відновлень конфігурації.
    - Приклад: відновлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані бота, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає автоматичне розв’язання замість аварійного завершення або помилкового повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Перевірка стану Gateway + перезапуск">
    Doctor виконує перевірку стану й пропонує перезапустити gateway, коли він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку пам’яті">
    Doctor перевіряє, чи налаштований постачальник embedding для пошуку пам’яті готовий для агента за замовчуванням. Поведінка залежить від налаштованого бекенда й постачальника:

    - **Бекенд QMD**: перевіряє, чи доступний і придатний до запуску бінарний файл `qmd`. Якщо ні, виводить підказки щодо виправлення, зокрема npm-пакет і варіант ручного шляху до бінарного файла.
    - **Явний локальний постачальник**: перевіряє наявність локального файла моделі або розпізнаної віддаленої/завантажуваної URL-адреси моделі. Якщо її немає, пропонує перейти на віддаленого постачальника.
    - **Явний віддалений постачальник** (`openai`, `voyage` тощо): перевіряє наявність API-ключа в середовищі або сховищі автентифікації. Якщо його немає, виводить практичні підказки щодо виправлення.
    - **Автоматичний постачальник**: спочатку перевіряє доступність локальної моделі, а потім пробує кожного віддаленого постачальника в порядку автоматичного вибору.

    Коли доступний кешований результат проби gateway (gateway був справним на момент перевірки), doctor зіставляє його результат із конфігурацією, видимою для CLI, і зазначає будь-яку невідповідність. Doctor не запускає новий embedding ping у стандартному шляху; використовуйте команду глибокого статусу пам’яті, коли потрібна жива перевірка постачальника.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding під час виконання.

  </Accordion>
  <Accordion title="14. Попередження про статус каналу">
    Якщо gateway справний, doctor запускає пробу статусу каналу й повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит і відновлення конфігурації супервізора">
    Doctor перевіряє встановлену конфігурацію супервізора (launchd/systemd/schtasks) на відсутні або застарілі стандартні значення (наприклад, залежності systemd від network-online і затримку перезапуску). Коли він знаходить невідповідність, рекомендує оновлення й може переписати файл служби/завдання до поточних стандартних значень.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації супервізора.
    - `openclaw doctor --yes` приймає стандартні запити на відновлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації супервізора.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише читання для життєвого циклу служби gateway. Він усе ще повідомляє про стан служби й виконує відновлення, не пов’язані зі службою, але пропускає install/start/restart/bootstrap служби, переписування конфігурації супервізора й очищення застарілих служб, оскільки цим життєвим циклом керує зовнішній супервізор.
    - На Linux doctor не переписує метадані команди/entrypoint, доки відповідний systemd-unit gateway активний. Він також ігнорує неактивні не застарілі додаткові unit-и, схожі на gateway, під час сканування дублікатів служб, щоб супутні файли служб не створювали зайвого шуму очищення.
    - Якщо автентифікація токеном вимагає токен і `gateway.auth.token` керується через SecretRef, встановлення/відновлення служби doctor перевіряє SecretRef, але не зберігає розв’язані значення токена відкритим текстом у метадані середовища служби супервізора.
    - Doctor виявляє керовані значення середовища служби на основі `.env`/SecretRef, які старіші інсталяції LaunchAgent, systemd або Windows Scheduled Task вбудували inline, і переписує метадані служби так, щоб ці значення завантажувалися з runtime-джерела, а не з визначення супервізора.
    - Doctor виявляє, коли команда служби досі фіксує старий `--port` після зміни `gateway.port`, і переписує метадані служби на поточний порт.
    - Якщо автентифікація токеном вимагає токен, а налаштований SecretRef токена не розв’язується, doctor блокує шлях встановлення/відновлення з практичними інструкціями.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/відновлення, доки режим не буде задано явно.
    - Для Linux user-systemd unit-ів перевірки розбіжності токенів doctor тепер охоплюють джерела `Environment=` і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Відновлення служби doctor відмовляються переписувати, зупиняти або перезапускати службу gateway зі старішого бінарного файла OpenClaw, коли конфігурацію востаннє було записано новішою версією. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway і порту">
    Doctor перевіряє runtime служби (PID, останній статус виходу) і попереджає, коли службу встановлено, але вона фактично не працює. Він також перевіряє конфлікти портів на порту gateway (стандартно `18789`) і повідомляє ймовірні причини (gateway уже працює, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли служба gateway працює на Bun або шляху Node, керованому менеджером версій (`nvm`, `fnm`, `volta`, `asdf` тощо). Каналам WhatsApp + Telegram потрібен Node, а шляхи менеджера версій можуть ламатися після оновлень, оскільки служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує мігрувати на системну інсталяцію Node, коли вона доступна (Homebrew/apt/choco).

    Нововстановлені або відновлені macOS LaunchAgents використовують канонічний системний PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) замість копіювання PATH інтерактивної оболонки, тому каталоги Volta, asdf, fnm, pnpm та інших менеджерів версій не змінюють, який Node розв’язують дочірні процеси. Служби Linux і надалі зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні користувацькі bin-каталоги, але припущені fallback-каталоги менеджерів версій записуються до PATH служби лише тоді, коли ці каталоги існують на диску.

  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає всі зміни конфігурації та ставить мітку метаданих майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервна копія + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, коли її немає, і виводить пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace) для повного посібника зі структури робочого простору й резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
