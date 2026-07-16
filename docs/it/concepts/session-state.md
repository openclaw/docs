---
read_when:
    - Si desidera che gli agenti rilevino quando persone o altri agenti modificano una sessione a loro insaputa
    - Si stanno eseguendo il debug delle notifiche di modifica dello stato, dei cursori di osservazione o di session_status changesSince
    - Si desidera comprendere come gli agenti principali rimangono sincronizzati con le sessioni figlie
sidebarTitle: Session state awareness
summary: 'Registro persistente dei segnali dello stato della sessione: versioni dello stato, osservatori, notifiche di stato obsoleto e riconciliazione'
title: Consapevolezza dello stato della sessione
x-i18n:
    generated_at: "2026-07-16T14:17:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb4126a0802e1ca4418f225c792490493a78886089b81c3b4567f72090ce34f4
    source_path: concepts/session-state.md
    workflow: 16
---

Quando più sessioni lavorano sullo stesso problema — un responsabile che delega ai figli, una persona che interviene direttamente in una sessione di lavoro, due agenti che si coordinano tramite [`sessions_send`](/it/concepts/session-tool) — ogni sessione formula ipotesi sulle altre. Tali ipotesi diventano obsolete nel momento in cui interviene un altro attore. La consapevolezza dello stato delle sessioni è il meccanismo che rileva l'intervento, avvisa una sola volta la sessione interessata e le offre un modo economico per aggiornarsi prima di agire.

Tre elementi operano insieme:

1. Un **registro persistente dei segnali** registra determinate modifiche di stato per ogni sessione.
2. Gli **osservatori** mantengono cursori per ogni destinazione e ricevono un'unica notifica aggregata di stato obsoleto.
3. La **riconciliazione** recupera il delta esatto tramite `session_status` con `changesSince`.

## Il registro dei segnali

OpenClaw aggiunge un evento tipizzato al database di stato condiviso (`session_state_events`) quando una sessione osservata subisce una modifica sostanziale. Gli eventi contengono metadati e un riepilogo di una riga, mai il contenuto dei messaggi.

| Tipo                   | Registrato quando                                            | Notifica gli osservatori |
| ---------------------- | -------------------------------------------------------- | ----------------- |
| `human_direct_message` | Una persona invia un turno direttamente a una sessione osservata       | Sì               |
| `upstream_missing`     | La sorgente upstream di una sessione adottata scompare          | Sì               |
| `goal_changed`         | Lo stato dell'obiettivo della sessione viene creato, aggiornato o cancellato | Sì               |
| `child_spawned`        | Viene creata una sessione figlia di un sottoagente o ACP              | No (inizializza il cursore) |
| `run_completed`        | Un'esecuzione figlia termina correttamente                            | No (solo registro)     |
| `run_failed`           | Un'esecuzione figlia non riesce, scade o viene annullata            | No (solo registro)     |
| `compacted`            | La cronologia della sessione viene compattata                       | No (solo registro)     |
| `adopted`              | Una sessione del catalogo viene adottata in OpenClaw               | No (solo registro)     |

Ogni evento identifica il proprio attore (`human`, `agent` o `system`). Le esecuzioni figlie annullate e scadute vengono registrate come errori, mantenendo nel payload dell'evento l'esito preciso (`cancelled`, `timeout` o `error`).

La **versione dello stato** di una sessione è semplicemente il numero di sequenza più alto nel relativo registro, monitorato in un'intestazione persistente per sessione che sopravvive alla rimozione dei dati. Le righe `sessions_list` includono `stateVersion` quando una sessione ha registrato modifiche; `session_status` lo indica sempre.

I tipi destinati al solo registro esistono per la cronologia di riconciliazione, non per le notifiche: la normale consegna del completamento delle esecuzioni figlie rimane di competenza degli [annunci dei sottoagenti](/it/tools/subagents) e il registro dei segnali non la duplica mai.

## Osservatori

Un osservatore è una sessione che mantiene un cursore (`session_watch_cursors`) su una destinazione. I cursori provengono da due fonti:

- **Impliciti (collegamenti di generazione).** Quando una sessione genera un sottoagente o un figlio ACP, il cursore del genitore viene inizializzato automaticamente alla versione di generazione del figlio. I genitori non si iscrivono mai manualmente.
- **Espliciti (`sessions_send watch: true`).** Qualsiasi coordinatore può osservare una destinazione non generata: passare `watch: true` a `sessions_send` e, dopo l'invio riuscito, il mittente viene registrato come osservatore della sessione che ha effettivamente ricevuto il messaggio. La registrazione inizia dalla versione corrente dello stato della destinazione: la cronologia precedente non genera mai notifiche. Il risultato dello strumento indica `watched: true|false` quando il parametro è stato impostato.

L'identità dell'osservatore deve essere una chiave di sessione qualificata con l'agente. Con `session.scope="global"`, la chiave condivisa `global` è ambigua tra agenti, pertanto tali sessioni ricevono il registro persistente e `changesSince`, ma non notifiche proattive.

Le osservazioni si ripuliscono autonomamente: le righe dei cursori scadono insieme alla conservazione del registro dei segnali, vengono rimosse quando la sessione dell'osservatore viene reimpostata e vengono eliminate insieme a una delle due sessioni. Nella versione v1 non esiste un'operazione per interrompere l'osservazione.

Le sessioni osservate adottate da un catalogo delle sessioni vengono controllate a intervalli fissi per rilevare attività umana diretta nella sorgente upstream. L'attività rilevata confluisce nello stesso registro dei segnali e nello stesso flusso degli osservatori degli altri turni umani diretti.

