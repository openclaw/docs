---
read_when:
    - Налаштування політики `tools.*`, списків дозволених елементів або експериментальних функцій
    - Реєстрація користувацьких постачальників або перевизначення базових URL-адрес
    - Налаштування самостійно розгорнутих кінцевих точок, сумісних з OpenAI
sidebarTitle: Tools and custom providers
summary: Налаштування інструментів (політика, експериментальні перемикачі, інструменти на базі провайдера) і налаштування власного провайдера/base-URL
title: Конфігурація — інструменти та користувацькі провайдери
x-i18n:
    generated_at: "2026-06-27T17:31:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

Ключі конфігурації `tools.*` і налаштування користувацького провайдера / базової URL-адреси. Для агентів, каналів та інших ключів конфігурації верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Інструменти

### Профілі інструментів

`tools.profile` задає базовий список дозволених інструментів перед `tools.allow`/`tools.deny`:

<Note>
Локальне початкове налаштування за замовчуванням встановлює для нових локальних конфігурацій `tools.profile: "coding"`, якщо значення не задано (наявні явно задані профілі зберігаються).
</Note>

| Профіль     | Включає                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | лише `session_status`                                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | Без обмежень (те саме, що й незадане значення)                                                                                                    |

### Групи інструментів

| Група              | Інструменти                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як псевдонім для `exec`)                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Усі вбудовані інструменти (без провайдерських plugins)                                                                  |
| `group:plugins`    | Інструменти, якими володіють завантажені plugins, зокрема налаштовані MCP-сервери, відкриті через `bundle-mcp`          |

### MCP та інструменти plugin у політиці інструментів пісочниці

Налаштовані MCP-сервери доступні як інструменти, що належать plugin, під ідентифікатором plugin `bundle-mcp`. Звичайні профілі інструментів можуть їх дозволяти, але `tools.sandbox.tools` є додатковим бар’єром для сеансів у пісочниці. Якщо режим пісочниці має значення `"all"` або `"non-main"`, додайте один із цих записів до списку дозволених інструментів пісочниці, коли інструменти MCP/plugin мають бути видимими:

- `bundle-mcp` для MCP-серверів, керованих OpenClaw, з `mcp.servers`
- ідентифікатор plugin для конкретного нативного plugin
- `group:plugins` для всіх завантажених інструментів, що належать plugin
- точні назви інструментів MCP-сервера або серверні glob-шаблони, як-от `outlook__send_mail` чи `outlook__*`, коли потрібен лише один сервер

Серверні glob-шаблони використовують безпечний для провайдера префікс MCP-сервера, а не обов’язково сирий ключ `mcp.servers`. Символи, відмінні від `[A-Za-z0-9_-]`, стають `-`, назви, що не починаються з літери, отримують префікс `mcp-`, а довгі або дубліковані префікси можуть бути скорочені або отримати суфікс; наприклад, `mcp.servers["Outlook Graph"]` використовує glob-шаблон на кшталт `outlook-graph__*`.

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

Без цього запису на рівні пісочниці MCP-сервер усе ще може успішно завантажитися, але його інструменти буде відфільтровано перед запитом до провайдера. Використовуйте `openclaw doctor`, щоб виявляти таку форму для MCP-серверів, керованих OpenClaw, у `mcp.servers`. MCP-сервери, завантажені з маніфестів bundled plugin або Claude `.mcp.json`, використовують той самий бар’єр пісочниці, але ця діагностика поки що не перелічує ці джерела; використовуйте ті самі записи списку дозволених, якщо їхні інструменти зникають у ходах у пісочниці.

### `tools.codeMode`

`tools.codeMode` вмикає загальну поверхню режиму коду OpenClaw. Коли його ввімкнено
для запуску з інструментами, модель бачить лише `exec` і `wait`; звичайні інструменти OpenClaw
переміщуються за міст каталогу `tools.*` усередині пісочниці, а інструменти MCP
доступні через згенерований простір назв `MCP`.

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

Оголошення MCP відкриваються через поверхню віртуального API-файлу лише для читання в
режимі коду. Гостьовий код може викликати `API.list("mcp")` і
`API.read("mcp/<server>.d.ts")`, щоб переглянути сигнатури у стилі TypeScript перед
викликом `MCP.<server>.<tool>()`. Див. [Режим коду](/uk/reference/code-mode), щоб отримати
контракт виконання, обмеження та кроки налагодження.

### `tools.allow` / `tools.deny`

Глобальна політика дозволу/заборони інструментів (заборона має пріоритет). Не чутлива до регістру, підтримує wildcard `*`. Застосовується навіть тоді, коли пісочницю Docker вимкнено.

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

