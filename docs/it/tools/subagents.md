---
read_when:
    - Vuoi eseguire lavoro in background o in parallelo tramite l'agente
    - Stai modificando sessions_spawn o la policy dello strumento sub-agent
    - Stai implementando o risolvendo problemi relativi a sessioni di sottoagenti vincolate al thread
sidebarTitle: Sub-agents
summary: Avvia esecuzioni isolate di agenti in background che comunicano i risultati alla chat del richiedente
title: Sotto-agenti
x-i18n:
    generated_at: "2026-06-28T00:13:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

I sotto-agenti sono esecuzioni di agenti in background generate da un'esecuzione di agente esistente.
Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
al termine, **annunciano** il risultato di nuovo nel canale chat
del richiedente. Ogni esecuzione di sotto-agente viene tracciata come
[attività in background](/it/automation/tasks).

Obiettivi principali:

- Parallelizzare il lavoro di "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sotto-agenti isolati per impostazione predefinita (separazione della sessione + sandboxing facoltativo).
- Mantenere la superficie degli strumenti difficile da usare in modo improprio: i sotto-agenti **non** ricevono strumenti di sessione per impostazione predefinita.
- Supportare una profondità di annidamento configurabile per i pattern di orchestrazione.

<Note>
**Nota sui costi:** ogni sotto-agente ha il proprio contesto e il proprio utilizzo di token per
impostazione predefinita. Per attività pesanti o ripetitive, imposta un modello più economico per i sotto-agenti
e mantieni l'agente principale su un modello di qualità superiore. Configura tramite
`agents.defaults.subagents.model` o override per agente. Quando un figlio
    ha davvero bisogno della trascrizione corrente del richiedente, l'agente può richiedere
    `context: "fork"` su quella singola generazione. Le sessioni di sotto-agente vincolate a un thread usano per impostazione predefinita
    `context: "fork"` perché diramano la conversazione corrente in un
    thread di follow-up.
</Note>

## Comando slash

Usa `/subagents` per ispezionare le esecuzioni di sotto-agenti per la **sessione corrente**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, id sessione,
percorso della trascrizione, pulizia). Usa `sessions_history` per una vista di richiamo limitata
e filtrata per sicurezza; ispeziona il percorso della trascrizione su disco quando
ti serve la trascrizione completa grezza.

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

Gli agenti avviano sotto-agenti in background con `sessions_spawn`. I completamenti dei sotto-agenti
ritornano come eventi interni della sessione genitore; l'agente genitore/richiedente decide
se è necessario un aggiornamento visibile all'utente.

