---
read_when:
    - Generazione di musica o audio tramite l'agente
    - Configurazione di provider e modelli per la generazione musicale
    - Comprensione dei parametri dello strumento music_generate
summary: Genera musica con provider condivisi, inclusi plugin basati su workflow
title: Generazione musicale
x-i18n:
    generated_at: "2026-04-07T08:18:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce8da8dfc188efe8593ca5cbec0927dd1d18d2861a1a828df89c8541ccf1cb25
    source_path: tools/music-generation.md
    workflow: 15
---

# Generazione musicale

Lo strumento `music_generate` consente all'agente di creare musica o audio tramite la
capability condivisa di generazione musicale con provider configurati come Google,
MiniMax e ComfyUI configurato tramite workflow.

Per le sessioni agente supportate da provider condivisi, OpenClaw avvia la generazione musicale come
task in background, la traccia nel task ledger, quindi riattiva di nuovo l'agente quando
la traccia è pronta in modo che l'agente possa pubblicare l'audio finale completato nel
canale originale.

<Note>
Lo strumento condiviso integrato appare solo quando è disponibile almeno un provider di generazione musicale. Se non vedi `music_generate` tra gli strumenti del tuo agente, configura `agents.defaults.musicGenerationModel` oppure imposta una chiave API del provider.
</Note>

## Avvio rapido

### Generazione supportata da provider condivisi

1. Imposta una chiave API per almeno un provider, ad esempio `GEMINI_API_KEY` oppure
   `MINIMAX_API_KEY`.
2. Facoltativamente imposta il tuo modello preferito:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. Chiedi all'agente: _"Genera una traccia synthpop energica su una guida notturna
   attraverso una città al neon."_

L'agente chiama automaticamente `music_generate`. Non è necessaria alcuna allowlist degli strumenti.

Per contesti sincroni diretti senza un'esecuzione dell'agente supportata da sessione, lo
strumento integrato ricade comunque sulla generazione inline e restituisce il percorso del media finale nel
risultato dello strumento.

Prompt di esempio:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Generazione Comfy guidata da workflow

Il plugin `comfy` incluso si integra con lo strumento condiviso `music_generate` tramite
il registro dei provider di generazione musicale.

1. Configura `models.providers.comfy.music` con un JSON di workflow e
   nodi prompt/output.
2. Se usi Comfy Cloud, imposta `COMFY_API_KEY` oppure `COMFY_CLOUD_API_KEY`.
3. Chiedi all'agente di generare musica oppure chiama direttamente lo strumento.

Esempio:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Supporto dei provider inclusi condivisi

