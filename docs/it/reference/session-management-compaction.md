---
read_when:
    - Devi diagnosticare gli ID di sessione, il JSONL della trascrizione o i campi di sessions.json
    - Stai modificando il comportamento della Compaction automatica o aggiungendo attività di manutenzione “pre-Compaction”
    - Vuoi implementare svuotamenti della memoria o turni di sistema silenziosi
summary: 'Approfondimento: archivio delle sessioni + trascrizioni, ciclo di vita e meccanismi interni della Compaction (automatica)'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-04-30T16:30:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestisce le sessioni end-to-end in queste aree:

- **Instradamento delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Archivio delle sessioni** (`sessions.json`) e cosa traccia
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
- [Pulizia delle sessioni](/it/concepts/session-pruning)
- [Igiene delle trascrizioni](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato attorno a un singolo **processo Gateway** che possiede lo stato delle sessioni.

- Le UI (app macOS, Control UI web, TUI) devono interrogare il Gateway per gli elenchi delle sessioni e i conteggi dei token.
- In modalità remota, i file di sessione si trovano sull'host remoto; “controllare i file locali del tuo Mac” non rifletterà ciò che sta usando il Gateway.

---

## Due livelli di persistenza

OpenClaw persiste le sessioni su due livelli:

1. **Archivio delle sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccolo, mutabile, modificabile in sicurezza (o con voci eliminabili)
   - Traccia i metadati della sessione (id della sessione corrente, ultima attività, interruttori, contatori di token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Archivia la conversazione effettiva + chiamate di strumenti + riepiloghi di Compaction
   - Usata per ricostruire il contesto del modello per turni futuri
   - I checkpoint di debug grandi pre-compaction vengono saltati quando la trascrizione
     attiva supera il limite di dimensione dei checkpoint, evitando una seconda copia
     gigante `.checkpoint.*.jsonl`.

---

## Posizioni su disco

Per agente, sull'host Gateway:

- Archivio: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni di topic Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw risolve questi percorsi tramite `src/config/sessions.ts`.

---

## Manutenzione dell'archivio e controlli del disco

La persistenza delle sessioni ha controlli di manutenzione automatici (`session.maintenance`) per `sessions.json`, artefatti delle trascrizioni e sidecar delle traiettorie:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: soglia di età per voci obsolete (predefinito `30d`)
- `maxEntries`: limite di voci in `sessions.json` (predefinito `500`)
- `resetArchiveRetention`: conservazione per gli archivi di trascrizione `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget opzionale per la directory delle sessioni
- `highWaterBytes`: target opzionale dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Le normali scritture del Gateway raggruppano la pulizia `maxEntries` per limiti di dimensioni di produzione, quindi un archivio può superare brevemente il limite configurato prima che la successiva pulizia high-water lo riscriva riducendolo. `openclaw sessions cleanup --enforce` applica comunque immediatamente il limite configurato.

OpenClaw non crea più backup automatici a rotazione `sessions.json.bak.*` durante le scritture del Gateway. La chiave legacy `session.maintenance.rotateBytes` viene ignorata e `openclaw doctor --fix` la rimuove dalle configurazioni precedenti.

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuovi prima gli artefatti archiviati più vecchi, le trascrizioni orfane o gli artefatti di traiettoria orfani.
2. Se è ancora sopra il target, espelli le voci di sessione più vecchie e i relativi file di trascrizione/traiettoria.
3. Continua finché l'uso è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala le potenziali espulsioni ma non modifica l'archivio/i file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log di esecuzione

Anche le esecuzioni Cron isolate creano voci di sessione/trascrizioni e hanno controlli di conservazione dedicati:

- `cron.sessionRetention` (predefinito `24h`) elimina dall'archivio delle sessioni le vecchie sessioni di esecuzione Cron isolate (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` eliminano i file `~/.openclaw/cron/runs/<jobId>.jsonl` (predefiniti: `2_000_000` byte e `2000` righe).

Quando Cron forza la creazione di una nuova sessione di esecuzione isolata, sanitizza la precedente
voce di sessione `cron:<jobId>` prima di scrivere la nuova riga. Mantiene preferenze
sicure come impostazioni di ragionamento/velocità/verbosità, etichette e override espliciti
di modello/autenticazione selezionati dall'utente. Elimina il contesto ambientale della conversazione come
instradamento di canale/gruppo, policy di invio o coda, elevazione, origine e binding di runtime ACP
così che una nuova esecuzione isolata non possa ereditare delivery obsoleto o
autorità di runtime da un'esecuzione precedente.

---

## Chiavi di sessione (`sessionKey`)

Una `sessionKey` identifica _in quale bucket di conversazione_ ti trovi (instradamento + isolamento).

Pattern comuni:

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

- **Reset** (`/new`, `/reset`) crea un nuovo `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito 4:00 AM ora locale sull'host del Gateway) crea un nuovo `sessionId` al messaggio successivo dopo il limite di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando giornaliero + inattività sono entrambi configurati, vince quello che scade per primo.
- **Eventi di sistema** (heartbeat, risvegli Cron, notifiche exec, contabilità del Gateway) possono modificare la riga di sessione ma non estendono la freschezza del reset giornaliero/per inattività. Il rollover del reset scarta gli avvisi di eventi di sistema in coda per la sessione precedente prima che venga costruito il nuovo prompt.
- **Protezione fork del genitore del thread** (`session.parentForkMaxTokens`, predefinito `100000`) salta il fork della trascrizione genitore quando la sessione genitore è già troppo grande; il nuovo thread parte da zero. Imposta `0` per disabilitare.

Dettaglio implementativo: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dell'archivio delle sessioni (`sessions.json`)

Il tipo valore dell'archivio è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: id della trascrizione corrente (il nome del file deriva da questo salvo che `sessionFile` sia impostato)
- `sessionStartedAt`: timestamp di inizio per il `sessionId` corrente; la freschezza del reset giornaliero
  usa questo. Le righe legacy possono derivarlo dall'intestazione della sessione JSONL.
- `lastInteractionAt`: timestamp dell'ultima interazione reale utente/canale; la freschezza del reset per inattività
  usa questo così Heartbeat, Cron ed eventi exec non mantengono vive le sessioni. Le righe legacy senza questo campo
  ricadono sull'ora di inizio sessione recuperata per la freschezza per inattività.
- `updatedAt`: timestamp dell'ultima modifica della riga dell'archivio, usato per elenchi, pulizia e
  contabilità. Non è l'autorità per la freschezza del reset giornaliero/per inattività.
- `sessionFile`: override opzionale esplicito del percorso della trascrizione
- `chatType`: `direct | group | room` (aiuta le UI e la policy di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per etichettare gruppo/canale
- Interruttori:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori di token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte l'auto-compaction è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush della memoria pre-compaction
- `memoryFlushCompactionCount`: conteggio di Compaction quando è stato eseguito l'ultimo flush

L'archivio è modificabile in sicurezza, ma il Gateway è l'autorità: può riscrivere o reidratare voci mentre le sessioni sono in esecuzione.

---

## Struttura della trascrizione (`*.jsonl`)

Le trascrizioni sono gestite dal `SessionManager` di `@mariozechner/pi-coding-agent`.

Il file è JSONL:

- Prima riga: intestazione della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` opzionale)
- Poi: voci della sessione con `id` + `parentId` (albero)

Tipi di voce rilevanti:

- `message`: messaggi utente/assistente/toolResult
- `custom_message`: messaggi iniettati dall'estensione che _entrano_ nel contesto del modello (possono essere nascosti dalla UI)
- `custom`: stato dell'estensione che _non_ entra nel contesto del modello
- `compaction`: riepilogo di Compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito durante la navigazione di un ramo dell'albero

OpenClaw intenzionalmente **non** “corregge” le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto rispetto ai token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dell'archivio sessioni**: statistiche mobili scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto proviene dal catalogo dei modelli (e può essere sovrascritta tramite configurazione).
- `contextTokens` nell'archivio è un valore di stima/reportistica a runtime; non trattarlo come una garanzia rigorosa.

Per ulteriori dettagli, vedi [/token-use](/it/reference/token-use).

---

## Compaction: che cos'è

Compaction riepiloga la conversazione più vecchia in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo Compaction, i turni futuri vedono:

- Il riepilogo di Compaction
- I messaggi dopo `firstKeptEntryId`

Compaction è **persistente** (a differenza della pulizia delle sessioni). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Confini dei chunk di Compaction e abbinamento degli strumenti

Quando OpenClaw divide una trascrizione lunga in chunk di Compaction, mantiene
le chiamate di strumenti dell'assistente abbinate alle rispettive voci `toolResult`.

- Se la divisione per quota di token cade tra una chiamata di strumento e il suo risultato, OpenClaw
  sposta il confine sul messaggio di chiamata strumento dell'assistente invece di separare
  la coppia.
- Se un blocco finale di risultati strumento spingerebbe altrimenti il chunk oltre il target,
  OpenClaw preserva quel blocco strumento pendente e mantiene intatta la coda
  non riepilogata.
- I blocchi di chiamate strumento interrotti/con errore non mantengono aperta una divisione pendente.

---

## Quando avviene l'auto-compaction (runtime Pi)

Nell'agente Pi incorporato, l'auto-compaction si attiva in due casi:

1. **Recupero da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili nella forma dei provider) → compact → retry.
2. **Manutenzione a soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è lo spazio riservato per i prompt + il prossimo output del modello

