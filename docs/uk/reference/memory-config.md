---
read_when:
    - Ви хочете налаштувати постачальників пошуку в пам’яті або моделі вбудовування
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часове згасання
    - Ви хочете увімкнути індексування мультимодальної пам’яті
sidebarTitle: Memory config
summary: Усі параметри конфігурації для пошуку в пам’яті, провайдерів ембедингів, QMD, гібридного пошуку та мультимодального індексування
title: Довідник конфігурації пам’яті
x-i18n:
    generated_at: "2026-04-28T11:24:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 552a024fe20577311f235571a79c2f847c466d713ae99628fb63abf8a07e2b32
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
    Локальний sidecar.
  </Card>
  <Card title="Пошук у пам’яті" href="/uk/concepts/memory-search">
    Пошуковий конвеєр і налаштування.
  </Card>
  <Card title="Активна пам’ять" href="/uk/concepts/active-memory">
    Під-агент пам’яті для інтерактивних сеансів.
  </Card>
</CardGroup>

Усі налаштування пошуку в пам’яті розміщені в `agents.defaults.memorySearch` у `openclaw.json`, якщо не зазначено інше.

<Note>
Якщо ви шукаєте перемикач функції **активної пам’яті** та конфігурацію під-агента, вони розміщені в `plugins.entries.active-memory`, а не в `memorySearch`.

Активна пам’ять використовує модель із двома шлюзами:

1. Plugin має бути ввімкнений і націлений на ідентифікатор поточного агента
2. запит має бути придатним інтерактивним постійним сеансом чату

Дивіться [Active Memory](/uk/concepts/active-memory), щоб дізнатися про модель активації, конфігурацію, якою володіє Plugin, збереження транскриптів і безпечний шаблон розгортання.
</Note>

---

## Вибір провайдера

| Ключ      | Тип       | Типове значення        | Опис                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider` | `string`  | автовизначення         | ID адаптера вбудовувань, як-от `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` або `voyage`; також може бути налаштованим `models.providers.<id>`, чий `api` вказує на один із цих адаптерів |
| `model`    | `string`  | типове для провайдера  | Назва моделі вбудовувань                                                                                                                                                                                                             |
| `fallback` | `string`  | `"none"`               | ID резервного адаптера, коли основний не спрацьовує                                                                                                                                                                                   |
| `enabled`  | `boolean` | `true`                 | Увімкнути або вимкнути пошук у пам’яті                                                                                                                                                                                               |

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
    Вибирається, якщо ланцюжок облікових даних AWS SDK визначається (роль інстанса, ключі доступу, профіль, SSO, web identity або спільна конфігурація).
  </Step>
</Steps>

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Власні ідентифікатори провайдерів

`memorySearch.provider` може вказувати на власний запис `models.providers.<id>`. OpenClaw визначає власника `api` цього провайдера для адаптера вбудовувань, зберігаючи власний ID провайдера для endpoint, автентифікації та обробки префікса моделі. Це дає змогу конфігураціям із кількома GPU або кількома хостами виділити вбудовування пам’яті для конкретного локального endpoint:

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

Віддалені вбудовування потребують ключ API. Натомість Bedrock використовує стандартний ланцюжок облікових даних AWS SDK (ролі інстансів, SSO, ключі доступу).

| Провайдер      | Змінна середовища                                | Ключ конфігурації                 |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | Ланцюжок облікових даних AWS                       | Ключ API не потрібен                |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профіль автентифікації через device login |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
OAuth Codex покриває лише chat/completions і не задовольняє запити вбудовувань.
</Note>

---

## Конфігурація віддаленого endpoint

Для власних OpenAI-сумісних endpoint або перевизначення типових значень провайдера:

<ParamField path="remote.baseUrl" type="string">
  Власна базова URL-адреса API.
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
    | Ключ                   | Тип      | Типове значення       | Опис                                      |
    | ---------------------- | -------- | ---------------------- | ----------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Для Embedding 2: 768, 1536 або 3072       |

    <Warning>
    Зміна моделі або `outputDimensionality` запускає автоматичне повне переіндексування.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-сумісні типи вводу">
    OpenAI-сумісні endpoint вбудовувань можуть увімкнути специфічні для провайдера поля запиту `input_type`. Це корисно для асиметричних моделей вбудовувань, які потребують різних міток для вбудовувань запитів і документів.

    | Ключ                | Тип      | Типове значення | Опис                                               |
    | ------------------- | -------- | --------------- | -------------------------------------------------- |
    | `inputType`         | `string` | не задано       | Спільний `input_type` для вбудовувань запитів і документів |
    | `queryInputType`    | `string` | не задано       | `input_type` під час запиту; перевизначає `inputType` |
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

    Зміна цих значень впливає на ідентичність кешу вбудовувань для пакетного індексування провайдера, і після неї слід виконати переіндексування пам’яті, якщо upstream-модель по-різному обробляє ці мітки.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock використовує стандартний ланцюжок облікових даних AWS SDK — ключі API не потрібні. Якщо OpenClaw працює на EC2 з роллю інстанса, для якої ввімкнено Bedrock, просто задайте провайдера й модель:

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
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ID моделі вбудовувань Bedrock |
    | `outputDimensionality` | `number` | типове для моделі            | Для Titan V2: 256, 512 або 1024 |

    **Підтримувані моделі** (з визначенням сімейства та типовими розмірностями):

    | ID моделі                                  | Провайдер  | Типові розмірності | Налаштовувані розмірності |
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
    3. Облікові дані токена web identity
    4. Спільні облікові дані та файли конфігурації
    5. Облікові дані метаданих ECS або EC2

    Регіон визначається з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` провайдера `amazon-bedrock` або типово має значення `us-east-1`.

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
  <Accordion title="Локально (GGUF + node-llama-cpp)">
    | Ключ                  | Тип                | Типово                 | Опис                                                                                                                                                                                                                                                                                                                         |
    | --------------------- | ------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | автоматично завантажується | Шлях до файлу моделі GGUF                                                                                                                                                                                                                                                                                                    |
    | `local.modelCacheDir` | `string`           | типово для node-llama-cpp | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                                        |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Розмір контекстного вікна для контексту ембедингів. 4096 покриває типові фрагменти (128–512 токенів), обмежуючи VRAM поза вагами. Зменште до 1024–2048 на обмежених хостах. `"auto"` використовує навчений максимум моделі — не рекомендовано для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 ГБ VRAM проти ~8.8 ГБ за 4096). |

    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 ГБ, автоматично завантажується). Потребує нативного складання: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використовуйте окремий CLI, щоб перевірити той самий шлях провайдера, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Якщо `provider` дорівнює `auto`, `local` вибирається лише тоді, коли `local.modelPath` вказує на наявний локальний файл. Посилання на моделі `hf:` і HTTP(S) усе ще можна використовувати явно з `provider: "local"`, але вони не змушують `auto` вибирати локальний провайдер до того, як модель стане доступною на диску.

  </Accordion>
