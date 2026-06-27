---
read_when:
    - Vuoi lavoro in background o parallelo tramite l'agente
    - Stai modificando la policy dello strumento sessions_spawn o sub-agent
    - Stai implementando o risolvendo problemi relativi alle sessioni di subagenti vincolate al thread
sidebarTitle: Sub-agents
summary: Avvia esecuzioni di agenti in background isolati che annunciano i risultati nella chat del richiedente
title: Sotto-agenti
x-i18n:
    generated_at: "2026-06-27T18:24:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

I sotto-agenti sono esecuzioni di agenti in background generate da un'esecuzione di agente esistente.
Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e,
al termine, **annunciano** il risultato al canale di chat
del richiedente. Ogni esecuzione di sotto-agente viene tracciata come
[attività in background](/it/automation/tasks).

Obiettivi principali:

- Parallelizzare il lavoro di "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sotto-agenti isolati per impostazione predefinita (separazione delle sessioni + sandboxing opzionale).
- Rendere difficile usare in modo improprio la superficie degli strumenti: i sotto-agenti **non** ricevono strumenti di sessione per impostazione predefinita.
- Supportare una profondità di annidamento configurabile per pattern di orchestrazione.

<Note>
**Nota sui costi:** ogni sotto-agente ha il proprio contesto e il proprio utilizzo di token per
impostazione predefinita. Per attività pesanti o ripetitive, imposta un modello più economico per i sotto-agenti
e mantieni l'agente principale su un modello di qualità superiore. Configura tramite
`agents.defaults.subagents.model` o override per agente. Quando un processo figlio
    ha davvero bisogno della trascrizione corrente del richiedente, l'agente può richiedere
    `context: "fork"` per quella singola generazione. Le sessioni subagent vincolate al thread usano per impostazione predefinita
    `context: "fork"` perché diramano la conversazione corrente in un
    thread di follow-up.
</Note>

## Comando slash

Usa `/subagents` per ispezionare le esecuzioni dei sotto-agenti per la **sessione corrente**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, ID sessione,
percorso della trascrizione, pulizia). Usa `sessions_history` per una vista di richiamo limitata
e filtrata per sicurezza; ispeziona il percorso della trascrizione su disco quando
ti serve la trascrizione completa grezza.

### Controlli di associazione al thread

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

Gli agenti avviano sotto-agenti in background con `sessions_spawn`. I completamenti dei sotto-agenti
ritornano come eventi interni della sessione padre; l'agente padre/richiedente decide
se è necessario un aggiornamento visibile all'utente.

