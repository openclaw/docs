---
read_when:
    - Generowanie wideo za pomocą agenta
    - Konfigurowanie dostawców i modeli generowania wideo
    - Zrozumienie parametrów narzędzia video_generate
sidebarTitle: Video generation
summary: Generuj filmy za pomocą video_generate na podstawie odniesień tekstowych, obrazowych lub wideo w 16 backendach dostawców.
title: Generowanie wideo
x-i18n:
    generated_at: "2026-05-05T06:20:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a86a820cc9f27baf4b17954d7ded7c2b7ff9eb456e7e75c3b2e7a7653cd675fd
    source_path: tools/video-generation.md
    workflow: 16
---

Agenty OpenClaw mogą generować wideo z promptów tekstowych, obrazów referencyjnych lub
istniejących wideo. Obsługiwanych jest szesnaście backendów dostawców, każdy z
innymi opcjami modeli, trybami wejścia i zestawami funkcji. Agent automatycznie wybiera
właściwego dostawcę na podstawie Twojej konfiguracji i dostępnych kluczy API.

<Note>
Narzędzie `video_generate` pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden
dostawca generowania wideo. Jeśli nie widzisz go w narzędziach agenta, ustaw
klucz API dostawcy albo skonfiguruj `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traktuje generowanie wideo jako trzy tryby runtime:

- `generate` — żądania text-to-video bez mediów referencyjnych.
- `imageToVideo` — żądanie zawiera jeden lub więcej obrazów referencyjnych.
- `videoToVideo` — żądanie zawiera jedno lub więcej wideo referencyjnych.

Dostawcy mogą obsługiwać dowolny podzbiór tych trybów. Narzędzie sprawdza
aktywny tryb przed wysłaniem i zgłasza obsługiwane tryby w `action=list`.

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
  <Step title="Poproś agenta">
    > Wygeneruj 5-sekundowe kinowe wideo przedstawiające przyjaznego homara surfującego o zachodzie słońca.

    Agent automatycznie wywołuje `video_generate`. Nie jest potrzebne
    dodawanie narzędzia do listy dozwolonych.

  </Step>
</Steps>

## Jak działa generowanie asynchroniczne

Generowanie wideo jest asynchroniczne. Gdy agent wywołuje `video_generate` w
sesji:

1. OpenClaw wysyła żądanie do dostawcy i natychmiast zwraca identyfikator zadania.
2. Dostawca przetwarza zadanie w tle (zwykle od 30 sekund do kilku minut, zależnie od dostawcy i rozdzielczości; wolni dostawcy obsługiwani przez kolejkę mogą działać aż do skonfigurowanego limitu czasu).
3. Gdy wideo jest gotowe, OpenClaw budzi tę samą sesję wewnętrznym zdarzeniem ukończenia.
4. Agent informuje użytkownika i załącza gotowe wideo. W czatach grupowych/kanałowych,
   które używają widocznego dostarczania wyłącznie przez narzędzie wiadomości, agent przekazuje
   wynik przez narzędzie wiadomości, zamiast publikować go bezpośrednio przez OpenClaw.

Gdy zadanie jest w toku, zduplikowane wywołania `video_generate` w tej samej
sesji zwracają bieżący stan zadania zamiast uruchamiać kolejne
generowanie. Użyj `openclaw tasks list` albo `openclaw tasks show <taskId>`, aby
sprawdzić postęp z CLI.

Poza uruchomieniami agentów opartymi na sesji (na przykład przy bezpośrednich wywołaniach narzędzia)
narzędzie przechodzi na generowanie inline i zwraca końcową ścieżkę do mediów
w tej samej turze.

Wygenerowane pliki wideo są zapisywane w zarządzanym przez OpenClaw magazynie mediów, gdy
dostawca zwraca bajty. Domyślny limit zapisu wygenerowanego wideo jest zgodny
z limitem mediów wideo, a `agents.defaults.mediaMaxMb` zwiększa go dla
większych renderów. Gdy dostawca zwraca także hostowany adres URL wyniku, OpenClaw
może dostarczyć ten adres URL zamiast kończyć zadanie niepowodzeniem, jeśli lokalne utrwalanie
odrzuci zbyt duży plik.

### Cykl życia zadania

| Stan        | Znaczenie                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Zadanie utworzone, czeka na zaakceptowanie przez dostawcę.                                             |
| `running`   | Dostawca przetwarza zadanie (zwykle od 30 sekund do kilku minut, zależnie od dostawcy i rozdzielczości). |
| `succeeded` | Wideo gotowe; agent budzi się i publikuje je w rozmowie.                                               |
| `failed`    | Błąd dostawcy lub przekroczenie limitu czasu; agent budzi się ze szczegółami błędu.                    |

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

| Dostawca              | Model domyślny                  | Tekst | Obraz referencyjny                                  | Wideo referencyjne                             | Uwierzytelnianie                         |
| --------------------- | ------------------------------- | :---: | --------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |   ✓   | Tak (zdalny adres URL)                              | Tak (zdalny adres URL)                         | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |   ✓   | Do 2 obrazów (tylko modele I2V; pierwsza + ostatnia klatka) | —                                      | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |   ✓   | Do 2 obrazów (pierwsza + ostatnia klatka przez rolę) | —                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |   ✓   | Do 9 obrazów referencyjnych                         | Do 3 wideo                                     | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |   ✓   | 1 obraz                                             | —                                              | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |   ✓   | —                                                   | —                                              | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |   ✓   | 1 obraz; do 9 z Seedance reference-to-video         | Do 3 wideo z Seedance reference-to-video       | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |   ✓   | 1 obraz                                             | 1 wideo                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |   ✓   | 1 obraz                                             | —                                              | `MINIMAX_API_KEY` lub MiniMax OAuth      |
| OpenAI                | `sora-2`                        |   ✓   | 1 obraz                                             | 1 wideo                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |   ✓   | Do 4 obrazów (pierwsza/ostatnia klatka albo referencje) | —                                          | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |   ✓   | Tak (zdalny adres URL)                              | Tak (zdalny adres URL)                         | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |   ✓   | 1 obraz                                             | 1 wideo                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |   ✓   | 1 obraz                                             | —                                              | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |   ✓   | 1 obraz (`kling`)                                   | —                                              | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |   ✓   | 1 obraz pierwszej klatki albo do 7 `reference_image`s | 1 wideo                                      | `XAI_API_KEY`                            |

Niektórzy dostawcy akceptują dodatkowe lub alternatywne zmienne środowiskowe klucza API. Szczegóły znajdziesz na
poszczególnych [stronach dostawców](#related).

Uruchom `video_generate action=list`, aby sprawdzić dostępnych dostawców, modele i
tryby runtime w czasie działania.

### Macierz możliwości

Jawny kontrakt trybów używany przez `video_generate`, testy kontraktowe i
wspólny live sweep:

| Dostawca   | `generate` | `imageToVideo` | `videoToVideo` | Dzisiejsze współdzielone ścieżki live                                                                                                     |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych adresów URL wideo `http(s)`                  |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Nie wchodzi we wspólny sweep; pokrycie specyficzne dla workflow znajduje się w testach Comfy                                             |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; natywne schematy wideo DeepInfra w dołączonym kontrakcie są typu text-to-video                                               |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` tylko przy użyciu Seedance reference-to-video                                                 |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; współdzielone `videoToVideo` pomijane, ponieważ obecny sweep Gemini/Veo oparty na buforze nie akceptuje tego wejścia |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; współdzielone `videoToVideo` pomijane, ponieważ ta organizacja/ścieżka wejścia obecnie wymaga dostępu do inpaint/remix po stronie dostawcy |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych adresów URL wideo `http(s)`                  |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` działa tylko wtedy, gdy wybrany model to `runway/gen4_aleph`                                  |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; współdzielone `imageToVideo` pomijane, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego adresu URL obrazu |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca obecnie wymaga zdalnego adresu URL MP4                       |

## Parametry narzędzia

### Wymagane

<ParamField path="prompt" type="string" required>
  Opis tekstowy wideo do wygenerowania. Wymagane dla `action: "generate"`.
</ParamField>

### Wejścia treści

<ParamField path="image" type="string">Pojedynczy obraz referencyjny (ścieżka lub URL).</ParamField>
<ParamField path="images" type="string[]">Wiele obrazów referencyjnych (do 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Opcjonalne wskazówki ról dla poszczególnych pozycji, równoległe do połączonej listy obrazów.
Wartości kanoniczne: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Pojedyncze wideo referencyjne (ścieżka lub URL).</ParamField>
<ParamField path="videos" type="string[]">Wiele wideo referencyjnych (do 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Opcjonalne wskazówki ról dla poszczególnych pozycji, równoległe do połączonej listy wideo.
Wartość kanoniczna: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Pojedyncze audio referencyjne (ścieżka lub URL). Używane jako muzyka w tle lub
referencja głosu, gdy dostawca obsługuje wejścia audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Wiele audio referencyjnych (do 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Opcjonalne wskazówki ról dla poszczególnych pozycji, równoległe do połączonej listy audio.
Wartość kanoniczna: `reference_audio`.
</ParamField>

<Note>
Wskazówki ról są przekazywane do dostawcy bez zmian. Wartości kanoniczne pochodzą z
unii `VideoGenerationAssetRole`, ale dostawcy mogą akceptować dodatkowe
ciągi ról. Tablice `*Roles` nie mogą mieć więcej wpisów niż
odpowiadająca im lista referencyjna; błędy przesunięcia o jeden kończą się czytelnym błędem.
Użyj pustego ciągu, aby pozostawić pozycję nieustawioną. Dla xAI ustaw każdą rolę obrazu na
`reference_image`, aby użyć trybu generowania `reference_images`; pomiń
rolę albo użyj `first_frame` dla wideo z pojedynczego obrazu.
</Note>

### Kontrolki stylu

<ParamField path="aspectRatio" type="string">
  Wskazówka proporcji obrazu, taka jak `1:1`, `16:9`, `9:16`, `adaptive` albo wartość specyficzna dla dostawcy. OpenClaw normalizuje albo ignoruje nieobsługiwane wartości zależnie od dostawcy.
</ParamField>
<ParamField path="resolution" type="string">Wskazówka rozdzielczości, taka jak `480P`, `720P`, `768P`, `1080P`, `4K` albo wartość specyficzna dla dostawcy. OpenClaw normalizuje albo ignoruje nieobsługiwane wartości zależnie od dostawcy.</ParamField>
<ParamField path="durationSeconds" type="number">
  Docelowy czas trwania w sekundach (zaokrąglany do najbliższej wartości obsługiwanej przez dostawcę).
</ParamField>
<ParamField path="size" type="string">Wskazówka rozmiaru, gdy dostawca ją obsługuje.</ParamField>
<ParamField path="audio" type="boolean">
  Włącz generowane audio w wyniku, gdy jest obsługiwane. Odrębne od `audioRef*` (wejścia).
</ParamField>
<ParamField path="watermark" type="boolean">Przełącz znak wodny dostawcy, gdy jest obsługiwany.</ParamField>

`adaptive` to wartownik specyficzny dla dostawcy: jest przekazywany bez zmian do
dostawców, którzy deklarują `adaptive` w swoich możliwościach (np. BytePlus
Seedance używa go do automatycznego wykrywania proporcji z wymiarów
obrazu wejściowego). Dostawcy, którzy go nie deklarują, ujawniają wartość przez
`details.ignoredOverrides` w wyniku narzędzia, aby pominięcie było widoczne.

### Zaawansowane

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` zwraca bieżące zadanie sesji; `"list"` sprawdza dostawców.
</ParamField>
<ParamField path="model" type="string">Nadpisanie dostawcy/modelu (np. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Wskazówka nazwy pliku wyjściowego.</ParamField>
<ParamField path="timeoutMs" type="number">Opcjonalny limit czasu operacji dostawcy w milisekundach.</ParamField>
<ParamField path="providerOptions" type="object">
  Opcje specyficzne dla dostawcy jako obiekt JSON (np. `{"seed": 42, "draft": true}`).
  Dostawcy deklarujący typowany schemat walidują klucze i typy; nieznane
  klucze albo niezgodności pomijają kandydata podczas fallbacku. Dostawcy bez
  zadeklarowanego schematu otrzymują opcje bez zmian. Uruchom `video_generate action=list`,
  aby zobaczyć, co akceptuje każdy dostawca.
</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw normalizuje czas trwania do
najbliższej wartości obsługiwanej przez dostawcę i mapuje przetłumaczone wskazówki geometrii,
takie jak rozmiar na proporcje obrazu, gdy dostawca fallbacku udostępnia inną
powierzchnię sterowania. Rzeczywiście nieobsługiwane nadpisania są ignorowane na zasadzie najlepszej próby
i zgłaszane jako ostrzeżenia w wyniku narzędzia. Twarde limity możliwości
(takie jak zbyt wiele wejść referencyjnych) kończą się niepowodzeniem przed przesłaniem. Wyniki narzędzia
zgłaszają zastosowane ustawienia; `details.normalization` przechwytuje każde
tłumaczenie z wartości żądanej na zastosowaną.
</Note>

Wejścia referencyjne wybierają tryb runtime:

- Brak mediów referencyjnych → `generate`
- Dowolna referencja obrazu → `imageToVideo`
- Dowolna referencja wideo → `videoToVideo`
- Wejścia audio referencyjnego **nie** zmieniają rozwiązanego trybu; są stosowane na
  wierzchu trybu wybranego przez referencje obrazu/wideo i działają tylko
  z dostawcami deklarującymi `maxInputAudios`.

Mieszane referencje obrazów i wideo nie są stabilną wspólną powierzchnią możliwości.
Preferuj jeden typ referencji na żądanie.

#### Fallback i typowane opcje

Niektóre kontrole możliwości są stosowane w warstwie fallbacku, a nie na
granicy narzędzia, więc żądanie przekraczające limity głównego dostawcy może
nadal zostać uruchomione u obsługującego je dostawcy fallbacku:

- Aktywny kandydat niedeklarujący `maxInputAudios` (albo deklarujący `0`) jest pomijany, gdy
  żądanie zawiera referencje audio; próbowany jest następny kandydat.
- `maxDurationSeconds` aktywnego kandydata jest niższe niż żądane `durationSeconds`
  i brak zadeklarowanej listy `supportedDurationSeconds` → pominięty.
- Żądanie zawiera `providerOptions`, a aktywny kandydat jawnie
  deklaruje typowany schemat `providerOptions` → pomijany, jeśli podane klucze
  nie znajdują się w schemacie albo typy wartości nie pasują. Dostawcy bez
  zadeklarowanego schematu otrzymują opcje bez zmian (zgodne wstecznie
  przekazanie). Dostawca może zrezygnować ze wszystkich opcji dostawcy,
  deklarując pusty schemat (`capabilities.providerOptions: {}`), co
  powoduje takie samo pominięcie jak niezgodność typu.

Pierwszy powód pominięcia w żądaniu jest logowany na poziomie `warn`, aby operatorzy widzieli, kiedy
ich główny dostawca został pominięty; kolejne pominięcia są logowane na poziomie `debug`, aby
długie łańcuchy fallbacku pozostały ciche. Jeśli każdy kandydat zostanie pominięty,
zagregowany błąd zawiera powód pominięcia dla każdego z nich.

## Akcje

| Akcja      | Co robi                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Domyślna. Tworzy wideo z podanego promptu i opcjonalnych wejść referencyjnych.                           |
| `status`   | Sprawdza stan zadania wideo w toku dla bieżącej sesji bez uruchamiania kolejnego generowania.            |
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
    Używa asynchronicznego punktu końcowego DashScope / Model Studio. Obrazy i
    wideo referencyjne muszą być zdalnymi URL-ami `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Identyfikator dostawcy: `byteplus`.

    Modele: `seedance-1-0-pro-250528` (domyślny),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Modele T2V (`*-t2v-*`) nie akceptują wejść obrazów; modele I2V oraz
    ogólne modele `*-pro-*` obsługują pojedynczy obraz referencyjny (pierwszą
    klatkę). Przekaż obraz pozycyjnie albo ustaw `role: "first_frame"`.
    Identyfikatory modeli T2V są automatycznie przełączane na odpowiadający wariant I2V,
    gdy podano obraz.

    Obsługiwane klucze `providerOptions`: `seed` (number), `draft` (boolean —
    wymusza 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Wymaga Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Identyfikator dostawcy: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Używa zunifikowanego API `content[]`. Obsługuje najwyżej 2 obrazy wejściowe
    (`first_frame` + `last_frame`). Wszystkie wejścia muszą być zdalnymi URL-ami
    `https://`. Ustaw `role: "first_frame"` / `"last_frame"` na każdym obrazie albo
    przekaż obrazy pozycyjnie.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego.
    `audio: true` mapuje się na `generate_audio`. `providerOptions.seed`
    (number) jest przekazywane dalej.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Wymaga Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Identyfikator dostawcy: `byteplus-seedance2`. Modele:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Używa zunifikowanego API `content[]`. Obsługuje do 9 obrazów referencyjnych,
    3 wideo referencyjne i 3 audio referencyjne. Wszystkie wejścia muszą być zdalnymi
    URL-ami `https://`. Ustaw `role` na każdym zasobie — obsługiwane wartości:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego.
    `audio: true` mapuje się na `generate_audio`. `providerOptions.seed`
    (number) jest przekazywane dalej.

  </Accordion>
  <Accordion title="ComfyUI">
    Wykonywanie lokalne lub w chmurze sterowane przepływem pracy. Obsługuje generowanie wideo z tekstu i z obrazu
    przez skonfigurowany graf.
  </Accordion>
  <Accordion title="fal">
    Używa przepływu opartego na kolejce dla długotrwałych zadań. OpenClaw domyślnie czeka do 20
    minut, zanim uzna trwające zadanie kolejki fal za przekroczone czasowo. Większość modeli wideo fal
    akceptuje pojedyncze odwołanie do obrazu. Modele Seedance 2.0 od odwołania do wideo
    akceptują do 9 obrazów, 3 wideo i 3 odwołań audio, przy
    maksymalnie 12 plikach referencyjnych łącznie.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Obsługuje jedno odwołanie do obrazu albo jedno odwołanie do wideo. Żądania generowanego audio są
    ignorowane z ostrzeżeniem na ścieżce API Gemini, ponieważ to API odrzuca
    parametr `generateAudio` dla obecnego generowania wideo Veo.
  </Accordion>
  <Accordion title="MiniMax">
    Tylko pojedyncze odwołanie do obrazu. MiniMax akceptuje rozdzielczości `768P` i `1080P`;
    żądania takie jak `720P` są normalizowane do najbliższej
    obsługiwanej wartości przed przesłaniem.
  </Accordion>
  <Accordion title="OpenAI">
    Przekazywane jest tylko nadpisanie `size`. Inne nadpisania stylu
    (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z
    ostrzeżeniem.
  </Accordion>
  <Accordion title="OpenRouter">
    Używa asynchronicznego API `/videos` OpenRouter. OpenClaw przesyła
    zadanie, odpytuje `polling_url` i pobiera albo `unsigned_urls`, albo
    udokumentowany punkt końcowy treści zadania. Dołączony domyślny model `google/veo-3.1-fast`
    deklaruje czasy trwania 4/6/8 sekund, rozdzielczości `720P`/`1080P` oraz
    proporcje obrazu `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Ten sam backend DashScope co Alibaba. Dane wejściowe odwołań muszą być zdalnymi
    adresami URL `http(s)`; pliki lokalne są odrzucane z góry.
  </Accordion>
  <Accordion title="Runway">
    Obsługuje pliki lokalne przez identyfikatory URI danych. Tryb wideo-na-wideo wymaga
    `runway/gen4_aleph`. Uruchomienia tylko tekstowe udostępniają proporcje obrazu
    `16:9` i `9:16`.
  </Accordion>
  <Accordion title="Together">
    Tylko pojedyncze odwołanie do obrazu.
  </Accordion>
  <Accordion title="Vydra">
    Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań
    usuwających uwierzytelnianie. `veo3` jest dołączony tylko jako tryb tekst-na-wideo; `kling` wymaga
    adresu URL zdalnego obrazu.
  </Accordion>
  <Accordion title="xAI">
    Obsługuje tekst-na-wideo, obraz pierwszej klatki do wideo, do 7
    danych wejściowych `reference_image` przez `reference_images` xAI oraz zdalne
    przepływy edycji/rozszerzania wideo.
  </Accordion>
</AccordionGroup>

## Tryby możliwości dostawców

Wspólny kontrakt generowania wideo obsługuje możliwości specyficzne dla trybu
zamiast wyłącznie płaskich limitów zagregowanych. Nowe implementacje dostawców
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

Płaskie pola zagregowane, takie jak `maxInputImages` i `maxInputVideos`, są
**niewystarczające**, aby deklarować obsługę trybu transformacji. Dostawcy powinni
jawnie deklarować `generate`, `imageToVideo` i `videoToVideo`, aby testy na żywo,
testy kontraktu i współdzielone narzędzie `video_generate` mogły deterministycznie
weryfikować obsługę trybów.

Gdy jeden model u dostawcy ma szerszą obsługę wejść referencyjnych niż
pozostałe, użyj `maxInputImagesByModel`, `maxInputVideosByModel` albo
`maxInputAudiosByModel` zamiast podnosić limit dla całego trybu.

## Testy na żywo

Opcjonalne pokrycie na żywo dla wspólnych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media video
```

Ten plik testów na żywo ładuje brakujące zmienne środowiskowe dostawcy z `~/.profile`, domyślnie preferuje
klucze API z trybu live/env przed zapisanymi profilami uwierzytelniania i domyślnie uruchamia
smoke bezpieczny dla wydania:

- `generate` dla każdego dostawcy spoza FAL w przeglądzie.
- Jednosekundowy prompt z homarem.
- Limit operacji dla każdego dostawcy z
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`).

FAL jest opcjonalny, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować
czas wydania:

```bash
pnpm test:live:media video --video-providers fal
```

Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane
tryby transformacji, które wspólny przegląd może bezpiecznie wykonać z lokalnymi mediami:

- `imageToVideo`, gdy `capabilities.imageToVideo.enabled`.
- `videoToVideo`, gdy `capabilities.videoToVideo.enabled` i
  dostawca/model akceptuje wejście lokalnego wideo oparte na buforze we wspólnym
  przeglądzie.

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

Albo przez CLI:

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
