---
read_when:
    - Chcesz używać modeli Grok w OpenClaw
    - Konfigurujesz uwierzytelnianie xAI lub identyfikatory modeli
summary: Używanie modeli xAI Grok w OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-16T19:04:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw zawiera wbudowaną wtyczkę dostawcy `xai` dla modeli Grok. Zalecanym
rozwiązaniem jest Grok OAuth z kwalifikującą się subskrypcją SuperGrok lub X Premium.
Gateway, konfiguracja, routing i narzędzia pozostają lokalne; tylko żądania
Grok trafiają do API xAI.

OAuth nie wymaga klucza API xAI ani aplikacji Grok Build. xAI może nadal
wyświetlać Grok Build na ekranie zgody, ponieważ OpenClaw korzysta ze wspólnego
klienta OAuth xAI.

## Konfiguracja

<Steps>
  <Step title="Nowa instalacja">
    Uruchom proces wdrażania z instalacją demona, a następnie wybierz xAI/Grok OAuth na
    etapie modelu/uwierzytelniania:

    ```bash
    openclaw onboard --install-daemon
    ```

    Na serwerze VPS lub przez SSH wybierz bezpośrednio xAI OAuth; korzysta on z
    weryfikacji kodem urządzenia i nie wymaga wywołania zwrotnego localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Istniejąca instalacja">
    Zaloguj się tylko do xAI; nie uruchamiaj ponownie całego procesu wdrażania wyłącznie w celu połączenia z Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Ustaw Grok jako model domyślny osobno:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Uruchom ponownie pełny proces wdrażania tylko wtedy, gdy zamierzasz zmienić Gateway,
    demona, kanał, przestrzeń roboczą lub inne opcje konfiguracji.

  </Step>
  <Step title="Konfiguracja z kluczem API">
    Konfiguracja z kluczem API nadal działa dla kluczy xAI Console oraz interfejsów
    multimedialnych wymagających konfiguracji dostawcy opartej na kluczu:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Wybór modelu">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw używa interfejsu xAI Responses API jako wbudowanego transportu xAI. Te same
dane uwierzytelniające z `openclaw models auth login --provider xai --method oauth` lub
`--method api-key` obsługują również `web_search` (identyfikator dostawcy `grok`), `x_search`,
`code_execution`, mowę/transkrypcję oraz generowanie obrazów i filmów xAI. Jeśli
klucz xAI jest przechowywany w `plugins.entries.xai.config.webSearch.apiKey`,
wbudowany dostawca modeli xAI używa go również jako rozwiązania rezerwowego.
</Note>

## Rozwiązywanie problemów z OAuth

- W przypadku SSH, Dockera, VPS lub innych konfiguracji zdalnych użyj
  `openclaw models auth login --provider xai --method oauth`; korzysta on z
  weryfikacji kodem urządzenia, a nie wywołania zwrotnego localhost.
- Jeśli logowanie zakończy się powodzeniem, ale Grok nie jest modelem domyślnym, uruchom
  `openclaw models set xai/grok-4.3`.
- Sprawdź zapisane profile uwierzytelniania xAI:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI określa, które konta mogą otrzymywać tokeny API OAuth. Jeśli konto
  nie spełnia wymagań, użyj konfiguracji z kluczem API lub sprawdź subskrypcję po stronie xAI.

<Tip>
Użyj `xai-oauth` podczas logowania przez SSH, Dockera lub VPS. OpenClaw wyświetli
adres URL i krótki kod; dokończ logowanie w dowolnej lokalnej przeglądarce, podczas gdy zdalny
proces będzie odpytywał xAI o zakończenie wymiany tokenu.
</Tip>

## Wbudowany katalog

