---
read_when:
    - Generowanie wideo przez agenta
    - Konfigurowanie dostawców i modeli generowania wideo
    - Zrozumienie parametrów narzędzia `video_generate`
summary: Generowanie wideo z tekstu, obrazów lub istniejących filmów przy użyciu 14 backendów dostawców
title: Generowanie wideo
x-i18n:
    generated_at: "2026-04-24T09:38:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ddefd4fcde2b22be6631c160ed6e128a97b0800d32c65fb5fe36227ce4f368
    source_path: tools/video-generation.md
    workflow: 15
---

Agenci OpenClaw mogą generować filmy z promptów tekstowych, obrazów referencyjnych lub istniejących filmów. Obsługiwanych jest czternaście backendów dostawców, z których każdy ma inne opcje modeli, tryby wejściowe i zestawy funkcji. Agent automatycznie wybiera właściwego dostawcę na podstawie Twojej konfiguracji i dostępnych kluczy API.

<Note>
Narzędzie `video_generate` pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania wideo. Jeśli nie widzisz go w narzędziach swojego agenta, ustaw klucz API dostawcy lub skonfiguruj `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traktuje generowanie wideo jako trzy tryby środowiska uruchomieniowego:

- `generate` dla żądań tekst-na-wideo bez mediów referencyjnych
- `imageToVideo`, gdy żądanie zawiera co najmniej jeden obraz referencyjny
- `videoToVideo`, gdy żądanie zawiera co najmniej jeden film referencyjny

Dostawcy mogą obsługiwać dowolny podzbiór tych trybów. Narzędzie waliduje aktywny
tryb przed wysłaniem i raportuje obsługiwane tryby w `action=list`.

## Szybki start

1. Ustaw klucz API dla dowolnego obsługiwanego dostawcy:

```bash
export GEMINI_API_KEY="your-key"
```

2. Opcjonalnie przypnij model domyślny:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Poproś agenta:

> Wygeneruj 5-sekundowe filmowe wideo z przyjaznym homarem surfującym o zachodzie słońca.

Agent automatycznie wywoła `video_generate`. Nie jest potrzebna allowlista narzędzi.

## Co się dzieje podczas generowania wideo

Generowanie wideo jest asynchroniczne. Gdy agent wywołuje `video_generate` w sesji:

1. OpenClaw wysyła żądanie do dostawcy i natychmiast zwraca identyfikator zadania.
2. Dostawca przetwarza zadanie w tle (zwykle od 30 sekund do 5 minut, w zależności od dostawcy i rozdzielczości).
3. Gdy wideo jest gotowe, OpenClaw wybudza tę samą sesję wewnętrznym zdarzeniem ukończenia.
4. Agent publikuje gotowe wideo z powrotem w oryginalnej rozmowie.

Gdy zadanie jest w toku, zduplikowane wywołania `video_generate` w tej samej sesji zwracają bieżący status zadania zamiast uruchamiać nowe generowanie. Użyj `openclaw tasks list` lub `openclaw tasks show <taskId>`, aby sprawdzić postęp z CLI.

Poza uruchomieniami agentów opartymi na sesji (na przykład przy bezpośrednich wywołaniach narzędzia) narzędzie awaryjnie przechodzi do generowania inline i zwraca końcową ścieżkę mediów w tej samej turze.

### Cykl życia zadania

Każde żądanie `video_generate` przechodzi przez cztery stany:

1. **queued** -- zadanie utworzone, oczekuje na zaakceptowanie przez dostawcę.
2. **running** -- dostawca przetwarza (zwykle od 30 sekund do 5 minut, w zależności od dostawcy i rozdzielczości).
3. **succeeded** -- wideo gotowe; agent budzi się i publikuje je w rozmowie.
4. **failed** -- błąd dostawcy lub timeout; agent budzi się ze szczegółami błędu.

Sprawdź status z CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Zapobieganie duplikatom: jeśli zadanie wideo dla bieżącej sesji ma już stan `queued` lub `running`, `video_generate` zwraca status istniejącego zadania zamiast uruchamiać nowe. Użyj `action: "status"`, aby sprawdzić to jawnie bez wyzwalania nowego generowania.

## Obsługiwani dostawcy

| Dostawca              | Model domyślny                   | Tekst | Obraz ref                                            | Wideo ref        | Klucz API                                  |
| --------------------- | ------------------------------- | ---- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Tak  | Tak (zdalny URL)                                     | Tak (zdalny URL) | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Tak  | Maksymalnie 2 obrazy (tylko modele I2V; pierwsza + ostatnia klatka) | Nie               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Tak  | Maksymalnie 2 obrazy (pierwsza + ostatnia klatka przez rolę)         | Nie               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Tak  | Maksymalnie 9 obrazów referencyjnych                             | Maksymalnie 3 filmy   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Tak  | 1 obraz                                              | Nie               | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Tak  | 1 obraz                                              | Nie               | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Tak  | 1 obraz                                              | 1 film          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Tak  | 1 obraz                                              | Nie               | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Tak  | 1 obraz                                              | 1 film          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Tak  | Tak (zdalny URL)                                     | Tak (zdalny URL) | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Tak  | 1 obraz                                              | 1 film          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Tak  | 1 obraz                                              | Nie               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Tak  | 1 obraz (`kling`)                                    | Nie               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Tak  | 1 obraz                                              | 1 film          | `XAI_API_KEY`                            |

Niektórzy dostawcy akceptują dodatkowe lub alternatywne zmienne środowiskowe kluczy API. Szczegóły znajdziesz na poszczególnych [stronach dostawców](#related).

Uruchom `video_generate action=list`, aby sprawdzić dostępnych dostawców, modele i
tryby środowiska uruchomieniowego w czasie działania.

### Zadeklarowana macierz możliwości

To jawny kontrakt trybów używany przez `video_generate`, testy kontraktowe
i współdzielony live sweep.

| Dostawca | `generate` | `imageToVideo` | `videoToVideo` | Dzisiejsze współdzielone lane’y live                                                                                                                  |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych URL-i wideo `http(s)`                               |
| BytePlus | Tak        | Tak            | Nie             | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Tak        | Tak            | Nie             | Nie wchodzi do współdzielonego sweepa; pokrycie specyficzne dla workflow znajduje się przy testach Comfy                                                               |
| fal      | Tak        | Tak            | Nie             | `generate`, `imageToVideo`                                                                                                               |
| Google   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; współdzielone `videoToVideo` pomijane, ponieważ bieżący sweep Gemini/Veo oparty na buforach nie akceptuje tego wejścia  |
| MiniMax  | Tak        | Tak            | Nie             | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; współdzielone `videoToVideo` pomijane, ponieważ ta ścieżka organizacji/wejścia obecnie wymaga dostępu do inpaint/remix po stronie dostawcy |
| Qwen     | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych URL-i wideo `http(s)`                               |
| Runway   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` działa tylko wtedy, gdy wybrany model to `runway/gen4_aleph`                                      |
| Together | Tak        | Tak            | Nie             | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Tak        | Tak            | Nie             | `generate`; współdzielone `imageToVideo` pomijane, ponieważ dołączony `veo3` jest tylko tekstowy, a dołączony `kling` wymaga zdalnego URL obrazu            |
| xAI      | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca obecnie wymaga zdalnego URL MP4                                |

