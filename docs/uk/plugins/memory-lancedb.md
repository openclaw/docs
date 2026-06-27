---
read_when:
    - Ви налаштовуєте плагін memory-lancedb
    - Вам потрібна довготривала пам’ять на основі LanceDB з автоматичним пригадуванням або автоматичним захопленням.
    - Ви використовуєте локальні OpenAI-сумісні ембеддинги, як-от Ollama
sidebarTitle: Memory LanceDB
summary: Налаштуйте офіційний зовнішній Plugin пам’яті LanceDB, зокрема локальні ембеддинги, сумісні з Ollama
title: Пам’ять LanceDB
x-i18n:
    generated_at: "2026-06-27T17:53:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` — це офіційний зовнішній plugin памʼяті, який зберігає довгострокову памʼять у
LanceDB і використовує вбудовування для пригадування. Він може автоматично пригадувати релевантні
спогади перед ходом моделі та фіксувати важливі факти після відповіді.

Використовуйте його, коли потрібна локальна векторна база даних для памʼяті, потрібна
OpenAI-сумісна кінцева точка вбудовувань або коли потрібно тримати базу даних памʼяті поза
стандартним вбудованим сховищем памʼяті.

## Встановлення

Установіть `memory-lancedb` перед налаштуванням `plugins.slots.memory = "memory-lancedb"`:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin опубліковано в npm, і його не вбудовано в образ runtime OpenClaw.
Інсталятор записує запис plugin і перемикає слот памʼяті, якщо ним не володіє інший
plugin.

<Note>
`memory-lancedb` — це plugin Active Memory. Увімкніть його, вибравши слот памʼяті
через `plugins.slots.memory = "memory-lancedb"`. Супутні plugins, як-от
`memory-wiki`, можуть працювати поруч із ним, але активним слотом памʼяті володіє лише один plugin.
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

## Вбудовування на базі постачальника

`memory-lancedb` може використовувати ті самі адаптери постачальників вбудовувань памʼяті, що й
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

Цей шлях працює з профілями автентифікації постачальників, які надають облікові дані для вбудовувань.
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

OpenAI Codex / ChatGPT OAuth не є обліковими даними вбудовувань OpenAI Platform.
Для вбудовувань OpenAI використовуйте профіль автентифікації з API-ключем OpenAI,
`OPENAI_API_KEY` або `models.providers.openai.apiKey`. Користувачі лише з OAuth можуть використовувати
іншого постачальника з підтримкою вбудовувань, наприклад GitHub Copilot або Ollama.

## Вбудовування Ollama

Для вбудовувань Ollama надавайте перевагу вбудованому постачальнику вбудовувань Ollama. Він використовує
нативну кінцеву точку Ollama `/api/embed` і дотримується тих самих правил автентифікації/base URL, що й
постачальник Ollama, описаний у [Ollama](/uk/providers/ollama).

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
розмірності для `text-embedding-3-small` і `text-embedding-3-large`; для власних
моделей потрібно вказати це значення в конфігурації, щоб LanceDB могла створити векторний стовпець.

Для невеликих локальних моделей вбудовувань зменште `recallMaxChars`, якщо бачите помилки
довжини контексту від локального сервера.

## OpenAI-сумісні постачальники

Деякі OpenAI-сумісні постачальники вбудовувань відхиляють параметр `encoding_format`,
а інші ігнорують його й завжди повертають вектори `number[]`.
Тому `memory-lancedb` не вказує `encoding_format` у запитах вбудовувань і
приймає або відповіді з масивом чисел із рухомою комою, або base64-кодовані відповіді float32.

Якщо у вас є сира OpenAI-сумісна кінцева точка вбудовувань, для якої немає
вбудованого адаптера постачальника, не вказуйте `embedding.provider` (або залиште його як `openai`) і
задайте `embedding.apiKey` разом із `embedding.baseUrl`. Це зберігає прямий
шлях OpenAI-сумісного клієнта.

Задайте `embedding.dimensions` для постачальників, розмірності моделей яких не вбудовані.
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

`memory-lancedb` має два окремі обмеження тексту:

| Налаштування      | Типове значення | Діапазон | Застосовується до                                      |
| ----------------- | --------------- | -------- | ------------------------------------------------------ |
| `recallMaxChars`  | `1000`          | 100-10000 | тексту, надісланого до API вбудовувань для пригадування |
| `captureMaxChars` | `500`           | 100-10000 | довжини повідомлення, придатної для автоматичної фіксації |
| `customTriggers`  | `[]`            | 0-50      | буквальних фраз, які змушують автоматичну фіксацію розглядати повідомлення |

`recallMaxChars` керує автоматичним пригадуванням, інструментом `memory_recall`, шляхом запиту
`memory_forget` і `openclaw ltm search`. Автоматичне пригадування надає перевагу
останньому повідомленню користувача з ходу й повертається до повного prompt лише тоді, коли
повідомлення користувача недоступне. Це не допускає метадані каналу та великі блоки prompt
до запиту вбудовувань.

`captureMaxChars` керує тим, чи відповідь достатньо коротка, щоб її можна було розглядати
для автоматичної фіксації. Він не обмежує вбудовування запитів пригадування.

`customTriggers` дає змогу додавати буквальні фрази автоматичної фіксації без написання
регулярних виразів. Вбудовані тригери містять поширені фрази памʼяті англійською, чеською,
китайською, японською та корейською мовами.

## Команди

Коли `memory-lancedb` є активним plugin памʼяті, він реєструє простір імен CLI
`ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Підкоманда `query` виконує невекторний запит безпосередньо до таблиці LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: список дозволених стовпців, розділених комами (типово `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: SQL-подібна умова WHERE; обмежена 200 символами та дозволяє лише літери й цифри, оператори порівняння, лапки, дужки й невеликий набір безпечної пунктуації.
- `--limit <n>`: додатне ціле число; типово `10`.
- `--order-by <column>:<asc|desc>`: сортування в памʼяті, застосоване після фільтра; стовпець сортування автоматично додається до проєкції.

Агенти також отримують інструменти памʼяті LanceDB від активного plugin памʼяті:

- `memory_recall` для пригадування на базі LanceDB
- `memory_store` для збереження важливих фактів, налаштувань, рішень і сутностей
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

## Залежності runtime

`memory-lancedb` залежить від нативного пакета `@lancedb/lancedb`. У пакетованому
OpenClaw цей пакет вважається частиною пакета plugin. Запуск Gateway
не відновлює залежності plugin; якщо залежність відсутня, перевстановіть або
оновіть пакет plugin і перезапустіть Gateway.

Якщо старіше встановлення журналює помилку про відсутній `dist/package.json` або відсутній
`@lancedb/lancedb` під час завантаження plugin, оновіть OpenClaw і перезапустіть
Gateway.

Якщо plugin журналює, що LanceDB недоступна на `darwin-x64`, використовуйте стандартний
бекенд памʼяті на цій машині, перенесіть Gateway на підтримувану платформу або
вимкніть `memory-lancedb`.

## Усунення несправностей

### Довжина введення перевищує довжину контексту

Зазвичай це означає, що модель вбудовувань відхилила запит пригадування:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Задайте менше значення `recallMaxChars`, а потім перезапустіть Gateway:

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
Для локальних або власних моделей вбудовувань задайте `embedding.dimensions` як розмір вектора,
який повідомляє ця модель.

### Plugin завантажується, але спогади не зʼявляються

Перевірте, що `plugins.slots.memory` вказує на `memory-lancedb`, а потім виконайте:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Якщо `autoCapture` вимкнено, plugin пригадуватиме наявні спогади, але
не зберігатиме нові автоматично. Використовуйте інструмент `memory_store` або ввімкніть
`autoCapture`, якщо потрібна автоматична фіксація.

## Повʼязане

- [Огляд памʼяті](/uk/concepts/memory)
- [Active Memory](/uk/concepts/active-memory)
- [Пошук у памʼяті](/uk/concepts/memory-search)
- [Memory Wiki](/uk/plugins/memory-wiki)
- [Ollama](/uk/providers/ollama)
