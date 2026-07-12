---
read_when:
    - Chcesz korzystać z syntezy mowy ElevenLabs w OpenClaw
    - Chcesz używać zamiany mowy na tekst ElevenLabs Scribe dla załączników audio
    - Chcesz transkrypcję w czasie rzeczywistym ElevenLabs dla połączenia głosowego lub Google Meet
summary: Korzystaj z syntezy mowy ElevenLabs, Scribe STT i transkrypcji w czasie rzeczywistym z OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T15:34:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw używa ElevenLabs do syntezy mowy z tekstu, wsadowego rozpoznawania mowy za pomocą Scribe
v2 oraz strumieniowego rozpoznawania mowy za pomocą Scribe v2 Realtime. Plugin jest dołączony i
domyślnie włączony; krok `plugins install` nie jest potrzebny.

| Funkcja                         | Obszar OpenClaw                                                       | Wartość domyślna         |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------ |
| Synteza mowy z tekstu           | `messages.tts` / `talk`                                               | `eleven_multilingual_v2` |
| Wsadowe rozpoznawanie mowy      | `tools.media.audio`                                                   | `scribe_v2`              |
| Strumieniowe rozpoznawanie mowy | Strumieniowanie Voice Call lub `realtime.transcriptionProvider` w Google Meet | `scribe_v2_realtime`     |

## Uwierzytelnianie

Ustaw `ELEVENLABS_API_KEY` w środowisku. Ze względu na zgodność z istniejącymi
narzędziami ElevenLabs akceptowany jest również `XI_API_KEY`.

```bash
export ELEVENLABS_API_KEY="..."
```

## Synteza mowy z tekstu

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

Ustaw `modelId` na `eleven_v3`, aby używać syntezy mowy ElevenLabs v3. W istniejących
instalacjach OpenClaw zachowuje `eleven_multilingual_v2` jako wartość domyślną.

Gdy ElevenLabs jest wybranym dostawcą `voice.tts`/`messages.tts`, kanały głosowe Discord
korzystają z jego strumieniowego punktu końcowego syntezy mowy: odtwarzanie rozpoczyna się
zwracanym strumieniem audio, zamiast czekać, aż OpenClaw najpierw pobierze cały
plik audio. `latencyTier` jest odwzorowywany na parametr zapytania
`optimize_streaming_latency` usługi ElevenLabs w przypadku modeli, które go obsługują;
OpenClaw pomija ten parametr dla `eleven_v3`, który go odrzuca.

## Rozpoznawanie mowy

Użyj Scribe v2 do przychodzących załączników audio i krótkich nagranych fragmentów głosowych:

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

OpenClaw wysyła wieloczęściowe dane audio do punktu końcowego ElevenLabs `/v1/speech-to-text`
z wartością `model_id: "scribe_v2"`. Jeśli podano wskazówki dotyczące języka, są one
odwzorowywane na `language_code`.

## Strumieniowe rozpoznawanie mowy

Dołączony Plugin `elevenlabs` rejestruje Scribe v2 Realtime na potrzeby strumieniowej
transkrypcji w Voice Call oraz w trybie agenta Google Meet.

| Ustawienie             | Ścieżka konfiguracji                                                       | Wartość domyślna                                      |
| ---------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| Klucz API              | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`  | Używa zastępczo `ELEVENLABS_API_KEY` / `XI_API_KEY`   |
| Model                  | `...elevenlabs.modelId`                                                    | `scribe_v2_realtime`                                  |
| Format audio           | `...elevenlabs.audioFormat`                                                | `ulaw_8000`                                           |
| Częstotliwość próbkowania | `...elevenlabs.sampleRate`                                              | `8000`                                                |
| Strategia zatwierdzania | `...elevenlabs.commitStrategy`                                            | `vad`                                                 |
| Język                  | `...elevenlabs.languageCode`                                               | (nie ustawiono)                                       |

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
Voice Call odbiera multimedia Twilio jako dźwięk G.711 u-law o częstotliwości 8 kHz. Dostawca
usługi czasu rzeczywistego ElevenLabs domyślnie używa `ulaw_8000`, dzięki czemu ramki
telefoniczne mogą być przekazywane bez transkodowania.
</Note>

W trybie agenta Google Meet ustaw
`plugins.entries.google-meet.config.realtime.transcriptionProvider` na
`"elevenlabs"` i skonfiguruj ten sam blok dostawcy w
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Powiązane materiały

- [Synteza mowy z tekstu](/pl/tools/tts)
- [Google Meet](/pl/plugins/google-meet)
- [Wybór modelu](/pl/concepts/model-providers)
