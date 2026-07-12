---
read_when:
    - Настройка политики `tools.*`, списков разрешений или экспериментальных функций
    - Регистрация пользовательских провайдеров или переопределение базовых URL-адресов
    - Настройка самостоятельно размещённых конечных точек, совместимых с OpenAI
sidebarTitle: Tools and custom providers
summary: Настройка инструментов (политика, экспериментальные переключатели, инструменты на базе провайдеров) и пользовательская настройка провайдера/базового URL
title: Конфигурация — инструменты и пользовательские провайдеры
x-i18n:
    generated_at: "2026-07-12T11:22:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

Ключи конфигурации `tools.*` и настройка пользовательского провайдера / базового URL. Сведения об агентах, каналах и других ключах конфигурации верхнего уровня см. в [справочнике по конфигурации](/ru/gateway/configuration-reference).

## Инструменты

### Профили инструментов

`tools.profile` задаёт базовый список разрешённых инструментов до применения `tools.allow`/`tools.deny`:

<Note>
При локальной первоначальной настройке для новых локальных конфигураций по умолчанию задаётся `tools.profile: "coding"`, если значение не установлено (существующие явно заданные профили сохраняются).
</Note>

| Профиль     | Включает                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Только `session_status`                                                                                                                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Без ограничений (то же, что и без заданного значения)                                                                                                                                                                        |

`coding` и `messaging` также неявно разрешают `bundle-mcp` (настроенные серверы MCP).

### Группы инструментов

| Группа             | Инструменты                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` принимается как псевдоним для `exec`)                                                                      |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | Все перечисленные выше встроенные инструменты, кроме `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (инструменты плагинов не включены)   |
| `group:plugins`    | Инструменты загруженных плагинов, включая настроенные серверы MCP, предоставляемые через `bundle-mcp`                                                  |

`spawn_task` позволяет агенту программирования предложить подтверждаемую последующую работу, не начиная её. В интерфейсе управления заголовок и сводка отображаются в виде интерактивной плашки; TUI с подключением к Gateway показывает эквивалентное интерактивное приглашение. Принятие предложения создаёт новый сеанс в управляемом рабочем дереве и отправляет туда полный запрос, пока текущий ход продолжается. `dismiss_task` отзывает всё ещё ожидающее предложение по временному `task_id`, возвращённому из `spawn_task`.

Инструменты предлагаются только в том случае, если инициирующий операторский интерфейс способен получать и обрабатывать события Gateway с предложениями задач. Сеансы каналов и локальные/встроенные сеансы TUI их не получают; чтобы безопасно предоставлять этот процесс, транспортам каналов требуется переносимое типизированное действие задачи. Предложения существуют только в рамках процесса и исчезают при перезапуске Gateway. Оба инструмента остаются в профиле `coding` и группе `group:sessions`, поэтому обычные политики `tools.allow` и `tools.deny` автоматически настраивают их, если интерфейс их поддерживает.

### Инструменты MCP и плагинов в политике инструментов песочницы

Настроенные серверы MCP предоставляются как инструменты плагина с идентификатором `bundle-mcp`. Обычные профили инструментов могут разрешать их, но `tools.sandbox.tools` служит дополнительным уровнем контроля для сеансов в песочнице. Если режим песочницы — `"all"` или `"non-main"`, добавьте одну из следующих записей в список разрешённых инструментов песочницы, когда инструменты MCP/плагинов должны быть видимы:

- `bundle-mcp` для серверов MCP из `mcp.servers`, управляемых OpenClaw
- идентификатор плагина для конкретного нативного плагина
- `group:plugins` для всех инструментов загруженных плагинов
- точные имена инструментов сервера MCP или шаблоны серверов, например `outlook__send_mail` или `outlook__*`, если нужен только один сервер

Шаблоны серверов используют безопасный для провайдера префикс сервера MCP, который не обязательно совпадает с исходным ключом `mcp.servers`. Символы, не входящие в `[A-Za-z0-9_-]`, заменяются на `-`; имена, не начинающиеся с буквы, получают префикс `mcp-`; длинные или повторяющиеся префиксы могут быть усечены либо дополнены суффиксом. Например, для `mcp.servers["Outlook Graph"]` используется шаблон вида `outlook-graph__*`.

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

