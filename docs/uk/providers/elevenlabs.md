---
read_when:
    - Ви хочете текст-у-мовлення ElevenLabs в OpenClaw
    - Ви хочете перетворення мовлення на текст ElevenLabs Scribe для аудіовкладень
    - Ви хочете транскрипцію ElevenLabs у реальному часі для Voice Call
summary: Використовуйте мовлення ElevenLabs, Scribe STT і транскрипцію в реальному часі з OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T09:09:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw використовує ElevenLabs для перетворення тексту на мовлення, пакетного перетворення мовлення на текст із Scribe
v2 і потокового STT Voice Call із Scribe v2 Realtime.

| Можливість               | Поверхня OpenClaw                              | За замовчуванням         |
| ------------------------ | ---------------------------------------------- | ------------------------ |
| Перетворення тексту на мовлення | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Пакетне перетворення мовлення на текст     | `tools.media.audio`                           | `scribe_v2`              |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Автентифікація

Установіть `ELEVENLABS_API_KEY` у середовищі. `XI_API_KEY` також підтримується для
сумісності з наявними інструментами ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Перетворення тексту на мовлення

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Установіть `modelId` на `eleven_v3`, щоб використовувати ElevenLabs v3 TTS. OpenClaw зберігає
`eleven_multilingual_v2` як значення за замовчуванням для наявних інсталяцій.

## Перетворення мовлення на текст

Використовуйте Scribe v2 для вхідних аудіовкладень і коротких записаних голосових сегментів:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw надсилає multipart-аудіо до ElevenLabs `/v1/speech-to-text` з
`model_id: "scribe_v2"`. Підказки мови зіставляються з `language_code`, якщо вони задані.

## Потокове STT Voice Call

Вбудований Plugin `elevenlabs` реєструє Scribe v2 Realtime для потокової
транскрипції Voice Call.

| Налаштування         | Шлях конфігурації                                                               | За замовчуванням                                  |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| API-ключ             | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`       | Резервно використовує `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Модель               | `...elevenlabs.modelId`                                                         | `scribe_v2_realtime`                              |
| Формат аудіо         | `...elevenlabs.audioFormat`                                                     | `ulaw_8000`                                       |
| Частота дискретизації     | `...elevenlabs.sampleRate`                                                      | `8000`                                            |
| Стратегія коміту     | `...elevenlabs.commitStrategy`                                                  | `vad`                                             |
| Мова                 | `...elevenlabs.languageCode`                                                    | (не задано)                                       |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call отримує медіапотік Twilio як 8 кГц G.711 u-law. Провайдер ElevenLabs realtime
за замовчуванням використовує `ulaw_8000`, тому телекомунікаційні фрейми можна пересилати без
транскодування.
</Note>

## Пов’язане

- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Вибір моделі](/uk/concepts/model-providers)
