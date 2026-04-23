---
read_when:
    - Ви хочете налаштувати провайдерів memory search або embedding-моделі
    - Ви хочете налаштувати backend QMD
    - Ви хочете налаштувати hybrid search, MMR або temporal decay
    - Ви хочете ввімкнути multimodal indexing для memory
summary: Усі параметри конфігурації для memory search, embedding providers, QMD, hybrid search і multimodal indexing
title: Довідник конфігурації Memory
x-i18n:
    generated_at: "2026-04-23T21:09:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e179b955ee0532805ee254d79217b66c093def534c2ef3952d955b3b05de8ca
    source_path: reference/memory-config.md
    workflow: 15
---

Ця сторінка перелічує всі параметри конфігурації для memory search в OpenClaw. Для
концептуальних оглядів див.:

- [Memory Overview](/uk/concepts/memory) -- як працює memory
- [Builtin Engine](/uk/concepts/memory-builtin) -- типовий backend SQLite
- [QMD Engine](/uk/concepts/memory-qmd) -- локально-орієнтований sidecar
- [Memory Search](/uk/concepts/memory-search) -- конвеєр пошуку та налаштування
- [Active Memory](/uk/concepts/active-memory) -- увімкнення субагента memory для інтерактивних сесій

Усі параметри memory search розміщуються в `agents.defaults.memorySearch` у
`openclaw.json`, якщо не зазначено інше.

Якщо ви шукаєте перемикач функції **active memory** і конфігурацію субагента,
вона розміщена в `plugins.entries.active-memory`, а не в `memorySearch`.

Active memory використовує модель із двома шлюзами:

1. Plugin має бути увімкнений і націлений на поточний id агента
2. Запит має бути придатною інтерактивною постійною чат-сесією

Модель активації, конфігурацію, якою володіє Plugin, збереження транскриптів і безпечний шаблон упровадження див. у [Active Memory](/uk/concepts/active-memory).

---

## Вибір provider

| Ключ      | Тип       | Типове значення | Опис                                                                                                         |
| --------- | --------- | --------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider` | `string` | auto-detected   | id адаптера embedding: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`   | `string`  | provider default | Назва embedding-моделі                                                                                       |
| `fallback` | `string` | `"none"`        | id резервного адаптера, якщо основний завершується помилкою                                                  |
| `enabled` | `boolean` | `true`          | Увімкнути або вимкнути memory search                                                                         |

### Порядок автовизначення

Коли `provider` не задано, OpenClaw вибирає перший доступний варіант:

1. `local` -- якщо налаштовано `memorySearch.local.modelPath` і файл існує.
2. `github-copilot` -- якщо можна розв’язати токен GitHub Copilot (env var або auth profile).
3. `openai` -- якщо можна розв’язати ключ OpenAI.
4. `gemini` -- якщо можна розв’язати ключ Gemini.
5. `voyage` -- якщо можна розв’язати ключ Voyage.
6. `mistral` -- якщо можна розв’язати ключ Mistral.
7. `bedrock` -- якщо ланцюг облікових даних AWS SDK розв’язується (роль екземпляра, ключі доступу, profile, SSO, web identity або спільна конфігурація).

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Розв’язання API-ключа

Віддалені embeddings потребують API-ключа. Натомість Bedrock використовує типовий
ланцюг облікових даних AWS SDK (ролі екземпляра, SSO, ключі доступу).

| Provider       | Env var                                            | Ключ конфігурації                 |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | ланцюг облікових даних AWS                         | API-ключ не потрібен              |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Auth profile через device login   |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

Codex OAuth покриває лише chat/completions і не задовольняє embedding-запити.

---

## Конфігурація віддаленого endpoint

Для власних OpenAI-сумісних endpoint або перевизначення типових значень provider:

| Ключ             | Тип      | Опис                                         |
| ---------------- | -------- | -------------------------------------------- |
| `remote.baseUrl` | `string` | Власний API base URL                         |
| `remote.apiKey`  | `string` | Перевизначення API-ключа                     |
| `remote.headers` | `object` | Додаткові HTTP headers (зливаються з типовими значеннями provider) |

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

