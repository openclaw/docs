---
read_when:
    - Chcesz używać ElevenLabs text-to-speech w OpenClaw
    - Chcesz używać ElevenLabs Scribe speech-to-text dla załączników audio
    - Chcesz używać transkrypcji ElevenLabs w czasie rzeczywistym dla Voice Call
summary: Używaj ElevenLabs Speech, Scribe STT i transkrypcji w czasie rzeczywistym z OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T09:27:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw używa ElevenLabs do text-to-speech, wsadowego speech-to-text z Scribe
v2 oraz strumieniowego STT Voice Call z Scribe v2 Realtime.

| Capability               | OpenClaw surface                              | Default                  |
| ------------------------ | --------------------------------------------- | ------------------------ |
| Text-to-speech           | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Batch speech-to-text     | `tools.media.audio`                           | `scribe_v2`              |
| Streaming speech-to-text | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Uwierzytelnianie

Ustaw `ELEVENLABS_API_KEY` w środowisku. `XI_API_KEY` jest również akceptowane dla
zgodności z istniejącymi narzędziami ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-to-speech

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

## Speech-to-text

Używaj Scribe v2 do przychodzących załączników audio i krótkich nagranych segmentów głosowych:

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

OpenClaw wysyła multipart audio do ElevenLabs `/v1/speech-to-text` z
`model_id: "scribe_v2"`. Wskazówki językowe są mapowane do `language_code`, gdy są obecne.

## Strumieniowy STT Voice Call

Dołączony Plugin `elevenlabs` rejestruje Scribe v2 Realtime do
strumieniowej transkrypcji Voice Call.

| Setting         | Config path                                                               | Default                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Klucz API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Wraca do `ELEVENLABS_API_KEY` / `XI_API_KEY`      |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Częstotliwość próbkowania | `...elevenlabs.sampleRate`                                      | `8000`                                            |
| Strategia commit | `...elevenlabs.commitStrategy`                                           | `vad`                                             |
| Język           | `...elevenlabs.languageCode`                                              | (nieustawione)                                    |

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
Voice Call odbiera multimedia Twilio jako 8 kHz G.711 u-law. Dostawca realtime ElevenLabs
domyślnie używa `ulaw_8000`, więc ramki telefoniczne mogą być przekazywane dalej bez
transkodowania.
</Note>

## Powiązane

- [Text-to-speech](/pl/tools/tts)
- [Wybór modelu](/pl/concepts/model-providers)
