---
read_when:
    - Вам потрібні точні семантики полів конфігурації або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник із конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-04-25T17:32:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0578d9e78c063f579922498b993a2fd4398c66dc01d1e89ccaa56b777467c2
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Основний довідник із конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Configuration](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і містить посилання назовні, коли підсистема має власний глибший довідник. Каталоги команд, що належать каналам і Plugin, а також детальні параметри пам’яті/QMD розміщені на окремих сторінках, а не на цій.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, із об’єднаними метаданими bundled/plugin/channel, якщо вони доступні
- `config.schema.lookup` повертає один вузол схеми з прив’язкою до шляху для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації щодо поточної поверхні схеми

Окремі поглиблені довідники:

- [Довідник із конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Слеш-команди](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідних каналів/Plugin для поверхонь команд, специфічних для каналу

Формат конфігурації — **JSON5** (дозволені коментарі та кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, якщо їх не вказано.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на окрему сторінку — див.
[Configuration — channels](/uk/gateway/config-channels) для `channels.*`,
зокрема для Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, обмеження згадок).

## Значення агентів за замовчуванням, multi-agent, сесії та повідомлення

Перенесено на окрему сторінку — див.
[Configuration — agents](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, thinking, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (маршрутизація та прив’язки multi-agent)
- `session.*` (життєвий цикл сесії, compaction, очищення)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає стандартне для платформи вікно паузи перед надсиланням транскрипту (`700 ms на macOS і Android, 900 ms на iOS`)

## Інструменти та власні провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів із підтримкою провайдерів і налаштування власних провайдерів / base-URL перенесені на окрему сторінку — див.
[Configuration — tools and custom providers](/uk/gateway/config-tools).

## MCP

Визначення MCP-серверів, керованих OpenClaw, розміщені в `mcp.servers` і
використовуються вбудованим Pi та іншими адаптерами середовища виконання. Команди `openclaw mcp list`,
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

- `mcp.servers`: іменовані визначення stdio або віддалених MCP-серверів для середовищ виконання, які
  надають налаштовані MCP-інструменти.
- `mcp.sessionIdleTtlMs`: idle TTL для bundled MCP-середовищ виконання з областю дії сесії.
  Одноразові вбудовані запуски запитують очищення наприкінці виконання; цей TTL є резервним механізмом для
  довготривалих сесій і майбутніх викликів.
- Зміни в `mcp.*` застосовуються гарячим способом через знищення кешованих MCP-середовищ виконання сесії.
  Наступне виявлення/використання інструмента створює їх знову з нової конфігурації, тому видалені
  записи `mcp.servers` прибираються негайно, а не чекають idle TTL.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI backends](/uk/gateway/cli-backends#bundle-mcp-overlays) щодо поведінки середовища виконання.

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

- `allowBundled`: необов’язковий список дозволів лише для bundled skills (керовані/workspace skills не зачіпаються).
- `load.extraDirs`: додаткові спільні кореневі каталоги skills (найнижчий пріоритет).
- `install.preferBrew`: якщо `true`, віддає перевагу інсталяторам Homebrew, коли `brew`
  доступний, перш ніж переходити до інших типів інсталятора.
- `install.nodeManager`: налаштування менеджера Node для `metadata.openclaw.install`
  specs (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручне поле для skills, які оголошують основну змінну середовища (простий рядок або об’єкт SecretRef).

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

- Завантажуються з `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, а також із `plugins.load.paths`.
- Виявлення підтримує нативні Plugins OpenClaw, а також сумісні пакети Codex і Claude, включно з пакетами Claude стандартного макета без маніфесту.
- **Зміни конфігурації потребують перезапуску Gateway.**
- `allow`: необов’язковий список дозволів (завантажуються лише перелічені Plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API key на рівні Plugin (коли це підтримується Plugin).
- `plugins.entries.<id>.env`: карта змінних середовища в області Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` та ігнорує поля, що змінюють prompt, із застарілого `before_agent_start`, водночас зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hooks Plugin і підтримуваних каталогів hooks, наданих пакетами.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені небандловані Plugins можуть читати необроблений вміст розмови з типізованих hooks, таких як `llm_input`, `llm_output` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряє цьому Plugin запитувати перевизначення `provider` і `model` для окремих запусків фонових subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволів канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений Plugin (валідується схемою нативного Plugin OpenClaw, якщо вона доступна).
- Налаштування облікових записів/середовища виконання для каналів Plugin розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфесту відповідного Plugin, а не центральним реєстром параметрів OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: параметри провайдера web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (підтримує SecretRef). Використовує як резервне джерело `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілий `tools.web.fetch.firecrawl.apiKey` або змінну середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (за замовчуванням: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст сторінок (за замовчуванням: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (за замовчуванням: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту scraping у секундах (за замовчуванням: `60`).
- `plugins.entries.xai.config.xSearch`: параметри xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: параметри memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (за замовчуванням `false`).
  - `frequency`: Cron-розклад для кожного повного циклу dreaming (за замовчуванням `"0 3 * * *"`).
  - політика фаз і пороги є деталями реалізації (не є користувацькими ключами конфігурації).
- Повна конфігурація пам’яті міститься в [Довіднику з конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Plugins-пакети Claude також можуть додавати вбудовані значення Pi за замовчуванням із `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як необроблені патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати id активного Plugin пам’яті або `"none"`, щоб вимкнути Plugins пам’яті.
- `plugins.slots.contextEngine`: вибрати id активного Plugin рушія контексту; за замовчуванням `"legacy"`, якщо ви не встановили та не вибрали інший рушій.
- `plugins.installs`: метадані встановлення, керовані CLI, які використовує `openclaw plugins update`.
  - Містить `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Розглядайте `plugins.installs.*` як керований стан; віддавайте перевагу командам CLI замість ручного редагування.

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
- `tabCleanup` звільняє відстежувані вкладки основного агента після простою або коли
  сесія перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тому навігація браузера за замовчуванням залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте навігації браузера в приватній мережі.
- У суворому режимі кінцеві точки віддалених профілів CDP (`profiles.*.cdpUrl`) підлягають такому самому блокуванню приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі підключення (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL DevTools WebSocket.
- Якщо CDP-служба, якою керує зовнішня система, доступна через local loopback, установіть
  для цього профілю `attachOnly: true`; інакше OpenClaw розглядатиме порт loopback як
  локальний профіль браузера під керуванням і може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися
  до вибраного хоста або через підключений вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на базі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання через CSS-селектори, hooks для завантаження
  одного файла, без перевизначення тайм-аутів діалогів, без `wait --load networkidle`, а також без
  `responsebody`, експорту PDF, перехоплення завантажень чи пакетних дій.
- Локальні профілі `openclaw` під керуванням автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Локальні профілі під керуванням можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні профілі під керуванням використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу й `browser.localCdpReadyTimeoutMs` для готовності CDP websocket
  після запуску. Збільшуйте їх на повільніших хостах, де Chrome успішно запускається, але
  перевірки готовності випереджають завершення запуску.
- Порядок автовиявлення: браузер за замовчуванням, якщо на базі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` приймає `~` для домашнього каталогу вашої ОС.
- Служба керування: лише loopback (порт визначається з `gateway.port`, за замовчуванням `18791`).
- `extraArgs` додає додаткові прапорці запуску до старту локального Chromium (наприклад,
  `--disable-gpu`, розмір вікна або налагоджувальні прапорці).

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

- `seamColor`: колір акценту для chrome UI нативного застосунку (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення ідентичності для Control UI. Якщо не задано, використовується ідентичність активного агента.

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
- `bind`: `auto`, `loopback` (за замовчуванням), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: стандартний bind `loopback` слухає `127.0.0.1` усередині контейнера. За мостової мережі Docker (`-p 18789:18789`) трафік надходить через `eth0`, тому gateway недоступний. Використовуйте `--network host`, або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: за замовчуванням обов’язкова. Прив’язки не до loopback потребують auth gateway. На практиці це означає спільний token/password або reverse proxy з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер onboarding за замовчуванням генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRef), явно задайте `gateway.auth.mode` як `token` або `password`. Під час запуску та у потоках встановлення/відновлення сервісу виникає помилка, якщо налаштовано обидва, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без auth. Використовуйте лише для довірених локальних налаштувань local loopback; навмисно не пропонується в запитах onboarding.
- `gateway.auth.mode: "trusted-proxy"`: делегує auth reverse proxy з урахуванням ідентичності й довіряє заголовкам ідентичності від `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **не-loopback** джерело proxy; reverse proxy loopback на тому ж хості не задовольняють auth trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти auth для Control UI/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю auth через заголовки Tailscale; вони дотримуються звичайного режиму HTTP auth gateway. Цей безтокеновий потік передбачає, що хост gateway є довіреним. За замовчуванням `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб auth. Застосовується для кожної IP-адреси клієнта та для кожної області auth (спільний секрет і device-token відстежуються окремо). Заблоковані спроби повертають `429` + `Retry-After`.
  - В асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом невдачі. Тому одночасні помилкові спроби від того самого клієнта можуть спровокувати спрацювання обмежувача на другому запиті, замість того щоб обидві пройшли наввипередки як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` за замовчуванням має значення `true`; задайте `false`, якщо свідомо хочете також обмежувати трафік localhost (для тестових налаштувань або суворих розгортань proxy).
- Спроби WS auth із походження браузера завжди обмежуються з вимкненим винятком для loopback (додатковий захист від brute force localhost із браузера).
- На loopback ці блокування для браузерного походження ізольовані за нормалізованим значенням `Origin`,
  тож повторні невдачі з одного localhost origin не блокують автоматично
  інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind loopback) або `funnel` (публічний, потребує auth).
- `controlUi.allowedOrigins`: явний список дозволених browser-origin для підключень Gateway WebSocket. Обов’язковий, коли очікуються клієнти браузера не з loopback origins.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає резервне використання origin із заголовка Host для розгортань, що навмисно покладаються на політику origin заголовка Host.
- `remote.transport`: `ssh` (за замовчуванням) або `direct` (ws/wss). Для `direct`, `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: клієнтське аварійне перевизначення через змінну середовища процесу,
  яке дозволяє незашифрований `ws://` до довірених IP-адрес приватної мережі;
  за замовчуванням незашифрований режим залишається лише для loopback. Еквівалента в
  `openclaw.json` немає, а конфігурація приватної мережі браузера, така як
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнтів
  WebSocket Gateway.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують auth gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL зовнішнього APNs relay, який використовують офіційні/TestFlight збірки iOS після публікації реєстрацій на основі relay до gateway. Цей URL має збігатися з URL relay, скомпільованим у збірку iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання gateway-to-relay у мілісекундах. За замовчуванням `10000`.
- Реєстрації на основі relay делегуються конкретній ідентичності gateway. Спарений застосунок iOS отримує `gateway.identity.get`, включає цю ідентичність до реєстрації relay і передає gateway дозвіл на надсилання в області цієї реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові перевизначення через env для конфігурації relay вище.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварійний режим лише для розробки, який дозволяє loopback HTTP URL для relay. У production URL relay мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал монітора стану каналів у хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски монітора стану. За замовчуванням: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета у хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. За замовчуванням: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітора стану на канал/обліковий запис за ковзну годину. За замовчуванням: `10`.
- `channels.<provider>.healthMonitor.enabled`: відмова від перезапусків монітора стану для окремого каналу за збереження глобального монітора увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для окремого облікового запису в багатoоблікових каналах. Якщо задано, має пріоритет над перевизначенням на рівні каналу.
- Шляхи викликів локального gateway можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується в закритий бік (без маскування резервним `remote`).
- `trustedProxies`: IP-адреси reverse proxy, які завершують TLS або вставляють заголовки пересланого клієнта. Перелічуйте лише proxy, які ви контролюєте. Записи loopback лишаються допустимими для налаштувань proxy на тому самому хості/визначення локальності (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять запити loopback придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо відсутній `X-Forwarded-For`. За замовчуванням `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий список дозволених CIDR/IP для автоматичного схвалення першого спарювання пристрою node без запитаних областей доступу. Якщо не задано, вимкнено. Це не схвалює автоматично pairing для operator/browser/Control UI/WebChat і не схвалює автоматично оновлення ролі, області доступу, метаданих або публічного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд node після pairing і оцінювання списку дозволів.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює стандартний список deny).
- `gateway.tools.allow`: видаляє назви інструментів зі стандартного списку deny HTTP.

</Accordion>

### Кінцеві точки, сумісні з OpenAI

- Chat Completions: вимкнено за замовчуванням. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення безпеки URL-входу для Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні списки дозволів трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення безпеки відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS origins, якими ви керуєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька gateway на одному хості з унікальними портами та каталогами стану:

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

- `enabled`: вмикає завершення TLS на слухачі gateway (HTTPS/WSS) (за замовчуванням: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, якщо явні файли не налаштовано; лише для local/dev.
- `certPath`: шлях у файловій системі до файла сертифіката TLS.
- `keyPath`: шлях у файловій системі до файла приватного ключа TLS; обмежуйте доступ правами.
- `caPath`: необов’язковий шлях до набору CA для перевірки клієнта або користувацьких ланцюжків довіри.

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
  - `"off"`: ігнорувати зміни в реальному часі; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес gateway при зміні конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (за замовчуванням): спочатку спробувати hot reload; за потреби перейти до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс для очікування операцій, що ще виконуються, перед примусовим перезапуском. Не задавайте або встановіть `0`, щоб чекати необмежено довго й періодично логувати попередження про те, що щось усе ще очікує.

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
Токени hooks у рядку запиту відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` потребує непорожній `hooks.token`.
- `hooks.token` має **відрізнятися** від `gateway.auth.token`; повторне використання token Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping цього opt-in не потребують.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з тіла запиту приймається лише тоді, коли `hooks.allowRequestSessionKey=true` (за замовчуванням: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` у mapping, згенеровані шаблоном, розглядаються як зовнішньо надані й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Деталі mapping">

- `match.path` відповідає підшляху після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` відповідає полю payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читаються з payload.
- `transform` може вказувати на модуль JS/TS, що повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та вихід за межі каталогу відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ID повертаються до стандартного.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або не задано = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook agent без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликам `/hooks/agent` і ключам сесій mapping, керованим шаблонами, задавати `sessionKey` (за замовчуванням: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Стає обов’язковим, коли будь-який mapping або preset використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; значення `channel` за замовчуванням — `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволена, якщо каталог моделей задано).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте цю маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібне `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість стандартного шаблонного.

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

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, якщо це налаштовано. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
- Не запускайте окремий `gog gmail watch serve` паралельно з Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Обслуговує HTML/CSS/JS і A2UI, які може редагувати агент, через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (за замовчуванням).
- Для bind не до loopback: маршрути canvas потребують auth Gateway (token/password/trusted-proxy), як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки auth; після pairing і підключення node Gateway рекламує URL можливостей в області node для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії node і швидко спливають. Резервний варіант на основі IP не використовується.
- Впроваджує клієнт live-reload у HTML, що обслуговується.
- Автоматично створює початковий `index.html`, якщо каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
- Вимкніть live reload для великих каталогів або при помилках `EMFILE`.

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

- `minimal` (за замовчуванням): не включає `cliPath` + `sshPort` до TXT-записів.
- `full`: включає `cliPath` + `sshPort`.
- Ім’я хоста за замовчуванням — `openclaw`. Перевизначається через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує зону unicast DNS-SD у `~/.openclaw/dns/`. Для міжмережевого виявлення поєднуйте з DNS-сервером (рекомендується CoreDNS) і split DNS Tailscale.

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

- Вбудовані змінні середовища застосовуються лише тоді, коли в середовищі процесу бракує цього ключа.
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний пріоритет див. у [Environment](/uk/help/environment).

### Підстановка змінних середовища

Посилайтеся на змінні середовища в будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте через `$${VAR}` для буквального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є адитивними: прості текстові значення й далі працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон `id` для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон `id` для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` для `source: "exec"` не повинні містити сегментів шляху `.` або `..`, розділених `/` (наприклад, `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання в `auth-profiles.json` включено до розв’язання під час виконання та до покриття аудитом.

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
- Шляхи провайдерів file та exec завершуються fail-closed, якщо перевірка Windows ACL недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` вимагає абсолютний шлях `command` і використовує payloads протоколу через stdin/stdout.
- За замовчуванням шляхи команд-символічних посилань відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи symlink із перевіркою розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка trusted-dir застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` за замовчуванням мінімальне; явно передавайте потрібні змінні через `passEnv`.
- Посилання на секрети розв’язуються під час активації в snapshot у пам’яті, а далі шляхи запитів читають лише цей snapshot.
- Під час активації застосовується фільтрація активної поверхні: нерозв’язані посилання на увімкнених поверхнях спричиняють збій запуску/перезавантаження, а неактивні поверхні пропускаються з діагностикою.

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
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані профілю auth на основі SecretRef.
- Статичні облікові дані під час виконання надходять із розв’язаних snapshot у пам’яті; застарілі статичні записи `auth.json` очищаються під час виявлення.
- Застарілі імпорти OAuth з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Поведінка secrets під час виконання та інструменти `audit/configure/apply`: [Керування секретами](/uk/gateway/secrets).

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

- `billingBackoffHours`: базова затримка повторної спроби в годинах, коли профіль зазнає помилки через справжні
  помилки білінгу/недостатнього кредиту (за замовчуванням: `5`). Явний текст про білінг
  усе ще може потрапити сюди навіть для відповідей `401`/`403`, але
  зіставлення тексту, специфічні для провайдера, залишаються в межах провайдера,
  якому вони належать (наприклад, OpenRouter
  `Key limit exceeded`). Повторювані вікна використання HTTP `402` або
  повідомлення про ліміт витрат організації/робочого простору залишаються в гілці `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення в годинах для затримки білінгу за провайдером.
- `billingMaxHours`: максимальна межа в годинах для експоненційного зростання затримки білінгу (за замовчуванням: `24`).
- `authPermanentBackoffMinutes`: базова затримка в хвилинах для збоїв `auth_permanent` із високою впевненістю (за замовчуванням: `10`).
- `authPermanentMaxMinutes`: максимальна межа в хвилинах для зростання затримки `auth_permanent` (за замовчуванням: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників затримки (за замовчуванням: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок перевантаження перед переходом до резервної моделі (за замовчуванням: `1`). Сюди потрапляють форми на кшталт `ModelNotReadyException`, що означають зайнятість провайдера.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (за замовчуванням: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок rate-limit перед переходом до резервної моделі (за замовчуванням: `1`). До цього кошика rate-limit входить текст у формі провайдерів, наприклад `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- Установіть `logging.file` для сталого шляху.
- `consoleLevel` підвищується до `debug` з `--verbose`.
- `maxFileBytes`: максимальний розмір файла журналу в байтах, після якого запис пригнічується (додатне ціле число; за замовчуванням: `524288000` = 500 MB). Для production-розгортань використовуйте зовнішню ротацію журналів.

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

- `enabled`: головний перемикач для виводу інструментування (за замовчуванням: `true`).
- `flags`: масив рядків прапорців, що вмикають цільовий вивід журналу (підтримуються wildcard, наприклад `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: пороговий вік у мс для виведення попереджень про завислі сесії, поки сесія лишається в стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (за замовчуванням: `false`).
- `otel.endpoint`: URL collector для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (за замовчуванням) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт trace, metrics або logs.
- `otel.sampleRate`: частота вибірки trace `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання telemetry у мс.
- `otel.captureContent`: opt-in захоплення необробленого вмісту для атрибутів span OTEL. За замовчуванням вимкнено. Логічне значення `true` захоплює вміст повідомлень/інструментів, окрім системного; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OPENCLAW_OTEL_PRELOADED=1`: перемикач середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/завершення SDK, що належить Plugin, водночас зберігаючи активними слухачі діагностики.
- `cacheTrace.enabled`: журналювати snapshots trace кешу для вбудованих запусків (за замовчуванням: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL trace кешу (за замовчуванням: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається до виводу trace кешу (усі за замовчуванням: `true`).

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

- `channel`: канал релізів для встановлень npm/git — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (за замовчуванням: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для пакетних встановлень (за замовчуванням: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням у каналі stable (за замовчуванням: `6`; макс.: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання для каналу stable в годинах (за замовчуванням: `12`; макс.: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки каналу beta, у годинах (за замовчуванням: `1`; макс.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
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

- `enabled`: глобальний feature gate ACP (за замовчуванням: `false`).
- `dispatch.enabled`: незалежний gate для диспетчеризації ходів сесії ACP (за замовчуванням: `true`). Установіть `false`, щоб команди ACP залишалися доступними, але виконання блокувалося.
- `backend`: id стандартного runtime backend ACP (має збігатися із зареєстрованим runtime Plugin ACP).
- `defaultAgent`: резервний id цільового агента ACP, коли spawn не задає явну ціль.
- `allowedAgents`: список дозволених id агентів для runtime-сесій ACP; порожній означає відсутність додаткового обмеження.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір chunk перед поділом проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів на хід (за замовчуванням: `true`).
- `stream.deliveryMode`: `"live"` передає потік поступово; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: розділювач перед видимим текстом після прихованих подій інструментів (за замовчуванням: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу помічника, що проєктується за хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлень ACP.
- `stream.tagVisibility`: запис назв тегів із логічними перевизначеннями видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для workers сесій ACP до моменту допустимого очищення.
- `runtime.installCommand`: необов’язкова команда встановлення для запуску під час bootstrap середовища виконання ACP.

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
  - `"random"` (за замовчуванням): змінні кумедні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (назва/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), задайте env `OPENCLAW_HIDE_BANNER=1`.

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

Див. поля ідентичності `agents.list` у [Значення агентів за замовчуванням](/uk/gateway/config-agents#agent-defaults).

---

## Bridge (застарілий, видалений)

Поточні збірки більше не містять TCP bridge. Nodes підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною схеми конфігурації (валідація завершиться помилкою, доки їх не буде видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

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
    maxConcurrentRuns: 2,
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

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запусків cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. За замовчуванням: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файла журналу на запуск (`cron/runs/<jobId>.jsonl`) перед очищенням. За замовчуванням: `2_000_000` байтів.
- `runLog.keepLines`: кількість найновіших рядків, які зберігаються, коли спрацьовує очищення run-log. За замовчуванням: `2000`.
- `webhookToken`: bearer token, що використовується для доставки cron webhook POST (`delivery.mode = "webhook"`); якщо не задано, заголовок auth не надсилається.
- `webhook`: застарілий резервний URL webhook (http/https), що використовується лише для збережених завдань, у яких і далі є `notify: true`.

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

- `maxAttempts`: максимальна кількість повторів для одноразових завдань при тимчасових помилках (за замовчуванням: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок backoff у мс для кожної спроби повтору (за замовчуванням: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, що запускають повтори — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Не задавайте, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових cron jobs. Повторювані jobs використовують окрему обробку збоїв.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: увімкнути сповіщення про збої для cron jobs (за замовчуванням: `false`).
- `after`: кількість послідовних збоїв перед спрацюванням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого job (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` виконує POST на налаштований webhook.
- `accountId`: необов’язковий id облікового запису або каналу для обмеження доставки.

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

- Стандартне призначення для сповіщень про збої cron у всіх jobs.
- `mode`: `"announce"` або `"webhook"`; за замовчуванням `"announce"`, коли є достатньо цільових даних.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL webhook. Обов’язкове для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` на рівні job перевизначає це глобальне значення за замовчуванням.
- Коли не задано ні глобального, ні окремого призначення збою для job, jobs, які вже доставляють через `announce`, при збої використовують як резервний варіант цю основну ціль announce.
- `delivery.failureDestination` підтримується лише для jobs із `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` job не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблонів моделі медіа

Заповнювачі шаблонів, що розгортаються в `tools.media.models[].args`:

| Variable           | Опис                                                |
| ------------------ | --------------------------------------------------- |
| `{{Body}}`         | Повний текст вхідного повідомлення                  |
| `{{RawBody}}`      | Сирий текст (без обгорток історії/відправника)      |
| `{{BodyStripped}}` | Текст без згадок групи                              |
| `{{From}}`         | Ідентифікатор відправника                           |
| `{{To}}`           | Ідентифікатор призначення                           |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                   |
| `{{SessionId}}`    | UUID поточної сесії                                 |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                  |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                           |
| `{{MediaPath}}`    | Локальний шлях до медіа                             |
| `{{MediaType}}`    | Тип медіа (image/audio/document/…)                  |
| `{{Transcript}}`   | Транскрипт аудіо                                    |
| `{{Prompt}}`       | Розв’язаний prompt медіа для записів CLI            |
| `{{MaxChars}}`     | Розв’язана максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                            |
| `{{GroupSubject}}` | Тема групи (best effort)                            |
| `{{GroupMembers}}` | Попередній список учасників групи (best effort)     |
| `{{SenderName}}`   | Відображуване ім’я відправника (best effort)        |
| `{{SenderE164}}`   | Номер телефону відправника (best effort)            |
| `{{Provider}}`     | Підказка провайдера (whatsapp, telegram, discord тощо) |

---

## Include конфігурації (`$include`)

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
- Масив файлів: глибоко зливається по порядку (пізніші перевизначають раніші).
- Ключі-сусіди: зливаються після include (перевизначають включені значення).
- Вкладені include: до 10 рівнів углиб.
- Шляхи: розв’язуються відносно файла, що включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми/`../` дозволені лише тоді, коли після розв’язання вони все одно залишаються в межах цього кордону.
- Записи, якими керує OpenClaw і які змінюють лише одну секцію верхнього рівня, підкріплену include одного файла, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` незмінним.
- Кореневі include, масиви include та include з перевизначеннями сусідніх ключів є лише для читання для записів під керуванням OpenClaw; такі записи завершуються fail-closed замість сплощення конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок парсингу та циклічних include.

---

_Пов’язане: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Configuration](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
