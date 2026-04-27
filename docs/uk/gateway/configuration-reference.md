---
read_when:
    - Вам потрібні точні семантики полів конфігурації або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник з конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник з конфігурації
x-i18n:
    generated_at: "2026-04-27T22:22:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e5302ef65a8464dcb1babb9fa01d3084bc1a622632b60f144997266cf174af
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Довідник з основної конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Configuration](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і містить посилання назовні, коли підсистема має власний детальніший довідник. Каталоги команд, що належать каналам і Plugin, а також глибокі параметри пам’яті/QMD винесені на окремі сторінки, а не описані тут.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, із доданими метаданими bundled/Plugin/каналів, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми для конкретного шляху для інструментів деталізованого перегляду
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації щодо поточної поверхні схеми

Шлях пошуку для агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації на рівні полів і обмежень перед внесенням змін. Використовуйте
[Configuration](/uk/gateway/configuration) для вказівок, орієнтованих на завдання, а цю сторінку —
для ширшої карти полів, значень за замовчуванням і посилань на довідники підсистем.

Окремі детальні довідники:

- [Memory configuration reference](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації Dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки каналу/Plugin-власника для поверхонь команд, специфічних для каналу

Формат конфігурації — **JSON5** (дозволені коментарі та завершальні коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, якщо їх не вказано.

---

## Канали

Ключі конфігурації для кожного каналу перенесено на окрему сторінку — див.
[Configuration — channels](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, мультиакаунтність, згадування).

## Значення агентів за замовчуванням, мультиагентність, сесії та повідомлення

Перенесено на окрему сторінку — див.
[Configuration — agents](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, thinking, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (маршрутизація та прив’язки мультиагентності)
- `session.*` (життєвий цикл сесії, Compaction, очищення)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає стандартне для платформи вікно паузи перед надсиланням транскрипту (`700 ms на macOS і Android, 900 ms на iOS`)

## Інструменти та власні провайдери

Політика інструментів, experimental-перемикачі, конфігурація інструментів із підтримкою провайдерів і налаштування
власних провайдерів / базових URL перенесені на окрему сторінку — див.
[Configuration — tools and custom providers](/uk/gateway/config-tools).

## MCP

Визначення MCP-серверів, керованих OpenClaw, знаходяться в `mcp.servers` і
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
  відкривають налаштовані інструменти MCP.
  Віддалені записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` — це псевдонім на рівні CLI, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують до канонічного поля `transport`.
- `mcp.sessionIdleTtlMs`: TTL бездіяльності для прив’язаних до сесії bundled MCP runtime.
  Одноразові вбудовані запуски запитують очищення після завершення виконання; цей TTL є резервним механізмом для
  довготривалих сесій і майбутніх викликів.
- Зміни в `mcp.*` застосовуються гарячим способом через вивільнення кешованих session MCP runtime.
  Наступне виявлення/використання інструмента відтворює їх із нової конфігурації, тому вилучені записи
  `mcp.servers` прибираються негайно замість очікування TTL бездіяльності.

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

- `allowBundled`: необов’язковий список дозволу лише для bundled skills (на керовані/workspace skills не впливає).
- `load.extraDirs`: додаткові спільні кореневі каталоги skills (найнижчий пріоритет).
- `install.preferBrew`: якщо `true`, надає перевагу інсталяторам Homebrew, коли `brew`
  доступний, перш ніж переходити до інших типів інсталяторів.
- `install.nodeManager`: пріоритет інсталятора Node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/встановлений.
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

- Завантажуються з `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, а також `plugins.load.paths`.
- Виявлення приймає нативні Plugin OpenClaw, а також сумісні пакети Codex і Claude, зокрема пакети Claude стандартного макета без маніфесту.
- **Зміни конфігурації потребують перезапуску Gateway.**
- `allow`: необов’язковий список дозволу (завантажуються лише перелічені Plugin). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні Plugin (коли Plugin це підтримує).
- `plugins.entries.<id>.env`: мапа змінних середовища в межах Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` та ігнорує поля зі зміною prompt із застарілого `before_agent_start`, водночас зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hook-ів Plugin і підтримуваних каталогів hook-ів, наданих пакетами.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені небандловані Plugin можуть читати необроблений вміст розмови з типізованих hook-ів, таких як `llm_input`, `llm_output`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряти цьому Plugin запитувати перевизначення `provider` і `model` для кожного запуску фонових підагентів.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволу канонічних цілей `provider/model` для довірених перевизначень підагента. Використовуйте `"*"` лише тоді, коли ви свідомо хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: визначений Plugin об’єкт конфігурації (валідується за схемою нативного Plugin OpenClaw, якщо вона доступна).
- Налаштування акаунта/runtime для Plugin-каналів знаходяться в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфесту Plugin-власника, а не центральним реєстром параметрів OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера web-fetch Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Використовує `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілий `tools.web.fetch.firecrawl.apiKey` або змінну середовища `FIRECRAWL_API_KEY`, якщо основне значення відсутнє.
  - `baseUrl`: базовий URL API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст зі сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту на збирання в секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: Cron-частота для кожного повного проходу dreaming (типово `"0 3 * * *"`).
  - `model`: необов’язкове перевизначення моделі підагента Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті наведена в [Memory configuration reference](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Plugin-пакети Claude також можуть додавати вбудовані значення Pi за замовчуванням із `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати ідентифікатор активного Plugin пам’яті або `"none"`, щоб вимкнути Plugin пам’яті.
- `plugins.slots.contextEngine`: вибрати ідентифікатор активного Plugin рушія контексту; типово `"legacy"`, якщо ви не встановили й не вибрали інший рушій.

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
- `tabCleanup` звільняє відстежувані вкладки основного агента після періоду простою або коли
  сесія перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тому навігація браузера типово залишається суворо обмеженою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте навігації браузера в приватній мережі.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підлягають тому самому блокуванню приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі підключення (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявив `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL DevTools WebSocket.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до віддаленої та
  `attachOnly`-доступності CDP, а також до запитів на відкриття вкладок. Керовані loopback-профілі
  зберігають локальні значення CDP за замовчуванням.
- Якщо зовнішньо керований сервіс CDP доступний через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw трактуватиме loopback-порт як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися на
  вибраному хості або через підключений вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлюватися на конкретний
  профіль браузера на базі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість таргетингу через CSS-селектори, hook-и завантаження одного файлу,
  без перевизначення тайм-ауту діалогів, без `wait --load networkidle`, а також без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності CDP websocket після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  запускається успішно, але перевірки готовності випереджають завершення старту. Обидва значення мають бути
  додатними цілими числами до `120000` ms; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: браузер за замовчуванням, якщо він на базі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  Для `userDataDir` у профілях `existing-session` також виконується розгортання тильди.
- Сервіс керування: лише loopback (порт визначається з `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад,
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

- `seamColor`: колір акценту для chrome інтерфейсу нативного застосунку (відтінок бульбашки режиму Talk тощо).
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

<Accordion title="Докладні відомості про поля Gateway">

- `mode`: `local` (запустити gateway) або `remote` (підключитися до віддаленого gateway). Gateway відмовляється запускатися, якщо не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: bind `loopback` за замовчуванням слухає `127.0.0.1` усередині контейнера. Із bridge-мережею Docker (`-p 18789:18789`) трафік надходить через `eth0`, тому gateway недосяжний. Використовуйте `--network host` або встановіть `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: типово обов’язкова. Binds не на loopback потребують автентифікації gateway. На практиці це означає спільний token/password або reverse proxy з контролем ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер початкового налаштування типово генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема через SecretRef), явно задайте `gateway.auth.mode` як `token` або `password`. Під час запуску та в потоках встановлення/відновлення сервісу стається помилка, якщо налаштовано обидва, а mode не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених локальних конфігурацій local loopback; цей варіант навмисно не пропонується в запитах початкового налаштування.
- `gateway.auth.mode: "trusted-proxy"`: делегує автентифікацію браузера/користувача reverse proxy з контролем ідентичності та довіряє заголовкам ідентичності від `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **не-loopback** джерело proxy; reverse proxy на тому самому хості через loopback не задовольняють вимоги trusted-proxy для автентифікації ідентичності. Внутрішні виклики на тому самому хості можуть використовувати `gateway.auth.password` як локальний прямий резервний варіант; `gateway.auth.token` і далі взаємовиключний із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію заголовками Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації gateway. Цей потік без token припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб автентифікації. Застосовується для кожного IP клієнта та для кожної області автентифікації (спільний секрет і token пристрою відстежуються окремо). Заблоковані спроби повертають `429` + `Retry-After`.
  - В асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом невдачі. Тому одночасні хибні спроби від того самого клієнта можуть спровокувати спрацювання обмежувача на другому запиті, замість того щоб обидві одночасно пройти як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; установіть `false`, коли ви свідомо хочете, щоб трафік localhost теж підлягав rate limiting (для тестових конфігурацій або суворих розгортань через proxy).
- Спроби автентифікації WS із браузерного origin завжди обмежуються без винятку для loopback (додатковий захист від brute force localhost із браузера).
- На loopback ці блокування для браузерних origin ізолюються за нормалізованим
  значенням `Origin`, тому повторні невдалі спроби з одного localhost origin не
  блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind на loopback) або `funnel` (публічний доступ, потрібна автентифікація).
- `controlUi.allowedOrigins`: явний allowlist browser-origin для підключень Gateway WebSocket. Обов’язковий, коли очікуються браузерні клієнти з origin не на loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає fallback origin через заголовок Host для розгортань, що навмисно покладаються на політику origin на основі заголовка Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійний override через
  змінну середовища клієнтського процесу, який дозволяє незашифрований `ws://` до довірених IP
  приватної мережі; типово незашифрований трафік, як і раніше, дозволено лише для loopback. Еквівалента в `openclaw.json`
  немає, а конфігурація приватної мережі браузера, така як
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на
  клієнти Gateway WebSocket.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують автентифікацію gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL для зовнішнього relay APNs, який використовують офіційні/TestFlight-збірки iOS після публікації relay-backed реєстрацій у gateway. Цей URL має збігатися з URL relay, вбудованим у збірку iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від gateway до relay у мілісекундах. Типово `10000`.
- Реєстрації через relay делегуються конкретній ідентичності gateway. Спарений застосунок iOS отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію relay і пересилає gateway дозвіл на надсилання в межах цієї реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові override через змінні середовища для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварійний виняток лише для розробки для URL relay через loopback HTTP. URL relay у production мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал моніторингу стану каналу в хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски монітора стану. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітора стану на канал/акаунт за ковзну годину. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: відмова на рівні каналу від перезапусків монітора стану за збереження глобального монітора ввімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для конкретного акаунта в мультиакаунтних каналах. Якщо задано, має пріоритет над перевизначенням на рівні каналу.
- Локальні шляхи викликів gateway можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його не вдається розв’язати, розв’язання завершується з fail-closed (без маскування резервним remote fallback).
- `trustedProxies`: IP reverse proxy, які завершують TLS або додають заголовки перенаправленого клієнта. Вказуйте лише proxy, які ви контролюєте. Записи loopback усе ще дійсні для конфігурацій proxy/локального виявлення на тому самому хості (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий allowlist CIDR/IP для автоматичного схвалення першого спарювання пристрою вузла без запитаних scope. Якщо не задано, вимкнено. Це не схвалює автоматично спарювання operator/browser/Control UI/WebChat і не схвалює автоматично оновлення ролі, scope, metadata або публічного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд вузла після спарювання та перевірки allowlist.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий deny list).
- `gateway.tools.allow`: прибирає назви інструментів із типового HTTP deny list.

</Accordion>

### Кінцеві точки, сумісні з OpenAI

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-входів Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlist трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посиленого захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS origin, які ви контролюєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

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
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, якщо явні файли не налаштовані; лише для локального/dev використання.
- `certPath`: шлях у файловій системі до файлу сертифіката TLS.
- `keyPath`: шлях у файловій системі до файлу приватного ключа TLS; обмежте доступ до нього правами.
- `caPath`: необов’язковий шлях до пакета CA для перевірки клієнта або власних ланцюжків довіри.

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
  - `"restart"`: завжди перезапускати процес gateway при зміні конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати hot reload; за потреби перейти до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс очікування завершення операцій у польоті перед примусовим перезапуском. Не вказуйте його або встановіть `0`, щоб чекати безстроково й періодично журналювати попередження про те, що ще є незавершені операції.

---

## Hook-и

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
Hook token у рядку запиту відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` потребує непорожнього `hooks.token`.
- `hooks.token` має **відрізнятися** від `gateway.auth.token`; повторне використання token Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонізований `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping не потребують цього opt-in.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із тіла запиту приймається лише тоді, коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` у mapping, згенеровані шаблоном, вважаються зовнішньо наданими й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Докладні відомості про mapping">

- `match.path` відповідає підшляху після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` відповідає полю payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з payload.
- `transform` може вказувати на JS/TS-модуль, який повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та traversal відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ID повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або не задано = дозволити все, `[]` = заборонити все).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook-агента без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликам `/hooks/agent` і ключам сесії mapping, керованим шаблонами, задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий prefix allowlist для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Стає обов’язковим, коли будь-який mapping або preset використовує шаблонізований `sessionKey`.
- `deliver: true` надсилає фінальну відповідь до каналу; `channel` типово дорівнює `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволена, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію за кожним повідомленням, установіть `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` так, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібне `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість шаблонного значення за замовчуванням.

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

- Gateway автоматично запускає `gog gmail watch serve` під час старту, коли це налаштовано. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
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
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Для bind не на loopback: маршрути canvas потребують автентифікації Gateway (token/password/trusted-proxy), як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки автентифікації; після спарювання та підключення вузла Gateway рекламує URL можливостей у межах вузла для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії вузла й швидко спливають. Резервний варіант на основі IP не використовується.
- Впроваджує клієнт live reload у HTML, що обслуговується.
- Автоматично створює стартовий `index.html`, якщо каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
- Вимкніть live reload для великих каталогів або у разі помилок `EMFILE`.

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

- `minimal` (типово): не включає `cliPath` і `sshPort` до TXT-записів.
- `full`: включає `cliPath` і `sshPort`.
- Ім’я хоста типово береться із системного імені хоста, якщо це дійсна DNS-мітка, інакше використовується `openclaw`. Для перевизначення використовуйте `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує unicast-зону DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднуйте це з DNS-сервером (рекомендовано CoreDNS) і split DNS у Tailscale.

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

- Вбудовані змінні середовища застосовуються лише тоді, коли в середовищі процесу відсутній ключ.
- Файли `.env`: `.env` поточного робочого каталогу + `~/.openclaw/.env` (жоден із них не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний порядок пріоритету див. у [Environment](/uk/help/environment).

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
- Екрануйте через `$${VAR}` для буквального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є адитивними: прості текстові значення й надалі працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон `id` для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` для `source: "file"`: абсолютний вказівник JSON (наприклад `"/providers/openai/apiKey"`)
- шаблон `id` для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` для `source: "exec"` не повинен містити slash-delimited сегментів шляху `.` або `..` (наприклад, `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання в `auth-profiles.json` включено до runtime-розв’язання та покриття аудиту.

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

- Провайдер `file` підтримує `mode: "json"` і `mode: "singleValue"` (у режимі singleValue значення `id` має бути `"value"`).
- Шляхи провайдерів file і exec завершуються fail-closed, якщо перевірка Windows ACL недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` потребує абсолютного шляху `command` і використовує протокольні payload у stdin/stdout.
- Типово шляхи команд-симлінків відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи-симлінки з перевіркою розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка trusted-dir застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` типово мінімальне; явно передавайте потрібні змінні через `passEnv`.
- Посилання на секрети розв’язуються під час активації в знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Під час активації застосовується фільтрація активної поверхні: нерозв’язані посилання на ввімкнених поверхнях спричиняють помилку запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

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
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для режимів статичних облікових даних.
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані профілю автентифікації на основі SecretRef.
- Статичні runtime-облікові дані надходять із розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються при виявленні.
- Застарілий імпорт OAuth виконується з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Runtime-поведінка секретів та інструменти `audit/configure/apply`: [Secrets Management](/uk/gateway/secrets).

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
  усе ще може потрапляти сюди навіть у відповідях `401`/`403`, але
  зіставлювачі тексту, специфічні для провайдера, залишаються прив’язаними до
  провайдера, якому вони належать (наприклад, OpenRouter
  `Key limit exceeded`). Повідомлення retryable HTTP `402` про usage-window або
  spend-limit організації/робочого простору натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення backoff у годинах для окремих провайдерів.
- `billingMaxHours`: межа в годинах для експоненційного зростання billing backoff (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для збоїв `auth_permanent` із високою впевненістю (типово: `10`).
- `authPermanentMaxMinutes`: межа в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для помилок перевантаження перед переходом до резервної моделі (типово: `1`). Сюди потрапляють форми зайнятості провайдера, такі як `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для помилок rate limit перед переходом до резервної моделі (типово: `1`). Цей bucket rate limit включає текстові форми провайдера на кшталт `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- Установіть `logging.file` для стабільного шляху.
- `consoleLevel` підвищується до `debug` за `--verbose`.
- `maxFileBytes`: максимальний розмір активного файлу журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 MB). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування за принципом best-effort для виводу в консоль, файлів журналів, записів журналів OTLP і збереженого тексту транскрипту сесії.

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
- `flags`: масив рядків-прапорців, що вмикають цільовий вивід журналу (підтримує шаблони з wildcard, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для виведення попереджень про застряглу сесію, поки сесія залишається в стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. у [OpenTelemetry export](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові OTLP endpoint для конкретних сигналів. Якщо задано, вони перевизначають `otel.endpoint` лише для відповідного сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: ім’я сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт trace, metrics або logs.
- `otel.sampleRate`: частота семплювання trace `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання телеметрії в мс.
- `otel.captureContent`: opt-in захоплення сирого вмісту для атрибутів span OTEL. Типово вимкнено. Булеве значення `true` захоплює вміст повідомлень/інструментів, крім системного; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: перемикач середовища для найновіших експериментальних атрибутів провайдера span GenAI. Типово span зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: перемикач середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/завершення SDK, що належить Plugin, зберігаючи активними слухачі діагностики.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища endpoint для конкретних сигналів, які використовуються, коли відповідний ключ конфігурації не задано.
- `cacheTrace.enabled`: журналювати знімки трасування кешу для вбудованих запусків (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL трасування кешу (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід трасування кешу (усе типово: `true`).

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
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для встановлень пакетів (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед авто застосуванням stable-каналу (типово: `6`; макс.: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання stable-каналу в годинах (типово: `12`; макс.: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки beta-каналу в годинах (типово: `1`; макс.: `24`).

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

- `enabled`: глобальний feature gate ACP (типово: `true`; установіть `false`, щоб приховати можливості dispatch і spawn ACP).
- `dispatch.enabled`: незалежний перемикач для dispatch ходів сесії ACP (типово: `true`). Установіть `false`, щоб залишити команди ACP доступними, але заблокувати виконання.
- `backend`: ідентифікатор типового backend runtime ACP (має відповідати зареєстрованому runtime Plugin ACP).
  Якщо задано `plugins.allow`, включіть id backend Plugin (наприклад `acpx`), інакше bundled Plugin за замовчуванням не завантажиться.
- `defaultAgent`: резервний id цільового агента ACP, коли spawn не задає явну ціль.
- `allowedAgents`: allowlist id агентів, дозволених для runtime-сесій ACP; порожнє значення означає відсутність додаткового обмеження.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір чанка перед розбиттям проєкції потокового блоку.
- `stream.repeatSuppression`: придушувати повторні рядки status/tool на кожен хід (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потік поступово; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, проєктованих на хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків status/update ACP.
- `stream.tagVisibility`: запис імен тегів у булеві перевизначення видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для worker сесій ACP до моменту, коли можливе очищення.
- `runtime.installCommand`: необов’язкова команда встановлення для запуску під час bootstrap середовища runtime ACP.

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
  - `"random"` (типово): ротаційні кумедні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`Усі ваші чати, один OpenClaw.`).
  - `"off"`: без тексту слогана (назва/версія банера все одно показується).
- Щоб приховати весь банер (а не лише слогани), установіть змінну середовища `OPENCLAW_HIDE_BANNER=1`.

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

## Bridge (застарілий, видалений)

Поточні збірки більше не містять TCP bridge. Nodes підключаються через Gateway WebSocket. Ключі `bridge.*` більше не є частиною схеми конфігурації (валідація завершується помилкою, доки їх не буде видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

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

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запусків cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. Типово: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір на файл журналу запуску (`cron/runs/<jobId>.jsonl`) перед очищенням. Типово: `2_000_000` байтів.
- `runLog.keepLines`: кількість найновіших рядків, що зберігаються, коли спрацьовує очищення журналу запуску. Типово: `2000`.
- `webhookToken`: bearer token, який використовується для POST-доставки Webhook cron (`delivery.mode = "webhook"`); якщо не задано, заголовок автентифікації не надсилається.
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
- `retryOn`: типи помилок, що запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Не вказуйте, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових завдань cron. Для повторюваних завдань використовується окрема обробка збоїв.

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
- `after`: кількість послідовних збоїв перед спрацюванням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для одного завдання (невід’ємне ціле число).
- `includeSkipped`: зараховувати послідовні пропущені запуски до порога сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на backoff помилок виконання.
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` виконує POST до налаштованого Webhook.
- `accountId`: необов’язковий id акаунта або каналу для обмеження доставки сповіщень.

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

- Типова ціль для сповіщень про збої cron для всіх завдань.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо цільових даних.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL Webhook. Обов’язково для режиму webhook.
- `accountId`: необов’язкове перевизначення акаунта для доставки.
- `delivery.failureDestination` для конкретного завдання перевизначає це глобальне типове значення.
- Коли не задано ні глобальну, ні для конкретного завдання ціль збоїв, завдання, які вже доставляють через `announce`, у разі збою повертаються до цієї основної announce-цілі.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [background tasks](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Заповнювачі шаблонів, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                                |
| ------------------ | --------------------------------------------------- |
| `{{Body}}`         | Повний текст вхідного повідомлення                  |
| `{{RawBody}}`      | Сирий текст (без обгорток історії/відправника)      |
| `{{BodyStripped}}` | Текст без згадувань у групі                         |
| `{{From}}`         | Ідентифікатор відправника                           |
| `{{To}}`           | Ідентифікатор призначення                           |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                   |
| `{{SessionId}}`    | UUID поточної сесії                                 |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                  |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                           |
| `{{MediaPath}}`    | Локальний шлях до медіа                             |
| `{{MediaType}}`    | Тип медіа (image/audio/document/…)                  |
| `{{Transcript}}`   | Транскрипт аудіо                                    |
| `{{Prompt}}`       | Розв’язаний медіа-prompt для записів CLI            |
| `{{MaxChars}}`     | Розв’язаний максимум символів виводу для записів CLI |
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
- Масив файлів: deep merge у вказаному порядку (пізніші перевизначають раніші).
- Сусідні ключі: зливаються після include (перевизначають включені значення).
- Вкладені include: до 10 рівнів глибини.
- Шляхи: розв’язуються відносно файла, що включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми/`../` дозволені лише тоді, коли після розв’язання вони все одно залишаються в межах цього обмеження.
- Записи, керовані OpenClaw, які змінюють лише один верхньорівневий розділ, підкріплений include одного файла, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі include, масиви include та include із сусідніми перевизначеннями є read-only для записів, керованих OpenClaw; такі записи завершуються fail-closed замість сплющення конфігурації.
- Помилки: чіткі повідомлення про відсутні файли, помилки розбору та циклічні include.

---

_Пов’язане: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Configuration](/uk/gateway/configuration)
- [Configuration examples](/uk/gateway/configuration-examples)
