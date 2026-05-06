---
read_when:
    - Пошук конкретного кроку початкового налаштування або прапорця
    - Автоматизація початкового налаштування за допомогою неінтерактивного режиму
    - Налагодження поведінки онбордингу
sidebarTitle: Onboarding Reference
summary: 'Повний довідник із початкового налаштування CLI: кожен крок, прапор і поле конфігурації'
title: Довідник з онбордингу
x-i18n:
    generated_at: "2026-05-06T05:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce0ddb07600ef4f84c44734176e42eb6beaa00fede0be156f3bdd2ec1c0111bb
    source_path: reference/wizard.md
    workflow: 16
---

Це повний довідник для `openclaw onboard`.
Високорівневий огляд див. у [Onboarding (CLI)](/uk/start/wizard).

## Деталі потоку (локальний режим)

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть **Зберегти / Змінити / Скинути**.
    - Повторний запуск onboarding **не** видаляє нічого, якщо ви явно не виберете **Скинути**
      (або не передасте `--reset`).
    - CLI `--reset` за замовчуванням має область `config+creds+sessions`; використовуйте `--reset-scope full`,
      щоб також видалити робочий простір.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється й просить
      запустити `openclaw doctor`, перш ніж продовжити.
    - Скидання використовує `trash` (ніколи `rm`) і пропонує області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повне скидання (також видаляє робочий простір)

  </Step>
  <Step title="Модель/автентифікація">
    - **Ключ Anthropic API**: використовує `ANTHROPIC_API_KEY`, якщо він наявний, або просить ввести ключ, а потім зберігає його для використання демоном.
    - **Ключ Anthropic API**: бажаний вибір асистента Anthropic в onboarding/configure.
    - **setup-token Anthropic**: досі доступний в onboarding/configure, хоча OpenClaw тепер надає перевагу повторному використанню Claude CLI, коли це доступно.
    - **Підписка OpenAI Code (Codex) (OAuth)**: браузерний потік; вставте `code#state`.
      - Встановлює `agents.defaults.model` на `openai-codex/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.
    - **Підписка OpenAI Code (Codex) (сполучення пристрою)**: браузерний потік сполучення з короткочасним кодом пристрою.
      - Встановлює `agents.defaults.model` на `openai-codex/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.
    - **Ключ OpenAI API**: використовує `OPENAI_API_KEY`, якщо він наявний, або просить ввести ключ, а потім зберігає його в профілях автентифікації.
      - Встановлює `agents.defaults.model` на `openai/gpt-5.5`, коли модель не задана, `openai/*` або `openai-codex/*`.
    - **Ключ xAI (Grok) API**: просить ввести `XAI_API_KEY` і налаштовує xAI як постачальника моделей.
    - **OpenCode**: просить ввести `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`, отримайте його на https://opencode.ai/auth) і дає змогу вибрати каталог Zen або Go.
    - **Ollama**: спочатку пропонує **Хмара + локально**, **Лише хмара** або **Лише локально**. `Cloud only` просить ввести `OLLAMA_API_KEY` і використовує `https://ollama.com`; режими з хостом просять базовий URL Ollama, виявляють доступні моделі й автоматично завантажують вибрану локальну модель за потреби; `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для хмарного доступу.
    - Докладніше: [Ollama](/uk/providers/ollama)
    - **Ключ API**: зберігає ключ для вас.
    - **Vercel AI Gateway (багатомодельний проксі)**: просить ввести `AI_GATEWAY_API_KEY`.
    - Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: просить ввести Account ID, Gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
    - **MiniMax**: конфігурація записується автоматично; розміщене значення за замовчуванням — `MiniMax-M2.7`.
      Налаштування з ключем API використовує `minimax/...`, а налаштування OAuth використовує
      `minimax-portal/...`.
    - Докладніше: [MiniMax](/uk/providers/minimax)
    - **StepFun**: конфігурація записується автоматично для StepFun standard або Step Plan на китайських чи глобальних кінцевих точках.
    - Standard наразі містить `step-3.5-flash`, а Step Plan також містить `step-3.5-flash-2603`.
    - Докладніше: [StepFun](/uk/providers/stepfun)
    - **Synthetic (сумісний з Anthropic)**: просить ввести `SYNTHETIC_API_KEY`.
    - Докладніше: [Synthetic](/uk/providers/synthetic)
    - **Moonshot (Kimi K2)**: конфігурація записується автоматично.
    - **Kimi Coding**: конфігурація записується автоматично.
    - Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
    - **Пропустити**: автентифікацію ще не налаштовано.
    - Виберіть модель за замовчуванням із виявлених варіантів (або введіть provider/model вручну). Для найкращої якості та нижчого ризику prompt-injection виберіть найсильнішу модель останнього покоління, доступну у вашому стеку постачальників.
    - Onboarding запускає перевірку моделі й попереджає, якщо налаштована модель невідома або для неї бракує автентифікації.
    - Режим зберігання ключів API за замовчуванням використовує відкритий текст у значеннях auth-profile. Використовуйте `--secret-input-mode ref`, щоб натомість зберігати посилання на основі env (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Профілі автентифікації містяться в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (ключі API + OAuth). `~/.openclaw/credentials/oauth.json` — лише застаріле джерело імпорту.
    - Докладніше: [/concepts/oauth](/uk/concepts/oauth)
    <Note>
    Порада для headless/серверного режиму: завершіть OAuth на машині з браузером, а потім скопіюйте
    `auth-profiles.json` цього агента (наприклад
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний
    шлях `$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
    є лише застарілим джерелом імпорту.
    </Note>
  </Step>
  <Step title="Робочий простір">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Заповнює робочий простір файлами, потрібними для ритуалу bootstrap агента.
    - Повна структура робочого простору + посібник із резервного копіювання: [Робочий простір агента](/uk/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Порт, прив’язка, режим автентифікації, експозиція tailscale.
    - Рекомендація щодо автентифікації: залишайте **Token** навіть для loopback, щоб локальні WS-клієнти мусили автентифікуватися.
    - У режимі token інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти токен відкритим текстом** (типово)
      - **Використати SecretRef** (за згодою)
      - Quickstart повторно використовує наявні SecretRef `gateway.auth.token` у постачальниках `env`, `file` і `exec` для onboarding probe/dashboard bootstrap.
      - Якщо цей SecretRef налаштовано, але його не вдається розв’язати, onboarding завершується рано з чітким повідомленням про виправлення, замість тихо погіршувати автентифікацію runtime.
    - У режимі password інтерактивне налаштування також підтримує зберігання відкритим текстом або SecretRef.
    - Неінтерактивний шлях token SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої env var у середовищі процесу onboarding.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback усе одно потребують автентифікації.

  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR.
    - [Telegram](/uk/channels/telegram): токен бота.
    - [Discord](/uk/channels/discord): токен бота.
    - [Google Chat](/uk/channels/googlechat): service account JSON + аудиторія webhook.
    - [Mattermost](/uk/channels/mattermost) (plugin): токен бота + базовий URL.
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису.
    - [BlueBubbles](/uk/channels/bluebubbles): **рекомендовано для iMessage**; URL сервера + пароль + webhook.
    - [iMessage](/uk/channels/imessage): застарілий шлях CLI `imsg` + доступ до БД.
    - Безпека DM: за замовчуванням використовується сполучення. Перший DM надсилає код; підтвердьте через `openclaw pairing approve <channel> <code>` або використайте allowlists.

  </Step>
  <Step title="Вебпошук">
    - Виберіть підтримуваного постачальника, наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG або Tavily (або пропустіть).
    - Постачальники з API можуть використовувати env vars або наявну конфігурацію для швидкого налаштування; постачальники без ключів натомість використовують свої специфічні передумови.
    - Пропустіть за допомогою `--skip-search`.
    - Налаштувати пізніше: `openclaw configure --section web`.

  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потребує сесії користувача, що ввійшов у систему; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux (і Windows через WSL2): systemd user unit
      - Onboarding намагається ввімкнути lingering через `loginctl enable-linger <user>`, щоб Gateway залишався запущеним після виходу.
      - Може попросити sudo (записує `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - **Вибір runtime:** Node (рекомендовано; потрібно для WhatsApp/Telegram). Bun **не рекомендовано**.
    - Якщо token auth потребує токена, а `gateway.auth.token` керується SecretRef, встановлення демона перевіряє його, але не зберігає розв’язані значення токена відкритим текстом у метаданих середовища supervisor service.
    - Якщо token auth потребує токена, а налаштований token SecretRef не розв’язано, встановлення демона блокується з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення демона блокується, доки режим не буде задано явно.

  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - Порада: `openclaw status --deep` додає live gateway health probe до виводу статусу, зокрема channel probes, коли вони підтримуються (потребує доступного gateway).

  </Step>
  <Step title="Skills (рекомендовано)">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати node manager: **npm / pnpm** (bun не рекомендовано).
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).

  </Step>
  <Step title="Завершення">
    - Підсумок + наступні кроки, зокрема застосунки iOS/Android/macOS для додаткових функцій.

  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, onboarding виводить інструкції SSH port-forward для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, onboarding намагається їх зібрати; fallback — `pnpm ui:build` (автоматично встановлює залежності UI).
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

Додайте `--json` для машинозчитуваного підсумку.

Gateway token SecretRef у неінтерактивному режимі:

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

Приклади команд для окремих постачальників містяться в [CLI Automation](/uk/start/wizard-cli-automation#provider-specific-examples).
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

Gateway надає onboarding flow через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клієнти (застосунок macOS, Control UI) можуть відображати кроки без повторної реалізації логіки onboarding.

## Налаштування Signal (signal-cli)

Onboarding може встановити `signal-cli` з GitHub releases:

- Завантажує відповідний release asset.
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`.
- Записує `channels.signal.cliPath` у вашу конфігурацію.

Примітки:

- JVM-збірки потребують **Java 21**.
- Native-збірки використовуються, коли доступні.
- Windows використовує WSL2; встановлення signal-cli відбувається за потоком Linux усередині WSL.

## Що записує майстер

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальна адаптація за замовчуванням використовує `"coding"`, якщо не задано; наявні явно задані значення зберігаються)
- `gateway.*` (режим, прив’язка, автентифікація, tailscale)
- `session.dmScope` (деталі поведінки: [Довідник налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Списки дозволених каналів (Slack/Discord/Matrix/Microsoft Teams), коли ви погоджуєтеся під час підказок (назви за можливості перетворюються на ID).
- `skills.install.nodeManager`
  - `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручна конфігурація все ще може використовувати `yarn`, якщо встановити `skills.install.nodeManager` напряму.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сеанси зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

Деякі канали постачаються як плагіни. Коли ви виберете один із них під час налаштування, адаптація
запропонує встановити його (з npm або з локального шляху), перш ніж його можна буде налаштувати.

## Пов’язані документи

- Огляд адаптації: [Адаптація (CLI)](/uk/start/wizard)
- Адаптація застосунку macOS: [Адаптація](/uk/start/onboarding)
- Довідник конфігурації: [Конфігурація Gateway](/uk/gateway/configuration)
- Провайдери: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord), [Google Chat](/uk/channels/googlechat), [Signal](/uk/channels/signal), [BlueBubbles](/uk/channels/bluebubbles) (iMessage), [iMessage](/uk/channels/imessage) (застарілий)
- Skills: [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config)
