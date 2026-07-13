---
read_when:
    - Настройка политики `tools.*`, списков разрешений или экспериментальных функций
    - Регистрация пользовательских провайдеров или переопределение базовых URL-адресов
    - Настройка самостоятельно размещённых конечных точек, совместимых с OpenAI
sidebarTitle: Tools and custom providers
summary: Настройка инструментов (политика, экспериментальные переключатели, инструменты на базе провайдеров) и пользовательских провайдеров/базовых URL-адресов
title: Конфигурация — инструменты и пользовательские провайдеры
x-i18n:
    generated_at: "2026-07-13T19:46:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` — ключи конфигурации и настройка пользовательского провайдера / базового URL. О ключах верхнего уровня для агентов, каналов и других компонентов см. в [справочнике по конфигурации](/ru/gateway/configuration-reference).

## Инструменты

### Профили инструментов

`tools.profile` задаёт базовый список разрешений перед `tools.allow`/`tools.deny`:

<Note>
При локальной первоначальной настройке для новых локальных конфигураций по умолчанию используется `tools.profile: "coding"`, если значение не задано (существующие явно заданные профили сохраняются).
</Note>

| Профиль     | Включает                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | только `session_status`                                                                                                                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Без ограничений (то же, что и при отсутствии значения)                                                                                                                                                                                               |

`coding` и `messaging` также неявно разрешают `bundle-mcp` (настроенные серверы MCP).

### Группы инструментов

| Группа              | Инструменты                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` принимается как псевдоним для `exec`)                                                                       |
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
| `group:openclaw`   | Все перечисленные выше встроенные инструменты, кроме `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (инструменты плагинов исключены)                                 |
| `group:plugins`    | Инструменты, принадлежащие загруженным плагинам, включая настроенные серверы MCP, предоставленные через `bundle-mcp`                                                          |

`spawn_task` позволяет агенту программирования предложить подтверждаемую последующую работу, не начиная её. Control UI отображает заголовок и сводку в виде интерактивной плашки; TUI, работающий через Gateway, показывает эквивалентный интерактивный запрос. Принятие предложения в любом из интерфейсов создаёт новый сеанс с управляемым рабочим деревом и отправляет туда полный запрос, пока текущий ход продолжается. `dismiss_task` отзывает ещё не принятое предложение по эфемерному `task_id`, возвращённому из `spawn_task`.

Инструменты предоставляются только тогда, когда операторский интерфейс, инициирующий работу, может получать и обрабатывать события предложений задач Gateway. Сеансы каналов и локальные/встроенные сеансы TUI их не получают; чтобы безопасно поддерживать этот процесс, транспорту канала требуется переносимое типизированное действие задачи. Предложения локальны для процесса и исчезают при перезапуске Gateway. Оба инструмента остаются в профиле `coding` и `group:sessions`, поэтому стандартная политика `tools.allow` и `tools.deny` настраивает их автоматически, если интерфейс их поддерживает.

### Инструменты MCP и плагинов в политике инструментов песочницы

Настроенные серверы MCP предоставляются как инструменты плагина с идентификатором `bundle-mcp`. Обычные профили инструментов могут разрешать их, но для сеансов в песочнице `tools.sandbox.tools` служит дополнительным ограничителем. Если режим песочницы — `"all"` или `"non-main"`, добавьте одну из следующих записей в список разрешённых инструментов песочницы, чтобы инструменты MCP/плагинов были доступны:

- `bundle-mcp` для серверов MCP под управлением OpenClaw из `mcp.servers`
- идентификатор конкретного нативного плагина
- `group:plugins` для всех инструментов, принадлежащих загруженным плагинам
- точные имена инструментов сервера MCP или шаблоны серверов, например `outlook__send_mail` или `outlook__*`, если нужен только один сервер

В шаблонах серверов используется безопасный для провайдера префикс сервера MCP, который не обязательно совпадает с исходным ключом `mcp.servers`. Символы, не соответствующие `[A-Za-z0-9_-]`, заменяются на `-`; к именам, которые не начинаются с буквы, добавляется префикс `mcp-`; длинные или повторяющиеся префиксы могут быть сокращены или дополнены суффиксом. Например, для `mcp.servers["Outlook Graph"]` используется шаблон вида `outlook-graph__*`.

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

