---
read_when:
    - Vuoi eseguire attività in background o in parallelo tramite l’agente
    - Stai modificando sessions_spawn o i criteri dello strumento per sotto-agenti
    - Stai implementando o risolvendo problemi relativi alle sessioni di subagenti vincolate al thread
sidebarTitle: Sub-agents
summary: Avvia esecuzioni isolate di agenti in background che comunicano i risultati nella chat del richiedente
title: Sub-agenti
x-i18n:
    generated_at: "2026-05-07T13:27:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

I sub-agent sono esecuzioni di agent in background generate da un'esecuzione di agent esistente.
Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
al termine, **annunciano** il risultato al canale di chat del richiedente.
Ogni esecuzione di sub-agent viene tracciata come
[attività in background](/it/automation/tasks).

Obiettivi principali:

- Parallelizzare il lavoro di "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sub-agent isolati per impostazione predefinita (separazione delle sessioni + sandboxing facoltativo).
- Mantenere la superficie degli strumenti difficile da usare in modo improprio: i sub-agent **non** ricevono strumenti di sessione per impostazione predefinita.
- Supportare una profondità di annidamento configurabile per i pattern di orchestrazione.

<Note>
**Nota sui costi:** ogni sub-agent ha il proprio contesto e il proprio utilizzo di token per
impostazione predefinita. Per attività pesanti o ripetitive, imposta un modello più economico per i sub-agent
e mantieni il tuo agent principale su un modello di qualità superiore. Configura tramite
`agents.defaults.subagents.model` o override per agent. Quando un figlio
    ha davvero bisogno della trascrizione corrente del richiedente, l'agent può richiedere
    `context: "fork"` per quella singola generazione. Le sessioni di subagent vincolate a thread usano per impostazione predefinita
    `context: "fork"` perché diramano la conversazione corrente in un
    thread di follow-up.
</Note>

## Comando slash

Usa `/subagents` per ispezionare o controllare le esecuzioni di sub-agent per la **sessione
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

Usa [`/steer <message>`](/it/tools/steer) di primo livello per guidare l'esecuzione attiva della sessione richiedente corrente. Usa `/subagents steer <id|#> <message>` quando la destinazione è un'esecuzione figlia.

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, id sessione,
percorso della trascrizione, pulizia). Usa `sessions_history` per una vista di richiamo limitata
e filtrata per sicurezza; ispeziona il percorso della trascrizione su disco quando
hai bisogno della trascrizione completa grezza.

