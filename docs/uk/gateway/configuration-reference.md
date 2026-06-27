---
read_when:
    - Вам потрібна точна семантика конфігурації на рівні полів або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, типових значень і посилань на спеціалізовані довідники підсистем
title: Довідник конфігурації
x-i18n:
    generated_at: "2026-06-27T17:31:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb8ebf55fe7562f00dbd42eb5fd00a7bac95ac934bdb0b778d04bb6926f28102
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Довідник основної конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на задачі, див. у [Конфігурація](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і містить посилання на окремі поглиблені довідники підсистем. Каталоги команд, що належать каналам і plugin, а також поглиблені параметри пам’яті/QMD розміщені на власних сторінках, а не тут.

Джерело істини в коді:

- `openclaw config schema` друкує актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими bundled/plugin/каналів, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми, обмежений шляхом, для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації відносно поточної поверхні схеми

Шлях пошуку агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації й обмежень на рівні полів перед редагуванням. Використовуйте
[Конфігурація](/uk/gateway/configuration) для порад, орієнтованих на задачі, а цю сторінку
для ширшої карти полів, значень за замовчуванням і посилань на довідники підсистем.

Окремі поглиблені довідники:

- [Довідник конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash-команди](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідних каналів/plugin для поверхонь команд, специфічних для каналу

Формат конфігурації — **JSON5** (дозволені коментарі та кінцеві коми). Усі поля необов’язкові - OpenClaw використовує безпечні значення за замовчуванням, коли їх пропущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на окрему сторінку - див.
[Конфігурація - канали](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, обмеження згадок).

## Значення агентів за замовчуванням, multi-agent, сесії та повідомлення

Перенесено на окрему сторінку - див.
[Конфігурація - агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робоча область, модель, мислення, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (маршрутизація й прив’язки multi-agent)
- `session.*` (життєвий цикл сесії, compaction, pruning)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.consultThinkingLevel`: перевизначення рівня мислення для повного запуску агента OpenClaw за realtime-консультаціями Control UI Talk
  - `talk.consultFastMode`: одноразове перевизначення fast-mode для realtime-консультацій Control UI Talk
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає стандартне для платформи вікно паузи перед надсиланням транскрипту (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: резервний Gateway relay для фіналізованих realtime-транскриптів Talk, які пропускають `openclaw_agent_consult`

## Інструменти та власні провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів на базі провайдерів і налаштування власного
провайдера / base-URL перенесені на окрему сторінку - див.
[Конфігурація - інструменти та власні провайдери](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, allowlist моделей і налаштування власних провайдерів розміщені в
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

- `models.mode`: поведінка каталогу провайдера (`merge` або `replace`).
- `models.providers`: мапа власних провайдерів за ідентифікатором провайдера.
- `models.providers.*.localService`: необов’язковий процесний менеджер на вимогу для
  локальних серверів моделей. OpenClaw перевіряє налаштовану health endpoint, запускає
  абсолютну `command`, коли потрібно, чекає готовності, а потім надсилає запит до моделі.
  Див. [Локальні сервіси моделей](/uk/gateway/local-model-services).
- `models.pricing.enabled`: керує фоновим bootstrap ціноутворення, який
  запускається після того, як sidecar-и та канали доходять до готового шляху Gateway. Коли `false`,
  Gateway пропускає отримання каталогів цін OpenRouter і LiteLLM; налаштовані
  значення `models.providers.*.models[].cost` все ще працюють для локальних оцінок вартості.

## MCP

Визначення серверів MCP, керованих OpenClaw, розміщені в `mcp.servers` і
споживаються вбудованим OpenClaw та іншими runtime-адаптерами. Команди `openclaw mcp list`,
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

- `mcp.servers`: іменовані stdio або віддалені визначення серверів MCP для runtime-ів, які
  надають налаштовані інструменти MCP.
  Віддалені записи використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` є CLI-native alias, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.servers.<name>.enabled`: задайте `false`, щоб зберегти визначення сервера,
  але виключити його з виявлення MCP у вбудованому OpenClaw і проєкції інструментів.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout запиту MCP для сервера
  в секундах або мілісекундах.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout підключення для сервера
  в секундах або мілісекундах.
- `mcp.servers.<name>.supportsParallelToolCalls`: необов’язкова підказка щодо concurrency для
  адаптерів, які можуть обирати, чи виконувати паралельні виклики інструментів MCP.
- `mcp.servers.<name>.auth`: задайте `"oauth"` для HTTP-серверів MCP, які потребують
  OAuth. Запустіть `openclaw mcp login <name>`, щоб зберегти токени у стані OpenClaw.
- `mcp.servers.<name>.oauth`: необов’язкові перевизначення scope OAuth, URL переспрямування та
  URL метаданих клієнта.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: HTTP TLS-керування
  для приватних endpoint-ів і mutual TLS.
- `mcp.servers.<name>.toolFilter`: необов’язковий вибір інструментів для сервера. `include`
  обмежує виявлені інструменти MCP відповідними назвами; `exclude` приховує відповідні
  назви. Записи — це точні назви інструментів MCP або прості globs `*`. Сервери з
  ресурсами або prompts також генерують назви службових інструментів (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), і ці назви використовують
  той самий фільтр.
- `mcp.servers.<name>.codex`: необов’язкові елементи керування проєкцією Codex app-server.
  Цей блок є метаданими OpenClaw лише для потоків Codex app-server; він не
  впливає на сесії ACP, загальну конфігурацію Codex harness або інші runtime-адаптери.
  Непорожній `codex.agents` обмежує сервер переліченими ідентифікаторами агентів OpenClaw.
  Порожні, blank або недійсні scoped списки агентів відхиляються валідацією конфігурації
  й пропускаються шляхом runtime-проєкції замість того, щоб ставати глобальними.
  `codex.defaultToolsApprovalMode` випускає нативний для Codex
  `default_tools_approval_mode` для цього сервера. OpenClaw видаляє блок `codex`
  перед передаванням нативної конфігурації `mcp_servers` у Codex. Пропустіть блок, щоб
  сервер проєктувався для кожного агента Codex app-server з
  типовою поведінкою схвалення MCP у Codex.
- `mcp.sessionIdleTtlMs`: idle TTL для session-scoped bundled MCP runtime-ів.
  Одноразові вбудовані запуски запитують очищення після завершення запуску; цей TTL є резервом для
  довготривалих сесій і майбутніх викликачів.
- Зміни в `mcp.*` застосовуються гаряче через dispose кешованих session MCP runtime-ів.
  Наступне виявлення/використання інструментів відтворює їх із нової конфігурації, тож видалені
  записи `mcp.servers` прибираються негайно, а не після очікування idle TTL.
- Runtime-виявлення також враховує сповіщення про зміну списку інструментів MCP, скидаючи
  кешований каталог для цієї сесії. Сервери, які оголошують ресурси або
  prompts, отримують службові інструменти для переліку/читання ресурсів і переліку/отримання
  prompts. Повторні збої викликів інструментів ненадовго призупиняють відповідний сервер перед
  спробою іншого виклику.

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

- `allowBundled`: необов’язковий allowlist лише для bundled skills (managed/workspace skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені skill (найнижчий пріоритет).
- `load.allowSymlinkTargets`: довірені реальні цільові корені, у які можуть
  розв’язуватися symlink-и skill, коли посилання розміщене поза налаштованим вихідним коренем.
- `workshop.allowSymlinkTargetWrites`: дозволяє Skill Workshop apply записувати
  через уже довірені цілі symlink (за замовчуванням: false).
- `install.preferBrew`: коли true, надавати перевагу інсталяторам Homebrew, якщо `brew`
  доступний, перед fallback до інших типів інсталяторів.
- `install.nodeManager`: перевага node-інсталятора для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: дозволити довіреним клієнтам Gateway `operator.admin`
  встановлювати приватні zip-архіви, підготовлені через `skills.upload.*`
  (за замовчуванням: false). Це лише вмикає шлях uploaded-archive; звичайні встановлення ClawHub
  цього не потребують.
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручний спосіб для skills, які оголошують основну env var (рядок plaintext або об’єкт SecretRef).

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

- Завантажуються з директорій пакетів або bundle під `~/.openclaw/extensions` і `<workspace>/.openclaw/extensions`, а також із файлів або директорій, перелічених у `plugins.load.paths`.
- Розміщуйте автономні файли Plugin у `plugins.load.paths`; автоматично виявлені корені розширень ігнорують файли `.js`, `.mjs` і `.ts` верхнього рівня, щоб допоміжні скрипти в цих коренях не блокували запуск.
- Виявлення приймає нативні Plugins OpenClaw, а також сумісні Codex bundles і Claude bundles, зокрема Claude bundles без маніфесту зі стандартною структурою.
- **Зміни конфігурації потребують перезапуску Gateway.**
- `allow`: необов'язковий список дозволених Plugins (завантажуються лише перелічені Plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа рівня Plugin (коли підтримується Plugin).
- `plugins.entries.<id>.env`: мапа змінних середовища в межах Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` та ігнорує поля, що змінюють prompt, із застарілого `before_agent_start`, зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних хуків Plugin і підтримуваних директорій хуків, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені не-bundled Plugins можуть читати сирий вміст розмови з типізованих хуків, таких як `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряє цьому Plugin запитувати перевизначення `provider` і `model` для кожного запуску фонових subagent-запусків.
- `plugins.entries.<id>.subagent.allowedModels`: необов'язковий список дозволених канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowModelOverride`: явно довіряє цьому Plugin запитувати перевизначення моделі для `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: необов'язковий список дозволених канонічних цілей `provider/model` для довірених перевизначень завершення LLM Plugin. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: явно довіряє цьому Plugin запускати `api.runtime.llm.complete` для agent id, відмінного від стандартного.
- `plugins.entries.<id>.config`: об'єкт конфігурації, визначений Plugin (перевіряється схемою нативного Plugin OpenClaw, коли доступна).
- Налаштування облікового запису/середовища виконання channel Plugin зберігаються в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфесту Plugin-власника, а не центральним реєстром параметрів OpenClaw.

### Конфігурація Plugin Codex harness

Вбудований Plugin `codex` володіє нативними налаштуваннями Codex app-server harness у
`plugins.entries.codex.config`. Див.
[довідник Codex harness](/uk/plugins/codex-harness-reference) для повної поверхні
конфігурації та [Codex harness](/uk/plugins/codex-harness) для моделі виконання.

`codexPlugins` застосовується лише до сесій, які вибирають нативний Codex harness.
Він не вмикає Codex plugins для запусків провайдера OpenClaw, прив'язок розмов
ACP або будь-якого не-Codex harness.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: вмикає підтримку нативних
  Plugin/застосунків Codex для Codex harness. Стандартно: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  стандартна політика деструктивних дій для перенесених запитів застосунків Plugin.
  Використовуйте `true`, щоб приймати безпечні схеми схвалення Codex без запиту, `false`,
  щоб відхиляти їх, `"auto"`, щоб маршрутизувати потрібні Codex схвалення через схвалення
  Plugin OpenClaw, або `"always"`, щоб запитувати кожну дію запису/деструктивну дію Plugin
  без тривалого схвалення. Режим `"always"` очищає тривалі перевизначення схвалень Codex
  для кожного інструмента для відповідного застосунку перед запуском потоку.
  Стандартно: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: вмикає
  перенесений запис Plugin, коли глобальний `codexPlugins.enabled` також дорівнює true.
  Стандартно: `true` для явних записів.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  стабільна ідентичність marketplace. V1 підтримує лише `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: стабільна
  ідентичність Codex plugin з міграції, наприклад `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  перевизначення деструктивних дій для окремого Plugin. Якщо пропущено, використовується
  глобальне значення `allow_destructive_actions`. Значення для окремого Plugin приймає ті самі
  політики `true`, `false`, `"auto"` або `"always"`.

`codexPlugins.enabled` є глобальною директивою ввімкнення. Явні записи Plugin,
записані міграцією, є тривалим набором встановлення та придатності до ремонту.
`plugins["*"]` не підтримується, перемикача `install` немає, а локальні
значення `marketplacePath` навмисно не є полями конфігурації, бо вони
залежать від хоста.

Перевірки готовності `app/list` кешуються на одну годину та оновлюються
асинхронно, коли застарівають. Конфігурація застосунку потоку Codex обчислюється під час
встановлення сесії Codex harness, а не на кожному ході; використовуйте `/new`, `/reset` або
перезапуск Gateway після зміни конфігурації нативного Plugin.

- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера веб-витягування Firecrawl.
  - `apiKey`: необов'язковий API-ключ Firecrawl для вищих лімітів (приймає SecretRef). Резервно використовує `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілий `tools.web.fetch.firecrawl.apiKey` або змінну середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (стандартно: `https://api.firecrawl.dev`; self-hosted перевизначення мають націлюватися на приватні/внутрішні кінцеві точки).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (стандартно: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (стандартно: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту скрейпінгу в секундах (стандартно: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok для використання в пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) щодо фаз і порогів.
  - `enabled`: головний перемикач dreaming (стандартно `false`).
  - `frequency`: Cron-частота для кожного повного проходу dreaming (`"0 3 * * *"` стандартно).
  - `model`: необов'язкове перевизначення моделі subagent Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз зі стандартною моделлю сесії; збої довіри або списку дозволених не мають тихого fallback.
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам'яті міститься в [довіднику конфігурації пам'яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Claude bundle plugins також можуть додавати вбудовані стандартні значення OpenClaw із `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: виберіть id активного memory plugin або `"none"`, щоб вимкнути memory plugins.
- `plugins.slots.contextEngine`: виберіть id активного context engine plugin; стандартно `"legacy"`, якщо ви не встановите й не виберете інший engine.

Див. [Plugins](/uk/tools/plugin).

---

## Зобов'язання

`commitments` керує виведеною пам'яттю подальших дій: OpenClaw може виявляти check-in із ходів розмови та доставляти їх через Heartbeat-запуски.

- `commitments.enabled`: увімкнути приховане LLM-витягування, зберігання та Heartbeat-доставку для виведених зобов'язань подальших дій. Стандартно: `false`.
- `commitments.maxPerDay`: максимальна кількість виведених зобов'язань подальших дій, доставлених за сесію агента протягом рухомого дня. Стандартно: `3`.

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
- `tabCleanup` звільняє відстежувані вкладки основного агента після простою або коли
  сесія перевищує свій ліміт. Задайте `idleMinutes: 0` або `maxTabsPerSession: 0`, щоб
  вимкнути ці окремі режими очищення.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тому навігація браузера за замовчуванням залишається суворою.
- Задавайте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте браузерній навігації в приватній мережі.
- У суворому режимі віддалені кінцеві точки профілів CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок досяжності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і надалі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі приєднання (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL WebSocket DevTools.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до перевірки досяжності віддаленого та
  `attachOnly` CDP, а також до запитів відкриття вкладок. Керовані профілі loopback
  зберігають локальні типові значення CDP.
- Якщо зовнішньо керована служба CDP доступна через loopback, задайте для цього
  профілю `attachOnly: true`; інакше OpenClaw розглядатиме порт loopback як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть приєднуватися на
  вибраному хості або через підключений браузерний вузол.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` можуть задавати `cdpUrl`, коли Chrome уже працює
  за кінцевою точкою HTTP(S)-виявлення DevTools або прямою кінцевою точкою WS(S). У цьому
  режимі OpenClaw передає кінцеву точку до Chrome MCP замість використання автопідключення;
  `userDataDir` ігнорується для аргументів запуску Chrome MCP.
- Профілі `existing-session` зберігають поточні обмеження маршрутів Chrome MCP:
  дії на основі snapshot/ref замість націлювання CSS-селекторами, хуки
  завантаження одного файлу, без перевизначень тайм-аутів діалогів, без `wait --load networkidle` і без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; задавайте
  `cdpUrl` явно лише для віддалених профілів CDP або приєднання до кінцевої точки existing-session.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після запуску процесу та `browser.localCdpReadyTimeoutMs` для
  готовності websocket CDP після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  запускається успішно, але перевірки готовності випереджають запуск. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: типовий браузер, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
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
      avatar: "CB", // емодзі, короткий текст, URL зображення або data URI
    },
  },
}
```

- `seamColor`: акцентний колір для chrome інтерфейсу нативного застосунку (відтінок бульбашки Talk Mode тощо).
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
      // password: "your-password", // або OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // для mode=trusted-proxy; див. /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // небезпечно: дозволити абсолютні зовнішні http(s) URL вбудовування
      // chatMessageMaxWidth: "min(1280px, 82%)", // необов’язкова максимальна ширина згрупованого повідомлення чату
      // allowedOrigins: ["https://control.example.com"], // потрібно для Control UI не через loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // небезпечний режим резервного визначення origin із заголовка Host
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
    // Необов’язково. Типово false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Необов’язково. Типово не задано/вимкнено.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Додаткові HTTP-заборони /tools/invoke
      deny: ["browser"],
      // Прибрати інструменти з типового списку HTTP-заборон для викликачів owner/admin
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

- `mode`: `local` (запустити Gateway) або `remote` (підключитися до віддаленого Gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає `127.0.0.1` всередині контейнера. За мережевого мосту Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому Gateway недоступний. Використовуйте `--network host` або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: типово обов’язкова. Не-loopback bind потребують автентифікації Gateway. На практиці це означає спільний токен/пароль або reverse proxy з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер onboarding типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRefs), явно задайте `gateway.auth.mode` як `token` або `password`. Запуск і потоки встановлення/ремонту сервісу завершуються помилкою, коли налаштовано обидва, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; це навмисно не пропонується в підказках onboarding.
- `gateway.auth.mode: "trusted-proxy"`: делегуйте автентифікацію браузера/користувача reverse proxy з урахуванням ідентичності та довіряйте заголовкам ідентичності з `gateway.trustedProxies` (див. [Автентифікація Trusted Proxy](/uk/gateway/trusted-proxy-auth)). Цей режим типово очікує джерело proxy **не loopback**; same-host loopback reverse proxies потребують явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні same-host викликачі можуть використовувати `gateway.auth.password` як локальний прямий fallback; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевіряється через `tailscale whois`). HTTP API endpoints **не** використовують цю автентифікацію заголовка Tailscale; натомість вони дотримуються звичайного HTTP-режиму автентифікації Gateway. Цей потік без токена припускає, що хост Gateway є довіреним. Типове значення `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих автентифікацій. Застосовується на IP клієнта й на scope автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні неправильні спроби від того самого клієнта можуть спрацювати на обмежувачі вже на другому запиті, а не пройти наввипередки як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово дорівнює `true`; задайте `false`, коли навмисно хочете обмежувати швидкість і для localhost-трафіку (для тестових налаштувань або строгих proxy-розгортань).
- Спроби WS-автентифікації з браузерного origin завжди throttle з вимкненим винятком loopback (захист у глибину від браузерного brute force localhost).
- На loopback ці lockout для браузерного origin ізольовані за нормалізованим значенням `Origin`, тому повторні невдачі з одного localhost origin не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, loopback bind) або `funnel` (публічний, потребує автентифікації).
- `tailscale.serviceName`: необов’язкова назва Tailscale Service для режиму Serve, наприклад `svc:openclaw`. Коли задано, OpenClaw передає її до `tailscale serve --service`, щоб Control UI можна було відкрити через іменований Service замість hostname пристрою. Значення має використовувати формат назви Service Tailscale `svc:<dns-label>`; запуск повідомляє похідний Service URL.
- `tailscale.preserveFunnel`: коли `true` і `tailscale.mode = "serve"`, OpenClaw перевіряє `tailscale funnel status` перед повторним застосуванням Serve під час запуску та пропускає його, якщо зовнішньо налаштований маршрут Funnel уже покриває порт Gateway. Типово `false`.
- `controlUi.allowedOrigins`: явний allowlist браузерних origin для WebSocket-підключень Gateway. Обов’язковий для публічних не-loopback браузерних origin. Приватні same-origin завантаження UI з LAN/Tailnet із loopback, RFC1918/link-local, `.local`, `.ts.net` або хостів Tailscale CGNAT приймаються без увімкнення fallback за Host-header.
- `controlUi.chatMessageMaxWidth`: необов’язкова максимальна ширина для згрупованих chat-повідомлень Control UI. Приймає обмежені значення ширини CSS, як-от `960px`, `82%`, `min(1280px, 82%)` і `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає fallback origin за Host-header для розгортань, що навмисно покладаються на політику origin за Host-header.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` `remote.url` має бути `wss://` для публічних хостів; plaintext `ws://` приймається лише для loopback, LAN, link-local, `.local`, `.ts.net` і хостів Tailscale CGNAT.
- `remote.remotePort`: порт Gateway на віддаленому SSH-хості. Типово `18789`; використовуйте це, коли локальний порт тунелю відрізняється від віддаленого порту Gateway.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Самі по собі вони не налаштовують автентифікацію Gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL для зовнішнього relay APNs, що використовується після того, як relay-backed iOS builds публікують реєстрації до Gateway. Публічні збірки App Store/TestFlight використовують hosted relay OpenClaw. Користувацькі URL relay мають відповідати навмисно окремому шляху iOS build/deployment, у якому URL relay вказує на цей relay.
- `gateway.push.apns.relay.timeoutMs`: timeout надсилання gateway-to-relay у мілісекундах. Типово `10000`.
- Relay-backed реєстрації делегуються конкретній ідентичності Gateway. Спарений iOS app отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію relay і пересилає grant надсилання, scoped до реєстрації, до Gateway. Інший Gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env overrides для конфігурації relay вище.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: development-only escape hatch для loopback HTTP URL relay. Production URL relay мають залишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: timeout pre-auth WebSocket handshake Gateway у мілісекундах. Типово: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли задано. Збільште це значення на завантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки startup warmup ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал health-monitor каналу у хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски health-monitor. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг stale-socket у хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на канал/account за rolling hour. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out на рівні каналу для перезапусків health-monitor, зберігаючи глобальний monitor увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override на рівні account для multi-account каналів. Коли задано, має пріоритет над override на рівні каналу.
- Локальні шляхи викликів Gateway можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не resolved, resolution fails closed (без маскування remote fallback).
- `trustedProxies`: IP reverse proxy, які завершують TLS або вставляють forwarded-client headers. Вказуйте лише proxy, які ви контролюєте. Loopback-записи все ще чинні для same-host proxy/local-detection налаштувань (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, Gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для fail-closed поведінки.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий CIDR/IP allowlist для автоматичного схвалення першого pairing пристрою node без запитаних scopes. Вимкнено, коли не задано. Це не auto-approve operator/browser/Control UI/WebChat pairing, а також не auto-approve upgrades ролі, scope, metadata або public-key.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне формування allow/deny для оголошених команд node після pairing і оцінки platform allowlist. Використовуйте `allowCommands`, щоб opt into небезпечні команди node, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` видаляє команду, навіть якщо platform default або явний allow інакше включив би її. Після того як node змінить свій оголошений список команд, відхиліть і повторно схваліть pairing цього пристрою, щоб Gateway зберіг оновлений snapshot команд.
- `gateway.tools.deny`: додаткові назви tool, заблоковані для HTTP `POST /tools/invoke` (розширює типовий deny list).
- `gateway.tools.allow`: видалити назви tool з типового HTTP deny list для owner/admin callers. Це не підвищує callers із identity-bearing `operator.write` до owner/admin access; `cron`, `gateway` і `nodes` залишаються недоступними для non-owner callers навіть у allowlist.

</Accordion>

### OpenAI-сумісні endpoints

- Admin HTTP RPC: типово вимкнено як Plugin `admin-http-rpc`. Увімкніть Plugin, щоб зареєструвати `POST /api/v1/admin/rpc`. Див. [Admin HTTP RPC](/uk/plugins/admin-http-rpc).
- Chat Completions: типово вимкнено. Увімкніть за допомогою `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-input для Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlists трактуються як unset; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false` і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути URL fetching.
- Необов’язковий header для посилення захисту response:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS origins, які ви контролюєте; див. [Автентифікація Trusted Proxy](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька Gateway на одному хості з унікальними портами та state dirs:

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

- `enabled`: вмикає TLS termination на listener Gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: auto-generates локальну self-signed пару cert/key, коли явні файли не налаштовано; лише для local/dev використання.
- `certPath`: шлях файлової системи до файлу TLS certificate.
- `keyPath`: шлях файлової системи до файлу TLS private key; тримайте permission-restricted.
- `caPath`: необов’язковий шлях CA bundle для client verification або custom trust chains.

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
  - `"hybrid"` (за замовчуванням): спочатку спробувати гаряче перезавантаження; за потреби повернутися до перезапуску.
- `debounceMs`: вікно усунення брязкоту в мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час очікування в мс для поточних операцій перед примусовим перезапуском або гарячим перезавантаженням каналу. Опустіть його, щоб використати стандартне обмежене очікування (`300000`); задайте `0`, щоб чекати безстроково й періодично журналювати попередження про все ще незавершені операції.

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

Примітки щодо перевірки та безпеки:

- `hooks.enabled=true` потребує непорожнього `hooks.token`.
- `hooks.token` має відрізнятися від активної автентифікації Gateway через спільний секрет (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); під час запуску журналюється некритичне попередження безпеки, якщо виявлено повторне використання.
- `openclaw security audit` позначає повторне використання автентифікації хуків/Gateway як критичну знахідку, включно з автентифікацією Gateway за паролем, наданою лише під час аудиту (`--auth password --password <password>`). Запустіть `openclaw doctor --fix`, щоб ротувати збережений повторно використаний `hooks.token`, а потім оновіть зовнішніх відправників хуків, щоб вони використовували новий токен хука.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад, `["hook:"]`).
- Якщо зіставлення або пресет використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі зіставлення не потребують такого явного ввімкнення.

**Кінцеві точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із корисного навантаження запиту приймається лише коли `hooks.allowRequestSessionKey=true` (за замовчуванням: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` зіставлення, зрендерені з шаблону, вважаються наданими ззовні й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` зіставляє підшлях після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле корисного навантаження для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читаються з корисного навантаження.
- `transform` може вказувати на модуль JS/TS, що повертає дію хука.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та обхід каталогів відхиляються).
  - Тримайте `hooks.transformsDir` у межах `~/.openclaw/hooks/transforms`; каталоги Skills робочого простору відхиляються. Якщо `openclaw doctor` повідомляє, що цей шлях недійсний, перемістіть модуль перетворення в каталог перетворень хуків або видаліть `hooks.transformsDir`.
- `agentId` маршрутизує до конкретного агента; невідомі ідентифікатори повертаються до агента за замовчуванням.
- `allowedAgentIds`: обмежує ефективну маршрутизацію агентів, включно зі шляхом агента за замовчуванням, коли `agentId` опущено (`*` або опущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сеансу для запусків агента хука без явного `sessionKey`.
- `allowRequestSessionKey`: дозволити викликачам `/hooks/agent` і ключам сеансів зіставлень, керованим шаблонами, задавати `sessionKey` (за замовчуванням: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + зіставлення), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-яке зіставлення або пресет використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` за замовчуванням має значення `last`.
- `model` перевизначає LLM для цього запуску хука (має бути дозволено, якщо каталог моделей задано).

</Accordion>

### Інтеграція Gmail

- Вбудований пресет Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібен `hooks.allowRequestSessionKey: false`, перевизначте пресет статичним `sessionKey` замість шаблонного значення за замовчуванням.

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
- Лише локально: тримайте `gateway.bind: "loopback"` (за замовчуванням).
- Прив’язки не до local loopback: маршрути canvas потребують автентифікації Gateway (токен/пароль/довірений проксі), як і інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки автентифікації; після сполучення та підключення вузла Gateway оголошує URL-адреси можливостей із областю дії вузла для доступу до canvas/A2UI.
- URL-адреси можливостей прив’язані до активного WS-сеансу вузла та швидко спливають. Резервний варіант на основі IP не використовується.
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

- `minimal` (за замовчуванням, коли ввімкнено вбудований Plugin `bonjour`): опускати `cliPath` + `sshPort` із TXT-записів.
- `full`: включати `cliPath` + `sshPort`; широкомовне оголошення LAN multicast усе ще потребує ввімкненого вбудованого Plugin `bonjour`.
- `off`: придушити широкомовне оголошення LAN multicast без зміни ввімкнення Plugin.
- Вбудований Plugin `bonjour` автоматично запускається на хостах macOS і вмикається явно на Linux, Windows і контейнеризованих розгортаннях Gateway.
- Ім’я хоста за замовчуванням дорівнює системному імені хоста, коли воно є дійсною DNS-міткою, інакше використовується `openclaw`. Перевизначте за допомогою `OPENCLAW_MDNS_HOSTNAME`.

### Глобальне (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує одноадресну зону DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднайте з DNS-сервером (рекомендовано CoreDNS) + Tailscale split DNS.

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

- Вбудовані змінні середовища застосовуються лише якщо в середовищі процесу відсутній відповідний ключ.
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний порядок пріоритетів див. у розділі [Середовище](/uk/help/environment).

### Підстановка змінних середовища

Посилайтеся на змінні середовища в будь-якому конфігураційному рядку за допомогою `${VAR_NAME}`:

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

Посилання на секрети є додатковими: відкриті текстові значення все ще працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Перевірка:

- Шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Шаблон `id` для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` для `source: "file"`: абсолютний JSON-вказівник (наприклад `"/providers/openai/apiKey"`)
- Шаблон `id` для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (підтримує селектори у стилі AWS `secret#json_key`)
- Ідентифікатори `source: "exec"` не повинні містити сегменти шляху, розділені скісними рисками, `.` або `..` (наприклад, `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних `openclaw.json`.
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
- Шляхи постачальників file і exec завершуються закрито, коли перевірка ACL Windows недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Постачальник `exec` вимагає абсолютного шляху `command` і використовує протокольні payload-и через stdin/stdout.
- За замовчуванням шляхи команд через символічні посилання відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи через символічні посилання з перевіркою розв’язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довіреного каталогу застосовується до розв’язаного цільового шляху.
- Дочірнє середовище `exec` за замовчуванням мінімальне; передавайте потрібні змінні явно за допомогою `passEnv`.
- Посилання на секрети розв’язуються під час активації в знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Фільтрація активної поверхні застосовується під час активації: нерозв’язані посилання на ввімкнених поверхнях спричиняють збій запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

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

- Профілі для кожного агента зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Застарілі пласкі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є форматом часу виконання; `openclaw doctor --fix` переписує їх у канонічні API-key-профілі `provider:default` із резервною копією `.legacy-flat.*.bak`.
- Профілі режиму OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні облікові дані часу виконання надходять із вирішених знімків у пам'яті; застарілі статичні записи `auth.json` очищаються після виявлення.
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

- `billingBackoffHours`: базова затримка в годинах, коли профіль завершується помилкою через справжні
  помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг може
  все одно потрапити сюди навіть у відповідях `401`/`403`, але текстові
  зіставлювачі, специфічні для провайдера, лишаються обмеженими провайдером, якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повідомлення HTTP `402`, придатні для повтору, про вікно використання або
  ліміти витрат організації/робочого простору лишаються в шляху `rate_limit`
  натомість.
- `billingBackoffHoursByProvider`: необов'язкові перевизначення годин затримки білінгу для окремих провайдерів.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання затримки білінгу (типово: `24`).
- `authPermanentBackoffMinutes`: базова затримка в хвилинах для високодостовірних збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: обмеження в хвилинах для зростання затримки `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, яке використовується для лічильників затримки (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок перевантаження перед переходом до резервної моделі (типово: `1`). Форми зайнятості провайдера, як-от `ModelNotReadyException`, потрапляють сюди.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile того самого провайдера для помилок ліміту частоти перед переходом до резервної моделі (типово: `1`). Цей кошик ліміту частоти включає текст у формі провайдера, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `maxFileBytes`: максимальний розмір активного файла журналу в байтах перед ротацією (додатне ціле число; типово: `104857600` = 100 МБ). OpenClaw зберігає до п'яти нумерованих архівів поруч з активним файлом.
- `redactSensitive` / `redactPatterns`: маскування за принципом найкращих зусиль для консольного виводу, файлових журналів, записів журналу OTLP і збереженого тексту стенограми сесії. `redactSensitive: "off"` вимикає лише цю загальну політику журналів/стенограм; поверхні безпеки UI/інструментів/діагностики все одно редагують секрети перед випуском.

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
- `flags`: масив рядків прапорців, які вмикають цільовий вивід журналу (підтримує шаблони на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку без прогресу в мс для класифікації довготривалих сесій обробки як `session.long_running`, `session.stalled` або `session.stuck`. Відповідь, інструмент, статус, блок і прогрес ACP скидають таймер; повторна діагностика `session.stuck` відступає, доки стан не змінюється.
- `stuckSessionAbortMs`: поріг віку без прогресу в мс, після якого придатну завислу активну роботу можна аварійно злити для відновлення. Якщо не задано, OpenClaw використовує безпечніше розширене вікно вбудованого запуску щонайменше 5 хвилин і 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: захоплює відредагований знімок стабільності перед OOM, коли тиск пам'яті досягає `critical` (типово: `false`). Установіть `true`, щоб додати сканування/запис файла пакета стабільності, зберігаючи звичайні події тиску пам'яті.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. в [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов'язкові кінцеві точки OTLP для окремих сигналів. Якщо задано, вони перевизначають `otel.endpoint` лише для цього сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт трасування, метрик або журналів.
- `otel.logsExporter`: приймач експорту журналів: `"otlp"` (типово), `"stdout"` для одного JSON-об'єкта на рядок stdout або `"both"`.
- `otel.sampleRate`: частота семплювання трасування `0`-`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання телеметрії в мс.
- `otel.captureContent`: добровільне захоплення сирого вмісту для атрибутів span OTEL. Типово вимкнено. Булеве `true` захоплює несистемний вміст повідомлень/інструментів; форма об'єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` і `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: змінна середовища для найновішої експериментальної форми span виведення GenAI, включно з назвами span `{gen_ai.operation.name} {gen_ai.request.model}`, видом span `CLIENT` і `gen_ai.provider.name` замість застарілого `gen_ai.system`. Типово spans зберігають `openclaw.model.call` і `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: змінна середовища для хостів, які вже зареєстрували глобальний SDK OpenTelemetry. Тоді OpenClaw пропускає запуск/завершення SDK, що належить Plugin, зберігаючи діагностичні слухачі активними.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: змінні середовища кінцевих точок для окремих сигналів, які використовуються, коли відповідний ключ конфігурації не задано.
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

- `channel`: канал випусків для встановлень npm/git - `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску Gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для встановлень пакетів (типово: `false`).
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

- `enabled`: глобальний перемикач функції ACP (типово: `true`; установіть `false`, щоб приховати dispatch ACP і можливості spawn).
- `dispatch.enabled`: незалежний перемикач для dispatch ходу сесії ACP (типово: `true`). Установіть `false`, щоб команди ACP залишалися доступними, але виконання блокувалося.
- `backend`: ідентифікатор типового backend часу виконання ACP (має відповідати зареєстрованому Plugin часу виконання ACP).
  Спочатку встановіть backend Plugin, і якщо задано `plugins.allow`, включіть ідентифікатор backend Plugin (наприклад `acpx`), інакше backend ACP не завантажиться.
- `defaultAgent`: резервний ідентифікатор цільового агента ACP, коли spawns не вказують явну ціль.
- `allowedAgents`: allowlist ідентифікаторів агентів, дозволених для сесій часу виконання ACP; порожній список означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно скидання простою в мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед поділом проєкції потокового блока.
- `stream.repeatSuppression`: придушувати повторювані рядки статусу/інструментів за хід (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потоково інкрементально; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, спроєктованих за хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для спроєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів до булевих перевизначень видимості для потокових подій.
- `runtime.ttlMinutes`: TTL простою в хвилинах для воркерів сесій ACP перед придатним очищенням.
- `runtime.installCommand`: необов'язкова команда встановлення, яку потрібно виконати під час початкового налаштування середовища часу виконання ACP.

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
  - `"random"` (типово): ротація кумедних/сезонних слоганів.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), установіть env `OPENCLAW_HIDE_BANNER=1`.

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
  },
}
```

---

## Ідентичність

Див. поля ідентичності `agents.list` у розділі [Типові параметри агентів](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застарілий, вилучено)

Поточні збірки більше не містять TCP-міст. Вузли підключаються через Gateway WebSocket. Ключі `bridge.*` більше не є частиною схеми конфігурації (перевірка не проходить, доки їх не вилучити; `openclaw doctor --fix` може прибрати невідомі ключі).

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

- `sessionRetention`: скільки часу зберігати завершені ізольовані сеанси запусків cron перед обрізанням із `sessions.json`. Також керує очищенням архівованих видалених стенограм cron. Типово: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: приймається для сумісності зі старішими файловими журналами запусків cron. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки історії запусків SQLite, що зберігаються для кожного завдання. Типово: `2000`.
- `webhookToken`: bearer-токен, який використовується для доставки POST cron webhook (`delivery.mode = "webhook"`); якщо пропущено, заголовок автентифікації не надсилається.
- `webhook`: застарілий резервний URL webhook (http/https), який `openclaw doctor --fix` використовує для міграції збережених завдань, що все ще мають `notify: true`; виконання під час роботи використовує для кожного завдання `delivery.mode="webhook"` плюс `delivery.to` або `delivery.completionDestination`, коли зберігається доставка оголошення.

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
- `backoffMs`: масив затримок відступу в мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1-10 записів).
- `retryOn`: типи помилок, які запускають повторні спроби - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати всі тимчасові типи.

Одноразові завдання залишаються ввімкненими, доки спроби повторення не буде вичерпано, а потім вимикаються зі збереженням кінцевого стану помилки. Повторювані завдання використовують ту саму політику повторення тимчасових помилок, щоб запуститися знову після відступу перед наступним запланованим слотом; постійні помилки або вичерпані повторні спроби тимчасових помилок повертаються до звичайного розкладу повторення з відступом помилки.

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
- `includeSkipped`: зараховувати послідовні пропущені запуски до порогу сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на відступ помилок виконання.
- `mode`: режим доставки - `"announce"` надсилає через повідомлення каналу; `"webhook"` публікує в налаштований webhook.
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

- Типове призначення для сповіщень про збої cron у всіх завданнях.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли існує достатньо цільових даних.
- `channel`: перевизначення каналу для доставки оголошення. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль оголошення або URL webhook. Обов’язково для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли не встановлено ні глобальне призначення збою, ні призначення збою для окремого завдання, завдання, які вже доставляються через `announce`, у разі збою повертаються до цієї основної цілі оголошення.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не є `"webhook"`.

Див. [Завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблонів медіамоделей

Заповнювачі шаблону, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повний вхідний текст повідомлення                 |
| `{{RawBody}}`      | Необроблений текст (без обгорток історії/відправника) |
| `{{BodyStripped}}` | Текст із вилученими згадками групи                |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | ID повідомлення каналу                            |
| `{{SessionId}}`    | Поточний UUID сеансу                              |
| `{{IsNewSession}}` | `"true"`, коли створено новий сеанс               |
| `{{MediaUrl}}`     | Вхідний псевдо-URL медіа                          |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (зображення/аудіо/документ/…)           |
| `{{Transcript}}`   | Аудіостенограма                                   |
| `{{Prompt}}`       | Вирішений медіапромпт для записів CLI             |
| `{{MaxChars}}`     | Вирішена максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (найкраща спроба)                      |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (найкраща спроба) |
| `{{SenderName}}`   | Відображуване ім’я відправника (найкраща спроба)  |
| `{{SenderE164}}`   | Номер телефону відправника (найкраща спроба)      |
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
- Шляхи: вирішуються відносно файла, який виконує включення, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми/форми `../` дозволені лише тоді, коли вони все одно вирішуються всередині цієї межі. Шляхи не мають містити нульових байтів і мають бути строго коротшими за 4096 символів до й після вирішення.
- Записи, що належать OpenClaw і змінюють лише один розділ верхнього рівня, підкріплений включенням одного файла, записують зміни наскрізно в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, що належать OpenClaw; такі записи завершуються закритою відмовою замість сплющення конфігурації.
- Помилки: чіткі повідомлення для відсутніх файлів, помилок аналізу, циклічних включень, недійсного формату шляху та надмірної довжини.

---

_Пов’язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язано

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
