---
read_when:
    - Вам потрібні точні семантики конфігурації на рівні полів або типові значення
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, типових значень і посилань на окремі довідники підсистем
title: Довідник конфігурації
x-i18n:
    generated_at: "2026-04-27T12:49:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3c9d69ac5fe9c32a19bb92e05927a3ec919c3d4112b809f9d886a83746d37c8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Основний довідник конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Configuration](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і містить посилання назовні, коли підсистема має власний глибший довідник. Каталоги команд, що належать каналам і плагінам, а також глибокі параметри пам’яті/QMD розміщені на окремих сторінках, а не тут.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, із злитими метаданими вбудованих плагінів/каналів, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми для заданого шляху для інструментів детального перегляду
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий геш документації конфігурації щодо поточної поверхні схеми

Шлях пошуку для агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації на рівні полів і обмежень перед редагуванням. Використовуйте
[Configuration](/uk/gateway/configuration) для вказівок, орієнтованих на завдання, а цю сторінку —
для ширшої карти полів, типових значень і посилань на довідники підсистем.

Окремі глибокі довідники:

- [Memory configuration reference](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації Dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/uk/tools/slash-commands) для поточного каталогу вбудованих + комплектних команд
- сторінки відповідних каналів/плагінів для поверхонь команд, специфічних для каналів

Формат конфігурації — **JSON5** (дозволені коментарі та завершальні коми). Усі поля необов’язкові — OpenClaw використовує безпечні типові значення, якщо їх не вказано.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на окрему сторінку — див.
[Configuration — channels](/uk/gateway/config-channels) для `channels.*`,
включно зі Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та іншими
вбудованими каналами (автентифікація, контроль доступу, кілька облікових записів, обмеження згадок).

## Типові параметри агента, мультиагентність, сесії та повідомлення

Перенесено на окрему сторінку — див. [Configuration — agents](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, thinking, Heartbeat, пам’ять, медіа, Skills, sandbox)
- `multiAgent.*` (маршрутизація та прив’язки мультиагентності)
- `session.*` (життєвий цикл сесії, Compaction, очищення)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає типове для платформи вікно паузи перед надсиланням транскрипту (`700 ms на macOS і Android, 900 ms на iOS`)

## Інструменти та користувацькі провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів на основі провайдерів і налаштування користувацьких провайдерів / базових URL перенесені на окрему сторінку — див.
[Configuration — tools and custom providers](/uk/gateway/config-tools).

## MCP

Визначення серверів MCP під керуванням OpenClaw розміщуються в `mcp.servers` і
використовуються вбудованим Pi та іншими адаптерами середовища виконання. Команди `openclaw mcp list`,
`show`, `set` і `unset` керують цим блоком без підключення до
цільового сервера під час редагування конфігурації.

