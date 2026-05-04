---
read_when:
    - Vuoi eseguire lavoro in background o in parallelo tramite l'agente
    - Stai modificando sessions_spawn o i criteri dello strumento per sottoagenti
    - Stai implementando o risolvendo problemi relativi alle sessioni di sottoagenti vincolate al thread
sidebarTitle: Sub-agents
summary: Avvia esecuzioni isolate di agenti in secondo piano che comunicano i risultati nella chat del richiedente
title: Sottoagenti
x-i18n:
    generated_at: "2026-05-04T07:09:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65d60bf6813d667b7311aa28109d4bd6be012a16e638c64cfff130831db88cd8
    source_path: tools/subagents.md
    workflow: 16
---

I sub-agent sono esecuzioni di agenti in background generate da un'esecuzione di agente esistente.
Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
al termine, **annunciano** il proprio risultato al canale chat del
richiedente. Ogni esecuzione di sub-agent viene tracciata come
[attività in background](/it/automation/tasks).

Obiettivi principali:

- Parallelizzare il lavoro di "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sub-agent isolati per impostazione predefinita (separazione della sessione + sandbox opzionale).
- Mantenere difficile l'uso improprio della superficie degli strumenti: i sub-agent **non** ricevono gli strumenti di sessione per impostazione predefinita.
- Supportare una profondità di annidamento configurabile per i pattern di orchestrazione.

<Note>
**Nota sui costi:** ogni sub-agent ha il proprio contesto e il proprio uso di token per
impostazione predefinita. Per attività pesanti o ripetitive, imposta un modello più economico per i sub-agent
e mantieni il tuo agente principale su un modello di qualità superiore. Configura tramite
`agents.defaults.subagents.model` o override per agente. Quando un figlio
    ha davvero bisogno della trascrizione corrente del richiedente, l'agente può richiedere
    `context: "fork"` su quella singola generazione. Le sessioni di subagent associate a thread usano per impostazione predefinita
    `context: "fork"` perché diramano la conversazione corrente in un
    thread di follow-up.
</Note>

## Comando slash

Usa `/subagents` per ispezionare o controllare le esecuzioni dei sub-agent per la **sessione
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

Usa [`/steer <message>`](/it/tools/steer) di livello superiore per guidare l'esecuzione attiva della sessione del richiedente corrente. Usa `/subagents steer <id|#> <message>` quando la destinazione è un'esecuzione figlia.

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, id sessione,
percorso della trascrizione, pulizia). Usa `sessions_history` per una vista di richiamo limitata
e filtrata per sicurezza; ispeziona il percorso della trascrizione su disco quando
ti serve la trascrizione completa grezza.

### Controlli di associazione ai thread

