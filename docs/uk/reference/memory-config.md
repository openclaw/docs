---
read_when:
    - Ви хочете налаштувати провайдерів memory search або embedding-моделі.
    - Ви хочете налаштувати QMD backend.
    - Ви хочете налаштувати hybrid search, MMR або temporal decay.
    - Ви хочете ввімкнути multimodal indexing пам’яті.
sidebarTitle: Memory config
summary: Усі параметри config для memory search, embedding providers, QMD, hybrid search і multimodal indexing
title: довідник з config пам’яті
x-i18n:
    generated_at: "2026-04-27T11:04:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14d879353014792d7a18e26b838519be8c52b2755e7a10f5f8e5ddf5b1ac09cc
    source_path: reference/memory-config.md
    workflow: 15
---

На цій сторінці перелічено всі параметри config для memory search в OpenClaw. Концептуальні огляди див. тут:

<CardGroup cols={2}>
  <Card title="Огляд пам’яті" href="/uk/concepts/memory">
    Як працює пам’ять.
  </Card>
  <Card title="Вбудований рушій" href="/uk/concepts/memory-builtin">
    Типовий backend SQLite.
  </Card>
  <Card title="Рушій QMD" href="/uk/concepts/memory-qmd">
    Локальний sidecar у стилі local-first.
  </Card>
  <Card title="Пошук у пам’яті" href="/uk/concepts/memory-search">
    Конвеєр пошуку та налаштування.
  </Card>
  <Card title="Active Memory" href="/uk/concepts/active-memory">
    Субагент пам’яті для інтерактивних сесій.
  </Card>
</CardGroup>

Усі налаштування memory search живуть у `agents.defaults.memorySearch` у `openclaw.json`, якщо не зазначено інше.

<Note>
Якщо ви шукаєте перемикач функції **Active Memory** і config субагента, він знаходиться в `plugins.entries.active-memory`, а не в `memorySearch`.

Active Memory використовує модель із двома шлюзами:

1. Plugin має бути ввімкнений і націлений на поточний id агента
2. запит має належати до придатної інтерактивної постійної сесії чату

Див. [Active Memory](/uk/concepts/active-memory), щоб дізнатися про модель активації, config на боці Plugin, збереження transcript і безпечний шаблон поступового впровадження.
</Note>

---

## Вибір провайдера

| Ключ      | Тип       | Типове значення | Опис                                                                                                           |
| --------- | --------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | auto-detected   | ID embedding adapter: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | типове значення провайдера | Назва embedding-моделі                                                                               |
| `fallback` | `string`  | `"none"`        | ID fallback adapter, якщо основний завершується помилкою                                                      |
| `enabled`  | `boolean` | `true`          | Увімкнути або вимкнути memory search                                                                          |

### Порядок автовиявлення

Коли `provider` не задано, OpenClaw вибирає перший доступний:

<Steps>
  <Step title="local">
    Вибирається, якщо налаштовано `memorySearch.local.modelPath` і файл існує.
  </Step>
  <Step title="github-copilot">
    Вибирається, якщо можна визначити токен GitHub Copilot (змінна env або auth profile).
  </Step>
  <Step title="openai">
    Вибирається, якщо можна визначити ключ OpenAI.
  </Step>
  <Step title="gemini">
    Вибирається, якщо можна визначити ключ Gemini.
  </Step>
  <Step title="voyage">
    Вибирається, якщо можна визначити ключ Voyage.
  </Step>
  <Step title="mistral">
    Вибирається, якщо можна визначити ключ Mistral.
  </Step>
  <Step title="bedrock">
    Вибирається, якщо ланцюжок credentials AWS SDK успішно визначається (роль інстансу, ключі доступу, profile, SSO, web identity або shared config).
  </Step>
</Steps>

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Визначення API key

Для віддалених embeddings потрібен API key. Натомість Bedrock використовує типовий ланцюжок credentials AWS SDK (ролі інстансу, SSO, ключі доступу).

| Провайдер      | Змінна env                                         | Ключ config                       |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | ланцюжок credentials AWS                           | API key не потрібен               |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Auth profile через device login   |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

<Note>
Codex OAuth покриває лише chat/completions і не задовольняє embedding-запити.
</Note>

---

## Config віддаленого endpoint

Для кастомних OpenAI-compatible endpoint або перевизначення типових значень провайдера:

<ParamField path="remote.baseUrl" type="string">
  Кастомний базовий URL API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Перевизначає API key.
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

## Специфічний для провайдера config

