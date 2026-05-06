---
read_when:
    - Додавання або змінення міграцій doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки працездатності, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-05-06T12:49:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент ремонту + міграції для OpenClaw. Він виправляє застарілі конфігурацію/стан, перевіряє справність і надає дієві кроки ремонту.

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

    Прийняти стандартні значення без запитів (зокрема кроки ремонту перезапуску/служби/пісочниці, коли застосовно).

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

    Запустити без запитів і застосувати лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії перезапуску/служби/пісочниці, які потребують підтвердження людини. Міграції застарілого стану запускаються автоматично, коли їх виявлено.

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
    - Міграція конфігурації Talk із застарілих пласких полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій розширення Chrome та готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення OAuth Codex (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для OAuth-профілів OpenAI Codex.
    - Попередження щодо списку дозволених Plugin/інструментів, коли `plugins.allow` є обмежувальним, але політика інструментів усе ще запитує wildcard або інструменти, що належать Plugin.
    - Міграція застарілого стану на диску (sessions/каталог агента/автентифікація WhatsApp).
    - Міграція ключів застарілого контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища cron (`jobId`, `schedule.cron`, поля доставки/корисного навантаження верхнього рівня, `provider` у корисному навантаженні, прості fallback-завдання webhook із `notify: true`).
    - Міграція застарілої runtime-policy агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли Plugin увімкнено; коли `plugins.enabled=false`, застарілі посилання на Plugin вважаються інертною конфігурацією обмеження і зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файлів блокування сесій і очищення застарілих блокувань.
    - Ремонт transcript сесій для дубльованих гілок переписування prompt, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для відновлення перезапуску завислого субагента з підтримкою `--fix` для очищення застарілих прапорців перерваного відновлення, щоб запуск не продовжував вважати дочірній процес перерваним під час перезапуску.
    - Перевірки цілісності стану та дозволів (sessions, transcripts, каталог стану).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Справність автентифікації моделі: перевіряє завершення терміну OAuth, може оновлювати токени, термін яких спливає, і повідомляє стани cooldown/disabled auth-profile.
    - Виявлення додаткового каталогу робочого простору (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, служби та супервізори">
    - Ремонт образу пісочниці, коли sandboxing увімкнено.
    - Міграція застарілої служби та виявлення додаткових gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime Gateway (службу встановлено, але вона не працює; кешована мітка launchd).
    - Попередження про стан каналу (перевірені з запущеного gateway).
    - Перевірки швидкості відповіді WhatsApp для погіршеного стану event-loop Gateway з локальними TUI-клієнтами, що все ще працюють; `--fix` зупиняє лише перевірені локальні TUI-клієнти.
    - Ремонт маршруту Codex для застарілих посилань на модель `openai-codex/*` в основних моделях, fallback, перевизначеннях heartbeat/субагента/compaction, hooks, перевизначеннях моделі каналу та закріпленнях маршруту сесії; `--fix` переписує їх на `openai/*` і вибирає `agentRuntime.id: "codex"` лише коли Plugin Codex встановлено, увімкнено, він надає harness `codex` і має придатний OAuth. Інакше він вибирає `agentRuntime.id: "pi"`.
    - Аудит конфігурації супервізора (launchd/systemd/schtasks) з необов’язковим ремонтом.
    - Очищення середовища вбудованого проксі для служб gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час встановлення або оновлення.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи version-manager).
    - Діагностика конфлікту портів Gateway (стандартний `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та сполучення">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли джерела токена немає; не перезаписує конфігурації token SecretRef).
    - Виявлення проблем сполучення пристрою (очікувані запити першого сполучення, очікувані підвищення ролі/обсягу, drift застарілого локального cache device-token та drift автентифікації paired-record).

  </Accordion>
  <Accordion title="Робочий простір і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файла робочого простору (попередження про усічення/наближення до ліміту для файлів контексту).
    - Перевірка готовності Skills для стандартного агента; повідомляє дозволені skills з відсутніми binaries, env, config або вимогами до ОС, а `--fix` може вимкнути недоступні skills у `skills.entries`.
    - Перевірка стану shell completion і автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера embeddings для пошуку пам’яті (локальна модель, ключ remote API або QMD binary).
    - Перевірки source install (невідповідність pnpm workspace, відсутні UI assets, відсутній tsx binary).
    - Записує оновлену конфігурацію + metadata майстра.

  </Accordion>
</AccordionGroup>

## Backfill і reset Dreams UI

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для grounded dreaming workflow. Ці дії використовують RPC-методи в стилі gateway doctor, але вони **не** є частиною ремонту/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному робочому просторі, запускає прохід grounded REM diary і записує оборотні записи backfill у `DREAMS.md`.
- **Reset** видаляє лише ці позначені записи backfill diary з `DREAMS.md`.
- **Clear Grounded** видаляє лише staged короткострокові записи grounded-only, що походять з історичного replay і ще не накопичили live recall або daily support.

Чого вони самі собою **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не додають автоматично grounded candidates до live short-term promotion store, якщо ви явно не запустите спочатку staged CLI path

Якщо ви хочете, щоб grounded historical replay впливав на звичайний deep promotion lane, натомість використовуйте CLI flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це додає grounded durable candidates до short-term dreaming store, залишаючи `DREAMS.md` поверхнею перегляду.

## Детальна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-встановлення)">
    Якщо це git checkout і doctor працює інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх у поточну схему.

    Це включає застарілі пласкі поля Talk. Поточна публічна конфігурація speech Talk — це `talk.provider` + `talk.providers.<provider>`, а конфігурація realtime voice — `talk.realtime.*`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у map провайдера, а також переписує застарілі realtime selectors верхнього рівня (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) у `talk.realtime`.

    Doctor також попереджає, коли `plugins.allow` не порожній і політика інструментів використовує
    wildcard або записи інструментів, що належать Plugin. `tools.allow: ["*"]` відповідає лише інструментам
    з Plugin, які фактично завантажуються; він не обходить ексклюзивний allowlist Plugin.
    Doctor записує `plugins.bundledDiscovery: "compat"` для мігрованих
    застарілих конфігурацій allowlist, щоб зберегти наявну поведінку bundled provider, а
    потім вказує на суворіше налаштування `"allowlist"`.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися і просять вас запустити `openclaw doctor`.

    Doctor виконає таке:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже міграцію, яку він застосував.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Запуск Gateway відмовляється від застарілих форматів конфігурації та просить запустити `openclaw doctor --fix`; він не переписує `openclaw.json` під час запуску. Міграції сховища cron jobs також обробляються `openclaw doctor --fix`.

    Поточні міграції:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - конфігурації налаштованих каналів, у яких бракує політики видимих відповідей → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` верхнього рівня
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - застарілі `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - застарілі селектори Talk реального часу верхнього рівня (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Для каналів з іменованими `accounts`, але з поодинокими значеннями каналу верхнього рівня для одного акаунта, перенесіть ці значення, scoped до акаунта, у підвищений акаунт, вибраний для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видалити `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для тайм-аутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видалити `browser.relayBindHost` (застаріле налаштування ретранслятора розширення)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (під час запуску Gateway також пропускає провайдерів, у яких `api` встановлено в майбутнє або невідоме значення enum, замість закритого збою)

    Попередження doctor також містять настанови щодо типового акаунта для каналів із кількома акаунтами:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний акаунт.
    - Якщо `channels.<channel>.defaultAccount` встановлено на невідомий ID акаунта, doctor попереджає та перелічує налаштовані ID акаунтів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі на неправильний API або обнулити витрати. Doctor попереджає, щоб ви могли видалити перевизначення та відновити маршрутизацію API + витрати для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера та готовність Chrome MCP">
    Якщо ваша конфігурація браузера досі вказує на видалений шлях розширення Chrome, doctor нормалізує її до поточної моделі локального для хоста підключення Chrome MCP:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє локальний для хоста шлях Chrome MCP, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для типових профілів автопідключення
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує увімкнути віддалене налагодження на сторінці інспектування браузера (наприклад `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути налаштування на боці Chrome за вас. Локальний для хоста Chrome MCP усе ще потребує:

    - браузера на базі Chromium 144+ на хості gateway/node
    - локально запущеного браузера
    - увімкненого віддаленого налагодження в цьому браузері
    - підтвердження першого запиту згоди на підключення в браузері

    Готовність тут стосується лише передумов локального підключення. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, усе ще потребують керованого браузера або сирого профілю CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують сирий CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано OAuth-профіль OpenAI Codex, doctor перевіряє endpoint авторизації OpenAI, щоб переконатися, що локальний стек Node/OpenSSL TLS може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, протермінований сертифікат або самопідписаний сертифікат), doctor виводить настанови з виправлення для конкретної платформи. На macOS із Homebrew Node виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка виконується навіть якщо gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо ви раніше додали застарілі транспортні налаштування в `models.providers.openai-codex`, вони можуть затінити вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі транспортні налаштування разом із Codex OAuth, щоб ви могли видалити або переписати застаріле транспортне перевизначення й повернути вбудовану маршрутизацію/резервну поведінку. Користувацькі проксі та перевизначення лише заголовків усе ще підтримуються й не спричиняють цього попередження.
  </Accordion>
  <Accordion title="2f. Виправлення маршруту Codex">
    Doctor перевіряє наявність застарілих посилань на моделі `openai-codex/*`. Нативна маршрутизація harness Codex використовує канонічні посилання на моделі `openai/*` плюс `agentRuntime.id: "codex"`, щоб хід проходив через harness app-server Codex, а не шлях OpenClaw PI OpenAI.

    У режимі `--fix` / `--repair` doctor переписує зачеплені посилання типового агента й окремих агентів, зокрема основні моделі, резервні варіанти, перевизначення heartbeat/subagent/compaction, hooks, перевизначення моделей каналів і застарілий збережений стан маршруту сесії:

    - `openai-codex/gpt-*` стає `openai/gpt-*`.
    - Відповідне середовище виконання агента стає `agentRuntime.id: "codex"` лише коли Codex встановлено, увімкнено, він надає harness `codex` і має придатний OAuth.
    - В іншому разі відповідне середовище виконання агента стає `agentRuntime.id: "pi"`.
    - Наявні списки резервних моделей зберігаються з переписаними застарілими записами; скопійовані налаштування для окремих моделей переносяться із застарілого ключа до канонічного ключа `openai/*`.
    - Збережені сесійні `modelProvider`/`providerOverride`, `model`/`modelOverride`, сповіщення про резервні варіанти, прив’язки auth-profile та прив’язки harness Codex виправляються в усіх виявлених сховищах сесій агентів.
    - `/codex ...` означає «керувати або прив’язати нативну розмову Codex із чату».
    - `/acp ...` або `runtime: "acp"` означає «використати зовнішній адаптер ACP/acpx».

  </Accordion>
  <Accordion title="2g. Очищення маршруту сесії">
    Doctor також сканує виявлені сховища сесій агентів на застарілий автоматично створений стан маршруту після того, як ви перемістили налаштовані моделі або середовище виконання з маршруту, що належить Plugin, наприклад Codex.

    `openclaw doctor --fix` може очищати автоматично створений застарілий стан, як-от прив’язки моделей `modelOverrideSource: "auto"`, метадані моделей середовища виконання, закріплені ID harness, прив’язки CLI-сесій і автоматичні перевизначення auth-profile, коли маршрут-власник більше не налаштований. Явні користувацькі або застарілі сесійні вибори моделей повідомляються для ручного перегляду й залишаються без змін; перемкніть їх за допомогою `/model ...`, `/new` або скиньте сесію, коли цей маршрут більше не потрібен.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (розкладка на диску)">
    Doctor може мігрувати старіші розкладки на диску в поточну структуру:

    - Сховище сесій + transcripts:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілих `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID акаунта: `default`)

    Ці міграції виконуються best-effort і є ідемпотентними; doctor виводитиме попередження, коли залишатиме будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі сесії + каталог агента під час запуску, щоб історія/auth/models опинилися в шляху для кожного агента без ручного запуску doctor. Автентифікація WhatsApp навмисно мігрується лише через `openclaw doctor`. Нормалізація provider/provider-map для Talk тепер порівнює за структурною рівністю, тому розбіжності лише в порядку ключів більше не спричиняють повторних no-op змін `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів Plugin">
    Doctor сканує всі встановлені маніфести Plugin на застарілі ключі можливостей верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли їх знайдено, він пропонує перемістити їх в об’єкт `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища cron">
    Doctor також перевіряє сховище завдань cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, якщо перевизначено) на старі форми завдань, які планувальник усе ще приймає для сумісності.

    Поточні очищення cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - delivery-псевдоніми payload `provider` → явний `delivery.channel`
    - прості застарілі webhook-завдання fallback `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий резервний варіант notify з наявним режимом доставки не через webhook, doctor попереджає й залишає це завдання для ручного перегляду.

    У Linux doctor також попереджає, коли crontab користувача досі викликає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`. Цей локальний для хоста скрипт не підтримується поточним OpenClaw і може записувати хибні повідомлення `Gateway inactive` до `~/.openclaw/logs/whatsapp-health.log`, коли cron не може дістатися до користувацької шини systemd. Видаліть застарілий запис crontab за допомогою `crontab -e`; використовуйте `openclaw channels status --probe`, `openclaw doctor` і `openclaw gateway status` для поточних перевірок стану.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сеансів">
    Doctor сканує кожен каталог сеансу агента на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сеансу. Для кожного знайденого файлу блокування він повідомляє: шлях, PID, чи PID досі активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше друкує примітку й просить повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілки транскрипту сеансу">
    Doctor сканує JSONL-файли сеансів агента на наявність дубльованої форми гілки, створеної помилкою переписування транскрипту prompt від 2026.4.24: покинутий користувацький хід із внутрішнім runtime-контекстом OpenClaw плюс активний сусідній елемент із таким самим видимим користувацьким prompt. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файлу поруч з оригіналом і переписує транскрипт до активної гілки, щоб історія gateway і читачі пам’яті більше не бачили дубльованих ходів.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сеансів, маршрутизація та безпека)">
    Каталог стану — це операційний стрижень. Якщо він зникне, ви втратите сеанси, облікові дані, журнали й конфігурацію (якщо не маєте резервних копій деінде).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і виводить підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Каталог стану macOS, синхронізований із хмарою**: попереджає, коли стан визначається під iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, бо шляхи з синхронізацією можуть спричиняти повільніший I/O і перегони блокування/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан визначається на джерелі монтування `mmcblk*`, бо випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сеансів і облікових даних.
    - **Каталоги сеансів відсутні**: `sessions/` і каталог сховища сеансів потрібні для збереження історії та уникнення збоїв `ENOENT`.
    - **Невідповідність транскриптів**: попереджає, коли в нещодавніх записах сеансів відсутні файли транскриптів.
    - **Основний сеанс "1-line JSONL"**: позначає випадки, коли основний транскрипт має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли в різних домашніх каталогах існує кілька папок `~/.openclaw` або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділитися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запускати його на віддаленому хості (стан зберігається там).
    - **Дозволи конфігураційного файлу**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/усім, і пропонує посилити дозволи до `600`.

  </Accordion>
  <Accordion title="5. Стан авторизації моделей (закінчення OAuth)">
    Doctor перевіряє профілі OAuth у сховищі авторизації, попереджає, коли токени скоро закінчуються або вже закінчилися, і може оновити їх, коли це безпечно. Якщо профіль Anthropic OAuth/токена застарів, він пропонує API-ключ Anthropic або шлях setup-token Anthropic. Підказки оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth завершується остаточною помилкою (наприклад `refresh_token_reused`, `invalid_grant` або провайдер просить увійти знову), doctor повідомляє, що потрібна повторна авторизація, і друкує точну команду `openclaw models auth login --provider ...`, яку треба виконати.

    Doctor також повідомляє про профілі авторизації, що тимчасово непридатні через:

    - короткі паузи (обмеження частоти/тайм-аути/помилки авторизації)
    - довші вимкнення (помилки білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Перевірка моделі hooks">
    Якщо `hooks.gmail.model` задано, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли воно не розв’яжеться або заборонене.
  </Accordion>
  <Accordion title="7. Відновлення образу sandbox">
    Коли sandboxing увімкнено, doctor перевіряє Docker-образи й пропонує зібрати або перемкнутися на застарілі назви, якщо поточного образу бракує.
  </Accordion>
  <Accordion title="7b. Очищення встановлення Plugin">
    Doctor видаляє застарілий згенерований OpenClaw проміжний стан залежностей plugin у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Це охоплює застарілі згенеровані корені залежностей, старі каталоги етапу встановлення, локальні для пакета залишки з попереднього коду відновлення залежностей bundled-plugin, а також осиротілі або відновлені керовані npm-копії bundled `@openclaw/*` plugins, які можуть затіняти поточний bundled-маніфест.

    Doctor також може перевстановити відсутні завантажувані plugins, коли конфігурація посилається на них, але локальний реєстр plugin не може їх знайти. Приклади включають матеріальні `plugins.entries`, налаштовані параметри каналів/провайдерів/пошуку та налаштовані runtime агентів. Під час оновлень пакетів doctor уникає запуску відновлення plugin через менеджер пакетів, доки основний пакет замінюється; запустіть `openclaw doctor --fix` ще раз після оновлення, якщо налаштований plugin усе ще потребує відновлення. Запуск Gateway і перезавантаження конфігурації не запускають менеджери пакетів; встановлення plugin лишаються явною роботою doctor/install/update.

  </Accordion>
  <Accordion title="8. Міграції служби Gateway і підказки з очищення">
    Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити службу OpenClaw з використанням поточного порту gateway. Він також може сканувати додаткові gateway-подібні служби й друкувати підказки з очищення. Служби gateway OpenClaw з іменами профілів вважаються повноцінними й не позначаються як "додаткові."

    У Linux, якщо користувацька служба gateway відсутня, але існує системна служба gateway OpenClaw, doctor не встановлює другу користувацьку службу автоматично. Перевірте за допомогою `openclaw gateway status --deep` або `openclaw doctor --deep`, потім видаліть дублікат або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли системний supervisor керує життєвим циклом gateway.

  </Accordion>
  <Accordion title="8b. Міграція Startup Matrix">
    Коли обліковий запис каналу Matrix має очікувану або придатну до дії міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім виконує найкращі можливі кроки міграції: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки журналюються, а запуск продовжується. У режимі лише для читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Сполучення пристроїв і drift авторизації">
    Doctor тепер перевіряє стан сполучення пристроїв як частину звичайного проходу перевірки стану.

    Що він повідомляє:

    - очікувані запити першого сполучення
    - очікувані підвищення ролі для вже сполучених пристроїв
    - очікувані підвищення scope для вже сполучених пристроїв
    - виправлення невідповідності публічного ключа, коли id пристрою досі збігається, але ідентичність пристрою більше не збігається із затвердженим записом
    - сполучені записи, у яких бракує активного токена для затвердженої ролі
    - сполучені токени, scope яких вийшли за межі затвердженої базової лінії сполучення
    - локально кешовані записи device-token для поточної машини, що передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не схвалює запити сполучення автоматично й не виконує автоматичну ротацію токенів пристроїв. Натомість він друкує точні наступні кроки:

    - перегляньте очікувані запити за допомогою `openclaw devices list`
    - схваліть точний запит за допомогою `openclaw devices approve <requestId>`
    - виконайте ротацію нового токена за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видаліть і повторно схваліть застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину "already paired but still getting pairing required": doctor тепер відрізняє перше сполучення від очікуваних підвищень ролі/scope і від drift застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor видає попередження, коли провайдер відкритий для DM без allowlist або коли policy налаштовано небезпечно.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запуск відбувається як користувацька служба systemd, doctor забезпечує ввімкнення lingering, щоб gateway лишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан робочої області (skills, plugins і застарілі каталоги)">
    Doctor друкує підсумок стану робочої області для стандартного агента:

    - **Стан Skills**: рахує придатні Skills, Skills з відсутніми вимогами та Skills, заблоковані allowlist.
    - **Застарілі каталоги робочої області**: попереджає, коли `~/openclaw` або інші застарілі каталоги робочої області існують поруч із поточною робочою областю.
    - **Стан Plugin**: рахує ввімкнені/вимкнені/помилкові plugins; перелічує ID plugin для будь-яких помилок; повідомляє можливості bundle plugin.
    - **Попередження сумісності Plugin**: позначає plugins, які мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки часу завантаження, видані реєстром plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Doctor перевіряє, чи bootstrap-файли робочої області (наприклад `AGENTS.md`, `CLAUDE.md` або інші ін’єктовані файли контексту) близькі до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файлу сирі та ін’єктовані лічильники символів, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість ін’єктованих символів як частку від загального бюджету. Коли файли обрізані або близькі до ліміту, doctor друкує поради з налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілого channel plugin">
    Коли `openclaw doctor --fix` видаляє відсутній channel plugin, він також видаляє dangling конфігурацію в межах каналу, що посилалася на цей plugin: записи `channels.<id>`, цілі heartbeat, які називали канал, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає циклам запуску Gateway, коли runtime каналу зник, але конфігурація досі просить gateway прив’язатися до нього.
  </Accordion>
  <Accordion title="11c. Автодоповнення shell">
    Doctor перевіряє, чи встановлено tab completion для поточного shell (zsh, bash, fish або PowerShell):

    - Якщо профіль shell використовує повільний динамічний шаблон completion (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо completion налаштовано в профілі, але кеш-файл відсутній, doctor автоматично регенерує кеш.
    - Якщо completion взагалі не налаштовано, doctor пропонує встановити його (лише інтерактивний режим; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб регенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки авторизації Gateway (локальний токен)">
    Doctor перевіряє готовність авторизації локального gateway за токеном.

    - Якщо режим токена потребує токен і джерела токена немає, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає й не перезаписує його plaintext.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано token SecretRef.

  </Accordion>
  <Accordion title="12b. Виправлення з урахуванням SecretRef лише для читання">
    Деяким потокам виправлення потрібно перевіряти налаштовані облікові дані, не послаблюючи поведінку швидкого аварійного завершення під час виконання.

    - `openclaw doctor --fix` тепер використовує ту саму модель підсумку SecretRef лише для читання, що й команди сімейства status, для цільових виправлень конфігурації.
    - Приклад: виправлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані облікові дані бота, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає автоматичне розв’язання замість аварійного завершення або хибного повідомлення, що токен відсутній.

  </Accordion>
  <Accordion title="13. Перевірка стану Gateway + перезапуск">
    Doctor виконує перевірку стану й пропонує перезапустити Gateway, коли він виглядає несправним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку в пам’яті">
    Doctor перевіряє, чи налаштований постачальник ембедингів для пошуку в пам’яті готовий для типового агента. Поведінка залежить від налаштованого бекенда та постачальника:

    - **Бекенд QMD**: перевіряє, чи бінарний файл `qmd` доступний і може запускатися. Якщо ні, виводить інструкції з виправлення, зокрема npm-пакет і варіант ручного шляху до бінарного файлу.
    - **Явний локальний постачальник**: перевіряє наявність локального файлу моделі або розпізнаного віддаленого/завантажуваного URL моделі. Якщо його немає, пропонує перейти на віддаленого постачальника.
    - **Явний віддалений постачальник** (`openai`, `voyage` тощо): перевіряє, чи ключ API наявний у середовищі або сховищі автентифікації. Якщо його немає, виводить дієві підказки для виправлення.
    - **Автоматичний постачальник**: спочатку перевіряє доступність локальної моделі, а потім пробує кожного віддаленого постачальника в порядку автоматичного вибору.

    Коли доступний кешований результат перевірки Gateway (Gateway був справним на момент перевірки), doctor зіставляє його результат із конфігурацією, видимою для CLI, і зазначає будь-яку розбіжність. Doctor не запускає новий ping ембедингів у типовому шляху; використовуйте команду глибокого статусу пам’яті, коли потрібна жива перевірка постачальника.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність ембедингів під час виконання.

  </Accordion>
  <Accordion title="14. Попередження статусу каналу">
    Якщо Gateway справний, doctor запускає перевірку статусу каналу й повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит і виправлення конфігурації супервізора">
    Doctor перевіряє встановлену конфігурацію супервізора (launchd/systemd/schtasks) на відсутні або застарілі типові значення (наприклад, залежності systemd від network-online і затримку перезапуску). Коли він знаходить невідповідність, рекомендує оновлення й може переписати файл служби/завдання до поточних типових значень.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації супервізора.
    - `openclaw doctor --yes` приймає типові запити на виправлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації супервізора.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише для читання для життєвого циклу служби Gateway. Він усе ще повідомляє стан служби й виконує виправлення, не пов’язані зі службою, але пропускає встановлення/запуск/перезапуск/bootstrap служби, переписування конфігурації супервізора та очищення застарілих служб, оскільки цим життєвим циклом керує зовнішній супервізор.
    - У Linux doctor не переписує метадані команди/точки входу, поки відповідний systemd-unit Gateway активний. Він також ігнорує неактивні додаткові unit-и, схожі на Gateway, які не є застарілими, під час сканування дубльованих служб, щоб супутні файли служб не створювали шуму очищення.
    - Якщо автентифікація за токеном потребує токен і `gateway.auth.token` керується SecretRef, встановлення/виправлення служби doctor перевіряє SecretRef, але не зберігає розв’язані значення токена у відкритому тексті в метаданих середовища служби супервізора.
    - Doctor виявляє керовані значення середовища служби на основі `.env`/SecretRef, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудували inline, і переписує метадані служби так, щоб ці значення завантажувалися з джерела під час виконання, а не з визначення супервізора.
    - Doctor виявляє, коли команда служби все ще фіксує старий `--port` після змін `gateway.port`, і переписує метадані служби на поточний порт.
    - Якщо автентифікація за токеном потребує токен, а налаштований SecretRef токена не розв’язано, doctor блокує шлях встановлення/виправлення з дієвими інструкціями.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/виправлення, доки режим не буде встановлено явно.
    - Для Linux user-systemd unit-ів перевірки розбіжностей токенів doctor тепер враховують і джерела `Environment=`, і `EnvironmentFile=` під час порівняння метаданих автентифікації служби.
    - Виправлення служби doctor відмовляються переписувати, зупиняти або перезапускати службу Gateway зі старішого бінарного файлу OpenClaw, коли конфігурацію востаннє записала новіша версія. Див. [усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика виконання Gateway + порту">
    Doctor перевіряє runtime служби (PID, останній статус виходу) і попереджає, коли службу встановлено, але вона фактично не працює. Він також перевіряє конфлікти портів на порту Gateway (типово `18789`) і повідомляє ймовірні причини (Gateway уже запущено, SSH-тунель).
  </Accordion>
  <Accordion title="17. Найкращі практики виконання Gateway">
    Doctor попереджає, коли служба Gateway працює на Bun або шляху Node, керованому менеджером версій (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджерів версій можуть ламатися після оновлень, оскільки служба не завантажує ініціалізацію вашої оболонки. Doctor пропонує перейти на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нещодавно встановлені або виправлені macOS LaunchAgent-и використовують канонічний системний PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) замість копіювання PATH інтерактивної оболонки, тож Volta, asdf, fnm, pnpm та інші каталоги менеджерів версій не змінюють, який Node розв’язують дочірні процеси. Служби Linux усе ще зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні користувацькі bin-каталоги, але вгадані резервні каталоги менеджерів версій записуються до PATH служби лише тоді, коли ці каталоги існують на диску.

  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає всі зміни конфігурації й ставить мітку метаданих майстра для запису запуску doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочої області (резервна копія + система пам’яті)">
    Doctor пропонує систему пам’яті робочої області, коли її немає, і виводить пораду щодо резервного копіювання, якщо робоча область ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури робочої області та резервного копіювання в git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
