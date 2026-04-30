---
read_when:
    - Додавання або змінення міграцій doctor
    - Внесення несумісних змін до конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки стану, міграції конфігурації та кроки відновлення'
title: Діагностика
x-i18n:
    generated_at: "2026-04-30T13:47:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` — це інструмент відновлення та міграції для OpenClaw. Він виправляє застарілі конфігурацію й стан, перевіряє справність і надає практичні кроки для відновлення.

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

    Прийняти типові значення без запитів (зокрема кроки відновлення перезапуску/служби/пісочниці, коли застосовно).

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

    Застосувати також агресивні відновлення (перезаписує користувацькі конфігурації супервізора).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запустити без запитів і застосувати лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії з перезапуском/службою/пісочницею, які потребують підтвердження людини. Застарілі міграції стану запускаються автоматично, коли їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Просканувати системні служби на наявність додаткових інсталяцій Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо хочете переглянути зміни перед записом, спершу відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (зведення)

<AccordionGroup>
  <Accordion title="Справність, UI та оновлення">
    - Необов’язкове попереднє оновлення для git-інсталяцій (лише в інтерактивному режимі).
    - Перевірка актуальності протоколу UI (перезбирає Control UI, коли схема протоколу новіша).
    - Перевірка справності + запит на перезапуск.
    - Зведення стану Skills (придатні/відсутні/заблоковані) і стан Plugin.

  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих пласких полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції браузера для застарілих конфігурацій Chrome extension і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення Codex OAuth (`models.providers.openai-codex`).
    - Перевірка передумов OAuth TLS для профілів OpenAI Codex OAuth.
    - Міграція застарілого стану на диску (сеанси/каталог агентів/автентифікація WhatsApp).
    - Міграція застарілих ключів контракту маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, payload `provider`, прості резервні завдання webhook `notify: true`).
    - Міграція застарілої runtime-політики агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
    - Очищення застарілої конфігурації Plugin, коли plugins увімкнені; коли `plugins.enabled=false`, застарілі посилання на plugins розглядаються як інертна конфігурація ізоляції та зберігаються.

  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файлів блокування сеансів і очищення застарілих блокувань.
    - Відновлення транскриптів сеансів для дубльованих гілок переписування промптів, створених ураженими збірками 2026.4.24.
    - Виявлення tombstone для restart-recovery завислих субагентів із підтримкою `--fix` для очищення застарілих прапорців перерваного відновлення, щоб під час запуску дочірній процес не продовжував трактуватися як перерваний перезапуском.
    - Перевірки цілісності стану та дозволів (сеанси, транскрипти, каталог стану).
    - Перевірки дозволів файлу конфігурації (chmod 600) під час локального запуску.
    - Справність автентифікації моделей: перевіряє строк дії OAuth, може оновлювати токени, строк дії яких спливає, і повідомляє про стани cooldown/disabled auth-profile.
    - Виявлення додаткового каталогу робочого простору (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, служби та супервізори">
    - Відновлення образу пісочниці, коли пісочницю ввімкнено.
    - Міграція застарілих служб і виявлення додаткового Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки виконання Gateway (службу встановлено, але не запущено; кешована мітка launchd).
    - Попередження про стан каналу (перевіряються з активного Gateway).
    - Аудит конфігурації супервізора (launchd/systemd/schtasks) із необов’язковим відновленням.
    - Очищення середовища вбудованого проксі для служб Gateway, які захопили значення shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` під час інсталяції або оновлення.
    - Перевірки найкращих практик виконання Gateway (Node проти Bun, шляхи менеджера версій).
    - Діагностика конфліктів порту Gateway (типовий `18789`).

  </Accordion>
  <Accordion title="Автентифікація, безпека та сполучення">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли джерела токена не існує; не перезаписує конфігурації токена SecretRef).
    - Виявлення проблем зі сполученням пристроїв (очікувані перші запити на сполучення, очікувані оновлення ролі/області дії, дрейф застарілого локального кешу device-token і дрейф автентифікації paired-record).

  </Accordion>
  <Accordion title="Робочий простір і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файлу робочого простору (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка стану shell completion і автоматична інсталяція/оновлення.
    - Перевірка готовності провайдера embedding для пошуку пам’яті (локальна модель, ключ віддаленого API або бінарний файл QMD).
    - Перевірки інсталяції з вихідного коду (невідповідність pnpm workspace, відсутні UI-ресурси, відсутній бінарний файл tsx).
    - Записує оновлену конфігурацію + метадані майстра.

  </Accordion>
</AccordionGroup>

## Зворотне заповнення і скидання Dreams UI

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для workflow grounded dreaming. Ці дії використовують RPC-методи Gateway у стилі doctor, але вони **не** є частиною CLI-відновлення/міграції `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному робочому просторі, запускає grounded REM diary pass і записує оборотні записи зворотного заповнення в `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише ці позначені записи щоденника зворотного заповнення.
- **Clear Grounded** видаляє лише підготовлені короткострокові записи, призначені тільки для grounded, які походять з історичного відтворення й ще не накопичили live recall або daily support.

Чого вони самі по собі **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не готують автоматично grounded-кандидатів у live-сховище короткострокового просування, якщо ви спершу явно не запустите staged CLI path

Якщо хочете, щоб grounded historical replay впливав на звичайну lane глибокого просування, натомість використовуйте CLI-потік:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це готує grounded durable candidates у сховище short-term dreaming, залишаючи `DREAMS.md` поверхнею для перегляду.

## Детальна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-інсталяції)">
    Якщо це git checkout і doctor працює інтерактивно, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх до поточної схеми.

    Це включає застарілі пласкі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у мапу провайдерів.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися й просять запустити `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перепише `~/.openclaw/openclaw.json` з оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час запуску, коли виявляє застарілий формат конфігурації, тож застарілі конфігурації відновлюються без ручного втручання. Міграції сховища завдань Cron обробляються через `openclaw doctor --fix`.

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
    - Для каналів з іменованими `accounts`, але залишковими значеннями каналу верхнього рівня для одного акаунта, перемістити ці значення в області акаунта до підвищеного акаунта, вибраного для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - видалити `agents.defaults.llm`; використовуйте `models.providers.<id>.timeoutSeconds` для тайм-аутів повільних провайдерів/моделей
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видалити `browser.relayBindHost` (застаріле налаштування relay extension)
    - застаріле `models.providers.*.api: "openai"` → `"openai-completions"` (запуск gateway також пропускає провайдерів, у яких `api` встановлено на майбутнє або невідоме значення enum, замість того щоб завершуватися з помилкою)

    Попередження Doctor також містять рекомендації щодо типового акаунта для багатоакаунтних каналів:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що резервна маршрутизація може вибрати неочікуваний обліковий запис.
    - Якщо `channels.<channel>.defaultAccount` встановлено на невідомий ID облікового запису, doctor попереджає про це й перелічує налаштовані ID облікових записів.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може змусити моделі використовувати неправильний API або обнулити витрати. Doctor попереджає, щоб ви могли вилучити перевизначення й відновити маршрутизацію API та витрати для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція браузера та готовність Chrome MCP">
    Якщо ваша конфігурація браузера все ще вказує на вилучений шлях розширення Chrome, doctor нормалізує її до поточної моделі підключення Chrome MCP на локальному хості:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` вилучається

    Doctor також перевіряє шлях Chrome MCP на локальному хості, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для типових профілів автопідключення
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути віддалене налагодження на сторінці інспектування браузера (наприклад `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути налаштування на боці Chrome замість вас. Chrome MCP на локальному хості все ще потребує:

    - браузера на основі Chromium версії 144+ на хості Gateway/Node
    - локально запущеного браузера
    - увімкненого віддаленого налагодження в цьому браузері
    - схвалення першого запиту згоди на підключення в браузері

    Готовність тут стосується лише передумов локального підключення. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, усе ще потребують керованого браузера або сирого профілю CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless-потоків. Вони й надалі використовують сирий CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано OAuth-профіль OpenAI Codex, doctor перевіряє кінцеву точку авторизації OpenAI, щоб переконатися, що локальний стек TLS Node/OpenSSL може перевірити ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, протермінований сертифікат або самопідписаний сертифікат), doctor виводить рекомендації з виправлення для конкретної платформи. На macOS із Homebrew Node виправлення зазвичай таке: `brew postinstall ca-certificates`. З `--deep` перевірка виконується навіть тоді, коли gateway справний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо раніше ви додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть затіняти вбудований шлях провайдера Codex OAuth, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі налаштування транспорту поруч із Codex OAuth, щоб ви могли вилучити або переписати застаріле перевизначення транспорту й повернути вбудовану поведінку маршрутизації/резервування. Користувацькі проксі та перевизначення лише заголовків усе ще підтримуються й не спричиняють це попередження.
  </Accordion>
  <Accordion title="2f. Попередження маршрутів Plugin Codex">
    Коли ввімкнено bundled Plugin Codex, doctor також перевіряє, чи основні посилання на моделі `openai-codex/*` досі розв’язуються через типовий запуск PI. Таке поєднання чинне, коли ви хочете використовувати автентифікацію Codex OAuth/підписки через PI, але його легко сплутати з нативним app-server harness Codex. Doctor попереджає й указує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, бо обидва маршрути чинні:

    - `openai-codex/*` + PI означає "використовувати автентифікацію Codex OAuth/підписки через звичайний runner OpenClaw."
    - `openai/*` + `runtime: "codex"` означає "запустити вбудований turn через нативний app-server Codex."
    - `/codex ...` означає "керувати або прив’язати нативну розмову Codex із чату."
    - `/acp ...` або `runtime: "acp"` означає "використовувати зовнішній адаптер ACP/acpx."

    Якщо з’являється попередження, виберіть потрібний маршрут і відредагуйте конфігурацію вручну. Залиште попередження як є, коли PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (розкладка на диску)">
    Doctor може мігрувати старіші розкладки на диску в поточну структуру:

    - Сховище сесій + транскрипти:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - із застарілих `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID типового облікового запису: `default`)

    Ці міграції виконуються за принципом найкращого зусилля й є ідемпотентними; doctor видаватиме попередження, коли залишатиме будь-які застарілі папки як резервні копії. Gateway/CLI також автоматично мігрує застарілі сесії + каталог агента під час запуску, щоб історія/автентифікація/моделі потрапили в шлях для конкретного агента без ручного запуску doctor. Нормалізація провайдера розмови/мапи провайдерів тепер порівнює за структурною рівністю, тож відмінності лише в порядку ключів більше не спричиняють повторні no-op зміни `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів Plugin">
    Doctor сканує всі встановлені маніфести Plugin на наявність застарілих ключів можливостей верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Коли їх знайдено, він пропонує перемістити їх в об’єкт `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже має ті самі значення, застарілий ключ вилучається без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища Cron">
    Doctor також перевіряє сховище завдань Cron (`~/.openclaw/cron/jobs.json` за замовчуванням або `cron.store`, коли перевизначено) на наявність старих форм завдань, які планувальник досі приймає для сумісності.

    Поточні очищення Cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми delivery `provider` у payload → явний `delivery.channel`
    - прості застарілі резервні webhook-завдання `notify: true` → явний `delivery.mode="webhook"` із `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це без зміни поведінки. Якщо завдання поєднує застарілий резервний notify з наявним режимом доставки, що не є webhook, doctor попереджає й залишає це завдання для ручного перегляду.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сесій">
    Doctor сканує кожен каталог сесій агента на застарілі файли блокування запису — файли, що залишилися після аварійного завершення сесії. Для кожного знайденого файла блокування він повідомляє: шлях, PID, чи PID усе ще активний, вік блокування та чи вважається воно застарілим (мертвий PID або старше 30 хвилин). У режимі `--fix` / `--repair` він автоматично вилучає застарілі файли блокування; інакше друкує примітку й указує повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Виправлення гілок транскриптів сесій">
    Doctor сканує JSONL-файли сесій агента на дубльовану форму гілки, створену помилкою переписування prompt-транскриптів 2026.4.24: покинутий user turn із внутрішнім runtime-контекстом OpenClaw плюс активний sibling із тим самим видимим user prompt. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файла поруч з оригіналом і переписує транскрипт до активної гілки, щоб gateway-історія та зчитувачі пам’яті більше не бачили дубльовані turns.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сесій, маршрутизація та безпека)">
    Каталог стану — це операційний стовбур мозку. Якщо він зникне, ви втратите сесії, облікові дані, журнали й конфігурацію (якщо не маєте резервних копій деінде).

    Doctor перевіряє:

    - **Каталог стану відсутній**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Дозволи каталогу стану**: перевіряє можливість запису; пропонує виправити дозволи (і видає підказку `chown`, коли виявлено невідповідність власника/групи).
    - **Каталог стану macOS, синхронізований із хмарою**: попереджає, коли стан розв’язується під iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, бо шляхи з синхронізацією можуть спричиняти повільніший I/O та перегони блокування/синхронізації.
    - **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розв’язується до джерела монтування `mmcblk*`, бо випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час записів сесій та облікових даних.
    - **Каталоги сесій відсутні**: `sessions/` і каталог сховища сесій потрібні для збереження історії та уникнення аварій `ENOENT`.
    - **Невідповідність транскриптів**: попереджає, коли в нещодавніх записах сесій відсутні файли транскриптів.
    - **Основна сесія "1-line JSONL"**: позначає випадки, коли основний транскрипт має лише один рядок (історія не накопичується).
    - **Кілька каталогів стану**: попереджає, коли кілька папок `~/.openclaw` існують у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (історія може розділитися між встановленнями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запустити його на віддаленому хості (стан зберігається там).
    - **Дозволи файла конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групі/всім, і пропонує посилити дозволи до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделі (закінчення OAuth)">
    Doctor перевіряє OAuth-профілі в сховищі автентифікації, попереджає, коли токени невдовзі закінчуються або вже закінчилися, і може оновити їх, коли це безпечно. Якщо профіль Anthropic OAuth/токена застарів, він пропонує API-ключ Anthropic або шлях setup-token Anthropic. Запити на оновлення з’являються лише під час інтерактивного запуску (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth завершується остаточною помилкою (наприклад `refresh_token_reused`, `invalid_grant` або провайдер просить увійти знову), doctor повідомляє, що потрібна повторна автентифікація, і друкує точну команду `openclaw models auth login --provider ...`, яку треба виконати.

    Doctor також повідомляє про профілі автентифікації, які тимчасово непридатні до використання через:

    - короткі cooldowns (обмеження швидкості/тайм-аути/помилки автентифікації)
    - довші вимкнення (помилки білінгу/кредитів)

  </Accordion>
  <Accordion title="6. Перевірка моделі hooks">
    Якщо `hooks.gmail.model` задано, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли його не вдасться розв’язати або воно заборонене.
  </Accordion>
  <Accordion title="7. Відновлення образу sandbox">
    Коли sandboxing увімкнено, doctor перевіряє Docker-образи й пропонує зібрати їх або перейти на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Runtime-залежності вбудованих plugins">
    Doctor перевіряє runtime-залежності лише для вбудованих plugins, активних у поточній конфігурації або ввімкнених за замовчуванням у їхньому вбудованому manifest, наприклад `plugins.entries.discord.enabled: true`, застарілий `channels.discord.enabled: true`, налаштовані `models.providers.*` / посилання на моделі агентів або вбудований plugin, увімкнений за замовчуванням, без прив’язки до провайдера. Якщо чогось бракує, doctor повідомляє про пакети та встановлює їх у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Зовнішні plugins і далі використовують `openclaw plugins install` / `openclaw plugins update`; doctor не встановлює залежності для довільних шляхів plugins.

    Під час відновлення doctor встановлення npm runtime-залежностей вбудованих plugins показує перебіг через spinner у TTY-сесіях і періодичний рядковий прогрес у piped/headless-виводі. Gateway і локальний CLI також можуть на вимогу відновлювати runtime-залежності активних вбудованих plugins перед імпортом вбудованого plugin. Ці встановлення обмежені коренем встановлення runtime plugin, виконуються з вимкненими scripts, не записують package lock і захищені блокуванням кореня встановлення, щоб паралельні запуски CLI або Gateway не змінювали те саме дерево `node_modules` одночасно.

  </Accordion>
  <Accordion title="8. Міграції сервісу Gateway і підказки з очищення">
    Doctor виявляє застарілі сервіси gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити сервіс OpenClaw з поточним портом gateway. Він також може сканувати додаткові сервіси, схожі на gateway, і виводити підказки з очищення. Сервіси gateway OpenClaw, названі за профілем, вважаються повноцінними й не позначаються як "зайві."

    На Linux, якщо сервіс gateway рівня користувача відсутній, але існує сервіс gateway OpenClaw системного рівня, doctor не встановлює автоматично другий сервіс рівня користувача. Перевірте за допомогою `openclaw gateway status --deep` або `openclaw doctor --deep`, а потім видаліть дублікат або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли системний supervisor керує життєвим циклом gateway.

  </Accordion>
  <Accordion title="8b. Міграція Startup Matrix">
    Коли обліковий запис каналу Matrix має очікувану або придатну до виконання міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок перед міграцією, а потім запускає best-effort кроки міграції: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки записуються в журнал, а startup триває. У режимі лише для читання (`openclaw doctor` без `--fix`) цю перевірку повністю пропускають.
  </Accordion>
  <Accordion title="8c. Сполучення пристрою та розбіжність auth">
    Doctor тепер перевіряє стан device-pairing у межах звичайного проходу перевірки справності.

    Що він повідомляє:

    - очікувані запити першого сполучення
    - очікувані підвищення ролей для вже сполучених пристроїв
    - очікувані розширення scopes для вже сполучених пристроїв
    - відновлення невідповідності public-key, коли device id усе ще збігається, але ідентичність пристрою більше не відповідає схваленому запису
    - сполучені записи, яким бракує активного токена для схваленої ролі
    - сполучені токени, чиї scopes відхилилися від схваленого базового рівня сполучення
    - локальні кешовані записи device-token для поточної машини, що передують ротації токена на боці gateway або містять застарілі metadata scopes

    Doctor не схвалює автоматично запити сполучення і не ротуватиме device tokens автоматично. Натомість він виводить точні наступні кроки:

    - перегляньте очікувані запити за допомогою `openclaw devices list`
    - схваліть точний запит за допомогою `openclaw devices approve <requestId>`
    - згенеруйте свіжий токен ротацією за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видаліть і повторно схваліть застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину "уже сполучено, але все ще потрібне сполучення": doctor тепер відрізняє перше сполучення від очікуваних підвищень ролі/scope та від застарілого token/device-identity drift.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor видає попередження, коли provider відкритий для DM без allowlist або коли policy налаштовано небезпечним способом.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо виконується як systemd user service, doctor гарантує, що lingering увімкнено, щоб gateway залишався активним після logout.
  </Accordion>
  <Accordion title="11. Стан workspace (skills, plugins і застарілі каталоги)">
    Doctor виводить підсумок стану workspace для стандартного агента:

    - **Стан Skills**: кількість eligible, missing-requirements і allowlist-blocked skills.
    - **Застарілі workspace dirs**: попереджає, коли `~/openclaw` або інші застарілі workspace directories існують поряд із поточним workspace.
    - **Стан Plugin**: кількість увімкнених/вимкнених/помилкових plugins; перелік ідентифікаторів plugins для будь-яких помилок; повідомляє про можливості bundle plugin.
    - **Попередження сумісності Plugin**: позначає plugins, що мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує будь-які попередження або помилки під час завантаження, видані registry plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Doctor перевіряє, чи bootstrap-файли workspace (наприклад `AGENTS.md`, `CLAUDE.md` або інші injected context files) близькі до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файлу raw vs. injected кількість символів, відсоток truncation, причину truncation (`max/file` або `max/total`) і загальну кількість injected characters як частку загального бюджету. Коли файли truncated або близькі до ліміту, doctor виводить поради щодо налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Очищення застарілого plugin каналу">
    Коли `openclaw doctor --fix` видаляє відсутній plugin каналу, він також видаляє dangling channel-scoped config, що посилалася на цей plugin: записи `channels.<id>`, heartbeat targets, які називали канал, і перевизначення `agents.*.models["<channel>/*"]`. Це запобігає boot loops Gateway, коли runtime каналу зник, але config усе ще просить gateway прив’язатися до нього.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor перевіряє, чи встановлено tab completion для поточного shell (zsh, bash, fish або PowerShell):

    - Якщо profile shell використовує повільний dynamic completion pattern (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта cached file.
    - Якщо completion налаштовано в profile, але cache file відсутній, doctor автоматично регенерує cache.
    - Якщо completion взагалі не налаштовано, doctor пропонує встановити його (лише interactive mode; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб вручну регенерувати cache.

  </Accordion>
  <Accordion title="12. Перевірки auth Gateway (локальний токен)">
    Doctor перевіряє готовність локального token auth gateway.

    - Якщо token mode потребує token і джерела token не існує, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується SecretRef, але недоступний, doctor попереджає і не перезаписує його plaintext.
    - `openclaw doctor --generate-gateway-token` примусово генерує token лише тоді, коли token SecretRef не налаштовано.

  </Accordion>
  <Accordion title="12b. Відновлення з урахуванням SecretRef у режимі лише для читання">
    Деяким repair flows потрібно перевіряти налаштовані credentials без послаблення runtime fail-fast behavior.

    - `openclaw doctor --fix` тепер використовує ту саму read-only SecretRef summary model, що й status-family commands, для targeted config repairs.
    - Приклад: відновлення Telegram `allowFrom` / `groupAllowFrom` `@username` намагається використати налаштовані bot credentials, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному command path, doctor повідомляє, що credential configured-but-unavailable, і пропускає auto-resolution замість crash або помилкового повідомлення, що token відсутній.

  </Accordion>
  <Accordion title="13. Перевірка справності Gateway + restart">
    Doctor запускає health check і пропонує restart gateway, коли він виглядає unhealthy.
  </Accordion>
  <Accordion title="13b. Готовність пошуку пам’яті">
    Doctor перевіряє, чи налаштований embedding provider для memory search готовий для стандартного агента. Поведінка залежить від налаштованого backend і provider:

    - **QMD backend**: перевіряє, чи доступний і придатний до запуску binary `qmd`. Якщо ні, виводить інструкції з виправлення, зокрема npm package і можливість указати manual binary path.
    - **Явний local provider**: перевіряє local model file або розпізнаний remote/downloadable model URL. Якщо відсутній, пропонує перейти на remote provider.
    - **Явний remote provider** (`openai`, `voyage` тощо): перевіряє, чи API key присутній в environment або auth store. Якщо відсутній, виводить actionable fix hints.
    - **Auto provider**: спершу перевіряє доступність local model, а потім пробує кожен remote provider у порядку auto-selection.

    Коли доступний cached gateway probe result (gateway був healthy на момент перевірки), doctor зіставляє його результат із config, видимою для CLI, і зазначає будь-які розбіжності. Doctor не запускає свіжий embedding ping на стандартному path; використовуйте deep memory status command, коли потрібна live provider check.

    Використовуйте `openclaw memory status --deep`, щоб перевірити embedding readiness під час runtime.

  </Accordion>
  <Accordion title="14. Попередження стану каналу">
    Якщо gateway healthy, doctor запускає channel status probe і повідомляє попередження із запропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит конфігурації supervisor + відновлення">
    Doctor перевіряє встановлену supervisor config (launchd/systemd/schtasks) на відсутні або застарілі defaults (наприклад, systemd network-online dependencies і restart delay). Коли він знаходить невідповідність, рекомендує update і може переписати service file/task до поточних defaults.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед перезаписом конфігурації супервізора.
    - `openclaw doctor --yes` приймає типові запити на виправлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує власні конфігурації супервізора.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` залишає doctor у режимі лише читання для життєвого циклу сервісу Gateway. Він усе ще повідомляє про стан сервісу й виконує виправлення, не пов’язані із сервісом, але пропускає встановлення/запуск/перезапуск/bootstrap сервісу, перезаписи конфігурації супервізора та очищення застарілих сервісів, оскільки цим життєвим циклом керує зовнішній супервізор.
    - У Linux doctor не перезаписує метадані команди/точки входу, доки відповідний systemd-unit Gateway активний. Він також ігнорує неактивні додаткові gateway-подібні unit-файли, які не є застарілими, під час сканування дублікатів сервісів, щоб супутні файли сервісів не створювали зайвого шуму очищення.
    - Якщо автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, встановлення/виправлення сервісу doctor перевіряє SecretRef, але не зберігає розв’язані значення токена відкритим текстом у метадані середовища сервісу супервізора.
    - Doctor виявляє керовані значення середовища сервісу на основі `.env`/SecretRef, які старіші встановлення LaunchAgent, systemd або Windows Scheduled Task вбудовували inline, і перезаписує метадані сервісу так, щоб ці значення завантажувалися з джерела runtime замість визначення супервізора.
    - Doctor виявляє, коли команда сервісу все ще фіксує старий `--port` після зміни `gateway.port`, і перезаписує метадані сервісу на поточний порт.
    - Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не розв’язано, doctor блокує шлях встановлення/виправлення з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/виправлення, доки режим не буде задано явно.
    - Для Linux user-systemd units перевірки розбіжності токена doctor тепер включають джерела і `Environment=`, і `EnvironmentFile=` під час порівняння метаданих автентифікації сервісу.
    - Виправлення сервісу doctor відмовляються перезаписувати, зупиняти або перезапускати сервіс Gateway зі старішого бінарного файла OpenClaw, коли конфігурацію востаннє записала новіша версія. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повний перезапис через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика середовища виконання Gateway + порту">
    Doctor перевіряє runtime сервісу (PID, останній стан виходу) і попереджає, коли сервіс установлено, але фактично він не працює. Він також перевіряє конфлікти портів на порту Gateway (типово `18789`) і повідомляє ймовірні причини (Gateway уже запущено, SSH-тунель).
  </Accordion>
  <Accordion title="17. Рекомендовані практики середовища виконання Gateway">
    Doctor попереджає, коли сервіс Gateway працює на Bun або за керованим версіями шляхом Node (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджерів версій можуть ламатися після оновлень, бо сервіс не завантажує ініціалізацію вашої оболонки. Doctor пропонує перейти на системне встановлення Node, коли воно доступне (Homebrew/apt/choco).

    Нововстановлені або виправлені сервіси зберігають явні корені середовища (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) і стабільні користувацькі bin-каталоги, але вгадані fallback-каталоги менеджерів версій записуються до service PATH лише тоді, коли ці каталоги існують на диску. Це тримає згенерований supervisor PATH узгодженим із тим самим аудитом мінімального PATH, який doctor запускає пізніше.

  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає всі зміни конфігурації та ставить мітку метаданих майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервна копія + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, якщо її немає, і виводить пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб отримати повний посібник зі структури робочого простору та резервного копіювання git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
