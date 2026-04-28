---
read_when:
    - Ви налаштовуєте вбудований плагін memory-lancedb
    - Вам потрібна довготривала пам’ять на базі LanceDB з автоматичним пригадуванням або автоматичним збереженням
    - Ви використовуєте локальні ембединги, сумісні з OpenAI, наприклад Ollama
sidebarTitle: Memory LanceDB
summary: Налаштуйте вбудований плагін пам’яті LanceDB, включно з локальними ембедингами, сумісними з Ollama
title: Пам’ять LanceDB
x-i18n:
    generated_at: "2026-04-28T00:03:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3d0e1a286dfae36967a04863c047f40b629656efa62364c65e67283d3c7a945
    source_path: plugins/memory-lancedb.md
    workflow: 15
---

`memory-lancedb` — це вбудований плагін пам’яті, який зберігає довготривалу пам’ять у
LanceDB і використовує ембединги для пригадування. Він може автоматично
пригадувати релевантні спогади перед ходом моделі та фіксувати важливі факти
після відповіді.

Використовуйте його, якщо вам потрібна локальна векторна база даних для пам’яті,
потрібна точка доступу до ембедингів, сумісна з OpenAI, або якщо ви хочете
зберігати базу даних пам’яті поза типовим вбудованим сховищем пам’яті.

<Note>
`memory-lancedb` — це активний плагін пам’яті. Увімкніть його, вибравши слот
пам’яті через `plugins.slots.memory = "memory-lancedb"`. Супутні плагіни, такі як
`memory-wiki`, можуть працювати поруч із ним, але лише один плагін володіє
слотом Active Memory.
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
            apiKey: "${OPENAI_API_KEY}",
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

## Ембединги Ollama

`memory-lancedb` викликає ембединги через API ембедингів, сумісний з OpenAI.
Для ембедингів Ollama використовуйте тут endpoint сумісності Ollama `/v1`. Це
стосується лише ембедингів; провайдер чату/моделей Ollama використовує нативний
URL API Ollama, описаний у [Ollama](/uk/providers/ollama).

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
            apiKey: "ollama",
            baseUrl: "http://127.0.0.1:11434/v1",
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

Установіть `dimensions` для нестандартних моделей ембедингів. OpenClaw знає
розмірність для `text-embedding-3-small` і `text-embedding-3-large`; для
користувацьких моделей потрібно вказати це значення в конфігурації, щоб LanceDB
міг створити векторний стовпець.

Для невеликих локальних моделей ембедингів зменште `recallMaxChars`, якщо
бачите помилки довжини контексту від локального сервера.

## Обмеження пригадування та збереження

`memory-lancedb` має два окремі текстові обмеження:

| Налаштування     | Типово  | Діапазон  | Застосовується до                             |
| ---------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | тексту, надісланого до API ембедингів для пригадування |
| `captureMaxChars` | `500`   | 100-10000 | довжини повідомлення асистента, придатної для збереження |

`recallMaxChars` керує автоматичним пригадуванням, інструментом `memory_recall`,
шляхом запиту `memory_forget` і `openclaw ltm search`. Автоматичне пригадування
надає перевагу останньому повідомленню користувача в ході та повертається до
повного prompt лише тоді, коли повідомлення користувача недоступне. Це дозволяє
не включати метадані каналу й великі блоки prompt у запит на ембединг.

`captureMaxChars` визначає, чи є відповідь достатньо короткою, щоб її можна було
розглядати для автоматичного збереження. Це не обмежує ембединги запитів для
пригадування.

## Команди

Коли `memory-lancedb` є активним плагіном пам’яті, він реєструє простір імен CLI
`ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Агенти також отримують інструменти пам’яті LanceDB від активного плагіна пам’яті:

- `memory_recall` для пригадування на базі LanceDB
- `memory_store` для збереження важливих фактів, уподобань, рішень і сутностей
- `memory_forget` для видалення відповідних спогадів

## Сховище

Типово дані LanceDB розміщуються в `~/.openclaw/memory/lancedb`. Щоб змінити
шлях, використайте `dbPath`:

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

`storageOptions` приймає рядкові пари ключ/значення для бекендів сховища LanceDB
і підтримує розгортання `${ENV_VAR}`:

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

`memory-lancedb` залежить від нативного пакета `@lancedb/lancedb`. Паковані
встановлення OpenClaw спочатку намагаються використати вбудовану залежність
середовища виконання та можуть відновити залежність середовища виконання плагіна
в стані OpenClaw, якщо вбудований імпорт недоступний.

Якщо в старішому встановленні під час завантаження плагіна в журналі з’являється
помилка про відсутній `dist/package.json` або відсутній `@lancedb/lancedb`,
оновіть OpenClaw і перезапустіть Gateway.

Якщо плагін журналює, що LanceDB недоступний на `darwin-x64`, використовуйте на
цій машині типовий бекенд пам’яті, перенесіть Gateway на підтримувану платформу
або вимкніть `memory-lancedb`.

## Усунення проблем

### Довжина вхідних даних перевищує довжину контексту

Зазвичай це означає, що модель ембедингів відхилила запит на пригадування:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Установіть менше значення `recallMaxChars`, а потім перезапустіть Gateway:

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

Для Ollama також перевірте, що сервер ембедингів доступний з хоста Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Непідтримувана модель ембедингів

Без `dimensions` відомі лише вбудовані розмірності ембедингів OpenAI. Для
локальних або користувацьких моделей ембедингів установіть `embedding.dimensions`
у розмір вектора, який повідомляє ця модель.

### Плагін завантажується, але спогади не з’являються

Перевірте, що `plugins.slots.memory` вказує на `memory-lancedb`, а потім
виконайте:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Якщо `autoCapture` вимкнено, плагін пригадуватиме наявні спогади, але не
зберігатиме автоматично нові. Використовуйте інструмент `memory_store` або
увімкніть `autoCapture`, якщо хочете автоматичне збереження.

## Пов’язані матеріали

- [Огляд пам’яті](/uk/concepts/memory)
- [Active Memory](/uk/concepts/active-memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
- [Memory Wiki](/uk/plugins/memory-wiki)
- [Ollama](/uk/providers/ollama)
