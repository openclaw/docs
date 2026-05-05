---
read_when:
    - Налаштування політики `tools.*`, списків дозволеного або експериментальних функцій
    - Реєстрація власних провайдерів або перевизначення базових URL-адрес
    - Налаштування OpenAI-сумісних самостійно розміщених кінцевих точок
sidebarTitle: Tools and custom providers
summary: Конфігурація інструментів (політика, експериментальні перемикачі, інструменти на базі провайдера) і налаштування власного провайдера/базової URL-адреси
title: Конфігурація — інструменти та користувацькі провайдери
x-i18n:
    generated_at: "2026-05-05T00:49:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9196bff46d8b0f9447fb46b47fc764f5bbc4f0b19eb252d4db611e94e57b4883
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` ключі конфігурації та налаштування користувацького провайдера / базової URL-адреси. Для агентів, каналів та інших ключів конфігурації верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Інструменти

### Профілі інструментів

`tools.profile` задає базовий список дозволеного перед `tools.allow`/`tools.deny`:

<Note>
Локальний onboarding за замовчуванням установлює для нових локальних конфігурацій `tools.profile: "coding"`, якщо його не задано (наявні явно задані профілі зберігаються).
</Note>

| Профіль     | Містить                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | лише `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Без обмежень (те саме, що й не задано)                                                                                                  |

### Групи інструментів

| Група              | Інструменти                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як псевдонім для `exec`)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Усі вбудовані інструменти (не включає плагіни провайдерів)                                                                          |

### `tools.allow` / `tools.deny`

Глобальна політика дозволу/заборони інструментів (заборона має пріоритет). Не залежить від регістру, підтримує маски `*`. Застосовується навіть коли Docker sandbox вимкнено.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` і `apply_patch` є окремими ідентифікаторами інструментів. `allow: ["write"]` також вмикає `apply_patch` для сумісних моделей, але `deny: ["write"]` не забороняє `apply_patch`. Щоб заблокувати всі зміни файлів, забороніть `group:fs` або явно перелічіть кожен інструмент, що змінює файли:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Додатково обмежує інструменти для певних провайдерів або моделей. Порядок: базовий профіль → профіль провайдера → дозвіл/заборона.

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

Керує підвищеним доступом `exec` поза sandbox:

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

- Перевизначення для агента (`agents.list[].tools.elevated`) може лише додатково обмежувати.
- `/elevated on|off|ask|full` зберігає стан для кожної сесії; вбудовані директиви застосовуються до одного повідомлення.
- Підвищений `exec` обходить sandboxing і використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціль `exec` — `node`).

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

Перевірки безпеки циклів інструментів **вимкнені за замовчуванням**. Установіть `enabled: true`, щоб активувати виявлення. Налаштування можна визначити глобально в `tools.loopDetection` і перевизначити для кожного агента в `agents.list[].tools.loopDetection`.

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
  Максимальна історія викликів інструментів, що зберігається для аналізу циклів.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Поріг повторюваного шаблону без прогресу для попереджень.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Вищий поріг повторень для блокування критичних циклів.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Поріг жорсткої зупинки для будь-якого виконання без прогресу.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Попереджати про повторювані виклики того самого інструмента з тими самими аргументами.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Попереджати/блокувати відомі інструменти опитування (`process.poll`, `command_status` тощо).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Попереджати/блокувати чергування парних шаблонів без прогресу.
</ParamField>

<Warning>
Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, перевірка не проходить.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
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

Налаштовує розуміння вхідних медіа (зображення/аудіо/відео):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
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

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **Запис провайдера** (`type: "provider"` або опущено):

    - `provider`: ідентифікатор API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
    - `model`: перевизначення ідентифікатора моделі
    - `profile` / `preferredProfile`: вибір профілю `auth-profiles.json`

    **Запис CLI** (`type: "cli"`):

    - `command`: виконуваний файл для запуску
    - `args`: шаблонізовані аргументи (підтримує `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо; `openclaw doctor --fix` переносить застарілі заповнювачі `{input}` до `{{MediaPath}}`)

    **Спільні поля:**

    - `capabilities`: необов’язковий список (`image`, `audio`, `video`). Стандартні значення: `openai`/`anthropic`/`minimax` → зображення, `google` → зображення+аудіо+відео, `groq` → аудіо.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
    - `tools.media.image.timeoutSeconds` і відповідні записи `timeoutSeconds` моделі зображень також застосовуються, коли агент викликає явний інструмент `image`.
    - У разі збоїв використовується наступний запис.

    Автентифікація провайдера дотримується стандартного порядку: `auth-profiles.json` → змінні середовища → `models.providers.*.apiKey`.

    **Поля асинхронного завершення:**

    - `asyncCompletion.directSend`: застарілий прапорець сумісності. Завершені асинхронні медіазавдання залишаються опосередкованими сеансом запитувача, щоб агент отримав результат, вирішив, як повідомити користувача, і використав інструмент повідомлень, коли цього потребує доставка джерелу.

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

