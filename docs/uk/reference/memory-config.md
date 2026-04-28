---
read_when:
    - Ви хочете налаштувати провайдерів пошуку в пам’яті або моделі ембедингів
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часове згасання
    - Ви хочете увімкнути мультимодальне індексування пам’яті
sidebarTitle: Memory config
summary: Усі параметри конфігурації для пошуку в пам’яті, провайдерів ембедингів, QMD, гібридного пошуку та мультимодального індексування
title: Довідник із конфігурації пам’яті
x-i18n:
    generated_at: "2026-04-28T02:18:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6dda6c28de377afaef6fdd951ff8e9f678c75cf969a1242e6f7a16e86c4a1137
    source_path: reference/memory-config.md
    workflow: 15
---

Ця сторінка перелічує всі параметри конфігурації для пошуку в пам’яті OpenClaw. Для концептуальних оглядів дивіться:

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
    Конвеєр пошуку та налаштування.
  </Card>
  <Card title="Active Memory" href="/uk/concepts/active-memory">
    Підагент пам’яті для інтерактивних сеансів.
  </Card>
</CardGroup>

Усі параметри пошуку в пам’яті розташовані в `agents.defaults.memorySearch` у `openclaw.json`, якщо не вказано інше.

<Note>
Якщо ви шукаєте перемикач функції **active memory** та конфігурацію підагента, вони розташовані в `plugins.entries.active-memory`, а не в `memorySearch`.

Active memory використовує модель із двома умовами:

1. plugin має бути увімкнений і націлений на поточний id агента
2. запит має бути придатним інтерактивним постійним сеансом чату

Див. [Active Memory](/uk/concepts/active-memory) щодо моделі активації, конфігурації, якою керує plugin, збереження транскрипту та безпечного шаблону розгортання.
</Note>

---

## Вибір провайдера

| Key        | Type      | Default          | Description                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | auto-detected    | ID адаптера ембедингів, наприклад `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` або `voyage`; також може бути налаштованим `models.providers.<id>`, у якого `api` вказує на один із цих адаптерів |
| `model`    | `string`  | provider default | Назва моделі ембедингів                                                                                                                                                                                                     |
| `fallback` | `string`  | `"none"`         | ID резервного адаптера, якщо основний завершується помилкою                                                                                                                                                                 |
| `enabled`  | `boolean` | `true`           | Увімкнути або вимкнути пошук у пам’яті                                                                                                                                                                                      |

### Порядок автоматичного виявлення

Коли `provider` не задано, OpenClaw вибирає перший доступний:

<Steps>
  <Step title="local">
    Вибирається, якщо налаштовано `memorySearch.local.modelPath` і файл існує.
  </Step>
  <Step title="github-copilot">
    Вибирається, якщо вдається визначити токен GitHub Copilot (змінна середовища або профіль автентифікації).
  </Step>
  <Step title="openai">
    Вибирається, якщо вдається визначити ключ OpenAI.
  </Step>
  <Step title="gemini">
    Вибирається, якщо вдається визначити ключ Gemini.
  </Step>
  <Step title="voyage">
    Вибирається, якщо вдається визначити ключ Voyage.
  </Step>
  <Step title="mistral">
    Вибирається, якщо вдається визначити ключ Mistral.
  </Step>
  <Step title="deepinfra">
    Вибирається, якщо вдається визначити ключ DeepInfra.
  </Step>
  <Step title="bedrock">
    Вибирається, якщо ланцюжок облікових даних AWS SDK успішно визначається (роль екземпляра, ключі доступу, профіль, SSO, web identity або спільна конфігурація).
  </Step>
</Steps>

`ollama` підтримується, але не виявляється автоматично (задайте його явно).

### Користувацькі ID провайдерів

`memorySearch.provider` може вказувати на користувацький запис `models.providers.<id>`. OpenClaw визначає власника `api` цього провайдера для адаптера ембедингів, зберігаючи при цьому користувацький ID провайдера для endpoint, автентифікації та обробки префікса моделі. Це дає змогу в конфігураціях із кількома GPU або кількома хостами виділити ембединги пам’яті для конкретного локального endpoint:

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

Віддалені ембединги потребують API-ключа. Натомість Bedrock використовує типовий ланцюжок облікових даних AWS SDK (ролі екземпляра, SSO, ключі доступу).

| Provider       | Env var                                            | Config key                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | ланцюжок облікових даних AWS                       | API-ключ не потрібен                |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профіль автентифікації через вхід із пристрою |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
OAuth Codex покриває лише chat/completions і не задовольняє запити на ембединги.
</Note>

---

## Конфігурація віддаленого endpoint

Для користувацьких endpoint, сумісних з OpenAI, або перевизначення типових налаштувань провайдера:

