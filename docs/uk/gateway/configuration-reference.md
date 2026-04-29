---
read_when:
    - Вам потрібна точна семантика конфігурації на рівні полів або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-04-29T01:48:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fd28b7d6a2e670ab97aac206bb14343bd887da3236c6135d7958cc6e97b735
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Довідник основної конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Конфігурація](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і містить посилання на глибші довідники, коли підсистема має власний. Каталоги команд, якими володіють канали й plugin, а також поглиблені параметри пам’яті/QMD розміщені на власних сторінках, а не на цій.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими вбудованих/plugin/каналів, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми з областю дії за шляхом для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації щодо поточної поверхні схеми

Шлях пошуку агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації та обмежень на рівні полів перед редагуванням. Використовуйте
[Конфігурація](/uk/gateway/configuration) для орієнтованих на завдання настанов, а цю сторінку
для ширшої карти полів, значень за замовчуванням і посилань на довідники підсистем.

Окремі поглиблені довідники:

- [Довідник конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash-команди](/uk/tools/slash-commands) для поточного каталогу вбудованих + bundled команд
- сторінки відповідних каналів/plugin для поверхонь команд, специфічних для каналів

Формат конфігурації — **JSON5** (дозволені коментарі та кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, коли їх пропущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на спеціальну сторінку — див.
[Конфігурація — канали](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, шлюзування згадок).

## Стандартні параметри агента, кілька агентів, сеанси та повідомлення

Перенесено на спеціальну сторінку — див.
[Конфігурація — агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, thinking, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (маршрутизація та прив’язки кількох агентів)
- `session.*` (життєвий цикл сеансу, compaction, pruning)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: коли не задано, Talk зберігає стандартне вікно паузи платформи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)

## Інструменти та користувацькі провайдери

Політику інструментів, експериментальні перемикачі, конфігурацію інструментів на базі провайдерів і налаштування користувацького
провайдера / базового URL перенесено на спеціальну сторінку — див.
[Конфігурація — інструменти та користувацькі провайдери](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, списки дозволених моделей і налаштування користувацьких провайдерів розміщені в
[Конфігурація — інструменти та користувацькі провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls).
Корінь `models` також володіє глобальною поведінкою каталогу моделей.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: поведінка каталогу провайдера (`merge` або `replace`).
- `models.providers`: мапа користувацьких провайдерів, ключована за id провайдера.
- `models.pricing.enabled`: керує фоновим bootstrap ціноутворення. Коли
  `false`, запуск Gateway пропускає отримання каталогів цін OpenRouter і LiteLLM;
  налаштовані значення `models.providers.*.models[].cost` усе ще працюють для локальних
  оцінок вартості.

## MCP

Визначення MCP-серверів, керовані OpenClaw, розміщені в `mcp.servers` і
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
  `type: "http"` — CLI-native псевдонім, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.sessionIdleTtlMs`: TTL бездіяльності для bundled MCP runtime з областю дії сеансу.
  Одноразові вбудовані запуски запитують очищення наприкінці виконання; цей TTL є резервним механізмом для
  довготривалих сеансів і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються наживо через утилізацію кешованих MCP runtime сеансу.
  Наступне виявлення/використання інструмента відтворює їх із нової конфігурації, тому видалені
  записи `mcp.servers` прибираються негайно, а не чекають TTL бездіяльності.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI-бекенди](/uk/gateway/cli-backends#bundle-mcp-overlays) щодо runtime-поведінки.

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

- `allowBundled`: необов’язковий список дозволених лише для bundled skills (керовані/workspace skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені skill (найнижчий пріоритет).
- `install.preferBrew`: коли `true`, надає перевагу інсталяторам Homebrew, якщо `brew`
  доступний, перед переходом до інших типів інсталяторів.
- `install.nodeManager`: перевага node-інсталятора для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручне поле для skills, що оголошують основну env var (звичайний текстовий рядок або об’єкт SecretRef).

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
- Виявлення приймає native OpenClaw plugins, а також сумісні Codex bundles і Claude bundles, зокрема manifestless Claude default-layout bundles.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий список дозволених (завантажуються лише перелічені plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні plugin (коли підтримується plugin).
- `plugins.entries.<id>.env`: мапа env var з областю дії plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` та ігнорує поля, що змінюють prompt, зі застарілого `before_agent_start`, водночас зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до native plugin hooks і підтримуваних директорій hooks, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені non-bundled plugins можуть читати raw conversation content із типізованих hooks, таких як `llm_input`, `llm_output`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряє цьому plugin запитувати per-run перевизначення `provider` і `model` для фонових запусків subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених subagent override. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: визначений plugin об’єкт конфігурації (валідується native OpenClaw plugin schema, коли доступна).
- Налаштування облікових записів/runtime каналів plugin розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфесту відповідного plugin, а не центральним реєстром опцій OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера web-fetch Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Повертається до `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілого `tools.web.fetch.firecrawl.apiKey` або env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (за замовчуванням: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (за замовчуванням: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (за замовчуванням: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут scrape-запиту в секундах (за замовчуванням: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (Grok web search).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для використання в пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (за замовчуванням `false`).
  - `frequency`: cron-частота для кожного повного проходу dreaming (`"0 3 * * *"` за замовчуванням).
  - `model`: необов’язкове перевизначення моделі subagent Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз із моделлю сеансу за замовчуванням; помилки довіри або allowlist не мають тихого fallback.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті розміщена в [Довіднику конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Claude bundle plugins також можуть додавати вбудовані стандартні параметри Pi з `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як raw OpenClaw config patches.
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
- `tabCleanup` звільняє відстежувані вкладки основного агента після простою або коли
  сесія перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, коли не задано, тому навігація браузера за замовчуванням залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте навігації браузера приватною мережею.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підлягають такому самому блокуванню приватної мережі під час перевірок досяжності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі приєднання (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає вам прямий DevTools WebSocket URL.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до досяжності віддаленого та
  `attachOnly` CDP, а також до запитів відкриття вкладок. Керовані профілі loopback
  зберігають локальні типові значення CDP.
- Якщо зовнішньо керована служба CDP досяжна через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw розглядає порт loopback як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть приєднуватися на
  вибраному хості або через підключений вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на певний
  профіль браузера на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
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
  готовності CDP websocket після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  запускається успішно, але перевірки готовності випереджають запуск. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: браузер за замовчуванням, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  Профільний `userDataDir` у профілях `existing-session` також розгортається з тильдою.
- Служба керування: лише loopback (порт виводиться з `gateway.port`, типово `18791`).
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

- `seamColor`: акцентний колір для chrome нативного UI застосунку (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення ідентичності Control UI. Повертається до ідентичності активного агента.

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

<Accordion title="Gateway field details">

- `mode`: `local` (запустити Gateway) або `remote` (підключитися до віддаленого Gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми прив’язки**: використовуйте значення режиму прив’язки в `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типова прив’язка `loopback` прослуховує `127.0.0.1` всередині контейнера. З мережевим мостом Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому Gateway недосяжний. Використовуйте `--network host` або задайте `bind: "lan"` (чи `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб прослуховувати всі інтерфейси.
- **Автентифікація**: типово обов’язкова. Прив’язки не до loopback вимагають автентифікації Gateway. На практиці це означає спільний токен/пароль або реверсний проксі з підтримкою ідентифікації з `gateway.auth.mode: "trusted-proxy"`. Майстер початкового налаштування типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема SecretRefs), явно задайте `gateway.auth.mode` як `token` або `password`. Запуск і потоки встановлення/відновлення служби завершуються помилкою, коли налаштовано обидва поля, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; це навмисно не пропонується підказками початкового налаштування.
- `gateway.auth.mode: "trusted-proxy"`: делегує автентифікацію браузера/користувача реверсному проксі з підтримкою ідентифікації та довіряє заголовкам ідентичності від `gateway.trustedProxies` (див. [автентифікацію довіреного проксі](/uk/gateway/trusted-proxy-auth)). Цей режим типово очікує джерело проксі **не з loopback**; реверсні проксі на тому самому хості через loopback потребують явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні викликачі з того самого хоста можуть використовувати `gateway.auth.password` як локальний прямий резервний варіант; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольнити автентифікацію інтерфейсу керування/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію заголовками Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації Gateway. Цей потік без токена припускає, що хост Gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб автентифікації. Застосовується для кожної IP-адреси клієнта й кожної області автентифікації (спільний секрет і токен пристрою відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху інтерфейсу керування Tailscale Serve невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні неправильні спроби від того самого клієнта можуть спрацювати на обмежувач уже на другому запиті, замість того щоб обидві пройти як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; задайте `false`, коли навмисно хочете обмежувати також трафік localhost (для тестових налаштувань або суворих розгортань проксі).
- Спроби WS-автентифікації з браузерного походження завжди обмежуються з вимкненим винятком для loopback (додатковий захист від браузерного перебору localhost).
- На loopback такі блокування з браузерного походження ізольовані за нормалізованим значенням `Origin`, тому повторні невдачі з одного походження localhost не блокують автоматично інше походження.
- `tailscale.mode`: `serve` (лише tailnet, прив’язка loopback) або `funnel` (публічний, потребує автентифікації).
- `controlUi.allowedOrigins`: явний список дозволених браузерних походжень для підключень Gateway WebSocket. Обов’язковий, коли очікуються браузерні клієнти з походжень не з loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, що вмикає резервне визначення походження за заголовком Host для розгортань, які навмисно покладаються на політику походження за заголовком Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: перевизначення через середовище процесу на клієнтському боці для аварійного доступу, яке дозволяє відкритий текст `ws://` до довірених IP-адрес приватної мережі; типово відкритий текст залишається дозволеним лише для loopback. Еквівалента в `openclaw.json` немає, а конфігурація приватної мережі браузера, як-от `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнтів Gateway WebSocket.
- `gateway.remote.token` / `.password` — поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують автентифікацію Gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS-URL для зовнішнього ретранслятора APNs, який використовується офіційними/TestFlight збірками iOS після публікації ними реєстрацій із підтримкою ретранслятора в Gateway. Ця URL має збігатися з URL ретранслятора, скомпільованою в iOS-збірку.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від Gateway до ретранслятора в мілісекундах. Типово `10000`.
- Реєстрації з підтримкою ретранслятора делегуються конкретній ідентичності Gateway. Спарена iOS-програма отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію ретранслятора та пересилає Gateway дозвіл на надсилання, обмежений цією реєстрацією. Інший Gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові перевизначення через змінні середовища для наведеної вище конфігурації ретранслятора.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварійний варіант лише для розробки для HTTP-URL ретранслятора через loopback. Виробничі URL ретранслятора мають залишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: тайм-аут попереднього до автентифікації рукостискання Gateway WebSocket у мілісекундах. Типово: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, якщо задано. Збільшуйте це значення на завантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки прогрів запуску ще завершується.
- `gateway.channelHealthCheckMinutes`: інтервал монітора стану каналу в хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски монітора стану. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітора стану на канал/обліковий запис за ковзну годину. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: вимкнення перезапусків монітора стану для окремого каналу за збереження ввімкненого глобального монітора.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для окремого облікового запису в багатокористувацьких каналах. Коли задано, має пріоритет над перевизначенням на рівні каналу.
- Локальні шляхи виклику Gateway можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується закритою відмовою (без маскування віддаленим резервним варіантом).
- `trustedProxies`: IP-адреси реверсних проксі, які завершують TLS або додають заголовки переспрямованого клієнта. Вказуйте лише проксі, які ви контролюєте. Записи loopback усе ще допустимі для налаштувань проксі/локального виявлення на тому самому хості (наприклад, Tailscale Serve або локальний реверсний проксі), але вони **не** роблять запити loopback придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, Gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для поведінки із закритою відмовою.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий список дозволених CIDR/IP для автоматичного схвалення першого спарювання пристрою Node без запитаних областей доступу. Вимкнено, якщо не задано. Це не схвалює автоматично спарювання оператора/браузера/інтерфейсу керування/WebChat і не схвалює автоматично оновлення ролі, області доступу, метаданих або відкритого ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування дозволів/заборон для оголошених команд Node після спарювання й оцінювання списку дозволів платформи. Використовуйте `allowCommands`, щоб дозволити небезпечні команди Node, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо типове значення платформи або явний дозвіл інакше включали б її. Після того як Node змінює свій оголошений список команд, відхиліть і повторно схваліть спарювання цього пристрою, щоб Gateway зберіг оновлений знімок команд.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий список заборон).
- `gateway.tools.allow`: вилучити назви інструментів із типового списку заборон HTTP.

</Accordion>

### OpenAI-сумісні кінцеві точки

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилений захист URL-вводу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні списки дозволів вважаються незаданими; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false` і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посиленого захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS-походжень, які ви контролюєте; див. [автентифікацію довіреного проксі](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька Gateway на одному хості з унікальними портами й каталогами стану:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Зручні прапорці: `--dev` (використовує `~/.openclaw-dev` + порт `19001`), `--profile <name>` (використовує `~/.openclaw-<name>`).

Див. [кілька Gateway](/uk/gateway/multiple-gateways).

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

- `enabled`: вмикає завершення TLS на слухачі Gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару сертифікат/ключ, коли явні файли не налаштовані; лише для локального використання/розробки.
- `certPath`: шлях файлової системи до файла сертифіката TLS.
- `keyPath`: шлях файлової системи до файла приватного ключа TLS; обмежте права доступу.
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
  - `"off"`: ігнорувати живі редагування; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес Gateway під час зміни конфігурації.
  - `"hot"`: застосовувати зміни в межах процесу без перезапуску.
  - `"hybrid"` (типово): спершу спробувати гаряче перезавантаження; за потреби перейти до перезапуску.
- `debounceMs`: вікно усунення брязкоту в мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс очікування операцій у процесі перед примусовим перезапуском. Опустіть, щоб використати типове обмежене очікування (`300000`); задайте `0`, щоб чекати безстроково й періодично журналювати попередження про все ще незавершені операції.

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
Токени хуків у рядку запиту відхиляються.

Нотатки щодо валідації та безпеки:

- `hooks.enabled=true` вимагає непорожній `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо зіставлення або пресет використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі зіставлення не потребують цього явного ввімкнення.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з тіла запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → визначається через `hooks.mappings`
  - Значення `sessionKey` зіставлення, відтворені з шаблону, вважаються наданими ззовні й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` зіставляє підшлях після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з payload.
- `transform` може вказувати на модуль JS/TS, який повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та обхід каталогів відхиляються).
- `agentId` спрямовує до конкретного агента; невідомі ID повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook-агента без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і керованим шаблонами ключам сесій зіставлення задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + зіставлення), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-яке зіставлення або пресет використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволено, якщо каталог моделей задано).

</Accordion>

### Інтеграція Gmail

- Вбудований пресет Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви залишаєте цю маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
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

- Обслуговує редаговані агентом HTML/CSS/JS та A2UI через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залиште `gateway.bind: "loopback"` (типово).
- Прив’язки не до loopback: маршрути canvas потребують автентифікації Gateway (токен/пароль/довірений проксі), як і інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки автентифікації; після спарення та підключення node Gateway оголошує URL можливостей із областю дії node для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії node і швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт live-reload в обслуговуваний HTML.
- Автоматично створює початковий `index.html`, коли порожньо.
- Також обслуговує A2UI за `/__openclaw__/a2ui/`.
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

- `minimal` (типово): пропускає `cliPath` + `sshPort` у TXT-записах.
- `full`: включає `cliPath` + `sshPort`.
- Ім’я хоста типово дорівнює системному імені хоста, коли воно є дійсною DNS-міткою, і повертається до `openclaw` інакше. Перевизначте через `OPENCLAW_MDNS_HOSTNAME`.

### Глобальна область (DNS-SD)

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

### `env` (вбудовані змінні env)

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

- Вбудовані змінні середовища застосовуються лише якщо в середовищі процесу відсутній ключ.
- Файли `.env`: CWD `.env` + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний порядок пріоритету див. у [Середовище](/uk/help/environment).

### Підстановка змінних середовища

Посилайтеся на змінні середовища в будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Збігаються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте через `$${VAR}` для буквального `${VAR}`.
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
- id для `source: "exec"` не мають містити розділені скісними рисками сегменти шляху `.` або `..` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включені до runtime-вирішення й audit-покриття.

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
- Шляхи провайдерів file і exec закрито відмовляють, коли перевірка ACL Windows недоступна. Встановлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` вимагає абсолютний шлях `command` і використовує protocol payloads через stdin/stdout.
- За замовчуванням шляхи команд-симлінків відхиляються. Встановіть `allowSymlinkCommand: true`, щоб дозволити шляхи симлінків із валідацією розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довіреного каталогу застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` за замовчуванням мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети під час активації розв’язуються в in-memory snapshot, після чого шляхи запитів читають лише snapshot.
- Фільтрація активної поверхні застосовується під час активації: нерозв’язані посилання на ввімкнених поверхнях спричиняють збій startup/reload, тоді як неактивні поверхні пропускаються з діагностикою.

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
- `auth-profiles.json` підтримує посилання рівня значень (`keyRef` для `api_key`, `tokenRef` для `token`) для режимів статичних облікових даних.
- Застарілі пласкі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є runtime-форматом; `openclaw doctor --fix` переписує їх у канонічні профілі API-key `provider:default` із резервною копією `.legacy-flat.*.bak`.
- Профілі режиму OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні runtime-облікові дані надходять з in-memory resolved snapshots; застарілі статичні записи `auth.json` очищуються після виявлення.
- Застарілі OAuth імпортуються з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Runtime-поведінка секретів та інструменти `audit/configure/apply`: [Керування секретами](/uk/gateway/secrets).

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

- `billingBackoffHours`: базова затримка повтору в годинах, коли профіль зазнає збою через справжні
  помилки billing/insufficient-credit (за замовчуванням: `5`). Явний текст про billing може
  все одно потрапити сюди навіть у відповідях `401`/`403`, але провайдер-специфічні текстові
  матчери залишаються обмеженими провайдером, якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Retryable HTTP `402` usage-window або
  повідомлення про organization/workspace spend-limit натомість залишаються у шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин billing backoff для кожного провайдера.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання billing backoff (за замовчуванням: `24`).
- `authPermanentBackoffMinutes`: базова затримка повтору в хвилинах для високонадійних збоїв `auth_permanent` (за замовчуванням: `10`).
- `authPermanentMaxMinutes`: обмеження в хвилинах для зростання backoff `auth_permanent` (за замовчуванням: `60`).
- `failureWindowHours`: ковзне вікно в годинах, яке використовується для лічильників backoff (за замовчуванням: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок перевантаження перед переходом до model fallback (за замовчуванням: `1`). Форми provider-busy, як-от `ModelNotReadyException`, потрапляють сюди.
- `overloadedBackoffMs`: фіксована затримка перед повтором ротації перевантаженого провайдера/профілю (за замовчуванням: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок rate-limit перед переходом до model fallback (за замовчуванням: `1`). Цей rate-limit bucket включає провайдер-подібний текст, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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

- Стандартний файл журналу: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Задайте `logging.file` для стабільного шляху.
- `consoleLevel` підвищується до `debug`, коли використано `--verbose`.
- `maxFileBytes`: максимальний розмір активного файлу журналу в байтах перед ротацією (додатне ціле число; стандартно: `104857600` = 100 МБ). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування за принципом найкращих зусиль для виводу в консоль, файлових журналів, записів журналу OTLP і збереженого тексту стенограми сесії. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/стенограм; поверхні безпеки UI/інструментів/діагностики все одно редагують секрети перед надсиланням.

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

- `enabled`: головний перемикач для виводу інструментації (стандартно: `true`).
- `flags`: масив рядків прапорців, що вмикають цільовий журнальний вивід (підтримує шаблони на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: віковий поріг у мс для надсилання попереджень про завислі сесії, поки сесія лишається в стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (стандартно: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. в [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові специфічні для сигналів кінцеві точки OTLP. Якщо задано, вони перевизначають `otel.endpoint` лише для цього сигналу.
- `otel.protocol`: `"http/protobuf"` (стандартно) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються з запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт трас, метрик або журналів.
- `otel.sampleRate`: частота семплювання трас `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання телеметрії в мс.
- `otel.captureContent`: явне ввімкнення захоплення сирого вмісту для атрибутів span OTEL. Стандартно вимкнено. Булеве `true` захоплює несистемний вміст повідомлень/інструментів; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: змінна середовища для ввімкнення найновіших експериментальних атрибутів постачальника span GenAI. Стандартно spans зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: змінна середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/завершення SDK, що належить plugin, зберігаючи діагностичних слухачів активними.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища кінцевих точок для окремих сигналів, що використовуються, коли відповідний ключ конфігурації не задано.
- `cacheTrace.enabled`: записувати знімки трасування кешу для вбудованих запусків (стандартно: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL трасування кешу (стандартно: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід трасування кешу (усі стандартно: `true`).

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
- `checkOnStart`: перевіряти оновлення npm під час запуску Gateway (стандартно: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для пакетних встановлень (стандартно: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням у stable-каналі (стандартно: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання stable-каналу в годинах (стандартно: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки beta-каналу, у годинах (стандартно: `1`; максимум: `24`).

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

- `enabled`: глобальний функціональний gate ACP (стандартно: `true`; задайте `false`, щоб приховати можливості dispatch і spawn ACP).
- `dispatch.enabled`: незалежний gate для dispatch ходу сесії ACP (стандартно: `true`). Задайте `false`, щоб залишити команди ACP доступними, але заблокувати виконання.
- `backend`: стандартний ідентифікатор backend середовища виконання ACP (має відповідати зареєстрованому ACP runtime plugin).
  Якщо задано `plugins.allow`, включіть ідентифікатор backend plugin (наприклад, `acpx`), інакше bundled стандартний plugin не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли spawns не вказують явну ціль.
- `allowedAgents`: allowlist ідентифікаторів агентів, дозволених для сесій середовища виконання ACP; порожнє значення означає відсутність додаткового обмеження.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед поділом проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів у межах ходу (стандартно: `true`).
- `stream.deliveryMode`: `"live"` передає потік поступово; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: розділювач перед видимим текстом після прихованих подій інструментів (стандартно: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, що проєктується за хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис імен тегів для булевих перевизначень видимості потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для worker сесій ACP перед тим, як вони стають придатними для очищення.
- `runtime.installCommand`: необов’язкова команда встановлення для запуску під час початкового налаштування середовища виконання ACP.

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
  - `"random"` (стандартно): ротаційні смішні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), задайте змінну середовища `OPENCLAW_HIDE_BANNER=1`.

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

Див. поля ідентичності `agents.list` у [стандартних параметрах агента](/uk/gateway/config-agents#agent-defaults).

---

## Bridge (застаріле, вилучено)

Поточні збірки більше не містять TCP bridge. Nodes підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною схеми конфігурації (перевірка не проходить, доки їх не вилучено; `openclaw doctor --fix` може видалити невідомі ключі).

<Accordion title="Конфігурація legacy bridge (історична довідка)">

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

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запуску cron перед обрізанням із `sessions.json`. Також керує очищенням архівованих видалених стенограм cron. Стандартно: `24h`; задайте `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір кожного файлу журналу запуску (`cron/runs/<jobId>.jsonl`) перед обрізанням. Стандартно: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки, які зберігаються, коли спрацьовує обрізання журналу запуску. Стандартно: `2000`.
- `webhookToken`: bearer token, що використовується для доставки cron webhook POST (`delivery.mode = "webhook"`); якщо пропущено, заголовок авторизації не надсилається.
- `webhook`: застарілий legacy fallback URL webhook (http/https), що використовується лише для збережених завдань, які все ще мають `notify: true`.

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

- `maxAttempts`: максимальна кількість повторних спроб для одноразових завдань при тимчасових помилках (стандартно: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок backoff у мс для кожної повторної спроби (стандартно: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, що запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати всі тимчасові типи.

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

- `enabled`: увімкнути сповіщення про збої для завдань cron (стандартно: `false`).
- `after`: послідовні збої перед спрацюванням сповіщення (додатне ціле число, мінімум: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `includeSkipped`: враховувати послідовні пропущені запуски в порозі сповіщення (стандартно: `false`). Пропущені запуски відстежуються окремо й не впливають на backoff помилок виконання.
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує до налаштованого webhook.
- `accountId`: необов’язковий ідентифікатор акаунта або каналу для обмеження області доставки сповіщень.

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
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних цілі.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL Webhook. Обов’язково для режиму Webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` на рівні окремого завдання перевизначає це глобальне значення за замовчуванням.
- Коли ні глобальне призначення для збоїв, ні призначення на рівні окремого завдання не задано, завдання, які вже доставляють через `announce`, у разі збою повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань із `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не є `"webhook"`.

Див. [Завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблону медіамоделі

Плейсхолдери шаблону, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повне тіло вхідного повідомлення                  |
| `{{RawBody}}`      | Сире тіло (без обгорток історії/відправника)      |
| `{{BodyStripped}}` | Тіло з вилученими згадками груп                   |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | ID повідомлення каналу                            |
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
- Масив файлів: глибоко зливається за порядком (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: визначаються відносно файлу, що виконує включення, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми та форми з `../` дозволені лише тоді, коли вони все одно розв’язуються всередині цієї межі.
- Записи, керовані OpenClaw, які змінюють лише один розділ верхнього рівня, підкріплений включенням одного файлу, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, керованих OpenClaw; такі записи завершуються закритою помилкою замість сплющення конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних включень.

---

_Пов’язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