Queste sono semantiche del runtime Pi (OpenClaw consuma gli eventi, ma Pi decide quando eseguire Compaction).

OpenClaw può anche attivare una Compaction locale preliminare prima di aprire la successiva
esecuzione quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato e il
file di trascrizione attivo raggiunge quella dimensione. Questa è una protezione basata sulla dimensione del file per il
costo di riapertura locale, non archiviazione grezza: OpenClaw esegue comunque la normale Compaction semantica,
e richiede `truncateAfterCompaction` così che il riepilogo compattato possa diventare una
nuova trascrizione successiva.

Per esecuzioni Pi integrate, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
aggiunge una protezione tool-loop opzionale. Dopo che il risultato di uno strumento viene aggiunto e prima della
successiva chiamata al modello, OpenClaw stima la pressione del prompt usando la stessa logica di budget preflight
usata all'inizio del turno. Se il contesto non rientra più, la protezione non esegue la Compaction dentro l'hook
`transformContext` di Pi. Genera un segnale strutturato di precheck a metà turno, interrompe l'invio del prompt corrente
e lascia che il ciclo di esecuzione esterno usi il percorso di recupero esistente: troncare i risultati degli strumenti sovradimensionati
quando basta, oppure attivare la modalità di Compaction configurata e riprovare. L'opzione è disabilitata per impostazione predefinita
e funziona sia con la modalità di Compaction `default` sia con `safeguard`, inclusa la Compaction safeguard supportata da provider.
Questo è indipendente da `maxActiveTranscriptBytes`: la protezione sulla dimensione in byte viene eseguita
prima che si apra un turno, mentre il precheck a metà turno viene eseguito più tardi nel tool loop Pi integrato
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

