---
read_when:
    - Generazione di video tramite l'agente
    - Configurazione dei provider e dei modelli per la generazione di video
    - Comprendere i parametri dello strumento video_generate
sidebarTitle: Video generation
summary: Genera video tramite video_generate a partire da riferimenti testuali, immagini o video usando 16 backend di provider
title: Generazione di video
x-i18n:
    generated_at: "2026-07-12T07:35:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

Gli agenti OpenClaw generano video da prompt testuali, immagini di riferimento o
video esistenti tramite `video_generate`. Sono supportati sedici backend di
provider; l'agente seleziona automaticamente quello appropriato in base alla configurazione e
alle chiavi API disponibili.

<Note>
`video_generate` compare solo quando è disponibile almeno un provider per la
generazione di video. Se non è presente tra gli strumenti dell'agente, imposta una chiave API del provider o
configura `agents.defaults.videoGenerationModel`.
</Note>

`video_generate` dispone di tre modalità di runtime, determinate dagli input di riferimento
nella chiamata:

- `generate` - nessun contenuto multimediale di riferimento (da testo a video).
- `imageToVideo` - una o più immagini di riferimento.
- `videoToVideo` - uno o più video di riferimento.

I provider possono supportare qualsiasi sottoinsieme di queste modalità. Lo strumento convalida la
modalità attiva prima dell'invio e indica le modalità supportate in `action=list`.

## Avvio rapido

<Steps>
  <Step title="Configura l'autenticazione">
    Imposta una chiave API per qualsiasi provider supportato:

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

    L'agente chiama automaticamente `video_generate`. Non è necessario inserire
    lo strumento in un elenco di elementi consentiti.

  </Step>
</Steps>

## Funzionamento della generazione asincrona

La generazione di video è asincrona:

1. OpenClaw invia la richiesta al provider e restituisce immediatamente un ID attività.
2. Il provider elabora il processo in background (in genere da 30 secondi a diversi minuti, a seconda del provider e della risoluzione; i provider più lenti basati su coda possono impiegare fino al timeout configurato).
3. Quando il video è pronto, OpenClaw riattiva la stessa sessione con un evento interno di completamento.
4. L'agente lo comunica tramite la normale modalità di risposta visibile della sessione:
   una risposta finale automatica oppure `message(action="send")` quando la sessione richiede
   lo strumento di messaggistica. Se la sessione del richiedente è inattiva, oppure la sua riattivazione non riesce e
   il contenuto multimediale generato non è ancora presente nella risposta di completamento, OpenClaw invia
   direttamente un fallback idempotente con il contenuto multimediale.

Mentre un processo è in corso, le chiamate duplicate a `video_generate` nella stessa
sessione restituiscono lo stato dell'attività corrente anziché avviare un'altra
generazione. Usa `action: "status"` per verificare lo stato senza attivare una nuova
generazione, oppure `openclaw tasks list` / `openclaw tasks show <lookup>` dalla
CLI (consulta [Attività in background](/it/automation/tasks)).

Al di fuori delle esecuzioni dell'agente basate su sessione (ad esempio, nelle invocazioni dirette dello strumento),
lo strumento utilizza come fallback la generazione in linea e restituisce il percorso finale del contenuto multimediale
nello stesso turno.

Quando il provider restituisce byte, i file video generati vengono salvati nell'archivio multimediale gestito da OpenClaw.
Il limite predefinito è 16 MB (il limite condiviso per i contenuti multimediali video);
`agents.defaults.mediaMaxMb` consente di aumentarlo per rendering più grandi. Quando un
provider restituisce anche un URL di output ospitato, OpenClaw distribuisce tale URL anziché
segnalare l'attività come non riuscita se la persistenza locale rifiuta un file di dimensioni eccessive.

### Ciclo di vita dell'attività

| Stato       | Significato                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Attività creata, in attesa che il provider la accetti.                                                 |
| `running`   | Il provider è in fase di elaborazione (in genere da 30 secondi a diversi minuti, a seconda del provider e della risoluzione). |
| `succeeded` | Video pronto; l'agente si riattiva e lo pubblica nella conversazione.                                  |
| `failed`    | Errore del provider o timeout; l'agente si riattiva con i dettagli dell'errore.                         |

