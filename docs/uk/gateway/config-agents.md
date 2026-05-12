---
read_when:
    - Налаштування типових параметрів агента (моделі, мислення, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування багатоагентної маршрутизації та прив’язок
    - Налаштування поведінки сеансу, доставки повідомлень і режиму розмови
summary: Типові налаштування агента, маршрутизація між кількома агентами, сеанс, повідомлення та конфігурація розмови
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-05-12T23:30:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08ddc1b36f4b9408ebaa5f071693b1c1333cedc9b00f75df93f12e73081e1033
    source_path: gateway/config-agents.md
    workflow: 16
---

Ключі конфігурації з областю дії агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, Gateway runtime та інших
ключів верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Типові значення агента

### `agents.defaults.workspace`

Типово: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, що показується в рядку Runtime системного промпта. Якщо не задано, OpenClaw автоматично визначає його, піднімаючись угору від робочої області.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий типовий allowlist Skills для агентів, які не задають
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

- Пропустіть `agents.defaults.skills`, щоб типово дозволити Skills без обмежень.
- Пропустіть `agents.list[].skills`, щоб успадкувати типові значення.
- Установіть `agents.list[].skills: []`, щоб не мати Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів робочої області (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Пропускає створення вибраних необов’язкових файлів робочої області, водночас усе ще записуючи обов’язкові bootstrap-файли. Допустимі значення: `SOUL.md`, `USER.md`, `HEARTBEAT.md` і `IDENTITY.md`.

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

Керує тим, коли bootstrap-файли робочої області вставляються в системний промпт. Типово: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторне вставлення bootstrap-файлів робочої області, зменшуючи розмір промпта. Запуски Heartbeat і повторні спроби після Compaction усе ще перебудовують контекст.
- `"never"`: вимикає вставлення bootstrap-файлів робочої області та контекстних файлів на кожному ході. Використовуйте це лише для агентів, які повністю керують власним життєвим циклом промпта (власні контекстні рушії, нативні runtime, що будують власний контекст, або спеціалізовані робочі процеси без bootstrap). Ходи Heartbeat і відновлення після Compaction також пропускають вставлення.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на bootstrap-файл робочої області перед обрізанням. Типово: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, вставлена з усіх bootstrap-файлів робочої області. Типово: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента системним сповіщенням у промпті, коли bootstrap-контекст обрізано.
Типово: `"once"`.

- `"off"`: ніколи не вставляти текст сповіщення про обрізання в системний промпт.
- `"once"`: вставити стислий текст сповіщення один раз для кожного унікального підпису обрізання (рекомендовано).
- `"always"`: вставляти стислий текст сповіщення під час кожного запуску, коли є обрізання.

Детальні сирі/вставлені лічильники та поля налаштування конфігурації залишаються в діагностиці,
як-от звіти про контекст/стан і журнали; звичайний користувацький/runtime-контекст WebChat отримує лише
стисле сповіщення про відновлення.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта відповідальності за бюджет контексту

OpenClaw має кілька високовитратних бюджетів промпта/контексту, і вони
навмисно розділені за підсистемами, а не всі проходять через один загальний
регулятор.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне вставлення bootstrap-файлів робочої області.
- `agents.defaults.startupContext.*`:
  одноразовий вступ для модельного запуску після reset/startup, включно з нещодавніми щоденними
  файлами `memory/*.md`. Команди чату без аргументів `/new` і `/reset`
  підтверджуються без виклику моделі.
- `skills.limits.*`:
  компактний список Skills, вставлений у системний промпт.
- `agents.defaults.contextLimits.*`:
  обмежені runtime-уривки та вставлені блоки, що належать runtime.
- `memory.qmd.limits.*`:
  розмір фрагмента індексованого пошуку в пам’яті та вставлення.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує вступом першого ходу під час запуску, який вставляється в модельні запуски reset/startup.
Команди чату без аргументів `/new` і `/reset` підтверджують скидання без виклику
моделі, тому вони не завантажують цей вступ.

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
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: типова межа уривка `memory_get` перед додаванням
  метаданих обрізання та сповіщення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків `memory_get`, коли `lines`
  пропущено.
- `toolResultMaxChars`: межа результатів live-інструментів, що використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: межа уривка AGENTS.md, що використовується під час вставлення
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

Глобальна межа для компактного списку Skills, вставленого в системний промпт. Це
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

Максимальний розмір у пікселях для найдовшого боку зображення в блоках зображень транскрипта/інструмента перед викликами провайдера.
Типово: `1200`.

Нижчі значення зазвичай зменшують використання vision-токенів і розмір payload запиту для запусків із великою кількістю скриншотів.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного промпта (не для часових позначок повідомлень). Повертається до часового поясу хоста.

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
  - Об’єктна форма задає основну модель і впорядковані моделі аварійного перемикання.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація моделі зору.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати вхідні зображення.
  - Надавайте перевагу явним посиланням `provider/model`. Голі ідентифікатори приймаються для сумісності; якщо голий ідентифікатор унікально збігається з налаштованим записом, здатним працювати із зображеннями, у `models.providers.*.models`, OpenClaw доповнює його цим постачальником. Неоднозначні налаштовані збіги потребують явного префікса постачальника.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для виводу OpenAI PNG/WebP з прозорим тлом.
  - Якщо ви вибираєте постачальника/модель напряму, також налаштуйте відповідну автентифікацію постачальника (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо опущено, `image_generate` все ще може визначити типового постачальника з підтриманою автентифікацією. Спершу він пробує поточного типового постачальника, потім решту зареєстрованих постачальників генерації зображень у порядку ідентифікаторів постачальників.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо опущено, `music_generate` все ще може визначити типового постачальника з підтриманою автентифікацією. Спершу він пробує поточного типового постачальника, потім решту зареєстрованих постачальників генерації музики у порядку ідентифікаторів постачальників.
  - Якщо ви вибираєте постачальника/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ постачальника.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо опущено, `video_generate` все ще може визначити типового постачальника з підтриманою автентифікацією. Спершу він пробує поточного типового постачальника, потім решту зареєстрованих постачальників генерації відео у порядку ідентифікаторів постачальників.
  - Якщо ви вибираєте постачальника/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ постачальника.
  - Вбудований постачальник генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд, а також параметри рівня постачальника `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо опущено, інструмент PDF повертається до `imageModel`, а потім до розв’язаної моделі сеансу/типової моделі.
- `pdfMaxBytesMb`: типове обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, які враховуються режимом резервного витягнення в інструменті `pdf`.
- `verboseDefault`: типовий рівень докладності для агентів. Значення: `"off"`, `"on"`, `"full"`. Типово: `"off"`.
- `toolProgressDetail`: режим деталізації для підсумків інструментів `/verbose` і рядків інструментів у чернетках прогресу. Значення: `"explain"` (типово, компактні людські мітки) або `"raw"` (додає необроблену команду/деталі, коли доступно). `agents.list[].toolProgressDetail` для окремого агента перевизначає це типове значення.
- `reasoningDefault`: типова видимість міркувань для агентів. Значення: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` для окремого агента перевизначає це типове значення. Налаштовані типові значення міркувань застосовуються лише для власників, авторизованих відправників або контекстів gateway адміністратора-оператора, коли не задано перевизначення міркувань для окремого повідомлення чи сеансу.
- `elevatedDefault`: типовий рівень підвищеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типово: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ OpenAI або Codex OAuth). Якщо ви опускаєте постачальника, OpenClaw спершу пробує alias, потім унікальний збіг налаштованого постачальника для цього точного ідентифікатора моделі, і лише після цього повертається до налаштованого типового постачальника (застаріла поведінка сумісності, тож надавайте перевагу явному `provider/model`). Якщо цей постачальник більше не надає налаштовану типову модель, OpenClaw повертається до першого налаштованого постачальника/моделі замість показу застарілого типового значення вилученого постачальника.
- `models`: налаштований каталог моделей і список дозволених для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для постачальника, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Використовуйте записи `provider/*`, як-от `"openai-codex/*": {}` або `"vllm/*": {}`, щоб показати всі виявлені моделі для вибраних постачальників без ручного переліку кожного ідентифікатора моделі.
  - Безпечні редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи. `config set` відхиляє заміни, які вилучили б наявні записи списку дозволених, якщо ви не передасте `--replace`.
  - Потоки налаштування/онбордингу в межах постачальника об’єднують вибрані моделі постачальника в цю мапу й зберігають не пов’язаних із ними вже налаштованих постачальників.
  - Для прямих моделей OpenAI Responses серверна Compaction вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити вставлення `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [серверну Compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні типові параметри постачальника, застосовані до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна основа) перевизначається `agents.defaults.models["provider/model"].params` (для окремої моделі), а потім `agents.list[].params` (для відповідного ідентифікатора агента) перевизначає за ключем. Докладніше див. [кешування підказок](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений наскрізний JSON, що зливається в тіла запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, додаткове тіло має пріоритет; ненативні маршрути completions після цього все одно вилучають `store`, специфічний лише для OpenAI.
- `params.chat_template_kwargs`: OpenAI-сумісні аргументи шаблону чату vLLM, що зливаються у верхній рівень тіл запитів `api: "openai-completions"`. Для `vllm/nemotron-3-*` з вимкненим мисленням вбудований Plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані типові значення, а `extra_body.chat_template_kwargs` усе ще має остаточний пріоритет. Для елементів керування мисленням vLLM Qwen задайте `params.qwenThinkingFormat` як `"chat-template"` або `"top-level"` у цьому записі моделі.
- `compat.thinkingFormat`: OpenAI-сумісний стиль корисного навантаження мислення. Використовуйте `"qwen"` для верхньорівневого `enable_thinking` у стилі Qwen або `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на бекендах родини Qwen, які підтримують kwargs шаблону чату рівня запиту, наприклад vLLM. OpenClaw зіставляє вимкнене мислення з `false`, а ввімкнене мислення з `true`.
- `compat.supportedReasoningEfforts`: список OpenAI-сумісних зусиль міркування для окремої моделі. Додайте `"xhigh"` для власних кінцевих точок, які справді його приймають; після цього OpenClaw показує `/think xhigh` у меню команд, рядках сеансів Gateway, перевірці патчів сеансу, перевірці CLI агента та перевірці `llm-task` для цього налаштованого постачальника/моделі. Використовуйте `compat.reasoningEffortMap`, коли бекенду потрібне специфічне для постачальника значення для канонічного рівня.
- `params.preserveThinking`: згода лише для Z.AI на збережене мислення. Коли ввімкнено і мислення активне, OpenClaw надсилає `thinking.clear_thinking: false` і відтворює попередній `reasoning_content`; див. [мислення Z.AI і збережене мислення](/uk/providers/zai#thinking-and-preserved-thinking).
- `localService`: необов’язковий менеджер процесів рівня постачальника для локальних/самостійно розміщених серверів моделей. Коли вибрана модель належить цьому постачальнику, OpenClaw перевіряє `healthUrl` (або `baseUrl + "/models"`), запускає `command` з `args`, якщо кінцева точка недоступна, чекає до `readyTimeoutMs`, а потім надсилає запит моделі. `command` має бути абсолютним шляхом. `idleStopMs: 0` залишає процес живим до виходу OpenClaw; додатне значення зупиняє процес, запущений OpenClaw, після такої кількості мілісекунд простою. Див. [локальні сервіси моделей](/uk/gateway/local-model-services).
- Політика виконання належить постачальникам або моделям, а не `agents.defaults`. Використовуйте `models.providers.<provider>.agentRuntime` для правил на рівні всього постачальника або `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` для правил, специфічних для моделі. Моделі агентів OpenAI в офіційному постачальнику OpenAI типово вибирають Codex.
- Записувачі конфігурації, які змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/вилучення резервних варіантів), зберігають канонічну об’єктну форму та за можливості зберігають наявні списки резервних варіантів.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сеансами (кожен сеанс усе ще серіалізований). Типово: 4.

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

- `id`: `"auto"`, `"pi"`, зареєстрований ідентифікатор обгортки Plugin або підтримуваний alias бекенду CLI. Вбудований Plugin Codex реєструє `codex`; вбудований Plugin Anthropic надає CLI-бекенд `claude-cli`.
- `id: "auto"` дозволяє зареєстрованим обгорткам Plugin приймати підтримувані ходи та використовує PI, коли жодна обгортка не збігається. Явне виконання Plugin, як-от `id: "codex"`, вимагає цю обгортку й завершується закритою помилкою, якщо вона недоступна або завершується збоєм.
- Ключі виконання на рівні всього агента є застарілими. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, закріплення виконання сеансу та `OPENCLAW_AGENT_RUNTIME` ігноруються під час вибору виконання. Запустіть `openclaw doctor --fix`, щоб вилучити застарілі значення.
- Моделі агентів OpenAI типово використовують обгортку Codex; `agentRuntime.id: "codex"` для постачальника/моделі лишається чинним, коли ви хочете вказати це явно.
- Для розгортань Claude CLI надавайте перевагу `model: "anthropic/claude-opus-4-7"` плюс `agentRuntime.id: "claude-cli"` у межах моделі. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` усе ще працюють для сумісності, але нова конфігурація має зберігати канонічний вибір постачальника/моделі та розміщувати бекенд виконання в політиці виконання постачальника/моделі.
- Це керує лише виконанням текстових ходів агента. Генерація медіа, зір, PDF, музика, відео і TTS усе ще використовують свої налаштування постачальника/моделі.

**Вбудовані скорочення alias** (застосовуються лише коли модель є в `agents.defaults.models`):

| Псевдонім           | Модель                                  |
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

Моделі Z.AI GLM-4.x автоматично вмикають режим мислення, якщо ви не задасте `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI типово вмикають `tool_stream` для потокового передавання викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Моделі Anthropic Claude 4.6 типово використовують мислення `adaptive`, коли явний рівень мислення не задано.

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

- CLI-бекенди орієнтовані на текст; інструменти завжди вимкнено.
- Сесії підтримуються, коли задано `sessionArg`.
- Наскрізне передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.
- `reseedFromRawTranscriptWhenUncompacted: true` дає бекенду змогу відновити безпечні
  недійсні сесії з обмеженого хвоста сирого транскрипту OpenClaw до появи
  першого підсумку Compaction. Зміни профілю автентифікації або епохи облікових даних
  усе одно ніколи не виконують raw-reseed.

### `agents.defaults.systemPromptOverride`

Замінює весь системний промпт, зібраний OpenClaw, фіксованим рядком. Задається на рівні типових значень (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення окремого агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із промптами.

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

Незалежні від провайдера накладення промптів, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки між провайдерами; `personality` керує лише шаром дружнього стилю взаємодії.

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

- `"friendly"` (типово) і `"on"` вмикають шар дружнього стилю взаємодії.
- `"off"` вимикає лише дружній шар; позначений контракт поведінки GPT-5 лишається ввімкненим.
- Застаріле `plugins.entries.openai.config.personality` усе ще читається, коли це спільне налаштування не задано.

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

- `every`: рядок тривалості (ms/s/m/h). Типово: `30m` (автентифікація API-ключем) або `1h` (автентифікація OAuth). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли false, вилучає розділ Heartbeat із системного промпту та пропускає ін’єкцію `HEARTBEAT.md` у bootstrap-контекст. Типово: `true`.
- `suppressToolErrorWarnings`: коли true, пригнічує попереджувальні payload-и про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для ходу агента Heartbeat перед його перериванням. Лишіть незаданим, щоб використовувати `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика доставлення напряму/DM. `allow` (типово) дозволяє доставлення до прямої цілі. `block` пригнічує доставлення до прямої цілі та видає `reason=dm-blocked`.
- `lightContext`: коли true, запуски Heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів робочого простору.
- `isolatedSession`: коли true, кожен Heartbeat запускається у свіжій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як у cron `sessionTarget: "isolated"`. Зменшує витрати токенів на кожен Heartbeat приблизно зі 100K до 2-5K токенів.
- `skipWhenBusy`: коли true, запуски Heartbeat відкладаються на додаткових зайнятих lane-ах цього агента: його власній session-keyed роботі субагента або вкладених команд. Lane-и Cron завжди відкладають Heartbeat, навіть без цього прапорця.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, **лише ці агенти** запускають Heartbeat.
- Heartbeat запускають повні ходи агента — коротші інтервали витрачають більше токенів.

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
- `provider`: ідентифікатор зареєстрованого провайдера Plugin для Compaction. Коли задано, викликається `summarize()` провайдера замість вбудованого LLM-узагальнення. У разі збою повертається до вбудованого механізму. Задання провайдера примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, перш ніж OpenClaw перерве її. Типово: `900`.
- `keepRecentTokens`: бюджет Pi для точки відсікання, щоб зберегти найновіший хвіст транскрипту дослівно. Ручний `/compact` враховує це, коли значення явно задано; інакше ручна Compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає на початок вбудовані інструкції зі збереження непрозорих ідентифікаторів під час узагальнення Compaction.
- `identifierInstructions`: необов’язковий власний текст про збереження ідентифікаторів, що використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повтором у разі некоректно сформованого виводу для підсумків safeguard. Увімкнено типово в режимі safeguard; задайте `enabled: false`, щоб пропустити аудит.
- `midTurnPrecheck`: необов’язкова перевірка тиску tool-loop Pi. Коли `enabled: true`, OpenClaw перевіряє тиск контексту після додавання результатів інструментів і перед наступним викликом моделі. Якщо контекст більше не вміщується, він перериває поточну спробу до надсилання промпту та повторно використовує наявний шлях відновлення precheck, щоб обрізати результати інструментів або виконати Compaction і повторити спробу. Працює з обома режимами Compaction: `default` і `safeguard`. Типово: вимкнено.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md для повторної ін’єкції після Compaction. Типово `["Session Startup", "Red Lines"]`; задайте `[]`, щоб вимкнути повторну ін’єкцію. Коли не задано або явно задано цю типову пару, старіші заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов’язкове перевизначення `provider/model-id` лише для узагальнення Compaction. Використовуйте це, коли основна сесія має лишатися на одній моделі, а підсумки Compaction мають виконуватися на іншій; коли не задано, Compaction використовує основну модель сесії.
- `maxActiveTranscriptBytes`: необов’язковий байтовий поріг (`number` або рядки на кшталт `"20mb"`), який запускає звичайну локальну Compaction перед запуском, коли активний JSONL перевищує поріг. Потребує `truncateAfterCompaction`, щоб успішна Compaction могла перейти до меншого наступного транскрипту. Вимкнено, коли не задано або `0`.
- `notifyUser`: коли `true`, надсилає користувачу короткі сповіщення, коли Compaction починається і коли завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб Compaction лишалася тихою.
- `memoryFlush`: тихий агентний хід перед авто-Compaction для збереження довготривалих спогадів. Задайте `model` як точний провайдер/модель, наприклад `ollama/qwen3:8b`, коли цей службовий хід має лишатися на локальній моделі; перевизначення не успадковує ланцюжок резервних варіантів активної сесії. Пропускається, коли робочий простір доступний лише для читання.

### `agents.defaults.runRetries`

Зовнішні межі ітерацій повторів циклу запуску для вбудованого runner-а Pi, щоб запобігти нескінченним циклам виконання під час відновлення після збою. Зверніть увагу, що це налаштування наразі застосовується лише до вбудованого runtime агента, а не до runtime ACP або CLI.

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

- `base`: базова кількість ітерацій повтору запуску для зовнішнього циклу запуску. Типово: `24`.
- `perProfile`: додаткові ітерації повтору запуску, що надаються для кожного кандидата резервного профілю. Типово: `8`.
- `min`: мінімальна абсолютна межа для ітерацій повтору запуску. Типово: `32`.
- `max`: максимальна абсолютна межа для ітерацій повтору запуску, щоб запобігти неконтрольованому виконанню. Типово: `160`.

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

<Accordion title="поведінка режиму cache-ttl">

- `mode: "cache-ttl"` вмикає проходи обрізання.
- `ttl` керує тим, як часто обрізання може запускатися знову (після останнього звернення до кешу).
- Обрізання спочатку м’яко скорочує завеликі результати інструментів, а потім, за потреби, повністю очищає старіші результати інструментів.

**М’яке скорочення** зберігає початок + кінець і вставляє `...` посередині.

**Повне очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не скорочуються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Див. [Обрізання сесії](/uk/concepts/session-pruning), щоб дізнатися подробиці поведінки.

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

- Канали, крім Telegram, потребують явного `*.blockStreaming: true`, щоб увімкнути блокові відповіді.
- Перевизначення каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Signal/Slack/Discord/Google Chat за замовчуванням використовують `minChars: 1500`.
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
- Перевизначення для окремої сесії: `session.typingMode`, `session.typingIntervalSeconds`.

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

<Accordion title="Подробиці ізоляції">

**Бекенд:**

- `docker`: локальне середовище виконання Docker (за замовчуванням)
- `ssh`: універсальне віддалене середовище виконання на основі SSH
- `openshell`: середовище виконання OpenShell

Коли вибрано `backend: "openshell"`, специфічні для середовища виконання налаштування переходять до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенду:**

- `target`: ціль SSH у форматі `user@host[:port]`
- `command`: команда клієнта SSH (за замовчуванням: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, який використовується для робочих просторів за областями
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRefs, які OpenClaw матеріалізує в тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: перемикачі політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef розв’язуються з активного знімка середовища виконання секретів перед запуском sandbox-сесії

**Поведінка SSH-бекенду:**

- одноразово засіває віддалений робочий простір після створення або повторного створення
- потім зберігає віддалений робочий простір SSH канонічним
- маршрутизує `exec`, файлові інструменти та медіашляхи через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує sandbox-контейнери браузера

**Доступ до робочого простору:**

- `none`: sandbox-робочий простір за областю в `~/.openclaw/sandboxes`
- `ro`: sandbox-робочий простір у `/workspace`, робочий простір агента змонтовано лише для читання в `/agent`
- `rw`: робочий простір агента змонтовано для читання/запису в `/workspace`

**Область:**

- `session`: контейнер + робочий простір для кожної сесії
- `agent`: один контейнер + робочий простір на агента (за замовчуванням)
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

- `mirror`: засіяти віддалене середовище з локального перед exec, синхронізувати назад після exec; локальний робочий простір залишається канонічним
- `remote`: засіяти віддалене середовище один раз під час створення sandbox, потім зберігати віддалений робочий простір канонічним

У режимі `remote` локальні на хості зміни, зроблені поза OpenClaw, не синхронізуються в sandbox автоматично після етапу засівання.
Транспортом є SSH до sandbox OpenShell, але plugin керує життєвим циклом sandbox і необов’язковою дзеркальною синхронізацією.

**`setupCommand`** запускається один раз після створення контейнера (через `sh -lc`). Потребує мережевого виходу, кореневої файлової системи з правом запису та root-користувача.

**Контейнери за замовчуванням використовують `network: "none"`** — установіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` заблоковано за замовчуванням, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний режим).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки для окремих агентів об’єднуються.

**Ізольований браузер** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системний промпт. Не потребує `browser.enabled` в `openclaw.json`.
Доступ спостерігача noVNC за замовчуванням використовує автентифікацію VNC, а OpenClaw видає короткочасний URL із токеном (замість розкриття пароля у спільному URL).

- `allowHostControl: false` (за замовчуванням) блокує sandbox-сесії від націлювання на браузер хоста.
- `network` за замовчуванням дорівнює `openclaw-sandbox-browser` (виділена bridge-мережа). Установлюйте `bridge` лише тоді, коли явно потрібне глобальне bridge-підключення.
- `cdpSourceRange` необов’язково обмежує вхід CDP на межі контейнера до CIDR-діапазону (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер sandbox-браузера. Якщо задано (зокрема `[]`), воно замінює `docker.binds` для контейнера браузера.
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
    увімкнені за замовчуванням і можуть бути вимкнені за допомогою
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` повторно вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити за допомогою
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    типове обмеження процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовими для образу контейнера; використовуйте власний образ браузера з власною
    точкою входу, щоб змінити типові значення контейнера.

</Accordion>

Ізоляція браузера та `sandbox.docker.binds` доступні лише для Docker.

Збірка образів (із checkout вихідного коду):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Для встановлень npm без checkout вихідного коду див. [Ізоляція § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) щодо вбудованих команд `docker build`.

### `agents.list` (перевизначення для окремих агентів)

Використовуйте `agents.list[].tts`, щоб надати агенту власного провайдера TTS, голос, модель,
стиль або режим auto-TTS. Блок агента глибоко об’єднується поверх глобального
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
- `default`: якщо задано кілька, перший має перевагу (записується попередження). Якщо не задано жодного, типовим буде перший запис у списку.
- `model`: рядкова форма задає сувору основну модель для агента без резервної моделі; об’єктна форма `{ primary }` також є суворою, якщо не додати `fallbacks`. Використовуйте `{ primary, fallbacks: [...] }`, щоб увімкнути для цього агента резервну модель, або `{ primary, fallbacks: [] }`, щоб явно задати сувору поведінку. Завдання Cron, які перевизначають лише `primary`, усе одно успадковують типові резервні моделі, якщо не задати `fallbacks: []`.
- `params`: потокові параметри для агента, об’єднані поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень, як-от `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `tts`: необов’язкові перевизначення перетворення тексту на мовлення для агента. Блок глибоко об’єднується поверх `messages.tts`, тож тримайте спільні облікові дані провайдера й політику резервування в `messages.tts`, а тут задавайте лише специфічні для персони значення, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий allowlist Skills для агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, коли це задано; явний список замінює типові значення замість об’єднання, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень мислення для агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для повідомлення або сесії. Вибраний профіль провайдера/моделі визначає, які значення є припустимими; для Google Gemini `adaptive` зберігає динамічне мислення, кероване провайдером (`thinkingLevel` пропущено на Gemini 3/3.1, `thinkingBudget: -1` на Gemini 2.5).
- `reasoningDefault`: необов’язкова типова видимість міркування для агента (`on | off | stream`). Перевизначає `agents.defaults.reasoningDefault` для цього агента, коли не задано перевизначення міркування для повідомлення або сесії.
- `fastModeDefault`: необов’язкове типове значення fast mode для агента (`true | false`). Застосовується, коли не задано перевизначення fast-mode для повідомлення або сесії.
- `models`: необов’язкові перевизначення каталогу моделей/середовища виконання для агента, індексовані повними ідентифікаторами `provider/model`. Використовуйте `models["provider/model"].agentRuntime` для винятків середовища виконання конкретного агента.
- `runtime`: необов’язковий дескриптор середовища виконання для агента. Використовуйте `type: "acp"` із типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати сесії ACP harness.
- `identity.avatar`: шлях відносно робочого простору, `http(s)` URL або `data:` URI.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: allowlist ідентифікаторів агентів для явних цілей `sessions_spawn.agentId` (`["*"]` = будь-який; типово: лише той самий агент). Додайте ідентифікатор запитувача, коли самонацілені виклики `agentId` мають бути дозволені.
- Запобіжник успадкування пісочниці: якщо сесія запитувача працює в пісочниці, `sessions_spawn` відхиляє цілі, які запускалися б без пісочниці.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, що пропускають `agentId` (примушує явний вибір профілю; типово: false).

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

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній тип типово означає route), `acp` для сталих прив’язок розмов ACP.
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
5. `match.accountId: "*"` (для всього каналу)
6. Типовий агент

У межах кожного рівня перший відповідний запис `bindings` має перевагу.

Для записів `type: "acp"` OpenClaw розв’язує за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище рівневий порядок прив’язок маршруту.

### Профілі доступу для агента

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

Див. [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools), щоб дізнатися про деталі пріоритетності.

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

<Accordion title="Session field details">

- **`scope`**: базова стратегія групування сеансів для контекстів групового чату.
  - `per-sender` (типово): кожен відправник отримує ізольований сеанс у межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують один сеанс (використовуйте лише коли потрібен спільний контекст).
- **`dmScope`**: як групуються приватні повідомлення.
  - `main`: усі приватні повідомлення використовують спільний основний сеанс.
  - `per-peer`: ізоляція за ідентифікатором відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для багатокористувацьких скриньок).
  - `per-account-channel-peer`: ізоляція за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: зіставляє канонічні ідентифікатори з peers із префіксом постачальника для спільного використання сеансів між каналами. Команди dock, такі як `/dock_discord`, використовують ту саму мапу, щоб перемкнути маршрут відповіді активного сеансу на інший пов’язаний peer каналу; див. [Стикування каналів](/uk/concepts/channel-docking).
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за локальним часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва варіанти, спрацьовує той, термін якого минає першим. Свіжість щоденного скидання використовує `sessionStartedAt` рядка сеансу; свіжість скидання за простоєм використовує `lastInteractionAt`. Фонові/системні записи подій, як-от heartbeat, пробудження cron, сповіщення exec і службові записи gateway, можуть оновлювати `updatedAt`, але не підтримують свіжість щоденних/idle-сеансів.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як псевдонім для `direct`.
- **`mainKey`**: застаріле поле. Під час виконання завжди використовується `"main"` для основного кошика прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів-відповідей між агентами під час обмінів agent-to-agent (ціле число, діапазон: `0`-`20`, типово: `5`). `0` вимикає ping-pong-ланцюжок.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перше правило deny перемагає.
- **`maintenance`**: очищення сховища сеансів + налаштування збереження.
  - `mode`: `warn` лише видає попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`). Під час виконання пакетне очищення записується з невеликим high-water-буфером для production-обмежень; `openclaw sessions cleanup --enforce` застосовує обмеження негайно.
  - `rotateBytes`: застаріле й ігнорується; `openclaw doctor --fix` видаляє його зі старіших конфігурацій.
  - `resetArchiveRetention`: збереження архівів транскриптів `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; встановіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий дисковий бюджет каталогу сеансів. У режимі `warn` він записує попередження в журнал; у режимі `enforce` спочатку видаляє найстаріші артефакти/сеанси.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сеансів, прив’язаних до гілок.
  - `enabled`: головний типовий перемикач (постачальники можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокуса після неактивності в годинах (`0` вимикає; постачальники можуть перевизначати)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; постачальники можуть перевизначати)
  - `spawnSessions`: типовий gate для створення робочих сеансів, прив’язаних до гілок, із `sessions_spawn` і ACP thread spawns. Типово `true`, коли thread bindings увімкнені; постачальники/облікові записи можуть перевизначати.
  - `defaultSpawnContext`: типовий native-контекст subagent для spawns, прив’язаних до гілок (`"fork"` або `"isolated"`). Типово `"fork"`.

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

Визначення (перемагає найточніше): обліковий запис → канал → глобальне. `""` вимикає і зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна            | Опис                       | Приклад                     |
| ----------------- | -------------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі       | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва постачальника        | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень мислення   | `high`, `low`, `off`        |
| `{identity.name}` | Ім’я ідентичності агента   | (те саме, що `"auto"`)      |

Змінні не чутливі до регістру. `{think}` є псевдонімом для `{thinkingLevel}`.

### Ack-реакція

- Типово використовує `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналів: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → fallback ідентичності.
- Область: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє ack після відповіді в каналах із підтримкою реакцій, таких як Slack, Discord, Telegram, WhatsApp та iMessage.
- `messages.statusReactions.enabled`: вмикає статусні реакції життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord unset залишає статусні реакції ввімкненими, коли ack-реакції активні.
  У Telegram явно встановіть `true`, щоб увімкнути статусні реакції життєвого циклу.

### Debounce вхідних повідомлень

Об’єднує швидкі текстові повідомлення від одного відправника в один хід агента. Медіа/вкладення надсилаються негайно. Керівні команди обходять debouncing.

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

- `auto` керує типовим автоматичним режимом TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує ефективний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного зведення.
- `modelOverrides` увімкнено типово; `modelOverrides.allowProvider` типово дорівнює `false` (opt-in).
- API-ключі fallback до `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані постачальники мовлення належать Plugin. Якщо встановлено `plugins.allow`, включіть кожен TTS provider Plugin, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий ідентифікатор постачальника `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на endpoint, що не належить OpenAI, OpenClaw трактує його як TTS-сервер, сумісний з OpenAI, і послаблює перевірку моделі/голосу.

---

## Talk

Типові значення для режиму Talk (macOS/iOS/Android).

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

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кілька постачальників Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) залишені лише для сумісності. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію в `talk.providers.<provider>`.
- Voice IDs fallback до `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає plaintext-рядки або об’єкти SecretRef.
- Fallback `ELEVENLABS_API_KEY` застосовується лише коли не налаштовано API-ключ Talk.
- `providers.*.voiceAliases` дає змогу директивам Talk використовувати зручні назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний macOS MLX helper. Якщо пропущено, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення macOS MLX проходить через вбудований helper `openclaw-mlx-tts`, коли він доступний, або через виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях helper для розробки.
- `consultThinkingLevel` керує рівнем мислення для повного запуску агента OpenClaw за викликами Control UI Talk realtime `openclaw_agent_consult`. Залиште unset, щоб зберегти звичайну поведінку сеансу/моделі.
- `consultFastMode` встановлює одноразове перевизначення fast-mode для realtime-консультацій Control UI Talk без зміни звичайного налаштування fast-mode сеансу.
- `speechLocale` задає ідентифікатор locale BCP 47, який використовується розпізнаванням мовлення iOS/macOS Talk. Залиште unset, щоб використовувати типове значення пристрою.
- `silenceTimeoutMs` керує тим, як довго режим Talk чекає після тиші користувача, перш ніж надіслати transcript. Unset зберігає типове вікно паузи платформи (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` додає системні інструкції для постачальника до вбудованого realtime prompt OpenClaw, щоб стиль голосу можна було налаштувати без втрати типових настанов `openclaw_agent_consult`.

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
