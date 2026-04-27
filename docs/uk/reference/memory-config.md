---
read_when:
    - Ви хочете налаштувати провайдерів пошуку в пам’яті або моделі ембедингів
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часове згасання
    - Ви хочете увімкнути мультимодальну індексацію пам’яті
sidebarTitle: Memory config
summary: Усі параметри конфігурації для пошуку в пам’яті, провайдерів ембедингів, QMD, гібридного пошуку та мультимодальної індексації
title: Довідник із конфігурації пам’яті
x-i18n:
    generated_at: "2026-04-27T13:13:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e063a62b44b7d4fa2df017301cf675678ab71a65f53c78af85f0aa925bb79277
    source_path: reference/memory-config.md
    workflow: 15
---

На цій сторінці перелічено всі параметри конфігурації для пошуку в пам’яті OpenClaw. Для концептуальних оглядів див.:

<CardGroup cols={2}>
  <Card title="Огляд пам’яті" href="/uk/concepts/memory">
    Як працює пам’ять.
  </Card>
  <Card title="Вбудований рушій" href="/uk/concepts/memory-builtin">
    Типовий бекенд SQLite.
  </Card>
  <Card title="Рушій QMD" href="/uk/concepts/memory-qmd">
    Локально-орієнтований sidecar.
  </Card>
  <Card title="Пошук у пам’яті" href="/uk/concepts/memory-search">
    Конвеєр пошуку та налаштування.
  </Card>
  <Card title="Active Memory" href="/uk/concepts/active-memory">
    Підагент пам’яті для інтерактивних сеансів.
  </Card>
</CardGroup>

Усі налаштування пошуку в пам’яті знаходяться в `agents.defaults.memorySearch` у `openclaw.json`, якщо не вказано інше.

<Note>
Якщо ви шукаєте перемикач функції **active memory** і конфігурацію підагента, вони знаходяться в `plugins.entries.active-memory`, а не в `memorySearch`.

Active memory використовує двоетапну модель:

1. plugin має бути увімкнений і націлений на поточний id агента
2. запит має бути придатним інтерактивним постійним сеансом чату

Див. [Active Memory](/uk/concepts/active-memory) щодо моделі активації, конфігурації, якою керує plugin, збереження транскриптів і безпечної схеми розгортання.
</Note>

---

## Вибір провайдера

| Ключ       | Тип       | Типово           | Опис                                                                                                          |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | автоматично визначається | ID адаптера ембедингів: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | типове значення провайдера | Назва моделі ембедингів                                                                                  |
| `fallback` | `string`  | `"none"`         | ID резервного адаптера, якщо основний завершується помилкою                                                   |
| `enabled`  | `boolean` | `true`           | Увімкнути або вимкнути пошук у пам’яті                                                                        |

### Порядок автовизначення

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
  <Step title="bedrock">
    Вибирається, якщо ланцюжок облікових даних AWS SDK успішно визначається (роль екземпляра, ключі доступу, профіль, SSO, веб-ідентичність або спільна конфігурація).
  </Step>
</Steps>

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Визначення API-ключа

Для віддалених ембедингів потрібен API-ключ. Натомість Bedrock використовує типовий ланцюжок облікових даних AWS SDK (ролі екземпляра, SSO, ключі доступу).

| Провайдер      | Змінна середовища                                 | Ключ конфігурації                |
| -------------- | ------------------------------------------------- | -------------------------------- |
| Bedrock        | ланцюжок облікових даних AWS                      | API-ключ не потрібен             |
| Gemini         | `GEMINI_API_KEY`                                  | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профіль автентифікації через вхід із пристрою |
| Mistral        | `MISTRAL_API_KEY`                                 | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                     | --                                |
| OpenAI         | `OPENAI_API_KEY`                                  | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                  | `models.providers.voyage.apiKey`  |

<Note>
Codex OAuth покриває лише chat/completions і не задовольняє запити ембедингів.
</Note>

---

## Конфігурація віддаленої кінцевої точки

Для користувацьких OpenAI-сумісних кінцевих точок або перевизначення типових значень провайдера:

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

## Конфігурація для окремих провайдерів