### Controlli di associazione dei thread

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
  <Accordion title="Completamento non bloccante, basato su push">
    - Il comando di generazione non è bloccante; restituisce immediatamente un id di esecuzione.
    - Al completamento, il sub-agent annuncia un messaggio di riepilogo/risultato al canale di chat del richiedente.
    - Il completamento è basato su push. Dopo la generazione, **non** eseguire polling di `/subagents list`, `sessions_list` o `sessions_history` in un ciclo solo per attendere il termine; ispeziona lo stato solo su richiesta per debug o intervento.
    - Al completamento, OpenClaw chiude con il massimo impegno le schede/processi del browser tracciati aperti da quella sessione di sub-agent prima che il flusso di pulizia dell'annuncio continui.

  </Accordion>
  <Accordion title="Resilienza della consegna con generazione manuale">
    - OpenClaw restituisce i completamenti alla sessione richiedente tramite un turno `agent` con una chiave di idempotenza stabile.
    - Se l'esecuzione richiedente è ancora attiva, OpenClaw prova prima a riattivare/guidare quell'esecuzione invece di avviare un secondo percorso di risposta visibile.
    - Se il passaggio di completamento all'agent richiedente fallisce o non produce output visibile, OpenClaw considera la consegna fallita e ripiega su instradamento in coda/riprova. Non invia grezzamente il risultato figlio direttamente alla chat esterna.
    - Se il passaggio diretto non può essere usato, ripiega sull'instradamento in coda.
    - Se l'instradamento in coda non è ancora disponibile, l'annuncio viene riprovato con un breve backoff esponenziale prima della rinuncia definitiva.
    - La consegna del completamento mantiene la route risolta del richiedente: le route di completamento vincolate a thread o a conversazione prevalgono quando disponibili; se l'origine del completamento fornisce solo un canale, OpenClaw completa la destinazione/account mancante dalla route risolta della sessione richiedente (`lastChannel` / `lastTo` / `lastAccountId`) in modo che la consegna diretta funzioni comunque.

  </Accordion>
  <Accordion title="Metadati del passaggio di completamento">
    Il passaggio di completamento alla sessione richiedente è contesto interno
    generato a runtime (non testo scritto dall'utente) e include:

    - `Result` — testo dell'ultima risposta `assistant` visibile, altrimenti testo dell'ultimo strumento/toolResult sanificato. Le esecuzioni terminali fallite non riutilizzano il testo della risposta acquisita.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistiche compatte di runtime/token.
    - Un'istruzione di consegna che indica all'agent richiedente di riscrivere con la normale voce dell'assistant (senza inoltrare metadati interni grezzi).

  </Accordion>
  <Accordion title="Modalità e runtime ACP">
    - `--model` e `--thinking` sostituiscono i valori predefiniti per quella specifica esecuzione.
    - Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
    - `/subagents spawn` è modalità one-shot (`mode: "run"`). Per sessioni persistenti vincolate a thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Per sessioni di harness ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx esplicito), usa `sessions_spawn` con `runtime: "acp"` quando lo strumento pubblicizza quel runtime. Vedi [Modello di consegna ACP](/it/tools/acp-agents#delivery-model) durante il debug di completamenti o cicli agent-to-agent. Quando il plugin `codex` è abilitato, il controllo di chat/thread di Codex dovrebbe preferire `/codex ...` rispetto ad ACP, salvo richiesta esplicita dell'utente per ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è in sandbox e un plugin backend come `acpx` è caricato. `runtime: "acp"` si aspetta un id di harness ACP esterno, oppure una voce `agents.list[]` con `runtime.type="acp"`; usa il runtime sub-agent predefinito per i normali agent di configurazione OpenClaw da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sub-agent nativi partono isolati salvo che il chiamante richieda esplicitamente di diramare
la trascrizione corrente.

| Modalità   | Quando usarla                                                                                                                          | Comportamento                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Ricerca nuova, implementazione indipendente, lavoro con strumenti lenti o qualsiasi cosa che possa essere sintetizzata nel testo dell'attività | Crea una trascrizione figlia pulita. Questa è l'impostazione predefinita e riduce l'uso di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, dai risultati precedenti degli strumenti o da istruzioni sfumate già presenti nella trascrizione del richiedente | Dirama la trascrizione del richiedente nella sessione figlia prima dell'avvio del figlio. |

Usa `fork` con parsimonia. Serve per la delega sensibile al contesto, non come
sostituto della scrittura di un prompt di attività chiaro.

## Strumento: `sessions_spawn`

Avvia un'esecuzione di sub-agent con `deliver: false` sulla lane globale `subagent`,
poi esegue un passaggio di annuncio e pubblica la risposta dell'annuncio nel canale di
chat del richiedente.

La disponibilità dipende dalla policy effettiva degli strumenti del chiamante. I profili `coding` e
`full` espongono `sessions_spawn` per impostazione predefinita. Il profilo `messaging`
non lo fa; aggiungi `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` o usa `tools.profile: "coding"` per gli agent che devono delegare
lavoro. Le policy di canale/gruppo, provider, sandbox e allow/deny per agent
possono comunque rimuovere lo strumento dopo la fase del profilo. Usa `/tools` dalla stessa
sessione per confermare l'elenco effettivo degli strumenti.

**Impostazioni predefinite:**

- **Modello:** eredita quello del chiamante salvo impostare `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agent); un valore esplicito di `sessions_spawn.model` prevale comunque.
- **Thinking:** eredita quello del chiamante salvo impostare `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agent); un valore esplicito di `sessions_spawn.thinking` prevale comunque.
- **Timeout di esecuzione:** se `sessions_spawn.runTimeoutSeconds` è omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ripiega su `0` (nessun timeout).

### Parametri dello strumento

<ParamField path="task" type="string" required>
  La descrizione dell'attività per il sub-agent.
</ParamField>
<ParamField path="label" type="string">
  Etichetta facoltativa leggibile da persone.
