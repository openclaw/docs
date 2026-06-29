---
read_when:
    - Вы хотите использовать генерацию изображений fal в OpenClaw
    - Вам нужен поток аутентификации FAL_KEY
    - Вам нужны значения по умолчанию fal для image_generate, video_generate или music_generate
summary: Настройка генерации изображений, видео и музыки fal в OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-28T23:36:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw поставляется со встроенным провайдером `fal` для размещенной генерации
изображений, видео и музыки.

| Свойство       | Значение                                                      |
| -------------- | ------------------------------------------------------------- |
| Провайдер      | `fal`                                                         |
| Аутентификация | `FAL_KEY` (канонический; `FAL_API_KEY` также работает как fallback) |
| API            | эндпоинты моделей fal                                         |

## Начало работы

<Steps>
  <Step title="Задайте API-ключ">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Задайте модель изображений по умолчанию">
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

## Генерация изображений

Встроенный провайдер генерации изображений `fal` по умолчанию использует
`fal/fal-ai/flux/dev`.

| Возможность      | Значение                                                           |
| ---------------- | ------------------------------------------------------------------ |
| Макс. изображений | 4 на запрос; Krea 2: 1 на запрос                                  |
| Режим редактирования | Flux: 1 референсное изображение; GPT Image 2: 10; Nano Banana 2: 14 |
| Референсы стиля  | Krea 2: до 10 референсов стиля через `image` / `images`            |
| Переопределения размера | Поддерживаются                                               |
| Соотношение сторон | Поддерживается для генерации, Krea 2 и редактирования GPT Image 2/Nano Banana 2 |
| Разрешение       | Поддерживается                                                     |
| Формат вывода    | `png` или `jpeg`                                                   |

<Warning>
Запросы Flux image-to-image **не** поддерживают переопределения `aspectRatio`.
Запросы редактирования GPT Image 2 и Nano Banana 2 используют эндпоинт `/edit`
fal и принимают подсказки по соотношению сторон. Nano Banana 2 также принимает
дополнительные нативные широкие/высокие соотношения, такие как `4:1`, `1:4`,
`8:1` и `1:8`; Krea 2 проверяет собственное, более узкое подмножество
соотношений сторон.
</Warning>

Модели Krea 2 используют нативную схему payload Krea в fal. OpenClaw отправляет
`aspect_ratio`, `creativity` и `image_style_references` вместо универсального
`image_size` / payload эндпоинта редактирования, используемого Flux. Рефы моделей:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Используйте Medium для более быстрой выразительной иллюстрации, аниме, живописи
и художественных стилей. Используйте Large для более медленных фотореалистичных
результатов, сырой текстуры, зерна пленки и детализированного вида. Для Krea по
умолчанию используется `fal.creativity: "medium"`; поддерживаемые значения:
`raw`, `low`, `medium` и `high`.

Krea 2 предоставляет в схеме запросов fal соотношение сторон, а не `image_size`.
Предпочитайте `aspectRatio`; OpenClaw сопоставляет `size` с ближайшим
поддерживаемым соотношением сторон Krea и отклоняет `resolution` для Krea, а не
отбрасывает его.

Используйте `outputFormat: "png"`, когда нужен PNG-вывод от моделей fal, которые
предоставляют `output_format`. fal не объявляет в OpenClaw явного управления
прозрачным фоном, поэтому `background: "transparent"` сообщается как
проигнорированное переопределение для моделей fal.
Эндпоинты Krea 2 не предоставляют поле запроса `output_format` через fal, поэтому
OpenClaw отклоняет переопределения `outputFormat` для запросов Krea.

Чтобы использовать fal как провайдер изображений по умолчанию:

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

Чтобы использовать Krea 2 Medium:

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

## Генерация видео

Встроенный провайдер генерации видео `fal` по умолчанию использует
`fal/fal-ai/minimax/video-01-live`.

| Возможность | Значение                                                           |
| ----------- | ------------------------------------------------------------------ |
| Режимы      | Text-to-video, референс с одним изображением, Seedance reference-to-video |
| Среда выполнения | Поток submit/status/result на базе очереди для долго выполняющихся заданий |

<AccordionGroup>
  <Accordion title="Доступные видеомодели">
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

  <Accordion title="Пример конфигурации Seedance 2.0">
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

  <Accordion title="Пример конфигурации Seedance 2.0 reference-to-video">
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

    Reference-to-video принимает до 9 изображений, 3 видео и 3 аудиореференсов
    через общие параметры `video_generate` `images`, `videos` и `audioRefs`,
    но не более 12 референсных файлов всего.

  </Accordion>

  <Accordion title="Пример конфигурации HeyGen video-agent">
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

## Генерация музыки

Встроенный Plugin `fal` также регистрирует провайдер генерации музыки для общего
инструмента `music_generate`.

| Возможность       | Значение                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| Модель по умолчанию | `fal/fal-ai/minimax-music/v2.6`                                                                      |
| Модели            | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Среда выполнения  | Синхронный запрос плюс загрузка сгенерированного аудио                                                 |

Используйте fal как провайдер музыки по умолчанию:

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

`fal-ai/minimax-music/v2.6` поддерживает явный текст песен и инструментальный
режим. ACE-Step и Stable Audio — это эндпоинты prompt-to-audio; выбирайте их с
переопределением `model`, когда нужны эти семейства моделей.

<Tip>
Используйте `openclaw models list --provider fal`, чтобы увидеть полный список
доступных моделей fal, включая недавно добавленные записи.
</Tip>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Генерация изображений" href="/ru/tools/image-generation" icon="image">
    Общие параметры инструмента изображений и выбор провайдера.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента видео и выбор провайдера.
  </Card>
  <Card title="Генерация музыки" href="/ru/tools/music-generation" icon="music">
    Общие параметры инструмента музыки и выбор провайдера.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/config-agents#agent-defaults" icon="gear">
    Значения агента по умолчанию, включая выбор моделей изображений, видео и музыки.
  </Card>
</CardGroup>
