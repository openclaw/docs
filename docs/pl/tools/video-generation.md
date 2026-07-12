---
read_when:
    - Generowanie filmów za pomocą agenta
    - Konfigurowanie dostawców i modeli generowania wideo
    - Omówienie parametrów narzędzia video_generate
sidebarTitle: Video generation
summary: Generuj filmy za pomocą video_generate na podstawie tekstu, obrazów lub materiałów wideo w 16 backendach dostawców
title: Generowanie wideo
x-i18n:
    generated_at: "2026-07-12T15:42:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

Agenci OpenClaw generują filmy na podstawie promptów tekstowych, obrazów referencyjnych lub
istniejących filmów za pomocą `video_generate`. Obsługiwanych jest szesnaście backendów
dostawców; agent automatycznie wybiera właściwy na podstawie konfiguracji i
dostępnych kluczy API.

<Note>
`video_generate` pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca
generowania filmów. Jeśli brakuje go w narzędziach agenta, ustaw klucz API dostawcy lub
skonfiguruj `agents.defaults.videoGenerationModel`.
</Note>

`video_generate` ma trzy tryby działania, określane na podstawie danych referencyjnych
w wywołaniu:

- `generate` — brak multimediów referencyjnych (tekst na film).
- `imageToVideo` — co najmniej jeden obraz referencyjny.
- `videoToVideo` — co najmniej jeden film referencyjny.

Dostawcy mogą obsługiwać dowolny podzbiór tych trybów. Narzędzie sprawdza
aktywny tryb przed przesłaniem zadania i zgłasza obsługiwane tryby w `action=list`.

## Szybki start

<Steps>
  <Step title="Skonfiguruj uwierzytelnianie">
    Ustaw klucz API dowolnego obsługiwanego dostawcy:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Wybierz model domyślny (opcjonalnie)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Poproś agenta">
    > Wygeneruj 5-sekundowy film w kinowym stylu, przedstawiający przyjaznego homara surfującego o zachodzie słońca.

    Agent automatycznie wywołuje `video_generate`. Dodawanie narzędzia do listy
    dozwolonych nie jest wymagane.

  </Step>
</Steps>

## Jak działa generowanie asynchroniczne

Generowanie filmów odbywa się asynchronicznie:

1. OpenClaw przesyła żądanie do dostawcy i natychmiast zwraca identyfikator zadania.
2. Dostawca przetwarza zadanie w tle (zwykle od 30 sekund do kilku minut, zależnie od dostawcy i rozdzielczości; powolni dostawcy korzystający z kolejek mogą działać do upływu skonfigurowanego limitu czasu).
3. Gdy film jest gotowy, OpenClaw wznawia tę samą sesję za pomocą wewnętrznego zdarzenia ukończenia.
4. Agent zgłasza wynik w zwykłym trybie widocznej odpowiedzi sesji:
   automatyczna odpowiedź końcowa lub `message(action="send")`, gdy sesja wymaga
   narzędzia wiadomości. Jeśli sesja żądającego jest nieaktywna albo jej wznowienie się nie powiedzie,
   a wygenerowanych multimediów nadal brakuje w odpowiedzi o ukończeniu, OpenClaw wysyła
   idempotentną bezpośrednią wiadomość awaryjną z multimediami.

Gdy zadanie jest w toku, kolejne wywołania `video_generate` w tej samej
sesji zwracają bieżący stan zadania zamiast rozpoczynać następne
generowanie. Użyj `action: "status"`, aby sprawdzić stan bez wyzwalania nowego
generowania, albo `openclaw tasks list` / `openclaw tasks show <lookup>` w
CLI (zobacz [Zadania w tle](/pl/automation/tasks)).

Poza uruchomieniami agenta powiązanymi z sesją (na przykład przy bezpośrednich wywołaniach narzędzia)
narzędzie przechodzi na generowanie w ramach wywołania i zwraca ścieżkę do gotowych multimediów
w tej samej turze.

