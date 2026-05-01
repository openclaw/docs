---
read_when:
    - Ви налаштовуєте вбудований Plugin memory-lancedb
    - Вам потрібна довготривала пам’ять на базі LanceDB з автоматичним пригадуванням або автоматичним захопленням
    - Ви використовуєте локальні OpenAI-сумісні ембедінги, як-от Ollama
sidebarTitle: Memory LanceDB
summary: Налаштуйте вбудований Plugin пам’яті LanceDB, включно з локальними Ollama-сумісними ембедингами
title: Пам’ять LanceDB
x-i18n:
    generated_at: "2026-05-01T20:40:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 671daa20e4f070f9beb0187ff76db9368297b3bc78873ebf3f09ac7ccffa00a2
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` — це вбудований Plugin пам’яті, який зберігає довготривалу пам’ять у
LanceDB і використовує вбудовування для пригадування. Він може автоматично пригадувати релевантні
спогади перед ходом моделі та фіксувати важливі факти після відповіді.

Використовуйте його, коли потрібна локальна векторна база даних для пам’яті, потрібна
OpenAI-сумісна кінцева точка вбудовувань або потрібно тримати базу даних пам’яті поза
стандартним вбудованим сховищем пам’яті.

<Note>
`memory-lancedb` — це Plugin Active Memory. Увімкніть його, вибравши слот пам’яті
за допомогою `plugins.slots.memory = "memory-lancedb"`. Супровідні plugins, як-от
`memory-wiki`, можуть працювати поруч із ним, але лише один plugin володіє активним слотом пам’яті.
</Note>

## Швидкий старт

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

Перезапустіть Gateway після зміни конфігурації plugin:

```bash
openclaw gateway restart
```

Потім перевірте, що plugin завантажено:

```bash
openclaw plugins list
```

## Вбудовування на основі постачальника

`memory-lancedb` може використовувати ті самі адаптери постачальників вбудовувань пам’яті, що й
`memory-core`. Задайте `embedding.provider` і не вказуйте `embedding.apiKey`, щоб використовувати
налаштований профіль автентифікації постачальника, змінну середовища або
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

Цей шлях працює з профілями автентифікації постачальника, які надають облікові дані для вбудовувань.
Наприклад, GitHub Copilot можна використовувати, коли профіль/план Copilot підтримує
вбудовування:

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

OpenAI Codex / ChatGPT OAuth (`openai-codex`) не є обліковими даними вбудовувань OpenAI Platform.
Для вбудовувань OpenAI використовуйте профіль автентифікації з ключем OpenAI API,
`OPENAI_API_KEY` або `models.providers.openai.apiKey`. Користувачі лише з OAuth можуть використовувати
іншого постачальника з підтримкою вбудовувань, як-от GitHub Copilot або Ollama.

## Вбудовування Ollama

Для вбудовувань Ollama віддавайте перевагу вбудованому постачальнику вбудовувань Ollama. Він використовує
нативну кінцеву точку Ollama `/api/embed` і дотримується тих самих правил автентифікації/базової URL-адреси, що й
постачальник Ollama, задокументований у [Ollama](/uk/providers/ollama).

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

Задайте `dimensions` для нестандартних моделей вбудовувань. OpenClaw знає
розмірності для `text-embedding-3-small` і `text-embedding-3-large`; для користувацьких
моделей значення потрібно вказати в конфігурації, щоб LanceDB могла створити векторний стовпець.

Для малих локальних моделей вбудовувань зменште `recallMaxChars`, якщо бачите помилки
довжини контексту від локального сервера.

## OpenAI-сумісні постачальники

Деякі OpenAI-сумісні постачальники вбудовувань відхиляють параметр `encoding_format`,
тоді як інші ігнорують його й завжди повертають вектори `number[]`.
Тому `memory-lancedb` не передає `encoding_format` у запитах вбудовувань і
приймає як відповіді з масивами чисел із рухомою комою, так і base64-кодовані відповіді float32.

Якщо у вас є необроблена OpenAI-сумісна кінцева точка вбудовувань, для якої немає
вбудованого адаптера постачальника, не вказуйте `embedding.provider` (або залиште його як `openai`) і
задайте `embedding.apiKey` разом із `embedding.baseUrl`. Це зберігає прямий
шлях OpenAI-сумісного клієнта.

Задайте `embedding.dimensions` для постачальників, чиї розмірності моделей не вбудовані.
Наприклад, ZhiPu `embedding-3` використовує `2048` розмірності:

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

## Обмеження пригадування та фіксації

`memory-lancedb` має два окремі текстові обмеження:

| Налаштування      | Типове значення | Діапазон  | Застосовується до                            |
| ----------------- | --------------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`          | 100-10000 | тексту, надісланого до API вбудовувань для пригадування |
| `captureMaxChars` | `500`           | 100-10000 | довжини повідомлення асистента, придатної для фіксації |

