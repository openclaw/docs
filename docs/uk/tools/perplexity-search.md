---
read_when:
    - |-
      Ви хочете використовувати Perplexity Search для вебпошуку убриanalysis to=functions.read 】【。】【”】【commentary +天天中彩票json
      {"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n","offset":1,"limit":10}
    - Вам потрібно налаштувати `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
summary: Perplexity Search API та сумісність Sonar/OpenRouter для `web_search`
title: Пошук Perplexity
x-i18n:
    generated_at: "2026-04-23T21:16:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a6820c0ac45e30bf08b9739f528ce1e1434d1fe0b537d2b682332e28d3f8aec
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

OpenClaw підтримує Perplexity Search API як провайдера `web_search`.
Він повертає структуровані результати з полями `title`, `url` і `snippet`.

Для сумісності OpenClaw також підтримує застарілі конфігурації Perplexity Sonar/OpenRouter.
Якщо ви використовуєте `OPENROUTER_API_KEY`, ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey` або задаєте `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, провайдер перемикається на шлях chat-completions і повертає AI-синтезовані відповіді з цитатами замість структурованих результатів Search API.

## Отримання API key Perplexity

1. Створіть обліковий запис Perplexity на [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Згенеруйте API key у панелі керування
3. Збережіть ключ у config або задайте `PERPLEXITY_API_KEY` у середовищі Gateway.

## Сумісність з OpenRouter

Якщо ви вже використовували OpenRouter для Perplexity Sonar, залиште `provider: "perplexity"` і задайте `OPENROUTER_API_KEY` у середовищі Gateway, або збережіть ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey`.

Необов’язкові параметри сумісності:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Приклади config

### Нативний Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### Сумісність OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Де задати ключ

**Через config:** виконайте `openclaw configure --section web`. Ключ зберігається в
`~/.openclaw/openclaw.json` у `plugins.entries.perplexity.config.webSearch.apiKey`.
Це поле також приймає об’єкти SecretRef.

**Через середовище:** задайте `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
у середовищі процесу Gateway. Для встановленого gateway помістіть його в
`~/.openclaw/.env` (або у середовище вашого сервісу). Див. [Env vars](/uk/help/faq#env-vars-and-env-loading).

Якщо налаштовано `provider: "perplexity"` і SecretRef ключа Perplexity не визначено без fallback через env, startup/reload швидко завершується з помилкою.

## Параметри інструмента

Ці параметри застосовуються до нативного шляху Perplexity Search API.

| Parameter             | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| `query`               | Пошуковий запит (обов’язково)                               |
| `count`               | Кількість результатів для повернення (1-10, типово: 5)      |
| `country`             | 2-літерний код країни ISO (наприклад, "US", "DE")           |
| `language`            | Код мови ISO 639-1 (наприклад, "en", "de", "fr")            |
| `freshness`           | Фільтр часу: `day` (24h), `week`, `month` або `year`        |
| `date_after`          | Лише результати, опубліковані після цієї дати (YYYY-MM-DD)  |
| `date_before`         | Лише результати, опубліковані до цієї дати (YYYY-MM-DD)     |
| `domain_filter`       | Масив allowlist/denylist доменів (максимум 20)              |
| `max_tokens`          | Загальний бюджет вмісту (типово: 25000, максимум: 1000000)  |
| `max_tokens_per_page` | Ліміт токенів на сторінку (типово: 2048)                    |

Для застарілого шляху сумісності Sonar/OpenRouter:

- приймаються `query`, `count` і `freshness`
- `count` там використовується лише для сумісності; відповідь усе одно залишається однією синтезованою
  відповіддю з цитатами, а не списком із N результатів
- фільтри лише Search API, як-от `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` і `max_tokens_per_page`,
  повертають явні помилки

**Приклади:**

```javascript
// Пошук, специфічний для країни та мови
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Недавні результати (за останній тиждень)
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

// Фільтрація доменів (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Фільтрація доменів (denylist - префікс з -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Більше витягування вмісту
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Правила domain filter

- Максимум 20 доменів на фільтр
- Не можна змішувати allowlist і denylist в одному запиті
- Для записів denylist використовуйте префікс `-` (наприклад, `["-reddit.com"]`)

## Примітки

- Perplexity Search API повертає структуровані результати вебпошуку (`title`, `url`, `snippet`)
- OpenRouter або явні `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` знову перемикають Perplexity на Sonar chat completions для сумісності
- Сумісність Sonar/OpenRouter повертає одну синтезовану відповідь із цитатами, а не структуровані рядки результатів
- Результати типово кешуються на 15 хвилин (налаштовується через `cacheTtlMinutes`)

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери й автовизначення
- [Документація Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) -- офіційна документація Perplexity
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з фільтрами країни/мови
- [Exa Search](/uk/tools/exa-search) -- нейронний пошук із витягуванням вмісту
