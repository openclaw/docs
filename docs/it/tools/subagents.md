---
read_when:
    - Si desidera eseguire del lavoro in background o in parallelo tramite l’agente
    - Si stanno modificando i criteri dello strumento sessions_spawn o dei sub-agenti
    - Si stanno implementando o risolvendo problemi relativi alle sessioni dei sottoagenti associate ai thread
sidebarTitle: Sub-agents
summary: Avvia esecuzioni isolate di agenti in background che comunicano i risultati alla chat del richiedente
title: Sottoagenti
x-i18n:
    generated_at: "2026-07-16T15:12:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8c670d5c7f92d5be8ebce7b1140d9bfd7956b10f38144d275ec84c6af98ae04b
    source_path: tools/subagents.md
    workflow: 16
---

I sub-agenti sono esecuzioni di agenti in background generate da un'esecuzione di agente esistente.
Ognuno viene eseguito nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
al termine, **comunica** il proprio risultato al canale di chat del richiedente.
Ogni esecuzione di un sub-agente viene monitorata come [attività in background](/it/automation/tasks).

Obiettivi:

- Parallelizzare la ricerca, le attività lunghe e le operazioni lente degli strumenti senza bloccare l'esecuzione principale.
- Mantenere i sub-agenti isolati per impostazione predefinita (separazione delle sessioni, sandboxing facoltativo).
- Rendere difficile un uso improprio dell'insieme di strumenti: per impostazione predefinita, i sub-agenti **non** ricevono strumenti per sessioni o messaggi.
- Supportare una profondità di annidamento configurabile per i modelli di orchestrazione.

<Note>
**Nota sui costi:** per impostazione predefinita, ogni sub-agente dispone di un contesto e di un utilizzo dei token propri.
Per attività pesanti o ripetitive, impostare un modello più economico per i sub-agenti
e mantenere l'agente principale su un modello di qualità superiore tramite
`agents.defaults.subagents.model` o sostituzioni per singolo agente. Quando un agente figlio
necessita effettivamente della trascrizione corrente del richiedente, generarlo con
`context: "fork"`. Le sessioni dei sub-agenti associate a un thread usano per impostazione predefinita
`context: "fork"`, poiché ramificano la conversazione corrente in un
thread di follow-up.
</Note>

## Comando slash

`/subagents` esamina le esecuzioni dei sub-agenti per la **sessione corrente**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, ID sessione,
percorso della trascrizione, pulizia). `/subagents log` stampa i turni di chat recenti di
un'esecuzione; aggiungere il token `tools` per includere i messaggi di chiamata/risultato degli strumenti (omessi
per impostazione predefinita). Usare `sessions_history` per una vista di richiamo
limitata e filtrata per la sicurezza dall'interno di un turno dell'agente, oppure esaminare il percorso della trascrizione sul disco per
la trascrizione completa non elaborata.

Nell'interfaccia di controllo, le sessioni padre con esecuzioni figlie recenti dispongono di una riga
espandibile nella barra laterale. Le righe annidate mostrano lo stato e la durata di esecuzione degli agenti figli; selezionandone una
si apre la chat dell'agente figlio mantenendo la gerarchia del padre.

### Controlli di associazione ai thread