## Parametry narzędzia

### Wymagane

| Parametr | Typ   | Opis                                                                   |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt`  | string | Tekstowy opis wideo do wygenerowania (wymagany dla `action: "generate"`) |

### Wejścia treści

| Parametr    | Typ     | Opis                                                                                                                            |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | Pojedynczy obraz referencyjny (ścieżka lub URL)                                                                                                   |
| `images`     | string[] | Wiele obrazów referencyjnych (maksymalnie 9)                                                                                                    |
| `imageRoles` | string[] | Opcjonalne wskazówki ról dla poszczególnych pozycji, równoległe do połączonej listy obrazów. Wartości kanoniczne: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | Pojedynczy film referencyjny (ścieżka lub URL)                                                                                                   |
| `videos`     | string[] | Wiele filmów referencyjnych (maksymalnie 4)                                                                                                    |
| `videoRoles` | string[] | Opcjonalne wskazówki ról dla poszczególnych pozycji, równoległe do połączonej listy filmów. Wartość kanoniczna: `reference_video`                               |
| `audioRef`   | string   | Pojedyncze audio referencyjne (ścieżka lub URL). Używane np. jako muzyka w tle lub referencja głosu, gdy dostawca obsługuje wejścia audio        |
| `audioRefs`  | string[] | Wiele nagrań audio referencyjnych (maksymalnie 3)                                                                                                    |
| `audioRoles` | string[] | Opcjonalne wskazówki ról dla poszczególnych pozycji, równoległe do połączonej listy audio. Wartość kanoniczna: `reference_audio`                               |

Wskazówki ról są przekazywane do dostawcy bez zmian. Wartości kanoniczne pochodzą z
sumy `VideoGenerationAssetRole`, ale dostawcy mogą akceptować dodatkowe
ciągi ról. Tablice `*Roles` nie mogą mieć więcej wpisów niż
odpowiadająca im lista referencyjna; błędy off-by-one kończą się jasnym błędem.
Użyj pustego ciągu, aby pozostawić slot nieustawiony.

### Kontrolki stylu

| Parametr         | Typ    | Opis                                                                             |
| ----------------- | ------- | --------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` lub `adaptive`  |
| `resolution`      | string  | `480P`, `720P`, `768P` lub `1080P`                                                      |
| `durationSeconds` | number  | Docelowy czas trwania w sekundach (zaokrąglany do najbliższej wartości obsługiwanej przez dostawcę)                |
| `size`            | string  | Wskazówka rozmiaru, gdy dostawca ją obsługuje                                                 |
| `audio`           | boolean | Włącza wygenerowane audio w danych wyjściowych, jeśli jest obsługiwane. Odrębne od `audioRef*` (wejścia) |
| `watermark`       | boolean | Przełącza znak wodny dostawcy, jeśli jest obsługiwany                                             |

