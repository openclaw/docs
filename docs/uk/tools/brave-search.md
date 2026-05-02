---
read_when:
    - Ви хочете використовувати Brave Search для web_search
    - Потрібен BRAVE_API_KEY або відомості про план
summary: Налаштування Brave Search API для web_search
title: Пошук Brave
x-i18n:
    generated_at: "2026-05-02T06:53:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06cfef368f01d0af91ddb4e8adc13b7699019cbf662783b88c573049bfb77e18
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw підтримує Brave Search API як провайдера `web_search`.

## Отримання API-ключа

1. Створіть обліковий запис Brave Search API на [https://brave.com/search/api/](https://brave.com/search/api/)
2. На панелі керування виберіть тариф **Search** і згенеруйте API-ключ.
3. Збережіть ключ у конфігурації або задайте `BRAVE_API_KEY` у середовищі Gateway.

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

Специфічні для провайдера налаштування пошуку Brave тепер розміщені в `plugins.entries.brave.config.webSearch.*`.
Застарілий `tools.web.search.apiKey` досі завантажується через сумісний прошарок, але це більше не канонічний шлях конфігурації.

`webSearch.mode` керує транспортом Brave:

- `web` (за замовчуванням): звичайний вебпошук Brave із заголовками, URL-адресами та фрагментами
- `llm-context`: Brave LLM Context API із попередньо витягнутими текстовими фрагментами та джерелами для обґрунтування

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
Код мови ISO для елементів інтерфейсу користувача.
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

- OpenClaw використовує тариф Brave **Search**. Якщо у вас застаріла підписка (наприклад, початковий тариф Free з 2 000 запитів на місяць), вона залишається чинною, але не включає новіші функції, як-от LLM Context або вищі ліміти швидкості.
- Кожен тариф Brave включає **\$5/місяць безкоштовного кредиту** (з поновленням). Тариф Search коштує \$5 за 1 000 запитів, тож кредит покриває 1 000 запитів на місяць. Задайте ліміт використання на панелі керування Brave, щоб уникнути неочікуваних витрат. Актуальні тарифи дивіться на [порталі Brave API](https://brave.com/search/api/).
- Тариф Search включає кінцеву точку LLM Context і права на AI-інференс. Зберігання результатів для навчання або донавчання моделей потребує тарифу з явними правами на зберігання. Дивіться Brave [Умови надання послуг](https://api-dashboard.search.brave.com/terms-of-service).
- Режим `llm-context` повертає обґрунтовані записи джерел замість звичайної форми фрагментів вебпошуку.
- Режим `llm-context` підтримує `freshness` і обмежені діапазони `date_after` + `date_before`. Він не підтримує `ui_lang`; `date_before` без `date_after` відхиляється, оскільки Brave вимагає, щоб власні діапазони свіжості містили і дату початку, і дату завершення.
- `ui_lang` має містити регіональний підтеґ, наприклад `en-US`.
- Результати кешуються на 15 хвилин за замовчуванням (налаштовується через `cacheTtlMinutes`).
- Увімкніть діагностичний прапорець `brave.http`, щоб під час усунення несправностей журналювати URL-адреси/параметри запитів Brave, статус/час відповіді та події влучання/промаху/запису пошукового кешу. Прапорець ніколи не журналює API-ключ або тіла відповідей, але пошукові запити можуть бути чутливими.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автовиявлення
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати з фільтрацією за доменами
- [Exa Search](/uk/tools/exa-search) -- нейронний пошук із витягуванням вмісту
