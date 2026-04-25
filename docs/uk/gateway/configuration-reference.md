---
read_when:
    - Вам потрібні точні семантики полів конфігурації або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник із конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-04-25T05:04:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2953146dc071c5fb5c9e7cdf628f92a4c12b3f30d21815626ed43de0bf39193f
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Основний довідник із конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Configuration](/uk/gateway/configuration).

Ця сторінка охоплює основні поверхні конфігурації OpenClaw і містить посилання назовні, коли підсистема має власний, глибший довідник. Вона **не** намагається вбудувати на одну сторінку кожен каталог команд, що належить каналу/Plugin, або кожен глибокий параметр пам’яті/QMD.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими bundled/Plugin/channel, якщо вони доступні
- `config.schema.lookup` повертає один вузол схеми з областю дії шляху для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий hash документації конфігурації відносно поточної поверхні схеми

Окремі глибокі довідники:

- [Memory configuration reference](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідних каналів/Plugin для поверхонь команд, специфічних для каналу

Формат конфігурації — **JSON5** (дозволені коментарі й кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, якщо їх не вказано.

---

## Канали

Ключі конфігурації для кожного каналу перенесено на окрему сторінку — див.
[Configuration — channels](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, обмеження згадок).

## Типові значення агента, мультиагентність, сесії та повідомлення

Перенесено на окрему сторінку — див.
[Configuration — agents](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, thinking, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (маршрутизація та прив’язки мультиагентності)
- `session.*` (життєвий цикл сесії, compaction, очищення)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає типовий для платформи інтервал паузи перед надсиланням транскрипту (`700 ms на macOS і Android, 900 ms на iOS`)

## Інструменти та власні провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів із підтримкою провайдерів, а також налаштування власних провайдерів / базових URL перенесено на окрему сторінку — див.
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

- `allowBundled`: необов’язковий список дозволу лише для bundled Skills (керовані/робочі Skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені Skills (найнижчий пріоритет).
- `install.preferBrew`: якщо `true`, надавати перевагу інсталяторам Homebrew, коли `brew` доступний, перш ніж переходити до інших типів інсталяторів.
- `install.nodeManager`: пріоритет інсталятора Node для специфікацій `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він bundled/встановлений.
- `entries.<skillKey>.apiKey`: зручне поле для Skills, які оголошують основну змінну середовища (простий текстовий рядок або об’єкт SecretRef).

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
- Виявлення підтримує нативні Plugins OpenClaw, а також сумісні пакети Codex і Claude, зокрема пакети Claude без manifest із типовим макетом.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий список дозволу (завантажуються лише вказані Plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні Plugin (коли підтримується Plugin).
- `plugins.entries.<id>.env`: мапа змінних середовища з областю дії Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` та ігнорує поля мутації prompt із застарілого `before_agent_start`, зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hooks Plugin і підтримуваних каталогів hooks, наданих пакетами.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені не-bundled Plugins можуть читати необроблений вміст розмови з типізованих hooks, таких як `llm_input`, `llm_output` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряти цьому Plugin запитувати перевизначення `provider` і `model` для конкретного запуску фонових підзапусків субагента.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволу канонічних цілей `provider/model` для довірених перевизначень субагента. Використовуйте `"*"`, лише якщо свідомо хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений Plugin (валідується схемою нативного Plugin OpenClaw, якщо доступна).
- Налаштування облікових записів/виконання для channel Plugin знаходяться в `channels.<id>` і мають описуватися метаданими `channelConfigs` manifest відповідного Plugin, а не центральним реєстром параметрів OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера web-fetch Firecrawl.
  - `apiKey`: API-ключ Firecrawl (підтримує SecretRef). Використовує як резервне значення `plugins.entries.firecrawl.config.webSearch.apiKey`, застаріле `tools.web.fetch.firecrawl.apiKey` або змінну середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст зі сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту scrape у секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування dreaming для пам’яті. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: Cron-частота для кожного повного проходу dreaming (типово `"0 3 * * *"`).
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті знаходиться в [Memory configuration reference](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Plugins-пакети Claude також можуть додавати вбудовані типові значення Pi із `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як необроблені патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати id активного Plugin пам’яті або `"none"`, щоб вимкнути Plugins пам’яті.
- `plugins.slots.contextEngine`: вибрати id активного Plugin рушія контексту; типово `"legacy"`, якщо ви не встановите й не виберете інший рушій.
- `plugins.installs`: метадані інсталяцій, керовані CLI, які використовує `openclaw plugins update`.
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
- `tabCleanup` очищує відстежувані вкладки основного агента після простою або коли сесія перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тому навігація браузера типово залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте браузерній навігації в приватній мережі.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підлягають тому самому блокуванню приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі приєднання (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), якщо хочете, щоб OpenClaw виявив `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL DevTools WebSocket.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть приєднуватися на вибраному хості або через підключений browser node.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний профіль браузера на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання через CSS-селектори, hooks для завантаження одного файла, без перевизначення тайм-ауту діалогів, без `wait --load networkidle`, а також без `responsebody`, експорту PDF, перехоплення завантажень чи пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно задавайте `cdpUrl` лише для віддаленого CDP.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у Chrome, а інший у Brave.
- Порядок автовиявлення: типовий браузер, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` підтримує `~` для домашнього каталогу вашої ОС.
- Control service: лише local loopback (порт похідний від `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапори запуску до локального старту Chromium (наприклад,
  `--disable-gpu`, розмір вікна або прапори налагодження).

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

- `seamColor`: акцентний колір для chrome інтерфейсу нативного застосунку (тон бульбашки режиму Talk тощо).
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
    // Необов’язково. Типово false.
    allowRealIpFallback: false,
    tools: {
      // Додаткові HTTP-відмови для /tools/invoke
      deny: ["browser"],
      // Видалити інструменти зі стандартного списку HTTP-відмов
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
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хостів (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає `127.0.0.1` усередині контейнера. З мережею Docker bridge (`-p 18789:18789`) трафік надходить на `eth0`, тому gateway недосяжний. Використовуйте `--network host`, або встановіть `bind: "lan"` (або `bind: "custom"` із `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: типово обов’язкова. Bind-и не на loopback вимагають auth gateway. На практиці це означає спільний token/password або reverse proxy з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер первинного налаштування типово генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема через SecretRef), явно встановіть `gateway.auth.mode` у `token` або `password`. Потоки запуску та інсталяції/відновлення сервісу завершуються помилкою, якщо налаштовано обидва, а mode не задано.
- `gateway.auth.mode: "none"`: явний режим без auth. Використовуйте лише для довірених локальних налаштувань local loopback; цей варіант навмисно не пропонується в запитах первинного налаштування.
- `gateway.auth.mode: "trusted-proxy"`: делегувати auth reverse proxy з урахуванням ідентичності та довіряти заголовкам ідентичності з `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **не-loopback** джерело proxy; reverse proxy loopback на тому ж хості не задовольняють auth trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольнити auth для Control UI/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю auth заголовками Tailscale; вони натомість дотримуються звичайного режиму HTTP auth gateway. Цей потік без token припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб auth. Застосовується для кожного IP клієнта й для кожної області auth окремо (спільний секрет і token пристрою відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні хибні спроби від того самого клієнта можуть спрацювати на обмежувач уже на другому запиті, замість того щоб обидві пройшли як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; встановіть `false`, якщо свідомо хочете, щоб і трафік localhost теж підлягав rate limit (для тестових налаштувань або суворих proxy-розгортань).
- Спроби WS auth із походженням браузера завжди обмежуються без винятку для loopback (додатковий захист від brute force на localhost через браузер).
- На loopback ці блокування для походження браузера ізольовані за нормалізованим
  значенням `Origin`, тому повторні помилки з одного походження localhost не
  блокують автоматично інше походження.
- `tailscale.mode`: `serve` (лише tailnet, bind loopback) або `funnel` (публічно, вимагає auth).
- `controlUi.allowedOrigins`: явний список дозволених походжень браузера для підключень Gateway WebSocket. Обов’язковий, коли очікуються клієнти браузера з не-loopback походжень.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає резервне визначення походження за заголовком Host для розгортань, що навмисно покладаються на політику походження за Host-header.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійний client-side override через змінну середовища процесу,
  який дозволяє незашифрований `ws://` до довірених IP приватної мережі; типово
  незашифрований трафік як і раніше дозволено лише для loopback. Еквівалента в
  `openclaw.json` немає, а конфігурація приватної мережі браузера, така як
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на
  клієнти Gateway WebSocket.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують auth gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL для зовнішнього APNs relay, який використовують офіційні/TestFlight збірки iOS після публікації relay-backed реєстрацій у gateway. Цей URL має збігатися з URL relay, зібраним у збірку iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання gateway-to-relay у мілісекундах. Типово `10000`.
- Реєстрації relay-backed делегуються конкретній ідентичності gateway. Пов’язаний застосунок iOS отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію relay і пересилає в gateway дозвіл на надсилання в межах реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові override через змінні середовища для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварійний варіант лише для розробки для loopback HTTP URL relay. Промислові URL relay мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал моніторингу стану каналу в хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски health-monitor. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого socket у хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на канал/обліковий запис за ковзну годину. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: відмова на рівні каналу від перезапусків health-monitor при збереженні глобального монітора увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення на рівні облікового запису для каналів із кількома обліковими записами. Якщо задано, має пріоритет над перевизначенням рівня каналу.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його не вдалося розв’язати, розв’язання завершується за принципом fail closed (без маскування резервним fallback на remote).
- `trustedProxies`: IP-адреси reverse proxy, які завершують TLS або додають заголовки переспрямованого клієнта. Указуйте лише proxy, які ви контролюєте. Записи loopback усе ще коректні для налаштувань виявлення локального proxy/того самого хоста (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять запити loopback придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для поведінки fail closed.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює стандартний список заборон).
- `gateway.tools.allow`: вилучає назви інструментів зі стандартного списку HTTP-заборон.

</Accordion>

### Кінцеві точки, сумісні з OpenAI

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Посилене захистом опрацювання URL-входів Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні списки дозволу трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посиленого захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (установлюйте лише для HTTPS-походжень, які ви контролюєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька gateway на одному хості з унікальними портами та каталогами стану:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Зручні прапори: `--dev` (використовує `~/.openclaw-dev` + порт `19001`), `--profile <name>` (використовує `~/.openclaw-<name>`).

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
- `certPath`: шлях файлової системи до файла сертифіката TLS.
- `keyPath`: шлях файлової системи до файла приватного ключа TLS; обмежуйте доступ правами.
- `caPath`: необов’язковий шлях до набору CA для перевірки клієнта або користувацьких ланцюжків довіри.

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
  - `"off"`: ігнорувати живі зміни; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес gateway при зміні конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати hot reload; за потреби перейти до перезапуску.
- `debounceMs`: вікно debounce в мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: максимальний час у мс очікування завершення поточних операцій перед примусовим перезапуском (типово: `300000` = 5 хвилин).

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

- `hooks.enabled=true` вимагає непорожній `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання token Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонний `sessionKey`, установіть `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping цього opt-in не потребують.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з тіла запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` у mapping, згенеровані шаблоном, вважаються наданими ззовні й теж вимагають `hooks.allowRequestSessionKey=true`.

<Accordion title="Докладно про mappings">

- `match.path` зіставляє підшлях після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з payload.
- `transform` може вказувати на модуль JS/TS, що повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та traversal відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ID використовують типове значення.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або не задано = дозволити все, `[]` = заборонити все).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook agent без явного `sessionKey`.
- `allowRequestSessionKey`: дозволити викликачам `/hooks/agent` і sessionKey mapping на основі шаблонів задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Стає обов’язковим, коли будь-який mapping або preset використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволено, якщо каталог моделей задано).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію для кожного повідомлення, установіть `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` так, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібен `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість шаблонного значення за замовчуванням.

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

- Gateway автоматично запускає `gog gmail watch serve` під час старту, якщо його налаштовано. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути це.
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

- Роздає HTML/CSS/JS і A2UI, які агент може редагувати, через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: зберігайте `gateway.bind: "loopback"` (типово).
- Bind-и не на loopback: маршрути canvas вимагають auth Gateway (token/password/trusted-proxy), так само як і інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки auth; після спарювання та підключення node Gateway оголошує URL можливостей із областю дії node для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії node і швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт live reload у HTML, що роздається.
- Автоматично створює початковий `index.html`, якщо каталог порожній.
- Також роздає A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни вимагають перезапуску gateway.
- Вимикайте live reload для великих каталогів або при помилках `EMFILE`.

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
- Ім’я хоста типово `openclaw`. Перевизначається через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує зону unicast DNS-SD в `~/.openclaw/dns/`. Для виявлення між мережами поєднуйте з DNS-сервером (рекомендовано CoreDNS) + Tailscale split DNS.

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

- Вбудовані змінні середовища застосовуються, лише якщо в середовищі процесу немає цього ключа.
- Файли `.env`: `.env` поточного робочого каталогу + `~/.openclaw/.env` (жоден із них не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний пріоритет див. в [Environment](/uk/help/environment).

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
- Відсутні/порожні змінні викликають помилку під час завантаження конфігурації.
- Екрануйте через `$${VAR}`, щоб отримати буквальний `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є адитивними: прості текстові значення також продовжують працювати.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон `id` для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` `id`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон `id` для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` для `source: "exec"` не мають містити сегменти шляху `.` або `..`, розділені `/` (наприклад, `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання в `auth-profiles.json` включено до покриття runtime resolution та audit.

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
- Шляхи провайдерів file та exec завершуються за принципом fail closed, коли перевірка Windows ACL недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` вимагає абсолютний шлях `command` і використовує payload-и протоколу через stdin/stdout.
- Типово шляхи команд-символічних посилань відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи-символічні посилання з перевіркою шляху розв’язаного цільового файла.
- Якщо налаштовано `trustedDirs`, перевірка довірених каталогів застосовується до шляху розв’язаного цільового файла.
- Дочірнє середовище `exec` типово мінімальне; явно передавайте потрібні змінні через `passEnv`.
- Посилання на секрети розв’язуються під час активації в знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Фільтрація активної поверхні застосовується під час активації: нерозв’язані посилання на увімкнених поверхнях призводять до збою старту/reload, а неактивні поверхні пропускаються з діагностикою.

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
- Профілі режиму OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні runtime-облікові дані надходять із розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищуються під час виявлення.
- Застарілий імпорт OAuth із `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Runtime-поведінка Secrets та інструменти `audit/configure/apply`: [Secrets Management](/uk/gateway/secrets).

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

- `billingBackoffHours`: базовий backoff у годинах, коли профіль завершується помилкою через справжні помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг
  усе ще може потрапити сюди навіть для відповідей `401`/`403`, але
  matcher-и тексту, специфічні для провайдера, залишаються в межах провайдера,
  якому вони належать (наприклад, OpenRouter
  `Key limit exceeded`). Повторювані HTTP `402` повідомлення usage-window або
  про ліміт витрат організації/робочого простору натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин backoff для білінгу для кожного провайдера.
- `billingMaxHours`: верхня межа в годинах для експоненційного зростання billing backoff (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для помилок `auth_permanent` із високою впевненістю (типово: `10`).
- `authPermanentMaxMinutes`: верхня межа в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок перевантаження перед перемиканням на резервну модель (типово: `1`). Сюди потрапляють форми на кшталт зайнятості провайдера, наприклад `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок rate limit перед перемиканням на резервну модель (типово: `1`). До цього кошика rate limit входить текст у формі провайдера, наприклад `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- Установіть `logging.file` для стабільного шляху.
- `consoleLevel` підвищується до `debug` з `--verbose`.
- `maxFileBytes`: максимальний розмір файла журналу в байтах, після якого запис припиняється (додатне ціле число; типово: `524288000` = 500 MB). Для production-розгортань використовуйте зовнішню ротацію журналів.

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
- `flags`: масив рядків-прапорів, що вмикає цільовий вивід журналу (підтримує wildcard-и, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для виводу попереджень про завислі сесії, поки сесія залишається в стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт trace, metrics або logs.
- `otel.sampleRate`: частота семплювання trace `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання telemetry у мс.
- `otel.captureContent`: opt-in для захоплення необробленого вмісту в атрибути span OTEL. Типово вимкнено. Булеве значення `true` захоплює вміст повідомлень/інструментів, що не є system; форма об’єкта дає змогу явно увімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `cacheTrace.enabled`: журналювати знімки cache trace для вбудованих запусків (типово: `false`).
- `cacheTrace.filePath`: вихідний шлях для JSONL cache trace (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід cache trace (усі типово: `true`).

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

- `channel`: канал релізів для npm/git-інсталяцій — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти наявність оновлень npm під час запуску gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для package-інсталяцій (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед авто-застосуванням stable-каналу (типово: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання stable-каналу в годинах (типово: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки beta-каналу, у годинах (типово: `1`; максимум: `24`).

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
- `dispatch.enabled`: незалежний gate для диспетчеризації ходів сесії ACP (типово: `true`). Установіть `false`, щоб команди ACP залишалися доступними, але виконання блокувалося.
- `backend`: id типового runtime backend ACP (має збігатися із зареєстрованим runtime Plugin ACP).
- `defaultAgent`: резервний id цільового агента ACP, коли spawns не вказують явну ціль.
- `allowedAgents`: список дозволу id агентів, дозволених для runtime-сесій ACP; порожнє значення означає відсутність додаткового обмеження.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір chunk перед розбиттям проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів для кожного ходу (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потоком поступово; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу помічника, що проєктується за один хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис імен тегів у булеві перевизначення видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для воркерів сесії ACP до можливого очищення.
- `runtime.installCommand`: необов’язкова команда встановлення, яку слід виконати під час bootstrap середовища runtime ACP.

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
  - `"random"` (типово): ротаційні смішні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), установіть змінну середовища `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

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

Див. поля ідентичності `agents.list` у [Agent defaults](/uk/gateway/config-agents#agent-defaults).

---

## Bridge (застарілий, видалений)

Поточні збірки більше не містять TCP bridge. Nodes підключаються через Gateway WebSocket. Ключі `bridge.*` більше не входять до схеми конфігурації (валідація завершується помилкою, доки їх не видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

<Accordion title="Застаріла конфігурація bridge (історичний довідник)">

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

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запусків Cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів Cron. Типово: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файла журналу для одного запуску (`cron/runs/<jobId>.jsonl`) перед очищенням. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки, що зберігаються при спрацюванні очищення run-log. Типово: `2000`.
- `webhookToken`: bearer token, який використовується для доставки POST у Webhook Cron (`delivery.mode = "webhook"`); якщо не задано, заголовок auth не надсилається.
- `webhook`: застарілий резервний URL Webhook (http/https), який використовується лише для збережених jobs, що все ще мають `notify: true`.

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

- `maxAttempts`: максимальна кількість повторів для одноразових jobs при тимчасових помилках (типово: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок backoff у мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, які запускають повтор — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Не вказуйте, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових jobs Cron. Рекурентні jobs використовують окрему обробку помилок.

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

- `enabled`: увімкнути сповіщення про помилки для jobs Cron (типово: `false`).
- `after`: кількість послідовних помилок перед спрацюванням сповіщення (додатне ціле число, мінімум: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого job (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` надсилає POST на налаштований Webhook.
- `accountId`: необов’язковий id облікового запису або каналу для обмеження області доставки сповіщень.

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

- Типове призначення для сповіщень про збої Cron для всіх jobs.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних цілі.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL Webhook. Обов’язково для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для кожного job перевизначає це глобальне типове значення.
- Коли не задано ні глобального, ні для окремого job призначення для збоїв, jobs, які вже доставляють через `announce`, при збої використовують як резервний варіант ту саму основну ціль announce.
- `delivery.failureDestination` підтримується лише для jobs із `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` job не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання Cron відстежуються як [background tasks](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Заповнювачі шаблону, що розгортаються в `tools.media.models[].args`:

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повний текст вхідного повідомлення                |
| `{{RawBody}}`      | Необроблений текст (без обгорток історії/відправника) |
| `{{BodyStripped}}` | Текст без згадок групи                            |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | ID повідомлення каналу                            |
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (image/audio/document/…)                |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Розв’язаний prompt медіа для записів CLI          |
| `{{MaxChars}}`     | Розв’язана максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (best effort)                          |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (best effort) |
| `{{SenderName}}`   | Відображуване ім’я відправника (best effort)      |
| `{{SenderE164}}`   | Номер телефону відправника (best effort)         |
| `{{Provider}}`     | Підказка провайдера (whatsapp, telegram, discord тощо) |

---

## Include конфігурації (`$include`)

Розбивайте конфігурацію на кілька файлів:

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
- Масив файлів: deep merge у заданому порядку (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після include (перевизначають включені значення).
- Вкладені include: до 10 рівнів глибини.
- Шляхи: розв’язуються відносно файла, що включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми/`../` дозволені лише тоді, коли вони все одно розв’язуються в межах цієї межі.
- Записи, керовані OpenClaw, які змінюють лише один розділ верхнього рівня, підкріплений include одного файла, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі include, масиви include та include із сусідніми перевизначеннями доступні лише для читання для записів, керованих OpenClaw; такі записи завершуються за принципом fail closed замість сплощення конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних include.

---

_Пов’язано: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Configuration](/uk/gateway/configuration)
- [Configuration examples](/uk/gateway/configuration-examples)
