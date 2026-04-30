---
read_when:
    - Ви хочете налаштувати постачальників пошуку в пам’яті або моделі вбудовувань
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часове згасання
    - Ви хочете увімкнути індексацію мультимодальної пам’яті
sidebarTitle: Memory config
summary: Усі параметри конфігурації для пошуку в пам’яті, постачальників ембедингів, QMD, гібридного пошуку та мультимодального індексування
title: Довідник із налаштування пам’яті
x-i18n:
    generated_at: "2026-04-30T14:27:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58b75751a19afb883fd7646cf5f71859f95bac468b2bfd8cc79db12ae892f70f
    source_path: reference/memory-config.md
    workflow: 16
---

Ця сторінка перелічує кожен параметр конфігурації для пошуку в пам’яті OpenClaw. Концептуальні огляди див.:

<CardGroup cols={2}>
  <Card title="Огляд пам’яті" href="/uk/concepts/memory">
    Як працює пам’ять.
  </Card>
  <Card title="Вбудований рушій" href="/uk/concepts/memory-builtin">
    Типовий бекенд SQLite.
  </Card>
  <Card title="Рушій QMD" href="/uk/concepts/memory-qmd">
    Локальний sidecar.
  </Card>
  <Card title="Пошук у пам’яті" href="/uk/concepts/memory-search">
    Конвеєр пошуку й налаштування.
  </Card>
  <Card title="Active memory" href="/uk/concepts/active-memory">
    Під-агент пам’яті для інтерактивних сеансів.
  </Card>
</CardGroup>

Усі налаштування пошуку в пам’яті містяться в `agents.defaults.memorySearch` у `openclaw.json`, якщо не зазначено інше.

<Note>
Якщо ви шукаєте перемикач функції **active memory** і конфігурацію під-агента, вони містяться в `plugins.entries.active-memory`, а не в `memorySearch`.

Active memory використовує модель із двома шлюзами:

1. plugin має бути ввімкнений і націлений на ідентифікатор поточного агента
2. запит має бути придатним інтерактивним постійним сеансом чату

Див. [Active Memory](/uk/concepts/active-memory), щоб дізнатися про модель активації, конфігурацію, що належить plugin, збереження транскрипта й безпечний шаблон розгортання.
</Note>

---

## Вибір провайдера

