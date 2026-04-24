---
read_when:
    - |-
      Eseguire il debug di eventi ripetuti di completamento exec Nodeลดสปีด to=final code```
      Eseguire il debug di eventi ripetuti di completamento exec Node
      ```
    - Lavorare sulla deduplicazione di Heartbeat/eventi di sistema
summary: Note di indagine per l’iniezione duplicata del completamento exec asincrono
title: Indagine sul completamento duplicato dell’exec asincrono
x-i18n:
    generated_at: "2026-04-24T08:59:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## Ambito

- Sessione: `agent:main:telegram:group:-1003774691294:topic:1`
- Sintomo: lo stesso completamento exec asincrono per sessione/esecuzione `keen-nexus` è stato registrato due volte in LCM come turni utente.
- Obiettivo: identificare se è più probabile un’iniezione duplicata della sessione o un semplice retry della consegna in uscita.

## Conclusione

Molto probabilmente si tratta di **iniezione duplicata della sessione**, non di un puro retry della consegna in uscita.

Il punto debole più forte lato gateway è nel **percorso di completamento exec del node**:

1. Un termine exec lato node emette `exec.finished` con il `runId` completo.
2. Il Gateway `server-node-events` lo converte in un evento di sistema e richiede un Heartbeat.
3. L’esecuzione Heartbeat inietta il blocco di eventi di sistema drenati nel prompt dell’agente.
4. L’embedded runner persiste quel prompt come nuovo turno utente nella trascrizione della sessione.

Se lo stesso `exec.finished` raggiunge il gateway due volte per lo stesso `runId` per qualsiasi motivo (replay, duplicate da reconnessione, resend upstream, producer duplicato), OpenClaw attualmente **non ha alcun controllo di idempotenza con chiave `runId`/`contextKey`** su questo percorso. La seconda copia diventerà un secondo messaggio utente con lo stesso contenuto.

## Percorso di codice esatto

### 1. Producer: evento di completamento exec del node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emette `node.event` con evento `exec.finished`.
  - Il payload include `sessionKey` e il `runId` completo.

### 2. Ingestione evento nel Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Gestisce `exec.finished`.
  - Costruisce il testo:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Lo accoda tramite:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Richiede immediatamente un wake:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Debolezza nella deduplicazione degli eventi di sistema

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` sopprime solo i **duplicati di testo consecutivi**:
    - `if (entry.lastText === cleaned) return false`
  - Memorizza `contextKey`, ma **non** usa `contextKey` per l’idempotenza.
  - Dopo il drain, la soppressione dei duplicati si azzera.

Questo significa che un `exec.finished` riprodotto con lo stesso `runId` può essere accettato di nuovo più tardi, anche se il codice aveva già un candidato stabile di idempotenza (`exec:<runId>`).

### 4. La gestione del wake non è il duplicatore principale

- `src/infra/heartbeat-wake.ts:79-117`
  - I wake vengono coalescenti per `(agentId, sessionKey)`.
  - Le richieste di wake duplicate per lo stesso target collassano in una sola voce wake in sospeso.

Questo rende la **sola gestione dei wake duplicati** una spiegazione più debole rispetto all’ingestione duplicata degli eventi.

### 5. Heartbeat consuma l’evento e lo trasforma in input di prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - Il preflight fa peek degli eventi di sistema in sospeso e classifica le esecuzioni exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` drena la coda per la sessione.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Il blocco di eventi di sistema drenato viene anteposto nel body del prompt dell’agente.

### 6. Punto di iniezione nella trascrizione

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` invia il prompt completo alla sessione PI embedded.
  - Questo è il punto in cui il prompt derivato dal completamento diventa un turno utente persistito.

Quindi, una volta che lo stesso evento di sistema viene ricostruito due volte nel prompt, i messaggi utente duplicati in LCM sono attesi.

## Perché è meno probabile un semplice retry della consegna in uscita

Esiste un reale percorso di fallimento in uscita nel runner Heartbeat:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - La risposta viene generata prima.
  - La consegna in uscita avviene più tardi tramite `deliverOutboundPayloads(...)`.
  - Un fallimento lì restituisce `{ status: "failed" }`.

Tuttavia, per la stessa voce della coda di eventi di sistema, questo da solo **non basta** a spiegare i turni utente duplicati:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - La coda di eventi di sistema è già stata drenata prima della consegna in uscita.

Quindi un retry di invio del canale da solo non ricreerebbe la stessa voce evento accodata. Potrebbe spiegare una consegna esterna mancante/fallita, ma non da solo un secondo messaggio utente identico nella sessione.

## Possibilità secondaria, a confidenza più bassa

Esiste un ciclo di retry dell’intera esecuzione nel runner dell’agente:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Alcuni fallimenti transitori possono ritentare l’intera esecuzione e reinviare lo stesso `commandBody`.

Questo può duplicare un prompt utente persistito **dentro la stessa esecuzione di risposta** se il prompt era già stato aggiunto prima che si attivasse la condizione di retry.

La considero meno probabile rispetto all’ingestione duplicata di `exec.finished` perché:

- il divario osservato era di circa 51 secondi, che sembra più un secondo wake/turno che un retry in-process;
- il report menziona già ripetuti fallimenti di invio del messaggio, il che punta più a un turno separato successivo che a un retry immediato del modello/runtime.

## Ipotesi sulla causa radice

Ipotesi con il più alto grado di confidenza:

- Il completamento `keen-nexus` è arrivato tramite il **percorso evento exec del node**.
- Lo stesso `exec.finished` è stato consegnato due volte a `server-node-events`.
- Il Gateway ha accettato entrambe le copie perché `enqueueSystemEvent(...)` non deduplica per `contextKey` / `runId`.
- Ogni evento accettato ha attivato un Heartbeat ed è stato iniettato come turno utente nella trascrizione PI.

## Piccola correzione chirurgica proposta

Se si vuole una correzione, il cambiamento minimo ad alto valore è:

- fare in modo che l’idempotenza degli eventi exec/system onori `contextKey` per un breve orizzonte, almeno per ripetizioni esatte di `(sessionKey, contextKey, text)`;
- oppure aggiungere una deduplicazione dedicata in `server-node-events` per `exec.finished` con chiave `(sessionKey, runId, event kind)`.

Questo bloccherebbe direttamente i duplicati riprodotti di `exec.finished` prima che diventino turni di sessione.

## Correlati

- [Strumento Exec](/it/tools/exec)
- [Gestione delle sessioni](/it/concepts/session)
