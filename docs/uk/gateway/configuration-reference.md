---
read_when:
    - Вам потрібна точна семантика конфігурації на рівні полів або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на спеціалізовані довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-07-02T01:14:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d15cc968bc89a7a490a5eaf571d5f38d052ad8783fcc7de5ca17d08ac04bfcc7
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Довідник основної конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Конфігурація](/uk/gateway/configuration).

Охоплює основні поверхні конфігурації OpenClaw і посилається на окремі сторінки, коли підсистема має власний глибший довідник. Каталоги команд, що належать каналам і plugin-ам, а також глибокі параметри пам’яті/QMD розміщені на власних сторінках, а не тут.

Джерело істини в коді:

- `openclaw config schema` друкує актуальну JSON Schema, що використовується для валідації та Control UI, з об’єднаними метаданими вбудованих/plugin/каналів, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми з прив’язкою до шляху для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий хеш документації конфігурації відносно поточної поверхні схеми

Шлях пошуку агента: використовуйте дію інструмента `gateway` `config.schema.lookup` для
точної документації та обмежень на рівні полів перед редагуванням. Використовуйте
[Конфігурація](/uk/gateway/configuration) для настанов, орієнтованих на завдання, а цю сторінку
для ширшої мапи полів, типових значень і посилань на довідники підсистем.

Окремі глибокі довідники:

