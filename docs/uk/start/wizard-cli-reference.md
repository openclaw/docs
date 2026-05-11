---
read_when:
    - Потрібен детальний опис поведінки для openclaw onboard
    - Ви налагоджуєте результати онбордингу або інтегруєте клієнти онбордингу
sidebarTitle: CLI reference
summary: Повний довідник із процесу налаштування CLI, налаштування автентифікації/моделі, вихідних даних і внутрішніх механізмів
title: Довідник із налаштування CLI
x-i18n:
    generated_at: "2026-05-11T20:58:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9166e8763c1ee1884817a9625a035b7efa1a97a1d4d4e4dffc1926675b1d3214
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Ця сторінка є повним довідником для `openclaw onboard`.
Короткий посібник див. у [Початкове налаштування (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (стандартний) проведе вас через:

- Налаштування моделі та автентифікації (OAuth для підписки OpenAI Code, Anthropic Claude CLI або API-ключ, а також опції MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування робочого простору та файли початкового завантаження
- Налаштування Gateway (порт, прив’язка, автентифікація, Tailscale)
- Канали та провайдери (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage та інші вбудовані плагіни каналів)
- Встановлення демона (LaunchAgent, користувацький systemd unit або нативне завдання Windows Scheduled Task із резервним варіантом через папку Startup)
- Перевірка стану
- Налаштування Skills

Віддалений режим налаштовує цей комп’ютер для підключення до Gateway в іншому місці.
Він не встановлює й не змінює нічого на віддаленому хості.

## Деталі локального потоку

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Reset (або не передасте `--reset`).
    - CLI `--reset` за замовчуванням використовує `config+creds+sessions`; використайте `--reset-scope full`, щоб також видалити робочий простір.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиниться й попросить вас запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` і пропонує області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сеанси
      - Повне скидання (також видаляє робочий простір)

  </Step>
  <Step title="Модель і автентифікація">
    - Повна матриця опцій наведена в [Опції автентифікації та моделей](#auth-and-model-options).

  </Step>
  <Step title="Робочий простір">
    - За замовчуванням `~/.openclaw/workspace` (можна налаштувати).
    - Додає початкові файли робочого простору, потрібні для ритуалу початкового завантаження під час першого запуску.
    - Структура робочого простору: [Робочий простір агента](/uk/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Запитує порт, прив’язку, режим автентифікації та доступ через Tailscale.
    - Рекомендовано: залишайте токенну автентифікацію ввімкненою навіть для loopback, щоб локальні WS-клієнти мусили автентифікуватися.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти токен відкритим текстом** (стандартно)
      - **Використати SecretRef** (за явним вибором)
    - У режимі пароля інтерактивне налаштування також підтримує зберігання відкритим текстом або через SecretRef.
    - Неінтерактивний шлях токенного SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої змінної середовища в середовищі процесу початкового налаштування.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback усе одно потребують автентифікації.

  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR
    - [Telegram](/uk/channels/telegram): токен бота
    - [Discord](/uk/channels/discord): токен бота
    - [Google Chat](/uk/channels/googlechat): JSON сервісного облікового запису + аудиторія webhook
    - [Mattermost](/uk/channels/mattermost): токен бота + базова URL-адреса
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису
    - [iMessage](/uk/channels/imessage): шлях до CLI `imsg` + доступ до БД Messages; використовуйте SSH-обгортку, коли Gateway працює не на Mac
    - Безпека DM: стандартно використовується створення пари. Перше DM надсилає код; схваліть через
      `openclaw pairing approve <channel> <code>` або використайте списки дозволів.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потребує сеансу користувача з виконаним входом; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: користувацький systemd unit
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб Gateway залишався запущеним після виходу.
      - Може попросити sudo (записує `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - Нативна Windows: спершу Scheduled Task
      - Якщо створення завдання заборонено, OpenClaw повертається до елемента входу в папці Startup для окремого користувача й одразу запускає Gateway.
      - Scheduled Tasks залишаються рекомендованими, бо забезпечують кращий статус супервізора.
    - Вибір середовища виконання: Node (рекомендовано; потрібно для WhatsApp і Telegram). Bun не рекомендовано.

  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає до виводу статусу живу перевірку стану Gateway, зокрема перевірки каналів, коли вони підтримуються.

  </Step>
  <Step title="Skills">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер Node: npm, pnpm або bun.
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).

  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, зокрема опції застосунків для iOS, Android і macOS.

  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер друкує інструкції SSH port-forward для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, майстер намагається зібрати їх; резервний варіант — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Деталі віддаленого режиму

Віддалений режим налаштовує цей комп’ютер для підключення до Gateway в іншому місці.

<Info>
Віддалений режим не встановлює й не змінює нічого на віддаленому хості.
</Info>

Що ви налаштовуєте:

- URL віддаленого Gateway (`ws://...`)
- Токен, якщо для віддаленого Gateway потрібна автентифікація (рекомендовано)

<Note>
- Якщо Gateway доступний лише через loopback, використовуйте SSH-тунелювання або tailnet.
- Підказки для виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Опції автентифікації та моделей

<AccordionGroup>
  <Accordion title="API-ключ Anthropic">
    Використовує `ANTHROPIC_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його для використання демоном.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Потік через браузер; вставте `code#state`.

    Встановлює `agents.defaults.model` на `openai/gpt-5.5` через середовище виконання Codex, коли модель не задана або вже належить до родини OpenAI.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (створення пари з пристроєм)">
    Потік створення пари через браузер із короткочасним кодом пристрою.

    Встановлює `agents.defaults.model` на `openai/gpt-5.5` через середовище виконання Codex, коли модель не задана або вже належить до родини OpenAI.

  </Accordion>
  <Accordion title="API-ключ OpenAI">
    Використовує `OPENAI_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає облікові дані в профілях автентифікації.

    Встановлює `agents.defaults.model` на `openai/gpt-5.5`, коли модель не задана, `openai/*` або `openai-codex/*`.

  </Accordion>
  <Accordion title="API-ключ xAI (Grok)">
    Запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделей.
  </Accordion>
  <Accordion title="OpenCode">
    Запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дає змогу вибрати каталог Zen або Go.
    URL налаштування: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-ключ (універсальний)">
    Зберігає ключ для вас.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Запитує `AI_GATEWAY_API_KEY`.
    Детальніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Запитує ID облікового запису, ID Gateway і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Детальніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфігурація записується автоматично. Стандартна hosted-модель — `MiniMax-M2.7`; налаштування з API-ключем використовує
    `minimax/...`, а налаштування OAuth використовує `minimax-portal/...`.
    Детальніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація записується автоматично для стандартного StepFun або Step Plan на китайських чи глобальних endpoint.
    Standard наразі включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    Детальніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    Запитує `SYNTHETIC_API_KEY`.
    Детальніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud і локальні відкриті моделі)">
    Спочатку запитує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` з `https://ollama.com`.
    Режими з хостом запитують базову URL-адресу (за замовчуванням `http://127.0.0.1:11434`), виявляють доступні моделі та пропонують стандартні варіанти.
    `Cloud + Local` також перевіряє, чи цей хост Ollama ввійшов для доступу до Cloud.
    Детальніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Детальніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Користувацький провайдер">
    Працює з endpoint, сумісними з OpenAI та Anthropic.

    Інтерактивне початкове налаштування підтримує ті самі варіанти зберігання API-ключів, що й інші потоки API-ключів провайдерів:
    - **Вставити API-ключ зараз** (відкритий текст)
    - **Використати посилання на секрет** (env ref або налаштований provider ref із передперевіркою)

    Неінтерактивні прапорці:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; повертається до `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|anthropic>` (необов’язково; стандартно `openai`)
    - `--custom-image-input` / `--custom-text-input` (необов’язково; перевизначає виведену можливість введення моделі)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає автентифікацію неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделей:

- Виберіть стандартну модель із виявлених опцій або введіть провайдера й модель вручну.
- Початкове налаштування користувацького провайдера визначає підтримку зображень для поширених ID моделей і запитує лише тоді, коли назва моделі невідома.
- Коли початкове налаштування стартує з вибору автентифікації провайдера, вибір моделі автоматично віддає перевагу
  цьому провайдеру. Для Volcengine і BytePlus та сама перевага
  також збігається з їхніми варіантами coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо фільтр за цим бажаним провайдером був би порожнім, вибір моделі повертається до
  повного каталогу замість того, щоб не показувати жодних моделей.
- Майстер виконує перевірку моделі та попереджає, якщо налаштована модель невідома або автентифікація відсутня.

Шляхи облікових даних і профілів:

- Профілі автентифікації (API-ключі + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт застарілого OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Стандартна поведінка початкового налаштування зберігає API-ключі як значення відкритим текстом у профілях автентифікації.
- `--secret-input-mode ref` вмикає режим посилань замість зберігання ключів відкритим текстом.
  В інтерактивному налаштуванні можна вибрати:
  - посилання на змінну середовища (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - налаштоване посилання провайдера (`file` або `exec`) з alias провайдера + id
- Інтерактивний режим посилань виконує швидку передперевірку перед збереженням.
  - Env refs: перевіряє назву змінної + непорожнє значення в поточному середовищі початкового налаштування.
  - Provider refs: перевіряє конфігурацію провайдера та розв’язує запитаний id.
  - Якщо передперевірка не проходить, початкове налаштування показує помилку та дає змогу повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` підтримується лише через env.
  - Установіть змінну середовища провайдера в середовищі процесу початкового налаштування.
  - Inline-прапорці ключів (наприклад `--openai-api-key`) вимагають, щоб ця змінна середовища була задана; інакше початкове налаштування швидко завершується помилкою.
  - Для користувацьких провайдерів неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У цьому випадку користувацького провайдера `--custom-api-key` вимагає, щоб `CUSTOM_API_KEY` було задано; інакше початкове налаштування швидко завершується помилкою.
- Облікові дані автентифікації Gateway підтримують варіанти відкритого тексту й SecretRef в інтерактивному налаштуванні:
  - Режим токена: **Згенерувати/зберегти токен відкритим текстом** (стандартно) або **Використати SecretRef**.
  - Режим пароля: відкритий текст або SecretRef.
- Неінтерактивний шлях токенного SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні налаштування з відкритим текстом продовжують працювати без змін.

<Note>
Порада для headless-режиму й серверів: завершіть OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний шлях
`$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
є лише застарілим джерелом імпорту.
</Note>

## Вивід і внутрішні дані

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, коли передано `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний онбординг за замовчуванням використовує `"coding"`, якщо не задано; наявні явні значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (локальний онбординг за замовчуванням задає `per-channel-peer`, якщо не задано; наявні явні значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Списки дозволених каналів (Slack, Discord, Matrix, Microsoft Teams), коли ви погоджуєтеся під час підказок (імена за можливості зіставляються з ID)
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
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як Plugin. Коли їх вибрано під час налаштування, майстер
пропонує встановити Plugin (npm або локальний шлях) перед конфігурацією каналу.
</Note>

RPC майстра Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (застосунок macOS і Control UI) можуть відображати кроки без повторної реалізації логіки онбордингу.

Поведінка налаштування Signal:

- Завантажує відповідний ресурс випуску
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- Збірки JVM потребують Java 21
- Нативні збірки використовуються, коли доступні
- Windows використовує WSL2 і дотримується Linux-потоку signal-cli всередині WSL

## Пов’язані документи

- Центр онбордингу: [Онбординг (CLI)](/uk/start/wizard)
- Автоматизація та скрипти: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Довідник команд: [`openclaw onboard`](/uk/cli/onboard)
