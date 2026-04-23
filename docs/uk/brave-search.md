---
read_when:
    - Ви хочете використовувати Brave Search для `web_search`
    - Вам потрібен `BRAVE_API_KEY` або відомості про тарифний план
summary: Налаштування API Brave Search для `web_search`
title: Brave Search (застарілий шлях)
x-i18n:
    generated_at: "2026-04-23T20:43:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad6ced1bc9a617d715e7d63589d2a894b82cddcbc80cc8c2bd4662681d229c13
    source_path: brave-search.md
    workflow: 15
---

# API Brave Search

OpenClaw підтримує API Brave Search як провайдера `web_search`.

## Отримання API-ключа

1. Створіть обліковий запис Brave Search API на [https://brave.com/search/api/](https://brave.com/search/api/)
2. На панелі керування виберіть тарифний план **Search** і згенеруйте API-ключ.
3. Збережіть ключ у конфігурації або встановіть `BRAVE_API_KEY` у середовищі Gateway.

## Приклад конфігурації

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
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

Специфічні для провайдера налаштування пошуку Brave тепер розміщуються в `plugins.entries.brave.config.webSearch.*`.
Застарілий шлях `tools.web.search.apiKey` усе ще завантажується через шар сумісності, але більше не є канонічним шляхом конфігурації.

`webSearch.mode` керує транспортом Brave:

- `web` (типово): звичайний вебпошук Brave із заголовками, URL-адресами та фрагментами
- `llm-context`: API LLM Context від Brave із попередньо витягнутими текстовими фрагментами та джерелами для обґрунтування

## Параметри інструмента

| Параметр     | Опис                                                                |
| ------------ | ------------------------------------------------------------------- |
| `query`      | Пошуковий запит (обов’язково)                                       |
| `count`      | Кількість результатів для повернення (1-10, типово: 5)              |
| `country`    | 2-літерний код країни ISO (наприклад, "US", "DE")                   |
| `language`   | Код мови ISO 639-1 для результатів пошуку (наприклад, "en", "de", "fr") |
| `search_lang`| Код мови пошуку Brave (наприклад, `en`, `en-gb`, `zh-hans`)         |
| `ui_lang`    | Код мови ISO для елементів інтерфейсу                               |
| `freshness`  | Фільтр часу: `day` (24 год), `week`, `month` або `year`             |
| `date_after` | Лише результати, опубліковані після цієї дати (YYYY-MM-DD)          |
| `date_before`| Лише результати, опубліковані до цієї дати (YYYY-MM-DD)             |

**Приклади:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Примітки

- OpenClaw використовує тарифний план Brave **Search**. Якщо у вас є застаріла підписка (наприклад, початковий безплатний план із 2 000 запитів на місяць), вона залишається чинною, але не включає новіші функції, як-от LLM Context або вищі ліміти швидкості.
- Кожен тарифний план Brave включає **\$5/місяць безплатного кредиту** (з поновленням). План Search коштує \$5 за 1 000 запитів, тож цей кредит покриває 1 000 запитів на місяць. Установіть ліміт використання на панелі керування Brave, щоб уникнути неочікуваних витрат. Актуальні тарифні плани дивіться на [порталі API Brave](https://brave.com/search/api/).
- План Search включає кінцеву точку LLM Context і права на AI inference. Зберігання результатів для навчання або налаштування моделей потребує плану з явними правами на зберігання. Див. [Умови надання послуг](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Режим `llm-context` повертає записи джерел з обґрунтуванням замість звичайної форми фрагментів вебпошуку.
- Режим `llm-context` не підтримує `ui_lang`, `freshness`, `date_after` або `date_before`.
- `ui_lang` має містити підтеґ регіону, як-от `en-US`.
- Результати типово кешуються на 15 хвилин (можна налаштувати через `cacheTtlMinutes`).

Повну конфігурацію `web_search` див. у [Веб-інструменти](/uk/tools/web).
