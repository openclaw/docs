---
read_when:
    - Ви хочете використовувати Exa для web_search
    - Вам потрібен EXA_API_KEY
    - Вам потрібен нейронний пошук або вилучення вмісту
summary: Пошук Exa AI — нейронний пошук і пошук за ключовими словами з видобуванням вмісту
title: Пошук Exa
x-i18n:
    generated_at: "2026-07-12T13:51:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) — це провайдер `web_search` із нейронним, ключовим і
гібридним режимами пошуку, а також вбудованим видобуванням вмісту (виділені
фрагменти, текст, резюме).

## Установлення Plugin

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Отримання ключа API

<Steps>
  <Step title="Створення облікового запису">
    Зареєструйтеся на [exa.ai](https://exa.ai/) і згенеруйте ключ API на своїй
    панелі керування.
  </Step>
  <Step title="Збереження ключа">
    Задайте `EXA_API_KEY` у середовищі Gateway або налаштуйте за допомогою:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Конфігурація

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // необов’язково, якщо задано EXA_API_KEY
            baseUrl: "https://api.exa.ai", // необов’язково; OpenClaw додає /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Альтернатива через середовище:** задайте `EXA_API_KEY` у середовищі Gateway. Для
встановлення Gateway додайте його до `~/.openclaw/.env`. Див.
[Змінні середовища](/uk/help/faq#env-vars-and-env-loading).

## Перевизначення базової URL-адреси

Задайте `plugins.entries.exa.config.webSearch.baseUrl`, щоб спрямувати пошукові
запити Exa через сумісний проксі-сервер або альтернативну кінцеву точку. OpenClaw
нормалізує адреси без протоколу, додаючи на початку `https://`, і додає `/search`,
якщо шлях ще не закінчується на нього. Визначена кінцева точка є частиною ключа
кешу пошуку, тому результати з різних кінцевих точок ніколи не використовуються
спільно.

## Параметри інструмента

<ParamField path="query" type="string" required>
Пошуковий запит.
</ParamField>

<ParamField path="count" type="number" default="5">
Кількість результатів (1–100 з урахуванням обмежень типу пошуку Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Режим пошуку.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Часовий фільтр. Не можна поєднувати з `date_after`/`date_before`.
</ParamField>

<ParamField path="date_after" type="string">
Результати після цієї дати (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Результати до цієї дати (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Параметри видобування вмісту (див. нижче).
</ParamField>

### Видобування вмісту

Передайте об’єкт `contents`, щоб керувати видобутим вмістом у результатах:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // повний текст сторінки
    highlights: { numSentences: 3 }, // ключові речення
    summary: true, // резюме від ШІ
  },
});
```

| Параметр вмісту | Тип                                                                   | Опис                           |
| --------------- | --------------------------------------------------------------------- | ------------------------------ |
| `text`          | `boolean \| { maxCharacters }`                                        | Видобути повний текст сторінки |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Видобути ключові речення       |
| `summary`       | `boolean \| { query }`                                                | Резюме, згенероване ШІ         |

Якщо `contents` не вказано, Exa за замовчуванням використовує
`{ highlights: true }`, тому результати містять уривки з ключовими реченнями.
Описи результатів формуються спочатку з виділених фрагментів, потім із резюме,
а потім із повного тексту — залежно від того, що доступне першим. Результати
також зберігають необроблені поля `highlightScores` і `summary` з відповіді API
Exa, якщо вони доступні.

### Режими пошуку

| Режим            | Опис                                        |
| ---------------- | ------------------------------------------- |
| `auto`           | Exa вибирає найкращий режим (типово)        |
| `neural`         | Семантичний пошук за значенням              |
| `fast`           | Швидкий пошук за ключовими словами          |
| `deep`           | Ретельний поглиблений пошук                 |
| `deep-reasoning` | Поглиблений пошук із міркуванням            |
| `instant`        | Найшвидше отримання результатів             |

## Примітки

- `count` приймає значення до 100 з урахуванням обмежень типу пошуку Exa.
- За замовчуванням результати кешуються на 15 хвилин. Налаштуйте спільні
  `tools.web.search.cacheTtlMinutes` (у хвилинах) і
  `tools.web.search.timeoutSeconds` (типово 30 с), щоб змінити кешування та
  час очікування запитів для всіх провайдерів `web_search`, включно з Exa.

## Пов’язані матеріали

- [Огляд вебпошуку](/uk/tools/web) — усі провайдери й автоматичне виявлення
- [Brave Search](/uk/tools/brave-search) — структуровані результати з фільтрами за країною та мовою
- [Perplexity Search](/uk/tools/perplexity-search) — структуровані результати з фільтрацією за доменами
