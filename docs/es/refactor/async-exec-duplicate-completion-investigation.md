---
read_when:
    - Depuración de eventos repetidos de finalización de ejecución de Node
    - Trabajar en la deduplicación de Heartbeat/eventos del sistema
summary: Notas de investigación sobre la inyección duplicada de finalización de ejecución asíncrona
title: Investigación de finalización duplicada de Async Exec
x-i18n:
    generated_at: "2026-04-23T14:07:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Investigación de finalización duplicada de Async Exec

## Alcance

- Sesión: `agent:main:telegram:group:-1003774691294:topic:1`
- Síntoma: la misma finalización de ejecución asíncrona para la sesión/ejecución `keen-nexus` se registró dos veces en LCM como turnos de usuario.
- Objetivo: identificar si lo más probable es que se trate de una inyección duplicada en la sesión o de un simple reintento de entrega saliente.

## Conclusión

Lo más probable es que esto sea **inyección duplicada en la sesión**, no un mero reintento de entrega saliente.

La brecha más fuerte del lado del Gateway está en la **ruta de finalización de ejecución de Node**:

1. Una finalización de ejecución del lado de Node emite `exec.finished` con el `runId` completo.
2. El Gateway `server-node-events` lo convierte en un evento del sistema y solicita un Heartbeat.
3. La ejecución de Heartbeat inyecta el bloque drenado de eventos del sistema en el prompt del agente.
4. El runner integrado conserva ese prompt como un nuevo turno de usuario en la transcripción de la sesión.

Si el mismo `exec.finished` llega al Gateway dos veces para el mismo `runId` por cualquier motivo (repetición, duplicado por reconexión, reenvío upstream, productor duplicado), OpenClaw actualmente **no tiene una comprobación de idempotencia con clave `runId`/`contextKey`** en esta ruta. La segunda copia se convertirá en un segundo mensaje de usuario con el mismo contenido.

## Ruta exacta del código

### 1. Productor: evento de finalización de ejecución de Node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emite `node.event` con el evento `exec.finished`.
  - La carga útil incluye `sessionKey` y el `runId` completo.

### 2. Ingesta de eventos del Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Gestiona `exec.finished`.
  - Construye el texto:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Lo encola mediante:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Solicita inmediatamente una activación:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Debilidad en la deduplicación de eventos del sistema

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` solo suprime **texto duplicado consecutivo**:
    - `if (entry.lastText === cleaned) return false`
  - Almacena `contextKey`, pero **no** usa `contextKey` para la idempotencia.
  - Después del drenado, la supresión de duplicados se reinicia.

Esto significa que un `exec.finished` repetido con el mismo `runId` puede aceptarse de nuevo más tarde, aunque el código ya tenía un candidato estable para idempotencia (`exec:<runId>`).

### 4. La gestión de activaciones no es el duplicador principal

- `src/infra/heartbeat-wake.ts:79-117`
  - Las activaciones se agrupan por `(agentId, sessionKey)`.
  - Las solicitudes duplicadas de activación para el mismo destino colapsan en una sola entrada de activación pendiente.

Esto hace que **la gestión duplicada de activaciones por sí sola** sea una explicación más débil que la ingesta duplicada del evento.

### 5. Heartbeat consume el evento y lo convierte en entrada del prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - La fase previa revisa los eventos del sistema pendientes y clasifica las ejecuciones de tipo exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` drena la cola de la sesión.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - El bloque drenado de eventos del sistema se antepone al cuerpo del prompt del agente.

### 6. Punto de inyección en la transcripción

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` envía el prompt completo a la sesión integrada de Pi.
  - Ese es el punto en el que el prompt derivado de la finalización se convierte en un turno de usuario conservado.

Así que, una vez que el mismo evento del sistema se reconstruye en el prompt dos veces, se esperan mensajes duplicados de usuario en LCM.

## Por qué es menos probable un simple reintento de entrega saliente

Existe una ruta real de fallo saliente en el runner de Heartbeat:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Primero se genera la respuesta.
  - La entrega saliente ocurre después mediante `deliverOutboundPayloads(...)`.
  - Un fallo ahí devuelve `{ status: "failed" }`.

Sin embargo, para la misma entrada de la cola de eventos del sistema, esto por sí solo **no basta** para explicar los turnos duplicados de usuario:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - La cola de eventos del sistema ya se ha drenado antes de la entrega saliente.

Así que un reintento de envío del canal, por sí solo, no recrearía exactamente la misma entrada encolada. Puede explicar una entrega externa perdida/fallida, pero no por sí solo un segundo mensaje idéntico de usuario en la sesión.

## Posibilidad secundaria, con menor confianza

Existe un bucle completo de reintento de ejecución en el runner del agente:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Algunos fallos transitorios pueden reintentar toda la ejecución y reenviar el mismo `commandBody`.

Eso puede duplicar un prompt de usuario conservado **dentro de la misma ejecución de respuesta** si el prompt ya se había añadido antes de que se activara la condición de reintento.

Le doy menos peso que a la ingesta duplicada de `exec.finished` porque:

- la separación observada fue de unos 51 segundos, lo que parece más un segundo turno/activación que un reintento dentro del proceso;
- el informe ya menciona fallos repetidos de envío de mensajes, lo que apunta más a un turno posterior independiente que a un reintento inmediato de modelo/runtime.

## Hipótesis de causa raíz

Hipótesis de mayor confianza:

- La finalización de `keen-nexus` llegó por la **ruta de evento de ejecución de Node**.
- El mismo `exec.finished` se entregó dos veces a `server-node-events`.
- El Gateway aceptó ambos porque `enqueueSystemEvent(...)` no deduplica por `contextKey` / `runId`.
- Cada evento aceptado activó un Heartbeat y se inyectó como turno de usuario en la transcripción de Pi.

## Propuesta de corrección pequeña y quirúrgica

Si se quiere una corrección, el cambio pequeño de mayor valor es:

- hacer que la idempotencia de eventos del sistema/exec respete `contextKey` durante un horizonte corto, al menos para repeticiones exactas de `(sessionKey, contextKey, text)`;
- o añadir una deduplicación específica en `server-node-events` para `exec.finished` con clave `(sessionKey, runId, kind del evento)`.

Eso bloquearía directamente los duplicados repetidos de `exec.finished` antes de que se conviertan en turnos de sesión.
