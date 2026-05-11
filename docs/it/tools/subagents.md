---
read_when:
    - Vuoi lavoro in background o in parallelo tramite l'agente
    - Stai modificando sessions_spawn o i criteri dello strumento per i sottoagenti
    - Stai implementando o risolvendo problemi relativi a sessioni di subagenti vincolate alla discussione
sidebarTitle: Sub-agents
summary: Avvia esecuzioni isolate di agenti in secondo piano che comunicano i risultati alla chat del richiedente
title: Sottoagenti
x-i18n:
    generated_at: "2026-05-11T20:39:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

I sub-agent sono esecuzioni di agent in background generate da un'esecuzione di agent esistente.
Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
al termine, **annunciano** il risultato al canale chat del richiedente.
Ogni esecuzione di sub-agent viene tracciata come
[attività in background](/it/automation/tasks).

Obiettivi principali:

- Parallelizzare il lavoro di "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sub-agent isolati per impostazione predefinita (separazione della sessione + sandboxing opzionale).
- Mantenere la superficie degli strumenti difficile da usare in modo improprio: i sub-agent **non** ricevono gli strumenti di sessione per impostazione predefinita.
- Supportare una profondità di annidamento configurabile per i pattern di orchestrator.

<Note>
**Nota sui costi:** ogni sub-agent ha il proprio contesto e utilizzo di token per
impostazione predefinita. Per attività pesanti o ripetitive, imposta un modello meno costoso per i sub-agent
e mantieni il tuo agent principale su un modello di qualità superiore. Configura tramite
`agents.defaults.subagents.model` o override per agent. Quando un figlio
    ha davvero bisogno della trascrizione corrente del richiedente, l'agent può richiedere
    `context: "fork"` su quella singola generazione. Le sessioni di subagent vincolate al thread usano per impostazione predefinita
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

Usa [`/steer <message>`](/it/tools/steer) di primo livello per guidare l'esecuzione attiva della sessione richiedente corrente. Usa `/subagents steer <id|#> <message>` quando il target è un'esecuzione figlia.

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, ID sessione,
percorso della trascrizione, pulizia). Usa `sessions_history` per una vista di richiamo limitata
e filtrata per sicurezza; ispeziona il percorso della trascrizione su disco quando
ti serve la trascrizione completa grezza.

### Controlli di vincolo al thread

