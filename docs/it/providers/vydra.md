---
read_when:
    - Vuoi la generazione di contenuti multimediali Vydra in OpenClaw
    - Hai bisogno di indicazioni per configurare la chiave API di Vydra
summary: Usa Vydra per immagini, video e voce in OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-05-06T09:06:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

Il Plugin Vydra in bundle aggiunge:

- Generazione di immagini tramite `vydra/grok-imagine`
- Generazione di video tramite `vydra/veo3` e `vydra/kling`
- Sintesi vocale tramite la route TTS di Vydra basata su ElevenLabs

OpenClaw usa la stessa `VYDRA_API_KEY` per tutte e tre le capacità.

| Proprietà       | Valore                                                                    |
| --------------- | ------------------------------------------------------------------------- |
| ID provider     | `vydra`                                                                   |
| Plugin          | in bundle, `enabledByDefault: true`                                       |
| Variabile env auth | `VYDRA_API_KEY`                                                        |
| Flag di onboarding | `--auth-choice vydra-api-key`                                          |
| Flag CLI diretto | `--vydra-api-key <key>`                                                  |
| Contratti       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL base        | `https://www.vydra.ai/api/v1` (usa l'host `www`)                          |

<Warning>
  Usa `https://www.vydra.ai/api/v1` come URL base. L'host apex di Vydra (`https://vydra.ai/api/v1`) attualmente reindirizza a `www`. Alcuni client HTTP eliminano `Authorization` su quel reindirizzamento cross-host, trasformando una chiave API valida in un errore di autenticazione fuorviante. Il Plugin in bundle usa direttamente l'URL base `www` per evitarlo.
</Warning>

## Configurazione

<Steps>
  <Step title="Esegui l'onboarding interattivo">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Oppure imposta direttamente la variabile env:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Scegli una capacità predefinita">
    Scegli una o più delle capacità sotto (immagine, video o voce) e applica la configurazione corrispondente.
  </Step>
</Steps>

## Capacità

<AccordionGroup>
  <Accordion title="Generazione di immagini">
    Modello di immagini predefinito:

    - `vydra/grok-imagine`

    Impostalo come provider di immagini predefinito:

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

    Il supporto in bundle attuale è solo da testo a immagine. Le route di modifica ospitate da Vydra si aspettano URL di immagini remote, e OpenClaw non aggiunge ancora un bridge di upload specifico per Vydra nel Plugin in bundle.

    <Note>
    Consulta [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Generazione di video">
    Modelli video registrati:

    - `vydra/veo3` per testo-a-video
    - `vydra/kling` per immagine-a-video

    Imposta Vydra come provider video predefinito:

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

    - `vydra/veo3` è incluso in bundle solo come testo-a-video.
    - `vydra/kling` attualmente richiede un riferimento a un URL di immagine remota. I caricamenti di file locali vengono rifiutati in anticipo.
    - L'attuale route HTTP `kling` di Vydra è stata incoerente sul fatto che richieda `image_url` o `video_url`; il provider in bundle mappa lo stesso URL di immagine remota in entrambi i campi.
    - Il Plugin in bundle resta conservativo e non inoltra controlli di stile non documentati come proporzioni, risoluzione, watermark o audio generato.

    <Note>
    Consulta [Generazione di video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Test live video">
    Copertura live specifica del provider:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Il file live Vydra in bundle ora copre:

    - `vydra/veo3` testo-a-video
    - `vydra/kling` immagine-a-video usando un URL di immagine remota

    Sovrascrivi la fixture dell'immagine remota quando necessario:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Sintesi vocale">
    Imposta Vydra come provider vocale:

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
    - ID voce: `21m00Tcm4TlvDq8ikWAM`

    Il Plugin in bundle attualmente espone una voce predefinita nota e affidabile e restituisce file audio MP3.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Directory provider" href="/it/providers/index" icon="list">
    Sfoglia tutti i provider disponibili.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento per immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento per video e selezione del provider.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Valori predefiniti degli agenti e configurazione dei modelli.
  </Card>
</CardGroup>
