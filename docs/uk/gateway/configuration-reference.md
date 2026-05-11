---
read_when:
    - Вам потрібна точна семантика конфігурації на рівні полів або точні значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на спеціалізовані довідники підсистем
title: Довідник з конфігурації
x-i18n:
    generated_at: "2026-05-11T20:36:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Довідник основної конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Конфігурація](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і містить посилання на окремі глибші довідники підсистем. Каталоги команд, що належать каналам і Plugin, а також глибокі налаштування пам’яті/QMD розміщені на власних сторінках, а не на цій.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими bundled/plugin/channel, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми в межах заданого шляху для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації щодо поточної поверхні схеми

Шлях пошуку агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації та обмежень на рівні поля перед редагуванням. Використовуйте
[Конфігурація](/uk/gateway/configuration) для орієнтованих на завдання настанов, а цю сторінку
для ширшої карти полів, типових значень і посилань на довідники підсистем.

Окремі глибокі довідники:

- [Довідник конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash-команди](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідних каналів/Plugin для поверхонь команд, специфічних для каналів

Формат конфігурації — **JSON5** (дозволені коментарі та кінцеві коми). Усі поля необов’язкові - OpenClaw використовує безпечні типові значення, якщо їх пропущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на спеціальну сторінку - див.
[Конфігурація - канали](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, обмеження згадок).

## Типові значення агента, багатоагентність, сеанси та повідомлення

Перенесено на спеціальну сторінку - див.
[Конфігурація - агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, thinking, heartbeat, пам’ять, медіа, skills, пісочниця)
- `multiAgent.*` (багатоагентна маршрутизація та прив’язки)
- `session.*` (життєвий цикл сеансу, compaction, pruning)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.consultThinkingLevel`: перевизначення рівня thinking для повного запуску агента OpenClaw за realtime-консультаціями Control UI Talk
  - `talk.consultFastMode`: одноразове перевизначення fast-mode для realtime-консультацій Control UI Talk
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає типове для платформи вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)

## Інструменти та користувацькі провайдери

Політику інструментів, експериментальні перемикачі, конфігурацію інструментів на базі провайдерів і налаштування користувацьких
провайдерів / base-URL перенесено на спеціальну сторінку - див.
[Конфігурація - інструменти та користувацькі провайдери](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, allowlist моделей і налаштування користувацьких провайдерів розміщені в
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

- `models.mode`: поведінка каталогу провайдера (`merge` або `replace`).
- `models.providers`: мапа користувацьких провайдерів, ключована за id провайдера.
- `models.providers.*.localService`: необов’язковий менеджер процесів на вимогу для
  локальних серверів моделей. OpenClaw перевіряє налаштований endpoint справності, запускає
  абсолютну `command`, коли потрібно, очікує готовності, а потім надсилає запит до моделі.
  Див. [Локальні сервіси моделей](/uk/gateway/local-model-services).
- `models.pricing.enabled`: керує фоновим bootstrap ціноутворення, який
  запускається після того, як sidecar-и та канали досягають шляху готовності Gateway. Коли `false`,
  Gateway пропускає отримання каталогів цін OpenRouter і LiteLLM; налаштовані
  значення `models.providers.*.models[].cost` і далі працюють для локальних оцінок вартості.

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
  відкривають доступ до налаштованих MCP-інструментів.
  Віддалені записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` — це CLI-native псевдонім, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.sessionIdleTtlMs`: idle TTL для bundled MCP runtime у межах сеансу.
  Одноразові вбудовані запуски запитують очищення після завершення запуску; цей TTL є резервним механізмом для
  довготривалих сеансів і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються гаряче шляхом звільнення кешованих MCP runtime сеансу.
  Наступне виявлення/використання інструментів відтворює їх із нової конфігурації, тому видалені
  записи `mcp.servers` прибираються негайно, а не очікують idle TTL.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI backend-и](/uk/gateway/cli-backends#bundle-mcp-overlays) щодо поведінки runtime.

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

- `allowBundled`: необов’язковий allowlist лише для bundled skills (керовані/workspace skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені skill (найнижчий пріоритет).
- `load.allowSymlinkTargets`: довірені реальні цільові корені, у які можуть
  розв’язуватися symlink-и skill, коли посилання розміщене поза налаштованим вихідним коренем.
- `install.preferBrew`: коли true, надавати перевагу інсталяторам Homebrew, якщо `brew`
  доступний, перед fallback до інших типів інсталяторів.
- `install.nodeManager`: уподобання інсталятора node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: дозволити довіреним клієнтам Gateway `operator.admin`
  встановлювати приватні zip-архіви, підготовлені через `skills.upload.*`
  (типово: false). Це вмикає лише шлях завантажених архівів; звичайні встановлення ClawHub
  цього не потребують.
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/встановлений.
- `entries.<skillKey>.apiKey`: зручне поле для skills, які оголошують основну змінну env (plain текстовий рядок або об’єкт SecretRef).

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

- Завантажуються з `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, а також `plugins.load.paths`.
- Виявлення приймає native OpenClaw plugins, а також сумісні Codex bundles і Claude bundles, включно з manifestless Claude bundles зі стандартним макетом.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий allowlist (завантажуються лише перелічені plugins). `deny` має пріоритет.
- `bundledDiscovery`: типово `"allowlist"` для нових конфігурацій, тому непорожній
  `plugins.allow` також обмежує bundled provider plugins, зокрема web-search
  runtime providers. Doctor записує `"compat"` для мігрованих legacy allowlist
  конфігурацій, щоб зберегти наявну поведінку bundled provider, доки ви явно не перейдете.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа рівня plugin (коли підтримується plugin).
- `plugins.entries.<id>.env`: мапа змінних env у межах plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` і ігнорує поля, що змінюють prompt, із legacy `before_agent_start`, водночас зберігаючи legacy `modelOverride` і `providerOverride`. Застосовується до native plugin hooks і підтримуваних директорій hook, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені non-bundled plugins можуть читати сирий вміст розмови з типізованих hooks, як-от `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довірити цьому plugin запитувати перевизначення `provider` і `model` для кожного запуску фонових subagent-запусків.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише коли ви навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowModelOverride`: явно довірити цьому plugin запитувати перевизначення моделі для `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для довірених перевизначень завершення LLM у plugin. Використовуйте `"*"` лише коли ви навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: явно довірити цьому plugin запускати `api.runtime.llm.complete` для не-типового agent id.
- `plugins.entries.<id>.config`: визначений plugin об’єкт конфігурації (валідується native схемою OpenClaw plugin, коли доступна).
- Налаштування облікового запису/runtime channel plugin розміщені в `channels.<id>` і мають описуватися метаданими `channelConfigs` у manifest відповідного plugin, а не центральним реєстром опцій OpenClaw.

### Конфігурація plugin Codex harness

Bundled `codex` plugin відповідає за налаштування native Codex app-server harness у
`plugins.entries.codex.config`. Повну поверхню конфігурації див. у
[Довідник Codex harness](/uk/plugins/codex-harness-reference), а runtime-модель — у [Codex harness](/uk/plugins/codex-harness).

`codexPlugins` застосовується лише до сеансів, які вибирають native Codex harness.
Він не вмикає Codex plugins для Pi, звичайних запусків провайдера OpenAI, ACP
прив’язок розмов або будь-якого non-Codex harness.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

- `plugins.entries.codex.config.codexPlugins.enabled`: вмикає нативну підтримку Codex
  Plugin/застосунків для Codex harness. Типово: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  типова політика деструктивних дій для перенесених еліситацій Plugin-застосунків.
  Типово: `false`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: вмикає
  перенесений запис Plugin, коли глобальний параметр `codexPlugins.enabled` також має значення true.
  Типово: `true` для явних записів.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  стабільна ідентичність marketplace. V1 підтримує лише `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: стабільна
  ідентичність Codex Plugin з міграції, наприклад `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  перевизначення політики деструктивних дій для окремого Plugin. Якщо пропущено,
  використовується глобальне значення `allow_destructive_actions`.

`codexPlugins.enabled` — це глобальна директива ввімкнення. Явні записи Plugin,
записані міграцією, є сталим набором установлених елементів і елементів, придатних
для відновлення. `plugins["*"]` не підтримується, перемикача `install` немає, а локальні
значення `marketplacePath` навмисно не є полями конфігурації, оскільки вони
залежать від хоста.

Перевірки готовності `app/list` кешуються на одну годину й оновлюються
асинхронно, коли застарівають. Конфігурація застосунку потоку Codex обчислюється
під час встановлення сеансу Codex harness, а не на кожному ході; використовуйте `/new`,
`/reset` або перезапуск Gateway після зміни нативної конфігурації Plugin.

- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера веботримання Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Повертається до `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілого `tools.web.fetch.firecrawl.apiKey` або змінної середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (типово: `https://api.firecrawl.dev`; перевизначення для self-hosted мають указувати на приватні/внутрішні кінцеві точки).
  - `onlyMainContent`: витягати зі сторінок лише основний вміст (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту scraping у секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok, яку слід використовувати для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: cadence Cron для кожного повного проходу dreaming (типово `"0 3 * * *"`).
  - `model`: необов’язкове перевизначення моделі під-агента Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз із типовою моделлю сеансу; помилки довіри або allowlist не відкотяться мовчки.
  - політика фаз і пороги є деталями реалізації (не ключами конфігурації для користувача).
- Повна конфігурація пам’яті розміщена в [довіднику конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені bundle-Plugin Claude також можуть надавати вбудовані типові значення Pi з `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: виберіть ідентифікатор активного Plugin пам’яті або `"none"`, щоб вимкнути Plugin пам’яті.
- `plugins.slots.contextEngine`: виберіть ідентифікатор активного Plugin контекстного рушія; типово `"legacy"`, якщо ви не встановите й не виберете інший рушій.

Див. [Plugins](/uk/tools/plugin).

---

## Зобов’язання

`commitments` керує виведеною пам’яттю подальших дій: OpenClaw може виявляти check-in у ходах розмови й доставляти їх через запуски Heartbeat.

- `commitments.enabled`: увімкнути приховане LLM-витягання, зберігання й доставку Heartbeat для виведених зобов’язань щодо подальших дій. Типово: `false`.
- `commitments.maxPerDay`: максимальна кількість виведених зобов’язань щодо подальших дій, доставлених за сеанс агента протягом rolling day. Типово: `3`.

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
  сеанс перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути відповідні окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, коли його не задано, тому навігація браузера типово залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте браузерній навігації приватною мережею.
- У суворому режимі кінцеві точки віддалених профілів CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і надалі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі приєднання (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявив `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL DevTools WebSocket.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до віддаленої та
  `attachOnly` CDP-доступності, а також до запитів відкриття вкладок. Керовані профілі loopback
  зберігають локальні типові значення CDP.
- Якщо зовнішньо керований CDP-сервіс доступний через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw трактує порт loopback як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть приєднуватися на
  вибраному хості або через під’єднаний браузерний вузол.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб вибрати конкретний
  профіль браузера на базі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість вибору CSS-селекторами, хуки завантаження
  одного файла, без перевизначень тайм-аутів діалогів, без `wait --load networkidle`, а також без
  `responsebody`, експорту PDF, перехоплення завантажень або batch-дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності CDP websocket після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  успішно стартує, але перевірки готовності змагаються із запуском. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: типовий браузер, якщо він на базі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для окремого профілю в профілях `existing-session` також розгортається з тильдою.
- Служба керування: лише loopback (порт виводиться з `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад
  `--disable-gpu`, налаштування розміру вікна або прапорці налагодження).

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

<Accordion title="Gateway field details">

- `mode`: `local` (запустити Gateway) або `remote` (підключитися до віддаленого Gateway). Gateway відмовляється запускатися, якщо не вказано `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (за замовчуванням), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми прив’язки**: використовуйте значення режиму прив’язки в `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: прив’язка `loopback` за замовчуванням слухає на `127.0.0.1` всередині контейнера. У мережі Docker bridge (`-p 18789:18789`) трафік надходить на `eth0`, тому Gateway недоступний. Використовуйте `--network host` або задайте `bind: "lan"` (чи `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: обов’язкова за замовчуванням. Прив’язки не через loopback потребують автентифікації Gateway. На практиці це означає спільний токен/пароль або reverse proxy з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер онбордингу за замовчуванням генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRefs), явно задайте `gateway.auth.mode` як `token` або `password`. Потоки запуску й установлення/ремонту сервісу завершуються помилкою, коли налаштовано обидва значення, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених локальних налаштувань local loopback; навмисно не пропонується в підказках онбордингу.
- `gateway.auth.mode: "trusted-proxy"`: делегує автентифікацію браузера/користувача reverse proxy з урахуванням ідентичності та довіряє заголовкам ідентичності з `gateway.trustedProxies` (див. [Автентифікація довіреного проксі](/uk/gateway/trusted-proxy-auth)). Цей режим за замовчуванням очікує джерело проксі **не через loopback**; same-host loopback reverse proxies потребують явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні same-host викликачі можуть використовувати `gateway.auth.password` як локальний прямий резервний варіант; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевірено через `tailscale whois`). HTTP API endpoints **не** використовують цю автентифікацію заголовка Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації Gateway. Цей потік без токена припускає, що хост Gateway є довіреним. За замовчуванням `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалої автентифікації. Застосовується для кожної IP-адреси клієнта та кожної області автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На async шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні неправильні спроби від того самого клієнта можуть спрацювати обмежувачем уже на другому запиті, замість того щоб обидві пройти як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` за замовчуванням має значення `true`; задайте `false`, коли ви навмисно хочете обмежувати частоту й для трафіку localhost (для тестових налаштувань або суворих proxy deployments).
- Спроби WS-автентифікації з браузерного origin завжди обмежуються з вимкненим винятком для loopback (поглиблений захист від браузерного brute force на localhost).
- На loopback такі блокування браузерного origin ізольовані за нормалізованим значенням `Origin`,
  тому повторні невдалі спроби з одного localhost origin не блокують автоматично
  інший origin.
- `tailscale.mode`: `serve` (лише tailnet, прив’язка loopback) або `funnel` (публічний, потребує автентифікації).
- `tailscale.preserveFunnel`: коли `true` і `tailscale.mode = "serve"`, OpenClaw
  перевіряє `tailscale funnel status` перед повторним застосуванням Serve під час запуску та пропускає
  його, якщо зовні налаштований маршрут Funnel уже покриває порт Gateway.
  За замовчуванням `false`.
- `controlUi.allowedOrigins`: явний allowlist браузерних origin для WebSocket-підключень Gateway. Обов’язковий, коли очікуються браузерні клієнти з origin не через loopback.
- `controlUi.chatMessageMaxWidth`: необов’язкова максимальна ширина для згрупованих повідомлень чату Control UI. Приймає обмежені значення ширини CSS, як-от `960px`, `82%`, `min(1280px, 82%)` і `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, що вмикає fallback origin за Host-header для deployments, які навмисно покладаються на політику origin за Host-header.
- `remote.transport`: `ssh` (за замовчуванням) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: process-environment
  break-glass override на боці клієнта, що дозволяє plaintext `ws://` до довірених IP
  приватної мережі; за замовчуванням для plaintext лишається лише loopback. Еквівалента в `openclaw.json`
  немає, а browser private-network config, як-от
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, не впливає на WebSocket-клієнтів Gateway.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують автентифікацію Gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL для зовнішнього APNs relay, який використовується офіційними/TestFlight збірками iOS після публікації реєстрацій з підтримкою relay у Gateway. Цей URL має збігатися з relay URL, скомпільованим у збірку iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання з Gateway до relay у мілісекундах. За замовчуванням `10000`.
- Реєстрації з підтримкою relay делегуються певній ідентичності Gateway. Пов’язаний iOS застосунок отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію relay і пересилає Gateway дозвіл на надсилання з областю цієї реєстрації. Інший Gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env overrides для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: development-only escape hatch для loopback HTTP relay URLs. Production relay URLs мають залишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: тайм-аут pre-auth WebSocket handshake Gateway у мілісекундах. За замовчуванням: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли задано. Збільште це значення на навантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки startup warmup ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал channel health-monitor у хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски health-monitor. За замовчуванням: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг stale-socket у хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. За замовчуванням: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor для каналу/облікового запису за рухому годину. За замовчуванням: `10`.
- `channels.<provider>.healthMonitor.enabled`: per-channel opt-out для перезапусків health-monitor зі збереженням глобального монітора ввімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: per-account override для каналів із кількома обліковими записами. Коли задано, має пріоритет над override рівня каналу.
- Локальні шляхи викликів Gateway можуть використовувати `gateway.remote.*` як fallback лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується fail-closed (без маскування remote fallback).
- `trustedProxies`: IP-адреси reverse proxy, які завершують TLS або вставляють forwarded-client headers. Вказуйте лише проксі, які ви контролюєте. Записи loopback все ще чинні для same-host proxy/local-detection setups (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, Gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. За замовчуванням `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий CIDR/IP allowlist для автоматичного схвалення першого pairing node device без запитаних scopes. Вимкнено, коли не задано. Це не схвалює автоматично pairing operator/browser/Control UI/WebChat, а також не схвалює автоматично оновлення role, scope, metadata або public-key.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне allow/deny формування для оголошених команд node після pairing та оцінки platform allowlist. Використовуйте `allowCommands`, щоб явно ввімкнути небезпечні команди node, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо platform default або явне allow інакше включили б її. Після зміни node свого оголошеного списку команд відхиліть і повторно схваліть pairing цього пристрою, щоб Gateway зберіг оновлений snapshot команд.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює default deny list).
- `gateway.tools.allow`: вилучити назви інструментів із default HTTP deny list.

</Accordion>

### OpenAI-сумісні endpoints

- Chat Completions: вимкнено за замовчуванням. Увімкніть за допомогою `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення URL-input для Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlists вважаються незаданими; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS origins, які ви контролюєте; див. [Автентифікація довіреного проксі](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох instances

Запустіть кілька Gateway на одному хості з унікальними портами та state dirs:

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

- `enabled`: вмикає завершення TLS на слухачі Gateway (HTTPS/WSS) (за замовчуванням: `false`).
- `autoGenerate`: автоматично генерує локальну self-signed пару cert/key, коли явні файли не налаштовано; лише для local/dev використання.
- `certPath`: шлях файлової системи до файлу TLS certificate.
- `keyPath`: шлях файлової системи до файлу TLS private key; тримайте доступ обмеженим.
- `caPath`: необов’язковий шлях до CA bundle для перевірки клієнта або custom trust chains.

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
  - `"off"`: ігнорувати live edits; зміни потребують явного restart.
  - `"restart"`: завжди перезапускати процес Gateway при зміні конфігурації.
  - `"hot"`: застосовувати зміни in-process без перезапуску.
  - `"hybrid"` (за замовчуванням): спершу спробувати hot reload; fallback до restart, якщо потрібно.
- `debounceMs`: debounce window у ms перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у ms для очікування in-flight operations перед примусовим restart або channel hot reload. Пропустіть його, щоб використати default bounded wait (`300000`); задайте `0`, щоб чекати безстроково й логувати періодичні still-pending warnings.

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
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад, `["hook:"]`).
- Якщо зіставлення або пресет використовує шаблонний `sessionKey`, установіть `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі зіставлення не потребують такого явного ввімкнення.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із корисного навантаження запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` зіставлення, відрендерені з шаблону, вважаються наданими ззовні й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Відомості про зіставлення">

- `match.path` зіставляє підшлях після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле корисного навантаження для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читаються з корисного навантаження.
- `transform` може вказувати на модуль JS/TS, який повертає дію хуку.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи й обхід каталогів відхиляються).
  - Тримайте `hooks.transformsDir` у `~/.openclaw/hooks/transforms`; каталоги Skills робочого простору відхиляються. Якщо `openclaw doctor` повідомляє, що цей шлях недійсний, перемістіть модуль трансформації до каталогу трансформацій хуків або видаліть `hooks.transformsDir`.
- `agentId` спрямовує до конкретного агента; невідомі ідентифікатори повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків агента хуків без явного `sessionKey`.
- `allowRequestSessionKey`: дозволити викликачам `/hooks/agent` і керованим шаблонами ключам сесій зіставлення встановлювати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + зіставлення), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-яке зіставлення або пресет використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску хуку (має бути дозволено, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований пресет Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте цю маршрутизацію для кожного повідомлення, установіть `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` так, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібен `hooks.allowRequestSessionKey: false`, перевизначте пресет статичним `sessionKey` замість шаблонного типового значення.

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

- Обслуговує редаговані агентом HTML/CSS/JS і A2UI через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: зберігайте `gateway.bind: "loopback"` (типово).
- Прив’язки не до loopback: маршрути canvas потребують автентифікації Gateway (токен/пароль/довірений проксі), як і інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки автентифікації; після сполучення та підключення вузла Gateway оголошує URL можливостей, обмежені вузлом, для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії вузла й швидко завершуються. Резервний варіант на основі IP не використовується.
- Вставляє клієнт live-reload в обслуговуваний HTML.
- Автоматично створює початковий `index.html`, коли порожньо.
- Також обслуговує A2UI за `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
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

- `minimal` (типово, коли ввімкнено вбудований Plugin `bonjour`): не включати `cliPath` + `sshPort` до TXT-записів.
- `full`: включати `cliPath` + `sshPort`; для багатоадресного оголошення в LAN усе одно потрібно, щоб вбудований Plugin `bonjour` був увімкнений.
- `off`: придушує багатоадресне оголошення в LAN без зміни ввімкнення Plugin.
- Вбудований Plugin `bonjour` автоматично запускається на хостах macOS і вмикається вручну в Linux, Windows і контейнеризованих розгортаннях Gateway.
- Ім’я хоста типово дорівнює системному імені хоста, якщо воно є дійсною DNS-міткою, інакше використовується `openclaw`. Перевизначте за допомогою `OPENCLAW_MDNS_HOSTNAME`.

### Широка зона (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує зону unicast DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднайте із DNS-сервером (рекомендовано CoreDNS) + split DNS Tailscale.

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
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої оболонки входу.
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

- Збігаються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні або порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте за допомогою `$${VAR}` для буквального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є додатковими: значення відкритим текстом усе ще працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Перевірка:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютний JSON-вказівник (наприклад `"/providers/openai/apiKey"`)
- шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id для `source: "exec"` не повинні містити сегменти шляху `.` або `..`, відокремлені скісною рискою (наприклад, `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включені до розв’язання під час виконання та покриття аудиту.

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
- Шляхи постачальників file і exec завершуються безпечною відмовою, коли перевірка Windows ACL недоступна. Встановлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Постачальник `exec` потребує абсолютного шляху `command` і використовує протокольні payload у stdin/stdout.
- За замовчуванням шляхи команд через символьні посилання відхиляються. Встановіть `allowSymlinkCommand: true`, щоб дозволити шляхи через символьні посилання з одночасною перевіркою розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довіреного каталогу застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` за замовчуванням мінімальне; явно передавайте потрібні змінні за допомогою `passEnv`.
- Посилання на секрети розв’язуються під час активації в знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Фільтрація активної поверхні застосовується під час активації: нерозв’язані посилання на ввімкнених поверхнях спричиняють збій запуску або перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

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

- Профілі для окремих агентів зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Застарілі пласкі карти `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є форматом виконання; `openclaw doctor --fix` переписує їх у канонічні профілі API-ключів `provider:default` із резервною копією `.legacy-flat.*.bak`.
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані профілю автентифікації на основі SecretRef.
- Статичні облікові дані часу виконання надходять із розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються, коли їх виявлено.
- Застарілі імпорти OAuth із `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: базова затримка повтору в годинах, коли профіль зазнає збою через справжні
  помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг може
  все ще потрапити сюди навіть у відповідях `401`/`403`, але специфічні для провайдера
  текстові зіставники залишаються обмеженими провайдером, якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повторювані HTTP `402` повідомлення про вікно використання або
  ліміт витрат організації/робочого простору натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин затримки білінгу для кожного провайдера.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання затримки білінгу (типово: `24`).
- `authPermanentBackoffMinutes`: базова затримка в хвилинах для високодостовірних збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: обмеження в хвилинах для зростання затримки `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників затримки повтору (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій профілів автентифікації того самого провайдера для помилок перевантаження перед переходом до резервної моделі (типово: `1`). Форми зайнятості провайдера, як-от `ModelNotReadyException`, потрапляють сюди.
- `overloadedBackoffMs`: фіксована затримка перед повтором ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій профілів автентифікації того самого провайдера для помилок ліміту частоти перед переходом до резервної моделі (типово: `1`). Цей кошик ліміту частоти включає сформований провайдером текст, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `maxFileBytes`: максимальний розмір активного файлу журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 МБ). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування за принципом найкращих зусиль для виводу консолі, файлових журналів, записів журналу OTLP і збереженого тексту транскрипту сеансу. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/транскриптів; поверхні безпеки UI/інструментів/діагностики все одно редагують секрети перед виведенням.

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
- `flags`: масив рядків прапорців, які вмикають цільовий вивід журналів (підтримує шаблони на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку без прогресу в мс для класифікації довготривалих сеансів обробки як `session.long_running`, `session.stalled` або `session.stuck`. Відповідь, інструмент, статус, блок і прогрес ACP скидають таймер; повторювана діагностика `session.stuck` відступає, доки стан не змінюється.
- `stuckSessionAbortMs`: поріг віку без прогресу в мс, після якого придатну завислу активну роботу можна перервати й осушити для відновлення. Якщо не задано, OpenClaw використовує безпечніше розширене вікно вбудованого запуску щонайменше 10 хвилин і 5x `stuckSessionWarnMs`.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. в [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові кінцеві точки OTLP для конкретних сигналів. Коли задано, вони перевизначають `otel.endpoint` лише для цього сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва служби для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: вмикають експорт трас, метрик або журналів.
- `otel.sampleRate`: частота вибірки трас `0`-`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання телеметрії в мс.
- `otel.captureContent`: явне ввімкнення захоплення сирого вмісту для атрибутів проміжків OTEL. Типово вимкнено. Булеве `true` захоплює несистемний вміст повідомлень/інструментів; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` і `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: перемикач середовища для найновіших експериментальних атрибутів провайдера проміжків GenAI. Типово проміжки зберігають застарілий атрибут `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: перемикач середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/завершення SDK, що належить Plugin, зберігаючи активними діагностичні слухачі.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища кінцевих точок для конкретних сигналів, що використовуються, коли відповідний ключ конфігурації не задано.
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

- `channel`: канал випуску для встановлень npm/git - `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску Gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для пакетних встановлень (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням стабільного каналу (типово: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання стабільного каналу в годинах (типово: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки бета-каналу в годинах (типово: `1`; максимум: `24`).

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

- `enabled`: глобальний перемикач можливості ACP (типово: `true`; задайте `false`, щоб приховати диспетчеризацію ACP і можливості створення).
- `dispatch.enabled`: незалежний перемикач для диспетчеризації ходу сеансу ACP (типово: `true`). Задайте `false`, щоб залишити команди ACP доступними, блокуючи виконання.
- `backend`: типовий ідентифікатор бекенду runtime ACP (має збігатися із зареєстрованим runtime Plugin ACP).
  Спочатку встановіть бекенд Plugin, а якщо задано `plugins.allow`, включіть ідентифікатор бекенд-Plugin (наприклад `acpx`), інакше бекенд ACP не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли створення не задає явну ціль.
- `allowedAgents`: список дозволених ідентифікаторів агентів для runtime-сеансів ACP; порожній означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сеансів ACP.
- `stream.coalesceIdleMs`: вікно скидання під час простою в мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед розбиттям проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів у межах ходу (типово: `true`).
- `stream.deliveryMode`: `"live"` транслює інкрементно; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, що проєктується на хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів у булеві перевизначення видимості для потокових подій.
- `runtime.ttlMinutes`: TTL простою в хвилинах для працівників сеансів ACP перед дозволеним очищенням.
- `runtime.installCommand`: необов’язкова команда встановлення, яку потрібно виконати під час початкового налаштування runtime-середовища ACP.

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
  - `"random"` (типово): змінні смішні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (назва/версія банера все одно показуються).
- Щоб приховати весь банер (не лише слогани), задайте env `OPENCLAW_HIDE_BANNER=1`.

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

Див. поля ідентичності `agents.list` у [типових значеннях агента](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застарілий, вилучено)

Поточні збірки більше не містять TCP-міст. Вузли підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною схеми конфігурації (перевірка завершується помилкою, доки їх не вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

<Accordion title="Застаріла конфігурація моста (історична довідка)">

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

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запусків cron перед вилученням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. За замовчуванням: `24h`; задайте `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір одного файлу журналу запуску (`cron/runs/<jobId>.jsonl`) перед обрізанням. За замовчуванням: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки, які зберігаються, коли спрацьовує обрізання журналу запуску. За замовчуванням: `2000`.
- `webhookToken`: bearer-токен, який використовується для доставки cron Webhook POST (`delivery.mode = "webhook"`); якщо його не вказано, заголовок автентифікації не надсилається.
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

- `maxAttempts`: максимальна кількість повторних спроб для одноразових завдань у разі тимчасових помилок (за замовчуванням: `3`; діапазон: `0`-`10`).
- `backoffMs`: масив затримок backoff у мс для кожної повторної спроби (за замовчуванням: `[30000, 60000, 300000]`; 1-10 записів).
- `retryOn`: типи помилок, які запускають повторні спроби - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Не вказуйте, щоб повторювати всі тимчасові типи.

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
- `after`: кількість послідовних збоїв перед спрацюванням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `includeSkipped`: враховувати послідовно пропущені запуски в порозі сповіщення (за замовчуванням: `false`). Пропущені запуски відстежуються окремо й не впливають на backoff помилок виконання.
- `mode`: режим доставки - `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує до налаштованого Webhook.
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

- Типове місце призначення для сповіщень про збої cron в усіх завданнях.
- `mode`: `"announce"` або `"webhook"`; за замовчуванням використовується `"announce"`, коли є достатньо цільових даних.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL Webhook. Обов’язково для режиму Webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- Параметр `delivery.failureDestination` для окремого завдання перевизначає це глобальне значення за замовчуванням.
- Якщо ні глобальне, ні задане для окремого завдання місце призначення збою не встановлено, завдання, які вже доставляються через `announce`, у разі збою повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не є `"webhook"`.

Див. [завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Плейсхолдери шаблону, які розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повний вхідний текст повідомлення                 |
| `{{RawBody}}`      | Необроблений текст (без обгорток історії/відправника) |
| `{{BodyStripped}}` | Текст із видаленими згадками групи                |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                 |
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Вхідний псевдо-URL медіа                          |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (зображення/аудіо/документ/…)           |
| `{{Transcript}}`   | Аудіотранскрипт                                   |
| `{{Prompt}}`       | Розв’язаний медіа-промпт для записів CLI          |
| `{{MaxChars}}`     | Розв’язана максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (наскільки можливо)                    |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (наскільки можливо) |
| `{{SenderName}}`   | Відображуване ім’я відправника (наскільки можливо) |
| `{{SenderE164}}`   | Номер телефону відправника (наскільки можливо)    |
| `{{Provider}}`     | Підказка провайдера (whatsapp, telegram, discord тощо) |

---

## Конфігураційні включення (`$include`)

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

- Один файл: замінює об’єкт, який його містить.
- Масив файлів: глибоко зливається по порядку (пізніші значення перевизначають попередні).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: розв’язуються відносно файлу, який виконує включення, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми та форми `../` дозволені лише тоді, коли вони все ще розв’язуються в цих межах.
- Записи, що належать OpenClaw і змінюють лише один розділ верхнього рівня, підтриманий включенням одного файлу, записуються саме в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, що належать OpenClaw; такі записи завершуються помилкою без розгортання конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних включень.

---

_Пов’язане: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