Questi comandi funzionano sui canali che supportano vincoli persistenti ai thread.
Consulta [Canali con supporto thread](#thread-supporting-channels) di seguito.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento di generazione

`/subagents spawn` avvia un sub-agent in background come comando utente (non un
relay interno) e invia un aggiornamento finale di completamento alla
chat richiedente quando l'esecuzione termina.

<AccordionGroup>
  <Accordion title="Completamento non bloccante e basato su push">
    - Il comando di generazione non è bloccante; restituisce immediatamente un ID esecuzione.
    - Al completamento, il sub-agent annuncia un messaggio di riepilogo/risultato al canale chat del richiedente.
    - I turni dell'agent che necessitano dei risultati dei figli dovrebbero chiamare `sessions_yield` dopo aver generato il lavoro richiesto. Questo termina il turno corrente e consente agli eventi di completamento di arrivare come prossimo messaggio visibile al modello.
    - Il completamento è basato su push. Una volta generato, **non** eseguire polling di `/subagents list`, `sessions_list` o `sessions_history` in loop solo per aspettare che finisca; ispeziona lo stato solo su richiesta per debug o intervento.
    - L'output del figlio è un report/evidenza che l'agent richiedente deve sintetizzare. Non è testo di istruzioni scritto dall'utente e non può sovrascrivere policy di sistema, developer o utente.
    - Al completamento, OpenClaw chiude con il massimo impegno le schede/processi del browser tracciati aperti da quella sessione di sub-agent prima che il flusso di pulizia dell'annuncio continui.

  </Accordion>
  <Accordion title="Resilienza della consegna con generazione manuale">
    - OpenClaw restituisce i completamenti alla sessione richiedente tramite un turno `agent` con una chiave di idempotenza stabile.
    - Se l'esecuzione richiedente è ancora attiva, OpenClaw prova prima a riattivare/guidare quell'esecuzione invece di avviare un secondo percorso di risposta visibile.
    - Se il passaggio di completamento all'agent richiedente fallisce o non produce output visibile, OpenClaw tratta la consegna come fallita e ripiega su instradamento/riprova tramite coda. Non invia grezzamente il risultato del figlio direttamente alla chat esterna.
    - Se non è possibile usare il passaggio diretto, ripiega sull'instradamento tramite coda.
    - Se l'instradamento tramite coda non è ancora disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima della rinuncia finale.
    - La consegna del completamento mantiene la route richiedente risolta: le route di completamento vincolate al thread o alla conversazione prevalgono quando disponibili; se l'origine del completamento fornisce solo un canale, OpenClaw completa il target/account mancante dalla route risolta della sessione richiedente (`lastChannel` / `lastTo` / `lastAccountId`) in modo che la consegna diretta funzioni comunque.

  </Accordion>
  <Accordion title="Metadati del passaggio di completamento">
    Il passaggio di completamento alla sessione richiedente è contesto interno
    generato dal runtime (non testo scritto dall'utente) e include:

    - `Result` — ultimo testo visibile della risposta `assistant`, altrimenti ultimo testo tool/toolResult sanificato. Le esecuzioni terminali fallite non riutilizzano il testo di risposta catturato.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistiche compatte di runtime/token.
    - Un'istruzione di consegna che dice all'agent richiedente di riscrivere con normale voce da assistant (non inoltrare metadati interni grezzi).

  </Accordion>
  <Accordion title="Modalità e runtime ACP">
    - `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
    - Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
    - `/subagents spawn` è una modalità one-shot (`mode: "run"`). Per sessioni persistenti vincolate al thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Per sessioni di harness ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx esplicito), usa `sessions_spawn` con `runtime: "acp"` quando lo strumento dichiara quel runtime. Consulta [modello di consegna ACP](/it/tools/acp-agents#delivery-model) durante il debug di completamenti o loop agent-to-agent. Quando il plugin `codex` è abilitato, il controllo chat/thread di Codex dovrebbe preferire `/codex ...` rispetto ad ACP, a meno che l'utente non chieda esplicitamente ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è in sandbox e un Plugin di backend come `acpx` è caricato. `runtime: "acp"` si aspetta un ID di harness ACP esterno, oppure una voce `agents.list[]` con `runtime.type="acp"`; usa il runtime sub-agent predefinito per i normali agent di configurazione OpenClaw da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sub-agent nativi partono isolati, a meno che il chiamante non chieda esplicitamente di forcare
la trascrizione corrente.

| Modalità   | Quando usarla                                                                                                                          | Comportamento                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Ricerca nuova, implementazione indipendente, lavoro con strumenti lenti o qualsiasi cosa che possa essere spiegata nel testo dell'attività | Crea una trascrizione figlia pulita. È l'impostazione predefinita e mantiene più basso l'utilizzo dei token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, da risultati precedenti degli strumenti o da istruzioni sfumate già presenti nella trascrizione del richiedente | Dirama la trascrizione del richiedente nella sessione figlia prima che il figlio parta. |

Usa `fork` con parsimonia. Serve per deleghe sensibili al contesto, non come
sostituto della scrittura di un prompt di attività chiaro.

## Strumento: `sessions_spawn`

Avvia un'esecuzione di sub-agent con `deliver: false` sulla lane globale `subagent`,
poi esegue un passaggio di annuncio e pubblica la risposta di annuncio nel canale
chat del richiedente.

La disponibilità dipende dalla policy effettiva degli strumenti del chiamante. I profili `coding` e
`full` espongono `sessions_spawn` per impostazione predefinita. Il profilo `messaging`
no; aggiungi `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` oppure usa `tools.profile: "coding"` per gli agent che dovrebbero delegare
lavoro. Le policy di canale/gruppo, provider, sandbox e allow/deny per agent possono
comunque rimuovere lo strumento dopo la fase del profilo. Usa `/tools` dalla stessa
sessione per confermare l'elenco effettivo degli strumenti.

**Valori predefiniti:**

- **Modello:** eredita dal chiamante a meno che tu non imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agent); un `sessions_spawn.model` esplicito prevale comunque.
- **Ragionamento:** eredita dal chiamante a meno che tu non imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agent); un `sessions_spawn.thinking` esplicito prevale comunque.
- **Timeout di esecuzione:** se `sessions_spawn.runTimeoutSeconds` viene omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ripiega su `0` (nessun timeout).

### Modalità prompt di delega

`agents.defaults.subagents.delegationMode` controlla solo la guida del prompt; non modifica la policy degli strumenti né impone la delega.

- `suggest` (predefinito): mantiene il normale suggerimento del prompt a usare i sub-agent per lavori più grandi o più lenti.
- `prefer`: dice all'agent principale di restare reattivo e delegare tramite `sessions_spawn` qualsiasi cosa più articolata di una risposta diretta.

Gli override per agent usano `agents.list[].subagents.delegationMode`.

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
  Handle stabile facoltativo per il targeting successivo con `subagents`. Deve corrispondere a `[a-z][a-z0-9_]{0,63}` e non può essere un target riservato come `last` o `all`. Preferiscilo quando il coordinatore potrebbe dover indirizzare, terminare o identificare un figlio specifico dopo aver generato più figli.
</ParamField>
<ParamField path="label" type="string">
  Etichetta facoltativa leggibile da un essere umano.
</ParamField>
<ParamField path="agentId" type="string">
  Genera sotto un altro ID agente quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` è solo per harness ACP esterni (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx richiesto esplicitamente) e per le voci `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Riprende una sessione harness ACP esistente quando `runtime: "acp"`; ignorato per le generazioni di sotto-agenti nativi.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Trasmette l'output dell'esecuzione ACP alla sessione padre quando `runtime: "acp"`; ometti per le generazioni di sotto-agenti nativi.
</ParamField>
<ParamField path="model" type="string">
  Sovrascrive il modello del sotto-agente. I valori non validi vengono ignorati e il sotto-agente viene eseguito sul modello predefinito con un avviso nel risultato dello strumento.
</ParamField>
<ParamField path="thinking" type="string">
  Sovrascrive il livello di ragionamento per l'esecuzione del sotto-agente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Usa il valore predefinito di `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`. Quando impostato, l'esecuzione del sotto-agente viene interrotta dopo N secondi.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, richiede l'associazione al thread del canale per questa sessione del sotto-agente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta la generazione a meno che il runtime figlio di destinazione non sia in sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica la trascrizione corrente del richiedente nella sessione figlia. Solo sotto-agenti nativi. Le generazioni associate a thread usano `fork` per impostazione predefinita; le generazioni non associate a thread usano `isolated` per impostazione predefinita.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di recapito del canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Per il recapito, usa
`message`/`sessions_send` dall'esecuzione generata.
</Warning>

### Nomi delle attività e targeting

`taskName` è un handle rivolto al modello per l'orchestrazione, non una chiave di sessione.
Usalo per nomi figlio stabili come `review_subagents`,
`linux_validation` o `docs_update` quando un coordinatore potrebbe dover indirizzare
o terminare quel figlio in seguito.

La risoluzione del target accetta corrispondenze esatte di `taskName` e prefissi
non ambigui. La corrispondenza è limitata alla stessa finestra di target attivi/recenti usata
dai target numerati di `/subagents`, quindi un figlio completato obsoleto non rende
ambiguo un handle riutilizzato. Se due figli attivi o recenti condividono lo stesso
`taskName`, il target è ambiguo; usa invece l'indice dell'elenco, la chiave di sessione o
l'ID esecuzione.

I target riservati `last` e `all` non sono valori `taskName` validi
perché hanno già significati di controllo.

## Strumento: `sessions_yield`

Termina il turno corrente del modello e attende che gli eventi del runtime,
principalmente gli eventi di completamento dei sotto-agenti, arrivino come messaggio successivo. Usalo dopo
aver generato lavoro figlio richiesto quando il richiedente non può produrre una risposta
finale finché tali completamenti non arrivano.

`sessions_yield` è la primitiva di attesa. Non sostituirla con cicli di polling
su `subagents`, `sessions_list`, `sessions_history`, `sleep` della shell
o polling di processo solo per rilevare il completamento dei figli.

Usa `sessions_yield` solo quando l'elenco effettivo degli strumenti della sessione lo include.
Alcuni profili di strumenti minimi o personalizzati possono esporre `sessions_spawn` e
`subagents` senza esporre `sessions_yield`; in tal caso, non inventare
un ciclo di polling solo per attendere il completamento.

Quando esistono figli attivi, OpenClaw inserisce un blocco prompt compatto generato dal runtime
`Active Subagents` nei turni normali, così il richiedente può vedere
le sessioni figlie correnti, gli ID esecuzione, gli stati, le etichette, le attività e
gli alias `taskName` senza polling. I campi attività ed etichetta in quel
blocco sono citati come dati, non come istruzioni, perché possono provenire
da argomenti di generazione forniti dall'utente/modello.

## Strumento: `subagents`

Elenca, indirizza o termina le esecuzioni di sotto-agenti generate possedute dalla sessione
richiedente. È limitato al richiedente corrente; un figlio può solo
vedere/controllare i propri figli controllati.

Usa `subagents` per stato su richiesta, debug, indirizzamento o terminazione.
Usa `sessions_yield` per attendere gli eventi di completamento.

## Sessioni associate a thread

Quando le associazioni ai thread sono abilitate per un canale, un sotto-agente può rimanere associato
a un thread affinché i messaggi utente successivi in quel thread continuino a essere instradati alla
stessa sessione del sotto-agente.

### Canali con supporto thread

**Discord** è attualmente l'unico canale supportato. Supporta
sessioni subagent persistenti associate a thread (`sessions_spawn` con
`thread: true`), controlli manuali dei thread (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chiavi adattatore
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSessions`.

### Flusso rapido

<Steps>
  <Step title="Genera">
    `sessions_spawn` con `thread: true` (e facoltativamente `mode: "session"`).
  </Step>
  <Step title="Associa">
    OpenClaw crea o associa un thread a quel target di sessione nel canale attivo.
  </Step>
  <Step title="Instrada i follow-up">
    Le risposte e i messaggi successivi in quel thread vengono instradati alla sessione associata.
  </Step>
  <Step title="Ispeziona i timeout">
    Usa `/session idle` per ispezionare/aggiornare l'auto-unfocus per inattività e
    `/session max-age` per controllare il limite massimo rigido.
  </Step>
  <Step title="Scollega">
    Usa `/unfocus` per scollegare manualmente.
  </Step>
</Steps>

### Controlli manuali

| Comando            | Effetto                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Associa il thread corrente (o ne crea uno) a un target sotto-agente/sessione |
| `/unfocus`         | Rimuove l'associazione per il thread associato corrente               |
| `/agents`          | Elenca le esecuzioni attive e lo stato dell'associazione (`thread:<id>` o `unbound`) |
| `/session idle`    | Ispeziona/aggiorna l'auto-unfocus per inattività (solo thread associati focalizzati) |
| `/session max-age` | Ispeziona/aggiorna il limite massimo rigido (solo thread associati focalizzati) |

### Interruttori di configurazione

- **Predefinito globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Le chiavi di override del canale e auto-associazione alla generazione** sono specifiche dell'adattatore. Vedi [Canali con supporto thread](#thread-supporting-channels) sopra.

Vedi [Riferimento di configurazione](/it/gateway/configuration-reference) e
[Comandi slash](/it/tools/slash-commands) per i dettagli correnti dell'adattatore.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco di ID agente che possono essere scelti come target tramite `agentId` esplicito (`["*"]` consente qualsiasi). Predefinito: solo l'agente richiedente. Se imposti un elenco e vuoi comunque che il richiedente generi se stesso con `agentId`, includi l'ID del richiedente nell'elenco.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist predefinita degli agenti target usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Override per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout per chiamata per i tentativi di recapito dell'annuncio `agent` del gateway. I valori sono millisecondi interi positivi e sono limitati al massimo del timer sicuro per la piattaforma. I retry transitori possono rendere l'attesa totale dell'annuncio più lunga di un singolo timeout configurato.
</ParamField>

Se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta i target
che verrebbero eseguiti senza sandbox.

### Scoperta

Usa `agents_list` per vedere quali ID agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo di ciascun agente elencato
e i metadati di runtime incorporati, così i chiamanti possono distinguere PI, server app Codex
e altri runtime nativi configurati.

### Archiviazione automatica

- Le sessioni dei sotto-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito `60`).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
- L'archiviazione automatica è best-effort; i timer in sospeso vengono persi se il gateway si riavvia.
- `runTimeoutSeconds` **non** archivia automaticamente; interrompe solo l'esecuzione. La sessione resta fino all'archiviazione automatica.
- L'archiviazione automatica si applica ugualmente alle sessioni di profondità 1 e profondità 2.
- La pulizia del browser è separata dalla pulizia dell'archivio: le schede/processi del browser tracciati vengono chiusi best-effort al termine dell'esecuzione, anche se la trascrizione/il record di sessione viene mantenuto.

## Sotto-agenti annidati

Per impostazione predefinita, i sotto-agenti non possono generare i propri sotto-agenti
(`maxSpawnDepth: 1`). Imposta `maxSpawnDepth: 2` per abilitare un livello di
annidamento — il **pattern orchestrator**: principale → sotto-agente orchestrator →
sotto-sotto-agenti worker.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Livelli di profondità

| Profondità | Forma della chiave di sessione                  | Ruolo                                         | Può generare?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principale                             | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sotto-agente (orchestrator quando la profondità 2 è consentita) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sotto-agente (worker foglia)            | Mai                          |

### Catena di annunci

I risultati risalgono lungo la catena:

1. Il worker di profondità 2 termina → annuncia al suo genitore (orchestrator di profondità 1).
2. L'orchestrator di profondità 1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al principale.
3. L'agente principale riceve l'annuncio e lo recapita all'utente.

Ogni livello vede solo gli annunci dei propri figli diretti.

<Note>
**Indicazioni operative:** avvia il lavoro figlio una sola volta e attendi gli
eventi di completamento invece di costruire cicli di polling intorno a
`sessions_list`, `sessions_history`, `/subagents list` o comandi di sleep
`exec`. `sessions_list` e `/subagents list` mantengono le relazioni tra
sessioni figlie concentrate sul lavoro attivo: i figli attivi restano
collegati, i figli terminati rimangono visibili per una breve finestra recente
e i collegamenti a figli obsoleti presenti solo nello store vengono ignorati
dopo la loro finestra di freschezza. Questo impedisce ai vecchi metadati
`spawnedBy` / `parentSessionKey` di far riapparire figli fantasma dopo un
riavvio. Se un evento di completamento figlio arriva dopo che hai già inviato
la risposta finale, il follow-up corretto è l'esatto token silenzioso
`NO_REPLY` / `no_reply`.
</Note>

### Criterio degli strumenti per profondità

- Il ruolo e l'ambito di controllo vengono scritti nei metadati della sessione al momento dello spawn. Questo impedisce a chiavi di sessione piatte o ripristinate di recuperare accidentalmente privilegi di orchestratore.
- **Profondità 1 (orchestratore, quando `maxSpawnDepth >= 2`):** riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può gestire i propri figli. Gli altri strumenti di sessione/sistema restano negati.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito attuale).
- **Profondità 2 (worker foglia):** nessuno strumento di sessione: `sessions_spawn` è sempre negato alla profondità 2. Non può generare ulteriori figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo
`maxChildrenPerAgent` (predefinito `5`) figli attivi alla volta. Questo
impedisce una proliferazione incontrollata da un singolo orchestratore.