<AccordionGroup>
  <Accordion title="Gemini">
    | Ключ                   | Тип      | Типове значення       | Опис                                       |
    | ---------------------- | -------- | --------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                | Для Embedding 2: 768, 1536 або 3072        |

    <Warning>
    Зміна `model` або `outputDimensionality` запускає автоматичне повне переіндексування.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    OpenAI-compatible embedding endpoint можуть використовувати специфічні для провайдера поля запиту `input_type`. Це корисно для асиметричних embedding-моделей, яким потрібні різні мітки для query embeddings і document embeddings.

    | Ключ                | Тип      | Типове значення | Опис                                                  |
    | ------------------- | -------- | --------------- | ----------------------------------------------------- |
    | `inputType`         | `string` | не задано       | Спільний `input_type` для query і document embeddings |
    | `queryInputType`    | `string` | не задано       | `input_type` під час query; перевизначає `inputType`  |
    | `documentInputType` | `string` | не задано       | `input_type` для індексу/документа; перевизначає `inputType` |

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

    Зміна цих значень впливає на ідентичність кешу embeddings для batch-індексування провайдера, і після цього слід виконати переіндексування пам’яті, якщо upstream-модель по-різному обробляє ці мітки.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock використовує типовий ланцюжок credentials AWS SDK — API key не потрібні. Якщо OpenClaw працює на EC2 з роллю інстансу Bedrock, достатньо просто вказати провайдера та модель:

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

    | Ключ                   | Тип      | Типове значення                 | Опис                              |
    | ---------------------- | -------- | ------------------------------- | --------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0`  | Будь-який ID embedding-моделі Bedrock |
    | `outputDimensionality` | `number` | типове значення моделі          | Для Titan V2: 256, 512 або 1024   |

    **Підтримувані моделі** (з визначенням сімейства та типовими розмірностями):

    | ID моделі                                  | Провайдер  | Типові розмірності | Налаштовувані розмірності |
    | ------------------------------------------ | ---------- | ------------------ | ------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024               | 256, 512, 1024            |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536               | --                        |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536               | --                        |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024               | --                        |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024               | 256, 384, 1024, 3072      |
    | `cohere.embed-english-v3`                  | Cohere     | 1024               | --                        |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024               | --                        |
    | `cohere.embed-v4:0`                        | Cohere     | 1536               | 256-1536                  |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                | --                        |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024               | --                        |

    Варіанти з суфіксом throughput (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують конфігурацію базової моделі.

    **Автентифікація:** auth Bedrock використовує стандартний порядок визначення credentials AWS SDK:

    1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Кеш токенів SSO
    3. Credentials токена web identity
    4. Shared credentials і config-файли
    5. Credentials метаданих ECS або EC2

    Регіон визначається з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` провайдера `amazon-bedrock` або типово дорівнює `us-east-1`.

    **Права IAM:** ролі або користувачу IAM потрібно:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Для мінімально необхідних привілеїв обмежте `InvokeModel` конкретною моделлю:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Ключ                  | Тип                | Типове значення       | Опис                                                                                                                                                                                                                                                                                                                   |
    | --------------------- | ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | автоматично завантажується | Шлях до файлу моделі GGUF                                                                                                                                                                                                                                                                                           |
    | `local.modelCacheDir` | `string`           | типове значення node-llama-cpp | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                         |
    | `local.contextSize`   | `number \| "auto"` | `4096`                | Розмір вікна контексту для embedding-контексту. 4096 покриває типові chunks (128–512 токенів), водночас обмежуючи VRAM, не пов’язану з вагами. На обмежених хостах знижуйте до 1024–2048. `"auto"` використовує натренований максимум моделі — не рекомендується для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 GB VRAM проти ~8.8 GB при 4096). |

    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, завантажується автоматично). Потребує нативної збірки: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використовуйте окремий CLI, щоб перевірити той самий шлях провайдера, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Якщо `provider` має значення `auto`, `local` вибирається лише тоді, коли `local.modelPath` вказує на наявний локальний файл. Посилання на моделі `hf:` і HTTP(S) усе ще можна використовувати явно з `provider: "local"`, але вони не змушують `auto` вибрати local до того, як модель стане доступною на диску.

  </Accordion>
</AccordionGroup>

### Timeout вбудованих embeddings

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначає timeout для вбудованих пакетів embeddings під час індексування пам’яті.

Якщо не задано, використовується типове значення провайдера: 600 секунд для локальних/self-hosted провайдерів, таких як `local`, `ollama` і `lmstudio`, і 120 секунд для hosted-провайдерів. Збільшуйте це значення, якщо локальні пакети embeddings, обмежені CPU, працюють коректно, але повільно.
</ParamField>

---

## Config hybrid search

Усе розташовано в `memorySearch.query.hybrid`:

| Ключ                  | Тип       | Типове значення | Опис                               |
| --------------------- | --------- | --------------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`          | Увімкнути hybrid BM25 + vector search |
| `vectorWeight`        | `number`  | `0.7`           | Вага для vector-оцінок (0-1)       |
| `textWeight`          | `number`  | `0.3`           | Вага для BM25-оцінок (0-1)         |
| `candidateMultiplier` | `number`  | `4`             | Множник розміру пулу кандидатів    |

<Tabs>
  <Tab title="MMR (різноманітність)">
    | Ключ          | Тип       | Типове значення | Опис                                  |
    | ------------- | --------- | --------------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`         | Увімкнути MMR re-ranking              |
    | `mmr.lambda`  | `number`  | `0.7`           | 0 = максимум різноманітності, 1 = максимум релевантності |
  </Tab>
  <Tab title="Temporal decay (давність)">
    | Ключ                         | Тип       | Типове значення | Опис                           |
    | ---------------------------- | --------- | --------------- | ------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false`         | Увімкнути boost за давністю    |
    | `temporalDecay.halfLifeDays` | `number`  | `30`            | Оцінка зменшується вдвічі кожні N днів |

    Evergreen-файли (`MEMORY.md`, файли без дати в `memory/`) ніколи не піддаються decay.

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

| Ключ        | Тип        | Опис                                     |
| ----------- | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | Додаткові каталоги або файли для індексації |

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

Шляхи можуть бути абсолютними або відносними до workspace. Каталоги скануються рекурсивно на наявність файлів `.md`. Обробка symlink залежить від активного backend: вбудований рушій ігнорує symlink, тоді як QMD наслідує поведінку сканера QMD.

Для пошуку transcript між агентами в межах області агента використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові collections мають ту саму форму `{ path, name, pattern? }`, але об’єднуються окремо для кожного агента й можуть зберігати явні спільні назви, коли шлях вказує поза межі поточного workspace. Якщо той самий визначений шлях з’являється і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає дублікат.

---

## Multimodal memory (Gemini)

Індексуйте зображення й аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ                      | Тип        | Типове значення | Опис                                 |
| ------------------------- | ---------- | --------------- | ------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`         | Увімкнути multimodal indexing        |
| `multimodal.modalities`   | `string[]` | --              | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000`      | Максимальний розмір файлу для індексації |

<Note>
Застосовується лише до файлів у `extraPaths`. Типові корені пам’яті залишаються лише для Markdown. Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш embeddings

| Ключ               | Тип       | Типове значення | Опис                             |
| ------------------ | --------- | --------------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false`         | Кешувати embeddings chunks у SQLite |
| `cache.maxEntries` | `number`  | `50000`         | Максимальна кількість кешованих embeddings |

Запобігає повторному створенню embeddings для незміненого тексту під час переіндексації або оновлень transcript.

---

## Пакетна індексація

| Ключ                         | Тип       | Типове значення | Опис                           |
| ---------------------------- | --------- | --------------- | ------------------------------ |
| `remote.batch.enabled`        | `boolean` | `false`         | Увімкнути API пакетних embeddings |
| `remote.batch.concurrency`    | `number`  | `2`             | Паралельні пакетні завдання    |
| `remote.batch.wait`           | `boolean` | `true`          | Чекати завершення пакета       |
| `remote.batch.pollIntervalMs` | `number`  | --              | Інтервал опитування            |
| `remote.batch.timeoutMinutes` | `number`  | --              | Timeout пакета                 |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай найшвидший і найдешевший для великих backfill.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує вбудованими викликами embeddings, що використовуються локальними/self-hosted провайдерами та hosted-провайдерами, коли пакетні API провайдера не активні.

---

## Пошук пам’яті сесії (експериментально)

Індексувати transcripts сесій і показувати їх через `memory_search`:

| Ключ                          | Тип        | Типове значення | Опис                                   |
| ----------------------------- | ---------- | --------------- | -------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`         | Увімкнути індексацію сесій             |
| `sources`                     | `string[]` | `["memory"]`    | Додайте `"sessions"`, щоб включити transcripts |
| `sync.sessions.deltaBytes`    | `number`   | `100000`        | Поріг байтів для переіндексації        |
| `sync.sessions.deltaMessages` | `number`   | `50`            | Поріг повідомлень для переіндексації   |

<Warning>
Індексація сесій є opt-in і виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сесій зберігаються на диску, тож вважайте доступ до файлової системи межею довіри.
</Warning>

---

## Прискорення векторів SQLite (sqlite-vec)

| Ключ                         | Тип       | Типове значення | Опис                                  |
| ---------------------------- | --------- | --------------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`          | Використовувати sqlite-vec для vector queries |
| `store.vector.extensionPath` | `string`  | bundled         | Перевизначити шлях до sqlite-vec      |

Коли sqlite-vec недоступний, OpenClaw автоматично переходить на in-process cosine similarity.

---

## Зберігання індексу