Verifica lo stato dalla CLI:

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## Provider supportati

| Provider              | Modello predefinito              | Testo | Rif. immagine                                        | Rif. video                                      | Autenticazione                           |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Sì (URL remoto)                                      | Sì (URL remoto)                                 | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Fino a 2 immagini (solo modelli I2V; primo + ultimo fotogramma) | -                                      | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Fino a 2 immagini (primo + ultimo fotogramma tramite ruolo) | -                                          | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Fino a 9 immagini di riferimento                     | Fino a 3 video                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 immagine                                           | -                                               | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`  |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 immagine; fino a 9 con la conversione da riferimento a video di Seedance | Fino a 3 video con la conversione da riferimento a video di Seedance | `FAL_KEY` |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 immagine                                           | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 immagine                                           | -                                               | `MINIMAX_API_KEY` o OAuth di MiniMax     |
| OpenAI                | `sora-2`                        |  ✓   | 1 immagine                                           | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Fino a 4 immagini (primo/ultimo fotogramma o riferimenti) | -                                          | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Sì (URL remoto)                                      | Sì (URL remoto)                                 | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 immagine                                           | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | Solo `Wan-AI/Wan2.2-I2V-A14B`                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 immagine (`kling`)                                 | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | Classico: 1 primo fotogramma o 7 riferimenti; 1.5: 1 fotogramma | Classico: 1 video                         | `XAI_API_KEY`                            |

Alcuni provider accettano variabili di ambiente aggiuntive o alternative per la chiave API. Consulta
le singole [pagine dei provider](#related) per i dettagli.

Esegui `video_generate action=list` per esaminare durante il runtime i provider, i modelli e
le modalità di runtime disponibili.

### Matrice delle funzionalità

Il contratto esplicito delle modalità utilizzato da `video_generate`, dai test del contratto e
dall'analisi live condivisa:

| Provider   | `generate` | `imageToVideo` | `videoToVideo` | Percorsi live condivisi attuali                                                                                                         |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` viene ignorato perché questo provider richiede URL video `http(s)` remoti                     |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | Non incluso nell'analisi condivisa; la copertura specifica del flusso di lavoro è inclusa nei test di Comfy                              |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; gli schemi video nativi di DeepInfra sono da testo a video nel contratto del plugin                                          |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` solo quando si utilizza la conversione da riferimento a video di Seedance                     |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` condiviso viene ignorato perché l'analisi Gemini/Veo corrente basata su buffer non accetta tale input |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` condiviso viene ignorato perché il percorso attuale di questa organizzazione/input richiede l'accesso alla modifica video lato provider |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` viene ignorato perché questo provider richiede URL video `http(s)` remoti                     |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` viene eseguito solo quando il modello selezionato è `runway/gen4_aleph`                       |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; `imageToVideo` condiviso viene ignorato perché il modello `veo3` incluso supporta solo il testo e `kling` incluso richiede un URL immagine remoto |
| xAI        |     ✓      |       ✓        |       ✓        | La versione classica supporta tutte le modalità; Video 1.5 supporta solo la conversione da immagine a video; l'input MP4 remoto esclude `videoToVideo` dall'analisi condivisa |

## Parametri dello strumento

### Obbligatori

<ParamField path="prompt" type="string" required>
  Descrizione testuale del video da generare. Obbligatoria per `action: "generate"`.
</ParamField>

### Input dei contenuti

<ParamField path="image" type="string">Singola immagine di riferimento (percorso o URL).</ParamField>
<ParamField path="images" type="string[]">Più immagini di riferimento (fino a 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Indicazioni facoltative sul ruolo per posizione, parallele all'elenco combinato delle immagini.
Valori canonici: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Singolo video di riferimento (percorso o URL).</ParamField>
<ParamField path="videos" type="string[]">Più video di riferimento (fino a 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Indicazioni facoltative sul ruolo per posizione, parallele all'elenco combinato dei video.
Valore canonico: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Singolo audio di riferimento (percorso o URL). Utilizzato per la musica di sottofondo o come
riferimento vocale quando il provider supporta input audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Più audio di riferimento (fino a 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Indicazioni facoltative sul ruolo per posizione, parallele all'elenco combinato degli audio.
Valore canonico: `reference_audio`.
</ParamField>

<Note>
Le indicazioni sui ruoli vengono inoltrate al provider così come sono. I valori canonici provengono
dall'unione `VideoGenerationAssetRole`, ma i provider possono accettare ulteriori
stringhe di ruolo. Gli array `*Roles` non devono contenere più voci del
corrispondente elenco di riferimenti; gli errori di una posizione generano un messaggio di errore chiaro.
Utilizzare una stringa vuota per lasciare una posizione non impostata. Per xAI, impostare ogni ruolo immagine su
`reference_image` per utilizzare la modalità di generazione `reference_images`; omettere il
ruolo oppure utilizzare `first_frame` per la conversione da immagine singola a video.
</Note>

### Controlli dello stile

<ParamField path="aspectRatio" type="string">
  Indicazione delle proporzioni, ad esempio `1:1`, `16:9`, `9:16`, `adaptive` o un valore specifico del provider. OpenClaw normalizza o ignora i valori non supportati in base al provider.
</ParamField>
<ParamField path="resolution" type="string">Indicazione della risoluzione, ad esempio `360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K` o un valore specifico del provider. OpenClaw normalizza o ignora i valori non supportati in base al provider.</ParamField>
<ParamField path="durationSeconds" type="number">
  Durata desiderata in secondi (arrotondata al valore supportato dal provider più vicino).
</ParamField>
<ParamField path="size" type="string">Indicazione delle dimensioni quando il provider le supporta.</ParamField>
<ParamField path="audio" type="boolean">
  Abilita l'audio generato nell'output quando supportato. Distinto da `audioRef*` (input).
</ParamField>
<ParamField path="watermark" type="boolean">Attiva o disattiva la filigrana del provider quando supportata.</ParamField>

`adaptive` è un valore sentinella specifico del provider: viene inoltrato così com'è ai
provider che dichiarano `adaptive` nelle proprie funzionalità (ad esempio BytePlus
Seedance lo utilizza per rilevare automaticamente le proporzioni dalle dimensioni
dell'immagine di input). I provider che non lo dichiarano espongono il valore tramite
`details.ignoredOverrides` nel risultato dello strumento, rendendo visibile lo scarto.

### Impostazioni avanzate

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` restituisce l'attività corrente della sessione; `"list"` esamina i provider.
</ParamField>
<ParamField path="model" type="string">Sostituzione di provider/modello (ad esempio `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Indicazione del nome del file di output.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout facoltativo dell'operazione del provider in millisecondi. Se omesso, OpenClaw utilizza `agents.defaults.videoGenerationModel.timeoutMs`, se configurato; in caso contrario, utilizza il valore predefinito del provider definito dal plugin, se disponibile.</ParamField>
<ParamField path="providerOptions" type="object">
  Opzioni specifiche del provider sotto forma di oggetto JSON (ad esempio `{"seed": 42, "draft": true}`).
  I provider che dichiarano uno schema tipizzato convalidano le chiavi e i tipi; le chiavi
  sconosciute o le incompatibilità fanno saltare il candidato durante il fallback. I provider privi di
  uno schema dichiarato ricevono le opzioni così come sono. Eseguire `video_generate action=list`
  per vedere quali opzioni accetta ciascun provider.
</ParamField>

<Note>
Non tutti i provider supportano tutti i parametri. OpenClaw normalizza la durata al
valore supportato dal provider più vicino e rimappa le indicazioni geometriche convertite,
ad esempio dalle dimensioni alle proporzioni, quando un provider di fallback espone
un'interfaccia di controllo diversa. Le sostituzioni realmente non supportate vengono ignorate, ove possibile,
e segnalate come avvisi nel risultato dello strumento. I limiti rigidi delle funzionalità
(ad esempio un numero eccessivo di input di riferimento) causano un errore prima dell'invio. I risultati dello strumento
riportano le impostazioni applicate; `details.normalization` registra qualsiasi
conversione dal valore richiesto a quello applicato.
</Note>

Gli input di riferimento selezionano la modalità di runtime:

- Nessun contenuto multimediale di riferimento -> `generate`
- Qualsiasi immagine di riferimento -> `imageToVideo`
- Qualsiasi video di riferimento -> `videoToVideo`
- Gli input audio di riferimento **non** modificano la modalità risolta; vengono applicati
  alla modalità selezionata dai riferimenti immagine/video e funzionano soltanto
  con i provider che dichiarano `maxInputAudios`.

La combinazione di riferimenti immagine e video non costituisce una superficie di funzionalità condivisa stabile.
È preferibile utilizzare un solo tipo di riferimento per richiesta.

#### Fallback e opzioni tipizzate

Alcuni controlli delle funzionalità vengono applicati al livello di fallback anziché al limite
dello strumento; pertanto, una richiesta che supera i limiti del provider principale può comunque
essere eseguita su un fallback compatibile:

- Un candidato attivo che non dichiara `maxInputAudios` (o dichiara `0`) viene saltato quando
  la richiesta contiene riferimenti audio; viene quindi provato il candidato successivo. La stessa
  protezione si applica al numero di riferimenti immagine e video rispetto a
  `maxInputImages`/`maxInputVideos`.
- Un candidato attivo il cui `maxDurationSeconds` è inferiore al `durationSeconds` richiesto
  e che non dichiara un elenco `supportedDurationSeconds` viene saltato.
- Se la richiesta contiene `providerOptions` e il candidato attivo dichiara esplicitamente
  uno schema `providerOptions` tipizzato, viene saltato se le chiavi fornite non sono
  incluse nello schema o se i tipi dei valori non corrispondono. I provider privi di uno
  schema dichiarato ricevono le opzioni così come sono (passaggio diretto
  compatibile con le versioni precedenti). Un provider può rifiutare tutte le opzioni specifiche del provider
  dichiarando uno schema vuoto (`capabilities.providerOptions: {}`), che
  determina lo stesso salto di un'incompatibilità di tipo.

Il primo motivo di salto in una richiesta viene registrato al livello `warn`, affinché gli operatori vedano quando
il provider principale è stato ignorato; i salti successivi vengono registrati al livello `debug` per
evitare rumore nelle lunghe catene di fallback. Se tutti i candidati vengono saltati,
l'errore aggregato include il motivo del salto per ciascuno di essi.

## Azioni

| Azione     | Funzione                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Impostazione predefinita. Crea un video dal prompt fornito e dagli input di riferimento facoltativi.      |
| `status`   | Controlla lo stato dell'attività video in corso per la sessione corrente senza avviare un'altra generazione. |
| `list`     | Mostra i provider e i modelli disponibili, insieme alle relative funzionalità.                            |

## Selezione del modello

OpenClaw risolve il modello nel seguente ordine:

1. **Parametro dello strumento `model`** - se l'agente ne specifica uno nella chiamata.
2. **`videoGenerationModel.primary`** dalla configurazione.
3. **`videoGenerationModel.fallbacks`** nell'ordine specificato.
4. **Rilevamento automatico** - i provider con autenticazione valida, a partire dal
   provider predefinito corrente, seguiti dai provider rimanenti in ordine alfabetico.

Se un provider non riesce, viene provato automaticamente il candidato successivo. Se tutti
i candidati non riescono, l'errore include i dettagli di ciascun tentativo.

Impostare `agents.defaults.mediaGenerationAutoProviderFallback: false` per utilizzare
soltanto le voci esplicite `model`, `primary` e `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // sostituzione facoltativa del timeout della richiesta al provider per strumento
      },
    },
  },
}
```

## Note sui provider

<AccordionGroup>
  <Accordion title="Alibaba">
    Utilizza l'endpoint asincrono di DashScope / Model Studio. Le immagini e i
    video di riferimento devono essere URL `http(s)` remoti.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID provider: `byteplus`.

    Modelli: `seedance-1-0-pro-250528` (predefinito),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    I modelli T2V (`*-t2v-*`) non accettano input immagine; i modelli I2V e
    i modelli generici `*-pro-*` supportano una singola immagine di riferimento (primo
    fotogramma). Passare l'immagine per posizione oppure impostare `role: "first_frame"`.
    Quando viene fornita un'immagine, gli ID dei modelli T2V vengono sostituiti automaticamente
    con la variante I2V corrispondente.

    Chiavi `providerOptions` supportate: `seed` (numero), `draft` (booleano -
    forza 480p), `camera_fixed` (booleano).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Richiede il plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (esterno, non incluso). ID provider: `byteplus-seedance15`. Modello:
    `seedance-1-5-pro-251215`.

    Utilizza l'API unificata `content[]`. Supporta al massimo 2 immagini di input
    (`first_frame` + `last_frame`). Tutti gli input devono essere URL `https://`
    remoti. Impostare `role: "first_frame"` / `"last_frame"` su ogni immagine oppure
    passare le immagini per posizione.

    `aspectRatio: "adaptive"` rileva automaticamente le proporzioni dall'immagine di input.
    `audio: true` corrisponde a `generate_audio`. `providerOptions.seed`
    (numero) viene inoltrato.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Richiede il plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (esterno, non incluso). ID provider: `byteplus-seedance2`. Modelli:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Utilizza l'API unificata `content[]`. Supporta fino a 9 immagini di riferimento,
    3 video di riferimento e 3 audio di riferimento. Tutti gli input devono essere URL
    `https://` remoti. Impostare `role` su ogni risorsa; i valori supportati sono:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` rileva automaticamente le proporzioni dall'immagine di input.
    `audio: true` corrisponde a `generate_audio`. `providerOptions.seed`
    (numero) viene inoltrato.

  </Accordion>
  <Accordion title="ComfyUI">
    Esecuzione locale o nel cloud basata su flussi di lavoro. Supporta la
    generazione da testo a video e da immagine a video tramite il grafo configurato.
  </Accordion>
  <Accordion title="fal">
    Utilizza un flusso basato su coda per le operazioni di lunga durata. Per
    impostazione predefinita, OpenClaw attende fino a 20 minuti prima di
    considerare scaduta un'operazione nella coda fal ancora in corso. La maggior
    parte dei modelli video fal accetta un singolo riferimento immagine. I
    modelli Seedance 2.0 da riferimento a video accettano fino a 9 immagini,
    3 video e 3 riferimenti audio, per un massimo complessivo di 12 file di
    riferimento.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Supporta un riferimento costituito da un'immagine o da un video. Le richieste
    di generazione audio vengono ignorate con un avviso nel percorso dell'API
    Gemini, perché tale API rifiuta il parametro `generateAudio` per l'attuale
    generazione video Veo.
  </Accordion>
  <Accordion title="MiniMax">
    È consentito un solo riferimento immagine. MiniMax accetta le risoluzioni
    `768P` e `1080P`; richieste come `720P` vengono normalizzate al valore
    supportato più vicino prima dell'invio.
  </Accordion>
  <Accordion title="OpenAI">
    Viene inoltrata solo la sostituzione di `size`. Le altre sostituzioni di stile
    (`aspectRatio`, `resolution`, `audio`, `watermark`) vengono ignorate con
    un avviso.
  </Accordion>
  <Accordion title="OpenRouter">
    Utilizza l'API asincrona `/videos` di OpenRouter. OpenClaw invia
    l'operazione, interroga periodicamente `polling_url` e scarica
    `unsigned_urls` oppure l'endpoint documentato del contenuto dell'operazione.
    Il modello predefinito incluso `google/veo-3.1-fast` dichiara durate di
    4/6/8 secondi, risoluzioni `720P`/`1080P` e proporzioni
    `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Utilizza lo stesso backend DashScope di Alibaba. Gli input di riferimento
    devono essere URL `http(s)` remoti; i file locali vengono rifiutati
    preventivamente.
  </Accordion>
  <Accordion title="Runway">
    Supporta i file locali tramite URI di dati. La conversione da video a video
    richiede `runway/gen4_aleph`. Le esecuzioni basate solo su testo offrono
    proporzioni `16:9` e `9:16`.
  </Accordion>
  <Accordion title="Together">
    È consentito un solo riferimento immagine.
  </Accordion>
  <Accordion title="Vydra">
    Utilizza direttamente `https://www.vydra.ai/api/v1` per evitare
    reindirizzamenti che eliminano l'autenticazione. `veo3` è incluso
    esclusivamente per la generazione da testo a video; `kling` richiede
    l'URL remoto di un'immagine.
  </Accordion>
  <Accordion title="xAI">
    Il modello predefinito `grok-imagine-video` supporta la generazione da testo
    a video, da una singola immagine del primo fotogramma a video, fino a 7 input
    `reference_image` tramite `reference_images` di xAI e flussi remoti di
    modifica o estensione dei video. La generazione usa `480P` per impostazione
    predefinita; la generazione da una singola immagine a video eredita le
    proporzioni della sorgente quando `aspectRatio` viene omesso. La modifica e
    l'estensione dei video ereditano la geometria dell'input e non accettano
    sostituzioni delle proporzioni o della risoluzione. L'estensione accetta
    durate da 2 a 10 secondi.

    `grok-imagine-video-1.5` supporta esclusivamente la generazione da immagine
    a video: è necessario fornire esattamente un'immagine. Supporta durate da
    1 a 15 secondi e risoluzioni `480P`, `720P` o `1080P`, con `480P` come
    valore predefinito; omettere `aspectRatio` per ereditare le proporzioni
    dell'immagine sorgente. Gli identificatori di anteprima e quelli datati
    della versione 1.5 ricevono la stessa convalida e vengono inoltrati
    invariati.

  </Accordion>