### Arresto a cascata

L'arresto di un orchestratore di profondità 1 arresta automaticamente tutti i
suoi figli di profondità 2:

- `/stop` nella chat principale arresta tutti gli agenti di profondità 1 e si propaga ai loro figli di profondità 2.
- `/subagents kill <id>` arresta uno specifico sotto-agente e si propaga ai suoi figli.
- `/subagents kill all` arresta tutti i sotto-agenti del richiedente e si propaga.

## Autenticazione

L'autenticazione del sotto-agente viene risolta per **id agente**, non per tipo
di sessione:

- La chiave di sessione del sotto-agente è `agent:<agentId>:subagent:<uuid>`.
- Lo store di autenticazione viene caricato dall'`agentDir` di quell'agente.
- I profili di autenticazione dell'agente principale vengono uniti come **fallback**; i profili agente sovrascrivono i profili principali in caso di conflitti.

L'unione è additiva, quindi i profili principali sono sempre disponibili come
fallback. L'autenticazione completamente isolata per agente non è ancora
supportata.

## Annuncio

I sotto-agenti rispondono tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito dentro la sessione del sotto-agente (non nella sessione del richiedente).
- Se il sotto-agente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se l'ultimo testo dell'assistente è l'esatto token silenzioso `NO_REPLY` / `no_reply`, l'output di annuncio viene soppresso anche se prima esisteva un avanzamento visibile.

