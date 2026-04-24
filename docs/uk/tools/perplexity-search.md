---
read_when:
    - Ви хочете використовувати Пошук Perplexity для вебпошуку
    - Вам потрібно налаштувати `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
summary: Сумісність Perplexity Search API та Sonar/OpenRouter для web_search
title: Пошук Perplexity
x-i18n:
    generated_at: "2026-04-24T02:51:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# API пошуку Perplexity

OpenClaw підтримує API пошуку Perplexity як провайдера `web_search`.
Він повертає структуровані результати з полями `title`, `url` і `snippet`.

Для сумісності OpenClaw також підтримує застарілі конфігурації Perplexity Sonar/OpenRouter.
Якщо ви використовуєте `OPENROUTER_API_KEY`, ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey` або задаєте `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, провайдер перемикається на шлях chat-completions і повертає згенеровані ШІ відповіді з цитуванням замість структурованих результатів API пошуку.

## Отримання API-ключа Perplexity

1. Створіть обліковий запис Perplexity на [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Згенеруйте API-ключ у панелі керування
3. Збережіть ключ у конфігурації або задайте `PERPLEXITY_API_KEY` у середовищі Gateway.

## Сумісність з OpenRouter

Якщо ви вже використовували OpenRouter для Perplexity Sonar, залиште `provider: "perplexity"` і задайте `OPENROUTER_API_KEY` у середовищі Gateway, або збережіть ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey`.

Необов’язкові елементи керування сумісністю:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Приклади конфігурації

### Власний API пошуку Perplexity

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

### Сумісність з OpenRouter / Sonar

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

**Через конфігурацію:** виконайте `openclaw configure --section web`. Це зберігає ключ у
`~/.openclaw/openclaw.json` у полі `plugins.entries.perplexity.config.webSearch.apiKey`.
Це поле також приймає об’єкти SecretRef.

**Через середовище:** задайте `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
у середовищі процесу Gateway. Для встановлення gateway додайте його до
`~/.openclaw/.env` (або до середовища вашого сервісу). Див. [Змінні середовища](/uk/help/faq#env-vars-and-env-loading).

Якщо налаштовано `provider: "perplexity"` і SecretRef ключа Perplexity не розв’язано без резервного значення з env, запуск/перезавантаження одразу завершується з помилкою.

## Параметри інструмента

Ці параметри застосовуються до власного шляху API пошуку Perplexity.

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
Код мови ISO 639-1 (наприклад, `en`, `de`, `fr`).
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

<ParamField path="domain_filter" type="string[]">
Масив allowlist/denylist доменів (максимум 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Загальний бюджет контенту (максимум 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Ліміт токенів на сторінку.
</ParamField>

Для застарілого шляху сумісності Sonar/OpenRouter:

- приймаються `query`, `count` і `freshness`
- `count` там доступний лише для сумісності; відповідь усе одно буде одним згенерованим
  варіантом відповіді з цитуванням, а не списком із N результатів
- фільтри, доступні лише в API пошуку, як-от `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` і `max_tokens_per_page`,
  повертають явні помилки

**Приклади:**

```javascript
// Пошук із урахуванням країни та мови
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Останні результати (за минулий тиждень)
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

// Фільтрація доменів (denylist — префікс -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Більший обсяг витягування контенту
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Правила фільтра domain_filter

- Максимум 20 доменів на фільтр
- Не можна змішувати allowlist і denylist в одному запиті
- Для елементів denylist використовуйте префікс `-` (наприклад, `["-reddit.com"]`)

## Примітки

- API пошуку Perplexity повертає структуровані результати вебпошуку (`title`, `url`, `snippet`)
- OpenRouter або явне задання `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` перемикає Perplexity назад на Sonar chat completions для сумісності
- Сумісність Sonar/OpenRouter повертає одну згенеровану відповідь з цитуванням, а не структуровані рядки результатів
- Результати кешуються на 15 хвилин за замовчуванням (налаштовується через `cacheTtlMinutes`)

## Пов’язане

- [Огляд вебпошуку](/uk/tools/web) -- усі провайдери та автовизначення
- [Документація API пошуку Perplexity](https://docs.perplexity.ai/docs/search/quickstart) -- офіційна документація Perplexity
- [Пошук Brave](/uk/tools/brave-search) -- структуровані результати з фільтрами країни/мови
- [Пошук Exa](/uk/tools/exa-search) -- нейронний пошук із витягуванням контенту
