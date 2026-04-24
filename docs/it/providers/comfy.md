---
read_when:
    - Vuoi usare workflow ComfyUI locali con OpenClaw
    - Vuoi usare Comfy Cloud con workflow di immagini, video o musica
    - Hai bisogno delle chiavi di configurazione del plugin comfy bundled
summary: Configurazione della generazione di immagini, video e musica con workflow ComfyUI in OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-24T08:56:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8b39c49df3ad23018372b481681ce89deac3271da5dbdf94580712ace7fef7f
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw distribuisce un plugin bundled `comfy` per esecuzioni ComfyUI guidate da workflow. Il plugin è interamente guidato dal workflow, quindi OpenClaw non prova a mappare controlli generici come `size`, `aspectRatio`, `resolution`, `durationSeconds` o controlli in stile TTS sul tuo grafo.

| Proprietà        | Dettaglio                                                                         |
| ---------------- | --------------------------------------------------------------------------------- |
| Provider         | `comfy`                                                                           |
| Modelli          | `comfy/workflow`                                                                  |
| Superfici condivise | `image_generate`, `video_generate`, `music_generate`                           |
| Auth             | Nessuna per ComfyUI locale; `COMFY_API_KEY` oppure `COMFY_CLOUD_API_KEY` per Comfy Cloud |
| API              | ComfyUI `/prompt` / `/history` / `/view` e Comfy Cloud `/api/*`                   |

## Cosa supporta

- Generazione di immagini da un workflow JSON
- Modifica di immagini con 1 immagine di riferimento caricata
- Generazione video da un workflow JSON
- Generazione video con 1 immagine di riferimento caricata
- Generazione di musica o audio tramite lo strumento condiviso `music_generate`
- Download dell'output da un nodo configurato o da tutti i nodi di output corrispondenti

## Per iniziare

Scegli se eseguire ComfyUI sulla tua macchina oppure usare Comfy Cloud.

