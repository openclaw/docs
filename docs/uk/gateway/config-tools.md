---
read_when:
    - Налаштування політики, списків дозволених елементів або експериментальних функцій `tools.*`
    - Реєстрація власних провайдерів або перевизначення базових URL-адрес
    - Налаштування самостійно розміщених кінцевих точок, сумісних з OpenAI
sidebarTitle: Tools and custom providers
summary: Конфігурація інструментів (політика, експериментальні перемикачі, інструменти на базі провайдера) і налаштування власного провайдера/base-URL
title: Конфігурація — інструменти та власні провайдери
x-i18n:
    generated_at: "2026-04-27T04:00:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: caa2c3dc798e7465fec6cf739222436e36cff9990fec08b56613996e94364f48
    source_path: gateway/config-tools.md
    workflow: 15
---

Ключі конфігурації `tools.*` і налаштування власного провайдера / base-URL. Для агентів, каналів та інших ключів конфігурації верхнього рівня див. [Довідник із конфігурації](/uk/gateway/configuration-reference).

## Інструменти

### Профілі інструментів

`tools.profile` задає базовий список дозволених елементів перед `tools.allow`/`tools.deny`:

<Note>
Локальне онбординг-налаштування за замовчуванням встановлює для нових локальних конфігурацій `tools.profile: "coding"`, якщо значення не задано (наявні явно задані профілі зберігаються).
</Note>

| Профіль     | Містить                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `minimal`   | лише `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Без обмежень (так само, як якщо не задано)                                                                                     |

### Групи інструментів

| Група              | Інструменти                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як псевдонім для `exec`)                                      |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | Усі вбудовані інструменти (не включає плагіни провайдерів)                                                             |

### `tools.allow` / `tools.deny`

Глобальна політика дозволу/заборони інструментів (заборона має пріоритет). Без урахування регістру, підтримуються шаблони `*`. Застосовується навіть тоді, коли пісочницю Docker вимкнено.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Додатково обмежує інструменти для певних провайдерів або моделей. Порядок: базовий профіль → профіль провайдера → allow/deny.

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

### `tools.elevated`

Керує розширеним доступом `exec` поза межами пісочниці:

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

- Перевизначення для окремого агента (`agents.list[].tools.elevated`) може лише додатково обмежувати.
- `/elevated on|off|ask|full` зберігає стан для кожної сесії; вбудовані директиви застосовуються до одного повідомлення.
- Розширений `exec` обходить пісочницю та використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціль `exec` — `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Перевірки безпеки циклів інструментів **вимкнені за замовчуванням**. Щоб активувати виявлення, установіть `enabled: true`. Параметри можна задати глобально в `tools.loopDetection` і перевизначити для окремого агента в `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Максимальний обсяг історії викликів інструментів, що зберігається для аналізу циклів.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Поріг повторюваного шаблону без прогресу для попереджень.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Вищий поріг повторення для блокування критичних циклів.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Поріг жорсткої зупинки для будь-якого виконання без прогресу.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Попереджати про повторні виклики того самого інструмента з тими самими аргументами.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Попереджати/блокувати відомі інструменти опитування (`process.poll`, `command_status` тощо).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Попереджати/блокувати чергування шаблонів без прогресу в парі.
</ParamField>

<Warning>
Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, перевірка не пройде.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // або змінна середовища BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // необов’язково; не вказуйте для автоматичного визначення
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
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

### `tools.media`

Налаштовує обробку вхідних медіа (зображення/аудіо/відео):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // опціонально: надсилати завершені асинхронні завдання music/video безпосередньо в канал
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
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Поля запису моделі медіа">
    **Запис провайдера** (`type: "provider"` або без указання):

    - `provider`: ідентифікатор API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
    - `model`: перевизначення ідентифікатора моделі
    - `profile` / `preferredProfile`: вибір профілю з `auth-profiles.json`

    **Запис CLI** (`type: "cli"`):

    - `command`: виконуваний файл для запуску
    - `args`: аргументи з шаблонами (підтримуються `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо)

    **Спільні поля:**

    - `capabilities`: необов’язковий список (`image`, `audio`, `video`). Значення за замовчуванням: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
    - У разі помилки використовується наступний запис.

    Автентифікація провайдера дотримується стандартного порядку: `auth-profiles.json` → змінні середовища → `models.providers.*.apiKey`.

    **Поля асинхронного завершення:**

    - `asyncCompletion.directSend`: якщо `true`, завершені асинхронні завдання `music_generate` і `video_generate` спочатку намагаються доставлятися безпосередньо в канал. Значення за замовчуванням: `false` (застарілий шлях пробудження сесії запитувача/доставки моделлю).

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

