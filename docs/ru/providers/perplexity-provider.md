---
read_when:
    - Вы хотите настроить Perplexity в качестве провайдера веб-поиска
    - Вам нужен ключ API Perplexity или настройка прокси OpenRouter
summary: Настройка провайдера веб-поиска Perplexity (ключ API, режимы поиска, фильтрация)
title: Perplexity
x-i18n:
    generated_at: "2026-07-13T20:14:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Плагин Perplexity регистрирует провайдера `web_search` с двумя транспортами:
нативным Perplexity Search API (структурированные результаты с фильтрами) и
чат-завершениями Perplexity Sonar напрямую или через OpenRouter (ответы,
синтезированные ИИ, с указанием источников).

<Note>
На этой странице описана настройка **провайдера** Perplexity. Сведения об **инструменте** Perplexity (как агент использует его) см. в разделе [Поиск Perplexity](/ru/tools/perplexity-search).
</Note>

| Свойство    | Значение                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Тип        | Провайдер веб-поиска (не провайдер моделей)                             |
| Аутентификация        | `PERPLEXITY_API_KEY` (нативный) или `OPENROUTER_API_KEY` (через OpenRouter) |
| Путь конфигурации | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| Переопределения   | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| Получение ключа   | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)   |

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

    Также можно экспортировать ключ как `PERPLEXITY_API_KEY` или `OPENROUTER_API_KEY`
    в окружении Gateway.

  </Step>
  <Step title="Начните поиск">
    `web_search` автоматически обнаруживает Perplexity, когда его ключ является
    доступными учётными данными для поиска; дополнительная настройка не требуется.
    Чтобы явно закрепить провайдера:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## Режимы поиска

Плагин определяет транспорт в следующем порядке:

1. `webSearch.baseUrl` или `webSearch.model` задан: запросы всегда направляются через чат-завершения Sonar к этой конечной точке независимо от типа ключа.
2. В противном случае конечную точку определяет источник ключа: префикс настроенного ключа выбирает транспорт (конфигурация имеет приоритет над переменными окружения); ключ из окружения напрямую использует соответствующую ему конечную точку.

| Префикс ключа | Транспорт                                                  | Возможности                                         |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `pplx-`    | Нативный Perplexity Search API (`https://api.perplexity.ai`) | Структурированные результаты, фильтры по домену, языку и дате |
| `sk-or-`   | OpenRouter (`https://openrouter.ai/api/v1`), модель Sonar   | Ответы, синтезированные ИИ, с указанием источников            |

Настроенный ключ с любым другим префиксом также использует нативный Search API.
Путь чат-завершений по умолчанию использует модель `perplexity/sonar-pro`; её можно
переопределить с помощью `plugins.entries.perplexity.config.webSearch.model`.

## Фильтрация нативного API

| Фильтр                               | Описание                                                     | Транспорт   |
| ------------------------------------ | --------------------------------------------------------------- | ----------- |
| `count`                              | Результатов на один поиск: 1–10 (по умолчанию 5)                            | Только нативный |
| `freshness`                          | Период актуальности: `day`, `week`, `month`, `year`                  | Оба        |
| `country`                            | Двухбуквенный код страны (`us`, `de`, `jp`)                        | Только нативный |
| `language`                           | Код языка ISO 639-1 (`en`, `fr`, `zh`)                      | Только нативный |
| `date_after` / `date_before`         | Диапазон дат публикации в формате `YYYY-MM-DD`                            | Только нативный |
| `domain_filter`                      | Не более 20 доменов; список разрешённых или список запрещённых с префиксом `-`, но не оба одновременно | Только нативный |
| `max_tokens` / `max_tokens_per_page` | Лимит содержимого для всех результатов / одной страницы                    | Только нативный |

Фильтры, доступные только для нативного транспорта, при использовании пути
чат-завершений возвращают информативную ошибку.
`freshness` нельзя сочетать с `date_after`/`date_before`.

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Переменная окружения для фоновых процессов">
    <Warning>
    Ключ, экспортированный только в интерактивной оболочке, недоступен
    демону Gateway, запущенному через launchd/systemd, если это окружение
    не импортировано явно. Укажите ключ в `~/.openclaw/.env` или с помощью
    `env.shellEnv`, чтобы процесс Gateway мог прочитать его. Полный порядок
    приоритетов см. в разделе [Переменные окружения](/ru/help/environment).
    </Warning>
  </Accordion>

  <Accordion title="Настройка прокси OpenRouter">
    Чтобы направлять поисковые запросы Perplexity через OpenRouter, укажите
    `OPENROUTER_API_KEY` (префикс `sk-or-`) вместо нативного ключа Perplexity.
    OpenClaw обнаружит ключ и автоматически переключится на транспорт Sonar. Это
    удобно, если вы уже настроили оплату в OpenRouter и хотите объединить там
    провайдеров.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Инструмент поиска Perplexity" href="/ru/tools/perplexity-search" icon="magnifying-glass">
    Как агент выполняет поиск через Perplexity и интерпретирует результаты.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации, включая записи плагинов.
  </Card>
</CardGroup>
