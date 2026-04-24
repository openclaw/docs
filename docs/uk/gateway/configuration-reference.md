---
read_when:
    - Вам потрібні точні семантики полів конфігурації або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник конфігурації
x-i18n:
    generated_at: "2026-04-24T19:33:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: f54e51abc83dd7e72cc4220fa881f488cfb441b97710ba6852382814d4055344
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Основний довідник конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Configuration](/uk/gateway/configuration).

Ця сторінка охоплює основні поверхні конфігурації OpenClaw і дає посилання назовні, коли підсистема має власний докладніший довідник. Вона **не** намагається вбудувати на одній сторінці кожен каталог команд, що належить каналу/Plugin, або кожен глибокий параметр пам’яті/QMD.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну схему JSON Schema, що використовується для валідації та інтерфейсу Control UI, з об’єднаними метаданими bundled/plugin/channel, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми з прив’язкою до шляху для інструментів деталізованого перегляду
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють хеш базового стану config-doc щодо поточної поверхні схеми

Окремі докладні довідники:

- [Memory configuration reference](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідних каналів/Plugin для поверхонь команд, специфічних для каналів

Формат конфігурації — **JSON5** (дозволені коментарі та фінальні коми). Усі поля необов’язкові — якщо їх пропущено, OpenClaw використовує безпечні значення за замовчуванням.

---

## Канали

Ключі конфігурації для кожного каналу перенесено на окрему сторінку — див.
[Configuration — channels](/uk/gateway/config-channels) для `channels.*`,
зокрема для Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, обмеження за згадуваннями).

## Типові значення агента, multi-agent, сесії та повідомлення

