---
read_when:
    - Ви хочете генерацію медіа Vydra в OpenClaw
    - Вам потрібні вказівки з налаштування API-ключа Vydra
summary: Використовуйте зображення, відео та мовлення Vydra в OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-06-27T18:15:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

Вбудований Plugin Vydra додає:

- Генерацію зображень через `vydra/grok-imagine`
- Генерацію відео через `vydra/veo3` і `vydra/kling`
- Синтез мовлення через маршрут TTS Vydra на базі ElevenLabs

OpenClaw використовує той самий `VYDRA_API_KEY` для всіх трьох можливостей.

| Властивість                | Значення                                                                  |
| -------------------------- | ------------------------------------------------------------------------- |
| Ідентифікатор постачальника | `vydra`                                                                   |
| Plugin                     | вбудований, `enabledByDefault: true`                                      |
| Змінна середовища автентифікації | `VYDRA_API_KEY`                                                           |
| Прапорець онбордингу       | `--auth-choice vydra-api-key`                                             |
| Прямий прапорець CLI       | `--vydra-api-key <key>`                                                   |
| Контракти                  | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Базова URL-адреса          | `https://www.vydra.ai/api/v1` (використовуйте хост `www`)                 |

<Warning>
  Використовуйте `https://www.vydra.ai/api/v1` як базову URL-адресу. Apex-хост Vydra (`https://vydra.ai/api/v1`) зараз переспрямовує на `www`. Деякі HTTP-клієнти скидають `Authorization` під час такого міжхостового переспрямування, через що чинний API-ключ перетворюється на оманливу помилку автентифікації. Вбудований plugin використовує базову URL-адресу `www` напряму, щоб уникнути цього.
</Warning>

## Налаштування

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Або задайте змінну середовища напряму:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    Виберіть одну або кілька можливостей нижче (зображення, відео або мовлення) і застосуйте відповідну конфігурацію.
  </Step>
</Steps>

## Можливості

<AccordionGroup>
  <Accordion title="Image generation">
    Типова модель зображень:

    - `vydra/grok-imagine`

    Установіть її як типового постачальника зображень:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    Поточна вбудована підтримка охоплює лише перетворення тексту на зображення. Розміщені маршрути редагування Vydra очікують віддалені URL-адреси зображень, а OpenClaw поки що не додає міст завантаження, специфічний для Vydra, у вбудованому plugin.

    <Note>
    Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору постачальника та поведінки перемикання після збою.
    </Note>

  </Accordion>

  <Accordion title="Video generation">
    Зареєстровані відеомоделі:

    - `vydra/veo3` для перетворення тексту на відео
    - `vydra/kling` для перетворення зображення на відео

    Установіть Vydra як типового постачальника відео:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Примітки:

    - `vydra/veo3` вбудовано лише як перетворення тексту на відео.
    - `vydra/kling` наразі потребує посилання на віддалену URL-адресу зображення. Завантаження локальних файлів відхиляються заздалегідь.
    - Поточний HTTP-маршрут `kling` у Vydra був непослідовним щодо того, чи вимагає він `image_url`, чи `video_url`; вбудований постачальник відображає ту саму віддалену URL-адресу зображення в обидва поля.
    - Вбудований plugin залишається консервативним і не передає недокументовані параметри стилю, як-от співвідношення сторін, роздільна здатність, водяний знак або згенероване аудіо.

    <Note>
    Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору постачальника та поведінки перемикання після збою.
    </Note>

  </Accordion>

  <Accordion title="Video live tests">
    Live-покриття, специфічне для постачальника:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Вбудований live-файл Vydra тепер охоплює:

    - перетворення тексту на відео `vydra/veo3`
    - перетворення зображення на відео `vydra/kling` із використанням віддаленої URL-адреси зображення

    За потреби перевизначте віддалений тестовий ресурс зображення:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Speech synthesis">
    Установіть Vydra як постачальника мовлення:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Типові значення:

    - Модель: `elevenlabs/tts`
    - Ідентифікатор голосу: `21m00Tcm4TlvDq8ikWAM`

    Вбудований plugin наразі надає один перевірений типовий голос і повертає аудіофайли MP3.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Provider directory" href="/uk/providers/index" icon="list">
    Перегляньте всіх доступних постачальників.
  </Card>
  <Card title="Image generation" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір постачальника.
  </Card>
  <Card title="Video generation" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір постачальника.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Типові значення агентів і конфігурація моделей.
  </Card>
</CardGroup>
