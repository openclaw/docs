---
read_when:
    - Вам нужно веб-извлечение на базе Firecrawl
    - Вам нужен Firecrawl web_fetch без ключа
    - Вам нужен API-ключ Firecrawl для поиска или более высоких лимитов
    - Вам нужен Firecrawl как провайдер web_search
    - Вам нужно извлечение с защитой от ботов для web_fetch
summary: Поиск и скрейпинг через Firecrawl, а также резервный вариант web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-06-28T23:52:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw может использовать **Firecrawl** тремя способами:

- как провайдера `web_search`
- как явные инструменты плагина: `firecrawl_search` и `firecrawl_scrape`
- как резервный экстрактор для `web_fetch`

Это размещенный сервис извлечения/поиска, который поддерживает обход ограничений для ботов и кэширование,
что помогает с сайтами, активно использующими JS, или страницами, которые блокируют обычные HTTP-запросы.

## Установка плагина

Установите официальный плагин, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch без ключа и ключи API

Явно выбранный размещенный резервный вариант Firecrawl для `web_fetch` поддерживает стартовый
доступ без ключа API. Добавьте `FIRECRAWL_API_KEY` в окружение Gateway
или настройте его, когда нужны более высокие лимиты. Firecrawl `web_search` и
`firecrawl_scrape` требуют ключ API.

## Настройка поиска Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Примечания:

- Выбор Firecrawl при первоначальной настройке или через `openclaw configure --section web` автоматически включает установленный плагин Firecrawl.
- `web_search` с Firecrawl поддерживает `query` и `count`.
- Для специфичных элементов управления Firecrawl, таких как `sources`, `categories` или извлечение результатов, используйте `firecrawl_search`.
- `baseUrl` по умолчанию указывает на размещенный Firecrawl по адресу `https://api.firecrawl.dev`. Переопределения для самостоятельного размещения разрешены только для приватных/внутренних конечных точек; HTTP принимается только для таких приватных целей.
- `FIRECRAWL_BASE_URL` — общий резервный env для базовых URL поиска и извлечения Firecrawl.

## Настройка резервного варианта Firecrawl для web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Примечания:

- Явно выбранный резервный вариант Firecrawl для `web_fetch` работает без ключа API. При настройке OpenClaw отправляет `plugins.entries.firecrawl.config.webFetch.apiKey` или `FIRECRAWL_API_KEY` для более высоких лимитов.
- Выбор Firecrawl во время первоначальной настройки или через `openclaw configure --section web` включает плагин и выбирает Firecrawl для `web_fetch`, если другой провайдер извлечения еще не настроен.
- `firecrawl_scrape` требует ключ API.
- `maxAgeMs` управляет тем, насколько старыми могут быть кэшированные результаты (мс). Значение по умолчанию — 2 дня.
- Устаревшая конфигурация `tools.web.fetch.firecrawl.*` автоматически мигрируется командой `openclaw doctor --fix`.
- Переопределения URL для извлечения/базы Firecrawl следуют тому же правилу размещенного/приватного режима, что и поиск: публичный размещенный трафик использует `https://api.firecrawl.dev`; переопределения для самостоятельного размещения должны разрешаться в приватные/внутренние конечные точки.
- `firecrawl_scrape` отклоняет очевидно приватные, loopback, metadata и не-HTTP(S) целевые URL перед пересылкой их в Firecrawl, соответствуя контракту безопасности целей `web_fetch` для явных вызовов извлечения Firecrawl.

`firecrawl_scrape` повторно использует те же настройки `plugins.entries.firecrawl.config.webFetch.*` и env-переменные, включая обязательный ключ API.

### Самостоятельно размещенный Firecrawl

Задайте `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` или `FIRECRAWL_BASE_URL`,
когда запускаете Firecrawl самостоятельно. OpenClaw принимает `http://` только для целей loopback,
частной сети, `.local`, `.internal` или `.localhost`. Публичные пользовательские
хосты отклоняются, чтобы ключи API Firecrawl случайно не отправлялись на произвольные конечные точки.

## Инструменты Plugin Firecrawl

### `firecrawl_search`

Используйте это, когда нужны специфичные для Firecrawl элементы управления поиском вместо универсального `web_search`.

Основные параметры:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Используйте это для страниц с активным JS или защитой от ботов, где обычный `web_fetch` слаб.

Основные параметры:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Скрытность / обход защиты от ботов

Firecrawl предоставляет параметр **режима прокси** для обхода защиты от ботов (`basic`, `stealth` или `auto`).
OpenClaw всегда использует `proxy: "auto"` плюс `storeInCache: true` для запросов Firecrawl.
Если прокси не указан, Firecrawl по умолчанию использует `auto`. `auto` повторяет попытку со скрытными прокси, если базовая попытка завершается неудачно, что может расходовать больше кредитов,
чем парсинг только в базовом режиме.

## Как `web_fetch` использует Firecrawl

Порядок извлечения `web_fetch`:

1. Readability (локально)
2. Firecrawl (когда выбран или автоматически определен по настроенным учетным данным)
3. Базовая очистка HTML (последний резервный вариант)

Переключатель выбора — `tools.web.fetch.provider`. Если его опустить, OpenClaw
автоматически определяет первого готового провайдера web-fetch по доступным учетным данным.
Официальный Plugin Firecrawl предоставляет этот резервный вариант.

## См. также

- [Обзор Web Search](/ru/tools/web) -- все провайдеры и автоопределение
- [Web Fetch](/ru/tools/web-fetch) -- инструмент web_fetch с резервным вариантом Firecrawl
- [Tavily](/ru/tools/tavily) -- инструменты поиска и извлечения