</ParamField>
<ParamField path="agentId" type="string">
  Genera sotto un altro id agent quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` è solo per harness ACP esterni (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx richiesto esplicitamente) e per voci `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Riprende una sessione di harness ACP esistente quando `runtime: "acp"`; ignorato per generazioni di sub-agent native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Trasmette in streaming l'output dell'esecuzione ACP alla sessione padre quando `runtime: "acp"`; ometti per generazioni di sub-agent native.
</ParamField>
<ParamField path="model" type="string">
  Sostituisce il modello del sub-agent. I valori non validi vengono ignorati e il sub-agent viene eseguito sul modello predefinito con un avviso nel risultato dello strumento.
</ParamField>
<ParamField path="thinking" type="string">
  Sostituisce il livello di thinking per l'esecuzione del sub-agent.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Usa per impostazione predefinita `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`. Quando impostato, l'esecuzione del sub-agent viene interrotta dopo N secondi.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, richiede l'associazione al thread del canale per questa sessione di sub-agent.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta la generazione salvo che il runtime figlio di destinazione sia in sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` dirama la trascrizione corrente del richiedente nella sessione figlia. Solo sub-agent nativi. Le generazioni vincolate a thread usano per impostazione predefinita `fork`; le generazioni non vincolate a thread usano per impostazione predefinita `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di consegna del canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna, usa
`message`/`sessions_send` dall'esecuzione generata.
</Warning>

## Sessioni vincolate a thread

Quando le associazioni dei thread sono abilitate per un canale, un sub-agent può rimanere vincolato
a un thread in modo che i messaggi utente di follow-up in quel thread continuino a essere instradati alla
stessa sessione di sub-agent.

### Canali che supportano i thread

**Discord** è attualmente l'unico canale supportato. Supporta
sessioni subagent persistenti vincolate a thread (`sessions_spawn` con
`thread: true`), controlli manuali dei thread (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chiavi adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSessions`.

### Flusso rapido

<Steps>
  <Step title="Spawn">
    `sessions_spawn` con `thread: true` (e facoltativamente `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw crea o associa un thread a quella destinazione di sessione nel canale attivo.
  </Step>
  <Step title="Route follow-ups">
    Le risposte e i messaggi di follow-up in quel thread vengono instradati alla sessione associata.
  </Step>
  <Step title="Inspect timeouts">
    Usa `/session idle` per ispezionare/aggiornare la defocalizzazione automatica per inattività e
    `/session max-age` per controllare il limite massimo rigido.
  </Step>
  <Step title="Detach">
    Usa `/unfocus` per scollegare manualmente.
  </Step>
</Steps>

### Controlli manuali

| Comando            | Effetto                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Associa il thread corrente (o ne crea uno) a una destinazione di sub-agente/sessione |
| `/unfocus`         | Rimuove l'associazione per il thread attualmente associato                       |
| `/agents`          | Elenca le esecuzioni attive e lo stato di associazione (`thread:<id>` o `unbound`)       |
| `/session idle`    | Ispeziona/aggiorna la defocalizzazione automatica per inattività (solo thread associati focalizzati)         |
| `/session max-age` | Ispeziona/aggiorna il limite massimo rigido (solo thread associati focalizzati)                  |

### Switch di configurazione

- **Predefinito globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override del canale e chiavi di associazione automatica allo spawn** sono specifici dell'adapter. Vedi [Canali con supporto ai thread](#thread-supporting-channels) sopra.

Vedi [Riferimento di configurazione](/it/gateway/configuration-reference) e
[Comandi slash](/it/tools/slash-commands) per i dettagli correnti degli adapter.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco di ID agente che possono essere scelti come destinazione tramite `agentId` esplicito (`["*"]` consente qualsiasi valore). Predefinito: solo l'agente richiedente. Se imposti un elenco e vuoi comunque che il richiedente possa avviare se stesso con `agentId`, includi l'ID del richiedente nell'elenco.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist predefinita degli agenti di destinazione usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Override per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta le destinazioni
che verrebbero eseguite senza sandbox.

### Individuazione

Usa `agents_list` per vedere quali ID agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo di ciascun agente elencato
e i metadati di runtime incorporati, così i chiamanti possono distinguere Pi, Codex
app-server e altri runtime nativi configurati.

### Archiviazione automatica

- Le sessioni dei sub-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito `60`).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia subito dopo l'annuncio (conserva comunque la trascrizione tramite rinomina).
- L'archiviazione automatica è best-effort; i timer in sospeso vengono persi se il Gateway si riavvia.
- `runTimeoutSeconds` **non** archivia automaticamente; interrompe solo l'esecuzione. La sessione rimane fino all'archiviazione automatica.
- L'archiviazione automatica si applica allo stesso modo alle sessioni di profondità 1 e profondità 2.
- La pulizia del browser è separata dalla pulizia dell'archivio: le schede/processi del browser tracciati vengono chiusi best-effort al termine dell'esecuzione, anche se la trascrizione/record di sessione viene conservato.

