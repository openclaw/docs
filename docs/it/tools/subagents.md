---
read_when:
    - Vuoi lavoro in background o parallelo tramite l'agente
    - Stai modificando `sessions_spawn` o la tool policy dei sub-agent
    - Stai implementando o risolvendo problemi di sessioni subagent vincolate al thread
sidebarTitle: Sub-agents
summary: Avvia esecuzioni isolate di agenti in background che annunciano i risultati nella chat del richiedente
title: Sub-agents
x-i18n:
    generated_at: "2026-04-26T11:40:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

I sub-agent sono esecuzioni di agenti in background generate da un'esecuzione agente esistente.
Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
al termine, **annunciano** il proprio risultato nel canale chat del richiedente.
Ogni esecuzione di sub-agent è tracciata come
[attività in background](/it/automation/tasks).

Obiettivi principali:

- Parallelizzare lavoro di tipo "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sub-agent isolati per impostazione predefinita (separazione delle sessioni + sandboxing facoltativo).
- Mantenere la superficie degli strumenti difficile da usare male: i sub-agent **non** ricevono gli strumenti di sessione per impostazione predefinita.
- Supportare profondità di nesting configurabile per pattern di orchestrazione.

<Note>
**Nota sui costi:** ogni sub-agent ha per impostazione predefinita il proprio contesto e il proprio utilizzo di token.
Per attività pesanti o ripetitive, imposta un modello più economico per i sub-agent
e mantieni l'agente principale su un modello di qualità superiore. Configura tramite
`agents.defaults.subagents.model` o override per agente. Quando un figlio
ha davvero bisogno del transcript corrente del richiedente, l'agente può richiedere
`context: "fork"` per quello specifico spawn.
</Note>

## Comando slash

Usa `/subagents` per ispezionare o controllare le esecuzioni dei sub-agent per la **sessione corrente**:

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
percorso del transcript, cleanup). Usa `sessions_history` per una vista di richiamo delimitata e filtrata per sicurezza; ispeziona il percorso del transcript su disco quando hai bisogno del transcript grezzo completo.

### Controlli di binding del thread

