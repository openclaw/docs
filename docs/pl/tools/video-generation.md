---
read_when:
    - Generowanie filmów za pomocą agenta
    - Konfigurowanie dostawców i modeli do generowania filmów
    - Zrozumienie parametrów narzędzia video_generate
summary: Generuj filmy z tekstu, obrazów lub istniejących filmów przy użyciu 12 backendów dostawców
title: Generowanie filmów
x-i18n:
    generated_at: "2026-04-06T09:45:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90d8a392b35adbd899232b02c55c10895b9d7ffc9858d6ca448f2e4e4a57f12f
    source_path: tools/video-generation.md
    workflow: 15
---

# Generowanie filmów

Agenci OpenClaw mogą generować filmy na podstawie promptów tekstowych, obrazów referencyjnych lub istniejących filmów. Obsługiwanych jest dwanaście backendów dostawców, a każdy z nich oferuje inne opcje modeli, tryby wejściowe i zestawy funkcji. Agent automatycznie wybiera odpowiedniego dostawcę na podstawie konfiguracji i dostępnych kluczy API.

<Note>
Narzędzie `video_generate` pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania filmów. Jeśli go nie widzisz w narzędziach agenta, ustaw klucz API dostawcy lub skonfiguruj `agents.defaults.videoGenerationModel`.
</Note>

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

> Wygeneruj 5-sekundowy film kinowy przedstawiający przyjaznego homara surfującego o zachodzie słońca.

Agent automatycznie wywołuje `video_generate`. Nie jest wymagane dodawanie narzędzia do listy dozwolonych.

## Co dzieje się podczas generowania filmu

Generowanie filmu jest asynchroniczne. Gdy agent wywołuje `video_generate` w sesji:

1. OpenClaw wysyła żądanie do dostawcy i natychmiast zwraca identyfikator zadania.
2. Dostawca przetwarza zadanie w tle (zwykle od 30 sekund do 5 minut w zależności od dostawcy i rozdzielczości).
3. Gdy film jest gotowy, OpenClaw wybudza tę samą sesję za pomocą wewnętrznego zdarzenia ukończenia.
4. Agent publikuje gotowy film z powrotem w oryginalnej rozmowie.

Gdy zadanie jest w toku, zduplikowane wywołania `video_generate` w tej samej sesji zwracają bieżący status zadania zamiast uruchamiać kolejne generowanie. Użyj `openclaw tasks list` lub `openclaw tasks show <taskId>`, aby sprawdzić postęp z poziomu CLI.

Poza uruchomieniami agenta opartymi na sesji (na przykład przy bezpośrednich wywołaniach narzędzia) narzędzie przechodzi do generowania inline i zwraca końcową ścieżkę do multimediów w tej samej turze.

## Obsługiwani dostawcy

| Dostawca | Model domyślny                  | Tekst | Obraz referencyjny | Film referencyjny | Klucz API                                 |
| -------- | ------------------------------- | ----- | ------------------ | ----------------- | ----------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | Tak   | Tak (zdalny URL)   | Tak (zdalny URL)  | `MODELSTUDIO_API_KEY`                     |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | Tak   | 1 obraz            | Nie               | `BYTEPLUS_API_KEY`                        |
| ComfyUI  | `workflow`                      | Tak   | 1 obraz            | Nie               | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | Tak   | 1 obraz            | Nie               | `FAL_KEY`                                 |
| Google   | `veo-3.1-fast-generate-preview` | Tak   | 1 obraz            | 1 film            | `GEMINI_API_KEY`                          |
| MiniMax  | `MiniMax-Hailuo-2.3`            | Tak   | 1 obraz            | Nie               | `MINIMAX_API_KEY`                         |
| OpenAI   | `sora-2`                        | Tak   | 1 obraz            | 1 film            | `OPENAI_API_KEY`                          |
| Qwen     | `wan2.6-t2v`                    | Tak   | Tak (zdalny URL)   | Tak (zdalny URL)  | `QWEN_API_KEY`                            |
| Runway   | `gen4.5`                        | Tak   | 1 obraz            | 1 film            | `RUNWAYML_API_SECRET`                     |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | Tak   | 1 obraz            | Nie               | `TOGETHER_API_KEY`                        |
| Vydra    | `veo3`                          | Tak   | 1 obraz (`kling`)  | Nie               | `VYDRA_API_KEY`                           |
| xAI      | `grok-imagine-video`            | Tak   | 1 obraz            | 1 film            | `XAI_API_KEY`                             |