Керує тим, на які сесії можуть бути спрямовані інструменти сесій (`sessions_list`, `sessions_history`, `sessions_send`).

Значення за замовчуванням: `tree` (поточна сесія + сесії, породжені нею, наприклад субагенти).

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
    - `self`: лише ключ поточної сесії.
    - `tree`: поточна сесія + сесії, породжені поточною сесією (субагенти).
    - `agent`: будь-яка сесія, що належить поточному ідентифікатору агента (може включати інших користувачів, якщо ви запускаєте сесії для кожного відправника під тим самим ідентифікатором агента).
    - `all`: будь-яка сесія. Націлювання між агентами все одно потребує `tools.agentToAgent`.
    - Обмеження пісочниці: коли поточна сесія ізольована в пісочниці і `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, видимість примусово встановлюється на `tree`, навіть якщо `tools.sessions.visibility="all"`.
  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Керує підтримкою вбудованих вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // опціонально: встановіть true, щоб дозволити вбудовані файлові вкладення
        maxTotalBytes: 5242880, // 5 МБ загалом для всіх файлів
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
    - Вкладення підтримуються лише для `runtime: "subagent"`. Середовище ACP їх відхиляє.
    - Файли матеріалізуються в дочірньому робочому просторі за шляхом `.openclaw/attachments/<uuid>/` із файлом `.manifest.json`.
    - Вміст вкладень автоматично редагується під час збереження транскрипту.
    - Входи Base64 перевіряються за допомогою суворих перевірок алфавіту/доповнення та захисту розміру до декодування.
    - Права доступу до файлів: `0700` для каталогів і `0600` для файлів.
    - Очищення виконується відповідно до політики `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише коли `retainOnSessionKeep: true`.
  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Прапорці експериментальних вбудованих інструментів. За замовчуванням вимкнено, якщо не застосовується правило автоматичного ввімкнення strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // увімкнути експериментальний update_plan
    },
  },
}
```

- `planTool`: увімкнює структурований інструмент `update_plan` для відстеження нетривіальної багатокрокової роботи.
- Значення за замовчуванням: `false`, якщо тільки `agents.defaults.embeddedPi.executionContract` (або перевизначення для окремого агента) не встановлено в `"strict-agentic"` для запуску OpenAI або OpenAI Codex сімейства GPT-5. Установіть `true`, щоб примусово ввімкнути інструмент поза цими межами, або `false`, щоб залишити його вимкненим навіть для запусків strict-agentic GPT-5.
- Коли інструмент увімкнено, системний промпт також додає інструкції з використання, щоб модель застосовувала його лише для суттєвої роботи й підтримувала не більше одного кроку зі станом `in_progress`.

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: модель за замовчуванням для породжених субагентів. Якщо не вказано, субагенти успадковують модель викликача.
- `allowAgents`: список дозволених за замовчуванням цільових ідентифікаторів агентів для `sessions_spawn`, коли агент-запитувач не задає власний `subagents.allowAgents` (`["*"]` = будь-який; за замовчуванням: лише той самий агент).
- `runTimeoutSeconds`: тайм-аут за замовчуванням (у секундах) для `sessions_spawn`, коли виклик інструмента не містить `runTimeoutSeconds`. `0` означає відсутність тайм-ауту.
- Політика інструментів для окремих субагентів: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Власні провайдери та base URL

OpenClaw використовує вбудований каталог моделей. Додавайте власних провайдерів через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (за замовчуванням) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
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
  <Accordion title="Автентифікація та пріоритет злиття">
    - Використовуйте `authHeader: true` + `headers` для нестандартних потреб автентифікації.
    - Перевизначте кореневий каталог конфігурації агента через `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілий псевдонім змінної середовища).
    - Пріоритет злиття для провайдерів із однаковими ідентифікаторами:
      - Непорожні значення `baseUrl` з агентського `models.json` мають пріоритет.
      - Непорожні значення `apiKey` з агента мають пріоритет лише тоді, коли цей провайдер не керується через SecretRef у поточному контексті конфігурації/профілю автентифікації.
      - Значення `apiKey` для провайдерів, керованих SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для посилань на змінні середовища, `secretref-managed` для file/exec-посилань) замість збереження розкритих секретів.
      - Значення заголовків для провайдерів, керованих SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для посилань на змінні середовища, `secretref-managed` для file/exec-посилань).
      - Порожні або відсутні агентські `apiKey`/`baseUrl` повертаються до `models.providers` у конфігурації.
      - Для відповідних моделей `contextWindow`/`maxTokens` використовується вище значення між явною конфігурацією та неявними значеннями каталогу.
      - Для відповідних моделей `contextTokens` зберігає явно задане обмеження середовища виконання, якщо воно є; використовуйте це, щоб обмежити ефективний контекст без зміни власних метаданих моделі.
      - Використовуйте `models.mode: "replace"`, якщо хочете, щоб конфігурація повністю переписала `models.json`.
      - Збереження маркерів є авторитетним щодо джерела: маркери записуються з активного знімка конфігурації джерела (до розкриття), а не з розкритих значень секретів у середовищі виконання.
  </Accordion>
