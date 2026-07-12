---
read_when:
    - Вы хотите настроить Perplexity в качестве поставщика веб-поиска
    - Вам нужен API-ключ Perplexity или настроенный прокси OpenRouter
summary: Настройка провайдера веб-поиска Perplexity (ключ API, режимы поиска, фильтрация)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T11:48:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Плагин Perplexity регистрирует провайдера `web_search` с двумя транспортами:
нативным API поиска Perplexity (структурированные результаты с фильтрами) и
чат-комплишенами Perplexity Sonar напрямую или через OpenRouter
(синтезированные ИИ ответы с цитированием источников).

<Note>
На этой странице описана настройка **провайдера** Perplexity. О **инструменте** Perplexity (о том, как агент его использует) см. в разделе [Поиск Perplexity](/ru/tools/perplexity-search).
</Note>

| Свойство        | Значение                                                                      |
| --------------- | ----------------------------------------------------------------------------- |
| Тип             | Провайдер веб-поиска (не провайдер моделей)                                   |
| Аутентификация  | `PERPLEXITY_API_KEY` (нативный) или `OPENROUTER_API_KEY` (через OpenRouter)   |
| Путь настройки  | `plugins.entries.perplexity.config.webSearch.apiKey`                          |
| Переопределения | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`              |
| Получение ключа | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)          |

## Установка плагина

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Укажите ключ API">
    ```bash
    openclaw configure --section web
    ```

    Или укажите ключ напрямую:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Также можно экспортировать ключ как `PERPLEXITY_API_KEY` или
    `OPENROUTER_API_KEY` в окружении Gateway.

  </Step>
  <Step title="Начните поиск">
    `web_search` автоматически обнаруживает Perplexity, когда его ключ становится
    доступными учётными данными для поиска; дополнительная настройка не требуется.
    Чтобы явно закрепить провайдера:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## Режимы поиска

Плагин выбирает транспорт в следующем порядке:

1. Если задан `webSearch.baseUrl` или `webSearch.model`, запросы всегда направляются через чат-комплишены Sonar к этой конечной точке независимо от типа ключа.
2. В противном случае конечную точку определяет источник ключа: префикс настроенного ключа выбирает транспорт (настройка имеет приоритет над переменными окружения), а ключ из окружения напрямую использует соответствующую ему конечную точку.

| Префикс ключа | Транспорт                                                  | Возможности                                                    |
| ------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| `pplx-`       | Нативный API поиска Perplexity (`https://api.perplexity.ai`) | Структурированные результаты, фильтры по домену, языку и дате |
| `sk-or-`      | OpenRouter (`https://openrouter.ai/api/v1`), модель Sonar  | Синтезированные ИИ ответы с цитированием источников             |

Настроенный ключ с любым другим префиксом также использует нативный API поиска.
Для пути чат-комплишенов по умолчанию используется модель
`perplexity/sonar-pro`; переопределить её можно с помощью
`plugins.entries.perplexity.config.webSearch.model`.

## Фильтрация нативного API

| Фильтр                              | Описание                                                                  | Транспорт        |
| ----------------------------------- | ------------------------------------------------------------------------- | ---------------- |
| `count`                             | Количество результатов на один поиск, 1–10 (по умолчанию 5)               | Только нативный  |
| `freshness`                         | Интервал актуальности: `day`, `week`, `month`, `year`                     | Оба              |
| `country`                           | Двухбуквенный код страны (`us`, `de`, `jp`)                               | Только нативный  |
| `language`                          | Код языка ISO 639-1 (`en`, `fr`, `zh`)                                    | Только нативный  |
| `date_after` / `date_before`        | Диапазон дат публикации в формате `YYYY-MM-DD`                            | Только нативный  |
| `domain_filter`                     | Не более 20 доменов; список разрешённых или запретов с префиксом `-`, без смешивания | Только нативный |
| `max_tokens` / `max_tokens_per_page` | Лимит содержимого для всех результатов / для одной страницы              | Только нативный  |

Фильтры, доступные только для нативного API, при использовании пути
чат-комплишенов возвращают информативную ошибку. `freshness` нельзя сочетать с
`date_after`/`date_before`.

## Расширенная настройка

<AccordionGroup>
  <Accordion title="Переменная окружения для процессов-демонов">
    <Warning>
    Ключ, экспортированный только в интерактивной оболочке, недоступен демону
    Gateway, запущенному через launchd/systemd, если это окружение не импортировано
    явно. Укажите ключ в `~/.openclaw/.env` или через `env.shellEnv`, чтобы процесс
    Gateway мог его прочитать. Полный порядок приоритетов см. в разделе
    [Переменные окружения](/ru/help/environment).
    </Warning>
  </Accordion>

  <Accordion title="Настройка прокси OpenRouter">
    Чтобы направлять поисковые запросы Perplexity через OpenRouter, укажите
    `OPENROUTER_API_KEY` (с префиксом `sk-or-`) вместо нативного ключа Perplexity.
    OpenClaw обнаружит ключ и автоматически переключится на транспорт Sonar. Это
    удобно, если у вас уже настроена оплата OpenRouter и вы хотите объединить там
    провайдеров.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Инструмент поиска Perplexity" href="/ru/tools/perplexity-search" icon="magnifying-glass">
    Как агент выполняет поиск через Perplexity и интерпретирует результаты.
  </Card>
  <Card title="Справочник по настройке" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по настройке, включая записи плагинов.
  </Card>
</CardGroup>