<AccordionGroup>
  <Accordion title="Completamento non bloccante e basato su push">
    - `sessions_spawn` è non bloccante; restituisce immediatamente un ID esecuzione.
    - Al completamento, il sotto-agente invia il report alla sessione padre/richiedente.
    - I turni dell'agente che richiedono risultati dai processi figli dovrebbero chiamare `sessions_yield` dopo aver generato il lavoro richiesto. Questo termina il turno corrente e consente agli eventi di completamento di arrivare come messaggio successivo visibile al modello.
    - Il completamento è basato su push. Una volta generato, **non** eseguire polling di `/subagents list`, `sessions_list` o `sessions_history` in un ciclo solo per aspettare che finisca; ispeziona lo stato solo su richiesta per visibilità di debug.
    - L'output del processo figlio è un report/evidenza che l'agente richiedente deve sintetizzare. Non è testo di istruzione scritto dall'utente e non può sovrascrivere policy di sistema, sviluppatore o utente.
    - Al completamento, OpenClaw chiude al meglio delle possibilità le schede/processi del browser tracciati aperti da quella sessione di sotto-agente prima che il flusso di pulizia dell'annuncio continui.

  </Accordion>
  <Accordion title="Consegna del completamento">
    - OpenClaw restituisce i completamenti alla sessione richiedente tramite un turno `agent` con una chiave di idempotenza stabile.
    - Se l'esecuzione richiedente è ancora attiva, OpenClaw prova prima a risvegliare/orientare quella esecuzione invece di avviare un secondo percorso di risposta visibile.
    - Se non è possibile risvegliare un richiedente attivo, OpenClaw ripiega su un passaggio di consegne all'agente richiedente con lo stesso contesto di completamento invece di scartare l'annuncio.
    - Un passaggio di consegne al padre riuscito completa la consegna del sotto-agente anche quando il padre decide che non è necessario alcun aggiornamento visibile per l'utente.
    - I sotto-agenti nativi non ricevono lo strumento di messaggio. Restituiscono testo semplice da assistente all'agente padre/richiedente; le risposte visibili agli umani sono gestite dalla normale policy di consegna dell'agente padre/richiedente.
    - Se non è possibile usare il passaggio di consegne diretto, si ripiega sull'instradamento tramite coda.
    - Se l'instradamento tramite coda non è ancora disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima della rinuncia finale.
    - La consegna del completamento mantiene la rotta del richiedente risolta: le rotte di completamento vincolate al thread o alla conversazione prevalgono quando disponibili; se l'origine del completamento fornisce solo un canale, OpenClaw completa il target/account mancante dalla rotta risolta della sessione richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta continua a funzionare.

  </Accordion>
  <Accordion title="Metadati del passaggio di consegne del completamento">
    Il passaggio di consegne del completamento alla sessione richiedente è contesto interno
    generato dal runtime (non testo scritto dall'utente) e include:

    - `Result` — il testo dell'ultima risposta `assistant` visibile dal processo figlio. L'output tool/toolResult non viene promosso nei risultati del processo figlio. Le esecuzioni terminali fallite non riutilizzano il testo di risposta catturato.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistiche compatte di runtime/token.
    - Un'istruzione di revisione che dice all'agente richiedente di verificare il risultato prima di decidere se l'attività originale è completata.
    - Indicazioni di follow-up che dicono all'agente richiedente di continuare l'attività o registrare un follow-up quando il risultato del processo figlio lascia ulteriore azione.
    - Un'istruzione di aggiornamento finale per il percorso senza ulteriori azioni, scritta con normale voce da assistente senza inoltrare metadati interni grezzi.

  </Accordion>
  <Accordion title="Modalità e runtime ACP">
    - `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
    - Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
    - Per sessioni persistenti vincolate al thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
    - Se il canale richiedente non supporta associazioni ai thread, usa `mode: "run"` invece di ritentare combinazioni vincolate al thread impossibili.
    - Per sessioni di harness ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx esplicito), usa `sessions_spawn` con `runtime: "acp"` quando lo strumento dichiara quel runtime. Vedi [Modello di consegna ACP](/it/tools/acp-agents#delivery-model) quando esegui il debug di completamenti o loop agente-agente. Quando il Plugin `codex` è abilitato, il controllo di chat/thread Codex dovrebbe preferire `/codex ...` rispetto ad ACP salvo richiesta esplicita dell'utente per ACP/acpx.
    - OpenClaw nasconde `runtime: "acp"` finché ACP non è abilitato, il richiedente non è in sandbox e un Plugin backend come `acpx` è caricato. `runtime: "acp"` si aspetta un ID di harness ACP esterno, oppure una voce `agents.list[]` con `runtime.type="acp"`; usa il runtime predefinito dei sotto-agenti per i normali agenti di configurazione OpenClaw da `agents_list`.

  </Accordion>
</AccordionGroup>

## Modalità di contesto

I sotto-agenti nativi iniziano isolati salvo richiesta esplicita del chiamante di fare fork
della trascrizione corrente.

| Modalità   | Quando usarla                                                                                                                          | Comportamento                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Ricerca nuova, implementazione indipendente, lavoro con strumenti lenti o qualsiasi cosa che possa essere descritta nel testo dell'attività | Crea una trascrizione figlia pulita. Questa è l'impostazione predefinita e mantiene più basso l'uso di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, da risultati precedenti degli strumenti o da istruzioni sfumate già presenti nella trascrizione del richiedente | Dirama la trascrizione del richiedente nella sessione figlia prima dell'avvio del processo figlio. |

Usa `fork` con parsimonia. Serve per delega sensibile al contesto, non come
sostituto della scrittura di un prompt di attività chiaro.

## Strumento: `sessions_spawn`

Avvia un'esecuzione di sotto-agente con `deliver: false` sulla corsia globale `subagent`,
poi esegue un passaggio di annuncio e pubblica la risposta dell'annuncio nel canale
di chat del richiedente.

La disponibilità dipende dalla policy effettiva degli strumenti del chiamante. I profili `coding` e
`full` espongono `sessions_spawn` per impostazione predefinita. Il profilo `messaging`
no; aggiungi `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` oppure usa `tools.profile: "coding"` per agenti che dovrebbero delegare
lavoro. Le policy di canale/gruppo, provider, sandbox e allow/deny per agente possono
comunque rimuovere lo strumento dopo la fase del profilo. Usa `/tools` dalla stessa
sessione per confermare l'elenco effettivo degli strumenti.

**Impostazioni predefinite:**

- **Modello:** i sotto-agenti nativi ereditano il chiamante salvo che tu imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente). Le generazioni del runtime ACP usano lo stesso modello subagent configurato quando presente; altrimenti l'harness ACP mantiene il proprio valore predefinito. Un `sessions_spawn.model` esplicito ha comunque la precedenza.
- **Ragionamento:** i sotto-agenti nativi ereditano il chiamante salvo che tu imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente). Le generazioni del runtime ACP applicano anche `agents.defaults.models["provider/model"].params.thinking` per il modello selezionato. Un `sessions_spawn.thinking` esplicito ha comunque la precedenza.
- **Timeout di esecuzione:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ripiega su `0` (nessun timeout). `sessions_spawn` non accetta override del timeout per chiamata.
- **Consegna dell'attività:** i sotto-agenti nativi ricevono l'attività delegata nel loro primo messaggio `[Subagent Task]` visibile. Il prompt di sistema del sotto-agente contiene regole di runtime e contesto di instradamento, non un duplicato nascosto dell'attività.

Le generazioni di sotto-agenti nativi accettate includono i metadati del modello figlio risolto nel
risultato dello strumento: `resolvedModel` contiene il riferimento al modello applicato e
`resolvedProvider` contiene il prefisso del provider quando il riferimento ne ha uno.

### Modalità del prompt di delega

`agents.defaults.subagents.delegationMode` controlla solo la guida del prompt; non modifica la policy degli strumenti né impone la delega.

- `suggest` (predefinito): mantiene il suggerimento standard del prompt di usare sotto-agenti per lavori più grandi o più lenti.
- `prefer`: dice all'agente principale di restare reattivo e delegare tramite `sessions_spawn` qualsiasi cosa più articolata di una risposta diretta.

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
  Handle stabile facoltativo per identificare un figlio specifico nell'output di stato successivo. Deve corrispondere a `[a-z][a-z0-9_-]{0,63}` e non può essere un target riservato come `last` o `all`.
</ParamField>
<ParamField path="label" type="string">
  Etichetta facoltativa leggibile da una persona.
</ParamField>
<ParamField path="agentId" type="string">
  Genera sotto un altro id agente configurato quando consentito da `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro facoltativa per l'attività dell'esecuzione figlia. I sotto-agenti nativi caricano comunque i file di bootstrap dallo spazio di lavoro dell'agente di destinazione; `cwd` cambia solo dove gli strumenti di runtime e gli harness CLI svolgono il lavoro delegato.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` è solo per harness ACP esterni (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx richiesto esplicitamente) e per voci `agents.list[]` il cui `runtime.type` è `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Riprende una sessione harness ACP esistente quando `runtime: "acp"`; ignorato per generazioni di sotto-agenti nativi.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Trasmette l'output dell'esecuzione ACP alla sessione padre quando `runtime: "acp"`; omettere per generazioni di sotto-agenti nativi.
</ParamField>
<ParamField path="model" type="string">
  Sovrascrive il modello del sotto-agente. I valori non validi vengono saltati e il sotto-agente viene eseguito sul modello predefinito con un avviso nel risultato dello strumento.
</ParamField>
<ParamField path="thinking" type="string">
  Sovrascrive il livello di ragionamento per l'esecuzione del sotto-agente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, richiede l'associazione al thread del canale per questa sessione del sotto-agente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`. `mode: "session"` richiede `thread: true`.
  Se l'associazione al thread non è disponibile per il canale richiedente, usare invece `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rifiuta la generazione a meno che il runtime figlio di destinazione sia in sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` dirama la trascrizione corrente del richiedente nella sessione figlia. Solo sotto-agenti nativi. Le generazioni associate a thread usano per impostazione predefinita `fork`; le generazioni non associate a thread usano per impostazione predefinita `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **non** accetta parametri di consegna del canale (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). I sotto-agenti nativi riportano
il loro ultimo turno dell'assistente al richiedente; la consegna esterna resta con
l'agente padre/richiedente.
</Warning>

### Nomi delle attività e targeting

`taskName` è un handle visibile al modello per l'orchestrazione, non una chiave di sessione.
Usalo per nomi figli stabili come `review_subagents`,
`linux_validation` o `docs_update` quando un coordinatore potrebbe dover ispezionare
quel figlio in seguito.

La risoluzione del target accetta corrispondenze esatte di `taskName` e prefissi
non ambigui. La corrispondenza è limitata alla stessa finestra di target attivi/recenti usata
dai target numerati di `/subagents`, quindi un figlio completato obsoleto non rende
ambiguo un handle riutilizzato. Se due figli attivi o recenti condividono lo stesso
`taskName`, il target è ambiguo; usa invece l'indice dell'elenco, la chiave di sessione o
l'id dell'esecuzione.

I target riservati `last` e `all` non sono valori `taskName` validi
perché hanno già significati di controllo.

## Strumento: `sessions_yield`

Termina il turno corrente del modello e attende che gli eventi di runtime, principalmente
gli eventi di completamento dei sotto-agenti, arrivino come messaggio successivo. Usalo dopo
aver generato lavoro figlio richiesto quando il richiedente non può produrre una risposta
finale finché non arrivano quei completamenti.

`sessions_yield` è la primitiva di attesa. Non sostituirla con cicli di polling
su `subagents`, `sessions_list`, `sessions_history`, `sleep` della shell
o polling dei processi solo per rilevare il completamento dei figli.

Usa `sessions_yield` solo quando l'elenco effettivo degli strumenti della sessione lo include.
Alcuni profili di strumenti minimi o personalizzati possono esporre `sessions_spawn` e
`subagents` senza esporre `sessions_yield`; in quel caso, non inventare
un ciclo di polling solo per attendere il completamento.

Quando esistono figli attivi, OpenClaw inietta un blocco di prompt compatto generato dal runtime
`Active Subagents` nei turni normali, così il richiedente può vedere
le sessioni figlie correnti, gli id di esecuzione, gli stati, le etichette, le attività e
gli alias `taskName` senza polling. I campi attività ed etichetta in quel
blocco sono quotati come dati, non istruzioni, perché possono provenire
da argomenti di generazione forniti dall'utente/modello.

## Strumento: `subagents`

Elenca le esecuzioni di sotto-agenti generate e possedute dalla sessione richiedente. È limitato
al richiedente corrente; un figlio può vedere solo i propri figli controllati.

Usa `subagents` per stato su richiesta e debug. Usa `sessions_yield` per
attendere gli eventi di completamento.

## Sessioni associate a thread

Quando le associazioni a thread sono abilitate per un canale, un sotto-agente può restare associato
a un thread affinché i messaggi utente successivi in quel thread continuino a essere instradati alla
stessa sessione del sotto-agente.

### Canali che supportano i thread

Qualsiasi canale con un adattatore di associazione di sessione può supportare sessioni di sotto-agenti persistenti
associate a thread (`sessions_spawn` con `thread: true`).
Gli adattatori inclusi attualmente comprendono thread Discord, thread Matrix,
argomenti forum Telegram e associazioni alla conversazione corrente per Feishu.
Usa le chiavi di configurazione `threadBindings` per canale per abilitazione,
timeout e `spawnSessions`.

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

| Comando            | Effetto                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Associa il thread corrente (o creane uno) a un target sotto-agente/sessione |
| `/unfocus`         | Rimuove l'associazione per il thread associato corrente                       |
| `/agents`          | Elenca le esecuzioni attive e lo stato di associazione (`thread:<id>` o `unbound`)       |
| `/session idle`    | Ispeziona/aggiorna l'auto-unfocus per inattività (solo thread associati in focus)         |
| `/session max-age` | Ispeziona/aggiorna il limite massimo rigido (solo thread associati in focus)                  |

### Interruttori di configurazione

- **Predefinito globale:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override del canale e chiavi di auto-associazione della generazione** sono specifici dell'adattatore. Vedi [Canali che supportano i thread](#thread-supporting-channels) sopra.

Vedi [Riferimento di configurazione](/it/gateway/configuration-reference) e
[Comandi slash](/it/tools/slash-commands) per i dettagli correnti degli adattatori.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Elenco di id agente configurati che possono essere presi di mira tramite `agentId` esplicito (`["*"]` consente qualsiasi target configurato). Predefinito: solo l'agente richiedente. Se imposti un elenco e vuoi comunque che il richiedente generi se stesso con `agentId`, includi l'id del richiedente nell'elenco.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist predefinita dei target-agente configurati usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Override per agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout per chiamata per i tentativi di consegna dell'annuncio `agent` del Gateway. I valori sono millisecondi interi positivi e vengono limitati al massimo timer sicuro per la piattaforma. I tentativi transitori possono rendere l'attesa totale dell'annuncio più lunga di un timeout configurato.
</ParamField>

Se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta i target
che verrebbero eseguiti senza sandbox.

### Discovery

Usa `agents_list` per vedere quali id agente sono attualmente consentiti per
`sessions_spawn`. La risposta include il modello effettivo di ciascun agente elencato
e i metadati di runtime incorporati, così i chiamanti possono distinguere OpenClaw, server app Codex
e altri runtime nativi configurati.

Le voci `allowAgents` devono puntare a id agente configurati in `agents.list[]`.
`["*"]` significa qualsiasi agente target configurato più il richiedente. Se una configurazione agente
viene eliminata ma il suo id resta in `allowAgents`, `sessions_spawn` rifiuta quell'id
e `agents_list` lo omette. Esegui `openclaw doctor --fix` per pulire le voci
allowlist obsolete, oppure aggiungi una voce minima `agents.list[]` quando il target deve
restare generabile ereditando i valori predefiniti.

### Archiviazione automatica

- Le sessioni dei sotto-agenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito `60`).
- L'archiviazione usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
- L'archiviazione automatica è best-effort; i timer in sospeso vengono persi se il gateway si riavvia.
- I timeout di esecuzione configurati **non** archiviano automaticamente; arrestano solo l'esecuzione. La sessione resta fino all'archiviazione automatica.
- L'archiviazione automatica si applica ugualmente alle sessioni di profondità 1 e profondità 2.
- La pulizia del browser è separata dalla pulizia dell'archivio: le schede/i processi del browser tracciati vengono chiusi best-effort quando l'esecuzione termina, anche se la trascrizione/il record della sessione viene mantenuto.

