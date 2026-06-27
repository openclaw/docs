---
read_when:
    - Generowanie filmów za pomocą agenta
    - Konfigurowanie dostawców i modeli generowania wideo
    - Zrozumienie parametrów narzędzia video_generate
sidebarTitle: Video generation
summary: Generuj filmy przez video_generate na podstawie odwołań tekstowych, obrazów lub filmów w 16 backendach dostawców
title: Generowanie wideo
x-i18n:
    generated_at: "2026-06-27T18:32:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64c8a3191262613a1acf684496570a6dd8893ebb3a2a7e5ae41337d58555c401
    source_path: tools/video-generation.md
    workflow: 16
---

Agenci OpenClaw mogą generować filmy z promptów tekstowych, obrazów referencyjnych lub
istniejących filmów. Obsługiwanych jest szesnaście backendów dostawców, każdy z
innymi opcjami modeli, trybami wejścia i zestawami funkcji. Agent wybiera
właściwego dostawcę automatycznie na podstawie konfiguracji i dostępnych kluczy API.

<Note>
Narzędzie `video_generate` pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden
dostawca generowania wideo. Jeśli nie widzisz go w narzędziach agenta, ustaw
klucz API dostawcy albo skonfiguruj `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traktuje generowanie wideo jako trzy tryby uruchomieniowe:

- `generate` - żądania text-to-video bez multimediów referencyjnych.
- `imageToVideo` - żądanie zawiera co najmniej jeden obraz referencyjny.
- `videoToVideo` - żądanie zawiera co najmniej jeden film referencyjny.

Dostawcy mogą obsługiwać dowolny podzbiór tych trybów. Narzędzie weryfikuje
aktywny tryb przed przesłaniem i raportuje obsługiwane tryby w `action=list`.

## Szybki start

<Steps>
  <Step title="Skonfiguruj uwierzytelnianie">
    Ustaw klucz API dla dowolnego obsługiwanego dostawcy:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Wybierz model domyślny (opcjonalnie)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Zapytaj agenta">
    > Wygeneruj 5-sekundowy film kinowy o przyjaznym homarze surfującym o zachodzie słońca.

    Agent automatycznie wywołuje `video_generate`. Lista dozwolonych narzędzi
    nie jest potrzebna.

  </Step>
</Steps>

## Jak działa generowanie asynchroniczne

Generowanie wideo jest asynchroniczne. Gdy agent wywołuje `video_generate` w
sesji:

1. OpenClaw przesyła żądanie do dostawcy i natychmiast zwraca identyfikator zadania.
2. Dostawca przetwarza zadanie w tle (zwykle od 30 sekund do kilku minut, zależnie od dostawcy i rozdzielczości; powolni dostawcy oparci na kolejce mogą działać aż do skonfigurowanego limitu czasu).
3. Gdy film jest gotowy, OpenClaw wybudza tę samą sesję wewnętrznym zdarzeniem ukończenia.
4. Agent informuje użytkownika przez normalny tryb widocznej odpowiedzi sesji:
   dostarczenie odpowiedzi końcowej, gdy jest automatyczne, albo `message(action="send")`, gdy
   sesja wymaga narzędzia wiadomości. Jeśli sesja żądającego jest nieaktywna albo
   jej aktywne wybudzenie się nie powiedzie, a w odpowiedzi ukończenia nadal brakuje
   części wygenerowanego wideo, OpenClaw wysyła idempotentną bezpośrednią rezerwę tylko z
   brakującym wideo.

Gdy zadanie jest w toku, zduplikowane wywołania `video_generate` w tej samej
sesji zwracają bieżący stan zadania zamiast uruchamiać kolejne
generowanie. Użyj `openclaw tasks list` albo `openclaw tasks show <taskId>`, aby
sprawdzić postęp z CLI.

Poza uruchomieniami agentów wspieranymi przez sesję (na przykład przy bezpośrednich
wywołaniach narzędzia) narzędzie przełącza się na generowanie wbudowane i zwraca końcową ścieżkę multimediów
w tej samej turze.

Wygenerowane pliki wideo są zapisywane w magazynie multimediów zarządzanym przez OpenClaw, gdy
dostawca zwraca bajty. Domyślny limit zapisu wygenerowanego wideo jest zgodny
z limitem multimediów wideo, a `agents.defaults.mediaMaxMb` podnosi go dla
większych renderów. Gdy dostawca zwraca również hostowany URL wyjściowy, OpenClaw
może dostarczyć ten URL zamiast zakończyć zadanie niepowodzeniem, jeśli lokalna trwałość
odrzuci zbyt duży plik.

### Cykl życia zadania

| Stan        | Znaczenie                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Zadanie utworzone, czeka na przyjęcie przez dostawcę.                                                  |
| `running`   | Dostawca przetwarza (zwykle od 30 sekund do kilku minut, zależnie od dostawcy i rozdzielczości).       |
| `succeeded` | Film gotowy; agent wybudza się i publikuje go w rozmowie.                                              |
| `failed`    | Błąd dostawcy lub limit czasu; agent wybudza się ze szczegółami błędu.                                  |

Sprawdź stan z CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Jeśli zadanie wideo jest już w stanie `queued` albo `running` dla bieżącej sesji,
`video_generate` zwraca istniejący stan zadania zamiast uruchamiać nowe.
Użyj `action: "status"`, aby sprawdzić jawnie bez wyzwalania nowego
generowania.

## Obsługiwani dostawcy

| Dostawca              | Model domyślny                  | Tekst | Odniesienie obrazu                                  | Odniesienie wideo                              | Uwierzytelnianie                         |
| --------------------- | ------------------------------- | :---: | --------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |   ✓   | Tak (zdalny URL)                                    | Tak (zdalny URL)                               | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |   ✓   | Do 2 obrazów (tylko modele I2V; pierwsza + ostatnia klatka) | -                                      | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |   ✓   | Do 2 obrazów (pierwsza + ostatnia klatka przez rolę) | -                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |   ✓   | Do 9 obrazów referencyjnych                         | Do 3 filmów                                    | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |   ✓   | 1 obraz                                             | -                                              | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |   ✓   | -                                                   | -                                              | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |   ✓   | 1 obraz; do 9 z Seedance reference-to-video         | Do 3 filmów z Seedance reference-to-video      | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |   ✓   | 1 obraz                                             | 1 film                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |   ✓   | 1 obraz                                             | -                                              | `MINIMAX_API_KEY` lub MiniMax OAuth      |
| OpenAI                | `sora-2`                        |   ✓   | 1 obraz                                             | 1 film                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |   ✓   | Do 4 obrazów (pierwsza/ostatnia klatka lub referencje) | -                                           | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |   ✓   | Tak (zdalny URL)                                    | Tak (zdalny URL)                               | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |   ✓   | 1 obraz                                             | 1 film                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |   ✓   | tylko `Wan-AI/Wan2.2-I2V-A14B`                      | -                                              | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |   ✓   | 1 obraz (`kling`)                                   | -                                              | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |   ✓   | 1 obraz pierwszej klatki albo do 7 `reference_image`s | 1 film                                      | `XAI_API_KEY`                            |

Niektórzy dostawcy akceptują dodatkowe lub alternatywne zmienne środowiskowe klucza API. Zobacz
poszczególne [strony dostawców](#related), aby poznać szczegóły.

Uruchom `video_generate action=list`, aby sprawdzić dostępnych dostawców, modele i
tryby uruchomieniowe w czasie działania.

### Macierz możliwości

Jawny kontrakt trybu używany przez `video_generate`, testy kontraktowe i
wspólny live sweep:

| Dostawca   | `generate` | `imageToVideo` | `videoToVideo` | Wspólne ścieżki live dzisiaj                                                                                                           |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pominięte, ponieważ ten dostawca wymaga zdalnych URL-i wideo `http(s)`                      |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | Nie wchodzi we wspólny sweep; pokrycie specyficzne dla workflow znajduje się w testach Comfy                                            |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; natywne schematy wideo DeepInfra są text-to-video w kontrakcie pluginu                                                      |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` tylko przy użyciu Seedance reference-to-video                                                |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; wspólne `videoToVideo` pominięte, ponieważ bieżący sweep Gemini/Veo oparty na buforze nie akceptuje tego wejścia |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; wspólne `videoToVideo` pominięte, ponieważ ta organizacja/ścieżka wejścia obecnie wymaga dostępu do edycji wideo po stronie dostawcy |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pominięte, ponieważ ten dostawca wymaga zdalnych URL-i wideo `http(s)`                      |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` działa tylko wtedy, gdy wybrany model to `runway/gen4_aleph`                                |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; wspólne `imageToVideo` pominięte, ponieważ dołączony `veo3` jest tylko tekstowy, a dołączony `kling` wymaga zdalnego URL-a obrazu |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pominięte, ponieważ ten dostawca obecnie wymaga zdalnego URL-a MP4                          |

## Parametry narzędzia

### Wymagane

<ParamField path="prompt" type="string" required>
  Opis tekstowy filmu do wygenerowania. Wymagany dla `action: "generate"`.
</ParamField>

### Dane wejściowe treści

<ParamField path="image" type="string">Pojedynczy obraz referencyjny (ścieżka lub URL).</ParamField>
<ParamField path="images" type="string[]">Wiele obrazów referencyjnych (do 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Opcjonalne wskazówki ról dla każdej pozycji, równoległe do połączonej listy obrazów.
Wartości kanoniczne: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Pojedynczy film referencyjny (ścieżka lub URL).</ParamField>
<ParamField path="videos" type="string[]">Wiele filmów referencyjnych (do 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Opcjonalne wskazówki ról dla każdej pozycji, równoległe do połączonej listy filmów.
Wartość kanoniczna: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Pojedynczy dźwięk referencyjny (ścieżka lub URL). Używany dla muzyki tła lub
referencji głosu, gdy dostawca obsługuje dane wejściowe audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Wiele dźwięków referencyjnych (do 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Opcjonalne wskazówki ról dla każdej pozycji, równoległe do połączonej listy audio.
Wartość kanoniczna: `reference_audio`.
</ParamField>

<Note>
Wskazówki ról są przekazywane do dostawcy bez zmian. Wartości kanoniczne pochodzą z
unii `VideoGenerationAssetRole`, ale dostawcy mogą akceptować dodatkowe
ciągi ról. Tablice `*Roles` nie mogą mieć więcej wpisów niż
odpowiednia lista referencyjna; błędy przesunięcia o jeden kończą się jasnym błędem.
Użyj pustego ciągu, aby pozostawić slot nieustawiony. Dla xAI ustaw każdą rolę obrazu na
`reference_image`, aby użyć trybu generowania `reference_images`; pomiń
rolę lub użyj `first_frame` dla konwersji obrazu na film z pojedynczego obrazu.
</Note>

### Kontrole stylu

<ParamField path="aspectRatio" type="string">
  Wskazówka proporcji obrazu, taka jak `1:1`, `16:9`, `9:16`, `adaptive` lub wartość specyficzna dla dostawcy. OpenClaw normalizuje lub ignoruje nieobsługiwane wartości zależnie od dostawcy.
</ParamField>
<ParamField path="resolution" type="string">Wskazówka rozdzielczości, taka jak `480P`, `720P`, `768P`, `1080P`, `4K` lub wartość specyficzna dla dostawcy. OpenClaw normalizuje lub ignoruje nieobsługiwane wartości zależnie od dostawcy.</ParamField>
<ParamField path="durationSeconds" type="number">
  Docelowy czas trwania w sekundach (zaokrąglany do najbliższej wartości obsługiwanej przez dostawcę).
</ParamField>
<ParamField path="size" type="string">Wskazówka rozmiaru, gdy dostawca ją obsługuje.</ParamField>
<ParamField path="audio" type="boolean">
  Włącz wygenerowane audio w wyniku, gdy jest obsługiwane. Odrębne od `audioRef*` (dane wejściowe).
</ParamField>
<ParamField path="watermark" type="boolean">Przełącz znak wodny dostawcy, gdy jest obsługiwany.</ParamField>

`adaptive` to sentinel specyficzny dla dostawcy: jest przekazywany bez zmian do
dostawców, którzy deklarują `adaptive` w swoich możliwościach (np. BytePlus
Seedance używa go do automatycznego wykrywania proporcji na podstawie wymiarów
obrazu wejściowego). Dostawcy, którzy go nie deklarują, ujawniają tę wartość przez
`details.ignoredOverrides` w wyniku narzędzia, aby pominięcie było widoczne.

### Zaawansowane

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` zwraca bieżące zadanie sesji; `"list"` sprawdza dostawców.
</ParamField>
<ParamField path="model" type="string">Nadpisanie dostawcy/modelu (np. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Wskazówka nazwy pliku wyjściowego.</ParamField>
<ParamField path="timeoutMs" type="number">Opcjonalny limit czasu operacji dostawcy w milisekundach. Gdy pominięty, OpenClaw używa `agents.defaults.videoGenerationModel.timeoutMs`, jeśli jest skonfigurowane, w przeciwnym razie domyślnej wartości dostawcy zdefiniowanej przez plugin, gdy taka istnieje.</ParamField>
<ParamField path="providerOptions" type="object">
  Opcje specyficzne dla dostawcy jako obiekt JSON (np. `{"seed": 42, "draft": true}`).
  Dostawcy deklarujący typowany schemat weryfikują klucze i typy; nieznane
  klucze lub niezgodności pomijają kandydata podczas fallbacku. Dostawcy bez
  zadeklarowanego schematu otrzymują opcje bez zmian. Uruchom `video_generate action=list`,
  aby zobaczyć, co akceptuje każdy dostawca.
</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw normalizuje czas trwania do
najbliższej wartości obsługiwanej przez dostawcę i mapuje przetłumaczone wskazówki geometrii,
takie jak rozmiar na proporcje obrazu, gdy dostawca fallbacku udostępnia inną
powierzchnię sterowania. Naprawdę nieobsługiwane nadpisania są ignorowane według zasady
najlepszych starań i zgłaszane jako ostrzeżenia w wyniku narzędzia. Twarde limity możliwości
(takie jak zbyt wiele wejść referencyjnych) kończą się błędem przed przesłaniem. Wyniki narzędzia
zgłaszają zastosowane ustawienia; `details.normalization` przechwytuje każde
tłumaczenie z żądanego na zastosowane.
</Note>

Dane wejściowe referencji wybierają tryb wykonania:

- Brak mediów referencyjnych → `generate`
- Dowolna referencja obrazu → `imageToVideo`
- Dowolna referencja filmu → `videoToVideo`
- Wejścia audio referencyjnego **nie** zmieniają rozwiązanego trybu; stosują się
  ponad dowolnym trybem wybranym przez referencje obrazu/filmu i działają tylko
  z dostawcami deklarującymi `maxInputAudios`.

Mieszane referencje obrazów i filmów nie są stabilną wspólną powierzchnią możliwości.
Preferuj jeden typ referencji na żądanie.

#### Fallback i opcje typowane

Niektóre kontrole możliwości są stosowane na warstwie fallbacku, a nie na
granicy narzędzia, więc żądanie przekraczające limity głównego dostawcy nadal może
uruchomić się na odpowiednim fallbacku:

- Aktywny kandydat niedeklarujący `maxInputAudios` (lub deklarujący `0`) jest pomijany, gdy
  żądanie zawiera referencje audio; próbowany jest następny kandydat.
- `maxDurationSeconds` aktywnego kandydata poniżej żądanego `durationSeconds`
  bez zadeklarowanej listy `supportedDurationSeconds` → pominięty.
- Żądanie zawiera `providerOptions`, a aktywny kandydat jawnie
  deklaruje typowany schemat `providerOptions` → pominięty, jeśli podane klucze
  nie znajdują się w schemacie lub typy wartości nie pasują. Dostawcy bez
  zadeklarowanego schematu otrzymują opcje bez zmian (wstecznie kompatybilne
  przekazanie). Dostawca może zrezygnować ze wszystkich opcji dostawcy przez
  zadeklarowanie pustego schematu (`capabilities.providerOptions: {}`), co
  powoduje takie samo pominięcie jak niezgodność typu.

Pierwszy powód pominięcia w żądaniu jest logowany na poziomie `warn`, aby operatorzy widzieli, kiedy
ich główny dostawca został pominięty; kolejne pominięcia są logowane na poziomie `debug`, aby
długie łańcuchy fallbacków pozostawały ciche. Jeśli każdy kandydat zostanie pominięty,
zagregowany błąd zawiera powód pominięcia dla każdego z nich.

## Akcje

| Akcja      | Co robi                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Domyślna. Tworzy film z podanego promptu i opcjonalnych wejść referencyjnych.                            |
| `status`   | Sprawdza stan zadania filmowego w toku dla bieżącej sesji bez rozpoczynania kolejnego generowania.       |
| `list`     | Pokazuje dostępnych dostawców, modele i ich możliwości.                                                  |

## Wybór modelu

OpenClaw rozwiązuje model w tej kolejności:

1. **Parametr narzędzia `model`** - jeśli agent określi go w wywołaniu.
2. **`videoGenerationModel.primary`** z konfiguracji.
3. **`videoGenerationModel.fallbacks`** po kolei.
4. **Automatyczne wykrywanie** - dostawcy z prawidłowym uwierzytelnieniem, zaczynając od
   bieżącego domyślnego dostawcy, a następnie pozostali dostawcy w kolejności
   alfabetycznej.

Jeśli dostawca zawiedzie, następny kandydat jest próbowany automatycznie. Jeśli wszyscy
kandydaci zawiodą, błąd zawiera szczegóły z każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby używać
tylko jawnych wpisów `model`, `primary` i `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Uwagi o dostawcach

<AccordionGroup>
  <Accordion title="Alibaba">
    Używa asynchronicznego endpointu DashScope / Model Studio. Obrazy i
    filmy referencyjne muszą być zdalnymi URL-ami `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Identyfikator dostawcy: `byteplus`.

    Modele: `seedance-1-0-pro-250528` (domyślny),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Modele T2V (`*-t2v-*`) nie akceptują wejść obrazów; modele I2V i
    ogólne modele `*-pro-*` obsługują pojedynczy obraz referencyjny (pierwszą
    klatkę). Przekaż obraz pozycyjnie lub ustaw `role: "first_frame"`.
    Identyfikatory modeli T2V są automatycznie przełączane na odpowiadający wariant I2V,
    gdy podano obraz.

    Obsługiwane klucze `providerOptions`: `seed` (liczba), `draft` (boolean -
    wymusza 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Wymaga pluginu [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Identyfikator dostawcy: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Używa ujednoliconego API `content[]`. Obsługuje najwyżej 2 obrazy wejściowe
    (`first_frame` + `last_frame`). Wszystkie wejścia muszą być zdalnymi URL-ami
    `https://`. Ustaw `role: "first_frame"` / `"last_frame"` dla każdego obrazu albo
    przekaż obrazy pozycyjnie.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje na podstawie obrazu wejściowego.
    `audio: true` mapuje się na `generate_audio`. `providerOptions.seed`
    (liczba) jest przekazywane dalej.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Wymaga pluginu [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Identyfikator dostawcy: `byteplus-seedance2`. Modele:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Używa ujednoliconego API `content[]`. Obsługuje do 9 obrazów referencyjnych,
    3 filmów referencyjnych i 3 dźwięków referencyjnych. Wszystkie wejścia muszą być zdalnymi
    URL-ami `https://`. Ustaw `role` dla każdego zasobu - obsługiwane wartości:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje na podstawie obrazu wejściowego.
    `audio: true` mapuje się na `generate_audio`. `providerOptions.seed`
    (liczba) jest przekazywane dalej.

  </Accordion>
  <Accordion title="ComfyUI">
    Lokalne lub chmurowe wykonywanie sterowane przepływem pracy. Obsługuje text-to-video i
    image-to-video przez skonfigurowany graf.
  </Accordion>
  <Accordion title="fal">
    Używa przepływu opartego na kolejce dla długotrwałych zadań. OpenClaw domyślnie czeka do 20
    minut, zanim potraktuje trwające zadanie kolejki fal jako przekroczone
    czasowo. Większość modeli wideo fal
    akceptuje pojedyncze odniesienie do obrazu. Modele Seedance 2.0 reference-to-video
    akceptują do 9 obrazów, 3 filmów i 3 odniesień audio, przy
    maksymalnie 12 plikach referencyjnych łącznie.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Obsługuje jedno odniesienie do obrazu lub jedno odniesienie do wideo. Żądania wygenerowanego audio są
    ignorowane z ostrzeżeniem na ścieżce API Gemini, ponieważ to API odrzuca
    parametr `generateAudio` dla bieżącego generowania wideo Veo.
  </Accordion>
  <Accordion title="MiniMax">
    Tylko pojedyncze odniesienie do obrazu. MiniMax akceptuje rozdzielczości `768P` i `1080P`;
    żądania takie jak `720P` są normalizowane do najbliższej
    obsługiwanej wartości przed wysłaniem.
  </Accordion>
  <Accordion title="OpenAI">
    Przekazywane jest tylko nadpisanie `size`. Inne nadpisania stylu
    (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z
    ostrzeżeniem.
  </Accordion>
  <Accordion title="OpenRouter">
    Używa asynchronicznego API `/videos` OpenRouter. OpenClaw wysyła
    zadanie, odpytuje `polling_url` i pobiera albo `unsigned_urls`, albo
    udokumentowany endpoint treści zadania. Dołączony domyślny `google/veo-3.1-fast`
    deklaruje czasy trwania 4/6/8 sekund, rozdzielczości `720P`/`1080P` oraz
    proporcje obrazu `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Ten sam backend DashScope co Alibaba. Dane wejściowe odniesień muszą być zdalnymi
    URL-ami `http(s)`; pliki lokalne są odrzucane z góry.
  </Accordion>
  <Accordion title="Runway">
    Obsługuje pliki lokalne przez URI danych. Video-to-video wymaga
    `runway/gen4_aleph`. Uruchomienia tylko tekstowe udostępniają proporcje
    obrazu `16:9` i `9:16`.
  </Accordion>
  <Accordion title="Together">
    Tylko pojedyncze odniesienie do obrazu.
  </Accordion>
  <Accordion title="Vydra">
    Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań
    usuwających uwierzytelnianie. `veo3` jest dołączony tylko jako text-to-video; `kling` wymaga
    zdalnego URL-a obrazu.
  </Accordion>
  <Accordion title="xAI">
    Obsługuje text-to-video, image-to-video z pojedynczym obrazem pierwszej klatki, do 7
    wejść `reference_image` przez `reference_images` xAI oraz zdalne
    przepływy edycji/przedłużania wideo.
  </Accordion>
</AccordionGroup>

## Tryby możliwości dostawcy

Wspólna umowa generowania wideo obsługuje możliwości specyficzne dla trybu
zamiast wyłącznie płaskich limitów zbiorczych. Nowe implementacje dostawców
powinny preferować jawne bloki trybów:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Płaskie pola zbiorcze, takie jak `maxInputImages` i `maxInputVideos`, są
**niewystarczające**, aby deklarować obsługę trybu transformacji. Dostawcy powinni
jawnie deklarować `generate`, `imageToVideo` i `videoToVideo`, aby testy live,
testy kontraktu i wspólne narzędzie `video_generate` mogły deterministycznie
weryfikować obsługę trybu.

Gdy jeden model dostawcy ma szerszą obsługę wejść referencyjnych niż
pozostałe, użyj `maxInputImagesByModel`, `maxInputVideosByModel` lub
`maxInputAudiosByModel` zamiast podnosić limit dla całego trybu.

## Testy live

Opcjonalne pokrycie live dla wspólnych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media video
```

Ten plik live domyślnie używa już wyeksportowanych zmiennych środowiskowych dostawców przed zapisanymi profilami
uwierzytelniania i domyślnie uruchamia bezpieczny dla wydania smoke test:

- `generate` dla każdego dostawcy spoza FAL w przebiegu.
- Jednosekundowy prompt z homarem.
- Limit operacji dla każdego dostawcy z
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`).

FAL jest opcjonalny, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas
wydania:

```bash
pnpm test:live:media video --video-providers fal
```

Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane
tryby transformacji, które wspólny przebieg może bezpiecznie wykonać z lokalnymi mediami:

- `imageToVideo`, gdy `capabilities.imageToVideo.enabled`.
- `videoToVideo`, gdy `capabilities.videoToVideo.enabled` i
  dostawca/model akceptuje lokalne wejście wideo oparte na buforze we wspólnym
  przebiegu.

Obecnie wspólna ścieżka live `videoToVideo` obejmuje `runway` tylko wtedy, gdy
wybierzesz `runway/gen4_aleph`.

## Konfiguracja

Ustaw domyślny model generowania wideo w konfiguracji OpenClaw:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Albo przez CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Powiązane

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Zadania w tle](/pl/automation/tasks) - śledzenie zadań dla asynchronicznego generowania wideo
- [BytePlus](/pl/concepts/model-providers#byteplus-international)
- [ComfyUI](/pl/providers/comfy)
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults)
- [fal](/pl/providers/fal)
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [Modele](/pl/concepts/models)
- [OpenAI](/pl/providers/openai)
- [Qwen](/pl/providers/qwen)
- [Runway](/pl/providers/runway)
- [Together AI](/pl/providers/together)
- [Przegląd narzędzi](/pl/tools)
- [Vydra](/pl/providers/vydra)
- [xAI](/pl/providers/xai)
