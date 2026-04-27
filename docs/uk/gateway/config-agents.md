---
read_when:
    - Налаштування стандартних параметрів агента (моделі, мислення, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування маршрутизації та прив’язок між кількома агентами
    - Налаштування сесії, доставки повідомлень і поведінки режиму talk
summary: Стандартні налаштування агента, маршрутизація між кількома агентами, сесія, повідомлення та конфігурація talk
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-04-27T14:18:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ebcc0ddd855042b8f8df818974c5cfb884ecedb871572502c27e4d6db4eed19
    source_path: gateway/config-agents.md
    workflow: 15
---

Ключі конфігурації з областю дії агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` та `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [Довідник із конфігурації](/uk/gateway/configuration-reference).

## Стандартні параметри агента

### `agents.defaults.workspace`

Стандартне значення: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, що відображається в рядку Runtime системного запиту. Якщо не задано, OpenClaw автоматично визначає його, піднімаючись вгору від робочого простору.

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
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює стандартні значення
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

- Не вказуйте `agents.defaults.skills`, щоб Skills за замовчуванням були без обмежень.
- Не вказуйте `agents.list[].skills`, щоб успадкувати стандартні значення.
- Встановіть `agents.list[].skills: []`, щоб не було жодних Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента;
  він не об’єднується зі стандартними значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли робочого простору додаються до системного запиту. Стандартне значення: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторне додавання bootstrap-контексту робочого простору, зменшуючи розмір запиту. Запуски Heartbeat і повторні спроби після Compaction усе одно перебудовують контекст.
- `"never"`: вимикає додавання bootstrap-файлів робочого простору та файлів контексту на кожному ході. Використовуйте це лише для агентів, які повністю керують життєвим циклом свого запиту (власні рушії контексту, нативні середовища виконання, які самі формують контекст, або спеціалізовані робочі процеси без bootstrap). Ходи Heartbeat і відновлення після Compaction також пропускають додавання.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів для одного bootstrap-файлу робочого простору перед обрізанням. Стандартне значення: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що додаються з усіх bootstrap-файлів робочого простору. Стандартне значення: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента текстом попередження, коли bootstrap-контекст обрізається.
Стандартне значення: `"once"`.

- `"off"`: ніколи не додає текст попередження до системного запиту.
- `"once"`: додає попередження один раз для кожного унікального підпису обрізання (рекомендовано).
- `"always"`: додає попередження під час кожного запуску, якщо є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта відповідальності за бюджет контексту

OpenClaw має кілька великих бюджетів запиту/контексту, і вони
навмисно розділені між підсистемами, а не проходять через один універсальний
параметр.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне додавання bootstrap-даних робочого простору.
- `agents.defaults.startupContext.*`:
  одноразовий початковий пролог для `/new` і `/reset`, включно з останніми
  щоденними файлами `memory/*.md`.
- `skills.limits.*`:
  стиснутий список Skills, що додається до системного запиту.
- `agents.defaults.contextLimits.*`:
  обмежені витяги під час виконання та додані блоки, якими володіє середовище виконання.
- `memory.qmd.limits.*`:
  розмір фрагментів індексованого пошуку в пам’яті та їх додавання.

Використовуйте відповідне перевизначення для конкретного агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує початковим прологом першого ходу, який додається під час порожніх запусків `/new` і `/reset`.

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

Спільні стандартні значення для обмежених поверхонь контексту під час виконання.

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

- `memoryGetMaxChars`: стандартне обмеження витягу `memory_get` перед додаванням
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: стандартне вікно рядків для `memory_get`, якщо `lines`
  не вказано.
- `toolResultMaxChars`: поточне обмеження результатів інструментів, яке використовується для збережених результатів і
  відновлення при переповненні.
- `postCompactionMaxChars`: обмеження витягу AGENTS.md, що використовується під час додавання
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

Глобальне обмеження для стиснутого списку Skills, що додається до системного запиту. Це
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

Максимальний розмір у пікселях для найдовшої сторони зображення в блоках зображень стенограми/інструментів перед викликами провайдера.
Стандартне значення: `1200`.

Нижчі значення зазвичай зменшують використання vision-токенів і розмір корисного навантаження запиту для сценаріїв із великою кількістю знімків екрана.
Вищі значення зберігають більше візуальних деталей.

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

Формат часу в системному запиті. Стандартне значення: `auto` (налаштування ОС).

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
      agentRuntime: {
        id: "pi", // pi | auto | id зареєстрованого harness, наприклад codex
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
  - Форма об’єкта задає основну модель і впорядкований список резервних моделей.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як конфігурація vision-моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/стандартна модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для прозорого OpenAI PNG/WebP-виводу.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо не вказано, `image_generate` все одно може вивести стандартне значення провайдера на основі автентифікації. Спочатку він пробує поточного стандартного провайдера, а потім — решту зареєстрованих провайдерів генерації зображень у порядку їхніх id.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо не вказано, `music_generate` все одно може вивести стандартне значення провайдера на основі автентифікації. Спочатку він пробує поточного стандартного провайдера, а потім — решту зареєстрованих провайдерів генерації музики в порядку їхніх id.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо не вказано, `video_generate` все одно може вивести стандартне значення провайдера на основі автентифікації. Спочатку він пробує поточного стандартного провайдера, а потім — решту зареєстрованих провайдерів генерації відео в порядку їхніх id.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість до 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо не вказано, інструмент PDF спочатку переходить до `imageModel`, а потім — до визначеної моделі сесії/стандартної моделі.
- `pdfMaxBytesMb`: стандартне обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: стандартна максимальна кількість сторінок, що враховується в резервному режимі витягування в інструменті `pdf`.
- `verboseDefault`: стандартний рівень докладності для агентів. Значення: `"off"`, `"on"`, `"full"`. Стандартне значення: `"off"`.
- `elevatedDefault`: стандартний рівень розширеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Стандартне значення: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ або `openai-codex/gpt-5.5` для Codex OAuth). Якщо ви не вкажете провайдера, OpenClaw спочатку спробує псевдонім, потім — унікальний збіг налаштованого провайдера для цього точного id моделі, і лише після цього повернеться до налаштованого стандартного провайдера (застаріла поведінка для сумісності, тому краще вказувати явний `provider/model`). Якщо цей провайдер більше не надає налаштовану стандартну модель, OpenClaw повернеться до першої налаштованої пари provider/model замість того, щоб показувати застаріле стандартне значення видаленого провайдера.
- `models`: каталог налаштованих моделей і список дозволених значень для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера параметри, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Безпечні зміни: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відхиляє заміни, які видалили б наявні записи зі списку дозволених значень, якщо не передано `--replace`.
  - Потоки configure/onboarding з областю дії провайдера об’єднують вибрані моделі провайдера в цю мапу й зберігають уже налаштованих, але не пов’язаних провайдерів.
  - Для прямих моделей OpenAI Responses ущільнення на стороні сервера вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити додавання `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [Ущільнення на стороні сервера OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні стандартні параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для конкретної моделі), після чого `agents.list[].params` (відповідний id агента) перевизначає за ключем. Докладніше див. у [Кешування запитів](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений JSON для прямого передавання, який об’єднується з тілами запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, додаткове тіло має пріоритет; не нативні маршрути completions усе одно потім видаляють OpenAI-специфічний `store`.
- `params.chat_template_kwargs`: аргументи шаблону чату vLLM/OpenAI-сумісного формату, які об’єднуються з тілами запитів верхнього рівня `api: "openai-completions"`. Для `vllm/nemotron-3-*` з вимкненим thinking вбудований Plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані стандартні значення, а `extra_body.chat_template_kwargs` усе ще має остаточний пріоритет. Для керування thinking у vLLM Qwen задайте `params.qwenThinkingFormat` як `"chat-template"` або `"top-level"` у записі цієї моделі.
- `params.preserveThinking`: опціональне вмикання лише для Z.AI для збереженого thinking. Якщо увімкнено й thinking активний, OpenClaw надсилає `thinking.clear_thinking: false` і повторно відтворює попередній `reasoning_content`; див. [Thinking і збережений thinking у Z.AI](/uk/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: стандартна політика низькорівневого середовища виконання агента. Якщо id не вказано, стандартно використовується OpenClaw Pi. Використовуйте `id: "pi"`, щоб примусово використовувати вбудований harness PI, `id: "auto"`, щоб дозволити зареєстрованим harness Plugin перехоплювати підтримувані моделі, зареєстрований id harness, наприклад `id: "codex"`, або підтримуваний псевдонім CLI-бекенда, наприклад `id: "claude-cli"`. Установіть `fallback: "none"`, щоб вимкнути автоматичний резервний перехід до PI. Явні середовища виконання Plugin, такі як `codex`, стандартно завершуються з помилкою без резервного варіанта, якщо ви не задасте `fallback: "pi"` у тій самій області перевизначення. Зберігайте посилання на моделі в канонічному форматі `provider/model`; вибирайте Codex, Claude CLI, Gemini CLI та інші бекенди виконання через конфігурацію runtime, а не через застарілі префікси runtime-провайдерів. Див. [Середовища виконання агентів](/uk/concepts/agent-runtimes), щоб зрозуміти, чим це відрізняється від вибору provider/model.
- Засоби запису конфігурації, які змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди add/remove для резервних варіантів), зберігають канонічну форму об’єкта й за можливості зберігають наявні списки резервних моделей.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сесіями (кожна сесія все одно серіалізується). Стандартне значення: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` керує тим, який низькорівневий виконавець запускає ходи агента. У більшості
розгортань варто залишити стандартне середовище виконання OpenClaw Pi. Використовуйте його, коли довірений
Plugin надає нативний harness, наприклад вбудований harness сервера застосунку Codex,
або коли ви хочете використовувати підтримуваний CLI-бекенд, як-от Claude CLI. Для загальної
моделі розуміння див. [Середовища виконання агентів](/uk/concepts/agent-runtimes).

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

- `id`: `"auto"`, `"pi"`, id зареєстрованого harness Plugin або підтримуваний псевдонім CLI-бекенда. Вбудований Plugin Codex реєструє `codex`; вбудований Plugin Anthropic надає CLI-бекенд `claude-cli`.
- `fallback`: `"pi"` або `"none"`. У режимі `id: "auto"` пропущений fallback стандартно дорівнює `"pi"`, щоб старі конфігурації могли й надалі використовувати PI, коли жоден harness Plugin не перехоплює запуск. У режимі явного середовища виконання Plugin, наприклад `id: "codex"`, пропущений fallback стандартно дорівнює `"none"`, щоб відсутній harness спричиняв помилку, а не тихо використовував PI. Перевизначення runtime не успадковують fallback із ширшої області; задайте `fallback: "pi"` поруч із явним runtime, якщо ви свідомо хочете таку сумісність через резервний варіант. Помилки вибраного harness Plugin завжди показуються напряму.
- Перевизначення через змінні середовища: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` перевизначає fallback для цього процесу.
- Для розгортань лише з Codex задайте `model: "openai/gpt-5.5"` і `agentRuntime.id: "codex"`. Ви також можете явно задати `agentRuntime.fallback: "none"` для зрозумілості; це стандартне значення для явних середовищ виконання Plugin.
- Для розгортань із Claude CLI надавайте перевагу `model: "anthropic/claude-opus-4-7"` разом із `agentRuntime.id: "claude-cli"`. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` усе ще працюють для сумісності, але в новій конфігурації слід зберігати вибір provider/model у канонічному вигляді, а бекенд виконання вказувати в `agentRuntime.id`.
- Старіші ключі політики runtime переписуються в `agentRuntime` командою `openclaw doctor --fix`.
- Вибір harness закріплюється за id сесії після першого вбудованого запуску. Зміни конфігурації/середовища впливають на нові або скинуті сесії, але не на наявну стенограму. Застарілі сесії з історією стенограми, але без записаного закріплення, трактуються як закріплені за PI. `/status` повідомляє ефективне середовище виконання, наприклад `Runtime: OpenClaw Pi Default` або `Runtime: OpenAI Codex`.
- Це керує лише виконанням текстових ходів агента. Генерація медіа, vision, PDF, музики, відео та TTS, як і раніше, використовують свої параметри provider/model.

**Вбудовані скорочені псевдоніми** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

| Псевдонім           | Модель                                     |
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

Для моделей Z.AI GLM-4.x режим thinking вмикається автоматично, якщо ви не встановите `--thinking off` або самі не задасте `agents.defaults.models["zai/<model>"].params.thinking`.
Для моделей Z.AI стандартно вмикається `tool_stream` для потокової передачі викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Для моделей Anthropic Claude 4.6 стандартно використовується thinking `adaptive`, якщо явно не задано рівень thinking.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних запусків лише з текстом (без викликів інструментів). Корисно як запасний варіант, коли API-провайдери не працюють.

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
          // Або використовуйте systemPromptFileArg, якщо CLI приймає прапорець для файла запиту.
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
- Пряме передавання зображень підтримується, якщо `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь системний запит, зібраний OpenClaw, фіксованим рядком. Задається на стандартному рівні (`agents.defaults.systemPromptOverride`) або для конкретного агента (`agents.list[].systemPromptOverride`). Значення для конкретного агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із запитами.

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

Незалежні від провайдера накладання запитів, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки між провайдерами; `personality` керує лише дружнім шаром стилю взаємодії.

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
- Застаріле `plugins.entries.openai.config.personality` усе ще зчитується, якщо цей спільний параметр не задано.

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
        includeSystemPromptSection: true, // стандартно: true; false пропускає розділ Heartbeat у системному запиті
        lightContext: false, // стандартно: false; true залишає лише HEARTBEAT.md із bootstrap-файлів робочого простору
        isolatedSession: false, // стандартно: false; true запускає кожен heartbeat у новій сесії (без історії розмови)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (стандартно) | block
        target: "none", // стандартно: none | варіанти: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: рядок тривалості (ms/s/m/h). Стандартне значення: `30m` (автентифікація API-ключем) або `1h` (OAuth-автентифікація). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: якщо `false`, пропускає розділ Heartbeat у системному запиті та не додає `HEARTBEAT.md` до bootstrap-контексту. Стандартне значення: `true`.
- `suppressToolErrorWarnings`: якщо `true`, пригнічує корисні навантаження попереджень про помилки інструментів під час запусків heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного ходу агента heartbeat до його переривання. Якщо не задано, використовується `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика доставки direct/DM. `allow` (стандартно) дозволяє доставку безпосередньо цілі. `block` пригнічує доставку безпосередньо цілі та виводить `reason=dm-blocked`.
- `lightContext`: якщо `true`, запуски heartbeat використовують полегшений bootstrap-контекст і залишають лише `HEARTBEAT.md` із bootstrap-файлів робочого простору.
- `isolatedSession`: якщо `true`, кожен heartbeat запускається в новій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як у Cron `sessionTarget: "isolated"`. Зменшує витрати токенів на один heartbeat приблизно зі ~100K до ~2-5K токенів.
- Для конкретного агента: задайте `agents.list[].heartbeat`. Якщо будь-який агент визначає `heartbeat`, **лише ці агенти** запускають heartbeat.
- Heartbeat запускає повні ходи агента — коротші інтервали спалюють більше токенів.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id зареєстрованого Plugin провайдера Compaction (необов’язково)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // використовується, коли identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторне додавання
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов’язкове перевизначення моделі лише для Compaction
        truncateAfterCompaction: true, // після Compaction перейти до меншого наступного JSONL
        maxActiveTranscriptBytes: "20mb", // необов’язковий поріг для локального запуску Compaction перед виконанням
        notifyUser: true, // надсилати короткі повідомлення користувачу, коли Compaction починається й завершується (стандартно: false)
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

- `mode`: `default` або `safeguard` (підсумовування частинами для довгих історій). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin провайдера Compaction. Якщо задано, замість вбудованого підсумовування LLM викликається `summarize()` цього провайдера. У разі помилки повертається до вбудованого варіанта. Встановлення провайдера примусово задає `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, після чого OpenClaw її перериває. Стандартне значення: `900`.
- `keepRecentTokens`: бюджет точки обрізання Pi для дослівного збереження найсвіжішого хвоста стенограми. Ручний `/compact` враховує це, якщо значення явно задано; інакше ручна Compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (стандартно), `off` або `custom`. `strict` додає вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий користувацький текст для збереження ідентифікаторів, що використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою при неправильно сформованому виводі для зведень safeguard. Стандартно ввімкнено в режимі safeguard; установіть `enabled: false`, щоб пропустити аудит.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md для повторного додавання після Compaction. Стандартно: `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторне додавання. Якщо не задано або явно задано цю стандартну пару, як застарілий резервний варіант також приймаються заголовки `Every Session`/`Safety`.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, коли основна сесія має залишатися на одній моделі, а зведення Compaction мають виконуватися на іншій; якщо не задано, Compaction використовує основну модель сесії.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), що запускає звичайну локальну Compaction перед виконанням, коли активний JSONL перевищує цей поріг. Потребує `truncateAfterCompaction`, щоб успішна Compaction могла перейти до меншої наступної стенограми. Вимкнено, якщо не задано або якщо значення `0`.
- `notifyUser`: якщо `true`, надсилає користувачу короткі повідомлення, коли Compaction починається й коли завершується (наприклад, «Compacting context...» і «Compaction complete»). Стандартно вимкнено, щоб Compaction залишалася тихою.
- `memoryFlush`: тихий агентний хід перед автоматичною Compaction для збереження довготривалих спогадів. Пропускається, якщо робочий простір доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // тривалість (ms/s/m/h), стандартна одиниця: хвилини
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
- `ttl` керує тим, як часто обрізання може запускатися повторно (після останнього оновлення кешу).
- Обрізання спочатку м’яко скорочує завеликі результати інструментів, а потім, за потреби, повністю очищає старіші результати інструментів.

