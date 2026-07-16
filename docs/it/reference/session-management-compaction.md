---
read_when:
    - È necessario eseguire il debug degli ID di sessione, degli eventi della trascrizione o dei campi delle righe di sessione
    - Si sta modificando il comportamento della Compaction automatica o aggiungendo operazioni di manutenzione «pre-Compaction»
    - Si desidera implementare lo scaricamento della memoria o turni di sistema silenziosi
summary: 'Analisi approfondita: archivio delle sessioni e trascrizioni, ciclo di vita e meccanismi interni della Compaction (automatica)'
title: Analisi approfondita della gestione delle sessioni
x-i18n:
    generated_at: "2026-07-16T14:58:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Un singolo **processo Gateway** gestisce lo stato delle sessioni end-to-end. Le interfacce utente (app macOS, Control UI web, TUI) interrogano il Gateway per ottenere gli elenchi delle sessioni e i conteggi dei token. In modalità remota, i file delle sessioni risiedono sull'host remoto, quindi controllare i file del Mac locale non rifletterà ciò che il Gateway sta utilizzando.

Consultare prima la documentazione generale: [Gestione delle sessioni](/it/concepts/session), [Compaction](/it/concepts/compaction), [Panoramica della memoria](/it/concepts/memory), [Ricerca nella memoria](/it/concepts/memory-search), [Eliminazione delle sessioni](/it/concepts/session-pruning), [Igiene delle trascrizioni](/it/reference/transcript-hygiene), riferimento completo alla configurazione in [Configurazione degli agenti](/it/gateway/config-agents).

## Due livelli di persistenza

1. **Righe delle sessioni (SQLite per agente)** - mappa chiave/valore `sessionKey -> SessionEntry`. Stato di runtime modificabile gestito dal Gateway. Tiene traccia dei metadati: ID della sessione corrente, ultima attività, opzioni, contatori dei token.
2. **Eventi della trascrizione (SQLite per agente)** - struttura ad albero di sola aggiunta (le voci hanno `id` + `parentId`). Memorizza la conversazione, le chiamate agli strumenti e i riepiloghi di Compaction; ricostruisce il contesto del modello per i turni futuri. I checkpoint di Compaction sono metadati della trascrizione successiva sottoposta a Compaction: una nuova Compaction non scrive una seconda copia di `.checkpoint.*.jsonl`.

