---
read_when:
    - Generowanie lub edytowanie obrazów za pomocą agenta
    - Konfigurowanie dostawców i modeli generowania obrazów
    - Omówienie parametrów narzędzia image_generate
sidebarTitle: Image generation
summary: Generuj i edytuj obrazy za pomocą image_generate w OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI i Vydra
title: Generowanie obrazów
x-i18n:
    generated_at: "2026-07-12T15:42:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

Narzędzie `image_generate` tworzy i edytuje obrazy za pośrednictwem skonfigurowanych
dostawców. W sesjach czatu działa asynchronicznie: OpenClaw rejestruje
zadanie w tle, natychmiast zwraca identyfikator zadania i wybudza agenta, gdy
dostawca zakończy pracę. Agent kończący stosuje zwykły tryb widocznej
odpowiedzi sesji: automatyczne dostarczenie odpowiedzi końcowej, jeśli zostało
skonfigurowane, albo `message(action="send")`, gdy sesja wymaga narzędzia
wiadomości. Jeśli sesja zlecającego jest nieaktywna lub jej aktywne wybudzenie
się nie powiedzie, OpenClaw wysyła idempotentną bezpośrednią wiadomość
awaryjną z wygenerowanymi obrazami, aby wynik nie został utracony.

<Note>
Narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden
dostawca generowania obrazów. Jeśli nie widzisz `image_generate` w narzędziach
agenta, skonfiguruj `agents.defaults.imageGenerationModel`, ustaw klucz API
dostawcy lub zaloguj się przez OpenAI ChatGPT/Codex OAuth.
</Note>

## Szybki start

