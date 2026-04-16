---
x-i18n:
    generated_at: "2026-04-16T05:15:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95e56c5411204363676f002059c942201503e2359515d1a4b409882cc2e04920
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Investigación de finalización duplicada de ejecución asíncrona

## Alcance

- Sesión: `agent:main:telegram:group:-1003774691294:topic:1`
- Síntoma: la misma finalización de ejecución asíncrona para la sesión/ejecución `keen-nexus` se registró dos veces en LCM como turnos de usuario.
- Objetivo: identificar si lo más probable es que se trate de una inyección duplicada en la sesión o de un simple reintento de entrega saliente.

## Conclusión

Lo más probable es que esto sea una **inyección duplicada en la sesión**, no un simple reintento de entrega saliente.

La brecha más importante del lado del Gateway está en la **ruta de finalización de ejecución del Node**:

1. Una finalización de ejecución del lado del Node emite `exec.finished` con el `runId` completo.
2. El `server-node-events` del Gateway convierte eso en un evento del sistema y solicita un Heartbeat.
3. La ejecución del Heartbeat inyecta el bloque de eventos del sistema drenados en el prompt del agente.
4. El ejecutor embebido persiste ese prompt como un nuevo turno de usuario en la transcripción de la sesión.

Si el mismo `exec.finished` llega al Gateway dos veces para el mismo `runId` por cualquier motivo (repetición, reconexión duplicada, reenvío ascendente, productor duplicado), OpenClaw actualmente **no tiene una verificación de idempotencia con clave `runId`/`contextKey`** en esta ruta. La segunda copia se convertirá en un segundo mensaje de usuario con el mismo contenido.

## Ruta exacta del código

### 1. Productor: evento de finalización de ejecución del Node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emite `node.event` con el evento `exec.finished`.
  - La carga incluye `sessionKey` y el `runId` completo.

### 2. Ingesta de eventos en el Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Maneja `exec.finished`.
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

Esto significa que un `exec.finished` repetido con el mismo `runId` puede volver a aceptarse más tarde, aunque el código ya tenía un candidato estable para idempotencia (`exec:<runId>`).

### 4. El manejo de activaciones no es el duplicador principal

- `src/infra/heartbeat-wake.ts:79-117`
  - Las activaciones se consolidan por `(agentId, sessionKey)`.
  - Las solicitudes duplicadas de activación para el mismo objetivo colapsan en una sola entrada pendiente.

Esto hace que **el manejo de activaciones duplicadas por sí solo** sea una explicación más débil que la ingesta duplicada del evento.

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
  - Ese es el punto en el que el prompt derivado de la finalización pasa a convertirse en un turno de usuario persistido.

Así que, una vez que el mismo evento del sistema se reconstruye dos veces dentro del prompt, es esperable que aparezcan mensajes de usuario duplicados en LCM.

## Por qué es menos probable que sea un simple reintento de entrega saliente

Existe una ruta real de fallo saliente en el ejecutor de Heartbeat:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - La respuesta se genera primero.
  - La entrega saliente ocurre después mediante `deliverOutboundPayloads(...)`.
  - Un fallo ahí devuelve `{ status: "failed" }`.

Sin embargo, para la misma entrada de la cola de eventos del sistema, esto por sí solo **no es suficiente** para explicar los turnos de usuario duplicados:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - La cola de eventos del sistema ya se drenó antes de la entrega saliente.

Así que un reintento de envío del canal por sí solo no recrearía exactamente el mismo evento encolado. Podría explicar una entrega externa ausente o fallida, pero por sí solo no una segunda aparición del mismo mensaje de usuario en la sesión.

## Posibilidad secundaria, de menor confianza

Existe un bucle de reintento de ejecución completa en el ejecutor del agente:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Ciertos fallos transitorios pueden reintentar toda la ejecución y reenviar el mismo `commandBody`.

Eso puede duplicar un prompt de usuario persistido **dentro de la misma ejecución de respuesta** si el prompt ya se había anexado antes de que se activara la condición de reintento.

La clasifico por debajo de la ingesta duplicada de `exec.finished` porque:

- la brecha observada fue de unos 51 segundos, lo que parece más un segundo turno/activación que un reintento dentro del proceso;
- el informe ya menciona fallos repetidos de envío de mensajes, lo que apunta más a un turno separado posterior que a un reintento inmediato del modelo o del entorno de ejecución.

## Hipótesis de causa raíz

Hipótesis de mayor confianza:

- La finalización de `keen-nexus` llegó a través de la **ruta de eventos de ejecución del Node**.
- El mismo `exec.finished` se entregó dos veces a `server-node-events`.
- El Gateway aceptó ambas porque `enqueueSystemEvent(...)` no deduplica por `contextKey` / `runId`.
- Cada evento aceptado activó un Heartbeat y se inyectó como un turno de usuario en la transcripción de PI.

## Propuesta de corrección mínima y quirúrgica

Si se quiere una corrección, el cambio pequeño de mayor valor es:

- hacer que la idempotencia de eventos de ejecución/sistema respete `contextKey` durante un horizonte corto, al menos para repeticiones exactas de `(sessionKey, contextKey, text)`;
- o añadir una deduplicación específica en `server-node-events` para `exec.finished` con clave `(sessionKey, runId, event kind)`.

Eso bloquearía directamente las repeticiones de `exec.finished` antes de que se conviertan en turnos de sesión.
