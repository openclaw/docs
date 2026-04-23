---
read_when:
    - Ви хочете використовувати ElevenLabs для перетворення тексту на мовлення в OpenClaw
    - Ви хочете використовувати ElevenLabs Scribe для перетворення мовлення на текст для аудіовкладень
    - Ви хочете використовувати транскрипцію в реальному часі ElevenLabs для Voice Call
summary: Використовуйте мовлення ElevenLabs, Scribe STT і транскрипцію в реальному часі з OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T02:13:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

OpenClaw використовує ElevenLabs для перетворення тексту на мовлення, пакетного перетворення мовлення на текст за допомогою Scribe
v2 та потокового STT для голосових дзвінків за допомогою Scribe v2 Realtime.

| Можливість               | Поверхня OpenClaw                               | Типове значення         |
| ------------------------ | ----------------------------------------------- | ----------------------- |
| Перетворення тексту на мовлення | `messages.tts` / `talk`                         | `eleven_multilingual_v2` |
| Пакетне перетворення мовлення на текст | `tools.media.audio`                             | `scribe_v2`             |
| Потокове перетворення мовлення на текст | Голосовий дзвінок `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`    |

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

## Потокове STT для голосових дзвінків

Вбудований plugin `elevenlabs` реєструє Scribe v2 Realtime для потокової транскрипції
голосових дзвінків.

| Налаштування   | Шлях конфігурації                                                        | Типове значення                                  |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| API-ключ       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Повертається до `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Модель         | `...elevenlabs.modelId`                                                  | `scribe_v2_realtime`                             |
| Формат аудіо   | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                      |
| Частота дискретизації | `...elevenlabs.sampleRate`                                        | `8000`                                           |
| Стратегія commit | `...elevenlabs.commitStrategy`                                         | `vad`                                            |
| Мова           | `...elevenlabs.languageCode`                                             | (не задано)                                      |

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
Voice Call отримує медіа Twilio у форматі 8 кГц G.711 u-law. Провайдер ElevenLabs realtime
типово використовує `ulaw_8000`, тому кадри телефонії можна пересилати без
транскодування.
</Note>