Без этой записи на уровне песочницы сервер MCP всё равно может успешно загрузиться, но его инструменты будут отфильтрованы до отправки запроса провайдеру. Используйте `openclaw doctor`, чтобы выявлять такую конфигурацию для серверов под управлением OpenClaw в `mcp.servers`. Серверы MCP, загруженные из манифестов встроенных плагинов или Claude `.mcp.json`, проходят через тот же ограничитель песочницы, однако эта диагностика пока не перечисляет такие источники. Если их инструменты исчезают в ходах, выполняемых в песочнице, используйте те же записи списка разрешений.

### `tools.codeMode`

`tools.codeMode` включает универсальный интерфейс режима кода OpenClaw. Когда он включён
для запуска с инструментами, обычные инструменты OpenClaw перемещаются за внутрипесочничный
мост каталога `tools.*`, а инструменты MCP становятся доступны через созданное
пространство имён `MCP`. Обычно модель видит `exec` и `wait`;
такие инструменты, как `computer`, структурированные результаты которых нельзя передать
через мост, поддерживающий только JSON, остаются непосредственными.

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

В режиме кода объявления MCP предоставляются через виртуальный файловый интерфейс API,
доступный только для чтения. Гостевой код может вызывать `API.list("mcp")` и
`API.read("mcp/<server>.d.ts")`, чтобы просматривать сигнатуры в стиле TypeScript перед
вызовом `MCP.<server>.<tool>()`. Контракт среды выполнения, ограничения и порядок отладки
описаны в разделе [Режим кода](/ru/reference/code-mode).

### `tools.allow` / `tools.deny`

Глобальная политика разрешения/запрета инструментов (запрет имеет приоритет). Регистр не учитывается, поддерживаются подстановочные знаки `*`. Применяется, даже если песочница Docker отключена.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` и `apply_patch` — разные идентификаторы инструментов. `allow: ["write"]` также включает `apply_patch` для совместимых моделей, но `deny: ["write"]` не запрещает `apply_patch`. Чтобы заблокировать все изменения файлов, запретите `group:fs` или явно перечислите каждый инструмент, изменяющий файлы:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` и `alsoAllow` нельзя одновременно задать в одной области (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) — проверка конфигурации отклонит её. Объедините записи `alsoAllow` с `allow` либо удалите `allow` и вместо него используйте `profile` + `alsoAllow`.
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

Ограничивает инструменты для конкретной идентификационной сущности отправителя запроса. Это дополнительный уровень защиты поверх контроля доступа к каналу; значения отправителя должны поступать от адаптера канала, а не из текста сообщения.

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

