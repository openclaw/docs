---
read_when:
    - Налаштування політики `tools.*`, списків дозволів або експериментальних функцій
    - Реєстрація власних постачальників або перевизначення базових URL-адрес
    - Налаштування самостійно розміщених кінцевих точок, сумісних з OpenAI
sidebarTitle: Tools and custom providers
summary: Конфігурація інструментів (політика, експериментальні перемикачі, інструменти на основі провайдерів) і налаштування власного провайдера/базової URL-адреси
title: Конфігурація — інструменти та користувацькі провайдери
x-i18n:
    generated_at: "2026-07-12T13:11:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

Ключі конфігурації `tools.*` і налаштування власного провайдера / базової URL-адреси. Відомості про агентів, канали та інші ключі конфігурації верхнього рівня див. у [довіднику з конфігурації](/uk/gateway/configuration-reference).

## Інструменти

### Профілі інструментів

`tools.profile` задає базовий список дозволених інструментів перед `tools.allow`/`tools.deny`:

<Note>
Під час локального початкового налаштування для нових локальних конфігурацій, у яких це значення не задано, за замовчуванням установлюється `tools.profile: "coding"` (наявні явно задані профілі зберігаються).
</Note>

| Профіль     | Містить                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Лише `session_status`                                                                                                                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Без обмежень (так само, як коли значення не задано)                                                                                                                                                                                               |

`coding` і `messaging` також неявно дозволяють `bundle-mcp` (налаштовані сервери MCP).

### Групи інструментів

| Група              | Інструменти                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як псевдонім для `exec`)                                                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | Усі наведені вище вбудовані інструменти, крім `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (інструменти плагінів не включено)                                 |
| `group:plugins`    | Інструменти, що належать завантаженим плагінам, зокрема налаштовані сервери MCP, доступні через `bundle-mcp`                                                          |

`spawn_task` дає змогу агенту програмування запропонувати підтверджувану подальшу роботу, не починаючи її. Control UI показує назву та опис як інтерактивну мітку дії; TUI на основі Gateway показує еквівалентний інтерактивний запит. Прийняття будь-якої з них створює новий сеанс у керованому робочому дереві та надсилає туди повний запит, поки поточний хід триває. `dismiss_task` відкликає пропозицію, яка ще очікує на розгляд, за тимчасовим `task_id`, повернутим із `spawn_task`.

Інструменти пропонуються лише тоді, коли операторський інтерфейс, що ініціює дію, може отримувати й обробляти події пропозицій завдань Gateway. Сеанси каналів і локальні/вбудовані сеанси TUI їх не отримують; транспортам каналів потрібна переносна типізована дія завдання, перш ніж вони зможуть безпечно надавати цей процес. Пропозиції локальні для процесу й зникають після перезапуску Gateway. Обидва інструменти залишаються в профілі `coding` і групі `group:sessions`, тому звичайна політика `tools.allow` і `tools.deny` автоматично налаштовує їх, коли інтерфейс їх підтримує.

### Інструменти MCP і плагінів у політиці інструментів пісочниці

Налаштовані сервери MCP доступні як інструменти, що належать плагіну, під ідентифікатором плагіна `bundle-mcp`. Звичайні профілі інструментів можуть дозволяти їх, але `tools.sandbox.tools` є додатковою перепоною для ізольованих сеансів. Якщо режим пісочниці — `"all"` або `"non-main"`, додайте один із цих записів до списку дозволених інструментів пісочниці, коли інструменти MCP/плагінів мають бути видимими:

- `bundle-mcp` для серверів MCP, якими керує OpenClaw, із `mcp.servers`
- ідентифікатор плагіна для конкретного нативного плагіна
- `group:plugins` для всіх завантажених інструментів, що належать плагінам
- точні назви інструментів сервера MCP або шаблони сервера, як-от `outlook__send_mail` чи `outlook__*`, якщо потрібен лише один сервер

Шаблони серверів використовують безпечний для провайдера префікс сервера MCP, який не обов’язково збігається з необробленим ключем `mcp.servers`. Символи, відмінні від `[A-Za-z0-9_-]`, замінюються на `-`, назви, що не починаються з літери, отримують префікс `mcp-`, а довгі або дубльовані префікси можуть бути скорочені чи отримати суфікс; наприклад, `mcp.servers["Outlook Graph"]` використовує шаблон на кшталт `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Без цього запису на рівні пісочниці сервер MCP усе одно може успішно завантажитися, але його інструменти буде відфільтровано перед запитом до провайдера. Використовуйте `openclaw doctor`, щоб виявляти таку конфігурацію для серверів у `mcp.servers`, якими керує OpenClaw. Сервери MCP, завантажені з маніфестів вбудованих плагінів або Claude `.mcp.json`, використовують ту саму перепону пісочниці, але ця діагностика поки що не охоплює ці джерела; якщо їхні інструменти зникають під час ізольованих ходів, використовуйте ті самі записи списку дозволених.

