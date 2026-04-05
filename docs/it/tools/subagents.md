---
read_when:
    - Vuoi eseguire lavoro in background/in parallelo tramite l'agente
    - Stai modificando `sessions_spawn` o la policy degli strumenti dei sotto-agenti
    - Stai implementando o risolvendo problemi di sessioni di sotto-agenti vincolate ai thread
summary: 'Sotto-agenti: avvio di esecuzioni isolate dell''agente che annunciano i risultati nella chat del richiedente'
title: Sotto-agenti
x-i18n:
    generated_at: "2026-04-05T14:08:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9df7cc35a3069ce4eb9c92a95df3ce5365a00a3fae92ff73def75461b58fec3f
    source_path: tools/subagents.md
    workflow: 15
---

# Sotto-agenti

I sotto-agenti sono esecuzioni in background dell'agente avviate da un'esecuzione esistente dell'agente. Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e, al termine, **annunciano** il proprio risultato nel canale chat del richiedente. Ogni esecuzione di sotto-agente viene tracciata come [attività in background](/it/automation/tasks).

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

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, id sessione, percorso della trascrizione, pulizia).
Usa `sessions_history` per una vista di richiamo limitata e filtrata per sicurezza; ispeziona il
percorso della trascrizione sul disco quando ti serve la trascrizione completa grezza.

### Comportamento di avvio

`/subagents spawn` avvia un sotto-agente in background come comando utente, non come inoltro interno, e invia un singolo aggiornamento finale di completamento nella chat del richiedente quando l'esecuzione termina.

- Il comando di avvio non è bloccante; restituisce immediatamente un id esecuzione.
- Al completamento, il sotto-agente annuncia un messaggio di riepilogo/risultato nel canale chat del richiedente.
- Il recapito del completamento è push-based. Una volta avviato, non interrogare in loop `/subagents list`,
  `sessions_list` o `sessions_history` solo per aspettare che finisca; controlla lo stato solo su richiesta per debug o interventi.
- Al completamento, OpenClaw chiude al meglio schede/processi browser tracciati aperti da quella sessione di sotto-agente prima che continui il flusso di pulizia dell'annuncio.
- Per gli avvii manuali, il recapito è resiliente:
  - OpenClaw prova prima il recapito diretto `agent` con una chiave di idempotenza stabile.
  - Se il recapito diretto fallisce, passa all'instradamento tramite coda.
  - Se anche l'instradamento tramite coda non è disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima dell'abbandono finale.
- Il recapito del completamento mantiene il percorso del richiedente risolto:
  - i percorsi di completamento vincolati al thread o alla conversazione hanno la precedenza quando disponibili
  - se l'origine del completamento fornisce solo un canale, OpenClaw completa il target/account mancante dal percorso risolto della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così il recapito diretto continua a funzionare
- Il passaggio del completamento alla sessione del richiedente è un contesto interno generato a runtime (non testo scritto dall'utente) e include:
  - `Result` (ultimo testo visibile di risposta `assistant`, altrimenti testo più recente sanificato di tool/toolResult)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistiche compatte di runtime/token
  - un'istruzione di recapito che dice all'agente richiedente di riscrivere in voce normale da assistente (senza inoltrare metadati interni grezzi)
- `--model` e `--thinking` sovrascrivono i predefiniti per quella specifica esecuzione.
- Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
- `/subagents spawn` è in modalità one-shot (`mode: "run"`). Per sessioni persistenti vincolate ai thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
- Per sessioni harness ACP (Codex, Claude Code, Gemini CLI), usa `sessions_spawn` con `runtime: "acp"` e vedi [Agenti ACP](/tools/acp-agents).

Obiettivi principali:

- Parallelizzare lavoro di tipo "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sotto-agenti isolati per impostazione predefinita (separazione delle sessioni + sandboxing opzionale).
- Rendere la superficie degli strumenti difficile da usare in modo improprio: i sotto-agenti **non** ricevono strumenti di sessione per impostazione predefinita.
- Supportare una profondità di annidamento configurabile per pattern di orchestrazione.

Nota sui costi: ogni sotto-agente ha un **proprio** contesto e un proprio utilizzo di token. Per attività pesanti o ripetitive,
imposta un modello più economico per i sotto-agenti e mantieni il tuo agente principale su un modello di qualità superiore.
Puoi configurarlo tramite `agents.defaults.subagents.model` o con sovrascritture per agente.

## Strumento

Usa `sessions_spawn`:

- Avvia un'esecuzione di sotto-agente (`deliver: false`, lane globale: `subagent`)
- Poi esegue una fase di annuncio e pubblica la risposta di annuncio nel canale chat del richiedente
- Modello predefinito: eredita dal chiamante a meno che tu non imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente); un valore esplicito di `sessions_spawn.model` ha comunque la precedenza.
- Thinking predefinito: eredita dal chiamante a meno che tu non imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente); un valore esplicito di `sessions_spawn.thinking` ha comunque la precedenza.
- Timeout predefinito dell'esecuzione: se `sessions_spawn.runTimeoutSeconds` è omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` se impostato; altrimenti usa `0` come fallback (nessun timeout).

