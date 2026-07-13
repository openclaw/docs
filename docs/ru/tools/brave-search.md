---
read_when:
    - Вы хотите использовать Brave Search для web_search
    - Вам нужен BRAVE_API_KEY или сведения о тарифном плане
summary: Настройка Brave Search API для web_search
title: Поиск Brave
x-i18n:
    generated_at: "2026-07-13T20:19:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw поддерживает Brave Search API как провайдера `web_search`.

## Получение ключа API

1. Создайте учётную запись Brave Search API на странице [https://brave.com/search/api/](https://brave.com/search/api/)
2. На панели управления выберите план **Search** и создайте ключ API.
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
            mode: "web", // или "llm-context"
            baseUrl: "https://api.search.brave.com", // необязательное переопределение прокси/базового URL
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

Настройки поиска Brave, относящиеся к этому провайдеру, находятся в `plugins.entries.brave.config.webSearch.*`; это канонический путь конфигурации. Общий параметр верхнего уровня `tools.web.search.apiKey` и параметр с ограниченной областью действия `tools.web.search.brave.*` по-прежнему загружаются посредством объединения для совместимости, но в новой конфигурации следует использовать указанный выше путь в области плагина.

`webSearch.mode` управляет транспортом Brave:

- `web` (по умолчанию): обычный веб-поиск Brave с заголовками, URL-адресами и фрагментами
- `llm-context`: Brave LLM Context API с предварительно извлечёнными фрагментами текста и источниками для привязки ответа к фактам

`webSearch.baseUrl` позволяет направлять запросы Brave через доверенный совместимый с Brave прокси-сервер
или шлюз. OpenClaw добавляет `/res/v1/web/search` или `/res/v1/llm/context` к
настроенному базовому URL и включает базовый URL в ключ кэша. Для общедоступных
конечных точек необходимо использовать `https://`; `http://` допускается только для доверенных прокси-серверов
на интерфейсе обратной петли или в частной сети.

## Параметры инструмента

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
Код языка ISO 639-1 для результатов поиска (например, `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Код языка поиска Brave (например, `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Код языка ISO для элементов интерфейса.
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
// Поиск с учётом страны и языка
await web_search({
  query: "возобновляемая энергия",
  country: "DE",
  language: "de",
});

// Недавние результаты (за последнюю неделю)
await web_search({
  query: "новости ИИ",
  freshness: "week",
});

// Поиск по диапазону дат
await web_search({
  query: "развитие ИИ",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Примечания

- OpenClaw использует план Brave **Search**. Если у вас есть устаревшая подписка (например, первоначальный бесплатный план с 2 000 запросов в месяц), она остаётся действительной, но не включает новые возможности, такие как LLM Context или более высокие ограничения частоты запросов.
- Каждый план Brave включает **бесплатный возобновляемый кредит в размере \$5 в месяц**. План Search стоит \$5 за 1 000 запросов, поэтому кредит покрывает 1 000 запросов в месяц. Установите ограничение использования на панели управления Brave, чтобы избежать непредвиденных расходов. Актуальные планы см. на [портале Brave API](https://brave.com/search/api/).
- План Search включает конечную точку LLM Context и права на выполнение ИИ-инференса. Для хранения результатов с целью обучения или настройки моделей требуется план, явно предоставляющий права на хранение. См. [Условия предоставления услуг](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Режим `llm-context` возвращает записи с подтверждающими источниками вместо обычной структуры фрагментов веб-поиска.
- Режим `llm-context` поддерживает `freshness` и ограниченные диапазоны `date_after` + `date_before`. Он не поддерживает `ui_lang`; значение `date_before` без `date_after` отклоняется, поскольку Brave требует, чтобы пользовательские диапазоны актуальности включали начальную и конечную даты.
- `ui_lang` должен включать подтег региона, например `en-US`.
- По умолчанию результаты кэшируются на 15 минут (настраивается с помощью `cacheTtlMinutes`).
- Пользовательские значения `webSearch.baseUrl` включаются в идентификатор кэша Brave, поэтому
  ответы разных прокси-серверов не конфликтуют.
- Включите диагностический флаг `brave.http`, чтобы при устранении неполадок журналировать URL-адреса и параметры запросов Brave, состояние и длительность ответов, а также события попадания, промаха и записи кэша поиска. Флаг никогда не журналирует ключ API или тела ответов, однако поисковые запросы могут содержать конфиденциальные данные.

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) -- все провайдеры и автоматическое обнаружение
- [Поиск Perplexity](/ru/tools/perplexity-search) -- структурированные результаты с фильтрацией по доменам
- [Поиск Exa](/ru/tools/exa-search) -- нейронный поиск с извлечением содержимого
