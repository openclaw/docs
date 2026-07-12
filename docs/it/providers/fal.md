---
read_when:
    - Vuoi usare la generazione di immagini di fal in OpenClaw
    - Hai bisogno del flusso di autenticazione FAL_KEY
    - Vuoi i valori predefiniti di fal per image_generate, video_generate o music_generate
summary: configurazione della generazione di immagini, video e musica con fal in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-12T07:24:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw include un provider `fal` integrato per la generazione in hosting di
immagini, video e musica.

| Proprietà | Valore                                                                          |
| --------- | ------------------------------------------------------------------------------- |
| Provider  | `fal`                                                                           |
| Autenticazione | `FAL_KEY` (canonica; anche `FAL_API_KEY` funziona come ripiego)            |
| API       | Endpoint dei modelli fal (`https://fal.run`; i processi video usano `https://queue.fal.run`) |
| URL di base | Sovrascrivibile con `models.providers.fal.baseUrl`                            |

## Per iniziare

<Steps>
  <Step title="Impostare la chiave API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    Le configurazioni non interattive possono passare `--fal-api-key <key>` o esportare `FAL_KEY`.
    L'onboarding imposta inoltre `fal/fal-ai/flux/dev` come modello di immagini predefinito quando
    non ne è configurato alcuno.

  </Step>
  <Step title="Impostare un modello di immagini predefinito">
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

Il provider integrato `fal` per la generazione di immagini usa come valore predefinito
`fal/fal-ai/flux/dev`.