</AccordionGroup>

### Таймаут вбудованих ембедингів

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначає таймаут для вбудованих пакетів ембедингів під час індексування пам’яті.

Якщо не задано, використовується типове значення провайдера: 600 секунд для локальних/самостійно розміщених провайдерів, як-от `local`, `ollama` і `lmstudio`, та 120 секунд для розміщених провайдерів. Збільште це значення, коли локальні пакети ембедингів, обмежені CPU, працюють коректно, але повільно.
</ParamField>

---

## Конфігурація гібридного пошуку

Усе в `memorySearch.query.hybrid`:

| Ключ                 | Тип       | Типово | Опис                                   |
| -------------------- | --------- | ------ | -------------------------------------- |
| `enabled`            | `boolean` | `true` | Увімкнути гібридний пошук BM25 + векторний пошук |
| `vectorWeight`       | `number`  | `0.7`  | Вага для векторних оцінок (0-1)        |
| `textWeight`         | `number`  | `0.3`  | Вага для оцінок BM25 (0-1)             |
| `candidateMultiplier` | `number` | `4`    | Множник розміру пулу кандидатів        |

<Tabs>
  <Tab title="MMR (різноманітність)">
    | Ключ          | Тип       | Типово  | Опис                                             |
    | ------------- | --------- | ------- | ------------------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Увімкнути повторне ранжування MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = максимальна різноманітність, 1 = максимальна релевантність |
  </Tab>
  <Tab title="Часове згасання (свіжість)">
    | Ключ                         | Тип       | Типово | Опис                         |
    | ---------------------------- | --------- | ------ | ---------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Увімкнути підсилення свіжості |
    | `temporalDecay.halfLifeDays` | `number`  | `30`   | Оцінка зменшується вдвічі кожні N днів |

    Вічнозелені файли (`MEMORY.md`, файли без дат у `memory/`) ніколи не згасають.

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

Шляхи можуть бути абсолютними або відносними до робочого простору. Каталоги рекурсивно скануються на файли `.md`. Обробка символьних посилань залежить від активного бекенда: вбудований рушій ігнорує символьні посилання, тоді як QMD дотримується поведінки базового сканера QMD.

Для пошуку транскриптів між агентами в межах агента використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові колекції мають ту саму форму `{ path, name, pattern? }`, але об’єднуються окремо для кожного агента й можуть зберігати явні спільні імена, коли шлях вказує за межі поточного робочого простору. Якщо той самий розв’язаний шлях з’являється і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD залишає перший запис і пропускає дублікат.

