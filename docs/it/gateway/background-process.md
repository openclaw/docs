---
read_when:
    - Aggiunta o modifica del comportamento di exec in secondo piano
    - Debug delle attività exec a lunga esecuzione
summary: Esecuzione di exec in background e gestione dei processi
title: Strumento per l'esecuzione in background e la gestione dei processi
x-i18n:
    generated_at: "2026-05-06T08:49:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw esegue comandi shell tramite lo strumento `exec` e mantiene in memoria le attività di lunga durata. Lo strumento `process` gestisce queste sessioni in background.

## Strumento exec

Parametri chiave:

- `command` (obbligatorio)
- `yieldMs` (predefinito 10000): passa automaticamente in background dopo questo ritardo
- `background` (bool): passa immediatamente in background
- `timeout` (secondi, predefinito `tools.exec.timeoutSec`): termina il processo dopo questo timeout; imposta `timeout: 0` solo per disabilitare il timeout del processo exec per quella chiamata
- `elevated` (bool): esegui fuori dalla sandbox se la modalità elevata è abilitata/consentita (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è `node`)
- Serve una vera TTY? Imposta `pty: true`.
- `workdir`, `env`

Comportamento:

- Le esecuzioni in primo piano restituiscono direttamente l'output.
- Quando passa in background (esplicitamente o per timeout), lo strumento restituisce `status: "running"` + `sessionId` e una breve coda.
- Le esecuzioni in background e con `yieldMs` ereditano `tools.exec.timeoutSec` a meno che la chiamata non fornisca un `timeout` esplicito.
- L'output viene mantenuto in memoria finché la sessione non viene interrogata o cancellata.
- Se lo strumento `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
- I comandi exec avviati ricevono `OPENCLAW_SHELL=exec` per regole shell/profilo sensibili al contesto.
- Per lavori di lunga durata che iniziano ora, avviali una sola volta e affidati al risveglio automatico
  al completamento quando è abilitato e il comando emette output o fallisce.
- Se il risveglio automatico al completamento non è disponibile, oppure ti serve una conferma
  di riuscita silenziosa per un comando terminato correttamente senza output, usa `process`
  per confermare il completamento.
- Non emulare promemoria o follow-up ritardati con cicli `sleep` o polling
  ripetuto; usa cron per il lavoro futuro.

## Bridge dei processi figlio

Quando avvii processi figlio di lunga durata al di fuori degli strumenti exec/process (ad esempio riavvii della CLI o helper del gateway), collega l'helper di bridge dei processi figlio in modo che i segnali di terminazione vengano inoltrati e i listener vengano scollegati in caso di uscita/errore. Questo evita processi orfani su systemd e mantiene coerente il comportamento di arresto tra le piattaforme.

Override di ambiente:

- `PI_BASH_YIELD_MS`: yield predefinito (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limite dell'output in memoria (caratteri)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limite stdout/stderr in sospeso per stream (caratteri)
- `PI_BASH_JOB_TTL_MS`: TTL per le sessioni completate (ms, limitato a 1m–3h)

Configurazione (preferita):

- `tools.exec.backgroundMs` (predefinito 10000)
- `tools.exec.timeoutSec` (predefinito 1800)
- `tools.exec.cleanupMs` (predefinito 1800000)
- `tools.exec.notifyOnExit` (predefinito true): accoda un evento di sistema + richiede heartbeat quando un exec in background termina.
- `tools.exec.notifyOnExitEmptySuccess` (predefinito false): quando true, accoda anche eventi di completamento per esecuzioni in background riuscite che non hanno prodotto output.

## Strumento process

Azioni:

- `list`: sessioni in esecuzione + completate
- `poll`: scarica il nuovo output di una sessione (segnala anche lo stato di uscita)
- `log`: legge l'output aggregato (supporta `offset` + `limit`)
- `write`: invia stdin (`data`, `eof` opzionale)
- `send-keys`: invia token di tasti espliciti o byte a una sessione supportata da PTY
- `submit`: invia Invio / ritorno a capo a una sessione supportata da PTY
- `paste`: invia testo letterale, opzionalmente racchiuso in modalità incolla tra parentesi
- `kill`: termina una sessione in background
- `clear`: rimuove dalla memoria una sessione completata
- `remove`: termina se in esecuzione, altrimenti cancella se completata

Note:

- Solo le sessioni in background vengono elencate/persistite in memoria.
- Le sessioni vengono perse al riavvio del processo (nessuna persistenza su disco).
- I log delle sessioni vengono salvati nella cronologia chat solo se esegui `process poll/log` e il risultato dello strumento viene registrato.
- `process` ha ambito per agente; vede solo le sessioni avviate da quell'agente.
- Usa `poll` / `log` per stato, log, conferma di riuscita silenziosa oppure
  conferma del completamento quando il risveglio automatico al completamento non è disponibile.
- Usa `write` / `send-keys` / `submit` / `paste` / `kill` quando ti serve input
  o intervento.
- `process list` include un `name` derivato (verbo del comando + destinazione) per scansioni rapide.
- `process log` usa `offset`/`limit` basati sulle righe.
- Quando sia `offset` sia `limit` sono omessi, restituisce le ultime 200 righe e include un suggerimento di paginazione.
- Quando `offset` viene fornito e `limit` è omesso, restituisce da `offset` fino alla fine (senza limite a 200).
- Il polling serve per lo stato su richiesta, non per pianificare cicli di attesa. Se il lavoro deve
  avvenire più tardi, usa invece cron.

## Esempi

Esegui un'attività lunga e interrogala in seguito:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Avvia immediatamente in background:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Invia stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Invia tasti PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Invia la riga corrente:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Incolla testo letterale:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Correlati

- [Strumento Exec](/it/tools/exec)
- [Approvazioni Exec](/it/tools/exec-approvals)