| Funzionalità              | Valore                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| Numero massimo di immagini | 4 per richiesta; Krea 2: 1 per richiesta                          |
| Sostituzioni delle dimensioni | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024` |
| Proporzioni               | Supportate ovunque tranne che per la conversione da immagine a immagine di Flux |
| Risoluzione               | `1K`, `2K`, `4K` (limiti per modello riportati di seguito)         |
| Formato di output         | `png` (predefinito) o `jpeg`; Krea 2 rifiuta le sostituzioni di `outputFormat` |

Le richieste di modifica (immagini di riferimento tramite i parametri condivisi `image` / `images`)
vengono instradate a un endpoint di modifica specifico per modello, con limiti di riferimenti specifici per modello:

| Famiglia di modelli       | Riferimento del modello dopo `fal/`      | Endpoint di modifica | Numero massimo di immagini di riferimento |
| ------------------------- | ---------------------------------------- | -------------------- | ----------------------------------------- |
| Flux e altri modelli fal  | `fal-ai/flux/dev` (predefinito)          | `/image-to-image`    | 1                                         |
| GPT Image                 | `openai/gpt-image-*`                     | `/edit`              | 10                                        |
| Grok Imagine              | `xai/grok-imagine-image`                 | `/edit`              | 3                                         |
| Nano Banana (precedente)  | `fal-ai/nano-banana`                     | `/edit`              | 3                                         |
| Nano Banana 2             | `fal-ai/nano-banana-*`                   | `/edit`              | 14                                        |
| Nano Banana 2 Lite        | `google/nano-banana-2-lite`              | `/edit`              | 14                                        |
| Krea 2                    | `krea/v2/{medium,large}/text-to-image`   | nessuno (riferimenti di stile) | 10 riferimenti di stile          |

<Warning>
Le richieste di conversione da immagine a immagine di Flux **non** supportano le sostituzioni di `aspectRatio`. Le richieste di modifica di GPT
Image e Nano Banana 2 usano l'endpoint `/edit` di fal e accettano
indicazioni sulle proporzioni. Nano Banana 2 accetta inoltre proporzioni larghe/alte
native aggiuntive come `4:1`, `1:4`, `8:1` e `1:8`; Krea 2 convalida un proprio sottoinsieme più ristretto
di proporzioni. Grok Imagine dispone di un proprio elenco di proporzioni (che include `2:1`,
`20:9`, `19.5:9` e le rispettive inverse) e accetta solo risoluzioni `1K`/`2K`;
Nano Banana precedente e Nano Banana 2 Lite rifiutano le sostituzioni di `resolution`.
</Warning>

I modelli Krea 2 usano lo schema nativo del payload Krea di fal. OpenClaw invia
`aspect_ratio`, `creativity` e `image_style_references` invece del
payload generico `image_size` / dell'endpoint di modifica usato da Flux. I riferimenti dei modelli sono:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Usare Medium per illustrazioni espressive, anime, dipinti e stili artistici
più rapidi. Usare Large per risultati fotorealistici più lenti, texture grezze, grana della pellicola e aspetti
dettagliati. Il valore predefinito di Krea è `fal.creativity: "medium"`; i valori supportati sono
`raw`, `low`, `medium` e `high`.

Krea 2 espone le proporzioni, non `image_size`, nello schema delle richieste di fal. È preferibile usare
`aspectRatio`; OpenClaw associa `size` alle proporzioni Krea supportate più vicine
e rifiuta `resolution` per Krea anziché ignorarla.

Usare `outputFormat: "png"` quando si desidera un output PNG dai modelli fal che espongono
`output_format`. fal non dichiara in OpenClaw un controllo esplicito per lo sfondo trasparente,
pertanto `background: "transparent"` viene segnalato come sostituzione ignorata
per i modelli fal.
Gli endpoint Krea 2 non espongono un campo di richiesta `output_format` tramite fal, quindi
OpenClaw rifiuta le sostituzioni di `outputFormat` per le richieste Krea.

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

Il provider integrato `fal` per la generazione di video usa come valore predefinito
`fal/fal-ai/minimax/video-01-live`.

| Funzionalità | Valore                                                              |
| ------------ | ------------------------------------------------------------------- |
| Modalità     | Da testo a video, riferimento a immagine singola, da riferimento a video con Seedance |
| Esecuzione   | Flusso di invio/stato/risultato basato su coda per processi di lunga durata |
| Timeout      | 20 minuti per processo per impostazione predefinita; stato verificato ogni 5 secondi |

<AccordionGroup>
  <Accordion title="Modelli video disponibili">
    **MiniMax (predefinito):**

    - `fal/fal-ai/minimax/video-01-live`

    **Agente video HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling e Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    Le richieste MiniMax Live e HeyGen inviano solo il prompt più un'eventuale
    singola immagine di riferimento; le altre sostituzioni non vengono inoltrate. I modelli Seedance
    accettano `aspectRatio`, `size`, `resolution`, durate da 4 a 15 secondi e
    un'opzione per l'audio.

  </Accordion>

  <Accordion title="Esempio di configurazione di Seedance 2.0">
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

  <Accordion title="Esempio di configurazione da riferimento a video di Seedance 2.0">
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

    La modalità da riferimento a video accetta fino a 9 immagini, 3 video e 3 riferimenti audio
    tramite i parametri condivisi `images`, `videos` e `audioRefs` di `video_generate`,
    con un massimo di 12 file di riferimento complessivi. I riferimenti audio richiedono
    almeno un riferimento a un'immagine o a un video nella stessa richiesta.

  </Accordion>

  <Accordion title="Esempio di configurazione dell'agente video HeyGen">
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

Il plugin integrato `fal` registra anche un provider per la generazione di musica per lo
strumento condiviso `music_generate`.

| Funzionalità       | Valore                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Modello predefinito | `fal/fal-ai/minimax-music/v2.6`                                                                                         |
| Modelli            | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| Durata massima     | 240 secondi                                                                                                              |
| Esecuzione         | Richiesta sincrona seguita dal download dell'audio generato                                                              |

Usare fal come provider musicale predefinito:

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

`fal-ai/minimax-music/v2.6` supporta testi espliciti e la modalità strumentale,
ma non entrambi nella stessa richiesta. ACE-Step e Stable Audio sono
endpoint da prompt ad audio; selezionarli con la sostituzione `model` quando si desiderano
queste famiglie di modelli. ACE-Step rifiuta i testi espliciti; Stable Audio rifiuta
sia i testi sia la modalità strumentale.

<Tip>
Le tabelle e le sezioni espandibili riportate sopra descrivono le famiglie di modelli per cui il provider fal
integrato applica una gestione specifica. È comunque possibile selezionare come modello di immagini altri ID di endpoint
di immagini fal; vengono trattati come Flux (payload generico `image_size`, un'immagine
di riferimento tramite `/image-to-image`).
</Tip>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento per le immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento per i video e selezione del provider.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento per la musica e selezione del provider.
  </Card>
  <Card title="Riferimento per la configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Valori predefiniti degli agenti, inclusa la selezione dei modelli per immagini, video e musica.
  </Card>
</CardGroup>
