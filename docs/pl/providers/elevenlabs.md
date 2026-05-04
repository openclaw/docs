---
read_when:
    - Chcesz korzystać z zamiany tekstu na mowę ElevenLabs w OpenClaw
    - Chcesz używać ElevenLabs Scribe do transkrypcji mowy na tekst dla załączników audio
    - Chcesz transkrypcji ElevenLabs w czasie rzeczywistym dla połączenia głosowego lub Google Meet
summary: Korzystaj z syntezy mowy ElevenLabs, Scribe STT i transkrypcji w czasie rzeczywistym w OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T07:05:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw używa ElevenLabs do zamiany tekstu na mowę, wsadowej zamiany mowy na tekst z użyciem Scribe
v2 oraz strumieniowego STT z użyciem Scribe v2 Realtime.

| Możliwość               | Powierzchnia OpenClaw                                                 | Domyślne                 |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Zamiana tekstu na mowę   | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Wsadowa zamiana mowy na tekst | `tools.media.audio`                                             | `scribe_v2`              |
| Strumieniowa zamiana mowy na tekst | strumieniowanie Voice Call lub Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Uwierzytelnianie

Ustaw `ELEVENLABS_API_KEY` w środowisku. `XI_API_KEY` jest również akceptowany ze względu na
zgodność z istniejącymi narzędziami ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Zamiana tekstu na mowę

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

Ustaw `modelId` na `eleven_v3`, aby używać ElevenLabs v3 TTS. OpenClaw zachowuje
`eleven_multilingual_v2` jako wartość domyślną dla istniejących instalacji.

## Zamiana mowy na tekst

Użyj Scribe v2 dla przychodzących załączników audio i krótkich nagranych segmentów głosowych:

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

OpenClaw wysyła wieloczęściowe audio do ElevenLabs `/v1/speech-to-text` z
`model_id: "scribe_v2"`. Wskazówki językowe są mapowane na `language_code`, gdy są obecne.

## Strumieniowe STT

Dołączony Plugin `elevenlabs` rejestruje Scribe v2 Realtime dla strumieniowej transkrypcji Voice Call oraz
Google Meet w trybie agenta.

| Ustawienie      | Ścieżka konfiguracji                                                   | Domyślne                                          |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Klucz API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Wraca do `ELEVENLABS_API_KEY` / `XI_API_KEY`      |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Częstotliwość próbkowania | `...elevenlabs.sampleRate`                                       | `8000`                                            |
| Strategia zatwierdzania | `...elevenlabs.commitStrategy`                                     | `vad`                                             |
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
Voice Call odbiera multimedia Twilio jako 8 kHz G.711 u-law. Dostawca ElevenLabs realtime
domyślnie używa `ulaw_8000`, więc ramki telefoniczne mogą być przekazywane bez
transkodowania.
</Note>

W trybie agenta Google Meet ustaw
`plugins.entries.google-meet.config.realtime.transcriptionProvider` na
`"elevenlabs"` i skonfiguruj ten sam blok dostawcy w
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Powiązane

- [Zamiana tekstu na mowę](/pl/tools/tts)
- [Google Meet](/pl/plugins/google-meet)
- [Wybór modelu](/pl/concepts/model-providers)