Niektórzy dostawcy akceptują dodatkowe lub alternatywne zmienne środowiskowe dla kluczy API. Szczegóły znajdziesz na poszczególnych [stronach dostawców](#related).

Uruchom `video_generate action=list`, aby sprawdzić dostępnych dostawców i modele w czasie działania.

## Parametry narzędzia

### Wymagane

| Parametr | Typ    | Opis                                                                          |
| -------- | ------ | ----------------------------------------------------------------------------- |
| `prompt` | string | Tekstowy opis filmu do wygenerowania (wymagany dla `action: "generate"`) |

### Wejścia treści

| Parametr | Typ      | Opis                                  |
| -------- | -------- | ------------------------------------- |
| `image`  | string   | Pojedynczy obraz referencyjny (ścieżka lub URL) |
| `images` | string[] | Wiele obrazów referencyjnych (maksymalnie 5) |
| `video`  | string   | Pojedynczy film referencyjny (ścieżka lub URL) |
| `videos` | string[] | Wiele filmów referencyjnych (maksymalnie 4) |

### Kontrola stylu

| Parametr         | Typ     | Opis                                                                     |
| ---------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`    | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`     | string  | `480P`, `720P` lub `1080P`                                               |
| `durationSeconds`| number  | Docelowy czas trwania w sekundach (zaokrąglany do najbliższej wartości obsługiwanej przez dostawcę) |
| `size`           | string  | Wskazówka rozmiaru, jeśli dostawca ją obsługuje                          |
| `audio`          | boolean | Włącz generowany dźwięk, jeśli jest obsługiwany                          |
| `watermark`      | boolean | Włącz lub wyłącz znak wodny dostawcy, jeśli jest obsługiwany             |

### Zaawansowane

| Parametr  | Typ    | Opis                                                |
| ---------- | ------ | --------------------------------------------------- |
| `action`   | string | `"generate"` (domyślnie), `"status"` lub `"list"` |
| `model`    | string | Nadpisanie dostawcy/modelu (np. `runway/gen4.5`)   |
| `filename` | string | Wskazówka dotycząca nazwy pliku                     |

Nie wszyscy dostawcy obsługują wszystkie parametry. Nieobsługiwane nadpisania są ignorowane w miarę możliwości i zgłaszane jako ostrzeżenia w wyniku narzędzia. Twarde ograniczenia możliwości (takie jak zbyt wiele wejść referencyjnych) powodują błąd przed wysłaniem.

## Akcje

- **generate** (domyślnie) -- utwórz film na podstawie podanego promptu i opcjonalnych wejść referencyjnych.
- **status** -- sprawdź stan zadania generowania filmu będącego w toku dla bieżącej sesji bez uruchamiania kolejnego generowania.
- **list** -- pokaż dostępnych dostawców, modele i ich możliwości.

## Wybór modelu

Podczas generowania filmu OpenClaw ustala model w następującej kolejności:

1. **Parametr narzędzia `model`** -- jeśli agent określi go w wywołaniu.
2. **`videoGenerationModel.primary`** -- z konfiguracji.
3. **`videoGenerationModel.fallbacks`** -- próbowane po kolei.
4. **Automatyczne wykrywanie** -- używa dostawców z prawidłową autoryzacją, zaczynając od bieżącego domyślnego dostawcy, a następnie pozostałych dostawców w kolejności alfabetycznej.

Jeśli jeden dostawca zawiedzie, następny kandydat jest próbowany automatycznie. Jeśli wszyscy kandydaci zawiodą, błąd zawiera szczegóły z każdej próby.

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

| Dostawca | Uwagi                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alibaba  | Używa asynchronicznego endpointu DashScope/Model Studio. Obrazy i filmy referencyjne muszą być zdalnymi adresami URL `http(s)`.                           |
| BytePlus | Tylko pojedynczy obraz referencyjny.                                                                                                                         |
| ComfyUI  | Lokalne lub chmurowe wykonywanie sterowane workflow. Obsługuje text-to-video i image-to-video przez skonfigurowany graf.                                   |
| fal      | Używa przepływu opartego na kolejce dla długotrwałych zadań. Tylko pojedynczy obraz referencyjny.                                                          |
| Google   | Używa Gemini/Veo. Obsługuje jeden obraz lub jeden film referencyjny.                                                                                         |
| MiniMax  | Tylko pojedynczy obraz referencyjny.                                                                                                                         |
| OpenAI   | Przekazywane jest tylko nadpisanie `size`. Inne nadpisania stylu (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z ostrzeżeniem.         |
| Qwen     | Ten sam backend DashScope co Alibaba. Wejścia referencyjne muszą być zdalnymi adresami URL `http(s)`; pliki lokalne są odrzucane z góry.                  |
| Runway   | Obsługuje pliki lokalne przez URI danych. Video-to-video wymaga `runway/gen4_aleph`. Uruchomienia tylko tekstowe udostępniają proporcje `16:9` i `9:16`. |
| Together | Tylko pojedynczy obraz referencyjny.                                                                                                                         |
| Vydra    | Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań z gubieniem autoryzacji. `veo3` jest dołączony tylko jako text-to-video; `kling` wymaga zdalnego adresu URL obrazu. |
| xAI      | Obsługuje przepływy text-to-video, image-to-video oraz zdalną edycję/rozszerzanie wideo.                                                                   |

## Konfiguracja

Ustaw domyślny model generowania filmów w konfiguracji OpenClaw:

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
- [Zadania w tle](/pl/automation/tasks) -- śledzenie zadań dla asynchronicznego generowania filmów
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
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference#agent-defaults)
- [Modele](/pl/concepts/models)
