---
read_when:
    - Настройка политики `tools.*`, списков разрешений или экспериментальных функций
    - Регистрация пользовательских провайдеров или переопределение базовых URL-адресов
    - Настройка самоуправляемых конечных точек, совместимых с OpenAI
sidebarTitle: Tools and custom providers
summary: Конфигурация инструментов (политика, экспериментальные переключатели, инструменты на базе провайдера) и настройка пользовательского провайдера/base-URL
title: Конфигурация — инструменты и пользовательские провайдеры
x-i18n:
    generated_at: "2026-06-28T22:55:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` ключи конфигурации и настройка пользовательского провайдера / базового URL. Для агентов, каналов и других ключей конфигурации верхнего уровня см. [Справочник по конфигурации](/ru/gateway/configuration-reference).

## Инструменты

### Профили инструментов

`tools.profile` задает базовый список разрешений перед `tools.allow`/`tools.deny`:

<Note>
Локальный онбординг по умолчанию задает для новых локальных конфигураций `tools.profile: "coding"`, если значение не указано (существующие явно заданные профили сохраняются).
</Note>

| Профиль     | Включает                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | только `session_status`                                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | Без ограничений (то же, что и без указания значения)                                                                                              |

### Группы инструментов

| Группа             | Инструменты                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` принимается как псевдоним для `exec`)                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Все встроенные инструменты (исключая plugins провайдеров)                                                               |
| `group:plugins`    | Инструменты, принадлежащие загруженным plugins, включая настроенные MCP-серверы, открытые через `bundle-mcp`            |

### Инструменты MCP и plugins в политике инструментов песочницы

Настроенные MCP-серверы доступны как инструменты, принадлежащие plugin, под id plugin `bundle-mcp`. Обычные профили инструментов могут разрешать их, но `tools.sandbox.tools` является дополнительным шлюзом для сеансов в песочнице. Если режим песочницы равен `"all"` или `"non-main"`, включите одну из этих записей в список разрешенных инструментов песочницы, когда инструменты MCP/plugin должны быть видимыми:

- `bundle-mcp` для MCP-серверов, управляемых OpenClaw, из `mcp.servers`
- id plugin для конкретного нативного plugin
- `group:plugins` для всех загруженных инструментов, принадлежащих plugins
- точные имена инструментов MCP-сервера или glob-шаблоны серверов, например `outlook__send_mail` или `outlook__*`, когда нужен только один сервер

Glob-шаблоны серверов используют безопасный для провайдера префикс MCP-сервера, который не обязательно совпадает с исходным ключом `mcp.servers`. Символы, не входящие в `[A-Za-z0-9_-]`, заменяются на `-`, имена, которые не начинаются с буквы, получают префикс `mcp-`, а длинные или повторяющиеся префиксы могут быть усечены или получить суффикс; например, `mcp.servers["Outlook Graph"]` использует glob-шаблон вида `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Без этой записи уровня песочницы MCP-сервер все еще может успешно загрузиться, но его инструменты будут отфильтрованы до запроса к провайдеру. Используйте `openclaw doctor`, чтобы обнаружить такую форму для MCP-серверов, управляемых OpenClaw, в `mcp.servers`. MCP-серверы, загруженные из манифестов bundled plugins или Claude `.mcp.json`, используют тот же шлюз песочницы, но эта диагностика пока не перечисляет такие источники; используйте те же записи списка разрешений, если их инструменты исчезают в ходах в песочнице.

### `tools.codeMode`

`tools.codeMode` включает универсальную поверхность режима кода OpenClaw. Когда он включен
для запуска с инструментами, модель видит только `exec` и `wait`; обычные инструменты OpenClaw
перемещаются за мост каталога `tools.*` внутри песочницы, а инструменты MCP
доступны через сгенерированное пространство имен `MCP`.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Также принимается сокращенная форма:

```json5
{
  tools: { codeMode: true },
}
```

Объявления MCP доступны через поверхность виртуальных файлов API только для чтения в
режиме кода. Гостевой код может вызвать `API.list("mcp")` и
`API.read("mcp/<server>.d.ts")`, чтобы изучить сигнатуры в стиле TypeScript перед
вызовом `MCP.<server>.<tool>()`. См. [Режим кода](/ru/reference/code-mode) для
контракта среды выполнения, ограничений и шагов отладки.

