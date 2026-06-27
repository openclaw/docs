---
read_when:
    - Пошук конкретного кроку онбордингу або прапорця
    - Автоматизація онбордингу в неінтерактивному режимі
    - Налагодження поведінки онбордингу
sidebarTitle: Onboarding Reference
summary: 'Повний довідник з онбордингу CLI: кожен крок, прапорець і поле конфігурації'
title: Довідник з онбордингу
x-i18n:
    generated_at: "2026-06-27T18:20:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

Це повний довідник для `openclaw onboard`.
Загальний огляд див. у [Онбординг (CLI)](/uk/start/wizard).

## Докладний перебіг (локальний режим)

<Steps>
  <Step title="Existing config detection">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть **Зберегти поточні значення**, **Переглянути й оновити** або **Скинути перед налаштуванням**.
    - Повторний запуск онбордингу **не** стирає нічого, якщо ви явно не виберете **Скинути**
      (або не передасте `--reset`).
    - CLI `--reset` за замовчуванням використовує `config+creds+sessions`; використайте `--reset-scope full`,
      щоб також видалити робочий простір.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється й просить
      запустити `openclaw doctor`, перш ніж продовжити.
    - Скидання використовує `trash` (ніколи `rm`) і пропонує області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сеанси
      - Повне скидання (також видаляє робочий простір)

  </Step>
  <Step title="Model/Auth">
    - **Ключ Anthropic API**: використовує `ANTHROPIC_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його для використання демоном.
    - **Ключ Anthropic API**: бажаний вибір асистента Anthropic в онбордингу/налаштуванні.
    - **Anthropic setup-token**: досі доступний в онбордингу/налаштуванні, хоча OpenClaw тепер надає перевагу повторному використанню Claude CLI, коли це доступно.
    - **Підписка OpenAI Code (Codex) (OAuth)**: браузерний потік; вставте `code#state`.
      - Встановлює `agents.defaults.model` на `openai/gpt-5.5` через середовище виконання Codex, коли модель не задана або вже належить до сімейства OpenAI.
    - **Підписка OpenAI Code (Codex) (сполучення пристрою)**: браузерний потік сполучення з короткочасним кодом пристрою.
      - Встановлює `agents.defaults.model` на `openai/gpt-5.5` через середовище виконання Codex, коли модель не задана або вже належить до сімейства OpenAI.
    - **Ключ OpenAI API**: використовує `OPENAI_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його в профілях автентифікації.
      - Встановлює `agents.defaults.model` на `openai/gpt-5.5`, коли модель не задана, `openai/*` або застарілі посилання на моделі Codex.
    - **xAI (Grok) OAuth / ключ API**: входить через xAI OAuth, якщо вибрано, або запитує `XAI_API_KEY` у сценарії з ключем API та налаштовує xAI як постачальника моделей.
    - **OpenCode**: запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`, отримайте його на https://opencode.ai/auth) і дає змогу вибрати каталог Zen або Go.
    - **Ollama**: спочатку пропонує **Хмара + локально**, **Лише хмара** або **Лише локально**. `Cloud only` запитує `OLLAMA_API_KEY` і використовує `https://ollama.com`; режими з хостом запитують базову URL-адресу Ollama, виявляють доступні моделі й автоматично завантажують вибрану локальну модель за потреби; `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для хмарного доступу.
    - Докладніше: [Ollama](/uk/providers/ollama)
    - **Ключ API**: зберігає ключ для вас.
    - **Vercel AI Gateway (багатомодельний проксі)**: запитує `AI_GATEWAY_API_KEY`.
    - Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: запитує Account ID, Gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
    - **MiniMax**: конфігурація записується автоматично; розміщене значення за замовчуванням — `MiniMax-M3`.
      Налаштування з ключем API використовує `minimax/...`, а налаштування OAuth використовує
      `minimax-portal/...`.
    - Докладніше: [MiniMax](/uk/providers/minimax)
    - **StepFun**: конфігурація автоматично записується для StepFun standard або Step Plan на китайських чи глобальних кінцевих точках.
    - Standard наразі містить `step-3.5-flash`, а Step Plan також містить `step-3.5-flash-2603`.
    - Докладніше: [StepFun](/uk/providers/stepfun)
    - **Synthetic (сумісний з Anthropic)**: запитує `SYNTHETIC_API_KEY`.
    - Докладніше: [Synthetic](/uk/providers/synthetic)
    - **Moonshot (Kimi K2)**: конфігурація записується автоматично.
    - **Kimi Coding**: конфігурація записується автоматично.
    - Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
    - **Пропустити**: автентифікацію ще не налаштовано.
    - Виберіть модель за замовчуванням із виявлених варіантів (або введіть постачальника/модель вручну). Для найкращої якості й нижчого ризику prompt-injection виберіть найпотужнішу модель останнього покоління, доступну у вашому стеку постачальників.
    - Онбординг запускає перевірку моделі й попереджає, якщо налаштована модель невідома або для неї бракує автентифікації.
    - Режим зберігання ключів API за замовчуванням використовує відкриті значення профілю автентифікації. Використайте `--secret-input-mode ref`, щоб натомість зберігати посилання на основі змінних середовища (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Профілі автентифікації розміщені в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (ключі API + OAuth). `~/.openclaw/credentials/oauth.json` є лише застарілим джерелом імпорту.
    - Докладніше: [/concepts/oauth](/uk/concepts/oauth)
    <Note>
    Порада для headless/серверів: завершіть OAuth на машині з браузером, а потім скопіюйте
    `auth-profiles.json` цього агента (наприклад
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний
    шлях `$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
    є лише застарілим джерелом імпорту.
    </Note>
  </Step>
  <Step title="Workspace">
    - За замовчуванням `~/.openclaw/workspace` (налаштовується).
    - Заповнює робочий простір файлами, потрібними для ритуалу bootstrap агента.
    - Повна структура робочого простору + посібник із резервного копіювання: [Робочий простір агента](/uk/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Порт, прив’язка, режим автентифікації, експозиція Tailscale.
    - Рекомендація щодо автентифікації: залиште **Токен** навіть для local loopback, щоб локальні клієнти WS мусили автентифікуватися.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти відкритий токен** (за замовчуванням)
      - **Використати SecretRef** (за згодою)
      - Quickstart повторно використовує наявні SecretRef `gateway.auth.token` у постачальниках `env`, `file` і `exec` для онбордингової перевірки/dashboard bootstrap.
      - Якщо цей SecretRef налаштовано, але його неможливо розв’язати, онбординг завершується на ранньому етапі з чітким повідомленням про виправлення замість тихого погіршення автентифікації середовища виконання.
    - У режимі пароля інтерактивне налаштування також підтримує зберігання відкритого тексту або SecretRef.
    - Неінтерактивний шлях SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої змінної середовища в середовищі процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback усе одно потребують автентифікації.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR.
    - [Telegram](/uk/channels/telegram): токен бота.
    - [Discord](/uk/channels/discord): токен бота.
    - [Google Chat](/uk/channels/googlechat): JSON сервісного облікового запису + аудиторія Webhook.
    - [Mattermost](/uk/channels/mattermost) (plugin): токен бота + базова URL-адреса.
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису.
    - [iMessage](/uk/channels/imessage): шлях до CLI `imsg` + доступ до БД Messages; використовуйте SSH-обгортку, коли Gateway працює не на Mac.
    - Безпека DM: за замовчуванням використовується сполучення. Перший DM надсилає код; підтвердьте через `openclaw pairing approve <channel> <code>` або використайте списки дозволених.

  </Step>
  <Step title="Web search">
    - Виберіть підтримуваного постачальника, як-от Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG або Tavily (або пропустіть).
    - Постачальники на основі API можуть використовувати змінні середовища або наявну конфігурацію для швидкого налаштування; постачальники без ключів натомість використовують свої специфічні передумови.
    - Пропустіть за допомогою `--skip-search`.
    - Налаштувати пізніше: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - Потребує сеансу користувача з виконаним входом; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux (і Windows через WSL2): користувацький unit systemd
      - Онбординг намагається ввімкнути lingering через `loginctl enable-linger <user>`, щоб Gateway залишався запущеним після виходу.
      - Може запитати sudo (записує `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - **Вибір середовища виконання:** Node (рекомендовано; потрібно для WhatsApp/Telegram). Bun **не рекомендовано**.
    - Якщо автентифікація токеном потребує токена, а `gateway.auth.token` керується SecretRef, установлення демона перевіряє його, але не зберігає розв’язані відкриті значення токена в метаданих середовища служби супервізора.
    - Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не розв’язано, установлення демона блокується з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення демона блокується, доки режим не буде задано явно.

  </Step>
  <Step title="Health check">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - Порада: `openclaw status --deep` додає живу перевірку справності gateway до виводу стану, включно з перевірками каналів, коли вони підтримуються (потрібен доступний gateway).

  </Step>
  <Step title="Skills (recommended)">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер node: **npm / pnpm** (bun не рекомендовано).
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).

  </Step>
  <Step title="Finish">
    - Підсумок + наступні кроки, включно із запитом **Як ви хочете вилупити свого агента?** для Terminal, Browser або пізніше.

  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, онбординг виводить інструкції SSH port-forward для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, онбординг намагається зібрати їх; fallback — `pnpm ui:build` (автоматично встановлює залежності UI).
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

Додайте `--json` для машиночитного підсумку.

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

Gateway надає потік онбордингу через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клієнти (застосунок macOS, Control UI) можуть відтворювати кроки без повторної реалізації логіки онбордингу.

## Налаштування Signal (signal-cli)

Онбординг може встановити `signal-cli` з релізів GitHub:

- Завантажує відповідний ресурс релізу.
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`.
- Записує `channels.signal.cliPath` у вашу конфігурацію.

Примітки:

- Збірки JVM потребують **Java 21**.
- Нативні збірки використовуються, коли доступні.
- Windows використовує WSL2; установлення signal-cli виконується за потоком Linux усередині WSL.

## Що записує майстер

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний онбординг за замовчуванням використовує `"coding"`, якщо значення не задано; наявні явно задані значення зберігаються)
- `gateway.*` (режим, прив’язка, автентифікація, tailscale)
- `session.dmScope` (деталі поведінки: [Довідник із налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Списки дозволених каналів (Slack/Discord/Matrix/Microsoft Teams), коли ви погоджуєтеся під час підказок (імена за можливості перетворюються на ідентифікатори).
- `skills.install.nodeManager`
  - `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручна конфігурація все ще може використовувати `yarn`, якщо напряму задати `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp розміщуються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сеанси зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

Деякі канали постачаються як плагіни. Коли ви вибираєте один із них під час налаштування, онбординг
запропонує встановити його (через npm або з локального шляху), перш ніж його можна буде налаштувати.

## Пов’язані документи

- Огляд онбордингу: [Онбординг (CLI)](/uk/start/wizard)
- Онбординг застосунку macOS: [Онбординг](/uk/start/onboarding)
- Довідник із конфігурації: [Конфігурація Gateway](/uk/gateway/configuration)
- Провайдери: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord), [Google Chat](/uk/channels/googlechat), [Signal](/uk/channels/signal), [iMessage](/uk/channels/imessage)
- Skills: [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config)
