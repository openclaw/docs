---
read_when:
    - Потрібні точна семантика конфігурації на рівні полів або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, стандартних значень і посилань на спеціалізовані довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-05-06T11:45:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e5f7c2246b28f801d527437ae6242686998f1e8b75fd3977723d240a760d859
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Довідка з основної конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Конфігурація](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і містить посилання на окремі глибші довідки, коли підсистема має власну. Каталоги команд, що належать каналам і plugin, а також глибокі параметри пам’яті/QMD розміщені на власних сторінках, а не на цій.

Істина коду:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації й Control UI, з об’єднаними метаданими bundled/plugin/каналів, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми з прив’язкою до шляху для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації відносно поточної поверхні схеми

Шлях пошуку для агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації й обмежень на рівні полів перед редагуванням. Використовуйте
[Конфігурація](/uk/gateway/configuration) для настанов, орієнтованих на завдання, і цю сторінку
для ширшої карти полів, значень за замовчуванням і посилань на довідки підсистем.

Окремі глибокі довідки:

- [Довідка з конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Команди зі скісною рискою](/uk/tools/slash-commands) для поточного каталогу вбудованих + bundled команд
- сторінки власників каналів/plugin для поверхонь команд, специфічних для каналів

Формат конфігурації — **JSON5** (дозволені коментарі та кінцеві коми). Усі поля необов’язкові - OpenClaw використовує безпечні значення за замовчуванням, якщо їх пропущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на спеціальну сторінку - див.
[Конфігурація - канали](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, пропускання згадок).

## Значення агента за замовчуванням, multi-agent, сесії та повідомлення

Перенесено на спеціальну сторінку - див.
[Конфігурація - агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робоча область, модель, мислення, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (маршрутизація й прив’язки multi-agent)
- `session.*` (життєвий цикл сесії, compaction, обрізання)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає стандартне для платформи вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)

## Інструменти й користувацькі провайдери

Політику інструментів, експериментальні перемикачі, конфігурацію інструментів на базі провайдерів і налаштування
користувацького провайдера / базового URL перенесено на спеціальну сторінку - див.
[Конфігурація - інструменти й користувацькі провайдери](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, списки дозволених моделей і налаштування користувацьких провайдерів містяться в
[Конфігурація - інструменти й користувацькі провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.providers`: мапа користувацьких провайдерів із ключами за ідентифікатором провайдера.
- `models.pricing.enabled`: керує фоновим завантаженням цін, яке
  запускається після того, як sidecar-и й канали досягають шляху готовності Gateway. Коли `false`,
  Gateway пропускає отримання каталогів цін OpenRouter і LiteLLM; налаштовані
  значення `models.providers.*.models[].cost` і далі працюють для локальних оцінок вартості.

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

- `mcp.servers`: іменовані визначення stdio або віддалених MCP-серверів для runtime-ів, які
  надають налаштовані MCP-інструменти.
  Віддалені записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` — це CLI-native псевдонім, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.sessionIdleTtlMs`: TTL простою для bundled MCP runtime-ів з областю дії сесії.
  Одноразові вбудовані запуски запитують очищення наприкінці запуску; цей TTL є запасним механізмом для
  довготривалих сесій і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються наживо через утилізацію кешованих MCP runtime-ів сесії.
  Наступне виявлення/використання інструмента повторно створює їх із нової конфігурації, тому видалені
  записи `mcp.servers` прибираються негайно, а не чекають TTL простою.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI бекенди](/uk/gateway/cli-backends#bundle-mcp-overlays) щодо поведінки runtime.

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

- `allowBundled`: необов’язковий список дозволених лише для bundled skills (керовані/робочі skills не змінюються).
- `load.extraDirs`: додаткові спільні корені skills (найнижчий пріоритет).
- `install.preferBrew`: коли true, надає перевагу інсталяторам Homebrew, якщо `brew`
  доступний, перед відступом до інших типів інсталяторів.
- `install.nodeManager`: перевага інсталятора node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/установлений.
- `entries.<skillKey>.apiKey`: зручне поле для skills, що оголошують основну змінну середовища (рядок відкритим текстом або об’єкт SecretRef).

---

## Plugins

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

- Завантажується з `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, а також `plugins.load.paths`.
- Виявлення приймає нативні plugins OpenClaw, а також сумісні bundles Codex і Claude, зокрема manifestless bundles Claude зі стандартним макетом.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий список дозволених (завантажуються лише перелічені plugins). `deny` має перевагу.
- `bundledDiscovery`: за замовчуванням `"allowlist"` для нових конфігурацій, тому непорожній
  `plugins.allow` також обмежує bundled provider plugins, зокрема web-search
  runtime providers. Doctor записує `"compat"` для перенесених застарілих конфігурацій allowlist,
  щоб зберегти наявну поведінку bundled provider, доки ви не ввімкнете новий режим.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні plugin (коли підтримується plugin).
- `plugins.entries.<id>.env`: мапа змінних середовища з областю дії plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` та ігнорує поля, що змінюють prompt, із застарілого `before_agent_start`, зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hooks plugin і підтримуваних bundle-provided каталогів hook.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені не-bundled plugins можуть читати сирий вміст розмови з типізованих hooks, таких як `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряє цьому plugin запитувати override-и `provider` і `model` для окремих запусків фонових subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених override-ів subagent. Використовуйте `"*"` лише тоді, коли ви навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: визначений plugin об’єкт конфігурації (валідується нативною схемою plugin OpenClaw, коли вона доступна).
- Налаштування облікового запису/runtime для channel plugin розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфесту plugin-власника, а не центральним реєстром опцій OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера web-fetch Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Відступає до `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілого `tools.web.fetch.firecrawl.apiKey` або змінної середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (за замовчуванням: `https://api.firecrawl.dev`; self-hosted override-и мають націлюватися на приватні/внутрішні endpoint-и).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (за замовчуванням: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (за замовчуванням: `172800000` / 2 дні).
  - `timeoutSeconds`: timeout запиту scrape у секундах (за замовчуванням: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для використання в пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (за замовчуванням `false`).
  - `frequency`: cron-періодичність для кожного повного проходу dreaming (`"0 3 * * *"` за замовчуванням).
  - `model`: необов’язковий override моделі subagent Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз із моделлю сесії за замовчуванням; помилки довіри або allowlist не відступають мовчки.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті міститься в [Довідка з конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Claude bundle plugins також можуть надавати вбудовані значення Pi за замовчуванням із `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: виберіть активний ідентифікатор plugin пам’яті або `"none"`, щоб вимкнути plugins пам’яті.
- `plugins.slots.contextEngine`: виберіть активний ідентифікатор plugin рушія контексту; за замовчуванням `"legacy"`, якщо ви не встановите й не виберете інший рушій.

Див. [Plugins](/uk/tools/plugin).

---

## Зобов’язання

`commitments` керує виведеною пам’яттю подальших дій: OpenClaw може виявляти check-in-и з ходів розмови й доставляти їх через heartbeat-запуски.

- `commitments.enabled`: увімкнути приховане LLM-витягнення, зберігання й доставку heartbeat для виведених зобов’язань щодо подальших дій. За замовчуванням: `false`.
- `commitments.maxPerDay`: максимальна кількість виведених зобов’язань щодо подальших дій, доставлених за сесію агента в рухомому денному вікні. За замовчуванням: `3`.

Див. [Виведені зобов’язання](/uk/concepts/commitments).

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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, коли його не задано, тому навігація браузера за замовчуванням залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте навігації браузера в приватній мережі.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі підключення (запуск/зупинка/скидання вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL WebSocket DevTools.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до віддаленої та
  `attachOnly` доступності CDP, а також до запитів відкриття вкладок. Керовані профілі local loopback
  зберігають локальні типові значення CDP.
- Якщо зовнішньо керована служба CDP доступна через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw трактує порт loopback як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися на
  вибраному хості або через підключений вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на базі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання CSS-селекторами, хуки завантаження
  одного файлу, без перевизначень тайм-аутів діалогів, без `wait --load networkidle`, а також без
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
- Порядок автовиявлення: браузер за замовчуванням, якщо він на базі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для окремого профілю в профілях `existing-session` також розгортається з тильдою.
- Служба керування: лише loopback (порт виводиться з `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад
  `--disable-gpu`, розмір вікна або прапорці налагодження).

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

- `seamColor`: акцентний колір для хрому інтерфейсу нативного застосунку (відтінок бульбашки режиму розмови тощо).
- `assistant`: перевизначення ідентичності інтерфейсу керування. Якщо не задано, використовується ідентичність активного агента.

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

- `mode`: `local` (запустити Gateway) або `remote` (підключитися до віддаленого Gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (за замовчуванням), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хостів (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: стандартний bind `loopback` слухає на `127.0.0.1` всередині контейнера. З мережевим мостом Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому Gateway недоступний. Використовуйте `--network host` або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: обов’язкова за замовчуванням. Bind не через loopback потребують автентифікації Gateway. На практиці це означає спільний токен/пароль або reverse proxy з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер onboarding за замовчуванням генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRefs), явно задайте `gateway.auth.mode` як `token` або `password`. Потоки запуску та встановлення/відновлення сервісу завершуються з помилкою, коли налаштовано обидва значення, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; цей режим навмисно не пропонується підказками onboarding.
- `gateway.auth.mode: "trusted-proxy"`: делегує автентифікацію браузера/користувача reverse proxy з урахуванням ідентичності та довіряє заголовкам ідентичності з `gateway.trustedProxies` (див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth)). Цей режим за замовчуванням очікує джерело проксі **не через loopback**; reverse proxy на тому самому хості через loopback потребують явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні викликачі з того самого хоста можуть використовувати `gateway.auth.password` як локальний прямий резервний варіант; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевірено через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію заголовка Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації Gateway. Цей потік без токена припускає, що хост Gateway є довіреним. За замовчуванням `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих автентифікацій. Застосовується для кожного IP клієнта та кожної області автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому паралельні неправильні спроби від того самого клієнта можуть спрацювати обмежувач уже на другому запиті, замість того щоб обидві пройшли як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` за замовчуванням має значення `true`; задайте `false`, коли ви навмисно хочете обмежувати частоту також для localhost-трафіку (для тестових налаштувань або строгих розгортань проксі).
- Спроби WS-автентифікації з браузерного origin завжди обмежуються з вимкненим винятком для loopback (додатковий захист від браузерного brute force на localhost).
- На loopback такі блокування браузерних origin ізольовані для кожного нормалізованого значення `Origin`, тож повторні помилки з одного localhost origin не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind loopback) або `funnel` (публічний, потребує автентифікації).
- `controlUi.allowedOrigins`: явний allowlist браузерних origin для підключень Gateway WebSocket. Обов’язково, коли очікуються браузерні клієнти з origin не через loopback.
- `controlUi.chatMessageMaxWidth`: необов’язкова max-width для згрупованих повідомлень чату Control UI. Приймає обмежені значення ширини CSS, як-от `960px`, `82%`, `min(1280px, 82%)` і `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає резервне визначення origin за заголовком Host для розгортань, що навмисно покладаються на політику origin за заголовком Host.
- `remote.transport`: `ssh` (за замовчуванням) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійне перевизначення на рівні середовища клієнтського процесу, яке дозволяє plaintext `ws://` до довірених IP приватної мережі; за замовчуванням plaintext залишається лише для loopback. Еквівалента в `openclaw.json` немає, а конфігурація приватної мережі браузера, така як `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнтів Gateway WebSocket.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Самі по собі вони не налаштовують автентифікацію Gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS-URL зовнішнього APNs relay, який використовується офіційними/TestFlight iOS-збірками після публікації relay-backed реєстрацій у Gateway. Ця URL має збігатися з URL relay, скомпільованою в iOS-збірку.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від Gateway до relay у мілісекундах. За замовчуванням `10000`.
- Relay-backed реєстрації делегуються конкретній ідентичності Gateway. Спарений iOS-застосунок отримує `gateway.identity.get`, включає цю ідентичність у relay-реєстрацію та пересилає Gateway грант надсилання, обмежений цією реєстрацією. Інший Gateway не може повторно використати збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env-перевизначення для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch лише для розробки для HTTP URL relay через loopback. Production URL relay мають залишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: тайм-аут pre-auth рукостискання Gateway WebSocket у мілісекундах. За замовчуванням: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли задано. Збільшуйте це значення на завантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки прогрів запуску ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал монітора стану каналу в хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски монітора стану. За замовчуванням: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого socket у хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. За замовчуванням: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітора стану на канал/акаунт у ковзній годині. За замовчуванням: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out для кожного каналу від перезапусків монітора стану зі збереженням увімкненого глобального монітора.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для кожного акаунта в багатоканальних каналах. Коли задано, має пріоритет над перевизначенням рівня каналу.
- Локальні шляхи викликів Gateway можуть використовувати `gateway.remote.*` як резервний варіант лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується закритою відмовою (без маскування через віддалений резервний варіант).
- `trustedProxies`: IP reverse proxy, які завершують TLS або додають заголовки пересланого клієнта. Вказуйте лише проксі, які ви контролюєте. Записи loopback усе ще дійсні для налаштувань проксі/локального виявлення на тому самому хості (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, Gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. За замовчуванням `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий CIDR/IP allowlist для автоматичного схвалення першого pairing пристрою node без запитаних scopes. Вимкнено, коли не задано. Це не схвалює автоматично pairing operator/browser/Control UI/WebChat і не схвалює автоматично оновлення ролі, scope, метаданих або публічного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування дозволів/заборон для оголошених команд node після pairing та оцінювання platform allowlist. Використовуйте `allowCommands`, щоб увімкнути небезпечні команди node, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо platform default або явний дозвіл інакше включив би її. Після того як node змінює свій оголошений список команд, відхиліть і повторно схваліть pairing цього пристрою, щоб Gateway зберіг оновлений snapshot команд.
- `gateway.tools.deny`: додаткові назви tools, заблоковані для HTTP `POST /tools/invoke` (розширює стандартний список deny).
- `gateway.tools.allow`: вилучити назви tools зі стандартного HTTP deny list.

</Accordion>

### OpenAI-сумісні кінцеві точки

- Chat Completions: вимкнено за замовчуванням. Увімкніть за допомогою `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-вводу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlists трактуються як не задані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false` і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS origins, які ви контролюєте; див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох інстансів

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

- `enabled`: вмикає завершення TLS на listener Gateway (HTTPS/WSS) (за замовчуванням: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, коли явні файли не налаштовано; лише для локального/dev використання.
- `certPath`: шлях файлової системи до файлу TLS-сертифіката.
- `keyPath`: шлях файлової системи до файлу приватного ключа TLS; тримайте доступ обмеженим.
- `caPath`: необов’язковий шлях до CA bundle для перевірки клієнтів або custom trust chains.

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
  - `"hot"`: застосовувати зміни всередині процесу без перезапуску.
  - `"hybrid"` (за замовчуванням): спершу спробувати hot reload; за потреби перейти до перезапуску.
- `debounceMs`: debounce-вікно в мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс для очікування in-flight операцій перед примусовим перезапуском. Опустіть його, щоб використати стандартне обмежене очікування (`300000`); задайте `0`, щоб чекати безстроково й логувати періодичні попередження про все ще pending операції.

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

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` потребує непорожнього `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо зіставлення або пресет використовує шаблонізований `sessionKey`, установіть `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі зіставлення не потребують такого явного ввімкнення.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з корисного навантаження запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → визначається через `hooks.mappings`
  - Значення `sessionKey` зіставлення, відрендерені з шаблону, вважаються наданими ззовні й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` зіставляється з підшляхом після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` зіставляється з полем корисного навантаження для універсальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з корисного навантаження.
- `transform` може вказувати на модуль JS/TS, який повертає дію хука.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи й обхід каталогів відхиляються).
  - Тримайте `hooks.transformsDir` у `~/.openclaw/hooks/transforms`; каталоги Skills робочого простору відхиляються. Якщо `openclaw doctor` повідомляє, що цей шлях недійсний, перемістіть модуль трансформації в каталог трансформацій хуків або видаліть `hooks.transformsDir`.
- `agentId` спрямовує до конкретного агента; невідомі ідентифікатори повертаються до типового значення.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків агента хуків без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і ключам сесій зіставлення, керованим шаблонами, задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + зіставлення), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-яке зіставлення або пресет використовує шаблонізований `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску хука (має бути дозволено, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований пресет Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію для кожного повідомлення, установіть `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібне `hooks.allowRequestSessionKey: false`, перевизначте пресет зі статичним `sessionKey` замість шаблонізованого типового значення.

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

- Обслуговує редаговані агентом HTML/CSS/JS і A2UI через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: зберігайте `gateway.bind: "loopback"` (типово).
- Прив’язки не до loopback: маршрути canvas потребують автентифікації Gateway (токен/пароль/довірений проксі), так само як інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки автентифікації; після спарювання й підключення вузла Gateway оголошує URL можливостей, обмежені вузлом, для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії вузла й швидко спливають. Резервний варіант на основі IP не використовується.
- Впроваджує клієнт live-reload в обслуговуваний HTML.
- Автоматично створює початковий `index.html`, коли порожньо.
- Також обслуговує A2UI за `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску Gateway.
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

- `minimal` (типово, коли ввімкнено вбудований Plugin `bonjour`): пропускає `cliPath` + `sshPort` у TXT-записах.
- `full`: включає `cliPath` + `sshPort`; LAN multicast-реклама все одно потребує ввімкненого вбудованого Plugin `bonjour`.
- `off`: пригнічує LAN multicast-рекламу без зміни ввімкнення Plugin.
- Вбудований Plugin `bonjour` автоматично запускається на хостах macOS і вмикається вручну на Linux, Windows і контейнеризованих розгортаннях Gateway.
- Ім’я хоста типово дорівнює системному імені хоста, коли воно є дійсною DNS-міткою, інакше використовується `openclaw`. Перевизначте за допомогою `OPENCLAW_MDNS_HOSTNAME`.

### Глобальна зона (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує unicast-зону DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднуйте із DNS-сервером (рекомендовано CoreDNS) + Tailscale split DNS.

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
- Файли `.env`: CWD `.env` + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої оболонки входу.
- Повний порядок пріоритету див. у розділі [Середовище](/uk/help/environment).

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

Посилання на секрети є додатковими: відкриті текстові значення й надалі працюють.

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
- id для `source: "exec"` не повинні містити сегменти шляху, розділені скісною рискою, `.` або `..` (наприклад, `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` застосовується до підтримуваних шляхів облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включено до розв’язання під час виконання та покриття аудиту.

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
- Шляхи постачальників file і exec завершуються із забороною, якщо перевірка ACL Windows недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Постачальник `exec` потребує абсолютного шляху `command` і використовує протокольні payloads через stdin/stdout.
- Типово шляхи команд через символічні посилання відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи через символічні посилання з валідацією розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довіреного каталогу застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` типово мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв’язуються під час активації в знімок у пам’яті, а потім шляхи запитів читають лише цей знімок.
- Фільтрація активної поверхні застосовується під час активації: нерозв’язані посилання на ввімкнених поверхнях призводять до збою запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

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
- `auth-profiles.json` підтримує посилання на рівні значення (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Застарілі плоскі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є форматом виконання; `openclaw doctor --fix` переписує їх у канонічні профілі API-ключів `provider:default` із резервною копією `.legacy-flat.*.bak`.
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані профілю автентифікації на основі SecretRef.
- Статичні облікові дані виконання надходять із розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються після виявлення.
- Застарілі імпорти OAuth надходять із `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: базова затримка в годинах, коли профіль зазнає збою через справжні
  помилки billing/insufficient-credit (типово: `5`). Явний текст про billing може
  все ще потрапляти сюди навіть у відповідях `401`/`403`, але специфічні для провайдера
  текстові зіставники залишаються обмеженими провайдером, якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повторювані HTTP-помилки `402` для вікна використання або
  повідомлення про ліміт витрат організації/робочого простору залишаються в гілці `rate_limit`
  натомість.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин затримки billing для кожного провайдера.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання затримки billing (типово: `24`).
- `authPermanentBackoffMinutes`: базова затримка в хвилинах для високонадійних збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: обмеження в хвилинах для зростання затримки `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників затримки (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілів того самого провайдера для помилок перевантаження перед перемиканням на резервну модель (типово: `1`). Форми зайнятості провайдера, як-от `ModelNotReadyException`, потрапляють сюди.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілів того самого провайдера для помилок обмеження частоти перед перемиканням на резервну модель (типово: `1`). Цей кошик обмеження частоти включає сформований провайдером текст, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `consoleLevel` підвищується до `debug`, коли використано `--verbose`.
- `maxFileBytes`: максимальний розмір активного файлу журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 MB). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: найкраще можливе маскування для консольного виводу, файлових журналів, записів журналу OTLP і збереженого тексту стенограми сеансу. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/стенограм; UI/tool/diagnostic safety surfaces все одно редагують секрети перед надсиланням.

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

- `enabled`: головний перемикач для виводу інструментації (типово: `true`).
- `flags`: масив рядків прапорців, які вмикають цільовий вивід журналу (підтримує символи-замінники на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку без прогресу в мс для класифікації довготривалих сеансів обробки як `session.long_running`, `session.stalled` або `session.stuck`. Відповідь, інструмент, статус, блок і прогрес ACP скидають таймер; повторна діагностика `session.stuck` відступає, доки стан не зміниться.
- `stuckSessionAbortMs`: поріг віку без прогресу в мс, після якого придатна зависла активна робота може бути abort-drained для відновлення. Якщо не задано, OpenClaw використовує безпечніше розширене вікно вбудованого запуску щонайменше 10 хвилин і 5x `stuckSessionWarnMs`.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. у [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL збирача для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові специфічні для сигналів кінцеві точки OTLP. Якщо задані, вони перевизначають `otel.endpoint` лише для відповідного сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт трасування, метрик або журналів.
- `otel.sampleRate`: частота вибірки трасування `0`-`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання телеметрії в мс.
- `otel.captureContent`: добровільне захоплення необробленого вмісту для атрибутів span OTEL. Типово вимкнено. Булеве `true` захоплює несистемний вміст повідомлень/інструментів; форма об’єкта дає змогу явно вмикати `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: перемикач середовища для найновіших експериментальних атрибутів провайдера span GenAI. Типово spans зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: перемикач середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/завершення SDK, що належить Plugin, зберігаючи активними діагностичні слухачі.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища кінцевих точок для конкретних сигналів, що використовуються, коли відповідний ключ конфігурації не задано.
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

- `channel`: канал випуску для встановлень npm/git - `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску Gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автоматичне оновлення для пакетних встановлень (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням stable-каналу (типово: `6`; макс.: `168`).
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

- `enabled`: глобальний функціональний шлюз ACP (типово: `true`; встановіть `false`, щоб приховати диспетчеризацію ACP і можливості spawn).
- `dispatch.enabled`: незалежний шлюз для диспетчеризації ходу сеансу ACP (типово: `true`). Встановіть `false`, щоб залишити команди ACP доступними, блокуючи виконання.
- `backend`: типовий id бекенда виконання ACP (має відповідати зареєстрованому Plugin середовища виконання ACP).
  Спочатку встановіть backend Plugin, і якщо задано `plugins.allow`, включіть id backend Plugin (наприклад `acpx`), інакше бекенд ACP не завантажиться.
- `defaultAgent`: запасний id цільового агента ACP, коли spawns не вказують явну ціль.
- `allowedAgents`: allowlist id агентів, дозволених для сеансів виконання ACP; порожній означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сеансів ACP.
- `stream.coalesceIdleMs`: вікно скидання в режимі простою в мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед розділенням проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів за хід (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потік інкрементально; `"final_only"` буферизує до завершальних подій ходу.
- `stream.hiddenBoundarySeparator`: розділювач перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, проєктованих за хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів у булеві перевизначення видимості для потокових подій.
- `runtime.ttlMinutes`: TTL простою в хвилинах для працівників сеансу ACP перед придатним очищенням.
- `runtime.installCommand`: необов’язкова команда встановлення для запуску під час bootstrapping середовища виконання ACP.

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
- Щоб приховати весь банер (не лише слогани), задайте env `OPENCLAW_HIDE_BANNER=1`.

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

Див. поля ідентичності `agents.list` у [типових налаштуваннях агента](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застарілий, вилучено)

Поточні збірки більше не містять TCP-міст. Nodes підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною схеми конфігурації (перевірка завершується невдачею, доки їх не вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

<Accordion title="Конфігурація застарілого моста (історична довідка)">

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

- `sessionRetention`: як довго зберігати завершені ізольовані сеанси запусків Cron перед видаленням із `sessions.json`. Також керує очищенням архівованих стенограм видалених Cron. Типово: `24h`; задайте `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файлу журналу одного запуску (`cron/runs/<jobId>.jsonl`) перед обрізанням. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки, які зберігаються, коли запускається обрізання журналу запусків. Типово: `2000`.
- `webhookToken`: bearer-токен, що використовується для доставки Cron Webhook POST (`delivery.mode = "webhook"`); якщо пропущено, заголовок автентифікації не надсилається.
- `webhook`: застарілий резервний URL Webhook (http/https), що використовується лише для збережених завдань, які досі мають `notify: true`.

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

- `maxAttempts`: максимальна кількість повторних спроб для одноразових завдань у разі тимчасових помилок (типово: `3`; діапазон: `0`-`10`).
- `backoffMs`: масив затримок backoff у мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1-10 елементів).
- `retryOn`: типи помилок, що запускають повторні спроби - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати всі тимчасові типи.

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
- `after`: кількість послідовних збоїв перед спрацюванням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `includeSkipped`: враховувати послідовні пропущені запуски в поріг сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на backoff помилок виконання.
- `mode`: режим доставки - `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує до налаштованого Webhook.
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

- Типове місце призначення для сповіщень про збої Cron в усіх завданнях.
- `mode`: `"announce"` або `"webhook"`; типово використовується `"announce"`, коли є достатньо даних цілі.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL Webhook. Обов’язково для режиму Webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` на рівні завдання перевизначає це глобальне типове значення.
- Коли ні глобальне, ні задане для завдання місце призначення збою не налаштовано, завдання, які вже доставляють через `announce`, у разі збою повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не є `"webhook"`.

Див. [Завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання Cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблону медіамоделі

Заповнювачі шаблонів, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повний вміст вхідного повідомлення                |
| `{{RawBody}}`      | Сирий вміст (без обгорток історії/відправника)    |
| `{{BodyStripped}}` | Вміст із вилученими згадками групи                |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                 |
| `{{SessionId}}`    | UUID поточного сеансу                             |
| `{{IsNewSession}}` | `"true"`, коли створено новий сеанс               |
| `{{MediaUrl}}`     | Вхідний псевдо-URL медіа                          |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (зображення/аудіо/документ/…)           |
| `{{Transcript}}`   | Стенограма аудіо                                  |
| `{{Prompt}}`       | Розв’язаний медіа prompt для записів CLI          |
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
- Масив файлів: глибоко зливається по порядку (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: розв’язуються відносно файлу, що виконує включення, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми й форми з `../` дозволені лише тоді, коли вони все одно розв’язуються в межах цієї границі.
- Записи, якими володіє OpenClaw і які змінюють лише один розділ верхнього рівня, підкріплений однофайловим включенням, записуються безпосередньо до цього включеного файлу. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, якими володіє OpenClaw; такі записи завершуються відмовою замість розгортання конфігурації.
- Помилки: чіткі повідомлення для відсутніх файлів, помилок розбору й циклічних включень.

---

_Пов’язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
