---
read_when:
    - Aggiunta o modifica del comportamento di `exec` in background
    - Debug di attività `exec` di lunga durata
summary: Esecuzione `exec` in background e gestione dei processi
title: '`exec` in background e strumento process'
x-i18n:
    generated_at: "2026-04-24T08:38:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6dbf6fd0ee39a053fda0a910e95827e9d0e31dcdfbbf542b6ba5d1d63aa48dc
    source_path: gateway/background-process.md
    workflow: 15
---

# `exec` in background + strumento process

OpenClaw esegue i comandi shell tramite lo strumento `exec` e mantiene in memoria le attività di lunga durata. Lo strumento `process` gestisce queste sessioni in background.

## strumento exec

Parametri chiave:

- `command` (obbligatorio)
- `yieldMs` (predefinito 10000): passa automaticamente in background dopo questo ritardo
- `background` (bool): passa immediatamente in background
- `timeout` (secondi, predefinito 1800): termina il processo dopo questo timeout
- `elevated` (bool): esegue fuori dalla sandbox se la modalità elevata è abilitata/consentita (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è `node`)
- Ti serve un vero TTY? Imposta `pty: true`.
- `workdir`, `env`

Comportamento:

- Le esecuzioni in primo piano restituiscono direttamente l'output.
- Quando passano in background (esplicitamente o per timeout), lo strumento restituisce `status: "running"` + `sessionId` e una breve coda dell'output.
- L'output viene mantenuto in memoria finché la sessione non viene interrogata o rimossa.
- Se lo strumento `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
- I comandi exec generati ricevono `OPENCLAW_SHELL=exec` per regole di shell/profilo sensibili al contesto.
- Per lavori di lunga durata che iniziano subito, avviali una sola volta e fai affidamento sul risveglio automatico al completamento quando è abilitato e il comando emette output o fallisce.
- Se il risveglio automatico al completamento non è disponibile, o se ti serve una conferma di successo silenziosa per un comando terminato correttamente senza output, usa `process` per confermare il completamento.
- Non simulare promemoria o follow-up ritardati con cicli `sleep` o polling ripetuto; usa Cron per lavori futuri.

## Bridging dei processi figli

Quando generi processi figli di lunga durata al di fuori degli strumenti exec/process (ad esempio, respawn della CLI o helper del gateway), collega l'helper di bridging dei processi figli così i segnali di terminazione vengono inoltrati e i listener vengono scollegati all'uscita/errore. Questo evita processi orfani su systemd e mantiene coerente il comportamento di arresto su tutte le piattaforme.

Override tramite ambiente:

- `PI_BASH_YIELD_MS`: yield predefinito (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limite dell'output in memoria (caratteri)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limite stdout/stderr in sospeso per stream (caratteri)
- `PI_BASH_JOB_TTL_MS`: TTL per sessioni concluse (ms, limitato tra 1m e 3h)

Configurazione (preferita):

- `tools.exec.backgroundMs` (predefinito 10000)
- `tools.exec.timeoutSec` (predefinito 1800)
- `tools.exec.cleanupMs` (predefinito 1800000)
- `tools.exec.notifyOnExit` (predefinito true): mette in coda un evento di sistema + richiede Heartbeat quando un exec in background termina.
- `tools.exec.notifyOnExitEmptySuccess` (predefinito false): quando è true, mette in coda anche eventi di completamento per esecuzioni in background riuscite che non hanno prodotto output.

## strumento process

Azioni:

- `list`: sessioni in esecuzione + concluse
- `poll`: scarica nuovo output per una sessione (riporta anche lo stato di uscita)
- `log`: legge l'output aggregato (supporta `offset` + `limit`)
- `write`: invia stdin (`data`, `eof` facoltativo)
- `send-keys`: invia token o byte di tasti espliciti a una sessione con supporto PTY
- `submit`: invia Enter / carriage return a una sessione con supporto PTY
- `paste`: invia testo letterale, facoltativamente racchiuso in modalità bracketed paste
- `kill`: termina una sessione in background
- `clear`: rimuove una sessione conclusa dalla memoria
- `remove`: termina se è in esecuzione, altrimenti rimuove se è conclusa

Note:

- Solo le sessioni passate in background vengono elencate/mantenute in memoria.
- Le sessioni vengono perse al riavvio del processo (nessuna persistenza su disco).
- I log delle sessioni vengono salvati nella cronologia chat solo se esegui `process poll/log` e il risultato dello strumento viene registrato.
- `process` è limitato per agente; vede solo le sessioni avviate da quell'agente.
- Usa `poll` / `log` per stato, log, conferma di successo silenziosa o
  conferma di completamento quando il risveglio automatico al completamento non è disponibile.
- Usa `write` / `send-keys` / `submit` / `paste` / `kill` quando hai bisogno di input
  o intervento.
- `process list` include un `name` derivato (verbo del comando + destinazione) per scansioni rapide.
- `process log` usa `offset`/`limit` basati su righe.
- Quando sia `offset` sia `limit` sono omessi, restituisce le ultime 200 righe e include un suggerimento di paginazione.
- Quando `offset` è fornito e `limit` è omesso, restituisce da `offset` fino alla fine (non limitato a 200).
- Il polling serve per lo stato on-demand, non per pianificare cicli di attesa. Se il lavoro deve
  avvenire più tardi, usa Cron.

## Esempi

Esegui un'attività lunga e interroga in seguito:

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

- [Exec tool](/it/tools/exec)
- [Exec approvals](/it/tools/exec-approvals)
