---
read_when:
    - Devi eseguire il debug degli ID di sessione, del JSONL della trascrizione o dei campi di sessions.json
    - Stai modificando il comportamento di auto-compaction o aggiungendo attività di gestione "pre-compaction"
    - Vuoi implementare svuotamenti della memoria o turni di sistema silenziosi
summary: 'Analisi approfondita: archivio delle sessioni e trascrizioni, ciclo di vita e internals di (auto)compattazione'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-06-27T18:14:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestisce le sessioni end-to-end in queste aree:

- **Instradamento delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Archivio delle sessioni** (`sessions.json`) e cosa traccia
- **Persistenza delle trascrizioni** (`*.jsonl`) e la relativa struttura
- **Igiene delle trascrizioni** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti di contesto** (finestra di contesto rispetto ai token tracciati)
- **Compaction** (manuale e automatica) e dove agganciare il lavoro pre-Compaction
- **Manutenzione silenziosa** (scritture in memoria che non devono produrre output visibile all'utente)

Se vuoi prima una panoramica di livello più alto, inizia da:

- [Gestione delle sessioni](/it/concepts/session)
- [Compaction](/it/concepts/compaction)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Igiene delle trascrizioni](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato intorno a un singolo **processo Gateway** che possiede lo stato delle sessioni.

- Le UI (app macOS, Control UI web, TUI) devono interrogare il Gateway per gli elenchi delle sessioni e i conteggi dei token.
- In modalità remota, i file delle sessioni si trovano sull'host remoto; "controllare i file locali del tuo Mac" non rifletterà ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw persiste le sessioni in due livelli:

1. **Archivio delle sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccola, mutabile, sicura da modificare (o da cui eliminare voci)
   - Traccia i metadati della sessione (ID della sessione corrente, ultima attività, interruttori, contatori di token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Archivia la conversazione effettiva + chiamate agli strumenti + riepiloghi di Compaction
   - Usata per ricostruire il contesto del modello per i turni futuri
   - I checkpoint di Compaction sono metadati sopra la trascrizione successiva compattata. Le nuove Compaction non scrivono una seconda copia `.checkpoint.*.jsonl`.

I lettori della cronologia del Gateway devono evitare di materializzare l'intera trascrizione a meno che la superficie non richieda esplicitamente l'accesso arbitrario alla cronologia. La cronologia della prima pagina, la cronologia chat incorporata, il recupero dopo riavvio e i controlli su token/utilizzo usano letture limitate della coda. Le scansioni complete delle trascrizioni passano attraverso l'indice asincrono delle trascrizioni, che viene memorizzato nella cache per percorso file più `mtimeMs`/`size` e condiviso tra lettori concorrenti.

---

## Posizioni su disco

Per agente, sull'host Gateway:

- Archivio: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni di argomento Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw le risolve tramite `src/config/sessions.ts`.

---

## Manutenzione dell'archivio e controlli del disco

La persistenza delle sessioni ha controlli di manutenzione automatici (`session.maintenance`) per `sessions.json`, artefatti di trascrizione e sidecar di traiettoria:

- `mode`: `enforce` (predefinito) o `warn`
- `pruneAfter`: soglia di età per le voci obsolete (predefinito `30d`)
- `maxEntries`: limite massimo di voci in `sessions.json` (predefinito `500`)
- La conservazione delle probe di model-run Gateway di breve durata è fissa a `24h`, ma è vincolata alla pressione: rimuove le righe di probe rigorose obsolete solo quando viene raggiunta la pressione di manutenzione/limite delle voci di sessione. Questo si applica solo alle chiavi di probe esplicite rigorose che corrispondono a `agent:*:explicit:model-run-<uuid>` e viene eseguito prima della pulizia/limitazione globale delle voci obsolete quando viene eseguito.
- `resetArchiveRetention`: conservazione per gli archivi di trascrizione `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget opzionale per la directory delle sessioni
- `highWaterBytes`: obiettivo opzionale dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Le normali scritture del Gateway passano attraverso uno scrittore di sessione per archivio che serializza le mutazioni nel processo senza acquisire un lock di file a runtime. Gli helper di patch del percorso critico prendono in prestito la cache mutabile validata mentre mantengono quello slot di scrittura, quindi i file `sessions.json` di grandi dimensioni non vengono clonati o riletti per ogni aggiornamento dei metadati. Il codice runtime deve preferire `updateSessionStore(...)` o `updateSessionStoreEntry(...)`; i salvataggi diretti dell'intero archivio sono strumenti di compatibilità e manutenzione offline. Quando un Gateway è raggiungibile, `openclaw sessions cleanup` e `openclaw agents delete` non dry-run delegano le mutazioni dell'archivio al Gateway, così la pulizia entra nella stessa coda di scrittura; `--store <path>` è il percorso esplicito di riparazione offline per la manutenzione diretta dei file. La pulizia `maxEntries` è ancora in batch per limiti di dimensioni di produzione, quindi un archivio può superare brevemente il limite configurato prima che la successiva pulizia high-water lo riscriva sotto la soglia. Le letture dell'archivio delle sessioni non potano né limitano le voci durante l'avvio del Gateway; usa scritture o `openclaw sessions cleanup --enforce` per la pulizia. `openclaw sessions cleanup --enforce` applica comunque immediatamente il limite configurato e pota i vecchi artefatti di trascrizione, checkpoint e traiettoria non referenziati anche quando non è configurato alcun budget disco.

La manutenzione conserva puntatori durevoli a conversazioni esterne, come sessioni di gruppo e sessioni chat con ambito thread, ma le voci runtime sintetiche per cron, hook, Heartbeat, ACP e sub-agenti possono comunque essere rimosse quando superano l'età, il conteggio o il budget disco configurati. Le sessioni probe di model-run Gateway usano la conservazione model-run separata di `24h` solo quando la loro chiave corrisponde esattamente a `agent:*:explicit:model-run-<uuid>`; altre sessioni esplicite non fanno parte di quella conservazione. La pulizia model-run viene applicata solo sotto pressione del limite delle voci di sessione. Le esecuzioni cron isolate mantengono il proprio controllo `cron.sessionRetention`, indipendente dalla conservazione delle probe model-run.

OpenClaw non crea più backup di rotazione automatici `sessions.json.bak.*` durante le scritture del Gateway. La chiave legacy `session.maintenance.rotateBytes` viene ignorata e `openclaw doctor --fix` la rimuove dalle configurazioni più vecchie.

Le mutazioni delle trascrizioni usano un lock di scrittura della sessione sul file di trascrizione. L'acquisizione del lock attende fino a `session.writeLock.acquireTimeoutMs` prima di esporre un errore di sessione occupata; il valore predefinito è `60000` ms. Aumentalo solo quando lavoro legittimo di preparazione, pulizia, Compaction o mirror della trascrizione contende più a lungo su macchine lente. `session.writeLock.staleMs` controlla quando un lock esistente può essere recuperato come obsoleto; il valore predefinito è `1800000` ms. `session.writeLock.maxHoldMs` controlla la soglia di rilascio del watchdog nel processo; il valore predefinito è `300000` ms. Gli override env di emergenza sono `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` e `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuovi prima gli artefatti archiviati più vecchi, le trascrizioni orfane o gli artefatti di traiettoria orfani.
2. Se ancora sopra l'obiettivo, espelli le voci di sessione più vecchie e i relativi file di trascrizione/traiettoria.
3. Continua finché l'uso è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala le potenziali espulsioni ma non muta l'archivio/i file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log di esecuzione

Anche le esecuzioni cron isolate creano voci/trascrizioni di sessione e hanno controlli di conservazione dedicati:

- `cron.sessionRetention` (predefinito `24h`) pota le vecchie sessioni di esecuzione cron isolate dall'archivio delle sessioni (`false` disabilita).
- `cron.runLog.keepLines` pota le righe conservate della cronologia delle esecuzioni SQLite per job cron (predefinito: `2000`). `cron.runLog.maxBytes` rimane accettato per i log di esecuzione più vecchi basati su file.

Quando cron forza la creazione di una nuova sessione di esecuzione isolata, sanitizza la voce di sessione precedente `cron:<jobId>` prima di scrivere la nuova riga. Trasporta preferenze sicure come impostazioni thinking/fast/verbose, etichette e override espliciti selezionati dall'utente per modello/autenticazione. Elimina il contesto ambientale della conversazione come instradamento canale/gruppo, policy di invio o coda, elevazione, origine e binding runtime ACP, così una nuova esecuzione isolata non può ereditare consegna obsoleta o autorità runtime da un'esecuzione precedente.

---

## Chiavi di sessione (`sessionKey`)

Una `sessionKey` identifica _in quale contenitore di conversazione_ ti trovi (instradamento + isolamento).

Pattern comuni:

- Chat principale/diretta (per agente): `agent:<agentId>:<mainKey>` (predefinito `main`)
- Gruppo: `agent:<agentId>:<channel>:group:<id>`
- Stanza/canale (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a meno che non sia sovrascritto)

Le regole canoniche sono documentate in [/concepts/session](/it/concepts/session).

---

## ID di sessione (`sessionId`)

Ogni `sessionKey` punta a un `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea un nuovo `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito 4:00 AM ora locale sull'host Gateway) crea un nuovo `sessionId` al messaggio successivo dopo il limite di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando giornaliero + inattività sono entrambi configurati, vince quello che scade prima.
- **Ripresa alla riconnessione della Control UI** può preservare la sessione attualmente visibile per un invio di riconnessione quando il Gateway riceve il `sessionId` corrispondente da un client UI operatore. Gli invii ordinari obsoleti creano comunque un nuovo `sessionId`.
- **Eventi di sistema** (Heartbeat, risvegli cron, notifiche exec, contabilità Gateway) possono mutare la riga di sessione ma non estendono la freschezza del reset giornaliero/per inattività. Il rollover del reset scarta gli avvisi di eventi di sistema in coda per la sessione precedente prima che venga costruito il prompt fresco.
- **Policy di fork padre** usa il ramo attivo di OpenClaw quando crea un thread o un fork di subagente. Se quel ramo è troppo grande, OpenClaw avvia il figlio con contesto isolato invece di fallire o ereditare una cronologia inutilizzabile. La policy di dimensionamento è automatica; la configurazione legacy `session.parentForkMaxTokens` viene rimossa da `openclaw doctor --fix`.

Dettaglio di implementazione: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dell'archivio sessioni (`sessions.json`)

Il tipo di valore dell'archivio è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: ID della trascrizione corrente (il nome file deriva da questo a meno che `sessionFile` non sia impostato)
- `sessionStartedAt`: timestamp di inizio per il `sessionId` corrente; la freschezza del reset giornaliero usa questo. Le righe legacy possono derivarlo dall'intestazione della sessione JSONL.
- `lastInteractionAt`: timestamp dell'ultima interazione reale utente/canale; la freschezza del reset per inattività usa questo, così Heartbeat, cron ed eventi exec non mantengono vive le sessioni. Le righe legacy senza questo campo ricadono sull'ora di inizio sessione recuperata per la freschezza per inattività.
- `updatedAt`: timestamp dell'ultima mutazione della riga dell'archivio, usato per elenchi, potatura e contabilità. Non è l'autorità per la freschezza del reset giornaliero/per inattività.
- `sessionFile`: override opzionale esplicito del percorso della trascrizione
- `chatType`: `direct | group | room` (aiuta le UI e la policy di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per l'etichettatura di gruppi/canali
- Interruttori:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori di token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte la Compaction automatica è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush della memoria pre-Compaction
- `memoryFlushCompactionCount`: conteggio di Compaction quando è stato eseguito l'ultimo flush

L'archivio è sicuro da modificare, ma il Gateway è l'autorità: può riscrivere o reidratare le voci mentre le sessioni vengono eseguite.

---

## Struttura delle trascrizioni (`*.jsonl`)

Le trascrizioni sono gestite dal `SessionManager` di `openclaw/plugin-sdk/agent-sessions`.

Il file è JSONL:

- Prima riga: intestazione della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` opzionale)
- Poi: voci della sessione con `id` + `parentId` (albero)

Tipi di voce notevoli:

- `message`: messaggi user/assistant/toolResult
- `custom_message`: messaggi iniettati dall’estensione che _entrano_ nel contesto del modello (possono essere nascosti dall’interfaccia utente)
- `custom`: stato dell’estensione che _non_ entra nel contesto del modello
- `compaction`: riepilogo di compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito durante la navigazione di un ramo dell’albero

OpenClaw intenzionalmente **non** "corregge" le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto vs token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dell’archivio di sessione**: statistiche mobili scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto viene dal catalogo dei modelli (e può essere sovrascritta tramite configurazione).
- `contextTokens` nell’archivio è un valore di stima/reporting a runtime; non trattarlo come una garanzia rigida.

Per altro, vedi [/token-use](/it/reference/token-use).

---

## Compaction: che cos’è

Compaction riepiloga la conversazione più vecchia in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo la compaction, i turni futuri vedono:

- Il riepilogo di compaction
- I messaggi dopo `firstKeptEntryId`

La reiniezione della sezione AGENTS.md dopo la compaction è opt-in tramite
`agents.defaults.compaction.postCompactionSections`; quando non impostata o `[]`,
OpenClaw non aggiunge estratti di AGENTS.md sopra il riepilogo di compaction.

Compaction è **persistente** (a differenza della potatura della sessione). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Confini dei blocchi di compaction e abbinamento degli strumenti

Quando OpenClaw divide una trascrizione lunga in blocchi di compaction, mantiene
le chiamate agli strumenti dell’assistente abbinate alle voci `toolResult` corrispondenti.

- Se la divisione per quota di token cade tra una chiamata a strumento e il suo risultato, OpenClaw
  sposta il confine al messaggio di chiamata a strumento dell’assistente invece di separare
  la coppia.
- Se un blocco finale di risultati strumento spingerebbe altrimenti il blocco oltre il target,
  OpenClaw preserva quel blocco strumento in sospeso e mantiene intatta la coda
  non riepilogata.
- I blocchi di chiamate a strumento interrotti/con errore non tengono aperta una divisione in sospeso.

---

## Quando avviene l’auto-compaction (runtime OpenClaw)

Nell’agente OpenClaw incorporato, l’auto-compaction si attiva in due casi:

1. **Recupero da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili con forma specifica del provider) → compact → retry.
   Quando il provider riporta il conteggio dei token tentato, OpenClaw inoltra quel
   conteggio osservato nella compaction di recupero da overflow. Se il provider conferma
   l’overflow ma non espone un conteggio analizzabile, OpenClaw passa ai motori di compaction
   e alla diagnostica un conteggio sintetico minimamente oltre budget.
   Se il recupero da overflow fallisce ancora, OpenClaw mostra indicazioni esplicite
   all’utente e preserva la mappatura della sessione corrente invece di ruotare silenziosamente
   la chiave di sessione verso un nuovo id di sessione. Il passaggio successivo è controllato
   dall’operatore: ritentare il messaggio, eseguire `/compact` oppure eseguire `/new` quando si
   preferisce una sessione nuova.
2. **Manutenzione della soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è margine riservato per prompt + successivo output del modello

Queste sono semantiche del runtime OpenClaw.

OpenClaw può anche attivare una compaction locale preliminare prima di aprire l’esecuzione
successiva quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato e il
file della trascrizione attiva raggiunge quella dimensione. Questa è una protezione sulla dimensione del file per il costo di riapertura locale, non archiviazione grezza: OpenClaw esegue comunque la normale compaction semantica,
e richiede `truncateAfterCompaction` affinché il riepilogo compattato possa diventare una
nuova trascrizione successore.

Per le esecuzioni OpenClaw incorporate, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
aggiunge una protezione opt-in del ciclo strumenti. Dopo l’aggiunta di un risultato strumento e prima della
chiamata successiva al modello, OpenClaw stima la pressione del prompt usando la stessa logica di budget
preliminare usata all’inizio del turno. Se il contesto non rientra più, la protezione non
compatta dentro l’hook `transformContext` del runtime OpenClaw. Solleva un segnale strutturato
di controllo preliminare a metà turno, interrompe l’invio del prompt corrente e lascia che il
ciclo di esecuzione esterno usi il percorso di recupero esistente: troncare risultati strumento sovradimensionati
quando basta, oppure attivare la modalità di compaction configurata e riprovare. L’opzione
è disabilitata per impostazione predefinita e funziona con entrambe le modalità di compaction `default` e `safeguard`,
inclusa la compaction safeguard supportata da provider.
Questo è indipendente da `maxActiveTranscriptBytes`: la protezione sulla dimensione in byte viene eseguita
prima dell’apertura di un turno, mentre il controllo preliminare a metà turno viene eseguito più tardi nel ciclo strumenti OpenClaw incorporato
dopo che sono stati aggiunti nuovi risultati strumento.

---

## Impostazioni di compaction (`reserveTokens`, `keepRecentTokens`)

Le impostazioni di compaction del runtime OpenClaw si trovano nelle impostazioni dell’agente:

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
- `/compact` manuale rispetta un `agents.defaults.compaction.keepRecentTokens`
  esplicito e mantiene il punto di taglio della coda recente del runtime OpenClaw. Senza un budget di mantenimento esplicito,
  la compaction manuale resta un checkpoint rigido e il contesto ricostruito parte dal
  nuovo riepilogo.
- Imposta `agents.defaults.compaction.midTurnPrecheck.enabled: true` per eseguire il
  controllo preliminare opzionale del ciclo strumenti dopo nuovi risultati strumento e prima della successiva chiamata al modello.
  Questo è solo un trigger; la generazione del riepilogo usa comunque il percorso di
  compaction configurato. È indipendente da `maxActiveTranscriptBytes`, che è una
  protezione di inizio turno sulla dimensione in byte della trascrizione attiva.
- Imposta `agents.defaults.compaction.maxActiveTranscriptBytes` su un valore in byte o
  una stringa come `"20mb"` per eseguire la compaction locale prima di un turno quando la trascrizione attiva
  diventa grande. Questa protezione è attiva solo quando anche
  `truncateAfterCompaction` è abilitato. Lascialo non impostato o impostalo a `0` per
  disabilitare.
- Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato,
  OpenClaw ruota la trascrizione attiva verso un successore JSONL compattato dopo la
  compaction. Le azioni di checkpoint branch/restore usano quel successore compattato;
  i file di checkpoint legacy precedenti alla compaction restano leggibili mentre sono referenziati.

Perché: lasciare abbastanza margine per la "manutenzione" multi-turno (come le scritture in memoria) prima che la compaction diventi inevitabile.

Implementazione: `applyAgentCompactionSettingsFromConfig()` in `src/agents/agent-settings.ts`
(chiamata dai percorsi di configurazione turno embedded-runner e compaction).

---

## Provider di compaction collegabili

I Plugin possono registrare un provider di compaction tramite `registerCompactionProvider()` sull’API del plugin. Quando `agents.defaults.compaction.provider` è impostato su un id di provider registrato, l’estensione safeguard delega la riepilogazione a quel provider invece che alla pipeline integrata `summarizeInStages`.

- `provider`: id di un Plugin provider di compaction registrato. Lascia non impostato per la riepilogazione LLM predefinita.
- Impostare un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di compaction e la stessa policy di preservazione degli identificatori del percorso integrato.
- Il safeguard preserva comunque il contesto del suffisso turno recente e turno diviso dopo l’output del provider.
- La riepilogazione safeguard integrata ridistilla i riepiloghi precedenti con nuovi messaggi
  invece di preservare integralmente il riepilogo precedente.
- La modalità safeguard abilita per impostazione predefinita gli audit di qualità del riepilogo; imposta
  `qualityGuard.enabled: false` per saltare il comportamento di retry-su-output-malformato.
- Se il provider fallisce o restituisce un risultato vuoto, OpenClaw ripiega automaticamente sulla riepilogazione LLM integrata.
- I segnali di abort/timeout vengono rilanciati (non assorbiti) per rispettare l’annullamento del chiamante.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Superfici visibili all’utente

Puoi osservare compaction e stato della sessione tramite:

- `/status` (in qualsiasi sessione chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Log Gateway (`pnpm gateway:watch` o `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modalità dettagliata: `🧹 Auto-compaction complete` + conteggio compaction

---

## Manutenzione silenziosa (`NO_REPLY`)

OpenClaw supporta turni "silenziosi" per attività in background in cui l’utente non deve vedere output intermedio.

Convenzione:

- L’assistente inizia il proprio output con il token silenzioso esatto `NO_REPLY` /
  `no_reply` per indicare "non consegnare una risposta all’utente".
- OpenClaw lo rimuove/sopprime nel livello di consegna.
- La soppressione esatta del token silenzioso è case-insensitive, quindi `NO_REPLY` e
  `no_reply` contano entrambi quando l’intero payload è solo il token silenzioso.
- Questo è solo per veri turni in background/senza consegna; non è una scorciatoia per
  richieste utente ordinarie e attuabili.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming di bozze/digitazione** quando un
blocco parziale inizia con `NO_REPLY`, così le operazioni silenziose non perdono output
parziale a metà turno.

---

## "Flush della memoria" pre-compaction (implementato)

Obiettivo: prima che avvenga l’auto-compaction, eseguire un turno agentico silenzioso che scrive stato durevole
su disco (ad es. `memory/YYYY-MM-DD.md` nello spazio di lavoro dell’agente) così la compaction non possa
cancellare contesto critico.

OpenClaw usa l’approccio **flush pre-soglia**:

1. Monitora l’uso del contesto della sessione.
2. Quando supera una "soglia morbida" (sotto la soglia di compaction del runtime OpenClaw), esegui una direttiva silenziosa
   "scrivi memoria ora" verso l’agente.
3. Usa il token silenzioso esatto `NO_REPLY` / `no_reply` così l’utente non vede
   nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `model` (sovrascrittura opzionale esatta provider/modello per il turno di flush, per esempio `ollama/qwen3:8b`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema extra aggiunto per il turno di flush)

Note:

- Il prompt/prompt di sistema predefinito include un suggerimento `NO_REPLY` per sopprimere
  la consegna.
- Quando `model` è impostato, il turno di flush usa quel modello senza ereditare la
  catena di fallback della sessione attiva, così la manutenzione solo locale non ripiega silenziosamente
  su un modello di conversazione a pagamento.
- Il flush viene eseguito una volta per ciclo di compaction (tracciato in `sessions.json`).
- Il flush viene eseguito solo per sessioni OpenClaw incorporate (i backend CLI lo saltano).
- Il flush viene saltato quando lo spazio di lavoro della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memoria](/it/concepts/memory) per il layout dei file dello spazio di lavoro e i pattern di scrittura.

OpenClaw espone anche un hook `session_before_compact` nell’API dell’estensione, ma la logica di
flush di OpenClaw oggi vive lato Gateway.

---

## Checklist di risoluzione dei problemi

- Chiave di sessione errata? Inizia con [/concepts/session](/it/concepts/session) e conferma il `sessionKey` in `/status`.
- Disallineamento tra archivio e trascrizione? Conferma l’host Gateway e il percorso dell’archivio da `openclaw status`.
- Spam di compaction? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di compaction (`reserveTokens` troppo alto per la finestra del modello può causare compaction anticipata)
  - rigonfiamento dei risultati strumento: abilita/regola la potatura della sessione
- Turni silenziosi che perdono output? Conferma che la risposta inizi con `NO_REPLY` (token esatto case-insensitive) e che tu sia su una build che include la correzione di soppressione dello streaming.

## Correlati

- [Gestione della sessione](/it/concepts/session)
- [Potatura della sessione](/it/concepts/session-pruning)
- [Motore del contesto](/it/concepts/context-engine)
