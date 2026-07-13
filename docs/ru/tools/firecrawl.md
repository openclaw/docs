---
read_when:
    - Вам нужно извлечение данных из веб-страниц с помощью Firecrawl
    - Вам нужен Firecrawl Search без ключа (бесплатно) или `web_fetch` без ключа
    - Для поиска или более высоких лимитов необходим ключ API Firecrawl
    - Вы хотите использовать Firecrawl как провайдер web_search
    - Вам нужно извлечение данных с обходом антибот-защиты для `web_fetch`
summary: Поиск и извлечение данных с помощью Firecrawl, а также резервный вариант для web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-13T18:42:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw может использовать **Firecrawl** тремя способами:

- как провайдер `web_search`
- как явные инструменты плагина: `firecrawl_search` и `firecrawl_scrape`
- как резервный экстрактор для `web_fetch`

Это размещённый сервис извлечения данных и поиска с поддержкой обхода защиты от ботов и кеширования, что полезно для сайтов с интенсивным использованием JS и страниц, блокирующих обычные HTTP-запросы.

## Установка плагина

Установите официальный плагин, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Доступ без ключа и ключи API

Firecrawl регистрирует два провайдера `web_search`:

- **Firecrawl Search** (`firecrawl`) — использует размещённый API `/v2/search` с вашим
  ключом; автоматически обнаруживается при наличии ключа.
- **Firecrawl Search (Free)** (`firecrawl-free`) — использует размещённый начальный
  тариф без ключа; ключ API не требуется. Он доступен **только при явном выборе** и никогда не выбирается автоматически, поскольку
  при его выборе ваши поисковые запросы отправляются на бесплатный тариф Firecrawl.

Явно выбранный резервный механизм Firecrawl `web_fetch` также работает без ключа. Для
явных инструментов `firecrawl_search` и `firecrawl_scrape` требуется ключ API. Добавьте
`FIRECRAWL_API_KEY` в окружение Gateway или настройте его для получения более высоких лимитов.

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

- Выбор Firecrawl при первоначальной настройке или в `openclaw configure --section web` автоматически включает установленный плагин Firecrawl.
- Выберите **Firecrawl Search (Free)** при первоначальной настройке (или задайте `provider: "firecrawl-free"`), чтобы работать без ключа API. Провайдер **Firecrawl Search** с ключом передаёт `plugins.entries.firecrawl.config.webSearch.apiKey` или `FIRECRAWL_API_KEY`.
- `web_search` с Firecrawl поддерживает `query` и `count`.
- Для специфичных для Firecrawl настроек, таких как `sources`, `categories` или извлечение данных из результатов, используйте `firecrawl_search`.
- `baseUrl` по умолчанию использует размещённый Firecrawl по адресу `https://api.firecrawl.dev`. Переопределения для самостоятельно размещённых экземпляров разрешены только для частных или внутренних конечных точек; HTTP допускается только для таких частных целей.
- `FIRECRAWL_BASE_URL` — общая резервная переменная окружения для базовых URL поиска и извлечения данных Firecrawl.
- Для поисковых запросов Firecrawl по умолчанию установлен тайм-аут 30 секунд; параметр `timeoutSeconds` инструмента `firecrawl_search` переопределяет его для отдельного вызова.

## Настройка резервного механизма Firecrawl для web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // явный выбор включает резервный механизм без ключа
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

- Явно выбранный резервный механизм Firecrawl `web_fetch` работает без ключа API. Если ключ настроен, OpenClaw передаёт `plugins.entries.firecrawl.config.webFetch.apiKey` или `FIRECRAWL_API_KEY` для получения более высоких лимитов.
- Выбор Firecrawl во время первоначальной настройки или в `openclaw configure --section web` включает плагин и выбирает Firecrawl для `web_fetch`, если другой провайдер получения данных ещё не настроен.
- Для `firecrawl_scrape` требуется ключ API.
- `maxAgeMs` задаёт допустимый возраст кешированных результатов (мс). Значение по умолчанию — 172,800,000 мс (2 дня).
- Значение `onlyMainContent` по умолчанию — `true`; значение `timeoutSeconds` по умолчанию — 60.
- Устаревшая конфигурация `tools.web.fetch.firecrawl.*` и `tools.web.search.firecrawl.*` автоматически переносится с помощью `openclaw doctor --fix`.
- Переопределения базового URL и URL извлечения данных Firecrawl подчиняются тому же правилу для размещённых и частных ресурсов, что и поиск: публичный размещённый трафик использует `https://api.firecrawl.dev`; переопределения для самостоятельно размещённых экземпляров должны разрешаться в частные или внутренние конечные точки.
- `firecrawl_scrape` отклоняет очевидные частные адреса, адреса обратной петли, адреса служб метаданных и целевые URL с протоколами, отличными от HTTP(S), прежде чем передавать их Firecrawl, в соответствии с контрактом безопасности целей `web_fetch` для явных вызовов извлечения данных Firecrawl.

`firecrawl_scrape` повторно использует те же настройки `plugins.entries.firecrawl.config.webFetch.*` и переменные окружения, включая обязательный ключ API.

### Самостоятельно размещённый Firecrawl

Задайте `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` или `FIRECRAWL_BASE_URL`, если вы запускаете Firecrawl самостоятельно. OpenClaw принимает `http://` только для целей в обратной петле, частной сети, `.local`, `.internal` или `.localhost`. Пользовательские публичные хосты отклоняются, чтобы ключи API Firecrawl случайно не отправлялись произвольным конечным точкам.

## Инструменты плагина Firecrawl

### `firecrawl_search`

Используйте этот инструмент, если вместо универсального `web_search` вам нужны специфичные для Firecrawl параметры поиска. Требуется ключ API.

Параметры:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (только имена хостов; взаимоисключающие)
- `tbs` (фильтр времени, например `qdr:d`, `qdr:w`, `sbd:1`)
- `location` и `country` (географическое таргетирование)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Используйте этот инструмент для страниц с интенсивным использованием JS или защитой от ботов, с которыми обычный `web_fetch` справляется плохо.

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

`firecrawl_scrape` и резервный механизм Firecrawl для `web_fetch` по умолчанию используют `proxy: "auto"` вместе с `storeInCache: true`, если вызывающая сторона не переопределит эти параметры. У `firecrawl_search` и провайдера Firecrawl для `web_search` нет настроек `proxy`/`storeInCache`; режим скрытного прокси применяется только к запросам извлечения и получения данных.

Режим `proxy` Firecrawl управляет обходом защиты от ботов (`basic`, `stealth` или `auto`). `auto` повторяет попытку со скрытными прокси, если базовая попытка завершилась неудачей, что может потребовать больше кредитов, чем извлечение данных только в базовом режиме.

## Как `web_fetch` использует Firecrawl

Порядок извлечения в `web_fetch`:

1. Readability (локально)
2. Настроенный провайдер получения данных, например Firecrawl (если он выбран или автоматически обнаружен по настроенным учётным данным)
3. Базовая очистка HTML (последний резервный вариант)

Параметр выбора — `tools.web.fetch.provider`. Если его не указать, OpenClaw автоматически обнаруживает первый готовый провайдер получения веб-данных по доступным учётным данным. Официальный плагин Firecrawl предоставляет этот резервный механизм.

## Связанные материалы

- [Обзор веб-поиска](/ru/tools/web) -- все провайдеры и автоматическое обнаружение
- [Получение веб-данных](/ru/tools/web-fetch) -- инструмент web_fetch с резервным механизмом Firecrawl
- [Tavily](/ru/tools/tavily) -- инструменты поиска и извлечения
