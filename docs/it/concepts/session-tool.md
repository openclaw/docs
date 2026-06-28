---
read_when:
    - Vuoi capire quali strumenti di sessione ha l'agente
    - Vuoi configurare l'accesso tra sessioni o la generazione di sub-agent
    - Vuoi ispezionare lo stato dei sub-agent generati
summary: Strumenti per agenti per stato tra sessioni, richiamo, messaggistica e orchestrazione di sotto-agenti
title: Strumenti di sessione
x-i18n:
    generated_at: "2026-06-28T00:12:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffc7edf68e4510ea6a5fe93238be32e9d7eacf8e7b49e58f63536c14bbe2da80
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw fornisce agli agenti strumenti per lavorare tra sessioni, ispezionare lo stato e
orchestrare sotto-agenti.

## Strumenti disponibili

| Strumento          | Cosa fa                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Elenca le sessioni con filtri opzionali (tipo, etichetta, agente, recenza, anteprima) |
| `sessions_history` | Legge la trascrizione di una sessione specifica                             |
| `sessions_send`    | Invia un messaggio a un'altra sessione e, facoltativamente, attende         |
| `sessions_spawn`   | Avvia una sessione di sotto-agente isolata per lavoro in background         |
| `sessions_yield`   | Termina il turno corrente e attende i risultati successivi dei sotto-agenti |
| `subagents`        | Elenca lo stato dei sotto-agenti avviati per questa sessione                |
| `session_status`   | Mostra una scheda in stile `/status` e, facoltativamente, imposta un override del modello per sessione |

Questi strumenti restano soggetti al profilo strumenti attivo e alla policy
di autorizzazione/blocco. `tools.profile: "coding"` include l'intero set di
orchestrazione delle sessioni, inclusi `sessions_spawn`, `sessions_yield` e
`subagents`. `tools.profile: "messaging"` include gli strumenti di messaggistica
tra sessioni (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) ma
non include l'avvio di sotto-agenti. Per mantenere un profilo di messaggistica e
consentire comunque la delega nativa, aggiungi:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Le policy di gruppo, provider, sandbox e per agente possono ancora rimuovere
questi strumenti dopo la fase del profilo. Usa `/tools` dalla sessione interessata
per ispezionare l'elenco effettivo degli strumenti.

## Elencare e leggere le sessioni

`sessions_list` restituisce le sessioni con key, agentId, tipo, canale, modello,
conteggi dei token e timestamp. Filtra per tipo (`main`, `group`, `cron`, `hook`,
`node`), `label` esatta, `agentId` esatto, testo di ricerca o recenza
(`activeMinutes`). Quando serve una triage in stile casella di posta, può anche
richiedere un titolo derivato con ambito di visibilità, uno snippet di anteprima
dell'ultimo messaggio o messaggi recenti limitati per ogni riga. I titoli derivati
e le anteprime vengono prodotti solo per le sessioni che il chiamante può già
vedere secondo la policy di visibilità configurata per gli strumenti di sessione,
quindi le sessioni non correlate restano nascoste. Quando la visibilità è limitata,
`sessions_list` restituisce metadati `visibility` opzionali che mostrano la modalità
effettiva e un avviso che i risultati potrebbero essere limitati nell'ambito.

`sessions_history` recupera la trascrizione della conversazione per una sessione
specifica. Per impostazione predefinita, i risultati degli strumenti sono esclusi -- passa
`includeTools: true` per vederli. Usa `limit` per la coda più recente limitata.
Passa `offset: 0` quando ti servono metadati di paginazione, poi passa i valori
`nextOffset` restituiti per scorrere all'indietro tra finestre di trascrizione
OpenClaw più vecchie senza leggere file di trascrizione grezzi. Le pagine con offset
esplicito non uniscono importazioni di fallback CLI esterne; usa la vista predefinita
della coda più recente quando ti serve quella cronologia di visualizzazione unita.
La vista restituita è intenzionalmente limitata e filtrata per sicurezza:

- il testo dell'assistente viene normalizzato prima del richiamo:
  - i tag di ragionamento vengono rimossi
  - i blocchi di scaffolding `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi di payload XML di chiamate agli strumenti in testo semplice come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi i payload troncati
    che non si chiudono correttamente
  - lo scaffolding declassato di chiamate/risultati degli strumenti come `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]` viene rimosso
  - i token di controllo del modello trapelati come `<|assistant|>`, altri token ASCII
    `<|...|>` e varianti a larghezza piena `<｜...｜>` vengono rimossi
  - XML di chiamate agli strumenti MiniMax malformato come `<invoke ...>` /
    `</minimax:tool_call>` viene rimosso
- il testo simile a credenziali/token viene oscurato prima di essere restituito
- i blocchi di testo lunghi vengono troncati
- cronologie molto grandi possono scartare righe più vecchie o sostituire una riga sovradimensionata con
  `[sessions_history omitted: message too large]`
- lo strumento segnala flag di riepilogo come `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes` e metadati di paginazione

Entrambi gli strumenti accettano una **key di sessione** (come `"main"`) oppure un **ID sessione**
da una chiamata di elenco precedente.

Se ti serve la trascrizione esatta byte per byte, ispeziona il file di trascrizione su
disco invece di trattare `sessions_history` come un dump grezzo.

## Invio di messaggi tra sessioni

`sessions_send` consegna un messaggio a un'altra sessione e, facoltativamente, attende
la risposta:

- **Invia senza attendere:** imposta `timeoutSeconds: 0` per accodare e restituire
  immediatamente.
- **Attendi risposta:** imposta un timeout e ottieni la risposta inline.

Le sessioni chat con ambito di thread, come key Slack o Discord che terminano con
`:thread:<id>`, non sono target validi per `sessions_send`. Usa la key della sessione
del canale padre per il coordinamento tra agenti, così i messaggi instradati dagli
strumenti non appaiono dentro un thread attivo rivolto a persone.

I messaggi e le risposte successive A2A sono contrassegnati come dati tra sessioni nel
prompt ricevente (`[Inter-session message ... isUser=false]`) e nella provenienza della
trascrizione. L'agente ricevente dovrebbe trattarli come dati instradati da strumenti,
non come un'istruzione diretta scritta dall'utente finale.

Dopo la risposta del target, OpenClaw può eseguire un **ciclo di risposta di ritorno** in cui gli
agenti alternano messaggi (fino a `session.agentToAgent.maxPingPongTurns`, intervallo
0-20, predefinito 5). L'agente target può rispondere
`REPLY_SKIP` per interrompere prima.

## Helper di stato e orchestrazione

`session_status` è lo strumento leggero equivalente a `/status` per la sessione corrente
o per un'altra sessione visibile. Riporta utilizzo, tempo, stato di modello/runtime e
contesto dei task in background collegati quando presente. Come `/status`, può ricostruire
contatori token/cache sparsi dall'ultima voce di utilizzo nella trascrizione, e
`model=default` cancella un override del modello per sessione. Usa `sessionKey="current"` per
la sessione corrente del chiamante; etichette client visibili come `openclaw-tui` non sono
key di sessione.

Quando i metadati di route sono disponibili, `session_status` include anche un blocco JSON
visibile `Route context` e campi `details` strutturati corrispondenti. Questi campi
disambiguano la key di sessione dalla route che sta attualmente gestendo l'esecuzione live:

- `origin` è dove la sessione è stata creata, oppure il provider dedotto da un
  prefisso di key di sessione consegnabile quando uno stato più vecchio non ha metadati di origine salvati.
- `active` è la route live-run corrente. Viene riportata solo per la sessione live o
  corrente che viene gestita ora.
- `deliveryContext` è la route di consegna persistita salvata nella sessione,
  che OpenClaw può riutilizzare per consegne successive anche quando la superficie attiva
  è diversa.

`sessions_yield` termina intenzionalmente il turno corrente così il messaggio successivo possa essere
l'evento di follow-up che stai aspettando. Usalo dopo aver avviato sotto-agenti quando
vuoi che i risultati di completamento arrivino come messaggio successivo invece di costruire
cicli di polling.

`subagents` è l'helper di visibilità per sotto-agenti OpenClaw già avviati.
Supporta `action: "list"` per ispezionare esecuzioni attive/recenti.

## Avvio di sotto-agenti

`sessions_spawn` crea per impostazione predefinita una sessione isolata per un task in background.
È sempre non bloccante -- restituisce immediatamente un `runId` e
`childSessionKey`. Le esecuzioni di sotto-agenti nativi ricevono il task delegato nel
primo messaggio visibile `[Subagent Task]` della sessione figlia, mentre il prompt di sistema
contiene solo regole di runtime del sotto-agente e contesto di routing.

Opzioni principali:

- `runtime: "subagent"` (predefinito) o `"acp"` per agenti harness esterni.
- Override `model` e `thinking` per la sessione figlia.
- `thread: true` per collegare l'avvio a un thread chat (Discord, Slack, ecc.).
- `sandbox: "require"` per imporre il sandboxing sul figlio.
- `context: "fork"` per sotto-agenti nativi quando il figlio ha bisogno della trascrizione
  corrente del richiedente; omettilo o usa `context: "isolated"` per un figlio pulito.
  I sotto-agenti nativi legati a thread usano come predefinito `context: "fork"` salvo che
  `threadBindings.defaultSpawnContext` indichi diversamente.

I sotto-agenti foglia predefiniti non ricevono strumenti di sessione. Quando
`maxSpawnDepth >= 2`, i sotto-agenti orchestratori a profondità 1 ricevono inoltre
`sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` così possono
gestire i propri figli. Le esecuzioni foglia continuano a non ricevere strumenti
di orchestrazione ricorsiva.

Dopo il completamento, un passaggio di annuncio pubblica il risultato sul canale del richiedente.
La consegna del completamento preserva il routing di thread/topic associato quando disponibile, e se
l'origine del completamento identifica solo un canale OpenClaw può comunque riutilizzare la
route salvata nella sessione del richiedente (`lastChannel` / `lastTo`) per la consegna
diretta.

Per il comportamento specifico di ACP, vedi [Agenti ACP](/it/tools/acp-agents).

## Visibilità

Gli strumenti di sessione hanno un ambito per limitare ciò che l'agente può vedere:

| Livello | Ambito                                   |
| ------- | ---------------------------------------- |
| `self`  | Solo la sessione corrente                |
| `tree`  | Sessione corrente + sotto-agenti avviati |
| `agent` | Tutte le sessioni per questo agente      |
| `all`   | Tutte le sessioni (tra agenti se configurato) |

Il valore predefinito è `tree`. Le sessioni in sandbox sono limitate a `tree` indipendentemente dalla
configurazione.

## Ulteriori letture

- [Gestione delle sessioni](/it/concepts/session) -- routing, ciclo di vita, manutenzione
- [Agenti ACP](/it/tools/acp-agents) -- avvio di harness esterni
- [Multi-agent](/it/concepts/multi-agent) -- architettura multi-agent
- [Configurazione Gateway](/it/gateway/configuration) -- opzioni di configurazione degli strumenti di sessione

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Eliminazione delle sessioni](/it/concepts/session-pruning)