Перенесено на окрему сторінку — див.
[Configuration — agents](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робоча область, модель, thinking, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (маршрутизація multi-agent і прив’язки)
- `session.*` (життєвий цикл сесії, compaction, pruning)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає стандартне для платформи вікно паузи перед надсиланням транскрипту (`700 ms на macOS і Android, 900 ms на iOS`)

## Інструменти та користувацькі провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів на основі провайдерів і налаштування користувацьких
провайдерів / base-URL перенесені на окрему сторінку — див.
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

- `allowBundled`: необов’язковий список дозволених лише для bundled skills (керовані/workspace skills це не зачіпає).
- `load.extraDirs`: додаткові спільні корені skills (найнижчий пріоритет).
- `install.preferBrew`: якщо `true`, спочатку надає перевагу інсталяторам Homebrew, коли `brew`
  доступний, і лише потім переходить до інших типів інсталяторів.
- `install.nodeManager`: пріоритет інсталятора node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/встановлений.
- `entries.<skillKey>.apiKey`: зручне поле для skills, які оголошують основну змінну середовища (рядок відкритим текстом або об’єкт SecretRef).

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
- Виявлення підтримує нативні Plugins OpenClaw, а також сумісні пакунки Codex і Claude, зокрема пакунки Claude зі стандартним розташуванням без manifest.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий список дозволених (завантажуються лише вказані Plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API key на рівні Plugin (коли Plugin це підтримує).
- `plugins.entries.<id>.env`: мапа змінних середовища в межах Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: якщо `false`, ядро блокує `before_prompt_build` та ігнорує поля, що змінюють prompt, із застарілого `before_agent_start`, водночас зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних хуків Plugin і підтримуваних каталогів хуків, що надаються пакунками.
- `plugins.entries.<id>.hooks.allowConversationAccess`: якщо `true`, довірені небандловані Plugins можуть читати необроблений вміст розмови з типізованих хуків, таких як `llm_input`, `llm_output` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряє цьому Plugin запитувати перевизначення `provider` і `model` для окремого запуску фонових subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли справді хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений Plugin (валідується за нативною схемою Plugin OpenClaw, якщо вона доступна).
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (приймає SecretRef). Якщо відсутній, використовується `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілий `tools.web.fetch.firecrawl.apiKey` або змінна середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базова URL-адреса API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст зі сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту scrape у секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Фази та пороги див. у [Dreaming](/uk/concepts/dreaming).
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: Cron-інтервал для кожного повного циклу dreaming (типово `"0 3 * * *"`).
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті міститься в [Memory configuration reference](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Plugins-пакунки Claude також можуть додавати вбудовані типові значення Pi з `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибір id активного Plugin пам’яті або `"none"` для вимкнення Plugins пам’яті.
- `plugins.slots.contextEngine`: вибір id активного Plugin механізму контексту; типово `"legacy"`, доки ви не встановите й не виберете інший механізм.
- `plugins.installs`: метадані встановлення, керовані CLI та використовувані `openclaw plugins update`.
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
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо значення не задано, тож навігація браузера типово залишається суворо обмеженою.
- Встановлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте браузерній навігації в приватній мережі.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підлягають тому самому блокуванню приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі attach-only (запуск/зупинка/скидання недоступні).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), якщо хочете, щоб OpenClaw виявив `/json/version`; використовуйте WS(S),
  якщо ваш провайдер надає пряму URL-адресу DevTools WebSocket.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися
  до вибраного хоста або через підключений browser node.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб указати конкретний
  профіль браузера на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання через CSS-селектори, хуки завантаження одного файла,
  без перевизначення тайм-аутів діалогів, без `wait --load networkidle`, а також без
  `responsebody`, експорту PDF, перехоплення завантажень чи пакетних дій.
- Для локальних керованих профілів `openclaw` `cdpPort` і `cdpUrl` призначаються автоматично; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Порядок автовиявлення: браузер за замовчуванням, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Служба керування: лише loopback (порт похідний від `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад,
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

- `seamColor`: акцентний колір для chrome нативного інтерфейсу застосунку (відтінок бульбашки режиму Talk тощо).
- `assistant`: перевизначення ідентичності Control UI. Якщо не задано, використовується ідентичність активного агента.

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
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хостів (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типове значення `loopback` для bind слухає `127.0.0.1` усередині контейнера. Із bridge-мережею Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому gateway недоступний. Використовуйте `--network host`, або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: типово обов’язкова. Bind не на loopback потребують gateway auth. На практиці це означає спільний token/password або reverse proxy з контролем ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер початкового налаштування типово генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема через SecretRef), явно задайте `gateway.auth.mode` як `token` або `password`. Під час запуску, а також у процесах встановлення/відновлення сервісу виникає помилка, якщо налаштовані обидва значення, а mode не задано.
- `gateway.auth.mode: "none"`: явний режим без auth. Використовуйте лише для довірених локальних налаштувань local loopback; цей варіант навмисно не пропонується у запитах онбордингу.
- `gateway.auth.mode: "trusted-proxy"`: делегувати auth reverse proxy з контролем ідентичності та довіряти заголовкам ідентичності від `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **не-loopback** джерело proxy; локальні loopback reverse proxy на тому самому хості не задовольняють вимоги trusted-proxy auth.
- `gateway.auth.allowTailscale`: якщо `true`, заголовки ідентичності Tailscale Serve можуть задовольняти auth для Control UI/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю auth за заголовками Tailscale; вони дотримуються звичайного режиму HTTP auth gateway. Цей потік без token припускає, що хост gateway є довіреним. Типове значення — `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий лімітер невдалих спроб auth. Застосовується для кожного IP клієнта та для кожної області auth окремо (спільний секрет і token пристрою відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - В асинхронному шляху Tailscale Serve для Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом про невдачу. Тому одночасні хибні спроби від одного клієнта можуть спровокувати лімітер уже на другому запиті, замість того щоб обидві пройшли як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово дорівнює `true`; установіть `false`, якщо свідомо хочете також обмежувати localhost-трафік (для тестових сценаріїв або суворих розгортань через proxy).
- Спроби WS auth із browser-origin завжди обмежуються без винятку для loopback (додатковий рівень захисту від браузерного brute force на localhost).
- На loopback такі блокування для browser-origin ізольовані за нормалізованим
  значенням `Origin`, тож повторні невдачі з одного localhost-origin не
  блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind на loopback) або `funnel` (публічний доступ, потребує auth).
- `controlUi.allowedOrigins`: явний список дозволених browser-origin для підключень Gateway WebSocket. Обов’язковий, коли очікуються browser-клієнти не з loopback-origin.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає fallback origin через заголовок Host для розгортань, що навмисно покладаються на політику origin на основі заголовка Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: клієнтське
  аварійне перевизначення через змінну середовища процесу, яке дозволяє plaintext `ws://` до довірених IP
  приватної мережі; для plaintext типовим залишається режим лише loopback. Еквівалента в `openclaw.json`
  немає, а конфігурація приватної мережі браузера, така як
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнтів
  Gateway WebSocket.
- `gateway.remote.token` / `.password`: поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують gateway auth.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS URL зовнішнього APNs relay, який використовують офіційні/TestFlight збірки iOS після публікації relay-реєстрацій у gateway. Ця URL має збігатися з URL relay, вбудованою в збірку iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від gateway до relay у мілісекундах. Типове значення: `10000`.
- Реєстрації на основі relay делегуються конкретній ідентичності gateway. Пов’язаний застосунок iOS отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію relay і пересилає gateway право надсилання в межах цієї реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові перевизначення через env для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварійний виняток лише для розробки, щоб дозволити loopback HTTP URL relay. У production URL relay мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал моніторингу стану каналу в хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски health-monitor. Типове значення: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. Типове значення: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на канал/обліковий запис у межах ковзної години. Типове значення: `10`.
- `channels.<provider>.healthMonitor.enabled`: вимкнення на рівні каналу для перезапусків health-monitor, при цьому глобальний монітор залишається увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення на рівні облікового запису для multi-account каналів. Якщо задано, воно має пріоритет над перевизначенням рівня каналу.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і значення не вдалося розв’язати, розв’язання завершується fail-closed (без маскування через fallback на remote).
- `trustedProxies`: IP reverse proxy, які завершують TLS або додають заголовки пересланого клієнта. Вказуйте лише proxy, які ви контролюєте. Записи loopback і далі допустимі для налаштувань проксі на тому самому хості/локального виявлення (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: якщо `true`, gateway приймає `X-Real-IP`, коли `X-Forwarded-For` відсутній. Типово `false` для поведінки fail-closed.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий список заборон).
- `gateway.tools.allow`: прибирає назви інструментів із типового списку заборон для HTTP.

</Accordion>

### Кінцеві точки, сумісні з OpenAI

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилене захист URL-вводу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlist трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посиленого захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS-origin, які ви контролюєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

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

- `enabled`: вмикає завершення TLS на прослуховувачі gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, якщо явні файли не налаштовані; лише для локального/dev використання.
- `certPath`: шлях файлової системи до файла TLS certificate.
- `keyPath`: шлях файлової системи до файла приватного TLS key; обмежуйте доступ через дозволи.
- `caPath`: необов’язковий шлях до пакета CA для перевірки клієнтів або користувацьких ланцюжків довіри.

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
  - `"off"`: ігнорувати зміни наживо; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес gateway при зміні конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати hot reload; якщо потрібно, перейти до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: максимальний час у мс очікування завершення операцій у процесі перед примусовим перезапуском (типово: `300000` = 5 хвилин).

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

Auth: `Authorization: Bearer <token>` або `x-openclaw-token: <token>`.
Токени hooks у рядку запиту відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` вимагає непорожній `hooks.token`.
- `hooks.token` має **відрізнятися** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping такого opt-in не потребують.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із тіла запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` у mapping, зрендерені через шаблон, вважаються зовнішньо заданими і також вимагають `hooks.allowRequestSessionKey=true`.

<Accordion title="Докладно про mappings">

- `match.path` зіставляється з підшляхом після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` зіставляється з полем payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають значення з payload.
- `transform` може вказувати на модуль JS/TS, що повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та traversal відхиляються).
- `agentId` спрямовує на конкретного агента; невідомі ID повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або відсутнє значення = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook-агента без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і session key mapping на основі шаблонів задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Стає обов’язковим, коли будь-який mapping або preset використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; типове значення `channel` — `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволена, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` так, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібне `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість шаблонного типового значення.

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

- Gateway автоматично запускає `gog gmail watch serve` під час старту, якщо це налаштовано. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
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

- Обслуговує HTML/CSS/JS і A2UI, які агент може редагувати, через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Bind не на loopback: маршрути canvas вимагають auth Gateway (token/password/trusted-proxy), так само як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки auth; після сполучення та підключення node Gateway оголошує URL-адреси можливостей у межах node для доступу до canvas/A2UI.
- URL-адреси можливостей прив’язані до активної WS-сесії node і швидко спливають. Fallback на основі IP не використовується.
- Вбудовує клієнт live-reload у HTML, що віддається.
- Автоматично створює стартовий `index.html`, якщо каталог порожній.
- Також віддає A2UI за адресою `/__openclaw__/a2ui/`.
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

- `minimal` (типово): не включає `cliPath` + `sshPort` у записи TXT.
- `full`: включає `cliPath` + `sshPort`.
- Ім’я хоста типово `openclaw`. Для перевизначення використовуйте `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує зону unicast DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднуйте з DNS-сервером (рекомендовано CoreDNS) + split DNS у Tailscale.

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
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден із них не перевизначає наявні змінні).
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

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні викликають помилку під час завантаження конфігурації.
- Екрануйте через `$${VAR}`, щоб отримати буквальний `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є адитивними: значення у відкритому тексті також продовжують працювати.

### `SecretRef`

Використовуйте одну таку форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон `id` для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` `id`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон `id` для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` для `source: "exec"` не повинні містити сегменти шляху `.` або `..`, розділені `/` (наприклад, `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання в `auth-profiles.json` входять до runtime-розв’язання та покриття аудиту.

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
- Шляхи провайдерів file і exec переходять у fail closed, коли перевірка Windows ACL недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` вимагає абсолютний шлях у `command` і використовує корисні навантаження протоколу через stdin/stdout.
- Типово шляхи команд-симлінків відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи-симлінки, водночас перевіряючи розв’язаний цільовий шлях.
- Якщо налаштовано `trustedDirs`, перевірка довірених каталогів застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` типово мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв’язуються під час активації в snapshot у пам’яті, а потім шляхи запитів читають лише цей snapshot.
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

- Профілі для кожного агента зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Профілі режиму OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані профілю auth на основі SecretRef.
- Статичні runtime-облікові дані надходять із розв’язаних snapshot у пам’яті; застарілі статичні записи `auth.json` очищаються при виявленні.
- Застарілий імпорт OAuth виконується з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Runtime-поведінка секретів і інструменти `audit/configure/apply`: [Secrets Management](/uk/gateway/secrets).

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
  billing/insufficient-credit помилки (типово: `5`). Явний текст про billing
  усе ще може потрапити сюди навіть для відповідей `401`/`403`, але
  зіставлювачі тексту, специфічні для провайдера, залишаються обмеженими тим
  провайдером, якому вони належать (наприклад, OpenRouter
  `Key limit exceeded`). Повторювані HTTP `402` повідомлення usage-window або
  organization/workspace spend-limit натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин billing backoff для кожного провайдера.
- `billingMaxHours`: верхня межа в годинах для експоненційного зростання billing backoff (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для збоїв `auth_permanent` з високою впевненістю (типово: `10`).
- `authPermanentMaxMinutes`: верхня межа в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для помилок перевантаження перед переходом до fallback моделі (типово: `1`). Сюди потрапляють форми provider-busy, такі як `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для помилок rate-limit перед переходом до fallback моделі (типово: `1`). До цього сегмента rate-limit входить текст у стилі провайдера, такий як `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- Задайте `logging.file` для стабільного шляху.
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
- `flags`: масив рядків-прапорців, що вмикають цільовий вивід журналу (підтримує шаблони з підстановками, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для виводу попереджень про завислу сесію, поки сесія залишається в стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, які надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт trace, metrics або logs.
- `otel.sampleRate`: частота вибірки trace `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання telemetry у мс.
- `cacheTrace.enabled`: журналювати snapshot cache trace для вбудованих запусків (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для cache trace JSONL (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
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

- `channel`: канал випусків для встановлень npm/git — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для встановлень пакунків (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням stable-каналу (типово: `6`; максимум: `168`).
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
- `dispatch.enabled`: окремий gate для диспетчеризації ходів ACP-сесії (типово: `true`). Установіть `false`, щоб команди ACP залишалися доступними, але виконання блокувалося.
- `backend`: id типового runtime backend ACP (має відповідати зареєстрованому runtime Plugin ACP).
- `defaultAgent`: id цільового агента ACP за замовчуванням, коли spawn не задає явної цілі.
- `allowedAgents`: список дозволених id агентів для runtime-сесій ACP; порожнє значення означає відсутність додаткового обмеження.
- `maxConcurrentSessions`: максимальна кількість одночасно активних ACP-сесій.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед розбиттям проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструмента за хід (типово: `true`).
- `stream.deliveryMode`: `"live"` передає поступово; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструмента (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, що проєктується за хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис відповідності назв тегів логічним перевизначенням видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для воркерів ACP-сесій до моменту, коли вони можуть бути очищені.
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
  - `"random"` (типово): змінні кумедні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (назва/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), задайте змінну середовища `OPENCLAW_HIDE_BANNER=1`.

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

Див. поля ідентичності `agents.list` у розділі [Agent defaults](/uk/gateway/config-agents#agent-defaults).

---

## Bridge (застарілий, вилучений)

Поточні збірки більше не містять TCP bridge. Nodes підключаються через Gateway WebSocket. Ключі `bridge.*` більше не входять до схеми конфігурації (валідація завершиться помилкою, доки їх не буде вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

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

- `sessionRetention`: як довго зберігати завершені ізольовані сесії виконання Cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів Cron. Типове значення: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файла журналу одного запуску (`cron/runs/<jobId>.jsonl`) до очищення. Типове значення: `2_000_000` байтів.
- `runLog.keepLines`: кількість найновіших рядків, що зберігаються, коли запускається очищення журналу виконання. Типове значення: `2000`.
- `webhookToken`: bearer token, що використовується для доставки POST до webhook у Cron (`delivery.mode = "webhook"`); якщо не задано, заголовок auth не надсилається.
- `webhook`: застаріла резервна URL webhook (http/https), яка використовується лише для збережених завдань, що все ще мають `notify: true`.

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
- `retryOn`: типи помилок, які запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Не задавайте, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових завдань Cron. Для повторюваних завдань використовується окрема обробка збоїв.

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

- `enabled`: увімкнути сповіщення про збої для завдань Cron (типово: `false`).
- `after`: кількість послідовних збоїв перед спрацюванням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` виконує POST на налаштований webhook.
- `accountId`: необов’язковий id облікового запису або каналу для обмеження доставки сповіщення.

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

- Типове місце призначення для сповіщень про збої Cron для всіх завдань.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних цілі.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL webhook. Обов’язкове для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` на рівні завдання перевизначає це глобальне типове значення.
- Коли не задано ні глобального, ні рівня завдання місця призначення для збоїв, завдання, які вже доставляють через `announce`, у разі збою повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань із `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання Cron відстежуються як [background tasks](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Заповнювачі шаблонів, що розгортаються в `tools.media.models[].args`:

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повний текст вхідного повідомлення                |
| `{{RawBody}}`      | Необроблений текст (без обгорток історії/відправника) |
| `{{BodyStripped}}` | Текст без згадувань групи                         |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | id повідомлення каналу                            |
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (image/audio/document/…)                |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Розв’язаний prompt медіа для записів CLI          |
| `{{MaxChars}}`     | Розв’язаний максимум символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (best effort)                          |
| `{{GroupMembers}}` | Попередній список учасників групи (best effort)   |
| `{{SenderName}}`   | Відображуване ім’я відправника (best effort)      |
| `{{SenderE164}}`   | Номер телефону відправника (best effort)          |
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
- Масив файлів: глибоко зливається за порядком (пізніші перевизначають ранніші).
- Сусідні ключі: зливаються після include (перевизначають включені значення).
- Вкладені include: до 10 рівнів глибини.
- Шляхи: розв’язуються відносно файла, що включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми/форми з `../` дозволені лише тоді, коли після розв’язання вони все одно лишаються в межах цього каталогу.
- Записи, керовані OpenClaw, які змінюють лише один розділ верхнього рівня, підкріплений include одного файла, записуються назад у цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі include, масиви include та include із перевизначеннями сусідніх ключів доступні лише для читання для записів, керованих OpenClaw; такі записи завершуються fail-closed замість сплощення конфігурації.
- Помилки: чіткі повідомлення для відсутніх файлів, помилок парсингу та циклічних include.

---

_Пов’язане: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Configuration](/uk/gateway/configuration)
- [Configuration examples](/uk/gateway/configuration-examples)
