---
read_when:
    - Vuoi la generazione di contenuti multimediali Vydra in OpenClaw
    - Hai bisogno di indicazioni per configurare la chiave API di Vydra
summary: Usa immagini, video e voce di Vydra in OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-12T07:27:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Il Plugin Vydra incluso aggiunge:

- Generazione di immagini tramite `vydra/grok-imagine`
- Generazione di video tramite `vydra/veo3` (da testo a video) e `vydra/kling` (da immagine a video)
- Sintesi vocale tramite il percorso TTS di Vydra basato su ElevenLabs

OpenClaw utilizza la stessa `VYDRA_API_KEY` per tutte e tre le funzionalità.

| Proprietà             | Valore                                                                    |
| --------------------- | ------------------------------------------------------------------------- |
| ID del provider       | `vydra`                                                                   |
| Plugin                | incluso, `enabledByDefault: true`                                          |
| Variabile d'ambiente per l'autenticazione | `VYDRA_API_KEY`                                          |
| Flag di configurazione iniziale | `--auth-choice vydra-api-key`                                    |
| Flag CLI diretto      | `--vydra-api-key <key>`                                                    |
| Contratti             | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL di base           | `https://www.vydra.ai/api/v1` (utilizzare l'host `www`)                    |

<Warning>
Utilizzare `https://www.vydra.ai/api/v1` come URL di base. L'host radice di Vydra (`https://vydra.ai/api/v1`) attualmente reindirizza a `www`. Alcuni client HTTP omettono `Authorization` durante questo reindirizzamento tra host, trasformando una chiave API valida in un fuorviante errore di autenticazione. Per evitarlo, il Plugin incluso normalizza qualsiasi URL di base `vydra.ai` configurato in `www.vydra.ai`.
</Warning>

## Configurazione

<Steps>
  <Step title="Eseguire la configurazione iniziale interattiva">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    In alternativa, impostare direttamente la variabile d'ambiente:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Scegliere una funzionalità predefinita">
    Scegliere una o più delle funzionalità seguenti (immagine, video o voce) e applicare la configurazione corrispondente.
  </Step>
</Steps>

## Funzionalità

<AccordionGroup>
  <Accordion title="Generazione di immagini">
    Modello di immagini predefinito e unico incluso:

    - `vydra/grok-imagine`

    Impostarlo come provider di immagini predefinito:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    Il supporto incluso consente esclusivamente la generazione da testo a immagine, con al massimo un'immagine per richiesta. I percorsi di modifica ospitati da Vydra richiedono URL di immagini remote e il Plugin incluso non aggiunge un bridge di caricamento specifico per Vydra.

    <Note>
    Consultare [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Generazione di video">
    Modelli video registrati:

    - `vydra/veo3` per la generazione da testo a video (rifiuta gli input con immagini di riferimento)
    - `vydra/kling` per la generazione da immagine a video (richiede esattamente un URL di immagine remota)

    Impostare Vydra come provider video predefinito:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Note:

    - `vydra/kling` rifiuta immediatamente il caricamento di file locali; funziona solo un riferimento a un URL di immagine remota.
    - Il percorso HTTP `kling` di Vydra ha mostrato incoerenze riguardo alla necessità di `image_url` o `video_url`; il provider incluso invia lo stesso URL dell'immagine remota in entrambi i campi.
    - Il Plugin incluso adotta un approccio prudente e non inoltra opzioni di stile non documentate, come proporzioni, risoluzione, filigrana o audio generato.

    <Note>
    Consultare [Generazione di video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Test live dei video">
    Copertura live specifica del provider:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Il file live di Vydra incluso copre:

    - Generazione da testo a video con `vydra/veo3`
    - Generazione da immagine a video con `vydra/kling` utilizzando un URL di immagine remota

    Sovrascrivere il fixture dell'immagine remota quando necessario:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Sintesi vocale">
    Impostare Vydra come provider vocale:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Valori predefiniti:

    - Modello: `elevenlabs/tts`
    - ID voce: `21m00Tcm4TlvDq8ikWAM` ("Rachel")

    Il Plugin incluso espone questa singola voce predefinita di comprovata affidabilità e restituisce file audio MP3.

  </Accordion>
</AccordionGroup>

## Risorse correlate

<CardGroup cols={2}>
  <Card title="Directory dei provider" href="/it/providers/index" icon="list">
    Esplorare tutti i provider disponibili.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento per immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento per video e selezione del provider.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Valori predefiniti degli agenti e configurazione dei modelli.
  </Card>
</CardGroup>
