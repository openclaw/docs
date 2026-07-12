---
read_when:
    - Chcesz używać modeli Grok w OpenClaw
    - Konfigurujesz uwierzytelnianie xAI lub identyfikatory modeli
summary: Używaj modeli xAI Grok w OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-12T15:32:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw zawiera wbudowany plugin dostawcy `xai` dla modeli Grok. Zalecaną metodą jest Grok OAuth z kwalifikującą się subskrypcją SuperGrok lub X Premium. Gateway, konfiguracja, routing i narzędzia pozostają lokalne; tylko żądania Grok trafiają do API xAI.

OAuth nie wymaga klucza API xAI ani aplikacji Grok Build. xAI może nadal wyświetlać Grok Build na ekranie zgody, ponieważ OpenClaw korzysta ze współdzielonego klienta OAuth xAI.

## Konfiguracja

<Steps>
  <Step title="Nowa instalacja">
    Uruchom proces wdrażania wraz z instalacją demona, a następnie wybierz xAI/Grok OAuth na etapie modelu/uwierzytelniania:

    ```bash
    openclaw onboard --install-daemon
    ```

    Na serwerze VPS lub przez SSH wybierz bezpośrednio xAI OAuth; korzysta on z weryfikacji kodem urządzenia i nie wymaga wywołania zwrotnego do localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Istniejąca instalacja">
    Zaloguj się tylko do xAI; nie uruchamiaj ponownie pełnego procesu wdrażania wyłącznie po to, aby połączyć Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Ustaw Grok jako model domyślny osobno:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Uruchom ponownie pełny proces wdrażania tylko wtedy, gdy celowo chcesz zmienić Gateway, demona, kanał, obszar roboczy lub inne opcje konfiguracji.

  </Step>
  <Step title="Metoda z kluczem API">
    Konfiguracja z kluczem API nadal działa z kluczami xAI Console oraz dla funkcji multimedialnych, które wymagają konfiguracji dostawcy opartej na kluczu:

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
OpenClaw używa interfejsu xAI Responses API jako wbudowanego transportu xAI. Te same dane uwierzytelniające uzyskane za pomocą `openclaw models auth login --provider xai --method oauth` lub `--method api-key` obsługują również `web_search` (identyfikator dostawcy `grok`), `x_search`, `code_execution`, syntezę/transkrypcję mowy oraz generowanie obrazów i filmów przez xAI. Jeśli zapiszesz klucz xAI w `plugins.entries.xai.config.webSearch.apiKey`, wbudowany dostawca modeli xAI również użyje go jako rozwiązania rezerwowego.
</Note>

## Rozwiązywanie problemów z OAuth

- W przypadku SSH, Dockera, VPS lub innych konfiguracji zdalnych użyj `openclaw models auth login --provider xai --method oauth`; polecenie korzysta z weryfikacji kodem urządzenia, a nie z wywołania zwrotnego do localhost.
- Jeśli logowanie zakończy się powodzeniem, ale Grok nie będzie modelem domyślnym, uruchom `openclaw models set xai/grok-4.3`.
- Sprawdź zapisane profile uwierzytelniania xAI:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI decyduje, które konta mogą otrzymywać tokeny API OAuth. Jeśli konto nie spełnia wymagań, użyj metody z kluczem API lub sprawdź subskrypcję po stronie xAI.

<Tip>
Używaj `xai-oauth` podczas logowania przez SSH, Dockera lub VPS. OpenClaw wyświetla adres URL i krótki kod; dokończ logowanie w dowolnej lokalnej przeglądarce, podczas gdy proces zdalny odpytuje xAI o zakończenie wymiany tokenu.
</Tip>

## Wbudowany katalog

