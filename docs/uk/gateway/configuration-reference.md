---
read_when:
    - Вам потрібні точні семантики конфігурації на рівні полів або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, стандартних значень і посилань на спеціалізовані довідники підсистем
title: Довідник конфігурації
x-i18n:
    generated_at: "2026-07-03T23:42:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Довідник основної конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Конфігурація](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і містить посилання на окремі докладні довідники підсистем. Каталоги команд, що належать каналам і плагінам, а також глибокі параметри пам’яті/QMD розміщені на власних сторінках, а не на цій.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими bundled/plugin/channel, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми, обмежений шляхом, для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації проти поточної поверхні схеми

Шлях пошуку агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації на рівні полів і обмежень перед редагуванням. Використовуйте
[Конфігурація](/uk/gateway/configuration) для настанов, орієнтованих на завдання, а цю сторінку
для ширшої карти полів, типових значень і посилань на довідники підсистем.

Окремі докладні довідники:

- [Довідник конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash-команди](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки власників каналів/плагінів для поверхонь команд, специфічних для каналів

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов’язкові - OpenClaw використовує безпечні типові значення, коли їх пропущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на окрему сторінку - див.
[Конфігурація - канали](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, gating згадок).

## Типові значення агента, multi-agent, сесії та повідомлення

Перенесено на окрему сторінку - див.
[Конфігурація - агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, thinking, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (multi-agent маршрутизація та прив’язки)
- `session.*` (життєвий цикл сесії, compaction, pruning)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.consultThinkingLevel`: перевизначення рівня thinking для повного запуску агента OpenClaw за realtime-консультаціями Control UI Talk
  - `talk.consultFastMode`: одноразове перевизначення швидкого режиму для realtime-консультацій Control UI Talk
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: коли не задано, Talk зберігає типове вікно паузи платформи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: резервний relay Gateway для фіналізованих realtime-транскриптів Talk, які пропускають `openclaw_agent_consult`

## Інструменти та користувацькі провайдери

Політики інструментів, експериментальні перемикачі, конфігурацію інструментів на базі провайдерів і налаштування
користувацьких провайдерів / base-URL перенесено на окрему сторінку - див.
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
- `models.providers`: мапа користувацьких провайдерів, ключована за ідентифікатором провайдера.
- `models.providers.*.localService`: необов’язковий менеджер процесів на вимогу для
  локальних серверів моделей. OpenClaw перевіряє налаштований endpoint здоров’я, запускає
  абсолютну `command`, коли потрібно, очікує готовності, а потім надсилає запит
  моделі. Див. [Локальні сервіси моделей](/uk/gateway/local-model-services).
- `models.pricing.enabled`: керує фоновим початковим завантаженням цін, яке
  стартує після того, як sidecars і канали досягають ready-шляху Gateway. Коли `false`,
  Gateway пропускає отримання каталогів цін OpenRouter і LiteLLM; налаштовані
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

- `mcp.servers`: іменовані stdio або віддалені визначення MCP-серверів для runtime, які
  надають налаштовані MCP-інструменти.
  Віддалені записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` — це CLI-native alias, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.servers.<name>.enabled`: задайте `false`, щоб зберегти визначення сервера,
  виключивши його з discovery MCP у вбудованому OpenClaw і проєкції інструментів.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout запиту MCP для окремого сервера
  в секундах або мілісекундах.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout підключення для окремого сервера
  в секундах або мілісекундах.
- `mcp.servers.<name>.supportsParallelToolCalls`: необов’язкова підказка щодо паралельності для
  адаптерів, які можуть обирати, чи виконувати паралельні виклики MCP-інструментів.
- `mcp.servers.<name>.auth`: задайте `"oauth"` для HTTP MCP-серверів, які потребують
  OAuth. Запустіть `openclaw mcp login <name>`, щоб зберегти токени в стані OpenClaw.
- `mcp.servers.<name>.oauth`: необов’язкові перевизначення OAuth scope, redirect URL і client
  metadata URL.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: елементи керування HTTP TLS
  для приватних endpoint і mutual TLS.
- `mcp.servers.<name>.toolFilter`: необов’язковий вибір інструментів для окремого сервера. `include`
  обмежує виявлені MCP-інструменти іменами, що збігаються; `exclude` приховує імена,
  що збігаються. Записи — це точні імена MCP-інструментів або прості `*` globs. Сервери з
  ресурсами або prompts також генерують імена службових інструментів (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), і ці імена використовують той самий
  фільтр.
- `mcp.servers.<name>.codex`: необов’язкові елементи керування проєкцією Codex app-server.
  Цей блок є метаданими OpenClaw лише для потоків Codex app-server; він не
  впливає на ACP-сесії, загальну конфігурацію Codex harness або інші runtime-адаптери.
  Непорожній `codex.agents` обмежує сервер переліченими ідентифікаторами агентів OpenClaw.
  Порожні, blank або недійсні scoped списки агентів відхиляються валідацією конфігурації
  та пропускаються runtime-шляхом проєкції замість того, щоб ставати глобальними.
  `codex.defaultToolsApprovalMode` виводить нативний
  `default_tools_approval_mode` Codex для цього сервера. OpenClaw видаляє блок `codex`
  перед передаванням нативної конфігурації `mcp_servers` у Codex. Пропустіть блок, щоб
  сервер проєктувався для кожного агента Codex app-server із типовою поведінкою
  схвалення MCP у Codex.
- `mcp.sessionIdleTtlMs`: idle TTL для session-scoped bundled MCP runtime.
  Одноразові вбудовані запуски запитують очищення після завершення запуску; цей TTL є backstop для
  довготривалих сесій і майбутніх викликачів.
- Зміни в `mcp.*` hot-apply шляхом dispose cached session MCP runtime.
  Наступне discovery/використання інструментів відтворює їх із нової конфігурації, тому видалені
  записи `mcp.servers` прибираються негайно, а не чекають idle TTL.
- Runtime discovery також враховує сповіщення про зміни списку MCP-інструментів, скидаючи
  cached каталог для цієї сесії. Сервери, які оголошують ресурси або
  prompts, отримують службові інструменти для переліку/читання ресурсів і переліку/отримання
  prompts. Повторні збої викликів інструментів ненадовго призупиняють відповідний сервер перед
  наступною спробою виклику.

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

- `allowBundled`: необов’язковий allowlist лише для bundled skills (не впливає на managed/workspace skills).
- `load.extraDirs`: додаткові спільні корені skill (найнижчий пріоритет).
- `load.allowSymlinkTargets`: довірені реальні цільові корені, у які symlink skill можуть
  resolve, коли link розміщений поза налаштованим source root.
- `workshop.allowSymlinkTargetWrites`: дозволяє Skill Workshop apply записувати
  через уже довірені symlink targets (типово: false).
- `install.preferBrew`: коли true, віддає перевагу інсталяторам Homebrew, якщо `brew`
  доступний, перед fallback до інших типів інсталяторів.
- `install.nodeManager`: преференція інсталятора node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: дозволяє довіреним клієнтам Gateway `operator.admin`
  інсталювати приватні zip-архіви, підготовлені через `skills.upload.*`
  (типово: false). Це вмикає лише шлях uploaded-archive; звичайні інсталяції ClawHub
  цього не потребують.
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручність для skills, які оголошують основну змінну env (plaintext string або об’єкт SecretRef).

---

## Плагіни

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

- Завантажується з каталогів пакетів або bundle-каталогів у `~/.openclaw/extensions` і `<workspace>/.openclaw/extensions`, а також із файлів або каталогів, перелічених у `plugins.load.paths`.
- Розміщуйте окремі файли плагінів у `plugins.load.paths`; автоматично виявлені корені розширень ігнорують файли `.js`, `.mjs` і `.ts` верхнього рівня, щоб допоміжні скрипти в цих коренях не блокували запуск.
- Виявлення приймає нативні плагіни OpenClaw, а також сумісні Codex bundles і Claude bundles, включно з Claude bundles без маніфеста зі стандартною структурою.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий список дозволених плагінів (завантажуються лише перелічені плагіни). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні плагіна (коли підтримується плагіном).
- `plugins.entries.<id>.env`: мапа змінних середовища в області плагіна.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` та ігнорує поля, що змінюють prompt, зі застарілого `before_agent_start`, зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hooks плагіна та підтримуваних каталогів hooks, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені небандловані плагіни можуть читати необроблений вміст розмови з typed hooks, таких як `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряє цьому плагіну запитувати перевизначення `provider` і `model` для кожного запуску фонових subagent-запусків.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених subagent-перевизначень. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowModelOverride`: явно довіряє цьому плагіну запитувати перевизначення моделі для `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених перевизначень завершення LLM плагіна. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: явно довіряє цьому плагіну запускати `api.runtime.llm.complete` для нестандартного agent id.
- `plugins.entries.<id>.config`: визначений плагіном об’єкт конфігурації (перевіряється схемою нативного плагіна OpenClaw, коли доступна).
- Налаштування облікового запису/runtime channel-плагіна розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфеста плагіна-власника, а не центральним реєстром опцій OpenClaw.

### Конфігурація плагіна Codex harness

Бандлований плагін `codex` володіє нативними налаштуваннями Codex app-server harness у
`plugins.entries.codex.config`. Див.
[довідник Codex harness](/uk/plugins/codex-harness-reference) для повної поверхні
конфігурації та [Codex harness](/uk/plugins/codex-harness) для моделі runtime.

`codexPlugins` застосовується лише до сесій, які вибирають нативний Codex harness.
Він не вмикає плагіни Codex для запусків OpenClaw provider, ACP
conversation bindings або будь-якого не-Codex harness.

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
  plugin/app Codex для Codex harness. За замовчуванням: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  стандартна політика destructive-action для мігрованих elicitations plugin app.
  Використовуйте `true`, щоб приймати безпечні схеми схвалення Codex без запиту, `false`,
  щоб відхиляти їх, `"auto"`, щоб маршрутизувати потрібні Codex схвалення через схвалення
  плагінів OpenClaw, або `"ask"`, щоб запитувати кожну write/destructive
  дію плагіна без довготривалого схвалення. Режим `"ask"` очищає довготривалі
  перевизначення схвалень Codex для кожного інструмента відповідного app і вибирає human
  approvals reviewer для цього app перед запуском Codex thread.
  За замовчуванням: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: вмикає
  мігрований запис плагіна, коли глобальний `codexPlugins.enabled` також істинний.
  За замовчуванням: `true` для явних записів.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  стабільна ідентичність marketplace. V1 підтримує лише `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: стабільна
  ідентичність плагіна Codex з міграції, наприклад `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  перевизначення destructive-action для окремого плагіна. Якщо пропущено, використовується глобальне
  значення `allow_destructive_actions`. Значення для окремого плагіна приймає ті самі
  політики `true`, `false`, `"auto"` або `"ask"`.

Кожен допущений plugin app, що використовує `"ask"`, маршрутизує запити схвалення цього app
до human reviewer. Інші apps і схвалення thread, що не належать app, зберігають свого
налаштованого reviewer, тому змішані політики плагінів не успадковують поведінку `"ask"`.

`codexPlugins.enabled` — це глобальна директива ввімкнення. Явні записи плагінів,
записані міграцією, є довготривалим набором встановлень і придатності для ремонту.
`plugins["*"]` не підтримується, перемикача `install` немає, а локальні
значення `marketplacePath` навмисно не є полями конфігурації, бо вони
залежать від хоста.

Перевірки готовності `app/list` кешуються на одну годину й оновлюються
асинхронно, коли застарівають. Конфігурація app для Codex thread обчислюється під час встановлення
сесії Codex harness, а не на кожному ході; використовуйте `/new`, `/reset` або перезапуск gateway
після зміни нативної конфігурації плагінів.

- `plugins.entries.firecrawl.config.webFetch`: налаштування Firecrawl web-fetch provider.
  - `apiKey`: необов’язковий API-ключ Firecrawl для вищих лімітів (приймає SecretRef). Повертається до `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілого `tools.web.fetch.firecrawl.apiKey` або env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: базова URL-адреса Firecrawl API (за замовчуванням: `https://api.firecrawl.dev`; self-hosted перевизначення мають вказувати на приватні/внутрішні endpoints).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (за замовчуванням: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (за замовчуванням: `172800000` / 2 дні).
  - `timeoutSeconds`: timeout запиту scrape у секундах (за замовчуванням: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (Grok web search).
  - `enabled`: увімкнути X Search provider.
  - `model`: модель Grok для використання в пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (за замовчуванням `false`).
  - `frequency`: cadence cron для кожного повного dreaming sweep (`"0 3 * * *"` за замовчуванням).
  - `model`: необов’язкове перевизначення моделі subagent Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз зі стандартною моделлю сесії; помилки довіри або allowlist не мають тихого fallback.
  - політика фаз і пороги є деталями реалізації (не user-facing ключами конфігурації).
- Повна конфігурація пам’яті розміщена в [довіднику конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Claude bundle-плагіни також можуть додавати вбудовані стандартні значення OpenClaw із `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як необроблені patches конфігурації OpenClaw.
- `plugins.slots.memory`: виберіть id активного плагіна пам’яті або `"none"`, щоб вимкнути плагіни пам’яті.
- `plugins.slots.contextEngine`: виберіть id активного плагіна context engine; за замовчуванням `"legacy"`, якщо ви не встановите й не виберете інший engine.

Див. [Плагіни](/uk/tools/plugin).

---

## Зобов’язання

`commitments` керує виведеною follow-up пам’яттю: OpenClaw може виявляти check-ins із ходів розмови й доставляти їх через запуски heartbeat.

- `commitments.enabled`: увімкнути приховане LLM-витягання, зберігання й доставку heartbeat для виведених follow-up commitments. За замовчуванням: `false`.
- `commitments.maxPerDay`: максимальна кількість виведених follow-up commitments, доставлених на сесію агента в ковзний день. За замовчуванням: `3`.

Див. [Виведені commitments](/uk/concepts/commitments).

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
- `tabCleanup` звільняє відстежувані вкладки основного агента після періоду простою або коли
  сесія перевищує свій ліміт. Установіть `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, коли не задано, тому навігація браузера за замовчуванням залишається строгою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте браузерній навігації приватною мережею.
- У строгому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.
- У строгому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі підключення (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли потрібно, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає пряму URL-адресу DevTools WebSocket.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до доступності віддалених і
  `attachOnly` CDP, а також до запитів відкриття вкладок. Керовані профілі loopback
  зберігають локальні стандартні значення CDP.
- Якщо зовні керований сервіс CDP доступний через loopback, установіть для цього
  профілю `attachOnly: true`; інакше OpenClaw трактуватиме порт loopback як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися на
  вибраному хості або через підключений вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на базі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` можуть задавати `cdpUrl`, коли Chrome уже запущено
  за кінцевою точкою виявлення DevTools HTTP(S) або прямою кінцевою точкою WS(S). У цьому
  режимі OpenClaw передає кінцеву точку до Chrome MCP замість використання автопідключення;
  `userDataDir` ігнорується для аргументів запуску Chrome MCP.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання CSS-селекторами, хуки завантаження
  одного файлу, без перевизначень тайм-аутів діалогів, без `wait --load networkidle`, а також без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; задавайте
  `cdpUrl` явно лише для віддалених профілів CDP або підключення кінцевої точки existing-session.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності CDP websocket після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  успішно запускається, але перевірки готовності випереджають запуск. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: стандартний браузер, якщо він на базі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для окремого профілю в профілях `existing-session` також розгортається з тильдою.
- Сервіс керування: лише loopback (порт походить від `gateway.port`, стандартно `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад,
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

- `seamColor`: акцентний колір для chrome UI нативного застосунку (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення ідентичності Control UI. За замовчуванням використовується ідентичність активного агента.

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

<Accordion title="Подробиці полів Gateway">

- `mode`: `local` (запустити gateway) або `remote` (під’єднатися до віддаленого gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає на `127.0.0.1` всередині контейнера. За мережевого мосту Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому gateway недоступний. Використайте `--network host` або задайте `bind: "lan"` (чи `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: типово обов’язкова. Bind не через loopback потребують автентифікації gateway. На практиці це означає спільний токен/пароль або identity-aware reverse proxy з `gateway.auth.mode: "trusted-proxy"`. Майстер онбордингу типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема SecretRefs), явно задайте `gateway.auth.mode` як `token` або `password`. Потоки запуску та встановлення/ремонту служби завершуються помилкою, коли налаштовано обидва поля, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених локальних налаштувань local loopback; це навмисно не пропонується в підказках онбордингу.
- `gateway.auth.mode: "trusted-proxy"`: делегуйте автентифікацію браузера/користувача identity-aware reverse proxy і довіряйте заголовкам ідентичності від `gateway.trustedProxies` (див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth)). Цей режим типово очікує джерело проксі **не через loopback**; same-host loopback reverse proxies потребують явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні same-host виклики можуть використовувати `gateway.auth.password` як локальний прямий fallback; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію заголовками Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації gateway. Цей безтокеновий потік припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб автентифікації. Застосовується для IP клієнта й області автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні некоректні спроби від того самого клієнта можуть спрацювати обмежувач уже на другому запиті, замість того щоб обидві пройшли як прості невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; задайте `false`, коли навмисно хочете також обмежувати трафік localhost (для тестових налаштувань або строгих розгортань із проксі).
- Спроби WS-автентифікації з browser-origin завжди throttled із вимкненим винятком для loopback (захист у глибину проти brute force localhost із браузера).
- На loopback ці блокування browser-origin ізольовані за нормалізованим значенням `Origin`, тому повторні помилки з одного localhost origin не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind loopback) або `funnel` (публічний, потребує автентифікації).
- `tailscale.serviceName`: необов’язкова назва Tailscale Service для режиму Serve, наприклад `svc:openclaw`. Коли задано, OpenClaw передає її в `tailscale serve --service`, щоб Control UI можна було відкрити через іменований Service замість hostname пристрою. Значення має використовувати формат назви Service Tailscale `svc:<dns-label>`; запуск повідомляє похідну URL-адресу Service.
- `tailscale.preserveFunnel`: коли `true` і `tailscale.mode = "serve"`, OpenClaw перевіряє `tailscale funnel status` перед повторним застосуванням Serve під час запуску й пропускає його, якщо зовнішньо налаштований маршрут Funnel уже покриває порт gateway. Типово `false`.
- `controlUi.allowedOrigins`: явний allowlist browser-origin для підключень Gateway WebSocket. Обов’язковий для публічних browser origins не через loopback. Приватні same-origin LAN/Tailnet завантаження UI з loopback, RFC1918/link-local, `.local`, `.ts.net` або хостів Tailscale CGNAT приймаються без увімкнення fallback за Host-заголовком.
- `controlUi.chatMessageMaxWidth`: необов’язкова максимальна ширина для згрупованих повідомлень чату Control UI. Приймає обмежені значення ширини CSS, як-от `960px`, `82%`, `min(1280px, 82%)` і `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, що вмикає origin fallback за Host-заголовком для розгортань, які навмисно покладаються на політику origin за Host-заголовком.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `wss://` для публічних хостів; відкритий текст `ws://` приймається лише для loopback, LAN, link-local, `.local`, `.ts.net` і хостів Tailscale CGNAT.
- `remote.remotePort`: порт gateway на віддаленому SSH-хості. Типово `18789`; використовуйте це, коли локальний порт тунелю відрізняється від віддаленого порту gateway.
- `remote.sshHostKeyPolicy`: політика host-key тунелю SSH на macOS. `strict` є типовим значенням і потребує вже довіреного ключа. `openssh` — це явна згода на ефективну конфігурацію OpenSSH для керованих псевдонімів; перед використанням перегляньте відповідні користувацькі й системні налаштування SSH. Застосунок macOS і `configure-remote` скидають цю політику до `strict` під час зміни цілей, якщо її явно не ввімкнути знову.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують автентифікацію gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS URL-адреса зовнішнього APNs relay, що використовується після того, як relay-backed збірки iOS публікують реєстрації в gateway. Публічні збірки App Store використовують розміщений relay OpenClaw. Користувацькі URL-адреси relay мають відповідати навмисно окремому шляху збірки/розгортання iOS, чия URL-адреса relay вказує на цей relay.
- `gateway.push.apns.relay.timeoutMs`: timeout надсилання від gateway до relay у мілісекундах. Типово `10000`.
- Relay-backed реєстрації делегуються конкретній ідентичності gateway. Спарений застосунок iOS отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію relay і пересилає gateway дозвіл на надсилання, scoped до реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові override змінних середовища для конфігурації relay вище.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch лише для розробки для URL-адрес HTTP relay на loopback. Production URL-адреси relay мають залишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: timeout handshake Gateway WebSocket перед автентифікацією в мілісекундах. Типово: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли задано. Збільште це значення на завантажених або малопотужних хостах, де локальні клієнти можуть під’єднуватися, поки warmup запуску ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал health-monitor каналу в хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски health-monitor. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг stale-socket у хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на канал/обліковий запис за rolling hour. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: поканальне opt-out для перезапусків health-monitor зі збереженням увімкненого глобального монітора.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override на рівні облікового запису для багатооблікових каналів. Коли задано, має пріоритет над override на рівні каналу.
- Локальні шляхи викликів gateway можуть використовувати `gateway.remote.*` як fallback лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання fail-closed (без маскування remote fallback).
- `trustedProxies`: IP-адреси reverse proxy, які завершують TLS або вставляють заголовки forwarded-client. Вказуйте лише проксі, які ви контролюєте. Записи loopback усе ще дійсні для same-host proxy/local-detection налаштувань (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для fail-closed поведінки.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий CIDR/IP allowlist для автоматичного схвалення першого pairing пристрою node без запитаних scopes. Вимкнено, коли не задано. Це не схвалює автоматично operator/browser/Control UI/WebChat pairing і не схвалює автоматично role, scope, metadata або public-key upgrades.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд node після pairing і оцінювання platform allowlist. Використовуйте `allowCommands`, щоб opt into небезпечні команди node, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` вилучає команду, навіть якщо platform default або явний allow інакше включив би її. Після того як node змінить свій оголошений список команд, відхиліть і повторно схваліть pairing цього пристрою, щоб gateway зберіг оновлений command snapshot.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий deny list).
- `gateway.tools.allow`: вилучає назви інструментів із типового HTTP deny list для owner/admin callers. Це не підвищує identity-bearing `operator.write` callers до owner/admin access; `cron`, `gateway` і `nodes` залишаються недоступними для non-owner callers, навіть коли allowlisted.

</Accordion>

### OpenAI-сумісні кінцеві точки

- Admin HTTP RPC: типово вимкнено як plugin `admin-http-rpc`. Увімкніть plugin, щоб зареєструвати `POST /api/v1/admin/rpc`. Див. [Admin HTTP RPC](/uk/plugins/admin-http-rpc).
- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення URL-вводу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlists вважаються незаданими; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false` і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути URL fetching.
- Необов’язковий заголовок посилення відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS origins, які ви контролюєте; див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька gateways на одному хості з унікальними портами й state dirs:

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
- `autoGenerate`: автоматично генерує локальну self-signed пару cert/key, коли явні файли не налаштовано; лише для локального/dev використання.
- `certPath`: шлях файлової системи до файлу сертифіката TLS.
- `keyPath`: шлях файлової системи до файлу приватного ключа TLS; тримайте дозволи обмеженими.
- `caPath`: необов’язковий шлях до CA bundle для перевірки клієнтів або користувацьких trust chains.

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
  - `"restart"`: завжди перезапускати процес Gateway у разі зміни конфігурації.
  - `"hot"`: застосовувати зміни в межах процесу без перезапуску.
  - `"hybrid"` (типово): спершу спробувати гаряче перезавантаження; за потреби повернутися до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс для очікування поточних операцій перед примусовим перезапуском або гарячим перезавантаженням каналу. Пропустіть його, щоб використати типове обмежене очікування (`300000`); задайте `0`, щоб чекати безстроково й періодично записувати попередження про операції, що все ще очікують.

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
- `hooks.token` має відрізнятися від активного спільного секрету автентифікації Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); під час запуску журнал записує некритичне попередження безпеки, коли виявляє повторне використання.
- `openclaw security audit` позначає повторне використання автентифікації hook/Gateway як критичну знахідку, включно з автентифікацією Gateway за паролем, наданою лише під час аудиту (`--auth password --password <password>`). Запустіть `openclaw doctor --fix`, щоб ротувати збережений повторно використаний `hooks.token`, а потім оновіть зовнішніх відправників хуків, щоб вони використовували новий токен хуків.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад, `["hook:"]`).
- Якщо зіставлення або preset використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі зіставлення не потребують такого явного ввімкнення.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з корисного навантаження запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` зіставлення, відрендерені з шаблону, вважаються зовнішньо наданими й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Подробиці зіставлення">

- `match.path` зіставляє підшлях після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле корисного навантаження для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з корисного навантаження.
- `transform` може вказувати на модуль JS/TS, який повертає дію хуку.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи й обхід каталогів відхиляються).
  - Тримайте `hooks.transformsDir` у межах `~/.openclaw/hooks/transforms`; каталоги Skills робочого простору відхиляються. Якщо `openclaw doctor` повідомляє, що цей шлях недійсний, перемістіть модуль transform у каталог трансформацій хуків або вилучіть `hooks.transformsDir`.
- `agentId` маршрутизує до конкретного агента; невідомі ідентифікатори повертаються до типового агента.
- `allowedAgentIds`: обмежує ефективну маршрутизацію агента, включно зі шляхом типового агента, коли `agentId` пропущено (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сеансу для запусків агента хуку без явного `sessionKey`.
- `allowRequestSessionKey`: дозволити викликачам `/hooks/agent` і керованим шаблонами ключам сеансів зіставлення задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий allowlist префіксів для явних значень `sessionKey` (запит + зіставлення), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-яке зіставлення або preset використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску хуку (має бути дозволено, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви залишаєте цю помаршрутну обробку для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібен `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість типового шаблонного значення.

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

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, коли налаштовано. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
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

- Обслуговує редаговані агентом HTML/CSS/JS і A2UI через HTTP під портом Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Прив’язки не до loopback: маршрути canvas потребують автентифікації Gateway (токен/пароль/довірений проксі), як і інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки автентифікації; після спарювання й підключення вузла Gateway оголошує URL можливостей, scoped до вузла, для доступу canvas/A2UI.
- URL можливостей прив’язані до активного сеансу WS вузла й швидко спливають. Резервний механізм на основі IP не використовується.
- Вставляє клієнт живого перезавантаження в HTML, що обслуговується.
- Автоматично створює стартовий `index.html`, коли порожньо.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
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

- `minimal` (типово, коли ввімкнено bundled Plugin `bonjour`): пропускає `cliPath` + `sshPort` із TXT-записів.
- `full`: включає `cliPath` + `sshPort`; широкомовна multicast-реклама в LAN усе одно потребує ввімкненого bundled Plugin `bonjour`.
- `off`: пригнічує multicast-рекламу в LAN без зміни ввімкнення Plugin.
- Bundled Plugin `bonjour` автоматично запускається на хостах macOS і вмикається явно на Linux, Windows і контейнеризованих розгортаннях Gateway.
- Ім’я хоста типово дорівнює системному імені хоста, коли воно є дійсною DNS-міткою, інакше використовується `openclaw`. Перевизначте через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує unicast-зону DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднайте з DNS-сервером (рекомендовано CoreDNS) + Tailscale split DNS.

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

- Вбудовані змінні середовища застосовуються лише якщо в середовищі процесу немає ключа.
- Файли `.env`: CWD `.env` + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Див. [Середовище](/uk/help/environment) для повного порядку пріоритетів.

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

Посилання на секрети є additive: plaintext-значення досі працюють.

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
- id для `source: "exec"` не мають містити сегменти шляху `.` або `..`, розділені скісними рисками (наприклад, `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включено до розв’язання під час виконання й покриття аудиту.

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
- Шляхи постачальників file і exec закриваються з помилкою, коли перевірка ACL Windows недоступна. Задавайте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Постачальник `exec` потребує абсолютного шляху `command` і використовує protocol payloads у stdin/stdout.
- Типово шляхи команд-симлінків відхиляються. Задайте `allowSymlinkCommand: true`, щоб дозволити шляхи-симлінки з валідацією розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довіреного каталогу застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` типово мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв’язуються під час активації в знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Фільтрація активної поверхні застосовується під час активації: нерозв’язані посилання на ввімкнених поверхнях призводять до збою запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

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

- Профілі окремих агентів зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Застарілі плоскі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є форматом runtime; `openclaw doctor --fix` переписує їх у канонічні профілі API-ключів `provider:default` з резервною копією `.legacy-flat.*.bak`.
- Профілі режиму OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-профілів на базі SecretRef.
- Статичні облікові дані runtime надходять із розв'язаних знімків у пам'яті; застарілі статичні записи `auth.json` очищаються під час виявлення.
- Застарілі імпорти OAuth з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Поведінка runtime для секретів та інструменти `audit/configure/apply`: [Керування секретами](/uk/gateway/secrets).

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

- `billingBackoffHours`: базове відтермінування в годинах, коли профіль дає збій через справжні
  помилки білінгу або недостатньо кредитів (типово: `5`). Явний текст про білінг може
  все ще потрапити сюди навіть у відповідях `401`/`403`, але текстові
  зіставлячі, специфічні для провайдера, залишаються обмеженими провайдером, якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повторювані HTTP `402` повідомлення про вікно використання або
  ліміт витрат організації/робочого простору натомість залишаються у шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов'язкові перевизначення кількості годин відтермінування білінгу для кожного провайдера.
- `billingMaxHours`: верхня межа в годинах для експоненційного зростання відтермінування білінгу (типово: `24`).
- `authPermanentBackoffMinutes`: базове відтермінування в хвилинах для високодостовірних збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: верхня межа в хвилинах для зростання відтермінування `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників відтермінування (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілів того самого провайдера для помилок перевантаження перед переходом до резервної моделі (типово: `1`). Форми зайнятості провайдера, як-от `ModelNotReadyException`, потрапляють сюди.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілів того самого провайдера для помилок обмеження швидкості перед переходом до резервної моделі (типово: `1`). Цей кошик обмеження швидкості включає текст у формі провайдера, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `maxFileBytes`: максимальний розмір активного файлу журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 МБ). OpenClaw зберігає до п'яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування на основі найкращих зусиль для виводу консолі, файлових журналів, записів журналів OTLP і збереженого тексту транскрипту сесії. `redactSensitive: "off"` вимикає лише цю загальну політику журналу/транскрипту; поверхні безпеки UI/інструментів/діагностики все одно редагують секрети перед виведенням.

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

- `enabled`: головний перемикач для виводу інструментування (типово: `true`).
- `flags`: масив рядків прапорців, що вмикають цільовий вивід журналу (підтримує шаблони на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку без прогресу в мс для класифікації довготривалих сесій обробки як `session.long_running`, `session.stalled` або `session.stuck`. Відповідь, інструмент, статус, блок і прогрес ACP скидають таймер; повторювані діагностики `session.stuck` відступають, доки стан не змінюється.
- `stuckSessionAbortMs`: поріг віку без прогресу в мс, після якого придатна зависла активна робота може бути аварійно зупинена з осушенням для відновлення. Якщо не задано, OpenClaw використовує безпечніше розширене вікно вбудованого запуску щонайменше 5 хвилин і 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: захоплює відредагований знімок стабільності перед OOM, коли тиск пам'яті досягає `critical` (типово: `false`). Установіть `true`, щоб додати сканування/запис файлу пакета стабільності, зберігаючи звичайні події тиску пам'яті.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. у [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов'язкові кінцеві точки OTLP, специфічні для сигналу. Якщо задані, вони перевизначають `otel.endpoint` лише для цього сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт трасувань, метрик або журналів.
- `otel.logsExporter`: приймач експорту журналів: `"otlp"` (типово), `"stdout"` для одного JSON-об'єкта на рядок stdout або `"both"`.
- `otel.sampleRate`: частота семплювання трасувань `0`-`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання телеметрії в мс.
- `otel.captureContent`: явне увімкнення захоплення необробленого вмісту для атрибутів span OTEL. Типово вимкнено. Булеве `true` захоплює несистемний вміст повідомлень/інструментів; форма об'єкта дає змогу явно увімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` і `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: перемикач середовища для найновішої експериментальної форми span виведення GenAI, включно з назвами span `{gen_ai.operation.name} {gen_ai.request.model}`, типом span `CLIENT` і `gen_ai.provider.name` замість застарілого `gen_ai.system`. Типово spans зберігають `openclaw.model.call` і `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: перемикач середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/завершення роботи SDK, що належить Plugin, зберігаючи діагностичні слухачі активними.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища кінцевих точок, специфічні для сигналів, які використовуються, коли відповідний ключ конфігурації не задано.
- `cacheTrace.enabled`: журналювати знімки трасування кешу для вбудованих запусків (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL трасування кешу (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включено у вивід трасування кешу (усі типово: `true`).

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
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для встановлень пакетів (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням у stable-каналі (типово: `6`; макс.: `168`).
- `auto.stableJitterHours`: додаткове вікно рознесення розгортання stable-каналу в годинах (типово: `12`; макс.: `168`).
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

- `enabled`: глобальний перемикач функції ACP (типово: `true`; установіть `false`, щоб приховати диспетчеризацію ACP і можливості створення).
- `dispatch.enabled`: незалежний перемикач для диспетчеризації ходу сесії ACP (типово: `true`). Установіть `false`, щоб залишити команди ACP доступними, але заблокувати виконання.
- `backend`: типовий ідентифікатор backend runtime ACP (має відповідати зареєстрованому runtime Plugin ACP).
  Спочатку встановіть backend Plugin, а якщо задано `plugins.allow`, включіть ідентифікатор backend Plugin (наприклад `acpx`), інакше backend ACP не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли створення не вказує явну ціль.
- `allowedAgents`: allowlist ідентифікаторів агентів, дозволених для runtime-сесій ACP; порожнє значення означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно скидання простою в мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед розділенням проєкції потокового блоку.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів за хід (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потік інкрементально; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: розділювач перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, що проєктуються за хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів до булевих перевизначень видимості для потокових подій.
- `runtime.ttlMinutes`: TTL простою в хвилинах для працівників сесій ACP перед можливим очищенням.
- `runtime.installCommand`: необов'язкова команда встановлення, яку потрібно виконати під час початкового налаштування runtime-середовища ACP.

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
  - `"random"` (типово): ротаційні кумедні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (не лише слогани), задайте env `OPENCLAW_HIDE_BANNER=1`.

---

## Майстер

Метадані, які записують керовані CLI-процеси налаштування (`onboard`, `configure`, `doctor`):

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

Див. поля ідентичності `agents.list` у [типових налаштуваннях агента](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застарілий, вилучено)

Поточні збірки більше не містять TCP-міст. Вузли підключаються через Gateway WebSocket. Ключі `bridge.*` більше не є частиною схеми конфігурації (перевірка не проходитиме, доки їх не буде вилучено; `openclaw doctor --fix` може видалити невідомі ключі).

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

- `sessionRetention`: як довго зберігати завершені ізольовані сеанси запусків cron перед очищенням із `sessions.json`. Також керує очищенням архівованих транскриптів видалених cron. Типово: `24h`; задайте `false`, щоб вимкнути.
- `runLog.maxBytes`: приймається для сумісності зі старішими файловими журналами запусків cron. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки історії запусків SQLite, що зберігаються для кожного завдання. Типово: `2000`.
- `webhookToken`: bearer-токен, який використовується для POST-доставки cron Webhook (`delivery.mode = "webhook"`); якщо пропущено, заголовок авторизації не надсилається.
- `webhook`: застарілий резервний URL Webhook (http/https), який `openclaw doctor --fix` використовує для міграції збережених завдань, що все ще мають `notify: true`; доставка під час виконання використовує `delivery.mode="webhook"` для кожного завдання разом із `delivery.to`, або `delivery.completionDestination` під час збереження доставки оголошення.

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
- `retryOn`: типи помилок, які запускають повторні спроби - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати всі тимчасові типи.

Одноразові завдання залишаються ввімкненими, доки повторні спроби не буде вичерпано, після чого вимикаються зі збереженням фінального стану помилки. Повторювані завдання використовують ту саму політику повторів для тимчасових помилок, щоб запуститися знову після backoff перед наступним запланованим слотом; постійні помилки або вичерпані повтори тимчасових помилок повертаються до звичайного повторюваного розкладу з backoff помилки.

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
- `includeSkipped`: враховувати послідовно пропущені запуски в порозі сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на backoff помилок виконання.
- `mode`: режим доставки - `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує в налаштований Webhook.
- `accountId`: необов’язковий обліковий запис або ідентифікатор каналу для обмеження області доставки сповіщень.

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
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо цільових даних.
- `channel`: перевизначення каналу для доставки оголошення. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль оголошення або URL Webhook. Обов’язково для режиму Webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли не задано ні глобальне, ні індивідуальне для завдання призначення збоїв, завдання, які вже доставляються через `announce`, у разі збою повертаються до цієї основної цілі оголошення.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не є `"webhook"`.

Див. [завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблонів медіамоделі

Заповнювачі шаблонів, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повне тіло вхідного повідомлення                  |
| `{{RawBody}}`      | Сире тіло (без обгорток історії/відправника)      |
| `{{BodyStripped}}` | Тіло з видаленими згадками груп                   |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | Ідентифікатор повідомлення каналу                 |
| `{{SessionId}}`    | UUID поточного сеансу                             |
| `{{IsNewSession}}` | `"true"`, коли створено новий сеанс               |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (зображення/аудіо/документ/…)           |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Розв’язаний медіапромпт для записів CLI           |
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
- Шляхи: розв’язуються відносно файлу, що включає, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` файлу `openclaw.json`). Абсолютні форми/форми `../` дозволені лише тоді, коли вони все одно розв’язуються всередині цієї межі. Шляхи не повинні містити null-байти й мають бути строго коротшими за 4096 символів до та після розв’язання.
- Записи, що належать OpenClaw і змінюють лише один розділ верхнього рівня, підтриманий однофайловим включенням, записуються до цього включеного файлу. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями є лише для читання для записів, що належать OpenClaw; такі записи fail closed замість вирівнювання конфігурації.
- Помилки: чіткі повідомлення для відсутніх файлів, помилок розбору, циклічних включень, недійсного формату шляху та надмірної довжини.

---

_Пов’язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
