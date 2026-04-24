---
read_when:
    - Depurar eventos repetidos de finalización de exec de nodo
    - Trabajar en la deduplicación de Heartbeat/eventos del sistema
summary: Notas de investigación sobre la inyección duplicada de finalización asíncrona de exec
title: Investigación de finalización duplicada de exec asíncrona
x-i18n:
    generated_at: "2026-04-24T05:47:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## Alcance

- Sesión: `agent:main:telegram:group:-1003774691294:topic:1`
- Síntoma: la misma finalización asíncrona de exec para la sesión/ejecución `keen-nexus` se registró dos veces en LCM como turnos de usuario.
- Objetivo: identificar si lo más probable es que se trate de una inyección duplicada en la sesión o de un simple reintento de entrega saliente.

## Conclusión

Lo más probable es que esto sea una **inyección duplicada en la sesión**, no un simple reintento de entrega saliente.

La brecha más fuerte en el lado de Gateway está en la **ruta de finalización de exec del nodo**:

1. Una finalización de exec del nodo emite `exec.finished` con el `runId` completo.
2. Gateway `server-node-events` convierte eso en un evento del sistema y solicita un Heartbeat.
3. La ejecución de Heartbeat inyecta el bloque drenado de eventos del sistema en el prompt del agente.
4. El ejecutor embebido conserva ese prompt como un nuevo turno de usuario en la transcripción de la sesión.

Si el mismo `exec.finished` llega a Gateway dos veces para el mismo `runId` por cualquier motivo (repetición, duplicado por reconexión, reenvío upstream, productor duplicado), OpenClaw actualmente **no tiene ninguna comprobación de idempotencia con clave `runId`/`contextKey`** en esta ruta. La segunda copia se convertirá en un segundo mensaje de usuario con el mismo contenido.

## Ruta exacta del código

### 1. Productor: evento de finalización de exec del nodo

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emite `node.event` con el evento `exec.finished`.
  - La carga útil incluye `sessionKey` y el `runId` completo.

### 2. Ingesta de eventos en Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Gestiona `exec.finished`.
  - Construye el texto:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Lo pone en cola mediante:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Solicita inmediatamente una activación:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Debilidad de deduplicación de eventos del sistema

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` solo suprime **texto duplicado consecutivo**:
    - `if (entry.lastText === cleaned) return false`
  - Almacena `contextKey`, pero **no** usa `contextKey` para idempotencia.
  - Tras el drenaje, la supresión de duplicados se reinicia.

Esto significa que un `exec.finished` repetido con el mismo `runId` puede aceptarse de nuevo más tarde, aunque el código ya tenía un candidato estable de idempotencia (`exec:<runId>`).

### 4. La gestión de activación no es el duplicador principal

- `src/infra/heartbeat-wake.ts:79-117`
  - Las activaciones se fusionan por `(agentId, sessionKey)`.
  - Las solicitudes de activación duplicadas para el mismo destino se reducen a una única entrada de activación pendiente.

Esto hace que **la gestión duplicada de activaciones por sí sola** sea una explicación más débil que la ingesta duplicada de eventos.

### 5. Heartbeat consume el evento y lo convierte en entrada del prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - El preflight inspecciona los eventos del sistema pendientes y clasifica las ejecuciones de tipo exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` drena la cola para la sesión.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - El bloque drenado de eventos del sistema se antepone al cuerpo del prompt del agente.

### 6. Punto de inyección en la transcripción

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` envía el prompt completo a la sesión PI embebida.
  - Ese es el punto en el que el prompt derivado de la finalización se convierte en un turno de usuario conservado.

Por lo tanto, una vez que el mismo evento del sistema se vuelve a construir en el prompt dos veces, los mensajes duplicados de usuario en LCM son esperables.

## Por qué es menos probable un simple reintento de entrega saliente

Existe una ruta real de fallo saliente en el ejecutor de Heartbeat:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Primero se genera la respuesta.
  - La entrega saliente ocurre después mediante `deliverOutboundPayloads(...)`.
  - Un fallo ahí devuelve `{ status: "failed" }`.

Sin embargo, para la misma entrada de la cola de eventos del sistema, esto por sí solo **no basta** para explicar los turnos duplicados de usuario:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - La cola de eventos del sistema ya se drena antes de la entrega saliente.

Así que un reintento de envío por canal por sí solo no recrearía exactamente la misma entrada en cola. Podría explicar una entrega externa perdida/fallida, pero no por sí solo un segundo mensaje de usuario idéntico en la sesión.

## Posibilidad secundaria, de menor confianza

Existe un bucle de reintento de ejecución completa en el ejecutor del agente:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Algunos fallos transitorios pueden reintentar la ejecución completa y reenviar el mismo `commandBody`.

Eso puede duplicar un prompt de usuario conservado **dentro de la misma ejecución de respuesta** si el prompt ya se añadió antes de que se activara la condición de reintento.

Le doy menos peso que a la ingesta duplicada de `exec.finished` porque:

- el intervalo observado fue de unos 51 segundos, lo que parece más una segunda activación/turno que un reintento dentro del mismo proceso;
- el informe ya menciona fallos repetidos de envío de mensajes, lo que apunta más a un turno separado posterior que a un reintento inmediato del modelo/tiempo de ejecución.

## Hipótesis de causa raíz

Hipótesis de mayor confianza:

- La finalización de `keen-nexus` llegó a través de la **ruta de evento de exec del nodo**.
- El mismo `exec.finished` se entregó dos veces a `server-node-events`.
- Gateway aceptó ambas porque `enqueueSystemEvent(...)` no deduplica por `contextKey` / `runId`.
- Cada evento aceptado activó un Heartbeat y se inyectó como un turno de usuario en la transcripción PI.

## Propuesta de corrección quirúrgica pequeña

Si se quiere una corrección, el cambio de mayor valor y menor tamaño sería:

- hacer que la idempotencia de eventos del sistema/exec respete `contextKey` durante un breve horizonte, al menos para repeticiones exactas de `(sessionKey, contextKey, text)`;
- o agregar una deduplicación dedicada en `server-node-events` para `exec.finished` con clave `(sessionKey, runId, kind del evento)`.

Eso bloquearía directamente los duplicados repetidos de `exec.finished` antes de que se conviertan en turnos de sesión.

## Relacionado

- [Herramienta exec](/es/tools/exec)
- [Gestión de sesiones](/es/concepts/session)
