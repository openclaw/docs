---
read_when:
    - Devi eseguire il debug di session id, JSONL delle trascrizioni o campi di sessions.json
    - Stai modificando il comportamento della compattazione automatica o aggiungendo attività di housekeeping “pre-compattazione”
    - Vuoi implementare flush della memoria o turni di sistema silenziosi
summary: 'Approfondimento: store delle sessioni + trascrizioni, ciclo di vita e interni della compattazione (automatica)'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-04-05T14:03:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gestione delle sessioni e compattazione (approfondimento)

Questo documento spiega come OpenClaw gestisce le sessioni end-to-end:

- **Instradamento delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Store delle sessioni** (`sessions.json`) e cosa tiene traccia
- **Persistenza delle trascrizioni** (`*.jsonl`) e la loro struttura
- **Igiene delle trascrizioni** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti di contesto** (finestra di contesto vs token tracciati)
- **Compattazione** (compattazione manuale + automatica) e dove agganciare il lavoro pre-compattazione
- **Housekeeping silenzioso** (ad esempio scritture in memoria che non dovrebbero produrre output visibile all'utente)

Se vuoi prima una panoramica di livello superiore, inizia da:

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/memory](/concepts/memory)
- [/concepts/memory-search](/concepts/memory-search)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato attorno a un singolo **processo Gateway** che possiede lo stato delle sessioni.

- Le UI (app macOS, UI di controllo web, TUI) dovrebbero interrogare il Gateway per ottenere elenchi di sessioni e conteggi dei token.
- In modalità remota, i file di sessione si trovano sull'host remoto; “controllare i file del tuo Mac locale” non rifletterà ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw persiste le sessioni su due livelli:

1. **Store delle sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccolo, mutabile, sicuro da modificare (o da cui eliminare voci)
   - Tiene traccia dei metadati della sessione (session id corrente, ultima attività, toggle, contatori di token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Memorizza la conversazione effettiva + chiamate agli strumenti + riepiloghi di compattazione
   - Usata per ricostruire il contesto del modello per i turni futuri

---

## Posizioni su disco

Per agente, sull'host Gateway:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni con topic Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw risolve questi percorsi tramite `src/config/sessions.ts`.

---

## Manutenzione dello store e controlli sul disco

La persistenza delle sessioni ha controlli automatici di manutenzione (`session.maintenance`) per `sessions.json` e gli artefatti delle trascrizioni:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: soglia di età per voci obsolete (predefinita `30d`)
- `maxEntries`: limite di voci in `sessions.json` (predefinito `500`)
- `rotateBytes`: ruota `sessions.json` quando è troppo grande (predefinito `10mb`)
- `resetArchiveRetention`: retention per gli archivi di trascrizione `*.reset.<timestamp>` (predefinita: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget facoltativo per la directory delle sessioni
- `highWaterBytes`: target facoltativo dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Ordine di applicazione dell'enforcement per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuove prima gli artefatti di trascrizione archiviati o orfani più vecchi.
2. Se è ancora sopra il target, espelle le voci di sessione più vecchie e i relativi file di trascrizione.
3. Continua finché l'utilizzo non è pari o inferiore a `highWaterBytes`.

In modalità `mode: "warn"`, OpenClaw segnala le potenziali espulsioni ma non modifica store/file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni cron e log delle esecuzioni

Anche le esecuzioni cron isolate creano voci di sessione/trascrizioni e hanno controlli di retention dedicati:

- `cron.sessionRetention` (predefinito `24h`) elimina le vecchie sessioni isolate delle esecuzioni cron dallo store delle sessioni (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` potano i file `~/.openclaw/cron/runs/<jobId>.jsonl` (predefiniti: `2_000_000` byte e `2000` righe).

---

## Chiavi di sessione (`sessionKey`)

Una `sessionKey` identifica _in quale contenitore di conversazione_ ti trovi (instradamento + isolamento).

Pattern comuni:

- Chat principale/diretta (per agente): `agent:<agentId>:<mainKey>` (predefinito `main`)
- Gruppo: `agent:<agentId>:<channel>:group:<id>`
- Stanza/canale (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (salvo override)

Le regole canoniche sono documentate in [/concepts/session](/concepts/session).

---

## ID di sessione (`sessionId`)

Ogni `sessionKey` punta a un `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea un nuovo `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito alle 4:00 AM locali sull'host gateway) crea un nuovo `sessionId` al messaggio successivo dopo il confine di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando sono configurati sia il giornaliero sia l'inattività, vince quello che scade per primo.
- **Guardrail di fork del parent thread** (`session.parentForkMaxTokens`, predefinito `100000`) salta il fork della trascrizione parent quando la sessione parent è già troppo grande; il nuovo thread inizia pulito. Imposta `0` per disabilitare.

Dettaglio implementativo: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dello store delle sessioni (`sessions.json`)

Il tipo valore dello store è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: ID della trascrizione corrente (il nome file è derivato da questo, salvo che `sessionFile` sia impostato)
- `updatedAt`: timestamp dell'ultima attività
- `sessionFile`: override facoltativo esplicito del percorso della trascrizione
- `chatType`: `direct | group | room` (aiuta UI e policy di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per etichettatura di gruppo/canale
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori di token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte la compattazione automatica è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush di memoria pre-compattazione
- `memoryFlushCompactionCount`: conteggio di compattazione quando è stato eseguito l'ultimo flush

Lo store è sicuro da modificare, ma il Gateway è l'autorità: può riscrivere o reidratare le voci man mano che le sessioni vengono eseguite.

---

## Struttura delle trascrizioni (`*.jsonl`)

Le trascrizioni sono gestite dal `SessionManager` di `@mariozechner/pi-coding-agent`.

Il file è in formato JSONL:

- Prima riga: header della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` facoltativo)
- Poi: voci di sessione con `id` + `parentId` (albero)

Tipi di voce rilevanti:

- `message`: messaggi user/assistant/toolResult
- `custom_message`: messaggi iniettati dall'estensione che _entrano_ nel contesto del modello (possono essere nascosti alla UI)
- `custom`: stato dell'estensione che non entra nel contesto del modello
- `compaction`: riepilogo persistito della compattazione con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito quando si naviga in un ramo dell'albero

OpenClaw intenzionalmente **non** “corregge” le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto vs token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori nello store delle sessioni**: statistiche progressive scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto proviene dal catalogo modelli (e può essere sovrascritta via configurazione).
- `contextTokens` nello store è un valore di stima/reporting a runtime; non trattarlo come garanzia rigida.

Per approfondire, vedi [/token-use](/reference/token-use).

---

## Compattazione: cos'è

La compattazione riassume la parte più vecchia della conversazione in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo la compattazione, i turni futuri vedono:

- Il riepilogo di compattazione
- I messaggi dopo `firstKeptEntryId`

La compattazione è **persistente** (a differenza del pruning delle sessioni). Vedi [/concepts/session-pruning](/concepts/session-pruning).

## Confini dei chunk di compattazione e accoppiamento degli strumenti

Quando OpenClaw divide una lunga trascrizione in chunk di compattazione, mantiene
accoppiate le tool call dell'assistente con le corrispondenti voci `toolResult`.

- Se la suddivisione per quota di token cade tra una tool call e il suo risultato, OpenClaw sposta il confine al messaggio della tool call dell'assistente invece di separare la coppia.
- Se un blocco finale di tool result farebbe altrimenti superare il target del chunk, OpenClaw preserva quel blocco di strumenti in sospeso e mantiene intatta la coda non riepilogata.
- I blocchi di tool call abortiti/in errore non mantengono aperta una suddivisione in sospeso.

---

## Quando avviene la compattazione automatica (runtime Pi)

Nell'agente Pi incorporato, la compattazione automatica si attiva in due casi:

1. **Recupero da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili modellate sul provider) → compatta → ritenta.
2. **Manutenzione per soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è il margine riservato per prompt + output del modello successivo

Questa è semantica del runtime Pi (OpenClaw consuma gli eventi, ma è Pi a decidere quando compattare).

---

## Impostazioni di compattazione (`reserveTokens`, `keepRecentTokens`)

Le impostazioni di compattazione di Pi si trovano nelle impostazioni Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw applica anche un limite minimo di sicurezza per le esecuzioni incorporate:

- Se `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo aumenta.
- Il limite minimo predefinito è `20000` token.
- Imposta `agents.defaults.compaction.reserveTokensFloor: 0` per disabilitare il limite minimo.
- Se è già più alto, OpenClaw lo lascia invariato.

Perché: lasciare margine sufficiente per “housekeeping” multi-turno (come le scritture di memoria) prima che la compattazione diventi inevitabile.

Implementazione: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(chiamato da `src/agents/pi-embedded-runner.ts`).

---

## Superfici visibili all'utente

Puoi osservare la compattazione e lo stato delle sessioni tramite:

- `/status` (in qualsiasi sessione di chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modalità verbose: `🧹 Auto-compaction complete` + conteggio di compattazione

---

## Housekeeping silenzioso (`NO_REPLY`)

OpenClaw supporta turni “silenziosi” per attività in background in cui l'utente non dovrebbe vedere output intermedi.

Convenzione:

- L'assistente inizia il proprio output con l'esatto token silenzioso `NO_REPLY` /
  `no_reply` per indicare “non consegnare una risposta all'utente”.
- OpenClaw lo rimuove/lo sopprime nel livello di consegna.
- La soppressione del token silenzioso esatto è case-insensitive, quindi `NO_REPLY` e
  `no_reply` valgono entrambi quando l'intero payload è solo il token silenzioso.
- Questo è solo per veri turni in background/senza consegna; non è una scorciatoia per richieste utente ordinarie e attuabili.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming draft/typing** quando un chunk parziale inizia con `NO_REPLY`, così le operazioni silenziose non fanno trapelare output parziali a metà turno.

---

## "Memory flush" pre-compattazione (implementato)

Obiettivo: prima che avvenga la compattazione automatica, eseguire un turno agentico silenzioso che scrive
stato durevole su disco (ad esempio `memory/YYYY-MM-DD.md` nel workspace dell'agente) così la compattazione non può
cancellare il contesto critico.

OpenClaw usa l'approccio di **flush pre-soglia**:

1. Monitora l'uso del contesto della sessione.
2. Quando supera una “soft threshold” (sotto la soglia di compattazione di Pi), esegue una direttiva silenziosa
   “scrivi ora in memoria” verso l'agente.
3. Usa l'esatto token silenzioso `NO_REPLY` / `no_reply` così l'utente non vede
   nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema extra aggiunto per il turno di flush)

Note:

- Il prompt/system prompt predefinito include un suggerimento `NO_REPLY` per sopprimere
  la consegna.
- Il flush viene eseguito una volta per ciclo di compattazione (tracciato in `sessions.json`).
- Il flush viene eseguito solo per sessioni Pi incorporate (i backend CLI lo saltano).
- Il flush viene saltato quando il workspace della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memory](/concepts/memory) per il layout dei file del workspace e i pattern di scrittura.

Pi espone anche un hook `session_before_compact` nell'API delle extension, ma oggi la logica di
flush di OpenClaw si trova lato Gateway.

---

## Checklist di risoluzione dei problemi

- Session key errata? Inizia da [/concepts/session](/concepts/session) e conferma la `sessionKey` in `/status`.
- Mismatch tra store e trascrizione? Conferma l'host Gateway e il percorso dello store da `openclaw status`.
- Compattazione eccessiva? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di compattazione (`reserveTokens` troppo alto rispetto alla finestra del modello può causare compattazione anticipata)
  - gonfiore dei tool result: abilita/regola il pruning delle sessioni
- Perdite nei turni silenziosi? Conferma che la risposta inizi con `NO_REPLY` (token esatto case-insensitive) e che tu sia su una build che include la correzione della soppressione dello streaming.
