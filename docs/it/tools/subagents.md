---
read_when:
    - Vuoi attività in background o in parallelo tramite l'agente
    - Stai modificando la policy di `sessions_spawn` o dello strumento sotto-agente
    - Stai implementando o risolvendo problemi relativi a sessioni di subagenti vincolate alla discussione
sidebarTitle: Sub-agents
summary: Avvia esecuzioni isolate di agenti in background che comunicano i risultati nella chat del richiedente
title: Sottoagenti
x-i18n:
    generated_at: "2026-05-02T08:37:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e964df543bd19435daf94f2c85a34b9d32e07662405d2eac7635935f1e7bf64
    source_path: tools/subagents.md
    workflow: 16
---

I sotto-agenti sono esecuzioni di agenti in background generate da un'esecuzione di agente esistente.
Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
al termine, **annunciano** il loro risultato al canale di chat
del richiedente. Ogni esecuzione di sotto-agente viene tracciata come
[attività in background](/it/automation/tasks).

Obiettivi principali:

- Parallelizzare il lavoro di "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sotto-agenti isolati per impostazione predefinita (separazione della sessione + sandboxing facoltativo).
- Rendere difficile l'uso improprio della superficie degli strumenti: i sotto-agenti **non** ricevono gli strumenti di sessione per impostazione predefinita.
- Supportare una profondità di annidamento configurabile per i pattern di orchestrazione.

<Note>
**Nota sui costi:** ogni sotto-agente ha il proprio contesto e il proprio utilizzo di token per
impostazione predefinita. Per attività pesanti o ripetitive, imposta un modello più economico per i sotto-agenti
e mantieni l'agente principale su un modello di qualità superiore. Configura tramite
`agents.defaults.subagents.model` o override per agente. Quando un figlio
    ha realmente bisogno della trascrizione corrente del richiedente, l'agente può richiedere
    `context: "fork"` su quella singola generazione. Le sessioni di sotto-agente legate al thread usano per impostazione predefinita
    `context: "fork"` perché diramano la conversazione corrente in un
    thread di follow-up.
</Note>

## Comando slash

Usa `/subagents` per ispezionare o controllare le esecuzioni di sotto-agenti per la **sessione
corrente**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, id sessione,
percorso della trascrizione, pulizia). Usa `sessions_history` per una vista di richiamo limitata
e filtrata per sicurezza; ispeziona il percorso della trascrizione su disco quando
ti serve la trascrizione completa grezza.

### Controlli di associazione ai thread