**М’яке обрізання** зберігає початок і кінець та вставляє `...` посередині.

**Повне очищення** замінює весь результат інструмента на заповнювач.

Примітки:

- Блоки зображень ніколи не обрізаються й не очищаються.
- Співвідношення обчислюються за кількістю символів (приблизно), а не за точною кількістю токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

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

- Канали, відмінні від Telegram, потребують явного `*.blockStreaming: true`, щоб увімкнути блокові відповіді.
- Перевизначення каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для конкретного облікового запису). Для Signal/Slack/Discord/Google Chat стандартно `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоковими відповідями. `natural` = 800–2500 мс. Перевизначення для конкретного агента: `agents.list[].humanDelay`.

Докладніше про поведінку та розбиття на фрагменти див. у [Потокове передавання](/uk/concepts/streaming).

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

- Стандартні значення: `instant` для прямих чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для конкретної сесії: `session.typingMode`, `session.typingIntervalSeconds`.

Докладніше див. у [Індикатори набору](/uk/concepts/typing-indicators).

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
          // Також підтримуються SecretRef / вбудований вміст:
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

<Accordion title="Докладніше про sandbox">

**Бекенд:**

- `docker`: локальне середовище виконання Docker (стандартно)
- `ssh`: універсальне віддалене середовище виконання на основі SSH
- `openshell`: середовище виконання OpenShell

Коли вибрано `backend: "openshell"`, параметри, специфічні для середовища виконання, переносяться до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенда:**

- `target`: SSH-ціль у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (стандартно: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для робочих просторів у межах області
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRef, які OpenClaw матеріалізує в тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef визначаються з активного знімка середовища виконання секретів до початку сесії sandbox

**Поведінка SSH-бекенда:**

- один раз ініціалізує віддалений робочий простір після створення або повторного створення
- далі зберігає віддалений SSH-робочий простір як канонічний
- маршрутизує `exec`, файлові інструменти та шляхи медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує браузерні контейнери sandbox

**Доступ до робочого простору:**

- `none`: робочий простір sandbox у межах області під `~/.openclaw/sandboxes`
- `ro`: робочий простір sandbox у `/workspace`, робочий простір агента монтується лише для читання в `/agent`
- `rw`: робочий простір агента монтується для читання і запису в `/workspace`

**Область:**

- `session`: окремий контейнер + робочий простір для кожної сесії
- `agent`: один контейнер + робочий простір на агента (стандартно)
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

- `mirror`: ініціалізувати віддалене середовище з локального перед exec, синхронізувати назад після exec; локальний робочий простір залишається канонічним
- `remote`: один раз ініціалізувати віддалене середовище під час створення sandbox, а далі зберігати віддалений робочий простір як канонічний

У режимі `remote` локальні зміни на хості, внесені поза OpenClaw, не синхронізуються в sandbox автоматично після кроку ініціалізації.
Транспортом є SSH до sandbox OpenShell, але Plugin керує життєвим циклом sandbox і необов’язковою дзеркальною синхронізацією.

**`setupCommand`** запускається один раз після створення контейнера (через `sh -lc`). Потребує виходу в мережу, доступного для запису кореня та користувача root.

**Контейнери стандартно використовують `network: "none"`** — установіть `"bridge"` (або власну мережу bridge), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` стандартно заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний виняток).

