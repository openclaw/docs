---
read_when:
    - Ви хочете налаштувати provider пошуку пам’яті або моделі embedding
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати hybrid search, MMR або temporal decay
    - Ви хочете ввімкнути multimodal indexing пам’яті
sidebarTitle: Memory config
summary: Усі параметри конфігурації для пошуку пам’яті, provider embedding, QMD, hybrid search і multimodal indexing
title: Довідник конфігурації пам’яті
x-i18n:
    generated_at: "2026-04-28T00:35:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae4993c3b6579be3086997bbd0938e81ce52cfb3b8964674630ab52e59cb1528
    source_path: reference/memory-config.md
    workflow: 15
---

На цій сторінці перелічено всі параметри конфігурації для пошуку пам’яті OpenClaw. Для концептуальних оглядів дивіться:

<CardGroup cols={2}>
  <Card title="Огляд пам’яті" href="/uk/concepts/memory">
    Як працює пам’ять.
  </Card>
  <Card title="Вбудований рушій" href="/uk/concepts/memory-builtin">
    Типовий бекенд SQLite.
  </Card>
  <Card title="Рушій QMD" href="/uk/concepts/memory-qmd">
    Локальний sidecar із пріоритетом local-first.
  </Card>
  <Card title="Пошук пам’яті" href="/uk/concepts/memory-search">
    Конвеєр пошуку й налаштування.
  </Card>
  <Card title="Active Memory" href="/uk/concepts/active-memory">
    Субагент пам’яті для інтерактивних сесій.
  </Card>
</CardGroup>

Усі налаштування пошуку пам’яті розміщені в `agents.defaults.memorySearch` у `openclaw.json`, якщо не вказано інше.

<Note>
Якщо ви шукаєте перемикач функції **Active Memory** і конфігурацію субагента, вони розміщені в `plugins.entries.active-memory`, а не в `memorySearch`.

Active Memory використовує двоетапну модель перевірки:

1. Plugin має бути ввімкнений і націлений на поточний id агента
2. запит має належати до допустимої інтерактивної постійної сесії чату

Дивіться [Active Memory](/uk/concepts/active-memory), щоб дізнатися про модель активації, конфігурацію під керуванням Plugin, збереження транскрипту й безпечний шаблон розгортання.
</Note>

---

## Вибір provider

