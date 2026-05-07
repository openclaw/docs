---
read_when:
    - Ви хочете використовувати перетворення тексту на мовлення ElevenLabs в OpenClaw
    - Вам потрібне перетворення мовлення на текст ElevenLabs Scribe для аудіовкладень
    - Вам потрібна транскрипція ElevenLabs у реальному часі для голосового виклику або Google Meet
summary: Використовуйте мовлення ElevenLabs, Scribe STT і транскрипцію в реальному часі з OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T15:12:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw використовує ElevenLabs для перетворення тексту на мовлення, пакетного перетворення мовлення на текст за допомогою Scribe
v2 і потокового STT за допомогою Scribe v2 Realtime.

| Можливість               | Поверхня OpenClaw                                                     | Типово                  |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Перетворення тексту на мовлення           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Пакетне перетворення мовлення на текст     | `tools.media.audio`                                                  | `scribe_v2`              |
| Потокове перетворення мовлення на текст | Потокове передавання Голосового виклику або Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Автентифікація

Встановіть `ELEVENLABS_API_KEY` у середовищі. `XI_API_KEY` також приймається для
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

Встановіть `modelId` на `eleven_v3`, щоб використовувати ElevenLabs v3 TTS. OpenClaw залишає
`eleven_multilingual_v2` типовим варіантом для наявних інсталяцій.

Голосові канали Discord використовують потоковий кінцевий пункт TTS ElevenLabs, коли ElevenLabs є
вибраним провайдером `voice.tts`/`messages.tts`. Відтворення починається з
повернутого аудіопотоку замість очікування, доки OpenClaw спочатку завантажить і запише
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
`model_id: "scribe_v2"`. Підказки мови зіставляються з `language_code`, якщо вони присутні.

## Потокове STT

Вбудований Plugin `elevenlabs` реєструє Scribe v2 Realtime для потокової транскрипції
в агентському режимі Голосового виклику та Google Meet.

| Налаштування         | Шлях конфігурації                                                               | Типово                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API-ключ         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Повертається до `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Модель           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Аудіоформат    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
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
Голосовий виклик отримує медіа Twilio як 8 кГц G.711 u-law. Провайдер ElevenLabs realtime
типово використовує `ulaw_8000`, тому телефонні кадри можна пересилати без
перекодування.
</Note>

Для агентського режиму Google Meet встановіть
`plugins.entries.google-meet.config.realtime.transcriptionProvider` на
`"elevenlabs"` і налаштуйте той самий блок провайдера в
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Пов’язане

- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Google Meet](/uk/plugins/google-meet)
- [Вибір моделі](/uk/concepts/model-providers)
