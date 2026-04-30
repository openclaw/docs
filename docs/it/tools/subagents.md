---
read_when:
    - Vuoi eseguire lavoro in background o in parallelo tramite l'agente
    - Stai modificando sessions_spawn o le regole dello strumento sottoagente
    - Stai implementando o risolvendo problemi relativi a sessioni di sottoagenti vincolate al thread
sidebarTitle: Sub-agents
summary: Avvia esecuzioni isolate di agenti in background che comunicano i risultati nella chat del richiedente
title: Sottoagenti
x-i18n:
    generated_at: "2026-04-30T16:30:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

I sub-agent sono esecuzioni di agent in background generate da un'esecuzione di agent esistente.
Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
al termine, **annunciano** il loro risultato nel canale di chat del
richiedente. Ogni esecuzione di sub-agent viene tracciata come
[attività in background](/it/automation/tasks).

Obiettivi principali:

- Parallelizzare il lavoro di "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sub-agent isolati per impostazione predefinita (separazione delle sessioni + sandboxing opzionale).
- Mantenere la superficie degli strumenti difficile da usare in modo improprio: i sub-agent **non** ricevono gli strumenti di sessione per impostazione predefinita.
- Supportare una profondità di annidamento configurabile per i pattern di orchestrazione.

<Note>
**Nota sui costi:** ogni sub-agent ha il proprio contesto e il proprio utilizzo di token per
impostazione predefinita. Per attività pesanti o ripetitive, imposta un modello meno costoso per i sub-agent
e mantieni il tuo agent principale su un modello di qualità superiore. Configura tramite
`agents.defaults.subagents.model` o override per agent. Quando un figlio
ha davvero bisogno della trascrizione corrente del richiedente, l'agent può richiedere
`context: "fork"` per quella singola generazione.
</Note>

## Comando slash

Usa `/subagents` per ispezionare o controllare le esecuzioni dei sub-agent per la **sessione
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
ti serve la trascrizione grezza completa.

### Controlli di associazione thread