`recallMaxChars` керує автоматичним пригадуванням, інструментом `memory_recall`,
шляхом запиту `memory_forget` і `openclaw ltm search`. Автоматичне пригадування надає перевагу
останньому повідомленню користувача з ходу й повертається до повного промпта лише тоді, коли
повідомлення користувача недоступне. Це не допускає метадані каналу та великі блоки промпта
до запиту вбудовування.

`captureMaxChars` керує тим, чи відповідь достатньо коротка, щоб її можна було розглядати
для автоматичної фіксації. Він не обмежує вбудовування запитів пригадування.

## Команди

Коли `memory-lancedb` є активним plugin пам’яті, він реєструє простір імен CLI
`ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Plugin також розширює `openclaw memory` невекторною підкомандою `query`,
яка виконується безпосередньо над таблицею LanceDB:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: список дозволених стовпців, розділених комами (типово `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: SQL-подібна умова WHERE; обмежена 200 символами та лише буквено-цифровими символами, операторами порівняння, лапками, дужками й невеликим набором безпечної пунктуації.
- `--limit <n>`: додатне ціле число; типово `10`.
- `--order-by <column>:<asc|desc>`: сортування в пам’яті, застосоване після фільтра; стовпець сортування автоматично включається до проєкції.

Агенти також отримують інструменти пам’яті LanceDB від активного plugin пам’яті:

- `memory_recall` для пригадування на основі LanceDB
- `memory_store` для збереження важливих фактів, уподобань, рішень і сутностей
- `memory_forget` для видалення відповідних спогадів

## Сховище

За замовчуванням дані LanceDB розміщуються в `~/.openclaw/memory/lancedb`. Перевизначте
шлях за допомогою `dbPath`:

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

`storageOptions` приймає рядкові пари ключ/значення для бекендів сховища LanceDB і
підтримує розгортання `${ENV_VAR}`:

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

## Залежності виконання

`memory-lancedb` залежить від нативного пакета `@lancedb/lancedb`. У пакетованому
OpenClaw цей пакет вважається частиною пакета plugin. Запуск Gateway
не виправляє залежності plugin; якщо залежність відсутня, перевстановіть або
оновіть пакет plugin і перезапустіть Gateway.

Якщо старіше встановлення під час завантаження plugin записує в журнал помилку про відсутній `dist/package.json` або відсутній
`@lancedb/lancedb`, оновіть OpenClaw і перезапустіть
Gateway.

Якщо plugin записує в журнал, що LanceDB недоступна на `darwin-x64`, використовуйте стандартний
бекенд пам’яті на цій машині, перемістіть Gateway на підтримувану платформу або
вимкніть `memory-lancedb`.

## Усунення несправностей

### Довжина введення перевищує довжину контексту

Зазвичай це означає, що модель вбудовувань відхилила запит пригадування:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Задайте нижче значення `recallMaxChars`, а потім перезапустіть Gateway:

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

Для Ollama також перевірте, що сервер вбудовувань доступний із хоста Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Непідтримувана модель вбудовувань

Без `dimensions` відомі лише вбудовані розмірності вбудовувань OpenAI.
Для локальних або користувацьких моделей вбудовувань задайте `embedding.dimensions` як розмір вектора,
який повідомляє ця модель.

### Plugin завантажується, але спогади не з’являються

Перевірте, що `plugins.slots.memory` вказує на `memory-lancedb`, потім виконайте:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Якщо `autoCapture` вимкнено, plugin пригадуватиме наявні спогади, але
не зберігатиме нові автоматично. Використовуйте інструмент `memory_store` або ввімкніть
`autoCapture`, якщо потрібна автоматична фіксація.

## Пов’язане

- [Огляд пам’яті](/uk/concepts/memory)
- [Active Memory](/uk/concepts/active-memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
- [Memory Wiki](/uk/plugins/memory-wiki)
- [Ollama](/uk/providers/ollama)