## Sub-agenti annidati

Per impostazione predefinita, i sub-agenti non possono generare i propri sub-agenti
(`maxSpawnDepth: 1`). Imposta `maxSpawnDepth: 2` per abilitare un livello di
annidamento — il **pattern orchestratore**: agente principale → sub-agente orchestratore →
sub-sub-agenti worker.

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

| Profondità | Forma della chiave di sessione                | Ruolo                                         | Può generare?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principale                             | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agente (orchestratore quando la profondità 2 è consentita) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agente (worker foglia)                | Mai                          |

### Catena di annunci

I risultati risalgono la catena:

1. Il worker di profondità 2 termina → annuncia al suo genitore (orchestratore di profondità 1).
2. L'orchestratore di profondità 1 riceve l'annuncio, sintetizza i risultati, termina → annuncia all'agente principale.
3. L'agente principale riceve l'annuncio e lo consegna all'utente.

Ogni livello vede solo gli annunci dei suoi figli diretti.

<Note>
**Indicazioni operative:** avvia il lavoro dei figli una sola volta e attendi gli
eventi di completamento invece di costruire cicli di polling attorno a `sessions_list`,
`sessions_history`, `/subagents list` o comandi `exec` sleep.
`sessions_list` e `/subagents list` mantengono le relazioni tra sessioni figlie
focalizzate sul lavoro live — i figli live restano collegati, i figli terminati rimangono
visibili per una breve finestra recente, e i link dei figli obsoleti presenti solo nello store
vengono ignorati dopo la loro finestra di freschezza. Questo impedisce ai vecchi metadati
`spawnedBy` / `parentSessionKey` di far riapparire figli fantasma dopo
il riavvio. Se un evento di completamento di un figlio arriva dopo che hai già inviato la
risposta finale, il follow-up corretto è l'esatto token silenzioso
`NO_REPLY` / `no_reply`.
</Note>

### Policy degli strumenti per profondità

- Il ruolo e l'ambito di controllo vengono scritti nei metadati di sessione al momento dello spawn. Questo impedisce a chiavi di sessione piatte o ripristinate di riottenere accidentalmente i privilegi di orchestratore.
- **Profondità 1 (orchestratore, quando `maxSpawnDepth >= 2`):** riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può gestire i propri figli. Gli altri strumenti di sessione/sistema rimangono negati.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito corrente).
- **Profondità 2 (worker foglia):** nessuno strumento di sessione — `sessions_spawn` è sempre negato alla profondità 2. Non può generare altri figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo `maxChildrenPerAgent`
(predefinito `5`) figli attivi contemporaneamente. Questo impedisce una proliferazione incontrollata
da un singolo orchestratore.

### Arresto a cascata

Fermare un orchestratore di profondità 1 ferma automaticamente tutti i suoi figli di profondità 2:

- `/stop` nella chat principale ferma tutti gli agenti di profondità 1 e propaga l'arresto ai loro figli di profondità 2.
- `/subagents kill <id>` ferma un sub-agente specifico e propaga l'arresto ai suoi figli.
- `/subagents kill all` ferma tutti i sub-agenti per il richiedente e propaga l'arresto.

## Autenticazione

L'autenticazione dei sub-agenti viene risolta per **ID agente**, non per tipo di sessione:

- La chiave di sessione del sub-agente è `agent:<agentId>:subagent:<uuid>`.
- Lo store di autenticazione viene caricato dall'`agentDir` di quell'agente.
- I profili di autenticazione dell'agente principale vengono uniti come **fallback**; i profili dell'agente prevalgono sui profili principali in caso di conflitto.

