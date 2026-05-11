---
read_when:
    - È necessario eseguire il debug degli ID di sessione, del JSONL della trascrizione o dei campi di sessions.json
    - Stai modificando il comportamento della Compaction automatica o aggiungendo attività di manutenzione "pre-Compaction"
    - Vuoi implementare svuotamenti della memoria o turni di sistema silenziosi
summary: 'Approfondimento: archivio delle sessioni + trascrizioni, ciclo di vita e dettagli interni della (auto)Compaction'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-05-11T20:35:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestisce le sessioni end-to-end in queste aree:

- **Routing delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Archivio delle sessioni** (`sessions.json`) e cosa traccia
- **Persistenza della trascrizione** (`*.jsonl`) e la sua struttura
- **Igiene della trascrizione** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti di contesto** (finestra di contesto vs token tracciati)
- **Compaction** (Compaction manuale e automatica) e dove agganciare il lavoro pre-Compaction
- **Manutenzione silenziosa** (scritture di memoria che non devono produrre output visibile all'utente)

Se vuoi prima una panoramica di livello superiore, inizia da:

- [Gestione delle sessioni](/it/concepts/session)
- [Compaction](/it/concepts/compaction)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca in memoria](/it/concepts/memory-search)
- [Pulizia delle sessioni](/it/concepts/session-pruning)
- [Igiene della trascrizione](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato attorno a un singolo **processo Gateway** che possiede lo stato delle sessioni.

- Le UI (app macOS, UI di controllo web, TUI) devono interrogare il Gateway per gli elenchi delle sessioni e i conteggi dei token.
- In modalità remota, i file di sessione si trovano sull'host remoto; "controllare i file locali del tuo Mac" non rifletterà ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw rende persistenti le sessioni su due livelli:

1. **Archivio delle sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccolo, mutabile, modificabile in sicurezza (o con voci eliminabili)
   - Traccia i metadati della sessione (id della sessione corrente, ultima attività, opzioni, contatori di token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione solo in append con struttura ad albero (le voci hanno `id` + `parentId`)
   - Archivia la conversazione effettiva + chiamate agli strumenti + riepiloghi di Compaction
   - Usata per ricostruire il contesto del modello nei turni futuri
   - I grandi checkpoint di debug pre-Compaction vengono saltati quando la trascrizione
     attiva supera il limite di dimensione dei checkpoint, evitando una seconda enorme
     copia `.checkpoint.*.jsonl`.

I lettori della cronologia del Gateway devono evitare di materializzare l'intera trascrizione, a meno che
la superficie non richieda esplicitamente accesso arbitrario alla cronologia. La cronologia della prima pagina,
la cronologia chat incorporata, il recupero dopo riavvio e i controlli token/uso usano letture di coda limitate.
Le scansioni complete delle trascrizioni passano attraverso l'indice asincrono delle trascrizioni, che viene
memorizzato in cache per percorso file più `mtimeMs`/`size` e condiviso tra lettori concorrenti.

---

## Posizioni su disco

Per agente, sull'host Gateway:

- Archivio: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni di argomento Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw le risolve tramite `src/config/sessions.ts`.

---

## Manutenzione dell'archivio e controlli disco

La persistenza delle sessioni ha controlli di manutenzione automatici (`session.maintenance`) per `sessions.json`, artefatti di trascrizione e sidecar di traiettoria:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: soglia di età per voci obsolete (predefinito `30d`)
- `maxEntries`: limite di voci in `sessions.json` (predefinito `500`)
- `resetArchiveRetention`: conservazione per archivi di trascrizione `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget opzionale della directory delle sessioni
- `highWaterBytes`: target opzionale dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Le scritture normali del Gateway passano attraverso uno scrittore di sessione per archivio che serializza le mutazioni in-process senza acquisire un lock file di runtime. Gli helper di patch nel percorso critico prendono in prestito la cache mutabile validata mentre mantengono quello slot di scrittura, quindi i file `sessions.json` grandi non vengono clonati o riletti per ogni aggiornamento di metadati. Il codice runtime dovrebbe preferire `updateSessionStore(...)` o `updateSessionStoreEntry(...)`; i salvataggi diretti dell'intero archivio sono strumenti di compatibilità e manutenzione offline. Quando un Gateway è raggiungibile, `openclaw sessions cleanup` e `openclaw agents delete` senza dry-run delegano le mutazioni dell'archivio al Gateway, così la pulizia entra nella stessa coda di scrittura; `--store <path>` è il percorso esplicito di riparazione offline per la manutenzione diretta dei file. La pulizia `maxEntries` è comunque eseguita in batch per limiti di dimensioni produttive, quindi un archivio può superare brevemente il limite configurato prima che la successiva pulizia high-water lo riscriva riducendolo. Le letture dell'archivio delle sessioni non potano né limitano le voci durante l'avvio del Gateway; usa le scritture o `openclaw sessions cleanup --enforce` per la pulizia. `openclaw sessions cleanup --enforce` applica comunque subito il limite configurato e pota vecchi artefatti di trascrizione, checkpoint e traiettoria non referenziati anche quando non è configurato alcun budget disco.

La manutenzione conserva puntatori durevoli a conversazioni esterne come sessioni di gruppo
e sessioni chat con ambito thread, ma le voci di runtime sintetiche per Cron, hook,
Heartbeat, ACP e sub-agenti possono comunque essere rimosse quando superano
l'età, il conteggio o il budget disco configurati.

OpenClaw non crea più backup automatici a rotazione `sessions.json.bak.*` durante le scritture del Gateway. La chiave legacy `session.maintenance.rotateBytes` viene ignorata e `openclaw doctor --fix` la rimuove dalle configurazioni più vecchie.

Le mutazioni della trascrizione usano un lock di scrittura della sessione sul file di trascrizione. L'acquisizione del lock attende fino a
`session.writeLock.acquireTimeoutMs` prima di mostrare un errore di sessione occupata; il valore predefinito è `60000`
ms. Aumentalo solo quando attività legittime di preparazione, pulizia, Compaction o mirror della trascrizione entrano in contesa
più a lungo su macchine lente. Il rilevamento di lock obsoleti e gli avvisi di durata massima restano criteri separati.

Ordine di enforcement per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuovi prima gli artefatti archiviati più vecchi, trascrizioni orfane o traiettorie orfane.
2. Se ancora sopra il target, espelli le voci di sessione più vecchie e i relativi file di trascrizione/traiettoria.
3. Continua finché l'uso non è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala le possibili espulsioni ma non modifica l'archivio/i file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log di esecuzione

Anche le esecuzioni Cron isolate creano voci di sessione/trascrizioni e hanno controlli di conservazione dedicati:

- `cron.sessionRetention` (predefinito `24h`) pota le vecchie sessioni di esecuzione Cron isolate dall'archivio delle sessioni (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` potano i file `~/.openclaw/cron/runs/<jobId>.jsonl` (predefiniti: `2_000_000` byte e `2000` righe).

Quando Cron forza la creazione di una nuova sessione di esecuzione isolata, sanifica la voce di sessione precedente
`cron:<jobId>` prima di scrivere la nuova riga. Mantiene preferenze sicure
come impostazioni di ragionamento/velocità/verbosità, etichette e override espliciti
di modello/auth selezionati dall'utente. Scarta il contesto ambientale della conversazione come
routing di canale/gruppo, policy di invio o coda, elevazione, origine e binding
runtime ACP, così una nuova esecuzione isolata non può ereditare autorizzazioni di consegna o
runtime obsolete da un'esecuzione più vecchia.

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

## ID di sessione (`sessionId`)

Ogni `sessionKey` punta a un `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea un nuovo `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito 4:00 AM ora locale sull'host Gateway) crea un nuovo `sessionId` al messaggio successivo dopo il limite di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando sono configurati sia giornaliero sia inattività, vince quello che scade per primo.
- **Eventi di sistema** (Heartbeat, risvegli Cron, notifiche exec, bookkeeping del Gateway) possono modificare la riga di sessione ma non estendono la freschezza del reset giornaliero/per inattività. Il rollover del reset scarta gli avvisi di eventi di sistema in coda per la sessione precedente prima che venga costruito il prompt fresco.
- **Policy di fork del genitore** usa il ramo attivo di PI quando crea un fork di thread o subagente. Se quel ramo è troppo grande, OpenClaw avvia il figlio con contesto isolato invece di fallire o ereditare cronologia inutilizzabile. La policy di dimensionamento è automatica; la configurazione legacy `session.parentForkMaxTokens` viene rimossa da `openclaw doctor --fix`.

Dettaglio di implementazione: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dell'archivio delle sessioni (`sessions.json`)

Il tipo di valore dell'archivio è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: id della trascrizione corrente (il nome file deriva da questo, a meno che `sessionFile` non sia impostato)
- `sessionStartedAt`: timestamp di inizio per il `sessionId` corrente; la freschezza del reset giornaliero
  usa questo. Le righe legacy possono derivarlo dall'header della sessione JSONL.
- `lastInteractionAt`: timestamp dell'ultima interazione reale utente/canale; la freschezza del reset per inattività
  usa questo, così Heartbeat, Cron ed eventi exec non mantengono vive le sessioni. Le righe legacy senza questo campo ricorrono all'ora di inizio sessione recuperata
  per la freschezza dell'inattività.
- `updatedAt`: timestamp dell'ultima mutazione della riga dell'archivio, usato per elenchi, pulizia e
  bookkeeping. Non è l'autorità per la freschezza del reset giornaliero/per inattività.
- `sessionFile`: override opzionale del percorso esplicito della trascrizione
- `chatType`: `direct | group | room` (aiuta UI e policy di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per etichettare gruppi/canali
- Opzioni:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori di token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte la Compaction automatica è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush della memoria pre-Compaction
- `memoryFlushCompactionCount`: conteggio Compaction quando è stato eseguito l'ultimo flush

L'archivio è modificabile in sicurezza, ma il Gateway è l'autorità: può riscrivere o reidratare le voci mentre le sessioni vengono eseguite.

---

## Struttura della trascrizione (`*.jsonl`)

Le trascrizioni sono gestite dal `SessionManager` di `@earendil-works/pi-coding-agent`.

Il file è JSONL:

- Prima riga: header della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` opzionale)
- Poi: voci di sessione con `id` + `parentId` (albero)

Tipi di voce rilevanti:

- `message`: messaggi utente/assistente/toolResult
- `custom_message`: messaggi iniettati dall'estensione che _entrano_ nel contesto del modello (possono essere nascosti dalla UI)
- `custom`: stato dell'estensione che _non_ entra nel contesto del modello
- `compaction`: riepilogo di Compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito quando si naviga un ramo dell'albero

OpenClaw intenzionalmente **non** "corregge" le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto vs token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dell'archivio delle sessioni**: statistiche mobili scritte in `sessions.json` (usate per /status e dashboard)

Se stai ottimizzando i limiti:

- La finestra di contesto arriva dal catalogo dei modelli (e può essere sovrascritta tramite configurazione).
- `contextTokens` nell'archivio è un valore runtime di stima/reporting; non trattarlo come una garanzia rigida.

Per approfondire, vedi [/token-use](/it/reference/token-use).

---

## Compaction: che cos'è

La Compaction riassume la conversazione più vecchia in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo la Compaction, i turni futuri vedono:

- Il riepilogo della Compaction
- I messaggi dopo `firstKeptEntryId`

Compaction è **persistente** (a differenza del pruning della sessione). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Limiti dei chunk di Compaction e abbinamento degli strumenti

Quando OpenClaw divide una trascrizione lunga in chunk di Compaction, mantiene
le chiamate agli strumenti dell'assistente abbinate alle rispettive voci `toolResult`.

- Se la divisione basata sulla quota di token cade tra una chiamata a uno strumento e il suo risultato, OpenClaw
  sposta il limite al messaggio di chiamata allo strumento dell'assistente invece di separare
  la coppia.
- Se un blocco finale di risultati dello strumento porterebbe altrimenti il chunk oltre il target,
  OpenClaw preserva quel blocco di strumenti in sospeso e mantiene intatta la coda
  non riassunta.
- I blocchi di chiamata a strumenti interrotti/con errore non mantengono aperta una divisione in sospeso.

---

## Quando avviene l'auto-Compaction (runtime Pi)

Nell'agente Pi integrato, l'auto-Compaction si attiva in due casi:

1. **Recupero da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili specifiche del provider) → compact → retry.
2. **Manutenzione della soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è il margine riservato per i prompt + il successivo output del modello

Queste sono semantiche del runtime Pi (OpenClaw consuma gli eventi, ma Pi decide quando eseguire la Compaction).

OpenClaw può anche attivare una Compaction locale preflight prima di aprire la prossima
esecuzione quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato e il
file della trascrizione attiva raggiunge quella dimensione. Questa è una protezione basata sulla dimensione del file per il costo di
riapertura locale, non un'archiviazione grezza: OpenClaw esegue comunque la normale Compaction semantica,
e richiede `truncateAfterCompaction` affinché il riepilogo compattato possa diventare una
nuova trascrizione successiva.

Per le esecuzioni Pi integrate, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
aggiunge una protezione opzionale nel ciclo degli strumenti. Dopo che un risultato dello strumento viene aggiunto e prima della
successiva chiamata al modello, OpenClaw stima la pressione sul prompt usando la stessa logica di budget preflight
usata all'inizio del turno. Se il contesto non rientra più, la protezione
non esegue la Compaction dentro l'hook `transformContext` di Pi. Solleva un segnale strutturato
di precheck a metà turno, interrompe l'invio del prompt corrente e consente al
ciclo di esecuzione esterno di usare il percorso di recupero esistente: troncare i risultati degli strumenti sovradimensionati
quando è sufficiente, oppure attivare la modalità di Compaction configurata e riprovare. L'opzione
è disabilitata per impostazione predefinita e funziona sia con la modalità di Compaction `default` sia con `safeguard`,
inclusa la Compaction safeguard supportata da provider.
Questo è indipendente da `maxActiveTranscriptBytes`: la protezione basata sulla dimensione in byte viene eseguita
prima dell'apertura di un turno, mentre il precheck a metà turno viene eseguito più tardi nel ciclo degli strumenti Pi integrato
dopo l'aggiunta di nuovi risultati degli strumenti.

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

OpenClaw applica anche un limite minimo di sicurezza per le esecuzioni integrate:

- Se `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo aumenta.
- Il limite minimo predefinito è `20000` token.
- Imposta `agents.defaults.compaction.reserveTokensFloor: 0` per disabilitare il limite minimo.
- Se è già più alto, OpenClaw lo lascia invariato.
- La Compaction manuale `/compact` rispetta un `agents.defaults.compaction.keepRecentTokens`
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
  `truncateAfterCompaction` è abilitato. Lascialo non impostato o imposta `0` per
  disabilitarla.
- Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato,
  OpenClaw ruota la trascrizione attiva in un JSONL successore compattato dopo la
  Compaction. La vecchia trascrizione completa resta archiviata e collegata dal
  checkpoint di Compaction invece di essere riscritta sul posto.

Motivo: lasciare abbastanza margine per le attività di "housekeeping" multi-turno (come le scritture in memoria) prima che la Compaction diventi inevitabile.

Implementazione: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(chiamato da `src/agents/pi-embedded-runner.ts`).

---

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction tramite `registerCompactionProvider()` sull'API del plugin. Quando `agents.defaults.compaction.provider` è impostato su un id di provider registrato, l'estensione safeguard delega il riepilogo a quel provider invece della pipeline integrata `summarizeInStages`.

- `provider`: id di un Plugin provider di Compaction registrato. Lascia non impostato per il riepilogo LLM predefinito.
- Impostare un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di Compaction e la stessa policy di preservazione degli identificatori del percorso integrato.
- Il safeguard preserva comunque il contesto del suffisso di turni recenti e turni divisi dopo l'output del provider.
- Il riepilogo safeguard integrato ridistilla i riepiloghi precedenti con i nuovi messaggi
  invece di preservare testualmente l'intero riepilogo precedente.
- La modalità safeguard abilita per impostazione predefinita gli audit della qualità del riepilogo; imposta
  `qualityGuard.enabled: false` per saltare il comportamento di retry in caso di output malformato.
- Se il provider fallisce o restituisce un risultato vuoto, OpenClaw torna automaticamente al riepilogo LLM integrato.
- I segnali di interruzione/timeout vengono rilanciati (non soppressi) per rispettare l'annullamento del chiamante.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfici visibili all'utente

Puoi osservare Compaction e stato della sessione tramite:

- `/status` (in qualsiasi sessione di chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Log del Gateway (`pnpm gateway:watch` o `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modalità dettagliata: `🧹 Auto-compaction complete` + conteggio delle Compaction

---

## Housekeeping silenzioso (`NO_REPLY`)

OpenClaw supporta turni "silenziosi" per attività in background in cui l'utente non deve vedere output intermedio.

Convenzione:

- L'assistente inizia il proprio output con il token silenzioso esatto `NO_REPLY` /
  `no_reply` per indicare "non consegnare una risposta all'utente".
- OpenClaw lo rimuove/sopprime nel livello di consegna.
- La soppressione del token silenzioso esatto non distingue tra maiuscole e minuscole, quindi `NO_REPLY` e
  `no_reply` contano entrambi quando l'intero payload è solo il token silenzioso.
- Questo è solo per veri turni in background/senza consegna; non è una scorciatoia per
  normali richieste utente azionabili.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming bozza/digitazione** quando un
chunk parziale inizia con `NO_REPLY`, così le operazioni silenziose non fanno trapelare output
parziale a metà turno.

---

## "Flush della memoria" pre-Compaction (implementato)

Obiettivo: prima che avvenga l'auto-Compaction, eseguire un turno agentico silenzioso che scrive lo stato durevole
su disco (ad esempio `memory/YYYY-MM-DD.md` nello spazio di lavoro dell'agente) così la Compaction non può
cancellare contesto critico.

OpenClaw usa l'approccio **flush pre-soglia**:

1. Monitora l'uso del contesto della sessione.
2. Quando supera una "soglia morbida" (sotto la soglia di Compaction di Pi), esegue una direttiva silenziosa
   "scrivi la memoria ora" per l'agente.
3. Usa il token silenzioso esatto `NO_REPLY` / `no_reply` così l'utente non vede
   nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `model` (override opzionale esatto provider/modello per il turno di flush, ad esempio `ollama/qwen3:8b`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema aggiuntivo appeso per il turno di flush)

Note:

- Il prompt/prompt di sistema predefinito include un suggerimento `NO_REPLY` per sopprimere
  la consegna.
- Quando `model` è impostato, il turno di flush usa quel modello senza ereditare la
  catena di fallback della sessione attiva, così l'housekeeping solo locale non ricade silenziosamente
  su un modello di conversazione a pagamento.
- Il flush viene eseguito una volta per ciclo di Compaction (tracciato in `sessions.json`).
- Il flush viene eseguito solo per le sessioni Pi integrate (i backend CLI lo saltano).
- Il flush viene saltato quando lo spazio di lavoro della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memoria](/it/concepts/memory) per il layout dei file dello spazio di lavoro e i pattern di scrittura.

Pi espone anche un hook `session_before_compact` nell'API dell'estensione, ma oggi la logica di
flush di OpenClaw vive sul lato Gateway.

---

## Checklist di risoluzione dei problemi

- Chiave di sessione errata? Inizia da [/concepts/session](/it/concepts/session) e conferma `sessionKey` in `/status`.
- Disallineamento tra store e trascrizione? Conferma l'host del Gateway e il percorso dello store da `openclaw status`.
- Spam di Compaction? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di Compaction (`reserveTokens` troppo alto per la finestra del modello può causare Compaction anticipata)
  - gonfiore dei risultati degli strumenti: abilita/regola il pruning della sessione
- Turni silenziosi che trapelano? Conferma che la risposta inizi con `NO_REPLY` (token esatto senza distinzione tra maiuscole/minuscole) e che tu stia usando una build che include la correzione della soppressione dello streaming.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Pruning della sessione](/it/concepts/session-pruning)
- [Motore di contesto](/it/concepts/context-engine)