<Tabs>
  <Tab title="Locale">
    **Ideale per:** eseguire la tua istanza ComfyUI sulla tua macchina o nella tua LAN.

    <Steps>
      <Step title="Avvia ComfyUI localmente">
        Assicurati che la tua istanza locale di ComfyUI sia in esecuzione (predefinita `http://127.0.0.1:8188`).
      </Step>
      <Step title="Prepara il tuo workflow JSON">
        Esporta o crea un file JSON di workflow ComfyUI. Annota gli ID dei nodi del nodo di input del prompt e del nodo di output da cui vuoi che OpenClaw legga.
      </Step>
      <Step title="Configura il provider">
        Imposta `mode: "local"` e punta al tuo file di workflow. Ecco un esempio minimo per immagini:

        ```json5
        {
          models: {
            providers: {
              comfy: {
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
        }
        ```
      </Step>
      <Step title="Imposta il modello predefinito">
        Punta OpenClaw al modello `comfy/workflow` per la capacità che hai configurato:

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
    **Ideale per:** eseguire workflow su Comfy Cloud senza gestire risorse GPU locali.

    <Steps>
      <Step title="Ottieni una chiave API">
        Registrati su [comfy.org](https://comfy.org) e genera una chiave API dalla dashboard del tuo account.
      </Step>
      <Step title="Imposta la chiave API">
        Fornisci la tua chiave tramite uno di questi metodi:

        ```bash
        # Variabile di ambiente (consigliata)
        export COMFY_API_KEY="your-key"

        # Variabile di ambiente alternativa
        export COMFY_CLOUD_API_KEY="your-key"

        # Oppure inline nella configurazione
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepara il tuo workflow JSON">
        Esporta o crea un file JSON di workflow ComfyUI. Annota gli ID dei nodi per il nodo di input del prompt e il nodo di output.
      </Step>
      <Step title="Configura il provider">
        Imposta `mode: "cloud"` e punta al tuo file di workflow:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        La modalità cloud usa come predefinito `baseUrl` = `https://cloud.comfy.org`. Devi impostare `baseUrl` solo se usi un endpoint cloud personalizzato.
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

Comfy supporta impostazioni di connessione condivise a livello superiore più sezioni di workflow per capacità (`image`, `video`, `music`):

```json5
{
  models: {
    providers: {
      comfy: {
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
}
```

### Chiavi condivise

| Chiave                | Tipo                   | Descrizione                                                                           |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` oppure `"cloud"` | Modalità di connessione.                                                           |
| `baseUrl`             | string                 | Valore predefinito `http://127.0.0.1:8188` per locale oppure `https://cloud.comfy.org` per cloud. |
| `apiKey`              | string                 | Chiave inline facoltativa, alternativa alle variabili env `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Consente un `baseUrl` privato/LAN in modalità cloud.                                 |

### Chiavi per capacità

Queste chiavi si applicano all'interno delle sezioni `image`, `video` o `music`:

| Chiave                       | Obbligatoria | Predefinito | Descrizione                                                                  |
| ---------------------------- | ------------ | ----------- | ---------------------------------------------------------------------------- |
| `workflow` oppure `workflowPath` | Sì       | --          | Percorso al file JSON del workflow ComfyUI.                                  |
| `promptNodeId`               | Sì           | --          | ID del nodo che riceve il prompt testuale.                                   |
| `promptInputName`            | No           | `"text"`    | Nome dell'input sul nodo del prompt.                                         |
| `outputNodeId`               | No           | --          | ID del nodo da cui leggere l'output. Se omesso, vengono usati tutti i nodi di output corrispondenti. |
| `pollIntervalMs`             | No           | --          | Intervallo di polling in millisecondi per il completamento del job.          |
| `timeoutMs`                  | No           | --          | Timeout in millisecondi per l'esecuzione del workflow.                       |

Le sezioni `image` e `video` supportano anche:

| Chiave                | Obbligatoria                              | Predefinito | Descrizione                                         |
| --------------------- | ----------------------------------------- | ----------- | --------------------------------------------------- |
| `inputImageNodeId`    | Sì (quando passi un'immagine di riferimento) | --       | ID del nodo che riceve l'immagine di riferimento caricata. |
| `inputImageInputName` | No                                        | `"image"`   | Nome dell'input sul nodo immagine.                  |

## Dettagli del workflow

<AccordionGroup>
  <Accordion title="Workflow per immagini">
    Imposta il modello immagine predefinito su `comfy/workflow`:

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

    Per abilitare la modifica di immagini con un'immagine di riferimento caricata, aggiungi `inputImageNodeId` alla tua configurazione immagini:

    ```json5
    {
      models: {
        providers: {
          comfy: {
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
    }
    ```

  </Accordion>

  <Accordion title="Workflow video">
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

    I workflow video Comfy supportano text-to-video e image-to-video tramite il grafo configurato.

    <Note>
    OpenClaw non passa video di input nei workflow Comfy. Sono supportati come input solo prompt testuali e singole immagini di riferimento.
    </Note>

  </Accordion>

  <Accordion title="Workflow musicali">
    Il plugin bundled registra un provider di generazione musicale per output audio o musicali definiti dal workflow, esposti tramite lo strumento condiviso `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Usa la sezione di configurazione `music` per puntare al tuo JSON di workflow audio e al nodo di output.

  </Accordion>

  <Accordion title="Compatibilità retroattiva">
    La configurazione immagini esistente di livello superiore (senza la sezione annidata `image`) continua a funzionare:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    OpenClaw tratta questa forma legacy come configurazione del workflow immagini. Non devi migrare immediatamente, ma le sezioni annidate `image` / `video` / `music` sono consigliate per le nuove configurazioni.

    <Tip>
    Se usi solo la generazione di immagini, la configurazione flat legacy e la nuova sezione annidata `image` sono funzionalmente equivalenti.
    </Tip>

  </Accordion>

  <Accordion title="Test live">
    Esiste una copertura live opt-in per il plugin bundled:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Il test live salta i singoli casi immagine, video o musica a meno che la sezione corrispondente del workflow Comfy non sia configurata.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Configurazione e utilizzo dello strumento di generazione di immagini.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Configurazione e utilizzo dello strumento di generazione video.
  </Card>
  <Card title="Generazione musicale" href="/it/tools/music-generation" icon="music">
    Configurazione dello strumento di generazione musicale e audio.
  </Card>
  <Card title="Directory provider" href="/it/providers/index" icon="layers">
    Panoramica di tutti i provider e riferimenti modello.
  </Card>
  <Card title="Riferimento configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Riferimento completo della configurazione, inclusi i valori predefiniti dell'agente.
  </Card>
</CardGroup>
