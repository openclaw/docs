---
read_when:
    - Ви хочете використовувати ElevenLabs для перетворення тексту на мовлення в OpenClaw
    - Ви хочете використовувати ElevenLabs Scribe для перетворення мовлення на текст для аудіовкладень
    - Ви хочете використовувати ElevenLabs для транскрибування в реальному часі у Voice Call
summary: Використовуйте мовлення ElevenLabs, Scribe STT і транскрибування в реальному часі з OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T21:05:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 477e779dadf92a35e37bfdec417480591f73b9e6c0c9b197d44af8a8060196b3
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw використовує ElevenLabs для перетворення тексту на мовлення, пакетного перетворення мовлення на текст із Scribe
v2 і потокового STT Voice Call із Scribe v2 Realtime.

| Capability               | OpenClaw surface                              | Default                  |
| ------------------------ | --------------------------------------------- | ------------------------ |
| Перетворення тексту на мовлення | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Пакетне перетворення мовлення на текст | `tools.media.audio`                           | `scribe_v2`              |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

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

OpenClaw надсилає multipart-audio до ElevenLabs `/v1/speech-to-text` з
`model_id: "scribe_v2"`. Підказки щодо мови зіставляються з `language_code`, коли вони присутні.

## Потокове STT для Voice Call

Bundled Plugin `elevenlabs` реєструє Scribe v2 Realtime для
потокового транскрибування Voice Call.

| Setting         | Config path                                                               | Default                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Повертається до `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Audio format    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Sample rate     | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Commit strategy | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Language        | `...elevenlabs.languageCode`                                              | (не задано)                                       |

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
Voice Call отримує медіа Twilio як 8 kHz G.711 u-law. Провайдер realtime ElevenLabs
типово використовує `ulaw_8000`, тож telephony frames можна пересилати без
перекодування.
</Note>
