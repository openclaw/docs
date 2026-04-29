---
read_when:
    - Ви хочете налаштувати постачальників пошуку в пам’яті або моделі вбудовувань
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часове згасання
    - Ви хочете увімкнути індексацію мультимодальної пам’яті
sidebarTitle: Memory config
summary: Усі параметри конфігурації для пошуку в пам’яті, постачальників ембедингів, QMD, гібридного пошуку та мультимодального індексування
title: Довідник із конфігурації пам’яті
x-i18n:
    generated_at: "2026-04-29T07:52:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

На цій сторінці перелічено всі параметри конфігурації для пошуку памʼяті OpenClaw. Концептуальні огляди див.:

<CardGroup cols={2}>
  <Card title="Огляд памʼяті" href="/uk/concepts/memory">
    Як працює памʼять.
  </Card>
  <Card title="Вбудований рушій" href="/uk/concepts/memory-builtin">
    Типовий бекенд SQLite.
  </Card>
  <Card title="Рушій QMD" href="/uk/concepts/memory-qmd">
    Локальний sidecar.
  </Card>
  <Card title="Пошук памʼяті" href="/uk/concepts/memory-search">
    Конвеєр пошуку та налаштування.
  </Card>
  <Card title="Active Memory" href="/uk/concepts/active-memory">
    Під-агент памʼяті для інтерактивних сеансів.
  </Card>
</CardGroup>

Усі налаштування пошуку памʼяті розташовані в `agents.defaults.memorySearch` у `openclaw.json`, якщо не зазначено інше.

<Note>
Якщо ви шукаєте перемикач функції **active memory** і конфігурацію під-агента, вони розташовані в `plugins.entries.active-memory`, а не в `memorySearch`.

Active memory використовує модель із двома шлюзами:

1. plugin має бути ввімкнений і націлений на ідентифікатор поточного агента
2. запит має бути придатним інтерактивним постійним сеансом чату

Див. [Active Memory](/uk/concepts/active-memory), щоб дізнатися про модель активації, конфігурацію, що належить plugin, збереження транскрипту та безпечний шаблон розгортання.
</Note>

---

## Вибір провайдера

| Ключ       | Тип       | Типове значення         | Опис                                                                                                                                                                                                                                         |
| ---------- | --------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | автовизначення          | ID адаптера ембедингів, як-от `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` або `voyage`; також може бути налаштований `models.providers.<id>`, чий `api` вказує на один із цих адаптерів |
| `model`    | `string`  | типове для провайдера   | Назва моделі ембедингів                                                                                                                                                                                                                     |
| `fallback` | `string`  | `"none"`                | ID резервного адаптера, коли основний зазнає помилки                                                                                                                                                                                        |
| `enabled`  | `boolean` | `true`                  | Увімкнути або вимкнути пошук памʼяті                                                                                                                                                                                                        |

### Порядок автовизначення

Коли `provider` не задано, OpenClaw вибирає перший доступний:

<Steps>
  <Step title="local">
    Вибирається, якщо `memorySearch.local.modelPath` налаштовано й файл існує.
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
    Вибирається, якщо ланцюжок облікових даних AWS SDK успішно визначається (роль інстансу, ключі доступу, профіль, SSO, веб-ідентичність або спільна конфігурація).
  </Step>
</Steps>

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Користувацькі ID провайдерів

`memorySearch.provider` може вказувати на користувацький запис `models.providers.<id>`. OpenClaw визначає власника `api` цього провайдера для адаптера ембедингів, зберігаючи користувацький ID провайдера для обробки endpoint, автентифікації та префікса моделі. Це дає змогу конфігураціям із кількома GPU або кількома хостами виділити ембединги памʼяті для конкретного локального endpoint:

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

### Визначення ключа API

Віддалені ембединги потребують ключа API. Натомість Bedrock використовує стандартний ланцюжок облікових даних AWS SDK (ролі інстансів, SSO, ключі доступу).

