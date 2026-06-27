---
read_when:
    - Chcesz używać modeli Grok w OpenClaw
    - Konfigurujesz uwierzytelnianie xAI lub identyfikatory modeli
summary: Używaj modeli xAI Grok w OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:16:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw zawiera dołączony Plugin dostawcy `xai` dla modeli Grok. Dla większości
użytkowników zalecaną ścieżką jest Grok OAuth z kwalifikującą się subskrypcją
SuperGrok lub X Premium. OpenClaw pozostaje lokalny w pierwszej kolejności:
Gateway, konfiguracja, routing i narzędzia działają na Twoim komputerze, a
żądania modeli Grok uwierzytelniają się przez xAI i są wysyłane do API xAI.

OAuth nie wymaga klucza API xAI ani aplikacji Grok Build. xAI może nadal
pokazywać Grok Build na ekranie zgody, ponieważ OpenClaw używa współdzielonego
klienta OAuth xAI.

## Wybierz ścieżkę konfiguracji

Użyj ścieżki odpowiadającej stanowi instalacji OpenClaw:

<Steps>
  <Step title="Nowa instalacja OpenClaw">
    Uruchom onboarding z instalacją demona, gdy konfigurujesz nowy lokalny
    Gateway, a następnie wybierz opcję xAI/Grok OAuth w kroku modelu/uwierzytelniania:

    ```bash
    openclaw onboard --install-daemon
    ```

    Na VPS lub przez SSH wybierz bezpośrednio xAI OAuth; OpenClaw używa
    weryfikacji kodem urządzenia i nie wymaga wywołania zwrotnego localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth nie wymaga klucza API xAI. OpenClaw nie wymaga aplikacji Grok
    Build. xAI może nadal oznaczać aplikację zgody jako Grok Build, ponieważ
    OpenClaw używa współdzielonego klienta OAuth xAI.

  </Step>
  <Step title="Istniejąca instalacja OpenClaw">
    Jeśli OpenClaw jest już skonfigurowany, zaloguj się tylko do xAI. Nie
    uruchamiaj ponownie pełnego onboardingu ani nie instaluj ponownie demona
    tylko po to, aby podłączyć Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Aby po zalogowaniu ustawić Grok jako domyślny model, zastosuj to osobno:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Uruchom ponownie pełny onboarding tylko wtedy, gdy celowo chcesz zmienić
    Gateway, demona, kanał, przestrzeń roboczą lub inne opcje konfiguracji.

  </Step>
  <Step title="Ścieżka klucza API">
    Konfiguracja klucza API nadal działa dla kluczy xAI Console oraz dla
    powierzchni multimedialnych, które wymagają konfiguracji dostawcy opartej
    na kluczu:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
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
OpenClaw używa xAI Responses API jako dołączonego transportu xAI. Te same
dane uwierzytelniające z `openclaw models auth login --provider xai --method oauth` lub
`openclaw models auth login --provider xai --method api-key` mogą także zasilać pierwszoklasowe
`web_search`, `x_search`, zdalne `code_execution` oraz generowanie obrazów/wideo xAI.
Mowa i transkrypcja obecnie wymagają `XAI_API_KEY` lub konfiguracji dostawcy.
`web_search` wspierane przez Grok preferuje xAI OAuth i przełącza się awaryjnie na `XAI_API_KEY` lub
konfigurację wyszukiwania internetowego Plugin.
Jeśli zapiszesz klucz xAI pod `plugins.entries.xai.config.webSearch.apiKey`,
dołączony dostawca modeli xAI również użyje tego klucza jako opcji awaryjnej.
Ustaw `plugins.entries.xai.config.webSearch.baseUrl`, aby kierować Grok `web_search`
oraz domyślnie `x_search` przez operatorskie proxy xAI Responses.
Dostrajanie `code_execution` znajduje się pod `plugins.entries.xai.config.codeExecution`.
</Note>

## Rozwiązywanie problemów z OAuth