Questi comandi funzionano sui canali con associazioni persistenti ai thread. Consultare
[Canali che supportano i thread](#thread-supporting-channels) più avanti.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento di generazione

Gli agenti avviano sub-agenti in background con lo strumento `sessions_spawn`.
I completamenti vengono restituiti come eventi interni della sessione padre; l'agente
padre/richiedente decide se è necessario un aggiornamento visibile all'utente.

<AccordionGroup>
  <Accordion title="Completamento non bloccante basato su push">
    - `sessions_spawn` non è bloccante; restituisce immediatamente un ID esecuzione.
    - Al completamento, il sub-agente invia un rapporto alla sessione padre/richiedente.
    - I turni dell'agente che richiedono i risultati degli agenti figli devono chiamare `sessions_yield` dopo aver generato il lavoro necessario. Ciò termina il turno corrente e consente all'evento di completamento di arrivare come successivo messaggio visibile al modello.
    - Il completamento è basato su push. Dopo la generazione, **non** eseguire ripetutamente il polling di `/subagents list`, `sessions_list` o `sessions_history` in un ciclo solo per attenderne il completamento; verificare lo stato su richiesta esclusivamente durante il debug.
    - L'output dell'agente figlio è un rapporto/una prova che l'agente richiedente deve sintetizzare. Non è testo di istruzioni scritto dall'utente e non può prevalere sui criteri di sistema, dello sviluppatore o dell'utente.
    - Al completamento, OpenClaw tenta di chiudere le schede e i processi del browser monitorati aperti dalla sessione del sub-agente prima che prosegua il flusso di pulizia della comunicazione.

  </Accordion>
  <Accordion title="Recapito del completamento">
    - OpenClaw restituisce i completamenti alla sessione richiedente tramite un turno `agent` con una chiave di idempotenza stabile.
    - Se l'esecuzione richiedente è ancora attiva, OpenClaw tenta prima di riattivare/indirizzare tale esecuzione invece di avviare un secondo percorso di risposta visibile.
    - Se non è possibile riattivare un richiedente attivo, OpenClaw ricorre al passaggio di consegne a un agente richiedente con lo stesso contesto di completamento anziché scartare la comunicazione.
    - Un passaggio di consegne riuscito al padre completa il recapito del sub-agente anche quando il padre decide che non è necessario alcun aggiornamento visibile all'utente.
    - I sub-agenti nativi non ricevono lo strumento per i messaggi. Restituiscono testo semplice dell'assistente all'agente padre/richiedente; le risposte visibili agli utenti restano sotto il controllo dei normali criteri di recapito dell'agente padre/richiedente.
    - Se non è possibile usare il passaggio di consegne diretto, il recapito ricorre all'instradamento tramite coda, quindi a un breve nuovo tentativo della comunicazione con backoff esponenziale prima dell'abbandono definitivo.
    - Il recapito mantiene l'itinerario risolto del richiedente: quando disponibili, prevalgono gli itinerari di completamento associati al thread o alla conversazione. Se l'origine del completamento fornisce solo un canale, OpenClaw completa la destinazione o l'account mancante usando l'itinerario risolto della sessione richiedente (`lastChannel` / `lastTo` / `lastAccountId`), affinché il recapito diretto continui a funzionare.

  </Accordion>
  <Accordion title="Metadati del passaggio di consegne del completamento">
    Il passaggio di consegne del completamento alla sessione richiedente è un contesto interno
    generato in fase di esecuzione (non testo scritto dall'utente) e include:

    - `Result` — il più recente testo di risposta `assistant` visibile dell'agente figlio. L'output tool/toolResult non viene promosso nei risultati dell'agente figlio. Le esecuzioni terminate con errore non riutilizzano il testo di risposta acquisito.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistiche sintetiche su esecuzione/token.
    - Un'istruzione di revisione che indica all'agente richiedente di verificare il risultato prima di decidere se l'attività originale è completata.
    - Indicazioni di follow-up che invitano l'agente richiedente a proseguire l'attività o registrare un follow-up quando il risultato dell'agente figlio richiede ulteriori azioni.
    - Un'istruzione per l'aggiornamento finale nel caso in cui non siano necessarie altre azioni, scritta con la normale voce dell'assistente senza inoltrare metadati interni non elaborati.

  </Accordion>
  <Accordion title="Modalità e runtime ACP">
    - `--model` e `--thinking` sostituiscono le impostazioni predefinite per quella specifica esecuzione.
    - Usare `info`/`log` per esaminare dettagli e output dopo il completamento.
    - Per le sessioni persistenti associate a un thread, usare `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Se il canale richiedente non supporta le associazioni ai thread, usare `mode: "run"` anziché riprovare una combinazione associata a un thread impossibile.
    - Per le sessioni dell'harness ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx esplicito), usare `sessions_spawn` con `runtime: "acp"` quando lo strumento dichiara tale runtime. Consultare [Modello di recapito ACP](/it/tools/acp-agents#delivery-model) durante il debug dei completamenti o dei cicli tra agenti. Quando il plugin `codex` è abilitato, il controllo di chat/thread di Codex dovrebbe preferire `/codex ...` ad ACP, a meno che l'utente non richieda esplicitamente ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è in sandbox e non viene caricato un plugin di backend come `acpx`. `runtime: "acp"` richiede un ID harness ACP esterno oppure una voce `agents.list[]` con `runtime.type="acp"`; usare il runtime predefinito dei sub-agenti per i normali agenti di configurazione OpenClaw provenienti da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sub-agenti nativi vengono avviati isolati, a meno che il chiamante non richieda esplicitamente di creare una ramificazione
della trascrizione corrente.

| Modalità       | Quando usarla                                                                                                                         | Comportamento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nuove ricerche, implementazioni indipendenti, operazioni lente degli strumenti o qualsiasi attività descrivibile brevemente nel testo dell'attività                           | Crea una trascrizione figlia pulita. È l'impostazione predefinita e riduce l'utilizzo dei token.  |
| `fork`     | Lavoro che dipende dalla conversazione corrente, dai risultati precedenti degli strumenti o da istruzioni dettagliate già presenti nella trascrizione del richiedente | Ramifica la trascrizione del richiedente nella sessione figlia prima dell'avvio dell'agente figlio. |

Usare `fork` con moderazione. Serve per la delega sensibile al contesto, non come
sostituto di un prompt dell'attività chiaro.

## Strumento: `sessions_spawn`

Avvia un'esecuzione di un sub-agente con `deliver: false` sulla corsia globale `subagent`,
quindi esegue un passaggio di comunicazione e pubblica la risposta della comunicazione nel
canale di chat del richiedente.

La disponibilità dipende dai criteri effettivi degli strumenti del chiamante. Il profilo integrato
`coding` include `sessions_spawn`; `messaging` e `minimal` invece
no. `full` consente tutti gli strumenti. Aggiungere `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`, oppure usare `tools.profile: "coding"`, per gli
agenti con un profilo più ristretto che devono comunque delegare il lavoro.
I criteri di autorizzazione/negazione per canale/gruppo, provider, sandbox e singolo agente possono
comunque rimuovere lo strumento dopo la fase del profilo. Usare `/tools` dalla stessa
sessione per confermare l'elenco effettivo degli strumenti.

**Impostazioni predefinite:**

- **Modello:** i sub-agenti nativi ereditano il modello del chiamante, a meno che non si imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per singolo agente). Le generazioni del runtime ACP usano lo stesso modello di sub-agente configurato, quando presente; altrimenti l'harness ACP mantiene la propria impostazione predefinita. Un `sessions_spawn.model` esplicito prevale comunque.
- **Ragionamento:** i sub-agenti nativi ereditano il ragionamento del chiamante, a meno che non si imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per singolo agente). Le generazioni del runtime ACP applicano inoltre `agents.defaults.models["provider/model"].params.thinking` al modello selezionato. Un `sessions_spawn.thinking` esplicito prevale comunque.
- **Timeout dell'esecuzione:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando è impostato; altrimenti ricorre a `0` (nessun timeout). `sessions_spawn` non accetta sostituzioni del timeout per singola chiamata.
- **Recapito dell'attività:** i sub-agenti nativi ricevono l'attività delegata nel loro primo messaggio `[Subagent Task]` visibile. Il prompt di sistema del sub-agente contiene regole del runtime e contesto di instradamento, non un duplicato nascosto dell'attività.

Le generazioni accettate di sub-agenti nativi includono i metadati risolti del modello dell'agente figlio
nel risultato dello strumento: `resolvedModel` contiene il riferimento del modello applicato e
`resolvedProvider` contiene il prefisso del provider quando il riferimento ne include uno.

### Modalità del prompt di delega

`agents.defaults.subagents.delegationMode` controlla solo le indicazioni del prompt; non modifica i criteri degli strumenti né impone la delega.

- `suggest` (impostazione predefinita): mantiene il normale suggerimento del prompt a usare i sub-agenti per attività più grandi o lente.
- `prefer`: indica all'agente principale di restare reattivo e delegare tramite `sessions_spawn` qualsiasi attività più complessa di una risposta diretta.

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
  Handle stabile facoltativo per identificare un figlio specifico nell'output di stato successivo. Deve corrispondere a `[a-z][a-z0-9_-]{0,63}` e non può essere un obiettivo riservato come `last` o `all`.
</ParamField>
<ParamField path="label" type="string">
  Etichetta facoltativa leggibile dall'utente.
</ParamField>
<ParamField path="agentId" type="string">
  Esegue la creazione sotto un altro id agente configurato quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro facoltativa dell'attività per l'esecuzione figlia. I sotto-agenti nativi continuano a caricare i file di bootstrap dall'area di lavoro dell'agente di destinazione; `cwd` modifica solo la posizione in cui gli strumenti di runtime e gli harness CLI eseguono il lavoro delegato.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` è destinato esclusivamente agli harness ACP esterni (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx richiesto esplicitamente) e alle voci `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Riprende una sessione harness ACP esistente quando `runtime: "acp"`; ignorato per la creazione di sotto-agenti nativi.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Trasmette l'output dell'esecuzione ACP alla sessione padre quando `runtime: "acp"`; omettere per la creazione di sotto-agenti nativi.
</ParamField>
<ParamField path="model" type="string">
  Sostituisce il modello del sotto-agente. I valori non validi vengono ignorati e il sotto-agente viene eseguito sul modello predefinito con un avviso nel risultato dello strumento.
</ParamField>
<ParamField path="thinking" type="string">
  Sostituisce il livello di ragionamento per l'esecuzione del sotto-agente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, richiede l'associazione al thread del canale per questa sessione del sotto-agente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` viene omesso, il valore predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
  Se l'associazione al thread non è disponibile per il canale richiedente, utilizzare invece `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia la sessione immediatamente dopo l'annuncio (conserva comunque la trascrizione rinominandola).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta la creazione a meno che il runtime figlio di destinazione non sia in sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica la trascrizione corrente del richiedente nella sessione figlia. Solo sotto-agenti nativi. Le creazioni associate a un thread hanno come valore predefinito `fork`; quelle non associate a un thread hanno come valore predefinito `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di consegna al canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). I sotto-agenti nativi comunicano
al richiedente il proprio turno più recente dell'assistente; la consegna esterna rimane di competenza
dell'agente padre/richiedente.
</Warning>

### Nomi delle attività e selezione degli obiettivi

`taskName` è un handle destinato al modello per l'orchestrazione, non una chiave di sessione.
Utilizzarlo per nomi stabili dei figli come `review_subagents`,
`linux_validation` o `docs_update` quando un coordinatore potrebbe dover ispezionare
quel figlio in seguito.

La risoluzione degli obiettivi accetta corrispondenze esatte di `taskName` e prefissi
non ambigui. La corrispondenza è limitata alla stessa finestra di obiettivi attivi/recenti utilizzata
dagli obiettivi numerati `/subagents`, pertanto un figlio completato obsoleto non rende
ambiguo un handle riutilizzato. Se due figli attivi o recenti condividono lo stesso
`taskName`, l'obiettivo è ambiguo; utilizzare invece l'indice dell'elenco, la chiave di sessione o
l'id di esecuzione.

Gli obiettivi riservati `last` e `all` non sono valori `taskName` validi
perché hanno già significati di controllo.

## Strumento: `sessions_yield`

Termina il turno corrente del modello e attende che gli eventi di runtime, principalmente
gli eventi di completamento dei sotto-agenti, arrivino come messaggio successivo. Utilizzarlo dopo
aver creato il lavoro figlio necessario quando il richiedente non può produrre una risposta
finale finché tali completamenti non sono arrivati.

`sessions_yield` è la primitiva di attesa. Non sostituirla con cicli di polling
su `subagents`, `sessions_list`, `sessions_history`, `sleep` della shell
o con il polling dei processi al solo scopo di rilevare il completamento dei figli.

Utilizzare `sessions_yield` solo quando l'elenco effettivo degli strumenti della sessione lo include.
Alcuni profili di strumenti minimi o personalizzati possono esporre `sessions_spawn` e
`subagents` senza esporre `sessions_yield`; in tal caso, non inventare
un ciclo di polling al solo scopo di attendere il completamento.

Quando esistono figli attivi, OpenClaw inserisce nei turni normali un blocco di prompt compatto
`Active Subagents` generato dal runtime, affinché il richiedente possa vedere
le sessioni figlie correnti, gli id di esecuzione, gli stati, le etichette, le attività e gli
alias `taskName` senza polling. I campi attività ed etichetta in tale
blocco sono racchiusi tra virgolette come dati, non come istruzioni, perché possono provenire
da argomenti di creazione forniti dall'utente o dal modello.

## Strumento: `subagents`

Elenca le esecuzioni dei sotto-agenti creati di proprietà della sessione richiedente. L'ambito è limitato
al richiedente corrente; un figlio può vedere solo i propri figli controllati.

Utilizzare `subagents` per lo stato e il debug su richiesta. Utilizzare `sessions_yield` per
attendere gli eventi di completamento.

## Sessioni associate ai thread

Quando le associazioni ai thread sono abilitate per un canale, un sotto-agente può rimanere associato
a un thread, affinché i successivi messaggi dell'utente in quel thread continuino a essere instradati alla
stessa sessione del sotto-agente.

### Canali che supportano i thread

Un canale supporta sessioni persistenti di sotto-agenti associate ai thread
(`sessions_spawn` con `thread: true`) quando registra un adattatore di associazione
delle conversazioni. Canali inclusi con tale supporto: **Discord**,
**iMessage**, **Matrix** e **Telegram**. Discord e Matrix creano per impostazione predefinita
un thread figlio; Telegram e iMessage associano per impostazione predefinita la
conversazione corrente. Utilizzare le chiavi di configurazione `threadBindings` specifiche del canale per
l'abilitazione, i timeout e `spawnSessions`.

### Flusso rapido

<Steps>
  <Step title="Creazione">
    `sessions_spawn` con `thread: true` (e facoltativamente `mode: "session"`).
  </Step>
  <Step title="Associazione">
    OpenClaw crea o associa un thread all'obiettivo di quella sessione nel canale attivo.
  </Step>
  <Step title="Instradamento dei messaggi successivi">
    Le risposte e i messaggi successivi in quel thread vengono instradati alla sessione associata.
  </Step>
  <Step title="Ispezione dei timeout">
    Utilizzare `/session idle` per ispezionare/aggiornare la rimozione automatica dello stato attivo per inattività e
    `/session max-age` per controllare il limite massimo rigido.
  </Step>
  <Step title="Disassociazione">
    Utilizzare `/unfocus` per disassociare manualmente.
  </Step>
</Steps>

### Controlli manuali

| Comando            | Effetto                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Associa il thread corrente (o ne crea uno) a un obiettivo sotto-agente/sessione                     |
| `/unfocus`         | Rimuove l'associazione per il thread attualmente associato                                           |
| `/agents`          | Elenca le esecuzioni attive e lo stato dell'associazione (`binding:<id>`, `unbound` o `bindings unavailable`) |
| `/session idle`    | Ispeziona/aggiorna la rimozione automatica dello stato attivo per inattività (solo thread associati attivi)                             |
| `/session max-age` | Ispeziona/aggiorna il limite massimo rigido (solo thread associati attivi)                                      |

### Opzioni di configurazione

- **Valore predefinito globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Le chiavi di sostituzione per canale e di associazione automatica alla creazione** sono specifiche dell'adattatore. Vedere [Canali che supportano i thread](#thread-supporting-channels) sopra.

Vedere [Riferimento della configurazione](/it/gateway/configuration-reference) e
[Comandi slash](/it/tools/slash-commands) per i dettagli correnti degli adattatori.

### Elenco consentito

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco degli id agente configurati che possono essere selezionati tramite `agentId` esplicito (`["*"]` consente qualsiasi obiettivo configurato). Valore predefinito: solo l'agente richiedente. Se viene impostato un elenco e si desidera comunque che il richiedente possa creare sé stesso con `agentId`, includere l'id del richiedente nell'elenco.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Elenco consentito predefinito degli agenti di destinazione configurati, utilizzato quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate `sessions_spawn` che omettono `agentId` (impone la selezione esplicita del profilo). Sostituzione per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout per chiamata per i tentativi di consegna dell'annuncio `agent` del Gateway. I valori sono millisecondi interi positivi e vengono limitati al valore massimo del timer sicuro per la piattaforma. I nuovi tentativi transitori possono rendere l'attesa totale dell'annuncio più lunga di un singolo timeout configurato.
</ParamField>

Se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta gli obiettivi
che verrebbero eseguiti senza sandbox.

### Individuazione

Utilizzare `agents_list` per vedere quali id agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo di ogni agente elencato
e i metadati del runtime incorporato, affinché i chiamanti possano distinguere OpenClaw, l'app-server
Codex e gli altri runtime nativi configurati.

Le voci `allowAgents` devono puntare a id agente configurati in `agents.list[]`.
`["*"]` indica qualsiasi agente di destinazione configurato più il richiedente. Se la configurazione di un agente
viene eliminata ma il suo id rimane in `allowAgents`, `sessions_spawn` rifiuta tale id
e `agents_list` lo omette. Eseguire `openclaw doctor --fix` per rimuovere le voci obsolete
dell'elenco consentito oppure aggiungere una voce `agents.list[]` minima quando l'obiettivo deve
rimanere disponibile per la creazione ereditando al contempo i valori predefiniti.

### Archiviazione automatica

- Le sessioni dei sotto-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (valore predefinito `60`).
- L'archiviazione utilizza `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (conserva comunque la trascrizione rinominandola).
- L'archiviazione automatica avviene secondo il principio del massimo sforzo; i timer in sospeso vengono persi se il Gateway si riavvia.
- I timeout di esecuzione configurati **non** archiviano automaticamente; arrestano solo l'esecuzione. La sessione rimane fino all'archiviazione automatica.
- L'archiviazione automatica si applica allo stesso modo alle sessioni di profondità 1 e 2.
- La pulizia del browser è separata da quella dell'archivio: si tenta di chiudere le schede e i processi del browser monitorati al termine dell'esecuzione, anche se la trascrizione o il record della sessione viene conservato.

## Sotto-agenti annidati

Per impostazione predefinita, i sotto-agenti non possono creare i propri sotto-agenti
(`maxSpawnDepth: 1`). Impostare `maxSpawnDepth: 2` per abilitare un livello di
annidamento, ossia il **modello dell'orchestratore**: principale → sotto-agente orchestratore →
sotto-sotto-agenti esecutori.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // consente ai sotto-agenti di creare figli (valore predefinito: 1, intervallo 1-5)
        maxChildrenPerAgent: 5, // numero massimo di figli attivi per sessione agente (valore predefinito: 5, intervallo 1-20)
        maxConcurrent: 8, // limite globale della corsia di concorrenza (valore predefinito: 8)
        runTimeoutSeconds: 900, // timeout predefinito per sessions_spawn (0 = nessun timeout)
        announceTimeoutMs: 120000, // timeout per chiamata dell'annuncio del Gateway
      },
    },
  },
}
```

### Livelli di profondità

| Profondità | Forma della chiave di sessione                  | Ruolo                                                      | Può generare agenti?                  |
| ---------- | -------------------------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| 0          | `agent:<id>:main`                            | Agente principale                                          | Sempre                                |
| 1          | `agent:<id>:subagent:<uuid>`                            | Agente secondario (orchestratore se è consentito il livello 2) | Solo se `maxSpawnDepth >= 2`            |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>`                            | Agente secondario di secondo livello (worker terminale)    | Mai                                   |

