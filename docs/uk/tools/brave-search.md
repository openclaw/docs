---
read_when:
    - Ви хочете використовувати Brave Search для `web_search`
    - Вам потрібен `BRAVE_API_KEY` або деталі плану
summary: Налаштування API Brave Search для `web_search`
title: Brave search
x-i18n:
    generated_at: "2026-04-24T02:52:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 15
---

# API Brave Search

OpenClaw підтримує API Brave Search як провайдера `web_search`.

## Отримання API-ключа

1. Створіть обліковий запис Brave Search API за адресою [https://brave.com/search/api/](https://brave.com/search/api/)
2. На панелі керування виберіть план **Search** і згенеруйте API-ключ.
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

Налаштування пошуку Brave, специфічні для провайдера, тепер розміщуються в `plugins.entries.brave.config.webSearch.*`.
Застарілий `tools.web.search.apiKey` усе ще завантажується через шар сумісності, але більше не є канонічним шляхом конфігурації.

`webSearch.mode` керує транспортом Brave:

- `web` (типово): звичайний вебпошук Brave із заголовками, URL-адресами та фрагментами
- `llm-context`: API LLM Context від Brave із попередньо витягнутими текстовими фрагментами та джерелами для обґрунтування

## Параметри інструмента

<ParamField path="query" type="string" required>
Пошуковий запит.
</ParamField>

<ParamField path="count" type="number" default="5">
Кількість результатів для повернення (1–10).
</ParamField>

<ParamField path="country" type="string">
2-літерний код країни ISO (наприклад, `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Код мови ISO 639-1 для результатів пошуку (наприклад, `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Код мови пошуку Brave (наприклад, `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Код мови ISO для елементів інтерфейсу.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Фільтр часу — `day` означає 24 години.
</ParamField>

<ParamField path="date_after" type="string">
Лише результати, опубліковані після цієї дати (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Лише результати, опубліковані до цієї дати (`YYYY-MM-DD`).
</ParamField>

**Приклади:**

```javascript
// Пошук із прив’язкою до країни та мови
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

- OpenClaw використовує план Brave **Search**. Якщо у вас є застаріла підписка (наприклад, початковий безплатний план із 2 000 запитів на місяць), вона залишається дійсною, але не включає новіші можливості, як-от LLM Context або вищі ліміти швидкості.
- Кожен план Brave включає **\$5/місяць безплатного кредиту** (з поновленням). План Search коштує \$5 за 1 000 запитів, тож кредит покриває 1 000 запитів на місяць. Установіть ліміт використання на панелі керування Brave, щоб уникнути неочікуваних витрат. Актуальні плани дивіться на [порталі API Brave](https://brave.com/search/api/).
- План Search включає endpoint LLM Context і права на AI inference. Збереження результатів для навчання або налаштування моделей потребує плану з явними правами на зберігання. Див. [Умови надання послуг](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Режим `llm-context` повертає обґрунтовані записи джерел замість звичайної форми фрагментів вебпошуку.
- Режим `llm-context` не підтримує `ui_lang`, `freshness`, `date_after` або `date_before`.
- `ui_lang` має містити регіональний підтеґ, наприклад `en-US`.
- Результати кешуються на 15 хвилин типово (налаштовується через `cacheTtlMinutes`).

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автоматичне виявлення
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати з фільтрацією за доменом
- [Exa Search](/uk/tools/exa-search) -- нейронний пошук із витягуванням вмісту