| Провайдер      | Змінна середовища                                | Ключ конфігурації                 |
| -------------- | ------------------------------------------------ | --------------------------------- |
| Bedrock        | ланцюжок облікових даних AWS                    | Ключ API не потрібен              |
| DeepInfra      | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профіль автентифікації через вхід із пристрою |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                    | --                                |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`  |

<Note>
Codex OAuth покриває лише чат/автодоповнення й не задовольняє запити ембедингів.
</Note>

---

## Конфігурація віддаленого endpoint

Для користувацьких OpenAI-сумісних endpoint або перевизначення типових значень провайдера:

<ParamField path="remote.baseUrl" type="string">
  Користувацька базова URL-адреса API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Перевизначити ключ API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Додаткові HTTP-заголовки (обʼєднуються з типовими значеннями провайдера).
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
    | Ключ                   | Тип      | Типове значення        | Опис                                       |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Для Embedding 2: 768, 1536 або 3072       |

    <Warning>
    Зміна моделі або `outputDimensionality` запускає автоматичне повне переіндексування.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-сумісні типи введення">
    OpenAI-сумісні endpoint ембедингів можуть увімкнути специфічні для провайдера поля запиту `input_type`. Це корисно для асиметричних моделей ембедингів, які потребують різних міток для ембедингів запитів і документів.

    | Ключ                | Тип      | Типове значення | Опис                                                        |
    | ------------------- | -------- | --------------- | ----------------------------------------------------------- |
    | `inputType`         | `string` | не задано       | Спільний `input_type` для ембедингів запитів і документів   |
    | `queryInputType`    | `string` | не задано       | `input_type` під час запиту; перевизначає `inputType`       |
    | `documentInputType` | `string` | не задано       | `input_type` індексу/документа; перевизначає `inputType`    |

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

    Зміна цих значень впливає на ідентичність кешу ембедингів для пакетного індексування провайдера, і після неї слід переіндексувати памʼять, коли upstream-модель обробляє мітки по-різному.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock використовує стандартний ланцюжок облікових даних AWS SDK — ключі API не потрібні. Якщо OpenClaw працює на EC2 з роллю інстансу, для якої ввімкнено Bedrock, просто задайте провайдера й модель:

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

    | Ключ                   | Тип      | Типове значення               | Опис                            |
    | ---------------------- | -------- | ----------------------------- | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ID моделі ембедингів Bedrock |
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
    3. Облікові дані токена веб-ідентичності
    4. Спільні файли облікових даних і конфігурації
    5. Облікові дані метаданих ECS або EC2

    Регіон визначається з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` провайдера `amazon-bedrock` або за замовчуванням має значення `us-east-1`.

    **Дозволи IAM:** ролі або користувачу IAM потрібні:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Для принципу найменших привілеїв обмежте область `InvokeModel` конкретною моделлю:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Локально (GGUF + node-llama-cpp)">
    | Ключ                  | Тип                | Типове значення        | Опис                                                                                                                                                                                                                                                                                                                |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | автоматично завантажується | Шлях до файлу моделі GGUF                                                                                                                                                                                                                                                                                          |
    | `local.modelCacheDir` | `string`           | типове для node-llama-cpp | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                              |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Розмір контекстного вікна для контексту embedding. 4096 покриває типові фрагменти (128–512 токенів), обмежуючи VRAM не для ваг. Зменште до 1024–2048 на обмежених хостах. `"auto"` використовує навчений максимум моделі — не рекомендовано для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 ГБ VRAM проти ~8,8 ГБ за 4096). |

    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 ГБ, автоматично завантажується). Потребує нативного складання: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використайте автономний CLI, щоб перевірити той самий шлях провайдера, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Якщо `provider` має значення `auto`, `local` вибирається лише тоді, коли `local.modelPath` указує на наявний локальний файл. Посилання на моделі `hf:` і HTTP(S) усе ще можна явно використовувати з `provider: "local"`, але вони не змушують `auto` вибрати локальний провайдер до того, як модель стане доступною на диску.

  </Accordion>
