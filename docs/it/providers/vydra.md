---
read_when:
    - Vuoi la generazione di contenuti multimediali Vydra in OpenClaw
    - Ti serve una guida alla configurazione della chiave API Vydra
summary: Usare immagini, video e voce di Vydra in OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-06-27T18:10:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
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
| URL di base     | `https://www.vydra.ai/api/v1` (usa l'host `www`)                         |

<Warning>
  Usa `https://www.vydra.ai/api/v1` come URL di base. L'host apex di Vydra (`https://vydra.ai/api/v1`) attualmente reindirizza a `www`. Alcuni client HTTP eliminano `Authorization` in quel reindirizzamento cross-host, trasformando una chiave API valida in un errore di autenticazione fuorviante. Il Plugin in bundle usa direttamente l'URL di base `www` per evitarlo.
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
    Scegli una o più delle capacità seguenti (immagine, video o voce) e applica la configurazione corrispondente.
  </Step>
</Steps>

## Capacità

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

    Il supporto in bundle attuale è solo text-to-image. Le route di modifica ospitate da Vydra richiedono URL di immagini remote, e OpenClaw non aggiunge ancora un bridge di upload specifico per Vydra nel Plugin in bundle.

    <Note>
    Consulta [Generazione di immagini](/it/tools/image-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Generazione di video">
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

    - `vydra/veo3` è incluso in bundle solo come text-to-video.
    - `vydra/kling` attualmente richiede un riferimento URL a un'immagine remota. Gli upload di file locali vengono rifiutati in anticipo.
    - L'attuale route HTTP `kling` di Vydra è stata incoerente sul fatto che richieda `image_url` o `video_url`; il provider in bundle mappa lo stesso URL dell'immagine remota in entrambi i campi.
    - Il Plugin in bundle resta conservativo e non inoltra controlli di stile non documentati come proporzioni, risoluzione, watermark o audio generato.

    <Note>
    Consulta [Generazione di video](/it/tools/video-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
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

    - `vydra/veo3` text-to-video
    - `vydra/kling` image-to-video usando un URL di immagine remota

    Sostituisci la fixture dell'immagine remota quando necessario:

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
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Predefiniti:

    - Modello: `elevenlabs/tts`
    - ID voce: `21m00Tcm4TlvDq8ikWAM`

    Il Plugin in bundle attualmente espone una voce predefinita nota e funzionante e restituisce file audio MP3.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Directory dei provider" href="/it/providers/index" icon="list">
    Sfoglia tutti i provider disponibili.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Predefiniti degli agenti e configurazione del modello.
  </Card>
</CardGroup>
