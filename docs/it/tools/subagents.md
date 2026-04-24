---
read_when:
    - Vuoi lavoro in background/parallelo tramite l'agente
    - Stai modificando `sessions_spawn` o il criterio degli strumenti dei sub-agent
    - Stai implementando o risolvendo problemi relativi a sessioni di sub-agent vincolate al thread
summary: 'Sub-agent: avvio di esecuzioni isolate di agenti che annunciano i risultati di ritorno alla chat del richiedente'
title: Sub-agenti
x-i18n:
    generated_at: "2026-04-24T09:08:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

I sub-agent sono esecuzioni in background di agenti avviate da un'esecuzione esistente di un agente. Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e, al termine, **annunciano** il loro risultato di ritorno al canale chat del richiedente. Ogni esecuzione di sub-agent viene tracciata come [task in background](/it/automation/tasks).

## Comando slash

Usa `/subagents` per ispezionare o controllare le esecuzioni dei sub-agent per la **sessione corrente**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controlli di binding al thread:

Questi comandi funzionano sui canali che supportano binding persistenti al thread. Vedi **Canali che supportano i thread** qui sotto.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, id sessione, percorso della trascrizione, cleanup).
Usa `sessions_history` per una vista di richiamo limitata e filtrata per sicurezza; ispeziona il
percorso della trascrizione su disco quando ti serve la trascrizione grezza completa.

### Comportamento di spawn

`/subagents spawn` avvia un sub-agent in background come comando utente, non come relay interno, e invia un aggiornamento finale di completamento al canale chat del richiedente quando l'esecuzione termina.

- Il comando spawn non è bloccante; restituisce immediatamente un id esecuzione.
- Al completamento, il sub-agent annuncia un messaggio di riepilogo/risultato al canale chat del richiedente.
- La consegna del completamento è push-based. Una volta avviato, non fare polling di `/subagents list`,
  `sessions_list` o `sessions_history` in un loop solo per aspettare che
  termini; ispeziona lo stato solo on-demand per debug o intervento.
- Al completamento, OpenClaw chiude best-effort le schede/processi browser tracciati aperti da quella sessione di sub-agent prima che continui il flusso di cleanup dell'annuncio.
- Per gli spawn manuali, la consegna è resiliente:
  - OpenClaw prova prima la consegna diretta `agent` con una chiave di idempotenza stabile.
  - Se la consegna diretta fallisce, ripiega sul routing in coda.
  - Se il routing in coda non è ancora disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima dell'abbandono finale.
- La consegna del completamento mantiene la route del richiedente risolta:
  - le route di completamento vincolate al thread o alla conversazione hanno priorità quando disponibili
  - se l'origine del completamento fornisce solo un canale, OpenClaw compila target/account mancanti dalla route risolta della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta continua a funzionare