- Dla SSH, Docker, VPS lub innych konfiguracji zdalnych użyj
  `openclaw models auth login --provider xai --method oauth`; xAI OAuth używa
  weryfikacji kodem urządzenia zamiast wywołania zwrotnego localhost.
- Jeśli logowanie się powiedzie, ale Grok nie jest modelem domyślnym, uruchom
  `openclaw models set xai/grok-4.3`.
- Aby sprawdzić zapisane profile uwierzytelniania xAI, uruchom:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI decyduje, które konta mogą otrzymywać tokeny API OAuth. Jeśli konto nie
  kwalifikuje się, spróbuj ścieżki klucza API lub sprawdź subskrypcję po stronie xAI.

<Tip>
Użyj `xai-oauth`, gdy logujesz się z SSH, Docker lub VPS. OpenClaw wypisuje
adres URL xAI i krótki kod; dokończ logowanie w dowolnej lokalnej przeglądarce,
podczas gdy proces zdalny odpytuje xAI o ukończoną wymianę tokenu.
</Tip>

## Wbudowany katalog

OpenClaw od razu zawiera aktualne modele czatu xAI, uporządkowane w selektorach
modeli od najnowszych:

| Rodzina        | Identyfikatory modeli                                                   |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Plugin nadal rozwiązuje w przód starsze slugi Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast i Grok Code dla istniejących konfiguracji. Oficjalne aliasy Grok Code Fast
normalizują się do `grok-build-0.1`; OpenClaw nie pokazuje już pozostałych
wycofanych slugów upstream w wybieralnym katalogu.

<Tip>
Użyj `grok-4.3` do ogólnego czatu i `grok-build-0.1` do obciążeń
skoncentrowanych na budowaniu/kodowaniu, chyba że wyraźnie potrzebujesz aliasu beta Grok 4.20.
</Tip>

## Zakres funkcji OpenClaw

Dołączony Plugin mapuje aktualną publiczną powierzchnię API xAI na współdzielone
kontrakty dostawców i narzędzi OpenClaw. Możliwości, które nie pasują do
współdzielonego kontraktu (na przykład strumieniowe TTS i głos w czasie
rzeczywistym), nie są udostępniane - zobacz tabelę poniżej.

| Możliwość xAI              | Powierzchnia OpenClaw                     | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Czat / Responses           | dostawca modelu `xai/<model>`             | Tak                                                                 |
| Wyszukiwanie internetowe po stronie serwera | dostawca `web_search` `grok`              | Tak                                                                 |
| Wyszukiwanie X po stronie serwera | narzędzie `x_search`                     | Tak                                                                 |
| Wykonywanie kodu po stronie serwera | narzędzie `code_execution`                     | Tak                                                                 |
| Obrazy                     | `image_generate`                          | Tak                                                                 |
| Wideo                      | `video_generate`                          | Tak                                                                 |
| Wsadowa synteza mowy       | `messages.tts.provider: "xai"` / `tts`    | Tak                                                                 |
| Strumieniowe TTS           | -                                         | Nieudostępnione; kontrakt TTS OpenClaw zwraca kompletne bufory audio |
| Wsadowe rozpoznawanie mowy | `tools.media.audio` / rozumienie mediów | Tak                                                                 |
| Strumieniowe rozpoznawanie mowy | Voice Call `streaming.provider: "xai"`    | Tak                                                                 |
| Głos w czasie rzeczywistym | -                                         | Jeszcze nieudostępnione; inny kontrakt sesji/WebSocket              |
| Pliki / zadania wsadowe    | Tylko ogólna kompatybilność API modeli    | Nie jest pierwszoklasowym narzędziem OpenClaw                       |

