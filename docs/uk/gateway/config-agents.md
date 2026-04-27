---
read_when:
    - Налаштування параметрів агента за замовчуванням (моделі, thinking, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування маршрутизації та прив’язок між кількома агентами
    - Налаштування поведінки сесії, доставки повідомлень і режиму talk
summary: Параметри агента за замовчуванням, маршрутизація між кількома агентами, сесія, повідомлення та конфігурація talk
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-04-27T10:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: b89f1432ba234a6fc512d10e2100e56e8f49321bd0c1eda52cd481c46af3ac81
    source_path: gateway/config-agents.md
    workflow: 15
---

Ключі конфігурації з областю дії агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, runtime Gateway та інших
ключів верхнього рівня див. [Довідник з конфігурації](/uk/gateway/configuration-reference).

## Параметри агента за замовчуванням

### `agents.defaults.workspace`

За замовчуванням: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, що показується в рядку Runtime системного prompt. Якщо не задано, OpenClaw автоматично виявляє його, піднімаючись вгору від робочого простору.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий allowlist Skills за замовчуванням для агентів, які не задають
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює значення за замовчуванням
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

- Не задавайте `agents.defaults.skills`, щоб за замовчуванням Skills були без обмежень.
- Не задавайте `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
- Установіть `agents.list[].skills: []`, щоб не було Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об’єднується зі значеннями за замовчуванням.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли робочого простору інжектуються в системний prompt. За замовчуванням: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторну ін’єкцію bootstrap робочого простору, зменшуючи розмір prompt. Запуски Heartbeat і повторні спроби після Compaction усе одно перебудовують контекст.
- `"never"`: вимкнути bootstrap робочого простору та ін’єкцію файлів контексту на кожному ході. Використовуйте це лише для агентів, які повністю керують життєвим циклом свого prompt (власні рушії контексту, нативні runtime, що самі будують свій контекст, або спеціалізовані потоки роботи без bootstrap). Ходи Heartbeat і відновлення після Compaction також пропускають ін’єкцію.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на один bootstrap-файл робочого простору перед обрізанням. За замовчуванням: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що інжектуються з усіх bootstrap-файлів робочого простору. За замовчуванням: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує текстом попередження, видимим агенту, коли bootstrap-контекст обрізається.
За замовчуванням: `"once"`.

- `"off"`: ніколи не інжектувати текст попередження в системний prompt.
- `"once"`: інжектувати попередження один раз для кожного унікального сигнатурного випадку обрізання (рекомендовано).
- `"always"`: інжектувати попередження під час кожного запуску, коли є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Мапа відповідальності за бюджет контексту

OpenClaw має кілька бюджетів prompt/контексту з великим обсягом, і вони
навмисно розділені за підсистемами, а не проходять через один загальний
параметр.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайна ін’єкція bootstrap робочого простору.
- `agents.defaults.startupContext.*`:
  одноразовий стартовий прелюд для `/new` і `/reset`, включно з нещодавніми
  файлами `memory/*.md` щоденної пам’яті.
- `skills.limits.*`:
  компактний список Skills, інжектований у системний prompt.
- `agents.defaults.contextLimits.*`:
  обмежені runtime-уривки й інжектовані блоки, що належать runtime.
- `memory.qmd.limits.*`:
  розмір індексованих фрагментів пошуку в пам’яті та ін’єкції.

Використовуйте відповідне перевизначення для конкретного агента, лише якщо одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовим прелюдом першого ходу, який інжектується в базові запуски `/new` і `/reset`.

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

Спільні значення за замовчуванням для обмежених поверхонь runtime-контексту.

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

- `memoryGetMaxChars`: стандартне обмеження уривка `memory_get` перед додаванням
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: стандартне вікно рядків `memory_get`, коли `lines`
  не задано.
- `toolResultMaxChars`: активне обмеження результату інструмента, що використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: обмеження уривка AGENTS.md, що використовується під час ін’єкції
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

Глобальне обмеження для компактного списку Skills, що інжектується в системний prompt. Це
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

Перевизначення для конкретного агента для бюджету prompt Skills.

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

Максимальний розмір у пікселях для довшої сторони зображення в блоках зображень транскрипту/інструмента перед викликами провайдера.
За замовчуванням: `1200`.

Нижчі значення зазвичай зменшують використання vision-token і розмір payload запиту для запусків із великою кількістю скриншотів.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного prompt (не для часових позначок повідомлень). Якщо не задано, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в системному prompt. За замовчуванням: `auto` (уподобання ОС).

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
      params: { cacheRetention: "long" }, // глобальні параметри провайдера за замовчуванням
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
  - Форма об’єкта задає основну модель плюс упорядковані резервні моделі для failover.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація vision-моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/стандартна модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для OpenAI PNG/WebP-виводу з прозорим тлом.
  - Якщо ви вибираєте provider/model безпосередньо, налаштуйте також відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо значення не задано, `image_generate` усе одно може визначити стандартний провайдер за наявною автентифікацією. Спочатку він пробує поточного стандартного провайдера, потім решту зареєстрованих провайдерів генерації зображень у порядку їхніх provider-id.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо значення не задано, `music_generate` усе одно може визначити стандартний провайдер за наявною автентифікацією. Спочатку він пробує поточного стандартного провайдера, потім решту зареєстрованих провайдерів генерації музики в порядку їхніх provider-id.
  - Якщо ви вибираєте provider/model безпосередньо, налаштуйте також відповідну автентифікацію/API-ключ провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо значення не задано, `video_generate` усе одно може визначити стандартний провайдер за наявною автентифікацією. Спочатку він пробує поточного стандартного провайдера, потім решту зареєстрованих провайдерів генерації відео в порядку їхніх provider-id.
  - Якщо ви вибираєте provider/model безпосередньо, налаштуйте також відповідну автентифікацію/API-ключ провайдера.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість до 10 секунд, а також опції рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо значення не задано, інструмент PDF використовує `imageModel`, а потім визначену модель сесії/стандартну модель.
- `pdfMaxBytesMb`: стандартне обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: стандартна максимальна кількість сторінок, що враховуються в режимі резервного вилучення інструмента `pdf`.
- `verboseDefault`: стандартний рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. За замовчуванням: `"off"`.
- `elevatedDefault`: стандартний рівень elevated-output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. За замовчуванням: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ або `openai-codex/gpt-5.5` для Codex OAuth). Якщо не вказати провайдера, OpenClaw спочатку пробує alias, потім унікальний збіг налаштованого провайдера для цього точного id моделі, і лише після цього переходить до налаштованого стандартного провайдера (застаріла поведінка сумісності, тому краще явно вказувати `provider/model`). Якщо цей провайдер більше не надає налаштовану стандартну модель, OpenClaw переходить до першої налаштованої пари provider/model замість того, щоб показувати застаріле стандартне значення від видаленого провайдера.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера параметри, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Безпечне редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відмовляє в замінах, які видалили б наявні записи allowlist, якщо ви не передасте `--replace`.
  - Потоки `configure`/onboarding з областю провайдера об’єднують вибрані моделі провайдера в цю мапу та зберігають уже налаштованих не пов’язаних провайдерів.
  - Для безпосередніх моделей OpenAI Responses compaction на стороні сервера вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити ін’єкцію `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [Server-side compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні стандартні параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Порядок перевизначення `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається через `agents.defaults.models["provider/model"].params` (для конкретної моделі), а потім `agents.list[].params` (відповідний id агента) перевизначає за ключами. Докладніше див. [Кешування prompt](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений прохідний JSON, який об’єднується в тіла запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, пріоритет має extra body; не нативні маршрути completions після цього все одно видаляють специфічний для OpenAI `store`.
- `params.chat_template_kwargs`: аргументи chat template для vLLM/OpenAI-сумісних систем, які об’єднуються з тілом запиту верхнього рівня `api: "openai-completions"`. Для `vllm/nemotron-3-*` із вимкненим thinking OpenClaw автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані значення за замовчуванням, а `extra_body.chat_template_kwargs` усе ще має остаточний пріоритет. Для контролю thinking у vLLM Qwen задайте `params.qwenThinkingFormat` як `"chat-template"` або `"top-level"` у записі цієї моделі.
- `params.preserveThinking`: опціональна функція лише для Z.AI для збереження thinking. Коли її ввімкнено й thinking увімкнено, OpenClaw надсилає `thinking.clear_thinking: false` і повторно відтворює попередній `reasoning_content`; див. [thinking і збережений thinking у Z.AI](/uk/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: стандартна політика низькорівневого runtime агента. Якщо `id` не задано, використовується OpenClaw Pi. Використовуйте `id: "pi"`, щоб примусово вибрати вбудований harness PI, `id: "auto"`, щоб зареєстровані Plugin-harness могли перехоплювати підтримувані моделі, зареєстрований id harness, наприклад `id: "codex"`, або підтримуваний alias CLI-бекенда, наприклад `id: "claude-cli"`. Установіть `fallback: "none"`, щоб вимкнути автоматичний резервний перехід до PI. Явні runtime Plugin, як-от `codex`, за замовчуванням завершуються в fail-closed режимі, якщо ви не задасте `fallback: "pi"` у тій самій області перевизначення. Зберігайте посилання на моделі в канонічному форматі `provider/model`; вибирайте Codex, Claude CLI, Gemini CLI та інші бекенди виконання через конфігурацію runtime, а не через застарілі префікси runtime-провайдера. Див. [Runtime агентів](/uk/concepts/agent-runtimes), щоб зрозуміти, чим це відрізняється від вибору provider/model.
- Засоби запису конфігурації, які змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення fallback), зберігають канонічну форму об’єкта та за можливості зберігають наявні списки fallback.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів у різних сесіях (кожна сесія все одно серіалізується). За замовчуванням: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` керує тим, який низькорівневий виконавець запускає ходи агента. У більшості
розгортань слід залишити стандартний runtime OpenClaw Pi. Використовуйте його, коли довірений
Plugin надає нативний harness, наприклад вбудований harness app-server Codex,
або коли ви хочете використовувати підтримуваний CLI-бекенд, наприклад Claude CLI. Для загальної
моделі див. [Runtime агентів](/uk/concepts/agent-runtimes).

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

- `id`: `"auto"`, `"pi"`, id зареєстрованого Plugin-harness або alias підтримуваного CLI-бекенда. Вбудований Plugin Codex реєструє `codex`; вбудований Plugin Anthropic надає CLI-бекенд `claude-cli`.
- `fallback`: `"pi"` або `"none"`. У режимі `id: "auto"` пропущене значення `fallback` за замовчуванням дорівнює `"pi"`, щоб старі конфігурації могли й надалі використовувати PI, коли жоден Plugin-harness не перехоплює запуск. У режимі явного runtime Plugin, наприклад `id: "codex"`, пропущене значення `fallback` за замовчуванням дорівнює `"none"`, щоб відсутній harness спричиняв помилку замість тихого використання PI. Перевизначення runtime не успадковують `fallback` із ширшої області; задавайте `fallback: "pi"` поруч із явним runtime, лише якщо навмисно хочете таку сумісність. Помилки вибраного Plugin-harness завжди показуються безпосередньо.
- Перевизначення через середовище: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` перевизначає fallback для цього процесу.
- Для розгортань лише з Codex задайте `model: "openai/gpt-5.5"` і `agentRuntime.id: "codex"`. Для читабельності також можна явно вказати `agentRuntime.fallback: "none"`; це стандартне значення для явних runtime Plugin.
- Для розгортань із Claude CLI краще використовувати `model: "anthropic/claude-opus-4-7"` разом із `agentRuntime.id: "claude-cli"`. Застарілі посилання на модель `claude-cli/claude-opus-4-7` усе ще працюють для сумісності, але в новій конфігурації слід зберігати вибір provider/model канонічним і виносити бекенд виконання в `agentRuntime.id`.
- Старі ключі політики runtime переписуються в `agentRuntime` командою `openclaw doctor --fix`.
- Вибір harness закріплюється за id сесії після першого вбудованого запуску. Зміни конфігурації/середовища впливають на нові або скинуті сесії, а не на наявний транскрипт. Застарілі сесії з історією транскрипту, але без зафіксованого pin, вважаються закріпленими за PI. `/status` повідомляє фактичний runtime, наприклад `Runtime: OpenClaw Pi Default` або `Runtime: OpenAI Codex`.
- Це керує лише виконанням текстових ходів агента. Генерація медіа, vision, PDF, музика, відео й TTS і далі використовують свої налаштування provider/model.

**Вбудовані скорочення alias** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

| Alias | Модель |
| ----- | ------ |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.5` або `openai-codex/gpt-5.5` |
| `gpt-mini` | `openai/gpt-5.4-mini` |
| `gpt-nano` | `openai/gpt-5.4-nano` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Ваші налаштовані alias завжди мають пріоритет над стандартними.

Для моделей Z.AI GLM-4.x режим thinking автоматично вмикається, якщо ви не задасте `--thinking off` або власне значення `agents.defaults.models["zai/<model>"].params.thinking`.
Для моделей Z.AI `tool_stream` увімкнено за замовчуванням для потокової передачі викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
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
          // Або використовуйте systemPromptFileArg, якщо CLI приймає прапорець файлу prompt.
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
- Передача зображень підтримується, якщо `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь системний prompt, зібраний OpenClaw, фіксованим рядком. Задається на рівні значень за замовчуванням (`agents.defaults.systemPromptOverride`) або для конкретного агента (`agents.list[].systemPromptOverride`). Значення для конкретного агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із prompt.

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

Незалежні від провайдера накладки prompt, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки для всіх провайдерів; `personality` керує лише шаром дружнього стилю взаємодії.

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

- `"friendly"` (за замовчуванням) і `"on"` вмикають шар дружнього стилю взаємодії.
- `"off"` вимикає лише дружній шар; позначений контракт поведінки GPT-5 залишається ввімкненим.
- Застаріле `plugins.entries.openai.config.personality` усе ще читається, якщо цей спільний параметр не задано.

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
        includeSystemPromptSection: true, // за замовчуванням: true; false прибирає розділ Heartbeat із системного prompt
        lightContext: false, // за замовчуванням: false; true залишає лише HEARTBEAT.md із bootstrap-файлів робочого простору
        isolatedSession: false, // за замовчуванням: false; true запускає кожен heartbeat у новій сесії (без історії розмови)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (за замовчуванням) | block
        target: "none", // за замовчуванням: none | варіанти: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: рядок тривалості (ms/s/m/h). За замовчуванням: `30m` (автентифікація через API-ключ) або `1h` (OAuth-автентифікація). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: якщо `false`, прибирає розділ Heartbeat із системного prompt і пропускає ін’єкцію `HEARTBEAT.md` у bootstrap-контекст. За замовчуванням: `true`.
- `suppressToolErrorWarnings`: якщо `true`, пригнічує payload попереджень про помилки інструментів під час запусків heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного ходу агента heartbeat до його переривання. Якщо не задано, використовується `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика доставки напряму/у DM. `allow` (за замовчуванням) дозволяє доставку напряму до цілі. `block` пригнічує доставку напряму до цілі та генерує `reason=dm-blocked`.
- `lightContext`: якщо `true`, запуски heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів робочого простору.
- `isolatedSession`: якщо `true`, кожен heartbeat запускається в новій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як у Cron `sessionTarget: "isolated"`. Зменшує вартість токенів на один heartbeat приблизно зі ~100K до ~2-5K токенів.
- Для конкретного агента: задайте `agents.list[].heartbeat`. Якщо будь-який агент визначає `heartbeat`, Heartbeat виконуються **лише для цих агентів**.
- Heartbeat виконують повні ходи агента — коротші інтервали витрачають більше токенів.

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
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторну ін’єкцію
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов’язкове перевизначення моделі лише для Compaction
        truncateAfterCompaction: true, // ротація до меншого successor JSONL після Compaction
        maxActiveTranscriptBytes: "20mb", // необов’язковий локальний поріг попереднього запуску Compaction
        notifyUser: true, // надсилати короткі сповіщення, коли Compaction починається й завершується (за замовчуванням: false)
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

- `mode`: `default` або `safeguard` (підсумовування частинами для довгої історії). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin провайдера Compaction. Якщо задано, замість вбудованого підсумовування LLM викликається `summarize()` цього провайдера. У разі помилки використовується вбудований варіант. Вибір провайдера примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, після чого OpenClaw її перериває. За замовчуванням: `900`.
- `keepRecentTokens`: бюджет точки обрізання Pi для збереження найновішого хвоста транскрипту дослівно. Ручний `/compact` враховує це, якщо значення явно задано; інакше ручне ущільнення є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (за замовчуванням), `off` або `custom`. `strict` додає вбудовані інструкції щодо збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий власний текст для збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою у разі некоректного виводу для підсумків safeguard. У режимі safeguard увімкнено за замовчуванням; задайте `enabled: false`, щоб пропустити перевірку.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md, які потрібно повторно ін’єктувати після Compaction. За замовчуванням це `["Session Startup", "Red Lines"]`; задайте `[]`, щоб вимкнути повторну ін’єкцію. Якщо значення не задано або явно встановлено цю стандартну пару, старі заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, коли основна сесія має залишатися на одній моделі, а підсумки Compaction — виконуватися на іншій; якщо значення не задано, Compaction використовує основну модель сесії.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), який запускає звичайний локальний Compaction перед запуском, коли активний JSONL перевищує цей поріг. Потребує `truncateAfterCompaction`, щоб успішний Compaction міг виконати ротацію до меншого successor transcript. Вимкнено, якщо не задано або дорівнює `0`.
- `notifyUser`: якщо `true`, надсилає користувачу короткі повідомлення, коли Compaction починається та завершується (наприклад, «Compacting context...» і «Compaction complete»). За замовчуванням вимкнено, щоб Compaction відбувався безшумно.
- `memoryFlush`: безшумний хід агента перед автоматичним Compaction для збереження довготривалої пам’яті. Пропускається, якщо робочий простір доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // тривалість (ms/s/m/h), одиниця за замовчуванням: хвилини
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
- `ttl` визначає, як часто обрізання може запускатися знову (після останнього торкання кешу).
- Обрізання спочатку м’яко скорочує завеликі результати інструментів, а потім, за потреби, повністю очищає старіші результати інструментів.

**М’яке обрізання** зберігає початок і кінець та вставляє посередині `...`.

**Повне очищення** замінює весь результат інструмента плейсхолдером.

Примітки:

- Блоки зображень ніколи не обрізаються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо є менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Докладніше про поведінку див. [Обрізання сесії](/uk/concepts/session-pruning).

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

- Для каналів, відмінних від Telegram, потрібно явно задати `*.blockStreaming: true`, щоб увімкнути блокові відповіді.
- Перевизначення для каналу: `channels.<channel>.blockStreamingCoalesce` (і варіанти для конкретних акаунтів). Для Signal/Slack/Discord/Google Chat за замовчуванням `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоковими відповідями. `natural` = 800–2500 мс. Перевизначення для конкретного агента: `agents.list[].humanDelay`.

Докладніше про поведінку та розбиття на частини див. [Потокове передавання](/uk/concepts/streaming).

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
- Перевизначення для конкретної сесії: `session.typingMode`, `session.typingIntervalSeconds`.

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

<Accordion title="Докладно про sandbox">

**Бекенд:**

- `docker`: локальний runtime Docker (за замовчуванням)
- `ssh`: універсальний віддалений runtime на основі SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, налаштування, специфічні для runtime, переносяться в
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенда:**

- `target`: SSH-ціль у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (за замовчуванням: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь для робочих просторів за scope
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, передані в OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRef, які OpenClaw матеріалізує у тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет SSH-автентифікації:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef розв’язуються з активного snapshot runtime секретів до початку сесії sandbox

**Поведінка SSH-бекенда:**

- один раз ініціалізує віддалений робочий простір після створення або повторного створення
- потім підтримує віддалений робочий простір SSH як канонічний
- маршрутизує `exec`, файлові інструменти та шляхи медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує браузерні контейнери sandbox

**Доступ до робочого простору:**

- `none`: робочий простір sandbox за scope у `~/.openclaw/sandboxes`
- `ro`: робочий простір sandbox у `/workspace`, робочий простір агента монтується лише для читання в `/agent`
- `rw`: робочий простір агента монтується для читання/запису в `/workspace`

**Scope:**

- `session`: окремий контейнер + робочий простір для кожної сесії
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

- `mirror`: ініціалізує віддалене середовище з локального перед `exec`, синхронізує назад після `exec`; локальний робочий простір залишається канонічним
- `remote`: ініціалізує віддалене середовище один раз під час створення sandbox, після чого віддалений робочий простір залишається канонічним

У режимі `remote` локальні зміни на хості, зроблені поза OpenClaw, не синхронізуються в sandbox автоматично після кроку ініціалізації.
Транспортом є SSH до sandbox OpenShell, але Plugin керує життєвим циклом sandbox і необов’язковою дзеркальною синхронізацією.

**`setupCommand`** запускається один раз після створення контейнера (через `sh -lc`). Потребує виходу в мережу, записуваного root і користувача root.

**Для контейнерів за замовчуванням використовується `network: "none"`** — установіть `"bridge"` (або власну мережу bridge), якщо агенту потрібен вихід назовні.
`"host"` заблоковано. `"container:<id>"` заблоковано за замовчуванням, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійне використання).

**Вхідні вкладення** розміщуються в `media/inbound/*` активного робочого простору.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки для конкретного агента об’єднуються.

**Браузер у sandbox** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC інжектується в системний prompt. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача через noVNC за замовчуванням використовує VNC-автентифікацію, а OpenClaw видає URL із короткостроковим токеном (замість того, щоб відкривати пароль у спільному URL).

- `allowHostControl: false` (за замовчуванням) блокує націлювання сесій sandbox на браузер хоста.
- Для `network` за замовчуванням використовується `openclaw-sandbox-browser` (виділена мережа bridge). Установлюйте `bridge` лише тоді, коли вам явно потрібне глобальне з’єднання bridge.
- `cdpSourceRange` необов’язково обмежує вхідний CDP на межі контейнера діапазоном CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера sandbox. Якщо параметр задано (включно з `[]`), він замінює `docker.binds` для контейнера браузера.
- Параметри запуску за замовчуванням визначено в `scripts/sandbox-browser-entrypoint.sh` і налаштовано для контейнерних хостів:
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
  - `--disable-extensions` (за замовчуванням увімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    увімкнено за замовчуванням і їх можна вимкнути через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо вони
    потрібні вашому робочому процесу.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    стандартне обмеження процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Стандартні параметри є базовими для образу контейнера; щоб змінити стандартну
    поведінку контейнера, використовуйте власний образ браузера з власним
    entrypoint.

</Accordion>

Ізоляція браузера та `sandbox.docker.binds` підтримуються лише для Docker.

Зібрати образи:

```bash
scripts/sandbox-setup.sh           # основний образ sandbox
scripts/sandbox-browser-setup.sh   # необов’язковий образ браузера
```

### `agents.list` (перевизначення для конкретного агента)

Використовуйте `agents.list[].tts`, щоб надати агенту власного TTS-провайдера, голос, модель,
стиль або режим автоматичного TTS. Блок агента виконує глибоке об’єднання поверх глобального
`messages.tts`, тому спільні облікові дані можуть зберігатися в одному місці, а окремі
агенти перевизначатимуть лише потрібні їм поля голосу або провайдера. Перевизначення
активного агента застосовується до автоматичних голосових відповідей, `/tts audio`, `/tts status`
і інструмента агента `tts`. Приклади провайдерів і порядок пріоритетів див. у [Text-to-speech](/uk/tools/tts#per-agent-voice-overrides).

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
        fastModeDefault: false, // перевизначення fast mode для конкретного агента
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // перевизначає відповідні ключі з defaults.models params
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
- `default`: якщо задано кілька, перемагає перший (записується попередження). Якщо не задано жодного, стандартним є перший запис у списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні fallback). Cron-завдання, які перевизначають лише `primary`, усе одно успадковують стандартні fallback, якщо ви не задасте `fallbacks: []`.
- `params`: параметри потоку для конкретного агента, об’єднані поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для перевизначень, специфічних для агента, як-от `cacheRetention`, `temperature` або `maxTokens`, не дублюючи весь каталог моделей.
- `tts`: необов’язкові перевизначення text-to-speech для конкретного агента. Цей блок глибоко об’єднується поверх `messages.tts`, тому зберігайте спільні облікові дані провайдера та політику fallback у `messages.tts`, а тут задавайте лише значення, специфічні для persona, як-от provider, voice, model, style або auto mode.
- `skills`: необов’язковий allowlist Skills для конкретного агента. Якщо не задано, агент успадковує `agents.defaults.skills`, коли він заданий; явний список замінює значення за замовчуванням, а не об’єднується з ними, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий стандартний рівень thinking для конкретного агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, якщо не задано перевизначення для конкретного повідомлення або сесії. Вибраний профіль provider/model визначає, які значення є допустимими; для Google Gemini `adaptive` зберігає динамічний thinking, яким керує провайдер (`thinkingLevel` пропущено для Gemini 3/3.1, `thinkingBudget: -1` для Gemini 2.5).
- `reasoningDefault`: необов’язкова стандартна видимість reasoning для конкретного агента (`on | off | stream`). Застосовується, якщо не задано перевизначення reasoning для конкретного повідомлення або сесії.
- `fastModeDefault`: необов’язкове стандартне значення fast mode для конкретного агента (`true | false`). Застосовується, якщо не задано перевизначення fast mode для конкретного повідомлення або сесії.
- `agentRuntime`: необов’язкове перевизначення політики низькорівневого runtime для конкретного агента. Використовуйте `{ id: "codex" }`, щоб зробити один агент лише для Codex, поки інші агенти зберігають стандартний fallback до PI в режимі `auto`.
- `runtime`: необов’язковий дескриптор runtime для конкретного агента. Використовуйте `type: "acp"` разом із типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має стандартно працювати в сесіях harness ACP.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- `identity` виводить стандартні значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: allowlist id агентів для `sessions_spawn` (`["*"]` = будь-який; за замовчуванням: лише той самий агент).
- Захист успадкування sandbox: якщо сесія-запитувач працює в sandbox, `sessions_spawn` відхиляє цілі, які запускалися б без sandbox.
- `subagents.requireAgentId`: якщо `true`, блокує виклики `sessions_spawn`, у яких пропущено `agentId` (примушує до явного вибору профілю; за замовчуванням: false).

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

### Поля зіставлення binding

- `type` (необов’язково): `route` для звичайної маршрутизації (якщо тип відсутній, за замовчуванням використовується route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який акаунт; якщо пропущено = стандартний акаунт)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; залежить від каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок зіставлення:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (на рівні всього каналу)
6. Стандартний агент

У межах кожного рівня перемагає перший відповідний запис `bindings`.

Для записів `type: "acp"` OpenClaw визначає відповідність за точною ідентичністю розмови (`match.channel` + акаунт + `match.peer.id`) і не використовує наведений вище порядок рівнів route binding.

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

Деталі пріоритетів див. у [Sandbox і інструменти Multi-Agent](/uk/tools/multi-agent-sandbox-tools).

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
    parentForkMaxTokens: 100000, // пропустити форк батьківського потоку вище цієї кількості токенів (0 вимикає)
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
      idleHours: 24, // стандартне автоматичне розфокусування після неактивності в годинах (`0` вимикає)
      maxAgeHours: 0, // стандартний жорсткий максимальний вік у годинах (`0` вимикає)
    },
    mainKey: "main", // застаріло (runtime завжди використовує "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Докладно про поля сесії">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (за замовчуванням): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM використовують спільну основну сесію.
  - `per-peer`: ізоляція за id відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для вхідних скриньок із кількома користувачами).
  - `per-account-channel-peer`: ізоляція за акаунтом + каналом + відправником (рекомендовано для кількох акаунтів).
- **`identityLinks`**: мапа канонічних id до peer із префіксом провайдера для спільного використання сесії між каналами.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва варіанти, перемагає той, що спливає раніше. Свіжість щоденного скидання використовує `sessionStartedAt` рядка сесії; свіжість скидання за неактивністю використовує `lastInteractionAt`. Фонові/системні записи, як-от heartbeat, пробудження Cron, сповіщення exec і службові записи gateway, можуть оновлювати `updatedAt`, але не підтримують свіжість щоденних/неактивних сесій.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застаріле `dm` приймається як alias для `direct`.
- **`parentForkMaxTokens`**: максимальне допустиме значення `totalTokens` батьківської сесії під час створення сесії форкнутого потоку (за замовчуванням `100000`).
  - Якщо `totalTokens` батьківської сесії перевищує це значення, OpenClaw запускає нову сесію потоку замість успадкування історії транскрипту батьківської сесії.
  - Установіть `0`, щоб вимкнути цей захист і завжди дозволяти форк від батьківської сесії.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для основного сегмента прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів відповіді у відповідь між агентами під час обміну агент-до-агента (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим alias `dm`), `keyPrefix` або `rawKeyPrefix`. Перший deny має пріоритет.
- **`maintenance`**: керування очищенням сховища сесій і збереженням.
  - `mode`: `warn` лише генерує попередження; `enforce` застосовує очищення.
  - `pruneAfter`: поріг віку для застарілих записів (за замовчуванням `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (за замовчуванням `500`).
  - `rotateBytes`: ротує `sessions.json`, коли його розмір перевищує це значення (за замовчуванням `10mb`).
  - `resetArchiveRetention`: тривалість збереження архівів транскриптів `*.reset.<timestamp>`. За замовчуванням дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий бюджет дискового простору каталогу сесій. У режимі `warn` він записує попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення за бюджетом. За замовчуванням дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні значення за замовчуванням для функцій сесій, прив’язаних до потоків.
  - `enabled`: головний стандартний перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: стандартне автоматичне розфокусування після неактивності в годинах (`0` вимикає; провайдери можуть перевизначати)
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

Перевизначення для каналу/акаунта: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Порядок визначення (перемагає найспецифічніше): акаунт → канал → глобально. `""` вимикає значення й зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Шаблонні змінні:**

| Змінна | Опис | Приклад |
| ------ | ---- | ------- |
| `{model}` | Коротка назва моделі | `claude-opus-4-6` |
| `{modelFull}` | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}` | Назва провайдера | `anthropic` |
| `{thinkingLevel}` | Поточний рівень thinking | `high`, `low`, `off` |
| `{identity.name}` | Назва identity агента | (те саме, що `"auto"`) |

Змінні нечутливі до регістру. `{think}` є alias для `{thinkingLevel}`.

### Ack reaction

- За замовчуванням використовується `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: акаунт → канал → `messages.ackReaction` → fallback із identity.
- Scope: `group-mentions` (за замовчуванням), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє ack після відповіді в каналах із підтримкою реакцій, як-от Slack, Discord, Telegram, WhatsApp і BlueBubbles.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord незадане значення зберігає реакції статусу ввімкненими, коли активні ack reaction.
  У Telegram для ввімкнення реакцій статусу життєвого циклу потрібно явно задати `true`.

### Вхідний debounce

Об’єднує швидкі текстові повідомлення від того самого відправника в один хід агента. Медіа/вкладення скидаються негайно. Команди керування оминають debounce.

### TTS (text-to-speech)

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

- `auto` керує стандартним режимом auto-TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначити локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` увімкнено за замовчуванням; `modelOverrides.allowProvider` за замовчуванням має значення `false` (лише за явної згоди).
- API-ключі беруться з fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані мовленнєві провайдери належать Plugin. Якщо задано `plugins.allow`, додайте кожен Plugin TTS-провайдера, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий id провайдера `edge` приймається як alias для `microsoft`.
- `providers.openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на endpoint, що не належить OpenAI, OpenClaw трактує його як OpenAI-сумісний TTS-сервер і послаблює перевірку model/voice.

---

## Talk

Стандартні значення для режиму Talk (macOS/iOS/Android).

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

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кілька Talk-провайдерів.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) підтримуються лише для сумісності та автоматично мігруються в `talk.providers.<provider>`.
- Для id голосів використовується fallback `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає відкриті рядки або об’єкти SecretRef.
- Fallback `ELEVENLABS_API_KEY` застосовується лише тоді, коли API-ключ Talk не налаштовано.
- `providers.*.voiceAliases` дає змогу директивам Talk використовувати дружні назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний помічник MLX у macOS. Якщо значення не задано, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX на macOS виконується через вбудований помічник `openclaw-mlx-tts`, якщо він наявний, або через виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `speechLocale` задає id локалі BCP 47, який використовується розпізнаванням мовлення Talk на iOS/macOS. Залиште незаданим, щоб використовувати стандартне значення пристрою.
- `silenceTimeoutMs` керує тим, скільки Talk mode чекає після мовчання користувача, перш ніж надіслати транскрипт. Якщо значення не задано, зберігається стандартне вікно паузи платформи (`700 ms на macOS і Android, 900 ms на iOS`).

---

## Пов’язано

- [Довідник з конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
