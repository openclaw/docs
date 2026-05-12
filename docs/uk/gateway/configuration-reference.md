---
read_when:
    - Вам потрібна точна семантика конфігурації на рівні полів або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-05-12T00:58:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b8e31f7a6ed82faf3b5a50daa286bb6fce0c2e4452ae81a8e792a437004ad54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Довідник основної конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Конфігурація](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і містить посилання на окремі глибші довідники, коли підсистема має власний. Каталоги команд, що належать каналам і плагінам, а також поглиблені параметри пам’яті/QMD розміщені на власних сторінках, а не тут.

Правда в коді:

- `openclaw config schema` друкує актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими bundled/plugin/channel, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми з областю дії за шляхом для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації щодо поточної поверхні схеми

Шлях пошуку для агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації й обмежень на рівні полів перед редагуванням. Використовуйте
[Конфігурація](/uk/gateway/configuration) для настанов, орієнтованих на завдання, а цю сторінку
для ширшої карти полів, значень за замовчуванням і посилань на довідники підсистем.

Окремі поглиблені довідники:

- [Довідник конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації Dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідних каналів/плагінів для поверхонь команд, специфічних для каналів

Формат конфігурації — **JSON5** (коментарі + кінцеві коми дозволені). Усі поля необов’язкові - OpenClaw використовує безпечні значення за замовчуванням, коли їх пропущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на окрему сторінку - див.
[Конфігурація - канали](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, gating згадок).

## Значення агента за замовчуванням, multi-agent, сесії та повідомлення

Перенесено на окрему сторінку - див.
[Конфігурація - агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робоча область, модель, thinking, Heartbeat, пам’ять, медіа, Skills, sandbox)
- `multiAgent.*` (multi-agent маршрутизація та прив’язки)
- `session.*` (життєвий цикл сесії, Compaction, pruning)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.consultThinkingLevel`: перевизначення рівня thinking для повного запуску агента OpenClaw за realtime consults Control UI Talk
  - `talk.consultFastMode`: одноразове перевизначення fast-mode для realtime consults Control UI Talk
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає стандартне для платформи вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)

## Інструменти та користувацькі провайдери

Політики інструментів, експериментальні перемикачі, конфігурацію інструментів на базі провайдерів і налаштування користувацького
провайдера / базової URL-адреси перенесено на окрему сторінку - див.
[Конфігурація - інструменти та користувацькі провайдери](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, allowlists моделей і налаштування користувацьких провайдерів розміщені в
[Конфігурація - інструменти та користувацькі провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls).
Корінь `models` також відповідає за глобальну поведінку каталогу моделей.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: поведінка каталогу провайдерів (`merge` або `replace`).
- `models.providers`: мапа користувацьких провайдерів із ключами за provider id.
- `models.providers.*.localService`: необов’язковий менеджер процесів on-demand для
  локальних серверів моделей. OpenClaw перевіряє налаштований health endpoint, запускає
  абсолютну `command`, коли потрібно, чекає готовності, а потім надсилає запит до моделі.
  Див. [Локальні сервіси моделей](/uk/gateway/local-model-services).
- `models.pricing.enabled`: керує фоновим pricing bootstrap, який
  запускається після того, як sidecars і канали досягають ready path Gateway. Коли `false`,
  Gateway пропускає отримання каталогів цін OpenRouter і LiteLLM; налаштовані
  значення `models.providers.*.models[].cost` і далі працюють для локальних оцінок вартості.

## MCP

Визначення MCP-серверів, керованих OpenClaw, розміщені в `mcp.servers` і
використовуються embedded Pi та іншими runtime-адаптерами. Команди `openclaw mcp list`,
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

- `mcp.servers`: іменовані stdio або remote визначення MCP-серверів для середовищ виконання, які
  надають налаштовані MCP-інструменти.
  Remote записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` — це CLI-native псевдонім, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.sessionIdleTtlMs`: idle TTL для session-scoped bundled MCP runtimes.
  Одноразові embedded запуски запитують очищення наприкінці запуску; цей TTL є запобіжником для
  довготривалих сесій і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються гаряче через disposing cached session MCP runtimes.
  Наступне виявлення/використання інструмента створює їх заново з нової конфігурації, тому видалені
  записи `mcp.servers` прибираються негайно, а не чекають idle TTL.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI backends](/uk/gateway/cli-backends#bundle-mcp-overlays) щодо поведінки runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
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

- `allowBundled`: необов’язковий allowlist лише для bundled skills (managed/workspace skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені skills (найнижчий пріоритет).
- `load.allowSymlinkTargets`: довірені реальні корені цілей, у які можуть
  resolve симлінки skills, коли посилання розміщене поза налаштованим вихідним коренем.
- `install.preferBrew`: коли true, надавати перевагу інсталяторам Homebrew, якщо `brew`
  доступний, перед fallback до інших типів інсталяторів.
- `install.nodeManager`: бажаний node installer для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: дозволити довіреним клієнтам Gateway `operator.admin`
  встановлювати приватні zip-архіви, staged через `skills.upload.*`
  (за замовчуванням: false). Це вмикає лише шлях uploaded-archive; звичайні встановлення ClawHub
  цього не потребують.
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручне поле для skills, що оголошують primary env var (plaintext string або об’єкт SecretRef).

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
- Discovery приймає native OpenClaw plugins, а також сумісні Codex bundles і Claude bundles, зокрема manifestless Claude default-layout bundles.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий allowlist (завантажуються лише перелічені plugins). `deny` має пріоритет.
- `bundledDiscovery`: за замовчуванням має значення `"allowlist"` для нових конфігурацій, тож непорожній
  `plugins.allow` також обмежує bundled provider plugins, зокрема web-search
  runtime providers. Doctor записує `"compat"` для мігрованих legacy allowlist
  конфігурацій, щоб зберегти наявну поведінку bundled provider, доки ви не ввімкнете новий режим.
- `plugins.entries.<id>.apiKey`: зручне поле API key на рівні plugin (коли підтримується plugin).
- `plugins.entries.<id>.env`: мапа змінних середовища з областю дії plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` та ігнорує prompt-mutating поля з legacy `before_agent_start`, зберігаючи legacy `modelOverride` і `providerOverride`. Застосовується до native plugin hooks і підтримуваних hook-директорій, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені non-bundled plugins можуть читати raw conversation content із typed hooks, як-от `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряє цьому plugin запитувати per-run перевизначення `provider` і `model` для background subagent runs.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для trusted subagent overrides. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowModelOverride`: явно довіряє цьому plugin запитувати перевизначення моделі для `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для trusted plugin LLM completion overrides. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: явно довіряє цьому plugin запускати `api.runtime.llm.complete` для non-default agent id.
- `plugins.entries.<id>.config`: config object, визначений plugin (валідується native OpenClaw plugin schema, коли доступна).
- Налаштування облікового запису/runtime для channel plugin розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` у manifest відповідного plugin, а не центральним реєстром опцій OpenClaw.

### Конфігурація plugin Codex harness

Bundled plugin `codex` відповідає за native Codex app-server harness settings у
`plugins.entries.codex.config`. Див.
[Довідник Codex harness](/uk/plugins/codex-harness-reference) для повної поверхні конфігурації
та [Codex harness](/uk/plugins/codex-harness) для runtime model.

`codexPlugins` застосовується лише до сесій, які вибирають native Codex harness.
Він не вмикає Codex plugins для Pi, звичайних запусків OpenAI provider, ACP
conversation bindings або будь-якого non-Codex harness.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: вмикає нативну підтримку
  plugin/app Codex для harness Codex. Типово: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  типова політика руйнівних дій для перенесених запитів plugin app.
  Типово: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: вмикає
  перенесений запис Plugin, коли глобальний `codexPlugins.enabled` також має значення true.
  Типово: `true` для явних записів.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  стабільна ідентичність маркетплейсу. V1 підтримує лише `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: стабільна
  ідентичність Plugin Codex з міграції, наприклад `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  перевизначення політики руйнівних дій для окремого Plugin. Якщо пропущено, використовується глобальне
  значення `allow_destructive_actions`.

`codexPlugins.enabled` — це глобальна директива ввімкнення. Явні записи Plugin,
записані міграцією, є довговічним набором права на встановлення та виправлення.
`plugins["*"]` не підтримується, перемикача `install` немає, а локальні
значення `marketplacePath` навмисно не є полями конфігурації, бо вони
залежать від хоста.

Перевірки готовності `app/list` кешуються на одну годину та оновлюються
асинхронно, коли стають застарілими. Конфігурація app потоку Codex обчислюється під час
встановлення сесії harness Codex, а не на кожному ході; використовуйте `/new`, `/reset` або перезапуск Gateway
після зміни конфігурації нативних Plugin.

- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера веб-отримання Firecrawl.
  - `apiKey`: ключ API Firecrawl (приймає SecretRef). Повертається до `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілого `tools.web.fetch.firecrawl.apiKey` або змінної середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базова URL-адреса API Firecrawl (типово: `https://api.firecrawl.dev`; самостійно розгорнуті перевизначення мають спрямовуватися на приватні/внутрішні кінцеві точки).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: таймаут запиту скрейпінгу в секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: cron-частота для кожного повного проходу dreaming (`"0 3 * * *"` за замовчуванням).
  - `model`: необов’язкове перевизначення моделі під-агента Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз із типовою моделлю сесії; помилки довіри або allowlist не повертаються назад мовчки.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті міститься в [довіднику конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені пакетні Plugin Claude також можуть додавати вбудовані типові значення Pi із `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: виберіть ідентифікатор активного Plugin пам’яті або `"none"`, щоб вимкнути Plugin пам’яті.
- `plugins.slots.contextEngine`: виберіть ідентифікатор активного Plugin рушія контексту; типово `"legacy"`, якщо ви не встановите й не виберете інший рушій.

Див. [Plugins](/uk/tools/plugin).

---

## Зобов’язання

`commitments` керує виведеною подальшою пам’яттю: OpenClaw може виявляти контрольні звернення з ходів розмови й доставляти їх через запуски heartbeat.

- `commitments.enabled`: увімкнути приховане LLM-витягування, зберігання та доставку heartbeat для виведених подальших зобов’язань. Типово: `false`.
- `commitments.maxPerDay`: максимальна кількість виведених подальших зобов’язань, доставлених за сесію агента протягом ковзного дня. Типово: `3`.

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
- `tabCleanup` звільняє відстежувані вкладки основного агента після простою або коли
  сесія перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, коли не задано, тому навігація браузера лишається суворою за замовчуванням.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте навігації браузера приватною мережею.
- У суворому режимі кінцеві точки віддалених CDP-профілів (`profiles.*.cdpUrl`) підлягають такому самому блокуванню приватної мережі під час перевірок досяжності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` лишається підтримуваним як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі доступні лише для приєднання (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає пряму URL-адресу WebSocket DevTools.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до віддаленої та
  `attachOnly` CDP-досяжності, а також до запитів відкриття вкладок. Керовані loopback
  профілі зберігають локальні типові значення CDP.
- Якщо зовнішньо керована CDP-служба досяжна через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw трактує loopback-порт як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть приєднуватися на
  вибраному хості або через під’єднаний браузерний вузол.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб спрямуватися на конкретний
  профіль браузера на основі Chromium, як-от Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання CSS-селекторами, хуки завантаження одного файлу,
  без перевизначень таймауту діалогів, без `wait --load networkidle` і без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; задавайте
  `cdpUrl` явно лише для віддаленого CDP.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності CDP websocket після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  запускається успішно, але перевірки готовності змагаються зі стартом. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: типовий браузер, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для окремого профілю в профілях `existing-session` також розгортається з тильдою.
- Служба керування: лише loopback (порт похідний від `gateway.port`, типово `18791`).
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

- `mode`: `local` (запускати Gateway) або `remote` (підключатися до віддаленого Gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: один мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає на `127.0.0.1` усередині контейнера. З bridge-мережею Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому Gateway недоступний. Використовуйте `--network host` або встановіть `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: типово обов’язкова. Bind не на loopback потребують автентифікації Gateway. На практиці це означає спільний токен/пароль або identity-aware reverse proxy з `gateway.auth.mode: "trusted-proxy"`. Майстер onboarding типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема SecretRefs), явно встановіть `gateway.auth.mode` на `token` або `password`. Потоки запуску та встановлення/відновлення сервісу завершуються помилкою, коли налаштовано обидва параметри, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; це навмисно не пропонується в onboarding prompts.
- `gateway.auth.mode: "trusted-proxy"`: делегує автентифікацію браузера/користувача identity-aware reverse proxy та довіряє identity headers з `gateway.trustedProxies` (див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth)). Цей режим типово очікує джерело проксі **не на loopback**; reverse proxy на loopback того самого хоста потребують явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні викликачі з того самого хоста можуть використовувати `gateway.auth.password` як локальний прямий fallback; `gateway.auth.token` лишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, identity headers Tailscale Serve можуть задовольнити автентифікацію Control UI/WebSocket (перевірено через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію через заголовки Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації Gateway. Цей потік без токена припускає, що хост Gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб автентифікації. Застосовується на IP клієнта й на scope автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На async-шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні невдалі спроби від того самого клієнта можуть спрацювати на обмежувач уже на другому запиті, замість того щоб обидві пройшли як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; встановіть `false`, коли навмисно хочете обмежувати частоту також для localhost-трафіку (для тестових налаштувань або строгих proxy-розгортань).
- Спроби WS-автентифікації з browser-origin завжди throttled з вимкненим звільненням для loopback (defense-in-depth проти браузерного brute force на localhost).
- На loopback такі browser-origin lockouts ізольовані для кожного нормалізованого значення `Origin`, тому повторні невдалі спроби з одного localhost origin не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind на loopback) або `funnel` (публічний, потребує автентифікації).
- `tailscale.preserveFunnel`: коли `true` і `tailscale.mode = "serve"`, OpenClaw перевіряє `tailscale funnel status` перед повторним застосуванням Serve під час запуску й пропускає його, якщо зовні налаштований маршрут Funnel уже покриває порт Gateway. Типово `false`.
- `controlUi.allowedOrigins`: явний allowlist browser-origin для підключень Gateway WebSocket. Потрібний, коли браузерні клієнти очікуються з origins не на loopback.
- `controlUi.chatMessageMaxWidth`: необов’язкова max-width для згрупованих повідомлень чату Control UI. Приймає обмежені значення ширини CSS, як-от `960px`, `82%`, `min(1280px, 82%)` і `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає fallback origin за Host-header для розгортань, що навмисно покладаються на політику origin за Host-header.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: break-glass override на рівні process-environment клієнта, який дозволяє plaintext `ws://` до довірених IP приватної мережі; типово plaintext лишається дозволеним лише для loopback. Еквівалента в `openclaw.json` немає, а конфігурація приватної мережі браузера, як-от `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на клієнтів Gateway WebSocket.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують автентифікацію Gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS URL для зовнішнього APNs relay, який використовують офіційні/TestFlight iOS-збірки після публікації relay-backed реєстрацій у Gateway. Ця URL має збігатися з relay URL, скомпільованою в iOS-збірку.
- `gateway.push.apns.relay.timeoutMs`: таймаут надсилання з Gateway до relay у мілісекундах. Типово `10000`.
- Relay-backed реєстрації делегуються конкретній ідентичності Gateway. Спарений iOS-застосунок отримує `gateway.identity.get`, включає цю ідентичність у relay-реєстрацію та передає Gateway send grant, прив’язаний до реєстрації. Інший Gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env overrides для конфігурації relay вище.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: development-only escape hatch для loopback HTTP relay URLs. Production relay URLs мають лишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: таймаут pre-auth рукостискання Gateway WebSocket у мілісекундах. Типово: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли встановлено. Збільште це значення на завантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки startup warmup ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал health-monitor каналу у хвилинах. Встановіть `0`, щоб глобально вимкнути перезапуски health-monitor. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг stale-socket у хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на канал/акаунт у ковзну годину. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: вимкнення перезапусків health-monitor для окремого каналу зі збереженням увімкненого глобального монітора.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override для окремого акаунта в multi-account каналах. Коли встановлено, має пріоритет над override на рівні каналу.
- Локальні шляхи виклику Gateway можуть використовувати `gateway.remote.*` як fallback лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не resolved, resolution fails closed (без masking через remote fallback).
- `trustedProxies`: IP reverse proxy, які terminate TLS або inject forwarded-client headers. Вказуйте лише проксі, якими ви керуєте. Loopback entries усе ще чинні для same-host proxy/local-detection налаштувань (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback requests придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, Gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для fail-closed поведінки.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий CIDR/IP allowlist для автоматичного схвалення першого pairing node device без requested scopes. Вимкнено, коли не задано. Це не auto-approve pairing operator/browser/Control UI/WebChat і не auto-approve role, scope, metadata або public-key upgrades.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне allow/deny shaping для declared node commands після pairing та оцінки platform allowlist. Використовуйте `allowCommands`, щоб opt into небезпечні node commands, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо platform default або explicit allow інакше включили б її. Після того як node змінить свій declared command list, відхиліть і повторно схваліть pairing цього пристрою, щоб Gateway зберіг оновлений command snapshot.
- `gateway.tools.deny`: додаткові назви tools, заблоковані для HTTP `POST /tools/invoke` (розширює default deny list).
- `gateway.tools.allow`: вилучає назви tools із default HTTP deny list.

</Accordion>

### OpenAI-сумісні кінцеві точки

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-input для Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlists вважаються не заданими; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false` та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути URL fetching.
- Необов’язковий header для response hardening:
  - `gateway.http.securityHeaders.strictTransportSecurity` (встановлюйте лише для HTTPS origins, якими ви керуєте; див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька Gateway на одному хості з унікальними портами та state dirs:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Зручні flags: `--dev` (використовує `~/.openclaw-dev` + порт `19001`), `--profile <name>` (використовує `~/.openclaw-<name>`).

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

- `enabled`: вмикає TLS termination на listener Gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: auto-generates локальну самопідписану пару cert/key, коли явні файли не налаштовані; лише для local/dev використання.
- `certPath`: шлях у файловій системі до файлу TLS-сертифіката.
- `keyPath`: шлях у файловій системі до файлу приватного TLS-ключа; тримайте дозволи обмеженими.
- `caPath`: необов’язковий шлях до CA bundle для client verification або custom trust chains.

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
  - `"off"`: ігнорувати live edits; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес Gateway при зміні config.
  - `"hot"`: застосовувати зміни in-process без перезапуску.
  - `"hybrid"` (типово): спершу пробувати hot reload; fallback to restart, якщо потрібно.
- `debounceMs`: debounce window у ms перед застосуванням config changes (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у ms для очікування in-flight operations перед примусовим перезапуском або channel hot reload. Опустіть, щоб використати default bounded wait (`300000`); встановіть `0`, щоб чекати необмежено й логувати періодичні still-pending warnings.

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
Токени Hook у рядку запиту відхиляються.

Нотатки щодо перевірки та безпеки:

- `hooks.enabled=true` потребує непорожнього `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад, `["hook:"]`).
- Якщо зіставлення або пресет використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі зіставлення не потребують цього явного ввімкнення.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із корисного навантаження запиту приймається лише коли `hooks.allowRequestSessionKey=true` (за замовчуванням: `false`).
- `POST /hooks/<name>` → вирішується через `hooks.mappings`
  - Значення `sessionKey` зіставлення, відтворені з шаблону, вважаються наданими ззовні й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Деталі зіставлення">

- `match.path` зіставляє підшлях після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле корисного навантаження для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з корисного навантаження.
- `transform` може вказувати на модуль JS/TS, який повертає дію Hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та обхід каталогів відхиляються).
  - Тримайте `hooks.transformsDir` у межах `~/.openclaw/hooks/transforms`; каталоги workspace Skills відхиляються. Якщо `openclaw doctor` повідомляє, що цей шлях недійсний, перемістіть модуль перетворення до каталогу перетворень Hook або видаліть `hooks.transformsDir`.
- `agentId` спрямовує до конкретного агента; невідомі ID повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків агента Hook без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і керованим шаблонами ключам сесії зіставлень задавати `sessionKey` (за замовчуванням: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + зіставлення), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-яке зіставлення або пресет використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` за замовчуванням має значення `last`.
- `model` перевизначає LLM для цього запуску Hook (модель має бути дозволена, якщо каталог моделей задано).

</Accordion>

### Інтеграція Gmail

- Вбудований пресет Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте цю маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` відповідно до простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібне `hooks.allowRequestSessionKey: false`, перевизначте пресет статичним `sessionKey` замість шаблонного значення за замовчуванням.

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
- Не запускайте окремий `gog gmail watch serve` поряд із Gateway.

---

## Хост Plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Обслуговує редаговані агентом HTML/CSS/JS і A2UI через HTTP під портом Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (за замовчуванням).
- Прив’язки не до loopback: маршрути canvas потребують автентифікації Gateway (токен/пароль/довірений проксі), так само як інші HTTP-поверхні Gateway.
- WebView Node зазвичай не надсилають заголовки автентифікації; після сполучення й підключення вузла Gateway оголошує URL можливостей, scoped до вузла, для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії вузла й швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт live-reload в обслуговуваний HTML.
- Автоматично створює початковий `index.html`, коли порожньо.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску Gateway.
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

- `minimal` (за замовчуванням, коли ввімкнено вбудований Plugin `bonjour`): пропускає `cliPath` + `sshPort` у записах TXT.
- `full`: включає `cliPath` + `sshPort`; багатоадресна реклама LAN все одно потребує ввімкненого вбудованого Plugin `bonjour`.
- `off`: пригнічує багатоадресну рекламу LAN без зміни ввімкнення Plugin.
- Вбудований Plugin `bonjour` автоматично запускається на хостах macOS і вмикається вручну на Linux, Windows і контейнеризованих розгортаннях Gateway.
- Ім’я хоста за замовчуванням дорівнює системному імені хоста, коли воно є дійсною DNS-міткою, з поверненням до `openclaw`. Перевизначте за допомогою `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує зону unicast DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднайте з DNS-сервером (рекомендовано CoreDNS) + Tailscale split DNS.

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

- Вбудовані змінні середовища застосовуються лише тоді, коли в середовищі процесу немає відповідного ключа.
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден із них не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний порядок пріоритету див. у [Середовище](/uk/help/environment).

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
- Екрануйте за допомогою `$${VAR}` для літерального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є додатковими: значення у відкритому тексті й надалі працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Перевірка:

- Шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- Шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id для `source: "exec"` не повинні містити розділені скісними рисками сегменти шляху `.` або `..` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- Цілі `secrets apply` підтримують шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включено до runtime-розв’язання та покриття аудиту.

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
- Шляхи постачальників file та exec fail closed, коли перевірка Windows ACL недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Постачальник `exec` потребує абсолютного шляху `command` і використовує protocol payloads через stdin/stdout.
- За замовчуванням шляхи команд через symlink відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи symlink із перевіркою розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка trusted-dir застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` за замовчуванням мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв’язуються під час активації у знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Фільтрація active-surface застосовується під час активації: нерозв’язані посилання на увімкнених поверхнях призводять до помилки запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

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
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Застарілі плоскі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є runtime-форматом; `openclaw doctor --fix` переписує їх у канонічні API-key профілі `provider:default` із резервною копією `.legacy-flat.*.bak`.
- Профілі режиму OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні runtime-облікові дані беруться з розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються, коли їх виявлено.
- Застарілі імпорти OAuth беруться з `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: базова затримка повтору в годинах, коли профіль зазнає невдачі через справжні
  помилки виставлення рахунків/нестачі кредитів (за замовчуванням: `5`). Явний текст про виставлення рахунків може
  все ще потрапити сюди навіть у відповідях `401`/`403`, але специфічні для провайдера
  зіставники тексту залишаються обмеженими провайдером, якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повторювані повідомлення HTTP `402` про вікно використання або
  ліміт витрат організації/робочого простору натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення кількості годин затримки виставлення рахунків для окремих провайдерів.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання затримки виставлення рахунків (за замовчуванням: `24`).
- `authPermanentBackoffMinutes`: базова затримка повтору в хвилинах для високодостовірних збоїв `auth_permanent` (за замовчуванням: `10`).
- `authPermanentMaxMinutes`: обмеження в хвилинах для зростання затримки `auth_permanent` (за замовчуванням: `60`).
- `failureWindowHours`: рухоме вікно в годинах, що використовується для лічильників затримки повторів (за замовчуванням: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій профілів автентифікації того самого провайдера для помилок перевантаження перед переходом до резервної моделі (за замовчуванням: `1`). Сюди потрапляють форми зайнятості провайдера, такі як `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (за замовчуванням: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій профілів автентифікації того самого провайдера для помилок обмеження частоти перед переходом до резервної моделі (за замовчуванням: `1`). Цей кошик обмеження частоти включає текст у формі провайдера, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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

- Стандартний файл журналу: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Задайте `logging.file` для стабільного шляху.
- `consoleLevel` підвищується до `debug`, коли використано `--verbose`.
- `maxFileBytes`: максимальний розмір активного файлу журналу в байтах перед ротацією (додатне ціле число; за замовчуванням: `104857600` = 100 МБ). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування за принципом найкращого зусилля для виводу в консоль, файлових журналів, записів журналу OTLP і збереженого тексту транскрипту сеансу. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/транскриптів; поверхні безпеки UI/інструментів/діагностики все одно редагують секрети перед виведенням.

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

- `enabled`: головний перемикач для інструментального виводу (за замовчуванням: `true`).
- `flags`: масив рядків прапорців, які вмикають цільовий журнальний вивід (підтримує символи підстановки, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку без прогресу в мс для класифікації довготривалих сеансів обробки як `session.long_running`, `session.stalled` або `session.stuck`. Відповідь, інструмент, статус, блок і прогрес ACP скидають таймер; повторювана діагностика `session.stuck` відступає, доки стан не змінюється.
- `stuckSessionAbortMs`: поріг віку без прогресу в мс, після якого придатна застрягла активна робота може бути аварійно осушена для відновлення. Якщо не задано, OpenClaw використовує безпечніше розширене вікно вбудованого запуску щонайменше 10 хвилин і 5x `stuckSessionWarnMs`.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (за замовчуванням: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. у [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL збирача для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові кінцеві точки OTLP для окремих сигналів. Якщо задано, вони перевизначають `otel.endpoint` лише для цього сигналу.
- `otel.protocol`: `"http/protobuf"` (за замовчуванням) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, які надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт трас, метрик або журналів.
- `otel.sampleRate`: частота вибірки трас `0`-`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання телеметрії в мс.
- `otel.captureContent`: добровільне захоплення сирого вмісту для атрибутів діапазону OTEL. За замовчуванням вимкнено. Булеве `true` захоплює несистемний вміст повідомлень/інструментів; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: змінна середовища для найновіших експериментальних атрибутів провайдера діапазонів GenAI. За замовчуванням діапазони зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: змінна середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/зупинку SDK, що належить Plugin, зберігаючи активними діагностичні слухачі.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища кінцевих точок для окремих сигналів, які використовуються, коли відповідний ключ конфігурації не задано.
- `cacheTrace.enabled`: журналювати знімки трасування кешу для вбудованих запусків (за замовчуванням: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL трасування кешу (за замовчуванням: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включено у вивід трасування кешу (усі за замовчуванням: `true`).

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

- `channel`: канал випусків для встановлень npm/git - `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску Gateway (за замовчуванням: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для пакетних встановлень (за замовчуванням: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням у стабільному каналі (за замовчуванням: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання стабільного каналу в годинах (за замовчуванням: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто запускаються перевірки бета-каналу в годинах (за замовчуванням: `1`; максимум: `24`).

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

- `enabled`: глобальний шлюз функції ACP (за замовчуванням: `true`; задайте `false`, щоб приховати диспетчеризацію ACP і можливості створення).
- `dispatch.enabled`: незалежний шлюз для диспетчеризації ходу сеансу ACP (за замовчуванням: `true`). Задайте `false`, щоб залишити команди ACP доступними, але блокувати виконання.
- `backend`: стандартний ідентифікатор бекенда середовища виконання ACP (має відповідати зареєстрованому Plugin середовища виконання ACP).
  Спочатку встановіть Plugin бекенда, і якщо задано `plugins.allow`, додайте ідентифікатор Plugin бекенда (наприклад `acpx`), інакше бекенд ACP не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли створення не задає явну ціль.
- `allowedAgents`: список дозволених ідентифікаторів агентів для сеансів середовища виконання ACP; порожній означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сеансів ACP.
- `stream.coalesceIdleMs`: вікно неактивного скидання в мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед поділом проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів за хід (за замовчуванням: `true`).
- `stream.deliveryMode`: `"live"` передає потік інкрементально; `"final_only"` буферизує до завершальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (за замовчуванням: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, що проєктується за хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів до булевих перевизначень видимості для потокових подій.
- `runtime.ttlMinutes`: TTL неактивності в хвилинах для робітників сеансу ACP перед придатним очищенням.
- `runtime.installCommand`: необов’язкова команда встановлення, яку слід виконати під час початкового налаштування середовища виконання ACP.

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
  - `"random"` (за замовчуванням): ротаційні кумедні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (назва/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), задайте змінну середовища `OPENCLAW_HIDE_BANNER=1`.

---

## Майстер

Метадані, записані потоками керованого налаштування CLI (`onboard`, `configure`, `doctor`):

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

Поточні збірки більше не містять TCP-міст. Nodes підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною схеми конфігурації (перевірка не проходить, доки їх не вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

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

- `sessionRetention`: як довго зберігати завершені ізольовані сеанси запусків cron перед видаленням із `sessions.json`. Також керує очищенням архівованих стенограм видалених cron. Типово: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір одного файла журналу запуску (`cron/runs/<jobId>.jsonl`) перед обрізанням. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки, що зберігаються, коли спрацьовує обрізання журналу запусків. Типово: `2000`.
- `webhookToken`: bearer-токен, що використовується для доставки cron Webhook через POST (`delivery.mode = "webhook"`); якщо пропущено, заголовок автентифікації не надсилається.
- `webhook`: застаріла резервна URL-адреса Webhook (http/https), що використовується лише для збережених завдань, які досі мають `notify: true`.

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
- `backoffMs`: масив затримок відступу в мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1-10 записів).
- `retryOn`: типи помилок, що запускають повторні спроби - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати всі тимчасові типи.

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

- `enabled`: увімкнути сповіщення про збої для завдань cron (типово: `false`).
- `after`: кількість послідовних збоїв перед надсиланням сповіщення (додатне ціле число, мінімум: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `includeSkipped`: зараховувати послідовно пропущені запуски до порогу сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на відступ для помилок виконання.
- `mode`: режим доставки - `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує в налаштований Webhook.
- `accountId`: необов’язковий ідентифікатор облікового запису або каналу для обмеження області доставки сповіщень.

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
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних про ціль.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL-адреса Webhook. Обов’язково для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` на рівні завдання перевизначає це глобальне типове значення.
- Коли не задано ні глобальне призначення збою, ні призначення збою на рівні завдання, завдання, які вже доставляються через `announce`, у разі збою повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не є `"webhook"`.

Див. [Завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблону медіамоделі

Заповнювачі шаблону, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повне тіло вхідного повідомлення                  |
| `{{RawBody}}`      | Сире тіло (без обгорток історії/відправника)      |
| `{{BodyStripped}}` | Тіло з вилученими згадками групи                  |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                 |
| `{{SessionId}}`    | UUID поточного сеансу                             |
| `{{IsNewSession}}` | `"true"`, коли створено новий сеанс               |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (image/audio/document/…)                |
| `{{Transcript}}`   | Стенограма аудіо                                  |
| `{{Prompt}}`       | Розв’язана медіапідказка для записів CLI          |
| `{{MaxChars}}`     | Розв’язана максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (за можливості)                        |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (за можливості) |
| `{{SenderName}}`   | Відображуване ім’я відправника (за можливості)    |
| `{{SenderE164}}`   | Номер телефону відправника (за можливості)        |
| `{{Provider}}`     | Підказка постачальника (whatsapp, telegram, discord тощо) |

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

- Один файл: замінює об’єкт-контейнер.
- Масив файлів: глибоко зливається по порядку (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: розв’язуються відносно файла, що включає, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми/форми з `../` дозволені лише тоді, коли вони все одно розв’язуються всередині цієї межі.
- Записи, керовані OpenClaw, які змінюють лише один розділ верхнього рівня, підтриманий однофайловим включенням, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, керованих OpenClaw; такі записи завершуються помилкою замість згортання конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних включень.

---

_Пов’язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
