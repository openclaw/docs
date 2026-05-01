---
read_when:
    - Вам потрібні точна семантика конфігурації на рівні полів або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник з конфігурації Gateway для основних ключів OpenClaw, стандартних значень і посилань на спеціалізовані довідники підсистем
title: Довідник із налаштування
x-i18n:
    generated_at: "2026-05-01T23:18:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5e167fb8f9670e206a7b3794c8a2b1cf269fc7ad816c2feae00d1309edd1d54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Основний довідник конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Configuration](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і посилається на окремі довші довідники, коли підсистема має власну детальнішу документацію. Каталоги команд, що належать каналам і plugins, а також глибокі налаштування пам’яті/QMD розміщені на власних сторінках, а не на цій.

Істина в коді:

- `openclaw config schema` друкує актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими bundled/plugin/channel, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми, обмежений шляхом, для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації щодо поточної поверхні схеми

Шлях пошуку агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації та обмежень на рівні поля перед редагуванням. Використовуйте
[Configuration](/uk/gateway/configuration) для настанов, орієнтованих на завдання, а цю сторінку
для ширшої карти полів, стандартних значень і посилань на довідники підсистем.

Окремі глибокі довідники:

- [Довідник конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки каналів/plugins-власників для поверхонь команд, специфічних для каналів

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні стандартні значення, коли їх пропущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на окрему сторінку — див.
[Configuration — channels](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, шлюз згадок).

## Стандартні значення агента, кілька агентів, сеанси та повідомлення

Перенесено на окрему сторінку — див.
[Configuration — agents](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робоча область, модель, thinking, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (маршрутизація та прив’язки кількох агентів)
- `session.*` (життєвий цикл сеансу, compaction, обрізання)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: коли не задано, Talk зберігає стандартне вікно паузи платформи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)

## Інструменти та користувацькі провайдери

Політику інструментів, експериментальні перемикачі, конфігурацію інструментів на базі провайдерів і налаштування користувацьких
провайдерів / базових URL перенесено на окрему сторінку — див.
[Configuration — tools and custom providers](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, allowlists моделей і налаштування користувацьких провайдерів розміщені в
[Configuration — tools and custom providers](/uk/gateway/config-tools#custom-providers-and-base-urls).
Корінь `models` також відповідає за глобальну поведінку каталогу моделей.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: поведінка каталогу провайдерів (`merge` або `replace`).
- `models.providers`: мапа користувацьких провайдерів із ключами за id провайдера.
- `models.pricing.enabled`: керує фоновим завантаженням цін. Коли
  `false`, запуск Gateway пропускає отримання каталогів цін OpenRouter і LiteLLM;
  налаштовані значення `models.providers.*.models[].cost` і далі працюють для локальних
  оцінок вартості.

## MCP

Визначення MCP-серверів, керованих OpenClaw, розміщені в `mcp.servers` і
споживаються вбудованим Pi та іншими runtime-адаптерами. Команди `openclaw mcp list`,
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

- `mcp.servers`: іменовані stdio або віддалені визначення MCP-серверів для runtime, які
  надають налаштовані MCP-інструменти.
  Віддалені записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` — це CLI-native псевдонім, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.sessionIdleTtlMs`: idle TTL для session-scoped bundled MCP runtime.
  Одноразові вбудовані запуски запитують очищення після завершення запуску; цей TTL є запасним механізмом для
  довготривалих сеансів і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються гаряче через dispose кешованих session MCP runtime.
  Наступне виявлення/використання інструменту відтворює їх із нової конфігурації, тож видалені
  записи `mcp.servers` прибираються негайно, а не чекають idle TTL.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI backends](/uk/gateway/cli-backends#bundle-mcp-overlays) щодо runtime-поведінки.

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

- `allowBundled`: необов’язковий allowlist лише для bundled skills (керовані/робочі skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені skill (найнижчий пріоритет).
- `install.preferBrew`: коли true, надавати перевагу інсталяторам Homebrew, коли `brew` є
  доступним, перш ніж переходити до інших типів інсталяторів.
- `install.nodeManager`: перевага node-інсталятора для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручність для skills, що оголошують основну env var (plaintext string або об’єкт SecretRef).

---

## Plugins

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
- Discovery приймає нативні OpenClaw plugins, а також сумісні Codex bundles і Claude bundles, зокрема manifestless Claude default-layout bundles.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий allowlist (завантажуються лише перелічені plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні plugin (коли підтримується plugin).
- `plugins.entries.<id>.env`: мапа env var, обмежена plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` та ігнорує поля, що змінюють prompt, із legacy `before_agent_start`, зберігаючи legacy `modelOverride` і `providerOverride`. Застосовується до нативних plugin hooks і підтримуваних каталогів hooks, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені non-bundled plugins можуть читати raw conversation content із typed hooks, таких як `llm_input`, `llm_output`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довірити цьому plugin запитувати per-run перевизначення `provider` і `model` для фонових запусків subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений plugin (валідується нативною схемою OpenClaw plugin, коли вона доступна).
- Налаштування облікових записів/runtime для channel plugin розміщені в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфесту plugin-власника, а не центральним реєстром опцій OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера веб-отримання Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Використовує fallback до `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` або env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (стандартно: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (стандартно: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (стандартно: `172800000` / 2 дні).
  - `timeoutSeconds`: timeout запиту scrape у секундах (стандартно: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok для використання в пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (стандартно `false`).
  - `frequency`: cron cadence для кожного повного проходу dreaming (`"0 3 * * *"` стандартно).
  - `model`: необов’язкове перевизначення моделі subagent Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз зі стандартною моделлю сеансу; помилки довіри або allowlist не переходять на fallback мовчки.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті розміщена в [Довіднику конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Claude bundle plugins також можуть додавати вбудовані стандартні значення Pi з `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як raw patches конфігурації OpenClaw.
- `plugins.slots.memory`: виберіть id активного memory plugin або `"none"`, щоб вимкнути memory plugins.
- `plugins.slots.contextEngine`: виберіть id активного context engine plugin; стандартно `"legacy"`, якщо ви не встановите й не виберете інший engine.

Див. [Plugins](/uk/tools/plugin).

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
  сесія перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тому навігація браузера за замовчуванням залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте навігації браузера приватною мережею.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок досяжності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі приєднання (запуск/зупинка/скидання вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL DevTools WebSocket.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до досяжності віддаленого та
  `attachOnly` CDP, а також до запитів відкриття вкладок. Керовані профілі loopback
  зберігають локальні типові значення CDP.
- Якщо зовнішньо керований сервіс CDP доступний через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw трактує порт loopback як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть приєднуватися на
  вибраному хості або через підключений вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на базі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання CSS-селекторами, хуки завантаження
  одного файлу, без перевизначень тайм-аутів діалогів, без `wait --load networkidle` і без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; задавайте
  `cdpUrl` явно лише для віддаленого CDP.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності websocket CDP після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  успішно запускається, але перевірки готовності випереджають старт. Обидва значення мають бути
  додатними цілими числами до `120000` мс; некоректні значення конфігурації відхиляються.
- Порядок автовиявлення: типовий браузер, якщо він на базі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для окремого профілю в профілях `existing-session` також розгортається з тильдою.
- Сервіс керування: лише loopback (порт походить від `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад
  `--disable-gpu`, розмір вікна або прапорці налагодження).

---

## UI

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

- `seamColor`: акцентний колір для chrome нативного UI застосунку (відтінок бульбашки режиму розмови тощо).
- `assistant`: перевизначення ідентичності Control UI. Резервно використовує ідентичність активного агента.

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

<Accordion title="Докладні відомості про поля Gateway">

- `mode`: `local` (запустити gateway) або `remote` (під’єднатися до віддаленого gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми прив’язки**: використовуйте значення режиму прив’язки в `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хостів (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типова прив’язка `loopback` слухає `127.0.0.1` всередині контейнера. За мережевого мосту Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому Gateway недоступний. Використовуйте `--network host` або встановіть `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: типово обов’язкова. Прив’язки не до loopback вимагають автентифікації Gateway. На практиці це означає спільний токен/пароль або reverse proxy з підтримкою ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер онбордингу типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема SecretRefs), явно встановіть `gateway.auth.mode` на `token` або `password`. Потоки запуску та встановлення/ремонту сервісу завершуються помилкою, коли налаштовано обидва значення, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; це навмисно не пропонується в підказках онбордингу.
- `gateway.auth.mode: "trusted-proxy"`: делегує автентифікацію браузера/користувача reverse proxy з підтримкою ідентичності та довіряє заголовкам ідентичності від `gateway.trustedProxies` (див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth)). Цей режим типово очікує джерело проксі **не з loopback**; reverse proxy на тому самому хості через loopback вимагають явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні виклики з того самого хоста можуть використовувати `gateway.auth.password` як локальний прямий резервний варіант; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію заголовками Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації Gateway. Цей потік без токена припускає, що хост Gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб автентифікації. Застосовується на IP клієнта та на область автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Control UI Tailscale Serve невдалі спроби для тієї самої пари `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні невдалі спроби від того самого клієнта можуть спрацювати обмежувач уже на другому запиті, замість того щоб обидві пройшли як прості невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово `true`; встановіть `false`, коли ви навмисно хочете також обмежувати трафік localhost (для тестових налаштувань або суворих розгортань проксі).
- Спроби автентифікації WS із браузерного origin завжди обмежуються з вимкненим винятком для loopback (додатковий захист від перебору localhost з браузера).
- На loopback ці блокування з браузерного origin ізольовані для кожного нормалізованого значення `Origin`, тому повторні невдачі з одного localhost origin не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, прив’язка loopback) або `funnel` (публічно, вимагає автентифікації).
- `controlUi.allowedOrigins`: явний allowlist браузерних origin для підключень Gateway WebSocket. Обов’язково, коли браузерні клієнти очікуються з origin не з loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає резервне визначення origin за заголовком Host для розгортань, що навмисно покладаються на політику origin за заголовком Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійне перевизначення середовища процесу на стороні клієнта, яке дозволяє відкритий `ws://` до довірених IP приватної мережі; типово відкритий текст залишається дозволеним лише для loopback. Еквівалента в `openclaw.json` немає, а конфігурація приватної мережі браузера, як-от `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнтів Gateway WebSocket.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують автентифікацію Gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS-URL для зовнішнього ретранслятора APNs, який використовується офіційними/TestFlight збірками iOS після публікації реєстрацій із підтримкою ретранслятора до Gateway. Ця URL має збігатися з URL ретранслятора, скомпільованою в iOS-збірку.
- `gateway.push.apns.relay.timeoutMs`: таймаут надсилання від Gateway до ретранслятора в мілісекундах. Типово `10000`.
- Реєстрації з підтримкою ретранслятора делегуються конкретній ідентичності Gateway. Спарений iOS-застосунок отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію ретранслятора та пересилає до Gateway грант надсилання, обмежений реєстрацією. Інший Gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env-перевизначення для конфігурації ретранслятора вище.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch лише для розробки для HTTP-URL ретранслятора через loopback. Виробничі URL ретранслятора мають залишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: таймаут попереднього до автентифікації рукостискання Gateway WebSocket у мілісекундах. Типово: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли задано. Збільште це значення на завантажених або малопотужних хостах, де локальні клієнти можуть під’єднатися, поки прогрів запуску ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал монітора стану каналів у хвилинах. Встановіть `0`, щоб глобально вимкнути перезапуски монітора стану. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітора стану на канал/акаунт у ковзну годину. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: відмова на рівні каналу від перезапусків монітора стану зі збереженням глобального монітора ввімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення на рівні акаунта для багатьох акаунтів у каналах. Коли задано, має пріоритет над перевизначенням на рівні каналу.
- Локальні шляхи виклику Gateway можуть використовувати `gateway.remote.*` як резервний варіант лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується закрито (без маскування віддаленим резервним варіантом).
- `trustedProxies`: IP reverse proxy, які завершують TLS або вставляють заголовки пересланого клієнта. Вказуйте лише проксі, які ви контролюєте. Записи loopback усе ще чинні для налаштувань проксі/локального виявлення на тому самому хості (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять запити loopback придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, Gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий allowlist CIDR/IP для автоматичного схвалення першого спарювання пристрою node без запитаних областей. Вимкнено, коли не задано. Це не схвалює автоматично спарювання оператора/браузера/Control UI/WebChat, а також не схвалює автоматично оновлення ролі, області, метаданих або відкритого ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд node після спарювання та оцінювання allowlist платформи. Використовуйте `allowCommands`, щоб увімкнути небезпечні команди node, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо типовий дозвіл платформи або явний allow інакше включав би її. Після того як node змінює свій оголошений список команд, відхиліть і повторно схваліть це спарювання пристрою, щоб Gateway зберіг оновлений знімок команд.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий список deny).
- `gateway.tools.allow`: вилучає назви інструментів із типового HTTP deny list.

</Accordion>

### Сумісні з OpenAI кінцеві точки

- Chat Completions: типово вимкнено. Увімкніть за допомогою `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-вводу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlist вважаються незаданими; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посиленого захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (встановлюйте лише для HTTPS origin, які ви контролюєте; див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька Gateway на одному хості з унікальними портами та каталогами стану:

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

- `enabled`: вмикає завершення TLS на слухачі Gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару сертифікат/ключ, коли явні файли не налаштовано; лише для локального використання/розробки.
- `certPath`: шлях у файловій системі до файлу TLS-сертифіката.
- `keyPath`: шлях у файловій системі до файлу приватного TLS-ключа; тримайте доступ обмеженим.
- `caPath`: необов’язковий шлях до CA bundle для перевірки клієнтів або користувацьких ланцюжків довіри.

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

- `mode`: керує тим, як зміни конфігурації застосовуються під час виконання.
  - `"off"`: ігнорувати live-зміни; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес Gateway у разі зміни конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати hot reload; повернутися до перезапуску, якщо потрібно.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс очікування операцій у процесі перед примусовим перезапуском. Пропустіть, щоб використати типове обмежене очікування (`300000`); встановіть `0`, щоб чекати безстроково та періодично логувати попередження про все ще незавершені операції.

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
Токени хуків у query string відхиляються.

Примітки щодо перевірки та безпеки:

- `hooks.enabled=true` потребує непорожнього `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо зіставлення або пресет використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі зіставлення не потребують цього явного ввімкнення.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з корисного навантаження запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` зіставлення, відрендерені з шаблону, вважаються наданими ззовні й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Подробиці зіставлення">

- `match.path` зіставляє підшлях після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле корисного навантаження для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з корисного навантаження.
- `transform` може вказувати на модуль JS/TS, що повертає дію хука.
  - `transform.module` має бути відносним шляхом і лишатися в межах `hooks.transformsDir` (абсолютні шляхи та обхід каталогів відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ідентифікатори повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або відсутнє значення = дозволити всіх, `[]` = заборонити всіх).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків агента хуком без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і керованим шаблонами ключам сесій зіставлення задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + зіставлення), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-яке зіставлення або пресет використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску хука (має бути дозволено, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований пресет Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте цю маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` так, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
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

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, коли це налаштовано. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
- Не запускайте окремий `gog gmail watch serve` поруч із Gateway.

---

## Хост canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Обслуговує редаговані агентом HTML/CSS/JS і A2UI через HTTP під портом Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Прив’язки не до loopback: маршрути canvas потребують автентифікації Gateway (токен/пароль/довірений проксі), так само як інші HTTP-поверхні Gateway.
- WebViews Node зазвичай не надсилають заголовки автентифікації; після створення пари з вузлом і підключення Gateway оголошує URL-адреси можливостей, обмежені вузлом, для доступу до canvas/A2UI.
- URL-адреси можливостей прив’язані до активної WS-сесії вузла й швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт live-reload в обслуговуваний HTML.
- Автоматично створює початковий `index.html`, коли порожньо.
- Також обслуговує A2UI за `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
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

- `minimal` (типово): пропускає `cliPath` + `sshPort` у записах TXT.
- `full`: включає `cliPath` + `sshPort`.
- Ім’я хоста типово дорівнює системному імені хоста, коли воно є дійсною DNS-міткою, з поверненням до `openclaw`. Перевизначте за допомогою `OPENCLAW_MDNS_HOSTNAME`.

### Глобальна мережа (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує unicast-зону DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднайте з DNS-сервером (рекомендовано CoreDNS) + Tailscale split DNS.

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

- Вбудовані змінні середовища застосовуються лише якщо в середовищі процесу відсутній ключ.
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Див. [Середовище](/uk/help/environment) для повного порядку пріоритетів.

### Підстановка змінних середовища

Посилайтеся на змінні середовища в будь-якому рядку конфігурації за допомогою `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Зіставляються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні або порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте як `$${VAR}` для буквального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є додатковими: відкриті текстові значення все ще працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- Шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Шаблон `id` для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- Шаблон `id` для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` для `source: "exec"` не мають містити розділені скісними рисками сегменти шляху `.` або `..` (наприклад, `a/../b` буде відхилено)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включені до розв’язання під час виконання та покриття аудиту.

### Конфігурація постачальників секретів

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

- Постачальник `file` підтримує `mode: "json"` і `mode: "singleValue"` (`id` має бути `"value"` у режимі singleValue).
- Шляхи постачальників file та exec аварійно завершуються із закритою поведінкою, коли перевірка Windows ACL недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Постачальник `exec` вимагає абсолютний шлях `command` і використовує протокольні payload-и через stdin/stdout.
- За замовчуванням шляхи команд через symlink відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи symlink із валідацією розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довіреного каталогу застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` за замовчуванням мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв’язуються під час активації в snapshot у пам’яті, після чого шляхи запитів читають лише snapshot.
- Фільтрація активної поверхні застосовується під час активації: нерозв’язані посилання на увімкнених поверхнях спричиняють збій запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

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

- Профілі для окремих агентів зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Застарілі плоскі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є форматом під час виконання; `openclaw doctor --fix` переписує їх у канонічні API-key профілі `provider:default` з резервною копією `.legacy-flat.*.bak`.
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні облікові дані під час виконання надходять із розв’язаних snapshot-ів у пам’яті; застарілі статичні записи `auth.json` очищаються під час виявлення.
- Застарілі імпорти OAuth беруться з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Поведінка секретів під час виконання та інструменти `audit/configure/apply`: [Керування секретами](/uk/gateway/secrets).

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

- `billingBackoffHours`: базовий backoff у годинах, коли профіль зазнає збою через справжні
  помилки білінгу/недостатнього кредиту (за замовчуванням: `5`). Явний текст про білінг
  усе ще може потрапити сюди навіть у відповідях `401`/`403`, але специфічні для постачальника
  текстові зіставники залишаються обмеженими постачальником, якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повторювані HTTP `402` повідомлення про usage-window або
  обмеження витрат організації/робочого простору натомість залишаються у шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин backoff для білінгу за постачальниками.
- `billingMaxHours`: ліміт у годинах для експоненційного зростання backoff для білінгу (за замовчуванням: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для високодостовірних збоїв `auth_permanent` (за замовчуванням: `10`).
- `authPermanentMaxMinutes`: ліміт у хвилинах для зростання backoff `auth_permanent` (за замовчуванням: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників backoff (за замовчуванням: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile того самого постачальника для помилок перевантаження перед переходом до резервної моделі (за замовчуванням: `1`). Форми зайнятості постачальника, як-от `ModelNotReadyException`, потрапляють сюди.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого постачальника/профілю (за замовчуванням: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile того самого постачальника для помилок rate-limit перед переходом до резервної моделі (за замовчуванням: `1`). Цей кошик rate-limit включає текст у формі постачальника, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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

- Стандартний файл журналу: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Задайте `logging.file` для стабільного шляху.
- `consoleLevel` підвищується до `debug`, коли використано `--verbose`.
- `maxFileBytes`: максимальний розмір активного файлу журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 MB). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування на основі найкращих зусиль для виводу в консоль, файлових журналів, записів журналу OTLP і збереженого тексту стенограми сеансу. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/стенограм; поверхні безпеки UI/інструментів/діагностики все одно редагують секрети перед надсиланням.

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

- `enabled`: головний перемикач для виводу інструментації (типово: `true`).
- `flags`: масив рядків прапорців, що вмикають цільовий вивід журналів (підтримує символи-джокери, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для класифікації довготривалих сеансів обробки як `session.long_running`, `session.stalled` або `session.stuck`.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. у [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL збирача для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові кінцеві точки OTLP для окремих сигналів. Якщо задано, вони перевизначають `otel.endpoint` лише для цього сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт трас, метрик або журналів.
- `otel.sampleRate`: частота вибірки трас `0`–`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання телеметрії в мс.
- `otel.captureContent`: явне ввімкнення захоплення необробленого вмісту для атрибутів діапазонів OTEL. Типово вимкнено. Булеве `true` захоплює вміст повідомлень/інструментів, що не є системним; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: перемикач середовища для найновіших експериментальних атрибутів постачальника діапазонів GenAI. Типово діапазони зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: перемикач середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/зупинку SDK, що належить плагіну, зберігаючи активними діагностичні слухачі.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища для кінцевих точок окремих сигналів, що використовуються, коли відповідний ключ конфігурації не задано.
- `cacheTrace.enabled`: записувати знімки трасування кешу для вбудованих запусків (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL трасування кешу (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід трасування кешу (усі типово: `true`).

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
- `checkOnStart`: перевіряти оновлення npm під час запуску Gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для пакетних встановлень (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням у стабільному каналі (типово: `6`; макс.: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання стабільного каналу в годинах (типово: `12`; макс.: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки бета-каналу, у годинах (типово: `1`; макс.: `24`).

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

- `enabled`: глобальний функціональний шлюз ACP (типово: `true`; задайте `false`, щоб приховати диспетчеризацію ACP і можливості запуску).
- `dispatch.enabled`: незалежний шлюз для диспетчеризації ходу сеансу ACP (типово: `true`). Задайте `false`, щоб залишити команди ACP доступними, але заблокувати виконання.
- `backend`: типовий ідентифікатор бекенда середовища виконання ACP (має збігатися із зареєстрованим плагіном середовища виконання ACP).
  Якщо задано `plugins.allow`, включіть ідентифікатор бекенд-плагіна (наприклад `acpx`), інакше вбудований типовий плагін не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли запуски не вказують явну ціль.
- `allowedAgents`: список дозволених ідентифікаторів агентів для сеансів середовища виконання ACP; порожнє значення означає відсутність додаткового обмеження.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сеансів ACP.
- `stream.coalesceIdleMs`: вікно скидання під час простою в мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед поділом проєкції потокового блоку.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів у межах одного ходу (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потік поступово; `"final_only"` буферизує до завершальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, спроєктованих на один хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для спроєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів у булеві перевизначення видимості для потокових подій.
- `runtime.ttlMinutes`: TTL простою в хвилинах для робітників сеансу ACP перед можливим очищенням.
- `runtime.installCommand`: необов’язкова команда встановлення, яку потрібно виконати під час початкового налаштування середовища виконання ACP.

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

- `cli.banner.taglineMode` керує стилем слогану банера:
  - `"random"` (типово): ротаційні жартівливі/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогану (назва/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), задайте змінну середовища `OPENCLAW_HIDE_BANNER=1`.

---

## Майстер

Метадані, які записують керовані потоки налаштування CLI (`onboard`, `configure`, `doctor`):

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

Див. поля ідентичності `agents.list` у [типових значеннях агента](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застаріле, вилучено)

Поточні збірки більше не містять TCP-міст. Nodes підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною схеми конфігурації (перевірка не пройде, доки їх не буде вилучено; `openclaw doctor --fix` може видалити невідомі ключі).

<Accordion title="Застаріла конфігурація мосту (історична довідка)">

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

- `sessionRetention`: як довго зберігати завершені ізольовані сеанси запусків cron перед видаленням із `sessions.json`. Також керує очищенням архівованих стенограм видалених cron. Типово: `24h`; задайте `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір кожного файлу журналу запуску (`cron/runs/<jobId>.jsonl`) перед скороченням. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки, що зберігаються під час скорочення журналу запуску. Типово: `2000`.
- `webhookToken`: bearer-токен, який використовується для доставки cron Webhook POST (`delivery.mode = "webhook"`); якщо пропущено, заголовок автентифікації не надсилається.
- `webhook`: застарілий резервний URL Webhook (http/https), який використовується лише для збережених завдань, що досі мають `notify: true`.

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
- `backoffMs`: масив затримок backoff у мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, що запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових завдань cron. Повторювані завдання використовують окрему обробку збоїв.

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

- `enabled`: увімкнути сповіщення про збої для завдань cron (типово: `false`).
- `after`: послідовні збої перед спрацюванням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `includeSkipped`: враховувати послідовні пропущені запуски в поріг сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на backoff помилок виконання.
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` надсилає POST до налаштованого Webhook.
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

- Типове призначення для сповіщень про збої Cron в усіх завданнях.
- `mode`: `"announce"` або `"webhook"`; типовим є `"announce"`, коли існує достатньо даних цілі.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL Webhook. Обов’язково для режиму Webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає цей глобальний типовий параметр.
- Коли не задано ні глобальне призначення для сповіщень про збої, ні призначення для окремого завдання, завдання, які вже доставляються через `announce`, у разі збою повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не є `"webhook"`.

Див. [Завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання Cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблону медіамоделі

Заповнювачі шаблону, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повне тіло вхідного повідомлення                  |
| `{{RawBody}}`      | Необроблене тіло (без обгорток історії/відправника) |
| `{{BodyStripped}}` | Тіло з видаленими груповими згадками              |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | ID повідомлення каналу                            |
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (зображення/аудіо/документ/…)           |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Вирішений медіапромпт для записів CLI             |
| `{{MaxChars}}`     | Вирішена максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (найкращими зусиллями)                 |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (найкращими зусиллями) |
| `{{SenderName}}`   | Відображуване ім’я відправника (найкращими зусиллями) |
| `{{SenderE164}}`   | Номер телефону відправника (найкращими зусиллями) |
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

**Поведінка злиття:**

- Один файл: замінює об’єкт, що його містить.
- Масив файлів: глибоко об’єднується за порядком (пізніші перевизначають попередні).
- Сусідні ключі: об’єднуються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: вирішуються відносно файлу, що виконує включення, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми та форми з `../` дозволені лише тоді, коли вони все одно вирішуються в межах цієї границі.
- Записи, якими керує OpenClaw і які змінюють лише один розділ верхнього рівня, підтриманий однофайловим включенням, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, якими керує OpenClaw; такі записи завершуються закритою відмовою замість вирівнювання конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок аналізу та циклічних включень.

---

_Пов’язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