В ключах используются явные префиксы: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` или `"*"`. Идентификаторы каналов представляют собой канонические идентификаторы OpenClaw; такие псевдонимы, как `teams`, нормализуются в `msteams`. Устаревшие ключи без префикса принимаются только как `id:`. Порядок сопоставления: канал+идентификатор, идентификатор, e164, имя пользователя, имя, затем подстановочный знак.

Значение `agents.list[].tools.toolsBySender` для конкретного агента переопределяет глобальное сопоставление отправителя при совпадении, даже если политика `{}` пуста.

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

- Переопределение для отдельного агента (`agents.list[].tools.elevated`) может только дополнительно ограничивать.
- `/elevated on|off|ask|full` хранит состояние отдельно для каждого сеанса; встроенные директивы применяются к одному сообщению.
- Повышенный режим `exec` обходит песочницу и использует настроенный путь выхода (`gateway` по умолчанию или `node`, когда целью выполнения является `node`).

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

Показаны значения по умолчанию, кроме `applyPatch.allowModels` (по умолчанию пусто/не задано, то есть `apply_patch` может использовать любая совместимая модель). `approvalRunningNoticeMs` выводит уведомление о продолжающемся выполнении, если выполнение с подтверждением занимает много времени; `0` отключает его.

### `tools.loopDetection`

Проверки безопасности цикла инструментов **по умолчанию отключены**. Чтобы включить обнаружение, задайте `enabled: true`. Параметры можно определить глобально в `tools.loopDetection` и переопределить для отдельного агента в `agents.list[].tools.loopDetection`.

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
  Максимальное количество вызовов инструментов в истории, сохраняемой для анализа циклов.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Порог повторяющегося шаблона без прогресса для выдачи предупреждений.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  После указанного количества неудач блокирует повторные вызовы инструмента с тем же недоступным или неизвестным именем.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Повышенный порог повторений для блокировки критических циклов.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Порог полной остановки любого выполнения без прогресса.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Предупреждать о повторных вызовах того же инструмента с теми же аргументами.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Предупреждать или блокировать известные инструменты опроса (`process.poll`, `command_status` и т. д.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Предупреждать или блокировать чередующиеся парные шаблоны без прогресса.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Количество попыток после автоматической Compaction, в течение которых защита остаётся активной; выполнение прерывается, если агент повторяет ту же комбинацию (инструмент, аргументы, результат) в пределах этого окна.
</ParamField>

<Warning>
Если `warningThreshold >= criticalThreshold` или `criticalThreshold >= globalCircuitBreakerThreshold`, проверка завершается с ошибкой.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // или переменная окружения BRAVE_API_KEY (провайдер Brave)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // необязательно; не указывайте для автоматического определения
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
        directSend: false, // устарело: завершённые задачи по-прежнему обрабатываются через агента
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

`concurrency` (по умолчанию `2`), `audio.maxBytes` (по умолчанию 20 MB) и `video.maxBytes` (по умолчанию 50 MB) показаны со значениями по умолчанию; значение `image.maxBytes` по умолчанию равно 10 MB. Тайм-ауты запросов по умолчанию для отдельных возможностей: изображения и аудио — `60` с, видео — `120` с.

<AccordionGroup>
  <Accordion title="Поля записи модели для медиафайлов">
    **Запись провайдера** (`type: "provider"` или не указано):

    - `provider`: идентификатор API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` и т. д.)
    - `model`: переопределение идентификатора модели
    - `profile` / `preferredProfile`: выбор профиля `auth-profiles.json`

    **Запись CLI** (`type: "cli"`):

    - `command`: запускаемый исполняемый файл
    - `args`: шаблонизированные аргументы (поддерживаются `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` и т. д.; `openclaw doctor --fix` переносит устаревшие заполнители `{input}` в `{{MediaPath}}`)

    **Общие поля:**

    - `capabilities`: необязательный список (`image`, `audio`, `video`). Каждый плагин провайдера объявляет собственный набор возможностей по умолчанию; например, встроенный провайдер `openai` по умолчанию поддерживает изображения и аудио, `anthropic`/`minimax` — изображения, `google` — изображения, аудио и видео, а `groq` — аудио.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: переопределения для отдельных записей.
    - `tools.media.image.timeoutSeconds` и соответствующие записи `timeoutSeconds` модели изображений также применяются, когда агент явно вызывает инструмент `image`. При распознавании изображений этот тайм-аут применяется к самому запросу и не сокращается из-за ранее выполненной подготовительной работы.
    - При сбоях используется следующая запись.

    Аутентификация провайдера выполняется в стандартном порядке: `auth-profiles.json` → переменные окружения → `models.providers.*.apiKey`.

    **Поля асинхронного завершения:**

    - `asyncCompletion.directSend`: устаревший флаг совместимости. Завершённые асинхронные задачи обработки медиафайлов передаются через сеанс запрашивающей стороны, чтобы агент получил результат, решил, как сообщить его пользователю, и использовал инструмент сообщений, когда этого требует доставка в источник.

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

Определяет, к каким сеансам могут обращаться инструменты сеансов (`sessions_list`, `sessions_history`, `sessions_send`).

