---
read_when:
    - Ви хочете використовувати Exa для web_search
    - Вам потрібен EXA_API_KEY
    - Вам потрібен нейронний пошук або видобування вмісту
summary: Пошук Exa AI -- нейронний і ключовий пошук із витягуванням вмісту
title: Пошук Exa
x-i18n:
    generated_at: "2026-06-27T18:24:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw підтримує [Exa AI](https://exa.ai/) як провайдера `web_search`. Exa
пропонує нейронний, ключовий і гібридний режими пошуку з вбудованим
витягуванням вмісту (виділення, текст, зведення).

## Встановлення Plugin

Встановіть офіційний Plugin, потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Отримання API-ключа

<Steps>
  <Step title="Створіть обліковий запис">
    Зареєструйтеся на [exa.ai](https://exa.ai/) і згенеруйте API-ключ зі своєї
    панелі керування.
  </Step>
  <Step title="Збережіть ключ">
    Задайте `EXA_API_KEY` у середовищі Gateway або налаштуйте через:

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
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**Альтернатива через середовище:** задайте `EXA_API_KEY` у середовищі Gateway.
Для встановлення gateway помістіть його в `~/.openclaw/.env`.

## Перевизначення базової URL-адреси

Задайте `plugins.entries.exa.config.webSearch.baseUrl`, коли пошукові запити Exa
мають проходити через сумісний проксі або альтернативну кінцеву точку Exa. OpenClaw
нормалізує голі хости, додаючи попереду `https://`, і додає `/search`, якщо
шлях ще не закінчується ним. Розв’язана кінцева точка включається в ключ кешу
пошуку, тому результати з різних кінцевих точок Exa не спільні.

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
Фільтр часу.
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

Exa може повертати витягнутий вміст разом із результатами пошуку. Передайте об’єкт `contents`,
щоб увімкнути:

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

| Параметр contents | Тип                                                                   | Опис                             |
| ----------------- | --------------------------------------------------------------------- | -------------------------------- |
| `text`            | `boolean \| { maxCharacters }`                                        | Витягнути повний текст сторінки  |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Витягнути ключові речення        |
| `summary`         | `boolean \| { query }`                                                | Зведення, згенероване ШІ         |

### Режими пошуку

| Режим            | Опис                                       |
| ---------------- | ------------------------------------------ |
| `auto`           | Exa вибирає найкращий режим (типово)       |
| `neural`         | Семантичний пошук на основі значення       |
| `fast`           | Швидкий пошук за ключовими словами         |
| `deep`           | Ретельний глибокий пошук                   |
| `deep-reasoning` | Глибокий пошук із міркуванням              |
| `instant`        | Найшвидші результати                       |

## Примітки

- Якщо параметр `contents` не надано, Exa типово використовує `{ highlights: true }`,
  тож результати містять уривки ключових речень
- Результати зберігають поля `highlightScores` і `summary` з відповіді Exa API,
  коли вони доступні
- Описи результатів визначаються спочатку з виділень, потім зі зведення, потім
  із повного тексту — залежно від того, що доступно
- `freshness` і `date_after`/`date_before` не можна поєднувати — використовуйте один
  режим фільтрації за часом
- За один запит можна повернути до 100 результатів (залежно від обмежень типу пошуку
  Exa)
- Результати типово кешуються на 15 хвилин (налаштовується через
  `cacheTtlMinutes`)
- Exa — офіційна API-інтеграція зі структурованими JSON-відповідями

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автовиявлення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з фільтрами країни/мови
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати з фільтрацією за доменом
