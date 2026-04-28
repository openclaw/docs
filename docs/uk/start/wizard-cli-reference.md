---
read_when:
    - Вам потрібна детальна поведінка для `openclaw onboard`
    - Ви налагоджуєте результати onboarding або інтегруєте клієнти onboarding
sidebarTitle: CLI reference
summary: Повний довідник з потоку налаштування CLI, налаштування автентифікації/моделі, виводів і внутрішньої реалізації
title: Довідник з налаштування CLI
x-i18n:
    generated_at: "2026-04-25T17:34:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967fd6734d8facaa732b40567c33e48434208bf861d102adc8a4ee042f13041
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Ця сторінка — повний довідник для `openclaw onboard`.
Короткий посібник див. у [Onboarding (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (типовий) покроково проводить вас через:

- Налаштування моделі та автентифікації (OAuth підписки OpenAI Code, Anthropic Claude CLI або API key, а також варіанти MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування робочого простору та bootstrap-файли
- Налаштування Gateway (порт, bind, auth, tailscale)
- Канали й провайдери (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles та інші вбудовані channel Plugin)
- Установлення daemon (LaunchAgent, systemd user unit або нативний Windows Scheduled Task із fallback на Startup-folder)
- Перевірка справності
- Налаштування Skills

Віддалений режим налаштовує цю машину на підключення до gateway в іншому місці.
Він не встановлює та не змінює нічого на віддаленому хості.

## Деталі локального потоку

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Reset (або не передасте `--reset`).
    - CLI `--reset` типово використовує `config+creds+sessions`; використайте `--reset-scope full`, щоб також видалити робочий простір.
    - Якщо конфігурація невалідна або містить застарілі ключі, майстер зупиняється й просить вас запустити `openclaw doctor` перед продовженням.
    - Reset використовує `trash` і пропонує такі області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повний Reset (також видаляє робочий простір)

  </Step>
  <Step title="Модель і автентифікація">
    - Повна матриця варіантів наведена в [Варіанти автентифікації та моделей](#auth-and-model-options).

  </Step>
  <Step title="Робочий простір">
    - Типово `~/.openclaw/workspace` (можна змінити).
    - Створює файли робочого простору, потрібні для bootstrap-ритуалу першого запуску.
    - Структура робочого простору: [Робочий простір агента](/uk/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Запитує порт, bind, режим auth і exposure для tailscale.
    - Рекомендовано: залишайте token auth увімкненим навіть для loopback, щоб локальні WS-клієнти мусили автентифікуватися.
    - У режимі token інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти plaintext token** (типово)
      - **Використати SecretRef** (опціонально)
    - У режимі password інтерактивне налаштування також підтримує зберігання plaintext або SecretRef.
    - Неінтерактивний шлях SecretRef для token: `--gateway-token-ref-env <ENV_VAR>`.
      - Вимагає непорожню env-змінну в середовищі процесу onboarding.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте auth лише якщо ви повністю довіряєте кожному локальному процесу.
    - Bind не на loopback все одно вимагає auth.

  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR
    - [Telegram](/uk/channels/telegram): token бота
    - [Discord](/uk/channels/discord): token бота
    - [Google Chat](/uk/channels/googlechat): JSON сервісного облікового запису + аудиторія webhook
    - [Mattermost](/uk/channels/mattermost): token бота + base URL
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису
    - [BlueBubbles](/uk/channels/bluebubbles): рекомендовано для iMessage; URL сервера + password + webhook
    - [iMessage](/uk/channels/imessage): застарілий шлях CLI `imsg` + доступ до DB
    - Безпека DM: типово використовується pairing. Перше DM надсилає код; схваліть через
      `openclaw pairing approve <channel> <code>` або використовуйте allowlist.
  </Step>
  <Step title="Установлення daemon">
    - macOS: LaunchAgent
      - Потребує сесії користувача, який увійшов; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: systemd user unit
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб gateway продовжував працювати після виходу з системи.
      - Може запитати sudo (записує в `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - Нативний Windows: спочатку Scheduled Task
      - Якщо створення завдання заборонено, OpenClaw переходить на елемент входу для користувача в Startup-folder і негайно запускає gateway.
      - Scheduled Task залишається пріоритетним, оскільки дає кращий статус supervisor.
    - Вибір runtime: Node (рекомендовано; обов’язковий для WhatsApp і Telegram). Bun не рекомендовано.

  </Step>
  <Step title="Перевірка справності">
    - Запускає gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає live-probe справності gateway до виводу статусу, включно з probe каналів, якщо підтримується.

  </Step>
  <Step title="Skills">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дозволяє вибрати менеджер Node: npm, pnpm або bun.
    - Установлює необов’язкові залежності (деякі використовують Homebrew на macOS).

  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, включно з варіантами застосунків для iOS, Android і macOS.

  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер виводить інструкції з переадресації порту SSH для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, майстер намагається зібрати їх; fallback — `pnpm ui:build` (автоматично встановлює UI-залежності).
</Note>

## Деталі віддаленого режиму

Віддалений режим налаштовує цю машину для підключення до gateway в іншому місці.

<Info>
Віддалений режим не встановлює та не змінює нічого на віддаленому хості.
</Info>

Що ви налаштовуєте:

- URL віддаленого gateway (`ws://...`)
- Token, якщо для віддаленого gateway потрібна auth (рекомендовано)

<Note>
- Якщо gateway доступний лише через loopback, використовуйте SSH-тунелювання або tailnet.
- Підказки для виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Варіанти автентифікації та моделей

<AccordionGroup>
  <Accordion title="Anthropic API key">
    Використовує `ANTHROPIC_API_KEY`, якщо він присутній, або запитує ключ, а потім зберігає його для використання daemon.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Потік через браузер; вставте `code#state`.

    Встановлює `agents.defaults.model` у `openai-codex/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (device pairing)">
    Потік pairing через браузер із короткоживучим кодом пристрою.

    Встановлює `agents.defaults.model` у `openai-codex/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="OpenAI API key">
    Використовує `OPENAI_API_KEY`, якщо він присутній, або запитує ключ, а потім зберігає облікові дані в профілях автентифікації.

    Встановлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задана, має вигляд `openai/*` або `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    Запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделей.
  </Accordion>
  <Accordion title="OpenCode">
    Запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дозволяє вибрати каталог Zen або Go.
    URL налаштування: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (загальний)">
    Зберігає ключ за вас.
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
    Конфігурація записується автоматично. Типове hosted-значення — `MiniMax-M2.7`; налаштування через API key використовує
    `minimax/...`, а налаштування через OAuth — `minimax-portal/...`.
    Докладніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація автоматично записується для StepFun standard або Step Plan на китайських чи глобальних endpoint.
    Наразі Standard включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    Докладніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    Запитує `SYNTHETIC_API_KEY`.
    Докладніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (хмарні та локальні відкриті моделі)">
    Спочатку запитує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` із `https://ollama.com`.
    Режими на основі host запитують base URL (типово `http://127.0.0.1:11434`), виявляють доступні моделі та пропонують типові.
    `Cloud + Local` також перевіряє, чи той хост Ollama увійшов у систему для хмарного доступу.
    Докладніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Власний провайдер">
    Працює з endpoint, сумісними з OpenAI і Anthropic.

    Інтерактивний onboarding підтримує ті самі варіанти зберігання API key, що й інші потоки API key провайдерів:
    - **Вставити API key зараз** (plaintext)
    - **Використати secret reference** (посилання на env або налаштованого провайдера, з попередньою валідацією)

    Неінтерактивні прапорці:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; fallback до `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|anthropic>` (необов’язково; типово `openai`)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає автентифікацію неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделей:

- Виберіть типову модель із виявлених варіантів або введіть провайдера й модель вручну.
- Коли onboarding починається з вибору автентифікації провайдера, засіб вибору моделі автоматично віддає перевагу
  цьому провайдеру. Для Volcengine і BytePlus така сама перевага
  також поширюється на їхні варіанти coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо цей фільтр preferred-provider був би порожнім, засіб вибору повертається до
  повного каталогу замість показу порожнього списку моделей.
- Майстер виконує перевірку моделі й попереджає, якщо налаштована модель невідома або для неї бракує auth.

Шляхи облікових даних і профілів:

- Профілі автентифікації (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт застарілого OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Типова поведінка onboarding зберігає API keys як plaintext-значення в профілях автентифікації.
- `--secret-input-mode ref` вмикає режим посилань замість зберігання plaintext key.
  В інтерактивному налаштуванні ви можете вибрати один із варіантів:
  - посилання на env-змінну (наприклад, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - посилання на налаштованого провайдера (`file` або `exec`) з псевдонімом провайдера + id
- Інтерактивний режим посилань виконує швидку попередню валідацію перед збереженням.
  - Env-посилання: перевіряє назву змінної та непорожнє значення в поточному середовищі onboarding.
  - Посилання на провайдера: перевіряє конфігурацію провайдера та розв’язує запитаний id.
  - Якщо попередня перевірка не проходить, onboarding показує помилку й дозволяє повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` підтримує лише env.
  - Установіть env-змінну провайдера в середовищі процесу onboarding.
  - Inline-прапорці ключів (наприклад, `--openai-api-key`) вимагають, щоб ця env-змінна була встановлена; інакше onboarding завершується швидкою помилкою.
  - Для власних провайдерів неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У цьому випадку для власного провайдера `--custom-api-key` вимагає, щоб `CUSTOM_API_KEY` було встановлено; інакше onboarding завершується швидкою помилкою.
- Облікові дані auth для Gateway підтримують вибір plaintext і SecretRef в інтерактивному налаштуванні:
  - Режим token: **Generate/store plaintext token** (типово) або **Use SecretRef**.
  - Режим password: plaintext або SecretRef.
- Неінтерактивний шлях SecretRef для token: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні plaintext-налаштування й далі працюють без змін.

<Note>
Порада для headless і серверів: завершіть OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний шлях
`$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
є лише застарілим джерелом імпорту.
</Note>

## Виводи та внутрішня реалізація

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, коли передано `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний onboarding типово встановлює `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (локальний onboarding типово встановлює це значення в `per-channel-peer`, якщо воно не задане; наявні явні значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist каналів (Slack, Discord, Matrix, Microsoft Teams), якщо ви явно погоджуєтеся під час запитів (імена, коли можливо, зіставляються з ID)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - У ручній конфігурації пізніше все ще можна встановити `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp розміщуються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як Plugin. Якщо їх вибрано під час налаштування, майстер
запропонує встановити Plugin (npm або локальний шлях) перед налаштуванням каналу.
</Note>

RPC майстра Gateway:

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
- За наявності використовуються нативні збірки
- Windows використовує WSL2 і дотримується потоку signal-cli для Linux усередині WSL

## Пов’язані документи

- Центр onboarding: [Onboarding (CLI)](/uk/start/wizard)
- Автоматизація і скрипти: [CLI Automation](/uk/start/wizard-cli-automation)
- Довідник команд: [`openclaw onboard`](/uk/cli/onboard)
