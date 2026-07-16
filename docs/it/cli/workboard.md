---
read_when:
    - Si desidera esaminare o creare schede Workboard dal terminale
    - Si desidera avviare esecuzioni dei worker di Workboard dalla CLI
    - Si sta eseguendo il debug del comportamento della CLI Workboard o dei comandi slash
summary: Riferimento CLI per schede `openclaw workboard`, distribuzione ed esecuzioni dei worker
title: CLI della bacheca di lavoro
x-i18n:
    generated_at: "2026-07-16T14:12:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c109402dad26a44a277febf895e4f4305060e3b6c8ecc024aca5f255de8b5717
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` è l'interfaccia terminale per il [plugin Workboard](/it/plugins/workboard) incluso. Consente a un operatore di elencare le schede, creare una scheda, esaminarne una e chiedere al Gateway in esecuzione di assegnare il lavoro pronto alle esecuzioni dei worker subagent.

Abilitare il plugin prima di utilizzare il comando:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Utilizzo

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Il comando legge e scrive nello stesso database SQLite di proprietà del plugin utilizzato dalla dashboard e dagli strumenti dell'agente Workboard. Gli ID delle schede sono UUID; i comandi che accettano l'ID di una scheda accettano anche un prefisso ID non ambiguo (l'output testuale compatto mostra i primi 8 caratteri).

Valori `status` validi: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Valori `priority` validi: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

L'output testuale è compatto:

```text
7f4a2c10  ready     high    default agent-a  Correggere l'Heartbeat obsoleto del worker
```

Le colonne sono il prefisso dell'ID, lo stato, la priorità, l'ID della board, l'ID facoltativo dell'agente e il titolo.

| Flag                 | Scopo                                         |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Limita i risultati a uno spazio dei nomi della board |
| `--status <status>`  | Limita i risultati a uno stato di Workboard   |
| `--include-archived` | Include le schede archiviate nell'output testuale compatto |
| `--json`             | Stampa l'elenco completo delle schede come JSON elaborabile |

Per impostazione predefinita, l'output testuale compatto nasconde le schede archiviate affinché la CLI corrisponda a `/workboard list`. Passare `--include-archived` per mostrarle. L'output JSON conserva sempre l'elenco completo delle schede, incluse quelle archiviate, per le automazioni esistenti.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Flag                    | Scopo                                   |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | Note iniziali della scheda              |
| `--status <status>`     | Stato iniziale, valore predefinito `todo` |
| `--priority <priority>` | Priorità, valore predefinito `normal` |
| `--agent <id>`          | Assegna la scheda a un ID agente o proprietario |
| `--board <id>`          | Memorizza la scheda in uno spazio dei nomi della board |
| `--labels <items>`      | Etichette separate da virgole           |
| `--json`                | Stampa la scheda creata come JSON elaborabile |

`create` scrive direttamente nello stato SQLite di Workboard. La scheda è immediatamente visibile nella scheda Workboard della Control UI e agli strumenti Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

L'output testuale stampa la riga compatta della scheda e le note. L'output JSON restituisce il record completo della scheda, inclusi i metadati di esecuzione, i tentativi, i commenti, i collegamenti, le prove, gli artefatti, i log dei worker, lo stato del protocollo, la diagnostica e i metadati di automazione.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` modifica lo stato della scheda utilizzando lo stesso percorso manuale dell'operatore impiegato per trascinare una scheda nella dashboard. Accetta l'ID completo di una scheda o un prefisso non ambiguo. I blocchi attivi dovuti alle dipendenze e alla pianificazione continuano ad applicarsi. Gli operatori possono spostare una scheda rivendicata senza il token di rivendicazione del relativo agente; i token di rivendicazione rimangono limitati alle modifiche degli strumenti dell'agente e vengono omessi dall'output JSON.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` chiama innanzitutto il metodo RPC `workboard.cards.dispatch` del Gateway in esecuzione, che utilizza lo stesso runtime dei subagent dell'azione di assegnazione della dashboard, in modo che le schede pronte diventino esecuzioni dei worker monitorate come attività e dotate di chiavi di sessione collegate. `--max-starts` utilizza il metodo aggiuntivo `workboard.cards.dispatchWithOptions`, così un Gateway meno recente rifiuta l'opzione prima di avviare qualsiasi worker; dopo l'aggiornamento, riavviare il Gateway prima di utilizzare il flag. Le schede assegnate a un agente utilizzano chiavi di sessione dei subagent limitate all'agente; le schede non assegnate conservano una chiave dei subagent senza ambito, in modo da mantenere l'agente predefinito configurato nel Gateway.

Il ciclo di assegnazione:

1. Promuove a `ready` le schede figlie le cui dipendenze sono pronte.
2. Blocca le rivendicazioni scadute o le esecuzioni dei worker che hanno superato il tempo limite.
3. Registra i metadati di assegnazione nelle schede pronte.
4. Seleziona un piccolo gruppo di schede pronte non rivendicate.
5. Rivendica ogni scheda selezionata per il dispatcher o l'agente assegnato.
6. Avvia l'esecuzione di un worker subagent con il contesto limitato della scheda e il relativo token di rivendicazione.
7. Memorizza nella scheda l'ID dell'esecuzione del worker, la chiave di sessione, il collegamento all'attività quando segnalato dal registro delle attività del Gateway, lo stato di esecuzione e il log del worker.

La selezione è prudente: per impostazione predefinita, una singola assegnazione avvia al massimo tre worker, ignora le schede archiviate o già rivendicate e avvia una sola scheda per proprietario o agente in ciascun passaggio. Le schede già appartenenti a lavori attivi in esecuzione o in revisione vengono lasciate per un'assegnazione successiva. Passare `--max-starts <count>` con un numero intero positivo per modificare il limite per passaggio; la regola di una scheda per proprietario continua ad applicarsi, pertanto il numero effettivo di avvii può essere inferiore.

Se l'avvio del worker non riesce dopo che una scheda è stata rivendicata, Workboard blocca la scheda, annulla la rivendicazione e registra l'errore nei metadati di esecuzione e del log del worker della scheda, mantenendo visibili gli avvii non riusciti anziché restituire silenziosamente la scheda alla coda.

Se non viene specificata una destinazione Gateway esplicita e il Gateway locale non è disponibile o non espone ancora il metodo di assegnazione di Workboard, la CLI ripiega su un'assegnazione dei soli dati nello stato locale di Workboard. L'assegnazione dei soli dati può comunque promuovere le dipendenze, eliminare le rivendicazioni obsolete e bloccare le esecuzioni scadute, ma non avvia worker. Gli errori di autenticazione, autorizzazione e convalida, nonché gli errori relativi a una destinazione `--url` o `--token` esplicita, vengono segnalati direttamente anziché attivare il ripiego.

L'output testuale segnala gli avvii dei worker:

```text
assegnazione completata: avviati=2 errori=0
```

L'output del ripiego è esplicito:

```text
Gateway non disponibile; solo assegnazione dei dati: promosse=1 bloccate=0
```

L'output JSON include il risultato dell'assegnazione. L'assegnazione supportata dal Gateway può includere `started` e `startFailures`; il ripiego sui soli dati include `gatewayUnavailable: true`. I token di rivendicazione vengono omessi dall'output JSON delle schede.

Nella dashboard, lo stesso risultato dell'assegnazione viene mostrato come un breve riepilogo, in modo che un operatore possa vedere quante schede sono state avviate, promosse, bloccate, recuperate o hanno generato errori senza aprirne i dettagli.

## Parità dei comandi slash

I canali che supportano i comandi possono utilizzare il comando slash corrispondente:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

Anche l'assegnazione tramite comando slash utilizza il runtime dei subagent del Gateway, quindi segue lo stesso comportamento di rivendicazione, avvio dei worker e gestione degli errori del percorso Gateway della dashboard e della CLI.

`/workboard list` e `/workboard show` sono comandi di lettura per i mittenti autorizzati dei comandi. `/workboard create`, `/workboard move` e `/workboard dispatch` modificano lo stato della board e richiedono lo stato di proprietario sulle interfacce di chat oppure un client Gateway con `operator.write` o `operator.admin`.

## Autorizzazioni

Il percorso di assegnazione della CLI richiede normalmente gli ambiti Gateway `operator.write` e `operator.read`. Le schede associate a uno spazio di lavoro vengono eseguite direttamente in uno spazio di lavoro dell'agente configurato con precisione; una richiesta di worktree viene limitata a tale directory anziché consentire all'host di materializzare codice controllato dal repository. Il worker selezionato deve disporre di accesso in scrittura, non condiviso, alla sandbox Docker per quello spazio di lavoro esatto, di un hash del container attivo corrispondente ai mount e ai criteri richiesti e non deve avere alcuna possibilità di uscire dall'host. Passare `--admin` per richiedere esplicitamente `operator.admin`, consentire un altro checkout sull'host e utilizzare la normale configurazione del worktree gestito; la connessione non riesce se tale ambito non è approvato per il client. Un token Gateway di sola lettura può esaminare i dati di Workboard tramite i metodi di lettura, ma non può creare schede né assegnare worker. I limiti dello spazio di lavoro non modificano altrimenti lo spostamento manuale delle schede per i chiamanti autorizzati a modificare Workboard.

I comandi locali `list`, `create`, `show` e `move` operano sulla directory di stato locale di OpenClaw utilizzata dal profilo corrente. Utilizzare `--dev` o `--profile <name>` nel comando `openclaw` di livello superiore quando è necessaria una radice di stato diversa.

## Risoluzione dei problemi

### Non viene visualizzata alcuna scheda

Verificare che il plugin sia abilitato per lo stesso profilo e la stessa radice di stato:

```bash
openclaw plugins inspect workboard --runtime --json
```

Se la dashboard mostra le schede ma la CLI no, verificare che entrambi i comandi utilizzino la stessa impostazione `--dev` o `--profile`.

### L'assegnazione segnala la modalità dei soli dati

Avviare o riavviare il Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Quindi riprovare `openclaw workboard dispatch`. Il ripiego sui soli dati è utile per la pulizia dello stato locale, ma le esecuzioni dei worker richiedono un Gateway attivo.

### L'assegnazione non avvia nulla

Verificare che esista almeno una scheda `ready` senza una rivendicazione attiva:

```bash
openclaw workboard list --status ready
```

Le schede possono essere ignorate anche quando lo stesso proprietario ha già lavori in esecuzione o in revisione. Spostare il lavoro completato in `done`, rilasciare le rivendicazioni obsolete tramite gli strumenti Workboard oppure eseguire nuovamente l'assegnazione al termine del worker attivo.

## Risorse correlate

- [Plugin Workboard](/it/plugins/workboard)
- [Riferimento della CLI](/it/cli)
- [Comandi slash](/it/tools/slash-commands)
- [Control UI](/it/web/control-ui)
