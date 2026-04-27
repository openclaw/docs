---
read_when:
    - Налаштування стандартних параметрів агента (моделі, thinking, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування маршрутизації та прив’язок для кількох агентів
    - Налаштування поведінки сеансу, доставки повідомлень і режиму talk
summary: Стандартні параметри агента, маршрутизація між кількома агентами, сеанс, повідомлення та конфігурація talk
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-04-27T12:49:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb5aab00ef09bb9c8c8275cb86283840d00e13e211235ce61cd6c48ecdd8e671
    source_path: gateway/config-agents.md
    workflow: 15
---

Ключі конфігурації в області агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [довідник із конфігурації](/uk/gateway/configuration-reference).

## Стандартні параметри агента

### `agents.defaults.workspace`

Типово: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, який показується в рядку Runtime системної підказки. Якщо не вказано, OpenClaw автоматично визначає його, піднімаючись угору від робочого простору.

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

- Не вказуйте `agents.defaults.skills`, щоб за замовчуванням Skills були необмеженими.
- Не вказуйте `agents.list[].skills`, щоб успадкувати стандартні значення.
- Установіть `agents.list[].skills: []`, щоб не використовувати Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об’єднується зі стандартними значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли робочого простору впроваджуються в системну підказку. Типово: `"always"`.

- `"continuation-skip"`: на безпечних ходах продовження (після завершеної відповіді помічника) повторне впровадження bootstrap-даних робочого простору пропускається, що зменшує розмір підказки. Запуски Heartbeat і повторні спроби після Compaction однаково перебудовують контекст.
- `"never"`: вимикає впровадження bootstrap-даних робочого простору та файлів контексту на кожному ході. Використовуйте це лише для агентів, які повністю контролюють життєвий цикл власної підказки (власні рушії контексту, нативні середовища виконання, що самі формують контекст, або спеціалізовані робочі процеси без bootstrap). Ходи Heartbeat і відновлення після Compaction також пропускають впровадження.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на один bootstrap-файл робочого простору до обрізання. Типово: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що впроваджуються з усіх bootstrap-файлів робочого простору. Типово: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента текстом попередження, коли bootstrap-контекст обрізається.
Типово: `"once"`.

- `"off"`: ніколи не впроваджувати текст попередження в системну підказку.
- `"once"`: впроваджувати попередження один раз для кожної унікальної сигнатури обрізання (рекомендовано).
- `"always"`: впроваджувати попередження під час кожного запуску, коли є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта відповідальності за бюджет контексту

OpenClaw має кілька великих бюджетів підказки/контексту, і вони
навмисно розділені за підсистемами, а не проходять через один загальний
параметр.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне впровадження bootstrap-даних робочого простору.
- `agents.defaults.startupContext.*`:
  одноразова стартова преамбула для `/new` і `/reset`, включно з останніми
  щоденними файлами `memory/*.md`.
- `skills.limits.*`:
  компактний список Skills, що впроваджується в системну підказку.
- `agents.defaults.contextLimits.*`:
  обмежені витяги середовища виконання та впроваджені блоки, якими володіє середовище виконання.
- `memory.qmd.limits.*`:
  фрагмент індексованого пошуку в пам’яті та розміри впровадження.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовою преамбулою першого ходу, що впроваджується під час порожніх запусків `/new` і `/reset`.

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
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: стандартне обмеження витягу `memory_get` до додавання
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: стандартне вікно рядків для `memory_get`, коли `lines`
  не вказано.
- `toolResultMaxChars`: актуальне обмеження результату інструмента, що використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: обмеження витягу `AGENTS.md`, що використовується під час впровадження
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

Глобальне обмеження для компактного списку Skills, що впроваджується в системну підказку. Це
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

Перевизначення для окремого агента для бюджету підказки Skills.

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

Максимальний розмір у пікселях для довшої сторони зображення в блоках зображень transcript/tool перед викликами провайдера.
Типово: `1200`.

Нижчі значення зазвичай зменшують використання vision-токенів і розмір payload запиту в запусках із великою кількістю знімків екрана.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системної підказки (не для часових позначок повідомлень). Якщо не вказано, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в системній підказці. Типово: `auto` (налаштування ОС).

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
  - Форма об’єкта задає основну модель і впорядковані резервні моделі для failover.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується в шляху інструмента `image` як його конфігурація vision-моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/стандартна модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для прозорого PNG/WebP-виводу OpenAI.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо значення не задано, `image_generate` однаково може визначити стандартний провайдер з налаштованою автентифікацією. Спочатку він пробує поточного стандартного провайдера, потім інші зареєстровані провайдери генерації зображень у порядку provider-id.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо значення не задано, `music_generate` однаково може визначити стандартний провайдер з налаштованою автентифікацією. Спочатку він пробує поточного стандартного провайдера, потім інші зареєстровані провайдери генерації музики в порядку provider-id.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо значення не задано, `video_generate` однаково може визначити стандартний провайдер з налаштованою автентифікацією. Спочатку він пробує поточного стандартного провайдера, потім інші зареєстровані провайдери генерації відео в порядку provider-id.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість до 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо значення не задано, інструмент PDF використовує резервно `imageModel`, а потім визначену модель сеансу/стандартну модель.
- `pdfMaxBytesMb`: стандартне обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передається під час виклику.
- `pdfMaxPages`: стандартна максимальна кількість сторінок, які враховуються в режимі резервного вилучення інструмента `pdf`.
- `verboseDefault`: стандартний рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. Типово: `"off"`.
- `elevatedDefault`: стандартний рівень elevated-output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типово: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ або `openai-codex/gpt-5.5` для Codex OAuth). Якщо опустити провайдера, OpenClaw спочатку пробує alias, потім унікальний збіг exact model id серед налаштованих провайдерів, і лише потім повертається до налаштованого стандартного провайдера (застаріла сумісна поведінка, тому краще явно використовувати `provider/model`). Якщо цей провайдер більше не надає налаштовану стандартну модель, OpenClaw переключається на першу налаштовану пару провайдер/модель замість того, щоб показувати застарілу стандартну модель видаленого провайдера.
- `models`: налаштований каталог моделей і список дозволених моделей для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера параметри, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Безпечні зміни: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відмовляється від замін, які вилучили б наявні записи зі списку дозволених, якщо ви не передасте `--replace`.
  - Потоки configure/onboarding в області провайдера об’єднують вибрані моделі провайдера в цю карту та зберігають не пов’язаних провайдерів, уже налаштованих раніше.
  - Для прямих моделей OpenAI Responses автоматично вмикається server-side Compaction. Використовуйте `params.responsesServerCompaction: false`, щоб припинити впровадження `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [server-side compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні стандартні параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет об’єднання `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається через `agents.defaults.models["provider/model"].params` (для конкретної моделі), а потім `agents.list[].params` (для відповідного id агента) перевизначає за ключем. Докладніше див. [Prompt Caching](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений JSON pass-through, який об’єднується в тіла запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо він конфліктує зі згенерованими ключами запиту, перемагає extra body; маршрути completions, що не є нативними, однаково потім видаляють OpenAI-специфічний `store`.
- `params.chat_template_kwargs`: аргументи chat-template для сумісних із vLLM/OpenAI, які об’єднуються у верхньорівневі тіла запитів `api: "openai-completions"`. Для `vllm/nemotron-3-*` із вимкненим thinking вбудований Plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають згенеровані стандартні значення, а `extra_body.chat_template_kwargs` однаково має остаточний пріоритет. Для керування Qwen thinking у vLLM задайте `params.qwenThinkingFormat` як `"chat-template"` або `"top-level"` у записі цієї моделі.
- `params.preserveThinking`: opt-in лише для Z.AI для збереженого thinking. Коли ввімкнено й thinking активний, OpenClaw надсилає `thinking.clear_thinking: false` і повторно відтворює попередній `reasoning_content`; див. [thinking і preserved thinking у Z.AI](/uk/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: стандартна політика низькорівневого середовища виконання агента. Якщо `id` не вказано, типовим є OpenClaw Pi. Використовуйте `id: "pi"`, щоб примусово ввімкнути вбудований harness PI, `id: "auto"`, щоб дозволити зареєстрованим harness у Plugin перехоплювати підтримувані моделі, зареєстрований id harness, наприклад `id: "codex"`, або підтримуваний alias CLI-бекенда, наприклад `id: "claude-cli"`. Установіть `fallback: "none"`, щоб вимкнути автоматичний резервний перехід на PI. Явні середовища виконання Plugin, як-от `codex`, типово працюють у режимі fail closed, якщо в тій самій області перевизначення не задати `fallback: "pi"`. Зберігайте посилання на модель у канонічному вигляді `provider/model`; вибирайте Codex, Claude CLI, Gemini CLI та інші бекенди виконання через конфігурацію runtime, а не через застарілі префікси runtime-провайдера. Див. [Середовища виконання агентів](/uk/concepts/agent-runtimes), щоб зрозуміти, чим це відрізняється від вибору provider/model.
- Засоби запису конфігурації, які змінюють ці поля (наприклад `/models set`, `/models set-image` і команди додавання/видалення fallback), зберігають канонічну форму об’єкта та, коли можливо, зберігають наявні списки fallback.
- `maxConcurrent`: максимальна кількість паралельних запусків агента між сеансами (кожен окремий сеанс однаково серіалізований). Типово: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` керує тим, який низькорівневий виконавець запускає ходи агента. У більшості
розгортань слід залишити стандартне середовище виконання OpenClaw Pi. Використовуйте його, коли довірений
Plugin надає нативний harness, наприклад вбудований harness app-server для Codex,
або коли вам потрібен підтримуваний CLI-бекенд, наприклад Claude CLI. Для загальної
моделі див. [Середовища виконання агентів](/uk/concepts/agent-runtimes).

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

- `id`: `"auto"`, `"pi"`, id зареєстрованого harness у Plugin або alias підтримуваного CLI-бекенда. Вбудований Plugin Codex реєструє `codex`; вбудований Plugin Anthropic надає CLI-бекенд `claude-cli`.
- `fallback`: `"pi"` або `"none"`. У режимі `id: "auto"` пропущений fallback типово дорівнює `"pi"`, щоб старі конфігурації могли й надалі використовувати PI, коли жоден harness Plugin не перехоплює запуск. У режимі явного runtime Plugin, наприклад `id: "codex"`, пропущений fallback типово дорівнює `"none"`, щоб відсутній harness спричиняв помилку, а не непомітний перехід на PI. Перевизначення runtime не успадковують fallback із ширшої області; задайте `fallback: "pi"` поруч з явним runtime, коли вам свідомо потрібна така сумісність. Помилки вибраного harness Plugin завжди показуються безпосередньо.
- Перевизначення через середовище: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` перевизначає fallback для цього процесу.
- Для розгортань лише з Codex задайте `model: "openai/gpt-5.5"` і `agentRuntime.id: "codex"`. Ви також можете явно задати `agentRuntime.fallback: "none"` для кращої читабельності; це стандартне значення для явних середовищ виконання Plugin.
- Для розгортань із Claude CLI краще використовувати `model: "anthropic/claude-opus-4-7"` разом із `agentRuntime.id: "claude-cli"`. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` однаково працюють для сумісності, але в новій конфігурації слід зберігати вибір provider/model у канонічному вигляді, а бекенд виконання вказувати в `agentRuntime.id`.
- Старі ключі політики runtime переписуються в `agentRuntime` командою `openclaw doctor --fix`.
- Вибір harness фіксується для кожного id сеансу після першого вбудованого запуску. Зміни конфігурації/середовища впливають на нові або скинуті сеанси, а не на наявний transcript. Застарілі сеанси з історією transcript, але без зафіксованого pin, вважаються прив’язаними до PI. `/status` показує фактичне runtime, наприклад `Runtime: OpenClaw Pi Default` або `Runtime: OpenAI Codex`.
- Це керує лише виконанням текстових ходів агента. Генерація медіа, vision, PDF, музика, відео та TTS однаково використовують власні налаштування provider/model.

**Вбудовані скорочення alias** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

| Alias               | Модель                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` або `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Ваші налаштовані alias завжди мають пріоритет над типовими.

Для моделей Z.AI GLM-4.x режим thinking автоматично вмикається, якщо ви не задасте `--thinking off` або не визначите `agents.defaults.models["zai/<model>"].params.thinking` самостійно.
Для моделей Z.AI типово вмикається `tool_stream` для потокової передачі викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Для моделей Anthropic Claude 4.6 стандартно використовується thinking `adaptive`, якщо явний рівень thinking не задано.

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
          // Або використовуйте systemPromptFileArg, якщо CLI приймає прапорець файлу підказки.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-бекенди насамперед орієнтовані на текст; інструменти завжди вимкнені.
- Сеанси підтримуються, коли задано `sessionArg`.
- Наскрізна передача зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює всю системну підказку, зібрану OpenClaw, фіксованим рядком. Задається на рівні стандартних значень (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із підказками.

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

Незалежні від провайдера overlay-підказки, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки між провайдерами; `personality` керує лише шаром дружнього стилю взаємодії.

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
- `"off"` вимикає лише дружній шар; позначений контракт поведінки GPT-5 залишається ввімкненим.
- Застарілий `plugins.entries.openai.config.personality` однаково зчитується, коли це спільне налаштування не задано.

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
        includeSystemPromptSection: true, // типово: true; false прибирає секцію Heartbeat із системної підказки
        lightContext: false, // типово: false; true залишає лише HEARTBEAT.md із bootstrap-файлів робочого простору
        isolatedSession: false, // типово: false; true запускає кожен heartbeat у новому сеансі (без історії розмови)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (типово) | block
        target: "none", // типово: none | варіанти: last | whatsapp | telegram | discord | ...
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
- `includeSystemPromptSection`: якщо `false`, прибирає секцію Heartbeat із системної підказки та пропускає впровадження `HEARTBEAT.md` у bootstrap-контекст. Типово: `true`.
- `suppressToolErrorWarnings`: якщо `true`, пригнічує payload попереджень про помилки інструментів під час запусків heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного ходу агента heartbeat, після чого його буде перервано. Якщо не задано, використовується `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої доставки/DM. `allow` (типово) дозволяє доставку до прямої цілі. `block` пригнічує доставку до прямої цілі та виводить `reason=dm-blocked`.
- `lightContext`: якщо `true`, запуски heartbeat використовують полегшений bootstrap-контекст і залишають лише `HEARTBEAT.md` із bootstrap-файлів робочого простору.
- `isolatedSession`: якщо `true`, кожен heartbeat запускається в новому сеансі без попередньої історії розмови. Такий самий шаблон ізоляції, як у Cron `sessionTarget: "isolated"`. Зменшує вартість одного heartbeat приблизно зі ~100K до ~2-5K токенів.
- Для окремого агента: задайте `agents.list[].heartbeat`. Якщо будь-який агент визначає `heartbeat`, **лише ці агенти** запускають heartbeat.
- Heartbeat виконує повні ходи агента — коротші інтервали витрачають більше токенів.

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
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторне впровадження
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов’язкове перевизначення моделі лише для Compaction
        truncateAfterCompaction: true, // після Compaction перейти до меншого JSONL-наступника
        maxActiveTranscriptBytes: "20mb", // необов’язковий локальний preflight-тригер Compaction
        notifyUser: true, // надсилати короткі сповіщення, коли Compaction починається і завершується (типово: false)
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

- `mode`: `default` або `safeguard` (підсумовування чанками для довгої історії). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin провайдера Compaction. Якщо задано, замість вбудованого підсумовування LLM викликається `summarize()` провайдера. У разі помилки відбувається повернення до вбудованого варіанта. Указання провайдера примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволених для однієї операції Compaction, після чого OpenClaw її перериває. Типово: `900`.
- `keepRecentTokens`: бюджет точки відсікання Pi для збереження найновішого хвоста transcript без змін. Ручна команда `/compact` враховує це, якщо значення задано явно; інакше ручний Compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає вбудовані вказівки зі збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий користувацький текст для збереження ідентифікаторів, що використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою при некоректному виводі для підсумків safeguard. Типово ввімкнено в режимі safeguard; установіть `enabled: false`, щоб пропустити перевірку.
- `postCompactionSections`: необов’язкові назви секцій H2/H3 з AGENTS.md для повторного впровадження після Compaction. Типово `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторне впровадження. Якщо значення не задано або явно дорівнює цій типовій парі, старі заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, коли основний сеанс має залишатися на одній моделі, а підсумки Compaction мають виконуватися на іншій; якщо значення не задано, Compaction використовує основну модель сеансу.
- `maxActiveTranscriptBytes`: необов’язковий поріг у байтах (`number` або рядки на кшталт `"20mb"`), який запускає звичайний локальний Compaction перед виконанням, коли активний JSONL перевищує цей поріг. Потребує `truncateAfterCompaction`, щоб успішний Compaction міг перейти до меншого transcript-наступника. Вимкнено, коли не задано або встановлено `0`.
- `notifyUser`: якщо `true`, надсилає користувачу короткі сповіщення, коли Compaction починається і завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб Compaction залишався непомітним.
- `memoryFlush`: тихий агентний хід перед автоматичним Compaction для збереження тривалої пам’яті. Пропускається, коли робочий простір доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** з контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сеансу на диску.

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
- `ttl` керує тим, як часто обрізання може запускатися повторно (після останнього торкання кешу).
- Обрізання спочатку м’яко скорочує завеликі результати інструментів, а потім за потреби повністю очищає старіші результати інструментів.

**М’яке обрізання** зберігає початок і кінець та вставляє `...` посередині.

**Повне очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не обрізаються і не очищаються.
- Співвідношення рахуються за символами (приблизно), а не за точними кількостями токенів.
- Якщо є менше ніж `keepLastAssistants` повідомлень помічника, обрізання пропускається.

</Accordion>

Докладніше про поведінку див. [Session Pruning](/uk/concepts/session-pruning).

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
- Перевизначення для каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Для Signal/Slack/Discord/Google Chat типово `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоковими відповідями. `natural` = 800–2500 мс. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Докладніше про поведінку та чанкування див. [Streaming](/uk/concepts/streaming).

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

- Стандартно: `instant` для прямих чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для окремого сеансу: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Typing Indicators](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкове sandboxing для вбудованого агента. Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing).

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

- `docker`: локальне середовище виконання Docker (типово)
- `ssh`: загальне віддалене середовище виконання через SSH
- `openshell`: середовище виконання OpenShell

Коли вибрано `backend: "openshell"`, специфічні для середовища виконання налаштування переносяться до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенда:**

- `target`: SSH-ціль у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для робочих просторів у межах області
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, які передаються в OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRef, які OpenClaw матеріалізує у тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data`, що базуються на SecretRef, визначаються з активного знімка середовища виконання секретів до запуску сеансу sandbox

**Поведінка SSH-бекенда:**

- один раз ініціалізує віддалений робочий простір після створення або повторного створення
- потім підтримує віддалений робочий простір SSH як канонічний
- маршрутизує `exec`, файлові інструменти та медіашляхи через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує браузерні контейнери sandbox

**Доступ до робочого простору:**

- `none`: робочий простір sandbox у межах області під `~/.openclaw/sandboxes`
- `ro`: робочий простір sandbox у `/workspace`, робочий простір агента монтується лише для читання в `/agent`
- `rw`: робочий простір агента монтується для читання/запису в `/workspace`

**Область:**

- `session`: окремий контейнер + робочий простір для кожного сеансу
- `agent`: один контейнер + робочий простір для кожного агента (типово)
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

- `mirror`: ініціалізує віддалене середовище з локального перед exec, синхронізує назад після exec; локальний робочий простір залишається канонічним
- `remote`: один раз ініціалізує віддалене середовище під час створення sandbox, потім підтримує віддалений робочий простір як канонічний

У режимі `remote` локальні зміни на хості, зроблені поза OpenClaw, не синхронізуються в sandbox автоматично після кроку ініціалізації.
Транспортом є SSH до sandbox OpenShell, але Plugin керує життєвим циклом sandbox і необов’язковою синхронізацією mirror.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потребує виходу в мережу, записуваного кореня та користувача root.

**Для контейнерів типово встановлено `network: "none"`** — задайте `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний виняток).