<AccordionGroup>
  <Accordion title="Completamento non bloccante e basato su push">
    - `sessions_spawn` è non bloccante; restituisce immediatamente un id esecuzione.
    - Al completamento, il sotto-agente riferisce alla sessione genitore/richiedente.
    - I turni dell'agente che richiedono i risultati dei figli devono chiamare `sessions_yield` dopo aver generato il lavoro richiesto. Questo termina il turno corrente e consente agli eventi di completamento di arrivare come messaggio successivo visibile al modello.
    - Il completamento è basato su push. Una volta generato, **non** interrogare `/subagents list`, `sessions_list` o `sessions_history` in un ciclo solo per attendere che termini; ispeziona lo stato solo su richiesta per visibilità di debug.
    - L'output del figlio è un report/evidenza che l'agente richiedente deve sintetizzare. Non è testo di istruzione scritto dall'utente e non può sovrascrivere policy di sistema, sviluppatore o utente.
    - Al completamento, OpenClaw tenta al meglio di chiudere le schede/processi del browser tracciati aperti da quella sessione di sotto-agente prima che prosegua il flusso di pulizia dell'annuncio.

  </Accordion>
  <Accordion title="Consegna del completamento">
    - OpenClaw restituisce i completamenti alla sessione richiedente tramite un turno `agent` con una chiave di idempotenza stabile.
    - Se l'esecuzione richiedente è ancora attiva, OpenClaw prova prima a risvegliare/orientare quell'esecuzione invece di avviare un secondo percorso di risposta visibile.
    - Se non è possibile risvegliare un richiedente attivo, OpenClaw ripiega su un handoff all'agente richiedente con lo stesso contesto di completamento invece di scartare l'annuncio.
    - Un handoff genitore riuscito completa la consegna del sotto-agente anche quando il genitore decide che non è necessario alcun aggiornamento utente visibile.
    - I sotto-agenti nativi non ricevono lo strumento di messaggistica. Restituiscono testo semplice dell'assistente all'agente genitore/richiedente; le risposte visibili agli esseri umani sono di proprietà della normale policy di consegna dell'agente genitore/richiedente.
    - Se non è possibile usare l'handoff diretto, ripiega sull'instradamento in coda.
    - Se l'instradamento in coda non è ancora disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima della rinuncia finale.
    - La consegna del completamento mantiene la route del richiedente risolta: le route di completamento vincolate al thread o alla conversazione prevalgono quando disponibili; se l'origine del completamento fornisce solo un canale, OpenClaw compila target/account mancanti dalla route risolta della sessione richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta continua a funzionare.

  </Accordion>
  <Accordion title="Metadati di handoff del completamento">
    L'handoff del completamento alla sessione richiedente è contesto interno generato dal runtime
    (non testo scritto dall'utente) e include:

    - `Result` — il testo dell'ultima risposta `assistant` visibile del figlio. L'output Tool/toolResult non viene promosso nei risultati del figlio. Le esecuzioni terminali non riuscite non riutilizzano il testo di risposta catturato.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistiche compatte di runtime/token.
    - Un'istruzione di revisione che dice all'agente richiedente di verificare il risultato prima di decidere se l'attività originale è completata.
    - Una guida di follow-up che dice all'agente richiedente di continuare l'attività o registrare un follow-up quando il risultato del figlio lascia altro lavoro da fare.
    - Un'istruzione di aggiornamento finale per il percorso senza ulteriori azioni, scritta nella normale voce dell'assistente senza inoltrare metadati interni grezzi.

  </Accordion>
  <Accordion title="Modalità e runtime ACP">
    - `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
    - Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
    - Per sessioni persistenti vincolate a un thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Se il canale richiedente non supporta associazioni dei thread, usa `mode: "run"` invece di ritentare combinazioni vincolate a thread impossibili.
    - Per sessioni di harness ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx esplicito), usa `sessions_spawn` con `runtime: "acp"` quando lo strumento pubblicizza quel runtime. Vedi [Modello di consegna ACP](/it/tools/acp-agents#delivery-model) quando esegui il debug di completamenti o loop agente-agente. Quando il plugin `codex` è abilitato, il controllo chat/thread di Codex dovrebbe preferire `/codex ...` rispetto ad ACP, a meno che l'utente non chieda esplicitamente ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è in sandbox e un plugin backend come `acpx` è caricato. `runtime: "acp"` si aspetta un id harness ACP esterno, oppure una voce `agents.list[]` con `runtime.type="acp"`; usa il runtime di sotto-agente predefinito per gli agenti di configurazione OpenClaw normali da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sotto-agenti nativi iniziano isolati a meno che il chiamante non chieda esplicitamente di biforcare
la trascrizione corrente.

| Modalità   | Quando usarla                                                                                                                          | Comportamento                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Ricerca nuova, implementazione indipendente, lavoro con strumenti lenti o qualunque cosa che possa essere descritta nel testo dell'attività | Crea una trascrizione figlia pulita. È l'impostazione predefinita e mantiene più basso l'uso di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, da risultati precedenti degli strumenti o da istruzioni sfumate già presenti nella trascrizione del richiedente | Dirama la trascrizione del richiedente nella sessione figlia prima che il figlio inizi. |

Usa `fork` con parsimonia. Serve per la delega sensibile al contesto, non come
sostituto della scrittura di un prompt di attività chiaro.

## Strumento: `sessions_spawn`

Avvia un'esecuzione di sotto-agente con `deliver: false` sulla lane globale `subagent`,
poi esegue un passaggio di annuncio e pubblica la risposta di annuncio nel canale
chat del richiedente.

La disponibilità dipende dalla policy effettiva degli strumenti del chiamante. I profili `coding` e
`full` espongono `sessions_spawn` per impostazione predefinita. Il profilo `messaging`
no; aggiungi `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` o usa `tools.profile: "coding"` per gli agenti che devono delegare
lavoro. Le policy canale/gruppo, provider, sandbox e allow/deny per agente possono
comunque rimuovere lo strumento dopo la fase del profilo. Usa `/tools` dalla stessa
sessione per confermare l'elenco effettivo degli strumenti.

**Valori predefiniti:**

- **Modello:** i sotto-agenti nativi ereditano il chiamante a meno che tu non imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente). Le generazioni del runtime ACP usano lo stesso modello di sotto-agente configurato quando presente; altrimenti l'harness ACP mantiene il proprio valore predefinito. Un `sessions_spawn.model` esplicito ha comunque la precedenza.
- **Thinking:** i sotto-agenti nativi ereditano il chiamante a meno che tu non imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente). Le generazioni del runtime ACP applicano anche `agents.defaults.models["provider/model"].params.thinking` per il modello selezionato. Un `sessions_spawn.thinking` esplicito ha comunque la precedenza.
- **Timeout esecuzione:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ripiega su `0` (nessun timeout). `sessions_spawn` non accetta override di timeout per chiamata.
- **Consegna attività:** i sotto-agenti nativi ricevono l'attività delegata nel loro primo messaggio `[Subagent Task]` visibile. Il prompt di sistema del sotto-agente contiene regole di runtime e contesto di routing, non un duplicato nascosto dell'attività.

Le generazioni di sotto-agenti nativi accettate includono i metadati del modello figlio risolto
nel risultato dello strumento: `resolvedModel` contiene il riferimento del modello applicato e
`resolvedProvider` contiene il prefisso del provider quando il riferimento ne ha uno.

### Modalità del prompt di delega

`agents.defaults.subagents.delegationMode` controlla solo la guida del prompt; non cambia la policy degli strumenti né impone la delega.

- `suggest` (predefinito): mantiene il suggerimento standard del prompt di usare sotto-agenti per lavori più grandi o più lenti.
- `prefer`: dice all'agente principale di rimanere reattivo e delegare tramite `sessions_spawn` qualunque cosa più articolata di una risposta diretta.

Gli override per agente usano `agents.list[].subagents.delegationMode`.

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
  Handle stabile facoltativo per identificare un child specifico nell'output di stato successivo. Deve corrispondere a `[a-z][a-z0-9_-]{0,63}` e non può essere un target riservato come `last` o `all`.
</ParamField>
<ParamField path="label" type="string">
  Etichetta facoltativa leggibile dall'utente.
</ParamField>
<ParamField path="agentId" type="string">
  Genera sotto un altro id agente configurato quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro facoltativa dell'attività per l'esecuzione child. I sotto-agenti nativi caricano comunque i file di bootstrap dall'area di lavoro dell'agente target; `cwd` cambia solo dove gli strumenti runtime e gli harness CLI eseguono il lavoro delegato.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` è solo per harness ACP esterni (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx richiesto esplicitamente) e per le voci `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Riprende una sessione harness ACP esistente quando `runtime: "acp"`; ignorato per le generazioni di sotto-agenti nativi.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Trasmette l'output dell'esecuzione ACP alla sessione parent quando `runtime: "acp"`; omettere per le generazioni di sotto-agenti nativi.
</ParamField>
<ParamField path="model" type="string">
  Sovrascrive il modello del sotto-agente. I valori non validi vengono ignorati e il sotto-agente viene eseguito sul modello predefinito con un avviso nel risultato dello strumento.
</ParamField>
<ParamField path="thinking" type="string">
  Sovrascrive il livello di ragionamento per l'esecuzione del sotto-agente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, richiede l'associazione al thread del canale per questa sessione di sotto-agente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
  Se l'associazione al thread non è disponibile per il canale richiedente, usare invece `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia immediatamente dopo l'annuncio (conserva comunque la trascrizione tramite rinomina).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta la generazione a meno che il runtime child target sia in sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` dirama la trascrizione corrente del richiedente nella sessione child. Solo sotto-agenti nativi. Le generazioni associate a thread usano `fork` per impostazione predefinita; le generazioni senza thread usano `isolated` per impostazione predefinita.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di consegna del canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). I sotto-agenti nativi riportano
il loro turno assistente più recente al richiedente; la consegna esterna resta con
l'agente parent/richiedente.
</Warning>

### Nomi delle attività e targeting

`taskName` è un handle visibile al modello per l'orchestrazione, non una chiave di sessione.
Usalo per nomi child stabili come `review_subagents`,
`linux_validation` o `docs_update` quando un coordinatore potrebbe dover ispezionare
quel child in seguito.

La risoluzione dei target accetta corrispondenze esatte di `taskName` e prefissi
non ambigui. La corrispondenza è limitata alla stessa finestra di target attivi/recenti usata
dai target numerati `/subagents`, quindi un child completato obsoleto non rende
ambiguo un handle riutilizzato. Se due child attivi o recenti condividono lo stesso
`taskName`, il target è ambiguo; usare invece l'indice della lista, la chiave di sessione o
l'id di esecuzione.

I target riservati `last` e `all` non sono valori `taskName` validi
perché hanno già significati di controllo.

## Strumento: `sessions_yield`

Termina il turno corrente del modello e attende che gli eventi runtime, principalmente
gli eventi di completamento dei sotto-agenti, arrivino come messaggio successivo. Usalo dopo
aver generato il lavoro child richiesto quando il richiedente non può produrre una risposta
finale finché non arrivano quei completamenti.

`sessions_yield` è la primitiva di attesa. Non sostituirla con cicli di polling
su `subagents`, `sessions_list`, `sessions_history`, `sleep` della shell
o polling di processo solo per rilevare il completamento dei child.

Usa `sessions_yield` solo quando l'elenco effettivo degli strumenti della sessione lo include.
Alcuni profili di strumenti minimi o personalizzati possono esporre `sessions_spawn` e
`subagents` senza esporre `sessions_yield`; in quel caso, non inventare
un ciclo di polling solo per attendere il completamento.

Quando esistono child attivi, OpenClaw inserisce nei turni normali un blocco prompt
compatto generato dal runtime `Active Subagents`, così il richiedente può vedere
le sessioni child correnti, gli id di esecuzione, gli stati, le etichette, le attività e
gli alias `taskName` senza polling. I campi attività ed etichetta in quel
blocco sono racchiusi tra virgolette come dati, non come istruzioni, perché possono provenire
da argomenti di generazione forniti dall'utente/modello.

## Strumento: `subagents`

Elenca le esecuzioni di sotto-agenti generate e possedute dalla sessione richiedente. È limitato
al richiedente corrente; un child può vedere solo i propri child controllati.

Usa `subagents` per stato e debug su richiesta. Usa `sessions_yield` per
attendere gli eventi di completamento.

## Sessioni associate a thread

Quando le associazioni ai thread sono abilitate per un canale, un sotto-agente può restare associato
a un thread, così i messaggi utente di follow-up in quel thread continuano a essere instradati alla
stessa sessione di sotto-agente.

### Canali che supportano i thread

Qualsiasi canale con un adapter di associazione sessione può supportare sessioni
persistenti di sotto-agente associate a thread (`sessions_spawn` con `thread: true`).
Gli adapter inclusi attualmente comprendono i thread Discord, i thread Matrix,
gli argomenti forum Telegram e le associazioni alla conversazione corrente per Feishu.
Usa le chiavi di configurazione `threadBindings` per canale per l'abilitazione,
i timeout e `spawnSessions`.

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
    Usa `/session idle` per ispezionare/aggiornare il disancoraggio automatico per inattività e
    `/session max-age` per controllare il limite massimo rigido.
  </Step>
  <Step title="Scollega">
    Usa `/unfocus` per scollegare manualmente.
  </Step>
</Steps>

### Controlli manuali

| Comando            | Effetto                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Associa il thread corrente (o ne crea uno) a un target sotto-agente/sessione |
| `/unfocus`         | Rimuove l'associazione per il thread associato corrente                       |
| `/agents`          | Elenca le esecuzioni attive e lo stato di associazione (`thread:<id>` o `unbound`)       |
| `/session idle`    | Ispeziona/aggiorna il disancoraggio automatico per inattività (solo thread associati focalizzati)         |
| `/session max-age` | Ispeziona/aggiorna il limite massimo rigido (solo thread associati focalizzati)                  |

### Interruttori di configurazione

- **Predefinito globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Le chiavi di override del canale e di associazione automatica alla generazione** sono specifiche dell'adapter. Vedi [Canali che supportano i thread](#thread-supporting-channels) sopra.

Vedi [Riferimento di configurazione](/it/gateway/configuration-reference) e
[Comandi slash](/it/tools/slash-commands) per i dettagli correnti degli adapter.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco di id agente configurati che possono essere indirizzati tramite `agentId` esplicito (`["*"]` consente qualsiasi target configurato). Predefinito: solo l'agente richiedente. Se imposti un elenco e vuoi comunque che il richiedente generi se stesso con `agentId`, includi l'id del richiedente nell'elenco.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist predefinita dei target-agent configurati usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Override per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout per chiamata per i tentativi di consegna dell'annuncio `agent` del gateway. I valori sono millisecondi interi positivi e vengono limitati al massimo timer sicuro per la piattaforma. I tentativi transitori possono rendere l'attesa totale dell'annuncio più lunga di un timeout configurato.
</ParamField>

Se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta i target
che verrebbero eseguiti senza sandbox.

### Rilevamento

Usa `agents_list` per vedere quali id agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo di ogni agente elencato
e metadati runtime incorporati, così i chiamanti possono distinguere OpenClaw, il server dell'app Codex
e altri runtime nativi configurati.

Le voci `allowAgents` devono puntare a id agente configurati in `agents.list[]`.
`["*"]` indica qualsiasi agente target configurato più il richiedente. Se una configurazione agente
viene eliminata ma il suo id resta in `allowAgents`, `sessions_spawn` rifiuta quell'id
e `agents_list` lo omette. Esegui `openclaw doctor --fix` per pulire le voci
allowlist obsolete, oppure aggiungi una voce minima `agents.list[]` quando il target deve
restare generabile ereditando i valori predefiniti.

### Archiviazione automatica

- Le sessioni dei sotto-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito `60`).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (conserva comunque la trascrizione tramite rinomina).
- L'archiviazione automatica è best-effort; i timer in sospeso vengono persi se il gateway si riavvia.
- I timeout di esecuzione configurati **non** archiviano automaticamente; interrompono solo l'esecuzione. La sessione resta fino all'archiviazione automatica.
- L'archiviazione automatica si applica allo stesso modo alle sessioni di profondità 1 e profondità 2.
- La pulizia del browser è separata dalla pulizia dell'archivio: le schede/processi del browser tracciati vengono chiusi best-effort quando l'esecuzione termina, anche se il record di trascrizione/sessione viene conservato.