**Вхідні вкладення** розміщуються в `media/inbound/*` активного робочого простору.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки для конкретного агента об’єднуються.

**Браузер у sandbox** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC додається до системного запиту. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача noVNC стандартно використовує автентифікацію VNC, а OpenClaw видає URL із короткоживучим токеном (замість розкриття пароля у спільному URL).

- `allowHostControl: false` (стандартно) блокує націлювання sandbox-сесій на браузер хоста.
- `network` стандартно дорівнює `openclaw-sandbox-browser` (окрема мережа bridge). Установлюйте `bridge` лише тоді, коли ви явно хочете глобальну зв’язність bridge.
- `cdpSourceRange` за потреби обмежує вхідний CDP-трафік на межі контейнера діапазоном CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера sandbox. Якщо задано (включно з `[]`), це замінює `docker.binds` для браузерного контейнера.
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
  - `--disable-extensions` (стандартно ввімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    стандартно ввімкнені, і їх можна вимкнути за допомогою
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо це потрібно для використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    стандартне обмеження процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Стандартні значення є базовими для образу контейнера; використовуйте власний образ браузера з власною
    точкою входу, щоб змінити стандартні параметри контейнера.

</Accordion>

Ізоляція браузера та `sandbox.docker.binds` доступні лише для Docker.

Зібрати образи:

```bash
scripts/sandbox-setup.sh           # основний образ sandbox
scripts/sandbox-browser-setup.sh   # необов’язковий образ браузера
```

### `agents.list` (перевизначення для конкретного агента)

Використовуйте `agents.list[].tts`, щоб надати агенту власного TTS-провайдера, голос, модель,
стиль або режим автоматичного TTS. Блок агента виконує глибоке злиття поверх глобального
`messages.tts`, тож спільні облікові дані можуть лишатися в одному місці, а окремі
агенти перевизначатимуть лише потрібні їм поля голосу або провайдера. Перевизначення
активного агента застосовується до автоматичних озвучених відповідей, `/tts audio`, `/tts status`
та агентного інструмента `tts`. Приклади провайдерів і пріоритети див. у [Синтез мовлення](/uk/tools/tts#per-agent-voice-overrides).

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
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // перевизначає відповідні defaults.models params за ключем
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
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
- `default`: якщо задано кілька, перемагає перший (записується попередження). Якщо не задано жодного, стандартним є перший елемент списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні резервні моделі). Завдання Cron, які перевизначають лише `primary`, усе ще успадковують стандартні резервні моделі, якщо ви не встановите `fallbacks: []`.
- `params`: параметри потоку для конкретного агента, які об’єднуються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для перевизначень, специфічних для агента, наприклад `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `tts`: необов’язкові перевизначення синтезу мовлення для конкретного агента. Блок виконує глибоке злиття поверх `messages.tts`, тому зберігайте спільні облікові дані провайдера та політику резервних варіантів у `messages.tts`, а тут задавайте лише значення, специфічні для персонажа, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий список дозволених Skills для конкретного агента. Якщо не задано, агент успадковує `agents.defaults.skills`, якщо його встановлено; явний список замінює стандартні значення замість злиття, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий стандартний рівень thinking для конкретного агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, якщо не задано перевизначення для конкретного повідомлення або сесії. Вибраний профіль провайдера/моделі визначає, які значення є допустимими; для Google Gemini `adaptive` зберігає динамічний thinking, яким керує провайдер (`thinkingLevel` не вказується для Gemini 3/3.1, `thinkingBudget: -1` для Gemini 2.5).
- `reasoningDefault`: необов’язковий стандартний режим видимості reasoning для конкретного агента (`on | off | stream`). Застосовується, якщо не задано перевизначення reasoning для конкретного повідомлення або сесії.
- `fastModeDefault`: необов’язкове стандартне значення швидкого режиму для конкретного агента (`true | false`). Застосовується, якщо не задано перевизначення швидкого режиму для конкретного повідомлення або сесії.
- `agentRuntime`: необов’язкове перевизначення політики низькорівневого середовища виконання для конкретного агента. Використовуйте `{ id: "codex" }`, щоб зробити один агент лише Codex, тоді як інші агенти зберігатимуть стандартний резервний варіант PI в режимі `auto`.
- `runtime`: необов’язковий дескриптор середовища виконання для конкретного агента. Використовуйте `type: "acp"` разом зі стандартними значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має стандартно використовувати сесії harness ACP.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- `identity` виводить стандартні значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених id агентів для явних цілей `sessions_spawn.agentId` (`["*"]` = будь-який; стандартно: лише той самий агент). Додайте id запитувача, якщо потрібно дозволити самоспрямовані виклики `agentId`.
- Захист успадкування sandbox: якщо сесія запитувача працює в sandbox, `sessions_spawn` відхиляє цілі, які запускалися б без sandbox.
- `subagents.requireAgentId`: якщо `true`, блокує виклики `sessions_spawn`, у яких пропущено `agentId` (примушує до явного вибору профілю; стандартно: false).

---

## Маршрутизація між кількома агентами

Запускайте кількох ізольованих агентів в одному Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

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

### Поля зіставлення binding

- `type` (необов’язково): `route` для звичайної маршрутизації (якщо type відсутній, стандартно використовується route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; якщо пропущено = стандартний обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічно для каналу)
- `acp` (необов’язково; лише для записів `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок зіставлення:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (на рівні всього каналу)
6. Стандартний агент

У межах кожного рівня перемагає перший запис `bindings`, що збігся.

Для записів `type: "acp"` OpenClaw виконує визначення за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище порядок рівнів прив’язки route.

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

<Accordion title="Інструменти + робочий простір лише для читання">

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

Докладніше про пріоритети див. у [Sandbox і інструменти Multi-Agent](/uk/tools/multi-agent-sandbox-tools).

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
    parentForkMaxTokens: 100000, // пропустити розгалуження батьківської гілки вище цієї кількості токенів (0 вимикає)
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
      idleHours: 24, // стандартне автоматичне зняття фокуса після неактивності в годинах (`0` вимикає)
      maxAgeHours: 0, // стандартний жорсткий максимальний вік у годинах (`0` вимикає)
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

<Accordion title="Докладніше про поля сесії">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (стандартно): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише тоді, коли задумано спільний контекст).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM використовують спільну основну сесію.
  - `per-peer`: ізоляція за id відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для вхідних скриньок із кількома користувачами).
  - `per-account-channel-peer`: ізоляція за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: мапа канонічних id на peer із префіксом провайдера для спільного використання сесії між каналами.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва, спрацьовує той, строк якого настане першим. Актуальність щоденного скидання використовує `sessionStartedAt` рядка сесії; актуальність скидання через неактивність використовує `lastInteractionAt`. Фонові/системні записи, як-от heartbeat, пробудження Cron, сповіщення exec і службові записи gateway, можуть оновлювати `updatedAt`, але вони не підтримують актуальність щоденних/неактивних сесій.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застаріле `dm` приймається як псевдонім для `direct`.