Questi comandi funzionano sui canali che supportano associazioni persistenti ai thread.
Vedi [Canali che supportano i thread](#thread-supporting-channels) sotto.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento di generazione

`/subagents spawn` avvia un sotto-agente in background come comando utente (non come
relay interno) e invia un unico aggiornamento finale di completamento alla
chat del richiedente quando l'esecuzione termina.

<AccordionGroup>
  <Accordion title="Completamento non bloccante basato su push">
    - Il comando di generazione non è bloccante; restituisce immediatamente un id esecuzione.
    - Al completamento, il sotto-agente annuncia un messaggio di riepilogo/risultato al canale di chat del richiedente.
    - Il completamento è basato su push. Dopo la generazione, **non** eseguire polling di `/subagents list`, `sessions_list` o `sessions_history` in un ciclo solo per aspettarne la fine; ispeziona lo stato solo su richiesta per debugging o intervento.
    - Al completamento, OpenClaw chiude al meglio le schede/processi del browser tracciati aperti da quella sessione di sotto-agente prima che il flusso di pulizia dell'annuncio continui.

  </Accordion>
  <Accordion title="Resilienza della consegna con generazione manuale">
    - OpenClaw tenta prima la consegna diretta `agent` con una chiave di idempotenza stabile.
    - Se la consegna diretta fallisce, ripiega sull'instradamento tramite coda.
    - Se l'instradamento tramite coda non è ancora disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima della rinuncia finale.
    - La consegna del completamento conserva la route risolta del richiedente: le route di completamento legate al thread o alla conversazione prevalgono quando disponibili; se l'origine del completamento fornisce solo un canale, OpenClaw completa il target/account mancante dalla route risolta della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta funziona comunque.

  </Accordion>
  <Accordion title="Metadati di passaggio del completamento">
    Il passaggio del completamento alla sessione del richiedente è contesto interno
    generato a runtime (non testo scritto dall'utente) e include:

    - `Result` — l'ultimo testo visibile di risposta `assistant`, altrimenti l'ultimo testo tool/toolResult sanificato. Le esecuzioni terminali fallite non riutilizzano il testo di risposta acquisito.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistiche compatte di runtime/token.
    - Un'istruzione di consegna che dice all'agente richiedente di riscrivere con la normale voce dell'assistente (non inoltrare metadati interni grezzi).

  </Accordion>
  <Accordion title="Modalità e runtime ACP">
    - `--model` e `--thinking` sostituiscono i valori predefiniti per quella specifica esecuzione.
    - Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
    - `/subagents spawn` è la modalità una tantum (`mode: "run"`). Per sessioni persistenti legate al thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Per sessioni harness ACP (Claude Code, Gemini CLI, OpenCode, o Codex ACP/acpx esplicito), usa `sessions_spawn` con `runtime: "acp"` quando lo strumento pubblicizza quel runtime. Vedi [modello di consegna ACP](/it/tools/acp-agents#delivery-model) durante il debugging di completamenti o cicli agente-agente. Quando il Plugin `codex` è abilitato, il controllo chat/thread di Codex dovrebbe preferire `/codex ...` rispetto ad ACP a meno che l'utente non richieda esplicitamente ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è in sandbox e un Plugin backend come `acpx` è caricato. `runtime: "acp"` si aspetta un id harness ACP esterno, o una voce `agents.list[]` con `runtime.type="acp"`; usa il runtime di sotto-agente predefinito per i normali agenti di configurazione OpenClaw da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sotto-agenti nativi partono isolati a meno che il chiamante non chieda esplicitamente di biforcare
la trascrizione corrente.

| Modalità   | Quando usarla                                                                                                                          | Comportamento                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Ricerca nuova, implementazione indipendente, lavoro con strumenti lenti o qualunque cosa possa essere descritta nel testo dell'attività | Crea una trascrizione figlia pulita. È l'impostazione predefinita e riduce l'uso di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, dai risultati precedenti degli strumenti o da istruzioni sfumate già presenti nella trascrizione del richiedente | Dirama la trascrizione del richiedente nella sessione figlia prima che il figlio parta. |

Usa `fork` con parsimonia. È pensato per la delega sensibile al contesto, non come
sostituto della scrittura di un prompt attività chiaro.

## Strumento: `sessions_spawn`

Avvia l'esecuzione di un sotto-agente con `deliver: false` sulla corsia globale `subagent`,
poi esegue un passaggio di annuncio e pubblica la risposta di annuncio nel canale di chat
del richiedente.

La disponibilità dipende dalla policy effettiva degli strumenti del chiamante. I profili `coding` e
`full` espongono `sessions_spawn` per impostazione predefinita. Il profilo `messaging`
no; aggiungi `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` o usa `tools.profile: "coding"` per gli agenti che devono delegare
lavoro. Le policy di canale/gruppo, provider, sandbox e allow/deny per agente possono
comunque rimuovere lo strumento dopo la fase del profilo. Usa `/tools` dalla stessa
sessione per confermare l'elenco effettivo degli strumenti.

**Impostazioni predefinite:**

- **Modello:** eredita il chiamante a meno che tu non imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente); un `sessions_spawn.model` esplicito prevale comunque.
- **Thinking:** eredita il chiamante a meno che tu non imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente); un `sessions_spawn.thinking` esplicito prevale comunque.
- **Timeout esecuzione:** se `sessions_spawn.runTimeoutSeconds` è omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ripiega su `0` (nessun timeout).

### Parametri dello strumento

<ParamField path="task" type="string" required>
  La descrizione dell'attività per il sotto-agente.
</ParamField>
<ParamField path="label" type="string">
  Etichetta leggibile opzionale.
</ParamField>
<ParamField path="agentId" type="string">
  Genera sotto un altro id agente quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` è solo per harness ACP esterni (`claude`, `droid`, `gemini`, `opencode`, o Codex ACP/acpx richiesto esplicitamente) e per voci `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Riprende una sessione harness ACP esistente quando `runtime: "acp"`; ignorato per generazioni di sotto-agenti native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Trasmette in streaming l'output dell'esecuzione ACP alla sessione padre quando `runtime: "acp"`; omettere per generazioni di sotto-agenti native.
</ParamField>
<ParamField path="model" type="string">
  Sostituisce il modello del sotto-agente. I valori non validi vengono saltati e il sotto-agente viene eseguito sul modello predefinito con un avviso nel risultato dello strumento.
</ParamField>
<ParamField path="thinking" type="string">
  Sostituisce il livello di thinking per l'esecuzione del sotto-agente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Usa come impostazione predefinita `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`. Quando impostato, l'esecuzione del sotto-agente viene interrotta dopo N secondi.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, richiede l'associazione del thread del canale per questa sessione di sotto-agente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta la generazione a meno che il runtime figlio target non sia in sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` dirama la trascrizione corrente del richiedente nella sessione figlia. Solo sotto-agenti nativi. Le generazioni legate al thread usano `fork` per impostazione predefinita; le generazioni non legate al thread usano `isolated` per impostazione predefinita.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di consegna al canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna, usa
`message`/`sessions_send` dall'esecuzione generata.
</Warning>

## Sessioni legate al thread

Quando le associazioni ai thread sono abilitate per un canale, un sotto-agente può restare associato
a un thread così i messaggi utente di follow-up in quel thread continuano a essere instradati alla
stessa sessione di sotto-agente.

### Canali che supportano i thread

**Discord** è attualmente l'unico canale supportato. Supporta
sessioni di sotto-agente persistenti legate al thread (`sessions_spawn` con
`thread: true`), controlli manuali dei thread (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chiavi dell'adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSessions`.

### Flusso rapido

<Steps>
  <Step title="Genera">
    `sessions_spawn` con `thread: true` (e facoltativamente `mode: "session"`).
  </Step>
  <Step title="Associa">
    OpenClaw crea o associa un thread a quel target di sessione nel canale attivo.
  </Step>
  <Step title="Instrada i follow-up">
    Le risposte e i messaggi di follow-up in quel thread vengono instradati alla sessione associata.
  </Step>
  <Step title="Ispeziona i timeout">
    Usa `/session idle` per ispezionare/aggiornare l'auto-unfocus per inattività e
    `/session max-age` per controllare il limite rigido.
  </Step>
  <Step title="Scollega">
    Usa `/unfocus` per scollegare manualmente.
  </Step>
</Steps>

### Controlli manuali

| Comando            | Effetto                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Associa il thread corrente (o ne crea uno) a un target di sotto-agente/sessione |
| `/unfocus`         | Rimuove l'associazione per il thread corrente associato                       |
| `/agents`          | Elenca le esecuzioni attive e lo stato di associazione (`thread:<id>` o `unbound`)       |
| `/session idle`    | Ispeziona/aggiorna l'auto-unfocus per inattività (solo thread associati focalizzati)         |
| `/session max-age` | Ispeziona/aggiorna il limite massimo rigido (solo thread associati focalizzati)                  |

### Interruttori di configurazione

- **Predefinito globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override del canale e chiavi di auto-associazione allo spawn** sono specifiche dell'adapter. Vedi [Canali con supporto dei thread](#thread-supporting-channels) sopra.

Vedi [Riferimento di configurazione](/it/gateway/configuration-reference) e
[Comandi slash](/it/tools/slash-commands) per i dettagli correnti degli adapter.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco di id agente che possono essere usati come target tramite `agentId` esplicito (`["*"]` consente qualsiasi valore). Predefinito: solo l'agente richiedente. Se imposti un elenco e vuoi comunque che il richiedente possa fare spawn di sé stesso con `agentId`, includi l'id del richiedente nell'elenco.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist predefinita degli agenti target usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Override per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta i target
che verrebbero eseguiti senza sandbox.

### Scoperta

Usa `agents_list` per vedere quali id agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo di ogni agente
elencato e i metadati di runtime incorporati, così i chiamanti possono distinguere PI, il server applicativo Codex
e altri runtime nativi configurati.

### Archiviazione automatica

- Le sessioni dei sotto-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito `60`).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
- L'archiviazione automatica è best-effort; i timer in sospeso vengono persi se il gateway si riavvia.
- `runTimeoutSeconds` **non** archivia automaticamente; interrompe solo l'esecuzione. La sessione rimane fino all'archiviazione automatica.
- L'archiviazione automatica si applica allo stesso modo alle sessioni di profondità 1 e profondità 2.
- La pulizia del browser è separata dalla pulizia dell'archivio: le schede/i processi del browser tracciati vengono chiusi best-effort al termine dell'esecuzione, anche se la trascrizione/record di sessione viene mantenuto.

## Sotto-agenti annidati

Per impostazione predefinita, i sotto-agenti non possono fare spawn dei propri sotto-agenti
(`maxSpawnDepth: 1`). Imposta `maxSpawnDepth: 2` per abilitare un livello di
annidamento — il **pattern orchestrator**: principale → sotto-agente orchestrator →
sotto-sotto-agenti worker.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Livelli di profondità

| Profondità | Forma della chiave di sessione                 | Ruolo                                         | Può fare spawn?              |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principale                             | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sotto-agente (orchestrator quando la profondità 2 è consentita) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sotto-agente (worker foglia)            | Mai                          |

### Catena di annunci

I risultati risalgono lungo la catena:

1. Il worker di profondità 2 termina → annuncia al proprio genitore (orchestrator di profondità 1).
2. L'orchestrator di profondità 1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al principale.
3. L'agente principale riceve l'annuncio e consegna all'utente.

Ogni livello vede solo gli annunci dei propri figli diretti.

<Note>
**Indicazioni operative:** avvia il lavoro figlio una volta e attendi gli
eventi di completamento invece di costruire cicli di polling intorno a `sessions_list`,
`sessions_history`, `/subagents list` o comandi `exec` sleep.
`sessions_list` e `/subagents list` mantengono le relazioni delle sessioni figlie
focalizzate sul lavoro live — i figli live restano collegati, i figli terminati rimangono
visibili per una breve finestra recente, e i link figlio solo nello store e obsoleti vengono
ignorati dopo la loro finestra di freschezza. Questo impedisce ai vecchi metadati `spawnedBy` /
`parentSessionKey` di far riapparire figli fantasma dopo
il riavvio. Se un evento di completamento figlio arriva dopo che hai già inviato la
risposta finale, il follow-up corretto è il token silenzioso esatto
`NO_REPLY` / `no_reply`.
</Note>

### Policy degli strumenti per profondità

- Il ruolo e l'ambito di controllo vengono scritti nei metadati di sessione al momento dello spawn. Questo evita che chiavi di sessione piatte o ripristinate recuperino accidentalmente privilegi da orchestrator.
- **Profondità 1 (orchestrator, quando `maxSpawnDepth >= 2`):** ottiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` per poter gestire i propri figli. Gli altri strumenti di sessione/sistema restano negati.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito attuale).
- **Profondità 2 (worker foglia):** nessuno strumento di sessione — `sessions_spawn` è sempre negato alla profondità 2. Non può fare spawn di altri figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo `maxChildrenPerAgent`
(predefinito `5`) figli attivi contemporaneamente. Questo impedisce fan-out incontrollati
da un singolo orchestrator.

### Arresto a cascata

Fermare un orchestrator di profondità 1 ferma automaticamente tutti i suoi figli di profondità 2:

- `/stop` nella chat principale ferma tutti gli agenti di profondità 1 e propaga l'arresto ai loro figli di profondità 2.
- `/subagents kill <id>` ferma un sotto-agente specifico e propaga l'arresto ai suoi figli.
- `/subagents kill all` ferma tutti i sotto-agenti per il richiedente e propaga l'arresto.

## Autenticazione

L'autenticazione dei sotto-agenti viene risolta per **id agente**, non per tipo di sessione:

- La chiave di sessione del sotto-agente è `agent:<agentId>:subagent:<uuid>`.
- Lo store di autenticazione viene caricato dall'`agentDir` di quell'agente.
- I profili di autenticazione dell'agente principale vengono uniti come **fallback**; i profili agente sovrascrivono i profili principali in caso di conflitto.

L'unione è additiva, quindi i profili principali sono sempre disponibili come
fallback. L'autenticazione completamente isolata per agente non è ancora supportata.

## Annuncio

I sotto-agenti riportano i risultati tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito dentro la sessione del sotto-agente (non nella sessione richiedente).
- Se il sotto-agente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se l'ultimo testo dell'assistente è il token silenzioso esatto `NO_REPLY` / `no_reply`, l'output dell'annuncio viene soppresso anche se prima esisteva avanzamento visibile.

La consegna dipende dalla profondità del richiedente:

- Le sessioni richiedenti di livello superiore usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`).
- Le sessioni sotto-agente richiedenti annidate ricevono un'iniezione interna di follow-up (`deliver=false`) così l'orchestrator può sintetizzare i risultati dei figli nella sessione.
- Se una sessione sotto-agente richiedente annidata non esiste più, OpenClaw ricade sul richiedente di quella sessione quando disponibile.

