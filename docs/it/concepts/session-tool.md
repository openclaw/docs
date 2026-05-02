---
read_when:
    - Vuoi capire di quali strumenti di sessione dispone l'agente
    - Vuoi configurare l'accesso tra sessioni o la creazione di sotto-agenti
    - Vuoi esaminare lo stato o controllare i sotto-agenti avviati
summary: Strumenti degli agenti per lo stato tra sessioni, il richiamo, la messaggistica e l'orchestrazione di sotto-agenti
title: Strumenti di sessione
x-i18n:
    generated_at: "2026-05-02T08:21:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb8a3ab7fd1036ccd97940fc9824684d7b27ded0136f6a69416eb144bbfc64be
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw offre agli agenti strumenti per lavorare tra sessioni, ispezionare lo stato e
orchestrare sotto-agenti.

## Strumenti disponibili

| Strumento          | Cosa fa                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Elenca le sessioni con filtri facoltativi (tipo, etichetta, agente, attività recente, anteprima) |
| `sessions_history` | Legge la trascrizione di una sessione specifica                             |
| `sessions_send`    | Invia un messaggio a un'altra sessione e, facoltativamente, attende         |
| `sessions_spawn`   | Genera una sessione di sotto-agente isolata per lavoro in background        |
| `sessions_yield`   | Termina il turno corrente e attende i risultati di follow-up del sotto-agente |
| `subagents`        | Elenca, guida o termina i sotto-agenti generati per questa sessione         |
| `session_status`   | Mostra una scheda in stile `/status` e, facoltativamente, imposta una sostituzione del modello per sessione |

Questi strumenti sono comunque soggetti al profilo strumenti attivo e alla
policy di autorizzazione/negazione. `tools.profile: "coding"` include l'intero set
di orchestrazione delle sessioni, inclusi `sessions_spawn`, `sessions_yield` e
`subagents`. `tools.profile: "messaging"` include gli strumenti di messaggistica
tra sessioni (`sessions_list`, `sessions_history`, `sessions_send`,
`session_status`) ma non include la generazione di sotto-agenti. Per mantenere
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
modello, conteggi dei token e timestamp. Filtra per tipo (`main`, `group`,
`cron`, `hook`, `node`), `label` esatta, `agentId` esatto, testo di ricerca o
attività recente (`activeMinutes`). Quando ti serve una valutazione in stile
casella di posta, può anche richiedere un titolo derivato con ambito di
visibilità, un frammento di anteprima dell'ultimo messaggio o messaggi recenti
limitati per ogni riga. I titoli derivati e le anteprime vengono prodotti solo
per le sessioni che il chiamante può già vedere in base alla policy di visibilità
configurata per gli strumenti di sessione, quindi le sessioni non correlate
rimangono nascoste.

`sessions_history` recupera la trascrizione della conversazione per una sessione
specifica. Per impostazione predefinita, i risultati degli strumenti sono esclusi:
passa `includeTools: true` per vederli. La vista restituita è intenzionalmente
limitata e filtrata per sicurezza:

- il testo dell'assistente viene normalizzato prima del richiamo:
  - i tag di pensiero vengono rimossi
  - i blocchi di impalcatura `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi di payload XML delle chiamate agli strumenti in testo semplice, come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi i payload troncati
    che non si chiudono mai correttamente
  - l'impalcatura declassata di chiamate/risultati degli strumenti, come `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]`, viene rimossa
  - i token di controllo del modello trapelati, come `<|assistant|>`, altri token ASCII
    `<|...|>` e le varianti a larghezza piena `<｜...｜>` vengono rimossi
  - l'XML malformato delle chiamate agli strumenti MiniMax, come `<invoke ...>` /
    `</minimax:tool_call>`, viene rimosso
- il testo simile a credenziali/token viene oscurato prima di essere restituito
- i blocchi di testo lunghi vengono troncati
- le cronologie molto grandi possono eliminare le righe più vecchie o sostituire una riga sovradimensionata con
  `[sessions_history omitted: message too large]`
- lo strumento segnala flag di riepilogo come `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` e `bytes`

Entrambi gli strumenti accettano una **chiave di sessione** (come `"main"`) oppure
un **ID di sessione** da una chiamata di elenco precedente.

Se ti serve la trascrizione esatta byte per byte, ispeziona il file della
trascrizione su disco invece di trattare `sessions_history` come un dump grezzo.

## Inviare messaggi tra sessioni

`sessions_send` consegna un messaggio a un'altra sessione e, facoltativamente,
attende la risposta:

- **Invio senza attesa:** imposta `timeoutSeconds: 0` per accodare e restituire
  immediatamente.
- **Attesa della risposta:** imposta un timeout e ricevi la risposta inline.

Le sessioni di chat con ambito di conversazione, come le chiavi Slack o Discord che terminano in
`:thread:<id>`, non sono destinazioni valide per `sessions_send`. Usa la chiave
della sessione del canale padre per il coordinamento tra agenti, così i messaggi
instradati dagli strumenti non compaiono dentro una conversazione attiva rivolta
a persone.

I messaggi e le risposte di follow-up A2A vengono marcati come dati tra sessioni
nel prompt ricevente (`[Inter-session message ... isUser=false]`) e nella
provenienza della trascrizione. L'agente ricevente dovrebbe trattarli come dati
instradati dagli strumenti, non come un'istruzione scritta direttamente
dall'utente finale.

Dopo la risposta della destinazione, OpenClaw può eseguire un **ciclo di risposta
di ritorno** in cui gli agenti alternano messaggi (fino a 5 turni). L'agente
destinazione può rispondere `REPLY_SKIP` per fermarsi in anticipo.

## Helper di stato e orchestrazione

`session_status` è lo strumento leggero equivalente a `/status` per la sessione
corrente o per un'altra sessione visibile. Riporta utilizzo, ora, stato di
modello/runtime e contesto dei task in background collegati quando presente.
Come `/status`, può integrare i contatori sparsi di token/cache dall'ultima voce
di utilizzo della trascrizione, e `model=default` cancella una sostituzione per
sessione. Usa `sessionKey="current"` per la sessione corrente del chiamante; le
etichette client visibili come `openclaw-tui` non sono chiavi di sessione.

`sessions_yield` termina intenzionalmente il turno corrente così il messaggio
successivo può essere l'evento di follow-up che stai aspettando. Usalo dopo aver
generato sotto-agenti quando vuoi che i risultati di completamento arrivino come
messaggio successivo invece di costruire cicli di polling.

`subagents` è l'helper del piano di controllo per i sotto-agenti OpenClaw già
generati. Supporta:

- `action: "list"` per ispezionare esecuzioni attive/recenti
- `action: "steer"` per inviare indicazioni di follow-up a un figlio in esecuzione
- `action: "kill"` per fermare un figlio oppure `all`

## Generare sotto-agenti

`sessions_spawn` crea per impostazione predefinita una sessione isolata per un
task in background. È sempre non bloccante: restituisce immediatamente un `runId`
e una `childSessionKey`.

Opzioni principali:

- `runtime: "subagent"` (predefinito) oppure `"acp"` per agenti harness esterni.
- Sostituzioni di `model` e `thinking` per la sessione figlia.
- `thread: true` per associare la generazione a una conversazione di chat (Discord, Slack, ecc.).
- `sandbox: "require"` per applicare il sandboxing al figlio.
- `context: "fork"` per sotto-agenti nativi quando il figlio ha bisogno della
  trascrizione corrente del richiedente; omettilo o usa `context: "isolated"` per un figlio pulito.
  I sotto-agenti nativi associati a una conversazione usano per impostazione predefinita
  `context: "fork"` salvo diversa indicazione di `threadBindings.defaultSpawnContext`.

I sotto-agenti foglia predefiniti non ricevono strumenti di sessione. Quando
`maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondità 1 ricevono inoltre
`sessions_spawn`, `subagents`, `sessions_list` e `sessions_history`, così possono
gestire i propri figli. Le esecuzioni foglia continuano a non ricevere strumenti
di orchestrazione ricorsiva.

Dopo il completamento, un passaggio di annuncio pubblica il risultato nel canale
del richiedente. La consegna del completamento conserva l'instradamento legato a
conversazione/argomento quando disponibile, e se l'origine del completamento
identifica solo un canale OpenClaw può comunque riutilizzare la rotta memorizzata
della sessione del richiedente (`lastChannel` / `lastTo`) per la consegna diretta.

Per il comportamento specifico di ACP, consulta [Agenti ACP](/it/tools/acp-agents).

## Visibilità

Gli strumenti di sessione hanno un ambito per limitare ciò che l'agente può vedere:

| Livello | Ambito                                   |
| ------- | ---------------------------------------- |
| `self`  | Solo la sessione corrente                |
| `tree`  | Sessione corrente + sotto-agenti generati |
| `agent` | Tutte le sessioni per questo agente      |
| `all`   | Tutte le sessioni (tra agenti, se configurato) |

Il valore predefinito è `tree`. Le sessioni in sandbox vengono limitate a `tree`
indipendentemente dalla configurazione.

## Ulteriori letture

- [Gestione delle sessioni](/it/concepts/session) -- instradamento, ciclo di vita, manutenzione
- [Agenti ACP](/it/tools/acp-agents) -- generazione di harness esterni
- [Multi-agente](/it/concepts/multi-agent) -- architettura multi-agente
- [Configurazione del Gateway](/it/gateway/configuration) -- parametri di configurazione degli strumenti di sessione

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
