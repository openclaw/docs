---
read_when:
    - Vuoi eseguire lavoro in background/in parallelo tramite l’agente
    - Stai modificando `sessions_spawn` o la policy dello strumento dei sotto-agenti
    - Stai implementando o risolvendo problemi delle sessioni di sotto-agenti vincolate al thread
summary: 'Sotto-agenti: avvio di esecuzioni di agenti isolate che riportano i risultati nella chat del richiedente'
title: Sotto-agenti
x-i18n:
    generated_at: "2026-04-21T19:20:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 218913f0db88d40e1b5fdb0201b8d23e7af23df572c86ff4be2637cb62498281
    source_path: tools/subagents.md
    workflow: 15
---

# Sotto-agenti

I sotto-agenti sono esecuzioni di agenti in background generate da un’esecuzione di agente esistente. Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e, quando terminano, **annunciano** il loro risultato di nuovo al canale chat del richiedente. Ogni esecuzione di sotto-agente viene tracciata come [attività in background](/it/automation/tasks).

## Comando slash

Usa `/subagents` per ispezionare o controllare le esecuzioni dei sotto-agenti per la **sessione corrente**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controlli di associazione al thread:

Questi comandi funzionano sui canali che supportano associazioni persistenti ai thread. Vedi **Canali che supportano i thread** qui sotto.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` mostra i metadati dell’esecuzione (stato, timestamp, id sessione, percorso della trascrizione, pulizia).
Usa `sessions_history` per una vista di richiamo delimitata e filtrata per sicurezza; ispeziona il
percorso della trascrizione su disco quando ti serve la trascrizione completa non elaborata.

### Comportamento di spawn

`/subagents spawn` avvia un sotto-agente in background come comando utente, non come inoltro interno, e invia un unico aggiornamento finale di completamento alla chat del richiedente quando l’esecuzione termina.

- Il comando di spawn non è bloccante; restituisce immediatamente un id di esecuzione.
- Al completamento, il sotto-agente annuncia un messaggio di riepilogo/risultato di nuovo al canale chat del richiedente.
- La consegna del completamento è basata su push. Una volta avviato, non interrogare `/subagents list`,
  `sessions_list` o `sessions_history` in un ciclo solo per aspettarne il
  termine; ispeziona lo stato solo su richiesta per debug o intervento.
- Al completamento, OpenClaw prova in modalità best effort a chiudere schede/processi del browser tracciati aperti da quella sessione di sotto-agente prima che prosegua il flusso di pulizia dell’annuncio.
- Per gli spawn manuali, la consegna è resiliente:
  - OpenClaw prova prima la consegna diretta `agent` con una chiave di idempotenza stabile.
  - Se la consegna diretta fallisce, ricorre all’instradamento tramite coda.
  - Se anche l’instradamento tramite coda non è disponibile, l’annuncio viene ritentato con un breve backoff esponenziale prima della rinuncia finale.
- La consegna del completamento mantiene il percorso del richiedente risolto:
  - i percorsi di completamento associati a thread o conversazione hanno priorità quando disponibili
  - se l’origine del completamento fornisce solo un canale, OpenClaw completa il target/account mancante dal percorso risolto della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta continua a funzionare
- Il passaggio del completamento alla sessione del richiedente è un contesto interno generato a runtime (non testo scritto dall’utente) e include:
  - `Result` (testo più recente visibile della risposta `assistant`, altrimenti testo più recente sanitizzato di tool/toolResult; le esecuzioni terminali fallite non riutilizzano il testo della risposta acquisita)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistiche compatte di runtime/token
  - un’istruzione di consegna che dice all’agente richiedente di riscrivere in normale voce dell’assistente (non inoltrare metadati interni non elaborati)
- `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
- Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
- `/subagents spawn` è modalità one-shot (`mode: "run"`). Per sessioni persistenti associate al thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
- Per sessioni harness ACP (Codex, Claude Code, Gemini CLI), usa `sessions_spawn` con `runtime: "acp"` e vedi [Agenti ACP](/it/tools/acp-agents).

Obiettivi principali:

- Parallelizzare lavoro di tipo "ricerca / attività lunga / tool lento" senza bloccare l’esecuzione principale.
- Mantenere i sotto-agenti isolati per impostazione predefinita (separazione delle sessioni + sandboxing opzionale).
- Mantenere la superficie dei tool difficile da usare in modo improprio: i sotto-agenti **non** ricevono i tool di sessione per impostazione predefinita.
- Supportare una profondità di nidificazione configurabile per i pattern da orchestratore.

Nota sui costi: ogni sotto-agente ha il **proprio** contesto e il proprio utilizzo di token. Per attività pesanti o ripetitive,
imposta un modello più economico per i sotto-agenti e mantieni il tuo agente principale su un modello di qualità superiore.
Puoi configurarlo tramite `agents.defaults.subagents.model` o override per agente.

