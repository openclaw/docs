---
read_when:
    - Progettazione o refactoring della comprensione dei contenuti multimediali
    - Ottimizzazione della preelaborazione di audio, video e immagini in ingresso
sidebarTitle: Media understanding
summary: Comprensione di immagini/audio/video in ingresso (opzionale) con provider e soluzioni di riserva tramite CLI
title: Comprensione dei contenuti multimediali
x-i18n:
    generated_at: "2026-07-12T07:11:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw può riassumere i contenuti multimediali in ingresso (immagini/audio/video) prima dell'esecuzione della pipeline di risposta, in modo che l'analisi dei comandi e l'instradamento operino su testo breve anziché su byte non elaborati. La comprensione rileva automaticamente gli strumenti locali o le chiavi dei fornitori, oppure è possibile configurare modelli espliciti. I contenuti multimediali originali vengono sempre inviati al modello come di consueto; se la comprensione non riesce o è disabilitata, il flusso di risposta prosegue senza modifiche.

I Plugin dei fornitori registrano i metadati delle funzionalità (quale fornitore supporta ciascun tipo di contenuto multimediale, modello predefinito, priorità). Il nucleo di OpenClaw gestisce la configurazione condivisa `tools.media`, l'ordine dei fallback e l'integrazione con la pipeline di risposta.

## Funzionamento

