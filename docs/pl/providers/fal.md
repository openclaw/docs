---
read_when:
    - Chcesz używać generowania obrazów fal w OpenClaw
    - Potrzebujesz przepływu uwierzytelniania FAL_KEY
    - Chcesz domyślnych ustawień fal dla `image_generate` lub `video_generate`
summary: Konfiguracja generowania obrazów i wideo fal w OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-24T09:27:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw dostarcza dołączonego dostawcę `fal` do hostowanego generowania obrazów i wideo.

| Właściwość | Wartość                                                       |
| ---------- | ------------------------------------------------------------- |
| Dostawca   | `fal`                                                         |
| Uwierzytelnianie | `FAL_KEY` (kanoniczne; `FAL_API_KEY` działa również jako fallback) |
| API        | endpointy modeli fal                                          |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Ustaw domyślny model obrazu">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Generowanie obrazów

Dołączony dostawca generowania obrazów `fal` domyślnie używa
`fal/fal-ai/flux/dev`.

| Możliwość      | Wartość                    |
| -------------- | -------------------------- |
| Maks. liczba obrazów | 4 na żądanie              |
| Tryb edycji    | Włączony, 1 obraz referencyjny |
| Nadpisania rozmiaru | Obsługiwane              |
| Proporcje obrazu | Obsługiwane               |
| Rozdzielczość  | Obsługiwana                |

<Warning>
Endpoint edycji obrazów fal **nie** obsługuje nadpisań `aspectRatio`.
</Warning>

Aby używać fal jako domyślnego dostawcy obrazów:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Generowanie wideo

Dołączony dostawca generowania wideo `fal` domyślnie używa
`fal/fal-ai/minimax/video-01-live`.

| Możliwość | Wartość                                                        |
| ---------- | ------------------------------------------------------------ |
| Tryby      | Tekst na wideo, pojedynczy obraz referencyjny               |
| Runtime    | Przepływ submit/status/result oparty na kolejce dla długotrwałych zadań |

<AccordionGroup>
  <Accordion title="Dostępne modele wideo">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Przykład konfiguracji Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Przykład konfiguracji HeyGen video-agent">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
Użyj `openclaw models list --provider fal`, aby zobaczyć pełną listę dostępnych modeli fal,
w tym wszelkie niedawno dodane wpisy.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Dokumentacja referencyjna konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Ustawienia domyślne agenta, w tym wybór modelu obrazu i wideo.
  </Card>
</CardGroup>
