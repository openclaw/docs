---
read_when:
    - Ви хочете налаштувати провайдерів пошуку в пам’яті або моделі ембедингів
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часове згасання
    - Ви хочете увімкнути мультимодальне індексування пам’яті
sidebarTitle: Memory config
summary: Усі параметри конфігурації для пошуку в пам’яті, постачальників ембедингів, QMD, гібридного пошуку та мультимодального індексування
title: Довідник із конфігурації пам’яті
x-i18n:
    generated_at: "2026-04-29T07:18:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: d076cd1c34ac3cee45cb17633b06a79f87ba4da922e6a141409585258a28e355
    source_path: reference/memory-config.md
    workflow: 16
---

Ця сторінка перелічує всі параметри конфігурації для пошуку пам’яті OpenClaw. Концептуальні огляди дивіться тут:

<CardGroup cols={2}>
  <Card title="Memory overview" href="/uk/concepts/memory">
    Як працює пам’ять.
  </Card>
  <Card title="Builtin engine" href="/uk/concepts/memory-builtin">
    Типовий бекенд SQLite.
  </Card>
  <Card title="QMD engine" href="/uk/concepts/memory-qmd">
    Локальний допоміжний процес.
  </Card>
  <Card title="Memory search" href="/uk/concepts/memory-search">
    Конвеєр пошуку й налаштування.
  </Card>
  <Card title="Active memory" href="/uk/concepts/active-memory">
    Під-агент пам’яті для інтерактивних сеансів.
  </Card>
</CardGroup>

Усі налаштування пошуку пам’яті розташовані в `agents.defaults.memorySearch` у `openclaw.json`, якщо не зазначено інше.

<Note>
Якщо ви шукаєте перемикач функції **Active Memory** і конфігурацію під-агента, вони розташовані в `plugins.entries.active-memory`, а не в `memorySearch`.

Active Memory використовує модель із двома шлюзами:

1. Plugin має бути ввімкнений і націлений на ідентифікатор поточного агента
2. запит має бути придатним інтерактивним постійним сеансом чату

Дивіться [Active Memory](/uk/concepts/active-memory), щоб ознайомитися з моделлю активації, конфігурацією, що належить Plugin, збереженням транскриптів і безпечним шаблоном розгортання.
</Note>

---

## Вибір провайдера

| Ключ       | Тип       | Типово              | Опис                                                                                                                                                                                                                               |
| ---------- | --------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | автовизначення      | Ідентифікатор адаптера ембедингів, наприклад `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` або `voyage`; також може бути налаштованим `models.providers.<id>`, чий `api` вказує на один із цих адаптерів |
| `model`    | `string`  | типово провайдера   | Назва моделі ембедингів                                                                                                                                                                                                            |
| `fallback` | `string`  | `"none"`            | Ідентифікатор резервного адаптера, коли основний завершується невдало                                                                                                                                                              |
| `enabled`  | `boolean` | `true`              | Увімкнути або вимкнути пошук пам’яті                                                                                                                                                                                               |

### Порядок автовизначення

Коли `provider` не задано, OpenClaw вибирає перший доступний:

<Steps>
  <Step title="local">
    Вибирається, якщо `memorySearch.local.modelPath` налаштовано і файл існує.
  </Step>
  <Step title="github-copilot">
    Вибирається, якщо токен GitHub Copilot можна визначити (змінна середовища або профіль автентифікації).
  </Step>
  <Step title="openai">
    Вибирається, якщо ключ OpenAI можна визначити.
  </Step>
  <Step title="gemini">
    Вибирається, якщо ключ Gemini можна визначити.
  </Step>
  <Step title="voyage">
    Вибирається, якщо ключ Voyage можна визначити.
  </Step>
  <Step title="mistral">
    Вибирається, якщо ключ Mistral можна визначити.
  </Step>
  <Step title="deepinfra">
    Вибирається, якщо ключ DeepInfra можна визначити.
  </Step>
  <Step title="bedrock">
    Вибирається, якщо ланцюг облікових даних AWS SDK успішно визначається (роль інстансу, ключі доступу, профіль, SSO, веб-ідентичність або спільна конфігурація).
  </Step>
