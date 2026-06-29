---
read_when:
    - Ви хочете налаштувати провайдерів пошуку в пам’яті або моделі вбудовувань
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часове згасання
    - Ви хочете ввімкнути індексування мультимодальної пам’яті
sidebarTitle: Memory config
summary: Усі параметри конфігурації для пошуку в пам’яті, постачальників вбудовувань, QMD, гібридного пошуку та мультимодального індексування
title: Довідник із налаштування пам’яті
x-i18n:
    generated_at: "2026-06-28T22:33:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de7d1c23cd415293001ef59ae2572cd7bfe9a88c70c1e4cf138ee60664ff0ac2
    source_path: reference/memory-config.md
    workflow: 16
---

Ця сторінка перелічує всі параметри конфігурації для пошуку в пам’яті OpenClaw. Концептуальні огляди дивіться тут:

<CardGroup cols={2}>
  <Card title="Огляд пам’яті" href="/uk/concepts/memory">
    Як працює пам’ять.
  </Card>
  <Card title="Вбудований рушій" href="/uk/concepts/memory-builtin">
    Типовий бекенд SQLite.
  </Card>
  <Card title="Рушій QMD" href="/uk/concepts/memory-qmd">
    Локальний насамперед sidecar.
  </Card>
  <Card title="Пошук у пам’яті" href="/uk/concepts/memory-search">
    Конвеєр пошуку та налаштування.
  </Card>
  <Card title="Active memory" href="/uk/concepts/active-memory">
    Під-агент пам’яті для інтерактивних сеансів.
  </Card>
</CardGroup>

Усі налаштування пошуку в пам’яті розташовані в `agents.defaults.memorySearch` у `openclaw.json`, якщо не зазначено інше.

<Note>
Якщо ви шукаєте перемикач функції **active memory** і конфігурацію під-агента, вони розташовані в `plugins.entries.active-memory`, а не в `memorySearch`.

Active memory використовує модель із двома шлюзами:

1. plugin має бути увімкнений і націлений на поточний ідентифікатор агента
2. запит має бути придатним інтерактивним постійним сеансом чату

Дивіться [Active Memory](/uk/concepts/active-memory), щоб дізнатися про модель активації, конфігурацію, що належить plugin, збереження стенограми та шаблон безпечного розгортання.
</Note>

---

## Вибір провайдера

| Ключ       | Тип       | Типове значення | Опис                                                                                                                                                                                                                                                                                       |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider` | `string`  | `"openai"`       | Ідентифікатор адаптера embeddings, як-от `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` або `voyage`; також може бути налаштованим `models.providers.<id>`, чий `api` вказує на адаптер memory embeddings або OpenAI-сумісний API моделі |
| `model`    | `string`  | типове для провайдера | Назва моделі embeddings                                                                                                                                                                                                                                                                    |
| `fallback` | `string`  | `"none"`         | Ідентифікатор резервного адаптера, коли основний не спрацьовує                                                                                                                                                                                                                             |
| `enabled`  | `boolean` | `true`           | Увімкнути або вимкнути пошук у пам’яті                                                                                                                                                                                                                                                     |

Коли `provider` не задано, OpenClaw використовує embeddings OpenAI. Задайте `provider`
явно, щоб використовувати Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, локальну модель GGUF або OpenAI-сумісну кінцеву точку `/v1/embeddings`.
Застарілі конфігурації, у яких досі вказано `provider: "auto"`, розв’язуються як `openai`.

<Warning>
Зміна провайдера embeddings, моделі, налаштувань провайдера, джерел, області дії,
розбиття на фрагменти або токенізатора може зробити наявний векторний індекс SQLite несумісним.
OpenClaw призупиняє векторний пошук і повідомляє попередження про ідентичність індексу замість того,
щоб автоматично переіндексувати все з embeddings. Перебудуйте, коли будете готові, за допомогою
`openclaw memory status --index --agent <id>` або
`openclaw memory index --force --agent <id>`.
</Warning>

Коли `provider` не задано, присутній застарілий `provider: "auto"` або
`provider: "none"` навмисно вибирає режим лише FTS, пригадування з пам’яті все одно може
використовувати лексичне ранжування FTS, коли embeddings недоступні.

Явні нелокальні провайдери завершуються закрито. Якщо ви задаєте `memorySearch.provider` як
конкретного провайдера з віддаленою підтримкою, наприклад OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio або OpenAI-сумісного
власного провайдера, і цей провайдер недоступний під час виконання, `memory_search`
повертає результат недоступності замість тихого використання пригадування лише FTS. Виправте
конфігурацію провайдера/автентифікації, перейдіть на доступного провайдера або задайте
`provider: "none"`, якщо хочете навмисне пригадування лише FTS.

### Власні ідентифікатори провайдерів

`memorySearch.provider` може вказувати на власний запис `models.providers.<id>` для memory-specific provider adapters, як-от `ollama`, або для OpenAI-сумісних API моделей, як-от `openai-responses` / `openai-completions`. OpenClaw розв’язує власника `api` цього провайдера для адаптера embeddings, зберігаючи власний ідентифікатор провайдера для обробки кінцевої точки, автентифікації та префіксів моделей. Це дає змогу конфігураціям із кількома GPU або кількома хостами виділяти memory embeddings для конкретної локальної кінцевої точки:

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

### Розв’язання ключа API

Віддалені embeddings потребують ключа API. Bedrock натомість використовує типовий ланцюжок облікових даних AWS SDK (ролі екземплярів, SSO, ключі доступу).

| Провайдер      | Змінна середовища                                | Ключ конфігурації                 |
| -------------- | ------------------------------------------------ | --------------------------------- |
| Bedrock        | Ланцюжок облікових даних AWS                    | Ключ API не потрібен              |
| DeepInfra      | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профіль автентифікації через вхід із пристрою |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                    | --                                |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`  |