OpenClaw applica anche una soglia minima di sicurezza per le esecuzioni integrate:

- Se `compaction.reserveTokens < reserveTokensFloor`, OpenClaw la aumenta.
- La soglia minima predefinita è `20000` token.
- Imposta `agents.defaults.compaction.reserveTokensFloor: 0` per disabilitare la soglia minima.
- Se è già più alta, OpenClaw la lascia invariata.
- La `/compact` manuale rispetta un valore esplicito di `agents.defaults.compaction.keepRecentTokens`
  e conserva il punto di taglio della coda recente di Pi. Senza un budget di conservazione esplicito,
  la Compaction manuale resta un checkpoint rigido e il contesto ricostruito riparte dal
  nuovo riepilogo.
- Imposta `agents.defaults.compaction.midTurnPrecheck.enabled: true` per eseguire il
  precheck tool-loop opzionale dopo i nuovi risultati degli strumenti e prima della successiva chiamata al modello.
  Questo è solo un trigger; la generazione del riepilogo usa comunque il percorso di
  Compaction configurato. È indipendente da `maxActiveTranscriptBytes`, che è una
  protezione sulla dimensione in byte della trascrizione attiva all'inizio del turno.
- Imposta `agents.defaults.compaction.maxActiveTranscriptBytes` su un valore in byte o
  una stringa come `"20mb"` per eseguire la Compaction locale prima di un turno quando la trascrizione
  attiva diventa grande. Questa protezione è attiva solo quando è abilitato anche
  `truncateAfterCompaction`. Lascialo non impostato o impostalo a `0` per
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

I plugin possono registrare un provider di Compaction tramite `registerCompactionProvider()` nell'API del plugin. Quando `agents.defaults.compaction.provider` è impostato sull'id di un provider registrato, l'estensione safeguard delega il riepilogo a quel provider invece che alla pipeline integrata `summarizeInStages`.