### `tools.codeMode`

`tools.codeMode` вмикає універсальний інтерфейс режиму коду OpenClaw. Коли його ввімкнено
для запуску з інструментами, звичайні інструменти OpenClaw переміщуються за міст каталогу `tools.*`
усередині пісочниці, а інструменти MCP стають доступними через згенерований простір імен `MCP`.
Модель зазвичай бачить `exec` і `wait`; такі інструменти, як `computer`,
структуровані результати яких не можуть пройти через міст, що підтримує лише JSON, залишаються безпосередньо доступними.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Також приймається скорочений запис:

```json5
{
  tools: { codeMode: true },
}
```

У режимі коду оголошення MCP доступні через віртуальний інтерфейс файлів API лише для читання.
Гостьовий код може викликати `API.list("mcp")` і
`API.read("mcp/<server>.d.ts")`, щоб переглянути сигнатури у стилі TypeScript перед
викликом `MCP.<server>.<tool>()`. Контракт середовища виконання, обмеження та кроки налагодження див. у розділі [Режим коду](/uk/reference/code-mode).

### `tools.allow` / `tools.deny`

Глобальна політика дозволу/заборони інструментів (заборона має пріоритет). Регістр не враховується, підтримуються символи підстановки `*`. Застосовується, навіть коли пісочницю Docker вимкнено.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` і `apply_patch` — окремі ідентифікатори інструментів. `allow: ["write"]` також вмикає `apply_patch` для сумісних моделей, але `deny: ["write"]` не забороняє `apply_patch`. Щоб заблокувати всі зміни файлів, забороніть `group:fs` або явно перелічіть кожен інструмент, що вносить зміни:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` і `alsoAllow` не можна одночасно задавати в одній області (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) — перевірка конфігурації відхиляє таке налаштування. Об’єднайте записи `alsoAllow` з `allow` або вилучіть `allow` і натомість використовуйте `profile` + `alsoAllow`.
</Note>

### `tools.byProvider`

Додатково обмежує інструменти для певних постачальників або моделей. Порядок: базовий профіль → профіль постачальника → дозвіл/заборона.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

Обмежує інструменти для конкретного ідентифікатора ініціатора запиту. Це додатковий рівень захисту поверх керування доступом до каналу; значення відправника мають надходити з адаптера каналу, а не з тексту повідомлення.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Ключі використовують явні префікси: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` або `"*"`. Ідентифікатори каналів є канонічними ідентифікаторами OpenClaw; псевдоніми на кшталт `teams` нормалізуються до `msteams`. Застарілі ключі без префікса приймаються лише як `id:`. Порядок зіставлення: канал+ідентифікатор, ідентифікатор, e164, ім’я користувача, ім’я, а потім символ підстановки.

Налаштування `agents.list[].tools.toolsBySender` для окремого агента перевизначає глобальне зіставлення відправника, якщо воно збігається, навіть із порожньою політикою `{}`.

### `tools.elevated`

Керує розширеним доступом `exec` поза пісочницею:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Перевизначення для окремого агента (`agents.list[].tools.elevated`) може лише додатково обмежувати доступ.
- `/elevated on|off|ask|full` зберігає стан для кожного сеансу; вбудовані директиви застосовуються до одного повідомлення.
- Розширений `exec` обходить пісочницю та використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціль `exec` — `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

Наведені значення є типовими, крім `applyPatch.allowModels` (за замовчуванням порожнє або не задане, тобто будь-яка сумісна модель може використовувати `apply_patch`). `approvalRunningNoticeMs` надсилає сповіщення про виконання, коли запуск `exec`, що потребує схвалення, триває довго; `0` вимикає його.

### `tools.loopDetection`

