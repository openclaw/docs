---
read_when:
    - Потрібна докладна поведінка для openclaw onboard
    - Ви налагоджуєте результати онбордингу або інтегруєте клієнти онбордингу.
sidebarTitle: CLI reference
summary: Повний довідник щодо потоку налаштування CLI, налаштування автентифікації/моделі, виводів і внутрішньої реалізації
title: Довідник налаштування CLI
x-i18n:
    generated_at: "2026-06-27T18:22:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6e46c81dd51ee9f1ce492dedc2911d449f507a136bd8805bc157915684a1941
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Ця сторінка є повним довідником для `openclaw onboard`.
Короткий посібник див. у [Онбординг (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (типово) проводить вас через:

- Налаштування моделі й автентифікації (OAuth для підписки OpenAI Code, Anthropic Claude CLI або API-ключ, а також опції MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування робочого простору та початкові файли
- Налаштування Gateway (порт, bind, автентифікація, Tailscale)
- Канали й провайдери (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage та інші вбудовані Plugin каналів)
- Встановлення демона (LaunchAgent, користувацький systemd unit або нативне завдання Windows Scheduled Task із резервним варіантом через папку Startup)
- Перевірка стану
- Налаштування Skills

Віддалений режим налаштовує цю машину для підключення до Gateway в іншому місці.
Він не встановлює й не змінює нічого на віддаленому хості.

## Деталі локального потоку

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Reset (або не передасте `--reset`).
    - CLI `--reset` типово має значення `config+creds+sessions`; використовуйте `--reset-scope full`, щоб також видалити робочий простір.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється й просить запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` і пропонує області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сеанси
      - Повне скидання (також видаляє робочий простір)

  </Step>
  <Step title="Модель і автентифікація">
    - Повна матриця опцій наведена в [Опції автентифікації та моделей](#auth-and-model-options).

  </Step>
  <Step title="Робочий простір">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Додає початкові файли робочого простору, потрібні для ритуалу першого запуску.
    - Структура робочого простору: [Робочий простір агента](/uk/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Запитує порт, bind, режим автентифікації та експонування через Tailscale.
    - Рекомендовано: залиште токен-автентифікацію ввімкненою навіть для loopback, щоб локальні WS-клієнти мусили автентифікуватися.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти токен у відкритому тексті** (типово)
      - **Використати SecretRef** (за явним вибором)
    - У режимі пароля інтерактивне налаштування також підтримує зберігання у відкритому тексті або через SecretRef.
    - Неінтерактивний шлях SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої змінної середовища в оточенні процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо ви повністю довіряєте кожному локальному процесу.
    - Bind не на loopback усе одно потребують автентифікації.

  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR
    - [Telegram](/uk/channels/telegram): токен бота
    - [Discord](/uk/channels/discord): токен бота
    - [Google Chat](/uk/channels/googlechat): JSON сервісного облікового запису + аудиторія Webhook
    - [Mattermost](/uk/channels/mattermost): токен бота + базовий URL
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису
    - [iMessage](/uk/channels/imessage): шлях до CLI `imsg` + доступ до Messages DB; використовуйте SSH-обгортку, коли Gateway працює не на Mac
    - Безпека DM: типово використовується сполучення. Перший DM надсилає код; підтвердьте через
      `openclaw pairing approve <channel> <code>` або використайте списки дозволених.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потребує сеансу користувача, що ввійшов у систему; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: користувацький systemd unit
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб Gateway залишався активним після виходу.
      - Може попросити sudo (записує `/var/lib/systemd/linger`); спершу пробує без sudo.
    - Нативна Windows: спочатку Scheduled Task
      - Якщо створення завдання заборонено, OpenClaw повертається до користувацького елемента входу в папці Startup і негайно запускає Gateway.
      - Scheduled Tasks залишаються рекомендованими, бо надають кращий статус супервізора.
    - Вибір runtime: Node (рекомендовано; потрібно для WhatsApp і Telegram). Bun не рекомендовано.

  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає live-перевірку стану Gateway до виводу статусу, включно з перевірками каналів, якщо вони підтримуються.

  </Step>
  <Step title="Skills">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер Node: npm, pnpm або bun.
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).

  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, включно з опціями застосунків для iOS, Android і macOS.

  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер друкує інструкції SSH port-forward для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, майстер намагається зібрати їх; резервний варіант — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Деталі віддаленого режиму

Віддалений режим налаштовує цю машину для підключення до Gateway в іншому місці.

<Info>
Віддалений режим не встановлює й не змінює нічого на віддаленому хості.
</Info>

Що ви задаєте:

- URL віддаленого Gateway (`ws://...`)
- Токен, якщо для віддаленого Gateway потрібна автентифікація (рекомендовано)

<Note>
- Якщо Gateway доступний лише через loopback, використовуйте SSH-тунелювання або tailnet.
- Підказки виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Опції автентифікації та моделей

<AccordionGroup>
  <Accordion title="API-ключ Anthropic">
    Використовує `ANTHROPIC_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його для використання демоном.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Браузерний потік; вставте `code#state`.

    Встановлює `agents.defaults.model` на `openai/gpt-5.5` через runtime Codex, коли модель не задано або вона вже належить до родини OpenAI.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (сполучення пристрою)">
    Браузерний потік сполучення з короткочасним кодом пристрою.

    Встановлює `agents.defaults.model` на `openai/gpt-5.5` через runtime Codex, коли модель не задано або вона вже належить до родини OpenAI.

  </Accordion>
  <Accordion title="API-ключ OpenAI">
    Використовує `OPENAI_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає облікові дані в профілях автентифікації.

    Встановлює `agents.defaults.model` на `openai/gpt-5.5`, коли модель не задано, має вигляд `openai/*` або є застарілим посиланням на модель Codex.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Браузерний вхід для відповідних облікових записів SuperGrok або X Premium. Це
    рекомендований шлях xAI для більшості користувачів. OpenClaw зберігає отриманий профіль
    автентифікації для моделей Grok, Grok `web_search`, `x_search` і `code_execution`.
  </Accordion>
  <Accordion title="xAI (Grok) код пристрою">
    Зручний для віддаленого використання браузерний вхід із коротким кодом замість callback
    localhost. Використовуйте це з SSH, Docker або VPS-хостів.
  </Accordion>
  <Accordion title="API-ключ xAI (Grok)">
    Запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделей. Використовуйте це,
    коли потрібен API-ключ xAI Console замість OAuth за підпискою.
  </Accordion>
  <Accordion title="OpenCode">
    Запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дає змогу вибрати каталог Zen або Go.
    URL налаштування: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-ключ (загальний)">
    Зберігає ключ для вас.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Запитує `AI_GATEWAY_API_KEY`.
    Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Запитує ID облікового запису, ID gateway і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфігурація записується автоматично. Hosted-типовим є `MiniMax-M3`; налаштування з API-ключем використовує
    `minimax/...`, а налаштування OAuth використовує `minimax-portal/...`.
    Докладніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація записується автоматично для StepFun standard або Step Plan на китайських чи глобальних endpoints.
    Standard наразі включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    Докладніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    Запитує `SYNTHETIC_API_KEY`.
    Докладніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud і локальні відкриті моделі)">
    Спочатку запитує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` з `https://ollama.com`.
    Режими на основі хоста запитують базовий URL (типово `http://127.0.0.1:11434`), виявляють доступні моделі та пропонують типові варіанти.
    `Cloud + Local` також перевіряє, чи цей хост Ollama ввійшов для доступу до cloud.
    Докладніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Користувацький провайдер">
    Працює з OpenAI-сумісними та Anthropic-сумісними endpoints.

    Інтерактивний онбординг підтримує ті самі варіанти зберігання API-ключа, що й інші потоки API-ключів провайдерів:
    - **Вставити API-ключ зараз** (відкритий текст)
    - **Використати посилання на секрет** (env ref або налаштований provider ref із попередньою перевіркою)

    Неінтерактивні прапорці:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; повертається до `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (необов’язково; типово `openai`)
    - `--custom-image-input` / `--custom-text-input` (необов’язково; перевизначає виведену можливість введення моделі)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає автентифікацію неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделі:

- Виберіть типову модель із виявлених опцій або введіть провайдера й модель вручну.
- Онбординг користувацького провайдера виводить підтримку зображень для поширених ID моделей і запитує лише тоді, коли назва моделі невідома.
- Коли онбординг починається з вибору автентифікації провайдера, селектор моделей автоматично надає перевагу
  цьому провайдеру. Для Volcengine і BytePlus така сама перевага
  також відповідає їхнім варіантам coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо фільтр бажаного провайдера був би порожнім, селектор повертається до
  повного каталогу замість показу відсутності моделей.
- Майстер запускає перевірку моделі й попереджає, якщо налаштована модель невідома або не має автентифікації.

Шляхи облікових даних і профілів:

- Профілі автентифікації (API-ключі + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт застарілого OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Типова поведінка onboarding зберігає API-ключі як відкритий текст у профілях автентифікації.
- `--secret-input-mode ref` вмикає режим посилань замість зберігання ключів відкритим текстом.
  В інтерактивному налаштуванні можна вибрати один із варіантів:
  - посилання на змінну середовища (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - посилання на налаштований провайдер (`file` або `exec`) з псевдонімом провайдера + id
- Інтерактивний режим посилань виконує швидку попередню перевірку перед збереженням.
  - Посилання env: перевіряє назву змінної + непорожнє значення в поточному середовищі onboarding.
  - Посилання на провайдер: перевіряє конфігурацію провайдера й розв’язує запитаний id.
  - Якщо попередня перевірка не вдається, onboarding показує помилку й дає змогу повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` підтримується лише через env.
  - Задайте env-змінну провайдера в середовищі процесу onboarding.
  - Inline-прапорці ключів (наприклад `--openai-api-key`) вимагають, щоб ця env-змінна була задана; інакше onboarding швидко завершується з помилкою.
  - Для користувацьких провайдерів неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У цьому випадку користувацького провайдера `--custom-api-key` вимагає, щоб `CUSTOM_API_KEY` було задано; інакше onboarding швидко завершується з помилкою.
- Облікові дані автентифікації Gateway підтримують вибір відкритого тексту та SecretRef в інтерактивному налаштуванні:
  - Режим токена: **Згенерувати/зберегти токен відкритим текстом** (типово) або **Використати SecretRef**.
  - Режим пароля: відкритий текст або SecretRef.
- Неінтерактивний шлях SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні налаштування з відкритим текстом продовжують працювати без змін.

<Note>
Порада для headless і серверів: завершіть OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний шлях
`$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
є лише застарілим джерелом імпорту.
</Note>

## Виводи та внутрішні дані

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, коли передано `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний onboarding типово використовує `"coding"`, якщо не задано; наявні явно задані значення зберігаються)
- `gateway.*` (режим, прив’язка, автентифікація, tailscale)
- `session.dmScope` (локальний onboarding типово задає це як `per-channel-peer`, якщо не задано; наявні явно задані значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- allowlist каналів (Slack, Discord, Matrix, Microsoft Teams), коли ви погоджуєтеся під час підказок (назви за можливості розв’язуються в ID)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручна конфігурація й надалі може пізніше задати `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp розміщуються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як plugins. Коли їх вибрано під час налаштування, wizard
пропонує встановити plugin (npm або локальний шлях) перед конфігурацією каналу.
</Note>

RPC wizard Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (застосунок macOS і Control UI) можуть відображати кроки без повторної реалізації логіки onboarding.

Поведінка налаштування Signal:

- Завантажує відповідний release asset
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- Збірки JVM потребують Java 21
- Нативні збірки використовуються, коли доступні
- Windows використовує WSL2 і виконує Linux-потік signal-cli всередині WSL

## Пов’язані документи

- Центр onboarding: [Onboarding (CLI)](/uk/start/wizard)
- Автоматизація та скрипти: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Довідник команд: [`openclaw onboard`](/uk/cli/onboard)
