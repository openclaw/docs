---
read_when:
    - Ви налаштовуєте вбудований Plugin memory-lancedb
    - Вам потрібна довгострокова пам’ять на базі LanceDB з автоматичним пригадуванням або автоматичним захопленням
    - Ви використовуєте локальні OpenAI-сумісні векторні представлення, як-от Ollama
sidebarTitle: Memory LanceDB
summary: Налаштуйте вбудований Plugin пам’яті LanceDB, зокрема локальні ембеддинги, сумісні з Ollama
title: Пам’ять LanceDB
x-i18n:
    generated_at: "2026-04-29T11:47:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` — це вбудований плагін пам'яті, який зберігає довгострокову пам'ять у
LanceDB і використовує ембединги для пригадування. Він може автоматично пригадувати релевантні
спогади перед ходом моделі та фіксувати важливі факти після відповіді.

Використовуйте його, коли вам потрібна локальна векторна база даних для пам'яті, потрібна
сумісна з OpenAI кінцева точка ембедингів або ви хочете тримати базу даних пам'яті поза
типовим вбудованим сховищем пам'яті.

<Note>
`memory-lancedb` — це плагін Active Memory. Увімкніть його, вибравши слот пам'яті
за допомогою `plugins.slots.memory = "memory-lancedb"`. Супровідні плагіни, як-от
`memory-wiki`, можуть працювати поруч із ним, але лише один плагін володіє слотом Active Memory.
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

Перезапустіть Gateway після зміни конфігурації плагіна:

```bash
openclaw gateway restart
```

Потім перевірте, що плагін завантажено:

```bash
openclaw plugins list
```

## Ембединги на базі провайдера

`memory-lancedb` може використовувати ті самі адаптери провайдерів ембедингів пам'яті, що й
`memory-core`. Задайте `embedding.provider` і не вказуйте `embedding.apiKey`, щоб використовувати
налаштований профіль автентифікації провайдера, змінну середовища або
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

Цей шлях працює з профілями автентифікації провайдерів, які надають облікові дані для ембедингів.
Наприклад, GitHub Copilot можна використовувати, коли профіль/план Copilot підтримує
ембединги:

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

OpenAI Codex / ChatGPT OAuth (`openai-codex`) не є обліковими даними ембедингів OpenAI Platform.
Для ембедингів OpenAI використовуйте профіль автентифікації з ключем OpenAI API,
`OPENAI_API_KEY` або `models.providers.openai.apiKey`. Користувачі лише з OAuth можуть використовувати
іншого провайдера з підтримкою ембедингів, наприклад GitHub Copilot або Ollama.

## Ембединги Ollama

Для ембедингів Ollama надавайте перевагу вбудованому провайдеру ембедингів Ollama. Він використовує
нативну кінцеву точку Ollama `/api/embed` і дотримується тих самих правил автентифікації/base URL, що й
провайдер Ollama, задокументований у [Ollama](/uk/providers/ollama).

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

Задавайте `dimensions` для нестандартних моделей ембедингів. OpenClaw знає
розмірності для `text-embedding-3-small` і `text-embedding-3-large`; для користувацьких
моделей потрібне значення в конфігурації, щоб LanceDB могла створити векторний стовпець.

Для невеликих локальних моделей ембедингів зменште `recallMaxChars`, якщо бачите помилки
довжини контексту від локального сервера.

## Провайдери, сумісні з OpenAI

Деякі сумісні з OpenAI провайдери ембедингів відхиляють параметр `encoding_format`,
а інші ігнорують його й завжди повертають вектори `number[]`.
Тому `memory-lancedb` не вказує `encoding_format` у запитах ембедингів і
приймає як відповіді у вигляді масивів чисел із рухомою комою, так і закодовані в base64 відповіді float32.

Якщо у вас є необроблена сумісна з OpenAI кінцева точка ембедингів, для якої немає
вбудованого адаптера провайдера, не вказуйте `embedding.provider` (або залиште його як `openai`) і
задайте `embedding.apiKey` разом з `embedding.baseUrl`. Це зберігає прямий шлях
клієнта, сумісного з OpenAI.

Задайте `embedding.dimensions` для провайдерів, розмірності моделей яких не вбудовані.
Наприклад, ZhiPu `embedding-3` використовує `2048` розмірностей:

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

