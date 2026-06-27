---
read_when:
    - Vuoi usare la generazione di immagini fal in OpenClaw
    - È necessario il flusso di autenticazione FAL_KEY
    - Vuoi i valori predefiniti di fal per image_generate, video_generate o music_generate
summary: Configurazione della generazione di immagini, video e musica fal in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:06:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw include un provider `fal` integrato per la generazione ospitata di
immagini, video e musica.

| Proprietà      | Valore                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| Provider       | `fal`                                                                   |
| Autenticazione | `FAL_KEY` (canonico; `FAL_API_KEY` funziona anche come fallback)        |
| API            | endpoint dei modelli fal                                                |

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

Il provider integrato `fal` per la generazione di immagini usa come valore
predefinito `fal/fal-ai/flux/dev`.

| Funzionalità       | Valore                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| Immagini massime   | 4 per richiesta; Krea 2: 1 per richiesta                                |
| Modalità modifica  | Flux: 1 immagine di riferimento; GPT Image 2: 10; Nano Banana 2: 14     |
| Rif. di stile      | Krea 2: fino a 10 riferimenti di stile tramite `image` / `images`       |
| Override dimensione| Supportati                                                              |
| Proporzioni        | Supportate per generazione, Krea 2 e modifica GPT Image 2/Nano Banana 2 |
| Risoluzione        | Supportata                                                              |
| Formato di output  | `png` o `jpeg`                                                          |

<Warning>
Le richieste Flux da immagine a immagine **non** supportano override di
`aspectRatio`. Le richieste di modifica GPT Image 2 e Nano Banana 2 usano
l'endpoint `/edit` di fal e accettano suggerimenti sulle proporzioni. Nano
Banana 2 accetta anche rapporti larghi/alti extra nativi come `4:1`, `1:4`,
`8:1` e `1:8`; Krea 2 convalida il proprio sottoinsieme più ristretto di
proporzioni.
</Warning>

I modelli Krea 2 usano lo schema di payload Krea nativo di fal. OpenClaw invia
`aspect_ratio`, `creativity` e `image_style_references` invece del payload
generico `image_size` / endpoint di modifica usato da Flux. I riferimenti dei
modelli sono:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Usa Medium per illustrazioni espressive, anime, pittura e stili artistici più
rapidi. Usa Large per risultati fotorealistici più lenti, texture grezze,
grana cinematografica e aspetti dettagliati. Krea usa come predefinito
`fal.creativity: "medium"`; i valori supportati sono `raw`, `low`, `medium` e
`high`.

Krea 2 espone le proporzioni, non `image_size`, nello schema di richiesta di
fal. Preferisci `aspectRatio`; OpenClaw mappa `size` alle proporzioni Krea
supportate più vicine e rifiuta `resolution` per Krea invece di ignorarla.

Usa `outputFormat: "png"` quando vuoi output PNG dai modelli fal che espongono
`output_format`. fal non dichiara in OpenClaw un controllo esplicito dello
sfondo trasparente, quindi `background: "transparent"` viene segnalato come
override ignorato per i modelli fal.
Gli endpoint Krea 2 non espongono un campo di richiesta `output_format` tramite
fal, quindi OpenClaw rifiuta gli override `outputFormat` per le richieste Krea.

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

Per usare Krea 2 Medium:

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

## Generazione di video

Il provider integrato `fal` per la generazione di video usa come valore
predefinito `fal/fal-ai/minimax/video-01-live`.

| Funzionalità | Valore                                                            |
| ------------ | ----------------------------------------------------------------- |
| Modalità     | Da testo a video, riferimento a immagine singola, Seedance da riferimento a video |
| Runtime      | Flusso invio/stato/risultato basato su coda per job a lunga esecuzione |

<AccordionGroup>
  <Accordion title="Modelli video disponibili">
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

  <Accordion title="Esempio di configurazione da riferimento a video Seedance 2.0">
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

    Da riferimento a video accetta fino a 9 immagini, 3 video e 3 riferimenti
    audio tramite i parametri condivisi `video_generate` `images`, `videos` e
    `audioRefs`, con al massimo 12 file di riferimento totali.

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

## Generazione di musica

Il Plugin integrato `fal` registra anche un provider di generazione musicale per
lo strumento condiviso `music_generate`.

| Funzionalità      | Valore                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Modello predefinito | `fal/fal-ai/minimax-music/v2.6`                                                                       |
| Modelli           | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Runtime           | Richiesta sincrona più download dell'audio generato                                                     |

Usa fal come provider musicale predefinito:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` supporta testi espliciti e modalità strumentale.
ACE-Step e Stable Audio sono endpoint da prompt ad audio; sceglili con
l'override `model` quando vuoi quelle famiglie di modelli.

<Tip>
Usa `openclaw models list --provider fal` per vedere l'elenco completo dei
modelli fal disponibili, incluse eventuali voci aggiunte di recente.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento musica e selezione del provider.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Valori predefiniti degli agenti, inclusa la selezione dei modelli di immagini, video e musica.
  </Card>
</CardGroup>
