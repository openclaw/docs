---
read_when:
    - Ви хочете генерувати медіа за допомогою Vydra в OpenClaw
    - Вам потрібні вказівки з налаштування ключа API Vydra
summary: Використання зображень, відео та мовлення Vydra в OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-12T13:39:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Вбудований plugin Vydra додає:

- Генерування зображень через `vydra/grok-imagine`
- Генерування відео через `vydra/veo3` (текст у відео) та `vydra/kling` (зображення у відео)
- Синтез мовлення через маршрут TTS Vydra на базі ElevenLabs

OpenClaw використовує той самий `VYDRA_API_KEY` для всіх трьох можливостей.

| Властивість                | Значення                                                                  |
| -------------------------- | ------------------------------------------------------------------------- |
| Ідентифікатор постачальника | `vydra`                                                                   |
| Plugin                     | вбудований, `enabledByDefault: true`                                       |
| Змінна середовища автентифікації | `VYDRA_API_KEY`                                                      |
| Прапорець початкового налаштування | `--auth-choice vydra-api-key`                                        |
| Прямий прапорець CLI       | `--vydra-api-key <key>`                                                    |
| Контракти                  | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Базова URL-адреса          | `https://www.vydra.ai/api/v1` (використовуйте хост `www`)                  |

<Warning>
Використовуйте `https://www.vydra.ai/api/v1` як базову URL-адресу. Кореневий хост Vydra (`https://vydra.ai/api/v1`) наразі переспрямовує на `www`. Деякі HTTP-клієнти вилучають `Authorization` під час такого переспрямування між хостами, через що дійсний ключ API спричиняє оманливу помилку автентифікації. Щоб уникнути цього, вбудований plugin нормалізує будь-яку налаштовану базову URL-адресу `vydra.ai` до `www.vydra.ai`.
</Warning>

## Налаштування

<Steps>
  <Step title="Запустіть інтерактивне початкове налаштування">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Або задайте змінну середовища безпосередньо:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Виберіть можливість за замовчуванням">
    Виберіть одну або кілька наведених нижче можливостей (зображення, відео або мовлення) і застосуйте відповідну конфігурацію.
  </Step>
</Steps>

## Можливості

<AccordionGroup>
  <Accordion title="Генерування зображень">
    Стандартна та єдина вбудована модель зображень:

    - `vydra/grok-imagine`

    Установіть її постачальником зображень за замовчуванням:

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

    Вбудована підтримка працює лише для перетворення тексту на зображення та створює щонайбільше одне зображення на запит. Розміщені у Vydra маршрути редагування очікують віддалені URL-адреси зображень, а вбудований plugin не додає спеціального для Vydra мосту завантаження.

    <Note>
    Спільні параметри інструмента, вибір постачальника та поведінку перемикання в разі відмови див. у розділі [Генерування зображень](/uk/tools/image-generation).
    </Note>

  </Accordion>

  <Accordion title="Генерування відео">
    Зареєстровані моделі відео:

    - `vydra/veo3` для перетворення тексту на відео (відхиляє вхідні посилання на зображення)
    - `vydra/kling` для перетворення зображення на відео (потребує рівно одну віддалену URL-адресу зображення)

    Установіть Vydra постачальником відео за замовчуванням:

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

    - `vydra/kling` одразу відхиляє завантаження локальних файлів; працює лише посилання на віддалену URL-адресу зображення.
    - HTTP-маршрут `kling` у Vydra непослідовно визначав, чи потребує він `image_url` або `video_url`; вбудований постачальник надсилає ту саму віддалену URL-адресу зображення в обох полях.
    - Вбудований plugin дотримується консервативного підходу й не передає недокументовані параметри стилю, як-от співвідношення сторін, роздільна здатність, водяний знак або згенерований звук.

    <Note>
    Спільні параметри інструмента, вибір постачальника та поведінку перемикання в разі відмови див. у розділі [Генерування відео](/uk/tools/video-generation).
    </Note>

  </Accordion>

  <Accordion title="Живі тести відео">
    Живе тестове покриття для конкретного постачальника:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Вбудований файл живих тестів Vydra охоплює:

    - перетворення тексту на відео за допомогою `vydra/veo3`
    - перетворення зображення на відео за допомогою `vydra/kling` із використанням віддаленої URL-адреси зображення

    За потреби перевизначте віддалений тестовий ресурс зображення:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Синтез мовлення">
    Установіть Vydra постачальником мовлення:

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
    - Ідентифікатор голосу: `21m00Tcm4TlvDq8ikWAM` («Rachel»)

    Вбудований plugin надає цей один перевірений голос за замовчуванням і повертає аудіофайли MP3.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Каталог постачальників" href="/uk/providers/index" icon="list">
    Перегляньте всіх доступних постачальників.
  </Card>
  <Card title="Генерування зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента для зображень і вибір постачальника.
  </Card>
  <Card title="Генерування відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента для відео та вибір постачальника.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Стандартні параметри агента та конфігурація моделі.
  </Card>
</CardGroup>
