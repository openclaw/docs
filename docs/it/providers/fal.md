---
read_when:
    - Vuoi usare la generazione di immagini fal in OpenClaw
    - È necessario il flusso di autenticazione FAL_KEY
    - Vuoi i valori predefiniti di fal per image_generate o video_generate
summary: Configurazione della generazione di immagini e video con fal in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:33:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw include un provider `fal` in bundle per la generazione ospitata di immagini e video.

| Proprietà | Valore                                                        |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| Autenticazione | `FAL_KEY` (canonico; `FAL_API_KEY` funziona anche come fallback) |
| API      | endpoint dei modelli fal                                      |

## Per iniziare

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

## Generazione di immagini

Il provider di generazione di immagini `fal` in bundle usa come impostazione predefinita
`fal/fal-ai/flux/dev`.

| Funzionalità        | Valore                                                            |
| -------------- | ----------------------------------------------------------- |
| Immagini massime | 4 per richiesta                                             |
| Modalità di modifica | Flux: 1 immagine di riferimento; GPT Image 2: 10; Nano Banana 2: 14 |
| Override delle dimensioni | Supportati                                           |
| Proporzioni   | Supportate per generate e per la modifica con GPT Image 2/Nano Banana 2 |
| Risoluzione    | Supportata                                                  |
| Formato di output | `png` o `jpeg`                                           |

<Warning>
Le richieste image-to-image Flux **non** supportano gli override `aspectRatio`. Le richieste di modifica GPT
Image 2 e Nano Banana 2 usano l'endpoint `/edit` di fal e accettano
suggerimenti sulle proporzioni.
</Warning>

Usa `outputFormat: "png"` quando vuoi output PNG. fal non dichiara un
controllo esplicito dello sfondo trasparente in OpenClaw, quindi `background:
"transparent"` viene segnalato come override ignorato per i modelli fal.

Per usare fal come provider di immagini predefinito:

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

## Generazione di video

Il provider di generazione di video `fal` in bundle usa come impostazione predefinita
`fal/fal-ai/minimax/video-01-live`.

| Funzionalità | Valore                                                              |
| ---------- | ------------------------------------------------------------------ |
| Modalità   | Da testo a video, riferimento a immagine singola, da riferimento Seedance a video |
| Runtime    | Flusso submit/status/result basato su coda per processi di lunga durata |

<AccordionGroup>
  <Accordion title="Available video models">
    **video-agent HeyGen:**

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

    Reference-to-video accetta fino a 9 immagini, 3 video e 3 riferimenti audio
    tramite i parametri condivisi `video_generate` `images`, `videos` e `audioRefs`,
    con un massimo di 12 file di riferimento totali.

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
Usa `openclaw models list --provider fal` per vedere l'elenco completo dei modelli fal
disponibili, incluse eventuali voci aggiunte di recente.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Image generation" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Video generation" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Impostazioni predefinite degli agenti, inclusa la selezione dei modelli di immagine e video.
  </Card>
</CardGroup>
