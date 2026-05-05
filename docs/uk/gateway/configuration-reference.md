---
read_when:
    - Вам потрібні точна семантика конфігурації на рівні полів або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на спеціалізовані довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-05-05T03:06:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd0b6bf9a77d91bcc240088e4be92e44b6e70910efe00f7ed99534fb70983479
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Довідник основної конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Configuration](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і посилається на окремі сторінки, коли підсистема має власний глибший довідник. Каталоги команд, якими володіють канали й плагіни, а також поглиблені параметри памʼяті/QMD розміщені на власних сторінках, а не на цій.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, з обʼєднаними метаданими вбудованих/плагінних/канальних компонентів, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми з областю дії за шляхом для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації відносно поточної поверхні схеми

Шлях пошуку агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації та обмежень на рівні полів перед редагуванням. Використовуйте
[Configuration](/uk/gateway/configuration) для порад, орієнтованих на завдання, а цю сторінку
для ширшої карти полів, значень за замовчуванням і посилань на довідники підсистем.

Окремі поглиблені довідники:

- [Довідник конфігурації памʼяті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації Dreaming у `plugins.entries.memory-core.config.dreaming`
- [Команди Slash](/uk/tools/slash-commands) для поточного каталогу вбудованих + пакетних команд
- сторінки відповідних каналів/плагінів для поверхонь команд, специфічних для каналу

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необовʼязкові — OpenClaw використовує безпечні значення за замовчуванням, коли їх опущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на спеціальну сторінку — див.
[Configuration — channels](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
пакетних каналів (автентифікація, контроль доступу, кілька облікових записів, шлюзування згадок).

## Значення агента за замовчуванням, багатоагентність, сесії та повідомлення

Перенесено на спеціальну сторінку — див.
[Configuration — agents](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, мислення, heartbeat, памʼять, медіа, Skills, sandbox)
- `multiAgent.*` (маршрутизація і привʼязки багатоагентності)
- `session.*` (життєвий цикл сесії, Compaction, обрізання)
- `messages.*` (доставлення повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.speechLocale`: необовʼязковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: коли не задано, Talk зберігає типове для платформи вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)

## Інструменти та користувацькі провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів на основі провайдера та налаштування користувацького
провайдера / base-URL перенесені на спеціальну сторінку — див.
[Configuration — tools and custom providers](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, списки дозволених моделей і налаштування користувацьких провайдерів містяться в
[Configuration — tools and custom providers](/uk/gateway/config-tools#custom-providers-and-base-urls).
Корінь `models` також керує глобальною поведінкою каталогу моделей.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: поведінка каталогу провайдера (`merge` або `replace`).
- `models.providers`: мапа користувацьких провайдерів із ключами за id провайдера.
- `models.pricing.enabled`: керує фоновим завантаженням цін, яке
  запускається після того, як sidecars і канали досягають готового шляху Gateway. Коли `false`,
  Gateway пропускає отримання каталогів цін OpenRouter і LiteLLM; налаштовані
  значення `models.providers.*.models[].cost` і далі працюють для локальних оцінок вартості.

## MCP

Визначення серверів MCP, керованих OpenClaw, містяться в `mcp.servers` і
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
  `type: "http"` — це CLI-native псевдонім, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.sessionIdleTtlMs`: TTL простою для runtime пакетного MCP з областю дії сесії.
  Одноразові вбудовані запуски запитують очищення наприкінці запуску; цей TTL є резервним механізмом для
  довгоживучих сесій і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються гаряче шляхом утилізації кешованих runtime MCP сесій.
  Наступне виявлення/використання інструмента відтворює їх із нової конфігурації, тому видалені
  записи `mcp.servers` прибираються негайно, а не після очікування TTL простою.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[Бекенди CLI](/uk/gateway/cli-backends#bundle-mcp-overlays) щодо поведінки runtime.

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

- `allowBundled`: необовʼязковий список дозволених лише для пакетних Skills (керовані/робочі Skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені Skills (найнижчий пріоритет).
- `install.preferBrew`: коли true, надавати перевагу інсталяторам Homebrew, коли `brew`
  доступний, перед відступом до інших типів інсталяторів.
- `install.nodeManager`: пріоритет інсталятора node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він пакетний/інстальований.
- `entries.<skillKey>.apiKey`: зручне поле для Skills, які оголошують основну змінну середовища (рядок plaintext або обʼєкт SecretRef).

---

## Плагіни

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
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
- Виявлення приймає нативні плагіни OpenClaw, а також сумісні пакети Codex і пакети Claude, зокрема пакети стандартного макета Claude без маніфеста.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необовʼязковий список дозволених (завантажуються лише перелічені плагіни). `deny` має пріоритет.
- `bundledDiscovery`: за замовчуванням `"allowlist"` для нових конфігурацій, тому непорожній
  `plugins.allow` також обмежує пакетні плагіни провайдерів, зокрема runtime-провайдери
  web-search. Doctor записує `"compat"` для перенесених застарілих конфігурацій allowlist,
  щоб зберегти наявну поведінку пакетних провайдерів, доки ви не ввімкнете нову.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні плагіна (коли підтримується плагіном).
- `plugins.entries.<id>.env`: мапа змінних середовища з областю дії плагіна.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` та ігнорує поля, що змінюють prompt, із застарілого `before_agent_start`, зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hook плагінів і підтримуваних директорій hook, наданих пакетами.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені непакетні плагіни можуть читати raw conversation content із типізованих hook, як-от `llm_input`, `llm_output`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довірити цьому плагіну запитувати для окремого запуску перевизначення `provider` і `model` для фонових запусків subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необовʼязковий список дозволених канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: обʼєкт конфігурації, визначений плагіном (валідується схемою нативного плагіна OpenClaw, коли доступна).
- Налаштування облікових записів/runtime канального плагіна розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфеста відповідного плагіна, а не центральним реєстром опцій OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера web-fetch Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Відступає до `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілого `tools.web.fetch.firecrawl.apiKey` або змінної середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базова URL-адреса API Firecrawl (за замовчуванням: `https://api.firecrawl.dev`; self-hosted перевизначення мають вказувати на приватні/внутрішні endpoint).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (за замовчуванням: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (за замовчуванням: `172800000` / 2 дні).
  - `timeoutSeconds`: таймаут запиту scrape у секундах (за замовчуванням: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування Dreaming памʼяті. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач Dreaming (за замовчуванням `false`).
  - `frequency`: cadence Cron для кожного повного sweep Dreaming (`"0 3 * * *"` за замовчуванням).
  - `model`: необовʼязкове перевизначення моделі subagent Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз із моделлю сесії за замовчуванням; збої довіри або allowlist не відступають тихо.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація памʼяті міститься в [Довіднику конфігурації памʼяті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені плагіни пакетів Claude також можуть додавати вбудовані значення Pi за замовчуванням із `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агента, а не як raw патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати id активного плагіна памʼяті або `"none"`, щоб вимкнути плагіни памʼяті.
- `plugins.slots.contextEngine`: вибрати id активного плагіна context engine; за замовчуванням `"legacy"`, якщо ви не інсталюєте й не виберете інший engine.

Див. [Плагіни](/uk/tools/plugin).

---

## Зобовʼязання

`commitments` керує виведеною памʼяттю наступних дій: OpenClaw може виявляти check-ins із ходів розмови та доставляти їх через запуски heartbeat.

- `commitments.enabled`: увімкнути приховане LLM-витягування, зберігання та доставлення через heartbeat для виведених зобовʼязань щодо наступних дій. За замовчуванням: `false`.
- `commitments.maxPerDay`: максимальна кількість виведених зобовʼязань щодо наступних дій, доставлених за сесію агента в ковзний день. За замовчуванням: `3`.

Див. [Виведені зобовʼязання](/uk/concepts/commitments).

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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, коли не задано, тому навігація браузера за замовчуванням залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте навігації браузера в приватній мережі.
- У суворому режимі віддалені кінцеві точки CDP-профілів (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі під’єднання (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL DevTools WebSocket.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до віддаленої та
  `attachOnly` CDP-доступності, а також до запитів відкриття вкладок. Керовані профілі loopback
  зберігають локальні стандартні значення CDP.
- Якщо зовнішньо керований CDP-сервіс доступний через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw розглядатиме порт loopback як
  локальний керований профіль браузера та може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть під’єднуватися на
  вибраному хості або через під’єднаний вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршрутів Chrome MCP:
  дії на основі snapshot/ref замість націлювання CSS-селекторами, хуки завантаження одного файла,
  без перевизначень тайм-аутів діалогів, без `wait --load networkidle`, а також без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності websocket CDP після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  успішно запускається, але перевірки готовності змагаються із запуском. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: браузер за замовчуванням, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для профілю в профілях `existing-session` також розгортається з тильдою.
- Сервіс керування: лише loopback (порт виводиться з `gateway.port`, за замовчуванням `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад
  `--disable-gpu`, розміри вікна або прапорці налагодження).

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

- `seamColor`: акцентний колір для хрому інтерфейсу нативного застосунку (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення ідентичності інтерфейсу керування. За відсутності використовується ідентичність активного агента.

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

- `mode`: `local` (запустити gateway) або `remote` (підключитися до віддаленого gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає `127.0.0.1` усередині контейнера. За мережі Docker bridge (`-p 18789:18789`) трафік надходить на `eth0`, тож gateway недоступний. Використовуйте `--network host` або встановіть `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: типово обов’язкова. Bind не на loopback потребують автентифікації gateway. На практиці це означає спільний токен/пароль або reverse proxy з підтримкою ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер onboarding типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRefs), явно встановіть `gateway.auth.mode` у `token` або `password`. Запуск і потоки встановлення/відновлення сервісу завершуються помилкою, коли обидва налаштовані, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; це навмисно не пропонується підказками onboarding.
- `gateway.auth.mode: "trusted-proxy"`: делегуйте автентифікацію браузера/користувача reverse proxy з підтримкою ідентичності та довіряйте заголовкам ідентичності від `gateway.trustedProxies` (див. [Автентифікація через довірений proxy](/uk/gateway/trusted-proxy-auth)). Цей режим типово очікує джерело proxy **не з loopback**; reverse proxy на loopback того самого хоста потребують явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні виклики з того самого хоста можуть використовувати `gateway.auth.password` як локальний прямий fallback; `gateway.auth.token` лишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевірено через `tailscale whois`). HTTP API endpoints **не** використовують цю автентифікацію заголовками Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації gateway. Цей потік без токена припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих автентифікацій. Застосовується за IP клієнта і за областю автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому паралельні хибні спроби від того самого клієнта можуть спрацювати на обмежувачі вже на другому запиті, замість того щоб обидві пройти як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово `true`; встановіть `false`, коли ви навмисно хочете обмежувати частоту й localhost-трафіку (для тестових налаштувань або суворих proxy-розгортань).
- Спроби WS-автентифікації з browser-origin завжди throttled із вимкненим винятком для loopback (defense-in-depth проти browser-based перебору localhost).
- На loopback ці browser-origin блокування ізольовані за нормалізованим значенням `Origin`, тому повторні невдачі з одного localhost origin не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind loopback) або `funnel` (публічний, потребує автентифікації).
- `controlUi.allowedOrigins`: явний allowlist browser-origin для Gateway WebSocket підключень. Обов’язковий, коли очікуються браузерні клієнти з origin не на loopback.
- `controlUi.chatMessageMaxWidth`: необов’язкова max-width для згрупованих chat messages Control UI. Приймає обмежені значення ширини CSS, як-от `960px`, `82%`, `min(1280px, 82%)` і `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає fallback origin за Host-header для розгортань, що навмисно покладаються на політику origin за Host-header.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: process-environment перевизначення break-glass на боці клієнта, яке дозволяє plaintext `ws://` до довірених IP приватної мережі; типовим для plaintext лишається лише loopback. Еквівалента в `openclaw.json` немає, а конфігурація приватної мережі браузера, як-от `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнтів Gateway WebSocket.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі не налаштовують автентифікацію gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS URL для зовнішнього APNs relay, який використовується офіційними/TestFlight iOS збірками після публікації реєстрацій із підтримкою relay до gateway. Ця URL має збігатися з relay URL, скомпільованою в iOS збірку.
- `gateway.push.apns.relay.timeoutMs`: gateway-to-relay timeout надсилання в мілісекундах. Типово `10000`.
- Реєстрації з підтримкою relay делегуються конкретній ідентичності gateway. Спарений iOS app отримує `gateway.identity.get`, включає цю ідентичність у relay registration і пересилає gateway grant на надсилання, прив’язаний до реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env перевизначення для relay config вище.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: лише для розробки escape hatch для loopback HTTP relay URLs. Production relay URLs мають лишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: timeout pre-auth Gateway WebSocket handshake у мілісекундах. Типово: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли задано. Збільшуйте це значення на навантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки startup warmup ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал health-monitor каналу в хвилинах. Встановіть `0`, щоб глобально вимкнути перезапуски health-monitor. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг stale-socket у хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на канал/обліковий запис у rolling hour. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: per-channel opt-out для перезапусків health-monitor зі збереженням глобального monitor увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: per-account override для multi-account каналів. Коли задано, має пріоритет над channel-level override.
- Локальні шляхи викликів gateway можуть використовувати `gateway.remote.*` як fallback лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не resolve, resolution fail-closed (без маскування remote fallback).
- `trustedProxies`: IP reverse proxy, які завершують TLS або inject forwarded-client headers. Додавайте лише proxy, які ви контролюєте. Loopback entries усе ще чинні для same-host proxy/local-detection налаштувань (наприклад Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback requests придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий CIDR/IP allowlist для автоматичного схвалення першого pairing пристрою node без запитаних scopes. Вимкнено, коли не задано. Це не схвалює автоматично operator/browser/Control UI/WebChat pairing і не схвалює автоматично оновлення ролі, scope, metadata або public-key.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне allow/deny shaping для оголошених команд node після pairing і оцінки platform allowlist. Використовуйте `allowCommands`, щоб opt into небезпечні команди node, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо platform default або явний allow інакше включив би її. Після зміни node свого оголошеного списку команд відхиліть і повторно схваліть pairing цього пристрою, щоб gateway зберіг оновлений command snapshot.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий deny list).
- `gateway.tools.allow`: вилучити назви інструментів із типового HTTP deny list.

</Accordion>

### OpenAI-compatible endpoints

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL-input hardening:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlists вважаються незаданими; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false` та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути URL fetching.
- Необов’язковий response hardening header:
  - `gateway.http.securityHeaders.strictTransportSecurity` (встановлюйте лише для HTTPS origins, які ви контролюєте; див. [Автентифікація через довірений proxy](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох інстансів

Запустіть кілька gateways на одному хості з унікальними портами та state dirs:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Зручні прапорці: `--dev` (використовує `~/.openclaw-dev` + порт `19001`), `--profile <name>` (використовує `~/.openclaw-<name>`).

Див. [Кілька Gateways](/uk/gateway/multiple-gateways).

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

- `enabled`: вмикає TLS termination на listener gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну self-signed пару cert/key, коли явні файли не налаштовано; лише для local/dev використання.
- `certPath`: filesystem path до файлу TLS certificate.
- `keyPath`: filesystem path до файлу TLS private key; тримайте permissions обмеженими.
- `caPath`: необов’язковий path до CA bundle для client verification або custom trust chains.

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

- `mode`: керує тим, як config edits застосовуються під час runtime.
  - `"off"`: ігнорувати live edits; зміни потребують явного restart.
  - `"restart"`: завжди restart процес gateway у разі config change.
  - `"hot"`: застосовувати changes in-process без restart.
  - `"hybrid"` (типово): спершу спробувати hot reload; fallback до restart, якщо потрібно.
- `debounceMs`: debounce window у ms перед застосуванням config changes (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у ms очікування in-flight operations перед примусовим restart. Пропустіть, щоб використати типовий bounded wait (`300000`); встановіть `0`, щоб чекати необмежено довго й логувати періодичні still-pending warnings.

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

Автентифікація: `Authorization: Bearer <token>` або `x-openclaw-token: <token>`.
Токени хуків у рядку запиту відхиляються.

Нотатки щодо перевірки та безпеки:

- `hooks.enabled=true` вимагає непорожнього `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад, `["hook:"]`).
- Якщо зіставлення або пресет використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі зіставлення не потребують цієї явної згоди.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з корисного навантаження запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розпізнається через `hooks.mappings`
  - Значення `sessionKey` зіставлення, згенеровані шаблоном, вважаються наданими ззовні й також вимагають `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` збігається з підшляхом після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` збігається з полем корисного навантаження для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з корисного навантаження.
- `transform` може вказувати на модуль JS/TS, що повертає дію хука.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та обхід каталогів відхиляються).
  - Тримайте `hooks.transformsDir` у межах `~/.openclaw/hooks/transforms`; каталоги Skills робочої області відхиляються. Якщо `openclaw doctor` повідомляє, що цей шлях недійсний, перемістіть модуль трансформації до каталогу трансформацій хуків або видаліть `hooks.transformsDir`.
- `agentId` маршрутизує до конкретного агента; невідомі ID повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити все, `[]` = заборонити все).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків агента хука без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і ключам сесій зіставлення на основі шаблонів задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + зіставлення), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-яке зіставлення або пресет використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску хука (має бути дозволена, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований пресет Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте цю маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору назв Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібно `hooks.allowRequestSessionKey: false`, перевизначте пресет статичним `sessionKey` замість типового шаблонного значення.

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

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, якщо налаштовано. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
- Не запускайте окремий `gog gmail watch serve` поряд із Gateway.

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

- Обслуговує HTML/CSS/JS, які може редагувати агент, і A2UI через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Прив’язки не до loopback: маршрути canvas вимагають автентифікації Gateway (токен/пароль/довірений проксі), як і інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки автентифікації; після спарювання та підключення вузла Gateway оголошує URL можливостей, прив’язані до вузла, для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії вузла та швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт живого перезавантаження в HTML, що обслуговується.
- Автоматично створює стартовий `index.html`, коли порожньо.
- Також обслуговує A2UI за `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
- Вимикайте живе перезавантаження для великих каталогів або помилок `EMFILE`.

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

- `minimal` (типово, коли ввімкнено вбудований plugin `bonjour`): пропускає `cliPath` + `sshPort` у записах TXT.
- `full`: включає `cliPath` + `sshPort`; multicast-реклама в LAN все одно вимагає ввімкненого вбудованого plugin `bonjour`.
- `off`: пригнічує multicast-рекламу в LAN без зміни ввімкнення plugin.
- Вбудований plugin `bonjour` автоматично запускається на хостах macOS і вмикається вручну в розгортаннях Gateway на Linux, Windows і в контейнерах.
- Ім’я хоста типово дорівнює системному імені хоста, коли воно є дійсною DNS-міткою; інакше використовується `openclaw`. Перевизначте за допомогою `OPENCLAW_MDNS_HOSTNAME`.

### Широка зона (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує unicast-зону DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднайте із DNS-сервером (рекомендовано CoreDNS) + Tailscale split DNS.

Налаштування: `openclaw dns setup --apply`.

---

## Середовище

### `env` (inline-змінні середовища)

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

- Inline-змінні середовища застосовуються лише якщо в середовищі процесу бракує ключа.
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login-оболонки.
- Повний порядок пріоритетів див. у [Середовище](/uk/help/environment).

### Підстановка змінних середовища

Посилайтеся на змінні середовища в будь-якому конфігураційному рядку через `${VAR_NAME}`:

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

- Шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- Шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- ids для `source: "exec"` не повинні містити сегменти шляху, розділені скісними рисками, `.` або `..` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включено до runtime-розв’язання та покриття аудиту.

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
- Шляхи провайдерів file та exec відмовляють закрито, коли перевірка Windows ACL недоступна. Встановлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` потребує абсолютного шляху `command` і використовує протокольні payload-и у stdin/stdout.
- За замовчуванням шляхи команд через symlink відхиляються. Встановіть `allowSymlinkCommand: true`, щоб дозволити symlink-шляхи з перевіркою розв’язаного цільового шляху.
- Якщо `trustedDirs` налаштовано, перевірка довіреного каталогу застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` за замовчуванням мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв’язуються під час активації в in-memory знімок, після чого шляхи запитів читають лише цей знімок.
- Фільтрація активної поверхні застосовується під час активації: нерозв’язані посилання на ввімкнених поверхнях призводять до збою запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

---

## Зберігання автентифікації

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
- Застарілі плоскі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є runtime-форматом; `openclaw doctor --fix` переписує їх у канонічні API-key профілі `provider:default` із резервною копією `.legacy-flat.*.bak`.
- Профілі OAuth-режиму (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-профілю на основі SecretRef.
- Статичні runtime-облікові дані надходять із розв’язаних in-memory знімків; застарілі статичні записи `auth.json` очищаються, коли їх виявлено.
- Застарілі імпорти OAuth надходять із `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: базове відтермінування в годинах, коли профіль завершується невдало через справжні помилки
  білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг може
  все одно потрапити сюди навіть у відповідях `401`/`403`, але текстові
  зіставлювачі, специфічні для провайдера, залишаються обмеженими провайдером,
  якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Повідомлення
  про повторювані HTTP `402` для вікна використання або ліміту витрат
  організації/робочого простору натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин білінгового відтермінування для окремих провайдерів.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання білінгового відтермінування (типово: `24`).
- `authPermanentBackoffMinutes`: базове відтермінування в хвилинах для високодостовірних збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: обмеження в хвилинах для зростання відтермінування `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників відтермінування (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для помилок перевантаження перед перемиканням на резервну модель (типово: `1`). Форми зайнятості провайдера, як-от `ModelNotReadyException`, потрапляють сюди.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для помилок обмеження швидкості перед перемиканням на резервну модель (типово: `1`). Цей кошик обмеження швидкості містить текст, сформований провайдерами, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `consoleLevel` підвищується до `debug`, коли задано `--verbose`.
- `maxFileBytes`: максимальний розмір активного файлу журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 МБ). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування за принципом найкращого зусилля для консольного виводу, файлових журналів, записів журналу OTLP і збереженого тексту транскрипту сеансу. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/транскриптів; UI, інструментальні й діагностичні поверхні безпеки все одно редагують секрети перед передаванням.

---

## Діагностика

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

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
- `flags`: масив рядків прапорців, що вмикають цільовий вивід журналів (підтримує символи узагальнення, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку без прогресу в мс для класифікації довготривалих сеансів обробки як `session.long_running`, `session.stalled` або `session.stuck`. Відповідь, інструмент, статус, блок і прогрес ACP скидають таймер; повторювана діагностика `session.stuck` відтерміновується, доки стан не змінюється.
- `stuckSessionAbortMs`: поріг віку без прогресу в мс, після якого відповідну призупинену активну роботу можна аварійно злити для відновлення. Якщо не задано, OpenClaw використовує безпечніше розширене вікно вбудованого запуску щонайменше 10 хвилин і 5x `stuckSessionWarnMs`.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. в [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові кінцеві точки OTLP для окремих сигналів. Коли задані, вони перевизначають `otel.endpoint` лише для цього сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт трас, метрик або журналів.
- `otel.sampleRate`: частота вибірки трас `0`–`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання телеметрії в мс.
- `otel.captureContent`: opt-in захоплення сирого вмісту для атрибутів span OTEL. Типово вимкнено. Булеве `true` захоплює несистемний вміст повідомлень/інструментів; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: змінна середовища для найновіших експериментальних атрибутів провайдера span GenAI. Типово span зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: змінна середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/завершення роботи SDK, що належить plugin, зберігаючи активними діагностичні слухачі.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища кінцевих точок для окремих сигналів, що використовуються, коли відповідний ключ конфігурації не задано.
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

- `channel`: канал випуску для npm/git інсталяцій — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для пакетних інсталяцій (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням stable-каналу (типово: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання stable-каналу в годинах (типово: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки beta-каналу в годинах (типово: `1`; максимум: `24`).

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

- `enabled`: глобальний функціональний шлюз ACP (типово: `true`; задайте `false`, щоб приховати диспетчеризацію ACP і засоби породження).
- `dispatch.enabled`: незалежний шлюз для диспетчеризації ходу сеансу ACP (типово: `true`). Задайте `false`, щоб залишити команди ACP доступними, блокуючи виконання.
- `backend`: типовий ідентифікатор backend середовища виконання ACP (має збігатися із зареєстрованим ACP runtime plugin).
  Спершу встановіть backend plugin, і якщо задано `plugins.allow`, додайте ідентифікатор backend plugin (наприклад, `acpx`), інакше backend ACP не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли породження не задають явну ціль.
- `allowedAgents`: allowlist ідентифікаторів агентів, дозволених для сеансів середовища виконання ACP; порожній список означає відсутність додаткового обмеження.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сеансів ACP.
- `stream.coalesceIdleMs`: вікно скидання простою в мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед поділом проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів у межах ходу (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потоково інкрементально; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, що проєктується за хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис імен тегів до булевих перевизначень видимості для потокових подій.
- `runtime.ttlMinutes`: TTL простою в хвилинах для працівників сеансу ACP перед можливою очисткою.
- `runtime.installCommand`: необов’язкова команда інсталяції, яку потрібно виконати під час початкового налаштування середовища виконання ACP.

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
  - `"random"` (типово): змінні жартівливі/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (назва/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), задайте env `OPENCLAW_HIDE_BANNER=1`.

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

Див. поля ідентичності `agents.list` у [типових параметрах агента](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застарілий, вилучено)

Поточні збірки більше не містять TCP-міст. Nodes підключаються через WebSocket Gateway. Ключі `bridge.*` більше не входять до схеми конфігурації (валідація завершується помилкою, доки їх не вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

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

- `sessionRetention`: як довго зберігати завершені ізольовані сеанси запусків Cron перед очищенням із `sessions.json`. Також керує очищенням заархівованих видалених стенограм Cron. Типово: `24h`; встановіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір кожного файлу журналу запуску (`cron/runs/<jobId>.jsonl`) перед очищенням. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки, що зберігаються, коли спрацьовує очищення журналу запуску. Типово: `2000`.
- `webhookToken`: bearer-токен, що використовується для POST-доставлення Cron Webhook (`delivery.mode = "webhook"`); якщо його не вказано, заголовок автентифікації не надсилається.
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
- `backoffMs`: масив затримок відступу в мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, що запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Не вказуйте, щоб повторювати всі тимчасові типи.

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
- `after`: кількість послідовних збоїв перед спрацьовуванням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `includeSkipped`: враховувати послідовні пропущені запуски в поріг сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на відступ помилок виконання.
- `mode`: режим доставлення — `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує в налаштований Webhook.
- `accountId`: необов’язковий ідентифікатор облікового запису або каналу для обмеження області доставлення сповіщень.

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

- Типове місце призначення для сповіщень про збої Cron в усіх завданнях.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних цілі.
- `channel`: перевизначення каналу для доставлення оголошення. `"last"` повторно використовує останній відомий канал доставлення.
- `to`: явна ціль оголошення або URL Webhook. Обов’язково для режиму Webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставлення.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли ні глобальне, ні призначене для окремого завдання місце призначення збоїв не встановлено, завдання, які вже доставляються через `announce`, у разі збою повертаються до цієї основної цілі оголошення.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не є `"webhook"`.

Див. [Завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання Cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблонів медіамоделі

Заповнювачі шаблонів, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повне тіло вхідного повідомлення                  |
| `{{RawBody}}`      | Сире тіло (без обгорток історії/відправника)      |
| `{{BodyStripped}}` | Тіло з вилученими згадками груп                   |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                 |
| `{{SessionId}}`    | UUID поточного сеансу                             |
| `{{IsNewSession}}` | `"true"`, коли створено новий сеанс               |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (зображення/аудіо/документ/…)           |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Розв’язаний медіапромпт для записів CLI           |
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

**Поведінка злиття:**

- Один файл: замінює об’єкт, що його містить.
- Масив файлів: глибоко зливається по порядку (пізніші перевизначають раніші).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: розв’язуються відносно файлу, що включає, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми/форми з `../` дозволені лише тоді, коли вони все ще розв’язуються всередині цієї межі.
- Записи, що належать OpenClaw і змінюють лише один розділ верхнього рівня, підкріплений однофайловим включенням, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` незмінним.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, що належать OpenClaw; такі записи завершуються закритою помилкою замість вирівнювання конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних включень.

---

_Пов’язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