По умолчанию: `tree` (текущий сеанс и созданные им сеансы, например субагенты).

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
    - `tree`: текущий сеанс и созданные им сеансы (субагенты).
    - `agent`: любой сеанс, принадлежащий текущему идентификатору агента (может включать других пользователей, если сеансы отдельных отправителей выполняются с одним идентификатором агента).
    - `all`: любой сеанс. Для обращения к другому агенту по-прежнему требуется `tools.agentToAgent`.
    - Ограничение песочницы: если текущий сеанс выполняется в песочнице и `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (значение по умолчанию), видимость принудительно устанавливается в `tree`, даже если `tools.sessions.visibility="all"`.
    - Если значение не равно `all`, `sessions_list` содержит компактное поле `visibility`,
      описывающее фактический режим и предупреждающее, что некоторые сеансы
      за пределами текущей области могут быть опущены.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Управляет поддержкой встроенных вложений для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // требуется явное включение: задайте true, чтобы разрешить встроенные файловые вложения
        maxTotalBytes: 5242880, // всего 5 MB для всех файлов
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB на файл
        retainOnSessionKeep: false, // сохранять вложения при cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Примечания о вложениях">
    - Для вложений требуется `enabled: true`.
    - Вложения субагента размещаются в дочернем рабочем пространстве по пути `.openclaw/attachments/<uuid>/` вместе с `.manifest.json`.
    - Вложения ACP могут содержать только изображения и передаются встроенными в среду выполнения ACP после проверки тех же ограничений на количество файлов, размер отдельного файла и общий размер.
    - Содержимое вложений автоматически редактируется при сохранении расшифровки.
    - Входные данные Base64 проверяются на строгое соответствие алфавиту и заполнению, а также на размер до декодирования.
    - Для каталогов вложений субагента устанавливаются разрешения `0700`, а для файлов — `0600`.
    - Очистка субагента выполняется согласно политике `cleanup`: `delete` всегда удаляет вложения; `keep` сохраняет их только при `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Экспериментальные флаги встроенных инструментов. По умолчанию отключены, если не применяется правило автоматического включения для GPT-5 в строгом агентном режиме.

```json5
{
  tools: {
    experimental: {
      planTool: true, // включить экспериментальный update_plan
    },
  },
}
```

- `planTool`: включает структурированный инструмент `update_plan` для отслеживания нетривиальной многоэтапной работы.
- По умолчанию: `false`, если только `agents.defaults.embeddedAgent.executionContract` (или переопределение для отдельного агента) не задано как `"strict-agentic"` для выполнения через провайдера `openai` с идентификатором модели семейства GPT-5 (это также относится к запускам OpenAI Codex CLI, поскольку маршрутизация аутентификации и моделей Codex выполняется через провайдера `openai`). Задайте `true`, чтобы принудительно включить инструмент вне этой области, или `false`, чтобы оставить его отключённым даже для запусков GPT-5 в строгом агентном режиме.
- Когда инструмент включён, в системную подсказку также добавляются рекомендации по использованию, чтобы модель применяла его только для существенной работы и поддерживала не более одного шага `in_progress`.

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

- `model`: модель по умолчанию для создаваемых субагентов. Если параметр не указан, субагенты наследуют модель вызывающего агента.
- `allowAgents`: список разрешённых по умолчанию идентификаторов настроенных целевых агентов для `sessions_spawn`, когда запрашивающий агент не задаёт собственный `subagents.allowAgents` (`["*"]` = любой настроенный целевой агент; по умолчанию: только тот же агент). Устаревшие записи, конфигурация агента для которых была удалена, отклоняются командой `sessions_spawn` и не включаются в вывод `agents_list`; выполните `openclaw doctor --fix`, чтобы удалить их.
- `maxConcurrent`: максимальное количество одновременно выполняющихся субагентов. По умолчанию: `8`.
- `runTimeoutSeconds`: тайм-аут (в секундах) для `sessions_spawn`, когда вызывающая сторона не передаёт собственное переопределение. По умолчанию: `0` (без тайм-аута); указанное выше значение `900` часто задаётся явно, но не является встроенным значением по умолчанию.
- `announceTimeoutMs`: тайм-аут каждого вызова (в миллисекундах) для попыток доставки объявления `agent` через Gateway. По умолчанию: `120000`. Из-за повторных попыток после временных сбоев общее ожидание объявления может превышать один настроенный тайм-аут.
- `archiveAfterMinutes`: количество минут после завершения сеанса субагента до его автоматического архивирования. По умолчанию: `60`; `0` отключает автоматическое архивирование.
- Политика инструментов для каждого субагента: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Пользовательские провайдеры и базовые URL-адреса

Плагины провайдеров публикуют собственные строки каталога моделей. Добавляйте пользовательских провайдеров через `models.providers` в конфигурации или `~/.openclaw/agents/<agentId>/agent/models.json`.