Без этой записи на уровне песочницы сервер MCP всё равно может успешно загрузиться, но его инструменты будут отфильтрованы до отправки запроса провайдеру. Используйте `openclaw doctor`, чтобы выявлять такую конфигурацию для серверов из `mcp.servers`, управляемых OpenClaw. Серверы MCP, загружаемые из манифестов встроенных плагинов или файла Claude `.mcp.json`, проходят через тот же уровень контроля песочницы, однако эта диагностика пока не перечисляет такие источники; если их инструменты исчезают в ходах, выполняемых в песочнице, используйте те же записи списка разрешений.

### `tools.codeMode`

`tools.codeMode` включает универсальный интерфейс режима кода OpenClaw. Когда он включён
для запуска с инструментами, обычные инструменты OpenClaw перемещаются за мост каталога `tools.*`,
работающий внутри песочницы, а инструменты MCP становятся доступны через созданное пространство имён `MCP`.
Обычно модель видит `exec` и `wait`; такие инструменты, как `computer`,
структурированные результаты которых невозможно передать через мост, поддерживающий только JSON, остаются доступными напрямую.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Также поддерживается сокращённая форма:

```json5
{
  tools: { codeMode: true },
}
```

В режиме кода объявления MCP предоставляются через виртуальный интерфейс файлов API, доступный
только для чтения. Гостевой код может вызывать `API.list("mcp")` и
`API.read("mcp/<server>.d.ts")`, чтобы изучить сигнатуры в стиле TypeScript перед
вызовом `MCP.<server>.<tool>()`. Контракт среды выполнения, ограничения и инструкции по отладке см. в разделе [Режим кода](/ru/reference/code-mode).

### `tools.allow` / `tools.deny`

Глобальная политика разрешения/запрета инструментов (запрет имеет приоритет). Регистр не учитывается, поддерживаются подстановочные знаки `*`. Применяется, даже когда песочница Docker отключена.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` и `apply_patch` — отдельные идентификаторы инструментов. `allow: ["write"]` также включает `apply_patch` для совместимых моделей, однако `deny: ["write"]` не запрещает `apply_patch`. Чтобы заблокировать любые изменения файлов, запретите `group:fs` или явно перечислите каждый инструмент, изменяющий файлы:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` и `alsoAllow` нельзя одновременно задавать в одной области (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) — проверка конфигурации отклонит её. Объедините записи `alsoAllow` с `allow` либо удалите `allow` и вместо него используйте `profile` + `alsoAllow`.
</Note>

### `tools.byProvider`

Дополнительно ограничивает инструменты для определённых провайдеров или моделей. Порядок: базовый профиль → профиль провайдера → разрешение/запрет.

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

Ограничивает инструменты для конкретного инициатора запроса. Это дополнительный уровень защиты поверх управления доступом к каналу; значения отправителя должны поступать от адаптера канала, а не из текста сообщения.

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

Ключи используют явные префиксы: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` или `"*"`. Идентификаторы каналов — канонические идентификаторы OpenClaw; псевдонимы, например `teams`, нормализуются в `msteams`. Устаревшие ключи без префикса принимаются только как `id:`. Порядок сопоставления: канал+идентификатор, идентификатор, e164, имя пользователя, отображаемое имя, затем подстановочный знак.

Настройка агента `agents.list[].tools.toolsBySender` переопределяет глобальное сопоставление отправителя при совпадении, даже если задана пустая политика `{}`.

### `tools.elevated`

Управляет расширенным доступом к выполнению команд вне песочницы:

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

- Переопределение для отдельного агента (`agents.list[].tools.elevated`) может только дополнительно ограничивать доступ.
- `/elevated on|off|ask|full` сохраняет состояние для каждого сеанса; встроенные директивы применяются к одному сообщению.
- Расширенный `exec` обходит песочницу и использует настроенный путь выхода (`gateway` по умолчанию или `node`, когда целевым окружением выполнения является `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

Показанные значения используются по умолчанию, кроме `applyPatch.allowModels` (по умолчанию список пуст или не задан, то есть любая совместимая модель может использовать `apply_patch`). `approvalRunningNoticeMs` выводит уведомление о продолжающемся выполнении, если команда `exec`, требующая подтверждения, выполняется долго; значение `0` отключает это уведомление.

### `tools.loopDetection`

