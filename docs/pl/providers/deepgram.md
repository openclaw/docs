---
read_when:
    - Potrzebna jest transkrypcja mowy na tekst za pomocą Deepgram dla załączników audio
    - Chcesz używać strumieniowej transkrypcji Deepgram w połączeniach głosowych
    - Potrzebny jest szybki przykład konfiguracji Deepgram
summary: Transkrypcja Deepgram dla przychodzących wiadomości głosowych
title: Deepgram
x-i18n:
    generated_at: "2026-07-16T19:03:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram to interfejs API zamiany mowy na tekst. OpenClaw używa go do transkrypcji przychodzących wiadomości audio/notatek głosowych
za pośrednictwem `tools.media.audio` oraz do strumieniowego STT połączeń głosowych
za pośrednictwem `plugins.entries.voice-call.config.streaming`.

Transkrypcja wsadowa przesyła kompletny plik audio do Deepgram i wprowadza
transkrypcję do potoku odpowiedzi (blok `{{Transcript}}` + `[Audio]`).
Strumieniowanie połączeń głosowych przekazuje na żywo ramki G.711 u-law przez punkt końcowy
WebSocket `listen` Deepgram i emituje częściowe/końcowe transkrypcje w miarę ich
zwracania przez Deepgram.

| Szczegół      | Wartość                                                    |
| ------------- | ---------------------------------------------------------- |
| Witryna       | [deepgram.com](https://deepgram.com)                       |
| Dokumentacja  | [developers.deepgram.com](https://developers.deepgram.com) |
| Uwierzytelnianie | `DEEPGRAM_API_KEY`                                      |
| Model domyślny | `nova-3`                                        |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Włącz dostawcę audio">
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
    za pomocą Deepgram i wprowadza transkrypcję do potoku odpowiedzi.
  </Step>
</Steps>

## Opcje konfiguracji

| Opcja      | Ścieżka                               | Opis                                  |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Identyfikator modelu Deepgram (domyślnie: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Wskazówka dotycząca języka (opcjonalna) |

`providerOptions.deepgram` scala dodatkowe parametry zapytania bezpośrednio z
żądaniem `/listen` Deepgram, dlatego działa każda nazwa parametru obsługiwana przez Deepgram
(na przykład `detect_language`, `punctuate`, `smart_format`):

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

## Strumieniowe STT połączeń głosowych

Dołączony Plugin `deepgram` rejestruje również dostawcę transkrypcji w czasie rzeczywistym
dla Pluginu połączeń głosowych.

| Ustawienie      | Ścieżka konfiguracji                                                    | Wartość domyślna                             |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| Klucz API       | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | W razie braku używa `DEEPGRAM_API_KEY`       |
| Bazowy adres URL | `...deepgram.baseUrl`                                                  | `DEEPGRAM_BASE_URL` lub publiczne API Deepgram |
| Model           | `...deepgram.model`                                                     | `nova-3`                           |
| Język           | `...deepgram.language`                                                  | (nie ustawiono)                              |
| Kodowanie       | `...deepgram.encoding`                                                  | `mulaw`                           |
| Częstotliwość próbkowania | `...deepgram.sampleRate`                                         | `8000`                           |
| Wyznaczanie końca wypowiedzi | `...deepgram.endpointingMs`                                    | `800`                           |
| Wyniki pośrednie | `...deepgram.interimResults`                                           | `true`                           |

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

W przypadku [niestandardowego punktu końcowego Deepgram](https://developers.deepgram.com/reference/custom-endpoints)
ustaw `baseUrl` na katalog główny punktu końcowego, uwzględniając ścieżkę bazową, ale bez `/listen`.
Punkty końcowe czasu rzeczywistego akceptują `http://`, `https://`, `ws://` i `wss://`. HTTP
jest mapowany na WS, HTTPS na WSS, a jawnie określone schematy WebSocket pozostają bez zmian.
Nieprawidłowe adresy URL i inne schematy powodują błąd podczas konfigurowania sesji.

<Note>
Połączenia głosowe odbierają dźwięk telefoniczny w formacie 8 kHz G.711 u-law. Dostawca
strumieniowy Deepgram domyślnie używa `encoding: "mulaw"` i `sampleRate: 8000`, dzięki czemu
ramki multimedialne Twilio można przekazywać bezpośrednio.
</Note>

## Uwagi

<AccordionGroup>
  <Accordion title="Uwierzytelnianie">
    Uwierzytelnianie przebiega zgodnie ze standardową kolejnością uwierzytelniania dostawców. `DEEPGRAM_API_KEY` to
    najprostsza ścieżka.
  </Accordion>
  <Accordion title="Serwer proxy i niestandardowe punkty końcowe">
    Podczas korzystania z serwera proxy nadpisz punkty końcowe lub nagłówki za pomocą `tools.media.audio.baseUrl` i
    `tools.media.audio.headers`.
  </Accordion>
  <Accordion title="Sposób generowania danych wyjściowych">
    Dane wyjściowe podlegają tym samym regułom dotyczącym audio co u innych dostawców (limity rozmiaru, limity czasu,
    wprowadzanie transkrypcji).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Narzędzia multimedialne" href="/pl/tools/media-overview" icon="photo-film">
    Omówienie potoku przetwarzania dźwięku, obrazów i filmów.
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