## Sotto-agenti annidati

Per impostazione predefinita, i sotto-agenti non possono generare i propri sotto-agenti
(`maxSpawnDepth: 1`). Imposta `maxSpawnDepth: 2` per abilitare un livello di
annidamento — il **pattern orchestrator**: main → sotto-agente orchestrator →
sotto-sotto-agenti worker.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Livelli di profondità

| Profondità | Forma della chiave di sessione                 | Ruolo                                         | Può generare?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principale                             | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sotto-agente (orchestrator quando la profondità 2 è consentita) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sotto-agente (worker foglia)            | Mai                          |

### Catena di annuncio

I risultati risalgono la catena:

1. Il worker di profondità 2 termina → lo annuncia al genitore (orchestratore di profondità 1).
2. L'orchestratore di profondità 1 riceve l'annuncio, sintetizza i risultati, termina → lo annuncia al main.
3. L'agente main riceve l'annuncio e lo consegna all'utente.

Ogni livello vede solo gli annunci dei propri figli diretti.

<Note>
**Indicazioni operative:** avvia il lavoro figlio una sola volta e attendi gli
eventi di completamento invece di creare cicli di polling intorno a
`sessions_list`, `sessions_history`, `/subagents list` o comandi di sospensione
`exec`. `sessions_list` e `/subagents list` mantengono le relazioni delle
sessioni figlie concentrate sul lavoro live: i figli live restano collegati, i
figli terminati restano visibili per una breve finestra recente e i link figlio
obsoleti presenti solo nello store vengono ignorati dopo la loro finestra di
freschezza. Questo impedisce ai vecchi metadati `spawnedBy` /
`parentSessionKey` di far riemergere figli fantasma dopo il riavvio. Se un evento
di completamento figlio arriva dopo che hai già inviato la risposta finale, il
follow-up corretto è il token silenzioso esatto `NO_REPLY` / `no_reply`.
</Note>

