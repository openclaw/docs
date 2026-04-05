---
read_when:
    - Aggiunta o modifica del comportamento exec in background
    - Debug delle attività exec di lunga durata
summary: Esecuzione exec in background e gestione dei processi
title: Exec in background e strumento Process
x-i18n:
    generated_at: "2026-04-05T13:51:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4398e2850f6f050944f103ad637cd9f578e9cc7fb478bc5cd5d972c92289b831
    source_path: gateway/background-process.md
    workflow: 15
---

# Exec in background + strumento Process

OpenClaw esegue i comandi shell tramite lo strumento `exec` e mantiene in memoria le attività di lunga durata. Lo strumento `process` gestisce queste sessioni in background.

## Strumento exec

Parametri chiave:

- `command` (obbligatorio)
- `yieldMs` (predefinito 10000): passa automaticamente in background dopo questo ritardo
- `background` (bool): passa immediatamente in background
- `timeout` (secondi, predefinito 1800): termina il processo dopo questo timeout
- `elevated` (bool): esegue fuori dalla sandbox se la modalità elevata è abilitata/consentita (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è `node`)
- Serve un vero TTY? Imposta `pty: true`.
- `workdir`, `env`

Comportamento:

- Le esecuzioni in primo piano restituiscono direttamente l'output.
- Quando passa in background (esplicitamente o per timeout), lo strumento restituisce `status: "running"` + `sessionId` e una breve coda dell'output.
- L'output viene mantenuto in memoria finché la sessione non viene sondata o rimossa.
- Se lo strumento `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
- I comandi exec avviati ricevono `OPENCLAW_SHELL=exec` per regole della shell/profilo sensibili al contesto.
- Per attività di lunga durata che iniziano ora, avviale una sola volta e fai affidamento sul risveglio automatico al completamento quando è abilitato e il comando produce output o fallisce.
- Se il risveglio automatico al completamento non è disponibile, oppure ti serve la conferma di successo silenzioso per un comando che è terminato correttamente senza output, usa `process` per confermare il completamento.
- Non simulare promemoria o follow-up ritardati con loop `sleep` o polling ripetuto; usa cron per il lavoro futuro.

## Bridging dei processi figli

Quando avvii processi figli di lunga durata al di fuori degli strumenti exec/process (per esempio, respawn della CLI o helper del gateway), collega l'helper di bridging dei processi figli in modo che i segnali di terminazione vengano inoltrati e i listener vengano scollegati in caso di uscita/errore. Questo evita processi orfani su systemd e mantiene coerente il comportamento di arresto su tutte le piattaforme.

Override dell'ambiente:

- `PI_BASH_YIELD_MS`: yield predefinito (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limite di output in memoria (caratteri)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limite stdout/stderr in sospeso per stream (caratteri)
- `PI_BASH_JOB_TTL_MS`: TTL per le sessioni terminate (ms, limitato a 1m–3h)

Configurazione (consigliata):

- `tools.exec.backgroundMs` (predefinito 10000)
- `tools.exec.timeoutSec` (predefinito 1800)
- `tools.exec.cleanupMs` (predefinito 1800000)
- `tools.exec.notifyOnExit` (predefinito true): mette in coda un evento di sistema + richiede un heartbeat quando un exec in background termina.
- `tools.exec.notifyOnExitEmptySuccess` (predefinito false): quando è true, mette in coda anche eventi di completamento per esecuzioni in background riuscite che non hanno prodotto output.

## Strumento process

Azioni:

- `list`: sessioni in esecuzione + terminate
- `poll`: scarica il nuovo output per una sessione (riporta anche lo stato di uscita)
- `log`: legge l'output aggregato (supporta `offset` + `limit`)
- `write`: invia stdin (`data`, `eof` facoltativo)
- `send-keys`: invia token di tasti espliciti o byte a una sessione supportata da PTY
- `submit`: invia Enter / ritorno a capo a una sessione supportata da PTY
- `paste`: invia testo letterale, facoltativamente racchiuso nella modalità di incolla delimitata
- `kill`: termina una sessione in background
- `clear`: rimuove dalla memoria una sessione terminata
- `remove`: termina se è in esecuzione, altrimenti rimuove se è terminata

Note:

- Solo le sessioni passate in background vengono elencate/conservate in memoria.
- Le sessioni vengono perse al riavvio del processo (nessuna persistenza su disco).
- I log delle sessioni vengono salvati nella cronologia chat solo se esegui `process poll/log` e il risultato dello strumento viene registrato.
- `process` è limitato per agente; vede solo le sessioni avviate da quell'agente.
- Usa `poll` / `log` per stato, log, conferma di successo silenzioso o conferma di completamento quando il risveglio automatico al completamento non è disponibile.
- Usa `write` / `send-keys` / `submit` / `paste` / `kill` quando ti servono input o interventi.
- `process list` include un `name` derivato (verbo del comando + destinazione) per scansioni rapide.
- `process log` usa `offset`/`limit` basati sulle righe.
- Quando sia `offset` sia `limit` vengono omessi, restituisce le ultime 200 righe e include un suggerimento per l'impaginazione.
- Quando viene fornito `offset` e `limit` viene omesso, restituisce da `offset` fino alla fine (non limitato a 200).
- Il polling serve per lo stato on-demand, non per pianificare cicli di attesa. Se il lavoro deve avvenire in seguito, usa cron.

## Esempi

Esegui un'attività lunga e sondala più tardi:

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
