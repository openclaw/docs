---
read_when:
    - Vuoi capire quali strumenti di sessione ha l'agente
    - Vuoi configurare l'accesso cross-sessione o la creazione di sub-agent
    - Vuoi ispezionare lo stato o controllare i sub-agent generati
summary: Strumenti dell'agente per stato cross-sessione, richiamo, messaggistica e orchestrazione di sub-agent
title: Strumenti di sessione
x-i18n:
    generated_at: "2026-04-05T13:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77fab7cbf9d1a5cccaf316b69fefe212bbf9370876c8b92e988d3175f5545a4d
    source_path: concepts/session-tool.md
    workflow: 15
---

# Strumenti di sessione

OpenClaw fornisce agli agenti strumenti per lavorare tra sessioni, ispezionare lo stato e
orchestrare sub-agent.

## Strumenti disponibili

| Strumento          | Cosa fa                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Elenca le sessioni con filtri facoltativi (tipo, recenza)                  |
| `sessions_history` | Legge la trascrizione di una sessione specifica                            |
| `sessions_send`    | Invia un messaggio a un'altra sessione e facoltativamente attende          |
| `sessions_spawn`   | Genera una sessione di sub-agent isolata per lavoro in background          |
| `sessions_yield`   | Termina il turno corrente e attende i risultati di follow-up dei sub-agent |
| `subagents`        | Elenca, guida o termina i sub-agent generati per questa sessione           |
| `session_status`   | Mostra una scheda in stile `/status` e facoltativamente imposta un override del modello per sessione |

## Elencare e leggere le sessioni

`sessions_list` restituisce le sessioni con la loro chiave, tipo, canale, modello, conteggi
dei token e timestamp. Filtra per tipo (`main`, `group`, `cron`, `hook`,
`node`) o per recenza (`activeMinutes`).

`sessions_history` recupera la trascrizione della conversazione per una sessione specifica.
Per impostazione predefinita, i risultati degli strumenti sono esclusi -- passa `includeTools: true` per visualizzarli.
La vista restituita è intenzionalmente limitata e filtrata per sicurezza:

- il testo dell'assistente viene normalizzato prima del richiamo:
  - i tag di thinking vengono rimossi
  - i blocchi di impalcatura `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi payload XML di tool-call in testo semplice come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi i payload
    troncati che non si chiudono mai correttamente
  - l'impalcatura degradata di tool-call/risultato come `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]` viene rimossa
  - i token di controllo del modello trapelati come `<|assistant|>`, altri token ASCII
    `<|...|>` e le varianti a larghezza piena `<｜...｜>` vengono rimossi
  - l'XML di tool-call MiniMax malformato come `<invoke ...>` /
    `</minimax:tool_call>` viene rimosso
- il testo simile a credenziali/token viene oscurato prima della restituzione
- i blocchi di testo lunghi vengono troncati
- cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga sovradimensionata con
  `[sessions_history omitted: message too large]`
- lo strumento riporta flag di riepilogo come `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` e `bytes`

Entrambi gli strumenti accettano sia una **chiave di sessione** (come `"main"`) sia un **ID sessione**
da una precedente chiamata di elenco.

Se ti serve la trascrizione esatta byte per byte, ispeziona il file della trascrizione su
disco invece di trattare `sessions_history` come un dump grezzo.

## Invio di messaggi cross-sessione

`sessions_send` consegna un messaggio a un'altra sessione e facoltativamente attende
la risposta:

- **Fire-and-forget:** imposta `timeoutSeconds: 0` per accodare e restituire
  immediatamente.
- **Attendi risposta:** imposta un timeout e ottieni la risposta inline.

Dopo che la destinazione risponde, OpenClaw può eseguire un **reply-back loop** in cui gli
agenti alternano i messaggi (fino a 5 turni). L'agente di destinazione può rispondere
`REPLY_SKIP` per interrompere prima.

## Helper di stato e orchestrazione

`session_status` è lo strumento leggero equivalente a `/status` per la sessione corrente
o un'altra sessione visibile. Riporta utilizzo, tempo, stato del modello/runtime e
contesto del task in background collegato quando presente. Come `/status`, può riempire
contatori sparsi di token/cache dalla più recente voce di utilizzo della trascrizione, e
`model=default` cancella un override per sessione.

`sessions_yield` termina intenzionalmente il turno corrente in modo che il messaggio successivo possa essere
l'evento di follow-up che stai aspettando. Usalo dopo aver generato sub-agent quando
vuoi che i risultati di completamento arrivino come messaggio successivo invece di costruire
loop di polling.

`subagents` è l'helper del piano di controllo per i sub-agent OpenClaw già
generati. Supporta:

- `action: "list"` per ispezionare esecuzioni attive/recenti
- `action: "steer"` per inviare indicazioni di follow-up a un child in esecuzione
- `action: "kill"` per fermare un child o `all`

## Generazione di sub-agent

`sessions_spawn` crea una sessione isolata per un task in background. È sempre
non bloccante -- restituisce immediatamente un `runId` e `childSessionKey`.

Opzioni principali:

- `runtime: "subagent"` (predefinito) o `"acp"` per agenti harness esterni.
- override di `model` e `thinking` per la sessione child.
- `thread: true` per collegare la generazione a un thread di chat (Discord, Slack, ecc.).
- `sandbox: "require"` per imporre il sandboxing sul child.

I sub-agent leaf predefiniti non ricevono strumenti di sessione. Quando
`maxSpawnDepth >= 2`, i sub-agent orchestratori di profondità 1 ricevono inoltre
`sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` in modo da
poter gestire i propri child. Le esecuzioni leaf continuano a non ricevere
strumenti di orchestrazione ricorsiva.

Dopo il completamento, un passaggio di annuncio pubblica il risultato sul canale del richiedente.
La consegna del completamento preserva l'instradamento associato del thread/topic quando disponibile, e se
l'origine del completamento identifica solo un canale OpenClaw può comunque riutilizzare la route
archiviata della sessione del richiedente (`lastChannel` / `lastTo`) per la consegna
diretta.

Per il comportamento specifico ACP, vedi [Agenti ACP](/tools/acp-agents).

## Visibilità

Gli strumenti di sessione sono limitati per circoscrivere ciò che l'agente può vedere:

| Livello | Ambito                                   |
| ------- | ---------------------------------------- |
| `self`  | Solo la sessione corrente                |
| `tree`  | Sessione corrente + sub-agent generati   |
| `agent` | Tutte le sessioni di questo agente       |
| `all`   | Tutte le sessioni (cross-agent se configurato) |

Il valore predefinito è `tree`. Le sessioni sandboxed sono limitate a `tree` indipendentemente dalla
configurazione.

## Approfondimenti

- [Gestione delle sessioni](/concepts/session) -- instradamento, ciclo di vita, manutenzione
- [Agenti ACP](/tools/acp-agents) -- generazione di harness esterni
- [Multi-agent](/concepts/multi-agent) -- architettura multi-agent
- [Configurazione del Gateway](/gateway/configuration) -- opzioni di configurazione degli strumenti di sessione
