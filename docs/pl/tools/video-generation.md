---
read_when:
    - Generowanie wideo przez agenta
    - Konfigurowanie dostawców i modeli generowania wideo
    - Chcesz zrozumieć parametry narzędzia video_generate
summary: Generuj wideo z tekstu, obrazów lub istniejących filmów przy użyciu 12 backendów dostawców
title: Generowanie wideo
x-i18n:
    generated_at: "2026-04-07T09:51:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf1224c59a5f1217f56cf2001870aca710a09268677dcd12aad2efbe476e47b7
    source_path: tools/video-generation.md
    workflow: 15
---

# Generowanie wideo

Agenci OpenClaw mogą generować wideo z promptów tekstowych, obrazów referencyjnych lub istniejących filmów. Obsługiwanych jest dwanaście backendów dostawców, z których każdy oferuje inne opcje modeli, tryby wejścia i zestawy funkcji. Agent automatycznie wybiera odpowiedniego dostawcę na podstawie Twojej konfiguracji i dostępnych kluczy API.

<Note>
Narzędzie `video_generate` pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania wideo. Jeśli nie widzisz go w narzędziach agenta, ustaw klucz API dostawcy lub skonfiguruj `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traktuje generowanie wideo jako trzy tryby runtime:

- `generate` dla żądań text-to-video bez mediów referencyjnych
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

> Wygeneruj 5-sekundowe kinowe wideo przyjaznego homara surfującego o zachodzie słońca.

Agent automatycznie wywoła `video_generate`. Nie jest potrzebna żadna allowlista narzędzi.

## Co dzieje się podczas generowania wideo

Generowanie wideo jest asynchroniczne. Gdy agent wywoła `video_generate` w sesji:

1. OpenClaw wysyła żądanie do dostawcy i natychmiast zwraca identyfikator zadania.
2. Dostawca przetwarza zadanie w tle (zwykle od 30 sekund do 5 minut, zależnie od dostawcy i rozdzielczości).
3. Gdy wideo jest gotowe, OpenClaw wybudza tę samą sesję wewnętrznym zdarzeniem ukończenia.
4. Agent publikuje gotowe wideo z powrotem w oryginalnej konwersacji.

Gdy zadanie jest w toku, duplikaty wywołań `video_generate` w tej samej sesji zwracają bieżący status zadania zamiast rozpoczynać kolejne generowanie. Użyj `openclaw tasks list` lub `openclaw tasks show <taskId>`, aby sprawdzić postęp z CLI.

Poza uruchomieniami agentów opartymi na sesjach (na przykład bezpośrednimi wywołaniami narzędzia) narzędzie przechodzi do generowania inline i zwraca końcową ścieżkę mediów w tej samej turze.

### Cykl życia zadania

Każde żądanie `video_generate` przechodzi przez cztery stany:

1. **queued** -- zadanie utworzone, oczekuje na akceptację przez dostawcę.
2. **running** -- dostawca przetwarza (zwykle od 30 sekund do 5 minut, zależnie od dostawcy i rozdzielczości).
3. **succeeded** -- wideo gotowe; agent budzi się i publikuje je w konwersacji.
4. **failed** -- błąd dostawcy lub timeout; agent budzi się ze szczegółami błędu.

Sprawdź status z CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Zapobieganie duplikatom: jeśli dla bieżącej sesji zadanie wideo ma już status `queued` lub `running`, `video_generate` zwraca status istniejącego zadania zamiast uruchamiać nowe. Użyj `action: "status"`, aby sprawdzić to jawnie bez wyzwalania nowego generowania.

## Obsługiwani dostawcy

| Dostawca | Model domyślny                  | Tekst | Referencja obrazu | Referencja wideo | Klucz API                                 |
| -------- | ------------------------------- | ----- | ----------------- | ---------------- | ----------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | Tak   | Tak (zdalny URL)  | Tak (zdalny URL) | `MODELSTUDIO_API_KEY`                     |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | Tak   | 1 obraz           | Nie              | `BYTEPLUS_API_KEY`                        |
| ComfyUI  | `workflow`                      | Tak   | 1 obraz           | Nie              | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | Tak   | 1 obraz           | Nie              | `FAL_KEY`                                 |
| Google   | `veo-3.1-fast-generate-preview` | Tak   | 1 obraz           | 1 wideo          | `GEMINI_API_KEY`                          |
| MiniMax  | `MiniMax-Hailuo-2.3`            | Tak   | 1 obraz           | Nie              | `MINIMAX_API_KEY`                         |
| OpenAI   | `sora-2`                        | Tak   | 1 obraz           | 1 wideo          | `OPENAI_API_KEY`                          |
| Qwen     | `wan2.6-t2v`                    | Tak   | Tak (zdalny URL)  | Tak (zdalny URL) | `QWEN_API_KEY`                            |
| Runway   | `gen4.5`                        | Tak   | 1 obraz           | 1 wideo          | `RUNWAYML_API_SECRET`                     |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | Tak   | 1 obraz           | Nie              | `TOGETHER_API_KEY`                        |
| Vydra    | `veo3`                          | Tak   | 1 obraz (`kling`) | Nie              | `VYDRA_API_KEY`                           |
| xAI      | `grok-imagine-video`            | Tak   | 1 obraz           | 1 wideo          | `XAI_API_KEY`                             |

Niektórzy dostawcy akceptują dodatkowe lub alternatywne zmienne env dla kluczy API. Szczegóły znajdziesz na poszczególnych [stronach dostawców](#related).

Uruchom `video_generate action=list`, aby w runtime sprawdzić dostępnych dostawców, modele i
tryby runtime.

### Zadeklarowana macierz możliwości

To jawny kontrakt trybów używany przez `video_generate`, testy kontraktowe
i współdzielony przebieg live.

| Dostawca | `generate` | `imageToVideo` | `videoToVideo` | Dzisiejsze współdzielone lane live                                                                                                     |
| -------- | ---------- | -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych URL wideo `http(s)`                        |
| BytePlus | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI  | Tak        | Tak            | Nie            | Nie wchodzi do współdzielonego sweepu; pokrycie specyficzne dla workflow znajduje się przy testach Comfy                              |
| fal      | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                              |
| Google   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; współdzielone `videoToVideo` pomijane, ponieważ obecny sweep Gemini/Veo oparty na buforach nie akceptuje tego wejścia |
| MiniMax  | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                              |
| OpenAI   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; współdzielone `videoToVideo` pomijane, ponieważ ta ścieżka org/wejścia obecnie wymaga dostępu do inpaint/remix po stronie dostawcy |
| Qwen     | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych URL wideo `http(s)`                        |
| Runway   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` działa tylko wtedy, gdy wybrany model to `runway/gen4_aleph`                               |
| Together | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                              |
| Vydra    | Tak        | Tak            | Nie            | `generate`; współdzielone `imageToVideo` pomijane, ponieważ dołączone `veo3` jest tylko tekstowe, a dołączone `kling` wymaga zdalnego URL obrazu |
| xAI      | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca obecnie wymaga zdalnego URL MP4                            |