| Ключ       | Тип       | Типове значення               | Опис                                                                                                                                                                                                                                           |
| ---------- | --------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | автоматично визначається      | Ідентифікатор адаптера embeddings, як-от `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` або `voyage`; також може бути налаштованим `models.providers.<id>`, чий `api` вказує на один із цих адаптерів |
| `model`    | `string`  | типове значення провайдера    | Назва моделі embeddings                                                                                                                                                                                                                       |
| `fallback` | `string`  | `"none"`                      | Ідентифікатор резервного адаптера, коли основний завершується помилкою                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`                        | Увімкнути або вимкнути пошук у пам’яті                                                                                                                                                                                                        |

### Порядок автоматичного визначення

Коли `provider` не задано, OpenClaw вибирає перший доступний:

<Steps>
  <Step title="local">
    Вибирається, якщо `memorySearch.local.modelPath` налаштовано і файл існує.
  </Step>
  <Step title="github-copilot">
    Вибирається, якщо можна визначити токен GitHub Copilot (змінна середовища або профіль автентифікації).
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
  <Step title="deepinfra">
    Вибирається, якщо можна визначити ключ DeepInfra.
  </Step>
  <Step title="bedrock">
    Вибирається, якщо ланцюг облікових даних AWS SDK успішно визначається (роль інстанса, ключі доступу, профіль, SSO, web identity або спільна конфігурація).
  </Step>
</Steps>

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Користувацькі ідентифікатори провайдерів

`memorySearch.provider` може вказувати на користувацький запис `models.providers.<id>`. OpenClaw визначає власника `api` цього провайдера для адаптера embeddings, зберігаючи користувацький ідентифікатор провайдера для обробки endpoint, автентифікації та префіксів моделей. Це дає змогу конфігураціям із кількома GPU або кількома хостами виділити embeddings пам’яті для конкретного локального endpoint:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### Визначення API-ключа

Віддалені embeddings потребують API-ключа. Bedrock натомість використовує типовий ланцюг облікових даних AWS SDK (ролі інстансів, SSO, ключі доступу).

| Провайдер      | Змінна середовища                                | Ключ конфігурації                  |
| -------------- | ------------------------------------------------ | ---------------------------------- |
| Bedrock        | ланцюг облікових даних AWS                       | API-ключ не потрібен               |
| DeepInfra      | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`   |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профіль автентифікації через вхід із пристрою |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey`  |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                    | --                                 |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`   |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`   |

<Note>
Codex OAuth покриває лише чат/завершення й не задовольняє запити embeddings.
</Note>

---

## Конфігурація віддаленого endpoint

Для користувацьких endpoint, сумісних з OpenAI, або перевизначення типових значень провайдера:

<ParamField path="remote.baseUrl" type="string">
  Користувацький базовий URL API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Перевизначити API-ключ.
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

## Конфігурація для окремих провайдерів

<AccordionGroup>
  <Accordion title="Gemini">
    | Ключ                   | Тип      | Типове значення        | Опис                                      |
    | ---------------------- | -------- | ---------------------- | ----------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Для Embedding 2: 768, 1536 або 3072       |

    <Warning>
    Зміна моделі або `outputDimensionality` запускає автоматичну повну переіндексацію.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-сумісні типи введення">
    OpenAI-сумісні endpoint embeddings можуть увімкнути специфічні для провайдера поля запиту `input_type`. Це корисно для асиметричних моделей embeddings, які потребують різних міток для embeddings запиту й документа.

    | Ключ                | Тип      | Типове значення | Опис                                                     |
    | ------------------- | -------- | --------------- | -------------------------------------------------------- |
    | `inputType`         | `string` | не задано       | Спільний `input_type` для embeddings запиту й документа  |
    | `queryInputType`    | `string` | не задано       | `input_type` під час запиту; перевизначає `inputType`    |
    | `documentInputType` | `string` | не задано       | `input_type` індексу/документа; перевизначає `inputType` |

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

    Зміна цих значень впливає на ідентичність кешу embeddings для пакетного індексування провайдера, і після неї слід виконати переіндексацію пам’яті, коли upstream-модель по-різному обробляє мітки.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock використовує типовий ланцюг облікових даних AWS SDK — API-ключі не потрібні. Якщо OpenClaw працює на EC2 з роллю інстанса з увімкненим Bedrock, просто задайте провайдера й модель:

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

    | Ключ                   | Тип      | Типове значення               | Опис                           |
    | ---------------------- | -------- | ----------------------------- | ------------------------------ |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ID моделі embeddings Bedrock |
    | `outputDimensionality` | `number` | типове значення моделі        | Для Titan V2: 256, 512 або 1024 |

    **Підтримувані моделі** (з визначенням сімейства й типовими розмірностями):

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

    Варіанти із суфіксом пропускної здатності (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують конфігурацію базової моделі.

    **Автентифікація:** автентифікація Bedrock використовує стандартний порядок визначення облікових даних AWS SDK:

    1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Кеш токенів SSO
    3. Облікові дані токена web identity
    4. Спільні файли облікових даних і конфігурації
    5. Облікові дані метаданих ECS або EC2

    Регіон визначається з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` провайдера `amazon-bedrock` або за замовчуванням має значення `us-east-1`.

    **Дозволи IAM:** роль або користувач IAM потребує:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Для найменших привілеїв обмежте `InvokeModel` конкретною моделлю:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Локально (GGUF + node-llama-cpp)">
    | Ключ                  | Тип                | Типове значення        | Опис                                                                                                                                                                                                                                                                                                                                        |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | автоматично завантажено | Шлях до файлу моделі GGUF                                                                                                                                                                                                                                                                                                                   |
    | `local.modelCacheDir` | `string`           | типове для node-llama-cpp | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                                                       |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Розмір контекстного вікна для контексту ембедингів. 4096 покриває типові фрагменти (128-512 токенів), водночас обмежуючи VRAM, не зайняту вагами. Зменште до 1024-2048 на обмежених хостах. `"auto"` використовує навчений максимум моделі — не рекомендовано для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів -> ~32 ГБ VRAM проти ~8,8 ГБ при 4096). |

    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 ГБ, завантажується автоматично). Пакетні встановлення відновлюють нативне середовище виконання `node-llama-cpp` через керовані залежності середовища виконання Plugin, коли налаштовано `provider: "local"`. Вихідні checkout-и все ще потребують схвалення нативної збірки: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використовуйте автономний CLI, щоб перевірити той самий шлях провайдера, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Якщо `provider` має значення `auto`, `local` вибирається лише тоді, коли `local.modelPath` вказує на наявний локальний файл. Посилання на моделі `hf:` та HTTP(S) усе ще можна явно використовувати з `provider: "local"`, але вони не змушують `auto` вибрати локальний режим до того, як модель стане доступною на диску.

  </Accordion>