</Steps>

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Власні ідентифікатори провайдерів

`memorySearch.provider` може вказувати на власний запис `models.providers.<id>`. OpenClaw визначає власника `api` цього провайдера для адаптера ембедингів, зберігаючи власний ідентифікатор провайдера для обробки кінцевої точки, автентифікації та префікса моделі. Це дає змогу конфігураціям із кількома GPU або кількома хостами виділити ембединги пам’яті для конкретної локальної кінцевої точки:

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

Віддалені ембединги потребують ключа API. Натомість Bedrock використовує типовий ланцюг облікових даних AWS SDK (ролі інстансів, SSO, ключі доступу).

| Провайдер      | Змінна середовища                                | Ключ конфігурації                  |
| -------------- | ------------------------------------------------ | ---------------------------------- |
| Bedrock        | ланцюг облікових даних AWS                       | Ключ API не потрібен               |
| DeepInfra      | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`   |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профіль автентифікації через вхід із пристрою |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey`  |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                    | --                                 |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`   |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`   |

<Note>
OAuth Codex покриває лише чат/завершення і не задовольняє запити ембедингів.
</Note>

---

## Конфігурація віддаленої кінцевої точки

Для власних OpenAI-сумісних кінцевих точок або перевизначення типових налаштувань провайдера:

<ParamField path="remote.baseUrl" type="string">
  Власна базова URL-адреса API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Перевизначити ключ API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Додаткові HTTP-заголовки (об’єднуються з типовими заголовками провайдера).
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

## Конфігурація, специфічна для провайдера

<AccordionGroup>
  <Accordion title="Gemini">
    | Ключ                   | Тип      | Типово                 | Опис                                       |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Для Embedding 2: 768, 1536 або 3072        |

    <Warning>
    Зміна моделі або `outputDimensionality` запускає автоматичну повну переіндексацію.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    OpenAI-сумісні кінцеві точки ембедингів можуть увімкнути специфічні для провайдера поля запиту `input_type`. Це корисно для асиметричних моделей ембедингів, яким потрібні різні мітки для ембедингів запитів і документів.

    | Ключ                | Тип      | Типово       | Опис                                                     |
    | ------------------- | -------- | ------------ | -------------------------------------------------------- |
    | `inputType`         | `string` | не задано    | Спільний `input_type` для ембедингів запитів і документів |
    | `queryInputType`    | `string` | не задано    | `input_type` під час запиту; перевизначає `inputType`    |
    | `documentInputType` | `string` | не задано    | `input_type` індексу/документа; перевизначає `inputType` |

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

    Зміна цих значень впливає на ідентичність кешу ембедингів для пакетного індексування провайдера, і після неї слід виконати переіндексацію пам’яті, коли upstream-модель обробляє мітки по-різному.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock використовує типовий ланцюг облікових даних AWS SDK — ключі API не потрібні. Якщо OpenClaw працює на EC2 з роллю інстансу, увімкненою для Bedrock, просто задайте провайдера й модель:

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

    | Ключ                   | Тип      | Типово                         | Опис                          |
    | ---------------------- | -------- | ------------------------------ | ----------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ідентифікатор моделі ембедингів Bedrock |
    | `outputDimensionality` | `number` | типово моделі                  | Для Titan V2: 256, 512 або 1024 |

    **Підтримувані моделі** (з визначенням сімейства й типовими розмірностями):

    | Ідентифікатор моделі                      | Провайдер  | Типові розмірності | Налаштовувані розмірності |
    | ------------------------------------------ | ---------- | ------------------ | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024               | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536               | --                         |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536               | --                         |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024               | --                         |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024               | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024               | --                         |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024               | --                         |
    | `cohere.embed-v4:0`                        | Cohere     | 1536               | 256-1536                   |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                | --                         |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024               | --                         |

    Варіанти із суфіксом пропускної здатності (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують конфігурацію базової моделі.

    **Автентифікація:** автентифікація Bedrock використовує стандартний порядок визначення облікових даних AWS SDK:

    1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Кеш токенів SSO
    3. Облікові дані токена веб-ідентичності
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

    Для принципу найменших привілеїв обмежте область `InvokeModel` конкретною моделлю:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Ключ                  | Тип                | Типове значення              | Опис                                                                                                                                                                                                                                                                                                                                    |
    | --------------------- | ------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | автоматично завантажується   | Шлях до файлу моделі GGUF                                                                                                                                                                                                                                                                                                               |
    | `local.modelCacheDir` | `string`           | типове для node-llama-cpp    | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                                                   |
    | `local.contextSize`   | `number \| "auto"` | `4096`                       | Розмір вікна контексту для контексту embedding. 4096 покриває типові фрагменти (128–512 токенів), обмежуючи VRAM, не зайняту вагами. Зменште до 1024–2048 на обмежених хостах. `"auto"` використовує навчений максимум моделі — не рекомендовано для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 GB VRAM проти ~8.8 GB при 4096). |

    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, завантажується автоматично). Потрібне нативне складання: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використайте автономний CLI, щоб перевірити той самий шлях провайдера, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Якщо `provider` має значення `auto`, `local` вибирається лише тоді, коли `local.modelPath` вказує на наявний локальний файл. Посилання на моделі `hf:` і HTTP(S) усе ще можна явно використовувати з `provider: "local"`, але вони не змушують `auto` вибирати local до того, як модель стане доступною на диску.

  </Accordion>
