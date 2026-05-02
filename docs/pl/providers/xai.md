---
read_when:
    - Chcesz używać modeli Grok w OpenClaw
    - Konfigurujesz uwierzytelnianie xAI lub identyfikatory modeli
summary: Korzystanie z modeli xAI Grok w OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-02T10:01:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw dostarcza dołączony Plugin dostawcy `xai` dla modeli Grok.

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
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw używa interfejsu xAI Responses API jako dołączonego transportu xAI. Ten sam
`XAI_API_KEY` może także obsługiwać oparte na Grok `web_search`, pełnoprawne `x_search`
oraz zdalne `code_execution`.
Jeśli zapiszesz klucz xAI pod `plugins.entries.xai.config.webSearch.apiKey`,
dołączony dostawca modeli xAI użyje tego klucza także jako wartości awaryjnej.
Ustaw `plugins.entries.xai.config.webSearch.baseUrl`, aby kierować Grok `web_search`
oraz, domyślnie, `x_search` przez operatorskie proxy xAI Responses.
Dostrajanie `code_execution` znajduje się pod `plugins.entries.xai.config.codeExecution`.
</Note>

## Wbudowany katalog

OpenClaw zawiera od razu następujące rodziny modeli xAI:

| Rodzina        | Identyfikatory modeli                                                     |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin przekazuje także nowsze identyfikatory `grok-4*` i `grok-code-fast*`, gdy
stosują ten sam kształt API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` oraz warianty `grok-4.20-beta-*`
to bieżące referencje Grok obsługujące obrazy w dołączonym katalogu.
</Tip>

## Pokrycie funkcji OpenClaw

Dołączony Plugin mapuje bieżącą publiczną powierzchnię API xAI na wspólne
kontrakty dostawców i narzędzi OpenClaw. Możliwości, które nie pasują do wspólnego kontraktu
(na przykład strumieniowe TTS i głos w czasie rzeczywistym), nie są udostępniane — zobacz tabelę
poniżej.

| Możliwość xAI              | Powierzchnia OpenClaw                      | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | dostawca modeli `xai/<model>`             | Tak                                                                 |
| Wyszukiwanie w sieci po stronie serwera | dostawca `web_search` `grok`     | Tak                                                                 |
| Wyszukiwanie X po stronie serwera | narzędzie `x_search`                | Tak                                                                 |
| Wykonywanie kodu po stronie serwera | narzędzie `code_execution`        | Tak                                                                 |
| Obrazy                     | `image_generate`                          | Tak                                                                 |
| Wideo                      | `video_generate`                          | Tak                                                                 |
| Wsadowe text-to-speech     | `messages.tts.provider: "xai"` / `tts`    | Tak                                                                 |
| Strumieniowe TTS           | —                                         | Nieudostępniane; kontrakt TTS OpenClaw zwraca kompletne bufory audio |
| Wsadowe speech-to-text     | `tools.media.audio` / rozumienie multimediów | Tak                                                              |
| Strumieniowe speech-to-text | Voice Call `streaming.provider: "xai"`   | Tak                                                                 |
| Głos w czasie rzeczywistym | —                                         | Jeszcze nieudostępniany; inny kontrakt sesji/WebSocket              |
| Pliki / partie             | Tylko ogólna zgodność z API modeli         | Nie jest pełnoprawnym narzędziem OpenClaw                           |

<Note>
OpenClaw używa interfejsów REST API xAI dla obrazów/wideo/TTS/STT do generowania multimediów,
mowy i transkrypcji wsadowej, strumieniowego WebSocket STT xAI do transkrypcji rozmów
głosowych na żywo oraz Responses API dla narzędzi modeli, wyszukiwania i
wykonywania kodu. Funkcje wymagające innych kontraktów OpenClaw, takie jak
sesje głosu w czasie rzeczywistym, są tutaj udokumentowane jako możliwości upstream,
a nie jako ukryte zachowanie Plugin.
</Note>

### Mapowania trybu szybkiego

`/fast on` lub `agents.defaults.models["xai/<model>"].params.fastMode: true`
przepisuje natywne żądania xAI następująco:

| Model źródłowy | Cel trybu szybkiego |
| -------------- | ------------------- |
| `grok-3`       | `grok-3-fast`       |
| `grok-3-mini`  | `grok-3-mini-fast`  |
| `grok-4`       | `grok-4-fast`       |
| `grok-4-0709`  | `grok-4-fast`       |

### Starsze aliasy zgodności

Starsze aliasy nadal normalizują się do kanonicznych dołączonych identyfikatorów:

| Starszy alias             | Identyfikator kanoniczny              |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funkcje

<AccordionGroup>
  <Accordion title="Wyszukiwanie w sieci">
    Dołączony dostawca wyszukiwania w sieci `grok` także używa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generowanie wideo">
    Dołączony Plugin `xai` rejestruje generowanie wideo przez współdzielone
    narzędzie `video_generate`.

    - Domyślny model wideo: `xai/grok-imagine-video`
    - Tryby: tekst-na-wideo, obraz-na-wideo, generowanie z obrazem referencyjnym, zdalna
      edycja wideo oraz zdalne rozszerzanie wideo
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Rozdzielczości: `480P`, `720P`
    - Czas trwania: 1–15 sekund dla generowania/obrazu-na-wideo, 1–10 sekund podczas
      używania ról `reference_image`, 2–10 sekund dla rozszerzania
    - Generowanie z obrazem referencyjnym: ustaw `imageRoles` na `reference_image` dla
      każdego dostarczonego obrazu; xAI akceptuje do 7 takich obrazów

    <Warning>
    Lokalne bufory wideo nie są akceptowane. Używaj zdalnych URL-i `http(s)` jako
    wejść edycji/rozszerzania wideo. Obraz-na-wideo akceptuje lokalne bufory obrazów, ponieważ
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
    Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia,
    wybór dostawcy i zachowanie przełączania awaryjnego.
    </Note>

  </Accordion>

  <Accordion title="Generowanie obrazów">
    Dołączony Plugin `xai` rejestruje generowanie obrazów przez współdzielone
    narzędzie `image_generate`.

    - Domyślny model obrazu: `xai/grok-imagine-image`
    - Dodatkowy model: `xai/grok-imagine-image-pro`
    - Tryby: tekst-na-obraz i edycja z obrazem referencyjnym
    - Wejścia referencyjne: jeden `image` albo do pięciu `images`
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Rozdzielczości: `1K`, `2K`
    - Liczba: do 4 obrazów

    OpenClaw prosi xAI o odpowiedzi obrazów `b64_json`, aby wygenerowane multimedia mogły być
    przechowywane i dostarczane normalną ścieżką załączników kanału. Lokalne
    obrazy referencyjne są konwertowane na adresy URL danych; zdalne referencje `http(s)` są
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
    xAI dokumentuje także `quality`, `mask`, `user` i dodatkowe natywne proporcje,
    takie jak `1:2`, `2:1`, `9:20` i `20:9`. OpenClaw obecnie przekazuje tylko
    współdzielone, międzydostawcze kontrolki obrazów; nieobsługiwane pokrętła wyłącznie natywne
    celowo nie są udostępniane przez `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Dołączony Plugin `xai` rejestruje text-to-speech przez współdzieloną powierzchnię
    dostawcy `tts`.

    - Głosy: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Domyślny głos: `eve`
    - Formaty: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Język: kod BCP-47 albo `auto`
    - Szybkość: natywne dla dostawcy nadpisanie szybkości
    - Natywny format notatek głosowych Opus nie jest obsługiwany

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
    OpenClaw używa wsadowego punktu końcowego xAI `/v1/tts`. xAI oferuje także strumieniowe TTS
    przez WebSocket, ale kontrakt dostawcy mowy OpenClaw obecnie oczekuje
    kompletnego bufora audio przed dostarczeniem odpowiedzi.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Dołączony Plugin `xai` rejestruje wsadowe speech-to-text przez powierzchnię
    transkrypcji rozumienia multimediów OpenClaw.

    - Domyślny model: `grok-stt`
    - Punkt końcowy: xAI REST `/v1/stt`
    - Ścieżka wejściowa: przesyłanie wieloczęściowego pliku audio
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego audio używa
      `tools.media.audio`, w tym segmentów kanałów głosowych Discord oraz
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

    Język można podać przez wspólną konfigurację mediów audio albo przez żądanie
    transkrypcji dla danego wywołania. Wskazówki promptu są akceptowane przez wspólną powierzchnię
    OpenClaw, ale integracja xAI REST STT przekazuje tylko plik, model i
    język, ponieważ te elementy jednoznacznie mapują się na bieżący publiczny punkt końcowy xAI.

  </Accordion>

  <Accordion title="Strumieniowe speech-to-text">
    Dołączony Plugin `xai` rejestruje także dostawcę transkrypcji w czasie rzeczywistym
    dla audio rozmów głosowych na żywo.

    - Punkt końcowy: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Domyślne kodowanie: `mulaw`
    - Domyślna częstotliwość próbkowania: `8000`
    - Domyślne wykrywanie końca wypowiedzi: `800ms`
    - Transkrypty tymczasowe: domyślnie włączone

    Strumień multimediów Twilio funkcji Voice Call wysyła ramki audio G.711 µ-law, więc
    dostawca xAI może przekazywać te ramki bezpośrednio bez transkodowania:

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

    Konfiguracja należąca do dostawcy znajduje się pod
    `plugins.entries.voice-call.config.streaming.providers.xai`. Obsługiwane
    klucze to `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` lub
    `alaw`), `interimResults`, `endpointingMs` i `language`.

    <Note>
    Ten dostawca streamingu jest przeznaczony dla ścieżki transkrypcji w czasie rzeczywistym Voice Call.
    Głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa wsadowej
    ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Konfiguracja x_search">
    Dołączony Plugin xAI udostępnia `x_search` jako narzędzie OpenClaw do wyszukiwania
    treści X (dawniej Twitter) przez Grok.

    Ścieżka konfiguracji: `plugins.entries.xai.config.xSearch`

    | Klucz              | Typ     | Domyślnie         | Opis                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Włącz lub wyłącz x_search            |
    | `model`            | string  | `grok-4-1-fast`    | Model używany do żądań x_search      |
    | `baseUrl`          | string  | —                  | Nadpisanie bazowego adresu URL xAI Responses |
    | `inlineCitations`  | boolean | —                  | Dołącz cytowania w tekście do wyników |
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
                baseUrl: "https://api.x.ai/v1",
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
    zdalnego wykonywania kodu w środowisku piaskownicy xAI.

    Ścieżka konfiguracji: `plugins.entries.xai.config.codeExecution`

    | Klucz             | Typ     | Domyślnie                | Opis                                      |
    | ----------------- | ------- | ------------------------ | ----------------------------------------- |
    | `enabled`         | boolean | `true` (jeśli klucz jest dostępny) | Włącz lub wyłącz wykonywanie kodu |
    | `model`           | string  | `grok-4-1-fast`          | Model używany do żądań wykonywania kodu   |
    | `maxTurns`        | number  | —                        | Maksymalna liczba tur konwersacji         |
    | `timeoutSeconds`  | number  | —                        | Limit czasu żądania w sekundach           |

    <Note>
    To jest zdalne wykonywanie w piaskownicy xAI, a nie lokalne [`exec`](/pl/tools/exec).
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
    - Uwierzytelnianie obecnie obsługuje tylko klucz API. W OpenClaw nie ma jeszcze
      przepływu xAI OAuth ani kodu urządzenia.
    - `grok-4.20-multi-agent-experimental-beta-0304` nie jest obsługiwany na
      standardowej ścieżce dostawcy xAI, ponieważ wymaga innej powierzchni API upstream
      niż standardowy transport xAI w OpenClaw.
    - Głos xAI Realtime nie jest jeszcze zarejestrowany jako dostawca OpenClaw. Wymaga
      innego kontraktu dwukierunkowej sesji głosowej niż wsadowe STT lub
      transkrypcja streamingowa.
    - `quality` obrazu xAI, `mask` obrazu i dodatkowe, wyłącznie natywne proporcje obrazu
      nie są udostępniane, dopóki współdzielone narzędzie `image_generate` nie będzie mieć odpowiednich
      kontrolek międzydostawcowych.
  </Accordion>

  <Accordion title="Uwagi zaawansowane">
    - OpenClaw automatycznie stosuje poprawki zgodności schematu narzędzi i wywołań narzędzi
      specyficzne dla xAI na współdzielonej ścieżce runnera.
    - Natywne żądania xAI domyślnie używają `tool_stream: true`. Ustaw
      `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`, aby
      to wyłączyć.
    - Dołączony wrapper xAI usuwa nieobsługiwane rygorystyczne flagi schematu narzędzi i
      klucze payloadu rozumowania przed wysłaniem natywnych żądań xAI.
    - `web_search`, `x_search` i `code_execution` są udostępniane jako narzędzia OpenClaw.
      OpenClaw włącza konkretną wbudowaną funkcję xAI potrzebną w każdym żądaniu narzędzia
      zamiast dołączać wszystkie natywne narzędzia do każdej tury czatu.
    - Grok `web_search` odczytuje `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` odczytuje `plugins.entries.xai.config.xSearch.baseUrl`, a następnie
      wraca do bazowego adresu URL wyszukiwania web Grok.
    - `x_search` i `code_execution` należą do dołączonego Pluginu xAI, a nie
      są zakodowane na stałe w głównym środowisku uruchomieniowym modelu.
    - `code_execution` to zdalne wykonywanie w piaskownicy xAI, a nie lokalne
      [`exec`](/pl/tools/exec).
  </Accordion>
</AccordionGroup>

## Testowanie na żywo

Ścieżki multimediów xAI są objęte testami jednostkowymi i opcjonalnymi zestawami testów na żywo. Polecenia na żywo
ładują sekrety z powłoki logowania, w tym `~/.profile`, przed
sondowaniem `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Plik na żywo specyficzny dla dostawcy syntetyzuje zwykłe TTS, przyjazne telefonii PCM
TTS, transkrybuje dźwięk przez wsadowe STT xAI, streamuje ten sam PCM przez xAI
realtime STT, generuje wynik tekst-na-obraz i edytuje obraz referencyjny. Współdzielony
plik na żywo obrazów weryfikuje tego samego dostawcę xAI przez ścieżkę wyboru
środowiska uruchomieniowego OpenClaw, fallbacku, normalizacji i załączników multimedialnych.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
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
