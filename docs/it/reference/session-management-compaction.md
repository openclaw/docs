---
read_when:
    - È necessario eseguire il debug degli ID di sessione, del JSONL della trascrizione o dei campi di sessions.json
    - Stai modificando il comportamento di Compaction automatica o aggiungendo operazioni di manutenzione “pre-Compaction”
    - Vuoi implementare svuotamenti della memoria o turni di sistema silenziosi
summary: 'Approfondimento: archivio delle sessioni + trascrizioni, ciclo di vita e dettagli interni della (auto)Compaction'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-05-05T08:26:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3161dd9c98bff7ea24266f44a9261693d8a9ee2b47d9af2d152de7057016748b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestisce le sessioni end-to-end in queste aree:

- **Routing delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Store delle sessioni** (`sessions.json`) e cosa traccia
- **Persistenza della trascrizione** (`*.jsonl`) e la sua struttura
- **Igiene della trascrizione** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti del contesto** (finestra di contesto rispetto ai token tracciati)
- **Compaction** (manuale e automatica) e dove collegare il lavoro pre-Compaction
- **Housekeeping silenzioso** (scritture in memoria che non devono produrre output visibile all'utente)

Se vuoi prima una panoramica di livello superiore, inizia da:

- [Gestione delle sessioni](/it/concepts/session)
- [Compaction](/it/concepts/compaction)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Igiene della trascrizione](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato intorno a un singolo **processo Gateway** che possiede lo stato delle sessioni.

- Le UI (app macOS, Control UI web, TUI) devono interrogare il Gateway per gli elenchi delle sessioni e i conteggi dei token.
- In modalità remota, i file delle sessioni sono sull'host remoto; “controllare i file locali del Mac” non riflette ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw persiste le sessioni in due livelli:

1. **Store delle sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccolo, mutabile, sicuro da modificare (o da cui eliminare voci)
   - Traccia i metadati della sessione (id della sessione corrente, ultima attività, toggle, contatori dei token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Memorizza la conversazione effettiva + chiamate agli strumenti + riepiloghi di Compaction
   - Usata per ricostruire il contesto del modello per i turni futuri
   - I checkpoint di debug grandi pre-Compaction vengono saltati quando la
     trascrizione attiva supera il limite di dimensione dei checkpoint, evitando una seconda copia
     enorme `.checkpoint.*.jsonl`.

I lettori della cronologia del Gateway devono evitare di materializzare l'intera trascrizione a meno che
la superficie non richieda esplicitamente accesso storico arbitrario. La cronologia della prima pagina,
la cronologia chat incorporata, il recupero dopo riavvio e i controlli su token/utilizzo usano letture
limitate dalla coda. Le scansioni complete della trascrizione passano dall'indice asincrono delle trascrizioni, che è
memorizzato in cache per percorso file più `mtimeMs`/`size` e condiviso tra lettori concorrenti.

---

## Posizioni su disco

Per agente, sull'host Gateway:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni argomento Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw le risolve tramite `src/config/sessions.ts`.

---

## Manutenzione dello store e controlli del disco

La persistenza delle sessioni dispone di controlli automatici di manutenzione (`session.maintenance`) per `sessions.json`, artefatti di trascrizione e sidecar delle traiettorie:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: soglia di età delle voci obsolete (predefinito `30d`)
- `maxEntries`: limite delle voci in `sessions.json` (predefinito `500`)
- `resetArchiveRetention`: conservazione per gli archivi di trascrizione `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget opzionale per la directory delle sessioni
- `highWaterBytes`: target opzionale dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Le scritture normali del Gateway passano attraverso un writer delle sessioni per store che serializza le mutazioni in-process senza acquisire un lock runtime sul file. Gli helper di patch sul percorso caldo prendono in prestito la cache mutabile validata mentre mantengono quello slot del writer, quindi i file `sessions.json` grandi non vengono clonati o riletti per ogni aggiornamento dei metadati. Il codice runtime deve preferire `updateSessionStore(...)` o `updateSessionStoreEntry(...)`; i salvataggi diretti dell'intero store sono strumenti di compatibilità e manutenzione offline. Quando un Gateway è raggiungibile, `openclaw sessions cleanup` e `openclaw agents delete` non dry-run delegano le mutazioni dello store al Gateway, così la pulizia entra nella stessa coda del writer; `--store <path>` è il percorso esplicito di riparazione offline per la manutenzione diretta dei file. La pulizia `maxEntries` è ancora eseguita in batch per limiti di dimensioni di produzione, quindi uno store può superare brevemente il limite configurato prima che la successiva pulizia high-water lo riscriva riportandolo sotto soglia. Le letture dello store delle sessioni non potano né limitano le voci durante l'avvio del Gateway; usa le scritture o `openclaw sessions cleanup --enforce` per la pulizia. `openclaw sessions cleanup --enforce` applica comunque immediatamente il limite configurato e pota vecchi artefatti di trascrizione, checkpoint e traiettorie non referenziati anche quando non è configurato alcun budget disco.

La manutenzione conserva puntatori durevoli a conversazioni esterne come sessioni di gruppo
e sessioni chat con scope di thread, ma le voci runtime sintetiche per Cron, hook,
Heartbeat, ACP e sub-agenti possono comunque essere rimosse quando superano
l'età, il conteggio o il budget disco configurati.

OpenClaw non crea più backup automatici a rotazione `sessions.json.bak.*` durante le scritture del Gateway. La chiave legacy `session.maintenance.rotateBytes` viene ignorata e `openclaw doctor --fix` la rimuove dalle configurazioni più vecchie.

Le mutazioni della trascrizione usano un lock di scrittura della sessione sul file di trascrizione. L'acquisizione del lock attende fino a
`session.writeLock.acquireTimeoutMs` prima di esporre un errore di sessione occupata; il valore predefinito è `60000`
ms. Aumentalo solo quando attività legittime di preparazione, pulizia, Compaction o mirror della trascrizione contendono
più a lungo su macchine lente. Il rilevamento dei lock obsoleti e gli avvisi di durata massima restano criteri separati.

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuovi prima gli artefatti più vecchi archiviati, di trascrizioni orfane o di traiettorie orfane.
2. Se ancora sopra il target, elimina le voci di sessione più vecchie e i relativi file di trascrizione/traiettoria.
3. Continua finché l'utilizzo è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala possibili espulsioni ma non modifica lo store/i file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log delle esecuzioni

Anche le esecuzioni Cron isolate creano voci/trascrizioni di sessione e hanno controlli di conservazione dedicati:

- `cron.sessionRetention` (predefinito `24h`) pota le vecchie sessioni di esecuzione Cron isolate dallo store delle sessioni (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` potano i file `~/.openclaw/cron/runs/<jobId>.jsonl` (predefiniti: `2_000_000` byte e `2000` righe).

Quando Cron forza la creazione di una nuova sessione di esecuzione isolata, sanifica la voce di sessione precedente
`cron:<jobId>` prima di scrivere la nuova riga. Trasporta preferenze sicure
come impostazioni thinking/fast/verbose, etichette e override espliciti
di modello/auth selezionati dall'utente. Scarta il contesto conversazionale ambientale come
routing di canale/gruppo, criteri di invio o coda, elevazione, origine e binding runtime ACP,
così una nuova esecuzione isolata non può ereditare consegna o autorità runtime
obsolete da un'esecuzione precedente.

---

## Chiavi di sessione (`sessionKey`)

Una `sessionKey` identifica _in quale contenitore di conversazione_ ti trovi (routing + isolamento).

Pattern comuni:

- Chat principale/diretta (per agente): `agent:<agentId>:<mainKey>` (predefinito `main`)
- Gruppo: `agent:<agentId>:<channel>:group:<id>`
- Stanza/canale (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (se non sovrascritto)

Le regole canoniche sono documentate in [/concepts/session](/it/concepts/session).

---

## ID di sessione (`sessionId`)

Ogni `sessionKey` punta a un `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea un nuovo `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito 4:00 AM ora locale sull'host gateway) crea un nuovo `sessionId` al messaggio successivo dopo il limite di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando giornaliero + inattività sono entrambi configurati, vince quello che scade per primo.
- **Eventi di sistema** (Heartbeat, risvegli Cron, notifiche exec, bookkeeping del gateway) possono mutare la riga della sessione ma non estendono la freschezza del reset giornaliero/per inattività. Il rollover del reset scarta gli avvisi di eventi di sistema in coda per la sessione precedente prima che venga costruito il prompt fresco.
- **Criterio di fork del genitore** usa il branch attivo di PI quando crea un thread o un fork subagente. Se quel branch è troppo grande, OpenClaw avvia il figlio con contesto isolato invece di fallire o ereditare cronologia inutilizzabile. Il criterio di dimensionamento è automatico; la configurazione legacy `session.parentForkMaxTokens` viene rimossa da `openclaw doctor --fix`.

Dettaglio implementativo: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dello store delle sessioni (`sessions.json`)

Il tipo valore dello store è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: id della trascrizione corrente (il nome file deriva da questo salvo che `sessionFile` sia impostato)
- `sessionStartedAt`: timestamp di inizio per il `sessionId` corrente; la freschezza del reset giornaliero
  usa questo. Le righe legacy possono derivarlo dall'header della sessione JSONL.
- `lastInteractionAt`: timestamp dell'ultima interazione reale utente/canale; la freschezza del reset per inattività
  usa questo, così Heartbeat, Cron ed eventi exec non mantengono vive le sessioni.
  Le righe legacy senza questo campo ricadono sull'ora di inizio sessione recuperata
  per la freschezza dell'inattività.
- `updatedAt`: timestamp dell'ultima mutazione della riga dello store, usato per elenchi, potatura e
  bookkeeping. Non è l'autorità per la freschezza del reset giornaliero/per inattività.
- `sessionFile`: override opzionale esplicito del percorso della trascrizione
- `chatType`: `direct | group | room` (aiuta le UI e i criteri di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per l'etichettatura di gruppi/canali
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori dei token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte la Compaction automatica è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush della memoria pre-Compaction
- `memoryFlushCompactionCount`: conteggio Compaction quando è stato eseguito l'ultimo flush

Lo store è sicuro da modificare, ma il Gateway è l'autorità: può riscrivere o reidratare le voci mentre le sessioni vengono eseguite.

---

## Struttura della trascrizione (`*.jsonl`)

Le trascrizioni sono gestite da `SessionManager` di `@mariozechner/pi-coding-agent`.

Il file è JSONL:

- Prima riga: header della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` opzionale)
- Poi: voci di sessione con `id` + `parentId` (albero)

Tipi di voce notevoli:

- `message`: messaggi utente/assistant/toolResult
- `custom_message`: messaggi iniettati dall'estensione che _entrano_ nel contesto del modello (possono essere nascosti dalla UI)
- `custom`: stato dell'estensione che _non_ entra nel contesto del modello
- `compaction`: riepilogo di Compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito quando si naviga un branch dell'albero

OpenClaw intenzionalmente **non** “corregge” le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto rispetto ai token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dello store delle sessioni**: statistiche mobili scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto viene dal catalogo dei modelli (e può essere sovrascritta tramite configurazione).
- `contextTokens` nello store è un valore di stima/reporting runtime; non trattarlo come una garanzia rigorosa.

Per saperne di più, vedi [/token-use](/it/reference/token-use).

---

## Compaction: cos'è

Compaction riepiloga la conversazione più vecchia in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo la Compaction, i turni futuri vedono:

- Il riepilogo di Compaction
- I messaggi dopo `firstKeptEntryId`

Compaction è **persistente** (a differenza della potatura delle sessioni). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Limiti dei blocchi di Compaction e abbinamento degli strumenti

Quando OpenClaw divide una trascrizione lunga in blocchi di Compaction, mantiene
le chiamate agli strumenti dell'assistente abbinate alle voci `toolResult` corrispondenti.

- Se la divisione basata sulla quota di token cade tra una chiamata a uno strumento e il suo risultato, OpenClaw
  sposta il limite al messaggio di chiamata allo strumento dell'assistente invece di separare
  la coppia.
- Se un blocco finale di risultati degli strumenti altrimenti porterebbe il blocco oltre l'obiettivo,
  OpenClaw conserva quel blocco di strumenti in sospeso e mantiene intatta la coda
  non riassunta.
- I blocchi di chiamate agli strumenti interrotti o con errore non mantengono aperta una divisione in sospeso.

---

## Quando avviene l'auto-Compaction (runtime Pi)

Nell'agente Pi incorporato, l'auto-Compaction si attiva in due casi:

1. **Ripristino da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili nella forma del provider) → compatta → riprova.
2. **Manutenzione della soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è il margine riservato per i prompt + il prossimo output del modello

Queste sono semantiche del runtime Pi (OpenClaw consuma gli eventi, ma Pi decide quando compattare).

OpenClaw può anche attivare una Compaction locale preliminare prima di aprire la
prossima esecuzione quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato e il
file della trascrizione attiva raggiunge quella dimensione. Questa è una protezione sulla dimensione del file per il costo
di riapertura locale, non archiviazione grezza: OpenClaw esegue comunque la normale Compaction semantica,
e richiede `truncateAfterCompaction` affinché il riepilogo compattato possa diventare una
nuova trascrizione successore.

Per le esecuzioni Pi incorporate, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
aggiunge una protezione opzionale del ciclo degli strumenti. Dopo che un risultato di strumento viene aggiunto e prima della
prossima chiamata al modello, OpenClaw stima la pressione sul prompt usando la stessa logica di budget preliminare
usata all'inizio del turno. Se il contesto non rientra più, la protezione non
compatta dentro l'hook `transformContext` di Pi. Genera un segnale strutturato
di pre-controllo a metà turno, interrompe l'invio del prompt corrente e lascia che il
ciclo di esecuzione esterno usi il percorso di ripristino esistente: troncare risultati di strumenti sovradimensionati
quando basta, oppure attivare la modalità di Compaction configurata e riprovare. L'opzione
è disabilitata per impostazione predefinita e funziona con entrambe le modalità di Compaction `default` e `safeguard`,
inclusa la Compaction `safeguard` supportata da provider.
Questo è indipendente da `maxActiveTranscriptBytes`: la protezione sulla dimensione in byte viene eseguita
prima dell'apertura di un turno, mentre il pre-controllo a metà turno viene eseguito più tardi nel ciclo degli strumenti Pi incorporato
dopo che sono stati aggiunti nuovi risultati degli strumenti.

---

## Impostazioni di Compaction (`reserveTokens`, `keepRecentTokens`)

Le impostazioni di Compaction di Pi risiedono nelle impostazioni di Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw impone anche una soglia minima di sicurezza per le esecuzioni incorporate:

- Se `compaction.reserveTokens < reserveTokensFloor`, OpenClaw la aumenta.
- La soglia minima predefinita è `20000` token.
- Imposta `agents.defaults.compaction.reserveTokensFloor: 0` per disabilitare la soglia minima.
- Se è già più alta, OpenClaw la lascia invariata.
- `/compact` manuale rispetta un valore esplicito di `agents.defaults.compaction.keepRecentTokens`
  e mantiene il punto di taglio della coda recente di Pi. Senza un budget di conservazione esplicito,
  la Compaction manuale rimane un checkpoint rigido e il contesto ricostruito parte dal
  nuovo riepilogo.
- Imposta `agents.defaults.compaction.midTurnPrecheck.enabled: true` per eseguire il
  pre-controllo opzionale del ciclo degli strumenti dopo i nuovi risultati degli strumenti e prima della prossima chiamata al modello.
  È solo un trigger; la generazione del riepilogo usa comunque il percorso di
  Compaction configurato. È indipendente da `maxActiveTranscriptBytes`, che è una
  protezione sulla dimensione in byte della trascrizione attiva all'inizio del turno.
- Imposta `agents.defaults.compaction.maxActiveTranscriptBytes` su un valore in byte o
  una stringa come `"20mb"` per eseguire una Compaction locale prima di un turno quando la trascrizione attiva
  diventa grande. Questa protezione è attiva solo quando
  anche `truncateAfterCompaction` è abilitato. Lasciala non impostata o impostala a `0` per
  disabilitarla.
- Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato,
  OpenClaw ruota la trascrizione attiva in un successore JSONL compattato dopo la
  Compaction. La vecchia trascrizione completa resta archiviata e collegata dal
  checkpoint di Compaction invece di essere riscritta sul posto.

Perché: lasciare abbastanza margine per la “manutenzione” multi-turno (come le scritture in memoria) prima che la Compaction diventi inevitabile.

Implementazione: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(chiamata da `src/agents/pi-embedded-runner.ts`).

---

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction tramite `registerCompactionProvider()` sull'API del Plugin. Quando `agents.defaults.compaction.provider` è impostato su un ID di provider registrato, l'estensione `safeguard` delega la sintesi a quel provider invece che alla pipeline integrata `summarizeInStages`.

- `provider`: ID di un Plugin provider di Compaction registrato. Lascialo non impostato per la sintesi LLM predefinita.
- Impostare un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di Compaction e la stessa policy di conservazione degli identificatori del percorso integrato.
- Il `safeguard` conserva comunque il contesto dei turni recenti e del suffisso del turno diviso dopo l'output del provider.
- La sintesi `safeguard` integrata ridistilla i riepiloghi precedenti con i nuovi messaggi
  invece di conservare testualmente l'intero riepilogo precedente.
- La modalità `safeguard` abilita per impostazione predefinita gli audit della qualità dei riepiloghi; imposta
  `qualityGuard.enabled: false` per saltare il comportamento di ripetizione in caso di output malformato.
- Se il provider fallisce o restituisce un risultato vuoto, OpenClaw ripiega automaticamente sulla sintesi LLM integrata.
- I segnali di interruzione/timeout vengono rilanciati (non assorbiti) per rispettare l'annullamento del chiamante.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfici visibili all'utente

Puoi osservare Compaction e stato della sessione tramite:

- `/status` (in qualsiasi sessione di chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modalità verbosa: `🧹 Auto-compaction complete` + conteggio delle Compaction

---

## Manutenzione silenziosa (`NO_REPLY`)

OpenClaw supporta turni “silenziosi” per attività in background in cui l'utente non dovrebbe vedere output intermedi.

Convenzione:

- L'assistente inizia il proprio output con il token silenzioso esatto `NO_REPLY` /
  `no_reply` per indicare “non consegnare una risposta all'utente”.
- OpenClaw lo rimuove/sopprime nel livello di consegna.
- La soppressione del token silenzioso esatto non distingue tra maiuscole e minuscole, quindi `NO_REPLY` e
  `no_reply` contano entrambi quando l'intero payload è solo il token silenzioso.
- Questo è solo per veri turni in background/senza consegna; non è una scorciatoia per
  normali richieste utente azionabili.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming di bozze/digitazione** quando un
blocco parziale inizia con `NO_REPLY`, così le operazioni silenziose non perdono output
parziale a metà turno.

---

## "Flush della memoria" pre-Compaction (implementato)

Obiettivo: prima che avvenga l'auto-Compaction, eseguire un turno agentico silenzioso che scrive lo stato durevole
su disco (ad esempio `memory/YYYY-MM-DD.md` nello spazio di lavoro dell'agente) così che la Compaction non possa
cancellare contesto critico.

OpenClaw usa l'approccio **flush pre-soglia**:

1. Monitora l'uso del contesto della sessione.
2. Quando supera una “soglia morbida” (sotto la soglia di Compaction di Pi), esegui una direttiva silenziosa
   “scrivi la memoria ora” per l'agente.
3. Usa il token silenzioso esatto `NO_REPLY` / `no_reply` così l'utente non vede
   nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `model` (override opzionale esatto provider/modello per il turno di flush, ad esempio `ollama/qwen3:8b`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema aggiuntivo aggiunto per il turno di flush)

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

Pi espone anche un hook `session_before_compact` nell'API dell'estensione, ma oggi la logica di
flush di OpenClaw vive sul lato Gateway.

---

## Checklist per la risoluzione dei problemi

- Chiave di sessione errata? Inizia da [/concepts/session](/it/concepts/session) e conferma il `sessionKey` in `/status`.
- Mancata corrispondenza tra store e trascrizione? Conferma l'host Gateway e il percorso dello store da `openclaw status`.
- Troppa Compaction? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di Compaction (`reserveTokens` troppo alto per la finestra del modello può causare Compaction anticipata)
  - crescita eccessiva dei risultati degli strumenti: abilita/regola la potatura della sessione
- Turni silenziosi che trapelano? Conferma che la risposta inizi con `NO_REPLY` (token esatto senza distinzione tra maiuscole/minuscole) e che tu sia su una build che include la correzione della soppressione dello streaming.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Motore di contesto](/it/concepts/context-engine)