<Steps>
  <Step title="Raccogliere gli allegati">
    Raccoglie gli allegati in ingresso (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Selezionare per funzionalità">
    Per ogni funzionalità abilitata (immagine/audio/video), seleziona gli allegati in base alla politica `attachments` (impostazione predefinita: solo il primo allegato).
  </Step>
  <Step title="Scegliere un modello">
    Seleziona la prima voce di modello idonea (dimensioni + funzionalità + autenticazione disponibile).
  </Step>
  <Step title="Usare il fallback in caso di errore">
    Se un modello restituisce un errore, supera il tempo massimo o il contenuto multimediale supera `maxBytes`, prova la voce successiva.
  </Step>
  <Step title="Applicare in caso di successo">
    `Body` diventa un blocco `[Image]`, `[Audio]` o `[Video]`. Per l'audio viene impostato anche `{{Transcript}}`; l'analisi dei comandi usa il testo della didascalia, se presente, altrimenti la trascrizione. Le didascalie vengono conservate come `User text:` all'interno del blocco.
  </Step>
</Steps>

## Configurazione

`tools.media` contiene un elenco condiviso di modelli e sostituzioni specifiche per funzionalità:

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

Chiavi specifiche per funzionalità (`image`/`audio`/`video`):

| Chiave                                          | Tipo      | Valore predefinito                                  | Note                                                                                                 |
| ----------------------------------------------- | --------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | automatico (`false` disabilita)                     | Impostare `false` per disattivare il rilevamento automatico per questa funzionalità                  |
| `models`                                        | array     | nessuno                                             | Usato con priorità rispetto all'elenco condiviso `tools.media.models`                                |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ indicazione maxChars)  | Per impostazione predefinita, solo immagini/video                                                    |
| `maxChars`                                      | `number`  | `500` (immagini/video), non impostato (audio)       | L'output viene troncato se il modello restituisce una quantità maggiore                              |
| `maxBytes`                                      | `number`  | immagine `10485760`, audio `20971520`, video `52428800` | I contenuti multimediali troppo grandi fanno passare al modello successivo                       |
| `timeoutSeconds`                                | `number`  | `60` (immagini/audio), `120` (video)                |                                                                                                      |
| `language`                                      | `string`  | non impostato                                       | Indicazione per la trascrizione audio                                                                |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                   | Sostituzioni per le richieste al fornitore; vedere [Strumenti e fornitori personalizzati](/it/gateway/config-tools) |
| `attachments`                                   | object    | `{ mode: "first", maxAttachments: 1 }`              | Vedere [Politica degli allegati](#attachment-policy)                                                 |
| `scope`                                         | object    | non impostato                                       | Limitazione in base a canale/chatType/keyPrefix                                                      |
| `echoTranscript`                                | `boolean` | `false`                                             | Solo audio: restituisce la trascrizione alla chat prima dell'elaborazione da parte dell'agente       |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                               | Solo audio: segnaposto `{transcript}`                                                                |

Le opzioni specifiche di Deepgram vanno inserite in `providerOptions.deepgram` (il campo di primo livello `deepgram: { detectLanguage, punctuate, smartFormat }` è deprecato, ma viene ancora letto).

### Voci dei modelli

Ogni voce `models[]` è una voce **fornitore** (predefinita) o una voce **CLI**:

<Tabs>
  <Tab title="Voce fornitore">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, for multi-modal shared entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Voce CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    I modelli CLI possono utilizzare anche `{{MediaDir}}` (directory contenente il file multimediale), `{{OutputDir}}` (directory temporanea creata per questa esecuzione) e `{{OutputBase}}` (percorso base del file temporaneo, senza estensione).

  </Tab>
</Tabs>

### Credenziali del fornitore

La comprensione dei contenuti multimediali tramite fornitore usa la stessa risoluzione dell'autenticazione delle normali chiamate ai modelli: profili di autenticazione, variabili d'ambiente e infine `models.providers.<providerId>.apiKey`. Le voci `tools.media.*.models[]` non accettano un campo `apiKey` incorporato.

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Vedere [Strumenti e fornitori personalizzati](/it/gateway/config-tools) per profili, variabili d'ambiente e URL di base personalizzati.

## Regole e comportamento

- I contenuti multimediali che superano `maxBytes` fanno ignorare quel modello e passare al successivo.
- I file audio inferiori a 1024 byte vengono considerati vuoti o danneggiati e ignorati prima della trascrizione; l'agente riceve invece una trascrizione segnaposto deterministica.
- Se il modello principale attivo per le immagini supporta già nativamente la visione, OpenClaw omette il blocco di riepilogo `[Image]` e passa direttamente al modello l'immagine originale. MiniMax costituisce un'eccezione: `minimax`, `minimax-cn`, `minimax-portal` e `minimax-portal-cn` instradano sempre la comprensione delle immagini tramite il fornitore multimediale `MiniMax-VL-01` gestito dal Plugin, anche se i metadati legacy delle chat MiniMax M2.x dichiarano il supporto per l'input di immagini (solo `MiniMax-M3` e versioni successive sono considerate dotate di funzionalità di visione native).
- Se il modello principale di Gateway/WebChat supporta solo il testo, gli allegati immagine vengono conservati come riferimenti esternalizzati `media://inbound/*`, affinché gli strumenti per immagini/PDF o un modello per immagini configurato possano comunque esaminarli anziché perdere l'allegato.
- Il comando esplicito `openclaw infer image describe --file <path> --model <provider/model>` (alias: `openclaw capability image describe`) esegue direttamente il fornitore/modello con supporto per le immagini, inclusi riferimenti Ollama come `ollama/qwen2.5vl:7b` quando un modello corrispondente con supporto per le immagini è configurato in `models.providers.ollama.models[]`.
- Se `<capability>.enabled` non è `false` ma non sono configurati modelli, OpenClaw prova il modello di risposta attivo quando il relativo fornitore supporta la funzionalità.

### Rilevamento automatico (impostazione predefinita)

Quando `tools.media.<capability>.enabled` non è `false` e non sono configurati modelli, OpenClaw prova le seguenti opzioni nell'ordine indicato e si arresta alla prima funzionante:

<Steps>
  <Step title="Modello per immagini configurato (solo immagini)">
    I riferimenti principali/di fallback di `agents.defaults.imageModel`, a meno che il modello di risposta attivo supporti già nativamente la visione. Preferire riferimenti `provider/model`; i riferimenti senza fornitore vengono qualificati usando le voci configurate dei modelli del fornitore con supporto per le immagini solo quando la corrispondenza è univoca.
  </Step>
  <Step title="Modello di risposta attivo">
    Il modello di risposta attivo, quando il relativo fornitore supporta la funzionalità.
  </Step>
  <Step title="Autenticazione del fornitore (solo audio, prima delle CLI locali)">
    Le voci `models.providers.*` configurate che supportano l'audio vengono provate prima delle CLI locali. Ordine di priorità dei fornitori inclusi (i casi di pari priorità vengono risolti alfabeticamente in base all'ID del fornitore): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="CLI locali (solo audio)">
    I binari locali pronti diventano un elenco ordinato di fallback:
    - `whisper-cli` per primo solo dopo che una precedente invocazione del modello nel processo corrente ha rilevato Metal o CUDA
    - `sherpa-onnx-offline` con uso predefinito della CPU (richiede `SHERPA_ONNX_MODEL_DIR` con `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli` quando l'accelerazione è semplicemente supportata dalla compilazione o non è stata rilevata
    - `parakeet-mlx` su Apple Silicon (compatibile con MLX, utilizzo del dispositivo non rilevato)
    - `whisper` (CLI Python; usa per impostazione predefinita il modello `turbo`, scaricato automaticamente)

    L'ispezione delle funzionalità del backend viene memorizzata nella cache e non carica alcun modello. Il supporto della compilazione, i flag del backend richiesti e il backend rilevato durante un'invocazione reale rimangono distinti. whisper.cpp rilevato automaticamente mantiene abilitati i registri di esecuzione del modello, in modo da poter registrare la riga del backend selezionato dal componente upstream. Le voci CLI esplicite mantengono l'ordine, i flag del backend e i flag di output configurati.

  </Step>
  <Step title="Autenticazione del fornitore (immagini/video)">
    Le voci `models.providers.*` configurate che supportano la funzionalità vengono provate prima dell'ordine di fallback incluso. I fornitori configurati esclusivamente per le immagini che dispongono di un modello con supporto per le immagini vengono registrati automaticamente per la comprensione dei contenuti multimediali, anche quando non sono un Plugin incluso del fornitore.

    Ordine di priorità dei fornitori inclusi (i casi di pari priorità vengono risolti alfabeticamente in base all'ID del fornitore):
    - Immagini: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Video: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="CLI Antigravity (solo immagini/video)">
    Il primo binario `agy` o `antigravity` installato (sostituibile tramite `OPENCLAW_ANTIGRAVITY_CLI`), isolato nella directory del contenuto multimediale.
  </Step>
</Steps>

Per disabilitare il rilevamento automatico per una funzionalità:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
Il rilevamento dei binari viene eseguito senza garanzie su macOS/Linux/Windows; assicurarsi che la CLI sia disponibile in `PATH` (`~` viene espanso), oppure impostare una voce di modello CLI esplicita con il percorso completo del comando.
</Note>

### Supporto proxy (chiamate dei fornitori per audio/video)

La comprensione di **audio** e **video** basata sui fornitori rispetta le variabili d'ambiente proxy standard per le connessioni in uscita, incluse le regole di esclusione `NO_PROXY`/`no_proxy`: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Le variabili in minuscolo hanno la precedenza su quelle in maiuscolo. Se non ne è impostata alcuna, la comprensione dei contenuti multimediali usa una connessione diretta; se il valore del proxy non è valido, OpenClaw registra un avviso e usa come fallback il recupero diretto. La comprensione delle immagini non utilizza questo percorso proxy.

## Funzionalità

Impostare `capabilities` in una voce `models[]` per limitarla a tipi specifici di contenuti multimediali. Per gli elenchi condivisi, OpenClaw deduce i valori predefiniti per ciascun fornitore incluso:

| Provider                                                                                   | Funzionalità          |
| ------------------------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                                           | immagine              |
| `minimax-portal`                                                                           | immagine              |
| `moonshot`                                                                                 | immagine + video      |
| `openrouter`                                                                               | immagine + audio      |
| `google` (API Gemini)                                                                      | immagine + audio + video |
| `qwen`                                                                                     | immagine + video      |
| `deepinfra`                                                                                | immagine + audio      |
| `mistral`                                                                                  | audio                 |
| `zai`                                                                                      | immagine              |
| `groq`, `xai`, `deepgram`, `senseaudio`                                                    | audio                 |
| Qualsiasi catalogo `models.providers.<id>.models[]` con un modello compatibile con le immagini | immagine              |

Per le voci CLI, imposta esplicitamente `capabilities` per evitare corrispondenze inattese; se omesso, la voce è idonea per ogni elenco di funzionalità in cui compare.

## Matrice di supporto dei provider

| Funzionalità | Provider                                                                                                                                               | Note                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Immagine     | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, provider di configurazione | I Plugin dei fornitori registrano il supporto per le immagini; `openai/*` può usare l'instradamento tramite chiave API o Codex OAuth; `codex/*` usa un turno limitato di Codex app-server; i provider di configurazione compatibili con le immagini vengono registrati automaticamente. |
| Audio        | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Trascrizione tramite provider (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                           |
| Video        | Google, Moonshot, Qwen                                                                                                                                 | Comprensione video tramite i Plugin dei fornitori; la comprensione video di Qwen usa gli endpoint DashScope standard.                                                                                |

<Note>
**Nota su MiniMax**: la comprensione delle immagini per `minimax`, `minimax-cn`, `minimax-portal` e `minimax-portal-cn` proviene sempre dal provider multimediale `MiniMax-VL-01` gestito dal Plugin, anche se i metadati legacy della chat MiniMax M2.x dichiarano il supporto per l'input di immagini.
</Note>

## Indicazioni per la selezione dei modelli

- Preferisci il modello di generazione corrente più potente per ogni funzionalità multimediale quando qualità e sicurezza sono importanti.
- Per gli agenti abilitati all'uso di strumenti che gestiscono input non attendibili, evita i modelli multimediali più vecchi o meno potenti.
- Mantieni almeno un modello di riserva per ogni funzionalità per garantirne la disponibilità (un modello di qualità + un modello più veloce/economico).
- Le alternative CLI (`whisper-cli`, `whisper`, `gemini`) sono utili quando le API dei provider non sono disponibili.
- Le modalità note di output su file sono autorevoli: un file di trascrizione dedotto vuoto o mancante non produce alcuna trascrizione, anziché ricorrere all'output di avanzamento della CLI.
- `parakeet-mlx`: usa `--output-format txt` (o `all`) con `--output-dir` e il modello di output predefinito `{filename}`. Sono supportate anche le variabili d'ambiente upstream `PARAKEET_OUTPUT_FORMAT` e `PARAKEET_OUTPUT_TEMPLATE`. OpenClaw legge `<output-dir>/<media-basename>.txt`; il formato predefinito `srt`, gli altri formati e i modelli di output personalizzati continuano a usare lo standard output.

## Criteri per gli allegati

La proprietà `attachments` specifica per funzionalità controlla quali allegati vengono elaborati:

<ParamField path="mode" type='"first" | "all"' default="first">
  Elabora solo il primo allegato selezionato oppure tutti gli allegati.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita il numero di allegati elaborati.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferenza di selezione tra gli allegati candidati.
</ParamField>

Quando `mode: "all"`, gli output sono contrassegnati con `[Immagine 1/2]`, `[Audio 2/2]` e così via.

### Estrazione dagli allegati

- Il testo estratto dai file viene racchiuso come contenuto esterno non attendibile prima di essere aggiunto al prompt multimediale, usando delimitatori come `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e una riga di metadati `Source: External`.
- Questo percorso omette intenzionalmente il lungo banner `SECURITY NOTICE:` per mantenere breve il prompt multimediale; i delimitatori e i metadati vengono comunque applicati.
- Un file privo di testo estraibile riceve `[Nessun testo estraibile]`.
- Se per un PDF si ricorre alle immagini renderizzate delle pagine, OpenClaw inoltra tali immagini ai modelli di risposta dotati di capacità visive e mantiene il segnaposto `[Contenuto PDF renderizzato come immagini]` nel blocco del file.

## Esempi di configurazione

<Tabs>
  <Tab title="Shared models + overrides">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Audio + video only">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Image only">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Multi-modal single entry">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Output dello stato

Quando viene eseguita la comprensione dei contenuti multimediali, `/status` include una riga di riepilogo per ogni funzionalità:

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

Per l'inventario preliminare, esegui `openclaw capability audio providers`. Le righe locali mostrano il risultato locale di riserva separatamente dalla selezione globale del provider, dallo stato di disponibilità e dai campi distinti relativi ai backend compatibili, richiesti e osservati. La stessa selezione locale è disponibile come segnalazione informativa di doctor:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Note

- La comprensione viene eseguita in modalità best effort. Gli errori non bloccano le risposte.
- Gli allegati vengono comunque passati ai modelli anche quando la comprensione è disabilitata.
- Usa `scope` per limitare i contesti in cui viene eseguita la comprensione (ad esempio, solo nei messaggi diretti).

## Contenuti correlati

- [Configurazione](/it/gateway/configuration)
- [Supporto per immagini e contenuti multimediali](/it/nodes/images)