L'unione è additiva, quindi i profili principali sono sempre disponibili come
fallback. L'autenticazione completamente isolata per agente non è ancora supportata.

## Annuncio

I sub-agenti riferiscono tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito dentro la sessione del sub-agente (non nella sessione richiedente).
- Se il sub-agente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se l'ultimo testo dell'assistente è l'esatto token silenzioso `NO_REPLY` / `no_reply`, l'output dell'annuncio viene soppresso anche se in precedenza erano presenti avanzamenti visibili.

La consegna dipende dalla profondità del richiedente:

- Le sessioni richiedenti di primo livello usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`).
- Le sessioni subagente richiedenti annidate ricevono un'iniezione interna di follow-up (`deliver=false`) così l'orchestratore può sintetizzare i risultati dei figli nella sessione.
- Se una sessione subagente richiedente annidata non esiste più, OpenClaw ripiega sul richiedente di quella sessione quando disponibile.

Per le sessioni richiedenti di primo livello, la consegna diretta in modalità completamento
risolve prima qualsiasi percorso di conversazione/thread associato e override dell'hook, poi completa
i campi mancanti della destinazione del canale dal percorso memorizzato della sessione richiedente.
Questo mantiene i completamenti nella chat/topic corretti anche quando l'origine del completamento
identifica solo il canale.

L'aggregazione dei completamenti dei figli è limitata all'esecuzione richiedente corrente quando
costruisce i risultati di completamento annidati, impedendo agli output dei figli di esecuzioni precedenti
obsolete di trapelare nell'annuncio corrente. Le risposte di annuncio preservano
l'instradamento di thread/topic quando disponibile sugli adapter di canale.

### Contesto dell'annuncio

Il contesto dell'annuncio viene normalizzato in un blocco evento interno stabile:

| Campo          | Origine                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origine        | `subagent` o `cron`                                                                                          |
| ID sessione    | Chiave/ID della sessione figlia                                                                                          |
| Tipo           | Tipo di annuncio + etichetta del task                                                                                    |
| Stato          | Derivato dall'esito del runtime (`success`, `error`, `timeout` o `unknown`) — **non** inferito dal testo del modello |
| Contenuto risultato | Ultimo testo visibile dell'assistente, altrimenti l'ultimo testo strumento/toolResult sanificato                                |
| Follow-up      | Istruzione che descrive quando rispondere rispetto a rimanere silenziosi                                                           |

Le esecuzioni terminali non riuscite riportano lo stato di errore senza riprodurre
il testo di risposta catturato. In caso di timeout, se il figlio è arrivato solo fino alle chiamate strumento, l'annuncio
può comprimere quella cronologia in un breve riepilogo di avanzamento parziale invece
di riprodurre l'output grezzo dello strumento.

### Riga delle statistiche

I payload di annuncio includono una riga di statistiche alla fine (anche quando sono incapsulati):

- Runtime (per esempio `runtime 5m12s`).
- Utilizzo dei token (input/output/totale).
- Costo stimato quando il pricing del modello è configurato (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e percorso della trascrizione così l'agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco.

I metadati interni sono pensati solo per l'orchestrazione; le risposte rivolte all'utente
dovrebbero essere riscritte con la normale voce dell'assistente.

### Perché preferire `sessions_history`

`sessions_history` è il percorso di orchestrazione più sicuro:

- Il richiamo dell'assistente viene prima normalizzato: tag di ragionamento rimossi; scaffolding `<relevant-memories>` / `<relevant_memories>` rimosso; blocchi payload XML di chiamate strumento in testo semplice (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) rimossi, inclusi i payload troncati che non si chiudono correttamente; scaffolding degradato di chiamate/risultati strumento e marcatori di contesto storico rimossi; token di controllo del modello trapelati (`<|assistant|>`, altri ASCII `<|...|>`, full-width `<｜...｜>`) rimossi; XML malformato di chiamate strumento MiniMax rimosso.
- Il testo simile a credenziali/token viene redatto.
- I blocchi lunghi possono essere troncati.
- Le cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga sovradimensionata con `[sessions_history omitted: message too large]`.
- L'ispezione della trascrizione grezza su disco è il fallback quando hai bisogno della trascrizione completa byte per byte.

## Policy degli strumenti

I sotto-agenti usano prima lo stesso profilo e la stessa pipeline dei criteri degli strumenti dell'agente padre o dell'agente di destinazione. Dopo di ciò, OpenClaw applica il livello di restrizione dei sotto-agenti.

Senza un `tools.profile` restrittivo, i sotto-agenti ricevono **tutti gli strumenti tranne gli strumenti di sessione** e gli strumenti di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` rimane una vista di richiamo limitata e sanificata: non è un dump grezzo della trascrizione.

