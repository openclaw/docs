---
read_when:
    - Vuoi svolgere attività in secondo piano o in parallelo tramite l'agente
    - Stai modificando sessions_spawn o la policy dello strumento sub-agent
    - Stai implementando o risolvendo problemi relativi alle sessioni di subagenti vincolate al thread
sidebarTitle: Sub-agents
summary: Avvia esecuzioni isolate di agenti in secondo piano che comunicano i risultati alla chat del richiedente
title: Sottoagenti
x-i18n:
    generated_at: "2026-05-07T01:54:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 901311ae7766640ff6991f66a63070fddef47d79ef5385d2c1af84be34a5140e
    source_path: tools/subagents.md
    workflow: 16
---

I sotto-agenti sono esecuzioni di agenti in background avviate da un'esecuzione di agente esistente.
Eseguono nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
quando terminano, **annunciano** il loro risultato al canale chat
del richiedente. Ogni esecuzione di sotto-agente viene tracciata come una
[attività in background](/it/automation/tasks).

Per il modello di sicurezza alla base della delega, consulta
[Confini multi-agente e sotto-agente](/it/gateway/security#multi-agent-and-sub-agent-boundaries).
I sotto-agenti sono unità utili per isolamento e workflow, ma non sono un confine di autorizzazione
multi-tenant ostile all'interno di un Gateway condiviso.

Obiettivi principali:

- Parallelizzare il lavoro di "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sotto-agenti isolati per impostazione predefinita (separazione delle sessioni + sandboxing facoltativo).
- Rendere la superficie degli strumenti difficile da usare in modo improprio: i sotto-agenti **non** ricevono gli strumenti di sessione per impostazione predefinita.
- Supportare una profondità di nidificazione configurabile per pattern di orchestrazione.

<Note>
**Nota sui costi:** ogni sotto-agente ha il proprio contesto e il proprio utilizzo di token per
impostazione predefinita. Per attività pesanti o ripetitive, imposta un modello più economico per i sotto-agenti
e mantieni l'agente principale su un modello di qualità superiore. Configura tramite
`agents.defaults.subagents.model` o override per agente. Quando un figlio
    ha davvero bisogno della trascrizione corrente del richiedente, l'agente può richiedere
    `context: "fork"` per quel singolo avvio. Le sessioni di sotto-agente vincolate a thread usano per impostazione predefinita
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

Usa [`/steer <message>`](/it/tools/steer) di primo livello per guidare l'esecuzione attiva della sessione richiedente corrente. Usa `/subagents steer <id|#> <message>` quando la destinazione è un'esecuzione figlia.

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, id sessione,
percorso della trascrizione, pulizia). Usa `sessions_history` per una vista di richiamo limitata e filtrata per sicurezza; ispeziona il percorso della trascrizione su disco quando
ti serve la trascrizione completa grezza.

### Controlli di vincolo al thread