## Tool

Usa `sessions_spawn`:

- Avvia un’esecuzione di sotto-agente (`deliver: false`, lane globale: `subagent`)
- Poi esegue una fase di annuncio e pubblica la risposta di annuncio nel canale chat del richiedente
- Modello predefinito: eredita quello del chiamante a meno che tu non imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente); un valore esplicito di `sessions_spawn.model` ha comunque priorità.
- Thinking predefinito: eredita quello del chiamante a meno che tu non imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente); un valore esplicito di `sessions_spawn.thinking` ha comunque priorità.
- Timeout predefinito dell’esecuzione: se `sessions_spawn.runTimeoutSeconds` viene omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti torna a `0` (nessun timeout).

Parametri del tool:

- `task` (obbligatorio)
- `label?` (facoltativo)
- `agentId?` (facoltativo; avvia sotto un altro id agente se consentito)
- `model?` (facoltativo; sovrascrive il modello del sotto-agente; i valori non validi vengono saltati e il sotto-agente viene eseguito sul modello predefinito con un avviso nel risultato del tool)
- `thinking?` (facoltativo; sovrascrive il livello di thinking per l’esecuzione del sotto-agente)
- `runTimeoutSeconds?` (predefinito: `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`; quando impostato, l’esecuzione del sotto-agente viene interrotta dopo N secondi)
- `thread?` (predefinito `false`; quando `true`, richiede l’associazione del thread del canale per questa sessione di sotto-agente)
- `mode?` (`run|session`)
  - il valore predefinito è `run`
  - se `thread: true` e `mode` viene omesso, il valore predefinito diventa `session`
  - `mode: "session"` richiede `thread: true`
- `cleanup?` (`delete|keep`, predefinito `keep`)
- `sandbox?` (`inherit|require`, predefinito `inherit`; `require` rifiuta lo spawn a meno che il runtime figlio di destinazione sia in sandbox)
- `sessions_spawn` **non** accetta parametri di consegna del canale (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna, usa `message`/`sessions_send` dall’esecuzione generata.

## Sessioni associate al thread

Quando le associazioni ai thread sono abilitate per un canale, un sotto-agente può restare associato a un thread così i successivi messaggi utente in quel thread continuano a essere instradati alla stessa sessione di sotto-agente.

### Canali che supportano i thread

- Discord (attualmente l’unico canale supportato): supporta sessioni persistenti di sotto-agenti associate al thread (`sessions_spawn` con `thread: true`), controlli manuali del thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) e chiavi adattatore `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Flusso rapido:

1. Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"`).
2. OpenClaw crea o associa un thread a quel target di sessione nel canale attivo.
3. Le risposte e i messaggi successivi in quel thread vengono instradati alla sessione associata.
4. Usa `/session idle` per ispezionare/aggiornare il disaccoppiamento automatico per inattività e `/session max-age` per controllare il limite rigido.
5. Usa `/unfocus` per scollegare manualmente.

Controlli manuali:

- `/focus <target>` associa il thread corrente (o ne crea uno) a un target di sotto-agente/sessione.
- `/unfocus` rimuove l’associazione per il thread attualmente associato.
- `/agents` elenca le esecuzioni attive e lo stato dell’associazione (`thread:<id>` o `unbound`).
- `/session idle` e `/session max-age` funzionano solo per thread associati e in focus.

Interruttori di configurazione:

- Predefinito globale: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Le chiavi di override per canale e di associazione automatica allo spawn sono specifiche dell’adattatore. Vedi **Canali che supportano i thread** sopra.

Vedi [Riferimento configurazione](/it/gateway/configuration-reference) e [Comandi slash](/it/tools/slash-commands) per i dettagli correnti dell’adattatore.

Allowlist:

- `agents.list[].subagents.allowAgents`: elenco di id agente che possono essere destinati tramite `agentId` (`["*"]` per consentire qualsiasi agente). Predefinito: solo l’agente richiedente.
- `agents.defaults.subagents.allowAgents`: allowlist di agenti di destinazione predefinita usata quando l’agente richiedente non imposta il proprio `subagents.allowAgents`.
- Protezione di ereditarietà della sandbox: se la sessione del richiedente è in sandbox, `sessions_spawn` rifiuta target che verrebbero eseguiti senza sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: quando è `true`, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Predefinito: false.

Rilevamento:

- Usa `agents_list` per vedere quali id agente sono attualmente consentiti per `sessions_spawn`.

Archiviazione automatica:

