---
read_when:
    - Вы хотите использовать Perplexity Search для веб-поиска
    - Необходимо настроить PERPLEXITY_API_KEY или OPENROUTER_API_KEY
summary: Perplexity Search API и совместимость Sonar/OpenRouter для web_search
title: Поиск Perplexity
x-i18n:
    generated_at: "2026-06-28T23:54:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef003238bc38dd3d92b98654598cba05fb1c324d8ca766a683cf1defe5bd435
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw поддерживает Perplexity Search API как провайдера `web_search`.
Он возвращает структурированные результаты с полями `title`, `url` и `snippet`.

Для совместимости OpenClaw также поддерживает устаревшие настройки Perplexity Sonar/OpenRouter.
Если вы используете `OPENROUTER_API_KEY`, ключ `sk-or-...` в `plugins.entries.perplexity.config.webSearch.apiKey` или задаете `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, провайдер переключается на путь chat-completions и возвращает сгенерированные ИИ ответы с цитированием вместо структурированных результатов Search API.

## Установите Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Получение API-ключа Perplexity

1. Создайте учетную запись Perplexity на [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Создайте API-ключ в панели управления
3. Сохраните ключ в конфигурации или задайте `PERPLEXITY_API_KEY` в окружении Gateway.

## Совместимость с OpenRouter

Если вы уже использовали OpenRouter для Perplexity Sonar, оставьте `provider: "perplexity"` и задайте `OPENROUTER_API_KEY` в окружении Gateway либо сохраните ключ `sk-or-...` в `plugins.entries.perplexity.config.webSearch.apiKey`.

Необязательные параметры совместимости:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Примеры конфигурации

### Нативный Perplexity Search API

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

### Совместимость с OpenRouter / Sonar

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

## Где задать ключ

**Через конфигурацию:** выполните `openclaw configure --section web`. Команда сохраняет ключ в
`~/.openclaw/openclaw.json` в поле `plugins.entries.perplexity.config.webSearch.apiKey`.
Это поле также принимает объекты SecretRef.

**Через окружение:** задайте `PERPLEXITY_API_KEY` или `OPENROUTER_API_KEY`
в окружении процесса Gateway. Для установки Gateway поместите его в
`~/.openclaw/.env` (или в окружение вашего сервиса). См. [Переменные окружения](/ru/help/faq#env-vars-and-env-loading).

Если настроен `provider: "perplexity"` и SecretRef ключа Perplexity не разрешается без резервного значения из окружения, запуск или перезагрузка быстро завершается ошибкой.

## Параметры инструмента

Эти параметры применяются к нативному пути Perplexity Search API.

<ParamField path="query" type="string" required>
Поисковый запрос.
</ParamField>

<ParamField path="count" type="number" default="5">
Количество возвращаемых результатов (1-10).
</ParamField>

<ParamField path="country" type="string">
Двухбуквенный код страны ISO (например, `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Код языка ISO 639-1 (например, `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Фильтр по времени: `day` означает 24 часа.
</ParamField>

<ParamField path="date_after" type="string">
Только результаты, опубликованные после этой даты (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Только результаты, опубликованные до этой даты (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Массив списка разрешенных или запрещенных доменов (максимум 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Общий бюджет содержимого (максимум 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Лимит токенов на страницу.
</ParamField>

Для устаревшего пути совместимости Sonar/OpenRouter:

- принимаются `query`, `count` и `freshness`
- `count` там предназначен только для совместимости; ответ все равно представляет собой один синтезированный
  ответ с цитированием, а не список из N результатов
- фильтры только для Search API, такие как `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` и `max_tokens_per_page`,
  возвращают явные ошибки

**Примеры:**

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

### Правила фильтра доменов

- Максимум 20 доменов на фильтр
- Нельзя смешивать список разрешенных и список запрещенных доменов в одном запросе
- Используйте префикс `-` для записей списка запрещенных доменов (например, `["-reddit.com"]`)

## Примечания

- Perplexity Search API возвращает структурированные результаты веб-поиска (`title`, `url`, `snippet`)
- OpenRouter или явные `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` переключают Perplexity обратно на chat completions Sonar для совместимости
- Совместимость Sonar/OpenRouter возвращает один синтезированный ответ с цитированием, а не строки структурированных результатов
- Результаты по умолчанию кэшируются на 15 минут (настраивается через `cacheTtlMinutes`)

## См. также

<CardGroup cols={2}>
  <Card title="Web search overview" href="/ru/tools/web" icon="globe">
    Все провайдеры и правила автоопределения.
  </Card>
  <Card title="Brave search" href="/ru/tools/brave-search" icon="shield">
    Структурированные результаты с фильтрами по стране и языку.
  </Card>
  <Card title="Exa search" href="/ru/tools/exa-search" icon="magnifying-glass">
    Нейронный поиск с извлечением содержимого.
  </Card>
  <Card title="Perplexity Search API docs" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Официальное краткое руководство и справочник Perplexity Search API.
  </Card>
</CardGroup>
