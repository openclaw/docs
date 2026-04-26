---
read_when:
    - Вам потрібні точні семантики полів конфігурації або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник конфігурації
x-i18n:
    generated_at: "2026-04-26T00:18:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c9019c54bb8fbeb9fa52312a8d97ea4481f4cb1bcb38bac745d726eaa648407
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Довідник основної конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Configuration](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і надає посилання назовні, коли підсистема має власний докладніший довідник. Каталоги команд, що належать каналам і Plugin, а також глибокі параметри пам’яті/QMD розміщені на окремих сторінках, а не на цій.

Код як джерело істини:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими bundled/plugin/channel, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми з прив’язкою до шляху для інструментів детального перегляду
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації щодо поточної поверхні схеми

Окремі детальні довідники:

- [Memory configuration reference](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідних каналів/Plugin для поверхонь команд, специфічних для каналу

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, якщо їх пропущено.

---

## Канали

Ключі конфігурації окремих каналів перенесено на окрему сторінку — див.
[Configuration — channels](/uk/gateway/config-channels) для `channels.*`,
зокрема для Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, обмеження згадок).

## Значення агентів за замовчуванням, multi-agent, сесії та повідомлення

Перенесено на окрему сторінку — див.
[Configuration — agents](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, thinking, heartbeat, пам’ять, медіа, Skills, sandbox)
- `multiAgent.*` (маршрутизація й прив’язки multi-agent)
- `session.*` (життєвий цикл сесії, compaction, очищення)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає стандартне для платформи вікно паузи перед надсиланням транскрипту (`700 ms на macOS і Android, 900 ms на iOS`)

## Інструменти й власні провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів із підтримкою провайдерів, а також налаштування власних
провайдерів / base-URL перенесено на окрему сторінку — див.
[Configuration — tools and custom providers](/uk/gateway/config-tools).

## MCP

Визначення MCP-серверів, керованих OpenClaw, розміщуються в `mcp.servers` і
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
- `mcp.sessionIdleTtlMs`: idle TTL для bundled MCP-середовищ виконання на рівні сесії.
  Одноразові вбудовані запуски запитують очищення після завершення запуску; цей TTL є резервним механізмом для
  довготривалих сесій і майбутніх викликів.
- Зміни в `mcp.*` застосовуються на льоту через вивільнення кешованих MCP-середовищ виконання сесії.
  Наступне виявлення/використання інструмента створює їх заново з нової конфігурації, тож видалені
  записи `mcp.servers` прибираються негайно, а не чекають завершення idle TTL.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI backends](/uk/gateway/cli-backends#bundle-mcp-overlays) для поведінки середовища виконання.

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

- `allowBundled`: необов’язковий список дозволів лише для bundled skills (керовані/робочі Skills не зачіпаються).
- `load.extraDirs`: додаткові спільні кореневі каталоги Skills (найнижчий пріоритет).
- `install.preferBrew`: якщо `true`, надавати перевагу інсталяторам Homebrew, коли `brew`
  доступний, перш ніж переходити до інших типів інсталяторів.
- `install.nodeManager`: пріоритет node-інсталятора для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він bundled/встановлений.
- `entries.<skillKey>.apiKey`: спрощене поле для Skills, що оголошують основну env-змінну (простий рядок або об’єкт SecretRef).

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
- Виявлення підтримує нативні Plugin OpenClaw, а також сумісні пакунки Codex і Claude, зокрема пакунки Claude стандартного макета без маніфесту.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий список дозволів (завантажуються лише перелічені Plugin). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: спрощене поле API-ключа на рівні Plugin (коли підтримується Plugin).
- `plugins.entries.<id>.env`: карта env-змінних у межах Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` і ігнорує поля, що змінюють prompt, із застарілого `before_agent_start`, водночас зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hooks Plugin і підтримуваних каталогів hooks, наданих пакунками.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені небандловані Plugin можуть читати необроблений вміст розмови з типізованих hooks, таких як `llm_input`, `llm_output` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряти цьому Plugin запитувати перевизначення `provider` і `model` для окремих запусків фонових subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"`, лише якщо ви свідомо хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений Plugin (перевіряється схемою нативного Plugin OpenClaw, якщо доступна).
- Налаштування облікових записів/середовища виконання channel Plugin розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` у маніфесті відповідного Plugin, а не центральним реєстром параметрів OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера веб-отримання Firecrawl.
  - `apiKey`: API-ключ Firecrawl (підтримує SecretRef). Використовує запасний варіант із `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілого `tools.web.fetch.firecrawl.apiKey` або env-змінної `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст зі сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту scrape у секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (веб-пошук Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok, яку слід використовувати для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: Cron-інтервал для кожного повного циклу dreaming (типово `"0 3 * * *"`).
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті міститься в [Memory configuration reference](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Plugin-пакунки Claude також можуть додавати вбудовані значення Pi за замовчуванням із `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агента, а не як необроблені патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати ідентифікатор активного memory Plugin або `"none"`, щоб вимкнути memory Plugin.
- `plugins.slots.contextEngine`: вибрати ідентифікатор активного Plugin рушія контексту; типово `"legacy"`, якщо ви не встановите й не виберете інший рушій.

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
- `tabCleanup` вивільняє відстежувані вкладки основного агента після часу простою або коли
  сесія перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тож навігація браузера типово залишається строгою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте навігації браузера в приватній мережі.
- У строгому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підлягають тому самому блокуванню приватної мережі під час перевірок досяжності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.
- У строгому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі підтримують лише під’єднання (start/stop/reset вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявив `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL DevTools WebSocket.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до віддаленої та
  `attachOnly`-досяжності CDP, а також до запитів на відкриття вкладок. Керовані loopback-
  профілі зберігають локальні значення CDP за замовчуванням.
- Якщо зовнішньо керований сервіс CDP доступний через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw розглядатиме loopback-порт як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть під’єднуватися на
  вибраному хості або через підключений вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлюватися на конкретний
  профіль браузера на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання через CSS-селектори, hooks для завантаження одного файла,
  відсутність перевизначень тайм-ауту діалогів, відсутність `wait --load networkidle`, а також
  відсутність `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший — у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності websocket CDP після запуску. Підвищуйте їх на повільніших хостах, де Chrome
  запускається успішно, але перевірки готовності змагаються зі стартом. Обидва значення мають бути
  додатними цілими числами до `120000` мс; некоректні значення конфігурації відхиляються.
- Порядок автовиявлення: типовий браузер, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для профілю `existing-session` також розгортається з тильдою.
- Сервіс керування: лише loopback (порт визначається на основі `gateway.port`, типово `18791`).
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

- `seamColor`: колір акценту для chrome інтерфейсу нативного застосунку (тон бульбашки Talk Mode тощо).
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

<Accordion title="Докладно про поля Gateway">

- `mode`: `local` (запустити gateway) або `remote` (підключитися до віддаленого gateway). Gateway відмовляється запускатися, якщо не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хостів (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає `127.0.0.1` усередині контейнера. За використання bridge-мережі Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому gateway недосяжний. Використовуйте `--network host` або встановіть `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: типово обов’язкова. Non-loopback bind вимагають auth gateway. На практиці це означає спільний token/password або reverse proxy з підтримкою ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер onboarding типово генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема через SecretRef), явно задайте `gateway.auth.mode` як `token` або `password`. Запуск і потоки встановлення/відновлення сервісу завершуються помилкою, коли налаштовано обидва значення, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без auth. Використовуйте лише для довірених локальних налаштувань local loopback; цей варіант навмисно не пропонується в підказках onboarding.
- `gateway.auth.mode: "trusted-proxy"`: делегувати auth reverse proxy з підтримкою ідентичності та довіряти заголовкам ідентичності від `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує джерело proxy **не з loopback**; reverse proxy loopback на тому ж хості не задовольняють вимоги trusted-proxy auth.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти auth для Control UI/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цей auth заголовком Tailscale; натомість вони дотримуються звичайного HTTP-режиму auth gateway. Цей безтокеновий потік передбачає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб auth. Застосовується для кожної IP-адреси клієнта і для кожної області auth (спільний секрет і токен пристрою відстежуються окремо). Заблоковані спроби повертають `429` + `Retry-After`.
  - В асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні хибні спроби від того самого клієнта можуть спрацювати на обмежувач уже на другому запиті, а не пройти обидві як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово дорівнює `true`; встановіть `false`, якщо свідомо хочете, щоб трафік localhost теж підлягав rate limiting (для тестових конфігурацій або строгих proxy-розгортань).
- Спроби WS-auth із джерел browser-origin завжди обмежуються без винятку для loopback (додатковий захист від brute force localhost через браузер).
- На loopback ці блокування browser-origin ізолюються за нормалізованим
  значенням `Origin`, тож повторні невдачі з одного localhost-origin не
  блокують автоматично інше origin.
- `tailscale.mode`: `serve` (лише tailnet, bind loopback) або `funnel` (публічно, вимагає auth).
- `controlUi.allowedOrigins`: явний список дозволених browser-origin для підключень Gateway WebSocket. Обов’язковий, коли очікуються браузерні клієнти з non-loopback origin.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає fallback origin через заголовок Host для розгортань, що свідомо покладаються на політику origin через заголовок Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійне перевизначення
  середовища процесу на боці клієнта, яке дозволяє незашифрований `ws://` до довірених IP
  приватної мережі; типово незашифрований трафік залишається дозволеним лише для loopback. Еквівалента в `openclaw.json`
  немає, а конфігурація приватної мережі браузера, така як
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнтів Gateway
  WebSocket.
- `gateway.remote.token` / `.password`: це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують auth gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL для зовнішнього relay APNs, який використовують офіційні/TestFlight збірки iOS після публікації relay-backed реєстрацій у gateway. Цей URL має збігатися з URL relay, зібраним у збірку iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від gateway до relay в мілісекундах. Типово `10000`.
- Реєстрації з підтримкою relay делегуються конкретній ідентичності gateway. Спарений застосунок iOS викликає `gateway.identity.get`, включає цю ідентичність у реєстрацію relay і пересилає в gateway дозвіл на надсилання в межах реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env-перевизначення для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварійний виняток лише для розробки для loopback HTTP URL relay. У production URL relay мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал моніторингу стану каналу в хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски health-monitor. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на канал/обліковий запис протягом ковзної години. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: відмова від перезапусків health-monitor для окремого каналу зі збереженням глобального моніторингу.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення на рівні облікового запису для каналів із кількома обліковими записами. Якщо задано, має пріоритет над перевизначенням рівня каналу.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як запасний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується із закритою відмовою (без маскування через запасний варіант remote).
- `trustedProxies`: IP-адреси reverse proxy, які завершують TLS або вставляють заголовки пересланого клієнта. Указуйте лише proxy, які ви контролюєте. Записи loopback також залишаються валідними для налаштувань виявлення proxy/локального трафіку на тому ж хості (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо відсутній `X-Forwarded-For`. Типово `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий список дозволених CIDR/IP для автоматичного схвалення першого спарювання пристрою вузла без запитаних областей доступу. Якщо не задано, вимкнено. Це не схвалює автоматично спарювання operator/browser/Control UI/WebChat і не схвалює автоматично оновлення ролі, області доступу, метаданих або публічного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд вузла після спарювання та оцінки списку дозволів.
- `gateway.tools.deny`: додаткові імена інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий список deny).
- `gateway.tools.allow`: видаляє імена інструментів із типового HTTP-списку deny.

</Accordion>

### Кінцеві точки, сумісні з OpenAI

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення безпеки URL-входів Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні списки allowlist трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення безпеки відповіді:
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

- `enabled`: вмикає завершення TLS на слухачі gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, якщо явні файли не налаштовано; лише для локального/dev використання.
- `certPath`: шлях файлової системи до файла TLS-сертифіката.
- `keyPath`: шлях файлової системи до файла приватного TLS-ключа; обмежуйте права доступу.
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
  - `"off"`: ігнорувати зміни наживо; зміни вимагають явного перезапуску.
  - `"restart"`: завжди перезапускати процес gateway при зміні конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати hot reload; за потреби перейти до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс очікування завершення поточних операцій перед примусовим перезапуском. Не задавайте його або встановіть `0`, щоб чекати безстроково та періодично журналювати попередження про те, що ще лишається незавершеним.

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
Токени hook у рядку запиту відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` вимагає непорожній `hooks.token`.
- `hooks.token` має **відрізнятися** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонізований `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping не потребують цього opt-in.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з тіла запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` у mapping, згенеровані через шаблон, вважаються зовнішньо наданими й також вимагають `hooks.allowRequestSessionKey=true`.

<Accordion title="Докладно про mapping">

- `match.path` зіставляє підшлях після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читаються з payload.
- `transform` може вказувати на модуль JS/TS, що повертає дію hook.
  - `transform.module` має бути відносним шляхом і лишатися в межах `hooks.transformsDir` (абсолютні шляхи й traversal відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ID повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook-агента без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і ключам сесії mapping, керованим шаблонами, задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Стає обов’язковим, коли будь-який mapping або preset використовує шаблонізований `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволена, якщо задано каталог моделей).

</Accordion>

### Інтеграція з Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію на рівні повідомлення, установіть `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
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

- Обслуговує HTML/CSS/JS, які може редагувати агент, і A2UI через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Для non-loopback bind: маршрути canvas вимагають auth Gateway (token/password/trusted-proxy), як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки auth; після спарювання й підключення вузла Gateway рекламує URL можливостей з областю дії вузла для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії вузла й швидко спливають. Резервний варіант на основі IP не використовується.
- Впроваджує клієнт live-reload у HTML, що обслуговується.
- Автоматично створює стартовий `index.html`, коли каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни вимагають перезапуску gateway.
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

Записує унікасну зону DNS-SD в `~/.openclaw/dns/`. Для виявлення між мережами поєднуйте з DNS-сервером (рекомендовано CoreDNS) + split DNS Tailscale.

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

- Вбудовані env-змінні застосовуються лише якщо в середовищі процесу бракує цього ключа.
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден із них не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний порядок пріоритету див. у [Environment](/uk/help/environment).

### Підстановка env-змінних

Посилайтеся на env-змінні в будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні спричиняють помилку під час завантаження конфігурації.
- Використовуйте `$${VAR}` для буквального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є адитивними: прості текстові значення також продовжують працювати.

### `SecretRef`

Використовуйте один формат об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон `id` для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон `id` для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` для `source: "exec"` не повинні містити сегменти шляху `.` або `..`, розділені `/` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання в `auth-profiles.json` включені до розв’язання під час виконання та покриття аудиту.

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
- Шляхи провайдерів file і exec завершуються із закритою відмовою, коли перевірка Windows ACL недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` вимагає абсолютний шлях `command` і використовує протокольні payload через stdin/stdout.
- Типово шляхи команд-символічних посилань відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи-символічні посилання з перевіркою розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка trusted-dir застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` типово мінімальне; явно передавайте потрібні змінні через `passEnv`.
- Посилання на секрети розв’язуються під час активації у snapshot в пам’яті, після чого шляхи запитів читають лише цей snapshot.
- Під час активації застосовується фільтрація активної поверхні: нерозв’язані посилання на ввімкнених поверхнях призводять до помилки запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

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
- Профілі режиму OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані профілю auth на основі SecretRef.
- Статичні облікові дані під час виконання надходять із розв’язаних snapshot у пам’яті; застарілі статичні записи `auth.json` очищуються, коли їх виявлено.
- Застарілий імпорт OAuth — з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Поведінка секретів під час виконання та інструменти `audit/configure/apply`: [Secrets Management](/uk/gateway/secrets).

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

- `billingBackoffHours`: базова затримка в годинах, коли профіль зазнає помилки через справжні помилки виставлення рахунків/недостатнього кредиту (типово: `5`). Явний текст про billing
  усе ще може потрапити сюди навіть за відповідей `401`/`403`, але текстові
  зіставлення, специфічні для провайдера, залишаються в межах провайдера, якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повторювані HTTP `402` повідомлення про usage-window або
  ліміти витрат organization/workspace натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин затримки billing для окремих провайдерів.
- `billingMaxHours`: верхня межа в годинах для експоненційного зростання затримки billing (типово: `24`).
- `authPermanentBackoffMinutes`: базова затримка в хвилинах для помилок `auth_permanent` із високою впевненістю (типово: `10`).
- `authPermanentMaxMinutes`: верхня межа в хвилинах для зростання затримки `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, яке використовується для лічильників затримок (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок перевантаження перед переходом до запасної моделі (типово: `1`). Сюди потрапляють форми на кшталт `ModelNotReadyException`, коли провайдер зайнятий.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок rate limit перед переходом до запасної моделі (типово: `1`). Цей кошик rate limit включає текстові форми провайдера, такі як `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `flags`: масив рядків прапорців, що вмикають цільовий вивід журналу (підтримує шаблони з wildcard, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для виводу попереджень про завислі сесії, поки сесія лишається в стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель конфіденційності див. у [OpenTelemetry export](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: вмикають експорт trace, metrics або logs.
- `otel.sampleRate`: частота вибірки trace `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання телеметрії в мс.
- `otel.captureContent`: opt-in захоплення необробленого вмісту для атрибутів spans OTEL. Типово вимкнено. Булеве `true` захоплює вміст повідомлень/інструментів, крім системного; форма об’єкта дозволяє явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: перемикач середовища для найновіших експериментальних атрибутів провайдера spans GenAI. Типово spans зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: перемикач середовища для хостів, які вже зареєстрували глобальний OpenTelemetry SDK. Тоді OpenClaw пропускає запуск/завершення SDK, яким володіє Plugin, зберігаючи активними діагностичні слухачі.
- `cacheTrace.enabled`: журналювати snapshot трасування кешу для вбудованих запусків (типово: `false`).
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

- `channel`: канал релізу для встановлень npm/git — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час старту gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для встановлень пакетів (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед авто-застосуванням stable-каналу (типово: `6`; максимум: `168`).
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

- `enabled`: глобальний прапорець функції ACP (типово: `true`; установіть `false`, щоб приховати можливості dispatch і spawn ACP).
- `dispatch.enabled`: незалежний прапорець для dispatch ходів сесії ACP (типово: `true`). Установіть `false`, щоб зберегти доступність команд ACP, одночасно блокуючи виконання.
- `backend`: ідентифікатор типового backend середовища виконання ACP (має збігатися із зареєстрованим Plugin середовища виконання ACP).
  Якщо задано `plugins.allow`, включіть ідентифікатор backend Plugin (наприклад `acpx`), інакше bundled Plugin за замовчуванням не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли spawn не задає явної цілі.
- `allowedAgents`: список дозволених ідентифікаторів агентів для сесій середовища виконання ACP; порожнє значення означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно скидання простою в мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед поділом проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструмента за хід (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потоково інкрементально; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструмента (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу помічника, що проєктується за хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлень ACP.
- `stream.tagVisibility`: запис імен тегів у булеві перевизначення видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для воркерів сесії ACP до моменту, коли їх можна очистити.
- `runtime.installCommand`: необов’язкова команда встановлення, яку слід виконати під час bootstrap середовища виконання ACP.

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

- `cli.banner.taglineMode` керує стилем підзаголовка банера:
  - `"random"` (типово): ротаційні кумедні/сезонні підзаголовки.
  - `"default"`: фіксований нейтральний підзаголовок (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту підзаголовка (назва/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише підзаголовки), установіть env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Метадані, які записуються керованими CLI-потоками налаштування (`onboard`, `configure`, `doctor`):

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

## Bridge (застаріле, видалено)

Поточні збірки більше не містять TCP bridge. Nodes підключаються через Gateway WebSocket. Ключі `bridge.*` більше не входять до схеми конфігурації (валідація завершується помилкою, доки їх не буде видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

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

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запусків cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. Типово: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файла журналу на запуск (`cron/runs/<jobId>.jsonl`) перед очищенням. Типово: `2_000_000` байтів.
- `runLog.keepLines`: кількість найновіших рядків, що зберігаються при спрацюванні очищення журналу запуску. Типово: `2000`.
- `webhookToken`: bearer token, який використовується для доставки POST у cron Webhook (`delivery.mode = "webhook"`); якщо не задано, заголовок auth не надсилається.
- `webhook`: застарілий резервний URL Webhook (http/https), який використовується лише для збережених завдань, що досі мають `notify: true`.

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
- `retryOn`: типи помилок, що запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати для всіх тимчасових типів.

Застосовується лише до одноразових завдань cron. Періодичні завдання використовують окрему обробку збоїв.

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

- `enabled`: увімкнути сповіщення про збої для завдань cron (типово: `false`).
- `after`: кількість послідовних збоїв перед надсиланням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` виконує POST на налаштований Webhook.
- `accountId`: необов’язковий ідентифікатор облікового запису або каналу для обмеження доставки сповіщення.

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
- `to`: явна ціль announce або URL Webhook. Обов’язково для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` на рівні завдання перевизначає це глобальне значення за замовчуванням.
- Коли не задано ні глобального, ні призначення збою на рівні завдання, завдання, які вже доставляють через `announce`, у разі збою повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [background tasks](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Заповнювачі шаблонів, що розгортаються в `tools.media.models[].args`:

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повний вхідний текст повідомлення                 |
| `{{RawBody}}`      | Необроблений текст (без обгорток історії/відправника) |
| `{{BodyStripped}}` | Текст без згадок у групі                          |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                 |
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (image/audio/document/…)                |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Розв’язаний media prompt для записів CLI          |
| `{{MaxChars}}`     | Розв’язана максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (best effort)                          |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (best effort) |
| `{{SenderName}}`   | Відображуване ім’я відправника (best effort)      |
| `{{SenderE164}}`   | Номер телефону відправника (best effort)          |
| `{{Provider}}`     | Підказка провайдера (whatsapp, telegram, discord тощо) |

---

## Включення конфігурації (`$include`)

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

- Один файл: замінює об’єкт, що його містить.
- Масив файлів: глибоко зливається за порядком (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: розв’язуються відносно файла, що включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми/`../` дозволені лише тоді, коли вони все одно розв’язуються в межах цього кордону.
- Записи, якими володіє OpenClaw, що змінюють лише один розділ верхнього рівня, підкріплений включенням одного файла, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями є лише для читання для записів, якими володіє OpenClaw; такі записи завершуються із закритою відмовою замість сплющення конфігурації.
- Помилки: чіткі повідомлення для відсутніх файлів, помилок розбору та циклічних включень.

---

_Пов’язане: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Configuration](/uk/gateway/configuration)
- [Configuration examples](/uk/gateway/configuration-examples)
