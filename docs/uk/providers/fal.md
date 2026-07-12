---
read_when:
    - Ви хочете використовувати генерацію зображень fal в OpenClaw
    - Вам потрібен процес автентифікації FAL_KEY
    - Вам потрібні типові налаштування fal для image_generate, video_generate або music_generate
summary: налаштування генерації зображень, відео та музики за допомогою fal в OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-12T13:36:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw постачається з вбудованим провайдером `fal` для хмарної генерації зображень, відео та музики.

| Властивість | Значення                                                                         |
| ----------- | -------------------------------------------------------------------------------- |
| Провайдер   | `fal`                                                                            |
| Автентифікація | `FAL_KEY` (основний; `FAL_API_KEY` також працює як резервний варіант)          |
| API         | кінцеві точки моделей fal (`https://fal.run`; відеозавдання використовують `https://queue.fal.run`) |
| Базова URL-адреса | Перевизначається за допомогою `models.providers.fal.baseUrl`                |

## Початок роботи

<Steps>
  <Step title="Установіть ключ API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    Для неінтерактивного налаштування можна передати `--fal-api-key <key>` або експортувати `FAL_KEY`.
    Під час початкового налаштування також установлюється `fal/fal-ai/flux/dev` як модель зображень за замовчуванням, якщо
    жодної моделі не налаштовано.

  </Step>
  <Step title="Установіть модель зображень за замовчуванням">
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

Вбудований провайдер `fal` для генерації зображень за замовчуванням використовує
`fal/fal-ai/flux/dev`.

