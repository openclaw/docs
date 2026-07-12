---
read_when:
    - Ви налаштовуєте плагін memory-lancedb
    - Вам потрібна довготривала пам’ять на базі LanceDB з автоматичним пригадуванням або автоматичним збереженням
    - Ви використовуєте локальні вбудовування, сумісні з OpenAI, наприклад Ollama
sidebarTitle: Memory LanceDB
summary: Налаштуйте офіційний зовнішній Plugin пам’яті LanceDB, зокрема локальні вбудовування, сумісні з Ollama
title: Пам’ять LanceDB
x-i18n:
    generated_at: "2026-07-12T13:27:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` — це офіційний зовнішній plugin, який зберігає довготривалу пам’ять у
LanceDB із векторним пошуком. Він може автоматично пригадувати релевантні спогади перед
ходом моделі та автоматично зберігати важливі факти після відповіді.

Використовуйте його для локальної векторної бази даних, сумісної з OpenAI кінцевої точки
векторних представлень або сховища пам’яті поза стандартним вбудованим бекендом пам’яті.

## Встановлення

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin опубліковано в npm; він не входить до складу образу середовища виконання
OpenClaw. Його встановлення записує конфігурацію plugin, вмикає його та перемикає
`plugins.slots.memory` на `memory-lancedb`. Якщо слот пам’яті наразі належить іншому
plugin, його буде вимкнено з попередженням.

<Note>
Супутні plugins, як-от `memory-wiki`, можуть працювати разом із `memory-lancedb`,
але активний слот пам’яті в кожен момент часу належить лише одному plugin.
</Note>

## Швидкий початок

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

Після зміни конфігурації plugin перезапустіть Gateway, а потім перевірте, чи його завантажено:

```bash
openclaw gateway restart
openclaw plugins list
```

## Конфігурація векторних представлень

`embedding` є обов’язковим і має містити принаймні одне поле. Значенням
`provider` за замовчуванням є `openai`, а значенням `model` — `text-embedding-3-small`.

| Поле                   | Тип           | Примітки                                                                 |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | рядок         | Ідентифікатор адаптера, наприклад `openai`, `github-copilot`, `ollama`. За замовчуванням — `openai`. |
| `embedding.model`      | рядок         | За замовчуванням — `text-embedding-3-small`.                              |
| `embedding.apiKey`     | рядок         | Необов’язкове; підтримує розгортання `${ENV_VAR}`.                        |
| `embedding.baseUrl`    | рядок         | Необов’язкове; підтримує розгортання `${ENV_VAR}`.                        |
| `embedding.dimensions` | ціле (>=1)    | Обов’язкове для моделей, яких немає у вбудованій таблиці (див. нижче).    |

Існують два шляхи запитів:

- **Шлях адаптера провайдера** (за замовчуванням): задайте `embedding.provider` і не
  вказуйте `embedding.apiKey`/`embedding.baseUrl`. Plugin визначає налаштований
  профіль автентифікації провайдера, змінну середовища або
  `models.providers.<provider>.apiKey` через ті самі адаптери векторних представлень
  пам’яті, які використовує `memory-core`. Цей шлях призначений для `github-copilot`,
  `ollama` та будь-якого іншого вбудованого провайдера з підтримкою векторних представлень.
- **Шлях прямого клієнта, сумісного з OpenAI**: не задавайте `embedding.provider`
  (або задайте `"openai"`) і вкажіть `embedding.apiKey` разом із `embedding.baseUrl`.
  Використовуйте цей шлях для безпосередньої сумісної з OpenAI кінцевої точки
  векторних представлень, для якої немає вбудованого адаптера провайдера.

OAuth OpenAI Codex / ChatGPT не є обліковими даними для векторних представлень
OpenAI Platform. Для векторних представлень OpenAI використовуйте профіль
автентифікації з ключем OpenAI API, `OPENAI_API_KEY` або
`models.providers.openai.apiKey`. Користувачам, які мають лише OAuth, слід вибрати
іншого провайдера з підтримкою векторних представлень, наприклад `github-copilot`
або `ollama`.

