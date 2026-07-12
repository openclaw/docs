---
read_when:
    - Ви хочете налаштувати Perplexity як постачальника вебпошуку
    - Вам потрібен ключ API Perplexity або налаштування проксі OpenRouter
summary: Налаштування провайдера вебпошуку Perplexity (ключ API, режими пошуку, фільтрування)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T13:43:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Плагін Perplexity реєструє постачальника `web_search` із двома транспортами:
нативним Perplexity Search API (структуровані результати з фільтрами) та завершеннями
чату Perplexity Sonar, безпосередньо або через OpenRouter (синтезовані ШІ відповіді
з цитуваннями).

<Note>
На цій сторінці описано налаштування **постачальника** Perplexity. Про **інструмент** Perplexity (як агент його використовує) див. у розділі [Пошук Perplexity](/uk/tools/perplexity-search).
</Note>

| Властивість         | Значення                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| Тип                 | Постачальник вебпошуку (не постачальник моделей)                                 |
| Автентифікація      | `PERPLEXITY_API_KEY` (нативно) або `OPENROUTER_API_KEY` (через OpenRouter)       |
| Шлях конфігурації   | `plugins.entries.perplexity.config.webSearch.apiKey`                             |
| Перевизначення      | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`                 |
| Отримати ключ       | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)             |

## Встановлення плагіна

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Установіть ключ API">
    ```bash
    openclaw configure --section web
    ```

    Або встановіть ключ безпосередньо:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Також можна використовувати ключ, експортований як `PERPLEXITY_API_KEY` або
    `OPENROUTER_API_KEY` у середовищі Gateway.

  </Step>
  <Step title="Почніть пошук">
    `web_search` автоматично виявляє Perplexity, щойно його ключ стає доступними
    обліковими даними для пошуку; додаткове налаштування не потрібне. Щоб явно
    закріпити постачальника:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## Режими пошуку

Плагін визначає транспорт у такому порядку:

1. Установлено `webSearch.baseUrl` або `webSearch.model`: запити завжди спрямовуються через завершення чату Sonar до цієї кінцевої точки незалежно від типу ключа.
2. В іншому разі джерело ключа визначає кінцеву точку: префікс налаштованого ключа визначає транспорт (конфігурація має пріоритет над змінними середовища); ключ із середовища безпосередньо використовує відповідну йому кінцеву точку.

| Префікс ключа | Транспорт                                                  | Можливості                                             |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `pplx-`       | Нативний Perplexity Search API (`https://api.perplexity.ai`) | Структуровані результати, фільтри домену/мови/дати     |
| `sk-or-`      | OpenRouter (`https://openrouter.ai/api/v1`), модель Sonar  | Синтезовані ШІ відповіді з цитуваннями                 |

Налаштований ключ із будь-яким іншим префіксом також використовує нативний Search API.
Шлях завершень чату за замовчуванням використовує модель `perplexity/sonar-pro`;
перевизначте її за допомогою `plugins.entries.perplexity.config.webSearch.model`.

## Фільтрація нативного API

| Фільтр                              | Опис                                                                 | Транспорт      |
| ----------------------------------- | -------------------------------------------------------------------- | -------------- |
| `count`                             | Результатів на пошук, 1–10 (за замовчуванням 5)                      | Лише нативний  |
| `freshness`                         | Вікно актуальності: `day`, `week`, `month`, `year`                   | Обидва         |
| `country`                           | Дволітерний код країни (`us`, `de`, `jp`)                            | Лише нативний  |
| `language`                          | Код мови ISO 639-1 (`en`, `fr`, `zh`)                                | Лише нативний  |
| `date_after` / `date_before`        | Діапазон дат публікації у форматі `YYYY-MM-DD`                       | Лише нативний  |
| `domain_filter`                     | Щонайбільше 20 доменів; список дозволених або список заборонених із префіксом `-`, не можна змішувати | Лише нативний |
| `max_tokens` / `max_tokens_per_page` | Бюджет вмісту для всіх результатів / для кожної сторінки            | Лише нативний  |

Фільтри, доступні лише для нативного API, повертають описову помилку на шляху
завершень чату. `freshness` не можна поєднувати з `date_after`/`date_before`.

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Змінна середовища для процесів-демонів">
    <Warning>
    Ключ, експортований лише в інтерактивній оболонці, недоступний демону Gateway
    launchd/systemd, якщо це середовище не імпортовано явно. Установіть ключ у
    `~/.openclaw/.env` або через `env.shellEnv`, щоб процес Gateway міг його
    прочитати. Повний порядок пріоритетів див. у розділі
    [Змінні середовища](/uk/help/environment).
    </Warning>
  </Accordion>

  <Accordion title="Налаштування проксі OpenRouter">
    Щоб спрямовувати пошукові запити Perplexity через OpenRouter, установіть
    `OPENROUTER_API_KEY` (префікс `sk-or-`) замість нативного ключа Perplexity.
    OpenClaw виявить ключ і автоматично перемкнеться на транспорт Sonar. Це корисно,
    якщо ви вже налаштували оплату OpenRouter і хочете об’єднати там постачальників.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Інструмент пошуку Perplexity" href="/uk/tools/perplexity-search" icon="magnifying-glass">
    Як агент викликає пошук Perplexity та інтерпретує результати.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації, зокрема записи плагінів.
  </Card>
</CardGroup>