- Le sessioni dei sotto-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito: 60).
- L’archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l’annuncio (mantiene comunque la trascrizione tramite rinomina).
- L’archiviazione automatica è best effort; i timer in sospeso vengono persi se il Gateway si riavvia.
- `runTimeoutSeconds` **non** archivia automaticamente; interrompe solo l’esecuzione. La sessione resta finché non viene archiviata automaticamente.
- L’archiviazione automatica si applica allo stesso modo alle sessioni di profondità 1 e profondità 2.
- La pulizia del browser è separata dalla pulizia dell’archivio: schede/processi del browser tracciati vengono chiusi in modalità best effort quando l’esecuzione termina, anche se il record della sessione/trascrizione viene mantenuto.

## Sotto-agenti annidati

Per impostazione predefinita, i sotto-agenti non possono generare a loro volta altri sotto-agenti (`maxSpawnDepth: 1`). Puoi abilitare un livello di nidificazione impostando `maxSpawnDepth: 2`, che consente il **pattern da orchestratore**: principale → sotto-agente orchestratore → sotto-sotto-agenti worker.

### Come abilitarlo

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // consente ai sotto-agenti di generare figli (predefinito: 1)
        maxChildrenPerAgent: 5, // massimo numero di figli attivi per sessione agente (predefinito: 5)
        maxConcurrent: 8, // limite globale di concorrenza della lane (predefinito: 8)
        runTimeoutSeconds: 900, // timeout predefinito per sessions_spawn quando omesso (0 = nessun timeout)
      },
    },
  },
}
```

### Livelli di profondità

| Depth | Session key shape                            | Role                                          | Can spawn?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principale                             | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sotto-agente (orchestratore quando la profondità 2 è consentita) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sotto-agente (worker foglia)            | Mai                          |

### Catena di annuncio

I risultati risalgono lungo la catena:

1. Il worker di profondità 2 termina → annuncia al padre (orchestratore di profondità 1)
2. L’orchestratore di profondità 1 riceve l’annuncio, sintetizza i risultati, termina → annuncia al principale
3. L’agente principale riceve l’annuncio e consegna all’utente

Ogni livello vede solo gli annunci dei propri figli diretti.

Guida operativa:

- Avvia il lavoro figlio una sola volta e attendi gli eventi di completamento invece di costruire cicli di polling
  attorno a `sessions_list`, `sessions_history`, `/subagents list` o
  comandi `exec` sleep.
- Se un evento di completamento figlio arriva dopo che hai già inviato la risposta finale,
  il corretto follow-up è l’esatto token silenzioso `NO_REPLY` / `no_reply`.

### Policy dei tool per profondità

- Il ruolo e l’ambito di controllo vengono scritti nei metadati della sessione al momento dello spawn. Questo impedisce che chiavi di sessione appiattite o ripristinate riacquistino accidentalmente privilegi da orchestratore.
- **Profondità 1 (orchestratore, quando `maxSpawnDepth >= 2`)**: riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può gestire i propri figli. Gli altri tool di sessione/sistema restano negati.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`)**: nessun tool di sessione (comportamento predefinito attuale).
- **Profondità 2 (worker foglia)**: nessun tool di sessione — `sessions_spawn` è sempre negato alla profondità 2. Non può generare ulteriori figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo `maxChildrenPerAgent` (predefinito: 5) figli attivi contemporaneamente. Questo impedisce una proliferazione incontrollata a partire da un singolo orchestratore.

### Arresto a cascata

L’arresto di un orchestratore di profondità 1 arresta automaticamente tutti i suoi figli di profondità 2:

- `/stop` nella chat principale arresta tutti gli agenti di profondità 1 e si propaga ai rispettivi figli di profondità 2.
- `/subagents kill <id>` arresta uno specifico sotto-agente e si propaga ai suoi figli.
- `/subagents kill all` arresta tutti i sotto-agenti del richiedente e si propaga.

## Autenticazione

L’autenticazione del sotto-agente viene risolta in base all’**id agente**, non in base al tipo di sessione:

- La chiave di sessione del sotto-agente è `agent:<agentId>:subagent:<uuid>`.
- L’archivio di autenticazione viene caricato da `agentDir` di quell’agente.
- I profili di autenticazione dell’agente principale vengono uniti come **fallback**; in caso di conflitto, i profili dell’agente hanno priorità su quelli principali.

Nota: l’unione è additiva, quindi i profili principali sono sempre disponibili come fallback. L’autenticazione completamente isolata per agente non è ancora supportata.

## Annuncio

I sotto-agenti riportano i risultati tramite una fase di annuncio:

- La fase di annuncio viene eseguita all’interno della sessione del sotto-agente (non della sessione del richiedente).
- Se il sotto-agente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se il testo più recente dell’assistente è l’esatto token silenzioso `NO_REPLY` / `no_reply`,
  l’output dell’annuncio viene soppresso anche se in precedenza era visibile un avanzamento.
