---
read_when:
    - Hai bisogno di eseguire il debug di ID sessione, JSONL delle trascrizioni o campi di sessions.json
    - Stai modificando il comportamento della Compaction automatica o aggiungendo operazioni preliminari “pre-compaction”
    - Vuoi implementare flush della memoria o turni di sistema silenziosi
summary: 'Approfondimento: archivio delle sessioni + trascrizioni, ciclo di vita e dettagli interni della Compaction (automatica)'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-04-24T09:00:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gestione delle sessioni e Compaction (approfondimento)

Questo documento spiega come OpenClaw gestisce le sessioni end-to-end:

- **Instradamento delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Archivio delle sessioni** (`sessions.json`) e cosa tiene traccia
- **Persistenza delle trascrizioni** (`*.jsonl`) e la loro struttura
- **Igiene delle trascrizioni** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti di contesto** (finestra di contesto vs token tracciati)
- **Compaction** (Compaction manuale + automatica) e dove agganciare il lavoro pre-Compaction
- **Operazioni silenziose** (per esempio scritture di memoria che non dovrebbero produrre output visibile all'utente)

Se vuoi prima una panoramica di livello superiore, inizia da:

- [/concepts/session](/it/concepts/session)
- [/concepts/compaction](/it/concepts/compaction)
- [/concepts/memory](/it/concepts/memory)
- [/concepts/memory-search](/it/concepts/memory-search)
- [/concepts/session-pruning](/it/concepts/session-pruning)
- [/reference/transcript-hygiene](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato attorno a un singolo **processo Gateway** che possiede lo stato delle sessioni.

- Le UI (app macOS, web Control UI, TUI) dovrebbero interrogare il Gateway per elenchi di sessioni e conteggi di token.
- In modalità remota, i file di sessione si trovano sull'host remoto; “controllare i file sul tuo Mac locale” non riflette ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw mantiene le sessioni in due livelli:

1. **Archivio delle sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccolo, mutabile, sicuro da modificare (o da cui eliminare voci)
   - Tiene traccia dei metadati della sessione (id della sessione corrente, ultima attività, toggle, contatori di token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Memorizza la conversazione effettiva + chiamate agli strumenti + riepiloghi di Compaction
   - Usata per ricostruire il contesto del modello per i turni futuri

---

## Percorsi su disco

Per agente, sull'host Gateway:

- Archivio: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni di topic Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw li risolve tramite `src/config/sessions.ts`.

---

## Manutenzione dell'archivio e controlli del disco

La persistenza delle sessioni ha controlli automatici di manutenzione (`session.maintenance`) per `sessions.json` e gli artefatti delle trascrizioni:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: limite di età per le voci obsolete (predefinito `30d`)
- `maxEntries`: limite massimo di voci in `sessions.json` (predefinito `500`)
- `rotateBytes`: ruota `sessions.json` quando è sovradimensionato (predefinito `10mb`)
- `resetArchiveRetention`: retention per gli archivi di trascrizione `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget facoltativo per la directory delle sessioni
- `highWaterBytes`: target facoltativo dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuovi prima gli artefatti di trascrizione archiviati o orfani più vecchi.
2. Se ancora sopra il target, espelli le voci di sessione più vecchie e i loro file di trascrizione.
3. Continua finché l'utilizzo non è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala le potenziali espulsioni ma non modifica l'archivio/i file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log delle esecuzioni

Le esecuzioni Cron isolate creano anch'esse voci/trascrizioni di sessione e hanno controlli di retention dedicati:

- `cron.sessionRetention` (predefinito `24h`) elimina dall'archivio sessioni le vecchie sessioni di esecuzione Cron isolate (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` eliminano i file `~/.openclaw/cron/runs/<jobId>.jsonl` (predefiniti: `2_000_000` byte e `2000` righe).

---

## Chiavi di sessione (`sessionKey`)

Una `sessionKey` identifica _in quale bucket di conversazione_ ti trovi (instradamento + isolamento).

Pattern comuni:

- Chat principale/diretta (per agente): `agent:<agentId>:<mainKey>` (predefinito `main`)
- Gruppo: `agent:<agentId>:<channel>:group:<id>`
- Room/canale (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oppure `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a meno di override)

Le regole canoniche sono documentate in [/concepts/session](/it/concepts/session).

---

## ID di sessione (`sessionId`)

Ogni `sessionKey` punta a un `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea un nuovo `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito alle 4:00 ora locale sull'host Gateway) crea un nuovo `sessionId` al messaggio successivo dopo il confine di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando sono configurati sia reset giornaliero sia inattività, prevale quello che scade per primo.
- **Guard di fork del parent thread** (`session.parentForkMaxTokens`, predefinito `100000`) salta il forking della trascrizione del parent quando la sessione parent è già troppo grande; il nuovo thread parte da zero. Imposta `0` per disabilitare.

Dettaglio implementativo: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dell'archivio delle sessioni (`sessions.json`)

Il tipo di valore dell'archivio è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: id della trascrizione corrente (il nome file viene derivato da questo a meno che non sia impostato `sessionFile`)
- `updatedAt`: timestamp dell'ultima attività
- `sessionFile`: override facoltativo del percorso della trascrizione
- `chatType`: `direct | group | room` (aiuta UI e policy di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per l'etichettatura di gruppi/canali
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori di token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte la Compaction automatica è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush di memoria pre-Compaction
- `memoryFlushCompactionCount`: conteggio di Compaction quando è stato eseguito l'ultimo flush

L'archivio è sicuro da modificare, ma il Gateway è l'autorità: può riscrivere o reidratare le voci mentre le sessioni vengono eseguite.

---

## Struttura della trascrizione (`*.jsonl`)

Le trascrizioni sono gestite da `@mariozechner/pi-coding-agent` tramite `SessionManager`.

Il file è JSONL:

- Prima riga: header della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` facoltativa)
- Poi: voci di sessione con `id` + `parentId` (albero)

Tipi di voci notevoli:

- `message`: messaggi user/assistant/toolResult
- `custom_message`: messaggi iniettati da estensioni che _entrano_ nel contesto del modello (possono essere nascosti dalla UI)
- `custom`: stato dell'estensione che _non_ entra nel contesto del modello
- `compaction`: riepilogo di Compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito quando si naviga in un ramo dell'albero

OpenClaw intenzionalmente **non** “corregge” le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto vs token tracciati

Contano due concetti differenti:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dell'archivio sessioni**: statistiche rolling scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto proviene dal catalogo dei modelli (e può essere sovrascritta via configurazione).
- `contextTokens` nell'archivio è un valore di stima/reporting runtime; non trattarlo come una garanzia rigorosa.

Per approfondire, vedi [/token-use](/it/reference/token-use).

---

## Compaction: cos'è

La Compaction riassume la conversazione più vecchia in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo la Compaction, i turni futuri vedono:

- Il riepilogo di Compaction
- I messaggi dopo `firstKeptEntryId`

La Compaction è **persistente** (a differenza del Session pruning). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Confini dei blocchi di Compaction e accoppiamento degli strumenti

Quando OpenClaw divide una lunga trascrizione in blocchi di Compaction, mantiene
le chiamate agli strumenti dell'assistente accoppiate con le rispettive voci `toolResult`.

- Se il punto di divisione basato sulla quota di token cade tra una chiamata a uno strumento e il suo risultato, OpenClaw
  sposta il confine al messaggio della chiamata allo strumento dell'assistente invece di separare
  la coppia.
- Se un blocco finale di tool-result spingerebbe altrimenti il blocco oltre il target,
  OpenClaw preserva quel blocco di strumenti in sospeso e mantiene intatta la coda non riassunta.
- I blocchi di chiamata a strumenti abortiti/in errore non mantengono aperta una divisione in sospeso.

---

## Quando avviene la Compaction automatica (runtime Pi)

Nell'agente Pi incorporato, la Compaction automatica si attiva in due casi:

1. **Recupero da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili specifiche del provider) → compact → retry.
2. **Manutenzione per soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è l'headroom riservato per i prompt + il prossimo output del modello

Queste sono semantiche del runtime Pi (OpenClaw consuma gli eventi, ma è Pi a decidere quando compattare).

---

## Impostazioni di Compaction (`reserveTokens`, `keepRecentTokens`)

Le impostazioni di Compaction di Pi vivono nelle impostazioni Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw applica anche una soglia minima di sicurezza per le esecuzioni incorporate:

- Se `compaction.reserveTokens < reserveTokensFloor`, OpenClaw la aumenta.
- Il valore minimo predefinito è `20000` token.
- Imposta `agents.defaults.compaction.reserveTokensFloor: 0` per disabilitare la soglia.
- Se è già più alto, OpenClaw lo lascia invariato.

Perché: lasciare abbastanza headroom per operazioni “di manutenzione” multi-turno (come le scritture di memoria) prima che la Compaction diventi inevitabile.

Implementazione: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(chiamata da `src/agents/pi-embedded-runner.ts`).

---

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction tramite `registerCompactionProvider()` sull'API del plugin. Quando `agents.defaults.compaction.provider` è impostato su un ID provider registrato, l'estensione safeguard delega il riepilogo a quel provider invece che alla pipeline integrata `summarizeInStages`.

- `provider`: id di un Plugin provider di Compaction registrato. Lascialo non impostato per il riepilogo LLM predefinito.
- Impostare `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di Compaction e la stessa policy di preservazione degli identificatori del percorso integrato.
- La safeguard continua a preservare il contesto di suffisso dei turni recenti e dei turni divisi dopo l'output del provider.
- Se il provider fallisce o restituisce un risultato vuoto, OpenClaw usa automaticamente come fallback il riepilogo LLM integrato.
- I segnali di abort/timeout vengono rilanciati (non assorbiti) per rispettare la cancellazione del chiamante.

Sorgente: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfici visibili all'utente

Puoi osservare Compaction e stato della sessione tramite:

- `/status` (in qualsiasi sessione chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modalità verbose: `🧹 Auto-compaction complete` + conteggio Compaction

---

## Operazioni silenziose (`NO_REPLY`)

OpenClaw supporta turni “silenziosi” per attività in background in cui l'utente non dovrebbe vedere output intermedio.

Convenzione:

- L'assistente inizia il proprio output con l'esatto token silenzioso `NO_REPLY` /
  `no_reply` per indicare “non consegnare una risposta all'utente”.
- OpenClaw lo rimuove/sopprime nel livello di consegna.
- La soppressione del token silenzioso esatto è case-insensitive, quindi `NO_REPLY` e
  `no_reply` contano entrambi quando l'intero payload è solo il token silenzioso.
- Questo è solo per turni veramente in background/senza consegna; non è una scorciatoia per
  normali richieste utente azionabili.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming di bozza/digitazione** quando un
blocco parziale inizia con `NO_REPLY`, così le operazioni silenziose non lasciano trapelare output parziale a metà turno.

---

## "Memory flush" pre-Compaction (implementato)

Obiettivo: prima che avvenga la Compaction automatica, eseguire un turno agentico silenzioso che scriva stato durevole
su disco (per esempio `memory/YYYY-MM-DD.md` nel workspace dell'agente) così la Compaction non possa
cancellare contesto critico.

OpenClaw usa l'approccio del **flush pre-soglia**:

1. Monitora l'utilizzo del contesto della sessione.
2. Quando supera una “soglia morbida” (al di sotto della soglia di Compaction di Pi), esegue una direttiva silenziosa
   “scrivi memoria ora” verso l'agente.
3. Usa l'esatto token silenzioso `NO_REPLY` / `no_reply` così l'utente non vede
   nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema aggiuntivo accodato per il turno di flush)

Note:

- Il prompt/system prompt predefinito include un suggerimento `NO_REPLY` per sopprimere la consegna.
- Il flush viene eseguito una volta per ciclo di Compaction (tracciato in `sessions.json`).
- Il flush viene eseguito solo per sessioni Pi incorporate (i backend CLI lo saltano).
- Il flush viene saltato quando il workspace della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memoria](/it/concepts/memory) per il layout dei file del workspace e i pattern di scrittura.

Pi espone anche un hook `session_before_compact` nell'API delle estensioni, ma la logica
di flush di OpenClaw oggi vive lato Gateway.

---

## Checklist di risoluzione dei problemi

- La chiave di sessione è sbagliata? Inizia da [/concepts/session](/it/concepts/session) e conferma la `sessionKey` in `/status`.
- Mancata corrispondenza tra archivio e trascrizione? Conferma l'host Gateway e il percorso dell'archivio da `openclaw status`.
- Spam di Compaction? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di Compaction (`reserveTokens` troppo alto rispetto alla finestra del modello può causare una Compaction anticipata)
  - eccesso di `tool-result`: abilita/regola il Session pruning
- I turni silenziosi perdono output? Conferma che la risposta inizi con `NO_REPLY` (token esatto case-insensitive) e che tu stia usando una build che include la correzione di soppressione dello streaming.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Session pruning](/it/concepts/session-pruning)
- [Context engine](/it/concepts/context-engine)
