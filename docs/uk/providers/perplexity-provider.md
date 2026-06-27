---
read_when:
    - Ви хочете налаштувати Perplexity як постачальника вебпошуку
    - Потрібен ключ API Perplexity або налаштування проксі OpenRouter
summary: Налаштування провайдера вебпошуку Perplexity (ключ API, режими пошуку, фільтрування)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:13:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity надає можливості вебпошуку через Perplexity
Search API або Perplexity Sonar через OpenRouter.

<Note>
Ця сторінка описує налаштування **провайдера** Perplexity. Для **інструмента** Perplexity (як агент його використовує) див. [інструмент Perplexity](/uk/tools/perplexity-search).
</Note>

| Властивість | Значення                                                               |
| ----------- | ---------------------------------------------------------------------- |
| Тип         | Провайдер вебпошуку (не провайдер моделей)                             |
| Автентифікація | `PERPLEXITY_API_KEY` (напряму) або `OPENROUTER_API_KEY` (через OpenRouter) |
| Шлях конфігурації | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Установлення Plugin

Установіть офіційний Plugin, потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Set the API key">
    Запустіть інтерактивний потік конфігурації вебпошуку:

    ```bash
    openclaw configure --section web
    ```

    Або задайте ключ напряму:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Start searching">
    Агент автоматично використовуватиме Perplexity для вебпошуку після
    налаштування ключа. Додаткові кроки не потрібні.
  </Step>
</Steps>

## Режими пошуку

Plugin автоматично вибирає транспорт на основі префікса ключа API:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    Коли ваш ключ починається з `pplx-`, OpenClaw використовує нативний Perplexity Search
    API. Цей транспорт повертає структуровані результати та підтримує фільтри домену, мови
    й дати (див. параметри фільтрації нижче).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Коли ваш ключ починається з `sk-or-`, OpenClaw спрямовує запити через OpenRouter за допомогою
    моделі Perplexity Sonar. Цей транспорт повертає відповіді, синтезовані ШІ, з
    цитуваннями.
  </Tab>
</Tabs>

| Префікс ключа | Транспорт                    | Можливості                                      |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Нативний Perplexity Search API | Структуровані результати, фільтри домену/мови/дати |
| `sk-or-`   | OpenRouter (Sonar)           | Відповіді, синтезовані ШІ, з цитуваннями        |

## Фільтрація нативного API

<Note>
Параметри фільтрації доступні лише під час використання нативного Perplexity API
(ключ `pplx-`). Пошук OpenRouter/Sonar не підтримує ці параметри.
</Note>

Під час використання нативного Perplexity API пошук підтримує такі фільтри:

| Фільтр         | Опис                                   | Приклад                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| Країна         | 2-літерний код країни                  | `us`, `de`, `jp`                    |
| Мова           | Код мови ISO 639-1                     | `en`, `fr`, `zh`                    |
| Діапазон дат   | Вікно актуальності                     | `day`, `week`, `month`, `year`      |
| Фільтри доменів | Список дозволених або заборонених (макс. 20 доменів) | `example.com`                       |
| Бюджет вмісту  | Ліміти токенів на відповідь / на сторінку | `max_tokens`, `max_tokens_per_page` |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Environment variable for daemon processes">
    Якщо OpenClaw Gateway працює як демон (launchd/systemd), переконайтеся, що
    `PERPLEXITY_API_KEY` доступний цьому процесу.

    <Warning>
    Ключ, експортований лише в інтерактивній оболонці, не буде видимий для
    демона launchd/systemd, якщо це середовище не імпортовано явно. Задайте
    ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway
    міг його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter proxy setup">
    Якщо ви хочете спрямовувати пошуки Perplexity через OpenRouter, задайте
    `OPENROUTER_API_KEY` (префікс `sk-or-`) замість нативного ключа Perplexity.
    OpenClaw виявить префікс і автоматично перемкнеться на транспорт Sonar.

    <Tip>
    Транспорт OpenRouter корисний, якщо у вас уже є обліковий запис OpenRouter
    і ви хочете консолідовану оплату для кількох провайдерів.
    </Tip>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Perplexity search tool" href="/uk/tools/perplexity-search" icon="magnifying-glass">
    Як агент викликає пошук Perplexity та інтерпретує результати.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації, зокрема записи Plugin.
  </Card>
</CardGroup>
