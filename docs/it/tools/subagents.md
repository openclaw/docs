---
read_when:
    - Vuoi eseguire attività in background o in parallelo tramite l'agente
    - Stai modificando la policy dello strumento sessions_spawn o dei sottoagenti
    - Stai implementando o risolvendo problemi relativi alle sessioni dei sottoagenti associate ai thread
sidebarTitle: Sub-agents
summary: Avvia esecuzioni isolate di agenti in background che comunicano i risultati nella chat del richiedente
title: Sottoagenti
x-i18n:
    generated_at: "2026-07-12T07:35:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

I sotto-agenti sono esecuzioni di agenti in background avviate da un'esecuzione di agente esistente.
Ciascuno viene eseguito nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
al termine, **annuncia** il proprio risultato al canale di chat del richiedente.
Ogni esecuzione di sotto-agente viene registrata come [attività in background](/it/automation/tasks).

Obiettivi:

- Parallelizzare la ricerca, le attività lunghe e le operazioni lente degli strumenti senza bloccare l'esecuzione principale.
- Mantenere i sotto-agenti isolati per impostazione predefinita (separazione delle sessioni, uso facoltativo della sandbox).
- Rendere difficile un uso improprio degli strumenti: per impostazione predefinita, i sotto-agenti **non** ricevono strumenti per sessioni o messaggi.
- Supportare una profondità di annidamento configurabile per i modelli di orchestrazione.

<Note>
**Nota sui costi:** per impostazione predefinita, ogni sotto-agente dispone di un contesto e di un consumo di token propri.
Per attività impegnative o ripetitive, imposta un modello più economico per i sotto-agenti
e mantieni l'agente principale su un modello di qualità superiore tramite
`agents.defaults.subagents.model` o sostituzioni specifiche per agente. Quando un agente figlio
ha davvero bisogno della trascrizione corrente del richiedente, avvialo con
`context: "fork"`. Le sessioni dei sotto-agenti associate a un thread usano per impostazione predefinita
`context: "fork"` perché diramano la conversazione corrente in un
thread di proseguimento.
</Note>

## Comando slash

