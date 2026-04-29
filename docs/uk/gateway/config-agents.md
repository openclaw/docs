---
read_when:
    - Налаштування типових параметрів агента (моделі, мислення, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування багатоагентної маршрутизації та прив’язок
    - Налаштування сеансу, доставлення повідомлень і поведінки режиму розмови
summary: Типові налаштування агента, багатоагентна маршрутизація, конфігурація сеансу, повідомлень і talk
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-04-29T10:40:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76d15861fc92ede737d7d37aeb340eeca42e834b9b2d94f81592825247fd453c
    source_path: gateway/config-agents.md
    workflow: 16
---

Ключі конфігурації з областю дії агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Типові налаштування агентів

### `agents.defaults.workspace`

Типово: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, який показується в рядку Runtime системного промпта. Якщо не задано, OpenClaw автоматично визначає його, рухаючись угору від робочої області.

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

- Не вказуйте `agents.defaults.skills`, щоб Skills типово були необмеженими.
- Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
- Задайте `agents.list[].skills: []`, щоб не було Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення файлів початкового налаштування робочої області (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли файли початкового налаштування робочої області додаються в системний промпт. Типово: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторне додавання початкового налаштування робочої області, зменшуючи розмір промпта. Запуски Heartbeat і повторні спроби після Compaction усе одно перебудовують контекст.
- `"never"`: вимикає початкове налаштування робочої області та додавання контекстних файлів на кожному ході. Використовуйте це лише для агентів, які повністю керують власним життєвим циклом промпта (власні рушії контексту, нативні середовища виконання, що будують власний контекст, або спеціалізовані робочі процеси без початкового налаштування). Ходи Heartbeat і відновлення після Compaction також пропускають додавання.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на файл початкового налаштування робочої області перед обрізанням. Типово: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, доданих з усіх файлів початкового налаштування робочої області. Типово: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує текстом попередження, видимим агенту, коли контекст початкового налаштування обрізано.
Типово: `"once"`.

- `"off"`: ніколи не додавати текст попередження в системний промпт.
- `"once"`: додавати попередження один раз для кожного унікального підпису обрізання (рекомендовано).
- `"always"`: додавати попередження під час кожного запуску, коли є обрізання.

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
  звичайне додавання початкового налаштування робочої області.
- `agents.defaults.startupContext.*`:
  одноразова преамбула запуску моделі під час скидання/запуску, зокрема нещодавні щоденні
  файли `memory/*.md`. Прості команди чату `/new` і `/reset`
  підтверджуються без виклику моделі.
- `skills.limits.*`:
  компактний список Skills, доданий у системний промпт.
- `agents.defaults.contextLimits.*`:
  обмежені фрагменти середовища виконання та додані блоки, якими володіє середовище виконання.
- `memory.qmd.limits.*`:
  розмір фрагмента індексованого пошуку в пам’яті та додавання.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує преамбулою запуску першого ходу, що додається під час запусків моделі після скидання/запуску.
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
  не вказано.
- `toolResultMaxChars`: обмеження результатів інструментів у реальному часі, що використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: обмеження фрагмента AGENTS.md, що використовується під час додавання
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

Глобальне обмеження для компактного списку Skills, доданого в системний промпт. Це
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

Максимальний розмір у пікселях для найдовшої сторони зображення в блоках зображень стенограми/інструментів перед викликами провайдера.
Типово: `1200`.

Нижчі значення зазвичай зменшують використання токенів зору та розмір корисного навантаження запиту для запусків із великою кількістю знімків екрана.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного промпта (не для часових позначок повідомлень). Резервно використовується часовий пояс хоста.

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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
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
  - Рядкова форма задає лише основну модель.
  - Об’єктна форма задає основну модель і впорядковані моделі для аварійного перемикання.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація моделі зору.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати вхідні зображення.
  - Надавайте перевагу явним посиланням `provider/model`. Голі ідентифікатори приймаються для сумісності; якщо голий ідентифікатор однозначно відповідає налаштованому запису з підтримкою зображень у `models.providers.*.models`, OpenClaw уточнює його до цього провайдера. Неоднозначні налаштовані збіги потребують явного префікса провайдера.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для виводу OpenAI PNG/WebP із прозорим тлом.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо пропущено, `image_generate` все одно може вивести типовий провайдер, підкріплений автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації зображень у порядку ідентифікаторів провайдерів.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо пропущено, `music_generate` все одно може вивести типовий провайдер, підкріплений автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації музики в порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо пропущено, `video_generate` все одно може вивести типовий провайдер, підкріплений автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації відео в порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо пропущено, інструмент PDF спочатку відступає до `imageModel`, а потім до розв’язаної моделі сесії/типової моделі.
- `pdfMaxBytesMb`: типовий ліміт розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, яку враховує резервний режим витягання в інструменті `pdf`.
- `verboseDefault`: типовий рівень докладності для агентів. Значення: `"off"`, `"on"`, `"full"`. Типово: `"off"`.
- `elevatedDefault`: типовий рівень розширеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типово: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ або `openai-codex/gpt-5.5` для Codex OAuth). Якщо ви пропускаєте провайдера, OpenClaw спочатку пробує псевдонім, потім унікальний збіг налаштованого провайдера для цього точного ідентифікатора моделі, і лише після цього відступає до налаштованого типового провайдера (застаріла поведінка сумісності, тому надавайте перевагу явному `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw відступає до першого налаштованого провайдера/моделі замість того, щоб показувати застарілу типову модель вилученого провайдера.
- `models`: налаштований каталог моделей і список дозволених моделей для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Безпечні редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи. `config set` відхиляє заміни, які видалили б наявні записи списку дозволених, якщо ви не передасте `--replace`.
  - Потоки налаштування/початкового налаштування з областю дії провайдера об’єднують вибрані моделі провайдера в цю мапу та зберігають уже налаштованих непов’язаних провайдерів.
  - Для прямих моделей OpenAI Responses серверна Compaction вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити вставлення `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [серверна Compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні типові параметри провайдера, застосовані до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет об’єднання `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для окремої моделі), потім `agents.list[].params` (для відповідного ідентифікатора агента) перевизначає за ключем. Докладніше див. [кешування підказок](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений наскрізний JSON, що об’єднується в тіла запитів `api: "openai-completions"` для проксі, сумісних з OpenAI. Якщо він конфліктує зі згенерованими ключами запиту, перемагає додаткове тіло; ненативні маршрути completions після цього все одно вилучають властивий лише OpenAI `store`.
- `params.chat_template_kwargs`: аргументи шаблону чату, сумісні з vLLM/OpenAI, що об’єднуються в тіла запитів верхнього рівня `api: "openai-completions"`. Для `vllm/nemotron-3-*` з вимкненим thinking вбудований Plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані типові значення, а `extra_body.chat_template_kwargs` все одно має остаточний пріоритет. Для керування thinking Qwen у vLLM задайте `params.qwenThinkingFormat` як `"chat-template"` або `"top-level"` у цьому записі моделі.
- `compat.supportedReasoningEfforts`: список зусиль reasoning, сумісних з OpenAI, для окремої моделі. Додайте `"xhigh"` для кастомних кінцевих точок, які справді його приймають; після цього OpenClaw показує `/think xhigh` у меню команд, рядках сесій Gateway, валідації патчів сесій, валідації CLI агента та валідації `llm-task` для цього налаштованого провайдера/моделі. Використовуйте `compat.reasoningEffortMap`, коли бекенд потребує специфічного для провайдера значення для канонічного рівня.
- `params.preserveThinking`: опція лише для Z.AI для збереженого thinking. Коли ввімкнено і thinking увімкнений, OpenClaw надсилає `thinking.clear_thinking: false` і повторно відтворює попередній `reasoning_content`; див. [thinking Z.AI і збережений thinking](/uk/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: типова низькорівнева політика виконання агента. Пропущений ідентифікатор типово означає OpenClaw Pi. Використовуйте `id: "pi"`, щоб примусово вибрати вбудований стенд PI, `id: "auto"`, щоб дозволити зареєстрованим стендам Plugin заявляти підтримувані моделі, зареєстрований ідентифікатор стенда, як-от `id: "codex"`, або підтримуваний псевдонім CLI-бекенда, як-от `id: "claude-cli"`. Задайте `fallback: "none"`, щоб вимкнути автоматичний резерв PI. Явні середовища виконання Plugin, як-от `codex`, типово закриваються з помилкою, якщо ви не задасте `fallback: "pi"` у тій самій області перевизначення. Зберігайте посилання на моделі канонічними як `provider/model`; вибирайте Codex, Claude CLI, Gemini CLI та інші бекенди виконання через конфігурацію середовища виконання, а не через застарілі префікси провайдера середовища виконання. Див. [середовища виконання агентів](/uk/concepts/agent-runtimes), щоб зрозуміти, чим це відрізняється від вибору провайдера/моделі.
- Записувачі конфігурації, які змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення резервних моделей), зберігають канонічну об’єктну форму та за можливості зберігають наявні списки резервних моделей.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сесіями (кожна сесія все одно серіалізована). Типово: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` керує тим, який низькорівневий виконавець запускає ходи агента. Більшість
розгортань мають залишати типове середовище виконання OpenClaw Pi. Використовуйте його, коли довірений
Plugin надає нативний стенд, наприклад вбудований стенд сервера застосунку Codex,
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

- `id`: `"auto"`, `"pi"`, зареєстрований ідентифікатор стенда Plugin або підтримуваний псевдонім CLI-бекенда. Вбудований Plugin Codex реєструє `codex`; вбудований Plugin Anthropic надає CLI-бекенд `claude-cli`.
- `fallback`: `"pi"` або `"none"`. У `id: "auto"` пропущений резерв типово дорівнює `"pi"`, щоб старі конфігурації могли й далі використовувати PI, коли жоден стенд Plugin не заявляє запуск. У режимі явного середовища виконання Plugin, як-от `id: "codex"`, пропущений резерв типово дорівнює `"none"`, щоб відсутній стенд завершувався помилкою, а не непомітно використовував PI. Перевизначення середовища виконання не успадковують резерв із ширшої області; задавайте `fallback: "pi"` разом із явним середовищем виконання, коли навмисно хочете цей резерв сумісності. Збої вибраного стенда Plugin завжди показуються напряму.
- Перевизначення середовища: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` перевизначає резерв для цього процесу.
- Для розгортань лише з Codex задайте `model: "openai/gpt-5.5"` і `agentRuntime.id: "codex"`. Ви також можете явно задати `agentRuntime.fallback: "none"` для читабельності; це типове значення для явних середовищ виконання Plugin.
- Для розгортань Claude CLI надавайте перевагу `model: "anthropic/claude-opus-4-7"` плюс `agentRuntime.id: "claude-cli"`. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` все ще працюють для сумісності, але нова конфігурація має зберігати вибір провайдера/моделі канонічним і розміщувати бекенд виконання в `agentRuntime.id`.
- Старі ключі політики середовища виконання переписуються в `agentRuntime` командою `openclaw doctor --fix`.
- Вибір стенда закріплюється за ідентифікатором сесії після першого вбудованого запуску. Зміни конфігурації/середовища впливають на нові або скинуті сесії, а не на наявний transcript. Застарілі сесії з історією transcript, але без записаного закріплення, вважаються закріпленими за PI. `/status` повідомляє ефективне середовище виконання, наприклад `Runtime: OpenClaw Pi Default` або `Runtime: OpenAI Codex`.
- Це керує лише виконанням текстових ходів агента. Генерація медіа, зір, PDF, музика, відео та TTS і далі використовують свої налаштування провайдера/моделі.

**Вбудовані скорочення псевдонімів** (застосовуються лише коли модель є в `agents.defaults.models`):

| Псевдонім           | Модель                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Ваші налаштовані псевдоніми завжди мають пріоритет над типовими.

Моделі Z.AI GLM-4.x автоматично вмикають режим мислення, якщо ви не встановите `--thinking off` або самостійно не задасте `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI типово вмикають `tool_stream` для потокового передавання викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` на `false`, щоб вимкнути це.
Моделі Anthropic Claude 4.6 типово використовують `adaptive` thinking, коли явний рівень thinking не задано.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних текстових запусків (без викликів інструментів). Корисно як запасний варіант, коли API-провайдери дають збій.

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

- CLI-бекенди насамперед текстові; інструменти завжди вимкнені.
- Сеанси підтримуються, коли задано `sessionArg`.
- Наскрізне передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замініть увесь системний промпт, зібраний OpenClaw, фіксованим рядком. Задається на рівні типових параметрів (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із промптами.

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

Незалежні від провайдера накладки промптів, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний поведінковий контракт у різних провайдерів; `personality` керує лише дружнім шаром стилю взаємодії.

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
- Застарілий `plugins.entries.openai.config.personality` усе ще читається, коли цей спільний параметр не задано.

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

- `every`: рядок тривалості (ms/s/m/h). Типово: `30m` (автентифікація через API-ключ) або `1h` (OAuth-автентифікація). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли `false`, вилучає розділ Heartbeat із системного промпта й пропускає ін’єкцію `HEARTBEAT.md` у початковий контекст. Типово: `true`.
- `suppressToolErrorWarnings`: коли `true`, пригнічує payload-и попереджень про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний дозволений час у секундах для ходу агента Heartbeat перед перериванням. Не задавайте, щоб використовувати `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика доставки напряму/DM. `allow` (типово) дозволяє доставку прямій цілі. `block` пригнічує доставку прямій цілі й виводить `reason=dm-blocked`.
- `lightContext`: коли `true`, запуски Heartbeat використовують легкий початковий контекст і зберігають лише `HEARTBEAT.md` із початкових файлів робочого простору.
- `isolatedSession`: коли `true`, кожен Heartbeat запускається в новому сеансі без попередньої історії розмови. Такий самий шаблон ізоляції, як у cron `sessionTarget: "isolated"`. Зменшує витрати токенів на Heartbeat із ~100K до ~2-5K токенів.
- `skipWhenBusy`: коли `true`, запуски Heartbeat відкладаються за наявності додаткових зайнятих ліній: роботи субагента або вкладених команд. Лінії Cron завжди відкладають Heartbeat, навіть без цього прапорця.
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

- `mode`: `default` або `safeguard` (фрагментоване підсумовування для довгих історій). Див. [Compaction](/uk/concepts/compaction).
- `provider`: ідентифікатор зареєстрованого provider plugin Compaction. Коли задано, замість вбудованого LLM-підсумовування викликається `summarize()` провайдера. У разі збою повертається до вбудованого варіанта. Задання провайдера примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, перш ніж OpenClaw перерве її. Типово: `900`.
- `keepRecentTokens`: бюджет точки відсікання Pi для збереження найновішого хвоста транскрипта дослівно. Ручний `/compact` враховує це, коли явно задано; інакше ручна Compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає на початку вбудовані настанови щодо збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий користувацький текст збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою при некоректно сформованому виводі для підсумків safeguard. Типово ввімкнено в режимі safeguard; задайте `enabled: false`, щоб пропустити аудит.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md для повторної ін’єкції після Compaction. Типово `["Session Startup", "Red Lines"]`; задайте `[]`, щоб вимкнути повторну ін’єкцію. Коли не задано або явно задано цю типову пару, старіші заголовки `Every Session`/`Safety` також приймаються як застарілий fallback.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, коли основний сеанс має зберігати одну модель, а підсумки Compaction мають виконуватися на іншій; коли не задано, Compaction використовує основну модель сеансу.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), який запускає звичайну локальну Compaction перед запуском, коли активний JSONL перевищує поріг. Потребує `truncateAfterCompaction`, щоб успішна Compaction могла повернутися до меншого наступного транскрипта. Вимкнено, коли не задано або дорівнює `0`.
- `notifyUser`: коли `true`, надсилає користувачу короткі сповіщення на початку й після завершення Compaction (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб Compaction була тихою.
- `memoryFlush`: тихий агентний хід перед автоматичною Compaction для збереження довготривалих спогадів. Задайте `model` як точний провайдер/модель, наприклад `ollama/qwen3:8b`, коли цей службовий хід має залишатися на локальній моделі; перевизначення не успадковує fallback-ланцюг активного сеансу. Пропускається, коли робочий простір доступний лише для читання.

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
- `ttl` керує тим, як часто обрізання може запускатися знову (після останнього дотику до кешу).
- Обрізання спершу м’яко скорочує завеликі результати інструментів, а потім, якщо потрібно, жорстко очищає старіші результати інструментів.

**М’яке скорочення** зберігає початок + кінець і вставляє `...` посередині.

**Жорстке очищення** замінює весь результат інструмента на placeholder.

Примітки:

- Блоки зображень ніколи не скорочуються й не очищаються.
- Коефіцієнти базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Див. [Session Pruning](/uk/concepts/session-pruning), щоб дізнатися подробиці поведінки.

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
- `humanDelay`: рандомізована пауза між блоковими відповідями. `natural` = 800–2500ms. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Див. [Streaming](/uk/concepts/streaming), щоб дізнатися подробиці поведінки й фрагментації.

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
- Перевизначення для окремого сеансу: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Typing Indicators](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова ізоляція для вбудованого агента. Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing).

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

<Accordion title="Відомості про пісочницю">

**Бекенд:**

- `docker`: локальне середовище виконання Docker (типово)
- `ssh`: універсальне віддалене середовище виконання на базі SSH
- `openshell`: середовище виконання OpenShell

Коли вибрано `backend: "openshell"`, параметри, специфічні для середовища виконання, переносяться до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенду:**

- `target`: SSH-ціль у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для робочих просторів за областями
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRefs, які OpenClaw матеріалізує в тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на базі SecretRef розв’язуються з активного знімка середовища виконання секретів до запуску сесії пісочниці

**Поведінка SSH-бекенду:**

- одноразово засіває віддалений робочий простір після створення або повторного створення
- потім тримає віддалений SSH-робочий простір канонічним
- маршрутизує `exec`, файлові інструменти та шляхи до медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує браузерні контейнери пісочниці

**Доступ до робочого простору:**

- `none`: робочий простір пісочниці для окремої області в `~/.openclaw/sandboxes`
- `ro`: робочий простір пісочниці в `/workspace`, робочий простір агента змонтовано лише для читання в `/agent`
- `rw`: робочий простір агента змонтовано для читання/запису в `/workspace`

**Область:**

- `session`: контейнер і робочий простір для окремої сесії
- `agent`: один контейнер і робочий простір на агента (типово)
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

- `mirror`: засіває віддалений простір із локального перед exec, синхронізує назад після exec; локальний робочий простір залишається канонічним
- `remote`: засіває віддалений простір один раз під час створення пісочниці, потім тримає віддалений робочий простір канонічним

У режимі `remote` локальні правки на хості, зроблені поза OpenClaw, не синхронізуються в пісочницю автоматично після етапу засівання.
Транспортом є SSH у пісочницю OpenShell, але Plugin керує життєвим циклом пісочниці та необов’язковою дзеркальною синхронізацією.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потребує вихідного доступу до мережі, кореня з правом запису та користувача root.

**Контейнери типово використовують `network: "none"`** — встановіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` заблоковано типово, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний обхід).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки для окремих агентів об’єднуються.

**Ізольований браузер** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC додається до системного промпта. Не потребує `browser.enabled` в `openclaw.json`.
Доступ спостерігача noVNC типово використовує автентифікацію VNC, а OpenClaw випускає короткочасний URL із токеном (замість розкриття пароля в спільному URL).

- `allowHostControl: false` (типово) блокує націлювання ізольованих сесій на браузер хоста.
- `network` типово має значення `openclaw-sandbox-browser` (виділена bridge-мережа). Установлюйте `bridge` лише тоді, коли вам явно потрібна глобальна bridge-зв’язність.
- `cdpSourceRange` необов’язково обмежує вхід CDP на межі контейнера до діапазону CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера пісочниці. Якщо задано (включно з `[]`), це замінює `docker.binds` для контейнера браузера.
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
  - `--disable-extensions` (типово ввімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    типово ввімкнені й можуть бути вимкнені за допомогою
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` повторно вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити за допомогою
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; встановіть `0`, щоб використовувати
    типове обмеження процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовою конфігурацією образу контейнера; використовуйте власний образ браузера з власною
    точкою входу, щоб змінити типові параметри контейнера.

</Accordion>

Ізоляція браузера в пісочниці та `sandbox.docker.binds` працюють лише з Docker.

Зібрати образи:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (перевизначення для окремого агента)

Використовуйте `agents.list[].tts`, щоб задати агенту власного провайдера TTS, голос, модель,
стиль або режим автоматичного TTS. Блок агента глибоко об’єднується поверх глобального
`messages.tts`, тож спільні облікові дані можуть лишатися в одному місці, а окремі
агенти перевизначають лише потрібні їм поля голосу або провайдера. Перевизначення активного агента
застосовується до автоматичних озвучених відповідей, `/tts audio`, `/tts status` і
інструмента агента `tts`. Див. [Перетворення тексту на мовлення](/uk/tools/tts#per-agent-voice-overrides)
для прикладів провайдерів і пріоритету.

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
- `default`: коли задано кілька, перший має пріоритет (записується попередження). Якщо не задано жодного, типовим є перший запис у списку.
- `model`: рядкова форма задає строгий основний параметр для окремого агента без fallback моделі; об’єктна форма `{ primary }` також строга, якщо ви не додасте `fallbacks`. Використовуйте `{ primary, fallbacks: [...] }`, щоб увімкнути fallback для цього агента, або `{ primary, fallbacks: [] }`, щоб явно задати строгу поведінку. Завдання Cron, які перевизначають лише `primary`, усе ще успадковують типові fallback, якщо ви не задасте `fallbacks: []`.
- `params`: параметри потоку для окремого агента, об’єднані поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для перевизначень, специфічних для агента, як-от `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `tts`: необов’язкові перевизначення перетворення тексту на мовлення для окремого агента. Блок глибоко об’єднується поверх `messages.tts`, тому зберігайте спільні облікові дані провайдера та політику fallback у `messages.tts`, а тут задавайте лише специфічні для персони значення, як-от provider, voice, model, style або автоматичний режим.
- `skills`: необов’язковий список дозволених Skills для окремого агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, коли це задано; явний список замінює типові значення замість об’єднання, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень мислення для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для окремого повідомлення або сесії. Вибраний профіль провайдера/моделі контролює, які значення є дійсними; для Google Gemini `adaptive` зберігає динамічне мислення, кероване провайдером (`thinkingLevel` пропущено на Gemini 3/3.1, `thinkingBudget: -1` на Gemini 2.5).
- `reasoningDefault`: необов’язкова типова видимість reasoning для окремого агента (`on | off | stream`). Застосовується, коли не задано перевизначення reasoning для окремого повідомлення або сесії.
- `fastModeDefault`: необов’язкове типове значення швидкого режиму для окремого агента (`true | false`). Застосовується, коли не задано перевизначення швидкого режиму для окремого повідомлення або сесії.
- `agentRuntime`: необов’язкове низькорівневе перевизначення політики runtime для окремого агента. Використовуйте `{ id: "codex" }`, щоб зробити одного агента лише Codex, тоді як інші агенти зберігають типовий fallback PI у режимі `auto`.
- `runtime`: необов’язковий дескриптор runtime для окремого агента. Використовуйте `type: "acp"` з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати сесії harness ACP.
- `identity.avatar`: шлях відносно workspace, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених id агентів для явних цілей `sessions_spawn.agentId` (`["*"]` = будь-який; типово: лише той самий агент). Додайте id запитувача, коли самонацілені виклики `agentId` мають бути дозволені.
- Запобіжник успадкування пісочниці: якщо сесія запитувача працює в пісочниці, `sessions_spawn` відхиляє цілі, які запускалися б без пісочниці.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, які пропускають `agentId` (змушує явно вибирати профіль; типово: false).

---

## Маршрутизація між кількома агентами

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

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній type типово означає route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; пропущено = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; залежить від каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок відповідності:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (на весь канал)
6. Типовий агент

У межах кожного рівня перший відповідний запис `bindings` має пріоритет.

Для записів `type: "acp"` OpenClaw визначає відповідність за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище рівневий порядок прив’язок маршруту.

### Профілі доступу для окремого агента

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

<Accordion title="Інструменти лише для читання + workspace">

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

Докладніше про пріоритети див. у [пісочниці й інструментах для кількох агентів](/uk/tools/multi-agent-sandbox-tools).

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

<Accordion title="Відомості про поля сесії">

- **`scope`**: базова стратегія групування сесій для контекстів групових чатів.
  - `per-sender` (типово): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються приватні повідомлення.
  - `main`: усі приватні повідомлення спільно використовують основну сесію.
  - `per-peer`: ізолювати за id відправника між каналами.
  - `per-channel-peer`: ізолювати за каналом + відправником (рекомендовано для поштових скриньок із кількома користувачами).
  - `per-account-channel-peer`: ізолювати за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: зіставляє канонічні id із peers із префіксом провайдера для спільного використання сесій між каналами. Команди стикування, як-от `/dock_discord`, використовують те саме зіставлення, щоб перемкнути маршрут відповіді активної сесії на інший пов'язаний peer каналу; див. [Стикування каналів](/uk/concepts/channel-docking).
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Коли налаштовано обидва, спрацьовує те, що настає першим. Актуальність щоденного скидання використовує `sessionStartedAt` рядка сесії; актуальність скидання через бездіяльність використовує `lastInteractionAt`. Фонові/системні записи подій, як-от Heartbeat, пробудження Cron, сповіщення exec і службовий облік Gateway, можуть оновлювати `updatedAt`, але вони не підтримують актуальність щоденних/неактивних сесій.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як псевдонім для `direct`.
- **`parentForkMaxTokens`**: максимальне значення `totalTokens` батьківської сесії, дозволене під час створення форкованої сесії потоку (типово `100000`).
  - Якщо батьківський `totalTokens` перевищує це значення, OpenClaw починає нову сесію потоку замість успадкування історії транскрипту батьківської сесії.
  - Установіть `0`, щоб вимкнути цей захист і завжди дозволяти форкування від батьківської сесії.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для основного сегмента прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів-відповідей між агентами під час обмінів агент-агент (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона перемагає.
- **`maintenance`**: очищення сховища сесій + елементи керування зберіганням.
  - `mode`: `warn` лише видає попередження; `enforce` застосовує очищення.
  - `pruneAfter`: вікова межа для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`). Runtime записує пакетне очищення з невеликим буфером верхнього порога для лімітів production-розміру; `openclaw sessions cleanup --enforce` застосовує ліміт негайно.
  - `rotateBytes`: застаріле й ігнорується; `openclaw doctor --fix` видаляє його зі старіших конфігурацій.
  - `resetArchiveRetention`: зберігання архівів транскриптів `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов'язковий дисковий бюджет каталогу сесій. У режимі `warn` журналює попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов'язкова ціль після очищення бюджету. Типово дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сесій, прив'язаних до потоків.
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

Визначення (перемагає найконкретніше): обліковий запис → канал → глобальне. `""` вимикає і зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна           | Опис                   | Приклад                     |
| ---------------- | ---------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі   | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера       | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень мислення | `high`, `low`, `off`        |
| `{identity.name}` | Ім’я ідентичності агента | (те саме, що й `"auto"`)    |

Змінні нечутливі до регістру. `{think}` є псевдонімом для `{thinkingLevel}`.

### Реакція підтвердження

- Типово використовує `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервне значення ідентичності.
- Область: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в каналах із підтримкою реакцій, таких як Slack, Discord, Telegram, WhatsApp і BlueBubbles.
- `messages.statusReactions.enabled`: вмикає реакції стану життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord незадане значення залишає реакції стану ввімкненими, коли реакції підтвердження активні.
  У Telegram явно встановіть `true`, щоб увімкнути реакції стану життєвого циклу.

### Вхідне усунення брязкоту

Об’єднує швидкі текстові повідомлення від одного відправника в один хід агента. Медіа/вкладення скидають чергу негайно. Команди керування оминають усунення брязкоту.

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

- `auto` керує типовим режимом автоматичного TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` увімкнено типово; `modelOverrides.allowProvider` типово має значення `false` (потрібна явна згода).
- API-ключі мають резервні значення `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані провайдери мовлення належать Plugin. Якщо задано `plugins.allow`, додайте кожен Plugin провайдера TTS, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий ідентифікатор провайдера `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на кінцеву точку не OpenAI, OpenClaw розглядає її як сумісний з OpenAI сервер TTS і послаблює перевірку моделі/голосу.

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кілька провайдерів Talk.
- Застарілі пласкі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності й автоматично мігруються в `talk.providers.<provider>`.
- Ідентифікатори голосів мають резервні значення `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає відкриті текстові рядки або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли API-ключ Talk не налаштовано.
- `providers.*.voiceAliases` дає директивам Talk змогу використовувати зручні імена.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний помічник MLX для macOS. Якщо не вказано, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення macOS MLX виконується через вбудований помічник `openclaw-mlx-tts`, коли він наявний, або через виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `speechLocale` задає ідентифікатор локалі BCP 47, який використовується розпізнаванням мовлення Talk в iOS/macOS. Залиште незаданим, щоб використовувати типове значення пристрою.
- `silenceTimeoutMs` керує тим, як довго режим Talk чекає після тиші користувача, перш ніж надсилати транскрипт. Незадане значення зберігає типове вікно паузи платформи (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
