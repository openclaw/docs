---
read_when:
    - Generazione di video tramite l'agente
    - Configurazione di provider e modelli per la generazione video
    - Comprendere i parametri dello strumento video_generate
summary: Generare video da testo, immagini o video esistenti usando 14 backend provider
title: Generazione video
x-i18n:
    generated_at: "2026-04-24T09:08:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ddefd4fcde2b22be6631c160ed6e128a97b0800d32c65fb5fe36227ce4f368
    source_path: tools/video-generation.md
    workflow: 15
---

Gli agenti OpenClaw possono generare video da prompt testuali, immagini di riferimento o video esistenti. Sono supportati quattordici backend provider, ciascuno con opzioni di modello, modalità di input e set di funzionalità differenti. L'agente sceglie automaticamente il provider giusto in base alla tua configurazione e alle chiavi API disponibili.

<Note>
Lo strumento `video_generate` compare solo quando è disponibile almeno un provider di generazione video. Se non lo vedi tra gli strumenti dell'agente, imposta una chiave API del provider o configura `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw tratta la generazione video come tre modalità di runtime:

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

L'agente chiama automaticamente `video_generate`. Non è necessaria alcuna allowlist dello strumento.

## Cosa succede quando generi un video

La generazione video è asincrona. Quando l'agente chiama `video_generate` in una sessione:

1. OpenClaw invia la richiesta al provider e restituisce immediatamente un ID task.
2. Il provider elabora il job in background (in genere da 30 secondi a 5 minuti a seconda del provider e della risoluzione).
3. Quando il video è pronto, OpenClaw riattiva la stessa sessione con un evento interno di completamento.
4. L'agente pubblica il video finito nella conversazione originale.

Mentre un job è in corso, chiamate duplicate a `video_generate` nella stessa sessione restituiscono lo stato corrente del task invece di avviare un'altra generazione. Usa `openclaw tasks list` o `openclaw tasks show <taskId>` per controllare l'avanzamento dalla CLI.

Al di fuori delle esecuzioni dell'agente supportate da sessione (per esempio, invocazioni dirette dello strumento), lo strumento usa come fallback la generazione inline e restituisce il percorso finale del media nello stesso turno.

### Ciclo di vita del task

Ogni richiesta `video_generate` passa attraverso quattro stati:

1. **queued** -- task creato, in attesa che il provider lo accetti.
2. **running** -- il provider sta elaborando (in genere da 30 secondi a 5 minuti a seconda del provider e della risoluzione).
3. **succeeded** -- video pronto; l'agente si riattiva e lo pubblica nella conversazione.
4. **failed** -- errore del provider o timeout; l'agente si riattiva con i dettagli dell'errore.

Controlla lo stato dalla CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevenzione dei duplicati: se un task video è già `queued` o `running` per la sessione corrente, `video_generate` restituisce lo stato del task esistente invece di avviarne uno nuovo. Usa `action: "status"` per controllare esplicitamente senza attivare una nuova generazione.

## Provider supportati