Настройка `baseUrl` пользовательского или локального провайдера также является узким решением о сетевом доверии для HTTP-запросов к моделям: OpenClaw разрешает именно источник `scheme://host:port` через защищённый путь получения данных, не добавляя отдельный параметр конфигурации и не доверяя другим частным источникам.

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
  <Accordion title="Аутентификация и приоритет объединения">
    - Для нестандартных требований к аутентификации используйте `authHeader: true` + `headers`.
    - Переопределите корневой каталог конфигурации агента с помощью `OPENCLAW_AGENT_DIR`.
    - Приоритет объединения для совпадающих идентификаторов провайдеров:
      - Непустые значения `baseUrl` в `models.json` агента имеют приоритет.
      - Непустые значения `apiKey` агента имеют приоритет, только если этот провайдер не управляется через SecretRef в текущем контексте конфигурации или профиля аутентификации.
      - Значения `apiKey` провайдера, управляемого через SecretRef, обновляются из маркеров источника (`ENV_VAR_NAME` для ссылок на переменные среды, `secretref-managed` для ссылок на файл или команду) вместо сохранения разрешённых секретов.
      - Значения заголовков провайдера, управляемого через SecretRef, обновляются из маркеров источника (`secretref-env:ENV_VAR_NAME` для ссылок на переменные среды, `secretref-managed` для ссылок на файл или команду).
      - Пустые или отсутствующие значения `apiKey`/`baseUrl` агента заменяются значениями `models.providers` из конфигурации.
      - Для совпадающих значений `contextWindow`/`maxTokens` модели явное значение конфигурации имеет приоритет, если оно задано и допустимо (положительное конечное число); в противном случае используется неявное или сгенерированное значение каталога.
      - Совпадающее значение `contextTokens` подчиняется тому же правилу «явное значение имеет приоритет, иначе используется неявное»; используйте его для ограничения эффективного контекста без изменения собственных метаданных модели.
      - Каталоги плагинов провайдеров хранятся в виде сгенерированных фрагментов каталога, принадлежащих плагинам, в состоянии плагинов агента.
      - Используйте `models.mode: "replace"`, если требуется, чтобы конфигурация полностью перезаписывала `models.json` без объединения с фрагментами каталога, принадлежащими плагинам.
      - Сохранение маркеров подчиняется источнику: маркеры записываются из активного снимка исходной конфигурации (до разрешения), а не из разрешённых значений секретов среды выполнения.

  </Accordion>
</AccordionGroup>

### Сведения о полях провайдера

