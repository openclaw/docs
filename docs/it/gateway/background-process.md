---
read_when:
    - Aggiunta o modifica del comportamento di exec in secondo piano
    - Debug delle attività exec di lunga durata
summary: Esecuzione in background di exec e gestione dei processi
title: Esecuzione in secondo piano e strumento per i processi
x-i18n:
    generated_at: "2026-05-10T19:33:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95fb986cf0c07ef3d054189ce2838b441ae24f07703f8edc1ddb8aca3a58b300
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
- `elevated` (bool): esegue fuori dalla sandbox se la modalità elevata è abilitata/consentita (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è `node`)
- Serve un vero TTY? Imposta `pty: true`.
- `workdir`, `env`

Comportamento:

- Le esecuzioni in primo piano restituiscono direttamente l'output.
- Quando viene passato in background (in modo esplicito o per timeout), lo strumento restituisce `status: "running"` + `sessionId` e una breve coda.
- Le esecuzioni in background e con `yieldMs` ereditano `tools.exec.timeoutSec`, a meno che la chiamata non fornisca un `timeout` esplicito.
- L'output viene mantenuto in memoria finché la sessione non viene interrogata o cancellata.
- Se lo strumento `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
- I comandi exec generati ricevono `OPENCLAW_SHELL=exec` per regole di shell/profilo consapevoli del contesto.
- Per lavori di lunga durata che iniziano ora, avviali una sola volta e affidati al
  risveglio automatico al completamento quando è abilitato e il comando emette output o fallisce.
- Se il risveglio automatico al completamento non è disponibile, o se ti serve la
  conferma di successo silenzioso per un comando terminato correttamente senza output, usa `process`
  per confermare il completamento.
- Non emulare promemoria o follow-up ritardati con cicli `sleep` o polling
  ripetuto; usa cron per il lavoro futuro.

## Bridging dei processi figlio

Quando generi processi figlio di lunga durata fuori dagli strumenti exec/process (per esempio, riavvii CLI o helper del Gateway), collega l'helper bridge per processi figlio in modo che i segnali di terminazione vengano inoltrati e i listener vengano sganciati all'uscita/errore. Questo evita processi orfani su systemd e mantiene coerente il comportamento di arresto tra piattaforme.

Override di ambiente:

- `PI_BASH_YIELD_MS`: yield predefinito (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limite dell'output in memoria (caratteri)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limite stdout/stderr in sospeso per stream (caratteri)
- `PI_BASH_JOB_TTL_MS`: TTL per le sessioni terminate (ms, limitato a 1m–3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: soglia di output inattivo prima che le sessioni in background scrivibili vengano contrassegnate come probabilmente in attesa di input (predefinito 15000 ms)

Configurazione (preferita):

- `tools.exec.backgroundMs` (predefinito 10000)
- `tools.exec.timeoutSec` (predefinito 1800)
- `tools.exec.cleanupMs` (predefinito 1800000)
- `tools.exec.notifyOnExit` (predefinito true): accoda un evento di sistema + richiede Heartbeat quando un exec in background termina.
- `tools.exec.notifyOnExitEmptySuccess` (predefinito false): quando true, accoda anche eventi di completamento per esecuzioni in background riuscite che non hanno prodotto output.

## Strumento process

Azioni:

- `list`: sessioni in esecuzione + terminate
- `poll`: scarica il nuovo output di una sessione (riporta anche lo stato di uscita)
- `log`: legge l'output aggregato e mostra suggerimenti per il recupero dell'input (supporta `offset` + `limit`)
- `write`: invia stdin (`data`, `eof` opzionale)
- `send-keys`: invia token di tasti espliciti o byte a una sessione basata su PTY
- `submit`: invia Invio / ritorno a capo a una sessione basata su PTY
- `paste`: invia testo letterale, opzionalmente racchiuso in modalità paste tra parentesi
- `kill`: termina una sessione in background
- `clear`: rimuove una sessione terminata dalla memoria
- `remove`: termina se in esecuzione, altrimenti cancella se terminata

Note:

- Solo le sessioni in background vengono elencate/persistite in memoria.
- Le sessioni vengono perse al riavvio del processo (nessuna persistenza su disco).
- I log delle sessioni vengono salvati nella cronologia della chat solo se esegui `process poll/log` e il risultato dello strumento viene registrato.
- `process` ha ambito per agente; vede solo le sessioni avviate da quell'agente.
- Usa `poll` / `log` per stato, log, conferma di successo silenzioso o
  conferma di completamento quando il risveglio automatico al completamento non è disponibile.
- Usa `log` prima di recuperare una CLI interattiva, così la trascrizione corrente,
  lo stato di stdin e il suggerimento di attesa input sono visibili insieme.
- Usa `write` / `send-keys` / `submit` / `paste` / `kill` quando hai bisogno di input
  o intervento.
- `process list` include un `name` derivato (verbo del comando + destinazione) per scansioni rapide.
- `process list`, `poll` e `log` riportano `waitingForInput` solo
  quando la sessione ha ancora stdin scrivibile ed è rimasta inattiva oltre la
  soglia di attesa input.
- `process log` usa `offset`/`limit` basati sulle righe.
- Quando sia `offset` sia `limit` sono omessi, restituisce le ultime 200 righe e include un suggerimento di paginazione.
- Quando `offset` è fornito e `limit` è omesso, restituisce da `offset` alla fine (non limitato a 200).
- Il polling serve per lo stato su richiesta, non per pianificare cicli di attesa. Se il lavoro deve
  avvenire più tardi, usa cron invece.

## Esempi

Esegui un'attività lunga e interroga più tardi:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Ispeziona una sessione interattiva prima di inviare input:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
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