`/subagents` esamina le esecuzioni dei sotto-agenti per la **sessione corrente**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` mostra i metadati dell'esecuzione (stato, indicatori temporali, ID sessione,
percorso della trascrizione, pulizia). `/subagents log` stampa i turni di chat recenti di
un'esecuzione; aggiungi il token `tools` per includere i messaggi di chiamata/risultato degli strumenti
(omessi per impostazione predefinita). Usa `sessions_history` per una vista di richiamo limitata
e filtrata per sicurezza dall'interno di un turno dell'agente, oppure esamina il percorso della trascrizione
sul disco per consultare la trascrizione completa non elaborata.

### Controlli di associazione ai thread

Questi comandi funzionano sui canali con associazioni persistenti ai thread. Consulta
[Canali che supportano i thread](#thread-supporting-channels) di seguito.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento di avvio

Gli agenti avviano sotto-agenti in background con lo strumento `sessions_spawn`.
I completamenti vengono restituiti come eventi interni della sessione padre; l'agente
padre/richiedente decide se è necessario un aggiornamento visibile all'utente.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - `sessions_spawn` non è bloccante; restituisce immediatamente un ID esecuzione.
    - Al completamento, il sotto-agente invia il risultato alla sessione padre/richiedente.
    - I turni dell'agente che richiedono i risultati degli agenti figli devono chiamare `sessions_yield` dopo aver avviato il lavoro necessario. In questo modo il turno corrente termina e l'evento di completamento può arrivare come messaggio successivo visibile al modello.
    - Il completamento avviene tramite invio automatico. Dopo l'avvio, **non** eseguire ripetutamente `/subagents list`, `sessions_list` o `sessions_history` solo per attendere la conclusione; controlla lo stato su richiesta esclusivamente durante il debug.
    - L'output dell'agente figlio è un rapporto o una prova che l'agente richiedente deve sintetizzare. Non è testo di istruzioni scritto dall'utente e non può prevalere sui criteri di sistema, dello sviluppatore o dell'utente.
    - Al completamento, OpenClaw tenta, senza garanzia, di chiudere le schede del browser e i processi monitorati aperti dalla sessione di quel sotto-agente prima di proseguire con il flusso di pulizia dell'annuncio.

  </Accordion>
  <Accordion title="Completion delivery">
    - OpenClaw restituisce i completamenti alla sessione richiedente tramite un turno `agent` con una chiave di idempotenza stabile.
    - Se l'esecuzione richiedente è ancora attiva, OpenClaw tenta prima di riattivarla o reindirizzarla anziché avviare un secondo percorso di risposta visibile.
    - Se un richiedente attivo non può essere riattivato, OpenClaw ripiega su un passaggio di consegne all'agente richiedente con lo stesso contesto di completamento, anziché scartare l'annuncio.
    - Un passaggio di consegne riuscito al padre completa la consegna del sotto-agente anche quando il padre decide che non è necessario alcun aggiornamento visibile all'utente.
    - I sotto-agenti nativi non ricevono lo strumento per i messaggi. Restituiscono testo semplice dell'assistente all'agente padre/richiedente; le risposte visibili alle persone restano gestite dai normali criteri di consegna dell'agente padre/richiedente.
    - Se il passaggio di consegne diretto non può essere utilizzato, la consegna ripiega sull'instradamento tramite coda, quindi su un breve nuovo tentativo dell'annuncio con attesa esponenziale prima dell'abbandono definitivo.
    - La consegna mantiene l'itinerario risolto del richiedente: quando disponibili, hanno la precedenza gli itinerari di completamento associati al thread o alla conversazione. Se l'origine del completamento fornisce solo un canale, OpenClaw completa destinazione e account mancanti usando l'itinerario risolto della sessione richiedente (`lastChannel` / `lastTo` / `lastAccountId`), affinché la consegna diretta continui a funzionare.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Il passaggio di consegne del completamento alla sessione richiedente è un contesto
    interno generato in fase di esecuzione (non testo scritto dall'utente) e include:

    - `Result` — il testo dell'ultima risposta `assistant` visibile dell'agente figlio. L'output di tool/toolResult non viene promosso nei risultati dell'agente figlio. Le esecuzioni terminate con errore non riutilizzano il testo di risposta acquisito.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistiche compatte sull'esecuzione e sui token.
    - Un'istruzione di revisione che indica all'agente richiedente di verificare il risultato prima di decidere se l'attività originale è conclusa.
    - Indicazioni per il proseguimento che invitano l'agente richiedente a continuare l'attività o registrare un'attività successiva quando il risultato dell'agente figlio richiede ulteriori azioni.
    - Un'istruzione per l'aggiornamento finale nel caso in cui non siano necessarie altre azioni, scritta con il normale stile dell'assistente senza inoltrare i metadati interni non elaborati.

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` e `--thinking` sostituiscono le impostazioni predefinite per quella specifica esecuzione.
    - Usa `info`/`log` per esaminare dettagli e output dopo il completamento.
    - Per le sessioni persistenti associate a un thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Se il canale richiedente non supporta le associazioni ai thread, usa `mode: "run"` anziché tentare nuovamente una combinazione impossibile associata a un thread.
    - Per le sessioni dell'ambiente ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx esplicito), usa `sessions_spawn` con `runtime: "acp"` quando lo strumento dichiara tale runtime. Consulta il [modello di consegna ACP](/it/tools/acp-agents#delivery-model) durante il debug dei completamenti o dei cicli tra agenti. Quando il Plugin `codex` è abilitato, il controllo delle chat e dei thread di Codex dovrebbe preferire `/codex ...` ad ACP, a meno che l'utente non richieda esplicitamente ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è nella sandbox e non è caricato un Plugin di backend come `acpx`. `runtime: "acp"` richiede un ID di ambiente ACP esterno oppure una voce `agents.list[]` con `runtime.type="acp"`; usa il runtime predefinito dei sotto-agenti per i normali agenti di configurazione OpenClaw provenienti da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sotto-agenti nativi vengono avviati in isolamento, a meno che il chiamante non richieda esplicitamente di diramare
la trascrizione corrente.

| Modalità   | Quando usarla                                                                                                                                    | Comportamento                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `isolated` | Nuova ricerca, implementazione indipendente, operazioni lente degli strumenti o qualsiasi attività descrivibile sinteticamente nel testo assegnato | Crea una trascrizione pulita per l'agente figlio. È l'impostazione predefinita e riduce il consumo di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, dai risultati precedenti degli strumenti o da istruzioni articolate già presenti nella trascrizione del richiedente | Dirama la trascrizione del richiedente nella sessione dell'agente figlio prima del suo avvio. |

Usa `fork` con parsimonia. Serve per la delega sensibile al contesto, non come
sostituto di una descrizione chiara dell'attività.

## Strumento: `sessions_spawn`

Avvia un'esecuzione di sotto-agente con `deliver: false` nella corsia globale `subagent`,
quindi esegue un passaggio di annuncio e pubblica la relativa risposta nel
canale di chat del richiedente.

La disponibilità dipende dai criteri effettivi degli strumenti del chiamante. Il profilo integrato
`coding` include `sessions_spawn`; `messaging` e `minimal` no.
`full` consente tutti gli strumenti. Aggiungi `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` oppure usa `tools.profile: "coding"` per gli
agenti con un profilo più ristretto che devono comunque delegare il lavoro.
I criteri di autorizzazione/negazione per canale/gruppo, provider, sandbox e singolo agente possono
comunque rimuovere lo strumento dopo la fase del profilo. Usa `/tools` dalla stessa
sessione per confermare l'elenco effettivo degli strumenti.