---

## Мультимодальна пам’ять (Gemini)

Індексуйте зображення й аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ                      | Тип        | Типово     | Опис                                      |
| ------------------------- | ---------- | ---------- | ----------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Увімкнути мультимодальну індексацію       |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` або `["all"]`    |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Максимальний розмір файлу для індексації  |

<Note>
Застосовується лише до файлів у `extraPaths`. Типові корені пам'яті залишаються лише Markdown. Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш вбудовувань

| Ключ              | Тип       | За замовчуванням | Опис                               |
| ----------------- | --------- | ---------------- | ---------------------------------- |
| `cache.enabled`   | `boolean` | `false`          | Кешувати вбудовування фрагментів у SQLite |
| `cache.maxEntries` | `number` | `50000`          | Максимум кешованих вбудовувань     |

Запобігає повторному вбудовуванню незміненого тексту під час повторного індексування або оновлень транскриптів.

---

## Пакетне індексування

| Ключ                          | Тип       | За замовчуванням | Опис                         |
| ----------------------------- | --------- | ---------------- | ---------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`              | Паралельні вбудовування inline |
| `remote.batch.enabled`        | `boolean` | `false`          | Увімкнути API пакетних вбудовувань |
| `remote.batch.concurrency`    | `number`  | `2`              | Паралельні пакетні завдання   |
| `remote.batch.wait`           | `boolean` | `true`           | Чекати завершення пакета      |
| `remote.batch.pollIntervalMs` | `number`  | --               | Інтервал опитування           |
| `remote.batch.timeoutMinutes` | `number`  | --               | Тайм-аут пакета               |

Доступно для `openai`, `gemini` і `voyage`. Пакетна обробка OpenAI зазвичай найшвидша й найдешевша для великих зворотних заповнень.

`remote.nonBatchConcurrency` керує викликами вбудовувань inline, які використовують локальні/самостійно розміщені провайдери та розміщені провайдери, коли пакетні API провайдера не активні. Ollama за замовчуванням використовує `1` для непакетного індексування, щоб не перевантажувати менші локальні хости; установіть вище значення на більших машинах.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує тайм-аутом для викликів вбудовувань inline.

---

## Пошук у пам'яті сесій (експериментально)

Індексуйте транскрипти сесій і показуйте їх через `memory_search`:

| Ключ                          | Тип        | За замовчуванням | Опис                                      |
| ----------------------------- | ---------- | ---------------- | ----------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`          | Увімкнути індексування сесій              |
| `sources`                     | `string[]` | `["memory"]`     | Додайте `"sessions"`, щоб включити транскрипти |
| `sync.sessions.deltaBytes`    | `number`   | `100000`         | Порогове значення байтів для повторного індексування |
| `sync.sessions.deltaMessages` | `number`   | `50`             | Порогове значення повідомлень для повторного індексування |

<Warning>
Індексування сесій є опційним і виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сесій зберігаються на диску, тож вважайте доступ до файлової системи межею довіри.
</Warning>

---

## Векторне прискорення SQLite (sqlite-vec)

| Ключ                         | Тип       | За замовчуванням | Опис                                |
| ---------------------------- | --------- | ---------------- | ----------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`           | Використовувати sqlite-vec для векторних запитів |
| `store.vector.extensionPath` | `string`  | вбудований       | Перевизначити шлях sqlite-vec       |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до косинусної подібності в процесі.

---

## Сховище індексу

| Ключ                  | Тип      | За замовчуванням                     | Опис                                        |
| --------------------- | -------- | ------------------------------------ | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | Токенізатор FTS5 (`unicode61` або `trigram`) |

---

## Конфігурація бекенда QMD

Установіть `memory.backend = "qmd"`, щоб увімкнути. Усі налаштування QMD розташовані в `memory.qmd`:

| Ключ                     | Тип       | За замовчуванням | Опис                                                                                  |
| ------------------------ | --------- | ---------------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`            | Шлях до виконуваного файлу QMD; установіть абсолютний шлях, коли службовий `PATH` відрізняється від вашої оболонки |
| `searchMode`             | `string`  | `search`         | Команда пошуку: `search`, `vsearch`, `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`           | Автоматично індексувати `MEMORY.md` + `memory/**/*.md`                                |
| `paths[]`                | `array`   | --               | Додаткові шляхи: `{ name, path, pattern? }`                                           |
| `sessions.enabled`       | `boolean` | `false`          | Індексувати транскрипти сесій                                                        |
| `sessions.retentionDays` | `number`  | --               | Зберігання транскриптів                                                               |
| `sessions.exportDir`     | `string`  | --               | Каталог експорту                                                                      |

`searchMode: "search"` є лише лексичним/BM25. OpenClaw не запускає перевірки готовності семантичних векторів або обслуговування QMD-ембедингів для цього режиму, зокрема під час `memory status --deep`; `vsearch` і `query` надалі потребують готовності QMD-векторів та ембедингів.

OpenClaw надає перевагу поточним формам колекцій QMD і запитів MCP, але зберігає роботу старіших випусків QMD, за потреби пробуючи сумісні прапорці шаблонів колекцій і старіші назви інструментів MCP. Коли QMD оголошує підтримку кількох фільтрів колекцій, колекції з одного джерела шукаються одним процесом QMD; старіші збірки QMD зберігають шлях сумісності для кожної колекції. Одне джерело означає, що колекції постійної памʼяті групуються разом, тоді як колекції стенограм сесій залишаються окремою групою, щоб диверсифікація джерел і надалі мала обидва входи.

<Note>
Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо потрібно глобально перевизначити моделі QMD, задайте змінні середовища, як-от `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі виконання Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Розклад оновлення">
    | Ключ                     | Тип       | Типове значення | Опис                                           |
    | ------------------------ | --------- | --------------- | ---------------------------------------------- |
    | `update.interval`        | `string`  | `5m`            | Інтервал оновлення                             |
    | `update.debounceMs`      | `number`  | `15000`         | Усунення брязкоту змін файлів                  |
    | `update.onBoot`          | `boolean` | `true`          | Оновлювати під час запуску                     |
    | `update.waitForBootSync` | `boolean` | `false`         | Блокувати запуск до завершення оновлення       |
    | `update.embedInterval`   | `string`  | --              | Окрема періодичність ембедингів                |
    | `update.commandTimeoutMs` | `number` | --              | Тайм-аут для команд QMD                        |
    | `update.updateTimeoutMs` | `number`  | --              | Тайм-аут для операцій оновлення QMD            |
    | `update.embedTimeoutMs`  | `number`  | --              | Тайм-аут для операцій ембедингів QMD           |
  </Accordion>
  <Accordion title="Ліміти">
    | Ключ                      | Тип      | Типове значення | Опис                                      |
    | ------------------------- | -------- | --------------- | ----------------------------------------- |
    | `limits.maxResults`       | `number` | `6`             | Максимальна кількість результатів пошуку  |
    | `limits.maxSnippetChars`  | `number` | --              | Обмежити довжину фрагмента                |
    | `limits.maxInjectedChars` | `number` | --              | Обмежити загальну кількість вставлених символів |
    | `limits.timeoutMs`        | `number` | `4000`          | Тайм-аут пошуку                           |
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

    Постачене типове значення дозволяє прямі сесії та сесії каналів, водночас усе ще забороняючи групи.

    Типове значення — лише DM. `match.keyPrefix` зіставляється з нормалізованим ключем сесії; `match.rawKeyPrefix` зіставляється з необробленим ключем, включно з `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитування">
    `memory.citations` застосовується до всіх бекендів:

    | Значення        | Поведінка                                                   |
    | --------------- | ----------------------------------------------------------- |
    | `auto` (типово) | Додавати нижній колонтитул `Source: <path#line>` у фрагменти |
    | `on`            | Завжди додавати нижній колонтитул                           |
    | `off`           | Не додавати нижній колонтитул (шлях усе одно передається агенту внутрішньо) |

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

| Ключ        | Тип       | Типове значення | Опис                                                   |
| ----------- | --------- | --------------- | ------------------------------------------------------ |
| `enabled`   | `boolean` | `false`         | Повністю ввімкнути або вимкнути dreaming               |
| `frequency` | `string`  | `0 3 * * *`     | Необовʼязкова cron-періодичність для повного проходу dreaming |
| `model`     | `string`  | типова модель   | Необовʼязкове перевизначення моделі під-агента Dream Diary |

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
- Dreaming записує людиночитний наративний вихід у `DREAMS.md` (або наявний `dreams.md`).
- `dreaming.model` використовує наявний шлюз довіри під-агента Plugin; задайте `plugins.entries.memory-core.subagent.allowModelOverride: true`, перш ніж вмикати його.
- Dream Diary повторює спробу один раз із типовою моделлю сесії, коли налаштована модель недоступна. Помилки довіри або allowlist журналюються й не повторюються непомітно.
- Політика фаз light/deep/REM і порогові значення є внутрішньою поведінкою, а не користувацькою конфігурацією.

</Note>

## Повʼязане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Огляд памʼяті](/uk/concepts/memory)
- [Пошук у памʼяті](/uk/concepts/memory-search)