</AccordionGroup>

## Modalità delle funzionalità dei provider

Il contratto condiviso per la generazione video supporta funzionalità
specifiche per modalità anziché soltanto limiti aggregati generali. Le nuove
implementazioni dei provider dovrebbero preferire blocchi di modalità espliciti:

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

I campi aggregati generali come `maxInputImages` e `maxInputVideos`
**non** sono sufficienti per dichiarare il supporto delle modalità di
trasformazione. I provider dovrebbero dichiarare esplicitamente `generate`,
`imageToVideo` e `videoToVideo`, affinché i test in ambiente reale, i test
del contratto e lo strumento condiviso `video_generate` possano convalidare
in modo deterministico il supporto delle modalità.

Quando un modello di un provider supporta un numero di input di riferimento
maggiore rispetto agli altri, utilizzare `maxInputImagesByModel`,
`maxInputVideosByModel` o `maxInputAudiosByModel` anziché aumentare il limite
dell'intera modalità.

## Test in ambiente reale

Copertura in ambiente reale facoltativa per i provider condivisi inclusi:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Script wrapper del repository:

```bash
pnpm test:live:media video
```

Per impostazione predefinita, questo file di test in ambiente reale usa le
variabili d'ambiente dei provider già esportate con precedenza sui profili di
autenticazione archiviati ed esegue un test rapido sicuro per il rilascio:

- `generate` per ogni provider diverso da FAL incluso nell'esecuzione.
- Prompt di un'aragosta della durata di un secondo.
- Limite temporale per operazione e per provider definito da
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione
  predefinita).

FAL è facoltativo perché la latenza della coda lato provider può incidere in
modo predominante sui tempi di rilascio:

```bash
pnpm test:live:media video --video-providers fal
```

Impostare `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le
modalità di trasformazione dichiarate che l'esecuzione condivisa può verificare
in sicurezza con contenuti multimediali locali:

- `imageToVideo` quando `capabilities.imageToVideo.enabled`.
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e il
  provider/modello accetta, nell'esecuzione condivisa, un input video locale
  basato su buffer.

Attualmente, il percorso di test in ambiente reale condiviso `videoToVideo`
copre solo `runway` quando viene selezionato `runway/gen4_aleph`.

## Configurazione

Impostare il modello predefinito di generazione video nella configurazione di
OpenClaw:

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

## Argomenti correlati

- [Alibaba Model Studio](/it/providers/alibaba)
- [Attività in background](/it/automation/tasks) - monitoraggio delle attività per la generazione video asincrona
- [BytePlus](/it/concepts/model-providers#byteplus-international)
- [ComfyUI](/it/providers/comfy)
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults)
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
