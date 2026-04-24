---
read_when:
    - Generare musica o audio tramite l’agente
    - |-
      Configurare provider e modelli di generazione musicaleിപ്പ to=final code```
      Configurare provider e modelli di generazione musicale
      ```
    - Capire i parametri dello strumento `music_generate`
summary: Generare musica con provider condivisi, inclusi Plugin supportati da workflow
title: Generazione musicale
x-i18n:
    generated_at: "2026-04-24T09:07:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5fe640c6b83f6f2cf5ad8e57294da147f241706c30eee0d0eb6f7d82cbbe0d3
    source_path: tools/music-generation.md
    workflow: 15
---

Lo strumento `music_generate` permette all’agente di creare musica o audio tramite la
capacità condivisa di generazione musicale con provider configurati come Google,
MiniMax e ComfyUI configurato tramite workflow.

Per le sessioni agente supportate da provider condivisi, OpenClaw avvia la generazione musicale come
attività in background, la traccia nel registro delle attività, poi riattiva di nuovo l’agente quando
il brano è pronto così l’agente può pubblicare l’audio finito nel canale
originale.

<Note>
Lo strumento condiviso integrato compare solo quando è disponibile almeno un provider di generazione musicale. Se non vedi `music_generate` negli strumenti del tuo agente, configura `agents.defaults.musicGenerationModel` oppure imposta una chiave API del provider.
</Note>

## Avvio rapido

### Generazione supportata da provider condivisi

1. Imposta una chiave API per almeno un provider, per esempio `GEMINI_API_KEY` oppure
   `MINIMAX_API_KEY`.
2. Imposta facoltativamente il tuo modello preferito:

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

3. Chiedi all’agente: _"Generate an upbeat synthpop track about a night drive
   through a neon city."_

L’agente chiama automaticamente `music_generate`. Non serve alcuna allowlist degli strumenti.

Per contesti sincroni diretti senza un’esecuzione agente supportata da sessione, lo strumento integrato
usa comunque come fallback la generazione inline e restituisce il percorso finale del media
nel risultato dello strumento.

Esempi di prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Generazione Comfy guidata da workflow

Il Plugin incluso `comfy` si collega allo strumento condiviso `music_generate` tramite
il registro provider di generazione musicale.

1. Configura `models.providers.comfy.music` con un JSON workflow e
   nodi prompt/output.
2. Se usi Comfy Cloud, imposta `COMFY_API_KEY` oppure `COMFY_CLOUD_API_KEY`.
3. Chiedi musica all’agente oppure chiama direttamente lo strumento.

Esempio:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Supporto condiviso dei provider inclusi

| Provider | Modello predefinito     | Input di riferimento | Controlli supportati                                         | Chiave API                              |
| -------- | ----------------------- | -------------------- | ------------------------------------------------------------ | --------------------------------------- |
| ComfyUI  | `workflow`              | Fino a 1 immagine    | Musica o audio definiti dal workflow                         | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`  |
| Google   | `lyria-3-clip-preview`  | Fino a 10 immagini   | `lyrics`, `instrumental`, `format`                           | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax  | `music-2.5+`            | Nessuno              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3`    | `MINIMAX_API_KEY`                       |

### Matrice delle capacità dichiarate

Questo è il contratto esplicito delle modalità usato da `music_generate`, dai test di contratto
e dalla sweep live condivisa.

| Provider | `generate` | `edit` | Limite edit | Lane live condivise                                                      |
| -------- | ---------- | ------ | ----------- | ------------------------------------------------------------------------ |
| ComfyUI  | Sì         | Sì     | 1 immagine  | Non nella sweep condivisa; coperto da `extensions/comfy/comfy.live.test.ts` |
| Google   | Sì         | Sì     | 10 immagini | `generate`, `edit`                                                       |
| MiniMax  | Sì         | No     | Nessuno     | `generate`                                                               |

Usa `action: "list"` per ispezionare i provider e i modelli condivisi disponibili
a runtime:

```text
/tool music_generate action=list
```

Usa `action: "status"` per ispezionare l’attività musicale attiva supportata da sessione:

```text
/tool music_generate action=status
```

Esempio di generazione diretta:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parametri dello strumento integrato

| Parametro         | Tipo      | Descrizione                                                                                      |
| ----------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `prompt`          | string    | Prompt di generazione musicale (obbligatorio per `action: "generate"`)                          |
| `action`          | string    | `"generate"` (predefinito), `"status"` per l’attività corrente della sessione, oppure `"list"` per ispezionare i provider |
| `model`           | string    | Override provider/modello, es. `google/lyria-3-pro-preview` oppure `comfy/workflow`             |
| `lyrics`          | string    | Testo opzionale quando il provider supporta input esplicito dei testi                            |
| `instrumental`    | boolean   | Richiede output solo strumentale quando il provider lo supporta                                  |
| `image`           | string    | Percorso o URL di una singola immagine di riferimento                                            |
| `images`          | string[]  | Più immagini di riferimento (fino a 10)                                                          |
| `durationSeconds` | number    | Durata target in secondi quando il provider supporta suggerimenti di durata                      |
| `timeoutMs`       | number    | Timeout facoltativo della richiesta al provider in millisecondi                                  |
| `format`          | string    | Suggerimento del formato di output (`mp3` oppure `wav`) quando il provider lo supporta           |
| `filename`        | string    | Suggerimento del nome file di output                                                             |

Non tutti i provider supportano tutti i parametri. OpenClaw valida comunque limiti rigidi
come il numero di input prima dell’invio. Quando un provider supporta la durata ma
usa un massimo più corto del valore richiesto, OpenClaw limita automaticamente
al valore supportato più vicino. I suggerimenti opzionali davvero non supportati vengono ignorati
con un avviso quando il provider o il modello selezionato non possono rispettarli.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw limita la durata durante il fallback del provider, il `durationSeconds` restituito riflette il valore inviato e `details.normalization.durationSeconds` mostra la mappatura da richiesto ad applicato.

## Comportamento asincrono per il percorso condiviso supportato da provider

- Esecuzioni agente supportate da sessione: `music_generate` crea un’attività in background, restituisce immediatamente una risposta started/task e pubblica il brano finito più tardi in un messaggio agente di follow-up.
- Prevenzione dei duplicati: mentre quell’attività in background è ancora `queued` oppure `running`, le chiamate successive a `music_generate` nella stessa sessione restituiscono lo stato dell’attività invece di avviare un’altra generazione.
- Lookup dello stato: usa `action: "status"` per ispezionare l’attività musicale attiva supportata da sessione senza avviare una nuova generazione.
- Tracciamento delle attività: usa `openclaw tasks list` oppure `openclaw tasks show <taskId>` per ispezionare stato queued, running e terminale della generazione.
- Wake di completamento: OpenClaw inietta di nuovo nella stessa sessione un evento interno di completamento così il modello può scrivere da solo il follow-up rivolto all’utente.
- Suggerimento di prompt: i turni successivi dell’utente/manuali nella stessa sessione ricevono un piccolo suggerimento runtime quando un’attività musicale è già in corso così il modello non richiama ciecamente `music_generate`.
- Fallback senza sessione: i contesti diretti/locali senza una vera sessione agente vengono comunque eseguiti inline e restituiscono il risultato audio finale nello stesso turno.

### Ciclo di vita dell’attività

Ogni richiesta `music_generate` passa attraverso quattro stati:

1. **queued** -- attività creata, in attesa che il provider la accetti.
2. **running** -- il provider sta elaborando (tipicamente da 30 secondi a 3 minuti a seconda del provider e della durata).
3. **succeeded** -- il brano è pronto; l’agente si riattiva e lo pubblica nella conversazione.
4. **failed** -- errore del provider o timeout; l’agente si riattiva con i dettagli dell’errore.