La consegna dipende dalla profondità del richiedente:

- Le sessioni richiedenti di livello superiore usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`).
- Le sessioni sotto-agente richiedenti annidate ricevono un'iniezione di follow-up interna (`deliver=false`) così l'orchestratore può sintetizzare i risultati figli nella sessione.
- Se una sessione sotto-agente richiedente annidata è scomparsa, OpenClaw ripiega sul richiedente di quella sessione quando disponibile.

Per le sessioni richiedenti di livello superiore, la consegna diretta in
modalità completamento risolve prima qualunque route di conversazione/thread
associata e override di hook, poi riempie i campi canale-destinazione mancanti
dalla route memorizzata della sessione richiedente. Questo mantiene i
completamenti nella chat/argomento corretti anche quando l'origine del
completamento identifica solo il canale.

L'aggregazione dei completamenti figli è limitata all'esecuzione corrente del
richiedente quando crea i risultati di completamento annidati, impedendo agli
output figli obsoleti di esecuzioni precedenti di filtrare nell'annuncio
corrente. Le risposte di annuncio preservano il routing di thread/argomento
quando disponibile sugli adattatori di canale.

### Contesto dell'annuncio

Il contesto dell'annuncio viene normalizzato in un blocco evento interno stabile:

| Campo          | Origine                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origine        | `subagent` o `cron`                                                                                          |
| ID sessione    | Chiave/id della sessione figlia                                                                                |
| Tipo           | Tipo di annuncio + etichetta dell'attività                                                                     |
| Stato          | Derivato dall'esito runtime (`success`, `error`, `timeout` o `unknown`) — **non** inferito dal testo del modello |
| Contenuto risultato | Ultimo testo visibile dell'assistente, altrimenti ultimo testo tool/toolResult sanificato                 |
| Follow-up      | Istruzione che descrive quando rispondere o restare in silenzio                                                |

Le esecuzioni terminali fallite segnalano lo stato di errore senza riprodurre
il testo di risposta acquisito. In caso di timeout, se il figlio è arrivato
solo fino alle chiamate agli strumenti, l'annuncio può comprimere quella
cronologia in un breve riepilogo di avanzamento parziale invece di riprodurre
l'output grezzo degli strumenti.

### Riga delle statistiche

I payload di annuncio includono una riga delle statistiche alla fine (anche
quando sono racchiusi):

- Runtime (ad es. `runtime 5m12s`).
- Utilizzo dei token (input/output/totale).
- Costo stimato quando il pricing del modello è configurato (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e percorso del transcript così l'agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco.

I metadati interni sono destinati solo all'orchestrazione; le risposte rivolte
all'utente dovrebbero essere riscritte con la normale voce dell'assistente.

### Perché preferire `sessions_history`

`sessions_history` è il percorso di orchestrazione più sicuro:

- Il richiamo dell'assistente viene prima normalizzato: tag di pensiero rimossi; impalcatura `<relevant-memories>` / `<relevant_memories>` rimossa; blocchi di payload XML di chiamate strumento in testo semplice (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) rimossi, inclusi payload troncati che non si chiudono correttamente; impalcatura di chiamate/risultati strumento declassata e marcatori di contesto storico rimossi; token di controllo del modello trapelati (`<|assistant|>`, altri ASCII `<|...|>`, full-width `<｜...｜>`) rimossi; XML di chiamate strumento MiniMax malformato rimosso.
- Il testo simile a credenziali/token viene oscurato.
- I blocchi lunghi possono essere troncati.
- Cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga troppo grande con `[sessions_history omitted: message too large]`.
- L'ispezione del transcript grezzo su disco è il fallback quando serve il transcript completo byte per byte.

## Criterio degli strumenti

I sotto-agenti usano prima la stessa pipeline di profilo e criterio degli
strumenti del genitore o dell'agente target. Dopo questo, OpenClaw applica il
livello di restrizione per sotto-agente.

Senza un `tools.profile` restrittivo, i sotto-agenti ricevono **tutti gli
strumenti eccetto gli strumenti di sessione** e gli strumenti di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` resta una vista di richiamo limitata e
sanificata: non è un dump grezzo del transcript.

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

