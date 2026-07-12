---
read_when:
    - Chcesz korzystać z zamiany mowy na tekst Deepgram dla załączników audio
    - Chcesz korzystać ze strumieniowej transkrypcji Deepgram dla połączeń głosowych
    - Potrzebujesz krótkiego przykładu konfiguracji Deepgram
summary: Transkrypcja Deepgram dla przychodzących wiadomości głosowych
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T15:29:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram to interfejs API zamiany mowy na tekst. OpenClaw używa go do transkrypcji przychodzących nagrań audio i notatek głosowych za pośrednictwem `tools.media.audio` oraz do strumieniowego rozpoznawania mowy w połączeniach głosowych za pośrednictwem `plugins.entries.voice-call.config.streaming`.

Transkrypcja wsadowa przesyła cały plik audio do Deepgram i wstawia transkrypcję do potoku odpowiedzi (`{{Transcript}}` + blok `[Audio]`). Strumieniowanie połączeń głosowych przekazuje na żywo ramki G.711 u-law przez punkt końcowy WebSocket `listen` usługi Deepgram i emituje częściowe oraz końcowe transkrypcje w miarę ich zwracania przez Deepgram.

| Szczegół       | Wartość                                                    |
| -------------- | ---------------------------------------------------------- |
| Witryna        | [deepgram.com](https://deepgram.com)                       |
| Dokumentacja   | [developers.deepgram.com](https://developers.deepgram.com) |
| Uwierzytelnianie | `DEEPGRAM_API_KEY`                                       |
| Model domyślny | `nova-3`                                                   |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Włącz dostawcę obsługi audio">
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
    za pomocą Deepgram i wstawia transkrypcję do potoku odpowiedzi.
  </Step>
</Steps>

## Opcje konfiguracji

| Opcja      | Ścieżka                               | Opis                                  |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Identyfikator modelu Deepgram (domyślnie: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Wskazówka dotycząca języka (opcjonalna) |

`providerOptions.deepgram` scala dodatkowe parametry zapytania bezpośrednio z żądaniem Deepgram `/listen`, dlatego można użyć dowolnej nazwy parametru obsługiwanej przez Deepgram (na przykład `detect_language`, `punctuate`, `smart_format`):

<Tabs>
  <Tab title="Ze wskazówką dotyczącą języka">
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

## Strumieniowe rozpoznawanie mowy w połączeniach głosowych

Dołączony Plugin `deepgram` rejestruje również dostawcę transkrypcji w czasie rzeczywistym dla Pluginu połączeń głosowych.

| Ustawienie             | Ścieżka konfiguracji                                                    | Wartość domyślna                  |
| ---------------------- | ----------------------------------------------------------------------- | --------------------------------- |
| Klucz API              | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Używa zastępczo `DEEPGRAM_API_KEY` |
| Model                  | `...deepgram.model`                                                     | `nova-3`                          |
| Język                  | `...deepgram.language`                                                  | (nie ustawiono)                   |
| Kodowanie              | `...deepgram.encoding`                                                  | `mulaw`                           |
| Częstotliwość próbkowania | `...deepgram.sampleRate`                                             | `8000`                            |
| Wykrywanie końca wypowiedzi | `...deepgram.endpointingMs`                                         | `800`                             |
| Wyniki pośrednie       | `...deepgram.interimResults`                                            | `true`                            |

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
Połączenie głosowe odbiera dźwięk telefoniczny jako G.711 u-law o częstotliwości 8 kHz. Dostawca strumieniowania Deepgram używa domyślnie `encoding: "mulaw"` i `sampleRate: 8000`, dzięki czemu ramki multimedialne Twilio mogą być przekazywane bezpośrednio.
</Note>

## Uwagi

<AccordionGroup>
  <Accordion title="Uwierzytelnianie">
    Uwierzytelnianie odbywa się zgodnie ze standardową kolejnością uwierzytelniania dostawców. `DEEPGRAM_API_KEY` to najprostsze rozwiązanie.
  </Accordion>
  <Accordion title="Serwer proxy i niestandardowe punkty końcowe">
    Podczas korzystania z serwera proxy zastąp punkty końcowe lub nagłówki za pomocą `tools.media.audio.baseUrl` i `tools.media.audio.headers`.
  </Accordion>
  <Accordion title="Sposób generowania danych wyjściowych">
    Dane wyjściowe podlegają tym samym regułom obsługi audio co u innych dostawców (limity rozmiaru, limity czasu, wstawianie transkrypcji).
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Narzędzia multimedialne" href="/pl/tools/media-overview" icon="photo-film">
    Omówienie potoku przetwarzania dźwięku, obrazów i wideo.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji, w tym ustawień narzędzi multimedialnych.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki diagnostyczne.
  </Card>
  <Card title="Często zadawane pytania" href="/pl/help/faq" icon="circle-question">
    Często zadawane pytania dotyczące konfiguracji OpenClaw.
  </Card>
</CardGroup>
