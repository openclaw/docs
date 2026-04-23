---
read_when:
    - Вам потрібна детальна поведінка для `openclaw onboard`
    - Ви налагоджуєте результати онбордингу або інтегруєте клієнти онбордингу
sidebarTitle: CLI reference
summary: Повний довідник щодо процесу налаштування CLI, налаштування автентифікації/моделей, вихідних даних і внутрішньої будови
title: Довідник із налаштування CLI
x-i18n:
    generated_at: "2026-04-23T20:06:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5277842fa96eb49d07630c7c01831fc52edb1ad0f76bffe2926d6755a8a2fab2
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Довідник із налаштування CLI

Ця сторінка — повний довідник для `openclaw onboard`.
Короткий посібник дивіться в [Онбординг (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (за замовчуванням) проводить вас через:

- Налаштування моделі й автентифікації (OAuth підписки OpenAI Code, Anthropic Claude CLI або API key, а також параметри MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування workspace і bootstrap-файли
- Налаштування Gateway (порт, bind, автентифікація, Tailscale)
- Канали й провайдери (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles та інші комплектні channel plugins)
- Установлення демона (LaunchAgent, користувацький systemd unit або нативне завдання Windows Scheduled Task із резервним варіантом через папку Startup)
- Перевірку стану
- Налаштування Skills

Віддалений режим налаштовує цю машину для підключення до Gateway, розташованого в іншому місці.
Він не встановлює і не змінює нічого на віддаленому хості.

## Подробиці локального процесу

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Reset (або не передасте `--reset`).
    - CLI `--reset` за замовчуванням використовує `config+creds+sessions`; використовуйте `--reset-scope full`, щоб також видалити workspace.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється і просить запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` і пропонує такі області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повний скидання (також видаляє workspace)
  </Step>
  <Step title="Модель і автентифікація">
    - Повна матриця варіантів наведена в [Параметри автентифікації та моделей](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - За замовчуванням `~/.openclaw/workspace` (можна змінити).
    - Створює файли workspace, потрібні для bootstrap-ритуалу першого запуску.
    - Структура workspace: [Workspace агента](/uk/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Запитує порт, bind, режим автентифікації та експонування через Tailscale.
    - Рекомендовано: залишати автентифікацію токеном увімкненою навіть для loopback, щоб локальні WS-клієнти мали проходити автентифікацію.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти токен відкритим текстом** (за замовчуванням)
      - **Використати SecretRef** (за бажанням)
    - У режимі пароля інтерактивне налаштування також підтримує зберігання відкритим текстом або через SecretRef.
    - Неінтерактивний шлях для SecretRef токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої змінної середовища в середовищі процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо повністю довіряєте кожному локальному процесу.
    - Bind, відмінні від loopback, усе одно потребують автентифікації.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR
    - [Telegram](/uk/channels/telegram): токен бота
    - [Discord](/uk/channels/discord): токен бота
    - [Google Chat](/uk/channels/googlechat): JSON облікового запису служби + аудиторія Webhook
    - [Mattermost](/uk/channels/mattermost): токен бота + базовий URL
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису
    - [BlueBubbles](/uk/channels/bluebubbles): рекомендовано для iMessage; URL сервера + пароль + Webhook
    - [iMessage](/uk/channels/imessage): застарілий шлях CLI `imsg` + доступ до DB
    - Безпека DM: за замовчуванням використовується pairing. Перше DM надсилає код; схваліть через
      `openclaw pairing approve <channel> <code>` або використовуйте allowlist.
  </Step>
  <Step title="Установлення демона">
    - macOS: LaunchAgent
      - Потребує активної сесії користувача; для безголового режиму використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: користувацький systemd unit
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб Gateway залишався активним після виходу з системи.
      - Може запитати sudo (записує в `/var/lib/systemd/linger`); спочатку намагається без sudo.
    - Нативний Windows: спочатку Scheduled Task
      - Якщо створення завдання заборонене, OpenClaw переходить до резервного варіанту: елемента входу в систему для користувача через папку Startup і негайно запускає Gateway.
      - Scheduled Tasks лишаються пріоритетними, бо дають кращий статус супервізора.
    - Вибір runtime: Node (рекомендовано; обов’язковий для WhatsApp і Telegram). Bun не рекомендований.
  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає до виводу статусу live-перевірку стану Gateway, зокрема перевірки каналів, якщо вони підтримуються.
  </Step>
  <Step title="Skills">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер Node: npm, pnpm або bun.
    - Установлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, зокрема варіанти програм для iOS, Android і macOS.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер виводить інструкції з перенаправлення порту SSH для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, майстер намагається їх зібрати; резервний варіант — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Подробиці віддаленого режиму

Віддалений режим налаштовує цю машину для підключення до Gateway, розташованого в іншому місці.

<Info>
Віддалений режим не встановлює і не змінює нічого на віддаленому хості.
</Info>

Що ви задаєте:

- URL віддаленого Gateway (`ws://...`)
- Токен, якщо для віддаленого Gateway потрібна автентифікація (рекомендовано)

<Note>
- Якщо Gateway доступний лише через loopback, використовуйте SSH-тунелювання або tailnet.
- Підказки для виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Параметри автентифікації та моделей

<AccordionGroup>
  <Accordion title="Anthropic API key">
    Використовує `ANTHROPIC_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його для використання демоном.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Процес через браузер; вставте `code#state`.

    Встановлює `agents.defaults.model` у `openai/gpt-5.5`, якщо модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (прив’язка пристрою)">
    Процес прив’язки через браузер із короткоживучим кодом пристрою.

    Встановлює `agents.defaults.model` у `openai/gpt-5.5`, якщо модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="OpenAI API key">
    Використовує `OPENAI_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає облікові дані в профілях автентифікації.

    Встановлює `agents.defaults.model` у `openai/gpt-5.5`, якщо модель не задана, має вигляд `openai/*` або `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    Запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделей.
  </Accordion>
  <Accordion title="OpenCode">
    Запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дає змогу вибрати каталог Zen або Go.
    URL налаштування: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (загальний)">
    Зберігає ключ для вас.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Запитує `AI_GATEWAY_API_KEY`.
    Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Запитує ID облікового запису, ID Gateway і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфігурація записується автоматично. Hosted-варіант за замовчуванням — `MiniMax-M2.7`; налаштування через API key використовує
    `minimax/...`, а налаштування через OAuth — `minimax-portal/...`.
    Докладніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація автоматично записується для стандартного StepFun або Step Plan на китайських чи глобальних endpoint.
    Стандартний варіант наразі включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    Докладніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    Запитує `SYNTHETIC_API_KEY`.
    Докладніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud і локальні відкриті моделі)">
    Спочатку запитує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` з `https://ollama.com`.
    Режими з прив’язкою до хоста запитують базовий URL (за замовчуванням `http://127.0.0.1:11434`), виявляють доступні моделі та пропонують типові варіанти.
    `Cloud + Local` також перевіряє, чи виконано вхід цього хоста Ollama для доступу до cloud.
    Докладніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Користувацький провайдер">
    Працює з endpoint, сумісними з OpenAI та Anthropic.

    Інтерактивний онбординг підтримує ті самі варіанти зберігання API key, що й інші процеси з API key провайдера:
    - **Вставити API key зараз** (відкритий текст)
    - **Використати посилання на секрет** (env ref або налаштований ref провайдера, з попередньою перевіркою)

    Неінтерактивні прапорці:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; за замовчуванням використовується `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|anthropic>` (необов’язково; за замовчуванням `openai`)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає автентифікацію неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделі:

- Виберіть модель за замовчуванням із виявлених варіантів або введіть провайдера й модель вручну.
- Коли онбординг починається з вибору автентифікації провайдера, засіб вибору моделей автоматично надає перевагу
  цьому провайдеру. Для Volcengine і BytePlus така сама перевага
  також поширюється на їхні варіанти coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо за такого фільтра за пріоритетним провайдером список був би порожнім, засіб вибору
  повертається до повного каталогу замість показу порожнього списку моделей.
- Майстер виконує перевірку моделі та попереджає, якщо налаштована модель невідома або для неї немає автентифікації.

Шляхи до облікових даних і профілів:

- Профілі автентифікації (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт застарілого OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Типова поведінка онбордингу зберігає API keys як значення відкритим текстом у профілях автентифікації.
- `--secret-input-mode ref` вмикає режим посилань замість зберігання ключів відкритим текстом.
  В інтерактивному налаштуванні можна вибрати:
  - посилання на змінну середовища (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - посилання на налаштований провайдер (`file` або `exec`) з псевдонімом провайдера + id
- Інтерактивний режим посилань виконує швидку попередню перевірку перед збереженням.
  - Посилання env: перевіряє назву змінної та непорожнє значення в поточному середовищі онбордингу.
  - Посилання провайдера: перевіряє конфігурацію провайдера та знаходить запитаний id.
  - Якщо попередня перевірка не проходить, онбординг показує помилку і дає змогу повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` працює лише з env.
  - Задайте env-змінну провайдера в середовищі процесу онбордингу.
  - Вбудовані прапорці ключів (наприклад `--openai-api-key`) вимагають, щоб цю env-змінну було задано; інакше онбординг швидко завершується з помилкою.
  - Для користувацьких провайдерів неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У цьому випадку з користувацьким провайдером `--custom-api-key` вимагає, щоб `CUSTOM_API_KEY` було задано; інакше онбординг швидко завершується з помилкою.
- Облікові дані автентифікації Gateway підтримують вибір між відкритим текстом і SecretRef в інтерактивному налаштуванні:
  - Режим токена: **Згенерувати/зберегти токен відкритим текстом** (за замовчуванням) або **Використати SecretRef**.
  - Режим пароля: відкритий текст або SecretRef.
- Неінтерактивний шлях для SecretRef токена: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні налаштування з відкритим текстом і далі працюють без змін.

<Note>
Порада для безголового режиму і серверів: завершіть OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний шлях
`$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
використовується лише як застаріле джерело імпорту.
</Note>

## Вихідні дані та внутрішня будова

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний онбординг за замовчуванням встановлює `"coding"`, якщо значення не задано; наявні явно вказані значення зберігаються)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (локальний онбординг за замовчуванням встановлює `per-channel-peer`, якщо значення не задано; наявні явно вказані значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist каналів (Slack, Discord, Matrix, Microsoft Teams), якщо ви погоджуєтеся під час запитів (імена за можливості зіставляються з ID)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - У ручній конфігурації пізніше все ще можна задати `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp розміщуються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як plugins. Якщо їх вибрано під час налаштування, майстер
пропонує встановити Plugin (npm або локальний шлях) перед конфігурацією каналу.
</Note>

RPC майстра Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (програма macOS і Control UI) можуть відображати кроки без повторної реалізації логіки онбордингу.

Поведінка налаштування Signal:

- Завантажує відповідний release asset
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- Збірки JVM потребують Java 21
- Нативні збірки використовуються, коли доступні
- Windows використовує WSL2 і дотримується Linux-процесу signal-cli всередині WSL

## Пов’язані документи

- Центр онбордингу: [Онбординг (CLI)](/uk/start/wizard)
- Автоматизація та скрипти: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Довідник команд: [`openclaw onboard`](/uk/cli/onboard)
