---
read_when:
    - Додавання або зміна міграцій doctor
    - Запровадження несумісних змін у конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки стану, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-01T08:51:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: eef5715d485609fa60bdb4aa97ee441b053a60519b9dea03b0c8ec09db157474
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

    Приймати типові значення без запитів (зокрема кроки відновлення перезапуску/сервісу/пісочниці, коли застосовно).

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

    Запустити без запитів і застосувати лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії з перезапуском/сервісом/пісочницею, які потребують підтвердження людини. Міграції застарілого стану запускаються автоматично, коли їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканувати системні сервіси на наявність додаткових установлень Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спочатку відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (коротко)

<AccordionGroup>
  <Accordion title="Справність, UI та оновлення">
    - Необов’язкове попереднє оновлення для git-установлень (лише інтерактивно).
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
    - Перевірка передумов OAuth TLS для OAuth-профілів OpenAI Codex.
    - Попередження про allowlist Plugin/інструментів, коли `plugins.allow` є обмежувальним, але політика інструментів усе ще запитує wildcard або інструменти, що належать Plugin.
    - Міграція застарілого стану на диску (сесії/каталог агента/автентифікація WhatsApp).
    - Міграція застарілих ключів контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища Cron (`jobId`, `schedule.cron`, поля доставки/payload верхнього рівня, payload `provider`, прості fallback-завдання Webhook `notify: true`).
    - Міграція застарілої runtime-політики агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли plugins увімкнено; коли `plugins.enabled=false`, застарілі посилання на Plugin вважаються інертною конфігурацією ізоляції та зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка lock-файлів сесій і очищення застарілих lock-файлів.
    - Відновлення транскрипту сесії для дубльованих гілок переписування prompt, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для відновлення після перезапуску завислого субагента з підтримкою `--fix` для очищення застарілих прапорців перерваного відновлення, щоб запуск не продовжував вважати дочірній процес перерваним через перезапуск.
    - Перевірки цілісності стану та дозволів (сесії, транскрипти, каталог стану).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Справність автентифікації моделі: перевіряє завершення строку дії OAuth, може оновлювати токени, строк дії яких спливає, і повідомляє про стани cooldown/disabled для auth-profile.
    - Виявлення додаткового каталогу робочого простору (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, служби та супервізори">
    - Відновлення образу пісочниці, коли пісочницю ввімкнено.
    - Міграція застарілих служб і виявлення додаткового gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime Gateway (службу встановлено, але вона не працює; кешована мітка launchd).
    - Попередження про статус каналу (перевіряються із запущеного gateway).
    - Аудит конфігурації супервізора (launchd/systemd/schtasks) з необов’язковим відновленням.
    - Очищення середовища вбудованого проксі для служб gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи менеджера версій).
    - Діагностика конфліктів порту Gateway (типово `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та сполучення">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує створення токена, коли немає джерела токена; не перезаписує конфігурації SecretRef токена).
    - Виявлення проблем зі сполученням пристроїв (очікувані первинні запити на сполучення, очікувані підвищення ролі/області дії, розходження застарілого кешу локального токена пристрою та розходження автентифікації запису сполучення).

  </Accordion>
  <Accordion title="Робоча область і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу робочої області (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка стану автодоповнення shell та автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера embedding для пошуку пам’яті (локальна модель, ключ віддаленого API або двійковий файл QMD).
    - Перевірки встановлення з вихідного коду (невідповідність workspace pnpm, відсутні ресурси UI, відсутній двійковий файл tsx).
    - Записує оновлену конфігурацію та метадані майстра.

  </Accordion>
</AccordionGroup>

## Зворотне заповнення та скидання UI Dreams

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для робочого процесу grounded dreaming. Ці дії використовують RPC-методи в стилі gateway doctor, але вони **не** є частиною відновлення/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активній робочій області, запускає grounded REM diary pass і записує оборотні записи зворотного заповнення в `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише ці позначені записи щоденника зворотного заповнення.
- **Clear Grounded** видаляє лише підготовлені короткострокові записи лише grounded, які походять з історичного відтворення і ще не накопичили live recall або daily support.

Чого вони **не** роблять самі по собі:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не додають автоматично grounded-кандидатів до live-сховища короткострокового просування, якщо ви явно спершу не запустите підготовлений шлях CLI

Якщо ви хочете, щоб grounded historical replay вплинув на звичайну смугу deep promotion, натомість використовуйте потік CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це додає grounded durable candidates у short-term dreaming store, залишаючи `DREAMS.md` поверхнею для перегляду.

## Докладна поведінка й обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (встановлення з git)">
    Якщо це git checkout і doctor запускається інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх до поточної схеми.

    Це включає застарілі плоскі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у мапу провайдерів.

    Doctor також попереджає, коли `plugins.allow` не порожній, а політика інструментів використовує
    wildcard або записи інструментів, що належать Plugin. `tools.allow: ["*"]` відповідає лише інструментам
    із plugins, які фактично завантажуються; він не обходить ексклюзивний список дозволених plugin.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися і просять вас запустити `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі було знайдено.
    - Покаже застосовану міграцію.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час запуску, коли виявляє застарілий формат конфігурації, тому застарілі конфігурації відновлюються без ручного втручання. Міграції сховища Cron jobs обробляються командою `openclaw doctor --fix`.

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
    - Для каналів з іменованими `accounts`, але з рештками верхньорівневих значень каналу для одного облікового запису, перемістіть ці значення з областю дії облікового запису в підвищений обліковий запис, вибраний для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видаліть `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для тайм-аутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видаліть `browser.relayBindHost` (застаріле налаштування ретранслятора extension)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (запуск gateway також пропускає провайдерів, у яких `api` задано як майбутнє або невідоме значення enum, замість того щоб аварійно завершуватися)

    Попередження doctor також містять поради щодо типового облікового запису для багатооблікових каналів:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` задано як невідомий ID облікового запису, doctor попереджає про це й перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі на неправильний API або обнулити витрати. Doctor попереджає, щоб ви могли видалити перевизначення й відновити маршрутизацію API + витрати для кожної моделі.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Якщо ваша конфігурація браузера досі вказує на видалений шлях Chrome extension, doctor нормалізує її до поточної моделі під’єднання Chrome MCP на локальному хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє шлях Chrome MCP на локальному хості, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для типових профілів автоматичного під’єднання
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці інспектування браузера (наприклад `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути налаштування на боці Chrome за вас. Chrome MCP на локальному хості все ще потребує:

    - браузер на базі Chromium 144+ на хості gateway/node
    - браузер, запущений локально
    - віддалене налагодження, увімкнене в цьому браузері
    - підтвердження першого запиту згоди на під’єднання в браузері

    Готовність тут стосується лише передумов локального під’єднання. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, усе ще потребують керованого браузера або профілю raw CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують raw CDP.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor перевіряє кінцеву точку авторизації OpenAI, щоб упевнитися, що локальний стек Node/OpenSSL TLS може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor друкує поради з виправлення для конкретної платформи. На macOS із Homebrew Node виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка виконується навіть тоді, коли gateway справний.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Якщо раніше ви додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть затіняти вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі транспортні налаштування разом із Codex OAuth, щоб ви могли видалити або переписати застаріле перевизначення транспорту й повернути вбудовану поведінку маршрутизації/резервування. Власні проксі й перевизначення лише заголовків усе ще підтримуються та не спричиняють цього попередження.
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    Коли ввімкнено bundled Codex plugin, doctor також перевіряє, чи посилання первинних моделей `openai-codex/*` досі розв’язуються через типовий PI runner. Така комбінація коректна, коли вам потрібна автентифікація Codex OAuth/підписки через PI, але її легко сплутати з нативним harness сервера застосунку Codex. Doctor попереджає й указує на явну форму сервера застосунку: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, бо обидва маршрути коректні:

    - `openai-codex/*` + PI означає «використовувати автентифікацію Codex OAuth/підписки через звичайний runner OpenClaw».
    - `openai/*` + `runtime: "codex"` означає «запустити вбудований turn через нативний сервер застосунку Codex».
    - `/codex ...` означає «керувати або прив’язати нативну розмову Codex із чату».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

    Якщо з’являється попередження, виберіть задуманий маршрут і відредагуйте конфігурацію вручну. Залиште попередження як є, коли PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor може мігрувати старіші дискові макети в поточну структуру:

    - Сховище сесій + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілих `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID облікового запису: `default`)

    Ці міграції виконуються за принципом best-effort та є ідемпотентними; doctor видасть попередження, коли залишить будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі сесії + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапили в шлях для окремого агента без ручного запуску doctor. Нормалізація провайдера talk/мапи провайдерів тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не запускають повторні no-op зміни `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor сканує всі маніфести встановлених plugin на наявність застарілих верхньорівневих ключів можливостей (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли знаходить їх, він пропонує перемістити їх в об’єкт `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor також перевіряє сховище завдань cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, якщо перевизначено) на старі форми завдань, які планувальник усе ще приймає для сумісності.

    Поточні очищення cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - верхньорівневі поля payload (`message`, `model`, `thinking`, ...) → `payload`
    - верхньорівневі поля доставки (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми доставки `provider` у payload → явний `delivery.channel`
    - прості застарілі fallback-завдання webhook з `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий fallback notify з наявним режимом доставки, що не є webhook, doctor попереджає й залишає це завдання для ручної перевірки.

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor сканує кожен каталог сесій агента на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сесії. Для кожного знайденого файла блокування він повідомляє: шлях, PID, чи PID досі активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше за 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше друкує примітку й інструктує повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor сканує JSONL-файли сесій агента на дубльовану форму гілки, створену помилкою переписування транскрипту prompt від 2026.4.24: покинутий користувацький turn із внутрішнім runtime-контекстом OpenClaw плюс активний sibling, що містить той самий видимий користувацький prompt. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файла поруч з оригіналом і переписує транскрипт до активної гілки, щоб читачі історії gateway і memory більше не бачили дубльованих turns.
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    Каталог стану — це операційний стовбур мозку. Якщо він зникне, ви втратите сесії, облікові дані, журнали й конфігурацію (якщо не маєте резервних копій в іншому місці).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що відновити відсутні дані неможливо.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Синхронізований із хмарою каталог стану macOS**: попереджає, коли стан розташовано в iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, оскільки шляхи з синхронізацією можуть спричиняти повільніше I/O та перегони блокувань/синхронізації.
    - **Каталог стану на SD або eMMC у Linux**: попереджає, коли стан розташовано на джерелі монтування `mmcblk*`, оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сеансів і облікових даних.
    - **Каталоги сеансів відсутні**: `sessions/` і каталог сховища сеансів потрібні для збереження історії та уникнення аварій `ENOENT`.
    - **Невідповідність транскрипту**: попереджає, коли в нещодавніх записах сеансів бракує файлів транскриптів.
    - **Головний сеанс "1-line JSONL"**: позначає ситуацію, коли головний транскрипт має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли кілька папок `~/.openclaw` існують у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділитися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запустити його на віддаленому хості (стан зберігається там).
    - **Дозволи файлу конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує звузити дозволи до `600`.

  </Accordion>
  <Accordion title="5. Справність автентифікації моделей (закінчення строку OAuth)">
    Doctor перевіряє профілі OAuth у сховищі автентифікації, попереджає, коли токени скоро закінчаться або вже закінчилися, і може безпечно їх оновити. Якщо профіль OAuth/токена Anthropic застарів, він пропонує API-ключ Anthropic або шлях setup-token Anthropic. Запити на оновлення з'являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад, `refresh_token_reused`, `invalid_grant` або provider повідомляє, що потрібно ввійти знову), doctor повідомляє, що потрібна повторна автентифікація, і друкує точну команду `openclaw models auth login --provider ...`, яку треба виконати.

    Doctor також повідомляє про профілі автентифікації, які тимчасово непридатні через:

    - короткі періоди очікування (ліміти швидкості/тайм-аути/помилки автентифікації)
    - довші вимкнення (помилки білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Перевірка моделей хуків">
    Якщо задано `hooks.gmail.model`, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли його неможливо розв'язати або воно заборонене.
  </Accordion>
  <Accordion title="7. Відновлення образу sandbox">
    Коли sandbox увімкнено, doctor перевіряє образи Docker і пропонує зібрати або перемкнутися на застарілі назви, якщо поточного образу бракує.
  </Accordion>
  <Accordion title="7b. Runtime-залежності вбудованих plugin">
    Doctor перевіряє runtime-залежності лише для вбудованих plugins, активних у поточній конфігурації або ввімкнених за типовим значенням їхнього вбудованого маніфесту, наприклад `plugins.entries.discord.enabled: true`, застаріле `channels.discord.enabled: true`, налаштовані `models.providers.*` / посилання на моделі агентів або типово ввімкнений вбудований plugin без власника provider. Якщо чогось бракує, doctor повідомляє пакети й установлює їх у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Зовнішні plugins і далі використовують `openclaw plugins install` / `openclaw plugins update`; doctor не встановлює залежності для довільних шляхів plugin.

    Під час відновлення doctor встановлення npm для вбудованих runtime-залежностей показують прогрес spinner у сеансах TTY і періодичний рядковий прогрес у piped/headless-виводі. Запуск Gateway і перезавантаження конфігурації входять у режим плану plugin перед імпортом runtime-модулів вбудованого plugin; звичайні runtime-імпорти виконують лише перевірку й не запускають відновлення через менеджер пакетів. Ці встановлення обмежені коренем встановлення runtime plugin, запускаються з вимкненими scripts, не записують package lock і захищені блокуванням кореня встановлення, щоб паралельні запуски CLI або Gateway не змінювали одне й те саме дерево `node_modules` одночасно. Застарілі legacy-блокування від убитих запусків Docker/container повертаються, коли їхні метадані власника не можуть підтвердити поточне втілення процесу, а файли блокування старі.

  </Accordion>
  <Accordion title="8. Міграції служби Gateway і підказки з очищення">
    Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити службу OpenClaw із поточним портом gateway. Він також може сканувати додаткові gateway-подібні служби й друкувати підказки з очищення. Служби gateway OpenClaw з іменами профілів вважаються повноцінними й не позначаються як "зайві."

    У Linux, якщо служба gateway рівня користувача відсутня, але існує служба gateway OpenClaw системного рівня, doctor не встановлює автоматично другу службу рівня користувача. Перевірте за допомогою `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли системний supervisor керує життєвим циклом gateway.

  </Accordion>
  <Accordion title="8b. Міграція Startup Matrix">
    Коли обліковий запис каналу Matrix має pending або actionable міграцію legacy-стану, doctor (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім виконує best-effort кроки міграції: міграцію legacy-стану Matrix і підготовку legacy encrypted-state. Обидва кроки не є фатальними; помилки журналюються, а запуск продовжується. У режимі лише для читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Сполучення пристроїв і drift автентифікації">
    Doctor тепер перевіряє стан сполучення пристроїв як частину звичайної перевірки справності.

    Що він повідомляє:

    - pending запити першого сполучення
    - pending підвищення ролі для вже сполучених пристроїв
    - pending розширення scope для вже сполучених пристроїв
    - виправлення невідповідності публічного ключа, коли id пристрою досі збігається, але ідентичність пристрою більше не збігається із затвердженим записом
    - сполучені записи без активного токена для затвердженої ролі
    - сполучені токени, scopes яких відхилилися від затвердженої базової лінії сполучення
    - локальні кешовані записи device-token для поточної машини, які передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не затверджує автоматично запити сполучення й не обертає автоматично токени пристроїв. Натомість він друкує точні наступні кроки:

    - перегляньте pending запити за допомогою `openclaw devices list`
    - затвердьте точний запит за допомогою `openclaw devices approve <requestId>`
    - оберніть свіжий токен за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видаліть і повторно затвердьте застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину "уже сполучено, але все ще потрібне сполучення": doctor тепер відрізняє перше сполучення від pending підвищень ролі/scope і від застарілого drift токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли provider відкритий для DM без allowlist або коли policy налаштовано небезпечним способом.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запуск відбувається як користувацька служба systemd, doctor переконується, що lingering увімкнено, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан workspace (skills, plugins і legacy-каталоги)">
    Doctor друкує зведення стану workspace для типового агента:

    - **Стан Skills**: підраховує придатні skills, skills з відсутніми вимогами та skills, заблоковані allowlist.
    - **Legacy-каталоги workspace**: попереджає, коли `~/openclaw` або інші legacy-каталоги workspace існують поруч із поточним workspace.
    - **Стан Plugin**: підраховує ввімкнені/вимкнені/помилкові plugins; перелічує ID plugin для будь-яких помилок; повідомляє можливості bundle plugin.
    - **Попередження сумісності Plugin**: позначає plugins, що мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки часу завантаження, виведені registry plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Doctor перевіряє, чи bootstrap-файли workspace (наприклад `AGENTS.md`, `CLAUDE.md` або інші впроваджені контекстні файли) близькі до налаштованого бюджету символів або перевищують його. Він повідомляє сирі та впроваджені кількості символів для кожного файлу, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість впроваджених символів як частку від загального бюджету. Коли файли обрізано або вони близькі до ліміту, doctor друкує поради з налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілих channel plugin">
    Коли `openclaw doctor --fix` видаляє відсутній channel plugin, він також видаляє dangling конфігурацію в scope каналу, що посилалася на цей plugin: записи `channels.<id>`, цілі heartbeat, що називали канал, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає циклам завантаження Gateway, коли runtime каналу зник, але конфігурація все ще просить gateway прив'язатися до нього.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor перевіряє, чи встановлено tab completion для поточної shell (zsh, bash, fish або PowerShell):

    - Якщо профіль shell використовує повільний динамічний шаблон completion (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанту з кешованим файлом.
    - Якщо completion налаштовано в профілі, але кеш-файл відсутній, doctor автоматично генерує кеш повторно.
    - Якщо completion взагалі не налаштовано, doctor пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб повторно згенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність автентифікації локального gateway-токена.

    - Якщо режим токена потребує токена, а джерела токена немає, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає й не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано token SecretRef.

  </Accordion>
  <Accordion title="12b. Відновлення лише для читання з урахуванням SecretRef">
    Деякі потоки відновлення мають перевіряти налаштовані облікові дані без послаблення runtime-поведінки fail-fast.

    - `openclaw doctor --fix` тепер використовує ту саму модель зведення SecretRef лише для читання, що й команди сімейства status, для цільових виправлень конфігурації.
    - Приклад: виправлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані bot, коли вони доступні.
    - Якщо токен bot Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає автоматичне розв'язання замість аварійного завершення або помилкового повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Перевірка справності Gateway + перезапуск">
    Doctor запускає перевірку справності й пропонує перезапустити gateway, коли він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку в пам'яті">
    Doctor перевіряє, чи налаштований provider embedding для пошуку в пам'яті готовий для типового агента. Поведінка залежить від налаштованого backend і provider:

    - **QMD backend**: перевіряє, чи доступний і придатний до запуску binary `qmd`. Якщо ні, друкує рекомендації з виправлення, зокрема npm-пакет і варіант ручного шляху до binary.
    - **Явний локальний provider**: перевіряє наявність локального файлу моделі або розпізнаної віддаленої/завантажуваної URL моделі. Якщо бракує, пропонує перемкнутися на віддалений provider.
    - **Явний віддалений provider** (`openai`, `voyage` тощо): перевіряє, що API-ключ присутній в environment або auth store. Друкує actionable підказки з виправлення, якщо його бракує.
    - **Auto provider**: спершу перевіряє доступність локальної моделі, потім пробує кожен віддалений provider у порядку auto-selection.

    Коли доступний кешований результат перевірки Gateway (Gateway був справним на момент перевірки), doctor звіряє його результат із конфігурацією, видимою для CLI, і позначає будь-яку невідповідність. Doctor не запускає нову перевірку embedding у стандартному шляху; використовуйте команду докладного стану пам’яті, коли потрібна жива перевірка провайдера.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding під час виконання.

  </Accordion>
  <Accordion title="14. Попередження про стан каналу">
    Якщо Gateway справний, doctor запускає перевірку стану каналу та повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит і відновлення конфігурації supervisor">
    Doctor перевіряє встановлену конфігурацію supervisor (launchd/systemd/schtasks) на відсутні або застарілі стандартні параметри (наприклад, залежності systemd від network-online і затримку перезапуску). Коли він знаходить невідповідність, він рекомендує оновлення й може переписати файл служби/завдання до поточних стандартних параметрів.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації supervisor.
    - `openclaw doctor --yes` приймає стандартні запити на відновлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише читання для життєвого циклу служби Gateway. Він усе ще повідомляє про справність служби та виконує відновлення, не пов’язані зі службою, але пропускає встановлення/запуск/перезапуск/bootstrap служби, переписування конфігурації supervisor і очищення застарілих служб, бо цим життєвим циклом керує зовнішній supervisor.
    - У Linux doctor не переписує метадані команди/entrypoint, доки відповідний systemd-юніт Gateway активний. Він також ігнорує неактивні додаткові gateway-подібні юніти, що не є застарілими, під час сканування дубльованих служб, щоб супровідні файли служб не створювали зайвого шуму очищення.
    - Якщо автентифікація токеном вимагає токен і `gateway.auth.token` керується SecretRef, встановлення/відновлення служби doctor перевіряє SecretRef, але не зберігає розв’язані значення токена у відкритому тексті в метаданих середовища служби supervisor.
    - Doctor виявляє керовані значення середовища служби на основі `.env`/SecretRef, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудували inline, і переписує метадані служби так, щоб ці значення завантажувалися з runtime-джерела замість визначення supervisor.
    - Doctor виявляє, коли команда служби все ще фіксує старий `--port` після зміни `gateway.port`, і переписує метадані служби на поточний порт.
    - Якщо автентифікація токеном вимагає токен, а налаштований SecretRef токена не розв’язано, doctor блокує шлях встановлення/відновлення з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/відновлення, доки mode не буде задано явно.
    - Для користувацьких systemd-юнітів Linux перевірки drift токена doctor тепер включають джерела і `Environment=`, і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Відновлення служби doctor відмовляються переписувати, зупиняти або перезапускати службу Gateway зі старішого бінарного файлу OpenClaw, коли конфігурацію востаннє було записано новішою версією. Див. [Усунення проблем Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway і порту">
    Doctor перевіряє runtime служби (PID, останній статус виходу) і попереджає, коли служба встановлена, але фактично не запущена. Він також перевіряє конфлікти портів на порту Gateway (стандартно `18789`) і повідомляє ймовірні причини (Gateway уже запущений, SSH-тунель).
  </Accordion>
  <Accordion title="17. Рекомендовані практики runtime Gateway">
    Doctor попереджає, коли служба Gateway працює на Bun або шляху Node, керованому менеджером версій (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджера версій можуть ламатися після оновлень, бо служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує мігрувати на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нововстановлені або відновлені служби зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні каталоги user-bin, але вгадані fallback-каталоги менеджера версій записуються до service PATH лише тоді, коли ці каталоги існують на диску. Це узгоджує згенерований supervisor PATH із тим самим аудитом мінімального PATH, який doctor запускає пізніше.

  </Accordion>
  <Accordion title="18. Запис конфігурації та метадані майстра">
    Doctor зберігає будь-які зміни конфігурації та ставить позначку в метаданих майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервне копіювання + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, коли її немає, і виводить пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace) для повного посібника зі структури робочого простору та резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення проблем Gateway](/uk/gateway/troubleshooting)
