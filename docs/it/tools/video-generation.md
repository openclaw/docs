---
read_when:
    - Generazione di video tramite l'agente
    - Configurazione dei provider e dei modelli di generazione video
    - Comprendere i parametri dello strumento video_generate
sidebarTitle: Video generation
summary: Genera video tramite video_generate a partire da riferimenti di testo, immagine o video su 16 backend di fornitori
title: Generazione di video
x-i18n:
    generated_at: "2026-05-05T06:19:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a86a820cc9f27baf4b17954d7ded7c2b7ff9eb456e7e75c3b2e7a7653cd675fd
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw può generare video da prompt di testo, immagini di riferimento o
video esistenti. Sono supportati sedici backend di provider, ciascuno con
opzioni di modello, modalità di input e set di funzionalità diversi. L'agente sceglie
automaticamente il provider giusto in base alla tua configurazione e alle chiavi API
disponibili.

<Note>
Lo strumento `video_generate` compare solo quando è disponibile almeno un provider
di generazione video. Se non lo vedi tra gli strumenti del tuo agente, imposta una
chiave API del provider o configura `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw tratta la generazione video come tre modalità di runtime:

- `generate` — richieste text-to-video senza contenuti multimediali di riferimento.
- `imageToVideo` — la richiesta include una o più immagini di riferimento.
- `videoToVideo` — la richiesta include uno o più video di riferimento.

I provider possono supportare qualsiasi sottoinsieme di queste modalità. Lo strumento convalida la
modalità attiva prima dell'invio e segnala le modalità supportate in `action=list`.

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

    L'agente chiama automaticamente `video_generate`. Non è necessario alcun allowlisting
    degli strumenti.

  </Step>
</Steps>

## Come funziona la generazione asincrona

La generazione video è asincrona. Quando l'agente chiama `video_generate` in una
sessione:

1. OpenClaw invia la richiesta al provider e restituisce immediatamente un ID attività.
2. Il provider elabora il job in background (in genere da 30 secondi a diversi minuti a seconda del provider e della risoluzione; i provider lenti basati su coda possono arrivare fino al timeout configurato).
3. Quando il video è pronto, OpenClaw riattiva la stessa sessione con un evento interno di completamento.
4. L'agente informa l'utente e allega il video completato. Nelle chat di gruppo/canale
   che usano la consegna visibile solo tramite strumento di messaggistica, l'agente inoltra il
   risultato tramite lo strumento di messaggistica invece di farlo pubblicare direttamente da OpenClaw.

Mentre un job è in corso, le chiamate duplicate a `video_generate` nella stessa
sessione restituiscono lo stato dell'attività corrente invece di avviare un'altra
generazione. Usa `openclaw tasks list` o `openclaw tasks show <taskId>` per
controllare l'avanzamento dalla CLI.

Al di fuori delle esecuzioni dell'agente supportate da sessione (per esempio, invocazioni dirette degli strumenti),
lo strumento ripiega sulla generazione inline e restituisce il percorso finale del contenuto multimediale
nello stesso turno.

I file video generati vengono salvati nello storage multimediale gestito da OpenClaw quando
il provider restituisce byte. Il limite predefinito di salvataggio dei video generati segue
il limite dei contenuti video, e `agents.defaults.mediaMaxMb` lo aumenta per
render più grandi. Quando un provider restituisce anche un URL di output ospitato, OpenClaw
può consegnare quell'URL invece di far fallire l'attività se la persistenza locale
rifiuta un file troppo grande.

### Ciclo di vita dell'attività

| Stato       | Significato                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| `queued`    | Attività creata, in attesa che il provider la accetti.                                                  |
| `running`   | Il provider sta elaborando (in genere da 30 secondi a diversi minuti a seconda di provider e risoluzione). |
| `succeeded` | Video pronto; l'agente si riattiva e lo pubblica nella conversazione.                                   |
| `failed`    | Errore del provider o timeout; l'agente si riattiva con i dettagli dell'errore.                         |

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

## Provider supportati

| Provider              | Modello predefinito              | Testo | Rif. immagine                                      | Rif. video                                     | Autenticazione                          |
| --------------------- | -------------------------------- | :---: | -------------------------------------------------- | ---------------------------------------------- | --------------------------------------- |
| Alibaba               | `wan2.6-t2v`                     |   ✓   | Sì (URL remoto)                                    | Sì (URL remoto)                                | `MODELSTUDIO_API_KEY`                   |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`        |   ✓   | Fino a 2 immagini (solo modelli I2V; primo + ultimo fotogramma) | —                                               | `BYTEPLUS_API_KEY`                      |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`        |   ✓   | Fino a 2 immagini (primo + ultimo fotogramma tramite ruolo) | —                                               | `BYTEPLUS_API_KEY`                      |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`   |   ✓   | Fino a 9 immagini di riferimento                   | Fino a 3 video                                 | `BYTEPLUS_API_KEY`                      |
| ComfyUI               | `workflow`                       |   ✓   | 1 immagine                                         | —                                               | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`          |   ✓   | —                                                  | —                                               | `DEEPINFRA_API_KEY`                     |
| fal                   | `fal-ai/minimax/video-01-live`   |   ✓   | 1 immagine; fino a 9 con Seedance reference-to-video | Fino a 3 video con Seedance reference-to-video | `FAL_KEY`                               |
| Google                | `veo-3.1-fast-generate-preview`  |   ✓   | 1 immagine                                         | 1 video                                        | `GEMINI_API_KEY`                        |
| MiniMax               | `MiniMax-Hailuo-2.3`             |   ✓   | 1 immagine                                         | —                                               | `MINIMAX_API_KEY` o MiniMax OAuth       |
| OpenAI                | `sora-2`                         |   ✓   | 1 immagine                                         | 1 video                                        | `OPENAI_API_KEY`                        |
| OpenRouter            | `google/veo-3.1-fast`            |   ✓   | Fino a 4 immagini (primo/ultimo fotogramma o riferimenti) | —                                               | `OPENROUTER_API_KEY`                    |
| Qwen                  | `wan2.6-t2v`                     |   ✓   | Sì (URL remoto)                                    | Sì (URL remoto)                                | `QWEN_API_KEY`                          |
| Runway                | `gen4.5`                         |   ✓   | 1 immagine                                         | 1 video                                        | `RUNWAYML_API_SECRET`                   |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`         |   ✓   | 1 immagine                                         | —                                               | `TOGETHER_API_KEY`                      |
| Vydra                 | `veo3`                           |   ✓   | 1 immagine (`kling`)                               | —                                               | `VYDRA_API_KEY`                         |
| xAI                   | `grok-imagine-video`             |   ✓   | 1 immagine come primo fotogramma o fino a 7 `reference_image` | 1 video                                        | `XAI_API_KEY`                           |

