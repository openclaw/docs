---
read_when:
    - Вы хотите использовать Brave Search для web_search
    - Вам нужен BRAVE_API_KEY или сведения о плане
summary: Настройка Brave Search API для web_search
title: Поиск Brave
x-i18n:
    generated_at: "2026-06-28T23:49:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2bff7589ddb54d002853898c6fc37e613fd32b0fa69cb0d712d5955973efb39
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw поддерживает Brave Search API как провайдер `web_search`.

## Получение ключа API

1. Создайте учетную запись Brave Search API на [https://brave.com/search/api/](https://brave.com/search/api/)
2. В панели управления выберите план **Search** и сгенерируйте ключ API.
3. Сохраните ключ в конфигурации или задайте `BRAVE_API_KEY` в окружении Gateway.

## Пример конфигурации

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

Настройки поиска Brave, специфичные для провайдера, теперь находятся в `plugins.entries.brave.config.webSearch.*`.
Устаревший `tools.web.search.apiKey` все еще загружается через прокладку совместимости, но больше не является каноническим путем конфигурации.

`webSearch.mode` управляет транспортом Brave:

- `web` (по умолчанию): обычный веб-поиск Brave с заголовками, URL и фрагментами
- `llm-context`: Brave LLM Context API с предварительно извлеченными текстовыми фрагментами и источниками для обоснования

`webSearch.baseUrl` может направлять запросы Brave на доверенный Brave-совместимый прокси
или шлюз. OpenClaw добавляет `/res/v1/web/search` или `/res/v1/llm/context` к
настроенному базовому URL и сохраняет базовый URL в ключе кэша. Публичные
эндпоинты должны использовать `https://`; `http://` принимается только для доверенного loopback
или прокси-хостов в частной сети.

## Параметры инструмента

<ParamField path="query" type="string" required>
Поисковый запрос.
</ParamField>

<ParamField path="count" type="number" default="5">
Количество результатов для возврата (1–10).
</ParamField>

<ParamField path="country" type="string">
Двухбуквенный код страны ISO (например, `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Код языка ISO 639-1 для результатов поиска (например, `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Код языка поиска Brave (например, `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Код языка ISO для элементов UI.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Фильтр по времени — `day` означает 24 часа.
</ParamField>

<ParamField path="date_after" type="string">
Только результаты, опубликованные после этой даты (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Только результаты, опубликованные до этой даты (`YYYY-MM-DD`).
</ParamField>

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
```

## Примечания

- OpenClaw использует план Brave **Search**. Если у вас есть устаревшая подписка (например, исходный бесплатный план с 2 000 запросов в месяц), она остается действительной, но не включает новые возможности вроде LLM Context или более высоких лимитов запросов.
- Каждый план Brave включает **\$5/месяц бесплатного кредита** (возобновляемого). План Search стоит \$5 за 1 000 запросов, поэтому кредит покрывает 1 000 запросов в месяц. Задайте лимит использования в панели управления Brave, чтобы избежать неожиданных списаний. Актуальные планы см. на [портале Brave API](https://brave.com/search/api/).
- План Search включает эндпоинт LLM Context и права на AI inference. Для сохранения результатов с целью обучения или настройки моделей требуется план с явными правами на хранение. См. [Условия обслуживания](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Режим `llm-context` возвращает записи источников с привязкой к основаниям вместо обычной формы фрагментов веб-поиска.
- Режим `llm-context` поддерживает `freshness` и ограниченные диапазоны `date_after` + `date_before`. Он не поддерживает `ui_lang`; `date_before` без `date_after` отклоняется, потому что Brave требует, чтобы пользовательские диапазоны свежести включали даты начала и окончания.
- `ui_lang` должен включать региональный подтаг, например `en-US`.
- Результаты по умолчанию кэшируются на 15 минут (настраивается через `cacheTtlMinutes`).
- Пользовательские значения `webSearch.baseUrl` включаются в идентификатор кэша Brave, поэтому
  ответы, специфичные для прокси, не конфликтуют.
- Включите диагностический флаг `brave.http`, чтобы при устранении неполадок логировать URL/параметры запросов Brave, статус/время ответа и события попаданий/промахов/записи в поисковый кэш. Флаг никогда не логирует ключ API или тела ответов, но поисковые запросы могут быть чувствительными.

## Связанные материалы

- [Обзор Web Search](/ru/tools/web) -- все провайдеры и автообнаружение
- [Perplexity Search](/ru/tools/perplexity-search) -- структурированные результаты с фильтрацией по доменам
- [Exa Search](/ru/tools/exa-search) -- нейронный поиск с извлечением контента
