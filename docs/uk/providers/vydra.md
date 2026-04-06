---
read_when:
    - Ви хочете генерацію медіа Vydra в OpenClaw
    - Вам потрібні вказівки з налаштування ключа API Vydra
summary: Використовуйте зображення, відео та мовлення Vydra в OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-06T18:49:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24006a687ed6f9792e7b2b10927cc7ad71c735462a92ce03d5fa7c2b2ee2fcc2
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

Вбудований плагін Vydra додає:

- генерацію зображень через `vydra/grok-imagine`
- генерацію відео через `vydra/veo3` і `vydra/kling`
- синтез мовлення через маршрут TTS Vydra на базі ElevenLabs

OpenClaw використовує один і той самий `VYDRA_API_KEY` для всіх трьох можливостей.

## Важлива базова URL-адреса

Використовуйте `https://www.vydra.ai/api/v1`.

Аpex-хост Vydra (`https://vydra.ai/api/v1`) наразі перенаправляє на `www`. Деякі HTTP-клієнти скидають `Authorization` під час такого перенаправлення між хостами, через що дійсний ключ API перетворюється на оманливу помилку автентифікації. Вбудований плагін використовує базову URL-адресу `www` напряму, щоб уникнути цього.

## Налаштування

Інтерактивне онбординг-налаштування:

```bash
openclaw onboard --auth-choice vydra-api-key
```

Або встановіть змінну середовища напряму:

```bash
export VYDRA_API_KEY="vydra_live_..."
```

## Генерація зображень

Типова модель зображень:

- `vydra/grok-imagine`

Зробіть її типовим постачальником зображень:

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

Поточна вбудована підтримка охоплює лише генерацію зображень із тексту. Хостовані маршрути редагування Vydra очікують віддалені URL-адреси зображень, а OpenClaw поки що не додає у вбудований плагін місток завантаження, специфічний для Vydra.

Див. [Генерація зображень](/uk/tools/image-generation) для спільної поведінки інструмента.

## Генерація відео

Зареєстровані моделі відео:

- `vydra/veo3` для генерації відео з тексту
- `vydra/kling` для генерації відео із зображення

Зробіть Vydra типовим постачальником відео:

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

- `vydra/veo3` у вбудованому вигляді підтримує лише генерацію відео з тексту.
- `vydra/kling` наразі вимагає посилання на віддалену URL-адресу зображення. Завантаження локальних файлів одразу відхиляються.
- Поточний HTTP-маршрут `kling` у Vydra працює непослідовно щодо того, чи вимагає він `image_url` або `video_url`; вбудований провайдер підставляє ту саму віддалену URL-адресу зображення в обидва поля.
- Вбудований плагін дотримується консервативного підходу й не передає недокументовані параметри стилю, як-от співвідношення сторін, роздільна здатність, водяний знак або згенерований звук.

Специфічне для провайдера live-покриття:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_VYDRA_VIDEO=1 \
pnpm test:live -- extensions/vydra/vydra.live.test.ts
```

Тепер вбудований live-файл Vydra охоплює:

- `vydra/veo3` для генерації відео з тексту
- `vydra/kling` для генерації відео із зображення з використанням віддаленої URL-адреси зображення

За потреби перевизначте фікстуру віддаленого зображення:

```bash
export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
```

Див. [Генерація відео](/uk/tools/video-generation) для спільної поведінки інструмента.

## Синтез мовлення

Налаштуйте Vydra як провайдера мовлення:

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

Типові значення:

- model: `elevenlabs/tts`
- voice id: `21m00Tcm4TlvDq8ikWAM`

Вбудований плагін наразі надає один перевірений типовий голос і повертає аудіофайли MP3.

## Пов’язане

- [Каталог провайдерів](/uk/providers/index)
- [Генерація зображень](/uk/tools/image-generation)
- [Генерація відео](/uk/tools/video-generation)
