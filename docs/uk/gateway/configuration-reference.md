---
read_when:
    - Вам потрібні точні семантики конфігурації на рівні полів або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації channel, model, Gateway або tool
summary: Довідник із конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-04-25T19:33:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f9941fc10dd1929d62354fb604534e0526de8098de2484f8e3a571fd0c65082
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Базовий довідник із конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Configuration](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і дає посилання назовні, коли підсистема має власний детальніший довідник. Каталоги команд, що належать channel і plugin, а також детальні параметри memory/QMD винесено на окремі сторінки, а не на цю.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, яка використовується для валідації та Control UI, із доданими метаданими bundled/plugin/channel, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми з прив’язкою до шляху для інструментів детального перегляду
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації відносно поточної поверхні схеми

Окремі детальні довідники:

- [Memory configuration reference](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/uk/tools/slash-commands) для поточного каталогу вбудованих + bundled команд
- сторінки channel/plugin-власників для channel-специфічних поверхонь команд

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, якщо їх пропущено.

---

## Channels

Ключі конфігурації для кожного channel перенесено на окрему сторінку — див.
[Configuration — channels](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled channels (автентифікація, контроль доступу, кілька облікових записів, керування згадками).

## Типові значення agent, multi-agent, session і messages

Перенесено на окрему сторінку — див.
[Configuration — agents](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робоча область, model, thinking, heartbeat, memory, медіа, skills, sandbox)
- `multiAgent.*` (маршрутизація та прив’язки multi-agent)
- `session.*` (життєвий цикл session, compaction, очищення)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає типове для платформи вікно паузи перед надсиланням транскрипту (`700 ms на macOS і Android, 900 ms на iOS`)

## Tools і custom providers

Політика tool, експериментальні перемикачі, конфігурація tool на основі provider і налаштування custom
provider / base-URL перенесено на окрему сторінку — див.
[Configuration — tools and custom providers](/uk/gateway/config-tools).

## MCP

Визначення MCP server, якими керує OpenClaw, розміщуються в `mcp.servers` і
використовуються вбудованим Pi та іншими адаптерами середовища виконання. Команди `openclaw mcp list`,
`show`, `set` і `unset` керують цим блоком без підключення до
цільового server під час редагування конфігурації.

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

- `mcp.servers`: іменовані визначення stdio або віддалених MCP server для середовищ виконання, які
  надають налаштовані MCP tool.
- `mcp.sessionIdleTtlMs`: idle TTL для session-спрямованих bundled MCP runtime.
  Одноразові вбудовані запуски запитують очищення після завершення виконання; цей TTL є запобіжником для
  довготривалих session і майбутніх викликів.
- Зміни в `mcp.*` застосовуються на гарячу через знищення кешованих session MCP runtime.
  Наступне виявлення/використання tool створює їх заново з нової конфігурації, тому видалені
  записи `mcp.servers` прибираються негайно, а не очікують завершення idle TTL.

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

- `allowBundled`: необов’язковий allowlist лише для bundled skills (керовані/workspace skills це не зачіпає).
- `load.extraDirs`: додаткові спільні корені skills (найнижчий пріоритет).
- `install.preferBrew`: якщо `true`, спочатку надавати перевагу інсталяторам Homebrew, коли доступний `brew`,
  а вже потім переходити до інших типів інсталяторів.
- `install.nodeManager`: пріоритет інсталятора Node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо вона bundled/installed.
- `entries.<skillKey>.apiKey`: зручне поле для skills, які оголошують основну env var (простий рядок або об’єкт SecretRef).

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
- Виявлення підтримує нативні OpenClaw plugins, а також сумісні bundled Codex і Claude, включно з bundle Claude типового компонування без manifest.
- **Зміни конфігурації потребують перезапуску Gateway.**
- `allow`: необов’язковий allowlist (завантажуються лише plugins зі списку). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API key на рівні plugin (коли plugin це підтримує).
- `plugins.entries.<id>.env`: мапа env var в області plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` і ігнорує поля мутації prompt із застарілого `before_agent_start`, зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hook plugin і підтримуваних каталогів hook, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені небандловані plugins можуть читати необроблений вміст conversation із типізованих hook, таких як `llm_input`, `llm_output` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряти цьому plugin запитувати перевизначення `provider` і `model` для кожного запуску фонових підзапусків subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише якщо ви свідомо хочете дозволити будь-яку model.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений plugin (валідується за схемою нативного OpenClaw plugin, коли вона доступна).
- Налаштування облікових записів/середовища виконання для channel plugin розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` у manifest plugin-власника, а не центральним реєстром параметрів OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування provider web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (приймає SecretRef). Резервно використовує `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілий `tools.web.fetch.firecrawl.apiKey` або env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: базова URL-адреса API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст зі сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту scrape у секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути provider X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування dreaming memory. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: cadence Cron для кожного повного проходу dreaming (типово `"0 3 * * *"`).
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація memory міститься в [Memory configuration reference](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Claude bundled plugins також можуть додавати вбудовані типові значення Pi із `settings.json`; OpenClaw застосовує їх як санітизовані налаштування agent, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати id активного plugin memory або `"none"`, щоб вимкнути plugins memory.
- `plugins.slots.contextEngine`: вибрати id активного plugin context engine; типово `"legacy"`, якщо ви не встановите та не виберете інший engine.
- `plugins.installs`: застарілий сумісний резервний варіант для застарілих
  метаданих встановлення, якими керує CLI. Нові встановлення plugin записують керований
  журнал стану `plugins/installs.json`.
  - Застарілі записи містять `source`, `spec`, `sourcePath`, `installPath`,
    `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`,
    `shasum`, `resolvedAt`, `installedAt`.
  - Розглядайте `plugins.installs.*` як керований стан; надавайте перевагу командам CLI замість
    ручного редагування.

Див. [Plugins](/uk/tools/plugin).

---

## Browser

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
- `tabCleanup` звільняє відстежувані вкладки основного agent після простою або коли
  session перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тому навігація browser за замовчуванням залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте навігації browser у приватній мережі.
- У суворому режимі кінцеві точки віддалених профілів CDP (`profiles.*.cdpUrl`) підпадають під таке саме блокування приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі attach-only (запуск/зупинка/скидання вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш provider надає пряму URL-адресу DevTools WebSocket.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до віддаленої та
  `attachOnly`-доступності CDP, а також до запитів на відкриття вкладок. Керовані профілі
  local loopback зберігають локальні типові значення CDP.
- Якщо зовнішньо керована служба CDP доступна через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw вважатиме порт loopback
  локальним керованим профілем browser і може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися на
  вибраному хості або через підключений вузол browser.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлюватися на конкретний
  профіль браузера на базі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання через CSS-селектори, hook завантаження одного файла,
  без перевизначення тайм-аутів діалогів, без `wait --load networkidle`, а також без
  `responsebody`, експорту PDF, перехоплення завантажень чи пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший — у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності websocket CDP після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  запускається успішно, але перевірки готовності випереджають запуск. Обидва значення мають бути
  додатними цілими числами до `120000` ms; некоректні значення конфігурації відхиляються.
- Порядок автовиявлення: browser за замовчуванням, якщо він на базі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для профілю `existing-session` також розгортається з тильдою.
- Служба керування: лише loopback (порт похідний від `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад,
  `--disable-gpu`, параметри розміру вікна або відлагоджувальні прапорці).

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

- `seamColor`: акцентний колір для chrome нативного UI застосунку (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення ідентичності для Control UI. Резервно використовується ідентичність активного agent.

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
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише Tailscale IP) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає `127.0.0.1` усередині контейнера. З мостовою мережею Docker (`-p 18789:18789`) трафік надходить через `eth0`, тому gateway недоступний. Використовуйте `--network host` або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: за замовчуванням обов’язкова. Bind не через loopback потребують auth gateway. На практиці це означає спільний token/password або reverse proxy з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`. Wizard onboarding типово генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно із SecretRef), явно задайте `gateway.auth.mode` як `token` або `password`. Потоки запуску та встановлення/відновлення service завершуються помилкою, коли налаштовано обидва, а mode не задано.
- `gateway.auth.mode: "none"`: явний режим без auth. Використовуйте лише для довірених локальних налаштувань local loopback; цей варіант навмисно не пропонується в підказках onboarding.
- `gateway.auth.mode: "trusted-proxy"`: делегувати auth reverse proxy з урахуванням ідентичності й довіряти заголовкам ідентичності від `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **не-loopback** джерело proxy; reverse proxy loopback на тому ж хості не задовольняють auth trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти auth для Control UI/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю auth заголовками Tailscale; вони дотримуються звичайного режиму HTTP auth gateway. Цей потік без token припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий лімітатор невдалих auth. Застосовується для кожного IP клієнта та для кожної області auth (спільний секрет і token пристрою відстежуються окремо). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом невдачі. Тому одночасні хибні спроби від того самого клієнта можуть спрацювати на лімітатор уже на другому запиті, замість того щоб обидві одночасно пройти як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; установіть `false`, якщо ви свідомо хочете також обмежувати трафік localhost (для тестових налаштувань або суворих розгортань proxy).
- Спроби auth WS із походження browser завжди обмежуються без винятку для loopback (додатковий захист від brute force localhost через browser).
- На loopback ці блокування для походжень browser ізолюються за нормалізованим значенням `Origin`,
  тож повторні невдачі з одного походження localhost не блокують автоматично
  інше походження.
- `tailscale.mode`: `serve` (лише tailnet, bind loopback) або `funnel` (публічно, потребує auth).
- `controlUi.allowedOrigins`: явний allowlist походжень browser для підключень Gateway WebSocket. Обов’язковий, коли очікуються клієнти browser із не-loopback походжень.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає резервне використання походження з заголовка Host для розгортань, що навмисно покладаються на політику походження за заголовком Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: клієнтське
  аварійне перевизначення середовища процесу, яке дозволяє відкритий `ws://` до довірених
  IP приватної мережі; типовою лишається підтримка відкритого тексту лише для loopback. Еквівалента в
  `openclaw.json` немає, і конфігурація приватної мережі browser, така як
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнтів WebSocket Gateway.
- `gateway.remote.token` / `.password`: це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують auth gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS URL-адреса зовнішнього ретранслятора APNs, який використовують офіційні/TestFlight збірки iOS після публікації реєстрацій із підтримкою relay у gateway. Ця URL-адреса має збігатися з URL relay, скомпільованою у збірку iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від gateway до relay у мілісекундах. Типове значення: `10000`.
- Реєстрації з підтримкою relay делегуються конкретній ідентичності gateway. Спарений застосунок iOS отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію relay і пересилає в gateway право надсилання в межах цієї реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові перевизначення середовища для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварійний варіант лише для розробки для URL relay HTTP через loopback. URL production relay мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал моніторингу стану channel у хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски монітора стану. Типове значення: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого socket у хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типове значення: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітора стану на channel/account за ковзну годину. Типове значення: `10`.
- `channels.<provider>.healthMonitor.enabled`: відмова для окремого channel від перезапусків монітора стану зі збереженням глобального монітора.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для окремого account у multi-account channels. Якщо задано, має пріоритет над перевизначенням на рівні channel.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не вдалося розв’язати, розв’язання завершується в закритому режимі (без маскування через резервний remote).
- `trustedProxies`: IP reverse proxy, які завершують TLS або вставляють заголовки forwarded-client. Указуйте лише proxy, якими ви керуєте. Записи loopback усе ще валідні для налаштувань proxy на тому самому хості/локального виявлення (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять запити loopback придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для fail-closed поведінки.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий allowlist CIDR/IP для автоматичного схвалення першого спарювання пристрою Node без запитаних областей доступу. Вимкнено, якщо не задано. Це не схвалює автоматично спарювання operator/browser/Control UI/WebChat, а також не схвалює автоматично оновлення ролі, області доступу, метаданих або публічного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд Node після спарювання та перевірки allowlist.
- `gateway.tools.deny`: додаткові назви tool, заблоковані для HTTP `POST /tools/invoke` (розширює типовий deny list).
- `gateway.tools.allow`: прибрати назви tool із типового HTTP deny list.

</Accordion>

### Кінцеві точки, сумісні з OpenAI

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилене захист URL-входу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlist трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання за URL.
- Необов’язковий заголовок посиленого захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS-походжень, якими ви керуєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

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

- `enabled`: вмикає завершення TLS на слухачі gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, якщо явні файли не налаштовано; лише для локального/dev використання.
- `certPath`: шлях файлової системи до файла сертифіката TLS.
- `keyPath`: шлях файлової системи до файла приватного ключа TLS; тримайте його з обмеженими дозволами.
- `caPath`: необов’язковий шлях до пакета CA для перевірки клієнта або нестандартних ланцюжків довіри.

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
  - `"off"`: ігнорувати зміни наживо; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес gateway після зміни конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку пробувати hot reload; якщо потрібно — переходити до перезапуску.
- `debounceMs`: вікно debounce у ms перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у ms, протягом якого слід чекати завершення поточних операцій перед примусовим перезапуском. Пропустіть або встановіть `0`, щоб чекати безкінечно та періодично журналювати попередження про ще незавершені операції.

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
Hook-token у рядку запиту відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` потребує непорожнього `hooks.token`.
- `hooks.token` має **відрізнятися** від `gateway.auth.token`; повторне використання token Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежуйте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонізований `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping не потребують цього явного дозволу.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із тіла запиту приймається лише тоді, коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` у mapping, згенеровані шаблоном, вважаються зовнішньо наданими й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Деталі mapping">

- `match.path` зіставляє підшлях після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з payload.
- `transform` може вказувати на модуль JS/TS, що повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та traversal відхиляються).
- `agentId` маршрутизує до конкретного agent; невідомі ID резервно переходять на типове значення.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити все, `[]` = заборонити все).
- `defaultSessionKey`: необов’язковий фіксований ключ session для запусків agent через hook без явного `sessionKey`.
- `allowRequestSessionKey`: дозволити викликачам `/hooks/agent` і ключам session у mapping, керованих шаблоном, задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий префіксний allowlist для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Стає обов’язковим, коли будь-який mapping або preset використовує шаблонізований `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у channel; `channel` типово `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволено, якщо каталог model задано).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібне `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість типового шаблонізованого значення.

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

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, якщо його налаштовано. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути це.
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

- Обслуговує HTML/CSS/JS і A2UI, які agent може редагувати, через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: зберігайте `gateway.bind: "loopback"` (типово).
- Для bind не через loopback: маршрути canvas потребують auth Gateway (token/password/trusted-proxy), так само як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки auth; після спарювання та підключення node Gateway рекламує URL можливостей з областю node для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-session node і швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт live reload у HTML, що обслуговується.
- Автоматично створює стартовий `index.html`, якщо каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
- Вимкніть live reload для великих каталогів або при помилках `EMFILE`.

---

## Discovery

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
- Типове ім’я хоста — `openclaw`. Перевизначення через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує зону унікастного DNS-SD в `~/.openclaw/dns/`. Для виявлення між мережами поєднуйте з DNS-server (рекомендовано CoreDNS) + split DNS у Tailscale.

Налаштування: `openclaw dns setup --apply`.

---

## Environment

### `env` (вбудовані env var)

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

- Вбудовані env var застосовуються лише тоді, коли в env процесу відсутній ключ.
- Файли `.env`: `.env` поточного робочого каталогу + `~/.openclaw/.env` (жоден не перевизначає наявні var).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний порядок пріоритету див. у [Environment](/uk/help/environment).

### Підстановка env var

Посилайтеся на env var у будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні var спричиняють помилку під час завантаження конфігурації.
- Екрануйте через `$${VAR}` для буквального `${VAR}`.
- Працює з `$include`.

---

## Secrets

Посилання на secret є адитивними: прості текстові значення також продовжують працювати.

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
- `id` для `source: "exec"` не повинні містити сегментів шляху `.` або `..`, розділених `/` (наприклад, `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання з `auth-profiles.json` включено до розв’язання під час виконання та покриття аудиту.

### Конфігурація provider secret

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

- Provider `file` підтримує `mode: "json"` і `mode: "singleValue"` (у режимі singleValue `id` має бути `"value"`).
- Шляхи provider `file` і `exec` завершуються в закритому режимі, якщо недоступна перевірка Windows ACL. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Provider `exec` потребує абсолютний шлях `command` і використовує payload протоколу через stdin/stdout.
- Типово шляхи команд-симлінків відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи-симлінки з перевіркою розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка trusted-dir застосовується до розв’язаного цільового шляху.
- Середовище дочірнього процесу `exec` типово мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на secret розв’язуються під час активації в знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Фільтрація активної поверхні застосовується під час активації: нерозв’язані посилання на увімкнених поверхнях призводять до помилки запуску/перезавантаження, а неактивні поверхні пропускаються з діагностикою.

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

- Профілі для кожного agent зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані профілю auth на основі SecretRef.
- Статичні облікові дані під час виконання надходять із розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються під час виявлення.
- Застарілий імпорт OAuth із `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Поведінка runtime для secrets і інструменти `audit/configure/apply`: [Secrets Management](/uk/gateway/secrets).

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

- `billingBackoffHours`: базовий backoff у годинах, коли профіль зазнає невдачі через справжні
  помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг
  усе ще може потрапити сюди навіть у відповідях `401`/`403`, але текстові
  зіставлювачі, специфічні для provider, залишаються обмеженими provider, якому вони належать (наприклад, OpenRouter
  `Key limit exceeded`). Повторювані повідомлення HTTP `402` про usage-window або
  ліміти витрат organization/workspace залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин backoff для білінгу на рівні provider.
- `billingMaxHours`: верхня межа в годинах для експоненційного зростання backoff білінгу (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для високовпевнених збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: верхня межа в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілю того самого provider для помилок перевантаження перед переходом до резервної model (типово: `1`). Сюди потрапляють форми перевантаження provider, такі як `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого provider/profile (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілю того самого provider для помилок rate-limit перед переходом до резервної model (типово: `1`). Цей кошик rate-limit включає текст у формі provider, такий як `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

---

## Logging

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
- Установіть `logging.file` для стабільного шляху.
- `consoleLevel` підвищується до `debug`, коли задано `--verbose`.
- `maxFileBytes`: максимальний розмір файла журналу в байтах, після якого запис пригнічується (додатне ціле число; типово: `524288000` = 500 MB). Для production-розгортань використовуйте зовнішню ротацію журналів.

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

- `enabled`: головний перемикач для виводу інструментування (типово: `true`).
- `flags`: масив рядків-прапорців, що вмикають цільовий вивід журналу (підтримуються шаблони з `*`, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в ms для виведення попереджень про завислу session, поки session залишається у стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`).
- `otel.endpoint`: URL collector для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, які надсилаються разом із запитами експорту OTel.
- `otel.serviceName`: назва service для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт trace, metrics або logs.
- `otel.sampleRate`: частота семплювання trace `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання телеметрії в ms.
- `otel.captureContent`: явне вмикання захоплення сирого вмісту для атрибутів span OTEL. Типово вимкнено. Булеве значення `true` захоплює вміст повідомлень/tool без system; форма об’єкта дає змогу явно вмикати `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: перемикач середовища для найновіших експериментальних атрибутів provider span GenAI. Типово span зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: перемикач середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/завершення SDK, яким володіє plugin, зберігаючи активними слухачі діагностики.
- `cacheTrace.enabled`: журналювати знімки cache trace для вбудованих запусків (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL cache trace (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід cache trace (усі типово: `true`).

---

## Update

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
- `auto.enabled`: увімкнути фонове автооновлення для інсталяцій пакетів (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автозастосуванням у каналі stable (типово: `6`; макс.: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання для каналу stable в годинах (типово: `12`; макс.: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки каналу beta в годинах (типово: `1`; макс.: `24`).

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

- `enabled`: глобальний feature gate ACP (типово: `false`).
- `dispatch.enabled`: незалежний gate для диспетчеризації ходу session ACP (типово: `true`). Установіть `false`, щоб залишити команди ACP доступними, але блокувати виконання.
- `backend`: id типового backend runtime ACP (має збігатися із зареєстрованим plugin runtime ACP).
- `defaultAgent`: резервний id цільового agent ACP, коли spawn не задає явну ціль.
- `allowedAgents`: allowlist id agent, дозволених для session runtime ACP; порожнє значення означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних session ACP.
- `stream.coalesceIdleMs`: вікно idle flush у ms для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір chunk перед розбиттям проєкції потокового блоку.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/tool на хід (типово: `true`).
- `stream.deliveryMode`: `"live"` передає поступово; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій tool (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу assistant, що проєктується на хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів до булевих перевизначень видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для працівників session ACP до можливості очищення.
- `runtime.installCommand`: необов’язкова команда встановлення, яку слід виконати під час початкового налаштування середовища runtime ACP.

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

- `cli.banner.taglineMode` керує стилем слогана banner:
  - `"random"` (типово): ротаційні кумедні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`Усі ваші чати, один OpenClaw.`).
  - `"off"`: без тексту слогана (назва/версія banner усе ще показуються).
- Щоб приховати весь banner (а не лише слогани), задайте env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Метадані, які записують керовані CLI потоки налаштування (`onboard`, `configure`, `doctor`):

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

## Identity

Див. поля ідентичності `agents.list` у [Agent defaults](/uk/gateway/config-agents#agent-defaults).

---

## Bridge (застаріло, вилучено)

Поточні збірки більше не містять TCP bridge. Node підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною схеми конфігурації (валідація завершується помилкою, доки їх не буде вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

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

- `sessionRetention`: як довго зберігати завершені session ізольованих запусків cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. Типове значення: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файла журналу одного запуску (`cron/runs/<jobId>.jsonl`) перед обрізанням. Типово: `2_000_000` байт.
- `runLog.keepLines`: кількість найновіших рядків, які зберігаються, коли спрацьовує обрізання журналу запуску. Типово: `2000`.
- `webhookToken`: bearer token, що використовується для POST-доставки Webhook Cron (`delivery.mode = "webhook"`); якщо пропущено, заголовок auth не надсилається.
- `webhook`: застаріла резервна URL Webhook (http/https), яка використовується лише для збережених завдань, у яких іще є `notify: true`.

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

- `maxAttempts`: максимальна кількість повторів для одноразових завдань при тимчасових помилках (типово: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок backoff у ms для кожної спроби повтору (типово: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, що запускають повтор — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових завдань cron. Для повторюваних завдань використовується окрема обробка помилок.

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

- `enabled`: увімкнути попередження про збої для завдань cron (типово: `false`).
- `after`: кількість послідовних збоїв перед спрацюванням попередження (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними попередженнями для того самого завдання (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення channel; `"webhook"` виконує POST на налаштований Webhook.
- `accountId`: необов’язковий id account або channel для обмеження доставки попереджень.

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
- `channel`: перевизначення channel для доставки announce. `"last"` повторно використовує останній відомий channel доставки.
- `to`: явна ціль announce або URL Webhook. Обов’язкове для режиму webhook.
- `accountId`: необов’язкове перевизначення account для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли не задано ані глобальне, ані для окремого завдання призначення збоїв, завдання, які вже доставляють через `announce`, у разі збою резервно використовують цю основну ціль announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [background tasks](/uk/automation/tasks).

---

## Змінні шаблону media model

Заповнювачі шаблону, що розгортаються в `tools.media.models[].args`:

| Змінна            | Опис                                              |
| ----------------- | ------------------------------------------------- |
| `{{Body}}`        | Повний текст вхідного повідомлення                |
| `{{RawBody}}`     | Сирий текст (без обгорток history/sender)         |
| `{{BodyStripped}}`| Текст без згадок у group                          |
| `{{From}}`        | Ідентифікатор відправника                         |
| `{{To}}`          | Ідентифікатор призначення                         |
| `{{MessageSid}}`  | ID повідомлення channel                           |
| `{{SessionId}}`   | UUID поточної session                             |
| `{{IsNewSession}}`| `"true"`, коли створено нову session              |
| `{{MediaUrl}}`    | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`   | Локальний шлях до медіа                           |
| `{{MediaType}}`   | Тип медіа (image/audio/document/…)                |
| `{{Transcript}}`  | Транскрипт аудіо                                  |
| `{{Prompt}}`      | Розв’язаний media prompt для записів CLI          |
| `{{MaxChars}}`    | Розв’язана макс. кількість символів виводу для записів CLI |
| `{{ChatType}}`    | `"direct"` або `"group"`                          |
| `{{GroupSubject}}`| Тема group (за можливості)                        |
| `{{GroupMembers}}`| Попередній перегляд учасників group (за можливості) |
| `{{SenderName}}`  | Відображуване ім’я відправника (за можливості)    |
| `{{SenderE164}}`  | Номер телефону відправника (за можливості)        |
| `{{Provider}}`    | Підказка provider (`whatsapp`, `telegram`, `discord` тощо) |

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
- Масив файлів: глибоко зливається за порядком (пізніші перевизначають раніші).
- Сусідні ключі: зливаються після include (перевизначають включені значення).
- Вкладені include: до 10 рівнів глибини.
- Шляхи: розв’язуються відносно файла, що включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми/`../` дозволені лише тоді, коли після розв’язання вони все одно залишаються в межах цієї границі.
- Записи OpenClaw, які змінюють лише один розділ верхнього рівня, підкріплений include одного файла, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі include, масиви include та include із сусідніми перевизначеннями доступні лише для читання для записів OpenClaw; такі записи завершуються в закритому режимі замість сплощення конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних include.

---

_Пов’язано: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Configuration](/uk/gateway/configuration)
- [Приклади Configuration](/uk/gateway/configuration-examples)