Проверки безопасности от зацикливания инструментов **по умолчанию отключены**. Чтобы включить обнаружение, задайте `enabled: true`. Параметры можно определить глобально в `tools.loopDetection` и переопределить для отдельного агента в `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Максимальный объём истории вызовов инструментов, сохраняемой для анализа циклов.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Порог повторения шаблона без прогресса для выдачи предупреждений.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Блокирует повторные вызовы одного и того же недоступного или неизвестного инструмента после указанного количества неудач.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Более высокий порог повторений для блокировки критических циклов.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Порог принудительной остановки для любого выполнения без прогресса.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Предупреждать о повторных вызовах одного инструмента с одинаковыми аргументами.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Предупреждать или блокировать при использовании известных инструментов опроса (`process.poll`, `command_status` и т. д.) без прогресса.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Предупреждать или блокировать при чередующихся парных шаблонах без прогресса.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Количество попыток после автоматической Compaction, в течение которых защита остаётся активной; выполнение прерывается, если агент повторяет ту же комбинацию (инструмент, аргументы, результат) в пределах этого окна.
</ParamField>

<Warning>
Если `warningThreshold >= criticalThreshold` или `criticalThreshold >= globalCircuitBreakerThreshold`, проверка завершается ошибкой.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
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

Показаны значения по умолчанию, кроме `provider` и `userAgent`. Значение `maxResponseBytes` ограничивается диапазоном 32000–10000000; значение `maxChars` ограничивается значением `maxCharsCap` (увеличьте `maxCharsCap`, чтобы разрешить ответы большего размера).

### `tools.media`

Настраивает распознавание входящих медиафайлов (изображений, аудио и видео):

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

Значения `concurrency` (по умолчанию `2`), `audio.maxBytes` (по умолчанию 20 МБ) и `video.maxBytes` (по умолчанию 50 МБ) показаны со значениями по умолчанию; значение `image.maxBytes` по умолчанию составляет 10 МБ. Значения тайм-аута запроса по умолчанию для каждой возможности: `60` с для изображений и аудио, `120` с для видео.

<AccordionGroup>
  <Accordion title="Поля записи модели для обработки медиа">
    **Запись провайдера** (`type: "provider"` или не указано):

    - `provider`: идентификатор API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` и т. д.)
    - `model`: переопределение идентификатора модели
    - `profile` / `preferredProfile`: выбор профиля из `auth-profiles.json`

    **Запись CLI** (`type: "cli"`):

    - `command`: запускаемый исполняемый файл
    - `args`: шаблонизированные аргументы (поддерживаются `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` и т. д.; `openclaw doctor --fix` переносит устаревшие заполнители `{input}` в `{{MediaPath}}`)

    **Общие поля:**

    - `capabilities`: необязательный список (`image`, `audio`, `video`). Каждый Plugin провайдера объявляет собственный набор возможностей по умолчанию; например, встроенный провайдер `openai` по умолчанию поддерживает изображения и аудио, `anthropic`/`minimax` — изображения, `google` — изображения, аудио и видео, а `groq` — аудио.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: переопределения для отдельной записи.
    - `tools.media.image.timeoutSeconds` и соответствующие записи `timeoutSeconds` модели изображений также применяются, когда агент явно вызывает инструмент `image`. При распознавании изображений этот тайм-аут применяется к самому запросу и не сокращается из-за предшествующей подготовительной работы.
    - При сбое используется следующая запись.

    Аутентификация провайдера выполняется в стандартном порядке: `auth-profiles.json` → переменные окружения → `models.providers.*.apiKey`.

    **Поля асинхронного завершения:**

    - `asyncCompletion.directSend`: устаревший флаг совместимости. Завершённые асинхронные задачи обработки медиа остаются опосредованными сеансом инициатора, чтобы агент получил результат, решил, как сообщить его пользователю, и использовал инструмент сообщений, когда этого требует доставка в исходный канал.

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

Определяет, какие сеансы могут быть целевыми для инструментов сеансов (`sessions_list`, `sessions_history`, `sessions_send`).