<ParamField path="remote.baseUrl" type="string">
  Користувацька базова URL-адреса API.
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
  <Accordion title="Типи вхідних даних OpenAI-compatible">
    Endpoint ембедингів, сумісні з OpenAI, можуть використовувати специфічні для провайдера поля запиту `input_type`. Це корисно для асиметричних моделей ембедингів, які потребують різних міток для ембедингів запиту й документа.

    | Key                 | Type     | Default | Description                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | unset   | Спільний `input_type` для ембедингів запиту й документа |
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

    Зміна цих значень впливає на ідентичність кешу ембедингів для пакетного індексування провайдера, і після цього слід виконати переіндексування пам’яті, якщо висхідна модель по-різному обробляє ці мітки.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock використовує типовий ланцюжок облікових даних AWS SDK — API-ключі не потрібні. Якщо OpenClaw працює на EC2 з роллю екземпляра, для якої увімкнено Bedrock, просто задайте провайдера та модель:

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

    | Key                    | Type     | Default                        | Description                    |
    | ---------------------- | -------- | ------------------------------ | ------------------------------ |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ID моделі ембедингів Bedrock |
    | `outputDimensionality` | `number` | model default                  | Для Titan V2: 256, 512 або 1024 |

    **Підтримувані моделі** (з визначенням сімейства та типовими розмірностями):

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

    **Автентифікація:** автентифікація Bedrock використовує стандартний порядок визначення облікових даних AWS SDK:

    1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Кеш токенів SSO
    3. Облікові дані токена web identity
    4. Спільні файли облікових даних і конфігурації
    5. Облікові дані метаданих ECS або EC2

    Регіон визначається з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` провайдера `amazon-bedrock` або за замовчуванням використовується `us-east-1`.

    **Дозволи IAM:** ролі або користувачу IAM потрібні:

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
    | Key                   | Type               | Default                | Description                                                                                                                                                                                                                                                                                                           |
    | --------------------- | ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | auto-downloaded        | Шлях до файла моделі GGUF                                                                                                                                                                                                                                                                                             |
    | `local.modelCacheDir` | `string`           | node-llama-cpp default | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                                 |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Розмір контекстного вікна для контексту ембедингів. 4096 покриває типові фрагменти (128–512 токенів), водночас обмежуючи VRAM, не пов’язану з вагами. Зменште до 1024–2048 на обмежених хостах. `"auto"` використовує навчений максимум моделі — не рекомендується для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 GB VRAM проти ~8.8 GB при 4096). |

    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, завантажується автоматично). Потрібна нативна збірка: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використовуйте окремий CLI, щоб перевірити той самий шлях провайдера, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Якщо `provider` має значення `auto`, `local` вибирається лише тоді, коли `local.modelPath` вказує на наявний локальний файл. Посилання на моделі `hf:` і HTTP(S) усе ще можна явно використовувати з `provider: "local"`, але вони не змушують `auto` вибрати local до того, як модель стане доступною на диску.

  </Accordion>
</AccordionGroup>

### Тайм-аут вбудовування inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначає тайм-аут для inline-пакетів ембедингів під час індексування пам’яті.

Якщо не задано, використовується типове значення провайдера: 600 секунд для локальних/self-hosted провайдерів, таких як `local`, `ollama` і `lmstudio`, і 120 секунд для хостингових провайдерів. Збільшуйте це значення, якщо локальні пакети ембедингів, обмежені CPU, працюють коректно, але повільно.
</ParamField>

---

## Конфігурація гібридного пошуку

Усе розташовано в `memorySearch.query.hybrid`:

| Key                   | Type      | Default | Description                         |
| --------------------- | --------- | ------- | ----------------------------------- |
| `enabled`             | `boolean` | `true`  | Увімкнути гібридний пошук BM25 + vector |
| `vectorWeight`        | `number`  | `0.7`   | Вага для vector-оцінок (0-1)        |
| `textWeight`          | `number`  | `0.3`   | Вага для оцінок BM25 (0-1)          |
| `candidateMultiplier` | `number`  | `4`     | Множник розміру пулу кандидатів     |

<Tabs>
  <Tab title="MMR (різноманітність)">
    | Key           | Type      | Default | Description                              |
    | ------------- | --------- | ------- | ---------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Увімкнути повторне ранжування MMR        |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = максимальна різноманітність, 1 = максимальна релевантність |
  </Tab>
  <Tab title="Часове згасання (актуальність)">
    | Key                          | Type      | Default | Description                    |
    | ---------------------------- | --------- | ------- | ------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false` | Увімкнути підсилення актуальності |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Оцінка зменшується вдвічі кожні N днів |

    Evergreen-файли (`MEMORY.md`, файли без дати в `memory/`) ніколи не підлягають згасанню.

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

