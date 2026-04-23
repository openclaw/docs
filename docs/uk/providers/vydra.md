---
read_when:
    - Ви хочете використовувати генерацію медіа Vydra в OpenClaw
    - Вам потрібні вказівки з налаштування API key Vydra
summary: Використовуйте Vydra для зображень, відео та мовлення в OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-23T21:08:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d08480a223ebd5edcdb8dbea92ee0039f0f21535ab3fcd279133da16a5a0489
    source_path: providers/vydra.md
    workflow: 15
---

Bundled Plugin Vydra додає:

- Генерацію зображень через `vydra/grok-imagine`
- Генерацію відео через `vydra/veo3` і `vydra/kling`
- Синтез мовлення через маршрут TTS Vydra на основі ElevenLabs

OpenClaw використовує той самий `VYDRA_API_KEY` для всіх трьох можливостей.

<Warning>
Використовуйте `https://www.vydra.ai/api/v1` як base URL.

Apex host Vydra (`https://vydra.ai/api/v1`) зараз перенаправляє на `www`. Деякі HTTP-клієнти скидають `Authorization` під час такого redirect на інший host, що перетворює чинний API key на оманливу помилку auth. Bundled Plugin використовує base URL `www` безпосередньо, щоб цього уникнути.
</Warning>

## Налаштування

<Steps>
  <Step title="Запустіть інтерактивний onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Або задайте env var напряму:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Виберіть типову можливість">
    Виберіть одну або кілька з наведених нижче можливостей (image, video або speech) і застосуйте відповідну конфігурацію.
  </Step>
</Steps>

## Можливості

<AccordionGroup>
  <Accordion title="Генерація зображень">
    Типова модель зображень:

    - `vydra/grok-imagine`

    Задайте її як типового provider-а зображень:

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

    Поточна bundled-підтримка охоплює лише text-to-image. Hosted-маршрути редагування Vydra очікують віддалені URL зображень, а OpenClaw поки що не додає в bundled Plugin специфічний для Vydra міст для upload.

    <Note>
    Див. [Image Generation](/uk/tools/image-generation) щодо спільних параметрів tool-а, вибору provider-а та поведінки failover.
    </Note>

  </Accordion>

  <Accordion title="Генерація відео">
    Зареєстровані відеомоделі:

    - `vydra/veo3` для text-to-video
    - `vydra/kling` для image-to-video

    Задайте Vydra як типового provider-а відео:

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

    - `vydra/veo3` bundled лише як text-to-video.
    - `vydra/kling` наразі потребує посилання на віддалений URL зображення. Завантаження локальних файлів відхиляються одразу.
    - Поточний HTTP-маршрут `kling` у Vydra непослідовний щодо того, чи потрібен `image_url`, чи `video_url`; bundled provider зіставляє той самий віддалений URL зображення з обома полями.
    - Bundled Plugin дотримується консервативного підходу і не передає недокументовані параметри стилю, такі як aspect ratio, resolution, watermark або згенероване audio.

    <Note>
    Див. [Video Generation](/uk/tools/video-generation) щодо спільних параметрів tool-а, вибору provider-а та поведінки failover.
    </Note>

  </Accordion>

  <Accordion title="Live-тести відео">
    Live-покриття, специфічне для provider-а:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Bundled live-файл Vydra тепер охоплює:

    - `vydra/veo3` text-to-video
    - `vydra/kling` image-to-video з використанням віддаленого URL зображення

    За потреби перевизначайте fixture віддаленого зображення:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Синтез мовлення">
    Задайте Vydra як provider мовлення:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Значення за замовчуванням:

    - Модель: `elevenlabs/tts`
    - Voice id: `21m00Tcm4TlvDq8ikWAM`

    Наразі bundled Plugin надає один перевірений типовий голос і повертає MP3-аудіофайли.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Каталог provider-ів" href="/uk/providers/index" icon="list">
    Перегляньте всі доступні provider-и.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри image tool-а та вибір provider-а.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри video tool-а та вибір provider-а.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference#agent-defaults" icon="gear">
    Типові параметри агентів і конфігурація моделей.
  </Card>
</CardGroup>
