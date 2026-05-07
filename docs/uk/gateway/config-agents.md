---
read_when:
    - Налаштування стандартних параметрів агента (моделі, мислення, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування маршрутизації та прив’язок для кількох агентів
    - Налаштування сеансу, доставки повідомлень і поведінки режиму розмови
summary: Типові налаштування агента, багатоагентна маршрутизація, сеанс, повідомлення та конфігурація спілкування
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-05-07T13:17:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 287b832cda451900ff184546ee38313e1304ffc9bb52bacae6b1f457c64f4c08
    source_path: gateway/config-agents.md
    workflow: 16
---

Конфігураційні ключі з областю дії агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [довідку з конфігурації](/uk/gateway/configuration-reference).

## Стандартні налаштування агента

### `agents.defaults.workspace`

За замовчуванням: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов'язковий корінь репозиторію, що відображається в рядку Runtime системного промпта. Якщо не задано, OpenClaw автоматично визначає його, рухаючись угору від робочої області.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов'язковий стандартний список дозволених Skills для агентів, які не задають
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

- Не вказуйте `agents.defaults.skills`, щоб Skills за замовчуванням були необмеженими.
- Не вказуйте `agents.list[].skills`, щоб успадкувати стандартні значення.
- Задайте `agents.list[].skills: []`, щоб вимкнути Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об'єднується зі стандартними значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення файлів початкового завантаження робочої області (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Пропускає створення вибраних необов'язкових файлів робочої області, водночас записуючи обов'язкові файли початкового завантаження. Допустимі значення: `SOUL.md`, `USER.md`, `HEARTBEAT.md` і `IDENTITY.md`.

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

Керує тим, коли файли початкового завантаження робочої області вставляються в системний промпт. За замовчуванням: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторне вставлення початкового завантаження робочої області, зменшуючи розмір промпта. Запуски Heartbeat і повторні спроби після Compaction все одно перебудовують контекст.
- `"never"`: вимикає початкове завантаження робочої області та вставлення контекстних файлів на кожному ході. Використовуйте це лише для агентів, які повністю керують життєвим циклом свого промпта (власні контекстні рушії, нативні середовища виконання, що будують власний контекст, або спеціалізовані робочі процеси без початкового завантаження). Ходи Heartbeat і відновлення після Compaction також пропускають вставлення.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на файл початкового завантаження робочої області перед обрізанням. За замовчуванням: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, вставлених з усіх файлів початкового завантаження робочої області. За замовчуванням: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим агенту сповіщенням у системному промпті, коли контекст початкового завантаження обрізано.
За замовчуванням: `"once"`.

- `"off"`: ніколи не вставляти текст сповіщення про обрізання в системний промпт.
- `"once"`: вставляти стисле сповіщення один раз для кожної унікальної сигнатури обрізання (рекомендовано).
- `"always"`: вставляти стисле сповіщення під час кожного запуску, коли є обрізання.

Докладні сирі/вставлені лічильники та поля налаштування конфігурації залишаються в діагностиці,
як-от звіти про контекст/статус і журнали; звичайний користувацький/рантайм-контекст WebChat отримує лише
стисле сповіщення про відновлення.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта володіння бюджетами контексту

OpenClaw має кілька високоооб'ємних бюджетів промпта/контексту, і вони
навмисно розділені за підсистемами, а не всі проходять через один загальний
перемикач.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне вставлення початкового завантаження робочої області.
- `agents.defaults.startupContext.*`:
  одноразова прелюдія запуску моделі під час скидання/старту, зокрема нещодавні щоденні
  файли `memory/*.md`. Прості команди чату `/new` і `/reset`
  підтверджуються без виклику моделі.
- `skills.limits.*`:
  компактний список Skills, вставлений у системний промпт.
- `agents.defaults.contextLimits.*`:
  обмежені фрагменти середовища виконання та вставлені блоки, що належать середовищу виконання.
- `memory.qmd.limits.*`:
  фрагмент індексованого пошуку пам'яті та розмір вставлення.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовою прелюдією першого ходу, що вставляється під час запусків моделі після скидання/старту.
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

Спільні стандартні значення для обмежених поверхонь рантайм-контексту.

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

- `memoryGetMaxChars`: стандартне обмеження фрагмента `memory_get` перед додаванням
  метаданих обрізання та сповіщення про продовження.
- `memoryGetDefaultLines`: стандартне вікно рядків `memory_get`, коли `lines`
  пропущено.
- `toolResultMaxChars`: обмеження результату інструмента наживо, що використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: обмеження фрагмента AGENTS.md, що використовується під час вставлення
  оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для окремого агента для спільних перемикачів `contextLimits`. Пропущені поля успадковуються
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

Максимальний розмір у пікселях для найдовшого боку зображення в блоках зображень транскрипту/інструмента перед викликами провайдера.
За замовчуванням: `1200`.

Нижчі значення зазвичай зменшують використання візійних токенів і розмір корисного навантаження запиту для запусків із великою кількістю знімків екрана.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного промпта (не для часових міток повідомлень). За відсутності використовується часовий пояс хоста.

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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
      },
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
  - Використовується шляхом інструмента `image` як його конфігурація візійної моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати зображення на вхід.
  - Надавайте перевагу явним посиланням `provider/model`. Голі ідентифікатори приймаються для сумісності; якщо голий ідентифікатор однозначно відповідає налаштованому запису з підтримкою зображень у `models.providers.*.models`, OpenClaw доповнює його цим провайдером. Неоднозначні налаштовані збіги потребують явного префікса провайдера.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для виводу OpenAI PNG/WebP із прозорим тлом.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо пропущено, `image_generate` все одно може визначити типового провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації зображень у порядку ідентифікаторів провайдерів.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо пропущено, `music_generate` все одно може визначити типового провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації музики у порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо пропущено, `video_generate` все одно може визначити типового провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації відео у порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо пропущено, інструмент PDF повертається до `imageModel`, а потім до визначеної моделі сеансу/типової моделі.
