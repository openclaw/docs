---
read_when:
    - Ви хочете налаштувати провайдерів пошуку в пам’яті або моделі embedding
    - Ви хочете налаштувати backend QMD
    - Ви хочете налаштувати hybrid search, MMR або temporal decay
    - Ви хочете увімкнути multimodal indexing пам’яті
sidebarTitle: Memory config
summary: Усі параметри конфігурації для пошуку в пам’яті, провайдерів embedding, QMD, hybrid search і multimodal indexing
title: Довідник із конфігурації пам’яті
x-i18n:
    generated_at: "2026-04-27T14:21:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: f22a728c26a4d7aba155c108b7aad719418fd2dedfa370f339907dc3325e24af
    source_path: reference/memory-config.md
    workflow: 15
---

На цій сторінці перелічено всі параметри конфігурації для пошуку в пам’яті OpenClaw. Для концептуальних оглядів дивіться:

<CardGroup cols={2}>
  <Card title="Огляд пам’яті" href="/uk/concepts/memory">
    Як працює пам’ять.
  </Card>
  <Card title="Вбудований рушій" href="/uk/concepts/memory-builtin">
    Типовий backend SQLite.
  </Card>
  <Card title="Рушій QMD" href="/uk/concepts/memory-qmd">
    Локальний sidecar із пріоритетом локальної роботи.
  </Card>
  <Card title="Пошук у пам’яті" href="/uk/concepts/memory-search">
    Конвеєр пошуку та налаштування.
  </Card>
  <Card title="Active Memory" href="/uk/concepts/active-memory">
    Підлеглий агент пам’яті для інтерактивних сесій.
  </Card>
</CardGroup>

Усі налаштування пошуку в пам’яті знаходяться в `agents.defaults.memorySearch` у `openclaw.json`, якщо не зазначено інше.

<Note>
Якщо ви шукаєте перемикач функції **active memory** і конфігурацію підлеглого агента, вони розміщені в `plugins.entries.active-memory`, а не в `memorySearch`.

Active Memory використовує двоетапну модель:

1. plugin має бути ввімкнений і націлений на поточний ID агента
2. запит має належати до придатної інтерактивної постійної сесії чату

Див. [Active Memory](/uk/concepts/active-memory) для моделі активації, конфігурації, що належить Plugin, збереження транскриптів і безпечного шаблону розгортання.
</Note>

---

## Вибір провайдера

| Key        | Type      | Default          | Description                                                                                                   |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | визначається автоматично | ID адаптера embedding: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | типове значення провайдера | Назва моделі embedding                                                                                          |
| `fallback` | `string`  | `"none"`         | ID fallback-адаптера, якщо основний не спрацьовує                                                                    |
| `enabled`  | `boolean` | `true`           | Увімкнути або вимкнути пошук у пам’яті                                                                               |

### Порядок автовизначення

Коли `provider` не задано, OpenClaw вибирає перший доступний:

<Steps>
  <Step title="local">
    Вибирається, якщо налаштовано `memorySearch.local.modelPath` і файл існує.
  </Step>
  <Step title="github-copilot">
    Вибирається, якщо вдається отримати токен GitHub Copilot (змінна середовища або профіль автентифікації).
  </Step>
  <Step title="openai">
    Вибирається, якщо вдається отримати ключ OpenAI.
  </Step>
  <Step title="gemini">
    Вибирається, якщо вдається отримати ключ Gemini.
  </Step>
  <Step title="voyage">
    Вибирається, якщо вдається отримати ключ Voyage.
  </Step>
  <Step title="mistral">
    Вибирається, якщо вдається отримати ключ Mistral.
  </Step>
  <Step title="bedrock">
    Вибирається, якщо вдається розв’язати ланцюжок облікових даних AWS SDK (роль інстансу, ключі доступу, профіль, SSO, web identity або shared config).
  </Step>
</Steps>

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Розв’язання API key

Для віддалених embedding потрібен API key. Bedrock натомість використовує типовий ланцюжок облікових даних AWS SDK (ролі інстансу, SSO, ключі доступу).

| Provider       | Env var                                            | Config key                        |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | ланцюжок облікових даних AWS                               | API key не потрібен                 |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профіль автентифікації через вхід із пристрою     |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                     | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

<Note>
Codex OAuth охоплює лише chat/completions і не підходить для запитів embedding.
</Note>

---

## Конфігурація віддаленого endpoint

Для власних OpenAI-сумісних endpoint або перевизначення типових значень провайдера:

<ParamField path="remote.baseUrl" type="string">
  Власна базова URL-адреса API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Перевизначити API key.
</ParamField>
<ParamField path="remote.headers" type="object">
  Додаткові HTTP-заголовки (об’єднуються з типовими значеннями провайдера).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Конфігурація для конкретних провайдерів

<AccordionGroup>
  <Accordion title="Gemini">
    | Key                    | Type     | Default                | Description                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Для Embedding 2: 768, 1536 або 3072        |

    <Warning>
    Зміна моделі або `outputDimensionality` запускає автоматичне повне переіндексування.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    OpenAI-сумісні embedding-endpoint можуть опційно використовувати специфічні для провайдера поля запиту `input_type`. Це корисно для асиметричних embedding-моделей, які потребують різних міток для embedding запиту та embedding документа.

    | Key                 | Type     | Default | Description                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | не задано   | Спільний `input_type` для embedding запиту й документа   |
    | `queryInputType`    | `string` | не задано   | `input_type` під час запиту; перевизначає `inputType`          |
    | `documentInputType` | `string` | не задано   | `input_type` для індексу/документа; перевизначає `inputType`      |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Зміна цих значень впливає на ідентичність кешу embedding для пакетного індексування провайдера, і після цього слід виконати переіндексування пам’яті, якщо вихідна модель по-різному трактує ці мітки.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock використовує типовий ланцюжок облікових даних AWS SDK — API key не потрібні. Якщо OpenClaw працює на EC2 з роллю інстансу, у якій увімкнено Bedrock, просто задайте провайдера й модель:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | Key                    | Type     | Default                        | Description                     |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ID embedding-моделі Bedrock  |
    | `outputDimensionality` | `number` | типове значення моделі                  | Для Titan V2: 256, 512 або 1024 |

    **Підтримувані моделі** (із визначенням сімейства та типовими розмірностями):

    | Model ID                                   | Provider   | Default Dims | Configurable Dims    |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    Варіанти із суфіксом пропускної здатності (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують конфігурацію базової моделі.

    **Автентифікація:** автентифікація Bedrock використовує стандартний порядок розв’язання облікових даних AWS SDK:

    1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Кеш токенів SSO
    3. Облікові дані токена web identity
    4. Спільні файли облікових даних і конфігурації
    5. Облікові дані метаданих ECS або EC2

    Регіон визначається з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` провайдера `amazon-bedrock` або типово дорівнює `us-east-1`.

    **Дозволи IAM:** роль IAM або користувач повинні мати:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Для принципу найменших привілеїв обмежте `InvokeModel` конкретною моделлю:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Key                   | Type               | Default                | Description                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | завантажується автоматично        | Шлях до файлу моделі GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | типове значення node-llama-cpp | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Розмір контекстного вікна для embedding-контексту. 4096 покриває типові фрагменти (128–512 токенів), водночас обмежуючи VRAM, що не належить вагам моделі. Зменшуйте до 1024–2048 на хостах з обмеженими ресурсами. `"auto"` використовує натренований максимум моделі — не рекомендовано для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 ГБ VRAM проти ~8.8 ГБ при 4096). |

    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 ГБ, завантажується автоматично). Потребує нативного збирання: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використовуйте окремий CLI, щоб перевірити той самий шлях провайдера, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Якщо `provider` має значення `auto`, `local` вибирається лише тоді, коли `local.modelPath` вказує на наявний локальний файл. Посилання на моделі `hf:` і HTTP(S) усе ще можна явно використовувати з `provider: "local"`, але вони не змусять `auto` вибрати local, доки модель не стане доступною на диску.

  </Accordion>
</AccordionGroup>

### Тайм-аут вбудованого embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначити тайм-аут для вбудованих пакетів embedding під час індексування пам’яті.

Якщо не задано, використовується типове значення провайдера: 600 секунд для локальних/self-hosted провайдерів, таких як `local`, `ollama` і `lmstudio`, та 120 секунд для хостованих провайдерів. Збільшуйте це значення, коли локальні CPU-bound пакети embedding працюють справно, але повільно.
</ParamField>

---

## Конфігурація hybrid search

Усе міститься в `memorySearch.query.hybrid`:

| Key                   | Type      | Default | Description                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Увімкнути hybrid BM25 + vector search |
| `vectorWeight`        | `number`  | `0.7`   | Вага для оцінок vector (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Вага для оцінок BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Множник розміру пулу кандидатів     |

<Tabs>
  <Tab title="MMR (різноманітність)">
    | Key           | Type      | Default | Description                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Увімкнути MMR re-ranking                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = максимальна різноманітність, 1 = максимальна релевантність |
  </Tab>
  <Tab title="Temporal decay (давність)">
    | Key                          | Type      | Default | Description               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Увімкнути підсилення за давністю      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Оцінка зменшується вдвічі кожні N днів |

    Evergreen-файли (`MEMORY.md`, файли без дати в `memory/`) ніколи не піддаються згасанню.

  </Tab>
</Tabs>

### Повний приклад

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Додаткові шляхи пам’яті

| Key          | Type       | Description                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | Додаткові каталоги або файли для індексування |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Шляхи можуть бути абсолютними або відносними до робочого простору. Каталоги скануються рекурсивно на наявність файлів `.md`. Обробка symlink залежить від активного backend: вбудований рушій ігнорує symlink, тоді як QMD дотримується поведінки базового сканера QMD.

Для пошуку транскриптів між агентами в межах конкретного агента використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові колекції мають ту саму форму `{ path, name, pattern? }`, але об’єднуються для кожного агента окремо й можуть зберігати явні спільні назви, коли шлях указує за межі поточного робочого простору. Якщо той самий розв’язаний шлях з’являється і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає дублікат.

---

## Multimodal memory (Gemini)

Індексуйте зображення та аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Key                       | Type       | Default    | Description                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Увімкнути multimodal indexing             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Максимальний розмір файлу для індексування             |

<Note>
Застосовується лише до файлів у `extraPaths`. Типові корені пам’яті залишаються лише для Markdown. Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш embedding

| Key                | Type      | Default | Description                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Кешувати embedding фрагментів у SQLite |
| `cache.maxEntries` | `number`  | `50000` | Максимальна кількість кешованих embedding            |

Запобігає повторному створенню embedding для незміненого тексту під час переіндексації або оновлення транскриптів.

---

## Пакетне індексування

| Key                           | Type      | Default | Description                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Увімкнути пакетний embedding API |
| `remote.batch.concurrency`    | `number`  | `2`     | Паралельні пакетні завдання        |
| `remote.batch.wait`           | `boolean` | `true`  | Очікувати завершення пакета  |
| `remote.batch.pollIntervalMs` | `number`  | --      | Інтервал опитування              |
| `remote.batch.timeoutMinutes` | `number`  | --      | Тайм-аут пакета              |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай найшвидший і найдешевший для великих зворотних заповнень.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує вбудованими викликами embedding, що використовуються локальними/self-hosted провайдерами та хостованими провайдерами, коли пакетні API провайдера не активні.

---

## Пошук у пам’яті сесій (експериментально)

Індексуйте транскрипти сесій і показуйте їх через `memory_search`:

| Key                           | Type       | Default      | Description                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Увімкнути індексування сесій                 |
| `sources`                     | `string[]` | `["memory"]` | Додайте `"sessions"`, щоб включити транскрипти |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Поріг байтів для переіндексації              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Поріг повідомлень для переіндексації           |

<Warning>
Індексація сесій є опційною і виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сесій зберігаються на диску, тому вважайте доступ до файлової системи межею довіри.
</Warning>

---

## Прискорення векторів SQLite (sqlite-vec)

| Key                          | Type      | Default | Description                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Використовувати sqlite-vec для векторних запитів |
| `store.vector.extensionPath` | `string`  | bundled | Перевизначити шлях до sqlite-vec          |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до in-process cosine similarity.

---

## Зберігання індексу

| Key                   | Type     | Default                               | Description                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Токенізатор FTS5 (`unicode61` або `trigram`)   |

---

## Конфігурація backend QMD

Щоб увімкнути, задайте `memory.backend = "qmd"`. Усі налаштування QMD знаходяться в `memory.qmd`:

| Key                      | Type      | Default  | Description                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Шлях до виконуваного файлу QMD; задайте абсолютний шлях, якщо `PATH` служби відрізняється від вашої оболонки |
| `searchMode`             | `string`  | `search` | Команда пошуку: `search`, `vsearch`, `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | Автоматично індексувати `MEMORY.md` + `memory/**/*.md`                                             |
| `paths[]`                | `array`   | --       | Додаткові шляхи: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | Індексувати транскрипти сесій                                                             |
| `sessions.retentionDays` | `number`  | --       | Зберігання транскриптів                                                                  |
| `sessions.exportDir`     | `string`  | --       | Каталог експорту                                                                      |

`searchMode: "search"` — це лише лексичний/BM25-режим. OpenClaw не запускає перевірки готовності семантичного вектора або обслуговування embedding QMD для цього режиму, зокрема під час `memory status --deep`; `vsearch` і `query` як і раніше потребують готовності векторів QMD та embedding.

OpenClaw віддає перевагу поточним формам колекцій QMD і запитів MCP, але зберігає працездатність старіших випусків QMD, за потреби пробуючи сумісні прапорці шаблонів колекцій і старіші назви інструментів MCP. Коли QMD повідомляє про підтримку кількох фільтрів колекцій, колекції з однаковим джерелом шукаються одним процесом QMD; старіші збірки QMD зберігають сумісний шлях із пошуком по одній колекції. Однакове джерело означає, що колекції довготривалої пам’яті групуються разом, а колекції транскриптів сесій залишаються окремою групою, щоб диверсифікація джерел усе ще мала обидва входи.

<Note>
Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо вам потрібно глобально перевизначити моделі QMD, задайте змінні середовища, як-от `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі runtime gateway.
</Note>

<AccordionGroup>
  <Accordion title="Розклад оновлення">
    | Key                       | Type      | Default | Description                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Інтервал оновлення                      |
    | `update.debounceMs`       | `number`  | `15000` | Debounce змін файлів                 |
    | `update.onBoot`           | `boolean` | `true`  | Оновлювати під час запуску                    |
    | `update.waitForBootSync`  | `boolean` | `false` | Блокувати запуск до завершення оновлення |
    | `update.embedInterval`    | `string`  | --      | Окрема частота embedding                |
    | `update.commandTimeoutMs` | `number`  | --      | Тайм-аут для команд QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | Тайм-аут для операцій оновлення QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | Тайм-аут для операцій embedding QMD      |
  </Accordion>
  <Accordion title="Обмеження">
    | Key                       | Type     | Default | Description                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Максимальна кількість результатів пошуку         |
    | `limits.maxSnippetChars`  | `number` | --      | Обмежити довжину фрагмента       |
    | `limits.maxInjectedChars` | `number` | --      | Обмежити загальну кількість вставлених символів |
    | `limits.timeoutMs`        | `number` | `4000`  | Тайм-аут пошуку             |
  </Accordion>
  <Accordion title="Область дії">
    Керує тим, які сесії можуть отримувати результати пошуку QMD. Та сама схема, що й у [`session.sendPolicy`](/uk/gateway/config-agents#session):

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    Типове значення в постачанні дозволяє direct і channel-сесії, водночас усе ще забороняючи групи.

    Типове значення — лише DM. `match.keyPrefix` відповідає нормалізованому ключу сесії; `match.rawKeyPrefix` відповідає сирому ключу, включно з `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитати">
    `memory.citations` застосовується до всіх backend:

    | Value            | Behavior                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (типово) | Додавати нижній колонтитул `Source: <path#line>` до фрагментів    |
    | `on`             | Завжди додавати нижній колонтитул                               |
    | `off`            | Пропускати нижній колонтитул (шлях усе одно внутрішньо передається агенту) |

  </Accordion>
</AccordionGroup>

### Повний приклад QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming налаштовується в `plugins.entries.memory-core.config.dreaming`, а не в `agents.defaults.memorySearch`.

Dreaming запускається як один запланований прохід і використовує внутрішні фази light/deep/REM як деталь реалізації.

Для концептуальної поведінки та slash-команд див. [Dreaming](/uk/concepts/dreaming).

### Налаштування користувача

| Key         | Type      | Default       | Description                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Повністю увімкнути або вимкнути Dreaming               |
| `frequency` | `string`  | `0 3 * * *`   | Необов’язкова частота Cron для повного проходу Dreaming |
| `model`     | `string`  | типова модель | Необов’язкове перевизначення моделі підлеглого агента Dream Diary      |

### Приклад

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming записує машинний стан у `memory/.dreams/`.
- Dreaming записує зрозумілий людині наративний вивід у `DREAMS.md` (або наявний `dreams.md`).
- `dreaming.model` використовує наявний trust gate підлеглого агента Plugin; перед увімкненням задайте `plugins.entries.memory-core.subagent.allowModelOverride: true`.
- Політика та пороги фаз light/deep/REM є внутрішньою поведінкою, а не користувацькою конфігурацією.
</Note>

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Огляд пам’яті](/uk/concepts/memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
