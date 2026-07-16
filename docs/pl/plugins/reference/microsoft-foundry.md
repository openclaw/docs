---
read_when:
    - Instalowanie, konfigurowanie lub audytowanie pluginu microsoft-foundry
summary: Dodaje obsługę dostawcy modeli Microsoft Foundry w OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-07-16T18:57:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ea554ce16cffeb4cc315e53d986d6f07b5e113fbb844c61c6575f19f8ad291
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Dodaje do OpenClaw obsługę dostawcy modeli Microsoft Foundry.

## Dystrybucja

- Pakiet: `@openclaw/microsoft-foundry`
- Sposób instalacji: zawarty w OpenClaw

## Powierzchnia

dostawcy: `microsoft-foundry`; kontrakty: `imageGenerationProviders`

<!-- openclaw-plugin-reference:manual-start -->

- Dostawca generowania obrazów: `microsoft-foundry`

## Wymagania

- Zasób Microsoft Foundry lub Azure AI Foundry z wdrożeniami.
- Uwierzytelnianie kluczem API przez `AZURE_OPENAI_API_KEY` lub skonfigurowany klucz API dostawcy.
- W przypadku uwierzytelniania Entra ID należy zainstalować Azure CLI i uruchomić `az login` przed
  konfiguracją początkową. OpenClaw odświeża tokeny środowiska uruchomieniowego Microsoft Foundry za pomocą
  `az account get-access-token`.

## Modele czatu

Wdrożenia czatu Microsoft Foundry używają odwołania do modelu dostawcy
`microsoft-foundry/<deployment-name>`. Podczas konfiguracji początkowej zasoby Foundry
i wdrożenia są wykrywane za pomocą Azure CLI, a następnie nazwa wybranego wdrożenia jest zapisywana
w konfiguracji modelu.

OpenClaw używa punktu końcowego Foundry `/openai/v1` dla obsługiwanych interfejsów API czatu
zgodnych z OpenAI:

- Rodziny modeli GPT, `o*`, `computer-use-preview` i DeepSeek-V4 domyślnie używają
  `openai-responses`.
- MAI-DS-R1 i inne wdrożenia uzupełniania czatu używają `openai-completions`,
  chyba że skonfigurowano jawnie obsługiwany interfejs API.
- MAI-DS-R1 jest rejestrowany jako model obsługujący rozumowanie za pośrednictwem treści rozumowania, a nie
  przez `reasoning_effort`. Metadane jego kontekstu i tokenów wyjściowych wynoszą
  163,840 tokenów.

Wdrożenia Anthropic Claude w Microsoft Foundry używają formatu interfejsu API Anthropic Messages,
a nie zgodnego z OpenAI formatu `/openai/v1`. Należy skonfigurować je jako
niestandardowego dostawcę `anthropic-messages`, dopóki Plugin Microsoft Foundry nie otrzyma
natywnego środowiska uruchomieniowego Anthropic. Jeśli nazwa wdrożenia Foundry różni się od
identyfikatora modelu Claude, należy ustawić `params.canonicalModelId` we wpisie modelu, aby OpenClaw
mógł zastosować kontrakty transmisji specyficzne dla modelu, prawidłowo mapować `/think off` i
bezpiecznie zachowywać podpisane rozumowanie.

## Generowanie obrazów MAI

Plugin rejestruje `microsoft-foundry` dla `image_generate` z bieżącymi
modelami obrazów Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Jako odwołania do modelu należy użyć nazwy wdrożonego wdrożenia obrazów MAI. Dostawca
nie deklaruje domyślnego modelu obrazów, ponieważ interfejs API MAI wymaga nazwy wdrożenia
w polu żądania `model`:

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

Generowanie wyłącznie na podstawie monitu wywołuje punkt końcowy generowania MAI usługi Microsoft Foundry:
`/mai/v1/images/generations`. Edycje z obrazem referencyjnym wywołują
`/mai/v1/images/edits` i są ograniczone do wdrożeń `MAI-Image-2.5-Flash` oraz
`MAI-Image-2.5`.

Generowanie wyłącznie na podstawie monitu może używać niestandardowej nazwy wdrożenia, jeśli skonfigurowany
jest tylko punkt końcowy Foundry. W przypadku edycji obrazów z niestandardową nazwą wdrożenia należy wybrać
wdrożenie podczas konfiguracji początkowej lub dołączyć metadane modelu, aby OpenClaw mógł sprawdzić,
czy wdrożenie jest oparte na `MAI-Image-2.5-Flash` lub `MAI-Image-2.5`.

Ograniczenia obrazów MAI:

- Dane wyjściowe: jeden obraz PNG na żądanie.
- Rozmiar: domyślnie `1024x1024`; zarówno szerokość, jak i wysokość muszą wynosić co najmniej 768 px.
- Łączna liczba pikseli: szerokość × wysokość może wynosić najwyżej 1,048,576.
- Edycje: jeden wejściowy obraz PNG lub JPEG.
- Nieobsługiwane wspólne wskazówki, takie jak `aspectRatio`, `resolution`, `quality`,
  `background` oraz formaty `outputFormat` inne niż PNG nie są wysyłane do Microsoft Foundry.

## Rozwiązywanie problemów

- `az: command not found`: należy zainstalować Azure CLI lub użyć uwierzytelniania kluczem API.
- `Microsoft Foundry endpoint missing for MAI image generation`: należy wybrać
  wdrożenie Foundry podczas konfiguracji początkowej lub dodać `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: wybrany model obrazów wskazuje
  wdrożenie inne niż MAI. Dla `image_generate` należy użyć wdrożonego modelu obrazów MAI.

<!-- openclaw-plugin-reference:manual-end -->
