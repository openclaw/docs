---
read_when:
    - Вам потрібне перетворення тексту на мовлення ElevenLabs в OpenClaw
    - Вам потрібен ElevenLabs Scribe для перетворення мовлення на текст для аудіовкладень
    - Вам потрібна транскрипція в реальному часі від ElevenLabs для голосового дзвінка або Google Meet
summary: Використовуйте мовлення ElevenLabs, Scribe STT і транскрипцію в реальному часі з OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-27T18:10:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw використовує ElevenLabs для перетворення тексту на мовлення, пакетного перетворення мовлення на текст за допомогою Scribe
v2 і потокового STT за допомогою Scribe v2 Realtime.

| Можливість               | Поверхня OpenClaw                                                     | Типово                  |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Перетворення тексту на мовлення           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Пакетне перетворення мовлення на текст     | `tools.media.audio`                                                  | `scribe_v2`              |
| Потокове перетворення мовлення на текст | Потокова передача Voice Call або Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Автентифікація

Установіть `ELEVENLABS_API_KEY` у середовищі. `XI_API_KEY` також приймається для
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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Установіть `modelId` на `eleven_v3`, щоб використовувати ElevenLabs v3 TTS. OpenClaw залишає
`eleven_multilingual_v2` типовим значенням для наявних інсталяцій.

Голосові канали Discord використовують потокову кінцеву точку TTS ElevenLabs, коли ElevenLabs є
вибраним постачальником `voice.tts`/`messages.tts`. Відтворення починається з
поверненого аудіопотоку, замість того щоб чекати, доки OpenClaw спершу завантажить і запише
весь аудіофайл. `latencyTier` зіставляється з параметром запиту ElevenLabs
`optimize_streaming_latency` для моделей, які його приймають; OpenClaw
пропускає цей параметр для `eleven_v3`, яка його відхиляє.

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
`model_id: "scribe_v2"`. Підказки мови зіставляються з `language_code`, якщо вони наявні.

## Потокове STT

Вбудований Plugin `elevenlabs` реєструє Scribe v2 Realtime для Voice Call і
потокової транскрипції в режимі агента Google Meet.

| Налаштування         | Шлях конфігурації                                                               | Типово                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Ключ API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Повертається до `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Модель           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Формат аудіо    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Частота дискретизації     | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Стратегія фіксації | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Мова        | `...elevenlabs.languageCode`                                              | (не встановлено)                                           |

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
Voice Call отримує медіа Twilio як 8 кГц G.711 u-law. Постачальник ElevenLabs realtime
типово використовує `ulaw_8000`, тож телефонні кадри можна пересилати без
транскодування.
</Note>

Для режиму агента Google Meet установіть
`plugins.entries.google-meet.config.realtime.transcriptionProvider` на
`"elevenlabs"` і налаштуйте той самий блок постачальника в
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Пов’язане

- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Google Meet](/uk/plugins/google-meet)
- [Вибір моделі](/uk/concepts/model-providers)