Identyfikatory dostępne w selektorach modeli. Plugin nadal rozpoznaje starsze identyfikatory Grok 3, Grok 4, Grok 4 Fast, Grok 4.1 Fast i Grok Code używane w istniejących konfiguracjach; zobacz [zgodność ze starszymi wersjami i zmienne aliasy](#legacy-compatibility-and-moving-aliases).

| Rodzina        | Identyfikatory modeli                                        |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (aliasy: `grok-4.5-latest`, `grok-build-latest`)  |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (aliasy: `grok-4.3-latest`, `grok-latest`)        |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Używaj `grok-4.5` do ogólnych rozmów, programowania i pracy agentowej tam, gdzie jest dostępny. Grok 4.3 pozostaje bezpiecznym regionalnie domyślnym modelem konfiguracji; `grok-build-0.1` oraz oba datowane warianty Grok 4.20 nadal można wybierać.
</Tip>

## Zakres funkcji

Wbudowany plugin odwzorowuje obsługiwane interfejsy API xAI na współdzielone kontrakty dostawców i narzędzi OpenClaw. Możliwości, które nie pasują do współdzielonego kontraktu, wymieniono poniżej lub w sekcji znanych ograniczeń.

| Możliwość xAI                         | Powierzchnia OpenClaw                    | Stan                                                               |
| ------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| Czat / Responses                      | dostawca modelu `xai/<model>`            | Tak                                                                |
| Wyszukiwanie internetowe po stronie serwera | dostawca `grok` narzędzia `web_search` | Tak                                                                |
| Wyszukiwanie w X po stronie serwera   | narzędzie `x_search`                     | Tak                                                                |
| Wykonywanie kodu po stronie serwera   | narzędzie `code_execution`               | Tak                                                                |
| Obrazy                                | `image_generate`                         | Tak                                                                |
| Filmy                                 | `video_generate`                         | Klasyczny pełny przepływ pracy; obraz na film w Video 1.5          |
| Wsadowa synteza mowy                  | `messages.tts.provider: "xai"` / `tts`   | Tak                                                                |
| Strumieniowa synteza mowy             | -                                        | Niezaimplementowana jeszcze przez dostawcę xAI                     |
| Wsadowa transkrypcja mowy             | rozumienie multimediów `tools.media.audio` | Tak                                                              |
| Strumieniowa transkrypcja mowy        | `streaming.provider: "xai"` w Voice Call | Tak                                                                |
| Głos w czasie rzeczywistym            | -                                        | Jeszcze nieudostępniony; wymaga innego kontraktu sesji/WebSocketu  |
| Pliki / zadania wsadowe               | Tylko ogólna zgodność z API modelu       | Nie jest pełnoprawnym narzędziem OpenClaw                          |

<Note>
OpenClaw używa interfejsów REST API xAI do obsługi obrazów, filmów, TTS i STT w celu generowania multimediów i transkrypcji wsadowej, strumieniowego WebSocketu STT xAI do transkrypcji rozmów głosowych na żywo oraz interfejsu Responses API do obsługi czatu, wyszukiwania i narzędzi wykonujących kod.
</Note>

### Zgodność ze starszym trybem szybkim

`/fast on` lub `agents.defaults.models["xai/<model>"].params.fastMode: true` nadal przekształca starsze konfiguracje xAI w następujący sposób. Te identyfikatory docelowe są zachowywane wyłącznie ze względu na zgodność; w nowych konfiguracjach używaj obecnie dostępnych modeli.

| Model źródłowy | Cel trybu szybkiego |
| -------------- | ------------------- |
| `grok-3`       | `grok-3-fast`       |
| `grok-3-mini`  | `grok-3-mini-fast`  |
| `grok-4`       | `grok-4-fast`       |
| `grok-4-0709`  | `grok-4-fast`       |

### Zgodność ze starszymi wersjami i zmienne aliasy

Starsze aliasy są normalizowane następująco:

| Starszy alias                                                  | Znormalizowany identyfikator |
| -------------------------------------------------------------- | ---------------------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825`  | `grok-build-0.1`             |

Datowane identyfikatory 0309 są wpisami dostępnymi w katalogu. OpenClaw wysyła wszystkie pozostałe bieżące aliasy Grok 4.20 bez zmian, aby xAI zachowało kontrolę nad semantyką aliasów stabilnych, najnowszych, beta, eksperymentalnych i datowanych. Globalny alias `grok-latest` również jest zachowywany bez zmian.

xAI wycofało następujące dokładne identyfikatory. OpenClaw zachowuje je jako ukryte wpisy zgodności dla wydanych konfiguracji, z limitami i cenami ich bieżących celów przekierowania:

| Wycofane identyfikatory                                               | Bieżące zachowanie                          |
| --------------------------------------------------------------------- | ------------------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`     | Grok 4.3 z poziomem rozumowania `low`       |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3`  | Grok 4.3 z wyłączonym rozumowaniem          |
| `grok-code-fast-1`                                                    | Grok Build 0.1                              |
| `grok-imagine-image-pro`                                              | Grok Imagine Image Quality                  |

`openclaw doctor --fix` aktualizuje utrwalone wartości domyślne narzędzi serwerowych xAI i wycofany identyfikator obrazu o jakości premium, usuwa nieaktualne wygenerowane wpisy katalogu oraz naprawia nieaktualne metadane kontekstu w aktywnych wpisach 4.20. Nie przypina aktywnych aliasów 4.20 `beta-latest` do datowanej migawki.

## Funkcje

<Warning>
  `x_search` i `code_execution` działają na serwerach xAI. xAI nalicza 5 USD za 1000 wywołań narzędzi, a dodatkowo opłaty za tokeny wejściowe i wyjściowe modelu. Jeśli ustawienie `enabled` danego narzędzia zostanie pominięte, OpenClaw udostępnia je tylko dla aktywnego modelu xAI. Znany dostawca modelu inny niż xAI wymaga jawnego ustawienia `enabled: true` dla każdego narzędzia; brakujący lub nierozpoznany dostawca powoduje bezpieczną odmowę działania. Uwierzytelnianie xAI jest zawsze wymagane, a `enabled: false` wyłącza narzędzie dla każdego dostawcy.
</Warning>

<AccordionGroup>
  <Accordion title="Wyszukiwanie internetowe">
    Wbudowany dostawca wyszukiwania internetowego `grok` preferuje xAI OAuth, a następnie korzysta awaryjnie z `XAI_API_KEY` lub klucza wyszukiwania internetowego pluginu:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generowanie filmów">
    Wbudowany plugin `xai` rejestruje generowanie filmów za pośrednictwem współdzielonego narzędzia `video_generate`.

    - Model domyślny: `xai/grok-imagine-video`
    - Dodatkowy model: `xai/grok-imagine-video-1.5`
    - Tryby klasyczne: tekst na film, obraz na film, generowanie na podstawie obrazu referencyjnego, zdalna edycja filmu i zdalne rozszerzanie filmu
    - Tryb Video 1.5: tylko obraz na film, z dokładnie jednym obrazem pierwszej klatki
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`; po pominięciu tej wartości klasyczne generowanie obrazu na film i generowanie obrazu na film w Video 1.5 dziedziczą proporcje obrazu źródłowego
    - Rozdzielczości: klasyczne `480P`/`720P`; Video 1.5 obsługuje również `1080P`; wszystkie tryby generowania domyślnie używają `480P`
    - Czas trwania: 1–15 sekund w przypadku generowania/obrazu na film, 1–10 sekund przy używaniu klasycznych ról `reference_image`, 2–10 sekund w przypadku klasycznego rozszerzania
    - Generowanie na podstawie obrazów referencyjnych: ustaw `imageRoles` na `reference_image` dla każdego dostarczonego obrazu; xAI akceptuje maksymalnie 7 takich obrazów
    - Edycja/rozszerzanie filmu dziedziczy proporcje obrazu i rozdzielczość filmu wejściowego; te operacje nie przyjmują nadpisań geometrii
    - Domyślny limit czasu operacji: 600 sekund, chyba że ustawiono `video_generate.timeoutMs` lub `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    Lokalne bufory filmów nie są akceptowane. Używaj zdalnych adresów URL `http(s)` jako danych wejściowych operacji edycji/rozszerzania filmu. Funkcja obrazu na film akceptuje lokalne bufory obrazów, ponieważ OpenClaw koduje je jako adresy URL danych dla xAI.
    </Warning>

    Video 1.5 rozpoznaje również identyfikatory xAI `grok-imagine-video-1.5-preview` i `grok-imagine-video-1.5-2026-05-30`. OpenClaw przekazuje wybrany identyfikator bez zmian, ale stosuje tę samą walidację dopuszczającą wyłącznie obrazy.

    Aby używać xAI jako domyślnego dostawcy filmów:

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
    Zobacz [Generowanie filmów](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i działanie mechanizmu przełączania awaryjnego.
    </Note>

  </Accordion>

  <Accordion title="Generowanie obrazów">
    Wbudowany plugin `xai` rejestruje generowanie obrazów za pośrednictwem współdzielonego narzędzia `image_generate`.

    - Domyślny model obrazów: `xai/grok-imagine-image`
    - Dodatkowy model: `xai/grok-imagine-image-quality`
    - Tryby: tekst na obraz oraz edycja obrazu referencyjnego
    - Dane referencyjne: jeden `image` lub maksymalnie trzy `images`
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Rozdzielczości: `1K`, `2K`
    - Liczba: maksymalnie 4 obrazy
    - Domyślny limit czasu operacji: 600 sekund, chyba że ustawiono `image_generate.timeoutMs`
      lub `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw żąda od xAI odpowiedzi obrazowych `b64_json`, aby wygenerowane multimedia
    mogły być przechowywane i dostarczane standardową ścieżką załączników kanału. Lokalne
    obrazy referencyjne są konwertowane na adresy URL danych; zdalne odwołania `http(s)`
    są przekazywane bez zmian.

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
    xAI dokumentuje również `quality`, `mask`, `user` oraz proporcję obrazu `auto`.
    Obecnie OpenClaw przekazuje wyłącznie współdzielone między dostawcami ustawienia obrazów;
    te opcje właściwe tylko dla xAI nie są udostępniane przez `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Synteza mowy">
    Wbudowany plugin `xai` rejestruje syntezę mowy za pośrednictwem współdzielonego
    interfejsu dostawcy `tts`.

    - Głosy: uwierzytelniony katalog na żywo z xAI; wyświetl go za pomocą
      `openclaw infer tts voices --provider xai`
    - Zapasowe głosy offline: `ara`, `eve`, `leo`, `rex`, `sal`
    - Domyślny głos: `eve`
    - Identyfikatory niestandardowych głosów konta są przekazywane nawet wtedy, gdy nie występują
      w odpowiedzi wbudowanego katalogu
    - Formaty: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Język: kod BCP-47 lub `auto`
    - Szybkość: natywne dla dostawcy nadpisanie szybkości
    - Natywny format wiadomości głosowych Opus nie jest obsługiwany

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
    OpenClaw używa wsadowego punktu końcowego xAI `/v1/tts` oraz uwierzytelnionego
    katalogu `/v1/tts/voices`. xAI oferuje również strumieniowe TTS przez WebSocket, ale
    wbudowany dostawca xAI nie implementuje jeszcze tego mechanizmu strumieniowania.
    </Note>

  </Accordion>

  <Accordion title="Rozpoznawanie mowy">
    Wbudowany plugin `xai` rejestruje wsadowe rozpoznawanie mowy za pośrednictwem
    interfejsu transkrypcji analizy multimediów OpenClaw.

    - Punkt końcowy: REST xAI `/v1/stt`
    - Ścieżka wejściowa: przesyłanie pliku dźwiękowego jako multipart
    - Wybór modelu: xAI wybiera model transkrypcji wewnętrznie; punkt
      końcowy nie ma selektora modelu
    - Używane wszędzie tam, gdzie transkrypcja przychodzącego dźwięku odczytuje `tools.media.audio`,
      w tym dla segmentów kanałów głosowych Discord i załączników dźwiękowych kanałów

    Aby wymusić użycie xAI do transkrypcji przychodzącego dźwięku:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    Język można podać we współdzielonej konfiguracji multimediów dźwiękowych lub w żądaniu
    transkrypcji dla konkretnego wywołania. Współdzielony interfejs OpenClaw przyjmuje wskazówki
    w prompcie, ale integracja REST STT z xAI przekazuje wyłącznie plik i język,
    ponieważ tylko one odpowiadają bieżącemu publicznemu punktowi końcowemu xAI.

  </Accordion>

  <Accordion title="Strumieniowe rozpoznawanie mowy">
    Wbudowany plugin `xai` rejestruje również dostawcę transkrypcji w czasie rzeczywistym
    dla dźwięku z połączeń głosowych na żywo.

    - Punkt końcowy: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Domyślne kodowanie: `mulaw`
    - Domyślna częstotliwość próbkowania: `8000`
    - Domyślne wykrywanie końca wypowiedzi: `800ms`
    - Transkrypcje częściowe: domyślnie włączone

    Strumień multimediów Twilio funkcji Voice Call wysyła ramki dźwięku G.711 mu-law, dlatego
    dostawca xAI przekazuje te ramki bezpośrednio, bez transkodowania:

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
    `alaw`), `interimResults`, `endpointingMs` oraz `language`.

    <Note>
    Ten dostawca strumieniowy służy ścieżce transkrypcji w czasie rzeczywistym funkcji Voice Call.
    Discord nagrywa krótkie segmenty i zamiast tego używa wsadowej ścieżki transkrypcji
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Konfiguracja x_search">
    Wbudowany plugin xAI udostępnia `x_search` jako narzędzie OpenClaw do
    wyszukiwania treści w X (dawniej Twitter) za pośrednictwem Grok.

    Ścieżka konfiguracji: `plugins.entries.xai.config.xSearch`

    | Klucz             | Typ     | Wartość domyślna          | Opis                                             |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | Automatycznie dla modeli xAI | Wyłącz lub włącz dla znanego dostawcy innego niż xAI |
    | `model`           | string  | `grok-4.3`                | Model używany do żądań x_search                  |
    | `baseUrl`         | string  | -                          | Nadpisanie bazowego adresu URL Responses xAI     |
    | `inlineCitations` | boolean | -                          | Dołącz cytowania w tekście do wyników            |
    | `maxTurns`        | number  | -                          | Maksymalna liczba tur konwersacji                 |
    | `timeoutSeconds`  | number  | `30`                       | Limit czasu żądania w sekundach                   |
    | `cacheTtlMinutes` | number  | `15`                       | Czas życia pamięci podręcznej w minutach          |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
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
    Wbudowany plugin xAI udostępnia `code_execution` jako narzędzie OpenClaw do
    zdalnego wykonywania kodu w środowisku piaskownicy xAI.

    Ścieżka konfiguracji: `plugins.entries.xai.config.codeExecution`

    | Klucz            | Typ     | Wartość domyślna          | Opis                                             |
    | ---------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`        | boolean | Automatycznie dla modeli xAI | Wyłącz lub włącz dla znanego dostawcy innego niż xAI |
    | `model`          | string  | `grok-4.3`                | Model używany do żądań wykonania kodu            |
    | `maxTurns`       | number  | -                          | Maksymalna liczba tur konwersacji                |
    | `timeoutSeconds` | number  | `30`                       | Limit czasu żądania w sekundach                  |

    <Note>
    Jest to zdalne wykonywanie w piaskownicy xAI, a nie lokalne [`exec`](/pl/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Znane ograniczenia">
    - Uwierzytelnianie xAI może korzystać z klucza API, zmiennej środowiskowej, zapasowej
      konfiguracji pluginu lub OAuth z kwalifikującym się kontem xAI. OAuth korzysta
      z weryfikacji kodem urządzenia bez wywołania zwrotnego do localhost. xAI decyduje,
      które konta mogą otrzymywać tokeny API OAuth, a strona zgody może wyświetlać Grok Build,
      mimo że OpenClaw nie wymaga aplikacji Grok Build.
    - OpenClaw obecnie nie udostępnia rodziny modeli wieloagentowych xAI. xAI
      obsługuje te modele przez interfejs Responses API, ale nie przyjmują one
      narzędzi klienckich ani niestandardowych używanych przez współdzieloną pętlę agentów OpenClaw.
      Zobacz
      [ograniczenia modeli wieloagentowych xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Głos xAI Realtime nie jest jeszcze zarejestrowany jako dostawca OpenClaw.
      Wymaga innego kontraktu dwukierunkowej sesji głosowej niż wsadowe STT
      lub transkrypcja strumieniowa.
    - Parametr `quality` obrazów xAI, `mask` obrazu oraz natywna proporcja obrazu `auto`
      nie są udostępniane, dopóki współdzielone narzędzie `image_generate` nie otrzyma
      odpowiednich ustawień między dostawcami.
  </Accordion>

  <Accordion title="Uwagi zaawansowane">
    - OpenClaw automatycznie stosuje poprawki zgodności schematu narzędzi i wywołań
      narzędzi specyficzne dla xAI we współdzielonej ścieżce uruchamiającej.
    - Natywne żądania xAI domyślnie ustawiają `tool_stream: true`. Ustaw
      `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`,
      aby to wyłączyć.
    - Wbudowana warstwa xAI usuwa nieobsługiwane ograniczenia liczby elementów `contains`
      w schemacie oraz nieobsługiwane klucze ładunku *poziomu* rozumowania przed wysłaniem natywnych
      żądań xAI. Grok 4.5 obsługuje niski, średni i
      wysoki poziom (domyślnie wysoki). Grok 4.3 obsługuje brak, niski, średni i wysoki
      poziom (domyślnie niski). Inne modele xAI zdolne do rozumowania nie udostępniają
      konfigurowalnego sterowania poziomem, ale nadal żądają
      `include: ["reasoning.encrypted_content"]`, aby wcześniejsze zaszyfrowane rozumowanie
      mogło zostać ponownie użyte w kolejnych turach.
    - `web_search`, `x_search` i `code_execution` są udostępniane jako narzędzia OpenClaw.
      OpenClaw dołącza do żądania każdego narzędzia wyłącznie konkretną wbudowaną funkcję xAI,
      której ono potrzebuje, zamiast dołączać wszystkie natywne narzędzia do każdej
      tury czatu.
    - `web_search` Grok odczytuje `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` odczytuje `plugins.entries.xai.config.xSearch.baseUrl`, a następnie
      używa zapasowo bazowego adresu URL wyszukiwania internetowego Grok.
    - `x_search` i `code_execution` należą do wbudowanego pluginu xAI,
      zamiast być zakodowane na stałe w podstawowym środowisku wykonawczym modelu.
    - `code_execution` to zdalne wykonywanie w piaskownicy xAI, a nie lokalne
      [`exec`](/pl/tools/exec).
  </Accordion>
</AccordionGroup>

## Testy na żywo

Ścieżki multimedialne xAI są objęte testami jednostkowymi i opcjonalnymi zestawami testów
na żywo. Przed uruchomieniem testów na żywo wyeksportuj `XAI_API_KEY` w środowisku procesu.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Plik testów na żywo specyficzny dla dostawcy syntetyzuje standardową mowę TTS, przyjazną dla telefonii mowę TTS w formacie PCM, transkrybuje dźwięk za pomocą wsadowego STT xAI, przesyła strumieniowo ten sam dźwięk PCM przez STT czasu rzeczywistego xAI, generuje obraz na podstawie tekstu i edytuje obraz referencyjny.
Współdzielony plik testów obrazu na żywo weryfikuje tego samego dostawcę xAI za pośrednictwem ścieżki wyboru środowiska wykonawczego, mechanizmu rezerwowego, normalizacji i załączników multimedialnych OpenClaw. Opcjonalny przypadek Video 1.5 przesyła jeden wygenerowany obraz pierwszej klatki w rozdzielczości 1080P i weryfikuje pobranie ukończonego filmu.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Generowanie filmów" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia do generowania filmów i wybór dostawcy.
  </Card>
  <Card title="Wszyscy dostawcy" href="/pl/providers/index" icon="grid-2">
    Szersze omówienie dostawców.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i rozwiązania.
  </Card>
</CardGroup>