**Impostazioni predefinite:**

- **Modello:** i sotto-agenti nativi ereditano il modello del chiamante, a meno che non imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per singolo agente). Gli avvii con runtime ACP usano lo stesso modello configurato per i sotto-agenti, se presente; altrimenti l'ambiente ACP mantiene la propria impostazione predefinita. Un valore esplicito di `sessions_spawn.model` ha comunque la precedenza.
- **Ragionamento:** i sotto-agenti nativi ereditano il ragionamento del chiamante, a meno che non imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per singolo agente). Gli avvii con runtime ACP applicano anche `agents.defaults.models["provider/model"].params.thinking` per il modello selezionato. Un valore esplicito di `sessions_spawn.thinking` ha comunque la precedenza.
- **Timeout dell'esecuzione:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando è impostato; altrimenti ripiega su `0` (nessun timeout). `sessions_spawn` non accetta sostituzioni del timeout per singola chiamata.
- **Consegna dell'attività:** i sotto-agenti nativi ricevono l'attività delegata nel loro primo messaggio visibile `[Subagent Task]`. Il prompt di sistema del sotto-agente contiene le regole di esecuzione e il contesto di instradamento, non un duplicato nascosto dell'attività.

Gli avvii accettati dei sotto-agenti nativi includono nel risultato dello strumento
i metadati risolti del modello dell'agente figlio: `resolvedModel` contiene il riferimento del modello applicato e
`resolvedProvider` contiene il prefisso del provider quando il riferimento ne include uno.

### Modalità del prompt di delega

`agents.defaults.subagents.delegationMode` controlla soltanto le indicazioni del prompt; non modifica i criteri degli strumenti né impone la delega.

- `suggest` (predefinito): mantiene l'indicazione standard del prompt a usare i sotto-agenti per lavori più ampi o più lenti.
- `prefer`: indica all'agente principale di rimanere reattivo e di delegare tramite `sessions_spawn` qualsiasi attività più complessa di una risposta diretta.

Sostituzione per singolo agente: `agents.list[].subagents.delegationMode`.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### Parametri dello strumento

<ParamField path="task" type="string" required>
  La descrizione dell'attività per il sotto-agente.
</ParamField>
<ParamField path="taskName" type="string">
  Identificatore stabile facoltativo per individuare un figlio specifico nei successivi output di stato. Deve corrispondere a `[a-z][a-z0-9_-]{0,63}` e non può essere un target riservato come `last` o `all`.
</ParamField>
<ParamField path="label" type="string">
  Etichetta facoltativa leggibile dall'utente.
</ParamField>
<ParamField path="agentId" type="string">
  Esegue la generazione sotto un altro ID agente configurato, quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro facoltativa per l'esecuzione dell'attività figlia. I sotto-agenti nativi continuano a caricare i file di bootstrap dall'area di lavoro dell'agente di destinazione; `cwd` modifica solo il percorso in cui gli strumenti di runtime e gli harness CLI svolgono il lavoro delegato.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` è riservato agli harness ACP esterni (`claude`, `droid`, `gemini`, `opencode` oppure Codex ACP/acpx richiesto esplicitamente) e alle voci di `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Riprende una sessione esistente dell'harness ACP quando `runtime: "acp"`; viene ignorato per la generazione di sotto-agenti nativi.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Trasmette l'output dell'esecuzione ACP alla sessione padre quando `runtime: "acp"`; omettere per la generazione di sotto-agenti nativi.
</ParamField>
<ParamField path="model" type="string">
  Sostituisce il modello del sotto-agente. I valori non validi vengono ignorati e il sotto-agente viene eseguito con il modello predefinito, mostrando un avviso nel risultato dello strumento.
</ParamField>
<ParamField path="thinking" type="string">
  Sostituisce il livello di ragionamento per l'esecuzione del sotto-agente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando è `true`, richiede l'associazione a un thread del canale per questa sessione del sotto-agente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
  Se l'associazione al thread non è disponibile per il canale del richiedente, usare invece `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia la sessione immediatamente dopo l'annuncio, mantenendo comunque la trascrizione tramite ridenominazione.
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta la generazione a meno che il runtime figlio di destinazione non sia isolato in una sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` dirama la trascrizione corrente del richiedente nella sessione figlia. Solo per i sotto-agenti nativi. Le generazioni associate a un thread usano `fork` per impostazione predefinita; quelle non associate a un thread usano `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di consegna al canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). I sotto-agenti nativi riportano
al richiedente il proprio turno più recente dell'assistente; la consegna esterna rimane
responsabilità dell'agente padre/richiedente.
</Warning>

