---
read_when:
    - Налаштування типових параметрів агента (моделі, thinking, робоча область, heartbeat, медіа, skills)
    - Налаштування багатоагентної маршрутизації та прив’язок
    - Налаштування сеансу, доставки повідомлень і поведінки режиму розмови
summary: Типові налаштування агентів, маршрутизація між кількома агентами, сеанс, повідомлення та конфігурація talk
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-07-01T13:22:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

Ключі конфігурації з областю дії агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Стандартні налаштування агента

### `agents.defaults.workspace`

За замовчуванням: `OPENCLAW_WORKSPACE_DIR`, якщо задано, інакше `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Явне значення `agents.defaults.workspace` має пріоритет над
`OPENCLAW_WORKSPACE_DIR`. Використовуйте змінну середовища, щоб спрямувати стандартних агентів
до змонтованого робочого простору, коли не хочете записувати цей шлях у конфігурацію.

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, показаний у рядку Runtime системного промпта. Якщо не задано, OpenClaw автоматично визначає його, рухаючись угору від робочого простору.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий стандартний список дозволених skill для агентів, які не задають
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

- Не вказуйте `agents.defaults.skills`, щоб за замовчуванням Skills були необмежені.
- Не вказуйте `agents.list[].skills`, щоб успадкувати стандартні значення.
- Задайте `agents.list[].skills: []`, щоб вимкнути Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об’єднується зі стандартними значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення файлів bootstrap робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Пропускає створення вибраних необов’язкових файлів робочого простору, водночас записуючи обов’язкові файли bootstrap. Допустимі значення: `SOUL.md`, `USER.md`, `HEARTBEAT.md` і `IDENTITY.md`.

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

Керує тим, коли файли bootstrap робочого простору вставляються в системний промпт. За замовчуванням: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторну вставку bootstrap робочого простору, зменшуючи розмір промпта. Запуски Heartbeat і повторні спроби після Compaction усе ще перебудовують контекст.
- `"never"`: вимикає вставку bootstrap робочого простору та файлів контексту на кожному ході. Використовуйте це лише для агентів, які повністю керують життєвим циклом свого промпта (власні рушії контексту, нативні середовища виконання, що будують власний контекст, або спеціалізовані робочі процеси без bootstrap). Ходи Heartbeat і відновлення після Compaction також пропускають вставку.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Перевизначення для окремого агента: `agents.list[].contextInjection`. Пропущені значення успадковують
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на файл bootstrap робочого простору перед обрізанням. За замовчуванням: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Перевизначення для окремого агента: `agents.list[].bootstrapMaxChars`. Пропущені значення успадковують
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, вставлених з усіх файлів bootstrap робочого простору. За замовчуванням: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Перевизначення для окремого агента: `agents.list[].bootstrapTotalMaxChars`. Пропущені значення
успадковують `agents.defaults.bootstrapTotalMaxChars`.

### Перевизначення профілю bootstrap для окремого агента

Використовуйте перевизначення профілю bootstrap для окремого агента, коли одному агенту потрібна інша поведінка
вставки промпта, ніж у спільних стандартних налаштуваннях. Пропущені поля успадковуються з
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

Керує видимим для агента повідомленням у системному промпті, коли bootstrap-контекст обрізано.
За замовчуванням: `"always"`.

- `"off"`: ніколи не вставляти текст повідомлення про обрізання в системний промпт.
- `"once"`: вставити стисле повідомлення один раз для кожного унікального підпису обрізання.
- `"always"`: вставляти стисле повідомлення під час кожного запуску, коли є обрізання (рекомендовано).

Докладні сирі/вставлені лічильники та поля налаштування конфігурації залишаються в діагностиці, як-от
звітах про контекст/статус і журналах; звичайний користувацький/виконавчий контекст WebChat отримує лише
стисле повідомлення про відновлення.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Мапа власності бюджетів контексту

OpenClaw має кілька великих бюджетів промпта/контексту, і вони
навмисно розділені за підсистемами, а не пропускаються всі через один загальний
регулятор.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайна вставка bootstrap робочого простору.
- `agents.defaults.startupContext.*`:
  одноразова прелюдія скидання/запуску для model-run, включно з нещодавніми щоденними
  файлами `memory/*.md`. Прості команди чату `/new` і `/reset`
  підтверджуються без виклику моделі.
- `skills.limits.*`:
  компактний список Skills, вставлений у системний промпт.
- `agents.defaults.contextLimits.*`:
  обмежені фрагменти середовища виконання та вставлені блоки, якими володіє середовище виконання.
- `memory.qmd.limits.*`:
  розмір фрагмента індексованого пошуку пам’яті та вставки.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовою прелюдією першого ходу, вставленою під час model-run скидання/запуску.
Прості команди чату `/new` і `/reset` підтверджують скидання без виклику
моделі, тому вони не завантажують цю прелюдію.

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

Спільні стандартні значення для обмежених поверхонь контексту середовища виконання.

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

- `memoryGetMaxChars`: стандартна межа фрагмента `memory_get` перед додаванням
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: стандартне вікно рядків `memory_get`, коли `lines`
  пропущено.
- `toolResultMaxChars`: розширена верхня межа результатів live-інструментів, що використовується для збережених
  результатів і відновлення після переповнення. Залиште незаданою для автоматичної межі model-context:
  `16000` символів нижче 100K токенів, `32000` символів на 100K+ токенів і `64000`
  символів на 200K+ токенів. Явні значення до `1000000` приймаються для
  моделей із довгим контекстом, але ефективна межа все одно обмежена приблизно 30%
  вікна контексту моделі. `openclaw doctor --deep` друкує ефективну межу,
  а doctor попереджає лише тоді, коли явне перевизначення застаріле або не має ефекту.
- `postCompactionMaxChars`: межа фрагмента AGENTS.md, що використовується під час вставки
  оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для окремого агента для спільних регуляторів `contextLimits`. Пропущені поля успадковуються
з `agents.defaults.contextLimits`.

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

Глобальна межа для компактного списку Skills, вставленого в системний промпт. Це
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

Перевизначення бюджету промпта Skills для окремого агента.

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

Максимальний розмір у пікселях для найдовшої сторони зображення в блоках зображень транскрипта/інструмента перед викликами провайдера.
За замовчуванням: `1200`.

Нижчі значення зазвичай зменшують використання vision-токенів і розмір корисного навантаження запиту для запусків із великою кількістю знімків екрана.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Параметр стиснення/деталізації image-tool для зображень, завантажених із файлових шляхів, URL-адрес і посилань на медіа.
За замовчуванням: `auto`.

OpenClaw адаптує драбину зміни розміру до вибраної моделі зображень. Наприклад, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL і розміщені моделі Llama 4 vision можуть використовувати більші зображення, ніж старіші/стандартні шляхи vision із високою деталізацією, тоді як ходи з кількома зображеннями стискаються агресивніше в режимі `auto`, щоб контролювати вартість токенів і затримки.

Значення:

- `auto`: адаптуватися до обмежень моделі та кількості зображень.
- `efficient`: віддавати перевагу меншим зображенням для нижчого використання токенів і байтів.
- `balanced`: використовувати стандартну проміжну драбину.
- `high`: зберігати більше деталей для знімків екрана, діаграм і зображень документів.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного промпта (не для часових міток повідомлень). Повертається до часового поясу хоста.

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
  - Об’єктна форма задає основну модель плюс упорядковані моделі аварійного перемикання.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація vision-моделі.
  - Також використовується як fallback-маршрутизація, коли вибрана/стандартна модель не може приймати зображення на вході.
  - Надавайте перевагу явним посиланням `provider/model`. Голі ID приймаються для сумісності; якщо голий ID однозначно відповідає налаштованому запису з підтримкою зображень у `models.providers.*.models`, OpenClaw уточнює його до цього провайдера. Неоднозначні налаштовані збіги потребують явного префікса провайдера.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для виводу OpenAI PNG/WebP із прозорим фоном.
  - Якщо ви вибираєте провайдер/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо пропущено, `image_generate` усе ще може вивести стандартного провайдера, підкріпленого автентифікацією. Він спочатку пробує поточного стандартного провайдера, а потім решту зареєстрованих провайдерів генерації зображень у порядку ID провайдера.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо пропущено, `music_generate` усе ще може вивести стандартного провайдера, підкріпленого автентифікацією. Він спочатку пробує поточного стандартного провайдера, а потім решту зареєстрованих провайдерів генерації музики в порядку ID провайдера.
  - Якщо ви вибираєте провайдер/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо пропущено, `video_generate` усе ще може вивести стандартного провайдера, підкріпленого автентифікацією. Він спочатку пробує поточного стандартного провайдера, а потім решту зареєстрованих провайдерів генерації відео в порядку ID провайдера.
  - Якщо ви вибираєте провайдер/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
  - Офіційний plugin генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо пропущено, інструмент PDF повертається до `imageModel`, а потім до розв’язаної моделі сеансу/стандартної моделі.
- `pdfMaxBytesMb`: стандартний ліміт розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: стандартна максимальна кількість сторінок, які враховуються режимом fallback-витягання в інструменті `pdf`.
- `verboseDefault`: стандартний рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. Стандартне: `"off"`.
- `toolProgressDetail`: режим деталізації для підсумків інструментів `/verbose` і рядків чернеток прогресу інструментів. Значення: `"explain"` (стандартне, компактні зрозумілі людині мітки) або `"raw"` (додає необроблену команду/деталі, коли доступні). `agents.list[].toolProgressDetail` для окремого агента перевизначає це стандартне значення.
- `reasoningDefault`: стандартна видимість reasoning для агентів. Значення: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` для окремого агента перевизначає це стандартне значення. Налаштовані стандартні значення reasoning застосовуються лише для власників, авторизованих відправників або контекстів Gateway оператора-адміністратора, коли не задано перевизначення reasoning для окремого повідомлення чи сеансу.
- `elevatedDefault`: стандартний рівень elevated-output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Стандартне: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ OpenAI або Codex OAuth). Якщо ви пропускаєте провайдера, OpenClaw спочатку пробує псевдонім, потім унікальний збіг налаштованого провайдера для цього точного ID моделі, і лише потім повертається до налаштованого стандартного провайдера (застаріла поведінка сумісності, тому надавайте перевагу явному `provider/model`). Якщо цей провайдер більше не надає налаштовану стандартну модель, OpenClaw повертається до першого налаштованого провайдера/моделі замість показу застарілого стандартного значення видаленого провайдера.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, маршрутизацію OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Використовуйте записи `provider/*`, такі як `"openai/*": {}` або `"vllm/*": {}`, щоб показати всі виявлені моделі для вибраних провайдерів без ручного переліку кожного ID моделі.
  - Додайте `agentRuntime` до запису `provider/*`, коли кожна динамічно виявлена модель для цього провайдера має використовувати той самий runtime. Точна runtime-політика `provider/model` усе одно має пріоритет над wildcard.
  - Безпечні редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи. `config set` відхиляє заміни, які видалили б наявні записи allowlist, якщо ви не передасте `--replace`.
  - Потоки налаштування/onboarding у межах провайдера об’єднують вибрані моделі провайдера в цю мапу й зберігають уже налаштованих непов’язаних провайдерів.
  - Для прямих моделей OpenAI Responses server-side compaction увімкнено автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити ін’єкцію `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [OpenAI server-side compaction](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні стандартні параметри провайдера, застосовані до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет об’єднання `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для окремої моделі), потім `agents.list[].params` (відповідний ID агента) перевизначає за ключем. Докладніше див. [Prompt Caching](/uk/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: загальна стандартна політика маршрутизації провайдера для OpenRouter. OpenClaw передає це до об’єкта `provider` запиту OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` для окремої моделі та параметри агента перевизначають за ключем. Див. [OpenRouter provider routing](/uk/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: розширений наскрізний JSON, що об’єднується в тіла запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, додаткове тіло має пріоритет; ненативні маршрути completions усе одно потім вилучають OpenAI-only `store`.
- `params.chat_template_kwargs`: vLLM/OpenAI-сумісні аргументи chat-template, об’єднані в тіла запитів верхнього рівня `api: "openai-completions"`. Для `vllm/nemotron-3-*` з вимкненим thinking вбудований plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані стандартні значення, а `extra_body.chat_template_kwargs` усе ще має остаточний пріоритет. Налаштовані vLLM Qwen і Nemotron thinking-моделі показують бінарні варіанти `/think` (`off`, `on`) замість багаторівневої шкали effort.
- `compat.thinkingFormat`: OpenAI-сумісний стиль payload thinking. Використовуйте `"together"` для Together-стилю `reasoning.enabled`, `"qwen"` для Qwen-стилю верхнього рівня `enable_thinking` або `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на бекендах родини Qwen, які підтримують kwargs chat-template на рівні запиту, як-от vLLM. OpenClaw відображає вимкнений thinking у `false`, а ввімкнений thinking у `true`, і налаштовані моделі vLLM Qwen показують бінарні варіанти `/think` для цих форматів.
- `compat.supportedReasoningEfforts`: список OpenAI-сумісних reasoning effort для окремої моделі. Додайте `"xhigh"` для користувацьких endpoint, які справді його приймають; OpenClaw тоді показує `/think xhigh` у меню команд, рядках сеансів Gateway, валідації patch сеансу, валідації CLI агента та валідації `llm-task` для цього налаштованого провайдера/моделі. Використовуйте `compat.reasoningEffortMap`, коли бекенд потребує специфічного для провайдера значення для канонічного рівня.
- `params.preserveThinking`: opt-in лише для Z.AI для збереженого thinking. Коли ввімкнено і thinking увімкнений, OpenClaw надсилає `thinking.clear_thinking: false` і повторно відтворює попередній `reasoning_content`; див. [Z.AI thinking and preserved thinking](/uk/providers/zai#thinking-and-preserved-thinking).
- `localService`: необов’язковий менеджер процесів рівня провайдера для локальних/self-hosted серверів моделей. Коли вибрана модель належить цьому провайдеру, OpenClaw перевіряє `healthUrl` (або `baseUrl + "/models"`), запускає `command` з `args`, якщо endpoint недоступний, чекає до `readyTimeoutMs`, а потім надсилає запит моделі. `command` має бути абсолютним шляхом. `idleStopMs: 0` тримає процес активним, доки OpenClaw не завершиться; додатне значення зупиняє процес, породжений OpenClaw, після такої кількості мілісекунд бездіяльності. Див. [Local model services](/uk/gateway/local-model-services).
- Runtime-політика належить провайдерам або моделям, а не `agents.defaults`. Використовуйте `models.providers.<provider>.agentRuntime` для правил усього провайдера або `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` для правил конкретної моделі. Моделі агентів OpenAI в офіційному провайдері OpenAI стандартно вибирають Codex.
- Засоби запису конфігурації, які змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення fallback), зберігають канонічну об’єктну форму й за можливості зберігають наявні списки fallback.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сеансами (кожен сеанс усе одно серіалізований). Стандартне: 4.

### Runtime-політика

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

- `id`: `"auto"`, `"openclaw"`, зареєстрований ідентифікатор plugin harness або підтримуваний псевдонім бекенда CLI. Вбудований Plugin Codex реєструє `codex`; вбудований Plugin Anthropic надає бекенд CLI `claude-cli`.
- `id: "auto"` дає зареєстрованим plugin harness змогу приймати підтримувані ходи й використовує OpenClaw, коли жоден harness не збігається. Явне середовище виконання Plugin, як-от `id: "codex"`, потребує цього harness і відмовляє в закритому режимі, якщо він недоступний або завершується помилкою.
- `id: "pi"` приймається лише як застарілий псевдонім для `openclaw`, щоб зберегти випущені конфігурації з v2026.5.22 і раніших версій. Нова конфігурація має використовувати `openclaw`.
- Пріоритет середовища виконання: спершу точна політика моделі (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` або `models.providers.<provider>.models[]`), потім `agents.list[]` / `agents.defaults.models["provider/*"]`, потім політика на рівні всього провайдера в `models.providers.<provider>.agentRuntime`.
- Ключі середовища виконання для всього агента є застарілими. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, прив’язки середовища виконання сесії та `OPENCLAW_AGENT_RUNTIME` ігноруються під час вибору середовища виконання. Запустіть `openclaw doctor --fix`, щоб прибрати застарілі значення.
- Агентські моделі OpenAI типово використовують harness Codex; provider/model `agentRuntime.id: "codex"` залишається чинним, коли потрібно вказати це явно.
- Для розгортань Claude CLI віддавайте перевагу `model: "anthropic/claude-opus-4-8"` разом із прив’язаним до моделі `agentRuntime.id: "claude-cli"`. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` досі працюють для сумісності, але нова конфігурація має зберігати канонічний вибір provider/model і розміщувати бекенд виконання в політиці середовища виконання provider/model.
- Це керує лише виконанням текстових агентських ходів. Генерація медіа, vision, PDF, музика, відео та TTS досі використовують власні налаштування provider/model.

**Вбудовані скорочені псевдоніми** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

| Псевдонім           | Модель                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Ваші налаштовані псевдоніми завжди мають пріоритет над типовими.

Моделі Z.AI GLM-4.x автоматично вмикають режим thinking, якщо ви не задасте `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI типово вмикають `tool_stream` для потокового передавання викликів інструментів. Задайте `agents.defaults.models["zai/<model>"].params.tool_stream` як `false`, щоб вимкнути це.
Anthropic Claude Opus 4.8 в OpenClaw типово тримає thinking вимкненим; коли adaptive thinking явно ввімкнено, кероване провайдером типове значення effort від Anthropic — `high`. Моделі Claude 4.6 типово використовують `adaptive`, коли явний рівень thinking не задано.

### `agents.defaults.cliBackends`

Необов’язкові бекенди CLI для текстових резервних запусків (без викликів інструментів). Корисно як запасний варіант, коли API-провайдери дають збій.

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

- Бекенди CLI передусім текстові; інструменти завжди вимкнені.
- Сесії підтримуються, коли задано `sessionArg`.
- Прозоре передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.
- `reseedFromRawTranscriptWhenUncompacted: true` дає бекенду змогу відновлювати безпечні
  інвалідовані сесії з обмеженого хвоста сирого транскрипту OpenClaw перед тим, як
  з’явиться перше зведення Compaction. Зміни профілю автентифікації або епохи облікових даних
  досі ніколи не виконують повторне засівання з сирого транскрипту.

### `agents.defaults.promptOverlays`

Незалежні від провайдера накладки prompt, що застосовуються за сімейством моделей на поверхнях prompt, зібраних OpenClaw. Ідентифікатори моделей сімейства GPT-5 отримують спільний поведінковий контракт на маршрутах OpenClaw/провайдера; `personality` керує лише дружнім шаром стилю взаємодії. Нативні маршрути Codex app-server зберігають базові/модельні інструкції, керовані Codex, замість цієї накладки OpenClaw GPT-5, а OpenClaw вимикає вбудовану personality Codex для нативних потоків.

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

- `"friendly"` (типово) і `"on"` вмикають дружній шар стилю взаємодії.
- `"off"` вимикає лише дружній шар; позначений поведінковий контракт GPT-5 залишається ввімкненим.
- Застарілий `plugins.entries.openai.config.personality` досі читається, коли це спільне налаштування не задано.

### `agents.defaults.heartbeat`

Періодичні запуски Heartbeat.

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

- `every`: рядок тривалості (ms/s/m/h). Типово: `30m` (автентифікація API-ключем) або `1h` (автентифікація OAuth). Задайте `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли false, пропускає розділ Heartbeat із системного prompt і не ін’єктує `HEARTBEAT.md` у bootstrap-контекст. Типово: `true`.
- `suppressToolErrorWarnings`: коли true, пригнічує payload-попередження про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для агентського ходу Heartbeat до його переривання. Не задавайте, щоб використовувати `agents.defaults.timeoutSeconds`, якщо його задано; інакше використовується каденція Heartbeat з обмеженням 600 секунд.
- `directPolicy`: політика прямої/DM-доставки. `allow` (типово) дозволяє доставку до прямої цілі. `block` пригнічує доставку до прямої цілі й видає `reason=dm-blocked`.
- `lightContext`: коли true, запуски Heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів робочої області.
- `isolatedSession`: коли true, кожен Heartbeat запускається у свіжій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як у cron `sessionTarget: "isolated"`. Зменшує вартість токенів на один Heartbeat приблизно зі 100K до 2-5K токенів.
- `skipWhenBusy`: коли true, запуски Heartbeat відкладаються на додаткових зайнятих lane цього агента: його власній прив’язаній до ключа сесії роботі subagent або вкладених команд. Lane Cron завжди відкладають Heartbeat, навіть без цього прапорця.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, Heartbeat запускають **лише ці агенти**.
- Heartbeat виконує повні агентські ходи — коротші інтервали витрачають більше токенів.

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

- `mode`: `default` або `safeguard` (фрагментоване узагальнення для довгих історій). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin постачальника compaction. Якщо задано, викликається `summarize()` постачальника замість вбудованого узагальнення LLM. У разі збою повертається до вбудованого варіанта. Задання постачальника примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції compaction, перш ніж OpenClaw її перерве. Типово: `180`.
- `keepRecentTokens`: бюджет точки відсікання агента для збереження найновішого хвоста транскрипту дослівно. Ручний `/compact` враховує це, коли явно задано; інакше ручна compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає на початок вбудовані настанови щодо збереження непрозорих ідентифікаторів під час узагальнення compaction.
- `identifierInstructions`: необов’язковий користувацький текст для збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою у разі некоректно сформованого виводу для safeguard-узагальнень. Увімкнено типово в режимі safeguard; задайте `enabled: false`, щоб пропустити аудит.
- `midTurnPrecheck`: необов’язкова перевірка навантаження циклу інструментів. Коли `enabled: true`, OpenClaw перевіряє навантаження контексту після додавання результатів інструментів і перед наступним викликом моделі. Якщо контекст більше не вміщується, він перериває поточну спробу перед надсиланням prompt і повторно використовує наявний шлях відновлення precheck, щоб обрізати результати інструментів або виконати compaction і повторити спробу. Працює з обома режимами compaction: `default` і `safeguard`. Типово: вимкнено.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md для повторного вставлення після compaction. Повторне вставлення вимкнено, коли не задано або задано `[]`. Явне задання `["Session Startup", "Red Lines"]` вмикає цю пару та зберігає застарілий fallback `Every Session`/`Safety`. Умикайте це лише тоді, коли додатковий контекст вартий ризику дублювання проєктних настанов, уже захоплених у підсумку compaction.
- `model`: необов’язковий `provider/model-id` або простий псевдонім із `agents.defaults.models` лише для узагальнення compaction. Прості псевдоніми розв’язуються перед dispatch; налаштовані буквальні ID моделей зберігають пріоритет у разі збігів. Використовуйте це, коли основна сесія має зберігати одну модель, а підсумки compaction мають виконуватися на іншій; якщо не задано, compaction використовує основну модель сесії.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), який запускає звичайну локальну compaction перед запуском, коли активний JSONL перевищує поріг. Потребує `truncateAfterCompaction`, щоб успішна compaction могла перейти на менший наступний транскрипт. Вимкнено, коли не задано або `0`.
- `notifyUser`: коли `true`, надсилає користувачу короткі сповіщення, коли compaction починається і коли завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб compaction залишалася тихою.
- `memoryFlush`: тихий агентний хід перед auto-compaction для збереження довготривалих спогадів. Задайте `model` як точну пару постачальник/модель, наприклад `ollama/qwen3:8b`, коли цей службовий хід має залишатися на локальній моделі; перевизначення не успадковує fallback-ланцюг активної сесії. Пропускається, коли робочий простір доступний лише для читання.

### `agents.defaults.runRetries`

Межі ітерацій повторних спроб зовнішнього циклу запуску для вбудованого runtime агента, щоб запобігти нескінченним циклам виконання під час відновлення після збоїв. Зауважте, що це налаштування наразі застосовується лише до вбудованого runtime агента, а не до runtime ACP або CLI.

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

- `base`: базова кількість ітерацій повторних спроб запуску для зовнішнього циклу запуску. Типово: `24`.
- `perProfile`: додаткові ітерації повторних спроб запуску, що надаються для кожного кандидата fallback-профілю. Типово: `8`.
- `min`: мінімальна абсолютна межа для ітерацій повторних спроб запуску. Типово: `32`.
- `max`: максимальна абсолютна межа для ітерацій повторних спроб запуску, щоб запобігти неконтрольованому виконанню. Типово: `160`.

### `agents.defaults.contextPruning`

Очищає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

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

- `mode: "cache-ttl"` вмикає проходи очищення.
- `ttl` керує тим, як часто очищення може запускатися знову (після останнього торкання кешу).
- Очищення спочатку м’яко обрізає завеликі результати інструментів, а потім, за потреби, повністю очищає старіші результати інструментів.
- `softTrimRatio` і `hardClearRatio` приймають значення від `0.0` до `1.0`; перевірка конфігурації відхиляє значення поза цим діапазоном.

**М’яке обрізання** зберігає початок + кінець і вставляє `...` посередині.

**Повне очищення** замінює весь результат інструмента placeholder.

Примітки:

- Блоки зображень ніколи не обрізаються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, очищення пропускається.

</Accordion>

Див. [Очищення сесії](/uk/concepts/session-pruning), щоб дізнатися подробиці поведінки.

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
- Перевизначення каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Signal/Slack/Discord/Google Chat типово використовують `minChars: 1500`.
- `humanDelay`: рандомізована пауза між блоковими відповідями. `natural` = 800–2500ms. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Див. [Потокове передавання](/uk/concepts/streaming), щоб дізнатися подробиці поведінки й фрагментування.

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

- Типові значення: `instant` для прямих чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для окремої сесії: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Індикатори набору](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова пісочниця для вбудованого агента. Див. [Пісочниця](/uk/gateway/sandboxing), щоб отримати повний посібник.

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

- `docker`: локальний Docker runtime (типово)
- `ssh`: універсальний віддалений runtime на базі SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, налаштування, специфічні для runtime, переміщуються до
`plugins.entries.openshell.config`.

**Конфігурація backend SSH:**

- `target`: SSH-ціль у формі `user@host[:port]`
- `command`: команда SSH-клієнта (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для робочих просторів кожної області
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, передані до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: inline-вміст або SecretRefs, які OpenClaw матеріалізує в тимчасові файли під час runtime
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на базі SecretRef розв’язуються з активного snapshot runtime секретів перед запуском сесії пісочниці

**Поведінка backend SSH:**

- одноразово засіває віддалений робочий простір після створення або повторного створення
- потім зберігає віддалений SSH-робочий простір канонічним
- маршрутизує `exec`, файлові інструменти та медіа-шляхи через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує браузерні контейнери пісочниці

**Доступ до робочого простору:**

- `none`: робочий простір пісочниці для кожної області під `~/.openclaw/sandboxes`
- `ro`: робочий простір пісочниці в `/workspace`, робочий простір агента змонтовано лише для читання в `/agent`
- `rw`: робочий простір агента змонтовано для читання/запису в `/workspace`

**Область:**

- `session`: контейнер + робочий простір для кожної сесії
- `agent`: один контейнер + робочий простір на агента (типово)
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

- `mirror`: заповнює віддалене середовище з локального перед виконанням, синхронізує назад після виконання; локальний робочий простір лишається канонічним
- `remote`: заповнює віддалене середовище один раз під час створення пісочниці, а потім зберігає віддалений робочий простір канонічним

У режимі `remote` локальні зміни на хості, зроблені поза OpenClaw, не синхронізуються в пісочницю автоматично після кроку початкового заповнення.
Транспортом є SSH в пісочницю OpenShell, але Plugin володіє життєвим циклом пісочниці та необов’язковою дзеркальною синхронізацією.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потребує мережевого виходу, кореневої файлової системи з правом запису та користувача root.

**Контейнери за замовчуванням мають `network: "none"`** — установіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` заблоковано за замовчуванням, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний обхід).
Ходи сервера застосунку Codex в активній пісочниці OpenClaw використовують це саме налаштування виходу для власного мережевого доступу в режимі коду.

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки на рівні агента об’єднуються.

**Браузер у пісочниці** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системний промпт. Не потребує `browser.enabled` в `openclaw.json`.
Доступ спостерігача noVNC за замовчуванням використовує автентифікацію VNC, а OpenClaw видає короткочасний URL із токеном (замість розкриття пароля в спільному URL).

- `allowHostControl: false` (за замовчуванням) блокує для сесій у пісочниці можливість націлюватися на браузер хоста.
- `network` за замовчуванням має значення `openclaw-sandbox-browser` (виділена bridge-мережа). Установлюйте `bridge` лише тоді, коли вам явно потрібне глобальне підключення до bridge.
- `cdpSourceRange` необов’язково обмежує вхід CDP на межі контейнера діапазоном CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера пісочниці. Якщо задано (включно з `[]`), це замінює `docker.binds` для контейнера браузера.
- Стандартні параметри запуску визначені в `scripts/sandbox-browser-entrypoint.sh` і налаштовані для контейнерних хостів:
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
  - `--disable-extensions` (увімкнено за замовчуванням)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    увімкнені за замовчуванням і можуть бути вимкнені за допомогою
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити за допомогою
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    стандартне обмеження процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Стандартні значення є базовою лінією образу контейнера; використовуйте власний образ браузера з власною
    точкою входу, щоб змінити стандартні параметри контейнера.

</Accordion>

Пісочниця браузера та `sandbox.docker.binds` працюють лише з Docker.

Збирання образів (із checkout вихідного коду):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Для встановлень npm без checkout вихідного коду див. [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) щодо вбудованих команд `docker build`.

### `agents.list` (перевизначення на рівні агента)

Використовуйте `agents.list[].tts`, щоб надати агенту власного провайдера TTS, голос, модель,
стиль або режим автоматичного TTS. Блок агента глибоко об’єднується поверх глобального
`messages.tts`, тож спільні облікові дані можуть лишатися в одному місці, а окремі
агенти перевизначають лише потрібні їм поля голосу або провайдера. Перевизначення активного агента
застосовується до автоматичних голосових відповідей, `/tts audio`, `/tts status` і
інструмента агента `tts`. Див. [Перетворення тексту на мовлення](/uk/tools/tts#per-agent-voice-overrides)
для прикладів провайдерів і пріоритетності.

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

- `id`: стабільний ідентифікатор агента (обов’язково).
- `default`: коли задано кілька, перший перемагає (записується попередження). Якщо не задано жодного, типовим є перший запис списку.
- `model`: рядкова форма задає сувору основну модель на рівні агента без резервної моделі; об’єктна форма `{ primary }` також сувора, якщо ви не додасте `fallbacks`. Використовуйте `{ primary, fallbacks: [...] }`, щоб увімкнути для цього агента резервні моделі, або `{ primary, fallbacks: [] }`, щоб явно задати сувору поведінку. Завдання Cron, які перевизначають лише `primary`, усе ще успадковують стандартні резервні моделі, якщо не встановити `fallbacks: []`.
- `params`: параметри потоку на рівні агента, об’єднані поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для агент-специфічних перевизначень на кшталт `cacheRetention`, `temperature` або `maxTokens` без дублювання всього каталогу моделей.
- `tts`: необов’язкові перевизначення перетворення тексту на мовлення на рівні агента. Блок глибоко об’єднується поверх `messages.tts`, тож зберігайте спільні облікові дані провайдера та політику резервування в `messages.tts`, а тут задавайте лише специфічні для персони значення, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий список дозволених Skills на рівні агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, коли це задано; явний список замінює стандартні значення замість об’єднання, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий стандартний рівень мислення на рівні агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення на рівні повідомлення або сесії. Вибраний профіль провайдера/моделі контролює, які значення є дійсними; для Google Gemini `adaptive` зберігає динамічне мислення, кероване провайдером (`thinkingLevel` пропущено на Gemini 3/3.1, `thinkingBudget: -1` на Gemini 2.5).
- `reasoningDefault`: необов’язкова стандартна видимість міркування на рівні агента (`on | off | stream`). Перевизначає `agents.defaults.reasoningDefault` для цього агента, коли не задано перевизначення міркування на рівні повідомлення або сесії.
- `fastModeDefault`: необов’язкове стандартне значення швидкого режиму на рівні агента (`"auto" | true | false`). Застосовується, коли не задано перевизначення швидкого режиму на рівні повідомлення або сесії.
- `models`: необов’язкові перевизначення каталогу моделей/середовища виконання на рівні агента, індексовані повними ідентифікаторами `provider/model`. Використовуйте `models["provider/model"].agentRuntime` для винятків середовища виконання на рівні агента.
- `runtime`: необов’язковий дескриптор середовища виконання на рівні агента. Використовуйте `type: "acp"` зі стандартними значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має за замовчуванням використовувати сесії harness ACP.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- Локальні файли зображень `identity.avatar` із шляхом відносно робочого простору обмежені 2 МБ. URL `http(s)` і URI `data:` не перевіряються локальним обмеженням розміру файлу.
- `identity` виводить стандартні значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених налаштованих ідентифікаторів агентів для явних цілей `sessions_spawn.agentId` (`["*"]` = будь-яка налаштована ціль; за замовчуванням: лише той самий агент). Додайте ідентифікатор запитувача, коли мають бути дозволені виклики `agentId`, спрямовані на себе. Застарілі записи, конфігурацію агента яких видалено, відхиляються `sessions_spawn` і пропускаються в `agents_list`; запустіть `openclaw doctor --fix`, щоб очистити їх, або додайте мінімальний запис `agents.list[]`, якщо ця ціль має лишатися доступною для запуску з успадкуванням стандартних значень.
- Запобіжник успадкування пісочниці: якщо сесія запитувача перебуває в пісочниці, `sessions_spawn` відхиляє цілі, які запускалися б без пісочниці.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, які пропускають `agentId` (примушує явний вибір профілю; за замовчуванням: false).

---

## Маршрутизація кількох агентів

Запускайте кілька ізольованих агентів всередині одного Gateway. Див. [Кілька агентів](/uk/concepts/multi-agent).

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

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній тип за замовчуванням означає route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; пропущено = стандартний обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічно для каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок зіставлення:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний, без peer/guild/team)
5. `match.accountId: "*"` (на рівні всього каналу)
6. Стандартний агент

У межах кожного рівня перемагає перший відповідний запис `bindings`.

Для записів `type: "acp"` OpenClaw розв’язує за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище рівневий порядок прив’язок маршруту.

### Профілі доступу на рівні агента

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

Докладніше про пріоритети див. у [Пісочниця та інструменти для багатоагентного режиму](/uk/tools/multi-agent-sandbox-tools).

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

<Accordion title="Докладний опис полів сесії">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (типово): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: спосіб групування приватних повідомлень.
  - `main`: усі приватні повідомлення спільно використовують основну сесію.
  - `per-peer`: ізоляція за id відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для вхідних скриньок із кількома користувачами).
  - `per-account-channel-peer`: ізоляція за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: зіставляє канонічні id з учасниками з префіксом провайдера для спільного використання сесій між каналами. Команди Dock, як-от `/dock_discord`, використовують те саме зіставлення, щоб перемкнути маршрут відповіді активної сесії на іншого пов’язаного учасника каналу; див. [стикування каналів](/uk/concepts/channel-docking).
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва, спрацьовує те, що настане першим. Актуальність щоденного скидання використовує `sessionStartedAt` рядка сесії; актуальність скидання за неактивністю використовує `lastInteractionAt`. Фонові/системні записи подій, як-от Heartbeat, пробудження Cron, сповіщення exec і службовий облік Gateway, можуть оновлювати `updatedAt`, але вони не підтримують актуальність щоденних/неактивних сесій.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як псевдонім для `direct`.
- **`mainKey`**: застаріле поле. Середовище виконання завжди використовує `"main"` для основного кошика прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів відповіді між агентами під час обмінів агент-агент (ціле число, діапазон: `0`-`20`, типово: `5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона перемагає.
- **`maintenance`**: елементи керування очищенням і зберіганням сховища сесій.
  - `mode`: `enforce` застосовує очищення і є типовим значенням; `warn` лише виводить попередження.
  - `pruneAfter`: вікова межа для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`). Середовище виконання записує пакетне очищення з невеликим буфером верхнього порога для лімітів виробничого розміру; `openclaw sessions cleanup --enforce` застосовує ліміт негайно.
  - Короткочасні пробні сесії запуску моделі Gateway використовують фіксоване зберігання `24h`, але очищення залежить від тиску: воно видаляє застарілі суворі рядки проб запуску моделі лише тоді, коли досягнуто тиску обслуговування/ліміту записів сесій. Придатні лише суворі явні ключі проб, що відповідають `agent:*:explicit:model-run-<uuid>`; звичайні прямі, групові, потокові, cron, hook, Heartbeat, ACP і під-агентські сесії не успадковують це 24-годинне зберігання. Коли запускається очищення запусків моделі, воно виконується перед ширшим очищенням застарілих записів `pruneAfter` і лімітом `maxEntries`.
  - `rotateBytes`: застаріле та ігнорується; `openclaw doctor --fix` видаляє його зі старіших конфігурацій.
  - `resetArchiveRetention`: зберігання архівів транскриптів `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий бюджет диска для каталогу сесій. У режимі `warn` записує попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сесій, прив’язаних до потоків.
  - `enabled`: головний типовий перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокуса після неактивності в годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `spawnSessions`: типовий шлюз для створення прив’язаних до потоків робочих сесій із `sessions_spawn` і породжень потоків ACP. Типово `true`, коли прив’язки потоків увімкнено; провайдери/облікові записи можуть перевизначати.
  - `defaultSpawnContext`: типовий нативний контекст під-агента для породжень, прив’язаних до потоків (`"fork"` або `"isolated"`). Типово `"fork"`.

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

### Префікс відповіді

Перевизначення для каналу/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Розв’язання (найконкретніше перемагає): обліковий запис → канал → глобальне. `""` вимикає і зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна            | Опис                   | Приклад                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі   | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера       | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень мислення | `high`, `low`, `off`        |
| `{identity.name}` | Назва ідентичності агента | (те саме, що `"auto"`)      |

Змінні не чутливі до регістру. `{think}` є псевдонімом для `{thinkingLevel}`.

### Реакція підтвердження

- Типово дорівнює `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок розв’язання: обліковий запис → канал → `messages.ackReaction` → резервна ідентичність.
- Область: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в каналах, що підтримують реакції, як-от Slack, Discord, Telegram, WhatsApp та iMessage.
- `messages.statusReactions.enabled`: вмикає реакції стану життєвого циклу в Slack, Discord, Telegram і WhatsApp.
  У Slack і Discord невстановлене значення зберігає реакції стану ввімкненими, коли активні реакції підтвердження.
  У Telegram і WhatsApp явно встановіть його в `true`, щоб увімкнути реакції стану життєвого циклу.
- `messages.statusReactions.emojis`: перевизначає ключі emoji життєвого циклу:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` і `stallHard`.
  Telegram дозволяє лише фіксований набір реакцій, тому непідтримувані налаштовані emoji повертаються
  до найближчого підтримуваного варіанта стану для цього чату.

### Вхідне відтермінування

Групує швидкі текстові повідомлення від того самого відправника в один хід агента. Медіа/вкладення скидають групування негайно. Керівні команди обходять відтермінування.

### TTS (перетворення тексту на мовлення)

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

- `auto` керує стандартним режимом автоматичного TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` увімкнено за замовчуванням; `modelOverrides.allowProvider` за замовчуванням має значення `false` (потрібне явне ввімкнення).
- API-ключі використовують резервні `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані постачальники мовлення належать Plugin. Якщо задано `plugins.allow`, додайте кожен Plugin постачальника TTS, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий ідентифікатор постачальника `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на кінцеву точку не OpenAI, OpenClaw розглядає її як сумісний з OpenAI сервер TTS і послаблює перевірку моделі/голосу.

---

## Розмова

Стандартні налаштування для режиму «Розмова» (macOS/iOS/Android).

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

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кілька постачальників режиму «Розмова».
- Застарілі пласкі ключі режиму «Розмова» (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) підтримуються лише для сумісності. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію в `talk.providers.<provider>`.
- Ідентифікатори голосів використовують резервні `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає рядки відкритого тексту або об’єкти SecretRef.
- Резервний `ELEVENLABS_API_KEY` застосовується лише тоді, коли API-ключ режиму «Розмова» не налаштовано.
- `providers.*.voiceAliases` дає директивам режиму «Розмова» змогу використовувати зручні імена.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний помічник MLX для macOS. Якщо пропущено, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX на macOS працює через вбудований помічник `openclaw-mlx-tts`, якщо він наявний, або через виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `consultThinkingLevel` керує рівнем мислення для повного запуску агента OpenClaw за викликами Control UI Talk realtime `openclaw_agent_consult`. Залиште незаданим, щоб зберегти звичайну поведінку сеансу/моделі.
- `consultFastMode` задає одноразове перевизначення швидкого режиму для realtime-консультацій Control UI Talk без зміни звичайного налаштування швидкого режиму сеансу.
- `speechLocale` задає ідентифікатор локалі BCP 47, який використовується розпізнаванням мовлення iOS/macOS у режимі «Розмова». Залиште незаданим, щоб використовувати стандартне значення пристрою.
- `silenceTimeoutMs` керує тим, як довго режим «Розмова» чекає після тиші користувача, перш ніж надіслати транскрипт. Якщо не задано, зберігається стандартне для платформи вікно паузи (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` додає системні інструкції для постачальника до вбудованого realtime-промпта OpenClaw, тож стиль голосу можна налаштувати без втрати стандартних вказівок `openclaw_agent_consult`.
- `realtime.consultRouting` керує резервною ретрансляцією Gateway, коли realtime-постачальник створює фінальний користувацький транскрипт без `openclaw_agent_consult`: `provider-direct` зберігає прямі відповіді постачальника, а `force-agent-consult` спрямовує фіналізований запит через OpenClaw.

---

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
