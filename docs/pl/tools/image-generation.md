---
read_when:
    - Generowanie obrazów przez agenta
    - Konfigurowanie providerów i modeli do generowania obrazów
    - Zrozumienie parametrów narzędzia `image_generate`
summary: Generowanie i edycja obrazów przy użyciu skonfigurowanych providerów (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generowanie obrazów
x-i18n:
    generated_at: "2026-04-24T09:36:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ffc32165c5e25925460f95f3a6e674a004e6640b7a4b9e88d025eb40943b4b
    source_path: tools/image-generation.md
    workflow: 15
---

Narzędzie `image_generate` pozwala agentowi tworzyć i edytować obrazy przy użyciu skonfigurowanych providerów. Wygenerowane obrazy są automatycznie dostarczane jako załączniki multimedialne w odpowiedzi agenta.

<Note>
Narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden provider generowania obrazów. Jeśli nie widzisz `image_generate` w narzędziach agenta, skonfiguruj `agents.defaults.imageGenerationModel`, ustaw klucz API providera albo zaloguj się przez OpenAI Codex OAuth.
</Note>

## Szybki start

1. Ustaw klucz API dla co najmniej jednego providera (na przykład `OPENAI_API_KEY`, `GEMINI_API_KEY` lub `OPENROUTER_API_KEY`) albo zaloguj się przez OpenAI Codex OAuth.
2. Opcjonalnie ustaw preferowany model:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth używa tego samego odwołania do modelu `openai/gpt-image-2`. Gdy
skonfigurowany jest profil OAuth `openai-codex`, OpenClaw kieruje żądania obrazów
przez ten sam profil OAuth zamiast najpierw próbować użyć `OPENAI_API_KEY`.
Jawna własna konfiguracja obrazu `models.providers.openai`, taka jak klucz API lub
własny/bazowy URL Azure, przełącza z powrotem na bezpośrednią ścieżkę OpenAI Images API.
W przypadku endpointów OpenAI-compatible w LAN, takich jak LocalAI, zachowaj własny
`models.providers.openai.baseUrl` i jawnie włącz
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; prywatne/wewnętrzne
endpointy obrazów pozostają domyślnie zablokowane.

3. Poproś agenta: _„Wygeneruj obraz przyjaznej maskotki robota.”_

Agent automatycznie wywoła `image_generate`. Nie trzeba dodawać narzędzia do listy dozwolonych — jest domyślnie włączone, gdy provider jest dostępny.

## Obsługiwani providerzy

| Provider   | Model domyślny                          | Obsługa edycji                      | Auth                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | Tak (do 4 obrazów)                 | `OPENAI_API_KEY` lub OpenAI Codex OAuth               |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Tak (do 5 obrazów wejściowych)     | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`        | Tak                                | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                 |
| fal        | `fal-ai/flux/dev`                       | Tak                                | `FAL_KEY`                                             |
| MiniMax    | `image-01`                              | Tak (odwołanie do obiektu)         | `MINIMAX_API_KEY` lub MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                              | Tak (1 obraz, konfigurowany przez workflow) | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` dla chmury |
| Vydra      | `grok-imagine`                          | Nie                                | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Tak (do 5 obrazów)                 | `XAI_API_KEY`                                         |

Użyj `action: "list"`, aby sprawdzić dostępnych providerów i modele w czasie działania:

```
/tool image_generate action=list
```

## Parametry narzędzia

<ParamField path="prompt" type="string" required>
Prompt generowania obrazu. Wymagany dla `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Użyj `"list"`, aby sprawdzić dostępnych providerów i modele w czasie działania.
</ParamField>

<ParamField path="model" type="string">
Nadpisanie provider/model, np. `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Ścieżka lub URL pojedynczego obrazu referencyjnego dla trybu edycji.
</ParamField>

<ParamField path="images" type="string[]">
Wiele obrazów referencyjnych dla trybu edycji (do 5).
</ParamField>

<ParamField path="size" type="string">
Wskazówka rozmiaru: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Proporcje obrazu: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Wskazówka rozdzielczości.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Wskazówka jakości, jeśli provider to obsługuje.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Wskazówka formatu wyjściowego, jeśli provider to obsługuje.
</ParamField>

<ParamField path="count" type="number">
Liczba obrazów do wygenerowania (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Opcjonalny limit czasu żądania do providera w milisekundach.
</ParamField>

<ParamField path="filename" type="string">
Wskazówka nazwy pliku wyjściowego.
</ParamField>

<ParamField path="openai" type="object">
Wskazówki tylko dla OpenAI: `background`, `moderation`, `outputCompression` i `user`.
</ParamField>

Nie wszyscy providerzy obsługują wszystkie parametry. Gdy provider fallback obsługuje zbliżoną opcję geometrii zamiast dokładnie żądanej, OpenClaw mapuje ją na najbliższy obsługiwany rozmiar, proporcje albo rozdzielczość przed wysłaniem żądania. Nieobsługiwane wskazówki wyjściowe, takie jak `quality` czy `outputFormat`, są pomijane dla providerów, którzy nie deklarują obsługi, i są raportowane w wyniku narzędzia.

Wyniki narzędzia raportują zastosowane ustawienia. Gdy OpenClaw mapuje geometrię podczas fallbacku providera, zwracane wartości `size`, `aspectRatio` i `resolution` odzwierciedlają to, co faktycznie zostało wysłane, a `details.normalization` zawiera translację z wartości żądanych na zastosowane.

## Konfiguracja

### Wybór modelu

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Kolejność wyboru providera

Podczas generowania obrazu OpenClaw próbuje providerów w tej kolejności:

1. **Parametr `model`** z wywołania narzędzia (jeśli agent go poda)
2. **`imageGenerationModel.primary`** z konfiguracji
3. **`imageGenerationModel.fallbacks`** po kolei
4. **Automatyczne wykrywanie** — używa tylko domyślnych providerów opartych na auth:
   - najpierw bieżący provider domyślny
   - następnie pozostali zarejestrowani providerzy generowania obrazów w kolejności provider-id

Jeśli provider zawiedzie (błąd auth, limit szybkości itd.), automatycznie próbowany jest kolejny kandydat. Jeśli zawiodą wszyscy, błąd zawiera szczegóły każdej próby.

Uwagi:

- Automatyczne wykrywanie uwzględnia auth. Domyślny provider trafia na listę kandydatów
  tylko wtedy, gdy OpenClaw może rzeczywiście uwierzytelnić tego providera.
- Automatyczne wykrywanie jest domyślnie włączone. Ustaw
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, jeśli chcesz, aby generowanie obrazów
  używało tylko jawnych wpisów `model`, `primary` i `fallbacks`.
- Użyj `action: "list"`, aby sprawdzić aktualnie zarejestrowanych providerów, ich
  modele domyślne i wskazówki dotyczące zmiennych env do auth.

### Edycja obrazów

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI i xAI obsługują edycję obrazów referencyjnych. Przekaż ścieżkę lub URL obrazu referencyjnego:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google i xAI obsługują do 5 obrazów referencyjnych przez parametr `images`. fal, MiniMax i ComfyUI obsługują 1.

### Modele obrazów OpenRouter

Generowanie obrazów OpenRouter używa tego samego `OPENROUTER_API_KEY` i przechodzi przez API obrazów chat completions OpenRouter. Wybieraj modele obrazów OpenRouter z prefiksem `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw przekazuje do OpenRouter `prompt`, `count`, obrazy referencyjne oraz zgodne z Gemini wskazówki `aspectRatio` / `resolution`. Obecne wbudowane skróty modeli obrazów OpenRouter obejmują `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` i `openai/gpt-5.4-image-2`; użyj `action: "list"`, aby zobaczyć, co udostępnia Twój skonfigurowany Plugin.

### OpenAI `gpt-image-2`

OpenAI do generowania obrazów domyślnie używa `openai/gpt-image-2`. Jeśli
skonfigurowano profil OAuth `openai-codex`, OpenClaw używa ponownie tego samego profilu OAuth,
który jest używany przez modele czatu subskrypcji Codex, i wysyła żądanie obrazu
przez backend Codex Responses; nie przełącza się po cichu na
`OPENAI_API_KEY` dla tego żądania. Aby wymusić bezpośrednie kierowanie do OpenAI Images API,
skonfiguruj jawnie `models.providers.openai` z kluczem API, własnym bazowym URL
lub endpointem Azure. Starszy model
`openai/gpt-image-1` nadal można wybrać jawnie, ale nowe żądania OpenAI
dotyczące generowania i edycji obrazów powinny używać `gpt-image-2`.

`gpt-image-2` obsługuje zarówno generowanie tekst-do-obrazu, jak i edycję
obrazu referencyjnego przez to samo narzędzie `image_generate`. OpenClaw przekazuje do OpenAI `prompt`,
`count`, `size`, `quality`, `outputFormat` i obrazy referencyjne.
OpenAI nie otrzymuje bezpośrednio `aspectRatio` ani `resolution`; gdy to możliwe,
OpenClaw mapuje je na obsługiwany `size`, w przeciwnym razie narzędzie zgłasza je jako
zignorowane nadpisania.

Opcje specyficzne dla OpenAI znajdują się w obiekcie `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` akceptuje `transparent`, `opaque` lub `auto`; wyjścia przezroczyste
wymagają `outputFormat` równego `png` lub `webp`. `openai.outputCompression`
dotyczy wyjść JPEG/WebP.

Wygeneruj jeden obraz 4K w orientacji poziomej:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Wygeneruj dwa kwadratowe obrazy:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Edytuj jeden lokalny obraz referencyjny:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Edytuj z użyciem wielu obrazów referencyjnych:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Aby kierować generowanie obrazów OpenAI przez wdrożenie Azure OpenAI zamiast
`api.openai.com`, zobacz [Endpointy Azure OpenAI](/pl/providers/openai#azure-openai-endpoints)
w dokumentacji providera OpenAI.

Generowanie obrazów MiniMax jest dostępne przez obie dołączone ścieżki auth MiniMax:

- `minimax/image-01` dla konfiguracji z kluczem API
- `minimax-portal/image-01` dla konfiguracji z OAuth

## Możliwości providerów

| Możliwość             | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generowanie           | Tak (do 4)           | Tak (do 4)           | Tak (do 4)          | Tak (do 9)                 | Tak (wyniki zdefiniowane przez workflow) | Tak (1) | Tak (do 4)           |
| Edycja/referencja     | Tak (do 5 obrazów)   | Tak (do 5 obrazów)   | Tak (1 obraz)       | Tak (1 obraz, referencja obiektu) | Tak (1 obraz, konfigurowany przez workflow) | Nie     | Tak (do 5 obrazów)   |
| Sterowanie rozmiarem  | Tak (do 4K)          | Tak                  | Tak                 | Nie                        | Nie                                | Nie     | Nie                  |
| Proporcje obrazu      | Nie                  | Tak                  | Tak (tylko generowanie) | Tak                     | Nie                                | Nie     | Tak                  |
| Rozdzielczość (1K/2K/4K) | Nie               | Tak                  | Tak                 | Nie                        | Nie                                | Nie     | Tak (1K/2K)          |

### xAI `grok-imagine-image`

Dołączony provider xAI używa `/v1/images/generations` dla żądań opartych tylko na promptach
oraz `/v1/images/edits`, gdy obecne jest `image` lub `images`.

- Modele: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Count: do 4
- Referencje: jedno `image` lub do pięciu `images`
- Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Rozdzielczości: `1K`, `2K`
- Dane wyjściowe: zwracane jako załączniki obrazów zarządzane przez OpenClaw

OpenClaw celowo nie udostępnia natywnych dla xAI opcji `quality`, `mask`, `user` ani
dodatkowych proporcji obrazu dostępnych wyłącznie natywnie, dopóki te ustawienia nie będą istnieć w
współdzielonym, wieloproviderowym kontrakcie `image_generate`.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [fal](/pl/providers/fal) — konfiguracja providera obrazów i wideo fal
- [ComfyUI](/pl/providers/comfy) — konfiguracja lokalnego workflow ComfyUI i Comfy Cloud
- [Google (Gemini)](/pl/providers/google) — konfiguracja providera obrazów Gemini
- [MiniMax](/pl/providers/minimax) — konfiguracja providera obrazów MiniMax
- [OpenAI](/pl/providers/openai) — konfiguracja providera OpenAI Images
- [Vydra](/pl/providers/vydra) — konfiguracja obrazów, wideo i mowy Vydra
- [xAI](/pl/providers/xai) — konfiguracja Grok dla obrazów, wideo, wyszukiwania, wykonywania kodu i TTS
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — konfiguracja `imageGenerationModel`
- [Modele](/pl/concepts/models) — konfiguracja modeli i failover