Questi comandi funzionano sui canali che supportano binding persistenti ai thread.
Vedi [Canali che supportano i thread](#thread-supporting-channels) qui sotto.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento dello spawn

`/subagents spawn` avvia un sub-agent in background come comando utente (non come
relay interno) e invia un unico aggiornamento finale di completamento alla
chat del richiedente quando l'esecuzione termina.

<AccordionGroup>
  <Accordion title="Completamento non bloccante e push-based">
    - Il comando di spawn è non bloccante; restituisce immediatamente un id di esecuzione.
    - Al completamento, il sub-agent annuncia un messaggio di riepilogo/risultato nel canale chat del richiedente.
    - Il completamento è push-based. Una volta avviato, **non** interrogare in loop `/subagents list`, `sessions_list` o `sessions_history` solo per attendere la fine; ispeziona lo stato solo su richiesta per debug o intervento.
    - Al completamento, OpenClaw chiude in best-effort le schede/processi browser tracciati aperti da quella sessione sub-agent prima che continui il flusso di cleanup dell'annuncio.

  </Accordion>
  <Accordion title="Resilienza della consegna per spawn manuale">
    - OpenClaw prova prima la consegna diretta `agent` con una chiave di idempotenza stabile.
    - Se la consegna diretta fallisce, ricade sull'instradamento tramite coda.
    - Se l'instradamento tramite coda non è ancora disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima del give-up finale.
    - La consegna del completamento mantiene la route del richiedente risolta: le route di completamento vincolate a thread o conversazione vincono quando disponibili; se l'origine del completamento fornisce solo un canale, OpenClaw riempie il target/account mancante dalla route risolta della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così che la consegna diretta continui a funzionare.

  </Accordion>
  <Accordion title="Metadati di handoff del completamento">
    L'handoff di completamento alla sessione del richiedente è contesto interno generato a runtime
    (non testo scritto dall'utente) e include:

    - `Result` — testo dell'ultima risposta `assistant` visibile, altrimenti ultimo testo sanitizzato di tool/toolResult. Le esecuzioni terminali fallite non riusano il testo di risposta acquisito.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistiche compatte di runtime/token.
    - Un'istruzione di consegna che dice all'agente del richiedente di riscrivere in normale voce assistant (non inoltrare metadati interni grezzi).

  </Accordion>
  <Accordion title="Modalità e runtime ACP">
    - `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
    - Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
    - `/subagents spawn` è modalità one-shot (`mode: "run"`). Per sessioni persistenti vincolate a thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Per sessioni harness ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx esplicito), usa `sessions_spawn` con `runtime: "acp"` quando lo strumento pubblicizza quel runtime. Vedi [Modello di consegna ACP](/it/tools/acp-agents#delivery-model) quando fai debug di completamenti o loop agente-a-agente. Quando il Plugin `codex` è abilitato, il controllo chat/thread Codex dovrebbe preferire `/codex ...` rispetto ad ACP, a meno che l'utente non chieda esplicitamente ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è in sandbox e un Plugin backend come `acpx` non è caricato. `runtime: "acp"` si aspetta un id di harness ACP esterno, oppure una voce `agents.list[]` con `runtime.type="acp"`; usa il runtime predefinito del sub-agent per i normali agenti di configurazione OpenClaw da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sub-agent nativi partono isolati a meno che il chiamante non chieda esplicitamente di fare il fork
del transcript corrente.

| Modalità   | Quando usarla                                                                                                                            | Comportamento                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `isolated` | Ricerca fresca, implementazione indipendente, lavoro con strumenti lenti o qualsiasi attività che possa essere descritta nel testo del task | Crea un transcript figlio pulito. Questo è il valore predefinito e mantiene più basso l'uso di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, da precedenti risultati di strumenti o da istruzioni sfumate già presenti nel transcript del richiedente | Biforca il transcript del richiedente nella sessione figlia prima che il figlio inizi. |

Usa `fork` con parsimonia. Serve per delega sensibile al contesto, non come
sostituto della scrittura di un prompt task chiaro.

## Strumento: `sessions_spawn`

Avvia un'esecuzione sub-agent con `deliver: false` sulla lane globale `subagent`,
poi esegue un passaggio di annuncio e pubblica la risposta di annuncio nel
canale chat del richiedente.

**Valori predefiniti:**

- **Model:** eredita dal chiamante a meno che tu non imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente); un `sessions_spawn.model` esplicito continua comunque ad avere la precedenza.
- **Thinking:** eredita dal chiamante a meno che tu non imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente); un `sessions_spawn.thinking` esplicito continua comunque ad avere la precedenza.
- **Run timeout:** se `sessions_spawn.runTimeoutSeconds` viene omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ricade su `0` (nessun timeout).

### Parametri dello strumento

<ParamField path="task" type="string" required>
  La descrizione del task per il sub-agent.
</ParamField>
<ParamField path="label" type="string">
  Etichetta leggibile da umani facoltativa.
</ParamField>
<ParamField path="agentId" type="string">
  Esegue lo spawn sotto un altro id agente quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` serve solo per harness ACP esterni (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx richiesto esplicitamente) e per le voci `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="model" type="string">
  Sovrascrive il modello del sub-agent. I valori non validi vengono saltati e il sub-agent viene eseguito con il modello predefinito con un avviso nel risultato dello strumento.
</ParamField>
<ParamField path="thinking" type="string">
  Sovrascrive il livello di thinking per l'esecuzione del sub-agent.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Per impostazione predefinita usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`. Quando è impostato, l'esecuzione del sub-agent viene interrotta dopo N secondi.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando è `true`, richiede il binding del thread del canale per questa sessione sub-agent.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` è omesso, il predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia immediatamente dopo l'annuncio (mantiene comunque il transcript tramite rename).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta lo spawn a meno che il runtime figlio di destinazione non sia in sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` biforca il transcript corrente del richiedente nella sessione figlia. Solo sub-agent nativi. Usa `fork` solo quando il figlio ha bisogno del transcript corrente.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di consegna del canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna usa
`message`/`sessions_send` dall'esecuzione generata.
</Warning>

## Sessioni vincolate al thread

Quando i thread binding sono abilitati per un canale, un sub-agent può restare associato
a un thread così che i messaggi utente successivi in quel thread continuino a essere instradati
alla stessa sessione sub-agent.

### Canali che supportano i thread

**Discord** è attualmente l'unico canale supportato. Supporta
sessioni persistenti di sub-agent vincolate al thread (`sessions_spawn` con
`thread: true`), controlli manuali del thread (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chiavi adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSubagentSessions`.

### Flusso rapido

<Steps>
  <Step title="Spawn">
    `sessions_spawn` con `thread: true` (e facoltativamente `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw crea o associa un thread a quel target di sessione nel canale attivo.
  </Step>
  <Step title="Instrada i follow-up">
    Le risposte e i messaggi successivi in quel thread vengono instradati alla sessione associata.
  </Step>
  <Step title="Ispeziona i timeout">
    Usa `/session idle` per ispezionare/aggiornare la rimozione automatica del focus per inattività e
    `/session max-age` per controllare il limite rigido.
  </Step>
  <Step title="Scollega">
    Usa `/unfocus` per scollegare manualmente.
  </Step>
</Steps>

### Controlli manuali

| Comando            | Effetto                                                              |
| ------------------ | -------------------------------------------------------------------- |
| `/focus <target>`  | Associa il thread corrente (o ne crea uno) a un target sub-agent/sessione |
| `/unfocus`         | Rimuove l'associazione per il thread corrente associato              |
| `/agents`          | Elenca esecuzioni attive e stato del binding (`thread:<id>` o `unbound`) |
| `/session idle`    | Ispeziona/aggiorna l'auto-unfocus per inattività (solo thread focalizzati associati) |
| `/session max-age` | Ispeziona/aggiorna il limite rigido (solo thread focalizzati associati) |

### Switch di configurazione

- **Predefinito globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override del canale e chiavi di auto-bind per spawn** sono specifici dell'adapter. Vedi [Canali che supportano i thread](#thread-supporting-channels) sopra.

Vedi [Riferimento della configurazione](/it/gateway/configuration-reference) e
[Comandi slash](/it/tools/slash-commands) per i dettagli correnti dell'adapter.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco di id agente che possono essere target tramite `agentId` (`["*"]` consente qualsiasi valore). Predefinito: solo l'agente del richiedente.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist predefinita degli agenti target usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Override per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Se la sessione del richiedente è in sandbox, `sessions_spawn` rifiuta i target
che verrebbero eseguiti senza sandbox.

### Discovery

Usa `agents_list` per vedere quali id agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo di ciascun agente elencato e i metadati del runtime incorporato così che i chiamanti possano distinguere PI, Codex
app-server e altri runtime nativi configurati.

### Archiviazione automatica

- Le sessioni dei sub-agent vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito `60`).
- L'archiviazione usa `sessions.delete` e rinomina il transcript in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (mantiene comunque il transcript tramite rename).
- L'archiviazione automatica è best-effort; i timer in sospeso vengono persi se il gateway si riavvia.
- `runTimeoutSeconds` **non** archivia automaticamente; interrompe solo l'esecuzione. La sessione resta fino all'archiviazione automatica.
- L'archiviazione automatica si applica in ugual misura alle sessioni di profondità 1 e 2.
- Il cleanup del browser è separato dal cleanup di archiviazione: schede/processi browser tracciati vengono chiusi in best-effort quando l'esecuzione termina, anche se il record transcript/sessione viene mantenuto.

## Sub-agent annidati

Per impostazione predefinita, i sub-agent non possono generare altri sub-agent
(`maxSpawnDepth: 1`). Imposta `maxSpawnDepth: 2` per abilitare un livello di
nesting — il **pattern orchestrator**: main → orchestrator sub-agent →
worker sub-sub-agent.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // consenti ai sub-agent di generare figli (predefinito: 1)
        maxChildrenPerAgent: 5, // massimo figli attivi per sessione agente (predefinito: 5)
        maxConcurrent: 8, // limite globale di concorrenza della lane (predefinito: 8)
        runTimeoutSeconds: 900, // timeout predefinito per sessions_spawn se omesso (0 = nessun timeout)
      },
    },
  },
}
```

### Livelli di profondità

| Profondità | Forma della chiave di sessione               | Ruolo                                         | Può generare altri?            |
| ---------- | -------------------------------------------- | --------------------------------------------- | ------------------------------ |
| 0          | `agent:<id>:main`                            | Agente principale                             | Sempre                         |
| 1          | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrator quando è consentita la profondità 2) | Solo se `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (worker foglia)                 | Mai                            |

### Catena di annuncio

I risultati risalgono la catena:

1. Il worker di profondità 2 termina → annuncia al proprio genitore (orchestrator di profondità 1).
2. L'orchestrator di profondità 1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al main.
3. L'agente main riceve l'annuncio e lo consegna all'utente.

Ogni livello vede solo gli annunci dei propri figli diretti.

<Note>
**Guida operativa:** avvia il lavoro dei figli una sola volta e attendi gli eventi di completamento
invece di costruire loop di polling attorno a `sessions_list`,
`sessions_history`, `/subagents list` o comandi `exec` con sleep.
`sessions_list` e `/subagents list` mantengono le relazioni tra sessioni figlie
focalizzate sul lavoro attivo — i figli live restano collegati, quelli terminati restano
visibili per una breve finestra recente, e i link ai figli obsoleti presenti solo nello store vengono
ignorati dopo la loro finestra di freschezza. Questo impedisce che vecchi metadati `spawnedBy` /
`parentSessionKey` resuscitino figli fantasma dopo un
riavvio. Se un evento di completamento figlio arriva dopo che hai già inviato la
risposta finale, il follow-up corretto è il token silenzioso esatto
`NO_REPLY` / `no_reply`.
</Note>

### Tool policy per profondità

- Il ruolo e l'ambito di controllo vengono scritti nei metadati della sessione al momento dello spawn. Questo evita che chiavi di sessione piatte o ripristinate riacquistino accidentalmente privilegi da orchestrator.
- **Profondità 1 (orchestrator, quando `maxSpawnDepth >= 2`):** riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può gestire i propri figli. Gli altri strumenti di sessione/sistema restano negati.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito attuale).
- **Profondità 2 (worker foglia):** nessuno strumento di sessione — `sessions_spawn` viene sempre negato alla profondità 2. Non può generare ulteriori figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo `maxChildrenPerAgent`
(predefinito `5`) figli attivi contemporaneamente. Questo previene fan-out fuori controllo
da un singolo orchestrator.

### Arresto a cascata

Arrestare un orchestrator di profondità 1 arresta automaticamente tutti i suoi figli
di profondità 2:

- `/stop` nella chat principale arresta tutti gli agenti di profondità 1 e si propaga ai loro figli di profondità 2.
- `/subagents kill <id>` arresta uno specifico sub-agent e si propaga ai suoi figli.
- `/subagents kill all` arresta tutti i sub-agent del richiedente e si propaga.

## Autenticazione

L'autenticazione dei sub-agent viene risolta per **id agente**, non per tipo di sessione:

- La chiave di sessione del sub-agent è `agent:<agentId>:subagent:<uuid>`.
- L'archivio auth viene caricato da `agentDir` di quell'agente.
- I profili auth dell'agente principale vengono uniti come **fallback**; i profili dell'agente sovrascrivono quelli del main in caso di conflitto.

L'unione è additiva, quindi i profili del main sono sempre disponibili come
fallback. L'autenticazione completamente isolata per agente non è ancora supportata.

## Annuncio

I sub-agent riportano i risultati tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito dentro la sessione del sub-agent (non nella sessione del richiedente).
- Se il sub-agent risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se l'ultimo testo assistant è il token silenzioso esatto `NO_REPLY` / `no_reply`, l'output dell'annuncio viene soppresso anche se in precedenza c'erano progressi visibili.

La consegna dipende dalla profondità del richiedente:

- Le sessioni richiedenti di primo livello usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`).
- Le sessioni richiedenti subagent annidate ricevono un'iniezione interna di follow-up (`deliver=false`) così che l'orchestrator possa sintetizzare i risultati figli nella sessione.
- Se una sessione richiedente subagent annidata non esiste più, OpenClaw ricade sul richiedente di quella sessione quando disponibile.

Per le sessioni richiedenti di primo livello, la consegna diretta in modalità completamento
risolve prima qualsiasi route di conversazione/thread associata e override degli hook, poi riempie
i campi mancanti del target canale dalla route memorizzata della sessione del richiedente.
Questo mantiene i completamenti nella chat/topic corretta anche quando l'origine del completamento
identifica solo il canale.

L'aggregazione dei completamenti figli è limitata all'esecuzione corrente del richiedente quando
costruisce i risultati di completamento annidati, impedendo che output figli obsoleti di esecuzioni precedenti
trapelino nell'annuncio corrente. Le risposte di annuncio preservano
l'instradamento thread/topic quando disponibile sugli adapter di canale.

### Contesto di annuncio

Il contesto di annuncio viene normalizzato in un blocco evento interno stabile:

| Campo          | Origine                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` o `cron`                                                                                             |
| ID sessione    | chiave/id della sessione figlia                                                                                 |
| Type           | tipo di annuncio + etichetta del task                                                                           |
| Status         | derivato dall'esito runtime (`success`, `error`, `timeout` oppure `unknown`) — **non** dedotto dal testo del modello |
| Contenuto del risultato | ultimo testo assistant visibile, altrimenti ultimo testo sanitizzato di tool/toolResult                 |
| Follow-up      | Istruzione che descrive quando rispondere e quando restare silenziosi                                           |

Le esecuzioni fallite terminali riportano lo stato di errore senza riprodurre
il testo di risposta acquisito. In caso di timeout, se il figlio è arrivato solo alle chiamate di strumenti, l'annuncio
può comprimere quella cronologia in un breve riepilogo dei progressi parziali
invece di riprodurre l'output grezzo dello strumento.

### Riga delle statistiche

I payload di annuncio includono una riga di statistiche alla fine (anche quando vengono incapsulati):

- Runtime (ad esempio `runtime 5m12s`).
- Utilizzo dei token (input/output/total).
- Costo stimato quando è configurato il pricing del modello (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e percorso del transcript così che l'agente principale possa recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco.

I metadati interni sono pensati solo per l'orchestrazione; le risposte rivolte all'utente
dovrebbero essere riscritte nella normale voce assistant.

### Perché preferire `sessions_history`

`sessions_history` è il percorso di orchestrazione più sicuro:

- Il richiamo dell'assistant viene prima normalizzato: i tag di thinking vengono rimossi; l'impalcatura `<relevant-memories>` / `<relevant_memories>` viene rimossa; i blocchi payload XML in testo semplice di tool-call (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) vengono rimossi, inclusi i payload troncati che non si chiudono mai correttamente; l'impalcatura degradata di tool-call/result e i marker di contesto storico vengono rimossi; i token di controllo del modello trapelati (`<|assistant|>`, altri ASCII `<|...|>`, full-width `<｜...｜>`) vengono rimossi; l'XML malformato di tool-call MiniMax viene rimosso.
- Il testo simile a credenziali/token viene redatto.
- I blocchi lunghi possono essere troncati.
- Le cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga sovradimensionata con `[sessions_history omitted: message too large]`.
- L'ispezione del transcript grezzo su disco è il fallback quando ti serve il transcript completo byte per byte.

## Tool policy

I sub-agent usano la stessa pipeline di profilo e tool policy dell'agente padre o
target come primo passaggio. Dopo di ciò, OpenClaw applica il livello di restrizione dei sub-agent.

Senza un `tools.profile` restrittivo, i sub-agent ricevono **tutti gli strumenti eccetto
gli strumenti di sessione** e gli strumenti di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` resta una vista di richiamo delimitata e sanitizzata — non
è un dump grezzo del transcript.

Quando `maxSpawnDepth >= 2`, i sub-agent orchestrator di profondità 1 ricevono inoltre
`sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history` così che possano gestire i propri figli.

### Override via configurazione

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
        // deny ha la precedenza
        deny: ["gateway", "cron"],
        // se allow è impostato, diventa allow-only (deny ha comunque la precedenza)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` è un filtro finale allow-only. Può restringere
l'insieme di strumenti già risolto, ma non può **riaggiungere** uno strumento rimosso
da `tools.profile`. Per esempio, `tools.profile: "coding"` include
`web_search`/`web_fetch` ma non lo strumento `browser`. Per permettere ai
sub-agent con profilo coding di usare l'automazione browser, aggiungi browser
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
agente dovrebbe avere l'automazione browser.

## Concorrenza

I sub-agent usano una lane di coda dedicata in-process:

- **Nome della lane:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Liveness e recovery

OpenClaw non considera l'assenza di `endedAt` come prova permanente che un
sub-agent sia ancora vivo. Le esecuzioni non concluse più vecchie della finestra stale-run
smettono di essere conteggiate come attive/in attesa in `/subagents list`, nei riepiloghi di stato,
nel gating del completamento dei discendenti e nei controlli di concorrenza per sessione.

Dopo un riavvio del gateway, le esecuzioni stale non concluse ripristinate vengono potate a meno che
la sessione figlia non sia contrassegnata `abortedLastRun: true`. Quelle
sessioni figlie interrotte al riavvio restano recuperabili tramite il flusso di recupero orfani dei sub-agent, che invia un messaggio sintetico di resume prima
di cancellare il marker di interruzione.

<Note>
Se uno spawn di sub-agent fallisce con `PAIRING_REQUIRED` /
`scope-upgrade` del Gateway, controlla il chiamante RPC prima di modificare lo stato di pairing.
Il coordinamento interno di `sessions_spawn` dovrebbe connettersi come
`client.id: "gateway-client"` con `client.mode: "backend"` tramite auth diretta
loopback shared-token/password; quel percorso non dipende dalla baseline di scope del dispositivo associato della CLI. I chiamanti remoti, i percorsi
`deviceIdentity` espliciti, i percorsi espliciti di device-token e i client browser/Node richiedono comunque la normale approvazione del dispositivo per gli scope upgrade.
</Note>

## Arresto

- Inviare `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta qualsiasi esecuzione attiva di sub-agent generata da essa, propagandosi ai figli annidati.
- `/subagents kill <id>` arresta un sub-agent specifico e si propaga ai suoi figli.

## Limitazioni

- L'annuncio dei sub-agent è **best-effort**. Se il gateway si riavvia, il lavoro in sospeso di "annuncio di ritorno" viene perso.
- I sub-agent condividono comunque le stesse risorse del processo gateway; tratta `maxConcurrent` come una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto del sub-agent inserisce solo `AGENTS.md` + `TOOLS.md` (niente `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di nesting è 5 (intervallo `maxSpawnDepth`: 1–5). La profondità 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito `5`, intervallo `1–20`).

## Correlati

- [ACP Agents](/it/tools/acp-agents)
- [Invio agente](/it/tools/agent-send)
- [Attività in background](/it/automation/tasks)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
