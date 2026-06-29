---
read_when:
    - Вы хотите настроить поставщиков поиска по памяти или модели эмбеддингов
    - Вы хотите настроить backend QMD
    - Вы хотите настроить гибридный поиск, MMR или временное затухание
    - Вы хотите включить индексацию мультимодальной памяти
sidebarTitle: Memory config
summary: Все параметры конфигурации для поиска в памяти, поставщиков эмбеддингов, QMD, гибридного поиска и мультимодального индексирования
title: Справочник по настройке памяти
x-i18n:
    generated_at: "2026-06-28T23:43:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de7d1c23cd415293001ef59ae2572cd7bfe9a88c70c1e4cf138ee60664ff0ac2
    source_path: reference/memory-config.md
    workflow: 16
---

На этой странице перечислены все параметры конфигурации для поиска по памяти OpenClaw. Концептуальные обзоры см. здесь:

<CardGroup cols={2}>
  <Card title="Обзор памяти" href="/ru/concepts/memory">
    Как работает память.
  </Card>
  <Card title="Встроенный движок" href="/ru/concepts/memory-builtin">
    Backend SQLite по умолчанию.
  </Card>
  <Card title="Движок QMD" href="/ru/concepts/memory-qmd">
    Локальный sidecar.
  </Card>
  <Card title="Поиск по памяти" href="/ru/concepts/memory-search">
    Конвейер поиска и настройка.
  </Card>
  <Card title="Active Memory" href="/ru/concepts/active-memory">
    Подагент памяти для интерактивных сеансов.
  </Card>
</CardGroup>

Все настройки поиска по памяти находятся в `agents.defaults.memorySearch` в `openclaw.json`, если не указано иное.

<Note>
Если вы ищете переключатель функции **Active Memory** и конфигурацию подагента, они находятся в `plugins.entries.active-memory`, а не в `memorySearch`.

Active Memory использует модель с двумя условиями:

1. Plugin должен быть включен и нацелен на текущий идентификатор агента
2. запрос должен быть подходящим интерактивным постоянным сеансом чата

Модель активации, конфигурацию, принадлежащую Plugin, сохранение расшифровки и безопасный шаблон развертывания см. в [Active Memory](/ru/concepts/active-memory).
</Note>

---

## Выбор провайдера

| Ключ       | Тип       | По умолчанию     | Описание                                                                                                                                                                                                                                                                               |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | ID адаптера embedding, например `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` или `voyage`; также может быть настроенным `models.providers.<id>`, чей `api` указывает на адаптер embedding памяти или OpenAI-совместимый API модели |
| `model`    | `string`  | default провайдера | Имя модели embedding                                                                                                                                                                                                                                                                   |
| `fallback` | `string`  | `"none"`         | ID резервного адаптера, когда основной завершается с ошибкой                                                                                                                                                                                                                           |
| `enabled`  | `boolean` | `true`           | Включить или отключить поиск по памяти                                                                                                                                                                                                                                                  |

Когда `provider` не задан, OpenClaw использует embeddings OpenAI. Задайте `provider`
явно, чтобы использовать Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, локальную модель GGUF или OpenAI-совместимый endpoint `/v1/embeddings`.
Устаревшие конфигурации, в которых все еще указано `provider: "auto"`, разрешаются в `openai`.

<Warning>
Изменение провайдера embedding, модели, настроек провайдера, источников, области,
chunking или tokenizer может сделать существующий векторный индекс SQLite несовместимым.
OpenClaw приостанавливает векторный поиск и сообщает предупреждение об идентичности индекса вместо того, чтобы
автоматически заново создавать embeddings для всего. Перестройте индекс, когда будете готовы, с помощью
`openclaw memory status --index --agent <id>` или
`openclaw memory index --force --agent <id>`.
</Warning>

Когда `provider` не задан, присутствует устаревший `provider: "auto"` или
`provider: "none"` намеренно выбирает режим только FTS, восстановление памяти все равно может
использовать лексическое ранжирование FTS, когда embeddings недоступны.