Controlla lo stato dalla CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevenzione dei duplicati: se esiste già un’attività musicale `queued` oppure `running` per la sessione corrente, `music_generate` restituisce lo stato dell’attività esistente invece di avviarne una nuova. Usa `action: "status"` per controllare esplicitamente senza attivare una nuova generazione.

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

Quando genera musica, OpenClaw prova i provider in quest’ordine:

1. parametro `model` dalla chiamata dello strumento, se l’agente ne specifica uno
2. `musicGenerationModel.primary` dalla configurazione
3. `musicGenerationModel.fallbacks` nell’ordine
4. auto-rilevamento usando solo i valori predefiniti del provider supportati da autenticazione:
   - prima il provider predefinito corrente
   - poi i restanti provider di generazione musicale registrati in ordine di provider-id

Se un provider fallisce, viene provato automaticamente il candidato successivo. Se falliscono tutti,
l’errore include i dettagli di ogni tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi
che la generazione musicale usi solo le voci esplicite `model`, `primary` e `fallbacks`.

## Note sui provider

- Google usa la generazione batch Lyria 3. Il flusso incluso attuale supporta
  prompt, testo lyrics opzionale e immagini di riferimento opzionali.
- MiniMax usa l’endpoint batch `music_generation`. Il flusso incluso attuale
  supporta prompt, lyrics opzionali, modalità strumentale, orientamento della durata e
  output mp3.
- Il supporto ComfyUI è guidato dal workflow e dipende dal grafo configurato più
  la mappatura dei nodi per i campi prompt/output.

## Modalità di capacità del provider

Il contratto condiviso di generazione musicale ora supporta dichiarazioni esplicite di modalità:

- `generate` per generazione solo da prompt
- `edit` quando la richiesta include una o più immagini di riferimento

Le nuove implementazioni dei provider dovrebbero preferire blocchi di modalità espliciti:

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
`supportsFormat` non bastano a pubblicizzare il supporto edit. I provider dovrebbero
dichiarare esplicitamente `generate` ed `edit` così i test live, i test di contratto e
lo strumento condiviso `music_generate` possono validare il supporto della modalità in modo deterministico.

## Scegliere il percorso giusto

- Usa il percorso condiviso supportato da provider quando vuoi selezione del modello, failover del provider e il flusso asincrono integrato task/status.
- Usa un percorso Plugin come ComfyUI quando hai bisogno di un grafo workflow personalizzato o di un provider che non fa parte della capacità musicale condivisa inclusa.
- Se stai eseguendo il debug di un comportamento specifico di ComfyUI, vedi [ComfyUI](/it/providers/comfy). Se stai eseguendo il debug del comportamento dei provider condivisi, inizia da [Google (Gemini)](/it/providers/google) oppure [MiniMax](/it/providers/minimax).

## Test live

Copertura live opt-in per i provider condivisi inclusi:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repository:

```bash
pnpm test:live:media music
```

Questo file live carica le variabili env mancanti del provider da `~/.profile`, preferisce
le chiavi API live/env ai profili di autenticazione memorizzati per impostazione predefinita e
esegue sia la copertura `generate` sia quella `edit` dichiarata quando il provider abilita la modalità edit.

Oggi questo significa:

- `google`: `generate` più `edit`
- `minimax`: solo `generate`
- `comfy`: copertura live Comfy separata, non nella sweep dei provider condivisi

Copertura live opt-in per il percorso musicale ComfyUI incluso:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Il file live Comfy copre anche workflow comfy di immagini e video quando quelle
sezioni sono configurate.

## Correlati

- [Attività in background](/it/automation/tasks) - tracciamento delle attività per esecuzioni `music_generate` scollegate
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) - configurazione `musicGenerationModel`
- [ComfyUI](/it/providers/comfy)
- [Google (Gemini)](/it/providers/google)
- [MiniMax](/it/providers/minimax)
- [Models](/it/concepts/models) - configurazione del modello e failover
- [Panoramica degli strumenti](/it/tools)
