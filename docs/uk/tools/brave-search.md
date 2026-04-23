---
read_when:
    - Ви хочете використовувати пошук Brave для `web_search`
    - Вам потрібен `BRAVE_API_KEY` або деталі тарифного плану
summary: Налаштування API пошуку Brave для `web_search`
title: Пошук Brave
x-i18n:
    generated_at: "2026-04-23T21:13:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9265153d8e7ccfe777617459d18a02e4cee7a1806d89f3ddf92d14ba7bf87a43
    source_path: tools/brave-search.md
    workflow: 15
---

# API пошуку Brave

OpenClaw підтримує API пошуку Brave як provider для `web_search`.

## Отримання API key

1. Створіть акаунт Brave Search API на [https://brave.com/search/api/](https://brave.com/search/api/)
2. У dashboard виберіть план **Search** і згенеруйте API key.
3. Збережіть ключ у config або задайте `BRAVE_API_KEY` у середовищі Gateway.

## Приклад config

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // або "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Специфічні для provider-а налаштування пошуку Brave тепер живуть у `plugins.entries.brave.config.webSearch.*`.
Застарілий `tools.web.search.apiKey` усе ще завантажується через compatibility shim, але більше не є канонічним шляхом config.

`webSearch.mode` керує transport Brave:

- `web` (типово): звичайний веб-пошук Brave з назвами, URL і snippet-ами
- `llm-context`: API LLM Context Brave з попередньо витягнутими текстовими фрагментами та джерелами для grounding

## Параметри інструмента

| Параметр      | Опис                                                                  |
| ------------- | --------------------------------------------------------------------- |
| `query`       | Пошуковий запит (обов’язково)                                         |
| `count`       | Кількість результатів для повернення (1-10, типово: 5)                |
| `country`     | 2-літерний код країни ISO (наприклад, "US", "DE")                     |
| `language`    | Код мови ISO 639-1 для результатів пошуку (наприклад, "en", "de", "fr") |
| `search_lang` | Код мови пошуку Brave (наприклад, `en`, `en-gb`, `zh-hans`)           |
| `ui_lang`     | Код мови ISO для елементів UI                                         |
| `freshness`   | Часовий фільтр: `day` (24h), `week`, `month` або `year`               |
| `date_after`  | Лише результати, опубліковані після цієї дати (YYYY-MM-DD)            |
| `date_before` | Лише результати, опубліковані до цієї дати (YYYY-MM-DD)               |

**Приклади:**

```javascript
// Пошук для конкретної країни та мови
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Нещодавні результати (за останній тиждень)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Пошук за діапазоном дат
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Примітки

- OpenClaw використовує план Brave **Search**. Якщо у вас застаріла підписка (наприклад, оригінальний Free plan із 2,000 запитами/місяць), вона лишається дійсною, але не включає новіші можливості, як-от LLM Context або вищі rate limit-и.
- Кожен план Brave включає **\$5/місяць безплатного кредиту** (з поновленням). План Search коштує \$5 за 1,000 запитів, тож кредит покриває 1,000 запитів/місяць. Встановіть свій usage limit у dashboard Brave, щоб уникнути неочікуваних витрат. Поточні плани див. в [порталі API Brave](https://brave.com/search/api/).
- План Search включає endpoint LLM Context і права AI inference. Зберігання результатів для навчання або tuning моделей потребує плану з явними правами на зберігання. Див. [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Режим `llm-context` повертає grounded source entries замість звичайної форми snippet веб-пошуку.
- Режим `llm-context` не підтримує `ui_lang`, `freshness`, `date_after` або `date_before`.
- `ui_lang` має включати підтег регіону, наприклад `en-US`.
- Результати типово кешуються на 15 хвилин (налаштовується через `cacheTtlMinutes`).

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі provider-и й автоматичне виявлення
- [Пошук Perplexity](/uk/tools/perplexity-search) -- структуровані результати з фільтрацією за доменами
- [Пошук Exa](/uk/tools/exa-search) -- нейронний пошук із витягуванням контенту
