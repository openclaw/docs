---
read_when:
    - Vuoi ispezionare o creare schede Workboard dal terminale
    - Vuoi avviare esecuzioni dei worker di Workboard dalla CLI
    - Stai eseguendo il debug del comportamento della CLI Workboard o dei comandi slash
summary: Riferimento CLI per schede `openclaw workboard`, dispatch ed esecuzioni dei worker
title: CLI della bacheca di lavoro
x-i18n:
    generated_at: "2026-06-27T17:23:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` è la superficie terminale per il
[Plugin Workboard](/it/plugins/workboard) incluso. Consente a un operatore di elencare le schede, creare una
scheda, ispezionare una scheda e chiedere al Gateway in esecuzione di inoltrare il lavoro pronto a
esecuzioni worker dei sottoagenti.

Abilita il Plugin prima di usare il comando:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Uso

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Il comando legge e scrive lo stesso database SQLite di proprietà del Plugin usato dalla
dashboard e dagli strumenti agente di Workboard. Gli id delle schede possono essere passati come id completo o come
prefisso non ambiguo quando un comando accetta un id scheda.

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

Le colonne sono prefisso id, stato, priorità, id board, id agente facoltativo e titolo.

Flag:

| Flag                 | Scopo                                         |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Limita i risultati a un solo spazio dei nomi board |
| `--status <status>`  | Limita i risultati a un solo stato Workboard  |
| `--include-archived` | Include le schede archiviate nell'output testuale compatto |
| `--json`             | Stampa l'elenco completo delle schede come JSON macchina |

Per impostazione predefinita, l'output testuale compatto nasconde le schede archiviate, così la CLI corrisponde al
comando `/workboard list`. Passa `--include-archived` per mostrarle. L'output JSON
mantiene l'elenco completo delle schede, incluse le schede archiviate, per le automazioni esistenti.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

Flag:

| Flag                    | Scopo                                      |
| ----------------------- | ------------------------------------------ |
| `--notes <text>`        | Note iniziali della scheda                 |
| `--status <status>`     | Stato iniziale, predefinito `todo`         |
| `--priority <priority>` | Priorità, predefinita `normal`             |
| `--agent <id>`          | Assegna la scheda a un agente o id proprietario |
| `--board <id>`          | Archivia la scheda in uno spazio dei nomi board |
| `--labels <items>`      | Etichette separate da virgole              |
| `--json`                | Stampa la scheda creata come JSON macchina |

`create` scrive direttamente nello stato SQLite di Workboard. La scheda è immediatamente
visibile nella scheda Workboard della Control UI e agli strumenti Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

