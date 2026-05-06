---
read_when:
    - Necesitas una guía paso a paso exacta del bucle del agente o de los eventos del ciclo de vida
    - Estás cambiando el encolamiento de sesiones, las escrituras de transcripciones o el comportamiento del bloqueo de escritura de sesión
summary: Ciclo de vida del bucle del agente, flujos y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-05-06T05:29:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un bucle agéntico es la ejecución completa "real" de un agente: admisión → ensamblaje de contexto → inferencia del modelo →
ejecución de herramientas → respuestas en streaming → persistencia. Es la ruta autoritativa que convierte un mensaje
en acciones y una respuesta final, mientras mantiene coherente el estado de la sesión.

En OpenClaw, un bucle es una ejecución única y serializada por sesión que emite eventos de ciclo de vida y de stream
mientras el modelo piensa, llama herramientas y transmite salida. Este documento explica cómo se conecta de extremo a extremo ese bucle auténtico.

## Puntos de entrada

- RPC del Gateway: `agent` y `agent.wait`.
- CLI: comando `agent`.

## Cómo funciona (alto nivel)

1. La RPC `agent` valida parámetros, resuelve la sesión (sessionKey/sessionId), persiste metadatos de sesión y devuelve `{ runId, acceptedAt }` de inmediato.
2. `agentCommand` ejecuta el agente:
   - resuelve el modelo + valores predeterminados de thinking/verbose/trace
   - carga una instantánea de Skills
   - llama a `runEmbeddedPiAgent` (runtime de pi-agent-core)
   - emite **fin/error de ciclo de vida** si el bucle embebido no emite uno
3. `runEmbeddedPiAgent`:
   - serializa ejecuciones mediante colas por sesión + globales
   - resuelve el modelo + perfil de autenticación y construye la sesión de pi
   - se suscribe a eventos de pi y transmite deltas de asistente/herramientas
   - aplica timeout -> aborta la ejecución si se supera
   - para turnos del servidor de aplicación de Codex, aborta un turno aceptado que deja de producir progreso del servidor de aplicación antes de un evento terminal
   - devuelve payloads + metadatos de uso
4. `subscribeEmbeddedPiSession` conecta eventos de pi-agent-core al stream `agent` de OpenClaw:
   - eventos de herramienta => `stream: "tool"`
   - deltas del asistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera **fin/error de ciclo de vida** para `runId`
   - devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Colas + concurrencia

- Las ejecuciones se serializan por clave de sesión (carril de sesión) y opcionalmente a través de un carril global.
- Esto evita carreras de herramientas/sesión y mantiene coherente el historial de la sesión.
- Los canales de mensajería pueden elegir modos de cola (collect/steer/followup) que alimentan este sistema de carriles.
  Consulta [Cola de comandos](/es/concepts/queue).
- Las escrituras de transcripción también están protegidas por un bloqueo de escritura de sesión sobre el archivo de sesión. El bloqueo es
  consciente del proceso y está basado en archivos, por lo que detecta escritores que omiten la cola en proceso o provienen de
  otro proceso. Los escritores de transcripción de sesión esperan hasta `session.writeLock.acquireTimeoutMs`
  antes de informar que la sesión está ocupada; el valor predeterminado es `60000` ms.
- Los bloqueos de escritura de sesión no son reentrantes de forma predeterminada. Si un helper anida intencionalmente la adquisición del
  mismo bloqueo mientras preserva un escritor lógico, debe habilitarlo explícitamente con
  `allowReentrant: true`.

## Preparación de sesión + espacio de trabajo

