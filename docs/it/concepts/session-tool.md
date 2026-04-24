---
read_when:
    - Vuoi capire quali strumenti di sessione ha l'agente
    - Vuoi configurare l'accesso cross-session o la generazione di sotto-agenti
    - Vuoi ispezionare lo stato o controllare i sotto-agenti generati
summary: Strumenti dell'agente per stato cross-session, richiamo, messaggistica e orchestrazione di sotto-agenti
title: Strumenti di sessione
x-i18n:
    generated_at: "2026-04-24T08:38:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3032178a83e662009c3ea463f02cb20d604069d1634d5c24a9f86988e676b2e
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw fornisce agli agenti strumenti per lavorare tra sessioni, ispezionare lo stato e
orchestrare sotto-agenti.

## Strumenti disponibili

| Strumento | Cosa fa |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list` | Elenca le sessioni con filtri facoltativi (tipo, etichetta, agente, recenza, anteprima) |
| `sessions_history` | Legge la trascrizione di una sessione specifica |
| `sessions_send` | Invia un messaggio a un'altra sessione e facoltativamente attende |
| `sessions_spawn` | Genera una sessione isolata di sotto-agente per lavoro in background |
| `sessions_yield` | Termina il turno corrente e attende risultati di follow-up del sotto-agente |
| `subagents` | Elenca, dirige o termina i sotto-agenti generati per questa sessione |
| `session_status` | Mostra una scheda in stile `/status` e facoltativamente imposta un override di modello per sessione |

## Elencare e leggere le sessioni

`sessions_list` restituisce sessioni con chiave, agentId, tipo, canale, modello,
conteggi di token e timestamp. Filtra per tipo (`main`, `group`, `cron`, `hook`,
`node`), `label` esatta, `agentId` esatto, testo di ricerca o recenza
(`activeMinutes`). Quando ti serve uno smistamento in stile casella di posta, può anche richiedere un
titolo derivato con ambito di visibilità, uno snippet di anteprima dell'ultimo messaggio o
messaggi recenti limitati su ogni riga. I titoli derivati e le anteprime vengono prodotti solo per
le sessioni che il chiamante può già vedere secondo il criterio di visibilità
configurato degli strumenti di sessione, quindi le sessioni non correlate restano nascoste.

`sessions_history` recupera la trascrizione della conversazione per una sessione specifica.
Per impostazione predefinita, i risultati degli strumenti sono esclusi -- passa `includeTools: true` per vederli.
La vista restituita è intenzionalmente limitata e filtrata per sicurezza:

- il testo assistant viene normalizzato prima del richiamo:
  - i tag di thinking vengono rimossi
  - i blocchi di scaffolding `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi di payload XML in testo semplice delle chiamate agli strumenti come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi payload troncati
    che non si chiudono mai correttamente
  - lo scaffolding degradato di chiamata/risultato strumenti come `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]` viene rimosso
  - i token di controllo del modello trapelati come `<|assistant|>`, altri token ASCII
    `<|...|>` e varianti full-width `<｜...｜>` vengono rimossi
  - l'XML malformato delle chiamate agli strumenti MiniMax come `<invoke ...>` /
    `</minimax:tool_call>` viene rimosso
- il testo simile a credenziali/token viene redatto prima di essere restituito
- i blocchi di testo lunghi vengono troncati
- cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga sovradimensionata con
  `[sessions_history omitted: message too large]`
- lo strumento riporta flag di riepilogo come `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` e `bytes`

Entrambi gli strumenti accettano sia una **chiave di sessione** (come `"main"`) sia un **ID sessione**
da una precedente chiamata list.

Se ti serve la trascrizione esatta byte per byte, ispeziona il file della trascrizione su
disco invece di trattare `sessions_history` come un dump grezzo.

## Invio di messaggi cross-session

`sessions_send` consegna un messaggio a un'altra sessione e facoltativamente attende
la risposta:

- **Fire-and-forget:** imposta `timeoutSeconds: 0` per accodare e restituire
  immediatamente.
- **Attesa della risposta:** imposta un timeout e ottieni la risposta inline.

Dopo che la destinazione risponde, OpenClaw può eseguire un **reply-back loop** in cui gli
agenti alternano messaggi (fino a 5 turni). L'agente di destinazione può rispondere
`REPLY_SKIP` per fermarsi in anticipo.

## Helper di stato e orchestrazione

`session_status` è lo strumento leggero equivalente a `/status` per la sessione corrente
o per un'altra sessione visibile. Riporta utilizzo, tempo, stato modello/runtime e
contesto collegato delle attività in background quando presente. Come `/status`, può riempire
contatori radi di token/cache dall'ultima voce di utilizzo della trascrizione, e
`model=default` cancella un override per sessione.

`sessions_yield` termina intenzionalmente il turno corrente in modo che il messaggio successivo possa essere
l'evento di follow-up che stai aspettando. Usalo dopo aver generato sotto-agenti quando
vuoi che i risultati di completamento arrivino come messaggio successivo invece di costruire
loop di polling.

`subagents` è l'helper del control plane per sotto-agenti OpenClaw già generati.
Supporta:

- `action: "list"` per ispezionare esecuzioni attive/recenti
- `action: "steer"` per inviare indicazioni di follow-up a un figlio in esecuzione
- `action: "kill"` per fermare un figlio o `all`

## Generazione di sotto-agenti

`sessions_spawn` crea per impostazione predefinita una sessione isolata per un'attività in background.
È sempre non bloccante -- restituisce immediatamente un `runId` e una
`childSessionKey`.

Opzioni chiave:

- `runtime: "subagent"` (predefinito) oppure `"acp"` per agenti harness esterni.
- Override di `model` e `thinking` per la sessione figlia.
- `thread: true` per vincolare la generazione a un thread di chat (Discord, Slack, ecc.).
- `sandbox: "require"` per imporre il sandboxing al figlio.
- `context: "fork"` per sotto-agenti nativi quando il figlio ha bisogno della trascrizione del
  richiedente corrente; omettilo oppure usa `context: "isolated"` per un figlio pulito.

I sotto-agenti foglia predefiniti non ricevono strumenti di sessione. Quando
`maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondità 1 ricevono inoltre
`sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` così
possono gestire i propri figli. Le esecuzioni foglia continuano a non ricevere strumenti di
orchestrazione ricorsiva.

Dopo il completamento, un passaggio di annuncio pubblica il risultato nel canale del richiedente.
La consegna del completamento preserva l'instradamento vincolato di thread/argomento quando disponibile, e se
l'origine del completamento identifica solo un canale OpenClaw può comunque riutilizzare la route memorizzata
della sessione richiedente (`lastChannel` / `lastTo`) per la consegna
diretta.

Per il comportamento specifico ACP, vedi [ACP Agents](/it/tools/acp-agents).

## Visibilità

Gli strumenti di sessione hanno un ambito limitato per restringere ciò che l'agente può vedere:

| Livello | Ambito |
| ------- | ---------------------------------------- |
| `self` | Solo la sessione corrente |
| `tree` | Sessione corrente + sotto-agenti generati |
| `agent` | Tutte le sessioni per questo agente |
| `all` | Tutte le sessioni (cross-agent se configurato) |

Il valore predefinito è `tree`. Le sessioni sandbox sono limitate a `tree` indipendentemente dalla
configurazione.

## Approfondimenti

- [Gestione delle sessioni](/it/concepts/session) -- instradamento, ciclo di vita, manutenzione
- [ACP Agents](/it/tools/acp-agents) -- generazione harness esterna
- [Multi-agent](/it/concepts/multi-agent) -- architettura multi-agente
- [Gateway Configuration](/it/gateway/configuration) -- opzioni di configurazione degli strumenti di sessione

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
