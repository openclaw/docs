---
read_when:
    - Налаштування типових параметрів агента (моделі, мислення, робоча область, Heartbeat, медіа, Skills)
    - Налаштування багатоагентної маршрутизації та прив’язок
    - Налаштування поведінки сеансу, доставки повідомлень і режиму розмови
summary: Типові налаштування агента, багатоагентна маршрутизація, сеанс, повідомлення та конфігурація спілкування
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-04-29T21:53:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71ffa1a7315a9f12b9685ca4aeef1414a5da994105f4466718fea56f3c53fbc2
    source_path: gateway/config-agents.md
    workflow: 16
---

Ключі конфігурації на рівні агента під `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Типові значення агента

### `agents.defaults.workspace`

За замовчуванням: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, показаний у рядку Runtime системного промпта. Якщо не задано, OpenClaw автоматично визначає його, рухаючись угору від робочої області.

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
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Не вказуйте `agents.defaults.skills`, щоб за замовчуванням skills були без обмежень.
- Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
- Задайте `agents.list[].skills: []`, щоб skills не було.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів робочої області (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли робочої області вставляються в системний промпт. За замовчуванням: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторну вставку bootstrap робочої області, зменшуючи розмір промпта. Запуски Heartbeat і повтори після Compaction усе ще перебудовують контекст.
- `"never"`: вимикає bootstrap робочої області та вставку контекстних файлів на кожному ході. Використовуйте це лише для агентів, які повністю керують життєвим циклом власного промпта (власні рушії контексту, нативні середовища виконання, що будують власний контекст, або спеціалізовані робочі процеси без bootstrap). Ходи Heartbeat і відновлення після Compaction також пропускають вставку.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на bootstrap-файл робочої області перед обрізанням. За замовчуванням: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, вставлених з усіх bootstrap-файлів робочої області. За замовчуванням: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує текстом попередження, видимим для агента, коли bootstrap-контекст обрізано.
За замовчуванням: `"once"`.

- `"off"`: ніколи не вставляти текст попередження в системний промпт.
- `"once"`: вставляти попередження один раз для кожної унікальної сигнатури обрізання (рекомендовано).
- `"always"`: вставляти попередження під час кожного запуску, коли є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Мапа володіння бюджетом контексту

OpenClaw має кілька великих бюджетів промпта/контексту, і вони навмисно
розділені за підсистемами, а не проходять усі через один універсальний
перемикач.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайна вставка bootstrap робочої області.
- `agents.defaults.startupContext.*`:
  одноразова преамбула запуску моделі після reset/startup, включно з нещодавніми щоденними
  файлами `memory/*.md`. Команди звичайного чату `/new` і `/reset`
  підтверджуються без виклику моделі.
- `skills.limits.*`:
  компактний список skills, вставлений у системний промпт.
- `agents.defaults.contextLimits.*`:
  обмежені уривки середовища виконання та вставлені блоки, якими володіє середовище виконання.
- `memory.qmd.limits.*`:
  розмір індексованого фрагмента пошуку в пам’яті та вставки.

Використовуйте відповідне перевизначення на рівні агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує преамбулою першого ходу, що вставляється під час запусків моделі reset/startup.
Команди звичайного чату `/new` і `/reset` підтверджують скидання без виклику
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

- `memoryGetMaxChars`: типове обмеження уривка `memory_get` перед додаванням
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків `memory_get`, коли `lines`
  не вказано.
- `toolResultMaxChars`: обмеження результатів live-інструментів, що використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: обмеження уривка AGENTS.md, що використовується під час вставки
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

Максимальний розмір у пікселях для найдовшої сторони зображення в блоках зображень transcript/tool перед викликами провайдера.
За замовчуванням: `1200`.

Нижчі значення зазвичай зменшують використання vision-токенів і розмір payload запиту для запусків із великою кількістю скриншотів.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного промпта (не для часових міток повідомлень). Використовує часовий пояс хоста як fallback.

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
  - Об’єктна форма задає основну модель плюс упорядковані резервні моделі для аварійного перемикання.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація vision-моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/стандартна модель не може приймати зображення на вході.
  - Надавайте перевагу явним посиланням `provider/model`. Голі ідентифікатори приймаються для сумісності; якщо голий ідентифікатор однозначно відповідає налаштованому запису з підтримкою зображень у `models.providers.*.models`, OpenClaw доповнює його цим провайдером. Неоднозначні налаштовані збіги вимагають явного префікса провайдера.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструментів/plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для виводу OpenAI PNG/WebP із прозорим тлом.
  - Якщо вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо пропущено, `image_generate` усе ще може вивести стандартного провайдера з наявною автентифікацією. Спершу він пробує поточного стандартного провайдера, потім решту зареєстрованих провайдерів генерації зображень у порядку ідентифікаторів провайдерів.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо пропущено, `music_generate` усе ще може вивести стандартного провайдера з наявною автентифікацією. Спершу він пробує поточного стандартного провайдера, потім решту зареєстрованих провайдерів генерації музики в порядку ідентифікаторів провайдерів.
  - Якщо вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо пропущено, `video_generate` усе ще може вивести стандартного провайдера з наявною автентифікацією. Спершу він пробує поточного стандартного провайдера, потім решту зареєстрованих провайдерів генерації відео в порядку ідентифікаторів провайдерів.
  - Якщо вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд і параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` та `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо пропущено, інструмент PDF повертається до `imageModel`, а потім до розв’язаної моделі сеансу/стандартної моделі.
- `pdfMaxBytesMb`: стандартний ліміт розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: стандартна максимальна кількість сторінок, які враховує режим резервного видобування в інструменті `pdf`.
- `verboseDefault`: стандартний рівень докладності для агентів. Значення: `"off"`, `"on"`, `"full"`. Стандартно: `"off"`.
- `reasoningDefault`: стандартна видимість reasoning для агентів. Значення: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` для окремого агента перевизначає це стандартне значення. Налаштовані стандартні значення reasoning застосовуються лише для власників, авторизованих відправників або контекстів Gateway адміністратора-оператора, коли не задано перевизначення reasoning для повідомлення або сеансу.
- `elevatedDefault`: стандартний рівень підвищеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Стандартно: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ або `openai-codex/gpt-5.5` для Codex OAuth). Якщо пропустити провайдера, OpenClaw спершу пробує псевдонім, потім унікальний збіг налаштованого провайдера для цього точного ідентифікатора моделі, і лише потім повертається до налаштованого стандартного провайдера (застаріла поведінка сумісності, тому надавайте перевагу явному `provider/model`). Якщо цей провайдер більше не надає налаштовану стандартну модель, OpenClaw повертається до першої налаштованої пари провайдер/модель замість показу застарілого стандартного значення видаленого провайдера.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Безпечні зміни: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи. `config set` відхиляє заміни, які видалили б наявні записи allowlist, якщо не передати `--replace`.
  - Потоки налаштування/онбордингу в межах провайдера зливають вибрані моделі провайдера в цю мапу й зберігають уже налаштованих непов’язаних провайдерів.
  - Для прямих моделей OpenAI Responses серверна Compaction вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити ін’єкцію `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [серверну Compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні стандартні параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для моделі), потім `agents.list[].params` (відповідний ідентифікатор агента) перевизначає за ключем. Докладніше див. [Prompt Caching](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений наскрізний JSON, що зливається в тіла запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, додаткове тіло має перевагу; ненативні маршрути completions після цього все одно видаляють OpenAI-специфічний `store`.
- `params.chat_template_kwargs`: аргументи chat-template, сумісні з vLLM/OpenAI, що зливаються в тіла запитів верхнього рівня `api: "openai-completions"`. Для `vllm/nemotron-3-*` з вимкненим thinking вбудований vLLM Plugin автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані стандартні значення, а `extra_body.chat_template_kwargs` усе ще має остаточний пріоритет. Для елементів керування thinking Qwen задайте `params.qwenThinkingFormat` як `"chat-template"` або `"top-level"` у цьому записі моделі.
- `compat.supportedReasoningEfforts`: список зусиль reasoning для кожної OpenAI-сумісної моделі. Додайте `"xhigh"` для користувацьких endpoint, які справді його приймають; тоді OpenClaw показує `/think xhigh` у меню команд, рядках сеансів Gateway, перевірці patch сеансу, перевірці CLI агента та перевірці `llm-task` для цієї налаштованої пари провайдер/модель. Використовуйте `compat.reasoningEffortMap`, коли backend очікує специфічне для провайдера значення для канонічного рівня.
- `params.preserveThinking`: opt-in лише для Z.AI для збереженого thinking. Коли ввімкнено й thinking увімкнений, OpenClaw надсилає `thinking.clear_thinking: false` і повторно відтворює попередній `reasoning_content`; див. [thinking Z.AI і збережений thinking](/uk/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: стандартна низькорівнева політика runtime агента. Пропущений ідентифікатор стандартно означає OpenClaw Pi. Використовуйте `id: "pi"`, щоб примусово задіяти вбудований PI harness, `id: "auto"`, щоб дозволити зареєстрованим plugin harnesses забирати підтримувані моделі, зареєстрований ідентифікатор harness, як-от `id: "codex"`, або підтримуваний псевдонім CLI backend, як-от `id: "claude-cli"`. Задайте `fallback: "none"`, щоб вимкнути автоматичний fallback до PI. Явні plugin runtimes, як-от `codex`, за замовчуванням fail closed, якщо в тій самій області перевизначення не задано `fallback: "pi"`. Зберігайте посилання на моделі канонічними як `provider/model`; вибирайте Codex, Claude CLI, Gemini CLI та інші execution backends через runtime config замість застарілих префіксів runtime provider. Див. [runtime агентів](/uk/concepts/agent-runtimes), щоб зрозуміти, чим це відрізняється від вибору провайдера/моделі.
- Записувачі конфігурації, що змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення fallback), зберігають канонічну об’єктну форму й за можливості зберігають наявні списки fallback.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сеансами (кожен сеанс усе ще серіалізований). Стандартно: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` керує тим, який низькорівневий executor виконує ходи агента. Більшість
розгортань мають зберігати стандартний runtime OpenClaw Pi. Використовуйте його, коли довірений
Plugin надає нативний harness, як-от вбудований harness app-server Codex,
або коли потрібен підтримуваний CLI backend, як-от Claude CLI. Для ментальної
моделі див. [runtime агентів](/uk/concepts/agent-runtimes).

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

- `id`: `"auto"`, `"pi"`, зареєстрований ідентифікатор plugin harness або підтримуваний псевдонім CLI backend. Вбудований Codex Plugin реєструє `codex`; вбудований Anthropic Plugin надає CLI backend `claude-cli`.
- `fallback`: `"pi"` або `"none"`. В `id: "auto"` пропущений fallback стандартно дорівнює `"pi"`, щоб старі конфігурації могли й надалі використовувати PI, коли жоден plugin harness не забирає запуск. У режимі явного plugin runtime, як-от `id: "codex"`, пропущений fallback стандартно дорівнює `"none"`, тож відсутній harness завершується помилкою замість тихого використання PI. Runtime overrides не успадковують fallback із ширшої області; задайте `fallback: "pi"` поруч із явним runtime, коли навмисно потрібен цей compatibility fallback. Збої вибраного plugin harness завжди показуються напряму.
- Перевизначення середовища: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` перевизначає fallback для цього процесу.
- Для розгортань лише з Codex задайте `model: "openai/gpt-5.5"` і `agentRuntime.id: "codex"`. Також можете явно задати `agentRuntime.fallback: "none"` для читабельності; це стандарт для явних plugin runtimes.
- Для розгортань Claude CLI надавайте перевагу `model: "anthropic/claude-opus-4-7"` плюс `agentRuntime.id: "claude-cli"`. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` усе ще працюють для сумісності, але нова конфігурація має зберігати вибір провайдера/моделі канонічним і розміщувати execution backend у `agentRuntime.id`.
- Старі ключі runtime-policy переписуються в `agentRuntime` командою `openclaw doctor --fix`.
- Вибір harness фіксується для кожного ідентифікатора сеансу після першого вбудованого запуску. Зміни конфігурації/середовища впливають на нові або скинуті сеанси, а не на наявний transcript. Застарілі сеанси з історією transcript, але без записаного pin, вважаються прив’язаними до PI. `/status` повідомляє ефективний runtime, наприклад `Runtime: OpenClaw Pi Default` або `Runtime: OpenAI Codex`.
- Це керує лише виконанням текстових ходів агента. Генерація медіа, vision, PDF, музика, відео та TTS усе ще використовують свої налаштування провайдера/моделі.

**Вбудовані скорочення псевдонімів** (застосовуються лише коли модель є в `agents.defaults.models`):

| Псевдонім           | Модель                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` або `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Налаштовані вами псевдоніми завжди мають пріоритет над типовими.

Моделі Z.AI GLM-4.x автоматично вмикають режим мислення, якщо ви не встановите `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI типово вмикають `tool_stream` для потокового передавання викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` на `false`, щоб вимкнути це.
Моделі Anthropic Claude 4.6 типово використовують `adaptive` thinking, якщо явний рівень мислення не задано.

### `agents.defaults.cliBackends`

Необов’язкові бекенди CLI для резервних запусків лише з текстом (без викликів інструментів). Корисно як резервний варіант, коли API-провайдери не працюють.

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

- Бекенди CLI насамперед текстові; інструменти завжди вимкнені.
- Сеанси підтримуються, коли задано `sessionArg`.
- Наскрізне передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замініть весь системний промпт, зібраний OpenClaw, фіксованим рядком. Задається на рівні типових значень (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє значення або значення лише з пробільних символів ігнорується. Корисно для контрольованих експериментів із промптами.

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

Незалежні від провайдера накладки промптів, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки для всіх провайдерів; `personality` керує лише дружнім шаром стилю взаємодії.

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
- Застарілий `plugins.entries.openai.config.personality` усе ще зчитується, коли це спільне налаштування не задано.

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

- `every`: рядок тривалості (ms/s/m/h). Типово: `30m` (автентифікація за API-ключем) або `1h` (OAuth-автентифікація). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли `false`, вилучає розділ Heartbeat із системного промпта й пропускає ін’єкцію `HEARTBEAT.md` у bootstrap-контекст. Типово: `true`.
- `suppressToolErrorWarnings`: коли `true`, пригнічує попереджувальні payload-и про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для ходу агента Heartbeat перед його перериванням. Залиште незаданим, щоб використовувати `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої доставки/DM. `allow` (типово) дозволяє доставку прямій цілі. `block` пригнічує доставку прямій цілі й видає `reason=dm-blocked`.
- `lightContext`: коли `true`, запуски Heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів робочої області.
- `isolatedSession`: коли `true`, кожен Heartbeat запускається в новому сеансі без попередньої історії розмови. Такий самий шаблон ізоляції, як у cron `sessionTarget: "isolated"`. Зменшує вартість токенів на Heartbeat приблизно зі 100 тис. до 2-5 тис. токенів.
- `skipWhenBusy`: коли `true`, запуски Heartbeat відкладаються на додаткових зайнятих лініях: робота субагента або вкладеної команди. Лінії Cron завжди відкладають Heartbeat, навіть без цього прапорця.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, Heartbeat запускають **лише ці агенти**.
- Heartbeat виконують повні ходи агента — коротші інтервали витрачають більше токенів.

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
- `provider`: id зареєстрованого compaction-провайдера Plugin. Коли задано, замість вбудованого LLM-узагальнення викликається `summarize()` провайдера. У разі збою виконується fallback до вбудованого механізму. Задання провайдера примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції compaction, перш ніж OpenClaw її перерве. Типово: `900`.
- `keepRecentTokens`: бюджет точки відсікання Pi для збереження найновішого хвоста транскрипту дослівно. Ручний `/compact` дотримується цього, коли значення явно задано; інакше ручна compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає на початок вбудовані настанови щодо збереження непрозорих ідентифікаторів під час compaction-узагальнення.
- `identifierInstructions`: необов’язковий власний текст щодо збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою для некоректно сформованого виводу в safeguard-узагальненнях. Типово ввімкнено в режимі safeguard; установіть `enabled: false`, щоб пропустити аудит.
- `postCompactionSections`: необов’язкові назви H2/H3-розділів AGENTS.md для повторної ін’єкції після compaction. Типово `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторну ін’єкцію. Коли не задано або явно задано цю типову пару, старі заголовки `Every Session`/`Safety` також приймаються як застарілий fallback.
- `model`: необов’язкове перевизначення `provider/model-id` лише для compaction-узагальнення. Використовуйте це, коли основний сеанс має зберігати одну модель, а compaction-узагальнення мають виконуватися на іншій; коли не задано, compaction використовує основну модель сеансу.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), який запускає звичайну локальну compaction перед запуском, коли активний JSONL перевищує поріг. Потребує `truncateAfterCompaction`, щоб успішна compaction могла повернутися до меншого наступного транскрипту. Вимкнено, коли не задано або дорівнює `0`.
- `notifyUser`: коли `true`, надсилає користувачу короткі сповіщення, коли compaction починається і коли завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб compaction залишалася беззвучною.
- `memoryFlush`: беззвучний агентний хід перед автоматичною compaction для збереження довготривалих спогадів. Установіть `model` на точний provider/model, як-от `ollama/qwen3:8b`, коли цей службовий хід має залишатися на локальній моделі; перевизначення не успадковує fallback-ланцюжок активного сеансу. Пропускається, коли робоча область доступна лише для читання.

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
- Обрізання спершу м’яко скорочує надмірні результати інструментів, а потім, за потреби, жорстко очищає старіші результати інструментів.

**М’яке скорочення** зберігає початок + кінець і вставляє `...` посередині.

**Жорстке очищення** замінює весь результат інструмента placeholder-ом.

Примітки:

- Блоки зображень ніколи не скорочуються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Див. [Обрізання сеансу](/uk/concepts/session-pruning), щоб дізнатися подробиці поведінки.

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
- Перевизначення каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Signal/Slack/Discord/Google Chat типово мають `minChars: 1500`.
- `humanDelay`: рандомізована пауза між блоковими відповідями. `natural` = 800–2500ms. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Див. [Потокове передавання](/uk/concepts/streaming), щоб дізнатися подробиці поведінки й фрагментації.

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

- За замовчуванням: `instant` для прямих чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для окремого сеансу: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Індикатори набору](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова ізоляція в пісочниці для вбудованого агента. Повний посібник див. у [Ізоляція в пісочниці](/uk/gateway/sandboxing).

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
          // SecretRefs / вбудований вміст також підтримуються:
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

<Accordion title="Відомості про пісочницю">

**Бекенд:**

- `docker`: локальне середовище виконання Docker (за замовчуванням)
- `ssh`: універсальне віддалене середовище виконання на базі SSH
- `openshell`: середовище виконання OpenShell

Коли вибрано `backend: "openshell"`, специфічні для середовища виконання налаштування переміщуються до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенда:**

- `target`: SSH-ціль у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (за замовчуванням: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, який використовується для робочих просторів за областю
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRefs, які OpenClaw матеріалізує в тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на базі SecretRef розв’язуються з активного знімка середовища виконання секретів до запуску сеансу пісочниці

**Поведінка SSH-бекенда:**

- один раз засіває віддалений робочий простір після створення або повторного створення
- потім залишає віддалений SSH-робочий простір канонічним
- маршрутизує `exec`, файлові інструменти та медіашляхи через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує браузерні контейнери пісочниці

**Доступ до робочого простору:**

- `none`: робочий простір пісочниці для кожної області під `~/.openclaw/sandboxes`
- `ro`: робочий простір пісочниці в `/workspace`, робочий простір агента змонтовано лише для читання в `/agent`
- `rw`: робочий простір агента змонтовано для читання/запису в `/workspace`

**Область:**

- `session`: контейнер + робочий простір для кожного сеансу
- `agent`: один контейнер + робочий простір на агента (за замовчуванням)
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

- `mirror`: засіяти віддалене середовище з локального перед exec, синхронізувати назад після exec; локальний робочий простір залишається канонічним
- `remote`: засіяти віддалене середовище один раз під час створення пісочниці, потім залишати віддалений робочий простір канонічним

У режимі `remote` локальні зміни на хості, зроблені поза OpenClaw, не синхронізуються в пісочницю автоматично після кроку засівання.
Транспортом є SSH у пісочницю OpenShell, але Plugin відповідає за життєвий цикл пісочниці та необов’язкову дзеркальну синхронізацію.

**`setupCommand`** запускається один раз після створення контейнера (через `sh -lc`). Потребує виходу в мережу, кореня з можливістю запису, користувача root.

**За замовчуванням контейнери використовують `network: "none"`** — установіть `"bridge"` (або власну мостову мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` заблоковано за замовчуванням, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний виняток).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові директорії хоста; глобальні прив’язки та прив’язки для окремих агентів об’єднуються.

**Ізольований браузер** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системний промпт. Не потребує `browser.enabled` в `openclaw.json`.
Доступ спостерігача noVNC за замовчуванням використовує автентифікацію VNC, а OpenClaw видає короткочасний URL із токеном (замість розкриття пароля у спільному URL).

- `allowHostControl: false` (за замовчуванням) блокує ізольованим сеансам націлювання на браузер хоста.
- `network` за замовчуванням дорівнює `openclaw-sandbox-browser` (виділена мостова мережа). Установлюйте `bridge` лише коли явно потрібне глобальне мостове підключення.
- `cdpSourceRange` необов’язково обмежує вхід CDP на межі контейнера до діапазону CIDR (наприклад `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові директорії хоста лише в контейнер браузера пісочниці. Коли встановлено (зокрема `[]`), замінює `docker.binds` для контейнера браузера.
- Стандартні параметри запуску визначено в `scripts/sandbox-browser-entrypoint.sh` і налаштовано для контейнерних хостів:
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
    увімкнено за замовчуванням; їх можна вимкнути за допомогою
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` повторно вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити за допомогою
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    стандартний ліміт процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Значення за замовчуванням є базовими для образу контейнера; використовуйте власний образ браузера з власною
    точкою входу, щоб змінити стандартні параметри контейнера.

</Accordion>

Ізоляція браузера в пісочниці та `sandbox.docker.binds` доступні лише для Docker.

Збирання образів:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (перевизначення для окремих агентів)

Використовуйте `agents.list[].tts`, щоб надати агенту власного постачальника TTS, голос, модель,
стиль або режим автоматичного TTS. Блок агента глибоко об’єднується поверх глобального
`messages.tts`, тож спільні облікові дані можуть залишатися в одному місці, а окремі
агенти перевизначають лише потрібні їм поля голосу або постачальника. Перевизначення активного агента
застосовується до автоматичних озвучених відповідей, `/tts audio`, `/tts status` і
інструмента агента `tts`. Приклади постачальників і порядок пріоритету див. у [Перетворення тексту на мовлення](/uk/tools/tts#per-agent-voice-overrides).

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

- `id`: стабільний id агента (обов’язково).
- `default`: коли задано кілька, перший має пріоритет (записується попередження). Якщо не задано жодного, типовим буде перший запис списку.
- `model`: рядкова форма задає суворий основний режим для окремого агента без запасної моделі; об’єктна форма `{ primary }` також сувора, якщо ви не додасте `fallbacks`. Використовуйте `{ primary, fallbacks: [...] }`, щоб увімкнути запасні моделі для цього агента, або `{ primary, fallbacks: [] }`, щоб явно задати сувору поведінку. Завдання Cron, які перевизначають лише `primary`, усе одно успадковують типові запасні моделі, якщо не задати `fallbacks: []`.
- `params`: параметри потоку для окремого агента, об’єднані поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень на кшталт `cacheRetention`, `temperature` або `maxTokens` без дублювання всього каталогу моделей.
- `tts`: необов’язкові перевизначення перетворення тексту на мовлення для окремого агента. Блок глибоко об’єднується поверх `messages.tts`, тому зберігайте спільні облікові дані провайдера й політику запасного варіанта в `messages.tts`, а тут задавайте лише специфічні для персони значення, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий список дозволених Skills для окремого агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, коли це задано; явний список замінює типові значення замість об’єднання, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень мислення для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для повідомлення або сеансу. Вибраний профіль провайдера/моделі визначає, які значення є допустимими; для Google Gemini `adaptive` зберігає динамічне мислення, кероване провайдером (`thinkingLevel` пропущено в Gemini 3/3.1, `thinkingBudget: -1` у Gemini 2.5).
- `reasoningDefault`: необов’язкова типова видимість міркування для окремого агента (`on | off | stream`). Перевизначає `agents.defaults.reasoningDefault` для цього агента, коли не задано перевизначення міркування для повідомлення або сеансу.
- `fastModeDefault`: необов’язкове типове значення швидкого режиму для окремого агента (`true | false`). Застосовується, коли не задано перевизначення швидкого режиму для повідомлення або сеансу.
- `agentRuntime`: необов’язкове низькорівневе перевизначення політики виконання для окремого агента. Використовуйте `{ id: "codex" }`, щоб зробити одного агента лише Codex, тоді як інші агенти зберігають типовий запасний варіант PI у режимі `auto`.
- `runtime`: необов’язковий дескриптор середовища виконання для окремого агента. Використовуйте `type: "acp"` з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати сеанси обгортки ACP.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених id агентів для явних цілей `sessions_spawn.agentId` (`["*"]` = будь-який; типово: лише той самий агент). Додайте id ініціатора, коли мають бути дозволені самоспрямовані виклики `agentId`.
- Запобіжник успадкування пісочниці: якщо сеанс ініціатора ізольований у пісочниці, `sessions_spawn` відхиляє цілі, які запускалися б без пісочниці.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, які пропускають `agentId` (примушує явний вибір профілю; типово: false).

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
4. `match.accountId` (точний, без peer/guild/team)
5. `match.accountId: "*"` (для всього каналу)
6. Типовий агент

У межах кожного рівня перший відповідний запис `bindings` має пріоритет.

Для записів `type: "acp"` OpenClaw визначає відповідність за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище порядок рівнів прив’язки маршруту.

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

Див. [Пісочниця й інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools), щоб дізнатися про деталі пріоритету.

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
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
  - `per-sender` (типово): кожен відправник отримує ізольований сеанс у контексті каналу.
  - `global`: усі учасники в контексті каналу спільно використовують один сеанс (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються особисті повідомлення.
  - `main`: усі особисті повідомлення спільно використовують основний сеанс.
  - `per-peer`: ізолювати за id відправника між каналами.
  - `per-channel-peer`: ізолювати за каналом + відправником (рекомендовано для багатокористувацьких вхідних).
  - `per-account-channel-peer`: ізолювати за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: зіставляє канонічні id з учасниками з префіксом провайдера для спільного використання сеансів між каналами. Команди стикування, як-от `/dock_discord`, використовують ту саму мапу, щоб перемкнути маршрут відповіді активного сеансу на іншого пов’язаного учасника каналу; див. [Стикування каналів](/uk/concepts/channel-docking).
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Коли налаштовано обидва, пріоритет має той, строк якого спливає першим. Актуальність щоденного скидання використовує `sessionStartedAt` рядка сеансу; актуальність скидання через бездіяльність використовує `lastInteractionAt`. Фонові/системні записи подій, як-от heartbeat, пробудження cron, сповіщення exec і службові записи gateway, можуть оновлювати `updatedAt`, але вони не підтримують актуальність щоденних/неактивних сеансів.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застаріле `dm` приймається як псевдонім для `direct`.
- **`parentForkMaxTokens`**: максимальне значення `totalTokens` батьківського сеансу, дозволене під час створення розгалуженого сеансу гілки (типово `100000`).
  - Якщо батьківське `totalTokens` перевищує це значення, OpenClaw запускає новий сеанс гілки замість успадкування історії транскрипту батьківського сеансу.
  - Задайте `0`, щоб вимкнути цей запобіжник і завжди дозволяти розгалуження від батьківського сеансу.
- **`mainKey`**: застаріле поле. Середовище виконання завжди використовує `"main"` для основного контейнера прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість взаємних ходів відповіді між агентами під час обмінів агент-агент (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона має пріоритет.
- **`maintenance`**: очищення сховища сеансів + елементи керування збереженням.
  - `mode`: `warn` лише видає попередження; `enforce` застосовує очищення.
  - `pruneAfter`: вікова межа для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`). Середовище виконання записує пакетне очищення з невеликим буфером верхньої межі для лімітів виробничого розміру; `openclaw sessions cleanup --enforce` застосовує ліміт негайно.
  - `rotateBytes`: застаріле й ігнорується; `openclaw doctor --fix` видаляє його зі старіших конфігурацій.
  - `resetArchiveRetention`: збереження архівів транскриптів `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; задайте `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий дисковий бюджет каталогу сеансів. У режимі `warn` записує попередження; у режимі `enforce` спершу видаляє найстаріші артефакти/сеанси.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сеансів, прив’язаних до гілок.
  - `enabled`: головний типовий перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокуса через бездіяльність у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначати)

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
      mode: "steer", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
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

Перевизначення для окремого каналу/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Визначення значення (перемагає найконкретніше): обліковий запис → канал → глобальне. `""` вимикає і зупиняє каскад. `"auto"` виводиться з `[{identity.name}]`.

**Змінні шаблону:**

| Змінна           | Опис                    | Приклад                     |
| ---------------- | ----------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі    | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера        | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень мислення | `high`, `low`, `off`        |
| `{identity.name}` | Назва ідентичності агента | (те саме, що `"auto"`)      |

Змінні нечутливі до регістру. `{think}` є псевдонімом для `{thinkingLevel}`.

### Реакція підтвердження

- За замовчуванням використовується `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для окремих каналів: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення значення: обліковий запис → канал → `messages.ackReaction` → резервне значення ідентичності.
- Область дії: `group-mentions` (за замовчуванням), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в каналах, що підтримують реакції, як-от Slack, Discord, Telegram, WhatsApp і BlueBubbles.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord не задане значення залишає реакції статусу ввімкненими, коли активні реакції підтвердження.
  У Telegram установіть його явно в `true`, щоб увімкнути реакції статусу життєвого циклу.

### Вхідне усунення брязкоту

Об’єднує швидкі текстові повідомлення без медіа від того самого відправника в один хід агента. Медіа/вкладення надсилаються негайно. Керівні команди обходять усунення брязкоту.

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

- `auto` керує стандартним режимом автоматичного TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного зведення.
- `modelOverrides` увімкнено за замовчуванням; `modelOverrides.allowProvider` за замовчуванням має значення `false` (потрібне явне ввімкнення).
- API-ключі резервно беруться з `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані провайдери мовлення належать Plugin. Якщо задано `plugins.allow`, додайте кожен Plugin провайдера TTS, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий ідентифікатор провайдера `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок визначення значення: спочатку конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` указує на кінцеву точку, що не належить OpenAI, OpenClaw трактує її як TTS-сервер, сумісний з OpenAI, і послаблює перевірку моделі/голосу.

---

## Розмова

Стандартні значення для режиму розмови (macOS/iOS/Android).

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

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кілька провайдерів розмови.
- Застарілі пласкі ключі розмови (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності й автоматично мігруються в `talk.providers.<provider>`.
- Ідентифікатори голосів резервно беруться з `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає рядки відкритого тексту або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли не налаштовано API-ключ розмови.
- `providers.*.voiceAliases` дає директивам розмови змогу використовувати зручні назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний допоміжний засіб MLX у macOS. Якщо пропущено, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX у macOS виконується через вбудований допоміжний засіб `openclaw-mlx-tts`, коли він доступний, або виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до допоміжного засобу для розробки.
- `speechLocale` задає ідентифікатор локалі BCP 47, який використовується розпізнаванням мовлення розмови в iOS/macOS. Залиште незаданим, щоб використовувати стандартне значення пристрою.
- `silenceTimeoutMs` керує тим, як довго режим розмови чекає після тиші користувача, перш ніж надіслати транскрипт. Незадане значення зберігає стандартне для платформи вікно паузи (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