</AccordionGroup>

### Докладно про поля провайдера

<AccordionGroup>
  <Accordion title="Каталог верхнього рівня">
    - `models.mode`: поведінка каталогу провайдерів (`merge` або `replace`).
    - `models.providers`: мапа власних провайдерів, ключем у якій є ідентифікатор провайдера.
      - Безпечне редагування: використовуйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` або `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` для додаткових оновлень. `config set` відхиляє руйнівні заміни, якщо ви не передасте `--replace`.
  </Accordion>
  <Accordion title="Підключення провайдера та автентифікація">
    - `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо).
    - `models.providers.*.apiKey`: облікові дані провайдера (бажано через SecretRef/підстановку змінних середовища).
    - `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.timeoutSeconds`: необов’язковий тайм-аут HTTP-запиту моделі на рівні провайдера в секундах, включно з підключенням, заголовками, тілом і повним перериванням запиту.
    - `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` додає `options.num_ctx` до запитів (за замовчуванням: `true`).
    - `models.providers.*.authHeader`: примусово передає облікові дані в заголовку `Authorization`, коли це потрібно.
    - `models.providers.*.baseUrl`: базова URL-адреса API верхнього рівня.
    - `models.providers.*.headers`: додаткові статичні заголовки для маршрутизації через проксі/орендаря.
  </Accordion>
  <Accordion title="Перевизначення транспорту запитів">
    `models.providers.*.request`: перевизначення транспорту для HTTP-запитів провайдера моделі.

    - `request.headers`: додаткові заголовки (об’єднуються зі значеннями провайдера за замовчуванням). Значення підтримують SecretRef.
    - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію провайдера), `"authorization-bearer"` (із `token`), `"header"` (із `headerName`, `value`, необов’язковим `prefix`).
    - `request.proxy`: перевизначення HTTP-проксі. Режими: `"env-proxy"` (використовувати змінні середовища `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (із `url`). Обидва режими підтримують необов’язковий підоб’єкт `tls`.
    - `request.tls`: перевизначення TLS для прямих підключень. Поля: `ca`, `cert`, `key`, `passphrase` (усі підтримують SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: якщо `true`, дозволяє HTTPS до `baseUrl`, коли DNS резолвиться в приватні, CGNAT або подібні діапазони, через захист HTTP fetch провайдера (явна згода оператора для довірених самостійно розміщених кінцевих точок, сумісних з OpenAI). WebSocket використовує той самий `request` для заголовків/TLS, але не цей SSRF-запобіжник fetch. За замовчуванням `false`.

  </Accordion>
  <Accordion title="Записи каталогу моделей">
    - `models.providers.*.models`: явні записи каталогу моделей провайдера.
    - `models.providers.*.models.*.contextWindow`: метадані власного вікна контексту моделі.
    - `models.providers.*.models.*.contextTokens`: необов’язкове обмеження контексту середовища виконання. Використовуйте це, якщо хочете менший ефективний бюджет контексту, ніж власний `contextWindow` моделі; `openclaw models list` показує обидва значення, коли вони відрізняються.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` із непорожнім неоригінальним `baseUrl` (хост не `api.openai.com`) OpenClaw примусово встановлює це значення в `false` під час виконання. Порожній/відсутній `baseUrl` зберігає стандартну поведінку OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: необов’язкова підказка сумісності для сумісних з OpenAI chat-кінцевих точок, які підтримують лише рядки. Якщо `true`, OpenClaw перетворює масиви `messages[].content`, що містять лише текст, на звичайні рядки перед надсиланням запиту.
  </Accordion>
  <Accordion title="Виявлення Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: кореневий розділ параметрів автоматичного виявлення Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр ідентифікатора провайдера для цільового виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне вікно контексту для виявлених моделей.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервна максимальна кількість вихідних токенів для виявлених моделей.
  </Accordion>
</AccordionGroup>

### Приклади провайдерів

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.6 / 4.7)">
    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/zai-glm-4.6"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
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
              { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Використовуйте `cerebras/zai-glm-4.7` для Cerebras; `zai/glm-4.7` — для прямого доступу до Z.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Сумісний з Anthropic, вбудований провайдер. Скорочений варіант: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Локальні моделі (LM Studio)">
    Див. [Локальні моделі](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на серйозному обладнанні; залишайте розміщені моделі об’єднаними для резервного використання.
  </Accordion>
  <Accordion title="MiniMax M2.7 (напряму)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
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
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Установіть `MINIMAX_API_KEY`. Скорочені варіанти: `openclaw onboard --auth-choice minimax-global-api` або `openclaw onboard --auth-choice minimax-cn-api`. Каталог моделей за замовчуванням містить лише M2.7. На сумісному з Anthropic шляху потокової передачі OpenClaw за замовчуванням вимикає thinking MiniMax, якщо ви явно не встановите `thinking` самостійно. `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

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

    Власні кінцеві точки Moonshot оголошують сумісність використання потокової передачі на спільному транспорті `openai-completions`, і OpenClaw визначає це за можливостями кінцевої точки, а не лише за ідентифікатором вбудованого провайдера.

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

    Установіть `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або `opencode-go/...` для каталогу Go. Скорочений варіант: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

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

    Base URL має не містити `/v1` (клієнт Anthropic додає його сам). Скорочений варіант: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Установіть `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` — прийнятні псевдоніми. Скорочений варіант: `openclaw onboard --auth-choice zai-api-key`.

    - Загальна кінцева точка: `https://api.z.ai/api/paas/v4`
    - Кінцева точка для кодування (за замовчуванням): `https://api.z.ai/api/coding/paas/v4`
    - Для загальної кінцевої точки визначте власного провайдера з перевизначенням base URL.

  </Accordion>
</AccordionGroup>

---

## Пов’язані матеріали

- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Конфігурація — канали](/uk/gateway/config-channels)
- [Довідник із конфігурації](/uk/gateway/configuration-reference) — інші ключі верхнього рівня
- [Інструменти та плагіни](/uk/tools)
