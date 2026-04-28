---
read_when:
    - Додавання або змінення міграцій doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки справності, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-04-28T11:11:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347ce9a2f87632292319aa740389dca8763bd26dd398fb0edeb5b70cc16b949a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент відновлення та міграції для OpenClaw. Він виправляє застарілі конфігурацію/стан, перевіряє справність і надає практичні кроки для відновлення.

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

    Прийняти значення за замовчуванням без запитів (зокрема кроки перезапуску/сервісу/відновлення sandbox, коли застосовно).

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

    Також застосувати агресивні виправлення (перезаписує власні конфіги supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запустити без запитів і застосувати лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії перезапуску/сервісу/sandbox, які потребують підтвердження людини. Міграції застарілого стану запускаються автоматично, коли їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканувати системні сервіси на наявність додаткових установок Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо хочете переглянути зміни перед записом, спочатку відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (коротко)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Необов’язкове попереднє оновлення для git-установок (лише інтерактивно).
    - Перевірка актуальності UI-протоколу (перезбирає Control UI, коли схема протоколу новіша).
    - Перевірка справності + запит на перезапуск.
    - Зведення стану Skills (доступні/відсутні/заблоковані) і стан Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих пласких полів `talk.*` до `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігів розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення Codex OAuth (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Міграція застарілого стану на диску (sessions/agent dir/авторизація WhatsApp).
    - Міграція застарілих ключів контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, `provider` у payload, прості резервні webhook-завдання `notify: true`).
    - Міграція застарілої runtime-політики агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли plugins увімкнені; коли `plugins.enabled=false`, застарілі посилання на Plugin вважаються інертною containment-конфігурацією і зберігаються.

  </Accordion>
  <Accordion title="State and integrity">
    - Перевірка lock-файлів сесій і очищення застарілих lock-файлів.
    - Відновлення транскриптів сесій для дубльованих гілок переписування prompt, створених ураженими збірками 2026.4.24.
    - Перевірки цілісності стану та дозволів (sessions, transcripts, state dir).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Справність автентифікації моделей: перевіряє завершення строку дії OAuth, може оновлювати токени, строк дії яких спливає, і повідомляє про cooldown/disabled-стани auth-profile.
    - Виявлення додаткового каталогу workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Відновлення образу sandbox, коли sandboxing увімкнено.
    - Міграція застарілого сервісу та виявлення додаткових Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Runtime-перевірки Gateway (сервіс установлено, але він не запущений; кешована мітка launchd).
    - Попередження стану каналу (перевіряються з запущеного Gateway).
    - Аудит конфігурації supervisor (launchd/systemd/schtasks) з необов’язковим відновленням.
    - Очищення середовища вбудованого proxy для сервісів Gateway, які захопили shell-значення `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи version-manager).
    - Діагностика конфліктів порту Gateway (за замовчуванням `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли джерела токена немає; не перезаписує конфіги token SecretRef).
    - Виявлення проблем pairing пристрою (очікувані первинні запити на pairing, очікувані оновлення ролі/обсягу, застарілий drift локального кешу device-token і auth drift paired-record).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу workspace (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка стану shell completion і автоінсталяція/оновлення.
    - Перевірка готовності embedding-провайдера пошуку пам’яті (локальна модель, ключ remote API або QMD-бінарник).
    - Перевірки source-установки (невідповідність pnpm workspace, відсутні UI-ресурси, відсутній бінарник tsx).
    - Записує оновлену конфігурацію + metadata майстра.

  </Accordion>
</AccordionGroup>

## Backfill і reset Dreams UI

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для workflow grounded dreaming. Ці дії використовують RPC-методи gateway у стилі doctor, але вони **не** є частиною CLI-відновлення/міграції `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному workspace, запускає grounded REM diary pass і записує оборотні backfill-записи в `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише позначені backfill diary entries.
- **Clear Grounded** видаляє лише staged grounded-only короткострокові записи, які походять з історичного replay і ще не накопичили live recall або daily support.

Чого вони самі **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не додають автоматично grounded candidates до live short-term promotion store, якщо ви спочатку явно не запустите staged CLI path

Якщо хочете, щоб grounded historical replay впливав на звичайний deep promotion lane, натомість використайте CLI-потік:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це додає grounded durable candidates до short-term dreaming store, залишаючи `DREAMS.md` поверхнею для перегляду.

## Детальна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Якщо це git checkout і doctor працює інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без channel-specific override), doctor нормалізує їх до поточної схеми.

    Це включає застарілі пласкі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у provider map.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися і просять вас виконати `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час старту, коли виявляє застарілий формат конфігурації, тож застарілі конфіги відновлюються без ручного втручання. Міграції сховища cron-завдань обробляються командою `openclaw doctor --fix`.

    Поточні міграції:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → top-level `bindings`
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
    - Для каналів із названими `accounts`, але залишковими top-level channel values для одного акаунта, перемістити ці account-scoped values у promoted account, вибраний для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну matching named/default ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видалити `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для таймаутів повільного провайдера/моделі
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видалити `browser.relayBindHost` (застаріле налаштування extension relay)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (startup Gateway також пропускає провайдерів, у яких `api` встановлено на майбутнє або невідоме enum-значення, замість fail closed)

    Попередження doctor також містять рекомендації account-default для multi-account каналів:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що fallback routing може вибрати неочікуваний акаунт.
    - Якщо `channels.<channel>.defaultAccount` встановлено на невідомий account ID, doctor попереджає і перелічує налаштовані account IDs.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі до неправильного API або обнулити вартість. Doctor попереджає, щоб ви могли прибрати перевизначення й відновити маршрутизацію API та вартість для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера та готовність Chrome MCP">
    Якщо конфігурація браузера все ще вказує на видалений шлях розширення Chrome, doctor нормалізує її до поточної моделі підключення Chrome MCP локально на хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє локальний на хості шлях Chrome MCP, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для стандартних профілів автоматичного підключення
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці інспектування браузера (наприклад, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути для вас налаштування на боці Chrome. Локальний на хості Chrome MCP усе ще потребує:

    - браузера на основі Chromium версії 144+ на хості gateway/node
    - локально запущеного браузера
    - увімкненого віддаленого налагодження в цьому браузері
    - підтвердження першого запиту згоди на підключення в браузері

    Готовність тут стосується лише локальних передумов підключення. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, усе ще потребують керованого браузера або сирого профілю CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser чи інших headless-потоків. Вони й надалі використовують сирий CDP.

  </Accordion>
  <Accordion title="2d. Передумови TLS для OAuth">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor перевіряє кінцеву точку авторизації OpenAI, щоб переконатися, що локальний стек TLS Node/OpenSSL може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, протермінований сертифікат або самопідписаний сертифікат), doctor виводить інструкції з виправлення для конкретної платформи. На macOS із Homebrew Node виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка виконується навіть тоді, коли gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо раніше ви додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть затіняти вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі налаштування транспорту поруч із Codex OAuth, щоб ви могли прибрати або переписати застаріле перевизначення транспорту й повернути вбудовану маршрутизацію та резервну поведінку. Користувацькі проксі та перевизначення лише заголовків досі підтримуються й не спричиняють це попередження.
  </Accordion>
  <Accordion title="2f. Попередження маршрутів Plugin Codex">
    Коли ввімкнено вбудований Plugin Codex, doctor також перевіряє, чи основні посилання на моделі `openai-codex/*` усе ще розв’язуються через стандартний runner PI. Така комбінація коректна, коли вам потрібна автентифікація Codex OAuth/підписки через PI, але її легко сплутати з нативним app-server harness Codex. Doctor попереджає та вказує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, бо обидва маршрути коректні:

    - `openai-codex/*` + PI означає «використовувати автентифікацію Codex OAuth/підписки через звичайний runner OpenClaw».
    - `openai/*` + `runtime: "codex"` означає «запустити вбудований turn через нативний app-server Codex».
    - `/codex ...` означає «керувати нативною розмовою Codex із чату або прив’язати її».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

    Якщо з’являється попередження, виберіть потрібний маршрут і вручну відредагуйте конфігурацію. Залиште попередження без змін, коли PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (структура диска)">
    Doctor може мігрувати старіші структури на диску до поточної структури:

    - Сховище сеансів + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - зі застарілого `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ідентифікатор облікового запису: `default`)

    Ці міграції виконуються за принципом максимально можливих зусиль і є ідемпотентними; doctor видаватиме попередження, коли залишає застарілі каталоги як резервні копії. Gateway/CLI також автоматично мігрує застарілі сеанси + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапляли в шлях для окремого агента без ручного запуску doctor. Автентифікацію WhatsApp навмисно мігрує лише `openclaw doctor`. Нормалізація постачальника розмов/мапи постачальників тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не запускають повторні бездіяльні зміни `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів Plugin">
    Doctor сканує всі встановлені маніфести Plugin на наявність застарілих ключів можливостей верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли їх знайдено, він пропонує перемістити їх до об’єкта `contracts` і переписати файл маніфесту на місці. Ця міграція є ідемпотентною; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища cron">
    Doctor також перевіряє сховище завдань cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, якщо перевизначено) на наявність старих форм завдань, які планувальник досі приймає для сумісності.

    Поточні очищення cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми delivery для `provider` у payload → явний `delivery.channel`
    - прості застарілі резервні завдання webhook з `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий резервний notify з наявним режимом delivery, що не є webhook, doctor попереджає й залишає це завдання для ручної перевірки.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сеансів">
    Doctor сканує кожен каталог сеансів агента на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сеансу. Для кожного знайденого файлу блокування він повідомляє: шлях, PID, чи PID досі активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше друкує примітку й вказує повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілки транскрипту сеансу">
    Doctor сканує JSONL-файли сеансів агента на дубльовану форму гілки, створену помилкою перезапису транскрипту запиту 2026.4.24: покинутий користувацький хід із внутрішнім runtime-контекстом OpenClaw плюс активний сусідній хід, що містить той самий видимий користувацький запит. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файлу поруч з оригіналом і переписує транскрипт до активної гілки, щоб історія Gateway і зчитувачі пам’яті більше не бачили дубльовані ходи.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сеансів, маршрутизація та безпека)">
    Каталог стану — це операційний стовбур. Якщо він зникне, ви втратите сеанси, облікові дані, журнали та конфігурацію (якщо не маєте резервних копій деінде).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і видає підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Каталог стану macOS із хмарною синхронізацією**: попереджає, коли стан визначається під iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, оскільки шляхи з синхронізацією можуть спричиняти повільніший I/O та перегони блокування/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан визначається на джерелі монтування `mmcblk*`, оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношуватися під час записів сеансів і облікових даних.
    - **Каталоги сеансів відсутні**: `sessions/` і каталог сховища сеансів потрібні для збереження історії та уникнення збоїв `ENOENT`.
    - **Невідповідність транскриптів**: попереджає, коли в нещодавніх записах сеансів бракує файлів транскриптів.
    - **Основний сеанс "1-line JSONL"**: позначає випадок, коли основний транскрипт має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли в різних домашніх каталогах існує кілька папок `~/.openclaw` або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділитися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запустити його на віддаленому хості (стан зберігається там).
    - **Дозволи файлу конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує посилити дозволи до `600`.

  </Accordion>
  <Accordion title="5. Справність автентифікації моделей (завершення терміну OAuth)">
    Doctor перевіряє профілі OAuth у сховищі автентифікації, попереджає, коли термін дії токенів завершується/завершився, і може оновити їх, коли це безпечно. Якщо профіль Anthropic OAuth/токена застарів, він пропонує ключ Anthropic API або шлях setup-token Anthropic. Запити на оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад, `refresh_token_reused`, `invalid_grant` або постачальник повідомляє, що потрібно ввійти знову), doctor повідомляє, що потрібна повторна автентифікація, і друкує точну команду `openclaw models auth login --provider ...`, яку слід виконати.

    Doctor також повідомляє про профілі автентифікації, які тимчасово непридатні через:

    - короткі періоди очікування (обмеження швидкості/тайм-аути/збої автентифікації)
    - довші вимкнення (збої білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Перевірка моделі hooks">
    Якщо `hooks.gmail.model` задано, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли його не вдасться розв’язати або воно заборонене.
  </Accordion>
  <Accordion title="7. Відновлення образу sandbox">
    Коли sandboxing увімкнено, doctor перевіряє Docker-образи та пропонує зібрати або перемкнутися на застарілі назви, якщо поточного образу бракує.
  </Accordion>
  <Accordion title="7b. Runtime-залежності bundled plugins">
    Doctor перевіряє runtime-залежності лише для bundled plugins, які активні в поточній конфігурації або ввімкнені за замовчуванням у їхньому bundled manifest, наприклад `plugins.entries.discord.enabled: true`, застарілий `channels.discord.enabled: true` або default-enabled bundled provider. Якщо якихось бракує, doctor повідомляє про пакети та встановлює їх у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Зовнішні plugins усе ще використовують `openclaw plugins install` / `openclaw plugins update`; doctor не встановлює залежності для довільних шляхів plugin.

    Під час виправлення doctor інсталяції npm для вбудованих runtime-залежностей показують прогрес spinner у TTY-сеансах і періодичний рядковий прогрес у piped/headless виводі. Gateway і локальний CLI також можуть на вимогу виправляти runtime-залежності активних вбудованих plugin перед імпортом вбудованого plugin. Ці інсталяції обмежені коренем інсталяції runtime plugin, виконуються з вимкненими scripts, не записують package lock і захищені блокуванням install-root, щоб одночасні запуски CLI або Gateway не змінювали те саме дерево `node_modules` одночасно.

  </Accordion>
  <Accordion title="8. Міграції служби Gateway і підказки з очищення">
    Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити службу OpenClaw, використовуючи поточний порт gateway. Він також може сканувати додаткові gateway-подібні служби й виводити підказки з очищення. Gateway-служби OpenClaw з іменами профілів вважаються повноцінними й не позначаються як "extra."

    У Linux, якщо gateway-служба рівня користувача відсутня, але існує системна gateway-служба OpenClaw, doctor не встановлює другу службу рівня користувача автоматично. Перевірте за допомогою `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли системний supervisor керує життєвим циклом gateway.

  </Accordion>
  <Accordion title="8b. Міграція Startup Matrix">
    Коли обліковий запис каналу Matrix має pending або actionable міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім запускає best-effort кроки міграції: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки журналюються, а запуск продовжується. У режимі лише читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Спарювання пристроїв і дрейф автентифікації">
    Doctor тепер перевіряє стан спарювання пристроїв як частину звичайного проходу перевірки справності.

    Що він повідомляє:

    - pending запити першого спарювання
    - pending підвищення ролі для вже спарених пристроїв
    - pending розширення scope для вже спарених пристроїв
    - виправлення невідповідності публічного ключа, коли id пристрою все ще збігається, але ідентичність пристрою більше не відповідає затвердженому запису
    - спарені записи без активного токена для затвердженої ролі
    - спарені токени, чиї scopes відхилилися від затвердженої базової лінії спарювання
    - локальні кешовані записи device-token для поточної машини, що передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не схвалює запити спарювання автоматично й не ротує device tokens автоматично. Натомість він виводить точні наступні кроки:

    - перегляньте pending запити за допомогою `openclaw devices list`
    - схваліть точний запит за допомогою `openclaw devices approve <requestId>`
    - згенеруйте свіжий токен ротацією за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видаліть і повторно схваліть застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину "already paired but still getting pairing required": doctor тепер відрізняє перше спарювання від pending підвищень ролі/scope та від дрейфу застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor видає попередження, коли provider відкритий для DM без allowlist або коли policy налаштовано небезпечним способом.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запуск відбувається як служба користувача systemd, doctor гарантує, що lingering увімкнено, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан workspace (skills, plugins і застарілі каталоги)">
    Doctor виводить підсумок стану workspace для agent за замовчуванням:

    - **Стан Skills**: рахує eligible, missing-requirements і allowlist-blocked skills.
    - **Застарілі каталоги workspace**: попереджає, коли `~/openclaw` або інші застарілі каталоги workspace існують поруч із поточним workspace.
    - **Стан Plugin**: рахує enabled/disabled/errored plugins; перелічує plugin IDs для будь-яких помилок; повідомляє можливості bundled plugin.
    - **Попередження сумісності Plugin**: позначає plugins, які мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки під час завантаження, видані registry plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Doctor перевіряє, чи bootstrap-файли workspace (наприклад, `AGENTS.md`, `CLAUDE.md` або інші injected context files) наближаються до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файлу raw vs. injected кількість символів, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість injected символів як частку загального бюджету. Коли файли обрізані або близькі до ліміту, doctor виводить поради щодо налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілих channel plugin">
    Коли `openclaw doctor --fix` видаляє відсутній channel plugin, він також видаляє dangling channel-scoped config, який посилався на цей plugin: записи `channels.<id>`, heartbeat targets, що називали channel, і overrides `agents.*.models["<channel>/*"]`. Це запобігає boot loops Gateway, коли channel runtime зник, але config усе ще просить gateway прив’язатися до нього.
  </Accordion>
  <Accordion title="11c. Автодоповнення shell">
    Doctor перевіряє, чи встановлено tab completion для поточного shell (zsh, bash, fish або PowerShell):

    - Якщо профіль shell використовує повільний динамічний шаблон completion (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо completion налаштовано в профілі, але cache file відсутній, doctor автоматично регенерує cache.
    - Якщо completion взагалі не налаштовано, doctor пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати cache вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність автентифікації локального gateway token.

    - Якщо token mode потребує token і не існує джерела token, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає й не перезаписує його plaintext.
    - `openclaw doctor --generate-gateway-token` примусово генерує лише тоді, коли не налаштовано token SecretRef.

  </Accordion>
  <Accordion title="12b. SecretRef-aware виправлення лише для читання">
    Деякі repair flows мають перевіряти налаштовані credentials без послаблення runtime fail-fast поведінки.

    - `openclaw doctor --fix` тепер використовує ту саму read-only модель summary SecretRef, що й status-family commands, для targeted config repairs.
    - Приклад: виправлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані credentials bot, коли вони доступні.
    - Якщо Telegram bot token налаштовано через SecretRef, але він недоступний у поточному command path, doctor повідомляє, що credential налаштований, але недоступний, і пропускає авто-розв’язання замість аварійного завершення або помилкового повідомлення, що token відсутній.

  </Accordion>
  <Accordion title="13. Перевірка справності Gateway + перезапуск">
    Doctor запускає health check і пропонує перезапустити gateway, коли він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку пам’яті">
    Doctor перевіряє, чи налаштований provider embedding для пошуку пам’яті готовий для agent за замовчуванням. Поведінка залежить від налаштованого backend і provider:

    - **QMD backend**: перевіряє, чи binary `qmd` доступний і може запускатися. Якщо ні, виводить guidance з виправлення, включно з npm package і опцією manual binary path.
    - **Явний local provider**: перевіряє наявність локального model file або розпізнаного remote/downloadable model URL. Якщо відсутній, пропонує перейти на remote provider.
    - **Явний remote provider** (`openai`, `voyage` тощо): перевіряє, чи API key присутній в environment або auth store. Виводить actionable fix hints, якщо відсутній.
    - **Auto provider**: спочатку перевіряє доступність local model, потім пробує кожен remote provider у порядку auto-selection.

    Коли доступний cached gateway probe result (gateway був здоровим на момент перевірки), doctor зіставляє його результат із CLI-visible config і відзначає будь-яку розбіжність. Doctor не запускає свіжий embedding ping у default path; використовуйте команду deep memory status, коли потрібна live provider check.

    Використайте `openclaw memory status --deep`, щоб перевірити готовність embedding у runtime.

  </Accordion>
  <Accordion title="14. Попередження стану channel">
    Якщо gateway справний, doctor запускає channel status probe і повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит і виправлення config supervisor">
    Doctor перевіряє встановлений config supervisor (launchd/systemd/schtasks) на відсутні або застарілі defaults (наприклад, залежності systemd network-online і restart delay). Коли він знаходить невідповідність, він рекомендує оновлення й може переписати service file/task до поточних defaults.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням config supervisor.
    - `openclaw doctor --yes` приймає default repair prompts.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без prompts.
    - `openclaw doctor --repair --force` перезаписує custom supervisor configs.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі read-only для життєвого циклу gateway service. Він усе ще повідомляє service health і виконує non-service repairs, але пропускає service install/start/restart/bootstrap, переписування supervisor config і cleanup legacy service, тому що external supervisor керує цим lifecycle.
    - У Linux doctor не переписує command/entrypoint metadata, доки відповідний systemd gateway unit активний. Він також ігнорує inactive non-legacy extra gateway-like units під час сканування duplicate-service, щоб companion service files не створювали cleanup noise.
    - Якщо token auth потребує token і `gateway.auth.token` керується SecretRef, doctor service install/repair перевіряє SecretRef, але не зберігає resolved plaintext token values у metadata environment supervisor service.
    - Doctor виявляє managed `.env`/SecretRef-backed service environment values, які старіші інсталяції LaunchAgent, systemd або Windows Scheduled Task вбудували inline, і переписує service metadata так, щоб ці values завантажувалися з runtime source замість supervisor definition.
    - Doctor виявляє, коли service command усе ще фіксує старий `--port` після зміни `gateway.port`, і переписує service metadata на поточний port.
    - Якщо token auth потребує token і налаштований token SecretRef unresolved, doctor блокує install/repair path з actionable guidance.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує install/repair, доки mode не буде задано явно.
    - Для Linux user-systemd units перевірки doctor щодо token drift тепер включають джерела і `Environment=`, і `EnvironmentFile=` під час порівняння service auth metadata.
    - Doctor service repairs відмовляються переписувати, зупиняти або перезапускати gateway service зі старішого binary OpenClaw, коли config востаннє був записаний новішою версією. Див. [усунення неполадок Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Середовище виконання Gateway + діагностика портів">
    Діагностика перевіряє середовище виконання сервісу (PID, останній статус завершення) і попереджає, коли сервіс встановлено, але він фактично не працює. Вона також перевіряє конфлікти портів на порту шлюзу (типово `18789`) і повідомляє ймовірні причини (шлюз уже запущено, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики середовища виконання Gateway">
    Діагностика попереджає, коли сервіс шлюзу працює на Bun або через шлях Node, керований менеджером версій (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджера версій можуть ламатися після оновлень, бо сервіс не завантажує ініціалізацію вашої оболонки. Діагностика пропонує перейти на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нововстановлені або відновлені сервіси зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні користувацькі каталоги бінарних файлів, але вгадані резервні каталоги менеджера версій записуються до service PATH лише тоді, коли ці каталоги існують на диску. Завдяки цьому згенерований supervisor PATH узгоджується з тим самим аудитом мінімального PATH, який діагностика запускає пізніше.

  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Діагностика зберігає всі зміни конфігурації та проставляє метадані майстра, щоб зафіксувати запуск діагностики.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервна копія + система памʼяті)">
    Діагностика пропонує систему памʼяті робочого простору, якщо її немає, і виводить пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під керуванням git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури робочого простору та резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
