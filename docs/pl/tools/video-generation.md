---
read_when:
    - Generowanie wideo za pomocą agenta
    - Konfigurowanie dostawców i modeli generowania wideo
    - Zrozumienie parametrów narzędzia video_generate
sidebarTitle: Video generation
summary: Generuj filmy za pomocą video_generate na podstawie referencji tekstowych, obrazowych lub wideo w 16 backendach dostawców
title: Generowanie wideo
x-i18n:
    generated_at: "2026-04-30T10:24:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91409057210af560d389513c2049d643c3e1602df51aa9825ceb01571626cdf
    source_path: tools/video-generation.md
    workflow: 16
---

Agenci OpenClaw mogą generować filmy z promptów tekstowych, obrazów referencyjnych lub
istniejących filmów. Obsługiwanych jest szesnaście backendów dostawców, każdy z
innymi opcjami modeli, trybami wejściowymi i zestawami funkcji. Agent automatycznie wybiera
właściwego dostawcę na podstawie Twojej konfiguracji i dostępnych kluczy API.

<Note>
Narzędzie `video_generate` pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden
dostawca generowania filmów. Jeśli nie widzisz go w narzędziach agenta, ustaw
klucz API dostawcy albo skonfiguruj `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traktuje generowanie filmów jako trzy tryby runtime:

- `generate` — żądania typu tekst-na-film bez mediów referencyjnych.
- `imageToVideo` — żądanie zawiera jeden lub więcej obrazów referencyjnych.
- `videoToVideo` — żądanie zawiera jeden lub więcej filmów referencyjnych.

Dostawcy mogą obsługiwać dowolny podzbiór tych trybów. Narzędzie waliduje
aktywny tryb przed przesłaniem i raportuje obsługiwane tryby w `action=list`.

## Szybki start

<Steps>
  <Step title="Skonfiguruj uwierzytelnianie">
    Ustaw klucz API dla dowolnego obsługiwanego dostawcy:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Wybierz domyślny model (opcjonalnie)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Poproś agenta">
    > Wygeneruj 5-sekundowy film kinowy przedstawiający przyjaznego homara surfującego o zachodzie słońca.

    Agent automatycznie wywołuje `video_generate`. Nie jest potrzebne dodawanie narzędzia
    do listy dozwolonych.

  </Step>
</Steps>

## Jak działa generowanie asynchroniczne

Generowanie filmów jest asynchroniczne. Gdy agent wywołuje `video_generate` w
sesji:

1. OpenClaw przesyła żądanie do dostawcy i natychmiast zwraca identyfikator zadania.
2. Dostawca przetwarza zadanie w tle (zwykle od 30 sekund do 5 minut, zależnie od dostawcy i rozdzielczości).
3. Gdy film jest gotowy, OpenClaw wybudza tę samą sesję wewnętrznym zdarzeniem ukończenia.
4. Agent publikuje gotowy film z powrotem w pierwotnej rozmowie.

Dopóki zadanie jest w toku, duplikaty wywołań `video_generate` w tej samej
sesji zwracają bieżący status zadania zamiast uruchamiać kolejne
generowanie. Użyj `openclaw tasks list` lub `openclaw tasks show <taskId>`, aby
sprawdzić postęp z CLI.

Poza uruchomieniami agentów opartymi na sesji (na przykład przy bezpośrednich wywołaniach narzędzi),
narzędzie wraca do generowania inline i zwraca końcową ścieżkę mediów
w tej samej turze.

Wygenerowane pliki wideo są zapisywane w zarządzanym przez OpenClaw magazynie mediów, gdy
dostawca zwraca bajty. Domyślny limit zapisu wygenerowanych filmów jest zgodny
z limitem mediów wideo, a `agents.defaults.mediaMaxMb` podnosi go dla
większych renderów. Gdy dostawca zwraca również hostowany URL wyjściowy, OpenClaw
może dostarczyć ten URL zamiast kończyć zadanie niepowodzeniem, jeśli lokalne utrwalanie
odrzuci zbyt duży plik.

### Cykl życia zadania

| Stan        | Znaczenie                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `queued`    | Zadanie utworzone, czeka na zaakceptowanie przez dostawcę.                                        |
| `running`   | Dostawca przetwarza zadanie (zwykle od 30 sekund do 5 minut, zależnie od dostawcy i rozdzielczości). |
| `succeeded` | Film gotowy; agent wybudza się i publikuje go w rozmowie.                                        |
| `failed`    | Błąd dostawcy lub przekroczenie limitu czasu; agent wybudza się ze szczegółami błędu.             |

Sprawdź status z CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Jeśli zadanie filmowe ma już stan `queued` albo `running` dla bieżącej sesji,
`video_generate` zwraca status istniejącego zadania zamiast uruchamiać nowe.
Użyj `action: "status"`, aby jawnie sprawdzić status bez wyzwalania nowego
generowania.

## Obsługiwani dostawcy

| Dostawca              | Model domyślny                  | Tekst | Ref. obraz                                            | Ref. film                                      | Uwierzytelnianie                         |
| --------------------- | ------------------------------- | :---: | ----------------------------------------------------- | --------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |   ✓   | Tak (zdalny URL)                                      | Tak (zdalny URL)                              | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |   ✓   | Do 2 obrazów (tylko modele I2V; pierwsza + ostatnia klatka) | —                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |   ✓   | Do 2 obrazów (pierwsza + ostatnia klatka przez rolę)  | —                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |   ✓   | Do 9 obrazów referencyjnych                           | Do 3 filmów                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |   ✓   | 1 obraz                                               | —                                             | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |   ✓   | —                                                     | —                                             | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |   ✓   | 1 obraz; do 9 z Seedance reference-to-video           | Do 3 filmów z Seedance reference-to-video     | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |   ✓   | 1 obraz                                               | 1 film                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |   ✓   | 1 obraz                                               | —                                             | `MINIMAX_API_KEY` lub MiniMax OAuth      |
| OpenAI                | `sora-2`                        |   ✓   | 1 obraz                                               | 1 film                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |   ✓   | Do 4 obrazów (pierwsza/ostatnia klatka albo referencje) | —                                             | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |   ✓   | Tak (zdalny URL)                                      | Tak (zdalny URL)                              | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |   ✓   | 1 obraz                                               | 1 film                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |   ✓   | 1 obraz                                               | —                                             | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |   ✓   | 1 obraz (`kling`)                                     | —                                             | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |   ✓   | 1 obraz pierwszej klatki albo do 7 `reference_image`s | 1 film                                        | `XAI_API_KEY`                            |

Niektórzy dostawcy akceptują dodatkowe lub alternatywne zmienne środowiskowe kluczy API. Zobacz
poszczególne [strony dostawców](#related), aby poznać szczegóły.

Uruchom `video_generate action=list`, aby sprawdzić dostępnych dostawców, modele i
tryby runtime w czasie działania.

### Macierz możliwości

Jawny kontrakt trybów używany przez `video_generate`, testy kontraktowe i
wspólny live sweep:

| Dostawca   | `generate` | `imageToVideo` | `videoToVideo` | Wspólne live lanes dzisiaj                                                                                                               |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych adresów URL filmów `http(s)`                 |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Nieobjęte wspólnym sweepem; pokrycie specyficzne dla workflow znajduje się w testach Comfy                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; natywne schematy wideo DeepInfra w dołączonym kontrakcie są typu tekst-na-film                                               |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` tylko przy użyciu Seedance reference-to-video                                                 |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; wspólne `videoToVideo` pomijane, ponieważ bieżący sweep Gemini/Veo oparty na buforze nie akceptuje tego wejścia |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; wspólne `videoToVideo` pomijane, ponieważ ta organizacja/ścieżka wejścia obecnie wymaga dostępu inpaint/remix po stronie dostawcy |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych adresów URL filmów `http(s)`                 |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` działa tylko wtedy, gdy wybrany model to `runway/gen4_aleph`                                  |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; wspólne `imageToVideo` pomijane, ponieważ dołączony `veo3` jest tylko tekstowy, a dołączony `kling` wymaga zdalnego URL obrazu |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca obecnie wymaga zdalnego URL MP4                              |

## Parametry narzędzia

### Wymagane

<ParamField path="prompt" type="string" required>
  Opis tekstowy filmu do wygenerowania. Wymagany dla `action: "generate"`.
</ParamField>

### Wejścia treści

<ParamField path="image" type="string">Pojedynczy obraz referencyjny (ścieżka lub URL).</ParamField>
<ParamField path="images" type="string[]">Wiele obrazów referencyjnych (do 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Opcjonalne wskazówki ról dla poszczególnych pozycji, równoległe do połączonej listy obrazów.
Wartości kanoniczne: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Pojedynczy film referencyjny (ścieżka lub URL).</ParamField>
<ParamField path="videos" type="string[]">Wiele filmów referencyjnych (do 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Opcjonalne wskazówki ról dla poszczególnych pozycji, równoległe do połączonej listy filmów.
Wartość kanoniczna: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Pojedynczy dźwięk referencyjny (ścieżka lub URL). Używany jako muzyka w tle lub odniesienie głosowe,
gdy dostawca obsługuje wejścia audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Wiele dźwięków referencyjnych (do 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Opcjonalne wskazówki ról dla poszczególnych pozycji, równoległe do połączonej listy audio.
Wartość kanoniczna: `reference_audio`.
</ParamField>

<Note>
Wskazówki ról są przekazywane dostawcy bez zmian. Wartości kanoniczne pochodzą
z unii `VideoGenerationAssetRole`, ale dostawcy mogą akceptować dodatkowe
ciągi ról. Tablice `*Roles` nie mogą mieć więcej wpisów niż odpowiednia
lista referencyjna; błędy przesunięcia o jeden kończą się czytelnym błędem.
Użyj pustego ciągu, aby pozostawić miejsce nieustawione. Dla xAI ustaw każdą rolę obrazu na
`reference_image`, aby użyć trybu generowania `reference_images`; pomiń
rolę albo użyj `first_frame` dla obrazu-do-filmu z pojedynczym obrazem.
</Note>

### Kontrolki stylu

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` lub `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` lub `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Docelowy czas trwania w sekundach (zaokrąglany do najbliższej wartości obsługiwanej przez dostawcę).
</ParamField>
<ParamField path="size" type="string">Wskazówka rozmiaru, gdy dostawca ją obsługuje.</ParamField>
<ParamField path="audio" type="boolean">
  Włącz generowane audio w wyniku, gdy jest obsługiwane. Różni się od `audioRef*` (wejścia).
</ParamField>
<ParamField path="watermark" type="boolean">Przełącz znak wodny dostawcy, gdy jest obsługiwany.</ParamField>

`adaptive` to sentinel specyficzny dla dostawcy: jest przekazywany bez zmian
do dostawców, którzy deklarują `adaptive` w swoich możliwościach (np. BytePlus
Seedance używa go do automatycznego wykrywania proporcji na podstawie wymiarów
obrazu wejściowego). Dostawcy, którzy go nie deklarują, ujawniają tę wartość przez
`details.ignoredOverrides` w wyniku narzędzia, aby pominięcie było widoczne.

### Zaawansowane

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` zwraca bieżące zadanie sesji; `"list"` sprawdza dostawców.
</ParamField>
<ParamField path="model" type="string">Nadpisanie dostawcy/modelu (np. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Wskazówka nazwy pliku wyjściowego.</ParamField>
<ParamField path="timeoutMs" type="number">Opcjonalny limit czasu żądania dostawcy w milisekundach.</ParamField>
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
takie jak rozmiar-do-proporcji, gdy dostawca fallbacku udostępnia inną
powierzchnię sterowania. Faktycznie nieobsługiwane nadpisania są ignorowane w trybie najlepszej
próby i raportowane jako ostrzeżenia w wyniku narzędzia. Twarde limity możliwości
(takie jak zbyt wiele wejść referencyjnych) powodują błąd przed przesłaniem. Wyniki narzędzia
raportują zastosowane ustawienia; `details.normalization` przechwytuje każde
tłumaczenie żądane-do-zastosowanego.
</Note>

Wejścia referencyjne wybierają tryb runtime:

- Brak mediów referencyjnych → `generate`
- Dowolne odniesienie obrazu → `imageToVideo`
- Dowolne odniesienie filmu → `videoToVideo`
- Wejścia audio referencyjnego **nie** zmieniają rozwiązanego trybu; są stosowane
  na wierzchu dowolnego trybu wybranego przez odniesienia obrazu/filmu i działają tylko
  z dostawcami, którzy deklarują `maxInputAudios`.

Mieszane odniesienia obrazów i filmów nie są stabilną wspólną powierzchnią możliwości.
Preferuj jeden typ odniesienia na żądanie.

#### Fallback i typowane opcje

Niektóre kontrole możliwości są stosowane w warstwie fallbacku, a nie na
granicy narzędzia, więc żądanie przekraczające limity głównego dostawcy może
nadal działać u zdolnego dostawcy fallbacku:

- Aktywny kandydat niedeklarujący `maxInputAudios` (lub `0`) jest pomijany, gdy
  żądanie zawiera odniesienia audio; próbowany jest następny kandydat.
- `maxDurationSeconds` aktywnego kandydata poniżej żądanego `durationSeconds`
  bez zadeklarowanej listy `supportedDurationSeconds` → pominięty.
- Żądanie zawiera `providerOptions`, a aktywny kandydat jawnie
  deklaruje typowany schemat `providerOptions` → pominięty, jeśli podane klucze
  nie są w schemacie lub typy wartości się nie zgadzają. Dostawcy bez
  zadeklarowanego schematu otrzymują opcje bez zmian (wstecznie zgodne
  przekazanie). Dostawca może zrezygnować ze wszystkich opcji dostawcy,
  deklarując pusty schemat (`capabilities.providerOptions: {}`), co
  powoduje takie samo pominięcie jak niezgodność typu.

Pierwszy powód pominięcia w żądaniu jest logowany na poziomie `warn`, aby operatorzy widzieli,
kiedy ich główny dostawca został pominięty; kolejne pominięcia są logowane na poziomie `debug`,
aby długie łańcuchy fallbacku pozostały ciche. Jeśli każdy kandydat zostanie pominięty,
zagregowany błąd zawiera powód pominięcia dla każdego z nich.

## Działania

| Działanie  | Co robi                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Domyślnie. Tworzy film z podanego promptu i opcjonalnych wejść referencyjnych.                           |
| `status`   | Sprawdza stan trwającego zadania wideo dla bieżącej sesji bez rozpoczynania kolejnego generowania.       |
| `list`     | Pokazuje dostępnych dostawców, modele i ich możliwości.                                                  |

## Wybór modelu

OpenClaw rozwiązuje model w tej kolejności:

1. **Parametr narzędzia `model`** — jeśli agent określi go w wywołaniu.
2. **`videoGenerationModel.primary`** z konfiguracji.
3. **`videoGenerationModel.fallbacks`** w kolejności.
4. **Automatyczne wykrywanie** — dostawcy z prawidłowym uwierzytelnieniem, zaczynając od
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
    ID dostawcy: `byteplus`.

    Modele: `seedance-1-0-pro-250528` (domyślny),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Modele T2V (`*-t2v-*`) nie akceptują wejść obrazów; modele I2V i
    ogólne modele `*-pro-*` obsługują pojedynczy obraz referencyjny (pierwszą
    klatkę). Przekaż obraz pozycyjnie albo ustaw `role: "first_frame"`.
    ID modeli T2V są automatycznie przełączane na odpowiedni wariant I2V,
    gdy podano obraz.

    Obsługiwane klucze `providerOptions`: `seed` (liczba), `draft` (boolean —
    wymusza 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Wymaga Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID dostawcy: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Używa ujednoliconego API `content[]`. Obsługuje najwyżej 2 obrazy wejściowe
    (`first_frame` + `last_frame`). Wszystkie wejścia muszą być zdalnymi URL-ami
    `https://`. Ustaw `role: "first_frame"` / `"last_frame"` na każdym obrazie albo
    przekaż obrazy pozycyjnie.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego.
    `audio: true` mapuje się na `generate_audio`. `providerOptions.seed`
    (liczba) jest przekazywany dalej.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Wymaga Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID dostawcy: `byteplus-seedance2`. Modele:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Używa ujednoliconego API `content[]`. Obsługuje do 9 obrazów referencyjnych,
    3 filmów referencyjnych i 3 dźwięków referencyjnych. Wszystkie wejścia muszą być zdalnymi
    URL-ami `https://`. Ustaw `role` na każdym zasobie — obsługiwane wartości:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego.
    `audio: true` mapuje się na `generate_audio`. `providerOptions.seed`
    (liczba) jest przekazywany dalej.

  </Accordion>
  <Accordion title="ComfyUI">
    Lokalne lub chmurowe wykonywanie sterowane workflow. Obsługuje tekst-do-filmu i
    obraz-do-filmu przez skonfigurowany graf.
  </Accordion>
  <Accordion title="fal">
    Używa przepływu opartego na kolejce dla długotrwałych zadań. Większość modeli wideo fal
    akceptuje pojedyncze odniesienie obrazu. Modele Seedance 2.0 reference-to-video
    akceptują do 9 obrazów, 3 filmów i 3 odniesień audio, z
    najwyżej 12 łącznymi plikami referencyjnymi.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Obsługuje jedno odniesienie obrazu albo jedno odniesienie filmu.
  </Accordion>
  <Accordion title="MiniMax">
    Tylko pojedyncze odniesienie obrazu.
  </Accordion>
  <Accordion title="OpenAI">
    Przekazywane jest tylko nadpisanie `size`. Inne nadpisania stylu
    (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z
    ostrzeżeniem.
  </Accordion>
  <Accordion title="OpenRouter">
    Używa asynchronicznego API `/videos` OpenRouter. OpenClaw przesyła
    zadanie, odpytuje `polling_url` i pobiera albo `unsigned_urls`, albo
    udokumentowany endpoint treści zadania. Dołączony domyślny `google/veo-3.1-fast`
    deklaruje czasy trwania 4/6/8 sekund, rozdzielczości `720P`/`1080P` i
    proporcje `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Ten sam backend DashScope co Alibaba. Wejścia referencyjne muszą być zdalnymi
    URL-ami `http(s)`; pliki lokalne są odrzucane z góry.
  </Accordion>
  <Accordion title="Runway">
    Obsługuje pliki lokalne przez identyfikatory URI danych. Video-to-video wymaga
    `runway/gen4_aleph`. Uruchomienia tylko tekstowe udostępniają proporcje
    `16:9` i `9:16`.
  </Accordion>
  <Accordion title="Together">
    Tylko pojedyncze odniesienie obrazu.
  </Accordion>
  <Accordion title="Vydra">
    Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań
    usuwających uwierzytelnienie. `veo3` jest dołączony tylko jako tekst-do-filmu; `kling` wymaga
    zdalnego URL-a obrazu.
  </Accordion>
  <Accordion title="xAI">
    Obsługuje tekst-do-filmu, obraz-do-filmu z pojedynczą pierwszą klatką, do 7
    wejść `reference_image` przez `reference_images` xAI oraz zdalne
    przepływy edycji/rozszerzania filmu.
  </Accordion>
</AccordionGroup>

## Tryby możliwości dostawców

Wspólny kontrakt generowania wideo obsługuje możliwości specyficzne dla trybu zamiast wyłącznie płaskich limitów zbiorczych. Nowe implementacje dostawców powinny preferować jawne bloki trybów:

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

Płaskie pola zbiorcze, takie jak `maxInputImages` i `maxInputVideos`, **nie** wystarczają do deklarowania obsługi trybów transformacji. Dostawcy powinni jawnie deklarować `generate`, `imageToVideo` i `videoToVideo`, aby testy live, testy kontraktu oraz współdzielone narzędzie `video_generate` mogły deterministycznie weryfikować obsługę trybów.

Gdy jeden model u dostawcy obsługuje szerszy zakres wejść referencyjnych niż pozostałe, użyj `maxInputImagesByModel`, `maxInputVideosByModel` lub `maxInputAudiosByModel` zamiast podnosić limit dla całego trybu.

## Testy live

Opcjonalne pokrycie live dla współdzielonych wbudowanych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media video
```

Ten plik live ładuje brakujące zmienne środowiskowe dostawców z `~/.profile`, domyślnie preferuje klucze API z live/env przed zapisanymi profilami uwierzytelniania i domyślnie uruchamia bezpieczny dla wydania smoke test:

- `generate` dla każdego dostawcy spoza FAL objętego przebiegiem.
- Jednosekundowy prompt z homarem.
- Limit operacji na dostawcę z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`).

FAL jest opcjonalny, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas wydania:

```bash
pnpm test:live:media video --video-providers fal
```

Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane tryby transformacji, które współdzielony przebieg może bezpiecznie wykonać z lokalnymi multimediami:

- `imageToVideo`, gdy `capabilities.imageToVideo.enabled`.
- `videoToVideo`, gdy `capabilities.videoToVideo.enabled` oraz dostawca/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym przebiegu.

Obecnie współdzielona ścieżka live `videoToVideo` obejmuje tylko `runway`, gdy wybierzesz `runway/gen4_aleph`.

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

Lub przez CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Powiązane

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Zadania w tle](/pl/automation/tasks) — śledzenie zadań dla asynchronicznego generowania wideo
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