## Parametry narzędzia

### Wymagane

| Parametr | Typ    | Opis                                                                     |
| -------- | ------ | ------------------------------------------------------------------------ |
| `prompt` | string | Tekstowy opis wideo do wygenerowania (wymagany dla `action: "generate"`) |

### Wejścia treści

| Parametr | Typ      | Opis                                 |
| -------- | -------- | ------------------------------------ |
| `image`  | string   | Pojedynczy obraz referencyjny (ścieżka lub URL) |
| `images` | string[] | Wiele obrazów referencyjnych (do 5)  |
| `video`  | string   | Pojedyncze wideo referencyjne (ścieżka lub URL) |
| `videos` | string[] | Wiele filmów referencyjnych (do 4)   |

### Kontrolki stylu

| Parametr          | Typ     | Opis                                                                     |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`      | string  | `480P`, `720P`, `768P` lub `1080P`                                       |
| `durationSeconds` | number  | Docelowy czas trwania w sekundach (zaokrąglany do najbliższej wartości obsługiwanej przez dostawcę) |
| `size`            | string  | Wskazówka rozmiaru, jeśli dostawca ją obsługuje                          |
| `audio`           | boolean | Włącza generowane audio, jeśli jest obsługiwane                          |
| `watermark`       | boolean | Przełącza znak wodny dostawcy, jeśli jest obsługiwany                    |

### Zaawansowane

| Parametr   | Typ    | Opis                                                  |
| ---------- | ------ | ----------------------------------------------------- |
| `action`   | string | `"generate"` (domyślnie), `"status"` lub `"list"`     |
| `model`    | string | Nadpisanie dostawcy/modelu (np. `runway/gen4.5`)      |
| `filename` | string | Wskazówka nazwy pliku wyjściowego                     |

Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw już normalizuje czas trwania do najbliższej wartości obsługiwanej przez dostawcę, a także przemapowuje przetłumaczone wskazówki geometrii, takie jak size-to-aspect-ratio, gdy zapasowy dostawca udostępnia inną powierzchnię sterowania. Naprawdę nieobsługiwane nadpisania są ignorowane na zasadzie best-effort i zgłaszane jako ostrzeżenia w wyniku narzędzia. Twarde limity możliwości (takie jak zbyt wiele wejść referencyjnych) kończą się błędem przed wysłaniem.

Wyniki narzędzia raportują zastosowane ustawienia. Gdy OpenClaw przemapowuje czas trwania lub geometrię podczas fallbacku dostawcy, zwracane wartości `durationSeconds`, `size`, `aspectRatio` i `resolution` odzwierciedlają to, co zostało wysłane, a `details.normalization` zawiera translację z żądania na zastosowaną wartość.

Wejścia referencyjne wybierają też tryb runtime:

- Brak mediów referencyjnych: `generate`
- Dowolna referencja obrazu: `imageToVideo`
- Dowolna referencja wideo: `videoToVideo`

Mieszane referencje obrazów i wideo nie stanowią stabilnej współdzielonej powierzchni możliwości.
Preferuj jeden typ referencji na żądanie.

## Akcje

- **generate** (domyślnie) -- utwórz wideo na podstawie podanego promptu i opcjonalnych wejść referencyjnych.
- **status** -- sprawdź stan zadania wideo będącego w toku dla bieżącej sesji bez uruchamiania kolejnego generowania.
- **list** -- pokaż dostępnych dostawców, modele i ich możliwości.

## Wybór modelu

Podczas generowania wideo OpenClaw rozwiązuje model w tej kolejności:

1. **Parametr narzędzia `model`** -- jeśli agent poda go w wywołaniu.
2. **`videoGenerationModel.primary`** -- z konfiguracji.
3. **`videoGenerationModel.fallbacks`** -- próbowane po kolei.
4. **Auto-detection** -- używa dostawców z prawidłowym uwierzytelnieniem, zaczynając od bieżącego domyślnego dostawcy, a następnie pozostałych dostawców w kolejności alfabetycznej.

Jeśli dostawca zawiedzie, następny kandydat jest próbowany automatycznie. Jeśli zawiodą wszyscy kandydaci, błąd zawiera szczegóły każdej próby.

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

| Dostawca | Uwagi                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Używa asynchronicznego endpointu DashScope/Model Studio. Obrazy i filmy referencyjne muszą być zdalnymi URL `http(s)`.                                  |
| BytePlus | Obsługuje tylko pojedynczy obraz referencyjny.                                                                                                            |
| ComfyUI  | Lokalna lub chmurowa egzekucja oparta na workflow. Obsługuje text-to-video i image-to-video przez skonfigurowany graf.                                  |
| fal      | Używa przepływu opartego na kolejce dla długotrwałych zadań. Tylko pojedynczy obraz referencyjny.                                                        |
| Google   | Używa Gemini/Veo. Obsługuje jeden obraz lub jedno wideo referencyjne.                                                                                     |
| MiniMax  | Obsługuje tylko pojedynczy obraz referencyjny.                                                                                                            |
| OpenAI   | Przekazywane jest tylko nadpisanie `size`. Inne nadpisania stylu (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z ostrzeżeniem.      |
| Qwen     | Ten sam backend DashScope co Alibaba. Wejścia referencyjne muszą być zdalnymi URL `http(s)`; lokalne pliki są odrzucane z góry.                         |
| Runway   | Obsługuje pliki lokalne przez data URI. Video-to-video wymaga `runway/gen4_aleph`. Przebiegi tylko tekstowe udostępniają proporcje `16:9` i `9:16`.     |
| Together | Obsługuje tylko pojedynczy obraz referencyjny.                                                                                                            |
| Vydra    | Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań usuwających auth. `veo3` jest dołączony jako tylko text-to-video; `kling` wymaga zdalnego URL obrazu. |
| xAI      | Obsługuje text-to-video, image-to-video oraz zdalne przepływy edycji/rozszerzania wideo.                                                                 |

## Tryby możliwości dostawców

Wspólny kontrakt generowania wideo pozwala teraz dostawcom deklarować możliwości
specyficzne dla trybu zamiast tylko płaskich zagregowanych limitów. Nowe
implementacje dostawców powinny preferować jawne bloki trybów:

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
wystarczają do reklamowania obsługi trybów transformacji. Dostawcy powinni jawnie deklarować
`generate`, `imageToVideo` i `videoToVideo`, aby testy live,
testy kontraktowe i współdzielone narzędzie `video_generate` mogły deterministycznie walidować obsługę trybów.

## Testy live

Pokrycie live opt-in dla współdzielonych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media video
```

Ten plik live ładuje brakujące zmienne env dostawców z `~/.profile`, domyślnie preferuje
klucze API live/env przed zapisanymi profilami uwierzytelniania i uruchamia
zadeklarowane tryby, które może bezpiecznie przetestować z lokalnymi mediami:

- `generate` dla każdego dostawcy w sweepie
- `imageToVideo`, gdy `capabilities.imageToVideo.enabled`
- `videoToVideo`, gdy `capabilities.videoToVideo.enabled` oraz dostawca/model
  akceptuje lokalne wejście wideo oparte na buforze we współdzielonym sweepie

Obecnie współdzielony lane live `videoToVideo` obejmuje:

- tylko `runway`, gdy wybierzesz `runway/gen4_aleph`

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

- [Tools Overview](/pl/tools)
- [Background Tasks](/pl/automation/tasks) -- śledzenie zadań dla asynchronicznego generowania wideo
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
- [Configuration Reference](/pl/gateway/configuration-reference#agent-defaults)
- [Models](/pl/concepts/models)
