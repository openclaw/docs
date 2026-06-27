---
read_when:
    - Vuoi una bacheca di lavoro in stile Kanban nella Control UI
    - Stai abilitando o disabilitando il Plugin Workboard incluso
    - Vuoi monitorare il lavoro pianificato degli agenti senza un project manager esterno
summary: Workboard dashboard facoltativa per schede di proprietà dell'agente e passaggio di sessione
title: Plugin Workboard
x-i18n:
    generated_at: "2026-06-27T18:04:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Il Plugin Workboard aggiunge una board opzionale in stile Kanban alla
[UI di controllo](/it/web/control-ui). Usala per raccogliere schede di lavoro di dimensioni adatte agli agenti, assegnarle
agli agenti e tracciare da un'unica scheda l'attività in background, l'esecuzione e la sessione dashboard
collegate.

Workboard è volutamente piccolo. Traccia il lavoro operativo locale per un
Gateway OpenClaw; non è un sostituto di GitHub Issues, Linear, Jira o
altri sistemi di project management di team.

## Stato predefinito

Workboard è un Plugin incluso ed è disabilitato per impostazione predefinita, a meno che tu non lo abiliti
nella configurazione dei Plugin.

Abilitalo con:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

Poi apri la dashboard:

```bash
openclaw dashboard
```

La scheda Workboard compare nella navigazione della dashboard. Se la scheda è visibile
ma il Plugin è disabilitato o bloccato da `plugins.allow` / `plugins.deny`, la
vista mostra uno stato di Plugin non disponibile invece dei dati locali delle schede.

## Cosa contengono le schede

Ogni scheda memorizza:

- titolo e note
- stato: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked` o `done`
- priorità: `low`, `normal`, `high` o `urgent`
- etichette
- id agente opzionale
- attività, esecuzione, sessione o URL di origine collegati opzionali
- metadati di esecuzione opzionali per un'esecuzione Codex o Claude avviata dalla scheda
- metadati compatti per tentativi, commenti, link, prove, artefatti, automazione,
  allegati, log dei worker, stato del protocollo dei worker, rivendicazioni, diagnostica,
  notifiche, template, stato di archivio e rilevamento di sessioni obsolete
- eventi recenti della scheda, come modifiche di creazione, spostamento, collegamento, rivendicazione, Heartbeat,
  tentativo, prova, artefatto, diagnostica, notifica, dispatch, archivio, obsolescenza
  o aggiornamento da parte dell'agente

Le schede sono memorizzate nello stato Gateway del Plugin. Sono locali alla directory
di stato del Gateway e si spostano insieme al resto dello stato OpenClaw di quel Gateway.

Workboard conserva metadati compatti per scheda, così gli operatori possono vedere come una scheda si è spostata
attraverso la board senza aprire la sessione collegata. Eventi, riepiloghi dei tentativi,
frammenti di prova, link correlati, commenti, marcatori di archivio e marcatori di sessione obsoleta
sono intenzionalmente metadati locali; non sostituiscono le trascrizioni di sessione
né la cronologia delle issue GitHub.

## Esecuzioni delle schede e attività

Le schede non collegate possono avviare il lavoro dalla scheda. Gli avvii autonomi usano il
percorso di esecuzione agente tracciato come attività del Gateway, poi Workboard collega l'attività risultante,
l'id esecuzione e la chiave di sessione alla scheda. L'avvio usa l'agente e il modello
predefiniti configurati del Gateway. Le azioni Codex e Claude sono scelte di modello esplicite opzionali:

- Esegui Codex o Esegui Claude avvia un'esecuzione agente supportata da attività, invia il prompt
  della scheda e contrassegna la scheda come `running`.
- Apri Codex o Apri Claude crea una sessione dashboard collegata senza inviare
  il prompt della scheda né spostare la scheda, così puoi lavorare manualmente mentre resta
  collegata alla board.

I metadati di esecuzione memorizzano sulla scheda il motore selezionato, la modalità, il riferimento modello, la chiave di sessione,
l'id esecuzione, l'id attività quando disponibile e lo stato del ciclo di vita. Le esecuzioni Codex
usano `openai/gpt-5.5`; le esecuzioni Claude usano
`anthropic/claude-sonnet-4-6`.

Ogni esecuzione collegata registra anche un riepilogo del tentativo nello stesso record della scheda.
Il riepilogo del tentativo conserva motore, modalità, modello, id esecuzione, timestamp, stato
e conteggio progressivo degli errori, così i fallimenti ripetuti restano visibili sulla board.

La dashboard aggiorna lo stato delle attività dal registro delle attività del Gateway e abbina
le attività alle schede per id attività, id esecuzione o chiave di sessione collegata. Se un'attività è
in coda o in esecuzione, il ciclo di vita della scheda mostra lo stato attivo dell'attività. Se l'attività
termina, fallisce, va in timeout o viene annullata, il ciclo di vita della scheda si sposta verso
lo stato di review o blocked usando la stessa sincronizzazione del ciclo di vita delle sessioni collegate.

## Coordinamento degli agenti

Workboard espone anche strumenti agente opzionali per workflow consapevoli della board:

- `workboard_list` elenca schede compatte con stato di rivendicazione e diagnostica, con un
  filtro board opzionale.
- `workboard_read` restituisce una scheda più un contesto worker limitato, costruito da note,
  tentativi, commenti, link, prove, artefatti, risultati padre, lavoro recente dell'assegnatario
  e diagnostica attiva.
- `workboard_create` crea una scheda con padri, tenant, Skills,
  board, metadati workspace, chiave di idempotenza, limite runtime e budget di retry opzionali.
- `workboard_link` collega una scheda padre a una scheda figlia. Le figlie restano in `todo`
  finché ogni padre non raggiunge `done`; poi la promozione dispatch le sposta a
  `ready`.
- `workboard_claim` rivendica una scheda per l'agente chiamante e sposta le schede backlog, todo
  o ready in `running`.
- `workboard_heartbeat` aggiorna l'Heartbeat della rivendicazione durante esecuzioni più lunghe.
- `workboard_release` rilascia la rivendicazione dopo completamento, pausa o handoff e
  può spostare la scheda a uno stato successivo.
- `workboard_complete` e `workboard_block` sono strumenti strutturati di ciclo di vita per
  riepiloghi finali, prove, artefatti, manifesti di schede create e motivi di blocco.
  I manifesti di schede create devono fare riferimento a schede collegate alla scheda
  completata, così i figli fantasma restano fuori dai riepiloghi.
- `workboard_attachment_add`, `workboard_attachment_read` e
  `workboard_attachment_delete` memorizzano piccoli allegati delle schede nello stato SQLite del Plugin,
  li indicizzano sulla scheda e li espongono nel contesto worker.
- `workboard_worker_log` e `workboard_protocol_violation` registrano righe di log dei worker
  e bloccano le schede quando un worker automatizzato si ferma senza chiamare
  `workboard_complete` o `workboard_block`.
- `workboard_board_create`, `workboard_board_archive` e
  `workboard_board_delete` gestiscono metadati board persistenti come nome visualizzato,
  descrizione, stato di archivio e workspace predefinito.
- `workboard_runs` restituisce la cronologia persistente dei tentativi di esecuzione memorizzata su una scheda.
- `workboard_specify` trasforma una scheda approssimativa di triage o backlog in una scheda
  `todo` chiarita e registra il riepilogo della specifica sulla scheda.
- `workboard_decompose` espande una scheda padre di orchestrazione in figli collegati,
  eredita metadati board e tenant e può completare il padre con un
  manifesto di schede create.
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance` e
  `workboard_notify_unsubscribe` gestiscono le sottoscrizioni alle notifiche nello stato del Plugin.
  Le letture degli eventi sono sicure da riprodurre; lo strumento advance sposta il cursore durevole
  così i chiamanti possono riprendere senza perdere o rileggere due volte eventi di schede completate, fallite o
  obsolete.
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock` e `workboard_dispatch` consentono a un agente
  di ispezionare i namespace delle board, visualizzare statistiche di coda, recuperare lavoro bloccato, aggiungere note di handoff,
  allegare riferimenti a prove o artefatti, spostare il lavoro bloccato di nuovo a `todo`
  e sollecitare la promozione delle dipendenze o la pulizia di rivendicazioni obsolete.

Le schede rivendicate rifiutano mutazioni degli strumenti agente da altri agenti, a meno che il chiamante
non abbia il token di rivendicazione restituito da `workboard_claim`. Gli operatori dashboard continuano a usare
la normale superficie RPC del Gateway e possono recuperare o riassegnare le schede.

Workboard memorizza dati board durevoli in un database relazionale SQLite di proprietà del Plugin
sotto la directory di stato OpenClaw. Board, schede, etichette, eventi del ciclo di vita,
tentativi di esecuzione, commenti, link di dipendenza, prove, riferimenti ad artefatti,
metadati e blob degli allegati, diagnostica, notifiche, log dei worker,
stato del protocollo e sottoscrizioni vengono persistiti nelle tabelle Workboard invece che
in voci chiave-valore del Plugin. Un'esportazione della scheda preserva comunque la narrazione della board
senza incorporare inline i contenuti blob degli allegati.

Le installazioni che hanno usato Workboard nella release `.28` possono eseguire
`openclaw doctor --fix` per migrare i namespace di stato Plugin legacy distribuiti
(`workboard.cards`, `workboard.boards` e `workboard.notify`) nel
database relazionale. Se è presente un namespace legacy `workboard.attachments`,
doctor migra anche quei blob di allegati.

La diagnostica Workboard viene calcolata dai metadati locali delle schede. I controlli integrati
segnalano le schede assegnate che attendono troppo a lungo, le schede in esecuzione senza Heartbeat recente,
le schede bloccate che richiedono attenzione, i fallimenti ripetuti, le schede completate senza prova
e le schede in esecuzione che hanno solo un collegamento di sessione non vincolante.

Il dispatch è intenzionalmente locale al Gateway. Non genera processi arbitrari del sistema
operativo; le normali sessioni subagente OpenClaw continuano a possedere l'esecuzione. L'azione
dispatch promuove le schede pronte per dipendenza, registra i metadati dispatch sulle schede
ready, blocca rivendicazioni scadute o esecuzioni in timeout, contrassegna le schede di triage configurate dalla board
come candidate di orchestrazione, poi rivendica un piccolo batch di schede ready
e avvia esecuzioni worker tramite il runtime subagente del Gateway. Le schede assegnate
usano chiavi di sessione worker `agent:<id>:subagent:workboard-*`; le schede non assegnate
usano chiavi senza scope `subagent:workboard-*`, così il Gateway risolve comunque
l'agente predefinito configurato. I worker ricevono un contesto scheda limitato più il token di rivendicazione
necessario per inviare Heartbeat, completare o bloccare la scheda tramite gli strumenti Workboard.

### Selezione dei worker dispatch

Ogni passaggio dispatch avvia al massimo tre worker per impostazione predefinita. Le schede ready sono
ordinate per priorità, posizione e ora di creazione, poi filtrate per evitare
proprietà attive duplicate. Un dispatch avvia una sola scheda per un dato proprietario o
agente nello stesso passaggio e salta i proprietari che hanno già lavoro in esecuzione o in review
sulla board.

Le schede archiviate, le schede con rivendicazioni attive e le schede senza stato `ready` non sono
selezionate per gli avvii worker. Possono comunque essere interessate dal lato dati del
dispatch quando si applicano rivendicazioni obsolete, promozione delle dipendenze o pulizia dei timeout.

### Prompt e ciclo di vita del worker

Il prompt del worker include il titolo della scheda, note e contesto limitati, la
board assegnata e il protocollo worker di Workboard. Include anche il proprietario della rivendicazione
e il token di rivendicazione, così il worker può chiamare `workboard_heartbeat`,
`workboard_complete` o `workboard_block` senza che un altro attore prenda il controllo della
scheda.

Quando un worker si avvia correttamente, Workboard memorizza sulla scheda la chiave di sessione, l'id esecuzione,
il motore, la modalità, l'etichetta del modello, lo stato e il log worker. La chiave di sessione
è deterministica per la board e la scheda, il che fa sì che i dispatch ripetuti vengano instradati
alla stessa corsia worker invece di creare sessioni non correlate.

Se un worker non può essere avviato dopo che una scheda è stata rivendicata, Workboard blocca la
scheda, cancella la rivendicazione, registra l'errore di avvio esecuzione e aggiunge una riga di log
worker. L'errore è visibile nella dashboard, nel JSON CLI, negli strumenti agente e nella
diagnostica della scheda.

### Punti di ingresso dispatch

Gli avvii worker per schede ready possono avvenire da:

- l'azione dispatch della dashboard
- `openclaw workboard dispatch`
- `/workboard dispatch` su un canale con supporto ai comandi

Tutti e tre i punti di ingresso usano il runtime subagente del Gateway quando il Gateway è
disponibile. La CLI ha un fallback operativo aggiuntivo: se il Gateway è offline o
non espone il metodo dispatch di Workboard e non è stato fornito alcun target esplicito `--url` o
`--token`, esegue un dispatch solo dati sullo stato SQLite locale.
Quel fallback può promuovere dipendenze, pulire rivendicazioni obsolete e bloccare
esecuzioni in timeout, ma non può avviare worker.

I metadati board possono includere impostazioni di orchestrazione come `autoDecompose`,
`autoDecomposePerDispatch`, `defaultAssignee` e `orchestratorProfile`.
OpenClaw registra l'intento di orchestrazione e lo espone nel contesto worker; la
specifica e la decomposizione effettive avvengono comunque tramite i normali
strumenti Workboard.

## CLI e comando slash

Il Plugin registra un comando CLI root:

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` chiama il Gateway in esecuzione in modo che gli avvii dei worker usino lo stesso runtime subagent della dashboard. Se il Gateway non è disponibile, ripiega sul dispatch solo dati, così la promozione delle dipendenze, la pulizia delle claim obsolete e il blocco per timeout possono comunque essere eseguiti. Gli errori di autenticazione, autorizzazione e validazione continuano a emergere come errori del comando, così come gli errori per target espliciti `--url` o `--token`.

