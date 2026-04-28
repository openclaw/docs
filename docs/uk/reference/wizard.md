---
read_when:
    - Пошук конкретного кроку початкового налаштування або прапорця
    - Автоматизація онбордингу за допомогою неінтерактивного режиму
    - Налагодження поведінки під час початкового налаштування
sidebarTitle: Onboarding Reference
summary: 'Повний довідник із первинного налаштування CLI: кожен крок, прапорець і поле конфігурації'
title: Довідник із початкового налаштування
x-i18n:
    generated_at: "2026-04-28T11:25:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

Це повна довідка для `openclaw onboard`.
Докладний огляд див. у розділі [Початкове налаштування (CLI)](/uk/start/wizard).

## Подробиці процесу (локальний режим)

<Steps>
  <Step title="Existing config detection">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть **Зберегти / Змінити / Скинути**.
    - Повторний запуск початкового налаштування **не** стирає нічого, якщо ви явно не виберете **Скинути**
      (або не передасте `--reset`).
    - CLI `--reset` за замовчуванням скидає `config+creds+sessions`; використайте `--reset-scope full`,
      щоб також видалити робочий простір.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється й просить
      запустити `openclaw doctor`, перш ніж продовжити.
    - Скидання використовує `trash` (ніколи `rm`) і пропонує області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сеанси
      - Повне скидання (також видаляє робочий простір)

  </Step>
  <Step title="Model/Auth">
    - **API-ключ Anthropic**: використовує `ANTHROPIC_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його для використання демоном.
    - **API-ключ Anthropic**: бажаний вибір асистента Anthropic у початковому налаштуванні/конфігуруванні.
    - **setup-token Anthropic**: усе ще доступний у початковому налаштуванні/конфігуруванні, хоча OpenClaw тепер надає перевагу повторному використанню Claude CLI, коли це можливо.
    - **Підписка OpenAI Code (Codex) (OAuth)**: браузерний процес; вставте `code#state`.
      - Установлює `agents.defaults.model` на `openai-codex/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.
    - **Підписка OpenAI Code (Codex) (сполучення пристрою)**: браузерний процес сполучення з короткочасним кодом пристрою.
      - Установлює `agents.defaults.model` на `openai-codex/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.
    - **API-ключ OpenAI**: використовує `OPENAI_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його в профілях автентифікації.
      - Установлює `agents.defaults.model` на `openai/gpt-5.5`, коли модель не задана, `openai/*` або `openai-codex/*`.
    - **API-ключ xAI (Grok)**: запитує `XAI_API_KEY` і налаштовує xAI як постачальника моделей.
    - **OpenCode**: запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`, отримайте його на https://opencode.ai/auth) і дає змогу вибрати каталог Zen або Go.
    - **Ollama**: спочатку пропонує **Хмара + локально**, **Лише хмара** або **Лише локально**. `Cloud only` запитує `OLLAMA_API_KEY` і використовує `https://ollama.com`; режими з хостом запитують базовий URL Ollama, виявляють доступні моделі й автоматично завантажують вибрану локальну модель за потреби; `Cloud + Local` також перевіряє, чи виконано вхід на цьому хості Ollama для хмарного доступу.
    - Докладніше: [Ollama](/uk/providers/ollama)
    - **API-ключ**: зберігає ключ для вас.
    - **Vercel AI Gateway (проксі для кількох моделей)**: запитує `AI_GATEWAY_API_KEY`.
    - Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: запитує Account ID, Gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
    - **MiniMax**: конфігурація записується автоматично; розміщене значення за замовчуванням — `MiniMax-M2.7`.
      Налаштування API-ключа використовує `minimax/...`, а налаштування OAuth використовує
      `minimax-portal/...`.
    - Докладніше: [MiniMax](/uk/providers/minimax)
    - **StepFun**: конфігурація автоматично записується для стандартного StepFun або Step Plan на китайських чи глобальних кінцевих точках.
    - Standard наразі містить `step-3.5-flash`, а Step Plan також містить `step-3.5-flash-2603`.
    - Докладніше: [StepFun](/uk/providers/stepfun)
    - **Synthetic (сумісний з Anthropic)**: запитує `SYNTHETIC_API_KEY`.
    - Докладніше: [Synthetic](/uk/providers/synthetic)
    - **Moonshot (Kimi K2)**: конфігурація записується автоматично.
    - **Kimi Coding**: конфігурація записується автоматично.
    - Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
    - **Пропустити**: автентифікацію ще не налаштовано.
    - Виберіть модель за замовчуванням із виявлених варіантів (або введіть постачальника/модель вручну). Для найкращої якості та нижчого ризику prompt injection виберіть найпотужнішу модель останнього покоління, доступну у вашому стеку постачальників.
    - Початкове налаштування запускає перевірку моделі й попереджає, якщо налаштована модель невідома або для неї бракує автентифікації.
    - Режим зберігання API-ключів за замовчуванням використовує відкриті текстові значення профілю автентифікації. Використайте `--secret-input-mode ref`, щоб натомість зберігати посилання на змінні середовища (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Профілі автентифікації зберігаються в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-ключі + OAuth). `~/.openclaw/credentials/oauth.json` є лише застарілим джерелом імпорту.
    - Докладніше: [/concepts/oauth](/uk/concepts/oauth)
    <Note>
    Порада для headless/серверного режиму: завершіть OAuth на комп’ютері з браузером, а потім скопіюйте
    `auth-profiles.json` цього агента (наприклад
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний
    шлях `$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
    є лише застарілим джерелом імпорту.
    </Note>
  </Step>
  <Step title="Workspace">
    - За замовчуванням `~/.openclaw/workspace` (можна налаштувати).
    - Створює початкові файли робочого простору, потрібні для ритуалу завантаження агента.
    - Повна структура робочого простору + посібник із резервного копіювання: [Робочий простір агента](/uk/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Порт, прив’язка, режим автентифікації, експозиція Tailscale.
    - Рекомендація щодо автентифікації: залишайте **Token** навіть для loopback, щоб локальні WS-клієнти мусили автентифікуватися.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти відкритий текстовий токен** (за замовчуванням)
      - **Використати SecretRef** (за явним вибором)
      - Quickstart повторно використовує наявні SecretRef `gateway.auth.token` у постачальниках `env`, `file` і `exec` для початкового пробного запуску/dashboard.
      - Якщо цей SecretRef налаштовано, але його неможливо розв’язати, початкове налаштування завершується рано з чітким повідомленням про виправлення, а не тихо послаблює автентифікацію під час виконання.
    - У режимі пароля інтерактивне налаштування також підтримує зберігання у відкритому тексті або SecretRef.
    - Неінтерактивний шлях SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої змінної середовища в середовищі процесу початкового налаштування.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback усе одно потребують автентифікації.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR.
    - [Telegram](/uk/channels/telegram): токен бота.
    - [Discord](/uk/channels/discord): токен бота.
    - [Google Chat](/uk/channels/googlechat): JSON сервісного облікового запису + аудиторія webhook.
    - [Mattermost](/uk/channels/mattermost) (plugin): токен бота + базовий URL.
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису.
    - [BlueBubbles](/uk/channels/bluebubbles): **рекомендовано для iMessage**; URL сервера + пароль + webhook.
    - [iMessage](/uk/channels/imessage): застарілий шлях CLI `imsg` + доступ до БД.
    - Безпека DM: за замовчуванням використовується сполучення. Перший DM надсилає код; схваліть через `openclaw pairing approve <channel> <code>` або використайте списки дозволених.

  </Step>
  <Step title="Web search">
    - Виберіть підтримуваного постачальника, наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG або Tavily (або пропустіть).
    - Постачальники з API можуть використовувати змінні середовища або наявну конфігурацію для швидкого налаштування; постачальники без ключів натомість використовують власні попередні вимоги.
    - Пропустіть за допомогою `--skip-search`.
    - Налаштувати пізніше: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - Потребує сеансу користувача з виконаним входом; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux (і Windows через WSL2): користувацький модуль systemd
      - Початкове налаштування намагається ввімкнути lingering через `loginctl enable-linger <user>`, щоб Gateway залишався запущеним після виходу.
      - Може запросити sudo (записує в `/var/lib/systemd/linger`); спершу пробує без sudo.
    - **Вибір середовища виконання:** Node (рекомендовано; потрібно для WhatsApp/Telegram). Bun **не рекомендовано**.
    - Якщо автентифікація токеном потребує токена, а `gateway.auth.token` керується через SecretRef, установлення демона перевіряє його, але не зберігає розв’язані відкриті текстові значення токена в метаданих середовища служби супервізора.
    - Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не розв’язується, установлення демона блокується з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення демона блокується, доки режим не буде задано явно.

  </Step>
  <Step title="Health check">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - Порада: `openclaw status --deep` додає оперативну перевірку стану Gateway до виводу статусу, зокрема перевірки каналів, коли вони підтримуються (потрібен доступний Gateway).

  </Step>
  <Step title="Skills (recommended)">
    - Читає доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер node: **npm / pnpm** (bun не рекомендовано).
    - Установлює необов’язкові залежності (деякі використовують Homebrew на macOS).

  </Step>
  <Step title="Finish">
    - Підсумок + наступні кроки, зокрема застосунки iOS/Android/macOS для додаткових функцій.

  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, початкове налаштування друкує інструкції SSH port-forward для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, початкове налаштування намагається зібрати їх; резервний варіант — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Неінтерактивний режим

Використовуйте `--non-interactive`, щоб автоматизувати або сценаризувати початкове налаштування:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Додайте `--json` для машинозчитуваного підсумку.

SecretRef токена Gateway у неінтерактивному режимі:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` і `--gateway-token-ref-env` є взаємовиключними.

<Note>
`--json` **не** означає неінтерактивний режим. Використовуйте `--non-interactive` (і `--workspace`) для скриптів.
</Note>

Приклади команд для окремих постачальників наведено в [Автоматизації CLI](/uk/start/wizard-cli-automation#provider-specific-examples).
Використовуйте цю довідкову сторінку для семантики прапорців і порядку кроків.

### Додати агента (неінтерактивно)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC майстра Gateway

Gateway надає процес початкового налаштування через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клієнти (застосунок macOS, Control UI) можуть відображати кроки без повторної реалізації логіки початкового налаштування.

## Налаштування Signal (signal-cli)

Початкове налаштування може встановити `signal-cli` з релізів GitHub:

- Завантажує відповідний ресурс релізу.
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`.
- Записує `channels.signal.cliPath` у вашу конфігурацію.

Примітки:

- Збірки JVM потребують **Java 21**.
- Native-збірки використовуються, коли доступні.
- Windows використовує WSL2; установлення signal-cli виконується за процесом Linux усередині WSL.

## Що записує майстер

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний онбординг за замовчуванням використовує `"coding"`, якщо не задано; наявні явно задані значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (деталі поведінки: [Довідник налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Списки дозволених каналів (Slack/Discord/Matrix/Microsoft Teams), коли ви погоджуєтеся на це під час підказок (імена за можливості зіставляються з ID).
- `skills.install.nodeManager`
  - `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручна конфігурація все ще може використовувати `yarn`, якщо напряму встановити `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

Деякі канали постачаються як плагіни. Коли ви виберете один із них під час налаштування, онбординг
запропонує встановити його (npm або локальний шлях), перш ніж його можна буде налаштувати.

## Пов’язані документи

- Огляд онбордингу: [Онбординг (CLI)](/uk/start/wizard)
- Онбординг застосунку macOS: [Онбординг](/uk/start/onboarding)
- Довідник конфігурації: [Конфігурація Gateway](/uk/gateway/configuration)
- Провайдери: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord), [Google Chat](/uk/channels/googlechat), [Signal](/uk/channels/signal), [BlueBubbles](/uk/channels/bluebubbles) (iMessage), [iMessage](/uk/channels/imessage) (застарілий)
- Skills: [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config)
