---
read_when:
    - Generowanie lub edytowanie obrazów za pomocą agenta
    - Konfigurowanie dostawców i modeli generowania obrazów
    - Omówienie parametrów narzędzia image_generate
sidebarTitle: Image generation
summary: Generuj i edytuj obrazy za pomocą image_generate w OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Generowanie obrazów
x-i18n:
    generated_at: "2026-06-27T18:28:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

Narzędzie `image_generate` pozwala agentowi tworzyć i edytować obrazy przy użyciu
skonfigurowanych dostawców. W sesjach czatu generowanie obrazów działa asynchronicznie:
OpenClaw zapisuje zadanie w tle, natychmiast zwraca identyfikator zadania i wybudza
agenta, gdy dostawca zakończy pracę. Agent ukończenia używa normalnego dla sesji
trybu widocznej odpowiedzi: automatycznego dostarczenia końcowej odpowiedzi, gdy jest
skonfigurowane, albo `message(action="send")`, gdy sesja wymaga narzędzia
wiadomości. Jeśli sesja żądająca jest nieaktywna albo jej aktywne wybudzenie się nie powiedzie,
a w odpowiedzi ukończenia nadal brakuje części wygenerowanych obrazów, OpenClaw wysyła
idempotentną bezpośrednią odpowiedź awaryjną zawierającą tylko brakujące obrazy.

<Note>
Narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca
generowania obrazów. Jeśli nie widzisz `image_generate` w narzędziach agenta,
skonfiguruj `agents.defaults.imageGenerationModel`, ustaw klucz API dostawcy
albo zaloguj się przez OpenAI ChatGPT/Codex OAuth.
</Note>

## Szybki start

