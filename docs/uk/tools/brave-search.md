---
read_when:
    - Ви хочете використовувати Brave Search для web_search
    - Вам потрібен BRAVE_API_KEY або відомості про тарифний план
summary: Налаштування Brave Search API для web_search
title: Пошук Brave
x-i18n:
    generated_at: "2026-07-12T13:49:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw підтримує Brave Search API як постачальника `web_search`.

## Отримання ключа API

1. Створіть обліковий запис Brave Search API на [https://brave.com/search/api/](https://brave.com/search/api/)
2. На панелі керування виберіть план **Search** і згенеруйте ключ API.
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
            mode: "web", // або "llm-context"
            baseUrl: "https://api.search.brave.com", // необов’язкове перевизначення проксі/базової URL-адреси
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

Специфічні для постачальника налаштування пошуку Brave розміщуються в `plugins.entries.brave.config.webSearch.*`; це канонічний шлях конфігурації. Спільний параметр верхнього рівня `tools.web.search.apiKey` і параметри в області `tools.web.search.brave.*` усе ще завантажуються через об’єднання для сумісності, але в новій конфігурації слід використовувати наведений вище шлях в області плагіна.

`webSearch.mode` керує транспортом Brave:

- `web` (типово): звичайний вебпошук Brave із заголовками, URL-адресами та фрагментами
- `llm-context`: Brave LLM Context API із попередньо вилученими текстовими фрагментами та джерелами для обґрунтування

`webSearch.baseUrl` може спрямовувати запити Brave через довірений сумісний із Brave проксі-сервер
або Gateway. OpenClaw додає `/res/v1/web/search` або `/res/v1/llm/context` до
налаштованої базової URL-адреси та включає її до ключа кешу. Загальнодоступні
кінцеві точки мають використовувати `https://`; `http://` приймається лише для довірених проксі-вузлів
local loopback або приватної мережі.

## Параметри інструмента

<ParamField path="query" type="string" required>
Пошуковий запит.
</ParamField>

<ParamField path="count" type="number" default="5">
Кількість результатів для повернення (1–10).
</ParamField>

<ParamField path="country" type="string">
Дволітерний код країни ISO (наприклад, `US`, `DE`).
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
Часовий фільтр — `day` означає 24 години.
</ParamField>

<ParamField path="date_after" type="string">
Лише результати, опубліковані після цієї дати (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Лише результати, опубліковані до цієї дати (`YYYY-MM-DD`).
</ParamField>

**Приклади:**

```javascript
// Пошук із зазначенням країни та мови
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

- OpenClaw використовує план Brave **Search**. Якщо у вас є застаріла підписка (наприклад, початковий план Free із 2 000 запитів на місяць), вона залишається чинною, але не включає новіші функції, як-от LLM Context або вищі обмеження частоти запитів.
- Кожен план Brave включає **безкоштовний кредит у розмірі \$5 на місяць** (поновлюється). План Search коштує \$5 за 1 000 запитів, тому кредит покриває 1 000 запитів на місяць. Установіть обмеження використання на панелі керування Brave, щоб уникнути неочікуваних витрат. Поточні плани наведено на [порталі Brave API](https://brave.com/search/api/).
- План Search включає кінцеву точку LLM Context і права на інференс ШІ. Для збереження результатів із метою навчання або налаштування моделей потрібен план із явними правами на зберігання. Перегляньте [Умови надання послуг](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Режим `llm-context` повертає обґрунтовані записи джерел замість звичайної структури фрагментів вебпошуку.
- Режим `llm-context` підтримує `freshness` і обмежені діапазони `date_after` + `date_before`. Він не підтримує `ui_lang`; значення `date_before` без `date_after` відхиляється, оскільки Brave вимагає, щоб користувацькі діапазони актуальності містили початкову й кінцеву дати.
- `ui_lang` має містити підтег регіону, наприклад `en-US`.
- Типово результати кешуються на 15 хвилин (налаштовується за допомогою `cacheTtlMinutes`).
- Користувацькі значення `webSearch.baseUrl` включаються до ідентифікатора кешу Brave, тому
  відповіді від різних проксі-серверів не конфліктують.
- Увімкніть діагностичний прапорець `brave.http`, щоб під час усунення несправностей журналювати URL-адреси й параметри запитів Brave, стан і тривалість відповіді, а також події влучання, промаху та запису кешу пошуку. Прапорець ніколи не журналює ключ API або тіла відповідей, але пошукові запити можуть містити конфіденційні дані.

## Пов’язані матеріали

- [Огляд вебпошуку](/uk/tools/web) -- усі постачальники й автоматичне виявлення
- [Пошук Perplexity](/uk/tools/perplexity-search) -- структуровані результати з фільтруванням за доменами
- [Пошук Exa](/uk/tools/exa-search) -- нейронний пошук із вилученням вмісту