Керує тим, які сеанси можуть бути ціллю інструментів сеансів (`sessions_list`, `sessions_history`, `sessions_send`).

Стандартно: `tree` (поточний сеанс + сеанси, створені ним, наприклад субагенти).

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
  <Accordion title="Visibility scopes">
    - `self`: лише ключ поточного сеансу.
    - `tree`: поточний сеанс + сеанси, створені поточним сеансом (субагенти).
    - `agent`: будь-який сеанс, що належить ідентифікатору поточного агента (може включати інших користувачів, якщо ви запускаєте сеанси для кожного відправника під тим самим ідентифікатором агента).
    - `all`: будь-який сеанс. Цілювання між агентами все одно потребує `tools.agentToAgent`.
    - Обмеження пісочниці: коли поточний сеанс перебуває в пісочниці й `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, видимість примусово встановлюється на `tree`, навіть якщо `tools.sessions.visibility="all"`.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Керує підтримкою вбудованих вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Примітки щодо вкладень">
    - Вкладення підтримуються лише для `runtime: "subagent"`. Середовище виконання ACP відхиляє їх.
    - Файли матеріалізуються в дочірньому робочому просторі за шляхом `.openclaw/attachments/<uuid>/` із `.manifest.json`.
    - Вміст вкладень автоматично редагується під час збереження транскрипту.
    - Вхідні дані Base64 перевіряються суворими перевірками алфавіту/доповнення та захистом розміру перед декодуванням.
    - Дозволи файлів: `0700` для директорій і `0600` для файлів.
    - Очищення відповідає політиці `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише коли `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Експериментальні вбудовані прапорці інструментів. Типово вимкнено, якщо не застосовується правило автоматичного ввімкнення для strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: вмикає структурований інструмент `update_plan` для відстеження нетривіальної багатоетапної роботи.
- Типово: `false`, якщо `agents.defaults.embeddedPi.executionContract` (або перевизначення для окремого агента) не встановлено на `"strict-agentic"` для запуску OpenAI або OpenAI Codex сімейства GPT-5. Установіть `true`, щоб примусово ввімкнути інструмент поза цією областю, або `false`, щоб залишити його вимкненим навіть для strict-agentic запусків GPT-5.
- Коли ввімкнено, системний промпт також додає настанови з використання, щоб модель застосовувала його лише для суттєвої роботи й тримала щонайбільше один крок `in_progress`.

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

- `model`: типова модель для породжених субагентів. Якщо пропущено, субагенти успадковують модель викликача.
- `allowAgents`: типовий список дозволених ідентифікаторів цільових агентів для `sessions_spawn`, коли агент-запитувач не задає власний `subagents.allowAgents` (`["*"]` = будь-який; типово: лише той самий агент).
- `runTimeoutSeconds`: типовий тайм-аут (у секундах) для `sessions_spawn`, коли виклик інструмента пропускає `runTimeoutSeconds`. `0` означає без тайм-ауту.
- Політика інструментів для кожного субагента: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Користувацькі провайдери й базові URL-адреси

OpenClaw використовує вбудований каталог моделей. Додавайте користувацьких провайдерів через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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
    - Використовуйте `authHeader: true` + `headers` для користувацьких потреб автентифікації.
    - Перевизначайте корінь конфігурації агента за допомогою `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілого псевдоніма змінної середовища).
    - Пріоритет злиття для збіжних ідентифікаторів провайдерів:
      - Непорожні значення `baseUrl` з агентського `models.json` мають перевагу.
      - Непорожні значення `apiKey` агента мають перевагу лише тоді, коли цей провайдер не керується SecretRef у поточному контексті конфігурації/профілю автентифікації.
      - Значення `apiKey` провайдера, керованого SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для посилань на env, `secretref-managed` для посилань на file/exec), замість збереження розв'язаних секретів.
      - Значення заголовків провайдера, керованого SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для посилань на env, `secretref-managed` для посилань на file/exec).
      - Порожні або відсутні `apiKey`/`baseUrl` агента повертаються до `models.providers` у конфігурації.
      - Збіжні `contextWindow`/`maxTokens` моделі використовують більше значення між явною конфігурацією та неявними значеннями каталогу.
      - Збіжний `contextTokens` моделі зберігає явне обмеження середовища виконання, коли воно наявне; використовуйте його, щоб обмежити ефективний контекст без зміни нативних метаданих моделі.
      - Використовуйте `models.mode: "replace"`, коли хочете, щоб конфігурація повністю переписала `models.json`.
      - Збереження маркерів є джерело-авторитетним: маркери записуються з активного знімка конфігурації джерела (до розв'язання), а не з розв'язаних значень секретів середовища виконання.

  </Accordion>
</AccordionGroup>

### Докладно про поля провайдера

<AccordionGroup>
  <Accordion title="Каталог верхнього рівня">
    - `models.mode`: поведінка каталогу провайдерів (`merge` або `replace`).
    - `models.providers`: мапа користувацьких провайдерів із ключем за ідентифікатором провайдера.
      - Безпечні редагування: використовуйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` або `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` для адитивних оновлень. `config set` відмовляє в деструктивних замінах, якщо не передати `--replace`.

  </Accordion>
  <Accordion title="Підключення та автентифікація провайдера">
    - `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо). Для самостійно розгорнутих бекендів `/v1/chat/completions`, таких як MLX, vLLM, SGLang і більшість локальних серверів, сумісних з OpenAI, використовуйте `openai-completions`. Користувацький провайдер із `baseUrl`, але без `api`, типово використовує `openai-completions`; задавайте `openai-responses` лише коли бекенд підтримує `/v1/responses`.
    - `models.providers.*.apiKey`: облікові дані провайдера (надавайте перевагу SecretRef/підстановці env).
    - `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: типове нативне контекстне вікно для моделей цього провайдера, коли запис моделі не задає `contextWindow`.
    - `models.providers.*.contextTokens`: типове ефективне обмеження контексту середовища виконання для моделей цього провайдера, коли запис моделі не задає `contextTokens`.
    - `models.providers.*.maxTokens`: типове обмеження вихідних токенів для моделей цього провайдера, коли запис моделі не задає `maxTokens`.
    - `models.providers.*.timeoutSeconds`: необов'язковий тайм-аут HTTP-запиту до моделі для окремого провайдера в секундах, включно з підключенням, заголовками, тілом і загальною обробкою переривання запиту.
    - `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` вставляє `options.num_ctx` у запити (типово: `true`).
    - `models.providers.*.authHeader`: примусово передає облікові дані в заголовку `Authorization`, коли це потрібно.
    - `models.providers.*.baseUrl`: базова URL-адреса upstream API.
    - `models.providers.*.headers`: додаткові статичні заголовки для маршрутизації проксі/орендаря.

  </Accordion>
  <Accordion title="Перевизначення транспорту запитів">
    `models.providers.*.request`: перевизначення транспорту для HTTP-запитів до провайдера моделей.

    - `request.headers`: додаткові заголовки (злиті з типовими значеннями провайдера). Значення приймають SecretRef.
    - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію провайдера), `"authorization-bearer"` (з `token`), `"header"` (з `headerName`, `value`, необов'язковим `prefix`).
    - `request.proxy`: перевизначення HTTP-проксі. Режими: `"env-proxy"` (використовувати змінні середовища `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (з `url`). Обидва режими приймають необов'язковий підоб'єкт `tls`.
    - `request.tls`: перевизначення TLS для прямих підключень. Поля: `ca`, `cert`, `key`, `passphrase` (усі приймають SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: коли `true`, дозволяє HTTPS до `baseUrl`, коли DNS розв'язується в приватні, CGNAT або подібні діапазони, через захист HTTP fetch провайдера (явна згода оператора для довірених самостійно розгорнутих кінцевих точок, сумісних з OpenAI). URL-адреси потоків провайдера моделей через Loopback, такі як `localhost`, `127.0.0.1` і `[::1]`, дозволяються автоматично, якщо це явно не встановлено на `false`; хости LAN, tailnet і приватні DNS усе ще потребують явної згоди. WebSocket використовує той самий `request` для заголовків/TLS, але не цей fetch SSRF gate. Типово `false`.

  </Accordion>
  <Accordion title="Записи каталогу моделей">
    - `models.providers.*.models`: явні записи каталогу моделей провайдера.
    - `models.providers.*.models.*.input`: модальності введення моделі. Використовуйте `["text"]` для моделей лише з текстом і `["text", "image"]` для нативних image/vision моделей. Вкладення зображень вставляються в ходи агента лише коли вибрану модель позначено як здатну обробляти зображення.
    - `models.providers.*.models.*.contextWindow`: метадані нативного контекстного вікна моделі. Це перевизначає `contextWindow` рівня провайдера для цієї моделі.
    - `models.providers.*.models.*.contextTokens`: необов'язкове обмеження контексту середовища виконання. Це перевизначає `contextTokens` рівня провайдера; використовуйте його, коли хочете менший ефективний бюджет контексту, ніж нативний `contextWindow` моделі; `openclaw models list` показує обидва значення, коли вони відрізняються.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: необов'язкова підказка сумісності. Для `api: "openai-completions"` із непорожнім ненативним `baseUrl` (хост не `api.openai.com`) OpenClaw примусово встановлює це на `false` під час виконання. Порожній/пропущений `baseUrl` зберігає типову поведінку OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: необов'язкова підказка сумісності для текстових кінцевих точок чату, сумісних з OpenAI. Коли `true`, OpenClaw сплющує масиви чистого тексту `messages[].content` у звичайні рядки перед надсиланням запиту.

  </Accordion>
  <Accordion title="Виявлення Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: корінь налаштувань автовиявлення Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов'язковий фільтр ідентифікатора провайдера для цільового виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне контекстне вікно для виявлених моделей.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервна максимальна кількість вихідних токенів для виявлених моделей.

  </Accordion>
</AccordionGroup>

Інтерактивне налаштування користувацького провайдера визначає введення зображень для поширених ідентифікаторів vision-моделей, таких як GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V і GLM-4V, та пропускає додаткове запитання для відомих сімейств лише з текстом. Невідомі ідентифікатори моделей усе ще запитують про підтримку зображень. Неінтерактивне налаштування використовує той самий висновок; передайте `--custom-image-input`, щоб примусово встановити метадані здатності до зображень, або `--custom-text-input`, щоб примусово встановити метадані лише для тексту.

### Приклади провайдерів

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Вбудований Plugin провайдера `cerebras` може налаштувати це через `openclaw onboard --auth-choice cerebras-api-key`. Використовуйте явну конфігурацію провайдера лише під час перевизначення типових значень.

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

    Використовуйте `cerebras/zai-glm-4.7` для Cerebras; `zai/glm-4.7` для прямого Z.AI.

  </Accordion>
  <Accordion title="Кодування Kimi">
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

    Сумісний з Anthropic, вбудований провайдер. Скорочення: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Локальні моделі (LM Studio)">
    Див. [Локальні моделі](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на серйозному обладнанні; залишайте розміщені моделі об'єднаними для резервного варіанта.
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

    Задайте `MINIMAX_API_KEY`. Скорочення: `openclaw onboard --auth-choice minimax-global-api` або `openclaw onboard --auth-choice minimax-cn-api`. Каталог моделей типово містить лише M2.7. На сумісному з Anthropic шляху потокового передавання OpenClaw типово вимикає мислення MiniMax, якщо ви явно не задасте `thinking` самостійно. `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

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

    Для китайського ендпоінта: `baseUrl: "https://api.moonshot.cn/v1"` або `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Нативні ендпоінти Moonshot заявляють сумісність із використанням потокового передавання на спільному транспорті `openai-completions`, а OpenClaw визначає це за можливостями ендпоінта, а не лише за ідентифікатором вбудованого провайдера.

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

    Задайте `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або посилання `opencode-go/...` для каталогу Go. Скорочення: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

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

    Базова URL-адреса має не містити `/v1` (клієнт Anthropic додає її). Скорочення: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Задайте `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` приймаються як псевдоніми. Скорочення: `openclaw onboard --auth-choice zai-api-key`.

    - Загальний ендпоінт: `https://api.z.ai/api/paas/v4`
    - Ендпоінт для кодування (типовий): `https://api.z.ai/api/coding/paas/v4`
    - Для загального ендпоінта визначте власного провайдера з перевизначенням базової URL-адреси.

  </Accordion>
</AccordionGroup>

---

## Пов'язане

- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Конфігурація — канали](/uk/gateway/config-channels)
- [Довідник конфігурації](/uk/gateway/configuration-reference) — інші ключі верхнього рівня
- [Інструменти та plugins](/uk/tools)