- Il handoff del completamento alla sessione del richiedente è contesto interno generato a runtime (non testo scritto dall'utente) e include:
  - `Result` (ultimo testo visibile di risposta `assistant`, altrimenti ultimo testo tool/toolResult sanificato; le esecuzioni fallite terminali non riutilizzano il testo di risposta catturato)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistiche compatte di runtime/token
  - un'istruzione di consegna che dice all'agente richiedente di riscrivere in normale voce da assistant (non inoltrare metadati interni grezzi)
- `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
- Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
- `/subagents spawn` è modalità one-shot (`mode: "run"`). Per sessioni persistenti vincolate al thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
- Per sessioni harness ACP (Codex, Claude Code, Gemini CLI), usa `sessions_spawn` con `runtime: "acp"` e vedi [ACP Agents](/it/tools/acp-agents), in particolare il [modello di consegna ACP](/it/tools/acp-agents#delivery-model) quando esegui il debug di completamenti o loop agente-agente.

Obiettivi principali:

- Parallelizzare lavoro "ricerca / task lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sub-agent isolati per impostazione predefinita (separazione delle sessioni + sandboxing facoltativo).
- Mantenere la superficie degli strumenti difficile da usare in modo improprio: i sub-agent **non** ottengono gli strumenti di sessione per impostazione predefinita.
- Supportare profondità di nesting configurabile per pattern da orchestratore.

Nota sui costi: ogni sub-agent ha per impostazione predefinita **il proprio** contesto e consumo di token. Per task pesanti o
ripetitive, imposta un modello più economico per i sub-agent e mantieni il tuo agente principale su un
modello di qualità superiore. Puoi configurarlo tramite `agents.defaults.subagents.model` o override
per agente. Quando un figlio ha davvero bisogno della trascrizione corrente del richiedente, l'agente può richiedere
`context: "fork"` in quello specifico spawn.

## Strumento

Usa `sessions_spawn`:

- Avvia un'esecuzione di sub-agent (`deliver: false`, lane globale: `subagent`)
- Poi esegue un passaggio di annuncio e pubblica la risposta di annuncio sul canale chat del richiedente
- Modello predefinito: eredita il chiamante a meno che tu non imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente); un `sessions_spawn.model` esplicito ha comunque la priorità.
- Thinking predefinito: eredita il chiamante a meno che tu non imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente); un `sessions_spawn.thinking` esplicito ha comunque la priorità.
- Timeout di esecuzione predefinito: se `sessions_spawn.runTimeoutSeconds` viene omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ripiega su `0` (nessun timeout).

Parametri dello strumento:

- `task` (obbligatorio)
- `label?` (facoltativo)
- `agentId?` (facoltativo; avvia sotto un altro id agente se consentito)
- `model?` (facoltativo; sovrascrive il modello del sub-agent; i valori non validi vengono saltati e il sub-agent viene eseguito sul modello predefinito con un avviso nel risultato dello strumento)
- `thinking?` (facoltativo; sovrascrive il livello di thinking per l'esecuzione del sub-agent)
- `runTimeoutSeconds?` (predefinito `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`; quando impostato, l'esecuzione del sub-agent viene interrotta dopo N secondi)
- `thread?` (predefinito `false`; quando `true`, richiede il binding al thread del canale per questa sessione di sub-agent)
- `mode?` (`run|session`)
  - il valore predefinito è `run`
  - se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`
  - `mode: "session"` richiede `thread: true`
- `cleanup?` (`delete|keep`, predefinito `keep`)
- `sandbox?` (`inherit|require`, predefinito `inherit`; `require` rifiuta lo spawn a meno che il runtime figlio di destinazione non sia sandboxed)
- `context?` (`isolated|fork`, predefinito `isolated`; solo sub-agent nativi)
  - `isolated` crea una trascrizione figlia pulita ed è il valore predefinito.
  - `fork` dirama la trascrizione corrente del richiedente nella sessione figlia così il figlio parte con lo stesso contesto conversazionale.
  - Usa `fork` solo quando il figlio ha bisogno della trascrizione corrente. Per lavoro con scope limitato, ometti `context`.
- `sessions_spawn` **non** accetta parametri di consegna del canale (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna, usa `message`/`sessions_send` dall'esecuzione avviata.

## Sessioni vincolate al thread

Quando i binding al thread sono abilitati per un canale, un sub-agent può restare vincolato a un thread così i messaggi utente successivi in quel thread continuano a essere instradati alla stessa sessione di sub-agent.

### Canali che supportano i thread

- Discord (attualmente l'unico canale supportato): supporta sessioni persistenti di sub-agent vincolate al thread (`sessions_spawn` con `thread: true`), controlli manuali del thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) e chiavi adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Flusso rapido:

1. Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"`).
2. OpenClaw crea o collega un thread a quel target di sessione nel canale attivo.
3. Risposte e messaggi successivi in quel thread vengono instradati alla sessione vincolata.
4. Usa `/session idle` per ispezionare/aggiornare il distacco automatico per inattività e `/session max-age` per controllare il limite rigido.
5. Usa `/unfocus` per staccare manualmente.

Controlli manuali:

- `/focus <target>` vincola il thread corrente (o ne crea uno) a un target di sub-agent/sessione.
- `/unfocus` rimuove il binding per il thread attualmente vincolato.
- `/agents` elenca le esecuzioni attive e lo stato del binding (`thread:<id>` oppure `unbound`).
- `/session idle` e `/session max-age` funzionano solo per thread vincolati in focus.

Interruttori di configurazione:

- Predefinito globale: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Le chiavi di override del canale e di auto-bind allo spawn sono specifiche dell'adapter. Vedi **Canali che supportano i thread** sopra.

Vedi [Riferimento della configurazione](/it/gateway/configuration-reference) e [Comandi slash](/it/tools/slash-commands) per i dettagli correnti dell'adapter.

Allowlist:

- `agents.list[].subagents.allowAgents`: elenco di id agente che possono essere usati come target tramite `agentId` (`["*"]` per consentire qualunque agente). Predefinito: solo l'agente richiedente.
- `agents.defaults.subagents.allowAgents`: allowlist predefinita degli agenti di destinazione usata quando l'agente richiedente non imposta `subagents.allowAgents`.
- Guardia di ereditarietà sandbox: se la sessione richiedente è sandboxed, `sessions_spawn` rifiuta target che verrebbero eseguiti senza sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: quando true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza selezione esplicita del profilo). Predefinito: false.

Discovery:

- Usa `agents_list` per vedere quali id agente sono attualmente consentiti per `sessions_spawn`.

Archiviazione automatica:

- Le sessioni di sub-agent vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito: 60).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
- L'archiviazione automatica è best-effort; i timer in sospeso vanno persi se il gateway si riavvia.
- `runTimeoutSeconds` **non** archivia automaticamente; interrompe solo l'esecuzione. La sessione resta fino all'archiviazione automatica.
- L'archiviazione automatica si applica allo stesso modo a sessioni di profondità 1 e profondità 2.
- Il cleanup del browser è separato dal cleanup di archiviazione: schede/processi browser tracciati vengono chiusi best-effort quando l'esecuzione termina, anche se il record di sessione/trascrizione viene mantenuto.

## Sub-agent annidati

Per impostazione predefinita, i sub-agent non possono avviare altri sub-agent (`maxSpawnDepth: 1`). Puoi abilitare un livello di nesting impostando `maxSpawnDepth: 2`, che consente il **pattern orchestratore**: principale → sub-agent orchestratore → sub-sub-agent worker.

### Come abilitarlo

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // consente ai sub-agent di avviare figli (predefinito: 1)
        maxChildrenPerAgent: 5, // massimo figli attivi per sessione agente (predefinito: 5)
        maxConcurrent: 8, // limite globale di concorrenza lane (predefinito: 8)
        runTimeoutSeconds: 900, // timeout predefinito per sessions_spawn quando omesso (0 = nessun timeout)
      },
    },
  },
}
```

### Livelli di profondità

| Depth | Forma della chiave sessione                 | Ruolo                                         | Può avviare?                 |
| ----- | ------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                           | Agente principale                             | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                | Sub-agent (orchestratore quando depth 2 è consentito) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (worker foglia)                 | Mai                          |

### Catena di annuncio

I risultati scorrono di ritorno lungo la catena:

1. Il worker depth-2 termina → annuncia al proprio genitore (orchestratore depth-1)
2. L'orchestratore depth-1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al principale
3. L'agente principale riceve l'annuncio e lo consegna all'utente

Ogni livello vede solo gli annunci dei propri figli diretti.

Guida operativa:

- Avvia il lavoro figlio una sola volta e attendi gli eventi di completamento invece di costruire loop di polling attorno a `sessions_list`, `sessions_history`, `/subagents list` o comandi `exec` con sleep.
- Se un evento di completamento del figlio arriva dopo che hai già inviato la risposta finale, il follow-up corretto è l'esatto token silenzioso `NO_REPLY` / `no_reply`.

### Criterio degli strumenti per profondità

- Il ruolo e lo scope di controllo vengono scritti nei metadati della sessione al momento dello spawn. Questo impedisce che chiavi di sessione appiattite o ripristinate riacquistino accidentalmente privilegi da orchestratore.
- **Depth 1 (orchestratore, quando `maxSpawnDepth >= 2`)**: riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può gestire i propri figli. Gli altri strumenti di sessione/sistema restano negati.
- **Depth 1 (foglia, quando `maxSpawnDepth == 1`)**: nessuno strumento di sessione (comportamento predefinito attuale).
- **Depth 2 (worker foglia)**: nessuno strumento di sessione — `sessions_spawn` è sempre negato a depth 2. Non può avviare ulteriori figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo `maxChildrenPerAgent` (predefinito: 5) figli attivi contemporaneamente. Questo impedisce una fan-out incontrollata da un singolo orchestratore.

### Arresto a cascata

Fermare un orchestratore depth-1 ferma automaticamente tutti i suoi figli depth-2:

- `/stop` nella chat principale ferma tutti gli agenti depth-1 e si propaga ai loro figli depth-2.
- `/subagents kill <id>` ferma uno specifico sub-agent e si propaga ai suoi figli.
- `/subagents kill all` ferma tutti i sub-agent per il richiedente e si propaga.

## Autenticazione

L'auth dei sub-agent viene risolta in base all'**id agente**, non al tipo di sessione:

- La chiave di sessione del sub-agent è `agent:<agentId>:subagent:<uuid>`.
- Lo store auth viene caricato da `agentDir` di quell'agente.
- I profili auth dell'agente principale vengono uniti come **fallback**; in caso di conflitti, i profili dell'agente sovrascrivono quelli del principale.

Nota: l'unione è additiva, quindi i profili principali sono sempre disponibili come fallback. L'isolamento completo dell'auth per agente non è ancora supportato.

## Annuncio

I sub-agent riportano il risultato tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito all'interno della sessione del sub-agent (non della sessione del richiedente).
- Se il sub-agent risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se l'ultimo testo assistant è l'esatto token silenzioso `NO_REPLY` / `no_reply`,
  l'output di annuncio viene soppresso anche se in precedenza c'era stato avanzamento visibile.
- Altrimenti la consegna dipende dalla profondità del richiedente:
  - le sessioni richiedenti di livello superiore usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`)
  - le sessioni subagent annidate del richiedente ricevono un'iniezione interna di follow-up (`deliver=false`) così l'orchestratore può sintetizzare i risultati dei figli nella sessione
  - se una sessione subagent annidata del richiedente non esiste più, OpenClaw ripiega sul richiedente di quella sessione quando disponibile
