---
read_when:
    - Ви хочете налаштувати провайдерів пошуку в пам’яті або моделі embedding
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часове згасання
    - Ви хочете ввімкнути мультимодальне індексування пам’яті
summary: Усі параметри конфігурації для пошуку в пам’яті, провайдерів embedding, QMD, гібридного пошуку та мультимодального індексування
title: Довідник з конфігурації пам’яті
x-i18n:
    generated_at: "2026-04-06T00:48:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0de0b85125443584f4e575cf673ca8d9bd12ecd849d73c537f4a17545afa93fd
    source_path: reference/memory-config.md
    workflow: 15
---

# Довідник з конфігурації пам’яті

На цій сторінці перелічено всі параметри конфігурації пошуку в пам’яті OpenClaw. Для
концептуальних оглядів дивіться:

- [Огляд пам’яті](/uk/concepts/memory) -- як працює пам’ять
- [Вбудований рушій](/uk/concepts/memory-builtin) -- типовий бекенд SQLite
- [Рушій QMD](/uk/concepts/memory-qmd) -- локальний sidecar
- [Пошук у пам’яті](/uk/concepts/memory-search) -- конвеєр пошуку та налаштування

Усі налаштування пошуку в пам’яті розміщені в `agents.defaults.memorySearch` у
`openclaw.json`, якщо не зазначено інше.

---

## Вибір провайдера

| Key        | Type      | Default          | Description                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `provider` | `string`  | визначається автоматично    | ID адаптера embedding: `openai`, `gemini`, `voyage`, `mistral`, `bedrock`, `ollama`, `local` |
| `model`    | `string`  | типовий для провайдера | Назва моделі embedding                                                                        |
| `fallback` | `string`  | `"none"`         | ID резервного адаптера, якщо основний зазнає збою                                                  |
| `enabled`  | `boolean` | `true`           | Увімкнути або вимкнути пошук у пам’яті                                                             |

### Порядок автовизначення

Коли `provider` не задано, OpenClaw вибирає перший доступний:

1. `local` -- якщо налаштовано `memorySearch.local.modelPath` і файл існує.
2. `openai` -- якщо вдається визначити ключ OpenAI.
3. `gemini` -- якщо вдається визначити ключ Gemini.
4. `voyage` -- якщо вдається визначити ключ Voyage.
5. `mistral` -- якщо вдається визначити ключ Mistral.
6. `bedrock` -- якщо спрацьовує ланцюжок облікових даних AWS SDK (роль інстансу, ключі доступу, профіль, SSO, web identity або спільна конфігурація).

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Визначення API-ключа

Для віддалених embedding потрібен API-ключ. Натомість Bedrock використовує типовий
ланцюжок облікових даних AWS SDK (ролі інстансу, SSO, ключі доступу).

| Provider | Env var                        | Config key                        |
| -------- | ------------------------------ | --------------------------------- |
| OpenAI   | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`  |
| Gemini   | `GEMINI_API_KEY`               | `models.providers.google.apiKey`  |
| Voyage   | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`  |
| Mistral  | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey` |
| Bedrock  | ланцюжок облікових даних AWS           | API-ключ не потрібен                 |
| Ollama   | `OLLAMA_API_KEY` (заповнювач) | --                                |

Codex OAuth покриває лише chat/completions і не підходить для запитів
embedding.

---

## Конфігурація віддаленої кінцевої точки

Для власних OpenAI-сумісних кінцевих точок або перевизначення типових налаштувань провайдера:

| Key              | Type     | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl` | `string` | Власна базова URL-адреса API                                |
| `remote.apiKey`  | `string` | Перевизначення API-ключа                                   |
| `remote.headers` | `object` | Додаткові HTTP-заголовки (об’єднуються з типовими налаштуваннями провайдера) |

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

## Конфігурація для Gemini

| Key                    | Type     | Default                | Description                                |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Для Embedding 2: 768, 1536 або 3072        |

<Warning>
Зміна моделі або `outputDimensionality` запускає автоматичне повне переіндексування.
</Warning>

---

## Конфігурація embedding для Bedrock

Bedrock використовує типовий ланцюжок облікових даних AWS SDK -- API-ключі не потрібні.
Якщо OpenClaw працює на EC2 з роллю інстансу, у якій увімкнено Bedrock, просто задайте
провайдера та модель:

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
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ID моделі embedding Bedrock  |
| `outputDimensionality` | `number` | типовий для моделі                  | Для Titan V2: 256, 512 або 1024 |

### Підтримувані моделі

Підтримуються такі моделі (з визначенням сімейства та типовими
розмірностями):

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

