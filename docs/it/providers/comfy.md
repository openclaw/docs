---
read_when:
    - Vuoi utilizzare i flussi di lavoro locali di ComfyUI con OpenClaw
    - Vuoi utilizzare Comfy Cloud con flussi di lavoro per immagini, video o musica
    - Ti servono le chiavi di configurazione del Plugin comfy incluso nel pacchetto
summary: Configurazione del flusso di lavoro ComfyUI per la generazione di immagini, video e musica in OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T07:24:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw include un Plugin `comfy` integrato per eseguire ComfyUI tramite flussi di lavoro. Il
Plugin è interamente basato sui flussi di lavoro: OpenClaw non associa controlli generici come `size`,
`aspectRatio`, `resolution`, `durationSeconds` o controlli in stile TTS
al grafo.

| Proprietà          | Dettaglio                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Provider           | `comfy`                                                                                   |
| Modello            | `comfy/workflow`                                                                          |
| Strumenti condivisi | `image_generate`, `video_generate`, `music_generate`                                      |
| Autenticazione     | Nessuna per ComfyUI locale; `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per Comfy Cloud       |
| API                | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                            |

## Funzionalità supportate

- Generazione e modifica di immagini da un flusso di lavoro JSON (la modifica accetta 1 immagine di riferimento caricata)
- Generazione di video da un flusso di lavoro JSON, da testo a video o da immagine a video (1 immagine di riferimento)
- Generazione di musica/audio tramite lo strumento condiviso `music_generate`, con 1 immagine di riferimento facoltativa
- Download dell'output da un Node configurato oppure da tutti i Node di output corrispondenti quando non ne è configurato alcuno

## Per iniziare

Scegli se eseguire ComfyUI sul tuo computer o utilizzare Comfy Cloud.

<Tabs>
  <Tab title="Locale">
    **Ideale per:** eseguire una propria istanza ComfyUI sul computer o nella LAN.

    <Steps>
      <Step title="Avvia ComfyUI localmente">
        Assicurati che l'istanza ComfyUI locale sia in esecuzione (il valore predefinito è `http://127.0.0.1:8188`).
      </Step>
      <Step title="Prepara il flusso di lavoro JSON">
        Esporta o crea un file JSON del flusso di lavoro ComfyUI. Prendi nota degli ID del Node di input del prompt e del Node di output da cui vuoi che OpenClaw legga.
      </Step>
      <Step title="Configura il provider">
        Imposta `mode: "local"` e indica il file del flusso di lavoro. Esempio minimo per le immagini:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Imposta il modello predefinito">
        Configura OpenClaw affinché utilizzi il modello `comfy/workflow` per la funzionalità configurata:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Ideale per:** eseguire flussi di lavoro su Comfy Cloud senza gestire risorse GPU locali.

    <Steps>
      <Step title="Ottieni una chiave API">
        Registrati su [comfy.org](https://comfy.org) e genera una chiave API dal pannello di controllo del tuo account.
      </Step>
      <Step title="Imposta la chiave API">
        Fornisci la chiave con uno dei seguenti metodi:

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepara il flusso di lavoro JSON">
        Esporta o crea un file JSON del flusso di lavoro ComfyUI. Prendi nota degli ID del Node di input del prompt e del Node di output.
      </Step>
      <Step title="Configura il provider">
        Imposta `mode: "cloud"` e indica il file del flusso di lavoro:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        In modalità cloud, il valore predefinito di `baseUrl` è `https://cloud.comfy.org`. Imposta `baseUrl` solo per un endpoint cloud personalizzato.
        </Tip>
      </Step>
      <Step title="Imposta il modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configurazione

Comfy supporta impostazioni di connessione condivise di primo livello e sezioni del flusso di lavoro specifiche per ciascuna funzionalità (`image`, `video`, `music`):

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### Chiavi condivise

| Chiave                | Tipo                   | Descrizione                                                                                       |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| `mode`                | `"local"` o `"cloud"`  | Modalità di connessione. Il valore predefinito è `"local"`.                                       |
| `baseUrl`             | stringa                | Il valore predefinito è `http://127.0.0.1:8188` in locale o `https://cloud.comfy.org` nel cloud.  |
| `apiKey`              | stringa                | Chiave incorporata facoltativa, alternativa alle variabili d'ambiente `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | booleano               | Consente un `baseUrl` privato/LAN in modalità cloud o un FQDN DNS privato locale.                 |

<Note>
In modalità `local`, gli indirizzi IP letterali loopback/privati e i nomi di servizio con una singola etichetta, come `http://comfyui:8188`, funzionano senza `allowPrivateNetwork`. I FQDN DNS privati dall'aspetto pubblico, come `https://comfy.local.example.com`, richiedono `allowPrivateNetwork: true`. L'attendibilità dell'origine privata rimane limitata allo schema, al nome host e alla porta configurati; i reindirizzamenti locali non possono uscire dal nome host configurato, mentre i reindirizzamenti cloud verso CDN pubbliche vengono verificati con i criteri SSRF predefiniti.
</Note>

### Chiavi per funzionalità

Queste chiavi si applicano all'interno delle sezioni `image`, `video` o `music`:

| Chiave                       | Obbligatoria | Valore predefinito | Descrizione                                                                        |
| ---------------------------- | ------------ | ------------------ | ---------------------------------------------------------------------------------- |
| `workflow` o `workflowPath`  | Sì           | --                 | JSON del flusso di lavoro incorporato o percorso del relativo file JSON ComfyUI.   |
| `promptNodeId`               | Sì           | --                 | ID del Node che riceve il prompt testuale.                                         |
| `promptInputName`            | No           | `"text"`           | Nome dell'input sul Node del prompt.                                                |
| `outputNodeId`               | No           | --                 | ID del Node da cui leggere l'output. Se omesso, vengono utilizzati tutti i Node di output corrispondenti. |
| `pollIntervalMs`             | No           | `1500`             | Intervallo di polling, in millisecondi, per il completamento del processo.          |
| `timeoutMs`                  | No           | `300000`           | Timeout, in millisecondi, per l'esecuzione del flusso di lavoro.                    |

Le sezioni `image` e `video` supportano anche un Node di input per l'immagine di riferimento:

| Chiave                | Obbligatoria                                  | Valore predefinito | Descrizione                                                     |
| --------------------- | --------------------------------------------- | ------------------ | --------------------------------------------------------------- |
| `inputImageNodeId`    | Sì (quando si passa un'immagine di riferimento) | --               | ID del Node che riceve l'immagine di riferimento caricata.      |
| `inputImageInputName` | No                                            | `"image"`          | Nome dell'input sul Node dell'immagine.                          |

`apiKey` accetta una stringa letterale oppure un oggetto [riferimento a un segreto](/it/gateway/configuration-reference#secrets).

## Dettagli del flusso di lavoro

<AccordionGroup>
  <Accordion title="Flussi di lavoro per immagini">
    Imposta il modello di immagini predefinito su `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Esempio di modifica con immagine di riferimento:**

    Per abilitare la modifica delle immagini usando un'immagine di riferimento caricata, aggiungi `inputImageNodeId` alla configurazione delle immagini:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Flussi di lavoro per video">
    Imposta il modello video predefinito su `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    I flussi di lavoro video di Comfy supportano la generazione da testo a video e da immagine a video tramite il grafo configurato.

    <Note>
    OpenClaw non passa video di input ai flussi di lavoro Comfy. Come input sono supportati solo prompt testuali e singole immagini di riferimento.
    </Note>

  </Accordion>

  <Accordion title="Flussi di lavoro per musica">
    Il Plugin integrato registra un provider per la generazione di musica per output audio o musicali definiti dal flusso di lavoro, reso disponibile tramite lo strumento condiviso `music_generate`. Accetta un'immagine di riferimento facoltativa (fino a 1):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Usa la sezione di configurazione `music` per indicare il file JSON del flusso di lavoro audio e il Node di output.

  </Accordion>

  <Accordion title="Compatibilità con le versioni precedenti">
    La configurazione esistente delle immagini di primo livello (senza la sezione `image` annidata) continua a funzionare:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw considera questa struttura precedente come configurazione del flusso di lavoro per le immagini. Non è necessario eseguire immediatamente la migrazione, ma per le nuove configurazioni sono consigliate le sezioni annidate `image` / `video` / `music`. Se utilizzi solo la generazione di immagini, la configurazione piatta precedente e la nuova sezione `image` annidata sono funzionalmente equivalenti.

  </Accordion>

  <Accordion title="Test live">
    È disponibile una copertura live facoltativa per il Plugin integrato:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Il test live ignora i singoli casi relativi a immagini, video o musica, a meno che non sia configurata la sezione corrispondente del flusso di lavoro Comfy.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Configurazione e utilizzo dello strumento di generazione di immagini.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Configurazione e utilizzo dello strumento di generazione di video.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Configurazione dello strumento di generazione di musica e audio.
  </Card>
  <Card title="Directory dei provider" href="/it/providers/index" icon="layers">
    Panoramica di tutti i provider e dei riferimenti ai modelli.
  </Card>
  <Card title="Riferimento per la configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Riferimento completo della configurazione, incluse le impostazioni predefinite degli agenti.
  </Card>
</CardGroup>
