---
read_when:
    - Вам нужно извлечение веб-данных с помощью Firecrawl
    - Вам нужен Firecrawl `web_fetch` без ключа
    - Для поиска или увеличения лимитов требуется ключ API Firecrawl
    - Вы хотите использовать Firecrawl в качестве провайдера web_search
    - Вам нужно извлечение данных с обходом защиты от ботов для web_fetch
summary: Поиск и сбор данных через Firecrawl, а также резервный вариант с `web_fetch`
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T11:56:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw может использовать **Firecrawl** тремя способами:

- как провайдер `web_search`
- как явные инструменты плагина: `firecrawl_search` и `firecrawl_scrape`
- как резервный экстрактор для `web_fetch`

Это размещённый в облаке сервис извлечения данных и поиска, который поддерживает обход защиты от ботов и кэширование, что помогает при работе с сайтами, активно использующими JavaScript, и страницами, блокирующими обычные HTTP-запросы.

## Установка плагина

Установите официальный плагин, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## `web_fetch` без ключа и ключи API

Явно выбранный резервный облачный провайдер Firecrawl для `web_fetch` предоставляет начальный доступ без ключа API. Добавьте `FIRECRAWL_API_KEY` в окружение Gateway или настройте его, когда потребуются более высокие лимиты. Для Firecrawl `web_search` и `firecrawl_scrape` требуется ключ API.

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
- Для специфичных элементов управления Firecrawl, таких как `sources`, `categories` или извлечение данных из результатов, используйте `firecrawl_search`.
- По умолчанию `baseUrl` указывает на облачный Firecrawl по адресу `https://api.firecrawl.dev`. Переопределения для самостоятельно размещённых экземпляров разрешены только для частных или внутренних конечных точек; HTTP допускается только для таких частных целей.
- `FIRECRAWL_BASE_URL` — общая резервная переменная окружения для базовых URL поиска и извлечения данных Firecrawl.
- Для поисковых запросов Firecrawl по умолчанию установлен тайм-аут 30 секунд; параметр `timeoutSeconds` инструмента `firecrawl_search` переопределяет его для отдельного вызова.

## Настройка резервного провайдера Firecrawl для `web_fetch`

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // явный выбор включает резервный режим без ключа
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

- Явно выбранный резервный провайдер Firecrawl для `web_fetch` работает без ключа API. Если ключ настроен, OpenClaw отправляет `plugins.entries.firecrawl.config.webFetch.apiKey` или `FIRECRAWL_API_KEY` для получения более высоких лимитов.
- Выбор Firecrawl при первоначальной настройке или через `openclaw configure --section web` включает плагин и выбирает Firecrawl для `web_fetch`, если другой провайдер получения данных ещё не настроен.
- Для `firecrawl_scrape` требуется ключ API.
- `maxAgeMs` определяет допустимый возраст кэшированных результатов в миллисекундах. Значение по умолчанию — 172 800 000 мс (2 дня).
- По умолчанию `onlyMainContent` имеет значение `true`, а `timeoutSeconds` — 60.
- Устаревшая конфигурация `tools.web.fetch.firecrawl.*` и `tools.web.search.firecrawl.*` автоматически переносится командой `openclaw doctor --fix`.
- Переопределения URL извлечения данных и базового URL Firecrawl подчиняются тому же правилу для облачных и частных адресов, что и поиск: публичный облачный трафик использует `https://api.firecrawl.dev`, а переопределения для самостоятельно размещённых экземпляров должны разрешаться в частные или внутренние конечные точки.
- Перед передачей URL в Firecrawl инструмент `firecrawl_scrape` отклоняет очевидные частные адреса, local loopback, адреса метаданных и адреса с протоколами, отличными от HTTP(S), соблюдая контракт безопасности целевых адресов `web_fetch` для явных вызовов извлечения данных через Firecrawl.

`firecrawl_scrape` повторно использует те же настройки и переменные окружения `plugins.entries.firecrawl.config.webFetch.*`, включая обязательный ключ API.

### Самостоятельно размещённый Firecrawl

Если вы размещаете Firecrawl самостоятельно, задайте `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` или `FIRECRAWL_BASE_URL`. OpenClaw принимает `http://` только для адресов local loopback, частной сети, `.local`, `.internal` или `.localhost`. Пользовательские публичные хосты отклоняются, чтобы ключи API Firecrawl случайно не отправлялись на произвольные конечные точки.

## Инструменты плагина Firecrawl

### `firecrawl_search`

Используйте этот инструмент, когда вместо универсального `web_search` нужны специфичные элементы управления поиском Firecrawl.

Параметры:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Используйте этот инструмент для страниц, активно использующих JavaScript или защищённых от ботов, с которыми обычный `web_fetch` справляется недостаточно хорошо.

Параметры:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Скрытный режим и обход защиты от ботов

Если вызывающая сторона не переопределяет эти параметры, `firecrawl_scrape` и резервный провайдер Firecrawl для `web_fetch` по умолчанию используют `proxy: "auto"` вместе с `storeInCache: true`. У `firecrawl_search` и провайдера Firecrawl для `web_search` нет элементов управления `proxy`/`storeInCache`; режим скрытного прокси применяется только к запросам извлечения данных и получения страниц.

Режим `proxy` в Firecrawl управляет обходом защиты от ботов (`basic`, `stealth` или `auto`). В режиме `auto` при неудаче обычной попытки запрос повторяется через скрытные прокси, что может расходовать больше кредитов, чем извлечение данных только в режиме `basic`.

## Как `web_fetch` использует Firecrawl

Порядок извлечения данных в `web_fetch`:

1. Readability (локально)
2. Настроенный провайдер получения данных, например Firecrawl (если он выбран или автоматически обнаружен по настроенным учётным данным)
3. Базовая очистка HTML (последний резервный вариант)

Выбор задаётся параметром `tools.web.fetch.provider`. Если его не указать, OpenClaw автоматически определяет первый готовый провайдер получения веб-данных по доступным учётным данным. Официальный плагин Firecrawl предоставляет этот резервный вариант.

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) — все провайдеры и автоматическое обнаружение
- [Получение веб-страниц](/ru/tools/web-fetch) — инструмент `web_fetch` с резервным провайдером Firecrawl
- [Tavily](/ru/tools/tavily) — инструменты поиска и извлечения данных