Додатково обмежує інструменти для конкретних провайдерів або моделей. Порядок: базовий профіль → профіль провайдера → дозволи/заборони.

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

Обмежує інструменти для конкретної ідентичності запитувача. Це поглиблений захист поверх контролю доступу каналу; значення відправника мають надходити з адаптера каналу, а не з тексту повідомлення.

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

Ключі використовують явні префікси: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` або `"*"`. Ідентифікатори каналів є канонічними ідентифікаторами OpenClaw; псевдоніми, як-от `teams`, нормалізуються до `msteams`. Застарілі ключі без префікса приймаються лише як `id:`. Порядок зіставлення: channel+id, id, e164, username, name, потім wildcard.

`agents.list[].tools.toolsBySender` для окремого агента перевизначає глобальне зіставлення відправника, коли воно збігається, навіть із порожньою політикою `{}`.

### `tools.elevated`

Керує підвищеним доступом exec поза пісочницею:

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
- `/elevated on|off|ask|full` зберігає стан для кожного сеансу; inline-директиви застосовуються до одного повідомлення.
- Підвищений `exec` обходить пісочницю та використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціль exec — `node`).

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
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Перевірки безпеки циклів інструментів **вимкнені за замовчуванням**. Установіть `enabled: true`, щоб активувати виявлення. Налаштування можна визначити глобально в `tools.loopDetection` і перевизначити для окремого агента в `agents.list[].tools.loopDetection`.

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
  Поріг жорсткої зупинки для будь-якого запуску без прогресу.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Попереджати про повторні виклики того самого інструмента з тими самими аргументами.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Попереджати/блокувати відомі інструменти опитування (`process.poll`, `command_status` тощо).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Попереджати/блокувати змінні парні шаблони без прогресу.
</ParamField>

<Warning>
Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, валідація завершується помилкою.
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
    **Запис постачальника** (`type: "provider"` або пропущено):

    - `provider`: ідентифікатор постачальника API (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
    - `model`: перевизначення ідентифікатора моделі
    - `profile` / `preferredProfile`: вибір профілю `auth-profiles.json`

    **Запис CLI** (`type: "cli"`):

    - `command`: виконуваний файл для запуску
    - `args`: шаблонізовані аргументи (підтримує `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо; `openclaw doctor --fix` мігрує застарілі заповнювачі `{input}` до `{{MediaPath}}`)

    **Спільні поля:**

    - `capabilities`: необов’язковий список (`image`, `audio`, `video`). Стандартні значення: `openai`/`anthropic`/`minimax` → зображення, `google` → зображення+аудіо+відео, `groq` → аудіо.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
    - `tools.media.image.timeoutSeconds` і відповідні записи `timeoutSeconds` моделі зображень також застосовуються, коли агент викликає явний інструмент `image`. Для розуміння зображень цей тайм-аут застосовується до самого запиту й не зменшується через попередню підготовчу роботу.
    - У разі помилки виконується перехід до наступного запису.

    Автентифікація постачальника відбувається у стандартному порядку: `auth-profiles.json` → змінні середовища → `models.providers.*.apiKey`.

    **Поля асинхронного завершення:**

    - `asyncCompletion.directSend`: застарілий прапорець сумісності. Завершені асинхронні медіазавдання залишаються опосередкованими сеансом запитувача, щоб агент отримав результат, вирішив, як повідомити користувача, і використав інструмент повідомлень, коли цього вимагає доставка з джерела.

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

Керує тим, на які сеанси можуть націлюватися інструменти сеансів (`sessions_list`, `sessions_history`, `sessions_send`).

