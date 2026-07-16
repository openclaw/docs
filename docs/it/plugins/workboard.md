---
read_when:
    - Si desidera una bacheca di lavoro in stile Kanban nell'interfaccia di controllo
    - Si sta abilitando o disabilitando il plugin Workboard incluso nel pacchetto
    - Si desidera tenere traccia del lavoro pianificato degli agenti senza un sistema esterno di gestione dei progetti
summary: Bacheca di lavoro opzionale per schede gestite dagli agenti e passaggio di consegne tra sessioni
title: Plugin Workboard
x-i18n:
    generated_at: "2026-07-16T14:49:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

Il plugin Workboard aggiunge una bacheca opzionale in stile Kanban alla
[UI di controllo](/it/web/control-ui): schede di lavoro dimensionate per gli agenti, assegnazione agli agenti
e un collegamento alle attività, alle esecuzioni e alle sessioni della dashboard associate alla scheda.

Workboard è volutamente essenziale: tiene traccia del lavoro operativo locale per un
Gateway OpenClaw. Non sostituisce GitHub Issues, Linear, Jira o
altri sistemi di gestione dei progetti di gruppo.

## Abilitazione

Workboard è incluso, ma disabilitato per impostazione predefinita:

1. Aprire **Plugin** nell'UI di controllo oppure usare `/settings/plugins` in relazione al
   percorso di base configurato per l'UI di controllo. Ad esempio, un percorso di base `/openclaw`
   usa `/openclaw/settings/plugins`.
2. Individuare **Workboard** e scegliere **Abilita**. Poiché Workboard è incluso in
   OpenClaw, non richiede un'azione **Installa**.
3. Se l'UI segnala che è necessario un riavvio, riavviare il Gateway.

La scheda Workboard appare nella barra di navigazione della dashboard dopo il caricamento del runtime del plugin.
Finché è disabilitata, la scheda rimane nascosta nella navigazione. Aprendo direttamente la
rotta `/workboard` mentre il plugin è disabilitato o bloccato da
`plugins.allow`/`plugins.deny`, viene mostrato uno stato di plugin non disponibile anziché i dati
delle schede.

Il flusso di lavoro CLI equivalente è:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configurazione

Workboard non dispone di una configurazione specifica del plugin. È possibile abilitarlo o disabilitarlo con la voce
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
| `labels`    | string in formato libero                                                                                             |
| `agentId`   | agente assegnato facoltativo                                                                                       |
| riferimenti collegati | attività, esecuzione, sessione o URL di origine facoltativi                                                                    |
| `execution` | metadati facoltativi per un'esecuzione Codex/Claude avviata dalla scheda (motore, modalità, modello, sessione, id esecuzione, stato) |