Явные нелокальные провайдеры завершаются закрыто. Если вы задаете `memorySearch.provider` как
конкретного удаленного провайдера, например OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio или OpenAI-совместимого
пользовательского провайдера, и этот провайдер недоступен во время выполнения, `memory_search`
возвращает результат о недоступности вместо неявного использования восстановления только через FTS. Исправьте
конфигурацию провайдера/аутентификации, переключитесь на доступного провайдера или задайте
`provider: "none"`, если хотите намеренно использовать восстановление только через FTS.

### Пользовательские ID провайдеров

`memorySearch.provider` может указывать на пользовательскую запись `models.providers.<id>` для специализированных адаптеров провайдера памяти, таких как `ollama`, или для OpenAI-совместимых API моделей, таких как `openai-responses` / `openai-completions`. OpenClaw разрешает владельца `api` этого провайдера для адаптера embedding, сохраняя пользовательский ID провайдера для endpoint, аутентификации и обработки префиксов моделей. Это позволяет конфигурациям с несколькими GPU или хостами выделять embeddings памяти на конкретный локальный endpoint:

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

### Разрешение ключа API

Удаленные embeddings требуют ключ API. Вместо этого Bedrock использует цепочку учетных данных AWS SDK по умолчанию (роли экземпляра, SSO, ключи доступа).

| Провайдер      | Переменная окружения                              | Ключ конфигурации                 |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | цепочка учетных данных AWS                         | Ключ API не нужен                 |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профиль аутентификации через вход с устройства |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

<Note>
Codex OAuth покрывает только chat/completions и не удовлетворяет запросы embedding.
</Note>

---

## Конфигурация удаленного endpoint

Используйте `provider: "openai-compatible"` для универсального OpenAI-совместимого
сервера `/v1/embeddings`, который не должен наследовать глобальные учетные данные чата OpenAI.

<ParamField path="remote.baseUrl" type="string">
  Пользовательский базовый URL API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Переопределить ключ API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Дополнительные HTTP-заголовки (объединяются со значениями провайдера по умолчанию).
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

## Конфигурация для отдельных провайдеров

