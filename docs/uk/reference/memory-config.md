---
read_when:
    - Ви хочете налаштувати постачальників пошуку в пам’яті або моделі ембедингів
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часове згасання
    - Ви хочете ввімкнути індексування мультимодальної пам’яті
sidebarTitle: Memory config
summary: Усі параметри конфігурації для пошуку в пам’яті, постачальників ембедингів, QMD, гібридного пошуку та мультимодального індексування
title: Довідник із налаштування пам’яті
x-i18n:
    generated_at: "2026-06-27T18:17:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

Ця сторінка перелічує всі параметри конфігурації для пошуку пам’яті OpenClaw. Концептуальні огляди див.:

<CardGroup cols={2}>
  <Card title="Огляд пам’яті" href="/uk/concepts/memory">
    Як працює пам’ять.
  </Card>
  <Card title="Вбудований рушій" href="/uk/concepts/memory-builtin">
    Стандартний бекенд SQLite.
  </Card>
  <Card title="Рушій QMD" href="/uk/concepts/memory-qmd">
    Локально-орієнтований допоміжний процес.
  </Card>
  <Card title="Пошук пам’яті" href="/uk/concepts/memory-search">
    Конвеєр пошуку та налаштування.
  </Card>
  <Card title="Active Memory" href="/uk/concepts/active-memory">
    Субагент пам’яті для інтерактивних сеансів.
  </Card>
</CardGroup>

Усі налаштування пошуку пам’яті містяться в `agents.defaults.memorySearch` у `openclaw.json`, якщо не зазначено інше.

<Note>
Якщо ви шукаєте перемикач функції **Active Memory** і конфігурацію субагента, вони розміщені в `plugins.entries.active-memory`, а не в `memorySearch`.

Active Memory використовує модель із двома шлюзами:

1. plugin має бути ввімкнений і націлений на ідентифікатор поточного агента
2. запит має бути придатним інтерактивним постійним сеансом чату

Див. [Active Memory](/uk/concepts/active-memory), щоб дізнатися про модель активації, конфігурацію, що належить plugin, збереження транскрипту та безпечний шаблон розгортання.
</Note>

---

## Вибір провайдера

| Ключ      | Тип       | Стандартне значення | Опис                                                                                                                                                                                                                                                                                                  |
| --------- | --------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`          | Ідентифікатор адаптера embedding, як-от `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` або `voyage`; також може бути налаштованим `models.providers.<id>`, чий `api` вказує на адаптер embedding пам’яті або OpenAI-сумісний API моделі |
| `model`    | `string`  | стандарт провайдера | Назва моделі embedding                                                                                                                                                                                                                                                                                 |
| `fallback` | `string`  | `"none"`            | Ідентифікатор резервного адаптера, коли основний завершується помилкою                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`              | Увімкнути або вимкнути пошук пам’яті                                                                                                                                                                                                                                                                   |

Коли `provider` не задано, OpenClaw використовує embeddings OpenAI. Задайте `provider`
явно, щоб використовувати Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, локальну модель GGUF або OpenAI-сумісний endpoint `/v1/embeddings`.
Застарілі конфіги, у яких досі вказано `provider: "auto"`, розв’язуються як `openai`.

<Warning>
Зміна провайдера embedding, моделі, налаштувань провайдера, джерел, області дії,
розбиття на фрагменти або tokenizer може зробити наявний векторний індекс SQLite несумісним.
OpenClaw призупиняє векторний пошук і повідомляє попередження про ідентичність індексу замість того,
щоб автоматично перестворювати embeddings для всього. Перебудуйте індекс, коли будете готові, за допомогою
`openclaw memory status --index --agent <id>` або
`openclaw memory index --force --agent <id>`.
</Warning>

Коли `provider` не встановлено, присутній застарілий `provider: "auto"` або
`provider: "none"` навмисно вибирає режим лише FTS, відновлення пам’яті все ще може
використовувати лексичне ранжування FTS, коли embeddings недоступні.