L'output testuale stampa la riga compatta della scheda e le note. L'output JSON restituisce il record
completo della scheda, inclusi metadati di esecuzione, tentativi, commenti, link, prove,
artefatti, log worker, stato del protocollo, diagnostica e metadati di automazione.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` chiama prima il metodo RPC del Gateway in esecuzione
`workboard.cards.dispatch`. Quel percorso usa lo stesso runtime dei sottoagenti dell'azione di invio
della dashboard, quindi le schede pronte diventano esecuzioni worker tracciate come attività con
chiavi di sessione collegate. Le schede con un agente assegnato usano chiavi di sessione sottoagente
con ambito agente; le schede non assegnate mantengono una chiave sottoagente senza ambito, così l'agente
predefinito configurato del Gateway viene preservato.

Il ciclo di invio:

1. Promuove i figli con dipendenze pronte a `ready`.
2. Blocca assegnazioni scadute o esecuzioni worker scadute per timeout.
3. Registra i metadati di invio sulle schede pronte.
4. Seleziona un piccolo lotto di schede pronte non assegnate.
5. Assegna ogni scheda selezionata al dispatcher o all'agente assegnato.
6. Avvia un'esecuzione worker sottoagente con contesto scheda limitato e il token di assegnazione
   della scheda.
7. Archivia sulla scheda l'id dell'esecuzione worker, la chiave di sessione, il collegamento all'attività quando il registro attività del Gateway
   lo segnala, lo stato di esecuzione e il log worker.

La selezione è intenzionalmente conservativa. Per impostazione predefinita, un invio avvia al massimo tre
worker, ignora schede archiviate o già assegnate e avvia una sola
scheda per proprietario o agente in un singolo passaggio. Le schede già di proprietà di lavoro attivo in esecuzione
o in revisione vengono lasciate a un invio successivo.

Se l'avvio del worker non riesce dopo l'assegnazione di una scheda, Workboard blocca quella scheda,
cancella l'assegnazione e registra l'errore nei metadati di esecuzione scheda e log worker.
Questo mantiene visibili gli avvii non riusciti invece di restituire silenziosamente la
scheda alla coda.

Se non viene fornita alcuna destinazione Gateway esplicita e il Gateway locale non è disponibile
o non espone ancora il metodo di invio Workboard, la CLI ripiega sull'invio
solo dati sullo stato Workboard locale. L'invio solo dati può comunque
promuovere dipendenze, pulire assegnazioni obsolete e bloccare esecuzioni scadute per timeout, ma non
avvia worker. Errori di autenticazione, autorizzazione, validazione e gli errori per una
destinazione esplicita `--url` o `--token` vengono riportati direttamente.

L'output testuale riporta gli avvii dei worker:

```text
dispatch complete: started=2 failures=0
```

L'output di ripiego è esplicito:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

L'output JSON include il risultato dell'invio. L'invio tramite Gateway può includere
`started` e `startFailures`; il ripiego solo dati include
`gatewayUnavailable: true`. I token di assegnazione vengono oscurati dall'output JSON delle schede.

Nella dashboard, lo stesso risultato di invio viene mostrato come breve riepilogo, così un
operatore può vedere quante schede sono state avviate, promosse, bloccate, recuperate o
fallite senza aprire i dettagli delle schede.

## Parità dei comandi slash

I canali capaci di comandi possono usare il comando slash corrispondente:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Anche l'invio tramite comando slash usa il runtime dei sottoagenti del Gateway, quindi segue lo
stesso comportamento di assegnazione, avvio worker ed errore del percorso Gateway di dashboard e CLI.

`/workboard list` e `/workboard show` sono comandi di lettura per mittenti di comandi autorizzati.
`/workboard create` e `/workboard dispatch` modificano lo stato della board e
richiedono lo stato di proprietario sulle superfici chat o un client Gateway con `operator.write`
o `operator.admin`.

## Autorizzazioni

Il percorso di invio della CLI chiama RPC del Gateway con ambiti `operator.read` e
`operator.write`. Un token Gateway di sola lettura può ispezionare i dati Workboard
tramite metodi di lettura, ma non può creare schede né inviare worker.

I comandi locali `list`, `create` e `show` operano sulla directory di stato locale OpenClaw
usata dal profilo corrente. Usa `--dev` o `--profile <name>` sul
comando `openclaw` di livello superiore quando ti serve una radice di stato diversa.

## Risoluzione dei problemi

### Non compare nessuna scheda

Conferma che il Plugin sia abilitato per lo stesso profilo e la stessa radice di stato:

```bash
openclaw plugins inspect workboard --runtime --json
```

Se la dashboard mostra schede ma la CLI no, verifica che entrambi i comandi usino
la stessa impostazione `--dev` o `--profile`.

### Dispatch indica solo dati

Avvia o riavvia il Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Poi riprova `openclaw workboard dispatch`. Il ripiego solo dati è utile per la pulizia dello
stato locale, ma le esecuzioni worker richiedono un Gateway attivo.

### Dispatch non avvia nulla

Verifica che ci sia almeno una scheda `ready` senza un'assegnazione attiva:

```bash
openclaw workboard list --status ready
```

Le schede possono anche essere ignorate quando lo stesso proprietario ha già lavoro in esecuzione o in revisione.
Sposta il lavoro completato a `done`, rilascia le assegnazioni obsolete tramite gli strumenti Workboard
o esegui di nuovo dispatch dopo il completamento del worker attivo.

## Correlati

- [Plugin Workboard](/it/plugins/workboard)
- [Riferimento CLI](/it/cli)
- [Comandi slash](/it/tools/slash-commands)
- [Control UI](/it/web/control-ui)
