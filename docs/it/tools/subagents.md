---
read_when:
    - Vuoi lavoro in background/in parallelo tramite l'agente
    - Stai modificando `sessions_spawn` o la policy degli strumenti dei sottoagenti
    - Stai implementando o risolvendo problemi di sessioni di sottoagenti vincolate al thread
summary: 'Sottoagenti: avvio di esecuzioni di agenti isolate che annunciano i risultati nella chat richiedente'
title: Sottoagenti
x-i18n:
    generated_at: "2026-04-25T18:23:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70195000c4326baba38a9a096dc8d6db178f754f345ad05d122902ee1216ab1c
    source_path: tools/subagents.md
    workflow: 15
---

I sottoagenti sono esecuzioni di agenti in background avviate da un'esecuzione esistente di un agente. Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e, al termine, **annunciano** il risultato nel canale chat del richiedente. Ogni esecuzione di sottoagente viene tracciata come [attività in background](/it/automation/tasks).

## Comando slash

Usa `/subagents` per ispezionare o controllare le esecuzioni dei sottoagenti per la **sessione corrente**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controlli del binding del thread:

Questi comandi funzionano sui canali che supportano binding persistenti dei thread. Vedi **Canali che supportano i thread** sotto.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, id sessione, percorso transcript, cleanup).
Usa `sessions_history` per una vista di richiamo delimitata e filtrata per sicurezza; ispeziona il
percorso del transcript su disco quando ti serve il transcript grezzo completo.

### Comportamento di spawn

`/subagents spawn` avvia un sottoagente in background come comando utente, non come relay interno, e invia un aggiornamento finale di completamento alla chat del richiedente quando l'esecuzione termina.

- Il comando spawn non blocca; restituisce immediatamente un id di esecuzione.
- Al completamento, il sottoagente annuncia un messaggio di riepilogo/risultato nel canale chat del richiedente.
- La consegna del completamento è push-based. Una volta avviato, non interrogare in loop `/subagents list`,
  `sessions_list` o `sessions_history` solo per aspettare che finisca; controlla lo stato solo su richiesta per debugging o intervento.
- Al completamento, OpenClaw prova in best-effort a chiudere le schede/processi browser tracciati aperti da quella sessione di sottoagente prima che continui il flusso di cleanup dell'annuncio.
- Per gli spawn manuali, la consegna è resiliente:
  - OpenClaw prova prima la consegna diretta `agent` con una chiave di idempotenza stabile.
  - Se la consegna diretta fallisce, usa come fallback l'instradamento tramite coda.
  - Se l'instradamento tramite coda non è ancora disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima dell'abbandono finale.
- La consegna del completamento mantiene il percorso risolto del richiedente:
  - i percorsi di completamento vincolati a thread o conversazione hanno priorità quando disponibili
  - se l'origine del completamento fornisce solo un canale, OpenClaw completa target/account mancanti dal percorso risolto della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così che la consegna diretta continui a funzionare
