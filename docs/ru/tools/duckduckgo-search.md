---
read_when:
    - Вам нужен провайдер веб-поиска, для которого не требуется API-ключ
    - Вы хотите использовать DuckDuckGo для web_search
    - Вам нужен явно выбранный поставщик поиска, не требующий ключа
summary: Веб-поиск DuckDuckGo -- провайдер без ключа (экспериментальный, на основе HTML)
title: Поиск DuckDuckGo
x-i18n:
    generated_at: "2026-06-28T23:51:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw поддерживает DuckDuckGo как провайдер `web_search` **без ключа**. API-ключ
или учетная запись не требуются.

<Warning>
  DuckDuckGo - **экспериментальная, неофициальная** интеграция, которая получает результаты
  со страниц поиска DuckDuckGo без JavaScript, а не из официального API. Возможны
  периодические сбои из-за страниц с бот-проверками или изменений HTML.
</Warning>

## Настройка

API-ключ не нужен - просто укажите DuckDuckGo как провайдера:

<Steps>
  <Step title="Настройка">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Конфигурация

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Необязательные настройки уровня Plugin для региона и SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Параметры инструмента

<ParamField path="query" type="string" required>
Поисковый запрос.
</ParamField>

<ParamField path="count" type="number" default="5">
Количество результатов для возврата (1-10).
</ParamField>

<ParamField path="region" type="string">
Код региона DuckDuckGo (например, `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Уровень SafeSearch.
</ParamField>

Регион и SafeSearch также можно задать в конфигурации Plugin (см. выше) - параметры
инструмента переопределяют значения конфигурации для каждого запроса.

## Примечания

- **Без API-ключа** - работает после выбора DuckDuckGo в качестве провайдера
  `web_search`
- **Экспериментально** - собирает результаты с HTML-страниц поиска DuckDuckGo
  без JavaScript, а не из официального API или SDK
- **Риск бот-проверок** - DuckDuckGo может показывать CAPTCHA или блокировать запросы
  при интенсивном или автоматизированном использовании
- **Разбор HTML** - результаты зависят от структуры страницы, которая может измениться
  без уведомления
- **Явный выбор** - OpenClaw не выбирает DuckDuckGo автоматически,
  если не настроен провайдер на основе API
- **SafeSearch по умолчанию имеет значение moderate**, если не настроен

<Tip>
  Для производственного использования рассмотрите [Brave Search](/ru/tools/brave-search) (доступен бесплатный тариф)
  или другого провайдера на основе API.
</Tip>

## См. также

- [Обзор Web Search](/ru/tools/web) -- все провайдеры и автообнаружение
- [Brave Search](/ru/tools/brave-search) -- структурированные результаты с бесплатным тарифом
- [Exa Search](/ru/tools/exa-search) -- нейронный поиск с извлечением содержимого
