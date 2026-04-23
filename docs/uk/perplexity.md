---
read_when:
    - Ви хочете використовувати Perplexity Search для веб-пошуку
    - Вам потрібно налаштувати `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
summary: API пошуку Perplexity і сумісність Sonar/OpenRouter для `web_search`
title: Пошук Perplexity (legacy-шлях)
x-i18n:
    generated_at: "2026-04-23T20:59:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1196ff5bb8e319c7148207b6c394097aeb80a722e3dc7243314896465bd4248
    source_path: perplexity.md
    workflow: 15
---

# API пошуку Perplexity

OpenClaw підтримує API пошуку Perplexity як provider для `web_search`.
Він повертає структуровані результати з полями `title`, `url` і `snippet`.

Для сумісності OpenClaw також підтримує застарілі конфігурації Perplexity Sonar/OpenRouter.
Якщо ви використовуєте `OPENROUTER_API_KEY`, ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey` або задаєте `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, provider перемикається на шлях chat-completions і повертає згенеровані ШІ відповіді з цитуваннями замість структурованих результатів API пошуку.

## Отримання API key Perplexity

1. Створіть акаунт Perplexity на [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Згенеруйте API key у dashboard
3. Збережіть ключ у config або задайте `PERPLEXITY_API_KEY` у середовищі Gateway.

## Сумісність з OpenRouter

Якщо ви вже використовували OpenRouter для Perplexity Sonar, залишайте `provider: "perplexity"` і задайте `OPENROUTER_API_KEY` у середовищі Gateway або збережіть ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey`.

Необов’язкові елементи керування сумісністю:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Приклади config

### Нативний API пошуку Perplexity

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

## Де задавати ключ

**Через config:** виконайте `openclaw configure --section web`. Це збереже ключ у
`~/.openclaw/openclaw.json` під `plugins.entries.perplexity.config.webSearch.apiKey`.
Це поле також приймає об’єкти SecretRef.

**Через середовище:** задайте `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
у середовищі процесу Gateway. Для встановлення gateway розмістіть це в
`~/.openclaw/.env` (або у вашому середовищі сервісу). Див. [Env vars](/uk/help/faq#env-vars-and-env-loading).

Якщо налаштовано `provider: "perplexity"` і SecretRef для ключа Perplexity не вдається визначити без env fallback, startup/reload завершується помилкою одразу.

## Параметри інструмента

Ці параметри застосовуються до шляху нативного API пошуку Perplexity.

| Параметр             | Опис                                                 |
| -------------------- | ---------------------------------------------------- |
| `query`              | Пошуковий запит (обов’язково)                        |
| `count`              | Кількість результатів для повернення (1-10, типово: 5) |
| `country`            | 2-літерний код країни ISO (наприклад, "US", "DE")    |
| `language`           | Код мови ISO 639-1 (наприклад, "en", "de", "fr")     |
| `freshness`          | Часовий фільтр: `day` (24h), `week`, `month` або `year` |
| `date_after`         | Лише результати, опубліковані після цієї дати (YYYY-MM-DD) |
| `date_before`        | Лише результати, опубліковані до цієї дати (YYYY-MM-DD) |
| `domain_filter`      | Масив allowlist/denylist доменів (максимум 20)       |
| `max_tokens`         | Загальний бюджет контенту (типово: 25000, максимум: 1000000) |
| `max_tokens_per_page`| Ліміт токенів на сторінку (типово: 2048)             |

Для застарілого шляху сумісності Sonar/OpenRouter:

- приймаються `query`, `count` і `freshness`
- `count` там лише для сумісності; відповідь усе одно залишається однією синтезованою
  відповіддю з цитуваннями, а не списком із N результатів
- фільтри, доступні лише в API пошуку, як-от `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` і `max_tokens_per_page`,
  повертають явні помилки

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

// Фільтрація за доменами (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Фільтрація за доменами (denylist - префікс -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Розширене витягування контенту
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Правила `domain_filter`

- Максимум 20 доменів у фільтрі
- Не можна змішувати allowlist і denylist в одному запиті
- Для записів denylist використовуйте префікс `-` (наприклад, `["-reddit.com"]`)

## Примітки

- API пошуку Perplexity повертає структуровані результати веб-пошуку (`title`, `url`, `snippet`)
- OpenRouter або явне задання `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` перемикає Perplexity назад на Sonar chat completions для сумісності
- Сумісність Sonar/OpenRouter повертає одну синтезовану відповідь із цитуваннями, а не структуровані рядки результатів
- Результати типово кешуються на 15 хвилин (налаштовується через `cacheTtlMinutes`)

Повну конфігурацію `web_search` див. в [Web tools](/uk/tools/web).
Докладніше див. у [документації API пошуку Perplexity](https://docs.perplexity.ai/docs/search/quickstart).
