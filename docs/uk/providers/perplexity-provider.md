---
read_when:
    - Ви хочете налаштувати Perplexity як провайдера вебпошуку
    - Вам потрібен API-ключ Perplexity або налаштування проксі OpenRouter
summary: Налаштування провайдера вебпошуку Perplexity (API-ключ, режими пошуку, фільтрація)
title: Perplexity
x-i18n:
    generated_at: "2026-04-27T06:27:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 15
---

Plugin Perplexity надає можливості вебпошуку через Perplexity
Search API або Perplexity Sonar через OpenRouter.

<Note>
Ця сторінка — налаштування **провайдера** Perplexity. Для **інструмента** Perplexity (як агент ним користується) див. [Інструмент Perplexity](/uk/tools/perplexity-search).
</Note>

| Властивість | Значення                                                              |
| ----------- | --------------------------------------------------------------------- |
| Тип         | Провайдер вебпошуку (не провайдер моделей)                            |
| Автентифікація | `PERPLEXITY_API_KEY` (напряму) або `OPENROUTER_API_KEY` (через OpenRouter) |
| Шлях конфігурації | `plugins.entries.perplexity.config.webSearch.apiKey`            |

## Початок роботи

<Steps>
  <Step title="Установіть API-ключ">
    Запустіть інтерактивний процес налаштування вебпошуку:

    ```bash
    openclaw configure --section web
    ```

    Або задайте ключ напряму:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Почніть пошук">
    Агент автоматично використовуватиме Perplexity для вебпошуку, щойно ключ буде
    налаштовано. Жодних додаткових кроків не потрібно.
  </Step>
</Steps>

## Режими пошуку

Plugin автоматично вибирає транспорт на основі префікса API-ключа:

<Tabs>
  <Tab title="Нативний Perplexity API (pplx-)">
    Коли ваш ключ починається з `pplx-`, OpenClaw використовує нативний Perplexity Search
    API. Цей транспорт повертає структуровані результати й підтримує фільтри за доменом, мовою
    та датою (див. параметри фільтрації нижче).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Коли ваш ключ починається з `sk-or-`, OpenClaw маршрутизує запити через OpenRouter з використанням
    моделі Perplexity Sonar. Цей транспорт повертає відповіді, синтезовані ШІ, з
    цитуваннями.
  </Tab>
</Tabs>

| Префікс ключа | Транспорт                   | Можливості                                      |
| ------------- | --------------------------- | ----------------------------------------------- |
| `pplx-`       | Нативний Perplexity Search API | Структуровані результати, фільтри домену/мови/дати |
| `sk-or-`      | OpenRouter (Sonar)          | Відповіді, синтезовані ШІ, з цитуваннями        |

## Фільтрація нативного API

<Note>
Параметри фільтрації доступні лише при використанні нативного Perplexity API
(ключ `pplx-`). Пошуки через OpenRouter/Sonar не підтримують ці параметри.
</Note>

При використанні нативного Perplexity API пошук підтримує такі фільтри:

| Фільтр         | Опис                                      | Приклад                             |
| -------------- | ----------------------------------------- | ----------------------------------- |
| Країна         | 2-літерний код країни                     | `us`, `de`, `jp`                    |
| Мова           | Код мови ISO 639-1                        | `en`, `fr`, `zh`                    |
| Діапазон дат   | Вікно давності                            | `day`, `week`, `month`, `year`      |
| Фільтри доменів | Allowlist або denylist (макс. 20 доменів) | `example.com`                      |
| Бюджет вмісту  | Ліміти токенів на відповідь / на сторінку | `max_tokens`, `max_tokens_per_page` |

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Змінна середовища для процесів демона">
    Якщо Gateway OpenClaw працює як демон (launchd/systemd), переконайтеся, що
    `PERPLEXITY_API_KEY` доступний цьому процесу.

    <Warning>
    Ключ, заданий лише в `~/.profile`, не буде видимий для демона launchd/systemd,
    якщо це середовище явно не імпортоване. Задайте ключ у
    `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг
    його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Налаштування проксі OpenRouter">
    Якщо ви хочете маршрутизувати пошуки Perplexity через OpenRouter, задайте
    `OPENROUTER_API_KEY` (префікс `sk-or-`) замість нативного ключа Perplexity.
    OpenClaw виявить префікс і автоматично переключиться на транспорт Sonar.

    <Tip>
    Транспорт OpenRouter корисний, якщо у вас уже є обліковий запис OpenRouter
    і ви хочете консолідований білінг для кількох провайдерів.
    </Tip>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Інструмент пошуку Perplexity" href="/uk/tools/perplexity-search" icon="magnifying-glass">
    Як агент викликає пошук Perplexity та інтерпретує результати.
  </Card>
  <Card title="Довідка з конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна довідка з конфігурації, включно із записами plugin.
  </Card>
</CardGroup>
