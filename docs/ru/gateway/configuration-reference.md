---
read_when:
    - Вам нужны точные семантика конфигурации или значения по умолчанию на уровне полей
    - Вы проверяете блоки конфигурации канала, модели, Gateway или инструмента
summary: Справочник конфигурации Gateway для основных ключей OpenClaw, значений по умолчанию и ссылок на отдельные справочники подсистем
title: Справочник по конфигурации
x-i18n:
    generated_at: "2026-07-02T08:38:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Справочник по основной конфигурации для `~/.openclaw/openclaw.json`. Обзор, ориентированный на задачи, см. в разделе [Конфигурация](/ru/gateway/configuration).

Описывает основные поверхности конфигурации OpenClaw и дает ссылки на отдельные углубленные справочники для подсистем. Каталоги команд, принадлежащие каналам и Plugin, а также глубокие настройки памяти/QMD находятся на собственных страницах, а не на этой.

Источник истины в коде:

- `openclaw config schema` выводит актуальную JSON Schema, используемую для валидации и Control UI, с объединенными метаданными bundled/Plugin/каналов, когда они доступны
- `config.schema.lookup` возвращает один узел схемы, ограниченный путем, для инструментов детализации
- `pnpm config:docs:check` / `pnpm config:docs:gen` проверяют базовый хеш документации конфигурации относительно текущей поверхности схемы

Путь поиска для агента: используйте действие инструмента `gateway` `config.schema.lookup` для
точной документации и ограничений на уровне полей перед правками. Используйте
[Конфигурацию](/ru/gateway/configuration) для ориентированных на задачи рекомендаций, а эту страницу —
для более широкой карты полей, значений по умолчанию и ссылок на справочники подсистем.

Отдельные углубленные справочники:

- [Справочник по конфигурации памяти](/ru/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` и конфигурации dreaming в `plugins.entries.memory-core.config.dreaming`
- [Slash-команды](/ru/tools/slash-commands) для текущего встроенного + bundled каталога команд
- страницы соответствующих каналов/Plugin для поверхностей команд, специфичных для канала

Формат конфигурации — **JSON5** (разрешены комментарии и завершающие запятые). Все поля необязательны - OpenClaw использует безопасные значения по умолчанию, если они опущены.

---

## Каналы

Ключи конфигурации для отдельных каналов перенесены на отдельную страницу - см.
[Конфигурация - каналы](/ru/gateway/config-channels) для `channels.*`,
включая Slack, Discord, Telegram, WhatsApp, Matrix, iMessage и другие
bundled-каналы (аутентификация, контроль доступа, несколько учетных записей, gating по упоминаниям).

## Значения по умолчанию для агентов, мультиагентность, сессии и сообщения

Перенесено на отдельную страницу - см.
[Конфигурация - агенты](/ru/gateway/config-agents) для:

- `agents.defaults.*` (рабочая область, модель, мышление, heartbeat, память, медиа, skills, sandbox)
- `multiAgent.*` (маршрутизация и привязки для нескольких агентов)
- `session.*` (жизненный цикл сессии, compaction, pruning)
- `messages.*` (доставка сообщений, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.consultThinkingLevel`: переопределение уровня мышления для полного запуска агента OpenClaw за realtime-консультациями Control UI Talk
  - `talk.consultFastMode`: одноразовое переопределение fast-mode для realtime-консультаций Control UI Talk
  - `talk.speechLocale`: необязательный идентификатор локали BCP 47 для распознавания речи Talk на iOS/macOS
  - `talk.silenceTimeoutMs`: если не задано, Talk сохраняет стандартное для платформы окно паузы перед отправкой расшифровки (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: резервная маршрутизация через Gateway relay для финализированных realtime-расшифровок Talk, которые пропускают `openclaw_agent_consult`

## Инструменты и пользовательские провайдеры

Политика инструментов, экспериментальные переключатели, конфигурация инструментов на базе провайдеров и настройка пользовательских
провайдеров / базовых URL перенесены на отдельную страницу - см.
[Конфигурация - инструменты и пользовательские провайдеры](/ru/gateway/config-tools).

## Модели

Определения провайдеров, allowlist моделей и настройка пользовательских провайдеров находятся в
[Конфигурация - инструменты и пользовательские провайдеры](/ru/gateway/config-tools#custom-providers-and-base-urls).
Корень `models` также управляет глобальным поведением каталога моделей.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: поведение каталога провайдеров (`merge` или `replace`).
- `models.providers`: карта пользовательских провайдеров, ключом которой является id провайдера.
- `models.providers.*.localService`: необязательный диспетчер процессов по требованию для
  локальных серверов моделей. OpenClaw проверяет настроенный health endpoint, запускает
  абсолютную `command` при необходимости, ждет готовности, затем отправляет запрос модели.
  См. [Локальные сервисы моделей](/ru/gateway/local-model-services).
- `models.pricing.enabled`: управляет фоновой инициализацией цен, которая
  запускается после того, как sidecars и каналы достигают пути готовности Gateway. Когда `false`,
  Gateway пропускает запросы каталогов цен OpenRouter и LiteLLM; настроенные
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

- `mcp.servers`: именованные определения stdio или удаленных MCP-серверов для runtime, которые
  предоставляют настроенные MCP-инструменты.
  Удаленные записи используют `transport: "streamable-http"` или `transport: "sse"`;
  `type: "http"` — это CLI-native псевдоним, который `openclaw mcp set` и
  `openclaw doctor --fix` нормализуют в каноническое поле `transport`.
- `mcp.servers.<name>.enabled`: задайте `false`, чтобы сохранить определение сервера,
  исключив его из обнаружения embedded OpenClaw MCP и проекции инструментов.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: тайм-аут MCP-запроса для сервера
  в секундах или миллисекундах.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: тайм-аут подключения для сервера
  в секундах или миллисекундах.
- `mcp.servers.<name>.supportsParallelToolCalls`: необязательная подсказка о параллелизме для
  адаптеров, которые могут выбирать, выполнять ли параллельные вызовы MCP-инструментов.
- `mcp.servers.<name>.auth`: задайте `"oauth"` для HTTP MCP-серверов, которым требуется
  OAuth. Выполните `openclaw mcp login <name>`, чтобы сохранить токены в состоянии OpenClaw.
- `mcp.servers.<name>.oauth`: необязательные переопределения scope OAuth, URL перенаправления и URL
  метаданных клиента.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: элементы управления HTTP TLS
  для приватных endpoint и mutual TLS.
- `mcp.servers.<name>.toolFilter`: необязательный выбор инструментов для сервера. `include`
  ограничивает обнаруженные MCP-инструменты совпадающими именами; `exclude` скрывает совпадающие
  имена. Записи — это точные имена MCP-инструментов или простые globs `*`. Серверы с
  ресурсами или prompts также генерируют имена служебных инструментов (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), и эти имена используют тот же
  фильтр.
- `mcp.servers.<name>.codex`: необязательные элементы управления проекцией Codex app-server.
  Этот блок является метаданными OpenClaw только для потоков Codex app-server; он не
  влияет на ACP-сессии, общую конфигурацию Codex harness или другие runtime-адаптеры.
  Непустой `codex.agents` ограничивает сервер перечисленными id агентов OpenClaw.
  Пустые, blank или недействительные scoped-списки агентов отклоняются валидацией конфигурации
  и пропускаются runtime-путем проекции, а не становятся глобальными.
  `codex.defaultToolsApprovalMode` выводит native-параметр Codex
  `default_tools_approval_mode` для этого сервера. OpenClaw удаляет блок `codex`
  перед передачей native-конфигурации `mcp_servers` в Codex. Опустите блок, чтобы
  сервер проецировался для каждого агента Codex app-server с поведением одобрения MCP
  по умолчанию Codex.
- `mcp.sessionIdleTtlMs`: idle TTL для session-scoped bundled MCP runtime.
  Одноразовые embedded-запуски запрашивают очистку в конце запуска; этот TTL является запасным механизмом для
  долгоживущих сессий и будущих вызывающих сторон.
- Изменения в `mcp.*` применяются горячо путем освобождения кэшированных session MCP runtime.
  Следующее обнаружение/использование инструмента пересоздает их из новой конфигурации, поэтому удаленные
  записи `mcp.servers` удаляются сразу, а не ждут idle TTL.
- Runtime-обнаружение также учитывает уведомления об изменении списка MCP-инструментов, сбрасывая
  кэшированный каталог для этой сессии. Серверы, объявляющие ресурсы или
  prompts, получают служебные инструменты для списка/чтения ресурсов и списка/получения
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

- `allowBundled`: необязательный allowlist только для bundled skills (managed/workspace skills не затрагиваются).
- `load.extraDirs`: дополнительные общие корни skills (самый низкий приоритет).
- `load.allowSymlinkTargets`: доверенные реальные целевые корни, в которые могут
  разрешаться symlink skills, когда ссылка находится вне настроенного исходного корня.
- `workshop.allowSymlinkTargetWrites`: разрешает Skill Workshop apply писать
  через уже доверенные цели symlink (по умолчанию: false).
- `install.preferBrew`: когда true, предпочитать установщики Homebrew, если `brew`
  доступен, прежде чем переходить к другим типам установщиков.
- `install.nodeManager`: предпочтение установщика node для спецификаций `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: разрешить доверенным Gateway-клиентам `operator.admin`
  устанавливать приватные zip-архивы, подготовленные через `skills.upload.*`
  (по умолчанию: false). Это включает только путь uploaded-archive; обычные установки ClawHub
  этого не требуют.
- `entries.<skillKey>.enabled: false` отключает skill, даже если он bundled/installed.
- `entries.<skillKey>.apiKey`: удобный способ для skills, объявляющих основную env-переменную (plaintext-строка или объект SecretRef).

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

- Загружаются из каталогов пакетов или bundles в `~/.openclaw/extensions` и `<workspace>/.openclaw/extensions`, а также из файлов или каталогов, перечисленных в `plugins.load.paths`.
- Помещайте автономные файлы плагинов в `plugins.load.paths`; автоматически обнаруживаемые корни extensions игнорируют файлы `.js`, `.mjs` и `.ts` верхнего уровня, чтобы вспомогательные скрипты в этих корнях не блокировали запуск.
- Обнаружение принимает нативные плагины OpenClaw, а также совместимые bundles Codex и Claude, включая bundles Claude с макетом по умолчанию без манифеста.
- **Изменения конфигурации требуют перезапуска Gateway.**
- `allow`: необязательный список разрешенных плагинов (загружаются только перечисленные плагины). `deny` имеет приоритет.
- `plugins.entries.<id>.apiKey`: удобное поле API-ключа на уровне плагина (когда поддерживается плагином).
- `plugins.entries.<id>.env`: карта переменных окружения в области плагина.
- `plugins.entries.<id>.hooks.allowPromptInjection`: при `false` ядро блокирует `before_prompt_build` и игнорирует поля, изменяющие prompt, из устаревшего `before_agent_start`, при этом сохраняя устаревшие `modelOverride` и `providerOverride`. Применяется к хукам нативных плагинов и поддерживаемым каталогам хуков, предоставляемым bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: при `true` доверенные невстроенные плагины могут читать необработанное содержимое беседы из типизированных хуков, таких как `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` и `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно доверять этому плагину запрашивать переопределения `provider` и `model` для каждого запуска фоновых subagent-запусков.
- `plugins.entries.<id>.subagent.allowedModels`: необязательный список разрешенных канонических целей `provider/model` для доверенных переопределений subagent. Используйте `"*"` только если намеренно хотите разрешить любую модель.
- `plugins.entries.<id>.llm.allowModelOverride`: явно доверять этому плагину запрашивать переопределения модели для `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: необязательный список разрешенных канонических целей `provider/model` для доверенных переопределений завершений LLM плагином. Используйте `"*"` только если намеренно хотите разрешить любую модель.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: явно доверять этому плагину запускать `api.runtime.llm.complete` для id агента, отличного от значения по умолчанию.
- `plugins.entries.<id>.config`: объект конфигурации, определенный плагином (проверяется схемой нативного плагина OpenClaw, когда она доступна).
- Настройки учетной записи и runtime для плагинов каналов находятся в `channels.<id>` и должны описываться метаданными `channelConfigs` манифеста владеющего плагина, а не центральным реестром опций OpenClaw.

### Конфигурация плагина Codex harness

Встроенный плагин `codex` владеет нативными настройками Codex app-server harness в
`plugins.entries.codex.config`. Полная поверхность конфигурации описана в
[справочнике Codex harness](/ru/plugins/codex-harness-reference), а runtime-модель — в
[Codex harness](/ru/plugins/codex-harness).

`codexPlugins` применяется только к сессиям, которые выбирают нативный Codex harness.
Он не включает плагины Codex для запусков провайдера OpenClaw, привязок бесед ACP
или любого harness, не относящегося к Codex.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: включает нативную поддержку
  плагинов/приложений Codex для Codex harness. По умолчанию: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  политика destructive actions по умолчанию для перенесенных elicitations приложений плагинов.
  Используйте `true`, чтобы принимать безопасные схемы подтверждений Codex без запроса, `false`,
  чтобы отклонять их, `"auto"`, чтобы направлять требуемые Codex подтверждения через подтверждения
  плагинов OpenClaw, или `"ask"`, чтобы запрашивать каждое действие записи/destructive action
  плагина без долговременного подтверждения. Режим `"ask"` очищает долговременные переопределения
  подтверждений Codex для каждого инструмента затронутого приложения и выбирает рецензента
  human approvals для этого приложения до запуска потока Codex.
  По умолчанию: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: включает
  перенесенную запись плагина, когда глобальный `codexPlugins.enabled` также равен true.
  По умолчанию: `true` для явных записей.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  стабильная идентичность marketplace. V1 поддерживает только `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: стабильная
  идентичность плагина Codex из миграции, например `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  переопределение destructive-action для каждого плагина. Если оно опущено, используется глобальное
  значение `allow_destructive_actions`. Значение для каждого плагина принимает те же политики
  `true`, `false`, `"auto"` или `"ask"`.

Каждое допущенное приложение плагина, использующее `"ask"`, направляет запросы подтверждения
этого приложения human reviewer. Другие приложения и подтверждения потоков, не относящиеся к приложениям,
сохраняют настроенного рецензента, поэтому смешанные политики плагинов не наследуют поведение `"ask"`.

`codexPlugins.enabled` — это глобальная директива включения. Явные записи плагинов,
записанные миграцией, являются долговременным набором установки и пригодности к восстановлению.
`plugins["*"]` не поддерживается, переключателя `install` нет, а локальные значения
`marketplacePath` намеренно не являются полями конфигурации, поскольку они зависят от хоста.

Проверки готовности `app/list` кэшируются на один час и обновляются
асинхронно, когда устаревают. Конфигурация приложения потока Codex вычисляется при установлении
сессии Codex harness, а не на каждом ходе; используйте `/new`, `/reset` или перезапуск Gateway
после изменения нативной конфигурации плагина.

- `plugins.entries.firecrawl.config.webFetch`: настройки провайдера Firecrawl web-fetch.
  - `apiKey`: необязательный API-ключ Firecrawl для более высоких лимитов (принимает SecretRef). Выполняет fallback к `plugins.entries.firecrawl.config.webSearch.apiKey`, устаревшему `tools.web.fetch.firecrawl.apiKey` или переменной окружения `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовый URL API Firecrawl (по умолчанию: `https://api.firecrawl.dev`; переопределения для self-hosted должны указывать на частные/внутренние endpoints).
  - `onlyMainContent`: извлекать со страниц только основное содержимое (по умолчанию: `true`).
  - `maxAgeMs`: максимальный возраст кэша в миллисекундах (по умолчанию: `172800000` / 2 дня).
  - `timeoutSeconds`: timeout запроса scrape в секундах (по умолчанию: `60`).
- `plugins.entries.xai.config.xSearch`: настройки xAI X Search (веб-поиск Grok).
  - `enabled`: включить провайдер X Search.
  - `model`: модель Grok, используемая для поиска (например, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: настройки memory dreaming. Фазы и пороги см. в [Dreaming](/ru/concepts/dreaming).
  - `enabled`: главный переключатель dreaming (по умолчанию `false`).
  - `frequency`: cadence Cron для каждого полного прохода dreaming (`"0 3 * * *"` по умолчанию).
  - `model`: необязательное переопределение модели subagent Dream Diary. Требует `plugins.entries.memory-core.subagent.allowModelOverride: true`; сочетайте с `allowedModels`, чтобы ограничить цели. Ошибки недоступности модели повторяются один раз с моделью сессии по умолчанию; сбои доверия или allowlist не выполняют fallback незаметно.
  - политика фаз и пороги являются деталями реализации (не пользовательскими ключами конфигурации).
- Полная конфигурация памяти находится в [справочнике конфигурации памяти](/ru/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Включенные плагины bundle Claude также могут добавлять встроенные значения OpenClaw по умолчанию из `settings.json`; OpenClaw применяет их как очищенные настройки агента, а не как необработанные патчи конфигурации OpenClaw.
- `plugins.slots.memory`: выберите id активного плагина памяти или `"none"`, чтобы отключить плагины памяти.
- `plugins.slots.contextEngine`: выберите id активного плагина context engine; по умолчанию `"legacy"`, если вы не установите и не выберете другой engine.

См. [Plugins](/ru/tools/plugin).

---

## Commitments

`commitments` управляет выводимой последующей памятью: OpenClaw может обнаруживать check-ins из ходов беседы и доставлять их через Heartbeat-запуски.

- `commitments.enabled`: включить скрытое извлечение LLM, хранение и доставку Heartbeat для выводимых последующих commitments. По умолчанию: `false`.
- `commitments.maxPerDay`: максимальное число выводимых последующих commitments, доставляемых за сессию агента в скользящем дне. По умолчанию: `3`.

См. [Inferred commitments](/ru/concepts/commitments).

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
  сеанс превышает свой лимит. Установите `idleMinutes: 0` или `maxTabsPerSession: 0`, чтобы
  отключить эти отдельные режимы очистки.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` отключен, если не задан, поэтому навигация браузера по умолчанию остается строгой.
- Устанавливайте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` только когда вы намеренно доверяете навигации браузера в частной сети.
- В строгом режиме удаленные конечные точки CDP-профилей (`profiles.*.cdpUrl`) подпадают под ту же блокировку частной сети при проверках доступности и обнаружения.
- `ssrfPolicy.allowPrivateNetwork` по-прежнему поддерживается как устаревший псевдоним.
- В строгом режиме используйте `ssrfPolicy.hostnameAllowlist` и `ssrfPolicy.allowedHostnames` для явных исключений.
- Удаленные профили доступны только для подключения (запуск/остановка/сброс отключены).
- `profiles.*.cdpUrl` принимает `http://`, `https://`, `ws://` и `wss://`.
  Используйте HTTP(S), когда хотите, чтобы OpenClaw обнаруживал `/json/version`; используйте WS(S),
  когда ваш поставщик предоставляет прямой URL WebSocket DevTools.
- `remoteCdpTimeoutMs` и `remoteCdpHandshakeTimeoutMs` применяются к доступности удаленного и
  `attachOnly` CDP, а также к запросам открытия вкладок. Управляемые профили через петлевой интерфейс
  сохраняют локальные значения CDP по умолчанию.
- Если внешне управляемый CDP-сервис доступен через петлевой интерфейс, задайте для этого
  профиля `attachOnly: true`; иначе OpenClaw будет считать порт петлевого интерфейса
  локальным управляемым профилем браузера и может сообщать об ошибках владения локальным портом.
- Профили `existing-session` используют Chrome MCP вместо CDP и могут подключаться на
  выбранном хосте или через подключенный браузерный узел.
- Профили `existing-session` могут задавать `userDataDir`, чтобы выбрать конкретный
  профиль браузера на базе Chromium, например Brave или Edge.
- Профили `existing-session` могут задавать `cdpUrl`, когда Chrome уже запущен
  за конечной точкой обнаружения DevTools HTTP(S) или прямой конечной точкой WS(S). В этом
  режиме OpenClaw передает конечную точку в Chrome MCP вместо авто-подключения;
  `userDataDir` игнорируется для аргументов запуска Chrome MCP.
- Профили `existing-session` сохраняют текущие ограничения маршрута Chrome MCP:
  действия на основе снимков/ref вместо выбора по CSS-селекторам, хуки загрузки одного файла,
  без переопределений тайм-аута диалогов, без `wait --load networkidle`, а также без
  `responsebody`, экспорта PDF, перехвата загрузок или пакетных действий.
- Локальные управляемые профили `openclaw` автоматически назначают `cdpPort` и `cdpUrl`; задавайте
  `cdpUrl` явно только для удаленных CDP-профилей или подключения к конечной точке existing-session.
- Локальные управляемые профили могут задавать `executablePath`, чтобы переопределить глобальный
  `browser.executablePath` для этого профиля. Используйте это, чтобы запускать один профиль в
  Chrome, а другой в Brave.
- Локальные управляемые профили используют `browser.localLaunchTimeoutMs` для HTTP-обнаружения Chrome CDP
  после запуска процесса и `browser.localCdpReadyTimeoutMs` для
  готовности CDP websocket после запуска. Увеличьте их на более медленных хостах, где Chrome
  успешно запускается, но проверки готовности соревнуются со стартом. Оба значения должны быть
  положительными целыми числами до `120000` мс; недопустимые значения конфигурации отклоняются.
- Порядок автообнаружения: браузер по умолчанию, если он на базе Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` и `browser.profiles.<name>.executablePath` оба
  принимают `~` и `~/...` для домашнего каталога вашей ОС перед запуском Chromium.
  `userDataDir` на уровне профиля для профилей `existing-session` также раскрывается из тильды.
- Служба управления: только петлевой интерфейс (порт выводится из `gateway.port`, по умолчанию `18791`).
- `extraArgs` добавляет дополнительные флаги запуска к локальному старту Chromium (например
  `--disable-gpu`, размер окна или отладочные флаги).

---

## Пользовательский интерфейс

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

- `seamColor`: акцентный цвет для оболочки нативного интерфейса приложения (оттенок пузыря Talk Mode и т. п.).
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

<Accordion title="Сведения о полях Gateway">

- `mode`: `local` (запустить gateway) или `remote` (подключиться к удаленному gateway). Gateway откажется запускаться, если значение не `local`.
- `port`: единый мультиплексированный порт для WS + HTTP. Приоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (по умолчанию), `lan` (`0.0.0.0`), `tailnet` (только IP Tailscale) или `custom`.
- **Устаревшие псевдонимы bind**: используйте значения режима bind в `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдонимы хостов (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примечание о Docker**: привязка `loopback` по умолчанию слушает `127.0.0.1` внутри контейнера. При сетевом мосте Docker (`-p 18789:18789`) трафик приходит на `eth0`, поэтому gateway недоступен. Используйте `--network host` или задайте `bind: "lan"` (либо `bind: "custom"` с `customBindHost: "0.0.0.0"`), чтобы слушать все интерфейсы.
- **Аутентификация**: требуется по умолчанию. Привязки не к loopback требуют аутентификации gateway. На практике это означает общий токен/пароль или reverse proxy с учетом идентичности с `gateway.auth.mode: "trusted-proxy"`. Мастер онбординга по умолчанию генерирует токен.
- Если настроены и `gateway.auth.token`, и `gateway.auth.password` (включая SecretRefs), явно задайте `gateway.auth.mode` как `token` или `password`. Потоки запуска и установки/ремонта сервиса завершаются ошибкой, если настроены оба значения, а mode не задан.
- `gateway.auth.mode: "none"`: явный режим без аутентификации. Используйте только для доверенных настроек local loopback; он намеренно не предлагается в подсказках онбординга.
- `gateway.auth.mode: "trusted-proxy"`: делегирует аутентификацию браузера/пользователя reverse proxy с учетом идентичности и доверяет заголовкам идентичности от `gateway.trustedProxies` (см. [Аутентификация через доверенный прокси](/ru/gateway/trusted-proxy-auth)). По умолчанию этот режим ожидает источник прокси **не из loopback**; same-host loopback reverse proxy требуют явного `gateway.auth.trustedProxy.allowLoopback = true`. Внутренние same-host вызывающие стороны могут использовать `gateway.auth.password` как локальный прямой fallback; `gateway.auth.token` остается взаимоисключающим с режимом trusted-proxy.
- `gateway.auth.allowTailscale`: если `true`, заголовки идентичности Tailscale Serve могут удовлетворять аутентификацию Control UI/WebSocket (проверяется через `tailscale whois`). Конечные точки HTTP API **не** используют эту аутентификацию по заголовкам Tailscale; вместо этого они следуют обычному режиму HTTP-аутентификации gateway. Этот поток без токена предполагает, что хост gateway доверенный. По умолчанию `true`, когда `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необязательный лимитер неудачной аутентификации. Применяется по IP клиента и по области аутентификации (shared-secret и device-token отслеживаются независимо). Заблокированные попытки возвращают `429` + `Retry-After`.
  - На асинхронном пути Tailscale Serve Control UI неудачные попытки для одного и того же `{scope, clientIp}` сериализуются перед записью ошибки. Поэтому параллельные неверные попытки от одного клиента могут сработать на лимитере уже на втором запросе, вместо того чтобы обе прошли гонкой как обычные несовпадения.
  - `gateway.auth.rateLimit.exemptLoopback` по умолчанию `true`; задайте `false`, если намеренно хотите ограничивать частоту и для localhost-трафика (для тестовых настроек или строгих прокси-развертываний).
- Попытки WS-аутентификации с browser-origin всегда ограничиваются по частоте с отключенным исключением для loopback (эшелонированная защита от браузерного перебора localhost).
- На loopback эти блокировки browser-origin изолированы по нормализованному значению `Origin`, поэтому повторяющиеся ошибки из одного localhost-origin не блокируют автоматически другой origin.
- `tailscale.mode`: `serve` (только tailnet, привязка loopback) или `funnel` (публичный, требует аутентификации).
- `tailscale.serviceName`: необязательное имя Tailscale Service для режима Serve, например `svc:openclaw`. Если задано, OpenClaw передает его в `tailscale serve
--service`, чтобы Control UI можно было открыть через именованный Service вместо имени хоста устройства. Значение должно использовать формат имени Service Tailscale `svc:<dns-label>`; при запуске выводится производный URL Service.
- `tailscale.preserveFunnel`: если `true` и `tailscale.mode = "serve"`, OpenClaw проверяет `tailscale funnel status` перед повторным применением Serve при запуске и пропускает его, если внешне настроенный маршрут Funnel уже покрывает порт gateway. По умолчанию `false`.
- `controlUi.allowedOrigins`: явный allowlist browser-origin для подключений Gateway WebSocket. Требуется для публичных browser-origin не из loopback. Приватные загрузки UI same-origin из LAN/Tailnet от loopback, RFC1918/link-local, `.local`, `.ts.net` или хостов Tailscale CGNAT принимаются без включения fallback по Host-header.
- `controlUi.chatMessageMaxWidth`: необязательная максимальная ширина для сгруппированных сообщений чата Control UI. Принимает ограниченные CSS-значения ширины, такие как `960px`, `82%`, `min(1280px, 82%)` и `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: опасный режим, включающий fallback origin по Host-header для развертываний, которые намеренно полагаются на политику origin по Host-header.
- `remote.transport`: `ssh` (по умолчанию) или `direct` (ws/wss). Для `direct` значение `remote.url` должно быть `wss://` для публичных хостов; незашифрованный `ws://` принимается только для loopback, LAN, link-local, `.local`, `.ts.net` и хостов Tailscale CGNAT.
- `remote.remotePort`: порт gateway на удаленном SSH-хосте. По умолчанию `18789`; используйте это, когда локальный порт туннеля отличается от удаленного порта gateway.
- `gateway.remote.token` / `.password` — поля учетных данных удаленного клиента. Сами по себе они не настраивают аутентификацию gateway.
- `gateway.push.apns.relay.baseUrl`: базовый HTTPS URL для внешнего APNs relay, используемого после того, как iOS-сборки с поддержкой relay публикуют регистрации в gateway. Публичные сборки App Store используют размещенный OpenClaw relay. Пользовательские URL relay должны соответствовать намеренно отдельному пути сборки/развертывания iOS, чей URL relay указывает на этот relay.
- `gateway.push.apns.relay.timeoutMs`: таймаут отправки от gateway к relay в миллисекундах. По умолчанию `10000`.
- Регистрации с поддержкой relay делегируются конкретной идентичности gateway. Связанное iOS-приложение получает `gateway.identity.get`, включает эту идентичность в регистрацию relay и пересылает gateway grant отправки, ограниченный регистрацией. Другой gateway не может повторно использовать эту сохраненную регистрацию.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: временные переопределения env для конфигурации relay выше.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch только для разработки для loopback HTTP URL relay. Production URL relay должны оставаться на HTTPS.
- `gateway.handshakeTimeoutMs`: таймаут pre-auth handshake Gateway WebSocket в миллисекундах. По умолчанию: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` имеет приоритет, если задан. Увеличьте это значение на нагруженных или маломощных хостах, где локальные клиенты могут подключаться, пока прогрев запуска еще стабилизируется.
- `gateway.channelHealthCheckMinutes`: интервал монитора состояния каналов в минутах. Задайте `0`, чтобы глобально отключить перезапуски монитора состояния. По умолчанию: `5`.
- `gateway.channelStaleEventThresholdMinutes`: порог stale-socket в минутах. Держите это значение больше или равным `gateway.channelHealthCheckMinutes`. По умолчанию: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальное количество перезапусков монитором состояния на канал/аккаунт за скользящий час. По умолчанию: `10`.
- `channels.<provider>.healthMonitor.enabled`: поканальное отключение перезапусков монитором состояния при сохранении включенного глобального монитора.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: переопределение на аккаунт для каналов с несколькими аккаунтами. Если задано, имеет приоритет над переопределением уровня канала.
- Локальные пути вызова gateway могут использовать `gateway.remote.*` как fallback только когда `gateway.auth.*` не задано.
- Если `gateway.auth.token` / `gateway.auth.password` явно настроены через SecretRef и не разрешены, разрешение завершается fail-closed (без маскирования удаленным fallback).
- `trustedProxies`: IP reverse proxy, которые завершают TLS или внедряют заголовки forwarded-client. Указывайте только прокси, которыми вы управляете. Записи loopback все еще допустимы для same-host proxy/local-detection настроек (например, Tailscale Serve или локальный reverse proxy), но они **не** делают loopback-запросы подходящими для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: если `true`, gateway принимает `X-Real-IP`, если `X-Forwarded-For` отсутствует. По умолчанию `false` для fail-closed поведения.
- `gateway.nodes.pairing.autoApproveCidrs`: необязательный CIDR/IP allowlist для автоматического одобрения первичного pairing устройства node без запрошенных scopes. Отключен, если не задан. Это не одобряет автоматически pairing operator/browser/Control UI/WebChat и не одобряет автоматически обновления role, scope, metadata или public-key.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: глобальное формирование allow/deny для объявленных команд node после pairing и оценки platform allowlist. Используйте `allowCommands`, чтобы явно включить опасные команды node, такие как `camera.snap`, `camera.clip` и `screen.record`; `denyCommands` удаляет команду, даже если platform default или явное allow иначе включили бы ее. После того как node изменит объявленный список команд, отклоните и заново одобрите pairing этого устройства, чтобы gateway сохранил обновленный снимок команд.
- `gateway.tools.deny`: дополнительные имена инструментов, заблокированные для HTTP `POST /tools/invoke` (расширяет deny list по умолчанию).
- `gateway.tools.allow`: удаляет имена инструментов из HTTP deny list по умолчанию для вызывающих сторон owner/admin. Это не повышает вызывающих сторон с идентичностью `operator.write` до доступа owner/admin; `cron`, `gateway` и `nodes` остаются недоступными для вызывающих сторон не-owner даже при наличии в allowlist.

</Accordion>

### OpenAI-совместимые конечные точки

- Admin HTTP RPC: по умолчанию отключен как плагин `admin-http-rpc`. Включите плагин, чтобы зарегистрировать `POST /api/v1/admin/rpc`. См. [Admin HTTP RPC](/ru/plugins/admin-http-rpc).
- Chat Completions: по умолчанию отключено. Включите с `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Усиление защиты URL-входа Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Пустые allowlist считаются не заданными; используйте `gateway.http.endpoints.responses.files.allowUrl=false`
    и/или `gateway.http.endpoints.responses.images.allowUrl=false`, чтобы отключить получение URL.
- Необязательный заголовок усиления ответа:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте только для HTTPS origins, которыми вы управляете; см. [Аутентификация через доверенный прокси](/ru/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Изоляция нескольких экземпляров

Запустите несколько gateways на одном хосте с уникальными портами и каталогами состояния:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Удобные флаги: `--dev` (использует `~/.openclaw-dev` + порт `19001`), `--profile <name>` (использует `~/.openclaw-<name>`).

См. [Несколько Gateways](/ru/gateway/multiple-gateways).

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

- `enabled`: включает TLS-терминацию на listener gateway (HTTPS/WSS) (по умолчанию: `false`).
- `autoGenerate`: автоматически генерирует локальную самоподписанную пару cert/key, когда явные файлы не настроены; только для local/dev использования.
- `certPath`: путь в файловой системе к файлу TLS-сертификата.
- `keyPath`: путь в файловой системе к файлу приватного TLS-ключа; держите права доступа ограниченными.
- `caPath`: необязательный путь к CA bundle для проверки клиента или пользовательских цепочек доверия.

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
  - `"off"`: игнорировать оперативные изменения; изменения требуют явного перезапуска.
  - `"restart"`: всегда перезапускать процесс Gateway при изменении конфигурации.
  - `"hot"`: применять изменения внутри процесса без перезапуска.
  - `"hybrid"` (по умолчанию): сначала пытаться выполнить горячую перезагрузку; при необходимости откатываться к перезапуску.
- `debounceMs`: окно подавления дребезга в мс перед применением изменений конфигурации (неотрицательное целое число).
- `deferralTimeoutMs`: необязательное максимальное время в мс ожидания выполняющихся операций перед принудительным перезапуском или горячей перезагрузкой канала. Не указывайте его, чтобы использовать ограниченное ожидание по умолчанию (`300000`); задайте `0`, чтобы ждать бесконечно и периодически записывать предупреждения о все еще ожидающих операциях.

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
- `hooks.token` должен отличаться от активной аутентификации Gateway с общим секретом (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` или `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); при обнаружении повторного использования во время запуска записывается некритическое предупреждение безопасности.
- `openclaw security audit` помечает повторное использование аутентификации хука/Gateway как критическую находку, включая аутентификацию Gateway по паролю, предоставленную только во время аудита (`--auth password --password <password>`). Выполните `openclaw doctor --fix`, чтобы заменить сохраненный повторно используемый `hooks.token`, затем обновите внешних отправителей хуков, чтобы они использовали новый токен хука.
- `hooks.path` не может быть `/`; используйте отдельный подпуть, например `/hooks`.
- Если `hooks.allowRequestSessionKey=true`, ограничьте `hooks.allowedSessionKeyPrefixes` (например, `["hook:"]`).
- Если сопоставление или пресет использует шаблонный `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` и `hooks.allowRequestSessionKey=true`. Статические ключи сопоставления не требуют такого явного включения.

**Конечные точки:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` из полезной нагрузки запроса принимается только когда `hooks.allowRequestSessionKey=true` (по умолчанию: `false`).
- `POST /hooks/<name>` → разрешается через `hooks.mappings`
  - Значения `sessionKey` сопоставления, отрендеренные из шаблона, считаются предоставленными извне и также требуют `hooks.allowRequestSessionKey=true`.

<Accordion title="Сведения о сопоставлении">

- `match.path` сопоставляет подпуть после `/hooks` (например, `/hooks/gmail` → `gmail`).
- `match.source` сопоставляет поле полезной нагрузки для универсальных путей.
- Шаблоны вроде `{{messages[0].subject}}` читают данные из полезной нагрузки.
- `transform` может указывать на модуль JS/TS, возвращающий действие хука.
  - `transform.module` должен быть относительным путем и оставаться внутри `hooks.transformsDir` (абсолютные пути и обход каталогов отклоняются).
  - Держите `hooks.transformsDir` внутри `~/.openclaw/hooks/transforms`; каталоги Skills в рабочем пространстве отклоняются. Если `openclaw doctor` сообщает, что этот путь недействителен, переместите модуль преобразования в каталог преобразований хуков или удалите `hooks.transformsDir`.
- `agentId` направляет к конкретному агенту; неизвестные идентификаторы откатываются к агенту по умолчанию.
- `allowedAgentIds`: ограничивает эффективную маршрутизацию агентов, включая путь агента по умолчанию, когда `agentId` опущен (`*` или опущено = разрешить все, `[]` = запретить все).
- `defaultSessionKey`: необязательный фиксированный ключ сессии для запусков агента хуком без явного `sessionKey`.
- `allowRequestSessionKey`: разрешить вызывающим `/hooks/agent` и ключам сессий сопоставлений на основе шаблонов задавать `sessionKey` (по умолчанию: `false`).
- `allowedSessionKeyPrefixes`: необязательный список разрешенных префиксов для явных значений `sessionKey` (запрос + сопоставление), например `["hook:"]`. Он становится обязательным, когда любое сопоставление или пресет использует шаблонный `sessionKey`.
- `deliver: true` отправляет финальный ответ в канал; `channel` по умолчанию равен `last`.
- `model` переопределяет LLM для этого запуска хука (должна быть разрешена, если задан каталог моделей).

</Accordion>

### Интеграция Gmail

- Встроенный пресет Gmail использует `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Если вы сохраняете такую маршрутизацию по отдельным сообщениям, задайте `hooks.allowRequestSessionKey: true` и ограничьте `hooks.allowedSessionKeyPrefixes`, чтобы они соответствовали пространству имен Gmail, например `["hook:", "hook:gmail:"]`.
- Если вам нужен `hooks.allowRequestSessionKey: false`, переопределите пресет статическим `sessionKey` вместо шаблонного значения по умолчанию.

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

- Отдает редактируемые агентом HTML/CSS/JS и A2UI по HTTP через порт Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Только локально: сохраняйте `gateway.bind: "loopback"` (по умолчанию).
- Привязки не к loopback: маршруты canvas требуют аутентификацию Gateway (токен/пароль/доверенный прокси), как и другие HTTP-поверхности Gateway.
- Node WebViews обычно не отправляют заголовки аутентификации; после сопряжения и подключения узла Gateway объявляет URL возможностей, ограниченные узлом, для доступа к canvas/A2UI.
- URL возможностей привязаны к активной WS-сессии узла и быстро истекают. Резервный вариант на основе IP не используется.
- Внедряет клиент live-reload в обслуживаемый HTML.
- Автоматически создает начальный `index.html`, когда каталог пуст.
- Также отдает A2UI по `/__openclaw__/a2ui/`.
- Изменения требуют перезапуска Gateway.
- Отключайте live reload для больших каталогов или ошибок `EMFILE`.

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

- `minimal` (по умолчанию, когда включен встроенный Plugin `bonjour`): не включать `cliPath` + `sshPort` в TXT-записи.
- `full`: включать `cliPath` + `sshPort`; многоадресная реклама в LAN по-прежнему требует включенного встроенного Plugin `bonjour`.
- `off`: подавлять многоадресную рекламу в LAN без изменения включения Plugin.
- Встроенный Plugin `bonjour` автоматически запускается на хостах macOS и включается вручную в развертываниях Gateway на Linux, Windows и в контейнерах.
- Имя хоста по умолчанию берется из системного имени хоста, если оно является допустимой DNS-меткой, иначе используется `openclaw`. Переопределите с помощью `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записывает зону unicast DNS-SD в `~/.openclaw/dns/`. Для обнаружения между сетями используйте вместе с DNS-сервером (рекомендуется CoreDNS) + split DNS Tailscale.

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

- Встроенные переменные окружения применяются только если в окружении процесса отсутствует ключ.
- Файлы `.env`: `.env` в CWD + `~/.openclaw/.env` (ни один из них не переопределяет существующие переменные).
- `shellEnv`: импортирует отсутствующие ожидаемые ключи из профиля вашей login shell.
- Полный порядок приоритета см. в разделе [Окружение](/ru/help/environment).

### Подстановка переменных окружения

Ссылайтесь на переменные окружения в любой строке конфигурации с помощью `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Совпадают только имена в верхнем регистре: `[A-Z_][A-Z0-9_]*`.
- Отсутствующие/пустые переменные вызывают ошибку при загрузке конфигурации.
- Экранируйте как `$${VAR}` для буквального `${VAR}`.
- Работает с `$include`.

---

## Секреты

Ссылки на секреты аддитивны: открытые текстовые значения по-прежнему работают.

### `SecretRef`

Используйте одну форму объекта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валидация:

- Шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютный указатель JSON (например, `"/providers/openai/apiKey"`)
- Шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (поддерживает селекторы в стиле AWS `secret#json_key`)
- id для `source: "exec"` не должны содержать сегменты пути, разделенные косой чертой, `.` или `..` (например, `a/../b` отклоняется)

### Поддерживаемая поверхность учетных данных

- Каноническая матрица: [Поверхность учетных данных SecretRef](/ru/reference/secretref-credential-surface)
- `secrets apply` нацеливается на поддерживаемые пути учетных данных `openclaw.json`.
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
- Пути поставщиков file и exec завершаются отказом, когда проверка Windows ACL недоступна. Устанавливайте `allowInsecurePath: true` только для доверенных путей, которые невозможно проверить.
- Поставщик `exec` требует абсолютный путь `command` и использует протокольные полезные нагрузки через stdin/stdout.
- По умолчанию пути команд через symlink отклоняются. Установите `allowSymlinkCommand: true`, чтобы разрешить пути symlink с валидацией разрешенного целевого пути.
- Если настроен `trustedDirs`, проверка доверенного каталога применяется к разрешенному целевому пути.
- Дочернее окружение `exec` по умолчанию минимально; явно передавайте необходимые переменные через `passEnv`.
- Ссылки на секреты разрешаются во время активации в снимок в памяти, затем пути запросов читают только этот снимок.
- Фильтрация активной поверхности применяется во время активации: неразрешенные ссылки на включенных поверхностях приводят к сбою запуска/перезагрузки, а неактивные поверхности пропускаются с диагностикой.

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
- Устаревшие плоские карты `auth-profiles.json`, такие как `{ "provider": { "apiKey": "..." } }`, не являются форматом времени выполнения; `openclaw doctor --fix` переписывает их в канонические профили API-ключей `provider:default` с резервной копией `.legacy-flat.*.bak`.
- Профили в режиме OAuth (`auth.profiles.<id>.mode = "oauth"`) не поддерживают учетные данные auth-профилей на базе SecretRef.
- Статические учетные данные времени выполнения берутся из разрешенных снимков в памяти; устаревшие статические записи `auth.json` очищаются при обнаружении.
- Устаревший импорт OAuth выполняется из `~/.openclaw/credentials/oauth.json`.
- См. [OAuth](/ru/concepts/oauth).
- Поведение среды выполнения секретов и инструменты `audit/configure/apply`: [Управление секретами](/ru/gateway/secrets).

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
  ошибок биллинга или недостатка средств (по умолчанию: `5`). Явный текст о биллинге
  все еще может попадать сюда даже в ответах `401`/`403`, но текстовые
  сопоставители конкретных провайдеров остаются ограничены провайдером, которому они принадлежат
  (например, OpenRouter `Key limit exceeded`). Повторяемые HTTP `402` сообщения о
  временном окне использования или лимите расходов организации/рабочей области остаются в пути
  `rate_limit`.
- `billingBackoffHoursByProvider`: необязательные переопределения часов задержки биллинга для отдельных провайдеров.
- `billingMaxHours`: верхний предел в часах для экспоненциального роста задержки биллинга (по умолчанию: `24`).
- `authPermanentBackoffMinutes`: базовая задержка в минутах для высоконадежных сбоев `auth_permanent` (по умолчанию: `10`).
- `authPermanentMaxMinutes`: верхний предел в минутах для роста задержки `auth_permanent` (по умолчанию: `60`).
- `failureWindowHours`: скользящее окно в часах, используемое для счетчиков задержки (по умолчанию: `24`).
- `overloadedProfileRotations`: максимальное число ротаций auth-профилей у того же провайдера при ошибках перегрузки перед переключением на резервную модель (по умолчанию: `1`). Формы занятости провайдера, такие как `ModelNotReadyException`, попадают сюда.
- `overloadedBackoffMs`: фиксированная задержка перед повторной попыткой ротации перегруженного провайдера/профиля (по умолчанию: `0`).
- `rateLimitedProfileRotations`: максимальное число ротаций auth-профилей у того же провайдера при ошибках ограничения частоты перед переключением на резервную модель (по умолчанию: `1`). Этот сегмент ограничения частоты включает текст, оформленный провайдером, например `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` и `resource exhausted`.

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
- `redactSensitive` / `redactPatterns`: маскирование по мере возможности для вывода в консоль, файловых журналов, записей журнала OTLP и сохраненного текста стенограммы сессии. `redactSensitive: "off"` отключает только эту общую политику журналов/стенограмм; поверхности безопасности UI/инструментов/диагностики все равно редактируют секреты перед отправкой.

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
- `flags`: массив строк флагов, включающих целевой вывод журнала (поддерживает подстановочные знаки вроде `"telegram.*"` или `"*"`).
- `stuckSessionWarnMs`: порог возраста без прогресса в мс для классификации долгих сессий обработки как `session.long_running`, `session.stalled` или `session.stuck`. Ответ, инструмент, статус, блок и прогресс ACP сбрасывают таймер; повторные диагностики `session.stuck` откладываются, пока состояние не изменилось.
- `stuckSessionAbortMs`: порог возраста без прогресса в мс, после которого подходящая зависшая активная работа может быть abort-drained для восстановления. Если не задано, OpenClaw использует более безопасное расширенное окно встроенного запуска не менее 5 минут и 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: захватывает отредактированный снимок стабильности перед OOM, когда давление памяти достигает `critical` (по умолчанию: `false`). Установите `true`, чтобы добавить сканирование/запись файла пакета стабильности, сохранив обычные события давления памяти.
- `otel.enabled`: включает конвейер экспорта OpenTelemetry (по умолчанию: `false`). Полную конфигурацию, каталог сигналов и модель приватности см. в [экспорте OpenTelemetry](/ru/gateway/opentelemetry).
- `otel.endpoint`: URL коллектора для экспорта OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: необязательные конечные точки OTLP для отдельных сигналов. Если заданы, они переопределяют `otel.endpoint` только для соответствующего сигнала.
- `otel.protocol`: `"http/protobuf"` (по умолчанию) или `"grpc"`.
- `otel.headers`: дополнительные заголовки метаданных HTTP/gRPC, отправляемые с запросами экспорта OTel.
- `otel.serviceName`: имя сервиса для атрибутов ресурса.
- `otel.traces` / `otel.metrics` / `otel.logs`: включают экспорт трассировок, метрик или журналов.
- `otel.logsExporter`: приемник экспорта журналов: `"otlp"` (по умолчанию), `"stdout"` для одного объекта JSON на строку stdout или `"both"`.
- `otel.sampleRate`: частота выборки трассировок `0`-`1`.
- `otel.flushIntervalMs`: интервал периодической отправки телеметрии в мс.
- `otel.captureContent`: явное включение захвата необработанного содержимого для атрибутов span OTEL. По умолчанию отключено. Булево `true` захватывает несистемное содержимое сообщений/инструментов; объектная форма позволяет явно включить `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` и `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: переключатель окружения для новейшей экспериментальной формы span вывода GenAI, включая имена span `{gen_ai.operation.name} {gen_ai.request.model}`, вид span `CLIENT` и `gen_ai.provider.name` вместо устаревшего `gen_ai.system`. По умолчанию spans сохраняют `openclaw.model.call` и `gen_ai.system` для совместимости; метрики GenAI используют ограниченные семантические атрибуты.
- `OPENCLAW_OTEL_PRELOADED=1`: переключатель окружения для хостов, которые уже зарегистрировали глобальный OpenTelemetry SDK. В этом случае OpenClaw пропускает запуск/остановку SDK, принадлежащего Plugin, сохраняя диагностические слушатели активными.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` и `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: переменные окружения конечных точек для отдельных сигналов, используемые, когда соответствующий ключ конфигурации не задан.
- `cacheTrace.enabled`: записывать снимки трассировки кэша для встроенных запусков (по умолчанию: `false`).
- `cacheTrace.filePath`: путь вывода для JSONL трассировки кэша (по умолчанию: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
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
- `auto.stableDelayHours`: минимальная задержка в часах перед автоматическим применением stable-канала (по умолчанию: `6`; максимум: `168`).
- `auto.stableJitterHours`: дополнительное окно распределения выката stable-канала в часах (по умолчанию: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: как часто выполняются проверки beta-канала, в часах (по умолчанию: `1`; максимум: `24`).

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

- `enabled`: глобальный флаг функции ACP (по умолчанию: `true`; установите `false`, чтобы скрыть отправку ACP и возможности spawn).
- `dispatch.enabled`: независимый флаг для отправки ходов сессии ACP (по умолчанию: `true`). Установите `false`, чтобы оставить команды ACP доступными, но заблокировать выполнение.
- `backend`: идентификатор стандартной серверной части времени выполнения ACP (должен совпадать с зарегистрированным runtime Plugin ACP).
  Сначала установите backend Plugin и, если задан `plugins.allow`, включите идентификатор backend Plugin (например, `acpx`), иначе backend ACP не загрузится.
- `defaultAgent`: резервный идентификатор целевого агента ACP, когда spawns не указывают явную цель.
- `allowedAgents`: allowlist идентификаторов агентов, разрешенных для runtime-сессий ACP; пустое значение означает отсутствие дополнительных ограничений.
- `maxConcurrentSessions`: максимальное число одновременно активных сессий ACP.
- `stream.coalesceIdleMs`: окно idle flush в мс для потокового текста.
- `stream.maxChunkChars`: максимальный размер фрагмента перед разбиением проекции потокового блока.
- `stream.repeatSuppression`: подавлять повторяющиеся строки статуса/инструментов за ход (по умолчанию: `true`).
- `stream.deliveryMode`: `"live"` передает поток постепенно; `"final_only"` буферизует до терминальных событий хода.
- `stream.hiddenBoundarySeparator`: разделитель перед видимым текстом после скрытых событий инструментов (по умолчанию: `"paragraph"`).
- `stream.maxOutputChars`: максимальное число символов вывода ассистента, проецируемых за ход ACP.
- `stream.maxSessionUpdateChars`: максимальное число символов для проецируемых строк статуса/обновлений ACP.
- `stream.tagVisibility`: запись имен тегов в булевы переопределения видимости для потоковых событий.
- `runtime.ttlMinutes`: idle TTL в минутах для рабочих процессов сессий ACP перед возможной очисткой.
- `runtime.installCommand`: необязательная команда установки для запуска при начальной настройке runtime-среды ACP.

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

## Идентификация

См. поля идентификации `agents.list` в разделе [Значения агента по умолчанию](/ru/gateway/config-agents#agent-defaults).

---

## Мост (устаревший, удален)

Текущие сборки больше не включают TCP-мост. Узлы подключаются через Gateway WebSocket. Ключи `bridge.*` больше не являются частью схемы конфигурации (валидация завершается ошибкой, пока они не будут удалены; `openclaw doctor --fix` может удалить неизвестные ключи).

<Accordion title="Устаревшая конфигурация моста (историческая справка)">

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
    maxConcurrentRuns: 8, // по умолчанию; диспетчеризация cron + изолированное выполнение агентского хода cron
    webhook: "https://example.invalid/legacy", // устаревший резервный вариант для сохраненных заданий notify:true
    webhookToken: "replace-with-dedicated-token", // необязательный bearer-токен для исходящей аутентификации webhook
    sessionRetention: "24h", // строка длительности или false
    runLog: {
      maxBytes: "2mb", // по умолчанию 2_000_000 байт
      keepLines: 2000, // по умолчанию 2000
    },
  },
}
```

- `sessionRetention`: как долго хранить завершенные изолированные сеансы запусков cron перед удалением из `sessions.json`. Также управляет очисткой архивированных удаленных расшифровок cron. По умолчанию: `24h`; задайте `false`, чтобы отключить.
- `runLog.maxBytes`: принимается для совместимости со старыми файловыми журналами запусков cron. По умолчанию: `2_000_000` байт.
- `runLog.keepLines`: новейшие строки истории запусков SQLite, сохраняемые для каждого задания. По умолчанию: `2000`.
- `webhookToken`: bearer-токен, используемый для доставки POST через webhook cron (`delivery.mode = "webhook"`); если он опущен, заголовок аутентификации не отправляется.
- `webhook`: устаревший резервный URL webhook (http/https), используемый `openclaw doctor --fix` для миграции сохраненных заданий, в которых все еще есть `notify: true`; доставка во время выполнения использует `delivery.mode="webhook"` для каждого задания плюс `delivery.to` или `delivery.completionDestination` при сохранении доставки объявлений.

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
- `backoffMs`: массив задержек отката в мс для каждой повторной попытки (по умолчанию: `[30000, 60000, 300000]`; 1-10 элементов).
- `retryOn`: типы ошибок, запускающие повторные попытки: `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Опустите, чтобы повторять все временные типы.

Одноразовые задания остаются включенными, пока повторные попытки не будут исчерпаны, затем отключаются с сохранением конечного состояния ошибки. Повторяющиеся задания используют ту же политику повторов при временных ошибках, чтобы запуститься снова после отката до следующего запланированного окна; постоянные ошибки или исчерпанные повторы временных ошибок возвращаются к обычному повторяющемуся расписанию с откатом при ошибке.

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
- `after`: число последовательных сбоев до отправки оповещения (положительное целое, минимум: `1`).
- `cooldownMs`: минимальное число миллисекунд между повторными оповещениями для одного и того же задания (неотрицательное целое).
- `includeSkipped`: учитывать последовательные пропущенные запуски в пороге оповещения (по умолчанию: `false`). Пропущенные запуски отслеживаются отдельно и не влияют на откат при ошибках выполнения.
- `mode`: режим доставки: `"announce"` отправляет через сообщение канала; `"webhook"` публикует в настроенный webhook.
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
- `mode`: `"announce"` или `"webhook"`; по умолчанию `"announce"`, когда есть достаточно целевых данных.
- `channel`: переопределение канала для доставки объявлений. `"last"` повторно использует последний известный канал доставки.
- `to`: явная цель объявления или URL webhook. Требуется для режима webhook.
- `accountId`: необязательное переопределение учетной записи для доставки.
- `delivery.failureDestination` для отдельного задания переопределяет это глобальное значение по умолчанию.
- Если не задано ни глобальное назначение сбоя, ни назначение сбоя для отдельного задания, задания, которые уже доставляются через `announce`, при сбое возвращаются к этой основной цели объявления.
- `delivery.failureDestination` поддерживается только для заданий `sessionTarget="isolated"`, если основной `delivery.mode` задания не равен `"webhook"`.

См. [Задания Cron](/ru/automation/cron-jobs). Изолированные выполнения cron отслеживаются как [фоновые задачи](/ru/automation/tasks).

---

## Переменные шаблонов моделей медиа

Заполнители шаблонов, раскрываемые в `tools.media.models[].args`:

| Переменная         | Описание                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Полное тело входящего сообщения                   |
| `{{RawBody}}`      | Сырое тело (без оберток истории/отправителя)      |
| `{{BodyStripped}}` | Тело с удаленными упоминаниями группы             |
| `{{From}}`         | Идентификатор отправителя                         |
| `{{To}}`           | Идентификатор назначения                          |
| `{{MessageSid}}`   | Идентификатор сообщения канала                    |
| `{{SessionId}}`    | UUID текущего сеанса                              |
| `{{IsNewSession}}` | `"true"` при создании нового сеанса               |
| `{{MediaUrl}}`     | Псевдо-URL входящего медиа                        |
| `{{MediaPath}}`    | Локальный путь к медиа                            |
| `{{MediaType}}`    | Тип медиа (изображение/аудио/документ/…)          |
| `{{Transcript}}`   | Расшифровка аудио                                 |
| `{{Prompt}}`       | Разрешенный медиа-промпт для записей CLI          |
| `{{MaxChars}}`     | Разрешенное максимальное число выходных символов для записей CLI |
| `{{ChatType}}`     | `"direct"` или `"group"`                          |
| `{{GroupSubject}}` | Тема группы (по возможности)                      |
| `{{GroupMembers}}` | Предпросмотр участников группы (по возможности)   |
| `{{SenderName}}`   | Отображаемое имя отправителя (по возможности)     |
| `{{SenderE164}}`   | Номер телефона отправителя (по возможности)       |
| `{{Provider}}`     | Подсказка провайдера (whatsapp, telegram, discord и т. д.) |

---

## Включения конфигурации (`$include`)

Разделение конфигурации на несколько файлов:

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
- Пути: разрешаются относительно включающего файла, но должны оставаться внутри каталога конфигурации верхнего уровня (`dirname` от `openclaw.json`). Абсолютные формы и формы с `../` разрешены только если они все равно разрешаются внутри этой границы. Пути не должны содержать нулевые байты и должны быть строго короче 4096 символов до и после разрешения.
- Записи, принадлежащие OpenClaw, которые изменяют только один раздел верхнего уровня, поддерживаемый однофайловым включением, записываются сквозным образом в этот включенный файл. Например, `plugins install` обновляет `plugins: { $include: "./plugins.json5" }` в `plugins.json5` и оставляет `openclaw.json` нетронутым.
- Корневые включения, массивы включений и включения с соседними переопределениями доступны только для чтения для записей, принадлежащих OpenClaw; такие записи завершаются закрытым отказом вместо разворачивания конфигурации.
- Ошибки: понятные сообщения для отсутствующих файлов, ошибок разбора, циклических включений, недопустимого формата пути и чрезмерной длины.

---

_Связано: [Конфигурация](/ru/gateway/configuration) · [Примеры конфигурации](/ru/gateway/configuration-examples) · [Doctor](/ru/gateway/doctor)_

## Связано

- [Конфигурация](/ru/gateway/configuration)
- [Примеры конфигурации](/ru/gateway/configuration-examples)