```json5
{
  mcp: {
    // Необов’язково. Типове значення: 600000 ms (10 хвилин). Установіть 0, щоб вимкнути видалення під час простою.
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

- `mcp.servers`: іменовані визначення stdio або віддалених серверів MCP для середовищ виконання, які
  надають налаштовані інструменти MCP.
  Віддалені записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` — це рідний для CLI псевдонім, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.sessionIdleTtlMs`: TTL простою для комплектних середовищ MCP, прив’язаних до сесії.
  Одноразові вбудовані запуски запитують очищення після завершення запуску; цей TTL є
  страховкою для довготривалих сесій і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються на гарячу через знищення кешованих середовищ MCP сесії.
  Наступне виявлення/використання інструмента відтворює їх із нової конфігурації, тож вилучені
  записи `mcp.servers` прибираються негайно, а не чекають TTL простою.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI backends](/uk/gateway/cli-backends#bundle-mcp-overlays) для поведінки середовища виконання.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // або plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: необов’язковий список дозволу лише для комплектних Skills (керовані/робочі Skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені Skills (найнижчий пріоритет).
- `install.preferBrew`: якщо `true`, віддавати перевагу інсталяторам Homebrew, коли `brew`
  доступний, перш ніж переходити до інших типів інсталяторів.
- `install.nodeManager`: пріоритет менеджера Node для специфікацій інсталяції `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він комплектний/встановлений.
- `entries.<skillKey>.apiKey`: зручне поле для Skills, які оголошують основну змінну середовища (рядок відкритого тексту або об’єкт SecretRef).

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
- Виявлення приймає нативні плагіни OpenClaw, а також сумісні комплектні пакети Codex і Claude, включно з комплектами Claude стандартного макета без маніфесту.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий список дозволу (завантажуються лише перелічені плагіни). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні плагіна (коли підтримується плагіном).
- `plugins.entries.<id>.env`: мапа змінних середовища на рівні плагіна.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` і ігнорує поля, що змінюють prompt, із застарілого `before_agent_start`, зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hook-ів плагінів і підтримуваних каталогів hook-ів, наданих комплектами.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені некомплектні плагіни можуть читати сирий вміст розмов із типізованих hook-ів, таких як `llm_input`, `llm_output`, `before_agent_finalize` та `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряти цьому плагіну запитувати перевизначення `provider` і `model` для окремого запуску фонових підлеглих агентів.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволу канонічних цілей `provider/model` для довірених перевизначень підлеглих агентів. Використовуйте `"*"`, лише якщо навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений плагіном (перевіряється схемою нативного плагіна OpenClaw, якщо доступна).
- Налаштування облікового запису/середовища виконання для каналів плагінів розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` у маніфесті відповідного плагіна, а не центральним реєстром параметрів OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера веб-отримання Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Використовує як резерв `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілий `tools.web.fetch.firecrawl.apiKey` або змінну середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту скрейпінгу в секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування Dreaming для пам’яті. Див. [Dreaming](/uk/concepts/dreaming) для фаз і порогів.
  - `enabled`: головний перемикач Dreaming (типово `false`).
  - `frequency`: Cron-ритм для кожного повного проходу Dreaming (типово `"0 3 * * *"`).
  - `model`: необов’язкове перевизначення моделі підлеглого агента Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті міститься в [Memory configuration reference](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені комплектні плагіни Claude також можуть додавати типові значення вбудованого Pi з `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати ідентифікатор активного плагіна пам’яті або `"none"`, щоб вимкнути плагіни пам’яті.
- `plugins.slots.contextEngine`: вибрати ідентифікатор активного плагіна рушія контексту; типово `"legacy"`, якщо ви не встановите й не виберете інший рушій.

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
      // dangerouslyAllowPrivateNetwork: true, // вмикайте лише для довіреного доступу до приватної мережі
      // allowPrivateNetwork: true, // застарілий псевдонім
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
- `tabCleanup` очищає відстежувані вкладки основного агента після простою або коли
  сесія перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тож навігація браузера за типових налаштувань залишається суворо обмеженою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте навігації браузера до приватної мережі.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і надалі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі підключення (запуск/зупинка/скидання вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), якщо хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає вам прямий URL WebSocket DevTools.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до перевірки доступності віддаленого й
  `attachOnly` CDP, а також до запитів на відкриття вкладок. Керовані loopback-
  профілі зберігають типові локальні значення CDP.
- Якщо зовнішньо керований сервіс CDP доступний через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw вважатиме порт loopback
  локальним керованим профілем браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися до
  вибраного хоста або через підключений вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на базі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання через CSS-селектори, однофайлові hook-и завантаження,
  відсутність перевизначення тайм-аутів діалогів, відсутність `wait --load networkidle`, а також
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший — у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності websocket CDP після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  запускається успішно, але перевірки готовності випереджають запуск. Обидва значення мають бути
  додатними цілими числами до `120000` мс; некоректні значення конфігурації відхиляються.
- Порядок автовиявлення: типовий браузер, якщо він на базі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- І `browser.executablePath`, і `browser.profiles.<name>.executablePath`
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для профілів `existing-session` на рівні профілю також розгортається з тильдою.
- Служба керування: лише loopback (порт визначається з `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального запуску Chromium (наприклад,
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

- `seamColor`: акцентний колір для chrome нативного UI застосунку (відтінок бульбашки режиму Talk тощо).
- `assistant`: перевизначення ідентичності для Control UI. Використовує ідентичність активного агента як резервну.

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

<Accordion title="Деталі полів Gateway">

- `mode`: `local` (запустити gateway) або `remote` (підключитися до віддаленого gateway). Gateway відмовляється запускатися, якщо не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типове прив’язування `loopback` слухає `127.0.0.1` всередині контейнера. За мостової мережі Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому gateway недосяжний. Використовуйте `--network host` або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: за типових налаштувань обов’язкова. Прив’язки не до loopback вимагають автентифікації gateway. На практиці це означає спільний токен/пароль або reverse proxy з контролем ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер первинного налаштування типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRef), явно задайте `gateway.auth.mode` як `token` або `password`. Запуск і потоки встановлення/відновлення служби завершуються помилкою, коли задано обидва, а режим не вказано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених локальних конфігурацій local loopback; цей варіант навмисно не пропонується в підказках первинного налаштування.
- `gateway.auth.mode: "trusted-proxy"`: делегувати автентифікацію reverse proxy з контролем ідентичності й довіряти заголовкам ідентичності з `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **не-loopback** джерело proxy; reverse proxy на loopback на тому самому хості не задовольняють автентифікацію trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію за заголовком Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації gateway. Цей безтокеновий потік припускає, що хост gateway є довіреним. Типове значення — `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб автентифікації. Застосовується для кожної IP-адреси клієнта та для кожної області автентифікації (спільний секрет і токен пристрою відстежуються окремо). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом невдачі. Тому паралельні хибні спроби від того самого клієнта можуть спрацювати на обмежувачі на другому запиті, а не обидві пройти як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; задайте `false`, якщо ви свідомо хочете також обмежувати localhost-трафік (для тестових конфігурацій або суворих розгортань із proxy).
- Спроби WS-автентифікації з походження браузера завжди обмежуються з вимкненим винятком для loopback (додатковий захист від brute force до localhost із браузера).
- На loopback ці блокування за походженням браузера ізолюються за нормалізованим
  значенням `Origin`, тому повторні невдалі спроби з одного localhost-origin не
  блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, прив’язка loopback) або `funnel` (публічно, вимагає auth).