По умолчанию: `tree` (текущий сеанс и созданные им сеансы, например сеансы субагентов).

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
    - `tree`: текущий сеанс и сеансы, созданные текущим сеансом (субагенты).
    - `agent`: любой сеанс, принадлежащий текущему идентификатору агента (может включать других пользователей, если для разных отправителей используются отдельные сеансы с одним идентификатором агента).
    - `all`: любой сеанс. Для обращения к другому агенту по-прежнему требуется `tools.agentToAgent`.
    - Ограничение песочницы: если текущий сеанс выполняется в песочнице и `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (значение по умолчанию), видимость принудительно устанавливается в `tree`, даже если задано `tools.sessions.visibility="all"`.
    - Если значение отличается от `all`, `sessions_list` включает компактное поле `visibility`,
      описывающее фактический режим, и предупреждение о том, что некоторые сеансы
      за пределами текущей области могут быть пропущены.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Настраивает поддержку вложений непосредственно в `sessions_spawn`.

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
    - Для вложений требуется `enabled: true`.
    - Вложения субагента размещаются в дочерней рабочей области по пути `.openclaw/attachments/<uuid>/` вместе с файлом `.manifest.json`.
    - Вложения ACP поддерживают только изображения и передаются непосредственно в среду выполнения ACP после проверки ограничений по количеству файлов, размеру отдельного файла и общему размеру.
    - Содержимое вложений автоматически удаляется из сохраняемой расшифровки.
    - Входные данные Base64 проходят строгую проверку алфавита и заполнения, а также проверку размера перед декодированием.
    - Права доступа к вложениям субагента: `0700` для каталогов и `0600` для файлов.
    - Очистка вложений субагента выполняется согласно политике `cleanup`: значение `delete` всегда удаляет вложения; при `keep` они сохраняются только в случае `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Экспериментальные флаги встроенных инструментов. По умолчанию отключены, если не применяется правило автоматического включения для GPT-5 со строгим агентным режимом.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: включает структурированный инструмент `update_plan` для отслеживания нетривиальной многоэтапной работы.
- По умолчанию: `false`, если только `agents.defaults.embeddedAgent.executionContract` (или переопределение для отдельного агента) не задано как `"strict-agentic"` для запуска провайдера `openai` с идентификатором модели семейства GPT-5 (это также охватывает запуски OpenAI Codex CLI, поскольку маршрутизация аутентификации и моделей Codex относится к провайдеру `openai`). Установите `true`, чтобы принудительно включить инструмент за пределами этой области, или `false`, чтобы оставить его отключённым даже для запусков GPT-5 со строгим агентным режимом.
- Когда инструмент включён, в системную инструкцию также добавляются рекомендации по использованию, чтобы модель применяла его только для существенной работы и поддерживала не более одного шага в состоянии `in_progress`.

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

- `model`: модель по умолчанию для создаваемых субагентов. Если не указана, субагенты наследуют модель вызывающего агента.
- `allowAgents`: список разрешённых по умолчанию идентификаторов настроенных целевых агентов для `sessions_spawn`, если запрашивающий агент не задал собственный `subagents.allowAgents` (`["*"]` = любой настроенный целевой агент; по умолчанию разрешён только тот же агент). Устаревшие записи, конфигурация агентов для которых была удалена, отклоняются `sessions_spawn` и не включаются в `agents_list`; выполните `openclaw doctor --fix`, чтобы удалить их.
- `maxConcurrent`: максимальное количество одновременно выполняемых субагентов. По умолчанию: `8`.
- `runTimeoutSeconds`: тайм-аут в секундах для `sessions_spawn`, если вызывающая сторона не передала собственное переопределение. По умолчанию: `0` (без тайм-аута); показанное выше значение `900` — распространённое явно задаваемое значение, а не встроенное значение по умолчанию.
- `announceTimeoutMs`: тайм-аут отдельной попытки доставки уведомления `agent` через Gateway в миллисекундах. По умолчанию: `120000`. Из-за повторных попыток при временных сбоях общее ожидание уведомления может превышать один настроенный тайм-аут.
- `archiveAfterMinutes`: количество минут после завершения сеанса субагента до его автоматического архивирования. По умолчанию: `60`; значение `0` отключает автоматическое архивирование.
- Политика инструментов для субагентов: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Пользовательские провайдеры и базовые URL-адреса

Plugin провайдеров публикуют собственные строки каталога моделей. Добавляйте пользовательских провайдеров через `models.providers` в конфигурации или в `~/.openclaw/agents/<agentId>/agent/models.json`.