`tools.subagents.tools.allow` è un filtro finale solo-allow. Può restringere
l'insieme di strumenti già risolto, ma non può **riaggiungere** uno strumento
rimosso da `tools.profile`. Per esempio, `tools.profile: "coding"` include
`web_search`/`web_fetch` ma non lo strumento `browser`. Per consentire ai
sotto-agenti con profilo coding di usare l'automazione del browser, aggiungi
browser nella fase di profilo:

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

I sotto-agenti usano una corsia di coda dedicata nello stesso processo:

- **Nome corsia:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Vitalità e ripristino

OpenClaw non tratta l'assenza di `endedAt` come prova permanente che un
sotto-agente sia ancora attivo. Le esecuzioni non concluse più vecchie della
finestra di esecuzione obsoleta smettono di contare come attive/in attesa in
`/subagents list`, nei riepiloghi di stato, nel gating dei completamenti
discendenti e nei controlli di concorrenza per sessione.

Dopo un riavvio del Gateway, le esecuzioni ripristinate obsolete e non concluse
vengono eliminate, a meno che la loro sessione figlia sia contrassegnata
`abortedLastRun: true`. Queste sessioni figlie interrotte dal riavvio restano
recuperabili tramite il flusso di recupero degli orfani del sotto-agente, che
invia un messaggio sintetico di ripresa prima di cancellare il marcatore di
interruzione.