</AccordionGroup>

### Тайм-аут inline embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначає тайм-аут для пакетів inline embedding під час індексування пам’яті.

Якщо не задано, використовується типове значення провайдера: 600 секунд для локальних/self-hosted провайдерів, як-от `local`, `ollama` і `lmstudio`, та 120 секунд для hosted провайдерів. Збільште це значення, коли локальні CPU-bound пакети embedding працюють справно, але повільно.
</ParamField>

---

## Конфігурація гібридного пошуку

Усе в `memorySearch.query.hybrid`:

| Ключ                  | Тип       | Типове значення | Опис                                  |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Увімкнути гібридний пошук BM25 + векторний пошук |
| `vectorWeight`        | `number`  | `0.7`   | Вага для векторних оцінок (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Вага для оцінок BM25 (0-1)          |
| `candidateMultiplier` | `number`  | `4`     | Множник розміру пулу кандидатів     |

<Tabs>
  <Tab title="MMR (різноманітність)">
    | Ключ          | Тип       | Типове значення | Опис                                 |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Увімкнути повторне ранжування MMR    |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = максимальна різноманітність, 1 = максимальна релевантність |
  </Tab>
  <Tab title="Часове згасання (свіжість)">
    | Ключ                         | Тип       | Типове значення | Опис                         |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Увімкнути підсилення свіжості |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Оцінка зменшується вдвічі кожні N днів |

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

## Додаткові шляхи пам’яті

| Ключ         | Тип        | Опис                                      |
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

Шляхи можуть бути абсолютними або відносними до робочої області. Каталоги рекурсивно скануються на файли `.md`. Обробка симлінків залежить від активного backend: вбудований рушій ігнорує симлінки, тоді як QMD дотримується поведінки базового сканера QMD.

Для scoped-to-agent пошуку transcript між агентами використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові колекції мають ту саму форму `{ path, name, pattern? }`, але об’єднуються для кожного агента й можуть зберігати явні спільні назви, коли шлях указує за межі поточної робочої області. Якщо той самий resolved path з’являється і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає дублікат.

---

## Мультимодальна пам’ять (Gemini)

Індексуйте зображення та аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ                      | Тип        | Типове значення | Опис                                  |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Увімкнути мультимодальне індексування  |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Максимальний розмір файлу для індексування |

<Note>
Застосовується лише до файлів у `extraPaths`. Корені пам’яті за замовчуванням лишаються тільки Markdown. Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш ембедингів

| Ключ               | Тип       | За замовчуванням | Опис                               |
| ------------------ | --------- | ---------------- | ---------------------------------- |
| `cache.enabled`    | `boolean` | `false`          | Кешувати ембединги фрагментів у SQLite |
| `cache.maxEntries` | `number`  | `50000`          | Максимальна кількість кешованих ембедингів |

Запобігає повторному створенню ембедингів для незміненого тексту під час переіндексації або оновлень транскриптів.

---

## Пакетне індексування

| Ключ                          | Тип       | За замовчуванням | Опис                         |
| ----------------------------- | --------- | ---------------- | ---------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`              | Паралельні inline-ембединги  |
| `remote.batch.enabled`        | `boolean` | `false`          | Увімкнути API пакетних ембедингів |
| `remote.batch.concurrency`    | `number`  | `2`              | Паралельні пакетні завдання  |
| `remote.batch.wait`           | `boolean` | `true`           | Чекати завершення пакета     |
| `remote.batch.pollIntervalMs` | `number`  | --               | Інтервал опитування          |
| `remote.batch.timeoutMinutes` | `number`  | --               | Тайм-аут пакета              |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай найшвидший і найдешевший для великих ретроспективних заповнень.

`remote.nonBatchConcurrency` керує inline-викликами ембедингів, які використовують локальні/self-hosted провайдери та хостингові провайдери, коли пакетні API провайдера не активні. Ollama за замовчуванням використовує `1` для непакетного індексування, щоб не перевантажувати менші локальні хости; встановіть вище значення на потужніших машинах.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує тайм-аутом для inline-викликів ембедингів.

---

## Пошук у пам’яті сеансів (експериментально)

Індексуйте транскрипти сеансів і надавайте їх через `memory_search`:

| Ключ                          | Тип        | За замовчуванням | Опис                                      |
| ----------------------------- | ---------- | ---------------- | ----------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`          | Увімкнути індексування сеансів            |
| `sources`                     | `string[]` | `["memory"]`     | Додайте `"sessions"`, щоб включити транскрипти |
| `sync.sessions.deltaBytes`    | `number`   | `100000`         | Поріг у байтах для переіндексації         |
| `sync.sessions.deltaMessages` | `number`   | `50`             | Поріг у повідомленнях для переіндексації  |

<Warning>
Індексування сеансів вмикається явно й виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сеансів зберігаються на диску, тому вважайте доступ до файлової системи межею довіри.
</Warning>

---

## Векторне прискорення SQLite (sqlite-vec)

| Ключ                         | Тип       | За замовчуванням | Опис                                  |
| ---------------------------- | --------- | ---------------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`           | Використовувати sqlite-vec для векторних запитів |
| `store.vector.extensionPath` | `string`  | bundled          | Перевизначити шлях sqlite-vec         |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до косинусної подібності в процесі.

---

## Сховище індексу

| Ключ                  | Тип      | За замовчуванням                     | Опис                                         |
| --------------------- | -------- | ------------------------------------ | -------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | Токенізатор FTS5 (`unicode61` або `trigram`) |

---

## Конфігурація бекенда QMD

Установіть `memory.backend = "qmd"`, щоб увімкнути. Усі налаштування QMD розташовані в `memory.qmd`:

| Ключ                     | Тип       | За замовчуванням | Опис                                                                                 |
| ------------------------ | --------- | ---------------- | ------------------------------------------------------------------------------------ |
| `command`                | `string`  | `qmd`            | Шлях до виконуваного файлу QMD; задайте абсолютний шлях, коли `PATH` сервісу відрізняється від вашого shell |
| `searchMode`             | `string`  | `search`         | Команда пошуку: `search`, `vsearch`, `query`                                         |
| `includeDefaultMemory`   | `boolean` | `true`           | Автоматично індексувати `MEMORY.md` + `memory/**/*.md`                               |
| `paths[]`                | `array`   | --               | Додаткові шляхи: `{ name, path, pattern? }`                                          |
| `sessions.enabled`       | `boolean` | `false`          | Індексувати транскрипти сеансів                                                     |
| `sessions.retentionDays` | `number`  | --               | Термін зберігання транскриптів                                                       |
| `sessions.exportDir`     | `string`  | --               | Каталог експорту                                                                     |

`searchMode: "search"` працює лише з лексичним пошуком/BM25. OpenClaw не запускає перевірки готовності семантичних векторів або обслуговування QMD embedding для цього режиму, зокрема під час `memory status --deep`; `vsearch` і `query` надалі потребують готовності QMD-векторів і embeddings.

OpenClaw віддає перевагу поточним формам колекцій QMD і запитів MCP, але зберігає працездатність старіших випусків QMD, за потреби пробуючи сумісні прапорці шаблонів колекцій і старіші назви інструментів MCP. Коли QMD оголошує підтримку кількох фільтрів колекцій, колекції з того самого джерела шукаються одним процесом QMD; старіші збірки QMD зберігають шлях сумісності для кожної колекції. Те саме джерело означає, що колекції сталої пам’яті групуються разом, тоді як колекції транскриптів сесій залишаються окремою групою, щоб диверсифікація джерел і надалі мала обидва входи.

<Note>
Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо потрібно глобально перевизначити моделі QMD, установіть змінні середовища, як-от `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі виконання gateway.
</Note>

<AccordionGroup>
  <Accordion title="Розклад оновлень">
    | Ключ                     | Тип       | Типове значення | Опис                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Інтервал оновлення                    |
    | `update.debounceMs`       | `number`  | `15000` | Debounce для змін файлів              |
    | `update.onBoot`           | `boolean` | `true`  | Оновлювати, коли відкривається довготривалий менеджер QMD; також керує добровільним стартовим оновленням |
    | `update.startup`          | `string`  | `off`   | Необов’язкове оновлення під час запуску Gateway: `off`, `idle` або `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Затримка перед запуском оновлення `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | Блокувати відкриття менеджера, доки завершиться його початкове оновлення |
    | `update.embedInterval`    | `string`  | --      | Окрема періодичність embed            |
    | `update.commandTimeoutMs` | `number`  | --      | Timeout для команд QMD                |
    | `update.updateTimeoutMs`  | `number`  | --      | Timeout для операцій оновлення QMD    |
    | `update.embedTimeoutMs`   | `number`  | --      | Timeout для операцій embed QMD        |
  </Accordion>
  <Accordion title="Обмеження">
    | Ключ                     | Тип      | Типове значення | Опис                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Максимальна кількість результатів пошуку |
    | `limits.maxSnippetChars`  | `number` | --      | Обмежити довжину фрагмента |
    | `limits.maxInjectedChars` | `number` | --      | Обмежити загальну кількість вставлених символів |
    | `limits.timeoutMs`        | `number` | `4000`  | Timeout пошуку             |
  </Accordion>
  <Accordion title="Область дії">
    Керує тим, які сесії можуть отримувати результати пошуку QMD. Та сама схема, що й [`session.sendPolicy`](/uk/gateway/config-agents#session):

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

    Типове значення, що постачається, дозволяє прямі сесії та сесії каналів, водночас і далі забороняючи групи.

    Типово дозволено лише DM. `match.keyPrefix` зіставляється з нормалізованим ключем сесії; `match.rawKeyPrefix` зіставляється з необробленим ключем, включно з `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитати">
    `memory.citations` застосовується до всіх backend:

    | Значення         | Поведінка                                          |
    | ---------------- | --------------------------------------------------- |
    | `auto` (типово)  | Додавати нижній колонтитул `Source: <path#line>` у фрагменти |
    | `on`             | Завжди додавати нижній колонтитул                  |
    | `off`            | Не додавати нижній колонтитул (шлях усе одно передається агенту внутрішньо) |

  </Accordion>
</AccordionGroup>

Завантажувальні оновлення QMD використовують одноразовий шлях підпроцесу під час запуску Gateway. Довготривалий менеджер QMD і надалі володіє звичайним спостерігачем файлів і таймерами інтервалів, коли пошук у пам’яті відкривається для інтерактивного використання.

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

Dreaming виконується як один запланований прохід і використовує внутрішні легку/глибоку/REM-фази як деталь реалізації.

Концептуальну поведінку та slash-команди див. у [Dreaming](/uk/concepts/dreaming).

### Налаштування користувача

| Ключ        | Тип       | Типове значення | Опис                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Повністю увімкнути або вимкнути Dreaming          |
| `frequency` | `string`  | `0 3 * * *`   | Необов’язкова Cron-періодичність для повного проходу Dreaming |
| `model`     | `string`  | типова модель | Необов’язкове перевизначення моделі субагента Dream Diary |

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
- Dreaming записує машинний стан до `memory/.dreams/`.
- Dreaming записує зручний для читання наративний вивід до `DREAMS.md` (або наявного `dreams.md`).
- `dreaming.model` використовує наявний шлюз довіри субагента Plugin; установіть `plugins.entries.memory-core.subagent.allowModelOverride: true`, перш ніж вмикати його.
- Dream Diary повторює спробу один раз із типовою моделлю сесії, коли налаштована модель недоступна. Помилки довіри або allowlist журналюються й не повторюються мовчки.
- Політика та пороги легкої/глибокої/REM-фаз є внутрішньою поведінкою, а не користувацькою конфігурацією.

</Note>

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Огляд пам’яті](/uk/concepts/memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
