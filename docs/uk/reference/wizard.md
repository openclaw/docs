---
read_when:
    - Пошук конкретного кроку онбордингу або прапорця
    - Автоматизація онбордингу за допомогою неінтерактивного режиму
    - Налагодження поведінки онбордингу
sidebarTitle: Onboarding Reference
summary: 'Повний довідник для онбордингу CLI: кожен крок, прапорець і поле конфігурації'
title: Довідник з онбордингу
x-i18n:
    generated_at: "2026-04-23T20:06:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b3874415ca6c5d948190655859cbaacc8d880257e79d4e3089ea7334eff7d74
    source_path: reference/wizard.md
    workflow: 15
---

# Довідник з онбордингу

Це повний довідник для `openclaw onboard`.
Для огляду на високому рівні див. [Онбординг (CLI)](/uk/start/wizard).

## Деталі потоку (локальний режим)

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть **Зберегти / Змінити / Скинути**.
    - Повторний запуск онбордингу **не** стирає нічого, якщо ви явно не виберете **Скинути**
      (або не передасте `--reset`).
    - Для CLI `--reset` типово використовує `config+creds+sessions`; використайте `--reset-scope full`,
      щоб також видалити робочий простір.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється і просить
      вас запустити `openclaw doctor` перед продовженням.
    - Скидання використовує `trash` (ніколи не `rm`) і пропонує області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повне скидання (також видаляє робочий простір)
  </Step>
  <Step title="Модель/автентифікація">
    - **Anthropic API key**: використовує `ANTHROPIC_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його для використання демоном.
    - **Anthropic API key**: бажаний вибір помічника Anthropic в onboarding/configure.
    - **Anthropic setup-token**: усе ще доступний в onboarding/configure, хоча OpenClaw тепер надає перевагу повторному використанню Claude CLI, коли це можливо.
    - **OpenAI Code (Codex) subscription (OAuth)**: потік через браузер; вставте `code#state`.
      - Встановлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.
    - **OpenAI Code (Codex) subscription (device pairing)**: потік спарювання в браузері з короткоживучим кодом пристрою.
      - Встановлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задана або вже належить до сімейства OpenAI.
    - **OpenAI API key**: використовує `OPENAI_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його в профілях автентифікації.
      - Встановлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задана, має вигляд `openai/*` або `openai-codex/*`.
    - **xAI (Grok) API key**: запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделей.
    - **OpenCode**: запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`, отримати можна на https://opencode.ai/auth) і дозволяє вибрати каталог Zen або Go.
    - **Ollama**: спочатку пропонує **Cloud + Local**, **Cloud only** або **Local only**. `Cloud only` запитує `OLLAMA_API_KEY` і використовує `https://ollama.com`; режими з хостом запитують базову URL-адресу Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель за потреби; `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для доступу до cloud.
    - Докладніше: [Ollama](/uk/providers/ollama)
    - **API key**: зберігає ключ за вас.
    - **Vercel AI Gateway (багатомодельний проксі)**: запитує `AI_GATEWAY_API_KEY`.
    - Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: запитує Account ID, Gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
    - **MiniMax**: конфігурація записується автоматично; hosted-варіант за замовчуванням — `MiniMax-M2.7`.
      Налаштування через API-ключ використовує `minimax/...`, а налаштування через OAuth використовує
      `minimax-portal/...`.
    - Докладніше: [MiniMax](/uk/providers/minimax)
    - **StepFun**: конфігурація автоматично записується для StepFun standard або Step Plan на китайських або глобальних endpoint.
    - Standard наразі включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    - Докладніше: [StepFun](/uk/providers/stepfun)
    - **Synthetic (сумісний з Anthropic)**: запитує `SYNTHETIC_API_KEY`.
    - Докладніше: [Synthetic](/uk/providers/synthetic)
    - **Moonshot (Kimi K2)**: конфігурація записується автоматично.
    - **Kimi Coding**: конфігурація записується автоматично.
    - Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
    - **Пропустити**: автентифікацію поки що не налаштовано.
    - Виберіть модель за замовчуванням із виявлених варіантів (або введіть provider/model вручну). Для найкращої якості та нижчого ризику prompt injection виберіть найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    - Онбординг запускає перевірку моделі та попереджає, якщо налаштована модель невідома або для неї відсутня автентифікація.
    - Режим зберігання API-ключів за замовчуванням — значення auth-profile у відкритому тексті. Використайте `--secret-input-mode ref`, щоб зберігати натомість посилання на змінні середовища (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Профілі автентифікації знаходяться в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-ключі + OAuth). `~/.openclaw/credentials/oauth.json` — це застаріле джерело лише для імпорту.
    - Докладніше: [/concepts/oauth](/uk/concepts/oauth)
    <Note>
    Порада для headless/server: завершіть OAuth на машині з браузером, а потім скопіюйте
    `auth-profiles.json` цього агента (наприклад
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний шлях
    `$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
    є лише застарілим джерелом імпорту.
    </Note>
  </Step>
  <Step title="Робочий простір">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Ініціалізує файли робочого простору, потрібні для ритуалу bootstrap агента.
    - Повна структура робочого простору + посібник із резервного копіювання: [Робочий простір агента](/uk/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Порт, bind, режим автентифікації, експонування через tailscale.
    - Рекомендація щодо автентифікації: залишайте **Token** навіть для loopback, щоб локальні WS-клієнти мали проходити автентифікацію.
    - У режимі token інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти token у відкритому тексті** (за замовчуванням)
      - **Використати SecretRef** (за бажанням)
      - Quickstart повторно використовує наявні SecretRef `gateway.auth.token` у провайдерах `env`, `file` і `exec` для probe/dashboard bootstrap під час онбордингу.
      - Якщо цей SecretRef налаштовано, але його не вдається розв’язати, онбординг завершується рано з чітким повідомленням про виправлення замість тихого погіршення runtime-автентифікації.
    - У режимі password інтерактивне налаштування також підтримує зберігання у відкритому тексті або через SecretRef.
    - Шлях SecretRef token у неінтерактивному режимі: `--gateway-token-ref-env <ENV_VAR>`.
      - Потрібна непорожня змінна середовища в середовищі процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо ви повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback усе одно потребують автентифікації.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR.
    - [Telegram](/uk/channels/telegram): token бота.
    - [Discord](/uk/channels/discord): token бота.
    - [Google Chat](/uk/channels/googlechat): JSON service account + аудиторія webhook.
    - [Mattermost](/uk/channels/mattermost) (plugin): token бота + базова URL-адреса.
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису.
    - [BlueBubbles](/uk/channels/bluebubbles): **рекомендовано для iMessage**; URL-адреса сервера + пароль + webhook.
    - [iMessage](/uk/channels/imessage): застарілий шлях до CLI `imsg` + доступ до БД.
    - Безпека DM: за замовчуванням використовується спарювання. Перший DM надсилає код; підтвердьте через `openclaw pairing approve <channel> <code>` або використовуйте allowlist.
  </Step>
  <Step title="Вебпошук">
    - Виберіть підтримуваного провайдера, наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG або Tavily (або пропустіть).
    - Провайдери з API можуть використовувати змінні середовища або наявну конфігурацію для швидкого налаштування; провайдери без ключів натомість використовують свої специфічні передумови.
    - Пропустити через `--skip-search`.
    - Налаштувати пізніше: `openclaw configure --section web`.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потребує сеансу користувача з входом у систему; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux (і Windows через WSL2): unit systemd користувача
      - Онбординг намагається увімкнути lingering через `loginctl enable-linger <user>`, щоб Gateway залишався запущеним після виходу з системи.
      - Може запросити sudo (записує у `/var/lib/systemd/linger`); спочатку намагається без sudo.
    - **Вибір середовища виконання:** Node (рекомендовано; обов’язково для WhatsApp/Telegram). Bun **не рекомендовано**.
    - Якщо для token-автентифікації потрібен token і `gateway.auth.token` керується через SecretRef, встановлення демона перевіряє його, але не зберігає розв’язані plaintext-значення token у метаданих середовища сервісу supervisor.
    - Якщо для token-автентифікації потрібен token і налаштований token SecretRef не розв’язується, встановлення демона блокується з практичними вказівками.
    - Якщо налаштовані і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення демона блокується, доки режим не буде встановлено явно.
  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - Порада: `openclaw status --deep` додає живу health probe Gateway до виводу статусу, включно з probe каналів, якщо це підтримується (потрібен доступний Gateway).
  </Step>
  <Step title="Skills (рекомендовано)">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дозволяє вибрати менеджер Node: **npm / pnpm** (bun не рекомендовано).
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок + наступні кроки, включно із застосунками iOS/Android/macOS для додаткових функцій.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, онбординг виводить інструкції з переадресації порту SSH для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, онбординг намагається їх зібрати; запасний варіант — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Неінтерактивний режим

Використайте `--non-interactive`, щоб автоматизувати або скриптувати онбординг:

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

Додайте `--json` для машиночитаного підсумку.

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
`--json` **не** означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive` (і `--workspace`).
</Note>

Приклади команд для конкретних провайдерів наведено в [Автоматизація CLI](/uk/start/wizard-cli-automation#provider-specific-examples).
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

Gateway надає потік онбордингу через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клієнти (застосунок macOS, Control UI) можуть відображати кроки без повторної реалізації логіки онбордингу.

## Налаштування Signal (signal-cli)

Онбординг може встановити `signal-cli` з GitHub releases:

- Завантажує відповідний артефакт релізу.
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`.
- Записує `channels.signal.cliPath` у вашу конфігурацію.

Примітки:

- JVM-збірки потребують **Java 21**.
- Коли доступно, використовуються нативні збірки.
- Windows використовує WSL2; встановлення signal-cli виконується за Linux-потоком всередині WSL.

## Що записує майстер

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (для локального онбордингу за замовчуванням використовується `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (режим, bind, автентифікація, tailscale)
- `session.dmScope` (деталі поведінки: [Довідник із налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist каналів (Slack/Discord/Matrix/Microsoft Teams), якщо ви погоджуєтесь під час підказок (імена за можливості розв’язуються в ID).
- `skills.install.nodeManager`
  - `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Для ручної конфігурації все ще можна використовувати `yarn`, встановивши `skills.install.nodeManager` безпосередньо.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

Деякі канали постачаються як plugins. Коли ви вибираєте один із них під час налаштування, онбординг
запропонує встановити його (через npm або локальний шлях), перш ніж його можна буде налаштувати.

## Пов’язані документи

- Огляд онбордингу: [Онбординг (CLI)](/uk/start/wizard)
- Онбординг у застосунку macOS: [Онбординг](/uk/start/onboarding)
- Довідник із конфігурації: [Конфігурація Gateway](/uk/gateway/configuration)
- Провайдери: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord), [Google Chat](/uk/channels/googlechat), [Signal](/uk/channels/signal), [BlueBubbles](/uk/channels/bluebubbles) (iMessage), [iMessage](/uk/channels/imessage) (застарілий)
- Skills: [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config)