`memory-lancedb` має два окремі обмеження тексту:

| Налаштування      | За замовчуванням | Діапазон  | Застосовується до                            |
| ----------------- | ---------------- | --------- | -------------------------------------------- |
| `recallMaxChars`  | `1000`           | 100-10000 | тексту, надісланого до API ембедингів для пригадування |
| `captureMaxChars` | `500`            | 100-10000 | довжини повідомлення асистента, придатної для фіксації |

`recallMaxChars` керує автоматичним пригадуванням, інструментом `memory_recall`, шляхом запиту
`memory_forget` і `openclaw ltm search`. Автоматичне пригадування надає перевагу
останньому повідомленню користувача з ходу й повертається до повного промпта лише тоді, коли
повідомлення користувача недоступне. Це не допускає метадані каналу та великі блоки промптів
до запиту ембедингів.

`captureMaxChars` керує тим, чи є відповідь достатньо короткою, щоб розглядатися
для автоматичної фіксації. Він не обмежує ембединги запитів пригадування.

## Команди

Коли `memory-lancedb` є активним плагіном пам'яті, він реєструє простір імен CLI `ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Плагін також розширює `openclaw memory` невекторною підкомандою `query`,
яка виконується безпосередньо проти таблиці LanceDB:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: розділений комами список дозволених стовпців (за замовчуванням `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: SQL-подібна умова WHERE; обмежена 200 символами та лише літерами/цифрами, операторами порівняння, лапками, дужками й невеликим набором безпечних розділових знаків.
- `--limit <n>`: додатне ціле число; за замовчуванням `10`.
- `--order-by <column>:<asc|desc>`: сортування в пам'яті, застосоване після фільтра; стовпець сортування автоматично додається до проєкції.

Агенти також отримують інструменти пам'яті LanceDB від активного плагіна пам'яті:

- `memory_recall` для пригадування на базі LanceDB
- `memory_store` для збереження важливих фактів, уподобань, рішень і сутностей
- `memory_forget` для видалення відповідних спогадів

## Сховище

За замовчуванням дані LanceDB зберігаються в `~/.openclaw/memory/lancedb`. Перевизначте
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

## Залежності під час виконання

`memory-lancedb` залежить від нативного пакета `@lancedb/lancedb`. Паковані
інсталяції OpenClaw спершу пробують вбудовану залежність під час виконання та можуть виправити
залежність плагіна під час виконання у стані OpenClaw, коли вбудований імпорт недоступний.

Якщо старіша інсталяція під час завантаження плагіна логує помилку про відсутній `dist/package.json` або відсутній
`@lancedb/lancedb`, оновіть OpenClaw і перезапустіть
Gateway.

Якщо плагін логує, що LanceDB недоступна на `darwin-x64`, використовуйте типовий
бекенд пам'яті на цій машині, перенесіть Gateway на підтримувану платформу або
вимкніть `memory-lancedb`.

## Усунення несправностей

### Довжина вводу перевищує довжину контексту

Зазвичай це означає, що модель ембедингів відхилила запит пригадування:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Задайте менший `recallMaxChars`, потім перезапустіть Gateway:

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

Для Ollama також перевірте, що сервер ембедингів доступний із хоста Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Непідтримувана модель ембедингів

Без `dimensions` відомі лише вбудовані розмірності ембедингів OpenAI.
Для локальних або користувацьких моделей ембедингів задайте `embedding.dimensions` відповідно до розміру вектора,
який повідомляє ця модель.

### Плагін завантажується, але спогади не з'являються

Перевірте, що `plugins.slots.memory` вказує на `memory-lancedb`, потім виконайте:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Якщо `autoCapture` вимкнено, плагін пригадуватиме наявні спогади, але
не зберігатиме нові автоматично. Використовуйте інструмент `memory_store` або увімкніть
`autoCapture`, якщо хочете автоматичну фіксацію.

## Пов'язане

- [Огляд пам'яті](/uk/concepts/memory)
- [Active Memory](/uk/concepts/active-memory)
- [Пошук у пам'яті](/uk/concepts/memory-search)
- [Memory Wiki](/uk/plugins/memory-wiki)
- [Ollama](/uk/providers/ollama)
