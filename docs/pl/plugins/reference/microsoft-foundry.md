---
read_when:
    - Instalujesz, konfigurujesz lub audytujesz Plugin microsoft-foundry
summary: Dodaje obsługę dostawcy modeli Microsoft Foundry w OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-06-27T18:02:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Dodaje do OpenClaw obsługę Microsoft Foundry jako dostawcy modeli.

## Dystrybucja

- Pakiet: `@openclaw/microsoft-foundry`
- Ścieżka instalacji: dołączony do OpenClaw

## Powierzchnia

dostawcy: microsoft-foundry; kontrakty: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Dostawca generowania obrazów: `microsoft-foundry`

## Wymagania

- Zasób Microsoft Foundry lub Azure AI Foundry z wdrożeniami.
- Uwierzytelnianie kluczem API przez `AZURE_OPENAI_API_KEY` albo skonfigurowany klucz API dostawcy.
- W przypadku uwierzytelniania Entra ID zainstaluj Azure CLI i uruchom `az login` przed
  konfiguracją początkową. OpenClaw odświeża tokeny środowiska uruchomieniowego Microsoft Foundry przez
  `az account get-access-token`.

## Modele czatu

Wdrożenia czatu Microsoft Foundry używają referencji modelu dostawcy
`microsoft-foundry/<deployment-name>`. Konfiguracja początkowa wykrywa zasoby Foundry
i wdrożenia za pomocą Azure CLI, a następnie zapisuje wybraną nazwę wdrożenia w
konfiguracji modelu.

OpenClaw używa punktu końcowego Foundry `/openai/v1` dla obsługiwanych, zgodnych z OpenAI
interfejsów API czatu:

- Rodziny modeli GPT, `o*`, `computer-use-preview` i DeepSeek-V4 domyślnie używają
  `openai-responses`.
- MAI-DS-R1 i inne wdrożenia typu chat-completion używają `openai-completions`,
  chyba że skonfigurowano jawnie obsługiwany interfejs API.
- MAI-DS-R1 jest zapisywany jako obsługujący rozumowanie przez treść rozumowania, a nie
  przez `reasoning_effort`. Jego metadane kontekstu i tokenów wyjściowych wynoszą
  163 840 tokenów.

Wdrożenia Anthropic Claude w Microsoft Foundry używają kształtu API Anthropic Messages,
a nie zgodnego z OpenAI kształtu `/openai/v1`. Skonfiguruj je jako
niestandardowego dostawcę `anthropic-messages`, dopóki Plugin Microsoft Foundry nie otrzyma
natywnego środowiska uruchomieniowego Anthropic. Gdy nazwa wdrożenia Foundry różni się od
identyfikatora modelu Claude, ustaw `params.canonicalModelId` we wpisie modelu, aby OpenClaw
mógł stosować specyficzne dla modelu kontrakty przewodowe, poprawnie mapować `/think off` i
bezpiecznie zachowywać podpisane myślenie.

## Generowanie obrazów MAI

Plugin rejestruje `microsoft-foundry` dla `image_generate` z aktualnymi
modelami obrazów Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Użyj nazwy wdrożenia wdrożonego modelu obrazów MAI jako referencji modelu. Dostawca nie
deklaruje domyślnego modelu obrazów, ponieważ API MAI wymaga nazwy wdrożenia w polu
`model` żądania:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

Wywołania generowania tylko na podstawie promptu używają punktu końcowego generacji MAI Microsoft Foundry:
`/mai/v1/images/generations`. Edycje obrazów referencyjnych wywołują
`/mai/v1/images/edits` i są ograniczone do wdrożeń `MAI-Image-2.5-Flash` oraz
`MAI-Image-2.5`.

Generowanie tylko na podstawie promptu może używać niestandardowej nazwy wdrożenia przy skonfigurowanym wyłącznie
punkcie końcowym Foundry. W przypadku edycji obrazów z niestandardową nazwą wdrożenia wybierz
wdrożenie podczas konfiguracji początkowej albo dołącz metadane modelu, aby OpenClaw mógł sprawdzić,
że wdrożenie jest oparte na `MAI-Image-2.5-Flash` lub `MAI-Image-2.5`.

Ograniczenia obrazów MAI:

- Wynik: jeden obraz PNG na żądanie.
- Rozmiar: domyślnie `1024x1024`; zarówno szerokość, jak i wysokość muszą wynosić co najmniej 768 px.
- Łączna liczba pikseli: szerokość × wysokość musi wynosić maksymalnie 1 048 576.
- Edycje: jeden obraz wejściowy PNG lub JPEG.
- Nieobsługiwane współdzielone wskazówki, takie jak `aspectRatio`, `resolution`, `quality`,
  `background` i `outputFormat` inne niż PNG, nie są wysyłane do Microsoft Foundry.

## Rozwiązywanie problemów

- `az: command not found`: zainstaluj Azure CLI albo użyj uwierzytelniania kluczem API.
- `Microsoft Foundry endpoint missing for MAI image generation`: wybierz
  wdrożenie Foundry podczas konfiguracji początkowej albo dodaj `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: wybrany model obrazów wskazuje na
  wdrożenie inne niż MAI. Użyj wdrożonego modelu obrazów MAI dla `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