| Key          | Type       | Description                               |
| ------------ | ---------- | ----------------------------------------- |
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

Шляхи можуть бути абсолютними або відносними до робочої області. Каталоги скануються рекурсивно на наявність файлів `.md`. Обробка symlink залежить від активного бекенда: вбудований рушій ігнорує symlink, тоді як QMD наслідує поведінку базового сканера QMD.

Для пошуку транскриптів між агентами в межах області дії агента використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові колекції мають ту саму форму `{ path, name, pattern? }`, але об’єднуються для кожного агента окремо й можуть зберігати явні спільні назви, коли шлях указує за межі поточної робочої області. Якщо той самий визначений шлях з’являється і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає дублікат.

---

## Мультимодальна пам’ять (Gemini)

Індексуйте зображення й аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Key                       | Type       | Default    | Description                              |
| ------------------------- | ---------- | ---------- | ---------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Увімкнути мультимодальне індексування    |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` або `["all"]`   |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Максимальний розмір файла для індексування |

<Note>
Застосовується лише до файлів у `extraPaths`. Типові кореневі шляхи пам’яті залишаються лише для Markdown. Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш ембедингів

| Key                | Type      | Default | Description                         |
| ------------------ | --------- | ------- | ----------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Кешувати ембединги фрагментів у SQLite |
| `cache.maxEntries` | `number`  | `50000` | Максимальна кількість кешованих ембедингів |

Запобігає повторному створенню ембедингів для незміненого тексту під час переіндексування або оновлення транскриптів.

---

## Пакетне індексування

| Key                           | Type      | Default | Description                   |
| ----------------------------- | --------- | ------- | ----------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Паралельні inline-ембединги   |
| `remote.batch.enabled`        | `boolean` | `false` | Увімкнути API пакетних ембедингів |
| `remote.batch.concurrency`    | `number`  | `2`     | Паралельні пакетні завдання   |
| `remote.batch.wait`           | `boolean` | `true`  | Чекати завершення пакета      |
| `remote.batch.pollIntervalMs` | `number`  | --      | Інтервал опитування           |
| `remote.batch.timeoutMinutes` | `number`  | --      | Тайм-аут пакета               |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай найшвидший і найдешевший для великих зворотних заповнень.

`remote.nonBatchConcurrency` керує inline-викликами ембедингів, які використовуються локальними/self-hosted провайдерами та хостинговими провайдерами, коли API пакетної обробки провайдера не активні. Для Ollama типове значення для непакетного індексування — `1`, щоб не перевантажувати менші локальні хости; на потужніших машинах можна встановити більше значення.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує тайм-аутом для inline-викликів ембедингів.

---

## Пошук у пам’яті сеансів (експериментально)

Індексуйте транскрипти сеансів і показуйте їх через `memory_search`:

| Key                           | Type       | Default      | Description                                    |
| ----------------------------- | ---------- | ------------ | ---------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Увімкнути індексування сеансів                 |
| `sources`                     | `string[]` | `["memory"]` | Додайте `"sessions"`, щоб включити транскрипти |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Поріг байтів для переіндексування              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Поріг повідомлень для переіндексування         |

<Warning>
Індексування сеансів є опційним і виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сеансів зберігаються на диску, тому вважайте доступ до файлової системи межею довіри.
</Warning>

---

## Прискорення векторів SQLite (sqlite-vec)

| Key                          | Type      | Default | Description                          |
| ---------------------------- | --------- | ------- | ------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`  | Використовувати sqlite-vec для векторних запитів |
| `store.vector.extensionPath` | `string`  | bundled | Перевизначити шлях до sqlite-vec     |

Коли sqlite-vec недоступний, OpenClaw автоматично переходить на косинусну подібність у межах процесу.

---

## Зберігання індексу

| Key                   | Type     | Default                               | Description                                    |
| --------------------- | -------- | ------------------------------------- | ---------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Токенізатор FTS5 (`unicode61` або `trigram`)   |

---

## Конфігурація бекенда QMD

Щоб увімкнути, задайте `memory.backend = "qmd"`. Усі параметри QMD розташовані в `memory.qmd`:

| Key                      | Type      | Default  | Description                                                                                  |
| ------------------------ | --------- | -------- | -------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Шлях до виконуваного файла QMD; задайте абсолютний шлях, якщо `PATH` сервісу відрізняється від вашої оболонки |
| `searchMode`             | `string`  | `search` | Команда пошуку: `search`, `vsearch`, `query`                                                 |
| `includeDefaultMemory`   | `boolean` | `true`   | Автоматично індексувати `MEMORY.md` + `memory/**/*.md`                                       |
| `paths[]`                | `array`   | --       | Додаткові шляхи: `{ name, path, pattern? }`                                                  |
| `sessions.enabled`       | `boolean` | `false`  | Індексувати транскрипти сеансів                                                              |
| `sessions.retentionDays` | `number`  | --       | Термін зберігання транскриптів                                                               |
| `sessions.exportDir`     | `string`  | --       | Каталог експорту                                                                             |

