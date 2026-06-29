---
read_when:
    - Настройка значений по умолчанию для агента (модели, размышления, рабочая область, Heartbeat, медиа, Skills)
    - Настройка маршрутизации и привязок для нескольких агентов
    - Настройка поведения сеанса, доставки сообщений и режима разговора
summary: Настройки агента по умолчанию, многоагентная маршрутизация, сеанс, сообщения и конфигурация talk
title: Configuration — агенты
x-i18n:
    generated_at: "2026-06-28T22:55:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

Ключи конфигурации уровня агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` и `talk.*`. Для каналов, инструментов, среды выполнения Gateway и других
ключей верхнего уровня см. [справочник по конфигурации](/ru/gateway/configuration-reference).

## Значения агентов по умолчанию

### `agents.defaults.workspace`

По умолчанию: `OPENCLAW_WORKSPACE_DIR`, если задано, иначе `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Явное значение `agents.defaults.workspace` имеет приоритет над
`OPENCLAW_WORKSPACE_DIR`. Используйте переменную окружения, чтобы направить агентов
по умолчанию в смонтированное рабочее пространство, когда не хотите записывать этот путь в конфигурацию.

### `agents.defaults.repoRoot`

Необязательный корень репозитория, отображаемый в строке Runtime системного промпта. Если не задан, OpenClaw определяет его автоматически, поднимаясь вверх от рабочего пространства.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необязательный список разрешенных Skills по умолчанию для агентов, у которых не задано
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

- Опустите `agents.defaults.skills`, чтобы Skills по умолчанию были не ограничены.
- Опустите `agents.list[].skills`, чтобы унаследовать значения по умолчанию.
- Задайте `agents.list[].skills: []`, чтобы Skills отсутствовали.
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

Пропускает создание выбранных необязательных файлов рабочего пространства, но продолжает записывать обязательные файлы начальной загрузки. Допустимые значения: `SOUL.md`, `USER.md`, `HEARTBEAT.md` и `IDENTITY.md`.

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

- `"continuation-skip"`: безопасные ходы продолжения (после завершенного ответа ассистента) пропускают повторное внедрение начальной загрузки рабочего пространства, уменьшая размер промпта. Запуски Heartbeat и повторные попытки после Compaction по-прежнему перестраивают контекст.
- `"never"`: отключает начальную загрузку рабочего пространства и внедрение контекстных файлов на каждом ходе. Используйте это только для агентов, которые полностью управляют жизненным циклом своего промпта (пользовательские контекстные движки, нативные среды выполнения, которые строят собственный контекст, или специализированные рабочие процессы без начальной загрузки). Ходы Heartbeat и восстановления после Compaction также пропускают внедрение.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Переопределение для отдельного агента: `agents.list[].contextInjection`. Пропущенные значения наследуют
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Максимум символов на файл начальной загрузки рабочего пространства до усечения. По умолчанию: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Переопределение для отдельного агента: `agents.list[].bootstrapMaxChars`. Пропущенные значения наследуют
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Максимальное суммарное число символов, внедряемых из всех файлов начальной загрузки рабочего пространства. По умолчанию: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Переопределение для отдельного агента: `agents.list[].bootstrapTotalMaxChars`. Пропущенные значения
наследуют `agents.defaults.bootstrapTotalMaxChars`.

### Переопределения профиля начальной загрузки для отдельных агентов

Используйте переопределения профиля начальной загрузки для отдельного агента, когда одному агенту требуется поведение
внедрения промпта, отличное от общих значений по умолчанию. Пропущенные поля наследуются из
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

Подробные исходные/внедренные счетчики и поля настройки конфигурации остаются в диагностике,
например в отчетах о контексте/статусе и журналах; обычный пользовательский/исполнительный контекст WebChat получает только
краткое уведомление о восстановлении.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Карта владения бюджетами контекста

В OpenClaw есть несколько больших бюджетов промпта/контекста, и они
намеренно разделены по подсистемам, а не проходят через один общий
регулятор.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  обычное внедрение начальной загрузки рабочего пространства.
- `agents.defaults.startupContext.*`:
  одноразовая прелюдия сброса/запуска модельного прогона, включая недавние ежедневные
  файлы `memory/*.md`. Простые команды чата `/new` и `/reset`
  подтверждаются без вызова модели.
- `skills.limits.*`:
  компактный список Skills, внедряемый в системный промпт.
- `agents.defaults.contextLimits.*`:
  ограниченные фрагменты среды выполнения и внедренные блоки, принадлежащие среде выполнения.
- `memory.qmd.limits.*`:
  размер индексированного фрагмента поиска по памяти и внедрения.

Используйте соответствующее переопределение для отдельного агента только тогда, когда одному агенту нужен другой
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Управляет стартовой прелюдией первого хода, внедряемой при модельных прогонах сброса/запуска.
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
- `toolResultMaxChars`: расширенный потолок результатов живых инструментов, используемый для сохраненных
  результатов и восстановления при переполнении. Оставьте незаданным для автоматического ограничения модельного контекста:
  `16000` символов ниже 100K токенов, `32000` символов при 100K+ токенов и `64000`
  символов при 200K+ токенов. Явные значения до `1000000` принимаются для
  моделей с длинным контекстом, но эффективное ограничение все равно ограничено примерно 30% от
  окна контекста модели. `openclaw doctor --deep` выводит эффективное ограничение,
  а doctor предупреждает только тогда, когда явное переопределение устарело или не имеет эффекта.
- `postCompactionMaxChars`: ограничение фрагмента AGENTS.md, используемое при внедрении
  обновления после Compaction.

#### `agents.list[].contextLimits`

Переопределение для отдельного агента для общих регуляторов `contextLimits`. Пропущенные поля наследуют
`agents.defaults.contextLimits`.

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

Глобальное ограничение компактного списка Skills, внедряемого в системный промпт. Это
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

Переопределение бюджета промпта Skills для отдельного агента.

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

Максимальный размер в пикселях для самой длинной стороны изображения в блоках изображений транскрипта/инструмента перед вызовами провайдера.
По умолчанию: `1200`.

Более низкие значения обычно уменьшают использование vision-токенов и размер полезной нагрузки запроса для прогонов с большим количеством скриншотов.
Более высокие значения сохраняют больше визуальных деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Предпочтение сжатия/детализации image-инструмента для изображений, загруженных из файловых путей, URL и медиа-ссылок.
По умолчанию: `auto`.

OpenClaw адаптирует лестницу изменения размера к выбранной модели изображений. Например, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL и размещенные vision-модели Llama 4 могут использовать более крупные изображения, чем старые/стандартные vision-пути с высокой детализацией, а ходы с несколькими изображениями сжимаются агрессивнее в режиме `auto`, чтобы контролировать стоимость токенов и задержку.

Значения:

- `auto`: адаптироваться к ограничениям модели и количеству изображений.
- `efficient`: предпочитать меньшие изображения для снижения расхода токенов и байтов.
- `balanced`: использовать стандартную промежуточную лестницу.
- `high`: сохранять больше деталей для скриншотов, диаграмм и изображений документов.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Часовой пояс для контекста системного промпта (не для временных меток сообщений). Использует часовой пояс хоста как запасной вариант.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат времени в системном промпте. По умолчанию: `auto` (настройка ОС).

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
  - Объектная форма задает основную модель и упорядоченные модели для аварийного переключения.
- `imageModel`: принимает либо строку (`"provider/model"`), либо объект (`{ primary, fallbacks }`).
  - Используется путем инструмента `image` как его конфигурация модели зрения.
  - Также используется как резервная маршрутизация, когда выбранная/стандартная модель не может принимать изображения на вход.
  - Предпочитайте явные ссылки `provider/model`. Простые ID принимаются для совместимости; если простой ID однозначно совпадает с настроенной записью, поддерживающей изображения, в `models.providers.*.models`, OpenClaw дополняет его этим провайдером. Неоднозначные настроенные совпадения требуют явного префикса провайдера.
- `imageGenerationModel`: принимает либо строку (`"provider/model"`), либо объект (`{ primary, fallbacks }`).
  - Используется общей возможностью генерации изображений и любой будущей поверхностью инструмента/плагина, которая генерирует изображения.
  - Типичные значения: `google/gemini-3.1-flash-image-preview` для нативной генерации изображений Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images или `openai/gpt-image-1.5` для вывода PNG/WebP OpenAI с прозрачным фоном.
  - Если вы выбираете провайдера/модель напрямую, также настройте соответствующую аутентификацию провайдера (например, `GEMINI_API_KEY` или `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` или OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Если параметр опущен, `image_generate` все равно может вывести стандартного провайдера, подкрепленного аутентификацией. Сначала он пробует текущего стандартного провайдера, затем остальных зарегистрированных провайдеров генерации изображений в порядке ID провайдера.
- `musicGenerationModel`: принимает либо строку (`"provider/model"`), либо объект (`{ primary, fallbacks }`).
  - Используется общей возможностью генерации музыки и встроенным инструментом `music_generate`.
  - Типичные значения: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` или `minimax/music-2.6`.
  - Если параметр опущен, `music_generate` все равно может вывести стандартного провайдера, подкрепленного аутентификацией. Сначала он пробует текущего стандартного провайдера, затем остальных зарегистрированных провайдеров генерации музыки в порядке ID провайдера.
  - Если вы выбираете провайдера/модель напрямую, также настройте соответствующую аутентификацию/API-ключ провайдера.
- `videoGenerationModel`: принимает либо строку (`"provider/model"`), либо объект (`{ primary, fallbacks }`).
  - Используется общей возможностью генерации видео и встроенным инструментом `video_generate`.
  - Типичные значения: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` или `qwen/wan2.7-r2v`.
  - Если параметр опущен, `video_generate` все равно может вывести стандартного провайдера, подкрепленного аутентификацией. Сначала он пробует текущего стандартного провайдера, затем остальных зарегистрированных провайдеров генерации видео в порядке ID провайдера.
  - Если вы выбираете провайдера/модель напрямую, также настройте соответствующую аутентификацию/API-ключ провайдера.
  - Официальный плагин генерации видео Qwen поддерживает до 1 выходного видео, 1 входного изображения, 4 входных видео, длительность 10 секунд и параметры уровня провайдера `size`, `aspectRatio`, `resolution`, `audio` и `watermark`.
- `pdfModel`: принимает либо строку (`"provider/model"`), либо объект (`{ primary, fallbacks }`).
  - Используется инструментом `pdf` для маршрутизации моделей.
  - Если параметр опущен, инструмент PDF переходит к `imageModel`, затем к разрешенной модели сеанса/стандартной модели.
- `pdfMaxBytesMb`: стандартный лимит размера PDF для инструмента `pdf`, когда `maxBytesMb` не передан во время вызова.
- `pdfMaxPages`: стандартное максимальное число страниц, учитываемых резервным режимом извлечения в инструменте `pdf`.
- `verboseDefault`: стандартный уровень подробности для агентов. Значения: `"off"`, `"on"`, `"full"`. По умолчанию: `"off"`.
- `toolProgressDetail`: режим детализации для сводок инструментов `/verbose` и строк инструментов в черновиках прогресса. Значения: `"explain"` (по умолчанию, компактные человекочитаемые метки) или `"raw"` (добавляет необработанную команду/детали, когда доступны). `agents.list[].toolProgressDetail` для конкретного агента переопределяет это значение по умолчанию.
- `reasoningDefault`: стандартная видимость рассуждений для агентов. Значения: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` для конкретного агента переопределяет это значение по умолчанию. Настроенные стандартные значения рассуждений применяются только для владельцев, авторизованных отправителей или операторско-административных контекстов Gateway, когда не задано переопределение рассуждений для сообщения или сеанса.
- `elevatedDefault`: стандартный уровень повышенного вывода для агентов. Значения: `"off"`, `"on"`, `"ask"`, `"full"`. По умолчанию: `"on"`.
- `model.primary`: формат `provider/model` (например, `openai/gpt-5.5` для доступа через API-ключ OpenAI или Codex OAuth). Если вы опускаете провайдера, OpenClaw сначала пробует псевдоним, затем уникальное совпадение настроенного провайдера для этого точного ID модели и только потом возвращается к настроенному стандартному провайдеру (устаревшее поведение совместимости, поэтому предпочитайте явный `provider/model`). Если этот провайдер больше не предоставляет настроенную стандартную модель, OpenClaw возвращается к первой настроенной паре провайдер/модель вместо того, чтобы показывать устаревшее значение по умолчанию удаленного провайдера.
- `models`: настроенный каталог моделей и allowlist для `/model`. Каждая запись может включать `alias` (сокращение) и `params` (специфичные для провайдера, например `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, маршрутизация OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Используйте записи `provider/*`, такие как `"openai/*": {}` или `"vllm/*": {}`, чтобы показывать все обнаруженные модели для выбранных провайдеров без ручного перечисления каждого ID модели.
  - Добавьте `agentRuntime` в запись `provider/*`, когда каждая динамически обнаруженная модель для этого провайдера должна использовать один и тот же рантайм. Точная политика рантайма `provider/model` все равно имеет приоритет над wildcard.
  - Безопасные правки: используйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, чтобы добавлять записи. `config set` отклоняет замены, которые удалили бы существующие записи allowlist, если не передать `--replace`.
  - Потоки настройки/onboarding с областью провайдера объединяют выбранные модели провайдера в эту карту и сохраняют уже настроенных несвязанных провайдеров.
  - Для прямых моделей OpenAI Responses серверная Compaction включается автоматически. Используйте `params.responsesServerCompaction: false`, чтобы прекратить внедрение `context_management`, или `params.responsesCompactThreshold`, чтобы переопределить порог. См. [серверную Compaction OpenAI](/ru/providers/openai#server-side-compaction-responses-api).
- `params`: глобальные стандартные параметры провайдера, применяемые ко всем моделям. Задаются в `agents.defaults.params` (например, `{ cacheRetention: "long" }`).
- Приоритет слияния `params` (конфигурация): `agents.defaults.params` (глобальная база) переопределяется `agents.defaults.models["provider/model"].params` (для модели), затем `agents.list[].params` (для совпадающего ID агента) переопределяет по ключу. Подробнее см. [кэширование промптов](/ru/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: стандартная политика маршрутизации провайдеров для всего OpenRouter. OpenClaw передает ее в объект `provider` запроса OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` для конкретной модели и параметры агента переопределяют по ключу. См. [маршрутизацию провайдеров OpenRouter](/ru/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: расширенный сквозной JSON, объединяемый в тела запросов `api: "openai-completions"` для OpenAI-совместимых прокси. Если он конфликтует с сгенерированными ключами запроса, дополнительное тело имеет приоритет; ненативные маршруты completions все равно затем удаляют OpenAI-only `store`.
- `params.chat_template_kwargs`: аргументы chat-template для vLLM/OpenAI-совместимых систем, объединяемые в верхнеуровневые тела запросов `api: "openai-completions"`. Для `vllm/nemotron-3-*` с выключенным мышлением встроенный плагин vLLM автоматически отправляет `enable_thinking: false` и `force_nonempty_content: true`; явные `chat_template_kwargs` переопределяют сгенерированные значения по умолчанию, а `extra_body.chat_template_kwargs` все равно имеет окончательный приоритет. Настроенные модели мышления vLLM Qwen и Nemotron предоставляют бинарные варианты `/think` (`off`, `on`) вместо многоуровневой шкалы усилия.
- `compat.thinkingFormat`: стиль полезной нагрузки мышления, совместимый с OpenAI. Используйте `"together"` для стиля Together `reasoning.enabled`, `"qwen"` для стиля Qwen с верхнеуровневым `enable_thinking` или `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на бэкендах семейства Qwen, которые поддерживают kwargs chat-template уровня запроса, таких как vLLM. OpenClaw отображает отключенное мышление в `false`, а включенное мышление в `true`; настроенные модели vLLM Qwen предоставляют бинарные варианты `/think` для этих форматов.
- `compat.supportedReasoningEfforts`: список уровней reasoning effort для конкретной модели, совместимый с OpenAI. Включайте `"xhigh"` для пользовательских конечных точек, которые действительно принимают его; тогда OpenClaw показывает `/think xhigh` в меню команд, строках сеансов Gateway, валидации патча сеанса, валидации CLI агента и валидации `llm-task` для этой настроенной пары провайдер/модель. Используйте `compat.reasoningEffortMap`, когда бэкенду нужно специфичное для провайдера значение для канонического уровня.
- `params.preserveThinking`: опциональное включение только для Z.AI для сохраненного мышления. Когда включено и мышление активно, OpenClaw отправляет `thinking.clear_thinking: false` и повторно воспроизводит предыдущий `reasoning_content`; см. [мышление Z.AI и сохраненное мышление](/ru/providers/zai#thinking-and-preserved-thinking).
- `localService`: необязательный менеджер процессов уровня провайдера для локальных/self-hosted серверов моделей. Когда выбранная модель принадлежит этому провайдеру, OpenClaw проверяет `healthUrl` (или `baseUrl + "/models"`), запускает `command` с `args`, если конечная точка недоступна, ждет до `readyTimeoutMs`, затем отправляет запрос модели. `command` должен быть абсолютным путем. `idleStopMs: 0` оставляет процесс запущенным до выхода OpenClaw; положительное значение останавливает процесс, запущенный OpenClaw, после указанного числа миллисекунд простоя. См. [локальные сервисы моделей](/ru/gateway/local-model-services).
- Политика рантайма относится к провайдерам или моделям, а не к `agents.defaults`. Используйте `models.providers.<provider>.agentRuntime` для правил на уровне всего провайдера или `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` для правил конкретной модели. Агентские модели OpenAI у официального провайдера OpenAI по умолчанию выбирают Codex.
- Писатели конфигурации, которые изменяют эти поля (например, `/models set`, `/models set-image` и команды добавления/удаления резервных моделей), сохраняют каноническую объектную форму и по возможности сохраняют существующие списки резервных моделей.
- `maxConcurrent`: максимальное число параллельных запусков агентов между сеансами (каждый сеанс все равно сериализован). По умолчанию: 4.

### Политика рантайма

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

- `id`: `"auto"`, `"openclaw"`, id зарегистрированной обвязки плагина или поддерживаемый псевдоним CLI-бэкенда. Встроенный плагин Codex регистрирует `codex`; встроенный плагин Anthropic предоставляет CLI-бэкенд `claude-cli`.
- `id: "auto"` позволяет зарегистрированным обвязкам плагинов забирать поддерживаемые ходы и использует OpenClaw, когда ни одна обвязка не совпадает. Явная среда выполнения плагина, например `id: "codex"`, требует эту обвязку и завершается отказом, если она недоступна или дает сбой.
- `id: "pi"` принимается только как устаревший псевдоним для `openclaw`, чтобы сохранить выпущенные конфигурации из v2026.5.22 и более ранних версий. Новая конфигурация должна использовать `openclaw`.
- Приоритет среды выполнения: сначала точная политика модели (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` или `models.providers.<provider>.models[]`), затем `agents.list[]` / `agents.defaults.models["provider/*"]`, затем политика всего провайдера в `models.providers.<provider>.agentRuntime`.
- Ключи среды выполнения всего агента являются устаревшими. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, закрепления среды выполнения сеанса и `OPENCLAW_AGENT_RUNTIME` игнорируются при выборе среды выполнения. Запустите `openclaw doctor --fix`, чтобы удалить устаревшие значения.
- Агентские модели OpenAI по умолчанию используют обвязку Codex; `agentRuntime.id: "codex"` для провайдера/модели остается допустимым, если вы хотите указать это явно.
- Для развертываний Claude CLI предпочитайте `model: "anthropic/claude-opus-4-8"` плюс привязанный к модели `agentRuntime.id: "claude-cli"`. Устаревшие ссылки на модели `claude-cli/claude-opus-4-7` по-прежнему работают для совместимости, но новая конфигурация должна сохранять канонический выбор провайдера/модели и помещать бэкенд выполнения в политику среды выполнения провайдера/модели.
- Это управляет только выполнением текстовых агентских ходов. Генерация медиа, зрение, PDF, музыка, видео и TTS по-прежнему используют свои настройки провайдера/модели.

**Встроенные сокращения псевдонимов** (применяются только когда модель находится в `agents.defaults.models`):

| Псевдоним           | Модель                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Ваши настроенные псевдонимы всегда имеют приоритет над значениями по умолчанию.

Модели Z.AI GLM-4.x автоматически включают режим размышления, если вы не зададите `--thinking off` или самостоятельно не определите `agents.defaults.models["zai/<model>"].params.thinking`.
Модели Z.AI по умолчанию включают `tool_stream` для потоковой передачи вызовов инструментов. Задайте `agents.defaults.models["zai/<model>"].params.tool_stream` в `false`, чтобы отключить это.
Anthropic Claude Opus 4.8 в OpenClaw по умолчанию оставляет размышление выключенным; когда адаптивное размышление явно включено, принадлежащее провайдеру значение effort по умолчанию у Anthropic равно `high`. Для моделей Claude 4.6 по умолчанию используется `adaptive`, если явный уровень размышления не задан.

### `agents.defaults.cliBackends`

Необязательные CLI-бэкенды для резервных запусков только с текстом (без вызовов инструментов). Полезно как запасной вариант, когда API-провайдеры дают сбой.

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

- CLI-бэкенды ориентированы на текст; инструменты всегда отключены.
- Сеансы поддерживаются, когда задан `sessionArg`.
- Сквозная передача изображений поддерживается, когда `imageArg` принимает пути к файлам.
- `reseedFromRawTranscriptWhenUncompacted: true` позволяет бэкенду восстанавливать безопасные
  инвалидированные сеансы из ограниченного хвоста сырой стенограммы OpenClaw до того, как
  появится первая сводка Compaction. Изменения профиля аутентификации или эпохи учетных данных
  по-прежнему никогда не выполняют повторное заполнение из сырой стенограммы.

### `agents.defaults.promptOverlays`

Независимые от провайдера наложения промпта, применяемые по семейству моделей на поверхностях промпта, собранных OpenClaw. Id моделей семейства GPT-5 получают общий контракт поведения на маршрутах OpenClaw/провайдера; `personality` управляет только дружественным слоем стиля взаимодействия. Нативные маршруты сервера приложения Codex сохраняют базовые/модельные инструкции, принадлежащие Codex, вместо этого наложения OpenClaw GPT-5, а OpenClaw отключает встроенную personality Codex для нативных потоков.

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

- `"friendly"` (по умолчанию) и `"on"` включают дружественный слой стиля взаимодействия.
- `"off"` отключает только дружественный слой; помеченный контракт поведения GPT-5 остается включенным.
- Устаревший `plugins.entries.openai.config.personality` по-прежнему читается, когда эта общая настройка не задана.

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

- `every`: строка длительности (ms/s/m/h). По умолчанию: `30m` (аутентификация по API-ключу) или `1h` (аутентификация OAuth). Задайте `0m`, чтобы отключить.
- `includeSystemPromptSection`: когда false, опускает раздел Heartbeat из системного промпта и пропускает внедрение `HEARTBEAT.md` в начальный контекст. По умолчанию: `true`.
- `suppressToolErrorWarnings`: когда true, подавляет полезные нагрузки предупреждений об ошибках инструментов во время запусков Heartbeat.
- `timeoutSeconds`: максимальное время в секундах, разрешенное для агентского хода Heartbeat до его прерывания. Оставьте незаданным, чтобы использовать `agents.defaults.timeoutSeconds`, когда он задан, иначе применяется cadence Heartbeat с ограничением 600 секунд.
- `directPolicy`: политика прямой доставки/DM. `allow` (по умолчанию) разрешает доставку прямым целям. `block` подавляет доставку прямым целям и выдает `reason=dm-blocked`.
- `lightContext`: когда true, запуски Heartbeat используют облегченный начальный контекст и сохраняют только `HEARTBEAT.md` из начальных файлов рабочей области.
- `isolatedSession`: когда true, каждый Heartbeat запускается в свежем сеансе без предыдущей истории разговора. Та же схема изоляции, что и у cron `sessionTarget: "isolated"`. Снижает стоимость токенов на один Heartbeat примерно со 100K до 2-5K токенов.
- `skipWhenBusy`: когда true, запуски Heartbeat откладываются на дополнительных занятых линиях этого агента: его собственной привязанной к ключу сеанса работе субагента или вложенной команды. Линии Cron всегда откладывают Heartbeat, даже без этого флага.
- Для отдельного агента: задайте `agents.list[].heartbeat`. Когда любой агент определяет `heartbeat`, Heartbeat запускают **только эти агенты**.
- Heartbeat выполняют полные агентские ходы — более короткие интервалы расходуют больше токенов.

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

- `mode`: `default` или `safeguard` (фрагментированное суммирование для длинных историй). См. [Compaction](/ru/concepts/compaction).
- `provider`: идентификатор зарегистрированного plugin-провайдера compaction. Если задан, вызывается `summarize()` провайдера вместо встроенного LLM-суммирования. При сбое выполняется откат к встроенному варианту. Задание провайдера принудительно включает `mode: "safeguard"`. См. [Compaction](/ru/concepts/compaction).
- `timeoutSeconds`: максимальное число секунд, разрешенное для одной операции compaction, прежде чем OpenClaw прервет ее. По умолчанию: `180`.
- `keepRecentTokens`: бюджет точки отсечения агента для сохранения самого свежего хвоста транскрипта без изменений. Ручной `/compact` учитывает это значение, когда оно задано явно; иначе ручная compaction является жесткой контрольной точкой.
- `identifierPolicy`: `strict` (по умолчанию), `off` или `custom`. `strict` добавляет встроенные инструкции по сохранению непрозрачных идентификаторов перед суммированием compaction.
- `identifierInstructions`: необязательный пользовательский текст для сохранения идентификаторов, используемый при `identifierPolicy=custom`.
- `qualityGuard`: проверки с повтором при некорректно сформированном выводе для safeguard-сводок. Включено по умолчанию в режиме safeguard; задайте `enabled: false`, чтобы пропустить аудит.
- `midTurnPrecheck`: необязательная проверка нагрузки цикла инструментов. Когда `enabled: true`, OpenClaw проверяет нагрузку на контекст после добавления результатов инструментов и перед следующим вызовом модели. Если контекст больше не помещается, он прерывает текущую попытку до отправки промпта и повторно использует существующий путь восстановления precheck, чтобы усечь результаты инструментов или выполнить compaction и повторить попытку. Работает с обоими режимами compaction: `default` и `safeguard`. По умолчанию: отключено.
- `postCompactionSections`: необязательные имена разделов H2/H3 из AGENTS.md для повторной вставки после compaction. Повторная вставка отключена, если значение не задано или равно `[]`. Явное задание `["Session Startup", "Red Lines"]` включает эту пару и сохраняет устаревший fallback `Every Session`/`Safety`. Включайте это только тогда, когда дополнительный контекст стоит риска дублирования проектных инструкций, уже захваченных в сводке compaction.
- `model`: необязательный `provider/model-id` или простой псевдоним из `agents.defaults.models` только для суммирования compaction. Простые псевдонимы разрешаются до отправки; настроенные буквальные идентификаторы моделей сохраняют приоритет при коллизиях. Используйте это, когда основной сеанс должен сохранить одну модель, а сводки compaction должны выполняться на другой; если не задано, compaction использует основную модель сеанса.
- `maxActiveTranscriptBytes`: необязательный порог в байтах (`number` или строки вроде `"20mb"`), который запускает обычную локальную compaction перед запуском, когда активный JSONL превышает порог. Требует `truncateAfterCompaction`, чтобы успешная compaction могла ротировать транскрипт в меньший последующий файл. Отключено, если не задано или равно `0`.
- `notifyUser`: когда `true`, отправляет пользователю краткие уведомления при запуске compaction и после ее завершения (например, "Compacting context..." и "Compaction complete"). По умолчанию отключено, чтобы compaction выполнялась без уведомлений.
- `memoryFlush`: тихий агентный ход перед auto-compaction для сохранения долговременных воспоминаний. Задайте `model` точным провайдером/моделью, например `ollama/qwen3:8b`, когда этот служебный ход должен оставаться на локальной модели; переопределение не наследует fallback-цепочку активного сеанса. Пропускается, когда рабочая область доступна только для чтения.

### `agents.defaults.runRetries`

Границы итераций повторов внешнего цикла запуска для встроенной среды выполнения агента, чтобы предотвратить бесконечные циклы выполнения при восстановлении после сбоев. Обратите внимание, что эта настройка сейчас применяется только к встроенной среде выполнения агента, а не к средам выполнения ACP или CLI.

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

- `base`: базовое число итераций повторов запуска для внешнего цикла запуска. По умолчанию: `24`.
- `perProfile`: дополнительные итерации повторов запуска, предоставляемые каждому кандидату fallback-профиля. По умолчанию: `8`.
- `min`: минимальный абсолютный предел итераций повторов запуска. По умолчанию: `32`.
- `max`: максимальный абсолютный предел итераций повторов запуска для предотвращения неконтролируемого выполнения. По умолчанию: `160`.

### `agents.defaults.contextPruning`

Обрезает **старые результаты инструментов** из контекста в памяти перед отправкой в LLM. **Не** изменяет историю сеанса на диске.

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

<Accordion title="поведение режима cache-ttl">

- `mode: "cache-ttl"` включает проходы обрезки.
- `ttl` управляет тем, как часто обрезка может запускаться снова (после последнего обращения к кэшу).
- Обрезка сначала мягко усекает слишком большие результаты инструментов, затем при необходимости полностью очищает более старые результаты инструментов.
- `softTrimRatio` и `hardClearRatio` принимают значения от `0.0` до `1.0`; проверка конфигурации отклоняет значения вне этого диапазона.

**Мягкое усечение** сохраняет начало + конец и вставляет `...` в середину.

**Полная очистка** заменяет весь результат инструмента заполнителем.

Примечания:

- Блоки изображений никогда не усекаются и не очищаются.
- Коэффициенты основаны на символах (приблизительно), а не на точном числе токенов.
- Если сообщений assistant меньше, чем `keepLastAssistants`, обрезка пропускается.

</Accordion>

См. [Обрезка сеанса](/ru/concepts/session-pruning) для подробностей поведения.

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

- Каналы, не относящиеся к Telegram, требуют явного `*.blockStreaming: true`, чтобы включить блочные ответы.
- Переопределения каналов: `channels.<channel>.blockStreamingCoalesce` (и варианты для отдельных аккаунтов). Signal/Slack/Discord/Google Chat по умолчанию используют `minChars: 1500`.
- `humanDelay`: случайная пауза между блочными ответами. `natural` = 800-2500 мс. Переопределение для агента: `agents.list[].humanDelay`.

См. [Потоковая передача](/ru/concepts/streaming) для подробностей поведения и разбиения на фрагменты.

### Индикаторы набора текста

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

- По умолчанию: `instant` для прямых чатов/упоминаний, `message` для групповых чатов без упоминания.
- Переопределения для сеанса: `session.typingMode`, `session.typingIntervalSeconds`.

См. [индикаторы набора](/ru/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необязательная изоляция для встроенного агента. Полное руководство см. в разделе [изоляция](/ru/gateway/sandboxing).

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

<Accordion title="Сведения об изоляции">

**Бэкенд:**

- `docker`: локальная среда выполнения Docker (по умолчанию)
- `ssh`: универсальная удаленная среда выполнения на базе SSH
- `openshell`: среда выполнения OpenShell

Когда выбран `backend: "openshell"`, параметры, специфичные для среды выполнения, переносятся в
`plugins.entries.openshell.config`.

**Конфигурация бэкенда SSH:**

- `target`: цель SSH в формате `user@host[:port]`
- `command`: команда клиента SSH (по умолчанию: `ssh`)
- `workspaceRoot`: абсолютный удаленный корень, используемый для рабочих пространств по области
- `identityFile` / `certificateFile` / `knownHostsFile`: существующие локальные файлы, передаваемые в OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: встроенное содержимое или SecretRefs, которые OpenClaw материализует во временные файлы во время выполнения
- `strictHostKeyChecking` / `updateHostKeys`: параметры политики ключей хоста OpenSSH

**Приоритет аутентификации SSH:**

- `identityData` имеет приоритет над `identityFile`
- `certificateData` имеет приоритет над `certificateFile`
- `knownHostsData` имеет приоритет над `knownHostsFile`
- Значения `*Data` на базе SecretRef разрешаются из активного снимка среды выполнения секретов до запуска сеанса изоляции

**Поведение бэкенда SSH:**

- однократно заполняет удаленное рабочее пространство после создания или повторного создания
- затем поддерживает удаленное рабочее пространство SSH как каноническое
- маршрутизирует `exec`, файловые инструменты и пути к медиа через SSH
- не синхронизирует удаленные изменения обратно на хост автоматически
- не поддерживает браузерные контейнеры изоляции

**Доступ к рабочему пространству:**

- `none`: рабочее пространство изоляции для области под `~/.openclaw/sandboxes`
- `ro`: рабочее пространство изоляции в `/workspace`, рабочее пространство агента смонтировано только для чтения в `/agent`
- `rw`: рабочее пространство агента смонтировано для чтения/записи в `/workspace`

**Область:**

- `session`: контейнер и рабочее пространство для каждого сеанса
- `agent`: один контейнер и рабочее пространство на агента (по умолчанию)
- `shared`: общий контейнер и рабочее пространство (без межсеансовой изоляции)

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
          gateway: "lab", // необязательно
          gatewayEndpoint: "https://lab.example", // необязательно
          policy: "strict", // необязательный идентификатор политики OpenShell
          providers: ["openai"], // необязательно
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Режим OpenShell:**

- `mirror`: заполняет удаленную среду из локальной перед выполнением, синхронизирует обратно после выполнения; локальная рабочая область остается канонической
- `remote`: заполняет удаленную среду один раз при создании песочницы, затем сохраняет удаленную рабочую область канонической

В режиме `remote` локальные изменения на хосте, сделанные вне OpenClaw, не синхронизируются в песочницу автоматически после этапа заполнения.
Транспортом служит SSH в песочницу OpenShell, но Plugin управляет жизненным циклом песочницы и необязательной зеркальной синхронизацией.

**`setupCommand`** выполняется один раз после создания контейнера (через `sh -lc`). Требует сетевой исходящий доступ, записываемый корневой каталог, пользователя root.

**По умолчанию для контейнеров используется `network: "none"`** — установите `"bridge"` (или пользовательскую мостовую сеть), если агенту нужен исходящий доступ.
`"host"` заблокирован. `"container:<id>"` по умолчанию заблокирован, если вы явно не зададите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварийный обход).
Ходы сервера приложений Codex в активной песочнице OpenClaw используют эту же настройку исходящего доступа для своего нативного сетевого доступа в режиме кода.

**Входящие вложения** размещаются в `media/inbound/*` в активной рабочей области.

**`docker.binds`** монтирует дополнительные каталоги хоста; глобальные привязки и привязки для отдельных агентов объединяются.

**Изолированный браузер** (`sandbox.browser.enabled`): Chromium + CDP в контейнере. URL noVNC внедряется в системный промпт. Не требует `browser.enabled` в `openclaw.json`.
Доступ наблюдателя noVNC по умолчанию использует VNC-аутентификацию, а OpenClaw выдает URL с короткоживущим токеном (вместо раскрытия пароля в общем URL).

- `allowHostControl: false` (по умолчанию) блокирует для изолированных сеансов возможность нацеливаться на браузер хоста.
- `network` по умолчанию равно `openclaw-sandbox-browser` (выделенная мостовая сеть). Устанавливайте `bridge` только когда вам явно нужна глобальная мостовая связность.
- `cdpSourceRange` необязательно ограничивает входящий CDP-доступ на границе контейнера диапазоном CIDR (например, `172.21.0.1/32`).
- `sandbox.browser.binds` монтирует дополнительные каталоги хоста только в контейнер изолированного браузера. Если задано (включая `[]`), заменяет `docker.binds` для контейнера браузера.
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` снова включает расширения, если ваш рабочий процесс
    зависит от них.
  - `--renderer-process-limit=2` можно изменить с помощью
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установите `0`, чтобы использовать
    лимит процессов Chromium по умолчанию.
  - плюс `--no-sandbox`, когда включен `noSandbox`.
  - Значения по умолчанию являются базовой линией образа контейнера; используйте пользовательский образ браузера с пользовательской
    точкой входа, чтобы изменить значения контейнера по умолчанию.

</Accordion>

Изоляция браузера и `sandbox.docker.binds` доступны только для Docker.

Сборка образов (из исходного checkout):

```bash
scripts/sandbox-setup.sh           # основной образ песочницы
scripts/sandbox-browser-setup.sh   # необязательный образ браузера
```

Для установок npm без исходного checkout см. [Изоляция § Образы и настройка](/ru/gateway/sandboxing#images-and-setup) с inline-командами `docker build`.

### `agents.list` (переопределения для отдельных агентов)

Используйте `agents.list[].tts`, чтобы задать агенту собственного провайдера TTS, голос, модель,
стиль или режим auto-TTS. Блок агента глубоко объединяется поверх глобального
`messages.tts`, поэтому общие учетные данные могут оставаться в одном месте, а отдельные
агенты переопределяют только нужные им поля голоса или провайдера. Переопределение активного агента
применяется к автоматическим устным ответам, `/tts audio`, `/tts status` и
инструменту агента `tts`. См. [Преобразование текста в речь](/ru/tools/tts#per-agent-voice-overrides)
с примерами провайдеров и приоритетом.

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
        model: "anthropic/claude-opus-4-6", // или { primary, fallbacks }
        thinkingDefault: "high", // переопределение уровня мышления для отдельного агента
        reasoningDefault: "on", // переопределение видимости рассуждений для отдельного агента
        fastModeDefault: false, // переопределение быстрого режима для отдельного агента
        params: { cacheRetention: "none" }, // переопределяет совпадающие params defaults.models по ключу
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // заменяет agents.defaults.skills, если задано
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
- `default`: когда задано несколько, выигрывает первый (записывается предупреждение). Если не задан ни один, первая запись списка становится значением по умолчанию.
- `model`: строковая форма задает строгую основную модель для отдельного агента без резервной модели; объектная форма `{ primary }` также строгая, если вы не добавите `fallbacks`. Используйте `{ primary, fallbacks: [...] }`, чтобы включить для этого агента резервные варианты, или `{ primary, fallbacks: [] }`, чтобы явно задать строгое поведение. Задания Cron, которые переопределяют только `primary`, все равно наследуют резервные варианты по умолчанию, если вы не зададите `fallbacks: []`.
- `params`: параметры потока для отдельного агента, объединяемые поверх выбранной записи модели в `agents.defaults.models`. Используйте это для агент-специфичных переопределений вроде `cacheRetention`, `temperature` или `maxTokens` без дублирования всего каталога моделей.
- `tts`: необязательные переопределения преобразования текста в речь для отдельного агента. Блок глубоко объединяется поверх `messages.tts`, поэтому храните общие учетные данные провайдеров и политику резервирования в `messages.tts`, а здесь задавайте только значения, специфичные для персоны, например провайдера, голос, модель, стиль или автоматический режим.
- `skills`: необязательный список разрешенных Skills для отдельного агента. Если опущено, агент наследует `agents.defaults.skills`, когда он задан; явный список заменяет значения по умолчанию вместо объединения, а `[]` означает отсутствие Skills.
- `thinkingDefault`: необязательный уровень мышления по умолчанию для отдельного агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Переопределяет `agents.defaults.thinkingDefault` для этого агента, когда не задано переопределение для сообщения или сеанса. Выбранный профиль провайдера/модели управляет допустимыми значениями; для Google Gemini `adaptive` сохраняет динамическое мышление на стороне провайдера (`thinkingLevel` опущен в Gemini 3/3.1, `thinkingBudget: -1` в Gemini 2.5).
- `reasoningDefault`: необязательная видимость рассуждений по умолчанию для отдельного агента (`on | off | stream`). Переопределяет `agents.defaults.reasoningDefault` для этого агента, когда не задано переопределение рассуждений для сообщения или сеанса.
- `fastModeDefault`: необязательное значение по умолчанию для быстрого режима (`"auto" | true | false`). Применяется, когда не задано переопределение быстрого режима для сообщения или сеанса.
- `models`: необязательные переопределения каталога моделей/среды выполнения для отдельного агента, индексированные полными идентификаторами `provider/model`. Используйте `models["provider/model"].agentRuntime` для исключений среды выполнения отдельного агента.
- `runtime`: необязательный дескриптор среды выполнения для отдельного агента. Используйте `type: "acp"` с настройками по умолчанию `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), когда агент должен по умолчанию использовать сеансы ACP harness.
- `identity.avatar`: путь относительно рабочей области, URL `http(s)` или URI `data:`.
- Локальные файлы изображений `identity.avatar` с путями относительно рабочей области ограничены 2 МБ. URL `http(s)` и URI `data:` не проверяются локальным ограничением размера файла.
- `identity` выводит значения по умолчанию: `ackReaction` из `emoji`, `mentionPatterns` из `name`/`emoji`.
- `subagents.allowAgents`: список разрешенных идентификаторов настроенных агентов для явных целей `sessions_spawn.agentId` (`["*"]` = любая настроенная цель; по умолчанию: только тот же агент). Включите идентификатор запрашивающего, когда должны быть разрешены самонацеленные вызовы `agentId`. Устаревшие записи, конфигурация агента для которых была удалена, отклоняются `sessions_spawn` и опускаются из `agents_list`; запустите `openclaw doctor --fix`, чтобы очистить их, или добавьте минимальную запись `agents.list[]`, если эта цель должна оставаться доступной для запуска с наследованием значений по умолчанию.
- Защита наследования песочницы: если сеанс запрашивающего изолирован в песочнице, `sessions_spawn` отклоняет цели, которые запускались бы без песочницы.
- `subagents.requireAgentId`: когда true, блокирует вызовы `sessions_spawn`, в которых опущен `agentId` (принуждает к явному выбору профиля; по умолчанию: false).

---

## Маршрутизация нескольких агентов

Запускайте несколько изолированных агентов внутри одного Gateway. См. [Несколько агентов](/ru/concepts/multi-agent).

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

- `type` (необязательно): `route` для обычной маршрутизации (отсутствующий тип по умолчанию означает route), `acp` для постоянных привязок разговоров ACP.
- `match.channel` (обязательно)
- `match.accountId` (необязательно; `*` = любая учетная запись; опущено = учетная запись по умолчанию)
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

Внутри каждого уровня выигрывает первая совпадающая запись `bindings`.

Для записей `type: "acp"` OpenClaw разрешает по точной идентичности разговора (`match.channel` + учетная запись + `match.peer.id`) и не использует указанный выше порядок уровней привязки маршрутов.

### Профили доступа для отдельных агентов

<Accordion title="Полный доступ (без песочницы)">

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

<Accordion title="Инструменты только для чтения + рабочая область">

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

<Accordion title="Без доступа к файловой системе (только сообщения)">

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

См. [песочницу и инструменты для нескольких агентов](/ru/tools/multi-agent-sandbox-tools), где описаны детали приоритетов.

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

<Accordion title="Сведения о полях сеанса">

- **`scope`**: базовая стратегия группировки сеансов для контекстов группового чата.
  - `per-sender` (по умолчанию): каждый отправитель получает изолированный сеанс внутри контекста канала.
  - `global`: все участники в контексте канала используют один общий сеанс (используйте только когда требуется общий контекст).
- **`dmScope`**: как группируются личные сообщения.
  - `main`: все личные сообщения используют основной сеанс.
  - `per-peer`: изоляция по id отправителя между каналами.
  - `per-channel-peer`: изоляция по каналу + отправителю (рекомендуется для многопользовательских входящих).
  - `per-account-channel-peer`: изоляция по аккаунту + каналу + отправителю (рекомендуется для нескольких аккаунтов).
- **`identityLinks`**: сопоставляет канонические id с одноранговыми участниками с префиксом поставщика для совместного использования сеансов между каналами. Команды Dock, такие как `/dock_discord`, используют то же сопоставление, чтобы переключить маршрут ответа активного сеанса на другого связанного участника канала; см. [стыковку каналов](/ru/concepts/channel-docking).
- **`reset`**: основная политика сброса. `daily` сбрасывает в локальное время `atHour`; `idle` сбрасывает после `idleMinutes`. Если настроены оба варианта, срабатывает тот, срок которого истекает раньше. Свежесть ежедневного сброса использует `sessionStartedAt` строки сеанса; свежесть сброса по бездействию использует `lastInteractionAt`. Фоновые/системные записи событий, такие как Heartbeat, пробуждения Cron, уведомления exec и служебный учет Gateway, могут обновлять `updatedAt`, но не поддерживают свежесть ежедневных/неактивных сеансов.
- **`resetByType`**: переопределения по типам (`direct`, `group`, `thread`). Устаревшее `dm` принимается как псевдоним для `direct`.
- **`mainKey`**: устаревшее поле. Среда выполнения всегда использует `"main"` для основного сегмента прямого чата.
- **`agentToAgent.maxPingPongTurns`**: максимальное число ответных ходов между агентами во время обменов агент-агент (целое число, диапазон: `0`-`20`, по умолчанию: `5`). `0` отключает цепочку ping-pong.
- **`sendPolicy`**: сопоставление по `channel`, `chatType` (`direct|group|channel`, с устаревшим псевдонимом `dm`), `keyPrefix` или `rawKeyPrefix`. Первый запрет имеет приоритет.
- **`maintenance`**: элементы управления очисткой и удержанием хранилища сеансов.
  - `mode`: `enforce` применяет очистку и используется по умолчанию; `warn` только выводит предупреждения.
  - `pruneAfter`: порог возраста для устаревших записей (по умолчанию `30d`).
  - `maxEntries`: максимальное количество записей в `sessions.json` (по умолчанию `500`). Среда выполнения записывает пакетную очистку с небольшим буфером верхнего порога для лимитов производственного размера; `openclaw sessions cleanup --enforce` применяет лимит немедленно.
  - Краткоживущие сеансы проверок model-run в Gateway используют фиксированное удержание `24h`, но очистка зависит от давления: она удаляет устаревшие строгие строки проверок model-run только при достижении давления обслуживания/лимита записей сеансов. Подходят только строгие явные ключи проверок, соответствующие `agent:*:explicit:model-run-<uuid>`; обычные прямые, групповые, потоковые, cron, hook, Heartbeat, ACP и сеансы субагентов не наследуют это 24-часовое удержание. Когда запускается очистка model-run, она выполняется перед более широкой очисткой устаревших записей `pruneAfter` и лимитом `maxEntries`.
  - `rotateBytes`: устарело и игнорируется; `openclaw doctor --fix` удаляет его из старых конфигураций.
  - `resetArchiveRetention`: удержание архивов расшифровок `*.reset.<timestamp>`. По умолчанию равно `pruneAfter`; установите `false`, чтобы отключить.
  - `maxDiskBytes`: необязательный дисковый бюджет каталога сеансов. В режиме `warn` записывает предупреждения в журнал; в режиме `enforce` сначала удаляет самые старые артефакты/сеансы.
  - `highWaterBytes`: необязательная цель после очистки бюджета. По умолчанию равно `80%` от `maxDiskBytes`.
- **`threadBindings`**: глобальные значения по умолчанию для возможностей сеансов, привязанных к веткам.
  - `enabled`: основной переключатель по умолчанию (поставщики могут переопределять; Discord использует `channels.discord.threadBindings.enabled`)
  - `idleHours`: авторасфокусировка по умолчанию после бездействия в часах (`0` отключает; поставщики могут переопределять)
  - `maxAgeHours`: жесткий максимальный возраст по умолчанию в часах (`0` отключает; поставщики могут переопределять)
  - `spawnSessions`: стандартный шлюз для создания привязанных к веткам рабочих сеансов из `sessions_spawn` и ACP-порождений веток. По умолчанию `true`, когда привязки веток включены; поставщики/аккаунты могут переопределять.
  - `defaultSpawnContext`: стандартный нативный контекст субагента для порождений, привязанных к веткам (`"fork"` или `"isolated"`). По умолчанию `"fork"`.

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

Разрешение (побеждает наиболее конкретное): аккаунт → канал → глобальное. `""` отключает и останавливает каскад. `"auto"` выводит `[{identity.name}]`.

**Переменные шаблона:**

| Переменная        | Описание                    | Пример                      |
| ----------------- | --------------------------- | --------------------------- |
| `{model}`         | Короткое имя модели         | `claude-opus-4-6`           |
| `{modelFull}`     | Полный идентификатор модели | `anthropic/claude-opus-4-6` |
| `{provider}`      | Имя поставщика              | `anthropic`                 |
| `{thinkingLevel}` | Текущий уровень мышления    | `high`, `low`, `off`        |
| `{identity.name}` | Имя идентичности агента     | (то же, что `"auto"`)       |

Переменные не чувствительны к регистру. `{think}` — псевдоним для `{thinkingLevel}`.

### Реакция подтверждения

- По умолчанию используется `identity.emoji` активного агента, иначе `"👀"`. Установите `""`, чтобы отключить.
- Переопределения для канала: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок разрешения: аккаунт → канал → `messages.ackReaction` → резервное значение идентичности.
- Область: `group-mentions` (по умолчанию), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: удаляет подтверждение после ответа в каналах, поддерживающих реакции, таких как Slack, Discord, Telegram, WhatsApp и iMessage.
- `messages.statusReactions.enabled`: включает реакции статуса жизненного цикла в Slack, Discord, Telegram и WhatsApp.
  В Slack и Discord неустановленное значение сохраняет реакции статуса включенными, когда активны реакции подтверждения.
  В Telegram и WhatsApp явно установите `true`, чтобы включить реакции статуса жизненного цикла.
- `messages.statusReactions.emojis`: переопределяет ключи эмодзи жизненного цикла:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` и `stallHard`.
  Telegram разрешает только фиксированный набор реакций, поэтому неподдерживаемые настроенные эмодзи откатываются
  к ближайшему поддерживаемому варианту статуса для этого чата.

### Дебаунс входящих сообщений

Объединяет быстрые текстовые сообщения от одного отправителя в один ход агента. Медиа/вложения сбрасывают буфер немедленно. Управляющие команды обходят дебаунс.

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

- `auto` управляет режимом auto-TTS по умолчанию: `off`, `always`, `inbound` или `tagged`. `/tts on|off` может переопределять локальные настройки, а `/tts status` показывает фактическое состояние.
- `summaryModel` переопределяет `agents.defaults.model.primary` для автоматической сводки.
- `modelOverrides` включен по умолчанию; `modelOverrides.allowProvider` по умолчанию равен `false` (требует явного включения).
- API-ключи используют резервные значения `ELEVENLABS_API_KEY`/`XI_API_KEY` и `OPENAI_API_KEY`.
- Встроенные поставщики речи принадлежат Plugin. Если задан `plugins.allow`, включите каждый Plugin поставщика TTS, который хотите использовать, например `microsoft` для Edge TTS. Устаревший идентификатор поставщика `edge` принимается как псевдоним для `microsoft`.
- `providers.openai.baseUrl` переопределяет конечную точку OpenAI TTS. Порядок разрешения: конфигурация, затем `OPENAI_TTS_BASE_URL`, затем `https://api.openai.com/v1`.
- Когда `providers.openai.baseUrl` указывает на конечную точку не OpenAI, OpenClaw рассматривает ее как OpenAI-совместимый сервер TTS и ослабляет проверку модели/голоса.

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

- `talk.provider` должен соответствовать ключу в `talk.providers`, когда настроено несколько поставщиков Talk.
- Устаревшие плоские ключи Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) существуют только для совместимости. Запустите `openclaw doctor --fix`, чтобы переписать сохраненную конфигурацию в `talk.providers.<provider>`.
- Идентификаторы голосов используют резервные значения `ELEVENLABS_VOICE_ID` или `SAG_VOICE_ID`.
- `providers.*.apiKey` принимает строки открытого текста или объекты SecretRef.
- Резервное значение `ELEVENLABS_API_KEY` применяется только когда API-ключ Talk не настроен.
- `providers.*.voiceAliases` позволяет директивам Talk использовать удобные имена.
- `providers.mlx.modelId` выбирает репозиторий Hugging Face, используемый локальным помощником MLX на macOS. Если не указано, macOS использует `mlx-community/Soprano-80M-bf16`.
- Воспроизведение MLX на macOS выполняется через встроенный помощник `openclaw-mlx-tts`, если он присутствует, или через исполняемый файл в `PATH`; `OPENCLAW_MLX_TTS_BIN` переопределяет путь к помощнику для разработки.
- `consultThinkingLevel` управляет уровнем thinking для полного запуска агента OpenClaw за вызовами Control UI Talk realtime `openclaw_agent_consult`. Оставьте незаданным, чтобы сохранить обычное поведение сеанса/модели.
- `consultFastMode` задает одноразовое переопределение fast-mode для realtime-консультаций Control UI Talk без изменения обычной настройки fast-mode сеанса.
- `speechLocale` задает идентификатор локали BCP 47, используемый распознаванием речи Talk на iOS/macOS. Оставьте незаданным, чтобы использовать значение устройства по умолчанию.
- `silenceTimeoutMs` управляет тем, как долго режим Talk ждет после молчания пользователя перед отправкой транскрипта. Если не задано, сохраняется окно паузы платформы по умолчанию (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` добавляет системные инструкции для поставщика к встроенному realtime-промпту OpenClaw, чтобы можно было настраивать голосовой стиль без потери стандартных указаний `openclaw_agent_consult`.
- `realtime.consultRouting` управляет резервной маршрутизацией реле Gateway, когда realtime-поставщик создает финальный пользовательский транскрипт без `openclaw_agent_consult`: `provider-direct` сохраняет прямые ответы поставщика, а `force-agent-consult` маршрутизирует финализированный запрос через OpenClaw.

---

## Связанные материалы

- [Справочник по конфигурации](/ru/gateway/configuration-reference) — все остальные ключи конфигурации
- [Конфигурация](/ru/gateway/configuration) — распространенные задачи и быстрая настройка
- [Примеры конфигурации](/ru/gateway/configuration-examples)
