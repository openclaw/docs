---
read_when:
    - Debug degli eventi ripetuti di completamento exec del Node
    - Lavoro sulla deduplica degli eventi di sistema/Heartbeat
summary: Note di indagine per l'iniezione duplicata del completamento exec asincrono
title: Indagine sulla duplicazione del completamento di exec asincrono
x-i18n:
    generated_at: "2026-04-23T08:35:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Indagine sulla duplicazione del completamento di exec asincrono

## Ambito

- Sessione: `agent:main:telegram:group:-1003774691294:topic:1`
- Sintomo: lo stesso completamento exec asincrono per sessione/run `keen-nexus` è stato registrato due volte in LCM come turni utente.
- Obiettivo: identificare se questo sia molto probabilmente un'iniezione duplicata nella sessione o un semplice retry della consegna in uscita.

## Conclusione

Molto probabilmente si tratta di **iniezione duplicata nella sessione**, non di un puro retry della consegna in uscita.

La lacuna più forte lato Gateway è nel **percorso di completamento exec del Node**:

1. Il completamento di exec lato Node emette `exec.finished` con il `runId` completo.
2. Il Gateway `server-node-events` converte questo in un evento di sistema e richiede un Heartbeat.
3. L'esecuzione Heartbeat inietta il blocco di eventi di sistema drenati nel prompt dell'agente.
4. Il runner incorporato mantiene quel prompt come nuovo turno utente nella trascrizione della sessione.

Se lo stesso `exec.finished` raggiunge il Gateway due volte per lo stesso `runId` per qualsiasi motivo (replay, duplicato alla riconnessione, reinvio upstream, producer duplicato), OpenClaw attualmente **non ha alcun controllo di idempotenza con chiave `runId`/`contextKey`** su questo percorso. La seconda copia diventerà un secondo messaggio utente con lo stesso contenuto.

## Percorso di codice esatto

### 1. Producer: evento di completamento exec del Node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emette `node.event` con evento `exec.finished`.
  - Il payload include `sessionKey` e `runId` completo.

### 2. Ingestione eventi del Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Gestisce `exec.finished`.
  - Costruisce il testo:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Lo accoda tramite:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Richiede immediatamente un wake:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Debolezza nella deduplica degli eventi di sistema

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` sopprime solo **testo duplicato consecutivo**:
    - `if (entry.lastText === cleaned) return false`
  - Memorizza `contextKey`, ma **non** usa `contextKey` per l'idempotenza.
  - Dopo il drain, la soppressione dei duplicati si azzera.

Questo significa che un `exec.finished` riprodotto con lo stesso `runId` può essere accettato di nuovo più tardi, anche se il codice aveva già un candidato stabile per l'idempotenza (`exec:<runId>`).

### 4. La gestione dei wake non è il duplicatore primario

- `src/infra/heartbeat-wake.ts:79-117`
  - I wake vengono coalescenti per `(agentId, sessionKey)`.
  - Richieste wake duplicate per lo stesso target collassano in una singola voce wake in sospeso.

Questo rende **la sola gestione dei wake duplicati** una spiegazione più debole rispetto all'ingestione duplicata degli eventi.

### 5. Heartbeat consuma l'evento e lo trasforma in input del prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - Il preflight esamina gli eventi di sistema in sospeso e classifica le esecuzioni exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` drena la coda per la sessione.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Il blocco drenato degli eventi di sistema viene anteposto al corpo del prompt dell'agente.

### 6. Punto di iniezione nella trascrizione

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` invia il prompt completo alla sessione PI incorporata.
  - Questo è il punto in cui il prompt derivato dal completamento diventa un turno utente persistito.

Quindi, una volta che lo stesso evento di sistema viene ricostruito due volte nel prompt, sono attesi messaggi utente LCM duplicati.

## Perché un semplice retry della consegna in uscita è meno probabile

Esiste un vero percorso di errore in uscita nel runner Heartbeat:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - La risposta viene generata per prima.
  - La consegna in uscita avviene più tardi tramite `deliverOutboundPayloads(...)`.
  - Un errore lì restituisce `{ status: "failed" }`.

Tuttavia, per la stessa voce della coda eventi di sistema, questo da solo **non è sufficiente** a spiegare i turni utente duplicati:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - La coda eventi di sistema è già stata drenata prima della consegna in uscita.

Quindi un retry del solo invio sul canale non ricreerebbe da solo la stessa identica voce accodata. Potrebbe spiegare una consegna esterna mancante/fallita, ma non da solo un secondo messaggio utente identico nella sessione.

## Possibilità secondaria, a confidenza inferiore

Esiste un loop di retry dell'intera esecuzione nel runner agente:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Alcuni errori transitori possono ritentare l'intera esecuzione e reinviare lo stesso `commandBody`.

Questo può duplicare un prompt utente persistito **all'interno della stessa esecuzione di risposta** se il prompt era già stato aggiunto prima che si attivasse la condizione di retry.

La considero meno probabile dell'ingestione duplicata di `exec.finished` perché:

- l'intervallo osservato era di circa 51 secondi, che sembra più un secondo wake/turno che un retry in-process;
- la segnalazione cita già errori ripetuti di invio del messaggio, il che punta più a un turno separato successivo che a un retry immediato del modello/runtime.

## Ipotesi sulla causa radice

Ipotesi a più alta confidenza:

- Il completamento `keen-nexus` è arrivato tramite il **percorso evento exec del Node**.
- Lo stesso `exec.finished` è stato consegnato due volte a `server-node-events`.
- Il Gateway ha accettato entrambe le volte perché `enqueueSystemEvent(...)` non fa deduplica per `contextKey` / `runId`.
- Ogni evento accettato ha attivato un Heartbeat ed è stato iniettato come turno utente nella trascrizione PI.

## Piccola correzione chirurgica proposta

Se si desidera una correzione, il cambiamento minimo ad alto valore è:

- fare in modo che l'idempotenza degli eventi exec/system tenga conto di `contextKey` su un breve orizzonte, almeno per ripetizioni esatte di `(sessionKey, contextKey, text)`;
- oppure aggiungere una deduplica dedicata in `server-node-events` per `exec.finished` con chiave `(sessionKey, runId, event kind)`.

Questo bloccherebbe direttamente i duplicati riprodotti di `exec.finished` prima che diventino turni di sessione.
