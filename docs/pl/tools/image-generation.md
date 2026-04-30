---
read_when:
    - Generowanie lub edytowanie obrazów za pomocą agenta
    - Konfigurowanie dostawców i modeli generowania obrazów
    - Omówienie parametrów narzędzia image_generate
sidebarTitle: Image generation
summary: Generuj i edytuj obrazy za pomocą image_generate w OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI i Vydra
title: Generowanie obrazów
x-i18n:
    generated_at: "2026-04-30T10:22:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 16
---

Narzędzie `image_generate` pozwala agentowi tworzyć i edytować obrazy za pomocą
skonfigurowanych dostawców. Wygenerowane obrazy są automatycznie dostarczane jako
załączniki multimedialne w odpowiedzi agenta.

<Note>
Narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca
generowania obrazów. Jeśli nie widzisz `image_generate` w narzędziach agenta,
skonfiguruj `agents.defaults.imageGenerationModel`, ustaw klucz API dostawcy
albo zaloguj się przez OpenAI Codex OAuth.
</Note>

## Szybki start

<Steps>
  <Step title="Configure auth">
    Ustaw klucz API dla co najmniej jednego dostawcy (na przykład `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) albo zaloguj się przez OpenAI Codex OAuth.
  </Step>
  <Step title="Pick a default model (optional)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth używa tego samego odwołania do modelu `openai/gpt-image-2`. Gdy
    skonfigurowany jest profil OAuth `openai-codex`, OpenClaw kieruje żądania
    obrazów przez ten profil OAuth zamiast najpierw próbować `OPENAI_API_KEY`.
    Jawna konfiguracja `models.providers.openai` (klucz API, niestandardowy/Azure
    bazowy URL) ponownie wybiera bezpośrednią ścieżkę OpenAI Images API.

  </Step>
  <Step title="Ask the agent">
    _"Wygeneruj obraz przyjaznej maskotki robota."_

    Agent automatycznie wywołuje `image_generate`. Nie trzeba dodawać narzędzia
    do listy dozwolonych — jest domyślnie włączone, gdy dostępny jest dostawca.

  </Step>
</Steps>

<Warning>
W przypadku punktów końcowych LAN zgodnych z OpenAI, takich jak LocalAI,
zachowaj niestandardowe `models.providers.openai.baseUrl` i jawnie włącz opcję
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Prywatne i
wewnętrzne punkty końcowe obrazów pozostają domyślnie zablokowane.
</Warning>

## Typowe ścieżki

| Cel                                                  | Odwołanie do modelu                              | Uwierzytelnianie                      |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Generowanie obrazów OpenAI z rozliczaniem przez API  | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Generowanie obrazów OpenAI z uwierzytelnianiem subskrypcji Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI PNG/WebP z przezroczystym tłem                | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` lub OpenAI Codex OAuth |
| Generowanie obrazów DeepInfra                        | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Generowanie obrazów OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Generowanie obrazów LiteLLM                          | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Generowanie obrazów Google Gemini                    | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`   |

To samo narzędzie `image_generate` obsługuje zamianę tekstu na obraz oraz
edycję obrazów referencyjnych. Użyj `image` dla jednej referencji albo `images`
dla wielu referencji. Obsługiwane przez dostawcę wskazówki wyjściowe, takie jak
`quality`, `outputFormat` i `background`, są przekazywane, gdy są dostępne, oraz
zgłaszane jako zignorowane, gdy dostawca ich nie obsługuje. Wbudowana obsługa
przezroczystego tła jest specyficzna dla OpenAI; inni dostawcy nadal mogą
zachować kanał alfa PNG, jeśli emituje go ich backend.

## Obsługiwani dostawcy

| Dostawca   | Model domyślny                         | Obsługa edycji                    | Uwierzytelnianie                                      |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Tak (1 obraz, skonfigurowane w workflow) | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` dla chmury |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | Tak (1 obraz)                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | Tak                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Tak                                | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | Tak (do 5 obrazów wejściowych)     | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Tak (referencja podmiotu)          | `MINIMAX_API_KEY` lub MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Tak (do 4 obrazów)                 | `OPENAI_API_KEY` lub OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Tak (do 5 obrazów wejściowych)     | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | Nie                                | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Tak (do 5 obrazów)                 | `XAI_API_KEY`                                         |

Użyj `action: "list"`, aby sprawdzić dostępnych dostawców i modele w czasie wykonywania:

```text
/tool image_generate action=list
```

## Możliwości dostawców

| Możliwość             | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Generowanie (maks. liczba) | Zdefiniowane w workflow | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| Edycja / referencja   | 1 obraz (workflow) | 1 obraz   | 1 obraz           | Do 5 obrazów   | 1 obraz (ref. podmiotu) | Do 5 obrazów | —     | Do 5 obrazów   |
| Kontrola rozmiaru     | —                  | ✓         | ✓                 | ✓              | —                     | Do 4K          | —     | —              |
| Proporcje             | —                  | —         | ✓ (tylko generowanie) | ✓           | ✓                     | —              | —     | ✓              |
| Rozdzielczość (1K/2K/4K) | —               | —         | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## Parametry narzędzia

<ParamField path="prompt" type="string" required>
  Prompt generowania obrazu. Wymagany dla `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Użyj `"list"`, aby sprawdzić dostępnych dostawców i modele w czasie wykonywania.
</ParamField>
<ParamField path="model" type="string">
  Nadpisanie dostawcy/modelu (np. `openai/gpt-image-2`). Użyj
  `openai/gpt-image-1.5` dla przezroczystych teł OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Ścieżka lub URL pojedynczego obrazu referencyjnego dla trybu edycji.
</ParamField>
<ParamField path="images" type="string[]">
  Wiele obrazów referencyjnych dla trybu edycji (do 5 u obsługujących dostawców).
</ParamField>
<ParamField path="size" type="string">
  Wskazówka rozmiaru: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Proporcje: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Wskazówka rozdzielczości.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Wskazówka jakości, gdy dostawca ją obsługuje.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Wskazówka formatu wyjściowego, gdy dostawca ją obsługuje.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Wskazówka tła, gdy dostawca ją obsługuje. Użyj `transparent` z
  `outputFormat: "png"` lub `"webp"` dla dostawców obsługujących przezroczystość.
</ParamField>
<ParamField path="count" type="number">Liczba obrazów do wygenerowania (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Opcjonalny limit czasu żądania dostawcy w milisekundach.</ParamField>
<ParamField path="filename" type="string">Wskazówka nazwy pliku wyjściowego.</ParamField>
<ParamField path="openai" type="object">
  Wskazówki tylko dla OpenAI: `background`, `moderation`, `outputCompression` i `user`.
</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. Gdy dostawca awaryjny
obsługuje zbliżoną opcję geometrii zamiast dokładnie żądanej, OpenClaw przed
wysłaniem mapuje ją na najbliższy obsługiwany rozmiar, proporcje lub
rozdzielczość. Nieobsługiwane wskazówki wyjściowe są pomijane dla dostawców,
którzy nie deklarują obsługi, i zgłaszane w wyniku narzędzia. Wyniki narzędzia
zgłaszają zastosowane ustawienia; `details.normalization` rejestruje wszelkie
tłumaczenie z żądanych ustawień na zastosowane.
</Note>

## Konfiguracja

### Wybór modelu

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
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

### Kolejność wyboru dostawcy

OpenClaw próbuje dostawców w tej kolejności:

1. Parametr **`model`** z wywołania narzędzia (jeśli agent go określi).
2. **`imageGenerationModel.primary`** z konfiguracji.
3. **`imageGenerationModel.fallbacks`** w kolejności.
4. **Automatyczne wykrywanie** — wyłącznie domyślni dostawcy z uwierzytelnianiem:
   - najpierw bieżący dostawca domyślny;
   - pozostali zarejestrowani dostawcy generowania obrazów w kolejności identyfikatorów dostawców.

Jeśli dostawca zawiedzie (błąd uwierzytelniania, limit szybkości itp.), następny
skonfigurowany kandydat jest próbowany automatycznie. Jeśli wszyscy zawiodą,
błąd zawiera szczegóły z każdej próby.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Nadpisanie `model` dla pojedynczego wywołania próbuje tylko tego dostawcy/modelu
    i nie przechodzi do skonfigurowanego dostawcy podstawowego/awaryjnego ani
    automatycznie wykrytych dostawców.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Domyślny dostawca trafia na listę kandydatów tylko wtedy, gdy OpenClaw może
    faktycznie uwierzytelnić tego dostawcę. Ustaw
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby używać tylko
    jawnych wpisów `model`, `primary` i `fallbacks`.
  </Accordion>
  <Accordion title="Timeouts">
    Ustaw `agents.defaults.imageGenerationModel.timeoutMs` dla wolnych backendów
    obrazów. Parametr narzędzia `timeoutMs` dla pojedynczego wywołania nadpisuje
    skonfigurowaną wartość domyślną.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Użyj `action: "list"`, aby sprawdzić obecnie zarejestrowanych dostawców,
    ich domyślne modele oraz wskazówki dotyczące zmiennych środowiskowych
    uwierzytelniania.
  </Accordion>
</AccordionGroup>

### Edycja obrazów

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI i xAI obsługują edycję
obrazów referencyjnych. Przekaż ścieżkę lub URL obrazu referencyjnego:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google i xAI obsługują do 5 obrazów referencyjnych przez
parametr `images`. fal, MiniMax i ComfyUI obsługują 1.

## Szczegółowe omówienia dostawców

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (i gpt-image-1.5)">
    Generowanie obrazów OpenAI domyślnie używa `openai/gpt-image-2`. Jeśli
    skonfigurowano profil OAuth `openai-codex`, OpenClaw ponownie używa tego samego
    profilu OAuth, którego używają modele czatu subskrypcji Codex, i wysyła
    żądanie obrazu przez backend Codex Responses. Starsze bazowe adresy URL Codex,
    takie jak `https://chatgpt.com/backend-api`, są kanonizowane do
    `https://chatgpt.com/backend-api/codex` dla żądań obrazów. OpenClaw
    **nie** przełącza się po cichu na `OPENAI_API_KEY` dla tego żądania —
    aby wymusić bezpośrednie kierowanie przez OpenAI Images API, skonfiguruj
    jawnie `models.providers.openai` z kluczem API, niestandardowym bazowym adresem URL
    lub punktem końcowym Azure.

    Modele `openai/gpt-image-1.5`, `openai/gpt-image-1` i
    `openai/gpt-image-1-mini` nadal można wybrać jawnie. Użyj
    `gpt-image-1.5` do wyjścia PNG/WebP z przezroczystym tłem; obecne
    API `gpt-image-2` odrzuca `background: "transparent"`.

    `gpt-image-2` obsługuje zarówno generowanie tekst-na-obraz, jak i
    edycję obrazu referencyjnego przez to samo narzędzie `image_generate`.
    OpenClaw przekazuje do OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat`
    oraz obrazy referencyjne. OpenAI **nie** otrzymuje bezpośrednio
    `aspectRatio` ani `resolution`; gdy to możliwe, OpenClaw mapuje
    je na obsługiwany `size`, w przeciwnym razie narzędzie zgłasza je jako
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

    `openai.background` akceptuje `transparent`, `opaque` lub `auto`;
    przezroczyste wyjścia wymagają `outputFormat` `png` albo `webp` oraz
    modelu obrazów OpenAI obsługującego przezroczystość. OpenClaw kieruje domyślne
    żądania `gpt-image-2` z przezroczystym tłem do `gpt-image-1.5`.
    `openai.outputCompression` stosuje się do wyjść JPEG/WebP.

    Najwyższego poziomu wskazówka `background` jest neutralna względem dostawcy i obecnie mapuje się
    na to samo pole żądania OpenAI `background`, gdy wybrany jest dostawca OpenAI.
    Dostawcy, którzy nie deklarują obsługi tła, zwracają ją w
    `ignoredOverrides` zamiast otrzymywać nieobsługiwany parametr.

    Aby kierować generowanie obrazów OpenAI przez wdrożenie Azure OpenAI
    zamiast `api.openai.com`, zobacz
    [punkty końcowe Azure OpenAI](/pl/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modele obrazów OpenRouter">
    Generowanie obrazów OpenRouter używa tego samego `OPENROUTER_API_KEY` i
    kieruje żądania przez API obrazów dla uzupełnień czatu OpenRouter. Wybieraj
    modele obrazów OpenRouter z prefiksem `openrouter/`:

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

    OpenClaw przekazuje do OpenRouter `prompt`, `count`, obrazy referencyjne oraz
    zgodne z Gemini wskazówki `aspectRatio` / `resolution`.
    Obecne wbudowane skróty modeli obrazów OpenRouter obejmują
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` oraz `openai/gpt-5.4-image-2`. Użyj
    `action: "list"`, aby zobaczyć, co udostępnia skonfigurowany Plugin.

  </Accordion>
  <Accordion title="Podwójne uwierzytelnianie MiniMax">
    Generowanie obrazów MiniMax jest dostępne przez obie dołączone ścieżki
    uwierzytelniania MiniMax:

    - `minimax/image-01` dla konfiguracji z kluczem API
    - `minimax-portal/image-01` dla konfiguracji OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Dołączony dostawca xAI używa `/v1/images/generations` dla żądań zawierających tylko prompt
    oraz `/v1/images/edits`, gdy obecne jest `image` lub `images`.

    - Modele: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Liczba: do 4
    - Referencje: jedno `image` albo do pięciu `images`
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Rozdzielczości: `1K`, `2K`
    - Wyjścia: zwracane jako zarządzane przez OpenClaw załączniki obrazów

    OpenClaw celowo nie udostępnia natywnych dla xAI opcji `quality`, `mask`,
    `user` ani dodatkowych, wyłącznie natywnych proporcji obrazu, dopóki te elementy sterujące
    nie będą istnieć we wspólnym, międzydostawcowym kontrakcie `image_generate`.

  </Accordion>
</AccordionGroup>

## Przykłady

<Tabs>
  <Tab title="Generowanie (krajobraz 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generowanie (przezroczysty PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Równoważne CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Generowanie (dwa kwadratowe)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edycja (jedna referencja)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edycja (wiele referencji)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Te same flagi `--output-format` i `--background` są dostępne w
`openclaw infer image edit`; `--openai-background` pozostaje aliasem
specyficznym dla OpenAI. Dołączeni dostawcy inni niż OpenAI obecnie nie deklarują
jawnej kontroli tła, więc `background: "transparent"` jest dla nich zgłaszane
jako zignorowane.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [ComfyUI](/pl/providers/comfy) — konfiguracja lokalnego przepływu pracy ComfyUI i Comfy Cloud
- [fal](/pl/providers/fal) — konfiguracja dostawcy obrazów i wideo fal
- [Google (Gemini)](/pl/providers/google) — konfiguracja dostawcy obrazów Gemini
- [MiniMax](/pl/providers/minimax) — konfiguracja dostawcy obrazów MiniMax
- [OpenAI](/pl/providers/openai) — konfiguracja dostawcy OpenAI Images
- [Vydra](/pl/providers/vydra) — konfiguracja obrazów, wideo i mowy Vydra
- [xAI](/pl/providers/xai) — konfiguracja obrazów Grok, wideo, wyszukiwania, wykonywania kodu i TTS
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — konfiguracja `imageGenerationModel`
- [Modele](/pl/concepts/models) — konfiguracja modeli i przełączanie awaryjne