<Steps>
  <Step title="Skonfiguruj uwierzytelnianie">
    Ustaw klucz API dla co najmniej jednego dostawcy (na przykład `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) albo zaloguj się przez OpenAI Codex OAuth.
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

    ChatGPT/Codex OAuth używa tego samego odwołania do modelu `openai/gpt-image-2`. Gdy
    skonfigurowany jest profil OAuth `openai`, OpenClaw kieruje żądania obrazów
    przez ten profil OAuth zamiast najpierw próbować
    `OPENAI_API_KEY`. Jawna konfiguracja `models.providers.openai` (klucz API,
    niestandardowy/Azure bazowy URL) ponownie wybiera bezpośrednią trasę API
    OpenAI Images.

  </Step>
  <Step title="Poproś agenta">
    _"Wygeneruj obraz przyjaznej maskotki robota."_

    Agent automatycznie wywołuje `image_generate`. Nie trzeba dodawać narzędzia
    do listy dozwolonych - jest włączone domyślnie, gdy dostępny jest dostawca. Narzędzie
    zwraca identyfikator zadania w tle, a następnie agent ukończenia wysyła wygenerowany
    załącznik przez narzędzie `message`, gdy będzie gotowy.

  </Step>
</Steps>

<Warning>
W przypadku punktów końcowych LAN zgodnych z OpenAI, takich jak LocalAI, zachowaj niestandardowy
`models.providers.openai.baseUrl` i jawnie włącz zgodę przez
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Prywatne i
wewnętrzne punkty końcowe obrazów pozostają domyślnie zablokowane.
</Warning>

## Typowe trasy

| Cel                                                  | Odwołanie do modelu                                | Uwierzytelnianie                       |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Generowanie obrazów OpenAI z rozliczeniem API        | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Generowanie obrazów OpenAI z uwierzytelnianiem subskrypcji Codex | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI PNG/WebP z przezroczystym tłem                | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` albo OpenAI Codex OAuth |
| Generowanie obrazów DeepInfra                        | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2: ekspresyjne generowanie sterowane stylem | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| Generowanie obrazów OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Generowanie obrazów LiteLLM                          | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Generowanie obrazów Microsoft Foundry MAI            | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` albo Entra ID   |
| Generowanie obrazów Google Gemini                    | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` albo `GOOGLE_API_KEY` |

To samo narzędzie `image_generate` obsługuje generowanie tekst-na-obraz i edycję
z obrazami referencyjnymi. Użyj `image` dla jednej referencji albo `images` dla wielu referencji.
W przypadku modeli Krea 2 na fal te referencje są wysyłane jako referencje stylu
zamiast wejść edycyjnych.
Obsługiwane przez dostawcę podpowiedzi wyjściowe, takie jak `quality`, `outputFormat` i
`background`, są przekazywane, gdy są dostępne, i raportowane jako zignorowane, gdy
dostawca ich nie obsługuje. Wbudowana obsługa przezroczystego tła jest
specyficzna dla OpenAI; inni dostawcy nadal mogą zachować alfę PNG, jeśli ich
backend ją emituje.

## Obsługiwani dostawcy

| Dostawca          | Model domyślny                         | Obsługa edycji                     | Uwierzytelnianie                                      |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Tak (1 obraz, skonfigurowane przez workflow) | `COMFY_API_KEY` albo `COMFY_CLOUD_API_KEY` dla chmury |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Tak (1 obraz)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Tak (limity zależne od modelu)     | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Tak                                | `GEMINI_API_KEY` albo `GOOGLE_API_KEY`                |
| LiteLLM           | `gpt-image-2`                           | Tak (do 5 obrazów wejściowych)     | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Tak (tylko modele MAI-Image-2.5)   | `AZURE_OPENAI_API_KEY` albo Entra ID (`az login`)     |
| MiniMax           | `image-01`                              | Tak (referencja obiektu)           | `MINIMAX_API_KEY` albo MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Tak (do 4 obrazów)                 | `OPENAI_API_KEY` albo OpenAI ChatGPT/Codex OAuth      |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Tak (do 5 obrazów wejściowych)     | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Nie                                | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Tak (do 5 obrazów)                 | `XAI_API_KEY`                                         |

Użyj `action: "list"`, aby sprawdzić dostępnych dostawców i modele w czasie działania:

```text
/tool image_generate action=list
```

Użyj `action: "status"`, aby sprawdzić aktywne zadanie generowania obrazów dla
bieżącej sesji:

```text
/tool image_generate action=status
```

## Możliwości dostawców

| Możliwość             | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Generowanie (maks. liczba) | Zdefiniowane przez workflow | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Edycja / referencja   | 1 obraz (workflow) | 1 obraz   | Flux: 1; GPT: 10; referencje stylu Krea: 10; NB2: 14 | Do 5 obrazów | 1 obraz           | 1 obraz (referencja obiektu) | Do 5 obrazów | -     | Do 5 obrazów |
| Kontrola rozmiaru     | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | Do 4K          | -     | -              |
| Proporcje obrazu      | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Rozdzielczość (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Parametry narzędzia

<ParamField path="prompt" type="string" required>
  Prompt generowania obrazu. Wymagany dla `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Użyj `"status"`, aby sprawdzić aktywne zadanie sesji, albo `"list"`, aby sprawdzić
  dostępnych dostawców i modele w czasie działania.
</ParamField>
<ParamField path="model" type="string">
  Nadpisanie dostawcy/modelu (np. `openai/gpt-image-2`). Użyj
  `openai/gpt-image-1.5` dla przezroczystych teł OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Ścieżka albo URL pojedynczego obrazu referencyjnego dla trybu edycji.
</ParamField>
<ParamField path="images" type="string[]">
  Wiele obrazów referencyjnych dla trybu edycji albo modeli z referencjami stylu (do 10
  przez wspólne narzędzie; nadal obowiązują limity specyficzne dla dostawcy).
</ParamField>
<ParamField path="size" type="string">
  Podpowiedź rozmiaru: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Proporcje obrazu: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`. Dostawcy
  walidują swój podzbiór specyficzny dla modelu.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Podpowiedź rozdzielczości.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Podpowiedź jakości, gdy dostawca ją obsługuje.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Podpowiedź formatu wyjściowego, gdy dostawca ją obsługuje.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Podpowiedź tła, gdy dostawca ją obsługuje. Użyj `transparent` z
  `outputFormat: "png"` albo `"webp"` dla dostawców obsługujących przezroczystość.
</ParamField>
<ParamField path="count" type="number">Liczba obrazów do wygenerowania (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Opcjonalny limit czasu żądania do dostawcy w milisekundach. Gdy Codex wywołuje
  `image_generate` przez narzędzia dynamiczne, ta wartość dla pojedynczego wywołania nadal nadpisuje
  skonfigurowaną wartość domyślną i jest ograniczona do 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Podpowiedź nazwy pliku wyjściowego.</ParamField>
<ParamField path="openai" type="object">
  Podpowiedzi tylko dla OpenAI: `background`, `moderation`, `outputCompression` i `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Kontrola kreatywności fal Krea 2. Domyślnie `medium`.
</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. Gdy dostawca awaryjny obsługuje
zbliżoną opcję geometrii zamiast dokładnie żądanej, OpenClaw przed wysłaniem
mapuje ją na najbliższy obsługiwany rozmiar, proporcje obrazu albo rozdzielczość.
Nieobsługiwane podpowiedzi wyjściowe są odrzucane dla dostawców, którzy nie deklarują
obsługi, i raportowane w wyniku narzędzia. Wyniki narzędzia raportują zastosowane
ustawienia; `details.normalization` zapisuje każdą translację z żądanej wartości
na zastosowaną.
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

OpenClaw próbuje dostawców w tej kolejności:

1. **Parametr `model`** z wywołania narzędzia (jeśli agent go określi).
2. **`imageGenerationModel.primary`** z konfiguracji.
3. **`imageGenerationModel.fallbacks`** w kolejności.
4. **Automatyczne wykrywanie** - tylko domyślne ustawienia dostawców oparte na uwierzytelnianiu:
   - najpierw bieżący domyślny dostawca;
   - pozostali zarejestrowani dostawcy generowania obrazów w kolejności identyfikatorów dostawców.

Jeśli dostawca zawiedzie (błąd uwierzytelniania, limit szybkości itd.), następny skonfigurowany
kandydat jest automatycznie próbowany. Jeśli wszystkie próby zawiodą, błąd zawiera szczegóły
z każdej próby.

<AccordionGroup>
  <Accordion title="Nadpisania modelu dla pojedynczego wywołania są dokładne">
    Nadpisanie `model` dla pojedynczego wywołania próbuje tylko tego dostawcy/modelu i
    nie przechodzi do skonfigurowanego podstawowego/zapasowego ani automatycznie wykrytych dostawców.
  </Accordion>
  <Accordion title="Automatyczne wykrywanie uwzględnia uwierzytelnianie">
    Domyślny dostawca trafia na listę kandydatów tylko wtedy, gdy OpenClaw może
    faktycznie uwierzytelnić tego dostawcę. Ustaw
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby używać tylko
    jawnych wpisów `model`, `primary` i `fallbacks`.
  </Accordion>
  <Accordion title="Limity czasu">
    Ustaw `agents.defaults.imageGenerationModel.timeoutMs` dla wolnych backendów
    obrazów. Parametr narzędzia `timeoutMs` dla pojedynczego wywołania nadpisuje skonfigurowaną
    wartość domyślną, a skonfigurowane wartości domyślne nadpisują wartości domyślne dostawcy
    zdefiniowane przez Plugin. Dostawcy obrazów hostowani przez Google i OpenRouter używają domyślnie
    180 sekund; generowanie obrazów Microsoft Foundry MAI, xAI i Azure OpenAI używa
    600 sekund. Wywołania narzędzi dynamicznych Codex używają domyślnego mostka `image_generate`
    wynoszącego 120 sekund i respektują ten sam budżet limitu czasu, gdy jest skonfigurowany, ograniczony przez
    maksymalny limit mostka narzędzi dynamicznych OpenClaw wynoszący 600000 ms.
  </Accordion>
  <Accordion title="Inspekcja w czasie działania">
    Użyj `action: "list"`, aby sprawdzić obecnie zarejestrowanych dostawców,
    ich modele domyślne oraz wskazówki dotyczące zmiennych środowiskowych uwierzytelniania.
  </Accordion>
</AccordionGroup>

### Edycja obrazów

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI i xAI obsługują edycję obrazów referencyjnych. Modele Krea 2 w fal używają
tych samych pól `image` / `images` jako odniesień stylu zamiast danych wejściowych edycji. Przekaż
ścieżkę lub URL obrazu referencyjnego:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google i xAI obsługują do 5 obrazów referencyjnych przez
parametr `images`. fal obsługuje 1 obraz referencyjny dla Flux image-to-image, do
10 dla edycji GPT Image 2, do 10 odniesień stylu dla Krea 2 i do
14 dla edycji Nano Banana 2. Microsoft Foundry, MiniMax i ComfyUI obsługują 1.

## Szczegółowe omówienie dostawców

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (i gpt-image-1.5)">
    Generowanie obrazów OpenAI domyślnie używa `openai/gpt-image-2`. Jeśli
    skonfigurowano profil OAuth `openai`, OpenClaw ponownie używa tego samego
    profilu OAuth, którego używają modele czatu subskrypcji Codex, i wysyła
    żądanie obrazu przez backend Codex Responses. Starsze bazowe adresy URL Codex,
    takie jak `https://chatgpt.com/backend-api`, są kanonizowane do
    `https://chatgpt.com/backend-api/codex` dla żądań obrazów. OpenClaw
    **nie** przełącza się po cichu na `OPENAI_API_KEY` dla tego żądania -
    aby wymusić bezpośrednie trasowanie przez OpenAI Images API, skonfiguruj
    `models.providers.openai` jawnie z kluczem API, niestandardowym bazowym adresem URL
    lub punktem końcowym Azure.

    Modele `openai/gpt-image-1.5`, `openai/gpt-image-1` i
    `openai/gpt-image-1-mini` nadal można wybrać jawnie. Użyj
    `gpt-image-1.5` dla wyników PNG/WebP z przezroczystym tłem; obecne
    API `gpt-image-2` odrzuca `background: "transparent"`.

    `gpt-image-2` obsługuje zarówno generowanie tekst-na-obraz, jak i
    edycję obrazu referencyjnego przez to samo narzędzie `image_generate`.
    OpenClaw przekazuje do OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat`
    oraz obrazy referencyjne. OpenAI **nie** otrzymuje bezpośrednio
    `aspectRatio` ani `resolution`; gdy to możliwe, OpenClaw mapuje
    je na obsługiwane `size`, w przeciwnym razie narzędzie zgłasza je jako
    zignorowane nadpisania.

    Opcje specyficzne dla OpenAI znajdują się pod obiektem `openai`:

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
    przezroczyste wyniki wymagają `outputFormat` `png` lub `webp` oraz
    modelu obrazów OpenAI obsługującego przezroczystość. OpenClaw trasuje domyślne
    żądania przezroczystego tła `gpt-image-2` do `gpt-image-1.5`.
    `openai.outputCompression` dotyczy wyników JPEG/WebP i jest ignorowane
    dla wyników PNG.

    Wskazówka najwyższego poziomu `background` jest neutralna względem dostawcy i obecnie mapuje się
    na to samo pole żądania OpenAI `background`, gdy wybrany jest dostawca OpenAI.
    Dostawcy, którzy nie deklarują obsługi tła, zwracają
    ją w `ignoredOverrides` zamiast otrzymywać nieobsługiwany parametr.

    Aby trasować generowanie obrazów OpenAI przez wdrożenie Azure OpenAI
    zamiast `api.openai.com`, zobacz
    [punkty końcowe Azure OpenAI](/pl/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modele obrazów Microsoft Foundry MAI">
    Generowanie obrazów Microsoft Foundry używa nazw wdrożeń obrazów MAI
    pod prefiksem dostawcy `microsoft-foundry/`. Nie ma domyślnego modelu
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

    Dostawca używa MAI API Microsoft Foundry, a nie OpenAI Images API:

    - Punkt końcowy generowania: `/mai/v1/images/generations`
    - Punkt końcowy edycji: `/mai/v1/images/edits`
    - Uwierzytelnianie: `AZURE_OPENAI_API_KEY` / klucz API dostawcy albo Entra ID przez `az login`
    - Wynik: jeden obraz PNG
    - Rozmiar: domyślnie `1024x1024`; szerokość i wysokość muszą mieć co najmniej 768 px,
      a łączna liczba pikseli musi wynosić co najwyżej 1 048 576
    - Edycje: jeden obraz referencyjny PNG lub JPEG, obsługiwany tylko przez
      wdrożenia `MAI-Image-2.5-Flash` i `MAI-Image-2.5`

    Generowanie wyłącznie z promptu może używać niestandardowej nazwy wdrożenia tylko ze
    skonfigurowanym punktem końcowym Foundry. Edycje z niestandardowymi nazwami wdrożeń wymagają
    onboardingu/metadanych modelu, aby OpenClaw mógł zweryfikować, że wdrożenie jest
    oparte na `MAI-Image-2.5-Flash` lub `MAI-Image-2.5`.

    Obecne modele obrazów MAI to `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` i `MAI-Image-2`. Zobacz
    [Plugin Microsoft Foundry](/pl/plugins/reference/microsoft-foundry), aby poznać konfigurację
    i zachowanie modeli czatu.

  </Accordion>
  <Accordion title="Modele obrazów OpenRouter">
    Generowanie obrazów OpenRouter używa tego samego `OPENROUTER_API_KEY` i
    trasuje przez obrazowe API uzupełnień czatu OpenRouter. Wybieraj
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
    `google/gemini-3-pro-image-preview` i `openai/gpt-5.4-image-2`. Użyj
    `action: "list"`, aby zobaczyć, co udostępnia skonfigurowany Plugin.

  </Accordion>
  <Accordion title="fal Krea 2">
    Modele Krea 2 w fal używają natywnego schematu Krea fal zamiast ogólnego
    schematu `image_size` używanego przez Flux. OpenClaw wysyła:

    - `aspect_ratio` dla wskazówek proporcji obrazu
    - `creativity`, domyślnie `medium`
    - `image_style_references`, gdy podano `image` lub `images`

    Wybierz Krea 2 Medium dla szybszej, ekspresyjnej ilustracji oraz Krea 2 Large
    dla wolniejszych, bardziej szczegółowych fotorealistycznych i teksturowanych efektów:

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

    Krea 2 obecnie zwraca jeden obraz na żądanie. Preferuj `aspectRatio` dla
    Krea; OpenClaw mapuje `size` na najbliższą obsługiwaną proporcję Krea i
    odrzuca `resolution` dla Krea zamiast je pomijać. Użyj `fal.creativity`,
    gdy chcesz natywnego poziomu kreatywności Krea:

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
  <Accordion title="Podwójne uwierzytelnianie MiniMax">
    Generowanie obrazów MiniMax jest dostępne przez obie dołączone ścieżki
    uwierzytelniania MiniMax:

    - `minimax/image-01` dla konfiguracji z kluczem API
    - `minimax-portal/image-01` dla konfiguracji OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Dołączony dostawca xAI używa `/v1/images/generations` dla żądań wyłącznie z promptu
    oraz `/v1/images/edits`, gdy obecne jest `image` lub `images`.

    - Modele: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Liczba: do 4
    - Referencje: jedno `image` lub do pięciu `images`
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Rozdzielczości: `1K`, `2K`
    - Wyniki: zwracane jako załączniki obrazów zarządzane przez OpenClaw

    OpenClaw celowo nie udostępnia natywnych dla xAI pól `quality`, `mask`,
    `user` ani dodatkowych natywnych proporcji obrazu, dopóki te kontrolki nie istnieją
    we wspólnym kontrakcie międzydostawcowym `image_generate`.

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

Równoważne polecenie CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Generowanie (niska jakość OpenAI)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

Równoważne polecenie CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Te same flagi `--output-format`, `--background`, `--quality` i
`--openai-moderation` są dostępne w `openclaw infer image edit`;
`--openai-background` pozostaje aliasem specyficznym dla OpenAI. Dołączeni dostawcy
inni niż OpenAI nie deklarują obecnie jawnego sterowania tłem, więc
`background: "transparent"` jest dla nich zgłaszane jako ignorowane.

## Powiązane

- [Przegląd narzędzi](/pl/tools) - wszystkie dostępne narzędzia agenta
- [ComfyUI](/pl/providers/comfy) - konfiguracja lokalnego ComfyUI i przepływu pracy Comfy Cloud
- [fal](/pl/providers/fal) - konfiguracja dostawcy obrazów i wideo fal
- [Google (Gemini)](/pl/providers/google) - konfiguracja dostawcy obrazów Gemini
- [Plugin Microsoft Foundry](/pl/plugins/reference/microsoft-foundry) - konfiguracja czatu Microsoft Foundry i obrazów MAI
- [MiniMax](/pl/providers/minimax) - konfiguracja dostawcy obrazów MiniMax
- [OpenAI](/pl/providers/openai) - konfiguracja dostawcy OpenAI Images
- [Vydra](/pl/providers/vydra) - konfiguracja obrazów, wideo i mowy Vydra
- [xAI](/pl/providers/xai) - konfiguracja obrazów, wideo, wyszukiwania, wykonywania kodu i TTS Grok
- [Odniesienie do konfiguracji](/pl/gateway/config-agents#agent-defaults) - konfiguracja `imageGenerationModel`
- [Modele](/pl/concepts/models) - konfiguracja modelu i przełączanie awaryjne
