---
read_when:
    - Налаштування типових параметрів агента (моделі, мислення, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування маршрутизації між кількома агентами та прив’язок
    - Налаштування поведінки сесії, доставки повідомлень і режиму розмови
summary: Типові налаштування агента, маршрутизація між кількома агентами, сесія, повідомлення та конфігурація розмови
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-04-25T17:32:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb090bad584cab0d22bc4788652f0fd6d7f2931be1fe40d3907f8ef2123a433b
    source_path: gateway/config-agents.md
    workflow: 15
---

Ключі конфігурації в межах агента у `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` та `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [Довідник із конфігурації](/uk/gateway/configuration-reference).

## Типові параметри агента

### `agents.defaults.workspace`

Типове значення: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий кореневий каталог репозиторію, що показується в рядку Runtime системного запиту. Якщо не задано, OpenClaw автоматично визначає його, підіймаючись угору від робочого простору.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий типовий список дозволених Skills для агентів, у яких не задано
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює типові значення
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

- Не вказуйте `agents.defaults.skills`, щоб типово дозволити необмежені Skills.
- Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
- Встановіть `agents.list[].skills: []`, щоб не дозволити жодних Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента;
  він не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли робочого простору вставляються до системного запиту. Типове значення: `"always"`.

- `"continuation-skip"`: на безпечних ходах продовження (після завершеної відповіді помічника) повторна вставка bootstrap-контексту робочого простору пропускається, що зменшує розмір запиту. Запуски Heartbeat і повторні спроби після Compaction все одно перебудовують контекст.
- `"never"`: вимикає вставку bootstrap-файлів робочого простору та файлів контексту на кожному ході. Використовуйте це лише для агентів, які повністю керують власним життєвим циклом запиту (власні рушії контексту, нативні середовища виконання, що самі формують контекст, або спеціалізовані робочі процеси без bootstrap). Ходи Heartbeat і відновлення після Compaction також пропускають вставку.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на один bootstrap-файл робочого простору перед обрізанням. Типове значення: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що вставляються з усіх bootstrap-файлів робочого простору. Типове значення: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента текстом попередження, коли bootstrap-контекст обрізається.
Типове значення: `"once"`.

- `"off"`: ніколи не вставляти текст попередження до системного запиту.
- `"once"`: вставляти попередження один раз для кожного унікального сигнатурного випадку обрізання (рекомендовано).
- `"always"`: вставляти попередження під час кожного запуску, коли є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта відповідальності за бюджет контексту

OpenClaw має кілька великих бюджетів для запиту/контексту, і вони
навмисно розділені між підсистемами, а не зведені до одного загального
параметра.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайна вставка bootstrap-контексту робочого простору.
- `agents.defaults.startupContext.*`:
  одноразова початкова преамбула для `/new` і `/reset`, включно з недавніми
  файлами `memory/*.md` за день.
- `skills.limits.*`:
  компактний список Skills, вставлений до системного запиту.
- `agents.defaults.contextLimits.*`:
  обмежені витяги середовища виконання та вставлені блоки, якими володіє середовище виконання.
- `memory.qmd.limits.*`:
  фрагмент індексованого пошуку в пам’яті та налаштування розміру вставки.

Використовуйте відповідне перевизначення для конкретного агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує початковою преамбулою першого ходу, що вставляється під час простих запусків `/new` і `/reset`.

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

Спільні типові значення для обмежених поверхонь контексту середовища виконання.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: типове обмеження витягу `memory_get` перед додаванням
  метаданих обрізання та сповіщення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків `memory_get`, якщо `lines`
  не вказано.
- `toolResultMaxChars`: поточне обмеження результату інструмента, що використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: обмеження витягу AGENTS.md, що використовується під час вставки
  оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для конкретного агента для спільних параметрів `contextLimits`. Пропущені поля успадковуються
з `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Глобальне обмеження для компактного списку Skills, вставленого до системного запиту. Це
не впливає на читання файлів `SKILL.md` на вимогу.

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

Перевизначення бюджету запиту Skills для конкретного агента.

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

Максимальний розмір у пікселях для довшої сторони зображення в блоках зображень транскрипту/інструментів перед викликами провайдера.
Типове значення: `1200`.

Менші значення зазвичай зменшують використання vision-токенів і розмір тіла запиту для сценаріїв із великою кількістю знімків екрана.
Більші значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного запиту (не для часових міток повідомлень). Якщо не задано, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в системному запиті. Типове значення: `auto` (налаштування ОС).

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
      params: { cacheRetention: "long" }, // глобальні типові параметри провайдера
      embeddedHarness: {
        runtime: "pi", // pi | auto | зареєстрований ідентифікатор harness, наприклад codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Форма рядка задає лише основну модель.
  - Форма об’єкта задає основну модель і впорядкований список резервних моделей для відмовостійкості.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як конфігурація vision-моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal або `openai/gpt-image-2` для OpenAI Images.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2`, `FAL_KEY` для `fal/*`).
  - Якщо не вказано, `image_generate` усе одно може визначити типове значення провайдера з налаштованою автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації зображень у порядку їхніх ідентифікаторів провайдерів.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо не вказано, `music_generate` усе одно може визначити типове значення провайдера з налаштованою автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації музики в порядку їхніх ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо не вказано, `video_generate` усе одно може визначити типове значення провайдера з налаштованою автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації відео в порядку їхніх ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість до 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо не вказано, інструмент PDF використовує резервно `imageModel`, а потім визначену модель сесії/типову модель.
- `pdfMaxBytesMb`: типове обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, що враховується режимом резервного вилучення в інструменті `pdf`.
- `verboseDefault`: типовий рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. Типове значення: `"off"`.
- `elevatedDefault`: типовий рівень elevated-output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типове значення: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ або `openai-codex/gpt-5.5` для Codex OAuth). Якщо ви не вказуєте провайдера, OpenClaw спочатку намагається знайти alias, потім унікальний збіг налаштованого провайдера для цього точного ідентифікатора моделі, і лише потім повертається до налаштованого типового провайдера (застаріла поведінка сумісності, тому краще явно вказувати `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw переходить до першої налаштованої пари провайдер/модель замість того, щоб показувати застаріле типове значення від видаленого провайдера.
- `models`: налаштований каталог моделей і список дозволених значень для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `extra_body`/`extraBody`).
  - Безпечне редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відмовляється від замін, які прибрали б наявні записи зі списку дозволених значень, якщо ви не передасте `--replace`.
  - Потоки налаштування/онбордингу на рівні провайдера об’єднують вибрані моделі провайдера в цю карту та зберігають уже налаштованих, не пов’язаних із цим, провайдерів.
  - Для прямих моделей OpenAI Responses серверний Compaction вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити вставку `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [Серверний Compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні типові параметри провайдера, які застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет об’єднання `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для конкретної моделі), потім `agents.list[].params` (для відповідного id агента) перевизначає за ключем. Докладніше див. у [Кешування запитів](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений JSON passthrough, що об’єднується з тілами запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, додаткове тіло має пріоритет; не нативні маршрути completions після цього все одно видаляють специфічний для OpenAI `store`.
- `embeddedHarness`: типова політика низькорівневого середовища виконання для вбудованого агента. Якщо runtime не вказано, типово використовується OpenClaw Pi. Використовуйте `runtime: "pi"`, щоб примусово ввімкнути вбудований harness PI, `runtime: "auto"`, щоб зареєстровані harness-и Plugin могли брати на себе підтримувані моделі, або зареєстрований ідентифікатор harness, наприклад `runtime: "codex"`. Встановіть `fallback: "none"`, щоб вимкнути автоматичний резервний перехід на PI. Явні runtime-и Plugin, як-от `codex`, типово працюють у режимі fail-closed, якщо ви не встановите `fallback: "pi"` у тій самій області перевизначення. Зберігайте посилання на моделі в канонічній формі `provider/model`; вибирайте Codex, Claude CLI, Gemini CLI та інші бекенди виконання через конфігурацію runtime, а не через застарілі префікси runtime-провайдерів. Див. [Середовища виконання агентів](/uk/concepts/agent-runtimes), щоб зрозуміти, чим це відрізняється від вибору провайдера/моделі.
- Засоби запису конфігурації, які змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення резервних моделей), зберігають канонічну форму об’єкта та за можливості зберігають наявні списки резервних моделей.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сесіями (кожна сесія все одно виконується послідовно). Типове значення: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` керує тим, який низькорівневий виконавець обробляє ходи вбудованого агента.
У більшості розгортань варто залишити типове середовище виконання OpenClaw Pi.
Використовуйте це, коли довірений Plugin надає нативний harness, наприклад вбудований
harness сервера застосунку Codex. Для загального розуміння див.
[Середовища виконання агентів](/uk/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` або ідентифікатор зареєстрованого harness Plugin. Вбудований Plugin Codex реєструє `codex`.
- `fallback`: `"pi"` або `"none"`. У режимі `runtime: "auto"` пропущене значення `fallback` типово дорівнює `"pi"`, щоб старі конфігурації могли й далі використовувати PI, коли жоден harness Plugin не бере запуск на себе. У режимі явного runtime Plugin, наприклад `runtime: "codex"`, пропущене значення `fallback` типово дорівнює `"none"`, щоб відсутній harness завершувався помилкою замість тихого використання PI. Перевизначення runtime не успадковують `fallback` із ширшої області; задавайте `fallback: "pi"` поруч з явним runtime, коли свідомо хочете таку сумісність. Помилки вибраного harness Plugin завжди показуються безпосередньо.
- Перевизначення через середовище: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` перевизначає `fallback` для цього процесу.
- Для розгортань лише з Codex задайте `model: "openai/gpt-5.5"` і `embeddedHarness.runtime: "codex"`. Ви також можете явно задати `embeddedHarness.fallback: "none"` для читабельності; це типове значення для явних runtime-ів Plugin.
- Вибір harness прив’язується до id сесії після першого вбудованого запуску. Зміни конфігурації/середовища впливають на нові або скинуті сесії, а не на наявний транскрипт. Застарілі сесії з історією транскрипту, але без записаної прив’язки, вважаються прив’язаними до PI. `/status` показує фактичне середовище виконання, наприклад `Runtime: OpenClaw Pi Default` або `Runtime: OpenAI Codex`.
- Це керує лише вбудованим chat-harness. Генерація медіа, vision, PDF, музика, відео та TTS, як і раніше, використовують свої налаштування провайдера/моделі.

**Вбудовані скорочення alias** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

| Alias               | Модель                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Ваші налаштовані alias завжди мають пріоритет над типовими.

Моделі Z.AI GLM-4.x автоматично вмикають режим thinking, якщо ви не задасте `--thinking off` або не визначите `agents.defaults.models["zai/<model>"].params.thinking` самостійно.
Для моделей Z.AI типово ввімкнено `tool_stream` для потокової передачі викликів інструментів. Встановіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Для моделей Anthropic Claude 4.6 типово використовується `adaptive` thinking, якщо явний рівень thinking не задано.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних запусків лише з текстом (без викликів інструментів). Корисно як запасний варіант, коли API-провайдери недоступні.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Або використовуйте systemPromptFileArg, якщо CLI приймає прапорець файла запиту.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-бекенди орієнтовані насамперед на текст; інструменти завжди вимкнені.
- Сесії підтримуються, якщо задано `sessionArg`.
- Передавання зображень підтримується, якщо `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь системний запит, зібраний OpenClaw, фіксованим рядком. Задається на типовому рівні (`agents.defaults.systemPromptOverride`) або для конкретного агента (`agents.list[].systemPromptOverride`). Значення для конкретного агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із запитами.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Незалежні від провайдера накладення запиту, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки між провайдерами; `personality` керує лише шаром дружнього стилю взаємодії.

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

- `"friendly"` (типове значення) і `"on"` вмикають шар дружнього стилю взаємодії.
- `"off"` вимикає лише дружній шар; позначений контракт поведінки GPT-5 залишається ввімкненим.
- Застаріле `plugins.entries.openai.config.personality` усе ще читається, коли цей спільний параметр не задано.

### `agents.defaults.heartbeat`

Періодичні запуски Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m вимикає
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // типове значення: true; false прибирає розділ Heartbeat із системного запиту
        lightContext: false, // типове значення: false; true залишає лише HEARTBEAT.md із bootstrap-файлів робочого простору
        isolatedSession: false, // типове значення: false; true запускає кожен heartbeat у новій сесії (без історії розмови)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (типове значення) | block
        target: "none", // типове значення: none | варіанти: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: рядок тривалості (ms/s/m/h). Типове значення: `30m` (автентифікація через API-ключ) або `1h` (автентифікація через OAuth). Встановіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: якщо false, прибирає розділ Heartbeat із системного запиту та пропускає вставку `HEARTBEAT.md` у bootstrap-контекст. Типове значення: `true`.
- `suppressToolErrorWarnings`: якщо true, пригнічує корисні навантаження попереджень про помилки інструментів під час запусків heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного ходу агента heartbeat, після чого його буде перервано. Якщо не вказано, використовується `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої доставки/DM. `allow` (типове значення) дозволяє доставку до прямої цілі. `block` пригнічує доставку до прямої цілі та видає `reason=dm-blocked`.
- `lightContext`: якщо true, запуски heartbeat використовують полегшений bootstrap-контекст і з bootstrap-файлів робочого простору залишають лише `HEARTBEAT.md`.
- `isolatedSession`: якщо true, кожен heartbeat запускається в новій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як у Cron `sessionTarget: "isolated"`. Зменшує витрати токенів на один heartbeat приблизно зі ~100K до ~2-5K токенів.
- Для конкретного агента: задайте `agents.list[].heartbeat`. Якщо будь-який агент визначає `heartbeat`, **heartbeat запускаються лише для цих агентів**.
- Heartbeat виконують повні ходи агента — коротші інтервали витрачають більше токенів.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id зареєстрованого Plugin провайдера compaction (необов’язково)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // використовується, коли identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторну вставку
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов’язкове перевизначення моделі лише для compaction
        notifyUser: true, // надсилати короткі сповіщення користувачу, коли compaction починається й завершується (типове значення: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` або `safeguard` (узагальнення частинами для довгої історії). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin провайдера compaction. Якщо задано, замість вбудованого узагальнення LLM викликається `summarize()` провайдера. У разі помилки повертається до вбудованого механізму. Установлення провайдера примусово вмикає `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції compaction, після чого OpenClaw її перериває. Типове значення: `900`.
- `keepRecentTokens`: бюджет точки відсікання Pi для збереження найсвіжішого хвоста транскрипту дослівно. Ручний `/compact` враховує це, якщо параметр явно задано; інакше ручний compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (типове значення), `off` або `custom`. `strict` додає вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час узагальнення compaction.
- `identifierInstructions`: необов’язковий власний текст для збереження ідентифікаторів, що використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки повторної спроби при некоректному виводі для підсумків safeguard. Типово ввімкнено в режимі safeguard; установіть `enabled: false`, щоб пропустити перевірку.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md для повторної вставки після compaction. Типово: `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторну вставку. Якщо параметр не задано або явно задано цю типову пару, старі заголовки `Every Session`/`Safety` також приймаються як резервний варіант для сумісності.
- `model`: необов’язкове перевизначення `provider/model-id` лише для узагальнення compaction. Використовуйте це, коли основна сесія має залишатися на одній моделі, а підсумки compaction повинні виконуватися на іншій; якщо не задано, compaction використовує основну модель сесії.
- `notifyUser`: якщо `true`, надсилає користувачу короткі сповіщення, коли compaction починається і коли завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб compaction залишався безшумним.
- `memoryFlush`: тихий агентний хід перед автоматичним compaction для збереження довготривалої пам’яті. Пропускається, якщо робочий простір доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // тривалість (ms/s/m/h), типова одиниця: хвилини
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

<Accordion title="Поведінка режиму cache-ttl">

- `mode: "cache-ttl"` вмикає проходи обрізання.
- `ttl` визначає, як часто обрізання може запускатися знову (після останнього дотику до кешу).
- Обрізання спочатку м’яко скорочує надто великі результати інструментів, а потім за потреби повністю очищає старіші результати інструментів.

**М’яке скорочення** зберігає початок і кінець та вставляє посередині `...`.

**Повне очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не скорочуються й не очищаються.
- Співвідношення обчислюються за символами (приблизно), а не за точними кількостями токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень помічника, обрізання пропускається.

</Accordion>

Докладніше про поведінку див. у [Обрізання сесії](/uk/concepts/session-pruning).

### Блокове потокове передавання

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (використовуйте minMs/maxMs)
    },
  },
}
```

- Для каналів, відмінних від Telegram, щоб увімкнути блочні відповіді, потрібно явно задати `*.blockStreaming: true`.
- Перевизначення каналу: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Для Signal/Slack/Discord/Google Chat типовим є `minChars: 1500`.
- `humanDelay`: випадкова пауза між блочними відповідями. `natural` = 800–2500 мс. Перевизначення для конкретного агента: `agents.list[].humanDelay`.

Докладніше про поведінку та деталі поділу на частини див. у [Потокове передавання](/uk/concepts/streaming).

### Індикатори набору

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

- Типові значення: `instant` для прямих чатів/згадувань, `message` для групових чатів без згадування.
- Перевизначення для сесії: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Індикатори набору](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова ізоляція sandbox для вбудованого агента. Повний посібник див. у [Ізоляція sandbox](/uk/gateway/sandboxing).

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
          // Також підтримуються SecretRefs / вбудований вміст:
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

<Accordion title="Деталі sandbox">

**Бекенд:**

- `docker`: локальне середовище виконання Docker (типове)
- `ssh`: універсальне віддалене середовище виконання на основі SSH
- `openshell`: середовище виконання OpenShell

Коли вибрано `backend: "openshell"`, специфічні для цього середовища виконання параметри переміщуються до
`plugins.entries.openshell.config`.

**Конфігурація бекенда SSH:**

- `target`: SSH-ціль у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (типове значення: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для робочих просторів у межах кожної області
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRefs, які OpenClaw матеріалізує у тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef визначаються з активного знімка середовища виконання секретів до початку сесії sandbox

**Поведінка бекенда SSH:**

- один раз заповнює віддалений робочий простір після створення або повторного створення
- потім зберігає віддалений SSH-робочий простір як канонічний
- маршрутизує `exec`, файлові інструменти та шляхи до медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує контейнери браузера в sandbox

**Доступ до робочого простору:**

- `none`: робочий простір sandbox для кожної області в `~/.openclaw/sandboxes`
- `ro`: робочий простір sandbox у `/workspace`, робочий простір агента монтується лише для читання в `/agent`
- `rw`: робочий простір агента монтується для читання і запису в `/workspace`

**Область:**

- `session`: окремий контейнер і робочий простір для кожної сесії
- `agent`: один контейнер і робочий простір на агента (типове значення)
- `shared`: спільний контейнер і робочий простір (без ізоляції між сесіями)

**Конфігурація Plugin OpenShell:**

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
          gateway: "lab", // необов’язково
          gatewayEndpoint: "https://lab.example", // необов’язково
          policy: "strict", // необов’язковий id політики OpenShell
          providers: ["openai"], // необов’язково
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Режим OpenShell:**

- `mirror`: заповнює віддалене середовище з локального перед `exec`, синхронізує назад після `exec`; локальний робочий простір залишається канонічним
- `remote`: один раз заповнює віддалене середовище під час створення sandbox, після чого віддалений робочий простір залишається канонічним

У режимі `remote` зміни, внесені локально на хості поза OpenClaw, не синхронізуються до sandbox автоматично після етапу початкового заповнення.
Транспортом є SSH до sandbox OpenShell, але Plugin керує життєвим циклом sandbox і необов’язковою дзеркальною синхронізацією.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потребує виходу в мережу, записуваного кореня та користувача root.

**Для контейнерів типовим є `network: "none"`** — установіть `"bridge"` (або власну мережу bridge), якщо агенту потрібен вихід назовні.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний виняток).

**Вхідні вкладення** розміщуються в `media/inbound/*` активного робочого простору.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки й прив’язки для конкретного агента об’єднуються.

**Браузер у sandbox** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється до системного запиту. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача noVNC типово використовує автентифікацію VNC, і OpenClaw видає URL із короткоживучим токеном (замість відкриття пароля в спільному URL).

- `allowHostControl: false` (типове значення) блокує для ізольованих сесій націлювання на браузер хоста.
- `network` типово дорівнює `openclaw-sandbox-browser` (окрема мережа bridge). Установлюйте `bridge` лише тоді, коли вам явно потрібне глобальне з’єднання через bridge.
- `cdpSourceRange` за потреби обмежує вхідний CDP-трафік на межі контейнера діапазоном CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера sandbox. Якщо параметр задано (зокрема як `[]`), він замінює `docker.binds` для контейнера браузера.
- Типові параметри запуску визначено в `scripts/sandbox-browser-entrypoint.sh` і налаштовано для контейнерних хостів:
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
  - `--disable-extensions` (типово ввімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    типово ввімкнені, і їх можна вимкнути за допомогою
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використати
    типове обмеження процесів Chromium.
  - а також `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Типові параметри є базовими для образу контейнера; щоб змінити типові значення контейнера,
    використовуйте власний браузерний образ із власним entrypoint.

</Accordion>

Ізоляція браузера в sandbox і `sandbox.docker.binds` підтримуються лише для Docker.

Збірка образів:

```bash
scripts/sandbox-setup.sh           # основний образ sandbox
scripts/sandbox-browser-setup.sh   # необов’язковий образ браузера
```

### `agents.list` (перевизначення для конкретного агента)

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
        model: "anthropic/claude-opus-4-6", // або { primary, fallbacks }
        thinkingDefault: "high", // перевизначення рівня thinking для конкретного агента
        reasoningDefault: "on", // перевизначення видимості reasoning для конкретного агента
        fastModeDefault: false, // перевизначення швидкого режиму для конкретного агента
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // перевизначає ключі у відповідних defaults.models params
        skills: ["docs-search"], // замінює agents.defaults.skills, якщо задано
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

- `id`: стабільний id агента (обов’язково).
- `default`: якщо задано для кількох агентів, перший має пріоритет (записується попередження). Якщо не задано ні для кого, типовим стає перший елемент списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні резервні моделі). Завдання Cron, які перевизначають лише `primary`, усе одно успадковують типові резервні моделі, якщо ви не встановите `fallbacks: []`.
- `params`: параметри потоку для конкретного агента, які об’єднуються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень, як-от `cacheRetention`, `temperature` або `maxTokens`, не дублюючи весь каталог моделей.
- `skills`: необов’язковий список дозволених Skills для конкретного агента. Якщо його не вказано, агент успадковує `agents.defaults.skills`, якщо той задано; явний список замінює типові значення, а не об’єднується з ними, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень thinking для конкретного агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для повідомлення або сесії. Вибраний профіль провайдера/моделі визначає, які значення допустимі; для Google Gemini `adaptive` зберігає динамічний thinking під контролем провайдера (`thinkingLevel` не задається в Gemini 3/3.1, `thinkingBudget: -1` у Gemini 2.5).
- `reasoningDefault`: необов’язкове типове значення видимості reasoning для конкретного агента (`on | off | stream`). Застосовується, коли не задано перевизначення reasoning для повідомлення або сесії.
- `fastModeDefault`: необов’язкове типове значення швидкого режиму для конкретного агента (`true | false`). Застосовується, коли не задано перевизначення швидкого режиму для повідомлення або сесії.
- `embeddedHarness`: необов’язкове перевизначення політики низькорівневого harness для конкретного агента. Використовуйте `{ runtime: "codex" }`, щоб зробити одного агента лише для Codex, тоді як інші агенти зберігатимуть типовий резервний перехід на PI в режимі `auto`.
- `runtime`: необов’язковий дескриптор runtime для конкретного агента. Використовуйте `type: "acp"` разом із типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент за замовчуванням має працювати з сесіями harness ACP.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- Для `identity` типові значення виводяться автоматично: `ackReaction` із `emoji`, `mentionPatterns` із `name`/`emoji`.
- `subagents.allowAgents`: список дозволених id агентів для `sessions_spawn` (`["*"]` = будь-який; типове значення: лише той самий агент).
- Захист успадкування sandbox: якщо сесія запитувача працює в sandbox, `sessions_spawn` відхиляє цілі, які запускалися б без sandbox.
- `subagents.requireAgentId`: якщо true, блокує виклики `sessions_spawn`, у яких не вказано `agentId` (примушує явно вибирати профіль; типове значення: false).

---

## Маршрутизація між кількома агентами

Запускайте кілька ізольованих агентів у межах одного Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

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

### Поля збігу прив’язки

- `type` (необов’язково): `route` для звичайної маршрутизації (якщо тип відсутній, типовим є route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; якщо не вказано = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; залежить від каналу)
- `acp` (необов’язково; лише для записів `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок збігу:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (на рівні всього каналу)
6. Типовий агент

У межах кожного рівня перемагає перший запис `bindings`, що збігся.

Для записів `type: "acp"` OpenClaw визначає відповідність за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище порядок рівнів прив’язки route.

### Профілі доступу для конкретного агента

<Accordion title="Повний доступ (без sandbox)">

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

<Accordion title="Інструменти й робочий простір лише для читання">

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

<Accordion title="Без доступу до файлової системи (лише обмін повідомленнями)">

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

Деталі пріоритету див. у [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

---

## Сесія

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
    parentForkMaxTokens: 100000, // пропускати відгалуження батьківського потоку вище цього ліміту токенів (0 вимикає)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // тривалість або false
      maxDiskBytes: "500mb", // необов’язковий жорсткий бюджет
      highWaterBytes: "400mb", // необов’язкова ціль очищення
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // типове автоматичне зняття фокуса після неактивності в годинах (`0` вимикає)
      maxAgeHours: 0, // типовий жорсткий максимальний вік у годинах (`0` вимикає)
    },
    mainKey: "main", // застаріле поле (середовище виконання завжди використовує "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Деталі полів сесії">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (типове значення): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише тоді, коли спільний контекст справді потрібен).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM використовують спільну основну сесію.
  - `per-peer`: ізоляція за id відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для багатокористувацьких вхідних).
  - `per-account-channel-peer`: ізоляція за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: карта канонічних id до peer-ів із префіксом провайдера для спільного використання сесій між каналами.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за локальним часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва варіанти, перемагає той, що спливає раніше.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застаріле `dm` приймається як alias для `direct`.
- **`parentForkMaxTokens`**: максимальний дозволений `totalTokens` батьківської сесії під час створення відгалуженої сесії потоку (типове значення `100000`).
  - Якщо `totalTokens` батьківської сесії перевищує це значення, OpenClaw починає нову сесію потоку замість успадкування історії транскрипту батьківської сесії.
  - Установіть `0`, щоб вимкнути цей захист і завжди дозволяти відгалуження від батьківської сесії.
- **`mainKey`**: застаріле поле. Середовище виконання завжди використовує `"main"` для основного кошика прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість відповідей у відповідь між агентами під час обмінів agent-to-agent (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: збіг за `channel`, `chatType` (`direct|group|channel`, із застарілим alias `dm`), `keyPrefix` або `rawKeyPrefix`. Перший збіг deny перемагає.
- **`maintenance`**: елементи керування очищенням сховища сесій і зберіганням.
  - `mode`: `warn` лише видає попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (типове значення `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типове значення `500`).
  - `rotateBytes`: обертає `sessions.json`, коли його розмір перевищує це значення (типове значення `10mb`).
  - `resetArchiveRetention`: термін зберігання архівів транскриптів `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий бюджет диска для каталогу сесій. У режимі `warn` записує попередження в журнал; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення за бюджетом. Типово дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сесій, прив’язаних до потоків.
  - `enabled`: головний типовий перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокуса після неактивності в годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначати)

</Accordion>

---

## Повідомлення

```json5
{
  messages: {
    responsePrefix: "🦞", // або "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 вимикає
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Префікс відповіді

Перевизначення для каналу/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Визначення значення (найспецифічніше має пріоритет): обліковий запис → канал → глобальне. `""` вимикає й зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Шаблонні змінні:**

| Змінна            | Опис                     | Приклад                     |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | Коротка назва моделі     | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера         | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень thinking | `high`, `low`, `off`        |
| `{identity.name}` | Назва identity агента    | (те саме, що й `"auto"`)    |

Змінні нечутливі до регістру. `{think}` є alias для `{thinkingLevel}`.

### Реакція підтвердження

- Типово використовується `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервне значення з identity.
- Область: `group-mentions` (типове значення), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в Slack, Discord і Telegram.
- `messages.statusReactions.enabled`: вмикає статусні реакції життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord, якщо параметр не задано, статусні реакції залишаються ввімкненими, коли активні реакції підтвердження.
  У Telegram потрібно явно встановити `true`, щоб увімкнути статусні реакції життєвого циклу.

### Вхідне затримування

Об’єднує швидкі текстові повідомлення від одного й того самого відправника в один хід агента. Медіа/вкладення скидаються негайно. Керівні команди обходять затримування.

### TTS (перетворення тексту на мовлення)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
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
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` керує типовим режимом автоматичного TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` типово ввімкнено; `modelOverrides.allowProvider` типово дорівнює `false` (потрібне явне ввімкнення).
- API-ключі резервно беруться з `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані провайдери мовлення належать Plugin. Якщо задано `plugins.allow`, включіть кожен Plugin провайдера TTS, який ви хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий id провайдера `edge` приймається як alias для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на кінцеву точку, відмінну від OpenAI, OpenClaw розглядає її як OpenAI-сумісний TTS-сервер і послаблює перевірку моделі/голосу.

---

## Розмова

Типові значення для режиму розмови (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
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
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кілька провайдерів розмови.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) підтримуються лише для сумісності й автоматично мігруються до `talk.providers.<provider>`.
- Ідентифікатори голосів резервно беруться з `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає рядки відкритого тексту або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли не налаштовано API-ключ Talk.
- `providers.*.voiceAliases` дає змогу директивам Talk використовувати дружні назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовується локальним помічником macOS MLX. Якщо не вказано, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX на macOS запускається через вбудований помічник `openclaw-mlx-tts`, якщо він присутній, або через виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `silenceTimeoutMs` керує тим, як довго режим розмови чекає після мовчання користувача, перш ніж надіслати транскрипт. Якщо не задано, зберігається типове вікно паузи платформи (`700 ms` на macOS і Android, `900 ms` на iOS).

---

## Пов’язані матеріали

- [Довідник із конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — типові завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
