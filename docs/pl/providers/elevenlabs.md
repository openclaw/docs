---
read_when:
    - Chcesz używać syntezy mowy ElevenLabs w OpenClaw
    - Chcesz używać ElevenLabs Scribe do zamiany mowy na tekst w załącznikach audio
    - Chcesz korzystać z transkrypcji ElevenLabs w czasie rzeczywistym dla połączeń głosowych lub Google Meet
summary: Korzystaj z syntezy mowy ElevenLabs, Scribe STT i transkrypcji w czasie rzeczywistym z OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T13:24:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw używa ElevenLabs do zamiany tekstu na mowę, wsadowej zamiany mowy na tekst za pomocą Scribe
v2 oraz strumieniowego STT za pomocą Scribe v2 Realtime.

| Funkcja                  | Powierzchnia OpenClaw                                                | Domyślne                 |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Zamiana tekstu na mowę   | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Wsadowa zamiana mowy na tekst | `tools.media.audio`                                                  | `scribe_v2`              |
| Strumieniowa zamiana mowy na tekst | strumieniowanie Voice Call lub Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Uwierzytelnianie

Ustaw `ELEVENLABS_API_KEY` w środowisku. `XI_API_KEY` jest także akceptowany dla
zgodności z istniejącymi narzędziami ElevenLabs.

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

Ustaw `modelId` na `eleven_v3`, aby użyć ElevenLabs v3 TTS. OpenClaw zachowuje
`eleven_multilingual_v2` jako domyślną wartość dla istniejących instalacji.

Kanały głosowe Discord używają strumieniowego punktu końcowego TTS ElevenLabs, gdy ElevenLabs jest
wybranym dostawcą `voice.tts`/`messages.tts`. Odtwarzanie zaczyna się od
zwróconego strumienia audio, zamiast czekać, aż OpenClaw najpierw pobierze i zapisze
cały plik audio. `latencyTier` mapuje się na parametr zapytania ElevenLabs
`optimize_streaming_latency` dla modeli, które go akceptują; OpenClaw
pomija ten parametr dla `eleven_v3`, który go odrzuca.

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

Dołączony Plugin `elevenlabs` rejestruje Scribe v2 Realtime dla strumieniowej transkrypcji
Voice Call i Google Meet w trybie agenta.

| Ustawienie      | Ścieżka konfiguracji                                                    | Domyślne                                          |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Klucz API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Używa zastępczo `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Częstotliwość próbkowania | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Strategia zatwierdzania | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
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
Voice Call odbiera multimedia Twilio jako 8 kHz G.711 u-law. Dostawca czasu rzeczywistego
ElevenLabs domyślnie używa `ulaw_8000`, więc ramki telefoniczne mogą być przekazywane bez
transkodowania.
</Note>

W trybie agenta Google Meet ustaw
`plugins.entries.google-meet.config.realtime.transcriptionProvider` na
`"elevenlabs"` i skonfiguruj ten sam blok dostawcy pod
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Powiązane

- [Zamiana tekstu na mowę](/pl/tools/tts)
- [Google Meet](/pl/plugins/google-meet)
- [Wybór modelu](/pl/concepts/model-providers)
