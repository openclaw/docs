---
read_when:
    - Vuoi usare la generazione video di PixVerse in OpenClaw
    - Ti serve la configurazione della chiave API/env di PixVerse
    - Vuoi rendere PixVerse il provider video predefinito
summary: Configurazione della generazione video PixVerse in OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T18:09:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw fornisce `pixverse` come Plugin esterno ufficiale per la generazione video PixVerse ospitata. Il Plugin registra il provider `pixverse` rispetto al contratto `videoGenerationProviders`.

| Proprietà             | Valore                                                               |
| --------------------- | -------------------------------------------------------------------- |
| ID provider           | `pixverse`                                                           |
| Pacchetto Plugin      | `@openclaw/pixverse-provider`                                        |
| Variabile env di auth | `PIXVERSE_API_KEY`                                                   |
| Flag di onboarding    | `--auth-choice pixverse-api-key`                                     |
| Flag CLI diretto      | `--pixverse-api-key <key>`                                           |
| API                   | PixVerse Platform API v2 (invio `video_id` più polling del risultato) |
| Modello predefinito   | `pixverse/v6`                                                        |
| Regione API predefinita | Internazionale                                                     |

## Per iniziare

<Steps>
  <Step title="Installa il Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Imposta la chiave API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    La procedura guidata chiede se usare l'endpoint internazionale
    (`https://app-api.pixverse.ai/openapi/v2`) o l'endpoint CN
    (`https://app-api.pixverseai.cn/openapi/v2`) prima di scrivere `region` e
    `baseUrl` nella configurazione del provider.

  </Step>
  <Step title="Imposta PixVerse come provider video predefinito">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Genera un video">
    Chiedi all'agente di generare un video. PixVerse verrà usato automaticamente.
  </Step>
</Steps>

## Modalità e modelli supportati

Il provider espone i modelli di generazione PixVerse tramite lo strumento video condiviso di OpenClaw.

| Modalità       | Modelli              | Input di riferimento     |
| -------------- | -------------------- | ------------------------ |
| Testo-video    | `v6` (predefinito), `c1` | Nessuno              |
| Immagine-video | `v6` (predefinito), `c1` | 1 immagine locale o remota |

I riferimenti a immagini locali vengono caricati su PixVerse prima della richiesta immagine-video. Gli URL di immagini remote vengono passati all'endpoint di caricamento immagini di PixVerse come `image_url`.

| Opzione        | Valori supportati                                                         |
| -------------- | ------------------------------------------------------------------------- |
| Durata         | 1-15 secondi                                                              |
| Risoluzione    | `360P`, `540P`, `720P`, `1080P`                                           |
| Proporzioni    | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` per testo-video |
| Audio generato | `audio: true`                                                             |

<Note>
La generazione di template immagine PixVerse non è ancora esposta tramite `image_generate`. Quell'API è guidata da ID template, mentre il contratto condiviso di generazione immagini di OpenClaw attualmente non dispone di un contenitore di opzioni tipizzate specifico per PixVerse.
</Note>

## Opzioni del provider

Il provider video accetta queste chiavi opzionali specifiche del provider:

| Opzione                              | Tipo   | Effetto                                |
| ------------------------------------ | ------ | -------------------------------------- |
| `seed`                               | number | Seed deterministico quando supportato  |
| `negativePrompt` / `negative_prompt` | string | Prompt negativo                        |
| `quality`                            | string | Qualità PixVerse come `720p`           |
| `motionMode` / `motion_mode`         | string | Modalità movimento immagine-video      |
| `cameraMovement` / `camera_movement` | string | Preset di movimento camera PixVerse    |
| `templateId` / `template_id`         | number | ID template PixVerse attivato          |

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
    OpenClaw usa per impostazione predefinita l'API PixVerse internazionale. Imposta `models.providers.pixverse.region`
    manualmente quando la tua chiave appartiene a una regione specifica della piattaforma PixVerse, oppure usa
    `openclaw onboard --auth-choice pixverse-api-key` per sceglierne una nella procedura guidata di configurazione:

    | Valore regione | URL base API PixVerse                         |
    | -------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`     |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`   |

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL base personalizzato">
    Imposta `models.providers.pixverse.baseUrl` solo quando instradi tramite un proxy compatibile attendibile.
    `baseUrl` ha precedenza su `region`.

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
    PixVerse restituisce un `video_id` dalla richiesta di generazione. OpenClaw esegue il polling di
    `/openapi/v2/video/result/{video_id}` finché l'attività riesce, fallisce
    o va in timeout.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri dello strumento condiviso, selezione del provider e comportamento asincrono.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Impostazioni predefinite dell'agente, incluso il modello di generazione video.
  </Card>
</CardGroup>