Gdy dostawca zwraca dane binarne, wygenerowane pliki filmowe są zapisywane w magazynie
multimediów zarządzanym przez OpenClaw. Domyślny limit wynosi 16 MB (współdzielony limit
multimediów wideo); `agents.defaults.mediaMaxMb` zwiększa go w przypadku większych renderów. Jeśli
dostawca zwraca również hostowany adres URL wyniku, OpenClaw dostarcza ten adres URL zamiast
oznaczać zadanie jako nieudane, gdy lokalny zapis odrzuci zbyt duży plik.

### Cykl życia zadania

| Stan        | Znaczenie                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `queued`    | Zadanie zostało utworzone i oczekuje na przyjęcie przez dostawcę.                                             |
| `running`   | Dostawca przetwarza zadanie (zwykle od 30 sekund do kilku minut, zależnie od dostawcy i rozdzielczości).       |
| `succeeded` | Film jest gotowy; agent wznawia działanie i publikuje go w rozmowie.                                          |
| `failed`    | Błąd dostawcy lub przekroczenie limitu czasu; agent wznawia działanie ze szczegółami błędu.                    |

Sprawdź stan w CLI:

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## Obsługiwani dostawcy

| Dostawca              | Model domyślny                   | Tekst | Obraz referencyjny                                           | Film referencyjny                                       | Uwierzytelnianie                          |
| --------------------- | -------------------------------- | :---: | ------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                     |   ✓   | Tak (zdalny adres URL)                                       | Tak (zdalny adres URL)                                  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`        |   ✓   | Do 2 obrazów (tylko modele I2V; pierwsza i ostatnia klatka)   | -                                                       | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`        |   ✓   | Do 2 obrazów (pierwsza i ostatnia klatka za pomocą roli)      | -                                                       | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`   |   ✓   | Do 9 obrazów referencyjnych                                  | Do 3 filmów                                             | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                       |   ✓   | 1 obraz                                                      | -                                                       | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`          |   ✓   | -                                                            | -                                                       | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`   |   ✓   | 1 obraz; do 9 z trybem Seedance „referencja na film”          | Do 3 filmów z trybem Seedance „referencja na film”      | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview`  |   ✓   | 1 obraz                                                      | 1 film                                                  | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`             |   ✓   | 1 obraz                                                      | -                                                       | `MINIMAX_API_KEY` lub OAuth MiniMax      |
| OpenAI                | `sora-2`                         |   ✓   | 1 obraz                                                      | 1 film                                                  | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`            |   ✓   | Do 4 obrazów (pierwsza/ostatnia klatka lub referencje)        | -                                                       | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                     |   ✓   | Tak (zdalny adres URL)                                       | Tak (zdalny adres URL)                                  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                         |   ✓   | 1 obraz                                                      | 1 film                                                  | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`         |   ✓   | Tylko `Wan-AI/Wan2.2-I2V-A14B`                               | -                                                       | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                           |   ✓   | 1 obraz (`kling`)                                            | -                                                       | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`             |   ✓   | Classic: 1 pierwsza klatka lub 7 referencji; 1.5: 1 klatka   | Classic: 1 film                                         | `XAI_API_KEY`                            |