Перевірки безпеки щодо зациклення інструментів **за замовчуванням вимкнено**. Установіть `enabled: true`, щоб активувати виявлення. Налаштування можна визначити глобально в `tools.loopDetection` і перевизначити для окремого агента в `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Максимальна кількість викликів інструментів у збереженій історії для аналізу циклів.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Порогова кількість повторень шаблону без прогресу для попереджень.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Після такої кількості невдалих спроб блокує повторні виклики інструмента з тією самою недоступною або невідомою назвою.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Вища порогова кількість повторень для блокування критичних циклів.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Порогове значення для безумовної зупинки будь-якого виконання без прогресу.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Попереджати про повторні виклики того самого інструмента з тими самими аргументами.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Попереджати або блокувати відомі інструменти опитування (`process.poll`, `command_status` тощо).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Попереджати або блокувати поперемінні парні шаблони без прогресу.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Кількість спроб після автоматичної Compaction, протягом яких захист залишається активним; виконання переривається, якщо агент повторює ту саму комбінацію (інструмент, аргументи, результат) у межах цього вікна.
</ParamField>

<Warning>
Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, перевірка завершується помилкою.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // або змінна середовища BRAVE_API_KEY (провайдер Brave)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // необов’язково; вилучіть для автоматичного визначення
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

Наведено стандартні значення, крім `provider` і `userAgent`. Значення `maxResponseBytes` обмежується діапазоном 32000–10000000; `maxChars` обмежується значенням `maxCharsCap` (збільште `maxCharsCap`, щоб дозволити більші відповіді).

### `tools.media`

Налаштовує розпізнавання вхідних медіафайлів (зображень, аудіо та відео):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // застаріло: завершення й надалі опосередковуються агентом
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`concurrency` (стандартне значення `2`), `audio.maxBytes` (стандартне значення 20 МБ) і `video.maxBytes` (стандартне значення 50 МБ) наведено зі стандартними значеннями; стандартне значення `image.maxBytes` становить 10 МБ. Стандартні тайм-аути запитів для кожної можливості: `60` с для зображень і аудіо, `120` с для відео.

<AccordionGroup>
  <Accordion title="Поля запису моделі для медіафайлів">
    **Запис провайдера** (`type: "provider"` або не вказано):

    - `provider`: ідентифікатор API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
    - `model`: перевизначення ідентифікатора моделі
    - `profile` / `preferredProfile`: вибір профілю з `auth-profiles.json`

    **Запис CLI** (`type: "cli"`):

    - `command`: виконувана команда
    - `args`: шаблонні аргументи (підтримує `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо; `openclaw doctor --fix` переносить застарілі заповнювачі `{input}` до `{{MediaPath}}`)

    **Спільні поля:**

    - `capabilities`: необов’язковий список (`image`, `audio`, `video`). Кожен Plugin провайдера оголошує власний стандартний набір можливостей; наприклад, комплектний провайдер `openai` за замовчуванням підтримує зображення й аудіо, `anthropic`/`minimax` — зображення, `google` — зображення, аудіо й відео, а `groq` — аудіо.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
    - `tools.media.image.timeoutSeconds` і відповідні записи `timeoutSeconds` моделі зображень також застосовуються, коли агент викликає явний інструмент `image`. Для розпізнавання зображень цей тайм-аут застосовується до самого запиту й не скорочується через попередню підготовчу роботу.
    - У разі помилки використовується наступний запис.

    Автентифікація провайдера виконується у стандартному порядку: `auth-profiles.json` → змінні середовища → `models.providers.*.apiKey`.

    **Поля асинхронного завершення:**

    - `asyncCompletion.directSend`: застарілий прапорець сумісності. Завершені асинхронні завдання обробки медіафайлів і надалі опосередковуються сеансом запитувача, щоб агент отримав результат, вирішив, як повідомити його користувачеві, і скористався інструментом повідомлень, якщо цього вимагає доставка до джерела.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Визначає, які сеанси можуть бути ціллю інструментів сеансів (`sessions_list`, `sessions_history`, `sessions_send`).