### Catena degli annunci

I risultati risalgono lungo la catena:

1. Il worker di livello 2 termina → invia un annuncio al proprio genitore (orchestratore di livello 1).
2. L'orchestratore di livello 1 riceve l'annuncio, sintetizza i risultati, termina → invia un annuncio all'agente principale.
3. L'agente principale riceve l'annuncio e lo consegna all'utente.

Ogni livello vede solo gli annunci dei propri figli diretti.

<Note>
**Indicazioni operative:** avviare una sola volta il lavoro dei figli e attendere gli eventi di completamento, anziché creare cicli di polling attorno a `sessions_list`, `sessions_history`, `/subagents list` o ai comandi sleep di `exec`.
`sessions_list` e `/subagents list` mantengono le relazioni tra sessioni figlie concentrate sul lavoro attivo: i figli attivi restano collegati, quelli terminati rimangono visibili per un breve intervallo recente e i collegamenti obsoleti a figli presenti solo nell'archivio vengono ignorati dopo il relativo intervallo di validità. Ciò impedisce ai vecchi metadati `spawnedBy` / `parentSessionKey` di ripristinare figli fantasma dopo il riavvio. Se un evento di completamento di un figlio arriva dopo che è già stata inviata la risposta finale, il seguito corretto è esattamente il token silenzioso `NO_REPLY` / `no_reply`.
</Note>