Настройка `baseUrl` пользовательского или локального провайдера также является узким решением о сетевом доверии для HTTP-запросов к модели: OpenClaw разрешает точный источник `scheme://host:port` через защищённый путь получения данных без добавления отдельного параметра конфигурации и без доверия к другим частным источникам.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
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
    - Для нестандартных требований к аутентификации используйте `authHeader: true` + `headers`.
    - Переопределите корневой каталог конфигурации агента с помощью `OPENCLAW_AGENT_DIR`.
    - Приоритет слияния для совпадающих идентификаторов провайдеров:
      - Непустые значения `baseUrl` в файле агента `models.json` имеют приоритет.
      - Непустые значения `apiKey` агента имеют приоритет, только если в текущем контексте конфигурации или профиля аутентификации этот провайдер не управляется через SecretRef.
      - Значения `apiKey` провайдера, управляемые через SecretRef, обновляются из маркеров источника (`ENV_VAR_NAME` для ссылок на переменные окружения, `secretref-managed` для ссылок на файл или команду) вместо сохранения разрешённых секретов.
      - Значения заголовков провайдера, управляемые через SecretRef, обновляются из маркеров источника (`secretref-env:ENV_VAR_NAME` для ссылок на переменные окружения, `secretref-managed` для ссылок на файл или команду).
      - При пустых или отсутствующих `apiKey`/`baseUrl` агента используются резервные значения из `models.providers` в конфигурации.
      - Для совпадающей модели и полей `contextWindow`/`maxTokens`: явно заданное значение конфигурации имеет приоритет, если оно присутствует и допустимо (положительное конечное число); иначе используется неявное или сгенерированное значение каталога.
      - Для совпадающей модели поле `contextTokens` подчиняется тому же правилу «явное значение имеет приоритет, иначе используется неявное»; используйте его, чтобы ограничить эффективный контекст без изменения собственных метаданных модели.
      - Каталоги Plugin провайдеров хранятся в виде сгенерированных фрагментов каталога, принадлежащих Plugin, в состоянии Plugin агента.
      - Используйте `models.mode: "replace"`, если требуется, чтобы конфигурация полностью перезаписывала `models.json` без слияния с фрагментами каталога, принадлежащими Plugin.
      - Сохранение маркеров определяется источником: маркеры записываются из активного снимка исходной конфигурации (до разрешения), а не из разрешённых значений секретов среды выполнения.

  </Accordion>
</AccordionGroup>

### Сведения о полях провайдера