| Ключ                | Тип      | Типове значення                      | Опис                                      |
| ------------------- | -------- | ------------------------------------ | ----------------------------------------- |
| `store.path`        | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | Токенізатор FTS5 (`unicode61` або `trigram`) |

---

## Config backend QMD

Установіть `memory.backend = "qmd"`, щоб увімкнути. Усі налаштування QMD живуть у `memory.qmd`:

| Ключ                     | Тип       | Типове значення | Опис                                         |
| ------------------------ | --------- | --------------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`           | Шлях до виконуваного файла QMD               |
| `searchMode`             | `string`  | `search`        | Команда пошуку: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`          | Автоматично індексувати `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --              | Додаткові шляхи: `{ name, path, pattern? }`  |
| `sessions.enabled`       | `boolean` | `false`         | Індексувати transcripts сесій                |
| `sessions.retentionDays` | `number`  | --              | Термін зберігання transcript                 |
| `sessions.exportDir`     | `string`  | --              | Каталог експорту                             |

OpenClaw надає перевагу поточним формам QMD collection і MCP query, але зберігає працездатність старіших випусків QMD, за потреби переходячи на застарілі прапорці collection `--mask` і старіші назви MCP tools.

<Note>
Перевизначення моделей QMD лишаються на боці QMD, а не в config OpenClaw. Якщо вам потрібно глобально перевизначити моделі QMD, установіть змінні середовища, такі як `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у runtime-середовищі gateway.
</Note>

<AccordionGroup>
  <Accordion title="Розклад оновлення">
    | Ключ                      | Тип       | Типове значення | Опис                               |
    | ------------------------- | --------- | --------------- | ---------------------------------- |
    | `update.interval`         | `string`  | `5m`            | Інтервал оновлення                 |
    | `update.debounceMs`       | `number`  | `15000`         | Debounce для змін файлів           |
    | `update.onBoot`           | `boolean` | `true`          | Оновлювати під час startup         |
    | `update.waitForBootSync`  | `boolean` | `false`         | Блокувати startup, доки оновлення не завершиться |
    | `update.embedInterval`    | `string`  | --              | Окрема cadence для embeddings      |
    | `update.commandTimeoutMs` | `number`  | --              | Timeout для команд QMD             |
    | `update.updateTimeoutMs`  | `number`  | --              | Timeout для операцій оновлення QMD |
    | `update.embedTimeoutMs`   | `number`  | --              | Timeout для операцій embeddings QMD |
  </Accordion>
  <Accordion title="Ліміти">
    | Ключ                      | Тип      | Типове значення | Опис                          |
    | ------------------------- | -------- | --------------- | ----------------------------- |
    | `limits.maxResults`       | `number` | `6`             | Максимум результатів пошуку   |
    | `limits.maxSnippetChars`  | `number` | --              | Обмеження довжини snippet     |
    | `limits.maxInjectedChars` | `number` | --              | Обмеження загальної кількості вставлених символів |
    | `limits.timeoutMs`        | `number` | `4000`          | Timeout пошуку                |
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

    Типове shipped-значення дозволяє direct- і channel-сесії, але все ще забороняє групи.

    Типове значення — лише DM. `match.keyPrefix` зіставляється з нормалізованим ключем сесії; `match.rawKeyPrefix` зіставляється з сирим ключем, включно з `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитування">
    `memory.citations` застосовується до всіх backend:

    | Значення         | Поведінка                                                |
    | ---------------- | -------------------------------------------------------- |
    | `auto` (типово)  | Додає footer `Source: <path#line>` у snippets            |
    | `on`             | Завжди додає footer                                      |
    | `off`            | Не додає footer (шлях усе одно передається агенту всередині) |

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

Dreaming виконується як один запланований прохід і використовує внутрішні фази light/deep/REM як деталь реалізації.

Концептуальну поведінку та slash-команди див. у [Dreaming](/uk/concepts/dreaming).

### Налаштування користувача

| Ключ        | Тип       | Типове значення | Опис                                                |
| ----------- | --------- | --------------- | --------------------------------------------------- |
| `enabled`   | `boolean` | `false`         | Повністю вмикає або вимикає Dreaming                |
| `frequency` | `string`  | `0 3 * * *`     | Необов’язкова Cron-cadence для повного проходу Dreaming |
| `model`     | `string`  | типова модель   | Необов’язкове перевизначення моделі субагента Dream Diary |

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
- `dreaming.model` використовує наявний шлюз довіри subagent Plugin; установіть `plugins.entries.memory-core.subagent.allowModelOverride: true`, перш ніж увімкнути його.
- Політика фаз light/deep/REM і пороги є внутрішньою поведінкою, а не user-facing config.
</Note>

## Пов’язані матеріали

- [Довідник з config](/uk/gateway/configuration-reference)
- [Огляд пам’яті](/uk/concepts/memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