**Вхідні вкладення** розміщуються у `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні монтування й монтування для окремого агента об’єднуються.

**Браузер sandbox** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC впроваджується в системну підказку. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача через noVNC типово використовує VNC-автентифікацію, а OpenClaw видає URL із короткоживучим токеном (замість показу пароля в спільному URL).

- `allowHostControl: false` (типово) блокує націлення сеансів sandbox на браузер хоста.
- `network` типово дорівнює `openclaw-sandbox-browser` (виділена bridge-мережа). Встановлюйте `bridge`, лише якщо вам явно потрібна глобальна bridge-підключуваність.
- `cdpSourceRange` за потреби обмежує вхідний CDP-трафік на межі контейнера до діапазону CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в браузерний контейнер sandbox. Якщо це значення задано (включно з `[]`), воно замінює `docker.binds` для браузерного контейнера.
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
  - `--disable-extensions` (типово ввімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    типово ввімкнені й можуть бути вимкнені через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо це потрібно для WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо вони
    потрібні у вашому робочому процесі.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    стандартне обмеження процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Стандартні значення є базовими для образу контейнера; щоб змінити стандартні параметри контейнера,
    використовуйте власний образ браузера з власним entrypoint.

</Accordion>

Ізоляція браузера та `sandbox.docker.binds` доступні лише для Docker.

Збірка образів:

```bash
scripts/sandbox-setup.sh           # основний образ sandbox
scripts/sandbox-browser-setup.sh   # необов’язковий образ браузера
```

### `agents.list` (перевизначення для окремого агента)

Використовуйте `agents.list[].tts`, щоб надати агенту власного провайдера TTS, голос, модель,
стиль або режим auto-TTS. Блок агента виконує глибоке об’єднання поверх глобального
`messages.tts`, тому спільні облікові дані можуть залишатися в одному місці, а окремі
агенти перевизначатимуть лише потрібні їм поля голосу або провайдера. Перевизначення
активного агента застосовується до автоматичних голосових відповідей, `/tts audio`, `/tts status`
і до інструмента агента `tts`. Приклади провайдерів і пріоритетів див. у [Text-to-speech](/uk/tools/tts#per-agent-voice-overrides).

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
        thinkingDefault: "high", // перевизначення рівня thinking для окремого агента
        reasoningDefault: "on", // перевизначення видимості reasoning для окремого агента
        fastModeDefault: false, // перевизначення fast mode для окремого агента
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
- `default`: якщо задано кілька, перший має пріоритет (записується попередження). Якщо не задано жодного, стандартним є перший запис у списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні fallback). Завдання Cron, які перевизначають лише `primary`, однаково успадковують стандартні fallback, якщо ви не встановите `fallbacks: []`.
- `params`: параметри потоку для окремого агента, що об’єднуються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень, як-от `cacheRetention`, `temperature` або `maxTokens`, не дублюючи весь каталог моделей.
- `tts`: необов’язкові перевизначення text-to-speech для окремого агента. Блок глибоко об’єднується поверх `messages.tts`, тому спільні облікові дані провайдера та політику fallback варто зберігати в `messages.tts`, а тут задавати лише специфічні для персонажа значення, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий список дозволених Skills для окремого агента. Якщо не задано, агент успадковує `agents.defaults.skills`, коли їх визначено; явний список замінює стандартні значення, а не об’єднується з ними, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий стандартний рівень thinking для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для окремого повідомлення або сеансу. Вибраний профіль провайдера/моделі визначає, які значення є допустимими; для Google Gemini `adaptive` зберігає динамічний thinking, яким керує провайдер (`thinkingLevel` опущено в Gemini 3/3.1, `thinkingBudget: -1` у Gemini 2.5).
- `reasoningDefault`: необов’язкова стандартна видимість reasoning для окремого агента (`on | off | stream`). Застосовується, коли не задано перевизначення reasoning для окремого повідомлення або сеансу.
- `fastModeDefault`: необов’язкове стандартне значення fast mode для окремого агента (`true | false`). Застосовується, коли не задано перевизначення fast mode для окремого повідомлення або сеансу.
- `agentRuntime`: необов’язкове перевизначення політики низькорівневого runtime для окремого агента. Використовуйте `{ id: "codex" }`, щоб зробити один агент лише Codex, тоді як інші агенти зберігатимуть стандартний fallback PI у режимі `auto`.
- `runtime`: необов’язковий дескриптор runtime для окремого агента. Використовуйте `type: "acp"` разом зі стандартними значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати сеанси harness ACP.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- `identity` виводить стандартні значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених id агентів для `sessions_spawn` (`["*"]` = будь-який; типово: лише той самий агент).
- Захист успадкування sandbox: якщо сеанс запитувача працює в sandbox, `sessions_spawn` відхиляє цілі, які запускалися б без sandbox.
- `subagents.requireAgentId`: коли `true`, блокує виклики `sessions_spawn`, у яких пропущено `agentId` (примушує до явного вибору профілю; типово: false).

---

## Маршрутизація між кількома агентами

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

### Поля відповідності binding

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній `type` типово означає route), `acp` для постійних binding розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; якщо пропущено = стандартний обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; залежить від каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок відповідності:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (на рівні всього каналу)
6. Стандартний агент

У межах кожного рівня перемагає перший відповідний запис у `bindings`.

Для записів `type: "acp"` OpenClaw виконує зіставлення за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище порядок рівнів route binding.

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

Докладніше про пріоритети див. [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

---

## Session

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
    parentForkMaxTokens: 100000, // пропустити fork батьківського потоку вище цієї кількості токенів (0 вимикає)
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
    mainKey: "main", // застаріле (runtime завжди використовує "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Докладно про поля Session">

- **`scope`**: базова стратегія групування сеансів для контекстів групового чату.
  - `per-sender` (типово): кожен відправник отримує ізольований сеанс у межах контексту каналу.
  - `global`: усі учасники в контексті каналу ділять один спільний сеанс (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM використовують основний сеанс.
  - `per-peer`: ізоляція за id відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для вхідних скриньок кількох користувачів).
  - `per-account-channel-peer`: ізоляція за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: мапа канонічних id до peer з префіксом провайдера для спільного використання сеансів між каналами.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Коли налаштовано обидва, спрацьовує той, у якого першим спливає термін. Актуальність щоденного скидання використовує `sessionStartedAt` рядка сеансу; актуальність скидання за неактивністю використовує `lastInteractionAt`. Фонові/системні записи, як-от heartbeat, пробудження Cron, сповіщення exec і службові записи gateway, можуть оновлювати `updatedAt`, але не підтримують актуальність щоденних/idle-сеансів.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застаріле `dm` приймається як alias для `direct`.
- **`parentForkMaxTokens`**: максимальна кількість `totalTokens` у батьківському сеансі, дозволена під час створення fork-сеансу потоку (типово `100000`).
  - Якщо `totalTokens` батьківського сеансу перевищує це значення, OpenClaw починає новий сеанс потоку замість успадкування історії transcript батьківського сеансу.
  - Установіть `0`, щоб вимкнути цей захист і завжди дозволяти fork від батьківського сеансу.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для основного кошика прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість зворотних ходів відповіді між агентами під час обміну agent-to-agent (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим alias `dm`), `keyPrefix` або `rawKeyPrefix`. Перше правило deny має пріоритет.
- **`maintenance`**: очищення сховища сеансів + контроль утримання.
  - `mode`: `warn` лише виводить попередження; `enforce` застосовує очищення.
  - `pruneAfter`: вікове обмеження для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`).
  - `rotateBytes`: ротує `sessions.json`, коли він перевищує цей розмір (типово `10mb`).
  - `resetArchiveRetention`: утримання для архівів transcript `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий дисковий бюджет для каталогу сеансів. У режимі `warn` записує попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сеанси.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні стандартні значення для функцій сеансів, прив’язаних до потоків.
  - `enabled`: головний стандартний перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: стандартне автоматичне зняття фокуса після неактивності в годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: стандартний жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначати)

</Accordion>

---

## Messages

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

Визначення значення (найспецифічніше має пріоритет): обліковий запис → канал → глобальне. `""` вимикає й зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна            | Опис                        | Приклад                     |
| ----------------- | --------------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі        | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера            | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень thinking    | `high`, `low`, `off`        |
| `{identity.name}` | Назва identity агента       | (те саме, що `"auto"`)      |

Змінні нечутливі до регістру. `{think}` — це alias для `{thinkingLevel}`.

### Реакція-підтвердження

- Типово використовується `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервне значення з identity.
- Область: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: прибирає підтвердження після відповіді в каналах із підтримкою реакцій, таких як Slack, Discord, Telegram, WhatsApp і BlueBubbles.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord, якщо значення не задано, реакції статусу залишаються ввімкненими, коли активні реакції-підтвердження.
  У Telegram потрібно явно встановити `true`, щоб увімкнути реакції статусу життєвого циклу.

