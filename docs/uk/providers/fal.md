---
read_when:
    - Ви хочете використовувати генерацію зображень fal в OpenClaw
    - Вам потрібен потік автентифікації FAL_KEY
    - Вам потрібні типові налаштування fal для image_generate, video_generate або music_generate
summary: Налаштування генерації зображень, відео та музики fal в OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:10:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw постачається з вбудованим провайдером `fal` для хостингової генерації зображень, відео та музики.

| Властивість | Значення                                                     |
| ----------- | ------------------------------------------------------------ |
| Провайдер   | `fal`                                                        |
| Автентифікація | `FAL_KEY` (канонічний; `FAL_API_KEY` також працює як fallback) |
| API         | кінцеві точки моделей fal                                    |

## Початок роботи

<Steps>
  <Step title="Установіть ключ API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Установіть стандартну модель зображень">
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

| Можливість       | Значення                                                           |
| ---------------- | ------------------------------------------------------------------ |
| Макс. зображень  | 4 на запит; Krea 2: 1 на запит                                     |
| Режим редагування | Flux: 1 еталонне зображення; GPT Image 2: 10; Nano Banana 2: 14    |
| Еталони стилю    | Krea 2: до 10 еталонів стилю через `image` / `images`              |
| Перевизначення розміру | Підтримується                                                     |
| Співвідношення сторін | Підтримується для generate, Krea 2, а також редагування GPT Image 2/Nano Banana 2 |
| Роздільна здатність | Підтримується                                                     |
| Формат виводу    | `png` або `jpeg`                                                   |

<Warning>
Запити Flux image-to-image **не** підтримують перевизначення `aspectRatio`. Запити
редагування GPT Image 2 і Nano Banana 2 використовують кінцеву точку fal `/edit` і приймають
підказки щодо співвідношення сторін. Nano Banana 2 також приймає додаткові нативні широкі/високі співвідношення,
як-от `4:1`, `1:4`, `8:1` і `1:8`; Krea 2 перевіряє власну меншу
підмножину співвідношень сторін.
</Warning>

Моделі Krea 2 використовують нативну схему payload Krea від fal. OpenClaw надсилає
`aspect_ratio`, `creativity` та `image_style_references` замість
загального `image_size` / payload кінцевої точки редагування, який використовує Flux. Посилання на моделі:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Використовуйте Medium для швидшої виразної ілюстрації, аніме, живопису та художніх
стилів. Використовуйте Large для повільнішого фотореалізму, сирої текстури, зернистості плівки та деталізованого
вигляду. Для Krea стандартне значення `fal.creativity`: `"medium"`; підтримувані значення:
`raw`, `low`, `medium` і `high`.

Krea 2 у схемі запиту fal надає співвідношення сторін, а не `image_size`. Віддавайте перевагу
`aspectRatio`; OpenClaw зіставляє `size` з найближчим підтримуваним співвідношенням сторін Krea
і відхиляє `resolution` для Krea замість того, щоб ігнорувати його.

Використовуйте `outputFormat: "png"`, коли потрібен PNG-вивід із моделей fal, які надають
`output_format`. fal не оголошує явного керування прозорим фоном
в OpenClaw, тому `background: "transparent"` повідомляється як проігнороване
перевизначення для моделей fal.
Кінцеві точки Krea 2 не надають поле запиту `output_format` через fal, тому
OpenClaw відхиляє перевизначення `outputFormat` для запитів Krea.

Щоб використовувати fal як стандартного провайдера зображень:

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

Щоб використовувати Krea 2 Medium:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
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
| Режими     | Text-to-video, еталон одного зображення, Seedance reference-to-video |
| Середовище виконання | Потік submit/status/result на основі черги для довготривалих завдань |

<AccordionGroup>
  <Accordion title="Доступні моделі відео">
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
    через спільні параметри `video_generate` `images`, `videos` і `audioRefs`,
    із загальною кількістю не більше 12 еталонних файлів.

  </Accordion>

  <Accordion title="Приклад конфігурації HeyGen video-agent">
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

## Генерація музики

Вбудований Plugin `fal` також реєструє провайдера генерації музики для
спільного інструмента `music_generate`.

| Можливість       | Значення                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Стандартна модель | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| Моделі           | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Середовище виконання | Синхронний запит плюс завантаження згенерованого аудіо                                                |

Використовуйте fal як стандартного провайдера музики:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` підтримує явний текст пісні та інструментальний режим.
ACE-Step і Stable Audio є кінцевими точками prompt-to-audio; вибирайте їх за допомогою
перевизначення `model`, коли потрібні ці сімейства моделей.

<Tip>
Використовуйте `openclaw models list --provider fal`, щоб переглянути повний список доступних моделей fal,
зокрема нещодавно додані записи.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики та вибір провайдера.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Стандартні налаштування агента, включно з вибором моделей зображень, відео та музики.
  </Card>
</CardGroup>