`adaptive` to znacznik specjalny zależny od dostawcy: jest przekazywany bez zmian do
dostawców, którzy deklarują `adaptive` w swoich możliwościach (np. BytePlus
Seedance używa go do automatycznego wykrywania proporcji na podstawie wymiarów
obrazu wejściowego). Dostawcy, którzy go nie deklarują, ujawniają tę wartość przez
`details.ignoredOverrides` w wyniku narzędzia, aby pominięcie było widoczne.

### Zaawansowane

| Parametr         | Typ   | Opis                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (domyślnie), `"status"` lub `"list"`                                                                                                                                                                                                                                                                                                      |
| `model`           | string | Nadpisanie dostawcy/modelu (np. `runway/gen4.5`)                                                                                                                                                                                                                                                                                                       |
| `filename`        | string | Wskazówka nazwy pliku wyjściowego                                                                                                                                                                                                                                                                                                                                 |
| `timeoutMs`       | number | Opcjonalny limit czasu żądania do dostawcy w milisekundach                                                                                                                                                                                                                                                                                                    |
| `providerOptions` | object | Opcje specyficzne dla dostawcy jako obiekt JSON (np. `{"seed": 42, "draft": true}`). Dostawcy, którzy deklarują typowany schemat, walidują klucze i typy; nieznane klucze lub niedopasowania powodują pominięcie kandydata podczas failoveru. Dostawcy bez zadeklarowanego schematu otrzymują opcje bez zmian. Uruchom `video_generate action=list`, aby zobaczyć, co akceptuje każdy dostawca |

Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw już normalizuje czas trwania do najbliższej wartości obsługiwanej przez dostawcę, a także przemapowuje przetłumaczone wskazówki geometrii, takie jak rozmiar-na-proporcje, gdy dostawca awaryjny udostępnia inną powierzchnię sterowania. Rzeczywiście nieobsługiwane nadpisania są ignorowane na zasadzie best-effort i zgłaszane jako ostrzeżenia w wyniku narzędzia. Twarde limity możliwości (takie jak zbyt wiele wejść referencyjnych) kończą się błędem przed wysłaniem.

Wyniki narzędzia raportują zastosowane ustawienia. Gdy OpenClaw przemapowuje czas trwania lub geometrię podczas failoveru dostawcy, zwracane wartości `durationSeconds`, `size`, `aspectRatio` i `resolution` odzwierciedlają to, co zostało wysłane, a `details.normalization` zapisuje przekształcenie od wartości żądanej do zastosowanej.

Wejścia referencyjne także wybierają tryb środowiska uruchomieniowego:

- Brak mediów referencyjnych: `generate`
- Dowolny obraz referencyjny: `imageToVideo`
- Dowolny film referencyjny: `videoToVideo`
- Referencyjne wejścia audio nie zmieniają rozstrzygniętego trybu; są stosowane na wierzch trybu wybranego przez referencje obrazów/filmów i działają tylko z dostawcami, którzy deklarują `maxInputAudios`

Mieszane referencje obrazów i filmów nie stanowią stabilnej współdzielonej powierzchni możliwości.
Preferuj jeden typ referencji na żądanie.

#### Failover i typowane opcje

Niektóre kontrole możliwości są stosowane na warstwie failoveru zamiast na granicy
narzędzia, tak aby żądanie przekraczające limity głównego dostawcy
mogło nadal działać na zdolnym dostawcy awaryjnym:

- Jeśli aktywny kandydat nie deklaruje `maxInputAudios` (albo deklaruje je jako
  `0`), jest pomijany, gdy żądanie zawiera referencje audio, i próbowany jest
  następny kandydat.
