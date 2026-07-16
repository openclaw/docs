---
read_when:
    - È necessario poter determinare chi ha eseguito un agente o uno strumento, quando è stato eseguito e come si è concluso
    - Sono necessari metadati del ciclo di vita dei messaggi in entrata o in uscita privi di contenuto
    - È necessaria un’esportazione delle attività limitata e sicura per l’oscuramento dei dati sensibili
summary: Riferimento CLI per i record di audit del ciclo di vita di esecuzioni, strumenti e messaggi contenenti solo metadati
title: Registri di controllo
x-i18n:
    generated_at: "2026-07-16T14:05:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

Interroga il registro di audit del Gateway contenente solo metadati per le esecuzioni degli agenti, le azioni degli strumenti e i record facoltativi del ciclo di vita dei messaggi.

Il registro è attivo per impostazione predefinita per gli eventi di esecuzione e degli strumenti. Impostare
[`audit.enabled: false`](/it/gateway/configuration-reference#audit) e riavviare il
Gateway per interrompere la registrazione di tutti i nuovi eventi. I record dei messaggi sono invece disabilitati per
impostazione predefinita; impostare `audit.messages` su `direct` o `all` e riavviare il Gateway per
registrarli. I record esistenti restano interrogabili fino alla scadenza (30 giorni).

Il registro è separato dalle trascrizioni delle conversazioni: registra identità,
ordinamento, provenienza, azione, stato e codici di esito normalizzati, ma non
memorizza mai il contenuto, e gli identificatori dei messaggi appaiono solo come
pseudonimi con chiave locali all'installazione. La [cronologia di audit](/gateway/audit) definisce il modello dati completo,
la semantica della privacy, i limiti di archiviazione/conservazione e i limiti di copertura; questa pagina
descrive l'interfaccia dei comandi.

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## Filtri

- `--agent <id>`: ID agente esatto
- `--session <key>`: chiave di sessione esatta
- `--run <id>`: ID esecuzione esatto
- `--kind <kind>`: `agent_run`, `tool_action` o `message`
- `--status <status>`: `started`, `succeeded`, `failed`, `cancelled`,
  `timed_out`, `blocked` o `unknown`
- `--direction <direction>`: direzione del messaggio, `inbound` o `outbound`
- `--channel <channel>`: canale esatto del messaggio
- `--after <timestamp>` / `--before <timestamp>`: timestamp ISO inclusivo o
  millisecondi Unix
- `--limit <count>`: dimensione della pagina da 1 a 500; valore predefinito `100`
- `--cursor <sequence>`: continua una precedente query ordinata dal più recente
- `--json`: stampa in formato JSON la pagina con dimensione limitata

La CLI interroga l'RPC delle attività con versione, così un singolo comando mostra l'intero
registro configurato. L'output testuale mostra ora, tipo, direzione, canale, stato,
agente, esecuzione e azione. La provenienza mancante dei messaggi viene visualizzata come `-`; OpenClaw
non inventa ID di agenti o esecuzioni. Le azioni degli strumenti mostrano anche il nome dello strumento. L'output
JSON include `nextCursor` quando esiste un'altra pagina. Passare tale valore a
`--cursor` per continuare senza riordinare i record che arrivano durante la paginazione.

Queste esportazioni restano metadati operativi sensibili anche se i corpi dei messaggi
e i campi di identità non elaborati dei messaggi sono assenti. Gli ID di agente, sessione ed esecuzione, le tempistiche,
i canali, gli esiti e i riferimenti HMAC stabili possono consentire di correlare le attività. Proteggerli
con gli stessi controlli di accesso e le stesse pratiche di conservazione applicati agli altri
record degli operatori.

## Eventi registrati

Il Gateway proietta i flussi attendibili del ciclo di vita in sei azioni:

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

Ogni record restituito contiene un ID evento stabile, una sequenza del registro
crescente in modo monotono, un timestamp del ciclo di vita, un attore, un'azione, uno stato, un
indicatore `schemaVersion: 1`, una sequenza di origine e `redaction: "metadata_only"`.
La provenienza di agente/sessione/esecuzione e i campi specifici dell'evento sono presenti solo quando
forniti dalla fonte attendibile. I record dei messaggi omettono intenzionalmente
`sessionKey` e `sessionId`, pertanto i filtri `--session` si applicano solo ai record di esecuzione e degli strumenti.

I record terminali di esecuzione e degli strumenti distinguono operazioni riuscite, errori, annullamenti,
timeout e blocchi dei criteri mediante stati e codici di errore chiusi. `unknown` è un
risultato esplicito non riuscito quando un runtime a monte non espone un
esito terminale autorevole. Gli ID delle chiamate agli strumenti vengono esportati solo come
impronte stabili. I nomi degli strumenti devono rispettare il contratto dei nomi compatti
destinati al modello; gli altri valori diventano `unknown`.

I record dei messaggi aggiungono direzione, canale, tipo di conversazione, esito e
facoltativamente tipo di consegna, fase dell'errore, durata, numero di risultati, codice
del motivo normalizzato e pseudonimi con chiave per account/conversazione/messaggio/destinazione. L'attuale
confine in ingresso copre i messaggi accettati che raggiungono l'inoltro principale,
inclusi gli esiti principali di elaborazione dei duplicati e terminali. Il confine in uscita
scrive una riga terminale per ogni payload di risposta logico originale che raggiunge
la consegna durevole condivisa; la suddivisione in blocchi e il fan-out dell'adattatore vengono aggregati in
`resultCount`. Gli invii accodati ripetibili o ambigui vengono registrati solo dopo che una
conferma, una dead letter o una riconciliazione rende l'esito terminale.
I percorsi locali al Plugin e di invio diretto che ignorano questi confini condivisi non sono
ancora coperti; l'assenza di una riga non dimostra che non sia esistito alcun messaggio.

Il registro di audit non sostituisce le trascrizioni, la cronologia delle attività, la cronologia delle esecuzioni Cron
o i log. Fornisce un piccolo indice trasversale alle esecuzioni per le richieste degli operatori senza
copiare il contenuto delle conversazioni in un altro archivio.

Per le righe in ingresso, `durationMs` misura l'inoltro principale e `resultCount` conteggia
i payload finalizzati e accodati di strumenti, blocchi e risposte. Per le righe in uscita,
`durationMs` include la proprietà della consegna fino al relativo stato terminale (e quindi
il tempo di attesa in coda), mentre `resultCount` conteggia gli invii fisici identificati sulla piattaforma.
`deliveryKind`, quando presente, descrive il payload effettivo successivo agli hook e
al rendering; le righe soppresse e quelle ambigue a causa di arresti anomali lo omettono.

## RPC del Gateway

`audit.activity.list` richiede `operator.read` e accetta gli stessi filtri.
Restituisce l'unione denominata degli eventi di attività V1, inclusi i record di esecuzione, degli strumenti, dei messaggi
in ingresso e dei messaggi in uscita.

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

Il risultato è `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.
I risultati sono ordinati dal più recente e limitati a 500 record per richiesta.

L'RPC `audit.list` distribuito resta invariato per i client di esecuzione/strumenti meno recenti. Quando
`audit.activity.list` non è disponibile su un Gateway meno recente, la CLI riprova
`audit.list` solo se ogni filtro richiesto è supportato da tale metodo legacy. `--kind message`,
`--direction` e `--channel` generano un messaggio di aggiornamento su un Gateway meno recente
anziché essere ignorati silenziosamente.

## Correlati

- [Cronologia di audit](/gateway/audit)
- [Protocollo del Gateway](/it/gateway/protocol#audit-ledger-rpc)
- [Sessioni](/it/cli/sessions)
- [Attività](/it/cli/tasks)
- [Processi Cron](/it/automation/cron-jobs)
