---
read_when:
    - Vuoi utilizzare la generazione di video di PixVerse in OpenClaw
    - È necessario configurare la chiave API e la variabile d’ambiente di PixVerse
    - Vuoi impostare PixVerse come provider video predefinito
summary: Configurazione della generazione video con PixVerse in OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T07:25:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw fornisce `pixverse` come plugin esterno ufficiale per la generazione di video PixVerse in hosting. Il plugin registra il provider `pixverse` nel contratto `videoGenerationProviders`.

| Proprietà             | Valore                                                                    |
| --------------------- | ------------------------------------------------------------------------- |
| ID del provider       | `pixverse`                                                                |
| Pacchetto del plugin  | `@openclaw/pixverse-provider`                                             |
| Variabile env di autenticazione | `PIXVERSE_API_KEY`                                               |
| Flag di onboarding    | `--auth-choice pixverse-api-key`                                          |
| Flag CLI diretto      | `--pixverse-api-key <key>`                                                |
| API                   | PixVerse Platform API v2 (invio di `video_id` e polling del risultato)    |
| Modello predefinito   | `pixverse/v6`                                                             |
| Regione API predefinita | Internazionale                                                          |

## Per iniziare

<Steps>
  <Step title="Installa il plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Imposta la chiave API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    La procedura guidata richiede di scegliere l'endpoint Internazionale o CN
    (vedi Regione API di seguito) prima di scrivere `region` e `baseUrl` nella
    configurazione del provider. Le esecuzioni non interattive (chiave fornita
    tramite `--pixverse-api-key` o `PIXVERSE_API_KEY`) usano per impostazione
    predefinita la regione Internazionale.

    L'onboarding imposta inoltre `agents.defaults.videoGenerationModel.primary`
    su `pixverse/v6` quando non è ancora configurato alcun modello video
    predefinito.

  </Step>
  <Step title="Cambia il provider video predefinito esistente (facoltativo)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Genera un video">
    Chiedi all'agente di generare un video. PixVerse verrà utilizzato automaticamente.
  </Step>
</Steps>

## Modalità e modelli supportati

Il provider rende disponibili i modelli di generazione PixVerse tramite lo strumento video condiviso di OpenClaw.

| Modalità        | Modelli              | Input di riferimento       |
| --------------- | -------------------- | -------------------------- |
| Da testo a video  | `v6` (predefinito), `c1` | Nessuno                |
| Da immagine a video | `v6` (predefinito), `c1` | 1 immagine locale o remota |

I riferimenti a immagini locali vengono caricati su PixVerse prima della richiesta da immagine a video. Gli URL delle immagini remote vengono trasmessi all'endpoint di caricamento immagini di PixVerse come `image_url`.

| Opzione         | Valori supportati                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Durata          | 1-15 secondi (valore predefinito: 5)                                                                                                           |
| Risoluzione     | `360P`, `540P`, `720P`, `1080P` (valore predefinito: `540P`; le richieste `480P` vengono convertite in `540P`)                                 |
| Proporzioni     | `16:9` (predefinito), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; solo da testo a video, da immagine a video segue l'immagine sorgente |
| Audio generato  | `audio: true`                                                                                                                                  |

<Note>
La generazione di immagini da modelli PixVerse non è ancora disponibile tramite `image_generate`. Tale API è basata sull'ID del modello, mentre il contratto condiviso di OpenClaw per la generazione di immagini non dispone attualmente di un insieme di opzioni tipizzate specifico per PixVerse.
</Note>

## Opzioni del provider

Il provider video accetta le seguenti chiavi facoltative specifiche del provider:

| Opzione                              | Tipo   | Effetto                                                |
| ------------------------------------ | ------ | ------------------------------------------------------ |
| `seed`                               | numero | Seed deterministico, da 0 a 2147483647                 |
| `negativePrompt` / `negative_prompt` | stringa | Prompt negativo                                        |
| `quality`                            | stringa | Qualità PixVerse, ad esempio `720p`                    |
| `motionMode` / `motion_mode`         | stringa | Modalità di movimento da immagine a video (predefinita: `normal`) |
| `cameraMovement` / `camera_movement` | stringa | Preset di movimento della videocamera PixVerse         |
| `templateId` / `template_id`         | numero | ID del modello PixVerse attivato                       |

## Configurazione

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Regione API">
    | Valore della regione | URL di base dell'API PixVerse                 |
    | -------------------- | --------------------------------------------- |
    | `international`      | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`                 | `https://app-api.pixverseai.cn/openapi/v2`    |

    Imposta manualmente `models.providers.pixverse.region` quando la chiave
    appartiene a una regione specifica della piattaforma PixVerse oppure esegui
    `openclaw onboard --auth-choice pixverse-api-key` per sceglierne una nella
    procedura guidata di configurazione:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" o "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL di base personalizzato">
    Imposta `models.providers.pixverse.baseUrl` solo quando il traffico viene instradato tramite un proxy compatibile e attendibile.
    `baseUrl` ha la precedenza su `region`.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Polling delle attività">
    PixVerse restituisce un `video_id` dalla richiesta di generazione. OpenClaw
    esegue il polling di `/openapi/v2/video/result/{video_id}` ogni 5 secondi,
    finché l'attività non riesce, non fallisce o non raggiunge il timeout
    (valore predefinito: 5 minuti; modificabile tramite
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento, selezione del provider e comportamento asincrono.
  </Card>
  <Card title="Riferimento per la configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Impostazioni predefinite dell'agente, incluso il modello di generazione video.
  </Card>
</CardGroup>
