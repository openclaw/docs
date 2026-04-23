---
read_when:
    - Ви хочете налаштувати Perplexity як провайдера web search
    - Вам потрібен API key Perplexity або налаштування проксі OpenRouter
summary: Налаштування провайдера Perplexity web search (API key, режими пошуку, фільтрація)
title: Perplexity
x-i18n:
    generated_at: "2026-04-23T21:07:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (провайдер Web Search)

Plugin Perplexity надає можливості web search через Perplexity
Search API або Perplexity Sonar через OpenRouter.

<Note>
Ця сторінка описує налаштування **провайдера** Perplexity. Про **інструмент**
Perplexity (як агент його використовує) див. [Інструмент Perplexity](/uk/tools/perplexity-search).
</Note>

| Властивість | Значення                                                             |
| ----------- | -------------------------------------------------------------------- |
| Тип         | Провайдер web search (не провайдер моделі)                           |
| Автентифікація | `PERPLEXITY_API_KEY` (напряму) або `OPENROUTER_API_KEY` (через OpenRouter) |
| Шлях конфігурації | `plugins.entries.perplexity.config.webSearch.apiKey`          |

## Початок роботи

<Steps>
  <Step title="Установіть API key">
    Запустіть інтерактивний потік конфігурації web-search:

    ```bash
    openclaw configure --section web
    ```

    Або встановіть ключ безпосередньо:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Почніть пошук">
    Агент автоматично використовуватиме Perplexity для web search, щойно ключ буде
    налаштовано. Додаткових кроків не потрібно.
  </Step>
</Steps>

## Режими пошуку

Plugin автоматично вибирає транспорт за префіксом API key:

<Tabs>
  <Tab title="Нативний API Perplexity (pplx-)">
    Коли ваш ключ починається з `pplx-`, OpenClaw використовує нативний Perplexity Search
    API. Цей транспорт повертає структуровані результати й підтримує фільтри доменів, мови
    та дат (див. параметри фільтрації нижче).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Коли ваш ключ починається з `sk-or-`, OpenClaw маршрутизує через OpenRouter, використовуючи
    модель Perplexity Sonar. Цей транспорт повертає AI-синтезовані відповіді з
    цитуваннями.
  </Tab>
</Tabs>

| Префікс ключа | Транспорт                     | Можливості                                       |
| ------------- | ----------------------------- | ------------------------------------------------ |
| `pplx-`       | Нативний Perplexity Search API | Структуровані результати, фільтри доменів/мови/дат |
| `sk-or-`      | OpenRouter (Sonar)            | AI-синтезовані відповіді з цитуваннями           |

## Фільтрація в нативному API

<Note>
Параметри фільтрації доступні лише при використанні нативного API Perplexity
(ключ `pplx-`). Пошук через OpenRouter/Sonar ці параметри не підтримує.
</Note>

При використанні нативного API Perplexity пошук підтримує такі фільтри:

| Фільтр          | Опис                                      | Приклад                             |
| --------------- | ----------------------------------------- | ----------------------------------- |
| Країна          | 2-літерний код країни                     | `us`, `de`, `jp`                    |
| Мова            | Код мови ISO 639-1                        | `en`, `fr`, `zh`                    |
| Діапазон дат    | Вікно давності                            | `day`, `week`, `month`, `year`      |
| Фільтри доменів | Allowlist або denylist (макс. 20 доменів) | `example.com`                       |
| Бюджет вмісту   | Ліміти токенів на відповідь / на сторінку | `max_tokens`, `max_tokens_per_page` |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Змінна середовища для процесів-демонів">
    Якщо OpenClaw Gateway працює як демон (launchd/systemd), переконайтеся, що
    `PERPLEXITY_API_KEY` доступний цьому процесу.

    <Warning>
    Ключ, установлений лише в `~/.profile`, не буде видимий демону launchd/systemd,
    якщо це середовище не було явно імпортоване. Установіть ключ у
    `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг
    його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Налаштування проксі OpenRouter">
    Якщо ви віддаєте перевагу маршрутизації пошуку Perplexity через OpenRouter, установіть
    `OPENROUTER_API_KEY` (префікс `sk-or-`) замість нативного ключа Perplexity.
    OpenClaw виявить префікс і автоматично переключиться на транспорт
    Sonar.

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
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації, включно із записами Plugin.
  </Card>
</CardGroup>