</AccordionGroup>

### Таймаут inline embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначає таймаут для inline-пакетів embedding під час індексування памʼяті.

Якщо не задано, використовується типове значення провайдера: 600 секунд для локальних/self-hosted провайдерів, як-от `local`, `ollama` і `lmstudio`, та 120 секунд для hosted-провайдерів. Збільште це значення, коли локальні CPU-bound пакети embedding працюють коректно, але повільно.
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
    | Ключ          | Тип       | Типове значення | Опис                                         |
    | ------------- | --------- | --------------- | -------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`         | Увімкнути повторне ранжування MMR            |
    | `mmr.lambda`  | `number`  | `0.7`           | 0 = максимальна різноманітність, 1 = максимальна релевантність |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | Ключ                         | Тип       | Типове значення | Опис                                  |
    | ---------------------------- | --------- | --------------- | ------------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`         | Увімкнути підсилення за новизною      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`            | Оцінка зменшується вдвічі кожні N днів |

    Evergreen-файли (`MEMORY.md`, файли без дат у `memory/`) ніколи не зазнають decay.

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

Шляхи можуть бути абсолютними або відносними до робочого простору. Каталоги рекурсивно скануються на наявність файлів `.md`. Обробка symlink залежить від активного backend: вбудований рушій ігнорує symlink, тоді як QMD дотримується поведінки базового сканера QMD.

Для пошуку транскриптів між агентами в межах агента використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові колекції мають таку саму форму `{ path, name, pattern? }`, але обʼєднуються для кожного агента й можуть зберігати явні спільні назви, коли шлях вказує за межі поточного робочого простору. Якщо той самий resolved path є і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає дублікат.

---

## Мультимодальна памʼять (Gemini)

Індексуйте зображення й аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ                      | Тип        | Типове значення | Опис                                  |
| ------------------------- | ---------- | --------------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`         | Увімкнути мультимодальне індексування |
| `multimodal.modalities`   | `string[]` | --              | `["image"]`, `["audio"]`, або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000`      | Максимальний розмір файлу для індексування |

<Note>
Застосовується лише до файлів у `extraPaths`. Типові корені пам’яті залишаються лише Markdown. Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш embedding

| Ключ              | Тип       | Типово  | Опис                                  |
| ----------------- | --------- | ------- | ------------------------------------- |
| `cache.enabled`   | `boolean` | `false` | Кешувати embedding фрагментів у SQLite |
| `cache.maxEntries` | `number` | `50000` | Максимум кешованих embedding          |

Запобігає повторному embedding незміненого тексту під час повторної індексації або оновлень стенограм.

---

## Пакетна індексація

| Ключ                          | Тип       | Типово | Опис                       |
| ----------------------------- | --------- | ------ | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`    | Паралельні inline embedding |
| `remote.batch.enabled`        | `boolean` | `false` | Увімкнути API пакетного embedding |
| `remote.batch.concurrency`    | `number`  | `2`    | Паралельні пакетні завдання |
| `remote.batch.wait`           | `boolean` | `true` | Чекати завершення пакета   |
| `remote.batch.pollIntervalMs` | `number`  | --     | Інтервал опитування        |
| `remote.batch.timeoutMinutes` | `number`  | --     | Тайм-аут пакета            |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай найшвидший і найдешевший для великих зворотних заповнень.