## Sotto-agenti nidificati

Per impostazione predefinita, i sotto-agenti non possono generare i propri sotto-agenti
(`maxSpawnDepth: 1`). Imposta `maxSpawnDepth: 2` per abilitare un livello di
annidamento — il **modello orchestratore**: principale → sotto-agente orchestratore →
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

| Profondità | Forma della chiave di sessione                 | Ruolo                                          | Può generare?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principale                                    | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sotto-agente (orchestratore quando la profondità 2 è consentita) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sotto-agente (worker foglia)                   | Mai                        |

### Catena di annuncio

I risultati risalgono la catena:

1. Il worker di profondità 2 termina → lo annuncia al proprio genitore (orchestratore di profondità 1).
2. L’orchestratore di profondità 1 riceve l’annuncio, sintetizza i risultati, termina → lo annuncia al principale.
3. L’agente principale riceve l’annuncio e lo consegna all’utente.

Ogni livello vede solo gli annunci dei propri figli diretti.

<Note>
**Indicazioni operative:** avvia il lavoro figlio una sola volta e attendi gli
eventi di completamento invece di costruire cicli di polling intorno a
`sessions_list`, `sessions_history`, `/subagents list` o comandi `exec`
con sleep. `sessions_list` e `/subagents list` mantengono le relazioni
tra sessioni figlie focalizzate sul lavoro attivo — i figli attivi restano
collegati, i figli terminati restano visibili per una breve finestra
recente e i collegamenti a figli obsoleti presenti solo nello store
vengono ignorati dopo la loro finestra di freschezza. Questo impedisce ai
vecchi metadati `spawnedBy` / `parentSessionKey` di riesumare figli
fantasma dopo il riavvio. Se un evento di completamento figlio arriva dopo
che hai già inviato la risposta finale, il follow-up corretto è l’esatto
token silenzioso `NO_REPLY` / `no_reply`.
</Note>

