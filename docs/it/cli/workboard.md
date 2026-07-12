---
read_when:
    - Vuoi esaminare o creare schede Workboard dal terminale
    - Vuoi avviare esecuzioni dei worker Workboard dalla CLI
    - Stai eseguendo il debug del comportamento della CLI di Workboard o dei comandi slash
summary: Riferimento CLI per schede `openclaw workboard`, assegnazione ed esecuzioni dei worker
title: CLI Workboard
x-i18n:
    generated_at: "2026-07-12T06:55:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` è l'interfaccia da terminale per il [Plugin Workboard](/it/plugins/workboard) incluso. Consente a un operatore di elencare le schede, creare una scheda, esaminarne una e chiedere al Gateway in esecuzione di assegnare il lavoro pronto alle esecuzioni dei subagenti worker.

Abilita il Plugin prima di usare il comando:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Utilizzo

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Il comando legge e scrive nello stesso database SQLite di proprietà del Plugin utilizzato dalla dashboard e dagli strumenti dell'agente Workboard. Gli ID delle schede sono UUID; i comandi che accettano l'ID di una scheda accettano anche un prefisso non ambiguo dell'ID (l'output testuale compatto mostra i primi 8 caratteri).

Valori `status` validi: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Valori `priority` validi: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

L'output testuale è compatto:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

Le colonne sono il prefisso dell'ID, lo stato, la priorità, l'ID della bacheca, l'ID facoltativo dell'agente e il titolo.

| Flag                 | Scopo                                                        |
| -------------------- | ------------------------------------------------------------ |
| `--board <id>`       | Limita i risultati a uno spazio dei nomi della bacheca        |
| `--status <status>`  | Limita i risultati a uno stato di Workboard                   |
| `--include-archived` | Include le schede archiviate nell'output testuale compatto     |
| `--json`             | Stampa l'elenco completo delle schede come JSON elaborabile   |

Per impostazione predefinita, l'output testuale compatto nasconde le schede archiviate, in modo che la CLI corrisponda a `/workboard list`. Passa `--include-archived` per mostrarle. L'output JSON mantiene sempre l'elenco completo delle schede, incluse quelle archiviate, per le automazioni esistenti.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Flag                    | Scopo                                                   |
| ----------------------- | ------------------------------------------------------- |
| `--notes <text>`        | Note iniziali della scheda                              |
| `--status <status>`     | Stato iniziale, valore predefinito `todo`               |
| `--priority <priority>` | Priorità, valore predefinito `normal`                   |
| `--agent <id>`          | Assegna la scheda all'ID di un agente o proprietario    |
| `--board <id>`          | Memorizza la scheda in uno spazio dei nomi della bacheca |
| `--labels <items>`      | Etichette separate da virgole                           |
| `--json`                | Stampa la scheda creata come JSON elaborabile           |

`create` scrive direttamente nello stato SQLite di Workboard. La scheda è immediatamente visibile nella scheda Workboard della Control UI e agli strumenti Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

