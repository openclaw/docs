---
read_when:
    - Vuoi capire di quali strumenti di sessione dispone l'agente
    - Vuoi configurare l'accesso tra sessioni o la creazione di sottoagenti
    - Vuoi ispezionare lo stato o controllare i sub-agenti generati
summary: Strumenti per agenti per stato tra sessioni, richiamo, messaggistica e orchestrazione dei sotto-agenti
title: Strumenti di sessione
x-i18n:
    generated_at: "2026-04-30T08:48:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0464116d42e271da12cbe90529e06e9f51605981be85b54bb5850ee9b8fb7824
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw fornisce agli agenti strumenti per lavorare tra sessioni, ispezionare lo stato e
orchestrare sotto-agenti.

## Strumenti disponibili

| Strumento          | Cosa fa                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Elenca le sessioni con filtri opzionali (tipo, etichetta, agente, attualità, anteprima) |
| `sessions_history` | Legge la trascrizione di una sessione specifica                             |
| `sessions_send`    | Invia un messaggio a un'altra sessione e, opzionalmente, attende            |
| `sessions_spawn`   | Avvia una sessione di sotto-agente isolata per lavoro in background         |
| `sessions_yield`   | Termina il turno corrente e attende i risultati successivi del sotto-agente |
| `subagents`        | Elenca, indirizza o termina i sotto-agenti avviati per questa sessione      |
| `session_status`   | Mostra una scheda in stile `/status` e, opzionalmente, imposta un override del modello per sessione |

Questi strumenti sono comunque soggetti al profilo strumenti attivo e alla
policy di allow/deny. `tools.profile: "coding"` include l'intero set di
orchestrazione delle sessioni, inclusi `sessions_spawn`, `sessions_yield` e
`subagents`. `tools.profile: "messaging"` include gli strumenti di messaggistica
tra sessioni (`sessions_list`, `sessions_history`, `sessions_send`,
`session_status`) ma non include l'avvio di sotto-agenti. Per mantenere un
profilo di messaggistica e consentire comunque la delega nativa, aggiungi:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Le policy di gruppo, provider, sandbox e per agente possono comunque rimuovere
questi strumenti dopo la fase del profilo. Usa `/tools` dalla sessione
interessata per ispezionare l'elenco effettivo degli strumenti.

## Elencare e leggere le sessioni

`sessions_list` restituisce le sessioni con chiave, agentId, tipo, canale,
modello, conteggi dei token e timestamp. Filtra per tipo (`main`, `group`,
`cron`, `hook`, `node`), `label` esatta, `agentId` esatto, testo di ricerca o
attualità (`activeMinutes`). Quando serve un triage in stile casella di posta,
può anche richiedere un titolo derivato con ambito di visibilità, uno snippet di
anteprima dell'ultimo messaggio o messaggi recenti limitati per ogni riga. I
titoli derivati e le anteprime vengono prodotti solo per le sessioni che il
chiamante può già vedere in base alla policy di visibilità configurata per gli
strumenti di sessione, quindi le sessioni non correlate restano nascoste.

`sessions_history` recupera la trascrizione della conversazione per una sessione
specifica. Per impostazione predefinita, i risultati degli strumenti sono
esclusi: passa `includeTools: true` per visualizzarli. La vista restituita è
intenzionalmente limitata e filtrata per sicurezza:

- il testo dell'assistente viene normalizzato prima del richiamo:
  - i tag di ragionamento vengono rimossi
  - i blocchi di scaffolding `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi payload XML di chiamata strumento in testo semplice, come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>`, vengono rimossi, inclusi i payload
    troncati che non si chiudono correttamente
  - lo scaffolding declassato di chiamata/risultato strumento, come `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]`, viene rimosso
  - i token di controllo del modello trapelati, come `<|assistant|>`, altri token
    ASCII `<|...|>` e le varianti a larghezza piena `<｜...｜>`, vengono rimossi
  - l'XML MiniMax di chiamata strumento malformato, come `<invoke ...>` /
    `</minimax:tool_call>`, viene rimosso
- il testo simile a credenziali/token viene oscurato prima di essere restituito
- i blocchi di testo lunghi vengono troncati
- le cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga troppo grande con
  `[sessions_history omitted: message too large]`
- lo strumento riporta flag di riepilogo come `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` e `bytes`