- Per le sessioni richiedenti di livello superiore, la consegna diretta in modalità completamento risolve prima qualsiasi route vincolata a conversazione/thread e override hook, poi riempie i campi target del canale mancanti dalla route memorizzata della sessione del richiedente. Questo mantiene i completamenti nella chat/topic corretta anche quando l'origine del completamento identifica solo il canale.
- L'aggregazione dei completamenti dei figli è limitata all'esecuzione corrente del richiedente quando costruisce i nested completion findings, impedendo che output di figli di esecuzioni precedenti e stale entrino nell'annuncio corrente.
- Le risposte di annuncio preservano il routing thread/topic quando disponibile sugli adapter dei canali.
- Il contesto di annuncio viene normalizzato in un blocco evento interno stabile:
  - source (`subagent` oppure `cron`)
  - chiave/id sessione figlia
  - tipo di annuncio + etichetta del task
  - riga di stato derivata dall'esito runtime (`success`, `error`, `timeout` oppure `unknown`)
  - contenuto del risultato selezionato dall'ultimo testo assistant visibile, altrimenti ultimo testo tool/toolResult sanificato; le esecuzioni fallite terminali riportano lo stato di errore senza riprodurre il testo di risposta catturato
  - un'istruzione di follow-up che descrive quando rispondere rispetto a quando restare in silenzio
