---
read_when:
    - Вам потрібен детальний опис поведінки `openclaw onboard`
    - Ви налагоджуєте результати онбордингу або інтегруєте клієнти онбордингу
sidebarTitle: CLI reference
summary: Повний довідник із процесу налаштування CLI, налаштування автентифікації та моделей, вихідних даних і внутрішніх механізмів
title: Довідник із налаштування CLI
x-i18n:
    generated_at: "2026-06-30T22:35:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Ця сторінка є повним довідником для `openclaw onboard`.
Короткий посібник див. у [Онбординг (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (типовий) проводить вас через:

- Налаштування моделі й автентифікації (OAuth для підписки OpenAI Code, Anthropic Claude CLI або ключ API, а також параметри MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування робочого простору та початкові файли
- Налаштування Gateway (порт, прив’язка, автентифікація, Tailscale)
- Канали й провайдери (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage та інші вбудовані канальні plugins)
- Встановлення демона (LaunchAgent, користувацький модуль systemd або нативне завдання Windows Scheduled Task із резервним варіантом через папку Startup)
- Перевірка справності
- Налаштування Skills

Віддалений режим налаштовує цю машину для підключення до gateway в іншому місці.
Він не встановлює й не змінює нічого на віддаленому хості.

## Подробиці локального потоку

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо існує `~/.openclaw/openclaw.json`, виберіть Зберегти, Змінити або Скинути.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Скинути (або не передасте `--reset`).
    - CLI `--reset` типово використовує `config+creds+sessions`; використовуйте `--reset-scope full`, щоб також видалити робочий простір.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється й просить запустити `openclaw doctor`, перш ніж продовжити.
    - Скидання використовує `trash` і пропонує області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повне скидання (також видаляє робочий простір)

  </Step>
  <Step title="Модель і автентифікація">
    - Повна матриця параметрів наведена в [Параметри автентифікації та моделі](#auth-and-model-options).

  </Step>
  <Step title="Робочий простір">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Додає початкові файли робочого простору, потрібні для ритуалу першого запуску.
    - Структура робочого простору: [Робочий простір агента](/uk/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Запитує порт, прив’язку, режим автентифікації та експонування через Tailscale.
    - Рекомендовано: залиште автентифікацію токеном увімкненою навіть для loopback, щоб локальні WS-клієнти мусили автентифікуватися.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти токен у відкритому тексті** (типово)
      - **Використати SecretRef** (за вибором)
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
    - [Google Chat](/uk/channels/googlechat): JSON сервісного облікового запису + аудиторія webhook
    - [Mattermost](/uk/channels/mattermost): токен бота + базова URL-адреса
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису
    - [iMessage](/uk/channels/imessage): шлях до `imsg` CLI + доступ до БД Messages; використовуйте SSH-обгортку, коли Gateway працює не на Mac
    - Безпека DM: типово використовується спарювання. Перше DM надсилає код; схваліть через
      `openclaw pairing approve <channel> <code>` або використовуйте списки дозволених.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потребує сесії користувача, який увійшов у систему; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: користувацький модуль systemd
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб gateway залишався запущеним після виходу з системи.
      - Може запитати sudo (записує `/var/lib/systemd/linger`); спершу пробує без sudo.
    - Нативна Windows: спочатку Scheduled Task
      - Якщо створення завдання заборонено, OpenClaw повертається до елемента входу в папці Startup для поточного користувача й одразу запускає gateway.
      - Scheduled Tasks залишаються рекомендованими, бо надають кращий статус супервізора.
    - Вибір середовища виконання: Node (рекомендовано; потрібен для WhatsApp і Telegram). Bun не рекомендовано.

  </Step>
  <Step title="Перевірка справності">
    - Запускає gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає live-зонд справності gateway до виводу статусу, включно із зондами каналів, коли вони підтримуються.

  </Step>
  <Step title="Skills">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер node: npm, pnpm або bun.
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).

  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, включно з параметрами застосунків для iOS, Android і macOS.

  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер виводить інструкції SSH port-forward для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, майстер намагається зібрати їх; резервний варіант — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Подробиці віддаленого режиму

Віддалений режим налаштовує цю машину для підключення до gateway в іншому місці.

<Info>
Віддалений режим не встановлює й не змінює нічого на віддаленому хості.
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
  <Accordion title="Ключ API Anthropic">
    Використовує `ANTHROPIC_API_KEY`, якщо він присутній, або запитує ключ, а потім зберігає його для використання демоном.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Потік через браузер; вставте `code#state`.

    Задає `agents.defaults.model` як `openai/gpt-5.5` через середовище виконання Codex, коли модель не задана або вже належить до родини OpenAI.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (спарювання пристрою)">
    Потік спарювання через браузер із короткоживучим кодом пристрою.

    Задає `agents.defaults.model` як `openai/gpt-5.5` через середовище виконання Codex, коли модель не задана або вже належить до родини OpenAI.

  </Accordion>
  <Accordion title="Ключ API OpenAI">
    Використовує `OPENAI_API_KEY`, якщо він присутній, або запитує ключ, а потім зберігає облікові дані в профілях автентифікації.

    Задає `agents.defaults.model` як `openai/gpt-5.5`, коли модель не задана, `openai/*`, або це застарілі посилання на моделі Codex.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Вхід через браузер для відповідних облікових записів SuperGrok або X Premium. Це
    рекомендований шлях xAI для більшості користувачів. OpenClaw зберігає отриманий профіль
    автентифікації для моделей Grok, Grok `web_search`, `x_search` і `code_execution`.
  </Accordion>
  <Accordion title="Код пристрою xAI (Grok)">
    Зручний для віддаленого використання вхід через браузер із коротким кодом замість callback
    на localhost. Використовуйте це з SSH, Docker або VPS-хостів.
  </Accordion>
  <Accordion title="Ключ API xAI (Grok)">
    Запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделей. Використовуйте це,
    коли хочете ключ API xAI Console замість підписки OAuth.
  </Accordion>
  <Accordion title="OpenCode">
    Запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дає змогу вибрати каталог Zen або Go.
    URL налаштування: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Ключ API (загальний)">
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
    Конфігурація записується автоматично. Розміщене типове значення — `MiniMax-M3`; налаштування з ключем API використовує
    `minimax/...`, а налаштування OAuth використовує `minimax-portal/...`.
    Докладніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація автоматично записується для StepFun standard або Step Plan на китайських чи глобальних endpoint.
    Standard наразі містить `step-3.5-flash`, а Step Plan також містить `step-3.5-flash-2603`.
    Докладніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    Запитує `SYNTHETIC_API_KEY`.
    Докладніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (хмарні та локальні відкриті моделі)">
    Спершу запитує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` з `https://ollama.com`.
    Режими з хостом запитують базову URL-адресу (типово `http://127.0.0.1:11434`), виявляють доступні моделі та пропонують типові значення.
    `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов для хмарного доступу.
    Докладніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Власний провайдер">
    Працює з endpoint, сумісними з OpenAI та Anthropic.

    Інтерактивний онбординг підтримує ті самі варіанти зберігання ключа API, що й інші потоки ключів API провайдерів:
    - **Вставити ключ API зараз** (відкритий текст)
    - **Використати посилання на секрет** (env ref або налаштований provider ref із попередньою перевіркою)

    Неінтерактивні прапорці:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; повертається до `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (необов’язково; типово `openai`)
    - `--custom-image-input` / `--custom-text-input` (необов’язково; перевизначає виведену можливість вводу моделі)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає автентифікацію неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделі:

- Виберіть типову модель із виявлених варіантів або введіть провайдера й модель вручну.
- Онбординг власного провайдера виводить підтримку зображень для поширених ID моделей і запитує лише тоді, коли назва моделі невідома.
- Коли онбординг починається з вибору автентифікації провайдера, вибір моделі автоматично надає перевагу
  цьому провайдеру. Для Volcengine і BytePlus ця сама перевага
  також збігається з їхніми варіантами coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо фільтр бажаного провайдера був би порожнім, вибір повертається до
  повного каталогу замість показу відсутності моделей.
- Майстер запускає перевірку моделі й попереджає, якщо налаштована модель невідома або немає автентифікації.

Шляхи облікових даних і профілів:

- Профілі автентифікації (ключі API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт застарілого OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Стандартна поведінка онбордингу зберігає API-ключі як значення у відкритому тексті в профілях автентифікації.
- `--secret-input-mode ref` вмикає режим посилань замість зберігання ключів у відкритому тексті.
  В інтерактивному налаштуванні можна вибрати один із варіантів:
  - посилання на змінну середовища (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - посилання на налаштованого постачальника (`file` або `exec`) з псевдонімом постачальника + id
- Інтерактивний режим посилань виконує швидку попередню перевірку перед збереженням.
  - Посилання на змінні середовища: перевіряє назву змінної + непорожнє значення в поточному середовищі онбордингу.
  - Посилання на постачальників: перевіряє конфігурацію постачальника та розв’язує запитаний id.
  - Якщо попередня перевірка не вдається, онбординг показує помилку й дає змогу повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` підтримується лише через середовище.
  - Задайте змінну середовища постачальника в середовищі процесу онбордингу.
  - Вбудовані прапорці ключів (наприклад `--openai-api-key`) вимагають, щоб ця змінна середовища була задана; інакше онбординг швидко завершується помилкою.
  - Для власних постачальників неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У цьому випадку з власним постачальником `--custom-api-key` вимагає, щоб `CUSTOM_API_KEY` було задано; інакше онбординг швидко завершується помилкою.
- Облікові дані автентифікації Gateway підтримують вибір між відкритим текстом і SecretRef в інтерактивному налаштуванні:
  - Режим токена: **Згенерувати/зберегти токен у відкритому тексті** (стандартно) або **Використати SecretRef**.
  - Режим пароля: відкритий текст або SecretRef.
- Неінтерактивний шлях Token SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні налаштування з відкритим текстом і далі працюють без змін.

<Note>
Порада для безголового режиму й сервера: завершіть OAuth на машині з браузером, а потім скопіюйте
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
- `tools.profile` (локальний онбординг стандартно задає `"coding"`, якщо значення не встановлено; наявні явні значення зберігаються)
- `gateway.*` (режим, прив’язка, автентифікація, tailscale)
- `session.dmScope` (локальний онбординг стандартно задає `per-channel-peer`, якщо значення не встановлено; наявні явні значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Списки дозволених каналів (Slack, Discord, Matrix, Microsoft Teams), коли ви погоджуєтеся на це під час підказок (імена за можливості розв’язуються в ID)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручна конфігурація все ще може пізніше задати `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp розміщуються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як plugins. Коли їх вибрано під час налаштування, майстер
пропонує встановити plugin (npm або локальний шлях) перед конфігурацією каналу.
</Note>

RPC майстра Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (застосунок macOS і Control UI) можуть відображати кроки без повторної реалізації логіки онбордингу.

Поведінка налаштування Signal:

- Завантажує відповідний ресурс релізу
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- Збірки JVM потребують Java 21
- Нативні збірки використовуються, коли доступні
- Windows використовує WSL2 і дотримується потоку Linux signal-cli всередині WSL

## Пов’язані документи

- Хаб онбордингу: [Онбординг (CLI)](/uk/start/wizard)
- Автоматизація та скрипти: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Довідник команд: [`openclaw onboard`](/uk/cli/onboard)
