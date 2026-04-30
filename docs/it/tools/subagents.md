---
read_when:
    - Vuoi eseguire lavoro in secondo piano o in parallelo tramite l'agente
    - Stai modificando i criteri dello strumento sessions_spawn o del sotto-agente
    - Stai implementando o risolvendo problemi relativi a sessioni di subagenti vincolate al thread
sidebarTitle: Sub-agents
summary: Avvia esecuzioni isolate di agenti in background che comunicano i risultati alla chat del richiedente
title: Sotto-agenti
x-i18n:
    generated_at: "2026-04-30T09:18:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

I sotto-agenti sono esecuzioni di agenti in background avviate da un'esecuzione di agente esistente.
Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
al termine, **annunciano** il risultato nel canale di chat del richiedente.
Ogni esecuzione di sotto-agente viene tracciata come
[attività in background](/it/automation/tasks).

Obiettivi principali:

- Parallelizzare il lavoro di "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sotto-agenti isolati per impostazione predefinita (separazione delle sessioni + sandboxing opzionale).
- Rendere difficile usare in modo errato la superficie degli strumenti: i sotto-agenti **non** ricevono strumenti di sessione per impostazione predefinita.
- Supportare una profondità di annidamento configurabile per i pattern di orchestrazione.

<Note>
**Nota sui costi:** ogni sotto-agente ha il proprio contesto e il proprio utilizzo di token per
impostazione predefinita. Per attività pesanti o ripetitive, imposta un modello più economico per i sotto-agenti
e mantieni il tuo agente principale su un modello di qualità superiore. Configura tramite
`agents.defaults.subagents.model` o override per agente. Quando un figlio
ha davvero bisogno della trascrizione corrente del richiedente, l'agente può richiedere
`context: "fork"` per quella singola creazione.
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

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, ID sessione,
percorso della trascrizione, pulizia). Usa `sessions_history` per una vista di richiamo limitata
e filtrata per sicurezza; ispeziona il percorso della trascrizione su disco quando
ti serve la trascrizione completa grezza.

### Controlli di associazione del thread

