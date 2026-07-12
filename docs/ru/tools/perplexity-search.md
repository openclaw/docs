---
read_when:
    - Вы хотите использовать Perplexity Search для поиска в интернете
    - Необходимо настроить PERPLEXITY_API_KEY или OPENROUTER_API_KEY
summary: Совместимость Perplexity Search API и Sonar/OpenRouter с web_search
title: Поиск Perplexity
x-i18n:
    generated_at: "2026-07-12T11:57:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw поддерживает Perplexity Search API как провайдер `web_search`. Он возвращает структурированные результаты с полями `title`, `url` и `snippet`.

Для совместимости OpenClaw также поддерживает устаревшие конфигурации Perplexity Sonar/OpenRouter. Если вы используете `OPENROUTER_API_KEY`, ключ `sk-or-...` в `plugins.entries.perplexity.config.webSearch.apiKey` или задаёте `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, провайдер переключается на API завершений чата и вместо структурированных результатов Search API возвращает синтезированные ИИ ответы со ссылками на источники.

## Установка Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Получение ключа API Perplexity

1. Создайте учётную запись Perplexity на странице [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Создайте ключ API в панели управления.
3. Сохраните ключ в конфигурации или задайте `PERPLEXITY_API_KEY` в окружении Gateway.

## Совместимость с OpenRouter

Если вы уже использовали OpenRouter для Perplexity Sonar, сохраните `provider: "perplexity"` и задайте `OPENROUTER_API_KEY` в окружении Gateway либо сохраните ключ `sk-or-...` в `plugins.entries.perplexity.config.webSearch.apiKey`.

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

**Через конфигурацию:** выполните `openclaw configure --section web`. Команда сохраняет ключ в `~/.openclaw/openclaw.json` в поле `plugins.entries.perplexity.config.webSearch.apiKey`. Это поле также принимает объекты SecretRef.

**Через окружение:** задайте `PERPLEXITY_API_KEY` или `OPENROUTER_API_KEY` в окружении процесса Gateway. При установке Gateway поместите переменную в `~/.openclaw/.env` (или в окружение вашей службы). См. раздел [Переменные окружения](/ru/help/faq#env-vars-and-env-loading).

Если настроен `provider: "perplexity"`, но SecretRef ключа Perplexity не разрешается и резервная переменная окружения отсутствует, запуск или перезагрузка немедленно завершается ошибкой.

## Параметры инструмента

Эти параметры применяются к нативному Perplexity Search API.

<ParamField path="query" type="string" required>
Поисковый запрос.
</ParamField>

<ParamField path="count" type="number" default="5">
Количество возвращаемых результатов (1–10).
</ParamField>

<ParamField path="country" type="string">
Двухбуквенный код страны ISO (например, `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Код языка ISO 639-1 (например, `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Временной фильтр: `day` означает 24 часа.
</ParamField>

<ParamField path="date_after" type="string">
Только результаты, опубликованные после указанной даты (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Только результаты, опубликованные до указанной даты (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Массив разрешённых или запрещённых доменов (не более 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Общий лимит содержимого (не более 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Лимит токенов на страницу.
</ParamField>

Для устаревшего режима совместимости с Sonar/OpenRouter:

- Принимаются `query`, `count` и `freshness`.
- В этом режиме `count` используется только для совместимости; ответ по-прежнему представляет собой один синтезированный ответ со ссылками на источники, а не список из N результатов.
- Фильтры, доступные только в Search API (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`), приводят к явным ошибкам.

**Примеры:**

```javascript
// Поиск с указанием страны и языка
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Недавние результаты (за последнюю неделю)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Поиск по диапазону дат
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Фильтрация доменов (список разрешённых)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Фильтрация доменов (список запрещённых — с префиксом -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Извлечение большего объёма содержимого
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Правила фильтрации доменов

- Не более 20 доменов в одном фильтре.
- В одном запросе нельзя одновременно использовать записи из списков разрешённых и запрещённых доменов.
- Для записей списка запрещённых доменов используйте префикс `-` (например, `["-reddit.com"]`).

## Примечания

- Perplexity Search API возвращает структурированные результаты веб-поиска (`title`, `url`, `snippet`).
- OpenRouter или явно заданные `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` переключают Perplexity обратно на завершения чата Sonar для обеспечения совместимости.
- В режиме совместимости с Sonar/OpenRouter возвращается один синтезированный ответ со ссылками на источники, а не строки структурированных результатов.
- По умолчанию результаты кэшируются на 15 минут (настраивается с помощью `cacheTtlMinutes`).

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Обзор веб-поиска" href="/ru/tools/web" icon="globe">
    Все провайдеры и правила автоматического обнаружения.
  </Card>
  <Card title="Поиск Brave" href="/ru/tools/brave-search" icon="shield">
    Структурированные результаты с фильтрами по стране и языку.
  </Card>
  <Card title="Поиск Exa" href="/ru/tools/exa-search" icon="magnifying-glass">
    Нейронный поиск с извлечением содержимого.
  </Card>
  <Card title="Документация Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Официальное краткое руководство и справочник по Perplexity Search API.
  </Card>
</CardGroup>
