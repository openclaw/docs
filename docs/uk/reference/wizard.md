---
read_when:
    - Пошук конкретного кроку onboarding або прапорця
    - Автоматизація onboarding у неінтерактивному режимі
    - Налагодження поведінки onboarding
sidebarTitle: Onboarding Reference
summary: 'Повний довідник з CLI onboarding: кожен крок, прапорець і поле config'
title: Довідник з onboarding
x-i18n:
    generated_at: "2026-04-23T21:11:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccebd9b187df1b3b86814d83ff4507cbd89b2ade3339d0b3bd660358739f5368
    source_path: reference/wizard.md
    workflow: 15
---

Це повний довідник для `openclaw onboard`.
Огляд вищого рівня див. у [Onboarding (CLI)](/uk/start/wizard).

## Деталі потоку (локальний режим)

<Steps>
  <Step title="Виявлення наявної config">
    - Якщо існує `~/.openclaw/openclaw.json`, виберіть **Keep / Modify / Reset**.
    - Повторний запуск onboarding **не** стирає нічого, якщо ви явно не виберете **Reset**
      (або не передасте `--reset`).
    - CLI `--reset` типово охоплює `config+creds+sessions`; використовуйте `--reset-scope full`,
      щоб також видалити workspace.
    - Якщо config невалідна або містить legacy keys, майстер зупиняється і просить
      запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` (ніколи не `rm`) і пропонує області:
      - Лише config
      - Config + credentials + sessions
      - Повне скидання (також видаляє workspace)
  </Step>
  <Step title="Модель/Auth">
    - **API-ключ Anthropic**: використовує `ANTHROPIC_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його для демона.
    - **API-ключ Anthropic**: бажаний вибір Anthropic assistant у onboarding/configure.
    - **Setup-token Anthropic**: усе ще доступний у onboarding/configure, хоча OpenClaw тепер віддає перевагу повторному використанню Claude CLI, коли це можливо.
    - **Підписка OpenAI Code (Codex) (OAuth)**: browser-flow; вставте `code#state`.
      - Установлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задано або вона вже належить до сімейства OpenAI.
    - **Підписка OpenAI Code (Codex) (device pairing)**: browser-flow pairing з короткоживучим device code.
      - Установлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задано або вона вже належить до сімейства OpenAI.
    - **API-ключ OpenAI**: використовує `OPENAI_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його в auth profiles.
      - Установлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задано, має вигляд `openai/*` або `openai-codex/*`.
    - **API-ключ xAI (Grok)**: запитує `XAI_API_KEY` і налаштовує xAI як provider моделей.
    - **OpenCode**: запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`, отримайте його на https://opencode.ai/auth) і дає змогу вибрати catalog Zen або Go.
    - **Ollama**: спочатку пропонує **Cloud + Local**, **Cloud only** або **Local only**. `Cloud only` запитує `OLLAMA_API_KEY` і використовує `https://ollama.com`; режими, що працюють через хост, запитують base URL Ollama, виявляють доступні моделі та автоматично виконують pull вибраної локальної моделі за потреби; `Cloud + Local` також перевіряє, чи виконано вхід на цьому хості Ollama для хмарного доступу.
    - Докладніше: [Ollama](/uk/providers/ollama)
    - **API-ключ**: зберігає ключ за вас.
    - **Vercel AI Gateway (multi-model proxy)**: запитує `AI_GATEWAY_API_KEY`.
    - Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: запитує Account ID, Gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
    - **MiniMax**: config записується автоматично; типове хмарне значення — `MiniMax-M2.7`.
      Налаштування через API-ключ використовує `minimax/...`, а налаштування через OAuth — `minimax-portal/...`.
    - Докладніше: [MiniMax](/uk/providers/minimax)
    - **StepFun**: config автоматично записується для стандартного StepFun або Step Plan на китайських чи глобальних ендпоінтах.
    - Standard наразі включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    - Докладніше: [StepFun](/uk/providers/stepfun)
    - **Synthetic (сумісний з Anthropic)**: запитує `SYNTHETIC_API_KEY`.
    - Докладніше: [Synthetic](/uk/providers/synthetic)
    - **Moonshot (Kimi K2)**: config записується автоматично.
    - **Kimi Coding**: config записується автоматично.
    - Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
    - **Skip**: auth поки не налаштовано.
    - Виберіть типову модель із виявлених варіантів (або введіть provider/model вручну). Для найкращої якості та нижчого ризику prompt injection обирайте найсильнішу доступну модель останнього покоління у вашому стеку provider.
    - Onboarding запускає перевірку моделі й попереджає, якщо налаштована модель невідома або бракує auth.
    - Режим збереження API-ключів типово використовує plaintext-значення в auth profile. Використовуйте `--secret-input-mode ref`, щоб натомість зберігати посилання на env (наприклад, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth profiles розташовані в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-ключі + OAuth). `~/.openclaw/credentials/oauth.json` є застарілим і використовується лише для імпорту.
    - Докладніше: [/concepts/oauth](/uk/concepts/oauth)
    <Note>
    Порада для headless/server: завершіть OAuth на машині з браузером, а потім скопіюйте
    `auth-profiles.json` цього агента (наприклад,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний
    шлях `$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
    — це лише legacy-джерело імпорту.
    </Note>
  </Step>
  <Step title="Workspace">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Ініціалізує файли workspace, потрібні для bootstrap-ритуалу агента.
    - Повна структура workspace + посібник із резервного копіювання: [Workspace агента](/uk/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Порт, bind, режим auth, експозиція через Tailscale.
    - Рекомендація щодо auth: залишайте **Token** навіть для loopback, щоб локальні WS-клієнти мусили проходити автентифікацію.
    - У режимі token інтерактивне налаштування пропонує:
      - **Generate/store plaintext token** (типово)
      - **Use SecretRef** (opt-in)
      - Quickstart повторно використовує наявні SecretRef `gateway.auth.token` через провайдери `env`, `file` і `exec` для bootstrap probe/dashboard під час onboarding.
      - Якщо такий SecretRef налаштовано, але його неможливо розв’язати, onboarding завершується помилкою на ранньому етапі з чітким повідомленням про виправлення, замість тихого погіршення runtime auth.
    - У режимі password інтерактивне налаштування також підтримує збереження plaintext або через SecretRef.
    - Шлях SecretRef токена в неінтерактивному режимі: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої env var у середовищі процесу onboarding.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте auth лише якщо повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback усе одно потребують auth.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий QR-вхід.
    - [Telegram](/uk/channels/telegram): токен бота.
    - [Discord](/uk/channels/discord): токен бота.
    - [Google Chat](/uk/channels/googlechat): service account JSON + webhook audience.
    - [Mattermost](/uk/channels/mattermost) (plugin): токен бота + base URL.
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису.
    - [BlueBubbles](/uk/channels/bluebubbles): **рекомендовано для iMessage**; URL сервера + пароль + webhook.
    - [iMessage](/uk/channels/imessage): застарілий шлях через CLI `imsg` + доступ до БД.
    - Безпека DM: типово використовується pairing. Перше DM надсилає код; схваліть його через `openclaw pairing approve <channel> <code>` або використовуйте allowlist.
  </Step>
  <Step title="Web search">
    - Виберіть підтримуваного provider, наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG або Tavily (або пропустіть).
    - Providers на основі API можуть використовувати env vars або наявну config для швидкого налаштування; providers без ключів використовують свої специфічні передумови.
    - Пропустити можна через `--skip-search`.
    - Налаштувати пізніше: `openclaw configure --section web`.
  </Step>
  <Step title="Установлення демона">
    - macOS: LaunchAgent
      - Потребує сесії користувача з виконаним входом; для headless використовуйте користувацький LaunchDaemon (не постачається).
    - Linux (і Windows через WSL2): systemd user unit
      - Onboarding намагається увімкнути lingering через `loginctl enable-linger <user>`, щоб Gateway залишався активним після виходу з системи.
      - Може запросити sudo (запис у `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - **Вибір runtime:** Node (рекомендовано; обов’язково для WhatsApp/Telegram). Bun **не рекомендується**.
    - Якщо auth токеном потребує токен, а `gateway.auth.token` керується через SecretRef, установлення демона перевіряє його, але не зберігає розв’язане plaintext-значення токена в метаданих середовища supervisor service.
    - Якщо auth токеном потребує токен, а налаштований SecretRef токена не розв’язується, встановлення демона блокується з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення демона блокується, доки mode не буде задано явно.
  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - Порада: `openclaw status --deep` додає live-probe стану gateway до виводу status, включно з probes каналів, коли вони підтримуються (потрібен досяжний gateway).
  </Step>
  <Step title="Skills (рекомендовано)">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дозволяє вибрати менеджер node: **npm / pnpm** (bun не рекомендується).
    - Установлює необов’язкові залежності (деякі з них використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок + наступні кроки, включно з застосунками iOS/Android/macOS для додаткових можливостей.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, onboarding друкує інструкції для SSH port-forward до Control UI замість відкриття браузера.
Якщо відсутні assets Control UI, onboarding намагається зібрати їх; резервний варіант — `pnpm ui:build` (автоматично встановлює UI deps).
</Note>

## Неінтерактивний режим

Використовуйте `--non-interactive`, щоб автоматизувати або скриптувати onboarding:

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

Додайте `--json`, щоб отримати зведення у форматі для машинного читання.

SecretRef токена Gateway в неінтерактивному режимі:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` і `--gateway-token-ref-env` взаємовиключні.

<Note>
`--json` **не** означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive` (і `--workspace`).
</Note>

Приклади команд для конкретних provider наведено в [CLI Automation](/uk/start/wizard-cli-automation#provider-specific-examples).
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

Gateway надає потік onboarding через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клієнти (застосунок macOS, Control UI) можуть відображати кроки без повторної реалізації логіки onboarding.

## Налаштування Signal (`signal-cli`)

Onboarding може встановити `signal-cli` з релізів GitHub:

- Завантажує відповідний asset релізу.
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`.
- Записує `channels.signal.cliPath` у ваш config.

Примітки:

- Збірки для JVM потребують **Java 21**.
- Нативні збірки використовуються, коли доступні.
- Windows використовує WSL2; встановлення `signal-cli` виконується за потоком Linux усередині WSL.

## Що записує майстер

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний onboarding типово встановлює `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (деталі поведінки: [Довідник із налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist каналів (Slack/Discord/Matrix/Microsoft Teams), коли ви погоджуєтеся на це під час запитів (імена за можливості розв’язуються в ID).
- `skills.install.nodeManager`
  - `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - У ручній config можна й далі використовувати `yarn`, задавши `skills.install.nodeManager` напряму.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Credentials WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

Деякі канали постачаються як plugins. Коли ви вибираєте один із них під час налаштування, onboarding
запропонує встановити його (через npm або локальний шлях), перш ніж його можна буде налаштувати.

## Пов’язана документація

- Огляд onboarding: [Onboarding (CLI)](/uk/start/wizard)
- Onboarding застосунку macOS: [Onboarding](/uk/start/onboarding)
- Довідник із config: [Конфігурація Gateway](/uk/gateway/configuration)
- Providers: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord), [Google Chat](/uk/channels/googlechat), [Signal](/uk/channels/signal), [BlueBubbles](/uk/channels/bluebubbles) (iMessage), [iMessage](/uk/channels/imessage) (legacy)
- Skills: [Skills](/uk/tools/skills), [Config Skills](/uk/tools/skills-config)
