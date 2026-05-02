---
read_when:
    - Налаштування типових параметрів агента (моделі, мислення, робоча область, Heartbeat, медіа, Skills)
    - Налаштування мультиагентної маршрутизації та прив’язок
    - Налаштування сеансу, доставки повідомлень і поведінки режиму розмови
summary: Стандартні налаштування агента, багатоагентна маршрутизація, конфігурація сеансу, повідомлень і спілкування
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-05-02T06:09:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559bb427555768c91720bac10ee60bf2ba5a081117b741a02c140b14267ce1bf
    source_path: gateway/config-agents.md
    workflow: 16
---

Ключі конфігурації з областю дії агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Типові параметри агентів

### `agents.defaults.workspace`

Типове значення: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, що показується в рядку Runtime системного промпта. Якщо не задано, OpenClaw автоматично виявляє його, рухаючись угору від робочої області.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий типовий список дозволених skills для агентів, які не задають
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

- Не вказуйте `agents.defaults.skills`, щоб skills типово були необмежені.
- Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
- Задайте `agents.list[].skills: []`, щоб не було skills.
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

Пропускає створення вибраних необов’язкових файлів робочої області, водночас записуючи обов’язкові bootstrap-файли. Допустимі значення: `SOUL.md`, `USER.md`, `HEARTBEAT.md` і `IDENTITY.md`.

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

Керує тим, коли bootstrap-файли робочої області вставляються в системний промпт. Типове значення: `"always"`.

- `"continuation-skip"`: безпечні продовжувальні ходи (після завершеної відповіді асистента) пропускають повторне вставлення bootstrap робочої області, зменшуючи розмір промпта. Запуски Heartbeat і повторні спроби після Compaction все одно перебудовують контекст.
- `"never"`: вимикає bootstrap робочої області та вставлення контекстних файлів на кожному ході. Використовуйте це лише для агентів, які повністю керують життєвим циклом свого промпта (власні контекстні рушії, нативні середовища виконання, що будують власний контекст, або спеціалізовані робочі процеси без bootstrap). Ходи Heartbeat і відновлення після Compaction також пропускають вставлення.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на один bootstrap-файл робочої області перед обрізанням. Типове значення: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що вставляється з усіх bootstrap-файлів робочої області. Типове значення: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента текстом попередження, коли bootstrap-контекст обрізано.
Типове значення: `"once"`.

- `"off"`: ніколи не вставляти текст попередження в системний промпт.
- `"once"`: вставити попередження один раз для кожної унікальної сигнатури обрізання (рекомендовано).
- `"always"`: вставляти попередження під час кожного запуску, коли є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта володіння бюджетами контексту

OpenClaw має кілька великих бюджетів промпта/контексту, і вони
навмисно розділені за підсистемами, а не всі проходять через один загальний
перемикач.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне вставлення bootstrap робочої області.
- `agents.defaults.startupContext.*`:
  одноразова преамбула модельного запуску під час reset/startup, включно з нещодавніми щоденними
  файлами `memory/*.md`. Простi команди чату `/new` і `/reset`
  підтверджуються без виклику моделі.
- `skills.limits.*`:
  компактний список skills, вставлений у системний промпт.
- `agents.defaults.contextLimits.*`:
  обмежені фрагменти середовища виконання та вставлені блоки, що належать середовищу виконання.
- `memory.qmd.limits.*`:
  розмір фрагмента індексованого пошуку пам’яті та вставлення.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовою преамбулою першого ходу, що вставляється під час модельних запусків reset/startup.
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

- `memoryGetMaxChars`: типове обмеження фрагмента `memory_get` перед додаванням
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків `memory_get`, коли `lines`
  пропущено.
- `toolResultMaxChars`: обмеження результатів live-інструментів, що використовується для збережених результатів і
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

