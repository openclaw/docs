---
read_when:
    - Generazione di video tramite l'agente
    - Configurazione di provider e modelli per la generazione video
    - Comprensione dei parametri dello strumento video_generate
summary: Genera video da testo, immagini o video esistenti usando 12 backend provider
title: Generazione video
x-i18n:
    generated_at: "2026-04-07T08:18:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf1224c59a5f1217f56cf2001870aca710a09268677dcd12aad2efbe476e47b7
    source_path: tools/video-generation.md
    workflow: 15
---

# Generazione video

Gli agenti OpenClaw possono generare video da prompt testuali, immagini di riferimento o video esistenti. Sono supportati dodici backend provider, ciascuno con diverse opzioni di modello, modalità di input e set di funzionalità. L'agente sceglie automaticamente il provider giusto in base alla tua configurazione e alle chiavi API disponibili.

<Note>
Lo strumento `video_generate` compare solo quando è disponibile almeno un provider di generazione video. Se non lo vedi tra gli strumenti del tuo agente, imposta una chiave API del provider o configura `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw tratta la generazione video come tre modalità runtime:

- `generate` per richieste text-to-video senza media di riferimento
- `imageToVideo` quando la richiesta include una o più immagini di riferimento
- `videoToVideo` quando la richiesta include uno o più video di riferimento

I provider possono supportare qualsiasi sottoinsieme di queste modalità. Lo strumento valida la
modalità attiva prima dell'invio e riporta le modalità supportate in `action=list`.

## Avvio rapido

1. Imposta una chiave API per qualsiasi provider supportato:

```bash
export GEMINI_API_KEY="your-key"
```

2. Facoltativamente, fissa un modello predefinito:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Chiedi all'agente:

> Genera un video cinematografico di 5 secondi di un'aragosta amichevole che fa surf al tramonto.

L'agente chiama automaticamente `video_generate`. Non è necessaria alcuna allowlist degli strumenti.

## Cosa succede quando generi un video

La generazione video è asincrona. Quando l'agente chiama `video_generate` in una sessione:

1. OpenClaw invia la richiesta al provider e restituisce immediatamente un ID attività.
2. Il provider elabora il job in background (in genere da 30 secondi a 5 minuti, a seconda del provider e della risoluzione).
3. Quando il video è pronto, OpenClaw riattiva la stessa sessione con un evento interno di completamento.
4. L'agente pubblica il video finito nella conversazione originale.

Mentre un job è in corso, le chiamate duplicate a `video_generate` nella stessa sessione restituiscono lo stato corrente dell'attività invece di avviare un'altra generazione. Usa `openclaw tasks list` o `openclaw tasks show <taskId>` per controllare l'avanzamento dalla CLI.

Al di fuori delle esecuzioni dell'agente basate su sessione (per esempio, invocazioni dirette dello strumento), lo strumento ricade sulla generazione inline e restituisce il percorso finale del media nello stesso turno.

### Ciclo di vita dell'attività

Ogni richiesta `video_generate` passa attraverso quattro stati:

1. **queued** -- attività creata, in attesa che il provider la accetti.
2. **running** -- il provider è in elaborazione (in genere da 30 secondi a 5 minuti, a seconda del provider e della risoluzione).
3. **succeeded** -- video pronto; l'agente si riattiva e lo pubblica nella conversazione.
4. **failed** -- errore del provider o timeout; l'agente si riattiva con i dettagli dell'errore.

Controlla lo stato dalla CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevenzione dei duplicati: se un'attività video è già `queued` o `running` per la sessione corrente, `video_generate` restituisce lo stato dell'attività esistente invece di avviarne una nuova. Usa `action: "status"` per controllare esplicitamente senza attivare una nuova generazione.

## Provider supportati

| Provider | Modello predefinito              | Testo | Immagine rif.     | Video rif.       | Chiave API                                |
| -------- | -------------------------------- | ----- | ----------------- | ---------------- | ----------------------------------------- |
| Alibaba  | `wan2.6-t2v`                     | Sì    | Sì (URL remoto)   | Sì (URL remoto)  | `MODELSTUDIO_API_KEY`                     |
| BytePlus | `seedance-1-0-lite-t2v-250428`   | Sì    | 1 immagine        | No               | `BYTEPLUS_API_KEY`                        |
| ComfyUI  | `workflow`                       | Sì    | 1 immagine        | No               | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`   |
| fal      | `fal-ai/minimax/video-01-live`   | Sì    | 1 immagine        | No               | `FAL_KEY`                                 |
| Google   | `veo-3.1-fast-generate-preview`  | Sì    | 1 immagine        | 1 video          | `GEMINI_API_KEY`                          |
| MiniMax  | `MiniMax-Hailuo-2.3`             | Sì    | 1 immagine        | No               | `MINIMAX_API_KEY`                         |
| OpenAI   | `sora-2`                         | Sì    | 1 immagine        | 1 video          | `OPENAI_API_KEY`                          |
| Qwen     | `wan2.6-t2v`                     | Sì    | Sì (URL remoto)   | Sì (URL remoto)  | `QWEN_API_KEY`                            |
| Runway   | `gen4.5`                         | Sì    | 1 immagine        | 1 video          | `RUNWAYML_API_SECRET`                     |
| Together | `Wan-AI/Wan2.2-T2V-A14B`         | Sì    | 1 immagine        | No               | `TOGETHER_API_KEY`                        |
| Vydra    | `veo3`                           | Sì    | 1 immagine (`kling`) | No            | `VYDRA_API_KEY`                           |
| xAI      | `grok-imagine-video`             | Sì    | 1 immagine        | 1 video          | `XAI_API_KEY`                             |