Le installazioni meno recenti potrebbero ancora contenere file `sessions.json` nella directory `sessions/`
dell'agente. Tali file devono essere considerati input legacy per la migrazione delle righe delle sessioni o destinazioni esplicite
per la manutenzione offline. L'avvio del Gateway e `openclaw doctor --fix` importano
automaticamente le righe legacy attive e la cronologia delle trascrizioni nell'archivio SQLite per agente.
Eseguire `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`, quindi seguire la [sequenza di migrazione di
Doctor](/it/cli/doctor#session-sqlite-migration), quando sono necessarie verifiche
esplicite o prove di convalida. Se una migrazione non riesce dopo l'archiviazione
degli artefatti legacy delle trascrizioni, utilizzare la modalità di ripristino di Doctor descritta in tale sequenza.
Il ripristino utilizza i manifest di migrazione, ripristina soltanto gli artefatti di supporto
archiviati interessati, prepara su richiesta una segnalazione GitHub sanificata e non
fa sì che il runtime attivo legga nuovamente i file JSONL.

I lettori della cronologia del Gateway evitano di materializzare l'intera trascrizione, a meno che la superficie non richieda un accesso arbitrario alla cronologia. La cronologia della prima pagina, la cronologia chat incorporata, il ripristino dopo il riavvio e i controlli di token/utilizzo impiegano letture limitate della coda da SQLite. Le scansioni complete delle trascrizioni passano attraverso l'indice asincrono delle trascrizioni e sono condivise tra i lettori simultanei.

## Posizioni su disco

Per ogni agente, sull'host del Gateway (risolte tramite `src/config/sessions.ts`):

- Archivio delle righe delle sessioni di runtime: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Righe delle trascrizioni di runtime: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Artefatti legacy/archiviati delle trascrizioni: `~/.openclaw/agents/<agentId>/sessions/`
- Input legacy per la migrazione delle righe: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Manutenzione dell'archivio e controlli del disco

`session.maintenance` controlla la manutenzione automatica delle righe delle sessioni SQLite, delle righe delle trascrizioni SQLite, degli artefatti di archivio e dei file complementari delle traiettorie:

| Chiave                  | Valore predefinito     | Note                                                                                        |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | oppure `"warn"` (solo resoconto, nessuna modifica)                                         |
| `pruneAfter`            | `"30d"`               | soglia di età delle voci obsolete                                                           |
| `maxEntries`            | `500`                 | limite massimo delle voci di sessione                                                       |
| `resetArchiveRetention` | conserva (nessuna soglia di età) | soglia di età degli archivi delle trascrizioni `*.reset.*`/`*.deleted.*`; una durata abilita l'eliminazione |
| `maxDiskBytes`          | `2gb`                 | budget su disco delle sessioni per agente; `false` lo disabilita                            |
| `highWaterBytes`        | 80% di `maxDiskBytes` | obiettivo dopo la pulizia per rispettare il budget                                          |

Le trascrizioni archiviate vengono conservate per impostazione predefinita e compresse con zstd (`*.jsonl.<reason>.<timestamp>.zst`) quando il runtime lo supporta, così l'eliminazione o la reimpostazione di una sessione non scarta mai silenziosamente la cronologia della conversazione. Il budget su disco rimuove prima gli archivi meno recenti, prima di intervenire sulle sessioni attive.

L'applicazione attiva di `maxDiskBytes` in SQLite misura, per ogni sessione, i byte del JSON delle righe delle sessioni più quelli del JSON degli eventi delle trascrizioni; l'applicazione durante la manutenzione offline legacy misura i file nella directory delle sessioni selezionata.

Le sessioni di verifica dell'esecuzione del modello del Gateway (chiavi corrispondenti a `agent:*:explicit:model-run-<uuid>`) hanno una conservazione `24h` separata e fissa. Questa eliminazione è subordinata alla pressione: viene eseguita soltanto quando si raggiunge la pressione dovuta alla manutenzione o al limite delle voci di sessione, e soltanto prima del passaggio globale di pulizia o limitazione delle voci obsolete. Le altre sessioni esplicite non utilizzano questa conservazione.

Ordine di applicazione per la pulizia del budget su disco (`mode: "enforce"`):

1. Rimuovere prima gli artefatti archiviati delle trascrizioni meno recenti, gli artefatti legacy orfani o gli artefatti delle traiettorie orfani.
2. Se l'utilizzo supera ancora l'obiettivo, rimuovere le voci di sessione meno recenti e le relative righe delle trascrizioni o gli artefatti delle traiettorie.
3. Ripetere finché l'utilizzo non è pari o inferiore a `highWaterBytes`.

`mode: "warn"` segnala le possibili rimozioni senza modificare l'archivio o i file.

Eseguire la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

La manutenzione conserva i riferimenti durevoli alle conversazioni esterne, come le sessioni di gruppo e le sessioni chat circoscritte ai thread, ma le voci di runtime sintetiche (Cron, hook, Heartbeat, ACP, agenti secondari) possono comunque essere rimosse quando superano l'età, il numero o il budget su disco configurati. Le esecuzioni Cron isolate utilizzano un controllo `cron.sessionRetention` separato, indipendente dalla conservazione delle verifiche dell'esecuzione del modello.

Le normali scritture del Gateway passano attraverso l'accessor delle sessioni, che serializza le modifiche SQLite per agente tramite il percorso di scrittura del runtime. Il codice di runtime dovrebbe preferire le funzioni di supporto dell'accessor in `src/config/sessions/session-accessor.ts`; le funzioni di supporto legacy `sessions.json` sono strumenti di migrazione e manutenzione offline. Quando è possibile raggiungere un Gateway, `openclaw sessions cleanup` e `openclaw agents delete` senza simulazione delegano al Gateway le modifiche dell'archivio, in modo che la pulizia utilizzi la stessa coda di scrittura; `--store <path>` è il percorso esplicito di riparazione offline per un archivio legacy selezionato e rimane sempre locale, così come `--dry-run`. La pulizia `maxEntries` viene eseguita in batch per gli archivi delle dimensioni tipiche di produzione, quindi un archivio può superare brevemente il limite configurato prima che la successiva pulizia al raggiungimento della soglia superiore lo riporti al di sotto. Durante l'avvio del Gateway, le letture non eliminano né limitano mai le voci: lo fanno soltanto le scritture o `openclaw sessions cleanup --enforce`; quest'ultimo applica inoltre immediatamente il limite ed elimina i vecchi artefatti legacy non referenziati di trascrizioni, checkpoint e traiettorie, anche se non è configurato alcun budget su disco.

OpenClaw non crea più automaticamente backup di rotazione `sessions.json.bak.*` durante le scritture del Gateway. Lo schema corrente rifiuta la chiave legacy `session.maintenance.rotateBytes` e `openclaw doctor --fix` la rimuove dalle configurazioni meno recenti.

Le modifiche delle trascrizioni utilizzano la coda di scrittura delle sessioni per la destinazione SQLite delle trascrizioni:

| Impostazione                         | Valore predefinito | Sostituzione tramite variabile d'ambiente       |
| ------------------------------------ | ------------------ | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` indica per quanto tempo l'attesa del blocco genera un errore di sessione occupata prima di rinunciare; aumentarlo soltanto quando operazioni legittime di preparazione, pulizia, Compaction o duplicazione della trascrizione mantengono il blocco più a lungo su macchine lente. `staleMs` indica quando un blocco esistente può essere recuperato perché obsoleto. `maxHoldMs` è la soglia di rilascio del watchdog interno al processo.

### Downgrade dopo il passaggio a SQLite

Ripristinare gli artefatti legacy archiviati delle trascrizioni prima di eseguire una versione meno recente
di OpenClaw basata su file:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

La migrazione lascia in posizione i file legacy `sessions.json` per assistenza e
rollback, ma i file JSONL attivi delle trascrizioni importati in SQLite vengono
rinominati in `session-sqlite-import-archive/`. I runtime meno recenti basati su file seguono
i percorsi `sessionFile` in `sessions.json`, quindi tali artefatti devono essere ripristinati
prima dell'avvio. Il ripristino utilizza i manifest di migrazione, sposta soltanto gli artefatti
archiviati registrati i cui percorsi originali risultano mancanti e lascia il database SQLite
in posizione per il successivo ripristino.

Le sessioni create dopo il passaggio a SQLite esistono soltanto in SQLite e non saranno visibili a un
runtime meno recente basato su file. Se si esegue nuovamente l'aggiornamento dopo un downgrade, ripetere la sequenza
di verifica e convalida di Doctor affinché OpenClaw possa verificare gli artefatti legacy
ripristinati prima dell'importazione.

## Sessioni Cron e registri delle esecuzioni

Le esecuzioni Cron isolate creano voci di sessione e trascrizioni proprie con una conservazione dedicata:

- `cron.sessionRetention` (valore predefinito `"24h"`) elimina dall'archivio le vecchie sessioni delle esecuzioni Cron isolate; `false` disabilita questa funzione.
- La cronologia delle esecuzioni conserva le 2000 righe terminali più recenti per ogni processo Cron. Le righe perse mantengono la propria finestra di pulizia di 24 ore.

Quando Cron forza la creazione di una nuova sessione di esecuzione isolata, sanifica la precedente voce di sessione `cron:<jobId>` prima di scrivere la nuova riga: conserva le preferenze sicure (impostazioni di pensiero/modalità rapida/verbosità/ragionamento, etichette, nome visualizzato) e le sostituzioni di modello/autenticazione selezionate esplicitamente dall'utente, ma elimina il contesto ambientale della conversazione (instradamento di canale/gruppo, criteri di invio/coda, elevazione, origine, associazione al runtime ACP), in modo che una nuova esecuzione isolata non possa ereditare autorizzazioni di consegna o di runtime obsolete da un'esecuzione precedente.

## Chiavi delle sessioni (`sessionKey`)

Una `sessionKey` identifica il contenitore della conversazione in uso (instradamento + isolamento). Regole canoniche: [/concepts/session](/it/concepts/session).

| Modello                      | Esempio                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| Chat principale/diretta (per agente) | `agent:<agentId>:<mainKey>` (valore predefinito `main`)                |
| Gruppo                       | `agent:<agentId>:<channel>:group:<id>`                      |
| Stanza/canale (Discord/Slack) | `agent:<agentId>:<channel>:channel:<id>` oppure `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (salvo sostituzione)                           |

## ID delle sessioni (`sessionId`)

Ogni `sessionKey` punta a un `sessionId` corrente (l'identità della trascrizione SQLite che prosegue la conversazione). La logica decisionale si trova in `initSessionState()` in `src/auto-reply/reply/session.ts`.

- **Reimpostazione** (`/new`, `/reset`) crea un nuovo `sessionId` per tale `sessionKey`.
- **Reimpostazione giornaliera** (impostazione predefinita: 4:00 AM, ora locale dell'host del Gateway) crea un nuovo `sessionId` al primo messaggio successivo alla soglia di reimpostazione.
- **Scadenza per inattività** (`session.reset.idleMinutes` o il valore legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Se sono configurate sia la scadenza giornaliera sia quella per inattività, prevale quella che si verifica per prima.
- **Ripresa alla riconnessione dell'interfaccia di controllo** conserva la sessione attualmente visibile per un invio dopo la riconnessione quando il Gateway riceve il `sessionId` corrispondente da un client dell'interfaccia operatore. È un segnale monouso; i normali invii obsoleti continuano a creare un nuovo `sessionId`.
- **Eventi di sistema** (Heartbeat, riattivazioni Cron, notifiche di esecuzione, operazioni contabili del Gateway) possono modificare la riga della sessione, ma non prolungano mai la validità della reimpostazione giornaliera/per inattività. Il passaggio a una nuova sessione dopo la reimpostazione elimina le notifiche degli eventi di sistema accodate per la sessione precedente prima di creare il nuovo prompt.
- **Criterio di fork del genitore** usa il ramo attivo di OpenClaw quando crea il fork di un thread o di un sottoagente. Se tale ramo è troppo grande (oltre un limite interno fisso, attualmente 100K token), OpenClaw avvia il figlio con un contesto isolato anziché non riuscire o ereditare una cronologia inutilizzabile. Il dimensionamento è automatico e non configurabile; la configurazione legacy `session.parentForkMaxTokens` viene rimossa da `openclaw doctor --fix`.
- **Fork dell'operatore**: `sessions.create { parentSessionKey, fork: true }` crea una nuova sessione la cui trascrizione si dirama dallo stato corrente del genitore (lo stesso meccanismo di fork usato per generare i sottoagenti, incluso il limite dimensionale descritto sopra). Il fork viene rifiutato mentre il genitore ha un'esecuzione attiva, eredita la selezione del modello del genitore a meno che non ne venga passata esplicitamente una e contrassegna il figlio come `forkedFromParent` con contatori dei token azzerati.

## Schema dell'archivio delle sessioni

L'archivio di runtime conserva i valori `SessionEntry` in SQLite per agente. Il tipo del valore è `SessionEntry` in `src/config/sessions.ts`. Campi principali (elenco non esaustivo):

- `sessionId`: ID della trascrizione corrente usato per indirizzare le righe della trascrizione SQLite
- `sessionStartedAt`: timestamp di inizio del `sessionId` corrente; viene usato per determinare la validità della reimpostazione giornaliera. Le righe legacy possono ricavarlo dall'intestazione della sessione JSONL.
- `lastInteractionAt`: timestamp dell'ultima interazione effettiva dell'utente/del canale; viene usato per determinare la validità della reimpostazione per inattività, affinché gli eventi Heartbeat, Cron e di esecuzione non mantengano attive le sessioni. Le righe legacy prive di questo campo usano come ripiego l'ora di inizio della sessione recuperata.
- `updatedAt`: timestamp dell'ultima modifica della riga dell'archivio, usato per elenchi, eliminazione e operazioni contabili, ma non costituisce l'autorità per la validità giornaliera/per inattività.
- `archivedAt`: timestamp di archiviazione facoltativo. Le sessioni archiviate rimangono nell'archivio con la trascrizione intatta e sono escluse dai normali elenchi delle sessioni attive.
- `pinnedAt`: timestamp di fissaggio facoltativo. Le sessioni attive fissate vengono ordinate prima di quelle non fissate; l'archiviazione di una sessione ne rimuove il fissaggio.
- Interoperabilità dei thread Codex: entrambi i campi seguono la struttura di gestione dei thread di Codex; i booleani `archived`/`pinned` trasmessi vengono sempre derivati dal timestamp e impostati lato server, in conformità alla semantica `threads.archived_at` di Codex e alla serializzazione camelCase. I timestamp di OpenClaw sono espressi in millisecondi Unix, mentre Codex usa secondi Unix, pertanto i bridge eseguono la conversione nel punto di integrazione del Plugin `codex`. Codex non dispone ancora di un'API di fissaggio (solo `thread/archive`/`thread/unarchive`); lo stato fissato rimane sul lato OpenClaw finché non ne esisterà una. A quel punto, la struttura corrispondente consentirà alle sessioni associate di trasferire automaticamente lo stato di fissaggio in entrambe le direzioni.
- La supervisione Codex elenca solo i thread nativi non archiviati. Un thread locale al Gateway con attività sconosciuta `idle` o `notLoaded` può essere archiviato tramite il comando nativo `thread/archive` solo dopo che l'operatore ha confermato esplicitamente che non è di proprietà di nessun altro processo Codex; il Plugin esegue prima una nuova lettura dello stato locale al processo, dopodiché il thread scompare dal catalogo. Tale lettura non può dimostrare che il thread non sia in uso da parte di un altro processo App Server. OpenClaw rifiuta di archiviare le righe attive e quelle con errori; l'archiviazione tramite Node associato non è disponibile finché il bridge del Node non potrà gestire l'intero ciclo di vita del thread trasmesso in streaming. L'annullamento dell'archiviazione in un client Codex nativo rende il thread nuovamente idoneo a comparire.
- `lastReadAt` / `markedUnreadAt`: timestamp dello stato di lettura impostati lato server da `sessions.patch { unread }`; `unread: false` registra una lettura (imposta `lastReadAt`, cancella `markedUnreadAt`); `unread: true` contrassegna la sessione come non letta fino alla lettura successiva. Le righe delle sessioni espongono un booleano derivato `unread`: contrassegnato esplicitamente come non letto oppure letto prima dell'attività più recente. Le sessioni mai contrassegnate come lette rimangono `unread: false`, per evitare che le installazioni esistenti mostrino nuovi indicatori dopo l'aggiornamento.
- `lastActivityAt`: timestamp dell'ultima esecuzione completata dell'agente considerata un'attività meritevole di essere segnalata come non letta (esecuzioni dell'utente, del canale e Cron). I turni Heartbeat e degli eventi interni, così come le modifiche ai metadati, non lo aggiornano; `updatedAt` non è un segnale di attività.
- `sessionFile`: indicatore legacy conservato per la compatibilità con migrazione e archiviazione; il runtime attivo usa l'identità SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadati delle etichette di gruppo/canale
- Opzioni: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (sostituzione specifica per sessione)
- Selezione del modello: `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori dei token (secondo disponibilità/dipendenti dal provider): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: numero di completamenti della Compaction automatica per questa chiave di sessione
- `memoryFlushAt` / `memoryFlushCompactionCount`: timestamp e conteggio delle Compaction dell'ultimo scaricamento della memoria precedente alla Compaction

Il Gateway è l'autorità: può riscrivere o reidratare le voci durante
l'esecuzione delle sessioni. Per le installazioni legacy basate su file, eseguire la migrazione con
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` anziché
modificare `sessions.json` aspettandosi che il runtime continui a leggere tale file.

## Struttura degli eventi della trascrizione

Le trascrizioni sono gestite dall'accessor delle sessioni di OpenClaw ed esposte al codice di runtime tramite helper basati sull'identità. Il flusso degli eventi è a sola aggiunta:

- Prima voce: intestazione della sessione - `type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` facoltativo.
- Successivamente: voci con `id` + `parentId` (struttura ad albero).

Tipi di voce rilevanti:

- `message`: messaggi user/assistant/toolResult
- `custom_message`: messaggio inserito dall'estensione che _entra_ nel contesto del modello (visualizzato nella TUI quando `display: true`, completamente nascosto quando `display: false`)
- `custom`: stato dell'estensione che _non entra_ nel contesto del modello (per rendere persistente lo stato dell'estensione tra i ricaricamenti)
- `compaction`: riepilogo persistente della Compaction con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistente durante l'esplorazione di un ramo dell'albero

OpenClaw intenzionalmente non "corregge" le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

## Finestre di contesto e token monitorati

Due concetti distinti:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello). Proviene dal catalogo dei modelli e può essere sostituito tramite la configurazione.
2. **Contatori dell'archivio delle sessioni**: statistiche progressive scritte nella riga della sessione (usate per `/status` e i dashboard). `contextTokens` è un valore di stima/segnalazione del runtime; non va considerato una garanzia rigorosa.

Ulteriori informazioni sui limiti: [/reference/token-use](/it/reference/token-use).

## Compaction: che cos'è

La Compaction riassume la parte meno recente della conversazione in una voce persistente `compaction` nella trascrizione e mantiene intatti i messaggi recenti. Dopo la Compaction, i turni successivi vedono il riepilogo della Compaction e i messaggi successivi a `firstKeptEntryId`. La Compaction è **persistente**, a differenza dell'eliminazione selettiva della sessione; consultare [/concepts/session-pruning](/it/concepts/session-pruning).

La reiniezione delle sezioni AGENTS.md dopo la Compaction è facoltativa tramite `agents.defaults.compaction.postCompactionSections`; se il valore non è impostato o è `[]`, OpenClaw non aggiunge estratti di AGENTS.md al riepilogo della Compaction.

### Limiti dei segmenti e associazione degli strumenti

Quando suddivide una trascrizione lunga in segmenti per la Compaction, OpenClaw mantiene associate le chiamate agli strumenti dell'assistente alle rispettive voci `toolResult`:

- Se la suddivisione in base alla quota di token ricadesse tra una chiamata a uno strumento e il relativo risultato, OpenClaw sposta il limite in corrispondenza del messaggio di chiamata allo strumento dell'assistente anziché separare la coppia.
- Se un blocco finale di risultati degli strumenti portasse altrimenti il segmento oltre l'obiettivo, OpenClaw conserva tale blocco di strumenti in sospeso e mantiene intatta la parte finale non riepilogata.
- I blocchi di chiamate agli strumenti interrotti/con errori non mantengono aperta una suddivisione in sospeso.

## Quando si verifica la Compaction automatica

Due condizioni di attivazione nell'agente OpenClaw incorporato:

1. **Ripristino dopo un overflow**: il modello restituisce un errore di overflow del contesto (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` e altre varianti specifiche del provider): viene eseguita la Compaction, quindi un nuovo tentativo. Quando il provider segnala il numero di token del tentativo, OpenClaw inoltra tale conteggio osservato alla Compaction di ripristino dall'overflow; se il provider conferma l'overflow ma non espone un conteggio analizzabile, OpenClaw passa ai motori di Compaction e alla diagnostica un conteggio sintetico appena superiore al budget. Se anche il ripristino dall'overflow non riesce, OpenClaw mostra indicazioni esplicite e conserva l'associazione della sessione corrente anziché passare silenziosamente a un nuovo ID di sessione: riprovare il messaggio, eseguire `/compact` oppure eseguire `/new`.
2. **Manutenzione della soglia**: dopo un turno riuscito, quando `contextTokens > contextWindow - reserveTokens`, dove `contextWindow` è la finestra di contesto del modello e `reserveTokens` è il margine riservato ai prompt e al successivo output del modello.

Due ulteriori controlli vengono eseguiti al di fuori di queste due condizioni di attivazione:

- **Compaction locale preliminare**: impostare `agents.defaults.compaction.maxActiveTranscriptBytes` (byte o una stringa come `"20mb"`) per attivare la Compaction locale prima di avviare l'esecuzione successiva, quando la trascrizione attiva raggiunge tale dimensione. Si tratta di un limite dimensionale per il costo della riapertura locale, non di una semplice archiviazione: la normale Compaction semantica viene comunque eseguita e richiede `truncateAfterCompaction`, affinché il riepilogo sottoposto a Compaction diventi una nuova trascrizione successiva.
- **Controllo preliminare a metà turno**: impostare `agents.defaults.compaction.midTurnPrecheck.enabled: true` (valore predefinito `false`) per aggiungere un controllo al ciclo degli strumenti. Dopo l'aggiunta del risultato di uno strumento e prima della chiamata successiva al modello, OpenClaw stima la pressione sul prompt usando la stessa logica preliminare del budget utilizzata all'inizio del turno. Se il contesto non è più sufficiente, il controllo non esegue la Compaction inline: genera un segnale strutturato di controllo preliminare a metà turno, interrompe l'invio del prompt corrente e consente al ciclo di esecuzione esterno di usare il percorso di ripristino esistente (troncare i risultati degli strumenti troppo grandi quando è sufficiente oppure attivare la modalità di Compaction configurata e riprovare). Funziona con entrambe le modalità di Compaction `default` e `safeguard`, inclusa la Compaction di protezione gestita dal provider. È indipendente da `maxActiveTranscriptBytes`: il controllo della dimensione in byte viene eseguito prima dell'avvio di un turno, mentre il controllo preliminare a metà turno viene eseguito successivamente, dopo l'aggiunta dei nuovi risultati degli strumenti.

## Impostazioni della Compaction

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw applica inoltre una soglia minima di sicurezza per le esecuzioni incorporate: se `compaction.reserveTokens` è inferiore a `reserveTokensFloor` (valore predefinito `20000`), OpenClaw lo aumenta fino a tale soglia. Impostare `agents.defaults.compaction.reserveTokensFloor: 0` per disabilitare la soglia minima. Quando la finestra di contesto del modello attivo è nota, sia la soglia minima sia la riserva effettiva finale vengono limitate affinché la riserva non possa consumare l'intero budget del prompt. Ciò impedisce ai modelli con contesto ridotto (per esempio, un modello locale da 16K token) di entrare in Compaction fin dal primo token; senza una finestra di contesto nota, i budget di riserva configurati e correnti rimangono senza limite. Perché prevedere una soglia minima: lasciare un margine sufficiente per le operazioni di "manutenzione" su più turni (come lo svuotamento della memoria descritto di seguito) prima che la Compaction diventi inevitabile. Implementazione: `applyAgentCompactionSettingsFromConfig()` in `src/agents/agent-settings.ts`, richiamato dai percorsi di configurazione del turno dell'esecutore incorporato e della Compaction.

La procedura manuale `/compact` rispetta un valore `agents.defaults.compaction.keepRecentTokens` esplicito e mantiene il punto di taglio della coda recente del runtime. Senza un budget di conservazione esplicito, la Compaction manuale costituisce un checkpoint rigido e il contesto ricostruito inizia dal nuovo riepilogo.

Quando `truncateAfterCompaction` è abilitato, OpenClaw sostituisce la trascrizione attiva con una versione successiva compattata dopo la Compaction. Le azioni di checkpoint per ramificazione/ripristino usano tale versione successiva compattata; i file di checkpoint precedenti alla Compaction continuano a essere leggibili finché sono referenziati.

## Provider di Compaction collegabili

I Plugin registrano un provider di Compaction tramite `registerCompactionProvider()` nell'API del Plugin. Quando `agents.defaults.compaction.provider` è impostato sull'id di un provider registrato, l'estensione di protezione delega il riepilogo a tale provider anziché usare la pipeline `summarizeInStages` integrata.

- `provider`: id di un Plugin provider di Compaction registrato. Lasciare non impostato per il riepilogo LLM predefinito. L'impostazione di un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di Compaction e la stessa politica di conservazione degli identificatori del percorso integrato; inoltre, dopo l'output del provider, la protezione continua a preservare il contesto dei turni recenti e il suffisso dei turni suddivisi.
- Il riepilogo di protezione integrato ridistilla i riepiloghi precedenti insieme ai nuovi messaggi anziché conservare testualmente l'intero riepilogo precedente.
- La modalità di protezione abilita per impostazione predefinita le verifiche della qualità del riepilogo; impostare `qualityGuard.enabled: false` per ignorare il comportamento di nuovo tentativo in caso di output non valido.
- Se il provider non riesce o restituisce un risultato vuoto, OpenClaw passa automaticamente al riepilogo LLM integrato. I segnali di interruzione/timeout attivati esplicitamente dal chiamante vengono rilanciati, non ignorati, affinché l'annullamento sia sempre rispettato.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Superfici visibili all'utente

- `/status` in qualsiasi sessione di chat
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Log del Gateway (`pnpm gateway:watch` o `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modalità dettagliata: `🧹 Auto-compaction complete` più il conteggio delle Compaction

## Manutenzione silenziosa (`NO_REPLY`)

OpenClaw supporta turni "silenziosi" per le attività in background, nei quali l'utente non deve vedere l'output intermedio.

- L'assistente inizia l'output con il token silenzioso esatto `NO_REPLY` / `no_reply` per indicare "non recapitare una risposta all'utente". OpenClaw lo rimuove/sopprime nel livello di recapito.
- La soppressione del token silenzioso esatto non distingue tra maiuscole e minuscole: `NO_REPLY` e `no_reply` sono entrambi validi quando l'intero payload contiene soltanto il token silenzioso.
- A partire da `2026.1.10`, OpenClaw sopprime anche lo streaming delle bozze/dell'indicatore di digitazione quando un frammento parziale inizia con `NO_REPLY`, affinché le operazioni silenziose non espongano output parziale durante il turno.
- Questa funzione è destinata esclusivamente ai turni realmente in background/senza recapito; non è una scorciatoia per le normali richieste operative degli utenti.

## Svuotamento della memoria prima della Compaction

Prima della Compaction automatica, OpenClaw può eseguire un turno agentico silenzioso che scrive uno stato persistente su disco (per esempio `memory/YYYY-MM-DD.md` nell'area di lavoro dell'agente), affinché la Compaction non possa cancellare il contesto critico. Monitora l'utilizzo del contesto della sessione e, quando questo supera una soglia morbida inferiore alla soglia di Compaction, invia una direttiva silenziosa "scrivi ora la memoria" usando il token silenzioso esatto `NO_REPLY` / `no_reply`, in modo che l'utente non veda nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`), riferimento completo in [/gateway/config-agents](/it/gateway/config-agents#agentsdefaultscompaction):

| Chiave                      | Valore predefinito | Note                                                                                                                                   |
| --------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | non impostato      | sostituzione esatta di provider/modello solo per il turno di svuotamento, per esempio `ollama/qwen3:8b`                                |
| `softThresholdTokens`       | `4000`           | margine sotto la soglia di Compaction che attiva uno svuotamento                                                                       |
| `forceFlushTranscriptBytes` | non impostato (disabilitato) | forza uno svuotamento quando il file della trascrizione raggiunge questa dimensione in byte (o una stringa come `"2mb"`), anche se i contatori dei token non sono aggiornati; `0` disabilita |
| `prompt`                    | integrato          | messaggio utente per il turno di svuotamento                                                                                           |
| `systemPrompt`              | integrato          | prompt di sistema aggiuntivo accodato per il turno di svuotamento                                                                      |

Note:

- Il prompt e il prompt di sistema predefiniti includono un suggerimento `NO_REPLY` per sopprimere il recapito.
- Quando `model` è impostato, il turno di svuotamento usa tale modello senza ereditare la catena di fallback della sessione attiva, affinché la manutenzione esclusivamente locale non ripieghi silenziosamente su un modello conversazionale a pagamento in caso di errore.
- Lo svuotamento viene eseguito una volta per ciclo di Compaction (registrato nella riga della sessione).
- Lo svuotamento viene eseguito solo per le sessioni OpenClaw incorporate; i backend CLI e i turni Heartbeat lo ignorano.
- Lo svuotamento viene ignorato quando l'area di lavoro della sessione è di sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Consultare [Memoria](/it/concepts/memory) per la disposizione dei file nell'area di lavoro e gli schemi di scrittura.

OpenClaw espone un hook `session_before_compact` nell'API dell'estensione, ma la logica di svuotamento descritta sopra risiede sul lato Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), non in tale hook.

## Elenco di controllo per la risoluzione dei problemi

- **Chiave di sessione errata?** Iniziare da [/concepts/session](/it/concepts/session) e verificare `sessionKey` in `/status`.
- **Mancata corrispondenza tra archivio e trascrizione?** Verificare l'host del Gateway e il percorso dell'archivio indicato da `openclaw status`.
- **Compaction troppo frequenti?** Controllare la finestra di contesto del modello (se è troppo piccola, forza Compaction frequenti), `reserveTokens` (se è troppo elevato per la finestra del modello, anticipa la Compaction) e l'eccessivo volume dei risultati degli strumenti (regolare l'eliminazione dei dati della sessione).
- **Ogni prompt sembra superare il limite su un piccolo modello locale?** Verificare che il provider comunichi la finestra di contesto corretta del modello. OpenClaw può limitare la riserva effettiva solo quando tale finestra è nota.
- **I turni silenziosi espongono output?** Verificare che la risposta inizi con il token silenzioso esatto `NO_REPLY` (senza distinzione tra maiuscole e minuscole) e che la build includa la correzione per la soppressione dello streaming (`2026.1.10`+).

## Contenuti correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Eliminazione dei dati della sessione](/it/concepts/session-pruning)
- [Motore di contesto](/it/concepts/context-engine)
- [Riferimento alla configurazione dell'agente](/it/gateway/config-agents)