Глобальне обмеження для компактного списку skills, що вставляється в системний промпт. Це
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
Типове значення: `1200`.

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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - Використовується шляхом інструмента `image` як його конфігурація моделі зору.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати зображення на вході.
  - Надавайте перевагу явним посиланням `provider/model`. Голі ідентифікатори приймаються для сумісності; якщо голий ідентифікатор однозначно відповідає налаштованому запису з підтримкою зображень у `models.providers.*.models`, OpenClaw прив’язує його до цього провайдера. Неоднозначні налаштовані збіги вимагають явного префікса провайдера.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для PNG/WebP-виводу OpenAI з прозорим фоном.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо пропущено, `image_generate` все одно може визначити типового провайдера з автентифікацією. Він спочатку пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації зображень у порядку ідентифікаторів провайдерів.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо пропущено, `music_generate` все одно може визначити типового провайдера з автентифікацією. Він спочатку пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації музики в порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо пропущено, `video_generate` все одно може визначити типового провайдера з автентифікацією. Він спочатку пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації відео в порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалості 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделей.
  - Якщо пропущено, інструмент PDF переходить до `imageModel`, а потім до розв’язаної моделі сеансу/типової моделі.
- `pdfMaxBytesMb`: типовий ліміт розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, які враховує резервний режим витягування в інструменті `pdf`.
- `verboseDefault`: типовий рівень докладності для агентів. Значення: `"off"`, `"on"`, `"full"`. Типово: `"off"`.
- `reasoningDefault`: типова видимість міркування для агентів. Значення: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` окремого агента перевизначає це типове значення. Налаштовані типові значення міркування застосовуються лише для власників, авторизованих відправників або контекстів Gateway адміністратора-оператора, коли не встановлено перевизначення міркування на рівні повідомлення чи сеансу.
- `elevatedDefault`: типовий рівень підвищеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типово: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу за API-ключем або `openai-codex/gpt-5.5` для Codex OAuth). Якщо ви пропускаєте провайдера, OpenClaw спочатку пробує псевдонім, потім унікальний збіг налаштованого провайдера для цього точного ідентифікатора моделі, і лише потім переходить до налаштованого типового провайдера (застаріла поведінка сумісності, тому надавайте перевагу явному `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw переходить до першої налаштованої пари провайдер/модель замість показу застарілої типової моделі видаленого провайдера.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Безпечні редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відхиляє заміни, які видалили б наявні записи allowlist, якщо не передати `--replace`.
  - Потоки налаштування/onboarding в області провайдера об’єднують вибрані моделі провайдера в цю мапу й зберігають уже налаштованих непов’язаних провайдерів.
  - Для прямих моделей OpenAI Responses серверна Compaction вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити ін’єкцію `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [серверну Compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні типові параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет об’єднання `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для моделі), потім `agents.list[].params` (відповідний ідентифікатор агента) перевизначає за ключем. Докладніше див. [кешування підказок](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений наскрізний JSON, який об’єднується в тіла запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, додаткове тіло має пріоритет; ненативні маршрути completions усе одно потім вилучають специфічний для OpenAI `store`.
- `params.chat_template_kwargs`: аргументи chat-template, сумісні з vLLM/OpenAI, що об’єднуються в тіла запитів верхнього рівня `api: "openai-completions"`. Для `vllm/nemotron-3-*` із вимкненим thinking вбудований vLLM Plugin автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані типові значення, а `extra_body.chat_template_kwargs` все одно має остаточний пріоритет. Для елементів керування thinking Qwen у vLLM задайте `params.qwenThinkingFormat` як `"chat-template"` або `"top-level"` у записі цієї моделі.
- `compat.supportedReasoningEfforts`: список зусиль міркування для моделі, сумісний з OpenAI. Додайте `"xhigh"` для власних endpoint, які справді його приймають; тоді OpenClaw показує `/think xhigh` у меню команд, рядках сеансів Gateway, валідації patch сеансу, валідації CLI агента та валідації `llm-task` для цієї налаштованої пари провайдер/модель. Використовуйте `compat.reasoningEffortMap`, коли бекенд очікує специфічне для провайдера значення для канонічного рівня.
- `params.preserveThinking`: згода лише для Z.AI на збережене thinking. Коли ввімкнено й thinking активне, OpenClaw надсилає `thinking.clear_thinking: false` і повторно відтворює попередній `reasoning_content`; див. [thinking Z.AI і збережене thinking](/uk/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: типова низькорівнева політика середовища виконання агента. Пропущений ідентифікатор типово означає OpenClaw Pi. Використовуйте `id: "pi"`, щоб примусово вибрати вбудований PI harness, `id: "auto"`, щоб зареєстровані plugin harness могли претендувати на підтримувані моделі, зареєстрований ідентифікатор harness, як-от `id: "codex"`, або підтримуваний псевдонім CLI-бекенда, як-от `id: "claude-cli"`. Установіть `fallback: "none"`, щоб вимкнути автоматичний резервний перехід на PI. Явні середовища виконання Plugin, такі як `codex`, типово завершуються закрито, якщо ви не встановите `fallback: "pi"` у тій самій області перевизначення. Зберігайте посилання на моделі канонічними як `provider/model`; вибирайте Codex, Claude CLI, Gemini CLI та інші бекенди виконання через конфігурацію середовища виконання замість застарілих префіксів провайдера середовища виконання. Див. [середовища виконання агентів](/uk/concepts/agent-runtimes), щоб зрозуміти, чим це відрізняється від вибору провайдера/моделі.
- Записувачі конфігурації, що змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення резервних моделей), зберігають канонічну об’єктну форму й за можливості зберігають наявні списки резервних моделей.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сеансами (кожен сеанс усе одно серіалізований). Типово: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` керує тим, який низькорівневий виконавець запускає ходи агента. Більшість
розгортань мають залишити типове середовище виконання OpenClaw Pi. Використовуйте його, коли довірений
Plugin надає нативний harness, як-от вбудований harness app-server Codex,
або коли вам потрібен підтримуваний CLI-бекенд, як-от Claude CLI. Для ментальної
моделі див. [середовища виконання агентів](/uk/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, зареєстрований ідентифікатор plugin harness або підтримуваний псевдонім CLI-бекенда. Вбудований Codex Plugin реєструє `codex`; вбудований Anthropic Plugin надає CLI-бекенд `claude-cli`.
- `fallback`: `"pi"` або `"none"`. В `id: "auto"` пропущений резервний варіант типово дорівнює `"pi"`, щоб старі конфігурації могли й надалі використовувати PI, коли жоден plugin harness не претендує на запуск. У режимі явного середовища виконання Plugin, як-от `id: "codex"`, пропущений резервний варіант типово дорівнює `"none"`, щоб відсутній harness завершувався помилкою замість непомітного використання PI. Перевизначення середовища виконання не успадковують резервний варіант із ширшої області; задайте `fallback: "pi"` разом із явним середовищем виконання, коли навмисно хочете цей резервний варіант сумісності. Помилки вибраного plugin harness завжди відображаються напряму.
- Перевизначення середовища: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` перевизначає резервний варіант для цього процесу.
- Для розгортань лише з Codex задайте `model: "openai/gpt-5.5"` і `agentRuntime.id: "codex"`. Ви також можете явно задати `agentRuntime.fallback: "none"` для читабельності; це типове значення для явних середовищ виконання Plugin.
- Для розгортань Claude CLI надавайте перевагу `model: "anthropic/claude-opus-4-7"` плюс `agentRuntime.id: "claude-cli"`. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` усе ще працюють для сумісності, але нова конфігурація має зберігати вибір провайдера/моделі канонічним і розміщувати бекенд виконання в `agentRuntime.id`.
- Старі ключі політики середовища виконання переписуються в `agentRuntime` командою `openclaw doctor --fix`.
- Вибір harness закріплюється за ідентифікатором сеансу після першого вбудованого запуску. Зміни конфігурації/середовища впливають на нові або скинуті сеанси, а не на наявний transcript. Застарілі сеанси з історією transcript, але без записаного закріплення, вважаються закріпленими за PI. `/status` повідомляє ефективне середовище виконання, наприклад `Runtime: OpenClaw Pi Default` або `Runtime: OpenAI Codex`.
- Це керує лише виконанням текстових ходів агента. Генерація медіа, зір, PDF, музика, відео й TTS і далі використовують свої налаштування провайдера/моделі.

**Вбудовані скорочення псевдонімів** (застосовуються лише коли модель є в `agents.defaults.models`):

| Псевдонім          | Модель                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Ваші налаштовані псевдоніми завжди мають пріоритет над стандартними.

Моделі Z.AI GLM-4.x автоматично вмикають режим мислення, якщо ви не встановите `--thinking off` або не визначите `agents.defaults.models["zai/<model>"].params.thinking` самостійно.
Моделі Z.AI за замовчуванням вмикають `tool_stream` для потокового передавання викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` на `false`, щоб вимкнути це.
Моделі Anthropic Claude 4.6 за замовчуванням використовують `adaptive` мислення, коли явний рівень мислення не задано.

### `agents.defaults.cliBackends`

Необов’язкові бекенди CLI для резервних запусків лише з текстом (без викликів інструментів). Корисно як запасний варіант, коли API-провайдери дають збій.

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

- Бекенди CLI орієнтовані насамперед на текст; інструменти завжди вимкнені.
- Сеанси підтримуються, коли задано `sessionArg`.
- Наскрізне передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.

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

Незалежні від провайдера накладення промпта, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки в різних провайдерах; `personality` керує лише дружнім шаром стилю взаємодії.

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

- `every`: рядок тривалості (ms/s/m/h). Стандартно: `30m` (автентифікація ключем API) або `1h` (автентифікація OAuth). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли `false`, вилучає розділ Heartbeat із системного промпта й пропускає ін’єкцію `HEARTBEAT.md` у початковий контекст. Стандартно: `true`.
- `suppressToolErrorWarnings`: коли `true`, пригнічує попереджувальні payload-и про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для ходу агента Heartbeat, перш ніж його буде перервано. Залиште незаданим, щоб використовувати `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої/DM-доставки. `allow` (стандартно) дозволяє доставку безпосередній цілі. `block` пригнічує доставку безпосередній цілі й видає `reason=dm-blocked`.
- `lightContext`: коли `true`, запуски Heartbeat використовують легкий початковий контекст і зберігають лише `HEARTBEAT.md` з початкових файлів робочого простору.
- `isolatedSession`: коли `true`, кожен Heartbeat запускається в новому сеансі без попередньої історії розмови. Такий самий шаблон ізоляції, як у cron `sessionTarget: "isolated"`. Зменшує витрати токенів на один Heartbeat приблизно зі 100 тис. до 2-5 тис. токенів.
- `skipWhenBusy`: коли `true`, запуски Heartbeat відкладаються за наявності додатково зайнятих ліній: роботи субагента або вкладеної команди. Лінії Cron завжди відкладають Heartbeat, навіть без цього прапорця.
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

- `mode`: `default` або `safeguard` (фрагментоване підсумовування для довгих історій). Див. [Compaction](/uk/concepts/compaction).
- `provider`: ідентифікатор зареєстрованого Plugin провайдера Compaction. Коли задано, викликається `summarize()` провайдера замість вбудованого підсумовування LLM. У разі збою виконується відкат до вбудованого варіанта. Задання провайдера примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, перш ніж OpenClaw перерве її. Стандартно: `900`.
- `keepRecentTokens`: бюджет точки відсікання Pi для збереження найновішого хвоста стенограми дослівно. Ручний `/compact` враховує це, коли явно задано; інакше ручна Compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (стандартно), `off` або `custom`. `strict` додає на початок вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий власний текст щодо збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повтором у разі некоректно сформованого виводу для підсумків safeguard. Увімкнено за замовчуванням у режимі safeguard; установіть `enabled: false`, щоб пропустити аудит.
- `midTurnPrecheck`: необов’язкова перевірка тиску циклу інструментів Pi. Коли `enabled: true`, OpenClaw перевіряє тиск контексту після додавання результатів інструментів і перед наступним викликом моделі. Якщо контекст більше не вміщується, він перериває поточну спробу перед надсиланням промпта й повторно використовує наявний шлях відновлення попередньої перевірки для обрізання результатів інструментів або виконання Compaction і повторної спроби. Працює з режимами Compaction `default` і `safeguard`. Стандартно: вимкнено.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md для повторної ін’єкції після Compaction. Стандартно `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторну ін’єкцію. Коли не задано або явно задано цю стандартну пару, старіші заголовки `Every Session`/`Safety` також приймаються як застарілий fallback.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, коли основний сеанс має залишатися на одній моделі, а підсумки Compaction мають виконуватися на іншій; коли не задано, Compaction використовує основну модель сеансу.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), який запускає звичайну локальну Compaction перед запуском, коли активний JSONL перевищує поріг. Потребує `truncateAfterCompaction`, щоб успішна Compaction могла перейти до меншої наступної стенограми. Вимкнено, коли не задано або `0`.
- `notifyUser`: коли `true`, надсилає користувачу короткі сповіщення, коли Compaction починається й коли завершується (наприклад, "Стискання контексту..." і "Compaction завершено"). За замовчуванням вимкнено, щоб Compaction виконувалася без повідомлень.
- `memoryFlush`: тихий агентний хід перед автоматичною Compaction для збереження довготривалих спогадів. Установіть `model` на точний провайдер/модель, наприклад `ollama/qwen3:8b`, коли цей службовий хід має залишатися на локальній моделі; перевизначення не успадковує fallback-ланцюг активного сеансу. Пропускається, коли робочий простір доступний лише для читання.

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