<AccordionGroup>
  <Accordion title="Gemini">
    | Ключ                   | Тип      | По умолчанию          | Описание                                  |
    | ---------------------- | -------- | --------------------- | ----------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Также поддерживает `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                | Для Embedding 2: 768, 1536 или 3072       |

    <Warning>
    Изменение модели или `outputDimensionality` меняет идентичность индекса. OpenClaw
    приостанавливает векторный поиск, пока вы явно не перестроите индекс памяти.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-совместимые типы ввода">
    OpenAI-совместимые endpoint embeddings могут включать специфичные для провайдера поля запроса `input_type`. Это полезно для асимметричных моделей embedding, которым нужны разные метки для embeddings запросов и документов.

    | Ключ                | Тип      | По умолчанию | Описание                                             |
    | ------------------- | -------- | ------------ | ---------------------------------------------------- |
    | `inputType`         | `string` | не задан     | Общий `input_type` для embeddings запросов и документов |
    | `queryInputType`    | `string` | не задан     | `input_type` во время запроса; переопределяет `inputType` |
    | `documentInputType` | `string` | не задан     | `input_type` индекса/документа; переопределяет `inputType` |

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

    Изменение этих значений влияет на идентичность кэша embeddings для пакетной индексации провайдера, и после него следует переиндексировать память, когда upstream-модель по-разному обрабатывает метки.

  </Accordion>
  <Accordion title="Bedrock">
    ### Конфигурация embedding Bedrock

    Bedrock использует цепочку учетных данных AWS SDK по умолчанию — ключи API не нужны. Если OpenClaw работает на EC2 с ролью экземпляра, в которой включен Bedrock, просто задайте провайдера и модель:

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

    | Ключ                   | Тип      | По умолчанию                 | Описание                        |
    | ---------------------- | -------- | ---------------------------- | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Любой ID модели embedding Bedrock |
    | `outputDimensionality` | `number` | default модели               | Для Titan V2: 256, 512 или 1024 |

    **Поддерживаемые модели** (с определением семейства и значениями размерности по умолчанию):

    | ID модели                                  | Провайдер  | Размерность по умолчанию | Настраиваемые размерности |
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

    Варианты с суффиксом пропускной способности (например, `amazon.titan-embed-text-v1:2:8k`) наследуют конфигурацию базовой модели.

    **Аутентификация:** аутентификация Bedrock использует стандартный порядок разрешения учетных данных AWS SDK:

    1. Переменные окружения (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Кэш токенов SSO
    3. Учетные данные токена веб-идентификации
    4. Общие файлы учетных данных и конфигурации
    5. Учетные данные метаданных ECS или EC2

    Регион определяется из `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` провайдера `amazon-bedrock` или по умолчанию задается как `us-east-1`.

    **Разрешения IAM:** роли или пользователю IAM требуется:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Для минимальных привилегий ограничьте область `InvokeModel` конкретной моделью:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Локально (GGUF + llama.cpp)">
    | Ключ                  | Тип                | По умолчанию                | Описание                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | скачивается автоматически | Путь к файлу модели GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | значение по умолчанию node-llama-cpp | Каталог кэша для скачанных моделей                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Размер контекстного окна для контекста эмбеддингов. 4096 покрывает типичные фрагменты (128–512 токенов), ограничивая VRAM, не занятую весами. На хостах с ограниченными ресурсами уменьшите до 1024–2048. `"auto"` использует обученный максимум модели — не рекомендуется для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенов → ~32 ГБ VRAM против ~8,8 ГБ при 4096). |

    Сначала установите официальный провайдер llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Модель по умолчанию: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 ГБ, скачивается автоматически). Для исходных checkout по-прежнему требуется одобрение нативной сборки: `pnpm approve-builds`, затем `pnpm rebuild node-llama-cpp`.

    Используйте автономный CLI, чтобы проверить тот же путь провайдера, который использует Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Явно задайте `provider: "local"` для локальных эмбеддингов GGUF. Ссылки на модели `hf:` и HTTP(S) поддерживаются для явных локальных конфигураций, но они не меняют провайдера по умолчанию.

  </Accordion>
</AccordionGroup>

### Тайм-аут inline-эмбеддингов

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Переопределяет тайм-аут для inline-пакетов эмбеддингов во время индексирования памяти.

Если значение не задано, используется значение провайдера по умолчанию: 600 секунд для локальных и самостоятельно размещенных провайдеров, таких как `local`, `ollama` и `lmstudio`, и 120 секунд для размещенных провайдеров. Увеличьте это значение, когда локальные CPU-bound пакеты эмбеддингов работают корректно, но медленно.
</ParamField>

---

## Конфигурация гибридного поиска

Все находится в `memorySearch.query.hybrid`:

| Ключ                  | Тип       | По умолчанию | Описание                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Включить гибридный поиск BM25 + векторный поиск |
| `vectorWeight`        | `number`  | `0.7`   | Вес векторных оценок (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Вес оценок BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Множитель размера пула кандидатов     |

<Tabs>
  <Tab title="MMR (разнообразие)">
    | Ключ          | Тип       | По умолчанию | Описание                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Включить повторное ранжирование MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = максимальное разнообразие, 1 = максимальная релевантность |
  </Tab>
  <Tab title="Временное затухание (актуальность)">
    | Ключ                         | Тип       | По умолчанию | Описание               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Включить повышение актуальности      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Оценка уменьшается вдвое каждые N дней |

    Вечнозеленые файлы (`MEMORY.md`, файлы без дат в `memory/`) никогда не подвергаются затуханию.

  </Tab>
</Tabs>

### Полный пример

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

## Дополнительные пути памяти

| Ключ         | Тип        | Описание                                             |
| ------------ | ---------- | ---------------------------------------------------- |
| `extraPaths` | `string[]` | Дополнительные каталоги или файлы для индексирования |

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

Пути могут быть абсолютными или относительными к рабочей области. Каталоги рекурсивно сканируются на наличие файлов `.md`. Обработка символических ссылок зависит от активного бэкенда: встроенный движок игнорирует символические ссылки, а QMD следует поведению базового сканера QMD.

Для поиска расшифровок между агентами в рамках агента используйте `agents.list[].memorySearch.qmd.extraCollections` вместо `memory.qmd.paths`. Эти дополнительные коллекции имеют ту же форму `{ path, name, pattern? }`, но объединяются отдельно для каждого агента и могут сохранять явно заданные общие имена, когда путь указывает за пределы текущей рабочей области. Если один и тот же разрешенный путь присутствует и в `memory.qmd.paths`, и в `memorySearch.qmd.extraCollections`, QMD сохраняет первую запись и пропускает дубликат.

---

## Мультимодальная память (Gemini)

Индексируйте изображения и аудио вместе с Markdown с помощью Gemini Embedding 2:

| Ключ                      | Тип        | По умолчанию | Описание                                      |
| ------------------------- | ---------- | ------------ | --------------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`      | Включить мультимодальное индексирование       |
| `multimodal.modalities`   | `string[]` | --           | `["image"]`, `["audio"]` или `["all"]`        |
| `multimodal.maxFileBytes` | `number`   | `10000000`   | Максимальный размер файла для индексирования  |