<Note>
OpenClaw używa interfejsów REST API xAI dla obrazów/wideo/TTS/STT do generowania
mediów, mowy i transkrypcji wsadowej, strumieniowego WebSocket STT xAI do
transkrypcji połączeń głosowych na żywo oraz Responses API dla narzędzi
modeli, wyszukiwania i wykonywania kodu. Funkcje wymagające innych kontraktów
OpenClaw, takie jak sesje głosu w czasie rzeczywistym, są tutaj dokumentowane
jako możliwości upstream, a nie ukryte zachowanie Plugin.
</Note>

### Mapowania trybu szybkiego

`/fast on` lub `agents.defaults.models["xai/<model>"].params.fastMode: true`
przepisuje natywne żądania xAI w następujący sposób:

| Model źródłowy | Cel trybu szybkiego |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Starsze aliasy kompatybilności

Starsze aliasy nadal normalizują się do kanonicznych dołączonych identyfikatorów:

| Starszy alias             | Kanoniczny identyfikator              |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funkcje

<AccordionGroup>
  <Accordion title="Wyszukiwanie internetowe">
    Dołączony dostawca wyszukiwania internetowego `grok` preferuje xAI OAuth,
    a następnie przełącza się awaryjnie na `XAI_API_KEY` lub klucz wyszukiwania
    internetowego Plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generowanie wideo">
    Dołączony Plugin `xai` rejestruje generowanie wideo przez współdzielone
    narzędzie `video_generate`.

    - Domyślny model wideo: `xai/grok-imagine-video`
    - Tryby: tekst-na-wideo, obraz-na-wideo, generowanie z obrazu referencyjnego, zdalna
      edycja wideo i zdalne rozszerzanie wideo
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Rozdzielczości: `480P`, `720P`
    - Czas trwania: 1-15 sekund dla generowania/obrazu-na-wideo, 1-10 sekund przy
      użyciu ról `reference_image`, 2-10 sekund dla rozszerzania
    - Generowanie z obrazu referencyjnego: ustaw `imageRoles` na `reference_image` dla
      każdego dostarczonego obrazu; xAI akceptuje do 7 takich obrazów
    - Domyślny limit czasu operacji: 600 sekund, chyba że ustawiono `video_generate.timeoutMs`
      lub `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    Lokalne bufory wideo nie są akceptowane. Użyj zdalnych adresów URL `http(s)` jako
    danych wejściowych edycji/rozszerzania wideo. Obraz-na-wideo akceptuje lokalne bufory obrazów,
    ponieważ OpenClaw może zakodować je jako adresy URL danych dla xAI.
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
    Dołączony Plugin `xai` rejestruje generowanie obrazów przez współdzielone
    narzędzie `image_generate`.

    - Domyślny model obrazu: `xai/grok-imagine-image`
    - Dodatkowy model: `xai/grok-imagine-image-quality`
    - Tryby: tekst-na-obraz i edycja z obrazem referencyjnym
    - Wejścia referencyjne: jeden `image` lub do pięciu `images`
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Rozdzielczości: `1K`, `2K`
    - Liczba: do 4 obrazów
    - Domyślny limit czasu operacji: 600 sekund, chyba że ustawiono `image_generate.timeoutMs`
      lub `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw prosi xAI o odpowiedzi obrazów `b64_json`, aby wygenerowane media mogły być
    przechowywane i dostarczane przez standardową ścieżkę załączników kanału. Lokalne
    obrazy referencyjne są konwertowane na adresy URL danych; zdalne referencje `http(s)` są
    przekazywane bez zmian.

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
    takie jak `1:2`, `2:1`, `9:20` i `20:9`. OpenClaw obecnie przekazuje tylko
    wspólne, międzydostawcze ustawienia obrazu; nieobsługiwane pokrętła wyłącznie
    natywne celowo nie są udostępniane przez `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Tekst na mowę">
    Dołączony Plugin `xai` rejestruje tekst na mowę przez wspólną powierzchnię
    dostawcy `tts`.

    - Głosy: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Domyślny głos: `eve`
    - Formaty: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Język: kod BCP-47 lub `auto`
    - Szybkość: natywne nadpisanie szybkości dostawcy
    - Natywny format notatki głosowej Opus nie jest obsługiwany

    Aby używać xAI jako domyślnego dostawcy TTS:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw używa wsadowego punktu końcowego xAI `/v1/tts`. xAI oferuje też
    strumieniowe TTS przez WebSocket, ale kontrakt dostawcy mowy w OpenClaw
    obecnie oczekuje pełnego bufora audio przed dostarczeniem odpowiedzi.
    </Note>

  </Accordion>

  <Accordion title="Mowa na tekst">
    Dołączony Plugin `xai` rejestruje wsadowe przetwarzanie mowy na tekst przez
    powierzchnię transkrypcji rozumienia mediów w OpenClaw.

    - Domyślny model: `grok-stt`
    - Punkt końcowy: xAI REST `/v1/stt`
    - Ścieżka wejściowa: przesyłanie pliku audio multipart
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego
      audio używa `tools.media.audio`, w tym segmenty kanałów głosowych Discord
      i załączniki audio kanałów

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

    Język można podać przez wspólną konfigurację mediów audio albo żądanie
    transkrypcji dla pojedynczego wywołania. Wskazówki promptu są akceptowane
    przez wspólną powierzchnię OpenClaw, ale integracja xAI REST STT przekazuje
    tylko plik, model i język, ponieważ są one jednoznacznie mapowane na obecny
    publiczny punkt końcowy xAI.

  </Accordion>

  <Accordion title="Strumieniowe przetwarzanie mowy na tekst">
    Dołączony Plugin `xai` rejestruje także dostawcę transkrypcji w czasie
    rzeczywistym dla audio rozmów głosowych na żywo.

    - Punkt końcowy: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Domyślne kodowanie: `mulaw`
    - Domyślna częstotliwość próbkowania: `8000`
    - Domyślne wykrywanie końca wypowiedzi: `800ms`
    - Transkrypcje pośrednie: domyślnie włączone

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
    `alaw`), `interimResults`, `endpointingMs` i `language`.

    <Note>
    Ten dostawca strumieniowy jest przeznaczony dla ścieżki transkrypcji w
    czasie rzeczywistym Voice Call. Głos Discord obecnie nagrywa krótkie
    segmenty i zamiast tego używa wsadowej ścieżki transkrypcji
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Konfiguracja x_search">
    Dołączony Plugin xAI udostępnia `x_search` jako narzędzie OpenClaw do
    wyszukiwania treści X (dawniej Twitter) przez Grok.

    Ścieżka konfiguracji: `plugins.entries.xai.config.xSearch`

    | Klucz              | Typ     | Domyślne          | Opis                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Włącz lub wyłącz x_search            |
    | `model`            | string  | `grok-4-1-fast`    | Model używany do żądań x_search      |
    | `baseUrl`          | string  | -                  | Nadpisanie bazowego URL xAI Responses |
    | `inlineCitations`  | boolean | -                  | Uwzględnij cytowania w wierszu w wynikach |
    | `maxTurns`         | number  | -                  | Maksymalna liczba tur rozmowy        |
    | `timeoutSeconds`   | number  | -                  | Limit czasu żądania w sekundach      |
    | `cacheTtlMinutes`  | number  | -                  | Czas życia pamięci podręcznej w minutach |

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

    | Klucz             | Typ     | Domyślne          | Opis                                   |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (jeśli klucz jest dostępny) | Włącz lub wyłącz wykonywanie kodu |
    | `model`           | string  | `grok-4-1-fast`    | Model używany do żądań wykonywania kodu |
    | `maxTurns`        | number  | -                  | Maksymalna liczba tur rozmowy           |
    | `timeoutSeconds`  | number  | -                  | Limit czasu żądania w sekundach         |

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
    - Uwierzytelnianie xAI może używać klucza API, zmiennej środowiskowej,
      awaryjnej konfiguracji Pluginu albo OAuth z kwalifikującym się kontem xAI.
      OAuth używa weryfikacji kodem urządzenia bez wywołania zwrotnego localhost.
      xAI decyduje, które konta mogą otrzymywać tokeny API OAuth, a strona zgody
      może pokazywać Grok Build, mimo że OpenClaw nie wymaga aplikacji Grok Build.
    - OpenClaw obecnie nie udostępnia rodziny modeli wieloagentowych xAI. xAI
      obsługuje te modele przez Responses API, ale nie akceptują one narzędzi
      po stronie klienta ani narzędzi niestandardowych używanych przez wspólną
      pętlę agenta OpenClaw. Zobacz
      [ograniczenia wieloagentowe xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Głos xAI Realtime nie jest jeszcze zarejestrowany jako dostawca OpenClaw.
      Wymaga innego kontraktu dwukierunkowej sesji głosowej niż wsadowe STT lub
      transkrypcja strumieniowa.
    - `quality` obrazu xAI, `mask` obrazu oraz dodatkowe proporcje wyłącznie
      natywne nie są udostępniane, dopóki wspólne narzędzie `image_generate`
      nie będzie mieć odpowiadających im międzydostawczych ustawień.
  </Accordion>

  <Accordion title="Uwagi zaawansowane">
    - OpenClaw automatycznie stosuje poprawki zgodności schematów narzędzi i
      wywołań narzędzi specyficzne dla xAI na wspólnej ścieżce uruchamiania.
    - Natywne żądania xAI domyślnie ustawiają `tool_stream: true`. Ustaw
      `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`, aby
      to wyłączyć.
    - Dołączony wrapper xAI usuwa nieobsługiwane rygorystyczne flagi schematu
      narzędzi oraz klucze payloadu *wysiłku* rozumowania przed wysłaniem
      natywnych żądań xAI. Tylko `grok-4.3` / `grok-4.3-*` deklarują
      konfigurowalny wysiłek rozumowania; wszystkie pozostałe modele xAI zdolne
      do rozumowania nadal żądają `include: ["reasoning.encrypted_content"]`,
      aby wcześniejsze zaszyfrowane rozumowanie można było odtworzyć w kolejnych
      turach.
    - `web_search`, `x_search` i `code_execution` są udostępniane jako narzędzia
      OpenClaw. OpenClaw włącza konkretną wbudowaną funkcję xAI potrzebną w
      każdym żądaniu narzędzia, zamiast dołączać wszystkie natywne narzędzia do
      każdej tury czatu.
    - Grok `web_search` odczytuje `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` odczytuje `plugins.entries.xai.config.xSearch.baseUrl`, a
      następnie wraca awaryjnie do bazowego URL wyszukiwania w sieci Grok.
    - `x_search` i `code_execution` należą do dołączonego Pluginu xAI, a nie są
      zakodowane na stałe w głównym runtime modeli.
    - `code_execution` to zdalne wykonywanie w piaskownicy xAI, a nie lokalne
      [`exec`](/pl/tools/exec).
  </Accordion>
</AccordionGroup>

## Testowanie na żywo

Ścieżki mediów xAI są objęte testami jednostkowymi i opcjonalnie włączanymi
zestawami testów na żywo. Wyeksportuj `XAI_API_KEY` w środowisku procesu przed
uruchomieniem prób na żywo.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Plik testów na żywo specyficzny dla dostawcy syntetyzuje zwykłe TTS,
przyjazne telefonii PCM TTS, transkrybuje audio przez wsadowe STT xAI,
strumieniuje ten sam PCM przez xAI realtime STT, generuje wynik tekst-na-obraz
i edytuje obraz referencyjny. Wspólny plik testów na żywo obrazów weryfikuje
tego samego dostawcę xAI przez ścieżkę wyboru runtime OpenClaw, fallbacku,
normalizacji i załączników mediów.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Wszyscy dostawcy" href="/pl/providers/index" icon="grid-2">
    Szerszy przegląd dostawców.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i poprawki.
  </Card>
</CardGroup>
