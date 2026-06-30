---
read_when:
    - Вам потрібна точна семантика конфігурації на рівні полів або типові значення
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, типових значень і посилань на окремі довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-06-30T22:32:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c95497f4f76fd124505ffb9d0173e7e2adeeed82ee12812b2eca9673d5520fc4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Довідник основної конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на задачі, див. [Конфігурація](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і дає посилання на окремі глибші довідники для підсистем. Каталоги команд, що належать каналам і plugin, а також глибокі параметри памʼяті/QMD розміщені на власних сторінках, а не на цій.

Джерело істини в коді:

- `openclaw config schema` друкує актуальну JSON Schema, що використовується для валідації та Control UI, з обʼєднаними метаданими bundled/plugin/channel, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми, обмежений шляхом, для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації відносно поточної поверхні схеми

Шлях пошуку агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації та обмежень на рівні полів перед редагуванням. Використовуйте
[Конфігурація](/uk/gateway/configuration) для настанов, орієнтованих на задачі, а цю сторінку
для ширшої карти полів, значень за замовчуванням і посилань на довідники підсистем.

Окремі глибокі довідники:

- [Довідник конфігурації памʼяті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash-команди](/uk/tools/slash-commands) для поточного каталогу вбудованих і bundled команд
- сторінки відповідних каналів/plugin для поверхонь команд, специфічних для каналів

Формат конфігурації — **JSON5** (коментарі та кінцеві коми дозволені). Усі поля необовʼязкові - OpenClaw використовує безпечні значення за замовчуванням, якщо їх пропущено.

---

## Канали

Ключі конфігурації окремих каналів перенесено на окрему сторінку - див.
[Конфігурація - канали](/uk/gateway/config-channels) для `channels.*`,
включно зі Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та іншими
bundled каналами (автентифікація, контроль доступу, кілька облікових записів, блокування за згадками).

## Значення агента за замовчуванням, multi-agent, сесії та повідомлення

Перенесено на окрему сторінку - див.
[Конфігурація - агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, мислення, Heartbeat, памʼять, медіа, Skills, sandbox)
- `multiAgent.*` (маршрутизація multi-agent і привʼязки)
- `session.*` (життєвий цикл сесії, Compaction, обрізання)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.consultThinkingLevel`: перевизначення рівня мислення для повного запуску агента OpenClaw за realtime-консультаціями Control UI Talk
  - `talk.consultFastMode`: одноразове перевизначення fast-mode для realtime-консультацій Control UI Talk
  - `talk.speechLocale`: необовʼязковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: коли не задано, Talk зберігає стандартне для платформи вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: резервний relay Gateway для завершених realtime-транскриптів Talk, які пропускають `openclaw_agent_consult`

## Інструменти та власні провайдери

Політики інструментів, експериментальні перемикачі, конфігурацію інструментів із підтримкою провайдера та налаштування власного
провайдера / base-URL перенесено на окрему сторінку - див.
[Конфігурація - інструменти та власні провайдери](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, allowlist моделей і налаштування власного провайдера розміщено в
[Конфігурація - інструменти та власні провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.providers`: мапа власних провайдерів, ключована за ідентифікатором провайдера.
- `models.providers.*.localService`: необовʼязковий менеджер процесів on-demand для
  локальних серверів моделей. OpenClaw перевіряє налаштований endpoint здоровʼя, запускає
  абсолютну `command`, коли це потрібно, чекає готовності, а потім надсилає запит моделі.
  Див. [Локальні сервіси моделей](/uk/gateway/local-model-services).
- `models.pricing.enabled`: керує фоновою ініціалізацією цін, яка
  стартує після того, як sidecar-и та канали досягають ready-шляху Gateway. Коли `false`,
  Gateway пропускає отримання pricing-каталогів OpenRouter і LiteLLM; налаштовані
  значення `models.providers.*.models[].cost` все одно працюють для локальних оцінок вартості.

## MCP

Визначення MCP-серверів, керованих OpenClaw, розміщені в `mcp.servers` і
використовуються вбудованим OpenClaw та іншими runtime-адаптерами. Команди `openclaw mcp list`,
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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: іменовані визначення stdio або віддалених MCP-серверів для runtime-ів, які
  надають налаштовані MCP-інструменти.
  Віддалені записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` є CLI-native псевдонімом, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.servers.<name>.enabled`: задайте `false`, щоб зберегти визначення сервера,
  але виключити його з виявлення MCP у вбудованому OpenClaw і проєкції інструментів.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: таймаут MCP-запиту для окремого сервера
  в секундах або мілісекундах.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: таймаут підключення для окремого сервера
  в секундах або мілісекундах.
- `mcp.servers.<name>.supportsParallelToolCalls`: необовʼязкова підказка про паралельність для
  адаптерів, які можуть обирати, чи виконувати паралельні виклики MCP-інструментів.
- `mcp.servers.<name>.auth`: задайте `"oauth"` для HTTP MCP-серверів, яким потрібен
  OAuth. Запустіть `openclaw mcp login <name>`, щоб зберегти токени у стані OpenClaw.
- `mcp.servers.<name>.oauth`: необовʼязкові перевизначення scope OAuth, redirect URL і URL метаданих клієнта.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: керування HTTP TLS
  для приватних endpoint-ів і mutual TLS.
- `mcp.servers.<name>.toolFilter`: необовʼязковий вибір інструментів для окремого сервера. `include`
  обмежує виявлені MCP-інструменти відповідними іменами; `exclude` приховує відповідні
  імена. Записи — це точні імена MCP-інструментів або прості globs із `*`. Сервери з
  ресурсами або prompts також генерують імена utility-інструментів (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), і ці імена використовують той самий
  фільтр.
- `mcp.servers.<name>.codex`: необовʼязкові елементи керування проєкцією Codex app-server.
  Цей блок є метаданими OpenClaw лише для потоків Codex app-server; він не
  впливає на ACP-сесії, загальну конфігурацію Codex harness або інші runtime-адаптери.
  Непорожній `codex.agents` обмежує сервер переліченими ідентифікаторами агентів OpenClaw.
  Порожні, blank або недійсні scoped списки агентів відхиляються валідацією конфігурації
  та пропускаються шляхом runtime-проєкції замість того, щоб ставати глобальними.
  `codex.defaultToolsApprovalMode` видає native для Codex
  `default_tools_approval_mode` для цього сервера. OpenClaw вилучає блок `codex`
  перед передаванням native конфігурації `mcp_servers` до Codex. Пропустіть блок, щоб
  сервер проєктувався для кожного агента Codex app-server із стандартною поведінкою Codex
  для схвалення MCP.
- `mcp.sessionIdleTtlMs`: idle TTL для session-scoped bundled MCP runtime-ів.
  Одноразові вбудовані запуски запитують очищення після завершення запуску; цей TTL є запасним механізмом для
  довгоживучих сесій і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються гаряче через disposal кешованих session MCP runtime-ів.
  Наступне виявлення/використання інструментів відтворює їх із нової конфігурації, тому видалені
  записи `mcp.servers` прибираються негайно, а не чекають idle TTL.
- Runtime-виявлення також враховує сповіщення про зміну списку MCP-інструментів, скидаючи
  кешований каталог для цієї сесії. Сервери, які оголошують ресурси або
  prompts, отримують utility-інструменти для переліку/читання ресурсів і переліку/отримання
  prompts. Повторні збої викликів інструментів ненадовго призупиняють відповідний сервер перед
  наступною спробою виклику.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI-бекенди](/uk/gateway/cli-backends#bundle-mcp-overlays) щодо поведінки runtime.

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
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`: необовʼязковий allowlist лише для bundled skills (managed/workspace skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені skill (найнижчий пріоритет).
- `load.allowSymlinkTargets`: довірені реальні цільові корені, у які можуть
  резолвитися symlink-и skill, коли посилання розміщене поза налаштованим source root.
- `workshop.allowSymlinkTargetWrites`: дозволяє Skill Workshop apply писати
  через уже довірені symlink-цілі (за замовчуванням: false).
- `install.preferBrew`: коли true, віддає перевагу інсталяторам Homebrew, якщо `brew`
  доступний, перед fallback до інших типів інсталяторів.
- `install.nodeManager`: перевага інсталятора node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: дозволяє довіреним клієнтам Gateway `operator.admin`
  встановлювати приватні zip-архіви, staged через `skills.upload.*`
  (за замовчуванням: false). Це вмикає лише шлях uploaded-archive; звичайні інсталяції ClawHub
  цього не потребують.
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручність для skills, що оголошують основну env var (plaintext string або обʼєкт SecretRef).

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

- Завантажується з каталогів пакетів або бандлів у `~/.openclaw/extensions` і `<workspace>/.openclaw/extensions`, а також із файлів або каталогів, перелічених у `plugins.load.paths`.
- Розміщуйте окремі файли Plugin у `plugins.load.paths`; автоматично виявлені корені розширень ігнорують файли `.js`, `.mjs` і `.ts` верхнього рівня, щоб допоміжні скрипти в цих коренях не блокували запуск.
- Виявлення приймає нативні Plugin OpenClaw, а також сумісні бандли Codex і бандли Claude, зокрема бандли Claude без маніфесту зі стандартною структурою.
- **Зміни конфігурації потребують перезапуску Gateway.**
- `allow`: необов’язковий список дозволених (завантажуються лише перелічені Plugin). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні Plugin (коли підтримується Plugin).
- `plugins.entries.<id>.env`: мапа змінних середовища в області Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` та ігнорує поля, що змінюють промпт, із застарілого `before_agent_start`, зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних хуків Plugin і підтримуваних каталогів хуків, наданих бандлом.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені не вбудовані Plugin можуть читати сирий вміст розмови з типізованих хуків, як-от `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряє цьому Plugin запитувати перевизначення `provider` і `model` для кожного запуску фонових запусків субагента.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених перевизначень субагента. Використовуйте `"*"` лише тоді, коли ви навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowModelOverride`: явно довіряє цьому Plugin запитувати перевизначення моделі для `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених перевизначень завершення LLM Plugin. Використовуйте `"*"` лише тоді, коли ви навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: явно довіряє цьому Plugin запускати `api.runtime.llm.complete` для ідентифікатора агента, відмінного від стандартного.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений Plugin (перевіряється схемою нативного Plugin OpenClaw, коли вона доступна).
- Налаштування облікового запису й середовища виконання Plugin каналу розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфесту Plugin-власника, а не центральним реєстром опцій OpenClaw.

### Конфігурація Plugin обв’язки Codex

Вбудований Plugin `codex` володіє нативними налаштуваннями обв’язки сервера застосунку Codex у
`plugins.entries.codex.config`. Див.
[довідник обв’язки Codex](/uk/plugins/codex-harness-reference) для повної поверхні конфігурації
та [обв’язку Codex](/uk/plugins/codex-harness) для моделі середовища виконання.

`codexPlugins` застосовується лише до сеансів, які вибирають нативну обв’язку Codex.
Він не вмикає Plugin Codex для запусків провайдера OpenClaw, прив’язок розмов ACP
або будь-якої обв’язки не Codex.

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
  Plugin/застосунку Codex для обв’язки Codex. За замовчуванням: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  стандартна політика руйнівних дій для перенесених elicitations застосунків Plugin.
  Використовуйте `true`, щоб приймати безпечні схеми схвалення Codex без запиту, `false`,
  щоб відхиляти їх, `"auto"`, щоб маршрутизувати потрібні Codex схвалення через схвалення
  Plugin OpenClaw, або `"always"`, щоб запитувати кожну дію запису/руйнівну дію Plugin
  без тривалого схвалення. Режим `"always"` очищає тривалі перевизначення схвалень Codex
  для кожного інструмента відповідного застосунку перед запуском потоку.
  За замовчуванням: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: вмикає
  перенесений запис Plugin, коли глобальний `codexPlugins.enabled` також має значення true.
  За замовчуванням: `true` для явних записів.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  стабільна ідентичність маркетплейсу. V1 підтримує лише `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: стабільна
  ідентичність Plugin Codex із міграції, наприклад `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  перевизначення руйнівних дій для окремого Plugin. Якщо пропущено, використовується глобальне
  значення `allow_destructive_actions`. Значення для окремого Plugin приймає ті самі політики
  `true`, `false`, `"auto"` або `"always"`.

`codexPlugins.enabled` є глобальною директивою ввімкнення. Явні записи Plugin,
записані міграцією, є тривалим набором встановлення та придатності до відновлення.
`plugins["*"]` не підтримується, перемикача `install` немає, а локальні
значення `marketplacePath` навмисно не є полями конфігурації, бо вони
залежать від хоста.

Перевірки готовності `app/list` кешуються на одну годину й оновлюються
асинхронно, коли застарівають. Конфігурація застосунку потоку Codex обчислюється під час
встановлення сеансу обв’язки Codex, а не на кожному ході; використовуйте `/new`, `/reset` або перезапуск Gateway
після зміни нативної конфігурації Plugin.

- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера веб-отримання Firecrawl.
  - `apiKey`: необов’язковий API-ключ Firecrawl для вищих лімітів (приймає SecretRef). Резервно використовує `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілий `tools.web.fetch.firecrawl.apiKey` або змінну середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базова URL-адреса API Firecrawl (за замовчуванням: `https://api.firecrawl.dev`; самостійно розгорнуті перевизначення мають вказувати на приватні/внутрішні кінцеві точки).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (за замовчуванням: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (за замовчуванням: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту скрейпінгу в секундах (за замовчуванням: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (за замовчуванням `false`).
  - `frequency`: cadence Cron для кожного повного проходу dreaming (`"0 3 * * *"` за замовчуванням).
  - `model`: необов’язкове перевизначення моделі субагента Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз зі стандартною моделлю сеансу; збої довіри або списку дозволених не переходять до резервного варіанта мовчки.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті міститься в [довіднику конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Plugin бандлів Claude також можуть надавати вбудовані стандартні значення OpenClaw із `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати ідентифікатор активного Plugin пам’яті або `"none"`, щоб вимкнути Plugin пам’яті.
- `plugins.slots.contextEngine`: вибрати ідентифікатор активного Plugin рушія контексту; за замовчуванням `"legacy"`, якщо ви не встановите й не виберете інший рушій.

Див. [Plugins](/uk/tools/plugin).

---

## Зобов’язання

`commitments` керує виведеною пам’яттю подальших дій: OpenClaw може виявляти чекіни з ходів розмови й доставляти їх через запуски Heartbeat.

- `commitments.enabled`: увімкнути приховане витягування LLM, зберігання й доставку Heartbeat для виведених зобов’язань щодо подальших дій. За замовчуванням: `false`.
- `commitments.maxPerDay`: максимальна кількість виведених зобов’язань щодо подальших дій, доставлених за сеанс агента протягом рухомого дня. За замовчуванням: `3`.

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
- `tabCleanup` повертає відстежувані вкладки основного агента після часу простою або коли
  сеанс перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, коли значення не задано, тому навігація браузера за замовчуванням залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте навігації браузера в приватній мережі.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і надалі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі призначені лише для підключення (запуск/зупинка/скидання вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає пряму URL-адресу WebSocket DevTools.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до перевірки доступності віддаленого та
  `attachOnly` CDP, а також до запитів відкриття вкладок. Керовані профілі loopback
  зберігають локальні значення CDP за замовчуванням.
- Якщо зовнішньо керована служба CDP доступна через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw трактуватиме порт loopback як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися на
  вибраному хості або через підключений вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` можуть задавати `cdpUrl`, коли Chrome уже працює
  за кінцевою точкою виявлення DevTools HTTP(S) або прямою кінцевою точкою WS(S). У цьому
  режимі OpenClaw передає кінцеву точку до Chrome MCP замість використання автопідключення;
  `userDataDir` ігнорується для аргументів запуску Chrome MCP.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі знімків/ref замість націлювання CSS-селектором, хуки завантаження одного файла,
  без перевизначень тайм-ауту діалогів, без `wait --load networkidle` і без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; задавайте
  `cdpUrl` явно лише для віддалених профілів CDP або підключення до кінцевої точки existing-session.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності websocket CDP після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  успішно запускається, але перевірки готовності випереджають запуск. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: браузер за замовчуванням, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для профілю в профілях `existing-session` також розгортається з тильдою.
- Служба керування: лише loopback (порт виводиться з `gateway.port`, за замовчуванням `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального запуску Chromium (наприклад
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

- `seamColor`: акцентний колір для chrome інтерфейсу нативного застосунку (відтінок бульбашки режиму Talk тощо).
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
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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

<Accordion title="Докладні відомості про поля Gateway">

- `mode`: `local` (запуск gateway) або `remote` (підключення до віддаленого gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типова прив’язка `loopback` слухає `127.0.0.1` усередині контейнера. За мережі Docker bridge (`-p 18789:18789`) трафік надходить на `eth0`, тому gateway недоступний. Використовуйте `--network host` або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: типово обов’язкова. Прив’язки не-loopback потребують автентифікації gateway. На практиці це означає спільний токен/пароль або identity-aware зворотний проксі з `gateway.auth.mode: "trusted-proxy"`. Майстер онбордингу типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема SecretRefs), явно задайте `gateway.auth.mode` як `token` або `password`. Запуск і потоки встановлення/відновлення сервісу завершуються помилкою, коли налаштовано обидва значення, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; це навмисно не пропонується в підказках онбордингу.
- `gateway.auth.mode: "trusted-proxy"`: делегує автентифікацію браузера/користувача identity-aware зворотному проксі та довіряє заголовкам ідентичності з `gateway.trustedProxies` (див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth)). Цей режим типово очікує джерело проксі **не-loopback**; зворотні проксі loopback на тому самому хості потребують явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні викликачі з того самого хоста можуть використовувати `gateway.auth.password` як локальний прямий fallback; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію заголовків Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації gateway. Цей потік без токена припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалої автентифікації. Застосовується для кожної IP-адреси клієнта та кожної області автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні хибні спроби від того самого клієнта можуть спрацювати обмежувачем уже на другому запиті, замість того щоб обидві пройти як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; задайте `false`, коли ви навмисно хочете обмежувати частоту трафіку localhost також (для тестових налаштувань або суворих проксі-розгортань).
- Спроби WS-автентифікації з browser-origin завжди обмежуються з вимкненим винятком для loopback (додатковий захист від brute force localhost із браузера).
- На loopback такі блокування browser-origin ізольовані за нормалізованим значенням `Origin`, тому повторні невдачі з одного localhost origin не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, прив’язка loopback) або `funnel` (публічний, потребує автентифікації).
- `tailscale.serviceName`: необов’язкова назва Tailscale Service для режиму Serve, наприклад `svc:openclaw`. Коли задано, OpenClaw передає її в `tailscale serve
--service`, щоб Control UI можна було відкрити через іменований Service замість hostname пристрою. Значення має використовувати формат назви Service Tailscale `svc:<dns-label>`; під час запуску повідомляється похідний URL Service.
- `tailscale.preserveFunnel`: коли `true` і `tailscale.mode = "serve"`, OpenClaw перевіряє `tailscale funnel status` перед повторним застосуванням Serve під час запуску та пропускає його, якщо зовнішньо налаштований маршрут Funnel уже покриває порт gateway. Типово `false`.
- `controlUi.allowedOrigins`: явний allowlist browser-origin для підключень Gateway WebSocket. Обов’язковий для публічних browser-origin не-loopback. Приватні завантаження інтерфейсу same-origin LAN/Tailnet з loopback, RFC1918/link-local, `.local`, `.ts.net` або хостів Tailscale CGNAT приймаються без увімкнення fallback за заголовком Host.
- `controlUi.chatMessageMaxWidth`: необов’язкова максимальна ширина для згрупованих повідомлень чату Control UI. Приймає обмежені значення ширини CSS, як-от `960px`, `82%`, `min(1280px, 82%)` і `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає origin fallback за заголовком Host для розгортань, що навмисно покладаються на політику origin за заголовком Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `wss://` для публічних хостів; відкритий текст `ws://` приймається лише для loopback, LAN, link-local, `.local`, `.ts.net` і хостів Tailscale CGNAT.
- `remote.remotePort`: порт gateway на віддаленому SSH-хості. Типово `18789`; використовуйте це, коли локальний порт тунелю відрізняється від віддаленого порту gateway.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Самі по собі вони не налаштовують автентифікацію gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL для зовнішнього APNs relay, що використовується після того, як iOS-збірки з підтримкою relay публікують реєстрації в gateway. Публічні збірки App Store/TestFlight використовують розміщений relay OpenClaw. Користувацькі URL relay мають відповідати навмисно окремому шляху iOS-збірки/розгортання, URL relay якого вказує на цей relay.
- `gateway.push.apns.relay.timeoutMs`: таймаут надсилання від gateway до relay в мілісекундах. Типово `10000`.
- Реєстрації з підтримкою relay делегуються конкретній ідентичності gateway. Пов’язаний застосунок iOS отримує `gateway.identity.get`, додає цю ідентичність до реєстрації relay і пересилає gateway грант надсилання, обмежений цією реєстрацією. Інший gateway не може повторно використати збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові перевизначення env для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch лише для розробки для HTTP URL relay на loopback. Production URL relay мають залишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: таймаут pre-auth Gateway WebSocket handshake у мілісекундах. Типово: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли задано. Збільшуйте це значення на навантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки прогрів запуску ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал монітора здоров’я каналу в хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски монітора здоров’я. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітора здоров’я на канал/обліковий запис протягом рухомої години. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: вимкнення перезапусків монітора здоров’я для окремого каналу зі збереженням увімкненого глобального монітора.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для окремого облікового запису в багатоканальних каналах. Коли задано, має пріоритет над перевизначенням рівня каналу.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як fallback лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується закритою помилкою (без маскування віддаленим fallback).
- `trustedProxies`: IP-адреси зворотних проксі, які завершують TLS або ін’єктують заголовки forwarded-client. Вказуйте лише проксі, які ви контролюєте. Записи loopback усе ще чинні для налаштувань проксі/локального виявлення на тому самому хості (наприклад, Tailscale Serve або локальний зворотний проксі), але вони **не** роблять запити loopback придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий allowlist CIDR/IP для автоматичного схвалення першого спарювання пристрою-вузла без запитаних областей. Вимкнено, коли не задано. Це не схвалює автоматично спарювання operator/browser/Control UI/WebChat і не схвалює автоматично оновлення ролі, області, метаданих або публічного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд вузла після спарювання та оцінки allowlist платформи. Використовуйте `allowCommands`, щоб явно дозволити небезпечні команди вузла, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо стандарт платформи або явний allow інакше включив би її. Після того як вузол змінить свій оголошений список команд, відхиліть і повторно схваліть спарювання цього пристрою, щоб gateway зберіг оновлений знімок команд.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий deny list).
- `gateway.tools.allow`: вилучає назви інструментів із типового HTTP deny list для викликачів owner/admin. Це не підвищує викликачів `operator.write` з ідентичністю до доступу owner/admin; `cron`, `gateway` і `nodes` залишаються недоступними для викликачів не-owner навіть за наявності в allowlist.

</Accordion>

### OpenAI-сумісні кінцеві точки

- Адміністративний HTTP RPC: типово вимкнено як plugin `admin-http-rpc`. Увімкніть plugin, щоб зареєструвати `POST /api/v1/admin/rpc`. Див. [Адміністративний HTTP RPC](/uk/plugins/admin-http-rpc).
- Chat Completions: типово вимкнено. Увімкніть за допомогою `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-вводу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlists вважаються незаданими; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS origins, які ви контролюєте; див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька gateways на одному хості з унікальними портами та каталогами стану:

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

- `enabled`: вмикає завершення TLS на listener gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, коли явні файли не налаштовано; лише для локального/dev використання.
- `certPath`: шлях файлової системи до файлу TLS-сертифіката.
- `keyPath`: шлях файлової системи до файлу приватного ключа TLS; тримайте доступ обмеженим.
- `caPath`: необов’язковий шлях до CA bundle для перевірки клієнта або користувацьких ланцюгів довіри.

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
  - `"restart"`: завжди перезапускати процес Gateway після зміни конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спершу спробувати гаряче перезавантаження; за потреби відкотитися до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс для очікування операцій у процесі перед примусовим перезапуском або гарячим перезавантаженням каналу. Пропустіть, щоб використати типове обмежене очікування (`300000`); задайте `0`, щоб чекати необмежено й періодично журналювати попередження про все ще незавершені операції.

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

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` потребує непорожнього `hooks.token`.
- `hooks.token` має відрізнятися від активної автентифікації Gateway через спільний секрет (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); під час запуску журналюється некритичне попередження безпеки, якщо виявлено повторне використання.
- `openclaw security audit` позначає повторне використання автентифікації хуків/Gateway як критичну проблему, включно з автентифікацією Gateway паролем, наданою лише під час аудиту (`--auth password --password <password>`). Запустіть `openclaw doctor --fix`, щоб ротувати збережений повторно використаний `hooks.token`, а потім оновіть зовнішніх відправників хуків, щоб вони використовували новий токен хуків.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад, `["hook:"]`).
- Якщо мапінг або пресет використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі мапінгу не потребують цього явного ввімкнення.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з корисного навантаження запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → вирішується через `hooks.mappings`
  - Значення `sessionKey` мапінгу, відрендерені з шаблону, вважаються наданими ззовні й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` збігається з підшляхом після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` збігається з полем корисного навантаження для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читаються з корисного навантаження.
- `transform` може вказувати на модуль JS/TS, що повертає дію хука.
  - `transform.module` має бути відносним шляхом і лишатися в межах `hooks.transformsDir` (абсолютні шляхи та обхід каталогів відхиляються).
  - Тримайте `hooks.transformsDir` у `~/.openclaw/hooks/transforms`; каталоги Skills у робочому просторі відхиляються. Якщо `openclaw doctor` повідомляє, що цей шлях недійсний, перемістіть модуль трансформації до каталогу трансформацій хуків або видаліть `hooks.transformsDir`.
- `agentId` спрямовує до конкретного агента; невідомі ідентифікатори відкотяться до типового агента.
- `allowedAgentIds`: обмежує ефективну маршрутизацію агентів, включно зі шляхом типового агента, коли `agentId` пропущено (`*` або пропущено = дозволити всіх, `[]` = заборонити всіх).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для агентних запусків хуків без явного `sessionKey`.
- `allowRequestSessionKey`: дозволити викликачам `/hooks/agent` і керованим шаблонами ключам сесій мапінгу задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий дозволений список префіксів для явних значень `sessionKey` (запит + мапінг), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-який мапінг або пресет використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску хука (має бути дозволено, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований пресет Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
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
- Не запускайте окремий `gog gmail watch serve` поруч із Gateway.

---

## Хост Plugin canvas

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

- Обслуговує HTML/CSS/JS, редаговані агентом, і A2UI через HTTP під портом Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Прив’язки не до loopback: маршрути canvas потребують автентифікації Gateway (токен/пароль/довірений проксі), так само як інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки автентифікації; після спарювання й підключення вузла Gateway оголошує URL-адреси можливостей у межах вузла для доступу до canvas/A2UI.
- URL-адреси можливостей прив’язані до активної WS-сесії вузла й швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт живого перезавантаження в обслуговуваний HTML.
- Автоматично створює початковий `index.html`, коли порожньо.
- Також обслуговує A2UI на `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску Gateway.
- Вимкніть живе перезавантаження для великих каталогів або помилок `EMFILE`.

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

- `minimal` (типово, коли ввімкнено вбудований Plugin `bonjour`): пропускати `cliPath` + `sshPort` із TXT-записів.
- `full`: включати `cliPath` + `sshPort`; multicast-реклама в LAN усе ще потребує ввімкненого вбудованого Plugin `bonjour`.
- `off`: придушити multicast-рекламу в LAN без зміни ввімкнення Plugin.
- Вбудований Plugin `bonjour` автоматично запускається на хостах macOS і є опціональним на Linux, Windows і контейнеризованих розгортаннях Gateway.
- Ім’я хоста типово дорівнює системному імені хоста, коли воно є дійсною DNS-міткою, інакше використовується `openclaw`. Перевизначте за допомогою `OPENCLAW_MDNS_HOSTNAME`.

### Широка зона (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує unicast-зону DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднайте із DNS-сервером (рекомендовано CoreDNS) + split DNS Tailscale.

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

- Вбудовані змінні середовища застосовуються лише якщо у середовищі процесу відсутній ключ.
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
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

- Збігаються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте як `$${VAR}` для літерального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є адитивними: відкриті текстові значення й надалі працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- Шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- Шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (підтримує селектори у стилі AWS `secret#json_key`)
- id для `source: "exec"` не мають містити сегменти шляху, розділені скісними рисками, `.` або `..` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включені в runtime-розв’язання та покриття аудиту.

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
- Шляхи файлового та exec-провайдера завершуються з помилкою, коли перевірка Windows ACL недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` потребує абсолютного шляху `command` і використовує protocol payloads через stdin/stdout.
- За замовчуванням символьні посилання в шляхах команд відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи-симлінки з валідацією розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довіреного каталогу застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` за замовчуванням мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв’язуються під час активації у знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Фільтрація активної поверхні застосовується під час активації: нерозв’язані посилання на ввімкнених поверхнях спричиняють помилку запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

---

## Сховище автентифікації

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Профілі для окремих агентів зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Застарілі плоскі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є runtime-форматом; `openclaw doctor --fix` переписує їх у канонічні API-key профілі `provider:default` із резервною копією `.legacy-flat.*.bak`.
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні runtime-облікові дані надходять із розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються під час виявлення.
- Застарілі імпорти OAuth надходять із `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: базова затримка у годинах, коли профіль зазнає невдачі через справжні помилки
  білінгу або недостатнього кредиту (типово: `5`). Явний текст про білінг може
  все одно потрапити сюди навіть у відповідях `401`/`403`, але специфічні для провайдера
  зіставники тексту залишаються обмеженими провайдером, якому вони належать (наприклад, OpenRouter
  `Key limit exceeded`). Повторювані HTTP `402` повідомлення про вікно використання або
  ліміт витрат організації/робочого простору натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин затримки білінгу для кожного провайдера.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання затримки білінгу (типово: `24`).
- `authPermanentBackoffMinutes`: базова затримка у хвилинах для високодостовірних збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: обмеження у хвилинах для зростання затримки `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників затримки (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок перевантаження перед перемиканням на резервну модель (типово: `1`). Сюди потрапляють форми зайнятості провайдера, як-от `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок обмеження швидкості перед перемиканням на резервну модель (типово: `1`). Цей кошик обмеження швидкості включає текст у формі провайдера, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `consoleLevel` підвищується до `debug`, коли вказано `--verbose`.
- `maxFileBytes`: максимальний розмір активного файла журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 MB). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування за принципом найкращого зусилля для виводу в консоль, файлових журналів, записів журналу OTLP і збереженого тексту транскрипту сесії. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/транскриптів; поверхні безпеки UI/інструментів/діагностики все одно редагують секрети перед емісією.

---

## Діагностика

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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
- `flags`: масив рядків прапорців, що вмикають цільовий вивід журналів (підтримує шаблони на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку без прогресу в мс для класифікації довготривалих сесій обробки як `session.long_running`, `session.stalled` або `session.stuck`. Відповідь, інструмент, статус, блок і прогрес ACP скидають таймер; повторювана діагностика `session.stuck` відступає, доки стан не змінюється.
- `stuckSessionAbortMs`: поріг віку без прогресу в мс, після якого придатну застиглу активну роботу можна аварійно злити для відновлення. Якщо не задано, OpenClaw використовує безпечніше розширене вікно вбудованого запуску щонайменше 5 хвилин і 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: захоплює редагований знімок стабільності перед OOM, коли тиск пам’яті досягає `critical` (типово: `false`). Установіть `true`, щоб додати сканування/запис файла пакета стабільності, зберігаючи звичайні події тиску пам’яті.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. у [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові OTLP endpoint-и для окремих сигналів. Коли задані, вони перевизначають `otel.endpoint` лише для цього сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт трас, метрик або журналів.
- `otel.logsExporter`: приймач експорту журналів: `"otlp"` (типово), `"stdout"` для одного JSON-об’єкта на рядок stdout або `"both"`.
- `otel.sampleRate`: частота семплювання трас `0`-`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання телеметрії в мс.
- `otel.captureContent`: опціональне захоплення сирого вмісту для атрибутів спанів OTEL. Типово вимкнено. Boolean `true` захоплює несистемний вміст повідомлень/інструментів; об’єктна форма дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` і `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: змінна середовища для найновішої експериментальної форми спанів інференсу GenAI, включно з назвами спанів `{gen_ai.operation.name} {gen_ai.request.model}`, типом спана `CLIENT` і `gen_ai.provider.name` замість застарілого `gen_ai.system`. Типово спани зберігають `openclaw.model.call` і `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: змінна середовища для хостів, які вже зареєстрували глобальний OpenTelemetry SDK. Тоді OpenClaw пропускає запуск/завершення роботи SDK, що належить Plugin, зберігаючи активними діагностичні слухачі.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env vars endpoint-ів для окремих сигналів, що використовуються, коли відповідний ключ конфігурації не задано.
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

- `channel`: канал релізу для встановлень npm/git - `"stable"`, `"beta"` або `"dev"`.
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

- `enabled`: глобальний feature gate ACP (типово: `true`; установіть `false`, щоб приховати ACP dispatch і можливості spawn).
- `dispatch.enabled`: незалежний gate для dispatch ходу сесії ACP (типово: `true`). Установіть `false`, щоб залишити команди ACP доступними, але заблокувати виконання.
- `backend`: типовий id backend runtime ACP (має відповідати зареєстрованому Plugin runtime ACP).
  Спочатку встановіть Plugin backend, а якщо `plugins.allow` задано, включіть id Plugin backend (наприклад, `acpx`), інакше backend ACP не завантажиться.
- `defaultAgent`: резервний id цільового агента ACP, коли spawn-и не вказують явну ціль.
- `allowedAgents`: allowlist id агентів, дозволених для runtime-сесій ACP; порожній список означає відсутність додаткового обмеження.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно простою для flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед розділенням потокової проєкції блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів за хід (типово: `true`).
- `stream.deliveryMode`: `"live"` транслює інкрементально; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, спроєктованих на хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для спроєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів до boolean-перевизначень видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для worker-ів сесій ACP перед придатним очищенням.
- `runtime.installCommand`: необов’язкова команда встановлення, яку слід виконати під час bootstrap runtime-середовища ACP.

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

Метадані, які записують керовані потоки налаштування CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Ідентичність

Див. поля ідентичності `agents.list` у розділі [Типові значення агента](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застарілий, вилучений)

Поточні збірки більше не містять TCP-моста. Вузли підключаються через Gateway WebSocket. Ключі `bridge.*` більше не входять до схеми конфігурації (перевірка не пройде, доки їх не буде вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: скільки часу зберігати завершені ізольовані сесії запусків cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. Типово: `24h`; задайте `false`, щоб вимкнути.
- `runLog.maxBytes`: приймається для сумісності зі старішими файловими журналами запусків cron. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки історії запусків SQLite, що зберігаються для кожного завдання. Типово: `2000`.
- `webhookToken`: bearer-токен, що використовується для доставлення cron webhook POST (`delivery.mode = "webhook"`); якщо пропущено, заголовок автентифікації не надсилається.
- `webhook`: застаріла резервна URL-адреса Webhook (http/https), яку `openclaw doctor --fix` використовує для міграції збережених завдань, що все ще мають `notify: true`; виконання під час роботи використовує `delivery.mode="webhook"` для кожного завдання разом із `delivery.to` або `delivery.completionDestination` під час збереження доставлення оголошення.

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

- `maxAttempts`: максимальна кількість повторних спроб для завдань cron у разі тимчасових помилок (типово: `3`; діапазон: `0`-`10`).
- `backoffMs`: масив затримок backoff у мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1-10 записів).
- `retryOn`: типи помилок, що запускають повторні спроби - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати всі тимчасові типи.

Одноразові завдання залишаються ввімкненими, доки спроби повтору не буде вичерпано, а потім вимикаються зі збереженням фінального стану помилки. Повторювані завдання використовують ту саму політику повторів для тимчасових помилок, щоб запуститися знову після backoff перед наступним запланованим інтервалом; постійні помилки або вичерпані тимчасові повтори повертаються до звичайного повторюваного розкладу з backoff помилки.

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
- `after`: кількість послідовних збоїв перед спрацюванням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід'ємне ціле число).
- `includeSkipped`: зараховувати послідовно пропущені запуски до порогу сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на backoff помилок виконання.
- `mode`: режим доставлення - `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує в налаштований Webhook.
- `accountId`: необов'язковий ідентифікатор облікового запису або каналу для обмеження доставлення сповіщення.

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

- Типове місце призначення для сповіщень про збої cron у всіх завданнях.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли існує достатньо даних цілі.
- `channel`: перевизначення каналу для доставлення оголошення. `"last"` повторно використовує останній відомий канал доставлення.
- `to`: явна ціль оголошення або URL-адреса Webhook. Обов'язково для режиму webhook.
- `accountId`: необов'язкове перевизначення облікового запису для доставлення.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли не задано ні глобальне місце призначення збою, ні місце призначення збою для окремого завдання, завдання, які вже доставляються через `announce`, у разі збою повертаються до цієї основної цілі оголошення.
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
| `{{To}}`           | Ідентифікатор місця призначення                   |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                 |
| `{{SessionId}}`    | Поточний UUID сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (зображення/аудіо/документ/…)           |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Вирішений медіапромпт для записів CLI             |
| `{{MaxChars}}`     | Вирішена максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (за найкращої можливості)              |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (за найкращої можливості) |
| `{{SenderName}}`   | Відображуване ім'я відправника (за найкращої можливості) |
| `{{SenderE164}}`   | Номер телефону відправника (за найкращої можливості) |
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

- Один файл: замінює об'єкт, що його містить.
- Масив файлів: глибоко зливається за порядком (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: вирішуються відносно файлу, який виконує включення, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` файлу `openclaw.json`). Абсолютні форми/форми `../` дозволені лише тоді, коли вони все одно вирішуються всередині цієї межі. Шляхи не повинні містити нульових байтів і мають бути строго коротшими за 4096 символів до та після вирішення.
- Записи, якими володіє OpenClaw і які змінюють лише один розділ верхнього рівня, підкріплений включенням одного файлу, записуються в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, якими володіє OpenClaw; такі записи завершуються закритою відмовою замість сплющення конфігурації.
- Помилки: чіткі повідомлення для відсутніх файлів, помилок розбору, циклічних включень, недійсного формату шляху та надмірної довжини.

---

_Пов'язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов'язано

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
