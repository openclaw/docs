---
read_when:
    - Вы настраиваете Plugin memory-lancedb
    - Вам нужна долговременная память на базе LanceDB с автоматическим вызовом из памяти или автоматическим захватом
    - Вы используете локальные OpenAI-совместимые эмбеддинги, такие как Ollama
sidebarTitle: Memory LanceDB
summary: Настройте официальный внешний Plugin памяти LanceDB, включая локальные Ollama-совместимые эмбеддинги
title: Память LanceDB
x-i18n:
    generated_at: "2026-06-28T23:18:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` — официальный внешний плагин памяти, который хранит долговременную память в
LanceDB и использует эмбеддинги для поиска. Он может автоматически вспоминать релевантные
воспоминания перед ходом модели и сохранять важные факты после ответа.

Используйте его, когда вам нужна локальная векторная база данных для памяти, требуется
OpenAI-совместимая конечная точка эмбеддингов или вы хотите хранить базу памяти вне
стандартного встроенного хранилища памяти.

## Установка

Установите `memory-lancedb` перед настройкой `plugins.slots.memory = "memory-lancedb"`:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Плагин опубликован в npm и не включен в образ среды выполнения OpenClaw.
Установщик записывает запись плагина и переключает слот памяти, если им не владеет другой
плагин.

<Note>
`memory-lancedb` — плагин активной памяти. Включите его, выбрав слот памяти
с помощью `plugins.slots.memory = "memory-lancedb"`. Сопутствующие плагины, такие как
`memory-wiki`, могут работать рядом с ним, но активным слотом памяти владеет только один плагин.
</Note>

## Быстрый старт

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Перезапустите Gateway после изменения конфигурации плагина:

```bash
openclaw gateway restart
```

Затем убедитесь, что плагин загружен:

```bash
openclaw plugins list
```

## Эмбеддинги на базе провайдеров

