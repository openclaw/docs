---
read_when:
    - Ви хочете використовувати генерацію відео Runway в OpenClaw
    - Вам потрібне налаштування API key/env для Runway
    - Ви хочете зробити Runway типовим провайдером відео
summary: Налаштування генерації відео Runway в OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-23T21:08:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0caa1c286a4e7ce25a2876f51d09ea462978746fb7a6f428395f67b78d56b2
    source_path: providers/runway.md
    workflow: 15
---

OpenClaw постачається з вбудованим провайдером `runway` для хостованої генерації відео.

| Властивість | Значення                                                           |
| ----------- | ------------------------------------------------------------------ |
| ID провайдера | `runway`                                                         |
| Автентифікація | `RUNWAYML_API_SECRET` (канонічно) або `RUNWAY_API_KEY`          |
| API         | Генерація відео Runway на основі задач (`GET /v1/tasks/{id}` polling) |

## Початок роботи

<Steps>
  <Step title="Установіть API key">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Установіть Runway як типовий провайдер відео">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Згенеруйте відео">
    Попросіть агента згенерувати відео. Runway буде використано автоматично.
  </Step>
</Steps>

## Підтримувані режими

| Режим          | Модель             | Вхідне референсне джерело |
| -------------- | ------------------ | ------------------------- |
| Text-to-video  | `gen4.5` (типово)  | Немає                     |
| Image-to-video | `gen4.5`           | 1 локальне або віддалене зображення |
| Video-to-video | `gen4_aleph`       | 1 локальне або віддалене відео |

<Note>
Локальні посилання на зображення та відео підтримуються через data URI. Для запусків лише з текстом
наразі доступні співвідношення сторін `16:9` і `9:16`.
</Note>

<Warning>
Для video-to-video наразі обов’язково потрібна саме `runway/gen4_aleph`.
</Warning>

## Конфігурація

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Псевдоніми змінних середовища">
    OpenClaw розпізнає і `RUNWAYML_API_SECRET` (канонічно), і `RUNWAY_API_KEY`.
    Будь-яка з цих змінних автентифікує провайдера Runway.
  </Accordion>

  <Accordion title="Опитування задач">
    Runway використовує API на основі задач. Після надсилання запиту на генерацію OpenClaw
    опитує `GET /v1/tasks/{id}`, доки відео не буде готове. Додаткової
    конфігурації для поведінки опитування не потрібно.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента, вибір провайдера та асинхронна поведінка.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference#agent-defaults" icon="gear">
    Типові налаштування агента, включно з моделлю генерації відео.
  </Card>
</CardGroup>
