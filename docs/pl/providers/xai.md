---
read_when:
    - Chcesz korzystać z modeli Grok w OpenClaw
    - Konfigurujesz uwierzytelnianie xAI lub identyfikatory modeli
summary: Korzystaj z modeli xAI Grok w OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-10T19:53:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f11c31e7ff39e7e13465b48d819db3921a32ed624676a57dc38f97c0dbd21e46
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
OpenClaw używa xAI Responses API jako dołączonego transportu xAI. Ten sam
klucz API z `openclaw onboard --auth-choice xai-api-key` może też zasilać
pierwszoklasowe `x_search` i zdalne `code_execution`; `XAI_API_KEY` lub
konfiguracja wyszukiwania w sieci Pluginu może również zasilać `web_search`
oparte na Grok.
Jeśli zapiszesz klucz xAI w `plugins.entries.xai.config.webSearch.apiKey`,
dołączony dostawca modeli xAI użyje tego klucza również jako opcji awaryjnej.
Ustaw `plugins.entries.xai.config.webSearch.baseUrl`, aby kierować Grok `web_search`
oraz, domyślnie, `x_search` przez operatorski proxy xAI Responses.
Dostrajanie `code_execution` znajduje się w `plugins.entries.xai.config.codeExecution`.
</Note>

## Wbudowany katalog

OpenClaw domyślnie obejmuje następujące rodziny modeli xAI:

| Rodzina        | Identyfikatory modeli                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin przekierowuje też do nowszych identyfikatorów `grok-4*` i `grok-code-fast*`,
gdy mają taki sam kształt API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` oraz warianty `grok-4.20-beta-*`
to obecne odwołania Grok z obsługą obrazów w dołączonym katalogu.
</Tip>

## Pokrycie funkcji OpenClaw

Dołączony Plugin mapuje bieżącą publiczną powierzchnię API xAI na współdzielone
kontrakty dostawców i narzędzi OpenClaw. Możliwości, które nie pasują do
współdzielonego kontraktu (na przykład strumieniowe TTS i głos czasu
rzeczywistego), nie są udostępniane - zobacz tabelę poniżej.

| Możliwość xAI               | Powierzchnia OpenClaw                      | Status                                                              |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Czat / Responses            | dostawca modelu `xai/<model>`              | Tak                                                                 |
| Wyszukiwanie w sieci po stronie serwera | dostawca `web_search` `grok` | Tak                                                                 |
| Wyszukiwanie X po stronie serwera | narzędzie `x_search`                 | Tak                                                                 |
| Wykonywanie kodu po stronie serwera | narzędzie `code_execution`          | Tak                                                                 |
| Obrazy                      | `image_generate`                           | Tak                                                                 |
| Wideo                       | `video_generate`                           | Tak                                                                 |
| Wsadowe text-to-speech      | `messages.tts.provider: "xai"` / `tts`     | Tak                                                                 |
| Strumieniowe TTS            | -                                          | Nieudostępnione; kontrakt TTS OpenClaw zwraca kompletne bufory audio |
| Wsadowe speech-to-text      | `tools.media.audio` / rozumienie mediów    | Tak                                                                 |
| Strumieniowe speech-to-text | Voice Call `streaming.provider: "xai"`     | Tak                                                                 |
| Głos czasu rzeczywistego    | -                                          | Jeszcze nieudostępnione; inny kontrakt sesji/WebSocket              |
| Pliki / zadania wsadowe     | Tylko ogólna zgodność API modeli           | Nie jest pierwszoklasowym narzędziem OpenClaw                       |

<Note>
OpenClaw używa interfejsów API REST xAI dla obrazów/wideo/TTS/STT do generowania
mediów, mowy i transkrypcji wsadowej, strumieniowego WebSocket STT xAI do
transkrypcji połączeń głosowych na żywo oraz Responses API do narzędzi modeli,
wyszukiwania i wykonywania kodu. Funkcje wymagające innych kontraktów OpenClaw,
takie jak sesje głosu czasu rzeczywistego, są tu udokumentowane jako możliwości
upstreamu, a nie ukryte zachowanie Pluginu.
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
    Dołączony dostawca wyszukiwania w sieci `grok` może używać `XAI_API_KEY`
    albo klucza wyszukiwania w sieci Pluginu:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generowanie wideo">
    Dołączony Plugin `xai` rejestruje generowanie wideo przez współdzielone
    narzędzie `video_generate`.

    - Domyślny model wideo: `xai/grok-imagine-video`
    - Tryby: tekst-na-wideo, obraz-na-wideo, generowanie z obrazem referencyjnym,
      zdalna edycja wideo i zdalne przedłużanie wideo
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Rozdzielczości: `480P`, `720P`
    - Czas trwania: 1-15 sekund dla generowania/obrazu-na-wideo, 1-10 sekund przy
      użyciu ról `reference_image`, 2-10 sekund dla przedłużania
    - Generowanie z obrazem referencyjnym: ustaw `imageRoles` na `reference_image`
      dla każdego dostarczonego obrazu; xAI akceptuje do 7 takich obrazów

    <Warning>
    Lokalne bufory wideo nie są akceptowane. Używaj zdalnych adresów URL
    `http(s)` jako wejść edycji/przedłużania wideo. Obraz-na-wideo akceptuje
    lokalne bufory obrazów, ponieważ OpenClaw może zakodować je jako adresy URL
    danych dla xAI.
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
    Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać
    współdzielone parametry narzędzia, wybór dostawcy i zachowanie przełączania
    awaryjnego.
    </Note>

  </Accordion>

  <Accordion title="Generowanie obrazów">
    Dołączony Plugin `xai` rejestruje generowanie obrazów przez współdzielone
    narzędzie `image_generate`.

    - Domyślny model obrazu: `xai/grok-imagine-image`
    - Dodatkowy model: `xai/grok-imagine-image-pro`
    - Tryby: tekst-na-obraz i edycja obrazu referencyjnego
    - Wejścia referencyjne: jeden `image` albo do pięciu `images`
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Rozdzielczości: `1K`, `2K`
    - Liczba: do 4 obrazów

    OpenClaw prosi xAI o odpowiedzi obrazów `b64_json`, aby wygenerowane media
    mogły być przechowywane i dostarczane normalną ścieżką załączników kanału.
    Lokalne obrazy referencyjne są konwertowane na adresy URL danych; zdalne
    referencje `http(s)` są przekazywane bez zmian.

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
    xAI dokumentuje też `quality`, `mask`, `user` oraz dodatkowe natywne
    proporcje, takie jak `1:2`, `2:1`, `9:20` i `20:9`. OpenClaw przekazuje
    obecnie tylko współdzielone między dostawcami kontrolki obrazów;
    nieobsługiwane pokrętła wyłącznie natywne celowo nie są udostępniane przez
    `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Dołączony Plugin `xai` rejestruje text-to-speech przez współdzieloną
    powierzchnię dostawcy `tts`.

    - Głosy: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Domyślny głos: `eve`
    - Formaty: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Język: kod BCP-47 albo `auto`
    - Szybkość: natywne dla dostawcy nadpisanie szybkości
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
    OpenClaw używa wsadowego punktu końcowego xAI `/v1/tts`. xAI oferuje też
    strumieniowe TTS przez WebSocket, ale kontrakt dostawcy mowy OpenClaw
    obecnie oczekuje kompletnego bufora audio przed dostarczeniem odpowiedzi.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Dołączony Plugin `xai` rejestruje wsadowe speech-to-text przez powierzchnię
    transkrypcji rozumienia mediów OpenClaw.

    - Domyślny model: `grok-stt`
    - Punkt końcowy: xAI REST `/v1/stt`
    - Ścieżka wejściowa: przesłanie wieloczęściowego pliku audio
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego
      audio używa `tools.media.audio`, w tym w segmentach kanałów głosowych
      Discord i załącznikach audio kanałów

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

    Język można podać przez współdzieloną konfigurację mediów audio albo przez
    żądanie transkrypcji dla pojedynczego wywołania. Wskazówki promptu są
    akceptowane przez współdzieloną powierzchnię OpenClaw, ale integracja xAI
    REST STT przekazuje tylko plik, model i język, ponieważ te elementy mapują
    się jasno na bieżący publiczny punkt końcowy xAI.

  </Accordion>

  <Accordion title="Strumieniowe speech-to-text">
    Dołączony Plugin `xai` rejestruje też dostawcę transkrypcji czasu
    rzeczywistego dla audio połączeń głosowych na żywo.

    - Punkt końcowy: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Domyślne kodowanie: `mulaw`
    - Domyślna częstotliwość próbkowania: `8000`
    - Domyślne wykrywanie końca wypowiedzi: `800ms`
    - Transkrypty tymczasowe: domyślnie włączone

    Strumień mediów Twilio w Voice Call wysyła ramki audio G.711 µ-law, więc
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
    `alaw`), `interimResults`, `endpointingMs` oraz `language`.

    <Note>
    Ten dostawca strumieniowania jest przeznaczony dla ścieżki transkrypcji
    w czasie rzeczywistym Voice Call. Discord voice obecnie nagrywa krótkie
    segmenty i zamiast tego używa wsadowej ścieżki transkrypcji
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Konfiguracja x_search">
    Dołączony Plugin xAI udostępnia `x_search` jako narzędzie OpenClaw do
    wyszukiwania treści X (dawniej Twitter) przez Grok.

    Ścieżka konfiguracji: `plugins.entries.xai.config.xSearch`

    | Klucz              | Typ     | Domyślnie          | Opis                                      |
    | ------------------ | ------- | ------------------ | ----------------------------------------- |
    | `enabled`          | boolean | -                  | Włącza lub wyłącza x_search               |
    | `model`            | string  | `grok-4-1-fast`    | Model używany dla żądań x_search          |
    | `baseUrl`          | string  | -                  | Nadpisanie bazowego URL xAI Responses     |
    | `inlineCitations`  | boolean | -                  | Dołącza cytowania inline w wynikach       |
    | `maxTurns`         | number  | -                  | Maksymalna liczba tur konwersacji         |
    | `timeoutSeconds`   | number  | -                  | Limit czasu żądania w sekundach           |
    | `cacheTtlMinutes`  | number  | -                  | Czas życia pamięci podręcznej w minutach  |

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
    zdalnego wykonywania kodu w środowisku sandbox xAI.

    Ścieżka konfiguracji: `plugins.entries.xai.config.codeExecution`

    | Klucz             | Typ     | Domyślnie                | Opis                                      |
    | ----------------- | ------- | ------------------------ | ----------------------------------------- |
    | `enabled`         | boolean | `true` (jeśli klucz jest dostępny) | Włącza lub wyłącza wykonywanie kodu |
    | `model`           | string  | `grok-4-1-fast`          | Model używany dla żądań wykonywania kodu  |
    | `maxTurns`        | number  | -                        | Maksymalna liczba tur konwersacji         |
    | `timeoutSeconds`  | number  | -                        | Limit czasu żądania w sekundach           |

    <Note>
    To jest zdalne wykonywanie w sandboxie xAI, a nie lokalne
    [`exec`](/pl/tools/exec).
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
    - Uwierzytelnianie odbywa się obecnie tylko przez klucz API. Klucz API może
      być przechowywany w profilu uwierzytelniania xAI, zmiennej środowiskowej
      albo konfiguracji pluginu; w OpenClaw nie ma jeszcze przepływu OAuth xAI
      ani przepływu z kodem urządzenia.
    - `grok-4.20-multi-agent-experimental-beta-0304` nie jest obsługiwany na
      normalnej ścieżce dostawcy xAI, ponieważ wymaga innej powierzchni API
      upstream niż standardowy transport xAI OpenClaw.
    - xAI Realtime voice nie jest jeszcze zarejestrowany jako dostawca OpenClaw.
      Wymaga innego kontraktu dwukierunkowej sesji głosowej niż wsadowe STT lub
      transkrypcja strumieniowa.
    - `quality` obrazu xAI, `mask` obrazu oraz dodatkowe współczynniki proporcji
      dostępne tylko natywnie nie są udostępniane, dopóki współdzielone
      narzędzie `image_generate` nie będzie mieć odpowiadających im kontrolek
      międzydostawcowych.
  </Accordion>

  <Accordion title="Uwagi zaawansowane">
    - OpenClaw automatycznie stosuje poprawki zgodności schematu narzędzi i
      wywołań narzędzi specyficzne dla xAI na współdzielonej ścieżce runnera.
    - Natywne żądania xAI domyślnie ustawiają `tool_stream: true`. Ustaw
      `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`, aby
      to wyłączyć.
    - Dołączony wrapper xAI usuwa nieobsługiwane ścisłe flagi schematu narzędzi
      oraz klucze ładunku reasoning przed wysłaniem natywnych żądań xAI.
    - `web_search`, `x_search` i `code_execution` są udostępniane jako
      narzędzia OpenClaw. OpenClaw włącza konkretną wbudowaną funkcję xAI, której
      potrzebuje, wewnątrz każdego żądania narzędzia, zamiast dołączać wszystkie
      natywne narzędzia do każdej tury czatu.
    - Grok `web_search` odczytuje `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` odczytuje `plugins.entries.xai.config.xSearch.baseUrl`, a
      następnie wraca do bazowego URL wyszukiwania webowego Grok.
    - `x_search` i `code_execution` należą do dołączonego pluginu xAI, a nie są
      zakodowane na stałe w głównym runtime modelu.
    - `code_execution` to zdalne wykonywanie w sandboxie xAI, a nie lokalne
      [`exec`](/pl/tools/exec).
  </Accordion>
</AccordionGroup>

## Testowanie na żywo

Ścieżki mediów xAI są objęte testami jednostkowymi oraz opcjonalnymi zestawami
testów na żywo. Polecenia na żywo ładują sekrety z powłoki logowania, w tym
`~/.profile`, zanim sprawdzą `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Plik na żywo specyficzny dla dostawcy syntetyzuje zwykłe TTS, przyjazne
telefonii PCM TTS, transkrybuje audio przez wsadowe STT xAI, strumieniuje to samo
PCM przez STT xAI w czasie rzeczywistym, generuje wynik tekst-na-obraz i edytuje
obraz referencyjny. Współdzielony plik na żywo dla obrazów weryfikuje tego
samego dostawcę xAI przez ścieżkę wyboru runtime OpenClaw, fallback,
normalizację oraz załączniki mediów.

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
