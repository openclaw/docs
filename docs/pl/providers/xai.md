---
read_when:
    - Chcesz używać modeli Grok w OpenClaw
    - Konfigurujesz uwierzytelnianie xAI albo identyfikatory modeli
summary: Używaj modeli xAI Grok w OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-24T09:30:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw dostarcza dołączony Plugin providera `xai` dla modeli Grok.

## Pierwsze kroki

<Steps>
  <Step title="Create an API key">
    Utwórz klucz API w [konsoli xAI](https://console.x.ai/).
  </Step>
  <Step title="Set your API key">
    Ustaw `XAI_API_KEY`, albo uruchom:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Pick a model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw używa API xAI Responses jako dołączonego transportu xAI. To samo
`XAI_API_KEY` może również zasilać `web_search` oparte na Grok, first-class `x_search`
oraz zdalne `code_execution`.
Jeśli przechowujesz klucz xAI pod `plugins.entries.xai.config.webSearch.apiKey`,
dołączony provider modeli xAI również używa tego klucza jako fallbacku.
Dostrajanie `code_execution` znajduje się pod `plugins.entries.xai.config.codeExecution`.
</Note>

## Wbudowany katalog

OpenClaw zawiera od razu te rodziny modeli xAI:

| Rodzina        | Identyfikatory modeli                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`                 |
| Grok 4         | `grok-4`, `grok-4-0709`                                                    |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                                 |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                             |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`   |
| Grok Code      | `grok-code-fast-1`                                                         |

Plugin także przekazuje i rozwiązuje nowsze identyfikatory `grok-4*` i `grok-code-fast*`, gdy
mają ten sam kształt API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` i warianty `grok-4.20-beta-*` to
aktualne referencje Grok obsługujące obrazy w dołączonym katalogu.
</Tip>

## Pokrycie funkcji OpenClaw

Dołączony Plugin mapuje bieżącą publiczną powierzchnię API xAI na współdzielone
kontrakty providera i narzędzi OpenClaw. Możliwości, które nie pasują do współdzielonego kontraktu
(na przykład streaming TTS i głos realtime), nie są wystawiane — zobacz tabelę
poniżej.

| Możliwość xAI              | Powierzchnia OpenClaw                   | Status                                                               |
| -------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| Chat / Responses           | provider modelu `xai/<model>`           | Tak                                                                  |
| Wyszukiwanie web po stronie serwera | provider `web_search` `grok`   | Tak                                                                  |
| Wyszukiwanie X po stronie serwera | narzędzie `x_search`              | Tak                                                                  |
| Wykonywanie kodu po stronie serwera | narzędzie `code_execution`      | Tak                                                                  |
| Obrazy                     | `image_generate`                        | Tak                                                                  |
| Wideo                      | `video_generate`                        | Tak                                                                  |
| Batch text-to-speech       | `messages.tts.provider: "xai"` / `tts`  | Tak                                                                  |
| Streaming TTS              | —                                       | Nie jest wystawione; kontrakt TTS OpenClaw zwraca kompletne bufory audio |
| Batch speech-to-text       | `tools.media.audio` / rozumienie mediów | Tak                                                                  |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`  | Tak                                                                  |
| Głos realtime              | —                                       | Jeszcze niewystawione; inny kontrakt sesji/WebSocket                 |
| Pliki / batch              | Tylko generyczna zgodność z API modeli  | Nie jest first-class narzędziem OpenClaw                             |

<Note>
OpenClaw używa REST API xAI dla obrazów/wideo/TTS/STT do generowania mediów,
mowy i batchowej transkrypcji, streamingowego WebSocket STT xAI do transkrypcji
na żywo w Voice Call oraz API Responses dla modeli, wyszukiwania i narzędzi
wykonywania kodu. Funkcje wymagające innych kontraktów OpenClaw, takie jak
sesje głosu Realtime, są dokumentowane tutaj jako możliwości upstream, a nie
ukryte zachowanie Pluginu.
</Note>

### Mapowania trybu fast

`/fast on` albo `agents.defaults.models["xai/<model>"].params.fastMode: true`
przepisuje natywne żądania xAI w następujący sposób:

| Model źródłowy | Cel trybu fast    |
| -------------- | ----------------- |
| `grok-3`       | `grok-3-fast`     |
| `grok-3-mini`  | `grok-3-mini-fast` |
| `grok-4`       | `grok-4-fast`     |
| `grok-4-0709`  | `grok-4-fast`     |

### Starsze aliasy zgodności

Starsze aliasy nadal normalizują się do kanonicznych dołączonych identyfikatorów:

| Starszy alias             | Kanoniczny identyfikator               |
| ------------------------- | -------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                          |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                        |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`      |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning`  |

## Funkcje

<AccordionGroup>
  <Accordion title="Web search">
    Dołączony provider `grok` dla web-search także używa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generowanie wideo">
    Dołączony Plugin `xai` rejestruje generowanie wideo przez współdzielone
    narzędzie `video_generate`.

    - Domyślny model wideo: `xai/grok-imagine-video`
    - Tryby: text-to-video, image-to-video, zdalna edycja wideo oraz zdalne
      rozszerzanie wideo
    - Proporcje: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Rozdzielczości: `480P`, `720P`
    - Czas trwania: 1-15 sekund dla generowania/image-to-video, 2-10 sekund dla
      rozszerzania

    <Warning>
    Lokalne bufory wideo nie są akceptowane. Używaj zdalnych URL-i `http(s)` dla
    wejść edycji/rozszerzania wideo. Image-to-video akceptuje lokalne bufory obrazów, ponieważ
    OpenClaw może zakodować je jako data URL-e dla xAI.
    </Warning>

    Aby używać xAI jako domyślnego providera wideo:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Zobacz [Video Generation](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia,
    wybór providera i zachowanie failover.
    </Note>

  </Accordion>

  <Accordion title="Generowanie obrazów">
    Dołączony Plugin `xai` rejestruje generowanie obrazów przez współdzielone
    narzędzie `image_generate`.

    - Domyślny model obrazów: `xai/grok-imagine-image`
    - Dodatkowy model: `xai/grok-imagine-image-pro`
    - Tryby: text-to-image i edycja z obrazem referencyjnym
    - Wejścia referencyjne: jeden `image` albo do pięciu `images`
    - Proporcje: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Rozdzielczości: `1K`, `2K`
    - Liczba: do 4 obrazów

    OpenClaw prosi xAI o odpowiedzi obrazów `b64_json`, aby wygenerowane media mogły być
    zapisane i dostarczone przez zwykłą ścieżkę załączników kanałowych. Lokalne
    obrazy referencyjne są konwertowane na data URL-e; zdalne referencje `http(s)` są
    przekazywane dalej.

    Aby używać xAI jako domyślnego providera obrazów:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI dokumentuje także `quality`, `mask`, `user` oraz dodatkowe natywne proporcje,
    takie jak `1:2`, `2:1`, `9:20` i `20:9`. OpenClaw przekazuje dziś tylko
    współdzielone międzyproviderowe kontrolki obrazów; nieobsługiwane natywne-only pokrętła
    celowo nie są wystawiane przez `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Dołączony Plugin `xai` rejestruje text-to-speech przez współdzieloną
    powierzchnię providera `tts`.

    - Głosy: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Domyślny głos: `eve`
    - Formaty: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Język: kod BCP-47 albo `auto`
    - Szybkość: natywne nadpisanie szybkości providera
    - Natywny format notatek głosowych Opus nie jest obsługiwany

    Aby używać xAI jako domyślnego providera TTS:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw używa batchowego endpointu xAI `/v1/tts`. xAI oferuje także streaming TTS
    przez WebSocket, ale kontrakt providera mowy OpenClaw obecnie oczekuje
    kompletnego bufora audio przed dostarczeniem odpowiedzi.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Dołączony Plugin `xai` rejestruje batchowe speech-to-text przez powierzchnię
    transkrypcji rozumienia mediów OpenClaw.

    - Domyślny model: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Ścieżka wejściowa: multipart upload pliku audio
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie przychodząca transkrypcja audio używa
      `tools.media.audio`, w tym segmentów kanałów głosowych Discord i
      załączników audio kanałów

    Aby wymusić xAI dla przychodzącej transkrypcji audio:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Język może być podany przez współdzieloną konfigurację mediów audio albo przez
    żądanie transkrypcji per wywołanie. Podpowiedzi promptu są akceptowane przez współdzieloną
    powierzchnię OpenClaw, ale integracja xAI REST STT przekazuje tylko plik, model i
    język, ponieważ to czysto mapuje się na bieżący publiczny endpoint xAI.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    Dołączony Plugin `xai` rejestruje także providera transkrypcji realtime
    dla dźwięku połączeń głosowych na żywo.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Domyślne kodowanie: `mulaw`
    - Domyślna częstotliwość próbkowania: `8000`
    - Domyślne endpointing: `800ms`
    - Transkrypty pośrednie: domyślnie włączone

    Strumień mediów Twilio w Voice Call wysyła ramki audio G.711 µ-law, więc
    provider xAI może przekazywać te ramki bezpośrednio bez transkodowania:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Konfiguracja należąca do providera znajduje się pod
    `plugins.entries.voice-call.config.streaming.providers.xai`. Obsługiwane
    klucze to `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` albo
    `alaw`), `interimResults`, `endpointingMs` i `language`.

    <Note>
    Ten provider streamingowy dotyczy ścieżki transkrypcji realtime Voice Call.
    Głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa batchowej
    ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Konfiguracja x_search">
    Dołączony Plugin xAI udostępnia `x_search` jako narzędzie OpenClaw do przeszukiwania
    treści X (dawniej Twitter) przez Grok.

    Ścieżka konfiguracji: `plugins.entries.xai.config.xSearch`

    | Klucz              | Typ     | Domyślnie          | Opis                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Włącza albo wyłącza x_search         |
    | `model`            | string  | `grok-4-1-fast`    | Model używany do żądań x_search      |
    | `inlineCitations`  | boolean | —                  | Uwzględnia cytowania inline w wynikach |
    | `maxTurns`         | number  | —                  | Maksymalna liczba tur rozmowy        |
    | `timeoutSeconds`   | number  | —                  | Timeout żądania w sekundach          |
    | `cacheTtlMinutes`  | number  | —                  | Czas życia cache w minutach          |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Konfiguracja wykonywania kodu">
    Dołączony Plugin xAI udostępnia `code_execution` jako narzędzie OpenClaw do
    zdalnego wykonywania kodu w środowisku sandbox xAI.

    Ścieżka konfiguracji: `plugins.entries.xai.config.codeExecution`

    | Klucz             | Typ     | Domyślnie                  | Opis                                      |
    | ----------------- | ------- | -------------------------- | ----------------------------------------- |
    | `enabled`         | boolean | `true` (jeśli klucz jest dostępny) | Włącza albo wyłącza wykonywanie kodu |
    | `model`           | string  | `grok-4-1-fast`           | Model używany do żądań wykonywania kodu   |
    | `maxTurns`        | number  | —                          | Maksymalna liczba tur rozmowy             |
    | `timeoutSeconds`  | number  | —                          | Timeout żądania w sekundach               |

    <Note>
    To zdalne wykonywanie w sandboxie xAI, a nie lokalne [`exec`](/pl/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Znane ograniczenia">
    - Auth obecnie działa tylko przez klucz API. W OpenClaw nie ma jeszcze przepływu OAuth ani device-code dla xAI.
    - `grok-4.20-multi-agent-experimental-beta-0304` nie jest obsługiwany na
      zwykłej ścieżce providera xAI, ponieważ wymaga innej powierzchni API upstream
      niż standardowy transport xAI OpenClaw.
    - Głos Realtime xAI nie jest jeszcze zarejestrowany jako provider OpenClaw.
      Wymaga innego dwukierunkowego kontraktu sesji głosowej niż batch STT albo
      streamingowa transkrypcja.
    - `quality` obrazu xAI, `mask` obrazu i dodatkowe proporcje natywne-only nie są
      wystawiane, dopóki współdzielone narzędzie `image_generate` nie będzie miało odpowiadających
      międzyproviderowych kontrolek.
  </Accordion>

  <Accordion title="Zaawansowane uwagi">
    - OpenClaw automatycznie stosuje poprawki kompatybilności schematu narzędzi i wywołań narzędzi specyficzne dla xAI na współdzielonej ścieżce runnera.
    - Natywne żądania xAI domyślnie ustawiają `tool_stream: true`. Ustaw
      `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`, aby
      to wyłączyć.
    - Dołączony wrapper xAI usuwa nieobsługiwane ścisłe flagi schematu narzędzi i
      klucze ładunku reasoning przed wysłaniem natywnych żądań xAI.
    - `web_search`, `x_search` i `code_execution` są wystawiane jako narzędzia OpenClaw.
      OpenClaw włącza konkretne wbudowane narzędzie xAI, którego potrzebuje, wewnątrz każdego żądania narzędzia
      zamiast dołączać wszystkie natywne narzędzia do każdej tury czatu.
    - `x_search` i `code_execution` należą do dołączonego Pluginu xAI, a nie są
      zakodowane na stałe w głównym runtime modeli.
    - `code_execution` to zdalne wykonywanie w sandboxie xAI, a nie lokalne
      [`exec`](/pl/tools/exec).
  </Accordion>
</AccordionGroup>

## Testy live

Ścieżki mediów xAI są objęte testami jednostkowymi i opcjonalnymi pakietami live. Polecenia
live ładują sekrety z Twojej powłoki logowania, w tym `~/.profile`, przed
sprawdzeniem `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Plik live specyficzny dla providera syntetyzuje zwykły TTS, telefoniczny TTS PCM,
transkrybuje audio przez batchowe STT xAI, streamuje to samo PCM przez realtime STT xAI,
generuje wynik text-to-image i edytuje obraz referencyjny. Współdzielony plik live obrazów
weryfikuje tego samego providera xAI przez wybór runtime OpenClaw,
fallback, normalizację i ścieżkę załączników mediów.

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="Video generation" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór providera.
  </Card>
  <Card title="All providers" href="/pl/providers/index" icon="grid-2">
    Szerszy przegląd providerów.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i poprawki.
  </Card>
</CardGroup>