### Nomi delle attività e selezione dei target

`taskName` è un identificatore esposto al modello per l'orchestrazione, non una chiave di sessione.
Usarlo per nomi stabili dei figli, come `review_subagents`,
`linux_validation` o `docs_update`, quando un coordinatore potrebbe dover ispezionare
quel figlio in seguito.

La risoluzione del target accetta corrispondenze esatte di `taskName` e
prefissi non ambigui. La corrispondenza è limitata alla stessa finestra di target
attivi/recenti usata dai target numerati di `/subagents`, pertanto un figlio
completato e obsoleto non rende ambiguo un identificatore riutilizzato. Se due figli
attivi o recenti condividono lo stesso `taskName`, il target è ambiguo; usare invece
l'indice dell'elenco, la chiave di sessione o l'ID dell'esecuzione.

I target riservati `last` e `all` non sono valori validi per `taskName`,
perché hanno già significati di controllo.

## Strumento: `sessions_yield`

Termina il turno corrente del modello e attende che gli eventi di runtime,
principalmente quelli di completamento dei sotto-agenti, arrivino come messaggio successivo. Usarlo dopo
aver generato il lavoro figlio necessario quando il richiedente non può produrre una risposta
finale finché tali completamenti non sono disponibili.

`sessions_yield` è la primitiva di attesa. Non sostituirla con cicli di polling
su `subagents`, `sessions_list`, `sessions_history`, con `sleep` della shell
o con il polling dei processi al solo scopo di rilevare il completamento di un figlio.

Usare `sessions_yield` solo quando l'elenco effettivo degli strumenti della sessione
lo include. Alcuni profili di strumenti minimi o personalizzati possono esporre `sessions_spawn` e
`subagents` senza esporre `sessions_yield`; in tal caso, non inventare
un ciclo di polling al solo scopo di attendere il completamento.

Quando sono presenti figli attivi, OpenClaw inserisce nei turni normali un blocco di prompt compatto,
generato dal runtime, denominato `Active Subagents`, affinché il richiedente possa vedere
le sessioni figlie correnti, gli ID delle esecuzioni, gli stati, le etichette, le attività e
gli alias `taskName` senza ricorrere al polling. I campi attività ed etichetta di quel
blocco sono racchiusi tra virgolette come dati, non come istruzioni, perché possono provenire
da argomenti di generazione forniti dall'utente o dal modello.

## Strumento: `subagents`

Elenca le esecuzioni dei sotto-agenti generati di proprietà della sessione richiedente. L'ambito è
limitato al richiedente corrente; un figlio può vedere solo i propri figli controllati.

Usare `subagents` per ottenere stato e debug su richiesta. Usare `sessions_yield` per
attendere gli eventi di completamento.

## Sessioni associate a thread

Quando le associazioni ai thread sono abilitate per un canale, un sotto-agente può rimanere associato
a un thread, in modo che i successivi messaggi dell'utente in quel thread continuino a essere instradati
alla stessa sessione del sotto-agente.

### Canali che supportano i thread

Un canale supporta sessioni persistenti di sotto-agenti associate a thread
(`sessions_spawn` con `thread: true`) quando registra un adattatore di associazione
delle conversazioni. I canali inclusi con questo supporto sono: **Discord**,
**iMessage**, **Matrix** e **Telegram**. Discord e Matrix creano per impostazione predefinita
un thread figlio; Telegram e iMessage associano per impostazione predefinita
la conversazione corrente. Usare le chiavi di configurazione `threadBindings` specifiche per canale per
l'abilitazione, i timeout e `spawnSessions`.

### Flusso rapido

<Steps>
  <Step title="Generazione">
    `sessions_spawn` con `thread: true` e, facoltativamente, `mode: "session"`.
  </Step>
  <Step title="Associazione">
    OpenClaw crea o associa un thread al target della sessione nel canale attivo.
  </Step>
  <Step title="Instradamento dei messaggi successivi">
    Le risposte e i messaggi successivi in quel thread vengono instradati alla sessione associata.
  </Step>
  <Step title="Ispezione dei timeout">
    Usare `/session idle` per ispezionare o aggiornare la rimozione automatica dello stato attivo dopo inattività e
    `/session max-age` per controllare il limite massimo assoluto.
  </Step>
  <Step title="Disassociazione">
    Usare `/unfocus` per disassociare manualmente.
  </Step>
</Steps>

### Controlli manuali

| Comando            | Effetto                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `/focus <target>`  | Associa il thread corrente, o ne crea uno, a un target di sotto-agente/sessione                           |
| `/unfocus`         | Rimuove l'associazione per il thread attualmente associato                                                |
| `/agents`          | Elenca le esecuzioni attive e lo stato delle associazioni (`binding:<id>`, `unbound` o `bindings unavailable`) |
| `/session idle`    | Ispeziona o aggiorna la rimozione automatica dello stato attivo per inattività, solo per i thread associati attivi |
| `/session max-age` | Ispeziona o aggiorna il limite massimo assoluto, solo per i thread associati attivi                       |