### `tools.allow` / `tools.deny`

Глобальная политика разрешения/запрета инструментов (запрет имеет приоритет). Без учета регистра, поддерживает wildcard `*`. Применяется даже при отключенной песочнице Docker.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` и `apply_patch` являются отдельными id инструментов. `allow: ["write"]` также включает `apply_patch` для совместимых моделей, но `deny: ["write"]` не запрещает `apply_patch`. Чтобы заблокировать все изменения файлов, запретите `group:fs` или явно перечислите каждый инструмент, изменяющий файлы:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Дополнительно ограничивает инструменты для конкретных провайдеров или моделей. Порядок: базовый профиль → профиль провайдера → разрешение/запрет.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

Ограничивает инструменты для конкретной идентичности отправителя запроса. Это эшелонированная защита поверх контроля доступа канала; значения отправителя должны приходить из адаптера канала, а не из текста сообщения.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Ключи используют явные префиксы: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` или `"*"`. Id каналов являются каноническими id OpenClaw; псевдонимы, такие как `teams`, нормализуются в `msteams`. Устаревшие ключи без префикса принимаются только как `id:`. Порядок сопоставления: channel+id, id, e164, username, name, затем wildcard.

Поагентное `agents.list[].tools.toolsBySender` переопределяет глобальное сопоставление отправителя, когда оно совпадает, даже с пустой политикой `{}`.

### `tools.elevated`

