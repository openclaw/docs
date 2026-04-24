---
read_when:
    - Ви хочете використовувати Exa для web_search
    - Вам потрібен `EXA_API_KEY`
    - Вам потрібен нейронний пошук або витягування вмісту
summary: Пошук Exa AI — нейронний пошук і пошук за ключовими словами з витягуванням вмісту
title: Пошук Exa
x-i18n:
    generated_at: "2026-04-24T02:51:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw підтримує [Exa AI](https://exa.ai/) як провайдера `web_search`. Exa
пропонує нейронний, за ключовими словами та гібридний режими пошуку з вбудованим
витягуванням вмісту (виділення, текст, підсумки).

## Отримання API-ключа

<Steps>
  <Step title="Створіть обліковий запис">
    Зареєструйтеся на [exa.ai](https://exa.ai/) і згенеруйте API-ключ у своїй
    панелі керування.
  </Step>
  <Step title="Збережіть ключ">
    Установіть `EXA_API_KEY` у середовищі Gateway або налаштуйте через:

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
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

**Альтернатива через середовище:** установіть `EXA_API_KEY` у середовищі Gateway.
Для встановлення gateway додайте його до `~/.openclaw/.env`.

## Параметри інструмента

<ParamField path="query" type="string" required>
Пошуковий запит.
</ParamField>

<ParamField path="count" type="number">
Кількість результатів для повернення (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Режим пошуку.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Часовий фільтр.
</ParamField>

<ParamField path="date_after" type="string">
Результати після цієї дати (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Результати до цієї дати (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Параметри витягування вмісту (див. нижче).
</ParamField>

### Витягування вмісту

Exa може повертати витягнутий вміст разом із результатами пошуку. Передайте об’єкт `contents`, щоб увімкнути це:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Параметр `contents` | Тип                                                                   | Опис                         |
| ------------------- | --------------------------------------------------------------------- | ---------------------------- |
| `text`              | `boolean \| { maxCharacters }`                                        | Витягнути повний текст сторінки |
| `highlights`        | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Витягнути ключові речення    |
| `summary`           | `boolean \| { query }`                                                | Підсумок, згенерований ШІ    |

### Режими пошуку

| Режим            | Опис                                  |
| ---------------- | ------------------------------------- |
| `auto`           | Exa вибирає найкращий режим (типово) |
| `neural`         | Семантичний пошук / пошук за змістом |
| `fast`           | Швидкий пошук за ключовими словами   |
| `deep`           | Ретельний глибокий пошук             |
| `deep-reasoning` | Глибокий пошук із міркуванням        |
| `instant`        | Найшвидші результати                 |

## Примітки

- Якщо параметр `contents` не вказано, Exa типово використовує `{ highlights: true }`,
  тож результати містять уривки з ключовими реченнями
- Результати зберігають поля `highlightScores` і `summary` з відповіді API Exa,
  коли вони доступні
- Описи результатів визначаються спочатку з highlights, потім із summary, а далі
  з повного тексту — залежно від того, що доступно
- `freshness` і `date_after`/`date_before` не можна поєднувати — використовуйте
  лише один режим часового фільтра
- Для одного запиту можна повернути до 100 результатів (залежно від обмежень
  типу пошуку Exa)
- Результати типово кешуються на 15 хвилин (можна налаштувати через
  `cacheTtlMinutes`)
- Exa — це офіційна інтеграція API зі структурованими JSON-відповідями

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автовизначення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з фільтрами країни/мови
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати з фільтрацією за доменами