### Opzioni di configurazione

- **Impostazione predefinita globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- Le **chiavi di sostituzione per canale e di associazione automatica alla generazione** sono specifiche dell'adattatore. Consultare [Canali che supportano i thread](#thread-supporting-channels) sopra.

Consultare il [riferimento della configurazione](/it/gateway/configuration-reference) e
i [comandi slash](/it/tools/slash-commands) per i dettagli aggiornati sugli adattatori.

### Elenco consentito

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco degli ID degli agenti configurati che possono essere selezionati tramite `agentId` esplicito (`["*"]` consente qualsiasi target configurato). Impostazione predefinita: solo l'agente richiedente. Se si imposta un elenco e si vuole comunque consentire al richiedente di generare se stesso tramite `agentId`, includere nell'elenco l'ID del richiedente.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Elenco consentito predefinito degli agenti di destinazione configurati, usato quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate a `sessions_spawn` che omettono `agentId`, imponendo la selezione esplicita del profilo. Sostituzione per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout per chiamata per i tentativi di consegna dell'annuncio `agent` del Gateway. I valori sono millisecondi interi positivi e vengono limitati al valore massimo sicuro per i timer della piattaforma. I nuovi tentativi transitori possono rendere l'attesa totale dell'annuncio più lunga di un singolo timeout configurato.
</ParamField>

Se la sessione richiedente è isolata in una sandbox, `sessions_spawn` rifiuta i target
che verrebbero eseguiti senza sandbox.

### Individuazione

Usare `agents_list` per vedere quali ID agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo di ogni agente elencato
e i metadati del runtime incorporato, affinché i chiamanti possano distinguere OpenClaw, il server
dell'app Codex e gli altri runtime nativi configurati.

Le voci di `allowAgents` devono indicare ID agente configurati in `agents.list[]`.
`["*"]` indica qualsiasi agente di destinazione configurato più il richiedente. Se una configurazione
agente viene eliminata ma il relativo ID rimane in `allowAgents`, `sessions_spawn` rifiuta tale ID
e `agents_list` lo omette. Eseguire `openclaw doctor --fix` per eliminare le voci obsolete
dell'elenco consentito oppure aggiungere una voce minima in `agents.list[]` quando il target deve
rimanere generabile ereditando al contempo le impostazioni predefinite.

### Archiviazione automatica

- Le sessioni dei sotto-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (valore predefinito: `60`).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` nella stessa cartella.
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio, mantenendo comunque la trascrizione tramite ridenominazione.
- L'archiviazione automatica è eseguita con la massima diligenza; i timer in attesa vengono persi se il Gateway si riavvia.
- I timeout di esecuzione configurati **non** archiviano automaticamente; arrestano solo l'esecuzione. La sessione rimane fino all'archiviazione automatica.
- L'archiviazione automatica si applica allo stesso modo alle sessioni di profondità 1 e 2.
- La pulizia del browser è separata dalla pulizia dell'archivio: si tenta di chiudere le schede e i processi del browser monitorati al termine dell'esecuzione, anche se la trascrizione o il record della sessione vengono conservati.

## Sotto-agenti annidati

Per impostazione predefinita, i sotto-agenti non possono generare i propri sotto-agenti
(`maxSpawnDepth: 1`). Impostare `maxSpawnDepth: 2` per abilitare un livello di
annidamento: il **modello orchestratore**: principale → sotto-agente orchestratore →
sotto-sotto-agenti esecutori.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // consente ai sotto-agenti di generare figli (valore predefinito: 1, intervallo 1-5)
        maxChildrenPerAgent: 5, // numero massimo di figli attivi per sessione agente (valore predefinito: 5, intervallo 1-20)
        maxConcurrent: 8, // limite globale della corsia di concorrenza (valore predefinito: 8)
        runTimeoutSeconds: 900, // timeout predefinito per sessions_spawn (0 = nessun timeout)
        announceTimeoutMs: 120000, // timeout per chiamata per l'annuncio del Gateway
      },
    },
  },
}
```

### Livelli di profondità

| Profondità | Formato della chiave di sessione             | Ruolo                                                   | Può generare altri agenti?        |
| ---------- | -------------------------------------------- | ------------------------------------------------------- | --------------------------------- |
| 0          | `agent:<id>:main`                            | Agente principale                                       | Sempre                            |
| 1          | `agent:<id>:subagent:<uuid>`                 | Sottoagente (orchestratore se è consentita profondità 2) | Solo se `maxSpawnDepth >= 2`      |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sottoagente (esecutore terminale)                  | Mai                               |