| Provider              | Modello predefinito             | Testo | Immagine rif.                                         | Video rif.       | Chiave API                                |
| --------------------- | ------------------------------- | ----- | ----------------------------------------------------- | ---------------- | ----------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Sì    | Sì (URL remoto)                                       | Sì (URL remoto)  | `MODELSTUDIO_API_KEY`                     |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Sì    | Fino a 2 immagini (solo modelli I2V; primo + ultimo frame) | No           | `BYTEPLUS_API_KEY`                        |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Sì    | Fino a 2 immagini (primo + ultimo frame via ruolo)    | No               | `BYTEPLUS_API_KEY`                        |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Sì    | Fino a 9 immagini di riferimento                      | Fino a 3 video   | `BYTEPLUS_API_KEY`                        |
| ComfyUI               | `workflow`                      | Sì    | 1 immagine                                            | No               | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`   |
| fal                   | `fal-ai/minimax/video-01-live`  | Sì    | 1 immagine                                            | No               | `FAL_KEY`                                 |
| Google                | `veo-3.1-fast-generate-preview` | Sì    | 1 immagine                                            | 1 video          | `GEMINI_API_KEY`                          |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Sì    | 1 immagine                                            | No               | `MINIMAX_API_KEY`                         |
| OpenAI                | `sora-2`                        | Sì    | 1 immagine                                            | 1 video          | `OPENAI_API_KEY`                          |
| Qwen                  | `wan2.6-t2v`                    | Sì    | Sì (URL remoto)                                       | Sì (URL remoto)  | `QWEN_API_KEY`                            |
| Runway                | `gen4.5`                        | Sì    | 1 immagine                                            | 1 video          | `RUNWAYML_API_SECRET`                     |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Sì    | 1 immagine                                            | No               | `TOGETHER_API_KEY`                        |
| Vydra                 | `veo3`                          | Sì    | 1 immagine (`kling`)                                  | No               | `VYDRA_API_KEY`                           |
| xAI                   | `grok-imagine-video`            | Sì    | 1 immagine                                            | 1 video          | `XAI_API_KEY`                             |

Alcuni provider accettano variabili env aggiuntive o alternative per la chiave API. Vedi le singole [pagine provider](#related) per i dettagli.

Esegui `video_generate action=list` per ispezionare a runtime provider, modelli e
modalità di runtime disponibili.

### Matrice delle capacità dichiarate

Questo è il contratto di modalità esplicito usato da `video_generate`, dai test di contratto
e dallo sweep live condiviso.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Lane live condivise oggi                                                                                                                  |
| -------- | ---------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo provider richiede URL video remoti `http(s)`                           |
| BytePlus | Sì         | Sì             | No             | `generate`, `imageToVideo`                                                                                                                |
| ComfyUI  | Sì         | Sì             | No             | Non nello sweep condiviso; la copertura specifica del workflow vive con i test Comfy                                                     |
| fal      | Sì         | Sì             | No             | `generate`, `imageToVideo`                                                                                                                |
| Google   | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; lo `videoToVideo` condiviso è saltato perché l'attuale sweep Gemini/Veo supportato da buffer non accetta questo input |
| MiniMax  | Sì         | Sì             | No             | `generate`, `imageToVideo`                                                                                                                |
| OpenAI   | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; lo `videoToVideo` condiviso è saltato perché questo percorso org/input attualmente richiede accesso inpaint/remix lato provider |
| Qwen     | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo provider richiede URL video remoti `http(s)`                           |
| Runway   | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; `videoToVideo` viene eseguito solo quando il modello selezionato è `runway/gen4_aleph`                     |
| Together | Sì         | Sì             | No             | `generate`, `imageToVideo`                                                                                                                |
| Vydra    | Sì         | Sì             | No             | `generate`; `imageToVideo` condiviso saltato perché `veo3` incluso è solo testo e `kling` incluso richiede un URL immagine remoto      |
| xAI      | Sì         | Sì             | Sì             | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo provider attualmente richiede un URL MP4 remoto                        |

## Parametri dello strumento

### Obbligatori

| Parametro | Tipo   | Descrizione                                                                    |
| --------- | ------ | ------------------------------------------------------------------------------ |
| `prompt`  | string | Descrizione testuale del video da generare (obbligatoria per `action: "generate"`) |

### Input di contenuto

| Parametro    | Tipo     | Descrizione                                                                                                                              |
| ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | Singola immagine di riferimento (path o URL)                                                                                             |
| `images`     | string[] | Più immagini di riferimento (fino a 9)                                                                                                   |
| `imageRoles` | string[] | Hint di ruolo facoltativi per posizione in parallelo all'elenco combinato delle immagini. Valori canonici: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | Singolo video di riferimento (path o URL)                                                                                                |
| `videos`     | string[] | Più video di riferimento (fino a 4)                                                                                                      |
| `videoRoles` | string[] | Hint di ruolo facoltativi per posizione in parallelo all'elenco combinato dei video. Valore canonico: `reference_video`                 |
| `audioRef`   | string   | Singolo audio di riferimento (path o URL). Usato per esempio come musica di sottofondo o riferimento vocale quando il provider supporta input audio |
| `audioRefs`  | string[] | Più audio di riferimento (fino a 3)                                                                                                      |
| `audioRoles` | string[] | Hint di ruolo facoltativi per posizione in parallelo all'elenco combinato degli audio. Valore canonico: `reference_audio`               |

Gli hint di ruolo vengono inoltrati al provider così come sono. I valori canonici provengono
dalla union `VideoGenerationAssetRole`, ma i provider possono accettare stringhe di ruolo aggiuntive. Gli array `*Roles` non devono avere più voci del
relativo elenco di riferimenti; errori off-by-one falliscono con un messaggio chiaro.
Usa una stringa vuota per lasciare uno slot non impostato.

### Controlli di stile

| Parametro         | Tipo    | Descrizione                                                                             |
| ----------------- | ------- | --------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` o `adaptive`  |
| `resolution`      | string  | `480P`, `720P`, `768P` o `1080P`                                                        |
| `durationSeconds` | number  | Durata target in secondi (arrotondata al valore supportato dal provider più vicino)    |
| `size`            | string  | Hint di dimensione quando il provider lo supporta                                       |
| `audio`           | boolean | Abilita l'audio generato nell'output quando supportato. Distinto da `audioRef*` (input) |
| `watermark`       | boolean | Attiva/disattiva il watermark del provider quando supportato                            |