Parametri dello strumento:

- `task` (obbligatorio)
- `label?` (facoltativo)
- `agentId?` (facoltativo; avvia sotto un altro id agente se consentito)
- `model?` (facoltativo; sovrascrive il modello del sotto-agente; i valori non validi vengono ignorati e il sotto-agente viene eseguito con il modello predefinito con un avviso nel risultato dello strumento)
- `thinking?` (facoltativo; sovrascrive il livello di thinking per l'esecuzione del sotto-agente)
- `runTimeoutSeconds?` (predefinito: `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`; quando impostato, l'esecuzione del sotto-agente viene interrotta dopo N secondi)
- `thread?` (predefinito `false`; quando `true`, richiede l'associazione al thread del canale per questa sessione di sotto-agente)
- `mode?` (`run|session`)
  - il valore predefinito è `run`
  - se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`
  - `mode: "session"` richiede `thread: true`
- `cleanup?` (`delete|keep`, predefinito `keep`)
- `sandbox?` (`inherit|require`, predefinito `inherit`; `require` rifiuta l'avvio a meno che il runtime figlio di destinazione non sia in sandbox)
- `sessions_spawn` **non** accetta parametri di recapito del canale (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Per il recapito, usa `message`/`sessions_send` dall'esecuzione avviata.

## Sessioni vincolate ai thread

Quando le associazioni ai thread sono abilitate per un canale, un sotto-agente può restare associato a un thread così i messaggi successivi dell'utente in quel thread continuano a essere instradati alla stessa sessione di sotto-agente.

### Canali che supportano i thread

- Discord (attualmente l'unico canale supportato): supporta sessioni persistenti di sotto-agenti vincolate ai thread (`sessions_spawn` con `thread: true`), controlli manuali del thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) e chiavi adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Flusso rapido:

1. Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"`).
2. OpenClaw crea o associa un thread a quella destinazione di sessione nel canale attivo.
3. Le risposte e i messaggi successivi in quel thread vengono instradati alla sessione associata.
4. Usa `/session idle` per ispezionare/aggiornare la rimozione automatica del focus per inattività e `/session max-age` per controllare il limite massimo rigido.
5. Usa `/unfocus` per scollegare manualmente.

Controlli manuali:

- `/focus <target>` associa il thread corrente (o ne crea uno) a una destinazione di sotto-agente/sessione.
- `/unfocus` rimuove l'associazione per il thread attualmente associato.
- `/agents` elenca le esecuzioni attive e lo stato dell'associazione (`thread:<id>` o `unbound`).
- `/session idle` e `/session max-age` funzionano solo per thread associati e con focus.

Interruttori di configurazione:

- Predefinito globale: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- La sovrascrittura per canale e le chiavi di associazione automatica all'avvio sono specifiche dell'adapter. Vedi **Canali che supportano i thread** sopra.

Vedi [Riferimento configurazione](/it/gateway/configuration-reference) e [Comandi slash](/tools/slash-commands) per i dettagli aggiornati dell'adapter.

Allowlist:

- `agents.list[].subagents.allowAgents`: elenco di id agente che possono essere scelti tramite `agentId` (`["*"]` per consentire tutti). Predefinito: solo l'agente richiedente.
- `agents.defaults.subagents.allowAgents`: allowlist predefinita degli agenti di destinazione usata quando l'agente richiedente non imposta `subagents.allowAgents`.
- Guardia di ereditarietà sandbox: se la sessione del richiedente è in sandbox, `sessions_spawn` rifiuta le destinazioni che verrebbero eseguite senza sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: quando true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Predefinito: false.

Rilevamento:

- Usa `agents_list` per vedere quali id agente sono attualmente consentiti per `sessions_spawn`.

Archiviazione automatica:

- Le sessioni dei sotto-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito: 60).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (la trascrizione viene comunque mantenuta tramite rinomina).
- L'archiviazione automatica è best-effort; i timer in sospeso vengono persi se il gateway si riavvia.
- `runTimeoutSeconds` **non** archivia automaticamente; interrompe solo l'esecuzione. La sessione resta finché non viene archiviata automaticamente.
- L'archiviazione automatica si applica allo stesso modo alle sessioni di profondità 1 e 2.
- La pulizia del browser è separata dalla pulizia dell'archivio: schede/processi browser tracciati vengono chiusi al meglio quando l'esecuzione termina, anche se il record della trascrizione/sessione viene mantenuto.

## Sotto-agenti annidati

Per impostazione predefinita, i sotto-agenti non possono avviare propri sotto-agenti (`maxSpawnDepth: 1`). Puoi abilitare un livello di annidamento impostando `maxSpawnDepth: 2`, che consente il **pattern orchestratore**: principale → sotto-agente orchestratore → sotto-sotto-agenti worker.

### Come abilitarlo

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // consenti ai sotto-agenti di avviare figli (predefinito: 1)
        maxChildrenPerAgent: 5, // massimo figli attivi per sessione agente (predefinito: 5)
        maxConcurrent: 8, // limite globale di concorrenza della lane (predefinito: 8)
        runTimeoutSeconds: 900, // timeout predefinito per sessions_spawn quando omesso (0 = nessun timeout)
      },
    },
  },
}
```

### Livelli di profondità

| Profondità | Forma della chiave di sessione               | Ruolo                                         | Può avviare?                 |
| ---------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0          | `agent:<id>:main`                            | Agente principale                             | Sempre                       |
| 1          | `agent:<id>:subagent:<uuid>`                 | Sotto-agente (orchestratore quando è consentita la profondità 2) | Solo se `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sotto-agente (worker foglia)            | Mai                          |

