---
read_when:
    - Vuoi una bacheca di lavoro in stile Kanban nell'interfaccia di controllo
    - Stai abilitando o disabilitando il plugin Workboard incluso nel pacchetto
    - Vuoi tenere traccia del lavoro pianificato dell'agente senza un gestore di progetti esterno
summary: Bacheca di lavoro opzionale per schede gestite dagli agenti e passaggio di consegne tra sessioni
title: Plugin Workboard
x-i18n:
    generated_at: "2026-07-12T07:23:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Il plugin Workboard aggiunge una bacheca opzionale in stile Kanban alla
[UI di controllo](/it/web/control-ui): schede di lavoro dimensionate per gli agenti, assegnazione agli agenti
e un collegamento all'attività, all'esecuzione e alla sessione della dashboard della scheda.

Workboard è intenzionalmente semplice: tiene traccia del lavoro operativo locale per un singolo
Gateway OpenClaw. Non sostituisce GitHub Issues, Linear, Jira o
altri sistemi di gestione dei progetti di gruppo.

## Abilitazione

Workboard è incluso, ma disabilitato per impostazione predefinita:

1. Apri **Plugin** nell'UI di controllo oppure usa `/settings/plugins` in relazione al
   percorso di base configurato dell'UI di controllo. Ad esempio, un percorso di base `/openclaw`
   usa `/openclaw/settings/plugins`.
2. Trova **Workboard** e scegli **Abilita**. Poiché Workboard è incluso in
   OpenClaw, non richiede un'azione **Installa**.
3. Se l'UI segnala che è necessario un riavvio, riavvia il Gateway.

La scheda Workboard appare nella navigazione della dashboard dopo il caricamento del runtime del plugin.
Quando è disabilitato, la scheda rimane nascosta nella navigazione. Se si apre
direttamente il percorso `/workboard` mentre il plugin è disabilitato o bloccato da
`plugins.allow`/`plugins.deny`, viene mostrato uno stato di plugin non disponibile anziché i dati
delle schede.

Il flusso di lavoro CLI equivalente è:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configurazione

Workboard non dispone di una configurazione specifica del plugin. Abilitalo o disabilitalo con la voce
standard del plugin:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Campi delle schede

| Campo       | Valori                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | string in formato libero                                                                                      |
| `agentId`   | agente assegnato facoltativo                                                                                  |
| riferimenti collegati | attività, esecuzione, sessione o URL di origine facoltativi                                          |
| `execution` | metadati facoltativi per un'esecuzione Codex/Claude avviata dalla scheda (motore, modalità, modello, sessione, ID esecuzione, stato) |

