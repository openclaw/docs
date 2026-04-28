---
read_when:
    - Вам потрібна точна семантика конфігурації на рівні полів або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-04-28T22:58:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed99df1a7ec858e79380704e29d1a31e7b10f0429aa928d205503f7ea97187b8
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Довідник основної конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Конфігурація](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і дає посилання назовні, коли підсистема має власний глибший довідник. Каталоги команд, що належать каналам і plugin, а також поглиблені налаштування пам’яті/QMD розміщено на власних сторінках, а не тут.

Джерело істини в коді:

- `openclaw config schema` друкує актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими вбудованих/plugin/каналів, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми, обмежений шляхом, для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації щодо поточної поверхні схеми

Шлях пошуку агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації та обмежень на рівні полів перед редагуванням. Використовуйте
[Конфігурація](/uk/gateway/configuration) для порад, орієнтованих на завдання, а цю сторінку
для ширшої карти полів, значень за замовчуванням і посилань на довідники підсистем.

Окремі поглиблені довідники:

- [Довідник конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash-команди](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідних каналів/plugin для поверхонь команд, специфічних для каналів

Формат конфігурації — **JSON5** (дозволені коментарі та кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, коли їх пропущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на окрему сторінку — див.
[Конфігурація — канали](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, обмеження за згадками).

## Значення агента за замовчуванням, багатоагентність, сесії та повідомлення

Перенесено на окрему сторінку — див.
[Конфігурація — агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робоча область, модель, мислення, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (багатоагентна маршрутизація та прив’язки)
- `session.*` (життєвий цикл сесії, compaction, pruning)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: коли не задано, Talk зберігає стандартне для платформи вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)

## Інструменти та власні провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів із підтримкою провайдера та налаштування
власного провайдера / базового URL перенесено на окрему сторінку — див.
[Конфігурація — інструменти та власні провайдери](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, списки дозволених моделей і налаштування власного провайдера наведено в
[Конфігурація — інструменти та власні провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.providers`: мапа власних провайдерів із ключами за ідентифікатором провайдера.
- `models.pricing.enabled`: керує фоновою ініціалізацією цін. Коли
  `false`, запуск Gateway пропускає отримання каталогів цін OpenRouter і LiteLLM;
  налаштовані значення `models.providers.*.models[].cost` усе одно працюють для локальних
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

- `mcp.servers`: іменовані визначення stdio або віддалених MCP-серверів для runtime, які
  відкривають налаштовані MCP-інструменти.
  Віддалені записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` — це CLI-native псевдонім, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.sessionIdleTtlMs`: idle TTL для bundled MCP runtime, обмежених сесією.
  Одноразові вбудовані запуски запитують очищення після завершення запуску; цей TTL є резервним механізмом для
  довгоживучих сесій і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються гаряче через звільнення кешованих MCP runtime сесії.
  Наступне виявлення/використання інструмента створює їх заново з нової конфігурації, тому вилучені
  записи `mcp.servers` прибираються негайно, а не чекають на idle TTL.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI-бекенди](/uk/gateway/cli-backends#bundle-mcp-overlays) щодо поведінки runtime.

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

- `allowBundled`: необов’язковий список дозволів лише для bundled skills (managed/workspace skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені skill (найнижчий пріоритет).
- `install.preferBrew`: коли `true`, віддає перевагу інсталяторам Homebrew, якщо `brew` є
  доступним, перед переходом до інших типів інсталяторів.
- `install.nodeManager`: бажаний node-інсталятор для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручне поле для skills, що оголошують основну змінну середовища (plain-text рядок або об’єкт SecretRef).

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

- Завантажується з `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, а також `plugins.load.paths`.
- Виявлення приймає нативні OpenClaw plugins, а також сумісні bundles Codex і bundles Claude, зокрема bundles стандартного макета Claude без маніфеста.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий список дозволів (завантажуються лише перелічені plugins). `deny` має перевагу.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні plugin (коли підтримується plugin).
- `plugins.entries.<id>.env`: мапа змінних середовища в області plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` і ігнорує поля, що змінюють prompt, зі старого `before_agent_start`, водночас зберігаючи старі `modelOverride` і `providerOverride`. Застосовується до нативних hooks plugin і підтримуваних директорій hook, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені non-bundled plugins можуть читати сирий вміст розмови з типізованих hooks, таких як `llm_input`, `llm_output`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довірити цьому plugin запитувати per-run перевизначення `provider` і `model` для фонових запусків subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений plugin (валідується схемою нативного OpenClaw plugin, коли доступна).
- Налаштування облікового запису/runtime channel plugin розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфеста plugin-власника, а не центральним реєстром опцій OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування web-fetch провайдера Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Повертається до `plugins.entries.firecrawl.config.webSearch.apiKey`, старого `tools.web.fetch.firecrawl.apiKey` або змінної середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (за замовчуванням: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (за замовчуванням: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (за замовчуванням: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут scrape-запиту в секундах (за замовчуванням: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (за замовчуванням `false`).
  - `frequency`: cron-періодичність для кожного повного проходу dreaming (`"0 3 * * *"` за замовчуванням).
  - `model`: необов’язкове перевизначення моделі subagent Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз із моделлю сесії за замовчуванням; збої довіри або списку дозволів не повертаються непомітно до запасного варіанта.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті наведена в [Довідник конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені plugins Claude bundle також можуть додавати вбудовані значення Pi за замовчуванням із `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати ідентифікатор активного memory plugin або `"none"`, щоб вимкнути memory plugins.
- `plugins.slots.contextEngine`: вибрати ідентифікатор активного context engine plugin; за замовчуванням `"legacy"`, якщо ви не встановите й не виберете інший engine.

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
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте навігації браузера приватною мережею.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підлягають тому самому блокуванню приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` лишається підтримуваним як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі доступні лише для підключення (запуск/зупинка/скидання вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL WebSocket DevTools.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до віддаленої та
  `attachOnly` доступності CDP, а також до запитів відкриття вкладок. Керовані профілі
  local loopback зберігають локальні типові значення CDP.
- Якщо зовні керований сервіс CDP доступний через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw вважатиме порт loopback
  локальним керованим профілем браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися на
  вибраному хості або через підключений вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на основі Chromium, як-от Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання CSS-селекторами, хуки завантаження
  одного файлу, без перевизначень таймауту діалогів, без `wait --load networkidle` і без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; задавайте
  `cdpUrl` явно лише для віддаленого CDP.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після старту процесу та `browser.localCdpReadyTimeoutMs` для
  готовності CDP websocket після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  успішно стартує, але перевірки готовності випереджають запуск. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: типовий браузер, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для окремого профілю в профілях `existing-session` також розгортається з тильдою.
- Сервіс керування: лише loopback (порт виводиться з `gateway.port`, типово `18791`).
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

- `seamColor`: акцентний колір для chrome інтерфейсу нативного застосунку (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення ідентичності Control UI. За замовчуванням використовується ідентичність активного агента.

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

<Accordion title="Відомості про поля Gateway">

- `mode`: `local` (запустити Gateway) або `remote` (підключитися до віддаленого Gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: один мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми прив’язки**: використовуйте значення режиму прив’язки в `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типова прив’язка `loopback` слухає `127.0.0.1` усередині контейнера. За мережі Docker bridge (`-p 18789:18789`) трафік надходить на `eth0`, тому gateway недосяжний. Використовуйте `--network host` або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: обов’язкова за замовчуванням. Прив’язки не через loopback вимагають автентифікації gateway. На практиці це означає спільний токен/пароль або зворотний проксі з підтримкою ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер початкового налаштування типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно із SecretRefs), явно задайте `gateway.auth.mode` як `token` або `password`. Запуск і потоки встановлення/відновлення сервісу завершуються помилкою, коли налаштовано обидва значення, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; це навмисно не пропонується підказками початкового налаштування.
- `gateway.auth.mode: "trusted-proxy"`: делегує автентифікацію браузера/користувача зворотному проксі з підтримкою ідентичності та довіряє заголовкам ідентичності від `gateway.trustedProxies` (див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth)). Цей режим типово очікує джерело проксі **не через loopback**; зворотні проксі loopback на тому самому хості потребують явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні викликачі з того самого хоста можуть використовувати `gateway.auth.password` як локальний прямий резервний варіант; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевірено через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію за заголовком Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації gateway. Цей потік без токена припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб автентифікації. Застосовується для кожної IP-адреси клієнта та кожної області автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому паралельні помилкові спроби від того самого клієнта можуть увімкнути обмежувач уже на другому запиті, замість того щоб обидві пройшли як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово дорівнює `true`; задайте `false`, коли ви навмисно хочете обмежувати частоту також для трафіку localhost (для тестових налаштувань або суворих розгортань із проксі).
- Спроби WS-автентифікації з браузерного origin завжди обмежуються за частотою з вимкненим винятком для loopback (додатковий захист від браузерного перебору localhost).
- На loopback ці блокування за браузерним origin ізольовані для кожного нормалізованого значення `Origin`, тому повторні помилки з одного origin localhost не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, прив’язка loopback) або `funnel` (публічно, потребує автентифікації).
- `controlUi.allowedOrigins`: явний список дозволених браузерних origin для підключень Gateway WebSocket. Потрібний, коли очікуються браузерні клієнти з origin не через loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає резервне визначення origin із заголовка Host для розгортань, що навмисно покладаються на політику origin із заголовка Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійне перевизначення на рівні середовища клієнтського процесу, яке дозволяє незашифрований `ws://` до довірених IP приватної мережі; типовим для незашифрованого з’єднання залишається лише loopback. Еквівалента в `openclaw.json` немає, а конфігурація приватної мережі браузера, як-от `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнти Gateway WebSocket.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Самі по собі вони не налаштовують автентифікацію gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS-URL для зовнішнього ретранслятора APNs, який використовується офіційними/TestFlight збірками iOS після публікації реєстрацій із підтримкою ретранслятора в gateway. Ця URL має збігатися з URL ретранслятора, скомпільованою в iOS-збірку.
- `gateway.push.apns.relay.timeoutMs`: таймаут надсилання від gateway до ретранслятора в мілісекундах. Типово `10000`.
- Реєстрації з підтримкою ретранслятора делегуються конкретній ідентичності gateway. Спарений iOS-застосунок отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію ретранслятора та пересилає gateway дозвіл на надсилання, обмежений цією реєстрацією. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові перевизначення середовища для наведеної вище конфігурації ретранслятора.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: лише для розробки, аварійний обхід для HTTP-URL ретранслятора loopback. Виробничі URL ретранслятора мають залишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: таймаут попереднього до автентифікації рукостискання Gateway WebSocket у мілісекундах. Типово: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, якщо задано. Збільшуйте це значення на завантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки прогрівання запуску ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал монітора стану каналу в хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски монітором стану. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітором стану для каналу/облікового запису за рухому годину. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: вимкнення перезапусків монітором стану для окремого каналу зі збереженням увімкненого глобального монітора.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для окремого облікового запису в багатоканальних облікових записах. Коли задано, має пріоритет над перевизначенням на рівні каналу.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується закритою відмовою (без маскування віддаленим резервним варіантом).
- `trustedProxies`: IP-адреси зворотних проксі, які завершують TLS або додають заголовки пересланого клієнта. Указуйте лише проксі, які ви контролюєте. Записи loopback усе ще чинні для налаштувань проксі/локального виявлення на тому самому хості (наприклад, Tailscale Serve або локальний зворотний проксі), але вони **не** роблять запити loopback придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для поведінки із закритою відмовою.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий список дозволених CIDR/IP для автоматичного схвалення першого спарювання пристрою вузла без запитаних областей доступу. Вимкнено, якщо не задано. Це не схвалює автоматично спарювання оператора/браузера/Control UI/WebChat і не схвалює автоматично оновлення ролі, області доступу, метаданих або публічного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування дозволів/заборон для оголошених команд вузла після спарювання та оцінки списку дозволів платформи. Використовуйте `allowCommands`, щоб увімкнути небезпечні команди вузла, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо типовий дозвіл платформи або явний дозвіл інакше включав би її. Після зміни вузлом свого оголошеного списку команд відхиліть і повторно схваліть спарювання цього пристрою, щоб gateway зберіг оновлений знімок команд.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий список заборони).
- `gateway.tools.allow`: вилучає назви інструментів із типового HTTP-списку заборони.

</Accordion>

### OpenAI-сумісні кінцеві точки

- Chat Completions: вимкнено за замовчуванням. Увімкніть за допомогою `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-введення Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні списки дозволів вважаються незаданими; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false` та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS-origin, які ви контролюєте; див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запустіть кілька gateway на одному хості з унікальними портами й каталогами стану:

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

- `enabled`: вмикає завершення TLS на слухачі gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару сертифікат/ключ, коли явні файли не налаштовано; лише для локального використання/розробки.
- `certPath`: шлях у файловій системі до файлу TLS-сертифіката.
- `keyPath`: шлях у файловій системі до файлу приватного TLS-ключа; обмежте дозволи.
- `caPath`: необов’язковий шлях до пакета CA для перевірки клієнтів або користувацьких ланцюгів довіри.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: керує тим, як зміни конфігурації застосовуються під час виконання.
  - `"off"`: ігнорувати живі зміни; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес gateway під час зміни конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати гаряче перезавантаження; за потреби перейти до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс очікування поточних операцій перед примусовим перезапуском. Пропустіть або задайте `0`, щоб чекати безстроково й періодично журналювати попередження про операції, що все ще очікують.

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

Примітки щодо перевірки та безпеки:

- `hooks.enabled=true` потребує непорожнього `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо мапінг або пресет використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі мапінгу не потребують цього явного ввімкнення.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з тіла запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → визначається через `hooks.mappings`
  - Значення `sessionKey` мапінгу, згенеровані з шаблону, вважаються наданими ззовні й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` зіставляє підшлях після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле тіла запиту для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з тіла запиту.
- `transform` може вказувати на JS/TS-модуль, що повертає дію хука.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та вихід за межі каталогу відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ідентифікатори повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов'язковий фіксований ключ сесії для запусків агента хуком без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і керованим шаблонами ключам сесій мапінгу задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов'язковий список дозволених префіксів для явних значень `sessionKey` (запит + мапінг), наприклад `["hook:"]`. Він стає обов'язковим, коли будь-який мапінг або пресет використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску хука (має бути дозволено, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований пресет Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте цю маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` так, щоб вони відповідали простору назв Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібне `hooks.allowRequestSessionKey: false`, перевизначте пресет статичним `sessionKey` замість шаблонного типового значення.

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
- Не запускайте окремий `gog gmail watch serve` паралельно з Gateway.

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

- Надає доступ до редагованих агентом HTML/CSS/JS і A2UI через HTTP під портом Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залиште `gateway.bind: "loopback"` (типово).
- Прив'язки не до loopback: маршрути canvas потребують автентифікації Gateway (токен/пароль/довірений проксі), як і інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки автентифікації; після створення пари з вузлом і підключення Gateway оголошує URL можливостей, обмежені вузлом, для доступу до canvas/A2UI.
- URL можливостей прив'язані до активної WS-сесії вузла й швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт live-reload в HTML, що надається.
- Автоматично створює стартовий `index.html`, коли каталог порожній.
- Також надає A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
- Вимикайте live reload для великих каталогів або помилок `EMFILE`.

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

- `minimal` (типово): не включати `cliPath` + `sshPort` у TXT-записи.
- `full`: включати `cliPath` + `sshPort`.
- Ім'я хоста типово дорівнює системному імені хоста, якщо воно є коректною DNS-міткою, інакше використовується `openclaw`. Перевизначте через `OPENCLAW_MDNS_HOSTNAME`.

### Широка область (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує unicast DNS-SD-зону в `~/.openclaw/dns/`. Для виявлення між мережами поєднайте з DNS-сервером (рекомендовано CoreDNS) + Tailscale split DNS.

Налаштування: `openclaw dns setup --apply`.

---

## Середовище

### `env` (вбудовані env vars)

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

- Вбудовані змінні середовища застосовуються лише якщо в середовищі процесу немає ключа.
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний порядок пріоритету див. у [Середовище](/uk/help/environment).

### Підставлення змінних середовища

Посилайтеся на змінні середовища в будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Збігаються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте через `$${VAR}` для літерального `${VAR}`.
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

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id для `source: "exec"` не повинні містити розділені скісними рисками сегменти шляху `.` або `..` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` спрямовується на підтримувані шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включені до runtime-розв’язання та покриття аудиту.

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
- Шляхи постачальників file та exec завершуються відмовою, коли перевірка Windows ACL недоступна. Встановлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Постачальник `exec` вимагає абсолютний шлях `command` і використовує протокольні payload-и через stdin/stdout.
- За замовчуванням шляхи команд через symlink відхиляються. Встановіть `allowSymlinkCommand: true`, щоб дозволити шляхи symlink із валідацією розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довіреного каталогу застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` за замовчуванням мінімальне; явно передавайте потрібні змінні через `passEnv`.
- Посилання на секрети розв’язуються під час активації у знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Під час активації застосовується фільтрація активної поверхні: нерозв’язані посилання на ввімкнених поверхнях спричиняють збій запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

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

- Профілі для кожного агента зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Застарілі пласкі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є runtime-форматом; `openclaw doctor --fix` переписує їх у канонічні API-key-профілі `provider:default` із резервною копією `.legacy-flat.*.bak`.
- Профілі OAuth-режиму (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-профілів на основі SecretRef.
- Статичні runtime-облікові дані надходять із розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються після виявлення.
- Застарілі OAuth-імпорти беруться з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Runtime-поведінка секретів і інструменти `audit/configure/apply`: [Керування секретами](/uk/gateway/secrets).

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

- `billingBackoffHours`: базовий backoff у годинах, коли профіль дає збій через справжні
  помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг може
  все одно потрапити сюди навіть у відповідях `401`/`403`, але специфічні для постачальника
  text matcher-и залишаються обмеженими постачальником, якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повторювані повідомлення HTTP `402` про вікно використання або
  ліміт витрат організації/робочого простору натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин billing backoff для кожного постачальника.
- `billingMaxHours`: верхня межа в годинах для експоненційного зростання billing backoff (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для високодостовірних збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: верхня межа в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілів того самого постачальника для помилок перевантаження перед перемиканням на fallback моделі (типово: `1`). Сюди потрапляють форми зайнятості постачальника, як-от `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого постачальника/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілів того самого постачальника для помилок обмеження швидкості перед перемиканням на fallback моделі (типово: `1`). Цей bucket обмеження швидкості включає текст, сформований постачальниками, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `consoleLevel` підвищується до `debug`, коли вказано `--verbose`.
- `maxFileBytes`: максимальний розмір активного файлу журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 MB). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: евристичне маскування для виводу в консоль, файлових журналів, записів журналу OTLP і збереженого тексту транскрипту сеансу. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/транскриптів; UI, інструменти та діагностичні поверхні безпеки все одно редагують секрети перед передаванням.

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

- `enabled`: головний перемикач для інструментального виводу (типово: `true`).
- `flags`: масив рядків прапорців, що вмикають цільовий вивід журналів (підтримує шаблони на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для надсилання попереджень про застряглий сеанс, поки сеанс залишається у стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. у [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL збирача для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові кінцеві точки OTLP для окремих сигналів. Якщо задані, вони перевизначають `otel.endpoint` лише для відповідного сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва служби для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт трас, метрик або журналів.
- `otel.sampleRate`: частота семплювання трас `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання телеметрії в мс.
- `otel.captureContent`: добровільне захоплення сирого вмісту для атрибутів спанів OTEL. Типово вимкнено. Булеве `true` захоплює вміст повідомлень/інструментів, що не є системним; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: змінна середовища для найновіших експериментальних атрибутів провайдера спанів GenAI. Типово спани зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: змінна середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/зупинку SDK, що належить Plugin, але залишає діагностичні слухачі активними.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища кінцевих точок для окремих сигналів, які використовуються, коли відповідний ключ конфігурації не задано.
- `cacheTrace.enabled`: журналювати знімки трасування кешу для вбудованих запусків (типово: `false`).
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
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням стабільного каналу (типово: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання стабільного каналу в годинах (типово: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки бета-каналу в годинах (типово: `1`; максимум: `24`).

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

- `enabled`: глобальний функціональний шлюз ACP (типово: `true`; задайте `false`, щоб приховати диспетчеризацію ACP і можливості створення).
- `dispatch.enabled`: незалежний шлюз для диспетчеризації кроків сеансу ACP (типово: `true`). Задайте `false`, щоб залишити команди ACP доступними, але заблокувати виконання.
- `backend`: типовий ідентифікатор бекенда середовища виконання ACP (має відповідати зареєстрованому runtime Plugin ACP).
  Якщо задано `plugins.allow`, додайте ідентифікатор бекенд-Plugin (наприклад, `acpx`), інакше вбудований типовий Plugin не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли створення не задає явну ціль.
- `allowedAgents`: список дозволених ідентифікаторів агентів для сеансів середовища виконання ACP; порожнє значення означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сеансів ACP.
- `stream.coalesceIdleMs`: вікно скидання під час простою в мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед розділенням проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки стану/інструментів у межах кроку (типово: `true`).
- `stream.deliveryMode`: `"live"` транслює інкрементально; `"final_only"` буферизує до термінальних подій кроку.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, що проєктується на крок ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків стану/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів до булевих перевизначень видимості для потокових подій.
- `runtime.ttlMinutes`: TTL простою в хвилинах для робітників сеансів ACP перед тим, як вони стають придатними до очищення.
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

- `cli.banner.taglineMode` керує стилем слогана банера:
  - `"random"` (типово): змінні смішні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), задайте змінну середовища `OPENCLAW_HIDE_BANNER=1`.

---

## Майстер

Метадані, які записуються керованими потоками налаштування CLI (`onboard`, `configure`, `doctor`):

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

Див. поля ідентичності `agents.list` у розділі [Типові значення агента](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застаріле, видалено)

Поточні збірки більше не містять TCP-міст. Nodes підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною схеми конфігурації (перевірка не проходить, доки їх не буде видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

<Accordion title="Legacy bridge config (historical reference)">

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

- `sessionRetention`: як довго зберігати завершені ізольовані сеанси запусків Cron перед обрізанням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів Cron. Типово: `24h`; задайте `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір кожного файлу журналу запуску (`cron/runs/<jobId>.jsonl`) перед обрізанням. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки, що зберігаються, коли запускається обрізання журналу запуску. Типово: `2000`.
- `webhookToken`: bearer-токен, що використовується для доставки POST Cron Webhook (`delivery.mode = "webhook"`); якщо пропущено, заголовок автентифікації не надсилається.
- `webhook`: застарілий резервний URL Webhook (http/https), який використовується лише для збережених завдань, що все ще мають `notify: true`.

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

Застосовується лише до одноразових завдань Cron. Повторювані завдання використовують окрему обробку збоїв.

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

- `enabled`: увімкнути сповіщення про збої для завдань Cron (типово: `false`).
- `after`: кількість послідовних збоїв перед спрацюванням сповіщення (додатне ціле число, мінімум: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `includeSkipped`: зараховувати послідовно пропущені запуски до порогу сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на backoff помилок виконання.
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує до налаштованого Webhook.
- `accountId`: необов’язковий ідентифікатор облікового запису або каналу для обмеження доставки сповіщень.

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
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних цілі.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL Webhook. Обов’язково для режиму Webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли не задано ні глобальне призначення для збоїв, ні призначення для окремого завдання, завдання, які вже доставляють через `announce`, у разі збою повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не є `"webhook"`.

Див. [завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання Cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Заповнювачі шаблону, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повне тіло вхідного повідомлення                  |
| `{{RawBody}}`      | Сире тіло (без обгорток історії/відправника)      |
| `{{BodyStripped}}` | Тіло з вилученими згадками груп                   |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | ID повідомлення каналу                            |
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (зображення/аудіо/документ/…)           |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Вирішений медіа-промпт для записів CLI            |
| `{{MaxChars}}`     | Вирішена максимальна кількість символів виводу для записів CLI |
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

**Поведінка злиття:**

- Один файл: замінює об’єкт, що його містить.
- Масив файлів: глибоко зливається за порядком (пізніші значення перевизначають попередні).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: вирішуються відносно файлу, що виконує включення, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми та форми з `../` дозволені лише тоді, коли вони все одно вирішуються всередині цієї межі.
- Записи, якими володіє OpenClaw і які змінюють лише один розділ верхнього рівня, підкріплений однофайловим включенням, записуються наскрізно до цього включеного файлу. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, якими володіє OpenClaw; такі записи завершуються закритою помилкою замість розгортання конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних включень.

---

_Пов’язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
