---
read_when:
    - Aggiunta o modifica del comportamento di exec in background
    - Debug delle attività exec a lunga esecuzione
summary: Esecuzione exec in background e gestione dei processi
title: Esecuzione in background e strumento per processi
x-i18n:
    generated_at: "2026-04-30T08:49:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 16
---

# Strumento Exec in background + strumento Process

OpenClaw esegue comandi shell tramite lo strumento `exec` e mantiene in memoria le attività di lunga durata. Lo strumento `process` gestisce queste sessioni in background.

## strumento exec

Parametri principali:

- `command` (obbligatorio)
- `yieldMs` (predefinito 10000): passa automaticamente in background dopo questo ritardo
- `background` (bool): passa subito in background
- `timeout` (secondi, predefinito `tools.exec.timeoutSec`): termina il processo dopo questo timeout; imposta `timeout: 0` solo per disabilitare il timeout del processo exec per quella chiamata
- `elevated` (bool): esegue fuori dalla sandbox se la modalità elevata è abilitata/consentita (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è `node`)
- Serve una vera TTY? Imposta `pty: true`.
- `workdir`, `env`

Comportamento:

- Le esecuzioni in primo piano restituiscono direttamente l'output.
- Quando passa in background (esplicitamente o per timeout), lo strumento restituisce `status: "running"` + `sessionId` e una breve coda.
- Le esecuzioni in background e con `yieldMs` ereditano `tools.exec.timeoutSec` a meno che la chiamata non fornisca un `timeout` esplicito.
- L'output viene mantenuto in memoria finché la sessione non viene interrogata o cancellata.
- Se lo strumento `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
- I comandi exec generati ricevono `OPENCLAW_SHELL=exec` per regole shell/profilo consapevoli del contesto.
- Per lavori di lunga durata che iniziano ora, avviali una sola volta e affidati al risveglio automatico al completamento quando è abilitato e il comando emette output o fallisce.
- Se il risveglio automatico al completamento non è disponibile, o serve una conferma di successo silenzioso per un comando terminato correttamente senza output, usa `process` per confermare il completamento.
- Non emulare promemoria o follow-up ritardati con cicli `sleep` o polling ripetuto; usa cron per il lavoro futuro.

## Collegamento dei processi figli

Quando si generano processi figli di lunga durata fuori dagli strumenti exec/process (ad esempio, riavvii della CLI o helper del Gateway), collega l'helper bridge per processi figli così che i segnali di terminazione vengano inoltrati e i listener vengano rimossi all'uscita/errore. Questo evita processi orfani su systemd e mantiene coerente il comportamento di arresto tra le piattaforme.

Override di ambiente:

- `PI_BASH_YIELD_MS`: yield predefinito (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limite dell'output in memoria (caratteri)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limite di stdout/stderr in sospeso per stream (caratteri)
- `PI_BASH_JOB_TTL_MS`: TTL per le sessioni terminate (ms, limitato a 1m-3h)

Configurazione (preferita):

- `tools.exec.backgroundMs` (predefinito 10000)
- `tools.exec.timeoutSec` (predefinito 1800)
- `tools.exec.cleanupMs` (predefinito 1800000)
- `tools.exec.notifyOnExit` (predefinito true): accoda un evento di sistema + richiede Heartbeat quando un exec in background termina.
- `tools.exec.notifyOnExitEmptySuccess` (predefinito false): quando è true, accoda anche eventi di completamento per esecuzioni in background riuscite che non hanno prodotto output.

## strumento process

Azioni:

- `list`: sessioni in esecuzione + terminate
- `poll`: scarica il nuovo output di una sessione (segnala anche lo stato di uscita)
- `log`: legge l'output aggregato (supporta `offset` + `limit`)
- `write`: invia stdin (`data`, `eof` opzionale)
- `send-keys`: invia token di tasti espliciti o byte a una sessione basata su PTY
- `submit`: invia Invio / ritorno carrello a una sessione basata su PTY
- `paste`: invia testo letterale, opzionalmente racchiuso in modalità incolla con parentesi
- `kill`: termina una sessione in background
- `clear`: rimuove dalla memoria una sessione terminata
- `remove`: termina se in esecuzione, altrimenti cancella se terminata

Note:

- Solo le sessioni in background vengono elencate/persistite in memoria.
- Le sessioni vengono perse al riavvio del processo (nessuna persistenza su disco).
- I log delle sessioni vengono salvati nella cronologia chat solo se esegui `process poll/log` e il risultato dello strumento viene registrato.
- `process` è limitato al singolo agent; vede solo le sessioni avviate da quell'agent.
- Usa `poll` / `log` per stato, log, conferma di successo silenzioso o conferma di completamento quando il risveglio automatico al completamento non è disponibile.
- Usa `write` / `send-keys` / `submit` / `paste` / `kill` quando serve input o intervento.
- `process list` include un `name` derivato (verbo del comando + destinazione) per scansioni rapide.
- `process log` usa `offset`/`limit` basati sulle righe.
- Quando sia `offset` sia `limit` sono omessi, restituisce le ultime 200 righe e include un suggerimento di paginazione.
- Quando `offset` è fornito e `limit` è omesso, restituisce da `offset` alla fine (non limitato a 200).
- Il polling serve per lo stato su richiesta, non per pianificare cicli di attesa. Se il lavoro deve avvenire più tardi, usa invece cron.

## Esempi

Esegui un'attività lunga e interrogala in seguito:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Avvia subito in background:

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