- Il passaggio del completamento alla sessione del richiedente è contesto interno generato a runtime (non testo scritto dall'utente) e include:
  - `Result` (ultimo testo visibile di risposta `assistant`, altrimenti ultimo testo sanitizzato di tool/toolResult; le esecuzioni terminali fallite non riusano il testo di risposta catturato)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistiche compatte di runtime/token
  - un'istruzione di consegna che dice all'agente richiedente di riscrivere in normale voce assistant (non inoltrare metadati interni grezzi)
- `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
- Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
- `/subagents spawn` è modalità one-shot (`mode: "run"`). Per sessioni persistenti vincolate al thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
- Per sessioni harness ACP (Codex, Claude Code, Gemini CLI), usa `sessions_spawn` con `runtime: "acp"` e vedi [Agenti ACP](/it/tools/acp-agents), in particolare il [modello di consegna ACP](/it/tools/acp-agents#delivery-model) quando esegui il debug dei completamenti o dei loop agente-agente.

Obiettivi principali:

- Parallelizzare lavoro di "ricerca / task lungo / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sottoagenti isolati per impostazione predefinita (separazione della sessione + sandboxing opzionale).
- Mantenere la superficie degli strumenti difficile da usare in modo improprio: i sottoagenti **non** ricevono per impostazione predefinita gli strumenti di sessione.
- Supportare una profondità di nesting configurabile per pattern di orchestrazione.

Nota sui costi: ogni sottoagente ha per impostazione predefinita il **proprio** contesto e il proprio uso di token. Per task pesanti o
ripetitivi, imposta un modello più economico per i sottoagenti e mantieni il tuo agente principale su un
modello di qualità superiore. Puoi configurarlo tramite `agents.defaults.subagents.model` o override
per agente. Quando un figlio ha davvero bisogno del transcript corrente del richiedente, l'agente può richiedere
`context: "fork"` per quello specifico spawn.

## Modalità di contesto

I sottoagenti nativi partono isolati a meno che il chiamante non chieda esplicitamente di fare il fork del
transcript corrente.

| Mode       | When to use it                                                                                                                         | Behavior                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Ricerca nuova, implementazione indipendente, lavoro con strumenti lenti, o qualsiasi cosa che possa essere descritta nel testo del task | Crea un transcript figlio pulito. Questa è la modalità predefinita e mantiene più basso l'uso di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, da risultati precedenti di strumenti o da istruzioni sfumate già presenti nel transcript del richiedente | Dirama il transcript del richiedente nella sessione figlia prima che il figlio inizi. |

Usa `fork` con parsimonia. Serve per delega sensibile al contesto, non come sostituto
della scrittura di un prompt del task chiaro.

## Strumento

Usa `sessions_spawn`:

- Avvia un'esecuzione di sottoagente (`deliver: false`, lane globale: `subagent`)
- Poi esegue un passaggio di annuncio e pubblica la risposta di annuncio nel canale chat del richiedente
- Modello predefinito: eredita dal chiamante a meno che non imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente); un `sessions_spawn.model` esplicito ha comunque priorità.
- Thinking predefinito: eredita dal chiamante a meno che non imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente); un `sessions_spawn.thinking` esplicito ha comunque priorità.
- Timeout predefinito dell'esecuzione: se `sessions_spawn.runTimeoutSeconds` viene omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti usa come fallback `0` (nessun timeout).

Parametri dello strumento:

- `task` (obbligatorio)
- `label?` (facoltativo)
- `agentId?` (facoltativo; avvia sotto un altro id agente se consentito)
- `model?` (facoltativo; sovrascrive il modello del sottoagente; i valori non validi vengono ignorati e il sottoagente viene eseguito sul modello predefinito con un avviso nel risultato dello strumento)
- `thinking?` (facoltativo; sovrascrive il livello di thinking per l'esecuzione del sottoagente)
- `runTimeoutSeconds?` (predefinito `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`; quando impostato, l'esecuzione del sottoagente viene interrotta dopo N secondi)
- `thread?` (predefinito `false`; quando `true`, richiede il binding del thread del canale per questa sessione di sottoagente)
- `mode?` (`run|session`)
  - il valore predefinito è `run`
  - se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`
  - `mode: "session"` richiede `thread: true`
- `cleanup?` (`delete|keep`, predefinito `keep`)
- `sandbox?` (`inherit|require`, predefinito `inherit`; `require` rifiuta lo spawn a meno che il runtime figlio di destinazione non sia in sandbox)
- `context?` (`isolated|fork`, predefinito `isolated`; solo sottoagenti nativi)
  - `isolated` crea un transcript figlio pulito ed è il valore predefinito.
  - `fork` dirama il transcript corrente del richiedente nella sessione figlia così il figlio parte con lo stesso contesto di conversazione.
  - Usa `fork` solo quando il figlio ha bisogno del transcript corrente. Per lavoro circoscritto, ometti `context`.
- `sessions_spawn` **non** accetta parametri di consegna del canale (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna, usa `message`/`sessions_send` dall'esecuzione avviata.

## Sessioni vincolate al thread

Quando i binding dei thread sono abilitati per un canale, un sottoagente può restare vincolato a un thread così che i messaggi successivi dell'utente in quel thread continuino a essere instradati alla stessa sessione di sottoagente.

### Canali che supportano i thread

- Discord (attualmente l'unico canale supportato): supporta sessioni persistenti di sottoagenti vincolate al thread (`sessions_spawn` con `thread: true`), controlli manuali del thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) e chiavi adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Flusso rapido:

1. Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"`).
2. OpenClaw crea o collega un thread a quel target di sessione nel canale attivo.
3. Le risposte e i messaggi successivi in quel thread vengono instradati alla sessione collegata.
4. Usa `/session idle` per ispezionare/aggiornare il disaccoppiamento automatico per inattività e `/session max-age` per controllare il limite rigido.
5. Usa `/unfocus` per scollegare manualmente.

Controlli manuali:

- `/focus <target>` collega il thread corrente (o ne crea uno) a un target sottoagente/sessione.
- `/unfocus` rimuove il binding per il thread attualmente collegato.
- `/agents` elenca le esecuzioni attive e lo stato del binding (`thread:<id>` o `unbound`).
- `/session idle` e `/session max-age` funzionano solo per thread collegati con focus.

Interruttori di configurazione:

- Valore predefinito globale: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Gli override per canale e le chiavi di auto-bind allo spawn sono specifici dell'adapter. Vedi **Canali che supportano i thread** sopra.

Vedi [Riferimento della configurazione](/it/gateway/configuration-reference) e [Comandi slash](/it/tools/slash-commands) per i dettagli attuali dell'adapter.

Allowlist:

- `agents.list[].subagents.allowAgents`: elenco di id agente che possono essere indirizzati tramite `agentId` (`["*"]` per consentire qualsiasi agente). Predefinito: solo l'agente richiedente.
- `agents.defaults.subagents.allowAgents`: allowlist predefinita dell'agente di destinazione usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
- Protezione di ereditarietà sandbox: se la sessione del richiedente è in sandbox, `sessions_spawn` rifiuta target che verrebbero eseguiti senza sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: quando true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza una selezione esplicita del profilo). Predefinito: false.

Discovery:

- Usa `agents_list` per vedere quali id agente sono attualmente consentiti per `sessions_spawn`.

Auto-archiviazione:

- Le sessioni di sottoagente vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito: 60).
- L'archiviazione usa `sessions.delete` e rinomina il transcript in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (mantiene comunque il transcript tramite rinomina).
- L'auto-archiviazione è best-effort; i timer in sospeso si perdono se il gateway si riavvia.
- `runTimeoutSeconds` **non** auto-archivia; interrompe solo l'esecuzione. La sessione resta fino all'auto-archiviazione.
- L'auto-archiviazione si applica allo stesso modo alle sessioni depth-1 e depth-2.
- Il cleanup del browser è separato dal cleanup di archiviazione: le schede/processi browser tracciati vengono chiusi in best-effort quando l'esecuzione termina, anche se il record transcript/sessione viene mantenuto.

## Sottoagenti annidati

Per impostazione predefinita, i sottoagenti non possono avviare i propri sottoagenti (`maxSpawnDepth: 1`). Puoi abilitare un livello di nesting impostando `maxSpawnDepth: 2`, che consente il **pattern orchestrator**: principale → sottoagente orchestratore → sotto-sottoagenti worker.

### Come abilitarlo

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // consente ai sottoagenti di avviare figli (predefinito: 1)
        maxChildrenPerAgent: 5, // massimo figli attivi per sessione agente (predefinito: 5)
        maxConcurrent: 8, // limite globale di concorrenza della lane (predefinito: 8)
        runTimeoutSeconds: 900, // timeout predefinito per sessions_spawn quando omesso (0 = nessun timeout)
      },
    },
  },
}
```

### Livelli di profondità

| Depth | Forma della chiave di sessione               | Ruolo                                         | Può avviare altri?            |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principale                             | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sottoagente (orchestrator quando è consentita depth 2) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sottoagente (worker foglia)             | Mai                          |

### Catena di annuncio

I risultati risalgono la catena:

1. Il worker depth-2 termina → annuncia al suo parent (orchestrator depth-1)
2. L'orchestrator depth-1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al principale
3. L'agente principale riceve l'annuncio e lo consegna all'utente

Ogni livello vede solo gli annunci dei propri figli diretti.

Indicazioni operative:

- Avvia il lavoro figlio una sola volta e attendi gli eventi di completamento invece di costruire loop di polling
  attorno a `sessions_list`, `sessions_history`, `/subagents list` o
  comandi `exec` con sleep.
- `sessions_list` e `/subagents list` mantengono le relazioni tra sessioni figlie focalizzate
  sul lavoro vivo: i figli attivi restano collegati, i figli terminati restano visibili per una
  breve finestra recente e i link figlio solo-store obsoleti vengono ignorati dopo la loro
  finestra di freschezza. Questo impedisce ai vecchi metadati `spawnedBy` / `parentSessionKey`
  di far riapparire figli fantasma dopo un riavvio.
- Se un evento di completamento figlio arriva dopo che hai già inviato la risposta finale,
  il corretto follow-up è il token silenzioso esatto `NO_REPLY` / `no_reply`.

### Policy degli strumenti per profondità

- L'ambito di ruolo e controllo viene scritto nei metadati della sessione al momento dello spawn. Questo impedisce che chiavi di sessione piatte o ripristinate riacquistino accidentalmente privilegi da orchestrator.
- **Depth 1 (orchestrator, quando `maxSpawnDepth >= 2`)**: riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può gestire i propri figli. Gli altri strumenti di sessione/sistema restano negati.
- **Depth 1 (foglia, quando `maxSpawnDepth == 1`)**: nessuno strumento di sessione (comportamento predefinito attuale).
- **Depth 2 (worker foglia)**: nessuno strumento di sessione — `sessions_spawn` è sempre negato a depth 2. Non può avviare ulteriori figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo `maxChildrenPerAgent` (predefinito: 5) figli attivi contemporaneamente. Questo impedisce fan-out incontrollati da un singolo orchestrator.

### Arresto a cascata

Arrestare un orchestrator depth-1 arresta automaticamente tutti i suoi figli depth-2:

- `/stop` nella chat principale arresta tutti gli agenti depth-1 e si propaga ai loro figli depth-2.
- `/subagents kill <id>` arresta uno specifico sottoagente e si propaga ai suoi figli.
- `/subagents kill all` arresta tutti i sottoagenti del richiedente e si propaga.

## Autenticazione

L'autenticazione del sottoagente viene risolta per **id agente**, non per tipo di sessione:

- La chiave di sessione del sottoagente è `agent:<agentId>:subagent:<uuid>`.
- L'auth store viene caricato da `agentDir` di quell'agente.
- I profili auth dell'agente principale vengono uniti come **fallback**; i profili dell'agente sovrascrivono quelli principali in caso di conflitto.

Nota: l'unione è additiva, quindi i profili principali sono sempre disponibili come fallback. L'autenticazione completamente isolata per agente non è ancora supportata.

## Annuncio

I sottoagenti riportano indietro tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito all'interno della sessione del sottoagente (non della sessione del richiedente).
- Se il sottoagente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se l'ultimo testo assistant è il token silenzioso esatto `NO_REPLY` / `no_reply`,
  l'output dell'annuncio viene soppresso anche se prima esistevano progressi visibili.
- Altrimenti la consegna dipende dalla profondità del richiedente:
  - le sessioni richiedenti di primo livello usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`)
  - le sessioni richiedenti di sottoagente annidate ricevono un'iniezione interna di follow-up (`deliver=false`) così l'orchestrator può sintetizzare i risultati dei figli in-session
  - se una sessione richiedente di sottoagente annidata non esiste più, OpenClaw usa come fallback il richiedente di quella sessione quando disponibile
