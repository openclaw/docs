---
read_when:
    - Chcesz używać modeli Grok w OpenClaw.
    - Konfigurujesz uwierzytelnianie xAI lub identyfikatory modeli.
summary: Używaj modeli xAI Grok w OpenClaw.
title: xAI
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:40:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw dostarcza wbudowany Plugin dostawcy `xai` dla modeli Grok.

## Pierwsze kroki

<Steps>
  <Step title="Utwórz klucz API">
    Utwórz klucz API w [konsoli xAI](https://console.x.ai/).
  </Step>
  <Step title="Ustaw klucz API">
    Ustaw `XAI_API_KEY` albo uruchom:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Wybierz model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw używa interfejsu xAI Responses API jako wbudowanego transportu xAI. Ten sam
`XAI_API_KEY` może również zasilać `web_search` oparty na Grok, natywne
`x_search` oraz zdalne `code_execution`.
Jeśli przechowujesz klucz xAI w `plugins.entries.xai.config.webSearch.apiKey`,
wbudowany dostawca modeli xAI również używa tego klucza jako rozwiązania zapasowego.
Dostrajanie `code_execution` znajduje się w `plugins.entries.xai.config.codeExecution`.
</Note>

## Wbudowany katalog

OpenClaw zawiera te rodziny modeli xAI od razu po instalacji:

| Rodzina        | Identyfikatory modeli                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`                |
| Grok 4         | `grok-4`, `grok-4-0709`                                                   |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                                |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                            |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`  |
| Grok Code      | `grok-code-fast-1`                                                        |

Plugin przekazuje również nowsze identyfikatory `grok-4*` i `grok-code-fast*`, gdy
stosują ten sam kształt API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` oraz warianty `grok-4.20-beta-*` to
aktualne odwołania Grok z obsługą obrazów we wbudowanym katalogu.
</Tip>

## Zakres funkcji OpenClaw

Wbudowany Plugin mapuje aktualną publiczną powierzchnię API xAI na współdzielone
kontrakty dostawców i narzędzi OpenClaw. Możliwości, które nie pasują do współdzielonego kontraktu
(na przykład strumieniowe TTS i głos w czasie rzeczywistym), nie są udostępniane — patrz tabela
poniżej.

| Funkcja xAI                | Powierzchnia OpenClaw                    | Status                                                              |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | dostawca modeli `xai/<model>`            | Tak                                                                 |
| Wyszukiwanie w sieci po stronie serwera | dostawca `web_search` `grok`     | Tak                                                                 |
| Wyszukiwanie X po stronie serwera | narzędzie `x_search`              | Tak                                                                 |
| Wykonywanie kodu po stronie serwera | narzędzie `code_execution`      | Tak                                                                 |
| Obrazy                     | `image_generate`                         | Tak                                                                 |
| Wideo                      | `video_generate`                         | Tak                                                                 |
| Wsadowe zamiana tekstu na mowę | `messages.tts.provider: "xai"` / `tts` | Tak                                                                 |
| Strumieniowe TTS           | —                                        | Nieudostępniane; kontrakt TTS OpenClaw zwraca kompletne bufory audio |
| Wsadowe zamiana mowy na tekst | `tools.media.audio` / rozumienie multimediów | Tak                                                            |
| Strumieniowe zamiana mowy na tekst | Voice Call `streaming.provider: "xai"` | Tak                                                            |
| Głos w czasie rzeczywistym | —                                        | Jeszcze nieudostępniane; inny kontrakt sesji/WebSocket              |
| Pliki / batch              | Tylko zgodność z ogólnym API modeli      | Nie jest natywnym narzędziem OpenClaw                               |

<Note>
OpenClaw używa interfejsów REST xAI dla obrazów/wideo/TTS/STT do generowania multimediów,
mowy i transkrypcji wsadowej, strumieniowego WebSocket STT xAI do transkrypcji
na żywo w połączeniach głosowych oraz Responses API dla modeli, wyszukiwania i
narzędzi wykonania kodu. Funkcje wymagające innych kontraktów OpenClaw, takie jak
sesje głosowe Realtime, są udokumentowane tutaj jako możliwości upstream zamiast
ukrytego zachowania Pluginu.
</Note>

### Mapowania trybu szybkiego

`/fast on` lub `agents.defaults.models["xai/<model>"].params.fastMode: true`
przepisuje natywne żądania xAI w następujący sposób:

| Model źródłowy | Cel trybu szybkiego |
| -------------- | ------------------- |
| `grok-3`       | `grok-3-fast`       |
| `grok-3-mini`  | `grok-3-mini-fast`  |
| `grok-4`       | `grok-4-fast`       |
| `grok-4-0709`  | `grok-4-fast`       |

### Starsze aliasy zgodności

Starsze aliasy są nadal normalizowane do kanonicznych wbudowanych identyfikatorów:

| Starszy alias             | Identyfikator kanoniczny            |
| ------------------------- | ----------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                       |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                     |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`   |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funkcje

<AccordionGroup>
  <Accordion title="Wyszukiwanie w sieci">
    Wbudowany dostawca wyszukiwania w sieci `grok` również używa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generowanie wideo">
    Wbudowany Plugin `xai` rejestruje generowanie wideo przez współdzielone
    narzędzie `video_generate`.

    - Domyślny model wideo: `xai/grok-imagine-video`
    - Tryby: tekst-na-wideo, obraz-na-wideo, generowanie z obrazem referencyjnym, zdalna
      edycja wideo oraz zdalne rozszerzanie wideo
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Rozdzielczości: `480P`, `720P`
    - Czas trwania: 1-15 sekund dla generowania/obraz-na-wideo, 1-10 sekund przy
      użyciu ról `reference_image`, 2-10 sekund dla rozszerzania
    - Generowanie z obrazem referencyjnym: ustaw `imageRoles` na `reference_image` dla
      każdego dostarczonego obrazu; xAI akceptuje do 7 takich obrazów

    <Warning>
    Lokalne bufory wideo nie są akceptowane. Używaj zdalnych adresów URL `http(s)` dla
    danych wejściowych edycji/rozszerzania wideo. Obraz-na-wideo akceptuje lokalne bufory obrazów, ponieważ
    OpenClaw może zakodować je jako adresy URL danych dla xAI.
    </Warning>

    Aby używać xAI jako domyślnego dostawcy wideo:

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
    Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia,
    wybór dostawcy i zachowanie przełączania awaryjnego.
    </Note>

  </Accordion>

  <Accordion title="Generowanie obrazów">
    Wbudowany Plugin `xai` rejestruje generowanie obrazów przez współdzielone
    narzędzie `image_generate`.

    - Domyślny model obrazów: `xai/grok-imagine-image`
    - Dodatkowy model: `xai/grok-imagine-image-pro`
    - Tryby: tekst-na-obraz i edycja z obrazem referencyjnym
    - Dane wejściowe referencyjne: jeden `image` lub do pięciu `images`
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Rozdzielczości: `1K`, `2K`
    - Liczba: do 4 obrazów

    OpenClaw prosi xAI o odpowiedzi obrazów `b64_json`, aby wygenerowane multimedia mogły być
    przechowywane i dostarczane przez standardową ścieżkę załączników kanału. Lokalne
    obrazy referencyjne są konwertowane na adresy URL danych; zdalne odwołania `http(s)` są
    przekazywane dalej.

    Aby używać xAI jako domyślnego dostawcy obrazów:

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
    xAI dokumentuje również `quality`, `mask`, `user` oraz dodatkowe natywne proporcje
    takie jak `1:2`, `2:1`, `9:20` i `20:9`. OpenClaw przekazuje dziś tylko
    współdzielone międzydostawcowe kontrolki obrazów; nieobsługiwane natywne ustawienia
    są celowo nieudostępniane przez `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Zamiana tekstu na mowę">
    Wbudowany Plugin `xai` rejestruje zamianę tekstu na mowę przez współdzieloną
    powierzchnię dostawcy `tts`.

    - Głosy: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Domyślny głos: `eve`
    - Formaty: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Język: kod BCP-47 lub `auto`
    - Prędkość: natywne nadpisanie prędkości dostawcy
    - Natywny format notatki głosowej Opus nie jest obsługiwany

    Aby używać xAI jako domyślnego dostawcy TTS:

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
    OpenClaw używa wsadowego punktu końcowego `/v1/tts` xAI. xAI oferuje również strumieniowe TTS
    przez WebSocket, ale kontrakt dostawcy mowy OpenClaw obecnie oczekuje
    kompletnego bufora audio przed dostarczeniem odpowiedzi.
    </Note>

  </Accordion>

  <Accordion title="Zamiana mowy na tekst">
    Wbudowany Plugin `xai` rejestruje wsadową zamianę mowy na tekst przez powierzchnię
    transkrypcji rozumienia multimediów OpenClaw.

    - Domyślny model: `grok-stt`
    - Punkt końcowy: xAI REST `/v1/stt`
    - Ścieżka wejściowa: wieloczęściowe przesyłanie pliku audio
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego audio używa
      `tools.media.audio`, w tym segmentów kanałów głosowych Discord i
      załączników audio kanału

    Aby wymusić xAI dla transkrypcji przychodzącego audio:

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

    Język można podać przez współdzieloną konfigurację audio multimediów lub na żądanie
    transkrypcji dla pojedynczego wywołania. Wskazówki promptu są akceptowane przez współdzieloną powierzchnię OpenClaw,
    ale integracja xAI REST STT przekazuje dalej tylko plik, model i
    język, ponieważ te elementy czysto mapują się na aktualny publiczny punkt końcowy xAI.

  </Accordion>

  <Accordion title="Strumieniowa zamiana mowy na tekst">
    Wbudowany Plugin `xai` rejestruje również dostawcę transkrypcji realtime
    dla dźwięku połączeń głosowych na żywo.

    - Punkt końcowy: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Domyślne kodowanie: `mulaw`
    - Domyślna częstotliwość próbkowania: `8000`
    - Domyślne endpointing: `800ms`
    - Transkrypty pośrednie: domyślnie włączone

    Strumień multimediów Twilio dla Voice Call wysyła ramki audio G.711 µ-law, więc dostawca
    xAI może przekazywać te ramki bezpośrednio bez transkodowania:

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

    Konfiguracja należąca do dostawcy znajduje się w
    `plugins.entries.voice-call.config.streaming.providers.xai`. Obsługiwane
    klucze to `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` lub
    `alaw`), `interimResults`, `endpointingMs` i `language`.

    <Note>
    Ten dostawca strumieniowy służy do ścieżki transkrypcji realtime w Voice Call.
    Discord voice obecnie rejestruje krótkie segmenty i zamiast tego używa wsadowej
    ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Konfiguracja x_search">
    Wbudowany Plugin xAI udostępnia `x_search` jako narzędzie OpenClaw do przeszukiwania
    treści X (dawniej Twitter) przez Grok.

    Ścieżka konfiguracji: `plugins.entries.xai.config.xSearch`

    | Klucz              | Typ     | Domyślnie          | Opis                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Włącz lub wyłącz x_search            |
    | `model`            | string  | `grok-4-1-fast`    | Model używany dla żądań x_search     |
    | `inlineCitations`  | boolean | —                  | Dołącz cytowania w treści wyników    |
    | `maxTurns`         | number  | —                  | Maksymalna liczba tur konwersacji    |
    | `timeoutSeconds`   | number  | —                  | Limit czasu żądania w sekundach      |
    | `cacheTtlMinutes`  | number  | —                  | Czas życia pamięci podręcznej w minutach |

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
    Wbudowany Plugin xAI udostępnia `code_execution` jako narzędzie OpenClaw do
    zdalnego wykonywania kodu w środowisku sandbox xAI.

    Ścieżka konfiguracji: `plugins.entries.xai.config.codeExecution`

    | Klucz             | Typ     | Domyślnie                | Opis                                      |
    | ----------------- | ------- | ------------------------ | ----------------------------------------- |
    | `enabled`         | boolean | `true` (jeśli klucz jest dostępny) | Włącz lub wyłącz wykonywanie kodu |
    | `model`           | string  | `grok-4-1-fast`          | Model używany dla żądań wykonywania kodu  |
    | `maxTurns`        | number  | —                        | Maksymalna liczba tur konwersacji         |
    | `timeoutSeconds`  | number  | —                        | Limit czasu żądania w sekundach           |

    <Note>
    To jest zdalne wykonanie w sandboxie xAI, a nie lokalne [`exec`](/pl/tools/exec).
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
    - Uwierzytelnianie obecnie obsługuje tylko klucz API. W OpenClaw nie ma jeszcze przepływu xAI OAuth ani device-code.
    - `grok-4.20-multi-agent-experimental-beta-0304` nie jest obsługiwany w
      standardowej ścieżce dostawcy xAI, ponieważ wymaga innej powierzchni API upstream
      niż standardowy transport xAI w OpenClaw.
    - Głos xAI Realtime nie jest jeszcze zarejestrowany jako dostawca OpenClaw. Wymaga
      innego dwukierunkowego kontraktu sesji głosowej niż wsadowe STT lub
      transkrypcja strumieniowa.
    - `quality` obrazu xAI, `mask` obrazu oraz dodatkowe natywne proporcje obrazu
      nie są udostępniane, dopóki współdzielone narzędzie `image_generate` nie będzie miało
      odpowiadających im międzydostawcowych kontrolek.
  </Accordion>

  <Accordion title="Uwagi zaawansowane">
    - OpenClaw automatycznie stosuje poprawki zgodności schematu narzędzi i wywołań narzędzi specyficzne dla xAI
      na współdzielonej ścieżce wykonawczej.
    - Natywne żądania xAI domyślnie mają `tool_stream: true`. Ustaw
      `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`, aby
      to wyłączyć.
    - Wbudowany wrapper xAI usuwa nieobsługiwane ścisłe flagi schematu narzędzi i
      klucze ładunku reasoning przed wysłaniem natywnych żądań xAI.
    - `web_search`, `x_search` i `code_execution` są udostępniane jako narzędzia OpenClaw.
      OpenClaw włącza konkretny wbudowany mechanizm xAI, którego potrzebuje, wewnątrz każdego
      żądania narzędzia zamiast dołączać wszystkie natywne narzędzia do każdej tury czatu.
    - `x_search` i `code_execution` należą do wbudowanego Pluginu xAI, a nie są
      zakodowane na stałe w podstawowym środowisku wykonawczym modeli.
    - `code_execution` to zdalne wykonanie w sandboxie xAI, a nie lokalne
      [`exec`](/pl/tools/exec).
  </Accordion>
</AccordionGroup>

## Testy na żywo

Ścieżki multimediów xAI są objęte testami jednostkowymi i opcjonalnymi zestawami testów na żywo. Polecenia
na żywo ładują sekrety z powłoki logowania, w tym `~/.profile`, przed
sprawdzeniem `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Plik na żywo specyficzny dla dostawcy syntetyzuje zwykłe TTS, przyjazne telefonii PCM
TTS, transkrybuje audio przez wsadowe STT xAI, przesyła strumieniowo to samo PCM przez
realtime STT xAI, generuje wynik tekst-na-obraz i edytuje obraz referencyjny. Współdzielony
plik obrazu na żywo weryfikuje tego samego dostawcę xAI przez wybór środowiska wykonawczego OpenClaw,
mechanizm zapasowy, normalizację i ścieżkę załączników multimedialnych.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Wszyscy dostawcy" href="/pl/providers/index" icon="grid-2">
    Szerszy przegląd dostawców.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i poprawki.
  </Card>
</CardGroup>
