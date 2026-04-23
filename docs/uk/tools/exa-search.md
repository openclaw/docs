---
read_when:
    - Ви хочете використовувати Exa для `web_search`
    - Вам потрібен `EXA_API_KEY`
    - Ви хочете нейронний пошук або витягування вмісту
summary: Пошук Exa AI — нейронний і ключовий пошук із витягуванням вмісту
title: Пошук Exa
x-i18n:
    generated_at: "2026-04-23T21:14:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a1d70ca56d13b5d2aaeab28e6c0557983a1d4422d5131dd4b99195234ad7a4c
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw підтримує [Exa AI](https://exa.ai/) як провайдера `web_search`. Exa
пропонує нейронний, ключовий і гібридний режими пошуку з вбудованим
витягуванням вмісту (highlights, text, summaries).

## Отримання API key

<Steps>
  <Step title="Створіть обліковий запис">
    Зареєструйтеся на [exa.ai](https://exa.ai/) і згенеруйте API key у своїй
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
Для встановлення gateway помістіть його в `~/.openclaw/.env`.

## Параметри інструмента

| Параметр     | Опис                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| `query`      | Пошуковий запит (обов’язково)                                                 |
| `count`      | Кількість результатів для повернення (1-100)                                  |
| `type`       | Режим пошуку: `auto`, `neural`, `fast`, `deep`, `deep-reasoning` або `instant` |
| `freshness`  | Фільтр часу: `day`, `week`, `month` або `year`                                |
| `date_after` | Результати після цієї дати (YYYY-MM-DD)                                       |
| `date_before`| Результати до цієї дати (YYYY-MM-DD)                                          |
| `contents`   | Параметри витягування вмісту (див. нижче)                                     |

### Витягування вмісту

Exa може повертати витягнутий вміст разом із результатами пошуку. Передайте об’єкт `contents`,
щоб увімкнути це:

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

| Параметр contents | Тип                                                                   | Опис                     |
| ----------------- | --------------------------------------------------------------------- | ------------------------ |
| `text`            | `boolean \| { maxCharacters }`                                        | Витягнути повний текст сторінки |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Витягнути ключові речення |
| `summary`         | `boolean \| { query }`                                                | AI-generated summary     |

### Режими пошуку

| Режим            | Опис                                 |
| ---------------- | ------------------------------------ |
| `auto`           | Exa обирає найкращий режим (типово)  |
| `neural`         | Семантичний/смисловий пошук          |
| `fast`           | Швидкий пошук за ключовими словами   |
| `deep`           | Ґрунтовний глибокий пошук            |
| `deep-reasoning` | Глибокий пошук з reasoning           |
| `instant`        | Найшвидші результати                 |

## Примітки

- Якщо не вказано параметр `contents`, Exa типово використовує `{ highlights: true }`,
  тож результати включають витяги ключових речень
- Результати зберігають поля `highlightScores` і `summary` з відповіді Exa API,
  якщо вони доступні
- Опис результатів визначається спочатку з highlights, потім із summary, потім
  з повного тексту — залежно від того, що доступно
- `freshness` і `date_after`/`date_before` не можна поєднувати — використовуйте
  один режим фільтра часу
- За один запит можна повернути до 100 результатів (залежно від лімітів
  типу пошуку Exa)
- Результати типово кешуються на 15 хвилин (можна налаштувати через
  `cacheTtlMinutes`)
- Exa — це офіційна інтеграція API зі структурованими JSON-відповідями

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автовиявлення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з фільтрами країни/мови
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати з фільтрацією доменів
