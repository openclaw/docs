---
read_when:
    - Ви хочете використовувати генерацію зображень fal в OpenClaw
    - Вам потрібен потік автентифікації FAL_KEY
    - Вам потрібні стандартні налаштування fal для image_generate або video_generate
summary: Налаштування генерації зображень і відео fal в OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:54:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw постачається з вбудованим провайдером `fal` для хостингової генерації зображень і відео.

| Властивість | Значення                                                      |
| -------- | ------------------------------------------------------------- |
| Провайдер | `fal`                                                         |
| Автентифікація | `FAL_KEY` (канонічний; `FAL_API_KEY` також працює як резервний варіант) |
| API      | кінцеві точки моделей fal                                     |

## Початок роботи

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Set a default image model">
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

Вбудований провайдер генерації зображень `fal` за замовчуванням використовує
`fal/fal-ai/flux/dev`.

| Можливість     | Значення                                                    |
| -------------- | ----------------------------------------------------------- |
| Максимум зображень | 4 на запит                                              |
| Режим редагування | Flux: 1 еталонне зображення; GPT Image 2: 10; Nano Banana 2: 14 |
| Перевизначення розміру | Підтримується                                      |
| Співвідношення сторін | Підтримується для генерації та редагування GPT Image 2/Nano Banana 2 |
| Роздільна здатність | Підтримується                                        |
| Формат виводу  | `png` або `jpeg`                                            |

<Warning>
Запити Flux image-to-image **не** підтримують перевизначення `aspectRatio`. Запити редагування GPT
Image 2 і Nano Banana 2 використовують кінцеву точку fal `/edit` і приймають
підказки щодо співвідношення сторін.
</Warning>

Використовуйте `outputFormat: "png"`, коли потрібен вивід у PNG. fal не оголошує
явного керування прозорим тлом в OpenClaw, тому `background:
"transparent"` повідомляється як проігнороване перевизначення для моделей fal.

Щоб використовувати fal як провайдера зображень за замовчуванням:

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

Вбудований провайдер генерації відео `fal` за замовчуванням використовує
`fal/fal-ai/minimax/video-01-live`.

| Можливість | Значення                                                           |
| ---------- | ------------------------------------------------------------------ |
| Режими     | Текст-у-відео, еталон за одним зображенням, Seedance еталон-у-відео |
| Середовище виконання | Потік submit/status/result на основі черги для довготривалих завдань |

<AccordionGroup>
  <Accordion title="Available video models">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 config example">
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

  <Accordion title="Seedance 2.0 reference-to-video config example">
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
    через спільні параметри `video_generate` `images`, `videos` і `audioRefs`,
    із максимум 12 еталонними файлами загалом.

  </Accordion>

  <Accordion title="HeyGen video-agent config example">
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
Використовуйте `openclaw models list --provider fal`, щоб переглянути повний список доступних моделей fal,
включно з будь-якими нещодавно доданими записами.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Image generation" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Video generation" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Значення агентів за замовчуванням, включно з вибором моделі зображень і відео.
  </Card>
</CardGroup>