| Можливість          | Значення                                                           |
| ------------------- | ------------------------------------------------------------------ |
| Максимум зображень  | 4 на запит; Krea 2: 1 на запит                                    |
| Перевизначення розміру | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024` |
| Співвідношення сторін | Підтримується всюди, крім перетворення зображення на зображення у Flux |
| Роздільна здатність | `1K`, `2K`, `4K` (обмеження для кожної моделі наведено нижче)      |
| Формат виведення    | `png` (за замовчуванням) або `jpeg`; Krea 2 відхиляє перевизначення `outputFormat` |

Запити на редагування (еталонні зображення через спільні параметри `image` / `images`)
спрямовуються до окремої кінцевої точки редагування для кожної моделі з відповідними обмеженнями кількості еталонів:

| Сімейство моделей        | Посилання на модель після `fal/`       | Кінцева точка редагування | Максимум еталонних зображень |
| ------------------------ | -------------------------------------- | ------------------------- | ---------------------------- |
| Flux та інші моделі fal  | `fal-ai/flux/dev` (за замовчуванням)   | `/image-to-image`         | 1                            |
| GPT Image                | `openai/gpt-image-*`                   | `/edit`                   | 10                           |
| Grok Imagine             | `xai/grok-imagine-image`               | `/edit`                   | 3                            |
| Nano Banana (застаріла)  | `fal-ai/nano-banana`                   | `/edit`                   | 3                            |
| Nano Banana 2            | `fal-ai/nano-banana-*`                 | `/edit`                   | 14                           |
| Nano Banana 2 Lite       | `google/nano-banana-2-lite`            | `/edit`                   | 14                           |
| Krea 2                   | `krea/v2/{medium,large}/text-to-image` | немає (еталони стилю)     | 10 еталонів стилю            |

<Warning>
Запити Flux на перетворення зображення на зображення **не** підтримують перевизначення `aspectRatio`. Запити на редагування GPT
Image і Nano Banana 2 використовують кінцеву точку `/edit` fal і приймають
підказки щодо співвідношення сторін. Nano Banana 2 також приймає додаткові надширокі й надвисокі співвідношення,
як-от `4:1`, `1:4`, `8:1` і `1:8`; Krea 2 перевіряє власну вужчу
підмножину співвідношень сторін. Grok Imagine має власний список співвідношень (зокрема `2:1`,
`20:9`, `19.5:9` та обернені до них) і приймає лише роздільні здатності `1K`/`2K`;
застаріла Nano Banana та Nano Banana 2 Lite відхиляють перевизначення `resolution`.
</Warning>

Моделі Krea 2 використовують нативну схему корисного навантаження Krea від fal. OpenClaw надсилає
`aspect_ratio`, `creativity` та `image_style_references` замість
універсального корисного навантаження `image_size` / кінцевої точки редагування, яке використовує Flux. Посилання на моделі:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Використовуйте Medium для швидшого створення виразних ілюстрацій, аніме, живопису та художніх
стилів. Використовуйте Large для повільнішого створення фотореалістичних зображень, необроблених текстур, зернистості плівки та деталізованого
вигляду. За замовчуванням Krea використовує `fal.creativity: "medium"`; підтримувані значення:
`raw`, `low`, `medium` і `high`.

У схемі запиту fal Krea 2 надає співвідношення сторін, а не `image_size`. Віддавайте перевагу
`aspectRatio`; OpenClaw зіставляє `size` з найближчим підтримуваним співвідношенням сторін Krea
і відхиляє `resolution` для Krea, а не ігнорує його.

Використовуйте `outputFormat: "png"`, якщо потрібне виведення у форматі PNG із моделей fal, які надають
`output_format`. fal не оголошує в OpenClaw явного засобу керування прозорим тлом,
тому `background: "transparent"` повідомляється як проігнороване перевизначення для моделей fal.
Кінцеві точки Krea 2 не надають поле запиту `output_format` через fal, тому
OpenClaw відхиляє перевизначення `outputFormat` для запитів Krea.

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

Вбудований провайдер `fal` для генерації відео за замовчуванням використовує
`fal/fal-ai/minimax/video-01-live`.

| Можливість     | Значення                                                           |
| -------------- | ------------------------------------------------------------------ |
| Режими         | Текст у відео, одне еталонне зображення, еталони у відео Seedance |
| Виконання      | Потік надсилання, перевірки стану й отримання результату через чергу для тривалих завдань |
| Час очікування | За замовчуванням 20 хвилин на завдання; стан перевіряється кожні 5 секунд |

<AccordionGroup>
  <Accordion title="Доступні моделі відео">
    **MiniMax (за замовчуванням):**

    - `fal/fal-ai/minimax/video-01-live`

    **Відеоагент HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling і Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    Запити MiniMax Live і HeyGen надсилають лише підказку та необов’язкове
    одне еталонне зображення; інші перевизначення не передаються. Моделі Seedance
    приймають `aspectRatio`, `size`, `resolution`, тривалість від 4 до 15 секунд і
    перемикач аудіо.

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

  <Accordion title="Приклад конфігурації перетворення еталонів у відео в Seedance 2.0">
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

    Перетворення еталонів у відео приймає до 9 зображень, 3 відео та 3 аудіоеталонів
    через спільні параметри `images`, `videos` і `audioRefs` інструмента `video_generate`,
    але не більше 12 еталонних файлів загалом. Для аудіоеталонів потрібен
    принаймні один еталон зображення або відео в тому самому запиті.

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

## Генерація музики

Вбудований plugin `fal` також реєструє провайдер генерації музики для
спільного інструмента `music_generate`.

| Можливість             | Значення                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Модель за замовчуванням | `fal/fal-ai/minimax-music/v2.6`                                                                                         |
| Моделі                 | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| Максимальна тривалість | 240 секунд                                                                                                               |
| Виконання              | Синхронний запит із подальшим завантаженням згенерованого аудіо                                                          |

Щоб використовувати fal як провайдер музики за замовчуванням:

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

`fal-ai/minimax-music/v2.6` підтримує явно заданий текст пісні та інструментальний режим,
але не обидва в одному запиті. ACE-Step і Stable Audio є кінцевими точками
перетворення підказки на аудіо; вибирайте їх за допомогою перевизначення `model`, коли потрібні
ці сімейства моделей. ACE-Step відхиляє явно заданий текст пісні; Stable Audio відхиляє
і текст пісні, і інструментальний режим.

<Tip>
У таблицях і розділах-акордеонах вище описано сімейства моделей, для яких вбудований провайдер fal
має спеціальну обробку. Інші ідентифікатори кінцевих точок зображень fal також можна вибрати як
модель зображень; вони обробляються так само, як Flux (універсальне корисне навантаження `image_size`, одне
еталонне зображення через `/image-to-image`).
</Tip>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео й вибір провайдера.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики й вибір провайдера.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Стандартні налаштування агента, зокрема вибір моделей зображень, відео та музики.
  </Card>
</CardGroup>
