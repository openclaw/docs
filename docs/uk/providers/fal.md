---
read_when:
    - Ви хочете використовувати генерацію зображень fal в OpenClaw
    - Вам потрібен потік автентифікації FAL_KEY
    - Вам потрібні типові значення fal для `image_generate` або `video_generate`
summary: Налаштування генерації зображень і відео fal в OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-26T01:43:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw постачається з вбудованим провайдером `fal` для хостованої генерації зображень і відео.

| Властивість | Значення                                                     |
| ----------- | ------------------------------------------------------------ |
| Провайдер   | `fal`                                                        |
| Автентифікація | `FAL_KEY` (канонічний; `FAL_API_KEY` також працює як резервний варіант) |
| API         | кінцеві точки моделей fal                                    |

## Початок роботи

<Steps>
  <Step title="Встановіть API-ключ">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Установіть типову модель зображень">
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

Вбудований провайдер генерації зображень `fal` типово використовує
`fal/fal-ai/flux/dev`.

| Можливість      | Значення                   |
| --------------- | -------------------------- |
| Максимум зображень | 4 на запит              |
| Режим редагування | Увімкнено, 1 еталонне зображення |
| Перевизначення розміру | Підтримується        |
| Співвідношення сторін | Підтримується         |
| Роздільна здатність | Підтримується          |
| Формат виводу   | `png` або `jpeg`           |

<Warning>
Кінцева точка редагування зображень fal **не** підтримує перевизначення `aspectRatio`.
</Warning>

Використовуйте `outputFormat: "png"`, якщо вам потрібен вивід у форматі PNG. fal не оголошує
явний параметр керування прозорим фоном в OpenClaw, тому `background:
"transparent"` для моделей fal позначається як проігнороване перевизначення.

Щоб використовувати fal як типовий провайдер зображень:

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

Вбудований провайдер генерації відео `fal` типово використовує
`fal/fal-ai/minimax/video-01-live`.

| Можливість | Значення                                                            |
| ---------- | ------------------------------------------------------------------- |
| Режими     | Текст у відео, еталон за одним зображенням, Seedance reference-to-video |
| Виконання  | Потік submit/status/result на основі черги для довготривалих завдань |

<AccordionGroup>
  <Accordion title="Доступні моделі відео">
    **Відеоагент HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Приклад конфігурації Seedance 2.0">
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

  <Accordion title="Приклад конфігурації Seedance 2.0 reference-to-video">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Reference-to-video приймає до 9 зображень, 3 відео та 3 аудіоеталонів
    через спільні параметри `images`, `videos` і `audioRefs` інструмента `video_generate`,
    із максимумом 12 еталонних файлів загалом.

  </Accordion>

  <Accordion title="Приклад конфігурації відеоагента HeyGen">
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
Використовуйте `openclaw models list --provider fal`, щоб побачити повний список доступних моделей fal,
зокрема всі нещодавно додані записи.
</Tip>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="Довідник з конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Типові значення агента, зокрема вибір моделей зображень і відео.
  </Card>
</CardGroup>
