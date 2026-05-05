---
read_when:
    - Generazione di video tramite l'agente
    - Configurazione dei provider e dei modelli per la generazione video
    - Comprendere i parametri dello strumento video_generate
sidebarTitle: Video generation
summary: Genera video tramite video_generate da riferimenti testuali, immagini o video su 16 backend di provider
title: Generazione video
x-i18n:
    generated_at: "2026-05-05T01:51:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6edce39c3006b748d512fec935b81566ae1a121c280248e9e9439edd1f052d83
    source_path: tools/video-generation.md
    workflow: 16
---

Gli agenti OpenClaw possono generare video da prompt testuali, immagini di riferimento o
video esistenti. Sono supportati sedici backend di fornitori, ciascuno con
opzioni di modello, modalità di input e set di funzionalità diversi. L'agente sceglie
automaticamente il fornitore corretto in base alla tua configurazione e alle chiavi API
disponibili.

<Note>
Lo strumento `video_generate` compare solo quando è disponibile almeno un fornitore
di generazione video. Se non lo vedi tra gli strumenti del tuo agente, imposta una
chiave API del fornitore o configura `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw tratta la generazione video come tre modalità di runtime:

- `generate` — richieste text-to-video senza media di riferimento.
- `imageToVideo` — la richiesta include una o più immagini di riferimento.
- `videoToVideo` — la richiesta include uno o più video di riferimento.

I fornitori possono supportare qualsiasi sottoinsieme di queste modalità. Lo strumento convalida la
modalità attiva prima dell'invio e segnala le modalità supportate in `action=list`.

## Avvio rapido

<Steps>
  <Step title="Configura l'autenticazione">
    Imposta una chiave API per qualsiasi fornitore supportato:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Scegli un modello predefinito (facoltativo)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Chiedi all'agente">
    > Genera un video cinematografico di 5 secondi di un'aragosta amichevole che fa surf al tramonto.

    L'agente chiama automaticamente `video_generate`. Non è necessario alcun elenco di strumenti consentiti.

  </Step>
</Steps>

## Come funziona la generazione asincrona

La generazione video è asincrona. Quando l'agente chiama `video_generate` in una
sessione:

1. OpenClaw invia la richiesta al fornitore e restituisce immediatamente un id attività.
2. Il fornitore elabora il job in background (di solito da 30 secondi a 5 minuti, a seconda del fornitore e della risoluzione).
3. Quando il video è pronto, OpenClaw riattiva la stessa sessione con un evento interno di completamento.
4. L'agente informa l'utente e allega il video completato. Nelle chat di gruppo/canale
   che usano una consegna visibile solo tramite strumento messaggi, l'agente inoltra il
   risultato tramite lo strumento messaggi invece di farlo pubblicare direttamente da OpenClaw.

Mentre un job è in corso, le chiamate `video_generate` duplicate nella stessa
sessione restituiscono lo stato dell'attività corrente invece di avviare un'altra
generazione. Usa `openclaw tasks list` o `openclaw tasks show <taskId>` per
controllare l'avanzamento dalla CLI.

Al di fuori delle esecuzioni agente con sessione di supporto (per esempio, invocazioni dirette di strumenti),
lo strumento ripiega sulla generazione inline e restituisce il percorso finale del media
nello stesso turno.

I file video generati vengono salvati nello storage media gestito da OpenClaw quando
il fornitore restituisce byte. Il limite di salvataggio predefinito per i video generati segue
il limite dei media video, e `agents.defaults.mediaMaxMb` lo aumenta per
render più grandi. Quando un fornitore restituisce anche un URL di output ospitato, OpenClaw
può consegnare quell'URL invece di far fallire l'attività se la persistenza locale
rifiuta un file sovradimensionato.

### Ciclo di vita dell'attività

| Stato       | Significato                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| `queued`    | Attività creata, in attesa che il fornitore la accetti.                                             |
| `running`   | Il fornitore sta elaborando (di solito da 30 secondi a 5 minuti, a seconda del fornitore e della risoluzione). |
| `succeeded` | Video pronto; l'agente si riattiva e lo pubblica nella conversazione.                               |
| `failed`    | Errore o timeout del fornitore; l'agente si riattiva con i dettagli dell'errore.                    |

Controlla lo stato dalla CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Se un'attività video è già `queued` o `running` per la sessione corrente,
`video_generate` restituisce lo stato dell'attività esistente invece di avviarne una nuova.
Usa `action: "status"` per controllare esplicitamente senza attivare una nuova
generazione.

## Fornitori supportati

| Fornitore             | Modello predefinito            | Testo | Rif. immagine                                      | Rif. video                                     | Autenticazione                          |
| --------------------- | ------------------------------ | :---: | -------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                   |  ✓    | Sì (URL remoto)                                    | Sì (URL remoto)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`      |  ✓    | Fino a 2 immagini (solo modelli I2V; primo + ultimo fotogramma) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`      |  ✓    | Fino a 2 immagini (primo + ultimo fotogramma tramite ruolo) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` |  ✓    | Fino a 9 immagini di riferimento                  | Fino a 3 video                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                     |  ✓    | 1 immagine                                         | —                                               | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`        |  ✓    | —                                                  | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live` |  ✓    | 1 immagine; fino a 9 con Seedance reference-to-video | Fino a 3 video con Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 immagine                                         | 1 video                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`           |  ✓    | 1 immagine                                         | —                                               | `MINIMAX_API_KEY` o MiniMax OAuth       |
| OpenAI                | `sora-2`                       |  ✓    | 1 immagine                                         | 1 video                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`          |  ✓    | Fino a 4 immagini (primo/ultimo fotogramma o riferimenti) | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                   |  ✓    | Sì (URL remoto)                                    | Sì (URL remoto)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                       |  ✓    | 1 immagine                                         | 1 video                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`       |  ✓    | 1 immagine                                         | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                         |  ✓    | 1 immagine (`kling`)                               | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`           |  ✓    | 1 immagine del primo fotogramma o fino a 7 `reference_image` | 1 video                                        | `XAI_API_KEY`                            |

