---
read_when:
    - Вам потрібна точна семантика конфігурації на рівні полів або точні значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник з конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-05-02T09:29:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa8aeec6143ae70905e75f1034005c97c3a72fcaa34f14f61294dece561f4ce6
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Основна довідка з конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Конфігурації](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і посилається назовні, коли підсистема має власну глибшу довідку. Каталоги команд, що належать каналам і plugin, а також глибокі параметри пам'яті/QMD розміщені на власних сторінках, а не на цій.

Істина в коді:

- `openclaw config schema` виводить поточну JSON Schema, що використовується для валідації та Control UI, з об'єднаними метаданими вбудованих/plugin/каналів, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми, обмежений шляхом, для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації щодо поточної поверхні схеми

Шлях пошуку для агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації та обмежень на рівні полів перед редагуванням. Використовуйте
[Конфігурацію](/uk/gateway/configuration) для порад, орієнтованих на завдання, а цю сторінку
для ширшої карти полів, значень за замовчуванням і посилань на довідки підсистем.

Окремі глибокі довідки:

- [Довідка з конфігурації пам'яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації Dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash-команди](/uk/tools/slash-commands) для поточного каталогу вбудованих + bundled команд
- сторінки відповідних власників каналів/plugin для поверхонь команд, специфічних для каналу

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов'язкові — OpenClaw використовує безпечні значення за замовчуванням, коли їх пропущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на окрему сторінку — див.
[Конфігурація — канали](/uk/gateway/config-channels) для `channels.*`,
включно зі Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та іншими
bundled каналами (автентифікація, контроль доступу, кілька акаунтів, керування згадками).

## Значення агента за замовчуванням, multi-agent, сеанси та повідомлення

Перенесено на окрему сторінку — див.
[Конфігурація — агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робоча область, модель, мислення, Heartbeat, пам'ять, медіа, Skills, sandbox)
- `multiAgent.*` (маршрутизація та прив'язки multi-agent)
- `session.*` (життєвий цикл сеансу, Compaction, обрізання)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.speechLocale`: необов'язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: коли не задано, Talk зберігає стандартне вікно паузи платформи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)

## Інструменти та власні провайдери

Політику інструментів, експериментальні перемикачі, конфігурацію інструментів на базі провайдерів і налаштування власного
провайдера / базового URL перенесено на окрему сторінку — див.
[Конфігурація — інструменти та власні провайдери](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, allowlist моделей і налаштування власного провайдера розміщені в
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
- `models.providers`: мапа власних провайдерів із ключами за id провайдера.
- `models.pricing.enabled`: керує фоновою ініціалізацією цін. Коли
  `false`, запуск Gateway пропускає отримання каталогів цін OpenRouter і LiteLLM;
  налаштовані значення `models.providers.*.models[].cost` все одно працюють для локальних оцінок вартості.

## MCP

Визначення MCP-серверів, керованих OpenClaw, розміщені в `mcp.servers` і
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
  `type: "http"` — це CLI-нативний alias, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.sessionIdleTtlMs`: TTL простою для bundled MCP runtime, обмежених сеансом.
  Одноразові вбудовані запуски запитують очищення після завершення запуску; цей TTL є резервним механізмом для
  довготривалих сеансів і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються гаряче шляхом звільнення кешованих MCP runtime сеансу.
  Наступне виявлення/використання інструментів відтворює їх із нової конфігурації, тож видалені
  записи `mcp.servers` прибираються негайно, а не чекають на TTL простою.

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

- `allowBundled`: необов'язковий allowlist лише для bundled Skills (керовані/робочі Skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені Skills (найнижчий пріоритет).
- `install.preferBrew`: коли true, надавати перевагу інсталяторам Homebrew, якщо `brew`
  доступний, перед переходом до інших типів інсталяторів.
- `install.nodeManager`: перевага інсталятора node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/встановлений.
- `entries.<skillKey>.apiKey`: зручність для Skills, що оголошують основну змінну env (plaintext string або об'єкт SecretRef).

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
- Виявлення приймає нативні plugins OpenClaw, а також сумісні Codex bundles і Claude bundles, включно з manifestless Claude bundles зі стандартним layout.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов'язковий allowlist (завантажуються лише перелічені plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні plugin (коли підтримується plugin).
- `plugins.entries.<id>.env`: мапа змінних env, обмежена plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` та ігнорує поля, що змінюють prompt, із legacy `before_agent_start`, зберігаючи legacy `modelOverride` і `providerOverride`. Застосовується до нативних hook plugin і підтримуваних директорій hook, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені небудовані bundled plugins можуть читати сирий вміст розмови з типізованих hook, як-от `llm_input`, `llm_output`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довірити цьому plugin запитувати per-run перевизначення `provider` і `model` для фонових запусків subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов'язковий allowlist канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об'єкт конфігурації, визначений plugin (валідується нативною схемою plugin OpenClaw, коли доступна).
- Налаштування акаунта/runtime channel plugin розміщені в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфесту plugin-власника, а не центральним реєстром опцій OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера web-fetch Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Резервно використовує `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` або змінну env `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (за замовчуванням: `https://api.firecrawl.dev`; self-hosted перевизначення мають вказувати на приватні/внутрішні endpoints).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (за замовчуванням: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (за замовчуванням: `172800000` / 2 дні).
  - `timeoutSeconds`: timeout запиту scrape в секундах (за замовчуванням: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для використання в пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (за замовчуванням `false`).
  - `frequency`: cron-періодичність для кожного повного проходу dreaming (`"0 3 * * *"` за замовчуванням).
  - `model`: необов'язкове перевизначення моделі subagent Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз із моделлю сеансу за замовчуванням; збої довіри або allowlist не мають тихого fallback.
  - політика фаз і пороги є деталями реалізації (не user-facing ключами конфігурації).
- Повна конфігурація пам'яті розміщена в [Довідці з конфігурації пам'яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Claude bundle plugins також можуть додавати вбудовані значення Pi за замовчуванням із `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати id активного memory plugin або `"none"`, щоб вимкнути memory plugins.
- `plugins.slots.contextEngine`: вибрати id активного context engine plugin; за замовчуванням `"legacy"`, якщо ви не встановите й не виберете інший engine.

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
- `tabCleanup` звільняє відстежувані вкладки основного агента після часу простою або коли сеанс
  перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо значення не задано, тому навігація браузера за замовчуванням залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте навігації браузера приватною мережею.
- У суворому режимі кінцеві точки віддалених профілів CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок доступності та виявлення.
- `ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі підключення (запуск/зупинка/скидання вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL WebSocket DevTools.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до віддаленої та
  `attachOnly` доступності CDP, а також до запитів відкриття вкладок. Керовані профілі
  loopback зберігають локальні стандартні значення CDP.
- Якщо зовнішньо керована служба CDP доступна через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw розглядатиме порт loopback як
  локально керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися на
  вибраному хості або через підключений браузерний вузол.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на певний
  профіль браузера на базі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання CSS-селектором, хуки завантаження
  одного файлу, без перевизначень тайм-аутів діалогів, без `wait --load networkidle` і без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локально керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; задавайте
  `cdpUrl` явно лише для віддаленого CDP.
- Локально керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локально керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності CDP websocket після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  успішно запускається, але перевірки готовності змагаються зі стартом. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: стандартний браузер, якщо він на базі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для кожного профілю на профілях `existing-session` також розгортається з тильдою.
- Служба керування: лише loopback (порт виводиться з `gateway.port`, стандартно `18791`).
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

- `seamColor`: акцентний колір для хрому UI нативного застосунку (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення ідентичності Control UI. Відступає до ідентичності активного агента.

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

<Accordion title="Докладніше про поля Gateway">

- `mode`: `local` (запустити gateway) або `remote` (підключитися до віддаленого gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає на `127.0.0.1` всередині контейнера. З мережевим мостом Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому gateway недоступний. Використовуйте `--network host` або встановіть `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: типово обов’язкова. Bind не на loopback вимагає автентифікації gateway. На практиці це означає спільний токен/пароль або reverse proxy з підтримкою ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер онбордингу типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема SecretRefs), явно задайте `gateway.auth.mode` як `token` або `password`. Потоки запуску та встановлення/ремонту служби завершуються помилкою, коли обидва параметри налаштовані, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; це навмисно не пропонується підказками онбордингу.
- `gateway.auth.mode: "trusted-proxy"`: делегує автентифікацію браузера/користувача reverse proxy з підтримкою ідентичності та довіряє заголовкам ідентичності з `gateway.trustedProxies` (див. [Автентифікація через довірений proxy](/uk/gateway/trusted-proxy-auth)). Цей режим типово очікує джерело proxy **не на loopback**; reverse proxy на loopback того самого хоста вимагають явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні виклики з того самого хоста можуть використовувати `gateway.auth.password` як локальний прямий резервний варіант; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію інтерфейсу керування/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію заголовками Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації gateway. Цей потік без токена припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб автентифікації. Застосовується для кожної IP-адреси клієнта та кожної області автентифікації (shared-secret і device-token відстежуються окремо). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху інтерфейсу керування Tailscale Serve невдалі спроби для тієї самої пари `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні неправильні спроби від того самого клієнта можуть спрацювати обмежувачем уже на другому запиті, замість того щоб обидві пройшли як прості невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; задайте `false`, коли навмисно хочете обмежувати частоту й для localhost-трафіку (для тестових налаштувань або суворих розгортань proxy).
- Спроби автентифікації WS з браузерного origin завжди обмежуються з вимкненим винятком для loopback (додатковий захист від браузерного перебору localhost).
- На loopback такі блокування з браузерного origin ізольовані за нормалізованим значенням `Origin`,
  тому повторні помилки з одного localhost-origin не блокують автоматично
  інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind на loopback) або `funnel` (публічний, вимагає автентифікації).
- `controlUi.allowedOrigins`: явний список дозволених браузерних origin для підключень WebSocket до Gateway. Обов’язковий, коли очікуються браузерні клієнти з origin не на loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, що вмикає резервне визначення origin за заголовком Host для розгортань, які навмисно покладаються на політику origin за заголовком Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійне перевизначення середовища процесу на боці клієнта,
  яке дозволяє plaintext `ws://` до довірених IP приватної мережі;
  типово plaintext лишається дозволеним лише для loopback. Еквівалента в `openclaw.json`
  немає, а конфігурація приватної мережі браузера, така як
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнтів
  WebSocket Gateway.
- `gateway.remote.token` / `.password` — поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують автентифікацію gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS-URL для зовнішнього relay APNs, який використовується офіційними/TestFlight збірками iOS після публікації реєстрацій із підтримкою relay до gateway. Ця URL має збігатися з URL relay, скомпільованою в iOS-збірку.
- `gateway.push.apns.relay.timeoutMs`: таймаут надсилання від gateway до relay у мілісекундах. Типово `10000`.
- Реєстрації з підтримкою relay делегуються конкретній ідентичності gateway. Спарений iOS-застосунок отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію relay і пересилає gateway дозвіл надсилання, обмежений реєстрацією. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env-перевизначення для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: лише для розробки, аварійний обхід для HTTP-URL relay на loopback. Production-URL relay мають залишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: таймаут WebSocket-рукостискання Gateway до автентифікації в мілісекундах. Типово: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли задано. Збільшуйте це значення на навантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки прогрів запуску ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал моніторингу стану каналу в хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски монітора стану. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого socket у хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітора стану на канал/обліковий запис у ковзній годині. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: вимкнення перезапусків монітора стану для окремого каналу з увімкненим глобальним монітором.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для окремого облікового запису в багатооблікових каналах. Коли задано, має пріоритет над перевизначенням на рівні каналу.
- Локальні шляхи викликів gateway можуть використовувати `gateway.remote.*` як резерв лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується закрито (без маскування віддаленим резервом).
- `trustedProxies`: IP reverse proxy, які завершують TLS або вставляють заголовки forwarded-client. Вказуйте лише proxy, які ви контролюєте. Записи loopback усе ще чинні для налаштувань proxy/локального виявлення на тому самому хості (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий список дозволених CIDR/IP для автоматичного схвалення першого спарювання пристрою node без запитаних scopes. Вимкнено, коли не задано. Це не схвалює автоматично спарювання оператора/браузера/інтерфейсу керування/вебчату, а також не схвалює автоматично оновлення ролі, scope, metadata або публічного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд node після спарювання та оцінки списку дозволеного платформою. Використовуйте `allowCommands`, щоб увімкнути небезпечні команди node, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо типовий дозвіл платформи або явний allow інакше включив би її. Після того як node змінює свій оголошений список команд, відхиліть і повторно схваліть спарювання цього пристрою, щоб gateway зберіг оновлений знімок команд.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий список заборон).
- `gateway.tools.allow`: вилучити назви інструментів із типового списку HTTP-заборон.

</Accordion>

### OpenAI-сумісні кінцеві точки

- Chat Completions: типово вимкнено. Увімкніть за допомогою `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення безпеки URL-вводу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні списки дозволених вважаються незаданими; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення безпеки відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS-origin, які ви контролюєте; див. [Автентифікація через довірений proxy](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька gateway на одному хості з унікальними портами й каталогами стану:

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
- `autoGenerate`: автоматично генерує локальну самопідписану пару сертифікат/ключ, коли явні файли не налаштовані; лише для локального використання/розробки.
- `certPath`: шлях у файловій системі до файлу TLS-сертифіката.
- `keyPath`: шлях у файловій системі до файлу приватного TLS-ключа; тримайте права доступу обмеженими.
- `caPath`: необов’язковий шлях до CA bundle для перевірки клієнтів або власних ланцюгів довіри.

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
  - `"restart"`: завжди перезапускати процес gateway у разі зміни конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати гаряче перезавантаження; за потреби перейти до перезапуску.
- `debounceMs`: debounce-вікно в мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс для очікування операцій у процесі перед примусовим перезапуском. Не вказуйте, щоб використати типове обмежене очікування (`300000`); задайте `0`, щоб чекати безстроково й періодично записувати попередження про ще незавершені операції.

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
Токени hook у рядку запиту відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` вимагає непорожнього `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо зіставлення або пресет використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі зіставлення не потребують такого opt-in.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з payload запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв'язується через `hooks.mappings`
  - Значення `sessionKey` зіставлення, відрендерені шаблоном, вважаються наданими ззовні й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Подробиці зіставлення">

- `match.path` зіставляє підшлях після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають із payload.
- `transform` може вказувати на JS/TS-модуль, який повертає дію hook.
  - `transform.module` має бути відносним шляхом і лишатися в межах `hooks.transformsDir` (абсолютні шляхи та traversal відхиляються).
  - Тримайте `hooks.transformsDir` у `~/.openclaw/hooks/transforms`; директорії Skills у workspace відхиляються. Якщо `openclaw doctor` повідомляє, що цей шлях недійсний, перемістіть модуль transform у директорію hooks transforms або приберіть `hooks.transformsDir`.
- `agentId` маршрутизує до конкретного агента; невідомі ID повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов'язковий фіксований ключ сесії для запусків агента hook без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і керованим шаблонами ключам сесії зіставлення задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов'язковий allowlist префіксів для явних значень `sessionKey` (запит + зіставлення), наприклад `["hook:"]`. Він стає обов'язковим, коли будь-яке зіставлення або пресет використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово дорівнює `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволено, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований пресет Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте цю маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` відповідно до простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
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

- Обслуговує доступні для редагування агентом HTML/CSS/JS і A2UI через HTTP під портом Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Прив'язки не до loopback: маршрути canvas потребують автентифікації Gateway (токен/пароль/trusted-proxy), як і інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки автентифікації; після pairing і підключення node Gateway оголошує URL можливостей, scoped до node, для доступу до canvas/A2UI.
- URL можливостей прив'язані до активної WS-сесії node і швидко закінчуються. Fallback на основі IP не використовується.
- Вставляє клієнт live-reload в обслуговуваний HTML.
- Автоматично створює стартовий `index.html`, коли порожньо.
- Також обслуговує A2UI за `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
- Вимикайте live reload для великих директорій або помилок `EMFILE`.

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
- Ім'я хоста типово дорівнює системному імені хоста, коли воно є дійсною DNS-міткою, і повертається до `openclaw` інакше. Перевизначте через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

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

### `env` (inline змінні середовища)

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

- Inline змінні середовища застосовуються лише якщо в process env відсутній ключ.
- Файли `.env`: CWD `.env` + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з вашого профілю login shell.
- Див. [Середовище](/uk/help/environment) для повного пріоритету.

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

Посилання на секрети є additive: plaintext значення все ще працюють.

### `SecretRef`

Використовуйте одну форму об'єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id для `source: "exec"` не мають містити сегменти шляху `.` або `..`, розділені скісними рисками (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включені в runtime resolution і audit coverage.

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

- Провайдер `file` підтримує `mode: "json"` і `mode: "singleValue"` (`id` має бути `"value"` в режимі singleValue).
- Шляхи провайдерів file і exec fail closed, коли перевірка Windows ACL недоступна. Задавайте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` вимагає абсолютного шляху `command` і використовує protocol payloads через stdin/stdout.
- Типово symlink шляхи команд відхиляються. Задайте `allowSymlinkCommand: true`, щоб дозволити symlink шляхи під час валідації розв'язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка trusted-dir застосовується до розв'язаного цільового шляху.
- Дочірнє середовище `exec` типово мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв'язуються під час активації в in-memory snapshot, після чого шляхи запитів читають лише snapshot.
- Фільтрація active-surface застосовується під час активації: нерозв'язані посилання на ввімкнених поверхнях зупиняють startup/reload з помилкою, тоді як неактивні поверхні пропускаються з diagnostics.

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
- `auth-profiles.json` підтримує refs на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Застарілі плоскі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є runtime-форматом; `openclaw doctor --fix` переписує їх у канонічні API-key-профілі `provider:default` із резервною копією `.legacy-flat.*.bak`.
- Профілі в OAuth-режимі (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні runtime облікові дані надходять з in-memory resolved snapshots; застарілі статичні записи `auth.json` очищаються, коли їх виявлено.
- Застарілі OAuth імпорти з `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: базовий backoff у годинах, коли профіль зазнає збою через справжні помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг усе ще може потрапити сюди навіть у відповідях `401`/`403`, але специфічні для провайдера текстові зіставлення залишаються обмеженими провайдером, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Повідомлення повторюваного HTTP `402` про вікно використання або ліміти витрат організації/робочого простору натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин backoff для білінгу за провайдерами.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання backoff білінгу (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для високодостовірних збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: обмеження в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: рухоме вікно в годинах, що використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій профілів автентифікації того самого провайдера для помилок перевантаження перед перемиканням на резервну модель (типово: `1`). Сюди потрапляють форми зайнятості провайдера, як-от `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій профілів автентифікації того самого провайдера для помилок ліміту частоти перед перемиканням на резервну модель (типово: `1`). Цей кошик ліміту частоти включає текст у форматі провайдера, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `maxFileBytes`: максимальний розмір активного файла журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 MB). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування за найкращим зусиллям для виводу консолі, файлових журналів, записів журналів OTLP і збереженого тексту транскрипту сесії. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/транскриптів; поверхні безпеки UI/інструментів/діагностики все одно редагують секрети перед виведенням.

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
- `flags`: масив рядків прапорців, що вмикають цільовий вивід журналів (підтримує шаблони на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку без прогресу в мс для класифікації довготривалих сесій обробки як `session.long_running`, `session.stalled` або `session.stuck`. Відповідь, інструмент, статус, блок і прогрес ACP скидають таймер; повторна діагностика `session.stuck` виконує backoff, доки стан не змінюється.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. у [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові OTLP-ендпоїнти для конкретних сигналів. Коли задано, вони перевизначають `otel.endpoint` лише для цього сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: вмикають експорт трас, метрик або журналів.
- `otel.sampleRate`: частота семплювання трас `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання телеметрії в мс.
- `otel.captureContent`: явне ввімкнення захоплення сирого вмісту для атрибутів span OTEL. Типово вимкнено. Булеве `true` захоплює несистемний вміст повідомлень/інструментів; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: перемикач середовища для найновіших експериментальних атрибутів провайдера span GenAI. Типово spans зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: перемикач середовища для хостів, які вже зареєстрували глобальний OpenTelemetry SDK. Тоді OpenClaw пропускає запуск/завершення SDK, що належить Plugin, зберігаючи діагностичні слухачі активними.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища для ендпоїнтів конкретних сигналів, що використовуються, коли відповідний ключ конфігурації не задано.
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

- `channel`: канал випуску для встановлень npm/git — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску Gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для пакетних встановлень (типово: `false`).
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

- `enabled`: глобальний feature gate ACP (типово: `true`; задайте `false`, щоб приховати dispatch ACP і можливості spawn).
- `dispatch.enabled`: незалежний gate для dispatch ходу сесії ACP (типово: `true`). Задайте `false`, щоб зберегти команди ACP доступними, але заблокувати виконання.
- `backend`: стандартний ідентифікатор бекенда середовища виконання ACP (має збігатися із зареєстрованим Plugin середовища виконання ACP).
  Спочатку встановіть Plugin бекенда, і якщо задано `plugins.allow`, додайте ідентифікатор Plugin бекенда (наприклад `acpx`), інакше бекенд ACP не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли spawns не вказують явну ціль.
- `allowedAgents`: allowlist ідентифікаторів агентів, дозволених для сесій середовища виконання ACP; порожній означає відсутність додаткового обмеження.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед поділом проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів за хід (типово: `true`).
- `stream.deliveryMode`: `"live"` транслює інкрементально; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, що проєктується за хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис імен тегів у булеві перевизначення видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для працівників сесії ACP перед тим, як вони стають придатними для очищення.
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

- `cli.banner.taglineMode` керує стилем tagline банера:
  - `"random"` (типово): змінні смішні/сезонні taglines.
  - `"default"`: фіксована нейтральна tagline (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту tagline (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише taglines), задайте env `OPENCLAW_HIDE_BANNER=1`.

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

Див. поля ідентичності `agents.list` у [стандартних налаштуваннях агента](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застарілий, вилучено)

Поточні збірки більше не містять TCP-міст. Nodes підключаються через Gateway WebSocket. Ключі `bridge.*` більше не є частиною схеми конфігурації (валідація не проходить, доки їх не буде вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

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

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запусків cron перед видаленням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. Типово: `24h`; задайте `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файла журналу на запуск (`cron/runs/<jobId>.jsonl`) перед обрізанням. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки, що зберігаються, коли запускається обрізання журналу запуску. Типово: `2000`.
- `webhookToken`: bearer-токен, що використовується для доставки cron webhook POST (`delivery.mode = "webhook"`); якщо пропущено, заголовок автентифікації не надсилається.
- `webhook`: застарілий резервний URL webhook (http/https), що використовується лише для збережених завдань, які все ще мають `notify: true`.

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

- `maxAttempts`: максимальна кількість повторних спроб для одноразових завдань у разі тимчасових помилок (за замовчуванням: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок відступу в мс для кожної повторної спроби (за замовчуванням: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, які запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Опустіть, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових завдань cron. Повторювані завдання використовують окрему обробку збоїв.

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

- `enabled`: увімкнути сповіщення про збої для завдань cron (за замовчуванням: `false`).
- `after`: кількість послідовних збоїв до спрацювання сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `includeSkipped`: враховувати послідовні пропущені запуски в порозі сповіщення (за замовчуванням: `false`). Пропущені запуски відстежуються окремо й не впливають на відступ після помилок виконання.
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує в налаштований webhook.
- `accountId`: необов’язковий ідентифікатор облікового запису або каналу для обмеження області доставки сповіщення.

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

- Типове призначення для сповіщень про збої cron в усіх завданнях.
- `mode`: `"announce"` або `"webhook"`; за замовчуванням `"announce"`, коли є достатньо даних цілі.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL webhook. Обов’язково для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` на рівні завдання перевизначає це глобальне значення за замовчуванням.
- Коли ні глобальне, ні задане на рівні завдання призначення збою не встановлено, завдання, які вже доставляють через `announce`, у разі збою повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблону медіамоделі

Заповнювачі шаблону, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повний текст вхідного повідомлення                |
| `{{RawBody}}`      | Необроблений текст (без обгорток історії/відправника) |
| `{{BodyStripped}}` | Текст із вилученими згадками групи                |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                 |
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (зображення/аудіо/документ/…)           |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Визначений медіапромпт для записів CLI            |
| `{{MaxChars}}`     | Визначена максимальна кількість символів виводу для записів CLI |
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
- Масив файлів: глибоко зливається по порядку (пізніші значення перевизначають попередні).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: розв’язуються відносно файлу, що виконує включення, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` файлу `openclaw.json`). Абсолютні форми або форми з `../` дозволені лише тоді, коли вони все одно розв’язуються в цих межах.
- Записи, керовані OpenClaw, які змінюють лише один розділ верхнього рівня, підкріплений включенням одного файлу, записуються наскрізно в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями є лише для читання для записів, керованих OpenClaw; такі записи завершуються закритою помилкою замість вирівнювання конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних включень.

---

_Пов’язане: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Діагностика](/uk/gateway/doctor)_

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