- Per le sessioni richiedenti di primo livello, la consegna diretta in modalità completamento risolve prima qualsiasi percorso di conversazione/thread collegato e override dell'hook, poi completa i campi mancanti del target canale dal percorso memorizzato della sessione richiedente. Questo mantiene i completamenti nella chat/topic corretti anche quando l'origine del completamento identifica solo il canale.
- L'aggregazione dei completamenti figlio è limitata all'esecuzione corrente del richiedente quando costruisce i risultati di completamento annidati, impedendo che output di figli obsoleti di esecuzioni precedenti filtrino nell'annuncio corrente.
- Le risposte di annuncio preservano l'instradamento thread/topic quando disponibile sugli adapter del canale.
- Il contesto di annuncio è normalizzato in un blocco evento interno stabile:
  - source (`subagent` o `cron`)
  - chiave/id sessione figlia
  - tipo di annuncio + etichetta task
  - riga di stato derivata dall'esito runtime (`success`, `error`, `timeout` o `unknown`)
  - contenuto del risultato selezionato dall'ultimo testo assistant visibile, altrimenti ultimo testo sanitizzato tool/toolResult; le esecuzioni terminali fallite riportano lo stato di errore senza riprodurre il testo di risposta catturato
  - un'istruzione di follow-up che descrive quando rispondere e quando restare silenziosi