Niektórzy dostawcy akceptują dodatkowe lub alternatywne zmienne środowiskowe kluczy API. Szczegóły
znajdziesz na poszczególnych [stronach dostawców](#related).

Uruchom `video_generate action=list`, aby podczas działania sprawdzić dostępnych dostawców, modele i
tryby działania.

### Macierz możliwości

Jawna umowa trybów używana przez `video_generate`, testy umowy oraz
współdzielony test środowiska rzeczywistego:

| Dostawca   | `generate` | `imageToVideo` | `videoToVideo` | Obecnie współdzielone ścieżki testów środowiska rzeczywistego                                                                                       |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pomijany, ponieważ ten dostawca wymaga zdalnych adresów URL filmów `http(s)`                               |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                          |
| ComfyUI    |     ✓      |       ✓        |       -        | Brak we współdzielonym teście; zakres specyficzny dla przepływów pracy znajduje się w testach Comfy                                                  |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; natywne schematy filmów DeepInfra w umowie pluginu obsługują generowanie filmu z tekstu                                                  |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` tylko podczas korzystania z trybu Seedance „referencja na film”                                           |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; współdzielony `videoToVideo` jest pomijany, ponieważ bieżący test Gemini/Veo oparty na buforze nie akceptuje tych danych wejściowych |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                          |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; współdzielony `videoToVideo` jest pomijany, ponieważ ta organizacja/ścieżka danych wejściowych wymaga obecnie dostępu do edycji filmów po stronie dostawcy |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                          |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pomijany, ponieważ ten dostawca wymaga zdalnych adresów URL filmów `http(s)`                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` działa tylko wtedy, gdy wybranym modelem jest `runway/gen4_aleph`                                         |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                          |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; współdzielony `imageToVideo` jest pomijany, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego adresu URL obrazu |
| xAI        |     ✓      |       ✓        |       ✓        | Wariant Classic obsługuje wszystkie tryby; Video 1.5 obsługuje tylko generowanie filmu z obrazu; zdalne dane wejściowe MP4 wykluczają `videoToVideo` ze współdzielonego testu |

## Parametry narzędzia

### Wymagane

<ParamField path="prompt" type="string" required>
  Tekstowy opis filmu do wygenerowania. Wymagany dla `action: "generate"`.
</ParamField>

### Dane wejściowe treści

<ParamField path="image" type="string">Pojedynczy obraz referencyjny (ścieżka lub adres URL).</ParamField>
<ParamField path="images" type="string[]">Wiele obrazów referencyjnych (maksymalnie 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Opcjonalne wskazówki roli dla poszczególnych pozycji, odpowiadające połączonej liście obrazów.
Wartości kanoniczne: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Pojedynczy film referencyjny (ścieżka lub adres URL).</ParamField>
<ParamField path="videos" type="string[]">Wiele filmów referencyjnych (maksymalnie 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Opcjonalne wskazówki roli dla poszczególnych pozycji, odpowiadające połączonej liście filmów.
Wartość kanoniczna: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Pojedynczy dźwięk referencyjny (ścieżka lub adres URL). Używany jako muzyka w tle lub
wzorzec głosu, gdy dostawca obsługuje wejścia audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Wiele dźwięków referencyjnych (maksymalnie 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Opcjonalne wskazówki roli dla poszczególnych pozycji, odpowiadające połączonej liście dźwięków.
Wartość kanoniczna: `reference_audio`.
</ParamField>

<Note>
Wskazówki roli są przekazywane dostawcy bez zmian. Wartości kanoniczne pochodzą
z unii `VideoGenerationAssetRole`, ale dostawcy mogą akceptować dodatkowe
ciągi ról. Tablice `*Roles` nie mogą zawierać więcej elementów niż
odpowiadająca im lista referencyjna; błędy przesunięcia o jeden powodują niepowodzenie z jednoznacznym komunikatem.
Użyj pustego ciągu, aby pozostawić pozycję nieustawioną. W przypadku xAI ustaw rolę każdego obrazu na
`reference_image`, aby użyć trybu generowania `reference_images`; pomiń
rolę lub użyj `first_frame` dla konwersji pojedynczego obrazu na film.
</Note>

### Sterowanie stylem

<ParamField path="aspectRatio" type="string">
  Wskazówka proporcji obrazu, na przykład `1:1`, `16:9`, `9:16`, `adaptive` lub wartość specyficzna dla dostawcy. OpenClaw normalizuje lub ignoruje nieobsługiwane wartości zależnie od dostawcy.
</ParamField>
<ParamField path="resolution" type="string">Wskazówka rozdzielczości, na przykład `360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K` lub wartość specyficzna dla dostawcy. OpenClaw normalizuje lub ignoruje nieobsługiwane wartości zależnie od dostawcy.</ParamField>
<ParamField path="durationSeconds" type="number">
  Docelowy czas trwania w sekundach (zaokrąglany do najbliższej wartości obsługiwanej przez dostawcę).
</ParamField>
<ParamField path="size" type="string">Wskazówka rozmiaru, gdy dostawca ją obsługuje.</ParamField>
<ParamField path="audio" type="boolean">
  Włącza generowany dźwięk w wyniku, gdy jest obsługiwany. Jest to opcja odrębna od `audioRef*` (wejść).
</ParamField>
<ParamField path="watermark" type="boolean">Włącza lub wyłącza znak wodny dostawcy, gdy jest obsługiwany.</ParamField>

`adaptive` jest wartością specjalną zależną od dostawcy: jest przekazywana bez zmian
dostawcom, którzy deklarują `adaptive` w swoich możliwościach (np. BytePlus
Seedance używa jej do automatycznego wykrywania proporcji na podstawie wymiarów
obrazu wejściowego). Dostawcy, którzy jej nie deklarują, ujawniają tę wartość w
`details.ignoredOverrides` w wyniku narzędzia, dzięki czemu jej odrzucenie jest widoczne.

### Zaawansowane

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` zwraca bieżące zadanie sesji; `"list"` sprawdza dostawców.
</ParamField>
<ParamField path="model" type="string">Nadpisanie dostawcy/modelu (np. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Wskazówka nazwy pliku wyjściowego.</ParamField>
<ParamField path="timeoutMs" type="number">Opcjonalny limit czasu operacji dostawcy w milisekundach. Jeśli zostanie pominięty, OpenClaw używa `agents.defaults.videoGenerationModel.timeoutMs`, jeśli skonfigurowano tę wartość, a w przeciwnym razie domyślnej wartości dostawcy określonej przez autora pluginu, jeśli taka istnieje.</ParamField>
<ParamField path="providerOptions" type="object">
  Opcje specyficzne dla dostawcy jako obiekt JSON (np. `{"seed": 42, "draft": true}`).
  Dostawcy deklarujący typowany schemat weryfikują klucze i typy; nieznane
  klucze lub niezgodności powodują pominięcie kandydata podczas przełączania awaryjnego. Dostawcy bez
  zadeklarowanego schematu otrzymują opcje bez zmian. Uruchom `video_generate action=list`,
  aby zobaczyć, jakie opcje akceptuje każdy dostawca.
</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw normalizuje czas trwania do
najbliższej wartości obsługiwanej przez dostawcę i przekształca wskazówki geometrii,
na przykład rozmiar na proporcje obrazu, gdy dostawca awaryjny udostępnia inny
zestaw ustawień. Faktycznie nieobsługiwane nadpisania są w miarę możliwości
ignorowane i zgłaszane jako ostrzeżenia w wyniku narzędzia. Twarde ograniczenia możliwości
(takie jak zbyt wiele wejść referencyjnych) powodują błąd przed wysłaniem. Wyniki narzędzia
podają zastosowane ustawienia; `details.normalization` rejestruje wszelkie
przekształcenia wartości żądanych na zastosowane.
</Note>

Wejścia referencyjne wybierają tryb działania:

- Brak multimediów referencyjnych -> `generate`
- Dowolny obraz referencyjny -> `imageToVideo`
- Dowolny film referencyjny -> `videoToVideo`
- Referencyjne wejścia audio **nie** zmieniają wybranego trybu; są stosowane
  do trybu wybranego przez referencje obrazów lub filmów i działają wyłącznie
  z dostawcami deklarującymi `maxInputAudios`.

Łączenie referencji obrazów i filmów nie stanowi stabilnego wspólnego zakresu możliwości.
Preferuj jeden typ referencji na żądanie.

#### Przełączanie awaryjne i typowane opcje

Niektóre kontrole możliwości są wykonywane w warstwie przełączania awaryjnego, a nie na granicy
narzędzia, dlatego żądanie przekraczające limity głównego dostawcy nadal może
zostać obsłużone przez odpowiedniego dostawcę awaryjnego:

- Aktywny kandydat, który nie deklaruje `maxInputAudios` (lub deklaruje `0`), jest pomijany, gdy
  żądanie zawiera referencje audio; następuje próba użycia kolejnego kandydata. Ta sama
  kontrola dotyczy liczby referencji obrazów i filmów względem
  `maxInputImages`/`maxInputVideos`.
- Aktywny kandydat, którego `maxDurationSeconds` jest mniejsze od żądanego `durationSeconds`
  i który nie deklaruje listy `supportedDurationSeconds` -> zostaje pominięty.
- Żądanie zawiera `providerOptions`, a aktywny kandydat jawnie
  deklaruje typowany schemat `providerOptions` -> zostaje pominięty, jeśli podanych kluczy nie ma
  w schemacie lub typy wartości są niezgodne. Dostawcy bez
  zadeklarowanego schematu otrzymują opcje bez zmian (przekazywanie
  zgodne wstecznie). Dostawca może zrezygnować ze wszystkich opcji dostawcy,
  deklarując pusty schemat (`capabilities.providerOptions: {}`), co
  powoduje takie samo pominięcie jak niezgodność typów.

Pierwsza przyczyna pominięcia w żądaniu jest rejestrowana na poziomie `warn`, aby operatorzy widzieli,
kiedy ich główny dostawca został pominięty; kolejne pominięcia są rejestrowane na poziomie `debug`, aby
długie łańcuchy przełączania awaryjnego nie generowały nadmiernych komunikatów. Jeśli każdy kandydat zostanie pominięty,
zbiorczy błąd zawiera przyczynę pominięcia każdego z nich.

## Akcje

| Akcja      | Działanie                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| `generate` | Domyślnie. Tworzy film na podstawie podanej instrukcji i opcjonalnych wejść referencyjnych.                     |
| `status`   | Sprawdza stan trwającego zadania generowania filmu dla bieżącej sesji bez uruchamiania kolejnego generowania.   |
| `list`     | Wyświetla dostępnych dostawców, modele i ich możliwości.                                                       |

## Wybór modelu

OpenClaw wybiera model w następującej kolejności:

1. **Parametr narzędzia `model`** — jeśli agent poda go w wywołaniu.
2. **`videoGenerationModel.primary`** z konfiguracji.
3. **`videoGenerationModel.fallbacks`** po kolei.
4. **Automatyczne wykrywanie** — dostawcy z prawidłowym uwierzytelnieniem, począwszy od
   bieżącego domyślnego dostawcy, a następnie pozostali dostawcy w kolejności alfabetycznej.

Jeśli dostawca zawiedzie, automatycznie podejmowana jest próba użycia kolejnego kandydata. Jeśli wszyscy
kandydaci zawiodą, błąd zawiera szczegóły każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby używać
wyłącznie jawnych wpisów `model`, `primary` i `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // opcjonalne nadpisanie limitu czasu żądania dostawcy dla poszczególnych narzędzi
      },
    },
  },
}
```

## Uwagi dotyczące dostawców

<AccordionGroup>
  <Accordion title="Alibaba">
    Korzysta z asynchronicznego punktu końcowego DashScope / Model Studio. Obrazy i
    filmy referencyjne muszą być zdalnymi adresami URL `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Identyfikator dostawcy: `byteplus`.

    Modele: `seedance-1-0-pro-250528` (domyślny),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Modele T2V (`*-t2v-*`) nie przyjmują wejść obrazowych; modele I2V i
    ogólne modele `*-pro-*` obsługują pojedynczy obraz referencyjny (pierwszą
    klatkę). Przekaż obraz pozycyjnie lub ustaw `role: "first_frame"`.
    Po podaniu obrazu identyfikatory modeli T2V są automatycznie zamieniane na odpowiadający
    wariant I2V.

    Obsługiwane klucze `providerOptions`: `seed` (liczba), `draft` (wartość logiczna —
    wymusza 480p), `camera_fixed` (wartość logiczna).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Wymaga pluginu [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (zewnętrznego, niedołączonego). Identyfikator dostawcy: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Korzysta z ujednoliconego API `content[]`. Obsługuje maksymalnie 2 obrazy wejściowe
    (`first_frame` + `last_frame`). Wszystkie wejścia muszą być zdalnymi adresami URL
    `https://`. Ustaw `role: "first_frame"` / `"last_frame"` dla każdego obrazu albo
    przekaż obrazy pozycyjnie.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje na podstawie obrazu wejściowego.
    `audio: true` jest mapowane na `generate_audio`. Wartość `providerOptions.seed`
    (liczba) jest przekazywana dalej.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Wymaga pluginu [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (zewnętrznego, niedołączonego). Identyfikator dostawcy: `byteplus-seedance2`. Modele:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Korzysta z ujednoliconego API `content[]`. Obsługuje maksymalnie 9 obrazów referencyjnych,
    3 filmy referencyjne i 3 dźwięki referencyjne. Wszystkie wejścia muszą być zdalnymi
    adresami URL `https://`. Ustaw `role` dla każdego zasobu — obsługiwane wartości:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje na podstawie obrazu wejściowego.
    `audio: true` jest mapowane na `generate_audio`. Wartość `providerOptions.seed`
    (liczba) jest przekazywana dalej.

  </Accordion>
  <Accordion title="ComfyUI">
    Lokalne wykonywanie lub wykonywanie w chmurze oparte na przepływach pracy. Obsługuje generowanie tekstu do wideo oraz
    obrazu do wideo za pomocą skonfigurowanego grafu.
  </Accordion>
  <Accordion title="fal">
    Używa przepływu opartego na kolejce do zadań długotrwałych. OpenClaw domyślnie czeka do 20
    minut, zanim uzna trwające zadanie w kolejce fal za
    przekraczające limit czasu. Większość modeli wideo fal
    przyjmuje jedno odwołanie do obrazu. Modele Seedance 2.0 generujące wideo
    na podstawie materiałów referencyjnych przyjmują do 9 obrazów, 3 filmów i 3 materiałów audio,
    przy czym łączna liczba plików referencyjnych nie może przekraczać 12.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Obsługuje jedno odwołanie do obrazu lub filmu. Żądania wygenerowania dźwięku są
    ignorowane z ostrzeżeniem w ścieżce API Gemini, ponieważ to API odrzuca
    parametr `generateAudio` dla bieżącego generowania wideo za pomocą Veo.
  </Accordion>
  <Accordion title="MiniMax">
    Obsługuje tylko jedno odwołanie do obrazu. MiniMax przyjmuje rozdzielczości `768P` i `1080P`;
    żądania takie jak `720P` są przed wysłaniem normalizowane do najbliższej
    obsługiwanej wartości.
  </Accordion>
  <Accordion title="OpenAI">
    Przekazywane jest tylko nadpisanie `size`. Inne nadpisania stylu
    (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z
    ostrzeżeniem.
  </Accordion>
  <Accordion title="OpenRouter">
    Używa asynchronicznego API `/videos` usługi OpenRouter. OpenClaw wysyła
    zadanie, cyklicznie sprawdza `polling_url` i pobiera zasób z `unsigned_urls` albo z
    udokumentowanego punktu końcowego zawartości zadania. Dołączony domyślny model `google/veo-3.1-fast`
    deklaruje czasy trwania 4/6/8 sekund, rozdzielczości `720P`/`1080P` oraz
    proporcje obrazu `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Używa tego samego zaplecza DashScope co Alibaba. Dane referencyjne muszą być zdalnymi
    adresami URL `http(s)`; pliki lokalne są odrzucane przed rozpoczęciem.
  </Accordion>
  <Accordion title="Runway">
    Obsługuje pliki lokalne za pomocą identyfikatorów URI danych. Generowanie wideo na podstawie wideo wymaga
    `runway/gen4_aleph`. Uruchomienia wyłącznie na podstawie tekstu udostępniają proporcje obrazu
    `16:9` i `9:16`.
  </Accordion>
  <Accordion title="Together">
    Obsługuje tylko jedno odwołanie do obrazu.
  </Accordion>
  <Accordion title="Vydra">
    Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań
    usuwających dane uwierzytelniające. `veo3` jest dołączony wyłącznie do generowania tekstu do wideo; `kling` wymaga
    zdalnego adresu URL obrazu.
  </Accordion>
  <Accordion title="xAI">
    Domyślny model `grok-imagine-video` obsługuje generowanie tekstu do wideo, generowanie
    obrazu do wideo na podstawie pojedynczego obrazu pierwszej klatki, do 7 danych wejściowych `reference_image` przez
    `reference_images` xAI oraz zdalne przepływy edycji i rozszerzania wideo. Generowanie domyślnie
    odbywa się w `480P`; generowanie obrazu do wideo z pojedynczego obrazu dziedziczy proporcje źródła, gdy
    pominięto `aspectRatio`. Edycja i rozszerzanie wideo dziedziczą geometrię wejściową i
    nie przyjmują nadpisań proporcji obrazu ani rozdzielczości. Rozszerzanie przyjmuje wartości od 2 do 10
    sekund.

    `grok-imagine-video-1.5` obsługuje wyłącznie generowanie obrazu do wideo: podaj dokładnie jeden obraz.
    Obsługuje czas od 1 do 15 sekund oraz `480P`, `720P` lub `1080P`, domyślnie
    używając `480P`; pomiń `aspectRatio`, aby odziedziczyć proporcje obrazu źródłowego. Identyfikatory wersji zapoznawczej
    i wersji 1.5 z datą podlegają tej samej walidacji i są przekazywane
    bez zmian.

  </Accordion>
</AccordionGroup>

## Tryby możliwości dostawców

Wspólny kontrakt generowania wideo obsługuje możliwości zależne od trybu
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

Płaskie pola zbiorcze, takie jak `maxInputImages` i `maxInputVideos`, **nie**
wystarczają do deklarowania obsługi trybów przekształcania. Dostawcy powinni
jawnie deklarować `generate`, `imageToVideo` i `videoToVideo`, aby testy
na żywo, testy kontraktowe i wspólne narzędzie `video_generate` mogły
deterministycznie weryfikować obsługę trybów.

Gdy jeden model dostawcy obsługuje więcej danych referencyjnych niż
pozostałe, użyj `maxInputImagesByModel`, `maxInputVideosByModel` lub
`maxInputAudiosByModel` zamiast zwiększać limit dla całego trybu.

## Testy na żywo

Opcjonalne pokrycie testami na żywo dla wspólnych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Skrypt opakowujący repozytorium:

```bash
pnpm test:live:media video
```

Ten plik testów na żywo domyślnie używa już wyeksportowanych zmiennych środowiskowych dostawców
przed zapisanymi profilami uwierzytelniania i domyślnie przeprowadza bezpieczny dla wydania test dymny:

- `generate` dla każdego dostawcy innego niż FAL objętego przebiegiem testowym.
- Jednosekundowe polecenie z homarem.
- Limit czasu operacji dla każdego dostawcy określony przez
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`).

FAL jest opcjonalny, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas
wydania:

```bash
pnpm test:live:media video --video-providers fal
```

Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić również zadeklarowane
tryby przekształcania, które wspólny przebieg testowy może bezpiecznie wykonać przy użyciu lokalnych multimediów:

- `imageToVideo`, gdy `capabilities.imageToVideo.enabled`.
- `videoToVideo`, gdy `capabilities.videoToVideo.enabled`, a
  dostawca/model przyjmuje lokalne wejście wideo oparte na buforze we wspólnym
  przebiegu testowym.

Obecnie wspólna ścieżka testów na żywo `videoToVideo` obejmuje tylko `runway`, gdy
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

Lub za pomocą CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Powiązane materiały

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Zadania w tle](/pl/automation/tasks) — śledzenie zadań asynchronicznego generowania wideo
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