### Catena di annuncio

I risultati risalgono la catena:

1. Il worker di profondità 2 termina → annuncia al proprio genitore (orchestratore di profondità 1)
2. L'orchestratore di profondità 1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al principale
3. L'agente principale riceve l'annuncio e lo consegna all'utente

Ogni livello vede solo gli annunci dei propri figli diretti.

Indicazioni operative:

- Avvia il lavoro figlio una sola volta e attendi gli eventi di completamento invece di costruire loop di polling attorno a `sessions_list`, `sessions_history`, `/subagents list` o comandi `exec` con sleep.
- Se un evento di completamento figlio arriva dopo che hai già inviato la risposta finale, il follow-up corretto è l'esatto token silenzioso `NO_REPLY` / `no_reply`.

### Policy degli strumenti per profondità

- Ruolo e ambito di controllo vengono scritti nei metadati della sessione al momento dell'avvio. Questo impedisce che chiavi di sessione appiattite o ripristinate riottengano accidentalmente privilegi da orchestratore.
- **Profondità 1 (orchestratore, quando `maxSpawnDepth >= 2`)**: riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può gestire i propri figli. Gli altri strumenti di sessione/sistema restano negati.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`)**: nessuno strumento di sessione (comportamento predefinito attuale).
- **Profondità 2 (worker foglia)**: nessuno strumento di sessione — `sessions_spawn` è sempre negato alla profondità 2. Non può avviare ulteriori figli.

### Limite di avvio per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo `maxChildrenPerAgent` (predefinito: 5) figli attivi contemporaneamente. Questo impedisce fan-out incontrollato da un singolo orchestratore.

### Arresto a cascata

L'arresto di un orchestratore di profondità 1 arresta automaticamente tutti i suoi figli di profondità 2:

- `/stop` nella chat principale arresta tutti gli agenti di profondità 1 e si propaga ai loro figli di profondità 2.
- `/subagents kill <id>` arresta un sotto-agente specifico e si propaga ai suoi figli.
- `/subagents kill all` arresta tutti i sotto-agenti del richiedente e si propaga.

## Autenticazione

L'autenticazione del sotto-agente viene risolta in base all'**id agente**, non al tipo di sessione:

- La chiave di sessione del sotto-agente è `agent:<agentId>:subagent:<uuid>`.
- L'archivio di autenticazione viene caricato da `agentDir` di quell'agente.
- I profili di autenticazione dell'agente principale vengono uniti come **fallback**; i profili dell'agente hanno la precedenza sui profili principali in caso di conflitti.

Nota: l'unione è additiva, quindi i profili principali sono sempre disponibili come fallback. Un'autenticazione completamente isolata per agente non è ancora supportata.

## Annuncio

I sotto-agenti riportano indietro tramite una fase di annuncio:

- La fase di annuncio viene eseguita all'interno della sessione del sotto-agente (non della sessione del richiedente).
- Se il sotto-agente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se l'ultimo testo dell'assistente è il token silenzioso esatto `NO_REPLY` / `no_reply`,
  l'output dell'annuncio viene soppresso anche se prima era presente progresso visibile.
- Altrimenti il recapito dipende dalla profondità del richiedente:
  - le sessioni richiedenti di primo livello usano una chiamata di follow-up `agent` con recapito esterno (`deliver=true`)
  - le sessioni richiedenti di sotto-agenti annidati ricevono un'iniezione interna di follow-up (`deliver=false`) così l'orchestratore può sintetizzare i risultati figli nella sessione
  - se una sessione richiedente di sotto-agente annidato non esiste più, OpenClaw usa come fallback il richiedente di quella sessione quando disponibile
- Per le sessioni richiedenti di primo livello, il recapito diretto in modalità completamento risolve prima qualsiasi percorso associato a conversazione/thread e qualsiasi hook override, poi completa i campi mancanti del target canale dal percorso memorizzato della sessione del richiedente. Questo mantiene i completamenti sulla chat/topic corretti anche quando l'origine del completamento identifica solo il canale.
- L'aggregazione dei completamenti figli è limitata all'esecuzione corrente del richiedente quando costruisce risultati annidati di completamento, evitando che output figli obsoleti di esecuzioni precedenti finiscano nell'annuncio corrente.
- Le risposte di annuncio preservano l'instradamento thread/topic quando disponibile sugli adapter del canale.
- Il contesto dell'annuncio è normalizzato in un blocco evento interno stabile:
  - origine (`subagent` o `cron`)
  - chiave/id sessione figlio
  - tipo di annuncio + etichetta attività
  - riga di stato derivata dai segnali di esito del runtime (`success`, `error`, `timeout` o `unknown`)
  - contenuto del risultato selezionato dall'ultimo testo visibile dell'assistente, altrimenti dal testo più recente sanificato di tool/toolResult
  - un'istruzione di follow-up che descrive quando rispondere e quando restare silenziosi
- `Status` non viene dedotto dall'output del modello; proviene dai segnali di esito del runtime.
- In caso di timeout, se il figlio è arrivato solo alle chiamate di strumenti, l'annuncio può comprimere quello storico in un breve riepilogo di avanzamento parziale invece di riprodurre output grezzi degli strumenti.

I payload di annuncio includono una riga statistiche alla fine (anche quando sono racchiusi):

- Runtime (ad es., `runtime 5m12s`)
- Utilizzo dei token (input/output/totale)
- Costo stimato quando è configurato il pricing del modello (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e percorso della trascrizione (così l'agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file sul disco)
- I metadati interni sono pensati solo per l'orchestrazione; le risposte rivolte all'utente dovrebbero essere riscritte in normale voce da assistente.

`sessions_history` è il percorso di orchestrazione più sicuro:

- il richiamo dell'assistente viene prima normalizzato:
  - i tag di thinking vengono rimossi
  - i blocchi scaffold `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi payload XML in testo semplice di chiamata strumenti come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi i payload troncati
    che non si chiudono mai correttamente
  - scaffolding degradato di chiamata/risultato strumenti e marker di contesto storico vengono rimossi
  - token di controllo del modello trapelati come `<|assistant|>`, altri token ASCII
    `<|...|>` e varianti full-width `<｜...｜>` vengono rimossi
  - XML malformato di chiamata strumenti MiniMax viene rimosso
