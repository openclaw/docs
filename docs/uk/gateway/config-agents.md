---
read_when:
    - Налаштування типових параметрів агента (моделі, мислення, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування маршрутизації та прив’язок для кількох агентів
    - Налаштування поведінки сеансу, доставки повідомлень і режиму розмови
summary: Стандартні налаштування агента, маршрутизація між кількома агентами, сеанс, повідомлення та конфігурація talk
title: Налаштування — агенти
x-i18n:
    generated_at: "2026-07-03T17:40:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3f5d217738a8eebc3c94b61261ca34221b13ac08ffdba9cad61c9a48ed1ac
    source_path: gateway/config-agents.md
    workflow: 16
---

Ключі конфігурації в межах агента під `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Стандартні параметри агента

### `agents.defaults.workspace`

Стандартне значення: `OPENCLAW_WORKSPACE_DIR`, якщо встановлено, інакше `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Явне значення `agents.defaults.workspace` має пріоритет над
`OPENCLAW_WORKSPACE_DIR`. Використовуйте змінну середовища, щоб спрямувати стандартних агентів
на змонтований робочий простір, коли не хочете записувати цей шлях у конфігурацію.

### `agents.defaults.repoRoot`

Необов'язковий корінь репозиторію, що показується в рядку Runtime системного промпта. Якщо не задано, OpenClaw автоматично визначає його, рухаючись угору від робочого простору.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов'язковий стандартний список дозволених skill для агентів, які не задають
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює стандартні значення
      { id: "locked-down", skills: [] }, // без skills
    ],
  },
}
```

- Пропустіть `agents.defaults.skills`, щоб skills стандартно були без обмежень.
- Пропустіть `agents.list[].skills`, щоб успадкувати стандартні значення.
- Задайте `agents.list[].skills: []`, щоб вимкнути skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об'єднується зі стандартними значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення файлів початкового налаштування робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Пропускає створення вибраних необов'язкових файлів робочого простору, водночас продовжуючи записувати обов'язкові файли початкового налаштування. Допустимі значення: `SOUL.md`, `USER.md`, `HEARTBEAT.md` та `IDENTITY.md`.

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

Керує тим, коли файли початкового налаштування робочого простору вставляються в системний промпт. Стандартне значення: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторне вставлення початкового налаштування робочого простору, зменшуючи розмір промпта. Запуски Heartbeat і повторні спроби після Compaction все одно перебудовують контекст.
- `"never"`: вимкнути початкове налаштування робочого простору та вставлення контекстних файлів на кожному ході. Використовуйте це лише для агентів, які повністю володіють життєвим циклом свого промпта (власні рушії контексту, нативні середовища виконання, що будують власний контекст, або спеціалізовані робочі процеси без початкового налаштування). Ходи Heartbeat і відновлення після Compaction також пропускають вставлення.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Перевизначення для окремого агента: `agents.list[].contextInjection`. Пропущені значення успадковують
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на файл початкового налаштування робочого простору перед обрізанням. Стандартне значення: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Перевизначення для окремого агента: `agents.list[].bootstrapMaxChars`. Пропущені значення успадковують
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що вставляються з усіх файлів початкового налаштування робочого простору. Стандартне значення: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Перевизначення для окремого агента: `agents.list[].bootstrapTotalMaxChars`. Пропущені значення
успадковують `agents.defaults.bootstrapTotalMaxChars`.

### Перевизначення профілю початкового налаштування для окремого агента

Використовуйте перевизначення профілю початкового налаштування для окремого агента, коли одному агенту потрібна інша поведінка
вставлення промпта, ніж у спільних стандартних значеннях. Пропущені поля успадковуються з
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

Керує видимим для агента сповіщенням у системному промпті, коли контекст початкового налаштування обрізано.
Стандартне значення: `"always"`.

- `"off"`: ніколи не вставляти текст сповіщення про обрізання в системний промпт.
- `"once"`: вставити стисле сповіщення один раз для кожної унікальної сигнатури обрізання.
- `"always"`: вставляти стисле сповіщення під час кожного запуску, коли є обрізання (рекомендовано).

Докладні сирі/вставлені підрахунки та поля налаштування конфігурації залишаються в діагностиці, як-от
звіти про контекст/статус і журнали; звичайний користувацький/виконавчий контекст WebChat отримує лише
стисле сповіщення про відновлення.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Мапа володіння бюджетами контексту

OpenClaw має кілька великих бюджетів промпта/контексту, і вони
навмисно розділені за підсистемами, а не всі проходять через один універсальний
перемикач.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне вставлення початкового налаштування робочого простору.
- `agents.defaults.startupContext.*`:
  одноразова преамбула запуску моделі під час скидання/старту, включно з нещодавніми щоденними
  файлами `memory/*.md`. Прості команди чату `/new` і `/reset`
  підтверджуються без виклику моделі.
- `skills.limits.*`:
  компактний список skills, що вставляється в системний промпт.
- `agents.defaults.contextLimits.*`:
  обмежені фрагменти середовища виконання та вставлені блоки, якими володіє середовище виконання.
- `memory.qmd.limits.*`:
  розмір фрагмента індексованого пошуку пам'яті та вставлення.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує преамбулою першого ходу запуску, що вставляється під час запусків моделі після скидання/старту.
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
  метаданих обрізання та сповіщення про продовження.
- `memoryGetDefaultLines`: стандартне вікно рядків `memory_get`, коли `lines`
  пропущено.
- `toolResultMaxChars`: розширена межа результатів live-інструментів, що використовується для збережених
  результатів і відновлення після переповнення. Залиште незаданою для автоматичної межі модельного контексту:
  `16000` символів нижче 100K токенів, `32000` символів на 100K+ токенів і `64000`
  символів на 200K+ токенів. Явні значення до `1000000` приймаються для
  моделей із довгим контекстом, але ефективна межа все одно обмежена приблизно 30% від
  вікна контексту моделі. `openclaw doctor --deep` друкує ефективну межу,
  а doctor попереджає лише тоді, коли явне перевизначення застаріле або не має ефекту.
- `postCompactionMaxChars`: межа фрагмента AGENTS.md, що використовується під час вставлення
  оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для окремого агента для спільних перемикачів `contextLimits`. Пропущені поля успадковують
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
          toolResultMaxChars: 8000, // розширена межа для цього агента
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Глобальна межа для компактного списку skills, що вставляється в системний промпт. Це
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

Перевизначення для окремого агента для бюджету промпта skills.

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

Максимальний розмір у пікселях для найдовшої сторони зображення в блоках зображень транскрипту/інструментів перед викликами провайдера.
Стандартне значення: `1200`.

Нижчі значення зазвичай зменшують використання vision-токенів і розмір корисного навантаження запиту для запусків із великою кількістю скриншотів.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Перевага стиснення/деталізації інструмента зображень для зображень, завантажених зі шляхів файлів, URL-адрес і медіапосилань.
Стандартне значення: `auto`.

OpenClaw адаптує драбину зміни розміру до вибраної моделі зображень. Наприклад, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL і розміщені моделі Llama 4 vision можуть використовувати більші зображення, ніж старіші/стандартні шляхи vision із високою деталізацією, тоді як ходи з кількома зображеннями стискаються агресивніше в режимі `auto`, щоб контролювати витрати токенів і затримку.

Значення:

- `auto`: адаптуватися до обмежень моделі та кількості зображень.
- `efficient`: віддавати перевагу меншим зображенням для нижчого використання токенів і байтів.
- `balanced`: використовувати стандартну середню драбину.
- `high`: зберігати більше деталей для скриншотів, діаграм і зображень документів.

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

Формат часу в системному промпті. Стандартне значення: `auto` (налаштування ОС).

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
      params: { cacheRetention: "long" }, // глобальні стандартні параметри провайдера
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

- `model`: приймає або рядок (`"provider/model"`), або обʼєкт (`{ primary, fallbacks }`).
  - Рядкова форма задає лише основну модель.
  - Обʼєктна форма задає основну модель і впорядковані резервні моделі для перемикання в разі збою.
- `imageModel`: приймає або рядок (`"provider/model"`), або обʼєкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація моделі зору.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати зображення на вході.
  - Надавайте перевагу явним посиланням `provider/model`. Голі ID приймаються для сумісності; якщо голий ID однозначно відповідає налаштованому запису з підтримкою зображень у `models.providers.*.models`, OpenClaw кваліфікує його для цього провайдера. Неоднозначні налаштовані збіги потребують явного префікса провайдера.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або обʼєкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для виводу OpenAI PNG/WebP із прозорим фоном.
  - Якщо ви вибираєте провайдер/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо пропущено, `image_generate` усе одно може вивести типовий провайдер, підкріплений автентифікацією. Спершу він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації зображень у порядку provider-id.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або обʼєкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо пропущено, `music_generate` усе одно може вивести типовий провайдер, підкріплений автентифікацією. Спершу він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації музики в порядку provider-id.
  - Якщо ви вибираєте провайдер/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або обʼєкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо пропущено, `video_generate` усе одно може вивести типовий провайдер, підкріплений автентифікацією. Спершу він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації відео в порядку provider-id.
  - Якщо ви вибираєте провайдер/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
  - Офіційний plugin генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або обʼєкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо пропущено, інструмент PDF повертається до `imageModel`, а потім до розвʼязаної моделі сеансу/типової моделі.
- `pdfMaxBytesMb`: типовий ліміт розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, яку враховує резервний режим видобування в інструменті `pdf`.
- `verboseDefault`: типовий рівень докладності для агентів. Значення: `"off"`, `"on"`, `"full"`. Типово: `"off"`.
- `toolProgressDetail`: режим деталізації для підсумків інструментів `/verbose` і рядків чернеток прогресу інструментів. Значення: `"explain"` (типово, компактні зрозумілі людині мітки) або `"raw"` (додає сиру команду/деталі, коли доступно). `agents.list[].toolProgressDetail` для окремого агента перевизначає це типове значення.
- `reasoningDefault`: типова видимість міркувань для агентів. Значення: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` для окремого агента перевизначає це типове значення. Налаштовані типові значення міркувань застосовуються лише для власників, авторизованих відправників або контекстів Gateway адміністратора-оператора, коли не задано перевизначення міркувань для повідомлення чи сеансу.
- `elevatedDefault`: типовий рівень підвищеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типово: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ OpenAI або Codex OAuth). Якщо ви пропускаєте провайдера, OpenClaw спершу пробує псевдонім, потім унікальний збіг налаштованого провайдера для цього точного ID моделі, і лише потім повертається до налаштованого типового провайдера (застаріла поведінка сумісності, тому надавайте перевагу явному `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повертається до першої налаштованої пари провайдер/модель замість показу застарілого типового значення видаленого провайдера.
- `models`: налаштований каталог моделей і список дозволених моделей для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, маршрутизація OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Використовуйте записи `provider/*`, як-от `"openai/*": {}` або `"vllm/*": {}`, щоб показати всі виявлені моделі для вибраних провайдерів без ручного перелічення кожного ID моделі.
  - Додайте `agentRuntime` до запису `provider/*`, коли кожна динамічно виявлена модель для цього провайдера має використовувати той самий runtime. Точна політика runtime для `provider/model` усе одно має пріоритет над wildcard.
  - Безпечні редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи. `config set` відмовляється від замін, які видалили б наявні записи списку дозволених, якщо не передати `--replace`.
  - Потоки налаштування/онбордингу в межах провайдера обʼєднують вибрані моделі провайдера в цю мапу та зберігають уже налаштованих неповʼязаних провайдерів.
  - Для прямих моделей OpenAI Responses серверна Compaction вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити інʼєкцію `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [серверна Compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні типові параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет обʼєднання `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для окремої моделі), потім `agents.list[].params` (відповідний ID агента) перевизначає за ключем. Докладніше див. [кешування промптів](/uk/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: типова політика маршрутизації провайдера на рівні всього OpenRouter. OpenClaw передає її в обʼєкт `provider` запиту OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` для окремої моделі та параметри агента перевизначають за ключем. Див. [маршрутизація провайдера OpenRouter](/uk/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: розширений наскрізний JSON, що обʼєднується в тіла запитів `api: "openai-completions"` для проксі, сумісних з OpenAI. Якщо він конфліктує зі згенерованими ключами запиту, додаткове тіло має пріоритет; ненативні маршрути completions після цього все одно вилучають OpenAI-only `store`.
- `params.chat_template_kwargs`: аргументи chat-template, сумісні з vLLM/OpenAI, що обʼєднуються в тіла запитів верхнього рівня `api: "openai-completions"`. Для `vllm/nemotron-3-*` з вимкненим thinking вбудований plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані типові значення, а `extra_body.chat_template_kwargs` усе одно має остаточний пріоритет. Налаштовані моделі thinking vLLM Qwen і Nemotron показують бінарні варіанти `/think` (`off`, `on`) замість багаторівневої шкали зусиль.
- `compat.thinkingFormat`: стиль thinking payload, сумісний з OpenAI. Використовуйте `"together"` для Together-style `reasoning.enabled`, `"qwen"` для Qwen-style верхнього рівня `enable_thinking` або `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` у бекендах родини Qwen, що підтримують chat-template kwargs на рівні запиту, як-от vLLM. OpenClaw відображає вимкнений thinking у `false`, а ввімкнений thinking у `true`, і налаштовані моделі vLLM Qwen показують бінарні варіанти `/think` для цих форматів.
- `compat.supportedReasoningEfforts`: список reasoning effort для окремої моделі, сумісний з OpenAI. Додайте `"xhigh"` для користувацьких endpoints, які справді його приймають; тоді OpenClaw показує `/think xhigh` у меню команд, рядках сеансів Gateway, валідації patch сеансу, валідації CLI агента та валідації `llm-task` для цієї налаштованої пари провайдер/модель. Використовуйте `compat.reasoningEffortMap`, коли бекенд очікує специфічне для провайдера значення для канонічного рівня.
- `params.preserveThinking`: opt-in лише для Z.AI для збереженого thinking. Коли ввімкнено і thinking увімкнений, OpenClaw надсилає `thinking.clear_thinking: false` і відтворює попередній `reasoning_content`; див. [thinking і збережений thinking Z.AI](/uk/providers/zai#thinking-and-preserved-thinking).
- `localService`: необовʼязковий менеджер процесів рівня провайдера для локальних/самостійно розміщених серверів моделей. Коли вибрана модель належить цьому провайдеру, OpenClaw перевіряє `healthUrl` (або `baseUrl + "/models"`), запускає `command` з `args`, якщо endpoint недоступний, чекає до `readyTimeoutMs`, а потім надсилає запит моделі. `command` має бути абсолютним шляхом. `idleStopMs: 0` залишає процес активним до виходу OpenClaw; додатне значення зупиняє процес, запущений OpenClaw, після такої кількості мілісекунд простою. Див. [локальні служби моделей](/uk/gateway/local-model-services).
- Політика runtime належить провайдерам або моделям, а не `agents.defaults`. Використовуйте `models.providers.<provider>.agentRuntime` для правил на рівні провайдера або `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` для правил окремої моделі. Агентські моделі OpenAI в офіційного провайдера OpenAI типово вибирають Codex.
- Записувачі конфігурації, що змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення резервних варіантів), зберігають канонічну обʼєктну форму та, коли можливо, зберігають наявні списки резервних варіантів.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сеансами (кожен сеанс усе одно серіалізований). Типово: 4.

### Політика runtime

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

- `id`: `"auto"`, `"openclaw"`, ідентифікатор зареєстрованого harness Plugin або підтримуваний псевдонім CLI-бекенда. Вбудований Codex Plugin реєструє `codex`; вбудований Anthropic Plugin надає CLI-бекенд `claude-cli`.
- `id: "auto"` дозволяє зареєстрованим harness Plugin забирати підтримувані ходи та використовує OpenClaw, коли жоден harness не збігається. Явний runtime Plugin, наприклад `id: "codex"`, вимагає цей harness і завершується відмовою, якщо він недоступний або дає збій.
- `id: "pi"` приймається лише як застарілий псевдонім для `openclaw`, щоб зберегти поставлені конфігурації з v2026.5.22 і раніших версій. Нова конфігурація має використовувати `openclaw`.
- Пріоритет runtime: спочатку точна політика моделі (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` або `models.providers.<provider>.models[]`), потім `agents.list[]` / `agents.defaults.models["provider/*"]`, потім політика на рівні провайдера в `models.providers.<provider>.agentRuntime`.
- Ключі runtime для всього агента є застарілими. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, закріплення runtime сесії та `OPENCLAW_AGENT_RUNTIME` ігноруються під час вибору runtime. Запустіть `openclaw doctor --fix`, щоб видалити застарілі значення.
- Моделі агентів OpenAI типово використовують harness Codex; provider/model `agentRuntime.id: "codex"` залишається чинним, коли ви хочете зробити це явним.
- Для розгортань Claude CLI надавайте перевагу `model: "anthropic/claude-opus-4-8"` разом із прив’язаним до моделі `agentRuntime.id: "claude-cli"`. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` досі працюють для сумісності, але нова конфігурація має зберігати канонічний вибір provider/model і задавати бекенд виконання в політиці runtime provider/model.
- Це керує лише виконанням текстових ходів агента. Генерація медіа, vision, PDF, музика, відео та TTS досі використовують свої налаштування provider/model.

**Вбудовані скорочення псевдонімів** (застосовуються лише коли модель є в `agents.defaults.models`):

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

Моделі Z.AI GLM-4.x автоматично вмикають режим мислення, якщо ви не задасте `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI типово вмикають `tool_stream` для потокової передачі викликів інструментів. Задайте `agents.defaults.models["zai/<model>"].params.tool_stream` як `false`, щоб вимкнути це.
Anthropic Claude Opus 4.8 в OpenClaw типово тримає мислення вимкненим; коли адаптивне мислення явно ввімкнене, належне провайдеру типове значення зусилля Anthropic дорівнює `high`. Моделі Claude 4.6 типово використовують `adaptive`, коли явний рівень мислення не задано.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних запусків лише з текстом (без викликів інструментів). Корисно як резерв, коли API-провайдери дають збій.

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

- CLI-бекенди орієнтовані на текст; інструменти завжди вимкнені.
- Сесії підтримуються, коли задано `sessionArg`.
- Пропускання зображень підтримується, коли `imageArg` приймає шляхи до файлів.
- `reseedFromRawTranscriptWhenUncompacted: true` дозволяє бекенду відновлювати безпечні
  інвалідовані сесії з обмеженого хвоста сирого транскрипту OpenClaw до того, як
  з’явиться перше резюме Compaction. Зміни профілю автентифікації або епохи облікових даних
  усе одно ніколи не виконують raw-reseed.

### `agents.defaults.promptOverlays`

Незалежні від провайдера накладення промпта, що застосовуються за сімейством моделей на зібраних OpenClaw поверхнях промпта. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки в маршрутах OpenClaw/провайдера; `personality` керує лише дружнім шаром стилю взаємодії. Нативні маршрути app-server Codex зберігають базові/модельні інструкції, що належать Codex, замість цього накладення OpenClaw GPT-5, а OpenClaw вимикає вбудовану personality Codex для нативних потоків.

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
- `"off"` вимикає лише дружній шар; позначений контракт поведінки GPT-5 залишається ввімкненим.
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

- `every`: рядок тривалості (ms/s/m/h). Типово: `30m` (автентифікація за API-ключем) або `1h` (OAuth-автентифікація). Задайте `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли false, пропускає розділ Heartbeat із системного промпта та пропускає ін’єкцію `HEARTBEAT.md` у bootstrap-контекст. Типово: `true`.
- `suppressToolErrorWarnings`: коли true, приглушує payload-и попереджень про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для ходу агента Heartbeat, перш ніж його буде перервано. Залиште незаданим, щоб використовувати `agents.defaults.timeoutSeconds`, якщо його задано, інакше cadence Heartbeat з обмеженням 600 секунд.
- `directPolicy`: політика доставки direct/DM. `allow` (типово) дозволяє доставку до прямої цілі. `block` приглушує доставку до прямої цілі та видає `reason=dm-blocked`.
- `lightContext`: коли true, запуски Heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів робочої області.
- `isolatedSession`: коли true, кожен Heartbeat запускається у свіжій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як cron `sessionTarget: "isolated"`. Зменшує вартість токенів на кожен Heartbeat приблизно зі 100K до 2-5K токенів.
- `skipWhenBusy`: коли true, запуски Heartbeat відкладаються на додаткових зайнятих lane цього агента: його власна прив’язана до ключа сесії робота subagent або вкладених команд. Lane Cron завжди відкладають Heartbeat, навіть без цього прапорця.
- Для кожного агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, Heartbeat запускають **лише ці агенти**.
- Heartbeat виконують повні ходи агента — коротші інтервали спалюють більше токенів.

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
- `provider`: ідентифікатор зареєстрованого Plugin постачальника Compaction. Коли задано, викликається `summarize()` постачальника замість вбудованого узагальнення LLM. У разі помилки повертається до вбудованого. Задання постачальника примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, перш ніж OpenClaw її перерве. Типово: `180`.
- `keepRecentTokens`: бюджет точки відсікання агента для дослівного збереження найновішого хвоста транскрипту. Ручний `/compact` враховує це, коли значення задано явно; інакше ручна Compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає на початок вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час узагальнення Compaction.
- `identifierInstructions`: необов’язковий власний текст для збереження ідентифікаторів, що використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою у разі некоректно сформованого виводу для safeguard-узагальнень. Увімкнено типово в режимі safeguard; задайте `enabled: false`, щоб пропустити аудит.
- `midTurnPrecheck`: необов’язкова перевірка навантаження циклу інструментів. Коли `enabled: true`, OpenClaw перевіряє навантаження контексту після додавання результатів інструментів і перед наступним викликом моделі. Якщо контекст більше не вміщується, він перериває поточну спробу перед надсиланням промпта та повторно використовує наявний шлях відновлення після попередньої перевірки, щоб обрізати результати інструментів або виконати Compaction і повторити спробу. Працює з обома режимами Compaction: `default` і `safeguard`. Типово: вимкнено.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md для повторного вставлення після Compaction. Повторне вставлення вимкнено, коли значення не задано або задано як `[]`. Явне задання `["Session Startup", "Red Lines"]` вмикає цю пару та зберігає застарілий резервний варіант `Every Session`/`Safety`. Вмикайте це лише тоді, коли додатковий контекст вартий ризику дублювання проєктних вказівок, уже зафіксованих у підсумку Compaction.
- `model`: необов’язковий `provider/model-id` або голий псевдонім з `agents.defaults.models` лише для узагальнення Compaction. Голі псевдоніми розв’язуються перед відправленням; налаштовані буквальні ідентифікатори моделей зберігають пріоритет у разі колізій. Використовуйте це, коли основна сесія має залишатися на одній моделі, а підсумки Compaction мають виконуватися на іншій; якщо не задано, Compaction використовує основну модель сесії.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), який запускає звичайну локальну Compaction перед запуском, коли активний JSONL перевищує поріг. Потребує `truncateAfterCompaction`, щоб успішна Compaction могла перейти до меншого наступного транскрипту. Вимкнено, коли не задано або `0`.
- `notifyUser`: коли `true`, надсилає користувачу короткі сповіщення, коли Compaction починається і коли завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб Compaction залишалася беззвучною.
- `memoryFlush`: беззвучний агентний хід перед автоматичною Compaction для збереження довготривалих спогадів. Задайте `model` як точний постачальник/модель, наприклад `ollama/qwen3:8b`, коли цей службовий хід має залишатися на локальній моделі; перевизначення не успадковує резервний ланцюг активної сесії. Пропускається, коли робочий простір доступний лише для читання.

### `agents.defaults.runRetries`

Межі ітерацій повторних спроб зовнішнього циклу запуску для вбудованого runtime агента, щоб запобігти нескінченним циклам виконання під час відновлення після помилки. Зауважте, що це налаштування наразі застосовується лише до вбудованого runtime агента, а не до runtime ACP або CLI.

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
- `perProfile`: додаткові ітерації повторних спроб запуску, що надаються для кожного кандидата резервного профілю. Типово: `8`.
- `min`: мінімальна абсолютна межа для ітерацій повторних спроб запуску. Типово: `32`.
- `max`: максимальна абсолютна межа для ітерацій повторних спроб запуску, щоб запобігти неконтрольованому виконанню. Типово: `160`.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** з контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

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
- `ttl` керує тим, як часто обрізання може запускатися знову (після останнього звернення до кешу).
- Обрізання спершу м’яко скорочує завеликі результати інструментів, а потім, за потреби, повністю очищає старіші результати інструментів.
- `softTrimRatio` і `hardClearRatio` приймають значення від `0.0` до `1.0`; валідація конфігурації відхиляє значення поза цим діапазоном.

**М’яке скорочення** зберігає початок + кінець і вставляє `...` посередині.

**Повне очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не скорочуються й не очищуються.
- Коефіцієнти базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Див. [Обрізання сесії](/uk/concepts/session-pruning), щоб дізнатися подробиці поведінки.

### Блокова потокова передача

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
- `humanDelay`: випадкова пауза між блоковими відповідями. `natural` = 800–2500 мс. Перевизначення для агента: `agents.list[].humanDelay`.

Див. [Потокова передача](/uk/concepts/streaming), щоб дізнатися подробиці поведінки та фрагментації.

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
- Перевизначення для сесії: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Індикатори набору](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова ізоляція для вбудованого агента. Повний посібник див. у [Ізоляція](/uk/gateway/sandboxing).

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

- `docker`: локальний runtime Docker (типово)
- `ssh`: універсальний віддалений runtime на базі SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, специфічні для runtime налаштування переміщуються до
`plugins.entries.openshell.config`.

**Конфігурація backend SSH:**

- `target`: ціль SSH у формі `user@host[:port]`
- `command`: команда клієнта SSH (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для робочих просторів за областями
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRefs, які OpenClaw матеріалізує у тимчасові файли під час runtime
- `strictHostKeyChecking` / `updateHostKeys`: регулятори політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на базі SecretRef розв’язуються з активного знімка runtime секретів перед запуском сесії ізоляції

**Поведінка backend SSH:**

- одноразово засіває віддалений робочий простір після створення або повторного створення
- потім зберігає віддалений робочий простір SSH канонічним
- маршрутизує `exec`, файлові інструменти та медіашляхи через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує браузерні контейнери ізоляції

**Доступ до робочого простору:**

- `none`: робочий простір ізоляції за областю під `~/.openclaw/sandboxes`
- `ro`: робочий простір ізоляції в `/workspace`, робочий простір агента змонтовано лише для читання в `/agent`
- `rw`: робочий простір агента змонтовано для читання/запису в `/workspace`

**Область:**

- `session`: контейнер + робочий простір для кожної сесії
- `agent`: один контейнер + робочий простір для кожного агента (типово)
- `shared`: спільний контейнер і робочий простір (без міжсесійної ізоляції)

**Конфігурація OpenShell Plugin:**

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

- `mirror`: засіяти віддалене середовище з локального перед виконанням, синхронізувати назад після виконання; локальний робочий простір лишається канонічним
- `remote`: засіяти віддалене середовище один раз під час створення пісочниці, а потім тримати віддалений робочий простір канонічним

У режимі `remote` локальні для хоста зміни, зроблені поза OpenClaw, не синхронізуються в пісочницю автоматично після кроку засівання.
Транспортом є SSH у пісочницю OpenShell, але Plugin володіє життєвим циклом пісочниці та необов’язковою дзеркальною синхронізацією.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потрібні вихідний мережевий доступ, корінь із правом запису, користувач root.

**Контейнери за замовчуванням мають `network: "none"`** — встановіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` заблоковано за замовчуванням, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний обхід).
Запуски app-server Codex в активній пісочниці OpenClaw використовують це саме налаштування вихідного доступу для свого нативного мережевого доступу в code-mode.

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові директорії хоста; глобальні прив’язки та прив’язки для окремих агентів об’єднуються.

**Ізольований браузер** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системний prompt. Не потребує `browser.enabled` в `openclaw.json`.
Доступ спостерігача noVNC за замовчуванням використовує автентифікацію VNC, а OpenClaw видає короткоживучий URL із токеном (замість відкривати пароль у спільному URL).

- `allowHostControl: false` (за замовчуванням) блокує ізольованим сесіям націлювання на браузер хоста.
- `network` за замовчуванням має `openclaw-sandbox-browser` (виділена bridge-мережа). Встановлюйте `bridge` лише тоді, коли явно потрібне глобальне bridge-підключення.
- `cdpSourceRange` необов’язково обмежує вхідний CDP-доступ на межі контейнера діапазоном CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові директорії хоста лише в контейнер браузера пісочниці. Якщо задано (включно з `[]`), це замінює `docker.binds` для контейнера браузера.
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
  - `--disable-extensions` (увімкнено за замовчуванням)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    увімкнені за замовчуванням, і їх можна вимкнути за допомогою
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш workflow
    залежить від них.
  - `--renderer-process-limit=2` можна змінити за допомогою
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; встановіть `0`, щоб використовувати
    типовий ліміт процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Значення за замовчуванням є базовою лінією образу контейнера; використовуйте власний образ браузера з власною
    точкою входу, щоб змінити типові параметри контейнера.

</Accordion>

Ізоляція браузера та `sandbox.docker.binds` працюють лише з Docker.

Збірка образів (із checkout вихідного коду):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Для npm-встановлень без checkout вихідного коду див. [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) для вбудованих команд `docker build`.

### `agents.list` (перевизначення для окремих агентів)

Використовуйте `agents.list[].tts`, щоб дати агенту власного провайдера TTS, голос, модель,
стиль або режим auto-TTS. Блок агента глибоко об’єднується поверх глобального
`messages.tts`, тому спільні облікові дані можуть лишатися в одному місці, а окремі
агенти перевизначають лише потрібні їм поля голосу або провайдера. Перевизначення активного агента
застосовується до автоматичних озвучених відповідей, `/tts audio`, `/tts status` і
агентського інструмента `tts`. Див. [Text-to-speech](/uk/tools/tts#per-agent-voice-overrides)
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

- `id`: стабільний id агента (обов’язково).
- `default`: коли задано кілька, перший перемагає (логуються попередження). Якщо жоден не задано, типовим є перший запис списку.
- `model`: рядкова форма задає суворий primary для окремого агента без резервної моделі; об’єктна форма `{ primary }` також сувора, якщо ви не додасте `fallbacks`. Використовуйте `{ primary, fallbacks: [...] }`, щоб увімкнути fallback для цього агента, або `{ primary, fallbacks: [] }`, щоб явно задати сувору поведінку. Cron-завдання, які перевизначають лише `primary`, усе ще успадковують типові fallbacks, якщо ви не встановите `fallbacks: []`.
- `params`: потокові параметри для окремого агента, об’єднані поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень, як-от `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `tts`: необов’язкові перевизначення text-to-speech для окремого агента. Блок глибоко об’єднується поверх `messages.tts`, тому тримайте спільні облікові дані провайдера й політику fallback у `messages.tts`, а тут задавайте лише значення, специфічні для persona, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий allowlist Skills для окремого агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, коли це задано; явний список замінює defaults замість об’єднання, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень thinking для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для повідомлення або сесії. Вибраний профіль провайдера/моделі контролює, які значення допустимі; для Google Gemini `adaptive` зберігає динамічний thinking, яким володіє провайдер (`thinkingLevel` пропущено на Gemini 3/3.1, `thinkingBudget: -1` на Gemini 2.5).
- `reasoningDefault`: необов’язкова типова видимість reasoning для окремого агента (`on | off | stream`). Перевизначає `agents.defaults.reasoningDefault` для цього агента, коли не задано перевизначення reasoning для повідомлення або сесії.
- `fastModeDefault`: необов’язкове типове значення для fast mode для окремого агента (`"auto" | true | false`). Застосовується, коли не задано перевизначення fast-mode для повідомлення або сесії.
- `models`: необов’язкові перевизначення каталогу моделей/ runtime для окремого агента, індексовані повними id `provider/model`. Використовуйте `models["provider/model"].agentRuntime` для runtime-винятків окремого агента.
- `runtime`: необов’язковий descriptor runtime для окремого агента. Використовуйте `type: "acp"` з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент за замовчуванням має використовувати сесії ACP harness.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- Локальні файли зображень `identity.avatar`, відносні до робочого простору, обмежені 2 MB. URL `http(s)` і URI `data:` не перевіряються локальним лімітом розміру файлу.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: allowlist налаштованих id агентів для явних цілей `sessions_spawn.agentId` (`["*"]` = будь-яка налаштована ціль; за замовчуванням: лише той самий агент). Додайте id запитувача, коли самонацілені виклики `agentId` мають бути дозволені. Застарілі записи, конфігурацію агентів для яких було видалено, відхиляються `sessions_spawn` і пропускаються в `agents_list`; запустіть `openclaw doctor --fix`, щоб прибрати їх, або додайте мінімальний запис `agents.list[]`, якщо ця ціль має лишатися доступною для spawn, успадковуючи defaults.
- Запобіжник успадкування пісочниці: якщо сесія запитувача ізольована, `sessions_spawn` відхиляє цілі, які запускалися б без пісочниці.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, які пропускають `agentId` (примушує явний вибір профілю; за замовчуванням: false).

---

## Маршрутизація кількох агентів

Запускайте кілька ізольованих агентів в одному Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

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

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній type за замовчуванням означає route), `acp` для прив’язок постійних розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; пропущено = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічно для каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок збігу:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний, без peer/guild/team)
5. `match.accountId: "*"` (на рівні всього каналу)
6. Типовий агент

У межах кожного рівня перемагає перший відповідний запис `bindings`.

Для записів `type: "acp"` OpenClaw розв’язує за точною ідентичністю розмови (`match.channel` + account + `match.peer.id`) і не використовує наведений вище рівневий порядок route binding.

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

Див. [пісочницю та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools), щоб дізнатися подробиці пріоритету.

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

<Accordion title="Session field details">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (за замовчуванням): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються приватні повідомлення.
  - `main`: усі приватні повідомлення спільно використовують основну сесію.
  - `per-peer`: ізолювати за ідентифікатором відправника між каналами.
  - `per-channel-peer`: ізолювати за каналом + відправником (рекомендовано для скриньок вхідних повідомлень із кількома користувачами).
  - `per-account-channel-peer`: ізолювати за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: зіставляє канонічні ідентифікатори з одноранговими учасниками з префіксом провайдера для спільного використання сесій між каналами. Команди Dock, як-от `/dock_discord`, використовують ту саму мапу, щоб перемкнути маршрут відповіді активної сесії на іншого пов’язаного однорангового учасника каналу; див. [стикування каналів](/uk/concepts/channel-docking).
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва варіанти, спрацьовує той, що настає першим. Свіжість щоденного скидання використовує `sessionStartedAt` рядка сесії; свіжість скидання за простоєм використовує `lastInteractionAt`. Фонові записи або записи системних подій, як-от Heartbeat, пробудження Cron, сповіщення exec і облік Gateway, можуть оновлювати `updatedAt`, але вони не підтримують свіжість сесій daily/idle.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як псевдонім для `direct`.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для основного кошика прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів із відповідями між агентами під час обмінів агент-агент (ціле число, діапазон: `0`-`20`, за замовчуванням: `5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона перемагає.
- **`maintenance`**: елементи керування очищенням і збереженням сховища сесій.
  - `mode`: `enforce` застосовує очищення й використовується за замовчуванням; `warn` лише видає попередження.
  - `pruneAfter`: вікова межа для застарілих записів (за замовчуванням `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (за замовчуванням `500`). Runtime записує пакетне очищення з невеликим буфером верхньої межі для лімітів виробничого розміру; `openclaw sessions cleanup --enforce` застосовує ліміт негайно.
  - Короткоживучі сесії перевірки model-run Gateway використовують фіксоване збереження `24h`, але очищення обмежене тиском: воно видаляє застарілі суворі рядки перевірки model-run лише тоді, коли досягнуто тиску обслуговування або ліміту записів сесій. Придатні лише суворі явні ключі перевірки, що відповідають `agent:*:explicit:model-run-<uuid>`; звичайні сесії direct, group, thread, Cron, hook, Heartbeat, ACP і субагентів не успадковують це 24-годинне збереження. Коли запускається очищення model-run, воно виконується перед ширшим очищенням застарілих записів `pruneAfter` і лімітом `maxEntries`.
  - `rotateBytes`: застаріло й ігнорується; `openclaw doctor --fix` видаляє його зі старіших конфігурацій.
  - `resetArchiveRetention`: збереження для архівів транскриптів `*.reset.<timestamp>`. За замовчуванням дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий дисковий бюджет каталогу сесій. У режимі `warn` він журналює попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. За замовчуванням дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні значення за замовчуванням для функцій сесій, прив’язаних до тредів.
  - `enabled`: головний перемикач за замовчуванням (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: автоматичне скасування фокуса за замовчуванням після неактивності в годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: жорсткий максимальний вік за замовчуванням у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `spawnSessions`: типова брама для створення робочих сесій, прив’язаних до тредів, із `sessions_spawn` і породжень тредів ACP. За замовчуванням дорівнює `true`, коли прив’язки тредів увімкнені; провайдери/облікові записи можуть перевизначати.
  - `defaultSpawnContext`: типовий нативний контекст субагента для породжень, прив’язаних до тредів (`"fork"` або `"isolated"`). За замовчуванням `"fork"`.

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

Перевизначення за каналом/обліковим записом: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Вирішення (найконкретніше перемагає): обліковий запис → канал → глобальне. `""` вимикає й зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна            | Опис                         | Приклад                     |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі         | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера             | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень мислення     | `high`, `low`, `off`        |
| `{identity.name}` | Назва ідентичності агента    | (те саме, що `"auto"`)      |

Змінні нечутливі до регістру. `{think}` є псевдонімом для `{thinkingLevel}`.

### Реакція підтвердження

- За замовчуванням використовує `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення за каналом: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок вирішення: обліковий запис → канал → `messages.ackReaction` → резервне значення ідентичності.
- Область: `group-mentions` (за замовчуванням), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в каналах із підтримкою реакцій, як-от Slack, Discord, Signal, Telegram, WhatsApp та iMessage.
- `messages.statusReactions.enabled`: вмикає реакції стану життєвого циклу в Slack, Discord, Signal, Telegram і WhatsApp.
  У Slack і Discord не встановлене значення зберігає реакції стану ввімкненими, коли активні реакції підтвердження.
  У Signal, Telegram і WhatsApp явно встановіть `true`, щоб увімкнути реакції стану життєвого циклу.
- `messages.statusReactions.emojis`: перевизначає ключі емодзі життєвого циклу:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` і `stallHard`.
  Telegram дозволяє лише фіксований набір реакцій, тому непідтримувані налаштовані емодзі повертаються
  до найближчого підтримуваного варіанта стану для цього чату.

### Затримка об’єднання вхідних повідомлень

Об’єднує швидкі текстові повідомлення від того самого відправника в один хід агента. Медіа/вкладення скидають чергу негайно. Керівні команди обходять затримку об’єднання.

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

- `auto` керує стандартним режимом автоматичного TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує ефективний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумовування.
- `modelOverrides` увімкнено за замовчуванням; `modelOverrides.allowProvider` за замовчуванням має значення `false` (увімкнення за згодою).
- API-ключі резервно беруться з `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані постачальники мовлення належать Plugin. Якщо задано `plugins.allow`, включіть кожен Plugin постачальника TTS, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий ідентифікатор постачальника `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на кінцеву точку не OpenAI, OpenClaw розглядає її як OpenAI-сумісний сервер TTS і послаблює перевірку моделі/голосу.

---

## Розмова

Значення за замовчуванням для режиму Talk (macOS/iOS/Android).

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

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кілька постачальників Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) існують лише для сумісності. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію в `talk.providers.<provider>`.
- Ідентифікатори голосів резервно беруться з `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає відкриті текстові рядки або об’єкти SecretRef.
- Резервне використання `ELEVENLABS_API_KEY` застосовується лише коли не налаштовано API-ключ Talk.
- `providers.*.voiceAliases` дає змогу директивам Talk використовувати зручні імена.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний помічник MLX для macOS. Якщо пропущено, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX у macOS виконується через вбудований помічник `openclaw-mlx-tts`, якщо він наявний, або виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `consultThinkingLevel` керує рівнем мислення для повного запуску агента OpenClaw за викликами Control UI Talk realtime `openclaw_agent_consult`. Не задавайте, щоб зберегти звичайну поведінку сесії/моделі.
- `consultFastMode` задає одноразове перевизначення швидкого режиму для консультацій Control UI Talk realtime без зміни звичайного налаштування швидкого режиму сесії.
- `speechLocale` задає ідентифікатор локалі BCP 47, який використовує розпізнавання мовлення Talk в iOS/macOS. Не задавайте, щоб використовувати стандартне значення пристрою.
- `silenceTimeoutMs` керує тим, як довго режим Talk чекає після мовчання користувача, перш ніж надіслати транскрипт. Якщо не задано, зберігається стандартне вікно паузи платформи (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` додає системні інструкції для постачальника до вбудованого realtime-запиту OpenClaw, тому стиль голосу можна налаштувати без втрати стандартних вказівок `openclaw_agent_consult`.
- `realtime.consultRouting` керує резервним ретранслюванням Gateway, коли realtime-постачальник створює фінальний транскрипт користувача без `openclaw_agent_consult`: `provider-direct` зберігає прямі відповіді постачальника, тоді як `force-agent-consult` маршрутизує фіналізований запит через OpenClaw.

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