Il recupero automatico dopo riavvio è limitato per sessione figlia. Se lo
stesso figlio sotto-agente viene accettato ripetutamente per il recupero degli
orfani dentro la finestra rapida di re-wedge, OpenClaw persiste una tombstone
di recupero su quella sessione e smette di riprenderla automaticamente ai
riavvii successivi. Esegui `openclaw tasks maintenance --apply` per
riconciliare il record dell'attività, oppure `openclaw doctor --fix` per
cancellare flag di recupero interrotto obsoleti sulle sessioni con tombstone.

<Note>
Se lo spawn di un sotto-agente fallisce con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controlla il chiamante RPC prima di modificare lo stato di
pairing. Il coordinamento interno `sessions_spawn` dovrebbe connettersi come
`client.id: "gateway-client"` con `client.mode: "backend"` tramite
autenticazione diretta local loopback con token/password condivisi; quel
percorso non dipende dalla baseline di ambito dispositivo associato della CLI.
Chiamanti remoti, `deviceIdentity` esplicito, percorsi con token dispositivo
espliciti e client browser/node richiedono comunque la normale approvazione del
dispositivo per gli upgrade di ambito.
</Note>

## Arresto

- L'invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta tutte le esecuzioni sotto-agente attive generate da essa, propagandosi ai figli annidati.
- `/subagents kill <id>` arresta uno specifico sotto-agente e si propaga ai suoi figli.

## Limitazioni

- L'annuncio dei sotto-agenti è **best-effort**. Se il Gateway si riavvia, il lavoro "annuncia indietro" in sospeso viene perso.
- I sotto-agenti condividono comunque le stesse risorse del processo Gateway; considera `maxConcurrent` una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce `{ status: "accepted", runId, childSessionKey }` immediatamente.
- Il contesto del sotto-agente inietta solo `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` e `USER.md` (nessun `MEMORY.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di annidamento è 5 (intervallo `maxSpawnDepth`: 1–5). La profondità 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito `5`, intervallo `1–20`).

## Correlati

- [Agenti ACP](/it/tools/acp-agents)
- [Invio agente](/it/tools/agent-send)
- [Attività in background](/it/automation/tasks)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
