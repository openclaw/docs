---
read_when:
    - Instalujesz, konfigurujesz lub audytujesz plugin microsoft-foundry
summary: Dodaje obsługę dostawcy modeli Microsoft Foundry w OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-07-12T15:23:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Dodaje do OpenClaw obsługę dostawcy modeli Microsoft Foundry.

## Dystrybucja

- Pakiet: `@openclaw/microsoft-foundry`
- Sposób instalacji: dołączony do OpenClaw

## Interfejs

dostawcy: microsoft-foundry; kontrakty: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Dostawca generowania obrazów: `microsoft-foundry`

## Wymagania

- Zasób Microsoft Foundry lub Azure AI Foundry z wdrożeniami.
- Uwierzytelnianie kluczem API za pomocą `AZURE_OPENAI_API_KEY` lub skonfigurowanego klucza API dostawcy.
- W przypadku uwierzytelniania Entra ID zainstaluj Azure CLI i przed
  konfiguracją początkową uruchom `az login`. OpenClaw odświeża tokeny środowiska wykonawczego Microsoft Foundry za pomocą
  `az account get-access-token`.

## Modele czatu

Wdrożenia czatu Microsoft Foundry używają odwołania do modelu dostawcy
`microsoft-foundry/<deployment-name>`. Podczas konfiguracji początkowej zasoby
i wdrożenia Foundry są wykrywane za pomocą Azure CLI, a następnie nazwa wybranego wdrożenia jest zapisywana
w konfiguracji modelu.

OpenClaw używa punktu końcowego Foundry `/openai/v1` dla obsługiwanych interfejsów API czatu
zgodnych z OpenAI:

- Rodziny modeli GPT, `o*`, `computer-use-preview` i DeepSeek-V4 domyślnie używają
  `openai-responses`.
- Wdrożenia MAI-DS-R1 i inne wdrożenia uzupełniania czatu używają `openai-completions`,
  chyba że skonfigurowano jawnie obsługiwany interfejs API.
- MAI-DS-R1 jest rejestrowany jako model obsługujący rozumowanie na podstawie treści rozumowania, a nie
  parametru `reasoning_effort`. Metadane jego kontekstu i tokenów wyjściowych wynoszą
  163 840 tokenów.

Wdrożenia Anthropic Claude w Microsoft Foundry używają formatu
interfejsu API Anthropic Messages, a nie zgodnego z OpenAI formatu `/openai/v1`. Skonfiguruj je jako
niestandardowego dostawcę `anthropic-messages`, dopóki Plugin Microsoft Foundry nie uzyska
natywnego środowiska wykonawczego Anthropic. Jeśli nazwa wdrożenia Foundry różni się od
identyfikatora modelu Claude, ustaw `params.canonicalModelId` we wpisie modelu, aby OpenClaw
mógł stosować kontrakty transmisji właściwe dla modelu, poprawnie mapować `/think off` i
bezpiecznie zachowywać podpisane rozumowanie.

## Generowanie obrazów MAI

Plugin rejestruje `microsoft-foundry` dla `image_generate` z bieżącymi
modelami obrazów Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Jako odwołania do modelu użyj nazwy wdrożonego wdrożenia obrazów MAI. Dostawca
nie deklaruje domyślnego modelu obrazów, ponieważ interfejs API MAI wymaga nazwy wdrożenia
w polu `model` żądania:

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

Generowanie wyłącznie na podstawie monitu wywołuje punkt końcowy generowania MAI w Microsoft Foundry:
`/mai/v1/images/generations`. Edycje z obrazem referencyjnym wywołują
`/mai/v1/images/edits` i są ograniczone do wdrożeń `MAI-Image-2.5-Flash` oraz
`MAI-Image-2.5`.

Generowanie wyłącznie na podstawie monitu może używać niestandardowej nazwy wdrożenia, jeśli skonfigurowano tylko punkt końcowy
Foundry. W przypadku edycji obrazów z niestandardową nazwą wdrożenia wybierz
wdrożenie podczas konfiguracji początkowej lub dołącz metadane modelu, aby OpenClaw mógł zweryfikować,
że wdrożenie korzysta z `MAI-Image-2.5-Flash` lub `MAI-Image-2.5`.

Ograniczenia obrazów MAI:

- Dane wyjściowe: jeden obraz PNG na żądanie.
- Rozmiar: domyślnie `1024x1024`; zarówno szerokość, jak i wysokość muszą wynosić co najmniej 768 px.
- Łączna liczba pikseli: szerokość × wysokość nie może przekraczać 1 048 576.
- Edycje: jeden wejściowy obraz PNG lub JPEG.
- Nieobsługiwane współdzielone wskazówki, takie jak `aspectRatio`, `resolution`, `quality`,
  `background` oraz `outputFormat` inny niż PNG, nie są wysyłane do Microsoft Foundry.

## Rozwiązywanie problemów

- `az: command not found`: zainstaluj Azure CLI lub użyj uwierzytelniania kluczem API.
- `Microsoft Foundry endpoint missing for MAI image generation`: wybierz
  wdrożenie Foundry podczas konfiguracji początkowej lub dodaj `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: wybrany model obrazów wskazuje
  wdrożenie inne niż MAI. Użyj wdrożonego modelu obrazów MAI dla `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