### Criteri degli strumenti per profondità

- Il ruolo e l'ambito di controllo vengono registrati nei metadati della sessione al momento della generazione. Ciò impedisce alle chiavi di sessione piatte o ripristinate di riacquisire accidentalmente i privilegi di orchestratore.
- **Livello 1 (orchestratore, quando `maxSpawnDepth >= 2`):** riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, così può generare figli e verificarne lo stato. Gli altri strumenti di sessione/sistema restano negati.
- **Livello 1 (terminale, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito attuale).
- **Livello 2 (worker terminale):** nessuno strumento di sessione — `sessions_spawn` è sempre negato al livello 2. Non può generare ulteriori figli.

### Limite di generazione per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo `maxChildrenPerAgent` figli attivi contemporaneamente (valore predefinito `5`). Ciò impedisce una proliferazione incontrollata a partire da un singolo orchestratore.

### Arresto a cascata

L'arresto di un orchestratore di livello 1 arresta automaticamente tutti i suoi figli di livello 2:

- `/stop` nella chat principale arresta tutti gli agenti di livello 1 e propaga l'arresto ai rispettivi figli di livello 2.

## Autenticazione

L'autenticazione degli agenti secondari viene risolta in base all'**ID agente**, non al tipo di sessione:

- La chiave di sessione dell'agente secondario è `agent:<agentId>:subagent:<uuid>`.
- L'archivio di autenticazione viene caricato da `agentDir` di tale agente.
- I profili di autenticazione dell'agente principale vengono uniti come **fallback**; in caso di conflitto, i profili dell'agente prevalgono su quelli principali.

