---
read_when:
    - Вам потрібна детальна поведінка для `openclaw onboard`
    - Ви налагоджуєте результати онбордингу або інтегруєте клієнти онбордингу
sidebarTitle: CLI reference
summary: Повна довідка щодо потоку налаштування CLI, налаштування auth/моделі, виводу та внутрішньої роботи
title: Довідка з налаштування CLI
x-i18n:
    generated_at: "2026-04-23T21:12:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88e8d8fc1b06aed2834df9e69357a81f3e8b058b64f9ddc317906b9ea85a6bbe
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Ця сторінка — повна довідка щодо `openclaw onboard`.
Короткий посібник див. в [Onboarding (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (типовий) проводить вас через:

- Налаштування моделі та auth (OAuth підписки OpenAI Code, Anthropic Claude CLI або API key, а також варіанти MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування робочого простору та bootstrap files
- Налаштування Gateway (порт, bind, auth, tailscale)
- Канали й providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles та інші вбудовані channel plugins)
- Установлення daemon (LaunchAgent, systemd user unit або native Windows Scheduled Task з fallback через Startup-folder)
- Перевірку стану здоров’я
- Налаштування Skills

Режим remote налаштовує цю машину для підключення до gateway в іншому місці.
Він не встановлює і не змінює нічого на віддаленому хості.

## Деталі локального потоку

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо існує `~/.openclaw/openclaw.json`, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Reset (або не передасте `--reset`).
    - `--reset` у CLI типово означає `config+creds+sessions`; використовуйте `--reset-scope full`, щоб також прибрати workspace.
    - Якщо конфігурація невалідна або містить legacy keys, майстер зупиняється й просить виконати `openclaw doctor` перед продовженням.
    - Reset використовує `trash` і пропонує області:
      - Лише config
      - Config + credentials + sessions
      - Повне скидання (також видаляє workspace)
  </Step>
  <Step title="Модель і auth">
    - Повна матриця варіантів наведена в [Auth and model options](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Типово `~/.openclaw/workspace` (можна змінити).
    - Створює workspace files, потрібні для bootstrap ritual першого запуску.
    - Структура workspace: [Agent workspace](/uk/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Запитує порт, bind, режим auth і tailscale exposure.
    - Рекомендовано: залишати token auth увімкненою навіть для loopback, щоб локальні WS-clients проходили автентифікацію.
    - У режимі token інтерактивне налаштування пропонує:
      - **Generate/store plaintext token** (типово)
      - **Use SecretRef** (за бажанням)
    - У режимі password інтерактивне налаштування також підтримує зберігання plaintext або SecretRef.
    - Шлях неінтерактивного token SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
      - Вимагає непорожню env var у середовищі процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте auth лише тоді, коли повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback все одно вимагають auth.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий QR login
    - [Telegram](/uk/channels/telegram): bot token
    - [Discord](/uk/channels/discord): bot token
    - [Google Chat](/uk/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/uk/channels/mattermost): bot token + base URL
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація account
    - [BlueBubbles](/uk/channels/bluebubbles): рекомендовано для iMessage; server URL + password + webhook
    - [iMessage](/uk/channels/imessage): legacy-шлях до `imsg` CLI + доступ до DB
    - Безпека DM: типово використовується pairing. Перший DM надсилає код; схваліть його через
      `openclaw pairing approve <channel> <code>` або використовуйте allowlist-ы.
  </Step>
  <Step title="Установлення daemon">
    - macOS: LaunchAgent
      - Потрібна сесія користувача з виконаним входом; для headless використовуйте custom LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: systemd user unit
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб gateway залишався активним після logout.
      - Може запитати sudo (записує `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - Native Windows: спочатку Scheduled Task
      - Якщо створення task заборонено, OpenClaw повертається до per-user login item у Startup-folder і одразу запускає gateway.
      - Scheduled Tasks залишаються пріоритетними, оскільки дають кращий supervisor status.
    - Вибір runtime: Node (рекомендовано; потрібен для WhatsApp і Telegram). Bun не рекомендовано.
  </Step>
  <Step title="Перевірка стану здоров’я">
    - Запускає gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає до виводу status live health probe gateway, включно з probe-ами каналів, де це підтримується.
  </Step>
  <Step title="Skills">
    - Читає доступні Skills і перевіряє вимоги.
    - Дозволяє вибрати node manager: npm, pnpm або bun.
    - Установлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, включно з варіантами для iOS, Android і macOS app.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер друкує інструкції з SSH port-forward для Control UI замість відкриття браузера.
Якщо assets Control UI відсутні, майстер намагається зібрати їх; fallback — `pnpm ui:build` (автоматично встановлює UI deps).
</Note>

## Деталі remote mode

Remote mode налаштовує цю машину для підключення до gateway в іншому місці.

<Info>
Remote mode не встановлює і не змінює нічого на віддаленому хості.
</Info>

Що ви задаєте:

- URL віддаленого gateway (`ws://...`)
- Token, якщо потрібна auth віддаленого gateway (рекомендовано)

<Note>
- Якщо gateway доступний лише через loopback, використовуйте SSH tunneling або tailnet.
- Підказки виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Варіанти auth і моделей

<AccordionGroup>
  <Accordion title="API key Anthropic">
    Використовує `ANTHROPIC_API_KEY`, якщо він присутній, або запитує ключ, а потім зберігає його для використання daemon.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Потік через браузер; вставте `code#state`.

    Установлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (device pairing)">
    Потік pairing у браузері з короткоживучим device code.

    Установлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="API key OpenAI">
    Використовує `OPENAI_API_KEY`, якщо він присутній, або запитує ключ, а потім зберігає credential в auth profiles.

    Установлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задана, має вигляд `openai/*` або `openai-codex/*`.

  </Accordion>
  <Accordion title="API key xAI (Grok)">
    Запитує `XAI_API_KEY` і налаштовує xAI як provider моделей.
  </Accordion>
  <Accordion title="OpenCode">
    Запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дозволяє вибрати каталог Zen або Go.
    URL setup: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (загальний)">
    Зберігає ключ для вас.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Запитує `AI_GATEWAY_API_KEY`.
    Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Запитує account ID, gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфігурація записується автоматично. Типовий hosted-варіант — `MiniMax-M2.7`; налаштування через API key використовує
    `minimax/...`, а налаштування через OAuth — `minimax-portal/...`.
    Докладніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація автоматично записується для стандартного StepFun або Step Plan на китайських чи глобальних endpoints.
    Стандартний варіант наразі включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    Докладніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    Запитує `SYNTHETIC_API_KEY`.
    Докладніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    Спочатку запитує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` з `https://ollama.com`.
    Режими, прив’язані до хоста, запитують base URL (типово `http://127.0.0.1:11434`), виявляють доступні моделі та пропонують типові варіанти.
    `Cloud + Local` також перевіряє, чи цей хост Ollama має вхід для cloud access.
    Докладніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Custom provider">
    Працює з endpoints, сумісними з OpenAI і Anthropic.

    Інтерактивний онбординг підтримує ті самі варіанти зберігання API key, що й інші потоки API key provider-ів:
    - **Paste API key now** (plaintext)
    - **Use secret reference** (env ref або configured provider ref, з preflight validation)

    Неінтерактивні прапорці:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язковий; fallback до `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язковий)
    - `--custom-compatibility <openai|anthropic>` (необов’язковий; типово `openai`)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає auth неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделей:

- Виберіть типову модель із виявлених варіантів або введіть provider і model вручну.
- Коли онбординг стартує з вибору auth provider-а, picker моделей автоматично надає
  перевагу цьому provider-у. Для Volcengine і BytePlus ця ж перевага
  також охоплює їхні варіанти coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо цей фільтр бажаного provider-а був би порожнім, picker повертається до
  повного каталогу замість порожнього списку моделей.
- Майстер виконує перевірку моделі й попереджає, якщо налаштована модель невідома або для неї бракує auth.

Шляхи credentials і profiles:

- Auth profiles (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт legacy OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання credentials:

- Типова поведінка онбордингу зберігає API keys як plaintext values в auth profiles.
- `--secret-input-mode ref` вмикає режим reference замість зберігання ключів у plaintext.
  В інтерактивному setup ви можете вибрати:
  - ref змінної середовища (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - configured provider ref (`file` або `exec`) з alias provider-а + id
- Інтерактивний reference mode запускає швидку preflight validation перед збереженням.
  - Env refs: перевіряє ім’я змінної + непорожнє значення в поточному середовищі онбордингу.
  - Provider refs: перевіряє конфігурацію provider-а й розв’язує запитаний id.
  - Якщо preflight не проходить, онбординг показує помилку й дозволяє повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` підтримує лише env-backed варіант.
  - Установіть env var provider-а в середовищі процесу онбордингу.
  - Вбудовані прапорці ключів (наприклад `--openai-api-key`) вимагають, щоб цю env var було встановлено; інакше онбординг завершується fail-fast.
  - Для custom provider-ів неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У цьому випадку custom provider-а `--custom-api-key` вимагає встановленого `CUSTOM_API_KEY`; інакше онбординг завершується fail-fast.
- Credentials auth Gateway підтримують вибір plaintext і SecretRef в інтерактивному setup:
  - Режим token: **Generate/store plaintext token** (типово) або **Use SecretRef**.
  - Режим password: plaintext або SecretRef.
- Неінтерактивний шлях token SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні plaintext-налаштування продовжують працювати без змін.

<Note>
Порада для headless і server: завершіть OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний шлях
`$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
— це лише джерело legacy import.
</Note>

## Вивід і внутрішня робота

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний онбординг типово задає `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (локальний онбординг типово задає `per-channel-peer`, якщо значення не задано; наявні явні значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel allowlist-и (Slack, Discord, Matrix, Microsoft Teams), якщо ви явно вмикаєте їх під час prompt-ів (імена перетворюються на ID, коли це можливо)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - У ручній конфігурації пізніше все ще можна задати `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як plugins. Якщо їх вибрано під час setup, майстер
просить установити Plugin (npm або local path) до налаштування каналу.
</Note>

RPC майстра Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (macOS app і Control UI) можуть відображати кроки, не перевпроваджуючи логіку онбордингу.

Поведінка setup Signal:

- Завантажує відповідний release asset
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- JVM-збірки вимагають Java 21
- Native-збірки використовуються, коли вони доступні
- Windows використовує WSL2 і дотримується Linux-потоку signal-cli всередині WSL

## Пов’язана документація

- Центр онбордингу: [Onboarding (CLI)](/uk/start/wizard)
- Автоматизація та скрипти: [CLI Automation](/uk/start/wizard-cli-automation)
- Довідка з команд: [`openclaw onboard`](/uk/cli/onboard)