### Criterio degli strumenti per profondità

- Ruolo e ambito di controllo vengono scritti nei metadati della sessione al momento dello spawn. Questo impedisce a chiavi di sessione piatte o ripristinate di riottenere accidentalmente privilegi da orchestratore.
- **Profondità 1 (orchestratore, quando `maxSpawnDepth >= 2`):** riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può generare figli e ispezionarne lo stato. Gli altri strumenti di sessione/sistema restano negati.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito attuale).
- **Profondità 2 (worker foglia):** nessuno strumento di sessione: `sessions_spawn` è sempre negato a profondità 2. Non può generare ulteriori figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo
`maxChildrenPerAgent` (predefinito `5`) figli attivi alla volta. Questo impedisce
un fan-out incontrollato da un singolo orchestratore.

### Arresto a cascata

L'arresto di un orchestratore di profondità 1 arresta automaticamente tutti i
suoi figli di profondità 2:

- `/stop` nella chat main arresta tutti gli agenti di profondità 1 e si propaga ai loro figli di profondità 2.

## Autenticazione

L'autenticazione del sotto-agente viene risolta per **id agente**, non per tipo di sessione:

- La chiave di sessione del sotto-agente è `agent:<agentId>:subagent:<uuid>`.
- Lo store di autenticazione viene caricato dall'`agentDir` di quell'agente.
- I profili di autenticazione dell'agente main vengono uniti come **fallback**; i profili agente sovrascrivono i profili main in caso di conflitti.