- **`parentForkMaxTokens`**: максимальне значення `totalTokens` батьківської сесії, дозволене під час створення сесії розгалуженого треду (стандартно `100000`).
  - Якщо `totalTokens` батьківської сесії перевищує це значення, OpenClaw починає нову сесію треду замість успадкування історії стенограми батьківської сесії.
  - Установіть `0`, щоб вимкнути цей захист і завжди дозволяти розгалуження від батьківської сесії.
- **`mainKey`**: застаріле поле. Середовище виконання завжди використовує `"main"` для основного кошика прямих чатів.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість відповідей у відповідь між агентами під час обміну agent-to-agent (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжки ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перший deny має пріоритет.
- **`maintenance`**: керування очищенням і зберіганням сховища сесій.
  - `mode`: `warn` лише виводить попередження; `enforce` застосовує очищення.
  - `pruneAfter`: граничний вік для застарілих записів (стандартно `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (стандартно `500`). Записи середовища виконання застосовують пакетне очищення з невеликим буфером верхньої межі для обмежень розміру production; `openclaw sessions cleanup --enforce` застосовує обмеження негайно.
  - `rotateBytes`: ротація `sessions.json`, коли він перевищує цей розмір (стандартно `10mb`).
  - `resetArchiveRetention`: термін зберігання архівів стенограм `*.reset.<timestamp>`. Стандартно дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий бюджет дискового простору для каталогу сесій. У режимі `warn` він записує попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Стандартно дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні стандартні значення для функцій сесій, прив’язаних до тредів.
  - `enabled`: головний стандартний перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: стандартне автоматичне зняття фокуса після неактивності в годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: стандартний жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначати)

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

Визначення (перемагає найспецифічніше): обліковий запис → канал → глобальне. `""` вимикає та зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна            | Опис                         | Приклад                     |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі         | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера             | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень thinking     | `high`, `low`, `off`        |
| `{identity.name}` | Назва identity агента        | (те саме, що й `"auto"`)    |

Змінні не чутливі до регістру. `{think}` є псевдонімом для `{thinkingLevel}`.

### Реакція-підтвердження

- Стандартно використовується `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервне значення з identity.
- Область: `group-mentions` (стандартно), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в каналах, які підтримують реакції, як-от Slack, Discord, Telegram, WhatsApp і BlueBubbles.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord, якщо не задано, реакції статусу залишаються ввімкненими, коли активні реакції-підтвердження.
  У Telegram явно встановіть значення `true`, щоб увімкнути реакції статусу життєвого циклу.

### Вхідний debounce

Об’єднує швидкі текстові повідомлення від одного відправника в один хід агента. Медіа/вкладення скидаються негайно. Команди керування оминають debounce.

### TTS (синтез мовлення)

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

- `auto` керує стандартним режимом автоматичного TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначити локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` стандартно ввімкнено; `modelOverrides.allowProvider` стандартно має значення `false` (явне ввімкнення).
- API-ключі використовують резервні значення `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані провайдери мовлення належать Plugin. Якщо задано `plugins.allow`, додайте кожен Plugin провайдера TTS, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий id провайдера `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на кінцеву точку, що не належить OpenAI, OpenClaw трактує її як OpenAI-сумісний TTS-сервер і послаблює валідацію моделі/голосу.

---

## Talk

Стандартні параметри для режиму Talk (macOS/iOS/Android).

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

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кілька провайдерів Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) підтримуються лише для сумісності та автоматично переносяться до `talk.providers.<provider>`.
- Voice ID використовують резервні значення `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає прості текстові рядки або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли не налаштовано жодного API-ключа Talk.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати дружні назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний помічник MLX у macOS. Якщо не задано, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX у macOS виконується через вбудований помічник `openclaw-mlx-tts`, якщо він є, або через виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `speechLocale` задає id локалі BCP 47, що використовується розпізнаванням мовлення Talk в iOS/macOS. Залиште незаданим, щоб використовувати стандартну локаль пристрою.
- `silenceTimeoutMs` керує тим, скільки часу режим Talk чекає після тиші користувача, перш ніж надіслати стенограму. Якщо не задано, використовується стандартне для платформи вікно паузи (`700 ms` у macOS і Android, `900 ms` в iOS).

---

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
