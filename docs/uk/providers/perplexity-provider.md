---
read_when:
    - Ви хочете налаштувати Perplexity як провайдера вебпошуку
    - Вам потрібен API-ключ Perplexity або налаштування проксі OpenRouter
summary: Налаштування вебпошукового провайдера Perplexity (API-ключ, режими пошуку, фільтрація)
title: Perplexity
x-i18n:
    generated_at: "2026-04-12T10:43:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55c089e96601ebe05480d305364272c7f0ac721caa79746297c73002a9f20f55
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (провайдер вебпошуку)

Плагін Perplexity надає можливості вебпошуку через API пошуку Perplexity
або Perplexity Sonar через OpenRouter.

<Note>
Ця сторінка описує налаштування **провайдера** Perplexity. Щодо **інструмента**
Perplexity (як агент його використовує), див. [інструмент Perplexity](/uk/tools/perplexity-search).
</Note>

| Property    | Value                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Type        | Провайдер вебпошуку (не провайдер моделі)                              |
| Auth        | `PERPLEXITY_API_KEY` (напряму) або `OPENROUTER_API_KEY` (через OpenRouter) |
| Config path | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Початок роботи

<Steps>
  <Step title="Встановіть API-ключ">
    Запустіть інтерактивний процес налаштування вебпошуку:

    ```bash
    openclaw configure --section web
    ```

    Або встановіть ключ напряму:

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

Плагін автоматично вибирає транспорт на основі префікса API-ключа:

<Tabs>
  <Tab title="Нативний API Perplexity (pplx-)">
    Якщо ваш ключ починається з `pplx-`, OpenClaw використовує нативний API пошуку Perplexity.
    Цей транспорт повертає структуровані результати та підтримує фільтри за доменом, мовою
    і датою (див. параметри фільтрації нижче).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Якщо ваш ключ починається з `sk-or-`, OpenClaw спрямовує запити через OpenRouter, використовуючи
    модель Perplexity Sonar. Цей транспорт повертає відповіді, синтезовані ШІ,
    із цитуваннями.
  </Tab>
</Tabs>

| Key prefix | Transport                    | Features                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Нативний API пошуку Perplexity | Структуровані результати, фільтри за доменом/мовою/датою |
| `sk-or-`   | OpenRouter (Sonar)           | Відповіді, синтезовані ШІ, із цитуваннями        |

## Фільтрація в нативному API

<Note>
Параметри фільтрації доступні лише під час використання нативного API Perplexity
(ключ `pplx-`). Пошук через OpenRouter/Sonar не підтримує ці параметри.
</Note>

Під час використання нативного API Perplexity пошук підтримує такі фільтри:

| Filter         | Description                            | Example                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| Country        | 2-літерний код країни                  | `us`, `de`, `jp`                    |
| Language       | Код мови ISO 639-1                     | `en`, `fr`, `zh`                    |
| Date range     | Вікно актуальності                     | `day`, `week`, `month`, `year`      |
| Domain filters | Список дозволених або заборонених доменів (макс. 20 доменів) | `example.com` |
| Content budget | Ліміти токенів на відповідь / на сторінку | `max_tokens`, `max_tokens_per_page` |

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Змінна середовища для фонових процесів">
    Якщо Gateway OpenClaw працює як фоновий процес (launchd/systemd), переконайтеся,
    що `PERPLEXITY_API_KEY` доступний для цього процесу.

    <Warning>
    Ключ, заданий лише в `~/.profile`, не буде видимий для демона launchd/systemd,
    якщо це середовище не імпортовано явно. Задайте ключ у
    `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг
    його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Налаштування проксі OpenRouter">
    Якщо ви хочете спрямовувати пошук Perplexity через OpenRouter, задайте
    `OPENROUTER_API_KEY` (префікс `sk-or-`) замість нативного ключа Perplexity.
    OpenClaw визначить префікс і автоматично переключиться на транспорт Sonar.

    <Tip>
    Транспорт OpenRouter зручний, якщо у вас уже є обліковий запис OpenRouter
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
    Повний довідник конфігурації, включно із записами плагінів.
  </Card>
</CardGroup>
