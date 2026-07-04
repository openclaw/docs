---
read_when:
    - Vuoi capire quali strumenti di sessione ha l'agente
    - Vuoi configurare l'accesso tra sessioni o l'avvio di sub-agent
    - Vuoi ispezionare lo stato del sotto-agente generato
summary: Strumenti agente per stato, richiamo, messaggistica e orchestrazione di sub-agent tra sessioni
title: Strumenti di sessione
x-i18n:
    generated_at: "2026-07-04T20:33:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw offre agli agenti strumenti per lavorare tra sessioni, ispezionare lo stato e
orchestrare agenti secondari.

## Strumenti disponibili

| Strumento          | Cosa fa                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Elenca le sessioni con filtri facoltativi (tipo, etichetta, agente, archivio, anteprima) |
| `sessions_history` | Legge la trascrizione di una sessione specifica                             |
| `sessions_send`    | Invia un messaggio a un'altra sessione e, facoltativamente, attende         |
| `sessions_spawn`   | Avvia una sessione isolata di un agente secondario per lavoro in background |
| `sessions_yield`   | Termina il turno corrente e attende i risultati successivi degli agenti secondari |
| `subagents`        | Elenca lo stato degli agenti secondari avviati per questa sessione          |
| `session_status`   | Mostra una scheda in stile `/status` e, facoltativamente, imposta un override del modello per sessione |

Questi strumenti restano soggetti al profilo strumenti attivo e alla policy
di autorizzazione/negazione. `tools.profile: "coding"` include l'intero set di
orchestrazione delle sessioni, inclusi `sessions_spawn`, `sessions_yield` e
`subagents`. `tools.profile: "messaging"` include gli strumenti di messaggistica
tra sessioni (`sessions_list`, `sessions_history`, `sessions_send`,
`session_status`), ma non include l'avvio di agenti secondari. Per mantenere
un profilo di messaggistica e consentire comunque la delega nativa, aggiungi:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Le policy di gruppo, provider, sandbox e per agente possono comunque rimuovere
questi strumenti dopo la fase del profilo. Usa `/tools` dalla sessione interessata
per ispezionare l'elenco effettivo degli strumenti.

## Elencare e leggere le sessioni

`sessions_list` restituisce le sessioni con la loro chiave, agentId, tipo, canale,
modello, conteggi dei token e timestamp. Filtra per tipo (`main`, `group`, `cron`,
`hook`, `node`), `label` esatta, `agentId` esatto, testo di ricerca o attività
recente (`activeMinutes`). Le sessioni attive vengono restituite per impostazione
predefinita; passa `archived: true` per ispezionare le sessioni archiviate. Le righe
includono il loro stato fissato e archiviato. Quando hai bisogno di un triage in
stile casella di posta, può anche richiedere un titolo derivato con ambito di
visibilità, uno snippet di anteprima dell'ultimo messaggio o messaggi recenti
limitati per ogni riga. I titoli derivati e le anteprime vengono prodotti solo per
le sessioni che il chiamante può già vedere in base alla policy configurata di
visibilità degli strumenti di sessione, quindi le sessioni non correlate restano
nascoste. Quando la visibilità è limitata, `sessions_list` restituisce metadati
facoltativi `visibility` che mostrano la modalità effettiva e un avviso che i
risultati potrebbero essere limitati per ambito.

`sessions_history` recupera la trascrizione della conversazione per una sessione
specifica. Per impostazione predefinita, i risultati degli strumenti sono esclusi:
passa `includeTools: true` per vederli. Usa `limit` per la coda più recente e
limitata. Passa `offset: 0` quando ti servono i metadati di paginazione, quindi
passa i valori `nextOffset` restituiti per tornare indietro tra finestre più
vecchie della trascrizione OpenClaw senza leggere file di trascrizione grezzi.
Le pagine con offset esplicito non uniscono importazioni di fallback da CLI esterna;
usa la vista predefinita della coda più recente quando ti serve quella cronologia
di visualizzazione unificata.
La vista restituita è intenzionalmente limitata e filtrata per sicurezza:

- il testo dell'assistente viene normalizzato prima del recupero:
  - i tag di ragionamento vengono rimossi
  - i blocchi di scaffolding `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi di payload XML di chiamate strumento in testo normale come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi i payload
    troncati che non si chiudono mai correttamente
  - lo scaffolding degradato di chiamate/risultati strumento come `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]` viene rimosso
  - i token di controllo del modello trapelati come `<|assistant|>`, altri token ASCII
    `<|...|>` e le varianti a larghezza piena `<｜...｜>` vengono rimossi
  - l'XML malformato di chiamate strumento MiniMax come `<invoke ...>` /
    `</minimax:tool_call>` viene rimosso
- il testo simile a credenziali/token viene oscurato prima di essere restituito
- i blocchi di testo lunghi vengono troncati
- cronologie molto grandi possono eliminare le righe più vecchie o sostituire una riga sovradimensionata con
  `[sessions_history omitted: message too large]`
- lo strumento segnala flag di riepilogo come `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes` e metadati di paginazione

Entrambi gli strumenti accettano una **chiave di sessione** (come `"main"`) o un
**ID sessione** da una chiamata di elenco precedente.

Se ti serve la trascrizione esatta byte per byte, ispeziona il file di trascrizione
su disco invece di trattare `sessions_history` come un dump grezzo.

## Invio di messaggi tra sessioni

`sessions_send` recapita un messaggio a un'altra sessione e, facoltativamente,
attende la risposta:

- **Invia e dimentica:** imposta `timeoutSeconds: 0` per accodare e restituire
  immediatamente.
- **Attendi risposta:** imposta un timeout e ottieni la risposta inline.

Le sessioni di chat con ambito thread, come le chiavi Slack o Discord che terminano
con `:thread:<id>`, non sono destinazioni valide per `sessions_send`. Usa la chiave
di sessione del canale padre per il coordinamento tra agenti, così i messaggi
instradati dagli strumenti non appaiono dentro un thread attivo rivolto a esseri umani.

I messaggi e le risposte successive A2A sono contrassegnati come dati tra sessioni
nel prompt ricevente (`[Inter-session message ... isUser=false]`) e nella provenienza
della trascrizione. L'agente ricevente deve trattarli come dati instradati da strumenti,
non come un'istruzione diretta scritta dall'utente finale.

Dopo che la destinazione risponde, OpenClaw può eseguire un **ciclo di risposta
all'indietro** in cui gli agenti alternano i messaggi (fino a
`session.agentToAgent.maxPingPongTurns`, intervallo 0-20, predefinito 5). L'agente
di destinazione può rispondere `REPLY_SKIP` per interrompere in anticipo.

## Helper di stato e orchestrazione

`session_status` è lo strumento leggero equivalente a `/status` per la sessione
corrente o per un'altra sessione visibile. Riporta utilizzo, tempo, stato del
modello/runtime e contesto di attività in background collegate, quando presente.
Come `/status`, può completare retroattivamente contatori sparsi di token/cache
dall'ultima voce di utilizzo della trascrizione, e `model=default` cancella un
override per sessione. Usa `sessionKey="current"` per la sessione corrente del
chiamante; le etichette client visibili come `openclaw-tui` non sono chiavi di
sessione.

Quando i metadati di route sono disponibili, `session_status` include anche un
blocco JSON visibile `Route context` e campi strutturati `details` corrispondenti.
Questi campi distinguono la chiave di sessione dalla route che sta attualmente
gestendo l'esecuzione live:

- `origin` è il punto in cui la sessione è stata creata, oppure il provider dedotto
  da un prefisso di chiave sessione recapitabile quando lo stato più vecchio non
  dispone di metadati di origine salvati.
- `active` è la route dell'esecuzione live corrente. Viene segnalata solo per la
  sessione live o corrente gestita in questo momento.
- `deliveryContext` è la route di recapito persistente salvata sulla sessione,
  che OpenClaw può riutilizzare per recapiti successivi anche quando la superficie
  attiva è diversa.

`sessions_yield` termina intenzionalmente il turno corrente così il messaggio
successivo può essere l'evento di follow-up che stai aspettando. Usalo dopo aver
avviato agenti secondari quando vuoi che i risultati di completamento arrivino
come messaggio successivo invece di creare cicli di polling.

`subagents` è l'helper di visibilità per gli agenti secondari OpenClaw già avviati.
Supporta `action: "list"` per ispezionare esecuzioni attive/recenti.

## Avvio di agenti secondari

`sessions_spawn` crea per impostazione predefinita una sessione isolata per
un'attività in background. È sempre non bloccante: restituisce immediatamente un
`runId` e una `childSessionKey`. Le esecuzioni native degli agenti secondari
ricevono l'attività delegata nel primo messaggio visibile `[Subagent Task]` della
sessione figlia, mentre il prompt di sistema contiene solo le regole di runtime
dell'agente secondario e il contesto di routing.

Opzioni principali:

- `runtime: "subagent"` (predefinito) o `"acp"` per agenti harness esterni.
- Override `model` e `thinking` per la sessione figlia.
- `thread: true` per associare l'avvio a un thread di chat (Discord, Slack, ecc.).
- `sandbox: "require"` per applicare il sandboxing alla sessione figlia.
- `context: "fork"` per agenti secondari nativi quando il figlio ha bisogno della
  trascrizione corrente del richiedente; omettilo o usa `context: "isolated"` per
  un figlio pulito. Gli agenti secondari nativi associati a thread usano per
  impostazione predefinita `context: "fork"`, salvo diversa indicazione di
  `threadBindings.defaultSpawnContext`.

Gli agenti secondari foglia predefiniti non ricevono strumenti di sessione. Quando
`maxSpawnDepth >= 2`, gli agenti secondari orchestratori di profondità 1 ricevono
inoltre `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` così
possono gestire i propri figli. Le esecuzioni foglia continuano a non ricevere
strumenti di orchestrazione ricorsiva.

Dopo il completamento, un passaggio di annuncio pubblica il risultato nel canale
del richiedente. Il recapito del completamento preserva il routing di thread/topic
associato quando disponibile, e se l'origine del completamento identifica solo un
canale OpenClaw può comunque riutilizzare la route salvata della sessione del
richiedente (`lastChannel` / `lastTo`) per il recapito diretto.

Per il comportamento specifico di ACP, consulta [Agenti ACP](/it/tools/acp-agents).

## Visibilità

Gli strumenti di sessione sono limitati per restringere ciò che l'agente può vedere:

| Livello | Ambito                                   |
| ------- | ---------------------------------------- |
| `self`  | Solo la sessione corrente                |
| `tree`  | Sessione corrente + agenti secondari avviati |
| `agent` | Tutte le sessioni per questo agente      |
| `all`   | Tutte le sessioni (tra agenti se configurato) |

Il valore predefinito è `tree`. Le sessioni in sandbox sono limitate a `tree`
indipendentemente dalla configurazione.

## Approfondimenti

- [Gestione delle sessioni](/it/concepts/session) -- routing, ciclo di vita, manutenzione
- [Agenti ACP](/it/tools/acp-agents) -- avvio di harness esterni
- [Multi-agente](/it/concepts/multi-agent) -- architettura multi-agente
- [Configurazione Gateway](/it/gateway/configuration) -- opzioni di configurazione degli strumenti di sessione

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
