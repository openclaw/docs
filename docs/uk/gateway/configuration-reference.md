---
read_when:
    - Потрібна точна семантика конфігурації на рівні полів або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на спеціалізовані довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-05-02T15:47:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559a52c9ea7428aa0a33b9699eaf144aa114638acf57f813217642319ce77987
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Основна довідка з конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Конфігурації](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і посилається на окремі сторінки, коли підсистема має власну глибшу довідку. Каталоги команд, що належать каналам і плагінам, а також глибокі налаштування пам’яті/QMD розміщені на власних сторінках, а не на цій.

Істина в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими bundled/plugin/channel, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми в межах шляху для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації щодо поточної поверхні схеми

Шлях пошуку агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації та обмежень на рівні полів перед редагуванням. Використовуйте
[Конфігурацію](/uk/gateway/configuration) для орієнтованих на завдання порад, а цю сторінку —
для ширшої карти полів, значень за замовчуванням і посилань на довідки підсистем.

Окремі глибокі довідки:

- [Довідка з конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash-команди](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідних каналів/плагінів для специфічних для каналів поверхонь команд

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, коли їх пропущено.

---

## Канали

Ключі конфігурації для кожного каналу перенесено на окрему сторінку — див.
[Конфігурація — канали](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, gating згадок).

## Значення агента за замовчуванням, багатоагентність, сесії та повідомлення

Перенесено на окрему сторінку — див.
[Конфігурація — агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робоча область, модель, мислення, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (багатоагентна маршрутизація та прив’язки)
- `session.*` (життєвий цикл сесії, compaction, обрізання)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: коли не задано, Talk зберігає типове для платформи вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)

## Інструменти та користувацькі провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів на базі провайдерів і налаштування користувацького
провайдера / base-URL перенесені на окрему сторінку — див.
[Конфігурація — інструменти та користувацькі провайдери](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, allowlist моделей і налаштування користувацьких провайдерів розміщені в
[Конфігурація — інструменти та користувацькі провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls).
Корінь `models` також відповідає за глобальну поведінку каталогу моделей.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: поведінка каталогу провайдера (`merge` або `replace`).
- `models.providers`: мапа користувацьких провайдерів із ключем за ідентифікатором провайдера.
- `models.pricing.enabled`: керує фоновим завантаженням цін, яке
  запускається після того, як sidecars і канали досягають ready-шляху Gateway. Коли `false`,
  Gateway пропускає отримання каталогів цін OpenRouter і LiteLLM; налаштовані
  значення `models.providers.*.models[].cost` усе ще працюють для локальних оцінок вартості.

## MCP

Визначення MCP-серверів, керованих OpenClaw, розміщені в `mcp.servers` і
використовуються вбудованим Pi та іншими runtime-адаптерами. Команди `openclaw mcp list`,
`show`, `set` і `unset` керують цим блоком без підключення до
цільового сервера під час редагування конфігурації.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: іменовані визначення stdio або віддалених MCP-серверів для runtime, які
  надають налаштовані MCP-інструменти.
  Віддалені записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` — це CLI-native alias, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.sessionIdleTtlMs`: idle TTL для session-scoped bundled MCP runtime.
  Одноразові вбудовані запуски запитують очищення після завершення виконання; цей TTL є резервним механізмом для
  довготривалих сесій і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються гаряче через dispose кешованих session MCP runtime.
  Наступне виявлення/використання інструментів повторно створює їх із нової конфігурації, тож видалені
  записи `mcp.servers` прибираються негайно, а не чекають idle TTL.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI-бекенди](/uk/gateway/cli-backends#bundle-mcp-overlays) щодо runtime-поведінки.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: необов’язковий allowlist лише для bundled skills (managed/workspace skills не зачіпає).
- `load.extraDirs`: додаткові спільні корені skill (найнижчий пріоритет).
- `install.preferBrew`: коли true, надає перевагу інсталяторам Homebrew, коли `brew`
  доступний, перед fallback до інших типів інсталяторів.
- `install.nodeManager`: пріоритет інсталятора node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручність для skills, що оголошують основну env var (plaintext string або об’єкт SecretRef).

---

## Плагіни

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Завантажуються з `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, а також `plugins.load.paths`.
- Discovery приймає нативні плагіни OpenClaw, а також сумісні bundles Codex і bundles Claude, зокрема manifestless bundles Claude default-layout.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий allowlist (завантажуються лише перелічені плагіни). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа рівня плагіна (коли підтримується плагіном).
- `plugins.entries.<id>.env`: plugin-scoped мапа env var.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` та ігнорує поля, що змінюють prompt, зі legacy `before_agent_start`, зберігаючи legacy `modelOverride` і `providerOverride`. Застосовується до нативних plugin hooks і підтримуваних каталогів hooks, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені non-bundled плагіни можуть читати сирий вміст розмови з typed hooks, таких як `llm_input`, `llm_output`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряє цьому плагіну запитувати per-run перевизначення `provider` і `model` для фонових запусків subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: визначений плагіном об’єкт конфігурації (валідується нативною схемою OpenClaw plugin, коли доступна).
- Налаштування облікових записів/runtime channel plugin розміщені в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфесту відповідного плагіна, а не центральним реєстром опцій OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера web-fetch Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Виконує fallback до `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` або env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: базова URL-адреса API Firecrawl (за замовчуванням: `https://api.firecrawl.dev`; self-hosted перевизначення мають вказувати на приватні/внутрішні endpoints).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (за замовчуванням: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (за замовчуванням: `172800000` / 2 дні).
  - `timeoutSeconds`: таймаут scrape-запиту в секундах (за замовчуванням: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (пошук у вебі Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok, яку слід використовувати для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (за замовчуванням `false`).
  - `frequency`: cron cadence для кожного повного sweep dreaming (`"0 3 * * *"` за замовчуванням).
  - `model`: необов’язкове перевизначення моделі subagent Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз із моделлю сесії за замовчуванням; помилки довіри або allowlist не виконують silent fallback.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті розміщена в [Довідці з конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені плагіни bundle Claude також можуть додавати embedded Pi defaults із `settings.json`; OpenClaw застосовує їх як sanitized agent settings, а не як сирі patches конфігурації OpenClaw.
- `plugins.slots.memory`: вибирає ідентифікатор активного плагіна пам’яті або `"none"`, щоб вимкнути плагіни пам’яті.
- `plugins.slots.contextEngine`: вибирає ідентифікатор активного плагіна context engine; за замовчуванням `"legacy"`, якщо ви не встановите й не виберете інший engine.

Див. [Плагіни](/uk/tools/plugin).

---

## Браузер

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` вимикає `act:evaluate` і `wait --fn`.
- `tabCleanup` звільняє відстежувані вкладки основного агента після часу простою або коли
  сеанс перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо значення не задано, тож навігація браузера за замовчуванням залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте навігації браузера в приватній мережі.
- У суворому режимі кінцеві точки віддалених профілів CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і надалі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі доступні лише для підключення (запуск/зупинка/скидання вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш постачальник надає прямий URL DevTools WebSocket.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до віддаленої та
  `attachOnly` CDP-доступності, а також запитів відкриття вкладок. Керовані профілі loopback
  зберігають локальні типові значення CDP.
- Якщо зовнішньо керована служба CDP доступна через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw трактує порт loopback як
  локальний керований профіль браузера і може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися на
  вибраному хості або через підключений браузерний вузол.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання CSS-селекторами, хуки завантаження
  одного файлу, без перевизначень тайм-ауту діалогів, без `wait --load networkidle` і без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; задавайте
  `cdpUrl` явно лише для віддаленого CDP.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу і `browser.localCdpReadyTimeoutMs` для
  готовності CDP websocket після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  успішно запускається, але перевірки готовності випереджають старт. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: типовий браузер, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для окремого профілю в профілях `existing-session` також розгортається з тильди.
- Служба керування: лише loopback (порт виводиться з `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад
  `--disable-gpu`, розмір вікна або прапорці налагодження).

---

## Інтерфейс користувача

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: акцентний колір для хрому інтерфейсу нативного застосунку (відтінок бульбашки режиму розмови тощо).
- `assistant`: перевизначення ідентичності інтерфейсу керування. Повертається до ідентичності активного агента.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Відомості про поля Gateway">

- `mode`: `local` (запустити Gateway) або `remote` (підключитися до віддаленого Gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: один мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (за замовчуванням), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми прив’язки**: використовуйте значення режиму прив’язки в `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: стандартна прив’язка `loopback` слухає на `127.0.0.1` всередині контейнера. З мережевим мостом Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому Gateway недоступний. Використовуйте `--network host` або задайте `bind: "lan"` (чи `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: потрібна за замовчуванням. Прив’язки не до loopback вимагають автентифікації Gateway. На практиці це означає спільний токен/пароль або reverse proxy з підтримкою ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер onboarding за замовчуванням генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRefs), явно задайте `gateway.auth.mode` як `token` або `password`. Запуск і потоки встановлення/repair сервісу завершуються помилкою, коли налаштовано обидва параметри, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; це навмисно не пропонується в підказках onboarding.
- `gateway.auth.mode: "trusted-proxy"`: делегує автентифікацію браузера/користувача reverse proxy з підтримкою ідентичності та довіряє заголовкам ідентичності від `gateway.trustedProxies` (див. [Автентифікація через довірений proxy](/uk/gateway/trusted-proxy-auth)). Цей режим за замовчуванням очікує джерело proxy **не з loopback**; reverse proxy same-host loopback потребують явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні викликачі same-host можуть використовувати `gateway.auth.password` як локальний прямий fallback; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевірено через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію через заголовок Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації Gateway. Цей потік без токена припускає, що хост Gateway є довіреним. За замовчуванням `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалої автентифікації. Застосовується для кожної IP-адреси клієнта та кожної області автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні невдалі спроби від того самого клієнта можуть спрацювати обмежувачем уже на другому запиті, замість того щоб обидві пройшли як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` за замовчуванням `true`; задайте `false`, коли ви навмисно хочете обмежувати швидкість трафіку localhost також (для тестових налаштувань або строгих розгортань proxy).
- Спроби WS-автентифікації з браузерного origin завжди обмежуються з вимкненим винятком loopback (defense-in-depth проти браузерного brute force на localhost).
- На loopback ці блокування за браузерним origin ізольовані за нормалізованим значенням `Origin`, тому повторні помилки з одного origin localhost не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, прив’язка loopback) або `funnel` (публічний, потребує автентифікації).
- `controlUi.allowedOrigins`: явний allowlist браузерних origin для WebSocket-підключень Gateway. Потрібен, коли браузерні клієнти очікуються з origin не з loopback.
- `controlUi.chatMessageMaxWidth`: необов’язкова max-width для згрупованих чат-повідомлень Control UI. Приймає обмежені значення ширини CSS, як-от `960px`, `82%`, `min(1280px, 82%)` і `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає fallback origin за заголовком Host для розгортань, що навмисно покладаються на політику origin за заголовком Host.
- `remote.transport`: `ssh` (за замовчуванням) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійний override на рівні process-environment клієнта, який дозволяє plaintext `ws://` до довірених IP приватної мережі; за замовчуванням plaintext лишається дозволеним тільки для loopback. Еквівалента в `openclaw.json` немає, а конфігурація приватної мережі браузера, як-от `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на WebSocket-клієнтів Gateway.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Самі по собі вони не налаштовують автентифікацію Gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS URL-адреса зовнішнього ретранслятора APNs, яку використовують офіційні/TestFlight збірки iOS після публікації реєстрацій із підтримкою ретранслятора до Gateway. Ця URL-адреса має збігатися з URL ретранслятора, скомпільованою в iOS-збірку.
- `gateway.push.apns.relay.timeoutMs`: timeout надсилання від Gateway до ретранслятора в мілісекундах. За замовчуванням `10000`.
- Реєстрації з підтримкою ретранслятора делегуються конкретній ідентичності Gateway. Спарений iOS-застосунок отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію ретранслятора та пересилає Gateway grant на надсилання, обмежений реєстрацією. Інший Gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env override для конфігурації ретранслятора вище.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch лише для розробки для URL-адрес HTTP-ретранслятора loopback. URL-адреси production-ретранслятора мають лишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: timeout pre-auth WebSocket handshake Gateway у мілісекундах. За замовчуванням: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли задано. Збільшуйте це значення на завантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки стартовий warmup ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал монітора здоров’я каналів у хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски health-monitor. За замовчуванням: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. За замовчуванням: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на канал/обліковий запис у ковзній годині. За замовчуванням: `10`.
- `channels.<provider>.healthMonitor.enabled`: вимкнення перезапусків health-monitor для окремого каналу, зберігаючи глобальний монітор увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override для окремого облікового запису в багатооблікових каналах. Коли задано, має пріоритет над override рівня каналу.
- Локальні шляхи виклику Gateway можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання fail-closed (без маскування через віддалений fallback).
- `trustedProxies`: IP-адреси reverse proxy, які завершують TLS або вставляють заголовки forwarded-client. Вказуйте лише proxy, які контролюєте. Записи loopback все ще дійсні для налаштувань proxy/local-detection на тому самому хості (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять запити loopback придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, Gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. За замовчуванням `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий CIDR/IP allowlist для автоматичного схвалення першого спарювання node device без запитаних scopes. Вимкнено, коли не задано. Це не схвалює автоматично спарювання operator/browser/Control UI/WebChat і не схвалює автоматично оновлення role, scope, metadata або public-key.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд node після спарювання та оцінки platform allowlist. Використовуйте `allowCommands`, щоб явно ввімкнути небезпечні команди node, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо platform default або явний allow інакше включав би її. Після того як node змінить оголошений список команд, відхиліть і повторно схваліть це спарювання пристрою, щоб Gateway зберіг оновлений snapshot команд.
- `gateway.tools.deny`: додаткові назви tool, заблоковані для HTTP `POST /tools/invoke` (розширює стандартний deny list).
- `gateway.tools.allow`: вилучає назви tool зі стандартного HTTP deny list.

</Accordion>

### Сумісні з OpenAI кінцеві точки

- Chat Completions: вимкнено за замовчуванням. Увімкніть за допомогою `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-входів Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlists вважаються незаданими; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення захисту response:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS origin, які ви контролюєте; див. [Автентифікація через довірений proxy](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька Gateway на одному хості з унікальними портами та state dirs:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Зручні прапорці: `--dev` (використовує `~/.openclaw-dev` + порт `19001`), `--profile <name>` (використовує `~/.openclaw-<name>`).

Див. [Кілька Gateway](/uk/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: вмикає завершення TLS на listener Gateway (HTTPS/WSS) (за замовчуванням: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, коли явні файли не налаштовано; лише для локального/dev використання.
- `certPath`: шлях у файловій системі до файлу сертифіката TLS.
- `keyPath`: шлях у файловій системі до файлу приватного ключа TLS; тримайте доступ обмеженим.
- `caPath`: необов’язковий шлях до CA bundle для перевірки клієнта або custom trust chains.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: керує тим, як зміни конфігурації застосовуються під час runtime.
  - `"off"`: ігнорувати live edits; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес Gateway після зміни конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (за замовчуванням): спочатку спробувати hot reload; за потреби fallback до перезапуску.
- `debounceMs`: debounce-вікно в мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс для очікування in-flight операцій перед примусовим перезапуском. Опустіть, щоб використати стандартне обмежене очікування (`300000`); задайте `0`, щоб чекати безстроково та логувати періодичні попередження still-pending.

---

## Хуки

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Автентифікація: `Authorization: Bearer <token>` або `x-openclaw-token: <token>`.
Токени хуків у рядку запиту відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` вимагає непорожнього `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо зіставлення або пресет використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі зіставлення не потребують цього явного ввімкнення.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з корисного навантаження запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв'язується через `hooks.mappings`
  - Значення `sessionKey` зіставлення, відрендерені з шаблону, вважаються наданими ззовні й також вимагають `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` зіставляє підшлях після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле корисного навантаження для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з корисного навантаження.
- `transform` може вказувати на JS/TS-модуль, що повертає дію хука.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи й обхід каталогів відхиляються).
  - Тримайте `hooks.transformsDir` у межах `~/.openclaw/hooks/transforms`; каталоги Skills у робочому просторі відхиляються. Якщо `openclaw doctor` повідомляє, що цей шлях недійсний, перемістіть модуль transform до каталогу перетворень hooks або вилучіть `hooks.transformsDir`.
- `agentId` спрямовує до конкретного агента; невідомі ідентифікатори повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов'язковий фіксований ключ сесії для запусків агента хуків без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і керованим шаблонами ключам сесій зіставлення задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов'язковий список дозволених префіксів для явних значень `sessionKey` (запит + зіставлення), наприклад `["hook:"]`. Він стає обов'язковим, коли будь-яке зіставлення або пресет використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь до каналу; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску хука (має бути дозволено, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований пресет Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб він відповідав простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібно `hooks.allowRequestSessionKey: false`, перевизначте пресет статичним `sessionKey` замість шаблонного типового значення.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, якщо це налаштовано. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
- Не запускайте окремий `gog gmail watch serve` поруч із Gateway.

---

## Хост Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Надає agent-editable HTML/CSS/JS і A2UI через HTTP під портом Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Прив'язки не до loopback: маршрути canvas вимагають автентифікації Gateway (токен/пароль/довірений проксі), так само як інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки автентифікації; після сполучення й підключення Node Gateway оголошує URL-адреси можливостей у межах Node для доступу до canvas/A2UI.
- URL-адреси можливостей прив'язані до активної WS-сесії Node і швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт live-reload у HTML, що обслуговується.
- Автоматично створює початковий `index.html`, коли каталог порожній.
- Також надає A2UI за `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску Gateway.
- Вимкніть live reload для великих каталогів або помилок `EMFILE`.

---

## Виявлення

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (типово): пропускати `cliPath` + `sshPort` із TXT-записів.
- `full`: включати `cliPath` + `sshPort`.
- Ім'я хоста типово дорівнює системному імені хоста, коли воно є дійсною DNS-міткою; інакше використовується `openclaw`. Перевизначте через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує unicast DNS-SD-зону в `~/.openclaw/dns/`. Для виявлення між мережами поєднайте із DNS-сервером (рекомендовано CoreDNS) + Tailscale split DNS.

Налаштування: `openclaw dns setup --apply`.

---

## Середовище

### `env` (вбудовані змінні середовища)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Вбудовані змінні середовища застосовуються лише якщо в середовищі процесу бракує ключа.
- Файли `.env`: CWD `.env` + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Див. [Середовище](/uk/help/environment) для повного порядку пріоритетів.

### Підстановка змінних середовища

Посилайтеся на змінні середовища в будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Зіставляються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте через `$${VAR}` для літерального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є додатковими: відкриті текстові значення все ще працюють.

### `SecretRef`

Використовуйте одну форму об'єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- Шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- Шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- ids для `source: "exec"` не мають містити розділених скісними рисками сегментів шляху `.` або `..` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включені до runtime-розв'язання й покриття аудиту.

### Конфігурація провайдерів секретів

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Примітки:

- Провайдер `file` підтримує `mode: "json"` і `mode: "singleValue"` (`id` має бути `"value"` у режимі singleValue).
- Шляхи провайдерів file і exec завершуються закрито, коли перевірка Windows ACL недоступна. Задавайте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` вимагає абсолютний шлях `command` і використовує протокольні корисні навантаження у stdin/stdout.
- Типово шляхи команд-симлінків відхиляються. Задайте `allowSymlinkCommand: true`, щоб дозволити шляхи-симлінки з валідацією розв'язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довіреного каталогу застосовується до розв'язаного цільового шляху.
- Дочірнє середовище `exec` типово мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв'язуються під час активації в знімок у пам'яті, після чого шляхи запитів читають лише цей знімок.
- Фільтрація активної поверхні застосовується під час активації: нерозв'язані посилання на ввімкнених поверхнях спричиняють збій запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

---

## Сховище автентифікації

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Профілі на рівні агента зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Застарілі плоскі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є runtime-форматом; `openclaw doctor --fix` переписує їх у канонічні профілі API-ключів `provider:default` із резервною копією `.legacy-flat.*.bak`.
- Профілі OAuth-режиму (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні runtime-облікові дані надходять зі знімків, розв'язаних у пам'яті; застарілі статичні записи `auth.json` очищаються під час виявлення.
- Застарілі імпорти OAuth з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Runtime-поведінка секретів та інструменти `audit/configure/apply`: [Керування секретами](/uk/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: базова затримка повтору в годинах, коли профіль зазнає збою через справжні помилки білінгу/недостатнього кредиту (за замовчуванням: `5`). Явний текст про білінг усе ще може потрапити сюди навіть у відповідях `401`/`403`, але специфічні для провайдера текстові зіставники залишаються обмеженими провайдером, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Повторювані повідомлення HTTP `402` про вікно використання або ліміт витрат організації/робочого простору натомість залишаються у шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин затримки білінгу для окремих провайдерів.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання затримки білінгу (за замовчуванням: `24`).
- `authPermanentBackoffMinutes`: базова затримка повтору в хвилинах для високодостовірних збоїв `auth_permanent` (за замовчуванням: `10`).
- `authPermanentMaxMinutes`: обмеження в хвилинах для зростання затримки `auth_permanent` (за замовчуванням: `60`).
- `failureWindowHours`: рухоме вікно в годинах, що використовується для лічильників затримки (за замовчуванням: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій профілів автентифікації того самого провайдера для помилок перевантаження перед переходом до резервної моделі (за замовчуванням: `1`). Сюди потрапляють форми зайнятості провайдера, як-от `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (за замовчуванням: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій профілів автентифікації того самого провайдера для помилок обмеження швидкості перед переходом до резервної моделі (за замовчуванням: `1`). Цей кошик обмеження швидкості охоплює тексти у форматі провайдера, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

---

## Журналювання

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Типовий файл журналу: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Задайте `logging.file` для стабільного шляху.
- `consoleLevel` підвищується до `debug`, коли використано `--verbose`.
- `maxFileBytes`: максимальний розмір активного файла журналу в байтах перед ротацією (додатне ціле число; за замовчуванням: `104857600` = 100 МБ). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: евристичне маскування для виводу консолі, файлових журналів, записів журналу OTLP і збереженого тексту стенограми сеансу. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/стенограм; поверхні безпеки UI/інструментів/діагностики все одно редагують секрети перед випуском.

---

## Діагностика

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: головний перемикач для виводу інструментації (за замовчуванням: `true`).
- `flags`: масив рядків прапорів, які вмикають цільовий журнальний вивід (підтримує шаблони на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку без прогресу в мс для класифікації тривалих сеансів обробки як `session.long_running`, `session.stalled` або `session.stuck`. Відповідь, інструмент, статус, блок і прогрес ACP скидають таймер; повторювані діагностичні події `session.stuck` відступають, доки стан не змінюється.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (за замовчуванням: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. у [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові специфічні для сигналу кінцеві точки OTLP. Коли задано, вони перевизначають `otel.endpoint` лише для цього сигналу.
- `otel.protocol`: `"http/protobuf"` (за замовчуванням) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються з запитами експорту OTel.
- `otel.serviceName`: ім’я сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт трас, метрик або журналів.
- `otel.sampleRate`: частота вибірки трас `0`–`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання телеметрії в мс.
- `otel.captureContent`: явне ввімкнення захоплення необробленого вмісту для атрибутів проміжків OTEL. За замовчуванням вимкнено. Булеве `true` захоплює несистемний вміст повідомлень/інструментів; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: змінна середовища для найновіших експериментальних атрибутів провайдера проміжків GenAI. За замовчуванням проміжки зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: змінна середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. OpenClaw тоді пропускає запуск/завершення SDK, що належить Plugin, водночас залишаючи діагностичні слухачі активними.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: специфічні для сигналу змінні середовища кінцевих точок, які використовуються, коли відповідний ключ конфігурації не задано.
- `cacheTrace.enabled`: журналювати знімки трасування кешу для вбудованих запусків (за замовчуванням: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL трасування кешу (за замовчуванням: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід трасування кешу (усі за замовчуванням: `true`).

---

## Оновлення

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: канал випусків для встановлень npm/git — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (за замовчуванням: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для встановлень пакетів (за замовчуванням: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням у стабільному каналі (за замовчуванням: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання стабільного каналу в годинах (за замовчуванням: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки бета-каналу, в годинах (за замовчуванням: `1`; максимум: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: глобальний шлюз функції ACP (за замовчуванням: `true`; установіть `false`, щоб приховати диспетчеризацію ACP і можливості запуску).
- `dispatch.enabled`: незалежний шлюз для диспетчеризації ходу сеансу ACP (за замовчуванням: `true`). Установіть `false`, щоб команди ACP залишалися доступними, але виконання блокувалося.
- `backend`: типовий ідентифікатор бекенда середовища виконання ACP (має відповідати зареєстрованому Plugin середовища виконання ACP).
  Спочатку встановіть бекенд-Plugin, і якщо задано `plugins.allow`, включіть ідентифікатор бекенд-Plugin (наприклад, `acpx`), інакше бекенд ACP не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли запуски не задають явної цілі.
- `allowedAgents`: список дозволених ідентифікаторів агентів для сеансів середовища виконання ACP; порожній означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сеансів ACP.
- `stream.coalesceIdleMs`: вікно скидання під час простою в мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед розділенням проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів у межах ходу (за замовчуванням: `true`).
- `stream.deliveryMode`: `"live"` передає потік поступово; `"final_only"` буферизує до завершальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (за замовчуванням: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, проєктована на хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис імен тегів у булеві перевизначення видимості для потокових подій.
- `runtime.ttlMinutes`: TTL простою в хвилинах для працівників сеансів ACP перед тим, як вони стануть придатними для очищення.
- `runtime.installCommand`: необов’язкова команда встановлення, яку треба виконати під час початкового налаштування середовища виконання ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` керує стилем слогана банера:
  - `"random"` (за замовчуванням): змінні жартівливі/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (назва/версія банера все одно показуються).
- Щоб приховати весь банер (не лише слогани), задайте змінну середовища `OPENCLAW_HIDE_BANNER=1`.

---

## Майстер

Метадані, записані керованими потоками налаштування CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Ідентичність

Див. поля ідентичності `agents.list` у розділі [типові параметри агента](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застарілий, вилучено)

Поточні збірки більше не містять TCP-міст. Вузли підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною схеми конфігурації (перевірка завершується помилкою, доки їх не вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

<Accordion title="Застаріла конфігурація моста (історична довідка)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: як довго зберігати завершені ізольовані сеанси запусків cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених стенограм cron. За замовчуванням: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файла журналу для одного запуску (`cron/runs/<jobId>.jsonl`) перед очищенням. За замовчуванням: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки, що зберігаються, коли спрацьовує очищення журналу запуску. За замовчуванням: `2000`.
- `webhookToken`: токен bearer, що використовується для доставки POST Cron Webhook (`delivery.mode = "webhook"`); якщо пропущено, заголовок автентифікації не надсилається.
- `webhook`: застарілий резервний URL Webhook (http/https), що використовується лише для збережених завдань, які все ще мають `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: максимальна кількість повторних спроб для одноразових завдань у разі тимчасових помилок (типово: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок відступу в мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, які запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Не вказуйте, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових cron-завдань. Повторювані завдання використовують окрему обробку збоїв.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: увімкнути сповіщення про збої для cron-завдань (типово: `false`).
- `after`: кількість послідовних збоїв перед надсиланням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `includeSkipped`: зараховувати послідовно пропущені запуски до порогу сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на відступ для помилок виконання.
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує в налаштований Webhook.
- `accountId`: необов’язковий ідентифікатор облікового запису або каналу для обмеження області доставки сповіщень.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Типове призначення для сповіщень про збої cron у всіх завданнях.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних цілі.
- `channel`: перевизначення каналу для доставки через announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL Webhook. Обов’язково для режиму Webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` на рівні завдання перевизначає це глобальне типове значення.
- Коли ні глобальне, ні індивідуальне призначення збою для завдання не задано, завдання, які вже доставляються через `announce`, у разі збою повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не є `"webhook"`.

Див. [Cron-завдання](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Заповнювачі шаблону, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повний текст вхідного повідомлення                |
| `{{RawBody}}`      | Необроблений текст (без обгорток історії/відправника) |
| `{{BodyStripped}}` | Текст із вилученими згадками групи                |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                 |
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (image/audio/document/…)                |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Розв’язаний медіа-промпт для записів CLI          |
| `{{MaxChars}}`     | Розв’язана максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (за можливості)                        |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (за можливості) |
| `{{SenderName}}`   | Відображуване ім’я відправника (за можливості)    |
| `{{SenderE164}}`   | Номер телефону відправника (за можливості)        |
| `{{Provider}}`     | Підказка провайдера (whatsapp, telegram, discord тощо) |

---

## Включення конфігурації (`$include`)

Розділіть конфігурацію на кілька файлів:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Поведінка об’єднання:**

- Один файл: замінює об’єкт, що його містить.
- Масив файлів: глибоко об’єднується по порядку (пізніші перевизначають попередні).
- Сусідні ключі: об’єднуються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: розв’язуються відносно файлу, що виконує включення, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми та форми з `../` дозволені лише тоді, коли вони все одно розв’язуються всередині цієї межі.
- Записи, що належать OpenClaw і змінюють лише один розділ верхнього рівня, підтриманий включенням одного файлу, записуються в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, що належать OpenClaw; такі записи завершуються закритою помилкою замість вирівнювання конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних включень.

---

_Пов’язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
