---
read_when:
    - Додавання або зміна міграцій doctor
    - Впровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки справності, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-02T11:07:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d306099cda1d7f6079ab94ce8bd4a716b8ccf9ab3637e14743c8a1c83db35ca6
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент ремонту та міграції для OpenClaw. Він виправляє застарілі конфігурації/стан, перевіряє працездатність і надає практичні кроки для ремонту.

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

    Приймає стандартні значення без запитів (зокрема кроки ремонту перезапуску/сервісу/пісочниці, коли застосовно).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Застосовує рекомендовані ремонти без запитів (ремонти + перезапуски там, де це безпечно).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Також застосовує агресивні ремонти (перезаписує користувацькі конфігурації supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запускається без запитів і застосовує лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії перезапуску/сервісу/пісочниці, які потребують підтвердження людини. Міграції застарілого стану запускаються автоматично, коли їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканує системні сервіси на наявність додаткових встановлень gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спершу відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (коротко)

<AccordionGroup>
  <Accordion title="Стан, UI та оновлення">
    - Необов’язкове попереднє оновлення для встановлень із git (лише інтерактивно).
    - Перевірка актуальності протоколу UI (перезбирає UI керування, коли схема протоколу новіша).
    - Перевірка стану + запит на перезапуск.
    - Зведення стану Skills (придатні/відсутні/заблоковані) і стан plugin.

  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих плоских полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення OAuth Codex (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Попередження allowlist plugin/інструментів, коли `plugins.allow` обмежувальний, але політика інструментів усе ще запитує wildcard або інструменти, що належать plugin.
    - Міграція застарілого стану на диску (сесії/каталог agent/автентифікація WhatsApp).
    - Міграція застарілих ключів контракту маніфесту plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища cron (`jobId`, `schedule.cron`, поля доставки/payload верхнього рівня, payload `provider`, прості fallback-завдання webhook `notify: true`).
    - Міграція застарілої політики виконання agent до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації plugin, коли plugins увімкнено; коли `plugins.enabled=false`, застарілі посилання на plugin трактуються як інертна конфігурація обмеження та зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка lock-файлів сесій і очищення застарілих lock.
    - Ремонт transcript сесій для дубльованих гілок переписування prompt, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для відновлення після перезапуску завислого subagent, із підтримкою `--fix` для очищення застарілих прапорців перерваного відновлення, щоб startup не продовжував трактувати дочірній процес як перерваний перезапуском.
    - Перевірки цілісності стану та дозволів (сесії, transcripts, каталог стану).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Стан автентифікації моделей: перевіряє завершення строку дії OAuth, може оновлювати токени, що скоро спливають, і повідомляє про cooldown/вимкнені стани auth-profile.
    - Виявлення додаткового каталогу workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, сервіси та supervisor">
    - Ремонт образу пісочниці, коли sandboxing увімкнено.
    - Міграція застарілого сервісу та виявлення додаткового gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime Gateway (сервіс встановлено, але він не запущений; кешована мітка launchd).
    - Попередження про стан каналів (перевіряються з запущеного gateway).
    - Аудит конфігурації supervisor (launchd/systemd/schtasks) з необов’язковим ремонтом.
    - Очищення середовища вбудованого proxy для сервісів gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи менеджерів версій).
    - Діагностика конфлікту порту gateway (типово `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та pairing">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли джерела токена немає; не перезаписує конфігурації SecretRef токена).
    - Виявлення проблем device pairing (очікувані запити першого pairing, очікувані оновлення role/scope, застарілий drift кешу локального device-token і drift автентифікації paired-record).

  </Accordion>
  <Accordion title="Workspace і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу workspace (попередження про обрізання/наближення до ліміту для файлів context).
    - Перевірка стану shell completion і автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера embedding для memory search (локальна модель, remote API key або QMD binary).
    - Перевірки встановлення з source (невідповідність workspace pnpm, відсутні UI assets, відсутній tsx binary).
    - Записує оновлену конфігурацію + метадані wizard.

  </Accordion>
</AccordionGroup>

## Зворотне заповнення та скидання Dreams UI

Сцена Dreams в UI керування містить дії **Backfill**, **Reset** і **Clear Grounded** для workflow grounded dreaming. Ці дії використовують RPC-методи gateway у стилі doctor, але вони **не** є частиною ремонту/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному workspace, запускає grounded REM diary pass і записує оборотні backfill entries у `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише ті позначені backfill diary entries.
- **Clear Grounded** видаляє лише staged grounded-only short-term entries, які прийшли з історичного replay і ще не накопичили live recall або daily support.

Чого вони самі по собі **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони автоматично не додають grounded candidates у live short-term promotion store, якщо ви явно спершу не запустите staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайну deep promotion lane, використовуйте натомість CLI flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це додає grounded durable candidates у short-term dreaming store, зберігаючи `DREAMS.md` як review surface.

## Детальна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (встановлення з git)">
    Якщо це git checkout і doctor запускається інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх до поточної схеми.

    Це включає застарілі плоскі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у provider map.

    Doctor також попереджає, коли `plugins.allow` не порожній, а політика інструментів використовує
    wildcard або записи інструментів, що належать plugin. `tools.allow: ["*"]` відповідає лише інструментам
    із plugins, які фактично завантажуються; це не обходить ексклюзивний allowlist plugin.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися й просять вас виконати `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час startup, коли виявляє застарілий формат конфігурації, тому застарілі конфігурації ремонтуються без ручного втручання. Міграції cron job store обробляються командою `openclaw doctor --fix`.

    Поточні міграції:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
    - Для каналів із іменованими `accounts`, але із залишковими верхньорівневими значеннями каналу для одного облікового запису, перемістіть ці значення з областю дії облікового запису в підвищений обліковий запис, вибраний для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/стандартну ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видаліть `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для таймаутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видаліть `browser.relayBindHost` (застаріле налаштування ретранслятора extension)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (під час запуску Gateway також пропускає провайдерів, у яких `api` встановлено на майбутнє або невідоме значення enum, замість аварійно завершуватися)

    Попередження doctor також містять рекомендації щодо стандартного облікового запису для каналів із кількома обліковими записами:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` встановлено на невідомий ID облікового запису, doctor попереджає та перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі на неправильний API або обнулити вартість. Doctor попереджає, щоб ви могли видалити перевизначення та відновити маршрутизацію API і вартість для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера та готовність Chrome MCP">
    Якщо ваша конфігурація браузера досі вказує на видалений шлях extension Chrome, doctor нормалізує її до поточної моделі підключення Chrome MCP на локальному хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє шлях Chrome MCP на локальному хості, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи Google Chrome встановлено на тому самому хості для стандартних профілів автопідключення
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці інспекції браузера (наприклад `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути налаштування на боці Chrome за вас. Chrome MCP на локальному хості все ще потребує:

    - браузер на основі Chromium 144+ на хості gateway/node
    - браузер, що працює локально
    - віддалене налагодження, увімкнене в цьому браузері
    - схвалення першого запиту згоди на підключення в браузері

    Готовність тут стосується лише передумов локального підключення. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути на кшталт `responsebody`, експорту PDF, перехоплення завантажень і пакетних дій усе ще потребують керованого браузера або сирого профілю CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують сирий CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor опитує кінцеву точку авторизації OpenAI, щоб перевірити, що локальний стек Node/OpenSSL TLS може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor виводить рекомендації з виправлення для конкретної платформи. На macOS із Homebrew Node виправлення зазвичай таке: `brew postinstall ca-certificates`. Із `--deep` перевірка виконується навіть тоді, коли gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо раніше ви додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть затінити вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі транспортні налаштування поруч із Codex OAuth, щоб ви могли видалити або переписати застаріле перевизначення транспорту й повернути вбудовану поведінку маршрутизації/резервування. Користувацькі проксі та перевизначення лише заголовків усе ще підтримуються й не запускають це попередження.
  </Accordion>
  <Accordion title="2f. Попередження маршрутів Plugin Codex">
    Коли ввімкнено вбудований Plugin Codex, doctor також перевіряє, чи первинні посилання на моделі `openai-codex/*` досі розв’язуються через стандартний runner PI. Ця комбінація коректна, коли вам потрібна автентифікація Codex OAuth/підписки через PI, але її легко сплутати з нативним harness сервера застосунку Codex. Doctor попереджає та вказує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, бо обидва маршрути чинні:

    - `openai-codex/*` + PI означає "використовувати автентифікацію Codex OAuth/підписки через звичайний runner OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` означає "запустити вбудований turn через нативний app-server Codex."
    - `/codex ...` означає "керувати нативною розмовою Codex або прив’язати її з чату."
    - `/acp ...` або `runtime: "acp"` означає "використовувати зовнішній адаптер ACP/acpx."

    Якщо з’являється попередження, виберіть потрібний маршрут і відредагуйте конфігурацію вручну. Залиште попередження без змін, коли PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (розкладка диска)">
    Doctor може мігрувати старіші розкладки на диску в поточну структуру:

    - Сховище сесій + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілих `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (стандартний ID облікового запису: `default`)

    Ці міграції виконуються за принципом best-effort та є ідемпотентними; doctor виведе попередження, коли залишить будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі сесії + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапили в шлях для кожного агента без ручного запуску doctor. Автентифікація WhatsApp навмисно мігрується лише через `openclaw doctor`. Нормалізація провайдера talk/мапи провайдерів тепер порівнює за структурною рівністю, тож відмінності лише в порядку ключів більше не спричиняють повторні no-op зміни `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілого маніфесту Plugin">
    Doctor сканує всі встановлені маніфести Plugin на наявність застарілих верхньорівневих ключів capability (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли знаходить їх, він пропонує перемістити їх в об’єкт `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища Cron">
    Doctor також перевіряє сховище завдань cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, коли перевизначено) на старі форми завдань, які планувальник досі приймає для сумісності.

    Поточні очищення cron містять:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - верхньорівневі поля payload (`message`, `model`, `thinking`, ...) → `payload`
    - верхньорівневі поля delivery (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми delivery `provider` у payload → явний `delivery.channel`
    - прості застарілі fallback-завдання webhook `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий fallback notify з наявним режимом delivery, що не є webhook, doctor попереджає та залишає це завдання для ручної перевірки.

    На Linux doctor також попереджає, коли crontab користувача досі викликає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`. Цей скрипт на локальному хості не підтримується поточним OpenClaw і може записувати хибні повідомлення `Gateway inactive` до `~/.openclaw/logs/whatsapp-health.log`, коли cron не може досягти користувацької шини systemd. Видаліть застарілий запис crontab за допомогою `crontab -e`; використовуйте `openclaw channels status --probe`, `openclaw doctor` і `openclaw gateway status` для поточних перевірок справності.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сеансів">
    Doctor сканує кожен каталог сеансів агента на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сеансу. Для кожного знайденого файла блокування він повідомляє: шлях, PID, чи PID досі активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше за 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше друкує примітку й просить повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілки стенограми сеансу">
    Doctor сканує JSONL-файли сеансів агента на дубльовану форму гілки, створену помилкою переписування стенограми промпта від 2026.4.24: покинутий хід користувача з внутрішнім runtime-контекстом OpenClaw плюс активний сусідній хід із тим самим видимим промптом користувача. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файла поруч з оригіналом і переписує стенограму до активної гілки, щоб історія gateway і читачі памʼяті більше не бачили дубльованих ходів.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сеансів, маршрутизація та безпека)">
    Каталог стану — це операційний мозковий стовбур. Якщо він зникне, ви втратите сеанси, облікові дані, журнали та конфігурацію (якщо не маєте резервних копій деінде).

    Doctor перевіряє:

    - **Відсутній каталог стану**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Права доступу до каталогу стану**: перевіряє можливість запису; пропонує відновити права доступу (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Синхронізований із хмарою каталог стану на macOS**: попереджає, коли стан розташовано під iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, оскільки шляхи із синхронізацією можуть спричиняти повільніший I/O та перегони блокування/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розташовано на джерелі монтування `mmcblk*`, оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сеансів та облікових даних.
    - **Відсутні каталоги сеансів**: `sessions/` і каталог сховища сеансів потрібні для збереження історії та уникнення аварій `ENOENT`.
    - **Невідповідність стенограми**: попереджає, коли нещодавні записи сеансів мають відсутні файли стенограм.
    - **Основний сеанс "1-line JSONL"**: позначає випадок, коли основна стенограма має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли кілька папок `~/.openclaw` існують у домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділитися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запустити його на віддаленому хості (стан зберігається там).
    - **Права доступу до файла конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує обмежити права до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделі (закінчення строку OAuth)">
    Doctor перевіряє OAuth-профілі в сховищі автентифікації, попереджає, коли строк дії токенів закінчується або вже закінчився, і може оновити їх, коли це безпечно. Якщо OAuth/token-профіль Anthropic застарів, він пропонує API-ключ Anthropic або шлях setup-token Anthropic. Запити на оновлення зʼявляються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад `refresh_token_reused`, `invalid_grant` або провайдер просить увійти знову), doctor повідомляє, що потрібна повторна автентифікація, і друкує точну команду `openclaw models auth login --provider ...`, яку треба виконати.

    Doctor також повідомляє про auth-профілі, які тимчасово непридатні через:

    - короткі паузи відновлення (обмеження швидкості/таймаути/помилки автентифікації)
    - довші вимкнення (помилки білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Перевірка моделі хуків">
    Якщо `hooks.gmail.model` задано, doctor перевіряє посилання на модель за каталогом і списком дозволених та попереджає, коли воно не розвʼязується або заборонене.
  </Accordion>
  <Accordion title="7. Відновлення образу пісочниці">
    Коли пісочницю ввімкнено, doctor перевіряє образи Docker і пропонує зібрати або перемкнутися на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Очищення інсталяції Plugin">
    Doctor видаляє застарілий створений OpenClaw проміжний стан залежностей Plugin у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Це охоплює застарілі згенеровані корені залежностей, старі каталоги етапу інсталяції та локальні для пакета залишки від попереднього коду відновлення залежностей bundled-plugin.

    Doctor також може перевстановити налаштовані завантажувані plugins, коли конфігурація посилається на них, але локальний реєстр plugins не може їх знайти. Запуск Gateway і перезавантаження конфігурації не запускають менеджери пакетів; інсталяції plugins залишаються явною роботою doctor/install/update.

  </Accordion>
  <Accordion title="8. Міграції служби Gateway і підказки з очищення">
    Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити службу OpenClaw з використанням поточного порту gateway. Він також може сканувати додаткові gateway-подібні служби й друкувати підказки з очищення. Служби gateway OpenClaw з іменами профілів вважаються повноцінними й не позначаються як "зайві".

    У Linux, якщо служба gateway рівня користувача відсутня, але існує служба gateway OpenClaw системного рівня, doctor не встановлює другу службу рівня користувача автоматично. Перевірте за допомогою `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли життєвим циклом gateway керує системний супервізор.

  </Accordion>
  <Accordion title="8b. Міграція запуску Matrix">
    Коли обліковий запис каналу Matrix має очікувану або придатну до виконання міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім запускає кроки міграції з найкращим можливим результатом: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки записуються в журнал, а запуск продовжується. У режимі лише для читання (`openclaw doctor` без `--fix`) цю перевірку повністю пропущено.
  </Accordion>
  <Accordion title="8c. Сполучення пристроїв і дрейф автентифікації">
    Doctor тепер перевіряє стан сполучення пристроїв як частину звичайного проходу перевірки здоровʼя.

    Що він повідомляє:

    - очікувані запити на перше сполучення
    - очікувані підвищення ролі для вже сполучених пристроїв
    - очікувані підвищення scope для вже сполучених пристроїв
    - відновлення невідповідності публічного ключа, коли id пристрою досі збігається, але ідентичність пристрою більше не збігається із затвердженим записом
    - сполучені записи без активного токена для затвердженої ролі
    - сполучені токени, scope яких відхиляються від затвердженого базового рівня сполучення
    - локальні кешовані записи device-token для поточної машини, які передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не схвалює запити на сполучення автоматично й не обертає токени пристроїв автоматично. Натомість він друкує точні наступні кроки:

    - переглянути очікувані запити за допомогою `openclaw devices list`
    - схвалити точний запит за допомогою `openclaw devices approve <requestId>`
    - обернути свіжий токен за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видалити й повторно схвалити застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширений пробіл "already paired but still getting pairing required": doctor тепер відрізняє перше сполучення від очікуваних підвищень ролі/scope і від дрейфу застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли провайдер відкритий для DM без списку дозволених або коли політику налаштовано небезпечно.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо працює як користувацька служба systemd, doctor гарантує, що linger увімкнено, щоб gateway залишався активним після виходу із системи.
  </Accordion>
  <Accordion title="11. Стан робочої області (Skills, plugins і застарілі каталоги)">
    Doctor друкує зведення стану робочої області для стандартного агента:

    - **Стан Skills**: підраховує eligible, missing-requirements і allowlist-blocked skills.
    - **Застарілі каталоги робочої області**: попереджає, коли `~/openclaw` або інші застарілі каталоги робочої області існують поруч із поточною робочою областю.
    - **Стан Plugin**: підраховує ввімкнені/вимкнені/помилкові plugins; перелічує ID plugins для будь-яких помилок; повідомляє можливості bundle plugin.
    - **Попередження сумісності Plugin**: позначає plugins, що мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки під час завантаження, виведені реєстром plugins.

  </Accordion>
  <Accordion title="11b. Розмір файла bootstrap">
    Doctor перевіряє, чи файли bootstrap робочої області (наприклад `AGENTS.md`, `CLAUDE.md` або інші впроваджені файли контексту) наближаються до налаштованого бюджету символів або перевищують його. Він повідомляє сирі й впроваджені кількості символів для кожного файла, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість впроваджених символів як частку загального бюджету. Коли файли обрізано або вони близько до ліміту, doctor друкує поради з налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілого Plugin каналу">
    Коли `openclaw doctor --fix` видаляє відсутній Plugin каналу, він також видаляє завислу конфігурацію в межах каналу, яка посилалася на цей Plugin: записи `channels.<id>`, цілі Heartbeat, що називали канал, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає циклам завантаження Gateway, коли runtime каналу зник, але конфігурація все ще просить gateway привʼязатися до нього.
  </Accordion>
  <Accordion title="11c. Автодоповнення оболонки">
    Doctor перевіряє, чи встановлено автодоповнення табуляцією для поточної оболонки (zsh, bash, fish або PowerShell):

    - Якщо профіль оболонки використовує повільний динамічний шаблон автодоповнення (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта кешованого файла.
    - Якщо автодоповнення налаштовано в профілі, але файл кешу відсутній, doctor автоматично регенерує кеш.
    - Якщо автодоповнення взагалі не налаштовано, doctor пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність автентифікації локального токена gateway.

    - Якщо режим токена потребує токена, а джерела токена немає, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає й не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує лише тоді, коли не налаштовано жодного SecretRef токена.

  </Accordion>
  <Accordion title="12b. Відновлення лише для читання з урахуванням SecretRef">
    Деяким потокам відновлення потрібно перевіряти налаштовані облікові дані, не послаблюючи fail-fast поведінку runtime.

    - `openclaw doctor --fix` тепер використовує ту саму модель зведення SecretRef лише для читання, що й команди сімейства status, для цільових відновлень конфігурації.
    - Приклад: відновлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані бота, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає автоматичне розвʼязання замість аварійного завершення або хибного повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Перевірка здоровʼя Gateway + перезапуск">
    Doctor запускає перевірку здоровʼя й пропонує перезапустити gateway, коли він здається нездоровим.
  </Accordion>
  <Accordion title="13b. Готовність пошуку памʼяті">
    Doctor перевіряє, чи налаштований провайдер embedding для пошуку памʼяті готовий для стандартного агента. Поведінка залежить від налаштованого backend і провайдера:

    - **Бекенд QMD**: перевіряє, чи доступний і чи може запускатися бінарний файл `qmd`. Якщо ні, виводить рекомендації з виправлення, зокрема npm-пакет і варіант ручного шляху до бінарного файлу.
    - **Явний локальний провайдер**: перевіряє наявність локального файлу моделі або розпізнаної URL-адреси віддаленої/доступної для завантаження моделі. Якщо відсутня, пропонує перейти на віддаленого провайдера.
    - **Явний віддалений провайдер** (`openai`, `voyage` тощо): перевіряє, чи є API-ключ у середовищі або сховищі автентифікації. Якщо його немає, виводить практичні підказки для виправлення.
    - **Автоматичний провайдер**: спочатку перевіряє доступність локальної моделі, а потім пробує кожного віддаленого провайдера в порядку автоматичного вибору.

    Коли доступний кешований результат перевірки Gateway (Gateway був справний на момент перевірки), doctor зіставляє його результат із конфігурацією, видимою для CLI, і зазначає будь-які розбіжності. Doctor не запускає новий embedding ping на стандартному шляху; використовуйте команду глибокого статусу пам’яті, коли потрібна жива перевірка провайдера.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embeddings під час виконання.

  </Accordion>
  <Accordion title="14. Попередження стану каналів">
    Якщо Gateway справний, doctor запускає перевірку стану каналів і повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит конфігурації супервізора + відновлення">
    Doctor перевіряє встановлену конфігурацію супервізора (launchd/systemd/schtasks) на відсутні або застарілі стандартні налаштування (наприклад, залежності systemd від network-online і затримку перезапуску). Коли він знаходить невідповідність, рекомендує оновлення й може переписати файл служби/завдання до поточних стандартних налаштувань.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації супервізора.
    - `openclaw doctor --yes` приймає стандартні запити на відновлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує власні конфігурації супервізора.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише читання для життєвого циклу служби Gateway. Він усе ще повідомляє стан служби й виконує відновлення, не пов’язані зі службою, але пропускає встановлення/запуск/перезапуск/bootstrap служби, переписування конфігурації супервізора та очищення застарілих служб, оскільки цим життєвим циклом керує зовнішній супервізор.
    - У Linux doctor не переписує метадані команди/точки входу, поки відповідний systemd-unit Gateway активний. Він також ігнорує неактивні додаткові не-застарілі units, схожі на Gateway, під час сканування дубльованих служб, щоб допоміжні файли служб не створювали зайвого шуму під час очищення.
    - Якщо token auth потребує токена, а `gateway.auth.token` керується SecretRef, встановлення/відновлення служби doctor перевіряє SecretRef, але не зберігає розв’язані значення токена у відкритому тексті в метаданих середовища служби супервізора.
    - Doctor виявляє керовані значення середовища служби на основі `.env`/SecretRef, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудували inline, і переписує метадані служби так, щоб ці значення завантажувалися з runtime-джерела, а не з визначення супервізора.
    - Doctor виявляє, коли команда служби все ще фіксує старий `--port` після змін `gateway.port`, і переписує метадані служби на поточний порт.
    - Якщо token auth потребує токена, а налаштований token SecretRef не розв’язується, doctor блокує шлях встановлення/відновлення з практичними рекомендаціями.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/відновлення, доки режим не буде задано явно.
    - Для Linux user-systemd units перевірки розбіжностей токенів doctor тепер охоплюють джерела і `Environment=`, і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Відновлення служби doctor відмовляється переписувати, зупиняти або перезапускати службу Gateway зі старішого бінарного файлу OpenClaw, коли конфігурацію востаннє було записано новішою версією. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway + порту">
    Doctor перевіряє runtime служби (PID, останній код виходу) і попереджає, коли службу встановлено, але вона фактично не працює. Він також перевіряє конфлікти портів на порту Gateway (стандартно `18789`) і повідомляє ймовірні причини (Gateway уже працює, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли служба Gateway працює на Bun або шляху Node, керованому версіями (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджерів версій можуть ламатися після оновлень, бо служба не завантажує ініціалізацію вашої shell. Doctor пропонує мігрувати на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нововстановлені або відновлені macOS LaunchAgents використовують канонічний системний PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) замість копіювання інтерактивного shell PATH, тому Volta, asdf, fnm, pnpm та інші каталоги менеджерів версій не змінюють, який Node визначають дочірні процеси. Служби Linux усе ще зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні каталоги user-bin, але вгадані fallback-каталоги менеджерів версій записуються до PATH служби лише тоді, коли ці каталоги існують на диску.

  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає будь-які зміни конфігурації й ставить позначку в метаданих майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (backup + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, коли її немає, і виводить пораду щодо backup, якщо робочий простір ще не перебуває під керуванням git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури робочого простору та backup у git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