<Note>
Применяется только к файлам в `extraPaths`. Корневые пути памяти по умолчанию остаются только для Markdown. Требуется `gemini-embedding-2-preview`. `fallback` должен быть `"none"`.
</Note>

Поддерживаемые форматы: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (изображения); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудио).

---

## Кэш эмбеддингов

| Ключ               | Тип       | По умолчанию | Описание                             |
| ------------------ | --------- | ------------ | ------------------------------------ |
| `cache.enabled`    | `boolean` | `true`       | Кэшировать эмбеддинги фрагментов в SQLite |
| `cache.maxEntries` | `number`  | `50000`      | Максимум кэшированных эмбеддингов    |

Предотвращает повторное создание эмбеддингов для неизмененного текста при повторном индексировании или обновлении расшифровок.

---

## Пакетное индексирование

| Ключ                          | Тип       | По умолчанию | Описание                            |
| ----------------------------- | --------- | ------------ | ----------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`          | Параллельные встроенные эмбеддинги  |
| `remote.batch.enabled`        | `boolean` | `false`      | Включить API пакетных эмбеддингов   |
| `remote.batch.concurrency`    | `number`  | `2`          | Параллельные пакетные задания       |
| `remote.batch.wait`           | `boolean` | `true`       | Ждать завершения пакета             |
| `remote.batch.pollIntervalMs` | `number`  | --           | Интервал опроса                     |
| `remote.batch.timeoutMinutes` | `number`  | --           | Тайм-аут пакета                     |

Доступно для `openai`, `gemini` и `voyage`. Пакетная обработка OpenAI обычно самая быстрая и дешевая для больших обратных заполнений.

`remote.nonBatchConcurrency` управляет встроенными вызовами создания эмбеддингов, используемыми локальными/самостоятельно размещенными провайдерами и размещенными провайдерами, когда API пакетной обработки провайдера не активны. Для непакетного индексирования Ollama по умолчанию использует `1`, чтобы не перегружать небольшие локальные хосты; на более крупных машинах задайте большее значение.

Это отдельно от `sync.embeddingBatchTimeoutSeconds`, который управляет тайм-аутом встроенных вызовов создания эмбеддингов.

---

## Поиск в памяти сеансов (экспериментально)

Индексируйте расшифровки сеансов и предоставляйте их через `memory_search`:

| Ключ                          | Тип        | По умолчанию | Описание                                 |
| ----------------------------- | ---------- | ------------ | ---------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Включить индексирование сеансов          |
| `sources`                     | `string[]` | `["memory"]` | Добавьте `"sessions"`, чтобы включить расшифровки |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Порог байтов для повторного индексирования |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Порог сообщений для повторного индексирования |

<Warning>
Индексирование сеансов включается явно и выполняется асинхронно. Результаты могут быть немного устаревшими. Журналы сеансов хранятся на диске, поэтому рассматривайте доступ к файловой системе как границу доверия.
</Warning>

Совпадения в стенограммах сессий также подчиняются
[`tools.sessions.visibility`](/ru/gateway/config-tools#toolssessions). Видимость по умолчанию
`tree` открывает только текущую сессию и сессии, которые она запустила. Чтобы
из другой сессии, например из личного сообщения (DM), вспомнить несвязанную сессию того же агента, отправленную через Gateway,
намеренно расширьте видимость до `agent` (или до `all` только
когда также требуется вспоминание между агентами и это разрешает политика взаимодействия агентов).

В примерах ниже эти настройки размещены в `agents.defaults`. Вы также можете
применить эквивалентные настройки `memorySearch` в переопределении для отдельного агента, когда только один
агент должен индексировать стенограммы сессий и искать по ним.

Для вспоминания из Gateway в DM в рамках одного агента:

<Tabs>
  <Tab title="Встроенный бэкенд">
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
  <Tab title="Бэкенд QMD">
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

При использовании QMD `agents.defaults.memorySearch.experimental.sessionMemory` и
`sources: ["sessions"]` сами по себе не экспортируют стенограммы в QMD. Также задайте
`memory.qmd.sessions.enabled: true`.

---

## Ускорение векторов SQLite (sqlite-vec)

| Ключ                         | Тип       | По умолчанию | Описание                              |
| ---------------------------- | --------- | ------------ | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`       | Использовать sqlite-vec для векторных запросов |
| `store.vector.extensionPath` | `string`  | в комплекте  | Переопределить путь к sqlite-vec      |

