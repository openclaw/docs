---
read_when:
    - Chcesz używać syntezy mowy ElevenLabs w OpenClaw
    - Chcesz korzystać z ElevenLabs Scribe do transkrypcji mowy na tekst dla załączników audio
    - Chcesz transkrypcji w czasie rzeczywistym ElevenLabs dla Voice Call lub Google Meet
summary: Używaj mowy ElevenLabs, Scribe STT i transkrypcji w czasie rzeczywistym z OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-27T18:11:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw używa ElevenLabs do zamiany tekstu na mowę, wsadowej zamiany mowy na tekst za pomocą Scribe
v2 oraz strumieniowego STT za pomocą Scribe v2 Realtime.

| Możliwość                | Interfejs OpenClaw                                                    | Domyślne                 |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Zamiana tekstu na mowę   | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Wsadowa zamiana mowy na tekst | `tools.media.audio`                                                  | `scribe_v2`              |
| Strumieniowa zamiana mowy na tekst | Strumieniowanie Voice Call lub Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Uwierzytelnianie

Ustaw `ELEVENLABS_API_KEY` w środowisku. `XI_API_KEY` jest również akceptowany w celu
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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Ustaw `modelId` na `eleven_v3`, aby użyć ElevenLabs v3 TTS. OpenClaw zachowuje
`eleven_multilingual_v2` jako wartość domyślną dla istniejących instalacji.

Kanały głosowe Discord używają strumieniowego punktu końcowego TTS ElevenLabs, gdy ElevenLabs jest
wybranym dostawcą `voice.tts`/`messages.tts`. Odtwarzanie rozpoczyna się ze
zwróconego strumienia audio zamiast czekać, aż OpenClaw najpierw pobierze i zapisze
cały plik audio. `latencyTier` mapuje się na parametr zapytania ElevenLabs
`optimize_streaming_latency` dla modeli, które go obsługują; OpenClaw
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
`model_id: "scribe_v2"`. Wskazówki językowe mapują się na `language_code`, gdy są obecne.

## Strumieniowe STT

Dołączony Plugin `elevenlabs` rejestruje Scribe v2 Realtime dla strumieniowej transkrypcji w trybie agenta
Voice Call i Google Meet.

| Ustawienie      | Ścieżka konfiguracji                                                    | Domyślne                                         |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Klucz API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Wraca do `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Częstotliwość próbkowania | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Strategia zatwierdzania | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Język           | `...elevenlabs.languageCode`                                              | (nie ustawiono)                                   |

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
ElevenLabs domyślnie używa `ulaw_8000`, więc ramki telefoniczne można przekazywać bez
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