- `Status` non viene inferito dall'output del modello; proviene dai segnali di esito runtime.
- In caso di timeout, se il figlio è arrivato solo alle chiamate strumento, l'annuncio può comprimere quella cronologia in un breve riepilogo del progresso parziale invece di riprodurre l'output grezzo degli strumenti.

I payload di annuncio includono una riga statistiche alla fine (anche quando wrappati):

- Runtime (ad es. `runtime 5m12s`)
- Uso dei token (input/output/totale)
- Costo stimato quando è configurato il pricing del modello (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e percorso della trascrizione (così l'agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco)
- I metadati interni sono pensati solo per l'orchestrazione; le risposte rivolte all'utente dovrebbero essere riscritte con una normale voce da assistant.

`sessions_history` è il percorso di orchestrazione più sicuro:

- il richiamo assistant viene prima normalizzato:
  - i tag di thinking vengono rimossi
  - i blocchi scaffolding `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi payload XML di chiamate strumento in testo normale come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi i payload
    troncati che non si chiudono mai correttamente
  - scaffolding declassato di tool-call/result e marker di contesto storico vengono rimossi
  - token di controllo del modello trapelati come `<|assistant|>`, altri token
    ASCII `<|...|>` e varianti full-width `<｜...｜>` vengono rimossi
  - XML malformed di tool-call MiniMax viene rimosso
- il testo simile a credenziali/token viene redatto
- i blocchi lunghi possono essere troncati
- cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga sovradimensionata con
  `[sessions_history omitted: message too large]`
- l'ispezione grezza della trascrizione su disco è il fallback quando ti serve la trascrizione completa byte per byte

## Criterio degli strumenti (strumenti del sub-agent)

Per impostazione predefinita, i sub-agent ricevono **tutti gli strumenti tranne quelli di sessione** e gli strumenti di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` qui resta comunque una vista di richiamo limitata e sanificata; non è
un dump grezzo della trascrizione.

Quando `maxSpawnDepth >= 2`, i sub-agent orchestratori depth-1 ricevono inoltre `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` così possono gestire i propri figli.

Override tramite configurazione:

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
        // deny ha priorità
        deny: ["gateway", "cron"],
        // se allow è impostato, diventa solo-allow (deny ha comunque priorità)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concorrenza

I sub-agent usano una lane di coda dedicata in-process:

- Nome lane: `subagent`
- Concorrenza: `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Arresto

- L'invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e ferma qualsiasi esecuzione di sub-agent attiva avviata da essa, propagandosi ai figli annidati.
- `/subagents kill <id>` ferma uno specifico sub-agent e si propaga ai suoi figli.

## Limitazioni

- L'annuncio del sub-agent è **best-effort**. Se il gateway si riavvia, il lavoro pendente di "announce back" viene perso.
- I sub-agent condividono comunque le stesse risorse del processo gateway; considera `maxConcurrent` come una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto del sub-agent inietta solo `AGENTS.md` + `TOOLS.md` (nessun `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di nesting è 5 (intervallo `maxSpawnDepth`: 1–5). Depth 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito: 5, intervallo: 1–20).

## Correlati

- [ACP agents](/it/tools/acp-agents)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [Agent send](/it/tools/agent-send)
