---
read_when:
    - Ви хочете використовувати генерацію відео Runway в OpenClaw
    - Вам потрібні ключ API Runway і налаштування середовища
    - Ви хочете зробити Runway постачальником відео за замовчуванням
summary: Налаштування генерації відео Runway в OpenClaw
title: Злітна смуга
x-i18n:
    generated_at: "2026-05-06T00:20:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw постачається з вбудованим провайдером `runway` для хостингової генерації відео. Plugin увімкнено за замовчуванням, і він реєструє провайдер `runway` для контракту `videoGenerationProviders`.

| Властивість    | Значення                                                          |
| --------------- | ----------------------------------------------------------------- |
| Ідентифікатор провайдера | `runway`                                                |
| Plugin          | вбудований, `enabledByDefault: true`                              |
| Змінні середовища автентифікації | `RUNWAYML_API_SECRET` (канонічна) або `RUNWAY_API_KEY` |
| Прапорець онбордингу | `--auth-choice runway-api-key`                              |
| Прямий прапорець CLI | `--runway-api-key <key>`                                    |
| API             | генерація відео Runway на основі завдань (опитування `GET /v1/tasks/{id}`) |
| Модель за замовчуванням | `runway/gen4.5`                                         |

## Початок роботи

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Set Runway as the default video provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Generate a video">
    Попросіть агента згенерувати відео. Runway буде використано автоматично.
  </Step>
</Steps>

## Підтримувані режими та моделі

Провайдер надає сім моделей Runway, розподілених між трьома режимами. Той самий ідентифікатор моделі може обслуговувати більше ніж один режим (наприклад, `gen4.5` працює як для перетворення тексту на відео, так і для перетворення зображення на відео).

| Режим          | Моделі                                                                 | Вхідні еталонні дані   |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| Текст у відео  | `gen4.5` (за замовчуванням), `veo3.1`, `veo3.1_fast`, `veo3`           | Немає                  |
| Зображення у відео | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 локальне або віддалене зображення |
| Відео у відео  | `gen4_aleph`                                                           | 1 локальне або віддалене відео |

Локальні посилання на зображення та відео підтримуються через URI даних.

| Співвідношення сторін | Дозволені значення                         |
| --------------------- | ------------------------------------------- |
| Текст у відео         | `16:9`, `9:16`                              |
| Редагування зображень і відео | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Для режиму відео у відео зараз потрібен `runway/gen4_aleph`. Інші ідентифікатори моделей Runway відхиляють вхідні відеопосилання.
</Warning>

<Note>
  Вибір ідентифікатора моделі Runway з неправильного стовпця спричиняє явну помилку до того, як API-запит залишить OpenClaw. Провайдер перевіряє `model` за списком дозволених значень режиму (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) у `extensions/runway/video-generation-provider.ts`.
</Note>

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
  <Accordion title="Environment variable aliases">
    OpenClaw розпізнає як `RUNWAYML_API_SECRET` (канонічну), так і `RUNWAY_API_KEY`.
    Будь-яка з цих змінних автентифікує провайдер Runway.
  </Accordion>

  <Accordion title="Task polling">
    Runway використовує API на основі завдань. Після надсилання запиту на генерацію OpenClaw
    опитує `GET /v1/tasks/{id}`, доки відео не буде готове. Для поведінки опитування
    не потрібна додаткова конфігурація.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Video generation" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента, вибір провайдера та асинхронна поведінка.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Параметри агента за замовчуванням, зокрема модель генерації відео.
  </Card>
</CardGroup>