## Конфігурація, специфічна для Gemini

| Ключ                   | Тип      | Типове значення         | Опис                                       |
| ---------------------- | -------- | ----------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001`  | Також підтримує `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                  | Для Embedding 2: 768, 1536 або 3072        |

<Warning>
Зміна моделі або `outputDimensionality` запускає автоматичне повне повторне індексування.
</Warning>

---

## Конфігурація embedding для Bedrock

Bedrock використовує типовий ланцюг облікових даних AWS SDK -- API-ключі не потрібні.
Якщо OpenClaw працює на EC2 з роллю екземпляра, у якої ввімкнено Bedrock, просто задайте
provider і модель:

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

| Ключ                   | Тип      | Типове значення               | Опис                              |
| ---------------------- | -------- | ----------------------------- | --------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який id embedding-моделі Bedrock |
| `outputDimensionality` | `number` | model default                 | Для Titan V2: 256, 512 або 1024   |

### Підтримувані моделі

Підтримуються такі моделі (з визначенням сімейства та типовими значеннями розмірностей):

| Model ID                                   | Provider   | Типові розмірності | Налаштовувані розмірності |
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

Варіанти з суфіксами пропускної здатності (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують
конфігурацію базової моделі.

### Автентифікація

Auth Bedrock використовує стандартний порядок розв’язання облікових даних AWS SDK:

1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Кеш токенів SSO
3. Облікові дані web identity token
4. Спільні файли облікових даних і конфігурації
5. Облікові дані ECS або EC2 metadata

Регіон розв’язується з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` provider
`amazon-bedrock` або типово задається як `us-east-1`.

### IAM permissions

Роль або користувач IAM потребують:

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

## Конфігурація локальних embeddings

| Ключ                  | Тип      | Типове значення        | Опис                             |
| --------------------- | -------- | ---------------------- | -------------------------------- |
| `local.modelPath`     | `string` | auto-downloaded        | Шлях до файла моделі GGUF        |
| `local.modelCacheDir` | `string` | типове значення node-llama-cpp | Каталог кешу для завантажених моделей |

Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, auto-downloaded).
Потребує нативного build: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

---

## Конфігурація hybrid search

Усе розміщується в `memorySearch.query.hybrid`:

| Ключ                  | Тип       | Типове значення | Опис                                  |
| --------------------- | --------- | --------------- | ------------------------------------- |
| `enabled`             | `boolean` | `true`          | Увімкнути hybrid BM25 + vector search |
| `vectorWeight`        | `number`  | `0.7`           | Вага для vector-оцінок (0-1)          |
| `textWeight`          | `number`  | `0.3`           | Вага для BM25-оцінок (0-1)            |
| `candidateMultiplier` | `number`  | `4`             | Множник розміру пулу кандидатів       |

### MMR (різноманіття)

| Ключ         | Тип       | Типове значення | Опис                                       |
| ------------ | --------- | --------------- | ------------------------------------------ |
| `mmr.enabled` | `boolean` | `false`         | Увімкнути MMR re-ranking                   |
| `mmr.lambda` | `number`  | `0.7`           | 0 = максимальне різноманіття, 1 = максимальна релевантність |

### Temporal decay (давність)

| Ключ                         | Тип       | Типове значення | Опис                                  |
| ---------------------------- | --------- | --------------- | ------------------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false`         | Увімкнути підсилення за давністю      |
| `temporalDecay.halfLifeDays` | `number`  | `30`            | Оцінка зменшується вдвічі кожні N днів |

Evergreen-файли (`MEMORY.md`, файли без дати в `memory/`) ніколи не піддаються згасанню.

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

## Додаткові шляхи memory

| Ключ        | Тип        | Опис                                      |
| ----------- | ---------- | ----------------------------------------- |
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

Шляхи можуть бути абсолютними або відносними до workspace. Каталоги скануються
рекурсивно на наявність файлів `.md`. Обробка symlink залежить від активного backend:
вбудований engine ігнорує symlink, тоді як QMD дотримується поведінки
базового scanner QMD.

Для agent-scoped пошуку транскриптів між агентами використовуйте
`agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`.
Ці додаткові collections дотримуються тієї самої форми `{ path, name, pattern? }`, але
зливаються для кожного агента окремо й можуть зберігати явні спільні назви, коли шлях
вказує поза поточний workspace.
Якщо той самий розв’язаний шлях з’являється і в `memory.qmd.paths`, і в
`memorySearch.qmd.extraCollections`, QMD залишає перший запис і пропускає
дублікат.

---

## Multimodal memory (Gemini)

Індексуйте зображення й аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ                      | Тип        | Типове значення | Опис                                   |
| ------------------------- | ---------- | --------------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`         | Увімкнути multimodal indexing          |
| `multimodal.modalities`   | `string[]` | --              | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000`      | Максимальний розмір файла для індексації |

Застосовується лише до файлів у `extraPaths`. Типові корені memory і далі підтримують лише Markdown.
Потребує `gemini-embedding-2-preview`. `fallback` має бути `"none"`.

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш embeddings

| Ключ               | Тип       | Типове значення | Опис                               |
| ------------------ | --------- | --------------- | ---------------------------------- |
| `cache.enabled`    | `boolean` | `false`         | Кешувати embeddings чанків у SQLite |
| `cache.maxEntries` | `number`  | `50000`         | Максимум кешованих embeddings      |

Запобігає повторному embedding незміненого тексту під час reindex або оновлень транскриптів.

---

## Пакетна індексація

| Ключ                          | Тип       | Типове значення | Опис                         |
| ----------------------------- | --------- | --------------- | ---------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`         | Увімкнути пакетний API embedding |
| `remote.batch.concurrency`    | `number`  | `2`             | Паралельні пакетні завдання  |
| `remote.batch.wait`           | `boolean` | `true`          | Чекати завершення пакета     |
| `remote.batch.pollIntervalMs` | `number`  | --              | Інтервал опитування          |
| `remote.batch.timeoutMinutes` | `number`  | --              | Тайм-аут пакета              |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай
найшвидший і найдешевший для великих зворотних індексацій.

---

## Memory search сесій (експериментально)

Індексуйте транскрипти сесій і відображайте їх через `memory_search`:

| Ключ                         | Тип        | Типове значення | Опис                                       |
| ---------------------------- | ---------- | --------------- | ------------------------------------------ |
| `experimental.sessionMemory` | `boolean`  | `false`         | Увімкнути індексацію сесій                 |
| `sources`                    | `string[]` | `["memory"]`    | Додайте `"sessions"`, щоб включити транскрипти |
| `sync.sessions.deltaBytes`   | `number`   | `100000`        | Поріг байтів для reindex                   |
| `sync.sessions.deltaMessages`| `number`   | `50`            | Поріг повідомлень для reindex              |

Індексація сесій є opt-in і виконується асинхронно. Результати можуть бути трохи
застарілими. Логи сесій живуть на диску, тому вважайте доступ до файлової системи
межею довіри.

---

## Прискорення векторів SQLite (sqlite-vec)

| Ключ                         | Тип       | Типове значення | Опис                                 |
| ---------------------------- | --------- | --------------- | ------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`          | Використовувати sqlite-vec для vector queries |
| `store.vector.extensionPath` | `string`  | bundled         | Перевизначити шлях до sqlite-vec     |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до cosine
similarity у процесі.

---

## Зберігання індексу

| Ключ                | Тип      | Типове значення                        | Опис                                             |
| ------------------- | -------- | -------------------------------------- | ------------------------------------------------ |
| `store.path`        | `string` | `~/.openclaw/memory/{agentId}.sqlite`  | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | Токенізатор FTS5 (`unicode61` або `trigram`)     |

---

## Конфігурація backend QMD

Установіть `memory.backend = "qmd"`, щоб увімкнути його. Усі параметри QMD розміщуються в
`memory.qmd`:

| Ключ                     | Тип       | Типове значення | Опис                                         |
| ------------------------ | --------- | --------------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`           | Шлях до виконуваного файла QMD               |
| `searchMode`             | `string`  | `search`        | Команда пошуку: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`          | Автоіндексація `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --              | Додаткові шляхи: `{ name, path, pattern? }`  |
| `sessions.enabled`       | `boolean` | `false`         | Індексувати транскрипти сесій                |
| `sessions.retentionDays` | `number`  | --              | Утримання транскриптів                       |
| `sessions.exportDir`     | `string`  | --              | Каталог експорту                             |

OpenClaw надає перевагу поточним формам collection і MCP query у QMD, але
зберігає працездатність старіших випусків QMD, повертаючись до застарілих прапорців collection `--mask`
та старіших назв MCP tools за потреби.

Перевизначення моделей QMD залишаються на стороні QMD, а не в конфігурації OpenClaw. Якщо вам потрібно
глобально перевизначити моделі QMD, задайте змінні середовища, такі як
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у
runtime-середовищі gateway.

### Розклад оновлення

| Ключ                      | Тип       | Типове значення | Опис                                  |
| ------------------------- | --------- | --------------- | ------------------------------------- |
| `update.interval`         | `string`  | `5m`            | Інтервал оновлення                    |
| `update.debounceMs`       | `number`  | `15000`         | Debounce змін файлів                  |
| `update.onBoot`           | `boolean` | `true`          | Оновлювати під час запуску            |
| `update.waitForBootSync`  | `boolean` | `false`         | Блокувати запуск до завершення оновлення |
| `update.embedInterval`    | `string`  | --              | Окремий ритм embed                    |
| `update.commandTimeoutMs` | `number`  | --              | Тайм-аут для команд QMD               |
| `update.updateTimeoutMs`  | `number`  | --              | Тайм-аут для операцій оновлення QMD   |
| `update.embedTimeoutMs`   | `number`  | --              | Тайм-аут для операцій embed QMD       |

### Обмеження

| Ключ                      | Тип      | Типове значення | Опис                           |
| ------------------------- | -------- | --------------- | ------------------------------ |
| `limits.maxResults`       | `number` | `6`             | Максимум результатів пошуку    |
| `limits.maxSnippetChars`  | `number` | --              | Обмежити довжину снипета       |
| `limits.maxInjectedChars` | `number` | --              | Обмежити загальну кількість вставлених символів |
| `limits.timeoutMs`        | `number` | `4000`          | Тайм-аут пошуку                |

### Scope

Керує тим, які сесії можуть отримувати результати пошуку QMD. Та сама схема, що й
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

Постачуване типове значення дозволяє direct і channel sessions, водночас і далі забороняючи
groups.

Типове значення — лише DM. `match.keyPrefix` зіставляється з нормалізованим ключем сесії;
`match.rawKeyPrefix` зіставляється з сирим ключем, включно з `agent:<id>:`.

### Citations

`memory.citations` застосовується до всіх backend:

| Значення         | Поведінка                                           |
| ---------------- | --------------------------------------------------- |
| `auto` (типово)  | Включати footer `Source: <path#line>` у снипети     |
| `on`             | Завжди включати footer                              |
| `off`            | Не включати footer (шлях усе одно передається агенту внутрішньо) |

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

Dreaming налаштовується в `plugins.entries.memory-core.config.dreaming`,
а не в `agents.defaults.memorySearch`.

Dreaming виконується як один запланований прохід і використовує внутрішні фази light/deep/REM як
деталь реалізації.

Концептуальну поведінку та slash-команди див. у [Dreaming](/uk/concepts/dreaming).

### Налаштування користувача

| Ключ        | Тип       | Типове значення | Опис                                                  |
| ----------- | --------- | --------------- | ----------------------------------------------------- |
| `enabled`   | `boolean` | `false`         | Повністю ввімкнути або вимкнути Dreaming              |
| `frequency` | `string`  | `0 3 * * *`     | Необов’язковий Cron-ритм для повного проходу Dreaming |

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

- Dreaming записує стан машини в `memory/.dreams/`.
- Dreaming записує людиночитний наративний вивід у `DREAMS.md` (або наявний `dreams.md`).
- Політика та пороги фаз light/deep/REM є внутрішньою поведінкою, а не користувацькою конфігурацією.
