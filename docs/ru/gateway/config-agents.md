---
read_when:
    - Настройка значений по умолчанию для агента (модели, мышление, рабочая область, Heartbeat, медиа, Skills)
    - Настройка маршрутизации и привязок для нескольких агентов
    - Настройка сеанса, доставки сообщений и поведения режима разговора
summary: Настройки агента по умолчанию, многоагентная маршрутизация, сеанс, сообщения и конфигурация talk
title: Конфигурация — агенты
x-i18n:
    generated_at: "2026-07-03T17:33:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3f5d217738a8eebc3c94b61261ca34221b13ac08ffdba9cad61c9a48ed1ac
    source_path: gateway/config-agents.md
    workflow: 16
---

Ключи конфигурации области агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` и `talk.*`. Для каналов, инструментов, среды выполнения Gateway и других
ключей верхнего уровня см. [справочник конфигурации](/ru/gateway/configuration-reference).

## Значения агентов по умолчанию

### `agents.defaults.workspace`

По умолчанию: `OPENCLAW_WORKSPACE_DIR`, если задано, иначе `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Явное значение `agents.defaults.workspace` имеет приоритет над
`OPENCLAW_WORKSPACE_DIR`. Используйте переменную окружения, чтобы указывать агентам по умолчанию
на смонтированное рабочее пространство, когда не хотите записывать этот путь в конфигурацию.

### `agents.defaults.repoRoot`

Необязательный корень репозитория, отображаемый в строке Runtime системного промпта. Если не задан, OpenClaw автоматически определяет его, поднимаясь вверх от рабочего пространства.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необязательный список разрешенных навыков по умолчанию для агентов, которые не задают
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Опустите `agents.defaults.skills`, чтобы навыки по умолчанию были неограниченными.
- Опустите `agents.list[].skills`, чтобы наследовать значения по умолчанию.
- Задайте `agents.list[].skills: []`, чтобы отключить навыки.
- Непустой список `agents.list[].skills` является итоговым набором для этого агента; он
  не объединяется со значениями по умолчанию.

### `agents.defaults.skipBootstrap`

