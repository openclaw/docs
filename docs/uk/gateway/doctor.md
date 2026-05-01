---
read_when:
    - Додавання або змінення міграцій doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки справності, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-01T07:53:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 928f6854d5721e468e5edc01420fc911652f706ef24e47e8d47461bbe8998214
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент ремонту + міграції для OpenClaw. Він виправляє застарілі конфігурацію/стан, перевіряє працездатність і надає придатні до виконання кроки ремонту.

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

    Приймати типові значення без запитів (включно з кроками ремонту перезапуску/сервісу/пісочниці, коли застосовно).

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

    Також застосувати агресивні ремонти (перезаписує користувацькі конфігурації supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запускати без запитів і застосовувати лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії з перезапуском/сервісом/пісочницею, які потребують підтвердження людини. Міграції застарілого стану запускаються автоматично після виявлення.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканувати системні сервіси на наявність додаткових інсталяцій gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спершу відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (зведення)

<AccordionGroup>
  <Accordion title="Стан, інтерфейс і оновлення">
    - Необов’язкове попереднє оновлення для git-інсталяцій (лише інтерактивно).
    - Перевірка актуальності протоколу інтерфейсу (перебудовує Control UI, коли схема протоколу новіша).
    - Перевірка працездатності + запит на перезапуск.
    - Зведення стану Skills (придатні/відсутні/заблоковані) і стан Plugin.

  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих пласких полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення OAuth Codex (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Попередження про allowlist Plugin/інструментів, коли `plugins.allow` обмежувальний, але політика інструментів усе ще запитує wildcard або інструменти, що належать Plugin.
    - Міграція застарілого стану на диску (sessions/agent dir/WhatsApp auth).
    - Міграція застарілих ключів контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, payload `provider`, прості fallback-завдання webhook `notify: true`).
    - Міграція застарілої runtime-policy агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли plugins увімкнені; коли `plugins.enabled=false`, застарілі посилання Plugin вважаються інертною containment-конфігурацією та зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файлів блокування сесій і очищення застарілих блокувань.
    - Ремонт транскриптів сесій для дубльованих гілок prompt-rewrite, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для restart-recovery завислих субагентів, з підтримкою `--fix` для очищення застарілих прапорців перерваного відновлення, щоб під час запуску дочірній елемент не продовжував вважатися restart-aborted.
    - Перевірки цілісності стану та дозволів (sessions, transcripts, state dir).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Стан автентифікації моделі: перевіряє завершення терміну дії OAuth, може оновлювати токени, термін дії яких спливає, і повідомляє про стани cooldown/disabled auth-profile.
    - Виявлення додаткового каталогу workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, сервіси та supervisors">
    - Ремонт образу пісочниці, коли sandboxing увімкнено.
    - Міграція застарілого сервісу та виявлення додаткового gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Runtime-перевірки Gateway (сервіс інстальовано, але він не запущений; кешована мітка launchd).
    - Попередження про стан каналу (перевіряються з запущеного gateway).
    - Аудит конфігурації supervisor (launchd/systemd/schtasks) з необов’язковим ремонтом.
    - Очищення середовища вбудованого проксі для сервісів gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час інсталяції або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи version-manager).
    - Діагностика конфлікту портів gateway (типовий `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та pairing">
    - Попередження безпеки для відкритих DM-політик.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли джерела токена немає; не перезаписує конфігурації SecretRef токена).
    - Виявлення проблем із pairing пристрою (очікувані перші запити pairing, очікувані підвищення ролі/області, застарілий дрейф кешу локального device-token і дрейф автентифікації paired-record).

  </Accordion>
  <Accordion title="Workspace і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру файлу bootstrap workspace (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка стану shell completion і автоматична інсталяція/оновлення.
    - Перевірка готовності провайдера embedding для пошуку пам’яті (локальна модель, ключ віддаленого API або бінарний файл QMD).
    - Перевірки source-інсталяції (невідповідність pnpm workspace, відсутні UI assets, відсутній бінарний файл tsx).
    - Записує оновлену конфігурацію + метадані wizard.

  </Accordion>
</AccordionGroup>

## Зворотне заповнення та скидання в інтерфейсі Dreams

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для робочого процесу grounded dreaming. Ці дії використовують RPC-методи в стилі gateway doctor, але вони **не** є частиною ремонту/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному workspace, запускає grounded REM diary pass і записує оборотні записи backfill у `DREAMS.md`.
- **Reset** видаляє лише ці позначені backfill diary entries з `DREAMS.md`.
- **Clear Grounded** видаляє лише staged grounded-only short-term entries, які походять з історичного replay і ще не накопичили live recall або daily support.

Що вони **не** роблять самі по собі:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не виконують автоматичний stage grounded candidates у live short-term promotion store, якщо ви явно спершу не запустите staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайну deep promotion lane, натомість використовуйте CLI flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це виконує stage grounded durable candidates у short-term dreaming store, водночас залишаючи `DREAMS.md` як review surface.

## Детальна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-інсталяції)">
    Якщо це git checkout і doctor запускається інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без channel-specific override), doctor нормалізує їх до поточної схеми.

    Це включає застарілі пласкі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у map провайдерів.

    Doctor також попереджає, коли `plugins.allow` непорожній, а політика інструментів використовує
    wildcard або записи інструментів, що належать Plugin. `tools.allow: ["*"]` збігається лише з інструментами
    з plugins, які фактично завантажуються; він не обходить ексклюзивний allowlist Plugin.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися та просять вас виконати `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже міграцію, яку застосував.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час запуску, коли виявляє застарілий формат конфігурації, тож застарілі конфігурації ремонтуються без ручного втручання. Міграції сховища Cron jobs обробляються через `openclaw doctor --fix`.

    Поточні міграції:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
    - Для каналів з іменованими `accounts`, але залишковими значеннями каналу верхнього рівня для одного облікового запису, перемістіть ці значення, прив’язані до облікового запису, у підвищений обліковий запис, вибраний для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видаліть `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для таймаутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видаліть `browser.relayBindHost` (застаріле налаштування ретранслятора extension)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (запуск gateway також пропускає провайдерів, у яких `api` встановлено на майбутнє або невідоме значення enum, замість аварійного закриття)

    Попередження doctor також містять настанови щодо типового облікового запису для каналів із кількома обліковими записами:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` встановлено на невідомий ID облікового запису, doctor попереджає і перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово скерувати моделі на неправильний API або занулити витрати. Doctor попереджає, щоб ви могли видалити перевизначення й відновити маршрутизацію API та витрати на рівні окремих моделей.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Якщо ваша конфігурація браузера досі вказує на видалений шлях extension Chrome, doctor нормалізує її до поточної моделі host-local підключення Chrome MCP:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє шлях host-local Chrome MCP, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи Google Chrome встановлено на тому самому хості для профілів типового автоматичного підключення
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці інспектування браузера (наприклад, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути налаштування на боці Chrome замість вас. Host-local Chrome MCP все ще потребує:

    - браузера на основі Chromium 144+ на хості gateway/node
    - локально запущеного браузера
    - увімкненого віддаленого налагодження в цьому браузері
    - схвалення першого запиту згоди на підключення в браузері

    Готовність тут стосується лише передумов локального підключення. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути на кшталт `responsebody`, експорту PDF, перехоплення завантажень і пакетних дій усе ще потребують керованого браузера або raw CDP profile.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless потоків. Вони й надалі використовують raw CDP.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor перевіряє endpoint авторизації OpenAI, щоб упевнитися, що локальний стек Node/OpenSSL TLS може перевірити ланцюг сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor виводить настанови з виправлення для конкретної платформи. На macOS із Homebrew Node виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка виконується навіть тоді, коли gateway справний.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Якщо раніше ви додали застарілі транспортні налаштування в `models.providers.openai-codex`, вони можуть затіняти вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі транспортні налаштування разом із Codex OAuth, щоб ви могли видалити або переписати застаріле транспортне перевизначення й повернути вбудовану маршрутизацію/резервну поведінку. Власні проксі та перевизначення лише заголовків досі підтримуються й не викликають це попередження.
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    Коли ввімкнено bundled Codex plugin, doctor також перевіряє, чи refs основної моделі `openai-codex/*` досі резолвляться через типовий PI runner. Така комбінація коректна, коли вам потрібна автентифікація Codex OAuth/subscription через PI, але її легко сплутати з нативним harness app-server Codex. Doctor попереджає й указує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, оскільки обидва маршрути коректні:

    - `openai-codex/*` + PI означає "використовувати автентифікацію Codex OAuth/subscription через звичайний runner OpenClaw."
    - `openai/*` + `runtime: "codex"` означає "запустити вбудований turn через нативний app-server Codex."
    - `/codex ...` означає "керувати або прив’язати нативну розмову Codex із чату."
    - `/acp ...` або `runtime: "acp"` означає "використовувати зовнішній адаптер ACP/acpx."

    Якщо з’являється попередження, виберіть задуманий маршрут і відредагуйте конфігурацію вручну. Залишайте попередження як є, коли PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor може мігрувати старіші дискові макети до поточної структури:

    - Сховище sessions + transcripts:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог agent:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілих `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID облікового запису: `default`)

    Ці міграції виконуються за принципом best-effort і є ідемпотентними; doctor видаватиме попередження, коли залишатиме будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі sessions + каталог agent під час запуску, щоб history/auth/models потрапляли в шлях per-agent без ручного запуску doctor. Автентифікацію WhatsApp навмисно мігрують лише через `openclaw doctor`. Нормалізація provider/provider-map для Talk тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не запускають повторні no-op зміни `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor сканує всі встановлені маніфести plugin на наявність застарілих ключів capability верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли їх знайдено, він пропонує перемістити їх в об’єкт `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor також перевіряє сховище завдань cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, коли перевизначено) на старі форми завдань, які планувальник досі приймає для сумісності.

    Поточні очищення cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases delivery для payload `provider` → явний `delivery.channel`
    - прості застарілі webhook fallback завдання `notify: true` → явне `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий notify fallback з наявним режимом delivery, що не є webhook, doctor попереджає й залишає це завдання для ручної перевірки.

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor сканує кожен каталог session agent на застарілі файли write-lock — файли, що залишилися після аварійного завершення session. Для кожного знайденого lock file він повідомляє: шлях, PID, чи PID досі живий, вік lock і чи він вважається застарілим (мертвий PID або старший за 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі lock files; інакше виводить примітку й інструктує повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor сканує файли JSONL agent session на дубльовану форму branch, створену помилкою переписування prompt transcript від 2026.4.24: покинутий user turn із внутрішнім runtime context OpenClaw плюс активний sibling, що містить той самий видимий user prompt. У режимі `--fix` / `--repair` doctor створює резервну копію кожного зачепленого файлу поруч з оригіналом і переписує transcript на активний branch, щоб gateway history і memory readers більше не бачили дубльованих turns.
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    Каталог state — це operational brainstem. Якщо він зникне, ви втратите sessions, credentials, logs і config (якщо у вас немає резервних копій деінде).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що відновити відсутні дані неможливо.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Каталог стану macOS, синхронізований із хмарою**: попереджає, коли стан розміщується в iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, оскільки шляхи з синхронізацією можуть спричиняти повільніший I/O і перегони блокування/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розміщується на джерелі монтування `mmcblk*`, оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час запису сесій і облікових даних.
    - **Каталоги сесій відсутні**: `sessions/` і каталог сховища сесій потрібні для збереження історії та уникнення збоїв `ENOENT`.
    - **Невідповідність transcript**: попереджає, коли в нещодавніх записах сесій відсутні файли transcript.
    - **Основна сесія "1-line JSONL"**: позначає випадки, коли основний transcript має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли існує кілька папок `~/.openclaw` у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділятися між інсталяціями).
    - **Нагадування про remote-режим**: якщо `gateway.mode=remote`, doctor нагадує запустити його на remote-хості (стан зберігається там).
    - **Дозволи конфігураційного файла**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує посилити дозволи до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделі (закінчення OAuth)">
    Doctor перевіряє OAuth-профілі у сховищі автентифікації, попереджає, коли термін дії токенів добігає кінця або вже минув, і може безпечно їх оновити. Якщо OAuth/токен-профіль Anthropic застарів, він пропонує API-ключ Anthropic або шлях із setup-token Anthropic. Запити на оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад, `refresh_token_reused`, `invalid_grant` або provider повідомляє, що потрібно знову ввійти), doctor повідомляє, що потрібна повторна автентифікація, і друкує точну команду `openclaw models auth login --provider ...`, яку слід виконати.

    Doctor також повідомляє про auth-профілі, які тимчасово непридатні через:

    - короткі періоди очікування (обмеження частоти/тайм-аути/збої автентифікації)
    - довші вимкнення (збої білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Перевірка моделі hooks">
    Якщо встановлено `hooks.gmail.model`, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли воно не розв’язується або заборонене.
  </Accordion>
  <Accordion title="7. Відновлення sandbox image">
    Коли sandboxing увімкнено, doctor перевіряє Docker images і пропонує зібрати або перемкнутися на legacy names, якщо поточний image відсутній.
  </Accordion>
  <Accordion title="7b. Runtime-залежності bundled plugin">
    Doctor перевіряє runtime-залежності лише для bundled plugins, які активні в поточній конфігурації або ввімкнені за замовчуванням у своєму bundled manifest, наприклад `plugins.entries.discord.enabled: true`, legacy `channels.discord.enabled: true`, налаштовані `models.providers.*` / посилання на моделі агентів або bundled plugin, увімкнений за замовчуванням без provider ownership. Якщо якісь відсутні, doctor повідомляє пакети й інсталює їх у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. External plugins і далі використовують `openclaw plugins install` / `openclaw plugins update`; doctor не інсталює залежності для довільних шляхів plugin.

    Під час відновлення doctor, npm-інсталяції bundled runtime-dependency повідомляють про поступ через spinner у TTY-сесіях і періодичні рядки поступу в piped/headless виводі. Gateway і local CLI також можуть за потреби відновлювати runtime-залежності активних bundled plugin перед імпортом bundled plugin. Ці інсталяції обмежені коренем runtime-інсталяції plugin, запускаються з вимкненими scripts, не записують package lock і захищені install-root lock, щоб одночасні запуски CLI або Gateway не змінювали одне й те саме дерево `node_modules` одночасно. Застарілі legacy locks від убитих запусків Docker/container повертаються, коли metadata їхнього власника не може підтвердити поточне втілення процесу, а lock-файли старі.

  </Accordion>
  <Accordion title="8. Міграції сервісу Gateway і підказки з очищення">
    Doctor виявляє legacy gateway services (launchd/systemd/schtasks) і пропонує видалити їх та встановити сервіс OpenClaw, використовуючи поточний порт gateway. Він також може сканувати додаткові gateway-like services і друкувати підказки з очищення. Gateway-сервіси OpenClaw з іменами профілів вважаються першокласними та не позначаються як "extra."

    У Linux, якщо user-level gateway service відсутній, але існує system-level OpenClaw gateway service, doctor не встановлює другий user-level service автоматично. Перевірте через `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або встановіть `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли системний supervisor керує життєвим циклом gateway.

  </Accordion>
  <Accordion title="8b. Міграція Startup Matrix">
    Коли обліковий запис каналу Matrix має pending або actionable legacy state migration, doctor (у режимі `--fix` / `--repair`) створює pre-migration snapshot, а потім виконує best-effort кроки міграції: legacy Matrix state migration і legacy encrypted-state preparation. Обидва кроки non-fatal; помилки логуються, а запуск продовжується. У режимі read-only (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Спряження пристроїв і drift автентифікації">
    Doctor тепер перевіряє стан device-pairing як частину звичайного health pass.

    Що він повідомляє:

    - pending first-time pairing requests
    - pending role upgrades для вже спряжених пристроїв
    - pending scope upgrades для вже спряжених пристроїв
    - виправлення public-key mismatch, коли device id усе ще збігається, але ідентичність пристрою більше не збігається із затвердженим записом
    - paired records без active token для approved role
    - paired tokens, чиї scopes відхилилися від approved pairing baseline
    - локальні кешовані device-token записи для поточної машини, що передують gateway-side token rotation або містять stale scope metadata

    Doctor не auto-approve pair requests і не auto-rotate device tokens. Натомість він друкує точні наступні кроки:

    - переглянути pending requests через `openclaw devices list`
    - затвердити точний request через `openclaw devices approve <requestId>`
    - ротувати свіжий token через `openclaw devices rotate --device <deviceId> --role <role>`
    - видалити й повторно затвердити stale record через `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину "already paired but still getting pairing required": doctor тепер відрізняє first-time pairing від pending role/scope upgrades і від stale token/device-identity drift.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли provider відкритий для DM без allowlist або коли policy налаштовано небезпечно.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запуск відбувається як systemd user service, doctor гарантує, що lingering увімкнено, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан workspace (skills, plugins і legacy dirs)">
    Doctor друкує підсумок стану workspace для default agent:

    - **Стан Skills**: підраховує eligible, missing-requirements і allowlist-blocked skills.
    - **Legacy workspace dirs**: попереджає, коли `~/openclaw` або інші legacy workspace directories існують поруч із поточним workspace.
    - **Стан Plugin**: підраховує enabled/disabled/errored plugins; перелічує plugin IDs для всіх помилок; повідомляє bundle plugin capabilities.
    - **Попередження сумісності Plugin**: позначає plugins, які мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує всі load-time warnings або errors, виведені plugin registry.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файла">
    Doctor перевіряє, чи workspace bootstrap files (наприклад `AGENTS.md`, `CLAUDE.md` або інші injected context files) наближаються до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файла кількість raw vs. injected characters, відсоток truncation, причину truncation (`max/file` або `max/total`) і загальну кількість injected characters як частку від total budget. Коли файли truncated або near the limit, doctor друкує поради з налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення stale channel plugin">
    Коли `openclaw doctor --fix` видаляє missing channel plugin, він також видаляє dangling channel-scoped config, що посилався на цей plugin: записи `channels.<id>`, heartbeat targets, які називали channel, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає boot loops Gateway, коли channel runtime зник, але конфігурація все ще просить gateway прив’язатися до нього.
  </Accordion>
  <Accordion title="11c. Автодоповнення shell">
    Doctor перевіряє, чи встановлено tab completion для поточного shell (zsh, bash, fish або PowerShell):

    - Якщо профіль shell використовує повільний dynamic completion pattern (`source <(openclaw completion ...)`), doctor оновлює його до швидшого cached file variant.
    - Якщо completion налаштовано в профілі, але cache file відсутній, doctor автоматично регенерує cache.
    - Якщо completion узагалі не налаштовано, doctor пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати cache вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (local token)">
    Doctor перевіряє готовність local gateway token auth.

    - Якщо token mode потребує token, а token source не існує, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає і не перезаписує його plaintext.
    - `openclaw doctor --generate-gateway-token` примусово генерує token лише тоді, коли token SecretRef не налаштовано.

  </Accordion>
  <Accordion title="12b. Read-only ремонти з урахуванням SecretRef">
    Деякі repair flows мають перевіряти налаштовані облікові дані без послаблення runtime fail-fast behavior.

    - `openclaw doctor --fix` тепер використовує ту саму read-only SecretRef summary model, що й status-family commands, для targeted config repairs.
    - Приклад: відновлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані bot credentials, коли вони доступні.
    - Якщо bot token Telegram налаштовано через SecretRef, але він недоступний у поточному command path, doctor повідомляє, що credential налаштований, але недоступний, і пропускає auto-resolution замість збою або помилкового повідомлення, що token відсутній.

  </Accordion>
  <Accordion title="13. Health check Gateway + перезапуск">
    Doctor запускає health check і пропонує перезапустити gateway, коли він виглядає unhealthy.
  </Accordion>
  <Accordion title="13b. Готовність пошуку memory">
    Doctor перевіряє, чи налаштований memory search embedding provider готовий для default agent. Поведінка залежить від налаштованого backend і provider:

    - **QMD backend**: перевіряє, чи доступний і придатний до запуску binary `qmd`. Якщо ні, друкує fix guidance, включно з npm package і manual binary path option.
    - **Explicit local provider**: перевіряє local model file або recognized remote/downloadable model URL. Якщо відсутній, пропонує перемкнутися на remote provider.
    - **Explicit remote provider** (`openai`, `voyage` тощо): перевіряє наявність API key в environment або auth store. Друкує actionable fix hints, якщо його бракує.
    - **Auto provider**: спершу перевіряє local model availability, потім пробує кожен remote provider у порядку auto-selection.

    Коли доступний кешований результат перевірки gateway (gateway був працездатним на момент перевірки), doctor звіряє його результат із конфігурацією, видимою для CLI, і зазначає будь-яку невідповідність. Doctor не запускає новий embedding ping у стандартному шляху; використовуйте команду глибокого стану пам’яті, коли потрібна жива перевірка провайдера.

    Використайте `openclaw memory status --deep`, щоб перевірити готовність embedding під час виконання.

  </Accordion>
  <Accordion title="14. Попередження про стан каналу">
    Якщо gateway працездатний, doctor запускає перевірку стану каналу й повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит і відновлення конфігурації supervisor">
    Doctor перевіряє встановлену конфігурацію supervisor (launchd/systemd/schtasks) на відсутні або застарілі стандартні значення (наприклад, залежності systemd від network-online і затримку перезапуску). Коли він знаходить невідповідність, він рекомендує оновлення й може переписати файл служби/завдання до поточних стандартних значень.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації supervisor.
    - `openclaw doctor --yes` приймає стандартні запити на відновлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише читання для життєвого циклу служби gateway. Він усе ще повідомляє про справність служби й виконує відновлення, не пов’язані зі службою, але пропускає встановлення/запуск/перезапуск/bootstrap служби, переписування конфігурації supervisor і очищення застарілих служб, оскільки цим життєвим циклом керує зовнішній supervisor.
    - У Linux doctor не переписує метадані команди/entrypoint, поки відповідний systemd-модуль gateway активний. Він також ігнорує неактивні додаткові не застарілі модулі, схожі на gateway, під час сканування дубльованих служб, щоб супровідні файли служб не створювали зайвого шуму очищення.
    - Якщо для token auth потрібен токен і `gateway.auth.token` керується SecretRef, встановлення/відновлення служби doctor перевіряє SecretRef, але не зберігає розв’язані значення plaintext-токена в метаданих середовища служби supervisor.
    - Doctor виявляє керовані `.env`/SecretRef-backed значення середовища служби, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудували inline, і переписує метадані служби так, щоб ці значення завантажувалися з runtime-джерела, а не з визначення supervisor.
    - Doctor виявляє, коли команда служби досі закріплює старий `--port` після зміни `gateway.port`, і переписує метадані служби на поточний порт.
    - Якщо для token auth потрібен токен, а налаштований token SecretRef не розв’язується, doctor блокує шлях встановлення/відновлення з практичними інструкціями.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/відновлення, доки mode не буде задано явно.
    - Для Linux user-systemd модулів перевірки розбіжності токенів doctor тепер включають джерела і `Environment=`, і `EnvironmentFile=` під час порівняння auth-метаданих служби.
    - Відновлення служби doctor відмовляються переписувати, зупиняти або перезапускати службу gateway зі старішого бінарного файлу OpenClaw, коли конфігурацію востаннє було записано новішою версією. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway і порту">
    Doctor перевіряє runtime служби (PID, останній статус виходу) і попереджає, коли служба встановлена, але фактично не запущена. Він також перевіряє конфлікти портів на порту gateway (стандартно `18789`) і повідомляє ймовірні причини (gateway уже запущений, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли служба gateway працює на Bun або на шляху Node, керованому менеджером версій (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджера версій можуть ламатися після оновлень, оскільки служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує мігрувати на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нові встановлені або відновлені служби зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні каталоги user-bin, але вгадані резервні каталоги менеджера версій записуються до service PATH лише тоді, коли ці каталоги існують на диску. Це тримає згенерований supervisor PATH узгодженим із тим самим аудитом мінімального PATH, який doctor запускає пізніше.

  </Accordion>
  <Accordion title="18. Запис конфігурації й метадані майстра">
    Doctor зберігає всі зміни конфігурації та проставляє метадані майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервна копія + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, коли її немає, і виводить пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури робочого простору й резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