L'unione è additiva, quindi i profili main sono sempre disponibili come
fallback. L'autenticazione completamente isolata per agente non è ancora
supportata.

## Annuncio

I sotto-agenti riportano i risultati tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito dentro la sessione del sotto-agente (non nella sessione del richiedente).
- Se il sotto-agente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se il testo assistant più recente è il token silenzioso esatto `NO_REPLY` / `no_reply`, l'output dell'annuncio viene soppresso anche se in precedenza esistevano progressi visibili.

La consegna dipende dalla profondità del richiedente:

- Le sessioni richiedenti di primo livello usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`).
- Le sessioni sotto-agente richiedenti annidate ricevono un'iniezione interna di follow-up (`deliver=false`) così l'orchestratore può sintetizzare i risultati dei figli nella sessione.
- Se una sessione sotto-agente richiedente annidata non esiste più, OpenClaw ripiega sul richiedente di quella sessione quando disponibile.

Per le sessioni richiedenti di primo livello, la consegna diretta in modalità
completamento prima risolve qualsiasi route di conversazione/thread associata e
override dell'hook, poi completa i campi channel-target mancanti dalla route
memorizzata della sessione richiedente. Questo mantiene i completamenti nella
chat/argomento corretti anche quando l'origine del completamento identifica solo
il canale.

L'aggregazione dei completamenti figlio è limitata all'esecuzione corrente del
richiedente quando si costruiscono i risultati di completamento annidati,
impedendo agli output figlio di esecuzioni precedenti obsolete di trapelare
nell'annuncio corrente. Le risposte di annuncio preservano il routing
thread/argomento quando disponibile sugli adattatori di canale.

### Contesto dell'annuncio

Il contesto dell'annuncio viene normalizzato in un blocco evento interno stabile:

| Campo              | Origine                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Origine            | `subagent` o `cron`                                                                                                  |
| ID sessione        | Chiave/id della sessione figlia                                                                                      |
| Tipo               | Tipo di annuncio + etichetta dell'attività                                                                           |
| Stato              | Derivato dall'esito runtime (`success`, `error`, `timeout` o `unknown`) — **non** dedotto dal testo del modello      |
| Contenuto risultato | Ultimo testo assistant visibile dal figlio                                                                           |
| Follow-up          | Istruzione che descrive quando rispondere rispetto a rimanere in silenzio                                            |

Le esecuzioni terminali non riuscite riportano lo stato di errore senza
riprodurre il testo di risposta acquisito. L'output tool/toolResult non viene
promosso a testo del risultato figlio.

### Riga delle statistiche

I payload di annuncio includono una riga di statistiche alla fine (anche quando wrappati):

- Runtime (per esempio `runtime 5m12s`).
- Uso dei token (input/output/totale).
- Costo stimato quando il prezzo del modello è configurato (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e percorso della trascrizione così l'agente main può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco.

I metadati interni sono destinati solo all'orchestrazione; le risposte rivolte
all'utente dovrebbero essere riscritte nella normale voce assistant.

### Perché preferire `sessions_history`

`sessions_history` è il percorso di orchestrazione più sicuro:

- Il richiamo assistant viene prima normalizzato: tag di ragionamento rimossi; scaffolding `<relevant-memories>` / `<relevant_memories>` rimosso; blocchi di payload XML di chiamata strumento in testo semplice (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) rimossi, inclusi payload troncati che non si chiudono correttamente; scaffolding tool-call/result declassato e marcatori di contesto storico rimossi; token di controllo del modello trapelati (`<|assistant|>`, altri ASCII `<|...|>`, full-width `<｜...｜>`) rimossi; XML di chiamata strumento MiniMax malformato rimosso.
- Il testo simile a credenziali/token viene redatto.
- I blocchi lunghi possono essere troncati.
- Le cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga sovradimensionata con `[sessions_history omitted: message too large]`.
- Usa `nextOffset` quando presente per sfogliare all'indietro finestre di trascrizione più vecchie.
- L'ispezione della trascrizione grezza su disco è il fallback quando serve la trascrizione completa byte per byte.

## Criterio degli strumenti

I sotto-agenti usano prima la stessa pipeline di profilo e criterio degli
strumenti del genitore o dell'agente target. Dopo, OpenClaw applica il livello di
restrizione del sotto-agente.

Senza un `tools.profile` restrittivo, i sotto-agenti ricevono **tutti gli strumenti
tranne lo strumento di messaggio, gli strumenti di sessione e gli strumenti di
sistema**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

Anche qui `sessions_history` resta una vista di richiamo limitata e sanificata:
non è un dump grezzo della trascrizione.

Quando `maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondità 1
ricevono inoltre `sessions_spawn`, `subagents`, `sessions_list` e
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

