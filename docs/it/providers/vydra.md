---
read_when:
    - Vuoi usare la generazione media Vydra in OpenClaw
    - Ti serve una guida per la configurazione della API key Vydra
summary: Usa immagini, video e voce Vydra in OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-24T08:59:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

Il Plugin Vydra integrato aggiunge:

- Generazione di immagini tramite `vydra/grok-imagine`
- Generazione video tramite `vydra/veo3` e `vydra/kling`
- Sintesi vocale tramite il percorso TTS di Vydra basato su ElevenLabs

OpenClaw usa la stessa `VYDRA_API_KEY` per tutte e tre le capability.

<Warning>
Usa `https://www.vydra.ai/api/v1` come URL base.

L'host apex di Vydra (`https://vydra.ai/api/v1`) attualmente reindirizza a `www`. Alcuni client HTTP eliminano `Authorization` su quel redirect tra host diversi, trasformando una API key valida in un errore di autenticazione fuorviante. Il Plugin integrato usa direttamente l'URL base `www` per evitare questo problema.
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
  <Step title="Scegli una capability predefinita">
    Scegli una o più delle capability sotto (immagine, video o voce) e applica la configurazione corrispondente.
  </Step>
</Steps>

## Capability

<AccordionGroup>
  <Accordion title="Generazione di immagini">
    Modello immagine predefinito:

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

    Il supporto integrato attuale è solo text-to-image. I percorsi edit ospitati di Vydra si aspettano URL immagine remoti, e OpenClaw non aggiunge ancora un bridge di upload specifico Vydra nel Plugin integrato.

    <Note>
    Vedi [Image Generation](/it/tools/image-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Generazione video">
    Modelli video registrati:

    - `vydra/veo3` per text-to-video
    - `vydra/kling` per image-to-video

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

    - `vydra/veo3` è integrato solo come text-to-video.
    - `vydra/kling` attualmente richiede un riferimento URL immagine remoto. Gli upload di file locali vengono rifiutati subito.
    - L'attuale percorso HTTP `kling` di Vydra è stato incoerente nel richiedere `image_url` o `video_url`; il provider integrato mappa lo stesso URL immagine remoto in entrambi i campi.
    - Il Plugin integrato resta conservativo e non inoltra parametri di stile non documentati come aspect ratio, risoluzione, watermark o audio generato.

    <Note>
    Vedi [Video Generation](/it/tools/video-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Test video live">
    Copertura live specifica del provider:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Il file live Vydra integrato ora copre:

    - `vydra/veo3` text-to-video
    - `vydra/kling` image-to-video usando un URL immagine remoto

    Sovrascrivi il fixture dell'immagine remota quando necessario:

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
    - Voice id: `21m00Tcm4TlvDq8ikWAM`

    Il Plugin integrato attualmente espone una voce predefinita nota e restituisce file audio MP3.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Directory dei provider" href="/it/providers/index" icon="list">
    Sfoglia tutti i provider disponibili.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Valori predefiniti dell'agente e configurazione del modello.
  </Card>
</CardGroup>