### Criteri degli strumenti per profondità

- Il ruolo e l’ambito di controllo vengono scritti nei metadati della sessione al momento dello spawn. Questo impedisce a chiavi di sessione piatte o ripristinate di riottenere accidentalmente i privilegi di orchestratore.
- **Profondità 1 (orchestratore, quando `maxSpawnDepth >= 2`):** riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può generare figli e ispezionarne lo stato. Gli altri strumenti di sessione/sistema restano negati.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`):** nessuno strumento di sessione (comportamento predefinito attuale).
- **Profondità 2 (worker foglia):** nessuno strumento di sessione — `sessions_spawn` è sempre negato alla profondità 2. Non può generare ulteriori figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo
`maxChildrenPerAgent` (predefinito `5`) figli attivi alla volta. Questo
impedisce una ramificazione incontrollata da un singolo orchestratore.

### Arresto a cascata

L’arresto di un orchestratore di profondità 1 arresta automaticamente
tutti i suoi figli di profondità 2:

- `/stop` nella chat principale arresta tutti gli agenti di profondità 1 e propaga l’arresto ai loro figli di profondità 2.

## Autenticazione

L’autenticazione dei sotto-agenti viene risolta per **ID agente**, non per tipo di sessione:

- La chiave di sessione del sotto-agente è `agent:<agentId>:subagent:<uuid>`.
- Lo store di autenticazione viene caricato dall’`agentDir` di quell’agente.
- I profili di autenticazione dell’agente principale vengono uniti come **fallback**; in caso di conflitti, i profili dell’agente sovrascrivono quelli principali.

L’unione è additiva, quindi i profili principali sono sempre disponibili
come fallback. L’autenticazione completamente isolata per agente non è
ancora supportata.

## Annuncio

I sotto-agenti riportano i risultati tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito all’interno della sessione del sotto-agente (non nella sessione del richiedente).
- Se il sotto-agente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se il testo dell’assistente più recente è l’esatto token silenzioso `NO_REPLY` / `no_reply`, l’output dell’annuncio viene soppresso anche se in precedenza erano esistiti progressi visibili.

La consegna dipende dalla profondità del richiedente:

- Le sessioni richiedenti di livello superiore usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`).
- Le sessioni di sotto-agente richiedenti annidate ricevono un’iniezione interna di follow-up (`deliver=false`) così l’orchestratore può sintetizzare i risultati dei figli nella sessione.
- Se una sessione di sotto-agente richiedente annidata non esiste più, OpenClaw ripiega sul richiedente di quella sessione quando disponibile.

