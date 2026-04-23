---
read_when:
    - Ви хочете використовувати генерацію зображень fal в OpenClaw
    - Вам потрібен потік автентифікації `FAL_KEY`
    - Вам потрібні типові значення fal для `image_generate` або `video_generate`
summary: Налаштування генерації зображень і відео fal в OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-23T21:06:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08863a147cfe9ea2af492b7898471037d9072730b4b7e4089be0afc35e3fd752
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw постачається з вбудованим provider-ом `fal` для хостованої генерації зображень і відео.

| Властивість | Значення                                                      |
| ----------- | ------------------------------------------------------------- |
| Provider    | `fal`                                                         |
| Auth        | `FAL_KEY` (канонічний; `FAL_API_KEY` також працює як fallback) |
| API         | endpoint-и моделей fal                                        |

## Початок роботи

<Steps>
  <Step title="Задайте API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Задайте типову image-модель">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Генерація зображень

Вбудований provider генерації зображень `fal` типово використовує
`fal/fal-ai/flux/dev`.

| Можливість      | Значення                   |
| --------------- | -------------------------- |
| Макс. зображень | 4 на запит                 |
| Режим редагування | Увімкнено, 1 reference image |
| Перевизначення size | Підтримується           |
| Aspect ratio    | Підтримується              |
| Resolution      | Підтримується              |

<Warning>
Endpoint редагування зображень fal **не** підтримує перевизначення `aspectRatio`.
</Warning>

Щоб використовувати fal як типового image provider-а:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Генерація відео

Вбудований provider генерації відео `fal` типово використовує
`fal/fal-ai/minimax/video-01-live`.

| Можливість | Значення                                                        |
| ---------- | --------------------------------------------------------------- |
| Режими     | Текст-у-відео, reference за одним зображенням                   |
| Runtime    | Потік submit/status/result на основі черги для довготривалих завдань |

<AccordionGroup>
  <Accordion title="Доступні video-моделі">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Приклад config для Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Приклад config для HeyGen video-agent">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
Використовуйте `openclaw models list --provider fal`, щоб побачити повний список доступних моделей fal, включно з будь-якими нещодавно доданими записами.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри image-інструмента та вибір provider-а.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри video-інструмента та вибір provider-а.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference#agent-defaults" icon="gear">
    Типові значення агента, включно з вибором image- і video-моделей.
  </Card>
</CardGroup>