Questi comandi funzionano sui canali che supportano associazioni persistenti ai thread.
Vedi [Canali che supportano i thread](#thread-supporting-channels) sotto.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento di generazione

`/subagents spawn` avvia un sub-agent in background come comando utente (non come
relay interno) e invia un ultimo aggiornamento di completamento alla chat del
richiedente quando l'esecuzione termina.

<AccordionGroup>
  <Accordion title="Completamento non bloccante, basato su push">
    - Il comando di generazione non è bloccante; restituisce immediatamente un id esecuzione.
    - Al completamento, il sub-agent annuncia un messaggio di riepilogo/risultato al canale chat del richiedente.
    - Il completamento è basato su push. Una volta generato, **non** interrogare `/subagents list`, `sessions_list` o `sessions_history` in un ciclo solo per attendere che finisca; ispeziona lo stato solo su richiesta per debug o intervento.
    - Al completamento, OpenClaw chiude al meglio le schede/processi del browser tracciati aperti da quella sessione di sub-agent prima che il flusso di pulizia dell'annuncio continui.

  </Accordion>
  <Accordion title="Resilienza della consegna per generazione manuale">
    - OpenClaw prova prima la consegna diretta `agent` con una chiave di idempotenza stabile.
    - Se il turno di completamento dell'agente richiedente fallisce, non produce output visibile o restituisce un prefisso chiaramente incompleto del risultato figlio acquisito, OpenClaw ripiega sulla consegna diretta del completamento dal risultato figlio acquisito.
    - Se non è possibile usare la consegna diretta, ripiega sull'instradamento tramite coda.
    - Se l'instradamento tramite coda non è ancora disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima della rinuncia finale.
    - La consegna del completamento mantiene la route del richiedente risolta: le route di completamento associate a thread o conversazione prevalgono quando disponibili; se l'origine del completamento fornisce solo un canale, OpenClaw completa la destinazione/account mancante dalla route risolta della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta continua a funzionare.

  </Accordion>
  <Accordion title="Metadati di passaggio del completamento">
    Il passaggio del completamento alla sessione del richiedente è contesto interno
    generato a runtime (non testo scritto dall'utente) e include:

    - `Result` — il testo più recente visibile della risposta `assistant`, altrimenti il testo più recente sanitizzato di strumento/toolResult. Le esecuzioni terminali fallite non riutilizzano il testo della risposta acquisita.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistiche compatte di runtime/token.
    - Un'istruzione di consegna che indica all'agente richiedente di riscrivere con la normale voce dell'assistente (non inoltrare metadati interni grezzi).

  </Accordion>
  <Accordion title="Modalità e runtime ACP">
    - `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
    - Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
    - `/subagents spawn` è modalità one-shot (`mode: "run"`). Per sessioni persistenti associate a thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Per sessioni harness ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx esplicito), usa `sessions_spawn` con `runtime: "acp"` quando lo strumento dichiara quel runtime. Vedi [modello di consegna ACP](/it/tools/acp-agents#delivery-model) durante il debug di completamenti o loop agente-agente. Quando il plugin `codex` è abilitato, il controllo di chat/thread Codex dovrebbe preferire `/codex ...` rispetto ad ACP salvo richiesta esplicita dell'utente per ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è in sandbox e un plugin backend come `acpx` è caricato. `runtime: "acp"` si aspetta un id harness ACP esterno, oppure una voce `agents.list[]` con `runtime.type="acp"`; usa il runtime sub-agent predefinito per gli agenti di configurazione OpenClaw normali da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sub-agent nativi partono isolati salvo che il chiamante chieda esplicitamente di biforcare
la trascrizione corrente.

| Modalità   | Quando usarla                                                                                                                          | Comportamento                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Ricerca nuova, implementazione indipendente, lavoro con strumenti lenti o qualunque cosa possa essere spiegata nel testo dell'attività | Crea una trascrizione figlia pulita. È l'impostazione predefinita e riduce l'uso di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, da risultati precedenti degli strumenti o da istruzioni sfumate già presenti nella trascrizione del richiedente | Dirama la trascrizione del richiedente nella sessione figlia prima che il figlio parta. |

Usa `fork` con parsimonia. Serve per deleghe sensibili al contesto, non come
sostituto della scrittura di un prompt di attività chiaro.

## Strumento: `sessions_spawn`

Avvia un'esecuzione di sub-agent con `deliver: false` sulla lane globale `subagent`,
poi esegue un passaggio di annuncio e pubblica la risposta di annuncio nel canale
chat del richiedente.

La disponibilità dipende dalla policy degli strumenti effettiva del chiamante. I profili `coding` e
`full` espongono `sessions_spawn` per impostazione predefinita. Il profilo `messaging`
non lo fa; aggiungi `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` o usa `tools.profile: "coding"` per gli agenti che devono delegare
lavoro. Le policy di canale/gruppo, provider, sandbox e allow/deny per agente possono
ancora rimuovere lo strumento dopo la fase del profilo. Usa `/tools` dalla stessa
sessione per confermare l'elenco effettivo degli strumenti.

**Valori predefiniti:**

- **Modello:** eredita il chiamante salvo che tu imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente); un `sessions_spawn.model` esplicito prevale comunque.
- **Thinking:** eredita il chiamante salvo che tu imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente); un `sessions_spawn.thinking` esplicito prevale comunque.
- **Timeout esecuzione:** se `sessions_spawn.runTimeoutSeconds` viene omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ripiega su `0` (nessun timeout).

### Parametri dello strumento

<ParamField path="task" type="string" required>
  La descrizione dell'attività per il sub-agent.
</ParamField>
<ParamField path="label" type="string">
  Etichetta facoltativa leggibile da una persona.
</ParamField>
<ParamField path="agentId" type="string">
  Genera sotto un altro id agente quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` è solo per harness ACP esterni (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx richiesto esplicitamente) e per voci `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Riprende una sessione harness ACP esistente quando `runtime: "acp"`; ignorato per le generazioni di sub-agent native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Trasmette in streaming l'output dell'esecuzione ACP alla sessione padre quando `runtime: "acp"`; ometti per le generazioni di sub-agent native.
</ParamField>
<ParamField path="model" type="string">
  Sovrascrive il modello del sub-agent. I valori non validi vengono saltati e il sub-agent viene eseguito sul modello predefinito con un avviso nel risultato dello strumento.
</ParamField>
<ParamField path="thinking" type="string">
  Sovrascrive il livello di thinking per l'esecuzione del sub-agent.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Usa per impostazione predefinita `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`. Quando impostato, l'esecuzione del sub-agent viene interrotta dopo N secondi.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, richiede l'associazione al thread del canale per questa sessione di sub-agent.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta la generazione salvo che il runtime figlio di destinazione sia in sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` dirama la trascrizione corrente del richiedente nella sessione figlia. Solo sub-agent nativi. Le generazioni associate a thread usano per impostazione predefinita `fork`; le generazioni non associate a thread usano per impostazione predefinita `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di consegna del canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna, usa
`message`/`sessions_send` dall'esecuzione generata.
</Warning>

## Sessioni associate a thread

Quando le associazioni ai thread sono abilitate per un canale, un sub-agent può rimanere associato
a un thread così i messaggi utente di follow-up in quel thread continuano a essere instradati alla
stessa sessione di sub-agent.

### Canali che supportano i thread

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
    OpenClaw crea o associa un thread a quella destinazione di sessione nel canale attivo.
  </Step>
  <Step title="Instrada i follow-up">
    Le risposte e i messaggi di follow-up in quel thread vengono instradati alla sessione associata.
  </Step>
  <Step title="Ispeziona i timeout">
    Usa `/session idle` per ispezionare/aggiornare la rimozione automatica del focus per inattività e
    `/session max-age` per controllare il limite massimo rigido.
  </Step>
  <Step title="Scollega">
    Usa `/unfocus` per scollegare manualmente.
  </Step>
</Steps>

### Controlli manuali

| Comando            | Effetto                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Associa il thread corrente (o ne crea uno) a una destinazione di sub-agente/sessione |
| `/unfocus`         | Rimuove l'associazione per il thread attualmente associato                       |
| `/agents`          | Elenca le esecuzioni attive e lo stato di associazione (`thread:<id>` o `unbound`)       |
| `/session idle`    | Ispeziona/aggiorna la rimozione automatica del focus per inattività (solo thread associati con focus)         |
| `/session max-age` | Ispeziona/aggiorna il limite massimo rigido (solo thread associati con focus)                  |

### Interruttori di configurazione

- **Predefinito globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override del canale e chiavi di associazione automatica alla generazione** sono specifici dell'adattatore. Vedi [Canali con supporto ai thread](#thread-supporting-channels) sopra.

Vedi [Riferimento di configurazione](/it/gateway/configuration-reference) e
[Comandi slash](/it/tools/slash-commands) per i dettagli correnti degli adattatori.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco di ID agente che possono essere scelti come destinazione tramite `agentId` esplicito (`["*"]` consente qualunque valore). Predefinito: solo l'agente richiedente. Se imposti un elenco e vuoi comunque che il richiedente generi se stesso con `agentId`, includi l'ID del richiedente nell'elenco.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist predefinita degli agenti di destinazione usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Override per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta le destinazioni
che verrebbero eseguite senza sandbox.

### Individuazione

Usa `agents_list` per vedere quali ID agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo di ciascun agente
elencato e i metadati del runtime incorporato, così i chiamanti possono distinguere PI, Codex
app-server e altri runtime nativi configurati.

### Archiviazione automatica

- Le sessioni dei sub-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito `60`).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
- L'archiviazione automatica è best-effort; i timer in sospeso vengono persi se il Gateway si riavvia.
- `runTimeoutSeconds` **non** archivia automaticamente; ferma solo l'esecuzione. La sessione resta fino all'archiviazione automatica.
- L'archiviazione automatica si applica allo stesso modo alle sessioni di profondità 1 e profondità 2.
- La pulizia del browser è separata dalla pulizia dell'archivio: le schede/processi del browser tracciati vengono chiusi in modalità best-effort al termine dell'esecuzione, anche se il record di trascrizione/sessione viene mantenuto.

## Sub-agenti annidati

Per impostazione predefinita, i sub-agenti non possono generare i propri sub-agenti
(`maxSpawnDepth: 1`). Imposta `maxSpawnDepth: 2` per abilitare un livello di
annidamento — il **modello orchestratore**: principale → sub-agente orchestratore →
sub-sub-agenti worker.

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

### Livelli di profondità

| Profondità | Forma della chiave di sessione              | Ruolo                                         | Può generare?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principale                             | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agente (orchestratore quando la profondità 2 è consentita) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agente (worker foglia)                | Mai                          |

### Catena di annuncio

I risultati risalgono la catena:

1. Il worker di profondità 2 termina → annuncia al proprio genitore (orchestratore di profondità 1).
2. L'orchestratore di profondità 1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al principale.
3. L'agente principale riceve l'annuncio e lo consegna all'utente.

Ogni livello vede solo gli annunci dei propri figli diretti.

<Note>
**Linee guida operative:** avvia il lavoro figlio una sola volta e attendi gli eventi
di completamento invece di creare cicli di polling intorno a `sessions_list`,
`sessions_history`, `/subagents list` o comandi `exec` sleep.
`sessions_list` e `/subagents list` mantengono le relazioni delle sessioni figlie
concentrate sul lavoro attivo — i figli attivi restano collegati, i figli terminati rimangono
visibili per una breve finestra recente e i collegamenti figli presenti solo nello store e obsoleti vengono
ignorati dopo la loro finestra di freschezza. Questo impedisce ai vecchi metadati `spawnedBy` /
`parentSessionKey` di far riapparire figli fantasma dopo
il riavvio. Se un evento di completamento figlio arriva dopo che hai già inviato la
risposta finale, il follow-up corretto è l'esatto token silenzioso
`NO_REPLY` / `no_reply`.
</Note>

### Criterio degli strumenti per profondità

- Il ruolo e l'ambito di controllo vengono scritti nei metadati della sessione al momento della generazione. Questo impedisce a chiavi di sessione piatte o ripristinate di riottenere accidentalmente privilegi da orchestratore.
- **Profondità 1 (orchestratore, quando `maxSpawnDepth >= 2`):** ottiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` per poter gestire i propri figli. Gli altri strumenti di sessione/sistema restano negati.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito corrente).
- **Profondità 2 (worker foglia):** nessuno strumento di sessione — `sessions_spawn` è sempre negato alla profondità 2. Non può generare altri figli.

### Limite di generazione per agente

Ogni sessione agente (a qualunque profondità) può avere al massimo `maxChildrenPerAgent`
(predefinito `5`) figli attivi contemporaneamente. Questo evita fan-out incontrollati
da un singolo orchestratore.

### Arresto a cascata

L'arresto di un orchestratore di profondità 1 arresta automaticamente tutti i suoi figli di profondità 2:

- `/stop` nella chat principale arresta tutti gli agenti di profondità 1 e propaga l'arresto ai loro figli di profondità 2.
- `/subagents kill <id>` arresta un sub-agente specifico e propaga l'arresto ai suoi figli.
- `/subagents kill all` arresta tutti i sub-agenti del richiedente e propaga l'arresto.

## Autenticazione

L'autenticazione dei sub-agenti viene risolta per **ID agente**, non per tipo di sessione:

- La chiave della sessione del sub-agente è `agent:<agentId>:subagent:<uuid>`.
- Lo store di autenticazione viene caricato dall'`agentDir` di quell'agente.
- I profili di autenticazione dell'agente principale vengono uniti come **fallback**; i profili dell'agente hanno la precedenza sui profili principali in caso di conflitti.

L'unione è additiva, quindi i profili principali sono sempre disponibili come
fallback. L'autenticazione completamente isolata per agente non è ancora supportata.

## Annuncio

I sub-agenti riportano i risultati tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito all'interno della sessione del sub-agente (non della sessione richiedente).
- Se il sub-agente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se l'ultimo testo dell'assistente è l'esatto token silenzioso `NO_REPLY` / `no_reply`, l'output di annuncio viene soppresso anche se in precedenza era presente avanzamento visibile.

La consegna dipende dalla profondità del richiedente:

- Le sessioni richiedenti di primo livello usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`).
- Le sessioni subagent richiedenti annidate ricevono un'iniezione interna di follow-up (`deliver=false`) così l'orchestratore può sintetizzare i risultati dei figli nella sessione.
- Se una sessione subagent richiedente annidata non esiste più, OpenClaw ripiega sul richiedente di quella sessione quando disponibile.

Per le sessioni richiedenti di primo livello, la consegna diretta in modalità completamento
risolve prima qualunque percorso conversazione/thread associato e override dell'hook, poi riempie
i campi di destinazione canale mancanti dal percorso memorizzato della sessione richiedente.
Questo mantiene i completamenti nella chat/nel topic corretto anche quando l'origine del completamento
identifica solo il canale.

L'aggregazione dei completamenti dei figli è limitata all'esecuzione richiedente corrente quando
crea i risultati di completamento annidati, impedendo agli output dei figli di esecuzioni precedenti obsolete
di filtrare nell'annuncio corrente. Le risposte di annuncio preservano
l'instradamento thread/topic quando disponibile sugli adattatori di canale.

### Contesto di annuncio

Il contesto di annuncio viene normalizzato in un blocco evento interno stabile:

| Campo          | Origine                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origine        | `subagent` o `cron`                                                                                          |
| ID sessione    | Chiave/ID della sessione figlia                                                                                          |
| Tipo           | Tipo di annuncio + etichetta del task                                                                                    |
| Stato          | Derivato dall'esito del runtime (`success`, `error`, `timeout` o `unknown`) — **non** inferito dal testo del modello |
| Contenuto del risultato | Ultimo testo visibile dell'assistente, altrimenti ultimo testo strumento/toolResult sanificato                                |
| Follow-up      | Istruzione che descrive quando rispondere o restare silenziosi                                                           |

Le esecuzioni terminali non riuscite riportano lo stato di errore senza riprodurre
il testo di risposta acquisito. In caso di timeout, se il figlio è arrivato solo alle chiamate strumento, l'annuncio
può comprimere quella cronologia in un breve riepilogo di avanzamento parziale invece
di riprodurre l'output grezzo dello strumento.

### Riga di statistiche

I payload di annuncio includono una riga di statistiche alla fine (anche quando sono avvolti):

- Runtime (ad es. `runtime 5m12s`).
- Utilizzo dei token (input/output/totale).
- Costo stimato quando il prezzo del modello è configurato (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e percorso della trascrizione, così l'agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco.

I metadati interni servono solo all'orchestrazione; le risposte rivolte all'utente
dovrebbero essere riscritte con la normale voce dell'assistente.

### Perché preferire `sessions_history`

`sessions_history` è il percorso di orchestrazione più sicuro:

- Il richiamo dell'assistente viene prima normalizzato: tag di ragionamento rimossi; impalcatura `<relevant-memories>` / `<relevant_memories>` rimossa; blocchi di payload XML in testo normale delle chiamate strumento (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) rimossi, inclusi payload troncati che non si chiudono mai correttamente; impalcatura di chiamata/risultato strumento declassata e marcatori di contesto storico rimossi; token di controllo del modello trapelati (`<|assistant|>`, altri ASCII `<|...|>`, full-width `<｜...｜>`) rimossi; XML di chiamata strumento MiniMax malformato rimosso.
- Il testo simile a credenziali/token viene oscurato.
- I blocchi lunghi possono essere troncati.
- Cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga sovradimensionata con `[sessions_history omitted: message too large]`.
- L'ispezione della trascrizione grezza su disco è il fallback quando serve la trascrizione completa byte per byte.

## Criterio degli strumenti

I sub-agenti usano prima la stessa pipeline di profilo e criteri degli strumenti dell'agente padre o di destinazione. Dopo di che, OpenClaw applica il livello di restrizione dei sub-agenti.

Senza un `tools.profile` restrittivo, i sub-agenti ottengono **tutti gli strumenti tranne gli strumenti di sessione** e gli strumenti di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` rimane una vista di richiamo limitata e sanificata: non è un dump grezzo della trascrizione.

Quando `maxSpawnDepth >= 2`, i sub-agenti orchestratori di profondità 1 ricevono inoltre `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history`, così possono gestire i propri figli.

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

`tools.subagents.tools.allow` è un filtro finale solo-allow. Può restringere l'insieme di strumenti già risolto, ma non può **riaggiungere** uno strumento rimosso da `tools.profile`. Ad esempio, `tools.profile: "coding"` include `web_search`/`web_fetch` ma non lo strumento `browser`. Per consentire ai sub-agenti con profilo coding di usare l'automazione del browser, aggiungi browser nella fase del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` per singolo agente quando solo un agente deve ottenere l'automazione del browser.

## Concorrenza

I sub-agenti usano una corsia di coda dedicata in-process:

- **Nome corsia:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Vitalità e recupero

OpenClaw non considera l'assenza di `endedAt` una prova permanente che un sub-agente sia ancora attivo. Le esecuzioni non concluse più vecchie della finestra per esecuzioni obsolete smettono di contare come attive/in sospeso in `/subagents list`, nei riepiloghi di stato, nel gating del completamento dei discendenti e nei controlli di concorrenza per sessione.

Dopo un riavvio del Gateway, le esecuzioni ripristinate obsolete e non concluse vengono eliminate, a meno che la loro sessione figlia non sia contrassegnata con `abortedLastRun: true`. Queste sessioni figlie interrotte dal riavvio rimangono recuperabili tramite il flusso di recupero degli orfani dei sub-agenti, che invia un messaggio di ripresa sintetico prima di cancellare il marcatore di interruzione.

Il recupero automatico dopo il riavvio è limitato per sessione figlia. Se lo stesso figlio sub-agente viene accettato ripetutamente per il recupero degli orfani dentro la finestra di rapido re-wedge, OpenClaw persiste una tombstone di recupero su quella sessione e smette di riprenderla automaticamente ai riavvii successivi. Esegui `openclaw tasks maintenance --apply` per riconciliare il record dell'attività, oppure `openclaw doctor --fix` per cancellare flag obsoleti di recupero interrotto sulle sessioni con tombstone.

<Note>
Se la generazione di un sub-agente fallisce con Gateway `PAIRING_REQUIRED` / `scope-upgrade`, controlla il chiamante RPC prima di modificare lo stato di associazione. Il coordinamento interno `sessions_spawn` dovrebbe connettersi come `client.id: "gateway-client"` con `client.mode: "backend"` tramite autenticazione diretta su loopback con token/password condivisi; quel percorso non dipende dalla baseline di scope del dispositivo associato della CLI. I chiamanti remoti, `deviceIdentity` esplicito, i percorsi espliciti con token dispositivo e i client browser/Node richiedono comunque la normale approvazione del dispositivo per gli upgrade di scope.
</Note>

## Arresto

- L'invio di `/stop` nella chat richiedente interrompe la sessione richiedente e ferma tutte le esecuzioni di sub-agenti attive generate da essa, propagandosi ai figli annidati.
- `/subagents kill <id>` ferma un sub-agente specifico e si propaga ai suoi figli.

## Limitazioni

- L'annuncio dei sub-agenti è **best-effort**. Se il Gateway si riavvia, il lavoro "announce back" in sospeso va perso.
- I sub-agenti condividono comunque le stesse risorse del processo Gateway; considera `maxConcurrent` una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto dei sub-agenti inserisce solo `AGENTS.md` + `TOOLS.md` (non `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di annidamento è 5 (intervallo di `maxSpawnDepth`: 1-5). La profondità 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito `5`, intervallo `1-20`).

## Correlati

- [Agenti ACP](/it/tools/acp-agents)
- [Invio agente](/it/tools/agent-send)
- [Attività in background](/it/automation/tasks)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