Стандартне значення: `tree` (поточний сеанс + сеанси, породжені ним, наприклад субагенти).

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
    - `tree`: поточний сеанс + сеанси, породжені поточним сеансом (субагенти).
    - `agent`: будь-який сеанс, що належить поточному ідентифікатору агента (може включати інших користувачів, якщо ви запускаєте сеанси для кожного відправника під тим самим ідентифікатором агента).
    - `all`: будь-який сеанс. Націлювання між агентами все одно потребує `tools.agentToAgent`.
    - Обмеження sandbox: коли поточний сеанс працює в sandbox і `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, видимість примусово встановлюється на `tree`, навіть якщо `tools.sessions.visibility="all"`.
    - Коли значення не `all`, `sessions_list` містить компактне поле `visibility`,
      яке описує ефективний режим, і попередження, що деякі сеанси можуть бути
      пропущені поза поточною областю видимості.

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
  <Accordion title="Attachment notes">
    - Вкладення потребують `enabled: true`.
    - Вкладення субагентів матеріалізуються в дочірньому робочому просторі за шляхом `.openclaw/attachments/<uuid>/` з `.manifest.json`.
    - Вкладення ACP підтримують лише зображення й передаються вбудовано до середовища виконання ACP після проходження тих самих лімітів кількості файлів, байтів на файл і загальної кількості байтів.
    - Вміст вкладень автоматично редагується перед збереженням транскриптів.
    - Вхідні дані Base64 перевіряються строгими перевірками алфавіту/заповнення та запобіжником розміру перед декодуванням.
    - Права доступу до файлів вкладень субагентів: `0700` для директорій і `0600` для файлів.
    - Очищення субагентів дотримується політики `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише коли `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Експериментальні прапорці вбудованих інструментів. Типово вимкнено, якщо не застосовується правило автоматичного ввімкнення strict-agentic GPT-5.

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
- Типово: `false`, якщо `agents.defaults.embeddedAgent.executionContract` (або перевизначення для окремого агента) не встановлено в `"strict-agentic"` для запуску сімейства GPT-5 через OpenAI або OpenAI Codex. Установіть `true`, щоб примусово ввімкнути інструмент поза цією областю, або `false`, щоб тримати його вимкненим навіть для strict-agentic запусків GPT-5.
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
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: типова модель для породжених субагентів. Якщо пропущено, субагенти успадковують модель викликача.
- `allowAgents`: типовий список дозволених налаштованих ідентифікаторів цільових агентів для `sessions_spawn`, коли агент-запитувач не задає власний `subagents.allowAgents` (`["*"]` = будь-яка налаштована ціль; типово: лише той самий агент). Застарілі записи, конфігурацію агента яких було видалено, відхиляються `sessions_spawn` і пропускаються в `agents_list`; виконайте `openclaw doctor --fix`, щоб їх очистити.
- `runTimeoutSeconds`: типовий таймаут (у секундах) для `sessions_spawn`. `0` означає без таймауту.
- `announceTimeoutMs`: таймаут на виклик (у мілісекундах) для спроб доставки оголошення `agent` через gateway. Типово: `120000`. Тимчасові повторні спроби можуть зробити загальне очікування оголошення довшим за один налаштований таймаут.
- Політика інструментів для окремого субагента: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Користувацькі провайдери й базові URL-адреси

Plugin провайдерів публікують власні рядки каталогу моделей. Додавайте користувацьких провайдерів через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

Налаштування `baseUrl` для користувацького/локального провайдера також є вузьким рішенням про мережеву довіру для HTTP-запитів моделі: OpenClaw дозволяє саме це джерело `scheme://host:port` через захищений шлях fetch, без додавання окремого параметра конфігурації або довіри до інших приватних джерел.

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
  <Accordion title="Auth and merge precedence">
    - Використовуйте `authHeader: true` + `headers` для користувацьких потреб автентифікації.
    - Перевизначте корінь конфігурації агента за допомогою `OPENCLAW_AGENT_DIR`.
    - Пріоритет злиття для відповідних ідентифікаторів провайдерів:
      - Непорожні значення `baseUrl` з агентського `models.json` мають перевагу.
      - Непорожні значення `apiKey` агента мають перевагу лише коли цей провайдер не керується SecretRef у поточному контексті конфігурації/профілю автентифікації.
      - Значення `apiKey` провайдера, керованого SecretRef, оновлюються з вихідних маркерів (`ENV_VAR_NAME` для посилань env, `secretref-managed` для посилань file/exec) замість збереження розв’язаних секретів.
      - Значення заголовків провайдера, керованого SecretRef, оновлюються з вихідних маркерів (`secretref-env:ENV_VAR_NAME` для посилань env, `secretref-managed` для посилань file/exec).
      - Порожні або відсутні агентські `apiKey`/`baseUrl` повертаються до `models.providers` у конфігурації.
      - Відповідні `contextWindow`/`maxTokens` моделі використовують більше значення між явною конфігурацією та неявними значеннями каталогу.
      - Відповідний `contextTokens` моделі зберігає явне обмеження середовища виконання, коли воно наявне; використовуйте його, щоб обмежити ефективний контекст без зміни нативних метаданих моделі.
      - Каталоги Plugin провайдерів зберігаються як згенеровані шардовані каталоги, що належать Plugin, у стані Plugin агента.
      - Використовуйте `models.mode: "replace"`, коли хочете, щоб конфігурація повністю переписала `models.json` і активні шардовані каталоги Plugin.
      - Збереження маркерів є авторитетним щодо джерела: маркери записуються з активного знімка вихідної конфігурації (до розв’язання), а не з розв’язаних значень секретів середовища виконання.

  </Accordion>