- `provider`: id di un provider di Compaction registrato come plugin. Lascialo non impostato per il riepilogo LLM predefinito.
- Impostare un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di Compaction e la stessa policy di conservazione degli identificatori del percorso integrato.
- Il safeguard conserva comunque il contesto del suffisso dei turni recenti e dei turni divisi dopo l'output del provider.
- Il riepilogo safeguard integrato ridistilla i riepiloghi precedenti con i nuovi messaggi
  invece di conservare integralmente il riepilogo precedente.
- La modalità safeguard abilita per impostazione predefinita gli audit di qualità del riepilogo; imposta
  `qualityGuard.enabled: false` per saltare il comportamento di nuovo tentativo su output malformato.
- Se il provider non riesce o restituisce un risultato vuoto, OpenClaw ripiega automaticamente sul riepilogo LLM integrato.
- I segnali di annullamento/timeout vengono rilanciati (non assorbiti) per rispettare la cancellazione del chiamante.

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
  `no_reply` per indicare “non inviare una risposta all'utente”.
- OpenClaw lo rimuove/sopprime nel livello di consegna.
- La soppressione del token silenzioso esatto non distingue tra maiuscole e minuscole, quindi `NO_REPLY` e
  `no_reply` contano entrambi quando l'intero payload è solo il token silenzioso.
- Questo è solo per veri turni in background/senza consegna; non è una scorciatoia per
  normali richieste utente attuabili.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming di bozze/digitazione** quando un
chunk parziale inizia con `NO_REPLY`, così le operazioni silenziose non fanno trapelare output
parziale a metà turno.

---

## "Flush" della memoria pre-Compaction (implementato)

Obiettivo: prima che avvenga la Compaction automatica, eseguire un turno agentico silenzioso che scriva lo stato durevole
su disco (ad es. `memory/YYYY-MM-DD.md` nello spazio di lavoro dell'agente) così la Compaction non possa
cancellare contesto critico.

OpenClaw usa l'approccio del **flush pre-soglia**:

1. Monitora l'utilizzo del contesto della sessione.
2. Quando supera una “soglia morbida” (sotto la soglia di Compaction di Pi), esegue una direttiva silenziosa
   “scrivi la memoria ora” per l'agente.
3. Usa il token silenzioso esatto `NO_REPLY` / `no_reply` così l'utente non vede
   nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `model` (override opzionale esatto provider/modello per il turno di flush, per esempio `ollama/qwen3:8b`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema extra aggiunto per il turno di flush)

Note:

- Il prompt/prompt di sistema predefinito include un suggerimento `NO_REPLY` per sopprimere
  la consegna.
- Quando `model` è impostato, il turno di flush usa quel modello senza ereditare la
  catena di fallback della sessione attiva, così la manutenzione solo locale non ripiega silenziosamente
  su un modello conversazionale a pagamento.
- Il flush viene eseguito una volta per ciclo di Compaction (tracciato in `sessions.json`).
- Il flush viene eseguito solo per sessioni Pi integrate (i backend CLI lo saltano).
- Il flush viene saltato quando lo spazio di lavoro della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memoria](/it/concepts/memory) per il layout dei file dello spazio di lavoro e i pattern di scrittura.

Pi espone anche un hook `session_before_compact` nell'API dell'estensione, ma oggi la
logica di flush di OpenClaw vive sul lato Gateway.

---

## Checklist di risoluzione dei problemi

- Chiave di sessione errata? Parti da [/concepts/session](/it/concepts/session) e conferma la `sessionKey` in `/status`.
- Mancata corrispondenza tra store e trascrizione? Conferma l'host Gateway e il percorso dello store da `openclaw status`.
- Spam di Compaction? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di Compaction (`reserveTokens` troppo alto per la finestra del modello può causare una Compaction anticipata)
  - rigonfiamento dei risultati degli strumenti: abilita/regola la potatura della sessione
- Turni silenziosi che trapelano? Conferma che la risposta inizi con `NO_REPLY` (token esatto senza distinzione tra maiuscole e minuscole) e che tu stia usando una build che include la correzione della soppressione dello streaming.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura della sessione](/it/concepts/session-pruning)
- [Motore di contesto](/it/concepts/context-engine)