L'unione è additiva, quindi i profili principali sono sempre disponibili come fallback. L'autenticazione completamente isolata per ciascun agente non è ancora supportata.

## Annuncio

Gli agenti secondari restituiscono i risultati tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito all'interno della sessione dell'agente secondario (non nella sessione del richiedente).
- Se l'agente secondario risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se il testo più recente dell'assistente è esattamente il token silenzioso `NO_REPLY` / `no_reply`, l'output dell'annuncio viene soppresso anche se in precedenza erano presenti avanzamenti visibili.

La consegna dipende dalla profondità del richiedente:

- Le sessioni richiedenti di livello superiore usano una chiamata successiva a `agent` con consegna esterna (`deliver=true`).
- Le sessioni annidate degli agenti secondari richiedenti ricevono un'iniezione interna successiva (`deliver=false`), così l'orchestratore può sintetizzare i risultati dei figli all'interno della sessione.
- Se una sessione annidata dell'agente secondario richiedente non esiste più, OpenClaw ricorre al richiedente di tale sessione, quando disponibile.

Per le sessioni richiedenti di livello superiore, la consegna diretta in modalità di completamento risolve innanzitutto qualsiasi percorso associato di conversazione/thread e qualsiasi sostituzione tramite hook, quindi completa i campi mancanti di canale e destinazione usando il percorso memorizzato della sessione richiedente. Ciò mantiene i completamenti nella chat o nell'argomento corretto anche quando l'origine del completamento identifica soltanto il canale.

