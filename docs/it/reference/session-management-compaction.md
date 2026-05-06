---
read_when:
    - Devi eseguire il debug degli ID di sessione, del JSONL della trascrizione o dei campi di sessions.json
    - Stai modificando il comportamento della Compaction automatica o aggiungendo attività di manutenzione "pre-Compaction"
    - Vuoi implementare svuotamenti della memoria o turni di sistema silenziosi
summary: 'Approfondimento: archivio delle sessioni + trascrizioni, ciclo di vita e meccanismi interni di Compaction (automatica)'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-05-06T09:07:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestisce le sessioni end-to-end in queste aree:

- **Instradamento delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Archivio sessioni** (`sessions.json`) e cosa traccia
- **Persistenza della trascrizione** (`*.jsonl`) e la sua struttura
- **Igiene della trascrizione** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti di contesto** (finestra di contesto rispetto ai token tracciati)
- **Compaction** (manuale e auto-compaction) e dove collegare il lavoro pre-compaction
- **Manutenzione silenziosa** (scritture in memoria che non devono produrre output visibile all'utente)

Se vuoi prima una panoramica di livello più alto, inizia da:

- [Gestione delle sessioni](/it/concepts/session)
- [Compaction](/it/concepts/compaction)
- [Panoramica sulla memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Igiene della trascrizione](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato attorno a un singolo **processo Gateway** che possiede lo stato delle sessioni.

- Le UI (app macOS, Control UI web, TUI) devono interrogare il Gateway per elenchi di sessioni e conteggi dei token.
- In modalità remota, i file di sessione si trovano sull'host remoto; "controllare i file locali del Mac" non rifletterà ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw conserva le sessioni in due livelli:

1. **Archivio sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccolo, mutabile, sicuro da modificare (o da cui eliminare voci)
   - Tiene traccia dei metadati della sessione (id sessione corrente, ultima attività, toggle, contatori di token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Archivia la conversazione effettiva + chiamate agli strumenti + riepiloghi di compaction
   - Usata per ricostruire il contesto del modello per turni futuri
   - I checkpoint di debug pre-compaction di grandi dimensioni vengono saltati quando la trascrizione
     attiva supera il limite di dimensione del checkpoint, evitando una seconda copia gigante
     `.checkpoint.*.jsonl`.

I lettori della cronologia del Gateway devono evitare di materializzare l'intera trascrizione a meno che
la superficie non richieda esplicitamente accesso storico arbitrario. La cronologia della prima pagina,
la cronologia chat incorporata, il recupero dopo riavvio e i controlli token/utilizzo usano letture tail
limitate. Le scansioni complete della trascrizione passano attraverso l'indice asincrono della trascrizione, che viene
memorizzato nella cache per percorso file più `mtimeMs`/`size` e condiviso tra lettori concorrenti.

---

## Posizioni su disco

Per agente, sull'host del Gateway:

- Archivio: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni topic Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw risolve questi percorsi tramite `src/config/sessions.ts`.

---

## Manutenzione dell'archivio e controlli del disco

La persistenza delle sessioni ha controlli di manutenzione automatici (`session.maintenance`) per `sessions.json`, artefatti di trascrizione e sidecar delle traiettorie:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: soglia di età per voci obsolete (predefinito `30d`)
- `maxEntries`: limite di voci in `sessions.json` (predefinito `500`)
- `resetArchiveRetention`: conservazione per archivi di trascrizione `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget opzionale della directory sessioni
- `highWaterBytes`: obiettivo opzionale dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Le normali scritture del Gateway passano attraverso uno scrittore di sessione per archivio che serializza le mutazioni in-process senza acquisire un lock file a runtime. Gli helper di patch hot-path prendono in prestito la cache mutabile validata mentre mantengono quello slot di scrittura, quindi i file `sessions.json` grandi non vengono clonati o riletti per ogni aggiornamento di metadati. Il codice runtime deve preferire `updateSessionStore(...)` o `updateSessionStoreEntry(...)`; i salvataggi diretti dell'intero archivio sono strumenti di compatibilità e manutenzione offline. Quando un Gateway è raggiungibile, `openclaw sessions cleanup` e `openclaw agents delete` senza dry-run delegano le mutazioni dell'archivio al Gateway così la pulizia entra nella stessa coda di scrittura; `--store <path>` è il percorso esplicito di riparazione offline per la manutenzione diretta dei file. La pulizia di `maxEntries` è ancora raggruppata in batch per limiti di dimensione di produzione, quindi un archivio può superare brevemente il limite configurato prima che la successiva pulizia high-water lo riscriva riducendolo. Le letture dell'archivio sessioni non potano né limitano le voci durante l'avvio del Gateway; usa le scritture o `openclaw sessions cleanup --enforce` per la pulizia. `openclaw sessions cleanup --enforce` applica comunque immediatamente il limite configurato e pota vecchi artefatti non referenziati di trascrizione, checkpoint e traiettoria anche quando non è configurato alcun budget disco.

La manutenzione conserva puntatori durevoli a conversazioni esterne come sessioni di gruppo
e sessioni chat con ambito thread, ma le voci runtime sintetiche per Cron, hook,
Heartbeat, ACP e sotto-agenti possono comunque essere rimosse quando superano età,
conteggio o budget disco configurati.

OpenClaw non crea più backup automatici con rotazione `sessions.json.bak.*` durante le scritture del Gateway. La chiave legacy `session.maintenance.rotateBytes` viene ignorata e `openclaw doctor --fix` la rimuove dalle configurazioni meno recenti.

Le mutazioni della trascrizione usano un lock di scrittura sessione sul file di trascrizione. L'acquisizione del lock attende fino a
`session.writeLock.acquireTimeoutMs` prima di mostrare un errore di sessione occupata; il valore predefinito è `60000`
ms. Aumentalo solo quando lavoro legittimo di preparazione, pulizia, compaction o mirror della trascrizione contende
più a lungo su macchine lente. Il rilevamento di lock obsoleti e gli avvisi di durata massima restano criteri separati.

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuovi prima gli artefatti archiviati più vecchi, trascrizioni orfane o traiettorie orfane.
2. Se ancora sopra l'obiettivo, espelli le voci di sessione più vecchie e i relativi file di trascrizione/traiettoria.
3. Continua finché l'uso è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala potenziali espulsioni ma non modifica l'archivio/i file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log di esecuzione

Anche le esecuzioni Cron isolate creano voci di sessione/trascrizioni, e hanno controlli di conservazione dedicati:

- `cron.sessionRetention` (predefinito `24h`) pota le vecchie sessioni di esecuzione Cron isolate dall'archivio sessioni (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` potano i file `~/.openclaw/cron/runs/<jobId>.jsonl` (predefiniti: `2_000_000` byte e `2000` righe).

Quando Cron forza la creazione di una nuova sessione di esecuzione isolata, sanifica la voce di sessione precedente
`cron:<jobId>` prima di scrivere la nuova riga. Trasporta preferenze sicure
come impostazioni thinking/fast/verbose, etichette e override espliciti
di modello/auth selezionati dall'utente. Scarta il contesto di conversazione ambientale
come instradamento canale/gruppo, criteri di invio o coda, elevazione, origine e binding runtime
ACP, così una nuova esecuzione isolata non può ereditare una consegna obsoleta o
autorità runtime da un'esecuzione precedente.

---

## Chiavi di sessione (`sessionKey`)

Una `sessionKey` identifica _in quale contenitore di conversazione_ ti trovi (instradamento + isolamento).

Pattern comuni:

- Chat principale/diretta (per agente): `agent:<agentId>:<mainKey>` (predefinito `main`)
- Gruppo: `agent:<agentId>:<channel>:group:<id>`
- Stanza/canale (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a meno che non venga sovrascritto)

Le regole canoniche sono documentate in [/concepts/session](/it/concepts/session).

---

## ID sessione (`sessionId`)

Ogni `sessionKey` punta a una `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea una nuova `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito 4:00 AM ora locale sull'host del gateway) crea una nuova `sessionId` al messaggio successivo dopo il limite di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea una nuova `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando giornaliero + inattività sono entrambi configurati, vince quello che scade per primo.
- **Eventi di sistema** (Heartbeat, risvegli Cron, notifiche exec, contabilità gateway) possono modificare la riga di sessione ma non estendono la freschezza del reset giornaliero/per inattività. Il rollover del reset scarta gli avvisi di eventi di sistema in coda per la sessione precedente prima che venga costruito il prompt fresco.
- **Criterio di fork padre** usa il ramo attivo di PI quando crea un thread o un fork di sotto-agente. Se quel ramo è troppo grande, OpenClaw avvia il figlio con contesto isolato invece di fallire o ereditare una cronologia inutilizzabile. Il criterio di dimensionamento è automatico; la configurazione legacy `session.parentForkMaxTokens` viene rimossa da `openclaw doctor --fix`.

Dettaglio di implementazione: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dell'archivio sessioni (`sessions.json`)

Il tipo valore dell'archivio è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: id della trascrizione corrente (il nome file deriva da questo a meno che `sessionFile` non sia impostato)
- `sessionStartedAt`: timestamp di inizio per la `sessionId` corrente; la freschezza del reset giornaliero
  usa questo. Le righe legacy possono derivarlo dall'header di sessione JSONL.
- `lastInteractionAt`: timestamp dell'ultima interazione reale utente/canale; la freschezza del reset per inattività
  usa questo così Heartbeat, Cron ed eventi exec non mantengono vive le sessioni.
  Le righe legacy senza questo campo ricadono sull'ora di inizio sessione recuperata
  per la freschezza dell'inattività.
- `updatedAt`: timestamp dell'ultima mutazione della riga dell'archivio, usato per elenchi, potatura e
  contabilità. Non è l'autorità per la freschezza del reset giornaliero/per inattività.
- `sessionFile`: override opzionale esplicito del percorso della trascrizione
- `chatType`: `direct | group | room` (aiuta UI e criterio di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per etichettatura di gruppo/canale
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte l'auto-compaction è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush di memoria pre-compaction
- `memoryFlushCompactionCount`: conteggio di compaction quando l'ultimo flush è stato eseguito

L'archivio è sicuro da modificare, ma il Gateway è l'autorità: può riscrivere o reidratare voci mentre le sessioni sono in esecuzione.

---

## Struttura della trascrizione (`*.jsonl`)

Le trascrizioni sono gestite dal `SessionManager` di `@mariozechner/pi-coding-agent`.

Il file è JSONL:

- Prima riga: header di sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, opzionale `parentSession`)
- Poi: voci di sessione con `id` + `parentId` (albero)

Tipi di voce rilevanti:

- `message`: messaggi utente/assistente/toolResult
- `custom_message`: messaggi iniettati dall'estensione che _entrano_ nel contesto del modello (possono essere nascosti dalla UI)
- `custom`: stato dell'estensione che _non_ entra nel contesto del modello
- `compaction`: riepilogo di compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito quando si naviga in un ramo dell'albero

OpenClaw intenzionalmente **non** "corregge" le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto rispetto ai token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dell'archivio sessioni**: statistiche mobili scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto proviene dal catalogo modelli (e può essere sovrascritta tramite configurazione).
- `contextTokens` nell'archivio è un valore di stima/reporting runtime; non trattarlo come una garanzia rigorosa.

Per altro, vedi [/token-use](/it/reference/token-use).

---

## Compaction: che cos'è

Compaction riassume la conversazione più vecchia in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo la compaction, i turni futuri vedono:

- Il riepilogo di compaction
- I messaggi dopo `firstKeptEntryId`

Compaction è **persistente** (a differenza della potatura delle sessioni). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Confini dei chunk di Compaction e abbinamento degli strumenti

Quando OpenClaw suddivide una trascrizione lunga in chunk di Compaction, mantiene
le chiamate agli strumenti dell'assistente abbinate alle rispettive voci `toolResult`.

- Se la suddivisione per quota di token cade tra una chiamata allo strumento e il suo risultato, OpenClaw
  sposta il confine al messaggio di chiamata allo strumento dell'assistente invece di separare
  la coppia.
- Se un blocco finale di risultato dello strumento farebbe altrimenti superare al chunk l'obiettivo,
  OpenClaw preserva quel blocco di strumento in sospeso e mantiene intatta la coda
  non riassunta.
- I blocchi di chiamata allo strumento interrotti/con errore non mantengono aperta una suddivisione in sospeso.

---

## Quando avviene l'auto-Compaction (runtime di Pi)

Nell'agente Pi incorporato, l'auto-Compaction si attiva in due casi:

1. **Ripristino da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili nel formato del provider) → compatta → riprova.
2. **Manutenzione della soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è il margine riservato per i prompt + l'output successivo del modello

Queste sono semantiche del runtime di Pi (OpenClaw consuma gli eventi, ma Pi decide quando compattare).

OpenClaw può anche attivare una Compaction locale preliminare prima di aprire l'esecuzione successiva
quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato e il file
della trascrizione attiva raggiunge quella dimensione. Questa è una protezione basata sulla dimensione del file per il costo
di riapertura locale, non archiviazione grezza: OpenClaw esegue comunque la normale Compaction semantica
e richiede `truncateAfterCompaction` affinché il riepilogo compattato possa diventare una
nuova trascrizione successiva.

Per le esecuzioni Pi incorporate, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
aggiunge una protezione opt-in del ciclo degli strumenti. Dopo l'aggiunta di un risultato dello strumento e prima della
chiamata successiva al modello, OpenClaw stima la pressione sul prompt usando la stessa logica di budget
preliminare usata all'inizio del turno. Se il contesto non rientra più, la protezione
non compatta dentro l'hook `transformContext` di Pi. Genera un segnale strutturato
di precontrollo a metà turno, interrompe l'invio del prompt corrente e lascia che il
ciclo di esecuzione esterno usi il percorso di recupero esistente: troncare i risultati degli strumenti troppo grandi
quando basta, oppure attivare la modalità di Compaction configurata e riprovare. L'opzione
è disabilitata per impostazione predefinita e funziona sia con le modalità di Compaction `default` sia `safeguard`,
inclusa la Compaction safeguard supportata da provider.
Questo è indipendente da `maxActiveTranscriptBytes`: la protezione basata sulla dimensione in byte viene eseguita
prima dell'apertura di un turno, mentre il precontrollo a metà turno viene eseguito più tardi nel ciclo degli strumenti
di Pi incorporato dopo l'aggiunta dei nuovi risultati degli strumenti.

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
- Il comando manuale `/compact` rispetta un `agents.defaults.compaction.keepRecentTokens`
  esplicito e mantiene il punto di taglio della coda recente di Pi. Senza un budget di conservazione esplicito,
  la Compaction manuale rimane un checkpoint rigido e il contesto ricostruito parte dal
  nuovo riepilogo.
- Imposta `agents.defaults.compaction.midTurnPrecheck.enabled: true` per eseguire il
  precontrollo opzionale del ciclo degli strumenti dopo i nuovi risultati degli strumenti e prima della chiamata successiva
  al modello. Questo è solo un attivatore; la generazione del riepilogo usa comunque il percorso di Compaction
  configurato. È indipendente da `maxActiveTranscriptBytes`, che è una protezione
  basata sulla dimensione in byte della trascrizione attiva all'inizio del turno.
- Imposta `agents.defaults.compaction.maxActiveTranscriptBytes` su un valore in byte o su
  una stringa come `"20mb"` per eseguire la Compaction locale prima di un turno quando la trascrizione
  attiva diventa grande. Questa protezione è attiva solo quando è abilitato anche
  `truncateAfterCompaction`. Lasciala non impostata o impostala su `0` per
  disabilitarla.
- Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato,
  OpenClaw ruota la trascrizione attiva in un JSONL successore compattato dopo la
  Compaction. La vecchia trascrizione completa resta archiviata e collegata dal
  checkpoint di Compaction invece di essere riscritta sul posto.

Perché: lasciare margine sufficiente per le attività di "manutenzione" multi-turno (come le scritture in memoria) prima che la Compaction diventi inevitabile.

Implementazione: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(chiamato da `src/agents/pi-embedded-runner.ts`).

---

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction tramite `registerCompactionProvider()` sull'API del plugin. Quando `agents.defaults.compaction.provider` è impostato sull'id di un provider registrato, l'estensione safeguard delega il riepilogo a quel provider invece della pipeline integrata `summarizeInStages`.

- `provider`: id di un Plugin provider di Compaction registrato. Lascialo non impostato per il riepilogo LLM predefinito.
- Impostare un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di Compaction e la stessa politica di conservazione degli identificatori del percorso integrato.
- Il safeguard preserva comunque il contesto del suffisso dei turni recenti e dei turni suddivisi dopo l'output del provider.
- Il riepilogo safeguard integrato ridistilla i riepiloghi precedenti con nuovi messaggi
  invece di preservare alla lettera l'intero riepilogo precedente.
- La modalità safeguard abilita per impostazione predefinita gli audit di qualità dei riepiloghi; imposta
  `qualityGuard.enabled: false` per saltare il comportamento di riprova in caso di output malformato.
- Se il provider fallisce o restituisce un risultato vuoto, OpenClaw ripiega automaticamente sul riepilogo LLM integrato.
- I segnali di interruzione/timeout vengono rilanciati (non assorbiti) per rispettare l'annullamento del chiamante.

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

OpenClaw supporta turni "silenziosi" per attività in background in cui l'utente non deve vedere output intermedi.

Convenzione:

- L'assistente inizia il proprio output con il token silenzioso esatto `NO_REPLY` /
  `no_reply` per indicare "non consegnare una risposta all'utente".
- OpenClaw lo rimuove/sopprime nel livello di consegna.
- La soppressione del token silenzioso esatto non distingue tra maiuscole e minuscole, quindi `NO_REPLY` e
  `no_reply` contano entrambi quando l'intero payload è solo il token silenzioso.
- Questo serve solo per veri turni in background/senza consegna; non è una scorciatoia per
  normali richieste utente actionable.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming di bozza/digitazione** quando un
chunk parziale inizia con `NO_REPLY`, quindi le operazioni silenziose non fanno trapelare output
parziale a metà turno.

---

## "Flush della memoria" pre-Compaction (implementato)

Obiettivo: prima che avvenga l'auto-Compaction, eseguire un turno agentico silenzioso che scriva lo stato
duraturo su disco (ad esempio `memory/YYYY-MM-DD.md` nello spazio di lavoro dell'agente) così che la Compaction non possa
cancellare contesto critico.

OpenClaw usa l'approccio del **flush pre-soglia**:

1. Monitora l'utilizzo del contesto della sessione.
2. Quando supera una "soglia morbida" (sotto la soglia di Compaction di Pi), esegue una direttiva silenziosa
   "scrivi memoria ora" per l'agente.
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
  catena di fallback della sessione attiva, quindi la manutenzione solo locale non
  ripiega silenziosamente su un modello di conversazione a pagamento.
- Il flush viene eseguito una volta per ciclo di Compaction (tracciato in `sessions.json`).
- Il flush viene eseguito solo per le sessioni Pi incorporate (i backend CLI lo saltano).
- Il flush viene saltato quando lo spazio di lavoro della sessione è di sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memoria](/it/concepts/memory) per il layout dei file dello spazio di lavoro e i pattern di scrittura.

Pi espone anche un hook `session_before_compact` nell'API dell'estensione, ma oggi la logica di
flush di OpenClaw vive lato Gateway.

---

## Checklist per la risoluzione dei problemi

- Chiave di sessione errata? Inizia da [/concepts/session](/it/concepts/session) e conferma `sessionKey` in `/status`.
- Mancata corrispondenza tra store e trascrizione? Conferma l'host del Gateway e il percorso dello store da `openclaw status`.
- Spam di Compaction? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di Compaction (`reserveTokens` troppo alto per la finestra del modello può causare una Compaction anticipata)
  - rigonfiamento dei risultati degli strumenti: abilita/regola la potatura della sessione
- I turni silenziosi trapelano? Conferma che la risposta inizi con `NO_REPLY` (token esatto senza distinzione tra maiuscole e minuscole) e che tu stia usando una build che include la correzione della soppressione dello streaming.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Motore del contesto](/it/concepts/context-engine)