Questi comandi funzionano sui canali che supportano associazioni persistenti dei thread.
Vedi [Canali che supportano i thread](#thread-supporting-channels) sotto.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento di generazione

`/subagents spawn` avvia un sub-agent in background come comando utente (non un
relay interno) e invia un aggiornamento finale di completamento alla chat del
richiedente quando l'esecuzione termina.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Il comando di generazione è non bloccante; restituisce immediatamente un id di esecuzione.
    - Al completamento, il sub-agent annuncia un messaggio di riepilogo/risultato al canale di chat del richiedente.
    - Il completamento è push-based. Una volta generato, **non** eseguire polling di `/subagents list`, `sessions_list` o `sessions_history` in un ciclo solo per aspettare che finisca; ispeziona lo stato solo su richiesta per debugging o intervento.
    - Al completamento, OpenClaw chiude con il massimo impegno schede/processi del browser tracciati aperti da quella sessione di sub-agent prima che il flusso di pulizia dell'annuncio continui.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw prova prima la consegna diretta `agent` con una chiave di idempotenza stabile.
    - Se la consegna diretta non riesce, ricorre al routing tramite coda.
    - Se il routing tramite coda non è ancora disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima dell'abbandono definitivo.
    - La consegna del completamento mantiene la route del richiedente risolta: le route di completamento associate al thread o alla conversazione prevalgono quando disponibili; se l'origine del completamento fornisce solo un canale, OpenClaw compila il target/account mancante dalla route risolta della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta funziona comunque.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Il passaggio di completamento alla sessione del richiedente è contesto interno generato a runtime
    (non testo scritto dall'utente) e include:

    - `Result` — ultimo testo visibile della risposta `assistant`, altrimenti ultimo testo sanitizzato di tool/toolResult. Le esecuzioni terminali fallite non riutilizzano il testo di risposta catturato.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistiche compatte di runtime/token.
    - Un'istruzione di consegna che dice all'agent richiedente di riscrivere con la normale voce dell'assistente (non inoltrare metadati interni grezzi).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
    - Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
    - `/subagents spawn` è modalità one-shot (`mode: "run"`). Per sessioni persistenti associate a thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Per le sessioni harness ACP (Claude Code, Gemini CLI, OpenCode, o Codex ACP/acpx esplicito), usa `sessions_spawn` con `runtime: "acp"` quando lo strumento dichiara quel runtime. Vedi [Modello di consegna ACP](/it/tools/acp-agents#delivery-model) durante il debugging di completamenti o cicli agent-to-agent. Quando il plugin `codex` è abilitato, il controllo chat/thread Codex dovrebbe preferire `/codex ...` rispetto ad ACP salvo richiesta esplicita dell'utente per ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è in sandbox e un Plugin backend come `acpx` è caricato. `runtime: "acp"` si aspetta un id harness ACP esterno, o una voce `agents.list[]` con `runtime.type="acp"`; usa il runtime sub-agent predefinito per i normali agent di configurazione OpenClaw da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sub-agent nativi partono isolati salvo richiesta esplicita del chiamante di creare un fork
della trascrizione corrente.

| Modalità   | Quando usarla                                                                                                                          | Comportamento                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `isolated` | Ricerca nuova, implementazione indipendente, lavoro con strumenti lenti o qualsiasi cosa che possa essere spiegata nel testo dell'attività | Crea una trascrizione figlia pulita. Questa è l'impostazione predefinita e mantiene più basso l'uso di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, da risultati precedenti degli strumenti o da istruzioni sfumate già presenti nella trascrizione del richiedente | Dirama la trascrizione del richiedente nella sessione figlia prima che il figlio inizi. |

Usa `fork` con parsimonia. Serve per deleghe sensibili al contesto, non come
sostituto della scrittura di un prompt di attività chiaro.

## Strumento: `sessions_spawn`

Avvia un'esecuzione di sub-agent con `deliver: false` sulla lane globale `subagent`,
poi esegue un passaggio di annuncio e pubblica la risposta di annuncio nel canale di chat
del richiedente.

La disponibilità dipende dalla policy effettiva degli strumenti del chiamante. I profili `coding` e
`full` espongono `sessions_spawn` per impostazione predefinita. Il profilo `messaging`
no; aggiungi `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` oppure usa `tools.profile: "coding"` per gli agent che devono delegare
lavoro. Le policy di canale/gruppo, provider, sandbox e allow/deny per agent possono
comunque rimuovere lo strumento dopo la fase del profilo. Usa `/tools` dalla stessa
sessione per confermare l'elenco effettivo degli strumenti.

**Valori predefiniti:**

- **Modello:** eredita il chiamante salvo impostazione di `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agent); un `sessions_spawn.model` esplicito prevale comunque.
- **Thinking:** eredita il chiamante salvo impostazione di `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agent); un `sessions_spawn.thinking` esplicito prevale comunque.
- **Timeout di esecuzione:** se `sessions_spawn.runTimeoutSeconds` è omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ripiega su `0` (nessun timeout).

### Parametri dello strumento

<ParamField path="task" type="string" required>
  La descrizione dell'attività per il sub-agent.
</ParamField>
<ParamField path="label" type="string">
  Etichetta opzionale leggibile dall'uomo.
</ParamField>
<ParamField path="agentId" type="string">
  Genera sotto un altro id agent quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` è solo per harness ACP esterni (`claude`, `droid`, `gemini`, `opencode`, o Codex ACP/acpx richiesto esplicitamente) e per voci `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Riprende una sessione harness ACP esistente quando `runtime: "acp"`; ignorato per le generazioni di sub-agent native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Trasmette in streaming l'output dell'esecuzione ACP alla sessione padre quando `runtime: "acp"`; ometti per le generazioni di sub-agent native.
</ParamField>
<ParamField path="model" type="string">
  Sovrascrive il modello del sub-agent. I valori non validi vengono saltati e il sub-agent viene eseguito sul modello predefinito con un avviso nel risultato dello strumento.
</ParamField>
<ParamField path="thinking" type="string">
  Sovrascrive il livello di thinking per l'esecuzione del sub-agent.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Per impostazione predefinita usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`. Quando impostato, l'esecuzione del sub-agent viene interrotta dopo N secondi.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, richiede l'associazione del thread del canale per questa sessione di sub-agent.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta la generazione salvo che il runtime figlio target sia in sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` dirama la trascrizione corrente del richiedente nella sessione figlia. Solo sub-agent nativi. Usa `fork` solo quando il figlio ha bisogno della trascrizione corrente.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di consegna canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna, usa
`message`/`sessions_send` dall'esecuzione generata.
</Warning>

## Sessioni associate a thread

Quando le associazioni thread sono abilitate per un canale, un sub-agent può restare associato
a un thread così i messaggi utente successivi in quel thread continuano a essere instradati alla
stessa sessione di sub-agent.

### Canali che supportano i thread

**Discord** è attualmente l'unico canale supportato. Supporta
sessioni subagent persistenti associate a thread (`sessions_spawn` con
`thread: true`), controlli manuali dei thread (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e le chiavi dell'adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSubagentSessions`.

### Flusso rapido

<Steps>
  <Step title="Spawn">
    `sessions_spawn` con `thread: true` (e opzionalmente `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw crea o associa un thread a quel target di sessione nel canale attivo.
  </Step>
  <Step title="Route follow-ups">
    Le risposte e i messaggi successivi in quel thread vengono instradati alla sessione associata.
  </Step>
  <Step title="Inspect timeouts">
    Usa `/session idle` per ispezionare/aggiornare l'auto-unfocus per inattività e
    `/session max-age` per controllare il limite massimo rigido.
  </Step>
  <Step title="Detach">
    Usa `/unfocus` per scollegare manualmente.
  </Step>
</Steps>

### Controlli manuali

| Comando           | Effetto                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| `/focus <target>` | Associa il thread corrente (o ne crea uno) a un target di sotto-agente/sessione |
| `/unfocus`        | Rimuove l'associazione per il thread attualmente associato                  |
| `/agents`         | Elenca le esecuzioni attive e lo stato di associazione (`thread:<id>` o `unbound`) |
| `/session idle`   | Ispeziona/aggiorna la rimozione automatica del focus per inattività (solo thread associati con focus) |
| `/session max-age` | Ispeziona/aggiorna il limite massimo rigido (solo thread associati con focus) |

### Opzioni di configurazione

- **Predefinito globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override per canale e chiavi di associazione automatica allo spawn** sono specifici dell'adattatore. Vedi [Canali che supportano i thread](#thread-supporting-channels) sopra.

Vedi [Riferimento di configurazione](/it/gateway/configuration-reference) e
[Comandi slash](/it/tools/slash-commands) per i dettagli correnti degli adattatori.

### Lista consentita

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco degli ID agente che possono essere usati come target tramite `agentId` esplicito (`["*"]` consente qualsiasi valore). Predefinito: solo l'agente richiedente. Se imposti un elenco e vuoi comunque che il richiedente possa avviare sé stesso con `agentId`, includi l'ID del richiedente nell'elenco.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista consentita predefinita degli agenti target usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Override per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta i target
che verrebbero eseguiti senza sandbox.

### Individuazione

Usa `agents_list` per vedere quali ID agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo di ogni agente
elencato e i metadati di runtime incorporati, così i chiamanti possono distinguere Pi, il server applicativo Codex
e altri runtime nativi configurati.

### Archiviazione automatica

- Le sessioni dei sotto-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito `60`).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
- L'archiviazione automatica è best-effort; i timer in sospeso vengono persi se il Gateway si riavvia.
- `runTimeoutSeconds` **non** archivia automaticamente; interrompe solo l'esecuzione. La sessione rimane fino all'archiviazione automatica.
- L'archiviazione automatica si applica allo stesso modo alle sessioni di profondità 1 e profondità 2.
- La pulizia del browser è separata dalla pulizia dell'archivio: le schede/i processi del browser tracciati vengono chiusi in modalità best-effort al termine dell'esecuzione, anche se la trascrizione/il record della sessione viene mantenuto.

## Sotto-agenti nidificati

Per impostazione predefinita, i sotto-agenti non possono avviare i propri sotto-agenti
(`maxSpawnDepth: 1`). Imposta `maxSpawnDepth: 2` per abilitare un livello di
nidificazione — il **pattern orchestratore**: principale → sotto-agente orchestratore →
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

| Profondità | Forma della chiave sessione                  | Ruolo                                        | Può avviare?                 |
| ---------- | -------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 0          | `agent:<id>:main`                            | Agente principale                            | Sempre                       |
| 1          | `agent:<id>:subagent:<uuid>`                 | Sotto-agente (orchestratore quando la profondità 2 è consentita) | Solo se `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sotto-agente (worker foglia)           | Mai                          |

### Catena di annuncio

I risultati risalgono la catena:

1. Il worker di profondità 2 termina → annuncia al suo genitore (orchestratore di profondità 1).
2. L'orchestratore di profondità 1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al principale.
3. L'agente principale riceve l'annuncio e lo consegna all'utente.

Ogni livello vede solo gli annunci dei propri figli diretti.

<Note>
**Guida operativa:** avvia il lavoro dei figli una sola volta e attendi gli
eventi di completamento invece di creare cicli di polling attorno a `sessions_list`,
`sessions_history`, `/subagents list` o comandi `exec` di sospensione.
`sessions_list` e `/subagents list` mantengono le relazioni delle sessioni figlie
focalizzate sul lavoro live — i figli live restano collegati, i figli terminati rimangono
visibili per una breve finestra recente e i collegamenti figlio solo nello store obsoleti vengono
ignorati dopo la loro finestra di freschezza. Questo impedisce ai vecchi metadati `spawnedBy` /
`parentSessionKey` di far riemergere figli fantasma dopo il
riavvio. Se un evento di completamento figlio arriva dopo che hai già inviato la
risposta finale, il follow-up corretto è il token silenzioso esatto
`NO_REPLY` / `no_reply`.
</Note>

### Policy degli strumenti per profondità

- Il ruolo e l'ambito di controllo vengono scritti nei metadati della sessione al momento dello spawn. Questo impedisce a chiavi di sessione piatte o ripristinate di riacquisire accidentalmente privilegi da orchestratore.
- **Profondità 1 (orchestratore, quando `maxSpawnDepth >= 2`):** ottiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` per poter gestire i propri figli. Gli altri strumenti di sessione/sistema restano negati.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito corrente).
- **Profondità 2 (worker foglia):** nessuno strumento di sessione — `sessions_spawn` è sempre negato a profondità 2. Non può avviare altri figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo `maxChildrenPerAgent`
(predefinito `5`) figli attivi alla volta. Questo impedisce fan-out incontrollati
da un singolo orchestratore.

### Arresto a cascata

L'arresto di un orchestratore di profondità 1 arresta automaticamente tutti i suoi figli di profondità 2:

- `/stop` nella chat principale arresta tutti gli agenti di profondità 1 e propaga l'arresto ai loro figli di profondità 2.
- `/subagents kill <id>` arresta uno specifico sotto-agente e propaga l'arresto ai suoi figli.
- `/subagents kill all` arresta tutti i sotto-agenti per il richiedente e propaga l'arresto.

## Autenticazione

L'autenticazione dei sotto-agenti viene risolta per **ID agente**, non per tipo di sessione:

- La chiave di sessione del sotto-agente è `agent:<agentId>:subagent:<uuid>`.
- Lo store di autenticazione viene caricato dall'`agentDir` di quell'agente.
- I profili di autenticazione dell'agente principale vengono uniti come **fallback**; i profili agente sovrascrivono i profili principali in caso di conflitto.

L'unione è additiva, quindi i profili principali sono sempre disponibili come
fallback. L'autenticazione completamente isolata per agente non è ancora supportata.

## Annuncio

I sotto-agenti riportano i risultati tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito all'interno della sessione del sotto-agente (non nella sessione richiedente).
- Se il sotto-agente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se l'ultimo testo dell'assistente è il token silenzioso esatto `NO_REPLY` / `no_reply`, l'output dell'annuncio viene soppresso anche se in precedenza erano presenti progressi visibili.

La consegna dipende dalla profondità del richiedente:

- Le sessioni richiedenti di primo livello usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`).
- Le sessioni sotto-agente richiedenti nidificate ricevono un'iniezione interna di follow-up (`deliver=false`) così l'orchestratore può sintetizzare i risultati dei figli nella sessione.
- Se una sessione sotto-agente richiedente nidificata non esiste più, OpenClaw ripiega sul richiedente di quella sessione quando disponibile.

Per le sessioni richiedenti di primo livello, la consegna diretta in modalità completamento
prima risolve qualsiasi route di conversazione/thread associata e override dell'hook, quindi compila
i campi target del canale mancanti dalla route salvata nella sessione richiedente.
Questo mantiene i completamenti nella chat/topic corretti anche quando l'origine del completamento
identifica solo il canale.

L'aggregazione dei completamenti figli è limitata all'esecuzione corrente del richiedente quando
costruisce i finding di completamento nidificati, impedendo agli output figli di esecuzioni precedenti obsolete
di trapelare nell'annuncio corrente. Le risposte di annuncio preservano
il routing di thread/topic quando disponibile sugli adattatori di canale.

### Contesto dell'annuncio

Il contesto dell'annuncio viene normalizzato in un blocco evento interno stabile:

| Campo          | Origine                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origine        | `subagent` o `cron`                                                                                           |
| ID sessione    | Chiave/ID della sessione figlia                                                                               |
| Tipo           | Tipo di annuncio + etichetta dell'attività                                                                    |
| Stato          | Derivato dall'esito del runtime (`success`, `error`, `timeout` o `unknown`) — **non** inferito dal testo del modello |
| Contenuto del risultato | Ultimo testo visibile dell'assistente, altrimenti ultimo testo tool/toolResult sanitizzato             |
| Follow-up      | Istruzione che descrive quando rispondere o restare in silenzio                                               |

Le esecuzioni terminali non riuscite riportano lo stato di errore senza riprodurre
il testo di risposta acquisito. In caso di timeout, se il figlio è arrivato solo alle chiamate degli strumenti, l'annuncio
può condensare quella cronologia in un breve riepilogo dei progressi parziali invece
di riprodurre l'output grezzo degli strumenti.

### Riga delle statistiche

I payload di annuncio includono una riga di statistiche alla fine (anche quando incapsulati):

- Runtime (es. `runtime 5m12s`).
- Utilizzo dei token (input/output/totale).
- Costo stimato quando i prezzi del modello sono configurati (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e percorso della trascrizione, così l'agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco.

I metadati interni sono pensati solo per l'orchestrazione; le risposte rivolte all'utente
devono essere riscritte con la normale voce dell'assistente.

### Perché preferire `sessions_history`

`sessions_history` è il percorso di orchestrazione più sicuro:

- Il richiamo dell'assistente viene prima normalizzato: tag di ragionamento rimossi; scaffolding `<relevant-memories>` / `<relevant_memories>` rimosso; blocchi payload XML di chiamate strumento in testo semplice (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) rimossi, inclusi payload troncati che non si chiudono correttamente; scaffolding di chiamate/risultati strumento declassato e marcatori di contesto storico rimossi; token di controllo del modello trapelati (`<|assistant|>`, altri ASCII `<|...|>`, full-width `<｜...｜>`) rimossi; XML di chiamate strumento MiniMax malformato rimosso.
- Il testo simile a credenziali/token viene oscurato.
- I blocchi lunghi possono essere troncati.
- Le cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga sovradimensionata con `[sessions_history omitted: message too large]`.
- L'ispezione della trascrizione grezza su disco è il fallback quando serve la trascrizione completa byte per byte.

## Policy degli strumenti

I sotto-agenti usano prima lo stesso profilo e la stessa pipeline di policy degli strumenti del genitore o
dell'agente target. Successivamente, OpenClaw applica il livello di restrizione
dei sotto-agenti.

Senza un `tools.profile` restrittivo, i sotto-agenti ottengono **tutti gli strumenti eccetto
gli strumenti di sessione** e gli strumenti di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` rimane una vista di richiamo limitata e sanitizzata — 
non è un dump grezzo della trascrizione.

Quando `maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondità 1 ricevono inoltre
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

`tools.subagents.tools.allow` è un filtro finale solo-allow. Può restringere
il set di strumenti già risolto, ma non può **riaggiungere** uno strumento rimosso
da `tools.profile`. Per esempio, `tools.profile: "coding"` include
`web_search`/`web_fetch` ma non lo strumento `browser`. Per consentire
ai sotto-agenti con profilo coding di usare l'automazione del browser, aggiungi browser
nella fase del profilo:

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

I sotto-agenti usano una corsia dedicata di coda in-process:

- **Nome della corsia:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Stato di attività e recupero

OpenClaw non considera l'assenza di `endedAt` una prova permanente del fatto che un
sotto-agente sia ancora attivo. Le esecuzioni non terminate più vecchie della finestra di esecuzione obsoleta
smettono di contare come attive/in sospeso in `/subagents list`, nei riepiloghi di stato,
nel gating di completamento dei discendenti e nei controlli di concorrenza per sessione.

Dopo un riavvio del Gateway, le esecuzioni ripristinate obsolete e non terminate vengono eliminate, a meno che
la loro sessione figlia sia contrassegnata con `abortedLastRun: true`. Tali
sessioni figlie interrotte dal riavvio restano recuperabili tramite il flusso di recupero degli orfani
dei sotto-agenti, che invia un messaggio di ripresa sintetico prima di
cancellare il marcatore di interruzione.

Il recupero automatico dopo il riavvio è limitato per sessione figlia. Se lo stesso
figlio del sotto-agente viene accettato ripetutamente per il recupero degli orfani all'interno della
finestra di rapido reincastro, OpenClaw persiste una tombstone di recupero su quella
sessione e smette di riprenderla automaticamente ai riavvii successivi. Esegui
`openclaw tasks maintenance --apply` per riconciliare il record dell'attività, oppure
`openclaw doctor --fix` per cancellare i flag di recupero interrotto obsoleti sulle
sessioni con tombstone.

<Note>
Se la generazione di un sotto-agente fallisce con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controlla il chiamante RPC prima di modificare lo stato di pairing.
Il coordinamento interno `sessions_spawn` deve connettersi come
`client.id: "gateway-client"` con `client.mode: "backend"` tramite autenticazione diretta
con token condiviso/password su loopback; quel percorso non dipende dalla
baseline di scope dei dispositivi associati della CLI. I chiamanti remoti, gli
`deviceIdentity` espliciti, i percorsi espliciti con token del dispositivo e i client
browser/node richiedono comunque la normale approvazione del dispositivo per gli upgrade di scope.
</Note>

## Arresto

- L'invio di `/stop` nella chat richiedente interrompe la sessione richiedente e arresta tutte le esecuzioni attive dei sotto-agenti generate da essa, propagandosi ai figli annidati.
- `/subagents kill <id>` arresta uno specifico sotto-agente e si propaga ai suoi figli.

## Limitazioni

- L'annuncio dei sotto-agenti è **best-effort**. Se il Gateway si riavvia, il lavoro in sospeso di "announce back" viene perso.
- I sotto-agenti condividono comunque le stesse risorse del processo Gateway; considera `maxConcurrent` una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto dei sotto-agenti inietta solo `AGENTS.md` + `TOOLS.md` (nessun `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di annidamento è 5 (intervallo di `maxSpawnDepth`: 1-5). La profondità 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito `5`, intervallo `1-20`).

## Correlati

- [Agenti ACP](/it/tools/acp-agents)
- [Invio agente](/it/tools/agent-send)
- [Attività in background](/it/automation/tasks)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