<AccordionGroup>
  <Accordion title="Каталог верхнего уровня">
    - `models.mode`: режим работы каталога провайдеров (`merge` или `replace`).
    - `models.providers`: карта пользовательских провайдеров с ключами по идентификатору провайдера.
      - Безопасное редактирование: для добавочных обновлений используйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` или `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`. Команда `config set` отклоняет деструктивные замены, если не передан флаг `--replace`.

  </Accordion>
  <Accordion title="Подключение к провайдеру и аутентификация">
    - `models.providers.*.api`: адаптер запросов (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Для самостоятельно размещённых серверных частей `/v1/chat/completions`, таких как MLX, vLLM, SGLang и большинство локальных серверов, совместимых с OpenAI, используйте `openai-completions`. Для пользовательского провайдера с `baseUrl`, но без `api`, по умолчанию используется `openai-completions`; задавайте `openai-responses` только в том случае, если серверная часть поддерживает `/v1/responses`.
    - `models.providers.*.apiKey`: учётные данные провайдера (предпочтительно использовать SecretRef или подстановку из переменной окружения).
    - `models.providers.*.auth`: стратегия аутентификации (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: собственное окно контекста по умолчанию для моделей этого провайдера, если в записи модели не задано `contextWindow`.
    - `models.providers.*.contextTokens`: эффективный предел контекста среды выполнения по умолчанию для моделей этого провайдера, если в записи модели не задано `contextTokens`.
    - `models.providers.*.maxTokens`: предел выходных токенов по умолчанию для моделей этого провайдера, если в записи модели не задано `maxTokens`.
    - `models.providers.*.timeoutSeconds`: необязательный тайм-аут HTTP-запроса к модели для каждого провайдера в секундах, включая подключение, заголовки, тело и обработку прерывания всего запроса.
    - `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` добавлять `options.num_ctx` в запросы (по умолчанию: `true`).
    - `models.providers.*.authHeader`: при необходимости принудительно передавать учётные данные в заголовке `Authorization`.
    - `models.providers.*.baseUrl`: базовый URL вышестоящего API.
    - `models.providers.*.headers`: дополнительные статические заголовки для маршрутизации через прокси или арендатора.

  </Accordion>
  <Accordion title="Переопределения транспорта запросов">
    `models.providers.*.request`: переопределения транспорта для HTTP-запросов к провайдеру модели.

    - `request.headers`: дополнительные заголовки (объединяются со значениями провайдера по умолчанию). Значения поддерживают SecretRef.
    - `request.auth`: переопределение стратегии аутентификации. Режимы: `"provider-default"` (использовать встроенную аутентификацию провайдера), `"authorization-bearer"` (с `token`), `"header"` (с `headerName`, `value` и необязательным `prefix`).
    - `request.proxy`: переопределение HTTP-прокси. Режимы: `"env-proxy"` (использовать переменные окружения `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (с `url`). Оба режима поддерживают необязательный вложенный объект `tls`.
    - `request.tls`: переопределение TLS для прямых подключений. Поля: `ca`, `cert`, `key`, `passphrase` (все поддерживают SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: если задано `true`, разрешает HTTP-запросы к провайдеру модели в частные диапазоны, диапазоны CGNAT и аналогичные сети через защитный механизм HTTP-запросов провайдера. Для базовых URL пользовательских или локальных провайдеров точный настроенный источник уже считается доверенным, за исключением источников метаданных и локальной сети канального уровня, которые остаются заблокированными без явного согласия. Задайте `false`, чтобы отказаться от доверия к точному источнику. WebSocket использует тот же объект `request` для заголовков и TLS, но не этот барьер SSRF для запросов. По умолчанию: `false`.

  </Accordion>
  <Accordion title="Записи каталога моделей">
    - `models.providers.*.models`: явно заданные записи каталога моделей провайдера.
    - `models.providers.*.models.*.input`: модальности входных данных модели. Используйте `["text"]` для моделей только с текстовым вводом и `["text", "image"]` для моделей с собственной поддержкой изображений или компьютерного зрения. Вложения с изображениями добавляются в ходы агента только в том случае, если выбранная модель отмечена как поддерживающая изображения.
    - `models.providers.*.models.*.contextWindow`: метаданные собственного окна контекста модели. Это значение переопределяет `contextWindow` уровня провайдера для данной модели.
    - `models.providers.*.models.*.contextTokens`: необязательный предел контекста среды выполнения. Это значение переопределяет `contextTokens` уровня провайдера; используйте его, если требуется меньший эффективный бюджет контекста, чем собственное `contextWindow` модели; команда `openclaw models list` отображает оба значения, когда они различаются.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: необязательная подсказка совместимости. Для `api: "openai-completions"` с непустым нестандартным `baseUrl` (узел не `api.openai.com`) OpenClaw принудительно задаёт во время выполнения значение `false`. Пустой или отсутствующий `baseUrl` сохраняет стандартное поведение OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: необязательная подсказка совместимости для конечных точек чата, совместимых с OpenAI и принимающих только строки. Если задано `true`, OpenClaw преобразует массивы `messages[].content`, содержащие только текст, в обычные строки перед отправкой запроса.
    - `models.providers.*.models.*.compat.strictMessageKeys`: необязательная подсказка совместимости для строгих конечных точек чата, совместимых с OpenAI. Если задано `true`, перед отправкой запроса OpenClaw оставляет в исходящих объектах сообщений Chat Completions только `role` и `content`.
    - `models.providers.*.models.*.compat.thinkingFormat`: необязательная подсказка о формате полезной нагрузки рассуждений. Используйте `"together"` для `reasoning.enabled` в стиле Together, `"qwen"` для верхнеуровневого `enable_thinking` или `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на совместимых с OpenAI серверах семейства Qwen, поддерживающих параметры шаблона чата на уровне запроса, например vLLM. Настроенные модели Qwen в vLLM предоставляют для этих форматов двоичные варианты `/think` (`off`, `on`).
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: необязательная подсказка совместимости для серверных частей Chat Completions в стиле DeepSeek, которым при повторном воспроизведении требуется сохранять `reasoning_content` в предыдущих сообщениях ассистента. Если задано `true`, OpenClaw сохраняет это поле в исходящих сообщениях ассистента. Используйте это при подключении пользовательского прокси, совместимого с DeepSeek, который отклоняет запросы после удаления рассуждений. По умолчанию: `false`.

  </Accordion>
  <Accordion title="Обнаружение Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: корневой раздел настроек автоматического обнаружения Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: включает или отключает неявное обнаружение.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: регион AWS для обнаружения.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необязательный фильтр по идентификатору провайдера для целевого обнаружения.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: интервал опроса для обновления результатов обнаружения.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервное окно контекста для обнаруженных моделей.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервный максимальный объём выходных токенов для обнаруженных моделей.

  </Accordion>
</AccordionGroup>

Интерактивная первоначальная настройка пользовательского провайдера определяет поддержку изображений по известным шаблонам идентификаторов моделей компьютерного зрения, включая GPT-4o/GPT-4.1/GPT-5+, семейства моделей рассуждений `o1`/`o3`/`o4`, Claude, Gemini, любой идентификатор с суффиксом `-vl` (Qwen-VL и аналогичные), а также именованные семейства, такие как LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V и GLM-4V; для известных семейств, работающих только с текстом (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama и идентификаторы Qwen без суффикса vl/vision), дополнительный вопрос пропускается. Для неизвестных идентификаторов моделей запрос о поддержке изображений по-прежнему отображается. Неинтерактивная первоначальная настройка использует то же определение; передайте `--custom-image-input`, чтобы принудительно задать метаданные с поддержкой изображений, или `--custom-text-input`, чтобы принудительно задать метаданные только с текстовым вводом.

### Примеры провайдеров

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Официальный внешний Plugin провайдера `cerebras` позволяет настроить это с помощью `openclaw onboard --auth-choice cerebras-api-key`. Используйте явную конфигурацию провайдера только для переопределения значений по умолчанию.

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

    Для Cerebras используйте `cerebras/zai-glm-4.7`; для прямого подключения к Z.AI — `zai/glm-4.7`.

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

    Встроенный провайдер, совместимый с Anthropic. Быстрый способ: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Локальные модели (LM Studio)">
    См. [Локальные модели](/ru/gateway/local-models). Кратко: запускайте крупную локальную модель через Responses API LM Studio на мощном оборудовании; не удаляйте облачные модели, чтобы использовать их как резервные.
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

    Задайте `MINIMAX_API_KEY`. Сокращённые варианты: `openclaw onboard --auth-choice minimax-global-api` или `openclaw onboard --auth-choice minimax-cn-api`. В каталоге моделей по умолчанию используется M3; также в него входят варианты M2.7. При потоковой передаче через Anthropic-совместимый интерфейс OpenClaw по умолчанию отключает рассуждения MiniMax M2.x, если вы явно не зададите `thinking` самостоятельно; для MiniMax-M3 (и M3.x) по умолчанию сохраняется режим рассуждений провайдера с пропущенным или адаптивным параметром. `/fast on` или `params.fastMode: true` заменяет `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

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

    Для китайской конечной точки используйте `baseUrl: "https://api.moonshot.cn/v1"` или `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Нативные конечные точки Moonshot заявляют о совместимости с передачей данных об использовании в потоковом режиме через общий транспорт `openai-completions`, и OpenClaw определяет это по возможностям конечной точки, а не только по встроенному идентификатору провайдера.

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

    Задайте `OPENCODE_API_KEY` (или `OPENCODE_ZEN_API_KEY`). Используйте ссылки `opencode/...` для каталога Zen или `opencode-go/...` для каталога Go. Сокращённый вариант: `openclaw onboard --auth-choice opencode-zen` или `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (совместимый с Anthropic)">
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

    В базовом URL не должно быть `/v1` (клиент Anthropic добавляет его сам). Сокращённый вариант: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Задайте `ZAI_API_KEY`. В ссылках на модели используется канонический идентификатор провайдера `zai/*`. Сокращённый вариант: `openclaw onboard --auth-choice zai-api-key`.

    - Общая конечная точка: `https://api.z.ai/api/paas/v4`
    - Конечная точка для программирования: `https://api.z.ai/api/coding/paas/v4`
    - При выборе способа аутентификации `zai-api-key` по умолчанию выполняется проверка ключа и автоматически определяется, к какой конечной точке он относится. Если результат неоднозначен, появится запрос с вариантом Global по умолчанию. Для явного выбора также доступны отдельные способы аутентификации для CN и Coding-Plan.
    - Для общей конечной точки определите собственного провайдера с переопределённым базовым URL.

  </Accordion>
</AccordionGroup>

---

## Связанные разделы

- [Конфигурация — агенты](/ru/gateway/config-agents)
- [Конфигурация — каналы](/ru/gateway/config-channels)
- [Справочник по конфигурации](/ru/gateway/configuration-reference) — другие ключи верхнего уровня
- [Инструменты и плагины](/ru/tools)