Per le sessioni richiedenti di livello superiore, la consegna diretta in
modalità completamento risolve prima qualsiasi route conversazione/thread
associata e override hook, poi compila i campi channel-target mancanti
dalla route memorizzata della sessione richiedente. Questo mantiene i
completamenti nella chat/argomento corretti anche quando l’origine del
completamento identifica solo il canale.

L’aggregazione dei completamenti figli è limitata all’esecuzione corrente
del richiedente quando crea i risultati di completamento annidati,
impedendo agli output figli obsoleti di esecuzioni precedenti di trapelare
nell’annuncio corrente. Le risposte di annuncio preservano il routing
thread/argomento quando disponibile sugli adapter di canale.

### Contesto dell’annuncio

Il contesto dell’annuncio viene normalizzato in un blocco evento interno stabile:

| Campo          | Origine                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Origine        | `subagent` o `cron`                                                                                              |
| ID sessione    | Chiave/id della sessione figlia                                                                                  |
| Tipo           | Tipo di annuncio + etichetta attività                                                                            |
| Stato          | Derivato dall’esito runtime (`success`, `error`, `timeout` o `unknown`) — **non** inferito dal testo del modello |
| Contenuto risultato | Testo assistente visibile più recente del figlio                                                            |
| Follow-up      | Istruzione che descrive quando rispondere rispetto a restare in silenzio                                         |