Управляет повышенным доступом `exec` вне песочницы:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Поагентное переопределение (`agents.list[].tools.elevated`) может только дополнительно ограничивать.
- `/elevated on|off|ask|full` сохраняет состояние для каждого сеанса; встроенные директивы применяются к одному сообщению.
- Повышенный `exec` обходит песочницу и использует настроенный путь выхода (`gateway` по умолчанию или `node`, когда целью exec является `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Проверки безопасности циклов инструментов **по умолчанию отключены**. Задайте `enabled: true`, чтобы активировать обнаружение. Настройки можно определить глобально в `tools.loopDetection` и переопределить для каждого агента в `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Максимальная история вызовов инструментов, сохраняемая для анализа циклов.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Порог повторяющегося шаблона без прогресса для предупреждений.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Более высокий порог повторений для блокировки критических циклов.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Жесткий порог остановки для любого запуска без прогресса.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Предупреждать о повторных вызовах одного и того же инструмента с теми же аргументами.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Предупреждать/блокировать для известных инструментов опроса (`process.poll`, `command_status` и т. д.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Предупреждать/блокировать для чередующихся парных шаблонов без прогресса.
</ParamField>

<Warning>
Если `warningThreshold >= criticalThreshold` или `criticalThreshold >= globalCircuitBreakerThreshold`, валидация завершается ошибкой.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Настраивает понимание входящих медиа (изображения/аудио/видео):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Поля записи модели медиа">
    **Запись провайдера** (`type: "provider"` или опущено):

    - `provider`: идентификатор API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` и т. д.)
    - `model`: переопределение идентификатора модели
    - `profile` / `preferredProfile`: выбор профиля `auth-profiles.json`

    **Запись CLI** (`type: "cli"`):

    - `command`: исполняемый файл для запуска
    - `args`: шаблонные аргументы (поддерживает `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` и т. д.; `openclaw doctor --fix` переносит устаревшие заполнители `{input}` в `{{MediaPath}}`)

    **Общие поля:**

    - `capabilities`: необязательный список (`image`, `audio`, `video`). Значения по умолчанию: `openai`/`anthropic`/`minimax` → изображение, `google` → изображение+аудио+видео, `groq` → аудио.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: переопределения для отдельной записи.
    - `tools.media.image.timeoutSeconds` и соответствующие записи `timeoutSeconds` модели изображений также применяются, когда агент вызывает явный инструмент `image`. Для понимания изображений этот тайм-аут применяется к самому запросу и не уменьшается из-за ранее выполненной подготовки.
    - При сбоях выполняется переход к следующей записи.

    Аутентификация провайдера следует стандартному порядку: `auth-profiles.json` → переменные окружения → `models.providers.*.apiKey`.

    **Поля асинхронного завершения:**

    - `asyncCompletion.directSend`: устаревший флаг совместимости. Завершенные асинхронные задачи обработки медиа остаются опосредованными сеансом запрашивающего, чтобы агент получил результат, решил, как сообщить его пользователю, и использовал инструмент сообщений, когда этого требует доставка в исходный канал.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Управляет тем, на какие сеансы могут быть нацелены инструменты сеансов (`sessions_list`, `sessions_history`, `sessions_send`).

По умолчанию: `tree` (текущий сеанс + сеансы, порожденные им, например подагенты).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Области видимости">
    - `self`: только ключ текущего сеанса.
    - `tree`: текущий сеанс + сеансы, порожденные текущим сеансом (подагенты).
    - `agent`: любой сеанс, принадлежащий текущему идентификатору агента (может включать других пользователей, если вы запускаете сеансы для каждого отправителя под тем же идентификатором агента).
    - `all`: любой сеанс. Нацеливание между агентами по-прежнему требует `tools.agentToAgent`.
    - Ограничение песочницы: когда текущий сеанс находится в песочнице и `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, видимость принудительно устанавливается в `tree`, даже если `tools.sessions.visibility="all"`.
    - Когда режим не `all`, `sessions_list` включает компактное поле `visibility`,
      описывающее эффективный режим, и предупреждение о том, что некоторые сеансы могут быть
      опущены за пределами текущей области.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Управляет поддержкой встроенных вложений для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Примечания о вложениях">
    - Вложения требуют `enabled: true`.
    - Вложения подагента материализуются в дочернем рабочем пространстве в `.openclaw/attachments/<uuid>/` с `.manifest.json`.
    - Вложения ACP поддерживают только изображения и пересылаются встроенно в среду выполнения ACP после прохождения тех же лимитов на количество файлов, байты на файл и общий размер в байтах.
    - Содержимое вложений автоматически редактируется при сохранении транскрипта.
    - Входные данные Base64 проверяются строгими проверками алфавита/заполнения и защитой размера до декодирования.
    - Права доступа к файлам вложений подагента: `0700` для каталогов и `0600` для файлов.
    - Очистка подагента следует политике `cleanup`: `delete` всегда удаляет вложения; `keep` сохраняет их только при `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Экспериментальные флаги встроенных инструментов. По умолчанию отключены, если не применяется правило автоматического включения для строгого агентного GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: включает структурированный инструмент `update_plan` для отслеживания нетривиальной многошаговой работы.
- По умолчанию: `false`, если `agents.defaults.embeddedAgent.executionContract` (или переопределение для отдельного агента) не задано как `"strict-agentic"` для запуска семейства GPT-5 через OpenAI или OpenAI Codex. Установите `true`, чтобы принудительно включить инструмент вне этой области, или `false`, чтобы оставить его отключенным даже для строгих агентных запусков GPT-5.
- Когда он включен, системная подсказка также добавляет рекомендации по использованию, чтобы модель применяла его только для существенной работы и держала не более одного шага в состоянии `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: модель по умолчанию для порождаемых подагентов. Если опущено, подагенты наследуют модель вызывающего.
- `allowAgents`: список разрешенных настроенных идентификаторов целевых агентов по умолчанию для `sessions_spawn`, когда запрашивающий агент не задает собственный `subagents.allowAgents` (`["*"]` = любой настроенный целевой агент; по умолчанию: только тот же агент). Устаревшие записи, конфигурация агента для которых была удалена, отклоняются `sessions_spawn` и опускаются в `agents_list`; запустите `openclaw doctor --fix`, чтобы очистить их.
- `runTimeoutSeconds`: тайм-аут по умолчанию (в секундах) для `sessions_spawn`. `0` означает отсутствие тайм-аута.
- `announceTimeoutMs`: тайм-аут отдельного вызова (в миллисекундах) для попыток доставки объявления `agent` через Gateway. По умолчанию: `120000`. Временные повторные попытки могут сделать общее ожидание объявления длиннее одного настроенного тайм-аута.
- Политика инструментов для отдельного подагента: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Пользовательские провайдеры и базовые URL

Plugin провайдеров публикуют собственные строки каталога моделей. Добавляйте пользовательских провайдеров через `models.providers` в конфигурации или `~/.openclaw/agents/<agentId>/agent/models.json`.

Настройка `baseUrl` пользовательского/локального провайдера также является узким решением о доверии к сети для HTTP-запросов модели: OpenClaw разрешает именно этот источник `scheme://host:port` через защищенный путь fetch, без добавления отдельной опции конфигурации и без доверия другим частным источникам.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Аутентификация и приоритет слияния">
    - Используйте `authHeader: true` + `headers` для пользовательских потребностей аутентификации.
    - Переопределите корень конфигурации агента с помощью `OPENCLAW_AGENT_DIR`.
    - Приоритет слияния для совпадающих идентификаторов провайдеров:
      - Непустые значения `baseUrl` из `models.json` агента имеют приоритет.
      - Непустые значения `apiKey` агента имеют приоритет только тогда, когда этот провайдер не управляется SecretRef в текущем контексте конфигурации/профиля аутентификации.
      - Значения `apiKey` провайдера, управляемого SecretRef, обновляются из исходных маркеров (`ENV_VAR_NAME` для ссылок на переменные окружения, `secretref-managed` для ссылок на файл/exec) вместо сохранения разрешенных секретов.
      - Значения заголовков провайдера, управляемого SecretRef, обновляются из исходных маркеров (`secretref-env:ENV_VAR_NAME` для ссылок на переменные окружения, `secretref-managed` для ссылок на файл/exec).
      - Пустые или отсутствующие `apiKey`/`baseUrl` агента откатываются к `models.providers` в конфигурации.
      - Совпадающие `contextWindow`/`maxTokens` модели используют большее значение между явной конфигурацией и неявными значениями каталога.
      - Совпадающий `contextTokens` модели сохраняет явное ограничение среды выполнения, если оно присутствует; используйте его, чтобы ограничить эффективный контекст без изменения нативных метаданных модели.
      - Каталоги Plugin провайдеров сохраняются как сгенерированные фрагменты каталога, принадлежащие Plugin, в состоянии Plugin агента.
      - Используйте `models.mode: "replace"`, когда хотите, чтобы конфигурация полностью перезаписала `models.json` и активные фрагменты каталога Plugin.
      - Сохранение маркеров авторитетно относительно источника: маркеры записываются из активного снимка исходной конфигурации (до разрешения), а не из разрешенных значений секретов среды выполнения.

  </Accordion>
</AccordionGroup>

### Подробности полей провайдера

<AccordionGroup>
  <Accordion title="Каталог верхнего уровня">
    - `models.mode`: поведение каталога провайдеров (`merge` или `replace`).
    - `models.providers`: карта пользовательских провайдеров с ключами по идентификатору провайдера.
      - Безопасные правки: используйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` или `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` для добавочных обновлений. `config set` отказывается от разрушающих замен, если не передать `--replace`.

  </Accordion>
  <Accordion title="Подключение провайдера и аутентификация">
    - `models.providers.*.api`: адаптер запросов (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` и т. д.). Для самостоятельно размещенных бэкендов `/v1/chat/completions`, таких как MLX, vLLM, SGLang и большинство локальных серверов, совместимых с OpenAI, используйте `openai-completions`. Пользовательский провайдер с `baseUrl`, но без `api`, по умолчанию использует `openai-completions`; задавайте `openai-responses` только когда бэкенд поддерживает `/v1/responses`.
    - `models.providers.*.apiKey`: учетные данные провайдера (предпочтительно подстановка SecretRef/env).
    - `models.providers.*.auth`: стратегия аутентификации (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: стандартное нативное окно контекста для моделей этого провайдера, когда запись модели не задает `contextWindow`.
    - `models.providers.*.contextTokens`: стандартный эффективный лимит контекста во время выполнения для моделей этого провайдера, когда запись модели не задает `contextTokens`.
    - `models.providers.*.maxTokens`: стандартный лимит выходных токенов для моделей этого провайдера, когда запись модели не задает `maxTokens`.
    - `models.providers.*.timeoutSeconds`: необязательный тайм-аут HTTP-запроса модели на уровне провайдера в секундах, включая подключение, заголовки, тело и обработку полного прерывания запроса.
    - `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` внедряет `options.num_ctx` в запросы (по умолчанию: `true`).
    - `models.providers.*.authHeader`: принудительно передает учетные данные в заголовке `Authorization`, когда это требуется.
    - `models.providers.*.baseUrl`: базовый URL вышестоящего API.
    - `models.providers.*.headers`: дополнительные статические заголовки для маршрутизации через прокси/тенант.

  </Accordion>
  <Accordion title="Переопределения транспорта запросов">
    `models.providers.*.request`: переопределения транспорта для HTTP-запросов к провайдеру модели.

    - `request.headers`: дополнительные заголовки (объединяются со стандартными настройками провайдера). Значения принимают SecretRef.
    - `request.auth`: переопределение стратегии аутентификации. Режимы: `"provider-default"` (использовать встроенную аутентификацию провайдера), `"authorization-bearer"` (с `token`), `"header"` (с `headerName`, `value`, необязательным `prefix`).
    - `request.proxy`: переопределение HTTP-прокси. Режимы: `"env-proxy"` (использовать переменные окружения `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (с `url`). Оба режима принимают необязательный под-объект `tls`.
    - `request.tls`: переопределение TLS для прямых подключений. Поля: `ca`, `cert`, `key`, `passphrase` (все принимают SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: когда `true`, разрешает HTTP-запросы провайдера модели к частным, CGNAT или похожим диапазонам через HTTP-защиту fetch провайдера. Базовые URL пользовательских/локальных провайдеров уже доверяют точно настроенному источнику, кроме источников metadata/link-local, которые остаются заблокированными без явного включения. Установите `false`, чтобы отказаться от доверия точному источнику. WebSocket использует тот же `request` для заголовков/TLS, но не этот SSRF-шлюз fetch. По умолчанию `false`.

  </Accordion>
  <Accordion title="Записи каталога моделей">
    - `models.providers.*.models`: явные записи каталога моделей провайдера.
    - `models.providers.*.models.*.input`: модальности ввода модели. Используйте `["text"]` для моделей только с текстом и `["text", "image"]` для нативных моделей с изображениями/зрением. Вложения изображений внедряются в ходы агента только когда выбранная модель помечена как поддерживающая изображения.
    - `models.providers.*.models.*.contextWindow`: метаданные нативного окна контекста модели. Это переопределяет `contextWindow` уровня провайдера для этой модели.
    - `models.providers.*.models.*.contextTokens`: необязательный лимит контекста во время выполнения. Это переопределяет `contextTokens` уровня провайдера; используйте его, когда нужен меньший эффективный бюджет контекста, чем нативное `contextWindow` модели; `openclaw models list` показывает оба значения, когда они отличаются.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: необязательная подсказка совместимости. Для `api: "openai-completions"` с непустым ненативным `baseUrl` (хост не `api.openai.com`) OpenClaw принудительно задает `false` во время выполнения. Пустой/опущенный `baseUrl` сохраняет стандартное поведение OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: необязательная подсказка совместимости для конечных точек чата, совместимых с OpenAI, которые принимают только строки. Когда `true`, OpenClaw преобразует массивы чисто текстового `messages[].content` в обычные строки перед отправкой запроса.
    - `models.providers.*.models.*.compat.strictMessageKeys`: необязательная подсказка совместимости для строгих конечных точек чата, совместимых с OpenAI. Когда `true`, OpenClaw сокращает исходящие объекты сообщений Chat Completions до `role` и `content` перед отправкой запроса.
    - `models.providers.*.models.*.compat.thinkingFormat`: необязательная подсказка формата полезной нагрузки мышления. Используйте `"together"` для `reasoning.enabled` в стиле Together, `"qwen"` для верхнеуровневого `enable_thinking` или `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на серверах семейства Qwen, совместимых с OpenAI, которые поддерживают kwargs шаблона чата на уровне запроса, таких как vLLM. Настроенные модели vLLM Qwen предоставляют бинарные варианты `/think` (`off`, `on`) для этих форматов.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: необязательная подсказка совместимости для бэкендов Chat Completions в стиле DeepSeek, которым требуется сохранять `reasoning_content` в предыдущих сообщениях ассистента при повторном воспроизведении. Когда `true`, OpenClaw сохраняет это поле в исходящих сообщениях ассистента. Используйте это при подключении пользовательского прокси, совместимого с DeepSeek, который отклоняет запросы после удаления reasoning. По умолчанию `false`.

  </Accordion>
  <Accordion title="Обнаружение Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: корень настроек автообнаружения Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: включает/отключает неявное обнаружение.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: регион AWS для обнаружения.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необязательный фильтр provider-id для целевого обнаружения.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: интервал опроса для обновления обнаружения.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервное окно контекста для обнаруженных моделей.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервный максимум выходных токенов для обнаруженных моделей.

  </Accordion>
</AccordionGroup>

Интерактивная настройка пользовательского провайдера определяет ввод изображений для распространенных ID моделей со зрением, таких как GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V и GLM-4V, и пропускает дополнительный вопрос для известных семейств только с текстом. Неизвестные ID моделей по-прежнему вызывают запрос о поддержке изображений. Неинтерактивная настройка использует то же определение; передайте `--custom-image-input`, чтобы принудительно задать метаданные с поддержкой изображений, или `--custom-text-input`, чтобы принудительно задать метаданные только для текста.

### Примеры провайдеров

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Официальный внешний Plugin провайдера `cerebras` может настроить это через `openclaw onboard --auth-choice cerebras-api-key`. Используйте явную конфигурацию провайдера только при переопределении стандартных настроек.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Используйте `cerebras/zai-glm-4.7` для Cerebras; `zai/glm-4.7` для прямого Z.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Совместимый с Anthropic, встроенный провайдер. Короткий путь: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Локальные модели (LM Studio)">
    См. [Локальные модели](/ru/gateway/local-models). Кратко: запускайте большую локальную модель через LM Studio Responses API на серьезном оборудовании; оставляйте размещенные модели объединенными для резервного варианта.
  </Accordion>
  <Accordion title="MiniMax M3 (напрямую)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Задайте `MINIMAX_API_KEY`. Короткие пути: `openclaw onboard --auth-choice minimax-global-api` или `openclaw onboard --auth-choice minimax-cn-api`. Каталог моделей по умолчанию использует M3 и также включает варианты M2.7. На пути потоковой передачи, совместимом с Anthropic, OpenClaw по умолчанию отключает мышление MiniMax M2.x, если вы явно не зададите `thinking` самостоятельно; MiniMax-M3 (и M3.x) по умолчанию остается на пути опущенного/адаптивного мышления провайдера. `/fast on` или `params.fastMode: true` переписывает `MiniMax-M2.7` в `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Для конечной точки в Китае: `baseUrl: "https://api.moonshot.cn/v1"` или `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Нативные конечные точки Moonshot объявляют совместимость использования потоковой передачи на общем транспорте `openai-completions`, и OpenClaw опирается на возможности конечной точки, а не только на встроенный ID провайдера.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Задайте `OPENCODE_API_KEY` (или `OPENCODE_ZEN_API_KEY`). Используйте ссылки `opencode/...` для каталога Zen или ссылки `opencode-go/...` для каталога Go. Короткий путь: `openclaw onboard --auth-choice opencode-zen` или `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-совместимый)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    Базовый URL не должен включать `/v1` (клиент Anthropic добавляет его). Сокращение: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Укажите `ZAI_API_KEY`. Ссылки на модели используют канонический ID провайдера `zai/*`. Сокращение: `openclaw onboard --auth-choice zai-api-key`.

    - Общая конечная точка: `https://api.z.ai/api/paas/v4`
    - Конечная точка для кодирования (по умолчанию): `https://api.z.ai/api/coding/paas/v4`
    - Для общей конечной точки определите пользовательского провайдера с переопределением базового URL.

  </Accordion>
</AccordionGroup>

---

## Связанные материалы

- [Конфигурация — агенты](/ru/gateway/config-agents)
- [Конфигурация — каналы](/ru/gateway/config-channels)
- [Справочник конфигурации](/ru/gateway/configuration-reference) — другие ключи верхнего уровня
- [Инструменты и plugins](/ru/tools)
