---
read_when:
    - Вам потрібен вебпошук на основі Tavily
    - Вам потрібен API-ключ Tavily
    - Вам потрібен Tavily як провайдер web_search
    - Вам потрібне вилучення вмісту з URL-адрес
summary: Інструменти пошуку й видобування Tavily
title: Tavily
x-i18n:
    generated_at: "2026-06-27T18:29:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) — це пошуковий API, розроблений для AI-застосунків. OpenClaw надає доступ до нього двома способами:

- як постачальник `web_search` для універсального інструмента пошуку
- як явні інструменти Plugin: `tavily_search` і `tavily_extract`

Tavily повертає структуровані результати, оптимізовані для споживання LLM, із налаштовуваною глибиною пошуку, фільтрацією за темами, фільтрами доменів, згенерованими AI підсумками відповідей і витягуванням вмісту з URL-адрес (зокрема сторінок, відрендерених JavaScript).

| Властивість | Значення                            |
| ----------- | ----------------------------------- |
| ID Plugin   | `tavily`                            |
| Пакет       | `@openclaw/tavily-plugin`           |
| Автентифікація | `TAVILY_API_KEY` або config `apiKey` |
| Базова URL-адреса | `https://api.tavily.com` (за замовчуванням) |
| Інструменти | `tavily_search`, `tavily_extract`   |

## Початок роботи

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Get an API key">
    Створіть обліковий запис Tavily на [tavily.com](https://tavily.com), а потім згенеруйте API-ключ на панелі керування.
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
    Запустіть `web_search` з будь-якого агента або викличте `tavily_search` напряму.
  </Step>
</Steps>

<Tip>
Вибір Tavily під час початкового налаштування або `openclaw configure --section web` встановлює й вмикає офіційний Plugin Tavily, коли це потрібно.
</Tip>

## Довідник інструментів

### `tavily_search`

Використовуйте це, коли потрібні специфічні для Tavily засоби керування пошуком замість універсального `web_search`.

| Параметр          | Тип          | Обмеження / значення за замовчуванням | Опис                                      |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------- |
| `query`           | string       | обов’язково                            | Рядок пошукового запиту. Не більше 400 символів. |
| `search_depth`    | enum         | `basic` (за замовчуванням), `advanced` | `advanced` повільніший, але релевантніший. |
| `topic`           | enum         | `general` (за замовчуванням), `news`, `finance` | Фільтрація за групою тем. |
| `max_results`     | integer      | 1-20                                   | Кількість результатів.                    |
| `include_answer`  | boolean      | за замовчуванням `false`               | Додати згенерований AI підсумок відповіді Tavily. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Фільтрувати результати за давністю.       |
| `include_domains` | string array | (немає)                                | Включати результати лише з цих доменів.   |
| `exclude_domains` | string array | (немає)                                | Виключати результати з цих доменів.       |

Компроміс глибини пошуку:

| Глибина    | Швидкість | Релевантність | Найкраще для                         |
| ---------- | --------- | ------------- | ------------------------------------ |
| `basic`    | Швидше    | Висока        | Запити загального призначення (за замовчуванням). |
| `advanced` | Повільніше | Найвища       | Точне дослідження та пошук фактів.   |

### `tavily_extract`

Використовуйте це, щоб витягти чистий вміст з однієї або кількох URL-адрес. Обробляє сторінки, відрендерені JavaScript, і підтримує поділ на фрагменти за запитом для цільового витягування.

| Параметр           | Тип          | Обмеження / значення за замовчуванням | Опис                                                  |
| ------------------- | ------------ | -------------------------------------- | ----------------------------------------------------- |
| `urls`              | string array | обов’язково, 1-20                      | URL-адреси, з яких потрібно витягти вміст.            |
| `query`             | string       | (необов’язково)                        | Повторно ранжувати витягнуті фрагменти за релевантністю цьому запиту. |
| `extract_depth`     | enum         | `basic` (за замовчуванням), `advanced` | Використовуйте `advanced` для сторінок із великою кількістю JS, SPA або динамічних таблиць. |
| `chunks_per_source` | integer      | 1-5; **потребує `query`**              | Фрагменти, що повертаються для кожної URL-адреси. Помилка, якщо задано без `query`. |
| `include_images`    | boolean      | за замовчуванням `false`               | Додати URL-адреси зображень до результатів.           |

Компроміс глибини витягування:

| Глибина    | Коли використовувати                         |
| ---------- | -------------------------------------------- |
| `basic`    | Прості сторінки. Спробуйте це спочатку.      |
| `advanced` | SPA, відрендерені JS, динамічний вміст, таблиці. |

<Tip>
Розбивайте більші списки URL-адрес на кілька викликів `tavily_extract` (максимум 20 на запит). Використовуйте `query` разом із `chunks_per_source`, щоб отримувати лише релевантний вміст замість повних сторінок.
</Tip>

## Вибір правильного інструмента

| Потреба                              | Інструмент       |
| ------------------------------------ | ---------------- |
| Швидкий вебпошук без спеціальних параметрів | `web_search`     |
| Пошук із глибиною, темою, AI-відповідями | `tavily_search`  |
| Витягування вмісту з конкретних URL-адрес | `tavily_extract` |

<Note>
Універсальний інструмент `web_search` з Tavily як постачальником підтримує `query` і `count` (до 20 результатів). Для специфічних для Tavily засобів керування (`search_depth`, `topic`, `include_answer`, фільтри доменів, часовий діапазон) натомість використовуйте `tavily_search`.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="API key resolution order">
    Клієнт Tavily шукає свій API-ключ у такому порядку:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (розв’язується через SecretRefs).
    2. `TAVILY_API_KEY` із середовища Gateway.

    `tavily_extract` створює помилку налаштування, якщо немає жодного з них.

  </Accordion>

  <Accordion title="Custom base URL">
    Перевизначте `plugins.entries.tavily.config.webSearch.baseUrl`, якщо ви пропускаєте Tavily через проксі. Значення за замовчуванням: `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requires `query`">
    `tavily_extract` відхиляє виклики, які передають `chunks_per_source` без `query`. Tavily ранжує фрагменти за релевантністю запиту, тому без нього цей параметр не має сенсу.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Web Search overview" href="/uk/tools/web" icon="magnifying-glass">
    Усі постачальники та правила автоматичного виявлення.
  </Card>
  <Card title="Firecrawl" href="/uk/tools/firecrawl" icon="fire">
    Пошук плюс скрейпінг із витягуванням вмісту.
  </Card>
  <Card title="Exa Search" href="/uk/tools/exa-search" icon="binoculars">
    Нейронний пошук із витягуванням вмісту.
  </Card>
  <Card title="Configuration" href="/uk/gateway/configuration" icon="gear">
    Повна схема конфігурації для записів Plugin і маршрутизації інструментів.
  </Card>
</CardGroup>