- Altrimenti la consegna dipende dalla profondità del richiedente:
  - le sessioni richiedenti di livello superiore usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`)
  - le sessioni richiedenti di sotto-agente annidate ricevono un’iniezione interna di follow-up (`deliver=false`) così l’orchestratore può sintetizzare i risultati dei figli all’interno della sessione
  - se una sessione richiedente di sotto-agente annidata non esiste più, OpenClaw torna al richiedente di quella sessione quando disponibile
- Per le sessioni richiedenti di livello superiore, la consegna diretta in modalità completamento risolve prima qualsiasi percorso di conversazione/thread associato e qualsiasi override di hook, poi completa i campi mancanti del target del canale dal percorso memorizzato della sessione richiedente. Questo mantiene i completamenti nella chat/argomento corretti anche quando l’origine del completamento identifica solo il canale.
- L’aggregazione dei completamenti dei figli è limitata all’esecuzione richiedente corrente quando costruisce i risultati di completamento annidati, impedendo che output di figli obsoleti di esecuzioni precedenti trapelino nell’annuncio corrente.
- Le risposte di annuncio preservano l’instradamento per thread/topic quando disponibile sugli adattatori di canale.
- Il contesto dell’annuncio viene normalizzato in un blocco di evento interno stabile:
  - origine (`subagent` o `cron`)
  - chiave/id della sessione figlia
  - tipo di annuncio + etichetta del task
  - riga di stato derivata dall’esito del runtime (`success`, `error`, `timeout` o `unknown`)
  - contenuto del risultato selezionato dal più recente testo visibile dell’assistente, altrimenti dal più recente testo sanitizzato di tool/toolResult; le esecuzioni terminali fallite riportano lo stato di errore senza riprodurre il testo della risposta acquisita
  - un’istruzione di follow-up che descrive quando rispondere e quando restare in silenzio
- `Status` non viene dedotto dall’output del modello; proviene dai segnali di esito del runtime.
- In caso di timeout, se il figlio è arrivato solo fino alle chiamate di tool, l’annuncio può comprimere quella cronologia in un breve riepilogo di avanzamento parziale invece di riprodurre l’output non elaborato dei tool.

I payload di annuncio includono una riga di statistiche alla fine (anche quando sono racchiusi):

- Runtime (ad es. `runtime 5m12s`)
- Utilizzo dei token (input/output/totale)
- Costo stimato quando è configurato il pricing del modello (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e percorso della trascrizione (così l’agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco)
- I metadati interni sono destinati solo all’orchestrazione; le risposte rivolte all’utente dovrebbero essere riscritte con una normale voce da assistente.

`sessions_history` è il percorso di orchestrazione più sicuro:

- il richiamo dell’assistente viene prima normalizzato:
  - i tag di thinking vengono rimossi
  - i blocchi scaffold `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi payload XML di chiamata tool in testo semplice come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi i payload
    troncati che non si chiudono mai correttamente
  - scaffold declassati di chiamata/risultato dei tool e marcatori di contesto storico vengono rimossi
  - i token di controllo del modello trapelati come `<|assistant|>`, altri token ASCII
    `<|...|>` e le varianti full-width `<｜...｜>` vengono rimossi
  - l’XML malformato di chiamata tool di MiniMax viene rimosso
- il testo simile a credenziali/token viene redatto
- i blocchi lunghi possono essere troncati
- le cronologie molto grandi possono eliminare le righe più vecchie o sostituire una riga sovradimensionata con
  `[sessions_history omitted: message too large]`
- l’ispezione non elaborata della trascrizione su disco è il fallback quando ti serve la trascrizione completa byte per byte

## Policy dei tool (tool dei sotto-agenti)

Per impostazione predefinita, i sotto-agenti ricevono **tutti i tool tranne i tool di sessione** e i tool di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` resta una vista di richiamo delimitata e sanitizzata; non è
un dump non elaborato della trascrizione.

Quando `maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondità 1 ricevono inoltre `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` così possono gestire i propri figli.

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

I sotto-agenti usano una lane di coda dedicata nel processo:

- Nome lane: `subagent`
- Concorrenza: `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Arresto

- L’invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta tutte le esecuzioni attive di sotto-agenti generate da essa, propagandosi ai figli annidati.
- `/subagents kill <id>` arresta uno specifico sotto-agente e si propaga ai suoi figli.

## Limitazioni

- L’annuncio del sotto-agente è in modalità **best effort**. Se il Gateway si riavvia, il lavoro pendente di "annuncio di ritorno" viene perso.
- I sotto-agenti condividono comunque le stesse risorse di processo del Gateway; considera `maxConcurrent` come una valvola di sicurezza.
- `sessions_spawn` non è mai bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto del sotto-agente inietta solo `AGENTS.md` + `TOOLS.md` (non `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di nidificazione è 5 (intervallo `maxSpawnDepth`: 1–5). La profondità 2 è consigliata per la maggior parte dei casi d’uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito: 5, intervallo: 1–20).
