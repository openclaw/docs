---
read_when:
    - Налаштування стандартних параметрів агента (моделі, мислення, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування багатоагентної маршрутизації та прив’язок
    - Налаштування поведінки сеансу, доставлення повідомлень і режиму розмови
summary: Типові параметри агента, багатоагентна маршрутизація, сеанс, повідомлення та конфігурація talk
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-05-11T20:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbc8f9ff61cb1780dc038c71e3b2f2dd2d5d9fe6582ddf76d44a7dba21d13908
    source_path: gateway/config-agents.md
    workflow: 16
---

Ключі конфігурації в області агента під `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [Довідник із конфігурації](/uk/gateway/configuration-reference).

## Типові параметри агента

### `agents.defaults.workspace`

За замовчуванням: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, що показується в рядку Runtime системного промпта. Якщо не задано, OpenClaw автоматично визначає його, рухаючись угору від робочого простору.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий стандартний список дозволених Skills для агентів, які не задають
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

- Пропустіть `agents.defaults.skills`, щоб Skills за замовчуванням були необмежені.
- Пропустіть `agents.list[].skills`, щоб успадкувати типові значення.
- Задайте `agents.list[].skills: []`, щоб вимкнути Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення файлів початкового налаштування робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Пропускає створення вибраних необов’язкових файлів робочого простору, але все одно записує обов’язкові файли початкового налаштування. Дійсні значення: `SOUL.md`, `USER.md`, `HEARTBEAT.md` та `IDENTITY.md`.

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

Керує тим, коли файли початкового налаштування робочого простору вставляються в системний промпт. За замовчуванням: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторне вставлення початкового налаштування робочого простору, зменшуючи розмір промпта. Запуски Heartbeat і повторні спроби після Compaction усе одно перебудовують контекст.
- `"never"`: вимикає початкове налаштування робочого простору та вставлення контекстних файлів на кожному ході. Використовуйте це лише для агентів, які повністю керують життєвим циклом власного промпта (користувацькі контекстні рушії, нативні середовища виконання, які будують власний контекст, або спеціалізовані робочі процеси без початкового налаштування). Ходи Heartbeat і відновлення після Compaction також пропускають вставлення.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на файл початкового налаштування робочого простору до обрізання. За замовчуванням: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, вставлена з усіх файлів початкового налаштування робочого простору. За замовчуванням: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента повідомленням системного промпта, коли контекст початкового налаштування обрізано.
За замовчуванням: `"once"`.

- `"off"`: ніколи не вставляти текст повідомлення про обрізання в системний промпт.
- `"once"`: вставити стисле повідомлення один раз для кожного унікального підпису обрізання (рекомендовано).
- `"always"`: вставляти стисле повідомлення під час кожного запуску, коли існує обрізання.

Докладні лічильники сирих/вставлених даних і поля налаштування конфігурації лишаються в діагностиці, як-от звітах і журналах про контекст/статус; звичайний користувацький/рантайм-контекст WebChat отримує лише стисле повідомлення про відновлення.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта володіння бюджетами контексту

OpenClaw має кілька великих бюджетів промпта/контексту, і їх
навмисно розділено за підсистемами, а не пропущено всі через один універсальний
перемикач.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне вставлення початкового налаштування робочого простору.
- `agents.defaults.startupContext.*`:
  одноразова преамбула модельного запуску для скидання/старту, включно з нещодавніми щоденними
  файлами `memory/*.md`. Простi команди чату `/new` і `/reset`
  підтверджуються без виклику моделі.
- `skills.limits.*`:
  компактний список Skills, вставлений у системний промпт.
- `agents.defaults.contextLimits.*`:
  обмежені фрагменти середовища виконання та вставлені блоки, якими володіє середовище виконання.
- `memory.qmd.limits.*`:
  розмір індексованого фрагмента пошуку пам’яті та вставлення.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує початковою преамбулою першого ходу, що вставляється під час модельних запусків скидання/старту.
Прості команди чату `/new` і `/reset` підтверджують скидання без виклику
моделі, тому вони не завантажують цю преамбулу.

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

- `memoryGetMaxChars`: стандартне обмеження фрагмента `memory_get` до додавання
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: стандартне вікно рядків `memory_get`, коли `lines`
  пропущено.
- `toolResultMaxChars`: обмеження живого результату інструмента, що використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: обмеження фрагмента AGENTS.md, що використовується під час вставлення
  оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для окремого агента для спільних параметрів `contextLimits`. Пропущені поля успадковуються
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

Глобальне обмеження для компактного списку Skills, вставленого в системний промпт. Це
не впливає на читання файлів `SKILL.md` за потреби.

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

Перевизначення для окремого агента для бюджету промпта Skills.

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

Максимальний розмір у пікселях для найдовшого боку зображення в блоках зображень транскрипта/інструмента перед викликами провайдера.
За замовчуванням: `1200`.

Нижчі значення зазвичай зменшують використання vision-токенів і розмір корисного навантаження запиту для запусків із великою кількістю скриншотів.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного промпта (не для часових міток повідомлень). Резервно використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в системному промпті. За замовчуванням: `auto` (налаштування ОС).

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

- `model`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Рядкова форма задає лише основну модель.
  - Об’єктна форма задає основну модель плюс упорядковані резервні моделі для відмовостійкого перемикання.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація vision-моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати зображення як вхідні дані.
  - Віддавайте перевагу явним посиланням `provider/model`. Голі ID приймаються для сумісності; якщо голий ID однозначно відповідає налаштованому запису з підтримкою зображень у `models.providers.*.models`, OpenClaw доповнює його цим провайдером. Неоднозначні налаштовані збіги потребують явного префікса провайдера.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для OpenAI PNG/WebP виводу з прозорим фоном.
  - Якщо ви вибираєте провайдер/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо пропущено, `image_generate` все одно може визначити типовий провайдер із підтриманою автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації зображень у порядку ID провайдера.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо пропущено, `music_generate` все одно може визначити типовий провайдер із підтриманою автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації музики у порядку ID провайдера.
  - Якщо ви вибираєте провайдер/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо пропущено, `video_generate` все одно може визначити типовий провайдер із підтриманою автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації відео у порядку ID провайдера.
  - Якщо ви вибираєте провайдер/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо пропущено, інструмент PDF повертається до `imageModel`, а потім до розв’язаної моделі сесії/типової моделі.
- `pdfMaxBytesMb`: типовий ліміт розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, які враховує резервний режим витягання в інструменті `pdf`.
- `verboseDefault`: типовий рівень докладності для агентів. Значення: `"off"`, `"on"`, `"full"`. Типово: `"off"`.
- `toolProgressDetail`: режим деталізації для підсумків інструментів `/verbose` і рядків чернетки прогресу інструментів. Значення: `"explain"` (типово, компактні зрозумілі людині мітки) або `"raw"` (додавати необроблену команду/деталі, коли доступні). `agents.list[].toolProgressDetail` окремого агента перевизначає це типове значення.
- `reasoningDefault`: типова видимість міркувань для агентів. Значення: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` окремого агента перевизначає це типове значення. Налаштовані типові значення міркувань застосовуються лише для власників, авторизованих відправників або контекстів Gateway оператора-адміністратора, коли не задано перевизначення міркувань для повідомлення чи сесії.
- `elevatedDefault`: типовий рівень підвищеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типово: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через OpenAI API-ключ або Codex OAuth). Якщо ви пропустите провайдера, OpenClaw спочатку спробує alias, потім унікальний збіг налаштованого провайдера для цього точного ID моделі, і лише після цього повернеться до налаштованого типового провайдера (застаріла поведінка сумісності, тому віддавайте перевагу явному `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повертається до першого налаштованого провайдера/моделі замість того, щоб показувати застаріле типове значення видаленого провайдера.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Використовуйте записи `provider/*`, як-от `"openai-codex/*": {}` або `"vllm/*": {}`, щоб показати всі виявлені моделі для вибраних провайдерів без ручного перелічення кожного ID моделі.
  - Безпечні зміни: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відхиляє заміни, які видалили б наявні записи allowlist, якщо не передати `--replace`.
  - Потоки налаштування/onboarding у межах провайдера зливають вибрані моделі провайдера в цю map і зберігають уже налаштованих непов’язаних провайдерів.
  - Для прямих моделей OpenAI Responses серверне Compaction вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити додавання `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [серверне Compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні типові параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для окремої моделі), потім `agents.list[].params` (відповідний ID агента) перевизначає за ключем. Докладніше див. [Кешування промптів](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений наскрізний JSON, що зливається в тіла запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, додаткове тіло має пріоритет; ненативні маршрути completions усе одно після цього прибирають OpenAI-специфічний `store`.
- `params.chat_template_kwargs`: vLLM/OpenAI-сумісні аргументи chat-template, що зливаються в тіла запитів верхнього рівня `api: "openai-completions"`. Для `vllm/nemotron-3-*` із вимкненим thinking вбудований vLLM Plugin автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані типові значення, а `extra_body.chat_template_kwargs` усе одно має остаточний пріоритет. Для елементів керування thinking Qwen задайте `params.qwenThinkingFormat` як `"chat-template"` або `"top-level"` у цьому записі моделі.
- `compat.thinkingFormat`: OpenAI-сумісний стиль корисного навантаження thinking. Використовуйте `"qwen"` для стилю Qwen з `enable_thinking` верхнього рівня або `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на бекендах родини Qwen, які підтримують kwargs chat-template на рівні запиту, таких як vLLM. OpenClaw відображає вимкнене thinking у `false`, а ввімкнене thinking у `true`.
- `compat.supportedReasoningEfforts`: список OpenAI-сумісних reasoning effort для окремої моделі. Додайте `"xhigh"` для користувацьких endpoint, які справді його приймають; після цього OpenClaw показує `/think xhigh` у меню команд, рядках сесій Gateway, перевірці patch сесії, перевірці CLI агента та перевірці `llm-task` для цього налаштованого провайдера/моделі. Використовуйте `compat.reasoningEffortMap`, коли бекенд очікує специфічне для провайдера значення для канонічного рівня.
- `params.preserveThinking`: опціональне ввімкнення лише для Z.AI для збереженого thinking. Коли ввімкнено і thinking активний, OpenClaw надсилає `thinking.clear_thinking: false` і повторно відтворює попередній `reasoning_content`; див. [thinking Z.AI і збережене thinking](/uk/providers/zai#thinking-and-preserved-thinking).
- `localService`: необов’язковий менеджер процесів рівня провайдера для локальних/самостійно розміщених серверів моделей. Коли вибрана модель належить цьому провайдеру, OpenClaw перевіряє `healthUrl` (або `baseUrl + "/models"`), запускає `command` з `args`, якщо endpoint недоступний, чекає до `readyTimeoutMs`, а потім надсилає запит моделі. `command` має бути абсолютним шляхом. `idleStopMs: 0` залишає процес активним до виходу OpenClaw; додатне значення зупиняє процес, запущений OpenClaw, після такої кількості мілісекунд простою. Див. [Локальні сервіси моделей](/uk/gateway/local-model-services).
- Політика середовища виконання належить провайдерам або моделям, а не `agents.defaults`. Використовуйте `models.providers.<provider>.agentRuntime` для правил на рівні провайдера або `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` для правил конкретної моделі. Моделі агентів OpenAI на офіційному провайдері OpenAI типово вибирають Codex.
- Записувачі конфігурації, що змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення резервних варіантів), зберігають канонічну об’єктну форму й за можливості зберігають наявні списки резервних варіантів.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сесіями (кожна сесія все одно серіалізується). Типово: 4.

### Політика середовища виконання

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
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, ідентифікатор зареєстрованого harness Plugin або підтримуваний псевдонім бекенда CLI. Вбудований Plugin Codex реєструє `codex`; вбудований Plugin Anthropic надає бекенд CLI `claude-cli`.
- `id: "auto"` дає змогу зареєстрованим harness Plugin обробляти підтримувані кроки й використовує PI, коли жоден harness не збігається. Явний runtime Plugin, як-от `id: "codex"`, вимагає цей harness і завершується закритою помилкою, якщо він недоступний або дає збій.
- Ключі runtime на рівні всього агента є застарілими. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, session runtime pins і `OPENCLAW_AGENT_RUNTIME` ігноруються під час вибору runtime. Запустіть `openclaw doctor --fix`, щоб видалити застарілі значення.
- Моделі агентів OpenAI типово використовують harness Codex; `agentRuntime.id: "codex"` на рівні провайдера/моделі лишається чинним, коли потрібно явно це вказати.
- Для розгортань Claude CLI надавайте перевагу `model: "anthropic/claude-opus-4-7"` разом із `agentRuntime.id: "claude-cli"` на рівні моделі. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` досі працюють для сумісності, але нова конфігурація має зберігати канонічний вибір провайдера/моделі та розміщувати бекенд виконання в політиці runtime провайдера/моделі.
- Це керує лише виконанням текстових кроків агента. Генерування медіа, vision, PDF, музика, відео та TTS і далі використовують свої налаштування провайдера/моделі.

**Вбудовані скорочення псевдонімів** (застосовуються лише коли модель міститься в `agents.defaults.models`):

| Псевдонім          | Модель                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Ваші налаштовані псевдоніми завжди мають пріоритет над стандартними.

Моделі Z.AI GLM-4.x автоматично вмикають режим мислення, якщо ви не задасте `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI стандартно вмикають `tool_stream` для потокової передавання викликів інструментів. Задайте `agents.defaults.models["zai/<model>"].params.tool_stream` як `false`, щоб вимкнути це.
Моделі Anthropic Claude 4.6 стандартно використовують `adaptive` мислення, коли явний рівень мислення не задано.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для текстових резервних запусків (без викликів інструментів). Корисно як запасний варіант, коли API-постачальники дають збій.

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

- CLI-бекенди спершу працюють із текстом; інструменти завжди вимкнені.
- Сесії підтримуються, коли задано `sessionArg`.
- Передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.
- `reseedFromRawTranscriptWhenUncompacted: true` дає бекенду змогу відновлювати безпечні
  недійсні сесії з обмеженого хвоста сирої стенограми OpenClaw до того, як
  з’явиться перший підсумок compaction. Зміни профілю автентифікації або епохи облікових даних
  однаково ніколи не повторно ініціалізуються із сирих даних.

### `agents.defaults.systemPromptOverride`

Замініть увесь системний промпт, зібраний OpenClaw, фіксованим рядком. Задається на рівні стандартних значень (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із промптами.

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

Незалежні від постачальника накладки промптів, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки для всіх постачальників; `personality` керує лише дружнім шаром стилю взаємодії.

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

- `"friendly"` (стандартно) і `"on"` вмикають дружній шар стилю взаємодії.
- `"off"` вимикає лише дружній шар; позначений контракт поведінки GPT-5 залишається ввімкненим.
- Застаріле `plugins.entries.openai.config.personality` усе ще зчитується, коли це спільне налаштування не задано.

### `agents.defaults.heartbeat`

Періодичні запуски heartbeat.

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
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
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

- `every`: рядок тривалості (ms/s/m/h). Стандартно: `30m` (автентифікація за API-ключем) або `1h` (автентифікація OAuth). Задайте `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли `false`, пропускає розділ Heartbeat із системного промпта й не вставляє `HEARTBEAT.md` у контекст початкового завантаження. Стандартно: `true`.
- `suppressToolErrorWarnings`: коли `true`, приглушує payload-попередження про помилки інструментів під час запусків heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для ходу агента heartbeat перед його перериванням. Не задавайте, щоб використовувати `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої/DM-доставки. `allow` (стандартно) дозволяє доставку безпосередньо до цілі. `block` приглушує доставку безпосередньо до цілі й видає `reason=dm-blocked`.
- `lightContext`: коли `true`, запуски heartbeat використовують полегшений контекст початкового завантаження й залишають лише `HEARTBEAT.md` з файлів початкового завантаження робочого простору.
- `isolatedSession`: коли `true`, кожен heartbeat запускається у свіжій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як cron `sessionTarget: "isolated"`. Зменшує вартість токенів на heartbeat з приблизно 100K до приблизно 2-5K токенів.
- `skipWhenBusy`: коли `true`, запуски heartbeat відкладаються на додаткових зайнятих лініях: робота субагента або вкладеної команди. Лінії Cron завжди відкладають heartbeats, навіть без цього прапорця.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, heartbeats запускають **лише ці агенти**.
- Heartbeats запускають повні ходи агента — коротші інтервали витрачають більше токенів.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
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

- `mode`: `default` або `safeguard` (фрагментоване підсумовування для довгих історій). Див. [Compaction](/uk/concepts/compaction).
- `provider`: ідентифікатор зареєстрованого plugin постачальника compaction. Коли задано, викликається `summarize()` постачальника замість вбудованого LLM-підсумовування. У разі збою повертається до вбудованого. Задання постачальника примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції compaction перед тим, як OpenClaw її перерве. Стандартно: `900`.
- `keepRecentTokens`: бюджет точки відсікання Pi для дослівного збереження найновішого хвоста стенограми. Ручний `/compact` враховує це, коли явно задано; інакше ручна compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (стандартно), `off` або `custom`. `strict` додає на початок вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час підсумовування compaction.
- `identifierInstructions`: необов’язковий власний текст про збереження ідентифікаторів, що використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою в разі некоректно сформованого виводу для safeguard-підсумків. Увімкнено стандартно в режимі safeguard; задайте `enabled: false`, щоб пропустити аудит.
- `midTurnPrecheck`: необов’язкова перевірка тиску циклу інструментів Pi. Коли `enabled: true`, OpenClaw перевіряє тиск контексту після додавання результатів інструментів і перед наступним викликом моделі. Якщо контекст більше не вміщується, він перериває поточну спробу перед надсиланням промпта й повторно використовує наявний шлях відновлення передперевірки, щоб обрізати результати інструментів або виконати compact і повторити спробу. Працює з обома режимами compaction: `default` і `safeguard`. Стандартно: вимкнено.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 в AGENTS.md для повторного вставлення після compaction. Стандартно `["Session Startup", "Red Lines"]`; задайте `[]`, щоб вимкнути повторне вставлення. Коли не задано або явно задано цю стандартну пару, старі заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування compaction. Використовуйте це, коли основна сесія має зберігати одну модель, а підсумки compaction мають виконуватися на іншій; коли не задано, compaction використовує основну модель сесії.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), який запускає звичайну локальну compaction перед запуском, коли активний JSONL перевищує поріг. Потребує `truncateAfterCompaction`, щоб успішна compaction могла перейти до меншої наступної стенограми. Вимкнено, коли не задано або `0`.
- `notifyUser`: коли `true`, надсилає користувачу короткі сповіщення, коли compaction починається і коли завершується (наприклад, "Compacting context..." і "Compaction complete"). Стандартно вимкнено, щоб compaction була беззвучною.
- `memoryFlush`: беззвучний агентний хід перед авто-compaction для збереження тривалих спогадів. Задайте `model` як точний provider/model, наприклад `ollama/qwen3:8b`, коли цей службовий хід має залишатися на локальній моделі; перевизначення не успадковує резервний ланцюжок активної сесії. Пропускається, коли робочий простір доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

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

- `mode: "cache-ttl"` вмикає проходи обрізання.
- `ttl` керує тим, як часто обрізання може запускатися знову (після останнього торкання кешу).
- Обрізання спершу м’яко скорочує завеликі результати інструментів, а потім, за потреби, жорстко очищає старіші результати інструментів.

**М’яке скорочення** зберігає початок + кінець і вставляє `...` посередині.

**Жорстке очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не скорочуються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точних кількостях токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Див. [Обрізання сесії](/uk/concepts/session-pruning), щоб дізнатися подробиці поведінки.

### Потокове передавання блоків

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

- Канали, відмінні від Telegram, потребують явного `*.blockStreaming: true`, щоб увімкнути блокові відповіді.
- Перевизначення каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Signal/Slack/Discord/Google Chat мають типове значення `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоковими відповідями. `natural` = 800–2500 мс. Перевизначення для агента: `agents.list[].humanDelay`.

Див. [Потокове передавання](/uk/concepts/streaming) для подробиць про поведінку й розбиття на фрагменти.

### Індикатори введення

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

- Типові значення: `instant` для прямих чатів/згадок, `message` для групових чатів без згадок.
- Перевизначення для сеансу: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Індикатори введення](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов'язкова ізоляція для вбудованого агента. Див. [Ізоляція](/uk/gateway/sandboxing) для повного посібника.

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

<Accordion title="Подробиці ізоляції">

**Бекенд:**

- `docker`: локальне середовище виконання Docker (типово)
- `ssh`: універсальне віддалене середовище виконання на основі SSH
- `openshell`: середовище виконання OpenShell

Коли вибрано `backend: "openshell"`, налаштування, специфічні для середовища виконання, переходять до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенда:**

- `target`: ціль SSH у формі `user@host[:port]`
- `command`: команда клієнта SSH (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для робочих просторів за областями
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, передані до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRefs, які OpenClaw матеріалізує в тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: налаштування політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef розв'язуються з активного знімка середовища виконання секретів до запуску сеансу ізоляції

**Поведінка SSH-бекенда:**

- один раз заповнює віддалений робочий простір після створення або повторного створення
- потім підтримує віддалений робочий простір SSH як канонічний
- маршрутизує `exec`, файлові інструменти та шляхи до медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує браузерні контейнери ізоляції

**Доступ до робочого простору:**

- `none`: робочий простір ізоляції за областю в `~/.openclaw/sandboxes`
- `ro`: робочий простір ізоляції в `/workspace`, робочий простір агента змонтовано лише для читання в `/agent`
- `rw`: робочий простір агента змонтовано для читання/запису в `/workspace`

**Область:**

- `session`: контейнер + робочий простір для кожного сеансу
- `agent`: один контейнер + робочий простір на агента (типово)
- `shared`: спільний контейнер і робочий простір (без ізоляції між сеансами)

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

- `mirror`: заповнює віддалене середовище з локального перед `exec`, синхронізує назад після `exec`; локальний робочий простір залишається канонічним
- `remote`: заповнює віддалене середовище один раз під час створення ізоляції, потім підтримує віддалений робочий простір як канонічний

У режимі `remote` локальні зміни на хості, зроблені поза OpenClaw, не синхронізуються в ізоляцію автоматично після кроку заповнення.
Транспортом є SSH у ізоляцію OpenShell, але Plugin керує життєвим циклом ізоляції та необов'язковою дзеркальною синхронізацією.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потребує вихідного доступу до мережі, кореня з правами запису, користувача root.

**Контейнери типово мають `network: "none"`** — установіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний режим).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив'язки та прив'язки для окремих агентів об'єднуються.

**Ізольований браузер** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системний prompt. Не потребує `browser.enabled` в `openclaw.json`.
Доступ спостерігача noVNC типово використовує автентифікацію VNC, а OpenClaw видає короткочасний URL із токеном (замість розкриття пароля в спільному URL).

- `allowHostControl: false` (типово) блокує ізольовані сеанси від звернення до браузера хоста.
- `network` типово має значення `openclaw-sandbox-browser` (виділена bridge-мережа). Установлюйте `bridge` лише тоді, коли явно потрібна глобальна bridge-зв'язність.
- `cdpSourceRange` необов'язково обмежує вхід CDP на межі контейнера діапазоном CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера ізоляції. Коли встановлено (включно з `[]`), замінює `docker.binds` для контейнера браузера.
- Типові параметри запуску визначені в `scripts/sandbox-browser-entrypoint.sh` і налаштовані для контейнерних хостів:
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
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо це потрібно для використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити за допомогою
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    типове обмеження процесів Chromium.
  - плюс `--no-sandbox`, коли `noSandbox` увімкнено.
  - Типові значення є базовими для образу контейнера; використовуйте власний образ браузера з власною
    точкою входу, щоб змінити типові параметри контейнера.

</Accordion>

Ізоляція браузера та `sandbox.docker.binds` доступні лише для Docker.

Збірка образів (із checkout вихідного коду):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Для встановлень npm без checkout вихідного коду див. [Ізоляція § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) щодо вбудованих команд `docker build`.

### `agents.list` (перевизначення для окремих агентів)

Використовуйте `agents.list[].tts`, щоб надати агенту власного постачальника TTS, голос, модель,
стиль або режим автоматичного TTS. Блок агента глибоко об'єднується поверх глобального
`messages.tts`, тож спільні облікові дані можуть залишатися в одному місці, а окремі
агенти перевизначають лише потрібні їм поля голосу чи постачальника. Перевизначення активного агента
застосовується до автоматичних голосових відповідей, `/tts audio`, `/tts status` і
інструмента агента `tts`. Див. [Перетворення тексту на мовлення](/uk/tools/tts#per-agent-voice-overrides)
для прикладів постачальників і пріоритетності.

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
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
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

- `id`: стабільний ідентифікатор агента (обов’язково).
- `default`: коли задано кілька, перший має пріоритет (записується попередження). Якщо не задано жодного, типовим є перший запис у списку.
- `model`: рядкова форма задає сувору основну модель для окремого агента без резервної моделі; об’єктна форма `{ primary }` також є суворою, якщо не додати `fallbacks`. Використовуйте `{ primary, fallbacks: [...] }`, щоб увімкнути для цього агента резервні моделі, або `{ primary, fallbacks: [] }`, щоб зробити сувору поведінку явною. Завдання Cron, які перевизначають лише `primary`, усе одно успадковують типові резервні моделі, якщо не задати `fallbacks: []`.
- `params`: потокові параметри для окремого агента, об’єднані поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних перевизначень агента, як-от `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `tts`: необов’язкові перевизначення перетворення тексту на мовлення для окремого агента. Блок глибоко об’єднується поверх `messages.tts`, тому зберігайте спільні облікові дані провайдера й політику резервування в `messages.tts`, а тут задавайте лише значення, специфічні для персони, наприклад провайдера, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий список дозволених Skills для окремого агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, коли це задано; явний список замінює типові значення замість об’єднання, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень мислення для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для окремого повідомлення або сеансу. Вибраний профіль провайдера/моделі керує тим, які значення є допустимими; для Google Gemini `adaptive` зберігає динамічне мислення, яким керує провайдер (`thinkingLevel` пропущено в Gemini 3/3.1, `thinkingBudget: -1` у Gemini 2.5).
- `reasoningDefault`: необов’язкова типова видимість reasoning для окремого агента (`on | off | stream`). Перевизначає `agents.defaults.reasoningDefault` для цього агента, коли не задано перевизначення reasoning для окремого повідомлення або сеансу.
- `fastModeDefault`: необов’язкове типове значення швидкого режиму для окремого агента (`true | false`). Застосовується, коли не задано перевизначення швидкого режиму для окремого повідомлення або сеансу.
- `models`: необов’язкові перевизначення каталогу моделей/середовища виконання для окремого агента, індексовані повними ідентифікаторами `provider/model`. Використовуйте `models["provider/model"].agentRuntime` для винятків середовища виконання окремого агента.
- `runtime`: необов’язковий дескриптор середовища виконання для окремого агента. Використовуйте `type: "acp"` з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати сеанси ACP harness.
- `identity.avatar`: шлях відносно робочої області, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених ідентифікаторів агентів для явних цілей `sessions_spawn.agentId` (`["*"]` = будь-який; типово: лише той самий агент). Додайте ідентифікатор запитувача, коли мають бути дозволені виклики `agentId`, спрямовані на себе.
- Запобіжник успадкування пісочниці: якщо сеанс запитувача працює в пісочниці, `sessions_spawn` відхиляє цілі, які запускалися б без пісочниці.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, у яких пропущено `agentId` (примушує явний вибір профілю; типово: false).

---

## Мультиагентна маршрутизація

Запускайте кілька ізольованих агентів в одному Gateway. Див. [Мультиагентний режим](/uk/concepts/multi-agent).

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

### Поля зіставлення прив’язки

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній тип за замовчуванням означає route), `acp` для прив’язок постійних розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; пропущено = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; залежить від каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок зіставлення:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний, без peer/guild/team)
5. `match.accountId: "*"` (на весь канал)
6. Типовий агент

У межах кожного рівня перемагає перший відповідний запис `bindings`.

Для записів `type: "acp"` OpenClaw визначає відповідність за точною ідентичністю розмови (`match.channel` + account + `match.peer.id`) і не використовує порядок рівнів прив’язки маршруту вище.

### Профілі доступу для окремих агентів

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

<Accordion title="No filesystem access (messaging only)">

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

Див. [Пісочниця й інструменти для мультиагентного режиму](/uk/tools/multi-agent-sandbox-tools), щоб дізнатися про деталі пріоритету.

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
      mode: "warn", // warn | enforce
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

<Accordion title="Session field details">

- **`scope`**: базова стратегія групування сеансів для контекстів групових чатів.
  - `per-sender` (за замовчуванням): кожен відправник отримує ізольований сеанс у межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують один сеанс (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються особисті повідомлення.
  - `main`: усі особисті повідомлення спільно використовують основний сеанс.
  - `per-peer`: ізолювати за ідентифікатором відправника між каналами.
  - `per-channel-peer`: ізолювати за каналом + відправником (рекомендовано для поштових скриньок із кількома користувачами).
  - `per-account-channel-peer`: ізолювати за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: зіставляє канонічні ідентифікатори з пірами з префіксом провайдера для спільного використання сеансів між каналами. Команди Dock, як-от `/dock_discord`, використовують ту саму мапу, щоб перемкнути маршрут відповіді активного сеансу на інший пов’язаний пір каналу; див. [стикування каналів](/uk/concepts/channel-docking).
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва варіанти, спрацьовує той, що завершується першим. Актуальність щоденного скидання використовує `sessionStartedAt` рядка сеансу; актуальність скидання за простоєм використовує `lastInteractionAt`. Фонові/системні записи подій, як-от heartbeat, пробудження cron, сповіщення exec і службовий облік gateway, можуть оновлювати `updatedAt`, але вони не підтримують актуальність щоденних/простійних сеансів.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застаріле `dm` приймається як псевдонім для `direct`.
- **`mainKey`**: застаріле поле. Під час виконання завжди використовується `"main"` для основного кошика прямих чатів.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів-відповідей між агентами під час обмінів агент-агент (ціле число, діапазон: `0`-`20`, за замовчуванням: `5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона перемагає.
- **`maintenance`**: очищення сховища сеансів + керування зберіганням.
  - `mode`: `warn` лише видає попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (за замовчуванням `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (за замовчуванням `500`). Під час виконання пакетне очищення записується з невеликим буфером верхньої межі для лімітів виробничого розміру; `openclaw sessions cleanup --enforce` застосовує ліміт негайно.
  - `rotateBytes`: застаріло та ігнорується; `openclaw doctor --fix` видаляє це зі старіших конфігурацій.
  - `resetArchiveRetention`: термін зберігання архівів транскриптів `*.reset.<timestamp>`. За замовчуванням дорівнює `pruneAfter`; встановіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий дисковий бюджет каталогу сеансів. У режимі `warn` він записує попередження в журнал; у режимі `enforce` спочатку видаляє найстаріші артефакти/сеанси.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. За замовчуванням `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні значення за замовчуванням для функцій сеансів, прив’язаних до гілок.
  - `enabled`: головний перемикач за замовчуванням (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: автофокусування за замовчуванням після неактивності в годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: жорсткий максимальний вік за замовчуванням у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `spawnSessions`: стандартний шлюз для створення робочих сеансів, прив’язаних до гілок, із `sessions_spawn` і породжень гілок ACP. За замовчуванням `true`, коли прив’язки гілок увімкнені; провайдери/облікові записи можуть перевизначати.
  - `defaultSpawnContext`: стандартний нативний контекст субагента для породжень, прив’язаних до гілок (`"fork"` або `"isolated"`). За замовчуванням `"fork"`.

</Accordion>

---

## Повідомлення

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
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

### Префікс відповіді

Перевизначення для каналу/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Порядок визначення (найконкретніше перемагає): обліковий запис → канал → глобальне. `""` вимикає та зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна            | Опис                   | Приклад                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі   | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера       | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень мислення | `high`, `low`, `off`        |
| `{identity.name}` | Назва ідентичності агента | (те саме, що `"auto"`)      |

Змінні не залежать від регістру. `{think}` є псевдонімом для `{thinkingLevel}`.

### Реакція підтвердження

- За замовчуванням використовується `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервне значення ідентичності.
- Область: `group-mentions` (за замовчуванням), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в каналах із підтримкою реакцій, як-от Slack, Discord, Telegram, WhatsApp та iMessage.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord не встановлене значення залишає реакції статусу увімкненими, коли активні реакції підтвердження.
  У Telegram явно встановіть `true`, щоб увімкнути реакції статусу життєвого циклу.

### Затримка вхідних повідомлень

Об’єднує швидкі текстові повідомлення від одного відправника в один хід агента. Медіа/вкладення надсилаються негайно. Керівні команди обходять затримку.

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

- `auto` керує стандартним режимом авто-TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` увімкнено за замовчуванням; `modelOverrides.allowProvider` за замовчуванням має `false` (потрібне явне ввімкнення).
- API-ключі резервно беруться з `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані провайдери мовлення належать Plugin. Якщо встановлено `plugins.allow`, включіть кожен Plugin провайдера TTS, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий ідентифікатор провайдера `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` указує на кінцеву точку не OpenAI, OpenClaw трактує її як OpenAI-сумісний сервер TTS і послаблює перевірку моделі/голосу.

---

## Talk

Значення за замовчуванням для режиму Talk (macOS/iOS/Android).

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
          voice: "cedar",
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

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кілька провайдерів Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію в `talk.providers.<provider>`.
- Ідентифікатори голосів резервно беруться з `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає текстові рядки або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли API-ключ Talk не налаштовано.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати зручні назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовується локальним помічником MLX у macOS. Якщо пропущено, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX у macOS виконується через вбудований помічник `openclaw-mlx-tts`, якщо він наявний, або через виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `consultThinkingLevel` керує рівнем мислення для повного запуску агента OpenClaw за викликами Control UI Talk realtime `openclaw_agent_consult`. Залиште невстановленим, щоб зберегти звичайну поведінку сеансу/моделі.
- `consultFastMode` задає одноразове перевизначення швидкого режиму для realtime-консультацій Control UI Talk без зміни звичайного налаштування швидкого режиму сеансу.
- `speechLocale` задає ідентифікатор локалі BCP 47, який використовується розпізнаванням мовлення iOS/macOS Talk. Залиште невстановленим, щоб використовувати стандартне значення пристрою.
- `silenceTimeoutMs` керує тим, як довго режим Talk чекає після мовчання користувача перед надсиланням транскрипту. Невстановлене значення зберігає стандартне вікно паузи платформи (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` додає системні інструкції для провайдера до вбудованого realtime-промпта OpenClaw, тож стиль голосу можна налаштувати без втрати стандартних настанов `openclaw_agent_consult`.

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
