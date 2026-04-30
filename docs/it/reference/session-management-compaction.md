---
read_when:
    - È necessario eseguire il debug degli ID di sessione, del JSONL della trascrizione o dei campi di sessions.json
    - Stai modificando il comportamento della Compaction automatica o aggiungendo attività di manutenzione “pre-Compaction”
    - Vuoi implementare svuotamenti della memoria o turni di sistema silenziosi
summary: 'Approfondimento: archivio delle sessioni + trascrizioni, ciclo di vita e internals della Compaction automatica'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-04-30T09:12:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestisce le sessioni end-to-end in queste aree:

- **Routing delle sessioni** (come i messaggi in ingresso vengono mappati a un `sessionKey`)
- **Archivio delle sessioni** (`sessions.json`) e cosa traccia
- **Persistenza della trascrizione** (`*.jsonl`) e la sua struttura
- **Igiene della trascrizione** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti di contesto** (finestra di contesto rispetto ai token tracciati)
- **Compaction** (Compaction manuale e automatica) e dove agganciare il lavoro pre-Compaction
- **Manutenzione silenziosa** (scritture di memoria che non devono produrre output visibile all'utente)

Se vuoi prima una panoramica di livello più alto, inizia da:

- [Gestione delle sessioni](/it/concepts/session)
- [Compaction](/it/concepts/compaction)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Igiene della trascrizione](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato attorno a un singolo **processo Gateway** che possiede lo stato delle sessioni.

- Le UI (app macOS, Control UI web, TUI) devono interrogare il Gateway per elenchi di sessioni e conteggi dei token.
- In modalità remota, i file di sessione si trovano sull'host remoto; “controllare i file locali del tuo Mac” non rifletterà ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw persiste le sessioni in due livelli:

1. **Archivio delle sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccolo, mutabile, sicuro da modificare (o da cui eliminare voci)
   - Traccia i metadati della sessione (id della sessione corrente, ultima attività, interruttori, contatori di token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Archivia la conversazione effettiva + chiamate agli strumenti + riepiloghi di Compaction
   - Usata per ricostruire il contesto del modello per i turni futuri
   - I grandi checkpoint di debug pre-Compaction vengono saltati quando la trascrizione attiva
     supera il limite di dimensione del checkpoint, evitando una seconda enorme
     copia `.checkpoint.*.jsonl`.

---

## Posizioni su disco

Per agente, sull'host del Gateway:

- Archivio: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni di topic Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw le risolve tramite `src/config/sessions.ts`.

---

## Manutenzione dell'archivio e controlli del disco

La persistenza delle sessioni ha controlli di manutenzione automatici (`session.maintenance`) per `sessions.json`, artefatti di trascrizione e sidecar delle traiettorie:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: soglia di età per voci obsolete (predefinito `30d`)
- `maxEntries`: limite delle voci in `sessions.json` (predefinito `500`)
- `resetArchiveRetention`: conservazione per gli archivi di trascrizione `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget opzionale della directory delle sessioni
- `highWaterBytes`: obiettivo opzionale dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Le normali scritture del Gateway raggruppano la pulizia di `maxEntries` per limiti di dimensione di produzione, quindi un archivio può superare brevemente il limite configurato prima che la successiva pulizia high-water lo riscriva riportandolo sotto il limite. `openclaw sessions cleanup --enforce` applica comunque subito il limite configurato.

OpenClaw non crea più backup automatici a rotazione `sessions.json.bak.*` durante le scritture del Gateway. La vecchia chiave `session.maintenance.rotateBytes` viene ignorata e `openclaw doctor --fix` la rimuove dalle configurazioni più vecchie.

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuovi prima gli artefatti archiviati più vecchi, le trascrizioni orfane o gli artefatti di traiettoria orfani.
2. Se si è ancora sopra l'obiettivo, elimina le voci di sessione più vecchie e i relativi file di trascrizione/traiettoria.
3. Continua finché l'utilizzo non è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala potenziali eliminazioni ma non modifica l'archivio/i file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log di esecuzione

Anche le esecuzioni Cron isolate creano voci di sessione/trascrizioni e hanno controlli di conservazione dedicati:

- `cron.sessionRetention` (predefinito `24h`) elimina le vecchie sessioni di esecuzione Cron isolate dall'archivio delle sessioni (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` potano i file `~/.openclaw/cron/runs/<jobId>.jsonl` (predefiniti: `2_000_000` byte e `2000` righe).

Quando Cron forza la creazione di una nuova sessione di esecuzione isolata, sanifica la precedente
voce di sessione `cron:<jobId>` prima di scrivere la nuova riga. Conserva preferenze
sicure come impostazioni thinking/fast/verbose, etichette e override espliciti
di modello/auth selezionati dall'utente. Scarta il contesto ambientale della conversazione come
routing di canale/gruppo, criterio di invio o coda, elevazione, origine e associazione runtime
ACP, così una nuova esecuzione isolata non può ereditare consegna obsoleta o
autorità runtime da un'esecuzione più vecchia.

---

## Chiavi di sessione (`sessionKey`)

Un `sessionKey` identifica _in quale bucket di conversazione_ ti trovi (routing + isolamento).

Schemi comuni:

- Chat principale/diretta (per agente): `agent:<agentId>:<mainKey>` (predefinito `main`)
- Gruppo: `agent:<agentId>:<channel>:group:<id>`
- Stanza/canale (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (salvo override)

Le regole canoniche sono documentate in [/concepts/session](/it/concepts/session).

---

## Id di sessione (`sessionId`)

Ogni `sessionKey` punta a un `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea un nuovo `sessionId` per quel `sessionKey`.
- **Reset giornaliero** (predefinito 4:00 AM ora locale sull'host del gateway) crea un nuovo `sessionId` al messaggio successivo dopo il limite di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o il legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando giornaliero + inattività sono entrambi configurati, vince quello che scade per primo.
- **Eventi di sistema** (heartbeat, risvegli Cron, notifiche exec, contabilità del gateway) possono modificare la riga di sessione ma non estendono la freschezza del reset giornaliero/per inattività. Il rollover del reset scarta gli avvisi di evento di sistema in coda per la sessione precedente prima che venga costruito il prompt fresco.
- **Guardia fork del genitore del thread** (`session.parentForkMaxTokens`, predefinito `100000`) salta il fork della trascrizione genitore quando la sessione genitore è già troppo grande; il nuovo thread parte da zero. Imposta `0` per disabilitare.

Dettaglio di implementazione: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dell'archivio delle sessioni (`sessions.json`)

Il tipo valore dell'archivio è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: id della trascrizione corrente (il nome file deriva da questo salvo che `sessionFile` sia impostato)
- `sessionStartedAt`: timestamp di inizio per il `sessionId` corrente; la freschezza del reset giornaliero
  usa questo. Le righe legacy possono derivarlo dall'intestazione della sessione JSONL.
- `lastInteractionAt`: timestamp dell'ultima interazione reale utente/canale; la freschezza del reset
  per inattività usa questo, così Heartbeat, Cron ed eventi exec non mantengono vive le sessioni.
  Le righe legacy senza questo campo fanno fallback all'ora di inizio sessione recuperata
  per la freschezza dell'inattività.
- `updatedAt`: timestamp dell'ultima modifica della riga dell'archivio, usato per elenchi, potatura e
  contabilità. Non è l'autorità per la freschezza del reset giornaliero/per inattività.
- `sessionFile`: override opzionale esplicito del percorso della trascrizione
- `chatType`: `direct | group | room` (aiuta le UI e il criterio di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per etichettare gruppi/canali
- Interruttori:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per-sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori di token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte la Compaction automatica è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush di memoria pre-Compaction
- `memoryFlushCompactionCount`: conteggio di Compaction quando è stato eseguito l'ultimo flush

L'archivio è sicuro da modificare, ma il Gateway è l'autorità: può riscrivere o reidratare voci mentre le sessioni vengono eseguite.

---

## Struttura della trascrizione (`*.jsonl`)

Le trascrizioni sono gestite dal `SessionManager` di `@mariozechner/pi-coding-agent`.

Il file è JSONL:

- Prima riga: intestazione della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` opzionale)
- Poi: voci di sessione con `id` + `parentId` (albero)

Tipi di voce notevoli:

- `message`: messaggi user/assistant/toolResult
- `custom_message`: messaggi iniettati dall'estensione che _entrano_ nel contesto del modello (possono essere nascosti dalla UI)
- `custom`: stato dell'estensione che _non_ entra nel contesto del modello
- `compaction`: riepilogo di Compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito quando si naviga un ramo dell'albero

OpenClaw intenzionalmente **non** “corregge” le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto rispetto ai token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dell'archivio delle sessioni**: statistiche mobili scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto proviene dal catalogo dei modelli (e può essere sovrascritta tramite configurazione).
- `contextTokens` nell'archivio è una stima/valore di reporting a runtime; non trattarlo come una garanzia rigida.

Per saperne di più, vedi [/token-use](/it/reference/token-use).

---

## Compaction: cos'è

La Compaction riassume la conversazione più vecchia in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo la Compaction, i turni futuri vedono:

- Il riepilogo di Compaction
- I messaggi dopo `firstKeptEntryId`

La Compaction è **persistente** (a differenza della potatura delle sessioni). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Confini dei chunk di Compaction e abbinamento degli strumenti

Quando OpenClaw divide una trascrizione lunga in chunk di Compaction, mantiene
le chiamate agli strumenti dell'assistente abbinate alle voci `toolResult` corrispondenti.

- Se la divisione per quota di token cade tra una chiamata allo strumento e il suo risultato, OpenClaw
  sposta il confine al messaggio di chiamata allo strumento dell'assistente invece di separare
  la coppia.
- Se un blocco finale di risultati dello strumento supererebbe altrimenti il target del chunk,
  OpenClaw preserva quel blocco di strumenti in sospeso e mantiene intatta la coda
  non riassunta.
- I blocchi di chiamate allo strumento abortiti/con errore non tengono aperta una divisione in sospeso.

---

## Quando avviene la Compaction automatica (runtime Pi)

Nell'agente Pi incorporato, la Compaction automatica si attiva in due casi:

1. **Recupero da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili modellate dai provider) → compatta → riprova.
2. **Manutenzione della soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è lo spazio di margine riservato per i prompt + il successivo output del modello

Queste sono semantiche del runtime Pi (OpenClaw consuma gli eventi, ma Pi decide quando compattare).

OpenClaw può anche attivare una Compaction locale preliminare prima di aprire la successiva
esecuzione quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato e il
file di trascrizione attivo raggiunge quella dimensione. Questa è una guardia basata sulla dimensione
del file per il costo di riapertura locale, non archiviazione grezza: OpenClaw esegue comunque la normale Compaction semantica,
e richiede `truncateAfterCompaction` affinché il riepilogo compattato possa diventare una
nuova trascrizione successore.

---

## Impostazioni di Compaction (`reserveTokens`, `keepRecentTokens`)

Le impostazioni di Compaction di Pi si trovano nelle impostazioni di Pi:

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
- La soglia minima predefinita è `20000` token.
- Imposta `agents.defaults.compaction.reserveTokensFloor: 0` per disabilitare la soglia minima.
- Se è già più alta, OpenClaw la lascia invariata.
- `/compact` manuale rispetta un valore esplicito di `agents.defaults.compaction.keepRecentTokens`
  e mantiene il punto di taglio della coda recente di Pi. Senza un budget di mantenimento esplicito,
  la compattazione manuale resta un checkpoint rigido e il contesto ricostruito parte dal
  nuovo riepilogo.
- Imposta `agents.defaults.compaction.maxActiveTranscriptBytes` su un valore in byte o
  una stringa come `"20mb"` per eseguire la compattazione locale prima di un turno quando la trascrizione
  attiva diventa grande. Questa protezione è attiva solo quando
  anche `truncateAfterCompaction` è abilitato. Lascialo non impostato o impostalo a `0` per
  disabilitarlo.
- Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato,
  OpenClaw ruota la trascrizione attiva verso un JSONL successore compattato dopo
  la compattazione. La vecchia trascrizione completa resta archiviata e collegata dal
  checkpoint di compattazione invece di essere riscritta sul posto.

Perché: lasciare margine sufficiente per la “manutenzione” multi-turno (come le scritture in memoria) prima che la compattazione diventi inevitabile.

Implementazione: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(chiamata da `src/agents/pi-embedded-runner.ts`).

---

## Provider di compattazione collegabili

I Plugin possono registrare un provider di compattazione tramite `registerCompactionProvider()` nell'API del plugin. Quando `agents.defaults.compaction.provider` è impostato sull'id di un provider registrato, l'estensione di salvaguardia delega la riepilogazione a quel provider invece che alla pipeline integrata `summarizeInStages`.

- `provider`: id di un plugin provider di compattazione registrato. Lascialo non impostato per la riepilogazione LLM predefinita.
- Impostare un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di compattazione e la stessa policy di preservazione degli identificatori del percorso integrato.
- La salvaguardia conserva comunque il contesto di suffisso dei turni recenti e dei turni divisi dopo l'output del provider.
- La riepilogazione di salvaguardia integrata ridistilla i riepiloghi precedenti con i nuovi messaggi
  invece di preservare alla lettera l'intero riepilogo precedente.
- La modalità di salvaguardia abilita per impostazione predefinita gli audit di qualità dei riepiloghi; imposta
  `qualityGuard.enabled: false` per saltare il comportamento di nuovo tentativo in caso di output malformato.
- Se il provider fallisce o restituisce un risultato vuoto, OpenClaw ripiega automaticamente sulla riepilogazione LLM integrata.
- I segnali di interruzione/timeout vengono rilanciati (non assorbiti) per rispettare l'annullamento del chiamante.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfici visibili all'utente

Puoi osservare la compattazione e lo stato della sessione tramite:

- `/status` (in qualsiasi sessione di chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modalità dettagliata: `🧹 Auto-compaction complete` + conteggio delle compattazioni

---

## Manutenzione silenziosa (`NO_REPLY`)

OpenClaw supporta turni “silenziosi” per attività in background in cui l'utente non dovrebbe vedere output intermedio.

Convenzione:

- L'assistente inizia il proprio output con il token silenzioso esatto `NO_REPLY` /
  `no_reply` per indicare “non consegnare una risposta all'utente”.
- OpenClaw lo rimuove/sopprime nel livello di consegna.
- La soppressione esatta del token silenzioso non distingue tra maiuscole e minuscole, quindi `NO_REPLY` e
  `no_reply` contano entrambi quando l'intero payload è solo il token silenzioso.
- Questo vale solo per veri turni in background/senza consegna; non è una scorciatoia per
  normali richieste utente azionabili.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming di bozza/digitazione** quando un
chunk parziale inizia con `NO_REPLY`, quindi le operazioni silenziose non espongono output parziale
a metà turno.

---

## "Memory flush" pre-compattazione (implementato)

Obiettivo: prima che avvenga la compattazione automatica, eseguire un turno agentico silenzioso che scriva lo stato
duraturo su disco (ad esempio `memory/YYYY-MM-DD.md` nello spazio di lavoro dell'agente) così che la compattazione non possa
cancellare contesto critico.

OpenClaw usa l'approccio di **flush pre-soglia**:

1. Monitora l'uso del contesto della sessione.
2. Quando supera una “soglia morbida” (sotto la soglia di compattazione di Pi), esegue una direttiva silenziosa
   “scrivi la memoria ora” verso l'agente.
3. Usa il token silenzioso esatto `NO_REPLY` / `no_reply` così l'utente non vede
   nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `model` (override opzionale esatto di provider/modello per il turno di flush, ad esempio `ollama/qwen3:8b`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema extra aggiunto per il turno di flush)

Note:

- Il prompt/prompt di sistema predefinito include un suggerimento `NO_REPLY` per sopprimere
  la consegna.
- Quando `model` è impostato, il turno di flush usa quel modello senza ereditare la
  catena di fallback della sessione attiva, così la manutenzione solo locale non ripiega silenziosamente
  su un modello di conversazione a pagamento.
- Il flush viene eseguito una volta per ciclo di compattazione (tracciato in `sessions.json`).
- Il flush viene eseguito solo per le sessioni Pi incorporate (i backend CLI lo saltano).
- Il flush viene saltato quando lo spazio di lavoro della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memoria](/it/concepts/memory) per il layout dei file dello spazio di lavoro e i pattern di scrittura.

Pi espone anche un hook `session_before_compact` nell'API dell'estensione, ma oggi la logica di
flush di OpenClaw vive lato Gateway.

---

## Checklist per la risoluzione dei problemi

- Chiave di sessione errata? Inizia da [/concepts/session](/it/concepts/session) e conferma `sessionKey` in `/status`.
- Mancata corrispondenza tra archivio e trascrizione? Conferma l'host Gateway e il percorso dell'archivio da `openclaw status`.
- Spam di compattazione? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di compattazione (`reserveTokens` troppo alto per la finestra del modello può causare una compattazione anticipata)
  - gonfiamento dei risultati degli strumenti: abilita/regola la potatura della sessione
- Turni silenziosi esposti? Conferma che la risposta inizi con `NO_REPLY` (token esatto senza distinzione tra maiuscole e minuscole) e che tu stia usando una build che include la correzione della soppressione dello streaming.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Motore di contesto](/it/concepts/context-engine)