<AccordionGroup>
  <Accordion title="Gemini">
    | Ключ                   | Тип      | Типово                 | Опис                                       |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Також підтримується `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Для Embedding 2: 768, 1536 або 3072        |

    <Warning>
    Зміна моделі або `outputDimensionality` запускає автоматичну повну переіндексацію.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    OpenAI-сумісні кінцеві точки ембедингів можуть використовувати специфічні для провайдера поля запиту `input_type`. Це корисно для асиметричних моделей ембедингів, яким потрібні різні мітки для ембедингів запиту та документа.

    | Ключ                | Тип      | Типово | Опис                                                  |
    | ------------------- | -------- | ------ | ----------------------------------------------------- |
    | `inputType`         | `string` | не задано | Спільний `input_type` для ембедингів запиту й документа   |
    | `queryInputType`    | `string` | не задано | `input_type` під час запиту; перевизначає `inputType`     |
    | `documentInputType` | `string` | не задано | `input_type` для індексу/документа; перевизначає `inputType` |

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

    Зміна цих значень впливає на ідентичність кешу ембедингів для пакетної індексації провайдера, і після цього слід виконати переіндексацію пам’яті, якщо вищерозташована модель по-різному обробляє ці мітки.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock використовує типовий ланцюжок облікових даних AWS SDK — API-ключі не потрібні. Якщо OpenClaw працює на EC2 з роллю екземпляра, у якої ввімкнено Bedrock, просто задайте провайдера і модель:

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

    | Ключ                   | Тип      | Типово                         | Опис                             |
    | ---------------------- | -------- | ------------------------------ | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ID моделі ембедингів Bedrock |
    | `outputDimensionality` | `number` | типове значення моделі         | Для Titan V2: 256, 512 або 1024  |

    **Підтримувані моделі** (із визначенням сімейства та типовими розмірностями):

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

    Варіанти з суфіксом пропускної здатності (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують конфігурацію базової моделі.

    **Автентифікація:** автентифікація Bedrock використовує стандартний порядок визначення облікових даних AWS SDK:

    1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Кеш токенів SSO
    3. Облікові дані токена веб-ідентичності
    4. Спільні файли облікових даних і конфігурації
    5. Облікові дані метаданих ECS або EC2

    Регіон визначається з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` провайдера `amazon-bedrock` або за замовчуванням використовується `us-east-1`.

    **Дозволи IAM:** роль або користувач IAM мають мати:

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
    | Ключ                  | Тип                | Типово                 | Опис                                                                                                                                                                                                                                                                                                                     |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | автоматично завантажується | Шлях до файлу моделі GGUF                                                                                                                                                                                                                                                                                             |
    | `local.modelCacheDir` | `string`           | типове значення node-llama-cpp | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                             |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Розмір контекстного вікна для контексту ембедингів. 4096 охоплює типові фрагменти (128–512 токенів), водночас обмежуючи VRAM, не пов’язану з вагами. Зменште до 1024–2048 на ресурсно обмежених хостах. `"auto"` використовує навчений максимум моделі — не рекомендується для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 ГБ VRAM проти ~8.8 ГБ при 4096). |

    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 ГБ, завантажується автоматично). Потрібна нативна збірка: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використовуйте окремий CLI, щоб перевірити той самий шлях провайдера, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Якщо `provider` має значення `auto`, `local` вибирається лише тоді, коли `local.modelPath` вказує на наявний локальний файл. Посилання на моделі `hf:` і HTTP(S) усе ще можна використовувати явно з `provider: "local"`, але вони не змушують `auto` вибрати local до того, як модель стане доступною на диску.

  </Accordion>
</AccordionGroup>

### Тайм-аут вбудованих ембедингів

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначити тайм-аут для вбудованих пакетів ембедингів під час індексації пам’яті.

Якщо не задано, використовується типове значення провайдера: 600 секунд для локальних/self-hosted провайдерів, таких як `local`, `ollama` і `lmstudio`, та 120 секунд для хостингових провайдерів. Збільшуйте це значення, якщо локальні CPU-обмежені пакети ембедингів працюють коректно, але повільно.
</ParamField>

---

## Конфігурація гібридного пошуку

Усе знаходиться в `memorySearch.query.hybrid`:

| Ключ                  | Тип       | Типово | Опис                               |
| --------------------- | --------- | ------ | ---------------------------------- |
| `enabled`             | `boolean` | `true` | Увімкнути гібридний пошук BM25 + векторний пошук |
| `vectorWeight`        | `number`  | `0.7`  | Вага для векторних оцінок (0-1)    |
| `textWeight`          | `number`  | `0.3`  | Вага для оцінок BM25 (0-1)         |
| `candidateMultiplier` | `number`  | `4`    | Множник розміру пулу кандидатів    |