Alcuni provider accettano variabili env aggiuntive o alternative per la chiave API. Vedi le singole [pagine dei provider](#related) per i dettagli.

Esegui `video_generate action=list` per ispezionare provider, modelli e
modalità runtime disponibili in fase di esecuzione.

### Matrice delle capacità dichiarate

Questo è il contratto esplicito delle modalità usato da `video_generate`, dai test di contratto
e dal live sweep condiviso.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Lane live condivise attuali                                                                                                               |
| -------- | ---------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo provider richiede URL video remoti `http(s)`                           |
| BytePlus | Sì         | Sì             | No             | `generate`, `imageToVideo`                                                                                                                |
| ComfyUI  | Sì         | Sì             | No             | Non nel sweep condiviso; la copertura specifica del workflow vive con i test di Comfy                                                    |
| fal      | Sì         | Sì             | No             | `generate`, `imageToVideo`                                                                                                                |
| Google   | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; `videoToVideo` condiviso saltato perché l'attuale sweep Gemini/Veo basato su buffer non accetta questo input |
| MiniMax  | Sì         | Sì             | No             | `generate`, `imageToVideo`                                                                                                                |
| OpenAI   | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; `videoToVideo` condiviso saltato perché questo percorso org/input al momento richiede accesso provider-side a inpaint/remix |
| Qwen     | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo provider richiede URL video remoti `http(s)`                           |
| Runway   | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; `videoToVideo` viene eseguito solo quando il modello selezionato è `runway/gen4_aleph`                      |
| Together | Sì         | Sì             | No             | `generate`, `imageToVideo`                                                                                                                |
| Vydra    | Sì         | Sì             | No             | `generate`; `imageToVideo` condiviso saltato perché `veo3` incluso è solo text-to-video e `kling` incluso richiede un URL immagine remoto |
| xAI      | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo provider al momento richiede un URL MP4 remoto                         |

## Parametri dello strumento

### Obbligatori

| Parametro | Tipo   | Descrizione                                                                |
| --------- | ------ | -------------------------------------------------------------------------- |
| `prompt`  | string | Descrizione testuale del video da generare (obbligatoria per `action: "generate"`) |

### Input di contenuto

| Parametro | Tipo     | Descrizione                              |
| --------- | -------- | ---------------------------------------- |
| `image`   | string   | Singola immagine di riferimento (percorso o URL) |
| `images`  | string[] | Più immagini di riferimento (fino a 5)   |
| `video`   | string   | Singolo video di riferimento (percorso o URL) |
| `videos`  | string[] | Più video di riferimento (fino a 4)      |

### Controlli di stile

| Parametro         | Tipo    | Descrizione                                                             |
| ----------------- | ------- | ----------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`      | string  | `480P`, `720P`, `768P` o `1080P`                                        |
| `durationSeconds` | number  | Durata target in secondi (arrotondata al valore più vicino supportato dal provider) |
| `size`            | string  | Indicazione di dimensione quando il provider la supporta                |
| `audio`           | boolean | Abilita l'audio generato quando supportato                             |
| `watermark`       | boolean | Attiva/disattiva il watermark del provider quando supportato           |

### Avanzati

| Parametro  | Tipo   | Descrizione                                     |
| ---------- | ------ | ----------------------------------------------- |
| `action`   | string | `"generate"` (predefinito), `"status"` o `"list"` |
| `model`    | string | Override provider/modello (es. `runway/gen4.5`) |
| `filename` | string | Suggerimento per il nome file in output         |

Non tutti i provider supportano tutti i parametri. OpenClaw normalizza già la durata al valore supportato più vicino dal provider e rimappa anche hint geometrici tradotti, come il passaggio da size ad aspect-ratio, quando un provider di fallback espone una superficie di controllo diversa. Gli override realmente non supportati vengono ignorati in modalità best-effort e riportati come avvisi nel risultato dello strumento. I limiti rigidi delle capacità (come troppi input di riferimento) falliscono prima dell'invio.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw rimappa durata o geometria durante il fallback del provider, i valori restituiti `durationSeconds`, `size`, `aspectRatio` e `resolution` riflettono ciò che è stato inviato, e `details.normalization` acquisisce la traduzione da richiesto ad applicato.

Gli input di riferimento selezionano anche la modalità runtime:

- Nessun media di riferimento: `generate`
- Qualsiasi immagine di riferimento: `imageToVideo`
- Qualsiasi video di riferimento: `videoToVideo`

I riferimenti misti di immagini e video non costituiscono una superficie di capacità condivisa stabile.
Preferisci un solo tipo di riferimento per richiesta.

## Azioni

- **generate** (predefinita) -- crea un video dal prompt indicato e dagli eventuali input di riferimento.
- **status** -- controlla lo stato dell'attività video in corso per la sessione corrente senza avviare un'altra generazione.
- **list** -- mostra provider, modelli e relative capacità disponibili.

## Selezione del modello

Quando genera un video, OpenClaw risolve il modello in questo ordine:

1. **parametro dello strumento `model`** -- se l'agente ne specifica uno nella chiamata.
2. **`videoGenerationModel.primary`** -- dalla configurazione.
3. **`videoGenerationModel.fallbacks`** -- provati in ordine.
4. **Rilevamento automatico** -- usa i provider con auth valida, iniziando dal provider predefinito corrente, poi i provider rimanenti in ordine alfabetico.

Se un provider fallisce, il candidato successivo viene provato automaticamente. Se tutti i candidati falliscono, l'errore include i dettagli di ogni tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi che
la generazione video usi solo le voci esplicite `model`, `primary` e `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Note sui provider

| Provider | Note                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Usa l'endpoint asincrono DashScope/Model Studio. Le immagini e i video di riferimento devono essere URL remoti `http(s)`.                                    |
| BytePlus | Solo un'immagine di riferimento.                                                                                                                              |
| ComfyUI  | Esecuzione locale o cloud guidata dal workflow. Supporta text-to-video e image-to-video tramite il graph configurato.                                        |
| fal      | Usa un flusso basato su coda per job di lunga durata. Solo una singola immagine di riferimento.                                                             |
| Google   | Usa Gemini/Veo. Supporta un'immagine o un video di riferimento.                                                                                              |
| MiniMax  | Solo un'immagine di riferimento.                                                                                                                              |
| OpenAI   | Viene inoltrato solo l'override `size`. Gli altri override di stile (`aspectRatio`, `resolution`, `audio`, `watermark`) vengono ignorati con un avviso.     |
| Qwen     | Stesso backend DashScope di Alibaba. Gli input di riferimento devono essere URL remoti `http(s)`; i file locali vengono rifiutati subito.                   |
| Runway   | Supporta file locali tramite data URI. Video-to-video richiede `runway/gen4_aleph`. Le esecuzioni solo testo espongono aspect ratio `16:9` e `9:16`.       |
| Together | Solo una singola immagine di riferimento.                                                                                                                     |
| Vydra    | Usa direttamente `https://www.vydra.ai/api/v1` per evitare redirect che perdono l'auth. `veo3` incluso è solo text-to-video; `kling` richiede un URL immagine remoto. |
| xAI      | Supporta flussi text-to-video, image-to-video e modifica/estensione di video remoti.                                                                         |

## Modalità di capacità dei provider

Il contratto condiviso di generazione video ora consente ai provider di dichiarare
capacità specifiche per modalità invece di soli limiti aggregati piatti. Le nuove
implementazioni di provider dovrebbero preferire blocchi di modalità espliciti:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Campi aggregati piatti come `maxInputImages` e `maxInputVideos` non sono
sufficienti per pubblicizzare il supporto delle modalità di trasformazione. I provider dovrebbero dichiarare
esplicitamente `generate`, `imageToVideo` e `videoToVideo` in modo che i test live,
i test di contratto e lo strumento condiviso `video_generate` possano validare il supporto delle modalità
in modo deterministico.

## Test live

Copertura live opt-in per i provider inclusi condivisi:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper del repo:

```bash
pnpm test:live:media video
```

Questo file live carica le variabili env mancanti dei provider da `~/.profile`, preferisce
per impostazione predefinita le chiavi API live/env rispetto ai profili auth memorizzati e
esegue le modalità dichiarate che può testare in sicurezza con media locali:

- `generate` per ogni provider nel sweep
- `imageToVideo` quando `capabilities.imageToVideo.enabled`
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e il provider/modello
  accetta input video locali basati su buffer nello sweep condiviso

Oggi la lane live condivisa `videoToVideo` copre:

- `runway` solo quando selezioni `runway/gen4_aleph`

## Configurazione

Imposta il modello predefinito di generazione video nella tua configurazione OpenClaw:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Oppure tramite la CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Correlati

- [Panoramica degli strumenti](/it/tools)
- [Attività in background](/it/automation/tasks) -- tracciamento delle attività per la generazione video asincrona
- [Alibaba Model Studio](/it/providers/alibaba)
- [BytePlus](/it/concepts/model-providers#byteplus-international)
- [ComfyUI](/it/providers/comfy)
- [fal](/it/providers/fal)
- [Google (Gemini)](/it/providers/google)
- [MiniMax](/it/providers/minimax)
- [OpenAI](/it/providers/openai)
- [Qwen](/it/providers/qwen)
- [Runway](/it/providers/runway)
- [Together AI](/it/providers/together)
- [Vydra](/it/providers/vydra)
- [xAI](/it/providers/xai)
- [Configuration Reference](/it/gateway/configuration-reference#agent-defaults)
- [Models](/it/concepts/models)
