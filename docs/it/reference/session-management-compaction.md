---
read_when:
    - Devi eseguire il debug degli ID sessione, del transcript JSONL o dei campi di sessions.json
    - Stai modificando il comportamento di Compaction automatica o aggiungendo attività di pulizia "pre-Compaction"
    - Vuoi implementare svuotamenti della memoria o turni di sistema silenziosi
summary: 'Approfondimento: archivio delle sessioni + trascrizioni, ciclo di vita e dettagli interni di (auto)compaction'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-07-04T20:34:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestisce le sessioni end-to-end in queste aree:

- **Instradamento delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Archivio delle sessioni** (`sessions.json`) e cosa traccia
- **Persistenza della trascrizione** (`*.jsonl`) e la sua struttura
- **Igiene della trascrizione** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti di contesto** (finestra di contesto rispetto ai token tracciati)
- **Compaction** (manuale e auto-compaction) e dove agganciare il lavoro pre-compaction
- **Manutenzione silenziosa** (scritture in memoria che non devono produrre output visibile all'utente)

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

- Le UI (app macOS, UI di controllo web, TUI) devono interrogare il Gateway per gli elenchi delle sessioni e i conteggi dei token.
- In modalità remota, i file di sessione si trovano sull'host remoto; "controllare i file locali del tuo Mac" non rifletterà ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw conserva le sessioni in due livelli:

1. **Archivio delle sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccolo, mutabile, sicuro da modificare (o da cui eliminare voci)
   - Traccia i metadati della sessione (id della sessione corrente, ultima attività, interruttori, contatori di token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Memorizza la conversazione effettiva + chiamate agli strumenti + riepiloghi di Compaction
   - Usata per ricostruire il contesto del modello per turni futuri
   - I checkpoint di Compaction sono metadati sopra la trascrizione successore
     compattata. Le nuove compaction non scrivono una seconda copia
     `.checkpoint.*.jsonl`.

I lettori della cronologia del Gateway devono evitare di materializzare l'intera trascrizione a meno che
la superficie non richieda esplicitamente accesso storico arbitrario. La cronologia della prima pagina,
la cronologia chat incorporata, il ripristino dopo riavvio e i controlli token/uso usano letture di coda
limitate. Le scansioni complete della trascrizione passano attraverso l'indice asincrono della trascrizione, che viene
memorizzato nella cache per percorso file più `mtimeMs`/`size` e condiviso tra lettori concorrenti.

---

## Posizioni su disco

Per agente, sull'host Gateway:

- Archivio: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni di argomenti Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw le risolve tramite `src/config/sessions.ts`.

---

## Manutenzione dell'archivio e controlli del disco

La persistenza delle sessioni ha controlli di manutenzione automatici (`session.maintenance`) per `sessions.json`, artefatti di trascrizione e sidecar di traiettoria:

- `mode`: `enforce` (predefinito) o `warn`
- `pruneAfter`: soglia di età per voci obsolete (predefinito `30d`)
- `maxEntries`: limite delle voci in `sessions.json` (predefinito `500`)
- La conservazione delle sonde di breve durata delle esecuzioni modello del gateway è fissata a `24h`, ma è vincolata alla pressione: rimuove le righe di sonda strict obsolete solo quando viene raggiunta la pressione di manutenzione/limite delle voci di sessione. Questo si applica solo alle chiavi di sonda esplicite strict che corrispondono a `agent:*:explicit:model-run-<uuid>` ed esegue prima della pulizia/limitazione globale delle voci obsolete quando viene eseguito.
- `resetArchiveRetention`: conservazione per gli archivi di trascrizione `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget opzionale della directory delle sessioni
- `highWaterBytes`: obiettivo opzionale dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Le normali scritture del Gateway passano attraverso uno scrittore di sessioni per archivio che serializza le mutazioni nel processo senza acquisire un blocco file runtime. Gli helper di patch hot-path prendono in prestito la cache mutabile validata mentre mantengono quello slot dello scrittore, quindi i file `sessions.json` grandi non vengono clonati o riletti per ogni aggiornamento dei metadati. Il codice runtime deve preferire `updateSessionStore(...)` o `updateSessionStoreEntry(...)`; i salvataggi diretti dell'intero archivio sono strumenti di compatibilità e manutenzione offline. Quando un Gateway è raggiungibile, `openclaw sessions cleanup` e `openclaw agents delete` non dry-run delegano le mutazioni dell'archivio al Gateway così la pulizia si unisce alla stessa coda dello scrittore; `--store <path>` è il percorso esplicito di riparazione offline per la manutenzione diretta dei file. La pulizia `maxEntries` è ancora raggruppata in batch per limiti di dimensioni di produzione, quindi un archivio può superare brevemente il limite configurato prima che la successiva pulizia high-water lo riscriva riducendolo. Le letture dell'archivio delle sessioni non potano né limitano le voci durante l'avvio del Gateway; usa le scritture o `openclaw sessions cleanup --enforce` per la pulizia. `openclaw sessions cleanup --enforce` applica comunque immediatamente il limite configurato e pota i vecchi artefatti di trascrizione, checkpoint e traiettoria non referenziati anche quando non è configurato alcun budget disco.

La manutenzione mantiene puntatori durevoli a conversazioni esterne come sessioni di gruppo
e sessioni chat con ambito thread, ma le voci runtime sintetiche per Cron, hook,
Heartbeat, ACP e sub-agenti possono comunque essere rimosse quando superano
l'età, il conteggio o il budget disco configurati. Le sessioni di sonda model-run del Gateway usano la
conservazione separata `24h` model-run solo quando la loro chiave corrisponde esattamente a
`agent:*:explicit:model-run-<uuid>`; altre sessioni esplicite non fanno parte di
quella conservazione. La pulizia model-run viene applicata solo sotto pressione del limite
delle voci di sessione. Le esecuzioni Cron isolate mantengono il proprio controllo
`cron.sessionRetention`, indipendente dalla conservazione delle sonde model-run.

OpenClaw non crea più backup automatici di rotazione `sessions.json.bak.*` durante le scritture del Gateway. La chiave legacy `session.maintenance.rotateBytes` viene ignorata e `openclaw doctor --fix` la rimuove dalle configurazioni più vecchie.

Le mutazioni della trascrizione usano un blocco di scrittura di sessione sul file di trascrizione. L'acquisizione del blocco attende fino a
`session.writeLock.acquireTimeoutMs` prima di esporre un errore di sessione occupata; il valore predefinito è `60000`
ms. Aumentalo solo quando attività legittime di preparazione, pulizia, Compaction o mirroring della trascrizione contendono
più a lungo su macchine lente. `session.writeLock.staleMs` controlla quando un blocco esistente può essere
rivendicato come obsoleto; il valore predefinito è `1800000` ms. `session.writeLock.maxHoldMs` controlla la
soglia di rilascio del watchdog nel processo; il valore predefinito è `300000` ms. Gli override env di emergenza sono
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` e
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuove prima gli artefatti archiviati più vecchi, le trascrizioni orfane o gli artefatti di traiettoria orfani.
2. Se è ancora sopra l'obiettivo, espelle le voci di sessione più vecchie e i relativi file di trascrizione/traiettoria.
3. Continua finché l'uso non è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala potenziali espulsioni ma non modifica l'archivio/i file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log di esecuzione

Anche le esecuzioni Cron isolate creano voci di sessione/trascrizioni e hanno controlli di conservazione dedicati:

- `cron.sessionRetention` (predefinito `24h`) pota le vecchie sessioni di esecuzione Cron isolate dall'archivio delle sessioni (`false` disabilita).
- `cron.runLog.keepLines` pota le righe di cronologia delle esecuzioni SQLite conservate per job Cron (predefinito: `2000`). `cron.runLog.maxBytes` resta accettato per log di esecuzione più vecchi basati su file.

Quando Cron forza la creazione di una nuova sessione di esecuzione isolata, sanifica la precedente
voce di sessione `cron:<jobId>` prima di scrivere la nuova riga. Porta con sé preferenze
sicure come impostazioni thinking/fast/verbose, etichette e override espliciti
di modello/autenticazione selezionati dall'utente. Scarta il contesto ambientale della conversazione come
routing di canale/gruppo, policy di invio o coda, elevazione, origine e binding runtime ACP
così una nuova esecuzione isolata non può ereditare consegna obsoleta o
autorità runtime da un'esecuzione precedente.

---

## Chiavi di sessione (`sessionKey`)

Una `sessionKey` identifica _in quale contenitore di conversazione_ ti trovi (routing + isolamento).

Pattern comuni:

- Chat principale/diretta (per agente): `agent:<agentId>:<mainKey>` (predefinito `main`)
- Gruppo: `agent:<agentId>:<channel>:group:<id>`
- Stanza/canale (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a meno che non venga sovrascritto)

Le regole canoniche sono documentate in [/concepts/session](/it/concepts/session).

---

## Id di sessione (`sessionId`)

Ogni `sessionKey` punta a una `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea una nuova `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito 4:00 AM ora locale sull'host gateway) crea una nuova `sessionId` al messaggio successivo dopo il limite di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea una nuova `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando sono configurati sia giornaliero sia inattività, vince quello che scade per primo.
- **Ripresa dopo riconnessione della UI di controllo** può preservare la sessione attualmente visibile per un invio dopo riconnessione quando il Gateway riceve la `sessionId` corrispondente da un client UI operatore. Gli invii ordinari obsoleti creano comunque una nuova `sessionId`.
- **Eventi di sistema** (Heartbeat, risvegli Cron, notifiche exec, contabilità del gateway) possono mutare la riga della sessione ma non estendono la freschezza del reset giornaliero/per inattività. Il rollover del reset scarta gli avvisi di eventi di sistema in coda per la sessione precedente prima che venga costruito il prompt fresco.
- **Policy di fork padre** usa il ramo attivo di OpenClaw quando crea un thread o un fork di subagente. Se quel ramo è troppo grande, OpenClaw avvia il figlio con contesto isolato invece di fallire o ereditare una cronologia inutilizzabile. La policy di dimensionamento è automatica; la configurazione legacy `session.parentForkMaxTokens` viene rimossa da `openclaw doctor --fix`.

Dettaglio di implementazione: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dell'archivio delle sessioni (`sessions.json`)

Il tipo valore dell'archivio è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivo):

- `sessionId`: id della trascrizione corrente (il nome file deriva da questo salvo che `sessionFile` sia impostato)
- `sessionStartedAt`: timestamp di avvio per il `sessionId` corrente; la freschezza del ripristino giornaliero
  usa questo valore. Le righe legacy possono derivarlo dall'intestazione della sessione JSONL.
- `lastInteractionAt`: timestamp dell'ultima interazione reale dell'utente/canale; la freschezza del ripristino
  per inattività usa questo valore, così eventi heartbeat, cron ed exec non mantengono le sessioni
  attive. Le righe legacy senza questo campo ripiegano sull'ora di avvio della sessione recuperata
  per la freschezza dell'inattività.
- `updatedAt`: timestamp dell'ultima mutazione della riga dello store, usato per elenchi, pruning e
  contabilità. Non è l'autorità per la freschezza del ripristino giornaliero/per inattività.
- `archivedAt`: timestamp di archiviazione opzionale. Le sessioni archiviate restano nello store
  con la loro trascrizione intatta e sono escluse dai normali elenchi attivi.
- `pinnedAt`: timestamp di fissaggio opzionale. Le sessioni attive fissate vengono ordinate prima delle
  sessioni non fissate; archiviare una sessione ne rimuove il fissaggio.
- Interoperabilità dei thread Codex: entrambi i campi seguono la forma di gestione thread di Codex —
  i booleani `archived`/`pinned` sul wire derivano sempre dal timestamp e vengono marcati lato server,
  in conformità con la semantica Codex `threads.archived_at` e la serializzazione camelCase. I timestamp
  OpenClaw sono in millisecondi epoch mentre Codex usa secondi epoch, quindi i bridge convertono al confine
  del plugin codex. Codex non ha ancora un'API di fissaggio (solo `thread/archive`/`thread/unarchive`);
  lo stato fissato resta lato OpenClaw finché non ne esisterà una, momento in cui la forma corrispondente
  consentirà alle sessioni associate di fare round-trip dello stato di fissaggio meccanicamente.
- `sessionFile`: override esplicito opzionale del percorso della trascrizione
- `chatType`: `direct | group | room` (aiuta le UI e la policy di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per l'etichettatura di gruppi/canali
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori di token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte l'auto-compaction è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush della memoria pre-compaction
- `memoryFlushCompactionCount`: conteggio di compaction quando è stato eseguito l'ultimo flush

Lo store è modificabile in sicurezza, ma il Gateway è l'autorità: può riscrivere o reidratare le voci mentre le sessioni vengono eseguite.

---

## Struttura della trascrizione (`*.jsonl`)

Le trascrizioni sono gestite dal `SessionManager` di `openclaw/plugin-sdk/agent-sessions`.

Il file è JSONL:

- Prima riga: intestazione della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` opzionale)
- Poi: voci della sessione con `id` + `parentId` (albero)

Tipi di voci rilevanti:

- `message`: messaggi utente/assistente/toolResult
- `custom_message`: messaggi inseriti dall'estensione che _entrano_ nel contesto del modello (possono essere nascosti dalla UI)
- `custom`: stato dell'estensione che _non_ entra nel contesto del modello
- `compaction`: riepilogo di compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito quando si naviga un ramo dell'albero

OpenClaw intenzionalmente **non** "corregge" le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto vs token tracciati

Sono importanti due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dello store di sessione**: statistiche mobili scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto proviene dal catalogo dei modelli (e può essere sovrascritta tramite configurazione).
- `contextTokens` nello store è una stima/valore di reporting a runtime; non trattarlo come una garanzia rigorosa.

Per maggiori informazioni, vedi [/token-use](/it/reference/token-use).

---

## Compaction: che cos'è

Compaction riepiloga la conversazione più vecchia in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo Compaction, i turni futuri vedono:

- Il riepilogo di Compaction
- I messaggi dopo `firstKeptEntryId`

La reiniezione della sezione AGENTS.md dopo Compaction è opt-in tramite
`agents.defaults.compaction.postCompactionSections`; quando non è impostata o è `[]`,
OpenClaw non aggiunge estratti di AGENTS.md sopra il riepilogo di Compaction.

Compaction è **persistente** (a differenza del pruning delle sessioni). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Confini dei chunk di Compaction e abbinamento degli strumenti

Quando OpenClaw divide una trascrizione lunga in chunk di Compaction, mantiene
le chiamate agli strumenti dell'assistente abbinate alle voci `toolResult` corrispondenti.

- Se la divisione per quota di token cade tra una chiamata a uno strumento e il suo risultato, OpenClaw
  sposta il confine al messaggio di chiamata strumento dell'assistente invece di separare
  la coppia.
- Se un blocco finale di risultati strumento altrimenti spingerebbe il chunk oltre il target,
  OpenClaw preserva quel blocco di strumenti in sospeso e mantiene intatta la coda non riepilogata.
- I blocchi di chiamate strumento interrotti/con errore non mantengono aperta una divisione in sospeso.

---

## Quando avviene l'auto-compaction (runtime OpenClaw)

Nell’agente OpenClaw incorporato, la compattazione automatica si attiva in due casi:

1. **Ripristino da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili nella forma dei provider) → compatta → riprova.
   Quando il provider segnala il conteggio dei token tentato, OpenClaw inoltra
   quel conteggio osservato alla Compaction di ripristino da overflow. Se il provider conferma
   l’overflow ma non espone un conteggio analizzabile, OpenClaw passa ai motori di compattazione
   e alla diagnostica un conteggio sintetico minimamente oltre il budget.
   Se il ripristino da overflow continua a non riuscire, OpenClaw mostra indicazioni esplicite
   all’utente e preserva la mappatura della sessione corrente invece di ruotare silenziosamente
   la chiave di sessione verso un nuovo ID sessione. Il passaggio successivo è controllato dall’operatore:
   riprovare il messaggio, eseguire `/compact` oppure eseguire `/new` quando si preferisce una sessione nuova.
2. **Manutenzione della soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è il margine riservato per i prompt + il prossimo output del modello

Queste sono le semantiche di runtime di OpenClaw.

OpenClaw può anche attivare una compattazione locale preliminare prima di aprire la prossima
esecuzione quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato e il
file di trascrizione attivo raggiunge quella dimensione. Questo è un controllo della dimensione del file per il costo
di riapertura locale, non per l’archiviazione grezza: OpenClaw esegue comunque la normale compattazione semantica,
e richiede `truncateAfterCompaction` in modo che il riepilogo compattato possa diventare una
nuova trascrizione successore.

Per le esecuzioni OpenClaw incorporate, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
aggiunge un controllo facoltativo del loop degli strumenti. Dopo che un risultato dello strumento è stato aggiunto e prima della
prossima chiamata al modello, OpenClaw stima la pressione sul prompt usando la stessa logica di budget
preliminare usata all’inizio del turno. Se il contesto non rientra più, il controllo non
compatta all’interno dell’hook `transformContext` del runtime OpenClaw. Genera un segnale strutturato
di precontrollo a metà turno, interrompe l’invio del prompt corrente e consente al
loop di esecuzione esterno di usare il percorso di ripristino esistente: troncare i risultati degli strumenti sovradimensionati
quando è sufficiente, oppure attivare la modalità di compattazione configurata e riprovare. L’opzione
è disabilitata per impostazione predefinita e funziona con entrambe le modalità di compattazione `default` e `safeguard`,
inclusa la compattazione safeguard supportata da provider.
Questo è indipendente da `maxActiveTranscriptBytes`: il controllo basato sulla dimensione in byte viene eseguito
prima dell’apertura di un turno, mentre il precontrollo a metà turno viene eseguito più tardi nel loop degli strumenti
OpenClaw incorporato, dopo che sono stati aggiunti nuovi risultati degli strumenti.

---

## Impostazioni di Compaction (`reserveTokens`, `keepRecentTokens`)

Le impostazioni di Compaction del runtime OpenClaw risiedono nelle impostazioni dell’agente:

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
- `/compact` manuale rispetta un `agents.defaults.compaction.keepRecentTokens` esplicito
  e mantiene il punto di taglio della coda recente del runtime OpenClaw. Senza un budget di conservazione esplicito,
  la compattazione manuale resta un checkpoint rigido e il contesto ricostruito parte dal
  nuovo riepilogo.
- Imposta `agents.defaults.compaction.midTurnPrecheck.enabled: true` per eseguire il
  precontrollo facoltativo del loop degli strumenti dopo i nuovi risultati degli strumenti e prima della prossima chiamata al modello.
  Questo è solo un trigger; la generazione del riepilogo usa comunque il percorso di
  Compaction configurato. È indipendente da `maxActiveTranscriptBytes`, che è un
  controllo della dimensione in byte della trascrizione attiva all’inizio del turno.
- Imposta `agents.defaults.compaction.maxActiveTranscriptBytes` su un valore in byte o su
  una stringa come `"20mb"` per eseguire la compattazione locale prima di un turno quando la trascrizione
  attiva diventa grande. Questo controllo è attivo solo quando anche
  `truncateAfterCompaction` è abilitato. Lascialo non impostato o impostalo a `0` per
  disabilitarlo.
- Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato,
  OpenClaw ruota la trascrizione attiva verso un JSONL successore compattato dopo la
  compattazione. Le azioni di checkpoint branch/restore usano quel successore compattato;
  i file di checkpoint legacy pre-compattazione restano leggibili finché referenziati.

Perché: lasciare abbastanza margine per operazioni di “manutenzione” multi-turno (come le scritture in memoria) prima che la compattazione diventi inevitabile.

Implementazione: `applyAgentCompactionSettingsFromConfig()` in `src/agents/agent-settings.ts`
(chiamata dai percorsi di configurazione del turno dell’embedded-runner e della compattazione).

---

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction tramite `registerCompactionProvider()` nell’API del Plugin. Quando `agents.defaults.compaction.provider` è impostato sull’ID di un provider registrato, l’estensione safeguard delega la riepilogazione a quel provider invece che alla pipeline integrata `summarizeInStages`.

- `provider`: ID di un Plugin provider di Compaction registrato. Lascia non impostato per la riepilogazione LLM predefinita.
- Impostare un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di Compaction e la stessa policy di preservazione degli identificatori del percorso integrato.
- Il safeguard preserva comunque il contesto del suffisso dei turni recenti e dei turni divisi dopo l’output del provider.
- La riepilogazione safeguard integrata ridistilla i riepiloghi precedenti con i nuovi messaggi
  invece di preservare integralmente il riepilogo precedente completo.
- La modalità safeguard abilita per impostazione predefinita gli audit di qualità del riepilogo; imposta
  `qualityGuard.enabled: false` per saltare il comportamento di riprova in caso di output malformato.
- Se il provider fallisce o restituisce un risultato vuoto, OpenClaw ripiega automaticamente sulla riepilogazione LLM integrata.
- I segnali di interruzione/timeout vengono rilanciati (non assorbiti) per rispettare l’annullamento da parte del chiamante.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Superfici visibili all’utente

Puoi osservare la Compaction e lo stato della sessione tramite:

- `/status` (in qualsiasi sessione di chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Log del Gateway (`pnpm gateway:watch` o `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modalità dettagliata: `🧹 Auto-compaction complete` + conteggio delle compattazioni

---

## Manutenzione silenziosa (`NO_REPLY`)

OpenClaw supporta turni “silenziosi” per attività in background in cui l’utente non deve vedere output intermedi.

Convenzione:

- L'assistente avvia il proprio output con il token silenzioso esatto `NO_REPLY` /
  `no_reply` per indicare "non recapitare una risposta all'utente".
- OpenClaw lo rimuove/sopprime nel livello di recapito.
- La soppressione del token silenzioso esatto non distingue maiuscole e minuscole, quindi `NO_REPLY` e
  `no_reply` sono entrambi validi quando l'intero payload è solo il token silenzioso.
- Questo vale solo per turni realmente in background/senza recapito; non è una scorciatoia per
  normali richieste utente azionabili.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming di bozza/digitazione** quando un
chunk parziale inizia con `NO_REPLY`, così le operazioni silenziose non espongono output parziale
a metà turno.

---

## "Svuotamento della memoria" pre-Compaction (implementato)

Obiettivo: prima che avvenga l'auto-Compaction, eseguire un turno agentico silenzioso che scriva su disco
uno stato durevole (ad esempio `memory/YYYY-MM-DD.md` nel workspace dell'agente) così la Compaction non può
cancellare il contesto critico.

OpenClaw usa l'approccio **svuotamento prima della soglia**:

1. Monitora l'uso del contesto della sessione.
2. Quando supera una "soglia morbida" (inferiore alla soglia di Compaction del runtime OpenClaw), esegui una direttiva silenziosa
   "scrivi memoria ora" all'agente.
3. Usa il token silenzioso esatto `NO_REPLY` / `no_reply` così l'utente non vede
   nulla.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `model` (override opzionale esatto provider/modello per il turno di svuotamento, ad esempio `ollama/qwen3:8b`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di svuotamento)
- `systemPrompt` (prompt di sistema aggiuntivo accodato per il turno di svuotamento)

Note:

- Il prompt/prompt di sistema predefinito include un suggerimento `NO_REPLY` per sopprimere
  il recapito.
- Quando `model` è impostato, il turno di svuotamento usa quel modello senza ereditare la
  catena di fallback della sessione attiva, così la manutenzione solo locale non ricade silenziosamente
  su un modello di conversazione a pagamento.
- Lo svuotamento viene eseguito una volta per ciclo di Compaction (tracciato in `sessions.json`).
- Lo svuotamento viene eseguito solo per sessioni OpenClaw incorporate (i backend CLI lo saltano).
- Lo svuotamento viene saltato quando il workspace della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memoria](/it/concepts/memory) per il layout dei file del workspace e i pattern di scrittura.

OpenClaw espone anche un hook `session_before_compact` nell'API delle estensioni, ma la logica di
svuotamento di OpenClaw oggi risiede sul lato Gateway.

---

## Checklist per la risoluzione dei problemi

- Chiave di sessione errata? Parti da [/concepts/session](/it/concepts/session) e conferma il `sessionKey` in `/status`.
- Mancata corrispondenza tra store e trascrizione? Conferma l'host Gateway e il percorso dello store da `openclaw status`.
- Compaction eccessiva? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di Compaction (`reserveTokens` troppo alto per la finestra del modello può causare una Compaction anticipata)
  - rigonfiamento dei risultati degli strumenti: abilita/regola la potatura della sessione
- Turni silenziosi che trapelano? Conferma che la risposta inizi con `NO_REPLY` (token esatto senza distinzione tra maiuscole e minuscole) e che tu stia usando una build che include la correzione della soppressione dello streaming.

## Correlati

- [Gestione della sessione](/it/concepts/session)
- [Potatura della sessione](/it/concepts/session-pruning)
- [Motore di contesto](/it/concepts/context-engine)