`adaptive` è un sentinel specifico del provider: viene inoltrato così com'è ai
provider che dichiarano `adaptive` nelle loro capacità (ad es. BytePlus
Seedance lo usa per rilevare automaticamente il rapporto dalle dimensioni
dell'immagine di input). I provider che non lo dichiarano espongono il valore tramite
`details.ignoredOverrides` nel risultato dello strumento così che l'omissione sia visibile.

### Avanzati

| Parametro         | Tipo   | Descrizione                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `action`          | string | `"generate"` (predefinito), `"status"` o `"list"`                                                                                                                                                                                                                                                                                                      |
| `model`           | string | Override provider/modello (ad es. `runway/gen4.5`)                                                                                                                                                                                                                                                                                                     |
| `filename`        | string | Hint del nome file di output                                                                                                                                                                                                                                                                                                                           |
| `timeoutMs`       | number | Timeout facoltativo della richiesta al provider in millisecondi                                                                                                                                                                                                                                                                                        |
| `providerOptions` | object | Opzioni specifiche del provider come oggetto JSON (ad es. `{"seed": 42, "draft": true}`). I provider che dichiarano uno schema tipizzato validano chiavi e tipi; chiavi sconosciute o mismatch fanno saltare il candidato durante il fallback. I provider senza schema dichiarato ricevono le opzioni così come sono. Esegui `video_generate action=list` per vedere cosa accetta ciascun provider |

Non tutti i provider supportano tutti i parametri. OpenClaw normalizza già la durata al valore supportato dal provider più vicino, e rimappa anche hint di geometria tradotti come size-to-aspect-ratio quando un provider di fallback espone una superficie di controllo diversa. Gli override realmente non supportati vengono ignorati in best effort e segnalati come avvisi nel risultato dello strumento. I limiti hard di capacità (come troppi input di riferimento) falliscono prima dell'invio.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw rimappa durata o geometria durante il fallback del provider, i valori restituiti `durationSeconds`, `size`, `aspectRatio` e `resolution` riflettono quanto è stato inviato, e `details.normalization` cattura la traduzione da richiesto ad applicato.

Gli input di riferimento selezionano anche la modalità di runtime:

- Nessun media di riferimento: `generate`
- Qualsiasi immagine di riferimento: `imageToVideo`
- Qualsiasi video di riferimento: `videoToVideo`
- Gli input audio di riferimento non cambiano la modalità risolta; si applicano sopra qualunque modalità selezionata dai riferimenti immagine/video e funzionano solo con provider che dichiarano `maxInputAudios`

I riferimenti immagine e video misti non costituiscono una superficie di capacità condivisa stabile.
Preferisci un tipo di riferimento per richiesta.

#### Fallback e opzioni tipizzate

Alcuni controlli di capacità vengono applicati al livello di fallback anziché al
confine dello strumento, così una richiesta che supera i limiti del provider primario
può comunque essere eseguita su un fallback capace:

- Se il candidato attivo non dichiara `maxInputAudios` (oppure lo dichiara come
  `0`), viene saltato quando la richiesta contiene riferimenti audio e si prova
  il candidato successivo.
- Se `maxDurationSeconds` del candidato attivo è inferiore al valore richiesto
  `durationSeconds` e il candidato non dichiara una lista
  `supportedDurationSeconds`, viene saltato.
- Se la richiesta contiene `providerOptions` e il candidato attivo
  dichiara esplicitamente uno schema tipizzato `providerOptions`, il candidato viene
  saltato quando le chiavi fornite non sono nello schema o i tipi dei valori non
  corrispondono. I provider che non hanno ancora dichiarato uno schema ricevono le
  opzioni così come sono (pass-through retrocompatibile). Un provider può
  esplicitamente escludere tutte le provider options dichiarando uno schema vuoto
  (`capabilities.providerOptions: {}`), che causa lo stesso skip di un
  mismatch di tipo.

Il primo motivo di skip in una richiesta viene loggato a livello `warn` così gli operatori vedono
quando il loro provider primario è stato superato; gli skip successivi vengono loggati a
`debug` per mantenere silenziose le lunghe catene di fallback. Se ogni candidato viene saltato,
l'errore aggregato include il motivo di skip per ciascuno.

## Azioni

- **generate** (predefinita) -- crea un video dal prompt fornito e dagli eventuali input di riferimento.
- **status** -- controlla lo stato del task video in corso per la sessione corrente senza avviare un'altra generazione.
- **list** -- mostra provider, modelli e relative capacità disponibili.

## Selezione del modello

Quando genera un video, OpenClaw risolve il modello in questo ordine:

1. **Parametro dello strumento `model`** -- se l'agente ne specifica uno nella chiamata.
2. **`videoGenerationModel.primary`** -- dalla configurazione.
3. **`videoGenerationModel.fallbacks`** -- provati in ordine.
4. **Rilevamento automatico** -- usa i provider che hanno auth valida, partendo dal provider predefinito corrente e poi dai provider rimanenti in ordine alfabetico.

Se un provider fallisce, il candidato successivo viene provato automaticamente. Se tutti i candidati falliscono, l'errore include i dettagli di ogni tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi
che la generazione video usi solo le voci esplicite `model`, `primary` e `fallbacks`.

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

<AccordionGroup>
  <Accordion title="Alibaba">
    Usa l'endpoint asincrono DashScope / Model Studio. Immagini e video di riferimento devono essere URL remoti `http(s)`.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    ID provider: `byteplus`.

    Modelli: `seedance-1-0-pro-250528` (predefinito), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    I modelli T2V (`*-t2v-*`) non accettano input immagine; i modelli I2V e i modelli generali `*-pro-*` supportano una singola immagine di riferimento (primo frame). Passa l'immagine in posizione oppure imposta `role: "first_frame"`. Gli ID dei modelli T2V vengono automaticamente cambiati alla variante I2V corrispondente quando viene fornita un'immagine.

    Chiavi `providerOptions` supportate: `seed` (number), `draft` (boolean — forza 480p), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    Richiede il Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID provider: `byteplus-seedance15`. Modello: `seedance-1-5-pro-251215`.

    Usa l'API unificata `content[]`. Supporta al massimo 2 immagini di input (`first_frame` + `last_frame`). Tutti gli input devono essere URL remoti `https://`. Imposta `role: "first_frame"` / `"last_frame"` su ciascuna immagine, oppure passa le immagini in posizione.

    `aspectRatio: "adaptive"` rileva automaticamente il rapporto dall'immagine di input. `audio: true` viene mappato a `generate_audio`. `providerOptions.seed` (number) viene inoltrato.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    Richiede il Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID provider: `byteplus-seedance2`. Modelli: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Usa l'API unificata `content[]`. Supporta fino a 9 immagini di riferimento, 3 video di riferimento e 3 audio di riferimento. Tutti gli input devono essere URL remoti `https://`. Imposta `role` su ogni asset — valori supportati: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` rileva automaticamente il rapporto dall'immagine di input. `audio: true` viene mappato a `generate_audio`. `providerOptions.seed` (number) viene inoltrato.

  </Accordion>

  <Accordion title="ComfyUI">
    Esecuzione locale o cloud guidata da workflow. Supporta text-to-video e image-to-video tramite il grafo configurato.
  </Accordion>

  <Accordion title="fal">
    Usa un flusso supportato da coda per job di lunga durata. Solo una singola immagine di riferimento.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Supporta un'immagine o un video di riferimento.
  </Accordion>

  <Accordion title="MiniMax">
    Solo una singola immagine di riferimento.
  </Accordion>

  <Accordion title="OpenAI">
    Viene inoltrato solo l'override `size`. Gli altri override di stile (`aspectRatio`, `resolution`, `audio`, `watermark`) vengono ignorati con un avviso.
  </Accordion>

  <Accordion title="Qwen">
    Stesso backend DashScope di Alibaba. Gli input di riferimento devono essere URL remoti `http(s)`; i file locali vengono rifiutati in anticipo.
  </Accordion>

  <Accordion title="Runway">
    Supporta file locali tramite data URI. Video-to-video richiede `runway/gen4_aleph`. Le esecuzioni solo testo espongono i rapporti d'aspetto `16:9` e `9:16`.
  </Accordion>

  <Accordion title="Together">
    Solo una singola immagine di riferimento.
  </Accordion>

  <Accordion title="Vydra">
    Usa direttamente `https://www.vydra.ai/api/v1` per evitare redirect che eliminano l'auth. `veo3` è incluso solo come text-to-video; `kling` richiede un URL immagine remoto.
  </Accordion>

  <Accordion title="xAI">
    Supporta flussi text-to-video, image-to-video e di modifica/estensione di video remoti.
  </Accordion>
</AccordionGroup>

## Modalità di capacità del provider

Il contratto condiviso di generazione video ora permette ai provider di dichiarare capacità specifiche per modalità invece di soli limiti aggregati piatti. Le nuove implementazioni dei provider dovrebbero preferire blocchi di modalità espliciti:

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
esplicitamente `generate`, `imageToVideo` e `videoToVideo` così i test live,
i test di contratto e lo strumento condiviso `video_generate` possono validare il supporto delle modalità
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

Questo file live carica le variabili env mancanti del provider da `~/.profile`, preferisce
per impostazione predefinita chiavi API live/env rispetto ai profili auth memorizzati e usa uno smoke sicuro per il rilascio:

- `generate` per ogni provider non-FAL nello sweep
- prompt di un'aragosta di un secondo
- limite di operazione per provider da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` per impostazione predefinita)

FAL è opt-in perché la latenza della coda lato provider può dominare il tempo di rilascio:

```bash
pnpm test:live:media video --video-providers fal
```

Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità di trasformazione dichiarate che lo sweep condiviso può esercitare in sicurezza con media locali:

- `imageToVideo` quando `capabilities.imageToVideo.enabled`
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e il provider/modello
  accetta input video locale supportato da buffer nello sweep condiviso

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
- [Attività in background](/it/automation/tasks) -- monitoraggio dei task per la generazione video asincrona
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
- [Riferimento configurazione](/it/gateway/config-agents#agent-defaults)
- [Modelli](/it/concepts/models)