Durante la creazione dei risultati di completamento annidati, l'aggregazione dei completamenti dei figli è limitata all'esecuzione corrente del richiedente, impedendo che gli output obsoleti dei figli provenienti da esecuzioni precedenti confluiscano nell'annuncio corrente. Le risposte agli annunci mantengono l'instradamento di thread/argomento, quando disponibile negli adattatori di canale.

### Contesto dell'annuncio

Il contesto dell'annuncio viene normalizzato in un blocco di eventi interno stabile:

| Campo               | Origine                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| Origine             | `subagent` o `cron`                                                                 |
| ID sessione         | Chiave/ID della sessione figlia                                                                          |
| Tipo                | Tipo di annuncio + etichetta dell'attività                                                               |
| Stato               | Derivato dall'esito del runtime (`ok`, `error`, `timeout` o `unknown`) — **non** dedotto dal testo del modello |
| Contenuto risultato | Testo visibile più recente dell'assistente proveniente dal figlio                                        |
| Seguito             | Istruzione che descrive quando rispondere e quando restare in silenzio                                   |

Le esecuzioni terminali non riuscite segnalano lo stato di errore senza riprodurre il testo della risposta acquisito. L'output di strumenti/toolResult non viene promosso a testo del risultato del figlio.

### Riga delle statistiche