### Catena di notifica

I risultati risalgono lungo la catena:

1. L'esecutore di profondità 2 termina → invia una notifica al proprio genitore (orchestratore di profondità 1).
2. L'orchestratore di profondità 1 riceve la notifica, sintetizza i risultati, termina → invia una notifica all'agente principale.
3. L'agente principale riceve la notifica e comunica il risultato all'utente.

Ogni livello vede solo le notifiche provenienti dai propri figli diretti.

<Note>
**Indicazioni operative:** avvia il lavoro figlio una sola volta e attendi gli
eventi di completamento anziché creare cicli di polling attorno a
`sessions_list`, `sessions_history`, `/subagents list` o comandi `exec` di
sospensione. `sessions_list` e `/subagents list` mantengono le relazioni tra
sessioni figlie incentrate sul lavoro attivo: i figli attivi rimangono
collegati, quelli terminati restano visibili per una breve finestra recente
e i collegamenti obsoleti a figli presenti solo nell'archivio vengono
ignorati una volta scaduta la relativa finestra di validità. Ciò impedisce
ai vecchi metadati `spawnedBy` / `parentSessionKey` di far ricomparire figli
fantasma dopo il riavvio. Se un evento di completamento di un figlio arriva
dopo che hai già inviato la risposta finale, il seguito corretto è
esattamente il token silenzioso `NO_REPLY` / `no_reply`.
</Note>

### Criteri di accesso agli strumenti per profondità