Per le sessioni richiedenti di livello superiore, la consegna diretta in modalità completamento
risolve prima qualsiasi route di conversazione/thread associata e override dell'hook, poi completa
i campi target-canale mancanti dalla route memorizzata della sessione richiedente.
Questo mantiene i completamenti nella chat/topic corretti anche quando l'origine del completamento
identifica solo il canale.

L'aggregazione dei completamenti figli è limitata all'esecuzione richiedente corrente quando
costruisce i risultati di completamento annidati, impedendo agli output dei figli di esecuzioni precedenti
obsolete di trapelare nell'annuncio corrente. Le risposte di annuncio preservano
il routing thread/topic quando disponibile sugli adapter di canale.

### Contesto dell'annuncio

Il contesto dell'annuncio viene normalizzato in un blocco evento interno stabile:

| Campo          | Origine                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origine        | `subagent` o `cron`                                                                                          |
| Id sessione    | Chiave/id sessione figlia                                                                                          |
| Tipo           | Tipo di annuncio + etichetta attività                                                                                    |
| Stato          | Derivato dall'esito del runtime (`success`, `error`, `timeout` o `unknown`) — **non** inferito dal testo del modello |
| Contenuto del risultato | Ultimo testo visibile dell'assistente, altrimenti ultimo testo tool/toolResult sanificato                                |
| Follow-up      | Istruzione che descrive quando rispondere o rimanere silenziosi                                                           |

