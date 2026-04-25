---
read_when:
    - Вам потрібні точні семантики полів конфігурації або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналів, моделей, Gateway або інструментів
summary: Довідка з конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідка з конфігурації
x-i18n:
    generated_at: "2026-04-25T05:55:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fc32c7387a8ece01020342186b52202d954a44c6db3fa827a5ed4302e995af7
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Основна довідка з конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Configuration](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і містить посилання назовні, коли підсистема має власну глибшу довідку. Каталоги команд, що належать каналам і Plugin, а також глибокі параметри пам’яті/QMD розміщено на окремих сторінках, а не тут.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, яка використовується для валідації та Control UI, із вбудованими метаданими Plugin/каналів, об’єднаними за наявності
- `config.schema.lookup` повертає один вузол схеми для певного шляху для інструментів детального перегляду
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють baseline hash документації конфігурації щодо поточної поверхні схеми

Окремі глибокі довідники:

- [Memory configuration reference](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/uk/tools/slash-commands) для поточного каталогу вбудованих + bundled команд
- сторінки каналів/Plugin-власників для поверхонь команд, специфічних для каналу

Формат конфігурації — **JSON5** (дозволено коментарі та завершаючі коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, якщо їх не задано.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на окрему сторінку — див.
[Configuration — channels](/uk/gateway/config-channels) для `channels.*`,
включно зі Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та іншими
bundled каналами (автентифікація, контроль доступу, кілька облікових записів, обмеження за згадками).

## Типові значення агента, мультиагентність, сесії та повідомлення

Перенесено на окрему сторінку — див.
[Configuration — agents](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, thinking, heartbeat, пам’ять, медіа, Skills, sandbox)
- `multiAgent.*` (маршрутизація та прив’язки мультиагентності)
- `session.*` (життєвий цикл сесії, compaction, prунінг)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає типове для платформи вікно паузи перед надсиланням транскрипту (`700 ms на macOS та Android, 900 ms на iOS`)

## Інструменти та власні провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів із підтримкою провайдерів і налаштування власних провайдерів / base-URL перенесені на окрему сторінку — див.
[Configuration — tools and custom providers](/uk/gateway/config-tools).

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

- `allowBundled`: необов’язковий allowlist лише для bundled Skills (керовані/робочі Skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені Skills (найнижчий пріоритет).
- `install.preferBrew`: якщо true, віддавати перевагу інсталяторам Homebrew, коли `brew`
  доступний, перед переходом до інших типів інсталяторів.
- `install.nodeManager`: пріоритет менеджера Node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: спрощене поле для Skills, які оголошують основну env-змінну (рядок відкритого тексту або об’єкт SecretRef).

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

- Завантажуються з `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` і `plugins.load.paths`.
- Виявлення приймає нативні Plugin OpenClaw, а також сумісні bundles Codex і Claude, включно з bundles Claude зі стандартним макетом без manifest.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий allowlist (завантажуються лише перелічені Plugin). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: спрощене поле API-ключа на рівні Plugin (коли підтримується Plugin).
- `plugins.entries.<id>.env`: мапа env-змінних у межах Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` і ігнорує поля, що змінюють prompt, із застарілого `before_agent_start`, зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hooks Plugin і підтримуваних директорій hooks, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені неbundled Plugin можуть читати сирий вміст розмови з типізованих hooks, таких як `llm_input`, `llm_output` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряти цьому Plugin запитувати перевизначення `provider` і `model` для окремого запуску фонових subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"`, лише якщо свідомо хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений Plugin (валідується схемою нативного Plugin OpenClaw, якщо доступна).
- Налаштування облікового запису/runtime для Plugin-каналів розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` у manifest Plugin-власника, а не центральним реєстром параметрів OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера Firecrawl web-fetch.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Використовує резервне значення з `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілого `tools.web.fetch.firecrawl.apiKey` або env-змінної `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут scrape-запиту в секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok, яку використовувати для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: Cron-каденція для кожного повного циклу dreaming (типово `"0 3 * * *"`).
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті міститься в [Memory configuration reference](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Plugin-бандли Claude також можуть додавати вбудовані типові значення Pi з `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати id активного Plugin пам’яті або `"none"`, щоб вимкнути Plugin пам’яті.
- `plugins.slots.contextEngine`: вибрати id активного Plugin engine контексту; типово `"legacy"`, якщо ви не встановили й не вибрали інший engine.
- `plugins.installs`: керовані CLI метадані встановлення, які використовує `openclaw plugins update`.
  - Містить `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Сприймайте `plugins.installs.*` як керований стан; віддавайте перевагу командам CLI замість ручного редагування.

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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тому навігація браузера за замовчуванням лишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`, лише якщо ви свідомо довіряєте навігації браузера в приватній мережі.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підпадають під ті самі обмеження приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі є лише attach-only (start/stop/reset недоступні).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), якщо хочете, щоб OpenClaw виявив `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL WebSocket DevTools.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися
  на вибраному хості або через підключений browser Node.
- Профілі `existing-session` можуть встановлювати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на базі Chromium, такий як Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання на CSS-selector, hooks завантаження одного файлу,
  відсутність перевизначення тайм-ауту діалогів, відсутність `wait --load networkidle`, а також
  `responsebody`, експорту PDF, перехоплення завантажень чи пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Локальні керовані профілі можуть встановлювати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший — у Brave.
- Порядок автодетекції: браузер за замовчуванням, якщо він на базі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` приймає `~` для домашньої директорії вашої ОС.
- Сервіс керування: лише loopback (порт похідний від `gateway.port`, типово `18791`).
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

- `seamColor`: колір акценту для chrome інтерфейсу нативного застосунку (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення ідентичності в Control UI. Використовує резервне значення з ідентичності активного агента.

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

<Accordion title="Докладно про поля Gateway">

- `mode`: `local` (запустити gateway) або `remote` (підключитися до віддаленого gateway). Gateway відмовляється запускатися, якщо не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише Tailscale IP) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типове значення bind `loopback` слухає `127.0.0.1` всередині контейнера. За мережі Docker bridge (`-p 18789:18789`) трафік надходить через `eth0`, тому gateway недосяжний. Використовуйте `--network host` або встановіть `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: обов’язкова за замовчуванням. Прив’язки не до loopback вимагають auth gateway. На практиці це означає спільний token/password або reverse proxy з контролем ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер onboarding типово генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRef), явно встановіть `gateway.auth.mode` у `token` або `password`. Під час запуску та в потоках встановлення/відновлення сервісу виникає помилка, якщо налаштовано обидва, а mode не задано.
- `gateway.auth.mode: "none"`: явний режим без auth. Використовуйте лише для довірених локальних налаштувань local loopback; цей варіант навмисно не пропонується в підказках onboarding.
- `gateway.auth.mode: "trusted-proxy"`: делегувати auth reverse proxy з контролем ідентичності та довіряти заголовкам ідентичності від `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **не-loopback** джерело proxy; reverse proxy на тому самому хості через loopback не задовольняють auth trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти auth Control UI/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю auth через заголовки Tailscale; для них застосовується звичайний режим HTTP auth gateway. Цей безтокенний потік припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий лімітатор невдалих auth-спроб. Застосовується окремо для кожного IP клієнта та для кожного scope auth (спільний секрет і token пристрою відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом невдачі. Тому одночасні помилкові спроби від того самого клієнта можуть спровокувати лімітатор на другому запиті замість того, щоб обидві просто завершилися звичайною невідповідністю.
  - `gateway.auth.rateLimit.exemptLoopback` типово дорівнює `true`; встановіть `false`, якщо свідомо хочете також обмежувати трафік localhost (для тестових налаштувань або строгих proxy-розгортань).
- Спроби WS auth із browser-origin завжди обмежуються з вимкненим винятком loopback (додатковий захист від brute force localhost через браузер).
- На loopback ці блокування для browser-origin ізольовані за нормалізованим значенням `Origin`,
  тому повторні збої з одного origin localhost не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind до loopback) або `funnel` (публічний, потребує auth).
- `controlUi.allowedOrigins`: явний allowlist browser-origin для підключень WebSocket до Gateway. Обов’язковий, коли очікуються клієнти браузера з не-loopback origin.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, що вмикає fallback origin за заголовком Host для розгортань, які навмисно покладаються на політику origin за заголовком Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійний client-side override
  у середовищі процесу, який дозволяє незашифрований `ws://` до довірених IP
  приватної мережі; за замовчуванням незашифрований трафік як і раніше дозволено лише для loopback. Еквівалента в `openclaw.json` немає, а конфігурація приватної мережі браузера, така як
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнти
  WebSocket Gateway.
- `gateway.remote.token` / `.password`: поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують auth gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL зовнішнього relay APNs, який використовується офіційними/TestFlight збірками iOS після публікації relay-backed реєстрацій у gateway. Цей URL має збігатися з URL relay, зібраним у збірку iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від gateway до relay у мілісекундах. Типово `10000`.
- Реєстрації з relay-backed прив’язуються до конкретної ідентичності gateway. Сполучений застосунок iOS викликає `gateway.identity.get`, включає цю ідентичність до реєстрації relay і пересилає до gateway send grant на рівні реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env-перевизначення для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: лише для розробки — аварійний дозвіл на loopback HTTP relay URL. У production URL relay мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал моніторингу здоров’я каналу в хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски health-monitor. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на канал/обліковий запис за ковзну годину. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: відмова від перезапусків health-monitor на рівні каналу зі збереженням увімкненого глобального монітора.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення на рівні облікового запису для каналів із кількома обліковими записами. Якщо задано, має пріоритет над перевизначенням на рівні каналу.
- Локальні шляхи викликів gateway можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і їх не вдається розв’язати, розв’язання завершується fail-closed (без маскування через fallback на remote).
- `trustedProxies`: IP reverse proxy, які завершують TLS або вставляють заголовки forwarded-client. Додавайте лише ті proxy, які ви контролюєте. Записи loopback усе ще валідні для налаштувань proxy/local-detection на тому самому хості (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для fail-closed поведінки.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий allowlist CIDR/IP для автоматичного підтвердження першого сполучення пристрою вузла без запитаних scope. Якщо не задано, вимкнено. Це не підтверджує автоматично сполучення operator/browser/Control UI/WebChat і не підтверджує автоматично оновлення role, scope, metadata чи public-key.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд вузлів після сполучення та перевірки allowlist.
- `gateway.tools.deny`: додаткові імена інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий deny list).
- `gateway.tools.allow`: прибрати імена інструментів із типового HTTP deny list.

</Accordion>

### OpenAI-сумісні кінцеві точки

- Chat Completions: вимкнено за замовчуванням. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-входів Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlist трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (установлюйте лише для HTTPS origin, які ви контролюєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

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

- `enabled`: вмикає завершення TLS на listener gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, коли явні файли не налаштовано; лише для local/dev.
- `certPath`: шлях у файловій системі до файлу сертифіката TLS.
- `keyPath`: шлях у файловій системі до приватного ключа TLS; обмежте права доступу.
- `caPath`: необов’язковий шлях до пакета CA для верифікації клієнта або власних ланцюгів довіри.

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
  - `"off"`: ігнорувати live-зміни; для змін потрібен явний перезапуск.
  - `"restart"`: завжди перезапускати процес gateway після зміни конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати hot reload; за потреби перейти до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: максимальний час у мс очікування завершення операцій у процесі перед примусовим перезапуском (типово: `300000` = 5 хвилин).

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
Токени hook у query string відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` вимагає непорожній `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання token Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонний `sessionKey`, установіть `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping не потребують цього opt-in.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із payload запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` у mapping, згенеровані шаблоном, розглядаються як зовнішньо передані й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Докладно про mapping">

- `match.path` відповідає підшляху після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` відповідає полю payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають значення з payload.
- `transform` може вказувати на модуль JS/TS, який повертає дію hook.
  - `transform.module` має бути відносним шляхом і лишатися в межах `hooks.transformsDir` (абсолютні шляхи й traversal відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ID повертаються до типового значення.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або не задано = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків агента через hook без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і ключам сесій mapping, керованим шаблонами, задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий allowlist префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Стає обов’язковим, коли будь-який mapping або preset використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволена, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте цю маршрутизацію для кожного повідомлення, установіть `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібно `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість шаблонного типового значення.

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

- Обслуговує HTML/CSS/JS, які агент може редагувати, і A2UI через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: зберігайте `gateway.bind: "loopback"` (типово).
- Прив’язки не до loopback: маршрути canvas вимагають auth Gateway (token/password/trusted-proxy), як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки auth; після сполучення й підключення вузла Gateway рекламує URL можливостей із scope вузла для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії вузла та швидко спливають. Fallback на основі IP не використовується.
- Впроваджує клієнт live-reload у HTML, що обслуговується.
- Автоматично створює стартовий `index.html`, якщо каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
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

- `minimal` (типово): не включає `cliPath` + `sshPort` до TXT-записів.
- `full`: включає `cliPath` + `sshPort`.
- Ім’я хоста типово `openclaw`. Перевизначте через `OPENCLAW_MDNS_HOSTNAME`.

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

### `env` (вбудовані env-змінні)

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

- Вбудовані env-змінні застосовуються лише якщо в середовищі процесу відсутній цей ключ.
- Файли `.env`: `.env` поточного робочого каталогу + `~/.openclaw/.env` (жоден із них не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний пріоритет див. у [Environment](/uk/help/environment).

### Підстановка env-змінних

Посилайтеся на env-змінні в будь-якому рядку конфігурації через `${VAR_NAME}`:

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

Посилання на секрети є адитивними: значення відкритим текстом також працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id для `source: "exec"` не мають містити сегменти шляху `.` або `..`, розділені слешами (наприклад `a/../b` відхиляється)

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
- Шляхи провайдера file та exec завершуються fail-closed, якщо перевірка Windows ACL недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` вимагає абсолютний шлях `command` і використовує payload-и протоколу через stdin/stdout.
- За замовчуванням шляхи команд-символічних посилань відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи-символічні посилання, водночас перевіряючи шлях до розв’язаного цільового файлу.
- Якщо налаштовано `trustedDirs`, перевірка довірених каталогів застосовується до шляху розв’язаного цільового файлу.
- Дочірнє середовище `exec` за замовчуванням мінімальне; явно передайте потрібні змінні через `passEnv`.
- Посилання на секрети розв’язуються під час активації в знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Під час активації застосовується фільтрація активної поверхні: нерозв’язані посилання на ввімкнених поверхнях призводять до помилки запуску/reload, а неактивні поверхні пропускаються з діагностикою.

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

- Профілі для кожного агента зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Профілі режиму OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані профілів auth на основі SecretRef.
- Статичні runtime-облікові дані надходять із розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються, коли їх виявлено.
- Застарілий імпорт OAuth із `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Поведінка runtime секретів і інструменти `audit/configure/apply`: [Secrets Management](/uk/gateway/secrets).

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

- `billingBackoffHours`: базова затримка в годинах, коли профіль завершується помилкою через справжні помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг
  усе ще може потрапляти сюди навіть для відповідей `401`/`403`, але
  провайдер-специфічні текстові зіставлення лишаються обмеженими тим провайдером,
  якому вони належать (наприклад, OpenRouter
  `Key limit exceeded`). Повторювані повідомлення HTTP `402` про usage-window або
  ліміти витрат organization/workspace натомість лишаються в гілці `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин затримки білінгу для кожного провайдера.
- `billingMaxHours`: межа в годинах для експоненційного зростання затримки білінгу (типово: `24`).
- `authPermanentBackoffMinutes`: базова затримка в хвилинах для high-confidence збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: межа в хвилинах для зростання затримки `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників затримок (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для помилок перевантаження перед переходом до fallback моделі (типово: `1`). Сюди потрапляють форми зайнятості провайдера, як-от `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для помилок rate-limit перед переходом до fallback моделі (типово: `1`). Цей bucket rate-limit включає характерний для провайдерів текст, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

---

## Логування

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
- Установіть `logging.file` для сталого шляху.
- `consoleLevel` підвищується до `debug`, коли використано `--verbose`.
- `maxFileBytes`: максимальний розмір файлу журналу в байтах, після якого записи пригнічуються (додатне ціле число; типово: `524288000` = 500 MB). Для production-розгортань використовуйте зовнішню ротацію журналів.

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
- `flags`: масив рядків-прапорців, які вмикають цільовий вивід журналу (підтримуються wildcard, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для виведення попереджень про завислі сесії, поки сесія лишається в стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`).
- `otel.endpoint`: URL collector для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються з запитами експорту OTel.
- `otel.serviceName`: ім’я сервісу для атрибутів resource.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнення експорту trace, metrics або logs.
- `otel.sampleRate`: частота семплювання trace `0`–`1`.
- `otel.flushIntervalMs`: періодичний інтервал flush телеметрії в мс.
- `otel.captureContent`: opt-in захоплення сирого вмісту для атрибутів span OTEL. Типово вимкнено. Булеве значення `true` захоплює вміст повідомлень/інструментів, крім system; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `cacheTrace.enabled`: журналювати знімки cache trace для embedded-запусків (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL cache trace (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається до виводу cache trace (усі типово: `true`).

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
- `auto.enabled`: увімкнути фонове автооновлення для пакетних встановлень (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автозастосуванням stable-каналу (типово: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання stable-каналу в годинах (типово: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки beta-каналу в годинах (типово: `1`; максимум: `24`).

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

- `enabled`: глобальний feature gate для ACP (типово: `false`).
- `dispatch.enabled`: незалежний gate для dispatch ходів сесії ACP (типово: `true`). Установіть `false`, щоб команди ACP лишалися доступними, але виконання блокувалося.
- `backend`: id типового runtime backend ACP (має відповідати зареєстрованому runtime plugin ACP).
- `defaultAgent`: fallback id цільового агента ACP, коли спавни не вказують явну ціль.
- `allowedAgents`: allowlist id агентів, дозволених для runtime-сесій ACP; порожнє значення означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір chunk перед розбиттям проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки status/tool на хід (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потік інкрементально; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій tool (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, проєктованих за один хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків status/update ACP.
- `stream.tagVisibility`: запис назв тегів у логічні перевизначення видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для воркерів сесій ACP до моменту можливого очищення.
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

- `cli.banner.taglineMode` керує стилем tagline банера:
  - `"random"` (типово): змінні кумедні/сезонні tagline.
  - `"default"`: фіксований нейтральний tagline (`Усі ваші чати, один OpenClaw.`).
  - `"off"`: без тексту tagline (назва/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише tagline), установіть env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Метадані, які записуються потоками покрокового налаштування CLI (`onboard`, `configure`, `doctor`):

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

Див. поля ідентичності `agents.list` у розділі [Agent defaults](/uk/gateway/config-agents#agent-defaults).

---

## Bridge (застарілий, видалено)

Поточні збірки більше не містять TCP bridge. Вузли підключаються через WebSocket Gateway. Ключі `bridge.*` більше не входять до схеми конфігурації (валідація завершується помилкою, доки їх не буде видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

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

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запуску cron перед pruning із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. Типово: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файлу журналу одного запуску (`cron/runs/<jobId>.jsonl`) перед pruning. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки, що зберігаються, коли запускається pruning журналу запуску. Типово: `2000`.
- `webhookToken`: bearer token, що використовується для POST-доставки webhook cron (`delivery.mode = "webhook"`); якщо не задано, заголовок auth не надсилається.
- `webhook`: застарілий legacy fallback URL webhook (http/https), який використовується лише для збережених завдань, що все ще мають `notify: true`.

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
- `backoffMs`: масив затримок backoff у мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1–10 елементів).
- `retryOn`: типи помилок, які спричиняють повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Не вказуйте, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових cron-завдань. Для повторюваних завдань використовується окрема обробка помилок.

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

- `enabled`: увімкнути сповіщення про збої для cron-завдань (типово: `false`).
- `after`: кількість послідовних збоїв перед спрацюванням сповіщення (додатне ціле число, мінімум: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` виконує POST на налаштований webhook.
- `accountId`: необов’язковий id облікового запису або каналу для обмеження доставки сповіщень.

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

- Типове призначення для сповіщень про збої cron для всіх завдань.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних цілі.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL webhook. Обов’язкове для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` на рівні завдання перевизначає це глобальне типове значення.
- Коли не задано ні глобальне, ні рівень завдання failure destination, завдання, які вже доставляють через `announce`, у разі збою використовують як fallback цю основну announce-ціль.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [background tasks](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Заповнювачі шаблону, що розгортаються в `tools.media.models[].args`:

| Змінна            | Опис                                              |
| ----------------- | ------------------------------------------------- |
| `{{Body}}`        | Повний текст вхідного повідомлення                |
| `{{RawBody}}`     | Сирий текст (без обгорток історії/відправника)    |
| `{{BodyStripped}}`| Текст без групових згадок                         |
| `{{From}}`        | Ідентифікатор відправника                         |
| `{{To}}`          | Ідентифікатор призначення                         |
| `{{MessageSid}}`  | id повідомлення каналу                            |
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
| `{{GroupMembers}}`| Попередній список учасників групи (best effort)   |
| `{{SenderName}}`  | Відображуване ім’я відправника (best effort)      |
| `{{SenderE164}}`  | Номер телефону відправника (best effort)          |
| `{{Provider}}`    | Підказка провайдера (whatsapp, telegram, discord тощо) |

---

## Включення конфігурації (`$include`)

Розбийте конфігурацію на кілька файлів:

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
- Масив файлів: deep-merge у заданому порядку (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після includes (перевизначають включені значення).
- Вкладені includes: до 10 рівнів углиб.
- Шляхи: розв’язуються відносно файла, що включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми/`../` дозволені лише тоді, коли після розв’язання вони все одно лишаються в межах цієї границі.
- Записи, керовані OpenClaw, які змінюють лише один розділ верхнього рівня, підкріплений include одного файла, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Root includes, масиви include і includes із сусідніми перевизначеннями є read-only для записів, керованих OpenClaw; такі записи завершуються fail-closed замість сплощення конфігурації.
- Помилки: чіткі повідомлення для відсутніх файлів, помилок парсингу та циклічних includes.

---

_Пов’язане: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Configuration](/uk/gateway/configuration)
- [Configuration examples](/uk/gateway/configuration-examples)
