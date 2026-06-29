---
read_when:
    - Вам нужен веб-поиск на базе Tavily
    - Вам нужен ключ API Tavily
    - Вам нужен Tavily как поставщик web_search
    - Вам нужно извлечение содержимого из URL-адресов
summary: Инструменты поиска и извлечения Tavily
title: Tavily
x-i18n:
    generated_at: "2026-06-28T23:55:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) — это поисковый API, созданный для AI-приложений. OpenClaw предоставляет его двумя способами:

- как provider `web_search` для общего инструмента поиска
- как явные инструменты Plugin: `tavily_search` и `tavily_extract`

Tavily возвращает структурированные результаты, оптимизированные для потребления LLM, с настраиваемой глубиной поиска, фильтрацией по темам, фильтрами доменов, AI-сгенерированными сводками ответов и извлечением контента из URL-адресов (включая страницы, отрисованные JavaScript).

| Свойство  | Значение                            |
| --------- | ----------------------------------- |
| ID Plugin | `tavily`                            |
| Пакет     | `@openclaw/tavily-plugin`           |
| Auth      | `TAVILY_API_KEY` или config `apiKey` |
| Базовый URL | `https://api.tavily.com` (по умолчанию) |
| Инструменты | `tavily_search`, `tavily_extract`   |

## Начало работы

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Get an API key">
    Создайте учетную запись Tavily на [tavily.com](https://tavily.com), затем сгенерируйте API-ключ на панели управления.
  </Step>
  <Step title="Configure the plugin and provider">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify search runs">
    Запустите `web_search` из любого агента или вызовите `tavily_search` напрямую.
  </Step>
</Steps>

<Tip>
Выбор Tavily при первичной настройке или через `openclaw configure --section web` устанавливает и включает официальный Tavily Plugin при необходимости.
</Tip>

## Справочник инструментов

### `tavily_search`

Используйте это, когда нужны специфичные для Tavily элементы управления поиском вместо общего `web_search`.

| Параметр          | Тип          | Ограничения / значение по умолчанию     | Описание                                      |
| ----------------- | ------------ | --------------------------------------- | --------------------------------------------- |
| `query`           | string       | обязательно                             | Строка поискового запроса. Не более 400 символов. |
| `search_depth`    | enum         | `basic` (по умолчанию), `advanced`      | `advanced` медленнее, но дает более высокую релевантность. |
| `topic`           | enum         | `general` (по умолчанию), `news`, `finance` | Фильтрация по семейству тем.                  |
| `max_results`     | integer      | 1-20                                    | Количество результатов.                       |
| `include_answer`  | boolean      | по умолчанию `false`                    | Включить AI-сгенерированную сводку ответа Tavily. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`          | Фильтровать результаты по давности.           |
| `include_domains` | string array | (нет)                                   | Включать результаты только с этих доменов.    |
| `exclude_domains` | string array | (нет)                                   | Исключать результаты с этих доменов.          |

Компромисс глубины поиска:

| Глубина    | Скорость | Релевантность | Лучше всего для                       |
| ---------- | -------- | ------------- | ------------------------------------- |
| `basic`    | Быстрее  | Высокая       | Запросы общего назначения (по умолчанию). |
| `advanced` | Медленнее | Самая высокая | Точные исследования и поиск фактов.   |

### `tavily_extract`

Используйте это для извлечения чистого контента из одного или нескольких URL-адресов. Обрабатывает страницы, отрисованные JavaScript, и поддерживает разбиение на фрагменты с учетом запроса для целевого извлечения.

| Параметр           | Тип          | Ограничения / значение по умолчанию | Описание                                                |
| ------------------- | ------------ | ----------------------------------- | ------------------------------------------------------- |
| `urls`              | string array | обязательно, 1-20                   | URL-адреса, из которых нужно извлечь контент.           |
| `query`             | string       | (необязательно)                     | Повторно ранжировать извлеченные фрагменты по релевантности этому запросу. |
| `extract_depth`     | enum         | `basic` (по умолчанию), `advanced`  | Используйте `advanced` для страниц с большим объемом JS, SPA или динамических таблиц. |
| `chunks_per_source` | integer      | 1-5; **требует `query`**            | Фрагменты, возвращаемые для каждого URL. Выдает ошибку, если задано без `query`. |
| `include_images`    | boolean      | по умолчанию `false`                | Включить URL-адреса изображений в результаты.           |

Компромисс глубины извлечения:

| Глубина    | Когда использовать                         |
| ---------- | ------------------------------------------ |
| `basic`    | Простые страницы. Попробуйте сначала это.  |
| `advanced` | SPA, отрисованные JS, динамический контент, таблицы. |

<Tip>
Разбивайте большие списки URL на несколько вызовов `tavily_extract` (максимум 20 за запрос). Используйте `query` вместе с `chunks_per_source`, чтобы получать только релевантный контент вместо полных страниц.
</Tip>

## Выбор подходящего инструмента

| Потребность                         | Инструмент       |
| ----------------------------------- | ---------------- |
| Быстрый веб-поиск без специальных параметров | `web_search`     |
| Поиск с глубиной, темой и AI-ответами | `tavily_search`  |
| Извлечение контента из конкретных URL | `tavily_extract` |

<Note>
Общий инструмент `web_search` с Tavily в качестве provider поддерживает `query` и `count` (до 20 результатов). Для специфичных для Tavily элементов управления (`search_depth`, `topic`, `include_answer`, фильтры доменов, диапазон времени) используйте вместо него `tavily_search`.
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="API key resolution order">
    Клиент Tavily ищет свой API-ключ в таком порядке:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (разрешается через SecretRefs).
    2. `TAVILY_API_KEY` из окружения Gateway.

    `tavily_extract` выдает ошибку настройки, если отсутствуют оба значения.

  </Accordion>

  <Accordion title="Custom base URL">
    Переопределите `plugins.entries.tavily.config.webSearch.baseUrl`, если вы проксируете Tavily. Значение по умолчанию — `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requires `query`">
    `tavily_extract` отклоняет вызовы, которые передают `chunks_per_source` без `query`. Tavily ранжирует фрагменты по релевантности запросу, поэтому без него параметр не имеет смысла.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Web Search overview" href="/ru/tools/web" icon="magnifying-glass">
    Все providers и правила автообнаружения.
  </Card>
  <Card title="Firecrawl" href="/ru/tools/firecrawl" icon="fire">
    Поиск плюс scraping с извлечением контента.
  </Card>
  <Card title="Exa Search" href="/ru/tools/exa-search" icon="binoculars">
    Нейронный поиск с извлечением контента.
  </Card>
  <Card title="Configuration" href="/ru/gateway/configuration" icon="gear">
    Полная схема config для записей Plugin и маршрутизации инструментов.
  </Card>
</CardGroup>