<Tabs>
  <Tab title="MMR (різноманітність)">
    | Ключ          | Тип       | Типово | Опис                                 |
    | ------------- | --------- | ------ | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Увімкнути повторне ранжування MMR     |
    | `mmr.lambda`  | `number`  | `0.7`  | 0 = максимальна різноманітність, 1 = максимальна релевантність |
  </Tab>
  <Tab title="Temporal decay (актуальність за часом)">
    | Ключ                         | Тип       | Типово | Опис                      |
    | ---------------------------- | --------- | ------ | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Увімкнути буст за новизною |
    | `temporalDecay.halfLifeDays` | `number`  | `30`   | Оцінка зменшується вдвічі кожні N днів |

    Для незмінних файлів (`MEMORY.md`, файли без дат у `memory/`) згасання ніколи не застосовується.

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

| Ключ        | Тип        | Опис                                  |
| ----------- | ---------- | ------------------------------------- |
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

Шляхи можуть бути абсолютними або відносними до робочого простору. Каталоги скануються рекурсивно на наявність файлів `.md`. Обробка символьних посилань залежить від активного бекенда: вбудований рушій ігнорує символьні посилання, тоді як QMD дотримується поведінки базового сканера QMD.

Для пошуку транскриптів між агентами в межах області агента використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові колекції мають ту саму форму `{ path, name, pattern? }`, але об’єднуються для кожного агента окремо й можуть зберігати явно задані спільні назви, коли шлях указує за межі поточного робочого простору. Якщо той самий розв’язаний шлях з’являється і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає дублікат.

---

## Мультимодальна пам’ять (Gemini)

Індексуйте зображення й аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ                      | Тип        | Типово     | Опис                                  |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Увімкнути мультимодальну індексацію   |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Максимальний розмір файлу для індексації |

<Note>
Застосовується лише до файлів у `extraPaths`. Типові корені пам’яті залишаються лише для Markdown. Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш ембедингів

| Ключ               | Тип       | Типово | Опис                             |
| ------------------ | --------- | ------ | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Кешувати ембединги фрагментів у SQLite |
| `cache.maxEntries` | `number`  | `50000` | Максимальна кількість кешованих ембедингів |

Запобігає повторному створенню ембедингів для незмінного тексту під час переіндексації або оновлень транскриптів.

---

## Пакетна індексація

| Ключ                          | Тип       | Типово | Опис                     |
| ----------------------------- | --------- | ------ | ------------------------ |
| `remote.batch.enabled`        | `boolean` | `false` | Увімкнути API пакетних ембедингів |
| `remote.batch.concurrency`    | `number`  | `2`    | Паралельні пакетні завдання |
| `remote.batch.wait`           | `boolean` | `true` | Очікувати завершення пакета |
| `remote.batch.pollIntervalMs` | `number`  | --     | Інтервал опитування       |
| `remote.batch.timeoutMinutes` | `number`  | --     | Тайм-аут пакета           |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай є найшвидшим і найдешевшим для великих заповнень.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує вбудованими викликами ембедингів, що використовуються локальними/self-hosted провайдерами та хостинговими провайдерами, коли API пакетної обробки провайдера не активні.

---

## Пошук у пам’яті сеансів (експериментально)

Індексуйте транскрипти сеансів і показуйте їх через `memory_search`:

| Ключ                        | Тип        | Типово       | Опис                                     |
| --------------------------- | ---------- | ------------ | ---------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Увімкнути індексацію сеансів             |
| `sources`                     | `string[]` | `["memory"]` | Додайте `"sessions"`, щоб включити транскрипти |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Поріг байтів для переіндексації          |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Поріг повідомлень для переіндексації     |

<Warning>
Індексація сеансів вмикається за бажанням і виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сеансів зберігаються на диску, тому вважайте доступ до файлової системи межею довіри.
</Warning>

---

## Прискорення векторів SQLite (sqlite-vec)