</AccordionGroup>

### Тайм-аут вбудованих ембедингів

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначає тайм-аут для вбудованих пакетів ембедингів під час індексування памʼяті.

Якщо не задано, використовується типове значення провайдера: 600 секунд для локальних/самостійно розміщених провайдерів, як-от `local`, `ollama` і `lmstudio`, та 120 секунд для розміщених провайдерів. Збільшіть це значення, коли локальні CPU-bound пакети ембедингів працюють коректно, але повільно.
</ParamField>

---

## Конфігурація гібридного пошуку

Усе в `memorySearch.query.hybrid`:

| Ключ                 | Тип       | Типове значення | Опис                                  |
| -------------------- | --------- | --------------- | ------------------------------------- |
| `enabled`            | `boolean` | `true`          | Увімкнути гібридний пошук BM25 + vector |
| `vectorWeight`       | `number`  | `0.7`           | Вага для векторних оцінок (0-1)        |
| `textWeight`         | `number`  | `0.3`           | Вага для оцінок BM25 (0-1)             |
| `candidateMultiplier` | `number` | `4`             | Множник розміру пулу кандидатів        |

<Tabs>
  <Tab title="MMR (різноманітність)">
    | Ключ          | Тип       | Типове значення | Опис                                      |
    | ------------- | --------- | --------------- | ----------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`         | Увімкнути повторне ранжування MMR          |
    | `mmr.lambda`  | `number`  | `0.7`           | 0 = максимальна різноманітність, 1 = максимальна релевантність |
  </Tab>
  <Tab title="Часове згасання (свіжість)">
    | Ключ                         | Тип       | Типове значення | Опис                          |
    | ---------------------------- | --------- | --------------- | ----------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`         | Увімкнути підсилення свіжості |
    | `temporalDecay.halfLifeDays` | `number`  | `30`            | Оцінка зменшується вдвічі кожні N днів |

    Evergreen-файли (`MEMORY.md`, файли без дат у `memory/`) ніколи не підлягають згасанню.

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

## Додаткові шляхи памʼяті

| Ключ         | Тип        | Опис                                      |
| ------------ | ---------- | ----------------------------------------- |
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

Шляхи можуть бути абсолютними або відносними до workspace. Каталоги рекурсивно скануються на файли `.md`. Обробка симлінків залежить від активного бекенда: вбудований рушій ігнорує симлінки, а QMD дотримується поведінки базового сканера QMD.

Для пошуку транскриптів між агентами в межах агента використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові колекції мають ту саму форму `{ path, name, pattern? }`, але обʼєднуються окремо для кожного агента й можуть зберігати явні спільні назви, коли шлях вказує за межі поточного workspace. Якщо той самий розвʼязаний шлях присутній і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD залишає перший запис і пропускає дублікат.

---

## Мультимодальна памʼять (Gemini)

Індексуйте зображення та аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ                      | Тип        | Типове значення | Опис                                  |
| ------------------------- | ---------- | --------------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`         | Увімкнути мультимодальне індексування |
| `multimodal.modalities`   | `string[]` | --              | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000`      | Максимальний розмір файлу для індексації |

<Note>
Застосовується лише до файлів у `extraPaths`. Типові корені памʼяті залишаються лише Markdown. Потребує `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш ембедингів

| Ключ               | Тип       | Типове значення | Опис                                |
| ------------------ | --------- | --------------- | ----------------------------------- |
| `cache.enabled`    | `boolean` | `false`         | Кешувати ембединги фрагментів у SQLite |
| `cache.maxEntries` | `number`  | `50000`         | Максимальна кількість кешованих ембедингів |

Запобігає повторному створенню ембедингів для незміненого тексту під час повторного індексування або оновлень транскриптів.

---

## Пакетне індексування

| Ключ                          | Тип       | Типове значення | Опис                         |
| ----------------------------- | --------- | --------------- | ---------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`             | Паралельні вбудовані ембединги |
| `remote.batch.enabled`        | `boolean` | `false`         | Увімкнути API пакетних ембедингів |
| `remote.batch.concurrency`    | `number`  | `2`             | Паралельні пакетні завдання   |
| `remote.batch.wait`           | `boolean` | `true`          | Чекати завершення пакета      |
| `remote.batch.pollIntervalMs` | `number`  | --              | Інтервал опитування           |
| `remote.batch.timeoutMinutes` | `number`  | --              | Тайм-аут пакета               |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай найшвидший і найдешевший для великих зворотних заповнень.