Questi comandi funzionano sui canali che supportano vincoli persistenti ai thread.
Vedi [Canali che supportano i thread](#thread-supporting-channels) sotto.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento di avvio

`/subagents spawn` avvia un sotto-agente in background come comando utente (non un
relay interno) e invia un ultimo aggiornamento di completamento alla
chat del richiedente quando l'esecuzione termina.

<AccordionGroup>
  <Accordion title="Completamento non bloccante, basato su push">
    - Il comando di avvio non è bloccante; restituisce subito un id esecuzione.
    - Al completamento, il sotto-agente annuncia un messaggio di riepilogo/risultato al canale chat del richiedente.
    - Il completamento è basato su push. Dopo l'avvio, **non** eseguire polling di `/subagents list`, `sessions_list` o `sessions_history` in un ciclo solo per attendere che finisca; ispeziona lo stato solo su richiesta per debug o intervento.
    - Al completamento, OpenClaw chiude al meglio le schede/processi del browser tracciati aperti da quella sessione di sotto-agente prima che il flusso di pulizia dell'annuncio continui.

  </Accordion>
  <Accordion title="Resilienza della consegna per avvio manuale">
    - OpenClaw prova prima la consegna diretta `agent` con una chiave di idempotenza stabile.
    - Se il turno di completamento dell'agente richiedente fallisce, non produce output visibile o restituisce un prefisso palesemente incompleto del risultato figlio catturato, OpenClaw ripiega sulla consegna diretta del completamento dal risultato figlio catturato.
    - Se non è possibile usare la consegna diretta, ripiega sul routing tramite coda.
    - Se il routing tramite coda non è ancora disponibile, l'annuncio viene riprovato con un breve backoff esponenziale prima della rinuncia finale.
    - La consegna del completamento mantiene la route del richiedente risolta: le route di completamento vincolate a thread o conversazione prevalgono quando disponibili; se l'origine del completamento fornisce solo un canale, OpenClaw completa target/account mancanti dalla route risolta della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta continua a funzionare.

  </Accordion>
  <Accordion title="Metadati di passaggio del completamento">
    Il passaggio del completamento alla sessione richiedente è contesto interno generato a runtime
    (non testo scritto dall'utente) e include:

    - `Result` — il testo dell'ultima risposta visibile `assistant`, altrimenti il testo dell'ultimo tool/toolResult sanificato. Le esecuzioni terminali fallite non riutilizzano il testo di risposta catturato.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistiche runtime/token compatte.
    - Un'istruzione di consegna che indica all'agente richiedente di riscrivere con la normale voce dell'assistente (non inoltrare metadati interni grezzi).

  </Accordion>
  <Accordion title="Modalità e runtime ACP">
    - `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
    - Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
    - `/subagents spawn` è una modalità one-shot (`mode: "run"`). Per sessioni persistenti vincolate a thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Per le sessioni harness ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx esplicito), usa `sessions_spawn` con `runtime: "acp"` quando lo strumento pubblicizza quel runtime. Vedi [Modello di consegna ACP](/it/tools/acp-agents#delivery-model) durante il debug di completamenti o loop agente-agente. Quando il Plugin `codex` è abilitato, il controllo chat/thread di Codex dovrebbe preferire `/codex ...` rispetto ad ACP salvo richiesta esplicita dell'utente per ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è in sandbox e viene caricato un Plugin backend come `acpx`. `runtime: "acp"` si aspetta un id harness ACP esterno o una voce `agents.list[]` con `runtime.type="acp"`; usa il runtime di sotto-agente predefinito per i normali agenti di configurazione OpenClaw da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sotto-agenti nativi partono isolati salvo che il chiamante richieda esplicitamente di biforcare
la trascrizione corrente.

| Modalità   | Quando usarla                                                                                                                          | Comportamento                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `isolated` | Ricerca nuova, implementazione indipendente, lavoro con strumenti lenti o qualsiasi cosa che possa essere descritta nel testo dell'attività | Crea una trascrizione figlia pulita. È il valore predefinito e mantiene più basso l'uso di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, da risultati precedenti degli strumenti o da istruzioni sfumate già presenti nella trascrizione del richiedente | Dirama la trascrizione del richiedente nella sessione figlia prima dell'avvio del figlio. |

Usa `fork` con parsimonia. Serve per delega sensibile al contesto, non come
sostituto della scrittura di un prompt di attività chiaro.

## Strumento: `sessions_spawn`

Avvia un'esecuzione di sotto-agente con `deliver: false` sulla corsia globale `subagent`,
poi esegue un passaggio di annuncio e pubblica la risposta di annuncio sul canale chat
del richiedente.

La disponibilità dipende dalla policy effettiva degli strumenti del chiamante. I profili `coding` e
`full` espongono `sessions_spawn` per impostazione predefinita. Il profilo `messaging`
no; aggiungi `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` oppure usa `tools.profile: "coding"` per gli agenti che dovrebbero delegare
lavoro. Le policy di canale/gruppo, provider, sandbox e allow/deny per agente possono
ancora rimuovere lo strumento dopo la fase del profilo. Usa `/tools` dalla stessa
sessione per confermare l'elenco effettivo degli strumenti.

**Valori predefiniti:**

- **Modello:** eredita il chiamante salvo che imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente); un `sessions_spawn.model` esplicito prevale comunque.
- **Thinking:** eredita il chiamante salvo che imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente); un `sessions_spawn.thinking` esplicito prevale comunque.
- **Timeout esecuzione:** se `sessions_spawn.runTimeoutSeconds` è omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ripiega su `0` (nessun timeout).

### Parametri dello strumento

<ParamField path="task" type="string" required>
  La descrizione dell'attività per il sotto-agente.
</ParamField>
<ParamField path="label" type="string">
  Etichetta opzionale leggibile da una persona.
</ParamField>
<ParamField path="agentId" type="string">
  Avvia sotto un altro id agente quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` è solo per harness ACP esterni (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx richiesto esplicitamente) e per voci `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Riprende una sessione harness ACP esistente quando `runtime: "acp"`; ignorato per gli avvii di sotto-agenti nativi.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Trasmette in streaming l'output dell'esecuzione ACP alla sessione padre quando `runtime: "acp"`; ometti per gli avvii di sotto-agenti nativi.
</ParamField>
<ParamField path="model" type="string">
  Sovrascrive il modello del sotto-agente. I valori non validi vengono saltati e il sotto-agente viene eseguito sul modello predefinito con un avviso nel risultato dello strumento.
</ParamField>
<ParamField path="thinking" type="string">
  Sovrascrive il livello di thinking per l'esecuzione del sotto-agente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Predefinito a `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`. Quando impostato, l'esecuzione del sotto-agente viene interrotta dopo N secondi.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, richiede il vincolo al thread del canale per questa sessione di sotto-agente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta l'avvio salvo che il runtime figlio di destinazione sia in sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` dirama la trascrizione corrente del richiedente nella sessione figlia. Solo sotto-agenti nativi. Gli avvii vincolati a thread usano per impostazione predefinita `fork`; gli avvii non-thread usano per impostazione predefinita `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di consegna al canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna, usa
`message`/`sessions_send` dall'esecuzione avviata.
</Warning>

## Sessioni vincolate a thread

Quando i vincoli ai thread sono abilitati per un canale, un sotto-agente può restare vincolato
a un thread così i messaggi utente successivi in quel thread continuano a essere instradati alla
stessa sessione di sotto-agente.

### Canali che supportano i thread

**Discord** è attualmente l'unico canale supportato. Supporta
sessioni di sotto-agente persistenti vincolate a thread (`sessions_spawn` con
`thread: true`), controlli manuali del thread (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chiavi dell'adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSessions`.

### Flusso rapido

<Steps>
  <Step title="Avvio">
    `sessions_spawn` con `thread: true` (e facoltativamente `mode: "session"`).
  </Step>
  <Step title="Associazione">
    OpenClaw crea o associa una discussione a quel target di sessione nel canale attivo.
  </Step>
  <Step title="Instradamento dei messaggi successivi">
    Le risposte e i messaggi successivi in quella discussione vengono instradati alla sessione associata.
  </Step>
  <Step title="Controllo dei timeout">
    Usa `/session idle` per controllare/aggiornare la rimozione automatica del focus per inattività e
    `/session max-age` per controllare il limite rigido.
  </Step>
  <Step title="Scollegamento">
    Usa `/unfocus` per scollegare manualmente.
  </Step>
</Steps>

### Controlli manuali

| Comando            | Effetto                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| `/focus <target>`  | Associa la discussione corrente (o ne crea una) a un target di sotto-agente/sessione |
| `/unfocus`         | Rimuove l'associazione per la discussione attualmente associata               |
| `/agents`          | Elenca le esecuzioni attive e lo stato di associazione (`thread:<id>` o `unbound`) |
| `/session idle`    | Controlla/aggiorna la rimozione automatica del focus per inattività (solo discussioni associate con focus) |
| `/session max-age` | Controlla/aggiorna il limite rigido (solo discussioni associate con focus)    |

### Interruttori di configurazione

- **Predefinito globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Le chiavi di sovrascrittura del canale e di associazione automatica all'avvio** sono specifiche dell'adattatore. Vedi [Canali con supporto per le discussioni](#thread-supporting-channels) sopra.

Vedi [Riferimento di configurazione](/it/gateway/configuration-reference) e
[Comandi slash](/it/tools/slash-commands) per i dettagli attuali degli adattatori.

### Lista consentita

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco degli ID agente che possono essere indicati come target tramite `agentId` esplicito (`["*"]` consente qualsiasi valore). Predefinito: solo l'agente richiedente. Se imposti un elenco e vuoi comunque che il richiedente avvii se stesso con `agentId`, includi l'ID del richiedente nell'elenco.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista consentita predefinita degli agenti target usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Sovrascrittura per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta i target
che verrebbero eseguiti senza sandbox.

### Rilevamento

Usa `agents_list` per vedere quali ID agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo e i metadati
dell'ambiente di esecuzione incorporati di ciascun agente elencato, così i chiamanti possono distinguere PI, Codex
app-server e altri ambienti di esecuzione nativi configurati.

### Archiviazione automatica

- Le sessioni dei sotto-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito `60`).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
- L'archiviazione automatica è al meglio possibile; i timer in sospeso vengono persi se il Gateway si riavvia.
- `runTimeoutSeconds` **non** archivia automaticamente; interrompe solo l'esecuzione. La sessione rimane fino all'archiviazione automatica.
- L'archiviazione automatica si applica allo stesso modo alle sessioni di profondità 1 e profondità 2.
- La pulizia del browser è separata dalla pulizia dell'archivio: le schede/i processi del browser tracciati vengono chiusi quando possibile al termine dell'esecuzione, anche se la trascrizione/il record della sessione viene mantenuto.

## Sotto-agenti annidati

Per impostazione predefinita, i sotto-agenti non possono avviare i propri sotto-agenti
(`maxSpawnDepth: 1`). Imposta `maxSpawnDepth: 2` per abilitare un livello di
annidamento — il **modello dell'orchestratore**: principale → sotto-agente orchestratore →
sotto-sotto-agenti esecutori.

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

| Profondità | Forma della chiave di sessione              | Ruolo                                        | Può avviare?                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principale                             | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sotto-agente (orchestratore quando è consentita la profondità 2) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sotto-agente (esecutore foglia)         | Mai                          |

### Catena di annuncio

I risultati risalgono la catena:

1. L'esecutore di profondità 2 termina → annuncia al proprio genitore (orchestratore di profondità 1).
2. L'orchestratore di profondità 1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al principale.
3. L'agente principale riceve l'annuncio e lo consegna all'utente.

Ogni livello vede solo gli annunci dei propri figli diretti.

<Note>
**Indicazioni operative:** avvia il lavoro figlio una sola volta e attendi gli eventi di completamento
invece di costruire cicli di interrogazione attorno a `sessions_list`,
`sessions_history`, `/subagents list` o comandi `exec` con sleep.
`sessions_list` e `/subagents list` mantengono le relazioni delle sessioni figlie
concentrate sul lavoro attivo — i figli attivi restano collegati, i figli terminati rimangono
visibili per una breve finestra recente e i collegamenti figli obsoleti presenti solo nell'archivio vengono
ignorati dopo la loro finestra di validità. Questo impedisce ai vecchi metadati `spawnedBy` /
`parentSessionKey` di far riapparire figli fantasma dopo
il riavvio. Se un evento di completamento figlio arriva dopo che hai già inviato la
risposta finale, il follow-up corretto è il token silenzioso esatto
`NO_REPLY` / `no_reply`.
</Note>

### Criterio degli strumenti per profondità

- Il ruolo e l'ambito di controllo vengono scritti nei metadati della sessione al momento dell'avvio. Questo impedisce alle chiavi di sessione piatte o ripristinate di riacquistare accidentalmente privilegi da orchestratore.
- **Profondità 1 (orchestratore, quando `maxSpawnDepth >= 2`):** ottiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può gestire i propri figli. Gli altri strumenti di sessione/sistema rimangono non consentiti.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito attuale).
- **Profondità 2 (esecutore foglia):** nessuno strumento di sessione — `sessions_spawn` è sempre negato a profondità 2. Non può avviare altri figli.

### Limite di avvio per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo `maxChildrenPerAgent`
(predefinito `5`) figli attivi alla volta. Questo evita un'espansione incontrollata
da un singolo orchestratore.

### Arresto a cascata

L'arresto di un orchestratore di profondità 1 arresta automaticamente tutti i suoi figli di profondità 2:

- `/stop` nella chat principale arresta tutti gli agenti di profondità 1 e propaga l'arresto ai loro figli di profondità 2.
- `/subagents kill <id>` arresta uno specifico sotto-agente e propaga l'arresto ai suoi figli.
- `/subagents kill all` arresta tutti i sotto-agenti per il richiedente e propaga l'arresto.

## Autenticazione

L'autenticazione dei sotto-agenti viene risolta per **ID agente**, non per tipo di sessione:

- La chiave di sessione del sotto-agente è `agent:<agentId>:subagent:<uuid>`.
- L'archivio di autenticazione viene caricato dall'`agentDir` di quell'agente.
- I profili di autenticazione dell'agente principale vengono uniti come **ripiego**; i profili dell'agente prevalgono sui profili principali in caso di conflitto.

L'unione è additiva, quindi i profili principali sono sempre disponibili come
ripieghi. L'autenticazione completamente isolata per agente non è ancora supportata.

## Annuncio

I sotto-agenti riportano i risultati tramite una fase di annuncio:

- La fase di annuncio viene eseguita all'interno della sessione del sotto-agente (non nella sessione richiedente).
- Se il sotto-agente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se il testo più recente dell'assistente è il token silenzioso esatto `NO_REPLY` / `no_reply`, l'output dell'annuncio viene soppresso anche se in precedenza esisteva un avanzamento visibile.

La consegna dipende dalla profondità del richiedente:

- Le sessioni richiedenti di livello superiore usano una chiamata `agent` successiva con consegna esterna (`deliver=true`).
- Le sessioni di sotto-agente richiedenti annidate ricevono un'iniezione interna successiva (`deliver=false`) così l'orchestratore può sintetizzare i risultati figli nella sessione.
- Se una sessione di sotto-agente richiedente annidata non esiste più, OpenClaw ripiega sul richiedente di quella sessione quando disponibile.

Per le sessioni richiedenti di livello superiore, la consegna diretta in modalità completamento
risolve prima qualsiasi route di conversazione/discussione associata e sovrascrittura dell'hook, poi riempie
i campi target di canale mancanti dalla route memorizzata della sessione richiedente.
Questo mantiene i completamenti nella chat/nell'argomento corretto anche quando l'origine del completamento
identifica solo il canale.

L'aggregazione dei completamenti figli è limitata all'esecuzione del richiedente corrente quando
costruisce i risultati di completamento annidati, impedendo agli output obsoleti dei figli
da esecuzioni precedenti di finire nell'annuncio corrente. Le risposte di annuncio preservano
l'instradamento di discussione/argomento quando disponibile sugli adattatori di canale.

### Contesto dell'annuncio

Il contesto dell'annuncio viene normalizzato in un blocco evento interno stabile:

| Campo          | Origine                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origine        | `subagent` o `cron`                                                                                           |
| ID sessione    | Chiave/id della sessione figlia                                                                               |
| Tipo           | Tipo di annuncio + etichetta dell'attività                                                                    |
| Stato          | Derivato dall'esito dell'esecuzione (`success`, `error`, `timeout` o `unknown`) — **non** dedotto dal testo del modello |
| Contenuto del risultato | Testo visibile più recente dell'assistente, altrimenti testo tool/toolResult più recente sanitizzato          |
| Risposta successiva | Istruzione che descrive quando rispondere o rimanere in silenzio                                          |

Le esecuzioni concluse con errore riportano lo stato di errore senza riprodurre il testo
della risposta acquisito. In caso di timeout, se il figlio è arrivato solo alle chiamate agli strumenti, l'annuncio
può condensare quella cronologia in un breve riepilogo dell'avanzamento parziale invece
di riprodurre l'output grezzo degli strumenti.

### Riga statistiche

I payload di annuncio includono una riga di statistiche alla fine (anche quando va a capo):

- Tempo di esecuzione (es. `runtime 5m12s`).
- Uso dei token (input/output/totale).
- Costo stimato quando i prezzi del modello sono configurati (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e percorso della trascrizione così l'agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco.

I metadati interni servono solo all'orchestrazione; le risposte rivolte all'utente
dovrebbero essere riscritte con la normale voce dell'assistente.

### Perché preferire `sessions_history`

`sessions_history` è il percorso di orchestrazione più sicuro:

- Il richiamo dell'assistente viene prima normalizzato: tag di ragionamento rimossi; struttura `<relevant-memories>` / `<relevant_memories>` rimossa; blocchi di payload XML delle chiamate agli strumenti in testo semplice (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) rimossi, inclusi i payload troncati che non si chiudono mai in modo pulito; struttura di chiamata/risultato strumento declassata e marcatori di contesto storico rimossi; token di controllo del modello trapelati (`<|assistant|>`, altri ASCII `<|...|>`, a larghezza piena `<｜...｜>`) rimossi; XML di chiamata strumento MiniMax malformato rimosso.
- Il testo simile a credenziali/token viene oscurato.
- I blocchi lunghi possono essere troncati.
- Cronologie molto grandi possono eliminare le righe più vecchie o sostituire una riga troppo grande con `[sessions_history omitted: message too large]`.
- L'ispezione grezza della trascrizione su disco è il ripiego quando serve la trascrizione completa byte per byte.

## Criterio degli strumenti

I sotto-agenti usano prima la stessa pipeline di profilo e criteri degli strumenti dell'agente padre o
di destinazione. Dopodiché, OpenClaw applica il livello di restrizione
dei sotto-agenti.

Senza un `tools.profile` restrittivo, i sotto-agenti ricevono **tutti gli strumenti tranne
gli strumenti di sessione** e gli strumenti di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` rimane una vista di richiamo limitata e sanitizzata: non
è un dump grezzo della trascrizione.

Quando `maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondità 1 ricevono inoltre
`sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history`, così possono gestire i propri figli.

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

`tools.subagents.tools.allow` è un filtro finale solo-consenti. Può restringere
l'insieme di strumenti già risolto, ma non può **aggiungere di nuovo** uno strumento rimosso
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

Usa `agents.list[].tools.alsoAllow: ["browser"]` per singolo agente quando solo un
agente deve ricevere l'automazione del browser.

## Concorrenza

I sotto-agenti usano una corsia di coda dedicata nello stesso processo:

- **Nome corsia:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Vitalità e ripristino

OpenClaw non considera l'assenza di `endedAt` una prova permanente che un
sotto-agente sia ancora attivo. Le esecuzioni non terminate più vecchie della finestra di esecuzione obsoleta
smettono di essere conteggiate come attive/in sospeso in `/subagents list`, nei riepiloghi di stato,
nel gating di completamento dei discendenti e nei controlli di concorrenza per sessione.

Dopo un riavvio del Gateway, le esecuzioni ripristinate obsolete e non terminate vengono eliminate, a meno che
la loro sessione figlia non sia contrassegnata con `abortedLastRun: true`. Tali
sessioni figlie interrotte dal riavvio restano recuperabili tramite il flusso di recupero degli orfani dei sotto-agenti,
che invia un messaggio di ripresa sintetico prima
di cancellare il marcatore di interruzione.

Il recupero automatico dopo riavvio è limitato per ogni sessione figlia. Se lo stesso
figlio di sotto-agente viene accettato ripetutamente per il recupero degli orfani all'interno della
finestra di reincastro rapido, OpenClaw registra una tombstone di recupero su quella
sessione e smette di riprenderla automaticamente nei riavvii successivi. Esegui
`openclaw tasks maintenance --apply` per riconciliare il record del task, oppure
`openclaw doctor --fix` per cancellare i flag di recupero interrotto obsoleti sulle
sessioni con tombstone.

<Note>
Se la generazione di un sotto-agente fallisce con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controlla il chiamante RPC prima di modificare lo stato di pairing.
Il coordinamento interno `sessions_spawn` deve connettersi come
`client.id: "gateway-client"` con `client.mode: "backend"` tramite autenticazione diretta
local loopback con token/password condivisi; quel percorso non dipende dalla
baseline di ambito dei dispositivi abbinati della CLI. I chiamanti remoti, `deviceIdentity`
esplicito, i percorsi con token dispositivo esplicito e i client browser/node
richiedono ancora la normale approvazione del dispositivo per gli upgrade di ambito.
</Note>

## Arresto

- L'invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta tutte le esecuzioni attive dei sotto-agenti generate da essa, con propagazione ai figli annidati.
- `/subagents kill <id>` arresta uno specifico sotto-agente e si propaga ai suoi figli.

## Limitazioni

- L'annuncio dei sotto-agenti è **best-effort**. Se il gateway si riavvia, il lavoro "announce back" in sospeso va perso.
- I sotto-agenti condividono comunque le risorse dello stesso processo gateway; considera `maxConcurrent` una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto dei sotto-agenti inietta solo `AGENTS.md` + `TOOLS.md` (nessun `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di annidamento è 5 (intervallo di `maxSpawnDepth`: 1-5). La profondità 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito `5`, intervallo `1-20`).

## Correlati

- [Agenti ACP](/it/tools/acp-agents)
- [Invio agente](/it/tools/agent-send)
- [Task in background](/it/automation/tasks)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