- Jeśli `maxDurationSeconds` aktywnego kandydata jest niższe niż żądane
  `durationSeconds`, a kandydat nie deklaruje listy
  `supportedDurationSeconds`, jest pomijany.
- Jeśli żądanie zawiera `providerOptions`, a aktywny kandydat
  jawnie deklaruje typowany schemat `providerOptions`, kandydat jest
  pomijany, gdy dostarczone klucze nie należą do schematu lub typy wartości się
  nie zgadzają. Dostawcy, którzy nie zadeklarowali jeszcze schematu, otrzymują
  opcje bez zmian (przepuszczenie zgodne wstecznie). Dostawca może
  jawnie zrezygnować ze wszystkich opcji dostawcy, deklarując pusty schemat
  (`capabilities.providerOptions: {}`), co powoduje takie samo pominięcie jak przy
  niedopasowaniu typu.

Pierwszy powód pominięcia w żądaniu jest logowany na poziomie `warn`, aby operatorzy widzieli,
kiedy główny dostawca został pominięty; kolejne pominięcia są logowane na poziomie
`debug`, aby długie łańcuchy failoveru pozostały ciche. Jeśli każdy kandydat zostanie pominięty,
zagregowany błąd zawiera powód pominięcia dla każdego z nich.

## Akcje

- **generate** (domyślnie) -- utwórz wideo z podanego promptu i opcjonalnych wejść referencyjnych.
- **status** -- sprawdź stan zadania wideo będącego w toku dla bieżącej sesji bez uruchamiania kolejnego generowania.
- **list** -- pokaż dostępnych dostawców, modele i ich możliwości.

## Wybór modelu

Podczas generowania wideo OpenClaw rozwiązuje model w tej kolejności:

1. **Parametr narzędzia `model`** -- jeśli agent poda go w wywołaniu.
2. **`videoGenerationModel.primary`** -- z konfiguracji.
3. **`videoGenerationModel.fallbacks`** -- próbowane po kolei.
4. **Automatyczne wykrywanie** -- używa dostawców z prawidłowym uwierzytelnieniem, zaczynając od bieżącego domyślnego dostawcy, a potem pozostałych dostawców w kolejności alfabetycznej.