Alcuni fornitori accettano variabili d'ambiente aggiuntive o alternative per le chiavi API. Consulta
le singole [pagine dei fornitori](#related) per i dettagli.

Esegui `video_generate action=list` per ispezionare fornitori, modelli e
modalità di runtime disponibili durante l'esecuzione.

### Matrice delle capacità

Il contratto di modalità esplicito usato da `video_generate`, dai test di contratto e
dallo sweep live condiviso:

| Fornitore  | `generate` | `imageToVideo` | `videoToVideo` | Lane live condivise oggi                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo fornitore richiede URL video `http(s)` remoti                           |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| ComfyUI    |     ✓      |       ✓        |       —        | Non incluso nello sweep condiviso; la copertura specifica del workflow vive con i test Comfy                                             |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; gli schemi video nativi di DeepInfra sono text-to-video nel contratto incluso                                                |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` solo quando si usa Seedance reference-to-video                                                |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` condiviso saltato perché lo sweep Gemini/Veo attuale basato su buffer non accetta quell'input |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` condiviso saltato perché questo percorso org/input attualmente richiede accesso inpaint/remix lato fornitore |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo fornitore richiede URL video `http(s)` remoti                           |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` viene eseguito solo quando il modello selezionato è `runway/gen4_aleph`                       |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; `imageToVideo` condiviso saltato perché `veo3` incluso è solo testuale e `kling` incluso richiede un URL immagine remoto     |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo fornitore attualmente richiede un URL MP4 remoto                        |

## Parametri dello strumento

### Obbligatori

<ParamField path="prompt" type="string" required>
  Descrizione testuale del video da generare. Obbligatoria per `action: "generate"`.
</ParamField>

### Input di contenuto

<ParamField path="image" type="string">Singola immagine di riferimento (percorso o URL).</ParamField>
<ParamField path="images" type="string[]">Più immagini di riferimento (fino a 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Suggerimenti opzionali di ruolo per posizione, paralleli all'elenco combinato delle immagini.
Valori canonici: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Singolo video di riferimento (percorso o URL).</ParamField>
<ParamField path="videos" type="string[]">Più video di riferimento (fino a 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Suggerimenti opzionali di ruolo per posizione, paralleli all'elenco combinato dei video.
Valore canonico: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Singolo audio di riferimento (percorso o URL). Usato per musica di sottofondo o come
riferimento vocale quando il fornitore supporta gli input audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Più audio di riferimento (fino a 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Suggerimenti opzionali di ruolo per posizione, paralleli all'elenco combinato degli audio.
Valore canonico: `reference_audio`.
</ParamField>

<Note>
I suggerimenti di ruolo vengono inoltrati al fornitore così come sono. I valori canonici provengono
dall'unione `VideoGenerationAssetRole`, ma i fornitori possono accettare stringhe di ruolo
aggiuntive. Gli array `*Roles` non devono avere più voci dell'elenco di riferimento
corrispondente; gli errori di una posizione in più o in meno falliscono con un errore chiaro.
Usa una stringa vuota per lasciare uno slot non impostato. Per xAI, imposta ogni ruolo immagine su
`reference_image` per usare la sua modalità di generazione `reference_images`; ometti il
ruolo o usa `first_frame` per la conversione da singola immagine a video.
</Note>

### Controlli di stile

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, oppure `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, oppure `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Durata target in secondi (arrotondata al valore più vicino supportato dal fornitore).
</ParamField>
<ParamField path="size" type="string">Suggerimento di dimensione quando il fornitore lo supporta.</ParamField>
<ParamField path="audio" type="boolean">
  Abilita l'audio generato nell'output quando supportato. Distinto da `audioRef*` (input).
</ParamField>
<ParamField path="watermark" type="boolean">Attiva o disattiva la filigrana del fornitore quando supportata.</ParamField>

`adaptive` è un sentinella specifico del fornitore: viene inoltrato così com'è ai
fornitori che dichiarano `adaptive` nelle proprie capacità (per esempio BytePlus
Seedance lo usa per rilevare automaticamente il rapporto dalle dimensioni
dell'immagine di input). I fornitori che non lo dichiarano espongono il valore tramite
`details.ignoredOverrides` nel risultato dello strumento, così l'esclusione è visibile.

### Avanzate

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` restituisce l'attività della sessione corrente; `"list"` ispeziona i fornitori.
</ParamField>
<ParamField path="model" type="string">Sovrascrittura fornitore/modello (per esempio `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Suggerimento per il nome file di output.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout opzionale della richiesta al fornitore in millisecondi.</ParamField>
<ParamField path="providerOptions" type="object">
  Opzioni specifiche del fornitore come oggetto JSON (per esempio `{"seed": 42, "draft": true}`).
  I fornitori che dichiarano uno schema tipizzato convalidano chiavi e tipi; chiavi
  sconosciute o discrepanze saltano il candidato durante il ripiego. I fornitori senza uno
  schema dichiarato ricevono le opzioni così come sono. Esegui `video_generate action=list`
  per vedere che cosa accetta ogni fornitore.
</ParamField>

<Note>
Non tutti i fornitori supportano tutti i parametri. OpenClaw normalizza la durata al
valore supportato più vicino del fornitore e rimappa i suggerimenti di geometria tradotti,
come da dimensione a rapporto d'aspetto, quando un fornitore di ripiego espone una
superficie di controllo diversa. Le sovrascritture davvero non supportate vengono ignorate
al meglio possibile e segnalate come avvisi nel risultato dello strumento. I limiti rigidi
di capacità (come troppi input di riferimento) falliscono prima dell'invio. I risultati
dello strumento riportano le impostazioni applicate; `details.normalization` acquisisce
qualsiasi traduzione da richiesto ad applicato.
</Note>

Gli input di riferimento selezionano la modalità di runtime:

- Nessun supporto di riferimento → `generate`
- Qualsiasi riferimento immagine → `imageToVideo`
- Qualsiasi riferimento video → `videoToVideo`
- Gli input audio di riferimento **non** cambiano la modalità risolta; si applicano
  sopra qualsiasi modalità selezionata dai riferimenti immagine/video e funzionano solo
  con fornitori che dichiarano `maxInputAudios`.

I riferimenti misti immagine e video non sono una superficie di capacità condivisa stabile.
Preferisci un solo tipo di riferimento per richiesta.

#### Ripiego e opzioni tipizzate

Alcuni controlli di capacità vengono applicati al livello di ripiego anziché al
confine dello strumento, quindi una richiesta che supera i limiti del fornitore primario può
comunque essere eseguita su un ripiego capace:

- Il candidato attivo che non dichiara `maxInputAudios` (o dichiara `0`) viene saltato quando
  la richiesta contiene riferimenti audio; viene provato il candidato successivo.
- Il `maxDurationSeconds` del candidato attivo è inferiore al `durationSeconds` richiesto
  senza un elenco `supportedDurationSeconds` dichiarato → saltato.
- La richiesta contiene `providerOptions` e il candidato attivo dichiara esplicitamente
  uno schema `providerOptions` tipizzato → saltato se le chiavi fornite non sono
  nello schema o i tipi di valore non corrispondono. I fornitori senza uno
  schema dichiarato ricevono le opzioni così come sono (pass-through retrocompatibile).
  Un fornitore può rinunciare a tutte le opzioni del fornitore dichiarando uno schema vuoto
  (`capabilities.providerOptions: {}`), che causa lo stesso salto di una discrepanza di tipo.

Il primo motivo di salto in una richiesta viene registrato a `warn`, così gli operatori vedono quando
il loro fornitore primario è stato superato; i salti successivi vengono registrati a `debug` per
mantenere silenziose le lunghe catene di ripiego. Se ogni candidato viene saltato, l'errore
aggregato include il motivo del salto per ciascuno.

## Azioni

| Azione     | Cosa fa                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Predefinita. Crea un video dal prompt indicato e dagli input di riferimento opzionali.                             |
| `status`   | Controlla lo stato dell'attività video in corso per la sessione corrente senza avviare un'altra generazione. |
| `list`     | Mostra i fornitori disponibili, i modelli e le loro capacità.                                                |

## Selezione del modello

OpenClaw risolve il modello in questo ordine:

1. **Parametro dello strumento `model`** — se l'agente ne specifica uno nella chiamata.
2. **`videoGenerationModel.primary`** dalla configurazione.
3. **`videoGenerationModel.fallbacks`** in ordine.
4. **Rilevamento automatico** — fornitori con autenticazione valida, iniziando dal
   fornitore predefinito corrente, poi i fornitori rimanenti in ordine alfabetico.

Se un fornitore fallisce, viene provato automaticamente il candidato successivo. Se tutti
i candidati falliscono, l'errore include i dettagli di ogni tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` per usare
solo le voci esplicite `model`, `primary` e `fallbacks`.

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

## Note sui fornitori

<AccordionGroup>
  <Accordion title="Alibaba">
    Usa l'endpoint asincrono DashScope / Model Studio. Le immagini e i
    video di riferimento devono essere URL remoti `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID fornitore: `byteplus`.

    Modelli: `seedance-1-0-pro-250528` (predefinito),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    I modelli T2V (`*-t2v-*`) non accettano input immagine; i modelli I2V e
    i modelli generali `*-pro-*` supportano una singola immagine di riferimento (primo
    fotogramma). Passa l'immagine in posizione o imposta `role: "first_frame"`.
    Gli ID dei modelli T2V vengono automaticamente cambiati nella variante I2V
    corrispondente quando viene fornita un'immagine.

    Chiavi `providerOptions` supportate: `seed` (numero), `draft` (booleano —
    forza 480p), `camera_fixed` (booleano).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Richiede il Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID fornitore: `byteplus-seedance15`. Modello:
    `seedance-1-5-pro-251215`.

    Usa l'API unificata `content[]`. Supporta al massimo 2 immagini di input
    (`first_frame` + `last_frame`). Tutti gli input devono essere URL remoti `https://`.
    Imposta `role: "first_frame"` / `"last_frame"` su ogni immagine, oppure
    passa le immagini in posizione.

    `aspectRatio: "adaptive"` rileva automaticamente il rapporto dall'immagine di input.
    `audio: true` viene mappato a `generate_audio`. `providerOptions.seed`
    (numero) viene inoltrato.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Richiede il Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID fornitore: `byteplus-seedance2`. Modelli:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Usa l'API unificata `content[]`. Supporta fino a 9 immagini di riferimento,
    3 video di riferimento e 3 audio di riferimento. Tutti gli input devono essere URL remoti
    `https://`. Imposta `role` su ogni risorsa — valori supportati:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` rileva automaticamente il rapporto dall'immagine di input.
    `audio: true` viene mappato a `generate_audio`. `providerOptions.seed`
    (numero) viene inoltrato.

  </Accordion>
  <Accordion title="ComfyUI">
    Esecuzione locale o cloud guidata da workflow. Supporta da testo a video e
    da immagine a video tramite il grafo configurato.
  </Accordion>
  <Accordion title="fal">
    Usa un flusso basato su coda per lavori di lunga durata. La maggior parte dei modelli video fal
    accetta un singolo riferimento immagine. I modelli Seedance 2.0 da riferimento a video
    accettano fino a 9 immagini, 3 video e 3 riferimenti audio, con
    al massimo 12 file di riferimento totali.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Supporta un riferimento immagine o un riferimento video.
  </Accordion>
  <Accordion title="MiniMax">
    Solo singolo riferimento immagine.
  </Accordion>
  <Accordion title="OpenAI">
    Viene inoltrata solo la sovrascrittura `size`. Le altre sovrascritture di stile
    (`aspectRatio`, `resolution`, `audio`, `watermark`) vengono ignorate con
    un avviso.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa l'API asincrona `/videos` di OpenRouter. OpenClaw invia il
    lavoro, interroga `polling_url` e scarica `unsigned_urls` oppure
    l'endpoint documentato del contenuto del lavoro. Il predefinito incluso `google/veo-3.1-fast`
    dichiara durate di 4/6/8 secondi, risoluzioni `720P`/`1080P` e
    rapporti d'aspetto `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Stesso backend DashScope di Alibaba. Gli input di riferimento devono essere URL remoti
    `http(s)`; i file locali vengono rifiutati in anticipo.
  </Accordion>
  <Accordion title="Runway">
    Supporta file locali tramite URI dati. Da video a video richiede
    `runway/gen4_aleph`. Le esecuzioni solo testo espongono rapporti d'aspetto
    `16:9` e `9:16`.
  </Accordion>
  <Accordion title="Together">
    Solo singolo riferimento immagine.
  </Accordion>
  <Accordion title="Vydra">
    Usa direttamente `https://www.vydra.ai/api/v1` per evitare reindirizzamenti
    che eliminano l'autenticazione. `veo3` è incluso solo come da testo a video; `kling` richiede
    un URL immagine remoto.
  </Accordion>
  <Accordion title="xAI">
    Supporta da testo a video, da singolo primo fotogramma a video, fino a 7
    input `reference_image` tramite `reference_images` di xAI e flussi remoti
    di modifica/estensione video.
  </Accordion>
</AccordionGroup>

## Modalità di capacità dei fornitori

Il contratto condiviso per la generazione video supporta capacità specifiche per modalità invece dei soli limiti aggregati piatti. Le nuove implementazioni dei provider dovrebbero preferire blocchi di modalità espliciti:

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
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
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

I campi aggregati piatti come `maxInputImages` e `maxInputVideos` **non** sono sufficienti per dichiarare il supporto alle modalità di trasformazione. I provider dovrebbero dichiarare esplicitamente `generate`, `imageToVideo` e `videoToVideo` in modo che i test live, i test di contratto e lo strumento condiviso `video_generate` possano validare deterministicamente il supporto delle modalità.

Quando un modello in un provider supporta input di riferimento più ampi rispetto agli altri, usa `maxInputImagesByModel`, `maxInputVideosByModel` o `maxInputAudiosByModel` invece di aumentare il limite dell'intera modalità.

## Test live

Copertura live opzionale per i provider integrati condivisi:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper del repository:

```bash
pnpm test:live:media video
```

Questo file live carica le variabili d'ambiente mancanti dei provider da `~/.profile`, preferisce per impostazione predefinita le chiavi API live/da ambiente rispetto ai profili di autenticazione archiviati ed esegue per impostazione predefinita uno smoke sicuro per la release:

- `generate` per ogni provider non FAL nella scansione.
- Prompt di un secondo con aragosta.
- Limite di operazioni per provider da
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita).

FAL è opzionale perché la latenza della coda lato provider può dominare il tempo di release:

```bash
pnpm test:live:media video --video-providers fal
```

Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità di trasformazione dichiarate che la scansione condivisa può esercitare in sicurezza con media locali:

- `imageToVideo` quando `capabilities.imageToVideo.enabled`.
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e il
  provider/modello accetta input video locale basato su buffer nella scansione condivisa.

Oggi la corsia live condivisa `videoToVideo` copre `runway` solo quando selezioni `runway/gen4_aleph`.

## Configurazione

Imposta il modello predefinito di generazione video nella configurazione di OpenClaw:

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

- [Alibaba Model Studio](/it/providers/alibaba)
- [Attività in background](/it/automation/tasks) — monitoraggio delle attività per la generazione video asincrona
- [BytePlus](/it/concepts/model-providers#byteplus-international)
- [ComfyUI](/it/providers/comfy)
- [Riferimento di configurazione](/it/gateway/config-agents#agent-defaults)
- [fal](/it/providers/fal)
- [Google (Gemini)](/it/providers/google)
- [MiniMax](/it/providers/minimax)
- [Modelli](/it/concepts/models)
- [OpenAI](/it/providers/openai)
- [Qwen](/it/providers/qwen)
- [Runway](/it/providers/runway)
- [Together AI](/it/providers/together)
- [Panoramica degli strumenti](/it/tools)
- [Vydra](/it/providers/vydra)
- [xAI](/it/providers/xai)