- `pdfMaxBytesMb`: типовий ліміт розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, яку враховує резервний режим витягування в інструменті `pdf`.
- `verboseDefault`: типовий рівень докладності для агентів. Значення: `"off"`, `"on"`, `"full"`. Типово: `"off"`.
- `toolProgressDetail`: режим деталізації для підсумків інструментів `/verbose` і рядків інструментів у чернетці прогресу. Значення: `"explain"` (типово, компактні зрозумілі людині мітки) або `"raw"` (додає сирі команду/деталі, коли доступно). `agents.list[].toolProgressDetail` для окремого агента перевизначає це типове значення.
- `reasoningDefault`: типова видимість міркувань для агентів. Значення: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` для окремого агента перевизначає це типове значення. Налаштовані типові значення міркувань застосовуються лише для власників, авторизованих відправників або контекстів operator-admin Gateway, коли не задано перевизначення міркувань для повідомлення чи сеансу.
- `elevatedDefault`: типовий рівень піднесеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типово: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу OpenAI через API-ключ або Codex OAuth). Якщо пропустити провайдера, OpenClaw спершу пробує псевдонім, потім унікальний збіг налаштованого провайдера для цього точного ідентифікатора моделі, і лише тоді повертається до налаштованого типового провайдера (застаріла поведінка сумісності, тому надавайте перевагу явному `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повертається до першої налаштованої пари провайдер/модель замість того, щоб показувати застарілу типову модель видаленого провайдера.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Безпечні зміни: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи. `config set` відхиляє заміни, які видалили б наявні записи allowlist, якщо не передати `--replace`.
  - Потоки налаштування/онбордингу в межах провайдера об’єднують вибрані моделі провайдера в цю мапу й зберігають не пов’язаних із ними вже налаштованих провайдерів.
  - Для прямих моделей OpenAI Responses серверна Compaction увімкнена автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити додавання `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [серверна Compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні типові параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для окремої моделі), потім `agents.list[].params` (відповідний ідентифікатор агента) перевизначає за ключем. Докладніше див. [Кешування промптів](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений наскрізний JSON, що зливається в тіла запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, додаткове тіло має перевагу; ненативні маршрути completions усе одно після цього видаляють OpenAI-only `store`.
- `params.chat_template_kwargs`: аргументи чат-шаблонів vLLM/OpenAI-сумісних моделей, що зливаються в тіла запитів верхнього рівня `api: "openai-completions"`. Для `vllm/nemotron-3-*` із вимкненим thinking вбудований vLLM Plugin автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані типові значення, а `extra_body.chat_template_kwargs` усе одно має остаточний пріоритет. Для елементів керування thinking Qwen vLLM задайте `params.qwenThinkingFormat` як `"chat-template"` або `"top-level"` у записі цієї моделі.
- `compat.supportedReasoningEfforts`: список зусиль міркування для окремої OpenAI-сумісної моделі. Додавайте `"xhigh"` для користувацьких кінцевих точок, які справді його приймають; тоді OpenClaw показує `/think xhigh` у меню команд, рядках сеансів Gateway, валідації патчів сеансів, валідації CLI агента та валідації `llm-task` для цього налаштованого провайдера/моделі. Використовуйте `compat.reasoningEffortMap`, коли бекенд очікує специфічне для провайдера значення для канонічного рівня.
- `params.preserveThinking`: Z.AI-only увімкнення збереженого thinking. Коли ввімкнено і thinking активний, OpenClaw надсилає `thinking.clear_thinking: false` і відтворює попередній `reasoning_content`; див. [thinking Z.AI і збережений thinking](/uk/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: типова низькорівнева політика середовища виконання агента. Пропущений ідентифікатор типово означає OpenClaw Pi. Використовуйте `id: "pi"`, щоб примусово застосувати вбудований PI harness, `id: "auto"`, щоб дозволити зареєстрованим plugin harnesses заявляти підтримувані моделі й використовувати PI, коли збігів немає, зареєстрований ідентифікатор harness на кшталт `id: "codex"`, щоб вимагати цей harness, або підтримуваний псевдонім CLI-бекенда на кшталт `id: "claude-cli"`. Явні plugin runtimes закриваються з помилкою, коли harness недоступний або зазнає невдачі. Тримайте посилання на моделі канонічними як `provider/model`; вибирайте Codex, Claude CLI, Gemini CLI та інші бекенди виконання через конфігурацію runtime замість застарілих префіксів провайдера runtime. Див. [Середовища виконання агентів](/uk/concepts/agent-runtimes), щоб зрозуміти, чим це відрізняється від вибору провайдера/моделі.
- Записувачі конфігурації, що змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення резервних моделей), зберігають канонічну об’єктну форму й за можливості зберігають наявні списки резервних моделей.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сеансами (кожен сеанс усе одно серіалізований). Типово: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` керує тим, який низькорівневий виконавець запускає ходи агента. Більшість
розгортань має залишити типове середовище виконання OpenClaw Pi. Використовуйте його, коли довірений
Plugin надає нативний harness, як-от вбудований harness сервера застосунку Codex,
або коли потрібен підтримуваний CLI-бекенд, наприклад Claude CLI. Для ментальної
моделі див. [Середовища виконання агентів](/uk/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, зареєстрований ідентифікатор plugin harness або підтримуваний псевдонім CLI-бекенда. Вбудований Codex Plugin реєструє `codex`; вбудований Anthropic Plugin надає CLI-бекенд `claude-cli`.
- `id: "auto"` дозволяє зареєстрованим plugin harnesses заявляти підтримувані ходи й використовує PI, коли жоден harness не збігається. Явний plugin runtime, наприклад `id: "codex"`, вимагає цей harness і закривається з помилкою, якщо він недоступний або зазнає невдачі.
- Перевизначення середовища: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `id` для цього процесу.
- Моделі агентів OpenAI типово використовують Codex harness; `agentRuntime.id: "codex"` залишається чинним, коли потрібно зробити це явним.
- Для розгортань Claude CLI надавайте перевагу `model: "anthropic/claude-opus-4-7"` разом з `agentRuntime.id: "claude-cli"`. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` все ще працюють для сумісності, але нова конфігурація має зберігати вибір провайдера/моделі канонічним і розміщувати бекенд виконання в `agentRuntime.id`.
- Старіші ключі політики runtime переписуються в `agentRuntime` за допомогою `openclaw doctor --fix`.
- Вибір harness закріплюється для ідентифікатора сеансу після першого вбудованого запуску. Зміни конфігурації/середовища впливають на нові або скинуті сеанси, а не на наявну стенограму. Застарілі сеанси OpenAI з історією стенограми, але без записаного закріплення, використовують Codex; застарілі закріплення OpenAI PI можна виправити через `openclaw doctor --fix`. `/status` повідомляє ефективний runtime, наприклад `Runtime: OpenClaw Pi Default` або `Runtime: OpenAI Codex`.
- Це керує лише виконанням текстових ходів агента. Генерація медіа, vision, PDF, музика, відео й TTS усе ще використовують свої налаштування провайдера/моделі.

**Вбудовані скорочення псевдонімів** (застосовуються лише коли модель є в `agents.defaults.models`):

| Псевдонім           | Модель                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Ваші налаштовані псевдоніми завжди мають перевагу над типовими.

Моделі Z.AI GLM-4.x автоматично вмикають режим мислення, якщо ви не встановите `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI за замовчуванням вмикають `tool_stream` для потокового передавання викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Моделі Anthropic Claude 4.6 за замовчуванням використовують `adaptive` мислення, коли явний рівень мислення не задано.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних запусків лише з текстом (без викликів інструментів). Корисно як запасний варіант, коли API-провайдери дають збій.

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

- CLI-бекенди орієнтовані насамперед на текст; інструменти завжди вимкнені.
- Сеанси підтримуються, коли задано `sessionArg`.
- Наскрізне передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь системний промпт, зібраний OpenClaw, фіксованим рядком. Задається на рівні стандартних налаштувань (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із промптами.

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

Незалежні від провайдера накладки промптів, що застосовуються за родиною моделей. Ідентифікатори моделей родини GPT-5 отримують спільний контракт поведінки для всіх провайдерів; `personality` керує лише дружнім шаром стилю взаємодії.

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
- Застарілий `plugins.entries.openai.config.personality` усе ще читається, коли це спільне налаштування не задано.

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

- `every`: рядок тривалості (ms/s/m/h). За замовчуванням: `30m` (автентифікація через API-ключ) або `1h` (автентифікація OAuth). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли `false`, вилучає розділ Heartbeat із системного промпта та пропускає ін’єкцію `HEARTBEAT.md` у bootstrap-контекст. За замовчуванням: `true`.
- `suppressToolErrorWarnings`: коли `true`, приглушує payload-и попереджень про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для ходу агента Heartbeat перед його перериванням. Якщо не задано, використовується `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої доставки/DM. `allow` (за замовчуванням) дозволяє доставку до прямої цілі. `block` приглушує доставку до прямої цілі та видає `reason=dm-blocked`.
- `lightContext`: коли `true`, запуски Heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів робочої області.
- `isolatedSession`: коли `true`, кожен Heartbeat запускається в новому сеансі без попередньої історії розмови. Такий самий шаблон ізоляції, як у Cron `sessionTarget: "isolated"`. Зменшує вартість токенів на один Heartbeat із приблизно 100 тис. до приблизно 2–5 тис. токенів.
- `skipWhenBusy`: коли `true`, запуски Heartbeat відкладаються за наявності додатково зайнятих ліній: роботи субагента або вкладеної команди. Лінії Cron завжди відкладають Heartbeat, навіть без цього прапорця.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, Heartbeat виконують **лише ці агенти**.
- Heartbeat виконує повні ходи агента — коротші інтервали витрачають більше токенів.

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

- `mode`: `default` або `safeguard` (порційне узагальнення для довгих історій). Див. [Compaction](/uk/concepts/compaction).
- `provider`: ідентифікатор зареєстрованого Plugin провайдера Compaction. Коли задано, викликається `summarize()` провайдера замість вбудованого узагальнення LLM. У разі збою повертається до вбудованого варіанта. Задання провайдера примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, перш ніж OpenClaw її перерве. За замовчуванням: `900`.
- `keepRecentTokens`: бюджет точки зрізу Pi для дослівного збереження найновішого хвоста транскрипта. Ручний `/compact` враховує це, коли значення явно задано; інакше ручна Compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (за замовчуванням), `off` або `custom`. `strict` додає на початок вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час узагальнення Compaction.
- `identifierInstructions`: необов’язковий власний текст щодо збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою для некоректно сформованого виводу в safeguard-узагальненнях. Увімкнено за замовчуванням у режимі safeguard; установіть `enabled: false`, щоб пропустити аудит.
- `midTurnPrecheck`: необов’язкова перевірка тиску циклу інструментів Pi. Коли `enabled: true`, OpenClaw перевіряє тиск контексту після додавання результатів інструментів і перед наступним викликом моделі. Якщо контекст більше не вміщується, він перериває поточну спробу перед надсиланням промпта та повторно використовує наявний шлях відновлення precheck, щоб обрізати результати інструментів або виконати Compaction і повторити спробу. Працює з режимами Compaction `default` і `safeguard`. За замовчуванням: вимкнено.
- `postCompactionSections`: необов’язкові назви H2/H3-розділів AGENTS.md для повторної ін’єкції після Compaction. За замовчуванням: `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторну ін’єкцію. Коли не задано або явно встановлено цю стандартну пару, старі заголовки `Every Session`/`Safety` також приймаються як застарілий fallback.
- `model`: необов’язкове перевизначення `provider/model-id` лише для узагальнення Compaction. Використовуйте це, коли основний сеанс має лишатися на одній моделі, а узагальнення Compaction мають виконуватися на іншій; коли не задано, Compaction використовує основну модель сеансу.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), який запускає звичайну локальну Compaction перед запуском, коли активний JSONL перевищує поріг. Потребує `truncateAfterCompaction`, щоб успішна Compaction могла перейти до меншого наступного транскрипта. Вимкнено, коли не задано або дорівнює `0`.
- `notifyUser`: коли `true`, надсилає користувачу короткі сповіщення, коли Compaction починається й коли завершується (наприклад, "Compacting context..." і "Compaction complete"). За замовчуванням вимкнено, щоб Compaction була тихою.
- `memoryFlush`: тиха агентна хід перед авто-Compaction для збереження довготривалих спогадів. Установіть `model` на точного провайдера/модель, наприклад `ollama/qwen3:8b`, коли цей службовий хід має лишатися на локальній моделі; перевизначення не успадковує fallback-ланцюжок активного сеансу. Пропускається, коли робоча область доступна лише для читання.

### `agents.defaults.contextPruning`

Очищає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сеансу на диску.

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

<Accordion title="поведінка режиму cache-ttl">

- `mode: "cache-ttl"` вмикає проходи очищення.
- `ttl` керує тим, як часто очищення може запускатися знову (після останнього звернення до кешу).
- Очищення спершу м’яко обрізає завеликі результати інструментів, а потім, якщо потрібно, повністю очищає старіші результати інструментів.

**М’яке обрізання** зберігає початок + кінець і вставляє `...` посередині.

**Повне очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не обрізаються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, очищення пропускається.

</Accordion>

Див. [Очищення сеансу](/uk/concepts/session-pruning), щоб дізнатися подробиці поведінки.

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
- Перевизначення каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Signal/Slack/Discord/Google Chat за замовчуванням мають `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоковими відповідями. `natural` = 800–2500 мс. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Див. [Потокове передавання](/uk/concepts/streaming), щоб дізнатися подробиці поведінки та розбиття на фрагменти.

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

- Типові значення: `instant` для прямих чатів/згадок, `message` для групових чатів без згадок.
- Перевизначення для окремого сеансу: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Індикатори набору](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необовʼязкова ізоляція для вбудованого агента. Повний посібник див. у [Ізоляція](/uk/gateway/sandboxing).

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

- `docker`: локальне середовище виконання Docker (типово)
- `ssh`: універсальне віддалене середовище виконання на базі SSH
- `openshell`: середовище виконання OpenShell

Коли вибрано `backend: "openshell"`, специфічні для середовища виконання налаштування переходять до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенда:**

- `target`: ціль SSH у формі `user@host[:port]`
- `command`: команда SSH-клієнта (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для робочих просторів за областями
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRefs, які OpenClaw матеріалізує у тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має перевагу над `identityFile`
- `certificateData` має перевагу над `certificateFile`
- `knownHostsData` має перевагу над `knownHostsFile`
- Значення `*Data` на базі SecretRef розвʼязуються з активного знімка середовища виконання секретів перед запуском сеансу ізоляції

**Поведінка SSH-бекенда:**

- одноразово заповнює віддалений робочий простір після створення або повторного створення
- потім підтримує віддалений робочий простір SSH як канонічний
- маршрутизує `exec`, файлові інструменти та медіашляхи через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує контейнери ізольованого браузера

**Доступ до робочого простору:**

- `none`: робочий простір ізоляції за областю в `~/.openclaw/sandboxes`
- `ro`: робочий простір ізоляції в `/workspace`, робочий простір агента змонтовано лише для читання в `/agent`
- `rw`: робочий простір агента змонтовано для читання/запису в `/workspace`

**Область:**

- `session`: контейнер + робочий простір для кожного сеансу
- `agent`: один контейнер + робочий простір на агента (типово)
- `shared`: спільний контейнер і робочий простір (без міжсеансової ізоляції)

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

- `mirror`: заповнити віддалене середовище з локального перед exec, синхронізувати назад після exec; локальний робочий простір залишається канонічним
- `remote`: одноразово заповнити віддалене середовище під час створення ізоляції, потім підтримувати віддалений робочий простір як канонічний

У режимі `remote` локальні зміни на хості, зроблені поза OpenClaw, не синхронізуються в ізоляцію автоматично після етапу заповнення.
Транспортом є SSH в ізоляцію OpenShell, але Plugin керує життєвим циклом ізоляції та необовʼязковою дзеркальною синхронізацією.

**`setupCommand`** запускається один раз після створення контейнера (через `sh -lc`). Потребує мережевого виходу, кореня з правом запису, користувача root.

**Контейнери типово мають `network: "none"`** — встановіть `"bridge"` (або власну мостову мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не встановили
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний обхід).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні привʼязки та привʼязки для окремого агента обʼєднуються.

**Ізольований браузер** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системний промпт. Не потребує `browser.enabled` в `openclaw.json`.
Доступ спостерігача noVNC типово використовує автентифікацію VNC, а OpenClaw видає короткоживучий URL із токеном (замість показу пароля у спільному URL).

- `allowHostControl: false` (типово) блокує ізольовані сеанси від націлювання на браузер хоста.
- `network` типово має значення `openclaw-sandbox-browser` (виділена мостова мережа). Встановлюйте `bridge` лише коли явно потрібне глобальне мостове зʼєднання.
- `cdpSourceRange` необовʼязково обмежує вхід CDP на межі контейнера до CIDR-діапазону (наприклад `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер ізольованого браузера. Коли встановлено (включно з `[]`), це замінює `docker.binds` для контейнера браузера.
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
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити за допомогою
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; встановіть `0`, щоб використовувати
    типовий ліміт процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовими для образу контейнера; щоб змінити типові значення контейнера, використовуйте власний образ браузера з власною
    точкою входу.

</Accordion>

Ізоляція браузера та `sandbox.docker.binds` доступні лише для Docker.

Збірка образів (із checkout вихідного коду):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Для npm-встановлень без checkout вихідного коду див. [Ізоляція § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) щодо вбудованих команд `docker build`.

### `agents.list` (перевизначення для окремого агента)

Використовуйте `agents.list[].tts`, щоб надати агенту власного постачальника TTS, голос, модель,
стиль або режим auto-TTS. Блок агента глибоко обʼєднується поверх глобального
`messages.tts`, тому спільні облікові дані можуть лишатися в одному місці, а окремі
агенти перевизначають лише потрібні їм поля голосу або постачальника. Перевизначення
активного агента застосовується до автоматичних озвучених відповідей, `/tts audio`, `/tts status` і
агентського інструмента `tts`. Див. [Перетворення тексту на мовлення](/uk/tools/tts#per-agent-voice-overrides)
для прикладів постачальників і пріоритету.

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
        agentRuntime: { id: "auto" },
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

- `id`: стабільний id агента (обов’язково).
- `default`: коли задано кілька, перший перемагає (записується попередження). Якщо не задано жодного, типовим буде перший запис у списку.
- `model`: рядкова форма задає сувору основну модель для окремого агента без резервної моделі; об’єктна форма `{ primary }` також сувора, якщо не додати `fallbacks`. Використовуйте `{ primary, fallbacks: [...] }`, щоб увімкнути для цього агента резервні моделі, або `{ primary, fallbacks: [] }`, щоб явно задати сувору поведінку. Завдання Cron, які перевизначають лише `primary`, все одно успадковують типові резервні моделі, якщо не задати `fallbacks: []`.
- `params`: параметри потоку для окремого агента, що зливаються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для перевизначень, специфічних для агента, як-от `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `tts`: необов’язкові перевизначення перетворення тексту на мовлення для окремого агента. Блок глибоко зливається поверх `messages.tts`, тож тримайте спільні облікові дані провайдера та політику резервування в `messages.tts`, а тут задавайте лише значення, специфічні для персони, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий список дозволених Skills для окремого агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, коли його задано; явний список замінює типові значення замість злиття, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень мислення для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для окремого повідомлення або сеансу. Вибраний профіль провайдера/моделі визначає, які значення є дійсними; для Google Gemini `adaptive` зберігає динамічне мислення, кероване провайдером (`thinkingLevel` пропущено для Gemini 3/3.1, `thinkingBudget: -1` для Gemini 2.5).
- `reasoningDefault`: необов’язкова типова видимість міркувань для окремого агента (`on | off | stream`). Перевизначає `agents.defaults.reasoningDefault` для цього агента, коли не задано перевизначення міркувань для окремого повідомлення або сеансу.
- `fastModeDefault`: необов’язкове типове значення швидкого режиму для окремого агента (`true | false`). Застосовується, коли не задано перевизначення швидкого режиму для окремого повідомлення або сеансу.
- `agentRuntime`: необов’язкове низькорівневе перевизначення політики середовища виконання для окремого агента. Використовуйте `{ id: "codex" }`, щоб зробити одного агента лише Codex, тоді як інші агенти зберігають типовий резервний PI у режимі `auto`.
- `runtime`: необов’язковий дескриптор середовища виконання для окремого агента. Використовуйте `type: "acp"` з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має за замовчуванням використовувати сеанси обв’язки ACP.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених id агентів для явних цілей `sessions_spawn.agentId` (`["*"]` = будь-який; типово: лише той самий агент). Додайте id запитувача, коли мають бути дозволені виклики `agentId`, спрямовані на самого себе.
- Захист успадкування пісочниці: якщо сеанс запитувача перебуває в пісочниці, `sessions_spawn` відхиляє цілі, які запускалися б без пісочниці.
- `subagents.requireAgentId`: коли `true`, блокує виклики `sessions_spawn`, у яких пропущено `agentId` (примушує явний вибір профілю; типово: `false`).

---

## Маршрутизація кількох агентів

Запускайте кілька ізольованих агентів в одному Gateway. Див. [Кілька агентів](/uk/concepts/multi-agent).

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

### Поля відповідності прив’язки

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній тип за замовчуванням означає route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; пропущено = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; залежить від каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок відповідності:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний, без peer/guild/team)
5. `match.accountId: "*"` (на весь канал)
6. Типовий агент

У межах кожного рівня перший відповідний запис `bindings` перемагає.

Для записів `type: "acp"` OpenClaw розв’язує за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище порядок рівнів прив’язки маршруту.

### Профілі доступу для окремих агентів

<Accordion title="Повний доступ (без пісочниці)">

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

<Accordion title="Подробиці полів сесії">

- **`scope`**: базова стратегія групування сесій для контекстів групових чатів.
  - `per-sender` (типово): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються приватні повідомлення.
  - `main`: усі приватні повідомлення спільно використовують основну сесію.
  - `per-peer`: ізоляція за ідентифікатором відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для скриньок вхідних повідомлень із кількома користувачами).
  - `per-account-channel-peer`: ізоляція за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: зіставляє канонічні ідентифікатори з одноранговими учасниками з префіксами провайдерів для спільного використання сесій між каналами. Команди прив’язування, як-от `/dock_discord`, використовують ту саму мапу, щоб перемкнути маршрут відповіді активної сесії на іншого пов’язаного однорангового учасника каналу; див. [прив’язування каналів](/uk/concepts/channel-docking).
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Коли налаштовано обидва варіанти, спрацьовує той, строк якого настає першим. Свіжість щоденного скидання використовує `sessionStartedAt` рядка сесії; свіжість скидання через бездіяльність використовує `lastInteractionAt`. Фонові/системні записи подій, як-от Heartbeat, пробудження Cron, сповіщення exec і службовий облік Gateway, можуть оновлювати `updatedAt`, але вони не підтримують свіжість щоденних/неактивних сесій.
- **`resetByType`**: перевизначення за типами (`direct`, `group`, `thread`). Застарілий `dm` приймається як псевдонім для `direct`.
- **`mainKey`**: застаріле поле. Середовище виконання завжди використовує `"main"` для основного кошика прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів відповіді між агентами під час обмінів агент-агент (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона має перевагу.
- **`maintenance`**: елементи керування очищенням сховища сесій + збереженням.
  - `mode`: `warn` лише виводить попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`). Середовище виконання записує пакетне очищення з невеликим буфером верхнього рівня для обмежень виробничого розміру; `openclaw sessions cleanup --enforce` застосовує обмеження негайно.
  - `rotateBytes`: застаріле й ігнорується; `openclaw doctor --fix` видаляє його зі старіших конфігурацій.
  - `resetArchiveRetention`: строк збереження архівів транскриптів `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; встановіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий дисковий бюджет каталогу сесій. У режимі `warn` він записує попередження; у режимі `enforce` спершу видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сесій, прив’язаних до потоків.
  - `enabled`: головний типовий перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокусу через бездіяльність у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `spawnSessions`: типовий шлюз для створення робочих сесій, прив’язаних до потоків, із `sessions_spawn` і створення потоків ACP. Типово `true`, коли прив’язки потоків увімкнено; провайдери/облікові записи можуть перевизначати.
  - `defaultSpawnContext`: типовий нативний контекст підагента для створень, прив’язаних до потоків (`"fork"` або `"isolated"`). Типово `"fork"`.

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

Налаштування перевизначення для каналу/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Визначення (перемагає найконкретніше): обліковий запис → канал → глобальне. `""` вимикає і зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна            | Опис                   | Приклад                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі   | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва постачальника    | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень мислення | `high`, `low`, `off`        |
| `{identity.name}` | Назва ідентичності агента | (те саме, що `"auto"`)      |

Змінні не чутливі до регістру. `{think}` є псевдонімом для `{thinkingLevel}`.

### Реакція підтвердження

- За замовчуванням використовується `identity.emoji` активного агента, інакше `"👀"`. Задайте `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервне значення ідентичності.
- Область дії: `group-mentions` (за замовчуванням), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: прибирає підтвердження після відповіді в каналах із підтримкою реакцій, як-от Slack, Discord, Telegram, WhatsApp і BlueBubbles.
- `messages.statusReactions.enabled`: вмикає реакції стану життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord, якщо значення не задано, реакції стану залишаються ввімкненими, коли активні реакції підтвердження.
  У Telegram явно задайте `true`, щоб увімкнути реакції стану життєвого циклу.

### Дебаунс вхідних повідомлень

Об’єднує швидкі текстові повідомлення від того самого відправника в один хід агента. Медіа/вкладення негайно скидають накопичення. Керівні команди оминають дебаунс.

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

- `auto` керує стандартним автоматичним режимом TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує ефективний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` увімкнено за замовчуванням; `modelOverrides.allowProvider` за замовчуванням має значення `false` (потрібне явне ввімкнення).
- Ключі API резервно беруться з `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані постачальники мовлення належать Plugin. Якщо задано `plugins.allow`, включіть кожен Plugin постачальника TTS, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий ідентифікатор постачальника `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на кінцеву точку не від OpenAI, OpenClaw розглядає її як OpenAI-сумісний сервер TTS і послаблює перевірку моделі/голосу.

---

## Розмова

Стандартні значення для режиму Розмови (macOS/iOS/Android).

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кілька постачальників Розмови.
- Застарілі пласкі ключі Розмови (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію в `talk.providers.<provider>`.
- Ідентифікатори голосів резервно беруться з `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає рядки відкритим текстом або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли для Розмови не налаштовано ключ API.
- `providers.*.voiceAliases` дає директивам Розмови змогу використовувати зручні назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний помічник MLX для macOS. Якщо не задано, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX у macOS виконується через вбудований помічник `openclaw-mlx-tts`, якщо він наявний, або виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `speechLocale` задає ідентифікатор локалі BCP 47, який використовується розпізнаванням мовлення Розмови в iOS/macOS. Не задавайте, щоб використовувати стандартне значення пристрою.
- `silenceTimeoutMs` керує тим, скільки часу режим Розмови чекає після мовчання користувача, перш ніж надіслати транскрипт. Якщо не задано, зберігається стандартне вікно паузи платформи (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — типові завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