- El espacio de trabajo se resuelve y se crea; las ejecuciones en sandbox pueden redirigirse a una raíz de espacio de trabajo de sandbox.
- Skills se cargan (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de bootstrap/contexto se resuelven e inyectan en el informe del prompt del sistema.
- Se adquiere un bloqueo de escritura de sesión; `SessionManager` se abre y se prepara antes del streaming. Cualquier
  ruta posterior de reescritura, Compaction o truncamiento de transcripción debe tomar el mismo bloqueo antes de abrir o
  mutar el archivo de transcripción.

## Ensamblaje del prompt + prompt del sistema

- El prompt del sistema se construye a partir del prompt base de OpenClaw, el prompt de Skills, el contexto de bootstrap y las anulaciones por ejecución.
- Se aplican los límites específicos del modelo y los tokens de reserva de Compaction.
- Consulta [Prompt del sistema](/es/concepts/system-prompt) para ver lo que ve el modelo.

## Puntos de hook (donde puedes interceptar)

OpenClaw tiene dos sistemas de hooks:

- **Hooks internos** (hooks de Gateway): scripts dirigidos por eventos para comandos y eventos de ciclo de vida.
- **Hooks de Plugin**: puntos de extensión dentro del ciclo de vida del agente/herramienta y la canalización del gateway.

### Hooks internos (hooks de Gateway)

- **`agent:bootstrap`**: se ejecuta mientras se construyen archivos de bootstrap antes de finalizar el prompt del sistema.
  Úsalo para agregar/eliminar archivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` y otros eventos de comando (consulta el documento Hooks).

Consulta [Hooks](/es/automation/hooks) para configuración y ejemplos.

### Hooks de Plugin (ciclo de vida de agente + gateway)

Estos se ejecutan dentro del bucle del agente o la canalización del gateway:

- **`before_model_resolve`**: se ejecuta antes de la sesión (sin `messages`) para anular determinísticamente proveedor/modelo antes de la resolución del modelo.
- **`before_prompt_build`**: se ejecuta después de cargar la sesión (con `messages`) para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes del envío del prompt. Usa `prependContext` para texto dinámico por turno y los campos de contexto del sistema para orientación estable que debería estar en el espacio del prompt del sistema.
- **`before_agent_start`**: hook de compatibilidad heredado que puede ejecutarse en cualquiera de las fases; prefiere los hooks explícitos anteriores.
- **`before_agent_reply`**: se ejecuta después de las acciones inline y antes de la llamada al LLM, lo que permite que un Plugin reclame el turno y devuelva una respuesta sintética o silencie el turno por completo.
- **`agent_end`**: inspecciona la lista final de mensajes y los metadatos de ejecución después de completarse.
- **`before_compaction` / `after_compaction`**: observa o anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parámetros/resultados de herramientas.
- **`before_install`**: inspecciona hallazgos de escaneo integrados y opcionalmente bloquea instalaciones de Skill o Plugin.
- **`tool_result_persist`**: transforma sincrónicamente resultados de herramientas antes de que se escriban en una transcripción de sesión propiedad de OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensajes entrantes + salientes.
- **`session_start` / `session_end`**: límites del ciclo de vida de sesión.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida del gateway.

Reglas de decisión de hooks para protecciones salientes/de herramientas:

- `before_tool_call`: `{ block: true }` es terminal y detiene los handlers de menor prioridad.
- `before_tool_call`: `{ block: false }` es un no-op y no elimina un bloqueo previo.
- `before_install`: `{ block: true }` es terminal y detiene los handlers de menor prioridad.
- `before_install`: `{ block: false }` es un no-op y no elimina un bloqueo previo.
- `message_sending`: `{ cancel: true }` es terminal y detiene los handlers de menor prioridad.
- `message_sending`: `{ cancel: false }` es un no-op y no elimina una cancelación previa.

Consulta [Hooks de Plugin](/es/plugins/hooks) para la API de hooks y los detalles de registro.

Los harnesses pueden adaptar estos hooks de forma diferente. El harness del servidor de aplicación de Codex mantiene
los hooks de Plugin de OpenClaw como el contrato de compatibilidad para superficies reflejadas documentadas,
mientras que los hooks nativos de Codex siguen siendo un mecanismo separado de nivel inferior de Codex.

## Streaming + respuestas parciales

- Los deltas del asistente se transmiten desde pi-agent-core y se emiten como eventos `assistant`.
- El streaming por bloques puede emitir respuestas parciales en `text_end` o `message_end`.
- El streaming de razonamiento puede emitirse como un stream separado o como respuestas por bloques.
- Consulta [Streaming](/es/concepts/streaming) para el comportamiento de fragmentación y respuesta por bloques.

## Ejecución de herramientas + herramientas de mensajería

- Los eventos de inicio/actualización/fin de herramienta se emiten en el stream `tool`.
- Los resultados de herramientas se sanitizan por tamaño y payloads de imagen antes de registrarse/emitirse.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Modelado de respuestas + supresión

- Los payloads finales se ensamblan a partir de:
  - texto del asistente (y razonamiento opcional)
  - resúmenes de herramientas inline (cuando verbose + permitido)
  - texto de error del asistente cuando el modelo produce errores
- El token silencioso exacto `NO_REPLY` / `no_reply` se filtra de los
  payloads salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de payloads.
- Si no quedan payloads renderizables y una herramienta produjo un error, se emite una respuesta de error de herramienta de reserva
  (a menos que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario).

## Compaction + reintentos

- La Compaction automática emite eventos de stream `compaction` y puede activar un reintento.
- En el reintento, los buffers en memoria y los resúmenes de herramientas se restablecen para evitar salida duplicada.
- Consulta [Compaction](/es/concepts/compaction) para la canalización de Compaction.

## Streams de eventos (hoy)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (y como fallback por `agentCommand`)
- `assistant`: deltas transmitidos desde pi-agent-core
- `tool`: eventos de herramienta transmitidos desde pi-agent-core

## Manejo de canales de chat

- Los deltas del asistente se almacenan en buffer en mensajes de chat `delta`.
- Se emite un `final` de chat en **fin/error de ciclo de vida**.

## Timeouts

- Valor predeterminado de `agent.wait`: 30 s (solo la espera). El parámetro `timeoutMs` lo anula.
- Runtime del agente: `agents.defaults.timeoutSeconds` predeterminado de 172800 s (48 horas); aplicado en el temporizador de aborto de `runEmbeddedPiAgent`.
- Runtime de Cron: `timeoutSeconds` del turno de agente aislado pertenece a cron. El planificador inicia ese temporizador cuando comienza la ejecución, aborta la ejecución subyacente en la fecha límite configurada y luego ejecuta una limpieza acotada antes de registrar el timeout para que una sesión hija obsoleta no pueda dejar el carril atascado.
- Diagnósticos de actividad de sesión: con diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` clasifica sesiones `processing` largas que no tienen progreso observado de respuesta, herramienta, estado, bloque o ACP. Las ejecuciones embebidas activas, llamadas de modelo y llamadas de herramienta se informan como `session.long_running`; el trabajo activo sin progreso reciente se informa como `session.stalled`; `session.stuck` se reserva para bookkeeping de sesiones obsoletas sin trabajo activo. El bookkeeping de sesión obsoleta libera el carril de sesión afectado de inmediato; las ejecuciones embebidas detenidas solo se abortan y drenan después de `diagnostics.stuckSessionAbortMs` (valor predeterminado: al menos 10 minutos y 5x el umbral de advertencia) para que el trabajo en cola pueda reanudarse sin cortar ejecuciones meramente lentas. La recuperación emite resultados estructurados solicitados/completados, y el estado diagnóstico se marca inactivo solo si la misma generación de procesamiento sigue siendo la actual. Los diagnósticos `session.stuck` repetidos retroceden mientras la sesión permanece sin cambios.
- Timeout de inactividad del modelo: OpenClaw aborta una solicitud de modelo cuando no llegan chunks de respuesta antes de la ventana de inactividad. `models.providers.<id>.timeoutSeconds` extiende este watchdog de inactividad para proveedores locales/autohospedados lentos; de lo contrario OpenClaw usa `agents.defaults.timeoutSeconds` cuando está configurado, limitado a 120 s de forma predeterminada. Las ejecuciones activadas por Cron sin timeout explícito de modelo o agente deshabilitan el watchdog de inactividad y dependen del timeout externo de cron.
- Timeout de solicitud HTTP del proveedor: `models.providers.<id>.timeoutSeconds` se aplica a las recuperaciones HTTP de modelo de ese proveedor, incluyendo conexión, encabezados, cuerpo, timeout de solicitud del SDK, manejo de aborto total de guarded-fetch y watchdog de inactividad del stream del modelo. Úsalo para proveedores locales/autohospedados lentos como Ollama antes de aumentar el timeout de runtime completo del agente.

## Dónde las cosas pueden terminar antes

- Timeout del agente (aborto)
- AbortSignal (cancelación)
- Desconexión de Gateway o timeout de RPC
- Timeout de `agent.wait` (solo espera, no detiene el agente)

## Relacionado

- [Herramientas](/es/tools) — herramientas de agente disponibles
- [Hooks](/es/automation/hooks) — scripts dirigidos por eventos activados por eventos de ciclo de vida del agente
- [Compaction](/es/concepts/compaction) — cómo se resumen conversaciones largas
- [Aprobaciones de exec](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Thinking](/es/tools/thinking) — configuración de nivel de pensamiento/razonamiento