- `controlUi.allowedOrigins`: явний список дозволених browser-origin для підключень Gateway WebSocket. Обов’язковий, коли очікуються клієнти браузера з origin не-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає резервне визначення origin за заголовком Host для розгортань, що свідомо покладаються на політику origin за Host-заголовком.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійне перевизначення
  середовища процесу на боці клієнта, яке дозволяє plaintext `ws://` до довірених IP
  приватної мережі; типово plaintext, як і раніше, дозволено лише для loopback. Еквівалента в `openclaw.json`
  немає, а конфігурація приватної мережі браузера, наприклад
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнти
  Gateway WebSocket.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують auth gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL зовнішнього APNs relay, який використовують офіційні/TestFlight-збірки iOS після того, як вони публікують у gateway реєстрації на основі relay. Цей URL має збігатися з URL relay, скомпільованим у збірці iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання gateway-to-relay у мілісекундах. Типове значення — `10000`.
- Реєстрації на основі relay делегуються конкретній ідентичності gateway. Спарений застосунок iOS отримує `gateway.identity.get`, включає цю ідентичність до реєстрації relay і передає до gateway дозвіл на надсилання в межах реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові перевизначення середовища для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварійний варіант лише для розробки для loopback HTTP URL relay. URL relay у продакшені мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал моніторингу стану каналів у хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски монітора стану. Типове значення: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета у хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типове значення: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітора стану на канал/обліковий запис у ковзній годині. Типове значення: `10`.
- `channels.<provider>.healthMonitor.enabled`: вимкнення перезапусків монітора стану для окремого каналу зі збереженням глобального монітора увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення на рівні облікового запису для каналів із кількома обліковими записами. Якщо задано, має пріоритет над перевизначенням на рівні каналу.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як резерв лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не вдається розв’язати, розв’язання завершується із закритою відмовою (без маскування резервним віддаленим варіантом).
- `trustedProxies`: IP-адреси reverse proxy, які завершують TLS або вставляють заголовки пересланого клієнта. Указуйте лише proxy, які ви контролюєте. Записи loopback усе ще дійсні для конфігурацій із proxy на тому самому хості/локальним виявленням (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типове значення `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий список дозволених CIDR/IP для автоматичного схвалення першого спарювання вузла пристрою без запитаних областей доступу. Якщо не задано, вимкнено. Це не виконує автоматичне схвалення pairing для operator/browser/Control UI/WebChat і не схвалює автоматично оновлення ролі, області доступу, метаданих або публічного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд вузлів після pairing та оцінки списку дозволу.
- `gateway.tools.deny`: додаткові імена інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий список deny).
- `gateway.tools.allow`: прибирає імена інструментів із типового списку deny.

</Accordion>

### OpenAI-compatible endpoints

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Захист URL-входів Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні списки дозволу трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS-origin, які ви контролюєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька gateway на одному хості з унікальними портами й каталогами стану:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Зручні прапорці: `--dev` (використовує `~/.openclaw-dev` + порт `19001`), `--profile <name>` (використовує `~/.openclaw-<name>`).

Див. [Multiple Gateways](/uk/gateway/multiple-gateways).

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
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, коли явні файли не налаштовано; лише для локального/dev використання.
- `certPath`: шлях файлової системи до файла TLS-сертифіката.
- `keyPath`: шлях файлової системи до файла приватного ключа TLS; зберігайте з обмеженими дозволами.
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
  - `"off"`: ігнорувати живі редагування; зміни вимагають явного перезапуску.
  - `"restart"`: завжди перезапускати процес gateway при зміні конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати гаряче перезавантаження; за потреби перейти до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс очікування завершення поточних операцій перед примусовим перезапуском. Пропустіть його або встановіть `0`, щоб чекати безстроково й періодично журналювати попередження про те, що щось усе ще очікує завершення.

---

## Hooks

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

Auth: `Authorization: Bearer <token>` або `x-openclaw-token: <token>`.
Токени hook у рядку запиту відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` вимагає непорожнього `hooks.token`.
- `hooks.token` має **відрізнятися** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте виділений підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонізований `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping не вимагають цього явного дозволу.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із тіла запиту приймається лише тоді, коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` у mapping, згенеровані шаблоном, вважаються зовнішньо переданими й також вимагають `hooks.allowRequestSessionKey=true`.

<Accordion title="Деталі mapping">

- `match.path` зіставляється з підшляхом після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` зіставляється з полем payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читаються з payload.
- `transform` може вказувати на модуль JS/TS, який повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та traversal відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ідентифікатори повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook-агента без явного `sessionKey`.
- `allowRequestSessionKey`: дозволити викликачам `/hooks/agent` і ключам сесії mapping на основі шаблонів задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Стає обов’язковим, коли будь-який mapping або preset використовує шаблонізований `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово дорівнює `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволена, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте цю маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` так, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібне `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість типового шаблонізованого.

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

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, коли це налаштовано. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
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

- Обслуговує HTML/CSS/JS, які агент може редагувати, і A2UI через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: зберігайте `gateway.bind: "loopback"` (типово).
- Прив’язки не до loopback: маршрути canvas вимагають auth Gateway (token/password/trusted-proxy), так само як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки auth; після pairing і підключення вузла Gateway оголошує URL можливостей у межах вузла для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії вузла й швидко спливають. Резервний варіант на основі IP не використовується.
- Впроваджує клієнт live-reload у HTML, що обслуговується.
- Автоматично створює стартовий `index.html`, якщо каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни вимагають перезапуску gateway.
- Вимкніть live reload для великих каталогів або за помилок `EMFILE`.

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

- `minimal` (типово): пропускає `cliPath` + `sshPort` із TXT-записів.
- `full`: включає `cliPath` + `sshPort`.
- Ім’я хоста типово дорівнює системному імені хоста, якщо воно є дійсною DNS-міткою, інакше використовується `openclaw`. Перевизначте через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує зону unicast DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднуйте з DNS-сервером (рекомендовано CoreDNS) + Tailscale split DNS.

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

- Вбудовані env vars застосовуються лише тоді, коли в env процесу відсутній ключ.
- Файли `.env`: `.env` поточного робочого каталогу + `~/.openclaw/.env` (жоден із них не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний порядок пріоритетів див. у [Environment](/uk/help/environment).

### Підстановка env var

Посилайтеся на env vars у будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте через `$${VAR}` для літерального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є адитивними: значення у відкритому тексті, як і раніше, працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон `id` для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` для `source: "file"`: абсолютний JSON pointer (наприклад, `"/providers/openai/apiKey"`)
- шаблон `id` для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` для `source: "exec"` не мають містити сегментів шляху `.` або `..`, розділених `/` (наприклад, `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання в `auth-profiles.json` включено до покриття розв’язання під час виконання та аудиту.

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

- Провайдер `file` підтримує `mode: "json"` і `mode: "singleValue"` (у режимі singleValue `id` має бути `"value"`).
- Шляхи провайдерів file і exec завершуються з відмовою за закритим принципом, коли перевірка ACL Windows недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` вимагає абсолютний шлях `command` і використовує payload протоколу через stdin/stdout.
- Типово шляхи команд через symlink відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи symlink із перевіркою розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довірених каталогів застосовується до розв’язаного цільового шляху.
- Середовище дочірнього процесу `exec` типово мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв’язуються під час активації в моментальний знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Під час активації застосовується фільтрація активної поверхні: нерозв’язані посилання на увімкнених поверхнях призводять до помилки запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

---

## Сховище auth

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
- Профілі режиму OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані профілю auth на основі SecretRef.
- Статичні облікові дані середовища виконання надходять із розв’язаних моментальних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються при виявленні.
- Застарілий імпорт OAuth — з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Поведінка секретів під час виконання та інструменти `audit/configure/apply`: [Secrets Management](/uk/gateway/secrets).

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

- `billingBackoffHours`: базовий backoff у годинах, коли профіль завершується помилкою через справжні
  помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг
  усе ще може потрапити сюди навіть у відповідях `401`/`403`, але зіставлення
  тексту, специфічного для провайдера, залишається в межах провайдера, якому воно належить (наприклад OpenRouter
  `Key limit exceeded`). Повторювані повідомлення HTTP `402` про usage-window або
  ліміти витрат організації/робочого простору залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин backoff для білінгу за провайдером.
- `billingMaxHours`: межа в годинах для експоненційного зростання billing backoff (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для високовпевнених збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: межа в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, яке використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для перевантажених помилок перед переходом на резервну модель (типово: `1`). Сюди потрапляють форми зайнятості провайдера, такі як `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для помилок rate-limit перед переходом на резервну модель (типово: `1`). Цей кошик rate-limit включає текстові форми провайдерів на кшталт `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `consoleLevel` підвищується до `debug`, коли використовується `--verbose`.
- `maxFileBytes`: максимальний розмір активного файла журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 MB). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування best-effort для виводу в консоль, файлів журналу, записів журналу OTLP і збереженого тексту транскрипту сесії.

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

- `enabled`: головний перемикач для виводу інструментування (типово: `true`).
- `flags`: масив рядків прапорців, що вмикають цільовий вивід журналів (підтримує шаблони з підстановками, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для виведення попереджень про завислі сесії, поки сесія залишається у стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. у [OpenTelemetry export](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові OTLP-кінцеві точки для окремих сигналів. Якщо задано, вони перевизначають `otel.endpoint` лише для відповідного сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва служби для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт трасувань, метрик або журналів.
- `otel.sampleRate`: частота вибірки трасувань `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання телеметрії в мс.
- `otel.captureContent`: явний дозвіл на захоплення сирого вмісту для атрибутів span OTEL. Типово вимкнено. Логічне значення `true` захоплює вміст повідомлень/інструментів, окрім system; форма об’єкта дозволяє явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: перемикач середовища для найновіших експериментальних атрибутів провайдера span GenAI. Типово spans зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: перемикач середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. У такому разі OpenClaw пропускає запуск/завершення SDK, що належить плагіну, зберігаючи активними діагностичні слухачі.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища для окремих сигналів, які використовуються, коли відповідний ключ конфігурації не задано.
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

- `channel`: канал випуску для інсталяцій npm/git — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для пакетних інсталяцій (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням stable-каналу (типово: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання stable-каналу в годинах (типово: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки beta-каналу, у годинах (типово: `1`; максимум: `24`).

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

- `enabled`: глобальний перемикач функції ACP (типово: `true`; установіть `false`, щоб приховати можливості dispatch і spawn ACP).
- `dispatch.enabled`: незалежний перемикач для dispatch ходів сесій ACP (типово: `true`). Установіть `false`, щоб зберегти доступність команд ACP, але заблокувати виконання.
- `backend`: ідентифікатор типового backend середовища виконання ACP (має відповідати зареєстрованому плагіну середовища виконання ACP).
  Якщо задано `plugins.allow`, включіть ідентифікатор backend-плагіна (наприклад `acpx`), інакше комплектний типовий плагін не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли spawns не задають явну ціль.
- `allowedAgents`: список дозволу ідентифікаторів агентів, дозволених для сесій середовища виконання ACP; порожній означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед розбиттям проєкції потокового блока.
- `stream.repeatSuppression`: придушувати повторювані рядки status/tool на хід (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потік поступово; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу помічника, що проєктується за один хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлень ACP.
- `stream.tagVisibility`: запис назв тегів у логічні перевизначення видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для воркерів сесій ACP до можливого очищення.
- `runtime.installCommand`: необов’язкова команда інсталяції, яку слід виконати під час bootstrap середовища виконання ACP.

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

- `cli.banner.taglineMode` керує стилем tagline банера:
  - `"random"` (типово): ротаційні кумедні/сезонні tagline.
  - `"default"`: фіксований нейтральний tagline (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту tagline (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише tagline), задайте env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Метадані, які записуються потоками керованого налаштування CLI (`onboard`, `configure`, `doctor`):

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

Див. поля ідентичності `agents.list` у [Agent defaults](/uk/gateway/config-agents#agent-defaults).

---

## Bridge (застаріле, вилучено)

Поточні збірки більше не містять TCP bridge. Nodes підключаються через Gateway WebSocket. Ключі `bridge.*` більше не є частиною схеми конфігурації (валідація завершується помилкою, доки їх не вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

<Accordion title="Застаріла конфігурація bridge (історична довідка)">

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

- `sessionRetention`: як довго зберігати завершені сесії ізольованих запусків cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. Типове значення: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файла журналу одного запуску (`cron/runs/<jobId>.jsonl`) перед очищенням. Типове значення: `2_000_000` байтів.
- `runLog.keepLines`: кількість найновіших рядків, які зберігаються під час очищення журналу запуску. Типове значення: `2000`.
- `webhookToken`: bearer-токен, що використовується для доставки POST до cron Webhook (`delivery.mode = "webhook"`); якщо пропущено, заголовок auth не надсилається.
- `webhook`: застарілий резервний URL Webhook (http/https), який використовується лише для збережених завдань, у яких усе ще є `notify: true`.

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

- `maxAttempts`: максимальна кількість повторних спроб для одноразових завдань при тимчасових помилках (типово: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок backoff у мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, які запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових cron-завдань. Періодичні завдання використовують окрему обробку помилок.

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
- `after`: кількість послідовних збоїв перед спрацюванням сповіщення (додатне ціле число, мінімум: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `includeSkipped`: враховувати послідовні пропущені запуски в поріг сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на backoff помилок виконання.
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` надсилає POST на налаштований Webhook.
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

- Типове місце призначення для сповіщень про збої cron для всіх завдань.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних цілі.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL Webhook. Обов’язкове для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` на рівні завдання перевизначає це глобальне типове значення.
- Якщо не задано ні глобальне, ні конкретне для завдання місце призначення збою, завдання, які вже доставляють через `announce`, у разі збою повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [background tasks](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Заповнювачі шаблону, що розгортаються в `tools.media.models[].args`:

| Змінна            | Опис                                              |
| ----------------- | ------------------------------------------------- |
| `{{Body}}`        | Повне тіло вхідного повідомлення                  |
| `{{RawBody}}`     | Сире тіло (без обгорток історії/відправника)      |
| `{{BodyStripped}}`| Тіло без згадок групи                             |
| `{{From}}`        | Ідентифікатор відправника                         |
| `{{To}}`          | Ідентифікатор призначення                         |
| `{{MessageSid}}`  | Ідентифікатор повідомлення каналу                 |
| `{{SessionId}}`   | UUID поточної сесії                               |
| `{{IsNewSession}}`| `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`    | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`   | Локальний шлях до медіа                           |
| `{{MediaType}}`   | Тип медіа (image/audio/document/…)                |
| `{{Transcript}}`  | Транскрипт аудіо                                  |
| `{{Prompt}}`      | Розв’язаний prompt медіа для записів CLI          |
| `{{MaxChars}}`    | Розв’язана максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`    | `"direct"` або `"group"`                          |
| `{{GroupSubject}}`| Тема групи (best effort)                          |
| `{{GroupMembers}}`| Попередній перегляд учасників групи (best effort) |
| `{{SenderName}}`  | Відображуване ім’я відправника (best effort)      |
| `{{SenderE164}}`  | Номер телефону відправника (best effort)          |
| `{{Provider}}`    | Підказка провайдера (whatsapp, telegram, discord тощо) |

---

## Включення конфігурації (`$include`)

Розділяйте конфігурацію на кілька файлів:

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

- Один файл: замінює об’єкт-контейнер.
- Масив файлів: глибоко зливається за порядком (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: розв’язуються відносно файла, що включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми/`../` дозволені лише тоді, коли після розв’язання вони все одно залишаються в межах цієї межі.
- Записи під керуванням OpenClaw, які змінюють лише один розділ верхнього рівня, підтриманий включенням одного файла, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` недоторканим.
- Кореневі включення, масиви включень і включення з сусідніми перевизначеннями доступні лише для читання для записів під керуванням OpenClaw; такі записи завершуються із закритою відмовою замість сплощення конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних включень.

---

_Пов’язане: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Configuration](/uk/gateway/configuration)
- [Configuration examples](/uk/gateway/configuration-examples)
