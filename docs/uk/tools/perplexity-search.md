---
read_when:
    - Ви хочете використовувати Perplexity Search для вебпошуку
    - Потрібно налаштувати PERPLEXITY_API_KEY або OPENROUTER_API_KEY
summary: Perplexity Search API і сумісність Sonar/OpenRouter для web_search
title: Пошук у Perplexity
x-i18n:
    generated_at: "2026-05-06T01:41:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 113abafae66acd8aaa0302b687ba13347eb44a81a4217b61bb68f07d8a119cb0
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw підтримує Perplexity Search API як провайдера `web_search`.
Він повертає структуровані результати з полями `title`, `url` і `snippet`.

Для сумісності OpenClaw також підтримує застарілі налаштування Perplexity Sonar/OpenRouter.
Якщо ви використовуєте `OPENROUTER_API_KEY`, ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey` або задаєте `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, провайдер перемикається на шлях chat-completions і повертає AI-синтезовані відповіді з цитуваннями замість структурованих результатів Search API.

## Отримання API-ключа Perplexity

1. Створіть обліковий запис Perplexity на [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Згенеруйте API-ключ у панелі керування
3. Збережіть ключ у конфігурації або задайте `PERPLEXITY_API_KEY` у середовищі Gateway.

## Сумісність з OpenRouter

Якщо ви вже використовували OpenRouter для Perplexity Sonar, залиште `provider: "perplexity"` і задайте `OPENROUTER_API_KEY` у середовищі Gateway або збережіть ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey`.

Необов’язкові параметри сумісності:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Приклади конфігурації

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

## Де задавати ключ

**Через конфігурацію:** виконайте `openclaw configure --section web`. Це зберігає ключ у
`~/.openclaw/openclaw.json` у `plugins.entries.perplexity.config.webSearch.apiKey`.
Це поле також приймає об’єкти SecretRef.

**Через середовище:** задайте `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
у середовищі процесу Gateway. Для встановленого gateway помістіть його в
`~/.openclaw/.env` (або у середовище вашої служби). Див. [змінні середовища](/uk/help/faq#env-vars-and-env-loading).

Якщо налаштовано `provider: "perplexity"` і SecretRef ключа Perplexity не розв’язується без резервного варіанта в середовищі, запуск/перезавантаження швидко завершується помилкою.

## Параметри інструмента

Ці параметри застосовуються до нативного шляху Perplexity Search API.

<ParamField path="query" type="string" required>
Пошуковий запит.
</ParamField>

<ParamField path="count" type="number" default="5">
Кількість результатів для повернення (1-10).
</ParamField>

<ParamField path="country" type="string">
2-літерний код країни ISO (наприклад, `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Код мови ISO 639-1 (наприклад, `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Фільтр часу - `day` означає 24 години.
</ParamField>

<ParamField path="date_after" type="string">
Лише результати, опубліковані після цієї дати (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Лише результати, опубліковані до цієї дати (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Масив дозволених/заборонених доменів (макс. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Загальний бюджет вмісту (макс. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Ліміт токенів на сторінку.
</ParamField>

Для застарілого шляху сумісності Sonar/OpenRouter:

- приймаються `query`, `count` і `freshness`
- `count` там призначений лише для сумісності; відповідь усе одно є однією синтезованою
  відповіддю з цитуваннями, а не списком із N результатів
- фільтри лише для Search API, такі як `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` і `max_tokens_per_page`,
  повертають явні помилки

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

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Правила фільтра доменів

- Максимум 20 доменів на фільтр
- Не можна змішувати список дозволених і список заборонених в одному запиті
- Використовуйте префікс `-` для записів списку заборонених (наприклад, `["-reddit.com"]`)

## Примітки

- Perplexity Search API повертає структуровані результати вебпошуку (`title`, `url`, `snippet`)
- OpenRouter або явні `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` перемикають Perplexity назад на chat completions Sonar для сумісності
- Сумісність Sonar/OpenRouter повертає одну синтезовану відповідь із цитуваннями, а не структуровані рядки результатів
- Результати кешуються на 15 хвилин за замовчуванням (налаштовується через `cacheTtlMinutes`)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Огляд вебпошуку" href="/uk/tools/web" icon="globe">
    Усі провайдери та правила автовизначення.
  </Card>
  <Card title="Пошук Brave" href="/uk/tools/brave-search" icon="shield">
    Структуровані результати з фільтрами країни та мови.
  </Card>
  <Card title="Пошук Exa" href="/uk/tools/exa-search" icon="magnifying-glass">
    Нейронний пошук із витягуванням вмісту.
  </Card>
  <Card title="Документація Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Офіційний quickstart і довідник Perplexity Search API.
  </Card>
</CardGroup>