`remote.nonBatchConcurrency` керує inline-викликами embedding, які використовують локальні/самостійно розгорнуті провайдери та хостингові провайдери, коли пакетні API провайдера не активні. Ollama типово використовує `1` для непакетної індексації, щоб не перевантажувати менші локальні хости; встановіть більше значення на потужніших машинах.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує тайм-аутом для inline-викликів embedding.

---

## Пошук пам’яті сеансів (експериментально)

Індексуйте стенограми сеансів і показуйте їх через `memory_search`:

| Ключ                          | Тип        | Типово       | Опис                                      |
| ----------------------------- | ---------- | ------------ | ----------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Увімкнути індексацію сеансів              |
| `sources`                     | `string[]` | `["memory"]` | Додайте `"sessions"`, щоб включити стенограми |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Поріг байтів для повторної індексації     |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Поріг повідомлень для повторної індексації |

<Warning>
Індексація сеансів вмикається явно й виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сеансів зберігаються на диску, тому вважайте доступ до файлової системи межею довіри.
</Warning>

---

## Векторне прискорення SQLite (sqlite-vec)

| Ключ                         | Тип       | Типово  | Опис                                    |
| ---------------------------- | --------- | ------- | --------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Використовувати sqlite-vec для векторних запитів |
| `store.vector.extensionPath` | `string`  | bundled | Перевизначити шлях до sqlite-vec        |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до косинусної подібності в процесі.

---

## Сховище індексу

| Ключ                  | Тип      | Типово                               | Опис                                      |
| --------------------- | -------- | ------------------------------------- | ----------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Токенізатор FTS5 (`unicode61` або `trigram`) |

---

## Конфігурація бекенду QMD

Установіть `memory.backend = "qmd"`, щоб увімкнути. Усі налаштування QMD розташовані в `memory.qmd`:

| Ключ                     | Тип       | Типово   | Опис                                                                                  |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Шлях до виконуваного файлу QMD; задайте абсолютний шлях, коли `PATH` сервісу відрізняється від вашої оболонки |
| `searchMode`             | `string`  | `search` | Команда пошуку: `search`, `vsearch`, `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | Автоматично індексувати `MEMORY.md` + `memory/**/*.md`                                |
| `paths[]`                | `array`   | --       | Додаткові шляхи: `{ name, path, pattern? }`                                           |
| `sessions.enabled`       | `boolean` | `false`  | Індексувати стенограми сеансів                                                        |
| `sessions.retentionDays` | `number`  | --       | Зберігання стенограм                                                                  |
| `sessions.exportDir`     | `string`  | --       | Каталог експорту                                                                      |

`searchMode: "search"` є лише лексичним/BM25. OpenClaw не запускає перевірки готовності семантичних векторів або обслуговування QMD-вбудовувань для цього режиму, зокрема під час `memory status --deep`; `vsearch` і `query` надалі потребують готовності QMD-векторів і вбудовувань.

OpenClaw надає перевагу поточним формам колекцій QMD і запитів MCP, але зберігає працездатність старіших випусків QMD, за потреби пробуючи сумісні прапорці шаблонів колекцій і старіші назви інструментів MCP. Коли QMD повідомляє про підтримку кількох фільтрів колекцій, колекції з тим самим джерелом шукаються одним процесом QMD; старіші збірки QMD зберігають шлях сумісності для кожної колекції. Те саме джерело означає, що колекції довготривалої пам'яті групуються разом, тоді як колекції стенограм сесій залишаються окремою групою, щоб диверсифікація джерел і надалі мала обидва входи.

<Note>
Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо потрібно глобально перевизначити моделі QMD, задайте змінні середовища, як-от `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у runtime-середовищі Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Розклад оновлення">
    | Ключ                      | Тип       | Типово  | Опис                                  |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Інтервал оновлення                    |
    | `update.debounceMs`       | `number`  | `15000` | Усунення брязкоту змін файлів         |
    | `update.onBoot`           | `boolean` | `true`  | Оновлювати під час запуску в підпроцесі QMD |
    | `update.waitForBootSync`  | `boolean` | `false` | Блокувати запуск до завершення оновлення |
    | `update.embedInterval`    | `string`  | --      | Окрема періодичність вбудовування     |
    | `update.commandTimeoutMs` | `number`  | --      | Тайм-аут для команд QMD               |
    | `update.updateTimeoutMs`  | `number`  | --      | Тайм-аут для операцій оновлення QMD   |
    | `update.embedTimeoutMs`   | `number`  | --      | Тайм-аут для операцій вбудовування QMD |
  </Accordion>
  <Accordion title="Обмеження">
    | Ключ                      | Тип      | Типово | Опис                                  |
    | ------------------------- | -------- | ------ | ------------------------------------- |
    | `limits.maxResults`       | `number` | `6`    | Максимум результатів пошуку           |
    | `limits.maxSnippetChars`  | `number` | --     | Обмежити довжину фрагмента            |
    | `limits.maxInjectedChars` | `number` | --     | Обмежити загальну кількість вставлених символів |
    | `limits.timeoutMs`        | `number` | `4000` | Тайм-аут пошуку                       |
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

    Постачене типове значення дозволяє прямі й канальні сесії, водночас усе ще забороняючи групи.

    Типово лише для DM. `match.keyPrefix` зіставляється з нормалізованим ключем сесії; `match.rawKeyPrefix` зіставляється з сирим ключем, включно з `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитування">
    `memory.citations` застосовується до всіх бекендів:

    | Значення         | Поведінка                                           |
    | ---------------- | --------------------------------------------------- |
    | `auto` (типово)  | Додавати футер `Source: <path#line>` у фрагменти    |
    | `on`             | Завжди додавати футер                               |
    | `off`            | Не додавати футер (шлях усе одно передається агенту внутрішньо) |

  </Accordion>
</AccordionGroup>

Оновлення QMD під час завантаження використовують одноразовий шлях підпроцесу під час запуску Gateway. Довготривалий менеджер QMD усе ще відповідає за звичайний спостерігач файлів і таймери інтервалів, коли пошук у пам'яті відкривається для інтерактивного використання.

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

Концептуальну поведінку й slash-команди див. у [Dreaming](/uk/concepts/dreaming).

### Налаштування користувача

| Ключ        | Тип       | Типово        | Опис                                             |
| ----------- | --------- | ------------- | ------------------------------------------------ |
| `enabled`   | `boolean` | `false`       | Повністю ввімкнути або вимкнути dreaming         |
| `frequency` | `string`  | `0 3 * * *`   | Необов'язкова Cron-періодичність для повного проходу dreaming |
| `model`     | `string`  | типова модель | Необов'язкове перевизначення моделі субагента Dream Diary |

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
- `dreaming.model` використовує наявний шлюз довіри субагента Plugin; задайте `plugins.entries.memory-core.subagent.allowModelOverride: true`, перш ніж вмикати його.
- Dream Diary повторює спробу один раз із типовою моделлю сесії, коли налаштована модель недоступна. Збої довіри або allowlist журналюються й не повторюються мовчки.
- Політика й пороги фаз light/deep/REM є внутрішньою поведінкою, а не користувацькою конфігурацією.

</Note>

## Пов'язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Огляд пам'яті](/uk/concepts/memory)
- [Пошук у пам'яті](/uk/concepts/memory-search)