`searchMode: "search"` є лише лексичним/BM25-режимом. OpenClaw не виконує перевірки готовності семантичних векторів або обслуговування ембедингів QMD для цього режиму, зокрема під час `memory status --deep`; `vsearch` і `query` як і раніше потребують готовності векторів QMD та ембедингів.

OpenClaw надає перевагу актуальним формам колекцій QMD і запитів MCP, але зберігає працездатність старіших випусків QMD, за потреби використовуючи сумісні прапорці шаблонів колекцій і старіші назви інструментів MCP. Коли QMD повідомляє про підтримку кількох фільтрів колекцій, колекції з однаковим джерелом шукаються одним процесом QMD; старіші збірки QMD зберігають сумісний шлях із обробкою кожної колекції окремо. Однакове джерело означає, що колекції постійної пам’яті групуються разом, тоді як колекції транскриптів сеансів залишаються окремою групою, щоб диверсифікація джерел усе ще мала обидва входи.

<Note>
Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо вам потрібно глобально перевизначити моделі QMD, задайте змінні середовища, такі як `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі виконання Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Розклад оновлень">
    | Key                       | Type      | Default | Description                            |
    | ------------------------- | --------- | ------- | -------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Інтервал оновлення                     |
    | `update.debounceMs`       | `number`  | `15000` | Затримка file changes                  |
    | `update.onBoot`           | `boolean` | `true`  | Оновлювати під час запуску             |
    | `update.waitForBootSync`  | `boolean` | `false` | Блокувати запуск до завершення оновлення |
    | `update.embedInterval`    | `string`  | --      | Окрема періодичність ембедингів        |
    | `update.commandTimeoutMs` | `number`  | --      | Тайм-аут для команд QMD                |
    | `update.updateTimeoutMs`  | `number`  | --      | Тайм-аут для операцій оновлення QMD    |
    | `update.embedTimeoutMs`   | `number`  | --      | Тайм-аут для операцій ембедингів QMD   |
  </Accordion>
  <Accordion title="Обмеження">
    | Key                       | Type     | Default | Description                     |
    | ------------------------- | -------- | ------- | ------------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Максимальна кількість результатів пошуку |
    | `limits.maxSnippetChars`  | `number` | --      | Обмежити довжину фрагмента      |
    | `limits.maxInjectedChars` | `number` | --      | Обмежити загальну кількість вставлених символів |
    | `limits.timeoutMs`        | `number` | `4000`  | Тайм-аут пошуку                 |
  </Accordion>
  <Accordion title="Область дії">
    Керує тим, які сеанси можуть отримувати результати пошуку QMD. Та сама схема, що й у [`session.sendPolicy`](/uk/gateway/config-agents#session):

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

    Типова конфігурація за замовчуванням дозволяє direct і channel сеанси, водночас забороняючи групи.

    За замовчуванням — лише DM. `match.keyPrefix` відповідає нормалізованому ключу сеансу; `match.rawKeyPrefix` відповідає сирому ключу, включно з `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитування">
    `memory.citations` застосовується до всіх бекендів:

    | Value            | Behavior                                             |
    | ---------------- | ---------------------------------------------------- |
    | `auto` (default) | Додає нижній колонтитул `Source: <path#line>` у фрагменти |
    | `on`             | Завжди додавати нижній колонтитул                    |
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

Dreaming виконується як один запланований прохід і використовує внутрішні фази light/deep/REM як деталь реалізації.

Щодо концептуальної поведінки та slash-команд див. [Dreaming](/uk/concepts/dreaming).

### Налаштування користувача

| Key         | Type      | Default       | Description                                            |
| ----------- | --------- | ------------- | ------------------------------------------------------ |
| `enabled`   | `boolean` | `false`       | Повністю увімкнути або вимкнути Dreaming               |
| `frequency` | `string`  | `0 3 * * *`   | Необов’язкова Cron-періодичність для повного проходу Dreaming |
| `model`     | `string`  | default model | Необов’язкове перевизначення моделі підагента Dream Diary |

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
- `dreaming.model` використовує наявний trust gate підагента plugin; перед увімкненням задайте `plugins.entries.memory-core.subagent.allowModelOverride: true`.
- Політика фаз light/deep/REM і порогові значення є внутрішньою поведінкою, а не користувацькою конфігурацією.
</Note>

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Огляд пам’яті](/uk/concepts/memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