</AccordionGroup>

### Подробиці полів провайдера

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: поведінка каталогу провайдерів (`merge` або `replace`).
    - `models.providers`: мапа користувацьких провайдерів, ключована ідентифікатором провайдера.
      - Безпечні редагування: використовуйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` або `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` для адитивних оновлень. `config set` відхиляє руйнівні заміни, якщо не передати `--replace`.

  </Accordion>
  <Accordion title="Підключення постачальника та автентифікація">
    - `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо). Для самостійно розміщених бекендів `/v1/chat/completions`, таких як MLX, vLLM, SGLang і більшість локальних серверів, сумісних з OpenAI, використовуйте `openai-completions`. Користувацький постачальник із `baseUrl`, але без `api`, типово використовує `openai-completions`; задавайте `openai-responses` лише тоді, коли бекенд підтримує `/v1/responses`.
    - `models.providers.*.apiKey`: облікові дані постачальника (бажано SecretRef/підстановка env).
    - `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: типове нативне контекстне вікно для моделей цього постачальника, коли запис моделі не задає `contextWindow`.
    - `models.providers.*.contextTokens`: типове ефективне обмеження контексту під час виконання для моделей цього постачальника, коли запис моделі не задає `contextTokens`.
    - `models.providers.*.maxTokens`: типове обмеження вихідних токенів для моделей цього постачальника, коли запис моделі не задає `maxTokens`.
    - `models.providers.*.timeoutSeconds`: необов’язковий тайм-аут HTTP-запиту моделі для кожного постачальника в секундах, включно з підключенням, заголовками, тілом і загальною обробкою переривання запиту.
    - `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` додавати `options.num_ctx` у запити (типово: `true`).
    - `models.providers.*.authHeader`: примусово передавати облікові дані в заголовку `Authorization`, коли це потрібно.
    - `models.providers.*.baseUrl`: базова URL-адреса upstream API.
    - `models.providers.*.headers`: додаткові статичні заголовки для маршрутизації проксі/тенанта.

  </Accordion>
  <Accordion title="Перевизначення транспорту запитів">
    `models.providers.*.request`: перевизначення транспорту для HTTP-запитів до постачальника моделей.

    - `request.headers`: додаткові заголовки (об’єднуються з типовими заголовками постачальника). Значення приймають SecretRef.
    - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію постачальника), `"authorization-bearer"` (з `token`), `"header"` (з `headerName`, `value`, необов’язковим `prefix`).
    - `request.proxy`: перевизначення HTTP-проксі. Режими: `"env-proxy"` (використовувати змінні середовища `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (з `url`). Обидва режими приймають необов’язковий підоб’єкт `tls`.
    - `request.tls`: перевизначення TLS для прямих підключень. Поля: `ca`, `cert`, `key`, `passphrase` (усі приймають SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: коли `true`, дозволяє HTTP-запити до постачальника моделей у приватні, CGNAT або подібні діапазони через HTTP-захист fetch постачальника. Базові URL-адреси користувацьких/локальних постачальників уже довіряють точно налаштованому origin, крім metadata/link-local origin, які залишаються заблокованими без явного ввімкнення. Установіть це в `false`, щоб відмовитися від довіри до точного origin. WebSocket використовує той самий `request` для заголовків/TLS, але не цей fetch SSRF gate. Типово `false`.

  </Accordion>
  <Accordion title="Записи каталогу моделей">
    - `models.providers.*.models`: явні записи каталогу моделей постачальника.
    - `models.providers.*.models.*.input`: модальності введення моделі. Використовуйте `["text"]` для моделей лише з текстом і `["text", "image"]` для нативних моделей із зображеннями/vision. Вкладення зображень додаються до ходів агента лише тоді, коли вибрана модель позначена як здатна працювати із зображеннями.
    - `models.providers.*.models.*.contextWindow`: метадані нативного контекстного вікна моделі. Це перевизначає `contextWindow` рівня постачальника для цієї моделі.
    - `models.providers.*.models.*.contextTokens`: необов’язкове обмеження контексту під час виконання. Це перевизначає `contextTokens` рівня постачальника; використовуйте його, коли потрібен менший ефективний бюджет контексту, ніж нативне `contextWindow` моделі; `openclaw models list` показує обидва значення, коли вони відрізняються.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` із непорожнім ненативним `baseUrl` (хост не `api.openai.com`) OpenClaw примусово встановлює це в `false` під час виконання. Порожній/пропущений `baseUrl` зберігає типову поведінку OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: необов’язкова підказка сумісності для сумісних з OpenAI chat-ендпоінтів лише з рядковим вмістом. Коли `true`, OpenClaw сплющує масиви чистого тексту `messages[].content` у звичайні рядки перед надсиланням запиту.
    - `models.providers.*.models.*.compat.strictMessageKeys`: необов’язкова підказка сумісності для строгих сумісних з OpenAI chat-ендпоінтів. Коли `true`, OpenClaw обрізає вихідні об’єкти повідомлень Chat Completions до `role` і `content` перед надсиланням запиту.
    - `models.providers.*.models.*.compat.thinkingFormat`: необов’язкова підказка формату thinking payload. Використовуйте `"together"` для Together-стилю `reasoning.enabled`, `"qwen"` для верхньорівневого `enable_thinking` або `"qwen-chat-template"` для `chat_template_kwargs.enable_thinking` на серверах сімейства Qwen, сумісних з OpenAI, які підтримують request-level chat-template kwargs, наприклад vLLM. Налаштовані моделі vLLM Qwen надають бінарні варіанти `/think` (`off`, `on`) для цих форматів.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: необов’язкова підказка сумісності для бекендів Chat Completions у стилі DeepSeek, які вимагають зберігати `reasoning_content` у попередніх повідомленнях асистента під час повторного відтворення. Коли `true`, OpenClaw зберігає це поле у вихідних повідомленнях асистента. Використовуйте це під час підключення користувацького сумісного з DeepSeek проксі, який відхиляє запити після видаленого reasoning. Типово `false`.

  </Accordion>
  <Accordion title="Виявлення Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: корінь налаштувань автоматичного виявлення Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр provider-id для цільового виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне контекстне вікно для виявлених моделей.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервна максимальна кількість вихідних токенів для виявлених моделей.

  </Accordion>
</AccordionGroup>

Інтерактивне підключення користувацького постачальника виводить підтримку введення зображень для поширених ID vision-моделей, таких як GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V і GLM-4V, та пропускає додаткове запитання для відомих сімейств лише з текстом. Невідомі ID моделей усе ще запитують про підтримку зображень. Неінтерактивне підключення використовує той самий висновок; передайте `--custom-image-input`, щоб примусово задати метадані здатності працювати із зображеннями, або `--custom-text-input`, щоб примусово задати метадані лише з текстом.

### Приклади постачальників

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Офіційний зовнішній Plugin постачальника `cerebras` може налаштувати це через `openclaw onboard --auth-choice cerebras-api-key`. Використовуйте явну конфігурацію постачальника лише під час перевизначення типових значень.

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

    Сумісний з Anthropic, вбудований постачальник. Скорочення: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Локальні моделі (LM Studio)">
    Див. [Локальні моделі](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на серйозному обладнанні; залишайте розміщені моделі об’єднаними для резервного варіанту.
  </Accordion>
  <Accordion title="MiniMax M3 (напряму)">
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

    Установіть `MINIMAX_API_KEY`. Скорочення: `openclaw onboard --auth-choice minimax-global-api` або `openclaw onboard --auth-choice minimax-cn-api`. Каталог моделей типово використовує M3 і також містить варіанти M2.7. На сумісному з Anthropic streaming-шляху OpenClaw типово вимикає MiniMax M2.x thinking, якщо ви явно не задасте `thinking` самостійно; MiniMax-M3 (і M3.x) типово залишається на omitted/adaptive thinking-шляху постачальника. `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

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

    Нативні ендпоінти Moonshot оголошують сумісність streaming usage на спільному транспорті `openai-completions`, а OpenClaw визначає це за можливостями ендпоінта, а не лише за вбудованим ID постачальника.

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

    Установіть `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте refs `opencode/...` для каталогу Zen або refs `opencode-go/...` для каталогу Go. Скорочення: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

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

    Базовий URL має не містити `/v1` (клієнт Anthropic додає його). Скорочення: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Установіть `ZAI_API_KEY`. Посилання на моделі використовують канонічний ідентифікатор провайдера `zai/*`. Скорочення: `openclaw onboard --auth-choice zai-api-key`.

    - Загальна кінцева точка: `https://api.z.ai/api/paas/v4`
    - Кінцева точка для кодування (типово): `https://api.z.ai/api/coding/paas/v4`
    - Для загальної кінцевої точки визначте власного провайдера з перевизначенням базового URL.

  </Accordion>
</AccordionGroup>

---

## Пов’язане

- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Конфігурація — канали](/uk/gateway/config-channels)
- [Довідник конфігурації](/uk/gateway/configuration-reference) — інші ключі верхнього рівня
- [Інструменти та plugins](/uk/tools)