Il comando slash `/workboard` supporta lo stesso percorso operatore compatto:
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` e
`/workboard dispatch`. List e show sono operazioni di lettura per mittenti di comandi autorizzati. Create e dispatch richiedono lo stato di owner sulle superfici chat o un client Gateway con `operator.write` o `operator.admin`.

Vedi [CLI Workboard](/it/cli/workboard) per flag dei comandi, output JSON, comportamento di fallback del Gateway, gestione non ambigua dei prefissi id, regole di selezione del dispatch e risoluzione dei problemi.

## Sincronizzazione del ciclo di vita della sessione

Le card possono essere collegate a sessioni dashboard esistenti o alla sessione creata quando avvii il lavoro da una card. Le card collegate mostrano il ciclo di vita della sessione inline: in esecuzione, obsoleta, inattiva collegata, completata, non riuscita o mancante.

Se la sessione collegata è mancante, la card rimane collegata per il contesto e offre comunque i controlli di avvio, così puoi riavviare il lavoro in una nuova sessione dashboard. Se una sessione collegata attiva smette di segnalare attività recente, Workboard contrassegna la card come obsoleta e memorizza il marker come metadati della card finché il ciclo di vita non lo rimuove.

Puoi anche acquisire una sessione dashboard esistente dalla scheda Sessions con Add to Workboard. La card viene collegata a quella sessione, usa l'etichetta della sessione o il prompt utente recente come titolo e inizializza le note dal prompt utente recente più l'ultima risposta dell'assistente quando la cronologia chat è disponibile.

Workboard segue la sessione collegata mentre la card è ancora in uno stato di lavoro attivo:

- sessione collegata attiva -> `running`
- sessione collegata completata -> `review`
- sessione collegata non riuscita, terminata, scaduta o interrotta -> `blocked`

Gli stati di revisione manuale hanno la precedenza. Se sposti una card in `review`, `blocked` o `done`, Workboard smette di spostare automaticamente quella card finché non la riporti in `todo` o `running`.

## Workflow della dashboard

1. Apri la scheda Workboard nella Control UI.
2. Crea una card con titolo, note, priorità, etichette, agente opzionale e sessione collegata opzionale.
3. Oppure apri Sessions e scegli Add to Workboard per una sessione esistente.
4. Trascina la card tra le colonne oppure concentra il controllo di stato compatto sulla card e usa il relativo menu o ArrowLeft/ArrowRight.
5. Avvia il lavoro dalla card per creare o riutilizzare una sessione dashboard.
6. Apri la sessione collegata dalla card mentre l'agente lavora.
7. Lascia che la sincronizzazione del ciclo di vita sposti il lavoro in esecuzione in revisione o bloccato, quindi sposta manualmente la card in completato quando viene accettata.

L'avvio di una card usa le normali sessioni Gateway. Il Plugin Workboard memorizza solo metadati e collegamenti della card; la trascrizione della conversazione, la selezione del modello e il ciclo di vita dell'esecuzione restano di proprietà del normale sistema di sessioni.

Usa Stop su una card collegata live per interrompere l'esecuzione della sessione attiva. Workboard contrassegna quella card come `blocked`, così rimane visibile per il follow-up.

Le nuove card possono partire da template Workboard per correzioni di bug, documentazione, release, revisioni PR o lavoro sui Plugin. I template precompilano titolo, note, etichette e priorità, e l'id del template selezionato viene memorizzato come metadati della card.

## Autorizzazioni

Il Plugin registra metodi RPC Gateway nello spazio dei nomi `workboard.*`:

- `workboard.cards.list` richiede `operator.read`
- `workboard.cards.export` richiede `operator.read`
- `workboard.cards.diagnostics` richiede `operator.read`
- `workboard.cards.diagnostics.refresh` richiede `operator.write`
- le letture dell'elenco/recupero allegati e degli eventi di notifica richiedono `operator.read`
- l'avanzamento del cursore delle notifiche richiede `operator.write`
- i metodi di creazione, aggiornamento, spostamento, eliminazione, commento, collegamento, collegamento dipendenza, prova, artefatto,
  aggiunta/eliminazione allegato, log worker, violazione del protocollo, claim, heartbeat,
  release, completamento, blocco, sblocco, dispatch, bulk e archiviazione richiedono
  `operator.write`

I browser connessi con accesso operatore in sola lettura possono ispezionare la board ma non possono modificare le card.

## Configurazione

Workboard non ha oggi una configurazione specifica del Plugin. Abilitalo o disabilitalo con la voce Plugin standard:

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

Disabilitalo di nuovo con:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Risoluzione dei problemi

### La scheda indica che Workboard non è disponibile

Controlla la policy dei Plugin:

```bash
openclaw plugins inspect workboard --runtime --json
```

Se `plugins.allow` è configurato, aggiungi `workboard` a quell'allowlist. Se
`plugins.deny` contiene `workboard`, rimuovilo prima di abilitare il Plugin.

### Le card non vengono salvate

Conferma che la connessione del browser abbia accesso `operator.write`. Le sessioni operatore in sola lettura possono elencare le card, ma non possono crearle, modificarle, spostarle o eliminarle.

### L'avvio di una card non apre la sessione prevista

Workboard crea collegamenti a normali sessioni dashboard. Controlla l'id agente della card e la sessione collegata, quindi apri la vista Sessions o Chat per ispezionare lo stato effettivo dell'esecuzione.

### Il dispatch non avvia un worker

Conferma che ci sia almeno una card `ready` senza claim attiva:

```bash
openclaw workboard list --status ready
```

Se la CLI segnala dispatch solo dati, avvia o riavvia il Gateway e riprova. Il dispatch solo dati aggiorna lo stato della board locale ma non può avviare esecuzioni di worker subagent.

Le card possono anche essere saltate quando un'altra card per lo stesso owner o agente è già in esecuzione o in attesa di revisione. Completa, blocca o rilascia quel lavoro attivo prima di eseguire il dispatch di altro lavoro per lo stesso owner.

## Correlati

- [Control UI](/it/web/control-ui)
- [CLI Workboard](/it/cli/workboard)
- [Plugin](/it/tools/plugin)
- [Gestire i Plugin](/it/plugins/manage-plugins)
- [Sessioni](/it/concepts/session)
