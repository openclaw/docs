---
read_when:
    - Ви хочете використовувати Perplexity Search для пошуку в Інтернеті
    - Потрібно налаштувати PERPLEXITY_API_KEY або OPENROUTER_API_KEY
summary: API пошуку Perplexity і сумісність Sonar/OpenRouter для web_search
title: Пошук Perplexity
x-i18n:
    generated_at: "2026-07-12T13:54:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw підтримує Perplexity Search API як провайдер `web_search`. Він повертає структуровані результати з полями `title`, `url` і `snippet`.

Для сумісності OpenClaw також підтримує застарілі конфігурації Perplexity Sonar/OpenRouter. Якщо ви використовуєте `OPENROUTER_API_KEY`, ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey` або задаєте `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, провайдер перемикається на шлях завершень чату й повертає синтезовані ШІ відповіді з посиланнями на джерела замість структурованих результатів Search API.

## Установлення Plugin

Установіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Отримання ключа Perplexity API

1. Створіть обліковий запис Perplexity на сторінці [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Згенеруйте ключ API на панелі керування.
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

**Через конфігурацію:** виконайте `openclaw configure --section web`. Команда зберігає ключ у `~/.openclaw/openclaw.json` у полі `plugins.entries.perplexity.config.webSearch.apiKey`. Це поле також приймає об’єкти SecretRef.

**Через середовище:** задайте `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY` у середовищі процесу Gateway. Для встановленого Gateway додайте його до `~/.openclaw/.env` (або до середовища вашої служби). Див. [Змінні середовища](/uk/help/faq#env-vars-and-env-loading).

Якщо налаштовано `provider: "perplexity"`, але SecretRef ключа Perplexity не вдалося розв’язати й немає резервного значення із середовища, запуск або перезавантаження негайно завершується помилкою.

## Параметри інструмента

Ці параметри застосовуються до нативного шляху Perplexity Search API.

<ParamField path="query" type="string" required>
Пошуковий запит.
</ParamField>

<ParamField path="count" type="number" default="5">
Кількість результатів, які потрібно повернути (1–10).
</ParamField>

<ParamField path="country" type="string">
Дволітерний код країни ISO (наприклад, `US`, `DE`).
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
Масив дозволених або заборонених доменів (не більше 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Загальний бюджет вмісту (не більше 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Обмеження кількості токенів на сторінку.
</ParamField>

Для застарілого шляху сумісності Sonar/OpenRouter:

- Приймаються `query`, `count` і `freshness`.
- `count` використовується там лише для сумісності; відповідь усе одно містить одну синтезовану відповідь із посиланнями на джерела, а не список із N результатів.
- Фільтри, доступні лише для Search API (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`), повертають явні помилки.

**Приклади:**

```javascript
// Пошук за країною та мовою
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

// Фільтрування доменів (список дозволених)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Фільтрування доменів (список заборонених — із префіксом -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Розширене вилучення вмісту
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Правила фільтрування доменів

- Не більше 20 доменів у фільтрі.
- В одному запиті не можна поєднувати записи зі списків дозволених і заборонених доменів.
- Для записів у списку заборонених доменів використовуйте префікс `-` (наприклад, `["-reddit.com"]`).

## Примітки

- Perplexity Search API повертає структуровані результати вебпошуку (`title`, `url`, `snippet`).
- OpenRouter або явно задані `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` перемикають Perplexity назад на завершення чату Sonar для сумісності.
- Режим сумісності Sonar/OpenRouter повертає одну синтезовану відповідь із посиланнями на джерела, а не структуровані рядки результатів.
- За замовчуванням результати кешуються на 15 хвилин (це можна налаштувати через `cacheTtlMinutes`).

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Огляд вебпошуку" href="/uk/tools/web" icon="globe">
    Усі провайдери та правила автоматичного виявлення.
  </Card>
  <Card title="Пошук Brave" href="/uk/tools/brave-search" icon="shield">
    Структуровані результати з фільтрами за країною та мовою.
  </Card>
  <Card title="Пошук Exa" href="/uk/tools/exa-search" icon="magnifying-glass">
    Нейронний пошук із вилученням вмісту.
  </Card>
  <Card title="Документація Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Офіційний короткий посібник і довідка з Perplexity Search API.
  </Card>
</CardGroup>