| Key        | Type      | Default          | Description                                                                                                                |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | auto-detected    | ID адаптера embedding: `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | provider default | Назва моделі embedding                                                                                                     |
| `fallback` | `string`  | `"none"`         | ID резервного адаптера, якщо основний завершується помилкою                                                                |
| `enabled`  | `boolean` | `true`           | Увімкнути або вимкнути пошук пам’яті                                                                                       |

### Порядок автовизначення

Коли `provider` не задано, OpenClaw вибирає перший доступний:

<Steps>
  <Step title="local">
    Вибирається, якщо налаштовано `memorySearch.local.modelPath` і файл існує.
  </Step>
  <Step title="github-copilot">
    Вибирається, якщо вдається розв’язати токен GitHub Copilot (змінна середовища або auth profile).
  </Step>
  <Step title="openai">
    Вибирається, якщо вдається розв’язати ключ OpenAI.
  </Step>
  <Step title="gemini">
    Вибирається, якщо вдається розв’язати ключ Gemini.
  </Step>
  <Step title="voyage">
    Вибирається, якщо вдається розв’язати ключ Voyage.
  </Step>
  <Step title="mistral">
    Вибирається, якщо вдається розв’язати ключ Mistral.
  </Step>
  <Step title="deepinfra">
    Вибирається, якщо вдається розв’язати ключ DeepInfra.
  </Step>
  <Step title="bedrock">
    Вибирається, якщо ланцюг облікових даних AWS SDK успішно розв’язується (роль екземпляра, ключі доступу, profile, SSO, web identity або спільна конфігурація).
  </Step>
</Steps>

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Розв’язання API-ключа

Віддалені embedding потребують API-ключа. Натомість Bedrock використовує типовий ланцюг облікових даних AWS SDK (ролі екземпляра, SSO, ключі доступу).

| Provider       | Env var                                            | Config key                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | Ланцюг облікових даних AWS                         | API-ключ не потрібен                |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Auth profile через device login     |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
OAuth Codex покриває лише chat/completions і не задовольняє запити embedding.
</Note>

---

## Конфігурація віддаленої endpoint

Для користувацьких endpoint, сумісних з OpenAI, або перевизначення типових налаштувань provider:

<ParamField path="remote.baseUrl" type="string">
  Користувацька базова URL API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Перевизначити API-ключ.
</ParamField>
<ParamField path="remote.headers" type="object">
  Додаткові HTTP-заголовки (об’єднуються з типовими значеннями provider).
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

## Конфігурація для конкретних provider

<AccordionGroup>
  <Accordion title="Gemini">
    | Key                    | Type     | Default                | Description                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Для Embedding 2: 768, 1536 або 3072        |

    <Warning>
    Зміна `model` або `outputDimensionality` запускає автоматичну повну переіндексацію.
    </Warning>

  </Accordion>
  <Accordion title="Типи input, сумісні з OpenAI">
    Endpoint embedding, сумісні з OpenAI, можуть використовувати специфічні для provider поля запиту `input_type`. Це корисно для асиметричних моделей embedding, які потребують різних міток для embedding запиту та документа.

    | Key                 | Type     | Default | Description                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | unset   | Спільний `input_type` для embedding запиту й документа  |
    | `queryInputType`    | `string` | unset   | `input_type` під час запиту; перевизначає `inputType`   |
    | `documentInputType` | `string` | unset   | `input_type` для індексу/документа; перевизначає `inputType` |

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

    Зміна цих значень впливає на ідентичність кешу embedding для пакетної індексації provider, і після цього слід виконати переіндексацію пам’яті, якщо висхідна модель по-різному обробляє ці мітки.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock використовує типовий ланцюг облікових даних AWS SDK — API-ключі не потрібні. Якщо OpenClaw працює на EC2 із роллю екземпляра, для якої ввімкнено Bedrock, просто задайте provider і model:

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
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ID моделі embedding Bedrock |
    | `outputDimensionality` | `number` | model default                  | Для Titan V2: 256, 512 або 1024 |

    **Підтримувані моделі** (з визначенням сімейства й типовими вимірами):

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

    Варіанти з суфіксом пропускної здатності (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують конфігурацію базової моделі.

    **Автентифікація:** автентифікація Bedrock використовує стандартний порядок розв’язання облікових даних AWS SDK:

    1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Кеш токенів SSO
    3. Облікові дані токена web identity
    4. Спільні файли облікових даних і конфігурації
    5. Облікові дані метаданих ECS або EC2

    Регіон розв’язується з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` provider `amazon-bedrock` або типово дорівнює `us-east-1`.

    **Дозволи IAM:** роль або користувач IAM повинні мати:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Для принципу мінімально необхідних привілеїв обмежте `InvokeModel` конкретною моделлю:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Key                   | Type               | Default                | Description                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | auto-downloaded        | Шлях до файла моделі GGUF                                                                                                                                                                                                                                                                                            |
    | `local.modelCacheDir` | `string`           | node-llama-cpp default | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                                |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Розмір контекстного вікна для контексту embedding. 4096 покриває типові chunk-и (128–512 токенів), водночас обмежуючи VRAM, не пов’язану з вагами. На обмежених хостах зменшуйте до 1024–2048. `"auto"` використовує максимальне значення, на якому навчено модель — не рекомендується для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 GB VRAM проти ~8.8 GB при 4096). |

    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, завантажується автоматично). Потребує нативної збірки: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використовуйте окремий CLI, щоб перевірити той самий шлях provider, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Якщо `provider` має значення `auto`, `local` вибирається лише тоді, коли `local.modelPath` вказує на наявний локальний файл. Посилання на моделі `hf:` і HTTP(S) усе ще можна явно використовувати з `provider: "local"`, але вони не змушують `auto` вибирати local до того, як модель стане доступною на диску.

  </Accordion>
</AccordionGroup>

### Тайм-аут inline embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначає тайм-аут для inline batch embedding під час індексації пам’яті.

Якщо не задано, використовується типове значення provider: 600 секунд для локальних/self-hosted provider, таких як `local`, `ollama` і `lmstudio`, і 120 секунд для хостованих provider. Збільшуйте це значення, коли локальні batch embedding, обмежені CPU, працюють коректно, але повільно.
</ParamField>

---

## Конфігурація hybrid search

Усе розміщено в `memorySearch.query.hybrid`:

| Key                   | Type      | Default | Description                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Увімкнути hybrid search BM25 + vector |
| `vectorWeight`        | `number`  | `0.7`   | Вага для оцінок vector (0-1)       |
| `textWeight`          | `number`  | `0.3`   | Вага для оцінок BM25 (0-1)         |
| `candidateMultiplier` | `number`  | `4`     | Множник розміру пулу кандидатів    |

<Tabs>
  <Tab title="MMR (diversity)">
    | Key           | Type      | Default | Description                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Увімкнути повторне ранжування MMR    |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = максимальна різноманітність, 1 = максимальна релевантність |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | Key                          | Type      | Default | Description               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Увімкнути буст нещодавності |
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

Шляхи можуть бути абсолютними або відносними до workspace. Каталоги скануються рекурсивно на наявність файлів `.md`. Обробка symlink залежить від активного бекенду: вбудований рушій ігнорує symlink, тоді як QMD дотримується поведінки базового сканера QMD.

Для пошуку transcript між агентами в межах agent-scoped використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові collection мають ту саму форму `{ path, name, pattern? }`, але об’єднуються для кожного агента окремо й можуть зберігати явні спільні назви, коли шлях указує за межі поточного workspace. Якщо той самий розв’язаний шлях з’являється і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає дублікат.

---

## Multimodal memory (Gemini)

Індексуйте зображення й аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Key                       | Type       | Default    | Description                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Увімкнути multimodal indexing          |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Максимальний розмір файла для індексації |

<Note>
Застосовується лише до файлів у `extraPaths`. Типові корені пам’яті залишаються лише для Markdown. Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш embedding

| Key                | Type      | Default | Description                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Кешувати embedding chunk-ів у SQLite |
| `cache.maxEntries` | `number`  | `50000` | Максимальна кількість кешованих embedding |

Запобігає повторному embedding незміненого тексту під час переіндексації або оновлення transcript.

---

## Пакетна індексація

| Key                           | Type      | Default | Description                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Паралельні inline embedding |
| `remote.batch.enabled`        | `boolean` | `false` | Увімкнути API пакетного embedding |
| `remote.batch.concurrency`    | `number`  | `2`     | Паралельні пакетні завдання |
| `remote.batch.wait`           | `boolean` | `true`  | Чекати завершення пакета   |
| `remote.batch.pollIntervalMs` | `number`  | --      | Інтервал опитування        |
| `remote.batch.timeoutMinutes` | `number`  | --      | Тайм-аут пакета            |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай є найшвидшим і найдешевшим для великих backfill.

`remote.nonBatchConcurrency` керує inline-викликами embedding, які використовують локальні/self-hosted provider і хостовані provider, коли пакетні API provider не активні. Для Ollama типове значення для non-batch indexing — `1`, щоб не перевантажувати менші локальні хости; на потужніших машинах установіть більше значення.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує тайм-аутом для inline-викликів embedding.

---

## Пошук пам’яті сесії (експериментально)

Індексуйте transcript сесії та показуйте їх через `memory_search`:

| Key                           | Type       | Default      | Description                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Увімкнути індексацію сесій              |
| `sources`                     | `string[]` | `["memory"]` | Додайте `"sessions"`, щоб включити transcript |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Поріг байтів для переіндексації         |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Поріг повідомлень для переіндексації    |

<Warning>
Індексація сесій є opt-in і виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сесій зберігаються на диску, тому вважайте доступ до файлової системи межею довіри.
</Warning>

---

## Прискорення векторів SQLite (sqlite-vec)

| Key                          | Type      | Default | Description                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Використовувати sqlite-vec для векторних запитів |
| `store.vector.extensionPath` | `string`  | bundled | Перевизначити шлях до sqlite-vec  |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до in-process cosine similarity.

---

## Зберігання індексу

| Key                   | Type     | Default                               | Description                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Токенізатор FTS5 (`unicode61` або `trigram`) |

---

## Конфігурація бекенду QMD

Установіть `memory.backend = "qmd"`, щоб увімкнути його. Усі налаштування QMD розміщені в `memory.qmd`:

| Key                      | Type      | Default  | Description                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Шлях до виконуваного файла QMD; установіть абсолютний шлях, якщо `PATH` сервісу відрізняється від вашої оболонки |
| `searchMode`             | `string`  | `search` | Команда пошуку: `search`, `vsearch`, `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | Автоматично індексувати `MEMORY.md` + `memory/**/*.md`                                |
| `paths[]`                | `array`   | --       | Додаткові шляхи: `{ name, path, pattern? }`                                            |
| `sessions.enabled`       | `boolean` | `false`  | Індексувати transcript сесій                                                           |
| `sessions.retentionDays` | `number`  | --       | Термін зберігання transcript                                                           |
| `sessions.exportDir`     | `string`  | --       | Каталог експорту                                                                       |

`searchMode: "search"` — це лише лексичний/BM25-режим. OpenClaw не виконує перевірки готовності семантичного vector-пошуку або обслуговування embedding QMD для цього режиму, зокрема під час `memory status --deep`; режими `vsearch` і `query`, як і раніше, потребують готовності vector у QMD та embedding.

OpenClaw надає перевагу актуальним формам collection і MCP query у QMD, але зберігає працездатність зі старішими випусками QMD, за потреби пробуючи сумісні прапорці шаблонів collection і старіші назви інструментів MCP. Коли QMD повідомляє про підтримку кількох фільтрів collection, collection з одного source шукаються одним процесом QMD; старіші збірки QMD зберігають сумісний шлях із обробкою по одній collection. Same-source означає, що collection довготривалої пам’яті групуються разом, тоді як collection transcript сесій залишаються окремою групою, щоб диверсифікація джерел усе ще мала обидва входи.

<Note>
Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо вам потрібно глобально перевизначити моделі QMD, установіть змінні середовища, такі як `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у runtime-середовищі Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Розклад оновлення">
    | Key                       | Type      | Default | Description                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Інтервал оновлення                    |
    | `update.debounceMs`       | `number`  | `15000` | Debounce змін файлів                  |
    | `update.onBoot`           | `boolean` | `true`  | Оновлювати під час запуску            |
    | `update.waitForBootSync`  | `boolean` | `false` | Блокувати запуск до завершення оновлення |
    | `update.embedInterval`    | `string`  | --      | Окрема частота для embedding          |
    | `update.commandTimeoutMs` | `number`  | --      | Тайм-аут для команд QMD               |
    | `update.updateTimeoutMs`  | `number`  | --      | Тайм-аут для операцій оновлення QMD   |
    | `update.embedTimeoutMs`   | `number`  | --      | Тайм-аут для операцій embedding QMD   |
  </Accordion>
  <Accordion title="Ліміти">
    | Key                       | Type     | Default | Description                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Максимум результатів пошуку |
    | `limits.maxSnippetChars`  | `number` | --      | Обмежити довжину snippet   |
    | `limits.maxInjectedChars` | `number` | --      | Обмежити загальну кількість injected chars |
    | `limits.timeoutMs`        | `number` | `4000`  | Тайм-аут пошуку            |
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

    Типова конфігурація в поставці дозволяє direct- і channel-сесії, але все одно забороняє групи.

    Типове значення — лише DM. `match.keyPrefix` відповідає нормалізованому ключу сесії; `match.rawKeyPrefix` відповідає сирому ключу, включно з `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитати">
    `memory.citations` застосовується до всіх бекендів:

    | Value            | Behavior                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (типово)  | Додавати нижній колонтитул `Source: <path#line>` у snippet |
    | `on`             | Завжди додавати нижній колонтитул                   |
    | `off`            | Не додавати нижній колонтитул (шлях усе одно внутрішньо передається агенту) |

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

Dreaming працює як один запланований цикл і використовує внутрішні фази light/deep/REM як деталь реалізації.

Для опису концептуальної поведінки та slash-команд дивіться [Dreaming](/uk/concepts/dreaming).

### Налаштування користувача

| Key         | Type      | Default       | Description                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Повністю ввімкнути або вимкнути Dreaming          |
| `frequency` | `string`  | `0 3 * * *`   | Необов’язкова частота Cron для повного циклу Dreaming |
| `model`     | `string`  | default model | Необов’язкове перевизначення моделі субагента Dream Diary |

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
- `dreaming.model` використовує наявний trust gate субагента Plugin; перед його ввімкненням установіть `plugins.entries.memory-core.subagent.allowModelOverride: true`.
- Політика фаз light/deep/REM і порогові значення є внутрішньою поведінкою, а не користувацькою конфігурацією.
</Note>

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Огляд пам’яті](/uk/concepts/memory)
- [Пошук пам’яті](/uk/concepts/memory-search)