Le schede contengono inoltre metadati compatti relativi a tentativi, commenti, collegamenti, prove,
artefatti, impostazioni di automazione, allegati, log dei worker, stato del protocollo
dei worker, rivendicazioni, diagnostica, notifiche, id modello, stato di archiviazione e
rilevamento delle sessioni obsolete, oltre a un elenco degli eventi recenti (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Questi metadati consentono a un
operatore di vedere come una scheda si è spostata nella bacheca senza aprire la sessione
collegata; costituiscono un contesto operativo locale, non sostituiscono le trascrizioni
delle sessioni o la cronologia delle issue GitHub.

Il plugin e l'UI di controllo utilizzano un unico contratto per le schede Workboard. Gli aggiornamenti della dashboard
mantengono quindi la provenienza e l'autorità dell'area di lavoro, lo stato delle rivendicazioni, le azioni
diagnostiche e i numeri di sequenza delle notifiche, anziché proiettare una copia ridotta
della scheda destinata esclusivamente all'UI. I tipi di diagnostica, i livelli di gravità diagnostica e
i tipi di notifica sconosciuti vengono ignorati finché entrambe le superfici non li supportano; non vengono mai
riscritti in un altro stato valido.

La dashboard aperta si aggiorna in base alle invalidazioni `plugin.workboard.changed`. Ogni
evento contiene solo un'epoca e una revisione dell'archivio; l'UI rilegge quindi le schede canoniche
tramite la normale RPC `operator.read`. Più revisioni vengono accorpate in
un'unica lettura successiva. Workboard rinvia tale lettura mentre una scheda viene trascinata,
modificata o scritta, quindi la riprende al termine dell'interazione locale. Una
riconnessione esegue sempre un ricaricamento canonico. Non viene effettuato alcun sondaggio completo periodico
delle schede e **Aggiorna** rimane disponibile per il ripristino manuale.

Quando esiste più di una bacheca, la barra degli strumenti include un filtro **Bacheca** basato
sui metadati persistenti delle bacheche, anziché solo sulle schede attualmente visibili. Le bacheche vuote
e archiviate rimangono quindi selezionabili. Le schede prive di un id bacheca esplicito
appartengono alla bacheca canonica `default`. La bacheca selezionata viene memorizzata
nel parametro di query `?board=`, pertanto l'URL filtrato di Workboard può essere aggiunto ai segnalibri
o condiviso; scegliendo **Tutte le bacheche** il parametro viene rimosso.

Le schede sono memorizzate nello stato Gateway del plugin e vengono trasferite insieme al resto dello
stato OpenClaw di tale Gateway (vedere [Archiviazione](#storage)).

## Avvio del lavoro da una scheda

Le schede non collegate possono avviare direttamente il lavoro:

- **Esegui Codex** / **Esegui Claude** avvia un'esecuzione dell'agente monitorata come attività con un
  motore esplicito, invia il prompt della scheda e contrassegna la scheda come `running`. Le esecuzioni Codex
  usano `openai/gpt-5.6-sol`; quelle Claude usano `anthropic/claude-sonnet-4-6`.
- **Apri Codex** / **Apri Claude** crea una sessione della dashboard collegata senza
  inviare il prompt della scheda né spostarla, per il lavoro manuale che rimane
  associato alla bacheca.

Gli avvii autonomi utilizzano il percorso del Gateway per le esecuzioni degli agenti monitorate come attività (agente
e modello predefiniti, salvo selezione esplicita di Codex/Claude); Workboard collega quindi
alla scheda l'attività risultante, l'id dell'esecuzione e la chiave della sessione. Ogni esecuzione
collegata registra inoltre un riepilogo del tentativo (motore, modalità, modello, id esecuzione,
marche temporali, stato, conteggio progressivo degli errori), in modo che gli errori ripetuti rimangano visibili.

La dashboard aggiorna lo stato delle attività dal registro delle attività del Gateway, associando
le attività alle schede tramite l'id attività, l'id esecuzione o la chiave della sessione collegata. Un'attività in coda o in esecuzione
mantiene attivo il ciclo di vita della scheda; un'attività completata, non riuscita, scaduta o
annullata sposta la scheda verso `review` o `blocked` usando la stessa regola di sincronizzazione
delle sessioni collegate (vedere [Sincronizzazione del ciclo di vita delle sessioni](#session-lifecycle-sync)).

## Strumenti degli agenti

| Strumento                                                                                                                                         | Scopo                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                               | Elenca schede compatte con stato della presa in carico/diagnostico; filtro facoltativo per bacheca.                                                                                       |
| `workboard_read`                                                                                                                               | Restituisce una scheda insieme a un contesto limitato del worker (note, tentativi, commenti, collegamenti, prove, artefatti, risultati delle schede padre, attività recente dell'assegnatario, diagnostica attiva). |
| `workboard_create`                                                                                                                               | Crea una scheda con schede padre, tenant, competenze, bacheca, metadati dell'area di lavoro, chiave di idempotenza, limite di esecuzione e budget di tentativi facoltativi.                 |
| `workboard_link`                                                                                                                               | Collega una scheda padre a una scheda figlia. Le schede figlie rimangono `todo` finché tutte le schede padre non raggiungono `done`; quindi la promozione durante il dispatch le sposta in `ready`. |
| `workboard_claim`                                                                                                                               | Prende in carico una scheda per l'agente chiamante; sposta `backlog`/`todo`/`ready` in `running`.                                                |
| `workboard_heartbeat`                                                                                                                               | Aggiorna l'heartbeat della presa in carico durante un'esecuzione più lunga.                                                                                                               |
| `workboard_release`                                                                                                                               | Rilascia la presa in carico dopo il completamento, la sospensione o il passaggio di consegne; può spostare la scheda a uno stato successivo.                                              |
| `workboard_complete` / `workboard_block`                                                                                                         | Strumenti strutturati per il ciclo di vita destinati a riepiloghi finali, prove, artefatti e manifesti delle schede create (devono fare riferimento a schede ricollegate a quella completata) oppure ai motivi del blocco. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                                                   | Memorizza piccoli allegati della scheda nello stato SQLite del plugin, li indicizza nella scheda e li espone nel contesto del worker.                                                     |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                                        | Registra le righe di log del worker e blocca una scheda quando un worker automatizzato si arresta senza chiamare `workboard_complete`/`workboard_block`.                                  |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                                   | Gestisce i metadati persistenti della bacheca (nome visualizzato, descrizione, stato di archiviazione, area di lavoro predefinita).                                                       |
| `workboard_runs`                                                                                                                               | Restituisce la cronologia persistente dei tentativi di esecuzione di una scheda.                                                                                                         |
| `workboard_specify`                                                                                                                               | Trasforma una scheda preliminare di triage/backlog in una scheda `todo` chiarita; registra nella scheda il riepilogo delle specifiche.                                      |
| `workboard_decompose`                                                                                                                               | Suddivide una scheda padre di orchestrazione in schede figlie collegate, ereditando i metadati di bacheca/tenant; può completare la scheda padre con un manifesto delle schede create.    |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe`                                         | Gestisce le sottoscrizioni alle notifiche. Le letture degli eventi consentono una riproduzione sicura; `advance` sposta il cursore persistente affinché i chiamanti possano riprendere senza perdere o leggere due volte gli eventi di schede completate/non riuscite/obsolete. |
| `workboard_boards` / `workboard_stats`                                                                                                        | Esamina gli spazi dei nomi della bacheca e le statistiche della coda.                                                                                                                     |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                   | Recupera o passa ad altri il lavoro bloccato.                                                                                                                                             |
| `workboard_comment` / `workboard_proof`                                                                                                        | Aggiunge note per il passaggio di consegne o allega riferimenti a prove/artefatti.                                                                                                       |
| `workboard_unblock`                                                                                                                               | Riporta il lavoro bloccato a `todo`.                                                                                                                                          |
| `workboard_move`                                                                                                                               | Sposta una scheda in un altro stato; per le schede prese in carico è richiesto l'ambito della presa in carico dell'agente chiamante.                                                     |
| `workboard_dispatch`                                                                                                                               | Sollecita la promozione delle dipendenze o la pulizia delle prese in carico obsolete senza avviare worker; l'avvio dei worker usa il Gateway o il dispatch tramite comando slash.         |

Le schede prese in carico rifiutano le modifiche tramite strumenti dell'agente provenienti da altri agenti, a meno che il chiamante
non possieda il token di presa in carico restituito da `workboard_claim`. Ogni scheda restituita da uno
strumento dell'agente o da una chiamata RPC del Gateway oscura `metadata.claim.token` impostandolo su `[redacted]`
(il token stesso viene restituito una sola volta, al livello superiore, esclusivamente da `workboard_claim`),
così gli operatori della dashboard e gli altri agenti possono esaminare lo stato della presa in carico senza mai
visualizzare un token utilizzabile. Il recupero avviene tramite
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, che non
richiedono il token.

## Dispatch

Il dispatch è locale al Gateway: non genera processi arbitrari del sistema operativo. Le normali
sessioni dei subagenti OpenClaw continuano a gestire l'esecuzione. Un passaggio di dispatch:

1. Promuove le schede le cui dipendenze sono pronte.
2. Registra i metadati del dispatch nelle schede pronte.
3. Blocca le prese in carico scadute o le esecuzioni che hanno superato il tempo limite.
4. Contrassegna come candidate all'orchestrazione le schede di triage configurate nella bacheca.
5. Prende in carico un piccolo gruppo di schede pronte e avvia le esecuzioni dei worker tramite il
   runtime dei subagenti del Gateway.

I worker ricevono un contesto limitato della scheda, oltre al token di presa in carico necessario per inviare l'heartbeat,
completare o bloccare la scheda tramite gli strumenti Workboard.

I percorsi delle aree di lavoro rispettano le autorizzazioni esistenti del chiamante sul file system. I client del Gateway
con `operator.write` possono usare le aree di lavoro configurate degli agenti;
i client `operator.admin` possono usare altri checkout dell'host. Gli strumenti degli agenti in sandbox usano
l'accesso all'area di lavoro della propria sandbox, mentre gli strumenti non in sandbox limitati all'area di lavoro usano la
radice configurata della propria area di lavoro. Workboard registra tale autorizzazione quando viene
assegnata un'area di lavoro e la interseca nuovamente con l'autorizzazione del chiamante corrente al momento del dispatch,
in modo che una scheda persistente non possa ampliare l'accesso di un chiamante successivo. Per le schede meno recenti con
un'area di lavoro host esplicita ma senza autorizzazione registrata, è necessario salvare nuovamente tale area di lavoro
prima di un dispatch con accesso completo all'host; le schede prive di un percorso host adottano
l'autorizzazione del chiamante corrente al primo dispatch.

Il dispatch associato a un'area di lavoro accetta una directory o un checkout Git solo quando la relativa
radice del repository corrisponde esattamente all'area di lavoro dell'agente di destinazione. Una richiesta di worktree
viene limitata a tale directory e memorizzata come area di lavoro di tipo directory, perciò
l'host non materializza il checkout né esegue il codice di configurazione del repository. Il
worker di destinazione deve usare una sandbox Docker scrivibile e non condivisa per quella specifica
area di lavoro, senza esecuzione con privilegi elevati, override persistenti dell'esecuzione su host/node oppure
strumenti plugin e MCP non classificati. Workboard enumera i propri strumenti registrati
anziché considerare attendibile un prefisso `workboard_*`, e il dispatch rifiuta un container Docker
attivo il cui hash di mount/configurazione in uso sia obsoleto. Il dispatch segnala la
policy di destinazione incompatibile anziché avviare un worker con meno restrizioni.
Il dispatch con accesso completo all'host può usare come destinazione altri checkout locali e mantiene la normale configurazione dei
worktree gestiti.

L'autorizzazione dell'area di lavoro non crea un secondo modello di autorizzazioni per il ciclo di vita delle schede.
I chiamanti autorizzati a modificare le schede Workboard possono spostarle manualmente attraverso gli stessi
stati su ogni superficie; l'accesso in sola lettura all'area di lavoro impedisce soltanto il
dispatch di worker che richiede autorizzazioni di scrittura.

### Selezione dei worker

Ogni passaggio avvia **al massimo 3 worker per impostazione predefinita**. Le schede pronte sono ordinate per
priorità, quindi per posizione e infine per data di creazione. Un passaggio avvia una sola scheda per
proprietario/agente e ignora i proprietari che hanno già lavori in esecuzione o in revisione nella
bacheca. Le schede archiviate, quelle con una presa in carico attiva e quelle non nello stato `ready`
non vengono mai selezionate per l'avvio dei worker (possono comunque essere interessate dalle
operazioni sui dati del dispatch: pulizia delle prese in carico obsolete, promozione delle dipendenze, pulizia per
superamento del tempo limite).

Le chiavi di sessione sono deterministiche per bacheca/scheda, pertanto i dispatch ripetuti vengono instradati
alla stessa corsia del worker anziché creare sessioni non correlate:

- Schede assegnate: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Schede non assegnate: `subagent:workboard-<boardId>-<cardId>` (il Gateway risolve
  l'agente predefinito configurato)

Se non è possibile avviare un worker dopo la presa in carico di una scheda, Workboard blocca la
scheda, annulla la presa in carico, registra l'errore di avvio dell'esecuzione e aggiunge una riga al
log del worker, visibile nella dashboard, nel JSON della CLI, negli strumenti degli agenti e nella
diagnostica della scheda.

### Punti di ingresso

- Azione di invio dalla dashboard
- `openclaw workboard dispatch`
- `/workboard dispatch` su un canale in grado di eseguire comandi

Tutti e tre utilizzano il runtime dei subagenti del Gateway quando il Gateway è disponibile. La
CLI dispone di un solo fallback per l'operatore: se la chiamata al Gateway non riesce con un
errore di connessione/non disponibilità (o un errore `unknown method` per i Gateway
meno recenti), non è specificata alcuna destinazione `--url`/`--token` esplicita e non si applica alcun Gateway
remoto configurato (`OPENCLAW_GATEWAY_URL` o `gateway.mode: remote`), la CLI esegue
l'invio dei soli dati sullo stato SQLite locale: può promuovere le dipendenze,
rimuovere le rivendicazioni obsolete e bloccare le esecuzioni scadute, ma non può avviare i worker. Gli errori di autenticazione,
autorizzazione e convalida provenienti da un Gateway raggiungibile non vengono considerati
come indisponibilità; vengono restituiti come errori del comando, così come qualsiasi errore del Gateway
quando è stata specificata una destinazione `--url`/`--token` esplicita.

I metadati della bacheca possono impostare `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` e `orchestratorProfile`. OpenClaw registra questa intenzione e
la espone nel contesto del worker; la specificazione e la scomposizione effettive vengono comunque eseguite
tramite i normali strumenti Workboard.

## CLI e comando slash

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

L'output testuale di `list` nasconde per impostazione predefinita le schede archiviate (`--include-archived`
sostituisce questa impostazione); `--json` include sempre le schede archiviate, in conformità con il contratto
delle schede complete utilizzato dagli script esistenti. `show` e `move` accettano un prefisso
ID non ambiguo. `list`, `create`, `show` e `move` leggono e scrivono sempre direttamente
lo stato locale del Plugin. Solo `dispatch` chiama il Gateway in esecuzione, con il fallback
descritto sopra.

Consultare [CLI di Workboard](/it/cli/workboard) per l'elenco completo dei flag, l'output JSON, il comportamento di fallback del Gateway,
la gestione dei prefissi ID, le regole di selezione dell'invio e la
risoluzione dei problemi.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>` e `/workboard dispatch` rispecchiano
la CLI. L'elenco e la visualizzazione sono operazioni di lettura disponibili a qualsiasi mittente di comandi autorizzato.
La creazione, lo spostamento e l'invio richiedono lo stato di proprietario sulle superfici di chat oppure un client Gateway
con `operator.write`/`operator.admin`. Gli spostamenti manuali dell'operatore utilizzano lo
stesso comportamento di sostituzione della rivendicazione del trascinamento nella dashboard. L'accesso al worktree
continua a rispettare lo stesso limite dell'area di lavoro descritto sopra.

## Sincronizzazione del ciclo di vita della sessione

Le schede possono essere collegate a una sessione della dashboard esistente o a una creata quando si
avvia il lavoro dalla scheda. Le schede collegate mostrano direttamente il ciclo di vita della sessione:
in esecuzione, obsoleta, collegata ma inattiva, completata, non riuscita o mancante. È inoltre possibile acquisire una
sessione esistente dalla scheda Sessioni con **Aggiungi a Workboard**; la scheda
viene collegata a tale sessione, utilizza come titolo l'etichetta della sessione o il prompt recente dell'utente
e inizializza le note con il prompt recente dell'utente e l'ultima risposta dell'assistente,
se disponibili.

Se la sessione collegata non è più disponibile, la scheda rimane collegata per fornire il contesto e
continua a offrire i controlli di avvio per ripartire in una nuova sessione. Se una
sessione collegata attiva smette di segnalare attività recente, Workboard contrassegna la scheda come
`stale` e memorizza tale stato nei metadati finché il ciclo di vita non lo cancella.

Quando una scheda si trova in uno stato di lavoro attivo, Workboard segue la sessione collegata:

| Stato della sessione collegata        | Stato della scheda |
| ------------------------------------- | ------------------ |
| attiva                                | `running`   |
| completata                            | `review`    |
| non riuscita, terminata, scaduta o interrotta | `blocked`   |

**Gli stati di revisione manuale hanno la precedenza.** Lo spostamento di una scheda in `review`, `blocked` o `done`
interrompe la sincronizzazione automatica per tale scheda finché non viene riportata in `todo` o `running`.

L'avvio di una scheda utilizza le normali sessioni del Gateway; Workboard memorizza soltanto i
metadati e i collegamenti della scheda. La trascrizione della conversazione, la selezione del modello e il ciclo di vita
dell'esecuzione rimangono gestiti dal normale sistema delle sessioni. Utilizzare **Interrompi** su una scheda
collegata attiva per interrompere l'esecuzione in corso: Workboard contrassegna la scheda come `blocked`, in modo che
rimanga visibile per le attività successive.

Le nuove schede possono essere create a partire dai modelli di Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). I modelli precompilano titolo, note, etichette e priorità;
l'ID del modello viene memorizzato nei metadati della scheda.

## Flusso di lavoro della dashboard

1. Aprire la scheda Workboard nell'interfaccia di controllo.
2. Creare una scheda con titolo, note, priorità, etichette, agente facoltativo e
   sessione collegata facoltativa, oppure aprire Sessioni e scegliere **Aggiungi a Workboard**
   per una sessione esistente.
3. Trascinare la scheda tra le colonne oppure attivare il relativo controllo compatto dello stato e utilizzare
   il menu o ArrowLeft/ArrowRight. Durante il trascinamento, la scheda di origine si attenua e
   le colonne di destinazione disponibili vengono evidenziate da un contorno.
4. Avviare il lavoro dalla scheda per creare o riutilizzare una sessione della dashboard.
5. Aprire dalla scheda la sessione collegata mentre l'agente lavora.
6. Lasciare che la sincronizzazione del ciclo di vita sposti il lavoro in esecuzione in `review`/`blocked`, quindi spostare manualmente
   la scheda in `done` quando viene accettata.

## Diagnostica

La diagnostica viene calcolata dai metadati locali delle schede. I controlli integrati segnalano:

| Tipo                        | Condizione                                                                     |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Scheda `todo`/`backlog`/`ready` assegnata non aggiornata da oltre 1 ora.             |
| `running_without_heartbeat` | Scheda `running` senza Heartbeat della rivendicazione o aggiornamenti dell'esecuzione da oltre 20 minuti. |
| `blocked_too_long`          | Scheda `blocked` non aggiornata da oltre 24 ore.                                   |
| `repeated_failures`         | Il conteggio degli errori monitorati della scheda raggiunge almeno 2.                                |
| `missing_proof`             | Scheda `done` senza prove, artefatti o allegati.                          |
| `orphaned_session`          | Scheda `running` con un `sessionKey` ma senza metadati `execution`.                |

## Autorizzazioni

I metodi RPC del Gateway si trovano sotto `workboard.*`:

| Ambito           | Metodi                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, attachment list/get, letture degli eventi di notifica, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, create/update/move/delete/comment/link/linkDependency/proof/artifact, attachment add/delete, worker log, protocol violation, claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock, `cards.dispatch`, `cards.bulk`, archive, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, notification subscribe/delete/advance |

Nessun metodo RPC richiede `operator.admin`. I browser connessi con accesso
operatore in sola lettura possono esaminare la bacheca, ma non possono modificare le schede. Un ambito amministratore
estende i percorsi host Workboard accettati; non modifica i metodi disponibili.

## Archiviazione

Workboard memorizza i dati persistenti in un database SQLite relazionale di proprietà del Plugin,
all'interno della directory di stato di OpenClaw: bacheche, schede, etichette, eventi del ciclo di vita,
tentativi di esecuzione, commenti, collegamenti di dipendenza, prove, riferimenti agli artefatti,
metadati e blob degli allegati, diagnostica, notifiche, log dei worker,
stato del protocollo e sottoscrizioni risiedono tutti nelle tabelle di Workboard (non
nelle voci chiave-valore del Plugin). L'esportazione di una scheda conserva la narrazione della bacheca
senza incorporare i contenuti dei blob degli allegati.

Le installazioni che utilizzavano Workboard nella versione `.28` possono eseguire
`openclaw doctor --fix` per migrare gli spazi dei nomi dello stato legacy del Plugin distribuiti
(`workboard.cards`, `workboard.boards`, `workboard.notify` e, se presente,
`workboard.attachments`) nel database relazionale.

## Risoluzione dei problemi

**La scheda indica che Workboard non è disponibile**

```bash
openclaw plugins inspect workboard --runtime --json
```

Se `plugins.allow` è configurato, aggiungervi `workboard`. Se `plugins.deny`
contiene `workboard`, rimuoverlo prima di abilitare il Plugin.

**Le schede non vengono salvate**

Verificare che la connessione del browser disponga dell'accesso `operator.write`. Le sessioni operatore
in sola lettura possono elencare le schede, ma non possono crearle, modificarle, spostarle o eliminarle.

**L'avvio di una scheda non apre la sessione prevista**

Controllare l'ID agente e la sessione collegata della scheda, quindi aprire Sessioni o Chat per
esaminare lo stato effettivo dell'esecuzione.

**L'invio non avvia un worker**

Verificare che sia presente almeno una scheda `ready` senza una rivendicazione attiva:

```bash
openclaw workboard list --status ready
```

Se la CLI segnala l'invio dei soli dati, avviare o riavviare il Gateway e
riprovare: l'invio dei soli dati aggiorna lo stato locale della bacheca, ma non può avviare
le esecuzioni dei worker subagenti. Le schede possono inoltre essere ignorate quando un'altra scheda dello
stesso proprietario o agente è già in esecuzione o in attesa di revisione; completare,
bloccare o rilasciare il lavoro attivo prima di inviarne altro per lo stesso
proprietario.

## Contenuti correlati

- [Interfaccia di controllo](/it/web/control-ui)
- [CLI di Workboard](/it/cli/workboard)
- [Plugin](/it/tools/plugin)
- [Gestire i Plugin](/it/plugins/manage-plugins)
- [Sessioni](/it/concepts/session)