- il testo simile a credenziali/token viene oscurato
- i blocchi lunghi possono essere troncati
- cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga eccessiva con
  `[sessions_history omitted: message too large]`
- l'ispezione della trascrizione grezza sul disco è il fallback quando ti serve la trascrizione completa byte per byte

## Policy degli strumenti (strumenti dei sotto-agenti)

Per impostazione predefinita, i sotto-agenti ricevono **tutti gli strumenti tranne gli strumenti di sessione** e gli strumenti di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` resta una vista di richiamo limitata e sanificata; non è
un dump grezzo della trascrizione.

Quando `maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondità 1 ricevono in aggiunta `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` così possono gestire i propri figli.

Sovrascrivi tramite configurazione:

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
        // deny vince
        deny: ["gateway", "cron"],
        // se è impostato allow, diventa solo allow (deny continua a vincere)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concorrenza

I sotto-agenti usano una lane di coda dedicata in-process:

- Nome lane: `subagent`
- Concorrenza: `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Arresto

- L'invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta eventuali esecuzioni attive di sotto-agenti avviate da essa, con propagazione ai figli annidati.
- `/subagents kill <id>` arresta un sotto-agente specifico e si propaga ai suoi figli.

## Limitazioni

- L'annuncio dei sotto-agenti è **best-effort**. Se il gateway si riavvia, il lavoro in sospeso di "annuncio di ritorno" viene perso.
- I sotto-agenti condividono comunque le stesse risorse del processo gateway; considera `maxConcurrent` come una valvola di sicurezza.
- `sessions_spawn` non è mai bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto del sotto-agente inietta solo `AGENTS.md` + `TOOLS.md` (non `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di annidamento è 5 (intervallo `maxSpawnDepth`: 1–5). La profondità 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito: 5, intervallo: 1–20).
