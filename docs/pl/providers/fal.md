---
read_when:
    - Chcesz korzystać z generowania obrazów za pomocą fal w OpenClaw
    - Potrzebujesz przepływu uwierzytelniania FAL_KEY
    - Potrzebujesz domyślnych ustawień fal dla image_generate lub video_generate
summary: Konfiguracja generowania obrazów i wideo za pomocą fal w OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:36:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw zawiera dołączonego dostawcę `fal` do hostowanego generowania obrazów i wideo.

| Właściwość | Wartość                                                         |
| -------- | ------------------------------------------------------------- |
| Dostawca | `fal`                                                         |
| Uwierzytelnianie     | `FAL_KEY` (kanoniczne; `FAL_API_KEY` działa także jako opcja zapasowa) |
| API      | punkty końcowe modeli fal                                           |

## Pierwsze kroki

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Set a default image model">
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

| Możliwość     | Wartość                                                       |
| -------------- | ----------------------------------------------------------- |
| Maksymalna liczba obrazów     | 4 na żądanie                                               |
| Tryb edycji      | Flux: 1 obraz referencyjny; GPT Image 2: 10; Nano Banana 2: 14 |
| Nadpisania rozmiaru | Obsługiwane                                                   |
| Proporcje obrazu   | Obsługiwane dla generowania oraz edycji GPT Image 2/Nano Banana 2   |
| Rozdzielczość     | Obsługiwana                                                   |
| Format wyjściowy  | `png` lub `jpeg`                                             |

<Warning>
Żądania Flux image-to-image **nie** obsługują nadpisań `aspectRatio`. Żądania edycji GPT
Image 2 i Nano Banana 2 używają punktu końcowego `/edit` fal i akceptują
wskazówki dotyczące proporcji obrazu.
</Warning>

Użyj `outputFormat: "png"`, gdy chcesz uzyskać wyjście PNG. fal nie deklaruje w OpenClaw
jawnej kontroli przezroczystego tła, więc `background:
"transparent"` jest zgłaszane jako zignorowane nadpisanie dla modeli fal.

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

| Możliwość | Wartość                                                              |
| ---------- | ------------------------------------------------------------------ |
| Tryby      | Text-to-video, referencja z pojedynczego obrazu, Seedance reference-to-video |
| Środowisko uruchomieniowe    | Przepływ przesyłania/statusu/wyniku oparty na kolejce dla długotrwałych zadań       |

<AccordionGroup>
  <Accordion title="Available video models">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 config example">
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

  <Accordion title="Seedance 2.0 reference-to-video config example">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Reference-to-video akceptuje do 9 obrazów, 3 wideo i 3 referencji audio
    za pośrednictwem wspólnych parametrów `video_generate` `images`, `videos` i `audioRefs`,
    z maksymalnie 12 plikami referencyjnymi łącznie.

  </Accordion>

  <Accordion title="HeyGen video-agent config example">
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
w tym wszelkie niedawno dodane pozycje.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Image generation" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Video generation" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agenta, w tym wybór modelu obrazu i wideo.
  </Card>
</CardGroup>