### Вхідне debounce

Об’єднує швидкі текстові повідомлення від одного відправника в один хід агента. Медіа/вкладення скидаються негайно. Команди керування обходять debounce.

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

- `auto` керує стандартним режимом auto-TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумовування.
- `modelOverrides` типово ввімкнено; `modelOverrides.allowProvider` типово має значення `false` (opt-in).
- API-ключі резервно беруться з `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані провайдери мовлення належать Plugin. Якщо задано `plugins.allow`, додайте кожен Plugin провайдера TTS, який ви хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий id провайдера `edge` приймається як alias для `microsoft`.
- `providers.openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на endpoint, відмінний від OpenAI, OpenClaw трактує його як OpenAI-сумісний сервер TTS і послаблює перевірку моделі/голосу.

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

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кілька провайдерів Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) підтримуються лише для сумісності та автоматично мігруються в `talk.providers.<provider>`.
- Voice ID резервно беруться з `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає звичайні рядки або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли API-ключ Talk не налаштовано.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати дружні назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовується локальним помічником MLX на macOS. Якщо значення не задано, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX на macOS працює через вбудований помічник `openclaw-mlx-tts`, якщо він присутній, або через виконуваний файл на `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `speechLocale` задає id локалі BCP 47, який використовується розпізнаванням мовлення Talk на iOS/macOS. Якщо не задано, використовується стандартна локаль пристрою.
- `silenceTimeoutMs` керує тим, скільки часу режим Talk чекає після тиші користувача, перш ніж надіслати transcript. Якщо не задано, зберігається стандартне вікно паузи платформи (`700 ms` на macOS і Android, `900 ms` на iOS).

---

## Пов’язано

- [Довідник із конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Configuration](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