L'output testuale stampa la riga compatta della scheda e le note. L'output JSON restituisce il record completo della scheda, inclusi i metadati di esecuzione, i tentativi, i commenti, i collegamenti, le prove, gli artefatti, i log dei worker, lo stato del protocollo, la diagnostica e i metadati di automazione.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` chiama innanzitutto il metodo RPC `workboard.cards.dispatch` del Gateway in esecuzione, che utilizza lo stesso runtime dei subagenti dell'azione di assegnazione della dashboard, così le schede pronte diventano esecuzioni worker monitorate come attività con chiavi di sessione collegate. Le schede con un agente assegnato utilizzano chiavi di sessione dei subagenti limitate all'agente; le schede non assegnate mantengono una chiave di subagente senza ambito, così viene preservato l'agente predefinito configurato nel Gateway.

Il ciclo di assegnazione:

1. Promuove a `ready` le schede figlie le cui dipendenze sono pronte.
2. Blocca le rivendicazioni scadute o le esecuzioni worker che hanno superato il tempo massimo.
3. Registra i metadati di assegnazione sulle schede pronte.
4. Seleziona un piccolo gruppo di schede pronte non rivendicate.
5. Rivendica ogni scheda selezionata per il dispatcher o l'agente assegnato.
6. Avvia un'esecuzione worker di un subagente con il contesto limitato della scheda e il token di rivendicazione della scheda.
7. Memorizza nella scheda l'ID dell'esecuzione worker, la chiave di sessione, il collegamento all'attività quando viene segnalato dal registro delle attività del Gateway, lo stato di esecuzione e il log del worker.

La selezione è prudente: per impostazione predefinita, una singola assegnazione avvia al massimo tre worker, ignora le schede archiviate o già rivendicate e avvia una sola scheda per proprietario o agente in ciascun passaggio. Le schede già appartenenti a lavori attivi in esecuzione o in revisione vengono lasciate a un'assegnazione successiva.

Se l'avvio del worker non riesce dopo che una scheda è stata rivendicata, Workboard blocca la scheda, cancella la rivendicazione e registra l'errore nei metadati di esecuzione e del log del worker della scheda, mantenendo visibili gli avvii non riusciti anziché restituire silenziosamente la scheda alla coda.

Se non viene specificata una destinazione Gateway esplicita e il Gateway locale non è disponibile o non espone ancora il metodo di assegnazione di Workboard, la CLI ripiega sull'assegnazione basata solo sui dati rispetto allo stato locale di Workboard. L'assegnazione basata solo sui dati può comunque promuovere le dipendenze, rimuovere le rivendicazioni obsolete e bloccare le esecuzioni che hanno superato il tempo massimo, ma non avvia i worker. Gli errori di autenticazione, autorizzazione e convalida, nonché gli errori relativi a una destinazione `--url` o `--token` esplicita, vengono segnalati direttamente anziché attivare il ripiego.

L'output testuale segnala gli avvii dei worker:

```text
dispatch complete: started=2 failures=0
```

L'output del ripiego è esplicito:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

L'output JSON include il risultato dell'assegnazione. L'assegnazione supportata dal Gateway può includere `started` e `startFailures`; il ripiego basato solo sui dati include `gatewayUnavailable: true`. I token di rivendicazione vengono oscurati nell'output JSON delle schede.

Nella dashboard, lo stesso risultato dell'assegnazione viene mostrato come un breve riepilogo, così un operatore può vedere quante schede sono state avviate, promosse, bloccate, rivendicate nuovamente o non sono riuscite senza aprire i dettagli delle schede.

## Parità dei comandi slash

I canali che supportano i comandi possono utilizzare il comando slash corrispondente:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Anche l'assegnazione tramite comando slash utilizza il runtime dei subagenti del Gateway, quindi segue lo stesso comportamento di rivendicazione, avvio dei worker e gestione degli errori del percorso Gateway della dashboard e della CLI.

`/workboard list` e `/workboard show` sono comandi di lettura per i mittenti autorizzati dei comandi. `/workboard create` e `/workboard dispatch` modificano lo stato della bacheca e richiedono lo stato di proprietario nelle interfacce di chat oppure un client Gateway con `operator.write` o `operator.admin`.

## Autorizzazioni

Il percorso di assegnazione della CLI chiama RPC del Gateway con gli ambiti `operator.read` e `operator.write`. Un token Gateway di sola lettura può esaminare i dati di Workboard tramite i metodi di lettura, ma non può creare schede né assegnare worker.

I comandi locali `list`, `create` e `show` operano sulla directory di stato locale di OpenClaw utilizzata dal profilo corrente. Usa `--dev` o `--profile <name>` nel comando `openclaw` di livello superiore quando ti serve una radice di stato diversa.

## Risoluzione dei problemi

### Non appare alcuna scheda

Verifica che il Plugin sia abilitato per lo stesso profilo e la stessa radice di stato:

```bash
openclaw plugins inspect workboard --runtime --json
```

Se la dashboard mostra le schede ma la CLI no, verifica che entrambi i comandi utilizzino la stessa impostazione `--dev` o `--profile`.

### L'assegnazione indica che opera solo sui dati

Avvia o riavvia il Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Quindi riprova `openclaw workboard dispatch`. Il ripiego basato solo sui dati è utile per la pulizia dello stato locale, ma le esecuzioni worker richiedono un Gateway attivo.

### L'assegnazione non avvia nulla

Verifica che sia presente almeno una scheda `ready` senza una rivendicazione attiva:

```bash
openclaw workboard list --status ready
```

Le schede possono essere ignorate anche quando lo stesso proprietario ha già un lavoro in esecuzione o in revisione. Sposta il lavoro completato in `done`, libera le rivendicazioni obsolete tramite gli strumenti Workboard oppure esegui nuovamente l'assegnazione dopo il completamento del worker attivo.

## Argomenti correlati

- [Plugin Workboard](/it/plugins/workboard)
- [Riferimento della CLI](/it/cli)
- [Comandi slash](/it/tools/slash-commands)
- [Control UI](/it/web/control-ui)
