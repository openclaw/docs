---
read_when:
    - Налаштування типових параметрів агента (моделі, мислення, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування маршрутизації та прив’язок для кількох агентів
    - Налаштування поведінки сеансу, доставки повідомлень і режиму розмови
summary: Стандартні налаштування агентів, маршрутизація кількох агентів, сесія, повідомлення та конфігурація розмов
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-06-27T17:30:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

Ключі конфігурації рівня агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Типові значення агента

### `agents.defaults.workspace`

Типово: `OPENCLAW_WORKSPACE_DIR`, якщо задано, інакше `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Явне значення `agents.defaults.workspace` має пріоритет над
`OPENCLAW_WORKSPACE_DIR`. Використовуйте змінну середовища, щоб спрямувати типових агентів
на змонтований робочий простір, коли не хочете записувати цей шлях у конфігурацію.

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, що показується в рядку Runtime системного промпта. Якщо не задано, OpenClaw автоматично визначає його, піднімаючись угору від робочого простору.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий типовий список дозволених skill для агентів, які не задають
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює типові значення
      { id: "locked-down", skills: [] }, // без skills
    ],
  },
}
```

- Пропустіть `agents.defaults.skills`, щоб skills типово були необмеженими.
- Пропустіть `agents.list[].skills`, щоб успадкувати типові значення.
- Задайте `agents.list[].skills: []`, щоб вимкнути skills.
- Непорожній список `agents.list[].skills` є фінальним набором для цього агента; він
  не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Пропускає створення вибраних необов’язкових файлів робочого простору, водночас записуючи обов’язкові bootstrap-файли. Допустимі значення: `SOUL.md`, `USER.md`, `HEARTBEAT.md` і `IDENTITY.md`.

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

Керує тим, коли bootstrap-файли робочого простору вставляються в системний промпт. Типово: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторну вставку bootstrap-файлів робочого простору, зменшуючи розмір промпта. Запуски Heartbeat і повтори після Compaction усе одно перебудовують контекст.
- `"never"`: вимкнути bootstrap робочого простору та вставку файлів контексту на кожному ході. Використовуйте це лише для агентів, які повністю керують життєвим циклом свого промпта (власні контекстні рушії, нативні середовища виконання, що будують власний контекст, або спеціалізовані робочі процеси без bootstrap). Ходи Heartbeat і відновлення після Compaction також пропускають вставку.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Перевизначення для окремого агента: `agents.list[].contextInjection`. Пропущені значення успадковують
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на bootstrap-файл робочого простору перед обрізанням. Типово: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Перевизначення для окремого агента: `agents.list[].bootstrapMaxChars`. Пропущені значення успадковують
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що вставляються з усіх bootstrap-файлів робочого простору. Типово: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Перевизначення для окремого агента: `agents.list[].bootstrapTotalMaxChars`. Пропущені значення
успадковують `agents.defaults.bootstrapTotalMaxChars`.

### Перевизначення bootstrap-профілю для окремого агента

Використовуйте перевизначення bootstrap-профілю для окремого агента, коли одному агенту потрібна інша поведінка
вставки промпта, ніж у спільних типових значеннях. Пропущені поля успадковуються з
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

Керує видимим агенту повідомленням у системному промпті, коли bootstrap-контекст обрізано.
Типово: `"always"`.

- `"off"`: ніколи не вставляти текст повідомлення про обрізання в системний промпт.
- `"once"`: вставити стислий текст повідомлення один раз для кожного унікального підпису обрізання.
- `"always"`: вставляти стислий текст повідомлення під час кожного запуску, коли є обрізання (рекомендовано).

Докладні лічильники сирих/вставлених даних і поля налаштування конфігурації залишаються в діагностиці, як-от
звіти про контекст/статус і журнали; звичайний користувацький/ runtime-контекст WebChat отримує лише
стисле повідомлення про відновлення.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Карта володіння бюджетами контексту

OpenClaw має кілька великих бюджетів промпта/контексту, і вони
навмисно розділені за підсистемами, а не пропущені через один універсальний
перемикач.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайна вставка bootstrap робочого простору.
- `agents.defaults.startupContext.*`:
  одноразова преамбула скидання/запуску model-run, включно з нещодавніми щоденними
  файлами `memory/*.md`. Прості команди чату `/new` і `/reset`
  підтверджуються без виклику моделі.
- `skills.limits.*`:
  компактний список skills, що вставляється в системний промпт.
- `agents.defaults.contextLimits.*`:
  обмежені runtime-фрагменти та вставлені блоки, якими володіє runtime.
- `memory.qmd.limits.*`:
  фрагмент індексованого пошуку пам’яті та розміри вставки.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовою преамбулою першого ходу, що вставляється під час model runs скидання/запуску.
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

Спільні типові значення для обмежених runtime-поверхонь контексту.

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

- `memoryGetMaxChars`: типове обмеження фрагмента `memory_get` перед додаванням
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків `memory_get`, коли `lines`
  пропущено.
- `toolResultMaxChars`: розширена межа live-результатів інструментів, що використовується для збережених
  результатів і відновлення після переповнення. Залиште незаданим для автоматичного обмеження model-context:
  `16000` символів нижче 100K токенів, `32000` символів на 100K+ токенів і `64000`
  символів на 200K+ токенів. Явні значення до `1000000` приймаються для
  моделей із довгим контекстом, але ефективна межа все одно обмежена приблизно 30% від
  контекстного вікна моделі. `openclaw doctor --deep` друкує ефективну межу,
  а doctor попереджає лише тоді, коли явне перевизначення застаріле або не має ефекту.
- `postCompactionMaxChars`: обмеження фрагмента AGENTS.md, що використовується під час
  вставки оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для окремого агента для спільних перемикачів `contextLimits`. Пропущені поля успадковуються
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

Глобальне обмеження для компактного списку skills, що вставляється в системний промпт. Це
не впливає на читання файлів `SKILL.md` за запитом.

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

Перевизначення бюджету промпта skills для окремого агента.

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
Типово: `1200`.

Нижчі значення зазвичай зменшують використання vision-токенів і розмір payload запиту для запусків із великою кількістю скриншотів.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Перевага стиснення/деталізації image-tool для зображень, завантажених зі шляхів файлів, URL-адрес і медіапосилань.
Типово: `auto`.

OpenClaw адаптує драбину зміни розміру до вибраної моделі зображень. Наприклад, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL і hosted Llama 4 vision models можуть використовувати більші зображення, ніж старіші/типові high-detail vision paths, тоді як ходи з кількома зображеннями стискаються агресивніше в режимі `auto`, щоб контролювати витрати токенів і затримки.

Значення:

- `auto`: адаптуватися до обмежень моделі та кількості зображень.
- `efficient`: надавати перевагу меншим зображенням для нижчого використання токенів і байтів.
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

Формат часу в системному промпті. Типово: `auto` (налаштування ОС).

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
  - Об’єктна форма задає основну модель і впорядковані моделі для відмовостійкого перемикання.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація візуальної моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати зображення на вході.
  - Надавайте перевагу явним посиланням `provider/model`. Голі ідентифікатори приймаються для сумісності; якщо голий ідентифікатор однозначно відповідає налаштованому запису з підтримкою зображень у `models.providers.*.models`, OpenClaw доповнює його цим провайдером. Неоднозначні налаштовані збіги потребують явного префікса провайдера.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для виводу OpenAI PNG/WebP із прозорим фоном.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо опущено, `image_generate` усе ще може вивести типовий провайдер із підтримкою автентифікації. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації зображень у порядку ідентифікаторів провайдерів.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо опущено, `music_generate` усе ще може вивести типовий провайдер із підтримкою автентифікації. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації музики у порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо опущено, `video_generate` усе ще може вивести типовий провайдер із підтримкою автентифікації. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації відео у порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
  - Офіційний Plugin генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалості 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделей.
  - Якщо опущено, інструмент PDF повертається до `imageModel`, а потім до розв’язаної моделі сеансу/типової моделі.
- `pdfMaxBytesMb`: типове обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, які враховує резервний режим витягування в інструменті `pdf`.
- `verboseDefault`: типовий рівень докладності для агентів. Значення: `"off"`, `"on"`, `"full"`. Типово: `"off"`.
- `toolProgressDetail`: режим деталізації для підсумків інструментів `/verbose` і чернеткових рядків поступу інструментів. Значення: `"explain"` (типово, компактні людські мітки) або `"raw"` (додає сирі команду/деталі, коли доступно). Поагентний `agents.list[].toolProgressDetail` перевизначає це типове значення.
- `reasoningDefault`: типова видимість міркування для агентів. Значення: `"off"`, `"on"`, `"stream"`. Поагентний `agents.list[].reasoningDefault` перевизначає це типове значення. Налаштовані типові значення міркування застосовуються лише для власників, авторизованих відправників або контекстів Gateway адміністратора-оператора, коли не задано по-повідомленнєве або сеансове перевизначення міркування.
- `elevatedDefault`: типовий рівень підвищеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типово: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ OpenAI або Codex OAuth). Якщо ви опускаєте провайдера, OpenClaw спочатку пробує псевдонім, потім унікальний збіг серед налаштованих провайдерів для цього точного ідентифікатора моделі, і лише потім повертається до налаштованого типового провайдера (застаріла поведінка сумісності, тому надавайте перевагу явному `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повертається до першого налаштованого провайдера/моделі замість того, щоб показувати застаріле типове значення видаленого провайдера.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, маршрутизацію OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Використовуйте записи `provider/*`, як-от `"openai/*": {}` або `"vllm/*": {}`, щоб показувати всі виявлені моделі для вибраних провайдерів без ручного переліку кожного ідентифікатора моделі.
  - Додайте `agentRuntime` до запису `provider/*`, коли кожна динамічно виявлена модель для цього провайдера має використовувати одне й те саме середовище виконання. Точна політика середовища виконання `provider/model` усе одно має пріоритет над wildcard.
  - Безпечні редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відмовляється від замін, які видалили б наявні записи allowlist, якщо ви не передасте `--replace`.
  - Потоки налаштування/первинного налаштування в межах провайдера зливають вибрані моделі провайдера в цю мапу й зберігають уже налаштованих непов’язаних провайдерів.
  - Для прямих моделей OpenAI Responses серверна Compaction вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити додавання `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [серверну Compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні типові параметри провайдера, застосовані до всіх моделей. Задається в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для окремої моделі), потім `agents.list[].params` (відповідний ідентифікатор агента) перевизначає за ключем. Докладніше див. [кешування підказок](/uk/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: типова політика маршрутизації провайдерів у межах OpenRouter. OpenClaw передає це до об’єкта `provider` запиту OpenRouter; по-модельні `agents.defaults.models["openrouter/<model>"].params.provider` і параметри агента перевизначають за ключем. Див. [маршрутизацію провайдерів OpenRouter](/uk/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: розширений наскрізний JSON, що зливається в тіла запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, додаткове тіло має пріоритет; ненативні маршрути completions після цього все одно видаляють OpenAI-специфічний `store`.
- `params.chat_template_kwargs`: аргументи шаблону чату для vLLM/OpenAI-сумісних систем, що зливаються в тіла запитів верхнього рівня `api: "openai-completions"`. Для `vllm/nemotron-3-*` із вимкненим мисленням bundled vLLM Plugin автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані типові значення, а `extra_body.chat_template_kwargs` усе ще має остаточний пріоритет. Налаштовані моделі мислення vLLM Qwen і Nemotron надають бінарні варіанти `/think` (`off`, `on`) замість багаторівневої шкали зусиль.
- `compat.thinkingFormat`: стиль payload мислення, сумісний з OpenAI. Використовуйте `"together"` для стилю Together `reasoning.enabled`, `"qwen"` для стилю Qwen верхнього рівня `enable_thinking` або `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на бекендах сімейства Qwen, які підтримують kwargs шаблону чату рівня запиту, як-от vLLM. OpenClaw відображає вимкнене мислення в `false`, а ввімкнене мислення в `true`, і налаштовані моделі vLLM Qwen надають бінарні варіанти `/think` для цих форматів.
- `compat.supportedReasoningEfforts`: по-модельний список зусиль міркування, сумісний з OpenAI. Додавайте `"xhigh"` для власних endpoint, які справді його приймають; тоді OpenClaw показує `/think xhigh` у меню команд, рядках сеансів Gateway, валідації патчів сеансів, валідації CLI агента й валідації `llm-task` для цього налаштованого провайдера/моделі. Використовуйте `compat.reasoningEffortMap`, коли бекенд очікує специфічне для провайдера значення для канонічного рівня.
- `params.preserveThinking`: Z.AI-специфічна опція ввімкнення збереженого мислення. Коли її ввімкнено й мислення активне, OpenClaw надсилає `thinking.clear_thinking: false` і повторно відтворює попередній `reasoning_content`; див. [мислення Z.AI і збережене мислення](/uk/providers/zai#thinking-and-preserved-thinking).
- `localService`: необов’язковий менеджер процесів рівня провайдера для локальних/самостійно розміщених серверів моделей. Коли вибрана модель належить цьому провайдеру, OpenClaw перевіряє `healthUrl` (або `baseUrl + "/models"`), запускає `command` з `args`, якщо endpoint недоступний, чекає до `readyTimeoutMs`, а потім надсилає запит моделі. `command` має бути абсолютним шляхом. `idleStopMs: 0` залишає процес активним до виходу OpenClaw; додатне значення зупиняє процес, породжений OpenClaw, після цієї кількості мілісекунд простою. Див. [локальні сервіси моделей](/uk/gateway/local-model-services).
- Політика середовища виконання належить провайдерам або моделям, а не `agents.defaults`. Використовуйте `models.providers.<provider>.agentRuntime` для правил на рівні всього провайдера або `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` для правил, специфічних для моделі. Моделі агентів OpenAI в офіційного провайдера OpenAI типово вибирають Codex.
- Записувачі конфігурації, які змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення резервних моделей), зберігають канонічну об’єктну форму й за можливості зберігають наявні списки резервних моделей.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сеансами (кожен сеанс усе одно серіалізований). Типово: 4.

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

- `id`: `"auto"`, `"openclaw"`, ідентифікатор обв’язки зареєстрованого Plugin або підтримуваний псевдонім бекенда CLI. Вбудований Plugin Codex реєструє `codex`; вбудований Plugin Anthropic надає бекенд CLI `claude-cli`.
- `id: "auto"` дає змогу обв’язкам зареєстрованих Plugin обробляти підтримувані ходи та використовує OpenClaw, коли жодна обв’язка не підходить. Явне середовище виконання Plugin, як-от `id: "codex"`, вимагає цю обв’язку й завершується безпечною відмовою, якщо вона недоступна або дає збій.
- `id: "pi"` приймається лише як застарілий псевдонім для `openclaw`, щоб зберегти випущені конфігурації з v2026.5.22 і раніших версій. Нова конфігурація має використовувати `openclaw`.
- Пріоритет середовища виконання: спочатку точна політика моделі (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` або `models.providers.<provider>.models[]`), потім `agents.list[]` / `agents.defaults.models["provider/*"]`, потім політика на рівні провайдера в `models.providers.<provider>.agentRuntime`.
- Ключі середовища виконання для всього агента є застарілими. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, закріплення середовища виконання сесії та `OPENCLAW_AGENT_RUNTIME` ігноруються під час вибору середовища виконання. Запустіть `openclaw doctor --fix`, щоб видалити застарілі значення.
- Агентські моделі OpenAI за замовчуванням використовують обв’язку Codex; `agentRuntime.id: "codex"` для provider/model залишається чинним, коли потрібно зробити це явним.
- Для розгортань Claude CLI надавайте перевагу `model: "anthropic/claude-opus-4-8"` плюс прив’язаний до моделі `agentRuntime.id: "claude-cli"`. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` досі працюють для сумісності, але нова конфігурація має зберігати канонічний вибір provider/model і розміщувати бекенд виконання в політиці середовища виконання provider/model.
- Це керує лише виконанням текстових агентських ходів. Генерація медіа, vision, PDF, музика, відео та TTS і далі використовують свої налаштування provider/model.

**Вбудовані скорочені псевдоніми** (застосовуються лише коли модель у `agents.defaults.models`):

| Псевдонім           | Модель                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Ваші налаштовані псевдоніми завжди мають пріоритет над значеннями за замовчуванням.

Моделі Z.AI GLM-4.x автоматично вмикають режим мислення, якщо ви не задасте `--thinking off` або не визначите `agents.defaults.models["zai/<model>"].params.thinking` самостійно.
Моделі Z.AI за замовчуванням вмикають `tool_stream` для потокового передавання викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` на `false`, щоб вимкнути це.
Anthropic Claude Opus 4.8 у OpenClaw за замовчуванням тримає мислення вимкненим; коли адаптивне мислення явно ввімкнено, кероване провайдером значення зусилля за замовчуванням в Anthropic дорівнює `high`. Моделі Claude 4.6 за замовчуванням використовують `adaptive`, коли явний рівень мислення не задано.

### `agents.defaults.cliBackends`

Необов’язкові бекенди CLI для резервних запусків лише з текстом (без викликів інструментів). Корисно як резерв, коли API-провайдери дають збій.

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

- Бекенди CLI орієнтовані насамперед на текст; інструменти завжди вимкнені.
- Сесії підтримуються, коли задано `sessionArg`.
- Наскрізне передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.
- `reseedFromRawTranscriptWhenUncompacted: true` дає бекенду змогу відновлювати безпечні
  інвалідовані сесії з обмеженого хвоста сирого transcript OpenClaw до того, як
  з’явиться перший підсумок Compaction. Зміни профілю автентифікації або епохи облікових даних
  усе одно ніколи не виконують raw-reseed.

### `agents.defaults.promptOverlays`

Незалежні від провайдера накладки prompt, застосовані за сімейством моделей на поверхнях prompt, зібраних OpenClaw. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки через маршрути OpenClaw/provider; `personality` керує лише дружнім шаром стилю взаємодії. Нативні маршрути app-server Codex зберігають базові/модельні інструкції, що належать Codex, замість цієї накладки GPT-5 від OpenClaw, а OpenClaw вимикає вбудовану personality Codex для нативних потоків.

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

- `"friendly"` (за замовчуванням) і `"on"` вмикають дружній шар стилю взаємодії.
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

- `every`: рядок тривалості (ms/s/m/h). За замовчуванням: `30m` (автентифікація API-key) або `1h` (автентифікація OAuth). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли false, пропускає розділ Heartbeat у системному prompt і не вставляє `HEARTBEAT.md` у bootstrap-контекст. За замовчуванням: `true`.
- `suppressToolErrorWarnings`: коли true, пригнічує payload попереджень про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний дозволений час у секундах для агентського ходу Heartbeat перед його перериванням. Не задавайте, щоб використовувати `agents.defaults.timeoutSeconds`, якщо він заданий; інакше cadence Heartbeat з обмеженням 600 секунд.
- `directPolicy`: політика доставки direct/DM. `allow` (за замовчуванням) дозволяє доставку до прямої цілі. `block` пригнічує доставку до прямої цілі та видає `reason=dm-blocked`.
- `lightContext`: коли true, запуски Heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` з bootstrap-файлів робочого простору.
- `isolatedSession`: коли true, кожен Heartbeat запускається в новій сесії без попередньої історії розмови. Та сама схема ізоляції, що й у Cron `sessionTarget: "isolated"`. Зменшує вартість токенів на Heartbeat з приблизно 100K до приблизно 2-5K токенів.
- `skipWhenBusy`: коли true, запуски Heartbeat відкладаються на додаткових зайнятих смугах цього агента: його власній прив’язаній до ключа сесії роботі субагента або вкладених команд. Смуги Cron завжди відкладають Heartbeat навіть без цього прапорця.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, Heartbeat запускають **лише ці агенти**.
- Heartbeat запускають повні агентські ходи — коротші інтервали витрачають більше токенів.

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

- `mode`: `default` або `safeguard` (фрагментоване підсумовування для довгих історій). Див. [Compaction](/uk/concepts/compaction).
- `provider`: ідентифікатор зареєстрованого Plugin провайдера Compaction. Якщо задано, замість вбудованого LLM-підсумовування викликається `summarize()` провайдера. У разі збою повертається до вбудованого механізму. Задання провайдера примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, перш ніж OpenClaw перерве її. Типово: `180`.
- `keepRecentTokens`: бюджет точки відсікання агента для збереження найновішого хвоста транскрипту дослівно. Ручний `/compact` враховує це, коли параметр задано явно; інакше ручна Compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає на початок вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий власний текст для збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою у разі некоректно сформованого виводу для підсумків safeguard. Увімкнено типово в режимі safeguard; задайте `enabled: false`, щоб пропустити аудит.
- `midTurnPrecheck`: необов’язкова перевірка тиску циклу інструментів. Коли `enabled: true`, OpenClaw перевіряє тиск контексту після додавання результатів інструментів і перед наступним викликом моделі. Якщо контекст більше не вміщується, він перериває поточну спробу перед надсиланням промпта й повторно використовує наявний шлях відновлення після попередньої перевірки, щоб обрізати результати інструментів або виконати Compaction і повторити спробу. Працює з режимами Compaction `default` і `safeguard`. Типово: вимкнено.
- `postCompactionSections`: необов’язкові назви H2/H3-секцій AGENTS.md для повторного вставлення після Compaction. Повторне вставлення вимкнено, коли не задано або задано `[]`. Явне встановлення `["Session Startup", "Red Lines"]` вмикає цю пару й зберігає застарілий резервний варіант `Every Session`/`Safety`. Вмикайте це лише тоді, коли додатковий контекст вартий ризику дублювання проєктних вказівок, уже зафіксованих у підсумку Compaction.
- `model`: необов’язковий `provider/model-id` або простий псевдонім з `agents.defaults.models` лише для підсумовування Compaction. Прості псевдоніми розв’язуються перед відправленням; налаштовані буквальні ідентифікатори моделей зберігають пріоритет у разі колізій. Використовуйте це, коли основний сеанс має залишатися на одній моделі, а підсумки Compaction мають виконуватися на іншій; якщо не задано, Compaction використовує основну модель сеансу.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), який запускає звичайну локальну Compaction перед виконанням, коли активний JSONL перевищує поріг. Потребує `truncateAfterCompaction`, щоб успішна Compaction могла перейти до меншого наступного транскрипту. Вимкнено, коли не задано або задано `0`.
- `notifyUser`: коли `true`, надсилає користувачу короткі сповіщення, коли Compaction починається й коли завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб Compaction залишалася беззвучною.
- `memoryFlush`: беззвучний агентний хід перед автоматичною Compaction для збереження довготривалих спогадів. Задайте `model` як точний провайдер/модель, наприклад `ollama/qwen3:8b`, коли цей службовий хід має залишатися на локальній моделі; перевизначення не успадковує ланцюг резервних варіантів активного сеансу. Пропускається, коли робочий простір доступний лише для читання.

### `agents.defaults.runRetries`

Межі ітерацій повторних спроб зовнішнього циклу виконання для вбудованого агентного runtime, щоб запобігти нескінченним циклам виконання під час відновлення після збоїв. Зверніть увагу, що цей параметр наразі застосовується лише до вбудованого агентного runtime, а не до ACP або CLI runtime.

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

- `base`: базова кількість ітерацій повторних спроб виконання для зовнішнього циклу виконання. Типово: `24`.
- `perProfile`: додаткові ітерації повторних спроб виконання, що надаються для кожного кандидата резервного профілю. Типово: `8`.
- `min`: мінімальна абсолютна межа для ітерацій повторних спроб виконання. Типово: `32`.
- `max`: максимальна абсолютна межа для ітерацій повторних спроб виконання, щоб запобігти неконтрольованому виконанню. Типово: `160`.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сеансу на диску.

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
- Обрізання спочатку м’яко скорочує надмірно великі результати інструментів, а потім, за потреби, жорстко очищає старіші результати інструментів.
- `softTrimRatio` і `hardClearRatio` приймають значення від `0.0` до `1.0`; перевірка конфігурації відхиляє значення поза цим діапазоном.

**М’яке скорочення** зберігає початок + кінець і вставляє `...` посередині.

**Жорстке очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не скорочуються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Див. [Обрізання сеансу](/uk/concepts/session-pruning) для подробиць поведінки.

### Блокове потокове передавання

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
- Перевизначення каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Signal/Slack/Discord/Google Chat типово мають `minChars: 1500`.
- `humanDelay`: рандомізована пауза між блоковими відповідями. `natural` = 800–2500 мс. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Див. [Потокове передавання](/uk/concepts/streaming) для подробиць поведінки й фрагментації.

### Індикатори набору тексту

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
- Перевизначення для окремого сеансу: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Індикатори набору тексту](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова пісочниця для вбудованого агента. Див. [Пісочниця](/uk/gateway/sandboxing) для повного посібника.

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

**Бекенд:**

- `docker`: локальний Docker runtime (типово)
- `ssh`: загальний віддалений runtime на базі SSH
- `openshell`: OpenShell runtime

Коли вибрано `backend: "openshell"`, специфічні для runtime налаштування переміщуються до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенда:**

- `target`: ціль SSH у формі `user@host[:port]`
- `command`: команда SSH-клієнта (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для робочих просторів за областями
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, передані до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRefs, які OpenClaw матеріалізує в тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: регулятори політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має перевагу над `identityFile`
- `certificateData` має перевагу над `certificateFile`
- `knownHostsData` має перевагу над `knownHostsFile`
- Значення `*Data` на базі SecretRef розв’язуються з активного знімка runtime секретів перед запуском сеансу пісочниці

**Поведінка SSH-бекенда:**

- одноразово засіває віддалений робочий простір після створення або повторного створення
- потім підтримує віддалений SSH-робочий простір як канонічний
- маршрутизує `exec`, файлові інструменти й медіашляхи через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує браузерні контейнери пісочниці

**Доступ до робочого простору:**

- `none`: робочий простір пісочниці за областю під `~/.openclaw/sandboxes`
- `ro`: робочий простір пісочниці в `/workspace`, робочий простір агента змонтовано лише для читання в `/agent`
- `rw`: робочий простір агента змонтовано для читання/запису в `/workspace`

**Область:**

- `session`: контейнер + робочий простір для кожного сеансу
- `agent`: один контейнер + робочий простір на агента (типово)
- `shared`: спільний контейнер і робочий простір (без ізоляції між сеансами)

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
          gateway: "lab", // необов'язково
          gatewayEndpoint: "https://lab.example", // необов'язково
          policy: "strict", // необов'язковий id політики OpenShell
          providers: ["openai"], // необов'язково
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Режим OpenShell:**

- `mirror`: засіяти віддалене середовище з локального перед виконанням, синхронізувати назад після виконання; локальний робочий простір залишається канонічним
- `remote`: засіяти віддалене середовище один раз під час створення sandbox, потім тримати віддалений робочий простір канонічним

У режимі `remote` локальні правки на хості, зроблені поза OpenClaw, не синхронізуються в sandbox автоматично після кроку засівання.
Транспортом є SSH у sandbox OpenShell, але Plugin володіє життєвим циклом sandbox і необов'язковою дзеркальною синхронізацією.

**`setupCommand`** запускається один раз після створення контейнера (через `sh -lc`). Потребує виходу в мережу, кореня з правами запису, користувача root.

**Контейнери за замовчуванням мають `network: "none"`** — установіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` за замовчуванням заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний режим).
Повороти app-server Codex в активному sandbox OpenClaw використовують це саме налаштування виходу для свого нативного мережевого доступу в режимі коду.

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні та поагентні прив'язки об'єднуються.

**Ізольований браузер** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC впроваджується в системний промпт. Не потребує `browser.enabled` в `openclaw.json`.
Доступ спостерігача noVNC за замовчуванням використовує автентифікацію VNC, а OpenClaw видає короткочасний URL із токеном (замість розкриття пароля у спільному URL).

- `allowHostControl: false` (за замовчуванням) блокує націлювання ізольованих сесій на браузер хоста.
- `network` за замовчуванням дорівнює `openclaw-sandbox-browser` (виділена bridge-мережа). Установлюйте `bridge` лише тоді, коли явно потрібна глобальна bridge-зв'язність.
- `cdpSourceRange` необов'язково обмежує вхід CDP на межі контейнера діапазоном CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер ізольованого браузера. Коли задано (зокрема `[]`), це замінює `docker.binds` для контейнера браузера.
- Типові параметри запуску визначені в `scripts/sandbox-browser-entrypoint.sh` і налаштовані для хостів контейнерів:
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
    увімкнені за замовчуванням і можуть бути вимкнені через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    типовий ліміт процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовою лінією образу контейнера; використовуйте власний образ браузера з власною
    точкою входу, щоб змінити типові значення контейнера.

</Accordion>

Ізоляція браузера та `sandbox.docker.binds` доступні лише для Docker.

Зібрати образи (з checkout вихідного коду):

```bash
scripts/sandbox-setup.sh           # основний образ sandbox
scripts/sandbox-browser-setup.sh   # необов'язковий образ браузера
```

Для встановлень npm без checkout вихідного коду див. [Ізоляція § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) щодо вбудованих команд `docker build`.

### `agents.list` (поагентні перевизначення)

Використовуйте `agents.list[].tts`, щоб надати агенту власного провайдера TTS, голос, модель,
стиль або режим авто-TTS. Блок агента глибоко об'єднується поверх глобального
`messages.tts`, тож спільні облікові дані можуть залишатися в одному місці, а окремі
агенти перевизначають лише потрібні їм поля голосу або провайдера. Перевизначення активного агента
застосовується до автоматичних озвучених відповідей, `/tts audio`, `/tts status` і
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
        model: "anthropic/claude-opus-4-6", // або { primary, fallbacks }
        thinkingDefault: "high", // перевизначення рівня мислення для агента
        reasoningDefault: "on", // перевизначення видимості reasoning для агента
        fastModeDefault: false, // перевизначення швидкого режиму для агента
        params: { cacheRetention: "none" }, // перевизначає відповідні params у defaults.models за ключем
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // замінює agents.defaults.skills, коли задано
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

- `id`: стабільний id агента (обов'язково).
- `default`: коли задано кілька, перший перемагає (записується попередження). Якщо жоден не задано, типовим є перший запис списку.
- `model`: рядкова форма задає сувору основну модель для агента без fallback моделі; об'єктна форма `{ primary }` також сувора, якщо ви не додасте `fallbacks`. Використовуйте `{ primary, fallbacks: [...] }`, щоб увімкнути fallback для цього агента, або `{ primary, fallbacks: [] }`, щоб зробити сувору поведінку явною. Завдання Cron, які перевизначають лише `primary`, усе ще успадковують типові fallback, якщо ви не встановите `fallbacks: []`.
- `params`: поагентні параметри потоку, об'єднані поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень на кшталт `cacheRetention`, `temperature` або `maxTokens` без дублювання всього каталогу моделей.
- `tts`: необов'язкові поагентні перевизначення перетворення тексту на мовлення. Блок глибоко об'єднується поверх `messages.tts`, тож тримайте спільні облікові дані провайдера й політику fallback у `messages.tts`, а тут задавайте лише специфічні для персони значення, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов'язковий список дозволених Skills для агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, коли задано; явний список замінює типові значення замість об'єднання, а `[]` означає відсутність skills.
- `thinkingDefault`: необов'язковий типовий рівень мислення для агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для повідомлення або сесії. Вибраний профіль провайдера/моделі визначає, які значення чинні; для Google Gemini `adaptive` зберігає динамічне мислення, яким володіє провайдер (`thinkingLevel` пропущено на Gemini 3/3.1, `thinkingBudget: -1` на Gemini 2.5).
- `reasoningDefault`: необов'язкова типова видимість reasoning для агента (`on | off | stream`). Перевизначає `agents.defaults.reasoningDefault` для цього агента, коли не задано перевизначення reasoning для повідомлення або сесії.
- `fastModeDefault`: необов'язкове типове значення швидкого режиму для агента (`"auto" | true | false`). Застосовується, коли не задано перевизначення швидкого режиму для повідомлення або сесії.
- `models`: необов'язковий поагентний каталог моделей/перевизначення runtime, індексовані повними id `provider/model`. Використовуйте `models["provider/model"].agentRuntime` для поагентних винятків runtime.
- `runtime`: необов'язковий дескриптор runtime для агента. Використовуйте `type: "acp"` з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент за замовчуванням має використовувати сесії harness ACP.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- Локальні файли зображень `identity.avatar`, шляхи до яких відносні до робочого простору, обмежені 2 МБ. URL `http(s)` і URI `data:` не перевіряються локальним обмеженням розміру файлу.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених id налаштованих агентів для явних цілей `sessions_spawn.agentId` (`["*"]` = будь-яка налаштована ціль; за замовчуванням: лише той самий агент). Додайте id запитувача, коли потрібно дозволити виклики `agentId`, націлені на себе. Застарілі записи, конфігурацію агента для яких видалено, відхиляються `sessions_spawn` і пропускаються в `agents_list`; запустіть `openclaw doctor --fix`, щоб прибрати їх, або додайте мінімальний запис `agents.list[]`, якщо ця ціль має залишатися доступною для породження з успадкуванням типових значень.
- Запобіжник успадкування sandbox: якщо сесія запитувача ізольована, `sessions_spawn` відхиляє цілі, які запускалися б без ізоляції.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, у яких пропущено `agentId` (примушує явний вибір профілю; за замовчуванням: false).

---

## Маршрутизація кількох агентів

Запускайте кількох ізольованих агентів усередині одного Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

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

### Поля відповідності прив'язки

- `type` (необов'язково): `route` для звичайної маршрутизації (відсутній type за замовчуванням означає route), `acp` для постійних прив'язок розмов ACP.
- `match.channel` (обов'язково)
- `match.accountId` (необов'язково; `*` = будь-який акаунт; пропущено = типовий акаунт)
- `match.peer` (необов'язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов'язково; специфічно для каналу)
- `acp` (необов'язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок відповідності:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний, без peer/guild/team)
5. `match.accountId: "*"` (на весь канал)
6. Типовий агент

У межах кожного рівня перший відповідний запис `bindings` перемагає.

Для записів `type: "acp"` OpenClaw розв'язує за точною ідентичністю розмови (`match.channel` + акаунт + `match.peer.id`) і не використовує наведений вище порядок рівнів прив'язки маршруту.

### Поагентні профілі доступу

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

<Accordion title="Інструменти лише для читання + робочий простір">

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

Див. [Пісочниця та інструменти для багатоагентного режиму](/uk/tools/multi-agent-sandbox-tools), щоб дізнатися подробиці пріоритетності.

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

<Accordion title="Подробиці полів сеансу">

- **`scope`**: базова стратегія групування сеансів для контекстів групового чату.
  - `per-sender` (типово): кожен відправник отримує ізольований сеанс у межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують один сеанс (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються приватні повідомлення.
  - `main`: усі приватні повідомлення спільно використовують основний сеанс.
  - `per-peer`: ізоляція за ідентифікатором відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для поштових скриньок із багатьма користувачами).
  - `per-account-channel-peer`: ізоляція за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: зіставляє канонічні ідентифікатори з учасниками з префіксом провайдера для спільного використання сеансів між каналами. Dock-команди, як-от `/dock_discord`, використовують те саме зіставлення, щоб перемкнути маршрут відповіді активного сеансу на інший пов’язаний канал; див. [Закріплення каналів](/uk/concepts/channel-docking).
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва варіанти, спрацьовує той, що настає першим. Актуальність щоденного скидання використовує `sessionStartedAt` рядка сеансу; актуальність скидання за бездіяльністю використовує `lastInteractionAt`. Фонові/системні записи подій, як-от heartbeat, пробудження cron, сповіщення exec і службовий облік gateway, можуть оновлювати `updatedAt`, але вони не підтримують щоденні/бездіяльні сеанси актуальними.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як псевдонім для `direct`.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для основного кошика прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів відповіді між агентами під час обмінів агент-агент (ціле число, діапазон: `0`-`20`, типово: `5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона має пріоритет.
- **`maintenance`**: очищення сховища сеансів і керування збереженням.
  - `mode`: `enforce` застосовує очищення і є типовим; `warn` лише виводить попередження.
  - `pruneAfter`: віковий поріг для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`). Runtime записує пакетне очищення з невеликим буфером верхнього порога для обмежень виробничого масштабу; `openclaw sessions cleanup --enforce` застосовує обмеження негайно.
  - Короткотривалі сеанси зондування запуску моделі Gateway використовують фіксоване збереження `24h`, але очищення керується тиском: воно видаляє застарілі рядки суворих зондувань запуску моделі лише тоді, коли досягнуто тиску обслуговування/обмеження записів сеансів. Підходять лише суворі явні ключі зондування, що відповідають `agent:*:explicit:model-run-<uuid>`; звичайні прямі, групові, потокові, cron, hook, heartbeat, ACP і підагентські сеанси не успадковують це 24-годинне збереження. Коли виконується очищення запуску моделі, воно виконується перед ширшим очищенням застарілих записів `pruneAfter` і обмеженням `maxEntries`.
  - `rotateBytes`: застаріло й ігнорується; `openclaw doctor --fix` видаляє його зі старіших конфігурацій.
  - `resetArchiveRetention`: збереження для архівів транскриптів `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий дисковий бюджет каталогу сеансів. У режимі `warn` записує попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сеанси.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово становить `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сеансів, прив’язаних до потоків.
  - `enabled`: головний типовий перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокуса після бездіяльності в годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `spawnSessions`: типовий шлюз для створення робочих сеансів, прив’язаних до потоків, із `sessions_spawn` і породжень потоків ACP. Типово `true`, коли прив’язки потоків увімкнено; провайдери/облікові записи можуть перевизначати.
  - `defaultSpawnContext`: типовий нативний контекст підагента для породжень, прив’язаних до потоків (`"fork"` або `"isolated"`). Типово `"fork"`.

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

Визначення (найконкретніше має пріоритет): обліковий запис → канал → глобальне. `""` вимикає і зупиняє каскад. `"auto"` формує `[{identity.name}]`.

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

- Типово дорівнює `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервне значення ідентичності.
- Область: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в каналах із підтримкою реакцій, як-от Slack, Discord, Telegram, WhatsApp та iMessage.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord, Telegram і WhatsApp.
  У Slack і Discord невстановлене значення залишає реакції статусу ввімкненими, коли активні реакції підтвердження.
  У Telegram і WhatsApp встановіть його явно в `true`, щоб увімкнути реакції статусу життєвого циклу.
- `messages.statusReactions.emojis`: перевизначає ключі емодзі життєвого циклу:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` і `stallHard`.
  Telegram дозволяє лише фіксований набір реакцій, тому непідтримувані налаштовані емодзі повертаються
  до найближчого підтримуваного варіанта статусу для цього чату.

### Вхідний debounce

Об’єднує швидкі текстові повідомлення від одного відправника в один хід агента. Медіа/вкладення обробляються негайно. Команди керування оминають debounce.

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

- `auto` керує типовим режимом авто-TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначити локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` увімкнено за замовчуванням; `modelOverrides.allowProvider` за замовчуванням має значення `false` (явне ввімкнення).
- API-ключі використовують резервні `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані провайдери мовлення належать Plugin. Якщо задано `plugins.allow`, додайте кожен Plugin провайдера TTS, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий ідентифікатор провайдера `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на кінцеву точку не OpenAI, OpenClaw розглядає її як OpenAI-сумісний TTS-сервер і послаблює перевірку моделі/голосу.

---

## Talk

Типові значення для режиму Talk (macOS/iOS/Android).

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

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кілька провайдерів Talk.
- Застарілі пласкі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію в `talk.providers.<provider>`.
- Ідентифікатори голосів використовують резервні `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає рядки відкритого тексту або об’єкти SecretRef.
- Резервний `ELEVENLABS_API_KEY` застосовується лише тоді, коли не налаштовано API-ключ Talk.
- `providers.*.voiceAliases` дає директивам Talk змогу використовувати зручні імена.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний помічник MLX для macOS. Якщо не вказано, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX у macOS працює через вбудований помічник `openclaw-mlx-tts`, якщо він наявний, або виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `consultThinkingLevel` керує рівнем мислення для повного запуску агента OpenClaw за викликами Control UI Talk realtime `openclaw_agent_consult`. Не задавайте, щоб зберегти звичайну поведінку сесії/моделі.
- `consultFastMode` задає одноразове перевизначення швидкого режиму для консультацій Control UI Talk realtime без зміни звичайного налаштування швидкого режиму сесії.
- `speechLocale` задає ідентифікатор локалі BCP 47, який використовується розпізнаванням мовлення Talk на iOS/macOS. Не задавайте, щоб використовувати типове значення пристрою.
- `silenceTimeoutMs` керує тим, як довго режим Talk чекає після мовчання користувача, перш ніж надіслати транскрипт. Якщо не задано, зберігається типове вікно паузи платформи (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` додає системні інструкції для провайдера до вбудованого realtime-запиту OpenClaw, тож стиль голосу можна налаштувати без втрати типових вказівок `openclaw_agent_consult`.
- `realtime.consultRouting` керує резервною передачею Gateway, коли realtime-провайдер створює фінальний користувацький транскрипт без `openclaw_agent_consult`: `provider-direct` зберігає прямі відповіді провайдера, тоді як `force-agent-consult` маршрутизує фіналізований запит через OpenClaw.

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