```json5
{
  plugins: {
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

Деякі сумісні з OpenAI кінцеві точки векторних представлень відхиляють параметр
`encoding_format`; інші ігнорують його та завжди повертають `number[]`.
`memory-lancedb` не додає `encoding_format` до запитів і приймає як масиви чисел
із рухомою комою, так і закодовані у base64 відповіді float32, тому обидві форми
відповіді працюють без додаткової конфігурації.

### Розмірність

OpenClaw має вбудовані значення розмірності лише для `text-embedding-3-small` (1536)
і `text-embedding-3-large` (3072). Для будь-якої іншої моделі потрібно явно вказати
`embedding.dimensions`, щоб LanceDB могла створити векторний стовпець, наприклад
2048 вимірів для ZhiPu `embedding-3`:

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

## Векторні представлення Ollama

Використовуйте шлях вбудованого адаптера провайдера Ollama (`embedding.provider: "ollama"`).
Він звертається до нативної кінцевої точки Ollama `/api/embed` і дотримується тих самих
правил автентифікації та базової URL-адреси, що й провайдер [Ollama](/uk/providers/ollama).

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

`mxbai-embed-large` немає у вбудованій таблиці розмірностей, тому `dimensions` є
обов’язковим. Для невеликих локальних моделей векторних представлень зменште
`recallMaxChars`, якщо локальний сервер повертає помилки довжини контексту.

## Обмеження пригадування та збереження

| Налаштування      | За замовчуванням | Діапазон                     | Застосовується до                                            |
| ----------------- | ---------------- | ---------------------------- | ------------------------------------------------------------ |
| `recallMaxChars`  | `1000`           | 100-10000                    | Тексту, надісланого до API векторних представлень для пригадування. |
| `captureMaxChars` | `500`            | 100-10000                    | Довжини повідомлення, придатного для автоматичного збереження. |
| `customTriggers`  | `[]`             | 0-50 елементів, кожен <=100 символів | Буквальних фраз, через які автоматичне збереження розглядає повідомлення. |

`recallMaxChars` обмежує запит автоматичного пригадування `before_prompt_build`,
інструмент `memory_recall`, шлях запиту `memory_forget` і `openclaw ltm
search`. Автоматичне пригадування створює векторне представлення останнього
повідомлення користувача в ході та використовує повний запит лише за відсутності
повідомлення користувача, не включаючи метадані каналу й великі блоки запиту до
запиту векторного представлення.

`captureMaxChars` визначає, чи є повідомлення користувача з події `agent_end`
поточного ходу достатньо коротким для автоматичного збереження; це не впливає
на запити пригадування.

`customTriggers` додає буквальні фрази автоматичного збереження без регулярних
виразів. Вбудовані тригери охоплюють поширені англійські, чеські, китайські,
японські та корейські фрази про пам’ять (`remember`, `prefer`, `记住`, `覚えて`,
`기억해` та подібні).

Автоматичне збереження також відхиляє текст, схожий на метадані конверта/транспорту,
корисне навантаження ін’єкції запиту або вже вставлений контекст
`<relevant-memories>`, і обмежує кількість збережених спогадів до 3 за один хід агента.

## Команди

`memory-lancedb` реєструє простір імен CLI `ltm` щоразу, коли його встановлено
(а не лише коли він володіє активним слотом пам’яті):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` виконує невекторний запит безпосередньо до таблиці LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Прапорець                         | За замовчуванням                        | Примітки                                                                                                                                 |
| --------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Список дозволених стовпців, розділених комами.                                                                                           |
| `--filter <condition>`            | немає                                   | Умова WHERE у стилі SQL. Максимум 200 символів; дозволено лише літери й цифри, `_-`, пробільні символи та `='"<>!.,()%*`.                  |
| `--limit <n>`                     | `10`                                    | Додатне ціле число.                                                                                                                      |
| `--order-by <column>:<asc\|desc>` | немає                                   | Сортування в пам’яті після застосування фільтра; стовпець сортування автоматично додається до проєкції та вилучається з результату, якщо його не було запитано. |

Агенти отримують три інструменти від активного plugin пам’яті:

- `memory_recall`: векторний пошук серед збережених спогадів.
- `memory_store`: збереження факту, уподобання, рішення або сутності (відхиляє текст,
  схожий на корисне навантаження ін’єкції запиту; пропускає майже дубльовані записи).
- `memory_forget`: видалення за `memoryId` або за `query` (автоматично видаляє єдиний
  збіг з оцінкою понад 90%, інакше виводить ідентифікатори кандидатів для уточнення).

## Сховище

Дані LanceDB за замовчуванням зберігаються в `~/.openclaw/memory/lancedb`.
Перевизначте шлях за допомогою `dbPath`:

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

`storageOptions` приймає пари ключ/значення типу рядок для бекендів сховища LanceDB
(наприклад, сумісного з S3 об’єктного сховища) і підтримує розгортання `${ENV_VAR}`:

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

## Залежності середовища виконання та підтримка платформ

`memory-lancedb` залежить від нативного пакета `@lancedb/lancedb`, власником якого є
пакет plugin (а не основний дистрибутив OpenClaw). Під час запуску Gateway залежності
plugin не відновлюються; якщо нативна залежність відсутня або не завантажується,
перевстановіть чи оновіть пакет plugin і перезапустіть Gateway.

`@lancedb/lancedb` не публікує нативну збірку для `darwin-x64` (Mac з Intel).
На цій платформі під час завантаження plugin записує в журнал, що LanceDB недоступна;
використовуйте стандартний бекенд пам’яті, запускайте Gateway на підтримуваній
платформі/архітектурі або вимкніть `memory-lancedb`.

## Усунення несправностей

### Довжина вхідних даних перевищує довжину контексту

Модель векторних представлень відхилила запит пригадування:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Зменште `recallMaxChars`, а потім перезапустіть Gateway:

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

Для Ollama також перевірте, чи сервер векторних представлень доступний із хоста
Gateway через його нативну кінцеву точку векторних представлень:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Непідтримувана модель векторних представлень

Без `embedding.dimensions` відомі лише вбудовані розмірності моделей векторних
представлень OpenAI (`text-embedding-3-small`, `text-embedding-3-large`). Для
будь-якої іншої моделі задайте `embedding.dimensions` відповідно до розміру
вектора, який повідомляє ця модель.

### Plugin завантажується, але спогади не з’являються

Переконайтеся, що `plugins.slots.memory` вказує на `memory-lancedb`, а потім виконайте:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Якщо `autoCapture` вимкнено, Plugin усе одно відтворює наявні спогади, але
не зберігає нові автоматично. Скористайтеся інструментом `memory_store` або
увімкніть `autoCapture`.

## Пов’язані матеріали

- [Огляд пам’яті](/uk/concepts/memory)
- [Active Memory](/uk/concepts/active-memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
- [Вікі пам’яті](/uk/plugins/memory-wiki)
- [Ollama](/uk/providers/ollama)
