---
read_when:
    - Chcesz używać Deepgram speech-to-text dla załączników audio
    - Chcesz używać transkrypcji strumieniowej Deepgram dla Voice Call
    - Potrzebujesz szybkiego przykładu konfiguracji Deepgram
summary: Transkrypcja Deepgram dla przychodzących notatek głosowych
title: Deepgram
x-i18n:
    generated_at: "2026-04-25T13:56:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Deepgram to API speech-to-text. W OpenClaw jest używane do transkrypcji
przychodzącego audio/notatek głosowych przez `tools.media.audio` oraz do
strumieniowego STT Voice Call przez `plugins.entries.voice-call.config.streaming`.

W przypadku transkrypcji wsadowej OpenClaw przesyła cały plik audio do Deepgram
i wstrzykuje transkrypt do potoku odpowiedzi (`{{Transcript}}` +
blok `[Audio]`). W przypadku strumieniowego Voice Call OpenClaw przekazuje na żywo ramki G.711
u-law przez endpoint WebSocket `listen` Deepgram i emituje transkrypty częściowe albo
końcowe, gdy Deepgram je zwraca.

| Szczegół      | Wartość                                                    |
| ------------- | ---------------------------------------------------------- |
| Strona WWW    | [deepgram.com](https://deepgram.com)                       |
| Dokumentacja  | [developers.deepgram.com](https://developers.deepgram.com) |
| Uwierzytelnianie | `DEEPGRAM_API_KEY`                                      |
| Model domyślny | `nova-3`                                                  |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Dodaj klucz API Deepgram do środowiska:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Włącz providera audio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Wyślij notatkę głosową">
    Wyślij wiadomość audio przez dowolny połączony kanał. OpenClaw transkrybuje ją
    przez Deepgram i wstrzykuje transkrypt do potoku odpowiedzi.
  </Step>
</Steps>

## Opcje konfiguracji

| Opcja            | Ścieżka                                                       | Opis                                  |
| ---------------- | ------------------------------------------------------------- | ------------------------------------- |
| `model`          | `tools.media.audio.models[].model`                            | Identyfikator modelu Deepgram (domyślnie: `nova-3`) |
| `language`       | `tools.media.audio.models[].language`                         | Wskazówka języka (opcjonalnie)        |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Włącz wykrywanie języka (opcjonalnie) |
| `punctuate`      | `tools.media.audio.providerOptions.deepgram.punctuate`        | Włącz interpunkcję (opcjonalnie)      |
| `smart_format`   | `tools.media.audio.providerOptions.deepgram.smart_format`     | Włącz inteligentne formatowanie (opcjonalnie) |

<Tabs>
  <Tab title="Ze wskazówką języka">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Z opcjami Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Strumieniowe STT Voice Call

Dołączony Plugin `deepgram` rejestruje również providera transkrypcji w czasie rzeczywistym
dla Plugin Voice Call.

| Ustawienie      | Ścieżka konfiguracji                                                   | Domyślnie                         |
| --------------- | ---------------------------------------------------------------------- | --------------------------------- |
| Klucz API       | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Fallback do `DEEPGRAM_API_KEY`    |
| Model           | `...deepgram.model`                                                    | `nova-3`                          |
| Język           | `...deepgram.language`                                                 | (nieustawione)                    |
| Kodowanie       | `...deepgram.encoding`                                                 | `mulaw`                           |
| Częstotliwość próbkowania | `...deepgram.sampleRate`                                     | `8000`                            |
| Endpointing     | `...deepgram.endpointingMs`                                            | `800`                             |
| Wyniki pośrednie | `...deepgram.interimResults`                                          | `true`                            |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
Voice Call odbiera dźwięk telefoniczny jako 8 kHz G.711 u-law. Provider
strumieniowy Deepgram domyślnie używa `encoding: "mulaw"` i `sampleRate: 8000`, więc
ramki multimedialne Twilio mogą być przekazywane bezpośrednio.
</Note>

## Uwagi

<AccordionGroup>
  <Accordion title="Uwierzytelnianie">
    Uwierzytelnianie przebiega według standardowej kolejności uwierzytelniania providera. `DEEPGRAM_API_KEY` to
    najprostsza ścieżka.
  </Accordion>
  <Accordion title="Proxy i własne endpointy">
    Nadpisz endpointy lub nagłówki przez `tools.media.audio.baseUrl` i
    `tools.media.audio.headers`, gdy używasz proxy.
  </Accordion>
  <Accordion title="Zachowanie wyjścia">
    Wyjście podlega tym samym zasadom audio co u innych providerów (limity rozmiaru, timeouty,
    wstrzykiwanie transkryptu).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Narzędzia multimedialne" href="/pl/tools/media-overview" icon="photo-film">
    Przegląd potoku przetwarzania audio, obrazów i wideo.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji, w tym ustawienia narzędzi multimedialnych.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
  <Card title="FAQ" href="/pl/help/faq" icon="circle-question">
    Najczęściej zadawane pytania dotyczące konfiguracji OpenClaw.
  </Card>
</CardGroup>
