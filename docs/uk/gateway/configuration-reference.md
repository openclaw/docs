---
read_when:
    - Вам потрібна точна семантика конфігурації або значення за замовчуванням на рівні полів
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник конфігурації
x-i18n:
    generated_at: "2026-07-02T08:45:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Довідник основної конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на задачі, див. у [Конфігурація](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і посилається назовні, коли підсистема має власний глибший довідник. Каталоги команд, що належать каналам і plugins, а також глибокі налаштування пам’яті/QMD розміщені на власних сторінках, а не на цій.

Джерело істини в коді:

- `openclaw config schema` друкує актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими bundled/plugin/channel, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми з прив’язкою до шляху для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації відносно поточної поверхні схеми

Шлях пошуку агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації на рівні полів і обмежень перед редагуванням. Використовуйте
[Конфігурація](/uk/gateway/configuration) для настанов, орієнтованих на задачі, а цю сторінку -
для ширшої карти полів, типових значень і посилань на довідники підсистем.

Окремі глибокі довідники:

- [Довідник конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash-команди](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки каналів/plugin-власників для специфічних для каналу поверхонь команд

Формат конфігурації - **JSON5** (коментарі + кінцеві коми дозволені). Усі поля необов’язкові - OpenClaw використовує безпечні типові значення, коли їх пропущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на окрему сторінку - див.
[Конфігурація - канали](/uk/gateway/config-channels) для `channels.*`,
включно зі Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та іншими
bundled каналами (автентифікація, контроль доступу, кілька облікових записів, gating згадок).

## Типові значення агента, multi-agent, сеанси та повідомлення

Перенесено на окрему сторінку - див.
[Конфігурація - агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, мислення, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (multi-agent маршрутизація та прив’язки)
- `session.*` (життєвий цикл сеансу, compaction, pruning)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.consultThinkingLevel`: перевизначення рівня мислення для повного запуску агента OpenClaw за realtime consults Control UI Talk
  - `talk.consultFastMode`: одноразове перевизначення fast-mode для realtime consults Control UI Talk
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: коли не задано, Talk зберігає типове для платформи вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: резервний relay Gateway для фіналізованих realtime транскриптів Talk, які пропускають `openclaw_agent_consult`

## Інструменти та користувацькі провайдери

Політику інструментів, експериментальні перемикачі, конфігурацію інструментів на базі провайдерів і налаштування користувацького
провайдера / base-URL перенесено на окрему сторінку - див.
[Конфігурація - інструменти та користувацькі провайдери](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, списки дозволених моделей і налаштування користувацьких провайдерів розміщені в
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
- `models.providers`: мапа користувацьких провайдерів, ключована за id провайдера.
- `models.providers.*.localService`: необов’язковий менеджер процесів on-demand для
  локальних серверів моделей. OpenClaw перевіряє налаштований endpoint здоров’я, запускає
  абсолютну `command`, коли потрібно, очікує готовності, а потім надсилає запит моделі.
  Див. [Локальні сервіси моделей](/uk/gateway/local-model-services).
- `models.pricing.enabled`: керує фоновою ініціалізацією pricing, яка
  запускається після того, як sidecars і канали досягають шляху готовності Gateway. Коли `false`,
  Gateway пропускає отримання pricing-каталогів OpenRouter і LiteLLM; налаштовані
  значення `models.providers.*.models[].cost` усе ще працюють для локальних оцінок вартості.

## MCP

Визначення MCP-серверів, керованих OpenClaw, розміщені в `mcp.servers` і
споживаються embedded OpenClaw та іншими runtime-адаптерами. Команди `openclaw mcp list`,
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

- `mcp.servers`: іменовані stdio або віддалені визначення MCP-серверів для runtimes, які
  надають налаштовані MCP-інструменти.
  Віддалені записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` є CLI-native псевдонімом, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.servers.<name>.enabled`: установіть `false`, щоб зберегти визначення сервера,
  але виключити його з embedded OpenClaw MCP discovery та проєкції інструментів.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: таймаут MCP-запиту для сервера
  в секундах або мілісекундах.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: таймаут підключення для сервера
  в секундах або мілісекундах.
- `mcp.servers.<name>.supportsParallelToolCalls`: необов’язкова підказка щодо конкурентності для
  адаптерів, які можуть вибирати, чи виконувати паралельні виклики MCP-інструментів.
- `mcp.servers.<name>.auth`: установіть `"oauth"` для HTTP MCP-серверів, які потребують
  OAuth. Виконайте `openclaw mcp login <name>`, щоб зберегти токени у стані OpenClaw.
- `mcp.servers.<name>.oauth`: необов’язкові перевизначення OAuth scope, redirect URL і client
  metadata URL.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: HTTP TLS controls
  для приватних endpoints і mutual TLS.
- `mcp.servers.<name>.toolFilter`: необов’язковий вибір інструментів для сервера. `include`
  обмежує виявлені MCP-інструменти відповідними назвами; `exclude` приховує відповідні
  назви. Записи є точними назвами MCP-інструментів або простими glob-шаблонами `*`. Сервери з
  ресурсами або prompts також генерують назви utility-інструментів (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), і ці назви використовують той самий
  фільтр.
- `mcp.servers.<name>.codex`: необов’язкові controls проєкції Codex app-server.
  Цей блок є метаданими OpenClaw лише для потоків Codex app-server; він не
  впливає на ACP sessions, загальну конфігурацію Codex harness або інші runtime-адаптери.
  Непорожній `codex.agents` обмежує сервер переліченими id агентів OpenClaw.
  Порожні, blank або недійсні scoped списки агентів відхиляються валідацією конфігурації
  й опускаються шляхом runtime-проєкції замість того, щоб ставати глобальними.
  `codex.defaultToolsApprovalMode` випускає native для Codex
  `default_tools_approval_mode` для цього сервера. OpenClaw вилучає блок `codex`
  перед передаванням native конфігурації `mcp_servers` до Codex. Опустіть блок, щоб
  сервер проєктувався для кожного агента Codex app-server з типовою для Codex
  поведінкою MCP approval.
- `mcp.sessionIdleTtlMs`: idle TTL для session-scoped bundled MCP runtimes.
  Одноразові embedded runs запитують cleanup наприкінці run; цей TTL є резервним механізмом для
  довготривалих sessions і майбутніх callers.
- Зміни в `mcp.*` застосовуються гаряче шляхом disposing cached session MCP runtimes.
  Наступне discovery/use інструментів створює їх заново з нової конфігурації, тому видалені
  записи `mcp.servers` прибираються негайно, а не очікують idle TTL.
- Runtime discovery також враховує сповіщення про зміну списку MCP-інструментів, скидаючи
  cached catalog для цього session. Сервери, що оголошують ресурси або
  prompts, отримують utility tools для listing/reading resources і listing/fetching
  prompts. Повторні помилки tool-call ненадовго призупиняють відповідний сервер перед
  наступною спробою виклику.

Див. [MCP](/uk/cli/mcp#openclaw-as-an-mcp-client-registry) і
[CLI backends](/uk/gateway/cli-backends#bundle-mcp-overlays) щодо runtime-поведінки.

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

- `allowBundled`: необов’язковий allowlist лише для bundled skills (managed/workspace skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені skill (найнижчий пріоритет).
- `load.allowSymlinkTargets`: довірені реальні цільові корені, у які можуть
  resolve symlinks skill, коли посилання розміщене поза налаштованим коренем джерела.
- `workshop.allowSymlinkTargetWrites`: дозволяє Skill Workshop apply записувати
  через уже довірені symlink targets (типово: false).
- `install.preferBrew`: коли true, надавати перевагу інсталяторам Homebrew, коли `brew`
  доступний, перед fallback до інших типів інсталяторів.
- `install.nodeManager`: перевага node installer для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: дозволяє довіреним клієнтам Gateway `operator.admin`
  встановлювати приватні zip-архіви, staged через `skills.upload.*`
  (типово: false). Це вмикає лише шлях uploaded-archive; звичайні встановлення ClawHub
  цього не потребують.
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручність для skills, що оголошують основну env var (plaintext string або об’єкт SecretRef).

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

- Завантажується з директорій пакетів або bundle під `~/.openclaw/extensions` і `<workspace>/.openclaw/extensions`, а також із файлів або директорій, указаних у `plugins.load.paths`.
- Розміщуйте окремі файли плагінів у `plugins.load.paths`; автоматично виявлені корені розширень ігнорують файли `.js`, `.mjs` і `.ts` верхнього рівня, щоб допоміжні скрипти в цих коренях не блокували запуск.
- Виявлення приймає нативні плагіни OpenClaw, а також сумісні пакети Codex і Claude, зокрема пакети Claude зі стандартною структурою без маніфеста.
- **Зміни конфігурації потребують перезапуску Gateway.**
- `allow`: необов'язковий allowlist (завантажуються лише перелічені плагіни). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: службове поле API-ключа на рівні плагіна (коли підтримується плагіном).
- `plugins.entries.<id>.env`: мапа змінних середовища в області плагіна.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` та ігнорує поля, що змінюють prompt, зі старого `before_agent_start`, водночас зберігаючи старі `modelOverride` і `providerOverride`. Застосовується до нативних хуків плагінів і підтримуваних директорій хуків, наданих пакетами.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені непакетовані плагіни можуть читати сирий вміст розмови з типізованих хуків, як-от `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довірити цьому плагіну запитувати перевизначення `provider` і `model` для кожного запуску фонових subagent-запусків.
- `plugins.entries.<id>.subagent.allowedModels`: необов'язковий allowlist канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowModelOverride`: явно довірити цьому плагіну запитувати перевизначення моделі для `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: необов'язковий allowlist канонічних цілей `provider/model` для довірених перевизначень завершення LLM плагіна. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: явно довірити цьому плагіну запускати `api.runtime.llm.complete` для agent id, відмінного від стандартного.
- `plugins.entries.<id>.config`: визначений плагіном об'єкт конфігурації (перевіряється схемою нативного плагіна OpenClaw, коли вона доступна).
- Налаштування облікового запису/середовища виконання канального плагіна розміщуються під `channels.<id>` і мають описуватися метаданими `channelConfigs` у маніфесті плагіна-власника, а не центральним реєстром опцій OpenClaw.

### Конфігурація плагіна Codex harness

Вбудований плагін `codex` володіє нативними налаштуваннями Codex app-server harness під
`plugins.entries.codex.config`. Див.
[довідник Codex harness](/uk/plugins/codex-harness-reference) для повної поверхні конфігурації
та [Codex harness](/uk/plugins/codex-harness) для моделі середовища виконання.

`codexPlugins` застосовується лише до сесій, які вибирають нативний Codex harness.
Він не вмикає плагіни Codex для запусків провайдера OpenClaw, прив'язок розмов ACP
або будь-якого harness, що не є Codex.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: вмикає нативну
  підтримку плагінів/застосунків Codex для Codex harness. Типове значення: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  типова політика деструктивних дій для перенесених elicitation застосунків плагіна.
  Використовуйте `true`, щоб приймати безпечні схеми схвалення Codex без запиту, `false`,
  щоб відхиляти їх, `"auto"`, щоб маршрутизувати потрібні Codex схвалення через схвалення
  плагінів OpenClaw, або `"ask"`, щоб запитувати кожну дію запису/деструктивну дію плагіна
  без тривалого схвалення. Режим `"ask"` очищає тривалі перевизначення схвалень Codex
  для кожного інструмента в ураженому застосунку та вибирає рецензента людських
  схвалень для цього застосунку до запуску потоку Codex.
  Типове значення: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: вмикає
  перенесений запис плагіна, коли глобальний `codexPlugins.enabled` також має значення true.
  Типове значення: `true` для явних записів.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  стабільна ідентичність marketplace. V1 підтримує лише `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: стабільна
  ідентичність плагіна Codex з міграції, наприклад `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  перевизначення деструктивних дій для окремого плагіна. Якщо пропущено, використовується
  глобальне значення `allow_destructive_actions`. Значення для окремого плагіна приймає
  ті самі політики `true`, `false`, `"auto"` або `"ask"`.

Кожен допущений застосунок плагіна, який використовує `"ask"`, маршрутизує запити
схвалення цього застосунку до людського рецензента. Інші застосунки та схвалення потоку,
що не належать до застосунків, зберігають налаштованого рецензента, тому змішані політики
плагінів не успадковують поведінку `"ask"`.

`codexPlugins.enabled` є глобальною директивою ввімкнення. Явні записи плагінів,
записані міграцією, є тривалим набором придатності до встановлення й ремонту.
`plugins["*"]` не підтримується, перемикача `install` немає, а локальні значення
`marketplacePath` навмисно не є полями конфігурації, бо вони залежать від хоста.

Перевірки готовності `app/list` кешуються на одну годину та оновлюються
асинхронно, коли застарівають. Конфігурація застосунків потоку Codex обчислюється
під час встановлення сесії Codex harness, а не на кожному ході; використовуйте `/new`,
`/reset` або перезапуск Gateway після зміни нативної конфігурації плагінів.

- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера веботримання Firecrawl.
  - `apiKey`: необов'язковий API-ключ Firecrawl для вищих лімітів (приймає SecretRef). Повертається до `plugins.entries.firecrawl.config.webSearch.apiKey`, старого `tools.web.fetch.firecrawl.apiKey` або змінної середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базова URL-адреса API Firecrawl (типово: `https://api.firecrawl.dev`; перевизначення для self-hosted мають вказувати на приватні/внутрішні endpoints).
  - `onlyMainContent`: витягувати лише основний вміст зі сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: час очікування scrape-запиту в секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: cadence Cron для кожного повного sweep dreaming (`"0 3 * * *"` типово).
  - `model`: необов'язкове перевизначення моделі subagent Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз із типовою моделлю сесії; збої довіри або allowlist не мають тихого fallback.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам'яті розміщена в [довіднику конфігурації пам'яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені плагіни пакетів Claude також можуть надавати вбудовані типові значення OpenClaw із `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як сирі patches конфігурації OpenClaw.
- `plugins.slots.memory`: виберіть id активного плагіна пам'яті або `"none"`, щоб вимкнути плагіни пам'яті.
- `plugins.slots.contextEngine`: виберіть id активного плагіна рушія контексту; типово `"legacy"`, якщо ви не встановите й не виберете інший рушій.

Див. [Плагіни](/uk/tools/plugin).

---

## Зобов'язання

`commitments` керує виведеною подальшою пам'яттю: OpenClaw може виявляти check-ins із ходів розмови та доставляти їх через Heartbeat-запуски.

- `commitments.enabled`: увімкнути приховане LLM-витягання, зберігання та Heartbeat-доставку для виведених подальших зобов'язань. Типове значення: `false`.
- `commitments.maxPerDay`: максимальна кількість виведених подальших зобов'язань, доставлених за сесію агента протягом rolling day. Типове значення: `3`.

Див. [Виведені зобов'язання](/uk/concepts/commitments).

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
- `tabCleanup` повертає відстежувані вкладки основного агента після простою або коли
  сесія перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, коли значення не задано, тому навігація браузера за замовчуванням залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте браузерній навігації приватною мережею.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і надалі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі доступні лише для приєднання (запуск/зупинка/скидання вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL WebSocket DevTools.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до доступності віддаленого та
  `attachOnly` CDP, а також до запитів відкриття вкладок. Керовані профілі loopback
  зберігають локальні типові значення CDP.
- Якщо зовнішньо керована служба CDP доступна через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw сприйматиме порт loopback як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть приєднуватися на
  вибраному хості або через підключений браузерний вузол.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на певний
  профіль браузера на основі Chromium, як-от Brave або Edge.
- Профілі `existing-session` можуть задавати `cdpUrl`, коли Chrome уже запущено
  за кінцевою точкою HTTP(S)-виявлення DevTools або прямою кінцевою точкою WS(S). У цьому
  режимі OpenClaw передає кінцеву точку до Chrome MCP замість використання автопідключення;
  `userDataDir` ігнорується для аргументів запуску Chrome MCP.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі знімків/ref замість націлювання CSS-селекторами, хуки завантаження
  одного файлу, без перевизначень тайм-ауту діалогів, без `wait --load networkidle` і без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; задавайте
  `cdpUrl` явно лише для віддалених профілів CDP або приєднання до кінцевої точки existing-session.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності websocket CDP після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  успішно запускається, але перевірки готовності випереджають старт. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: браузер за замовчуванням, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для окремого профілю в профілях `existing-session` також розгортається з тильдою.
- Служба керування: лише loopback (порт виводиться з `gateway.port`, типово `18791`).
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
- `assistant`: перевизначення ідентичності Control UI. За замовчуванням використовує ідентичність активного агента.

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

<Accordion title="Gateway field details">

- `mode`: `local` (запустити gateway) або `remote` (підключитися до віддаленого gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: один мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає на `127.0.0.1` усередині контейнера. З мережевим мостом Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому gateway недоступний. Використайте `--network host` або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: типово обов’язкова. Bind не через loopback потребує автентифікації gateway. На практиці це означає спільний токен/пароль або зворотний проксі з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер початкового налаштування типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема SecretRefs), явно задайте `gateway.auth.mode` як `token` або `password`. Запуск і потоки встановлення/ремонту сервісу завершуються помилкою, коли обидва налаштовані, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; навмисно не пропонується в підказках початкового налаштування.
- `gateway.auth.mode: "trusted-proxy"`: делегує автентифікацію браузера/користувача зворотному проксі з урахуванням ідентичності та довіряє заголовкам ідентичності від `gateway.trustedProxies` (див. [Автентифікація довіреного проксі](/uk/gateway/trusted-proxy-auth)). Цей режим типово очікує джерело проксі **не через loopback**; зворотні проксі loopback на тому самому хості потребують явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні викликачі з того самого хоста можуть використовувати `gateway.auth.password` як локальний прямий запасний варіант; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольнити автентифікацію Control UI/WebSocket (перевірено через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію заголовком Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації gateway. Цей потік без токена припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалої автентифікації. Застосовується для IP клієнта й області автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні невдалі спроби від того самого клієнта можуть спрацювати на обмежувачі вже на другому запиті, замість того щоб обидві пройти як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово `true`; задайте `false`, коли навмисно хочете також обмежувати трафік localhost (для тестових налаштувань або суворих розгортань проксі).
- Спроби WS-автентифікації з браузерного origin завжди обмежуються з вимкненим винятком loopback (багаторівневий захист від браузерного перебору localhost).
- На loopback такі блокування браузерного origin ізольовані за нормалізованим значенням `Origin`, тому повторні невдачі з одного localhost origin не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind loopback) або `funnel` (публічний, потребує автентифікації).
- `tailscale.serviceName`: необов’язкова назва сервісу Tailscale для режиму Serve, наприклад `svc:openclaw`. Коли задано, OpenClaw передає її в `tailscale serve --service`, щоб Control UI можна було відкрити через іменований Service замість імені хоста пристрою. Значення має використовувати формат назви Service Tailscale `svc:<dns-label>`; запуск повідомляє похідний URL Service.
- `tailscale.preserveFunnel`: коли `true` і `tailscale.mode = "serve"`, OpenClaw перевіряє `tailscale funnel status` перед повторним застосуванням Serve під час запуску та пропускає його, якщо зовнішньо налаштований маршрут Funnel уже покриває порт gateway. Типово `false`.
- `controlUi.allowedOrigins`: явний allowlist браузерних origin для підключень Gateway WebSocket. Обов’язковий для публічних браузерних origin не через loopback. Приватні завантаження same-origin LAN/Tailnet UI з loopback, RFC1918/link-local, `.local`, `.ts.net` або хостів Tailscale CGNAT приймаються без увімкнення запасного варіанта Host-header.
- `controlUi.chatMessageMaxWidth`: необов’язкова максимальна ширина для згрупованих повідомлень чату Control UI. Приймає обмежені значення ширини CSS, як-от `960px`, `82%`, `min(1280px, 82%)` і `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який увімкнює запасний варіант origin через Host-header для розгортань, що навмисно покладаються на політику origin із Host-header.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `wss://` для публічних хостів; відкритий текст `ws://` приймається лише для loopback, LAN, link-local, `.local`, `.ts.net` і хостів Tailscale CGNAT.
- `remote.remotePort`: порт gateway на віддаленому SSH-хості. Типово `18789`; використовуйте це, коли локальний порт тунелю відрізняється від віддаленого порту gateway.
- `gateway.remote.token` / `.password` — поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують автентифікацію gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL для зовнішнього ретранслятора APNs, що використовується після того, як збірки iOS з підтримкою ретранслятора публікують реєстрації в gateway. Публічні збірки App Store використовують розміщений ретранслятор OpenClaw. Користувацькі URL ретранслятора мають відповідати навмисно окремому шляху збірки/розгортання iOS, де URL ретранслятора вказує на цей ретранслятор.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від gateway до ретранслятора в мілісекундах. Типово `10000`.
- Реєстрації з підтримкою ретранслятора делегуються конкретній ідентичності gateway. Зв’язаний застосунок iOS отримує `gateway.identity.get`, додає цю ідентичність до реєстрації ретранслятора та пересилає gateway дозвіл на надсилання в межах реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові перевизначення env для наведеної вище конфігурації ретранслятора.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: лише для розробки, аварійний вихід для HTTP URL ретранслятора loopback. Виробничі URL ретранслятора мають залишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: тайм-аут handshake Gateway WebSocket до автентифікації в мілісекундах. Типово: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли задано. Збільште це значення на завантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки прогрів запуску ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал монітора справності каналу в хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски монітора справності. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого socket у хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітора справності для каналу/облікового запису за ковзну годину. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: поканальна відмова від перезапусків монітора справності зі збереженням увімкненого глобального монітора.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для облікового запису в багатооблікових каналах. Коли задано, має пріоритет над перевизначенням рівня каналу.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як запасний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується закритою помилкою (без маскування віддаленим запасним варіантом).
- `trustedProxies`: IP зворотних проксі, які завершують TLS або вставляють заголовки forwarded-client. Вказуйте лише проксі, які контролюєте. Записи loopback усе ще чинні для налаштувань проксі/локального виявлення на тому самому хості (наприклад Tailscale Serve або локальний зворотний проксі), але вони **не** роблять запити loopback придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для поведінки fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий allowlist CIDR/IP для автоматичного схвалення першого pairing пристрою вузла без запитаних областей. Вимкнено, коли не задано. Це не схвалює автоматично pairing оператора/браузера/Control UI/WebChat і не схвалює автоматично оновлення ролі, області, метаданих або публічного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд вузла після pairing та оцінки allowlist платформи. Використовуйте `allowCommands`, щоб дозволити небезпечні команди вузла, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо типовий параметр платформи або явний allow інакше включив би її. Після того як вузол змінює свій оголошений список команд, відхиліть і повторно схваліть pairing цього пристрою, щоб gateway зберіг оновлений знімок команд.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий список deny).
- `gateway.tools.allow`: вилучає назви інструментів із типового списку HTTP deny для викликачів owner/admin. Це не підвищує викликачів із ідентичністю `operator.write` до доступу owner/admin; `cron`, `gateway` і `nodes` залишаються недоступними для викликачів не-owner, навіть коли вони в allowlist.

</Accordion>

### OpenAI-сумісні кінцеві точки

- Admin HTTP RPC: типово вимкнено як Plugin `admin-http-rpc`. Увімкніть Plugin, щоб зареєструвати `POST /api/v1/admin/rpc`. Див. [Admin HTTP RPC](/uk/plugins/admin-http-rpc).
- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-вводу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlist обробляються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS origin, які контролюєте; див. [Автентифікація довіреного проксі](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запустіть кілька gateway на одному хості з унікальними портами й каталогами стану:

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
- `autoGenerate`: автоматично генерує локальну самопідписану пару сертифікат/ключ, коли явні файли не налаштовано; лише для локального використання/розробки.
- `certPath`: шлях файлової системи до файлу сертифіката TLS.
- `keyPath`: шлях файлової системи до файлу приватного ключа TLS; обмежте дозволи.
- `caPath`: необов’язковий шлях до пакета CA для перевірки клієнта або користувацьких ланцюжків довіри.

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
  - `"hot"`: застосовувати зміни всередині процесу без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати гаряче перезавантаження; за потреби перейти до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс для очікування поточних операцій перед примусовим перезапуском або гарячим перезавантаженням каналу. Опустіть, щоб використати типове обмежене очікування (`300000`); задайте `0`, щоб очікувати безстроково й періодично записувати попередження про операції, які все ще очікують.

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
- `hooks.token` має відрізнятися від активної автентифікації Gateway через спільний секрет (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); під час запуску реєструється некритичне попередження безпеки, якщо виявлено повторне використання.
- `openclaw security audit` позначає повторне використання автентифікації hook/Gateway як критичну знахідку, зокрема автентифікацію Gateway паролем, надану лише під час аудиту (`--auth password --password <password>`). Запустіть `openclaw doctor --fix`, щоб ротувати збережений повторно використаний `hooks.token`, а потім оновіть зовнішні відправники хуків, щоб вони використовували новий токен hook.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping не потребують цієї явної згоди.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з payload запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` у mapping, відрендерені з шаблону, вважаються наданими ззовні й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` зіставляє підшлях після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з payload.
- `transform` може вказувати на модуль JS/TS, який повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та вихід за межі відхиляються).
  - Тримайте `hooks.transformsDir` під `~/.openclaw/hooks/transforms`; каталоги workspace Skills відхиляються. Якщо `openclaw doctor` повідомляє, що цей шлях недійсний, перемістіть модуль transform до каталогу transforms для хуків або видаліть `hooks.transformsDir`.
- `agentId` маршрутизує до конкретного агента; невідомі ID повертаються до типового агента.
- `allowedAgentIds`: обмежує ефективну маршрутизацію агентів, зокрема шлях типового агента, коли `agentId` опущено (`*` або опущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків агента hook без явного `sessionKey`.
- `allowRequestSessionKey`: дозволити викликачам `/hooks/agent` і ключам сесій mapping на основі шаблонів задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий allowlist префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-який mapping або preset використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово дорівнює `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволено, якщо каталог моделей задано).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви залишаєте цю маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібно `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість типового шаблонного значення.

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

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, якщо це налаштовано. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
- Не запускайте окремий `gog gmail watch serve` поруч із Gateway.

---

## Хост Canvas Plugin

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
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Прив’язки не до loopback: маршрути canvas потребують автентифікації Gateway (token/password/trusted-proxy), як і інші HTTP-поверхні Gateway.
- WebViews Node зазвичай не надсилають заголовки автентифікації; після спарювання та підключення вузла Gateway оголошує URL можливостей, обмежені вузлом, для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії вузла й швидко спливають. Запасний варіант на основі IP не використовується.
- Вставляє клієнт live-reload в обслуговуваний HTML.
- Автоматично створює початковий `index.html`, коли каталог порожній.
- Також обслуговує A2UI за `/__openclaw__/a2ui/`.
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

- `minimal` (типово, коли ввімкнено вбудований Plugin `bonjour`): опускати `cliPath` + `sshPort` із TXT-записів.
- `full`: включати `cliPath` + `sshPort`; multicast-реклама в LAN усе одно потребує ввімкненого вбудованого Plugin `bonjour`.
- `off`: приглушити multicast-рекламу в LAN без зміни ввімкнення Plugin.
- Вбудований Plugin `bonjour` автоматично запускається на хостах macOS і вмикається за явною згодою на Linux, Windows та контейнеризованих розгортаннях Gateway.
- Ім’я хоста типово дорівнює системному імені хоста, коли воно є дійсною DNS-міткою, інакше використовується `openclaw`. Перевизначте за допомогою `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує унікастну зону DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднайте із DNS-сервером (рекомендовано CoreDNS) + розділеним DNS Tailscale.

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
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
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
- Екрануйте як `$${VAR}`, щоб отримати буквальне `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є додатковими: значення у відкритому тексті й надалі працюють.

### `SecretRef`

Використовуйте одну форму об'єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- Шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- Шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (підтримує селектори у стилі AWS `secret#json_key`)
- id для `source: "exec"` не повинні містити розділені скісною рискою сегменти шляху `.` або `..` (наприклад, `a/../b` буде відхилено)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включено до розв'язання під час виконання та покриття аудиту.

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
- Шляхи постачальників file і exec завершуються закрито, коли перевірка Windows ACL недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Постачальник `exec` вимагає абсолютний шлях `command` і використовує протокольні payloads через stdin/stdout.
- За замовчуванням шляхи команд через symlink відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи symlink, водночас перевіряючи розв'язаний цільовий шлях.
- Якщо налаштовано `trustedDirs`, перевірка довіреного каталогу застосовується до розв'язаного цільового шляху.
- Дочірнє середовище `exec` за замовчуванням мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв'язуються під час активації в знімок у пам'яті, після чого шляхи запитів читають лише цей знімок.
- Під час активації застосовується фільтрація активних поверхонь: нерозв'язані посилання на ввімкнених поверхнях спричиняють збій запуску/перезавантаження, а неактивні поверхні пропускаються з діагностикою.

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
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-профілю на основі SecretRef.
- Статичні runtime-облікові дані надходять із розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються після виявлення.
- Застарілі імпорти OAuth з `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: базова затримка в годинах, коли профіль зазнає збою через справжні
  помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг
  усе ще може потрапити сюди навіть у відповідях `401`/`403`, але текстові
  зіставники, специфічні для провайдера, залишаються обмеженими провайдером, якому вони належать (наприклад, OpenRouter
  `Key limit exceeded`). Повторювані HTTP `402` повідомлення про вікно використання або
  ліміт витрат організації/робочого простору натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин затримки білінгу для кожного провайдера.
- `billingMaxHours`: верхня межа в годинах для експоненційного зростання затримки білінгу (типово: `24`).
- `authPermanentBackoffMinutes`: базова затримка в хвилинах для високодостовірних збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: верхня межа в хвилинах для зростання затримки `auth_permanent` (типово: `60`).
- `failureWindowHours`: рухоме вікно в годинах, що використовується для лічильників затримок (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілю того самого провайдера для помилок перевантаження перед переходом до резервної моделі (типово: `1`). Сюди потрапляють форми зайнятості провайдера, як-от `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілю того самого провайдера для помилок ліміту частоти перед переходом до резервної моделі (типово: `1`). Цей кошик ліміту частоти включає текст у форматі провайдера, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `consoleLevel` підвищується до `debug`, коли використано `--verbose`.
- `maxFileBytes`: максимальний розмір активного файлу журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 МБ). OpenClaw зберігає до п’яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування за принципом найкращого зусилля для консольного виводу, файлових журналів, записів журналу OTLP і збереженого тексту транскрипту сесії. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/транскриптів; UI/інструменти/діагностичні поверхні безпеки все одно редагують секрети перед виведенням.

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
- `stuckSessionWarnMs`: поріг віку без прогресу в мс для класифікації довготривалих сесій обробки як `session.long_running`, `session.stalled` або `session.stuck`. Відповідь, інструмент, статус, блок і прогрес ACP скидають таймер; повторювана діагностика `session.stuck` зменшує частоту, доки стан не змінюється.
- `stuckSessionAbortMs`: поріг віку без прогресу в мс, після якого придатну завислу активну роботу можна аварійно злити для відновлення. Якщо не встановлено, OpenClaw використовує безпечніше розширене вікно вбудованого запуску щонайменше 5 хвилин і 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: захоплює відредагований знімок стабільності перед OOM, коли тиск пам’яті досягає `critical` (типово: `false`). Установіть `true`, щоб додати сканування/запис файлу пакета стабільності, зберігаючи звичайні події тиску пам’яті.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. в [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові OTLP endpoints для конкретних сигналів. Якщо встановлено, вони перевизначають `otel.endpoint` лише для відповідного сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: вмикає експорт трас, метрик або журналів.
- `otel.logsExporter`: приймач експорту журналів: `"otlp"` (типово), `"stdout"` для одного JSON-об’єкта на рядок stdout або `"both"`.
- `otel.sampleRate`: частота семплювання трас `0`-`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання телеметрії в мс.
- `otel.captureContent`: opt-in захоплення сирого вмісту для атрибутів span OTEL. Типово вимкнено. Boolean `true` захоплює несистемний вміст повідомлень/інструментів; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` і `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: перемикач середовища для найновішої експериментальної форми span inference GenAI, включно з іменами span `{gen_ai.operation.name} {gen_ai.request.model}`, видом span `CLIENT` і `gen_ai.provider.name` замість застарілого `gen_ai.system`. Типово spans зберігають `openclaw.model.call` і `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: перемикач середовища для хостів, які вже зареєстрували глобальний OpenTelemetry SDK. Тоді OpenClaw пропускає запуск/завершення SDK, що належить plugin, зберігаючи діагностичні слухачі активними.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env vars endpoint для конкретних сигналів, що використовуються, коли відповідний ключ конфігурації не встановлено.
- `cacheTrace.enabled`: журналювати знімки трасування кешу для вбудованих запусків (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для cache trace JSONL (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
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

- `channel`: канал релізів для npm/git інсталяцій - `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для пакетних інсталяцій (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням stable-channel (типово: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання stable-channel у годинах (типово: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки beta-channel у годинах (типово: `1`; максимум: `24`).

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

- `enabled`: глобальний перемикач функції ACP (типово: `true`; установіть `false`, щоб приховати dispatch ACP і можливості spawn).
- `dispatch.enabled`: незалежний перемикач для dispatch ходу сесії ACP (типово: `true`). Установіть `false`, щоб зберегти команди ACP доступними, але заблокувати виконання.
- `backend`: типовий id runtime backend ACP (має відповідати зареєстрованому runtime plugin ACP).
  Спершу встановіть backend plugin, і якщо `plugins.allow` встановлено, включіть id backend plugin (наприклад `acpx`), інакше backend ACP не завантажиться.
- `defaultAgent`: резервний id цільового агента ACP, коли spawns не вказують явну ціль.
- `allowedAgents`: allowlist id агентів, дозволених для runtime-сесій ACP; порожній список означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед розділенням проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів у межах ходу (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потоком інкрементально; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу assistant, що проєктується на хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для спроєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів до boolean-перевизначень видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для workers сесій ACP перед придатним очищенням.
- `runtime.installCommand`: необов’язкова команда встановлення для запуску під час bootstrap runtime-середовища ACP.

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
  - `"random"` (типово): ротаційні жартівливі/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), задайте env `OPENCLAW_HIDE_BANNER=1`.

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
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Ідентичність

Див. поля ідентичності `agents.list` у [типових значеннях агента](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застарілий, вилучено)

Поточні збірки більше не містять TCP-міст. Node-и підключаються через Gateway WebSocket. Ключі `bridge.*` більше не є частиною схеми конфігурації (валідація завершується помилкою, доки їх не буде вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

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

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запусків cron перед вилученням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. Типово: `24h`; задайте `false`, щоб вимкнути.
- `runLog.maxBytes`: приймається для сумісності зі старішими файловими журналами запусків cron. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки історії запусків SQLite, що зберігаються для кожного завдання. Типово: `2000`.
- `webhookToken`: bearer-токен, який використовується для доставки cron webhook POST (`delivery.mode = "webhook"`); якщо пропущено, заголовок автентифікації не надсилається.
- `webhook`: застарілий резервний URL webhook (http/https), який `openclaw doctor --fix` використовує для міграції збережених завдань, що досі мають `notify: true`; доставка під час виконання використовує `delivery.mode="webhook"` для кожного завдання разом із `delivery.to` або `delivery.completionDestination` під час збереження доставки оголошень.

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

Одноразові завдання залишаються ввімкненими, доки не буде вичерпано повторні спроби, а потім вимикаються зі збереженням фінального стану помилки. Повторювані завдання використовують ту саму політику повторних спроб для тимчасових помилок, щоб запуститися знову після backoff перед наступним запланованим слотом; постійні помилки або вичерпані повторні спроби для тимчасових помилок повертаються до звичайного повторюваного розкладу з backoff для помилок.

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
- `after`: кількість послідовних збоїв перед надсиланням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `includeSkipped`: враховувати послідовні пропущені запуски в поріг сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на backoff помилок виконання.
- `mode`: режим доставки - `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує в налаштований webhook.
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

- Типове місце призначення для сповіщень про збої cron у всіх завданнях.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо цільових даних.
- `channel`: перевизначення каналу для доставки оголошень. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль оголошення або URL webhook. Обов’язково для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли не задано ні глобальне, ні окреме для завдання місце призначення збоїв, завдання, які вже доставляються через `announce`, у разі збою повертаються до цієї основної цілі оголошення.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не є `"webhook"`.

Див. [Завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблонів моделі медіа

Плейсхолдери шаблонів, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повне тіло вхідного повідомлення                  |
| `{{RawBody}}`      | Необроблене тіло (без обгорток історії/відправника) |
| `{{BodyStripped}}` | Тіло з вилученими згадками групи                  |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор місця призначення                   |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                 |
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях медіа                              |
| `{{MediaType}}`    | Тип медіа (зображення/аудіо/документ/…)           |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Розв’язаний медіа-промпт для записів CLI          |
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
- Масив файлів: глибоко зливається за порядком (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: розв’язуються відносно файла, що включає, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми/форми з `../` дозволені лише тоді, коли вони все одно розв’язуються всередині цієї межі. Шляхи не мають містити null-байти й мають бути строго коротшими за 4096 символів до та після розв’язання.
- Записи, що належать OpenClaw і змінюють лише один розділ верхнього рівня, підтриманий однофайловим включенням, записують зміни в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, що належать OpenClaw; такі записи завершуються закритою помилкою замість вирівнювання конфігурації.
- Помилки: чіткі повідомлення для відсутніх файлів, помилок розбору, циклічних включень, некоректного формату шляху та надмірної довжини.

---

_Пов’язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
