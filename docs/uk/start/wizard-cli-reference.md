---
read_when:
    - Вам потрібна докладна поведінка для openclaw onboard
    - Ви налагоджуєте результати онбордингу або інтегруєте клієнти онбордингу
sidebarTitle: CLI reference
summary: Повний довідник із потоку налаштування CLI, налаштування автентифікації/моделі, виводів і внутрішніх механізмів
title: Довідник із налаштування CLI
x-i18n:
    generated_at: "2026-07-04T06:49:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Ця сторінка є повним довідником для `openclaw onboard`.
Короткий посібник див. у [Онбординг (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (за замовчуванням) проводить вас через:

- Налаштування моделі й автентифікації (OAuth для підписки OpenAI Code, Anthropic Claude CLI або API-ключ, а також параметри MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування робочої області та файли початкового завантаження
- Налаштування Gateway (порт, прив’язка, автентифікація, tailscale)
- Канали та провайдери (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage та інші вбудовані Plugin каналів)
- Встановлення демона (LaunchAgent, користувацький модуль systemd або нативне заплановане завдання Windows із резервним варіантом через папку Startup)
- Перевірка стану
- Налаштування Skills

Віддалений режим налаштовує цей комп’ютер для підключення до gateway в іншому місці.
Він нічого не встановлює й не змінює на віддаленому хості.

## Деталі локального процесу

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Reset (або не передасте `--reset`).
    - CLI `--reset` за замовчуванням відповідає `config+creds+sessions`; використовуйте `--reset-scope full`, щоб також видалити робочу область.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється й просить запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` і пропонує області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сеанси
      - Повне скидання (також видаляє робочу область)

  </Step>
  <Step title="Модель і автентифікація">
    - Повна матриця варіантів наведена в [Параметри автентифікації та моделі](#auth-and-model-options).

  </Step>
  <Step title="Робоча область">
    - За замовчуванням `~/.openclaw/workspace` (можна налаштувати).
    - Додає початкові файли робочої області, потрібні для ритуалу початкового завантаження під час першого запуску.
    - Структура робочої області: [Робоча область агента](/uk/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Запитує порт, прив’язку, режим автентифікації та експонування tailscale.
    - Рекомендовано: залишайте автентифікацію токеном увімкненою навіть для loopback, щоб локальні клієнти WS мусили автентифікуватися.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти токен у відкритому тексті** (за замовчуванням)
      - **Використати SecretRef** (за згодою)
    - У режимі пароля інтерактивне налаштування також підтримує зберігання у відкритому тексті або SecretRef.
    - Неінтерактивний шлях SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої змінної середовища в середовищі процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback усе одно потребують автентифікації.

  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR
    - [Telegram](/uk/channels/telegram): токен бота
    - [Discord](/uk/channels/discord): токен бота
    - [Google Chat](/uk/channels/googlechat): JSON сервісного акаунта + аудиторія webhook
    - [Mattermost](/uk/channels/mattermost): токен бота + базова URL-адреса
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація акаунта
    - [iMessage](/uk/channels/imessage): шлях до CLI `imsg` + доступ до БД Messages; використовуйте SSH-обгортку, коли Gateway працює не на Mac
    - Безпека DM: за замовчуванням використовується спарювання. Перший DM надсилає код; підтвердьте через
      `openclaw pairing approve <channel> <code>` або використовуйте списки дозволених.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потребує сеансу користувача, який увійшов у систему; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: користувацький модуль systemd
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб gateway залишався запущеним після виходу із системи.
      - Може запитати sudo (записує в `/var/lib/systemd/linger`); спершу пробує без sudo.
    - Нативна Windows: спершу заплановане завдання
      - Якщо створення завдання заборонено, OpenClaw повертається до елемента входу в папці Startup для конкретного користувача й одразу запускає gateway.
      - Заплановані завдання лишаються бажаним варіантом, бо надають кращий статус супервізора.
    - Вибір середовища виконання: Node (рекомендовано; потрібно для WhatsApp і Telegram). Bun не рекомендовано.

  </Step>
  <Step title="Перевірка стану">
    - Запускає gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає до виводу статусу живу перевірку стану gateway, включно з перевірками каналів, коли вони підтримуються.

  </Step>
  <Step title="Skills">
    - Зчитує доступні skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер node: npm, pnpm або bun.
    - Встановлює необов’язкові залежності для довірених вбудованих skills, коли потрібний
      інсталятор доступний.
    - Пропускає недоступні інсталятори Homebrew, uv і Go, а потім групує відповідні
      skills з інструкціями для ручного налаштування. Запустіть `openclaw doctor` після встановлення
      відсутніх передумов.

  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, включно з варіантами застосунків для iOS, Android і macOS.

  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер виводить інструкції SSH port-forward для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, майстер намагається їх зібрати; резервний варіант — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Деталі віддаленого режиму

Віддалений режим налаштовує цей комп’ютер для підключення до gateway в іншому місці.

<Info>
Віддалений режим нічого не встановлює й не змінює на віддаленому хості.
</Info>

Що ви задаєте:

- URL віддаленого gateway (`ws://...`)
- Токен, якщо для віддаленого gateway потрібна автентифікація (рекомендовано)

<Note>
- Якщо gateway доступний лише через loopback, використовуйте SSH-тунелювання або tailnet.
- Підказки для виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Параметри автентифікації та моделі

<AccordionGroup>
  <Accordion title="API-ключ Anthropic">
    Використовує `ANTHROPIC_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його для використання демоном.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Браузерний процес; вставте `code#state`.

    Встановлює `agents.defaults.model` на `openai/gpt-5.5` через середовище виконання Codex, коли модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (спарювання пристрою)">
    Браузерний процес спарювання з короткочасним кодом пристрою.

    Встановлює `agents.defaults.model` на `openai/gpt-5.5` через середовище виконання Codex, коли модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="API-ключ OpenAI">
    Використовує `OPENAI_API_KEY`, якщо він є, або запитує ключ, а потім зберігає облікові дані в профілях автентифікації.

    Встановлює `agents.defaults.model` на `openai/gpt-5.5`, коли модель не задана, має вигляд `openai/*` або є застарілим посиланням на модель Codex.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Вхід через браузер для відповідних акаунтів SuperGrok або X Premium. Це
    рекомендований шлях xAI для більшості користувачів. OpenClaw зберігає отриманий профіль
    автентифікації для моделей Grok, Grok `web_search`, `x_search` і `code_execution`.
  </Accordion>
  <Accordion title="Код пристрою xAI (Grok)">
    Дружній до віддалених середовищ браузерний вхід із коротким кодом замість callback
    localhost. Використовуйте це з хостів SSH, Docker або VPS.
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
    Запитує ID акаунта, ID gateway і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфігурація записується автоматично. Hosted-значення за замовчуванням — `MiniMax-M3`; налаштування з API-ключем використовує
    `minimax/...`, а налаштування OAuth використовує `minimax-portal/...`.
    Докладніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація записується автоматично для StepFun standard або Step Plan на китайських чи глобальних endpoints.
    Наразі Standard містить `step-3.5-flash`, а Step Plan також містить `step-3.5-flash-2603`.
    Докладніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    Запитує `SYNTHETIC_API_KEY`.
    Докладніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (хмарні та локальні відкриті моделі)">
    Спочатку запитує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` із `https://ollama.com`.
    Режими на базі хоста запитують базову URL-адресу (за замовчуванням `http://127.0.0.1:11434`), виявляють доступні моделі та пропонують значення за замовчуванням.
    `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для хмарного доступу.
    Докладніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Власний провайдер">
    Працює з endpoints, сумісними з OpenAI та Anthropic.

    Інтерактивний онбординг підтримує ті самі варіанти зберігання API-ключа, що й інші процеси API-ключів провайдерів:
    - **Вставити API-ключ зараз** (відкритий текст)
    - **Використати посилання на секрет** (env ref або налаштований provider ref, із попередньою перевіркою)

    Неінтерактивні прапорці:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; повертається до `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (необов’язково; за замовчуванням `openai`)
    - `--custom-image-input` / `--custom-text-input` (необов’язково; перевизначає виведену можливість введення моделі)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає автентифікацію неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделі:

- Виберіть модель за замовчуванням із виявлених варіантів або введіть провайдера й модель вручну.
- Онбординг власного провайдера виводить підтримку зображень для поширених ID моделей і запитує лише тоді, коли назва моделі невідома.
- Коли онбординг починається з вибору автентифікації провайдера, засіб вибору моделі автоматично надає перевагу
  цьому провайдеру. Для Volcengine і BytePlus та сама перевага
  також зіставляється з їхніми варіантами coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо фільтр бажаного провайдера був би порожнім, засіб вибору повертається до
  повного каталогу замість показу відсутності моделей.
- Майстер виконує перевірку моделі та попереджає, якщо налаштована модель невідома або автентифікація відсутня.

Шляхи до облікових даних і профілів:

- Профілі автентифікації (API-ключі + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт застарілого OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Типова поведінка початкового налаштування зберігає API-ключі як відкриті текстові значення у профілях автентифікації.
- `--secret-input-mode ref` вмикає режим посилань замість зберігання ключів відкритим текстом.
  В інтерактивному налаштуванні можна вибрати:
  - посилання на змінну середовища (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - посилання на налаштований провайдер (`file` або `exec`) з псевдонімом провайдера + id
- Інтерактивний режим посилань виконує швидку попередню перевірку перед збереженням.
  - Посилання на змінні середовища: перевіряє назву змінної + непорожнє значення в поточному середовищі початкового налаштування.
  - Посилання на провайдери: перевіряє конфігурацію провайдера та розв’язує запитаний id.
  - Якщо попередня перевірка не вдається, початкове налаштування показує помилку й дає змогу повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` підтримується лише через змінні середовища.
  - Установіть змінну середовища провайдера в середовищі процесу початкового налаштування.
  - Вбудовані прапорці ключів (наприклад `--openai-api-key`) вимагають, щоб цю змінну середовища було встановлено; інакше початкове налаштування швидко завершується з помилкою.
  - Для користувацьких провайдерів неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У цьому випадку користувацького провайдера `--custom-api-key` вимагає, щоб `CUSTOM_API_KEY` було встановлено; інакше початкове налаштування швидко завершується з помилкою.
- Облікові дані автентифікації Gateway підтримують вибір між відкритим текстом і SecretRef в інтерактивному налаштуванні:
  - Режим токена: **Згенерувати/зберегти токен відкритим текстом** (типово) або **Використати SecretRef**.
  - Режим пароля: відкритий текст або SecretRef.
- Неінтерактивний шлях SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні налаштування з відкритим текстом і далі працюють без змін.

<Note>
Порада для headless- і серверних середовищ: завершіть OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний
шлях `$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
є лише застарілим джерелом імпорту.
</Note>

## Виводи та внутрішні дані

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, коли передано `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальне початкове налаштування типово використовує `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (режим, прив’язка, автентифікація, tailscale)
- `session.dmScope` (локальне початкове налаштування типово задає `per-channel-peer`, якщо значення не задано; наявні явні значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Списки дозволених каналів (Slack, Discord, Matrix, Microsoft Teams), коли ви вмикаєте їх під час підказок (назви за можливості розв’язуються в ID)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручна конфігурація все ще може пізніше встановити `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp розміщуються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сеанси зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як plugins. Якщо їх вибрано під час налаштування, майстер
пропонує встановити plugin (npm або локальний шлях) перед конфігурацією каналу.
</Note>

RPC майстра Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (застосунок macOS і Control UI) можуть відображати кроки без повторної реалізації логіки початкового налаштування.

Поведінка налаштування Signal:

- Завантажує відповідний артефакт релізу
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- Збірки JVM потребують Java 21
- Нативні збірки використовуються, коли доступні
- Windows використовує WSL2 і дотримується Linux-потоку signal-cli всередині WSL

## Пов’язані документи

- Центр початкового налаштування: [Початкове налаштування (CLI)](/uk/start/wizard)
- Автоматизація та скрипти: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Довідник команд: [`openclaw onboard`](/uk/cli/onboard)