Jeśli dostawca zawiedzie, automatycznie próbowany jest następny kandydat. Jeśli wszyscy kandydaci zawiodą, błąd zawiera szczegóły każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, jeśli chcesz,
aby generowanie wideo używało tylko jawnych wpisów `model`, `primary` i `fallbacks`.

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
    Używa asynchronicznego endpointu DashScope / Model Studio. Obrazy i filmy referencyjne muszą być zdalnymi URL-ami `http(s)`.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    Identyfikator dostawcy: `byteplus`.

    Modele: `seedance-1-0-pro-250528` (domyślny), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Modele T2V (`*-t2v-*`) nie akceptują wejść obrazów; modele I2V i ogólne modele `*-pro-*` obsługują pojedynczy obraz referencyjny (pierwsza klatka). Przekaż obraz pozycyjnie lub ustaw `role: "first_frame"`. Identyfikatory modeli T2V są automatycznie przełączane na odpowiadający wariant I2V, gdy podany jest obraz.

    Obsługiwane klucze `providerOptions`: `seed` (number), `draft` (boolean — wymusza 480p), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    Wymaga Pluginu [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Identyfikator dostawcy: `byteplus-seedance15`. Model: `seedance-1-5-pro-251215`.

    Używa zunifikowanego API `content[]`. Obsługuje maksymalnie 2 obrazy wejściowe (`first_frame` + `last_frame`). Wszystkie wejścia muszą być zdalnymi URL-ami `https://`. Ustaw `role: "first_frame"` / `"last_frame"` dla każdego obrazu albo przekaż obrazy pozycyjnie.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego. `audio: true` mapuje się na `generate_audio`. Przekazywane jest `providerOptions.seed` (number).

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    Wymaga Pluginu [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Identyfikator dostawcy: `byteplus-seedance2`. Modele: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Używa zunifikowanego API `content[]`. Obsługuje maksymalnie 9 obrazów referencyjnych, 3 filmy referencyjne i 3 nagrania audio referencyjne. Wszystkie wejścia muszą być zdalnymi URL-ami `https://`. Ustaw `role` dla każdego zasobu — obsługiwane wartości: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego. `audio: true` mapuje się na `generate_audio`. Przekazywane jest `providerOptions.seed` (number).

  </Accordion>

  <Accordion title="ComfyUI">
    Lokalne lub chmurowe wykonanie sterowane workflow. Obsługuje tekst-na-wideo i obraz-na-wideo przez skonfigurowany graf.
  </Accordion>

  <Accordion title="fal">
    Używa przepływu opartego na kolejce dla długo działających zadań. Tylko pojedynczy obraz referencyjny.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Obsługuje jeden obraz lub jeden film referencyjny.
  </Accordion>

  <Accordion title="MiniMax">
    Tylko pojedynczy obraz referencyjny.
  </Accordion>

  <Accordion title="OpenAI">
    Przekazywane jest tylko nadpisanie `size`. Inne nadpisania stylu (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z ostrzeżeniem.
  </Accordion>

  <Accordion title="Qwen">
    Ten sam backend DashScope co Alibaba. Wejścia referencyjne muszą być zdalnymi URL-ami `http(s)`; pliki lokalne są odrzucane z góry.
  </Accordion>

  <Accordion title="Runway">
    Obsługuje pliki lokalne przez URI danych. `videoToVideo` wymaga `runway/gen4_aleph`. Uruchomienia tylko tekstowe udostępniają proporcje `16:9` i `9:16`.
  </Accordion>

  <Accordion title="Together">
    Tylko pojedynczy obraz referencyjny.
  </Accordion>

  <Accordion title="Vydra">
    Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań usuwających uwierzytelnienie. `veo3` jest dołączony tylko jako tekst-na-wideo; `kling` wymaga zdalnego URL-a obrazu.
  </Accordion>

  <Accordion title="xAI">
    Obsługuje tekst-na-wideo, obraz-na-wideo oraz zdalne przepływy edycji/rozszerzania wideo.
  </Accordion>
</AccordionGroup>

## Tryby możliwości dostawców

Współdzielony kontrakt generowania wideo pozwala teraz dostawcom deklarować możliwości
specyficzne dla trybu zamiast wyłącznie płaskich zagregowanych limitów. Nowe implementacje dostawców
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

Płaskie pola zagregowane, takie jak `maxInputImages` i `maxInputVideos`, nie
wystarczają do ogłoszenia obsługi trybów transformacji. Dostawcy powinni jawnie deklarować
`generate`, `imageToVideo` i `videoToVideo`, aby testy live,
testy kontraktowe i współdzielone narzędzie `video_generate` mogły walidować obsługę trybów
w sposób deterministyczny.

## Testy live

Pokrycie live typu opt-in dla współdzielonych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media video
```

Ten plik live ładuje brakujące zmienne środowiskowe dostawców z `~/.profile`, domyślnie preferuje
klucze API live/env przed zapisanymi profilami uwierzytelniania i domyślnie uruchamia
smoke bezpieczny dla wydania:

- `generate` dla każdego dostawcy innego niż FAL we sweepie
- jednosekundowy prompt z homarem
- limit operacji dla dostawcy z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` domyślnie)

FAL jest typu opt-in, ponieważ opóźnienie kolejki po stronie dostawcy może dominować czas wydania:

```bash
pnpm test:live:media video --video-providers fal
```

Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchamiać także zadeklarowane tryby transformacji,
które współdzielony sweep może bezpiecznie wykonać z lokalnymi mediami:

- `imageToVideo`, gdy `capabilities.imageToVideo.enabled`
- `videoToVideo`, gdy `capabilities.videoToVideo.enabled` i dostawca/model
  akceptuje wejście lokalnego wideo oparte na buforach we współdzielonym sweepie

Obecnie współdzielony lane live `videoToVideo` obejmuje:

- `runway` tylko wtedy, gdy wybierzesz `runway/gen4_aleph`

## Konfiguracja

Ustaw domyślny model generowania wideo w swojej konfiguracji OpenClaw:

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

- [Przegląd narzędzi](/pl/tools)
- [Zadania w tle](/pl/automation/tasks) -- śledzenie zadań dla asynchronicznego generowania wideo
- [Alibaba Model Studio](/pl/providers/alibaba)
- [BytePlus](/pl/concepts/model-providers#byteplus-international)
- [ComfyUI](/pl/providers/comfy)
- [fal](/pl/providers/fal)
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [OpenAI](/pl/providers/openai)
- [Qwen](/pl/providers/qwen)
- [Runway](/pl/providers/runway)
- [Together AI](/pl/providers/together)
- [Vydra](/pl/providers/vydra)
- [xAI](/pl/providers/xai)
- [Informacje o konfiguracji](/pl/gateway/config-agents#agent-defaults)
- [Modele](/pl/concepts/models)
