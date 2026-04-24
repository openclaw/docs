---
read_when:
    - Ви хочете налаштувати Perplexity як provider вебпошуку
    - Вам потрібен API-ключ Perplexity або налаштування проксі OpenRouter
summary: Налаштування provider вебпошуку Perplexity (API-ключ, режими пошуку, фільтрація)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T18:13:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

Plugin Perplexity надає можливості вебпошуку через API пошуку Perplexity
або Perplexity Sonar через OpenRouter.

<Note>
Ця сторінка описує налаштування **provider** Perplexity. Для **інструмента**
Perplexity (як агент його використовує) див. [Інструмент Perplexity](/uk/tools/perplexity-search).
</Note>

| Властивість | Значення                                                             |
| ----------- | -------------------------------------------------------------------- |
| Тип         | Provider вебпошуку (не provider моделі)                              |
| Автентифікація | `PERPLEXITY_API_KEY` (напряму) або `OPENROUTER_API_KEY` (через OpenRouter) |
| Шлях конфігурації | `plugins.entries.perplexity.config.webSearch.apiKey`           |

## Початок роботи

<Steps>
  <Step title="Установіть API-ключ">
    Запустіть інтерактивний сценарій налаштування вебпошуку:

    ```bash
    openclaw configure --section web
    ```

    Або встановіть ключ напряму:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Почніть шукати">
    Агент автоматично використовуватиме Perplexity для вебпошуку, щойно ключ буде
    налаштовано. Жодних додаткових дій не потрібно.
  </Step>
</Steps>

## Режими пошуку

Plugin автоматично вибирає transport на основі префікса API-ключа:

<Tabs>
  <Tab title="Власний API Perplexity (pplx-)">
    Коли ваш ключ починається з `pplx-`, OpenClaw використовує власний API пошуку Perplexity.
    Цей transport повертає структуровані результати та підтримує фільтри за доменом, мовою
    і датою (див. параметри фільтрації нижче).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Коли ваш ключ починається з `sk-or-`, OpenClaw маршрутизує запити через OpenRouter, використовуючи
    модель Perplexity Sonar. Цей transport повертає відповіді, синтезовані ШІ, із
    цитуваннями.
  </Tab>
</Tabs>

| Префікс ключа | Transport                      | Можливості                                      |
| ------------- | ------------------------------ | ----------------------------------------------- |
| `pplx-`       | Власний API пошуку Perplexity  | Структуровані результати, фільтри за доменом/мовою/датою |
| `sk-or-`      | OpenRouter (Sonar)             | Відповіді, синтезовані ШІ, із цитуваннями       |

## Фільтрація у власному API

<Note>
Параметри фільтрації доступні лише при використанні власного API Perplexity
(ключ `pplx-`). Пошук через OpenRouter/Sonar не підтримує ці параметри.
</Note>

Під час використання власного API Perplexity пошук підтримує такі фільтри:

| Фільтр         | Опис                                      | Приклад                             |
| -------------- | ----------------------------------------- | ----------------------------------- |
| Країна         | 2-літерний код країни                     | `us`, `de`, `jp`                    |
| Мова           | Код мови ISO 639-1                        | `en`, `fr`, `zh`                    |
| Діапазон дат   | Вікно давності                            | `day`, `week`, `month`, `year`      |
| Фільтри доменів| Allowlist або denylist (макс. 20 доменів) | `example.com`                       |
| Бюджет вмісту  | Ліміти токенів на відповідь / на сторінку | `max_tokens`, `max_tokens_per_page` |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Змінна середовища для daemon-процесів">
    Якщо Gateway OpenClaw працює як daemon (launchd/systemd), переконайтеся, що
    `PERPLEXITY_API_KEY` доступний для цього процесу.

    <Warning>
    Ключ, заданий лише в `~/.profile`, не буде видимий daemon-процесу launchd/systemd,
    якщо це середовище не імпортовано явно. Установіть ключ у
    `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг
    його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Налаштування проксі OpenRouter">
    Якщо ви хочете маршрутизувати пошук Perplexity через OpenRouter, установіть
    `OPENROUTER_API_KEY` (префікс `sk-or-`) замість власного ключа Perplexity.
    OpenClaw визначить префікс і автоматично переключиться на transport Sonar.

    <Tip>
    Transport OpenRouter корисний, якщо у вас уже є обліковий запис OpenRouter
    і ви хочете консолідоване білінг-обслуговування для кількох provider.
    </Tip>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Інструмент пошуку Perplexity" href="/uk/tools/perplexity-search" icon="magnifying-glass">
    Як агент викликає пошук Perplexity та інтерпретує результати.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації, включно із записами Plugin.
  </Card>
</CardGroup>
