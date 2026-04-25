---
read_when:
    - Пошук конкретного кроку онбордингу або прапорця
    - Автоматизація онбордингу в неінтерактивному режимі
    - Налагодження поведінки онбордингу
sidebarTitle: Onboarding Reference
summary: 'Повний довідник з онбордингу CLI: кожен крок, прапорець і поле конфігурації'
title: Довідник з онбордингу
x-i18n:
    generated_at: "2026-04-25T17:33:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 729a12bac6b67b32ba4b2b2068a30240d2118f5afe3812c701ee65d7b7e13018
    source_path: reference/wizard.md
    workflow: 15
---

Це повний довідник для `openclaw onboard`.
Огляд високого рівня див. у [Onboarding (CLI)](/uk/start/wizard).

## Докладно про потік (локальний режим)

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть **Keep / Modify / Reset**.
    - Повторний запуск онбордингу **не** стирає нічого, якщо ви явно не виберете **Reset**
      (або не передасте `--reset`).
    - CLI `--reset` типово використовує `config+creds+sessions`; щоб також видалити workspace, використовуйте `--reset-scope full`.
    - Якщо конфігурація невалідна або містить застарілі ключі, майстер зупиняється і просить
      вас запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` (ніколи не `rm`) і пропонує такі області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повний reset (також видаляє workspace)
  </Step>
  <Step title="Модель/Auth">
    - **API-ключ Anthropic**: використовує `ANTHROPIC_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його для використання daemon.
    - **API-ключ Anthropic**: бажаний варіант помічника Anthropic під час онбордингу/налаштування.
    - **Anthropic setup-token**: усе ще доступний в онбордингу/налаштуванні, хоча OpenClaw тепер надає перевагу повторному використанню Claude CLI, якщо це можливо.
    - **Підписка OpenAI Code (Codex) (OAuth)**: потік через браузер; вставте `code#state`.
      - Встановлює `agents.defaults.model` у `openai-codex/gpt-5.5`, якщо модель не задано або вона вже належить до сімейства OpenAI.
    - **Підписка OpenAI Code (Codex) (device pairing)**: потік парування в браузері з короткоживучим кодом пристрою.
      - Встановлює `agents.defaults.model` у `openai-codex/gpt-5.5`, якщо модель не задано або вона вже належить до сімейства OpenAI.
    - **API-ключ OpenAI**: використовує `OPENAI_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його в auth profiles.
      - Встановлює `agents.defaults.model` у `openai/gpt-5.5`, якщо модель не задано, це `openai/*` або `openai-codex/*`.
    - **API-ключ xAI (Grok)**: запитує `XAI_API_KEY` і налаштовує xAI як постачальника моделей.
    - **OpenCode**: запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`, отримайте його на https://opencode.ai/auth) і дає змогу вибрати каталог Zen або Go.
    - **Ollama**: спочатку пропонує **Cloud + Local**, **Cloud only** або **Local only**. `Cloud only` запитує `OLLAMA_API_KEY` і використовує `https://ollama.com`; режими з хостом запитують base URL Ollama, виявляють доступні моделі й автоматично виконують pull вибраної локальної моделі, якщо це потрібно; `Cloud + Local` також перевіряє, чи виконано вхід на цьому хості Ollama для хмарного доступу.
    - Докладніше: [Ollama](/uk/providers/ollama)
    - **API key**: зберігає ключ за вас.
    - **Vercel AI Gateway (багатомодельний проксі)**: запитує `AI_GATEWAY_API_KEY`.
    - Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: запитує Account ID, Gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
    - **MiniMax**: конфігурація записується автоматично; типовий розміщений варіант — `MiniMax-M2.7`.
      Налаштування через API-ключ використовує `minimax/...`, а налаштування через OAuth —
      `minimax-portal/...`.
    - Докладніше: [MiniMax](/uk/providers/minimax)
    - **StepFun**: конфігурація записується автоматично для стандартного StepFun або Step Plan на китайських чи глобальних endpoint.
    - Стандартний варіант зараз містить `step-3.5-flash`, а Step Plan також містить `step-3.5-flash-2603`.
    - Докладніше: [StepFun](/uk/providers/stepfun)
    - **Synthetic (Anthropic-сумісний)**: запитує `SYNTHETIC_API_KEY`.
    - Докладніше: [Synthetic](/uk/providers/synthetic)
    - **Moonshot (Kimi K2)**: конфігурація записується автоматично.
    - **Kimi Coding**: конфігурація записується автоматично.
    - Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
    - **Skip**: auth поки не налаштовано.
    - Виберіть типову модель із виявлених варіантів (або введіть provider/model вручну). Для найкращої якості та нижчого ризику prompt-injection вибирайте найсильнішу доступну модель останнього покоління у вашому стеку постачальників.
    - Під час онбордингу виконується перевірка моделі та показується попередження, якщо налаштована модель невідома або для неї бракує auth.
    - Режим зберігання API-ключів типово використовує відкриті значення auth-profile. Використовуйте `--secret-input-mode ref`, щоб натомість зберігати ref на основі env (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth profiles зберігаються в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-ключі + OAuth). `~/.openclaw/credentials/oauth.json` — це застаріле джерело лише для імпорту.
    - Докладніше: [/concepts/oauth](/uk/concepts/oauth)
    <Note>
    Порада для headless/server: завершіть OAuth на машині з браузером, а потім скопіюйте
    `auth-profiles.json` цього агента (наприклад
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний шлях
    `$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
    — лише застаріле джерело імпорту.
    </Note>
  </Step>
  <Step title="Workspace">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Ініціалізує файли workspace, потрібні для bootstrap ritual агента.
    - Повну структуру workspace і посібник із резервного копіювання див. у [Agent workspace](/uk/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Порт, bind, режим auth, доступ через Tailscale.
    - Рекомендація щодо auth: залишайте **Token** навіть для loopback, щоб локальні клієнти WS мали пройти автентифікацію.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти відкритий токен** (типово)
      - **Use SecretRef** (за бажанням)
      - Quickstart повторно використовує наявні SecretRef `gateway.auth.token` у постачальниках `env`, `file` і `exec` для probe/dashboard bootstrap під час онбордингу.
      - Якщо цей SecretRef налаштовано, але його неможливо розв’язати, онбординг завершується рано з чітким повідомленням про виправлення замість тихого погіршення auth під час виконання.
    - У режимі пароля інтерактивне налаштування також підтримує зберігання у відкритому вигляді або через SecretRef.
    - Шлях неінтерактивного SecretRef токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої env var у середовищі процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте auth лише якщо повністю довіряєте кожному локальному процесу.
    - Bind не на loopback усе одно потребує auth.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR.
    - [Telegram](/uk/channels/telegram): токен бота.
    - [Discord](/uk/channels/discord): токен бота.
    - [Google Chat](/uk/channels/googlechat): JSON service account + webhook audience.
    - [Mattermost](/uk/channels/mattermost) (plugin): токен бота + base URL.
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису.
    - [BlueBubbles](/uk/channels/bluebubbles): **рекомендовано для iMessage**; URL сервера + пароль + webhook.
    - [iMessage](/uk/channels/imessage): застарілий шлях CLI `imsg` + доступ до БД.
    - Безпека DM: типово використовується pairing. Перший DM надсилає код; схваліть через `openclaw pairing approve <channel> <code>` або використовуйте allowlist.
  </Step>
  <Step title="Вебпошук">
    - Виберіть підтримуваного постачальника, наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG або Tavily (або пропустіть).
    - Постачальники з API можуть використовувати env vars або наявну конфігурацію для швидкого налаштування; постачальники без ключів використовують специфічні для них передумови.
    - Пропустити можна через `--skip-search`.
    - Налаштувати пізніше: `openclaw configure --section web`.
  </Step>
  <Step title="Установлення daemon">
    - macOS: LaunchAgent
      - Потребує сеансу користувача з виконаним входом; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux (і Windows через WSL2): systemd user unit
      - Під час онбордингу виконується спроба ввімкнути lingering через `loginctl enable-linger <user>`, щоб Gateway продовжував працювати після виходу з сеансу.
      - Може попросити sudo (записує в `/var/lib/systemd/linger`); спочатку виконується спроба без sudo.
    - **Вибір runtime:** Node (рекомендовано; обов’язково для WhatsApp/Telegram). Bun **не рекомендовано**.
    - Якщо auth токеном потребує токен, а `gateway.auth.token` керується через SecretRef, установлення daemon перевіряє його, але не зберігає розв’язане відкрите значення токена в метаданих середовища сервісу supervisor.
    - Якщо auth токеном потребує токен, а налаштований SecretRef токена не розв’язується, установлення daemon блокується з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення daemon блокується, доки режим не буде явно встановлено.
  </Step>
  <Step title="Перевірка працездатності">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - Порада: `openclaw status --deep` додає live-probe працездатності gateway до виводу status, зокрема probe каналів, коли це підтримується (потребує доступного gateway).
  </Step>
  <Step title="Skills (рекомендовано)">
    - Читає доступні Skills і перевіряє вимоги.
    - Дозволяє вибрати менеджер node: **npm / pnpm** (bun не рекомендовано).
    - Установлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок + наступні кроки, зокрема застосунки iOS/Android/macOS для додаткових можливостей.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, онбординг виводить інструкції SSH port-forward для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, онбординг намагається їх зібрати; fallback — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Неінтерактивний режим

Використовуйте `--non-interactive`, щоб автоматизувати онбординг або запускати його зі скриптів:

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

Додайте `--json`, щоб отримати машинозчитуваний підсумок.

SecretRef токена gateway в неінтерактивному режимі:

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
`--json` **не** вмикає неінтерактивний режим автоматично. Для скриптів використовуйте `--non-interactive` (і `--workspace`).
</Note>

Приклади команд для окремих постачальників наведено в [CLI Automation](/uk/start/wizard-cli-automation#provider-specific-examples).
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

## Gateway wizard RPC

Gateway надає потік онбордингу через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клієнти (застосунок macOS, Control UI) можуть відображати кроки, не перевпроваджуючи логіку онбордингу.

## Налаштування Signal (`signal-cli`)

Під час онбордингу можна встановити `signal-cli` з GitHub releases:

- Завантажується відповідний ресурс релізу.
- Він зберігається в `~/.openclaw/tools/signal-cli/<version>/`.
- У конфігурацію записується `channels.signal.cliPath`.

Примітки:

- Збірки JVM потребують **Java 21**.
- За наявності використовуються нативні збірки.
- Windows використовує WSL2; встановлення signal-cli відбувається за сценарієм Linux всередині WSL.

## Що записує майстер

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний онбординг типово використовує `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (режим, bind, auth, tailscale)
- `session.dmScope` (докладно про поведінку: [CLI Setup Reference](/uk/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist каналів (Slack/Discord/Matrix/Microsoft Teams), якщо ви вмикаєте їх у підказках (імена, де можливо, перетворюються на id).
- `skills.install.nodeManager`
  - `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - У ручній конфігурації все ще можна використовувати `yarn`, задавши `skills.install.nodeManager` безпосередньо.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

Деякі канали постачаються як plugins. Коли ви вибираєте такий канал під час налаштування, онбординг
запропонує встановити його (npm або локальний шлях), перш ніж його можна буде налаштувати.

## Пов’язані документи

- Огляд онбордингу: [Onboarding (CLI)](/uk/start/wizard)
- Онбординг застосунку macOS: [Onboarding](/uk/start/onboarding)
- Довідник з конфігурації: [Gateway configuration](/uk/gateway/configuration)
- Постачальники: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord), [Google Chat](/uk/channels/googlechat), [Signal](/uk/channels/signal), [BlueBubbles](/uk/channels/bluebubbles) (iMessage), [iMessage](/uk/channels/imessage) (застаріле)
- Skills: [Skills](/uk/tools/skills), [Skills config](/uk/tools/skills-config)