Le esecuzioni terminali non riuscite riportano lo stato di errore senza
riprodurre il testo di risposta catturato. L’output tool/toolResult non
viene promosso a testo risultato del figlio.

### Riga delle statistiche

I payload di annuncio includono una riga di statistiche alla fine (anche quando sono racchiusi):

- Runtime (ad esempio `runtime 5m12s`).
- Uso dei token (input/output/totale).
- Costo stimato quando il prezzo del modello è configurato (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e percorso della trascrizione, così l’agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco.

I metadati interni sono destinati solo all’orchestrazione; le risposte
rivolte all’utente dovrebbero essere riscritte con la normale voce
dell’assistente.

### Perché preferire `sessions_history`

`sessions_history` è il percorso di orchestrazione più sicuro:

- Il richiamo dell’assistente viene prima normalizzato: tag di ragionamento rimossi; scaffolding `<relevant-memories>` / `<relevant_memories>` rimosso; blocchi payload XML di chiamate strumento in testo semplice (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) rimossi, inclusi i payload troncati che non si chiudono correttamente; scaffolding degradato di chiamate/risultati strumento e marcatori di contesto storico rimossi; token di controllo del modello trapelati (`<|assistant|>`, altri ASCII `<|...|>`, a larghezza piena `<｜...｜>`) rimossi; XML di chiamate strumento MiniMax malformato rimosso.
- Il testo simile a credenziali/token viene oscurato.
- I blocchi lunghi possono essere troncati.
- Le cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga sovradimensionata con `[sessions_history omitted: message too large]`.
- L’ispezione della trascrizione grezza su disco è il fallback quando serve la trascrizione completa byte per byte.

## Criteri degli strumenti

I sotto-agenti usano prima la stessa pipeline di profilo e criteri degli
strumenti del genitore o dell’agente target. Dopo questo, OpenClaw applica
il livello di restrizione dei sotto-agenti.

Senza un `tools.profile` restrittivo, i sotto-agenti ricevono **tutti gli strumenti eccetto lo strumento messaggi, gli strumenti di sessione e gli strumenti di sistema**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

Anche qui `sessions_history` rimane una vista di richiamo limitata e
sanitizzata — non è un dump della trascrizione grezza.

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

`tools.subagents.tools.allow` è un filtro finale solo-consenti. Può
restringere l’insieme di strumenti già risolto, ma non può **riaggiungere**
uno strumento rimosso da `tools.profile`. Ad esempio, `tools.profile:
"coding"` include `web_search`/`web_fetch` ma non lo strumento `browser`.
Per consentire ai sotto-agenti con profilo coding di usare l’automazione
browser, aggiungi browser nella fase del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` per agente quando solo un
agente deve ricevere l’automazione browser.

## Concorrenza

I sotto-agenti usano una corsia di coda in-process dedicata:

- **Nome corsia:** `subagent`
- **Concorrenza:** `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Vitalità e recupero

OpenClaw non considera l’assenza di `endedAt` come prova permanente che un
sotto-agente sia ancora vivo. Le esecuzioni non terminate più vecchie
della finestra di esecuzione obsoleta smettono di contare come
attive/in sospeso in `/subagents list`, nei riepiloghi di stato, nel
gating del completamento dei discendenti e nei controlli di concorrenza
per sessione.

Dopo un riavvio del Gateway, le esecuzioni ripristinate obsolete e non
terminate vengono eliminate a meno che la loro sessione figlia sia marcata
`abortedLastRun: true`. Quelle sessioni figlie interrotte dal riavvio
restano recuperabili tramite il flusso di recupero orfano dei sotto-agenti,
che invia un messaggio sintetico di ripresa prima di cancellare il
marcatore di interruzione.

Il recupero automatico al riavvio è limitato per sessione figlia. Se lo
stesso sotto-agente figlio viene accettato ripetutamente per il recupero
orfano all’interno della finestra rapida di nuovo blocco, OpenClaw
persiste una tombstone di recupero su quella sessione e smette di
riprenderla automaticamente nei riavvii successivi. Esegui `openclaw tasks
maintenance --apply` per riconciliare il record dell’attività, oppure
`openclaw doctor --fix` per cancellare i flag di recupero interrotto
obsoleti sulle sessioni con tombstone.

<Note>
Se lo spawn di un sotto-agente fallisce con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controlla il chiamante RPC prima di modificare lo stato
di pairing. Il coordinamento interno `sessions_spawn` effettua il dispatch
in process quando il chiamante è già in esecuzione dentro il contesto
della richiesta gateway, quindi non apre una WebSocket local loopback né
dipende dalla baseline di ambito del dispositivo abbinato della CLI. I
chiamanti fuori dal processo gateway usano ancora il fallback WebSocket
come `client.id: "gateway-client"` con `client.mode: "backend"` tramite
autenticazione diretta local loopback con token/password condivisi. I
chiamanti remoti, `deviceIdentity` esplicite, percorsi device-token
espliciti e client browser/node richiedono ancora la normale approvazione
del dispositivo per gli upgrade di ambito.
</Note>

## Arresto

- L’invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta qualsiasi esecuzione di sotto-agente attiva generata da essa, propagandosi ai figli annidati.

## Limitazioni

- L’annuncio dei sotto-agenti è **best-effort**. Se il gateway si riavvia, il lavoro "announce back" in sospeso viene perso.
- I sotto-agenti condividono comunque le stesse risorse del processo gateway; considera `maxConcurrent` come una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto del sotto-agente inietta solo `AGENTS.md` e `TOOLS.md` (nessun `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`). I sotto-agenti nativi Codex seguono lo stesso confine: `TOOLS.md` resta nelle istruzioni ereditate del thread Codex, mentre i file persona, identità e utente solo del genitore vengono iniettati come istruzioni di collaborazione limitate al turno, così i figli non li clonano.
- La profondità massima di annidamento è 5 (intervallo `maxSpawnDepth`: 1–5). La profondità 2 è consigliata per la maggior parte dei casi d’uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito `5`, intervallo `1–20`).

## Correlati

- [Agenti ACP](/it/tools/acp-agents)
- [Invio agente](/it/tools/agent-send)
- [Attività in background](/it/automation/tasks)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