I payload degli annunci includono alla fine una riga di statistiche (anche quando vengono racchiusi):

- Runtime (ad esempio `runtime 5m12s`).
- Utilizzo dei token (input/output/totale).
- Costo stimato quando sono configurati i prezzi del modello (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e il percorso della trascrizione, così l'agente principale può recuperare la cronologia tramite `sessions_history` o esaminare il file su disco.

I metadati interni sono destinati esclusivamente all'orchestrazione; le risposte rivolte all'utente devono essere riscritte con la normale voce dell'assistente.

### Perché preferire `sessions_history`

`sessions_history` è il percorso di orchestrazione più sicuro per leggere la trascrizione di un figlio dall'interno del turno di un agente:

- Oscura il testo simile a credenziali/token anche quando l'oscuramento generale dei log è disabilitato.
- Tronca i blocchi di testo lunghi (4000 caratteri per blocco) ed elimina le firme di pensiero, i payload di riproduzione del ragionamento e i dati delle immagini incorporati.
- Impone un limite di risposta di 80 KB; le righe troppo grandi vengono sostituite con `[sessions_history omitted: message too large]`.
- Usare `nextOffset`, quando presente, per scorrere all'indietro le finestre precedenti della trascrizione.
- `sessions_history` **non** rimuove dal testo dei messaggi i tag di ragionamento, la struttura `<relevant-memories>` o l'XML delle chiamate agli strumenti: restituisce blocchi di contenuto strutturati vicini alla forma grezza della trascrizione, ma oscurati e con dimensioni limitate. `/subagents log` applica una sanificazione del testo più intensa (rimuove i tag di ragionamento, la struttura della memoria e l'XML delle chiamate agli strumenti), perché visualizza righe di chat in testo semplice anziché blocchi strutturati.
- L'ispezione della trascrizione grezza su disco è il fallback quando è necessaria la trascrizione completa byte per byte.

## Criteri degli strumenti

Gli agenti secondari usano innanzitutto lo stesso profilo e la stessa pipeline dei criteri degli strumenti dell'agente principale o di destinazione. Successivamente, OpenClaw applica il livello di restrizioni degli agenti secondari.