Стандартне значення: `tree` (поточний сеанс і породжені ним сеанси, як-от субагенти).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Області видимості">
    - `self`: лише ключ поточного сеансу.
    - `tree`: поточний сеанс і сеанси, породжені поточним сеансом (субагенти).
    - `agent`: будь-який сеанс, що належить поточному ідентифікатору агента (може включати інших користувачів, якщо сеанси для кожного відправника виконуються з тим самим ідентифікатором агента).
    - `all`: будь-який сеанс. Для вибору цілі серед інших агентів усе одно потрібен `tools.agentToAgent`.
    - Обмеження пісочниці: коли поточний сеанс працює в пісочниці та `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (стандартне значення), видимість примусово встановлюється на `tree`, навіть якщо `tools.sessions.visibility="all"`.
    - Якщо значення не дорівнює `all`, `sessions_list` містить компактне поле `visibility`,
      яке описує фактичний режим, і попередження про те, що деякі сеанси поза
      поточною областю можуть бути пропущені.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Керує підтримкою вбудованих вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // за явною згодою: установіть true, щоб дозволити вбудовані файлові вкладення
        maxTotalBytes: 5242880, // загалом 5 МБ для всіх файлів
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 МБ на файл
        retainOnSessionKeep: false, // зберігати вкладення, коли cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Примітки щодо вкладень">
    - Для вкладень потрібно встановити `enabled: true`.
    - Вкладення субагента матеріалізуються в дочірньому робочому просторі за шляхом `.openclaw/attachments/<uuid>/` із файлом `.manifest.json`.
    - Вкладення ACP підтримують лише зображення й передаються безпосередньо до середовища виконання ACP після проходження однакових обмежень щодо кількості файлів, розміру кожного файлу та загального розміру.
    - Вміст вкладень автоматично вилучається під час збереження стенограми.
    - Вхідні дані Base64 перевіряються на сувору відповідність алфавіту й доповненню, а також проходять перевірку розміру перед декодуванням.
    - Права доступу до файлів вкладень субагента: `0700` для каталогів і `0600` для файлів.
    - Очищення вкладень субагента відбувається відповідно до політики `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише за умови `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Експериментальні прапорці вбудованих інструментів. За замовчуванням вимкнені, якщо не застосовується правило автоматичного ввімкнення для GPT-5 із суворим агентним режимом.

```json5
{
  tools: {
    experimental: {
      planTool: true, // увімкнути експериментальний update_plan
    },
  },
}
```

- `planTool`: вмикає структурований інструмент `update_plan` для відстеження нетривіальної багатоетапної роботи.
- Стандартне значення: `false`, якщо `agents.defaults.embeddedAgent.executionContract` (або перевизначення для окремого агента) не встановлено в `"strict-agentic"` для запуску через провайдера `openai` із моделлю сімейства GPT-5 (це також охоплює запуски OpenAI Codex CLI, оскільки маршрутизація автентифікації та моделей Codex належить провайдеру `openai`). Установіть `true`, щоб примусово ввімкнути інструмент поза цією областю, або `false`, щоб залишити його вимкненим навіть для запусків GPT-5 у суворому агентному режимі.
- Коли інструмент увімкнено, системна підказка також містить рекомендації щодо використання, щоб модель застосовувала його лише для суттєвої роботи й підтримувала щонайбільше один етап у стані `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: стандартна модель для породжених субагентів. Якщо не вказано, субагенти успадковують модель викликувача.
- `allowAgents`: стандартний список дозволених ідентифікаторів налаштованих цільових агентів для `sessions_spawn`, якщо агент-запитувач не задав власний `subagents.allowAgents` (`["*"]` = будь-яка налаштована ціль; стандартно: лише той самий агент). Застарілі записи, конфігурацію агентів для яких видалено, відхиляються `sessions_spawn` і не включаються до `agents_list`; запустіть `openclaw doctor --fix`, щоб очистити їх.
- `maxConcurrent`: максимальна кількість одночасних запусків субагентів. Стандартне значення: `8`.
- `runTimeoutSeconds`: тайм-аут (у секундах) для `sessions_spawn`, якщо викликувач не передає власне перевизначення. Стандартне значення: `0` (без тайм-ауту); наведене вище значення `900` є поширеним значенням, яке вмикають явно, а не вбудованим стандартним значенням.
- `announceTimeoutMs`: тайм-аут для кожного виклику (у мілісекундах) під час спроб Gateway доставити оголошення `agent`. Стандартне значення: `120000`. Повторні спроби після тимчасових помилок можуть збільшити загальний час очікування оголошення понад один налаштований тайм-аут.
- `archiveAfterMinutes`: кількість хвилин після завершення сеансу субагента до його автоматичного архівування. Стандартне значення: `60`; `0` вимикає автоматичне архівування.
- Політика інструментів для окремого субагента: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Власні провайдери та базові URL-адреси

