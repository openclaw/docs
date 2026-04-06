---
read_when:
    - Пошук конкретного кроку онбордингу або прапорця
    - Автоматизація онбордингу в неінтерактивному режимі
    - Налагодження поведінки онбордингу
sidebarTitle: Onboarding Reference
summary: 'Повний довідник з онбордингу в CLI: кожен крок, прапорець і поле конфігурації'
title: Довідник з онбордингу
x-i18n:
    generated_at: "2026-04-06T15:32:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: a142b9ec4323fabb9982d05b64375d2b4a4007dffc910acbee3a38ff871a7236
    source_path: reference/wizard.md
    workflow: 15
---

# Довідник з онбордингу

Це повний довідник для `openclaw onboard`.
Огляд високого рівня див. у [Onboarding (CLI)](/uk/start/wizard).

## Докладно про потік (локальний режим)

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо існує `~/.openclaw/openclaw.json`, виберіть **Keep / Modify / Reset**.
    - Повторний запуск онбордингу **не** стирає нічого, якщо ви явно не виберете **Reset**
      (або не передасте `--reset`).
    - CLI `--reset` типово використовує `config+creds+sessions`; використовуйте `--reset-scope full`,
      щоб також видалити workspace.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється і просить
      вас запустити `openclaw doctor`, перш ніж продовжувати.
    - Reset використовує `trash` (ніколи не `rm`) і пропонує такі області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сеанси
      - Повний скидання (також видаляє workspace)
  </Step>
  <Step title="Модель/автентифікація">
    - **API-ключ Anthropic**: використовує `ANTHROPIC_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його для використання демоном.
    - **API-ключ Anthropic**: бажаний варіант Anthropic assistant в onboarding/configure.
    - **Anthropic setup-token**: усе ще доступний в onboarding/configure, хоча OpenClaw тепер надає перевагу повторному використанню Claude CLI, коли це можливо.
    - **Підписка OpenAI Code (Codex) (Codex CLI)**: якщо існує `~/.codex/auth.json`, онбординг може повторно використати його. Повторно використані облікові дані Codex CLI і далі керуються Codex CLI; після завершення строку дії OpenClaw спочатку знову читає це джерело і, коли постачальник може його оновити, записує оновлені облікові дані назад у сховище Codex замість того, щоб перебирати керування на себе.
    - **Підписка OpenAI Code (Codex) (OAuth)**: потік через браузер; вставте `code#state`.
      - Встановлює `agents.defaults.model` у `openai-codex/gpt-5.4`, коли модель не задана або має вигляд `openai/*`.
    - **API-ключ OpenAI**: використовує `OPENAI_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його в профілях автентифікації.
      - Встановлює `agents.defaults.model` у `openai/gpt-5.4`, коли модель не задана, має вигляд `openai/*` або `openai-codex/*`.
    - **API-ключ xAI (Grok)**: запитує `XAI_API_KEY` і налаштовує xAI як постачальника моделей.
    - **OpenCode**: запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`, отримайте його на https://opencode.ai/auth) і дає змогу вибрати каталог Zen або Go.
    - **Ollama**: запитує базову URL-адресу Ollama, пропонує режим **Cloud + Local** або **Local**, виявляє доступні моделі та автоматично завантажує вибрану локальну модель, якщо це потрібно.
    - Докладніше: [Ollama](/uk/providers/ollama)
    - **API key**: зберігає ключ за вас.
    - **Vercel AI Gateway (багатомодельний proxy)**: запитує `AI_GATEWAY_API_KEY`.
    - Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: запитує Account ID, Gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
    - **MiniMax**: конфігурація записується автоматично; типовим хостинговим значенням є `MiniMax-M2.7`.
      Налаштування з API-ключем використовує `minimax/...`, а налаштування з OAuth — `minimax-portal/...`.
    - Докладніше: [MiniMax](/uk/providers/minimax)
    - **StepFun**: конфігурація автоматично записується для стандартного StepFun або Step Plan на китайських чи глобальних кінцевих точках.
    - Стандарт зараз включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    - Докладніше: [StepFun](/uk/providers/stepfun)
    - **Synthetic (сумісний з Anthropic)**: запитує `SYNTHETIC_API_KEY`.
    - Докладніше: [Synthetic](/uk/providers/synthetic)
    - **Moonshot (Kimi K2)**: конфігурація записується автоматично.
    - **Kimi Coding**: конфігурація записується автоматично.
    - Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
    - **Skip**: автентифікація поки не налаштована.
    - Виберіть типову модель із виявлених варіантів (або введіть provider/model вручну). Для найкращої якості та нижчого ризику ін’єкцій у prompt вибирайте найсильнішу модель останнього покоління, доступну у вашому стеку постачальників.
    - Онбординг запускає перевірку моделі й попереджає, якщо налаштована модель невідома або для неї бракує автентифікації.
    - Режим зберігання API-ключів типово використовує plaintext-значення в профілях автентифікації. Використовуйте `--secret-input-mode ref`, щоб натомість зберігати посилання на основі env (наприклад, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Профілі автентифікації розміщуються в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-ключі + OAuth). `~/.openclaw/credentials/oauth.json` — лише застаріле джерело імпорту.
    - Докладніше: [/concepts/oauth](/uk/concepts/oauth)
    <Note>
    Порада для безголових серверів: завершіть OAuth на машині з браузером, а потім скопіюйте
    `auth-profiles.json` цього агента (наприклад,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний
    шлях `$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
    є лише застарілим джерелом імпорту.
    </Note>
  </Step>
  <Step title="Workspace">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Ініціалізує файли workspace, потрібні для ритуалу початкового запуску агента.
    - Повну структуру workspace та посібник із резервного копіювання див. тут: [Agent workspace](/uk/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Порт, bind, режим автентифікації, відкриття через Tailscale.
    - Рекомендація щодо автентифікації: зберігайте **Token** навіть для loopback, щоб локальні WS-клієнти мали проходити автентифікацію.
    - У режимі token інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти plaintext token** (типово)
      - **Використовувати SecretRef** (opt-in)
      - Quickstart повторно використовує наявні SecretRef `gateway.auth.token` через постачальників `env`, `file` і `exec` для bootstrap probe/dashboard під час онбордингу.
      - Якщо цей SecretRef налаштовано, але його не вдається розв’язати, онбординг завершується помилкою на ранньому етапі з чітким повідомленням щодо виправлення замість тихого погіршення runtime-автентифікації.
    - У режимі password інтерактивне налаштування також підтримує зберігання у plaintext або через SecretRef.
    - Шлях SecretRef token у неінтерактивному режимі: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої змінної середовища в оточенні процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо ви повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback усе одно вимагають автентифікації.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR.
    - [Telegram](/uk/channels/telegram): токен бота.
    - [Discord](/uk/channels/discord): токен бота.
    - [Google Chat](/uk/channels/googlechat): JSON облікового запису служби + webhook audience.
    - [Mattermost](/uk/channels/mattermost) (плагін): токен бота + базова URL-адреса.
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису.
    - [BlueBubbles](/uk/channels/bluebubbles): **рекомендовано для iMessage**; URL-адреса сервера + пароль + webhook.
    - [iMessage](/uk/channels/imessage): застарілий шлях CLI `imsg` + доступ до БД.
    - Безпека DM: типово використовується pairing. Перше DM надсилає код; підтвердіть через `openclaw pairing approve <channel> <code>` або використовуйте allowlists.
  </Step>
  <Step title="Вебпошук">
    - Виберіть підтримуваного постачальника, наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG або Tavily (або пропустіть).
    - Постачальники з API можуть використовувати змінні середовища або наявну конфігурацію для швидкого налаштування; постачальники без ключа натомість використовують свої специфічні передумови.
    - Пропустіть за допомогою `--skip-search`.
    - Налаштувати пізніше: `openclaw configure --section web`.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потребує активної користувацької сесії; для безголового режиму використовуйте власний LaunchDaemon (не постачається).
    - Linux (і Windows через WSL2): systemd user unit
      - Онбординг намагається ввімкнути lingering через `loginctl enable-linger <user>`, щоб Gateway залишався запущеним після виходу з сеансу.
      - Може запросити sudo (записує у `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - **Вибір runtime:** Node (рекомендовано; обов’язково для WhatsApp/Telegram). Bun **не рекомендовано**.
    - Якщо для автентифікації token потрібен token і `gateway.auth.token` керується через SecretRef, встановлення демона перевіряє його, але не зберігає розв’язані plaintext-значення token у метаданих середовища служби супервізора.
    - Якщо для автентифікації token потрібен token, а налаштований SecretRef token не розв’язується, встановлення демона блокується з практичними підказками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення демона блокується, доки режим не буде явно вказано.
  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - Порада: `openclaw status --deep` додає живу перевірку стану gateway до виводу status, зокрема probe каналів, коли вони підтримуються (потрібен доступний gateway).
  </Step>
  <Step title="Skills (рекомендовано)">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер node: **npm / pnpm** (bun не рекомендовано).
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок + наступні кроки, зокрема застосунки для iOS/Android/macOS для додаткових функцій.
  </Step>
</Steps>

<Note>
Якщо графічний інтерфейс не виявлено, онбординг друкує інструкції для переспрямування портів SSH для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, онбординг намагається зібрати їх; резервний варіант — `pnpm ui:build` (автоматично встановлює UI-залежності).
</Note>

## Неінтерактивний режим

Використовуйте `--non-interactive`, щоб автоматизувати або скриптувати онбординг:

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

SecretRef token gateway у неінтерактивному режимі:

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
`--json` **не** означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive` (і `--workspace`).
</Note>

Приклади команд для конкретних постачальників наведені в [CLI Automation](/uk/start/wizard-cli-automation#provider-specific-examples).
Використовуйте цю довідкову сторінку для семантики прапорців і порядку кроків.

### Додавання агента (неінтерактивно)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC майстра Gateway

Gateway надає потік онбордингу через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клієнти (застосунок macOS, Control UI) можуть відображати кроки, не реалізуючи повторно логіку онбордингу.

## Налаштування Signal (`signal-cli`)

Онбординг може встановлювати `signal-cli` з релізів GitHub:

- Завантажує відповідний asset релізу.
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`.
- Записує `channels.signal.cliPath` у вашу конфігурацію.

Примітки:

- Збірки JVM потребують **Java 21**.
- Якщо доступні, використовуються native-збірки.
- Windows використовує WSL2; встановлення signal-cli дотримується linux-потоку всередині WSL.

## Що записує майстер

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний онбординг типово встановлює `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (докладно про поведінку: [CLI Setup Reference](/uk/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel allowlists (Slack/Discord/Matrix/Microsoft Teams), якщо ви погодилися на них під час підказок (імена за можливості розв’язуються в ID).
- `skills.install.nodeManager`
  - `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручна конфігурація все ще може використовувати `yarn`, якщо напряму встановити `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp розміщуються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сеанси зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

Деякі канали постачаються як plugins. Коли ви вибираєте один із них під час налаштування, онбординг
запропонує встановити його (npm або локальний шлях), перш ніж його можна буде налаштувати.

## Пов’язана документація

- Огляд онбордингу: [Onboarding (CLI)](/uk/start/wizard)
- Онбординг у застосунку macOS: [Onboarding](/uk/start/onboarding)
- Довідник із конфігурації: [Gateway configuration](/uk/gateway/configuration)
- Постачальники: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord), [Google Chat](/uk/channels/googlechat), [Signal](/uk/channels/signal), [BlueBubbles](/uk/channels/bluebubbles) (iMessage), [iMessage](/uk/channels/imessage) (застарілий)
- Skills: [Skills](/uk/tools/skills), [Skills config](/uk/tools/skills-config)