Entrambi gli strumenti accettano una **chiave di sessione** (come `"main"`) o un
**ID sessione** da una chiamata di elenco precedente.

Se ti serve la trascrizione esatta byte per byte, ispeziona il file di
trascrizione su disco invece di trattare `sessions_history` come un dump grezzo.

## Inviare messaggi tra sessioni

`sessions_send` consegna un messaggio a un'altra sessione e, opzionalmente,
attende la risposta:

- **Invia e non attendere:** imposta `timeoutSeconds: 0` per mettere in coda e restituire
  immediatamente.
- **Attendi la risposta:** imposta un timeout e ricevi la risposta inline.

I messaggi e le risposte successive A2A sono contrassegnati come dati
inter-sessione nel prompt ricevente (`[Inter-session message ... isUser=false]`)
e nella provenienza della trascrizione. L'agente ricevente dovrebbe trattarli
come dati instradati tramite strumento, non come un'istruzione diretta scritta
dall'utente finale.

Dopo che il destinatario risponde, OpenClaw può eseguire un **ciclo di risposta
di ritorno** in cui gli agenti alternano i messaggi (fino a 5 turni). L'agente
destinatario può rispondere `REPLY_SKIP` per interrompere in anticipo.

## Helper di stato e orchestrazione

`session_status` è lo strumento leggero equivalente a `/status` per la sessione
corrente o per un'altra sessione visibile. Riporta utilizzo, ora, stato del
modello/runtime e contesto delle attività in background collegate quando
presente. Come `/status`, può ricostruire contatori sparsi di token/cache
dall'ultima voce di utilizzo della trascrizione, e `model=default` cancella un
override del modello per sessione. Usa `sessionKey="current"` per la sessione
corrente del chiamante; le etichette client visibili come `openclaw-tui` non
sono chiavi di sessione.

`sessions_yield` termina intenzionalmente il turno corrente in modo che il
messaggio successivo possa essere l'evento di follow-up che stai aspettando.
Usalo dopo aver avviato sotto-agenti quando vuoi che i risultati di completamento
arrivino come messaggio successivo invece di costruire cicli di polling.

`subagents` è l'helper del piano di controllo per i sotto-agenti OpenClaw già
avviati. Supporta:

- `action: "list"` per ispezionare esecuzioni attive/recenti
- `action: "steer"` per inviare indicazioni successive a un figlio in esecuzione
- `action: "kill"` per interrompere un figlio o `all`

## Avviare sotto-agenti

`sessions_spawn` crea per impostazione predefinita una sessione isolata per
un'attività in background. È sempre non bloccante: restituisce immediatamente un
`runId` e una `childSessionKey`.

Opzioni principali:

- `runtime: "subagent"` (predefinito) o `"acp"` per agenti harness esterni.
- Override di `model` e `thinking` per la sessione figlia.
- `thread: true` per associare l'avvio a un thread di chat (Discord, Slack, ecc.).
- `sandbox: "require"` per imporre il sandboxing al figlio.
- `context: "fork"` per sotto-agenti nativi quando il figlio ha bisogno della
  trascrizione corrente del richiedente; omettilo o usa `context: "isolated"` per un figlio pulito.

I sotto-agenti foglia predefiniti non ricevono strumenti di sessione. Quando
`maxSpawnDepth >= 2`, i sotto-agenti orchestratori di profondità 1 ricevono in
più `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history`, così
possono gestire i propri figli. Le esecuzioni foglia continuano a non ricevere
strumenti di orchestrazione ricorsivi.

Dopo il completamento, un passaggio di annuncio pubblica il risultato sul canale
del richiedente. La consegna del completamento preserva il routing associato a
thread/topic quando disponibile, e se l'origine del completamento identifica
solo un canale, OpenClaw può comunque riutilizzare la route memorizzata della
sessione del richiedente (`lastChannel` / `lastTo`) per la consegna diretta.

Per il comportamento specifico di ACP, consulta [Agenti ACP](/it/tools/acp-agents).

## Visibilità

Gli strumenti di sessione hanno un ambito per limitare ciò che l'agente può
vedere:

| Livello | Ambito                                   |
| ------- | ---------------------------------------- |
| `self`  | Solo la sessione corrente                |
| `tree`  | Sessione corrente + sotto-agenti avviati |
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
- [Pulizia delle sessioni](/it/concepts/session-pruning)
