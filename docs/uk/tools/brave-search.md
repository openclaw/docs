---
read_when:
    - Ви хочете використовувати Brave Search для web_search
    - Потрібен BRAVE_API_KEY або відомості про тарифний план
summary: Налаштування Brave Search API для web_search
title: Пошук Brave
x-i18n:
    generated_at: "2026-05-02T07:31:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ecb9e3e5475bb26f4058311429b558f49cdd1df907a622f93f297ac6569d65
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw підтримує Brave Search API як провайдера `web_search`.

## Отримання API-ключа

1. Створіть обліковий запис Brave Search API на [https://brave.com/search/api/](https://brave.com/search/api/)
2. У панелі керування виберіть план **Search** і згенеруйте API-ключ.
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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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
Застарілий `tools.web.search.apiKey` досі завантажується через shim сумісності, але більше не є канонічним шляхом конфігурації.

`webSearch.mode` керує транспортом Brave:

- `web` (за замовчуванням): звичайний вебпошук Brave із заголовками, URL-адресами та фрагментами
- `llm-context`: Brave LLM Context API із заздалегідь витягнутими текстовими фрагментами та джерелами для обґрунтування

`webSearch.baseUrl` може спрямовувати запити Brave до довіреного Brave-сумісного проксі
або gateway. OpenClaw додає `/res/v1/web/search` або `/res/v1/llm/context` до
налаштованої базової URL-адреси й зберігає базову URL-адресу в ключі кешу. Публічні
кінцеві точки мають використовувати `https://`; `http://` приймається лише для довірених loopback
або проксі-хостів приватної мережі.

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

- OpenClaw використовує план Brave **Search**. Якщо у вас є застаріла підписка (наприклад, початковий план Free із 2 000 запитів/місяць), вона залишається чинною, але не включає новіші можливості, як-от LLM Context або вищі ліміти частоти запитів.
- Кожен план Brave включає **\$5/місяць безкоштовного кредиту** (з поновленням). План Search коштує \$5 за 1 000 запитів, тому кредит покриває 1 000 запитів/місяць. Установіть ліміт використання в панелі керування Brave, щоб уникнути неочікуваних витрат. Поточні плани див. на [порталі Brave API](https://brave.com/search/api/).
- План Search включає кінцеву точку LLM Context і права на AI-виведення. Зберігання результатів для навчання або налаштування моделей потребує плану з явними правами на зберігання. Див. Brave [Умови надання послуг](https://api-dashboard.search.brave.com/terms-of-service).
- Режим `llm-context` повертає обґрунтовані записи джерел замість звичайної структури фрагментів вебпошуку.
- Режим `llm-context` підтримує `freshness` і обмежені діапазони `date_after` + `date_before`. Він не підтримує `ui_lang`; `date_before` без `date_after` відхиляється, оскільки Brave вимагає, щоб користувацькі діапазони актуальності містили і початкову, і кінцеву дати.
- `ui_lang` має містити регіональний підтег, наприклад `en-US`.
- Результати за замовчуванням кешуються на 15 хвилин (налаштовується через `cacheTtlMinutes`).
- Користувацькі значення `webSearch.baseUrl` включаються в ідентичність кешу Brave, тому
  відповіді, специфічні для проксі, не конфліктують.
- Увімкніть діагностичний прапорець `brave.http`, щоб під час усунення несправностей реєструвати URL-адреси/параметри запитів Brave, статус/час відповіді та події влучання/промаху/запису кешу пошуку. Прапорець ніколи не записує API-ключ або тіла відповідей, але пошукові запити можуть бути чутливими.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автоматичне виявлення
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати з фільтруванням за доменами
- [Exa Search](/uk/tools/exa-search) -- нейронний пошук із витягуванням вмісту
