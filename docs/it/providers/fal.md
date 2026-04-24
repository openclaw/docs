---
read_when:
    - Vuoi usare la generazione di immagini fal in OpenClaw
    - Hai bisogno del flusso auth `FAL_KEY`
    - Vuoi valori predefiniti fal per `image_generate` o `video_generate`
summary: Configurazione della generazione di immagini e video fal in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-24T08:56:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw include un provider `fal` integrato per la generazione ospitata di immagini e video.

| Property | Value                                                         |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| Auth     | `FAL_KEY` (canonico; `FAL_API_KEY` funziona anche come fallback) |
| API      | endpoint dei modelli fal                                      |

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Imposta un modello immagine predefinito">
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

## Generazione di immagini

Il provider di generazione immagini `fal` integrato usa come predefinito
`fal/fal-ai/flux/dev`.

| Capability     | Value                      |
| -------------- | -------------------------- |
| Immagini massime | 4 per richiesta          |
| Modalità modifica | Abilitata, 1 immagine di riferimento |
| Override dimensione | Supportati             |
| Aspect ratio   | Supportato                 |
| Risoluzione    | Supportata                 |

<Warning>
L'endpoint fal di modifica delle immagini **non** supporta override di `aspectRatio`.
</Warning>

Per usare fal come provider immagine predefinito:

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

## Generazione video

Il provider di generazione video `fal` integrato usa come predefinito
`fal/fal-ai/minimax/video-01-live`.

| Capability | Value                                                        |
| ---------- | ------------------------------------------------------------ |
| Modalità   | Text-to-video, riferimento a immagine singola                |
| Runtime    | Flusso submit/status/result basato su coda per job di lunga durata |

<AccordionGroup>
  <Accordion title="Modelli video disponibili">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Esempio di configurazione Seedance 2.0">
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

  <Accordion title="Esempio di configurazione HeyGen video-agent">
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
Usa `openclaw models list --provider fal` per vedere l'elenco completo dei modelli fal
disponibili, incluse eventuali voci aggiunte di recente.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Valori predefiniti dell'agente, inclusa la selezione del modello immagine e video.
  </Card>
</CardGroup>