<Accordion title="поведінка режиму cache-ttl">

- `mode: "cache-ttl"` вмикає проходи обрізання.
- `ttl` керує тим, як часто обрізання може запускатися знову (після останнього звернення до кешу).
- Обрізання спершу м’яко скорочує завеликі результати інструментів, а потім, за потреби, жорстко очищає старіші результати інструментів.

**М’яке скорочення** зберігає початок + кінець і вставляє `...` посередині.

**Жорстке очищення** замінює весь результат інструмента на заповнювач.

Примітки:

- Блоки зображень ніколи не скорочуються й не очищаються.
- Співвідношення ґрунтуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Див. [Обрізання сеансу](/uk/concepts/session-pruning), щоб дізнатися подробиці поведінки.

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

- Канали не Telegram потребують явного `*.blockStreaming: true`, щоб увімкнути блокові відповіді.
- Перевизначення каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Для Signal/Slack/Discord/Google Chat типовим є `minChars: 1500`.
- `humanDelay`: рандомізована пауза між блоковими відповідями. `natural` = 800–2500 мс. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Див. [Потокову передачу](/uk/concepts/streaming), щоб дізнатися про поведінку та деталі поділу на фрагменти.

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
- Перевизначення для окремого сеансу: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Індикатори введення](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова ізоляція у пісочниці для вбудованого агента. Див. [Ізоляцію у пісочниці](/uk/gateway/sandboxing), щоб прочитати повний посібник.

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

<Accordion title="Деталі пісочниці">

**Бекенд:**

- `docker`: локальне середовище виконання Docker (типово)
- `ssh`: універсальне віддалене середовище виконання на базі SSH
- `openshell`: середовище виконання OpenShell

Коли вибрано `backend: "openshell"`, параметри, специфічні для середовища виконання, переміщуються до
`plugins.entries.openshell.config`.

**Конфігурація бекенда SSH:**

- `target`: ціль SSH у формі `user@host[:port]`
- `command`: команда клієнта SSH (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, який використовується для робочих просторів кожної області
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRefs, які OpenClaw матеріалізує в тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: перемикачі політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має перевагу над `identityFile`
- `certificateData` має перевагу над `certificateFile`
- `knownHostsData` має перевагу над `knownHostsFile`
- Значення `*Data` на базі SecretRef розв’язуються з активного знімка середовища виконання секретів перед запуском сеансу пісочниці

**Поведінка бекенда SSH:**

- одноразово заповнює віддалений робочий простір після створення або повторного створення
- потім підтримує віддалений робочий простір SSH як канонічний
- маршрутизує `exec`, файлові інструменти та медіашляхи через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує контейнери браузера в пісочниці

**Доступ до робочого простору:**

- `none`: робочий простір пісочниці для кожної області під `~/.openclaw/sandboxes`
- `ro`: робочий простір пісочниці в `/workspace`, робочий простір агента змонтовано лише для читання в `/agent`
- `rw`: робочий простір агента змонтовано для читання/запису в `/workspace`

**Область:**

- `session`: контейнер і робочий простір для кожного сеансу
- `agent`: один контейнер і робочий простір на агента (типово)
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

- `mirror`: заповнює віддалений простір із локального перед виконанням, синхронізує назад після виконання; локальний робочий простір лишається канонічним
- `remote`: одноразово заповнює віддалений простір під час створення пісочниці, потім підтримує віддалений робочий простір як канонічний

У режимі `remote` локальні зміни на хості, зроблені поза OpenClaw, не синхронізуються в пісочницю автоматично після етапу початкового заповнення.
Транспортом є SSH у пісочницю OpenShell, але Plugin відповідає за життєвий цикл пісочниці та необов’язкову дзеркальну синхронізацію.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потребує виходу в мережу, кореня з правом запису та користувача root.

**Для контейнерів типовим є `network: "none"`** — задайте `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не задасте
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний режим).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки для окремих агентів об’єднуються.

**Браузер у пісочниці** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системний промпт. Не потребує `browser.enabled` в `openclaw.json`.
Доступ спостерігача noVNC типово використовує автентифікацію VNC, а OpenClaw випускає короткочасний URL із токеном (замість розкриття пароля в спільному URL).

- `allowHostControl: false` (типово) блокує сеанси в пісочниці від націлювання на браузер хоста.
- Типове значення `network` — `openclaw-sandbox-browser` (виділена bridge-мережа). Задавайте `bridge` лише коли явно потрібне глобальне bridge-підключення.
- `cdpSourceRange` необов’язково обмежує вхідний трафік CDP на межі контейнера до діапазону CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера пісочниці. Коли задано (включно з `[]`), замінює `docker.binds` для контейнера браузера.
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
  - `--disable-extensions` (типово увімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    типово ввімкнені, і їх можна вимкнути за допомогою
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити за допомогою
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; задайте `0`, щоб використовувати
    типове обмеження процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовими для образу контейнера; використовуйте власний образ браузера з власною
    точкою входу, щоб змінити типові параметри контейнера.

</Accordion>

Ізоляція браузера в пісочниці та `sandbox.docker.binds` доступні лише для Docker.

Збирання образів (із вихідного checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Для встановлень npm без вихідного checkout див. [Ізоляція у пісочниці § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup), щоб отримати вбудовані команди `docker build`.

### `agents.list` (перевизначення для окремих агентів)

Використовуйте `agents.list[].tts`, щоб надати агенту власного постачальника TTS, голос, модель,
стиль або режим автоматичного TTS. Блок агента глибоко зливається поверх глобального
`messages.tts`, тому спільні облікові дані можуть лишатися в одному місці, тоді як окремі
агенти перевизначають лише потрібні їм поля голосу або постачальника. Перевизначення активного агента
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
        agentRuntime: { id: "auto", fallback: "pi" },
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
- `default`: коли встановлено кілька, перший має пріоритет (записується попередження). Якщо жоден не встановлено, типовим є перший елемент списку.
- `model`: рядкова форма задає строгий основний варіант для окремого агента без резервної моделі; об’єктна форма `{ primary }` також є строгою, якщо не додати `fallbacks`. Використовуйте `{ primary, fallbacks: [...] }`, щоб увімкнути резервний варіант для цього агента, або `{ primary, fallbacks: [] }`, щоб явно задати строгу поведінку. Завдання Cron, які перевизначають лише `primary`, все одно успадковують типові резервні варіанти, якщо не встановити `fallbacks: []`.
- `params`: параметри потоку для окремого агента, що зливаються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних перевизначень агента, як-от `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `tts`: необов’язкові перевизначення перетворення тексту на мовлення для окремого агента. Блок глибоко зливається поверх `messages.tts`, тож спільні облікові дані провайдера й політику резервування тримайте в `messages.tts`, а тут задавайте лише специфічні для персони значення, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий список дозволених Skills для окремого агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, коли його встановлено; явний список замінює типові значення замість злиття, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень мислення для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не встановлено перевизначення для окремого повідомлення або сеансу. Вибраний профіль провайдера/моделі визначає, які значення є чинними; для Google Gemini `adaptive` зберігає динамічне мислення, кероване провайдером (`thinkingLevel` пропущено в Gemini 3/3.1, `thinkingBudget: -1` у Gemini 2.5).
- `reasoningDefault`: необов’язкова типова видимість міркування для окремого агента (`on | off | stream`). Перевизначає `agents.defaults.reasoningDefault` для цього агента, коли не встановлено перевизначення міркування для окремого повідомлення або сеансу.
- `fastModeDefault`: необов’язкове типове значення швидкого режиму для окремого агента (`true | false`). Застосовується, коли не встановлено перевизначення швидкого режиму для окремого повідомлення або сеансу.
- `agentRuntime`: необов’язкове перевизначення низькорівневої політики середовища виконання для окремого агента. Використовуйте `{ id: "codex" }`, щоб зробити один агент лише Codex, тоді як інші агенти зберігатимуть типовий резервний PI у режимі `auto`.
- `runtime`: необов’язковий дескриптор середовища виконання для окремого агента. Використовуйте `type: "acp"` з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати сеанси ACP harness.
- `identity.avatar`: шлях відносно робочої області, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених ідентифікаторів агентів для явних цілей `sessions_spawn.agentId` (`["*"]` = будь-який; типово: лише той самий агент). Додайте ідентифікатор запитувача, коли мають бути дозволені самонацілені виклики `agentId`.
- Запобіжник успадкування sandbox: якщо сеанс запитувача sandboxed, `sessions_spawn` відхиляє цілі, які запускалися б без sandbox.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, які пропускають `agentId` (примушує явний вибір профілю; типово: false).

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

### Поля відповідності прив’язки

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній тип типово означає route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; пропущено = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; залежить від каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок відповідності:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точна відповідність, без peer/guild/team)
5. `match.accountId: "*"` (на весь канал)
6. Типовий агент

У межах кожного рівня перший відповідний запис `bindings` має пріоритет.

Для записів `type: "acp"` OpenClaw розв’язує за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище порядок рівнів прив’язки маршруту.

### Профілі доступу для окремих агентів

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

<Accordion title="Інструменти лише для читання + робоча область">

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

<Accordion title="Без доступу до файлової системи (лише повідомлення)">

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

Див. [Sandbox та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools), щоб дізнатися подробиці про пріоритет.

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

<Accordion title="Подробиці полів сеансу">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (за замовчуванням): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються особисті повідомлення.
  - `main`: усі особисті повідомлення спільно використовують головну сесію.
  - `per-peer`: ізолювати за ідентифікатором відправника між каналами.
  - `per-channel-peer`: ізолювати за каналом + відправником (рекомендовано для скриньок вхідних повідомлень із кількома користувачами).
  - `per-account-channel-peer`: ізолювати за акаунтом + каналом + відправником (рекомендовано для кількох акаунтів).
- **`identityLinks`**: зіставляє канонічні ідентифікатори з учасниками з префіксом провайдера для спільного використання сесій між каналами. Команди стикування, як-от `/dock_discord`, використовують ту саму мапу, щоб перемкнути маршрут відповіді активної сесії на іншого пов’язаного учасника каналу; див. [Стикування каналів](/uk/concepts/channel-docking).
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за локальним часом; `idle` скидає після `idleMinutes`. Коли налаштовано обидва, спрацьовує те, що завершується першим. Актуальність щоденного скидання використовує `sessionStartedAt` рядка сесії; актуальність скидання через неактивність використовує `lastInteractionAt`. Фонові/системні записи подій, як-от Heartbeat, пробудження Cron, сповіщення виконання та службовий облік Gateway, можуть оновлювати `updatedAt`, але вони не підтримують актуальність щоденних/неактивних сесій.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застаріле `dm` приймається як псевдонім для `direct`.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для головного сегмента прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість зворотних ходів-відповідей між агентами під час обмінів агент-агент (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона перемагає.
- **`maintenance`**: очищення сховища сесій + елементи керування утриманням.
  - `mode`: `warn` лише видає попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (за замовчуванням `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (за замовчуванням `500`). Runtime записує пакетне очищення з невеликим буфером верхнього рівня для обмежень виробничого розміру; `openclaw sessions cleanup --enforce` застосовує обмеження негайно.
  - `rotateBytes`: застаріло та ігнорується; `openclaw doctor --fix` видаляє його зі старіших конфігурацій.
  - `resetArchiveRetention`: утримання архівів транскриптів `*.reset.<timestamp>`. За замовчуванням дорівнює `pruneAfter`; встановіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий дисковий бюджет каталогу сесій. У режимі `warn` він записує попередження в журнал; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. За замовчуванням становить `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні значення за замовчуванням для функцій сесій, прив’язаних до тредів.
  - `enabled`: головний перемикач за замовчуванням (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: автоматичне зняття фокуса після неактивності за замовчуванням у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: жорсткий максимальний вік за замовчуванням у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `spawnSessions`: шлюз за замовчуванням для створення робочих сесій, прив’язаних до тредів, із `sessions_spawn` і створення тредів ACP. За замовчуванням `true`, коли прив’язки тредів увімкнено; провайдери/акаунти можуть перевизначати.
  - `defaultSpawnContext`: типовий нативний контекст під-агента для створень, прив’язаних до тредів (`"fork"` або `"isolated"`). За замовчуванням `"fork"`.

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

Перевизначення за каналом/акаунтом: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Розв’язання (перемагає найспецифічніше): акаунт → канал → глобальне. `""` вимикає та зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна            | Опис                   | Приклад                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі   | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера       | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень мислення | `high`, `low`, `off`        |
| `{identity.name}` | Назва ідентичності агента | (так само, як `"auto"`)     |

Змінні не чутливі до регістру. `{think}` є псевдонімом для `{thinkingLevel}`.

### Реакція підтвердження

- За замовчуванням використовується `identity.emoji` активного агента, інакше `"👀"`. Встановіть `""`, щоб вимкнути.
- Перевизначення за каналом: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок розв’язання: акаунт → канал → `messages.ackReaction` → резервне значення ідентичності.
- Область: `group-mentions` (за замовчуванням), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в каналах із підтримкою реакцій, як-от Slack, Discord, Telegram, WhatsApp і BlueBubbles.
- `messages.statusReactions.enabled`: вмикає реакції стану життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord незадане значення залишає реакції стану ввімкненими, коли активні реакції підтвердження.
  У Telegram встановіть явно `true`, щоб увімкнути реакції стану життєвого циклу.

### Вхідний debounce

Пакетує швидкі текстові повідомлення від того самого відправника в один хід агента. Медіа/вкладення скидають пакет негайно. Команди керування обходять debounce.

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
- `modelOverrides` увімкнено за замовчуванням; `modelOverrides.allowProvider` за замовчуванням дорівнює `false` (потрібне явне ввімкнення).
- API-ключі резервно беруться з `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані провайдери мовлення належать Plugin. Якщо задано `plugins.allow`, додайте кожен Plugin провайдера TTS, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий ідентифікатор провайдера `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок розв’язання: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на кінцеву точку не OpenAI, OpenClaw трактує її як OpenAI-сумісний сервер TTS і послаблює валідацію моделі/голосу.

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кілька провайдерів Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності й автоматично мігруються в `talk.providers.<provider>`.
- Ідентифікатори голосів резервно беруться з `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає відкриті текстові рядки або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли API-ключ Talk не налаштовано.
- `providers.*.voiceAliases` дає змогу директивам Talk використовувати зручні назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовується локальним помічником MLX у macOS. Якщо пропущено, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX у macOS виконується через вбудований помічник `openclaw-mlx-tts`, коли він присутній, або через виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях помічника для розробки.
- `speechLocale` задає ідентифікатор локалі BCP 47, який використовується розпізнаванням мовлення Talk в iOS/macOS. Залиште незаданим, щоб використовувати стандарт пристрою.
- `silenceTimeoutMs` керує тим, скільки режим Talk чекає після мовчання користувача, перш ніж надіслати транскрипт. Незадане значення зберігає стандартне вікно паузи платформи (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