- Il ruolo e l'ambito di controllo vengono registrati nei metadati della sessione al momento della generazione. Ciò impedisce che chiavi di sessione appiattite o ripristinate riacquistino accidentalmente i privilegi di orchestratore.
- **Profondità 1 (orchestratore, quando `maxSpawnDepth >= 2`):** riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` per poter generare figli e verificarne lo stato. Gli altri strumenti di sessione o di sistema rimangono negati.
- **Profondità 1 (terminale, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito attuale).
- **Profondità 2 (esecutore terminale):** nessuno strumento di sessione; `sessions_spawn` è sempre negato alla profondità 2. Non può generare ulteriori figli.

### Limite di generazione per agente

Ogni sessione agente, a qualsiasi profondità, può avere al massimo
`maxChildrenPerAgent` figli attivi contemporaneamente (valore predefinito:
`5`). Ciò impedisce un'espansione incontrollata da parte di un singolo
orchestratore.

### Arresto a cascata

L'arresto di un orchestratore di profondità 1 arresta automaticamente tutti
i suoi figli di profondità 2:

- `/stop` nella chat principale arresta tutti gli agenti di profondità 1 e propaga l'arresto ai rispettivi figli di profondità 2.

## Autenticazione

L'autenticazione dei sottoagenti viene risolta in base all'**ID agente**,
non al tipo di sessione:

- La chiave di sessione del sottoagente è `agent:<agentId>:subagent:<uuid>`.
- L'archivio di autenticazione viene caricato dall'`agentDir` di tale agente.
- I profili di autenticazione dell'agente principale vengono uniti come **ripiego**; in caso di conflitto, i profili dell'agente prevalgono su quelli dell'agente principale.

L'unione è additiva, quindi i profili dell'agente principale sono sempre
disponibili come ripiego. Un'autenticazione completamente isolata per
ciascun agente non è ancora supportata.

## Notifica

I sottoagenti comunicano i risultati mediante un passaggio di notifica:

- Il passaggio di notifica viene eseguito all'interno della sessione del sottoagente, non nella sessione del richiedente.
- Se il sottoagente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se il testo più recente dell'assistente corrisponde esattamente al token silenzioso `NO_REPLY` / `no_reply`, l'output della notifica viene soppresso anche se in precedenza erano presenti aggiornamenti visibili.

La consegna dipende dalla profondità del richiedente:

- Le sessioni richiedenti di livello superiore usano una chiamata `agent` successiva con consegna esterna (`deliver=true`).
- Le sessioni richiedenti di sottoagenti annidati ricevono un'iniezione interna successiva (`deliver=false`), affinché l'orchestratore possa sintetizzare nella sessione i risultati dei figli.
- Se una sessione richiedente di un sottoagente annidato non esiste più, OpenClaw ricorre al richiedente di quella sessione, se disponibile.

Per le sessioni richiedenti di livello superiore, la consegna diretta in
modalità di completamento risolve prima l'eventuale percorso associato alla
conversazione o alla discussione e la sostituzione definita dall'hook,
quindi completa i campi mancanti di canale e destinazione usando il percorso
memorizzato nella sessione del richiedente. In questo modo i completamenti
rimangono nella chat o nell'argomento corretto anche quando l'origine del
completamento identifica soltanto il canale.

Durante la creazione dei risultati dei completamenti annidati, l'aggregazione
dei completamenti dei figli è limitata all'esecuzione corrente del richiedente,
impedendo che output obsoleti di figli appartenenti a esecuzioni precedenti
confluiscano nella notifica corrente. Le risposte di notifica mantengono
l'instradamento della discussione o dell'argomento quando è disponibile negli
adattatori dei canali.

### Contesto della notifica

Il contesto della notifica viene normalizzato in un blocco di eventi interno
stabile:

| Campo               | Origine                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Origine             | `subagent` o `cron`                                                                                                      |
| ID sessione         | Chiave/ID della sessione figlia                                                                                          |
| Tipo                | Tipo di notifica + etichetta dell'attività                                                                               |
| Stato               | Derivato dall'esito di esecuzione (`ok`, `error`, `timeout` o `unknown`), **non** dedotto dal testo del modello          |
| Contenuto risultato | Testo visibile più recente dell'assistente proveniente dal figlio                                                        |
| Seguito             | Istruzione che descrive quando rispondere e quando rimanere in silenzio                                                  |

Le esecuzioni terminate con errore riportano lo stato di errore senza
riprodurre il testo di risposta acquisito. L'output `tool`/`toolResult` non
viene promosso a testo del risultato del figlio.

### Riga delle statistiche

I payload delle notifiche includono alla fine una riga di statistiche, anche
quando sono racchiusi:

- Durata di esecuzione, ad esempio `runtime 5m12s`.
- Utilizzo dei token (input/output/totale).
- Costo stimato quando è configurata la tariffazione dei modelli (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e percorso della trascrizione, affinché l'agente principale possa recuperare la cronologia tramite `sessions_history` o esaminare il file sul disco.

I metadati interni sono destinati esclusivamente all'orchestrazione; le
risposte rivolte all'utente devono essere riscritte con il normale tono
dell'assistente.

### Perché preferire `sessions_history`

`sessions_history` è il percorso di orchestrazione più sicuro per leggere la
trascrizione di un figlio durante un turno dell'agente:

- Oscura il testo simile a credenziali o token anche quando l'oscuramento generale dei registri è disabilitato.
- Tronca i blocchi di testo lunghi (4000 caratteri per blocco) e rimuove le firme di elaborazione, i payload di riproduzione del ragionamento e i dati immagine incorporati.
- Impone un limite di risposta di 80 KB; le righe sovradimensionate vengono sostituite con `[sessions_history omitted: message too large]`.
- Quando presente, usa `nextOffset` per scorrere all'indietro le finestre precedenti della trascrizione.
- `sessions_history` **non** rimuove i tag di ragionamento, la struttura `<relevant-memories>` o l'XML delle chiamate agli strumenti dal testo dei messaggi: restituisce blocchi di contenuto strutturati simili alla forma grezza della trascrizione, ma oscurati e con dimensioni limitate. `/subagents log` applica una sanificazione più incisiva del testo (rimuove i tag di ragionamento, la struttura dei ricordi e l'XML delle chiamate agli strumenti), poiché visualizza righe di chat in testo semplice anziché blocchi strutturati.
- L'esame della trascrizione grezza sul disco è il ripiego da usare quando serve la trascrizione completa, identica byte per byte.

## Criteri di accesso agli strumenti

I sottoagenti usano inizialmente lo stesso profilo e la stessa catena di
criteri di accesso agli strumenti del genitore o dell'agente di destinazione.
Successivamente, OpenClaw applica il livello di restrizione dei sottoagenti.

I sottoagenti perdono sempre `gateway`, `agents_list`, `session_status` e
`cron`, indipendentemente dalla profondità o dal ruolo: si tratta di strumenti
a livello di sistema o interattivi, oppure di strumenti il cui coordinamento
spetta all'agente principale. I sottoagenti terminali, ossia il comportamento
predefinito alla profondità 1 e sempre alla profondità 2, perdono inoltre
`subagents`, `sessions_list`, `sessions_history` e `sessions_spawn`. I
sottoagenti non ricevono mai lo strumento `message`: viene disabilitato al
momento della generazione, non filtrato da questo elenco di esclusione. Anche
`sessions_send` rimane negato, affinché i sottoagenti comunichino
esclusivamente attraverso la catena di notifica.

Anche in questo caso, `sessions_history` rimane una vista di consultazione
limitata e sanificata, non un'esportazione grezza della trascrizione.

Quando `maxSpawnDepth >= 2`, i sottoagenti orchestratori di profondità 1
ricevono inoltre `sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history`, così da poter gestire i propri figli.

### Sostituzione tramite configurazione

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

`tools.subagents.tools.allow` è un filtro finale che consente esclusivamente
gli strumenti elencati. Può restringere l'insieme di strumenti già risolto,
ma non può **aggiungere nuovamente** uno strumento rimosso da `tools.profile`.
Ad esempio, `tools.profile: "coding"` include `web_search`/`web_fetch`, ma non
lo strumento `browser`. Per consentire ai sottoagenti con profilo di
programmazione di usare l'automazione del browser, aggiungi `browser` nella
fase del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` per singolo agente quando
l'automazione del browser deve essere concessa a un solo agente.