- [Довідник конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash-команди](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідних каналів/plugin-ів для специфічних для каналів поверхонь команд

Формат конфігурації — **JSON5** (дозволені коментарі та кінцеві коми). Усі поля необов’язкові - OpenClaw використовує безпечні типові значення, коли їх пропущено.

---

## Канали

Ключі конфігурації для окремих каналів перенесено на окрему сторінку - див.
[Конфігурація - канали](/uk/gateway/config-channels) для `channels.*`,
зокрема Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших
bundled каналів (автентифікація, контроль доступу, кілька облікових записів, шлюз згадок).

## Типові налаштування агента, multi-agent, сесії та повідомлення

Перенесено на окрему сторінку - див.
[Конфігурація - агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робоча область, модель, мислення, heartbeat, пам’ять, медіа, skills, sandbox)
- `multiAgent.*` (маршрутизація та прив’язки multi-agent)
- `session.*` (життєвий цикл сесії, compaction, pruning)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.consultThinkingLevel`: перевизначення рівня мислення для повного запуску агента OpenClaw за realtime-консультаціями Control UI Talk
  - `talk.consultFastMode`: одноразове перевизначення fast-mode для realtime-консультацій Control UI Talk
  - `talk.speechLocale`: необов’язковий ідентифікатор локалі BCP 47 для розпізнавання мовлення Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає типове для платформи вікно паузи перед надсиланням transcript (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback relay Gateway для фіналізованих realtime transcript-ів Talk, які пропускають `openclaw_agent_consult`

## Інструменти та користувацькі провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів на базі провайдерів і налаштування користувацького
провайдера / base-URL перенесені на окрему сторінку - див.
[Конфігурація - інструменти та користувацькі провайдери](/uk/gateway/config-tools).

## Моделі

Визначення провайдерів, allowlist моделей і налаштування користувацьких провайдерів описані в
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
- `models.providers`: мапа користувацьких провайдерів із ключами за id провайдера.
- `models.providers.*.localService`: необов’язковий process manager на вимогу для
  локальних серверів моделей. OpenClaw перевіряє налаштований health endpoint, запускає
  абсолютну `command` за потреби, чекає готовності, а потім надсилає запит до моделі.
  Див. [Локальні сервіси моделей](/uk/gateway/local-model-services).
- `models.pricing.enabled`: керує фоновим pricing bootstrap, який
  запускається після того, як sidecar-и та канали досягають ready-шляху Gateway. Коли `false`,
  Gateway пропускає отримання pricing-каталогів OpenRouter і LiteLLM; налаштовані
  значення `models.providers.*.models[].cost` і надалі працюють для локальних оцінок вартості.

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

- `mcp.servers`: іменовані визначення stdio або remote MCP-серверів для runtime-ів, які
  надають налаштовані MCP-інструменти.
  Remote entries використовують `transport: "streamable-http"` або `transport: "sse"`;
  `type: "http"` — це CLI-native alias, який `openclaw mcp set` і
  `openclaw doctor --fix` нормалізують у канонічне поле `transport`.
- `mcp.servers.<name>.enabled`: задайте `false`, щоб зберегти визначення сервера,
  але виключити його з discovery MCP вбудованого OpenClaw і проєкції інструментів.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout MCP-запиту для окремого сервера
  у секундах або мілісекундах.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout підключення для окремого сервера
  у секундах або мілісекундах.
- `mcp.servers.<name>.supportsParallelToolCalls`: необов’язкова підказка щодо concurrency для
  адаптерів, які можуть вибирати, чи виконувати паралельні виклики MCP-інструментів.
- `mcp.servers.<name>.auth`: задайте `"oauth"` для HTTP MCP-серверів, які вимагають
  OAuth. Запустіть `openclaw mcp login <name>`, щоб зберегти токени у стані OpenClaw.
- `mcp.servers.<name>.oauth`: необов’язкові перевизначення scope OAuth, redirect URL і client
  metadata URL.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: елементи керування HTTP TLS
  для private endpoint-ів і mutual TLS.
- `mcp.servers.<name>.toolFilter`: необов’язковий вибір інструментів для окремого сервера. `include`
  обмежує знайдені MCP-інструменти іменами, що збігаються; `exclude` приховує імена,
  що збігаються. Entries — це точні імена MCP-інструментів або прості glob-и `*`. Сервери з
  resources або prompts також генерують імена utility tool-ів (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), і ці імена використовують
  той самий фільтр.
- `mcp.servers.<name>.codex`: необов’язкові елементи керування проєкцією Codex app-server.
  Цей блок є метаданими OpenClaw лише для потоків Codex app-server; він не
  впливає на ACP-сесії, generic Codex harness config або інші runtime-адаптери.
  Непорожній `codex.agents` обмежує сервер переліченими id агентів OpenClaw.
  Порожні, blank або недійсні scoped списки агентів відхиляються валідацією конфігурації
  та пропускаються runtime-шляхом проєкції замість того, щоб ставати глобальними.
  `codex.defaultToolsApprovalMode` виводить нативний для Codex
  `default_tools_approval_mode` для цього сервера. OpenClaw видаляє блок `codex`
  перед передаванням нативної конфігурації `mcp_servers` до Codex. Пропустіть блок, щоб
  зберегти проєкцію сервера для кожного агента Codex app-server із типовою
  поведінкою схвалення MCP у Codex.
- `mcp.sessionIdleTtlMs`: idle TTL для session-scoped bundled MCP runtime-ів.
  One-shot embedded runs запитують cleanup наприкінці запуску; цей TTL є backstop для
  довготривалих сесій і майбутніх callers.
- Зміни в `mcp.*` hot-apply шляхом disposing cached session MCP runtime-ів.
  Наступне discovery/use інструмента створює їх заново з нової конфігурації, тому видалені
  entries `mcp.servers` прибираються негайно, а не чекають idle TTL.
- Runtime discovery також враховує сповіщення про зміну списку MCP-інструментів, скидаючи
  cached catalog для цієї сесії. Сервери, які оголошують resources або
  prompts, отримують utility tools для listing/reading resources і listing/fetching
  prompts. Повторні failures tool-call-ів ненадовго ставлять affected server на паузу перед
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
- `load.extraDirs`: додаткові спільні корені skill-ів (найнижчий precedence).
- `load.allowSymlinkTargets`: довірені real target roots, у які symlink-и skill-ів можуть
  resolve, коли link розміщений поза налаштованим source root.
- `workshop.allowSymlinkTargetWrites`: дозволяє Skill Workshop apply писати
  через уже довірені symlink targets (типово: false).
- `install.preferBrew`: коли true, віддавати перевагу Homebrew installer-ам, коли `brew`
  доступний, перед fallback до інших типів installer-ів.
- `install.nodeManager`: перевага node installer для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: дозволити довіреним Gateway-клієнтам `operator.admin`
  встановлювати private zip-archives, staged через `skills.upload.*`
  (типово: false). Це вмикає лише шлях uploaded-archive; звичайні встановлення ClawHub
  цього не потребують.
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручність для skills, що оголошують primary env var (plaintext string або SecretRef object).

---

## Plugin-и

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

- Завантажується з каталогів пакетів або bundle у `~/.openclaw/extensions` і `<workspace>/.openclaw/extensions`, а також із файлів або каталогів, перелічених у `plugins.load.paths`.
- Розміщуйте автономні файли plugin у `plugins.load.paths`; автоматично виявлені корені розширень ігнорують файли `.js`, `.mjs` і `.ts` верхнього рівня, щоб допоміжні скрипти в цих коренях не блокували запуск.
- Виявлення приймає нативні plugins OpenClaw, а також сумісні bundle Codex і bundle Claude, зокрема bundle Claude зі стандартною структурою без маніфеста.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий список дозволених plugin (завантажуються лише перелічені plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа рівня plugin (коли підтримується plugin).
- `plugins.entries.<id>.env`: мапа змінних середовища в межах plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` і ігнорує поля, що змінюють prompt, із застарілого `before_agent_start`, зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних хуків plugin і підтримуваних каталогів хуків, наданих bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: коли `true`, довірені не-bundled plugins можуть читати необроблений вміст розмови з типізованих хуків, як-от `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` і `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довірити цьому plugin запитувати перевизначення `provider` і `model` для кожного запуску фонових subagent-запусків.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowModelOverride`: явно довірити цьому plugin запитувати перевизначення моделі для `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених перевизначень завершення LLM plugin. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: явно довірити цьому plugin запускати `api.runtime.llm.complete` для нестандартного id агента.
- `plugins.entries.<id>.config`: визначений plugin об’єкт конфігурації (перевіряється схемою нативного plugin OpenClaw, коли доступна).
- Налаштування облікового запису/середовища виконання channel plugin розміщуються в `channels.<id>` і мають описуватися метаданими `channelConfigs` маніфеста plugin-власника, а не центральним реєстром опцій OpenClaw.

### Конфігурація Codex harness plugin

Вбудований plugin `codex` володіє налаштуваннями нативного Codex app-server harness у
`plugins.entries.codex.config`. Див.
[довідник Codex harness](/uk/plugins/codex-harness-reference) для повної поверхні
конфігурації та [Codex harness](/uk/plugins/codex-harness) для моделі runtime.

`codexPlugins` застосовується лише до сеансів, які вибирають нативний Codex harness.
Він не вмикає plugins Codex для запусків провайдера OpenClaw, прив’язок розмов ACP
або будь-якого не-Codex harness.

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
  plugin/app Codex для Codex harness. Типове значення: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  типова політика деструктивних дій для перенесених запитів plugin app.
  Використовуйте `true`, щоб приймати безпечні схеми схвалення Codex без запиту, `false`,
  щоб відхиляти їх, `"auto"`, щоб спрямовувати потрібні Codex схвалення через схвалення
  plugin OpenClaw, або `"ask"`, щоб запитувати кожну дію запису/деструктивну дію plugin
  без сталого схвалення. Режим `"ask"` очищає сталі перевизначення схвалень Codex
  для кожного інструмента в зачепленому app і вибирає людського
  рецензента схвалень для цього app перед стартом потоку Codex.
  Типове значення: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: вмикає
  перенесений запис plugin, коли глобальний `codexPlugins.enabled` також true.
  Типове значення: `true` для явних записів.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  стабільна ідентичність marketplace. V1 підтримує лише `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: стабільна
  ідентичність Codex plugin із міграції, наприклад `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  перевизначення деструктивних дій для окремого plugin. Якщо пропущено, використовується глобальне
  значення `allow_destructive_actions`. Значення для окремого plugin приймає ті самі
  політики `true`, `false`, `"auto"` або `"ask"`.

Кожен допущений plugin app, що використовує `"ask"`, спрямовує запити схвалення цього app
до людського рецензента. Інші apps і не-app схвалення потоків зберігають свого
налаштованого рецензента, тож змішані політики plugin не успадковують поведінку `"ask"`.

`codexPlugins.enabled` — це глобальна директива ввімкнення. Явні записи plugin,
записані міграцією, є сталим набором встановлення та придатності до ремонту.
`plugins["*"]` не підтримується, перемикача `install` немає, а локальні
значення `marketplacePath` навмисно не є полями конфігурації, бо вони
залежні від хоста.

Перевірки готовності `app/list` кешуються на одну годину та оновлюються
асинхронно, коли застарівають. Конфігурація app потоку Codex обчислюється під час
встановлення сеансу Codex harness, а не на кожному ході; використовуйте `/new`, `/reset` або перезапуск
gateway після зміни нативної конфігурації plugin.

- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера веб-отримання Firecrawl.
  - `apiKey`: необов’язковий API-ключ Firecrawl для вищих лімітів (приймає SecretRef). Резервно використовує `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілий `tools.web.fetch.firecrawl.apiKey` або змінну середовища `FIRECRAWL_API_KEY`.
  - `baseUrl`: базова URL-адреса API Firecrawl (типово: `https://api.firecrawl.dev`; self-hosted перевизначення мають вказувати на приватні/внутрішні endpoints).
  - `onlyMainContent`: витягувати зі сторінок лише основний вміст (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту scraping у секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) для фаз і порогів.
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: cron-частота для кожного повного проходу dreaming (типово `"0 3 * * *"`).
  - `model`: необов’язкове перевизначення моделі subagent Dream Diary. Потребує `plugins.entries.memory-core.subagent.allowModelOverride: true`; поєднуйте з `allowedModels`, щоб обмежити цілі. Помилки недоступності моделі повторюються один раз із типовою моделлю сеансу; збої довіри або allowlist не мають тихого fallback.
  - політика фаз і пороги є деталями реалізації (не user-facing ключами конфігурації).
- Повна конфігурація пам’яті міститься в [довіднику конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені bundle plugins Claude також можуть додавати вбудовані типові значення OpenClaw із `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як необроблені patches конфігурації OpenClaw.
- `plugins.slots.memory`: виберіть id активного memory plugin або `"none"`, щоб вимкнути memory plugins.
- `plugins.slots.contextEngine`: виберіть id активного context engine plugin; типово `"legacy"`, якщо ви не встановите й не виберете інший engine.

Див. [Plugins](/uk/tools/plugin).

---

## Зобов’язання

`commitments` керує виведеною follow-up пам’яттю: OpenClaw може виявляти check-ins із ходів розмови та доставляти їх через Heartbeat-запуски.

- `commitments.enabled`: увімкнути приховане LLM-витягання, зберігання та Heartbeat-доставку для виведених follow-up зобов’язань. Типове значення: `false`.
- `commitments.maxPerDay`: максимальна кількість виведених follow-up зобов’язань, доставлених за сеанс агента протягом рухомого дня. Типове значення: `3`.

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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо значення не задано, тому навігація браузера типово лишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте навігації браузера приватною мережею.
- У суворому режимі віддалені кінцеві точки профілю CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі підтримують лише приєднання (запуск/зупинка/скидання вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL DevTools WebSocket.
- `remoteCdpTimeoutMs` і `remoteCdpHandshakeTimeoutMs` застосовуються до віддаленої та
  `attachOnly` доступності CDP, а також до запитів відкриття вкладок. Керовані профілі
  loopback зберігають локальні типові значення CDP.
- Якщо зовнішньо керована служба CDP доступна через loopback, задайте для цього
  профілю `attachOnly: true`; інакше OpenClaw розглядатиме порт loopback як
  локальний керований профіль браузера й може повідомляти про помилки володіння локальним портом.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть приєднуватися на
  вибраному хості або через підключений вузол браузера.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на основі Chromium, як-от Brave або Edge.
- Профілі `existing-session` можуть задавати `cdpUrl`, коли Chrome уже запущено
  за кінцевою точкою виявлення DevTools HTTP(S) або прямою кінцевою точкою WS(S). У цьому
  режимі OpenClaw передає кінцеву точку до Chrome MCP замість автоматичного підключення;
  `userDataDir` ігнорується для аргументів запуску Chrome MCP.
- Профілі `existing-session` зберігають поточні обмеження маршрутів Chrome MCP:
  дії на основі знімків/ref замість націлювання CSS-селекторами, хуки завантаження
  одного файлу, без перевизначень тайм-аутів діалогів, без `wait --load networkidle` і без
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; задавайте
  `cdpUrl` явно лише для віддалених профілів CDP або приєднання до кінцевої точки existing-session.
- Локальні керовані профілі можуть задавати `executablePath`, щоб перевизначити глобальний
  `browser.executablePath` для цього профілю. Використовуйте це, щоб запускати один профіль у
  Chrome, а інший у Brave.
- Локальні керовані профілі використовують `browser.localLaunchTimeoutMs` для HTTP-виявлення Chrome CDP
  після старту процесу та `browser.localCdpReadyTimeoutMs` для
  готовності CDP websocket після запуску. Збільшуйте їх на повільніших хостах, де Chrome
  запускається успішно, але перевірки готовності змагаються зі стартом. Обидва значення мають бути
  додатними цілими числами до `120000` мс; недійсні значення конфігурації відхиляються.
- Порядок автовиявлення: типовий браузер, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` і `browser.profiles.<name>.executablePath` обидва
  приймають `~` і `~/...` для домашнього каталогу вашої ОС перед запуском Chromium.
  `userDataDir` для окремого профілю в профілях `existing-session` також розгортається з тильди.
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

- `seamColor`: акцентний колір для хрому інтерфейсу нативного застосунку (відтінок бульбашки Talk Mode тощо).
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

<Accordion title="Відомості про поля Gateway">

- `mode`: `local` (запустити gateway) або `remote` (під’єднатися до віддаленого gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хостів (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає `127.0.0.1` всередині контейнера. З мережевим мостом Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому gateway недоступний. Використовуйте `--network host` або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: типово обов’язкова. Bind не на loopback вимагають автентифікації gateway. На практиці це означає спільний токен/пароль або identity-aware reverse proxy з `gateway.auth.mode: "trusted-proxy"`. Майстер onboarding типово генерує токен.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема SecretRefs), явно задайте `gateway.auth.mode` як `token` або `password`. Потоки запуску та встановлення/ремонту сервісу завершуються помилкою, коли налаштовано обидва, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; onboarding prompts навмисно не пропонують цей режим.
- `gateway.auth.mode: "trusted-proxy"`: делегуйте автентифікацію браузера/користувача identity-aware reverse proxy і довіряйте заголовкам ідентичності від `gateway.trustedProxies` (див. [Довірена автентифікація через проксі](/uk/gateway/trusted-proxy-auth)). Цей режим типово очікує джерело проксі **не на loopback**; same-host loopback reverse proxies вимагають явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутрішні same-host callers можуть використовувати `gateway.auth.password` як локальний прямий fallback; `gateway.auth.token` залишається взаємовиключним із режимом trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію Control UI/WebSocket (перевірено через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію через заголовки Tailscale; натомість вони дотримуються звичайного HTTP-режиму автентифікації gateway. Цей потік без токена припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб автентифікації. Застосовується для кожного IP клієнта й кожної області автентифікації (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Control UI Tailscale Serve невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом помилки. Тому одночасні невдалі спроби від того самого клієнта можуть спрацювати обмежувачем уже на другому запиті, замість того щоб обидві пройшли паралельно як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; задайте `false`, коли навмисно хочете обмежувати частоту й для localhost-трафіку (для тестових налаштувань або суворих proxy deployments).
- Спроби автентифікації WS із browser-origin завжди обмежуються з вимкненим винятком для loopback (defense-in-depth проти браузерного перебору localhost).
- На loopback ці блокування browser-origin ізольовані для кожного нормалізованого значення `Origin`, тому повторні помилки з одного localhost origin не блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind на loopback) або `funnel` (публічний, вимагає автентифікації).
- `tailscale.serviceName`: необов’язкова назва Tailscale Service для режиму Serve, наприклад `svc:openclaw`. Коли задано, OpenClaw передає її в `tailscale serve
--service`, щоб Control UI можна було оприлюднити через іменований Service замість hostname пристрою. Значення має використовувати формат назви Service Tailscale `svc:<dns-label>`; під час запуску повідомляється похідний URL Service.
- `tailscale.preserveFunnel`: коли `true` і `tailscale.mode = "serve"`, OpenClaw перевіряє `tailscale funnel status` перед повторним застосуванням Serve під час запуску й пропускає його, якщо зовнішньо налаштований маршрут Funnel уже покриває порт gateway. Типово `false`.
- `controlUi.allowedOrigins`: явний allowlist browser-origin для підключень Gateway WebSocket. Потрібний для публічних browser origins не на loopback. Приватні same-origin LAN/Tailnet завантаження UI з loopback, RFC1918/link-local, `.local`, `.ts.net` або Tailscale CGNAT hosts приймаються без увімкнення Host-header fallback.
- `controlUi.chatMessageMaxWidth`: необов’язкова максимальна ширина для згрупованих повідомлень чату Control UI. Приймає обмежені значення CSS width, як-от `960px`, `82%`, `min(1280px, 82%)` і `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, що вмикає Host-header origin fallback для deployments, які навмисно покладаються на Host-header origin policy.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` `remote.url` має бути `wss://` для публічних хостів; plaintext `ws://` приймається лише для loopback, LAN, link-local, `.local`, `.ts.net` і Tailscale CGNAT hosts.
- `remote.remotePort`: порт gateway на віддаленому SSH-хості. Типово `18789`; використовуйте це, коли локальний порт тунелю відрізняється від віддаленого порту gateway.
- `gateway.remote.token` / `.password` — це поля облікових даних remote-client. Самі по собі вони не налаштовують автентифікацію gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL для зовнішнього APNs relay, що використовується після того, як relay-backed iOS builds публікують реєстрації в gateway. Публічні збірки App Store/TestFlight використовують hosted OpenClaw relay. Власні URL relay мають відповідати навмисно окремому iOS build/deployment path, чий relay URL вказує на цей relay.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від gateway до relay у мілісекундах. Типово `10000`.
- Relay-backed registrations делегуються конкретній ідентичності gateway. Спарений iOS app отримує `gateway.identity.get`, включає цю ідентичність у relay registration і пересилає gateway scoped-to-registration grant на надсилання. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env overrides для конфігурації relay вище.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: development-only escape hatch для loopback HTTP relay URLs. Production relay URLs мають залишатися на HTTPS.
- `gateway.handshakeTimeoutMs`: тайм-аут pre-auth Gateway WebSocket handshake у мілісекундах. Типово: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` має пріоритет, коли задано. Збільште це значення на завантажених або малопотужних хостах, де локальні клієнти можуть підключатися, поки startup warmup ще стабілізується.
- `gateway.channelHealthCheckMinutes`: інтервал channel health-monitor у хвилинах. Задайте `0`, щоб глобально вимкнути перезапуски health-monitor. Типово: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг stale-socket у хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. Типово: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor для каналу/облікового запису за rolling hour. Типово: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out на рівні каналу для перезапусків health-monitor, залишаючи глобальний монітор увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення на рівні облікового запису для multi-account channels. Коли задано, має пріоритет над перевизначенням на рівні каналу.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як fallback лише коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не resolved, resolution fails closed (без маскування remote fallback).
- `trustedProxies`: IP reverse proxy, які завершують TLS або додають forwarded-client headers. Указуйте лише проксі, які контролюєте. Loopback entries усе ще valid для same-host proxy/local-detection setups (наприклад Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback requests eligible для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типово `false` для fail-closed поведінки.
- `gateway.nodes.pairing.autoApproveCidrs`: необов’язковий CIDR/IP allowlist для auto-approving first-time node device pairing без requested scopes. Вимкнено, коли не задано. Це не auto-approve operator/browser/Control UI/WebChat pairing і не auto-approve role, scope, metadata або public-key upgrades.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальне allow/deny shaping для declared node commands після pairing і platform allowlist evaluation. Використовуйте `allowCommands`, щоб opt into dangerous node commands, як-от `camera.snap`, `camera.clip` і `screen.record`; `denyCommands` прибирає команду, навіть якщо platform default або explicit allow інакше включали б її. Після того як node змінює свій declared command list, відхиліть і повторно approve цей device pairing, щоб gateway зберіг оновлений command snapshot.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий deny list).
- `gateway.tools.allow`: прибрати назви інструментів із типового HTTP deny list для owner/admin callers. Це не підвищує identity-bearing `operator.write` callers до owner/admin access; `cron`, `gateway` і `nodes` залишаються недоступними для non-owner callers, навіть коли вони в allowlist.

</Accordion>

### Кінцеві точки, сумісні з OpenAI

- Admin HTTP RPC: типово вимкнено як Plugin `admin-http-rpc`. Увімкніть Plugin, щоб зареєструвати `POST /api/v1/admin/rpc`. Див. [Admin HTTP RPC](/uk/plugins/admin-http-rpc).
- Chat Completions: типово вимкнено. Увімкніть за допомогою `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-вводу для Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlists вважаються незаданими; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути URL fetching.
- Необов’язковий заголовок посилення захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS origins, які контролюєте; див. [Довірена автентифікація через проксі](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох інстансів

Запускайте кілька gateways на одному хості з унікальними портами та state dirs:

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

- `enabled`: вмикає TLS termination на listener gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну self-signed пару cert/key, коли явні файли не налаштовано; лише для local/dev використання.
- `certPath`: шлях файлової системи до файлу TLS-сертифіката.
- `keyPath`: шлях файлової системи до файлу приватного ключа TLS; тримайте доступ обмеженим.
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
  - `"restart"`: завжди перезапускати процес gateway після зміни конфігурації.
  - `"hot"`: застосовувати зміни всередині процесу без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати гаряче перезавантаження; за потреби повернутися до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: необов’язковий максимальний час у мс очікування операцій, що виконуються, перед примусовим перезапуском або гарячим перезавантаженням каналу. Опустіть його, щоб використати типове обмежене очікування (`300000`); задайте `0`, щоб чекати необмежено довго й періодично записувати попередження про операції, які все ще очікують.

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
- `hooks.token` має відрізнятися від активної автентифікації спільним секретом Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); під час запуску записується некритичне попередження безпеки, якщо виявлено повторне використання.
- `openclaw security audit` позначає повторне використання автентифікації hook/Gateway як критичну знахідку, зокрема автентифікацію Gateway паролем, надану лише під час аудиту (`--auth password --password <password>`). Запустіть `openclaw doctor --fix`, щоб ротувати збережений повторно використаний `hooks.token`, а потім оновіть зовнішніх відправників хуків, щоб вони використовували новий токен хуків.
- `hooks.path` не може бути `/`; використовуйте виділений підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад, `["hook:"]`).
- Якщо зіставлення або preset використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі зіставлення не потребують такого явного ввімкнення.

**Ендпоїнти:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із payload запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` зіставлення, відрендерені з шаблону, вважаються наданими ззовні й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Подробиці зіставлення">

- `match.path` зіставляє підшлях після `/hooks` (наприклад, `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з payload.
- `transform` може вказувати на JS/TS-модуль, що повертає дію хуку.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи й обхід каталогів відхиляються).
  - Тримайте `hooks.transformsDir` у `~/.openclaw/hooks/transforms`; каталоги Skills робочої області відхиляються. Якщо `openclaw doctor` повідомляє, що цей шлях недійсний, перемістіть модуль transform до каталогу transforms хуків або видаліть `hooks.transformsDir`.
- `agentId` маршрутизує до певного агента; невідомі ID повертаються до типового агента.
- `allowedAgentIds`: обмежує ефективну маршрутизацію агентів, зокрема шлях типового агента, коли `agentId` опущено (`*` або опущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для агентних запусків хуків без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і керованим шаблонами ключам сесій зіставлення задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий allowlist префіксів для явних значень `sessionKey` (запит + зіставлення), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-яке зіставлення або preset використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь до каналу; `channel` типово дорівнює `last`.
- `model` перевизначає LLM для цього запуску хуку (має бути дозволено, якщо каталог моделей задано).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте цю маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору назв Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібно `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість типового шаблонного.

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
- Прив’язки не до loopback: маршрути canvas потребують автентифікації Gateway (токен/пароль/trusted-proxy), як і інші HTTP-поверхні Gateway.
- Node WebViews зазвичай не надсилають заголовки автентифікації; після сполучення й підключення вузла Gateway оголошує URL можливостей, обмежені вузлом, для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії вузла й швидко спливають. Резервний варіант на основі IP не використовується.
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

- `minimal` (типово, коли ввімкнено вбудований Plugin `bonjour`): опускати `cliPath` + `sshPort` із TXT-записів.
- `full`: включати `cliPath` + `sshPort`; multicast-реклама в LAN усе ще потребує ввімкненого вбудованого Plugin `bonjour`.
- `off`: пригнічувати multicast-рекламу в LAN без зміни ввімкнення Plugin.
- Вбудований Plugin `bonjour` автоматично запускається на хостах macOS і вмикається явно на Linux, Windows та контейнеризованих розгортаннях Gateway.
- Ім’я хоста типово дорівнює системному імені хоста, коли воно є дійсною DNS-міткою, з поверненням до `openclaw`. Перевизначте за допомогою `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує зону unicast DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднайте з DNS-сервером (рекомендовано CoreDNS) + розділений DNS Tailscale.

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

- Вбудовані змінні середовища застосовуються лише якщо в середовищі процесу відсутній ключ.
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

- Зіставляються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте за допомогою `$${VAR}` для літерального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є додатковими: значення у відкритому тексті досі працюють.

### `SecretRef`

Використовуйте одну форму об'єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- Шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- Шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (підтримує селектори в стилі AWS `secret#json_key`)
- id для `source: "exec"` не мають містити розділені скісною рискою сегменти шляху `.` або `..` (наприклад, `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних `openclaw.json`.
- Посилання `auth-profiles.json` включені до розв'язання під час виконання та покриття аудиту.

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
- Шляхи провайдерів file і exec завершуються закрито, коли перевірка ACL Windows недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` вимагає абсолютний шлях `command` і використовує протокольні payload на stdin/stdout.
- За замовчуванням шляхи команд-симлінків відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи-симлінки з одночасною валідацією розв'язаного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довіреного каталогу застосовується до розв'язаного цільового шляху.
- Дочірнє середовище `exec` за замовчуванням мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв'язуються під час активації в знімок у пам'яті, після чого шляхи запитів читають лише цей знімок.
- Фільтрування активної поверхні застосовується під час активації: нерозв'язані посилання на увімкнених поверхнях спричиняють збій запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

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
- Застарілі пласкі мапи `auth-profiles.json`, як-от `{ "provider": { "apiKey": "..." } }`, не є runtime-форматом; `openclaw doctor --fix` переписує їх у канонічні API-key профілі `provider:default` із резервною копією `.legacy-flat.*.bak`.
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-профілю на основі SecretRef.
- Статичні runtime-облікові дані надходять із розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються під час виявлення.
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

- `billingBackoffHours`: базова затримка повтору в годинах, коли профіль зазнає збою через справжні
  помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг може
  все одно потрапити сюди навіть у відповідях `401`/`403`, але текстові зіставники,
  специфічні для провайдера, залишаються в межах провайдера, якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повторювані HTTP `402` повідомлення про usage-window або
  ліміти витрат організації/workspace натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин затримки білінгу для окремих провайдерів.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання затримки білінгу (типово: `24`).
- `authPermanentBackoffMinutes`: базова затримка в хвилинах для високодостовірних збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: обмеження в хвилинах для зростання затримки `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, що використовується для лічильників затримки (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілів того самого провайдера для помилок перевантаження перед перемиканням на fallback моделі (типово: `1`). Форми зайнятості провайдера, як-от `ModelNotReadyException`, потрапляють сюди.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілів того самого провайдера для помилок rate-limit перед перемиканням на fallback моделі (типово: `1`). Цей кошик rate-limit охоплює текст у формі провайдера, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `redactSensitive` / `redactPatterns`: best-effort маскування для виводу в консоль, файлових журналів, записів журналу OTLP і збереженого тексту транскрипту сесії. `redactSensitive: "off"` вимикає лише цю загальну політику журналу/транскрипту; UI/tool/діагностичні поверхні безпеки все одно редагують секрети перед виведенням.

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
- `flags`: масив рядків прапорців, що вмикають цільовий вивід журналу (підтримує wildcard-и на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку без прогресу в мс для класифікації довготривалих сесій обробки як `session.long_running`, `session.stalled` або `session.stuck`. Відповідь, tool, статус, блок і прогрес ACP скидають таймер; повторна діагностика `session.stuck` відступає, доки стан не змінюється.
- `stuckSessionAbortMs`: поріг віку без прогресу в мс, після якого придатна зависла активна робота може бути abort-drained для відновлення. Якщо не задано, OpenClaw використовує безпечніше розширене вікно embedded-run щонайменше 5 хвилин і 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: захоплює відредагований знімок стабільності перед OOM, коли тиск пам’яті досягає `critical` (типово: `false`). Установіть `true`, щоб додати сканування/запис файлу пакета стабільності, зберігаючи звичайні події тиску пам’яті.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`). Повну конфігурацію, каталог сигналів і модель приватності див. в [експорті OpenTelemetry](/uk/gateway/opentelemetry).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необов’язкові OTLP endpoint-и для конкретних сигналів. Коли задані, вони перевизначають `otel.endpoint` лише для відповідного сигналу.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються з запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: вмикають експорт trace, метрик або журналів.
- `otel.logsExporter`: приймач експорту журналів: `"otlp"` (типово), `"stdout"` для одного JSON-об’єкта на рядок stdout або `"both"`.
- `otel.sampleRate`: частота семплювання trace `0`-`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання телеметрії в мс.
- `otel.captureContent`: opt-in захоплення сирого вмісту для атрибутів OTEL span. Типово вимкнено. Boolean `true` захоплює несистемний вміст повідомлень/tool; форма об’єкта дає змогу явно ввімкнути `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` і `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: змінна середовища для найновішої експериментальної форми GenAI inference span, зокрема назв span `{gen_ai.operation.name} {gen_ai.request.model}`, типу span `CLIENT` і `gen_ai.provider.name` замість застарілого `gen_ai.system`. Типово span-и зберігають `openclaw.model.call` і `gen_ai.system` для сумісності; метрики GenAI використовують обмежені семантичні атрибути.
- `OPENCLAW_OTEL_PRELOADED=1`: змінна середовища для хостів, які вже зареєстрували глобальний OpenTelemetry SDK. Тоді OpenClaw пропускає запуск/завершення SDK, що належить Plugin, зберігаючи діагностичні слухачі активними.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` і `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env vars endpoint-ів для конкретних сигналів, що використовуються, коли відповідний ключ конфігурації не задано.
- `cacheTrace.enabled`: журналює знімки cache trace для embedded runs (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для cache trace JSONL (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід cache trace (усі типово: `true`).

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

- `channel`: канал релізу для npm/git установок - `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску Gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для пакетних установок (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням stable-каналу (типово: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу rollout stable-каналу в годинах (типово: `12`; максимум: `168`).
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

- `enabled`: глобальний feature gate ACP (типово: `true`; установіть `false`, щоб приховати dispatch ACP і можливості spawn).
- `dispatch.enabled`: незалежний gate для dispatch ходу сесії ACP (типово: `true`). Установіть `false`, щоб зберегти команди ACP доступними, але заблокувати виконання.
- `backend`: типовий id backend runtime ACP (має відповідати зареєстрованому runtime plugin ACP).
  Спершу встановіть backend plugin, а якщо `plugins.allow` задано, включіть id backend plugin (наприклад `acpx`), інакше backend ACP не завантажиться.
- `defaultAgent`: fallback id цільового агента ACP, коли spawn-и не задають явну ціль.
- `allowedAgents`: allowlist id агентів, дозволених для runtime-сесій ACP; порожній список означає відсутність додаткового обмеження.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед розбиттям проєкції потокового блоку.
- `stream.repeatSuppression`: пригнічує повторювані рядки статусу/tool у межах одного ходу (типово: `true`).
- `stream.deliveryMode`: `"live"` транслює інкрементально; `"final_only"` буферизує до terminal-подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій tool (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу assistant, що проєктується на хід ACP.
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
  - `"random"` (типово): змінні кумедні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (не лише слогани), задайте env `OPENCLAW_HIDE_BANNER=1`.

---

## Майстер

Метадані, які записують керовані CLI-потоки налаштування (`onboard`, `configure`, `doctor`):

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

Див. поля ідентичності `agents.list` у розділі [Типові параметри агента](/uk/gateway/config-agents#agent-defaults).

---

## Міст (застарілий, вилучено)

Поточні збірки більше не містять TCP-міст. Вузли підключаються через Gateway WebSocket. Ключі `bridge.*` більше не є частиною схеми конфігурації (перевірка не проходить, доки їх не буде вилучено; `openclaw doctor --fix` може прибрати невідомі ключі).

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
    maxConcurrentRuns: 8, // типово; диспетчеризація cron + ізольоване виконання ходу агента cron
    webhook: "https://example.invalid/legacy", // застарілий резервний варіант для збережених завдань notify:true
    webhookToken: "replace-with-dedicated-token", // необов'язковий bearer-токен для автентифікації вихідного webhook
    sessionRetention: "24h", // рядок тривалості або false
    runLog: {
      maxBytes: "2mb", // типово 2_000_000 байтів
      keepLines: 2000, // типово 2000
    },
  },
}
```

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запусків cron перед обрізанням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. Типово: `24h`; задайте `false`, щоб вимкнути.
- `runLog.maxBytes`: приймається для сумісності зі старішими файловими журналами запусків cron. Типово: `2_000_000` байтів.
- `runLog.keepLines`: найновіші рядки історії запусків SQLite, що зберігаються для кожного завдання. Типово: `2000`.
- `webhookToken`: bearer-токен, що використовується для доставки POST cron webhook (`delivery.mode = "webhook"`); якщо пропущено, заголовок автентифікації не надсилається.
- `webhook`: застарілий резервний URL webhook (http/https), який `openclaw doctor --fix` використовує для міграції збережених завдань, що досі мають `notify: true`; доставка під час виконання використовує `delivery.mode="webhook"` для кожного завдання плюс `delivery.to` або `delivery.completionDestination` під час збереження доставки оголошень.

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

Одноразові завдання залишаються ввімкненими, доки повторні спроби не буде вичерпано, а потім вимикаються зі збереженням остаточного стану помилки. Повторювані завдання використовують ту саму політику повторних спроб для тимчасових помилок, щоб запуститися знову після backoff перед наступним запланованим інтервалом; постійні помилки або вичерпані повторні спроби для тимчасових помилок повертаються до звичайного повторюваного розкладу з backoff помилок.

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
- `after`: кількість послідовних збоїв перед запуском сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід'ємне ціле число).
- `includeSkipped`: враховувати послідовні пропущені запуски в порогове значення сповіщення (типово: `false`). Пропущені запуски відстежуються окремо й не впливають на backoff помилок виконання.
- `mode`: режим доставки - `"announce"` надсилає через повідомлення каналу; `"webhook"` надсилає POST до налаштованого webhook.
- `accountId`: необов'язковий ідентифікатор облікового запису або каналу для обмеження області доставки сповіщень.

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
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли існує достатньо даних цілі.
- `channel`: перевизначення каналу для доставки оголошень. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль оголошення або URL webhook. Обов'язково для режиму webhook.
- `accountId`: необов'язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли ні глобальне призначення збоїв, ні призначення для окремого завдання не задано, завдання, які вже доставляються через `announce`, у разі збою повертаються до цієї основної цілі оголошень.
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
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях медіа                              |
| `{{MediaType}}`    | Тип медіа (зображення/аудіо/документ/...)         |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Розв'язаний медіапромпт для записів CLI           |
| `{{MaxChars}}`     | Розв'язана максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (best effort)                          |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (best effort) |
| `{{SenderName}}`   | Відображуване ім'я відправника (best effort)      |
| `{{SenderE164}}`   | Номер телефону відправника (best effort)          |
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
- Масив файлів: глибоко зливається по порядку (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів углиб.
- Шляхи: розв'язуються відносно файлу, який виконує включення, але мають залишатися всередині каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми/форми з `../` дозволені лише тоді, коли вони все одно розв'язуються всередині цієї межі. Шляхи не мають містити null-байти та мають бути строго коротшими за 4096 символів до й після розв'язання.
- Записи, що належать OpenClaw і змінюють лише один розділ верхнього рівня, підтриманий однофайловим включенням, записуються в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення із сусідніми перевизначеннями доступні лише для читання для записів, що належать OpenClaw; такі записи завершуються закритою відмовою замість розгортання конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору, циклічних включень, недійсного формату шляху та надмірної довжини.

---

_Пов'язано: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
