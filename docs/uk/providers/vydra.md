---
read_when:
    - Вам потрібна генерація медіа Vydra в OpenClaw
    - Вам потрібні вказівки з налаштування API-ключа Vydra
summary: Використовуйте зображення, відео та мовлення Vydra в OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-05-06T00:20:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

Комплектний Vydra Plugin додає:

- Генерацію зображень через `vydra/grok-imagine`
- Генерацію відео через `vydra/veo3` і `vydra/kling`
- Синтез мовлення через TTS-маршрут Vydra на базі ElevenLabs

OpenClaw використовує той самий `VYDRA_API_KEY` для всіх трьох можливостей.

| Властивість        | Значення                                                                  |
| ------------------ | ------------------------------------------------------------------------- |
| Ідентифікатор провайдера | `vydra`                                                            |
| Plugin             | комплектний, `enabledByDefault: true`                                     |
| Змінна env для автентифікації | `VYDRA_API_KEY`                                                |
| Прапорець онбордингу | `--auth-choice vydra-api-key`                                           |
| Прямий прапорець CLI | `--vydra-api-key <key>`                                                 |
| Контракти          | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Базова URL-адреса  | `https://www.vydra.ai/api/v1` (використовуйте хост `www`)                 |

<Warning>
  Використовуйте `https://www.vydra.ai/api/v1` як базову URL-адресу. Apex-хост Vydra (`https://vydra.ai/api/v1`) наразі переспрямовує на `www`. Деякі HTTP-клієнти скидають `Authorization` під час такого міжхостового переспрямування, через що дійсний ключ API виглядає як оманлива помилка автентифікації. Комплектний Plugin використовує базову URL-адресу `www` напряму, щоб уникнути цього.
</Warning>

## Налаштування

<Steps>
  <Step title="Запустіть інтерактивний онбординг">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Або задайте змінну env напряму:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Виберіть можливість за замовчуванням">
    Виберіть одну або кілька можливостей нижче (зображення, відео або мовлення) і застосуйте відповідну конфігурацію.
  </Step>
</Steps>

## Можливості

<AccordionGroup>
  <Accordion title="Генерація зображень">
    Модель зображень за замовчуванням:

    - `vydra/grok-imagine`

    Задайте її як провайдера зображень за замовчуванням:

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

    Поточна комплектна підтримка охоплює лише перетворення тексту на зображення. Розміщені у Vydra маршрути редагування очікують віддалені URL-адреси зображень, а OpenClaw поки не додає специфічний для Vydra міст завантаження в комплектному Plugin.

    <Note>
    Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку відмовостійкості.
    </Note>

  </Accordion>

  <Accordion title="Генерація відео">
    Зареєстровані відеомоделі:

    - `vydra/veo3` для перетворення тексту на відео
    - `vydra/kling` для перетворення зображення на відео

    Задайте Vydra як провайдера відео за замовчуванням:

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

    - `vydra/veo3` комплектується лише для перетворення тексту на відео.
    - `vydra/kling` наразі потребує посилання на віддалену URL-адресу зображення. Завантаження локальних файлів відхиляються одразу.
    - Поточний HTTP-маршрут `kling` у Vydra був непослідовним щодо того, чи потребує він `image_url`, чи `video_url`; комплектний провайдер відображає ту саму віддалену URL-адресу зображення в обидва поля.
    - Комплектний Plugin залишається консервативним і не передає недокументовані параметри стилю, як-от співвідношення сторін, роздільну здатність, водяний знак або згенероване аудіо.

    <Note>
    Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку відмовостійкості.
    </Note>

  </Accordion>

  <Accordion title="Live-тести відео">
    Специфічне для провайдера live-покриття:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Комплектний live-файл Vydra тепер охоплює:

    - перетворення тексту на відео `vydra/veo3`
    - перетворення зображення на відео `vydra/kling` з використанням віддаленої URL-адреси зображення

    За потреби перевизначте віддалену фікстуру зображення:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Синтез мовлення">
    Задайте Vydra як провайдера мовлення:

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
    - Ідентифікатор голосу: `21m00Tcm4TlvDq8ikWAM`

    Комплектний Plugin наразі надає один перевірений голос за замовчуванням і повертає аудіофайли MP3.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Каталог провайдерів" href="/uk/providers/index" icon="list">
    Перегляньте всі доступні провайдери.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента для зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента для відео і вибір провайдера.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Значення агентів за замовчуванням і конфігурація моделей.
  </Card>
</CardGroup>