## Concorrenza

I sottoagenti usano una corsia dedicata nella coda interna al processo:

- **Nome della corsia:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (valore predefinito: `8`)

## Attività e ripristino

OpenClaw non considera l'assenza di `endedAt` una prova permanente che un
sottoagente sia ancora attivo. Le esecuzioni non terminate più vecchie della
finestra di obsolescenza delle esecuzioni (2 ore oppure il timeout configurato
per l'esecuzione più un breve periodo di tolleranza, scegliendo il valore
maggiore) non vengono più conteggiate come attive o in sospeso in
`/subagents list`, nei riepiloghi di stato, nel controllo del completamento
dei discendenti e nelle verifiche della concorrenza per sessione.

Dopo il riavvio del Gateway, le esecuzioni obsolete ripristinate ma non
terminate vengono eliminate, a meno che la relativa sessione figlia non sia
contrassegnata con `abortedLastRun: true`. Le esecuzioni interrotte dal
riavvio rimangono registrate per il flusso di ripristino dei sottoagenti
orfani: le esecuzioni obsolete vengono finalizzate senza ripresa, mentre le
sessioni figlie recenti ricevono un messaggio sintetico di ripresa prima
della rimozione del contrassegno di interruzione.

Il ripristino automatico dopo il riavvio è limitato per ciascuna sessione
figlia. Se lo stesso sottoagente figlio viene accettato ripetutamente per il
ripristino degli orfani all'interno della finestra di rapido blocco
ricorrente, OpenClaw salva in modo persistente un contrassegno definitivo di
ripristino su tale sessione e smette di riprenderla automaticamente nei
riavvii successivi. Esegui `openclaw tasks maintenance --apply` per
riconciliare il record dell'attività oppure `openclaw doctor --fix` per
rimuovere i contrassegni obsoleti di ripristino interrotto nelle sessioni
contrassegnate definitivamente.

<Note>
Se la generazione di un sottoagente non riesce con Gateway
`PAIRING_REQUIRED` / `scope-upgrade`, controlla il chiamante RPC prima di
modificare lo stato di associazione. Il coordinamento interno di
`sessions_spawn` invia la richiesta all'interno del processo quando il
chiamante è già in esecuzione nel contesto della richiesta del Gateway,
quindi non apre un WebSocket local loopback e non dipende dall'ambito di base
del dispositivo associato alla CLI. I chiamanti esterni al processo del
Gateway usano comunque il ripiego WebSocket come `client.id: "gateway-client"`
con `client.mode: "backend"` tramite autenticazione diretta local loopback con
token condiviso/password. I chiamanti remoti, un `deviceIdentity` esplicito,
i percorsi espliciti con token del dispositivo e i client browser/Node
richiedono comunque la normale approvazione del dispositivo per gli
aggiornamenti dell'ambito.
</Note>

## Arresto

- L'invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta tutte le esecuzioni attive dei sottoagenti generate da essa, propagando l'arresto ai figli annidati.

## Limitazioni

- L'annuncio del sottoagente è eseguito secondo il principio del **massimo sforzo**. Se il Gateway si riavvia, le operazioni di "annuncio al chiamante" in sospeso vengono perse.
- I sottoagenti continuano a condividere le risorse dello stesso processo Gateway; considera `maxConcurrent` una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto del sottoagente include solo `AGENTS.md` e `TOOLS.md` (non `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`). I sottoagenti nativi di Codex rispettano lo stesso limite: `TOOLS.md` rimane nelle istruzioni ereditate del thread Codex, mentre i file relativi a personalità, identità e utente, riservati al genitore, vengono inseriti come istruzioni di collaborazione limitate al turno, affinché i figli non li clonino.
- La profondità massima di annidamento è 5 (intervallo di `maxSpawnDepth`: 1-5). Per la maggior parte dei casi d'uso è consigliata una profondità di 2.
- `maxChildrenPerAgent` limita il numero di figli attivi per sessione (valore predefinito `5`, intervallo `1-20`).

## Contenuti correlati

- [Strumenti di sessione e modifiche dello stato](/it/concepts/session-tool)
- [Agenti ACP](/it/tools/acp-agents)
- [Invio dell'agente](/it/tools/agent-send)
- [Attività in background](/it/automation/tasks)
- [Strumenti sandbox multiagente](/it/tools/multi-agent-sandbox-tools)
