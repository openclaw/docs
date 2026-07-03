---
read_when:
    - Вам нужны точные семантика конфигурации на уровне полей или значения по умолчанию
    - Вы проверяете блоки конфигурации канала, модели, Gateway или инструмента
summary: Справочник конфигурации Gateway для основных ключей OpenClaw, значений по умолчанию и ссылок на отдельные справочники подсистем
title: Справочник по конфигурации
x-i18n:
    generated_at: "2026-07-03T23:39:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Справочник основной конфигурации для `~/.openclaw/openclaw.json`. Обзор, ориентированный на задачи, см. в [Конфигурация](/ru/gateway/configuration).

Охватывает основные поверхности конфигурации OpenClaw и ссылается на отдельные материалы, когда у подсистемы есть собственный более глубокий справочник. Каталоги команд, принадлежащие каналам и Plugin, а также глубокие параметры памяти/QMD находятся на собственных страницах, а не на этой.

Источник истины в коде:

- `openclaw config schema` выводит актуальную JSON Schema, используемую для валидации и Control UI, с объединенными метаданными bundled/plugin/channel, когда они доступны
- `config.schema.lookup` возвращает один узел схемы с областью действия по пути для инструментов детального просмотра
- `pnpm config:docs:check` / `pnpm config:docs:gen` проверяют базовый хеш документации конфигурации относительно текущей поверхности схемы

Путь поиска агента: используйте действие инструмента `gateway` `config.schema.lookup` для
точной документации и ограничений на уровне полей перед правками. Используйте
[Конфигурация](/ru/gateway/configuration) для руководства, ориентированного на задачи, а эту страницу
для более широкой карты полей, значений по умолчанию и ссылок на справочники подсистем.

Отдельные глубокие справочники:

- [Справочник конфигурации памяти](/ru/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` и конфигурации dreaming в `plugins.entries.memory-core.config.dreaming`
- [Слэш-команды](/ru/tools/slash-commands) для текущего встроенного + bundled каталога команд
- страницы владельцев каналов/Plugin для поверхностей команд, специфичных для каналов

Формат конфигурации — **JSON5** (разрешены комментарии и завершающие запятые). Все поля необязательны - OpenClaw использует безопасные значения по умолчанию, когда они опущены.

---

## Каналы

Ключи конфигурации для отдельных каналов перенесены на отдельную страницу - см.
[Конфигурация - каналы](/ru/gateway/config-channels) для `channels.*`,
включая Slack, Discord, Telegram, WhatsApp, Matrix, iMessage и другие
bundled-каналы (аутентификация, контроль доступа, несколько учетных записей, фильтрация упоминаний).

## Значения агента по умолчанию, multi-agent, сессии и сообщения

Перенесено на отдельную страницу - см.
[Конфигурация - агенты](/ru/gateway/config-agents) для:

- `agents.defaults.*` (рабочая область, модель, рассуждение, heartbeat, память, медиа, Skills, sandbox)
- `multiAgent.*` (маршрутизация и привязки multi-agent)
- `session.*` (жизненный цикл сессии, Compaction, pruning)
- `messages.*` (доставка сообщений, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.consultThinkingLevel`: переопределение уровня рассуждения для полного запуска агента OpenClaw за realtime-консультациями Control UI Talk
  - `talk.consultFastMode`: одноразовое переопределение fast-mode для realtime-консультаций Control UI Talk
  - `talk.speechLocale`: необязательный идентификатор локали BCP 47 для распознавания речи Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: если не задано, Talk сохраняет стандартное для платформы окно паузы перед отправкой транскрипта (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback ретрансляции Gateway для финализированных realtime-транскриптов Talk, которые пропускают `openclaw_agent_consult`

## Инструменты и пользовательские провайдеры

Политика инструментов, экспериментальные переключатели, конфигурация инструментов на базе провайдера и настройка пользовательского
провайдера / base-URL перенесены на отдельную страницу - см.
[Конфигурация - инструменты и пользовательские провайдеры](/ru/gateway/config-tools).

## Модели

Определения провайдеров, allowlist моделей и настройка пользовательских провайдеров находятся в
[Конфигурация - инструменты и пользовательские провайдеры](/ru/gateway/config-tools#custom-providers-and-base-urls).
Корень `models` также отвечает за глобальное поведение каталога моделей.

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
  абсолютную `command` при необходимости, ожидает готовности, затем отправляет запрос
  модели. См. [Локальные сервисы моделей](/ru/gateway/local-model-services).
- `models.pricing.enabled`: управляет фоновым bootstrap ценообразования, который
  запускается после того, как sidecar-процессы и каналы достигают пути готовности Gateway. Когда `false`,
  Gateway пропускает получение каталогов цен OpenRouter и LiteLLM; настроенные
  значения `models.providers.*.models[].cost` по-прежнему работают для локальных оценок стоимости.

## MCP

Определения MCP-серверов, управляемых OpenClaw, находятся в `mcp.servers` и
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

- `mcp.servers`: именованные определения stdio или удаленных MCP-серверов для runtime, которые
  предоставляют настроенные MCP-инструменты.
  Удаленные записи используют `transport: "streamable-http"` или `transport: "sse"`;
  `type: "http"` — это CLI-native псевдоним, который `openclaw mcp set` и
  `openclaw doctor --fix` нормализуют в каноническое поле `transport`.
- `mcp.servers.<name>.enabled`: задайте `false`, чтобы сохранить определение сервера
  и при этом исключить его из обнаружения embedded OpenClaw MCP и проекции инструментов.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: тайм-аут MCP-запроса для сервера
  в секундах или миллисекундах.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: тайм-аут подключения для сервера
  в секундах или миллисекундах.
- `mcp.servers.<name>.supportsParallelToolCalls`: необязательная подсказка о параллелизме для
  адаптеров, которые могут выбирать, выполнять ли параллельные вызовы MCP-инструментов.
- `mcp.servers.<name>.auth`: задайте `"oauth"` для HTTP MCP-серверов, которым требуется
  OAuth. Выполните `openclaw mcp login <name>`, чтобы сохранить токены в состоянии OpenClaw.
- `mcp.servers.<name>.oauth`: необязательные переопределения scope OAuth, redirect URL и URL метаданных
  клиента.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: элементы управления HTTP TLS
  для private endpoints и mutual TLS.
- `mcp.servers.<name>.toolFilter`: необязательный выбор инструментов для отдельного сервера. `include`
  ограничивает обнаруженные MCP-инструменты совпадающими именами; `exclude` скрывает совпадающие
  имена. Записи являются точными именами MCP-инструментов или простыми glob-шаблонами `*`. Серверы с
  ресурсами или prompts также генерируют имена утилитарных инструментов (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), и эти имена используют тот же
  фильтр.
- `mcp.servers.<name>.codex`: необязательные элементы управления проекцией app-server Codex.
  Этот блок — метаданные OpenClaw только для app-server threads Codex; он не
  влияет на сессии ACP, общую конфигурацию harness Codex или другие runtime-адаптеры.
  Непустой `codex.agents` ограничивает сервер перечисленными id агентов OpenClaw.
  Пустые, blank или недопустимые списки агентов с областью действия отклоняются валидацией конфигурации
  и опускаются runtime-путем проекции вместо превращения в глобальные.
  `codex.defaultToolsApprovalMode` выводит native
  `default_tools_approval_mode` Codex для этого сервера. OpenClaw удаляет блок `codex`
  перед передачей native-конфигурации `mcp_servers` в Codex. Опустите блок, чтобы
  сохранить проекцию сервера для каждого app-server агента Codex с поведением
  подтверждения MCP по умолчанию Codex.
- `mcp.sessionIdleTtlMs`: idle TTL для session-scoped bundled MCP runtimes.
  Одноразовые embedded-запуски запрашивают cleanup в конце run; этот TTL является запасным механизмом для
  долгоживущих сессий и будущих вызывающих сторон.
- Изменения в `mcp.*` применяются на лету путем освобождения кешированных session MCP runtimes.
  Следующее обнаружение/использование инструмента пересоздает их из новой конфигурации, поэтому удаленные
  записи `mcp.servers` убираются немедленно, а не ждут idle TTL.
- Runtime-обнаружение также учитывает уведомления об изменении списка MCP-инструментов, удаляя
  кешированный каталог для этой сессии. Серверы, объявляющие resources или
  prompts, получают утилитарные инструменты для перечисления/чтения ресурсов и перечисления/получения
  prompts. Повторяющиеся сбои вызовов инструментов ненадолго приостанавливают затронутый сервер перед
  следующей попыткой вызова.

См. [MCP](/ru/cli/mcp#openclaw-as-an-mcp-client-registry) и
[CLI-бэкенды](/ru/gateway/cli-backends#bundle-mcp-overlays) для поведения runtime.

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

- `allowBundled`: необязательный allowlist только для bundled Skills (управляемые/workspace Skills не затрагиваются).
- `load.extraDirs`: дополнительные общие корни Skills (самый низкий приоритет).
- `load.allowSymlinkTargets`: доверенные реальные целевые корни, в которые могут
  разрешаться symlink Skills, когда ссылка находится вне настроенного корня источника.
- `workshop.allowSymlinkTargetWrites`: разрешает Skill Workshop apply писать
  через уже доверенные цели symlink (по умолчанию: false).
- `install.preferBrew`: когда true, предпочитать установщики Homebrew, если `brew`
  доступен, перед fallback к другим типам установщиков.
- `install.nodeManager`: предпочтение установщика node для спецификаций `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: разрешить доверенным клиентам Gateway
  `operator.admin` устанавливать приватные zip-архивы, подготовленные через `skills.upload.*`
  (по умолчанию: false). Это включает только путь uploaded-archive; обычные установки ClawHub
  этого не требуют.
- `entries.<skillKey>.enabled: false` отключает Skill, даже если он bundled/установлен.
- `entries.<skillKey>.apiKey`: удобство для Skills, объявляющих основную env var (plaintext-строка или объект SecretRef).

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

- Загружается из каталогов пакетов или бандлов в `~/.openclaw/extensions` и `<workspace>/.openclaw/extensions`, а также из файлов или каталогов, перечисленных в `plugins.load.paths`.
- Помещайте самостоятельные файлы плагинов в `plugins.load.paths`; автоматически обнаруживаемые корни расширений игнорируют файлы верхнего уровня `.js`, `.mjs` и `.ts`, чтобы вспомогательные скрипты в этих корнях не блокировали запуск.
- Обнаружение принимает нативные плагины OpenClaw, а также совместимые бандлы Codex и бандлы Claude, включая бандлы Claude с макетом по умолчанию без манифеста.
- **Изменения конфигурации требуют перезапуска Gateway.**
- `allow`: необязательный список разрешений (загружаются только перечисленные плагины). `deny` имеет приоритет.
- `plugins.entries.<id>.apiKey`: удобное поле API-ключа на уровне плагина (если поддерживается плагином).
- `plugins.entries.<id>.env`: карта переменных окружения в области плагина.
- `plugins.entries.<id>.hooks.allowPromptInjection`: когда значение равно `false`, ядро блокирует `before_prompt_build` и игнорирует поля, изменяющие промпт, из устаревшего `before_agent_start`, сохраняя при этом устаревшие `modelOverride` и `providerOverride`. Применяется к нативным хукам плагинов и поддерживаемым каталогам хуков, предоставленным бандлами.
- `plugins.entries.<id>.hooks.allowConversationAccess`: когда значение равно `true`, доверенные небандловые плагины могут читать необработанное содержимое беседы из типизированных хуков, таких как `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` и `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно доверять этому плагину запрашивать переопределения `provider` и `model` для каждого запуска фоновых субагентов.
- `plugins.entries.<id>.subagent.allowedModels`: необязательный список разрешенных канонических целей `provider/model` для доверенных переопределений субагентов. Используйте `"*"` только если намеренно хотите разрешить любую модель.
- `plugins.entries.<id>.llm.allowModelOverride`: явно доверять этому плагину запрашивать переопределения модели для `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: необязательный список разрешенных канонических целей `provider/model` для доверенных переопределений завершений LLM плагина. Используйте `"*"` только если намеренно хотите разрешить любую модель.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: явно доверять этому плагину запускать `api.runtime.llm.complete` для идентификатора агента, отличного от используемого по умолчанию.
- `plugins.entries.<id>.config`: определенный плагином объект конфигурации (проверяется схемой нативного плагина OpenClaw, если доступна).
- Настройки учетной записи и runtime плагина канала находятся в `channels.<id>` и должны описываться метаданными `channelConfigs` манифеста владельца плагина, а не центральным реестром параметров OpenClaw.

### Конфигурация плагина harness Codex

Встроенный плагин `codex` владеет нативными настройками harness сервера приложений Codex в
`plugins.entries.codex.config`. Полная поверхность конфигурации описана в
[справочнике harness Codex](/ru/plugins/codex-harness-reference), а модель runtime — в
[harness Codex](/ru/plugins/codex-harness).

`codexPlugins` применяется только к сессиям, которые выбирают нативный harness Codex.
Он не включает плагины Codex для запусков провайдера OpenClaw, привязок бесед
ACP или любого harness, отличного от Codex.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: включает поддержку нативных
  плагинов/приложений Codex для harness Codex. По умолчанию: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  политика по умолчанию для разрушительных действий в перенесенных запросах приложений плагинов.
  Используйте `true`, чтобы принимать безопасные схемы подтверждения Codex без запроса, `false`,
  чтобы отклонять их, `"auto"`, чтобы направлять требуемые Codex подтверждения через подтверждения
  плагинов OpenClaw, или `"ask"`, чтобы запрашивать каждое записывающее/разрушительное действие
  плагина без постоянного подтверждения. Режим `"ask"` очищает постоянные переопределения
  подтверждений Codex для каждого инструмента затронутого приложения и выбирает рецензента
  человеческих подтверждений для этого приложения до запуска потока Codex.
  По умолчанию: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: включает
  перенесенную запись плагина, когда глобальный `codexPlugins.enabled` также равен true.
  По умолчанию: `true` для явных записей.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  стабильная идентичность маркетплейса. V1 поддерживает только `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: стабильная
  идентичность плагина Codex из миграции, например `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  переопределение разрушительных действий для отдельного плагина. Если оно опущено, используется
  глобальное значение `allow_destructive_actions`. Значение для отдельного плагина принимает те же
  политики `true`, `false`, `"auto"` или `"ask"`.

Каждое допущенное приложение плагина, использующее `"ask"`, направляет запросы подтверждения
этого приложения рецензенту-человеку. Другие приложения и подтверждения потока, не связанные
с приложениями, сохраняют настроенного рецензента, поэтому смешанные политики плагинов не
наследуют поведение `"ask"`.

`codexPlugins.enabled` — глобальная директива включения. Явные записи плагинов,
записанные миграцией, являются постоянным набором установленности и пригодности к ремонту.
`plugins["*"]` не поддерживается, переключателя `install` нет, а локальные значения
`marketplacePath` намеренно не являются полями конфигурации, потому что они зависят от хоста.

Проверки готовности `app/list` кэшируются на один час и обновляются
асинхронно при устаревании. Конфигурация приложения потока Codex вычисляется при установлении
сессии harness Codex, а не на каждом ходе; используйте `/new`, `/reset` или перезапуск Gateway
после изменения конфигурации нативного плагина.

- `plugins.entries.firecrawl.config.webFetch`: настройки провайдера web-fetch Firecrawl.
  - `apiKey`: необязательный API-ключ Firecrawl для более высоких лимитов (принимает SecretRef). Откатывается к `plugins.entries.firecrawl.config.webSearch.apiKey`, устаревшему `tools.web.fetch.firecrawl.apiKey` или переменной окружения `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовый URL API Firecrawl (по умолчанию: `https://api.firecrawl.dev`; переопределения для self-hosted должны указывать на приватные/внутренние endpoints).
  - `onlyMainContent`: извлекать только основное содержимое страниц (по умолчанию: `true`).
  - `maxAgeMs`: максимальный возраст кэша в миллисекундах (по умолчанию: `172800000` / 2 дня).
  - `timeoutSeconds`: тайм-аут запроса scrape в секундах (по умолчанию: `60`).
- `plugins.entries.xai.config.xSearch`: настройки xAI X Search (веб-поиск Grok).
  - `enabled`: включить провайдера X Search.
  - `model`: модель Grok, используемая для поиска (например, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: настройки dreaming памяти. Фазы и пороговые значения см. в [Dreaming](/ru/concepts/dreaming).
  - `enabled`: главный переключатель dreaming (по умолчанию `false`).
  - `frequency`: Cron-частота для каждого полного прохода dreaming (`"0 3 * * *"` по умолчанию).
  - `model`: необязательное переопределение модели субагента Dream Diary. Требует `plugins.entries.memory-core.subagent.allowModelOverride: true`; сочетайте с `allowedModels`, чтобы ограничить цели. Ошибки недоступности модели повторяются один раз с моделью сессии по умолчанию; сбои доверия или списка разрешений не откатываются без уведомления.
  - политика фаз и пороговые значения являются деталями реализации (не пользовательскими ключами конфигурации).
- Полная конфигурация памяти находится в [справочнике конфигурации памяти](/ru/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Включенные плагины бандлов Claude также могут добавлять встроенные значения OpenClaw по умолчанию из `settings.json`; OpenClaw применяет их как очищенные настройки агента, а не как необработанные патчи конфигурации OpenClaw.
- `plugins.slots.memory`: выберите идентификатор активного плагина памяти или `"none"`, чтобы отключить плагины памяти.
- `plugins.slots.contextEngine`: выберите идентификатор активного плагина движка контекста; по умолчанию используется `"legacy"`, если вы не установите и не выберете другой движок.

См. [Плагины](/ru/tools/plugin).

---

## Обязательства

`commitments` управляет выведенной памятью последующих действий: OpenClaw может обнаруживать контрольные сообщения в ходах беседы и доставлять их через запуски Heartbeat.

- `commitments.enabled`: включить скрытое извлечение LLM, хранение и доставку через Heartbeat для выведенных обязательств последующих действий. По умолчанию: `false`.
- `commitments.maxPerDay`: максимальное число выведенных обязательств последующих действий, доставляемых за сессию агента в скользящие сутки. По умолчанию: `3`.

См. [Выведенные обязательства](/ru/concepts/commitments).

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
- Устанавливайте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` только тогда, когда вы намеренно доверяете навигации браузера в частной сети.
- В строгом режиме удаленные конечные точки профилей CDP (`profiles.*.cdpUrl`) подчиняются той же блокировке частных сетей во время проверок доступности и обнаружения.
- `ssrfPolicy.allowPrivateNetwork` остается поддерживаемым как устаревший псевдоним.
- В строгом режиме используйте `ssrfPolicy.hostnameAllowlist` и `ssrfPolicy.allowedHostnames` для явных исключений.
- Удаленные профили работают только в режиме подключения (start/stop/reset отключены).
- `profiles.*.cdpUrl` принимает `http://`, `https://`, `ws://` и `wss://`.
  Используйте HTTP(S), когда хотите, чтобы OpenClaw обнаруживал `/json/version`; используйте WS(S),
  когда ваш провайдер дает прямой URL WebSocket DevTools.
- `remoteCdpTimeoutMs` и `remoteCdpHandshakeTimeoutMs` применяются к доступности удаленного и
  `attachOnly` CDP, а также к запросам открытия вкладок. Управляемые профили loopback
  сохраняют локальные значения CDP по умолчанию.
- Если внешне управляемая служба CDP доступна через loopback, установите для этого
  профиля `attachOnly: true`; иначе OpenClaw трактует порт loopback как
  локально управляемый профиль браузера и может сообщать об ошибках владения локальным портом.
- Профили `existing-session` используют Chrome MCP вместо CDP и могут подключаться на
  выбранном хосте или через подключенный браузерный узел.
- Профили `existing-session` могут задавать `userDataDir`, чтобы выбрать конкретный
  профиль браузера на базе Chromium, например Brave или Edge.
- Профили `existing-session` могут задавать `cdpUrl`, когда Chrome уже запущен
  за конечной точкой обнаружения DevTools HTTP(S) или прямой конечной точкой WS(S). В этом
  режиме OpenClaw передает конечную точку в Chrome MCP вместо auto-connect;
  `userDataDir` игнорируется для аргументов запуска Chrome MCP.
- Профили `existing-session` сохраняют текущие ограничения маршрута Chrome MCP:
  действия на основе snapshot/ref вместо выбора по CSS-селекторам, хуки загрузки одного файла,
  без переопределений тайм-аута диалогов, без `wait --load networkidle`, а также без
  `responsebody`, экспорта PDF, перехвата скачиваний или пакетных действий.
- Локальные управляемые профили `openclaw` автоматически назначают `cdpPort` и `cdpUrl`; задавайте
  `cdpUrl` явно только для удаленных профилей CDP или подключения к конечной точке existing-session.
- Локальные управляемые профили могут задавать `executablePath`, чтобы переопределить глобальный
  `browser.executablePath` для этого профиля. Используйте это, чтобы запускать один профиль в
  Chrome, а другой в Brave.
- Локальные управляемые профили используют `browser.localLaunchTimeoutMs` для HTTP-обнаружения Chrome CDP
  после запуска процесса и `browser.localCdpReadyTimeoutMs` для
  готовности websocket CDP после запуска. Увеличьте их на более медленных хостах, где Chrome
  успешно запускается, но проверки готовности опережают запуск. Оба значения должны быть
  положительными целыми числами до `120000` мс; недопустимые значения конфигурации отклоняются.
- Порядок автообнаружения: браузер по умолчанию, если он на базе Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` и `browser.profiles.<name>.executablePath` оба
  принимают `~` и `~/...` для домашнего каталога вашей ОС перед запуском Chromium.
  `userDataDir` для профиля в профилях `existing-session` также раскрывает тильду.
- Служба управления: только loopback (порт выводится из `gateway.port`, по умолчанию `18791`).
- `extraArgs` добавляет дополнительные флаги запуска к локальному старту Chromium (например
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

- `seamColor`: акцентный цвет для оформления UI нативного приложения (оттенок пузыря Talk Mode и т. д.).
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

- `mode`: `local` (запустить gateway) или `remote` (подключиться к удаленному gateway). Gateway отказывается запускаться, если значение не `local`.
- `port`: единый мультиплексированный порт для WS + HTTP. Приоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (по умолчанию), `lan` (`0.0.0.0`), `tailnet` (только IP Tailscale) или `custom`.
- **Устаревшие псевдонимы bind**: используйте значения режима bind в `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдонимы хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примечание о Docker**: привязка `loopback` по умолчанию слушает `127.0.0.1` внутри контейнера. При сетевом мосте Docker (`-p 18789:18789`) трафик приходит на `eth0`, поэтому gateway недоступен. Используйте `--network host` или задайте `bind: "lan"` (или `bind: "custom"` с `customBindHost: "0.0.0.0"`), чтобы слушать на всех интерфейсах.
- **Аутентификация**: требуется по умолчанию. Привязки не к loopback требуют аутентификацию gateway. На практике это означает общий токен/пароль или reverse proxy с учетом идентификации и `gateway.auth.mode: "trusted-proxy"`. Мастер онбординга по умолчанию генерирует токен.
- Если настроены и `gateway.auth.token`, и `gateway.auth.password` (включая SecretRefs), явно задайте `gateway.auth.mode` как `token` или `password`. Потоки запуска и установки/ремонта сервиса завершаются ошибкой, когда настроены оба значения, а режим не задан.
- `gateway.auth.mode: "none"`: явный режим без аутентификации. Используйте только для доверенных локальных установок local loopback; он намеренно не предлагается в подсказках онбординга.
- `gateway.auth.mode: "trusted-proxy"`: делегирует браузерную/пользовательскую аутентификацию reverse proxy с учетом идентификации и доверяет заголовкам идентификации от `gateway.trustedProxies` (см. [Аутентификация через доверенный proxy](/ru/gateway/trusted-proxy-auth)). Этот режим по умолчанию ожидает источник proxy **не из loopback**; reverse proxy на том же хосте через loopback требуют явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутренние вызывающие стороны на том же хосте могут использовать `gateway.auth.password` как локальный прямой fallback; `gateway.auth.token` остается взаимоисключающим с режимом trusted-proxy.
- `gateway.auth.allowTailscale`: когда `true`, заголовки идентификации Tailscale Serve могут удовлетворять аутентификацию Control UI/WebSocket (проверяется через `tailscale whois`). Конечные точки HTTP API **не** используют эту аутентификацию через заголовки Tailscale; вместо этого они следуют обычному режиму HTTP-аутентификации gateway. Этот поток без токена предполагает, что хост gateway доверенный. По умолчанию `true`, когда `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необязательный ограничитель неудачной аутентификации. Применяется по IP клиента и по области аутентификации (shared-secret и device-token отслеживаются независимо). Заблокированные попытки возвращают `429` + `Retry-After`.
  - В асинхронном пути Tailscale Serve Control UI неудачные попытки для одного и того же `{scope, clientIp}` сериализуются перед записью сбоя. Поэтому одновременные неверные попытки от одного клиента могут сработать ограничителем уже на втором запросе, вместо того чтобы обе прошли гонкой как простые несовпадения.
  - `gateway.auth.rateLimit.exemptLoopback` по умолчанию `true`; задайте `false`, если намеренно хотите ограничивать частоту и для трафика localhost (для тестовых установок или строгих развертываний proxy).
- Попытки WS-аутентификации с браузерным origin всегда ограничиваются по частоте с отключенным исключением для loopback (многоуровневая защита от браузерного перебора localhost).
- На loopback такие блокировки для браузерного origin изолированы по нормализованному значению `Origin`, поэтому повторяющиеся сбои из одного origin на localhost не блокируют автоматически другой origin.
- `tailscale.mode`: `serve` (только tailnet, привязка loopback) или `funnel` (публичный, требует аутентификации).
- `tailscale.serviceName`: необязательное имя службы Tailscale для режима Serve, например `svc:openclaw`. Когда оно задано, OpenClaw передает его в `tailscale serve
--service`, чтобы Control UI можно было открыть через именованную службу вместо имени хоста устройства. Значение должно использовать формат имени службы Tailscale `svc:<dns-label>`; при запуске сообщается производный URL службы.
- `tailscale.preserveFunnel`: когда `true` и `tailscale.mode = "serve"`, OpenClaw проверяет `tailscale funnel status` перед повторным применением Serve при запуске и пропускает его, если внешне настроенный маршрут Funnel уже покрывает порт gateway. По умолчанию `false`.
- `controlUi.allowedOrigins`: явный allowlist браузерных origin для подключений Gateway WebSocket. Требуется для публичных браузерных origin не из loopback. Частные загрузки UI с тем же origin в LAN/Tailnet из loopback, RFC1918/link-local, `.local`, `.ts.net` или хостов Tailscale CGNAT принимаются без включения fallback по заголовку Host.
- `controlUi.chatMessageMaxWidth`: необязательная максимальная ширина для сгруппированных сообщений чата Control UI. Принимает ограниченные значения ширины CSS, такие как `960px`, `82%`, `min(1280px, 82%)` и `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: опасный режим, включающий fallback origin по заголовку Host для развертываний, которые намеренно полагаются на политику origin по заголовку Host.
- `remote.transport`: `ssh` (по умолчанию) или `direct` (ws/wss). Для `direct` значение `remote.url` должно быть `wss://` для публичных хостов; открытый текст `ws://` принимается только для loopback, LAN, link-local, `.local`, `.ts.net` и хостов Tailscale CGNAT.
- `remote.remotePort`: порт gateway на удаленном SSH-хосте. По умолчанию `18789`; используйте это, когда локальный порт туннеля отличается от удаленного порта gateway.
- `remote.sshHostKeyPolicy`: политика ключей хоста SSH-туннеля macOS. `strict` используется по умолчанию и требует уже доверенный ключ. `openssh` — явное включение действующей конфигурации OpenSSH для управляемых псевдонимов; перед использованием проверьте соответствующие пользовательские и системные настройки SSH. Приложение macOS и `configure-remote` сбрасывают эту политику в `strict` при смене целей, если она явно не включена снова.
- `gateway.remote.token` / `.password` — поля учетных данных удаленного клиента. Сами по себе они не настраивают аутентификацию gateway.
- `gateway.push.apns.relay.baseUrl`: базовый HTTPS URL для внешнего relay APNs, используемого после того, как сборки iOS с поддержкой relay публикуют регистрации в gateway. Публичные сборки App Store используют размещенный relay OpenClaw. Пользовательские URL relay должны соответствовать намеренно отдельному пути сборки/развертывания iOS, чей URL relay указывает на этот relay.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут отправки от gateway к relay в миллисекундах. По умолчанию `10000`.
- Регистрации с поддержкой relay делегируются конкретной идентичности gateway. Сопряженное приложение iOS получает `gateway.identity.get`, включает эту идентичность в регистрацию relay и пересылает gateway scoped к регистрации разрешение на отправку. Другой gateway не может повторно использовать эту сохраненную регистрацию.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: временные переопределения env для указанной выше конфигурации relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: обходной путь только для разработки для HTTP URL relay на loopback. Production URL relay должны оставаться на HTTPS.
- `gateway.handshakeTimeoutMs`: тайм-аут pre-auth рукопожатия Gateway WebSocket в миллисекундах. По умолчанию: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` имеет приоритет, если задан. Увеличьте это значение на нагруженных или маломощных хостах, где локальные клиенты могут подключаться, пока прогрев запуска еще стабилизируется.
- `gateway.channelHealthCheckMinutes`: интервал монитора состояния канала в минутах. Задайте `0`, чтобы глобально отключить перезапуски монитора состояния. По умолчанию: `5`.
- `gateway.channelStaleEventThresholdMinutes`: порог stale-socket в минутах. Держите это значение больше или равным `gateway.channelHealthCheckMinutes`. По умолчанию: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальное число перезапусков монитором состояния на канал/учетную запись в скользящий час. По умолчанию: `10`.
- `channels.<provider>.healthMonitor.enabled`: отключение перезапусков монитором состояния для отдельного канала при сохранении глобального монитора включенным.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: переопределение для отдельной учетной записи в многопользовательских каналах. Если задано, оно имеет приоритет над переопределением уровня канала.
- Локальные пути вызова gateway могут использовать `gateway.remote.*` как fallback только когда `gateway.auth.*` не задано.
- Если `gateway.auth.token` / `gateway.auth.password` явно настроены через SecretRef и не разрешены, разрешение завершается в закрытом режиме (без маскировки удаленным fallback).
- `trustedProxies`: IP reverse proxy, которые завершают TLS или вставляют заголовки forwarded-client. Указывайте только proxy, которыми вы управляете. Записи loopback все еще допустимы для proxy/локального обнаружения на том же хосте (например, Tailscale Serve или локальный reverse proxy), но они **не** делают запросы loopback подходящими для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: когда `true`, gateway принимает `X-Real-IP`, если `X-Forwarded-For` отсутствует. По умолчанию `false` для поведения fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: необязательный allowlist CIDR/IP для автоматического одобрения первичного сопряжения устройства узла без запрошенных областей. Отключено, если не задано. Это не одобряет автоматически сопряжение operator/browser/Control UI/WebChat и не одобряет автоматически обновления роли, области, метаданных или публичного ключа.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальная allow/deny-настройка объявленных команд узла после сопряжения и оценки platform allowlist. Используйте `allowCommands`, чтобы включить опасные команды узла, такие как `camera.snap`, `camera.clip` и `screen.record`; `denyCommands` удаляет команду, даже если platform default или явное разрешение иначе включили бы ее. После изменения узлом объявленного списка команд отклоните и повторно одобрите сопряжение этого устройства, чтобы gateway сохранил обновленный снимок команд.
- `gateway.tools.deny`: дополнительные имена инструментов, заблокированные для HTTP `POST /tools/invoke` (расширяет deny list по умолчанию).
- `gateway.tools.allow`: удалить имена инструментов из deny list HTTP по умолчанию для вызывающих owner/admin. Это не повышает вызывающих с идентичностью `operator.write` до доступа owner/admin; `cron`, `gateway` и `nodes` остаются недоступны для вызывающих не-owner даже при добавлении в allowlist.

</Accordion>

### OpenAI-совместимые конечные точки

- Admin HTTP RPC: отключен по умолчанию как Plugin `admin-http-rpc`. Включите Plugin, чтобы зарегистрировать `POST /api/v1/admin/rpc`. См. [Admin HTTP RPC](/ru/plugins/admin-http-rpc).
- Chat Completions: отключено по умолчанию. Включите с помощью `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Усиление защиты URL-ввода Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Пустые allowlist считаются незаданными; используйте `gateway.http.endpoints.responses.files.allowUrl=false`
    и/или `gateway.http.endpoints.responses.images.allowUrl=false`, чтобы отключить получение URL.
- Необязательный заголовок усиления защиты ответа:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте только для HTTPS origins, которыми вы управляете; см. [Аутентификация через доверенный proxy](/ru/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Изоляция нескольких экземпляров

Запускайте несколько gateway на одном хосте с уникальными портами и каталогами состояния:

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

- `enabled`: включает завершение TLS на слушателе gateway (HTTPS/WSS) (по умолчанию: `false`).
- `autoGenerate`: автоматически генерирует локальную самоподписанную пару сертификат/ключ, когда явные файлы не настроены; только для локального/разработческого использования.
- `certPath`: путь в файловой системе к файлу сертификата TLS.
- `keyPath`: путь в файловой системе к файлу приватного ключа TLS; держите права доступа ограниченными.
- `caPath`: необязательный путь к CA bundle для проверки клиентов или пользовательских цепочек доверия.

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

- `mode`: управляет тем, как изменения конфигурации применяются во время выполнения.
  - `"off"`: игнорировать изменения в реальном времени; изменения требуют явного перезапуска.
  - `"restart"`: всегда перезапускать процесс Gateway при изменении конфигурации.
  - `"hot"`: применять изменения внутри процесса без перезапуска.
  - `"hybrid"` (по умолчанию): сначала попытаться выполнить горячую перезагрузку; при необходимости откатиться к перезапуску.
- `debounceMs`: окно debounce в мс перед применением изменений конфигурации (неотрицательное целое число).
- `deferralTimeoutMs`: необязательное максимальное время ожидания в мс для выполняющихся операций перед принудительным перезапуском или горячей перезагрузкой канала. Опустите, чтобы использовать ограниченное ожидание по умолчанию (`300000`); задайте `0`, чтобы ждать бесконечно и периодически записывать предупреждения о всё ещё ожидающих операциях.

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

Примечания по проверке и безопасности:

- `hooks.enabled=true` требует непустой `hooks.token`.
- `hooks.token` должен отличаться от активной аутентификации Gateway с общим секретом (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` или `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); при обнаружении повторного использования запуск записывает некритичное предупреждение безопасности.
- `openclaw security audit` помечает повторное использование аутентификации хука/Gateway как критическую находку, включая аутентификацию Gateway по паролю, переданную только на время аудита (`--auth password --password <password>`). Выполните `openclaw doctor --fix`, чтобы ротировать сохранённый повторно используемый `hooks.token`, затем обновите внешние отправители хуков, чтобы они использовали новый токен хука.
- `hooks.path` не может быть `/`; используйте выделенный подпуть, например `/hooks`.
- Если `hooks.allowRequestSessionKey=true`, ограничьте `hooks.allowedSessionKeyPrefixes` (например, `["hook:"]`).
- Если mapping или preset использует шаблонизированный `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` и `hooks.allowRequestSessionKey=true`. Статические ключи mapping не требуют такого явного включения.

**Эндпоинты:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` из полезной нагрузки запроса принимается только когда `hooks.allowRequestSessionKey=true` (по умолчанию: `false`).
- `POST /hooks/<name>` → разрешается через `hooks.mappings`
  - Значения `sessionKey` для mapping, отрендеренные из шаблона, считаются переданными извне и также требуют `hooks.allowRequestSessionKey=true`.

<Accordion title="Сведения о mapping">

- `match.path` сопоставляется с подпутём после `/hooks` (например, `/hooks/gmail` → `gmail`).
- `match.source` сопоставляется с полем полезной нагрузки для универсальных путей.
- Шаблоны вроде `{{messages[0].subject}}` читаются из полезной нагрузки.
- `transform` может указывать на JS/TS-модуль, возвращающий действие хука.
  - `transform.module` должен быть относительным путём и оставаться внутри `hooks.transformsDir` (абсолютные пути и выход за пределы каталога отклоняются).
  - Держите `hooks.transformsDir` внутри `~/.openclaw/hooks/transforms`; каталоги workspace Skills отклоняются. Если `openclaw doctor` сообщает, что этот путь недействителен, переместите модуль transform в каталог transforms для хуков или удалите `hooks.transformsDir`.
- `agentId` маршрутизирует к конкретному агенту; неизвестные идентификаторы откатываются к агенту по умолчанию.
- `allowedAgentIds`: ограничивает эффективную маршрутизацию агентов, включая путь агента по умолчанию, когда `agentId` опущен (`*` или отсутствие = разрешить все, `[]` = запретить все).
- `defaultSessionKey`: необязательный фиксированный ключ сессии для агентских запусков хуков без явного `sessionKey`.
- `allowRequestSessionKey`: разрешает вызывающим `/hooks/agent` и session keys mapping, управляемым шаблонами, задавать `sessionKey` (по умолчанию: `false`).
- `allowedSessionKeyPrefixes`: необязательный список разрешённых префиксов для явных значений `sessionKey` (запрос + mapping), например `["hook:"]`. Он становится обязательным, когда любой mapping или preset использует шаблонизированный `sessionKey`.
- `deliver: true` отправляет финальный ответ в канал; `channel` по умолчанию равен `last`.
- `model` переопределяет LLM для этого запуска хука (должна быть разрешена, если задан каталог моделей).

</Accordion>

### Интеграция Gmail

- Встроенный preset Gmail использует `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Если вы сохраняете эту маршрутизацию по сообщениям, задайте `hooks.allowRequestSessionKey: true` и ограничьте `hooks.allowedSessionKeyPrefixes`, чтобы они соответствовали пространству имён Gmail, например `["hook:", "hook:gmail:"]`.
- Если вам нужно `hooks.allowRequestSessionKey: false`, переопределите preset статическим `sessionKey` вместо шаблонизированного значения по умолчанию.

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

- Gateway автоматически запускает `gog gmail watch serve` при загрузке, когда настроен. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, чтобы отключить.
- Не запускайте отдельный `gog gmail watch serve` рядом с Gateway.

---

## Хост Canvas plugin

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
- Привязки не к loopback: маршруты canvas требуют аутентификации Gateway (токен/пароль/доверенный прокси), как и другие HTTP-поверхности Gateway.
- Node WebViews обычно не отправляют заголовки аутентификации; после сопряжения и подключения узла Gateway объявляет capability URL, привязанные к узлу, для доступа к canvas/A2UI.
- Capability URL привязаны к активной WS-сессии узла и быстро истекают. Резервный вариант на основе IP не используется.
- Внедряет клиент live-reload в обслуживаемый HTML.
- Автоматически создаёт стартовый `index.html`, когда каталог пуст.
- Также обслуживает A2UI по адресу `/__openclaw__/a2ui/`.
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

- `minimal` (по умолчанию, когда включён bundled plugin `bonjour`): опускать `cliPath` + `sshPort` из TXT-записей.
- `full`: включать `cliPath` + `sshPort`; для multicast-рекламы в LAN всё равно требуется включённый bundled plugin `bonjour`.
- `off`: подавлять multicast-рекламу в LAN без изменения включения plugin.
- Bundled plugin `bonjour` автоматически запускается на хостах macOS и включается явно на Linux, Windows и контейнеризованных развёртываниях Gateway.
- Имя хоста по умолчанию равно системному имени хоста, когда оно является допустимой DNS-меткой, иначе используется `openclaw`. Переопределите через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записывает unicast DNS-SD-зону в `~/.openclaw/dns/`. Для обнаружения между сетями сочетайте с DNS-сервером (рекомендуется CoreDNS) + Tailscale split DNS.

Настройка: `openclaw dns setup --apply`.

---

## Окружение

### `env` (inline env vars)

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

- Inline env vars применяются только если в окружении процесса отсутствует ключ.
- Файлы `.env`: CWD `.env` + `~/.openclaw/.env` (ни один не переопределяет существующие переменные).
- `shellEnv`: импортирует отсутствующие ожидаемые ключи из профиля вашей login shell.
- См. [Окружение](/ru/help/environment) для полного порядка приоритета.

### Подстановка env var

Ссылайтесь на env vars в любой строке конфигурации через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Сопоставляются только имена в верхнем регистре: `[A-Z_][A-Z0-9_]*`.
- Отсутствующие/пустые vars вызывают ошибку при загрузке конфигурации.
- Экранируйте как `$${VAR}` для буквального `${VAR}`.
- Работает с `$include`.

---

## Секреты

Secret refs аддитивны: значения в открытом тексте по-прежнему работают.

### `SecretRef`

Используйте одну форму объекта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Проверка:

- Шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютный JSON pointer (например `"/providers/openai/apiKey"`)
- Шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (поддерживает селекторы AWS-стиля `secret#json_key`)
- id для `source: "exec"` не должны содержать сегменты пути, разделённые слешами, `.` или `..` (например, `a/../b` отклоняется)

### Поддерживаемая поверхность учётных данных

- Каноническая матрица: [Поверхность учётных данных SecretRef](/ru/reference/secretref-credential-surface)
- `secrets apply` нацеливается на поддерживаемые пути учётных данных `openclaw.json`.
- refs в `auth-profiles.json` включены в runtime-разрешение и покрытие аудита.

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

- Provider `file` поддерживает `mode: "json"` и `mode: "singleValue"` (`id` должен быть `"value"` в режиме singleValue).
- Пути поставщиков file и exec fail closed, когда проверка Windows ACL недоступна. Задавайте `allowInsecurePath: true` только для доверенных путей, которые нельзя проверить.
- Provider `exec` требует абсолютный путь `command` и использует protocol payloads на stdin/stdout.
- По умолчанию пути команд через symlink отклоняются. Задайте `allowSymlinkCommand: true`, чтобы разрешить пути через symlink с проверкой разрешённого целевого пути.
- Если настроен `trustedDirs`, проверка trusted-dir применяется к разрешённому целевому пути.
- Дочернее окружение `exec` по умолчанию минимально; передавайте нужные переменные явно через `passEnv`.
- Secret refs разрешаются во время активации в снимок в памяти, затем пути запросов читают только снимок.
- Фильтрация активной поверхности применяется во время активации: неразрешённые refs на включённых поверхностях приводят к сбою запуска/перезагрузки, а неактивные поверхности пропускаются с диагностикой.

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

- Профили отдельных агентов хранятся в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` поддерживает ссылки на уровне значений (`keyRef` для `api_key`, `tokenRef` для `token`) для статических режимов учетных данных.
- Устаревшие плоские сопоставления `auth-profiles.json`, такие как `{ "provider": { "apiKey": "..." } }`, не являются runtime-форматом; `openclaw doctor --fix` переписывает их в канонические API-key-профили `provider:default` с резервной копией `.legacy-flat.*.bak`.
- Профили в режиме OAuth (`auth.profiles.<id>.mode = "oauth"`) не поддерживают учетные данные auth-профилей на основе SecretRef.
- Статические runtime-учетные данные берутся из разрешенных снимков в памяти; устаревшие статические записи `auth.json` очищаются при обнаружении.
- Устаревшие импорты OAuth берутся из `~/.openclaw/credentials/oauth.json`.
- См. [OAuth](/ru/concepts/oauth).
- Поведение runtime для секретов и инструменты `audit/configure/apply`: [Управление секретами](/ru/gateway/secrets).

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

- `billingBackoffHours`: базовая задержка в часах, когда профиль завершается ошибкой из-за настоящих
  ошибок биллинга или недостатка кредитов (по умолчанию: `5`). Явный текст про биллинг может
  по-прежнему попадать сюда даже в ответах `401`/`403`, но текстовые сопоставители, специфичные
  для провайдера, остаются ограничены провайдером, которому они принадлежат (например OpenRouter
  `Key limit exceeded`). Повторяемые HTTP `402` сообщения об окне использования или
  лимите расходов организации/рабочей области остаются вместо этого в пути `rate_limit`.
- `billingBackoffHoursByProvider`: необязательные переопределения часов задержки биллинга для отдельных провайдеров.
- `billingMaxHours`: предел в часах для экспоненциального роста задержки биллинга (по умолчанию: `24`).
- `authPermanentBackoffMinutes`: базовая задержка в минутах для высокодостоверных сбоев `auth_permanent` (по умолчанию: `10`).
- `authPermanentMaxMinutes`: предел в минутах для роста задержки `auth_permanent` (по умолчанию: `60`).
- `failureWindowHours`: скользящее окно в часах, используемое для счетчиков задержки (по умолчанию: `24`).
- `overloadedProfileRotations`: максимальное число ротаций auth-профилей того же провайдера для ошибок перегрузки перед переключением на резервную модель (по умолчанию: `1`). Сюда попадают формы занятости провайдера, такие как `ModelNotReadyException`.
- `overloadedBackoffMs`: фиксированная задержка перед повторной попыткой ротации перегруженного провайдера/профиля (по умолчанию: `0`).
- `rateLimitedProfileRotations`: максимальное число ротаций auth-профилей того же провайдера для ошибок ограничения частоты перед переключением на резервную модель (по умолчанию: `1`). Эта корзина ограничения частоты включает текст, оформленный провайдером, например `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` и `resource exhausted`.

---

## Журналирование

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
- `maxFileBytes`: максимальный размер активного файла журнала в байтах перед ротацией (положительное целое число; по умолчанию: `104857600` = 100 МБ). OpenClaw хранит до пяти нумерованных архивов рядом с активным файлом.
- `redactSensitive` / `redactPatterns`: маскирование по принципу максимальных усилий для вывода в консоль, файлов журналов, записей журналов OTLP и сохраненного текста транскрипта сессии. `redactSensitive: "off"` отключает только эту общую политику журналов/транскриптов; поверхности безопасности UI/инструментов/диагностики по-прежнему редактируют секреты перед выводом.

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

- `enabled`: главный переключатель вывода инструментирования (по умолчанию: `true`).
- `flags`: массив строк флагов, включающих целевой вывод журнала (поддерживает подстановочные шаблоны вроде `"telegram.*"` или `"*"`).
- `stuckSessionWarnMs`: порог возраста без прогресса в мс для классификации долго выполняющихся сессий обработки как `session.long_running`, `session.stalled` или `session.stuck`. Ответ, инструмент, статус, блок и прогресс ACP сбрасывают таймер; повторяющаяся диагностика `session.stuck` увеличивает интервал, пока состояние не меняется.
- `stuckSessionAbortMs`: порог возраста без прогресса в мс, после которого подходящая зависшая активная работа может быть прервана с дренированием для восстановления. Если не задано, OpenClaw использует более безопасное расширенное окно встроенного запуска не менее 5 минут и 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: захватывает отредактированный снимок стабильности перед OOM, когда давление на память достигает `critical` (по умолчанию: `false`). Установите `true`, чтобы добавить сканирование/запись файла пакета стабильности, сохраняя обычные события давления на память.
- `otel.enabled`: включает конвейер экспорта OpenTelemetry (по умолчанию: `false`). Полную конфигурацию, каталог сигналов и модель конфиденциальности см. в [Экспорт OpenTelemetry](/ru/gateway/opentelemetry).
- `otel.endpoint`: URL коллектора для экспорта OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необязательные OTLP-эндпоинты для отдельных сигналов. Если заданы, они переопределяют `otel.endpoint` только для этого сигнала.
- `otel.protocol`: `"http/protobuf"` (по умолчанию) или `"grpc"`.
- `otel.headers`: дополнительные заголовки HTTP/gRPC metadata, отправляемые с запросами экспорта OTel.
- `otel.serviceName`: имя сервиса для атрибутов ресурса.
- `otel.traces` / `otel.metrics` / `otel.logs`: включают экспорт трассировок, метрик или журналов.
- `otel.logsExporter`: приемник экспорта журналов: `"otlp"` (по умолчанию), `"stdout"` для одного JSON-объекта на строку stdout или `"both"`.
- `otel.sampleRate`: частота сэмплирования трассировок `0`-`1`.
- `otel.flushIntervalMs`: интервал периодической отправки телеметрии в мс.
- `otel.captureContent`: явное включение захвата сырого содержимого для атрибутов интервалов OTEL. По умолчанию выключено. Булево `true` захватывает несистемное содержимое сообщений/инструментов; объектная форма позволяет явно включить `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` и `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: переключатель окружения для новейшей экспериментальной формы интервалов GenAI inference, включая имена интервалов `{gen_ai.operation.name} {gen_ai.request.model}`, тип интервала `CLIENT` и `gen_ai.provider.name` вместо устаревшего `gen_ai.system`. По умолчанию интервалы сохраняют `openclaw.model.call` и `gen_ai.system` для совместимости; метрики GenAI используют ограниченные семантические атрибуты.
- `OPENCLAW_OTEL_PRELOADED=1`: переключатель окружения для хостов, которые уже зарегистрировали глобальный OpenTelemetry SDK. Тогда OpenClaw пропускает запуск/останов SDK, принадлежащего Plugin, сохраняя активными диагностические слушатели.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` и `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: переменные окружения эндпоинтов для отдельных сигналов, используемые, когда соответствующий ключ конфигурации не задан.
- `cacheTrace.enabled`: записывать снимки трассировки кеша для встроенных запусков (по умолчанию: `false`).
- `cacheTrace.filePath`: путь вывода для JSONL трассировки кеша (по умолчанию: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: управляют тем, что включается в вывод трассировки кеша (все по умолчанию: `true`).

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

- `channel`: канал выпуска для установок npm/git - `"stable"`, `"beta"` или `"dev"`.
- `checkOnStart`: проверять обновления npm при запуске Gateway (по умолчанию: `true`).
- `auto.enabled`: включить фоновое автообновление для пакетных установок (по умолчанию: `false`).
- `auto.stableDelayHours`: минимальная задержка в часах перед автоматическим применением стабильного канала (по умолчанию: `6`; максимум: `168`).
- `auto.stableJitterHours`: дополнительное окно распределения выката стабильного канала в часах (по умолчанию: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: частота проверок бета-канала в часах (по умолчанию: `1`; максимум: `24`).

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

- `enabled`: глобальный шлюз функции ACP (по умолчанию: `true`; установите `false`, чтобы скрыть отправку ACP и элементы запуска).
- `dispatch.enabled`: независимый шлюз для отправки ходов сессий ACP (по умолчанию: `true`). Установите `false`, чтобы сохранить доступность команд ACP, блокируя выполнение.
- `backend`: идентификатор backend ACP runtime по умолчанию (должен соответствовать зарегистрированному Plugin runtime ACP).
  Сначала установите backend Plugin, а если задан `plugins.allow`, включите идентификатор backend Plugin (например `acpx`), иначе backend ACP не загрузится.
- `defaultAgent`: резервный идентификатор целевого агента ACP, когда запуски не указывают явную цель.
- `allowedAgents`: список разрешенных идентификаторов агентов для runtime-сессий ACP; пустое значение означает отсутствие дополнительных ограничений.
- `maxConcurrentSessions`: максимальное число одновременно активных сессий ACP.
- `stream.coalesceIdleMs`: окно отправки при бездействии в мс для потокового текста.
- `stream.maxChunkChars`: максимальный размер фрагмента перед разделением проекции потокового блока.
- `stream.repeatSuppression`: подавлять повторяющиеся строки статуса/инструментов за ход (по умолчанию: `true`).
- `stream.deliveryMode`: `"live"` передает поток постепенно; `"final_only"` буферизует до терминальных событий хода.
- `stream.hiddenBoundarySeparator`: разделитель перед видимым текстом после скрытых событий инструментов (по умолчанию: `"paragraph"`).
- `stream.maxOutputChars`: максимальное число символов вывода ассистента, проецируемых за ход ACP.
- `stream.maxSessionUpdateChars`: максимальное число символов для проецируемых строк статуса/обновления ACP.
- `stream.tagVisibility`: запись имен тегов в булевы переопределения видимости для потоковых событий.
- `runtime.ttlMinutes`: TTL бездействия в минутах для рабочих процессов сессий ACP перед допустимой очисткой.
- `runtime.installCommand`: необязательная команда установки, выполняемая при начальной настройке окружения ACP runtime.

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

- `cli.banner.taglineMode` управляет стилем слогана в баннере:
  - `"random"` (по умолчанию): меняющиеся забавные/сезонные слоганы.
  - `"default"`: фиксированный нейтральный слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без текста слогана (заголовок/версия баннера все равно отображаются).
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

См. поля идентичности `agents.list` в разделе [Значения агента по умолчанию](/ru/gateway/config-agents#agent-defaults).

---

## Мост (устаревший, удален)

Текущие сборки больше не включают TCP-мост. Узлы подключаются через WebSocket Gateway. Ключи `bridge.*` больше не являются частью схемы конфигурации (валидация завершается ошибкой, пока они не удалены; `openclaw doctor --fix` может удалить неизвестные ключи).

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

- `sessionRetention`: как долго хранить завершенные изолированные сессии запусков cron перед удалением из `sessions.json`. Также управляет очисткой архивных удаленных транскриптов cron. По умолчанию: `24h`; задайте `false`, чтобы отключить.
- `runLog.maxBytes`: принимается для совместимости со старыми файловыми журналами запусков cron. По умолчанию: `2_000_000` байт.
- `runLog.keepLines`: новейшие строки истории запусков SQLite, сохраняемые для каждого задания. По умолчанию: `2000`.
- `webhookToken`: bearer-токен, используемый для доставки POST cron Webhook (`delivery.mode = "webhook"`); если не указан, заголовок авторизации не отправляется.
- `webhook`: устаревший резервный URL Webhook (http/https), используемый `openclaw doctor --fix` для миграции сохраненных заданий, у которых все еще есть `notify: true`; доставка во время выполнения использует `delivery.mode="webhook"` для каждого задания вместе с `delivery.to` или `delivery.completionDestination` при сохранении доставки объявлений.

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
- `backoffMs`: массив задержек отката в мс для каждой повторной попытки (по умолчанию: `[30000, 60000, 300000]`; 1-10 записей).
- `retryOn`: типы ошибок, запускающие повторные попытки: `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Опустите, чтобы повторять все временные типы.

Одноразовые задания остаются включенными, пока не будут исчерпаны повторные попытки, затем отключаются с сохранением итогового состояния ошибки. Повторяющиеся задания используют ту же политику повторов для временных ошибок, чтобы снова выполниться после отката перед следующим запланированным интервалом; постоянные ошибки или исчерпанные повторные попытки временных ошибок возвращаются к обычному расписанию повторяющихся заданий с откатом по ошибке.

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

- `enabled`: включает оповещения о сбоях для заданий cron (по умолчанию: `false`).
- `after`: число последовательных сбоев до отправки оповещения (положительное целое число, минимум: `1`).
- `cooldownMs`: минимальное число миллисекунд между повторными оповещениями для того же задания (неотрицательное целое число).
- `includeSkipped`: учитывать последовательные пропущенные запуски в пороге оповещения (по умолчанию: `false`). Пропущенные запуски отслеживаются отдельно и не влияют на откат ошибок выполнения.
- `mode`: режим доставки: `"announce"` отправляет через сообщение канала; `"webhook"` публикует в настроенный Webhook.
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
- `mode`: `"announce"` или `"webhook"`; по умолчанию используется `"announce"`, когда доступно достаточно данных цели.
- `channel`: переопределение канала для доставки объявлений. `"last"` повторно использует последний известный канал доставки.
- `to`: явная цель объявления или URL Webhook. Требуется для режима Webhook.
- `accountId`: необязательное переопределение учетной записи для доставки.
- `delivery.failureDestination` для отдельного задания переопределяет это глобальное значение по умолчанию.
- Когда не задано ни глобальное назначение сбоя, ни назначение сбоя для отдельного задания, задания, которые уже доставляются через `announce`, при сбое возвращаются к этой основной цели объявлений.
- `delivery.failureDestination` поддерживается только для заданий `sessionTarget="isolated"`, если только основной `delivery.mode` задания не равен `"webhook"`.

См. [Задания Cron](/ru/automation/cron-jobs). Изолированные выполнения cron отслеживаются как [фоновые задачи](/ru/automation/tasks).

---

## Переменные шаблона медиамодели

Заполнители шаблона, раскрываемые в `tools.media.models[].args`:

| Переменная         | Описание                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Полное тело входящего сообщения                   |
| `{{RawBody}}`      | Сырое тело (без оберток истории/отправителя)      |
| `{{BodyStripped}}` | Тело с удаленными упоминаниями группы             |
| `{{From}}`         | Идентификатор отправителя                         |
| `{{To}}`           | Идентификатор назначения                          |
| `{{MessageSid}}`   | id сообщения канала                               |
| `{{SessionId}}`    | UUID текущей сессии                               |
| `{{IsNewSession}}` | `"true"`, когда создана новая сессия              |
| `{{MediaUrl}}`     | Псевдо-URL входящих медиа                         |
| `{{MediaPath}}`    | Локальный путь медиа                              |
| `{{MediaType}}`    | Тип медиа (изображение/аудио/документ/…)          |
| `{{Transcript}}`   | Транскрипт аудио                                  |
| `{{Prompt}}`       | Разрешенный медиапромпт для записей CLI           |
| `{{MaxChars}}`     | Разрешенное максимальное число символов вывода для записей CLI |
| `{{ChatType}}`     | `"direct"` или `"group"`                          |
| `{{GroupSubject}}` | Тема группы (по возможности)                      |
| `{{GroupMembers}}` | Предпросмотр участников группы (по возможности)   |
| `{{SenderName}}`   | Отображаемое имя отправителя (по возможности)     |
| `{{SenderE164}}`   | Номер телефона отправителя (по возможности)       |
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
- Вложенные включения: глубиной до 10 уровней.
- Пути: разрешаются относительно включающего файла, но должны оставаться внутри каталога конфигурации верхнего уровня (`dirname` от `openclaw.json`). Абсолютные формы и формы с `../` разрешены только тогда, когда они все равно разрешаются внутри этой границы. Пути не должны содержать нулевые байты и должны быть строго короче 4096 символов до и после разрешения.
- Записи, принадлежащие OpenClaw, которые изменяют только один раздел верхнего уровня, поддерживаемый однофайловым включением, записываются сквозным образом в этот включенный файл. Например, `plugins install` обновляет `plugins: { $include: "./plugins.json5" }` в `plugins.json5` и оставляет `openclaw.json` без изменений.
- Корневые включения, массивы включений и включения с соседними переопределениями доступны только для чтения при записях, принадлежащих OpenClaw; такие записи завершаются закрытым отказом вместо разворачивания конфигурации.
- Ошибки: понятные сообщения для отсутствующих файлов, ошибок разбора, циклических включений, недопустимого формата пути и чрезмерной длины.

---

_Связано: [Конфигурация](/ru/gateway/configuration) · [Примеры конфигурации](/ru/gateway/configuration-examples) · [Doctor](/ru/gateway/doctor)_

## Связано

- [Конфигурация](/ru/gateway/configuration)
- [Примеры конфигурации](/ru/gateway/configuration-examples)