Варіанти з суфіксом пропускної здатності (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують
конфігурацію базової моделі.

### Автентифікація

Автентифікація Bedrock використовує стандартний порядок визначення облікових даних AWS SDK:

1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Кеш токенів SSO
3. Облікові дані токена web identity
4. Спільні файли облікових даних і конфігурації
5. Облікові дані метаданих ECS або EC2

Регіон визначається з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl`
провайдера `amazon-bedrock` або за замовчуванням використовується `us-east-1`.

### Дозволи IAM

Ролі або користувачу IAM потрібне:

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

---

## Конфігурація локального embedding

| Key                   | Type     | Default                | Description                     |
| --------------------- | -------- | ---------------------- | ------------------------------- |
| `local.modelPath`     | `string` | завантажується автоматично        | Шлях до файлу моделі GGUF         |
| `local.modelCacheDir` | `string` | типовий каталог node-llama-cpp | Каталог кешу для завантажених моделей |

Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 ГБ, завантажується автоматично).
Потрібна нативна збірка: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

---

## Конфігурація гібридного пошуку

Усе знаходиться в `memorySearch.query.hybrid`:

| Key                   | Type      | Default | Description                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Увімкнути гібридний пошук BM25 + vector |
| `vectorWeight`        | `number`  | `0.7`   | Вага для оцінок vector (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Вага для оцінок BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Множник розміру пулу кандидатів     |

### MMR (різноманітність)

| Key           | Type      | Default | Description                          |
| ------------- | --------- | ------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false` | Увімкнути повторне ранжування MMR                |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = максимальна різноманітність, 1 = максимальна релевантність |

### Часове згасання (актуальність)

| Key                          | Type      | Default | Description               |
| ---------------------------- | --------- | ------- | ------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | Увімкнути буст актуальності      |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | Оцінка зменшується вдвічі кожні N днів |

Для постійно актуальних файлів (`MEMORY.md`, файли без дати в `memory/`) згасання ніколи не застосовується.

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

Шляхи можуть бути абсолютними або відносними до робочого простору. Каталоги скануються
рекурсивно на наявність файлів `.md`. Обробка символьних посилань залежить від активного бекенду:
вбудований рушій ігнорує символьні посилання, тоді як QMD дотримується поведінки
сканера QMD нижчого рівня.

Для пошуку транскриптів між агентами в межах агента використовуйте
`agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`.
Ці додаткові колекції мають ту саму форму `{ path, name, pattern? }`, але
об’єднуються для кожного агента окремо й можуть зберігати явні спільні назви, коли шлях
вказує за межі поточного робочого простору.
Якщо той самий визначений шлях з’являється і в `memory.qmd.paths`, і в
`memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає
дублікат.

---

## Мультимодальна пам’ять (Gemini)

Індексуйте зображення й аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Key                       | Type       | Default    | Description                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Увімкнути мультимодальне індексування             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Максимальний розмір файлу для індексування             |

Застосовується лише до файлів у `extraPaths`. Типові кореневі шляхи пам’яті залишаються лише для Markdown.
Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш embedding

| Key                | Type      | Default | Description                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Кешувати embedding фрагментів у SQLite |
| `cache.maxEntries` | `number`  | `50000` | Максимальна кількість кешованих embedding            |

Запобігає повторному створенню embedding для незмінного тексту під час переіндексації або оновлення транскриптів.

---

## Пакетне індексування

| Key                           | Type      | Default | Description                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Увімкнути API пакетного embedding |
| `remote.batch.concurrency`    | `number`  | `2`     | Паралельні пакетні завдання        |
| `remote.batch.wait`           | `boolean` | `true`  | Очікувати завершення пакета  |
| `remote.batch.pollIntervalMs` | `number`  | --      | Інтервал опитування              |
| `remote.batch.timeoutMinutes` | `number`  | --      | Тайм-аут пакета              |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай
найшвидший і найдешевший для великих заповнень історичних даних.

---

## Пошук у пам’яті сеансів (експериментально)

Індексуйте транскрипти сеансів і показуйте їх через `memory_search`:

| Key                           | Type       | Default      | Description                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Увімкнути індексування сеансів                 |
| `sources`                     | `string[]` | `["memory"]` | Додайте `"sessions"`, щоб включити транскрипти |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Поріг байтів для переіндексації              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Поріг повідомлень для переіндексації           |

Індексація сеансів вмикається явно й виконується асинхронно. Результати можуть бути трохи
застарілими. Журнали сеансів зберігаються на диску, тому вважайте доступ до файлової
системи межею довіри.

---

## Прискорення векторів SQLite (sqlite-vec)

| Key                          | Type      | Default | Description                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Використовувати sqlite-vec для vector-запитів |
| `store.vector.extensionPath` | `string`  | bundled | Перевизначити шлях до sqlite-vec          |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до in-process
косинусної подібності.

---

## Сховище індексу

| Key                   | Type     | Default                               | Description                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Токенайзер FTS5 (`unicode61` або `trigram`)   |

---

## Конфігурація бекенду QMD

Установіть `memory.backend = "qmd"`, щоб увімкнути його. Усі налаштування QMD розміщені в
`memory.qmd`:

| Key                      | Type      | Default  | Description                                  |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | Шлях до виконуваного файлу QMD                          |
| `searchMode`             | `string`  | `search` | Команда пошуку: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Автоматично індексувати `MEMORY.md` + `memory/**/*.md`    |
| `paths[]`                | `array`   | --       | Додаткові шляхи: `{ name, path, pattern? }`      |
| `sessions.enabled`       | `boolean` | `false`  | Індексувати транскрипти сеансів                    |
| `sessions.retentionDays` | `number`  | --       | Термін зберігання транскриптів                         |
| `sessions.exportDir`     | `string`  | --       | Каталог експорту                             |

OpenClaw віддає перевагу поточній колекції QMD і формам запитів MCP, але зберігає
працездатність старіших випусків QMD, використовуючи резервний перехід до застарілих прапорців колекцій `--mask`
і старіших назв інструментів MCP, коли це потрібно.

Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо вам потрібно
глобально перевизначити моделі QMD, задайте змінні середовища, такі як
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі
виконання gateway.

### Розклад оновлення

| Key                       | Type      | Default | Description                           |
| ------------------------- | --------- | ------- | ------------------------------------- |
| `update.interval`         | `string`  | `5m`    | Інтервал оновлення                      |
| `update.debounceMs`       | `number`  | `15000` | Debounce для змін файлів                 |
| `update.onBoot`           | `boolean` | `true`  | Оновлювати під час запуску                    |
| `update.waitForBootSync`  | `boolean` | `false` | Блокувати запуск до завершення оновлення |
| `update.embedInterval`    | `string`  | --      | Окремий інтервал для embedding                |
| `update.commandTimeoutMs` | `number`  | --      | Тайм-аут для команд QMD              |
| `update.updateTimeoutMs`  | `number`  | --      | Тайм-аут для операцій оновлення QMD     |
| `update.embedTimeoutMs`   | `number`  | --      | Тайм-аут для операцій embedding QMD      |

### Обмеження

| Key                       | Type     | Default | Description                |
| ------------------------- | -------- | ------- | -------------------------- |
| `limits.maxResults`       | `number` | `6`     | Максимальна кількість результатів пошуку         |
| `limits.maxSnippetChars`  | `number` | --      | Обмежити довжину фрагмента       |
| `limits.maxInjectedChars` | `number` | --      | Обмежити загальну кількість вставлених символів |
| `limits.timeoutMs`        | `number` | `4000`  | Тайм-аут пошуку             |

### Область дії

Керує тим, які сеанси можуть отримувати результати пошуку QMD. Та сама схема, що і в
[`session.sendPolicy`](/uk/gateway/configuration-reference#session):

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

Типове значення -- лише прямі повідомлення. `match.keyPrefix` відповідає нормалізованому ключу сеансу;
`match.rawKeyPrefix` відповідає сирому ключу, включно з `agent:<id>:`.

### Цитати

`memory.citations` застосовується до всіх бекендів:

| Value            | Behavior                                            |
| ---------------- | --------------------------------------------------- |
| `auto` (default) | Додавати нижній колонтитул `Source: <path#line>` у фрагменти    |
| `on`             | Завжди додавати нижній колонтитул                               |
| `off`            | Не додавати нижній колонтитул (шлях усе одно передається агенту внутрішньо) |

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

## Dreaming (експериментально)

Dreaming налаштовується в `plugins.entries.memory-core.config.dreaming`,
а не в `agents.defaults.memorySearch`.

Dreaming виконується як один запланований цикл і використовує внутрішні фази light/deep/REM як
деталь реалізації.

Для концептуальної поведінки та slash-команд дивіться [Dreaming](/uk/concepts/dreaming).

### Налаштування користувача

| Key         | Type      | Default     | Description                                       |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Повністю ввімкнути або вимкнути dreaming               |
| `frequency` | `string`  | `0 3 * * *` | Необов’язкова cron-періодичність для повного циклу dreaming |

### Приклад

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

Примітки:

- Dreaming записує машинний стан у `memory/.dreams/`.
- Dreaming записує читабельний для людини наративний вивід у `DREAMS.md` (або наявний `dreams.md`).
- Політика й пороги фаз light/deep/REM є внутрішньою поведінкою, а не користувацькою конфігурацією.
