---
read_when:
    - Ви налаштовуєте вбудований plugin memory-lancedb
    - Ви хочете довготривалу пам’ять на базі LanceDB з автоматичним пригадуванням або автоматичним захопленням
    - Ви використовуєте локальні ембединги, сумісні з OpenAI, наприклад Ollama
sidebarTitle: Memory LanceDB
summary: Налаштуйте вбудований Plugin пам’яті LanceDB, включно з локальними ембедингами, сумісними з Ollama
title: Пам’ять LanceDB
x-i18n:
    generated_at: "2026-04-28T00:49:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24f877d5fe17eecb182c0eec06c264a8e2f46d4e31987e1a10a320d36003662c
    source_path: plugins/memory-lancedb.md
    workflow: 15
---

`memory-lancedb` — це вбудований plugin пам’яті, який зберігає довготривалу пам’ять у
LanceDB і використовує ембединги для пригадування. Він може автоматично
пригадувати релевантні спогади перед ходом моделі та фіксувати важливі факти
після відповіді.

Використовуйте його, якщо вам потрібна локальна векторна база даних для пам’яті,
потрібна кінцева точка ембедингів, сумісна з OpenAI, або ви хочете зберігати
базу даних пам’яті поза типовим вбудованим сховищем пам’яті.

<Note>
`memory-lancedb` — це Active Memory plugin. Увімкніть його, вибравши слот пам’яті
через `plugins.slots.memory = "memory-lancedb"`. Супутні plugins, такі як
`memory-wiki`, можуть працювати поруч із ним, але лише один plugin володіє
активним слотом пам’яті.
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

## Ембединги через provider

`memory-lancedb` може використовувати ті самі адаптери provider ембедингів пам’яті, що й
`memory-core`. Встановіть `embedding.provider` і не вказуйте `embedding.apiKey`, щоб використовувати
налаштований профіль автентифікації provider, змінну середовища або
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

Цей шлях працює з профілями автентифікації provider, які надають облікові дані для ембедингів.
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

OAuth OpenAI Codex / ChatGPT (`openai-codex`) не є обліковими даними ембедингів
OpenAI Platform. Для ембедингів OpenAI використовуйте профіль автентифікації з API-ключем OpenAI,
`OPENAI_API_KEY` або `models.providers.openai.apiKey`. Користувачі, які мають лише OAuth,
можуть використовувати іншого provider, що підтримує ембединги, наприклад GitHub Copilot або Ollama.

## Ембединги Ollama

Для ембедингів Ollama віддавайте перевагу вбудованому provider ембедингів Ollama. Він використовує
рідну кінцеву точку Ollama `/api/embed` і дотримується тих самих правил автентифікації/base URL, що й
provider Ollama, описаний у [Ollama](/uk/providers/ollama).

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

Встановіть `dimensions` для нестандартних моделей ембедингів. OpenClaw знає
розмірності для `text-embedding-3-small` і `text-embedding-3-large`; для користувацьких
моделей потрібно вказати значення в конфігурації, щоб LanceDB міг створити векторний стовпець.

Для невеликих локальних моделей ембедингів зменште `recallMaxChars`, якщо бачите
помилки довжини контексту від локального сервера.

## Provider, сумісні з OpenAI

Деякі provider ембедингів, сумісні з OpenAI, відхиляють параметр `encoding_format`,
тоді як інші ігнорують його і завжди повертають вектори `number[]`.
Тому `memory-lancedb` не додає `encoding_format` до запитів ембедингів і
приймає як відповіді з масивом float, так і відповіді з float32 у кодуванні base64.

Якщо у вас є необроблена кінцева точка ембедингів, сумісна з OpenAI, для якої немає
вбудованого адаптера provider, не вказуйте `embedding.provider` (або залиште його як `openai`) і
задайте `embedding.apiKey` разом із `embedding.baseUrl`. Це збереже прямий шлях через
клієнт, сумісний з OpenAI.

Встановіть `embedding.dimensions` для provider, у яких розмірності моделі не є
вбудованими. Наприклад, ZhiPu `embedding-3` використовує `2048` розмірностей:

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

## Обмеження пригадування та захоплення

`memory-lancedb` має два окремі текстові обмеження:

| Налаштування     | Типово  | Діапазон  | Застосовується до                              |
| ---------------- | ------- | --------- | ---------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | тексту, що надсилається до API ембедингів для пригадування |
| `captureMaxChars` | `500`   | 100-10000 | довжини повідомлення асистента, придатної для захоплення   |

`recallMaxChars` керує авто-пригадуванням, інструментом `memory_recall`, шляхом запиту
`memory_forget` і `openclaw ltm search`. Авто-пригадування надає перевагу
останньому повідомленню користувача в ході та повертається до повного prompt лише тоді, коли
повідомлення користувача недоступне. Це не дає метаданим каналу та великим блокам prompt
потрапляти до запиту на ембединги.

`captureMaxChars` визначає, чи є відповідь достатньо короткою, щоб її можна було
розглядати для автоматичного захоплення. Це не обмежує ембединги запитів для пригадування.

## Команди

Коли `memory-lancedb` є активним plugin пам’яті, він реєструє простір імен CLI `ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Агенти також отримують інструменти пам’яті LanceDB від активного plugin пам’яті:

- `memory_recall` для пригадування на базі LanceDB
- `memory_store` для збереження важливих фактів, уподобань, рішень і сутностей
- `memory_forget` для видалення спогадів, що відповідають запиту

## Сховище

Типово дані LanceDB зберігаються в `~/.openclaw/memory/lancedb`. Перевизначте
шлях через `dbPath`:

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

`storageOptions` приймає строкові пари ключ/значення для бекендів сховища LanceDB і
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

## Залежності середовища виконання

`memory-lancedb` залежить від нативного пакета `@lancedb/lancedb`. Пакетні
встановлення OpenClaw спочатку намагаються використати вбудовану залежність середовища виконання і можуть
відновити залежність середовища виконання plugin у стані OpenClaw, якщо вбудований імпорт недоступний.

Якщо старіше встановлення записує в журнал помилку про відсутній `dist/package.json` або
відсутній `@lancedb/lancedb` під час завантаження plugin, оновіть OpenClaw і перезапустіть
Gateway.

Якщо plugin записує в журнал, що LanceDB недоступний на `darwin-x64`, використовуйте типовий
бекенд пам’яті на цій машині, перенесіть Gateway на підтримувану платформу або
вимкніть `memory-lancedb`.

## Усунення несправностей

### Довжина вхідних даних перевищує довжину контексту

Зазвичай це означає, що модель ембедингів відхилила запит на пригадування:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Встановіть менше значення `recallMaxChars`, а потім перезапустіть Gateway:

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
Для локальних або користувацьких моделей ембедингів встановіть `embedding.dimensions` у розмір
вектора, який повідомляє відповідна модель.

### Plugin завантажується, але спогади не з’являються

Перевірте, що `plugins.slots.memory` вказує на `memory-lancedb`, а потім виконайте:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Якщо `autoCapture` вимкнено, plugin пригадуватиме наявні спогади, але не
зберігатиме автоматично нові. Використайте інструмент `memory_store` або увімкніть
`autoCapture`, якщо хочете автоматичне захоплення.

## Пов’язане

- [Огляд пам’яті](/uk/concepts/memory)
- [Active Memory](/uk/concepts/active-memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
- [Memory Wiki](/uk/plugins/memory-wiki)
- [Ollama](/uk/providers/ollama)