Когда sqlite-vec недоступен, OpenClaw автоматически переключается на внутрипроцессное косинусное сходство.

---

## Хранилище индексов

Встроенные индексы памяти находятся в SQLite-базе OpenClaw каждого агента:
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Ключ                  | Тип      | По умолчанию | Описание                               |
| --------------------- | -------- | ------------ | -------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61`  | Токенизатор FTS5 (`unicode61` или `trigram`) |

---

## Конфигурация бэкенда QMD

Задайте `memory.backend = "qmd"`, чтобы включить его. Все настройки QMD находятся в `memory.qmd`:

| Ключ                     | Тип       | По умолчанию | Описание                                                                           |
| ------------------------ | --------- | ------------ | ---------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`        | Путь к исполняемому файлу QMD; задайте абсолютный путь, когда `PATH` сервиса отличается от вашей оболочки |
| `searchMode`             | `string`  | `search`     | Команда поиска: `search`, `vsearch`, `query`                                       |
| `rerank`                 | `boolean` | --           | Задайте `false` с `searchMode: "query"` и QMD 2.1+, чтобы пропустить reranking QMD |
| `includeDefaultMemory`   | `boolean` | `true`       | Автоматически индексировать `MEMORY.md` + `memory/**/*.md`                         |
| `paths[]`                | `array`   | --           | Дополнительные пути: `{ name, path, pattern? }`                                    |
| `sessions.enabled`       | `boolean` | `false`      | Экспортировать стенограммы сессий в QMD                                            |
| `sessions.retentionDays` | `number`  | --           | Срок хранения стенограмм                                                           |
| `sessions.exportDir`     | `string`  | --           | Каталог экспорта                                                                   |

`searchMode: "search"` использует только лексический поиск/BM25. OpenClaw не запускает проверки готовности семантических векторов или обслуживание embedding QMD для этого режима, в том числе во время `memory status --deep`; `vsearch` и `query` по-прежнему требуют готовности векторов QMD и embeddings.

`rerank: false` меняет только режим QMD `query` и требует QMD 2.1 или новее. В режиме прямого CLI OpenClaw передает `--no-rerank`; в режиме MCP на базе mcporter он передает `rerank: false` в единый инструмент запросов QMD. Оставьте параметр незаданным, чтобы использовать стандартное поведение reranking запросов QMD.

OpenClaw предпочитает текущие формы коллекций QMD и запросов MCP, но сохраняет работоспособность старых выпусков QMD, при необходимости пробуя совместимые флаги шаблонов коллекций и старые имена инструментов MCP. Когда QMD объявляет поддержку нескольких фильтров коллекций, коллекции из одного источника ищутся одним процессом QMD; старые сборки QMD сохраняют путь совместимости для каждой коллекции. Один источник означает, что долговременные коллекции памяти группируются вместе, а коллекции стенограмм сессий остаются отдельной группой, чтобы диверсификация источников по-прежнему имела оба входа.