<Steps>
  <Step title="Skonfiguruj uwierzytelnianie">
    Ustaw klucz API co najmniej jednego dostawcy (na przykład `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) lub zaloguj się przez OpenAI Codex OAuth.
  </Step>
  <Step title="Wybierz model domyślny (opcjonalnie)">
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

    ChatGPT/Codex OAuth używa tego samego odwołania do modelu
    `openai/gpt-image-2`. Gdy skonfigurowany jest profil OAuth `openai`,
    OpenClaw kieruje żądania obrazów przez ten profil OAuth, zamiast najpierw
    próbować użyć `OPENAI_API_KEY`. Jawna konfiguracja
    `models.providers.openai` (klucz API, niestandardowy lub Azure bazowy adres
    URL) ponownie włącza bezpośrednią ścieżkę przez OpenAI Images API.

  </Step>
  <Step title="Poproś agenta">
    _„Wygeneruj obraz przyjaznej maskotki-robota”._

    Agent automatycznie wywołuje `image_generate`. Nie trzeba dodawać narzędzia
    do listy dozwolonych — jest domyślnie włączone, gdy dostępny jest dostawca.
    Narzędzie zwraca identyfikator zadania w tle, a następnie agent kończący
    wysyła wygenerowany załącznik przez narzędzie `message`, gdy jest gotowy.

  </Step>
</Steps>

<Warning>
W przypadku punktów końcowych w sieci LAN zgodnych z OpenAI, takich jak
LocalAI, zachowaj niestandardowe ustawienie `models.providers.openai.baseUrl`
i jawnie włącz `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`.
Prywatne i wewnętrzne punkty końcowe obrazów pozostają domyślnie zablokowane.
</Warning>

## Typowe ścieżki

| Cel                                                        | Odwołanie do modelu                                | Uwierzytelnianie                         |
| ---------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------- |
| Generowanie obrazów OpenAI z rozliczeniem przez API        | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                         |
| Generowanie obrazów OpenAI z uwierzytelnianiem subskrypcji Codex | `openai/gpt-image-2`                          | OpenAI ChatGPT/Codex OAuth               |
| OpenAI PNG/WebP z przezroczystym tłem                      | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` lub OpenAI Codex OAuth  |
| Generowanie obrazów DeepInfra                              | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                      |
| Ekspresyjne generowanie fal Krea 2 sterowane stylem        | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                                |
| Generowanie obrazów OpenRouter                             | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                     |
| Generowanie obrazów LiteLLM                                | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                        |
| Generowanie obrazów Microsoft Foundry MAI                  | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` lub Entra ID      |
| Generowanie obrazów Google Gemini                          | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`    |

To samo narzędzie obsługuje generowanie obrazu z tekstu oraz edycję z użyciem
obrazu referencyjnego. Użyj `image` dla jednego obrazu referencyjnego lub
`images` dla wielu. W przypadku modeli Krea 2 w fal te obrazy referencyjne są
przesyłane jako odniesienia stylistyczne zamiast danych wejściowych do edycji.
Obsługiwane przez dostawcę wskazówki dotyczące wyniku, takie jak `quality`,
`outputFormat` i `background`, są przekazywane, gdy jest to możliwe, a gdy
dostawca nie deklaruje ich obsługi, są zgłaszane jako zignorowane. Wbudowana
obsługa przezroczystego tła jest właściwa dla OpenAI; inni dostawcy również
mogą zachować kanał alfa PNG, jeśli generuje go ich zaplecze.

## Obsługiwani dostawcy

| Dostawca          | Model domyślny                          | Obsługa edycji                              | Uwierzytelnianie                                      |
| ----------------- | --------------------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Tak (1 obraz, konfiguracja w przepływie pracy) | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` dla chmury |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Tak (1 obraz)                               | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Tak (limity zależne od modelu)              | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Tak (do 5 obrazów)                          | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                 |
| LiteLLM           | `gpt-image-2`                           | Tak (do 5 obrazów wejściowych)              | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Tak (tylko modele MAI-Image-2.5)            | `AZURE_OPENAI_API_KEY` lub Entra ID (`az login`)      |
| MiniMax           | `image-01`                              | Tak (odniesienie do obiektu)                | `MINIMAX_API_KEY` lub MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Tak (do 5 obrazów)                          | `OPENAI_API_KEY` lub OpenAI ChatGPT/Codex OAuth       |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Tak (do 5 obrazów wejściowych)              | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Nie                                         | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Tak (do 3 obrazów)                          | `XAI_API_KEY`                                         |

Użyj `action: "list"`, aby sprawdzić dostawców i modele dostępne w czasie działania:

```text
/tool image_generate action=list
```

Użyj `action: "status"`, aby sprawdzić aktywne zadanie generowania obrazów dla
bieżącej sesji:

```text
/tool image_generate action=status
```

## Możliwości dostawców

| Możliwość                  | ComfyUI                    | DeepInfra | fal                                               | Google       | Microsoft Foundry | MiniMax                         | OpenAI       | Vydra | xAI          |
| -------------------------- | -------------------------- | --------- | ------------------------------------------------- | ------------ | ----------------- | ------------------------------- | ------------ | ----- | ------------ |
| Generowanie (maks. liczba) | 1                          | 4         | 4                                                 | 4            | 1                 | 9                               | 4            | 1     | 4            |
| Edycja / odniesienie       | 1 obraz (przepływ pracy)   | 1 obraz   | Flux: 1; GPT: 10; odniesienia stylu Krea: 10; NB2: 14 | Do 5 obrazów | 1 obraz           | 1 obraz (odniesienie do obiektu) | Do 5 obrazów | -     | Do 3 obrazów |
| Sterowanie rozmiarem       | -                          | ✓         | ✓                                                 | ✓            | ✓                 | -                               | Do 4K        | -     | -            |
| Proporcje obrazu           | -                          | -         | ✓                                                 | ✓            | -                 | ✓                               | -            | -     | ✓            |
| Rozdzielczość (1K/2K/4K)   | -                          | -         | ✓                                                 | ✓            | -                 | -                               | -            | -     | 1K, 2K       |

## Parametry narzędzia

<ParamField path="prompt" type="string" required>
  Polecenie generowania obrazu. Wymagane dla `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Użyj `"status"`, aby sprawdzić aktywne zadanie sesji, lub `"list"`, aby
  sprawdzić dostawców i modele dostępne w czasie działania.
</ParamField>
<ParamField path="model" type="string">
  Zastąpienie dostawcy/modelu (np. `openai/gpt-image-2`). Użyj
  `openai/gpt-image-1.5` dla przezroczystych teł OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Ścieżka lub adres URL pojedynczego obrazu referencyjnego dla trybu edycji.
</ParamField>
<ParamField path="images" type="string[]">
  Wiele obrazów referencyjnych dla trybu edycji lub modeli korzystających z
  odniesień stylistycznych (do 14 za pośrednictwem wspólnego narzędzia; nadal
  obowiązują limity właściwe dla dostawcy).
</ParamField>
<ParamField path="size" type="string">
  Wskazówka rozmiaru: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Proporcje obrazu: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. Dostawcy weryfikują podzbiór właściwy dla danego modelu.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Wskazówka rozdzielczości.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Wskazówka jakości, gdy dostawca ją obsługuje.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Wskazówka formatu wyjściowego, gdy dostawca go obsługuje.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Wskazówka dotycząca tła, gdy dostawca ją obsługuje. Użyj `transparent` wraz
  z `outputFormat: "png"` lub `"webp"` w przypadku dostawców obsługujących
  przezroczystość.
</ParamField>
<ParamField path="count" type="number">Liczba obrazów do wygenerowania (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Opcjonalny limit czasu żądania do dostawcy w milisekundach. Gdy Codex
  wywołuje `image_generate` za pośrednictwem narzędzi dynamicznych, ta wartość
  dla pojedynczego wywołania nadal zastępuje skonfigurowaną wartość domyślną
  i jest ograniczona do 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Wskazówka nazwy pliku wyjściowego.</ParamField>
<ParamField path="openai" type="object">
  Wskazówki wyłącznie dla OpenAI: `background`, `moderation`, `outputCompression` i `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Sterowanie kreatywnością fal Krea 2. Wartość domyślna to `medium`.
</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. Gdy dostawca awaryjny
obsługuje zbliżoną opcję geometrii zamiast dokładnie żądanej, OpenClaw przed
przesłaniem mapuje ją na najbliższy obsługiwany rozmiar, proporcje obrazu lub
rozdzielczość. Nieobsługiwane wskazówki dotyczące wyniku są pomijane w
przypadku dostawców, którzy nie deklarują ich obsługi, i zgłaszane w wyniku
narzędzia. Wyniki narzędzia zawierają zastosowane ustawienia;
`details.normalization` rejestruje każde przekształcenie wartości żądanej na
zastosowaną.
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

### Kolejność wyboru dostawców

OpenClaw próbuje użyć dostawców w następującej kolejności:

1. Parametr **`model`** z wywołania narzędzia (jeśli agent go określi).
2. **`imageGenerationModel.primary`** z konfiguracji.
3. **`imageGenerationModel.fallbacks`** w podanej kolejności.
4. **Automatyczne wykrywanie** — tylko domyślni dostawcy z dostępnym uwierzytelnianiem:
   - najpierw bieżący domyślny dostawca;
   - następnie pozostali zarejestrowani dostawcy generowania obrazów, według identyfikatora dostawcy.

Jeśli dostawca zawiedzie (błąd uwierzytelniania, limit żądań itp.), automatycznie
wypróbowywany jest następny skonfigurowany kandydat. Jeśli zawiodą wszyscy, błąd
zawiera szczegóły każdej próby.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Nadpisanie `model` dla pojedynczego wywołania powoduje wypróbowanie tylko
    tego dostawcy i modelu, bez przechodzenia do skonfigurowanego modelu
    podstawowego, modeli rezerwowych ani automatycznie wykrytych dostawców.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Domyślny model dostawcy trafia na listę kandydatów tylko wtedy, gdy OpenClaw
    może faktycznie uwierzytelnić się u tego dostawcy. Ustaw
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby używać
    wyłącznie jawnych wpisów `model`, `primary` i `fallbacks`.
  </Accordion>
  <Accordion title="Timeouts">
    Ustaw `agents.defaults.imageGenerationModel.timeoutMs` dla wolnych
    mechanizmów generowania obrazów. Parametr narzędzia `timeoutMs` dla
    pojedynczego wywołania nadpisuje skonfigurowaną wartość domyślną,
    a skonfigurowane wartości domyślne nadpisują wartości domyślne dostawców
    określone przez plugin. Hostowani dostawcy obrazów Google i OpenRouter
    domyślnie używają 180 sekund; generowanie obrazów Microsoft Foundry MAI,
    xAI i Azure OpenAI używa 600 sekund. Wywołania narzędzi dynamicznych Codex
    używają domyślnego limitu 120 sekund dla mostka `image_generate`
    i po skonfigurowaniu respektują ten sam budżet czasu, ograniczony
    maksymalnym limitem 600000 ms mostka narzędzi dynamicznych OpenClaw.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Użyj `action: "list"`, aby sprawdzić aktualnie zarejestrowanych dostawców,
    ich domyślne modele oraz wskazówki dotyczące zmiennych środowiskowych
    uwierzytelniania.
  </Accordion>
</AccordionGroup>

### Edycja obrazów

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI i xAI obsługują edycję obrazów referencyjnych. Modele Krea 2 w fal
używają tych samych pól `image` / `images` jako referencji stylu, a nie jako
danych wejściowych do edycji. Przekaż ścieżkę lub adres URL obrazu
referencyjnego:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter i Google obsługują do 5 obrazów referencyjnych za pomocą
parametru `images`; xAI obsługuje do 3. fal obsługuje 1 obraz referencyjny
dla konwersji obrazu na obraz w Flux, do 10 dla edycji GPT Image 2, do 10
referencji stylu dla Krea 2 oraz do 14 dla edycji Nano Banana 2.
Microsoft Foundry, MiniMax i ComfyUI obsługują 1.

## Szczegółowe omówienie dostawców

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    Generowanie obrazów OpenAI domyślnie używa `openai/gpt-image-2`. Jeśli
    skonfigurowano profil OAuth `openai`, OpenClaw ponownie wykorzystuje ten
    sam profil OAuth, którego używają modele czatu subskrypcji Codex,
    i wysyła żądanie obrazu przez mechanizm Codex Responses. Starsze bazowe
    adresy URL Codex, takie jak `https://chatgpt.com/backend-api`, są
    normalizowane do `https://chatgpt.com/backend-api/codex` na potrzeby
    żądań obrazów. OpenClaw **nie** przełącza się niejawnie na
    `OPENAI_API_KEY` dla takiego żądania — aby wymusić bezpośrednie kierowanie
    do OpenAI Images API, skonfiguruj jawnie `models.providers.openai`
    z kluczem API, niestandardowym bazowym adresem URL lub punktem końcowym
    Azure.

    Modele `openai/gpt-image-1.5`, `openai/gpt-image-1` i
    `openai/gpt-image-1-mini` nadal można wybierać jawnie. Użyj
    `gpt-image-1.5`, aby uzyskać pliki PNG/WebP z przezroczystym tłem;
    bieżące API `gpt-image-2` odrzuca `background: "transparent"`.

    `gpt-image-2` obsługuje zarówno generowanie obrazu z tekstu, jak i edycję
    obrazu referencyjnego za pomocą tego samego narzędzia `image_generate`.
    OpenClaw przekazuje do OpenAI `prompt`, `count`, `size`, `quality`,
    `outputFormat` oraz obrazy referencyjne. OpenAI **nie** otrzymuje
    bezpośrednio `aspectRatio` ani `resolution`; gdy jest to możliwe, OpenClaw
    mapuje je na obsługiwaną wartość `size`, a w przeciwnym razie narzędzie
    zgłasza je jako zignorowane nadpisania.

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

    `openai.background` przyjmuje `transparent`, `opaque` lub `auto`;
    przezroczyste obrazy wyjściowe wymagają wartości `png` albo `webp` dla
    `outputFormat` oraz modelu obrazów OpenAI obsługującego przezroczystość.
    OpenClaw kieruje domyślne żądania `gpt-image-2` z przezroczystym tłem
    do `gpt-image-1.5`. `openai.outputCompression` ma zastosowanie do obrazów
    wyjściowych JPEG/WebP i jest ignorowane dla obrazów PNG.

    Wskazówka `background` najwyższego poziomu jest niezależna od dostawcy
    i obecnie jest mapowana na to samo pole żądania OpenAI `background`,
    gdy wybrano dostawcę OpenAI. Dostawcy, którzy nie deklarują obsługi tła,
    zwracają ją w `ignoredOverrides`, zamiast otrzymywać nieobsługiwany
    parametr.

    Aby kierować generowanie obrazów OpenAI przez wdrożenie Azure OpenAI
    zamiast `api.openai.com`, zobacz
    [punkty końcowe Azure OpenAI](/pl/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    Generowanie obrazów Microsoft Foundry używa nazw wdrożeń obrazów MAI
    z prefiksem dostawcy `microsoft-foundry/`. Nie istnieje domyślny model
    na poziomie dostawcy, ponieważ API MAI oczekuje nazwy wdrożenia w polu
    `model`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    Dostawca używa API MAI Microsoft Foundry, a nie OpenAI Images API:

    - Punkt końcowy generowania: `/mai/v1/images/generations`
    - Punkt końcowy edycji: `/mai/v1/images/edits`
    - Uwierzytelnianie: `AZURE_OPENAI_API_KEY` / klucz API dostawcy albo Entra ID przez `az login`
    - Dane wyjściowe: jeden obraz PNG
    - Rozmiar: domyślnie `1024x1024`; szerokość i wysokość muszą wynosić co najmniej 768 px,
      a łączna liczba pikseli nie może przekraczać 1 048 576
    - Edycja: jeden obraz referencyjny PNG lub JPEG, obsługiwany tylko przez
      wdrożenia `MAI-Image-2.5-Flash` i `MAI-Image-2.5`

    Generowanie wyłącznie na podstawie monitu może używać niestandardowej
    nazwy wdrożenia po skonfigurowaniu samego punktu końcowego Foundry.
    Edycja z niestandardowymi nazwami wdrożeń wymaga metadanych wdrażania
    lub modelu, aby OpenClaw mógł sprawdzić, czy wdrożenie jest oparte na
    `MAI-Image-2.5-Flash` albo `MAI-Image-2.5`.

    Bieżące modele obrazów MAI to `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` i `MAI-Image-2`. Informacje o konfiguracji i działaniu
    modeli czatu zawiera
    [plugin Microsoft Foundry](/pl/plugins/reference/microsoft-foundry).

  </Accordion>
  <Accordion title="OpenRouter image models">
    Generowanie obrazów OpenRouter używa tego samego `OPENROUTER_API_KEY`
    i jest kierowane przez API obrazów uzupełnień czatu OpenRouter. Wybieraj
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

    OpenClaw przekazuje do OpenRouter `prompt`, `count`, obrazy referencyjne
    oraz zgodne z Gemini wskazówki `aspectRatio` / `resolution`. Bieżące
    wbudowane skróty modeli obrazów OpenRouter obejmują
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` i `openai/gpt-5.4-image-2`. Użyj
    `action: "list"`, aby zobaczyć, co udostępnia skonfigurowany plugin.

  </Accordion>
  <Accordion title="fal Krea 2">
    Modele Krea 2 w fal używają natywnego schematu Krea dostarczanego przez
    fal zamiast ogólnego schematu `image_size` używanego przez Flux. OpenClaw
    wysyła:

    - `aspect_ratio` dla wskazówek dotyczących proporcji obrazu
    - `creativity`, domyślnie `medium`
    - `image_style_references`, gdy podano `image` lub `images`

    Wybierz Krea 2 Medium, aby szybciej tworzyć ekspresyjne ilustracje,
    lub Krea 2 Large, aby wolniej uzyskiwać bardziej szczegółowy,
    fotorealistyczny wygląd z wyraźnymi teksturami:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 zwraca obecnie jeden obraz na żądanie. W przypadku Krea preferuj
    `aspectRatio`; OpenClaw mapuje `size` na najbliższe obsługiwane proporcje
    Krea, natomiast odrzuca `resolution` dla Krea zamiast je pomijać. Użyj
    `fal.creativity`, jeśli chcesz ustawić natywny poziom kreatywności Krea:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    Generowanie obrazów MiniMax jest dostępne przez obie dołączone ścieżki
    uwierzytelniania MiniMax:

    - `minimax/image-01` dla konfiguracji z kluczem API
    - `minimax-portal/image-01` dla konfiguracji OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Dołączony dostawca xAI używa `/v1/images/generations` dla żądań opartych
    wyłącznie na monicie oraz `/v1/images/edits`, gdy występuje `image`
    lub `images`.

    - Modele: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Liczba: do 4
    - Referencje: jedno `image` lub maksymalnie trzy `images`
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Rozdzielczości: `1K`, `2K`
    - Dane wyjściowe: zwracane jako załączniki obrazów zarządzane przez OpenClaw

    OpenClaw celowo nie udostępnia natywnych dla xAI opcji `quality`, `mask`,
    `user` ani proporcji obrazu `auto`, dopóki te mechanizmy sterowania nie
    znajdą się we wspólnej, międzydostawczej umowie `image_generate`.

  </Accordion>
</AccordionGroup>

## Przykłady

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Odpowiednik w CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Generate (OpenAI low quality)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

Odpowiednik w CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generowanie (dwa kwadratowe obrazy)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Dwie koncepcje wizualne ikony spokojnej aplikacji wspierającej produktywność" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edycja (jeden obraz referencyjny)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Zachowaj główny obiekt i zastąp tło jasną aranżacją studyjną" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edycja (wiele obrazów referencyjnych)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Połącz tożsamość postaci z pierwszego obrazu z paletą kolorów z drugiego" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Referencje stylu Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Ekspresyjny portret redakcyjny wykorzystujący tę paletę kolorów i fakturę druku" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Te same flagi `--output-format`, `--background`, `--quality` i
`--openai-moderation` są dostępne w poleceniu `openclaw infer image edit`;
`--openai-background` pozostaje aliasem właściwym dla OpenAI. Obecnie wbudowani dostawcy
inni niż OpenAI nie deklarują jawnego sterowania tłem, dlatego
`background: "transparent"` jest w ich przypadku zgłaszane jako zignorowane.

## Powiązane materiały

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [ComfyUI](/pl/providers/comfy) — konfiguracja lokalnego przepływu pracy ComfyUI i Comfy Cloud
- [fal](/pl/providers/fal) — konfiguracja dostawcy obrazów i wideo fal
- [Google (Gemini)](/pl/providers/google) — konfiguracja dostawcy obrazów Gemini
- [Plugin Microsoft Foundry](/pl/plugins/reference/microsoft-foundry) — konfiguracja czatu Microsoft Foundry i obrazów MAI
- [MiniMax](/pl/providers/minimax) — konfiguracja dostawcy obrazów MiniMax
- [OpenAI](/pl/providers/openai) — konfiguracja dostawcy OpenAI Images
- [Vydra](/pl/providers/vydra) — konfiguracja obrazów, wideo i mowy Vydra
- [xAI](/pl/providers/xai) — konfiguracja obrazów, wideo, wyszukiwania, wykonywania kodu i TTS Grok
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — konfiguracja `imageGenerationModel`
- [Modele](/pl/concepts/models) — konfiguracja modeli i przełączanie awaryjne