Quando `maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondità 1 ricevono inoltre `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history`, così possono gestire i propri figli.

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

`tools.subagents.tools.allow` è un filtro finale solo allow. Può restringere l'insieme di strumenti già risolto, ma non può **aggiungere di nuovo** uno strumento rimosso da `tools.profile`. Per esempio, `tools.profile: "coding"` include `web_search`/`web_fetch` ma non lo strumento `browser`. Per consentire ai sotto-agenti con profilo coding di usare l'automazione del browser, aggiungi browser nella fase del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` per agente quando solo un agente deve ricevere l'automazione del browser.

## Concorrenza

I sotto-agenti usano una corsia di coda dedicata nello stesso processo:

- **Nome della corsia:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Vitalità e ripristino

OpenClaw non considera l'assenza di `endedAt` come prova permanente che un sotto-agente sia ancora vivo. Le esecuzioni non concluse più vecchie della finestra per le esecuzioni stale smettono di essere conteggiate come attive/in sospeso in `/subagents list`, nei riepiloghi di stato, nel gating di completamento dei discendenti e nei controlli di concorrenza per sessione.

Dopo un riavvio del Gateway, le esecuzioni ripristinate stale e non concluse vengono eliminate, a meno che la loro sessione figlia sia contrassegnata con `abortedLastRun: true`. Queste sessioni figlie interrotte dal riavvio restano recuperabili tramite il flusso di recupero degli orfani dei sotto-agenti, che invia un messaggio sintetico di ripresa prima di cancellare il marcatore di interruzione.

Il recupero automatico dopo il riavvio è limitato per sessione figlia. Se lo stesso figlio di sotto-agente viene accettato per il recupero degli orfani ripetutamente dentro la finestra di rapido nuovo blocco, OpenClaw persiste una tombstone di recupero su quella sessione e smette di riprenderla automaticamente ai riavvii successivi. Esegui `openclaw tasks maintenance --apply` per riconciliare il record dell'attività, oppure `openclaw doctor --fix` per cancellare i flag stale di recupero interrotto sulle sessioni tombstoned.

<Note>
Se la creazione di un sotto-agente non riesce con Gateway `PAIRING_REQUIRED` / `scope-upgrade`, controlla il chiamante RPC prima di modificare lo stato di pairing. Il coordinamento interno `sessions_spawn` dovrebbe connettersi come `client.id: "gateway-client"` con `client.mode: "backend"` tramite autenticazione shared-token/password su loopback diretto; quel percorso non dipende dalla baseline di ambito del dispositivo associato della CLI. I chiamanti remoti, `deviceIdentity` espliciti, i percorsi espliciti con device-token e i client browser/node richiedono comunque la normale approvazione del dispositivo per gli upgrade di ambito.
</Note>

## Arresto

- L'invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta qualsiasi esecuzione attiva di sotto-agente creata da essa, propagandosi ai figli annidati.
- `/subagents kill <id>` arresta uno specifico sotto-agente e si propaga ai suoi figli.

## Limitazioni

- L'annuncio dei sotto-agenti è **best-effort**. Se il Gateway si riavvia, il lavoro "announce back" in sospeso viene perso.
- I sotto-agenti condividono comunque le stesse risorse del processo Gateway; considera `maxConcurrent` come una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto dei sotto-agenti inietta solo `AGENTS.md` + `TOOLS.md` (nessun `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di annidamento è 5 (intervallo di `maxSpawnDepth`: 1–5). La profondità 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito `5`, intervallo `1–20`).

## Correlati

- [Agenti ACP](/it/tools/acp-agents)
- [Invio ad agente](/it/tools/agent-send)
- [Attività in background](/it/automation/tasks)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