Questi comandi funzionano sui canali che supportano associazioni di thread persistenti.
Vedi [Canali che supportano i thread](#thread-supporting-channels) sotto.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento di creazione

`/subagents spawn` avvia un sotto-agente in background come comando utente (non come
relay interno) e invia un unico aggiornamento finale di completamento alla
chat del richiedente quando l'esecuzione termina.

<AccordionGroup>
  <Accordion title="Completamento non bloccante, basato su push">
    - Il comando di creazione non è bloccante; restituisce immediatamente un ID esecuzione.
    - Al completamento, il sotto-agente annuncia un messaggio di riepilogo/risultato al canale di chat del richiedente.
    - Il completamento è basato su push. Una volta creato, **non** eseguire polling di `/subagents list`, `sessions_list` o `sessions_history` in un ciclo solo per attendere che finisca; ispeziona lo stato solo su richiesta per debug o intervento.
    - Al completamento, OpenClaw chiude al meglio delle possibilità le schede/processi del browser tracciati aperti da quella sessione di sotto-agente prima che il flusso di pulizia dell'annuncio continui.

  </Accordion>
  <Accordion title="Resilienza della consegna con creazione manuale">
    - OpenClaw prova prima la consegna diretta `agent` con una chiave di idempotenza stabile.
    - Se la consegna diretta fallisce, passa al routing tramite coda.
    - Se il routing tramite coda non è ancora disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima dell'abbandono finale.
    - La consegna del completamento mantiene la route del richiedente risolta: le route di completamento associate al thread o alla conversazione prevalgono quando disponibili; se l'origine del completamento fornisce solo un canale, OpenClaw completa il target/account mancante dalla route risolta della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta continua a funzionare.

  </Accordion>
  <Accordion title="Metadati di passaggio del completamento">
    Il passaggio del completamento alla sessione del richiedente è contesto interno
    generato a runtime (non testo scritto dall'utente) e include:

    - `Result` — testo della risposta `assistant` visibile più recente, altrimenti il testo tool/toolResult più recente sanificato. Le esecuzioni terminali fallite non riutilizzano il testo della risposta catturata.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistiche runtime/token compatte.
    - Un'istruzione di consegna che dice all'agente richiedente di riscrivere con la normale voce dell'assistente (non inoltrare metadati interni grezzi).

  </Accordion>
  <Accordion title="Modalità e runtime ACP">
    - `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
    - Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
    - `/subagents spawn` è modalità una tantum (`mode: "run"`). Per sessioni persistenti associate a thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Per sessioni harness ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx esplicito), usa `sessions_spawn` con `runtime: "acp"` quando lo strumento dichiara quel runtime. Vedi [modello di consegna ACP](/it/tools/acp-agents#delivery-model) durante il debug di completamenti o cicli agente-agente. Quando il plugin `codex` è abilitato, il controllo di chat/thread Codex dovrebbe preferire `/codex ...` rispetto ad ACP, a meno che l'utente non chieda esplicitamente ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è in sandbox e un plugin backend come `acpx` è caricato. `runtime: "acp"` si aspetta un ID harness ACP esterno, oppure una voce `agents.list[]` con `runtime.type="acp"`; usa il runtime predefinito dei sotto-agenti per normali agenti di configurazione OpenClaw da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sotto-agenti nativi partono isolati a meno che il chiamante non chieda esplicitamente di diramare
la trascrizione corrente.

| Modalità   | Quando usarla                                                                                                                          | Comportamento                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `isolated` | Ricerca nuova, implementazione indipendente, lavoro con strumenti lenti o qualsiasi cosa che possa essere descritta nel testo dell'attività | Crea una trascrizione figlia pulita. Questa è l'impostazione predefinita e riduce l'uso di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, da risultati precedenti di strumenti o da istruzioni sfumate già presenti nella trascrizione del richiedente | Dirama la trascrizione del richiedente nella sessione figlia prima che il figlio parta. |

Usa `fork` con parsimonia. Serve per deleghe sensibili al contesto, non come
sostituto della scrittura di un prompt di attività chiaro.

## Strumento: `sessions_spawn`

Avvia un'esecuzione di sotto-agente con `deliver: false` sulla lane globale `subagent`,
poi esegue un passaggio di annuncio e pubblica la risposta di annuncio nel canale
di chat del richiedente.

La disponibilità dipende dalla policy strumenti effettiva del chiamante. I profili `coding` e
`full` espongono `sessions_spawn` per impostazione predefinita. Il profilo `messaging`
non lo fa; aggiungi `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` oppure usa `tools.profile: "coding"` per gli agenti che dovrebbero delegare
lavoro. Le policy di canale/gruppo, provider, sandbox e allow/deny per agente possono
comunque rimuovere lo strumento dopo la fase del profilo. Usa `/tools` dalla stessa
sessione per confermare l'elenco effettivo degli strumenti.

**Impostazioni predefinite:**

- **Modello:** eredita dal chiamante a meno che tu non imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente); un `sessions_spawn.model` esplicito prevale comunque.
- **Thinking:** eredita dal chiamante a meno che tu non imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente); un `sessions_spawn.thinking` esplicito prevale comunque.
- **Timeout di esecuzione:** se `sessions_spawn.runTimeoutSeconds` viene omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ripiega su `0` (nessun timeout).

### Parametri dello strumento

<ParamField path="task" type="string" required>
  La descrizione dell'attività per il sotto-agente.
</ParamField>
<ParamField path="label" type="string">
  Etichetta leggibile opzionale.
</ParamField>
<ParamField path="agentId" type="string">
  Crea sotto un altro ID agente quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` è solo per harness ACP esterni (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx richiesto esplicitamente) e per voci `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Riprende una sessione harness ACP esistente quando `runtime: "acp"`; ignorato per creazioni di sotto-agenti nativi.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Trasmette in streaming l'output dell'esecuzione ACP alla sessione padre quando `runtime: "acp"`; ometti per creazioni di sotto-agenti nativi.
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
  Quando `true`, richiede l'associazione del thread del canale per questa sessione di sotto-agente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia immediatamente dopo l'annuncio (conserva comunque la trascrizione tramite rinomina).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta la creazione a meno che il runtime figlio target non sia in sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` dirama la trascrizione corrente del richiedente nella sessione figlia. Solo sotto-agenti nativi. Usa `fork` solo quando il figlio ha bisogno della trascrizione corrente.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di consegna al canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna, usa
`message`/`sessions_send` dall'esecuzione creata.
</Warning>

## Sessioni associate a thread

Quando le associazioni di thread sono abilitate per un canale, un sotto-agente può restare associato
a un thread così che i messaggi utente successivi in quel thread continuino a essere instradati alla
stessa sessione di sotto-agente.

### Canali che supportano i thread

**Discord** è attualmente l'unico canale supportato. Supporta
sessioni di sotto-agente persistenti associate a thread (`sessions_spawn` con
`thread: true`), controlli manuali dei thread (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chiavi adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSubagentSessions`.

### Flusso rapido

<Steps>
  <Step title="Creazione">
    `sessions_spawn` con `thread: true` (e facoltativamente `mode: "session"`).
  </Step>
  <Step title="Associazione">
    OpenClaw crea o associa un thread a quel target di sessione nel canale attivo.
  </Step>
  <Step title="Instradamento dei follow-up">
    Le risposte e i messaggi successivi in quel thread vengono instradati alla sessione associata.
  </Step>
  <Step title="Ispezione dei timeout">
    Usa `/session idle` per ispezionare/aggiornare l'auto-unfocus per inattività e
    `/session max-age` per controllare il limite massimo rigido.
  </Step>
  <Step title="Distacco">
    Usa `/unfocus` per distaccare manualmente.
  </Step>
</Steps>

### Controlli manuali

| Comando            | Effetto                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Associa il thread corrente (o creane uno) a un target di sotto-agente/sessione |
| `/unfocus`         | Rimuove l'associazione per il thread attualmente associato                       |
| `/agents`          | Elenca le esecuzioni attive e lo stato dell'associazione (`thread:<id>` o `unbound`)       |
| `/session idle`    | Ispeziona/aggiorna la rimozione automatica del focus per inattivita (solo thread associati con focus)         |
| `/session max-age` | Ispeziona/aggiorna il limite massimo rigido (solo thread associati con focus)                  |

### Opzioni di configurazione

- **Predefinito globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override del canale e chiavi di auto-associazione allo spawn** sono specifiche dell'adapter. Vedi [Canali che supportano i thread](#thread-supporting-channels) sopra.

Vedi [Riferimento di configurazione](/it/gateway/configuration-reference) e
[Comandi slash](/it/tools/slash-commands) per i dettagli correnti degli adapter.

### Lista consentita

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco degli ID agente che possono essere scelti come target tramite `agentId` esplicito (`["*"]` consente qualsiasi target). Predefinito: solo l'agente richiedente. Se imposti un elenco e vuoi comunque che il richiedente possa generare se stesso con `agentId`, includi l'ID del richiedente nell'elenco.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista consentita predefinita degli agenti target usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Override per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Se la sessione richiedente e in sandbox, `sessions_spawn` rifiuta i target
che verrebbero eseguiti senza sandbox.

### Rilevamento

Usa `agents_list` per vedere quali ID agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo di ogni agente
elencato e i metadati di runtime incorporati, cosi i chiamanti possono distinguere PI, il server app di Codex
e altri runtime nativi configurati.

### Archiviazione automatica

- Le sessioni dei sotto-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito `60`).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia subito dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
- L'archiviazione automatica e best-effort; i timer in sospeso vengono persi se il Gateway si riavvia.
- `runTimeoutSeconds` **non** archivia automaticamente; ferma solo l'esecuzione. La sessione rimane fino all'archiviazione automatica.
- L'archiviazione automatica si applica allo stesso modo alle sessioni di profondita 1 e profondita 2.
- La pulizia del browser e separata dalla pulizia dell'archivio: le schede/i processi del browser tracciati vengono chiusi in modalita best-effort al termine dell'esecuzione, anche se il record della trascrizione/sessione viene mantenuto.

## Sotto-agenti annidati

Per impostazione predefinita, i sotto-agenti non possono generare i propri sotto-agenti
(`maxSpawnDepth: 1`). Imposta `maxSpawnDepth: 2` per abilitare un livello di
annidamento — il **pattern orchestratore**: principale → sotto-agente orchestratore →
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
      },
    },
  },
}
```

### Livelli di profondita

| Profondita | Forma della chiave di sessione                 | Ruolo                                         | Puo generare?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principale                             | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sotto-agente (orchestratore quando la profondita 2 e consentita) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sotto-agente (worker foglia)            | Mai                          |

### Catena di annunci

I risultati risalgono lungo la catena:

1. Il worker di profondita 2 termina → annuncia al suo genitore (orchestratore di profondita 1).
2. L'orchestratore di profondita 1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al principale.
3. L'agente principale riceve l'annuncio e lo consegna all'utente.

Ogni livello vede solo gli annunci dei propri figli diretti.

<Note>
**Indicazioni operative:** avvia il lavoro dei figli una volta e attendi gli
eventi di completamento invece di costruire loop di polling intorno a `sessions_list`,
`sessions_history`, `/subagents list` o comandi di sleep `exec`.
`sessions_list` e `/subagents list` mantengono le relazioni delle sessioni figlie
focalizzate sul lavoro live — i figli live rimangono collegati, i figli terminati restano
visibili per una breve finestra recente e i collegamenti solo nello store ormai obsoleti
vengono ignorati dopo la loro finestra di freschezza. Questo impedisce ai vecchi metadati `spawnedBy` /
`parentSessionKey` di resuscitare figli fantasma dopo
il riavvio. Se un evento di completamento di un figlio arriva dopo che hai gia inviato la
risposta finale, il follow-up corretto e l'esatto token silenzioso
`NO_REPLY` / `no_reply`.
</Note>

### Criterio degli strumenti per profondita

- Ruolo e ambito di controllo vengono scritti nei metadati della sessione al momento dello spawn. Questo impedisce a chiavi di sessione piatte o ripristinate di riottenere accidentalmente privilegi da orchestratore.
- **Profondita 1 (orchestratore, quando `maxSpawnDepth >= 2`):** riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` cosi puo gestire i propri figli. Gli altri strumenti di sessione/sistema rimangono negati.
- **Profondita 1 (foglia, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito corrente).
- **Profondita 2 (worker foglia):** nessuno strumento di sessione — `sessions_spawn` e sempre negato a profondita 2. Non puo generare ulteriori figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondita) puo avere al massimo `maxChildrenPerAgent`
(predefinito `5`) figli attivi alla volta. Questo impedisce fan-out incontrollati
da un singolo orchestratore.

### Arresto a cascata

L'arresto di un orchestratore di profondita 1 arresta automaticamente tutti i suoi figli di profondita 2:

- `/stop` nella chat principale arresta tutti gli agenti di profondita 1 e propaga l'arresto ai loro figli di profondita 2.
- `/subagents kill <id>` arresta un sotto-agente specifico e propaga l'arresto ai suoi figli.
- `/subagents kill all` arresta tutti i sotto-agenti del richiedente e propaga l'arresto.

## Autenticazione

L'autenticazione dei sotto-agenti viene risolta in base all'**ID agente**, non al tipo di sessione:

- La chiave di sessione del sotto-agente e `agent:<agentId>:subagent:<uuid>`.
- Lo store di autenticazione viene caricato dall'`agentDir` di quell'agente.
- I profili di autenticazione dell'agente principale vengono uniti come **fallback**; i profili agente sovrascrivono i profili principali in caso di conflitto.

L'unione e additiva, quindi i profili principali sono sempre disponibili come
fallback. L'autenticazione completamente isolata per agente non e ancora supportata.

## Annuncio

I sotto-agenti inviano un resoconto tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito all'interno della sessione del sotto-agente (non nella sessione richiedente).
- Se il sotto-agente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se il testo piu recente dell'assistente e l'esatto token silenzioso `NO_REPLY` / `no_reply`, l'output dell'annuncio viene soppresso anche se in precedenza erano esistiti progressi visibili.

La consegna dipende dalla profondita del richiedente:

- Le sessioni richiedenti di primo livello usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`).
- Le sessioni dei sotto-agenti richiedenti annidati ricevono un'iniezione interna di follow-up (`deliver=false`) cosi l'orchestratore puo sintetizzare i risultati dei figli nella sessione.
- Se una sessione di sotto-agente richiedente annidata non esiste piu, OpenClaw ripiega sul richiedente di quella sessione quando disponibile.

Per le sessioni richiedenti di primo livello, la consegna diretta in modalita completamento
risolve prima qualsiasi route di conversazione/thread associata e override hook, poi compila
i campi mancanti del target di canale dalla route archiviata della sessione richiedente.
Questo mantiene i completamenti nella chat/nel topic corretti anche quando l'origine del completamento
identifica solo il canale.

L'aggregazione dei completamenti dei figli e limitata all'esecuzione corrente del richiedente quando
crea i risultati di completamento annidati, impedendo agli output dei figli di esecuzioni precedenti obsolete
di trapelare nell'annuncio corrente. Le risposte di annuncio preservano
l'instradamento thread/topic quando disponibile negli adapter di canale.

### Contesto dell'annuncio

Il contesto dell'annuncio viene normalizzato in un blocco evento interno stabile:

| Campo          | Origine                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origine        | `subagent` o `cron`                                                                                          |
| ID sessione    | Chiave/ID della sessione figlia                                                                                          |
| Tipo           | Tipo di annuncio + etichetta dell'attivita                                                                                    |
| Stato          | Derivato dall'esito del runtime (`success`, `error`, `timeout` o `unknown`) — **non** dedotto dal testo del modello |
| Contenuto del risultato | Testo visibile piu recente dell'assistente, altrimenti testo dello strumento/toolResult piu recente sanificato                                |
| Follow-up      | Istruzione che descrive quando rispondere rispetto a rimanere in silenzio                                                           |

Le esecuzioni terminali non riuscite riportano lo stato di errore senza riprodurre il
testo della risposta catturato. In caso di timeout, se il figlio e arrivato solo fino alle chiamate agli strumenti, l'annuncio
puo comprimere quella cronologia in un breve riepilogo di avanzamento parziale invece
di riprodurre l'output grezzo degli strumenti.

### Riga delle statistiche

I payload di annuncio includono una riga di statistiche alla fine (anche quando mandati a capo):

- Runtime (ad esempio `runtime 5m12s`).
- Utilizzo dei token (input/output/totale).
- Costo stimato quando i prezzi dei modelli sono configurati (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e percorso della trascrizione, cosi l'agente principale puo recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco.

I metadati interni sono destinati solo all'orchestrazione; le risposte rivolte all'utente
devono essere riscritte con la normale voce dell'assistente.

### Perche preferire `sessions_history`

`sessions_history` e il percorso di orchestrazione piu sicuro:

- Il richiamo dell'assistente viene normalizzato prima: tag di pensiero rimossi; scaffolding `<relevant-memories>` / `<relevant_memories>` rimosso; blocchi payload XML di chiamata strumento in testo semplice (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) rimossi, inclusi payload troncati che non si chiudono mai correttamente; scaffolding degradato di chiamata/risultato strumento e marcatori di contesto storico rimossi; token di controllo del modello trapelati (`<|assistant|>`, altri `<|...|>` ASCII, `<｜...｜>` a larghezza piena) rimossi; XML di chiamata strumento MiniMax malformato rimosso.
- Il testo simile a credenziali/token viene redatto.
- I blocchi lunghi possono essere troncati.
- Le cronologie molto grandi possono scartare righe piu vecchie o sostituire una riga sovradimensionata con `[sessions_history omitted: message too large]`.
- L'ispezione della trascrizione grezza su disco e il fallback quando serve la trascrizione completa byte per byte.

## Criterio degli strumenti

I sotto-agenti usano prima lo stesso profilo e la stessa pipeline dei criteri degli strumenti del genitore o
dell'agente target. Dopo questo, OpenClaw applica il livello di restrizione
dei sotto-agenti.

Senza un `tools.profile` restrittivo, i sotto-agenti ricevono **tutti gli strumenti eccetto
gli strumenti di sessione** e gli strumenti di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` rimane una vista di richiamo limitata e sanificata —
non e un dump grezzo della trascrizione.

Quando `maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondita 1 ricevono inoltre
`sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history` cosi possono gestire i propri figli.

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

`tools.subagents.tools.allow` è un filtro finale solo di tipo allow. Può restringere
l'insieme di strumenti già risolto, ma non può **riaggiungere** uno strumento rimosso
da `tools.profile`. Per esempio, `tools.profile: "coding"` include
`web_search`/`web_fetch` ma non lo strumento `browser`. Per consentire
ai sub-agent con profilo coding di usare l'automazione browser, aggiungi browser nella
fase del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` per agente quando solo un
agente deve ottenere l'automazione browser.

## Concorrenza

I sub-agent usano una corsia di coda dedicata in-process:

- **Nome corsia:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Vitalità e ripristino

OpenClaw non considera l'assenza di `endedAt` una prova permanente che un
sub-agent sia ancora attivo. Le esecuzioni non terminate più vecchie della finestra
per esecuzioni obsolete smettono di essere conteggiate come attive/in sospeso in `/subagents list`, nei riepiloghi di stato,
nel gating del completamento dei discendenti e nei controlli di concorrenza per sessione.

Dopo un riavvio del Gateway, le esecuzioni ripristinate obsolete e non terminate vengono eliminate, a meno che
la loro sessione figlia non sia contrassegnata con `abortedLastRun: true`. Quelle
sessioni figlie interrotte dal riavvio restano recuperabili tramite il flusso di recupero degli orfani
dei sub-agent, che invia un messaggio di ripresa sintetico prima di
cancellare il marcatore di interruzione.

<Note>
Se la creazione di un sub-agent non riesce con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controlla il chiamante RPC prima di modificare lo stato di pairing.
Il coordinamento interno `sessions_spawn` deve connettersi come
`client.id: "gateway-client"` con `client.mode: "backend"` tramite autenticazione diretta
loopback con token condiviso/password; quel percorso non dipende dal
baseline dell'ambito dispositivo associato della CLI. I chiamanti remoti, i
`deviceIdentity` espliciti, i percorsi espliciti con token dispositivo e i client browser/node
richiedono comunque la normale approvazione del dispositivo per gli upgrade di ambito.
</Note>

## Arresto

- L'invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta qualsiasi esecuzione attiva di sub-agent avviata da essa, propagandosi ai figli annidati.
- `/subagents kill <id>` arresta un sub-agent specifico e si propaga ai suoi figli.

## Limitazioni

- L'annuncio dei sub-agent è **best-effort**. Se il gateway si riavvia, il lavoro "announce back" in sospeso viene perso.
- I sub-agent condividono comunque le stesse risorse del processo gateway; considera `maxConcurrent` una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto dei sub-agent inserisce solo `AGENTS.md` + `TOOLS.md` (nessun `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di annidamento è 5 (intervallo `maxSpawnDepth`: 1–5). La profondità 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito `5`, intervallo `1–20`).

## Correlati

- [Agenti ACP](/it/tools/acp-agents)
- [Invio agente](/it/tools/agent-send)
- [Attività in background](/it/automation/tasks)
- [Strumenti sandbox multi-agent](/it/tools/multi-agent-sandbox-tools)
