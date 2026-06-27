---
read_when:
    - Vuoi capire quali strumenti di sessione ha l'agente
    - Vuoi configurare l'accesso tra sessioni o la generazione di sub-agent
    - Vuoi controllare lo stato del sub-agent generato
summary: Strumenti agente per stato tra sessioni, richiamo, messaggistica e orchestrazione dei sub-agenti
title: Strumenti di sessione
x-i18n:
    generated_at: "2026-06-27T17:27:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 382f5d63062a03c410e3f7cc88281a35bf428ff74a58144543e49b3cd4eb5c8b
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw offre agli agenti strumenti per lavorare tra sessioni, ispezionare lo stato e
orchestrare sotto-agenti.

## Strumenti disponibili

| Strumento          | Cosa fa                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Elenca le sessioni con filtri opzionali (tipo, etichetta, agente, recency, anteprima) |
| `sessions_history` | Legge la trascrizione di una sessione specifica                             |
| `sessions_send`    | Invia un messaggio a un'altra sessione e facoltativamente attende           |
| `sessions_spawn`   | Genera una sessione di sotto-agente isolata per lavoro in background        |
| `sessions_yield`   | Termina il turno corrente e attende i risultati di follow-up dei sotto-agenti |
| `subagents`        | Elenca lo stato dei sotto-agenti generati per questa sessione               |
| `session_status`   | Mostra una scheda in stile `/status` e facoltativamente imposta un override del modello per sessione |

Questi strumenti restano soggetti al profilo strumenti attivo e alla policy
allow/deny. `tools.profile: "coding"` include l'intero set di orchestrazione
delle sessioni, inclusi `sessions_spawn`, `sessions_yield` e `subagents`.
`tools.profile: "messaging"` include gli strumenti di messaggistica tra sessioni
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) ma
non include la generazione di sotto-agenti. Per mantenere un profilo di messaggistica e
consentire comunque la delega nativa, aggiungi:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Le policy di gruppo, provider, sandbox e per agente possono comunque rimuovere quegli strumenti
dopo la fase del profilo. Usa `/tools` dalla sessione interessata per ispezionare
l'elenco effettivo degli strumenti.

## Elencare e leggere le sessioni

`sessions_list` restituisce le sessioni con key, agentId, tipo, canale, modello,
conteggi dei token e timestamp. Filtra per tipo (`main`, `group`, `cron`, `hook`,
`node`), `label` esatta, `agentId` esatto, testo di ricerca o recency
(`activeMinutes`). Quando serve un triage in stile mailbox, può anche richiedere un
titolo derivato con visibilità limitata all'ambito, uno snippet di anteprima dell'ultimo messaggio o messaggi recenti
limitati per ogni riga. I titoli derivati e le anteprime vengono prodotti solo per le sessioni
che il chiamante può già vedere in base alla policy configurata di visibilità degli strumenti di sessione, quindi
le sessioni non correlate restano nascoste. Quando la visibilità è limitata, `sessions_list`
restituisce metadati opzionali `visibility` che mostrano la modalità effettiva e un avviso che
i risultati possono essere limitati all'ambito.

`sessions_history` recupera la trascrizione della conversazione per una sessione specifica.
Per impostazione predefinita, i risultati degli strumenti sono esclusi: passa `includeTools: true` per vederli.
La vista restituita è intenzionalmente limitata e filtrata per sicurezza:

- il testo dell'assistente viene normalizzato prima del richiamo:
  - i tag di ragionamento vengono rimossi
  - i blocchi di scaffolding `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi di payload XML delle chiamate strumento in testo semplice, come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi i payload troncati
    che non si chiudono mai correttamente
  - lo scaffolding declassato di chiamate/risultati strumento, come `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]`, viene rimosso
  - i token di controllo del modello trapelati, come `<|assistant|>`, altri token ASCII
    `<|...|>` e le varianti full-width `<｜...｜>` vengono rimossi
  - XML di chiamate strumento MiniMax malformato, come `<invoke ...>` /
    `</minimax:tool_call>`, viene rimosso
- il testo simile a credenziali/token viene oscurato prima di essere restituito
- i blocchi di testo lunghi vengono troncati
- le cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga sovradimensionata con
  `[sessions_history omitted: message too large]`
- lo strumento riporta flag di riepilogo come `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` e `bytes`

Entrambi gli strumenti accettano una **session key** (come `"main"`) o un **ID sessione**
da una precedente chiamata di elenco.

Se ti serve la trascrizione esatta byte per byte, ispeziona il file di trascrizione su
disco invece di trattare `sessions_history` come un dump grezzo.

## Inviare messaggi tra sessioni

`sessions_send` consegna un messaggio a un'altra sessione e facoltativamente attende
la risposta:

- **Invia e dimentica:** imposta `timeoutSeconds: 0` per accodare e restituire
  immediatamente.
- **Attendi risposta:** imposta un timeout e ricevi la risposta inline.

Le sessioni di chat con ambito di thread, come chiavi Slack o Discord che terminano con
`:thread:<id>`, non sono target validi per `sessions_send`. Usa la chiave della sessione del canale padre
per il coordinamento tra agenti, in modo che i messaggi instradati dagli strumenti non appaiano
dentro un thread attivo rivolto a esseri umani.

I messaggi e le risposte di follow-up A2A sono contrassegnati come dati tra sessioni nel
prompt ricevente (`[Inter-session message ... isUser=false]`) e nella provenienza della trascrizione.
L'agente ricevente deve trattarli come dati instradati da strumenti, non come
un'istruzione diretta scritta dall'utente finale.

Dopo che il target risponde, OpenClaw può eseguire un **ciclo di risposta** in cui gli
agenti alternano i messaggi (fino a `session.agentToAgent.maxPingPongTurns`, intervallo
0-20, predefinito 5). L'agente target può rispondere
`REPLY_SKIP` per interrompere in anticipo.

## Helper di stato e orchestrazione

`session_status` è lo strumento leggero equivalente a `/status` per la sessione corrente
o un'altra sessione visibile. Riporta utilizzo, ora, stato del modello/runtime e
contesto collegato di attività in background quando presente. Come `/status`, può ricostruire
contatori token/cache sparsi dall'ultima voce di utilizzo della trascrizione, e
`model=default` cancella un override per sessione. Usa `sessionKey="current"` per
la sessione corrente del chiamante; etichette client visibili come `openclaw-tui` non sono
session key.

Quando i metadati di route sono disponibili, `session_status` include anche un blocco JSON
`Route context` visibile e campi strutturati `details` corrispondenti. Questi
campi disambiguano la session key dalla route che sta gestendo attualmente
l'esecuzione live:

- `origin` è il punto in cui la sessione è stata creata, oppure il provider inferito da un
  prefisso di session-key consegnabile quando lo stato più vecchio non ha metadati di origine memorizzati.
- `active` è la route dell'esecuzione live corrente. Viene riportata solo per la sessione live o
  corrente gestita ora.
- `deliveryContext` è la route di consegna persistita salvata nella sessione,
  che OpenClaw può riutilizzare per consegne successive anche quando la superficie attiva
  è diversa.

`sessions_yield` termina intenzionalmente il turno corrente, così il messaggio successivo può essere
l'evento di follow-up che stai aspettando. Usalo dopo aver generato sotto-agenti quando
vuoi che i risultati di completamento arrivino come messaggio successivo invece di costruire
cicli di polling.

`subagents` è l'helper di visibilità per i sotto-agenti OpenClaw già generati.
Supporta `action: "list"` per ispezionare esecuzioni attive/recenti.

## Generare sotto-agenti

`sessions_spawn` crea per impostazione predefinita una sessione isolata per un'attività in background.
È sempre non bloccante: restituisce immediatamente un `runId` e
`childSessionKey`. Le esecuzioni native dei sotto-agenti ricevono l'attività delegata nel
primo messaggio visibile `[Subagent Task]` della sessione figlia, mentre il prompt di sistema
contiene solo le regole di runtime del sotto-agente e il contesto di routing.

Opzioni principali:

- `runtime: "subagent"` (predefinito) o `"acp"` per agenti harness esterni.
- override `model` e `thinking` per la sessione figlia.
- `thread: true` per vincolare la generazione a un thread di chat (Discord, Slack, ecc.).
- `sandbox: "require"` per imporre il sandboxing sul figlio.
- `context: "fork"` per sotto-agenti nativi quando il figlio ha bisogno della trascrizione del richiedente
  corrente; omettilo o usa `context: "isolated"` per un figlio pulito.
  I sotto-agenti nativi vincolati a thread usano per impostazione predefinita `context: "fork"` salvo diversa indicazione di
  `threadBindings.defaultSpawnContext`.

I sotto-agenti foglia predefiniti non ricevono strumenti di sessione. Quando
`maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondità 1 ricevono inoltre
`sessions_spawn`, `subagents`, `sessions_list` e `sessions_history`, così
possono gestire i propri figli. Le esecuzioni foglia continuano a non ricevere strumenti di
orchestrazione ricorsiva.

Dopo il completamento, un passaggio di annuncio pubblica il risultato nel canale del richiedente.
La consegna del completamento preserva il routing del thread/topic associato quando disponibile, e se
l'origine del completamento identifica solo un canale OpenClaw può comunque riutilizzare la
route memorizzata della sessione del richiedente (`lastChannel` / `lastTo`) per la consegna
diretta.

Per il comportamento specifico di ACP, consulta [Agenti ACP](/it/tools/acp-agents).

## Visibilità

Gli strumenti di sessione sono limitati per ridurre ciò che l'agente può vedere:

| Livello | Ambito                                   |
| ------- | ---------------------------------------- |
| `self`  | Solo la sessione corrente                |
| `tree`  | Sessione corrente + sotto-agenti generati |
| `agent` | Tutte le sessioni per questo agente      |
| `all`   | Tutte le sessioni (tra agenti se configurato) |

Il valore predefinito è `tree`. Le sessioni in sandbox sono limitate a `tree` indipendentemente dalla
configurazione.

## Approfondimenti

- [Gestione delle sessioni](/it/concepts/session) -- routing, ciclo di vita, manutenzione
- [Agenti ACP](/it/tools/acp-agents) -- generazione di harness esterni
- [Multi-agente](/it/concepts/multi-agent) -- architettura multi-agente
- [Configurazione del Gateway](/it/gateway/configuration) -- opzioni di configurazione degli strumenti di sessione

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