| Provider | Modello predefinito     | Input di riferimento | Controlli supportati                                      | Chiave API                              |
| -------- | ----------------------- | -------------------- | --------------------------------------------------------- | --------------------------------------- |
| ComfyUI  | `workflow`              | Fino a 1 immagine    | Workflow-defined music or audio                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`  |
| Google   | `lyria-3-clip-preview`  | Fino a 10 immagini   | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax  | `music-2.5+`            | Nessuno              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                       |

### Matrice delle capability dichiarate

Questo è il contratto esplicito delle modalità usato da `music_generate`, dai test di contratto
e dallo sweep live condiviso.

| Provider | `generate` | `edit` | Limite modifica | Lane live condivise                                                        |
| -------- | ---------- | ------ | ---------------- | -------------------------------------------------------------------------- |
| ComfyUI  | Sì         | Sì     | 1 immagine       | Non nello sweep condiviso; coperto da `extensions/comfy/comfy.live.test.ts` |
| Google   | Sì         | Sì     | 10 immagini      | `generate`, `edit`                                                         |
| MiniMax  | Sì         | No     | Nessuno          | `generate`                                                                 |

Usa `action: "list"` per ispezionare i provider e i modelli condivisi disponibili a
runtime:

```text
/tool music_generate action=list
```

Usa `action: "status"` per ispezionare il task musicale attivo supportato da sessione:

```text
/tool music_generate action=status
```

Esempio di generazione diretta:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parametri dello strumento integrato

| Parametro         | Tipo     | Descrizione                                                                                      |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `prompt`          | string   | Prompt di generazione musicale (richiesto per `action: "generate"`)                              |
| `action`          | string   | `"generate"` (predefinito), `"status"` per il task della sessione corrente, oppure `"list"` per ispezionare i provider |
| `model`           | string   | Override provider/model, ad esempio `google/lyria-3-pro-preview` oppure `comfy/workflow`         |
| `lyrics`          | string   | Testo facoltativo dei testi quando il provider supporta input esplicito dei testi                |
| `instrumental`    | boolean  | Richiede output solo strumentale quando il provider lo supporta                                  |
| `image`           | string   | Singolo percorso o URL di immagine di riferimento                                                |
| `images`          | string[] | Immagini di riferimento multiple (fino a 10)                                                     |
| `durationSeconds` | number   | Durata target in secondi quando il provider supporta suggerimenti di durata                      |
| `format`          | string   | Suggerimento sul formato di output (`mp3` oppure `wav`) quando il provider lo supporta           |
| `filename`        | string   | Suggerimento per il nome file di output                                                          |

Non tutti i provider supportano tutti i parametri. OpenClaw valida comunque i limiti rigidi
come il numero di input prima dell'invio. Quando un provider supporta la durata ma
usa un massimo più breve rispetto al valore richiesto, OpenClaw limita automaticamente
al valore supportato più vicino. I suggerimenti opzionali realmente non supportati vengono ignorati
con un avviso quando il provider o il modello selezionato non possono rispettarli.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw limita la durata durante il fallback del provider, il `durationSeconds` restituito riflette il valore inviato e `details.normalization.durationSeconds` mostra la mappatura tra valore richiesto e valore applicato.

## Comportamento asincrono per il percorso supportato da provider condivisi

- Esecuzioni dell'agente supportate da sessione: `music_generate` crea un task in background, restituisce immediatamente una risposta di avvio/task e pubblica la traccia completata più tardi in un messaggio di follow-up dell'agente.
- Prevenzione dei duplicati: mentre quel task in background è ancora `queued` oppure `running`, le chiamate successive a `music_generate` nella stessa sessione restituiscono lo stato del task invece di avviare un'altra generazione.
- Ricerca dello stato: usa `action: "status"` per ispezionare il task musicale attivo supportato da sessione senza avviare una nuova generazione.
- Tracciamento del task: usa `openclaw tasks list` oppure `openclaw tasks show <taskId>` per ispezionare lo stato in coda, in esecuzione e terminale della generazione.
- Riattivazione al completamento: OpenClaw inietta un evento interno di completamento nella stessa sessione così il modello può scrivere da solo il follow-up rivolto all'utente.
- Suggerimento nel prompt: i successivi turni utente/manuali nella stessa sessione ricevono un piccolo suggerimento runtime quando un task musicale è già in corso così il modello non richiama alla cieca `music_generate`.
- Fallback senza sessione: i contesti diretti/locali senza una vera sessione agente continuano a essere eseguiti inline e restituiscono il risultato audio finale nello stesso turno.

### Ciclo di vita del task

Ogni richiesta `music_generate` attraversa quattro stati:

1. **queued** -- task creato, in attesa che il provider lo accetti.
2. **running** -- il provider sta elaborando (tipicamente da 30 secondi a 3 minuti a seconda del provider e della durata).
3. **succeeded** -- traccia pronta; l'agente si riattiva e la pubblica nella conversazione.
4. **failed** -- errore del provider o timeout; l'agente si riattiva con i dettagli dell'errore.

Controlla lo stato dalla CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevenzione dei duplicati: se un task musicale è già `queued` oppure `running` per la sessione corrente, `music_generate` restituisce lo stato del task esistente invece di avviarne uno nuovo. Usa `action: "status"` per controllarlo esplicitamente senza attivare una nuova generazione.

## Configurazione

### Selezione del modello

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Ordine di selezione del provider

Quando genera musica, OpenClaw prova i provider in questo ordine:

1. parametro `model` dalla chiamata dello strumento, se l'agente ne specifica uno
2. `musicGenerationModel.primary` dalla configurazione
3. `musicGenerationModel.fallbacks` in ordine
4. rilevamento automatico usando solo i valori predefiniti dei provider supportati da auth:
   - prima il provider predefinito corrente
   - poi i restanti provider di generazione musicale registrati in ordine di ID provider

Se un provider fallisce, viene provato automaticamente il candidato successivo. Se falliscono tutti, l'errore
include i dettagli di ogni tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi che
la generazione musicale usi solo le voci esplicite `model`, `primary` e `fallbacks`.

## Note sui provider

- Google usa la generazione batch Lyria 3. L'attuale flusso incluso supporta
  prompt, testo facoltativo dei testi e immagini di riferimento facoltative.
- MiniMax usa l'endpoint batch `music_generation`. L'attuale flusso incluso
  supporta prompt, testi facoltativi, modalità strumentale, controllo della durata e
  output mp3.
- Il supporto ComfyUI è guidato da workflow e dipende dal grafo configurato più
  la mappatura dei nodi per i campi prompt/output.

## Modalità di capability del provider

Il contratto condiviso di generazione musicale ora supporta dichiarazioni esplicite delle modalità:

- `generate` per generazione solo da prompt
- `edit` quando la richiesta include una o più immagini di riferimento

Le nuove implementazioni di provider dovrebbero preferire blocchi di modalità espliciti:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

I campi flat legacy come `maxInputImages`, `supportsLyrics` e
`supportsFormat` non sono sufficienti per dichiarare il supporto alla modifica. I provider dovrebbero
dichiarare esplicitamente `generate` ed `edit` così i test live, i test di contratto e
lo strumento condiviso `music_generate` possano convalidare in modo deterministico il supporto delle modalità.

## Scegliere il percorso giusto

- Usa il percorso supportato da provider condivisi quando vuoi selezione del modello, failover del provider e il flusso asincrono integrato task/status.
- Usa un percorso plugin come ComfyUI quando ti serve un grafo di workflow personalizzato o un provider che non fa parte della capability musicale condivisa inclusa.
- Se stai eseguendo il debug di un comportamento specifico di ComfyUI, vedi [ComfyUI](/it/providers/comfy). Se stai eseguendo il debug di un comportamento del provider condiviso, inizia da [Google (Gemini)](/it/providers/google) oppure [MiniMax](/it/providers/minimax).

## Test live

Copertura live opzionale per i provider inclusi condivisi:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repo:

```bash
pnpm test:live:media music
```

Questo file live carica le variabili env mancanti del provider da `~/.profile`, preferisce
per default chiavi API live/env rispetto ai profili auth memorizzati e esegue sia la copertura
`generate` sia quella `edit` dichiarata quando il provider abilita la modalità edit.

Oggi questo significa:

- `google`: `generate` più `edit`
- `minimax`: solo `generate`
- `comfy`: copertura live Comfy separata, non nello sweep dei provider condivisi

Copertura live opzionale per il percorso musicale ComfyUI incluso:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Il file live Comfy copre anche i workflow image e video di comfy quando quelle
sezioni sono configurate.

## Correlati

- [Task in background](/it/automation/tasks) - tracciamento dei task per esecuzioni `music_generate` scollegate
- [Riferimento configurazione](/it/gateway/configuration-reference#agent-defaults) - configurazione `musicGenerationModel`
- [ComfyUI](/it/providers/comfy)
- [Google (Gemini)](/it/providers/google)
- [MiniMax](/it/providers/minimax)
- [Models](/it/concepts/models) - configurazione del modello e failover
- [Panoramica degli strumenti](/it/tools)
