---
read_when:
    - Вы хотите настроить Perplexity как провайдера веб-поиска
    - Вам нужен ключ API Perplexity или настройка прокси OpenRouter
summary: Настройка провайдера веб-поиска Perplexity (API-ключ, режимы поиска, фильтрация)
title: Perplexity
x-i18n:
    generated_at: "2026-06-28T23:39:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity предоставляет возможности веб-поиска через Perplexity
Search API или Perplexity Sonar через OpenRouter.

<Note>
Эта страница описывает настройку **поставщика** Perplexity. О **инструменте** Perplexity (как агент его использует) см. [инструмент Perplexity](/ru/tools/perplexity-search).
</Note>

| Свойство    | Значение                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Тип        | Поставщик веб-поиска (не поставщик моделей)                             |
| Аутентификация        | `PERPLEXITY_API_KEY` (напрямую) или `OPENROUTER_API_KEY` (через OpenRouter) |
| Путь конфигурации | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Установка Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Задайте ключ API">
    Запустите интерактивный поток настройки веб-поиска:

    ```bash
    openclaw configure --section web
    ```

    Или задайте ключ напрямую:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Начните поиск">
    Агент будет автоматически использовать Perplexity для веб-поиска после
    настройки ключа. Дополнительные действия не требуются.
  </Step>
</Steps>

## Режимы поиска

Plugin автоматически выбирает транспорт на основе префикса ключа API:

<Tabs>
  <Tab title="Нативный API Perplexity (pplx-)">
    Если ваш ключ начинается с `pplx-`, OpenClaw использует нативный Perplexity Search
    API. Этот транспорт возвращает структурированные результаты и поддерживает фильтры
    по домену, языку и дате (см. параметры фильтрации ниже).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Если ваш ключ начинается с `sk-or-`, OpenClaw выполняет маршрутизацию через OpenRouter с использованием
    модели Perplexity Sonar. Этот транспорт возвращает ответы, синтезированные ИИ,
    с цитатами.
  </Tab>
</Tabs>

| Префикс ключа | Транспорт                    | Возможности                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Нативный Perplexity Search API | Структурированные результаты, фильтры по домену/языку/дате |
| `sk-or-`   | OpenRouter (Sonar)           | Ответы, синтезированные ИИ, с цитатами            |

## Фильтрация в нативном API

<Note>
Параметры фильтрации доступны только при использовании нативного API Perplexity
(ключ `pplx-`). Поиск через OpenRouter/Sonar не поддерживает эти параметры.
</Note>

При использовании нативного API Perplexity поиск поддерживает следующие фильтры:

| Фильтр         | Описание                            | Пример                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| Страна        | Двухбуквенный код страны                  | `us`, `de`, `jp`                    |
| Язык       | Код языка ISO 639-1                | `en`, `fr`, `zh`                    |
| Диапазон дат     | Окно давности                         | `day`, `week`, `month`, `year`      |
| Фильтры доменов | Список разрешенных или запрещенных доменов (макс. 20 доменов) | `example.com`                       |
| Бюджет содержимого | Лимиты токенов на ответ / на страницу   | `max_tokens`, `max_tokens_per_page` |

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Переменная окружения для процессов-демонов">
    Если OpenClaw Gateway работает как демон (launchd/systemd), убедитесь, что
    `PERPLEXITY_API_KEY` доступен этому процессу.

    <Warning>
    Ключ, экспортированный только в интерактивной оболочке, не будет виден
    демону launchd/systemd, если это окружение явно не импортировано. Задайте
    ключ в `~/.openclaw/.env` или через `env.shellEnv`, чтобы процесс Gateway
    мог его прочитать.
    </Warning>

  </Accordion>

  <Accordion title="Настройка прокси OpenRouter">
    Если вы предпочитаете направлять поисковые запросы Perplexity через OpenRouter, задайте
    `OPENROUTER_API_KEY` (префикс `sk-or-`) вместо нативного ключа Perplexity.
    OpenClaw определит префикс и автоматически переключится на транспорт
    Sonar.

    <Tip>
    Транспорт OpenRouter полезен, если у вас уже есть учетная запись OpenRouter
    и вы хотите объединить оплату для нескольких поставщиков.
    </Tip>

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Инструмент поиска Perplexity" href="/ru/tools/perplexity-search" icon="magnifying-glass">
    Как агент вызывает поиски Perplexity и интерпретирует результаты.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации, включая записи Plugin.
  </Card>
</CardGroup>
