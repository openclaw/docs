---
read_when:
    - Devi eseguire il debug di ID sessione, JSONL dei transcript o campi di sessions.json
    - Stai modificando il comportamento della compattazione automatica o aggiungendo operazioni preliminari “pre-compaction”
    - Vuoi implementare flush della memoria o turni di sistema silenziosi
summary: 'Approfondimento: session store + transcript, ciclo di vita e dettagli interni della compattazione (automatica)'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-04-07T08:17:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gestione delle sessioni e compattazione (approfondimento)

Questo documento spiega come OpenClaw gestisce le sessioni end-to-end:

- **Instradamento delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Session store** (`sessions.json`) e cosa traccia
- **Persistenza dei transcript** (`*.jsonl`) e la loro struttura
- **Igiene dei transcript** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti del contesto** (finestra di contesto vs token tracciati)
- **Compattazione** (manuale + automatica) e dove agganciare il lavoro pre-compattazione
- **Operazioni silenziose** (ad esempio scritture in memoria che non devono produrre output visibile all'utente)

Se vuoi prima una panoramica di livello più alto, inizia da:

- [/concepts/session](/it/concepts/session)
- [/concepts/compaction](/it/concepts/compaction)
- [/concepts/memory](/it/concepts/memory)
- [/concepts/memory-search](/it/concepts/memory-search)
- [/concepts/session-pruning](/it/concepts/session-pruning)
- [/reference/transcript-hygiene](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato attorno a un singolo **processo Gateway** che possiede lo stato delle sessioni.

- Le UI (app macOS, web Control UI, TUI) dovrebbero interrogare il Gateway per gli elenchi delle sessioni e i conteggi dei token.
- In modalità remota, i file di sessione si trovano sull'host remoto; “controllare i file sul tuo Mac locale” non rifletterà ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw mantiene le sessioni in due livelli:

1. **Session store (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccolo, mutabile, sicuro da modificare (o da cui eliminare voci)
   - Traccia i metadati della sessione (ID sessione corrente, ultima attività, toggle, contatori di token, ecc.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Transcript append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Memorizza la conversazione effettiva + chiamate agli strumenti + riepiloghi di compattazione
   - Usato per ricostruire il contesto del modello per i turni futuri

---

## Posizioni su disco

Per agente, sull'host Gateway:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni di topic Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw li risolve tramite `src/config/sessions.ts`.

---

## Manutenzione dello store e controlli del disco

La persistenza delle sessioni ha controlli di manutenzione automatici (`session.maintenance`) per `sessions.json` e per gli artefatti dei transcript:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: soglia di età per le voci stale (predefinito `30d`)
- `maxEntries`: limite di voci in `sessions.json` (predefinito `500`)
- `rotateBytes`: ruota `sessions.json` quando è troppo grande (predefinito `10mb`)
- `resetArchiveRetention`: retention per gli archivi di transcript `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget facoltativo per la directory delle sessioni
- `highWaterBytes`: obiettivo facoltativo dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuovi prima gli artefatti di transcript archiviati o orfani più vecchi.
2. Se si è ancora sopra l'obiettivo, espelli le voci di sessione più vecchie e i relativi file transcript.
3. Continua finché l'uso non è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala le possibili espulsioni ma non modifica store/file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni cron e log di esecuzione

Anche le esecuzioni cron isolate creano voci/transcript di sessione e hanno controlli di retention dedicati:

- `cron.sessionRetention` (predefinito `24h`) elimina le vecchie sessioni di esecuzione cron isolate dal session store (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` potano i file `~/.openclaw/cron/runs/<jobId>.jsonl` (predefiniti: `2_000_000` byte e `2000` righe).

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

## ID sessione (`sessionId`)

Ogni `sessionKey` punta a un `sessionId` corrente (il file transcript che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea un nuovo `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito 4:00 AM ora locale sull'host gateway) crea un nuovo `sessionId` al messaggio successivo dopo il confine di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o il legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando sono configurati sia giornaliero sia inattività, vince quello che scade prima.
- **Protezione fork del parent thread** (`session.parentForkMaxTokens`, predefinito `100000`) salta il fork del transcript padre quando la sessione padre è già troppo grande; il nuovo thread inizia da zero. Imposta `0` per disabilitare.

Dettaglio di implementazione: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema del session store (`sessions.json`)

Il tipo valore dello store è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: ID transcript corrente (il nome file è derivato da questo salvo che sia impostato `sessionFile`)
- `updatedAt`: timestamp dell'ultima attività
- `sessionFile`: override facoltativo esplicito del percorso transcript
- `chatType`: `direct | group | room` (aiuta UI e policy di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per etichette di gruppi/canali
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori di token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte la compattazione automatica è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush di memoria pre-compattazione
- `memoryFlushCompactionCount`: conteggio di compattazione quando è stato eseguito l'ultimo flush

Lo store è sicuro da modificare, ma il Gateway è l'autorità: può riscrivere o reidratare le voci mentre le sessioni vengono eseguite.

---

## Struttura dei transcript (`*.jsonl`)

I transcript sono gestiti da `@mariozechner/pi-coding-agent` tramite `SessionManager`.

Il file è JSONL:

- Prima riga: header della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` facoltativo)
- Poi: voci della sessione con `id` + `parentId` (albero)

Tipi di voci notevoli:

- `message`: messaggi user/assistant/toolResult
- `custom_message`: messaggi iniettati dall'estensione che _entrano_ nel contesto del modello (possono essere nascosti dalla UI)
- `custom`: stato dell'estensione che _non_ entra nel contesto del modello
- `compaction`: riepilogo di compattazione persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito quando si naviga un ramo dell'albero

OpenClaw intenzionalmente **non** “corregge” i transcript; il Gateway usa `SessionManager` per leggerli/scriverli.

---

## Finestre di contesto vs token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori del session store**: statistiche progressive scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto proviene dal catalogo dei modelli (e può essere sovrascritta via configurazione).
- `contextTokens` nello store è un valore di stima/reporting a runtime; non trattarlo come una garanzia rigorosa.

Per ulteriori dettagli, vedi [/token-use](/it/reference/token-use).

---

## Compattazione: cos'è

La compattazione riassume la parte meno recente della conversazione in una voce `compaction` persistita nel transcript e mantiene intatti i messaggi recenti.

Dopo la compattazione, i turni futuri vedono:

- Il riepilogo di compattazione
- I messaggi successivi a `firstKeptEntryId`

La compattazione è **persistente** (a differenza del session pruning). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Confini dei chunk di compattazione e accoppiamento degli strumenti

Quando OpenClaw divide un transcript lungo in chunk di compattazione, mantiene
accoppiate le chiamate agli strumenti dell'assistente con le rispettive voci `toolResult`.

- Se la divisione per quota di token cade tra una chiamata a uno strumento e il suo risultato, OpenClaw
  sposta il confine al messaggio di chiamata allo strumento dell'assistente invece di separare
  la coppia.
- Se un blocco finale di risultati degli strumenti altrimenti spingerebbe il chunk oltre l'obiettivo,
  OpenClaw preserva quel blocco di strumenti in sospeso e mantiene intatta la coda non riassunta.
- I blocchi di chiamata agli strumenti interrotti/con errore non tengono aperta una divisione in sospeso.

---

## Quando avviene la compattazione automatica (runtime Pi)

Nell'agente Pi embedded, la compattazione automatica si attiva in due casi:

1. **Recupero da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili modellate sul provider) → compatta → ritenta.
2. **Manutenzione della soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è il margine riservato per prompt + output del modello successivo

Queste sono semantiche del runtime Pi (OpenClaw consuma gli eventi, ma è Pi a decidere quando compattare).

---

## Impostazioni della compattazione (`reserveTokens`, `keepRecentTokens`)

Le impostazioni di compattazione di Pi si trovano nelle impostazioni Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw applica anche una soglia minima di sicurezza per le esecuzioni embedded:

- Se `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo aumenta.
- Il valore minimo predefinito è `20000` token.
- Imposta `agents.defaults.compaction.reserveTokensFloor: 0` per disabilitare la soglia minima.
- Se è già più alto, OpenClaw lo lascia invariato.

Perché: lasciare sufficiente margine per operazioni di “manutenzione” multi-turno (come scritture in memoria) prima che la compattazione diventi inevitabile.

Implementazione: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(chiamata da `src/agents/pi-embedded-runner.ts`).

---

## Superfici visibili all'utente

Puoi osservare la compattazione e lo stato della sessione tramite:

- `/status` (in qualsiasi sessione chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modalità verbose: `🧹 Auto-compaction complete` + conteggio di compattazione

---

## Operazioni silenziose (`NO_REPLY`)

OpenClaw supporta turni “silenziosi” per attività in background in cui l'utente non deve vedere output intermedio.

Convenzione:

- L'assistente inizia il proprio output con l'esatto token silenzioso `NO_REPLY` /
  `no_reply` per indicare “non inviare una risposta all'utente”.
- OpenClaw lo rimuove/sopprime nel livello di delivery.
- La soppressione del token silenzioso esatto non distingue tra maiuscole e minuscole, quindi `NO_REPLY` e
  `no_reply` valgono entrambi quando l'intero payload è solo il token silenzioso.
- Questo è solo per veri turni in background/senza delivery; non è una scorciatoia per
  normali richieste utente che richiedono azione.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming di draft/typing** quando un
chunk parziale inizia con `NO_REPLY`, così le operazioni silenziose non lasciano trapelare output parziale a metà turno.

---

## "Memory flush" pre-compattazione (implementato)

Obiettivo: prima che avvenga la compattazione automatica, eseguire un turno agentico silenzioso che scriva stato durevole
su disco (ad esempio `memory/YYYY-MM-DD.md` nel workspace dell'agente) in modo che la compattazione non possa
cancellare il contesto critico.

OpenClaw usa l'approccio di **flush pre-soglia**:

1. Monitora l'uso del contesto della sessione.
2. Quando supera una “soglia morbida” (al di sotto della soglia di compattazione di Pi), esegui una direttiva silenziosa
   “scrivi la memoria ora” verso l'agente.
3. Usa l'esatto token silenzioso `NO_REPLY` / `no_reply` in modo che l'utente non veda
   nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema aggiuntivo accodato per il turno di flush)

Note:

- Il prompt/system prompt predefinito include un suggerimento `NO_REPLY` per sopprimere
  il delivery.
- Il flush viene eseguito una volta per ciclo di compattazione (tracciato in `sessions.json`).
- Il flush viene eseguito solo per le sessioni Pi embedded (i backend CLI lo saltano).
- Il flush viene saltato quando il workspace della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memory](/it/concepts/memory) per il layout dei file del workspace e i pattern di scrittura.

Pi espone anche un hook `session_before_compact` nell'extension API, ma oggi la logica di
flush di OpenClaw vive sul lato Gateway.

---

## Checklist per la risoluzione dei problemi

- Chiave di sessione errata? Inizia da [/concepts/session](/it/concepts/session) e conferma la `sessionKey` in `/status`.
- Mancata corrispondenza tra store e transcript? Conferma l'host Gateway e il percorso dello store da `openclaw status`.
- Compattazione eccessiva? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di compattazione (`reserveTokens` troppo alto rispetto alla finestra del modello può causare una compattazione anticipata)
  - crescita eccessiva dei risultati degli strumenti: abilita/regola il session pruning
- Perdite nei turni silenziosi? Conferma che la risposta inizi con `NO_REPLY` (token esatto case-insensitive) e che tu stia usando una build che include la correzione della soppressione dello streaming.
