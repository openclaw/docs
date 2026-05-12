---
read_when:
    - Налаштування типових параметрів агента (моделі, мислення, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування багатоагентної маршрутизації та прив’язок
    - Налаштування сеансу, доставки повідомлень і поведінки режиму розмови
summary: Типові параметри агента, багатоагентна маршрутизація, сесія, повідомлення та конфігурація спілкування
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-05-12T12:50:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 517aec30ff6c65a269c7e5c8baefb5dc371dabe52d4c38a47a41cae1a1a785e1
    source_path: gateway/config-agents.md
    workflow: 16
---

Ключі конфігурації в межах агента під `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Типові налаштування агента

### `agents.defaults.workspace`

Типове значення: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, показаний у рядку Runtime системного промпта. Якщо не задано, OpenClaw автоматично визначає його, рухаючись угору від робочого простору.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий типовий список дозволених Skills для агентів, які не задають
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

- Пропустіть `agents.defaults.skills`, щоб за замовчуванням Skills були необмежені.
- Пропустіть `agents.list[].skills`, щоб успадкувати типові значення.
- Установіть `agents.list[].skills: []`, щоб не мати Skills.
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

Пропускає створення вибраних необов’язкових файлів робочого простору, водночас записуючи обов’язкові файли початкового налаштування. Допустимі значення: `SOUL.md`, `USER.md`, `HEARTBEAT.md` і `IDENTITY.md`.

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

Керує тим, коли файли початкового налаштування робочого простору вставляються в системний промпт. Типове значення: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторне вставлення початкового налаштування робочого простору, зменшуючи розмір промпта. Запуски Heartbeat і повтори після Compaction все одно перебудовують контекст.
- `"never"`: вимикає вставлення початкового налаштування робочого простору та контекстних файлів на кожному ході. Використовуйте це лише для агентів, які повністю керують життєвим циклом свого промпта (власні рушії контексту, нативні середовища виконання, що будують власний контекст, або спеціалізовані робочі процеси без початкового налаштування). Ходи Heartbeat і відновлення після Compaction також пропускають вставлення.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на файл початкового налаштування робочого простору перед обрізанням. Типове значення: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, вставлених з усіх файлів початкового налаштування робочого простору. Типове значення: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента повідомленням системного промпта, коли контекст початкового налаштування обрізано.
Типове значення: `"once"`.

- `"off"`: ніколи не вставляти текст повідомлення про обрізання в системний промпт.
- `"once"`: вставляти стисле повідомлення один раз для кожного унікального підпису обрізання (рекомендовано).
- `"always"`: вставляти стисле повідомлення під час кожного запуску, коли існує обрізання.

Детальні лічильники сирого/вставленого вмісту та поля налаштування конфігурації залишаються в діагностиці, як-от звіти й журнали контексту/стану; звичайний контекст користувача/середовища виконання WebChat отримує лише стисле повідомлення про відновлення.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Мапа володіння бюджетами контексту

OpenClaw має кілька великих бюджетів промпта/контексту, і вони
навмисно розділені за підсистемами, а не проходять через один універсальний
регулятор.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне вставлення початкового налаштування робочого простору.
- `agents.defaults.startupContext.*`:
  одноразова преамбула модельного запуску під час скидання/старту, включно з нещодавніми щоденними
  файлами `memory/*.md`. Команди простого чату `/new` і `/reset`
  підтверджуються без виклику моделі.
- `skills.limits.*`:
  компактний список Skills, вставлений у системний промпт.
- `agents.defaults.contextLimits.*`:
  обмежені фрагменти середовища виконання та вставлені блоки, якими володіє середовище виконання.
- `memory.qmd.limits.*`:
  розмір фрагмента індексованого пошуку пам’яті та вставлення.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовою преамбулою першого ходу, що вставляється під час модельних запусків скидання/старту.
Команди простого чату `/new` і `/reset` підтверджують скидання без виклику
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

- `memoryGetMaxChars`: типове обмеження фрагмента `memory_get` перед додаванням
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків `memory_get`, коли `lines`
  пропущено.
- `toolResultMaxChars`: обмеження результату інструмента наживо, що використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: обмеження фрагмента AGENTS.md, що використовується під час вставлення
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

Максимальний розмір у пікселях для найдовшої сторони зображення в блоках зображень стенограми/інструмента перед викликами провайдера.
Типове значення: `1200`.

Нижчі значення зазвичай зменшують використання vision-токенів і розмір корисного навантаження запиту для запусків із великою кількістю знімків екрана.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
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

Формат часу в системному промпті. Типове значення: `auto` (налаштування ОС).

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
  - Об’єктна форма задає основну модель і впорядковані моделі для перемикання в разі збою.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація моделі зору.
  - Також використовується як резервна маршрутизація, коли вибрана/стандартна модель не може приймати вхідні зображення.
  - Надавайте перевагу явним посиланням `provider/model`. Голі ідентифікатори приймаються для сумісності; якщо голий ідентифікатор однозначно відповідає налаштованому запису з підтримкою зображень у `models.providers.*.models`, OpenClaw доповнює його цим провайдером. Неоднозначні налаштовані збіги потребують явного префікса провайдера.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для виводу OpenAI PNG/WebP із прозорим тлом.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо пропущено, `image_generate` усе ще може вивести стандартного провайдера з підтримкою автентифікації. Спершу він пробує поточного стандартного провайдера, а потім решту зареєстрованих провайдерів генерації зображень у порядку ідентифікаторів провайдерів.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо пропущено, `music_generate` усе ще може вивести стандартного провайдера з підтримкою автентифікації. Спершу він пробує поточного стандартного провайдера, а потім решту зареєстрованих провайдерів генерації музики в порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо пропущено, `video_generate` усе ще може вивести стандартного провайдера з підтримкою автентифікації. Спершу він пробує поточного стандартного провайдера, а потім решту зареєстрованих провайдерів генерації відео в порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо пропущено, інструмент PDF відступає до `imageModel`, а потім до розв’язаної моделі сеансу/стандартної моделі.
- `pdfMaxBytesMb`: стандартне обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: стандартна максимальна кількість сторінок, яку враховує резервний режим витягування в інструменті `pdf`.
- `verboseDefault`: стандартний рівень докладності для агентів. Значення: `"off"`, `"on"`, `"full"`. Стандартно: `"off"`.
- `toolProgressDetail`: режим деталізації для підсумків інструментів `/verbose` і рядків чернетки прогресу інструментів. Значення: `"explain"` (стандартно, компактні зрозумілі людині мітки) або `"raw"` (додавати необроблену команду/деталі, коли доступно). `agents.list[].toolProgressDetail` для окремого агента перевизначає це стандартне значення.
- `reasoningDefault`: стандартна видимість міркувань для агентів. Значення: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` для окремого агента перевизначає це стандартне значення. Налаштовані стандартні значення міркувань застосовуються лише для власників, авторизованих відправників або контекстів Gateway адміністратора-оператора, коли не задано перевизначення міркувань для окремого повідомлення або сеансу.
- `elevatedDefault`: стандартний рівень розширеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Стандартно: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ OpenAI або Codex OAuth). Якщо ви пропускаєте провайдера, OpenClaw спершу пробує псевдонім, потім унікальний збіг налаштованого провайдера для точно цього ідентифікатора моделі, і лише після цього відступає до налаштованого стандартного провайдера (застаріла поведінка сумісності, тому надавайте перевагу явному `provider/model`). Якщо цей провайдер більше не надає налаштовану стандартну модель, OpenClaw відступає до першого налаштованого провайдера/моделі замість показу застарілого стандартного значення вилученого провайдера.
- `models`: налаштований каталог моделей і список дозволених для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Використовуйте записи `provider/*`, як-от `"openai-codex/*": {}` або `"vllm/*": {}`, щоб показати всі виявлені моделі для вибраних провайдерів без ручного перелічення кожного ідентифікатора моделі.
  - Безпечні редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи. `config set` відмовляє в замінах, які вилучили б наявні записи списку дозволених, якщо не передати `--replace`.
  - Потоки налаштування/онбордингу в межах провайдера об’єднують вибрані моделі провайдера в цю мапу та зберігають уже налаштованих непов’язаних провайдерів.
  - Для прямих моделей OpenAI Responses серверна Compaction вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити вставлення `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [серверну Compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні стандартні параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет об’єднання `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для окремої моделі), потім `agents.list[].params` (відповідний ідентифікатор агента) перевизначає за ключем. Див. [кешування промптів](/uk/reference/prompt-caching) для деталей.
- `params.extra_body`/`params.extraBody`: розширений наскрізний JSON, що об’єднується в тіла запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, додаткове тіло має перевагу; ненативні маршрути completions усе одно після цього прибирають OpenAI-специфічний `store`.
- `params.chat_template_kwargs`: OpenAI-сумісні аргументи шаблону чату vLLM, що об’єднуються в тіла запитів верхнього рівня `api: "openai-completions"`. Для `vllm/nemotron-3-*` з вимкненим мисленням вбудований Plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані стандартні значення, а `extra_body.chat_template_kwargs` усе одно має остаточний пріоритет. Для керування мисленням Qwen задайте `params.qwenThinkingFormat` як `"chat-template"` або `"top-level"` у цьому записі моделі.
- `compat.thinkingFormat`: OpenAI-сумісний стиль корисного навантаження мислення. Використовуйте `"qwen"` для стилю Qwen з `enable_thinking` верхнього рівня або `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на бекендах сімейства Qwen, які підтримують kwargs шаблону чату на рівні запиту, як-от vLLM. OpenClaw зіставляє вимкнене мислення з `false`, а ввімкнене мислення з `true`.
- `compat.supportedReasoningEfforts`: список зусиль міркування для окремої OpenAI-сумісної моделі. Додайте `"xhigh"` для користувацьких кінцевих точок, які справді його приймають; після цього OpenClaw показує `/think xhigh` у меню команд, рядках сеансів Gateway, валідації патчів сеансу, валідації CLI агента та валідації `llm-task` для цього налаштованого провайдера/моделі. Використовуйте `compat.reasoningEffortMap`, коли бекенду потрібне специфічне для провайдера значення для канонічного рівня.
- `params.preserveThinking`: опція лише для Z.AI, що вмикає збережене мислення. Коли ввімкнено й мислення активне, OpenClaw надсилає `thinking.clear_thinking: false` і повторно відтворює попередній `reasoning_content`; див. [мислення Z.AI і збережене мислення](/uk/providers/zai#thinking-and-preserved-thinking).
- `localService`: необов’язковий менеджер процесів рівня провайдера для локальних/самостійно розміщених серверів моделей. Коли вибрана модель належить цьому провайдеру, OpenClaw перевіряє `healthUrl` (або `baseUrl + "/models"`), запускає `command` з `args`, якщо кінцева точка недоступна, чекає до `readyTimeoutMs`, а потім надсилає запит моделі. `command` має бути абсолютним шляхом. `idleStopMs: 0` тримає процес живим, доки OpenClaw не завершиться; додатне значення зупиняє процес, запущений OpenClaw, після такої кількості мілісекунд простою. Див. [локальні сервіси моделей](/uk/gateway/local-model-services).
- Політика виконання належить провайдерам або моделям, а не `agents.defaults`. Використовуйте `models.providers.<provider>.agentRuntime` для правил на рівні всього провайдера або `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` для правил конкретної моделі. Моделі агентів OpenAI в офіційному провайдері OpenAI стандартно вибирають Codex.
- Записувачі конфігурації, які змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/вилучення резервних моделей), зберігають канонічну об’єктну форму та за можливості зберігають наявні списки резервних моделей.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сеансами (кожен сеанс усе одно серіалізований). Стандартно: 4.

### Політика виконання

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

- `id`: `"auto"`, `"pi"`, ідентифікатор зареєстрованого Plugin harness або підтримуваний псевдонім бекенду CLI. Вбудований Plugin Codex реєструє `codex`; вбудований Plugin Anthropic надає CLI-бекенд `claude-cli`.
- `id: "auto"` дозволяє зареєстрованим Plugin harness заявляти підтримувані ходи та використовує PI, коли жоден harness не збігається. Явне середовище виконання Plugin, як-от `id: "codex"`, потребує цього harness і завершується закритою помилкою, якщо він недоступний або дає збій.
- Ключі виконання для всього агента є застарілими. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, прив’язки середовища виконання сеансу та `OPENCLAW_AGENT_RUNTIME` ігноруються вибором середовища виконання. Запустіть `openclaw doctor --fix`, щоб вилучити застарілі значення.
- Моделі агентів OpenAI стандартно використовують Codex harness; `agentRuntime.id: "codex"` для провайдера/моделі залишається чинним, коли ви хочете зробити це явним.
- Для розгортань Claude CLI надавайте перевагу `model: "anthropic/claude-opus-4-7"` плюс `agentRuntime.id: "claude-cli"` в межах моделі. Застарілі посилання моделей `claude-cli/claude-opus-4-7` усе ще працюють для сумісності, але нова конфігурація має зберігати вибір провайдера/моделі канонічним і розміщувати бекенд виконання в політиці виконання провайдера/моделі.
- Це керує лише виконанням текстового ходу агента. Генерація медіа, зір, PDF, музика, відео та TTS усе ще використовують свої налаштування провайдера/моделі.

**Вбудовані скорочення псевдонімів** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

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

Налаштовані вами псевдоніми завжди мають пріоритет над типовими значеннями.

Моделі Z.AI GLM-4.x автоматично вмикають режим мислення, якщо ви не встановите `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI типово вмикають `tool_stream` для потокового передавання викликів інструментів. Щоб вимкнути це, встановіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`.
Моделі Anthropic Claude 4.6 типово використовують `adaptive` мислення, якщо явний рівень мислення не задано.

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

- CLI-бекенди насамперед орієнтовані на текст; інструменти завжди вимкнено.
- Сесії підтримуються, коли задано `sessionArg`.
- Пряме передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.
- `reseedFromRawTranscriptWhenUncompacted: true` дає бекенду змогу відновлювати безпечні
  недійсні сесії з обмеженого хвоста сирої стенограми OpenClaw до появи першого
  підсумку Compaction. Зміни профілю автентифікації або епохи облікових даних
  усе одно ніколи не використовують повторне засівання сирими даними.

### `agents.defaults.systemPromptOverride`

Замінює весь системний промпт, зібраний OpenClaw, фіксованим рядком. Задайте на рівні типових значень (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із промптами.

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

Незалежні від провайдера накладення промптів, застосовані за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний поведінковий контракт між провайдерами; `personality` керує лише дружнім шаром стилю взаємодії.

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
- `"off"` вимикає лише дружній шар; позначений поведінковий контракт GPT-5 лишається ввімкненим.
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

- `every`: рядок тривалості (ms/s/m/h). Типово: `30m` (автентифікація API-ключем) або `1h` (автентифікація OAuth). Встановіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли `false`, вилучає розділ Heartbeat із системного промпта та пропускає ін’єкцію `HEARTBEAT.md` у bootstrap-контекст. Типово: `true`.
- `suppressToolErrorWarnings`: коли `true`, приглушує попереджувальні payload-и помилок інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для ходу агента Heartbeat перед його перериванням. Залиште незаданим, щоб використовувати `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика доставки direct/DM. `allow` (типово) дозволяє доставку до direct-цілі. `block` приглушує доставку до direct-цілі та видає `reason=dm-blocked`.
- `lightContext`: коли `true`, запуски Heartbeat використовують легкий bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів робочої області.
- `isolatedSession`: коли `true`, кожен Heartbeat запускається у свіжій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як у Cron `sessionTarget: "isolated"`. Зменшує вартість токенів на один Heartbeat із приблизно 100K до приблизно 2-5K токенів.
- `skipWhenBusy`: коли `true`, запуски Heartbeat відкладаються за наявності додаткових зайнятих ліній: роботи субагента або вкладеної команди. Лінії Cron завжди відкладають Heartbeat, навіть без цього прапорця.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, Heartbeat запускають **лише ці агенти**.
- Heartbeat запускає повні ходи агента — коротші інтервали витрачають більше токенів.

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

- `mode`: `default` або `safeguard` (фрагментоване узагальнення для довгих історій). Див. [Compaction](/uk/concepts/compaction).
- `provider`: ідентифікатор зареєстрованого Plugin провайдера Compaction. Коли задано, викликається `summarize()` провайдера замість вбудованого LLM-узагальнення. У разі збою повертається до вбудованого механізму. Задання провайдера примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, перш ніж OpenClaw її перерве. Типово: `900`.
- `keepRecentTokens`: бюджет точки обрізання Pi для збереження найновішого хвоста стенограми дослівно. Ручний `/compact` дотримується цього значення, коли воно явно задане; інакше ручний Compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає на початок вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час узагальнення Compaction.
- `identifierInstructions`: необов’язковий власний текст щодо збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки повтору при некоректно сформованому виводі для підсумків safeguard. Увімкнено типово в режимі safeguard; встановіть `enabled: false`, щоб пропустити аудит.
- `midTurnPrecheck`: необов’язкова перевірка тиску циклу інструментів Pi. Коли `enabled: true`, OpenClaw перевіряє тиск контексту після додавання результатів інструментів і перед наступним викликом моделі. Якщо контекст більше не вміщується, він перериває поточну спробу до надсилання промпта та повторно використовує наявний шлях відновлення попередньої перевірки, щоб обрізати результати інструментів або виконати Compaction і повторити спробу. Працює з режимами Compaction `default` і `safeguard`. Типово: вимкнено.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md для повторної ін’єкції після Compaction. Типово `["Session Startup", "Red Lines"]`; встановіть `[]`, щоб вимкнути повторну ін’єкцію. Коли не задано або явно задано цю типову пару, старіші заголовки `Every Session`/`Safety` також приймаються як застарілий fallback.
- `model`: необов’язкове перевизначення `provider/model-id` лише для узагальнення Compaction. Використовуйте це, коли основна сесія має зберігати одну модель, але підсумки Compaction мають виконуватися на іншій; якщо не задано, Compaction використовує основну модель сесії.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), який запускає звичайний локальний Compaction перед запуском, коли активний JSONL перевищує поріг. Потребує `truncateAfterCompaction`, щоб успішний Compaction міг перейти до меншої наступної стенограми. Вимкнено, коли не задано або `0`.
- `notifyUser`: коли `true`, надсилає користувачу короткі сповіщення, коли Compaction починається і коли завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб Compaction відбувався без повідомлень.
- `memoryFlush`: тихий агентний хід перед автоматичним Compaction для збереження довготривалих спогадів. Задайте `model` як точний провайдер/модель, наприклад `ollama/qwen3:8b`, коли цей службовий хід має лишатися на локальній моделі; перевизначення не успадковує fallback-ланцюг активної сесії. Пропускається, коли робоча область доступна лише для читання.

### `agents.defaults.runRetries`

Межі ітерацій повторних спроб зовнішнього циклу запуску для вбудованого runner-а Pi, щоб запобігти нескінченним циклам виконання під час відновлення після збою. Зауважте, що це налаштування наразі застосовується лише до вбудованого runtime агента, а не до runtime-ів ACP або CLI.

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
- `perProfile`: додаткові ітерації повторних спроб запуску, надані для кожного кандидата fallback-профілю. Типово: `8`.
- `min`: мінімальна абсолютна межа для ітерацій повторних спроб запуску. Типово: `32`.
- `max`: максимальна абсолютна межа для ітерацій повторних спроб запуску, щоб запобігти неконтрольованому виконанню. Типово: `160`.

### `agents.defaults.contextPruning`

Вилучає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

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
- Обрізання спершу м’яко скорочує завеликі результати інструментів, а потім, за потреби, жорстко очищає старіші результати інструментів.

**М’яке скорочення** зберігає початок + кінець і вставляє `...` посередині.

**Жорстке очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не скорочуються й не очищаються.
- Співвідношення обчислюються за символами (приблизно), а не за точною кількістю токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Див. [Обрізання сеансу](/uk/concepts/session-pruning), щоб дізнатися подробиці поведінки.

### Потокова передача блоків

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

- Канали, крім Telegram, потребують явного `*.blockStreaming: true`, щоб увімкнути блокові відповіді.
- Перевизначення каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Signal/Slack/Discord/Google Chat за замовчуванням мають `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоковими відповідями. `natural` = 800–2500ms. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Див. [Потокова передача](/uk/concepts/streaming), щоб дізнатися подробиці поведінки й поділу на фрагменти.

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

- Значення за замовчуванням: `instant` для прямих чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для окремого сеансу: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Індикатори введення](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова ізоляція в пісочниці для вбудованого агента. Див. [Ізоляція в пісочниці](/uk/gateway/sandboxing), щоб прочитати повний посібник.

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

- `docker`: локальне середовище виконання Docker (за замовчуванням)
- `ssh`: універсальне віддалене середовище виконання на базі SSH
- `openshell`: середовище виконання OpenShell

Коли вибрано `backend: "openshell"`, специфічні для середовища виконання налаштування переміщуються до
`plugins.entries.openshell.config`.

**Конфігурація бекенда SSH:**

- `target`: ціль SSH у формі `user@host[:port]`
- `command`: команда клієнта SSH (за замовчуванням: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, який використовується для робочих просторів за областю
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRefs, які OpenClaw матеріалізує в тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на базі SecretRef розв’язуються з активного знімка середовища виконання секретів перед запуском сеансу пісочниці

**Поведінка бекенда SSH:**

- одноразово засіває віддалений робочий простір після створення або повторного створення
- потім підтримує віддалений робочий простір SSH як канонічний
- маршрутизує `exec`, файлові інструменти та медіашляхи через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує контейнери браузера в пісочниці

**Доступ до робочого простору:**

- `none`: робочий простір пісочниці для кожної області в `~/.openclaw/sandboxes`
- `ro`: робочий простір пісочниці в `/workspace`, робочий простір агента змонтовано лише для читання в `/agent`
- `rw`: робочий простір агента змонтовано для читання/запису в `/workspace`

**Область:**

- `session`: контейнер + робочий простір для кожного сеансу
- `agent`: один контейнер + робочий простір на агента (за замовчуванням)
- `shared`: спільний контейнер і робочий простір (без ізоляції між сеансами)

**Конфігурація плагіна OpenShell:**

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

- `mirror`: засіяти віддалене середовище з локального перед exec, синхронізувати назад після exec; локальний робочий простір залишається канонічним
- `remote`: засіяти віддалене середовище один раз під час створення пісочниці, потім підтримувати віддалений робочий простір як канонічний

У режимі `remote` локальні на хості зміни, зроблені поза OpenClaw, не синхронізуються до пісочниці автоматично після кроку засівання.
Транспорт працює через SSH у пісочницю OpenShell, але плагін керує життєвим циклом пісочниці та необов’язковою дзеркальною синхронізацією.

**`setupCommand`** запускається один раз після створення контейнера (через `sh -lc`). Потребує вихідного мережевого доступу, кореня з правами запису та користувача root.

**Контейнери за замовчуванням мають `network: "none"`** — установіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` заблоковано за замовчуванням, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний режим).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки й прив’язки для окремого агента об’єднуються.

**Браузер у пісочниці** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системну підказку. Не потребує `browser.enabled` в `openclaw.json`.
Доступ спостерігача noVNC за замовчуванням використовує автентифікацію VNC, а OpenClaw випускає короткочасний URL із токеном (замість показу пароля у спільному URL).

- `allowHostControl: false` (за замовчуванням) блокує націлювання сеансів у пісочниці на браузер хоста.
- `network` за замовчуванням має значення `openclaw-sandbox-browser` (виділена bridge-мережа). Установлюйте `bridge` лише тоді, коли явно потрібна глобальна bridge-зв’язність.
- `cdpSourceRange` необов’язково обмежує вхідний CDP-доступ на межі контейнера діапазоном CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера пісочниці. Коли задано (зокрема `[]`), воно замінює `docker.binds` для контейнера браузера.
- Значення запуску за замовчуванням визначені в `scripts/sandbox-browser-entrypoint.sh` і налаштовані для контейнерних хостів:
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
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо це потрібно для використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити за допомогою
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    стандартний ліміт процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Значення за замовчуванням є базовими для образу контейнера; використовуйте власний образ браузера з власною
    точкою входу, щоб змінити стандартні значення контейнера.

</Accordion>

Ізоляція браузера в пісочниці та `sandbox.docker.binds` доступні лише для Docker.

Зібрати образи (з вихідного checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Для встановлень npm без вихідного checkout див. [Ізоляція в пісочниці § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup), щоб отримати вбудовані команди `docker build`.

### `agents.list` (перевизначення для окремих агентів)

Use `agents.list[].tts`, щоб надати агенту власного провайдера TTS, голос, модель,
стиль або режим auto-TTS. Блок агента виконує глибоке злиття поверх глобального
`messages.tts`, тож спільні облікові дані можуть залишатися в одному місці, а окремі
агенти перевизначають лише потрібні їм поля голосу або провайдера. Перевизначення
активного агента застосовується до автоматичних голосових відповідей, `/tts audio`, `/tts status` і
агентського інструмента `tts`. Див. [Перетворення тексту на мовлення](/uk/tools/tts#per-agent-voice-overrides)
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
- `default`: коли задано кілька, перший перемагає (записується попередження). Якщо не задано жодного, типовим є перший елемент списку.
- `model`: рядкова форма задає сувору основну модель для агента без резервної моделі; об’єктна форма `{ primary }` також є суворою, якщо не додати `fallbacks`. Використовуйте `{ primary, fallbacks: [...] }`, щоб увімкнути для цього агента резервні моделі, або `{ primary, fallbacks: [] }`, щоб явно задати сувору поведінку. Завдання Cron, які перевизначають лише `primary`, усе одно успадковують типові резервні моделі, якщо не задати `fallbacks: []`.
- `params`: потокові параметри для агента, що зливаються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень, як-от `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `tts`: необов’язкові перевизначення перетворення тексту на мовлення для агента. Блок виконує глибоке злиття поверх `messages.tts`, тож тримайте спільні облікові дані провайдера та політику резервування в `messages.tts`, а тут задавайте лише специфічні для персонажа значення, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий список дозволених skill для агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, коли його задано; явний список замінює типові значення замість злиття, а `[]` означає відсутність skills.
- `thinkingDefault`: необов’язковий типовий рівень мислення для агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для повідомлення або сесії. Вибраний профіль провайдера/моделі контролює, які значення є допустимими; для Google Gemini `adaptive` зберігає динамічне мислення під керуванням провайдера (`thinkingLevel` пропущено для Gemini 3/3.1, `thinkingBudget: -1` для Gemini 2.5).
- `reasoningDefault`: необов’язкова типова видимість міркування для агента (`on | off | stream`). Перевизначає `agents.defaults.reasoningDefault` для цього агента, коли не задано перевизначення міркування для повідомлення або сесії.
- `fastModeDefault`: необов’язкове типове значення для швидкого режиму агента (`true | false`). Застосовується, коли не задано перевизначення швидкого режиму для повідомлення або сесії.
- `models`: необов’язкові перевизначення каталогу моделей/середовища виконання для агента, ключовані повними ідентифікаторами `provider/model`. Використовуйте `models["provider/model"].agentRuntime` для винятків середовища виконання для агента.
- `runtime`: необов’язковий дескриптор середовища виконання для агента. Використовуйте `type: "acp"` з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати сесії ACP harness.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених ідентифікаторів агентів для явних цілей `sessions_spawn.agentId` (`["*"]` = будь-який; типово: лише той самий агент). Додайте ідентифікатор запитувача, коли самоспрямовані виклики `agentId` мають бути дозволені.
- Запобіжник успадкування пісочниці: якщо сесія запитувача працює в пісочниці, `sessions_spawn` відхиляє цілі, які запускалися б без пісочниці.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, що пропускають `agentId` (примушує явний вибір профілю; типово: false).

---

## Маршрутизація кількох агентів

Запускайте кілька ізольованих агентів усередині одного Gateway. Див. [Кілька агентів](/uk/concepts/multi-agent).

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

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній тип типово означає route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; пропущено = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; залежить від каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок зіставлення:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (на весь канал)
6. Типовий агент

У межах кожного рівня перемагає перший відповідний запис `bindings`.

Для записів `type: "acp"` OpenClaw визначає відповідність за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище рівневий порядок route-прив’язок.

### Профілі доступу для агентів

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

Див. [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) для деталей пріоритетності.

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

<Accordion title="Деталі полів сесії">

- **`scope`**: базова стратегія групування сеансів для контекстів групових чатів.
  - `per-sender` (типово): кожен відправник отримує ізольований сеанс у межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують один сеанс (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: спосіб групування особистих повідомлень.
  - `main`: усі особисті повідомлення спільно використовують головний сеанс.
  - `per-peer`: ізолювати за id відправника між каналами.
  - `per-channel-peer`: ізолювати за каналом + відправником (рекомендовано для скриньок вхідних повідомлень із кількома користувачами).
  - `per-account-channel-peer`: ізолювати за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: зіставляє канонічні id з учасниками з префіксом провайдера для спільного використання сеансів між каналами. Команди прив’язування, як-от `/dock_discord`, використовують ту саму мапу, щоб перемкнути маршрут відповіді активного сеансу на іншого пов’язаного учасника каналу; див. [Прив’язування каналів](/uk/concepts/channel-docking).
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва, спрацьовує те, що спливає першим. Актуальність щоденного скидання використовує `sessionStartedAt` рядка сеансу; актуальність скидання за бездіяльністю використовує `lastInteractionAt`. Фонові/системні записи подій, як-от Heartbeat, пробудження Cron, сповіщення exec і службові записи Gateway, можуть оновлювати `updatedAt`, але вони не підтримують актуальність щоденних/бездіяльних сеансів.
- **`resetByType`**: перевизначення для окремих типів (`direct`, `group`, `thread`). Застарілий `dm` приймається як псевдонім для `direct`.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для головного кошика прямих чатів.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів із відповідями між агентами під час обмінів агент-агент (ціле число, діапазон: `0`-`20`, типово: `5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона має пріоритет.
- **`maintenance`**: очищення сховища сеансів + керування збереженням.
  - `mode`: `warn` лише видає попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`). Runtime записує пакетне очищення з невеликим буфером верхньої межі для виробничих лімітів; `openclaw sessions cleanup --enforce` застосовує ліміт негайно.
  - `rotateBytes`: застаріло та ігнорується; `openclaw doctor --fix` видаляє його зі старіших конфігурацій.
  - `resetArchiveRetention`: збереження архівів транскриптів `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; встановіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий бюджет диска для каталогу сеансів. У режимі `warn` він записує попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сеанси.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сеансів, прив’язаних до тредів.
  - `enabled`: головний типовий перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокуса через бездіяльність у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типова жорстка максимальна тривалість у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `spawnSessions`: типовий шлюз для створення робочих сеансів, прив’язаних до тредів, із `sessions_spawn` і породжень тредів ACP. Типово `true`, коли прив’язки тредів увімкнені; провайдери/облікові записи можуть перевизначати.
  - `defaultSpawnContext`: типовий нативний контекст субагента для породжень, прив’язаних до тредів (`"fork"` або `"isolated"`). Типово `"fork"`.

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

Перевизначення для окремих каналів/облікових записів: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Визначення (найконкретніше має пріоритет): обліковий запис → канал → глобальне. `""` вимикає та зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна            | Опис                       | Приклад                     |
| ----------------- | -------------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі       | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера           | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень мислення   | `high`, `low`, `off`        |
| `{identity.name}` | Назва ідентичності агента  | (так само, як `"auto"`)     |

Змінні не чутливі до регістру. `{think}` є псевдонімом для `{thinkingLevel}`.

### Реакція підтвердження

- Типово використовує `identity.emoji` активного агента, інакше `"👀"`. Встановіть `""`, щоб вимкнути.
- Перевизначення для окремих каналів: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервна ідентичність.
- Область: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в каналах, що підтримують реакції, як-от Slack, Discord, Telegram, WhatsApp та iMessage.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord невстановлене значення лишає реакції статусу увімкненими, коли реакції підтвердження активні.
  У Telegram встановіть його явно на `true`, щоб увімкнути реакції статусу життєвого циклу.

### Вхідний debounce

Об’єднує швидкі текстові повідомлення від того самого відправника в один хід агента. Медіа/вкладення скидають буфер негайно. Керівні команди обходять debounce.

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

- `auto` керує типовим режимом auto-TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначити локальні налаштування, а `/tts status` показує ефективний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` увімкнено типово; `modelOverrides.allowProvider` типово дорівнює `false` (потрібне явне увімкнення).
- Ключі API використовують резервні `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані провайдери мовлення належать plugin. Якщо встановлено `plugins.allow`, додайте кожен TTS provider plugin, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий id провайдера `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на кінцеву точку не OpenAI, OpenClaw розглядає її як OpenAI-сумісний TTS-сервер і послаблює перевірку моделі/голосу.

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

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кілька провайдерів режиму розмови.
- Застарілі плоскі ключі режиму розмови (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) існують лише для сумісності. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію у `talk.providers.<provider>`.
- ID голосів використовують резервні `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає рядки відкритим текстом або об’єкти SecretRef.
- Резервний `ELEVENLABS_API_KEY` застосовується лише тоді, коли API-ключ режиму розмови не налаштовано.
- `providers.*.voiceAliases` дозволяє директивам режиму розмови використовувати зрозумілі назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний помічник MLX на macOS. Якщо пропущено, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX на macOS виконується через вбудований помічник `openclaw-mlx-tts`, якщо він наявний, або через виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `consultThinkingLevel` керує рівнем мислення для повного запуску агента OpenClaw за викликами `openclaw_agent_consult` у реальному часі для режиму розмови Control UI. Лишіть невстановленим, щоб зберегти звичайну поведінку сеансу/моделі.
- `consultFastMode` задає одноразове перевизначення швидкого режиму для консультацій у реальному часі режиму розмови Control UI без зміни звичайного налаштування швидкого режиму сеансу.
- `speechLocale` задає id локалі BCP 47, який використовується розпізнаванням мовлення режиму розмови на iOS/macOS. Лишіть невстановленим, щоб використовувати типове значення пристрою.
- `silenceTimeoutMs` керує тим, скільки режим розмови чекає після мовчання користувача перед надсиланням транскрипту. Невстановлене значення зберігає типове вікно паузи платформи (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` додає системні інструкції для провайдера до вбудованого realtime-запиту OpenClaw, тож стиль голосу можна налаштувати без втрати типових інструкцій `openclaw_agent_consult`.

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — типові завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