<Note>
Переопределения моделей QMD остаются на стороне QMD, а не в конфигурации OpenClaw. Если вам нужно глобально переопределить модели QMD, задайте переменные окружения, такие как `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` и `QMD_GENERATE_MODEL`, в среде выполнения Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Расписание обновлений">
    | Ключ                      | Тип       | По умолчанию | Описание                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Интервал обновления                      |
    | `update.debounceMs`       | `number`  | `15000` | Подавлять дребезг изменений файлов                 |
    | `update.onBoot`           | `boolean` | `true`  | Обновлять при открытии долговременного менеджера QMD; установите false, чтобы пропустить немедленное обновление при запуске |
    | `update.startup`          | `string`  | `off`   | Необязательная инициализация QMD при запуске Gateway: `off`, `idle` или `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Задержка перед запуском обновления `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | Блокировать открытие менеджера до завершения его начального обновления |
    | `update.embedInterval`    | `string`  | --      | Отдельная периодичность embed                |
    | `update.commandTimeoutMs` | `number`  | --      | Тайм-аут для команд QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | Тайм-аут для операций обновления QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | Тайм-аут для операций embed QMD      |
  </Accordion>
  <Accordion title="Ограничения">
    | Ключ                      | Тип      | По умолчанию | Описание                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Максимум результатов поиска         |
    | `limits.maxSnippetChars`  | `number` | --      | Ограничить длину фрагмента       |
    | `limits.maxInjectedChars` | `number` | --      | Ограничить общий объем внедренных символов |
    | `limits.timeoutMs`        | `number` | `4000`  | Тайм-аут поиска             |
  </Accordion>
  <Accordion title="Область действия">
    Управляет тем, какие сеансы могут получать результаты поиска QMD. Та же схема, что и [`session.sendPolicy`](/ru/gateway/config-agents#session):

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

    Поставляемое значение по умолчанию разрешает прямые и канальные сеансы, но по-прежнему запрещает группы.

    По умолчанию разрешены только DM. `match.keyPrefix` сопоставляется с нормализованным ключом сеанса; `match.rawKeyPrefix` сопоставляется с исходным ключом, включая `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитирования">
    `memory.citations` применяется ко всем бэкендам:

    | Значение         | Поведение                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (default) | Включать строку `Source: <path#line>` внизу фрагментов    |
    | `on`             | Всегда включать строку внизу                               |
    | `off`            | Не включать строку внизу (путь все равно передается агенту внутренне) |

  </Accordion>
</AccordionGroup>

Когда инициализация QMD при запуске Gateway включена, OpenClaw запускает QMD только для подходящих агентов. Если `update.onBoot` равно true и обслуживание по интервалу/embed не настроено, при запуске используется одноразовый менеджер для обновления при загрузке, после чего он закрывается. Если настроен интервал обновления или embed, при запуске открывается долговременный менеджер QMD, чтобы он владел наблюдателем и таймерами интервалов; `update.onBoot: false` пропускает только немедленное обновление при запуске.

### Полный пример QMD

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

Dreaming настраивается в `plugins.entries.memory-core.config.dreaming`, а не в `agents.defaults.memorySearch`.

Dreaming выполняется как один запланированный проход и использует внутренние фазы light/deep/REM как деталь реализации.

Концептуальное поведение и slash-команды см. в [Dreaming](/ru/concepts/dreaming).

### Пользовательские настройки

| Ключ                                   | Тип       | По умолчанию | Описание                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Полностью включить или отключить dreaming                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Необязательная периодичность Cron для полного прохода dreaming                                                                                |
| `model`                                | `string`  | модель по умолчанию | Необязательное переопределение модели субагента Dream Diary                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Максимальное расчетное число токенов, сохраняемых из каждого фрагмента краткосрочного recall, продвинутого в `MEMORY.md`; метаданные происхождения остаются видимыми |

### Пример

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
- Dreaming записывает машинное состояние в `memory/.dreams/`.
- Dreaming записывает человекочитаемый повествовательный вывод в `DREAMS.md` (или существующий `dreams.md`).
- `dreaming.model` использует существующий шлюз доверия субагента Plugin; перед включением задайте `plugins.entries.memory-core.subagent.allowModelOverride: true`.
- Dream Diary повторяет попытку один раз с моделью сеанса по умолчанию, если настроенная модель недоступна. Сбои доверия или allowlist журналируются и не повторяются без уведомления.
- Политика и пороги фаз light/deep/REM являются внутренним поведением, а не пользовательской конфигурацией.

</Note>

## Связанные материалы

- [Справочник по конфигурации](/ru/gateway/configuration-reference)
- [Обзор памяти](/ru/concepts/memory)
- [Поиск в памяти](/ru/concepts/memory-search)