- `Status` non viene dedotto dall'output del modello; proviene dai segnali di esito runtime.
- In caso di timeout, se il figlio è arrivato solo fino alle chiamate di strumenti, l'annuncio può comprimere quella cronologia in un breve riepilogo del progresso parziale invece di riprodurre l'output grezzo degli strumenti.

I payload di annuncio includono una riga statistiche alla fine (anche quando wrapped):

- Runtime (ad esempio `runtime 5m12s`)
- Uso token (input/output/totale)
- Costo stimato quando è configurato il pricing del modello (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e percorso del transcript (così l'agente principale può recuperare la cronologia via `sessions_history` o ispezionare il file su disco)
- I metadati interni sono pensati solo per l'orchestrazione; le risposte rivolte all'utente devono essere riscritte in normale voce assistant.

`sessions_history` è il percorso di orchestrazione più sicuro:

- il richiamo assistant viene normalizzato prima:
  - i tag di thinking vengono rimossi
  - i blocchi scaffolding `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi payload XML di chiamata strumenti in testo semplice come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi i payload
    troncati che non si chiudono mai correttamente
  - scaffolding degradati di chiamata/risultato strumenti e marker del contesto storico vengono rimossi
  - token di controllo del modello fuoriusciti come `<|assistant|>`, altri token ASCII
    `<|...|>` e varianti full-width `<｜...｜>` vengono rimossi
  - l'XML malformato delle chiamate strumenti MiniMax viene rimosso
- il testo simile a credenziali/token viene oscurato
- i blocchi lunghi possono essere troncati
- cronologie molto grandi possono eliminare le righe più vecchie o sostituire una riga
  troppo grande con `[sessions_history omitted: message too large]`
- l'ispezione del transcript grezzo su disco è il fallback quando serve il transcript completo byte per byte

## Policy degli strumenti (strumenti del sottoagente)

I sottoagenti usano prima la stessa pipeline di profilo e policy strumenti del parent o dell'agente
di destinazione. Dopo di ciò, OpenClaw applica il livello di restrizione del sottoagente.

Senza un `tools.profile` restrittivo, i sottoagenti ricevono **tutti gli strumenti tranne gli strumenti di sessione**
e di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` resta una vista di richiamo delimitata e sanitizzata; non è
un dump grezzo del transcript.

Quando `maxSpawnDepth >= 2`, i sottoagenti orchestrator depth-1 ricevono inoltre `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` così possono gestire i propri figli.

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
        // deny ha la precedenza
        deny: ["gateway", "cron"],
        // se allow è impostato, diventa solo-allow (deny ha comunque la precedenza)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` è un filtro finale solo-allow. Può restringere l'insieme
di strumenti già risolto, ma non può riaggiungere uno strumento rimosso da
`tools.profile`. Ad esempio, `tools.profile: "coding"` include
`web_search`/`web_fetch`, ma non lo strumento `browser`. Per consentire ai sottoagenti
con profilo coding di usare l'automazione del browser, aggiungi browser nella fase del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` per agente quando solo un agente
deve ricevere l'automazione del browser.

## Concorrenza

I sottoagenti usano una lane di coda in-process dedicata:

- Nome lane: `subagent`
- Concorrenza: `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Liveness e recovery

OpenClaw non tratta l'assenza di `endedAt` come prova permanente che un sottoagente
sia ancora vivo. Le esecuzioni non concluse più vecchie della finestra stale-run smettono di contare come
attive/in sospeso in `/subagents list`, riepiloghi di stato, gating del completamento dei discendenti
e controlli di concorrenza per sessione.

Dopo un riavvio del gateway, le esecuzioni ripristinate non concluse ma obsolete vengono eliminate a meno che la
sessione figlia non sia marcata `abortedLastRun: true`. Quelle sessioni figlie
interrotte dal riavvio restano recuperabili tramite il flusso di recovery degli orfani dei sottoagenti, che
invia un messaggio sintetico di ripresa prima di cancellare il marker di interruzione.

## Arresto

- Inviare `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta tutte le esecuzioni di sottoagente attive avviate da essa, propagandosi ai figli annidati.
- `/subagents kill <id>` arresta uno specifico sottoagente e si propaga ai suoi figli.

## Limitazioni

- L'annuncio del sottoagente è **best-effort**. Se il gateway si riavvia, il lavoro pendente di "annuncio di ritorno" viene perso.
- I sottoagenti condividono comunque le stesse risorse del processo gateway; tratta `maxConcurrent` come una valvola di sicurezza.
- `sessions_spawn` non blocca mai: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto del sottoagente inietta solo `AGENTS.md` + `TOOLS.md` (non `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di nesting è 5 (intervallo `maxSpawnDepth`: 1–5). Depth 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito: 5, intervallo: 1–20).

## Correlati

- [Agenti ACP](/it/tools/acp-agents)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [Agent send](/it/tools/agent-send)