| Ключ                         | Тип       | Типово | Опис                              |
| ---------------------------- | --------- | ------ | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true` | Використовувати sqlite-vec для векторних запитів |
| `store.vector.extensionPath` | `string`  | bundled | Перевизначити шлях до sqlite-vec  |

Коли sqlite-vec недоступний, OpenClaw автоматично переходить до обчислення косинусної схожості в процесі.

---

## Сховище індексу

| Ключ                | Тип      | Типово                                | Опис                                          |
| ------------------- | -------- | ------------------------------------- | --------------------------------------------- |
| `store.path`        | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | Токенізатор FTS5 (`unicode61` або `trigram`)  |

---

## Конфігурація бекенда QMD

Установіть `memory.backend = "qmd"` для ввімкнення. Усі налаштування QMD знаходяться в `memory.qmd`:

| Ключ                     | Тип       | Типово   | Опис                                        |
| ------------------------ | --------- | -------- | ------------------------------------------- |
| `command`                | `string`  | `qmd`    | Шлях до виконуваного файла QMD              |
| `searchMode`             | `string`  | `search` | Команда пошуку: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Автоматично індексувати `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --       | Додаткові шляхи: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`  | Індексувати транскрипти сеансів             |
| `sessions.retentionDays` | `number`  | --       | Термін зберігання транскриптів              |
| `sessions.exportDir`     | `string`  | --       | Каталог експорту                            |

`searchMode: "search"` — це лише лексичний/BM25-пошук. OpenClaw не запускає перевірки готовності семантичних векторів або обслуговування ембедингів QMD для цього режиму, зокрема під час `memory status --deep`; для `vsearch` і `query` і далі потрібні готовність векторів QMD та ембединги.

OpenClaw надає перевагу поточним формам колекцій QMD і запитів MCP, але зберігає працездатність старіших випусків QMD, повертаючись до застарілих прапорців колекцій `--mask` і старіших назв інструментів MCP, коли це потрібно.

<Note>
Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо вам потрібно глобально перевизначити моделі QMD, установіть змінні середовища, такі як `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі виконання Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Графік оновлення">
    | Ключ                      | Тип       | Типово | Опис                                 |
    | ------------------------- | --------- | ------ | ------------------------------------ |
    | `update.interval`         | `string`  | `5m`   | Інтервал оновлення                   |
    | `update.debounceMs`       | `number`  | `15000` | Debounce для змін файлів             |
    | `update.onBoot`           | `boolean` | `true` | Оновлювати під час запуску           |
    | `update.waitForBootSync`  | `boolean` | `false` | Блокувати запуск до завершення оновлення |
    | `update.embedInterval`    | `string`  | --     | Окремий інтервал ембедингів          |
    | `update.commandTimeoutMs` | `number`  | --     | Тайм-аут для команд QMD              |
    | `update.updateTimeoutMs`  | `number`  | --     | Тайм-аут для операцій оновлення QMD  |
    | `update.embedTimeoutMs`   | `number`  | --     | Тайм-аут для операцій ембедингів QMD |
  </Accordion>
  <Accordion title="Ліміти">
    | Ключ                      | Тип      | Типово | Опис                         |
    | ------------------------- | -------- | ------ | ---------------------------- |
    | `limits.maxResults`       | `number` | `6`    | Максимальна кількість результатів пошуку |
    | `limits.maxSnippetChars`  | `number` | --     | Обмежити довжину фрагмента   |
    | `limits.maxInjectedChars` | `number` | --     | Обмежити загальну кількість вставлених символів |
    | `limits.timeoutMs`        | `number` | `4000` | Тайм-аут пошуку              |
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

    Типова конфігурація в постачанні дозволяє прямі сеанси та сеанси каналів, але все одно забороняє групи.

    Типове значення — лише DM. `match.keyPrefix` відповідає нормалізованому ключу сеансу; `match.rawKeyPrefix` відповідає сирому ключу, включно з `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитування">
    `memory.citations` застосовується до всіх бекендів:

    | Значення         | Поведінка                                             |
    | ---------------- | ----------------------------------------------------- |
    | `auto` (типово)  | Додавати нижній колонтитул `Source: <path#line>` у фрагменти |
    | `on`             | Завжди додавати нижній колонтитул                     |
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

Dreaming працює як один запланований прохід і використовує внутрішні фази light/deep/REM як деталь реалізації.

Щодо концептуальної поведінки та slash-команд див. [Dreaming](/uk/concepts/dreaming).

### Налаштування користувача

| Ключ       | Тип       | Типово         | Опис                                                |
| ---------- | --------- | -------------- | --------------------------------------------------- |
| `enabled`   | `boolean` | `false`        | Увімкнути або повністю вимкнути dreaming            |
| `frequency` | `string`  | `0 3 * * *`    | Необов’язковий розклад Cron для повного проходу dreaming |
| `model`     | `string`  | типова модель  | Необов’язкове перевизначення моделі підагента Dream Diary |

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
- Dreaming записує зрозумілий для людини наративний вивід у `DREAMS.md` (або наявний `dreams.md`).
- `dreaming.model` використовує наявний trust gate підагента plugin; установіть `plugins.entries.memory-core.subagent.allowModelOverride: true` перед його ввімкненням.
- Політика фаз light/deep/REM і пороги є внутрішньою поведінкою, а не користувацькою конфігурацією.
</Note>

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Огляд пам’яті](/uk/concepts/memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