Identyfikatory dostępne w selektorach modeli. Wtyczka nadal rozpoznaje starsze identyfikatory Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast i Grok Code dla istniejących konfiguracji;
zobacz [zgodność ze starszymi wersjami i zmienne aliasy](#legacy-compatibility-and-moving-aliases).

| Rodzina        | Identyfikatory modeli                                         |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (aliasy: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (aliasy: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Używaj `grok-4.5` do ogólnych rozmów, programowania i zadań agentowych, gdy jest dostępny.
Grok 4.3 pozostaje bezpiecznym regionalnie domyślnym modelem konfiguracji; `grok-build-0.1` i oba
datowane warianty Grok 4.20 pozostają dostępne do wyboru.
</Tip>

## Zakres funkcji

Wbudowana wtyczka odwzorowuje obsługiwane interfejsy API xAI na wspólne kontrakty dostawców i
narzędzi OpenClaw. Możliwości, które nie mieszczą się we wspólnym kontrakcie, wymieniono
poniżej lub w sekcji znanych ograniczeń.

| Możliwość xAI              | Interfejs OpenClaw                       | Stan                                                 |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Czat / Responses           | dostawca modelu `xai/<model>`            | Tak                                                  |
| Wyszukiwanie w sieci po stronie serwera | dostawca `web_search` `grok`            | Tak                                                  |
| Wyszukiwanie w X po stronie serwera | narzędzie `x_search`                         | Tak                                                  |
| Wykonywanie kodu po stronie serwera | narzędzie `code_execution`                   | Tak                                                  |
| Obrazy                     | `image_generate`                        | Tak                                                  |
| Filmy                      | `video_generate`                        | Tak                                                  |
| Wsadowa synteza mowy       | `messages.tts.provider: "xai"` / `tts`  | Tak                                                  |
| Strumieniowe TTS           | `textToSpeechStream`                    | Tak, przez `wss://api.x.ai/v1/tts` (nie głos w czasie rzeczywistym) |
| Wsadowe rozpoznawanie mowy | rozumienie multimediów `tools.media.audio` | Tak                                                  |
| Strumieniowe rozpoznawanie mowy | Voice Call `streaming.provider: "xai"`  | Tak                                                  |
| Głos w czasie rzeczywistym | Talk `talk.realtime.provider: "xai"`    | Tak; przekazywanie przez Gateway dla natywnych węzłów Talk |
| Pliki / zadania wsadowe    | Tylko ogólna zgodność z API modelu       | Nie jest pełnoprawnym narzędziem OpenClaw            |

<Note>
OpenClaw używa interfejsów REST API xAI dla obrazów/filmów/TTS/STT do generowania multimediów i
transkrypcji wsadowej, strumieniowego WebSocket STT xAI do transkrypcji rozmów głosowych
na żywo, WebSocket Grok Voice Agent xAI do sesji Talk w czasie rzeczywistym
oraz Responses API do czatu, wyszukiwania i narzędzi wykonywania kodu.
</Note>

### Zgodność ze starszym trybem szybkim

`/fast on` lub `agents.defaults.models["xai/<model>"].params.fastMode: true`
nadal przekształca starsze konfiguracje xAI w następujący sposób. Te identyfikatory docelowe są
zachowywane wyłącznie dla zgodności; w nowych konfiguracjach używaj obecnie
dostępnych modeli.

| Model źródłowy | Cel trybu szybkiego |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Zgodność ze starszymi wersjami i zmienne aliasy

Starsze aliasy są normalizowane w następujący sposób:

| Starszy alias                                                  | Znormalizowany identyfikator |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

Datowane identyfikatory 0309 są pozycjami dostępnymi w katalogu. OpenClaw wysyła wszystkie pozostałe
bieżące aliasy Grok 4.20 bez zmian, aby xAI zachowywało kontrolę nad semantyką aliasów stabilnych, najnowszych,
beta, eksperymentalnych i datowanych. Globalny alias `grok-latest` jest
również zachowywany bez zmian.

xAI wycofało następujące dokładne identyfikatory. OpenClaw zachowuje je jako ukryte wiersze zgodności
dla wdrożonych konfiguracji, z ograniczeniami i cenami ich bieżących
celów przekierowania:

| Wycofane identyfikatory                                             | Bieżące zachowanie               |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 z rozumowaniem `low`    |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 z wyłączonym rozumowaniem |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality       |

`openclaw doctor --fix` aktualizuje utrwalone ustawienia domyślne narzędzi serwerowych xAI oraz
wycofaną nazwę uproszczoną obrazu jakościowego, usuwa nieaktualne wygenerowane wiersze katalogu i naprawia
nieaktualne metadane kontekstu w aktywnych wierszach 4.20. Nie przypina aktywnych aliasów
`beta-latest` wersji 4.20 do datowanej migawki.

## Funkcje

<Warning>
  `x_search` i `code_execution` działają na serwerach xAI. xAI nalicza 5 USD za 1000
  wywołań narzędzi oraz opłaty za tokeny wejściowe i wyjściowe modelu. Gdy ustawienie
  `enabled` każdego narzędzia zostanie pominięte, OpenClaw udostępnia je tylko dla aktywnego modelu xAI.
  Znany dostawca modelu innego niż xAI wymaga jawnego ustawienia `enabled: true` dla każdego narzędzia;
  brakujący lub nierozpoznany dostawca powoduje bezpieczną odmowę działania. Uwierzytelnianie xAI jest zawsze wymagane,
  a `enabled: false` wyłącza narzędzie dla każdego dostawcy.
</Warning>

<AccordionGroup>
  <Accordion title="Wyszukiwanie w sieci">
    Wbudowany dostawca wyszukiwania w sieci `grok` preferuje xAI OAuth, a następnie korzysta
    awaryjnie z `XAI_API_KEY` lub klucza wyszukiwania w sieci wtyczki:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generowanie filmów">
    Wbudowana wtyczka `xai` rejestruje generowanie filmów za pomocą wspólnego
    narzędzia `video_generate`.

    - Model domyślny: `xai/grok-imagine-video`
    - Dodatkowy model: `xai/grok-imagine-video-1.5`
    - Tryby klasyczne: tekst na film, obraz na film, generowanie z obrazu referencyjnego,
      zdalna edycja filmu i zdalne rozszerzanie filmu
    - Tryb Video 1.5: tylko obraz na film, z dokładnie jednym obrazem pierwszej klatki
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      tryb klasyczny oraz obraz na film w Video 1.5 dziedziczą proporcje obrazu źródłowego, gdy
      wartość zostanie pominięta
    - Rozdzielczości: klasyczne `480P`/`720P`; Video 1.5 obsługuje także `1080P`; wszystkie
      tryby generowania domyślnie używają `480P`
    - Czas trwania: 1–15 sekund dla generowania/obrazu na film, 1–10 sekund podczas
      używania klasycznych ról `reference_image`, 2–10 sekund dla klasycznego rozszerzania
    - Generowanie z obrazu referencyjnego: ustaw `imageRoles` na `reference_image` dla
      każdego dostarczonego obrazu; xAI akceptuje maksymalnie 7 takich obrazów
    - Edycja/rozszerzanie filmu dziedziczy proporcje i rozdzielczość filmu wejściowego;
      te operacje nie przyjmują nadpisania geometrii
    - Domyślny limit czasu operacji: 600 sekund, chyba że ustawiono `video_generate.timeoutMs`
      lub `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    Lokalne bufory filmów nie są akceptowane. Dla danych wejściowych edycji/rozszerzania filmu używaj zdalnych
    adresów URL `http(s)`. Funkcja obraz na film akceptuje lokalne bufory obrazów, ponieważ
    OpenClaw koduje je jako adresy URL danych dla xAI.
    </Warning>

    Video 1.5 rozpoznaje również identyfikatory `grok-imagine-video-1.5-preview` i
    `grok-imagine-video-1.5-2026-05-30` xAI. OpenClaw przekazuje
    wybrany identyfikator bez zmian, ale stosuje tę samą walidację ograniczającą dane wejściowe do obrazów.

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
    Zobacz [Generowanie filmów](/pl/tools/video-generation), aby poznać wspólne parametry
    narzędzi, wybór dostawcy i zachowanie przełączania awaryjnego.
    </Note>

  </Accordion>

  <Accordion title="Generowanie obrazów">
    Wbudowana wtyczka `xai` rejestruje generowanie obrazów za pomocą wspólnego
    narzędzia `image_generate`.

    - Domyślny model obrazu: `xai/grok-imagine-image`
    - Dodatkowy model: `xai/grok-imagine-image-quality`
    - Tryby: zamiana tekstu na obraz i edycja obrazu referencyjnego
    - Dane referencyjne: jeden `image` lub maksymalnie trzy `images`
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Rozdzielczości: `1K`, `2K`
    - Liczba: maksymalnie 4 obrazy
    - Domyślny limit czasu operacji: 600 sekund, chyba że ustawiono `image_generate.timeoutMs`
      lub `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw żąda od xAI odpowiedzi obrazowych `b64_json`, aby wygenerowane multimedia mogły być
    przechowywane i dostarczane standardową ścieżką załączników kanału. Lokalne
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
    Obecnie OpenClaw przekazuje tylko współdzielone przez różnych dostawców ustawienia obrazów;
    te opcje właściwe wyłącznie dla xAI nie są udostępniane przez `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Zamiana tekstu na mowę">
    Wbudowany plugin `xai` rejestruje zamianę tekstu na mowę za pośrednictwem współdzielonego interfejsu
    dostawcy `tts`.

    - Głosy: uwierzytelniony katalog na żywo z xAI; można go wyświetlić za pomocą
      `openclaw infer tts voices --provider xai`
    - Głosy zastępcze w trybie offline: `ara`, `eve`, `leo`, `rex`, `sal`
    - Domyślny głos: `eve`
    - Identyfikatory niestandardowych głosów konta są przekazywane nawet wtedy, gdy nie występują
      w odpowiedzi wbudowanego katalogu
    - Formaty: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Język: kod BCP-47 lub `auto`
    - Szybkość: natywne dla dostawcy nadpisanie szybkości
    - Natywny format wiadomości głosowej Opus nie jest obsługiwany

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
    OpenClaw używa punktu końcowego przetwarzania wsadowego `/v1/tts` firmy xAI do syntezy buforowanej,
    uwierzytelnionego wykrywania katalogu `/v1/tts/voices` oraz natywnego
    `wss://api.x.ai/v1/tts` do syntezy strumieniowej. Przesyłanie strumieniowe jest ograniczone do
    natywnego hosta `api.x.ai`, dlatego niestandardowe wartości `baseUrl` są odrzucane na tej
    ścieżce. Używane są istniejące ustawienia języka, głosu, kodeka i szybkości; do
    częstotliwości próbkowania i przepływności stosowane są wartości domyślne xAI. Synteza plików
    dźwiękowych uwzględnia wszystkie skonfigurowane kodeki. Cele wiadomości głosowych używają
    MP3 do przesyłania strumieniowego i buforowanego trybu zastępczego, ponieważ surowe kodeki xAI nie zawierają
    metadanych kodeka ani częstotliwości. Strumień wysyła `text.delta`, a następnie
    `text.done`, odbiera `audio.delta`, `audio.done` lub `error` i stosuje
    limit bezczynności `timeoutMs`, który jest odnawiany dla każdego fragmentu dźwięku. Jest to mechanizm
    odrębny od sesji głosowych czasu rzeczywistego. Zobacz kontrakt xAI [interfejsu API strumieniowego TTS](https://docs.x.ai/developers/rest-api-reference/inference/voice).
    </Note>

  </Accordion>

  <Accordion title="Zamiana mowy na tekst">
    Wbudowany plugin `xai` rejestruje wsadową zamianę mowy na tekst za pośrednictwem
    interfejsu transkrypcji rozpoznawania multimediów OpenClaw.

    - Punkt końcowy: xAI REST `/v1/stt`
    - Ścieżka wejściowa: przesyłanie pliku dźwiękowego w formacie multipart
    - Wybór modelu: xAI wybiera model transkrypcji wewnętrznie; ten
      punkt końcowy nie udostępnia selektora modelu
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

    Język można podać za pomocą współdzielonej konfiguracji multimediów dźwiękowych lub w każdym
    żądaniu transkrypcji. Współdzielony interfejs OpenClaw akceptuje podpowiedzi promptu,
    ale integracja xAI REST STT przekazuje tylko plik i język,
    ponieważ odpowiadają one bieżącemu publicznemu punktowi końcowemu xAI.

  </Accordion>

  <Accordion title="Strumieniowa zamiana mowy na tekst">
    Wbudowany plugin `xai` rejestruje również dostawcę transkrypcji czasu rzeczywistego
    dla dźwięku połączeń głosowych na żywo.

    - Punkt końcowy: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Domyślne kodowanie: `mulaw`
    - Domyślna częstotliwość próbkowania: `8000`
    - Domyślne wykrywanie końca wypowiedzi: `800ms`
    - Transkrypcje tymczasowe: domyślnie włączone

    Strumień multimediów Twilio funkcji Voice Call wysyła ramki dźwiękowe G.711 mu-law, dlatego
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
    `alaw`), `interimResults`, `endpointingMs` i `language`.

    <Note>
    Ten dostawca strumieniowy jest przeznaczony dla ścieżki transkrypcji czasu rzeczywistego funkcji Voice Call.
    Discord nagrywa krótkie segmenty i zamiast tego używa wsadowej
    ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos w czasie rzeczywistym (Talk)">
    Wbudowany plugin `xai` rejestruje sesje czasu rzeczywistego Grok Voice Agent dla
    trybu Talk za pośrednictwem współdzielonego kontraktu `registerRealtimeVoiceProvider`.

    - Punkt końcowy: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - Domyślny model: `grok-voice-latest`
    - Domyślny głos: `eve`
    - Transport: `gateway-relay` (ścieżki przekazywania iOS, Android i interfejsu Control UI)
    - Dźwięk: PCM16 24 kHz lub G.711 µ-law 8 kHz
    - Przerywanie wypowiedzi: serwerowy VAD xAI przerywa odpowiedź; OpenClaw czyści kolejkę odtwarzania
      i skraca historię dostawcy o nieodtworzone elementy

    Skonfiguruj Talk w Gateway:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // Opt in only if provider-side session replay is acceptable.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    Konfiguracja należąca do dostawcy jest również rozpoznawana z
    `plugins.entries.voice-call.config.realtime.providers.xai`, gdy Voice Call
    lub współdzielone selektory czasu rzeczywistego ponownie używają tej samej mapy dostawców. Obsługiwane klucze to
    `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort` i `sessionResumption`.
    `reasoningEffort` akceptuje tylko `high` lub `none`, zgodnie z interfejsem API xAI Voice Agent.

    Serwerowy VAD xAI zawsze tworzy odpowiedzi i obsługuje przerywanie dźwięku.
    Należy użyć `consultRouting: "provider-direct"`; wymuszone kierowanie transkrypcji i wyłączenie
    przerywania dźwięku wejściowego nie są obsługiwane przez protokół xAI Voice Agent.

    <Note>
    Głos w czasie rzeczywistym można uwierzytelnić za pomocą xAI OAuth lub `XAI_API_KEY`. WebRTC obsługiwany
    przez przeglądarkę nie należy jeszcze do interfejsu tego dostawcy; należy używać trybu Talk gateway-relay na
    natywnych węzłach lub ścieżki przekazywania Control UI.
    </Note>

    <Note>
    `sessionResumption` ma domyślnie wartość `false`. Po ustawieniu na `true` OpenClaw żąda,
    aby xAI zachowało wystarczający stan sesji do wznowienia tej samej rozmowy po
    ponownym połączeniu, a następnie łączy się ponownie przy użyciu zwróconego identyfikatora rozmowy. Należy pozostawić tę opcję
    wyłączoną, jeśli odtwarzanie lub przechowywanie po stronie dostawcy jest niedopuszczalne; przerwane
    gniazda kończą się wtedy bezpiecznym błędem zamiast niejawnie rozpoczynać nową rozmowę.
    </Note>

  </Accordion>

  <Accordion title="Konfiguracja x_search">
    Wbudowany plugin xAI udostępnia `x_search` jako narzędzie OpenClaw do
    wyszukiwania treści z X (dawniej Twitter) za pośrednictwem Grok.

    Ścieżka konfiguracji: `plugins.entries.xai.config.xSearch`

    | Klucz             | Typ     | Wartość domyślna          | Opis                                             |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | Automatycznie dla modeli xAI | Wyłącz lub włącz dla znanego dostawcy innego niż xAI |
    | `model`           | string  | `grok-4.3`                | Model używany do żądań x_search                  |
    | `baseUrl`         | string  | -                         | Nadpisanie bazowego adresu URL xAI Responses     |
    | `inlineCitations` | boolean | -                         | Uwzględniaj cytowania w tekście wyników          |
    | `maxTurns`        | number  | -                         | Maksymalna liczba tur rozmowy                    |
    | `timeoutSeconds`  | number  | `30`                      | Limit czasu żądania w sekundach                  |
    | `cacheTtlMinutes` | number  | `15`                      | Czas życia pamięci podręcznej w minutach         |

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

    | Klucz            | Typ     | Wartość domyślna         | Opis                                             |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | boolean | Automatycznie dla modeli xAI | Wyłącz lub włącz dla znanego dostawcy innego niż xAI |
    | `model`          | string  | `grok-4.3`               | Model używany do żądań wykonania kodu            |
    | `maxTurns`       | number  | -                        | Maksymalna liczba tur rozmowy                    |
    | `timeoutSeconds` | number  | `30`                     | Limit czasu żądania w sekundach                  |

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
    - Uwierzytelnianie xAI może korzystać z klucza API, zmiennej środowiskowej, konfiguracji pluginu
      jako mechanizmu rezerwowego lub OAuth z kwalifikującym się kontem xAI. OAuth używa
      weryfikacji kodem urządzenia bez wywołania zwrotnego do hosta lokalnego. xAI decyduje, które konta
      mogą otrzymywać tokeny API OAuth, a strona zgody może wyświetlać Grok Build,
      mimo że OpenClaw nie wymaga aplikacji Grok Build.
    - OpenClaw obecnie nie udostępnia rodziny modeli wieloagentowych xAI. xAI
      udostępnia te modele przez interfejs Responses API, ale nie obsługują one
      narzędzi po stronie klienta ani narzędzi niestandardowych używanych przez wspólną pętlę agenta OpenClaw.
      Zobacz
      [ograniczenia modeli wieloagentowych xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Obsługa głosu xAI Realtime obecnie udostępnia wyłącznie transport Talk przez przekaźnik Gateway.
      Sesje WebSocket dostawcy obsługiwane przez przeglądarkę nie są jeszcze połączone
      w interfejsie Control UI.
    - Obraz xAI `quality`, obraz `mask` oraz dodatkowe proporcje obrazu dostępne wyłącznie natywnie
      nie są udostępniane, dopóki wspólne narzędzie `image_generate` nie otrzyma odpowiednich
      mechanizmów sterowania działających między dostawcami.
  </Accordion>

  <Accordion title="Uwagi zaawansowane">
    - OpenClaw automatycznie stosuje poprawki zgodności schematów narzędzi i wywołań narzędzi
      specyficzne dla xAI we wspólnej ścieżce modułu uruchamiającego.
    - Natywne żądania xAI domyślnie `tool_stream: true`. Ustaw
      `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`,
      aby to wyłączyć.
    - Dołączona otoczka xAI usuwa nieobsługiwane ograniczenia liczby wystąpień w schemacie
      oraz nieobsługiwane klucze *poziomu* wnioskowania z ładunku przed wysłaniem natywnych
      żądań xAI. Grok 4.5 obsługuje niski, średni i
      wysoki poziom (domyślnie wysoki). Grok 4.3 obsługuje brak, niski, średni i wysoki
      poziom (domyślnie niski). Inne modele xAI obsługujące wnioskowanie nie udostępniają
      konfigurowalnego sterowania poziomem, ale nadal żądają
      `include: ["reasoning.encrypted_content"]`, aby wcześniejsze zaszyfrowane wnioskowanie
      mogło zostać odtworzone w kolejnych turach.
    - `web_search`, `x_search` i `code_execution` są udostępniane jako narzędzia OpenClaw.
      OpenClaw dołącza do żądania każdego narzędzia tylko konkretną wbudowaną funkcję xAI,
      której ono wymaga, zamiast dołączać wszystkie narzędzia natywne do każdej
      tury czatu.
    - Grok `web_search` odczytuje `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` odczytuje `plugins.entries.xai.config.xSearch.baseUrl`, a następnie
      używa rezerwowo bazowego adresu URL wyszukiwania internetowego Grok.
    - `x_search` i `code_execution` należą do dołączonego pluginu xAI,
      zamiast być zakodowane na stałe w podstawowym środowisku uruchomieniowym modeli.
    - `code_execution` oznacza zdalne wykonywanie w piaskownicy xAI, a nie lokalne
      [`exec`](/pl/tools/exec).
  </Accordion>
</AccordionGroup>

## Testowanie na żywo

Ścieżki multimediów xAI są objęte testami jednostkowymi i opcjonalnymi zestawami testów na żywo. Przed
uruchomieniem prób na żywo wyeksportuj `XAI_API_KEY` w środowisku procesu.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Plik testów na żywo specyficzny dla dostawcy syntetyzuje zwykłą mowę TTS, przyjazną dla telefonii mowę TTS w formacie PCM,
transkrybuje dźwięk przez wsadowy STT xAI, strumieniuje ten sam dźwięk PCM przez
STT czasu rzeczywistego xAI, generuje wynik zamiany tekstu na obraz i edytuje obraz referencyjny.
Wspólny plik testów obrazów na żywo weryfikuje tego samego dostawcę xAI przez ścieżkę
wyboru środowiska uruchomieniowego OpenClaw, mechanizmu rezerwowego, normalizacji i załączania multimediów.
Opcjonalny przypadek Video 1.5 przesyła jeden wygenerowany obraz pierwszej klatki w rozdzielczości 1080P i
weryfikuje pobranie ukończonego filmu.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie filmów" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia do filmów i wybór dostawcy.
  </Card>
  <Card title="Wszyscy dostawcy" href="/pl/providers/index" icon="grid-2">
    Szerszy przegląd dostawców.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i rozwiązania.
  </Card>
</CardGroup>