Явно задані нелокальні провайдери завершуються закритою помилкою. Якщо ви встановите `memorySearch.provider` на
конкретного провайдера з віддаленим бекендом, як-от OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio або OpenAI-сумісного
користувацького провайдера, і цей провайдер недоступний під час виконання, `memory_search`
поверне результат про недоступність замість мовчазного використання відновлення лише через FTS. Виправте
конфігурацію провайдера/автентифікації, перемкніться на доступного провайдера або встановіть
`provider: "none"`, якщо вам потрібне навмисне відновлення лише через FTS.

### Користувацькі ідентифікатори провайдерів

`memorySearch.provider` може вказувати на користувацький запис `models.providers.<id>` для специфічних для пам’яті адаптерів провайдерів, як-от `ollama`, або для OpenAI-сумісних API моделей, як-от `openai-responses` / `openai-completions`. OpenClaw визначає власника `api` цього провайдера для адаптера embedding, зберігаючи користувацький ідентифікатор провайдера для endpoint, автентифікації та обробки префікса моделі. Це дає змогу конфігураціям із кількома GPU або кількома хостами виділити embeddings пам’яті для конкретного локального endpoint:

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

Віддалені embeddings потребують API-ключа. Bedrock натомість використовує стандартний ланцюжок облікових даних AWS SDK (ролі інстансів, SSO, ключі доступу).

| Провайдер      | Змінна середовища                                  | Ключ конфігурації                  |
| -------------- | -------------------------------------------------- | ---------------------------------- |
| Bedrock        | ланцюжок облікових даних AWS                      | API-ключ не потрібен               |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`   |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профіль автентифікації через вхід із пристрою |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`  |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                      | --                                 |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`   |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`   |

<Note>
Codex OAuth покриває лише chat/completions і не задовольняє запити embedding.
</Note>

---

## Конфігурація віддаленого endpoint

Використовуйте `provider: "openai-compatible"` для загального OpenAI-сумісного
сервера `/v1/embeddings`, який не має успадковувати глобальні облікові дані чату OpenAI.

<ParamField path="remote.baseUrl" type="string">
  Користувацький базовий URL API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Перевизначити API-ключ.
