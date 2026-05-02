---
read_when:
    - Devi eseguire il debug degli ID di sessione, del JSONL della trascrizione o dei campi di sessions.json
    - Stai modificando il comportamento dell’auto-Compaction o aggiungendo attività di manutenzione “pre-Compaction”
    - Vuoi implementare svuotamenti della memoria o turni di sistema silenziosi
summary: 'Approfondimento: store delle sessioni + trascrizioni, ciclo di vita e interni della Compaction automatica'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-05-02T08:33:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ca8a35210625051f5051e90a18a005d6103bc1d65d356c34f818d2bfc0058c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestisce le sessioni end-to-end in queste aree:

- **Routing delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Archivio sessioni** (`sessions.json`) e cosa traccia
- **Persistenza delle trascrizioni** (`*.jsonl`) e la sua struttura
- **Igiene delle trascrizioni** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti di contesto** (finestra di contesto rispetto ai token tracciati)
- **Compaction** (manuale e auto-compaction) e dove agganciare il lavoro pre-compaction
- **Manutenzione silenziosa** (scritture in memoria che non devono produrre output visibile all'utente)

Se vuoi prima una panoramica di livello più alto, inizia da:

- [Gestione delle sessioni](/it/concepts/session)
- [Compaction](/it/concepts/compaction)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca in memoria](/it/concepts/memory-search)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Igiene delle trascrizioni](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato attorno a un unico **processo Gateway** che possiede lo stato della sessione.

- Le UI (app macOS, Control UI web, TUI) devono interrogare il Gateway per gli elenchi delle sessioni e i conteggi dei token.
- In modalità remota, i file di sessione sono sull'host remoto; "controllare i file locali del Mac" non rifletterà ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw persiste le sessioni in due livelli:

1. **Archivio sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccola, modificabile, sicura da editare (o da cui eliminare voci)
   - Traccia i metadati della sessione (id sessione corrente, ultima attività, opzioni, contatori token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Memorizza la conversazione effettiva + chiamate agli strumenti + riepiloghi di compaction
   - Usata per ricostruire il contesto del modello nei turni futuri
   - I grandi checkpoint di debug pre-compaction vengono saltati una volta che la
     trascrizione attiva supera il limite di dimensione dei checkpoint, evitando una seconda enorme
     copia `.checkpoint.*.jsonl`.

I lettori della cronologia del Gateway devono evitare di materializzare l'intera trascrizione a meno che
la superficie non abbia esplicitamente bisogno di accesso storico arbitrario. Cronologia della prima pagina,
cronologia chat incorporata, ripristino al riavvio e controlli token/uso usano letture tail limitate.
Le scansioni complete delle trascrizioni passano attraverso l'indice asincrono delle trascrizioni, che viene
memorizzato in cache per percorso file più `mtimeMs`/`size` e condiviso tra lettori concorrenti.

---

## Posizioni su disco

Per agente, sull'host del Gateway:

- Archivio: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni di topic Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw li risolve tramite `src/config/sessions.ts`.

---

## Manutenzione dell'archivio e controlli disco

La persistenza delle sessioni ha controlli di manutenzione automatici (`session.maintenance`) per `sessions.json`, artefatti di trascrizione e sidecar di traiettoria:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: soglia di età per voci obsolete (predefinito `30d`)
- `maxEntries`: limite di voci in `sessions.json` (predefinito `500`)
- `resetArchiveRetention`: conservazione per gli archivi di trascrizione `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget opzionale della directory sessioni
- `highWaterBytes`: obiettivo opzionale dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Le scritture normali del Gateway raggruppano la pulizia `maxEntries` per limiti di dimensione da produzione, quindi un archivio può superare brevemente il limite configurato prima che la successiva pulizia high-water lo riscriva riducendolo. Le letture dell'archivio sessioni non potano né limitano le voci durante l'avvio del Gateway; usa scritture o `openclaw sessions cleanup --enforce` per la pulizia. `openclaw sessions cleanup --enforce` applica comunque subito il limite configurato.

La manutenzione mantiene puntatori durevoli a conversazioni esterne come sessioni di gruppo
e sessioni chat con ambito thread, ma le voci sintetiche di runtime per cron, hook,
Heartbeat, ACP e sub-agenti possono comunque essere rimosse quando superano il
budget configurato di età, conteggio o disco.

OpenClaw non crea più backup automatici a rotazione `sessions.json.bak.*` durante le scritture del Gateway. La chiave legacy `session.maintenance.rotateBytes` viene ignorata e `openclaw doctor --fix` la rimuove dalle configurazioni più vecchie.

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuovi prima gli artefatti più vecchi archiviati, di trascrizione orfani o di traiettoria orfani.
2. Se ancora sopra l'obiettivo, sfratta le voci di sessione più vecchie e i relativi file di trascrizione/traiettoria.
3. Continua finché l'uso è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala le possibili espulsioni ma non modifica l'archivio/i file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log delle esecuzioni

Anche le esecuzioni Cron isolate creano voci di sessione/trascrizioni e hanno controlli di conservazione dedicati:

- `cron.sessionRetention` (predefinito `24h`) pota le vecchie sessioni di esecuzione Cron isolate dall'archivio sessioni (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` potano i file `~/.openclaw/cron/runs/<jobId>.jsonl` (predefiniti: `2_000_000` byte e `2000` righe).

Quando Cron forza la creazione di una nuova sessione di esecuzione isolata, sanifica la precedente
voce di sessione `cron:<jobId>` prima di scrivere la nuova riga. Trasporta preferenze sicure
come impostazioni thinking/fast/verbose, etichette e override espliciti selezionati dall'utente
per modello/auth. Elimina il contesto di conversazione ambientale come routing canale/gruppo,
criteri di invio o accodamento, elevazione, origine e associazione di runtime ACP
così che una nuova esecuzione isolata non possa ereditare autorizzazioni di consegna o
runtime obsolete da un'esecuzione precedente.

---

## Chiavi di sessione (`sessionKey`)

Una `sessionKey` identifica _in quale contenitore di conversazione_ ti trovi (routing + isolamento).

Pattern comuni:

- Chat principale/diretta (per agente): `agent:<agentId>:<mainKey>` (predefinito `main`)
- Gruppo: `agent:<agentId>:<channel>:group:<id>`
- Stanza/canale (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (se non sottoposto a override)

Le regole canoniche sono documentate in [/concepts/session](/it/concepts/session).

---

## ID di sessione (`sessionId`)

Ogni `sessionKey` punta a una `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea una nuova `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito 4:00 AM ora locale sull'host del gateway) crea una nuova `sessionId` al messaggio successivo dopo il limite di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea una nuova `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando giornaliero + inattività sono entrambi configurati, vince quello che scade prima.
- **Eventi di sistema** (heartbeat, risvegli Cron, notifiche exec, bookkeeping del gateway) possono modificare la riga di sessione ma non estendono la freschezza del reset giornaliero/per inattività. Il rollover del reset scarta gli avvisi di eventi di sistema in coda per la sessione precedente prima che venga costruito il nuovo prompt.
- **Criterio di fork padre** usa il ramo attivo di Pi quando crea un thread o un fork di sub-agente. Se quel ramo è troppo grande, OpenClaw avvia il figlio con contesto isolato invece di fallire o ereditare cronologia inutilizzabile. Il criterio di dimensionamento è automatico; la configurazione legacy `session.parentForkMaxTokens` viene rimossa da `openclaw doctor --fix`.

Dettaglio implementativo: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dell'archivio sessioni (`sessions.json`)

Il tipo valore dell'archivio è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: id trascrizione corrente (il nome file deriva da questo a meno che `sessionFile` non sia impostato)
- `sessionStartedAt`: timestamp di inizio per la `sessionId` corrente; la freschezza del reset
  giornaliero usa questo. Le righe legacy possono derivarlo dall'header di sessione JSONL.
- `lastInteractionAt`: timestamp dell'ultima interazione reale utente/canale; la freschezza del reset
  per inattività usa questo, così heartbeat, Cron ed eventi exec non mantengono le sessioni
  attive. Le righe legacy senza questo campo ripiegano sull'ora di inizio sessione recuperata
  per la freschezza per inattività.
- `updatedAt`: timestamp dell'ultima modifica della riga dell'archivio, usato per elenchi, potatura e
  bookkeeping. Non è l'autorità per la freschezza del reset giornaliero/per inattività.
- `sessionFile`: override opzionale esplicito del percorso di trascrizione
- `chatType`: `direct | group | room` (aiuta le UI e il criterio di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per etichettatura di gruppi/canali
- Opzioni:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte l'auto-compaction è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush della memoria pre-compaction
- `memoryFlushCompactionCount`: conteggio compaction quando è stato eseguito l'ultimo flush

L'archivio è sicuro da modificare, ma il Gateway è l'autorità: può riscrivere o reidratare voci mentre le sessioni vengono eseguite.

---

## Struttura della trascrizione (`*.jsonl`)

Le trascrizioni sono gestite dal `SessionManager` di `@mariozechner/pi-coding-agent`.

Il file è JSONL:

- Prima riga: header di sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` opzionale)
- Poi: voci di sessione con `id` + `parentId` (albero)

Tipi di voce notevoli:

- `message`: messaggi utente/assistente/toolResult
- `custom_message`: messaggi iniettati dall'estensione che _entrano_ nel contesto del modello (possono essere nascosti dalla UI)
- `custom`: stato dell'estensione che _non_ entra nel contesto del modello
- `compaction`: riepilogo di compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito quando si naviga un ramo dell'albero

OpenClaw intenzionalmente **non** "corregge" le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto rispetto ai token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dell'archivio sessioni**: statistiche mobili scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto viene dal catalogo dei modelli (e può essere sottoposta a override tramite configurazione).
- `contextTokens` nell'archivio è un valore di stima/reporting di runtime; non trattarlo come garanzia rigorosa.

Per saperne di più, vedi [/token-use](/it/reference/token-use).

---

## Compaction: cos'è

Compaction riassume la conversazione più vecchia in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo la compaction, i turni futuri vedono:

- Il riepilogo di compaction
- I messaggi dopo `firstKeptEntryId`

Compaction è **persistente** (a differenza della potatura delle sessioni). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Limiti dei blocchi di Compaction e abbinamento degli strumenti

Quando OpenClaw suddivide una lunga trascrizione in blocchi di compaction, mantiene
le chiamate agli strumenti dell'assistente abbinate alle voci `toolResult` corrispondenti.

- Se la divisione per quota di token cade tra una chiamata strumento e il suo risultato, OpenClaw
  sposta il limite al messaggio di chiamata strumento dell'assistente invece di separare
  la coppia.
- Se un blocco finale di risultati strumento altrimenti spingerebbe il blocco oltre l'obiettivo,
  OpenClaw preserva quel blocco strumento in sospeso e mantiene intatta la coda
  non riassunta.
- I blocchi di chiamate strumento interrotti/con errore non mantengono aperta una divisione in sospeso.

---

## Quando avviene l'auto-compaction (runtime Pi)

Nell'agente Pi incorporato, l'auto-compaction si attiva in due casi:

1. **Ripristino da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili con forma specifica del provider) → Compaction → nuovo tentativo.
2. **Manutenzione della soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è il margine riservato per prompt + il prossimo output del modello

Queste sono semantiche di runtime di Pi (OpenClaw consuma gli eventi, ma Pi decide quando eseguire la Compaction).

OpenClaw può anche attivare una Compaction locale preliminare prima di aprire la run successiva
quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato e il
file di trascrizione attiva raggiunge quella dimensione. Questa è una protezione basata sulla dimensione del file per il costo
di riapertura locale, non archiviazione grezza: OpenClaw esegue comunque la normale Compaction semantica
e richiede `truncateAfterCompaction` in modo che il riepilogo compattato possa diventare una
nuova trascrizione successore.

Per le run Pi incorporate, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
aggiunge una protezione opzionale del loop degli strumenti. Dopo che il risultato di uno strumento viene aggiunto e prima della
chiamata successiva al modello, OpenClaw stima la pressione sul prompt usando la stessa logica di budget preliminare
usata all'inizio del turno. Se il contesto non rientra più, la protezione non esegue la Compaction dentro l'hook
`transformContext` di Pi. Solleva un segnale strutturato di precheck a metà turno,
interrompe l'invio del prompt corrente e lascia che il loop esterno della run usi il percorso di ripristino esistente:
troncare i risultati degli strumenti troppo grandi quando è sufficiente, oppure attivare la modalità di Compaction configurata e riprovare. L'opzione
è disabilitata per impostazione predefinita e funziona con entrambe le modalità di Compaction `default` e `safeguard`,
inclusa la Compaction safeguard supportata da provider.
Questo è indipendente da `maxActiveTranscriptBytes`: la protezione basata sulla dimensione in byte viene eseguita
prima dell'apertura di un turno, mentre il precheck a metà turno viene eseguito più tardi nel loop degli strumenti Pi incorporato
dopo che sono stati aggiunti nuovi risultati degli strumenti.

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

OpenClaw applica anche una soglia minima di sicurezza per le run incorporate:

- Se `compaction.reserveTokens < reserveTokensFloor`, OpenClaw la aumenta.
- La soglia minima predefinita è `20000` token.
- Imposta `agents.defaults.compaction.reserveTokensFloor: 0` per disabilitare la soglia minima.
- Se è già più alta, OpenClaw la lascia invariata.
- `/compact` manuale rispetta un `agents.defaults.compaction.keepRecentTokens` esplicito
  e mantiene il punto di taglio della coda recente di Pi. Senza un budget keep esplicito,
  la Compaction manuale rimane un checkpoint rigido e il contesto ricostruito parte dal
  nuovo riepilogo.
- Imposta `agents.defaults.compaction.midTurnPrecheck.enabled: true` per eseguire il
  precheck opzionale del loop degli strumenti dopo nuovi risultati degli strumenti e prima della chiamata successiva al modello.
  Questo è solo un trigger; la generazione del riepilogo usa comunque il percorso di
  Compaction configurato. È indipendente da `maxActiveTranscriptBytes`, che è una
  protezione all'inizio del turno basata sulla dimensione in byte della trascrizione attiva.
- Imposta `agents.defaults.compaction.maxActiveTranscriptBytes` su un valore in byte o
  una stringa come `"20mb"` per eseguire la Compaction locale prima di un turno quando la trascrizione attiva diventa grande.
  Questa protezione è attiva solo quando anche
  `truncateAfterCompaction` è abilitato. Lasciala non impostata o impostala a `0` per
  disabilitarla.
- Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato,
  OpenClaw ruota la trascrizione attiva in un JSONL successore compattato dopo la
  Compaction. La vecchia trascrizione completa rimane archiviata e collegata dal
  checkpoint di Compaction invece di essere riscritta sul posto.

Perché: lasciare abbastanza margine per le attività “di manutenzione” multi-turno (come le scritture in memoria) prima che la Compaction diventi inevitabile.

Implementazione: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(chiamata da `src/agents/pi-embedded-runner.ts`).

---

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction tramite `registerCompactionProvider()` sull'API del Plugin. Quando `agents.defaults.compaction.provider` è impostato su un id di provider registrato, il Plugin safeguard delega la riepilogazione a quel provider invece che alla pipeline integrata `summarizeInStages`.

- `provider`: id di un Plugin provider di Compaction registrato. Lascia non impostato per la riepilogazione LLM predefinita.
- Impostare un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di Compaction e la stessa policy di conservazione degli identificatori del percorso integrato.
- Il safeguard conserva comunque il contesto di suffisso dei turni recenti e dei turni divisi dopo l'output del provider.
- La riepilogazione safeguard integrata ridistilla i riepiloghi precedenti con i nuovi messaggi
  invece di conservare integralmente il riepilogo precedente.
- La modalità safeguard abilita per impostazione predefinita gli audit di qualità dei riepiloghi; imposta
  `qualityGuard.enabled: false` per saltare il comportamento di nuovo tentativo in caso di output malformato.
- Se il provider fallisce o restituisce un risultato vuoto, OpenClaw ripiega automaticamente sulla riepilogazione LLM integrata.
- I segnali di abort/timeout vengono rilanciati (non inghiottiti) per rispettare l'annullamento del chiamante.

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

OpenClaw supporta turni “silenziosi” per attività in background in cui l'utente non deve vedere output intermedi.

Convenzione:

- L'assistente inizia il proprio output con il token silenzioso esatto `NO_REPLY` /
  `no_reply` per indicare “non consegnare una risposta all'utente”.
- OpenClaw lo rimuove/sopprime nel livello di consegna.
- La soppressione del token silenzioso esatto non distingue maiuscole e minuscole, quindi `NO_REPLY` e
  `no_reply` valgono entrambi quando l'intero payload è solo il token silenzioso.
- Questo è solo per veri turni in background/senza consegna; non è una scorciatoia per
  normali richieste utente azionabili.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming di bozza/digitazione** quando un
chunk parziale inizia con `NO_REPLY`, così le operazioni silenziose non fanno trapelare output parziale
a metà turno.

---

## "Flush" della memoria pre-Compaction (implementato)

Obiettivo: prima che avvenga la Compaction automatica, eseguire un turno agentico silenzioso che scrive stato durevole
su disco (per es. `memory/YYYY-MM-DD.md` nello spazio di lavoro dell'agente) così la Compaction non può
cancellare contesto critico.

OpenClaw usa l'approccio **flush pre-soglia**:

1. Monitora l'uso del contesto della sessione.
2. Quando supera una “soglia soft” (sotto la soglia di Compaction di Pi), esegui una direttiva silenziosa
   “scrivi memoria ora” per l'agente.
3. Usa il token silenzioso esatto `NO_REPLY` / `no_reply` così l'utente non vede
   nulla.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `model` (override opzionale esatto provider/modello per il turno di flush, per esempio `ollama/qwen3:8b`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema extra aggiunto per il turno di flush)

Note:

- Il prompt/prompt di sistema predefinito include un suggerimento `NO_REPLY` per sopprimere
  la consegna.
- Quando `model` è impostato, il turno di flush usa quel modello senza ereditare la
  catena di fallback della sessione attiva, così la manutenzione solo locale non
  ripiega silenziosamente su un modello di conversazione a pagamento.
- Il flush viene eseguito una volta per ciclo di Compaction (tracciato in `sessions.json`).
- Il flush viene eseguito solo per sessioni Pi incorporate (i backend CLI lo saltano).
- Il flush viene saltato quando lo spazio di lavoro della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memoria](/it/concepts/memory) per il layout dei file dello spazio di lavoro e i pattern di scrittura.

Pi espone anche un hook `session_before_compact` nell'API del Plugin, ma oggi la logica di
flush di OpenClaw vive sul lato Gateway.

---

## Checklist di risoluzione dei problemi

- Chiave di sessione errata? Inizia da [/concepts/session](/it/concepts/session) e conferma il `sessionKey` in `/status`.
- Disallineamento tra store e trascrizione? Conferma l'host Gateway e il percorso dello store da `openclaw status`.
- Spam di Compaction? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di Compaction (`reserveTokens` troppo alto per la finestra del modello può causare Compaction anticipata)
  - eccesso nei risultati degli strumenti: abilita/regola la potatura della sessione
- Turni silenziosi che trapelano? Conferma che la risposta inizi con `NO_REPLY` (token esatto senza distinzione maiuscole/minuscole) e di usare una build che include la correzione della soppressione dello streaming.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Motore di contesto](/it/concepts/context-engine)