Le schede includono anche metadati compatti relativi a tentativi, commenti, collegamenti, prove,
artefatti, impostazioni di automazione, allegati, log dei worker, stato del protocollo
dei worker, rivendicazioni, diagnostica, notifiche, ID del modello, stato di archiviazione e
rilevamento delle sessioni obsolete, oltre a un elenco degli eventi recenti (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Questi metadati consentono a un
operatore di vedere come una scheda si è spostata nella bacheca senza aprire la sessione
collegata; costituiscono un contesto operativo locale, non sostituiscono le trascrizioni
delle sessioni né la cronologia delle issue di GitHub.

Le schede vengono archiviate nello stato Gateway proprio del plugin e si spostano insieme al resto dello
stato OpenClaw di tale Gateway (vedi [Archiviazione](#storage)).

## Avvio del lavoro da una scheda

Le schede non collegate possono avviare direttamente il lavoro:

- **Esegui Codex** / **Esegui Claude** avvia un'esecuzione dell'agente associata a un'attività con un
  motore esplicito, invia il prompt della scheda e contrassegna la scheda come `running`. Le esecuzioni Codex
  usano `openai/gpt-5.6-sol`; le esecuzioni Claude usano `anthropic/claude-sonnet-4-6`.
- **Apri Codex** / **Apri Claude** crea una sessione della dashboard collegata senza
  inviare il prompt della scheda né spostare la scheda, per il lavoro manuale che rimane
  associato alla bacheca.

Gli avvii autonomi usano il percorso del Gateway per le esecuzioni degli agenti associate alle attività (agente
e modello predefiniti, salvo selezione esplicita di Codex/Claude); Workboard collega quindi
alla scheda l'attività risultante, l'ID dell'esecuzione e la chiave della sessione. Ogni
esecuzione collegata registra inoltre un riepilogo del tentativo (motore, modalità, modello, ID esecuzione,
marche temporali, stato, conteggio progressivo degli errori), affinché gli errori ripetuti rimangano visibili.

La dashboard aggiorna lo stato delle attività dal registro delle attività del Gateway, associando
le attività alle schede tramite ID attività, ID esecuzione o chiave della sessione collegata. Un'attività in coda o in esecuzione
mantiene attivo il ciclo di vita della scheda; un'attività completata, non riuscita, scaduta o
annullata sposta la scheda verso `review` o `blocked` usando la stessa regola di sincronizzazione
delle sessioni collegate (vedi [Sincronizzazione del ciclo di vita della sessione](#session-lifecycle-sync)).

## Strumenti degli agenti

| Strumento                                                                                                                                        | Scopo                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Elenca schede compatte con stato di assegnazione/diagnostica; filtro facoltativo per bacheca.                                                                                             |
| `workboard_read`                                                                                                                                 | Restituisce una scheda con il contesto limitato del worker (note, tentativi, commenti, collegamenti, prove, artefatti, risultati principali, attività recente dell'assegnatario, diagnostica attiva). |
| `workboard_create`                                                                                                                               | Crea una scheda con elementi principali, tenant, Skills, bacheca, metadati dell'area di lavoro, chiave di idempotenza, limite di esecuzione e budget di nuovi tentativi facoltativi.       |
| `workboard_link`                                                                                                                                 | Collega una scheda principale a una secondaria. Le schede secondarie restano `todo` finché tutte le principali non raggiungono `done`; la promozione tramite dispatch le porta quindi a `ready`. |
| `workboard_claim`                                                                                                                                | Assegna una scheda all'agente chiamante; sposta `backlog`/`todo`/`ready` in `running`.                                                                                                    |
| `workboard_heartbeat`                                                                                                                            | Aggiorna l'Heartbeat dell'assegnazione durante un'esecuzione più lunga.                                                                                                                    |
| `workboard_release`                                                                                                                              | Rilascia l'assegnazione dopo il completamento, una pausa o un passaggio di consegne; può spostare la scheda a uno stato successivo.                                                       |
| `workboard_complete` / `workboard_block`                                                                                                         | Strumenti strutturati per il ciclo di vita, destinati a riepiloghi finali, prove, artefatti e manifest delle schede create (che devono fare riferimento a schede ricollegate a quella completata) oppure ai motivi del blocco. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Archivia piccoli allegati delle schede nello stato SQLite del Plugin, li indicizza nella scheda e li espone nel contesto del worker.                                                      |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Registra le righe del log del worker e blocca una scheda quando un worker automatizzato si arresta senza chiamare `workboard_complete`/`workboard_block`.                                 |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Gestisce i metadati persistenti della bacheca (nome visualizzato, descrizione, stato di archiviazione, area di lavoro predefinita).                                                       |
| `workboard_runs`                                                                                                                                 | Restituisce la cronologia persistente dei tentativi di esecuzione di una scheda.                                                                                                          |
| `workboard_specify`                                                                                                                              | Trasforma una scheda approssimativa di triage/backlog in una scheda `todo` chiarita; registra nella scheda il riepilogo delle specifiche.                                                |
| `workboard_decompose`                                                                                                                            | Suddivide una scheda principale di orchestrazione in schede secondarie collegate, ereditando i metadati di bacheca/tenant; può completare la principale con un manifest delle schede create. |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Gestisce le sottoscrizioni alle notifiche. La lettura degli eventi è sicura in caso di riproduzione; `advance` sposta il cursore persistente, consentendo ai chiamanti di riprendere senza perdere o leggere due volte gli eventi delle schede completate/non riuscite/scadute. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Esamina gli spazi dei nomi delle bacheche e le statistiche delle code.                                                                                                                    |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Recupera o passa ad altri il lavoro bloccato.                                                                                                                                             |
| `workboard_comment` / `workboard_proof`                                                                                                          | Aggiunge note per il passaggio di consegne o allega riferimenti a prove/artefatti.                                                                                                        |
| `workboard_unblock`                                                                                                                              | Riporta il lavoro bloccato a `todo`.                                                                                                                                                      |
| `workboard_dispatch`                                                                                                                             | Sollecita la promozione delle dipendenze o la pulizia delle assegnazioni scadute.                                                                                                         |

Le schede assegnate rifiutano le modifiche tramite strumenti agente provenienti da altri agenti, a meno che il chiamante
non possieda il token di assegnazione restituito da `workboard_claim`. Ogni scheda restituita da uno
strumento agente o da una chiamata RPC del Gateway oscura `metadata.claim.token` come `[redacted]`
(il token stesso viene restituito una sola volta, al livello principale, esclusivamente da `workboard_claim`),
così gli operatori della dashboard e gli altri agenti possono esaminare lo stato dell'assegnazione senza mai
vedere un token utilizzabile. Il ripristino avviene tramite
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, che non
richiedono il token.

## Dispatch

Il dispatch è locale al Gateway: non genera processi arbitrari del sistema operativo. Le normali
sessioni dei sottoagenti OpenClaw continuano a gestire l'esecuzione. Un ciclo di dispatch:

1. Promuove le schede le cui dipendenze sono pronte.
2. Registra i metadati del dispatch sulle schede pronte.
3. Blocca le assegnazioni scadute o le esecuzioni che hanno superato il tempo limite.
4. Contrassegna le schede di triage configurate nella bacheca come candidate all'orchestrazione.
5. Assegna un piccolo gruppo di schede pronte e avvia le esecuzioni dei worker tramite il
   runtime dei sottoagenti del Gateway.

I worker ricevono un contesto limitato della scheda e il token di assegnazione necessario per inviare l'Heartbeat,
completare o bloccare la scheda tramite gli strumenti Workboard.

### Selezione dei worker

Ogni ciclo avvia **al massimo 3 worker per impostazione predefinita**. Le schede pronte sono ordinate per
priorità, quindi per posizione e infine per data di creazione. Un ciclo avvia una sola scheda per ciascun
proprietario/agente e ignora i proprietari che hanno già lavori in esecuzione o in revisione nella
bacheca. Le schede archiviate, quelle con un'assegnazione attiva e quelle il cui stato non è `ready`
non vengono mai selezionate per l'avvio dei worker (possono comunque essere interessate dal
lato dati del dispatch: pulizia delle assegnazioni scadute, promozione delle dipendenze, pulizia
per superamento del tempo limite).

Le chiavi di sessione sono deterministiche per bacheca/scheda, quindi dispatch ripetuti vengono instradati
alla stessa corsia del worker anziché creare sessioni non correlate:

- Schede assegnate: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Schede non assegnate: `subagent:workboard-<boardId>-<cardId>` (il Gateway risolve
  l'agente predefinito configurato)

Se non è possibile avviare un worker dopo l'assegnazione di una scheda, Workboard blocca la
scheda, cancella l'assegnazione, registra l'errore di avvio dell'esecuzione e aggiunge una riga al log del
worker, visibile nella dashboard, nel JSON della CLI, negli strumenti agente e nella
diagnostica della scheda.

### Punti di ingresso

- Azione di dispatch della dashboard
- `openclaw workboard dispatch`
- `/workboard dispatch` su un canale che supporta i comandi

Tutti e tre utilizzano il runtime dei sottoagenti del Gateway quando il Gateway è disponibile. La
CLI dispone di un'unica alternativa per l'operatore: se la chiamata al Gateway non riesce a causa di un errore di
connessione/non disponibilità (o di un errore `unknown method` per Gateway meno recenti),
non è stata specificata una destinazione esplicita `--url`/`--token` e non si applica alcun Gateway remoto
configurato (`OPENCLAW_GATEWAY_URL` o `gateway.mode: remote`), la CLI esegue
un dispatch dei soli dati sullo stato SQLite locale: può promuovere le dipendenze,
pulire le assegnazioni scadute e bloccare le esecuzioni che hanno superato il tempo limite, ma non può avviare worker. Gli errori di autenticazione,
autorizzazione e convalida provenienti da un Gateway raggiungibile non vengono considerati
indisponibilità: vengono segnalati come errori del comando, come avviene per qualsiasi errore del Gateway
quando è stata specificata una destinazione esplicita `--url`/`--token`.

I metadati della bacheca possono impostare `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` e `orchestratorProfile`. OpenClaw registra questa intenzione e
la espone nel contesto del worker; la definizione delle specifiche e la scomposizione effettive continuano comunque a essere eseguite
tramite i normali strumenti Workboard.

## CLI e comando slash

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

L'output testuale di `list` nasconde per impostazione predefinita le schede archiviate (`--include-archived`
sovrascrive questo comportamento); `--json` include sempre le schede archiviate, in conformità con il contratto delle schede complete
utilizzato dagli script esistenti. `show` accetta un prefisso ID non ambiguo.
`list`, `create` e `show` leggono/scrivono sempre direttamente lo stato locale del Plugin.
Solo `dispatch` chiama il Gateway in esecuzione, con il comportamento alternativo descritto sopra.

Consultare [CLI Workboard](/it/cli/workboard) per l'elenco completo dei flag, l'output JSON, il comportamento
alternativo del Gateway, la gestione dei prefissi ID, le regole di selezione del dispatch e la
risoluzione dei problemi.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`
e `/workboard dispatch` rispecchiano la CLI. Elenco e visualizzazione sono operazioni di lettura
disponibili a qualsiasi mittente autorizzato a inviare comandi. La creazione e il dispatch richiedono lo stato di proprietario nelle
superfici di chat oppure un client Gateway con `operator.write`/`operator.admin`.

## Sincronizzazione del ciclo di vita della sessione

Le schede possono essere collegate a una sessione della dashboard esistente oppure a una creata quando si avvia il lavoro dalla scheda. Le schede collegate mostrano inline il ciclo di vita della sessione: in esecuzione, obsoleta, collegata ma inattiva, completata, non riuscita o mancante. È inoltre possibile acquisire una sessione esistente dalla scheda Sessioni tramite **Aggiungi a Workboard**; la scheda viene collegata a tale sessione, utilizza come titolo l'etichetta della sessione o il prompt recente dell'utente e, quando disponibili, inizializza le note con il prompt recente dell'utente e l'ultima risposta dell'assistente.

Se la sessione collegata risulta mancante, la scheda rimane collegata per conservare il contesto e continua a offrire i controlli di avvio per ripartire in una nuova sessione. Se una sessione collegata attiva smette di segnalare attività recente, Workboard contrassegna la scheda come `stale` e memorizza tale stato nei metadati finché il ciclo di vita non lo rimuove.

Quando una scheda si trova in uno stato di lavoro attivo, Workboard segue la sessione collegata:

| Stato della sessione collegata               | Stato della scheda |
| -------------------------------------------- | ------------------ |
| attiva                                       | `running`          |
| completata                                   | `review`           |
| non riuscita, terminata, scaduta o interrotta | `blocked`          |

**Gli stati di revisione manuale hanno la precedenza.** Lo spostamento di una scheda in `review`, `blocked` o `done` interrompe la sincronizzazione automatica per tale scheda finché non viene riportata in `todo` o `running`.

L'avvio di una scheda utilizza le normali sessioni del Gateway; Workboard memorizza solo i metadati e i collegamenti della scheda. La trascrizione della conversazione, la selezione del modello e il ciclo di vita dell'esecuzione rimangono gestiti dal normale sistema delle sessioni. Utilizzare **Interrompi** su una scheda collegata attiva per interrompere l'esecuzione in corso: Workboard contrassegna la scheda come `blocked`, in modo che rimanga visibile per le attività successive.

Le nuove schede possono essere create a partire dai modelli di Workboard (`bugfix`, `docs`, `release`, `pr_review`, `plugin`). I modelli precompilano titolo, note, etichette e priorità; l'ID del modello viene memorizzato nei metadati della scheda.

## Flusso di lavoro della dashboard

1. Aprire la scheda Workboard nell'interfaccia di controllo.
2. Creare una scheda con titolo, note, priorità, etichette, agente facoltativo e sessione collegata facoltativa, oppure aprire Sessioni e scegliere **Aggiungi a Workboard** per una sessione esistente.
3. Trascinare la scheda tra le colonne oppure portare lo stato compatto in primo piano e utilizzare il menu o ArrowLeft/ArrowRight.
4. Avviare il lavoro dalla scheda per creare o riutilizzare una sessione della dashboard.
5. Aprire dalla scheda la sessione collegata mentre l'agente lavora.
6. Lasciare che la sincronizzazione del ciclo di vita sposti il lavoro in esecuzione in `review`/`blocked`, quindi spostare manualmente la scheda in `done` quando viene accettata.

## Diagnostica

La diagnostica viene calcolata dai metadati locali delle schede. I controlli integrati segnalano:

| Tipo                        | Condizione                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `stranded_ready`            | Scheda assegnata in `todo`/`backlog`/`ready` non aggiornata da oltre 1 ora.                                   |
| `running_without_heartbeat` | Scheda in `running` senza Heartbeat della rivendicazione o aggiornamenti dell'esecuzione da oltre 20 minuti.  |
| `blocked_too_long`          | Scheda in `blocked` non aggiornata da oltre 24 ore.                                                           |
| `repeated_failures`         | Il conteggio degli errori registrati della scheda raggiunge almeno 2.                                         |
| `missing_proof`             | Scheda in `done` senza prove, artefatti o allegati.                                                           |
| `orphaned_session`          | Scheda in `running` con una `sessionKey` ma senza metadati `execution`.                                       |

## Autorizzazioni

I metodi RPC del Gateway si trovano nello spazio dei nomi `workboard.*`:

| Ambito           | Metodi                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, elenco/recupero degli allegati, lettura degli eventi di notifica, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                     |
| `operator.write` | `cards.diagnostics.refresh`, creazione/aggiornamento/spostamento/eliminazione/commento/collegamento/collegamento di dipendenze/prova/artefatto, aggiunta/eliminazione di allegati, log del worker, violazione del protocollo, rivendicazione/Heartbeat/rilascio/promozione/riassegnazione/nuova rivendicazione/completamento/blocco/sblocco, `cards.dispatch`, `cards.bulk`, archiviazione, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, sottoscrizione/eliminazione/avanzamento delle notifiche |

Nessun metodo RPC richiede `operator.admin`. I browser connessi con accesso operatore di sola lettura possono esaminare la bacheca, ma non possono modificare le schede.

## Archiviazione

Workboard memorizza i dati persistenti in un database relazionale SQLite di proprietà del Plugin nella directory di stato di OpenClaw: bacheche, schede, etichette, eventi del ciclo di vita, tentativi di esecuzione, commenti, collegamenti di dipendenza, prove, riferimenti agli artefatti, metadati e blob degli allegati, diagnostica, notifiche, log dei worker, stato del protocollo e sottoscrizioni risiedono tutti nelle tabelle di Workboard, non nelle voci chiave-valore del Plugin. L'esportazione di una scheda conserva la descrizione della bacheca senza incorporare i contenuti binari degli allegati.

Le installazioni che utilizzavano Workboard nella versione `.28` possono eseguire `openclaw doctor --fix` per migrare nel database relazionale gli spazi dei nomi dello stato legacy del Plugin distribuiti (`workboard.cards`, `workboard.boards`, `workboard.notify` e, se presente, `workboard.attachments`).

## Risoluzione dei problemi

**La scheda indica che Workboard non è disponibile**

```bash
openclaw plugins inspect workboard --runtime --json
```

Se `plugins.allow` è configurato, aggiungervi `workboard`. Se `plugins.deny` contiene `workboard`, rimuoverlo prima di abilitare il Plugin.

**Le schede non vengono salvate**

Verificare che la connessione del browser disponga dell'accesso `operator.write`. Le sessioni operatore di sola lettura possono elencare le schede, ma non possono crearle, modificarle, spostarle o eliminarle.

**L'avvio di una scheda non apre la sessione prevista**

Controllare l'ID dell'agente e la sessione collegata della scheda, quindi aprire Sessioni o Chat per esaminare lo stato effettivo dell'esecuzione.

**L'invio non avvia un worker**

Verificare che sia presente almeno una scheda `ready` senza una rivendicazione attiva:

```bash
openclaw workboard list --status ready
```

Se la CLI segnala un invio limitato ai dati, avviare o riavviare il Gateway e riprovare: l'invio limitato ai dati aggiorna lo stato locale della bacheca, ma non può avviare le esecuzioni dei worker degli agenti secondari. Le schede possono inoltre essere ignorate quando un'altra scheda dello stesso proprietario o agente è già in esecuzione o in attesa di revisione; completare, bloccare o rilasciare il lavoro attivo prima di inviarne altro per lo stesso proprietario.

## Argomenti correlati

- [Interfaccia di controllo](/it/web/control-ui)
- [CLI di Workboard](/it/cli/workboard)
- [Plugin](/it/tools/plugin)
- [Gestire i Plugin](/it/plugins/manage-plugins)
- [Sessioni](/it/concepts/session)