`remote.nonBatchConcurrency` керує вбудованими викликами ембедингів, які використовують локальні/самостійно розміщені провайдери та розміщені провайдери, коли пакетні API провайдера не активні. Ollama типово використовує `1` для непакетного індексування, щоб не перевантажувати менші локальні хости; задайте більше значення на потужніших машинах.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує тайм-аутом для вбудованих викликів ембедингів.

---

## Пошук у памʼяті сеансів (експериментально)

Індексуйте транскрипти сеансів і показуйте їх через `memory_search`:

| Ключ                         | Тип        | Типове значення | Опис                                     |
| ---------------------------- | ---------- | --------------- | ---------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`         | Увімкнути індексування сеансів            |
| `sources`                    | `string[]` | `["memory"]`    | Додайте `"sessions"`, щоб включити транскрипти |
| `sync.sessions.deltaBytes`   | `number`   | `100000`        | Поріг у байтах для повторного індексування |
| `sync.sessions.deltaMessages` | `number`  | `50`            | Поріг у повідомленнях для повторного індексування |

<Warning>
Індексування сеансів увімкнене за вибором і виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сеансів зберігаються на диску, тому вважайте доступ до файлової системи межею довіри.
</Warning>

---

## SQLite-векторне прискорення (sqlite-vec)

| Ключ                         | Тип       | Типове значення | Опис                                   |
| ---------------------------- | --------- | --------------- | -------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`          | Використовувати sqlite-vec для векторних запитів |
| `store.vector.extensionPath` | `string`  | у комплекті     | Перевизначити шлях до sqlite-vec        |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до in-process cosine similarity.

---

## Сховище індексу

| Ключ                  | Тип      | Типове значення                     | Опис                                      |
| --------------------- | -------- | ----------------------------------- | ----------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | Токенізатор FTS5 (`unicode61` або `trigram`) |

---

## Конфігурація бекенда QMD

Задайте `memory.backend = "qmd"`, щоб увімкнути. Усі налаштування QMD розташовані в `memory.qmd`:

| Ключ                     | Тип       | Типове значення | Опис                                                                                  |
| ------------------------ | --------- | --------------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`           | Шлях до виконуваного файлу QMD; задайте абсолютний шлях, коли `PATH` служби відрізняється від вашої оболонки |
| `searchMode`             | `string`  | `search`        | Команда пошуку: `search`, `vsearch`, `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`          | Автоматично індексувати `MEMORY.md` + `memory/**/*.md`                                |
| `paths[]`                | `array`   | --              | Додаткові шляхи: `{ name, path, pattern? }`                                           |
| `sessions.enabled`       | `boolean` | `false`         | Індексувати стенограми сеансів                                                       |
| `sessions.retentionDays` | `number`  | --              | Термін зберігання стенограм                                                          |
| `sessions.exportDir`     | `string`  | --              | Каталог експорту                                                                      |

`searchMode: "search"` використовує лише лексичний пошук/BM25. OpenClaw не запускає перевірки готовності семантичних векторів або обслуговування вбудовувань QMD для цього режиму, зокрема під час `memory status --deep`; `vsearch` і `query` і надалі потребують готовності векторів QMD та вбудовувань.

OpenClaw надає перевагу поточним формам колекцій QMD і запитів MCP, але підтримує роботу старіших випусків QMD, за потреби пробуючи сумісні прапорці шаблонів колекцій і старіші назви інструментів MCP. Коли QMD оголошує підтримку кількох фільтрів колекцій, колекції з одного джерела шукаються одним процесом QMD; старіші збірки QMD зберігають шлях сумісності для кожної колекції. Одне джерело означає, що сталі колекції пам’яті групуються разом, тоді як колекції стенограм сеансів залишаються окремою групою, щоб диверсифікація джерел і надалі мала обидва вхідні набори.

<Note>
Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо потрібно глобально перевизначити моделі QMD, задайте змінні середовища, як-от `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі виконання Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Розклад оновлення">
    | Ключ                      | Тип       | Типове значення | Опис                                  |
    | ------------------------- | --------- | --------------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`            | Інтервал оновлення                    |
    | `update.debounceMs`       | `number`  | `15000`         | Приглушення змін файлів               |
    | `update.onBoot`           | `boolean` | `true`          | Оновлювати, коли відкривається довгоживучий менеджер QMD; також обмежує стартове оновлення за згодою |
    | `update.startup`          | `string`  | `off`           | Необов’язкове оновлення під час запуску Gateway: `off`, `idle` або `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`        | Затримка перед запуском оновлення `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`         | Блокувати відкриття менеджера, доки не завершиться його початкове оновлення |
    | `update.embedInterval`    | `string`  | --              | Окрема частота вбудовування           |
    | `update.commandTimeoutMs` | `number`  | --              | Час очікування для команд QMD         |
    | `update.updateTimeoutMs`  | `number`  | --              | Час очікування для операцій оновлення QMD |
    | `update.embedTimeoutMs`   | `number`  | --              | Час очікування для операцій вбудовування QMD |
  </Accordion>
  <Accordion title="Обмеження">
    | Ключ                      | Тип      | Типове значення | Опис                       |
    | ------------------------- | -------- | --------------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`             | Максимум результатів пошуку |
    | `limits.maxSnippetChars`  | `number` | --              | Обмежити довжину фрагмента |
    | `limits.maxInjectedChars` | `number` | --              | Обмежити загальну кількість вставлених символів |
    | `limits.timeoutMs`        | `number` | `4000`          | Час очікування пошуку      |
  </Accordion>
  <Accordion title="Область дії">
    Керує тим, які сеанси можуть отримувати результати пошуку QMD. Та сама схема, що й [`session.sendPolicy`](/uk/gateway/config-agents#session):

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

    Типове значення, що постачається, дозволяє прямі сеанси та сеанси каналів, але й надалі забороняє групи.

    Типово дозволено лише DM. `match.keyPrefix` зіставляється з нормалізованим ключем сеансу; `match.rawKeyPrefix` зіставляється з необробленим ключем, включно з `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитування">
    `memory.citations` застосовується до всіх бекендів:

    | Значення         | Поведінка                                           |
    | ---------------- | --------------------------------------------------- |
    | `auto` (типово)  | Додавати нижній колонтитул `Source: <path#line>` у фрагменти |
    | `on`             | Завжди додавати нижній колонтитул                  |
    | `off`            | Пропускати нижній колонтитул (шлях усе одно передається агенту внутрішньо) |

  </Accordion>
</AccordionGroup>

Стартові оновлення QMD використовують одноразовий шлях підпроцесу під час запуску Gateway. Довгоживучий менеджер QMD і надалі відповідає за звичайний спостерігач файлів і таймери інтервалів, коли пошук у пам’яті відкрито для інтерактивного використання.

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

Концептуальну поведінку та slash-команди див. у [Dreaming](/uk/concepts/dreaming).

### Користувацькі налаштування

| Ключ        | Тип       | Типове значення | Опис                                                |
| ----------- | --------- | --------------- | --------------------------------------------------- |
| `enabled`   | `boolean` | `false`         | Повністю ввімкнути або вимкнути dreaming            |
| `frequency` | `string`  | `0 3 * * *`     | Необов’язкова частота cron для повного проходу dreaming |
| `model`     | `string`  | типова модель   | Необов’язкове перевизначення моделі підагенту Dream Diary |

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
- Dreaming записує зручний для людини наративний вивід у `DREAMS.md` (або наявний `dreams.md`).
- `dreaming.model` використовує наявний шлюз довіри підагенту Plugin; задайте `plugins.entries.memory-core.subagent.allowModelOverride: true`, перш ніж увімкнути його.
- Dream Diary повторює спробу один раз із типовою моделлю сеансу, коли налаштована модель недоступна. Збої довіри або списку дозволених моделей журналюються й не повторюються непомітно.
- Політика фаз light/deep/REM і порогові значення є внутрішньою поведінкою, а не користувацькою конфігурацією.

</Note>

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Огляд пам’яті](/uk/concepts/memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