`tools.subagents.tools.allow` è un filtro finale solo-allow. Può restringere il
set di strumenti già risolto, ma non può **riaggiungere** uno strumento rimosso
da `tools.profile`. Per esempio, `tools.profile: "coding"` include
`web_search`/`web_fetch` ma non lo strumento `browser`. Per consentire ai
sotto-agenti con profilo coding di usare l'automazione del browser, aggiungi
browser nella fase del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` per agente quando solo un
agente deve ricevere l'automazione del browser.

## Concorrenza

I sotto-agenti usano una lane dedicata in coda in-process:

- **Nome lane:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Liveness e ripristino

OpenClaw non considera l'assenza di `endedAt` come prova permanente che un
sotto-agente sia ancora vivo. Le esecuzioni non terminate più vecchie della
finestra di esecuzione obsoleta smettono di contare come attive/in sospeso in
`/subagents list`, nei riepiloghi di stato, nel gating di completamento dei
discendenti e nei controlli di concorrenza per sessione.

Dopo un riavvio del Gateway, le esecuzioni ripristinate obsolete e non terminate
vengono eliminate a meno che la loro sessione figlia sia marcata
`abortedLastRun: true`. Quelle sessioni figlie interrotte dal riavvio restano
recuperabili tramite il flusso di recupero orfani dei sotto-agenti, che invia un
messaggio sintetico di ripresa prima di cancellare il marcatore di interruzione.

Il recupero automatico dopo riavvio è limitato per sessione figlia. Se lo stesso
figlio sotto-agente viene accettato ripetutamente per il recupero orfani dentro
la finestra rapida di nuovo blocco, OpenClaw persiste una tombstone di recupero
su quella sessione e smette di riprenderla automaticamente nei riavvii
successivi. Esegui `openclaw tasks maintenance --apply` per riconciliare il
record dell'attività, oppure `openclaw doctor --fix` per cancellare flag di
recupero interrotto obsoleti sulle sessioni con tombstone.

<Note>
Se lo spawn di un sotto-agente fallisce con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controlla il chiamante RPC prima di modificare lo stato di
pairing. Il coordinamento interno `sessions_spawn` invia in process quando il
chiamante è già in esecuzione dentro il contesto di richiesta del gateway, quindi
non apre un WebSocket loopback né dipende dalla baseline dello scope del
dispositivo associato della CLI. I chiamanti esterni al processo gateway usano
ancora il fallback WebSocket come `client.id: "gateway-client"` con
`client.mode: "backend"` su autenticazione diretta loopback con token/password
condivisi. I chiamanti remoti, `deviceIdentity` esplicito, percorsi espliciti con
device-token e client browser/node richiedono ancora la normale approvazione del
dispositivo per gli upgrade di scope.
</Note>

## Arresto

- L'invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta qualsiasi esecuzione sotto-agente attiva generata da essa, propagandosi ai figli annidati.

## Limitazioni

- L'annuncio dei sotto-agenti è **best-effort**. Se il gateway si riavvia, il lavoro "annuncia indietro" in sospeso viene perso.
- I sotto-agenti condividono comunque le stesse risorse del processo gateway; considera `maxConcurrent` come una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce `{ status: "accepted", runId, childSessionKey }` immediatamente.
- Il contesto del sotto-agente inietta solo `AGENTS.md` e `TOOLS.md` (nessun `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`). I sotto-agenti nativi Codex seguono lo stesso confine: `TOOLS.md` resta nelle istruzioni del thread Codex ereditate, mentre i file persona, identità e utente solo del genitore vengono iniettati come istruzioni di collaborazione limitate al turno così i figli non li clonano.
- La profondità massima di annidamento è 5 (intervallo `maxSpawnDepth`: 1–5). La profondità 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito `5`, intervallo `1–20`).

## Correlati

- [Agenti ACP](/it/tools/acp-agents)
- [Invio agente](/it/tools/agent-send)
- [Attività in background](/it/automation/tasks)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