Отключает автоматическое создание файлов начальной загрузки рабочего пространства (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Пропускает создание выбранных необязательных файлов рабочего пространства, при этом продолжая записывать обязательные файлы начальной загрузки. Допустимые значения: `SOUL.md`, `USER.md`, `HEARTBEAT.md` и `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

Управляет тем, когда файлы начальной загрузки рабочего пространства внедряются в системный промпт. По умолчанию: `"always"`.

- `"continuation-skip"`: безопасные ходы продолжения (после завершенного ответа ассистента) пропускают повторное внедрение начальной загрузки рабочего пространства, уменьшая размер промпта. Запуски Heartbeat и повторные попытки после Compaction все равно заново собирают контекст.
- `"never"`: отключает внедрение начальной загрузки рабочего пространства и файлов контекста на каждом ходе. Используйте это только для агентов, которые полностью управляют жизненным циклом своего промпта (пользовательские движки контекста, нативные среды выполнения, которые строят собственный контекст, или специализированные рабочие процессы без начальной загрузки). Ходы Heartbeat и восстановления после Compaction также пропускают внедрение.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Переопределение для агента: `agents.list[].contextInjection`. Опущенные значения наследуют
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Максимальное число символов на файл начальной загрузки рабочего пространства до усечения. По умолчанию: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Переопределение для агента: `agents.list[].bootstrapMaxChars`. Опущенные значения наследуют
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Максимальное суммарное число символов, внедряемых из всех файлов начальной загрузки рабочего пространства. По умолчанию: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Переопределение для агента: `agents.list[].bootstrapTotalMaxChars`. Опущенные значения
наследуют `agents.defaults.bootstrapTotalMaxChars`.

### Переопределения профиля начальной загрузки для агента

Используйте переопределения профиля начальной загрузки для агента, когда одному агенту нужно поведение
внедрения промпта, отличающееся от общих значений по умолчанию. Опущенные поля наследуются из
`agents.defaults`.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Управляет видимым агенту уведомлением в системном промпте, когда контекст начальной загрузки усечен.
По умолчанию: `"always"`.

- `"off"`: никогда не внедрять текст уведомления об усечении в системный промпт.
- `"once"`: внедрять краткое уведомление один раз для каждой уникальной сигнатуры усечения.
- `"always"`: внедрять краткое уведомление при каждом запуске, когда есть усечение (рекомендуется).

Подробные счетчики исходного/внедренного содержимого и поля настройки конфигурации остаются в диагностике,
например в отчетах о контексте/состоянии и журналах; обычный пользовательский/среды выполнения контекст WebChat
получает только краткое уведомление о восстановлении.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Карта владения бюджетами контекста

В OpenClaw есть несколько высокообъемных бюджетов промпта/контекста, и они
намеренно разделены по подсистемам, а не проходят через один общий
регулятор.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  обычное внедрение начальной загрузки рабочего пространства.
- `agents.defaults.startupContext.*`:
  одноразовая прелюдия запуска модели при сбросе/старте, включая недавние ежедневные
  файлы `memory/*.md`. Простые команды чата `/new` и `/reset`
  подтверждаются без вызова модели.
- `skills.limits.*`:
  компактный список навыков, внедряемый в системный промпт.
- `agents.defaults.contextLimits.*`:
  ограниченные фрагменты среды выполнения и внедренные блоки, принадлежащие среде выполнения.
- `memory.qmd.limits.*`:
  размеры фрагментов индексированного поиска по памяти и внедрения.

Используйте соответствующее переопределение для агента только тогда, когда одному агенту нужен другой
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Управляет стартовой прелюдией первого хода, внедряемой при запусках модели после сброса/старта.
Простые команды чата `/new` и `/reset` подтверждают сброс без вызова
модели, поэтому они не загружают эту прелюдию.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Общие значения по умолчанию для ограниченных поверхностей контекста среды выполнения.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: ограничение фрагмента `memory_get` по умолчанию до добавления
  метаданных усечения и уведомления о продолжении.
- `memoryGetDefaultLines`: окно строк `memory_get` по умолчанию, когда `lines`
  опущено.
- `toolResultMaxChars`: расширенный потолок результатов живых инструментов, используемый для сохраняемых
  результатов и восстановления при переполнении. Оставьте незаданным для автоматического ограничения контекста модели:
  `16000` символов ниже 100K токенов, `32000` символов при 100K+ токенов и `64000`
  символов при 200K+ токенов. Явные значения до `1000000` принимаются для
  моделей с длинным контекстом, но эффективное ограничение все равно ограничено примерно 30% от
  окна контекста модели. `openclaw doctor --deep` выводит эффективное ограничение,
  а doctor предупреждает только когда явное переопределение устарело или не имеет эффекта.
- `postCompactionMaxChars`: ограничение фрагмента AGENTS.md, используемое во время внедрения
  обновления после Compaction.

#### `agents.list[].contextLimits`

Переопределение для агента для общих регуляторов `contextLimits`. Опущенные поля наследуются
из `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Глобальное ограничение для компактного списка навыков, внедряемого в системный промпт. Это
не влияет на чтение файлов `SKILL.md` по требованию.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Переопределение для агента для бюджета промпта навыков.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Максимальный размер в пикселях для самой длинной стороны изображения в блоках изображений стенограммы/инструмента перед вызовами провайдера.
По умолчанию: `1200`.

Меньшие значения обычно уменьшают использование vision-токенов и размер полезной нагрузки запроса для запусков с большим количеством скриншотов.
Большие значения сохраняют больше визуальных деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Предпочтение сжатия/детализации инструмента изображений для изображений, загруженных из путей файлов, URL и ссылок на медиа.
По умолчанию: `auto`.

OpenClaw адаптирует лестницу изменения размера к выбранной модели изображений. Например, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL и размещенные модели зрения Llama 4 могут использовать более крупные изображения, чем старые/стандартные пути зрения с высокой детализацией, тогда как ходы с несколькими изображениями в режиме `auto` сжимаются агрессивнее, чтобы контролировать стоимость токенов и задержку.

Значения:

- `auto`: адаптироваться к ограничениям модели и числу изображений.
- `efficient`: предпочитать меньшие изображения для меньшего использования токенов и байтов.
- `balanced`: использовать стандартную среднюю лестницу.
- `high`: сохранять больше деталей для скриншотов, диаграмм и изображений документов.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Часовой пояс для контекста системного промпта (не для временных меток сообщений). Возвращается к часовому поясу хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат времени в системном промпте. По умолчанию: `auto` (предпочтение ОС).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: принимает либо строку (`"provider/model"`), либо объект (`{ primary, fallbacks }`).
  - Строковая форма задает только основную модель.
  - Объектная форма задает основную модель и упорядоченные резервные модели для отказоустойчивого переключения.
- `imageModel`: принимает либо строку (`"provider/model"`), либо объект (`{ primary, fallbacks }`).
  - Используется путем инструмента `image` как его конфигурация vision-модели.
  - Также используется как резервная маршрутизация, когда выбранная/стандартная модель не может принимать изображения на вход.
  - Предпочитайте явные ссылки `provider/model`. Простые идентификаторы принимаются для совместимости; если простой идентификатор однозначно соответствует настроенной записи с поддержкой изображений в `models.providers.*.models`, OpenClaw дополняет его этим поставщиком. Неоднозначные настроенные совпадения требуют явного префикса поставщика.
- `imageGenerationModel`: принимает либо строку (`"provider/model"`), либо объект (`{ primary, fallbacks }`).
  - Используется общей возможностью генерации изображений и любой будущей поверхностью инструментов/Plugin, которая генерирует изображения.
  - Типичные значения: `google/gemini-3.1-flash-image-preview` для нативной генерации изображений Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images или `openai/gpt-image-1.5` для вывода OpenAI PNG/WebP с прозрачным фоном.
  - Если вы напрямую выбираете поставщика/модель, также настройте соответствующую аутентификацию поставщика (например, `GEMINI_API_KEY` или `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` или OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Если не указано, `image_generate` все равно может вывести стандартного поставщика, подкрепленного аутентификацией. Сначала он пробует текущего стандартного поставщика, затем остальных зарегистрированных поставщиков генерации изображений в порядке идентификаторов поставщиков.
- `musicGenerationModel`: принимает либо строку (`"provider/model"`), либо объект (`{ primary, fallbacks }`).
  - Используется общей возможностью генерации музыки и встроенным инструментом `music_generate`.
  - Типичные значения: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` или `minimax/music-2.6`.
  - Если не указано, `music_generate` все равно может вывести стандартного поставщика, подкрепленного аутентификацией. Сначала он пробует текущего стандартного поставщика, затем остальных зарегистрированных поставщиков генерации музыки в порядке идентификаторов поставщиков.
  - Если вы напрямую выбираете поставщика/модель, также настройте соответствующую аутентификацию поставщика/API-ключ.
- `videoGenerationModel`: принимает либо строку (`"provider/model"`), либо объект (`{ primary, fallbacks }`).
  - Используется общей возможностью генерации видео и встроенным инструментом `video_generate`.
  - Типичные значения: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` или `qwen/wan2.7-r2v`.
  - Если не указано, `video_generate` все равно может вывести стандартного поставщика, подкрепленного аутентификацией. Сначала он пробует текущего стандартного поставщика, затем остальных зарегистрированных поставщиков генерации видео в порядке идентификаторов поставщиков.
  - Если вы напрямую выбираете поставщика/модель, также настройте соответствующую аутентификацию поставщика/API-ключ.
  - Официальный Plugin генерации видео Qwen поддерживает до 1 выходного видео, 1 входного изображения, 4 входных видео, длительность 10 секунд, а также параметры уровня поставщика `size`, `aspectRatio`, `resolution`, `audio` и `watermark`.
- `pdfModel`: принимает либо строку (`"provider/model"`), либо объект (`{ primary, fallbacks }`).
  - Используется инструментом `pdf` для маршрутизации модели.
  - Если не указано, инструмент PDF возвращается к `imageModel`, а затем к разрешенной модели сеанса/стандартной модели.
- `pdfMaxBytesMb`: стандартный лимит размера PDF для инструмента `pdf`, когда `maxBytesMb` не передан во время вызова.
- `pdfMaxPages`: стандартное максимальное число страниц, учитываемых режимом резервного извлечения в инструменте `pdf`.
- `verboseDefault`: стандартный уровень подробности для агентов. Значения: `"off"`, `"on"`, `"full"`. По умолчанию: `"off"`.
- `toolProgressDetail`: режим детализации для сводок инструментов `/verbose` и строк инструментов в черновиках прогресса. Значения: `"explain"` (по умолчанию, компактные человекочитаемые метки) или `"raw"` (добавлять необработанную команду/детали, когда доступны). `agents.list[].toolProgressDetail` на уровне агента переопределяет это значение по умолчанию.
- `reasoningDefault`: стандартная видимость reasoning для агентов. Значения: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` на уровне агента переопределяет это значение по умолчанию. Настроенные значения reasoning по умолчанию применяются только для владельцев, авторизованных отправителей или operator-admin контекстов Gateway, когда не задано переопределение reasoning на уровне сообщения или сеанса.
- `elevatedDefault`: стандартный уровень elevated-вывода для агентов. Значения: `"off"`, `"on"`, `"ask"`, `"full"`. По умолчанию: `"on"`.
- `model.primary`: формат `provider/model` (например, `openai/gpt-5.5` для доступа через API-ключ OpenAI или Codex OAuth). Если вы опускаете поставщика, OpenClaw сначала пробует псевдоним, затем уникальное совпадение настроенного поставщика для этого точного идентификатора модели и только потом возвращается к настроенному стандартному поставщику (устаревшее поведение совместимости, поэтому предпочитайте явный `provider/model`). Если этот поставщик больше не предоставляет настроенную стандартную модель, OpenClaw возвращается к первому настроенному поставщику/модели вместо того, чтобы показывать устаревший стандарт удаленного поставщика.
- `models`: настроенный каталог моделей и список разрешенных моделей для `/model`. Каждая запись может включать `alias` (краткий псевдоним) и `params` (специфичные для поставщика, например `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, маршрутизацию OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Используйте записи `provider/*`, такие как `"openai/*": {}` или `"vllm/*": {}`, чтобы показывать все обнаруженные модели для выбранных поставщиков без ручного перечисления каждого идентификатора модели.
  - Добавьте `agentRuntime` в запись `provider/*`, когда каждая динамически обнаруженная модель этого поставщика должна использовать одну и ту же среду выполнения. Точная политика среды выполнения `provider/model` все равно имеет приоритет над wildcard.
  - Безопасные правки: используйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, чтобы добавлять записи. `config set` отклоняет замены, которые удалили бы существующие записи списка разрешенных, если не передан `--replace`.
  - Потоки настройки/онбординга, ограниченные поставщиком, объединяют выбранные модели поставщика в эту карту и сохраняют уже настроенных несвязанных поставщиков.
  - Для прямых моделей OpenAI Responses серверная Compaction включается автоматически. Используйте `params.responsesServerCompaction: false`, чтобы прекратить внедрение `context_management`, или `params.responsesCompactThreshold`, чтобы переопределить порог. См. [серверную Compaction OpenAI](/ru/providers/openai#server-side-compaction-responses-api).
- `params`: глобальные стандартные параметры поставщика, применяемые ко всем моделям. Задаются в `agents.defaults.params` (например, `{ cacheRetention: "long" }`).
- Приоритет объединения `params` (конфигурация): `agents.defaults.params` (глобальная база) переопределяется `agents.defaults.models["provider/model"].params` (на уровне модели), затем `agents.list[].params` (соответствующий идентификатор агента) переопределяет по ключам. Подробности см. в [кэшировании промптов](/ru/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: стандартная политика маршрутизации поставщиков для всего OpenRouter. OpenClaw передает ее в объект `provider` запроса OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` на уровне модели и параметры агента переопределяют по ключам. См. [маршрутизацию поставщиков OpenRouter](/ru/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: расширенный сквозной JSON, объединяемый в тела запросов `api: "openai-completions"` для OpenAI-совместимых прокси. Если он конфликтует со сгенерированными ключами запроса, дополнительное тело имеет приоритет; ненативные маршруты completions после этого все равно удаляют OpenAI-only `store`.
- `params.chat_template_kwargs`: аргументы chat-template для vLLM/OpenAI-совместимых запросов, объединяемые в верхний уровень тел запросов `api: "openai-completions"`. Для `vllm/nemotron-3-*` с отключенным thinking встроенный Plugin vLLM автоматически отправляет `enable_thinking: false` и `force_nonempty_content: true`; явные `chat_template_kwargs` переопределяют сгенерированные значения по умолчанию, а `extra_body.chat_template_kwargs` все равно имеет окончательный приоритет. Настроенные модели thinking vLLM Qwen и Nemotron предоставляют бинарные варианты `/think` (`off`, `on`) вместо многоуровневой шкалы effort.
- `compat.thinkingFormat`: стиль OpenAI-совместимой полезной нагрузки thinking. Используйте `"together"` для Together-стиля `reasoning.enabled`, `"qwen"` для Qwen-стиля верхнеуровневого `enable_thinking` или `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на бэкендах семейства Qwen, которые поддерживают kwargs chat-template на уровне запроса, таких как vLLM. OpenClaw сопоставляет отключенный thinking с `false`, а включенный thinking с `true`, и настроенные модели vLLM Qwen предоставляют бинарные варианты `/think` для этих форматов.
- `compat.supportedReasoningEfforts`: список OpenAI-совместимых уровней reasoning effort на уровне модели. Включайте `"xhigh"` для пользовательских конечных точек, которые действительно его принимают; тогда OpenClaw показывает `/think xhigh` в меню команд, строках сеансов Gateway, проверке патчей сеансов, проверке agent CLI и проверке `llm-task` для настроенного поставщика/модели. Используйте `compat.reasoningEffortMap`, когда бэкенду требуется специфичное для поставщика значение для канонического уровня.
- `params.preserveThinking`: включаемая только для Z.AI опция сохраненного thinking. Когда она включена и thinking активен, OpenClaw отправляет `thinking.clear_thinking: false` и воспроизводит предыдущее `reasoning_content`; см. [thinking и сохраненный thinking Z.AI](/ru/providers/zai#thinking-and-preserved-thinking).
- `localService`: необязательный менеджер процессов уровня поставщика для локальных/самостоятельно размещенных серверов моделей. Когда выбранная модель относится к этому поставщику, OpenClaw проверяет `healthUrl` (или `baseUrl + "/models"`), запускает `command` с `args`, если конечная точка недоступна, ждет до `readyTimeoutMs`, затем отправляет запрос модели. `command` должен быть абсолютным путем. `idleStopMs: 0` оставляет процесс активным до выхода OpenClaw; положительное значение останавливает процесс, запущенный OpenClaw, после указанного числа миллисекунд простоя. См. [локальные сервисы моделей](/ru/gateway/local-model-services).
- Политика среды выполнения относится к поставщикам или моделям, а не к `agents.defaults`. Используйте `models.providers.<provider>.agentRuntime` для правил на уровне поставщика или `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` для правил, специфичных для модели. Модели агентов OpenAI у официального поставщика OpenAI по умолчанию выбирают Codex.
- Писатели конфигурации, которые изменяют эти поля (например, `/models set`, `/models set-image` и команды добавления/удаления резервных моделей), сохраняют каноническую объектную форму и по возможности сохраняют существующие списки резервных моделей.
- `maxConcurrent`: максимальное число параллельных запусков агентов между сеансами (каждый сеанс все равно сериализуется). По умолчанию: 4.

### Политика среды выполнения

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, идентификатор зарегистрированного harness Plugin или поддерживаемый псевдоним CLI-бэкенда. Встроенный Plugin Codex регистрирует `codex`; встроенный Plugin Anthropic предоставляет CLI-бэкенд `claude-cli`.
- `id: "auto"` позволяет зарегистрированным harness Plugin принимать поддерживаемые ходы и использует OpenClaw, когда ни один harness не подходит. Явная среда выполнения Plugin, например `id: "codex"`, требует этот harness и аварийно завершает работу, если он недоступен или дает сбой.
- `id: "pi"` принимается только как устаревший псевдоним для `openclaw`, чтобы сохранить выпущенные конфигурации из v2026.5.22 и более ранних версий. В новой конфигурации следует использовать `openclaw`.
- Приоритет среды выполнения: сначала точная политика модели (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` или `models.providers.<provider>.models[]`), затем `agents.list[]` / `agents.defaults.models["provider/*"]`, затем политика на уровне провайдера в `models.providers.<provider>.agentRuntime`.
- Ключи среды выполнения всего агента устарели. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, привязки среды выполнения сессии и `OPENCLAW_AGENT_RUNTIME` игнорируются при выборе среды выполнения. Запустите `openclaw doctor --fix`, чтобы удалить устаревшие значения.
- Модели агентов OpenAI по умолчанию используют harness Codex; `agentRuntime.id: "codex"` для provider/model остается допустимым, если вы хотите указать это явно.
- Для развертываний Claude CLI предпочитайте `model: "anthropic/claude-opus-4-8"` вместе с привязанным к модели `agentRuntime.id: "claude-cli"`. Устаревшие ссылки на модели `claude-cli/claude-opus-4-7` все еще работают для совместимости, но новая конфигурация должна сохранять канонический выбор provider/model и помещать бэкенд выполнения в политику среды выполнения provider/model.
- Это управляет только выполнением текстовых ходов агента. Генерация медиа, vision, PDF, музыка, видео и TTS по-прежнему используют свои настройки provider/model.

**Встроенные сокращенные псевдонимы** (применяются только когда модель находится в `agents.defaults.models`):

| Псевдоним           | Модель                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Ваши настроенные псевдонимы всегда имеют приоритет над значениями по умолчанию.

Модели Z.AI GLM-4.x автоматически включают режим рассуждения, если вы не зададите `--thinking off` или самостоятельно не определите `agents.defaults.models["zai/<model>"].params.thinking`.
Модели Z.AI по умолчанию включают `tool_stream` для потоковой передачи вызовов инструментов. Задайте `agents.defaults.models["zai/<model>"].params.tool_stream` равным `false`, чтобы отключить это.
В OpenClaw для Anthropic Claude Opus 4.8 рассуждение по умолчанию отключено; когда адаптивное рассуждение явно включено, заданное провайдером значение effort по умолчанию у Anthropic равно `high`. Модели Claude 4.6 по умолчанию используют `adaptive`, если явный уровень рассуждения не задан.

### `agents.defaults.cliBackends`

Необязательные CLI-бэкенды для текстовых резервных запусков (без вызовов инструментов). Полезно как резервный вариант при сбое API-провайдеров.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-бэкенды ориентированы прежде всего на текст; инструменты всегда отключены.
- Сессии поддерживаются, когда задан `sessionArg`.
- Сквозная передача изображений поддерживается, когда `imageArg` принимает пути к файлам.
- `reseedFromRawTranscriptWhenUncompacted: true` позволяет бэкенду восстанавливать безопасные
  инвалидированные сессии из ограниченного хвоста необработанной расшифровки OpenClaw до появления
  первой сводки Compaction. Изменения профиля авторизации или эпохи учетных данных
  все равно никогда не выполняют повторное заполнение из необработанных данных.

### `agents.defaults.promptOverlays`

Независимые от провайдера наложения промпта, применяемые по семейству моделей на поверхностях промптов, собранных OpenClaw. Идентификаторы моделей семейства GPT-5 получают общий контракт поведения на маршрутах OpenClaw/провайдера; `personality` управляет только дружелюбным слоем стиля взаимодействия. Нативные маршруты app-server Codex сохраняют базовые инструкции и инструкции модели, принадлежащие Codex, вместо этого наложения OpenClaw GPT-5, а OpenClaw отключает встроенную personality Codex для нативных потоков.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (по умолчанию) и `"on"` включают дружелюбный слой стиля взаимодействия.
- `"off"` отключает только дружелюбный слой; помеченный контракт поведения GPT-5 остается включенным.
- Устаревший `plugins.entries.openai.config.personality` все еще читается, когда эта общая настройка не задана.

### `agents.defaults.heartbeat`

Периодические запуски Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: строка длительности (ms/s/m/h). По умолчанию: `30m` (авторизация по API-ключу) или `1h` (авторизация OAuth). Задайте `0m`, чтобы отключить.
- `includeSystemPromptSection`: когда false, исключает раздел Heartbeat из системного промпта и пропускает внедрение `HEARTBEAT.md` в начальный контекст. По умолчанию: `true`.
- `suppressToolErrorWarnings`: когда true, подавляет предупреждающие payload об ошибках инструментов во время запусков Heartbeat.
- `timeoutSeconds`: максимальное время в секундах, разрешенное для хода агента Heartbeat до его прерывания. Оставьте незаданным, чтобы использовать `agents.defaults.timeoutSeconds`, если он задан, иначе частоту Heartbeat с ограничением в 600 секунд.
- `directPolicy`: политика доставки напрямую/в DM. `allow` (по умолчанию) разрешает доставку прямой цели. `block` подавляет доставку прямой цели и выдает `reason=dm-blocked`.
- `lightContext`: когда true, запуски Heartbeat используют облегченный начальный контекст и сохраняют только `HEARTBEAT.md` из начальных файлов рабочей области.
- `isolatedSession`: когда true, каждый Heartbeat запускается в новой сессии без предыдущей истории разговора. Та же схема изоляции, что и у Cron `sessionTarget: "isolated"`. Снижает стоимость токенов на Heartbeat примерно со 100 тыс. до 2-5 тыс. токенов.
- `skipWhenBusy`: когда true, запуски Heartbeat откладываются при наличии дополнительных занятых полос этого агента: его собственной привязанной к ключу сессии работы подагента или вложенной команды. Полосы Cron всегда откладывают Heartbeat, даже без этого флага.
- Для отдельного агента: задайте `agents.list[].heartbeat`. Когда любой агент определяет `heartbeat`, Heartbeat запускают **только эти агенты**.
- Heartbeat выполняют полные ходы агента — более короткие интервалы расходуют больше токенов.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` или `safeguard` (порционная суммаризация для длинных историй). См. [Compaction](/ru/concepts/compaction).
- `provider`: идентификатор зарегистрированного Plugin провайдера Compaction. Если задан, вместо встроенной суммаризации LLM вызывается `summarize()` провайдера. При сбое выполняется откат к встроенной суммаризации. Задание провайдера принудительно включает `mode: "safeguard"`. См. [Compaction](/ru/concepts/compaction).
- `timeoutSeconds`: максимальное количество секунд, разрешенное для одной операции Compaction, прежде чем OpenClaw прервет ее. По умолчанию: `180`.
- `keepRecentTokens`: бюджет точки отсечения агента для дословного сохранения самого свежего хвоста транскрипта. Ручная команда `/compact` учитывает это значение, если оно задано явно; иначе ручная Compaction является жесткой контрольной точкой.
- `identifierPolicy`: `strict` (по умолчанию), `off` или `custom`. `strict` добавляет встроенные инструкции по сохранению непрозрачных идентификаторов в начало суммаризации Compaction.
- `identifierInstructions`: необязательный пользовательский текст для сохранения идентификаторов, используемый при `identifierPolicy=custom`.
- `qualityGuard`: проверки с повтором при некорректно сформированном выводе для сводок safeguard. В режиме safeguard включено по умолчанию; задайте `enabled: false`, чтобы пропустить аудит.
- `midTurnPrecheck`: необязательная проверка давления цикла инструментов. Когда `enabled: true`, OpenClaw проверяет давление контекста после добавления результатов инструментов и перед следующим вызовом модели. Если контекст больше не помещается, текущая попытка прерывается до отправки промпта и повторно используется существующий путь восстановления precheck для усечения результатов инструментов либо выполнения Compaction и повторной попытки. Работает с режимами Compaction `default` и `safeguard`. По умолчанию: отключено.
- `postCompactionSections`: необязательные имена разделов H2/H3 из AGENTS.md для повторной вставки после Compaction. Повторная вставка отключена, если значение не задано или задано как `[]`. Явное задание `["Session Startup", "Red Lines"]` включает эту пару и сохраняет устаревший резервный вариант `Every Session`/`Safety`. Включайте это только тогда, когда дополнительный контекст стоит риска дублирования проектных инструкций, уже захваченных в сводке Compaction.
- `model`: необязательное значение `provider/model-id` или простой псевдоним из `agents.defaults.models` только для суммаризации Compaction. Простые псевдонимы разрешаются перед отправкой; настроенные буквальные идентификаторы моделей сохраняют приоритет при совпадениях. Используйте это, когда основной сеанс должен оставаться на одной модели, а сводки Compaction должны выполняться на другой; если значение не задано, Compaction использует основную модель сеанса.
- `maxActiveTranscriptBytes`: необязательный байтовый порог (`number` или строки вроде `"20mb"`), который запускает обычную локальную Compaction перед запуском, когда активный JSONL превышает порог. Требует `truncateAfterCompaction`, чтобы успешная Compaction могла выполнить ротацию на меньший последующий транскрипт. Отключено, если значение не задано или равно `0`.
- `notifyUser`: когда `true`, отправляет пользователю краткие уведомления при начале и завершении Compaction (например, «Сжатие контекста...» и «Compaction завершена»). По умолчанию отключено, чтобы Compaction выполнялась без уведомлений.
- `memoryFlush`: тихий агентный ход перед автоматической Compaction для сохранения долговременных воспоминаний. Задайте `model` как точный провайдер/модель, например `ollama/qwen3:8b`, когда этот служебный ход должен оставаться на локальной модели; переопределение не наследует цепочку резервных вариантов активного сеанса. Пропускается, когда рабочая область доступна только для чтения.

### `agents.defaults.runRetries`

Границы итераций повторных попыток внешнего цикла выполнения для встроенной среды выполнения агента, чтобы предотвратить бесконечные циклы выполнения при восстановлении после сбоев. Обратите внимание, что сейчас эта настройка применяется только к встроенной среде выполнения агента, а не к средам выполнения ACP или CLI.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: базовое количество итераций повторных попыток выполнения для внешнего цикла выполнения. По умолчанию: `24`.
- `perProfile`: дополнительные итерации повторных попыток выполнения, предоставляемые каждому кандидату резервного профиля. По умолчанию: `8`.
- `min`: минимальный абсолютный лимит итераций повторных попыток выполнения. По умолчанию: `32`.
- `max`: максимальный абсолютный лимит итераций повторных попыток выполнения для предотвращения неконтролируемого выполнения. По умолчанию: `160`.

### `agents.defaults.contextPruning`

Удаляет **старые результаты инструментов** из контекста в памяти перед отправкой в LLM. **Не** изменяет историю сеанса на диске.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` включает проходы очистки.
- `ttl` управляет тем, как часто очистка может запускаться снова (после последнего касания кеша).
- Очистка сначала мягко усекает слишком большие результаты инструментов, а затем при необходимости полностью очищает более старые результаты инструментов.
- `softTrimRatio` и `hardClearRatio` принимают значения от `0.0` до `1.0`; проверка конфигурации отклоняет значения вне этого диапазона.

**Мягкое усечение** сохраняет начало + конец и вставляет `...` в середину.

**Полная очистка** заменяет весь результат инструмента заполнителем.

Примечания:

- Блоки изображений никогда не усекаются и не очищаются.
- Коэффициенты основаны на символах (приблизительно), а не на точном количестве токенов.
- Если существует меньше сообщений ассистента, чем `keepLastAssistants`, очистка пропускается.

</Accordion>

Подробности поведения см. в [Очистка сеанса](/ru/concepts/session-pruning).

### Блочная потоковая передача

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Каналы, кроме Telegram, требуют явного `*.blockStreaming: true`, чтобы включить блочные ответы.
- Переопределения каналов: `channels.<channel>.blockStreamingCoalesce` (и варианты для отдельных учетных записей). Для Signal/Slack/Discord/Google Chat по умолчанию `minChars: 1500`.
- `humanDelay`: рандомизированная пауза между блочными ответами. `natural` = 800–2500 мс. Переопределение для отдельного агента: `agents.list[].humanDelay`.

Подробности поведения и разбиения на фрагменты см. в [Потоковая передача](/ru/concepts/streaming).

### Индикаторы набора

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Значения по умолчанию: `instant` для прямых чатов/упоминаний, `message` для групповых чатов без упоминания.
- Переопределения для сеанса: `session.typingMode`, `session.typingIntervalSeconds`.

См. [Индикаторы набора](/ru/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необязательная песочница для встроенного агента. Полное руководство см. в [Песочница](/ru/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox details">

**Backend:**

- `docker`: локальная среда выполнения Docker (по умолчанию)
- `ssh`: универсальная удаленная среда выполнения на основе SSH
- `openshell`: среда выполнения OpenShell

Когда выбрано `backend: "openshell"`, настройки, специфичные для среды выполнения, переносятся в
`plugins.entries.openshell.config`.

**Конфигурация Backend SSH:**

- `target`: цель SSH в форме `user@host[:port]`
- `command`: команда клиента SSH (по умолчанию: `ssh`)
- `workspaceRoot`: абсолютный удаленный корень, используемый для рабочих областей по областям действия
- `identityFile` / `certificateFile` / `knownHostsFile`: существующие локальные файлы, передаваемые в OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: встроенное содержимое или SecretRefs, которые OpenClaw материализует во временные файлы во время выполнения
- `strictHostKeyChecking` / `updateHostKeys`: параметры политики ключей хостов OpenSSH

**Приоритет аутентификации SSH:**

- `identityData` имеет приоритет над `identityFile`
- `certificateData` имеет приоритет над `certificateFile`
- `knownHostsData` имеет приоритет над `knownHostsFile`
- Значения `*Data` на основе SecretRef разрешаются из активного снимка среды выполнения секретов до запуска сеанса песочницы

**Поведение Backend SSH:**

- один раз заполняет удаленную рабочую область после создания или повторного создания
- затем сохраняет удаленную рабочую область SSH канонической
- направляет `exec`, файловые инструменты и пути к медиа через SSH
- не синхронизирует удаленные изменения обратно на хост автоматически
- не поддерживает контейнеры браузера песочницы

**Доступ к рабочей области:**

- `none`: рабочая область песочницы для каждой области действия в `~/.openclaw/sandboxes`
- `ro`: рабочая область песочницы в `/workspace`, рабочая область агента смонтирована только для чтения в `/agent`
- `rw`: рабочая область агента смонтирована для чтения/записи в `/workspace`

**Область действия:**

- `session`: контейнер + рабочая область для каждого сеанса
- `agent`: один контейнер + рабочая область на агента (по умолчанию)
- `shared`: общий контейнер и рабочая область (без изоляции между сеансами)

**Конфигурация Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Режим OpenShell:**

- `mirror`: заполнить удаленную среду из локальной перед выполнением, синхронизировать обратно после выполнения; локальная рабочая область остается канонической
- `remote`: заполнить удаленную среду один раз при создании песочницы, затем считать удаленную рабочую область канонической

В режиме `remote` локальные изменения на хосте, сделанные вне OpenClaw, не синхронизируются в песочницу автоматически после этапа начального заполнения.
Транспорт использует SSH в песочницу OpenShell, но Plugin управляет жизненным циклом песочницы и необязательной зеркальной синхронизацией.

**`setupCommand`** выполняется один раз после создания контейнера (через `sh -lc`). Требует исходящий доступ к сети, корневую файловую систему с правом записи и пользователя root.

**По умолчанию контейнеры используют `network: "none"`** — задайте `"bridge"` (или пользовательскую bridge-сеть), если агенту нужен исходящий доступ.
`"host"` заблокирован. `"container:<id>"` по умолчанию заблокирован, если вы явно не зададите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварийный режим).
Ходы app-server Codex в активной песочнице OpenClaw используют эту же настройку исходящего доступа для своего нативного сетевого доступа в code-mode.

**Входящие вложения** помещаются в `media/inbound/*` в активной рабочей области.

**`docker.binds`** монтирует дополнительные каталоги хоста; глобальные привязки и привязки отдельного агента объединяются.

**Песочничный браузер** (`sandbox.browser.enabled`): Chromium + CDP в контейнере. URL noVNC внедряется в системный prompt. Не требует `browser.enabled` в `openclaw.json`.
Доступ наблюдателя noVNC по умолчанию использует VNC-аутентификацию, а OpenClaw выдает краткоживущий URL с токеном (вместо раскрытия пароля в общем URL).

- `allowHostControl: false` (по умолчанию) запрещает песочничным сеансам обращаться к браузеру хоста.
- `network` по умолчанию равно `openclaw-sandbox-browser` (выделенная bridge-сеть). Задавайте `bridge` только когда вам явно нужна глобальная bridge-связность.
- `cdpSourceRange` необязательно ограничивает входящий CDP-доступ на границе контейнера диапазоном CIDR (например, `172.21.0.1/32`).
- `sandbox.browser.binds` монтирует дополнительные каталоги хоста только в контейнер песочничного браузера. Если задано (включая `[]`), заменяет `docker.binds` для контейнера браузера.
- Значения запуска по умолчанию определены в `scripts/sandbox-browser-entrypoint.sh` и настроены для контейнерных хостов:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (включено по умолчанию)
  - `--disable-3d-apis`, `--disable-software-rasterizer` и `--disable-gpu`
    включены по умолчанию и могут быть отключены с помощью
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, если требуется использование WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` повторно включает расширения, если ваш рабочий процесс
    зависит от них.
  - `--renderer-process-limit=2` можно изменить с помощью
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; задайте `0`, чтобы использовать
    стандартный лимит процессов Chromium.
  - плюс `--no-sandbox`, когда включен `noSandbox`.
  - Значения по умолчанию являются базовой линией образа контейнера; используйте пользовательский образ браузера с пользовательской
    точкой входа, чтобы изменить значения контейнера по умолчанию.

</Accordion>

Песочница браузера и `sandbox.docker.binds` доступны только для Docker.

Соберите образы (из исходного checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Для установок npm без исходного checkout см. [Песочница § Образы и настройка](/ru/gateway/sandboxing#images-and-setup), где приведены встроенные команды `docker build`.

### `agents.list` (переопределения для отдельных агентов)

Используйте `agents.list[].tts`, чтобы назначить агенту собственный TTS-провайдер, голос, модель,
стиль или режим auto-TTS. Блок агента глубоко объединяется поверх глобального
`messages.tts`, поэтому общие учетные данные могут оставаться в одном месте, а отдельные
агенты переопределяют только нужные им поля голоса или провайдера. Переопределение активного агента
применяется к автоматическим голосовым ответам, `/tts audio`, `/tts status` и
инструменту агента `tts`. См. [Преобразование текста в речь](/ru/tools/tts#per-agent-voice-overrides)
для примеров провайдеров и порядка приоритета.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: стабильный идентификатор агента (обязательно).
- `default`: если задано несколько, используется первый (записывается предупреждение). Если не задан ни один, по умолчанию используется первая запись списка.
- `model`: строковая форма задает строгую основную модель для отдельного агента без резервной модели; объектная форма `{ primary }` также строгая, если вы не добавите `fallbacks`. Используйте `{ primary, fallbacks: [...] }`, чтобы включить для этого агента резервный переход, или `{ primary, fallbacks: [] }`, чтобы явно зафиксировать строгое поведение. Cron-задания, которые переопределяют только `primary`, все равно наследуют резервные модели по умолчанию, если вы не зададите `fallbacks: []`.
- `params`: потоковые параметры отдельного агента, объединяемые поверх выбранной записи модели в `agents.defaults.models`. Используйте это для специфичных для агента переопределений вроде `cacheRetention`, `temperature` или `maxTokens` без дублирования всего каталога моделей.
- `tts`: необязательные переопределения преобразования текста в речь для отдельного агента. Блок глубоко объединяется поверх `messages.tts`, поэтому храните общие учетные данные провайдера и политику резервирования в `messages.tts`, а здесь задавайте только значения, специфичные для персоны, например провайдера, голос, модель, стиль или автоматический режим.
- `skills`: необязательный allowlist навыков для отдельного агента. Если пропущено, агент наследует `agents.defaults.skills`, когда он задан; явный список заменяет значения по умолчанию вместо объединения, а `[]` означает отсутствие Skills.
- `thinkingDefault`: необязательный уровень мышления по умолчанию для отдельного агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Переопределяет `agents.defaults.thinkingDefault` для этого агента, когда не задано переопределение для сообщения или сеанса. Выбранный профиль провайдера/модели определяет, какие значения допустимы; для Google Gemini `adaptive` сохраняет динамическое мышление, управляемое провайдером (`thinkingLevel` опущен на Gemini 3/3.1, `thinkingBudget: -1` на Gemini 2.5).
- `reasoningDefault`: необязательная видимость reasoning по умолчанию для отдельного агента (`on | off | stream`). Переопределяет `agents.defaults.reasoningDefault` для этого агента, когда не задано переопределение reasoning для сообщения или сеанса.
- `fastModeDefault`: необязательное значение по умолчанию для быстрого режима отдельного агента (`"auto" | true | false`). Применяется, когда не задано переопределение быстрого режима для сообщения или сеанса.
- `models`: необязательный каталог моделей/переопределения runtime для отдельного агента, индексированные полными идентификаторами `provider/model`. Используйте `models["provider/model"].agentRuntime` для исключений runtime отдельного агента.
- `runtime`: необязательный дескриптор runtime отдельного агента. Используйте `type: "acp"` с настройками по умолчанию `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), когда агент должен по умолчанию использовать сеансы ACP harness.
- `identity.avatar`: путь относительно рабочей области, URL `http(s)` или URI `data:`.
- Локальные файлы изображений `identity.avatar`, заданные относительно рабочей области, ограничены 2 MB. URL `http(s)` и URI `data:` не проверяются локальным лимитом размера файла.
- `identity` выводит значения по умолчанию: `ackReaction` из `emoji`, `mentionPatterns` из `name`/`emoji`.
- `subagents.allowAgents`: allowlist настроенных идентификаторов агентов для явных целей `sessions_spawn.agentId` (`["*"]` = любая настроенная цель; по умолчанию: только тот же агент). Включите идентификатор запрашивающего, когда должны быть разрешены вызовы `agentId`, нацеленные на самого себя. Устаревшие записи, конфигурация агента для которых была удалена, отклоняются `sessions_spawn` и опускаются в `agents_list`; выполните `openclaw doctor --fix`, чтобы очистить их, или добавьте минимальную запись `agents.list[]`, если эта цель должна оставаться доступной для запуска с наследованием значений по умолчанию.
- Защита наследования песочницы: если сеанс запрашивающего находится в песочнице, `sessions_spawn` отклоняет цели, которые запускались бы без песочницы.
- `subagents.requireAgentId`: когда `true`, блокирует вызовы `sessions_spawn`, в которых опущен `agentId` (требует явного выбора профиля; по умолчанию: `false`).

---

## Маршрутизация с несколькими агентами

Запускайте несколько изолированных агентов внутри одного Gateway. См. [Мультиагентность](/ru/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Поля сопоставления привязки

- `type` (необязательно): `route` для обычной маршрутизации (отсутствующий тип по умолчанию считается route), `acp` для постоянных привязок ACP-разговоров.
- `match.channel` (обязательно)
- `match.accountId` (необязательно; `*` = любая учетная запись; пропущено = учетная запись по умолчанию)
- `match.peer` (необязательно; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необязательно; зависит от канала)
- `acp` (необязательно; только для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детерминированный порядок сопоставления:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точное совпадение, без peer/guild/team)
5. `match.accountId: "*"` (на весь канал)
6. Агент по умолчанию

Внутри каждого уровня побеждает первая совпадающая запись `bindings`.

Для записей `type: "acp"` OpenClaw разрешает по точной идентичности разговора (`match.channel` + учетная запись + `match.peer.id`) и не использует приведенный выше порядок уровней route-привязок.

### Профили доступа для отдельных агентов

<Accordion title="Full access (no sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Read-only tools + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Нет доступа к файловой системе (только сообщения)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

См. [песочницу и инструменты для нескольких агентов](/ru/tools/multi-agent-sandbox-tools), чтобы узнать подробности приоритетов.

---

## Сеанс

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (default) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Подробности полей сеанса">

- **`scope`**: базовая стратегия группировки сеансов для контекстов группового чата.
  - `per-sender` (по умолчанию): каждый отправитель получает изолированный сеанс внутри контекста канала.
  - `global`: все участники в контексте канала используют один общий сеанс (используйте только тогда, когда нужен общий контекст).
- **`dmScope`**: способ группировки личных сообщений.
  - `main`: все личные сообщения используют основной сеанс.
  - `per-peer`: изоляция по идентификатору отправителя между каналами.
  - `per-channel-peer`: изоляция по каналу + отправителю (рекомендуется для многопользовательских входящих).
  - `per-account-channel-peer`: изоляция по аккаунту + каналу + отправителю (рекомендуется для нескольких аккаунтов).
- **`identityLinks`**: сопоставляет канонические идентификаторы с одноранговыми участниками с префиксом провайдера для совместного использования сеансов между каналами. Команды закрепления, такие как `/dock_discord`, используют ту же карту, чтобы переключить маршрут ответа активного сеанса на другого связанного участника канала; см. [закрепление каналов](/ru/concepts/channel-docking).
- **`reset`**: основная политика сброса. `daily` сбрасывает в локальное время `atHour`; `idle` сбрасывает после `idleMinutes`. Если настроены оба варианта, срабатывает тот, срок которого истекает первым. Актуальность ежедневного сброса использует `sessionStartedAt` строки сеанса; актуальность сброса по бездействию использует `lastInteractionAt`. Фоновые/системные записи событий, такие как Heartbeat, пробуждения Cron, уведомления exec и служебный учет Gateway, могут обновлять `updatedAt`, но не сохраняют актуальность ежедневных/бездействующих сеансов.
- **`resetByType`**: переопределения по типу (`direct`, `group`, `thread`). Устаревший `dm` принимается как псевдоним для `direct`.
- **`mainKey`**: устаревшее поле. Runtime всегда использует `"main"` для основного контейнера прямого чата.
- **`agentToAgent.maxPingPongTurns`**: максимальное число ответных ходов между агентами во время обменов agent-to-agent (целое число, диапазон: `0`-`20`, по умолчанию: `5`). `0` отключает цепочку ping-pong.
- **`sendPolicy`**: сопоставление по `channel`, `chatType` (`direct|group|channel`, с устаревшим псевдонимом `dm`), `keyPrefix` или `rawKeyPrefix`. Первый запрет имеет приоритет.
- **`maintenance`**: очистка хранилища сеансов + элементы управления удержанием.
  - `mode`: `enforce` применяет очистку и используется по умолчанию; `warn` только выдает предупреждения.
  - `pruneAfter`: возрастной порог для устаревших записей (по умолчанию `30d`).
  - `maxEntries`: максимальное число записей в `sessions.json` (по умолчанию `500`). Runtime записывает пакетную очистку с небольшим буфером верхнего порога для лимитов производственного размера; `openclaw sessions cleanup --enforce` применяет лимит немедленно.
  - Краткоживущие сеансы-зонды выполнения модели Gateway используют фиксированное удержание `24h`, но очистка зависит от давления: она удаляет устаревшие строгие строки зондов выполнения модели только при достижении давления обслуживания/лимита записей сеансов. Подходят только строгие явные ключи зондов, соответствующие `agent:*:explicit:model-run-<uuid>`; обычные прямые, групповые, потоковые, Cron, hook, Heartbeat, ACP и сеансы подагентов не наследуют это 24-часовое удержание. Когда выполняется очистка выполнения модели, она запускается до более широкой очистки устаревших записей `pruneAfter` и лимита `maxEntries`.
  - `rotateBytes`: устарело и игнорируется; `openclaw doctor --fix` удаляет его из старых конфигураций.
  - `resetArchiveRetention`: удержание для архивов стенограмм `*.reset.<timestamp>`. По умолчанию равно `pruneAfter`; установите `false`, чтобы отключить.
  - `maxDiskBytes`: необязательный дисковый бюджет каталога сеансов. В режиме `warn` он записывает предупреждения в журнал; в режиме `enforce` сначала удаляет самые старые артефакты/сеансы.
  - `highWaterBytes`: необязательная цель после очистки бюджета. По умолчанию `80%` от `maxDiskBytes`.
- **`threadBindings`**: глобальные значения по умолчанию для функций сеансов, привязанных к потокам.
  - `enabled`: основной переключатель по умолчанию (провайдеры могут переопределять; Discord использует `channels.discord.threadBindings.enabled`)
  - `idleHours`: авто-снятие фокуса по умолчанию при бездействии в часах (`0` отключает; провайдеры могут переопределять)
  - `maxAgeHours`: жесткий максимальный возраст по умолчанию в часах (`0` отключает; провайдеры могут переопределять)
  - `spawnSessions`: шлюз по умолчанию для создания рабочих сеансов, привязанных к потокам, из `sessions_spawn` и порождений потоков ACP. По умолчанию `true`, когда привязки потоков включены; провайдеры/аккаунты могут переопределять.
  - `defaultSpawnContext`: собственный контекст подагента по умолчанию для порождений, привязанных к потокам (`"fork"` или `"isolated"`). По умолчанию `"fork"`.

</Accordion>

---

## Сообщения

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Префикс ответа

Переопределения для канала/аккаунта: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Разрешение (самое конкретное имеет приоритет): аккаунт → канал → глобальное значение. `""` отключает и останавливает каскад. `"auto"` выводит `[{identity.name}]`.

**Переменные шаблона:**

| Переменная        | Описание                   | Пример                      |
| ----------------- | -------------------------- | --------------------------- |
| `{model}`         | Краткое имя модели         | `claude-opus-4-6`           |
| `{modelFull}`     | Полный идентификатор модели | `anthropic/claude-opus-4-6` |
| `{provider}`      | Имя провайдера             | `anthropic`                 |
| `{thinkingLevel}` | Текущий уровень мышления    | `high`, `low`, `off`        |
| `{identity.name}` | Имя идентичности агента     | (то же, что `"auto"`)       |

Переменные не зависят от регистра. `{think}` является псевдонимом для `{thinkingLevel}`.

### Реакция подтверждения

- По умолчанию используется `identity.emoji` активного агента, иначе `"👀"`. Установите `""`, чтобы отключить.
- Переопределения для каналов: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок разрешения: аккаунт → канал → `messages.ackReaction` → резервная идентичность.
- Область: `group-mentions` (по умолчанию), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: удаляет подтверждение после ответа в каналах с поддержкой реакций, таких как Slack, Discord, Signal, Telegram, WhatsApp и iMessage.
- `messages.statusReactions.enabled`: включает реакции статуса жизненного цикла в Slack, Discord, Signal, Telegram и WhatsApp.
  В Slack и Discord неустановленное значение оставляет реакции статуса включенными, когда активны реакции подтверждения.
  В Signal, Telegram и WhatsApp задайте его явно как `true`, чтобы включить реакции статуса жизненного цикла.
- `messages.statusReactions.emojis`: переопределяет ключи эмодзи жизненного цикла:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` и `stallHard`.
  Telegram разрешает только фиксированный набор реакций, поэтому неподдерживаемые настроенные эмодзи откатываются
  к ближайшему поддерживаемому варианту статуса для этого чата.

### Задержка входящих сообщений

Объединяет быстрые текстовые сообщения от одного отправителя в один ход агента. Медиа/вложения сбрасываются немедленно. Управляющие команды обходят задержку.

### TTS (синтез речи)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` управляет режимом auto-TTS по умолчанию: `off`, `always`, `inbound` или `tagged`. `/tts on|off` может переопределять локальные настройки, а `/tts status` показывает эффективное состояние.
- `summaryModel` переопределяет `agents.defaults.model.primary` для автоматической сводки.
- `modelOverrides` включен по умолчанию; `modelOverrides.allowProvider` по умолчанию равен `false` (требуется явное включение).
- API-ключи используют резервные `ELEVENLABS_API_KEY`/`XI_API_KEY` и `OPENAI_API_KEY`.
- Встроенные поставщики речи принадлежат plugins. Если задан `plugins.allow`, включите каждый Plugin поставщика TTS, который хотите использовать, например `microsoft` для Edge TTS. Устаревший идентификатор поставщика `edge` принимается как псевдоним для `microsoft`.
- `providers.openai.baseUrl` переопределяет конечную точку OpenAI TTS. Порядок разрешения: конфигурация, затем `OPENAI_TTS_BASE_URL`, затем `https://api.openai.com/v1`.
- Когда `providers.openai.baseUrl` указывает на конечную точку не OpenAI, OpenClaw рассматривает ее как OpenAI-совместимый TTS-сервер и ослабляет проверку модели/голоса.

---

## Talk

Значения по умолчанию для режима Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` должен совпадать с ключом в `talk.providers`, когда настроено несколько поставщиков Talk.
- Устаревшие плоские ключи Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) предназначены только для совместимости. Выполните `openclaw doctor --fix`, чтобы переписать сохраненную конфигурацию в `talk.providers.<provider>`.
- Идентификаторы голосов используют резервные `ELEVENLABS_VOICE_ID` или `SAG_VOICE_ID`.
- `providers.*.apiKey` принимает строки открытого текста или объекты SecretRef.
- Резервный `ELEVENLABS_API_KEY` применяется только когда API-ключ Talk не настроен.
- `providers.*.voiceAliases` позволяет директивам Talk использовать понятные имена.
- `providers.mlx.modelId` выбирает репозиторий Hugging Face, используемый локальным помощником MLX в macOS. Если параметр опущен, macOS использует `mlx-community/Soprano-80M-bf16`.
- Воспроизведение MLX в macOS выполняется через встроенный помощник `openclaw-mlx-tts`, если он присутствует, или через исполняемый файл в `PATH`; `OPENCLAW_MLX_TTS_BIN` переопределяет путь к помощнику для разработки.
- `consultThinkingLevel` управляет уровнем мышления для полного запуска агента OpenClaw за вызовами Control UI Talk realtime `openclaw_agent_consult`. Не задавайте, чтобы сохранить обычное поведение сессии/модели.
- `consultFastMode` задает одноразовое переопределение быстрого режима для realtime-консультаций Control UI Talk без изменения обычной настройки быстрого режима сессии.
- `speechLocale` задает идентификатор локали BCP 47, используемый распознаванием речи Talk в iOS/macOS. Не задавайте, чтобы использовать значение устройства по умолчанию.
- `silenceTimeoutMs` управляет тем, сколько режим Talk ждет после тишины пользователя, прежде чем отправить расшифровку. Если не задано, сохраняется окно паузы платформы по умолчанию (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` добавляет системные инструкции для поставщика к встроенному realtime-промпту OpenClaw, чтобы стиль голоса можно было настроить без потери стандартных указаний `openclaw_agent_consult`.
- `realtime.consultRouting` управляет резервной маршрутизацией ретрансляции Gateway, когда realtime-поставщик создает итоговую расшифровку пользователя без `openclaw_agent_consult`: `provider-direct` сохраняет прямые ответы поставщика, а `force-agent-consult` направляет финализированный запрос через OpenClaw.

---

## Связанные материалы

- [Справочник по конфигурации](/ru/gateway/configuration-reference) — все остальные ключи конфигурации
- [Конфигурация](/ru/gateway/configuration) — распространенные задачи и быстрая настройка
- [Примеры конфигурации](/ru/gateway/configuration-examples)