Alcuni provider accettano variabili d'ambiente per chiavi API aggiuntive o alternative. Consulta
le singole [pagine dei provider](#related) per i dettagli.

Esegui `video_generate action=list` per ispezionare provider, modelli e
modalità di runtime disponibili al momento dell'esecuzione.

### Matrice delle funzionalità

Il contratto esplicito delle modalità usato da `video_generate`, dai test di contratto e
dallo sweep live condiviso:

| Provider   | `generate` | `imageToVideo` | `videoToVideo` | Lane live condivise oggi                                                                                                                |
| ---------- | :--------: | :------------: | :------------: | -------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo provider richiede URL video `http(s)` remoti                         |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                             |
| ComfyUI    |     ✓      |       ✓        |       —        | Non incluso nello sweep condiviso; la copertura specifica del workflow vive nei test di Comfy                                          |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; gli schemi video nativi di DeepInfra sono text-to-video nel contratto incluso                                              |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` solo quando si usa Seedance reference-to-video                                              |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` condiviso saltato perché lo sweep Gemini/Veo attuale basato su buffer non accetta quell'input |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                             |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` condiviso saltato perché questo percorso org/input richiede attualmente accesso inpaint/remix lato provider |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                             |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo provider richiede URL video `http(s)` remoti                         |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` viene eseguito solo quando il modello selezionato è `runway/gen4_aleph`                    |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                             |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; `imageToVideo` condiviso saltato perché `veo3` incluso è solo testo e `kling` incluso richiede un URL immagine remoto      |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` saltato perché questo provider attualmente richiede un URL MP4 remoto                      |

## Parametri dello strumento

### Obbligatori

<ParamField path="prompt" type="string" required>
  Descrizione testuale del video da generare. Obbligatoria per `action: "generate"`.
</ParamField>

### Input di contenuto

<ParamField path="image" type="string">Singola immagine di riferimento (percorso o URL).</ParamField>
<ParamField path="images" type="string[]">Più immagini di riferimento (fino a 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Suggerimenti di ruolo opzionali per posizione, paralleli all'elenco combinato di immagini.
Valori canonici: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Singolo video di riferimento (percorso o URL).</ParamField>
<ParamField path="videos" type="string[]">Più video di riferimento (fino a 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Suggerimenti di ruolo opzionali per posizione, paralleli all'elenco combinato di video.
Valore canonico: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Singolo audio di riferimento (percorso o URL). Usato per musica di sottofondo o come riferimento
vocale quando il fornitore supporta input audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Più audio di riferimento (fino a 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Suggerimenti di ruolo opzionali per posizione, paralleli all'elenco combinato di audio.
Valore canonico: `reference_audio`.
</ParamField>

<Note>
I suggerimenti di ruolo vengono inoltrati al fornitore così come sono. I valori canonici provengono
dall'unione `VideoGenerationAssetRole`, ma i fornitori possono accettare ulteriori
stringhe di ruolo. Gli array `*Roles` non devono avere più voci
dell'elenco di riferimento corrispondente; gli errori di conteggio di una posizione producono
un errore chiaro. Usa una stringa vuota per lasciare uno slot non impostato. Per xAI, imposta
ogni ruolo immagine su `reference_image` per usare la modalità di generazione
`reference_images`; ometti il ruolo o usa `first_frame` per la conversione
da singola immagine a video.
</Note>

### Controlli di stile

<ParamField path="aspectRatio" type="string">
  Suggerimento per le proporzioni, ad esempio `1:1`, `16:9`, `9:16`, `adaptive` o un valore specifico del fornitore. OpenClaw normalizza o ignora i valori non supportati in base al fornitore.
</ParamField>
<ParamField path="resolution" type="string">Suggerimento per la risoluzione, ad esempio `480P`, `720P`, `768P`, `1080P`, `4K` o un valore specifico del fornitore. OpenClaw normalizza o ignora i valori non supportati in base al fornitore.</ParamField>
<ParamField path="durationSeconds" type="number">
  Durata target in secondi (arrotondata al valore più vicino supportato dal fornitore).
</ParamField>
<ParamField path="size" type="string">Suggerimento per la dimensione quando il fornitore lo supporta.</ParamField>
<ParamField path="audio" type="boolean">
  Abilita l'audio generato nell'output quando supportato. Distinto da `audioRef*` (input).
</ParamField>
<ParamField path="watermark" type="boolean">Attiva o disattiva la filigrana del fornitore quando supportata.</ParamField>

`adaptive` è un sentinel specifico del fornitore: viene inoltrato così com'è ai
fornitori che dichiarano `adaptive` nelle proprie capacità (ad esempio BytePlus
Seedance lo usa per rilevare automaticamente le proporzioni dalle dimensioni
dell'immagine di input). I fornitori che non lo dichiarano espongono il valore tramite
`details.ignoredOverrides` nel risultato dello strumento, così l'eliminazione è visibile.

### Avanzate

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` restituisce il task della sessione corrente; `"list"` ispeziona i fornitori.
</ParamField>
<ParamField path="model" type="string">Override di fornitore/modello (ad esempio `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Suggerimento per il nome file di output.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout opzionale dell'operazione del fornitore in millisecondi.</ParamField>
<ParamField path="providerOptions" type="object">
  Opzioni specifiche del fornitore come oggetto JSON (ad esempio `{"seed": 42, "draft": true}`).
  I fornitori che dichiarano uno schema tipizzato convalidano chiavi e tipi; chiavi
  sconosciute o mancata corrispondenza dei tipi fanno saltare il candidato durante il ripiego.
  I fornitori senza uno schema dichiarato ricevono le opzioni così come sono. Esegui
  `video_generate action=list` per vedere cosa accetta ciascun fornitore.
</ParamField>

<Note>
Non tutti i fornitori supportano tutti i parametri. OpenClaw normalizza la durata al
valore supportato dal fornitore più vicino e rimappa i suggerimenti geometrici tradotti,
come da dimensione a proporzioni, quando un fornitore di ripiego espone una superficie
di controllo diversa. Gli override realmente non supportati vengono ignorati in modalità
best-effort e segnalati come avvisi nel risultato dello strumento. I limiti rigidi di
capacità (come troppi input di riferimento) producono un errore prima dell'invio.
I risultati dello strumento riportano le impostazioni applicate; `details.normalization`
registra qualsiasi traduzione da richiesto ad applicato.
</Note>

Gli input di riferimento selezionano la modalità di runtime:

- Nessun media di riferimento → `generate`
- Qualsiasi riferimento immagine → `imageToVideo`
- Qualsiasi riferimento video → `videoToVideo`
- Gli input audio di riferimento **non** cambiano la modalità risolta; si applicano sopra
  qualunque modalità selezionino i riferimenti immagine/video e funzionano solo
  con fornitori che dichiarano `maxInputAudios`.

I riferimenti misti di immagini e video non sono una superficie di capacità condivisa stabile.
Preferisci un solo tipo di riferimento per richiesta.

#### Ripiego e opzioni tipizzate

Alcuni controlli di capacità vengono applicati al livello di ripiego anziché al
confine dello strumento, quindi una richiesta che supera i limiti del fornitore principale può
comunque essere eseguita su un ripiego capace:

- Il candidato attivo che non dichiara `maxInputAudios` (o dichiara `0`) viene saltato quando
  la richiesta contiene riferimenti audio; viene provato il candidato successivo.
- Il valore `maxDurationSeconds` del candidato attivo inferiore al `durationSeconds` richiesto,
  senza un elenco `supportedDurationSeconds` dichiarato → saltato.
- La richiesta contiene `providerOptions` e il candidato attivo dichiara esplicitamente
  uno schema `providerOptions` tipizzato → saltato se le chiavi fornite non sono
  nello schema o i tipi dei valori non corrispondono. I fornitori senza uno
  schema dichiarato ricevono le opzioni così come sono (pass-through
  compatibile all'indietro). Un fornitore può rinunciare a tutte le opzioni del fornitore
  dichiarando uno schema vuoto (`capabilities.providerOptions: {}`), che
  causa lo stesso salto di una mancata corrispondenza di tipo.

Il primo motivo di salto in una richiesta viene registrato a livello `warn`, così gli operatori vedono quando
il loro fornitore principale è stato ignorato; i salti successivi vengono registrati a livello `debug` per
mantenere silenziose le catene di ripiego lunghe. Se ogni candidato viene saltato,
l'errore aggregato include il motivo del salto per ciascuno.

## Azioni

| Azione     | Cosa fa                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Predefinita. Crea un video dal prompt fornito e dagli input di riferimento opzionali.                    |
| `status`   | Controlla lo stato del task video in corso per la sessione corrente senza avviare un'altra generazione. |
| `list`     | Mostra i fornitori disponibili, i modelli e le loro capacità.                                           |

## Selezione del modello

OpenClaw risolve il modello in questo ordine:

1. **Parametro dello strumento `model`** — se l'agente ne specifica uno nella chiamata.
2. **`videoGenerationModel.primary`** dalla configurazione.
3. **`videoGenerationModel.fallbacks`** in ordine.
4. **Rilevamento automatico** — fornitori con autenticazione valida, a partire dal
   fornitore predefinito corrente, poi i fornitori rimanenti in ordine
   alfabetico.

Se un fornitore fallisce, il candidato successivo viene provato automaticamente. Se tutti
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
    Usa l'endpoint asincrono DashScope / Model Studio. Immagini e
    video di riferimento devono essere URL `http(s)` remoti.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID del fornitore: `byteplus`.

    Modelli: `seedance-1-0-pro-250528` (predefinito),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    I modelli T2V (`*-t2v-*`) non accettano input immagine; i modelli I2V e
    i modelli generali `*-pro-*` supportano una singola immagine di riferimento (primo
    fotogramma). Passa l'immagine per posizione o imposta `role: "first_frame"`.
    Gli ID modello T2V vengono automaticamente sostituiti con la variante I2V
    corrispondente quando viene fornita un'immagine.

    Chiavi `providerOptions` supportate: `seed` (numero), `draft` (booleano —
    forza 480p), `camera_fixed` (booleano).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Richiede il plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID del fornitore: `byteplus-seedance15`. Modello:
    `seedance-1-5-pro-251215`.

    Usa l'API unificata `content[]`. Supporta al massimo 2 immagini di input
    (`first_frame` + `last_frame`). Tutti gli input devono essere URL
    `https://` remoti. Imposta `role: "first_frame"` / `"last_frame"` su ciascuna immagine, oppure
    passa le immagini per posizione.

    `aspectRatio: "adaptive"` rileva automaticamente le proporzioni dall'immagine di input.
    `audio: true` viene mappato a `generate_audio`. `providerOptions.seed`
    (numero) viene inoltrato.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Richiede il plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID del fornitore: `byteplus-seedance2`. Modelli:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Usa l'API unificata `content[]`. Supporta fino a 9 immagini di riferimento,
    3 video di riferimento e 3 audio di riferimento. Tutti gli input devono essere URL
    `https://` remoti. Imposta `role` su ciascun asset — valori supportati:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` rileva automaticamente le proporzioni dall'immagine di input.
    `audio: true` viene mappato a `generate_audio`. `providerOptions.seed`
    (numero) viene inoltrato.

  </Accordion>
  <Accordion title="ComfyUI">
    Esecuzione locale o cloud guidata da workflow. Supporta text-to-video e
    image-to-video tramite il grafo configurato.
  </Accordion>
  <Accordion title="fal">
    Usa un flusso basato su coda per i job di lunga durata. OpenClaw attende fino a 20
    minuti per impostazione predefinita prima di considerare scaduto un job in corso nella coda fal.
    La maggior parte dei modelli video fal
    accetta un singolo riferimento immagine. I modelli reference-to-video
    Seedance 2.0 accettano fino a 9 immagini, 3 video e 3 riferimenti audio, con
    un massimo di 12 file di riferimento totali.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Supporta un riferimento immagine o un riferimento video. Le richieste di audio generato
    vengono ignorate con un avviso nel percorso API Gemini perché tale API rifiuta
    il parametro `generateAudio` per l'attuale generazione video Veo.
  </Accordion>
  <Accordion title="MiniMax">
    Solo un singolo riferimento immagine. MiniMax accetta le risoluzioni `768P` e `1080P`;
    richieste come `720P` vengono normalizzate al valore supportato più vicino
    prima dell'invio.
  </Accordion>
  <Accordion title="OpenAI">
    Viene inoltrato solo l'override `size`. Gli altri override di stile
    (`aspectRatio`, `resolution`, `audio`, `watermark`) vengono ignorati con
    un avviso.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa l'API asincrona `/videos` di OpenRouter. OpenClaw invia il
    job, esegue il polling di `polling_url` e scarica `unsigned_urls` oppure
    l'endpoint documentato del contenuto del job. Il default incluso `google/veo-3.1-fast`
    dichiara durate di 4/6/8 secondi, risoluzioni `720P`/`1080P` e
    rapporti d'aspetto `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Stesso backend DashScope di Alibaba. Gli input di riferimento devono essere URL remoti
    `http(s)`; i file locali vengono rifiutati in anticipo.
  </Accordion>
  <Accordion title="Runway">
    Supporta file locali tramite URI dati. Video-to-video richiede
    `runway/gen4_aleph`. Le esecuzioni solo testo espongono i rapporti
    d'aspetto `16:9` e `9:16`.
  </Accordion>
  <Accordion title="Together">
    Solo un singolo riferimento immagine.
  </Accordion>
  <Accordion title="Vydra">
    Usa direttamente `https://www.vydra.ai/api/v1` per evitare redirect che
    eliminano l'autenticazione. `veo3` è incluso solo come text-to-video; `kling` richiede
    un URL immagine remoto.
  </Accordion>
  <Accordion title="xAI">
    Supporta text-to-video, image-to-video con una singola immagine primo frame, fino a 7
    input `reference_image` tramite `reference_images` di xAI e flussi remoti
    di modifica/estensione video.
  </Accordion>
</AccordionGroup>

## Modalità di capacità dei provider

Il contratto condiviso di generazione video supporta capacità specifiche per modalità
anziché solo limiti aggregati piatti. Le nuove implementazioni di provider
dovrebbero preferire blocchi di modalità espliciti:

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

I campi aggregati piatti come `maxInputImages` e `maxInputVideos`
**non** bastano per dichiarare il supporto alla modalità di trasformazione. I provider dovrebbero
dichiarare esplicitamente `generate`, `imageToVideo` e `videoToVideo` affinché i test live,
i test di contratto e lo strumento condiviso `video_generate` possano validare
il supporto delle modalità in modo deterministico.

Quando un modello in un provider ha un supporto più ampio per gli input di riferimento rispetto al
resto, usa `maxInputImagesByModel`, `maxInputVideosByModel` o
`maxInputAudiosByModel` invece di aumentare il limite dell'intera modalità.

## Test live

Copertura live opzionale per i provider condivisi inclusi:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper del repo:

```bash
pnpm test:live:media video
```

Questo file live carica le variabili d'ambiente mancanti dei provider da `~/.profile`, preferisce
per impostazione predefinita le chiavi API live/env rispetto ai profili di autenticazione salvati, ed esegue
per impostazione predefinita uno smoke test sicuro per il rilascio:

- `generate` per ogni provider non FAL nella scansione.
- Prompt di un secondo con aragosta.
- Limite operativo per provider da
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita).

FAL è opzionale perché la latenza della coda lato provider può dominare il tempo
di rilascio:

```bash
pnpm test:live:media video --video-providers fal
```

Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità
di trasformazione dichiarate che la scansione condivisa può esercitare in sicurezza con media locali:

- `imageToVideo` quando `capabilities.imageToVideo.enabled`.
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e il
  provider/modello accetta input video locali basati su buffer nella scansione
  condivisa.

Attualmente la lane live condivisa `videoToVideo` copre `runway` solo quando
selezioni `runway/gen4_aleph`.

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
