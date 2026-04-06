---
read_when:
    - Generowanie obrazów przez agenta
    - Konfigurowanie dostawców i modeli do generowania obrazów
    - Zrozumienie parametrów narzędzia image_generate
summary: Generuj i edytuj obrazy za pomocą skonfigurowanych dostawców (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Generowanie obrazów
x-i18n:
    generated_at: "2026-04-06T09:45:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 903cc522c283a8da2cbd449ae3e25f349a74d00ecfdaf0f323fd8aa3f2107aea
    source_path: tools/image-generation.md
    workflow: 15
---

# Generowanie obrazów

Narzędzie `image_generate` umożliwia agentowi tworzenie i edytowanie obrazów przy użyciu skonfigurowanych dostawców. Wygenerowane obrazy są automatycznie dostarczane jako załączniki multimedialne w odpowiedzi agenta.

<Note>
Narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania obrazów. Jeśli nie widzisz `image_generate` w narzędziach swojego agenta, skonfiguruj `agents.defaults.imageGenerationModel` lub ustaw klucz API dostawcy.
</Note>

## Szybki start

1. Ustaw klucz API dla co najmniej jednego dostawcy (na przykład `OPENAI_API_KEY` lub `GEMINI_API_KEY`).
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

3. Poproś agenta: _„Wygeneruj obraz przyjaznej maskotki homara.”_

Agent automatycznie wywoła `image_generate`. Nie trzeba dodawać go do listy dozwolonych narzędzi — jest domyślnie włączone, gdy dostawca jest dostępny.

## Obsługiwani dostawcy

| Dostawca | Model domyślny                   | Obsługa edycji                     | Klucz API                                              |
| -------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-1`                    | Tak (do 5 obrazów)                 | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Tak                                | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | Tak                                | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Tak (odniesienie do obiektu)       | `MINIMAX_API_KEY` lub OAuth MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Tak (1 obraz, zgodnie z workflow)  | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` dla chmury   |
| Vydra    | `grok-imagine`                   | Nie                                | `VYDRA_API_KEY`                                        |

Użyj `action: "list"`, aby sprawdzić dostępnych dostawców i modele w czasie działania:

```
/tool image_generate action=list
```

## Parametry narzędzia

| Parametr      | Typ      | Opis                                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt generowania obrazu (wymagany dla `action: "generate"`)                         |
| `action`      | string   | `"generate"` (domyślnie) lub `"list"` do sprawdzenia dostawców                        |
| `model`       | string   | Nadpisanie dostawcy/modelu, np. `openai/gpt-image-1`                                  |
| `image`       | string   | Ścieżka lub URL pojedynczego obrazu referencyjnego dla trybu edycji                   |
| `images`      | string[] | Wiele obrazów referencyjnych dla trybu edycji (do 5)                                  |
| `size`        | string   | Wskazówka rozmiaru: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`   |
| `aspectRatio` | string   | Współczynnik proporcji: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Wskazówka rozdzielczości: `1K`, `2K` lub `4K`                                         |
| `count`       | number   | Liczba obrazów do wygenerowania (1–4)                                                 |
| `filename`    | string   | Wskazówka nazwy pliku wyjściowego                                                     |

Nie wszyscy dostawcy obsługują wszystkie parametry. Narzędzie przekazuje to, co obsługuje dany dostawca, ignoruje resztę i zgłasza pominięte nadpisania w wyniku działania narzędzia.

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

### Kolejność wyboru dostawcy

Podczas generowania obrazu OpenClaw próbuje dostawców w tej kolejności:

1. Parametr **`model`** z wywołania narzędzia (jeśli agent go określi)
2. **`imageGenerationModel.primary`** z konfiguracji
3. **`imageGenerationModel.fallbacks`** w podanej kolejności
4. **Automatyczne wykrywanie** — używa tylko domyślnych dostawców opartych na uwierzytelnianiu:
   - najpierw bieżący domyślny dostawca
   - pozostali zarejestrowani dostawcy generowania obrazów w kolejności identyfikatorów dostawców

Jeśli dostawca zawiedzie (błąd uwierzytelnienia, limit szybkości itp.), automatycznie próbowany jest kolejny kandydat. Jeśli zawiodą wszystkie, błąd zawiera szczegóły z każdej próby.

Uwagi:

- Automatyczne wykrywanie uwzględnia stan uwierzytelnienia. Domyślny dostawca trafia na listę kandydatów tylko wtedy, gdy OpenClaw może rzeczywiście uwierzytelnić tego dostawcę.
- Użyj `action: "list"`, aby sprawdzić aktualnie zarejestrowanych dostawców, ich domyślne modele i wskazówki dotyczące zmiennych środowiskowych uwierzytelniania.

### Edycja obrazów

OpenAI, Google, fal, MiniMax i ComfyUI obsługują edycję obrazów referencyjnych. Przekaż ścieżkę lub URL obrazu referencyjnego:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI i Google obsługują do 5 obrazów referencyjnych za pomocą parametru `images`. fal, MiniMax i ComfyUI obsługują 1.

Generowanie obrazów MiniMax jest dostępne przez obie dołączone ścieżki uwierzytelniania MiniMax:

- `minimax/image-01` dla konfiguracji z kluczem API
- `minimax-portal/image-01` dla konfiguracji OAuth

## Możliwości dostawców

| Możliwość            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| Generowanie          | Tak (do 4)           | Tak (do 4)           | Tak (do 4)          | Tak (do 9)                 | Tak (wyniki określone przez workflow) | Tak (1) |
| Edycja/referencja    | Tak (do 5 obrazów)   | Tak (do 5 obrazów)   | Tak (1 obraz)       | Tak (1 obraz, odniesienie do obiektu) | Tak (1 obraz, zgodnie z workflow) | Nie     |
| Kontrola rozmiaru    | Tak                  | Tak                  | Tak                 | Nie                        | Nie                                | Nie     |
| Współczynnik proporcji | Nie                | Tak                  | Tak (tylko generowanie) | Tak                     | Nie                                | Nie     |
| Rozdzielczość (1K/2K/4K) | Nie             | Tak                  | Tak                 | Nie                        | Nie                                | Nie     |

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [fal](/pl/providers/fal) — konfiguracja dostawcy obrazów i wideo fal
- [ComfyUI](/pl/providers/comfy) — konfiguracja lokalnego ComfyUI i workflow Comfy Cloud
- [Google (Gemini)](/pl/providers/google) — konfiguracja dostawcy obrazów Gemini
- [MiniMax](/pl/providers/minimax) — konfiguracja dostawcy obrazów MiniMax
- [OpenAI](/pl/providers/openai) — konfiguracja dostawcy OpenAI Images
- [Vydra](/pl/providers/vydra) — konfiguracja obrazów, wideo i mowy Vydra
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference#agent-defaults) — konfiguracja `imageGenerationModel`
- [Modele](/pl/concepts/models) — konfiguracja modeli i przełączanie awaryjne