Gli agenti secondari perdono sempre `gateway`, `agents_list`, `session_status` e `cron`, indipendentemente dalla profondità o dal ruolo (strumenti a livello di sistema/interattivi o strumenti che l'agente principale deve coordinare). Gli agenti secondari terminali (comportamento predefinito di livello 1 e sempre al livello 2) perdono inoltre `subagents`, `sessions_list`, `sessions_history` e `sessions_spawn`. Gli agenti secondari non ricevono mai lo strumento `message`: viene disabilitato al momento della generazione, non filtrato da questo elenco di elementi negati; anche `sessions_send` resta negato, affinché gli agenti secondari comunichino esclusivamente tramite la catena degli annunci.

Anche qui `sessions_history` rimane una vista di richiamo limitata e sanificata: non è un dump grezzo della trascrizione.

Quando `maxSpawnDepth >= 2`, gli agenti secondari orchestratori di livello 1 ricevono inoltre `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history`, così possono gestire i propri figli.

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
        // la negazione prevale
        deny: ["gateway", "cron"],
        // se allow è impostato, diventa un elenco esclusivo di elementi consentiti (la negazione prevale comunque)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` è un filtro finale esclusivo degli elementi consentiti. Può restringere l'insieme di strumenti già risolto, ma non può **aggiungere nuovamente** uno strumento rimosso da `tools.profile`. Ad esempio, `tools.profile: "coding"` include `web_search`/`web_fetch`, ma non lo strumento `browser`. Per consentire agli agenti secondari con profilo di programmazione di usare l'automazione del browser, aggiungere il browser nella fase del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usare `agents.list[].tools.alsoAllow: ["browser"]` per agente quando soltanto un agente deve ottenere l'automazione del browser.

## Concorrenza

Gli agenti secondari usano una corsia dedicata della coda interna al processo:

- **Nome della corsia:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (valore predefinito `8`)

## Operatività e ripristino

OpenClaw non considera l'assenza di `endedAt` una prova permanente che un agente secondario sia ancora attivo. Le esecuzioni non terminate più vecchie dell'intervallo per le esecuzioni obsolete (2 ore oppure il timeout di esecuzione configurato più un breve periodo di tolleranza, a seconda di quale sia maggiore) non vengono più conteggiate come attive/in sospeso in `/subagents list`, nei riepiloghi dello stato, nel blocco del completamento dei discendenti e nei controlli di concorrenza per sessione.

Dopo il riavvio del Gateway, le esecuzioni obsolete, ripristinate e non terminate vengono eliminate, a meno che la relativa sessione figlia non sia contrassegnata con `abortedLastRun: true`. Le esecuzioni interrotte dal riavvio restano registrate per il flusso di ripristino degli agenti secondari orfani: le esecuzioni obsolete vengono finalizzate senza ripresa, mentre le sessioni figlie recenti ricevono un messaggio sintetico di ripresa prima che il marcatore di interruzione venga cancellato.

Il ripristino automatico dopo il riavvio è limitato per ciascuna sessione figlia. Se lo stesso figlio agente secondario viene accettato ripetutamente per il ripristino degli orfani all'interno dell'intervallo di rapido blocco ricorrente, OpenClaw salva un marcatore permanente di ripristino su tale sessione e smette di riprenderla automaticamente ai riavvii successivi. Eseguire `openclaw tasks maintenance --apply` per riconciliare il record dell'attività oppure `openclaw doctor --fix` per cancellare i flag obsoleti di ripristino interrotto nelle sessioni con marcatore permanente.

<Note>
Se la creazione di un sub-agente non riesce con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controllare il chiamante RPC prima di modificare lo stato di associazione.
Il coordinamento interno `sessions_spawn` esegue il dispatch nel processo quando il
chiamante è già in esecuzione nel contesto della richiesta del gateway, quindi non
apre un WebSocket di loopback né dipende dall'ambito di base dei dispositivi associati
della CLI. I chiamanti esterni al processo del gateway continuano a usare il fallback
WebSocket come `client.id: "gateway-client"` con `client.mode: "backend"`
tramite autenticazione diretta di loopback con token condiviso/password. I chiamanti remoti, i percorsi
`deviceIdentity` espliciti, i percorsi espliciti con token del dispositivo e i client browser/node
richiedono comunque la normale approvazione del dispositivo per gli aggiornamenti dell'ambito.
</Note>

## Arresto

- L'invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta tutte le esecuzioni attive dei sub-agenti avviate da essa, propagando l'arresto ai figli annidati.

## Limitazioni

- La notifica del sub-agente è eseguita secondo il principio del **massimo impegno**. Se il gateway si riavvia, il lavoro di "notifica di ritorno" in sospeso viene perso.
- I sub-agenti continuano a condividere le stesse risorse del processo del gateway; considerare `maxConcurrent` come una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto del sub-agente inserisce solo `AGENTS.md` e `TOOLS.md` (senza `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`). I sub-agenti nativi di Codex seguono lo stesso limite: `TOOLS.md` rimane nelle istruzioni ereditate del thread Codex, mentre i file di persona, identità e utente riservati al genitore vengono inseriti come istruzioni di collaborazione limitate al turno, affinché i figli non li clonino.
- La profondità massima di annidamento è 5 (intervallo di `maxSpawnDepth`: 1-5). Per la maggior parte dei casi d'uso è consigliata una profondità pari a 2.
- `maxChildrenPerAgent` limita il numero di figli attivi per sessione (valore predefinito `5`, intervallo `1-20`).

## Argomenti correlati

- [Strumenti di sessione e modifiche dello stato](/it/concepts/session-tool)
- [Agenti ACP](/it/tools/acp-agents)
- [Invio dell'agente](/it/tools/agent-send)
- [Attività in background](/it/automation/tasks)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
