---
read_when:
    - È necessario eseguire il debug degli ID di sessione, della trascrizione JSONL o dei campi sessions.json
    - Stai modificando il comportamento di auto-Compaction o aggiungendo attività di housekeeping “pre-Compaction”
    - Vuoi implementare svuotamenti della memoria o turni di sistema silenziosi
summary: 'Approfondimento: store delle sessioni + trascrizioni, ciclo di vita e dettagli interni della Compaction (automatica)'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-05-02T21:00:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8271d7b0786e1c47a8cec6e7bd73c3c86a433d629e17937fdd87fa756ed78d73
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestisce le sessioni end-to-end in queste aree:

- **Instradamento delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Archivio delle sessioni** (`sessions.json`) e cosa traccia
- **Persistenza delle trascrizioni** (`*.jsonl`) e la relativa struttura
- **Igiene delle trascrizioni** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti di contesto** (finestra di contesto rispetto ai token tracciati)
- **Compaction** (Compaction manuale e automatica) e dove agganciare il lavoro pre-Compaction
- **Manutenzione silenziosa** (scritture in memoria che non devono produrre output visibile all’utente)

Se vuoi prima una panoramica di livello più alto, inizia da:

- [Gestione delle sessioni](/it/concepts/session)
- [Compaction](/it/concepts/compaction)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca in memoria](/it/concepts/memory-search)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Igiene delle trascrizioni](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato attorno a un singolo **processo Gateway** che possiede lo stato delle sessioni.

- Le UI (app macOS, Control UI web, TUI) devono interrogare il Gateway per gli elenchi di sessioni e i conteggi dei token.
- In modalità remota, i file di sessione si trovano sull’host remoto; “controllare i file locali del Mac” non rifletterà ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw conserva le sessioni in due livelli:

1. **Archivio delle sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccolo, mutabile, sicuro da modificare (o da cui eliminare voci)
   - Traccia i metadati della sessione (ID sessione corrente, ultima attività, toggle, contatori di token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Archivia la conversazione effettiva + le chiamate agli strumenti + i riepiloghi di Compaction
   - Usata per ricostruire il contesto del modello per i turni futuri
   - I checkpoint di debug pre-Compaction di grandi dimensioni vengono saltati quando la trascrizione
     attiva supera il limite di dimensione dei checkpoint, evitando una seconda enorme
     copia `.checkpoint.*.jsonl`.

I lettori della cronologia del Gateway dovrebbero evitare di materializzare l’intera trascrizione a meno che
la superficie non richieda esplicitamente accesso arbitrario alla cronologia. La cronologia della prima pagina,
la cronologia chat incorporata, il recupero dopo riavvio e i controlli su token/uso usano letture della coda
limitate. Le scansioni complete della trascrizione passano attraverso l’indice asincrono delle trascrizioni, che viene
memorizzato in cache per percorso file più `mtimeMs`/`size` e condiviso tra lettori concorrenti.

---

## Posizioni su disco

Per agente, sull’host Gateway:

- Archivio: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni di topic Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw le risolve tramite `src/config/sessions.ts`.

---

## Manutenzione dell’archivio e controlli del disco

La persistenza delle sessioni ha controlli di manutenzione automatici (`session.maintenance`) per `sessions.json`, artefatti di trascrizione e sidecar di traiettoria:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: soglia di età per le voci obsolete (predefinito `30d`)
- `maxEntries`: limite di voci in `sessions.json` (predefinito `500`)
- `resetArchiveRetention`: conservazione per gli archivi di trascrizione `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget opzionale per la directory delle sessioni
- `highWaterBytes`: target opzionale dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Le normali scritture del Gateway passano attraverso uno writer di sessione per archivio che serializza le mutazioni in-process senza acquisire un lock di file a runtime. Gli helper di patch del percorso caldo prendono in prestito la cache mutabile validata mentre mantengono quello slot di writer, quindi i file `sessions.json` di grandi dimensioni non vengono clonati o riletti per ogni aggiornamento dei metadati. Il codice runtime dovrebbe preferire `updateSessionStore(...)` o `updateSessionStoreEntry(...)`; i salvataggi diretti dell’intero archivio sono strumenti di compatibilità e manutenzione offline. Quando un Gateway è raggiungibile, `openclaw sessions cleanup` e `openclaw agents delete` senza dry run delegano le mutazioni dell’archivio al Gateway, così la pulizia entra nella stessa coda di scrittura; `--store <path>` è il percorso esplicito di riparazione offline per la manutenzione diretta dei file. La pulizia `maxEntries` è ancora raggruppata per limiti di dimensioni di produzione, quindi un archivio può superare brevemente il limite configurato prima che la successiva pulizia high-water lo riscriva riducendolo. Le letture dell’archivio sessioni non potano né limitano le voci durante l’avvio del Gateway; usa le scritture o `openclaw sessions cleanup --enforce` per la pulizia. `openclaw sessions cleanup --enforce` applica comunque immediatamente il limite configurato.

La manutenzione conserva i puntatori durevoli a conversazioni esterne, come sessioni di gruppo
e sessioni chat con ambito thread, ma le voci runtime sintetiche per Cron, hook,
Heartbeat, ACP e sub-agenti possono comunque essere rimosse quando superano il
budget configurato per età, conteggio o disco.

OpenClaw non crea più backup automatici con rotazione `sessions.json.bak.*` durante le scritture del Gateway. La chiave legacy `session.maintenance.rotateBytes` viene ignorata e `openclaw doctor --fix` la rimuove dalle configurazioni più vecchie.

Le mutazioni delle trascrizioni usano un lock di scrittura di sessione sul file di trascrizione. L’acquisizione del lock attende fino a
`session.writeLock.acquireTimeoutMs` prima di esporre un errore di sessione occupata; il valore predefinito è `60000`
ms. Aumentalo solo quando lavoro legittimo di preparazione, pulizia, Compaction o mirror della trascrizione contende
più a lungo su macchine lente. Il rilevamento dei lock obsoleti e gli avvisi di durata massima restano criteri separati.

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuovi prima gli artefatti archiviati più vecchi, le trascrizioni orfane o gli artefatti di traiettoria orfani.
2. Se ancora sopra il target, elimina le voci di sessione più vecchie e i relativi file di trascrizione/traiettoria.
3. Continua finché l’uso è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala le potenziali espulsioni ma non modifica l’archivio/i file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log di esecuzione

Anche le esecuzioni Cron isolate creano voci di sessione/trascrizioni, e hanno controlli di conservazione dedicati:

- `cron.sessionRetention` (predefinito `24h`) pota le vecchie sessioni di esecuzione Cron isolate dall’archivio delle sessioni (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` potano i file `~/.openclaw/cron/runs/<jobId>.jsonl` (valori predefiniti: `2_000_000` byte e `2000` righe).

Quando Cron forza la creazione di una nuova sessione di esecuzione isolata, sanifica la voce di sessione
`cron:<jobId>` precedente prima di scrivere la nuova riga. Trasporta preferenze sicure
come impostazioni di pensiero/veloce/verboso, etichette e override espliciti
di modello/auth selezionati dall’utente. Elimina il contesto conversazionale ambientale come
instradamento di canale/gruppo, criterio di invio o coda, elevazione, origine e binding runtime
ACP, così una nuova esecuzione isolata non può ereditare consegna obsoleta o
autorità runtime da un’esecuzione più vecchia.

---

## Chiavi di sessione (`sessionKey`)

Una `sessionKey` identifica _in quale contenitore di conversazione_ ti trovi (instradamento + isolamento).

Pattern comuni:

- Chat principale/diretta (per agente): `agent:<agentId>:<mainKey>` (predefinito `main`)
- Gruppo: `agent:<agentId>:<channel>:group:<id>`
- Stanza/canale (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (salvo override)

Le regole canoniche sono documentate in [/concepts/session](/it/concepts/session).

---

## ID di sessione (`sessionId`)

Ogni `sessionKey` punta a una `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea un nuovo `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito 4:00 AM ora locale sull’host gateway) crea un nuovo `sessionId` al messaggio successivo dopo il confine di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando sono configurati sia giornaliero sia inattività, vince quello che scade per primo.
- **Eventi di sistema** (Heartbeat, risvegli Cron, notifiche exec, bookkeeping del Gateway) possono mutare la riga della sessione ma non estendono la freschezza del reset giornaliero/per inattività. Il rollover del reset scarta gli avvisi di eventi di sistema in coda per la sessione precedente prima che venga costruito il prompt fresco.
- **Criterio di fork del genitore** usa il ramo attivo di PI quando crea un thread o un fork di subagente. Se quel ramo è troppo grande, OpenClaw avvia il figlio con contesto isolato invece di fallire o ereditare cronologia inutilizzabile. La policy di dimensionamento è automatica; la configurazione legacy `session.parentForkMaxTokens` viene rimossa da `openclaw doctor --fix`.

Dettaglio implementativo: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dell’archivio sessioni (`sessions.json`)

Il tipo valore dell’archivio è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: ID della trascrizione corrente (il nome file deriva da questo a meno che `sessionFile` non sia impostato)
- `sessionStartedAt`: timestamp di inizio per il `sessionId` corrente; la freschezza del reset giornaliero
  usa questo. Le righe legacy possono derivarlo dall’intestazione di sessione JSONL.
- `lastInteractionAt`: timestamp dell’ultima interazione reale utente/canale; la freschezza del reset per inattività
  usa questo, quindi Heartbeat, Cron ed eventi exec non mantengono vive le sessioni. Le righe legacy senza questo campo ripiegano sull’ora di inizio sessione recuperata
  per la freschezza per inattività.
- `updatedAt`: timestamp dell’ultima mutazione della riga dell’archivio, usato per elenchi, potatura e
  bookkeeping. Non è l’autorità per la freschezza del reset giornaliero/per inattività.
- `sessionFile`: override opzionale esplicito del percorso della trascrizione
- `chatType`: `direct | group | room` (aiuta le UI e il criterio di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per l’etichettatura di gruppo/canale
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori di token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte la Compaction automatica è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell’ultimo flush di memoria pre-Compaction
- `memoryFlushCompactionCount`: conteggio di Compaction quando l’ultimo flush è stato eseguito

L’archivio è sicuro da modificare, ma il Gateway è l’autorità: può riscrivere o reidratare le voci mentre le sessioni sono in esecuzione.

---

## Struttura della trascrizione (`*.jsonl`)

Le trascrizioni sono gestite dal `SessionManager` di `@mariozechner/pi-coding-agent`.

Il file è JSONL:

- Prima riga: intestazione della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` opzionale)
- Poi: voci di sessione con `id` + `parentId` (albero)

Tipi di voce rilevanti:

- `message`: messaggi utente/assistant/toolResult
- `custom_message`: messaggi iniettati dal plugin che _entrano_ nel contesto del modello (possono essere nascosti dalla UI)
- `custom`: stato del plugin che _non_ entra nel contesto del modello
- `compaction`: riepilogo di Compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito quando si naviga un ramo dell’albero

OpenClaw intenzionalmente **non** “corregge” le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto rispetto ai token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dell’archivio sessioni**: statistiche mobili scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto proviene dal catalogo dei modelli (e può essere sovrascritta tramite configurazione).
- `contextTokens` nell’archivio è un valore runtime di stima/reportistica; non trattarlo come una garanzia rigida.

Per maggiori informazioni, consulta [/token-use](/it/reference/token-use).

---

## Compaction: che cos’è

La Compaction riassume la conversazione più vecchia in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo la Compaction, i turni futuri vedono:

- Il riepilogo della Compaction
- I messaggi dopo `firstKeptEntryId`

La Compaction è **persistente** (a differenza della potatura delle sessioni). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Confini dei chunk di Compaction e abbinamento degli strumenti

Quando OpenClaw divide una trascrizione lunga in chunk di Compaction, mantiene
le chiamate agli strumenti dell'assistente abbinate alle rispettive voci `toolResult`.

- Se la divisione per quota di token cade tra una chiamata a uno strumento e il suo risultato, OpenClaw
  sposta il confine al messaggio di chiamata allo strumento dell'assistente invece di separare
  la coppia.
- Se un blocco finale di risultato dello strumento farebbe altrimenti superare al chunk il target,
  OpenClaw conserva quel blocco di strumento in sospeso e mantiene intatta la coda
  non riassunta.
- I blocchi di chiamata allo strumento interrotti o con errore non mantengono aperta una divisione in sospeso.

---

## Quando avviene l'auto-Compaction (runtime Pi)

Nell'agente Pi incorporato, l'auto-Compaction si attiva in due casi:

1. **Recupero da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili con forma specifica del provider) → compatta → riprova.
2. **Manutenzione della soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è il margine riservato per prompt + il prossimo output del modello

Queste sono semantiche del runtime Pi (OpenClaw consuma gli eventi, ma Pi decide quando compattare).

OpenClaw può anche attivare una Compaction locale di preflight prima di aprire la prossima
esecuzione quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato e il
file della trascrizione attiva raggiunge quella dimensione. Questa è una protezione basata sulla dimensione del file per il costo di
riapertura locale, non archiviazione grezza: OpenClaw esegue comunque la normale Compaction semantica,
e richiede `truncateAfterCompaction` affinché il riepilogo compattato possa diventare una
nuova trascrizione successiva.

Per le esecuzioni Pi incorporate, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
aggiunge una protezione opzionale del ciclo degli strumenti. Dopo che un risultato dello strumento viene aggiunto e prima della
successiva chiamata al modello, OpenClaw stima la pressione sul prompt usando la stessa logica di budget
di preflight usata all'inizio del turno. Se il contesto non entra più, la protezione
non compatta dentro l'hook `transformContext` di Pi. Genera un segnale strutturato
di precheck a metà turno, interrompe l'invio del prompt corrente e lascia che il
ciclo di esecuzione esterno usi il percorso di recupero esistente: troncare i risultati degli strumenti sovradimensionati
quando basta, oppure attivare la modalità di Compaction configurata e riprovare. L'opzione
è disabilitata per impostazione predefinita e funziona con entrambe le modalità di Compaction `default` e `safeguard`,
inclusa la Compaction safeguard supportata da provider.
Questo è indipendente da `maxActiveTranscriptBytes`: la protezione basata sulla dimensione in byte viene eseguita
prima che un turno si apra, mentre il precheck a metà turno viene eseguito più tardi nel ciclo degli strumenti Pi incorporato
dopo che nuovi risultati degli strumenti sono stati aggiunti.

---

## Impostazioni di Compaction (`reserveTokens`, `keepRecentTokens`)

Le impostazioni di Compaction di Pi si trovano nelle impostazioni Pi:

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
- Il comando manuale `/compact` rispetta un `agents.defaults.compaction.keepRecentTokens`
  esplicito e mantiene il punto di taglio della coda recente di Pi. Senza un budget di conservazione esplicito,
  la Compaction manuale resta un checkpoint rigido e il contesto ricostruito parte dal
  nuovo riepilogo.
- Imposta `agents.defaults.compaction.midTurnPrecheck.enabled: true` per eseguire il
  precheck opzionale del ciclo degli strumenti dopo i nuovi risultati degli strumenti e prima della successiva chiamata al modello.
  Questo è solo un trigger; la generazione del riepilogo usa comunque il percorso di
  Compaction configurato. È indipendente da `maxActiveTranscriptBytes`, che è una
  protezione basata sulla dimensione in byte della trascrizione attiva all'inizio del turno.
- Imposta `agents.defaults.compaction.maxActiveTranscriptBytes` su un valore in byte o
  una stringa come `"20mb"` per eseguire la Compaction locale prima di un turno quando la trascrizione
  attiva diventa grande. Questa protezione è attiva solo quando anche
  `truncateAfterCompaction` è abilitato. Lascialo non impostato o impostalo a `0` per
  disabilitarla.
- Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato,
  OpenClaw ruota la trascrizione attiva in un successore JSONL compattato dopo la
  Compaction. La vecchia trascrizione completa resta archiviata e collegata dal
  checkpoint di Compaction invece di essere riscritta sul posto.

Motivo: lasciare abbastanza margine per la “manutenzione” multi-turno (come le scritture in memoria) prima che la Compaction diventi inevitabile.

Implementazione: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(chiamata da `src/agents/pi-embedded-runner.ts`).

---

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction tramite `registerCompactionProvider()` nell'API del Plugin. Quando `agents.defaults.compaction.provider` è impostato sull'id di un provider registrato, il Plugin safeguard delega la sintesi a quel provider invece della pipeline integrata `summarizeInStages`.

- `provider`: id di un Plugin provider di Compaction registrato. Lascialo non impostato per la sintesi LLM predefinita.
- Impostare un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di Compaction e la stessa policy di conservazione degli identificatori del percorso integrato.
- Il safeguard conserva comunque il contesto del suffisso dei turni recenti e dei turni divisi dopo l'output del provider.
- La sintesi safeguard integrata ridistilla i riepiloghi precedenti con i nuovi messaggi
  invece di preservare letteralmente l'intero riepilogo precedente.
- La modalità safeguard abilita per impostazione predefinita gli audit di qualità del riepilogo; imposta
  `qualityGuard.enabled: false` per saltare il comportamento di nuovo tentativo in caso di output malformato.
- Se il provider fallisce o restituisce un risultato vuoto, OpenClaw ripiega automaticamente sulla sintesi LLM integrata.
- I segnali di interruzione/timeout vengono rilanciati (non inghiottiti) per rispettare l'annullamento del chiamante.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfici visibili all'utente

Puoi osservare la Compaction e lo stato della sessione tramite:

- `/status` (in qualsiasi sessione di chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modalità dettagliata: `🧹 Auto-compaction complete` + conteggio delle Compaction

---

## Manutenzione silenziosa (`NO_REPLY`)

OpenClaw supporta turni “silenziosi” per attività in background in cui l'utente non dovrebbe vedere output intermedio.

Convenzione:

- L'assistente inizia il proprio output con il token silenzioso esatto `NO_REPLY` /
  `no_reply` per indicare “non consegnare una risposta all'utente”.
- OpenClaw lo rimuove/sopprime nel livello di consegna.
- La soppressione del token silenzioso esatto non distingue tra maiuscole e minuscole, quindi `NO_REPLY` e
  `no_reply` contano entrambi quando l'intero payload è solo il token silenzioso.
- Questo serve solo per veri turni in background/senza consegna; non è una scorciatoia per
  normali richieste utente operative.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming di bozza/digitazione** quando un
chunk parziale inizia con `NO_REPLY`, quindi le operazioni silenziose non espongono output parziale
a metà turno.

---

## "Flush della memoria" pre-Compaction (implementato)

Obiettivo: prima che avvenga l'auto-Compaction, eseguire un turno agentico silenzioso che scriva lo stato durevole
su disco (ad es. `memory/YYYY-MM-DD.md` nello spazio di lavoro dell'agente) in modo che la Compaction non possa
cancellare contesto critico.

OpenClaw usa l'approccio **flush pre-soglia**:

1. Monitora l'utilizzo del contesto della sessione.
2. Quando supera una “soglia morbida” (sotto la soglia di Compaction di Pi), esegui una direttiva silenziosa
   “scrivi la memoria ora” per l'agente.
3. Usa il token silenzioso esatto `NO_REPLY` / `no_reply` così l'utente non vede
   nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `model` (override opzionale esatto provider/modello per il turno di flush, ad esempio `ollama/qwen3:8b`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema extra aggiunto per il turno di flush)

Note:

- Il prompt/prompt di sistema predefinito include un suggerimento `NO_REPLY` per sopprimere
  la consegna.
- Quando `model` è impostato, il turno di flush usa quel modello senza ereditare la
  catena di fallback della sessione attiva, così la manutenzione solo locale non ripiega silenziosamente
  su un modello di conversazione a pagamento.
- Il flush viene eseguito una volta per ciclo di Compaction (tracciato in `sessions.json`).
- Il flush viene eseguito solo per sessioni Pi incorporate (i backend CLI lo saltano).
- Il flush viene saltato quando lo spazio di lavoro della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memoria](/it/concepts/memory) per il layout dei file dello spazio di lavoro e i pattern di scrittura.

Pi espone anche un hook `session_before_compact` nell'API del Plugin, ma la logica di
flush di OpenClaw oggi vive sul lato Gateway.

---

## Checklist per la risoluzione dei problemi

- Chiave di sessione errata? Inizia da [/concepts/session](/it/concepts/session) e conferma il `sessionKey` in `/status`.
- Incompatibilità tra archivio e trascrizione? Conferma l'host Gateway e il percorso dell'archivio da `openclaw status`.
- Troppa Compaction? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di Compaction (`reserveTokens` troppo alto per la finestra del modello può causare Compaction anticipata)
  - eccesso nei risultati degli strumenti: abilita/regola la potatura della sessione
- I turni silenziosi perdono output? Conferma che la risposta inizi con `NO_REPLY` (token esatto senza distinzione tra maiuscole e minuscole) e di usare una build che include la correzione della soppressione dello streaming.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Motore di contesto](/it/concepts/context-engine)