<Note>
Codex OAuth охоплює лише чат/completions і не задовольняє запити embeddings.
</Note>

---

## Конфігурація віддаленої кінцевої точки

Використовуйте `provider: "openai-compatible"` для загального OpenAI-сумісного
сервера `/v1/embeddings`, який не має успадковувати глобальні облікові дані чату OpenAI.

<ParamField path="remote.baseUrl" type="string">
  Власний базовий URL API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Перевизначити ключ API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Додаткові HTTP-заголовки (об’єднуються з типовими значеннями провайдера).
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
    | Ключ                   | Тип      | Типове значення        | Опис                                      |
    | ---------------------- | -------- | ---------------------- | ---------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Для Embedding 2: 768, 1536 або 3072      |

    <Warning>
    Зміна моделі або `outputDimensionality` змінює ідентичність індексу. OpenClaw
    призупиняє векторний пошук, доки ви явно не перебудуєте індекс пам’яті.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-сумісні типи введення">
    OpenAI-сумісні кінцеві точки embeddings можуть увімкнути специфічні для провайдера поля запиту `input_type`. Це корисно для асиметричних моделей embeddings, які потребують різних міток для embeddings запиту й документа.

    | Ключ                | Тип      | Типове значення | Опис                                             |
    | ------------------- | -------- | --------------- | ------------------------------------------------ |
    | `inputType`         | `string` | не задано       | Спільний `input_type` для embeddings запиту й документа |
    | `queryInputType`    | `string` | не задано       | `input_type` під час запиту; перевизначає `inputType` |
    | `documentInputType` | `string` | не задано       | `input_type` індексу/документа; перевизначає `inputType` |

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

    Зміна цих значень впливає на ідентичність кешу embeddings для пакетного індексування провайдера, і після неї слід переіндексувати пам’ять, коли upstream-модель по-різному обробляє мітки.

  </Accordion>
  <Accordion title="Bedrock">
    ### Конфігурація embeddings Bedrock

    Bedrock використовує типовий ланцюжок облікових даних AWS SDK — ключі API не потрібні. Якщо OpenClaw працює на EC2 з роллю екземпляра, для якої ввімкнено Bedrock, просто задайте провайдера й модель:

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

    | Ключ                   | Тип      | Типове значення              | Опис                           |
    | ---------------------- | -------- | ---------------------------- | ------------------------------ |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ідентифікатор моделі embeddings Bedrock |
    | `outputDimensionality` | `number` | типове для моделі            | Для Titan V2: 256, 512 або 1024 |

    **Підтримувані моделі** (з визначенням сімейства та типовими розмірностями):

    | ID моделі                                  | Постачальник | Типова розмірність | Налаштовувана розмірність |
    | ------------------------------------------ | ------------ | ------------------ | ------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon       | 1024               | 256, 512, 1024            |
    | `amazon.titan-embed-text-v1`               | Amazon       | 1536               | --                        |
    | `amazon.titan-embed-g1-text-02`            | Amazon       | 1536               | --                        |
    | `amazon.titan-embed-image-v1`              | Amazon       | 1024               | --                        |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon       | 1024               | 256, 384, 1024, 3072      |
    | `cohere.embed-english-v3`                  | Cohere       | 1024               | --                        |
    | `cohere.embed-multilingual-v3`             | Cohere       | 1024               | --                        |
    | `cohere.embed-v4:0`                        | Cohere       | 1536               | 256-1536                  |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs   | 512                | --                        |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs   | 1024               | --                        |

    Варіанти із суфіксом пропускної здатності (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують конфігурацію базової моделі.

    **Автентифікація:** автентифікація Bedrock використовує стандартний порядок визначення облікових даних AWS SDK:

    1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Кеш токенів SSO
    3. Облікові дані токена веб-ідентичності
    4. Спільні файли облікових даних і конфігурації
    5. Облікові дані метаданих ECS або EC2

    Регіон визначається з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` постачальника `amazon-bedrock` або за замовчуванням має значення `us-east-1`.

    **Дозволи IAM:** ролі або користувачу IAM потрібні:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Для мінімальних привілеїв обмежте область `InvokeModel` конкретною моделлю:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Ключ                  | Тип                | Типове значення               | Опис                                                                                                                                                                                                                                                                                                                                                  |
    | --------------------- | ------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | автоматично завантажується    | Шлях до файлу моделі GGUF                                                                                                                                                                                                                                                                                                                             |
    | `local.modelCacheDir` | `string`           | типове значення node-llama-cpp | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                                                                 |
    | `local.contextSize`   | `number \| "auto"` | `4096`                        | Розмір контекстного вікна для контексту embedding. 4096 покриває типові фрагменти (128–512 токенів), обмежуючи VRAM, не зайняту вагами. Зменште до 1024–2048 на хостах з обмеженими ресурсами. `"auto"` використовує навчений максимум моделі — не рекомендовано для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 ГБ VRAM проти ~8,8 ГБ при 4096). |

    Спершу встановіть офіційного постачальника llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 ГБ, автоматично завантажується). Вихідні checkout-и все ще потребують схвалення нативного складання: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використовуйте автономний CLI, щоб перевірити той самий шлях постачальника, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Явно задайте `provider: "local"` для локальних GGUF embeddings. Посилання на моделі `hf:` і HTTP(S) підтримуються для явних локальних конфігурацій, але вони не змінюють типового постачальника.

  </Accordion>
</AccordionGroup>

### Тайм-аут inline embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначає тайм-аут для inline-пакетів embedding під час індексування пам’яті.

Якщо не задано, використовується типове значення постачальника: 600 секунд для локальних/самостійно розміщених постачальників, як-от `local`, `ollama` і `lmstudio`, та 120 секунд для розміщених постачальників. Збільште це значення, коли локальні CPU-bound пакети embedding працюють справно, але повільно.
</ParamField>

---

## Конфігурація гібридного пошуку

Усе в `memorySearch.query.hybrid`:

| Ключ                  | Тип       | Типове значення | Опис                                      |
| --------------------- | --------- | --------------- | ----------------------------------------- |
| `enabled`             | `boolean` | `true`          | Увімкнути гібридний пошук BM25 + векторний |
| `vectorWeight`        | `number`  | `0.7`           | Вага для векторних оцінок (0-1)           |
| `textWeight`          | `number`  | `0.3`           | Вага для оцінок BM25 (0-1)                |
| `candidateMultiplier` | `number`  | `4`             | Множник розміру пулу кандидатів           |

<Tabs>
  <Tab title="MMR (diversity)">
    | Ключ          | Тип       | Типове значення | Опис                                             |
    | ------------- | --------- | --------------- | ------------------------------------------------ |
    | `mmr.enabled` | `boolean` | `false`         | Увімкнути повторне ранжування MMR                |
    | `mmr.lambda`  | `number`  | `0.7`           | 0 = максимальна різноманітність, 1 = максимальна релевантність |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | Ключ                         | Тип       | Типове значення | Опис                                  |
    | ---------------------------- | --------- | --------------- | ------------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`         | Увімкнути підсилення за новизною      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`            | Оцінка зменшується вдвічі кожні N днів |

    Вічнозелені файли (`MEMORY.md`, файли без дат у `memory/`) ніколи не знецінюються.

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

| Ключ         | Тип        | Опис                                           |
| ------------ | ---------- | ---------------------------------------------- |
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

Шляхи можуть бути абсолютними або відносними до робочого простору. Каталоги рекурсивно скануються на файли `.md`. Обробка симлінків залежить від активного бекенда: вбудований рушій ігнорує симлінки, а QMD дотримується поведінки базового сканера QMD.

Для пошуку транскриптів між агентами в межах агента використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові колекції мають ту саму форму `{ path, name, pattern? }`, але об’єднуються для кожного агента й можуть зберігати явні спільні назви, коли шлях вказує за межі поточного робочого простору. Якщо той самий розв’язаний шлях з’являється і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає дублікат.

---

## Мультимодальна пам’ять (Gemini)

Індексуйте зображення та аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ                      | Тип        | Типово     | Опис                                   |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Увімкнути мультимодальне індексування  |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Максимальний розмір файлу для індексу  |

<Note>
Застосовується лише до файлів у `extraPaths`. Типові корені пам’яті залишаються лише для Markdown. Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш embedding

| Ключ               | Тип       | Типово  | Опис                             |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | Кешувати embedding чанків у SQLite |
| `cache.maxEntries` | `number`  | `50000` | Максимум кешованих embedding     |

Запобігає повторному embedding незміненого тексту під час повторного індексування або оновлень транскриптів.

---

## Пакетне індексування

| Ключ                          | Тип       | Типово  | Опис                              |
| ----------------------------- | --------- | ------- | --------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Паралельні inline embedding       |
| `remote.batch.enabled`        | `boolean` | `false` | Увімкнути API пакетного embedding |
| `remote.batch.concurrency`    | `number`  | `2`     | Паралельні пакетні завдання       |
| `remote.batch.wait`           | `boolean` | `true`  | Чекати завершення пакета          |
| `remote.batch.pollIntervalMs` | `number`  | --      | Інтервал опитування               |
| `remote.batch.timeoutMinutes` | `number`  | --      | Тайм-аут пакета                   |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай найшвидший і найдешевший для великих зворотних заповнень.

`remote.nonBatchConcurrency` керує inline-викликами embedding, які використовують локальні/самостійно розміщені провайдери та хостингові провайдери, коли пакетні API провайдера не активні. Для непакетного індексування Ollama типово використовує `1`, щоб не перевантажувати менші локальні хости; встановіть більше значення на більших машинах.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує тайм-аутом для inline-викликів embedding.

---

## Пошук у пам’яті сесій (експериментально)

Індексуйте транскрипти сесій і показуйте їх через `memory_search`:

| Ключ                          | Тип        | Типово       | Опис                                           |
| ----------------------------- | ---------- | ------------ | ---------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Увімкнути індексування сесій                   |
| `sources`                     | `string[]` | `["memory"]` | Додайте `"sessions"`, щоб включити транскрипти |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Порогове значення байтів для повторного індексу |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Порогове значення повідомлень для повторного індексу |

<Warning>
Індексування сесій є опціональним і виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сесій зберігаються на диску, тому вважайте доступ до файлової системи межею довіри.
</Warning>

Збіги в транскриптах сеансів також підпорядковуються
[`tools.sessions.visibility`](/uk/gateway/config-tools#toolssessions). Типова видимість
`tree` відкриває лише поточний сеанс і сеанси, які він породив. Щоб
пригадати непов’язаний сеанс того самого агента, надісланий через Gateway, з іншого
сеансу, наприклад приватного повідомлення, навмисно розширте видимість до `agent` (або до `all` лише
коли також потрібне пригадування між агентами й політика взаємодії агентів це дозволяє).

Наведені нижче приклади розміщують ці налаштування в `agents.defaults`. Ви також можете
застосувати еквівалентні налаштування `memorySearch` у перевизначенні для окремого агента, коли лише один
агент має індексувати й шукати транскрипти сеансів.

Для пригадування з Gateway до приватного повідомлення для того самого агента:

<Tabs>
  <Tab title="Вбудований бекенд">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="Бекенд QMD">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

Під час використання QMD `agents.defaults.memorySearch.experimental.sessionMemory` і
`sources: ["sessions"]` самі по собі не експортують транскрипти в QMD. Також установіть
`memory.qmd.sessions.enabled: true`.

---

## Прискорення векторів SQLite (sqlite-vec)

| Ключ                         | Тип       | Типове значення | Опис                                  |
| ---------------------------- | --------- | --------------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`          | Використовувати sqlite-vec для векторних запитів |
| `store.vector.extensionPath` | `string`  | у комплекті     | Перевизначити шлях sqlite-vec         |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до обчислення косинусної подібності всередині процесу.

---

## Сховище індексів

Вбудовані індекси пам’яті зберігаються в SQLite-базі даних OpenClaw кожного агента за шляхом
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Ключ                  | Тип      | Типове значення | Опис                                      |
| --------------------- | -------- | --------------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61`     | Токенізатор FTS5 (`unicode61` або `trigram`) |

---

## Конфігурація бекенда QMD

Установіть `memory.backend = "qmd"`, щоб увімкнути. Усі налаштування QMD розміщуються в `memory.qmd`:

| Ключ                     | Тип       | Типове значення | Опис                                                                                  |
| ------------------------ | --------- | --------------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`           | Шлях до виконуваного файла QMD; задайте абсолютний шлях, коли `PATH` сервісу відрізняється від вашої оболонки |
| `searchMode`             | `string`  | `search`        | Команда пошуку: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --              | Установіть `false` з `searchMode: "query"` і QMD 2.1+, щоб пропустити повторне ранжування QMD |
| `includeDefaultMemory`   | `boolean` | `true`          | Автоматично індексувати `MEMORY.md` + `memory/**/*.md`                                |
| `paths[]`                | `array`   | --              | Додаткові шляхи: `{ name, path, pattern? }`                                           |
| `sessions.enabled`       | `boolean` | `false`         | Експортувати транскрипти сеансів у QMD                                                |
| `sessions.retentionDays` | `number`  | --              | Термін зберігання транскриптів                                                        |
| `sessions.exportDir`     | `string`  | --              | Каталог експорту                                                                       |

`searchMode: "search"` є лише лексичним/BM25. OpenClaw не запускає перевірки готовності семантичних векторів або обслуговування вбудовувань QMD для цього режиму, зокрема під час `memory status --deep`; `vsearch` і `query` надалі потребують готовності векторів і вбудовувань QMD.

`rerank: false` змінює лише режим QMD `query` і потребує QMD 2.1 або новішої версії. У прямому режимі CLI OpenClaw передає `--no-rerank`; у режимі MCP на базі mcporter він передає `rerank: false` до уніфікованого інструмента запитів QMD. Залиште це незаданим, щоб використовувати типову поведінку повторного ранжування запитів QMD.

OpenClaw віддає перевагу поточним формам колекцій QMD і запитів MCP, але зберігає роботу зі старішими випусками QMD, за потреби пробуючи сумісні прапорці шаблонів колекцій і старіші назви інструментів MCP. Коли QMD оголошує підтримку кількох фільтрів колекцій, колекції з того самого джерела шукаються одним процесом QMD; старіші збірки QMD зберігають сумісний шлях для кожної колекції. Те саме джерело означає, що сталі колекції пам’яті групуються разом, тоді як колекції транскриптів сеансів залишаються окремою групою, щоб диверсифікація джерел усе ще мала обидва входи.

<Note>
Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо потрібно глобально перевизначити моделі QMD, задайте змінні середовища, як-от `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі виконання Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Графік оновлень">
    | Ключ                      | Тип       | Типове значення | Опис                                  |
    | ------------------------- | --------- | --------------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`            | Інтервал оновлення                    |
    | `update.debounceMs`       | `number`  | `15000`         | Debounce змін файлів                  |
    | `update.onBoot`           | `boolean` | `true`          | Оновлювати, коли відкривається довготривалий менеджер QMD; задайте false, щоб пропустити негайне оновлення під час завантаження |
    | `update.startup`          | `string`  | `off`           | Необов’язкова ініціалізація QMD під час запуску Gateway: `off`, `idle` або `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`        | Затримка перед запуском оновлення `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`         | Блокувати відкриття менеджера, доки не завершиться його початкове оновлення |
    | `update.embedInterval`    | `string`  | --              | Окрема частота embed                  |
    | `update.commandTimeoutMs` | `number`  | --              | Таймаут для команд QMD                |
    | `update.updateTimeoutMs`  | `number`  | --              | Таймаут для операцій оновлення QMD    |
    | `update.embedTimeoutMs`   | `number`  | --              | Таймаут для операцій embed QMD        |
  </Accordion>
  <Accordion title="Ліміти">
    | Ключ                      | Тип      | Типове значення | Опис                         |
    | ------------------------- | -------- | --------------- | ---------------------------- |
    | `limits.maxResults`       | `number` | `6`             | Максимум результатів пошуку  |
    | `limits.maxSnippetChars`  | `number` | --              | Обмежити довжину фрагмента   |
    | `limits.maxInjectedChars` | `number` | --              | Обмежити загальну кількість вставлених символів |
    | `limits.timeoutMs`        | `number` | `4000`          | Таймаут пошуку               |
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

    Типове значення, що постачається, дозволяє прямі та канальні сеанси, водночас усе ще забороняючи групи.

    Типове значення — лише DM. `match.keyPrefix` зіставляється з нормалізованим ключем сеансу; `match.rawKeyPrefix` зіставляється з сирим ключем, включно з `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитування">
    `memory.citations` застосовується до всіх бекендів:

    | Значення        | Поведінка                                           |
    | ---------------- | --------------------------------------------------- |
    | `auto` (типово)  | Додавати футер `Source: <path#line>` у фрагменти    |
    | `on`             | Завжди додавати футер                               |
    | `off`            | Не додавати футер (шлях усе одно передається агенту внутрішньо) |

  </Accordion>
</AccordionGroup>

Коли ініціалізацію QMD під час запуску Gateway увімкнено, OpenClaw запускає QMD лише для придатних агентів. Якщо `update.onBoot` має значення true і не налаштовано обслуговування за інтервалом/embed, запуск використовує одноразовий менеджер для оновлення під час завантаження та закриває його. Якщо налаштовано інтервал оновлення або embed, запуск відкриває довготривалий менеджер QMD, щоб він міг володіти watcher і таймерами інтервалів; `update.onBoot: false` пропускає лише негайне оновлення під час завантаження.

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

| Ключ                                   | Тип       | Типове значення | Опис                                                                                                                             |
| -------------------------------------- | --------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`         | Повністю ввімкнути або вимкнути Dreaming                                                                                         |
| `frequency`                            | `string`  | `0 3 * * *`     | Необов’язкова cadence Cron для повного проходу Dreaming                                                                          |
| `model`                                | `string`  | типова модель   | Необов’язкове перевизначення моделі субагента Dream Diary                                                                        |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`           | Максимальна оцінена кількість токенів, що зберігаються з кожного короткотермінового фрагмента recall, просунутого в `MEMORY.md`; метадані походження залишаються видимими |

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
- Dreaming записує зручний для читання наративний вивід у `DREAMS.md` (або наявний `dreams.md`).
- `dreaming.model` використовує наявний gate довіри субагента Plugin; задайте `plugins.entries.memory-core.subagent.allowModelOverride: true` перед увімкненням.
- Dream Diary повторює спробу один раз із типовою моделлю сеансу, коли налаштована модель недоступна. Помилки довіри або allowlist записуються в журнал і не повторюються мовчки.
- Політика фаз light/deep/REM і порогові значення є внутрішньою поведінкою, а не користувацькою конфігурацією.

</Note>

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Огляд пам’яті](/uk/concepts/memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