Plugins провайдерів публікують власні рядки каталогу моделей. Додавайте власних провайдерів через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

Налаштування `baseUrl` власного або локального провайдера також є вузьким рішенням щодо мережевої довіри для HTTP-запитів моделі: OpenClaw дозволяє доступ саме до цього джерела `scheme://host:port` через захищений шлях отримання даних, не додаючи окремого параметра конфігурації та не надаючи довіри іншим приватним джерелам.

```json5
{
  models: {
    mode: "merge", // merge (стандартно) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | тощо
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Пріоритет автентифікації та об’єднання">
    - Використовуйте `authHeader: true` + `headers` для нестандартних потреб автентифікації.
    - Перевизначте кореневий каталог конфігурації агента за допомогою `OPENCLAW_AGENT_DIR`.
    - Пріоритет об’єднання для відповідних ідентифікаторів постачальників:
      - Непорожні значення `baseUrl` у файлі агента `models.json` мають пріоритет.
      - Непорожні значення `apiKey` агента мають пріоритет, лише якщо цей постачальник не керується через SecretRef у поточному контексті конфігурації або профілю автентифікації.
      - Значення `apiKey` постачальника, керовані через SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для посилань на змінні середовища, `secretref-managed` для посилань на файл або виконувану команду) замість збереження розкритих секретів.
      - Значення заголовків постачальника, керовані через SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для посилань на змінні середовища, `secretref-managed` для посилань на файл або виконувану команду).
      - Для порожніх або відсутніх значень `apiKey`/`baseUrl` агента використовуються резервні значення з `models.providers` у конфігурації.
      - Для відповідних значень моделі `contextWindow`/`maxTokens`: явне значення конфігурації має пріоритет, якщо воно присутнє та коректне (додатне скінченне число); інакше використовується неявне або згенероване значення каталогу.
      - Відповідне значення моделі `contextTokens` дотримується того самого правила: явне значення має пріоритет, інакше використовується неявне; застосовуйте його, щоб обмежити ефективний контекст без зміни власних метаданих моделі.
      - Каталоги Plugin постачальників зберігаються як згенеровані сегменти каталогів, що належать Plugin, у стані Plugin агента.
      - Використовуйте `models.mode: "replace"`, якщо потрібно, щоб конфігурація повністю перезаписувала `models.json` і не об’єднувала сегменти каталогів, що належать Plugin.
      - Збереження маркерів визначається джерелом: маркери записуються з активного знімка вихідної конфігурації (до розкриття), а не з розкритих значень секретів середовища виконання.

  </Accordion>
</AccordionGroup>

### Докладний опис полів постачальника

<AccordionGroup>
  <Accordion title="Каталог верхнього рівня">
    - `models.mode`: поведінка каталогу постачальників (`merge` або `replace`).
    - `models.providers`: власна мапа постачальників із ключами за ідентифікатором постачальника.
      - Безпечне редагування: використовуйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` або `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` для доповнювальних оновлень. `config set` відхиляє руйнівні заміни, якщо не передано `--replace`.

  </Accordion>
  <Accordion title="Підключення та автентифікація постачальника">
    - `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Для самостійно розміщених серверних систем із `/v1/chat/completions`, як-от MLX, vLLM, SGLang і більшість локальних серверів, сумісних з OpenAI, використовуйте `openai-completions`. Власний постачальник із `baseUrl`, але без `api`, за замовчуванням використовує `openai-completions`; установлюйте `openai-responses`, лише якщо серверна система підтримує `/v1/responses`.
    - `models.providers.*.apiKey`: облікові дані постачальника (надавайте перевагу SecretRef або підстановці змінної середовища).
    - `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: типове власне вікно контексту для моделей цього постачальника, якщо запис моделі не задає `contextWindow`.
    - `models.providers.*.contextTokens`: типове ефективне обмеження контексту середовища виконання для моделей цього постачальника, якщо запис моделі не задає `contextTokens`.
    - `models.providers.*.maxTokens`: типове обмеження кількості токенів виведення для моделей цього постачальника, якщо запис моделі не задає `maxTokens`.
    - `models.providers.*.timeoutSeconds`: необов’язковий для кожного постачальника час очікування HTTP-запиту до моделі в секундах, включно з підключенням, заголовками, тілом і обробкою переривання всього запиту.
    - `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` додає `options.num_ctx` до запитів (типове значення: `true`).
    - `models.providers.*.authHeader`: примусово передавати облікові дані в заголовку `Authorization`, коли це потрібно.
    - `models.providers.*.baseUrl`: базова URL-адреса висхідного API.
    - `models.providers.*.headers`: додаткові статичні заголовки для маршрутизації через проксі або орендаря.

  </Accordion>
  <Accordion title="Перевизначення транспорту запитів">
    `models.providers.*.request`: перевизначення транспорту для HTTP-запитів до постачальника моделі.

    - `request.headers`: додаткові заголовки (об’єднуються з типовими значеннями постачальника). Значення підтримують SecretRef.
    - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію постачальника), `"authorization-bearer"` (із `token`), `"header"` (із `headerName`, `value` і необов’язковим `prefix`).
    - `request.proxy`: перевизначення HTTP-проксі. Режими: `"env-proxy"` (використовувати змінні середовища `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (із `url`). Обидва режими підтримують необов’язковий вкладений об’єкт `tls`.
    - `request.tls`: перевизначення TLS для прямих з’єднань. Поля: `ca`, `cert`, `key`, `passphrase` (усі підтримують SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: якщо `true`, дозволяє HTTP-запити до постачальника моделі в приватні, CGNAT або подібні діапазони через захист HTTP-запитів постачальника. Базові URL-адреси власних або локальних постачальників уже довіряють точно налаштованому джерелу, крім джерел метаданих або локальної адресації каналу, які залишаються заблокованими без явної згоди. Установіть `false`, щоб відмовитися від довіри до точного джерела. WebSocket використовує той самий `request` для заголовків і TLS, але не цей захист запитів від SSRF. Типове значення — `false`.

  </Accordion>
  <Accordion title="Записи каталогу моделей">
    - `models.providers.*.models`: явні записи каталогу моделей постачальника.
    - `models.providers.*.models.*.input`: модальності вхідних даних моделі. Використовуйте `["text"]` для моделей лише з текстовим введенням і `["text", "image"]` для моделей із власною підтримкою зображень або комп’ютерного зору. Вкладені зображення додаються до ходів агента, лише якщо вибрану модель позначено як здатну обробляти зображення.
    - `models.providers.*.models.*.contextWindow`: метадані власного вікна контексту моделі. Це перевизначає `contextWindow` рівня постачальника для цієї моделі.
    - `models.providers.*.models.*.contextTokens`: необов’язкове обмеження контексту середовища виконання. Це перевизначає `contextTokens` рівня постачальника; використовуйте його, якщо потрібен менший ефективний бюджет контексту, ніж власне значення `contextWindow` моделі; `openclaw models list` показує обидва значення, якщо вони відрізняються.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` із непорожнім невласним `baseUrl` (вузол не `api.openai.com`) OpenClaw примусово встановлює `false` під час виконання. Порожній або пропущений `baseUrl` зберігає типову поведінку OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: необов’язкова підказка сумісності для сумісних з OpenAI кінцевих точок чату, які підтримують лише рядки. Якщо `true`, OpenClaw перетворює масиви `messages[].content`, що містять лише текст, на звичайні рядки перед надсиланням запиту.
    - `models.providers.*.models.*.compat.strictMessageKeys`: необов’язкова підказка сумісності для суворих сумісних з OpenAI кінцевих точок чату. Якщо `true`, OpenClaw залишає у вихідних об’єктах повідомлень Chat Completions лише `role` і `content` перед надсиланням запиту.
    - `models.providers.*.models.*.compat.thinkingFormat`: необов’язкова підказка щодо корисного навантаження міркування. Використовуйте `"together"` для `reasoning.enabled` у стилі Together, `"qwen"` для `enable_thinking` верхнього рівня або `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на сумісних з OpenAI серверах сімейства Qwen, які підтримують аргументи шаблону чату на рівні запиту, як-от vLLM. Налаштовані моделі Qwen у vLLM надають двійковий вибір `/think` (`off`, `on`) для цих форматів.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: необов’язкова підказка сумісності для серверних систем Chat Completions у стилі DeepSeek, які вимагають зберігати `reasoning_content` у попередніх повідомленнях асистента під час повторного відтворення. Якщо `true`, OpenClaw зберігає це поле у вихідних повідомленнях асистента. Використовуйте це під час підключення власного сумісного з DeepSeek проксі, який відхиляє запити після видалення міркувань. Типове значення — `false`.

  </Accordion>
  <Accordion title="Виявлення Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: кореневі налаштування автоматичного виявлення Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнення або вимкнення неявного виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр за ідентифікатором постачальника для цільового виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне вікно контексту для виявлених моделей.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервна максимальна кількість токенів виведення для виявлених моделей.

  </Accordion>
</AccordionGroup>

Інтерактивне підключення власного постачальника визначає введення зображень для відомих шаблонів ідентифікаторів моделей комп’ютерного зору, включно з GPT-4o/GPT-4.1/GPT-5+, сімействами моделей міркування `o1`/`o3`/`o4`, Claude, Gemini, будь-яким ідентифікатором із суфіксом `-vl` (Qwen-VL і подібними), а також іменованими сімействами, як-от LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V і GLM-4V; додаткове запитання пропускається для відомих сімейств лише з текстовим введенням (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama та простих ідентифікаторів Qwen без суфікса vl/vision). Для невідомих ідентифікаторів моделей запит про підтримку зображень усе одно відображається. Неінтерактивне підключення використовує те саме визначення; передайте `--custom-image-input`, щоб примусово встановити метадані підтримки зображень, або `--custom-text-input`, щоб примусово встановити метадані лише текстового введення.

### Приклади постачальників

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Офіційний зовнішній Plugin постачальника `cerebras` може налаштувати це за допомогою `openclaw onboard --auth-choice cerebras-api-key`. Використовуйте явну конфігурацію постачальника, лише коли потрібно перевизначити типові значення.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Використовуйте `cerebras/zai-glm-4.7` для Cerebras; `zai/glm-4.7` для прямого підключення до Z.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Вбудований постачальник, сумісний з Anthropic. Скорочений спосіб: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Локальні моделі (LM Studio)">
    Див. [Локальні моделі](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на потужному обладнанні; залиште об’єднаними моделі у хмарі для резервного перемикання.
  </Accordion>
  <Accordion title="MiniMax M3 (безпосередньо)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Установіть `MINIMAX_API_KEY`. Скорочені команди: `openclaw onboard --auth-choice minimax-global-api` або `openclaw onboard --auth-choice minimax-cn-api`. Каталог моделей за замовчуванням використовує M3, а також містить варіанти M2.7. У сумісному з Anthropic потоковому режимі OpenClaw за замовчуванням вимикає мислення MiniMax M2.x, якщо ви явно не задасте `thinking` самостійно; MiniMax-M3 (і M3.x) за замовчуванням залишається в режимі мислення постачальника з пропущеним або адаптивним параметром. `/fast on` або `params.fastMode: true` замінює `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Для китайської кінцевої точки: `baseUrl: "https://api.moonshot.cn/v1"` або `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Власні кінцеві точки Moonshot заявляють про сумісність потокового передавання даних про використання в спільному транспорті `openai-completions`, а OpenClaw визначає це за можливостями кінцевої точки, а не лише за вбудованим ідентифікатором постачальника.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Установіть `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або `opencode-go/...` для каталогу Go. Скорочена команда: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    Базова URL-адреса не повинна містити `/v1` (клієнт Anthropic додає його сам). Скорочена команда: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Установіть `ZAI_API_KEY`. Посилання на моделі використовують канонічний ідентифікатор постачальника `zai/*`. Скорочена команда: `openclaw onboard --auth-choice zai-api-key`.

    - Загальна кінцева точка: `https://api.z.ai/api/paas/v4`
    - Кінцева точка для програмування: `https://api.z.ai/api/coding/paas/v4`
    - Варіант автентифікації `zai-api-key` за замовчуванням перевіряє ваш ключ і автоматично визначає, до якої кінцевої точки він належить (якщо результат визначення неоднозначний, пропонує вибір із варіантом Global за замовчуванням). Для явного вибору також доступні окремі варіанти автентифікації CN і Coding-Plan.
    - Для загальної кінцевої точки визначте власного постачальника з перевизначеною базовою URL-адресою.

  </Accordion>
</AccordionGroup>

---

## Пов’язані матеріали

- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Конфігурація — канали](/uk/gateway/config-channels)
- [Довідник із конфігурації](/uk/gateway/configuration-reference) — інші ключі верхнього рівня
- [Інструменти та плагіни](/uk/tools)