Le esecuzioni terminali fallite riportano lo stato di errore senza riprodurre il
testo di risposta acquisito. In caso di timeout, se il figlio è arrivato solo fino alle chiamate tool,
l'annuncio può comprimere quella cronologia in un breve riepilogo di avanzamento parziale invece
di riprodurre l'output tool grezzo.

### Riga delle statistiche

I payload di annuncio includono una riga di statistiche alla fine (anche quando sono incapsulati):

- Runtime (es. `runtime 5m12s`).
- Utilizzo token (input/output/totale).
- Costo stimato quando il pricing del modello è configurato (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e percorso della trascrizione così l'agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco.

I metadati interni sono pensati solo per l'orchestrazione; le risposte rivolte all'utente
devono essere riscritte con la normale voce dell'assistente.

### Perché preferire `sessions_history`

`sessions_history` è il percorso di orchestrazione più sicuro:

- Il richiamo dell'assistente viene prima normalizzato: tag di ragionamento rimossi; impalcatura `<relevant-memories>` / `<relevant_memories>` rimossa; blocchi payload XML di chiamate tool in testo semplice (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) rimossi, inclusi i payload troncati che non si chiudono mai correttamente; impalcatura di chiamata/risultato tool declassata e marcatori di contesto storico rimossi; token di controllo del modello trapelati (`<|assistant|>`, altri ASCII `<|...|>`, full-width `<｜...｜>`) rimossi; XML di chiamate tool MiniMax malformato rimosso.
- Il testo simile a credenziali/token viene redatto.
- I blocchi lunghi possono essere troncati.
- Cronologie molto grandi possono scartare le righe più vecchie o sostituire una riga sovradimensionata con `[sessions_history omitted: message too large]`.
- L'ispezione della trascrizione grezza su disco è il fallback quando serve la trascrizione completa byte per byte.

## Policy degli strumenti

I sotto-agenti usano prima la stessa pipeline di profilo e policy degli strumenti del genitore o
dell'agente target. Dopo, OpenClaw applica il livello di restrizione
dei sotto-agenti.

Senza un `tools.profile` restrittivo, i sotto-agenti ottengono **tutti gli strumenti tranne
gli strumenti di sessione** e gli strumenti di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` resta una vista di richiamo limitata e sanificata —
non è un dump della trascrizione grezza.

Quando `maxSpawnDepth >= 2`, i sotto-agenti orchestrator di profondità 1 ricevono inoltre
`sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history` così possono gestire i propri figli.

### Override tramite configurazione

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` è un filtro finale solo-consentiti. Può restringere
l'insieme di strumenti già risolto, ma non può **riaggiungere** uno strumento rimosso
da `tools.profile`. Ad esempio, `tools.profile: "coding"` include
`web_search`/`web_fetch` ma non lo strumento `browser`. Per consentire ai
sotto-agenti con profilo coding di usare l'automazione del browser, aggiungi browser nella
fase del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` per agente quando solo un
agente deve ottenere l'automazione del browser.

## Concorrenza

I sotto-agenti usano una corsia di coda dedicata in-process:

- **Nome corsia:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Liveness e ripristino

OpenClaw non considera l'assenza di `endedAt` una prova permanente che un
sotto-agente sia ancora attivo. Le esecuzioni non terminate più vecchie della finestra di esecuzione obsoleta
smettono di contare come attive/in sospeso in `/subagents list`, nei riepiloghi di stato,
nel gating del completamento dei discendenti e nei controlli di concorrenza per sessione.

Dopo un riavvio del Gateway, le esecuzioni ripristinate obsolete e non terminate vengono eliminate, a meno che
la relativa sessione figlia sia contrassegnata con `abortedLastRun: true`. Tali
sessioni figlie interrotte dal riavvio restano recuperabili tramite il flusso di ripristino degli orfani dei sotto-agenti,
che invia un messaggio sintetico di ripresa prima di
cancellare il marcatore di interruzione.

Il ripristino automatico dopo il riavvio è limitato per sessione figlia. Se la stessa
sessione figlia del sotto-agente viene accettata ripetutamente per il ripristino degli orfani all'interno della
finestra rapida di nuovo blocco, OpenClaw persiste una tombstone di ripristino su quella
sessione e smette di riprenderla automaticamente ai riavvii successivi. Esegui
`openclaw tasks maintenance --apply` per riconciliare il record del task, oppure
`openclaw doctor --fix` per cancellare i flag di ripristino interrotto obsoleti sulle
sessioni con tombstone.

<Note>
Se la creazione di un sotto-agente fallisce con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controlla il chiamante RPC prima di modificare lo stato di pairing.
La coordinazione interna `sessions_spawn` deve connettersi come
`client.id: "gateway-client"` con `client.mode: "backend"` tramite autenticazione diretta
local loopback con token condiviso/password; quel percorso non dipende dalla
baseline dello scope dei dispositivi associati della CLI. I chiamanti remoti, i percorsi con
`deviceIdentity` esplicito, token dispositivo esplicito e i client browser/node
richiedono comunque la normale approvazione del dispositivo per gli upgrade di scope.
</Note>

## Arresto

- L'invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta tutte le esecuzioni attive dei sotto-agenti avviate da essa, con propagazione ai figli annidati.
- `/subagents kill <id>` arresta uno specifico sotto-agente e si propaga ai suoi figli.

## Limitazioni

- L'annuncio dei sotto-agenti è **best-effort**. Se il Gateway si riavvia, il lavoro "announce back" in sospeso viene perso.
- I sotto-agenti condividono comunque le stesse risorse del processo Gateway; considera `maxConcurrent` una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto del sotto-agente inietta solo `AGENTS.md` + `TOOLS.md` (nessun `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di annidamento è 5 (intervallo di `maxSpawnDepth`: 1-5). La profondità 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito `5`, intervallo `1-20`).

## Correlati

- [Agenti ACP](/it/tools/acp-agents)
- [Invio agente](/it/tools/agent-send)
- [Task in background](/it/automation/tasks)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