Se la sorgente upstream di una sessione adottata viene eliminata esternamente, tre controlli consecutivi senza esito (circa tre cicli di monitoraggio) generano un unico segnale `upstream_missing` per i suoi osservatori e rimuovono il collegamento upstream. Riprendendo nuovamente la sessione dal catalogo viene creato un nuovo collegamento.

## Notifiche: una, non molte

Quando viene registrato un evento idoneo alla notifica e il cursore di un osservatore è arretrato, l'osservatore riceve una sola notifica di sistema al turno successivo:

```
La sessione "agent:main:subagent:child" è cambiata (altro attore). Eseguire la riconciliazione prima di agire: session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Gli osservatori della sessione principale vengono inoltre riattivati immediatamente tramite una riattivazione Heartbeat; gli osservatori dei sottoagenti annidati ricevono la notifica al turno successivo.

Il protocollo è deliberatamente progettato per evitare lo spam:

- **Una notifica in sospeso per ogni coppia osservatore/destinazione.** Il testo della notifica rimane identico a livello di byte finché è in sospeso e la coda degli eventi di sistema lo deduplica, quindi venti modifiche rapide alla stessa destinazione producono comunque una sola riga nel prompt dell'osservatore.
- **Limite congelato.** Il cursore congela la posizione notificata quando una notifica viene accodata. Gli ulteriori eventi sostanziali fanno avanzare soltanto il limite sostanziale; non generano altre notifiche.
- **Conferma al prelievo, riapertura solo in caso di attività interposta.** Quando il turno dell'osservatore acquisisce la notifica, il cursore avanza. Se sono arrivati altri eventi sostanziali tra l'accodamento e l'acquisizione, viene aperta esattamente una nuova notifica per gli eventi rimanenti.
- **Autosoppressione.** Un osservatore non riceve mai notifiche relative agli eventi che ha causato.
- **Ripristino dopo il riavvio.** Le notifiche in sospeso risiedono in una coda in memoria; dopo il riavvio del Gateway, una scansione all'avvio le ricrea a partire dai cursori persistenti.

## Riconciliazione

La notifica indica esattamente all'osservatore cosa fare. `session_status` con `changesSince: <version>` restituisce gli eventi tipizzati successivi a tale versione (fino a 200), senza far avanzare alcun cursore:

```json
{
  "stateVersion": 19,
  "stateChanges": {
    "events": [
      {
        "sequence": 14,
        "kind": "human_direct_message",
        "actorType": "human",
        "summary": "messaggio umano tramite telegram"
      },
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "obiettivo aggiornato" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true` indica che la versione richiesta precede la cronologia conservata: aggiornare l'intero stato della sessione (`sessions_history`, `session_status`) anziché considerare la risposta come un delta esatto. Il segnale di lacuna è esatto: deriva da un limite di rimozione per sessione, non da un'inferenza basata sull'aritmetica delle sequenze.

## Archiviazione e limiti

La cronologia risiede nel database di stato condiviso, con un limite di 30 giorni e 50.000 righe; le intestazioni per sessione rimangono monotone dopo la rimozione dei dati. La registrazione avviene secondo il principio del massimo impegno: un'aggiunta non riuscita viene registrata nei log e non causa mai il fallimento del turno di origine; pertanto `stateVersion` è l'intestazione di un registro dei segnali, non una versione transazionale di acquisizione delle modifiche ai dati.

Limiti attuali:

- La consegna delle notifiche presuppone che un solo processo Gateway possieda il database di stato condiviso. Più Gateway condividono il registro persistente e `changesSince`, ma la versione v1 non trasmette notifiche tra processi.
- Gli eventi di Compaction coprono i componenti responsabili della Compaction nel runtime incorporato; la Compaction eseguita esclusivamente dall'harness nativo non viene registrata completamente.
- I dettagli del payload per gli esiti annullati vengono attualmente prodotti dalle esecuzioni figlie ACP; gli annullamenti dei sottoagenti nativi vengono indicati come errori generici.
- Il rilevamento dell'eco upstream confronta il testo normalizzato dell'utente. Un prompt esterno corrispondente a uno dei 10 messaggi utente più recenti della sessione sul lato OpenClaw viene considerato un'eco interna.
- Una singola riga JSONL locale di Claude più grande del limite di scansione di 1 MiB per intervallo blocca il cursore di tale sessione nella versione v1; i byte non classificati non vengono mai ignorati.
- I controlli Claude sui nodi associati classificano gli ultimi 50 elementi della trascrizione per intervallo. Raffiche più grandi possono non rientrare nella finestra di scansione della versione v1.
- Le letture della cronologia Claude sui nodi associati non espongono un risultato definitivo di thread non trovato, quindi nella versione v1 le eliminazioni remote di Claude non vengono classificate come `upstream_missing`.
- Le sessioni del catalogo che non sono state adottate rimangono al di fuori del livello di consapevolezza nella versione v1.
- Le sessioni adottate prima di questa funzionalità non dispongono di alcun collegamento upstream; riprenderle una volta dal catalogo per avviare il monitoraggio upstream.
- I collegamenti upstream presuppongono che ogni chiave di sessione adottata corrisponda a un unico agente proprietario (l'adozione utilizza l'agente predefinito dell'archivio). L'adozione multiagente dello stesso thread esterno non viene monitorata nella versione v1.

## Argomenti correlati

- [Strumenti per le sessioni](/it/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Sottoagenti](/it/tools/subagents) — collegamenti di generazione e annunci di completamento
- [Heartbeat](/it/gateway/heartbeat) — come le notifiche accodate riattivano le sessioni principali
- [Gestione delle sessioni](/it/concepts/session) — chiavi, ambiti e ciclo di vita delle sessioni