<AccordionGroup>
  <Accordion title="Каталог верхнего уровня">
    - `models.mode`: режим работы каталога провайдеров (`merge` или `replace`).
    - `models.providers`: карта пользовательских провайдеров с идентификатором провайдера в качестве ключа.
      - Безопасное редактирование: для добавочных обновлений используйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` или `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`. `config set` отклоняет замены с удалением данных, если не передан `--replace`.

  </Accordion>
  <Accordion title="Подключение и аутентификация провайдера">
    - `models.providers.*.api`: адаптер запросов (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Для самостоятельно размещённых серверных систем `/v1/chat/completions`, таких как MLX, vLLM, SGLang и большинство локальных серверов, совместимых с OpenAI, используйте `openai-completions`. Для пользовательского провайдера с `baseUrl`, но без `api`, по умолчанию используется `openai-completions`; задавайте `openai-responses`, только если серверная система поддерживает `/v1/responses`.
    - `models.providers.*.apiKey`: учётные данные провайдера (предпочтительно использовать SecretRef или подстановку переменной среды).
    - `models.providers.*.auth`: стратегия аутентификации (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: собственный размер окна контекста по умолчанию для моделей этого провайдера, если в записи модели не задано `contextWindow`.
    - `models.providers.*.contextTokens`: эффективное ограничение контекста среды выполнения по умолчанию для моделей этого провайдера, если в записи модели не задано `contextTokens`.
    - `models.providers.*.maxTokens`: ограничение количества выходных токенов по умолчанию для моделей этого провайдера, если в записи модели не задано `maxTokens`.
    - `models.providers.*.timeoutSeconds`: необязательный тайм-аут HTTP-запроса к модели для каждого провайдера в секундах, включая подключение, заголовки, тело и обработку полного прерывания запроса.
    - `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` добавлять `options.num_ctx` в запросы (по умолчанию: `true`).
    - `models.providers.*.authHeader`: принудительно передавать учётные данные в заголовке `Authorization`, когда это требуется.
    - `models.providers.*.baseUrl`: базовый URL-адрес вышестоящего API.
    - `models.providers.*.headers`: дополнительные статические заголовки для маршрутизации через прокси или по арендаторам.

  </Accordion>
  <Accordion title="Переопределения транспорта запросов">
    `models.providers.*.request`: переопределения транспорта для HTTP-запросов к провайдеру моделей.

    - `request.headers`: дополнительные заголовки (объединяются со значениями провайдера по умолчанию). Значения поддерживают SecretRef.
    - `request.auth`: переопределение стратегии аутентификации. Режимы: `"provider-default"` (использовать встроенную аутентификацию провайдера), `"authorization-bearer"` (с `token`), `"header"` (с `headerName`, `value` и необязательным `prefix`).
    - `request.proxy`: переопределение HTTP-прокси. Режимы: `"env-proxy"` (использовать переменные среды `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (с `url`). Оба режима поддерживают необязательный вложенный объект `tls`.
    - `request.tls`: переопределение TLS для прямых подключений. Поля: `ca`, `cert`, `key`, `passphrase` (все поддерживают SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: если задано `true`, разрешить HTTP-запросам к провайдеру моделей обращаться к частным диапазонам, диапазонам CGNAT и аналогичным диапазонам через защиту HTTP-запросов провайдера. Базовые URL-адреса пользовательских или локальных провайдеров уже обеспечивают доверие точно настроенному источнику, кроме источников метаданных и локальных адресов канала, которые остаются заблокированными без явного разрешения. Установите значение `false`, чтобы отказаться от доверия точному источнику. WebSocket использует тот же `request` для заголовков и TLS, но не использует эту защиту получения данных от SSRF. По умолчанию: `false`.

  </Accordion>
  <Accordion title="Записи каталога моделей">
    - `models.providers.*.models`: явно заданные записи каталога моделей провайдера.
    - `models.providers.*.models.*.input`: модальности входных данных модели. Используйте `["text"]` для моделей, работающих только с текстом, и `["text", "image"]` для моделей с собственной поддержкой изображений или компьютерного зрения. Вложения изображений добавляются в обращения к агенту, только если выбранная модель отмечена как поддерживающая изображения.
    - `models.providers.*.models.*.contextWindow`: метаданные собственного окна контекста модели. Это значение переопределяет `contextWindow` уровня провайдера для данной модели.
    - `models.providers.*.models.*.contextTokens`: необязательное ограничение контекста среды выполнения. Это значение переопределяет `contextTokens` уровня провайдера; используйте его, если требуется меньший эффективный бюджет контекста, чем собственное значение `contextWindow` модели; `openclaw models list` показывает оба значения, когда они различаются.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: необязательная подсказка совместимости. Для `api: "openai-completions"` с непустым нестандартным `baseUrl` (узел не `api.openai.com`) OpenClaw во время выполнения принудительно устанавливает значение `false`. Пустой или отсутствующий `baseUrl` сохраняет стандартное поведение OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: необязательная подсказка совместимости для совместимых с OpenAI конечных точек чата, принимающих только строки. Если задано `true`, OpenClaw преобразует массивы `messages[].content`, содержащие только текст, в обычные строки перед отправкой запроса.
    - `models.providers.*.models.*.compat.strictMessageKeys`: необязательная подсказка совместимости для строгих конечных точек чата, совместимых с OpenAI. Если задано `true`, OpenClaw перед отправкой запроса сокращает исходящие объекты сообщений Chat Completions до `role` и `content`.
    - `models.providers.*.models.*.compat.thinkingFormat`: необязательная подсказка о полезной нагрузке рассуждений. Используйте `"together"` для `reasoning.enabled` в стиле Together, `"qwen"` для `enable_thinking` верхнего уровня или `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на совместимых с OpenAI серверах семейства Qwen, которые поддерживают аргументы шаблона чата на уровне запроса, например vLLM. Настроенные модели Qwen в vLLM предоставляют двоичный выбор `/think` (`off`, `on`) для этих форматов.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: необязательная подсказка совместимости для серверных систем Chat Completions в стиле DeepSeek, которым требуется сохранять `reasoning_content` в предыдущих сообщениях ассистента при повторном воспроизведении. Если задано `true`, OpenClaw сохраняет это поле в исходящих сообщениях ассистента. Используйте этот параметр при подключении пользовательского прокси, совместимого с DeepSeek, который отклоняет запросы после удаления рассуждений. По умолчанию: `false`.

  </Accordion>
  <Accordion title="Обнаружение Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: корневой объект настроек автоматического обнаружения Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: включение или отключение неявного обнаружения.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: регион AWS для обнаружения.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необязательный фильтр по идентификатору провайдера для целевого обнаружения.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: интервал опроса для обновления результатов обнаружения.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервный размер окна контекста для обнаруженных моделей.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервное максимальное количество выходных токенов для обнаруженных моделей.

  </Accordion>
</AccordionGroup>

Интерактивная настройка пользовательского провайдера определяет поддержку изображений по известным шаблонам идентификаторов моделей с компьютерным зрением, включая GPT-4o/GPT-4.1/GPT-5+, семейства рассуждающих моделей `o1`/`o3`/`o4`, Claude, Gemini, любые идентификаторы с суффиксом `-vl` (Qwen-VL и аналогичные), а также такие именованные семейства, как LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V и GLM-4V; для известных семейств, поддерживающих только текст (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama и идентификаторы Qwen без суффикса vl/vision), дополнительный вопрос пропускается. Для неизвестных идентификаторов моделей по-прежнему выводится запрос о поддержке изображений. При неинтерактивной настройке используется та же логика определения; передайте `--custom-image-input`, чтобы принудительно задать метаданные с поддержкой изображений, или `--custom-text-input`, чтобы принудительно задать метаданные только для текста.

### Примеры провайдеров

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Официальный внешний плагин провайдера `cerebras` может настроить это через `openclaw onboard --auth-choice cerebras-api-key`. Явную конфигурацию провайдера следует использовать только для переопределения значений по умолчанию.

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

    Используйте `cerebras/zai-glm-4.7` для Cerebras; `zai/glm-4.7` — для прямого подключения к Z.AI.

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

    Встроенный провайдер, совместимый с Anthropic. Быстрая настройка: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Локальные модели (LM Studio)">
    См. [Локальные модели](/ru/gateway/local-models). Кратко: запускайте крупную локальную модель через LM Studio Responses API на достаточно мощном оборудовании; сохраняйте объединённую конфигурацию размещённых моделей для резервного переключения.
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

    Задайте `MINIMAX_API_KEY`. Быстрая настройка: `openclaw onboard --auth-choice minimax-global-api` или `openclaw onboard --auth-choice minimax-cn-api`. В каталоге моделей по умолчанию используется M3, также в него входят варианты M2.7. При потоковой передаче по пути, совместимому с Anthropic, OpenClaw по умолчанию отключает режим рассуждений MiniMax M2.x, если вы сами явно не зададите `thinking`; MiniMax-M3 (и M3.x) по умолчанию остаётся на пути провайдера с отсутствующим или адаптивным режимом рассуждений. `/fast on` или `params.fastMode: true` заменяет `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

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

    Собственные конечные точки Moonshot заявляют совместимость со статистикой использования при потоковой передаче через общий транспорт `openai-completions`, и OpenClaw определяет её по возможностям конечной точки, а не только по идентификатору встроенного провайдера.

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

    Задайте `OPENCODE_API_KEY` (или `OPENCODE_ZEN_API_KEY`). Используйте ссылки `opencode/...` для каталога Zen или ссылки `opencode-go/...` для каталога Go. Быстрая настройка: `openclaw onboard --auth-choice opencode-zen` или `openclaw onboard --auth-choice opencode-go`.

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

    Базовый URL не должен содержать `/v1` (клиент Anthropic добавляет его самостоятельно). Быстрая настройка: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Задайте `ZAI_API_KEY`. В ссылках на модели используется канонический идентификатор провайдера `zai/*`. Быстрая настройка: `openclaw onboard --auth-choice zai-api-key`.

    - Общая конечная точка: `https://api.z.ai/api/paas/v4`
    - Конечная точка для программирования: `https://api.z.ai/api/coding/paas/v4`
    - Вариант аутентификации `zai-api-key`, используемый по умолчанию, проверяет ваш ключ и автоматически определяет, к какой конечной точке он относится (если результат неоднозначен, выводится запрос с вариантом Global по умолчанию). Для явного выбора также доступны отдельные варианты аутентификации CN и Coding-Plan.
    - Для общей конечной точки определите пользовательского провайдера с переопределением базового URL.

  </Accordion>
</AccordionGroup>

---

## Связанные разделы

- [Конфигурация — агенты](/ru/gateway/config-agents)
- [Конфигурация — каналы](/ru/gateway/config-channels)
- [Справочник по конфигурации](/ru/gateway/configuration-reference) — другие ключи верхнего уровня
- [Инструменты и плагины](/ru/tools)
