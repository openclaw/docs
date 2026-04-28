---
read_when:
    - Вам потрібен детальний опис поведінки для openclaw onboard
    - Ви налагоджуєте результати онбордингу або інтегруєте клієнти онбордингу
sidebarTitle: CLI reference
summary: Повний довідник щодо процесу налаштування CLI, налаштування автентифікації/моделі, вихідних даних і внутрішніх механізмів
title: Довідник із налаштування CLI
x-i18n:
    generated_at: "2026-04-28T11:26:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Ця сторінка є повним довідником для `openclaw onboard`.
Короткий посібник див. у [Онбординг (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (типовий) проводить вас через:

- Налаштування моделі й автентифікації (OAuth для підписки OpenAI Code, Anthropic Claude CLI або ключ API, а також варіанти MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування робочого простору та bootstrap-файли
- Налаштування Gateway (порт, прив’язка, автентифікація, Tailscale)
- Канали й провайдери (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles та інші вбудовані channel plugins)
- Встановлення демона (LaunchAgent, користувацький systemd unit або нативне Windows Scheduled Task із fallback до папки Startup)
- Перевірка стану
- Налаштування Skills

Віддалений режим налаштовує цю машину для підключення до Gateway в іншому місці.
Він нічого не встановлює і не змінює на віддаленому хості.

## Деталі локального потоку

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Reset (або не передасте `--reset`).
    - CLI `--reset` типово означає `config+creds+sessions`; використайте `--reset-scope full`, щоб також видалити робочий простір.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється й просить запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` і пропонує області:
      - Тільки конфігурація
      - Конфігурація + облікові дані + сесії
      - Повне скидання (також видаляє робочий простір)

  </Step>
  <Step title="Модель і автентифікація">
    - Повна матриця варіантів наведена в [Варіанти автентифікації та моделей](#auth-and-model-options).

  </Step>
  <Step title="Робочий простір">
    - Типово `~/.openclaw/workspace` (налаштовується).
    - Додає початкові файли робочого простору, потрібні для bootstrap ritual першого запуску.
    - Макет робочого простору: [Робочий простір агента](/uk/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Запитує порт, прив’язку, режим автентифікації та експонування через Tailscale.
    - Рекомендовано: залиште token auth увімкненою навіть для loopback, щоб локальні WS-клієнти мали автентифікуватися.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти plaintext token** (типово)
      - **Використати SecretRef** (за явним вибором)
    - У режимі пароля інтерактивне налаштування також підтримує зберігання plaintext або SecretRef.
    - Неінтерактивний шлях SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої змінної середовища в середовищі процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback усе одно потребують автентифікації.

  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий QR-вхід
    - [Telegram](/uk/channels/telegram): токен бота
    - [Discord](/uk/channels/discord): токен бота
    - [Google Chat](/uk/channels/googlechat): JSON сервісного акаунта + аудиторія webhook
    - [Mattermost](/uk/channels/mattermost): токен бота + базова URL-адреса
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація акаунта
    - [BlueBubbles](/uk/channels/bluebubbles): рекомендовано для iMessage; URL-адреса сервера + пароль + webhook
    - [iMessage](/uk/channels/imessage): застарілий шлях CLI `imsg` + доступ до БД
    - Безпека DM: типово використовується спарювання. Перший DM надсилає код; підтвердьте через
      `openclaw pairing approve <channel> <code>` або використайте списки дозволених.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потрібна активна сесія користувача; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: користувацький systemd unit
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб Gateway залишався запущеним після виходу.
      - Може попросити sudo (записує в `/var/lib/systemd/linger`); спершу пробує без sudo.
    - Нативна Windows: спочатку Scheduled Task
      - Якщо створення завдання заборонено, OpenClaw переходить до елемента входу в користувацькій папці Startup і негайно запускає Gateway.
      - Scheduled Tasks залишаються рекомендованими, бо надають кращий стан супервізора.
    - Вибір runtime: Node (рекомендовано; потрібно для WhatsApp і Telegram). Bun не рекомендовано.

  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає live health probe Gateway до виводу стану, включно з channel probes, коли підтримується.

  </Step>
  <Step title="Skills">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер node: npm, pnpm або bun.
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).

  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, включно з варіантами застосунків для iOS, Android і macOS.

  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер друкує інструкції SSH port-forward для Control UI замість відкриття браузера.
Якщо assets Control UI відсутні, майстер намагається їх зібрати; fallback — `pnpm ui:build` (автоматично встановлює UI deps).
</Note>

## Деталі віддаленого режиму

Віддалений режим налаштовує цю машину для підключення до Gateway в іншому місці.

<Info>
Віддалений режим нічого не встановлює і не змінює на віддаленому хості.
</Info>

Що ви задаєте:

- URL-адреса віддаленого Gateway (`ws://...`)
- Токен, якщо віддалений Gateway потребує автентифікації (рекомендовано)

<Note>
- Якщо Gateway доступний лише через loopback, використовуйте SSH-тунелювання або tailnet.
- Підказки виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Варіанти автентифікації та моделей

<AccordionGroup>
  <Accordion title="Ключ API Anthropic">
    Використовує `ANTHROPIC_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його для використання демоном.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Потік через браузер; вставте `code#state`.

    Встановлює `agents.defaults.model` у `openai-codex/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (спарювання пристрою)">
    Потік спарювання через браузер із короткочасним кодом пристрою.

    Встановлює `agents.defaults.model` у `openai-codex/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="Ключ API OpenAI">
    Використовує `OPENAI_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає облікові дані в auth profiles.

    Встановлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задана, `openai/*` або `openai-codex/*`.

  </Accordion>
  <Accordion title="Ключ API xAI (Grok)">
    Запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделей.
  </Accordion>
  <Accordion title="OpenCode">
    Запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дає змогу вибрати каталог Zen або Go.
    URL-адреса налаштування: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Ключ API (generic)">
    Зберігає ключ для вас.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Запитує `AI_GATEWAY_API_KEY`.
    Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Запитує ID акаунта, ID Gateway і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфігурація записується автоматично. Hosted default — `MiniMax-M2.7`; налаштування з ключем API використовує
    `minimax/...`, а налаштування OAuth використовує `minimax-portal/...`.
    Докладніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація записується автоматично для StepFun standard або Step Plan на китайських чи глобальних endpoints.
    Standard currently includes `step-3.5-flash`, and Step Plan also includes `step-3.5-flash-2603`.
    Докладніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    Запитує `SYNTHETIC_API_KEY`.
    Докладніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud і локальні відкриті моделі)">
    Спочатку запитує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` з `https://ollama.com`.
    Режими з підтримкою хоста запитують базову URL-адресу (типово `http://127.0.0.1:11434`), виявляють доступні моделі та пропонують типові варіанти.
    `Cloud + Local` також перевіряє, чи цей хост Ollama ввійшов для cloud access.
    Докладніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Користувацький провайдер">
    Працює з OpenAI-compatible і Anthropic-compatible endpoints.

    Інтерактивний онбординг підтримує ті самі варіанти зберігання ключа API, що й інші потоки ключів API провайдерів:
    - **Вставити ключ API зараз** (plaintext)
    - **Використати secret reference** (env ref або налаштований provider ref, із preflight validation)

    Неінтерактивні прапорці:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; fallback до `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|anthropic>` (необов’язково; типово `openai`)
    - `--custom-image-input` / `--custom-text-input` (необов’язково; перевизначає inferred model input capability)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає автентифікацію неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделі:

- Виберіть типову модель із виявлених варіантів або введіть провайдера й модель вручну.
- Онбординг користувацького провайдера виводить підтримку зображень для поширених ID моделей і запитує лише тоді, коли назва моделі невідома.
- Коли онбординг починається з вибору автентифікації провайдера, picker моделей автоматично надає перевагу
  цьому провайдеру. Для Volcengine і BytePlus та сама перевага
  також збігається з їхніми варіантами coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо цей preferred-provider filter був би порожнім, picker повертається до
  повного каталогу замість показу відсутності моделей.
- Майстер запускає перевірку моделі й попереджає, якщо налаштована модель невідома або бракує автентифікації.

Шляхи облікових даних і профілів:

- Auth profiles (ключі API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт legacy OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Типова поведінка онбордингу зберігає ключі API як plaintext values в auth profiles.
- `--secret-input-mode ref` вмикає reference mode замість зберігання plaintext key.
  В інтерактивному налаштуванні можна вибрати одне з:
  - посилання на змінну середовища (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - налаштований provider ref (`file` або `exec`) з provider alias + id
- Інтерактивний reference mode виконує швидку preflight validation перед збереженням.
  - Env refs: перевіряє назву змінної + непорожнє значення в поточному середовищі онбордингу.
  - Provider refs: перевіряє конфігурацію провайдера й resolve requested id.
  - Якщо preflight fails, онбординг показує помилку й дає змогу повторити.
- У неінтерактивному режимі `--secret-input-mode ref` підтримується лише через env.
  - Задайте provider env var у середовищі процесу онбордингу.
  - Inline key flags (наприклад `--openai-api-key`) потребують, щоб ця env var була задана; інакше онбординг швидко завершується з помилкою.
  - Для користувацьких провайдерів неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У цьому випадку користувацького провайдера `--custom-api-key` потребує, щоб `CUSTOM_API_KEY` був заданий; інакше онбординг швидко завершується з помилкою.
- Облікові дані автентифікації Gateway підтримують варіанти plaintext і SecretRef в інтерактивному налаштуванні:
  - Режим токена: **Згенерувати/зберегти plaintext token** (типово) або **Використати SecretRef**.
  - Режим пароля: plaintext або SecretRef.
- Неінтерактивний шлях SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні налаштування plaintext продовжують працювати без змін.

<Note>
Порада для безголового режиму та сервера: завершіть OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний шлях
`$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
є лише застарілим джерелом імпорту.
</Note>

## Виводи та внутрішні компоненти

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, коли передано `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальне початкове налаштування за замовчуванням використовує `"coding"`, якщо не задано; наявні явні значення зберігаються)
- `gateway.*` (режим, прив’язка, автентифікація, tailscale)
- `session.dmScope` (локальне початкове налаштування за замовчуванням задає це як `per-channel-peer`, якщо не задано; наявні явні значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Списки дозволених каналів (Slack, Discord, Matrix, Microsoft Teams), коли ви погоджуєтеся під час підказок (імена за можливості перетворюються на ID)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручна конфігурація все ще може пізніше встановити `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp розміщуються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сеанси зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як plugins. Коли їх вибрано під час налаштування, майстер
пропонує встановити plugin (npm або локальний шлях) перед конфігурацією каналу.
</Note>

RPC майстра Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (застосунок macOS і Control UI) можуть відображати кроки без повторної реалізації логіки початкового налаштування.

Поведінка налаштування Signal:

- Завантажує відповідний ресурс релізу
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- Збірки JVM потребують Java 21
- Нативні збірки використовуються, коли доступні
- Windows використовує WSL2 і дотримується потоку signal-cli для Linux всередині WSL

## Пов’язані документи

- Хаб початкового налаштування: [Початкове налаштування (CLI)](/uk/start/wizard)
- Автоматизація та скрипти: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Довідник команд: [`openclaw onboard`](/uk/cli/onboard)