`memory-lancedb` может использовать те же адаптеры провайдеров эмбеддингов памяти, что и
`memory-core`. Укажите `embedding.provider` и опустите `embedding.apiKey`, чтобы использовать
настроенный профиль аутентификации провайдера, переменную окружения или
`models.providers.<provider>.apiKey`.

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
        },
      },
    },
  },
}
```

Этот путь работает с профилями аутентификации провайдера, которые предоставляют учетные данные для эмбеддингов.
Например, GitHub Copilot можно использовать, когда профиль/план Copilot поддерживает
эмбеддинги:

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth не является учетными данными для эмбеддингов OpenAI Platform.
Для эмбеддингов OpenAI используйте профиль аутентификации с ключом OpenAI API,
`OPENAI_API_KEY` или `models.providers.openai.apiKey`. Пользователи только с OAuth могут использовать
другого провайдера с поддержкой эмбеддингов, например GitHub Copilot или Ollama.

## Эмбеддинги Ollama

Для эмбеддингов Ollama предпочитайте встроенного провайдера эмбеддингов Ollama. Он использует
нативную конечную точку Ollama `/api/embed` и следует тем же правилам аутентификации/base URL, что и
провайдер Ollama, описанный в [Ollama](/ru/providers/ollama).

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Укажите `dimensions` для нестандартных моделей эмбеддингов. OpenClaw знает
размерности для `text-embedding-3-small` и `text-embedding-3-large`; для пользовательских
моделей значение нужно указать в конфигурации, чтобы LanceDB могла создать векторный столбец.

Для небольших локальных моделей эмбеддингов уменьшите `recallMaxChars`, если видите ошибки
длины контекста от локального сервера.

## OpenAI-совместимые провайдеры

Некоторые OpenAI-совместимые провайдеры эмбеддингов отклоняют параметр `encoding_format`,
а другие игнорируют его и всегда возвращают векторы `number[]`.
Поэтому `memory-lancedb` опускает `encoding_format` в запросах эмбеддингов и
принимает как ответы с массивами чисел с плавающей точкой, так и ответы float32 в кодировке base64.

Если у вас есть сырая OpenAI-совместимая конечная точка эмбеддингов без
встроенного адаптера провайдера, опустите `embedding.provider` (или оставьте `openai`) и
укажите `embedding.apiKey` вместе с `embedding.baseUrl`. Это сохраняет прямой
OpenAI-совместимый путь клиента.

Укажите `embedding.dimensions` для провайдеров, размерности моделей которых не встроены.
Например, ZhiPu `embedding-3` использует размерность `2048`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Ограничения поиска и захвата

У `memory-lancedb` есть два отдельных ограничения текста:

| Параметр          | По умолчанию | Диапазон | Применяется к                                           |
| ----------------- | ------------ | -------- | ------------------------------------------------------- |
| `recallMaxChars`  | `1000`       | 100-10000 | тексту, отправляемому в API эмбеддингов для поиска      |
| `captureMaxChars` | `500`        | 100-10000 | длине сообщения, подходящей для автоматического захвата |
| `customTriggers`  | `[]`         | 0-50      | буквальным фразам, из-за которых автозахват рассматривает сообщение |

`recallMaxChars` управляет автоматическим вспоминанием, инструментом `memory_recall`, путем запроса
`memory_forget` и `openclaw ltm search`. Автоматическое вспоминание предпочитает
последнее сообщение пользователя из хода и возвращается к полному промпту только тогда, когда
сообщение пользователя недоступно. Это не допускает попадания метаданных канала и больших блоков промпта
в запрос эмбеддинга.

`captureMaxChars` определяет, достаточно ли короток ответ, чтобы рассматривать его
для автоматического захвата. Он не ограничивает эмбеддинги поисковых запросов.

`customTriggers` позволяет добавлять буквальные фразы для автоматического захвата без написания
регулярных выражений. Встроенные триггеры включают распространенные фразы памяти
на английском, чешском, китайском, японском и корейском языках.

## Команды

Когда `memory-lancedb` является активным Plugin памяти, он регистрирует пространство
имен CLI `ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Подкоманда `query` выполняет невекторный запрос напрямую к таблице LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: список разрешенных столбцов через запятую (по умолчанию `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: SQL-подобное условие WHERE; ограничено 200 символами и допускает только буквы и цифры, операторы сравнения, кавычки, скобки и небольшой набор безопасной пунктуации.
- `--limit <n>`: положительное целое число; по умолчанию `10`.
- `--order-by <column>:<asc|desc>`: сортировка в памяти, применяемая после фильтра; столбец сортировки автоматически включается в проекцию.

Агенты также получают инструменты памяти LanceDB от активного Plugin памяти:

- `memory_recall` для вызова из памяти на базе LanceDB
- `memory_store` для сохранения важных фактов, предпочтений, решений и сущностей
- `memory_forget` для удаления совпадающих воспоминаний

## Хранилище

По умолчанию данные LanceDB находятся в `~/.openclaw/memory/lancedb`. Переопределите
путь с помощью `dbPath`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` принимает строковые пары ключ/значение для бэкендов хранилища LanceDB и
поддерживает раскрытие `${ENV_VAR}`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## Зависимости времени выполнения

`memory-lancedb` зависит от нативного пакета `@lancedb/lancedb`. Упакованный
OpenClaw рассматривает этот пакет как часть пакета Plugin. Запуск Gateway
не исправляет зависимости Plugin; если зависимость отсутствует, переустановите или
обновите пакет Plugin и перезапустите Gateway.

Если более старая установка при загрузке Plugin записывает в журнал ошибку об отсутствующем
`dist/package.json` или отсутствующем `@lancedb/lancedb`, обновите OpenClaw и перезапустите
Gateway.

Если Plugin сообщает в журнале, что LanceDB недоступен на `darwin-x64`, используйте на этой
машине бэкенд памяти по умолчанию, перенесите Gateway на поддерживаемую платформу или
отключите `memory-lancedb`.

## Устранение неполадок

### Длина ввода превышает длину контекста

Обычно это означает, что модель эмбеддингов отклонила запрос вызова из памяти:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Задайте меньшее значение `recallMaxChars`, затем перезапустите Gateway:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Для Ollama также проверьте, что сервер эмбеддингов доступен с хоста Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Неподдерживаемая модель эмбеддингов

Без `dimensions` известны только встроенные размерности эмбеддингов OpenAI.
Для локальных или пользовательских моделей эмбеддингов задайте `embedding.dimensions` равным
размеру вектора, который сообщает эта модель.

### Plugin загружается, но воспоминания не появляются

Проверьте, что `plugins.slots.memory` указывает на `memory-lancedb`, затем выполните:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Если `autoCapture` отключен, Plugin будет вызывать существующие воспоминания, но не будет
автоматически сохранять новые. Используйте инструмент `memory_store` или включите
`autoCapture`, если вам нужен автоматический захват.

## См. также

- [Обзор памяти](/ru/concepts/memory)
- [Active Memory](/ru/concepts/active-memory)
- [Поиск в памяти](/ru/concepts/memory-search)
- [Вики памяти](/ru/plugins/memory-wiki)
- [Ollama](/ru/providers/ollama)