</ParamField>
<ParamField path="remote.headers" type="object">
  Додаткові HTTP-заголовки (об’єднуються зі стандартними значеннями провайдера).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
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
    | Ключ                   | Тип      | Стандартне значення   | Опис                                       |
    | ---------------------- | -------- | --------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                | Для Embedding 2: 768, 1536 або 3072        |

    <Warning>
    Зміна моделі або `outputDimensionality` змінює ідентичність індексу. OpenClaw
    призупиняє векторний пошук, доки ви явно не перебудуєте індекс пам’яті.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-сумісні типи введення">
    OpenAI-сумісні endpoint для embeddings можуть увімкнути специфічні для провайдера поля запиту `input_type`. Це корисно для асиметричних моделей embedding, які потребують різних міток для embeddings запиту й документа.

    | Ключ                | Тип      | Стандартне значення | Опис                                                |
    | ------------------- | -------- | ------------------- | --------------------------------------------------- |
    | `inputType`         | `string` | не встановлено      | Спільний `input_type` для embeddings запиту й документа |
    | `queryInputType`    | `string` | не встановлено      | `input_type` під час запиту; перевизначає `inputType` |
    | `documentInputType` | `string` | не встановлено      | `input_type` індексу/документа; перевизначає `inputType` |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Зміна цих значень впливає на ідентичність кешу embedding для пакетного індексування провайдера, і після неї слід переіндексувати пам’ять, коли upstream-модель по-різному трактує мітки.

  </Accordion>
  <Accordion title="Bedrock">
    ### Конфігурація embedding Bedrock

    Bedrock використовує стандартний ланцюжок облікових даних AWS SDK — API-ключі не потрібні. Якщо OpenClaw працює на EC2 з роллю інстансу, для якої ввімкнено Bedrock, просто задайте провайдера й модель:

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

    | Ключ                   | Тип      | Стандартне значення           | Опис                              |
    | ---------------------- | -------- | ----------------------------- | --------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ідентифікатор моделі embedding Bedrock |
    | `outputDimensionality` | `number` | стандарт моделі               | Для Titan V2: 256, 512 або 1024   |

    **Підтримувані моделі** (з визначенням сімейства та стандартними розмірностями):

    | Ідентифікатор моделі                      | Провайдер  | Типова розмірність | Налаштовувана розмірність |
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

    **Автентифікація:** автентифікація Bedrock використовує стандартний порядок визначення облікових даних AWS SDK:

    1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Кеш токенів SSO
    3. Облікові дані токена вебідентичності
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

    Для принципу найменших привілеїв обмежте `InvokeModel` конкретною моделлю:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Локально (GGUF + llama.cpp)">
    | Ключ                  | Тип                | Типове значення       | Опис                                                                                                                                                                                                                                                                                                                |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | автоматично завантажується | Шлях до файлу моделі GGUF                                                                                                                                                                                                                                                                                          |
    | `local.modelCacheDir` | `string`           | типове значення node-llama-cpp | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                              |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Розмір контекстного вікна для контексту embedding. 4096 покриває типові фрагменти (128–512 токенів), обмежуючи VRAM, не зайняту вагами. Зменште до 1024–2048 на обмежених хостах. `"auto"` використовує навчений максимум моделі — не рекомендовано для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 GB VRAM проти ~8.8 GB при 4096). |

    Спочатку встановіть офіційний провайдер llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, завантажується автоматично). Вихідні checkout усе ще потребують підтвердження нативної збірки: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використовуйте окрему CLI, щоб перевірити той самий шлях провайдера, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Установіть `provider: "local"` явно для локальних GGUF embeddings. Посилання на моделі `hf:` і HTTP(S) підтримуються для явних локальних конфігурацій, але вони не змінюють типового провайдера.

  </Accordion>
</AccordionGroup>

### Тайм-аут inline embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначає тайм-аут для inline пакетів embedding під час індексації пам’яті.

Якщо не задано, використовується типове значення провайдера: 600 секунд для локальних або самостійно розгорнутих провайдерів, як-от `local`, `ollama` і `lmstudio`, та 120 секунд для хостингових провайдерів. Збільшуйте це значення, коли локальні CPU-bound пакети embedding справні, але повільні.
</ParamField>

---

## Конфігурація гібридного пошуку

Усе в `memorySearch.query.hybrid`:

| Ключ                  | Тип       | Типове значення | Опис                                      |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Увімкнути гібридний пошук BM25 + векторний пошук |
| `vectorWeight`        | `number`  | `0.7`   | Вага для векторних оцінок (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Вага для оцінок BM25 (0-1)          |
| `candidateMultiplier` | `number`  | `4`     | Множник розміру пулу кандидатів     |

<Tabs>
  <Tab title="MMR (різноманітність)">
    | Ключ          | Тип       | Типове значення | Опис                                |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Увімкнути повторне ранжування MMR     |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = максимальна різноманітність, 1 = максимальна релевантність |
  </Tab>
  <Tab title="Часове згасання (актуальність)">
    | Ключ                         | Тип       | Типове значення | Опис                    |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Увімкнути підсилення актуальності |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Оцінка зменшується вдвічі кожні N днів |

    Evergreen-файли (`MEMORY.md`, файли без дат у `memory/`) ніколи не піддаються згасанню.

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

| Ключ         | Тип        | Опис                                            |
| ------------ | ---------- | ----------------------------------------------- |
| `extraPaths` | `string[]` | Додаткові каталоги або файли для індексування   |

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

Шляхи можуть бути абсолютними або відносними до робочого простору. Каталоги рекурсивно скануються на файли `.md`. Обробка символічних посилань залежить від активного бекенду: вбудований рушій ігнорує символічні посилання, тоді як QMD дотримується поведінки базового сканера QMD.

Для пошуку транскриптів між агентами в межах області агента використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові колекції мають ту саму структуру `{ path, name, pattern? }`, але об’єднуються для кожного агента та можуть зберігати явні спільні назви, коли шлях указує за межі поточного робочого простору. Якщо той самий розв’язаний шлях з’являється і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає дублікат.

---

## Мультимодальна пам’ять (Gemini)

Індексуйте зображення й аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ                      | Тип        | За замовчуванням | Опис                                   |
| ------------------------- | ---------- | ---------------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`          | Увімкнути мультимодальне індексування  |
| `multimodal.modalities`   | `string[]` | --               | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000`       | Максимальний розмір файлу для індексування |

<Note>
Застосовується лише до файлів у `extraPaths`. Корені пам’яті за замовчуванням залишаються лише для Markdown. Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш ембеддингів

| Ключ               | Тип       | За замовчуванням | Опис                                  |
| ------------------ | --------- | ---------------- | ------------------------------------- |
| `cache.enabled`    | `boolean` | `true`           | Кешувати ембеддинги фрагментів у SQLite |
| `cache.maxEntries` | `number`  | `50000`          | Максимальна кількість кешованих ембеддингів |

Запобігає повторному створенню ембеддингів для незміненого тексту під час переіндексації або оновлення транскриптів.

---

## Пакетне індексування

| Ключ                          | Тип       | За замовчуванням | Опис                                  |
| ----------------------------- | --------- | ---------------- | ------------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`              | Паралельні інлайн-ембеддинги          |
| `remote.batch.enabled`        | `boolean` | `false`          | Увімкнути API пакетних ембеддингів    |
| `remote.batch.concurrency`    | `number`  | `2`              | Паралельні пакетні завдання           |
| `remote.batch.wait`           | `boolean` | `true`           | Очікувати завершення пакета           |
| `remote.batch.pollIntervalMs` | `number`  | --               | Інтервал опитування                   |
| `remote.batch.timeoutMinutes` | `number`  | --               | Час очікування пакета                 |

Доступно для `openai`, `gemini` і `voyage`. Пакетна обробка OpenAI зазвичай найшвидша й найдешевша для великих дозаповнень.

`remote.nonBatchConcurrency` керує інлайн-викликами ембеддингів, які використовуються локальними або самостійно розгорнутими провайдерами, а також розміщеними провайдерами, коли API пакетної обробки провайдера не активні. Для непакетного індексування Ollama за замовчуванням використовує `1`, щоб не перевантажувати менші локальні хости; на більших машинах установіть вище значення.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує часом очікування для інлайн-викликів ембеддингів.

---

## Пошук у пам’яті сесій (експериментально)

Індексуйте транскрипти сесій і показуйте їх через `memory_search`:

| Ключ                          | Тип        | За замовчуванням | Опис                                             |
| ----------------------------- | ---------- | ---------------- | ------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`          | Увімкнути індексування сесій                     |
| `sources`                     | `string[]` | `["memory"]`     | Додайте `"sessions"`, щоб включити транскрипти   |
| `sync.sessions.deltaBytes`    | `number`   | `100000`         | Поріг у байтах для переіндексації                |
| `sync.sessions.deltaMessages` | `number`   | `50`             | Поріг кількості повідомлень для переіндексації   |

<Warning>
Індексування сесій вмикається явно й виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сесій зберігаються на диску, тому вважайте доступ до файлової системи межею довіри.
</Warning>

---

## Векторне прискорення SQLite (sqlite-vec)

| Ключ                         | Тип       | За замовчуванням | Опис                                  |
| ---------------------------- | --------- | ---------------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`           | Використовувати sqlite-vec для векторних запитів |
| `store.vector.extensionPath` | `string`  | bundled          | Перевизначити шлях до sqlite-vec      |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до внутрішньопроцесної косинусної подібності.

---

## Сховище індексів

Вбудовані індекси пам’яті зберігаються в SQLite-базі даних OpenClaw кожного агента за адресою
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Ключ                  | Тип      | За замовчуванням | Опис                                      |
| --------------------- | -------- | ---------------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61`      | Токенізатор FTS5 (`unicode61` або `trigram`) |

---

## Конфігурація бекенду QMD

Установіть `memory.backend = "qmd"`, щоб увімкнути. Усі налаштування QMD розміщені в `memory.qmd`:

| Ключ                     | Тип       | За замовчуванням | Опис                                                                                  |
| ------------------------ | --------- | ---------------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`            | Шлях до виконуваного файла QMD; задайте абсолютний шлях, якщо сервісний `PATH` відрізняється від вашої оболонки |
| `searchMode`             | `string`  | `search`         | Команда пошуку: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --               | Установіть `false` з `searchMode: "query"` і QMD 2.1+, щоб пропустити повторне ранжування QMD |
| `includeDefaultMemory`   | `boolean` | `true`           | Автоматично індексувати `MEMORY.md` + `memory/**/*.md`                                |
| `paths[]`                | `array`   | --               | Додаткові шляхи: `{ name, path, pattern? }`                                           |
| `sessions.enabled`       | `boolean` | `false`          | Індексувати транскрипти сеансів                                                       |
| `sessions.retentionDays` | `number`  | --               | Термін зберігання транскриптів                                                        |
| `sessions.exportDir`     | `string`  | --               | Каталог експорту                                                                      |

`searchMode: "search"` є лише лексичним/BM25. OpenClaw не виконує перевірки готовності семантичних векторів або обслуговування вбудовувань QMD для цього режиму, зокрема під час `memory status --deep`; `vsearch` і `query` і далі потребують готовності векторів QMD та вбудовувань.

`rerank: false` змінює лише режим QMD `query` і потребує QMD 2.1 або новішої версії. У прямому режимі CLI OpenClaw передає `--no-rerank`; у режимі MCP на основі mcporter він передає `rerank: false` до уніфікованого інструмента запитів QMD. Залиште не заданим, щоб використовувати стандартну поведінку повторного ранжування запитів QMD.

OpenClaw надає перевагу поточним формам колекцій QMD і MCP-запитів, але підтримує роботу старіших випусків QMD, за потреби пробуючи сумісні прапорці шаблонів колекцій і старіші назви інструментів MCP. Коли QMD оголошує підтримку кількох фільтрів колекцій, колекції з одного джерела шукаються одним процесом QMD; старіші збірки QMD зберігають сумісний шлях для кожної колекції. Одне джерело означає, що сталі колекції пам’яті групуються разом, тоді як колекції транскриптів сеансів залишаються окремою групою, щоб диверсифікація джерел усе ще мала обидва входи.

<Note>
Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо потрібно глобально перевизначити моделі QMD, задайте змінні середовища, як-от `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі виконання Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Розклад оновлення">
    | Ключ                      | Тип       | За замовчуванням | Опис                           |
    | ------------------------- | --------- | ---------------- | ------------------------------ |
    | `update.interval`         | `string`  | `5m`             | Інтервал оновлення             |
    | `update.debounceMs`       | `number`  | `15000`          | Усунення брязкоту змін файлів  |
    | `update.onBoot`           | `boolean` | `true`           | Оновлювати, коли відкривається довготривалий менеджер QMD; задайте false, щоб пропустити негайне оновлення під час запуску |
    | `update.startup`          | `string`  | `off`            | Необов’язкова ініціалізація QMD під час старту Gateway: `off`, `idle` або `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`         | Затримка перед запуском оновлення `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`          | Блокувати відкриття менеджера, доки не завершиться його початкове оновлення |
    | `update.embedInterval`    | `string`  | --               | Окрема періодичність вбудовувань |
    | `update.commandTimeoutMs` | `number`  | --               | Тайм-аут для команд QMD        |
    | `update.updateTimeoutMs`  | `number`  | --               | Тайм-аут для операцій оновлення QMD |
    | `update.embedTimeoutMs`   | `number`  | --               | Тайм-аут для операцій вбудовування QMD |
  </Accordion>
  <Accordion title="Обмеження">
    | Ключ                      | Тип      | За замовчуванням | Опис                              |
    | ------------------------- | -------- | ---------------- | --------------------------------- |
    | `limits.maxResults`       | `number` | `6`              | Максимальна кількість результатів пошуку |
    | `limits.maxSnippetChars`  | `number` | --               | Обмежити довжину фрагмента        |
    | `limits.maxInjectedChars` | `number` | --               | Обмежити загальну кількість вставлених символів |
    | `limits.timeoutMs`        | `number` | `4000`           | Тайм-аут пошуку                   |
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

    Стандартне постачене значення дозволяє прямі сеанси та сеанси каналів, але все ще забороняє групи.

    За замовчуванням — лише DM. `match.keyPrefix` зіставляється з нормалізованим ключем сеансу; `match.rawKeyPrefix` зіставляється із сирим ключем, зокрема `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитування">
    `memory.citations` застосовується до всіх бекендів:

    | Значення        | Поведінка                                           |
    | ---------------- | --------------------------------------------------- |
    | `auto` (default) | Додавати нижній колонтитул `Source: <path#line>` у фрагменти |
    | `on`             | Завжди додавати нижній колонтитул                  |
    | `off`            | Пропускати нижній колонтитул (шлях усе одно передається агенту внутрішньо) |

  </Accordion>
</AccordionGroup>

Коли ініціалізацію QMD під час старту Gateway увімкнено, OpenClaw запускає QMD лише для придатних агентів. Якщо `update.onBoot` має значення true і жодне інтервальне обслуговування/обслуговування вбудовувань не налаштовано, запуск використовує одноразовий менеджер для початкового оновлення та закриває його. Якщо налаштовано інтервал оновлення або вбудовування, запуск відкриває довготривалий менеджер QMD, щоб він міг володіти спостерігачем і таймерами інтервалів; `update.onBoot: false` пропускає лише негайне початкове оновлення.

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

Dreaming виконується як одне заплановане сканування та використовує внутрішні фази light/deep/REM як деталь реалізації.

Концептуальну поведінку та slash-команди див. у [Dreaming](/uk/concepts/dreaming).

### Налаштування користувача

| Ключ                                   | Тип       | За замовчуванням      | Опис                                                                                                                             |
| -------------------------------------- | --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`               | Повністю ввімкнути або вимкнути dreaming                                                                                         |
| `frequency`                            | `string`  | `0 3 * * *`           | Необов’язкова cron-періодичність для повного сканування dreaming                                                                 |
| `model`                                | `string`  | модель за замовчуванням | Необов’язкове перевизначення моделі підагента Dream Diary                                                                        |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`                 | Максимальна приблизна кількість токенів, що зберігаються з кожного короткострокового фрагмента пригадування, підвищеного до `MEMORY.md`; метадані походження залишаються видимими |

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
- Dreaming записує людиночитаний наративний вивід у `DREAMS.md` (або наявний `dreams.md`).
- `dreaming.model` використовує наявний шлюз довіри підагента Plugin; задайте `plugins.entries.memory-core.subagent.allowModelOverride: true`, перш ніж увімкнути його.
- Dream Diary повторює спробу один раз із моделлю сеансу за замовчуванням, коли налаштована модель недоступна. Помилки довіри або списку дозволених реєструються в журналі й не повторюються без повідомлення.
- Політика та пороги фаз light/deep/REM є внутрішньою поведінкою, а не користувацькою конфігурацією.

</Note>

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Огляд пам’яті](/uk/concepts/memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
