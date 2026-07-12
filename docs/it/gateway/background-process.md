---
read_when:
    - Aggiunta o modifica del comportamento di esecuzione in background
    - Debug delle attività exec di lunga durata
summary: Esecuzione in background e gestione dei processi
title: Esecuzione in background e strumento per i processi
x-i18n:
    generated_at: "2026-07-12T07:01:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw esegue i comandi shell tramite lo strumento `exec` e mantiene in memoria le attività di lunga durata. Lo strumento `process` gestisce queste sessioni in background.

## Strumento exec

Parametri:

| Parametro    | Descrizione                                                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Obbligatorio. Comando shell da eseguire.                                                                                                                                                                    |
| `workdir`    | Directory di lavoro; omettere per usare la cwd predefinita.                                                                                                                                                  |
| `env`        | Variabili di ambiente aggiuntive per il comando.                                                                                                                                                             |
| `yieldMs`    | Millisecondi di attesa prima del passaggio in background (valore predefinito: 10000).                                                                                                                        |
| `background` | Esegue immediatamente in background.                                                                                                                                                                        |
| `timeout`    | Timeout in secondi (valore predefinito: `tools.exec.timeoutSec`); termina il processo alla scadenza. Impostare `timeout: 0` per disabilitare il timeout del processo exec per quella chiamata.                |
| `pty`        | Esegue in uno pseudo-terminale, se disponibile (CLI che richiedono una TTY, agenti di programmazione).                                                                                                       |
| `elevated`   | Esegue al di fuori della sandbox se la modalità con privilegi elevati è abilitata/consentita (`gateway` per impostazione predefinita, oppure `node` quando la destinazione di exec è `node`).                 |
| `host`       | Destinazione di exec: `auto`, `sandbox`, `gateway` o `node`.                                                                                                                                                 |
| `node`       | ID/nome del Node, usato con `host: "node"`.                                                                                                                                                                  |

Comportamento:

