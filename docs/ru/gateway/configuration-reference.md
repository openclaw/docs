---
read_when:
    - Вам нужны точные семантика или значения по умолчанию конфигурации на уровне полей
    - Вы проверяете блоки конфигурации канала, модели, Gateway или инструмента
summary: Справочник конфигурации Gateway для основных ключей OpenClaw, значений по умолчанию и ссылок на отдельные справочники подсистем
title: Справочник по настройке
x-i18n:
    generated_at: "2026-07-02T01:07:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d15cc968bc89a7a490a5eaf571d5f38d052ad8783fcc7de5ca17d08ac04bfcc7
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Справочник по основной конфигурации для `~/.openclaw/openclaw.json`. Обзор, ориентированный на задачи, см. в разделе [Конфигурация](/ru/gateway/configuration).

Охватывает основные поверхности конфигурации OpenClaw и содержит ссылки на отдельные подробные справочники подсистем. Каталоги команд, принадлежащие каналам и плагинам, а также глубокие настройки памяти/QMD находятся на собственных страницах, а не на этой.

Источник истины в коде:

- `openclaw config schema` выводит актуальную JSON Schema, используемую для проверки и Control UI, с объединенными метаданными bundled/plugin/channel, когда они доступны
- `config.schema.lookup` возвращает один узел схемы, ограниченный путем, для инструментов детализации
- `pnpm config:docs:check` / `pnpm config:docs:gen` проверяют базовый хэш документации конфигурации относительно текущей поверхности схемы

Путь поиска агента: используйте действие инструмента `gateway` `config.schema.lookup` для
точной документации и ограничений на уровне полей перед правками. Используйте
[Конфигурация](/ru/gateway/configuration) для руководства, ориентированного на задачи, а эту страницу -
для более широкой карты полей, значений по умолчанию и ссылок на справочники подсистем.

Выделенные подробные справочники:

- [Справочник по конфигурации памяти](/ru/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` и конфигурации dreaming в `plugins.entries.memory-core.config.dreaming`
- [Slash-команды](/ru/tools/slash-commands) для текущего каталога встроенных и bundled-команд
- страницы владельцев каналов/плагинов для поверхностей команд, специфичных для каналов

Формат конфигурации - **JSON5** (разрешены комментарии и завершающие запятые). Все поля необязательны - OpenClaw использует безопасные значения по умолчанию, если они опущены.

---

## Каналы

Ключи конфигурации для отдельных каналов перенесены на отдельную страницу - см.
[Конфигурация - каналы](/ru/gateway/config-channels) для `channels.*`,
включая Slack, Discord, Telegram, WhatsApp, Matrix, iMessage и другие
bundled-каналы (аутентификация, контроль доступа, несколько учетных записей, gating упоминаний).

## Значения агента по умолчанию, multi-agent, сессии и сообщения

Перенесено на отдельную страницу - см.
[Конфигурация - агенты](/ru/gateway/config-agents) для:

- `agents.defaults.*` (рабочая область, модель, thinking, heartbeat, память, медиа, skills, sandbox)
- `multiAgent.*` (маршрутизация и привязки multi-agent)
- `session.*` (жизненный цикл сессии, compaction, pruning)
- `messages.*` (доставка сообщений, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.consultThinkingLevel`: переопределение уровня thinking для полного запуска агента OpenClaw за realtime-консультациями Control UI Talk
  - `talk.consultFastMode`: одноразовое переопределение fast-mode для realtime-консультаций Control UI Talk
  - `talk.speechLocale`: необязательный идентификатор локали BCP 47 для распознавания речи Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: если не задано, Talk сохраняет стандартное для платформы окно паузы перед отправкой транскрипта (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback ретрансляции Gateway для финализированных realtime-транскриптов Talk, которые пропускают `openclaw_agent_consult`

## Инструменты и пользовательские провайдеры

Политика инструментов, экспериментальные переключатели, конфигурация инструментов на базе провайдеров и настройка пользовательских
провайдеров / base-URL перенесены на отдельную страницу - см.
[Конфигурация - инструменты и пользовательские провайдеры](/ru/gateway/config-tools).

## Модели

Определения провайдеров, allowlist моделей и настройка пользовательских провайдеров находятся в
[Конфигурация - инструменты и пользовательские провайдеры](/ru/gateway/config-tools#custom-providers-and-base-urls).
Корень `models` также владеет глобальным поведением каталога моделей.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: поведение каталога провайдеров (`merge` или `replace`).
- `models.providers`: карта пользовательских провайдеров с ключами по id провайдера.
- `models.providers.*.localService`: необязательный менеджер процессов по требованию для
  локальных серверов моделей. OpenClaw проверяет настроенный health endpoint, запускает
  абсолютную `command` при необходимости, ждет готовности, затем отправляет запрос модели.
  См. [Локальные сервисы моделей](/ru/gateway/local-model-services).
- `models.pricing.enabled`: управляет фоновой инициализацией pricing, которая
  запускается после того, как sidecar-процессы и каналы достигают пути готовности Gateway. Когда `false`,
  Gateway пропускает получение pricing-каталогов OpenRouter и LiteLLM; настроенные
  значения `models.providers.*.models[].cost` по-прежнему работают для локальных оценок стоимости.

## MCP

Определения MCP-серверов, управляемые OpenClaw, находятся в `mcp.servers` и
используются встроенным OpenClaw и другими runtime-адаптерами. Команды `openclaw mcp list`,
`show`, `set` и `unset` управляют этим блоком без подключения к
целевому серверу во время правок конфигурации.

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

- `mcp.servers`: именованные определения stdio или удаленных MCP-серверов для runtimes, которые
  предоставляют настроенные MCP-инструменты.
  Удаленные записи используют `transport: "streamable-http"` или `transport: "sse"`;
  `type: "http"` - это CLI-native алиас, который `openclaw mcp set` и
  `openclaw doctor --fix` нормализуют в каноническое поле `transport`.
- `mcp.servers.<name>.enabled`: задайте `false`, чтобы сохранить определение сервера,
  исключив его из embedded OpenClaw MCP discovery и проекции инструментов.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: тайм-аут MCP-запроса для сервера
  в секундах или миллисекундах.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: тайм-аут подключения для сервера
  в секундах или миллисекундах.
- `mcp.servers.<name>.supportsParallelToolCalls`: необязательная подсказка по конкурентности для
  адаптеров, которые могут выбирать, выполнять ли параллельные вызовы MCP-инструментов.
- `mcp.servers.<name>.auth`: задайте `"oauth"` для HTTP MCP-серверов, которым требуется
  OAuth. Выполните `openclaw mcp login <name>`, чтобы сохранить токены в состоянии OpenClaw.
- `mcp.servers.<name>.oauth`: необязательные переопределения OAuth scope, redirect URL и client
  metadata URL.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: элементы управления HTTP TLS
  для private endpoints и mutual TLS.
- `mcp.servers.<name>.toolFilter`: необязательный выбор инструментов для сервера. `include`
  ограничивает обнаруженные MCP-инструменты совпадающими именами; `exclude` скрывает совпадающие
  имена. Записи являются точными именами MCP-инструментов или простыми glob-шаблонами `*`. Серверы с
  ресурсами или prompts также создают имена служебных инструментов (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), и для этих имен используется
  тот же фильтр.
- `mcp.servers.<name>.codex`: необязательные элементы управления проекцией app-server Codex.
  Этот блок является метаданными OpenClaw только для потоков app-server Codex; он не
  влияет на ACP-сессии, generic-конфигурацию harness Codex или другие runtime-адаптеры.
  Непустой `codex.agents` ограничивает сервер перечисленными id агентов OpenClaw.
  Пустые, blank или недопустимые списки агентов с областью действия отклоняются проверкой конфигурации
  и опускаются runtime-путем проекции вместо того, чтобы становиться глобальными.
  `codex.defaultToolsApprovalMode` выводит нативный для Codex
  `default_tools_approval_mode` для этого сервера. OpenClaw удаляет блок `codex`
  перед передачей нативной конфигурации `mcp_servers` в Codex. Опустите блок, чтобы
  сервер проецировался для каждого агента app-server Codex со стандартным
  поведением approval MCP в Codex.
- `mcp.sessionIdleTtlMs`: idle TTL для session-scoped bundled MCP runtimes.
  Одноразовые embedded-запуски запрашивают cleanup в конце запуска; этот TTL является backstop для
  долгоживущих сессий и будущих callers.
- Изменения в `mcp.*` применяются hot-apply путем освобождения кешированных session MCP runtimes.
  Следующее обнаружение/использование инструмента пересоздает их из новой конфигурации, поэтому удаленные
  записи `mcp.servers` reaped немедленно, а не после ожидания idle TTL.
- Runtime discovery также учитывает уведомления об изменении списка MCP-инструментов, сбрасывая
  кешированный каталог для этой сессии. Серверы, которые объявляют ресурсы или
  prompts, получают служебные инструменты для listing/reading ресурсов и listing/fetching
  prompts. Повторяющиеся сбои вызова инструмента ненадолго приостанавливают затронутый сервер перед
  следующей попыткой вызова.

См. [MCP](/ru/cli/mcp#openclaw-as-an-mcp-client-registry) и
[CLI backends](/ru/gateway/cli-backends#bundle-mcp-overlays) для runtime-поведения.

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

- `allowBundled`: необязательный allowlist только для bundled skills (managed/workspace skills не затрагиваются).
- `load.extraDirs`: дополнительные общие корни skill (самый низкий приоритет).
- `load.allowSymlinkTargets`: доверенные реальные целевые корни, в которые symlink skills могут
  разрешаться, когда ссылка находится вне настроенного исходного корня.
- `workshop.allowSymlinkTargetWrites`: разрешает Skill Workshop apply записывать
  через уже доверенные symlink targets (по умолчанию: false).
- `install.preferBrew`: когда true, предпочитает установщики Homebrew, если `brew`
  доступен, прежде чем переходить к другим типам установщиков.
- `install.nodeManager`: предпочтение установщика Node для спецификаций `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: разрешает доверенным клиентам Gateway `operator.admin`
  устанавливать private zip-архивы, подготовленные через `skills.upload.*`
  (по умолчанию: false). Это включает только путь uploaded-archive; обычные установки ClawHub
  этого не требуют.
- `entries.<skillKey>.enabled: false` отключает skill, даже если он bundled/installed.
- `entries.<skillKey>.apiKey`: удобство для skills, объявляющих основную env var (plaintext string или объект SecretRef).

---

## Плагины

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

- Загружается из каталогов пакетов или комплектов в `~/.openclaw/extensions` и `<workspace>/.openclaw/extensions`, а также из файлов или каталогов, перечисленных в `plugins.load.paths`.
- Помещайте автономные файлы Plugin в `plugins.load.paths`; автоматически обнаруживаемые корни расширений игнорируют файлы `.js`, `.mjs` и `.ts` верхнего уровня, чтобы вспомогательные скрипты в этих корнях не блокировали запуск.
- Обнаружение принимает нативные Plugin OpenClaw, а также совместимые комплекты Codex и комплекты Claude, включая комплекты Claude с макетом по умолчанию без манифеста.
- **Изменения конфигурации требуют перезапуска Gateway.**
- `allow`: необязательный список разрешений (загружаются только перечисленные Plugin). `deny` имеет приоритет.
- `plugins.entries.<id>.apiKey`: удобное поле API-ключа уровня Plugin (если поддерживается Plugin).
- `plugins.entries.<id>.env`: карта переменных окружения, ограниченная областью Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: когда `false`, ядро блокирует `before_prompt_build` и игнорирует поля, изменяющие промпт, из устаревшего `before_agent_start`, сохраняя при этом устаревшие `modelOverride` и `providerOverride`. Применяется к нативным хукам Plugin и поддерживаемым каталогам хуков, предоставляемым комплектом.
- `plugins.entries.<id>.hooks.allowConversationAccess`: когда `true`, доверенные невстроенные Plugin могут читать необработанное содержимое разговора из типизированных хуков, таких как `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` и `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно доверять этому Plugin запрашивать переопределения `provider` и `model` для каждого запуска фоновых подагентских запусков.
- `plugins.entries.<id>.subagent.allowedModels`: необязательный список разрешений канонических целей `provider/model` для доверенных подагентских переопределений. Используйте `"*"` только тогда, когда намеренно хотите разрешить любую модель.
- `plugins.entries.<id>.llm.allowModelOverride`: явно доверять этому Plugin запрашивать переопределения модели для `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: необязательный список разрешений канонических целей `provider/model` для доверенных переопределений завершения LLM Plugin. Используйте `"*"` только тогда, когда намеренно хотите разрешить любую модель.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: явно доверять этому Plugin запускать `api.runtime.llm.complete` для идентификатора агента, отличного от используемого по умолчанию.
- `plugins.entries.<id>.config`: объект конфигурации, определяемый Plugin (проверяется схемой нативного Plugin OpenClaw, когда она доступна).
- Настройки учетной записи и среды выполнения канального Plugin находятся в `channels.<id>` и должны описываться метаданными `channelConfigs` манифеста владеющего Plugin, а не центральным реестром опций OpenClaw.

### Конфигурация Plugin harness Codex

Встроенный Plugin `codex` владеет нативными настройками harness app-server Codex в
`plugins.entries.codex.config`. Полную поверхность конфигурации см. в
[справочнике harness Codex](/ru/plugins/codex-harness-reference), а модель среды выполнения — в
[harness Codex](/ru/plugins/codex-harness).

`codexPlugins` применяется только к сеансам, которые выбирают нативный harness Codex.
Он не включает Plugin Codex для запусков провайдера OpenClaw, привязок разговоров
ACP или любого harness, не относящегося к Codex.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: включает нативную
  поддержку Plugin/приложений Codex для harness Codex. По умолчанию: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  политика по умолчанию для деструктивных действий в перенесенных запросах приложений Plugin.
  Используйте `true`, чтобы принимать безопасные схемы подтверждения Codex без запроса, `false`,
  чтобы отклонять их, `"auto"`, чтобы направлять обязательные подтверждения Codex через подтверждения
  Plugin OpenClaw, или `"ask"`, чтобы запрашивать каждое записывающее/деструктивное действие
  Plugin без долговременного подтверждения. Режим `"ask"` очищает долговременные переопределения
  подтверждения Codex для каждого инструмента затронутого приложения и выбирает человека-рецензента
  подтверждений для этого приложения до запуска потока Codex.
  По умолчанию: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: включает
  перенесенную запись Plugin, когда глобальный `codexPlugins.enabled` также равен true.
  По умолчанию: `true` для явных записей.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  стабильная идентичность marketplace. V1 поддерживает только `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: стабильная
  идентичность Plugin Codex из миграции, например `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  переопределение деструктивных действий для конкретного Plugin. Если оно опущено, используется
  глобальное значение `allow_destructive_actions`. Значение для конкретного Plugin принимает те же
  политики `true`, `false`, `"auto"` или `"ask"`.

Каждое допущенное приложение Plugin, использующее `"ask"`, направляет запросы подтверждения
этого приложения человеку-рецензенту. Другие приложения и подтверждения потока не для приложений
сохраняют настроенного рецензента, поэтому смешанные политики Plugin не наследуют поведение `"ask"`.

`codexPlugins.enabled` — глобальная директива включения. Явные записи Plugin,
записанные миграцией, являются долговременным набором установки и права на восстановление.
`plugins["*"]` не поддерживается, переключателя `install` нет, а локальные значения
`marketplacePath` намеренно не являются полями конфигурации, потому что они
зависят от хоста.

Проверки готовности `app/list` кэшируются на один час и обновляются
асинхронно при устаревании. Конфигурация приложения потока Codex вычисляется при установлении
сеанса harness Codex, а не на каждом ходе; используйте `/new`, `/reset` или перезапуск Gateway
после изменения конфигурации нативного Plugin.

- `plugins.entries.firecrawl.config.webFetch`: настройки провайдера web-fetch Firecrawl.
  - `apiKey`: необязательный API-ключ Firecrawl для более высоких лимитов (принимает SecretRef). Откатывается к `plugins.entries.firecrawl.config.webSearch.apiKey`, устаревшему `tools.web.fetch.firecrawl.apiKey` или переменной окружения `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовый URL API Firecrawl (по умолчанию: `https://api.firecrawl.dev`; переопределения для self-hosted должны указывать на частные/внутренние конечные точки).
  - `onlyMainContent`: извлекать со страниц только основное содержимое (по умолчанию: `true`).
  - `maxAgeMs`: максимальный возраст кэша в миллисекундах (по умолчанию: `172800000` / 2 дня).
  - `timeoutSeconds`: тайм-аут запроса scrape в секундах (по умолчанию: `60`).
- `plugins.entries.xai.config.xSearch`: настройки X Search xAI (веб-поиск Grok).
  - `enabled`: включить провайдер X Search.
  - `model`: модель Grok для поиска (например, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: настройки Dreaming памяти. Фазы и пороги см. в [Dreaming](/ru/concepts/dreaming).
  - `enabled`: главный переключатель Dreaming (по умолчанию `false`).
  - `frequency`: Cron-ритм для каждого полного прохода Dreaming (`"0 3 * * *"` по умолчанию).
  - `model`: необязательное переопределение модели подагента Dream Diary. Требует `plugins.entries.memory-core.subagent.allowModelOverride: true`; используйте вместе с `allowedModels`, чтобы ограничить цели. Ошибки недоступности модели повторяются один раз с моделью сеанса по умолчанию; сбои доверия или списка разрешений не откатываются молча.
  - политика фаз и пороги являются деталями реализации (не пользовательскими ключами конфигурации).
- Полная конфигурация памяти находится в [справочнике конфигурации памяти](/ru/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Включенные Plugin комплектов Claude также могут добавлять встроенные значения OpenClaw по умолчанию из `settings.json`; OpenClaw применяет их как очищенные настройки агента, а не как необработанные патчи конфигурации OpenClaw.
- `plugins.slots.memory`: выбрать идентификатор активного Plugin памяти или `"none"`, чтобы отключить Plugin памяти.
- `plugins.slots.contextEngine`: выбрать идентификатор активного Plugin движка контекста; по умолчанию `"legacy"`, если вы не установите и не выберете другой движок.

См. [Plugin](/ru/tools/plugin).

---

## Обязательства

`commitments` управляет выводимой последующей памятью: OpenClaw может обнаруживать check-in из ходов разговора и доставлять их через запуски Heartbeat.

- `commitments.enabled`: включить скрытое извлечение LLM, хранение и доставку через Heartbeat для выводимых последующих обязательств. По умолчанию: `false`.
- `commitments.maxPerDay`: максимальное число выводимых последующих обязательств, доставляемых за сеанс агента в скользящие сутки. По умолчанию: `3`.

См. [выводимые обязательства](/ru/concepts/commitments).

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

- `evaluateEnabled: false` отключает `act:evaluate` и `wait --fn`.
- `tabCleanup` освобождает отслеживаемые вкладки основного агента после простоя или когда
  сессия превышает свой лимит. Установите `idleMinutes: 0` или `maxTabsPerSession: 0`, чтобы
  отключить эти отдельные режимы очистки.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` отключен, если не задан, поэтому навигация браузера по умолчанию остается строгой.
- Устанавливайте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` только когда вы намеренно доверяете браузерной навигации по частной сети.
- В строгом режиме удаленные конечные точки профиля CDP (`profiles.*.cdpUrl`) подчиняются той же блокировке частной сети во время проверок доступности и обнаружения.
- `ssrfPolicy.allowPrivateNetwork` остается поддерживаемым устаревшим псевдонимом.
- В строгом режиме используйте `ssrfPolicy.hostnameAllowlist` и `ssrfPolicy.allowedHostnames` для явных исключений.
- Удаленные профили работают только в режиме подключения (запуск/остановка/сброс отключены).
- `profiles.*.cdpUrl` принимает `http://`, `https://`, `ws://` и `wss://`.
  Используйте HTTP(S), когда хотите, чтобы OpenClaw обнаруживал `/json/version`; используйте WS(S),
  когда ваш провайдер предоставляет прямой URL WebSocket DevTools.
- `remoteCdpTimeoutMs` и `remoteCdpHandshakeTimeoutMs` применяются к удаленной и
  `attachOnly` доступности CDP, а также к запросам открытия вкладок. Управляемые профили local loopback
  сохраняют локальные значения CDP по умолчанию.
- Если внешне управляемый сервис CDP доступен через loopback, установите для этого
  профиля `attachOnly: true`; иначе OpenClaw будет считать порт loopback
  локальным управляемым профилем браузера и может сообщать об ошибках владения локальным портом.
- Профили `existing-session` используют Chrome MCP вместо CDP и могут подключаться на
  выбранном хосте или через подключенный узел браузера.
- Профили `existing-session` могут задавать `userDataDir`, чтобы выбрать конкретный
  профиль браузера на базе Chromium, например Brave или Edge.
- Профили `existing-session` могут задавать `cdpUrl`, когда Chrome уже запущен
  за конечной точкой обнаружения DevTools HTTP(S) или прямой конечной точкой WS(S). В этом
  режиме OpenClaw передает конечную точку в Chrome MCP вместо автоподключения;
  `userDataDir` игнорируется для аргументов запуска Chrome MCP.
- Профили `existing-session` сохраняют текущие ограничения маршрута Chrome MCP:
  действия на основе снимков/ref вместо нацеливания CSS-селекторами, хуки загрузки одного файла,
  без переопределений тайм-аута диалогов, без `wait --load networkidle`, а также без
  `responsebody`, экспорта PDF, перехвата загрузок или пакетных действий.
- Локальные управляемые профили `openclaw` автоматически назначают `cdpPort` и `cdpUrl`; задавайте
  `cdpUrl` явно только для удаленных профилей CDP или подключения к конечной точке existing-session.
- Локальные управляемые профили могут задавать `executablePath`, чтобы переопределить глобальный
  `browser.executablePath` для этого профиля. Используйте это, чтобы запускать один профиль в
  Chrome, а другой в Brave.
- Локальные управляемые профили используют `browser.localLaunchTimeoutMs` для HTTP-обнаружения Chrome CDP
  после запуска процесса и `browser.localCdpReadyTimeoutMs` для
  готовности WebSocket CDP после запуска. Увеличьте их на более медленных хостах, где Chrome
  успешно запускается, но проверки готовности опережают запуск. Оба значения должны быть
  положительными целыми числами до `120000` мс; недопустимые значения конфигурации отклоняются.
- Порядок автообнаружения: браузер по умолчанию, если он на базе Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` и `browser.profiles.<name>.executablePath` оба
  принимают `~` и `~/...` для домашнего каталога вашей ОС перед запуском Chromium.
  `userDataDir` для профиля в профилях `existing-session` также раскрывается из тильды.
- Сервис управления: только loopback (порт выводится из `gateway.port`, по умолчанию `18791`).
- `extraArgs` добавляет дополнительные флаги запуска к локальному запуску Chromium (например
  `--disable-gpu`, размер окна или флаги отладки).

---

## Интерфейс

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

- `seamColor`: акцентный цвет для хрома интерфейса нативного приложения (оттенок пузыря режима разговора и т. п.).
- `assistant`: переопределение идентичности Control UI. При отсутствии значения используется идентичность активного агента.

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

- `mode`: `local` (запустить Gateway) или `remote` (подключиться к удаленному Gateway). Gateway отказывается запускаться, если значение не `local`.
- `port`: единый мультиплексированный порт для WS + HTTP. Приоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (по умолчанию), `lan` (`0.0.0.0`), `tailnet` (только IP Tailscale) или `custom`.
- **Устаревшие псевдонимы привязки**: используйте значения режима привязки в `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдонимы хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примечание о Docker**: привязка `loopback` по умолчанию слушает `127.0.0.1` внутри контейнера. При сетевом мосте Docker (`-p 18789:18789`) трафик приходит на `eth0`, поэтому Gateway недоступен. Используйте `--network host` или задайте `bind: "lan"` (либо `bind: "custom"` с `customBindHost: "0.0.0.0"`), чтобы слушать на всех интерфейсах.
- **Аутентификация**: обязательна по умолчанию. Привязки не к loopback требуют аутентификации Gateway. На практике это означает общий токен/пароль или reverse proxy с учетом идентичности с `gateway.auth.mode: "trusted-proxy"`. Мастер первичной настройки по умолчанию генерирует токен.
- Если настроены и `gateway.auth.token`, и `gateway.auth.password` (включая SecretRefs), явно задайте `gateway.auth.mode` как `token` или `password`. Потоки запуска и установки/ремонта сервиса завершаются ошибкой, когда настроены оба значения, а режим не задан.
- `gateway.auth.mode: "none"`: явный режим без аутентификации. Используйте только для доверенных настроек local loopback; этот вариант намеренно не предлагается в подсказках первичной настройки.
- `gateway.auth.mode: "trusted-proxy"`: делегируйте аутентификацию браузера/пользователя reverse proxy с учетом идентичности и доверяйте заголовкам идентичности от `gateway.trustedProxies` (см. [Аутентификация через доверенный прокси](/ru/gateway/trusted-proxy-auth)). Этот режим по умолчанию ожидает источник прокси **не loopback**; reverse proxy loopback на том же хосте требуют явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутренние вызывающие стороны на том же хосте могут использовать `gateway.auth.password` как локальный прямой резервный вариант; `gateway.auth.token` остается взаимоисключающим с режимом trusted-proxy.
- `gateway.auth.allowTailscale`: когда `true`, заголовки идентичности Tailscale Serve могут удовлетворять аутентификацию Control UI/WebSocket (проверяется через `tailscale whois`). HTTP API эндпоинты **не** используют эту аутентификацию по заголовкам Tailscale; вместо этого они следуют обычному HTTP-режиму аутентификации Gateway. Этот поток без токена предполагает, что хост Gateway является доверенным. По умолчанию `true`, когда `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необязательный ограничитель неудачных попыток аутентификации. Применяется для каждого IP клиента и для каждой области аутентификации (shared-secret и device-token отслеживаются независимо). Заблокированные попытки возвращают `429` + `Retry-After`.
  - На асинхронном пути Tailscale Serve Control UI неудачные попытки для одного и того же `{scope, clientIp}` сериализуются перед записью сбоя. Поэтому параллельные неверные попытки от одного клиента могут сработать на ограничителе уже на втором запросе, вместо того чтобы обе прошли как обычные несовпадения.
  - `gateway.auth.rateLimit.exemptLoopback` по умолчанию `true`; задайте `false`, если намеренно хотите ограничивать по частоте и трафик localhost (для тестовых настроек или строгих развертываний прокси).
- Попытки WS-аутентификации из браузерного origin всегда ограничиваются по частоте с отключенным исключением loopback (эшелонированная защита от перебора localhost через браузер).
- На loopback такие блокировки браузерных origin изолированы по нормализованному значению `Origin`, поэтому повторные сбои с одного localhost origin не блокируют автоматически другой origin.
- `tailscale.mode`: `serve` (только tailnet, привязка loopback) или `funnel` (публичный, требует аутентификации).
- `tailscale.serviceName`: необязательное имя Tailscale Service для режима Serve, например `svc:openclaw`. Когда задано, OpenClaw передает его в `tailscale serve
--service`, чтобы Control UI можно было открыть через именованный Service вместо имени хоста устройства. Значение должно использовать формат имени Service Tailscale `svc:<dns-label>`; при запуске выводится производный URL Service.
- `tailscale.preserveFunnel`: когда `true` и `tailscale.mode = "serve"`, OpenClaw проверяет `tailscale funnel status` перед повторным применением Serve при запуске и пропускает его, если внешне настроенный маршрут Funnel уже покрывает порт Gateway. По умолчанию `false`.
- `controlUi.allowedOrigins`: явный список разрешенных браузерных origin для подключений Gateway WebSocket. Требуется для публичных браузерных origin не loopback. Приватные загрузки UI с тем же origin в LAN/Tailnet из loopback, RFC1918/link-local, `.local`, `.ts.net` или хостов Tailscale CGNAT принимаются без включения резервного варианта по заголовку Host.
- `controlUi.chatMessageMaxWidth`: необязательная максимальная ширина для сгруппированных сообщений чата Control UI. Принимает ограниченные значения ширины CSS, такие как `960px`, `82%`, `min(1280px, 82%)` и `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: опасный режим, который включает резервное определение origin по заголовку Host для развертываний, намеренно полагающихся на политику origin по заголовку Host.
- `remote.transport`: `ssh` (по умолчанию) или `direct` (ws/wss). Для `direct` значение `remote.url` должно быть `wss://` для публичных хостов; открытый текст `ws://` принимается только для loopback, LAN, link-local, `.local`, `.ts.net` и хостов Tailscale CGNAT.
- `remote.remotePort`: порт Gateway на удаленном SSH-хосте. По умолчанию `18789`; используйте это, когда локальный порт туннеля отличается от удаленного порта Gateway.
- `gateway.remote.token` / `.password` — поля учетных данных удаленного клиента. Сами по себе они не настраивают аутентификацию Gateway.
- `gateway.push.apns.relay.baseUrl`: базовый HTTPS URL для внешнего реле APNs, используемого после того, как iOS-сборки с поддержкой реле публикуют регистрации в Gateway. Публичные сборки App Store/TestFlight используют размещенное реле OpenClaw. Пользовательские URL реле должны соответствовать намеренно отдельному пути сборки/развертывания iOS, чей URL реле указывает на это реле.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут отправки от Gateway к реле в миллисекундах. По умолчанию `10000`.
- Регистрации с поддержкой реле делегируются конкретной идентичности Gateway. Сопряженное iOS-приложение получает `gateway.identity.get`, включает эту идентичность в регистрацию реле и пересылает Gateway разрешение на отправку, ограниченное регистрацией. Другой Gateway не может повторно использовать эту сохраненную регистрацию.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: временные переопределения окружения для конфигурации реле выше.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварийный выход только для разработки для HTTP URL реле loopback. Производственные URL реле должны оставаться на HTTPS.
- `gateway.handshakeTimeoutMs`: тайм-аут предварительной аутентификации рукопожатия Gateway WebSocket в миллисекундах. По умолчанию: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` имеет приоритет, если задан. Увеличьте это значение на загруженных или маломощных хостах, где локальные клиенты могут подключаться, пока прогрев запуска еще стабилизируется.
- `gateway.channelHealthCheckMinutes`: интервал монитора здоровья каналов в минутах. Задайте `0`, чтобы глобально отключить перезапуски монитором здоровья. По умолчанию: `5`.
- `gateway.channelStaleEventThresholdMinutes`: порог устаревшего сокета в минутах. Держите это значение больше или равным `gateway.channelHealthCheckMinutes`. По умолчанию: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальное число перезапусков монитором здоровья для каждого канала/аккаунта за скользящий час. По умолчанию: `10`.
- `channels.<provider>.healthMonitor.enabled`: отключение перезапусков монитором здоровья для отдельного канала при сохранении глобального монитора включенным.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: переопределение для отдельного аккаунта в многопользовательских каналах. Когда задано, имеет приоритет над переопределением уровня канала.
- Локальные пути вызова Gateway могут использовать `gateway.remote.*` как резервный вариант только когда `gateway.auth.*` не задано.
- Если `gateway.auth.token` / `gateway.auth.password` явно настроены через SecretRef и не разрешаются, разрешение завершается закрытым отказом (без маскировки удаленным резервным вариантом).
- `trustedProxies`: IP-адреса reverse proxy, которые завершают TLS или внедряют заголовки пересланного клиента. Указывайте только прокси, которыми вы управляете. Записи loopback по-прежнему допустимы для настроек прокси/локального обнаружения на том же хосте (например, Tailscale Serve или локальный reverse proxy), но они **не** делают запросы loopback подходящими для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: когда `true`, Gateway принимает `X-Real-IP`, если `X-Forwarded-For` отсутствует. По умолчанию `false` для поведения с закрытым отказом.
- `gateway.nodes.pairing.autoApproveCidrs`: необязательный список разрешенных CIDR/IP для автоматического одобрения первичного сопряжения устройства узла без запрошенных областей. Отключено, когда не задано. Это не одобряет автоматически сопряжение оператора/браузера/Control UI/WebChat, а также не одобряет автоматически обновления роли, области, метаданных или публичного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальное формирование allow/deny для объявленных команд узла после сопряжения и оценки списка разрешений платформы. Используйте `allowCommands`, чтобы включить опасные команды узла, такие как `camera.snap`, `camera.clip` и `screen.record`; `denyCommands` удаляет команду, даже если значение платформы по умолчанию или явное разрешение иначе включило бы ее. После того как узел изменит объявленный список команд, отклоните и повторно одобрите сопряжение этого устройства, чтобы Gateway сохранил обновленный снимок команд.
- `gateway.tools.deny`: дополнительные имена инструментов, заблокированные для HTTP `POST /tools/invoke` (расширяет список запретов по умолчанию).
- `gateway.tools.allow`: удалить имена инструментов из списка запретов HTTP по умолчанию для вызывающих сторон owner/admin. Это не повышает вызывающие стороны с идентичностью `operator.write` до доступа owner/admin; `cron`, `gateway` и `nodes` остаются недоступными для вызывающих сторон не owner, даже если они добавлены в список разрешений.

</Accordion>

### Эндпоинты, совместимые с OpenAI

- Admin HTTP RPC: по умолчанию отключен как Plugin `admin-http-rpc`. Включите Plugin, чтобы зарегистрировать `POST /api/v1/admin/rpc`. См. [Admin HTTP RPC](/ru/plugins/admin-http-rpc).
- Chat Completions: по умолчанию отключены. Включите через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Усиление защиты URL-входов Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Пустые списки разрешений считаются незаданными; используйте `gateway.http.endpoints.responses.files.allowUrl=false`
    и/или `gateway.http.endpoints.responses.images.allowUrl=false`, чтобы отключить получение URL.
- Необязательный заголовок усиления защиты ответа:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте только для HTTPS origin, которыми вы управляете; см. [Аутентификация через доверенный прокси](/ru/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Изоляция нескольких экземпляров

Запускайте несколько Gateway на одном хосте с уникальными портами и каталогами состояния:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Удобные флаги: `--dev` (использует `~/.openclaw-dev` + порт `19001`), `--profile <name>` (использует `~/.openclaw-<name>`).

См. [Несколько Gateway](/ru/gateway/multiple-gateways).

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

- `enabled`: включает завершение TLS на слушателе Gateway (HTTPS/WSS) (по умолчанию: `false`).
- `autoGenerate`: автоматически генерирует локальную самоподписанную пару сертификат/ключ, когда явные файлы не настроены; только для локального использования/разработки.
- `certPath`: путь в файловой системе к файлу сертификата TLS.
- `keyPath`: путь в файловой системе к файлу закрытого ключа TLS; держите с ограниченными разрешениями.
- `caPath`: необязательный путь к набору CA для проверки клиентов или пользовательских цепочек доверия.

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

- `mode`: управляет тем, как правки конфигурации применяются во время выполнения.
  - `"off"`: игнорировать правки на лету; изменения требуют явного перезапуска.
  - `"restart"`: всегда перезапускать процесс Gateway при изменении конфигурации.
  - `"hot"`: применять изменения внутри процесса без перезапуска.
  - `"hybrid"` (по умолчанию): сначала пробовать горячую перезагрузку; при необходимости откатываться к перезапуску.
- `debounceMs`: окно debounce в мс перед применением изменений конфигурации (неотрицательное целое число).
- `deferralTimeoutMs`: необязательное максимальное время ожидания в мс для текущих операций перед принудительным перезапуском или горячей перезагрузкой канала. Не указывайте, чтобы использовать ограниченное ожидание по умолчанию (`300000`); задайте `0`, чтобы ждать бесконечно и периодически записывать предупреждения о всё ещё ожидающих операциях.

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

Аутентификация: `Authorization: Bearer <token>` или `x-openclaw-token: <token>`.
Токены хуков в строке запроса отклоняются.

Примечания по валидации и безопасности:

- `hooks.enabled=true` требует непустой `hooks.token`.
- `hooks.token` должен отличаться от активной аутентификации Gateway с общим секретом (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` или `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); при обнаружении повторного использования запуск записывает некритическое предупреждение безопасности.
- `openclaw security audit` помечает повторное использование аутентификации хуков/Gateway как критическую находку, включая аутентификацию Gateway по паролю, переданную только во время аудита (`--auth password --password <password>`). Запустите `openclaw doctor --fix`, чтобы ротировать сохранённый повторно используемый `hooks.token`, затем обновите внешних отправителей хуков, чтобы они использовали новый токен хука.
- `hooks.path` не может быть `/`; используйте выделенный подпуть, например `/hooks`.
- Если `hooks.allowRequestSessionKey=true`, ограничьте `hooks.allowedSessionKeyPrefixes` (например, `["hook:"]`).
- Если сопоставление или preset использует шаблонный `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` и `hooks.allowRequestSessionKey=true`. Статические ключи сопоставления не требуют такого явного включения.

**Эндпоинты:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` из тела запроса принимается только когда `hooks.allowRequestSessionKey=true` (по умолчанию: `false`).
- `POST /hooks/<name>` → разрешается через `hooks.mappings`
  - Значения `sessionKey` сопоставления, отрендеренные из шаблона, считаются переданными извне и также требуют `hooks.allowRequestSessionKey=true`.

<Accordion title="Сведения о сопоставлениях">

- `match.path` сопоставляет подпуть после `/hooks` (например, `/hooks/gmail` → `gmail`).
- `match.source` сопоставляет поле payload для универсальных путей.
- Шаблоны вроде `{{messages[0].subject}}` читают данные из payload.
- `transform` может указывать на модуль JS/TS, возвращающий действие хука.
  - `transform.module` должен быть относительным путём и оставаться внутри `hooks.transformsDir` (абсолютные пути и обход каталогов отклоняются).
  - Держите `hooks.transformsDir` внутри `~/.openclaw/hooks/transforms`; каталоги Skills рабочей области отклоняются. Если `openclaw doctor` сообщает, что этот путь недействителен, переместите модуль transform в каталог transforms хуков или удалите `hooks.transformsDir`.
- `agentId` направляет к конкретному агенту; неизвестные ID откатываются к агенту по умолчанию.
- `allowedAgentIds`: ограничивает фактическую маршрутизацию агентов, включая путь агента по умолчанию, когда `agentId` опущен (`*` или опущено = разрешить все, `[]` = запретить все).
- `defaultSessionKey`: необязательный фиксированный ключ сессии для запусков агента хуком без явного `sessionKey`.
- `allowRequestSessionKey`: разрешает вызывающим `/hooks/agent` и ключам сессии сопоставлений на основе шаблонов задавать `sessionKey` (по умолчанию: `false`).
- `allowedSessionKeyPrefixes`: необязательный allowlist префиксов для явных значений `sessionKey` (запрос + сопоставление), например `["hook:"]`. Он становится обязательным, когда любое сопоставление или preset использует шаблонный `sessionKey`.
- `deliver: true` отправляет финальный ответ в канал; `channel` по умолчанию равен `last`.
- `model` переопределяет LLM для этого запуска хука (должна быть разрешена, если задан каталог моделей).

</Accordion>

### Интеграция Gmail

- Встроенный preset Gmail использует `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Если вы сохраняете такую маршрутизацию по сообщению, задайте `hooks.allowRequestSessionKey: true` и ограничьте `hooks.allowedSessionKeyPrefixes`, чтобы они соответствовали пространству имён Gmail, например `["hook:", "hook:gmail:"]`.
- Если вам нужно `hooks.allowRequestSessionKey: false`, переопределите preset статическим `sessionKey` вместо шаблонного значения по умолчанию.

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

- Gateway автоматически запускает `gog gmail watch serve` при загрузке, когда это настроено. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, чтобы отключить.
- Не запускайте отдельный `gog gmail watch serve` параллельно с Gateway.

---

## Хост плагина Canvas

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

- Обслуживает редактируемые агентом HTML/CSS/JS и A2UI по HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Только локально: оставьте `gateway.bind: "loopback"` (по умолчанию).
- Привязки не к loopback: маршруты canvas требуют аутентификацию Gateway (токен/пароль/trusted-proxy), как и другие HTTP-поверхности Gateway.
- Node WebViews обычно не отправляют заголовки аутентификации; после сопряжения и подключения узла Gateway объявляет URL возможностей, ограниченные этим узлом, для доступа к canvas/A2UI.
- URL возможностей привязаны к активной WS-сессии узла и быстро истекают. Резервный вариант на основе IP не используется.
- Внедряет клиент live-reload в обслуживаемый HTML.
- Автоматически создаёт стартовый `index.html`, когда каталог пуст.
- Также обслуживает A2UI по `/__openclaw__/a2ui/`.
- Изменения требуют перезапуска Gateway.
- Отключите live reload для больших каталогов или ошибок `EMFILE`.

---

## Обнаружение

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

- `minimal` (по умолчанию, когда встроенный плагин `bonjour` включён): не включать `cliPath` + `sshPort` в TXT-записи.
- `full`: включать `cliPath` + `sshPort`; многоадресная реклама в LAN всё равно требует включённого встроенного плагина `bonjour`.
- `off`: подавить многоадресную рекламу в LAN без изменения включённости плагина.
- Встроенный плагин `bonjour` автоматически запускается на хостах macOS и включается явно на Linux, Windows и контейнеризованных развёртываниях Gateway.
- Имя хоста по умолчанию равно системному имени хоста, когда оно является допустимой DNS-меткой, с откатом к `openclaw`. Переопределите через `OPENCLAW_MDNS_HOSTNAME`.

### Широкая область (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записывает одноадресную зону DNS-SD в `~/.openclaw/dns/`. Для обнаружения между сетями используйте вместе с DNS-сервером (рекомендуется CoreDNS) и раздельным DNS Tailscale.

Настройка: `openclaw dns setup --apply`.

---

## Окружение

### `env` (встроенные переменные окружения)

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

- Встроенные переменные окружения применяются только если в окружении процесса отсутствует этот ключ.
- Файлы `.env`: `.env` в CWD + `~/.openclaw/.env` (ни один из них не переопределяет существующие переменные).
- `shellEnv`: импортирует отсутствующие ожидаемые ключи из профиля вашей login shell.
- Полный порядок приоритета см. в разделе [Окружение](/ru/help/environment).

### Подстановка переменных окружения

Ссылайтесь на переменные окружения в любой строке конфигурации через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Сопоставляются только имена в верхнем регистре: `[A-Z_][A-Z0-9_]*`.
- Отсутствующие или пустые переменные вызывают ошибку при загрузке конфигурации.
- Экранируйте через `$${VAR}`, чтобы получить буквальное `${VAR}`.
- Работает с `$include`.

---

## Секреты

Ссылки на секреты добавочны: значения в открытом виде по-прежнему работают.

### `SecretRef`

Используйте одну форму объекта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Проверка:

- Шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютный JSON Pointer (например `"/providers/openai/apiKey"`)
- Шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (поддерживает селекторы в стиле AWS `secret#json_key`)
- id для `source: "exec"` не должны содержать сегменты пути, разделенные слэшами, `.` или `..` (например, `a/../b` отклоняется)

### Поддерживаемая поверхность учетных данных

- Каноническая матрица: [Поверхность учетных данных SecretRef](/ru/reference/secretref-credential-surface)
- `secrets apply` нацелен на поддерживаемые пути учетных данных в `openclaw.json`.
- Ссылки `auth-profiles.json` включены в разрешение во время выполнения и покрытие аудита.

### Конфигурация поставщиков секретов

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

Примечания:

- Поставщик `file` поддерживает `mode: "json"` и `mode: "singleValue"` (`id` должен быть `"value"` в режиме singleValue).
- Пути поставщиков file и exec отказывают в закрытом режиме, когда проверка ACL Windows недоступна. Устанавливайте `allowInsecurePath: true` только для доверенных путей, которые невозможно проверить.
- Поставщик `exec` требует абсолютный путь `command` и использует протокольные полезные нагрузки через stdin/stdout.
- По умолчанию пути команд через symlink отклоняются. Установите `allowSymlinkCommand: true`, чтобы разрешить пути через symlink с проверкой разрешенного целевого пути.
- Если настроен `trustedDirs`, проверка доверенного каталога применяется к разрешенному целевому пути.
- Дочернее окружение `exec` по умолчанию минимально; явно передавайте требуемые переменные через `passEnv`.
- Ссылки на секреты разрешаются во время активации в снимок в памяти, после чего пути запросов читают только этот снимок.
- Фильтрация активной поверхности применяется во время активации: неразрешенные ссылки на включенных поверхностях приводят к сбою запуска или перезагрузки, а неактивные поверхности пропускаются с диагностикой.

---

## Хранилище аутентификации

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

- Профили для каждого агента хранятся в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` поддерживает ссылки на уровне значений (`keyRef` для `api_key`, `tokenRef` для `token`) для статических режимов учетных данных.
- Устаревшие плоские карты `auth-profiles.json`, такие как `{ "provider": { "apiKey": "..." } }`, не являются форматом среды выполнения; `openclaw doctor --fix` переписывает их в канонические профили API-ключей `provider:default` с резервной копией `.legacy-flat.*.bak`.
- Профили в режиме OAuth (`auth.profiles.<id>.mode = "oauth"`) не поддерживают учетные данные профиля аутентификации на основе SecretRef.
- Статические учетные данные среды выполнения берутся из разрешенных снимков в памяти; устаревшие статические записи `auth.json` очищаются при обнаружении.
- Устаревшие импорты OAuth берутся из `~/.openclaw/credentials/oauth.json`.
- См. [OAuth](/ru/concepts/oauth).
- Поведение секретов во время выполнения и инструменты `audit/configure/apply`: [Управление секретами](/ru/gateway/secrets).

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

- `billingBackoffHours`: базовая задержка в часах, когда профиль дает сбой из-за настоящих
  ошибок биллинга или недостатка кредитов (по умолчанию: `5`). Явный текст о биллинге
  все еще может попасть сюда даже в ответах `401`/`403`, но текстовые сопоставители,
  специфичные для провайдера, остаются ограничены провайдером, которому они принадлежат
  (например, OpenRouter `Key limit exceeded`). Повторяемые сообщения HTTP `402` об окне
  использования или лимите расходов организации/рабочей области остаются в пути
  `rate_limit`.
- `billingBackoffHoursByProvider`: необязательные переопределения часов задержки биллинга для отдельных провайдеров.
- `billingMaxHours`: ограничение в часах для экспоненциального роста задержки биллинга (по умолчанию: `24`).
- `authPermanentBackoffMinutes`: базовая задержка в минутах для высокодостоверных сбоев `auth_permanent` (по умолчанию: `10`).
- `authPermanentMaxMinutes`: ограничение в минутах для роста задержки `auth_permanent` (по умолчанию: `60`).
- `failureWindowHours`: скользящее окно в часах, используемое для счетчиков задержки (по умолчанию: `24`).
- `overloadedProfileRotations`: максимальное число ротаций профиля аутентификации у того же провайдера для ошибок перегрузки перед переключением на резервную модель (по умолчанию: `1`). Формы занятости провайдера, такие как `ModelNotReadyException`, попадают сюда.
- `overloadedBackoffMs`: фиксированная задержка перед повтором ротации перегруженного провайдера/профиля (по умолчанию: `0`).
- `rateLimitedProfileRotations`: максимальное число ротаций профиля аутентификации у того же провайдера для ошибок лимита частоты перед переключением на резервную модель (по умолчанию: `1`). Эта корзина лимитов частоты включает текст в форме провайдера, такой как `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` и `resource exhausted`.

---

## Ведение журналов

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

- Файл журнала по умолчанию: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Задайте `logging.file` для стабильного пути.
- `consoleLevel` повышается до `debug` при `--verbose`.
- `maxFileBytes`: максимальный размер активного файла журнала в байтах перед ротацией (положительное целое число; по умолчанию: `104857600` = 100 МБ). OpenClaw хранит до пяти пронумерованных архивов рядом с активным файлом.
- `redactSensitive` / `redactPatterns`: маскирование по принципу максимального усилия для консольного вывода, файловых журналов, записей журналов OTLP и сохраненного текста стенограммы сессии. `redactSensitive: "off"` отключает только эту общую политику журналов/стенограмм; поверхности безопасности UI/инструментов/диагностики все равно редактируют секреты перед отправкой.

---

## Диагностика

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

- `enabled`: главный переключатель для вывода инструментирования (по умолчанию: `true`).
- `flags`: массив строк флагов, включающих целевой вывод журналов (поддерживает подстановочные знаки вроде `"telegram.*"` или `"*"`).
- `stuckSessionWarnMs`: порог возраста без прогресса в мс для классификации длительных сессий обработки как `session.long_running`, `session.stalled` или `session.stuck`. Ответ, инструмент, статус, блок и прогресс ACP сбрасывают таймер; повторные диагностические события `session.stuck` увеличивают задержку, пока состояние не меняется.
- `stuckSessionAbortMs`: порог возраста без прогресса в мс, после которого подходящая зависшая активная работа может быть прервана и сброшена для восстановления. Если не задано, OpenClaw использует более безопасное расширенное окно встроенного запуска не менее 5 минут и 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: захватывает отредактированный снимок стабильности перед OOM, когда давление памяти достигает `critical` (по умолчанию: `false`). Установите `true`, чтобы добавить сканирование/запись файла пакета стабильности, сохранив обычные события давления памяти.
- `otel.enabled`: включает конвейер экспорта OpenTelemetry (по умолчанию: `false`). Полную конфигурацию, каталог сигналов и модель конфиденциальности см. в [экспорте OpenTelemetry](/ru/gateway/opentelemetry).
- `otel.endpoint`: URL коллектора для экспорта OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необязательные конечные точки OTLP для конкретных сигналов. Если заданы, они переопределяют `otel.endpoint` только для этого сигнала.
- `otel.protocol`: `"http/protobuf"` (по умолчанию) или `"grpc"`.
- `otel.headers`: дополнительные заголовки метаданных HTTP/gRPC, отправляемые с запросами экспорта OTel.
- `otel.serviceName`: имя сервиса для атрибутов ресурса.
- `otel.traces` / `otel.metrics` / `otel.logs`: включают экспорт трасс, метрик или журналов.
- `otel.logsExporter`: приемник экспорта журналов: `"otlp"` (по умолчанию), `"stdout"` для одного объекта JSON на строку stdout или `"both"`.
- `otel.sampleRate`: частота выборки трасс `0`-`1`.
- `otel.flushIntervalMs`: периодический интервал сброса телеметрии в мс.
- `otel.captureContent`: опциональный захват необработанного содержимого для атрибутов span OTEL. По умолчанию отключен. Булево значение `true` захватывает несистемное содержимое сообщений/инструментов; форма объекта позволяет явно включить `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` и `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: переключатель среды для последней экспериментальной формы span вывода GenAI, включая имена span `{gen_ai.operation.name} {gen_ai.request.model}`, вид span `CLIENT` и `gen_ai.provider.name` вместо устаревшего `gen_ai.system`. По умолчанию span сохраняют `openclaw.model.call` и `gen_ai.system` для совместимости; метрики GenAI используют ограниченные семантические атрибуты.
- `OPENCLAW_OTEL_PRELOADED=1`: переключатель среды для хостов, которые уже зарегистрировали глобальный SDK OpenTelemetry. В таком случае OpenClaw пропускает запуск/остановку SDK, принадлежащего Plugin, сохраняя диагностические слушатели активными.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` и `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: переменные среды конечных точек для конкретных сигналов, используемые, когда соответствующий ключ конфигурации не задан.
- `cacheTrace.enabled`: записывать снимки трассировки кэша для встроенных запусков (по умолчанию: `false`).
- `cacheTrace.filePath`: выходной путь для JSONL трассировки кэша (по умолчанию: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: управляют тем, что включается в вывод трассировки кэша (все по умолчанию: `true`).

---

## Обновление

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

- `channel`: канал релизов для установок npm/git - `"stable"`, `"beta"` или `"dev"`.
- `checkOnStart`: проверять обновления npm при запуске Gateway (по умолчанию: `true`).
- `auto.enabled`: включить фоновое автообновление для пакетных установок (по умолчанию: `false`).
- `auto.stableDelayHours`: минимальная задержка в часах перед автоматическим применением стабильного канала (по умолчанию: `6`; максимум: `168`).
- `auto.stableJitterHours`: дополнительное окно распределения развертывания стабильного канала в часах (по умолчанию: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: как часто выполняются проверки бета-канала, в часах (по умолчанию: `1`; максимум: `24`).

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

- `enabled`: глобальный переключатель функции ACP (по умолчанию: `true`; задайте `false`, чтобы скрыть отправку ACP и элементы создания).
- `dispatch.enabled`: независимый переключатель отправки хода сессии ACP (по умолчанию: `true`). Задайте `false`, чтобы команды ACP оставались доступными, но выполнение блокировалось.
- `backend`: идентификатор серверной среды выполнения ACP по умолчанию (должен соответствовать зарегистрированному Plugin среды выполнения ACP).
  Сначала установите Plugin серверной среды, и если задан `plugins.allow`, включите идентификатор Plugin серверной среды (например, `acpx`), иначе серверная среда ACP не загрузится.
- `defaultAgent`: резервный идентификатор целевого агента ACP, когда создания не указывают явную цель.
- `allowedAgents`: список разрешенных идентификаторов агентов для сессий среды выполнения ACP; пустое значение означает отсутствие дополнительных ограничений.
- `maxConcurrentSessions`: максимальное число одновременно активных сессий ACP.
- `stream.coalesceIdleMs`: окно сброса простоя в мс для потокового текста.
- `stream.maxChunkChars`: максимальный размер фрагмента перед разделением проекции потокового блока.
- `stream.repeatSuppression`: подавлять повторяющиеся строки статуса/инструментов в рамках хода (по умолчанию: `true`).
- `stream.deliveryMode`: `"live"` передает поток постепенно; `"final_only"` буферизует до терминальных событий хода.
- `stream.hiddenBoundarySeparator`: разделитель перед видимым текстом после скрытых событий инструментов (по умолчанию: `"paragraph"`).
- `stream.maxOutputChars`: максимальное число символов вывода ассистента, проецируемых на ход ACP.
- `stream.maxSessionUpdateChars`: максимальное число символов для проецируемых строк статуса/обновлений ACP.
- `stream.tagVisibility`: запись имен тегов в булевы переопределения видимости для потоковых событий.
- `runtime.ttlMinutes`: TTL простоя в минутах для рабочих процессов сессии ACP перед возможной очисткой.
- `runtime.installCommand`: необязательная команда установки, запускаемая при начальной настройке среды выполнения ACP.

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

- `cli.banner.taglineMode` управляет стилем слогана баннера:
  - `"random"` (по умолчанию): чередующиеся забавные/сезонные слоганы.
  - `"default"`: фиксированный нейтральный слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без текста слогана (заголовок/версия баннера по-прежнему отображаются).
- Чтобы скрыть весь баннер (а не только слоганы), задайте env `OPENCLAW_HIDE_BANNER=1`.

---

## Мастер

Метаданные, записываемые управляемыми потоками настройки CLI (`onboard`, `configure`, `doctor`):

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

## Идентичность

См. поля идентичности `agents.list` в разделе [Значения агентов по умолчанию](/ru/gateway/config-agents#agent-defaults).

---

## Мост (устаревшее, удалено)

Текущие сборки больше не включают TCP-мост. Узлы подключаются через Gateway WebSocket. Ключи `bridge.*` больше не являются частью схемы конфигурации (валидация завершается ошибкой до их удаления; `openclaw doctor --fix` может удалить неизвестные ключи).

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

- `sessionRetention`: как долго хранить завершенные изолированные сеансы запусков cron перед удалением из `sessions.json`. Также управляет очисткой архивированных удаленных стенограмм cron. По умолчанию: `24h`; задайте `false`, чтобы отключить.
- `runLog.maxBytes`: принимается для совместимости со старыми файловыми журналами запусков cron. По умолчанию: `2_000_000` байт.
- `runLog.keepLines`: количество новейших строк истории запусков SQLite, сохраняемых для каждого задания. По умолчанию: `2000`.
- `webhookToken`: bearer-токен, используемый для доставки cron webhook POST (`delivery.mode = "webhook"`); если он опущен, заголовок auth не отправляется.
- `webhook`: устаревший резервный URL webhook (http/https), используемый `openclaw doctor --fix` для миграции сохраненных заданий, в которых все еще есть `notify: true`; доставка во время выполнения использует `delivery.mode="webhook"` для каждого задания вместе с `delivery.to` или `delivery.completionDestination` при сохранении доставки объявлений.

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

- `maxAttempts`: максимальное число повторных попыток для заданий cron при временных ошибках (по умолчанию: `3`; диапазон: `0`-`10`).
- `backoffMs`: массив задержек backoff в мс для каждой повторной попытки (по умолчанию: `[30000, 60000, 300000]`; 1-10 записей).
- `retryOn`: типы ошибок, запускающие повторные попытки - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Опустите, чтобы повторять все временные типы.

Одноразовые задания остаются включенными, пока повторные попытки не будут исчерпаны, а затем отключаются с сохранением итогового состояния ошибки. Повторяющиеся задания используют ту же политику повторов при временных ошибках, чтобы снова выполниться после backoff до следующего запланированного окна; постоянные ошибки или исчерпанные повторы временных ошибок возвращаются к обычному расписанию повторяющихся заданий с backoff ошибки.

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

- `enabled`: включить оповещения о сбоях для заданий cron (по умолчанию: `false`).
- `after`: число последовательных сбоев до отправки оповещения (положительное целое, мин.: `1`).
- `cooldownMs`: минимальное число миллисекунд между повторными оповещениями для одного и того же задания (неотрицательное целое).
- `includeSkipped`: учитывать последовательные пропущенные запуски в пороге оповещения (по умолчанию: `false`). Пропущенные запуски отслеживаются отдельно и не влияют на backoff ошибок выполнения.
- `mode`: режим доставки - `"announce"` отправляет через сообщение канала; `"webhook"` публикует в настроенный webhook.
- `accountId`: необязательный идентификатор учетной записи или канала для ограничения области доставки оповещений.

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

- Назначение по умолчанию для уведомлений о сбоях cron во всех заданиях.
- `mode`: `"announce"` или `"webhook"`; по умолчанию используется `"announce"`, когда доступно достаточно целевых данных.
- `channel`: переопределение канала для доставки объявлений. `"last"` повторно использует последний известный канал доставки.
- `to`: явная цель объявления или URL webhook. Обязательно для режима webhook.
- `accountId`: необязательное переопределение учетной записи для доставки.
- `delivery.failureDestination` для отдельного задания переопределяет это глобальное значение по умолчанию.
- Когда не задано ни глобальное назначение сбоя, ни назначение сбоя для отдельного задания, задания, которые уже доставляются через `announce`, при сбое возвращаются к этой основной цели объявления.
- `delivery.failureDestination` поддерживается только для заданий `sessionTarget="isolated"`, если только основной `delivery.mode` задания не равен `"webhook"`.

См. [Задания Cron](/ru/automation/cron-jobs). Изолированные выполнения cron отслеживаются как [фоновые задачи](/ru/automation/tasks).

---

## Переменные шаблона модели медиа

Плейсхолдеры шаблона, раскрываемые в `tools.media.models[].args`:

| Переменная         | Описание                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Полное тело входящего сообщения                   |
| `{{RawBody}}`      | Необработанное тело (без оберток истории/отправителя) |
| `{{BodyStripped}}` | Тело с удаленными упоминаниями группы             |
| `{{From}}`         | Идентификатор отправителя                         |
| `{{To}}`           | Идентификатор назначения                          |
| `{{MessageSid}}`   | ID сообщения канала                               |
| `{{SessionId}}`    | UUID текущего сеанса                              |
| `{{IsNewSession}}` | `"true"` при создании нового сеанса               |
| `{{MediaUrl}}`     | Псевдо-URL входящего медиа                        |
| `{{MediaPath}}`    | Локальный путь к медиа                            |
| `{{MediaType}}`    | Тип медиа (изображение/аудио/документ/…)          |
| `{{Transcript}}`   | Стенограмма аудио                                 |
| `{{Prompt}}`       | Разрешенный промпт медиа для записей CLI          |
| `{{MaxChars}}`     | Разрешенное максимальное число символов вывода для записей CLI |
| `{{ChatType}}`     | `"direct"` или `"group"`                          |
| `{{GroupSubject}}` | Тема группы (по мере возможности)                 |
| `{{GroupMembers}}` | Предпросмотр участников группы (по мере возможности) |
| `{{SenderName}}`   | Отображаемое имя отправителя (по мере возможности) |
| `{{SenderE164}}`   | Номер телефона отправителя (по мере возможности)  |
| `{{Provider}}`     | Подсказка провайдера (whatsapp, telegram, discord и т. д.) |

---

## Включения конфигурации (`$include`)

Разделите конфигурацию на несколько файлов:

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

**Поведение слияния:**

- Один файл: заменяет содержащий объект.
- Массив файлов: глубоко объединяется по порядку (последующие переопределяют предыдущие).
- Соседние ключи: объединяются после включений (переопределяют включенные значения).
- Вложенные включения: до 10 уровней глубины.
- Пути: разрешаются относительно включающего файла, но должны оставаться внутри каталога конфигурации верхнего уровня (`dirname` от `openclaw.json`). Абсолютные формы/формы `../` разрешены только тогда, когда они все равно разрешаются внутри этой границы. Пути не должны содержать нулевые байты и должны быть строго короче 4096 символов до и после разрешения.
- Записи, принадлежащие OpenClaw и изменяющие только один раздел верхнего уровня, основанный на однофайловом включении, записываются в этот включенный файл. Например, `plugins install` обновляет `plugins: { $include: "./plugins.json5" }` в `plugins.json5` и оставляет `openclaw.json` без изменений.
- Корневые включения, массивы включений и включения с соседними переопределениями доступны только для чтения для записей, принадлежащих OpenClaw; такие записи завершаются закрытым отказом вместо выравнивания конфигурации.
- Ошибки: понятные сообщения для отсутствующих файлов, ошибок разбора, циклических включений, недопустимого формата пути и чрезмерной длины.

---

_См. также: [Конфигурация](/ru/gateway/configuration) · [Примеры конфигурации](/ru/gateway/configuration-examples) · [Doctor](/ru/gateway/doctor)_

## Связанные материалы

- [Конфигурация](/ru/gateway/configuration)
- [Примеры конфигурации](/ru/gateway/configuration-examples)
