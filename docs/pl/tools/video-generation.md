---
read_when:
    - Generowanie wideo za pomocą agenta
    - Konfigurowanie dostawców i modeli generowania wideo
    - Omówienie parametrów narzędzia video_generate
sidebarTitle: Video generation
summary: Generuj filmy za pomocą video_generate na podstawie referencji tekstowych, obrazowych lub wideo w 16 backendach dostawców
title: Generowanie wideo
x-i18n:
    generated_at: "2026-05-06T09:34:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebc8b61785f69c1354951be2d6b3e7b437c99994513f13e19faf3a9e420263fb
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw agents can generate videos from text prompts, reference images, or
existing videos. Sixteen provider backends are supported, each with
different model options, input modes, and feature sets. The agent picks the
right provider automatically based on your configuration and available API
keys.

<Note>
The `video_generate` tool only appears when at least one video-generation
provider is available. If you do not see it in your agent tools, set a
provider API key or configure `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw treats video generation as three runtime modes:

- `generate` - text-to-video requests with no reference media.
- `imageToVideo` - request includes one or more reference images.
- `videoToVideo` - request includes one or more reference videos.

Providers can support any subset of those modes. The tool validates the
active mode before submission and reports supported modes in `action=list`.

## Quick start

<Steps>
  <Step title="Configure auth">
    Set an API key for any supported provider:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pick a default model (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ask the agent">
    > Generate a 5-second cinematic video of a friendly lobster surfing at sunset.

    The agent calls `video_generate` automatically. No tool allowlisting
    is needed.

  </Step>
</Steps>

## How async generation works

Video generation is asynchronous. When the agent calls `video_generate` in a
session:

1. OpenClaw submits the request to the provider and immediately returns a task id.
2. The provider processes the job in the background (typically 30 seconds to several minutes depending on the provider and resolution; slow queue-backed providers can run up to the configured timeout).
3. When the video is ready, OpenClaw wakes the same session with an internal completion event.
4. The agent tells the user and attaches the finished video. In group/channel
   chats that use message-tool-only visible delivery, the agent relays the
   result through the message tool instead of OpenClaw posting it directly.

While a job is in flight, duplicate `video_generate` calls in the same
session return the current task status instead of starting another
generation. Use `openclaw tasks list` or `openclaw tasks show <taskId>` to
check progress from the CLI.

Outside of session-backed agent runs (for example, direct tool invocations),
the tool falls back to inline generation and returns the final media path
in the same turn.

Generated video files are saved under OpenClaw-managed media storage when
the provider returns bytes. The default generated-video save cap follows
the video media limit, and `agents.defaults.mediaMaxMb` raises it for
larger renders. When a provider also returns a hosted output URL, OpenClaw
can deliver that URL instead of failing the task if local persistence
rejects an oversized file.

### Task lifecycle

| State       | Meaning                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Task created, waiting for the provider to accept it.                                                   |
| `running`   | Provider is processing (typically 30 seconds to several minutes depending on provider and resolution). |
| `succeeded` | Video ready; the agent wakes and posts it to the conversation.                                         |
| `failed`    | Provider error or timeout; the agent wakes with error details.                                         |

Check status from the CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

If a video task is already `queued` or `running` for the current session,
`video_generate` returns the existing task status instead of starting a new
one. Use `action: "status"` to check explicitly without triggering a new
generation.

## Supported providers

| Provider              | Default model                   | Text | Image ref                                            | Video ref                                       | Auth                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Yes (remote URL)                                     | Yes (remote URL)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Up to 2 images (I2V models only; first + last frame) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Up to 2 images (first + last frame via role)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Up to 9 reference images                             | Up to 3 videos                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 image                                              | -                                               | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 image; up to 9 with Seedance reference-to-video    | Up to 3 videos with Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 image                                              | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 image                                              | -                                               | `MINIMAX_API_KEY` or MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 image                                              | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Up to 4 images (first/last frame or references)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Yes (remote URL)                                     | Yes (remote URL)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 image                                              | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 image                                              | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 image (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 first-frame image or up to 7 `reference_image`s    | 1 video                                         | `XAI_API_KEY`                            |

Some providers accept additional or alternate API key env vars. See
individual [provider pages](#related) for details.

Run `video_generate action=list` to inspect available providers, models, and
runtime modes at runtime.

### Capability matrix

The explicit mode contract used by `video_generate`, contract tests, and
the shared live sweep:

| Provider   | `generate` | `imageToVideo` | `videoToVideo` | Shared live lanes today                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` skipped because this provider needs remote `http(s)` video URLs                               |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       -        | Not in the shared sweep; workflow-specific coverage lives with Comfy tests                                                               |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; native DeepInfra video schemas are text-to-video in the bundled contract                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` only when using Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; shared `videoToVideo` skipped because the current buffer-backed Gemini/Veo sweep does not accept that input  |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; shared `videoToVideo` skipped because this org/input path currently needs provider-side inpaint/remix access |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` skipped because this provider needs remote `http(s)` video URLs                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` runs only when the selected model is `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; shared `imageToVideo` skipped because bundled `veo3` is text-only and bundled `kling` requires a remote image URL            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` skipped because this provider currently needs a remote MP4 URL                                |

## Tool parameters

### Required

<ParamField path="prompt" type="string" required>
  Text description of the video to generate. Required for `action: "generate"`.
</ParamField>

### Content inputs

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
Pojedyncze audio referencyjne (ścieżka lub URL). Używane do muzyki w tle lub
odniesienia głosowego, gdy dostawca obsługuje wejścia audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Wiele plików audio referencyjnych (do 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Opcjonalne wskazówki ról dla poszczególnych pozycji, równoległe do połączonej listy audio.
Wartość kanoniczna: `reference_audio`.
</ParamField>

<Note>
Wskazówki ról są przekazywane dostawcy bez zmian. Wartości kanoniczne pochodzą z
unii `VideoGenerationAssetRole`, ale dostawcy mogą akceptować dodatkowe
ciągi ról. Tablice `*Roles` nie mogą mieć więcej wpisów niż
odpowiadająca im lista referencji; błędy przesunięcia o jeden kończą się jasnym błędem.
Użyj pustego ciągu, aby pozostawić pozycję nieustawioną. W przypadku xAI ustaw każdą rolę obrazu na
`reference_image`, aby użyć trybu generowania `reference_images`; pomiń
rolę lub użyj `first_frame` dla przekształcania pojedynczego obrazu w film.
</Note>

### Kontrolki stylu

<ParamField path="aspectRatio" type="string">
  Wskazówka proporcji obrazu, taka jak `1:1`, `16:9`, `9:16`, `adaptive` lub wartość specyficzna dla dostawcy. OpenClaw normalizuje albo ignoruje nieobsługiwane wartości zależnie od dostawcy.
</ParamField>
<ParamField path="resolution" type="string">Wskazówka rozdzielczości, taka jak `480P`, `720P`, `768P`, `1080P`, `4K` lub wartość specyficzna dla dostawcy. OpenClaw normalizuje albo ignoruje nieobsługiwane wartości zależnie od dostawcy.</ParamField>
<ParamField path="durationSeconds" type="number">
  Docelowy czas trwania w sekundach (zaokrąglany do najbliższej wartości obsługiwanej przez dostawcę).
</ParamField>
<ParamField path="size" type="string">Wskazówka rozmiaru, gdy dostawca ją obsługuje.</ParamField>
<ParamField path="audio" type="boolean">
  Włącz wygenerowane audio w wyniku, gdy jest obsługiwane. Odrębne od `audioRef*` (wejść).
</ParamField>
<ParamField path="watermark" type="boolean">Przełącz znak wodny dostawcy, gdy jest obsługiwany.</ParamField>

`adaptive` jest znacznikiem specyficznym dla dostawcy: jest przekazywany bez zmian do
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
  Dostawcy, którzy deklarują typowany schemat, weryfikują klucze i typy; nieznane
  klucze lub niezgodności pomijają kandydata podczas przełączania awaryjnego. Dostawcy bez
  zadeklarowanego schematu otrzymują opcje bez zmian. Uruchom `video_generate action=list`,
  aby zobaczyć, co akceptuje każdy dostawca.
</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw normalizuje czas trwania do
najbliższej wartości obsługiwanej przez dostawcę i przemapowuje przetłumaczone wskazówki geometrii,
takie jak rozmiar na proporcje obrazu, gdy dostawca awaryjny udostępnia inną
powierzchnię sterowania. Faktycznie nieobsługiwane nadpisania są ignorowane w trybie najlepszej próby
i zgłaszane jako ostrzeżenia w wyniku narzędzia. Twarde limity możliwości
(takie jak zbyt wiele wejść referencyjnych) kończą się błędem przed przesłaniem. Wyniki narzędzia
zgłaszają zastosowane ustawienia; `details.normalization` przechwytuje każde
tłumaczenie z żądanego na zastosowane.
</Note>

Wejścia referencyjne wybierają tryb uruchomieniowy:

- Brak mediów referencyjnych → `generate`
- Dowolna referencja obrazu → `imageToVideo`
- Dowolna referencja filmu → `videoToVideo`
- Wejścia audio referencyjnego **nie** zmieniają rozwiązanego trybu; są stosowane
  na wierzchu trybu wybranego przez referencje obrazu/filmu i działają tylko
  z dostawcami, którzy deklarują `maxInputAudios`.

Mieszane referencje obrazów i filmów nie są stabilną wspólną powierzchnią możliwości.
Preferuj jeden typ referencji na żądanie.

#### Przełączanie awaryjne i typowane opcje

Niektóre kontrole możliwości są stosowane w warstwie przełączania awaryjnego, a nie na
granicy narzędzia, więc żądanie przekraczające limity głównego dostawcy może
nadal zostać uruchomione u zdolnego dostawcy awaryjnego:

- Aktywny kandydat, który nie deklaruje `maxInputAudios` (lub deklaruje `0`), jest pomijany, gdy
  żądanie zawiera referencje audio; próbowany jest następny kandydat.
- `maxDurationSeconds` aktywnego kandydata poniżej żądanego `durationSeconds`
  bez zadeklarowanej listy `supportedDurationSeconds` → pomijany.
- Żądanie zawiera `providerOptions`, a aktywny kandydat jawnie
  deklaruje typowany schemat `providerOptions` → pomijany, jeśli podane klucze
  nie znajdują się w schemacie lub typy wartości nie pasują. Dostawcy bez
  zadeklarowanego schematu otrzymują opcje bez zmian (wstecznie zgodne
  przekazanie). Dostawca może zrezygnować ze wszystkich opcji dostawcy przez
  zadeklarowanie pustego schematu (`capabilities.providerOptions: {}`), co
  powoduje takie samo pominięcie jak niezgodność typu.

Pierwszy powód pominięcia w żądaniu jest logowany na poziomie `warn`, aby operatorzy widzieli, kiedy
ich główny dostawca został pominięty; kolejne pominięcia są logowane na poziomie `debug`, aby
długie łańcuchy przełączania awaryjnego pozostawały ciche. Jeśli każdy kandydat zostanie pominięty,
zagregowany błąd zawiera powód pominięcia dla każdego z nich.

## Akcje

| Akcja      | Co robi                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Domyślna. Tworzy film z podanego promptu i opcjonalnych wejść referencyjnych.                            |
| `status`   | Sprawdza stan zadania filmowego w toku dla bieżącej sesji bez uruchamiania kolejnego generowania.        |
| `list`     | Pokazuje dostępnych dostawców, modele i ich możliwości.                                                  |

## Wybór modelu

OpenClaw rozwiązuje model w tej kolejności:

1. **Parametr narzędzia `model`** - jeśli agent określi go w wywołaniu.
2. **`videoGenerationModel.primary`** z konfiguracji.
3. **`videoGenerationModel.fallbacks`** w kolejności.
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
    Używa asynchronicznego punktu końcowego DashScope / Model Studio. Obrazy i
    filmy referencyjne muszą być zdalnymi URL-ami `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Identyfikator dostawcy: `byteplus`.

    Modele: `seedance-1-0-pro-250528` (domyślny),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Modele T2V (`*-t2v-*`) nie akceptują wejść obrazów; modele I2V oraz
    ogólne modele `*-pro-*` obsługują pojedynczy obraz referencyjny (pierwszą
    klatkę). Przekaż obraz pozycyjnie albo ustaw `role: "first_frame"`.
    Identyfikatory modeli T2V są automatycznie przełączane na odpowiadający im
    wariant I2V, gdy podany jest obraz.

    Obsługiwane klucze `providerOptions`: `seed` (liczba), `draft` (wartość logiczna -
    wymusza 480p), `camera_fixed` (wartość logiczna).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Wymaga Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Identyfikator dostawcy: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Używa ujednoliconego API `content[]`. Obsługuje najwyżej 2 obrazy wejściowe
    (`first_frame` + `last_frame`). Wszystkie wejścia muszą być zdalnymi URL-ami `https://`.
    Ustaw `role: "first_frame"` / `"last_frame"` na każdym obrazie albo
    przekaż obrazy pozycyjnie.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego.
    `audio: true` mapuje się na `generate_audio`. `providerOptions.seed`
    (liczba) jest przekazywany dalej.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Wymaga Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Identyfikator dostawcy: `byteplus-seedance2`. Modele:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Używa ujednoliconego API `content[]`. Obsługuje do 9 obrazów referencyjnych,
    3 filmy referencyjne i 3 pliki audio referencyjne. Wszystkie wejścia muszą być zdalnymi
    URL-ami `https://`. Ustaw `role` na każdym zasobie - obsługiwane wartości:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego.
    `audio: true` mapuje się na `generate_audio`. `providerOptions.seed`
    (liczba) jest przekazywany dalej.

  </Accordion>
  <Accordion title="ComfyUI">
    Wykonywanie lokalne lub w chmurze sterowane przepływem pracy. Obsługuje
    konwersję tekstu na wideo i obrazu na wideo za pomocą skonfigurowanego grafu.
  </Accordion>
  <Accordion title="fal">
    Używa przepływu opartego na kolejce dla długotrwałych zadań. OpenClaw czeka
    domyślnie do 20 minut, zanim uzna trwające zadanie w kolejce fal za
    przekroczone czasowo. Większość modeli wideo fal akceptuje pojedyncze
    odwołanie do obrazu. Modele Seedance 2.0 reference-to-video akceptują do 9
    obrazów, 3 wideo i 3 odwołań audio, z maksymalnie 12 plikami referencyjnymi
    łącznie.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Obsługuje jedno odwołanie do obrazu lub jedno odwołanie do wideo. Żądania
    wygenerowanego audio są ignorowane z ostrzeżeniem na ścieżce API Gemini,
    ponieważ ten interfejs API odrzuca parametr `generateAudio` dla bieżącego
    generowania wideo Veo.
  </Accordion>
  <Accordion title="MiniMax">
    Tylko pojedyncze odwołanie do obrazu. MiniMax akceptuje rozdzielczości
    `768P` i `1080P`; żądania takie jak `720P` są przed wysłaniem normalizowane
    do najbliższej obsługiwanej wartości.
  </Accordion>
  <Accordion title="OpenAI">
    Przekazywane jest tylko nadpisanie `size`. Inne nadpisania stylu
    (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z
    ostrzeżeniem.
  </Accordion>
  <Accordion title="OpenRouter">
    Używa asynchronicznego API `/videos` OpenRouter. OpenClaw wysyła zadanie,
    odpytuje `polling_url` i pobiera `unsigned_urls` albo udokumentowany punkt
    końcowy treści zadania. Dołączona domyślna wartość `google/veo-3.1-fast`
    deklaruje czasy trwania 4/6/8 sekund, rozdzielczości `720P`/`1080P` oraz
    proporcje obrazu `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Ten sam backend DashScope co Alibaba. Wejścia referencyjne muszą być zdalnymi
    adresami URL `http(s)`; pliki lokalne są odrzucane z góry.
  </Accordion>
  <Accordion title="Runway">
    Obsługuje pliki lokalne przez identyfikatory URI danych. Konwersja wideo na
    wideo wymaga `runway/gen4_aleph`. Uruchomienia wyłącznie tekstowe udostępniają
    proporcje obrazu `16:9` i `9:16`.
  </Accordion>
  <Accordion title="Together">
    Tylko pojedyncze odwołanie do obrazu.
  </Accordion>
  <Accordion title="Vydra">
    Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań
    porzucających uwierzytelnianie. `veo3` jest dołączony wyłącznie jako
    konwersja tekstu na wideo; `kling` wymaga zdalnego adresu URL obrazu.
  </Accordion>
  <Accordion title="xAI">
    Obsługuje konwersję tekstu na wideo, konwersję pojedynczego obrazu pierwszej
    klatki na wideo, do 7 wejść `reference_image` przez xAI `reference_images`
    oraz zdalne przepływy edycji/rozszerzania wideo.
  </Accordion>
</AccordionGroup>

## Tryby możliwości dostawcy

Wspólny kontrakt generowania wideo obsługuje możliwości specyficzne dla trybu
zamiast tylko płaskich limitów zbiorczych. Nowe implementacje dostawców powinny
preferować jawne bloki trybów:

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
wystarczają do deklarowania obsługi trybu transformacji. Dostawcy powinni jawnie
deklarować `generate`, `imageToVideo` i `videoToVideo`, aby testy live, testy
kontraktu i wspólne narzędzie `video_generate` mogły deterministycznie
weryfikować obsługę trybów.

Gdy jeden model u dostawcy ma szerszą obsługę wejść referencyjnych niż pozostałe,
użyj `maxInputImagesByModel`, `maxInputVideosByModel` albo
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

Ten plik live ładuje brakujące zmienne środowiskowe dostawców z `~/.profile`,
domyślnie preferuje klucze API live/env przed zapisanymi profilami
uwierzytelniania i domyślnie uruchamia bezpieczny dla wydania smoke test:

- `generate` dla każdego dostawcy spoza FAL w przebiegu.
- Jednosekundowy prompt z homarem.
- Limit operacji dla każdego dostawcy z
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`).

FAL jest opcjonalny, ponieważ opóźnienie kolejki po stronie dostawcy może
dominować czas wydania:

```bash
pnpm test:live:media video --video-providers fal
```

Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także
zadeklarowane tryby transformacji, które wspólny przebieg może bezpiecznie
wykonać z mediami lokalnymi:

- `imageToVideo`, gdy `capabilities.imageToVideo.enabled`.
- `videoToVideo`, gdy `capabilities.videoToVideo.enabled` i dostawca/model
  akceptuje wejściowe lokalne wideo oparte na buforze we wspólnym przebiegu.

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
- [Odwołanie konfiguracji](/pl/gateway/config-agents#agent-defaults)
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