- Le esecuzioni in primo piano restituiscono direttamente l'output.
- Quando l'esecuzione passa in background (esplicitamente o allo scadere di `yieldMs`), lo strumento restituisce `status: "running"` + `sessionId` e una breve parte finale dell'output.
- Le esecuzioni in background e quelle con `yieldMs` ereditano `tools.exec.timeoutSec`, a meno che la chiamata non specifichi un `timeout` esplicito.
- L'output rimane in memoria finché la sessione non viene interrogata o cancellata.
- Se lo strumento `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
- I comandi exec avviati ricevono `OPENCLAW_SHELL=exec` per le regole di shell/profilo sensibili al contesto.
- Per un'attività di lunga durata che inizia ora: avviarla una sola volta e affidarsi alla riattivazione automatica al completamento (se abilitata) quando il comando produce output o non riesce.
- Se la riattivazione automatica al completamento non è disponibile, oppure è necessaria la conferma di un completamento senza output per un comando che termina correttamente, interrogare lo stato con `process`.
- Non simulare promemoria o operazioni successive differite con cicli `sleep` o interrogazioni ripetute: usare Cron per le attività future.

### Sostituzioni tramite variabili di ambiente

| Variabile                                | Effetto                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Attesa predefinita prima del passaggio in background (ms). Valore predefinito: 10000, limitato all'intervallo 10-120000.                    |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Limite dell'output in memoria (caratteri).                                                                                                   |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Limite dell'output stdout/stderr in sospeso per ciascun flusso (caratteri).                                                                  |
| `OPENCLAW_BASH_JOB_TTL_MS`               | TTL delle sessioni terminate (ms), limitato all'intervallo 1 min-3 h.                                                                        |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Soglia di inattività dell'output prima che le sessioni in background con input scrivibile siano contrassegnate come probabilmente in attesa di input. Valore predefinito: 15000. |

### Configurazione (preferibile alle sostituzioni tramite variabili di ambiente)

| Chiave                                | Valore predefinito | Effetto                                                                                                     |
| ------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000              | Equivale a `OPENCLAW_BASH_YIELD_MS`.                                                                        |
| `tools.exec.timeoutSec`               | 1800               | Timeout predefinito per chiamata.                                                                           |
| `tools.exec.cleanupMs`                | 1800000            | Equivale a `OPENCLAW_BASH_JOB_TTL_MS`.                                                                      |
| `tools.exec.notifyOnExit`             | true               | Accoda un evento di sistema e richiede un Heartbeat quando un'esecuzione in background termina.            |
| `tools.exec.notifyOnExitEmptySuccess` | false              | Accoda anche eventi di completamento per le esecuzioni in background riuscite senza output.                |

## Collegamento dei processi figlio

Quando si avviano processi figlio di lunga durata al di fuori degli strumenti exec/process (riavvii della CLI, helper del Gateway), collegare l'helper bridge per i processi figlio, in modo che i segnali di terminazione vengano inoltrati e i listener vengano scollegati all'uscita o in caso di errore. Ciò evita processi orfani in systemd e mantiene coerente l'arresto tra le diverse piattaforme.

## Strumento process

Azioni:

| Azione      | Effetto                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| `list`      | Sessioni in esecuzione e terminate.                                                                         |
| `poll`      | Recupera il nuovo output di una sessione (segnala anche lo stato di uscita).                                |
| `log`       | Legge l'output aggregato e i suggerimenti per il ripristino dell'input. Supporta `offset` + `limit`.        |
| `write`     | Invia dati a stdin (`data`, con `eof` facoltativo).                                                         |
| `send-keys` | Invia token di tasti espliciti o byte a una sessione basata su PTY.                                         |
| `submit`    | Invia Invio/ritorno carrello a una sessione basata su PTY.                                                  |
| `paste`     | Invia testo letterale, facoltativamente racchiuso nella modalità di incolla con delimitatori.              |
| `kill`      | Termina una sessione in background.                                                                         |
| `clear`     | Rimuove dalla memoria una sessione terminata.                                                               |
| `remove`    | Termina la sessione se è in esecuzione; in caso contrario, la cancella se è terminata.                      |

Note:

- Vengono elencate e conservate solo le sessioni in background, esclusivamente in memoria e non su disco. Le sessioni vengono perse al riavvio del processo.
- Una sessione in background attiva impedisce la sospensione cooperativa dell'host e il riavvio sicuro del Gateway finché il proprietario del processo non ne conferma l'effettiva terminazione.
- `process remove` può nascondere immediatamente una sessione in esecuzione dopo averne richiesto la terminazione; la sospensione e il riavvio rimangono bloccati finché la terminazione non viene confermata.
- I registri delle sessioni vengono salvati nella cronologia della chat solo se si esegue `process poll`/`log` e il risultato dello strumento viene registrato.
- `process` ha un ambito per agente; vede solo le sessioni avviate da quell'agente.
- Usare `poll`/`log` per ottenere lo stato, i registri o la conferma del completamento quando la riattivazione automatica al completamento non è disponibile.
- Usare `log` prima di ripristinare una CLI interattiva, in modo da visualizzare insieme la trascrizione corrente, lo stato di stdin e l'indicazione di attesa dell'input.
- Usare `write`/`send-keys`/`submit`/`paste`/`kill` quando sono necessari input o interventi.
- `process list` include un `name` derivato (verbo del comando + destinazione) per una rapida consultazione.
- `process list`, `poll` e `log` segnalano `waitingForInput` solo quando la sessione dispone ancora di stdin scrivibile ed è inattiva da un periodo superiore alla soglia di attesa dell'input (valore predefinito: 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` usa `offset`/`limit` basati sulle righe. Quando entrambi sono omessi, restituisce le ultime 200 righe con un suggerimento per la paginazione. Quando `offset` è impostato e `limit` non lo è, restituisce da `offset` fino alla fine (senza il limite di 200).
- Il `timeout` di `poll` attende fino al numero specificato di millisecondi prima di restituire il risultato; i valori superiori a 30000 vengono limitati a 30000.
- L'interrogazione serve per ottenere lo stato su richiesta, non per pianificare cicli di attesa. Se l'attività deve essere eseguita in un secondo momento, usare Cron.

## Esempi

Eseguire un'attività di lunga durata e interrogarne lo stato in seguito:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Esaminare una sessione interattiva prima di inviare input:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Avviare immediatamente in background:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Inviare dati a stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Inviare tasti PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Inviare la riga corrente:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Incollare testo letterale:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Contenuti correlati

- [Strumento Exec](/it/tools/exec)
- [Approvazioni Exec](/it/tools/exec-approvals)
