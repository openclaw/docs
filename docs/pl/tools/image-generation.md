---
read_when:
    - Generowanie obrazów przez agenta
    - Konfigurowanie providerów i modeli do generowania obrazów
    - Zrozumienie parametrów narzędzia image_generate
summary: Generowanie i edycja obrazów przy użyciu skonfigurowanych providerów (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Generowanie obrazów
x-i18n:
    generated_at: "2026-04-07T09:50:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f7303c199d46e63e88f5f9567478a1025631afb03cb35f44344c12370365e57
    source_path: tools/image-generation.md
    workflow: 15
---

# Generowanie obrazów

Narzędzie `image_generate` pozwala agentowi tworzyć i edytować obrazy przy użyciu skonfigurowanych providerów. Wygenerowane obrazy są automatycznie dostarczane jako załączniki multimedialne w odpowiedzi agenta.

<Note>
Narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden provider generowania obrazów. Jeśli nie widzisz `image_generate` w narzędziach swojego agenta, skonfiguruj `agents.defaults.imageGenerationModel` albo ustaw klucz API providera.
</Note>

## Szybki start

1. Ustaw klucz API dla co najmniej jednego providera (na przykład `OPENAI_API_KEY` lub `GEMINI_API_KEY`).
2. Opcjonalnie ustaw preferowany model:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

3. Poproś agenta: _"Wygeneruj obraz przyjaznej maskotki homara."_

Agent wywoła `image_generate` automatycznie. Nie trzeba dodawać go do listy dozwolonych narzędzi — jest domyślnie włączone, gdy provider jest dostępny.

## Obsługiwani providerzy

| Provider | Model domyślny                   | Obsługa edycji                     | Klucz API                                               |
| -------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------- |
| OpenAI   | `gpt-image-1`                    | Tak (do 5 obrazów)                 | `OPENAI_API_KEY`                                        |
| Google   | `gemini-3.1-flash-image-preview` | Tak                                | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                   |
| fal      | `fal-ai/flux/dev`                | Tak                                | `FAL_KEY`                                               |
| MiniMax  | `image-01`                       | Tak (referencja obiektu)           | `MINIMAX_API_KEY` lub OAuth MiniMax (`minimax-portal`)  |
| ComfyUI  | `workflow`                       | Tak (1 obraz, konfigurowany przez workflow) | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` dla chmury |
| Vydra    | `grok-imagine`                   | Nie                                | `VYDRA_API_KEY`                                         |

Użyj `action: "list"`, aby sprawdzić dostępnych providerów i modele w runtime:

```
/tool image_generate action=list
```

## Parametry narzędzia

| Parametr      | Typ      | Opis                                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt do generowania obrazu (wymagany dla `action: "generate"`)                      |
| `action`      | string   | `"generate"` (domyślnie) lub `"list"` do sprawdzenia providerów                       |
| `model`       | string   | Nadpisanie providera/modelu, np. `openai/gpt-image-1`                                 |
| `image`       | string   | Ścieżka lub URL pojedynczego obrazu referencyjnego dla trybu edycji                   |
| `images`      | string[] | Wiele obrazów referencyjnych dla trybu edycji (do 5)                                  |
| `size`        | string   | Wskazówka rozmiaru: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`   |
| `aspectRatio` | string   | Współczynnik proporcji: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Wskazówka rozdzielczości: `1K`, `2K` lub `4K`                                         |
| `count`       | number   | Liczba obrazów do wygenerowania (1–4)                                                 |
| `filename`    | string   | Wskazówka nazwy pliku wyjściowego                                                     |

Nie wszyscy providerzy obsługują wszystkie parametry. Gdy fallback provider obsługuje zbliżoną opcję geometrii zamiast dokładnie żądanej, OpenClaw przed wysłaniem mapuje ją na najbliższy obsługiwany rozmiar, współczynnik proporcji lub rozdzielczość. Naprawdę nieobsługiwane nadpisania są nadal raportowane w wyniku narzędzia.

Wyniki narzędzia raportują zastosowane ustawienia. Gdy OpenClaw mapuje geometrię podczas fallbacku providera, zwracane wartości `size`, `aspectRatio` i `resolution` odzwierciedlają to, co faktycznie zostało wysłane, a `details.normalization` rejestruje translację od wartości żądanej do zastosowanej.

## Konfiguracja

### Wybór modelu

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Kolejność wyboru providera

Podczas generowania obrazu OpenClaw próbuje providerów w tej kolejności:

1. Parametr **`model`** z wywołania narzędzia (jeśli agent go określi)
2. **`imageGenerationModel.primary`** z configu
3. **`imageGenerationModel.fallbacks`** w podanej kolejności
4. **Auto-detection** — używa tylko domyślnych providerów wspartych auth:
   - najpierw bieżący provider domyślny
   - następnie pozostali zarejestrowani providerzy generowania obrazów w kolejności identyfikatorów providerów

Jeśli provider zawiedzie (błąd auth, limit szybkości itd.), automatycznie próbowany jest kolejny kandydat. Jeśli zawiodą wszystkie, błąd zawiera szczegóły każdej próby.

Uwagi:

- Auto-detection uwzględnia auth. Provider domyślny trafia na listę kandydatów
  tylko wtedy, gdy OpenClaw może rzeczywiście uwierzytelnić tego providera.
- Auto-detection jest domyślnie włączone. Ustaw
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, jeśli chcesz, aby generowanie obrazów
  używało tylko jawnych wpisów `model`, `primary` i `fallbacks`.
- Użyj `action: "list"`, aby sprawdzić aktualnie zarejestrowanych providerów, ich
  modele domyślne oraz wskazówki dotyczące zmiennych środowiskowych auth.

### Edycja obrazów

OpenAI, Google, fal, MiniMax i ComfyUI obsługują edycję obrazów referencyjnych. Przekaż ścieżkę lub URL obrazu referencyjnego:

```
"Wygeneruj akwarelową wersję tego zdjęcia" + image: "/path/to/photo.jpg"
```

OpenAI i Google obsługują do 5 obrazów referencyjnych przez parametr `images`. fal, MiniMax i ComfyUI obsługują 1.

Generowanie obrazów MiniMax jest dostępne przez obie dołączone ścieżki auth MiniMax:

- `minimax/image-01` dla konfiguracji z kluczem API
- `minimax-portal/image-01` dla konfiguracji OAuth

## Możliwości providerów

| Możliwość            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| Generowanie          | Tak (do 4)           | Tak (do 4)           | Tak (do 4)          | Tak (do 9)                 | Tak (wyjścia definiowane przez workflow) | Tak (1) |
| Edycja/referencja    | Tak (do 5 obrazów)   | Tak (do 5 obrazów)   | Tak (1 obraz)       | Tak (1 obraz, referencja obiektu) | Tak (1 obraz, konfigurowany przez workflow) | Nie     |
| Kontrola rozmiaru    | Tak                  | Tak                  | Tak                 | Nie                        | Nie                                 | Nie      |
| Współczynnik proporcji | Nie                | Tak                  | Tak (tylko generowanie) | Tak                     | Nie                                 | Nie      |
| Rozdzielczość (1K/2K/4K) | Nie             | Tak                  | Tak                 | Nie                        | Nie                                 | Nie      |

## Powiązane

- [Tools Overview](/pl/tools) — wszystkie dostępne narzędzia agenta
- [fal](/pl/providers/fal) — konfiguracja providera obrazów i wideo fal
- [ComfyUI](/pl/providers/comfy) — konfiguracja lokalnego workflow ComfyUI i Comfy Cloud
- [Google (Gemini)](/pl/providers/google) — konfiguracja providera obrazów Gemini
- [MiniMax](/pl/providers/minimax) — konfiguracja providera obrazów MiniMax
- [OpenAI](/pl/providers/openai) — konfiguracja providera OpenAI Images
- [Vydra](/pl/providers/vydra) — konfiguracja obrazów, wideo i mowy Vydra
- [Configuration Reference](/pl/gateway/configuration-reference#agent-defaults) — konfiguracja `imageGenerationModel`
- [Models](/pl/concepts/models) — konfiguracja modeli i failover
