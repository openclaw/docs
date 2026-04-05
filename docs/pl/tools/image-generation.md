---
read_when:
    - Generujesz obrazy przez agenta
    - Konfigurujesz providerów i modele do generowania obrazów
    - Chcesz zrozumieć parametry narzędzia `image_generate`
summary: Generowanie i edytowanie obrazów przy użyciu skonfigurowanych providerów (OpenAI, Google Gemini, fal, MiniMax)
title: Generowanie obrazów
x-i18n:
    generated_at: "2026-04-05T14:08:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: d38a8a583997ceff6523ce4f51808c97a2b59fe4e5a34cf79cdcb70d7e83aec2
    source_path: tools/image-generation.md
    workflow: 15
---

# Generowanie obrazów

Narzędzie `image_generate` pozwala agentowi tworzyć i edytować obrazy przy użyciu skonfigurowanych providerów. Wygenerowane obrazy są automatycznie dostarczane jako załączniki multimedialne w odpowiedzi agenta.

<Note>
Narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden provider generowania obrazów. Jeśli nie widzisz `image_generate` w narzędziach agenta, skonfiguruj `agents.defaults.imageGenerationModel` albo ustaw klucz API providera.
</Note>

## Szybki start

1. Ustaw klucz API dla co najmniej jednego providera (na przykład `OPENAI_API_KEY` albo `GEMINI_API_KEY`).
2. Opcjonalnie ustaw preferowany model:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: "openai/gpt-image-1",
    },
  },
}
```

3. Poproś agenta: _„Wygeneruj obraz przyjaznej homarzej maskotki.”_

Agent automatycznie wywoła `image_generate`. Nie trzeba dodawać go do allowlisty narzędzi — jest domyślnie włączone, gdy provider jest dostępny.

## Obsługiwani providerzy

| Provider | Model domyślny                   | Obsługa edycji          | Klucz API                                              |
| -------- | -------------------------------- | ----------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-1`                    | Tak (do 5 obrazów)      | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Tak                     | `GEMINI_API_KEY` albo `GOOGLE_API_KEY`                 |
| fal      | `fal-ai/flux/dev`                | Tak                     | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Tak (referencja obiektu) | `MINIMAX_API_KEY` albo MiniMax OAuth (`minimax-portal`) |

Użyj `action: "list"`, aby w runtime sprawdzić dostępnych providerów i modele:

```
/tool image_generate action=list
```

## Parametry narzędzia

| Parametr      | Typ      | Opis                                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt do generowania obrazu (wymagany dla `action: "generate"`)                     |
| `action`      | string   | `"generate"` (domyślnie) albo `"list"`, aby sprawdzić providerów                     |
| `model`       | string   | Nadpisanie provider/model, np. `openai/gpt-image-1`                                  |
| `image`       | string   | Ścieżka albo URL pojedynczego obrazu referencyjnego dla trybu edycji                 |
| `images`      | string[] | Wiele obrazów referencyjnych dla trybu edycji (do 5)                                 |
| `size`        | string   | Wskazówka rozmiaru: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`  |
| `aspectRatio` | string   | Proporcje obrazu: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Wskazówka rozdzielczości: `1K`, `2K` albo `4K`                                       |
| `count`       | number   | Liczba obrazów do wygenerowania (1–4)                                                |
| `filename`    | string   | Wskazówka nazwy pliku wyjściowego                                                     |

Nie wszyscy providerzy obsługują wszystkie parametry. Narzędzie przekazuje to, co obsługuje dany provider, a resztę ignoruje.

## Konfiguracja

### Wybór modelu

```json5
{
  agents: {
    defaults: {
      // Forma string: tylko model primary
      imageGenerationModel: "google/gemini-3.1-flash-image-preview",

      // Forma object: primary + uporządkowane fallbacki
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

1. **Parametr `model`** z wywołania narzędzia (jeśli agent go poda)
2. **`imageGenerationModel.primary`** z konfiguracji
3. **`imageGenerationModel.fallbacks`** w podanej kolejności
4. **Auto-detection** — używa tylko domyślnych providerów opartych na auth:
   - najpierw bieżący default provider
   - potem pozostali zarejestrowani providerzy generowania obrazów w kolejności provider-id

Jeśli provider zawiedzie (błąd auth, rate limit itd.), automatycznie próbowany jest kolejny kandydat. Jeśli zawiodą wszystkie, błąd będzie zawierał szczegóły każdej próby.

Uwagi:

- Auto-detection uwzględnia auth. Domyślny provider trafia na listę kandydatów
  tylko wtedy, gdy OpenClaw może faktycznie uwierzytelnić tego providera.
- Użyj `action: "list"`, aby sprawdzić aktualnie zarejestrowanych providerów, ich
  modele domyślne i wskazówki dotyczące auth env-var.

### Edytowanie obrazów

OpenAI, Google, fal i MiniMax obsługują edytowanie obrazów referencyjnych. Przekaż ścieżkę albo URL obrazu referencyjnego:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI i Google obsługują do 5 obrazów referencyjnych przez parametr `images`. fal i MiniMax obsługują 1.

Generowanie obrazów w MiniMax jest dostępne przez obie bundled ścieżki auth MiniMax:

- `minimax/image-01` dla konfiguracji z kluczem API
- `minimax-portal/image-01` dla konfiguracji OAuth

## Możliwości providerów

| Możliwość             | OpenAI               | Google               | fal                 | MiniMax                     |
| --------------------- | -------------------- | -------------------- | ------------------- | --------------------------- |
| Generowanie           | Tak (do 4)           | Tak (do 4)           | Tak (do 4)          | Tak (do 9)                  |
| Edycja/referencja     | Tak (do 5 obrazów)   | Tak (do 5 obrazów)   | Tak (1 obraz)       | Tak (1 obraz, referencja obiektu) |
| Kontrola rozmiaru     | Tak                  | Tak                  | Tak                 | Nie                         |
| Proporcje obrazu      | Nie                  | Tak                  | Tak (tylko generowanie) | Tak                      |
| Rozdzielczość (1K/2K/4K) | Nie               | Tak                  | Tak                 | Nie                         |

## Powiązane

- [Przegląd narzędzi](/tools) — wszystkie dostępne narzędzia agenta
- [Dokumentacja konfiguracji](/gateway/configuration-reference#agent-defaults) — konfiguracja `imageGenerationModel`
- [Modele](/concepts/models) — konfiguracja modeli i failover
